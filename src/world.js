// Renderer, isometric orthographic camera with 360° orbit, picking, 2D FX overlay.
import * as THREE from 'three';
import { clamp, lerp, ease } from './util.js';
import { STYLE, SHADOW } from './gfx/kit.js';
import { ToonPost } from './gfx/toonpost.js';
import { DirtyTracker } from './gfx/dirty.js';
import { ART, TUNE, applyArt, sortLayers } from './gfx/style.js';
import { FEEL, haptic } from './feel.js';

const V = new THREE.Vector3(), V2 = new THREE.Vector3();
const SHADE_TINT = new THREE.Color('#c9c2ff');
const TWIST = 1;          // F: which way a two-finger twist turns the room (checked so the room turns with the fingers)
const B_WINDOW = 280;   // ms: how long a tap waits for a second press (one-hand scheme B)
// a phone (touch, small screen): fewer supersampled pixels, a smaller shadow map, 30 fps while nothing is moving — it ran hot
// and an iPhone 13 dropped the page in stage 1 (user, 10/18). The look stays: same lines, same light, same palette.
export const PHONE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
export const QUALITY = [{ ss: 2, dpr: 2, shadow: 2048 }, { ss: 1.5, dpr: 2, shadow: 2048 }, { ss: 1, dpr: 2, shadow: 2048 }, { ss: 1, dpr: 1.5, shadow: 1024 }, { ss: 1, dpr: 1, shadow: 1024 }];
// can this browser draw the game at all? (three r170 needs WebGL2: roughly iOS 15+ / Android Chrome from ~2017)
// heat (2026-10-18): ?opt=0 turns every frame-cost saving off (the A/B baseline); ?dirty=0 / ?inval=0 / ?sort=0 /
// ?fpscap=0 / ?cdepth=1 one each. ?mask=1 tries the edge block mask (exact, but slower on the Mac GPU: off by default)
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const OPT_STORE = 'sbk-opt';   // the heat test build's on/off switch, kept per device (perfhud.js)
const OPT_ON = QS.has('opt') ? QS.get('opt') !== '0' : (() => { try { return localStorage.getItem(OPT_STORE) !== '0'; } catch { return true; } })();
export const OPT_IS_ON = OPT_ON;
export const OPT = { dirty: OPT_ON && QS.get('dirty') !== '0', mask: OPT_ON && QS.get('mask') === '1', inval: OPT_ON && QS.get('inval') !== '0', depth0: OPT_ON && QS.get('cdepth') !== '1', sort: OPT_ON && QS.get('sort') !== '0', fpsCap: OPT_ON && QS.get('fpscap') !== '0' };
// A see-through double-sided material makes three draw every mesh twice (back faces, then front) and flip .side with
// needsUpdate in between — a full shader re-check twice a frame for each (the window sunlight patches). A flat mesh has
// no back faces in front of its front faces, so one pass gives the same picture: switch it on when every mesh using
// the material is flat (and back off the moment a non-flat one uses it).
const _fa = new THREE.Vector3(), _fb = new THREE.Vector3(), _fc = new THREE.Vector3(), _fn = new THREE.Vector3();
function isFlat(g) {
  const p = g.attributes?.position; if (!p || p.count > 400) return false;
  const ud = g.userData; if (ud._flatV === p.version) return ud._flat;
  let flat = true, n = null, d = 0;
  for (let i = 0; i + 2 < p.count && !n; i++) {
    _fa.fromBufferAttribute(p, 0); _fb.fromBufferAttribute(p, i + 1); _fc.fromBufferAttribute(p, i + 2);
    _fn.subVectors(_fb, _fa).cross(_fc.sub(_fa)); if (_fn.lengthSq() > 1e-12) { n = _fn.normalize().clone(); d = n.dot(_fa); }
  }
  if (!n) flat = false;
  else for (let i = 0; i < p.count; i++) { _fa.fromBufferAttribute(p, i); if (Math.abs(n.dot(_fa) - d) > 1e-5) { flat = false; break; } }
  ud._flatV = p.version; ud._flat = flat; return flat;
}
function flatOnePass(scene) {
  const seen = new Map();
  scene.traverse(o => {
    const m = o.material; if (!o.isMesh || !m || Array.isArray(m) || !m.transparent || m.side !== THREE.DoubleSide) return;
    const f = isFlat(o.geometry); seen.set(m, (seen.get(m) ?? true) && f);
  });
  for (const [m, f] of seen) if (m.forceSinglePass !== f) { m.forceSinglePass = f; m.needsUpdate = true; }
}
export function hasWebGL2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

export class World {
  constructor(canvas, fxCanvas) {
    this.canvas = canvas;
    // memory (iPhone 13 mini reloaded the tab after ~3 stages, 10/18): in the cartoon look the canvas only receives the
    // post's full-screen quad, so a multisampled canvas (~40 MB on a phone) buys nothing — antialias is the post's job
    const toon = this.toon = STYLE.mode !== 'std';
    // the canvas itself only ever gets the post's full-screen quad (no depth test): no depth buffer for it either
    // a still view that redraws only a few boxes keeps the rest of the canvas as it was (preserveDrawingBuffer)
    const msaa = QS.get('msaa'), boxes = toon && OPT.dirty && (msaa != null ? +msaa === 0 : PHONE);
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !toon, alpha: true, depth: !(toon && OPT.depth0), preserveDrawingBuffer: boxes, powerPreference: 'high-performance' });
    // opaque things nearest first, so the GPU's depth test drops what is hidden before shading it (a pixel was shaded
    // 1.8–3x; front to back ~1.2–1.4x). Draw order among opaque, depth-tested things doesn't change the picture.
    if (OPT.sort) r.setOpaqueSort(window.__optSort = (a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.z - b.z || a.material.id - b.material.id || a.id - b.id);
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
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
    // phones: no MSAA on the supersampled colour target (4x half-float MSAA + its depth was ~125 MB of the ~250 MB the post
    // held on an iPhone; the 1.4x supersampling still smooths the edges). ?msaa=N overrides for A/B checks.
    if (toon) { this.post = new ToonPost(r, { budget: PHONE ? 2.6e6 : 4.5e6, samples: msaa != null ? +msaa : PHONE ? 0 : 4, opt: { mask: OPT.mask, inval: OPT.inval } }); applyArt(this.post); }
    // a still view redraws only what changed (needs a plain, non-multisampled colour target: phones, or ?msaa=0)
    if (this.post && boxes && this.post.color.samples === 0) {
      this.dirty = new DirtyTracker(); this.styleGrad = STYLE.grad; this._culled = [];
      // a box redraw only issues draw calls for meshes whose screen box meets the box (layers 0 = skipped by the camera,
      // children still drawn); everything is put back right after the post's scene passes
      this._cullM = [];
      this.post.cullFor = (b, on) => {
        const C = this._culled, M = this._cullM;
        for (let i = 0; i < C.length; i++) C[i].layers.mask = M[i];
        C.length = 0; M.length = 0;
        if (!on) return;
        let hide = b._hide;   // a box is culled twice (colour, IDs): work the list out once
        if (!hide) { hide = b._hide = []; for (const [o, e] of this.dirty.objs) { const q = e.r; if (!q || q[2] <= b[0] || q[0] >= b[2] || q[3] <= b[1] || q[1] >= b[3]) hide.push(o); } }
        for (const o of hide) { C.push(o); M.push(o.layers.mask); o.layers.mask = 0; }
      };
    }
    // a lost-and-restored GPU context (iOS drops it under memory pressure or in the background): three re-creates its
    // buffers, but they come back empty — the still-view boxes, the shadow map and the outline IDs all start over
    // (GPT review 10/18: the box path kept skipping and the restored screen stayed blank)
    canvas.addEventListener('webglcontextrestored', () => { this.dirty?.invalidate(); this.shadowDirty = true; this.idsDirty = true; this._sizeKey = null; });
    this.maxSS = 2; this.frameN = 0; this.phone = PHONE; this.lastActive = performance.now();
    this.perf = { frames: 0, area: 0, fulls: 0, parts: 0, skips: 0 };   // frames drawn and the share of the screen drawn again (1 = whole), for the HUD
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
    this.stick = { x: 0, y: 0 }; this.keys = new Set(); this.joyOn = false; this.scheme = 'F'; this.eMode = 'move'; this.eBase = 'move'; this.oneMode = 'turn';   // C: a switch picks what one finger does   // A: one finger turns · B: one finger moves, tap-and-drag turns/zooms
    this._bindInput();
    this._bindJoystick();
    this.resize();
    // a phone's toolbar slides in and out in a burst of resizes: settle first, then size the buffers once
    addEventListener('resize', () => { clearTimeout(this._rzT); if (PHONE) this._rzT = setTimeout(() => this.resize(), 220); else this.resize(); });
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    // the same size again (iOS fires resize on scroll / toolbar changes): don't re-create the post's buffers
    const key = w + 'x' + h + '@' + this.renderer.getPixelRatio() + '/' + this.maxSS;
    if (key === this._sizeKey) return; this._sizeKey = key;
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
      // 손맛 8: the room follows the finger exactly — no stop-then-jump near the four diagonal views (a notch is felt instead)
      const y = FEEL.cleanturn && !this.snap ? this.rawYaw : a < H ? nv : a < B ? nv + Math.sign(d) * (a - H) * B / (B - H) : this.rawYaw;
      const dyaw = this.yaw - y; this.yaw = y; this.yawGoal = null; this.vYaw = 0;
      if (dyaw) { this.onRotate?.(dyaw); this._notch(); this._rat(dyaw); }
    }
    if (axis !== 'yaw') { const p0 = this.pitch; this.pitch = clamp(this.pitch + dy * k * .65, this.minPitch, this.maxPitch); this._rat(this.pitch - p0); }
  }
  // turning (and tilting) clicks like a ratchet: a soft "드르륵" every few degrees, a very light buzz every third click
  // (user, 10/18: "회전할 때 … ㄷ드드드득 하는 기분 좋은 느낌의 asmr과 아주 약한 햅틱"); main.js plays it (world.ratchet)
  _rat(d) {
    if (!d || !this.ratchet) return;
    this._ratAcc = (this._ratAcc || 0) + Math.abs(d);
    if (this._ratAcc < .06) return;
    this._ratAcc %= .06;
    const now = performance.now(); if (now - (this._ratT || 0) < 38) return; this._ratT = now;
    this._ratN = ((this._ratN || 0) + 1) % 3; this.ratchet(this._ratN === 0);
  }
  // 손맛 8: passing one of the four diagonal views gives a small tick (feel the notch, nothing sticks)
  _notch() {
    if (!FEEL.cleanturn) return;
    const q = Math.floor((this.yaw - Math.PI / 4) / (Math.PI / 2));
    if (this._vq != null && q !== this._vq) { haptic(); const T = this.turnDial; if (T) { T.classList.remove('notch'); void T.offsetWidth; T.classList.add('notch'); } }
    this._vq = q;
  }
  // the dial's ruler shows one direction at a time — whichever the thumb is moving more — while the camera itself turns
  // and tilts freely, diagonals included (user, 10/18: "게이지 움직임만 대각선 금지고 카메라는 원래처럼 자유롭게"). The first
  // ~5 px decide; later the other direction takes over only once it clearly leads (1.8x over the last few moves).
  _domAxis(o, dx, dy) {
    o.tsx = (o.tsx || 0) * .8 + dx; o.tsy = (o.tsy || 0) * .8 + dy;
    const ax = Math.abs(o.tsx), ay = Math.abs(o.tsy);
    if (!o.tAxis) { if (Math.hypot(ax, ay) >= 5) o.tAxis = ax >= ay ? 'x' : 'y'; }
    else if (o.tAxis === 'x' && ay > ax * 1.8 && ay > 6) o.tAxis = 'y';
    else if (o.tAxis === 'y' && ax > ay * 1.8 && ax > 6) o.tAxis = 'x';
    return o.tAxis || 'wait';
  }
  // F, one finger: moves the view; after a second-finger tap it turns round the middle of the view exactly like the dial
  // (1:1, turn and tilt free), and the dial's ruler follows (one direction at a time)
  _fDrag(dr, dx, dy) {
    if (this.eMode !== 'turn') { this.panBy(dx, dy); return; }
    this._fTurn(dr, dx, dy);
  }
  _fTurn(dr, dx, dy) {
    if (!dr.ft) { dr.ft = {}; dr.piv = this._turnPivot(); }   // a new turn: its pivot is fixed for the whole of it
    const k = 3.6 / Math.max(this.W, 360);
    this.turnAround(dr.piv, -dx * k, dy * k * .65); dr.turned = true;
    this._tdAx = this._domAxis(dr.ft, dx, dy);
  }
  // R7 (level report): what a turn goes round — the middle of the part of the room that is on screen, so the room stays
  // in the picture after the view was moved off to one side (it used to be the view's centre). Screen points are put on
  // the floor plane and the ones inside the room's floor are averaged; nothing of the room on screen → null (view centre)
  _turnPivot() {
    // (10/19, user: "카메라는 화면 중앙에 있는 물건 중심으로 돌아야 할 것 같아. 맵 끝으로 가서 돌릴수록 미쳐버려") — the thing in the
    // middle of the screen (what a ray from the centre hits first), or the floor there; the R7 average of the visible floor
    // drifted far off to one side at a map's edge
    this.updateCam();
    const cx = this.W / 2, cy = this.H / 2, hit = this.pick(cx, cy, [this.root]).find(h => !h.object.userData.proxy);
    if (hit) return hit.point.clone();
    return this.screenToGround(cx, cy, this.target.y);
  }
  // the room's floor (meshes marked userData.floor), measured again for each turn — rooms change between scenes
  _floorBox() {
    const b = this._fb || (this._fb = new THREE.Box3()), m = new THREE.Box3(); b.makeEmpty();
    this.root.traverseVisible(o => { if (o.isMesh && o.userData.floor) { o.geometry.boundingBox || o.geometry.computeBoundingBox(); b.union(m.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
    return b.isEmpty() ? null : b;
  }
  // F: turn by exactly these angles round the spot P (null: round the middle of the view), P staying where it is on screen
  turnAround(P, dyaw, dpitch = 0) {
    this.updateCam(); const s0 = P && this.toScreen(P);
    this.yaw += dyaw; this.rawYaw = this.yaw; this.yawGoal = null; this.vYaw = 0;
    const p0 = this.pitch; this.pitch = clamp(this.pitch + dpitch, this.minPitch, this.maxPitch); this._rat(Math.abs(dyaw) + Math.abs(this.pitch - p0));
    // keep P where it is on screen — unless that would take the view past its bounds: then this step turns round the view's
    // centre and nothing is pushed back (it used to shift, get pushed back by clampTarget and swing the view about at a
    // map's edge: "미쳐버려"; measured 10/19 on 4판 — stopping the shift at the edge instead moved the view more)
    if (P) { this.updateCam(); const after = this.screenToGround(s0.x, s0.y, P.y);
      if (after) { const nx = this.target.x + P.x - after.x, nz = this.target.z + P.z - after.z, [x0, x1, z0, z1] = this._box();
        if (nx >= x0 && nx <= x1 && nz >= z0 && nz <= z1) { this.target.x = nx; this.target.z = nz; } } }
    if (dyaw) { this.onRotate?.(-dyaw); this._notch(); }
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
    if (before && after) {
      // keep the spot under the fingers still — but on a nearly flat view (eye level) the floor under a finger high on
      // the screen is far away, and that turned a small pinch into a jump of 6 m. Never move the view more than the
      // fingers' distance from the middle would on a plain screen (user, 10/18: "아이레벨이거나 탑 레벨일 때 이동, 줌 에러")
      let dx = before.x - after.x, dz = before.z - after.z;
      const per = this.viewH / this.zoom / Math.max(this.H, 1), off = Math.hypot(cx - this.W / 2, cy - this.H / 2);
      const cap = off * per * Math.abs(f - 1) * 1.6 + .02, d = Math.hypot(dx, dz);
      if (d > cap) { dx *= cap / d; dz *= cap / d; }
      this.target.x += dx; this.target.z += dz; this.clampTarget();
    }
  }
  panBy(dx, dy, hard = false) {
    this.onPan?.(Math.hypot(dx, dy));
    const unitsPerPx = this.viewH / this.zoom / this.H;
    if (!(unitsPerPx > 0 && isFinite(unitsPerPx))) return;
    const right = V.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const fwd = V2.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.target.addScaledVector(right, -dx * unitsPerPx).addScaledVector(fwd, dy * unitsPerPx / Math.max(.75, Math.sin(this.pitch)));   // (.4 made a low view run 2.5x — 10/18)
    this.clampTarget(hard);
  }
  // the box the view's centre may move in (around home; wider when zoomed in or on a wide map)
  _box() {
    // zoomed in, the view may go well past the walls: a clock high on the back wall sits 'behind' the floor's edge on
    // screen (user, 10/18: "맵 끝을 줌인해서 못 봄. 좀 여유 주라니까")
    const zin = Math.max(0, 1 - 1 / this.zoom);
    const b = this.bounds * Math.max(this.panFree ?? .45, zin) + .01 + this.bounds * .35 + zin * (this.bounds * .6 + 1.5), sx = this.slack?.x || 0, sz = this.slack?.z || 0;
    return [this.home.x - b - sx, this.home.x + b + sx, this.home.z - b - sz, this.home.z + b + sz];
  }
  // 손맛 4: a finger may pull the view past the edge; ~90 px of pull shows as ~30 px (rubber band), never more than ~60 px
  _rbL() { return 90 * this.viewH / this.zoom / Math.max(this.H, 1); }
  clampTarget(hard = false) {
    const [x0, x1, z0, z1] = this._box(), t = this.target;
    if (FEEL.rubber && !hard && (this.ptrs.size || this._rbOver)) {
      const o = this._rbL() * 4;
      t.x = clamp(t.x, x0 - o, x1 + o); t.z = clamp(t.z, z0 - o, z1 + o);
      if (t.x < x0 || t.x > x1 || t.z < z0 || t.z > z1) this._rbOver = true;
      return;
    }
    t.x = clamp(t.x, x0, x1); t.z = clamp(t.z, z0, z1);
  }
  // the centre as shown: past the edge (손맛 4) it only gives a little, harder the further it is pulled
  _shownTarget() {
    if (!this._rbOver) return this.target;
    const [x0, x1, z0, z1] = this._box(), L = this._rbL(), t = this.target, s = this._rbT || (this._rbT = new THREE.Vector3());
    const rub = o => L * (1 - 1 / (o * .55 / L + 1));
    s.copy(t);
    if (t.x < x0) s.x = x0 - rub(x0 - t.x); else if (t.x > x1) s.x = x1 + rub(t.x - x1);
    if (t.z < z0) s.z = z0 - rub(z0 - t.z); else if (t.z > z1) s.z = z1 + rub(t.z - z1);
    return s;
  }
  updateCam() {
    const d = 40, cp = Math.cos(this.pitch), T = this._shownTarget();
    this.cam.position.set(T.x + d * cp * Math.sin(this.yaw), T.y + d * Math.sin(this.pitch), T.z + d * cp * Math.cos(this.yaw));
    this.cam.lookAt(T);
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
    this._applyAO();
  }
  // AO (ART.ao) is on unless this phone gave it up: any step down the quality ladder, or _aoWatch below
  _applyAO() {
    const p = this.post; if (!p) return;
    p.aoOff = (this.level || 0) >= 1 || !!this.aoAuto;
    // AO goes (or comes back) over ~1.2 s instead of in one frame: switched off mid-turn on a slow phone, the soft shading
    // under every piece vanished at once and read as the shadows jumping (user 10/19: "가끔 그림자가 튀는데")
    this._aoGoal = p.aoOff ? 0 : ART.ao;
  }
  _aoFade(dt) {
    const p = this.post, g = this._aoGoal; if (!p || g == null) return;
    const v = p.u.aoStr.value; if (v === g) { this._aoGoal = null; return; }
    const step = Math.max(.001, ART.ao) / 1.2 * Math.min(dt, .1);
    p.u.aoStr.value = Math.abs(g - v) <= step ? g : v + Math.sign(g - v) * step;
    this.dirty?.invalidate?.();
  }
  // while the view moves, frames should come at ≥ 36 fps; if over 3 s of moving time (added up across drags) they
  // don't, AO goes off for the rest of this run — the first and cheapest thing to give up (세팅's AO turns it back on)
  _aoWatch(now) {
    const p = this.post;
    if (!p || this.aoAuto || p.u.aoStr.value <= .001) { this._aw = null; return; }
    const a = this._aw || (this._aw = { t: 0, n: 0, last: now });
    const dt = now - a.last; a.last = now;
    // moving = the view changed since the previous drawn frame (render stamps lastActive then); a gap over 1.5 s is a
    // pause or a tab switch, not a slow frame
    if (dt <= 0 || dt > 1500 || now - this.lastActive > dt + 50) return;
    a.t += dt; a.n++;
    if (a.t >= 3000) { const fps = a.n * 1000 / a.t; a.t = 0; a.n = 0; if (fps < 36) { this.aoAuto = true; this._applyAO(); } }
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
    this._aoFade(dt);
    // 손맛 6: a finger resting on the glass keeps the full frame rate, so the first frame of the next drag is not late
    if (FEEL.hold && this.ptrs.size) this.lastActive = performance.now();
    // 손맛 4: let go past the edge → back inside in ~0.2 s
    if (this._rbOver && !this.ptrs.size) {
      const [x0, x1, z0, z1] = this._box(), t = this.target, cx = clamp(t.x, x0, x1), cz = clamp(t.z, z0, z1), k = 1 - Math.exp(-dt / .06);
      t.x += (cx - t.x) * k; t.z += (cz - t.z) * k;
      if (Math.abs(cx - t.x) + Math.abs(cz - t.z) < 1e-3) { t.x = cx; t.z = cz; this._rbOver = false; }
    }
    // arrow / WASD keys move the view (PC), Q/E turn it
    const kx = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0);
    const ky = (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0);
    if (!this.camLock && (kx || ky)) { const sp = Math.min(this.W, this.H) * .95 * dt; this.panBy(-kx * sp, -ky * sp, true); }
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
      else if (!this.camLock && this._padV) { const sp = Math.min(this.W, this.H) * .62 * this._padV * dt; this.panBy(-dir[0] * sp, -dir[1] * sp, true); } }
    if (this.zoomGauge) {
      const on = this.gaugeOn !== false && !this.joyHidden && !this.camLock;
      if (on !== this._zgShown) { this._zgShown = on; this.zoomGauge.classList.toggle('on', on); }
      if (on) { const k = Math.log(this.zoom / this.minZoom) / Math.log(this.maxZoom / this.minZoom), kk = clamp(isFinite(k) ? k : 0, 0, 1);
        if (Math.abs(kk - (this._zgK ?? -1)) > .002) { this._zgK = kk; this.zoomGauge.style.setProperty('--k', kk.toFixed(3)); } }
    }
    if (this.turnDial) {
      const on = this.scheme === 'F' && !this.joyHidden && !this.camLock;
      if (on !== this._tdShown) { this._tdShown = on; this.turnDial.classList.toggle('on', on); }
      // a finger turning after the second-finger tap: the dial looks held and its arrows say which way
      const ft = on && this.eMode === 'turn' && this.ptrs.size > 0 && !this._tdHeld;
      if (ft !== this._tdFt) { this._tdFt = ft; this.turnDial.classList.toggle('fturn', ft); if (!ft && !this._tdHeld) delete this.turnDial.dataset.ax; }
      if (ft && (this._tdAx === 'x' || this._tdAx === 'y') && this.turnDial.dataset.ax !== this._tdAx) this.turnDial.dataset.ax = this._tdAx;
      // until the player has tilted with the dial once, its idle arrows take turns (‹ › then ˄ ˅): it does both
      // (user, 10/18: "회전은 수직 움직임도 가능하다는 걸 설명 해줘야할 듯"); remembered on this device
      if (this._tdTeach === undefined) { try { this._tdTeach = localStorage.getItem('sbk-dial-tilt') !== '1'; } catch { this._tdTeach = true; } this.turnDial.classList.toggle('teach', this._tdTeach); }
      // the ruler moves under the thumb at the thumb's own speed: sideways as the room turns (ticks every 15°, pink ones =
      // the four diagonal views; a pink tick between the pointers = a diagonal view), its dashes up / down as it tilts
      if (on) { const ppr = Math.max(this.W, 360) / 3.6, T = this.turnDial;
        if (!this._tdHeld && !this.ptrs.size) this._tdAx = null;
        const ax = this._tdAx, c = 1 - Math.exp(-dt / .05);
        this._tdY ??= this.yaw; this._tdP ??= this.pitch;
        if (ax === 'x') this._tdY = this.yaw; else if (ax == null) this._tdY += (this.yaw - this._tdY) * c;
        if (ax === 'y') this._tdP = this.pitch; else if (ax == null) this._tdP += (this.pitch - this._tdP) * c;
        const off = (-(this._tdY - Math.PI / 4) * ppr % (ppr * Math.PI / 2)).toFixed(1), ky = (this._tdP * ppr / .65 % 9).toFixed(1);
        if (ppr !== this._tdPpr) { this._tdPpr = ppr; T.style.setProperty('--mi', (ppr * Math.PI / 12).toFixed(2) + 'px'); T.style.setProperty('--ma', (ppr * Math.PI / 2).toFixed(2) + 'px'); }
        if (off !== this._tdOff) { this._tdOff = off; T.style.setProperty('--off', off + 'px'); }
        if (ky !== this._tdKy) { this._tdKy = ky; T.style.setProperty('--ky', ky + 'px'); } }
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
    if (this.zoomGoal && !this.drag?.moved) {
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
    if (this.toon) { const a = this.yaw + (this.sunA ?? .55), sr = this.sunR ?? 7; s.position.set(this.home.x + Math.sin(a) * sr, this.sunH ?? 10, this.home.z + Math.cos(a) * sr); if (Math.abs(a - (this._shA ?? 1e9)) > .006 || this._shH !== this.home.x + ',' + this.home.z) { this._shA = a; this._shH = this.home.x + ',' + this.home.z; this.shadowDirty = true; } }
    else s.position.set(this.home.x + 4, 10, this.home.z + 6);
    s.target.position.copy(this.home); s.target.updateMatrixWorld();
  }
  render() {
    const unsquish = this._squish();
    try { this._render(); } finally { unsquish?.(); }
  }
  // ── 손맛 7: what the finger presses dips a little and pops back on release. Only the drawing sees it — the object's
  // own scale is put back right after each frame, so no animation or tap code ever reads a squashed value
  _pressStart(x, y) {
    clearTimeout(this._pressT);
    if (!FEEL.press || !this.onPress) return;
    // a short wait first: a drag that starts at once (a pan) never shows a dip
    this._pressT = setTimeout(() => {
      const dr = this.drag;
      if (!FEEL.press || !dr || dr.moved || this.ptrs.size !== 1 || !this.onPress) return;
      const hit = this.onPress(x, y); if (!hit?.obj) return;
      this._press = { obj: hit.obj, m: hit.m || .06, t0: performance.now(), on: true };
      this.lastActive = performance.now();
    }, 40);
  }
  // bounce: a tap (pops back past its size and settles); otherwise it just eases back
  _pressEnd(bounce = false) {
    clearTimeout(this._pressT);
    const P = this._press; if (!P || !P.on) return;
    const now = performance.now(); P.a0 = this._pressA(P, now); P.on = false; P.t1 = now; P.bounce = bounce;
  }
  _pressA(P, now) {
    if (P.on) { const k = Math.min(1, (now - P.t0) / 70); return 1 - (1 - k) * (1 - k); }
    const t = (now - P.t1) / (P.bounce ? 240 : 90);
    if (t >= 1) return null;
    return P.bounce ? P.a0 * Math.cos(t * Math.PI * 1.5) * (1 - t) : P.a0 * (1 - t);
  }
  _squish() {
    const P = this._press; if (!P) return null;
    const a = this._pressA(P, performance.now()), o = P.obj;
    if (a == null || !o.parent) { this._press = null; return null; }
    const s = o.scale, sx = s.x, sy = s.y, sz = s.z, m = P.m * a;
    s.set(sx * (1 + m * .55), sy * (1 - m), sz * (1 + m * .55)); o.updateMatrixWorld(true);
    this.lastActive = performance.now();
    return () => { s.set(sx, sy, sz); o.updateMatrixWorld(true); };
  }
  _render() {
    this._aoWatch(performance.now());
    const ck = this.yaw.toFixed(4) + this.pitch.toFixed(4) + this.zoom.toFixed(4) + this.target.x.toFixed(3) + this.target.y.toFixed(3) + this.target.z.toFixed(3);
    if (ck !== this._ck) { this._ck = ck; this.lastActive = performance.now(); }   // the view is moving: full frame rate
    if (SHADOW.moved) { SHADOW.moved = false; this.shadowDirty = true; }   // a part moved: its shadow follows (only while it moves)
    if (this.shadowDirty) { this.renderer.shadowMap.needsUpdate = true; this.shadowDirty = false; }
    if (this.post) {
      // outline groups + layers are refreshed every few frames (cheap: a few hundred nodes), or at once when asked
      if (this.idsDirty || this.frameN++ % 8 === 0) { sortLayers(this.scene); this.post.assignIds(this.scene); flatOnePass(this.scene); this.idsDirty = false; }
      // world matrices once per frame: three would redo the whole scene's for every pass (colour, IDs, each box)
      const sc = this.scene; sc.updateMatrixWorld(); sc.matrixWorldAutoUpdate = false;
      try { this._renderPost(); } finally { sc.matrixWorldAutoUpdate = true; }
    } else this.renderer.render(this.scene, this.cam);
  }
  _renderPost() {
    {
      const plan = this.dirty?.plan(this, this.post);
      this.perf.frames++; this.perf.area += plan?.skip ? 0 : plan?.rects ? plan.area : 1;
      if (plan?.skip) this.perf.skips++; else if (plan?.rects) this.perf.parts++; else this.perf.fulls++;
      if (plan?.skip) return;   // nothing on screen changed: the canvas keeps the last frame, the GPU rests
      this.post.render(this.scene, this.cam, plan?.rects || null);
    }
  }
  // a theme's light: { amb, ambColor, sun, sunColor } (anything left out uses the house style); null = house style
  setLight(l) {
    this._light = l;
    if (!this.toon) return;
    // shade colour: in the cel look the shaded side only gets this light, so a cool lavender here gives violet
    // shadows instead of grey ones (ART.shadeTint 0 = off; 세팅 slider)
    this.hemi.color.set(l?.ambColor || ART.ambColor).lerp(SHADE_TINT, (ART.shadeTint || 0) * .55); this.hemi.intensity = (l?.amb ?? ART.amb) * TUNE.bright * TUNE.ambMul;
    this.sun.color.set(l?.sunColor || ART.sunColor); this.sun.intensity = (l?.sun ?? ART.sun) * TUNE.bright * TUNE.sunMul;
    // 룩 실험 (look.js): a theme can also set the sun's height / reach / turn from the camera and the shadow strength —
    // a low late-afternoon sun throws long shadows; left out = the house studio light (10 high, 7 out, .55 turned)
    this.sunH = l?.sunH ?? 10; this.sunR = l?.sunR ?? 7; this.sunA = l?.sunA ?? .55;
    if (this.toon) this.sun.shadow.intensity = l?.shadow ?? ART.shadowStr;
    this._shA = null;   // the shadow map is redrawn for the new sun
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
    zg.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); const t = e.target; if (this.drag) this.drag.moved = true;   // (a finger resting on the room isn't a tap when it lifts — QA N2)
      if (t.classList.contains('zp')) { this.zoomAt(1.35, this.W / 2, this.H / 2); return; }
      if (t.classList.contains('zm')) { this.zoomAt(1 / 1.35, this.W / 2, this.H / 2); return; }
      zid = e.pointerId; try { zg.setPointerCapture(zid); } catch {} setFromY(e.clientY); });
    zg.addEventListener('pointermove', e => { e.stopPropagation(); if (e.pointerId !== zid) return; if (e.pointerType === 'mouse' && e.buttons === 0) { zid = null; return; } setFromY(e.clientY); });
    const zend = e => { e.stopPropagation(); if (e.pointerId === zid) zid = null; };
    zg.addEventListener('pointerup', zend); zg.addEventListener('pointercancel', zend); zg.addEventListener('lostpointercapture', zend);
    app.append(zg);
    // E: a small badge (where the pad would be) that shows what one finger is doing — move, or turn after a 2nd tap
    // tapping it picks what one finger does from now on (it stays until tapped again)
    // F: the turn dial (돌림판) — slide it sideways and the room turns exactly as far as the thumb went, like spinning a
    // turntable; slide it up / down to tilt. One hand, no mode, nothing moves after the thumb lifts.
    const td = this.turnDial = document.createElement('div'); td.className = 'turndial';
    td.innerHTML = '<i class="td-glass"><i class="td-band"><i class="td-mi"></i><i class="td-ma"></i></i><i class="td-shade"></i><i class="td-gloss"></i></i>' + ['l', 'r', 'lu', 'ld', 'ru', 'rd'].map(c => `<i class="td-ar td-${c}"></i>`).join('');
    app.append(td);
    { let tid = null, lx = 0, ly = 0; const o = {};
      td.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (this.drag) this.drag.moved = true; if (this.camLock) return; tid = e.pointerId; lx = e.clientX; ly = e.clientY; for (const k in o) delete o[k]; o.piv = this._turnPivot(); this._tdHeld = true; this._tdAx = 'wait'; try { td.setPointerCapture(tid); } catch {} td.classList.add('held'); this.lastActive = performance.now(); });
      td.addEventListener('pointermove', e => {
        e.stopPropagation(); if (e.pointerId !== tid) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { tid = null; td.classList.remove('held'); delete td.dataset.ax; this._tdHeld = false; this._tdAx = null; return; }
        const k = 3.6 / Math.max(this.W, 360), dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        if (!this.camLock) this.turnAround(o.piv, -dx * k, dy * k * .65);
        this._tdAx = this._domAxis(o, dx, dy); if (this._tdAx !== 'wait' && td.dataset.ax !== this._tdAx) td.dataset.ax = this._tdAx;
        if (this._tdTeach && this._tdAx === 'y' && (o.ty = (o.ty || 0) + Math.abs(dy)) > 24) {   // a real tilt with the dial: learned
          this._tdTeach = false; td.classList.remove('teach'); try { localStorage.setItem('sbk-dial-tilt', '1'); } catch {}
        }
      });
      const tend = e => { e.stopPropagation(); if (e.pointerId === tid) { tid = null; td.classList.remove('held'); delete td.dataset.ax; this._tdHeld = false; this._tdAx = null; } };
      td.addEventListener('pointerup', tend); td.addEventListener('pointercancel', tend); td.addEventListener('lostpointercapture', tend); }
    const mb = this.modeBadge = document.createElement('div'); mb.className = 'modebadge'; mb.innerHTML = '<span class="mt">회전</span><span class="mm">이동</span>'; app.append(mb);
    mb.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      const m = e.target.closest('.mt') ? 'turn' : e.target.closest('.mm') ? 'move' : (this.eBase === 'turn' ? 'move' : 'turn');
      this.eBase = this.eMode = m; if (FEEL.haptic) haptic(); else navigator.vibrate?.(10); this.onModeSwitch?.(m);
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
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), type: e.pointerType, btn: e.button });
      if (this.ptrs.size === 1) {
        // (a double-tap zoom keeps gliding under a still press — a quick third tap used to freeze it half way, QA3 10/19;
        // it stops once this finger drags, or a second one lands)
        this.yawGoal = null; this.vPan = null;
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
        if (!this.drag.custom && !this.camLock) this._pressStart(e.clientX, e.clientY);
      } else if (this.ptrs.size === 2) {
        this._pressEnd(); this.zoomGoal = null;
        if (this.drag?.custom?.cancel) this.drag.custom.cancel();
        if (this.drag) { this.drag.moved = true; this.drag.custom = null; }
        const [a, b] = [...this.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        this.pinch = { d, mx, my, d0: d, mx0: mx, my0: my, tap: this.scheme === 'E' || this.scheme === 'F' ? { id: e.pointerId, t: performance.now(), x: e.clientX, y: e.clientY } : null, zoomOn: this.scheme !== 'E', s2: { id: e.pointerId, x: e.clientX, y: e.clientY } };
        if (this.scheme === 'F') { this.pinch.ang0 = Math.atan2(b.y - a.y, b.x - a.x); const f1 = [...this.ptrs.entries()].find(([id]) => id !== e.pointerId); if (f1) { this.pinch.f1 = f1[0]; this.pinch.f1x = f1[1].x; this.pinch.f1y = f1[1].y; } }
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
        if (this.scheme === 'F') {
          // F: a quick tap with a second finger turns the drag (below, in up). Until it clearly isn't one — the second
          // finger moved 14 px or stayed 320 ms — the first finger goes on as before and nothing pinches yet
          if (P.tap) {
            const q = this.ptrs.get(P.tap.id);
            if (q && Math.hypot(q.x - P.tap.x, q.y - P.tap.y) <= 14 && performance.now() - P.tap.t <= 320) {
              const f = this.ptrs.get(P.f1);
              if (e.pointerId === P.f1 && f && this.drag && !this.camLock) { this._fDrag(this.drag, f.x - P.f1x, f.y - P.f1y); P.f1x = f.x; P.f1y = f.y; }
              return;
            }
            // a real two-finger gesture from here: the first finger has already moved the view, so the spot between the
            // fingers starts where they are now; the spread and the twist still count from where the second finger landed
            const a1 = Math.atan2(b.y - a.y, b.x - a.x);
            // the spread counts from the first finger as it is now and the second where it landed: the first finger's own
            // travel during the wait is a move, not a pinch (it read as a sudden 1.5x zoom — QA3 10/19)
            const f = this.ptrs.get(P.f1); if (f) P.d = P.d0 = Math.hypot(f.x - P.tap.x, f.y - P.tap.y);
            P.tap = null; P.mx = mx; P.my = my; P.ang = a1; P.tw = Math.atan2(Math.sin(a1 - P.ang0), Math.cos(a1 - P.ang0));
          }
          // F: spread = zoom, twist = turn (after ~12°, so a pinch never turns by accident), and the spot between the
          // fingers travels with them — all at the same time, like a photo or a map
          const ang = Math.atan2(b.y - a.y, b.x - a.x); P.ang ??= ang;
          let da = ang - P.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); P.ang = ang; P.tw = (P.tw || 0) + da;
          if (!P.zoomOn && Math.abs(d - P.d0) > 16) { P.zoomOn = true; P.d = P.d0; }   // catch up the first 16 px
          // (10/19, user: "두 손가락 벌리기 할 때 확대하면서 돌아가는데 이거 별로다. 2d 그림 확대하듯") — no twist turn any more:
          // two fingers zoom like a photo; turning is the dial and drag-then-tap
          if (!this.camLock) {
            if (P.zoomOn) this.zoomAt(d / P.d, P.mx, P.my);
            this.panBy(mx - P.mx, my - P.my);
            this.zoomGoal = null;
          }
          if (!P.zoomOn) { Object.assign(P, { mx, my }); return; }
        } else if (this.scheme === 'E') {
          // E: two fingers only zoom (spread / pinch), and only once they really spread — a quick second-finger tap
          // must not nudge the zoom
          if (P.tap) { const q = this.ptrs.get(P.tap.id); if (q && Math.hypot(q.x - P.tap.x, q.y - P.tap.y) > 14) P.tap = null; }
          const q2 = this.ptrs.get(P.s2?.id), moved2 = q2 ? Math.hypot(q2.x - P.s2.x, q2.y - P.s2.y) : 99;
          if (!P.zoomOn && Math.abs(d - P.d0) > 16 && moved2 > 10) {
            P.zoomOn = true; P.tap = null;
            // 손맛 5: start from where the fingers landed, not from here (the first 16 px of spread are not lost)
            if (FEEL.pinch) { P.d = P.d0; P.mx = P.mx0; P.my = P.my0; } else P.d = d;
          }
          if (P.zoomOn && !this.camLock) {
            // 손맛 5: zoom round the old midpoint, then carry that spot to the new midpoint — it stays between the fingers
            if (FEEL.pinch) { this.zoomAt(d / P.d, P.mx, P.my); this.panBy(mx - P.mx, my - P.my); }
            else this.zoomAt(d / P.d, mx, my);
            this.zoomGoal = null;
          }
        } else if (!this.camLock) { this.zoomAt(d / P.d, P.mx, P.my); this.panBy(mx - P.mx, my - P.my); this.zoomGoal = null; }
        Object.assign(P, { d, mx, my });
        return;
      }
      const dr = this.drag; if (!dr) return;
      if (!dr.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 9) {
        dr.moved = true; this._pressEnd(); this.zoomGoal = null;
        // 손맛 3: the first 9 px (still a possible tap) used to be dropped, so the view trailed the finger by that much
        // for the whole drag; now the drag takes them too and the spot under the finger stays under it
        if (FEEL.catchup && !dr.custom && !dr.second) { dr.lastX = p.x0; dr.lastY = p.y0; }
      }
      const dx = e.clientX - dr.lastX, dy = e.clientY - dr.lastY;
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
        else if (!this.camLock && this.scheme === 'F' && !(e.pointerType === 'mouse' && (e.buttons & 2))) this._fDrag(dr, dx, dy);
        else if (!this.camLock && (this.scheme === 'B' || (this.scheme === 'C' && this.oneMode === 'move')) && !(e.pointerType === 'mouse' && (e.buttons & 2))) this.panBy(dx, dy);
        else if (!this.camLock && this.scheme === 'F') this._fTurn(dr, dx, dy);
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
      if ((this.scheme === 'E' || this.scheme === 'F') && P?.tap && P.tap.id === e.pointerId && performance.now() - P.tap.t < 320 && this.ptrs.size === 2 && !this.camLock) {   // (not in a camera-locked game: it only clicked and buzzed — QA3 10/19)
        // a second-finger tap flips the mode only while the drag lasts; lifting goes back to the badge's mode
        // (user, 2026-10-17 evening: "톡 건들면 바뀌는데 떼면 다시 원래대로", the badge switch stays as it is)
        // a turn borrowed by the tap spins round the middle of the screen; a turn that is the badge's mode spins round
        // the spot under the finger (user, 10/17 night)
        this.eMode = this.eMode === 'turn' ? 'move' : 'turn'; if (FEEL.haptic) haptic(); else navigator.vibrate?.(10); if (this.drag) { this.drag.anchor = this.eMode === 'turn' && this.eBase === 'move' ? this._turnPivot() : undefined; this.drag.ft = null; } this.rawYaw = this.yaw; this.switchFx?.(this.eMode); this.onModeSwitch?.(this.eMode);
      }
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size < 2) this.pinch = null;
      if (this.ptrs.size === 0) { this.eMode = this.eBase; this._pressEnd(!!this.drag && !this.drag.moved); }
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
        } else if (p.type === 'mouse' && p.btn !== 0) {
          dr.custom?.cancel?.();   // PC: a right / middle click that didn't move is no tap (QA 10/18: it opened drawers and cost a 톡)
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
          // (on in F too since 10/18 — user: "더블클릭하면 누른 데 줌인해서 보여주는 걸로" — the wall clock was hard to reach)
          // the second tap of a quick double tap on a thing just found lands on whatever was behind it: it does nothing
          // (QA 10/18: it hit the shelf or the floor and cost a 톡)
          // (a third quick tap on the spot of a double-tap zoom is part of the same burst: it does nothing unless it finds
          // something — "탁탁탁" used to cost a 톡 and stop the zoom half way, QA3 10/19)
          if (lt?.instant && now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 36 && !(lt.dbl && this.tapInstant?.(e.clientX, e.clientY))) this._lastTap = null;
          else if (this.scheme !== 'E' && lt && !lt.instant && now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 36 && !this.camLock && !this.noDblZoom && !this.tapInstant?.(e.clientX, e.clientY)) {
            this._lastTap = { t: now, x: e.clientX, y: e.clientY, instant: true, dbl: true }; this.onDoubleTap?.(e.clientX, e.clientY);   // (the first tap of the two already went out as a tap: the stage takes it back)
            if (this.zoom > 1.8) { this.zoomGoal = { z: 1, x: null }; }
            else this.zoomGoal = { z: Math.min(this.maxZoom, 3), x: e.clientX, y: e.clientY };
          } else { this._lastTap = { t: now, x: e.clientX, y: e.clientY, instant: !!this.tapInstant?.(e.clientX, e.clientY) }; this.onTap?.(e.clientX, e.clientY); }
        }
        this.drag = null;
      }
    };
    // the system took the touch away (a call, a gesture, the finger slid off): never a tap, never a commit
    const cancel = e => {
      if (!this.ptrs.has(e.pointerId)) return;
      this.ptrs.delete(e.pointerId);
      this._pressEnd();
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
      if ((this.scheme !== 'E' && this.scheme !== 'F') || e.button !== 2 || !(e.buttons & 1) || !this.drag || this.camLock || !this.inputEnabled) return;
      e.preventDefault();
      this.drag.moved = true;   // (like the second finger: letting go after the switch is no tap — QA 10/18)
      this.eMode = this.eMode === 'turn' ? 'move' : 'turn';
      this.drag.anchor = this.eMode === 'turn' && this.eBase === 'move' ? this._turnPivot() : undefined; this.drag.ft = null; this.rawYaw = this.yaw;
      this.switchFx?.(this.eMode); this.onModeSwitch?.(this.eMode);
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
