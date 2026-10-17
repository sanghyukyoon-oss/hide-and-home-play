// Renderer, isometric orthographic camera with 360° orbit, picking, 2D FX overlay.
import * as THREE from 'three';
import { clamp, lerp, ease } from './util.js';
import { STYLE } from './gfx/kit.js';
import { ToonPost } from './gfx/toonpost.js';
import { ART, TUNE, applyArt, sortLayers } from './gfx/style.js';

const V = new THREE.Vector3(), V2 = new THREE.Vector3();
const SHADE_TINT = new THREE.Color('#c9c2ff');
const B_WINDOW = 280;   // ms: how long a tap waits for a second press (one-hand scheme B)
// a phone (touch, small screen): fewer supersampled pixels, a smaller shadow map, 30 fps while nothing is moving — it ran hot
// and an iPhone 13 dropped the page in stage 1 (user, 10/18). The look stays: same lines, same light, same palette.
export const PHONE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
export const QUALITY = [{ ss: 2, dpr: 2, shadow: 2048 }, { ss: 1.5, dpr: 2, shadow: 2048 }, { ss: 1, dpr: 2, shadow: 2048 }, { ss: 1, dpr: 1.5, shadow: 1024 }, { ss: 1, dpr: 1, shadow: 1024 }];
// can this browser draw the game at all? (three r170 needs WebGL2: roughly iOS 15+ / Android Chrome from ~2017)
export function hasWebGL2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

export class World {
  constructor(canvas, fxCanvas) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const toon = this.toon = STYLE.mode !== 'std';
    if (toon) r.toneMapping = THREE.NoToneMapping;
    else { r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08; }
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
    r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    // the camera sits 40 from its target: a tight near/far around the scene gives the outline pass ~4x finer depth
    // (it packs depth into 16 bits; with .1–200 a drawer front .004 in front of its frame flickered between sides)
    this.cam = new THREE.OrthographicCamera(-5, 5, 5, -5, 14, 66);
    this.hemi = toon ? new THREE.AmbientLight(ART.ambColor, ART.amb) : new THREE.HemisphereLight('#fff4fb', '#d9c6ff', 1.35); this.scene.add(this.hemi);
    const sun = this.sun = toon ? new THREE.DirectionalLight(ART.sunColor, ART.sun) : new THREE.DirectionalLight('#fff0dc', 1.9);
    if (toon) sun.shadow.intensity = ART.shadowStr;
    sun.castShadow = true; sun.shadow.mapSize.set(PHONE ? 1024 : 2048, PHONE ? 1024 : 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .025;
    const sc = sun.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 40;
    this.scene.add(sun); this.scene.add(sun.target);
    this.fill = new THREE.DirectionalLight('#cfe6ff', toon ? 0 : .45); this.fill.position.set(-6, 4, -3); this.scene.add(this.fill);
    // cartoon post: ink outlines by object ID, supersampled (see gfx/toonpost.js)
    if (toon) { this.post = new ToonPost(r, { budget: PHONE ? 2.6e6 : 4.5e6 }); applyArt(this.post); }
    this.maxSS = 2; this.frameN = 0; this.phone = PHONE; this.lastActive = performance.now();
    this.root = new THREE.Group(); this.scene.add(this.root);
    // camera rig
    this.yaw = Math.PI / 4; this.pitch = .62; this.zoom = 1; this.target = new THREE.Vector3(0, .6, 0);
    this.vYaw = 0; this.vPitch = 0; this.minPitch = .36; this.maxPitch = 1.15; this.minZoom = 1; this.maxZoom = 2.8;
    this.bounds = 2.6; this.home = new THREE.Vector3(0, .6, 0); this.fit = { w: 7.6, h: 6.5, cy: .46 };
    this.autoSpin = 0; this.camLock = false; this.shadowDirty = true;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(0); this.raycaster.layers.enable(1);   // meshes + pick proxies, never blob shadows
    this.snap = true; this.yawGoal = null;
    this.fx = new FX(fxCanvas);
    this.ptrs = new Map(); this.drag = null; this.onTap = null; this.onDragStart = null; this.inputEnabled = true;
    this.stick = { x: 0, y: 0 }; this.keys = new Set(); this.joyOn = false; this.scheme = 'E'; this.eMode = 'move'; this.eBase = 'move'; this.oneMode = 'turn';   // C: a switch picks what one finger does   // A: one finger turns · B: one finger moves, tap-and-drag turns/zooms
    this._bindInput();
    this._bindJoystick();
    this.resize();
    addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.W = w; this.H = h;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.lineScale = 1;   // ART.lineW is the user's chosen value (1.5 px); keep it exact
    if (this.post) { const db = this.renderer.getDrawingBufferSize(new THREE.Vector2()); this.post.setSize(db.x, db.y, { dpr: this.renderer.getPixelRatio(), lineCss: ART.lineW * this.lineScale, maxSS: this.maxSS }); }
    this.fx.resize(w, h);
    this.applyFrustum();
    this.shadowDirty = true;
  }
  setFit(w, h, cy = .46) { this.fit = { w, h, cy }; this.applyFrustum(); }
  applyFrustum() {
    const a = this.W / this.H, { w, h, cy } = this.fit;
    // fit width to ~94% of the screen, height to ~62% (portrait the width wins; landscape the height wins)
    const viewH = Math.max(w / .94 / a, h / .62);
    this.viewH = viewH;
    const cam = this.cam;
    cam.top = viewH * cy; cam.bottom = -viewH * (1 - cy);
    cam.left = -viewH * a / 2; cam.right = viewH * a / 2;
    cam.updateProjectionMatrix();
  }
  // ── camera
  // is there anywhere to move to? (zoomed in, or a map wider than the screen)
  canPan() { return this.bounds * (1 - 1 / this.zoom) + (this.slack?.x || 0) > .08; }
  // one-finger turn. The room follows the finger exactly; near each of the four diagonal views it sticks for a moment
  // (a magnetic detent, continuous so it never jumps) and nothing moves after the finger lifts.
  turnBy(dx, dy, axis) {
    const k = 3.6 / Math.max(this.W, 360);
    if (axis !== 'pitch') {
      this.rawYaw = (this.rawYaw ?? this.yaw) - dx * k;
      const nv = this.nearestView(this.rawYaw), d = this.rawYaw - nv, H = this.snap ? .22 : .08, B = this.snap ? .34 : .16, a = Math.abs(d);
      const y = a < H ? nv : a < B ? nv + Math.sign(d) * (a - H) * B / (B - H) : this.rawYaw;
      const dyaw = this.yaw - y; this.yaw = y; this.yawGoal = null; this.vYaw = 0;
      if (dyaw) this.onRotate?.(dyaw);
    }
    if (axis !== 'yaw') this.pitch = clamp(this.pitch + dy * k * .65, this.minPitch, this.maxPitch);
  }
  clearTap() { if (this._pendTap) { clearTimeout(this._pendTap.timer); this._pendTap = null; } this._ring(null); this.eMode = this.eBase; this._lastTap = null; }
  // a little ring under the finger while tap-and-drag turns (↻) or zooms (±), so the mode is never a surprise
  _ring(x, y, mode) {
    let r = this._ringEl;
    if (x == null) { if (r) r.style.display = 'none'; return; }
    if (!r) { r = this._ringEl = document.createElement('div'); r.className = 'gest-ring'; this.canvas.parentElement.append(r); }
    r.style.display = ''; r.style.left = x + 'px'; r.style.top = y + 'px'; r.textContent = mode === 'pitch' ? '↕' : '↻';
  }
  // turn and tilt together, keeping the pressed spot P under the finger's starting point (rotate around it)
  orbitAt(P, dx, dy) {
    if (!P) { this.turnBy(dx, dy); return; }
    this.updateCam(); const s0 = this.toScreen(P);
    this.turnBy(dx, dy); this.updateCam();
    const after = this.screenToGround(s0.x, s0.y, P.y);
    if (after) { this.target.x += P.x - after.x; this.target.z += P.z - after.z; this.clampTarget(); }
  }
  // plain turn without the detent (the bots use this)
  rotateBy(dx, dy) { const k = 3.6 / Math.max(this.W, 360); this.yaw -= dx * k; this.pitch = clamp(this.pitch + dy * k * .7, this.minPitch, this.maxPitch); this.rawYaw = this.yaw; return dx * k; }
  zoomAt(f, cx, cy) {
    this.updateCam();   // the anchor must be read with the camera as it is now (a pinch shifts the target between calls)
    const before = this.screenToGround(cx, cy, this.target.y);
    this.zoom = clamp(this.zoom * f, this.minZoom, this.maxZoom);
    this.updateCam();
    const after = this.screenToGround(cx, cy, this.target.y);
    if (before && after) { this.target.x += before.x - after.x; this.target.z += before.z - after.z; this.clampTarget(); }
  }
  panBy(dx, dy) {
    this.onPan?.(Math.hypot(dx, dy));
    const unitsPerPx = this.viewH / this.zoom / this.H;
    const right = V.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const fwd = V2.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.target.addScaledVector(right, -dx * unitsPerPx).addScaledVector(fwd, dy * unitsPerPx / Math.max(.4, Math.sin(this.pitch)));
    this.clampTarget();
  }
  clampTarget() {
    const b = this.bounds * Math.max(this.panFree ?? .45, 1 - 1 / this.zoom) + .01 + this.bounds * .35, sx = this.slack?.x || 0, sz = this.slack?.z || 0;
    this.target.x = clamp(this.target.x, this.home.x - b - sx, this.home.x + b + sx);
    this.target.z = clamp(this.target.z, this.home.z - b - sz, this.home.z + b + sz);
  }
  updateCam() {
    const d = 40, cp = Math.cos(this.pitch);
    this.cam.position.set(this.target.x + d * cp * Math.sin(this.yaw), this.target.y + d * Math.sin(this.pitch), this.target.z + d * cp * Math.cos(this.yaw));
    this.cam.lookAt(this.target);
    if (this.cam.zoom !== this.zoom) { this.cam.zoom = this.zoom; this.cam.updateProjectionMatrix(); }
    this.cam.updateMatrixWorld();
  }
  setQuality(maxSS) { if (this.maxSS === maxSS) return; this.maxSS = maxSS; this.resize(); }
  // quality ladder for slower phones: first the outline supersampling goes, then screen resolution, then shadow detail
  setLevel(n) {
    const L = QUALITY[n = clamp(n, 0, QUALITY.length - 1)];
    if (this.level === n) return; this.level = n;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, L.dpr));
    const sh = PHONE ? Math.min(1024, L.shadow) : L.shadow;
    if (this.sun.shadow.mapSize.x !== sh) { this.sun.shadow.mapSize.set(sh, sh); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    this.maxSS = L.ss; this.resize();
  }
  nearestView(y, bias = 0) { const k = Math.round((y - Math.PI / 4) / (Math.PI / 2) + bias); return Math.PI / 4 + k * Math.PI / 2; }
  turnView(dir) { this.yawGoal = this.nearestView(this.yawGoal ?? this.yaw) + dir * Math.PI / 2; this.vYaw = 0; }
  // cut: jump straight there (a film cut for a move too big to fly); otherwise a strong ease-out glide
  async flyTo(tw, { yaw = null, pitch = null, zoom = null, target = null, dur = .6, cut = false, e = ease.outQuint } = {}) {
    this.yawGoal = null;
    const y0 = this.yaw, p0 = this.pitch, z0 = this.zoom, t0 = this.target.clone();
    let y1 = yaw ?? y0; while (y1 - y0 > Math.PI) y1 -= Math.PI * 2; while (y1 - y0 < -Math.PI) y1 += Math.PI * 2;
    const p1 = pitch ?? p0, z1 = zoom ?? z0, t1 = target ? target.clone() : t0;
    this.vYaw = 0; this.flying = true;
    const set = k => { this.yaw = lerp(y0, y1, k); this.pitch = lerp(p0, p1, k); this.zoom = lerp(z0, z1, k); this.target.lerpVectors(t0, t1, k); };
    if (cut) set(1); else await tw.run(dur, set, e);
    this.flying = false;
  }
  update(dt) {
    // arrow / WASD keys move the view (PC), Q/E turn it
    const kx = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0);
    const ky = (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0);
    if (!this.camLock && (kx || ky)) { const sp = Math.min(this.W, this.H) * .95 * dt; this.panBy(-kx * sp, -ky * sp); }
    const kr = (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0);
    if (!this.camLock && kr) { if (!this._keyTurn) { this._keyTurn = true; this.rawYaw = this.yaw; } this.turnBy(kr * 1.8 * dt * Math.max(this.W, 360) / 3.6, 0, 'yaw'); }
    else this._keyTurn = false;
    // the joystick is a virtual pad: push it and the view moves that way at once, as fast as it is pushed
    const sx = this.stick.x, sy = this.stick.y;
    // the pad: how far it is pushed sets the speed (a gentle curve, so a small push is a fine adjustment), and the speed
    // catches up in ~0.1 s and drops in ~0.06 s — a soft start, a quick clean stop, no slide
    { const m = Math.min(1, Math.hypot(sx, sy)), want = m > 0 ? Math.pow(m, 1.5) : 0, dir = m > 0 ? [sx / m, sy / m] : this._padDir || [0, 0];
      if (m > 0) this._padDir = dir;
      const v = this._padV || 0, k = 1 - Math.exp(-dt / (want > v ? .1 : .06));
      this._padV = v + (want - v) * k; if (this._padV < .003 && !m) this._padV = 0;
      if (this.onPad) this.onPad(dir, this._padV, dt);   // a scene can drive something else with the pad (the boss stage's runner)
      else if (!this.camLock && this._padV) { const sp = Math.min(this.W, this.H) * .62 * this._padV * dt; this.panBy(-dir[0] * sp, -dir[1] * sp); } }
    if (this.zoomGauge) {
      const on = this.gaugeOn !== false && !this.joyHidden && !this.camLock;
      if (on !== this._zgShown) { this._zgShown = on; this.zoomGauge.classList.toggle('on', on); }
      if (on) { const k = Math.log(this.zoom / this.minZoom) / Math.log(this.maxZoom / this.minZoom), kk = clamp(isFinite(k) ? k : 0, 0, 1);
        if (Math.abs(kk - (this._zgK ?? -1)) > .002) { this._zgK = kk; this.zoomGauge.style.setProperty('--k', kk.toFixed(3)); } }
    }
    if (this.modeBadge) {
      const on = this.scheme === 'E' && !this.joyHidden && !this.camLock && !this.joyOn;
      if (on !== this._mbShown) { this._mbShown = on; this.modeBadge.classList.toggle('on', on); }
      const m = this.eMode === 'turn' ? 'turn' : 'move'; if (m !== this._mbMode) { this._mbMode = m; this.modeBadge.dataset.mode = m; }
    }
    if (this.modeSw) {
      const on = this.scheme === 'C' && !this.joyHidden && !this.camLock;
      if (on !== this._swShown) { this._swShown = on; this.modeSw.classList.toggle('on', on); }
      if (on && this._swMode !== this.oneMode) { this._swMode = this.oneMode; this.modeSw.dataset.mode = this.oneMode; }
    }
    if (this.joy) {
      const show = this.joyOn && !this.joyHidden && !this.camLock;   // a scene can hide it (the home screen)
      if (show !== this._joyShown) { this._joyShown = show; this.joy.classList.toggle('on', show); if (!show) this.releaseStick(); }
    }
    // double-tap zoom glides
    if (this.zoomGoal && !this.drag) {
      // an even zoom step (no ease-in/out): a fixed rate in log-zoom toward the goal
      const g = this.zoomGoal, lz = Math.log(g.z / this.zoom), st = Math.min(Math.abs(lz), dt * 4.5), f = Math.exp(Math.sign(lz) * st), fr = Math.abs(lz) > 1e-6 ? st / Math.abs(lz) : 1;
      if (g.x != null) this.zoomAt(f, g.x, g.y); else { this.zoom *= f; this.target.lerp(this.home, fr); this.clampTarget(); }
      if (Math.abs(Math.log(g.z / this.zoom)) < .005) { this.zoom = g.z; this.zoomGoal = null; }
    }
    if (!this.drag && !this.flying && this.yawGoal != null) {
      // released: glide into one of the four diagonal views
      this.yaw += (this.yawGoal - this.yaw) * (1 - Math.exp(-dt * 10));
      if (Math.abs(this.yawGoal - this.yaw) < .0015) { this.yaw = this.yawGoal; this.yawGoal = null; }
      this.vYaw = 0;
    }
    if (!this.drag && !this.flying) {
      this.yaw += this.vYaw * dt; this.vYaw *= Math.exp(-dt * 8);
      if (Math.abs(this.vYaw) < .01) this.vYaw = 0;
      this.yaw += this.autoSpin * dt;
    }
    this.updateCam();
    const s = this.sun;
    // studio light travels with the camera — but the shadow map is only redrawn when the light really moved
    // (it used to be redrawn every frame, a full extra scene pass even while nothing changed)
    if (this.toon) { const a = this.yaw + .55; s.position.set(this.home.x + Math.sin(a) * 7, 10, this.home.z + Math.cos(a) * 7); if (Math.abs(a - (this._shA ?? 1e9)) > .006 || this._shH !== this.home.x + ',' + this.home.z) { this._shA = a; this._shH = this.home.x + ',' + this.home.z; this.shadowDirty = true; } }
    else s.position.set(this.home.x + 4, 10, this.home.z + 6);
    s.target.position.copy(this.home); s.target.updateMatrixWorld();
  }
  render() {
    const ck = this.yaw.toFixed(4) + this.pitch.toFixed(4) + this.zoom.toFixed(4) + this.target.x.toFixed(3) + this.target.y.toFixed(3) + this.target.z.toFixed(3);
    if (ck !== this._ck) { this._ck = ck; this.lastActive = performance.now(); }   // the view is moving: full frame rate
    if (this.shadowDirty) { this.renderer.shadowMap.needsUpdate = true; this.shadowDirty = false; }
    if (this.post) {
      // outline groups + layers are refreshed every few frames (cheap: a few hundred nodes), or at once when asked
      if (this.idsDirty || this.frameN++ % 8 === 0) { sortLayers(this.scene); this.post.assignIds(this.scene); this.idsDirty = false; }
      this.post.render(this.scene, this.cam);
    } else this.renderer.render(this.scene, this.cam);
  }
  // a theme's light: { amb, ambColor, sun, sunColor } (anything left out uses the house style); null = house style
  setLight(l) {
    this._light = l;
    if (!this.toon) return;
    // shade colour: in the cel look the shaded side only gets this light, so a cool lavender here gives violet
    // shadows instead of grey ones (ART.shadeTint 0 = off; 세팅 slider)
    this.hemi.color.set(l?.ambColor || ART.ambColor).lerp(SHADE_TINT, (ART.shadeTint || 0) * .55); this.hemi.intensity = (l?.amb ?? ART.amb) * TUNE.bright * TUNE.ambMul;
    this.sun.color.set(l?.sunColor || ART.sunColor); this.sun.intensity = (l?.sun ?? ART.sun) * TUNE.bright * TUNE.sunMul;
  }
  // ── projection / picking
  toScreen(v) {
    V.copy(v).project(this.cam);
    return { x: (V.x + 1) / 2 * this.W, y: (1 - V.y) / 2 * this.H, z: V.z };
  }
  ndc(cx, cy) { return new THREE.Vector2(cx / this.W * 2 - 1, -(cy / this.H) * 2 + 1); }
  screenToGround(cx, cy, y = 0) {
    this.raycaster.setFromCamera(this.ndc(cx, cy), this.cam);
    const r = this.raycaster.ray;
    if (Math.abs(r.direction.y) < 1e-5) return null;
    const t = (y - r.origin.y) / r.direction.y;
    return r.origin.clone().addScaledVector(r.direction, t);
  }
  pick(cx, cy, roots) {
    this.raycaster.setFromCamera(this.ndc(cx, cy), this.cam);
    const hits = this.raycaster.intersectObjects(roots, true);
    return hits.filter(h => shown(h.object));
  }
  occluded(obj, worldPos, roots) { return !this.visibleAt(obj, worldPos, roots); }
  // a screen point where the object is the first thing seen, or null. Samples its centre (hollow things like a crown or
  // a donut have nothing there) plus points across its own bounding box. Off-screen points never count.
  visibleAt(obj, worldPos, roots) {
    let s = this._see(obj, worldPos, roots); if (s) return s;
    const b = new THREE.Box3(), p = new THREE.Vector3();
    obj.updateMatrixWorld(true);
    obj.traverse(o => { if (o.isMesh && !o.userData.proxy) { o.geometry.boundingBox || o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    if (b.isEmpty()) return null;
    const c = b.getCenter(new THREE.Vector3()), e = b.getSize(new THREE.Vector3()).multiplyScalar(.3);
    for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]]) {
      p.set(c.x + dx * e.x, c.y + dy * e.y, c.z + dz * e.z);
      if ((s = this._see(obj, p, roots))) return s;
    }
    return null;
  }
  _see(obj, worldPos, roots) {
    const s = this.toScreen(worldPos);
    if (!(s.x >= 0 && s.x <= this.W && s.y >= 0 && s.y <= this.H)) return null;
    for (const h of this.pick(s.x, s.y, roots)) {
      if (h.object.userData.proxy) continue;
      for (let o = h.object; o; o = o.parent) if (o === obj) return s;
      return null;
    }
    return null;
  }
  _occ1(obj, worldPos, roots) { return !this._see(obj, worldPos, roots); }
  // ── input: one finger turns (or tilts), two fingers move and zoom like a map, wheel zoom; tap = short + still
  // a virtual pad bottom-right that moves the view up / down / left / right (switch it off in the pause menu)
  _bindJoystick() {
    const app = this.canvas.parentElement;
    const joy = this.joy = document.createElement('div'); joy.className = 'joy';
    for (const d of ['u', 'd', 'l', 'r']) { const a = document.createElement('i'); a.className = 'ar ' + d; joy.append(a); }
    const knob = this.joyKnob = document.createElement('div'); knob.className = 'joy-knob'; joy.append(knob);
    app.append(joy);
    // zoom gauge (right edge): the knob height is the zoom; drag it or tap the track
    const zg = this.zoomGauge = document.createElement('div'); zg.className = 'zgauge';
    zg.innerHTML = '<b class="zp">+</b><div class="ztrack"><i class="zfill"></i><i class="zknob"></i></div><b class="zm">−</b>';
    const track = zg.querySelector('.ztrack');
    const setFromY = y => { const b = track.getBoundingClientRect(), k = clamp(1 - (y - b.top) / b.height, 0, 1);
      const z = this.minZoom * Math.pow(this.maxZoom / this.minZoom, k); this.zoomGoal = null; this.zoomAt(z / this.zoom, this.W / 2, this.H / 2); };
    let zid = null;
    zg.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); const t = e.target;
      if (t.classList.contains('zp')) { this.zoomAt(1.35, this.W / 2, this.H / 2); return; }
      if (t.classList.contains('zm')) { this.zoomAt(1 / 1.35, this.W / 2, this.H / 2); return; }
      zid = e.pointerId; try { zg.setPointerCapture(zid); } catch {} setFromY(e.clientY); });
    zg.addEventListener('pointermove', e => { e.stopPropagation(); if (e.pointerId !== zid) return; if (e.pointerType === 'mouse' && e.buttons === 0) { zid = null; return; } setFromY(e.clientY); });
    const zend = e => { e.stopPropagation(); if (e.pointerId === zid) zid = null; };
    zg.addEventListener('pointerup', zend); zg.addEventListener('pointercancel', zend); zg.addEventListener('lostpointercapture', zend);
    app.append(zg);
    // E: a small badge (where the pad would be) that shows what one finger is doing — move, or turn after a 2nd tap
    // tapping it picks what one finger does from now on (it stays until tapped again)
    const mb = this.modeBadge = document.createElement('div'); mb.className = 'modebadge'; mb.innerHTML = '<span class="mt">회전</span><span class="mm">이동</span>'; app.append(mb);
    mb.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      const m = e.target.closest('.mt') ? 'turn' : e.target.closest('.mm') ? 'move' : (this.eBase === 'turn' ? 'move' : 'turn');
      this.eBase = this.eMode = m; navigator.vibrate?.(10); this.onModeSwitch?.(m);
    });
    for (const ev of ['pointerup', 'pointermove']) mb.addEventListener(ev, e => e.stopPropagation());
    // C: a two-way switch (↻ turn | ✥ move) for what one finger does
    const sw = this.modeSw = document.createElement('div'); sw.className = 'modesw'; sw.dataset.mode = this.oneMode;
    sw.innerHTML = '<span class="m-turn">↻ 회전</span><span class="m-move">✥ 이동</span><i></i>';
    sw.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.oneMode = this.oneMode === 'turn' ? 'move' : 'turn'; this.onModeSwitch?.(this.oneMode); });
    for (const ev of ['pointerup', 'pointermove']) sw.addEventListener(ev, e => e.stopPropagation());
    app.append(sw);
    let id = null;
    const R = () => joy.clientWidth / 2 - 6;
    const move = e => {
      const b = joy.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const r = R(), d = Math.hypot(dx, dy);
      if (d > r) { dx *= r / d; dy *= r / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const dead = .12, mag = Math.min(1, d / r);
      const f = mag < dead ? 0 : (mag - dead) / (1 - dead) / Math.max(mag, 1e-6);
      this.stick.x = dx / r * f; this.stick.y = dy / r * f;
    };
    joy.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); id = e.pointerId; try { joy.setPointerCapture?.(id); } catch {} joy.classList.add('held'); move(e); });
    // a stick whose lift was lost (mouse released outside the frame) would push the view forever: let go of it
    const end = e => { if (e.pointerId !== id) return; e.stopPropagation?.(); id = null; this.releaseStick(); };
    joy.addEventListener('pointermove', e => { if (e.pointerId !== id) return; e.stopPropagation(); if (e.pointerType === 'mouse' && e.buttons === 0) return end(e); move(e); });
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end); joy.addEventListener('lostpointercapture', end);
    addEventListener('blur', () => { if (id != null) end({ pointerId: id }); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && id != null) end({ pointerId: id }); });
    this.releaseStick = () => { this.stick.x = this.stick.y = 0; knob.style.transform = ''; joy.classList.remove('held'); };
    addEventListener('keydown', e => { if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return; if (/^(Arrow|Key[WASDQE])/.test(e.code)) { this.keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); } });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
  _bindInput() {
    const el = this.canvas.parentElement;
    // A lift we never heard about leaves a finger "held" for good: every next touch then counts as the second finger and
    // a mouse pans on plain hover (user, 10/17: stuck multi-touch on Windows and on the phone). The page runs inside the
    // claude.ai frame, so a release outside it or a system gesture can swallow pointerup — check against the browser.
    const dropAll = (pred = () => true) => { for (const [id, p] of [...this.ptrs]) if (pred(p)) cancel({ pointerId: id }); };
    const poke = () => { this.lastActive = performance.now(); };
    el.addEventListener('pointerdown', poke, true); el.addEventListener('pointermove', poke, true); el.addEventListener('wheel', poke, true);
    el.addEventListener('pointerdown', e => {
      // a primary pointer means no other finger or button is down right now: anything still listed is a lost lift
      if (e.isPrimary && this.ptrs.size) dropAll();
      if (e.target !== this.canvas && e.target.id !== 'fx') return;
      if (!this.inputEnabled) return;
      try { el.setPointerCapture?.(e.pointerId); } catch {}
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), type: e.pointerType });
      if (this.ptrs.size === 1) {
        this.yawGoal = null; this.vPan = null; this.zoomGoal = null;
        this.drag = { moved: false, lastX: e.clientX, lastY: e.clientY, vx: 0, t: performance.now(), custom: null };
        const pt = this._pendTap;
        if (this.scheme === 'B' && pt && performance.now() - pt.upT < B_WINDOW && Math.hypot(e.clientX - pt.x, e.clientY - pt.y) < 60) {
          // B: tap, then press again and drag = turn (sideways) or zoom (up/down). The first tap waits for this moment
          // (unless it found something), so it is simply dropped if the second press becomes a drag
          clearTimeout(pt.timer); this._pendTap = null;
          this.drag.second = { tap: pt.instant ? null : pt, x0: e.clientX, y0: e.clientY };
        } else {
          if (pt) { clearTimeout(pt.timer); this._pendTap = null; if (!pt.instant) this.onTap?.(pt.x, pt.y); }   // a separate tap elsewhere: the waiting one happens now, never lost or late
          if (this.onDragStart) this.drag.custom = this.onDragStart(e.clientX, e.clientY);
        }
      } else if (this.ptrs.size === 2) {
        if (this.drag?.custom?.cancel) this.drag.custom.cancel();
        if (this.drag) { this.drag.moved = true; this.drag.custom = null; }
        const [a, b] = [...this.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        this.pinch = { d, mx, my, d0: d, tap: this.scheme === 'E' ? { id: e.pointerId, t: performance.now(), x: e.clientX, y: e.clientY } : null, zoomOn: this.scheme !== 'E', s2: { id: e.pointerId, x: e.clientX, y: e.clientY } };
      }
    });
    el.addEventListener('pointermove', e => {
      const p = this.ptrs.get(e.pointerId); if (!p) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { cancel(e); return; }   // the button came up outside the frame
      p.x = e.clientX; p.y = e.clientY;
      if (this.ptrs.size >= 2 && this.pinch) {
        // two fingers move the view like a map: the spot between them stays under them (drag = move, spread = zoom)
        const [a, b] = [...this.ptrs.values()], P = this.pinch;
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (this.scheme === 'E') {
          // E: two fingers only zoom (spread / pinch), and only once they really spread — a quick second-finger tap
          // must not nudge the zoom
          if (P.tap) { const q = this.ptrs.get(P.tap.id); if (q && Math.hypot(q.x - P.tap.x, q.y - P.tap.y) > 14) P.tap = null; }
          const q2 = this.ptrs.get(P.s2?.id), moved2 = q2 ? Math.hypot(q2.x - P.s2.x, q2.y - P.s2.y) : 99;
          if (!P.zoomOn && Math.abs(d - P.d0) > 16 && moved2 > 10) { P.zoomOn = true; P.tap = null; P.d = d; }
          if (P.zoomOn && !this.camLock) { this.zoomAt(d / P.d, mx, my); this.zoomGoal = null; }
        } else if (!this.camLock) { this.zoomAt(d / P.d, P.mx, P.my); this.panBy(mx - P.mx, my - P.my); this.zoomGoal = null; }
        Object.assign(P, { d, mx, my });
        return;
      }
      const dr = this.drag; if (!dr) return;
      const dx = e.clientX - dr.lastX, dy = e.clientY - dr.lastY;
      if (!dr.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 9) dr.moved = true;
      if (dr.moved) {
        if (dr.custom) dr.custom.move(e.clientX, e.clientY);
        // one finger turns the room (side to side) or tilts it (up and down), whichever the drag starts as;
        // with a mouse, right-drag or shift-drag moves the view
        else if (dr.second && !this.camLock) {
          const S2 = dr.second;
          if (!S2.mode) { const tx = e.clientX - S2.x0, ty = e.clientY - S2.y0; S2.mode = Math.abs(ty) > Math.abs(tx) * 1.2 ? 'pitch' : 'yaw'; this.rawYaw = this.yaw; }
          this.turnBy(dx, dy, S2.mode); dr.turned = true;
          this._ring(e.clientX, e.clientY, S2.mode);
        }
        else if (!this.camLock && (this.scheme === 'B' || (this.scheme === 'C' && this.oneMode === 'move')) && !(e.pointerType === 'mouse' && (e.buttons & 2))) this.panBy(dx, dy);
        else if (!this.camLock && (e.shiftKey || (e.pointerType === 'mouse' && (e.buttons & 2) && !(this.scheme === 'E' && (e.buttons & 1))))) { if (this.scheme === 'B') { if (!dr.axis) { dr.axis = 'yaw'; this.rawYaw = this.yaw; } this.turnBy(dx, dy, 'yaw'); } else this.panBy(dx, dy); }
        else if (!this.camLock && this.scheme === 'E') {
          // E: one finger moves the view; after a second-finger tap it turns round the middle of the screen; with the badge
          // on 회전 it turns round the spot under the finger
          if (this.eMode === 'turn') {
            if (dr.anchor === undefined) { this.rawYaw = this.yaw; const hit = this.pick(e.clientX, e.clientY, [this.root])[0]; dr.anchor = hit ? hit.point.clone() : null; }
            this.orbitAt(dr.anchor, dx, dy); dr.turned = true;
          } else this.panBy(dx, dy);
        }
        else if (!this.camLock && this.scheme === 'D') {
          if (!dr.anchor) { this.rawYaw = this.yaw; const hit = this.pick(p.x0, p.y0, [this.root])[0]; dr.anchor = hit ? hit.point.clone() : null; }   // empty space: turn around the middle of the view
          this.orbitAt(dr.anchor, dx, dy); dr.turned = true;
        }
        else if (!this.camLock) {
          if (!dr.axis) { const tx = e.clientX - p.x0, ty = e.clientY - p.y0; dr.axis = Math.abs(ty) > Math.abs(tx) * 1.3 ? 'pitch' : 'yaw'; this.rawYaw = this.yaw; }
          this.turnBy(dx, dy, dr.axis); dr.turned = true;
        }
      }
      dr.lastX = e.clientX; dr.lastY = e.clientY;
    });
    const up = e => {
      const p = this.ptrs.get(e.pointerId); if (!p) return;
      const P = this.pinch;
      // E: the second finger tapped (down and up quickly, barely moving, no spread): switch the held drag to turning
      if (this.scheme === 'E' && P?.tap && P.tap.id === e.pointerId && performance.now() - P.tap.t < 320 && this.ptrs.size === 2) {
        // a second-finger tap flips the mode only while the drag lasts; lifting goes back to the badge's mode
        // (user, 2026-10-17 evening: "톡 건들면 바뀌는데 떼면 다시 원래대로", the badge switch stays as it is)
        // a turn borrowed by the tap spins round the middle of the screen; a turn that is the badge's mode spins round
        // the spot under the finger (user, 10/17 night)
        this.eMode = this.eMode === 'turn' ? 'move' : 'turn'; navigator.vibrate?.(10); if (this.drag) this.drag.anchor = this.eMode === 'turn' && this.eBase === 'move' ? null : undefined; this.rawYaw = this.yaw; this.onModeSwitch?.(this.eMode);
      }
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size < 2) this.pinch = null;
      if (this.ptrs.size === 0) this.eMode = this.eBase;
      const dr = this.drag;
      // two fingers → one: carry on from where the remaining finger is now (not from before the pinch)
      if (this.ptrs.size === 1 && dr) { const q = [...this.ptrs.values()][0]; dr.lastX = q.x; dr.lastY = q.y; dr.t = performance.now(); dr.moved = true; dr.axis = null; q.x0 = q.x; q.y0 = q.y; }
      if (this.ptrs.size === 0 && dr) {
        const now = performance.now();
        this._ring(null);
        if (dr.second) {
          // second press: a drag already turned or zoomed; a still second press is just the first tap (once)
          if (!dr.moved && dr.second.tap) this.onTap?.(dr.second.tap.x, dr.second.tap.y);
        } else if (dr.moved) {
          if (dr.custom) dr.custom.end(e.clientX, e.clientY);
          // nothing coasts or glides after the fingers lift: the view stays exactly where it was left
        } else {
          dr.custom?.cancel?.();
          if (this.scheme === 'B') {
            // B: a tap that finds something happens at once; anything else (a drawer, a friend, empty floor) waits a
            // moment in case this is the start of tap-and-drag, so it never fires by accident
            const x = e.clientX, y = e.clientY, instant = !!this.tapInstant?.(x, y);
            const pt = this._pendTap = { x, y, upT: now, instant, timer: null };
            if (instant) this.onTap?.(x, y);
            else pt.timer = setTimeout(() => { if (this._pendTap === pt) { this._pendTap = null; this.onTap?.(x, y); } }, B_WINDOW);
            this.drag = null; return;
          }
          // a still press is a tap however slowly it is released; two quick taps in one place zoom there (or back out)
          const lt = this._lastTap;
          if (this.scheme !== 'E' && lt && now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 36 && !this.camLock && !this.tapInstant?.(e.clientX, e.clientY)) {
            this._lastTap = null;
            if (this.zoom > 1.6) { this.zoomGoal = { z: 1, x: null }; }
            else this.zoomGoal = { z: Math.min(this.maxZoom, 2.6), x: e.clientX, y: e.clientY };
          } else { this._lastTap = this.tapInstant?.(e.clientX, e.clientY) ? null : { t: now, x: e.clientX, y: e.clientY }; this.onTap?.(e.clientX, e.clientY); }
        }
        this.drag = null;
      }
    };
    // the system took the touch away (a call, a gesture, the finger slid off): never a tap, never a commit
    const cancel = e => {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size < 2) this.pinch = null;
      if (this.ptrs.size === 1 && this.drag) { const q = [...this.ptrs.values()][0]; Object.assign(this.drag, { lastX: q.x, lastY: q.y, t: performance.now(), vx: 0, pv: null, moved: true }); }
      if (this.ptrs.size === 0 && this.drag) { this.drag.custom?.cancel?.(); this.drag = null; this._ring(null); }
      if (this.ptrs.size === 0) { this.eMode = this.eBase; this._lastTap = null; }   // a cancelled touch never leaves a turn behind
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel);
    // capture lost without a lift (the up went elsewhere): let a real pointerup land first, then forget the pointer
    el.addEventListener('lostpointercapture', e => { const id = e.pointerId; setTimeout(() => { if (this.ptrs.has(id)) cancel({ pointerId: id }); }, 0); });
    // every finger is off the glass: touches still listed a moment later lost their pointerup
    for (const ev of ['touchend', 'touchcancel']) addEventListener(ev, e => {
      if (e.touches.length) return;
      const ids = [...this.ptrs].filter(([, p]) => p.type === 'touch').map(([id]) => id);
      if (ids.length) setTimeout(() => ids.forEach(id => { if (this.ptrs.has(id)) cancel({ pointerId: id }); }), 150);
    }, { passive: true });
    addEventListener('blur', () => dropAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) { dropAll(); this.keys.clear(); } });
    // a mouse plays like the phone (user, 10/18: "마우스로 할때는 왼쪽키 누른상태에서 오른쪽키하나 누르면 폰에서 하는것처럼"):
    // holding the left button, a click of the right one is the second-finger tap — the drag switches between moving and
    // turning; letting go of the left button goes back to the badge's mode
    el.addEventListener('mousedown', e => {
      if (this.scheme !== 'E' || e.button !== 2 || !(e.buttons & 1) || !this.drag || this.camLock || !this.inputEnabled) return;
      e.preventDefault();
      this.eMode = this.eMode === 'turn' ? 'move' : 'turn';
      this.drag.anchor = this.eMode === 'turn' && this.eBase === 'move' ? null : undefined; this.rawYaw = this.yaw;
      this.onModeSwitch?.(this.eMode);
    });
    el.addEventListener('contextmenu', e => { if (e.target === this.canvas || e.target.id === 'fx') e.preventDefault(); });
    el.addEventListener('wheel', e => { if (e.target !== this.canvas && e.target.id !== 'fx') return; e.preventDefault(); if (!this.camLock) this.zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, { passive: false });
  }
}

export function shown(o) {
  // proxies have an invisible material but count as shown; any hidden ancestor hides it
  for (let p = o; p; p = p.parent) if (p.visible === false) return false;
  return true;
}

// ── 2D overlay effects: sparkles, confetti, rings, star bursts
class FX {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.ps = []; this.rings = []; this.dpr = 1; this.dirty = false; }
  resize(w, h) { this.dpr = Math.min(devicePixelRatio || 1, 2); this.c.width = w * this.dpr; this.c.height = h * this.dpr; this.c.style.width = w + 'px'; this.c.style.height = h + 'px'; this.W = w; this.H = h; }
  burst(x, y, { n = 14, colors = ['#ffe14d', '#ff8fb8', '#8fd3ff', '#9be38f', '#ffffff'], speed = 260, size = 9, shape = 'star', life = .7, gravity = 380, up = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (.45 + Math.random() * .7);
      this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, g: gravity, life, t: 0, size: size * (.6 + Math.random() * .7), c: colors[i % colors.length], shape, rot: Math.random() * 6, vr: (Math.random() - .5) * 10 });
    }
  }
  confetti(n = 90) {
    const cols = ['#ff5d8a', '#ffd23f', '#59c3ff', '#7be04f', '#c9a7ff', '#ff9b52'];
    for (let i = 0; i < n; i++) this.ps.push({ x: Math.random() * this.W, y: -20 - Math.random() * this.H * .4, vx: (Math.random() - .5) * 120, vy: 120 + Math.random() * 160, g: 60, life: 3.2, t: 0, size: 7 + Math.random() * 6, c: cols[i % cols.length], shape: 'rect', rot: Math.random() * 6, vr: (Math.random() - .5) * 12, sway: Math.random() * 6 });
  }
  ring(x, y, { r = 60, color = '#ffffff', life = .45, width = 6 } = {}) { this.rings.push({ x, y, r, color, life, t: 0, width }); }
  update(dt) {
    const ctx = this.ctx;
    if (!this.ps.length && !this.rings.length) { if (this.dirty) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.c.width, this.c.height); this.dirty = false; } return; }
    this.dirty = true;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    this.ps = this.ps.filter(p => (p.t += dt) < p.life);
    for (const p of this.ps) {
      p.vy += p.g * dt; p.x += p.vx * dt + (p.sway ? Math.sin(p.t * 4 + p.sway) * 40 * dt : 0); p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.shape !== 'rect') { p.vx *= Math.exp(-dt * 2.2); }
      const k = 1 - p.t / p.life, a = Math.min(1, k * 2.2);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      const s = p.size * (p.shape === 'rect' ? 1 : .5 + k * .6);
      if (p.shape === 'star') { starPath(ctx, s); ctx.fill(); }
      else if (p.shape === 'heart') { heartPath(ctx, s); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.fillRect(-s / 2, -s / 4, s, s / 2); }
      else { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    this.rings = this.rings.filter(r => (r.t += dt) < r.life);
    for (const r of this.rings) {
      const k = r.t / r.life;
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.color; ctx.lineWidth = r.width * (1 - k * .6);
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (.3 + ease.outCubic(k) * .9), 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
function starPath(ctx, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
function heartPath(ctx, s) { ctx.beginPath(); ctx.moveTo(0, s * .35); ctx.bezierCurveTo(-s, -s * .3, -s * .45, -s, 0, -s * .45); ctx.bezierCurveTo(s * .45, -s, s, -s * .3, 0, s * .35); ctx.closePath(); }
