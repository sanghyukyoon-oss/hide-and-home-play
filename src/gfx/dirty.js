// Still-view redraw: while the camera and the lights stay put, only the screen areas where something changed are
// drawn again (a character breathing, a plant swaying, a puff of steam, a drawer sliding); everything else in the
// post's buffers is the very same picture from the frame before. A frame where nothing changed draws nothing at all.
//
// How it knows what changed: every drawn mesh leaves a fingerprint (world matrix, material, colour, opacity, texture
// and geometry versions, outline ID, layer); a mesh whose fingerprint moved, or that appeared / disappeared, marks its
// old and new screen boxes dirty. Anything global (camera, lights, screen size, post settings, the cel ramp, a shadow
// map update) makes the next frame a full one. The first frame after the camera stops is always full and takes the
// fingerprints, so every box stored is from the very view on screen.
import * as THREE from 'three';

const SIG = 34;
const P = new THREE.Vector3(), M = new THREE.Matrix4(), OW = new THREE.Matrix4(), LD = new THREE.Vector3();
const FLOOR = -.3;   // a shadow is followed down to this height (under every floor a room stands on)

export class DirtyTracker {
  constructor() {
    this.g = null;            // global fingerprint
    this.still = false;       // fingerprints are valid for the current view
    this.objs = new Map();    // mesh → { s: Float64Array, r: [x0,y0,x1,y1] | null, f: frame }
    this.frame = 0;
    this.stats = { full: 0, part: 0, skip: 0, area: 0 };
    this.scr = new Float64Array(SIG);   // scratch fingerprint (no garbage per mesh per frame)
  }
  invalidate() { this.still = false; this.g = null; }
  // global fingerprint: anything that changes every pixel at once
  _global(world, post) {
    const cam = world.cam, a = [];
    a.push(...cam.projectionMatrix.elements, ...cam.matrixWorld.elements, post.w, post.h, post.ss, post.color.width, post.color.height);
    for (const L of [world.hemi, world.sun, world.fill]) a.push(L.intensity, L.color.r, L.color.g, L.color.b, L.position.x, L.position.y, L.position.z, L.shadow?.intensity ?? 0);
    const u = post.u;
    for (const k of ['thick', 'innerRatio', 'overlap', 'nLo', 'nHi', 'innerStr', 'lineAlpha', 'tint', 'tintDark', 'levels', 'aoStr', 'dbg', 'gray']) a.push(u[k].value);
    a.push(u.ink.value.r, u.ink.value.g, u.ink.value.b, post.du.sharpen.value, post.packed ? 1 : 0, post.au.radius.value, post.au.bias.value);
    for (const k of ['aoTint']) { const c = u[k].value; a.push(c.r, c.g, c.b); }
    a.push(world.styleGrad?.version ?? 0, world.renderer.shadowMap.needsUpdate ? 1 : 0, world.scene.background ? 1 : 0);
    return a;
  }
  // what to draw this frame: { full: true } | { skip: true } | { rects: [[x0,y0,x1,y1], …] } (internal px, y up)
  plan(world, post) {
    this.frame++;
    const g = this._global(world, post);
    const same = this.g && this.g.length === g.length && g.every((v, i) => v === this.g[i]);
    this.g = g;
    if (!same) { this.still = false; this.stats.full++; return { full: true }; }
    const scene = world.scene, cam = world.cam;   // (world matrices: World.render updated them for this frame)
    const W = post.color.width, H = post.color.height;
    M.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    const first = !this.still, rects = [], f = this.frame, objs = this.objs;
    if (first) objs.clear();
    const box = (o) => this._rect(o, M, W, H);
    // a caster that moves while the shadow map is redrawn this frame (a door swinging): its shadow on the floor, the wall
    // and the furniture next to it moves too, outside its own box — the box of its shadow volume (its corners and where
    // they fall along the sun) is drawn again too, old place and new (10/22: a door's shadow stayed on the drawers)
    const sun = world.sun, shUp = world.renderer.shadowMap.needsUpdate && sun?.castShadow;
    if (shUp) { const a = sun.matrixWorld.elements, b = sun.target.matrixWorld.elements; LD.set(b[12] - a[12], b[13] - a[13], b[14] - a[14]).normalize(); }
    const shade = (o, me) => { if (shUp && o.castShadow && LD.y < -.05) { const r = this._rect(o, M, W, H, me, LD); if (r) rects.push(r); } };
    const ls = [];   // every light in the scene (a boss's flashlight, a lamp): any change lights the whole picture anew
    scene.traverseVisible(o => {
      if (o.isLight) {
        const e = o.matrixWorld.elements, t = o.target?.matrixWorld?.elements;
        ls.push(o.id, o.intensity, o.color.r, o.color.g, o.color.b, e[12], e[13], e[14], o.distance ?? 0, o.angle ?? 0, o.penumbra ?? 0, o.decay ?? 0, o.castShadow ? 1 : 0, t ? t[12] : 0, t ? t[13] : 0, t ? t[14] : 0);
        return;
      }
      if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine) || !(o.layers.mask & 5)) return;
      const s = this._sig(o, this.scr);
      let e = objs.get(o);
      if (!e) { e = { s: s.slice(), r: box(o), f }; objs.set(o, e); if (!first && e.r) { rects.push(e.r); shade(o, o.matrixWorld.elements); } return; }
      e.f = f;
      if (!same32(e.s, s)) { shade(o, e.s); shade(o, o.matrixWorld.elements); e.s.set(s); const r = box(o); if (e.r) rects.push(e.r); if (r) rects.push(r); e.r = r; }
    });
    // gone (removed or hidden): its last box
    for (const [o, e] of objs) if (e.f !== f) { if (e.r) { rects.push(e.r); shade(o, e.s); } objs.delete(o); }
    const lit = this.ls && this.ls.length === ls.length && ls.every((v, i) => v === this.ls[i]);
    this.ls = ls;
    // (the fingerprints taken above are this frame's, so the next still frame can go back to boxes)
    if (first || !lit) { this.still = true; this.stats.full++; return { full: true }; }
    if (!rects.length) { this.stats.skip++; return { skip: true }; }
    const merged = mergeRects(rects);
    const area = merged.reduce((a, r) => a + (r[2] - r[0]) * (r[3] - r[1]), 0) / (W * H);
    this.stats.area = area;
    if (area > .55) { this.stats.full++; return { full: true }; }
    this.stats.part++;
    return { rects: merged, area };
  }
  // the screen box (internal px) of a drawn mesh this frame, or null when it is off screen; with me (its world matrix
  // elements, maybe an old one) and ld (the sun's direction) the box of its shadow volume instead
  _rect(o, M, W, H, me = null, ld = null) {
    const g = o.geometry; if (!g) return null;
    if (!g.boundingBox || g.userData._dbv !== verOf(g)) { g.computeBoundingBox(); g.userData._dbv = verOf(g); }
    const b = g.boundingBox; if (b.isEmpty()) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const mw = me ? OW.fromArray(me) : o.matrixWorld;
    for (let i = 0; i < (ld ? 16 : 8); i++) {
      P.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(mw);
      if (i & 8) P.addScaledVector(ld, (FLOOR - P.y) / ld.y);
      P.applyMatrix4(M);
      const x = (P.x * .5 + .5) * W, y = (P.y * .5 + .5) * H;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    // a little slack for rasterisation, then clip to the screen
    x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2); x1 = Math.min(W, Math.ceil(x1) + 2); y1 = Math.min(H, Math.ceil(y1) + 2);
    return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null;
  }
  _sig(o, s) {
    s.fill(0); const e = o.matrixWorld.elements;
    for (let i = 0; i < 16; i++) s[i] = e[i];
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    let k = 16;
    for (const m of ms.length > 2 ? ms.slice(0, 2) : ms) {
      if (!m) continue;
      // three bumps .version twice a frame on its own for a transparent double-sided material (it draws the back faces,
      // then the front ones, flipping .side and needsUpdate) — not a change in the picture
      const flips = m.transparent && m.side === THREE.DoubleSide && !m.forceSinglePass;
      s[k++] += m.id * 1e3 + (flips ? 0 : m.version || 0);
      s[k++] += m.opacity ?? 1;
      const c = m.color; if (c) { s[k++] += c.r; s[k++] += c.g; s[k++] += c.b; } else k += 3;
      const em = m.emissive; if (em) { s[k++] += em.r + m.emissiveIntensity; s[k++] += em.g; s[k++] += em.b; } else k += 3;
      s[k++] += m.map ? m.map.id * 1e4 + m.map.version + m.map.offset.x * 31 + m.map.offset.y * 71 : -1;   // (a sliding picture — the train's windows — is a change too, 10/22)
      s[k++] += (m.visible ? 1 : 0) + (flips ? 2 * THREE.DoubleSide : (m.side || 0) * 2) + (m.transparent ? 8 : 0) + (m.depthTest ? 16 : 0) + (m.depthWrite ? 32 : 0);
      k = 16;   // a second material folds into the same slots (sums)
    }
    k = 26;
    const g = o.geometry;
    s[k++] = g ? g.id : -1;
    s[k++] = g ? verOf(g) : 0;
    s[k++] = g ? g.drawRange.start * 1e6 + Math.min(g.drawRange.count, 1e6) : 0;
    s[k++] = o.layers.mask;
    s[k++] = o.userData.oid || 0;
    s[k++] = o.renderOrder;
    s[k++] = ms.length;
    return s;
  }
}
function verOf(g) { const p = g.attributes?.position; return (p ? p.version : 0) + (g.index ? g.index.version * 1e4 : 0); }
function same32(a, b) { for (let i = 0; i < SIG; i++) if (a[i] !== b[i]) return false; return true; }
// merge boxes that overlap or nearly touch, then keep merging the pair that grows the least until at most MAXR are
// left: every box is one more pass over the whole scene for three (colour + IDs), so a few slightly bigger boxes cost
// the phone's CPU far less than many tight ones (stage 20 had 6–7 a frame). In place, no garbage.
const MAXR = 3;
function mergeRects(rs) {
  const out = rs.map(r => r.slice());
  const ar = (x0, y0, x1, y1) => (x1 - x0) * (y1 - y0);
  const join = (i, j) => { const a = out[i], b = out[j]; a[0] = Math.min(a[0], b[0]); a[1] = Math.min(a[1], b[1]); a[2] = Math.max(a[2], b[2]); a[3] = Math.max(a[3], b[3]); out[j] = out[out.length - 1]; out.pop(); };
  for (let again = true; again;) {
    again = false;
    for (let i = 0; i < out.length && !again; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      if (a[0] <= b[2] + 24 && b[0] <= a[2] + 24 && a[1] <= b[3] + 24 && b[1] <= a[3] + 24) { join(i, j); again = true; break; }
    }
  }
  while (out.length > MAXR) {
    let bi = 0, bj = 1, best = Infinity;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      const grow = ar(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])) - ar(a[0], a[1], a[2], a[3]) - ar(b[0], b[1], b[2], b[3]);
      if (grow < best) { best = grow; bi = i; bj = j; }
    }
    join(bi, bj);
  }
  return out;
}
