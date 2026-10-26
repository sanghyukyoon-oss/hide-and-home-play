import { resumeFollowup, followupLabel } from '../followup.js';
// Home: 몽글이's neighbourhood on the ground — a warm everyday lane where Korean, Japanese and American houses stand side
// by side (art/concepts G, H, I). 몽글이's two-floor house in the middle, the friends' houses around it, a paved front
// yard, the sidewalk with its street furniture and the street running off past the screen.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, mat, shade, canvasTex, roundRect, STYLE } from '../gfx/kit.js';
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { deFlush } from '../gfx/bake.js';
import { makeFurniture } from '../gfx/furniture.js';
import { groundTex } from '../gfx/outdoor.js';
import { openTune } from '../tune.js';
import { openCardBook, bookBadge } from '../cardbook.js';
import { runRaids, unseen, markSeen, newsLine, holderOf, locksOwned, locksUsed, LOCK_MAX } from '../raid.js';
import { canReplay, playRaidReplay, shieldTxt, askBuyLock } from '../raidreplay.js';   // ① 털림 다시 보기 · 문단속 (10/19)
import { shieldLeft } from '../raid.js';
import { Visitors } from '../visitors.js';
import { storyFor } from '../story.js';
import { openRoadmap } from '../roadmap.js';
import { THEMES, stageSpec, regionOf, STAGE_COUNT, REGIONS, CHAR_UNLOCK } from '../stages.js';
import { h, ICON, fullscreenBtn } from '../ui.js';
import { IN_APP, QA_TOOLS, VERSION_LABEL } from '../build.js';
import { TUT_B, setTutB } from '../tutb.js';
import { Tweens, ease, rng } from '../util.js';
import { tr, LANG, setLang } from '../i18n.js';
import { openGallery } from '../gallery.js';
import { openHelp } from '../controlshelp.js';   // 조작 도움말 (10/20)
import { BOSS_GAMES } from '../minis.js';
import { lvOf } from '../level.js';   // 내 Lv: 별 + 털기 (10/20)
import { settleOpen } from '../raidrun.js';   // 털다 만 집 정산 (QA9, 10/21)

// ═════════════════════════════════════════ village kit ═════════════════════════════════════════
// Every building is a few "parts". A part is one ink-outline shape (userData.og) drawn as 1–3 merged meshes: all plain
// colours in one vertex-coloured mesh, each canvas texture (roof tiles, plaster, siding, brick, window glass, doors,
// signs) in one mesh, glowing bits in one. Built geometry is cached, so coming back home costs almost nothing.
const PI = Math.PI, HP = PI / 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);
const Mx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? V3(s, s, s) : V3(s[0], s[1], s[2]));
const at = (M0, ...a) => M0.clone().multiply(Mx(...a));
const Gm = {
  box: (w, h, d, r = .02) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .006 && Math.min(w, h, d) > .035 ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d); },
  cyl: (rt, rb, h, seg = 14) => new THREE.CylinderGeometry(rt, rb, h, seg),
  sph: (r, ws = 12, hs = 9) => new THREE.SphereGeometry(r, ws, hs),
  cone: (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg),
  tor: (R, t, arc = PI * 2, ts = 22) => new THREE.TorusGeometry(R, t, 6, ts, arc),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
  circle: r => new THREE.CircleGeometry(r, 28),
};
const triShape = (span, rise) => { const s = new THREE.Shape(); s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, rise); s.closePath(); return s; };
// attic volume under a gable roof: ridge along x (gable triangles on the ±x ends) or along z (gables front and back)
function prismX(len, span, rise) { const g = new THREE.ExtrudeGeometry(triShape(span, rise), { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(-HP); return g; }
function prismZ(len, span, rise) { const g = new THREE.ExtrudeGeometry(triShape(span, rise), { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); return g; }

const VMAT = {};
function vmat() {
  const k = STYLE.mode;
  return VMAT[k] || (VMAT[k] = k !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
function clean(g, uv) {
  const c = g.index ? g.toNonIndexed() : g.clone();
  c.clearGroups();
  for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && !(uv && k === 'uv')) c.deleteAttribute(k);
  if (!c.attributes.normal) c.computeVertexNormals();
  if (uv && !c.attributes.uv) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
  return c;
}
// box-projected uvs in units of s (a texture repeat is s world units on every face); tops read (x, -z), sides read up
function planarUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = -p.getZ(i); }
    else if (ax >= az) { u = nx > 0 ? -p.getZ(i) : p.getZ(i); v = p.getY(i); }
    else { u = nz > 0 ? p.getX(i) : -p.getX(i); v = p.getY(i); }
    uv.setXY(i, u / s, v / s);
  }
  uv.needsUpdate = true;
}
// a flat piece facing +z: its xy bounds map onto the whole texture
function fitUV(g) {
  g.computeBoundingBox(); const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x || 1), (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1));
}
const PARTS = new Map();
// part(key, build): build(A) adds pieces with A.add (colour), A.tex (canvas texture), A.glow (lit) and A.tube.
// Transforms are either (x, y, z, rx, ry, rz, s) or one Matrix4.
function part(key, build) {
  const k = STYLE.mode + '|' + key;
  let spec = PARTS.get(k);
  if (!spec) {
    const vc = [], other = new Map();
    const M = t => (t[0] instanceof THREE.Matrix4 ? t[0] : Mx(...t));
    const push = (mk, g, make) => { let e = other.get(mk); if (!e) other.set(mk, e = { list: [], make }); e.list.push(g); };
    const A = {
      add(g, color, ...t) {
        const c = clean(g, false); c.applyMatrix4(M(t));
        const cc = new THREE.Color(tint(color)), n = c.attributes.position.count, a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
        c.setAttribute('color', new THREE.BufferAttribute(a, 3)); vc.push(c);
      },
      // uv: number = world-planar after placing, [n] = planar in the piece's own frame, 'fit' = whole texture, null = keep
      tex(g, tk, uv, ...t) {
        const c = clean(g, true);
        if (Array.isArray(uv)) planarUV(c, uv[0]); else if (uv === 'fit') fitUV(c);
        c.applyMatrix4(M(t)); if (typeof uv === 'number') planarUV(c, uv);
        push('t|' + tk, c, () => mat('#ffffff', { map: TX(tk) }));
      },
      glow(g, color, ...t) { const c = clean(g, false); c.applyMatrix4(M(t)); push('g|' + color, c, () => mat(color, { emissive: color, ei: .85 })); },
      tube(a, b, r, color, seg = 8) {
        const A0 = V3(...a), B0 = V3(...b), d = B0.clone().sub(A0), L = d.length();
        A.add(new THREE.CylinderGeometry(r, r, L, seg), color, new THREE.Matrix4().compose(A0.clone().add(B0).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()), V3(1, 1, 1)));
      },
    };
    build(A);
    spec = [];
    if (vc.length) spec.push({ g: mergeGeometries(vc, false), m: vmat });
    for (const e of other.values()) spec.push({ g: mergeGeometries(e.list, false), m: e.make });
    vc.forEach(g => g.dispose()); for (const e of other.values()) e.list.forEach(g => g.dispose());
    PARTS.set(k, spec);
  }
  const grp = new THREE.Group(); grp.userData.og = grp; grp.name = key;
  for (const s of spec) { const o = new THREE.Mesh(s.g, s.m()); o.castShadow = o.receiveShadow = true; o.name = key; grp.add(o); }
  return grp;
}

// ═════════════════════════════════════════ canvas textures ═════════════════════════════════════════
const TXC = new Map();
const blob = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); };
const wrapAt = (W, H, x, y, m, fn) => { for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) { const X = x + dx, Y = y + dy; if (X > -m && X < W + m && Y > -m && Y < H + m) fn(X, Y); } };
function mottle(c, W, H, base, n, r, amt = .03, alpha = .5) {
  c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, rad = 16 + r() * 56; c.fillStyle = shade(base, (r() < .5 ? -1 : 1) * amt * (.5 + r()));
    wrapAt(W, H, x, y, rad * 1.6, (X, Y) => { c.beginPath(); c.ellipse(X, Y, rad * 1.6, rad, 0, 0, PI * 2); c.fill(); });
  }
  c.globalAlpha = 1;
}
function speckle(c, W, H, n, r, a = .1, sz = 1.6) { for (let i = 0; i < n; i++) { c.fillStyle = r() < .5 ? `rgba(255,255,255,${a})` : `rgba(70,40,40,${a})`; c.fillRect(r() * W, r() * H, sz, sz); } }
const FONT = px => `${px}px Ssurround, Jua, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
// a stretch of a row that wraps round the texture's right edge
const hwrap = (W, x, w, fn) => { fn(x); if (x + w > W) fn(x - W); if (x < 0) fn(x + W); };
const TD = {
  plaster: { draw(c, W, H, base) {
    const r = rng(3); base = tint(base); c.fillStyle = base; c.fillRect(0, 0, W, H);
    mottle(c, W, H, base, 34, r, .035); speckle(c, W, H, 2600, r, .09);
    c.strokeStyle = shade(base, -.1); c.lineWidth = 1.4; c.globalAlpha = .5;
    for (let i = 0; i < 3; i++) { let x = 40 + r() * (W - 80), y = 40 + r() * (H - 120); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 26; y += 8 + r() * 12; c.lineTo(x, y); } c.stroke(); }
    c.globalAlpha = 1;
  } },
  siding: { draw(c, W, H, base) {   // horizontal clapboards, 6 per repeat
    const r = rng(5); base = tint(base); const n = 6, bh = H / n;
    for (let j = 0; j < n; j++) {
      const y = j * bh, b = shade(base, (r() - .5) * .05);
      c.fillStyle = b; c.fillRect(0, y, W, bh);
      c.strokeStyle = shade(b, -.07); c.lineWidth = 1.3; c.globalAlpha = .45;
      for (let k = 0; k < 5; k++) { const yy = y + 14 + r() * (bh - 30); c.beginPath(); c.moveTo(0, yy); for (let x = 0; x <= W; x += 32) c.lineTo(x, yy + Math.sin(x * .02 + k + j) * 1.6); c.stroke(); }
      c.globalAlpha = 1;
      const g = c.createLinearGradient(0, y, 0, y + 18); g.addColorStop(0, 'rgba(70,35,20,.3)'); g.addColorStop(1, 'rgba(70,35,20,0)'); c.fillStyle = g; c.fillRect(0, y, W, 18);
      c.fillStyle = shade(b, .08); c.fillRect(0, y + bh - 8, W, 5);
      c.fillStyle = shade(b, -.34); c.fillRect(0, y + bh - 3, W, 3);
      const jx = 10 + r() * (W - 20); c.fillStyle = shade(b, -.25); c.fillRect(jx, y + 3, 2.5, bh - 8);
    }
  } },
  boards: { draw(c, W, H, base) {   // vertical boards with battens (the Japanese house)
    const r = rng(7); base = tint(base); const n = 7, bw = W / n;
    for (let i = 0; i < n; i++) {
      const x = i * bw, b = shade(base, (r() - .5) * .07); c.fillStyle = b; c.fillRect(x, 0, bw, H);
      c.strokeStyle = shade(b, -.09); c.lineWidth = 1.4; c.globalAlpha = .55;
      for (let k = 0; k < 4; k++) { const xx = x + 12 + r() * (bw - 24); c.beginPath(); c.moveTo(xx, 0); for (let y = 0; y <= H; y += 24) c.lineTo(xx + Math.sin(y * .03 + k * 2 + i) * 2.4, y); c.stroke(); }
      c.globalAlpha = 1;
      if (r() < .6) { const ky = 40 + r() * (H - 80); c.fillStyle = shade(b, -.14); c.beginPath(); c.ellipse(x + bw * .55, ky, 5, 10, 0, 0, PI * 2); c.fill(); }
    }
    for (let i = 0; i <= n; i++) { const x = i * bw; c.fillStyle = shade(base, -.38); c.fillRect(x - 6, 0, 3, H); c.fillStyle = shade(base, .05); c.fillRect(x - 3, 0, 9, H); c.fillStyle = shade(base, -.3); c.fillRect(x + 6, 0, 2.5, H); }
  } },
  brick: { draw(c, W, H, base, mortar = '#efe4d6') {
    const r = rng(9); base = tint(base); c.fillStyle = tint(mortar); c.fillRect(0, 0, W, H);
    const rows = 14, rh = H / rows, bw = W / 4;
    const cols = [base, shade(base, .05), shade(base, -.05), shade(base, .09), shade(base, -.1)];
    for (let j = 0; j < rows; j++) for (let x = -bw + (j % 2) * bw / 2; x < W; x += bw) {
      const col = r.pick(cols), y = j * rh;
      c.fillStyle = col; roundRect(c, x + 3, y + 3, bw - 6, rh - 6, 3); c.fill();
      c.fillStyle = shade(col, .1); c.fillRect(x + 6, y + 4, bw - 12, 2.5);
      c.fillStyle = shade(col, -.16); c.fillRect(x + 6, y + rh - 6.5, bw - 12, 2.5);
    }
    speckle(c, W, H, 1800, r, .1);
  } },
  stone: { draw(c, W, H, base) {   // stacked stone for plinths and garden walls
    const r = rng(11); base = tint(base); c.fillStyle = shade(base, -.3); c.fillRect(0, 0, W, H);
    const rows = 5, rh = H / rows;
    for (let j = 0; j < rows; j++) {
      let x = 0;
      while (x < W - 2) {
        let w = 70 + r() * 90; if (x + w > W - 50) w = W - x;
        const col = shade(base, (r() - .5) * .14), y = j * rh;
        c.fillStyle = col; roundRect(c, x + 3, y + 3, w - 6, rh - 6, 12); c.fill();
        c.fillStyle = shade(col, .08); roundRect(c, x + 8, y + 6, w - 22, 8, 4); c.fill();
        x += w;
      }
    }
    speckle(c, W, H, 1500, r, .1);
  } },
  tile: { draw(c, W, H, base) {   // round clay tiles in columns, each row overlapping the one below
    base = tint(base); const rows = 5, cols = 7, rh = H / rows, cw = W / cols;
    c.fillStyle = shade(base, -.4); c.fillRect(0, 0, W, H);
    for (let j = rows - 1; j >= -1; j--) {
      const y = j * rh, jj = (j + rows) % rows;
      const g = c.createLinearGradient(0, y + rh, 0, y + rh * 1.5); g.addColorStop(0, 'rgba(60,15,10,.5)'); g.addColorStop(1, 'rgba(60,15,10,0)');
      c.fillStyle = g; c.fillRect(0, y + rh, W, rh * .5);
      for (let i = 0; i < cols; i++) {
        const rr = rng(100 + jj * 31 + i), col = shade(base, (rr() - .5) * .09);
        const x0 = i * cw + 1.5, x1 = (i + 1) * cw - 1.5, cx = (x0 + x1) / 2, rad = (x1 - x0) / 2, ry = rad * .7, yb = y + rh;
        const gr = c.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, shade(col, -.15)); gr.addColorStop(.42, shade(col, .1)); gr.addColorStop(1, shade(col, -.18));
        c.fillStyle = gr; c.beginPath(); c.moveTo(x0, y - rh * .5); c.lineTo(x0, yb - ry); c.ellipse(cx, yb - ry, rad, ry, 0, PI, 0, true); c.lineTo(x1, y - rh * .5); c.closePath(); c.fill();
        c.strokeStyle = shade(base, -.48); c.lineWidth = 2.2; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(cx - rad * .35, y + 2, rad * .22, rh - ry - 4);
      }
    }
  } },
  kawara: { draw(c, W, H, base) {   // Japanese tiles: wide channels and round cover ribs
    base = tint(base); const rows = 5, cols = 6, rh = H / rows, cw = W / cols;
    for (let i = 0; i < cols; i++) { const x = i * cw, g = c.createLinearGradient(x, 0, x + cw, 0); g.addColorStop(0, shade(base, .03)); g.addColorStop(.5, shade(base, -.08)); g.addColorStop(1, shade(base, .03)); c.fillStyle = g; c.fillRect(x, 0, cw, H); }
    for (let j = 0; j < rows; j++) {
      const y = (j + 1) * rh;
      const g = c.createLinearGradient(0, y - 4, 0, y + 16); g.addColorStop(0, 'rgba(20,20,45,.42)'); g.addColorStop(1, 'rgba(20,20,45,0)');
      wrapAt(W, H, 0, y, 30, (X, Y) => { c.fillStyle = g; c.fillRect(0, Y - 2, W, 18); c.fillStyle = shade(base, .14); c.fillRect(0, Y - 7, W, 4); });
    }
    for (let i = 0; i <= cols; i++) {
      const x = i * cw, rw = 15;
      const g = c.createLinearGradient(x - rw, 0, x + rw, 0); g.addColorStop(0, shade(base, -.2)); g.addColorStop(.4, shade(base, .16)); g.addColorStop(1, shade(base, -.22));
      c.fillStyle = g; c.fillRect(x - rw, 0, rw * 2, H);
      c.fillStyle = shade(base, -.45); c.fillRect(x - rw - 1.5, 0, 2.5, H); c.fillRect(x + rw - 1, 0, 2.5, H);
      for (let j = 0; j < rows; j++) { const y = (j + 1) * rh; c.strokeStyle = shade(base, -.45); c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, y - 9, rw - 1, 8, 0, 0, PI); c.stroke(); }
    }
  } },
  shingle: { draw(c, W, H, base) {   // asphalt shingles, staggered
    const r = rng(19); base = tint(base); const rows = 8, rh = H / rows;
    c.fillStyle = shade(base, -.36); c.fillRect(0, 0, W, H);
    for (let j = 0; j < rows; j++) {
      const y = j * rh; let x = -r() * 40;
      while (x < W) {
        const w = 44 + r() * 44, col = shade(base, (r() - .5) * .14);
        hwrap(W, x, w, X => {
          c.fillStyle = col; roundRect(c, X + 1.5, y + 1, w - 3, rh - 2, 3); c.fill();
          c.fillStyle = shade(col, -.2); c.fillRect(X + 3, y + rh - 6, w - 6, 3);
        });
        x += w;
      }
      const g = c.createLinearGradient(0, y, 0, y + 14); g.addColorStop(0, 'rgba(30,15,10,.35)'); g.addColorStop(1, 'rgba(30,15,10,0)'); c.fillStyle = g; c.fillRect(0, y, W, 14);
    }
    speckle(c, W, H, 3000, r, .14, 2);
  } },
  scale: { draw(c, W, H, base) {   // round fish-scale shingles (the bunny cottage)
    base = tint(base); const rows = 8, cols = 6, rh = H / rows, cw = W / cols;
    c.fillStyle = shade(base, -.4); c.fillRect(0, 0, W, H);
    for (let j = rows - 1; j >= -1; j--) {
      const y = j * rh, off = ((j + rows) % 2) * cw / 2, jj = (j + rows) % rows;
      for (let i = -1; i <= cols; i++) {
        const rr = rng(300 + jj * 17 + ((i + cols) % cols)), col = shade(base, (rr() - .5) * .1);
        const cx = i * cw + off + cw / 2, rad = cw / 2 - 1.5, yb = y + rh + rad * .55;
        const g = c.createLinearGradient(0, yb - rad * 2, 0, yb); g.addColorStop(0, shade(col, -.12)); g.addColorStop(1, shade(col, .1));
        c.fillStyle = g; c.beginPath(); c.moveTo(cx - rad, y - rh); c.lineTo(cx - rad, yb - rad); c.arc(cx, yb - rad, rad, PI, 0, true); c.lineTo(cx + rad, y - rh); c.closePath(); c.fill();
        c.strokeStyle = shade(base, -.45); c.lineWidth = 2.2; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, yb - rad, rad - 6, PI * .65, PI * .35, true); c.stroke();
      }
    }
  } },
  glass: { size: [256, 256], rep: false, draw(c, W, H, style, cur) {   // a lit window: the room behind, curtains, a reflection
    cur = tint(cur);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff6dc'); g.addColorStop(1, '#ffd48c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(205,140,90,.28)'; roundRect(c, W * .38, H * .2, W * .24, H * .18, 4); c.fill();
    c.fillStyle = 'rgba(120,180,90,.35)'; blob(c, W * .5, H * .78, W * .1); blob(c, W * .43, H * .82, W * .08); blob(c, W * .57, H * .82, W * .08);
    if (style === 'shoji') {
      c.fillStyle = '#fbf2dc'; c.fillRect(0, 0, W, H); const g2 = c.createRadialGradient(W / 2, H * .55, 10, W / 2, H * .55, W * .7); g2.addColorStop(0, 'rgba(255,214,140,.55)'); g2.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
      c.fillStyle = '#7a4a2e'; for (let k = 1; k < 4; k++) c.fillRect(k * W / 4 - 3, 0, 6, H); for (let k = 1; k < 5; k++) c.fillRect(0, k * H / 5 - 3, W, 6);
    } else if (style === 'blind') {
      for (let y = 0; y < H * .62; y += 16) { c.fillStyle = '#f6f2ea'; c.fillRect(0, y, W, 12); c.fillStyle = '#d9d2c6'; c.fillRect(0, y + 10, W, 3); }
      c.fillStyle = '#c9c0b2'; c.fillRect(W * .3, 0, 3, H * .62); c.fillRect(W * .7, 0, 3, H * .62);
    } else if (style === 'lace') {
      c.fillStyle = '#ffffff'; c.fillRect(0, H * .5, W, H * .5); c.fillStyle = '#f2ebe2'; for (let x = 8; x < W; x += 22) blob(c, x, H * .5, 10);
      c.fillStyle = 'rgba(210,190,170,.5)'; for (let x = 14; x < W; x += 22) for (let y = H * .6; y < H; y += 22) blob(c, x, y, 3);
    } else {
      for (const side of [0, 1]) {
        const x0 = side ? W : 0, d = side ? -1 : 1;
        c.fillStyle = cur; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + d * W * .36, 0); c.quadraticCurveTo(x0 + d * W * .12, H * .58, x0 + d * W * .26, H); c.lineTo(x0, H); c.closePath(); c.fill();
        c.strokeStyle = shade(cur, -.2); c.lineWidth = 3;
        for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(x0 + d * W * .085 * k, 0); c.quadraticCurveTo(x0 + d * W * .04 * k, H * .58, x0 + d * W * .07 * k, H); c.stroke(); }
        c.fillStyle = shade(cur, -.28); roundRect(c, side ? W - W * .2 : 0, H * .55, W * .2, 12, 5); c.fill();
      }
      c.fillStyle = shade(cur, .06); c.fillRect(0, 0, W, 20); c.fillStyle = shade(cur, -.12); for (let x = 16; x < W; x += 32) blob(c, x, 20, 13); c.fillStyle = shade(cur, .06); for (let x = 16; x < W; x += 32) blob(c, x, 18, 11);
    }
    c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.moveTo(W * .58, 0); c.lineTo(W * .72, 0); c.lineTo(W * .3, H); c.lineTo(W * .16, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(W * .78, 0); c.lineTo(W * .83, 0); c.lineTo(W * .41, H); c.lineTo(W * .36, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,50,40,.38)'; c.lineWidth = 10; c.strokeRect(0, 0, W, H);
  } },
  door: { size: [256, 512], rep: false, draw(c, W, H, base, style) {
    base = tint(base); const r = rng(23); c.fillStyle = base; c.fillRect(0, 0, W, H);
    c.strokeStyle = shade(base, -.06); c.lineWidth = 1.5; c.globalAlpha = .5; for (let k = 0; k < 14; k++) { const x = r() * W; c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= H; y += 32) c.lineTo(x + Math.sin(y * .02 + k) * 2, y); c.stroke(); } c.globalAlpha = 1;
    const inset = (x, y, w, h) => {
      c.fillStyle = shade(base, -.05); roundRect(c, x, y, w, h, 7); c.fill(); c.strokeStyle = shade(base, -.38); c.lineWidth = 3.5; c.stroke();
      c.strokeStyle = shade(base, .16); c.lineWidth = 3.5; c.beginPath(); c.moveTo(x + 7, y + h - 7); c.lineTo(x + 7, y + 7); c.lineTo(x + w - 7, y + 7); c.stroke();
    };
    const pane = (x, y, w, h, rr = 8) => {
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#fff7da'); g.addColorStop(1, '#ffd58e');
      c.fillStyle = g; roundRect(c, x, y, w, h, rr); c.fill(); c.strokeStyle = shade(base, -.4); c.lineWidth = 4; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x + w * .55, y + 3); c.lineTo(x + w * .75, y + 3); c.lineTo(x + w * .3, y + h - 3); c.lineTo(x + w * .1, y + h - 3); c.closePath(); c.fill();
    };
    if (style === 'slide') {   // Japanese lattice sliding door
      c.fillStyle = '#fbf2dc'; c.fillRect(W * .1, H * .06, W * .8, H * .66);
      const g2 = c.createRadialGradient(W / 2, H * .4, 8, W / 2, H * .4, W * .6); g2.addColorStop(0, 'rgba(255,210,130,.6)'); g2.addColorStop(1, 'rgba(255,210,130,0)'); c.fillStyle = g2; c.fillRect(W * .1, H * .06, W * .8, H * .66);
      c.fillStyle = shade(base, -.25); for (let k = 0; k <= 4; k++) c.fillRect(W * .1 + k * W * .2 - 3, H * .06, 6, H * .66); for (let k = 0; k <= 8; k++) c.fillRect(W * .1, H * .06 + k * H * .0825 - 3, W * .8, 6);
      c.fillRect(W / 2 - 4, 0, 8, H); inset(W * .12, H * .76, W * .76, H * .2);
    } else if (style === 'glass') {
      pane(W * .15, H * .07, W * .7, H * .42); c.fillStyle = shade(base, -.1); c.fillRect(W / 2 - 4, H * .07, 8, H * .42); c.fillRect(W * .15, H * .21, W * .7, 7); c.fillRect(W * .15, H * .35, W * .7, 7);
      inset(W * .15, H * .56, W * .7, H * .36);
    } else if (style === 'steel') {
      const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, shade(base, -.06)); g.addColorStop(.5, shade(base, .08)); g.addColorStop(1, shade(base, -.08)); c.fillStyle = g; c.fillRect(0, 0, W, H);
      pane(W * .12, H * .06, W * .76, H * .6, 4); c.fillStyle = shade(base, -.1); c.fillRect(W / 2 - 4, H * .06, 8, H * .6);
      c.fillStyle = shade(base, -.3); roundRect(c, W * .12, H * .72, W * .76, H * .22, 6); c.fill();
    } else if (style === 'heart') {
      inset(W * .14, H * .38, W * .72, H * .24); inset(W * .14, H * .66, W * .72, H * .28);
      const hx = W / 2, hy = H * .2, s = W * .2; c.fillStyle = '#fff3c4'; c.beginPath(); c.moveTo(hx, hy + s * .9); c.bezierCurveTo(hx - s * 1.3, hy, hx - s * .6, hy - s * .9, hx, hy - s * .3); c.bezierCurveTo(hx + s * .6, hy - s * .9, hx + s * 1.3, hy, hx, hy + s * .9); c.fill(); c.strokeStyle = shade(base, -.4); c.lineWidth = 4; c.stroke();
    } else {
      pane(W * .22, H * .07, W * .56, H * .2, 10); c.fillStyle = shade(base, -.1); c.fillRect(W / 2 - 3, H * .07, 6, H * .2);
      inset(W * .14, H * .33, W * .72, H * .25); inset(W * .14, H * .63, W * .72, H * .3);
    }
    c.strokeStyle = shade(base, -.42); c.lineWidth = 8; c.strokeRect(0, 0, W, H);
  } },
  sign: { size: [512, 160], rep: false, draw(c, W, H, text, bg, fg) {
    bg = tint(bg); const r = rng(29);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(bg, .07)); g.addColorStop(1, shade(bg, -.07)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = shade(bg, -.1); c.lineWidth = 2; c.globalAlpha = .5; for (let k = 0; k < 8; k++) { const y = r() * H; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 32) c.lineTo(x, y + Math.sin(x * .02 + k) * 3); c.stroke(); } c.globalAlpha = 1;
    c.strokeStyle = shade(bg, -.38); c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
    c.font = FONT(Math.round(H * .56)); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = shade(bg, -.42); text = tr(text); c.strokeText(text, W / 2, H / 2 + 5); c.fillStyle = fg; c.fillText(text, W / 2, H / 2 + 5);
  } },
  noren: { size: [256, 256], rep: false, draw(c, W, H, base) {   // the shop curtain over the Japanese door, a cat face on it
    base = tint(base); c.fillStyle = base; c.fillRect(0, 0, W, H);
    c.fillStyle = shade(base, -.1); c.fillRect(0, 0, W, 26);
    c.fillStyle = '#fffaf0'; const cx = W / 2, cy = H * .56; blob(c, cx, cy, 58);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 52, cy - 22); c.lineTo(cx + s * 42, cy - 78); c.lineTo(cx + s * 14, cy - 52); c.closePath(); c.fill(); }
    c.fillStyle = '#2a1d33'; blob(c, cx - 22, cy - 4, 7); blob(c, cx + 22, cy - 4, 7); c.strokeStyle = '#2a1d33'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.arc(cx - 8, cy + 14, 8, 0, PI); c.stroke(); c.beginPath(); c.arc(cx + 8, cy + 14, 8, 0, PI); c.stroke();
    for (const s of [-1, 1]) for (const k of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 34, cy + 10 + k * 6); c.lineTo(cx + s * 66, cy + 6 + k * 12); c.stroke(); }
    c.fillStyle = shade(base, -.45); c.fillRect(W / 3 - 3, 30, 6, H); c.fillRect(W * 2 / 3 - 3, 30, 6, H);
  } },
  stripes: { size: [256, 256], draw(c, W, H, a, b) { a = tint(a); b = tint(b); for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? b : a; c.fillRect(k * W / 8, 0, W / 8, H); } c.fillStyle = 'rgba(0,0,0,.06)'; for (let k = 0; k < 8; k++) c.fillRect(k * W / 8, 0, 4, H); } },
  mat: { size: [256, 160], rep: false, draw(c, W, H, base) {   // the bear doormat
    base = tint(base); c.fillStyle = shade(base, -.25); roundRect(c, 0, 0, W, H, 24); c.fill(); c.fillStyle = base; roundRect(c, 10, 10, W - 20, H - 20, 18); c.fill();
    const r = rng(31); speckle(c, W, H, 900, r, .14, 2);
    const cx = W / 2, cy = H / 2 + 6, k = shade(base, -.3); c.fillStyle = k; blob(c, cx - 34, cy - 34, 16); blob(c, cx + 34, cy - 34, 16); blob(c, cx, cy, 44);
    c.fillStyle = base; blob(c, cx, cy + 10, 18); c.fillStyle = k; blob(c, cx - 15, cy - 8, 5); blob(c, cx + 15, cy - 8, 5); blob(c, cx, cy + 6, 6);
  } },
  // ground
  pave: { draw(c, W, H, base) {   // warm square pavers for the front yard
    const r = rng(37); base = tint(base); c.fillStyle = shade(base, -.2); c.fillRect(0, 0, W, H);
    const n = 4, s = W / n;
    for (let j = 0; j < n; j++) for (let i = -1; i < n; i++) {
      const x = i * s + (j % 2) * s / 2, y = j * s, col = shade(base, (r() - .5) * .08);
      hwrap(W, x, s, X => { c.fillStyle = col; roundRect(c, X + 4, y + 4, s - 8, s - 8, 10); c.fill(); c.fillStyle = shade(col, .05); roundRect(c, X + 10, y + 9, s - 26, 10, 5); c.fill(); });
    }
    speckle(c, W, H, 2400, r, .12, 2); mottle(c, W, H, base, 10, r, .02, .25);
  } },
  walk: { draw(c, W, H, base) {   // sidewalk blocks in running bond
    const r = rng(41); base = tint(base); c.fillStyle = shade(base, -.22); c.fillRect(0, 0, W, H);
    const rows = 8, rh = H / rows, bw = W / 4, cols = [base, shade(base, .04), shade(base, -.05), shade(base, -.02), '#e9c9b4'];
    for (let j = 0; j < rows; j++) for (let x = -bw + (j % 2) * bw / 2; x < W; x += bw) { const col = r.pick(cols); c.fillStyle = col; roundRect(c, x + 3, j * rh + 3, bw - 6, rh - 6, 6); c.fill(); c.fillStyle = shade(col, .06); c.fillRect(x + 8, j * rh + 6, bw - 16, 3); }
    speckle(c, W, H, 2200, r, .1, 2);
  } },
  asphalt: { size: [1024, 1024], draw(c, W, H) {   // the street: 2.4 wide per repeat, the whole width of the road down v
    const r = rng(43), base = tint('#8d8494'); c.fillStyle = base; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 60, lt = r() < .5; wrapAt(W, H, x, y, rad, (X, Y) => { c.fillStyle = lt ? 'rgba(255,255,255,.04)' : 'rgba(30,15,45,.05)'; blob(c, X, Y, rad); }); }
    for (let i = 0; i < 6000; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.15)' : 'rgba(30,20,50,.18)'; c.fillRect(r() * W, r() * H, 2, 2); }
    c.strokeStyle = 'rgba(40,25,55,.35)'; c.lineWidth = 2.2;
    for (const pts of [[[60, 300], [110, 330], [130, 390], [190, 400]], [[700, 640], [740, 610], [800, 606], [830, 560]]]) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
    c.fillStyle = '#f7f3ea'; c.fillRect(0, H * .07, W, 9); c.fillRect(0, H * .93 - 9, W, 9);
    c.fillRect(W * .05, H * .5 - 7, W * .5, 14);
  } },
  zebra: { size: [512, 1024], rep: false, draw(c, W, H) { c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(250,247,238,.95)'; for (let k = 0; k < 6; k++) { roundRect(c, k * W / 6 + 10, H * .04, W / 6 - 20, H * .92, 6); c.fill(); } } },
};
function TX(key) {
  let t = TXC.get(key); if (t) return t;
  const [kind, ...a] = key.split('|'), d = TD[kind], [w, hh] = d.size || [512, 512];
  t = canvasTex(w, hh, (c, W, H) => d.draw(c, W, H, ...a));
  if (d.rep !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.name = key;   // (look.js lights the 'glass|…' ones at night)
  TXC.set(key, t);
  return t;
}

// ═════════════════════════════════════════ building elements ═════════════════════════════════════════
// All take the part api A and a placement matrix M0 (origin on the wall face, +z out of the wall).
// two tiled slabs meeting at a ridge along local x, eaves toward ±z; M0 at the top of the walls, centred
function gableInto(A, M0, { len, span, rise, overX = .18, overZ = .3, t = .1, tile, ts = .6, fascia = '#fffaf0', ridge, gutter = null }) {
  const a = Math.atan2(rise, span / 2), run = span / 2 + overZ, e = .06, L = run / Math.cos(a) + e, sm = (run / Math.cos(a) - e) / 2;
  const yc = rise - sm * Math.sin(a) + t / 2 * Math.cos(a), zc = sm * Math.cos(a) + t / 2 * Math.sin(a), Wd = len + 2 * overX;
  for (const side of [0, 1]) {
    const S = M0.clone().multiply(Mx(0, 0, 0, 0, side * PI, 0)).multiply(Mx(0, yc, zc, a));
    A.tex(Gm.box(Wd, t, L, .015), tile, [ts], S);
    A.add(Gm.box(Wd + .03, t * 1.35, .05, .012), fascia, at(S, 0, -t * .1, L / 2 + .025));
    for (const sx of [-1, 1]) A.add(Gm.box(.05, t * 1.35, L + .05, .012), fascia, at(S, sx * (Wd / 2 + .025), -t * .1, .025));
    if (gutter && !side) { A.add(Gm.cyl(.042, .042, Wd + .06, 10), gutter, at(S, 0, -t * .75, L / 2 + .07, 0, 0, HP)); }
  }
  A.add(Gm.cyl(t * .78, t * .78, Wd + .06, 12), ridge, at(M0, 0, rise + t * 1.05, 0, 0, 0, HP));
}
// one tiled slab leaning off a wall: from (0, 0, 0) out to (0, -drop, depth)
function shedInto(A, M0, { len, depth, drop, t = .07, tile, ts = .5, fascia = '#fffaf0' }) {
  const a = Math.atan2(drop, depth), L = depth / Math.cos(a) + .02, sm = L / 2 - .02;
  const S = at(M0, 0, -sm * Math.sin(a) + t / 2 * Math.cos(a), sm * Math.cos(a) + t / 2 * Math.sin(a), a);
  A.tex(Gm.box(len, t, L, .012), tile, [ts], S);
  A.add(Gm.box(len + .03, t * 1.4, .045, .01), fascia, at(S, 0, -t * .1, L / 2 + .022));
  for (const sx of [-1, 1]) A.add(Gm.box(.045, t * 1.4, L + .04, .01), fascia, at(S, sx * (len / 2 + .022), -t * .1, .02));
}
// a framed window with lit glass; options: curtains/shoji/blind/lace, mullions, sill, head, shutters, bars
function winInto(A, M0, { w = .62, h = .6, frame = '#ffffff', glass = 'curtain', cur = '#ff9fb5', mull = 'cross', sill = '#ffffff', head = null, shutter = null, bars = null }) {
  const fw = .065, fd = .075, T = (...a) => at(M0, ...a);
  A.tex(Gm.plane(w - fw, h - fw), `glass|${glass}|${cur}`, 'fit', T(0, 0, .014));
  A.add(Gm.box(w, fw, fd, .018), frame, T(0, h / 2 - fw / 2, fd / 2 - .012));
  A.add(Gm.box(w, fw, fd, .018), frame, T(0, -h / 2 + fw / 2, fd / 2 - .012));
  for (const s of [-1, 1]) A.add(Gm.box(fw, h - 2 * fw + .004, fd, .018), frame, T(s * (w / 2 - fw / 2), 0, fd / 2 - .012));
  if (mull === 'cross' || mull === 'v') A.add(Gm.box(.032, h - fw, .03, .008), frame, T(0, 0, .036));
  if (mull === 'cross') A.add(Gm.box(w - fw, .032, .03, .008), frame, T(0, 0, .037));
  if (mull === 'h') A.add(Gm.box(w - fw, .036, .03, .008), frame, T(0, h * .14, .036));
  if (sill) A.add(Gm.box(w + .13, .05, .13, .016), sill, T(0, -h / 2 - .022, .062));
  if (head) A.add(Gm.box(w + .11, .07, .1, .02), head, T(0, h / 2 + .034, .046));
  if (shutter) for (const s of [-1, 1]) {
    const sw = w * .42, x = s * (w / 2 + sw / 2 + .03);
    A.add(Gm.box(sw, h + .02, .04, .012), shutter, T(x, 0, .022));
    for (let k = 0; k < 6; k++) A.add(Gm.box(sw - .055, .022, .016, .005), shade(shutter, -.14), T(x, -h / 2 + .09 + k * (h - .18) / 5, .046));
  }
  if (bars) { const n = bars.n || 5; for (let k = 1; k < n; k++) A.add(Gm.box(.022, h - .02, .022, .006), bars.c, T(-w / 2 + k * w / n, 0, .1)); A.add(Gm.box(w, .03, .03, .008), bars.c, T(0, h / 2 - .05, .1)); A.add(Gm.box(w, .03, .03, .008), bars.c, T(0, -h / 2 + .05, .1)); }
}
function roundWinInto(A, M0, { r = .17, frame = '#ffffff', glass = 'lace', cur = '#ffffff' }) {
  A.tex(Gm.circle(r - .02), `glass|${glass}|${cur}`, 'fit', at(M0, 0, 0, .012));
  A.add(Gm.tor(r, .038, PI * 2, 26), frame, at(M0, 0, 0, .03));
  A.add(Gm.box(.026, r * 2 - .03, .024, .006), frame, at(M0, 0, 0, .03)); A.add(Gm.box(r * 2 - .03, .026, .024, .006), frame, at(M0, 0, 0, .031));
}
// flower box hung under a sill: a planter with leaves and pom-pom flowers; M0 at the box's top, on the wall
function boxInto(A, M0, { w = .7, color = '#c98a52', flowers = ['#ff6f91', '#ffd84a', '#ffffff'], seed = 1, leaf = ['#5fc45a', '#4ea85a', '#7fd06a'] }) {
  const r = rng(seed), T = (...a) => at(M0, ...a);
  A.add(Gm.box(w, .14, .17, .03), color, T(0, -.07, .1));
  A.add(Gm.box(w + .03, .03, .19, .01), shade(color, -.12), T(0, -.01, .1));
  const n = Math.max(3, Math.round(w / .085));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + .055 + i * (w - .11) / (n - 1);
    A.add(Gm.sph(.058, 9, 7), r.pick(leaf), T(x, .045 + r() * .03, .07 + r() * .06, 0, r() * 3, 0, [1, .8, 1]));
    if (i % 2 === 0 || r() < .45) A.add(Gm.sph(.043, 9, 7), r.pick(flowers), T(x + (r() - .5) * .04, .105 + r() * .045, .1 + r() * .05));
  }
}
// a door leaf in its casing, with steps up to it; base = height of the threshold above the ground
function doorInto(A, M0, { w = .64, h = 1.02, color = '#4f9a6e', style = 'panel', casing = '#ffffff', base = .2, step = '#e3d9cc', knob = '#ffd84a', steps = true, lintel = true }) {
  const T = (...a) => at(M0, ...a);
  A.tex(new THREE.BoxGeometry(w, h, .05), `door|${color}|${style}`, null, T(0, base + h / 2, .015));
  if (lintel) A.add(Gm.box(w + .18, .09, .09, .02), casing, T(0, base + h + .045, .04));
  for (const s of [-1, 1]) A.add(Gm.box(.09, h + .02, .09, .02), casing, T(s * (w / 2 + .045), base + h / 2 - .01, .04));
  A.add(Gm.sph(.036, 10, 8), knob, T(w * .34, base + h * .47, .07));
  A.add(Gm.box(.03, .07, .02, .006), knob, T(w * .34, base + h * .47, .045));
  if (steps && base > .05) {
    A.tex(Gm.box(w + .5, base / 2, .44, .02), 'stone|' + step, 1, T(0, base / 4, .22));
    A.tex(Gm.box(w + .32, base, .22, .02), 'stone|' + step, 1, T(0, base / 2, .11));
  }
}
function lampInto(A, M0, glow = '#ffd27a', frame = '#3b3550') {
  const T = (...a) => at(M0, ...a);
  A.add(Gm.box(.05, .05, .16, .012), frame, T(0, .14, .08));
  A.add(Gm.box(.15, .02, .15, .006), frame, T(0, -.09, .16)); A.add(Gm.cone(.12, .08, 4), frame, T(0, .12, .16, 0, PI / 4, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.add(Gm.box(.022, .19, .022, .006), frame, T(sx * .058, .015, .16 + sz * .058));
  A.glow(Gm.box(.1, .16, .1, .02), glow, T(0, .01, .16));
}
// potted plant on the ground: kind 'bush' | 'tall' | 'flower'
function potInto(A, M0, { s = 1, pot = '#e88a5c', kind = 'bush', seed = 3, flower = '#ff6f91' }) {
  const r = rng(seed), T = (...a) => at(M0, ...a);
  A.add(Gm.cyl(.11 * s, .085 * s, .17 * s, 14), pot, T(0, .085 * s, 0));
  A.add(Gm.cyl(.122 * s, .122 * s, .04 * s, 14), shade(pot, -.08), T(0, .17 * s, 0));
  A.add(Gm.cyl(.1 * s, .1 * s, .02 * s, 12), '#7a5536', T(0, .182 * s, 0));
  const lv = ['#5fc45a', '#4ea85a', '#7fd06a'];
  if (kind === 'tall') for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2 + r(); A.add(Gm.sph(.06 * s, 9, 7), r.pick(lv), T(Math.cos(a) * .045 * s, .36 * s + r() * .1 * s, Math.sin(a) * .045 * s, Math.sin(a) * .35, 0, -Math.cos(a) * .35, [1, 3.2, .55])); }
  else for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + r(); A.add(Gm.sph((.08 + r() * .03) * s, 10, 8), r.pick(lv), T(Math.cos(a) * .07 * s, (.27 + r() * .08) * s, Math.sin(a) * .07 * s)); }
  if (kind !== 'tall') A.add(Gm.sph(.1 * s, 10, 8), r.pick(lv), T(0, .36 * s, 0));
  if (kind === 'flower') for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + r(); A.add(Gm.sph(.045 * s, 9, 7), i % 2 ? flower : '#ffffff', T(Math.cos(a) * .1 * s, (.36 + r() * .06) * s, Math.sin(a) * .1 * s)); }
}
// a fluffy round tree (one outline): trunk, a couple of branches and a clump of leaf balls
function tree(seed = 1, { s = 1, leaf = ['#5fbf5a', '#4caa55', '#79cf68'], bark = '#a8683f', fruit = null } = {}) {
  const g = part(`tree|${seed}|${leaf[0]}|${fruit}`, A => {
    const r = rng(seed);
    A.add(Gm.cyl(.08, .13, 1.0, 10), bark, 0, .5, 0);
    A.tube([0, .7, 0], [.25, 1.05, .05], .045, bark); A.tube([0, .78, 0], [-.22, 1.1, -.06], .04, bark);
    const balls = [[0, 1.45, 0, .5], [.34, 1.28, .12, .36], [-.34, 1.3, .05, .37], [.1, 1.72, -.08, .36], [-.14, 1.24, .3, .3], [.18, 1.22, -.3, .32], [-.2, 1.62, .16, .3]];
    for (const [x, y, z, rr] of balls) A.add(Gm.sph(rr, 14, 10), r.pick(leaf), x + (r() - .5) * .05, y, z);
    if (fruit) for (let i = 0; i < 9; i++) { const a = r() * PI * 2, y = 1.2 + r() * .6; A.add(Gm.sph(.045, 8, 6), fruit, Math.cos(a) * .48, y, Math.sin(a) * .48); }
  });
  g.scale.setScalar(s); g.userData.tree = true;
  return g;
}
// a clipped hedge along x with a few flowers
function hedge(len, seed = 1, { color = '#4fa85a', flowers = ['#ff8fb8', '#ffffff'], hgt = .5 } = {}) {
  return part(`hedge|${len}|${seed}|${color}|${hgt}`, A => {
    const r = rng(seed);
    A.add(Gm.box(len, hgt, .42, .16), color, 0, hgt / 2, 0);
    for (let x = -len / 2 + .12; x <= len / 2 - .1; x += .26) A.add(Gm.sph(.17 + r() * .05, 12, 9), shade(color, (r() - .5) * .08), x, hgt - .02 + r() * .05, (r() - .5) * .12);
    for (let x = -len / 2 + .15; x < len / 2 - .1; x += .22 + r() * .2) A.add(Gm.sph(.04, 8, 6), r.pick(flowers), x, .2 + r() * (hgt - .1), .2);
  });
}

// ═════════════════════════════════════════ the houses ═════════════════════════════════════════
// Each returns a Group: origin = footprint centre on the ground, front toward +z. userData.front = how far the door
// side reaches (z), userData.chimney = local top of the chimney.
function houseMong() {
  const g = new THREE.Group(), W = 3.0, D = 2.0, H1 = 1.3, Hw = 2.36, rise = .62, F = D / 2;
  const WALL = '#fff3df', WOOD = '#a8683f', TRIM = '#fffaf0', ROOF = '#e65a43', GREEN = '#3f8f6a';
  g.add(part('mong-base', A => {
    A.tex(Gm.box(W + .08, .2, D + .08, .02), 'stone|#e3d9cc', 1, 0, .1, 0);
    A.tex(new THREE.BoxGeometry(W, Hw - .2, D), 'plaster|' + WALL, 1.2, 0, .2 + (Hw - .2) / 2, 0);
    A.tex(prismX(W, D, rise - .012), 'plaster|' + WALL, 1.2, 0, Hw, 0);
    A.add(Gm.box(W + .07, .1, D + .07, .02), WOOD, 0, H1, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.add(Gm.box(.1, Hw - .2, .1, .02), WOOD, sx * (W / 2 - .015), .2 + (Hw - .2) / 2, sz * (D / 2 - .015));
    A.add(Gm.box(W + .07, .08, D + .07, .02), WOOD, 0, Hw - .04, 0);
  }));
  g.add(part('mong-roof', A => {
    gableInto(A, Mx(0, Hw, 0), { len: W, span: D, rise, overX: .22, overZ: .3, t: .11, tile: 'tile|' + ROOF, ts: .78, fascia: TRIM, ridge: shade(ROOF, -.14), gutter: '#c9cfe0' });
    A.add(Gm.cyl(.035, .035, Hw + .15, 8), '#c9cfe0', W / 2 - .12, (Hw + .15) / 2, F + .1);
  }));
  // an attic dormer on the front slope (the roof would otherwise be one big field of tiles)
  g.add(part('mong-dormer', A => {
    const dx = -.74, z0 = .24, z1 = .9, dw = .62, dh = .62, dy = Hw + .02, zc = (z0 + z1) / 2;
    A.tex(Gm.box(dw, dh, z1 - z0, .01), 'plaster|' + WALL, 1.2, dx, dy + dh / 2, zc);
    A.tex(prismZ(z1 - z0, dw, .2), 'plaster|' + WALL, 1.2, dx, dy + dh, zc);
    for (const sx of [-1, 1]) A.add(Gm.box(.06, dh, .06, .015), WOOD, dx + sx * (dw / 2 - .01), dy + dh / 2, z1 - .01);
    gableInto(A, Mx(dx, dy + dh, zc, 0, HP, 0), { len: z1 - z0, span: dw, rise: .2, overX: .07, overZ: .07, t: .06, tile: 'tile|' + ROOF, ts: .78, fascia: TRIM, ridge: shade(ROOF, -.14) });
    winInto(A, Mx(dx, dy + .4, z1), { w: .36, h: .3, cur: '#ffb3c7', mull: 'cross', sill: TRIM });
  }));
  // brick chimney on the back slope, poking up past the ridge
  const yb = Hw + rise * (1 - .48 / F) - .15, yt = Hw + rise + .42;
  g.add(part('mong-chim', A => {
    A.tex(Gm.box(.38, yt - yb, .38, .02), 'brick|#c66a4a', .9, .95, (yb + yt) / 2, -.48);
    A.add(Gm.box(.48, .08, .48, .02), '#8a8496', .95, yt + .04, -.48);
    A.add(Gm.cyl(.08, .09, .16, 12), '#b9b2c4', .95, yt + .16, -.48);
  }));
  g.userData.chimney = V3(.95, yt + .3, -.48);
  // the porch: a balcony over the front door on two wooden posts, its railing carrying the name board
  g.add(part('mong-porch', A => {
    const bw = 1.32, bd = .62, by = H1 + .02;
    A.add(Gm.box(bw, .1, bd, .025), WOOD, 0, by, F + bd / 2);
    A.add(Gm.box(bw + .04, .035, bd + .02, .01), shade(WOOD, .1), 0, by + .066, F + bd / 2);
    for (const sx of [-1, 1]) { A.add(Gm.box(.09, by - .2, .09, .02), WOOD, sx * (bw / 2 - .07), .2 + (by - .2) / 2, F + bd - .08); A.add(Gm.box(.18, .2, .18, .03), '#d9cfc2', sx * (bw / 2 - .07), .1, F + bd - .08); }
    const ry = by + .08, rh = .44;
    A.add(Gm.box(bw, .05, .06, .015), GREEN, 0, ry + rh, F + bd - .03);
    for (const sx of [-1, 1]) A.add(Gm.box(.05, .05, bd, .015), GREEN, sx * (bw / 2 - .025), ry + rh, F + bd / 2);
    for (let x = -bw / 2 + .06; x <= bw / 2 - .05; x += .1) A.add(Gm.box(.025, rh, .025, .006), GREEN, x, ry + rh / 2, F + bd - .03);
    for (const sx of [-1, 1]) for (let z = F + .08; z < F + bd - .08; z += .1) A.add(Gm.box(.025, rh, .025, .006), GREEN, sx * (bw / 2 - .025), ry + rh / 2, z);
    A.tex(new THREE.BoxGeometry(.66, .2, .03), 'sign|몽글이네|#c98a52|#fff8ec', null, 0, ry + .25, F + bd + .012);
    potInto(A, Mx(-.42, by + .05, F + .2), { s: .75, kind: 'flower', seed: 9, flower: '#ff6f91' });
    potInto(A, Mx(.44, by + .05, F + .2), { s: .8, kind: 'tall', seed: 6, pot: '#7fa6d8' });
  }));
  g.add(part('mong-door', A => {
    doorInto(A, Mx(0, 0, F), { w: .66, h: 1.0, color: '#4f9a6e', style: 'panel', casing: TRIM, base: .2 });
    doorInto(A, Mx(0, 0, F), { w: .54, h: .82, color: '#fff2d6', style: 'glass', casing: TRIM, base: H1 + .08, steps: false });
  }));
  // a wreath on the door
  g.add(part('mong-wreath', A => {
    const r = rng(8);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; A.add(Gm.sph(.042, 8, 6), i % 2 ? '#4ea85a' : '#6cc46a', Math.cos(a) * .12, .9 + Math.sin(a) * .12, F + .07); }
    for (let i = 0; i < 5; i++) { const a = r() * PI * 2; A.add(Gm.sph(.024, 8, 6), '#ff5d6a', Math.cos(a) * .12, .9 + Math.sin(a) * .12, F + .1); }
    A.add(Gm.box(.08, .05, .03, .01), '#ff5d6a', 0, .9 - .13, F + .1);
  }));
  g.add(part('mong-lamp', A => lampInto(A, Mx(.52, .98, F))));
  g.add(part('mong-wins', A => {
    winInto(A, Mx(-1.0, .86, F), { w: .74, h: .62, cur: '#ff8fb3', head: WOOD });
    winInto(A, Mx(1.0, .86, F), { w: .62, h: .62, cur: '#ffcf5a', head: WOOD, mull: 'v' });
    winInto(A, Mx(-1.0, H1 + .55, F), { w: .62, h: .52, cur: '#8fc8f4', head: WOOD });
    winInto(A, Mx(1.0, H1 + .55, F), { w: .62, h: .52, cur: '#c9a7ff', head: WOOD });
    for (const sx of [-1, 1]) {
      winInto(A, Mx(sx * W / 2, .86, -.15, 0, sx * HP, 0), { w: .56, h: .6, cur: sx > 0 ? '#ffb27a' : '#9be38f', head: WOOD });
      winInto(A, Mx(sx * W / 2, H1 + .55, -.15, 0, sx * HP, 0), { w: .5, h: .48, glass: 'blind', head: WOOD });
      roundWinInto(A, Mx(sx * W / 2, Hw + .25, 0, 0, sx * HP, 0), { r: .13, frame: TRIM, glass: 'lace' });
    }
  }));
  g.add(part('mong-boxes', A => {
    boxInto(A, Mx(-1.0, .86 - .31 - .05, F), { w: .84, seed: 11 });
    boxInto(A, Mx(1.0, .86 - .31 - .05, F), { w: .72, seed: 12, flowers: ['#ff6f91', '#c9a7ff', '#ffffff'] });
    boxInto(A, Mx(-1.0, H1 + .55 - .26 - .05, F), { w: .7, seed: 13, color: '#e8a06a', flowers: ['#ffd84a', '#ffffff'] });
    boxInto(A, Mx(1.0, H1 + .55 - .26 - .05, F), { w: .7, seed: 14, color: '#e8a06a', flowers: ['#ff8fb8', '#ff6f91'] });
  }));
  g.add(part('mong-pots', A => {
    potInto(A, Mx(-.62, 0, F + .26), { s: 1.15, kind: 'tall', seed: 21 });
    potInto(A, Mx(.68, 0, F + .24), { s: 1.0, kind: 'flower', seed: 22, pot: '#d9764e', flower: '#ffd84a' });
    potInto(A, Mx(-1.42, 0, F + .3), { s: .85, kind: 'bush', seed: 23, pot: '#7fa6d8' });
  }));
  g.add(part('mong-mat', A => A.tex(new THREE.BoxGeometry(.62, .016, .4), 'mat|#e7b979', null, 0, .008, F + .62)));
  g.userData.front = F + .82;
  return g;
}

// 토순이: a pink plaster cottage with a steep fish-scale front gable, a round-top door and a striped awning
function houseBunny() {
  const g = new THREE.Group(), W = 2.3, D = 2.0, H = 1.48, rise = 1.15, F = D / 2;
  const WALL = '#ffdbe3', ROOF = '#f293a8', TRIM = '#ffffff';
  g.add(part('bun-base', A => {
    A.tex(Gm.box(W + .08, .16, D + .08, .02), 'stone|#e3d9cc', 1, 0, .08, 0);
    A.tex(new THREE.BoxGeometry(W, H - .16, D), 'plaster|' + WALL, 1.2, 0, .16 + (H - .16) / 2, 0);
    A.tex(prismZ(D, W, rise - .012), 'plaster|' + WALL, 1.2, 0, H, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.add(Gm.box(.09, H - .16, .09, .02), TRIM, sx * (W / 2 - .015), .16 + (H - .16) / 2, sz * (D / 2 - .015));
    A.add(Gm.box(W + .06, .07, D + .06, .02), TRIM, 0, H - .035, 0);
  }));
  g.add(part('bun-roof', A => {
    gableInto(A, Mx(0, H, 0, 0, HP, 0), { len: D, span: W, rise, overX: .26, overZ: .26, t: .1, tile: 'scale|' + ROOF, ts: .62, fascia: TRIM, ridge: shade(ROOF, -.15) });
    // the weathervane: a bunny head on a pole at the front of the ridge
    const z = D / 2 + .1, y = H + rise + .1;
    A.add(Gm.cyl(.018, .018, .42, 6), '#8a8496', 0, y + .21, z);
    A.add(Gm.sph(.1, 12, 9), '#ffc2d4', 0, y + .48, z);
    for (const sx of [-1, 1]) A.add(Gm.sph(.04, 9, 7), '#ffc2d4', sx * .045, y + .62, z, 0, 0, sx * -.2, [1, 2.6, .8]);
  }));
  g.add(part('bun-door', A => {
    doorInto(A, Mx(.5, 0, F), { w: .6, h: .9, color: '#ff8fb3', style: 'heart', casing: TRIM, base: .16, step: '#e3d9cc', lintel: false });
    A.add(Gm.cyl(.3, .3, .04, 22), '#ff8fb3', .5, .16 + .9, F + .012, HP);
    A.add(Gm.tor(.345, .045, PI, 18), TRIM, .5, .16 + .9, F + .04);
    A.tex(new THREE.BoxGeometry(.48, .15, .03), 'sign|토순이네|#ffffff|#ff5d8a', null, 0, H + .13, F + .015);
  }));
  g.add(part('bun-wins', A => {
    winInto(A, Mx(-.42, .78, F), { w: .7, h: .58, cur: '#ffffff', glass: 'lace', frame: TRIM });
    roundWinInto(A, Mx(0, H + .55, F), { r: .2, frame: TRIM, glass: 'curtain', cur: '#ff8fb3' });
    for (const sx of [-1, 1]) winInto(A, Mx(sx * W / 2, .8, 0, 0, sx * HP, 0), { w: .56, h: .56, cur: '#ffd84a', frame: TRIM });
  }));
  g.add(part('bun-awning', A => {
    shedInto(A, Mx(-.42, 1.24, F), { len: .9, depth: .36, drop: .2, t: .03, tile: 'stripes|#ff7aa0|#ffffff', ts: .5, fascia: '#ff7aa0' });
    for (let k = 0; k < 7; k++) A.add(Gm.sph(.05, 10, 6), k % 2 ? '#ffffff' : '#ff7aa0', -.42 - .39 + k * .13, 1.24 - .2 - .02, F + .37, 0, 0, 0, [1, .7, .35]);
  }));
  g.add(part('bun-box', A => boxInto(A, Mx(-.42, .78 - .29 - .05, F), { w: .78, seed: 31, flowers: ['#ff9a3c', '#ffffff', '#ff6f91'] })));
  g.add(part('bun-garden', A => {   // a carrot patch in front
    A.add(Gm.box(.9, .1, .44, .04), '#c98a52', -.5, .05, F + .55);
    A.add(Gm.box(.84, .03, .38, .01), '#7a5536', -.5, .095, F + .55);
    const r = rng(33);
    for (let i = 0; i < 6; i++) { const x = -.84 + i * .135, z = F + .48 + (i % 2) * .14; A.add(Gm.cone(.035, .14, 8), '#ff8a2c', x, .14, z, PI); for (let k = -1; k <= 1; k++) A.add(Gm.sph(.03, 7, 5), '#5fc45a', x + k * .025, .19 + r() * .02, z, 0, 0, k * .4, [.7, 2, .7]); }
  }));
  g.userData.front = F + .78;
  return g;
}

// 곰돌이: an American porch house — honey clapboard, white trim, a brown shingle roof and dormer, a deep front porch
function houseBear() {
  const g = new THREE.Group(), W = 2.8, D = 2.0, H = 1.5, rise = .9, F = D / 2, PD = .8;
  const SIDING = '#ffcf86', TRIM = '#ffffff', ROOF = '#8f5e48', DECK = '#d9a066';
  g.add(part('bear-base', A => {
    A.tex(Gm.box(W + .08, .18, D + .08, .02), 'brick|#b8695a|#e9dccb', .9, 0, .09, 0);
    A.tex(new THREE.BoxGeometry(W, H - .18, D), 'siding|' + SIDING, 1, 0, .18 + (H - .18) / 2, 0);
    A.tex(prismX(W, D, rise - .012), 'siding|' + SIDING, 1, 0, H, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) A.add(Gm.box(.1, H - .18, .1, .02), TRIM, sx * (W / 2 - .015), .18 + (H - .18) / 2, sz * (D / 2 - .015));
  }));
  g.add(part('bear-roof', A => {
    gableInto(A, Mx(0, H, 0), { len: W, span: D, rise, overX: .2, overZ: .14, t: .1, tile: 'shingle|' + ROOF, ts: .8, fascia: TRIM, ridge: shade(ROOF, -.15) });
    // dormer on the front slope
    const dz = .45, dy = H + rise - dz * (rise / (D / 2)) - .22;
    A.tex(Gm.box(.66, .56, .7, .01), 'siding|' + SIDING, 1, 0, dy + .28, dz);
    A.tex(prismZ(.7, .66, .3), 'siding|' + SIDING, 1, 0, dy + .56, dz);
    gableInto(A, Mx(0, dy + .56, dz, 0, HP, 0), { len: .7, span: .66, rise: .3, overX: .08, overZ: .1, t: .06, tile: 'shingle|' + ROOF, ts: .8, fascia: TRIM, ridge: shade(ROOF, -.15) });
    winInto(A, Mx(0, dy + .3, dz + .35), { w: .38, h: .34, cur: '#ffffff', glass: 'lace', mull: 'cross', sill: null });
  }));
  g.add(part('bear-porch', A => {
    const cx = [-1.22, -.45, .45, 1.22], zf = F + PD - .08;
    A.tex(Gm.box(W - .1, .18, PD, .02), 'siding|' + DECK, .7, 0, .09, F + PD / 2);
    for (const x of cx) { A.add(Gm.box(.1, 1.05, .1, .02), TRIM, x, .18 + .525, zf); A.add(Gm.box(.15, .07, .15, .02), TRIM, x, .21, zf); }
    for (const [x0, x1] of [[cx[0], cx[1]], [cx[2], cx[3]]]) {
      A.add(Gm.box(x1 - x0, .045, .06, .012), TRIM, (x0 + x1) / 2, .62, zf);
      A.add(Gm.box(x1 - x0, .04, .05, .012), TRIM, (x0 + x1) / 2, .28, zf);
      for (let x = x0 + .09; x < x1 - .05; x += .085) A.add(Gm.box(.03, .34, .03, .008), TRIM, x, .45, zf);
    }
    for (const sx of [-1, 1]) { A.add(Gm.box(.045, .045, PD - .1, .012), TRIM, sx * 1.22, .62, F + (PD - .1) / 2); for (let z = F + .1; z < zf - .04; z += .085) A.add(Gm.box(.03, .34, .03, .008), TRIM, sx * 1.22, .45, z); }
    A.tex(Gm.box(.84, .09, .26, .02), 'siding|' + DECK, .7, 0, .045, F + PD + .13);
    shedInto(A, Mx(0, 1.32, F), { len: W + .1, depth: PD + .1, drop: .16, t: .07, tile: 'shingle|' + ROOF, ts: .8, fascia: TRIM });
    A.tex(new THREE.BoxGeometry(.5, .155, .03), 'sign|곰돌이네|#7a4e3a|#ffe2a8', null, 0, 1.06, zf);
    A.add(Gm.cyl(.006, .006, .1, 4), '#3b3550', -.2, 1.17, zf); A.add(Gm.cyl(.006, .006, .1, 4), '#3b3550', .2, 1.17, zf);
    // hanging flower baskets
    for (const x of [-.82, .82]) { A.tube([x, 1.22, zf - .12], [x, 1.02, zf - .12], .006, '#3b3550'); A.add(Gm.sph(.1, 10, 7), '#c98a52', x, .97, zf - .12, 0, 0, 0, [1, .6, 1]); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; A.add(Gm.sph(.05, 8, 6), k % 2 ? '#ff6f91' : '#5fc45a', x + Math.cos(a) * .08, 1.0, zf - .12 + Math.sin(a) * .08); } }
  }));
  g.add(part('bear-door', A => doorInto(A, Mx(0, .18, F), { w: .62, h: .96, color: '#d9534a', style: 'glass', casing: TRIM, base: .0, steps: false })));
  g.add(part('bear-wins', A => {
    for (const sx of [-1, 1]) winInto(A, Mx(sx * .88, .86, F), { w: .46, h: .7, cur: '#ffffff', glass: 'lace', mull: 'h', shutter: '#3f6f5a', head: TRIM });
    for (const sx of [-1, 1]) winInto(A, Mx(sx * W / 2, .86, 0, 0, sx * HP, 0), { w: .52, h: .64, glass: 'blind', mull: 'h', head: TRIM });
  }));
  g.add(part('bear-chair', A => {   // a rocking chair and a honey pot on the porch
    const x = .85, z = F + .36;
    for (const sx of [-1, 1]) { A.add(Gm.tor(.24, .018, PI * .5, 10), '#a8683f', x + sx * .14, .2 + .18, z, 0, HP, PI * .75); A.add(Gm.box(.035, .5, .035, .01), '#a8683f', x + sx * .14, .45 + .18, z - .14, -.1); A.add(Gm.box(.035, .22, .035, .01), '#a8683f', x + sx * .14, .3 + .18, z + .1); }
    A.add(Gm.box(.34, .04, .3, .01), '#c98a52', x, .32 + .18, z); A.add(Gm.box(.34, .3, .04, .01), '#c98a52', x, .55 + .18, z - .15, -.1);
    A.add(Gm.box(.3, .06, .26, .02), '#ff8f6a', x, .36 + .18, z);
    const hx = -.85, hz = F + .3;
    A.add(Gm.cyl(.1, .12, .2, 16), '#ffc23d', hx, .28, hz); A.add(Gm.cyl(.08, .1, .04, 16), '#e8a020', hx, .4, hz); A.add(Gm.sph(.06, 10, 6), '#ffd84a', hx, .43, hz, 0, 0, 0, [1, .5, 1]);
  }));
  g.userData.front = F + PD + .26;
  return g;
}

// 냥냥이: a Japanese town house — dark wood boards below, white plaster above, grey-blue kawara, a pent roof, noren
function houseCat() {
  const g = new THREE.Group(), W = 2.5, D = 2.0, H1 = 1.3, Hw = 2.24, rise = .66, F = D / 2;
  const WOOD = '#8a5a3c', PLAS = '#fbf6ec', ROOF = '#6b7b9b', DARK = '#5b3a28';
  g.add(part('cat-base', A => {
    A.tex(Gm.box(W + .08, .14, D + .08, .02), 'stone|#d6cfc6', 1, 0, .07, 0);
    A.tex(new THREE.BoxGeometry(W, H1 - .14, D), 'boards|' + WOOD, 1, 0, .14 + (H1 - .14) / 2, 0);
    A.tex(new THREE.BoxGeometry(W - .02, Hw - H1, D - .02), 'plaster|' + PLAS, 1.2, 0, H1 + (Hw - H1) / 2, 0);
    A.tex(prismX(W - .02, D - .02, rise - .012), 'plaster|' + PLAS, 1.2, 0, Hw, 0);
    A.add(Gm.box(W + .06, .08, D + .06, .02), DARK, 0, H1, 0);
    for (const x of [-W / 2 + .02, -.86, .86, W / 2 - .02]) A.add(Gm.box(.08, Hw - H1, .08, .015), DARK, x, H1 + (Hw - H1) / 2, F - .02);
    for (const sx of [-1, 1]) A.add(Gm.box(.08, Hw - H1, .08, .015), DARK, sx * (W / 2 - .02), H1 + (Hw - H1) / 2, -F + .02);
    A.add(Gm.box(W + .05, .07, D + .05, .015), DARK, 0, Hw - .035, 0);
  }));
  g.add(part('cat-roof', A => {
    gableInto(A, Mx(0, Hw, 0), { len: W, span: D, rise, overX: .22, overZ: .26, t: .1, tile: 'kawara|' + ROOF, ts: .6, fascia: '#3f465c', ridge: '#4a536b' });
    // cat ears on both ends of the ridge
    for (const sx of [-1, 1]) for (const ex of [-.09, .09]) A.add(Gm.cone(.075, .17, 4), '#4a536b', sx * (W / 2 + .2) + ex, Hw + rise + .23, 0, 0, PI / 4, 0, [1, 1, .55]);
    shedInto(A, Mx(0, H1 + .02, F), { len: W + .2, depth: .42, drop: .17, t: .07, tile: 'kawara|' + ROOF, ts: .6, fascia: '#3f465c' });
  }));
  g.add(part('cat-door', A => {
    doorInto(A, Mx(.52, 0, F), { w: .74, h: 1.0, color: '#c98a52', style: 'slide', casing: DARK, base: .14, step: '#d6cfc6', knob: '#3b3550' });
    A.tex(new THREE.BoxGeometry(.82, .36, .015), 'noren|#3fbfa5', null, .52, .14 + 1.0 - .2, F + .1);
    A.add(Gm.cyl(.015, .015, .9, 6), DARK, .52, .14 + 1.0 - .01, F + .1, 0, 0, HP);
    A.tex(new THREE.BoxGeometry(.46, .145, .03), 'sign|냥냥이네|#f4ead6|#5b3a28', null, -1.0, H1 + .2, F + .02);
  }));
  g.add(part('cat-wins', A => {
    // koshi lattice over shoji on the ground floor, the long slit window upstairs
    winInto(A, Mx(-.6, .72, F), { w: .82, h: .62, glass: 'shoji', frame: DARK, mull: null, sill: null, bars: { c: DARK, n: 9 } });
    winInto(A, Mx(0, H1 + .5, F), { w: 1.5, h: .32, glass: 'shoji', frame: DARK, mull: null, sill: null, bars: { c: PLAS, n: 12 } });
    for (const sx of [-1, 1]) winInto(A, Mx(sx * W / 2, .78, 0, 0, sx * HP, 0), { w: .58, h: .5, glass: 'shoji', frame: DARK, mull: null, sill: null });
  }));
  g.add(part('cat-lantern', A => {   // a paper lantern hanging under the pent roof
    const x = -.06, z = F + .3, y = 1.0;
    A.add(Gm.cyl(.012, .012, .2, 6), '#3b3550', x, y + .26, z);
    A.add(Gm.cyl(.07, .07, .04, 12), '#2a1d33', x, y + .15, z); A.add(Gm.cyl(.07, .07, .04, 12), '#2a1d33', x, y - .15, z);
    A.glow(Gm.sph(.13, 14, 10), '#ffe2b0', x, y, z, 0, 0, 0, [1, 1.15, 1]);
    for (const yy of [-.06, .06]) A.add(Gm.tor(.125, .01, PI * 2, 18), '#ff5a4a', x, y + yy, z, HP);
  }));
  g.add(part('cat-garden', A => {   // a stone lantern and a bamboo screen
    const x = -.78, z = F + .45;
    A.add(Gm.cyl(.13, .16, .08, 8), '#b9b2b6', x, .04, z); A.add(Gm.cyl(.05, .06, .3, 8), '#c9c3c7', x, .23, z);
    A.add(Gm.box(.2, .16, .2, .02), '#c9c3c7', x, .46, z); A.glow(Gm.box(.1, .08, .21, .01), '#ffe2b0', x, .46, z);
    A.add(Gm.cone(.2, .14, 4), '#aaa4a8', x, .61, z, 0, PI / 4, 0); A.add(Gm.sph(.04, 8, 6), '#aaa4a8', x, .69, z);
    for (let k = 0; k < 9; k++) A.add(Gm.cyl(.028, .028, .62, 8), k % 2 ? '#9cc46a' : '#86b85a', W / 2 + .05, .31, F - .1 - k * .062);
    for (const y of [.18, .46]) A.add(Gm.cyl(.018, .018, .6, 6), '#c98a52', W / 2 + .1, y, F - .35, HP);
  }));
  g.userData.front = F + .6;
  return g;
}

// 펭펭이: a Korean brick villa — three floors, white floor bands, blue window frames, a green rooftop with a water tank
function housePeng(T) {
  const g = new THREE.Group(), W = 2.4, D = 2.2, FH = 1.16, Hw = FH * 3, F = D / 2;
  const BRICK = '#c9785a', BAND = '#f4efe6', BLUE = '#4f7fd8';
  g.add(part('peng-base', A => {
    A.tex(Gm.box(W + .08, .14, D + .08, .02), 'stone|#d6cfc6', 1, 0, .07, 0);
    A.tex(new THREE.BoxGeometry(W, Hw - .14, D), 'brick|' + BRICK, 1, 0, .14 + (Hw - .14) / 2, 0);
    for (const y of [FH, FH * 2]) A.add(Gm.box(W + .07, .1, D + .07, .02), BAND, 0, y, 0);
    // parapet round the roof, the green rooftop floor
    A.add(Gm.box(W + .06, .32, .1, .02), BAND, 0, Hw + .16, F - .02); A.add(Gm.box(W + .06, .32, .1, .02), BAND, 0, Hw + .16, -F + .02);
    for (const sx of [-1, 1]) A.add(Gm.box(.1, .32, D - .1, .02), BAND, sx * (W / 2 - .02), Hw + .16, 0);
    A.add(Gm.box(W - .14, .02, D - .14, .006), '#4fb07a', 0, Hw + .01, 0);
    A.add(Gm.box(W + .1, .05, .16, .015), '#e2dbd0', 0, Hw + .34, F - .02); A.add(Gm.box(W + .1, .05, .16, .015), '#e2dbd0', 0, Hw + .34, -F + .02);
    for (const sx of [-1, 1]) A.add(Gm.box(.16, .05, D - .14, .015), '#e2dbd0', sx * (W / 2 - .02), Hw + .34, 0);
  }));
  g.add(part('peng-door', A => {
    doorInto(A, Mx(0, 0, F), { w: .7, h: .98, color: '#9aa3b8', style: 'steel', casing: '#e2dbd0', base: .14, step: '#d6cfc6', knob: '#e2dbd0' });
    A.add(Gm.box(1.06, .08, .52, .02), BAND, 0, 1.28, F + .26);
    A.tex(new THREE.BoxGeometry(.7, .22, .04), 'sign|펭펭빌라|' + BLUE + '|#ffffff', null, 0, 1.46, F + .025);
  }));
  g.add(part('peng-wins', A => {
    for (const sx of [-1, 1]) winInto(A, Mx(sx * .78, .66, F), { w: .5, h: .46, glass: 'blind', frame: '#ffffff', mull: 'v', bars: { c: '#6b7184', n: 6 } });
    for (const y of [FH + .6, FH * 2 + .58]) for (const sx of [-1, 1]) winInto(A, Mx(sx * .68, y, F), { w: .62, h: .6, frame: BLUE, cur: y > 2 ? '#ffd84a' : '#8fd3f4', sill: '#ffffff' });
    for (const y of [.66, FH + .6, FH * 2 + .58]) for (const sx of [-1, 1]) winInto(A, Mx(sx * W / 2, y, -.3, 0, sx * HP, 0), { w: .5, h: .48, frame: BLUE, glass: 'blind', mull: 'v' });
    // little balcony rails outside the third floor
    for (const sx of [-1, 1]) { const x = sx * .68, y = FH * 2 + .3; A.add(Gm.box(.82, .03, .2, .008), '#3b3550', x, y, F + .1); A.add(Gm.box(.82, .03, .03, .008), '#3b3550', x, y + .34, F + .19); for (let k = 0; k <= 8; k++) A.add(Gm.box(.016, .34, .016, .004), '#3b3550', x - .4 + k * .1, y + .17, F + .19); }
    // a wall-hung air-conditioner outside the second floor
    A.add(Gm.box(.46, .34, .24, .03), '#f4f6fa', W / 2 + .14, FH + .4, .3); A.add(Gm.cyl(.12, .12, .02, 18), '#b9c0cf', W / 2 + .27, FH + .4, .3, 0, 0, HP);
    A.add(Gm.box(.04, .04, .24, .01), '#8a8496', W / 2 + .04, FH + .21, .3);
  }));
  g.add(part('peng-boxes', A => { boxInto(A, Mx(-.68, FH + .6 - .3 - .05, F), { w: .72, seed: 41 }); boxInto(A, Mx(.68, FH + .6 - .3 - .05, F), { w: .72, seed: 42, flowers: ['#ffffff', '#8fb0ff', '#ffd84a'] }); }));
  // the rooftop: the blue water tank, potted greens and an antenna from the rooftop prop set
  const RT = T.rooftop || T.street;
  const tank = makeFurniture('watertank', RT).group; put(tank, -.55, Hw + .02, -.35, 0, .3, 0, .6); g.add(tank);
  const pots = makeFurniture('rooftopgarden', RT).group; put(pots, .55, Hw + .02, .35, 0, -.2, 0, .62); g.add(pots);
  const ant = makeFurniture('antenna', RT).group; put(ant, .7, Hw + .02, -.55, 0, .5, 0, .55); g.add(ant);
  g.userData.front = F + .52;
  return g;
}

// ═════════════════════════════════════════ the ground ═════════════════════════════════════════
// Lawn, yard paving, sidewalk and street are separate planes (sharp textures up close), all fading into the sky
// background by distance from the village centre (no floating island, the ground just runs off).
function groundMat(t) {
  const m = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ map: t, gradientMap: STYLE.grad, transparent: true, depthWrite: false })
    : new THREE.MeshStandardMaterial({ map: t, roughness: .9, transparent: true, depthWrite: false });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHw;').replace('#include <project_vertex>', '#include <project_vertex>\nvHw = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHw;')
      .replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n{ vec2 q = (vHw.xz - vec2(0., -.6)) * vec2(.82, 1.2); diffuseColor.a *= 1. - smoothstep(6.6, 11.5, length(q)); }');
  };
  m.customProgramCacheKey = () => 'home-fade';
  return m;
}
function gplane(x0, x1, z0, z1, t, s, y, order, uvFn = null) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-HP); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  if (s) planarUV(g, s);
  if (uvFn) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, ...uvFn(p.getX(i), p.getZ(i))); }
  const o = new THREE.Mesh(g, groundMat(t)); o.renderOrder = order; o.receiveShadow = true; o.userData.ground = true;
  return o;
}
const Z_WALK = 2.95, Z_KERB = 3.85, Z_ST0 = 3.97, Z_ST1 = 6.6;
let GRASS = null;
function neighbourhoodGround(root) {
  const grass = GRASS || (GRASS = groundTex('grass', { grass: '#a3d877' }));
  root.add(gplane(-17, 17, -15, 15, grass, 5, -.006, -4));
  root.add(gplane(-2.05, 2.05, -.12, Z_WALK, TX('pave|#efdcc0'), 1.2, -.003, -3));                 // 몽글이's paved yard
  root.add(gplane(-17, 17, Z_WALK, Z_KERB + .02, TX('walk|#e2d6c8'), 1, -.002, -3));              // sidewalk
  const asphalt = TX('asphalt'); asphalt.wrapT = THREE.ClampToEdgeWrapping;
  root.add(gplane(-17, 17, Z_ST0 - .02, Z_ST1, asphalt, 0, -.002, -3, (x, z) => [x / 2.4, (Z_ST1 - z) / (Z_ST1 - Z_ST0 + .02)]));   // street
  root.add(gplane(-3.35, -2.05, Z_ST0 + .1, Z_ST1 - .1, TX('zebra'), 0, -.001, -2, (x, z) => [(x + 3.35) / 1.3, (Z_ST1 - .1 - z) / (Z_ST1 - Z_ST0 - .2)]));
  // stepping stones up to the friends' doors
  root.add(part('steps-stones', A => {
    const r = rng(51);
    for (const [x, z0, z1] of [[-2.95, .62, 2.85], [3.9, .82, 2.85]]) for (let z = z0, k = 0; z < z1; z += .42, k++) A.tex(Gm.cyl(.17, .18, .03, 14), 'stone|#e3d9cc', 1, x + (k % 2 ? .08 : -.08), .012, z, 0, r() * 3, 0, [1.15, 1, .85]);
  }));
  // the kerb: one long stone strip between the sidewalk and the street
  root.add(part('kerb', A => A.tex(Gm.box(22, .07, .12, .02), 'stone|#d6cfc6', 1, 0, .025, (Z_KERB + Z_ST0) / 2)));
}

// ═════════════════════════════════════════ the village ═════════════════════════════════════════
// returns { main, fh: [{ k, g, x, z, ry, front }], solids: [objects characters keep out of] }
function buildVillage(root) {
  neighbourhoodGround(root);
  const T = THEMES, ST = T.street || T.my, PG = T.playground || ST;
  const solids = [];
  const add = (o, x, z, ry = 0, s = null, solid = true) => { put(o, x, 0, z, 0, ry, 0, s); root.add(o); if (solid) solids.push(o); return o; };
  const prop = (type, th, x, z, ry = 0, s = 1, solid = true) => add(makeFurniture(type, th).group, x, z, ry, s, solid);
  // the houses
  const main = add(houseMong(), 0, -1.25);
  const fh = [];
  for (const [k, build, x, z, ry, dx] of [['bunny', houseBunny, -3.45, -.95, 0, -.4], ['bear', houseBear, 3.9, -1.35, 0, -.75], ['cat', houseCat, -6.9, -.2, 0, 1.3], ['peng', () => housePeng(T), 7.3, -.4, 0, -.2]]) {
    const g = add(build(), x, z, ry);
    fh.push({ k, g, x, z, ry, dx, front: g.userData.front });
  }
  // the front yard: a low stone wall either side of the gateway, hedges down both sides
  // (kept low: from the camera the wall must stay below 몽글이's feet)
  const GX = .78, WZ = 2.8;
  for (const sx of [-1, 1]) {
    const w = part('yard-wall' + sx, A => {
      const x0 = sx < 0 ? -2.05 : GX, x1 = sx < 0 ? -GX : 2.05;
      A.tex(Gm.box(x1 - x0, .36, .2, .02), 'stone|#e3d9cc', 1, (x0 + x1) / 2, .18, WZ);
      A.add(Gm.box(x1 - x0 + .04, .05, .26, .015), '#f4ece0', (x0 + x1) / 2, .385, WZ);
      A.tex(Gm.box(.28, .5, .28, .03), 'stone|#e3d9cc', 1, sx * GX, .25, WZ);
      A.add(Gm.box(.34, .06, .34, .02), '#f4ece0', sx * GX, .53, WZ);
      A.add(Gm.cyl(.05, .07, .06, 10), '#3b3550', sx * GX, .59, WZ);
      if (sx < 0) A.tex(new THREE.BoxGeometry(.3, .094, .02), 'sign|숨바꼭길 7|#2f6fd0|#ffffff', null, -GX, .3, WZ + .15);
      else {   // a red mailbox sitting on the right-hand wall
        const mx = 1.5;
        A.add(Gm.box(.28, .2, .18, .03), '#e8453c', mx, .51, WZ); A.add(Gm.cyl(.09, .09, .28, 14), '#e8453c', mx, .61, WZ, 0, 0, HP);
        A.add(Gm.box(.17, .025, .02, .006), '#2a1d33', mx, .53, WZ + .095); A.add(Gm.box(.03, .14, .02, .006), '#ffd84a', mx + .15, .64, WZ);
      }
    });
    root.add(w); solids.push(w);
    root.add(part('gate-lamp' + sx, A => A.glow(Gm.sph(.085, 14, 10), '#fff1c4', sx * GX, .68, WZ)));
  }
  for (const [x, z0, z1, seed] of [[-2.2, .15, 2.62, 61], [2.2, .2, 2.62, 62]]) { const hd = hedge(+(z1 - z0).toFixed(2), seed, { hgt: .5 }); put(hd, x, 0, (z0 + z1) / 2, 0, HP, 0); root.add(hd); solids.push(hd); }
  // 토순이's white picket fence (two runs either side of its gate), 곰돌이's mailbox on a post
  for (const [x0, x1] of [[-4.55, -3.18], [-2.72, -2.42]]) {
    const f = part(`bun-fence|${x0}`, A => {
      const n = Math.round((x1 - x0) / .16);
      for (let i = 0; i <= n; i++) { const x = x0 + i * (x1 - x0) / n; A.add(Gm.box(.08, .5, .035, .012), '#ffffff', x, .25, 2.7); A.add(Gm.box(.058, .058, .035, .008), '#ffffff', x, .5, 2.7, 0, 0, PI / 4); }
      A.add(Gm.box(x1 - x0, .05, .03, .01), '#ffffff', (x0 + x1) / 2, .36, 2.675); A.add(Gm.box(x1 - x0, .05, .03, .01), '#ffffff', (x0 + x1) / 2, .14, 2.675);
    });
    root.add(f); solids.push(f);
  }
  add(part('bear-mailbox', A => { A.add(Gm.box(.07, .7, .07, .015), '#a8683f', 0, .35, 0); A.add(Gm.box(.2, .14, .34, .02), '#3b5c8a', 0, .77, 0); A.add(Gm.cyl(.1, .1, .34, 14), '#3b5c8a', 0, .84, 0, HP); A.add(Gm.box(.02, .14, .05, .005), '#e8453c', .11, .86, -.06); }), 2.85, 2.45);
  prop('pine2', T.trail || ST, -8.3, 1.35, .4, .8);
  // street furniture along the sidewalk
  // (only low things on the stretch right in front of 몽글이, so nothing tall stands between it and the camera)
  // (and nothing tall right in front of where a friend stands)
  prop('tteokstall', ST, -7.1, 3.38, 0);
  prop('redstools', ST, -5.6, 3.42, .2);
  prop('pole', ST, -4.45, 3.62, 0, 1.15);
  prop('postbox2', ST, -2.45, 3.5, .15);
  prop('bike2', ST, -1.28, 3.45, 0);
  prop('hydrant', ST, 1.2, 3.55, -.3);
  prop('cones', ST, 2.05, 3.5, .3);
  prop('streetlamp', ST, 2.85, 3.6, 0);
  prop('bench2', ST, 5.3, 3.42, 0);
  prop('cones', ST, 6.75, 3.5, -.4);
  prop('manhole', ST, -.6, 5.2, 0, 1, false);
  // yard and garden pieces
  prop('catfeeder', PG, 1.62, 2.25, -2.3, .85);
  prop('boxstack', ST, 1.3, .42, -.25, .8);
  prop('planter', PG, -4.0, 2.25, 0, .7);
  prop('recyclebins', PG, 5.05, 1.95, -1.0, .8);
  prop('aircon', ST, -1.95, -.55, -HP, .8);
  // trees behind and between the houses, a few out at the sides
  const trees = [[-1.95, -3.15, 1.15, 71], [2.0, -3.3, 1.25, 72], [-4.95, -2.6, 1.05, 73], [5.5, -3.2, 1.15, 74], [-.2, -3.95, 1.2, 75], [-8.1, -1.4, 1.1, 76], [8.6, -1.6, 1.1, 77], [-8.6, 2.0, .9, 78], [8.9, 1.7, .95, 79], [-3.3, -3.7, 1.1, 80], [3.7, -4.0, 1.15, 81]];
  for (const [x, z, s, seed] of trees) add(tree(seed, { s, fruit: seed === 72 ? '#ffb02e' : seed === 73 ? '#ff6f91' : null }), x, z, seed);
  return { main, fh, solids };
}

// the big play button (the home and, with 경제·로비 on, the lobby): the next stage — or, once 70판 is behind you and the
// ending hasn't played, the last 야식 boss (the only way to the ending — QA 10/18)
export function playButton(G) {
  const ui = G.ui, S = G.save, idx = S.stage || 0, sp = stageSpec(idx), reg = regionOf(idx), endless = idx >= STAGE_COUNT;
  const pending = resumeFollowup(S);
  if (pending) return ui.btn('놀이 이어하기', { color: 'green', icon: 'play', cls: 'big playbtn stack pulse', sub: followupLabel(pending.data), onClick: () => G.go(pending.name, pending.data) });
  const fin = BOSS_GAMES[STAGE_COUNT - 1], finPending = endless && fin && !S.ending && !G.bot;
  return finPending
    ? ui.btn('보스 등장!', { color: 'green', icon: 'play', cls: 'big playbtn stack pulse', sub: `${STAGE_COUNT}판 · 셋째 밤`, onClick: () => G.go('bossgame', { kind: fin.kind, lv: fin.lv, after: STAGE_COUNT - 1 }) })
    : ui.btn(`스테이지 ${idx + 1}`, { color: 'green', icon: 'play', cls: 'big playbtn stack pulse', sub: (endless ? `무한 모드 ${idx - STAGE_COUNT + 1} · ${(REGIONS.find(r => r.id === sp.region) || reg).name}` : `${reg.name} ${idx - reg.from + 1}/${reg.to - reg.from}`) + (sp.boss ? ' · 방탈출' : sp.hard ? ' · 하드' : ''), onClick: () => G.go('stage', { idx }) });
}
// 더보기: 세팅, 조작 도움말, 언어, (with 경제·로비 on: 동네 구경, 지도, 소리), 전체화면, 처음부터 새로, credits — and with ?qa=1 or the
// Debug APK (QA_TOOLS) the team's 놀이 모음, 새 아트, 판 방식, 배치 편집, 새 경제 (③ 10/21: "쓸데없는것들 지우장")
export function openMore(G, extra = []) {
  const ui = G.ui;
  // art preview (2026-10-15): the everyday apartment living room in the new look, outside the campaign
  const preview = room => G.go('stage', { idx: 2, preview: true, spec: { room, n: 6, inside: 3, behind: 1, time: 90, clutter: .7, tut: 0 } });
  const fs = IN_APP ? null : fullscreenBtn(ui);   // (the app is full screen already)
  const layBtn = [];   // (배치 편집: no button any more, ?qa=1 too — user 10/21 "배치 편집은 없애자"; ⑤ clears the tool itself)
  ui.panel({ title: '더보기', color: 'blue', cls: 'more', close: () => {}, body: [h('div', { class: 'row wrap' },
    // 놀이 모음 lists 'N판 뒤 · 안 쓰임' notes for the team: hidden in the submitted builds — the app's store build and the public
    // web page; it shows for the owner (localhost, ?owner, the artifact's owner) and in the app's Debug APK (user, 10/19)
    QA_TOOLS && ui.btn('놀이 모음', { color: 'green', cls: 'sm qa', onClick: () => { ui.closePanel(); setTimeout(() => openGallery(G), 200); } }),
    // (user 10/25 "후보정이랑 치트? 세팅용 메뉴 … 제거하자": 세팅 and 튜토리얼 B go with the team's tools — ?qa=1)
    QA_TOOLS && ui.btn('세팅', { color: 'blue', cls: 'sm qa', onClick: () => { ui.closePanel(); openTune(G); } }),
    ui.btn('조작 도움말', { color: 'blue', onClick: () => { ui.closePanel(); setTimeout(() => openHelp(G), 200); } }),   // (10/20: the controls and 1판~10판 again)
    // (10/19 user: "옵션에 리셋(아예 처음 시작하는 것처럼) 기존 진행사항 지우고 새로 하는 버튼") — asks once, then reloads with ?reset
    ui.btn('처음부터 새로', { color: 'red', cls: 'sm reset', onClick: () => { ui.closePanel(); setTimeout(() => ui.panel({ title: '처음부터 새로', color: 'red', close: () => {},
      body: [h('div', { class: 'txt' }, '지금까지 한 게 모두 지워지고 1판부터 다시 시작해요.')],
      buttons: [ui.btn('취소', { color: 'gray', cls: 'sm', onClick: () => ui.closePanel() }),
        ui.btn('지우고 새로 시작', { color: 'red', onClick: () => { const u = new URLSearchParams(location.search); u.set('reset', ''); location.replace(location.pathname + '?' + u.toString().replace(/=(&|$)/g, '$1')); } })] }), 200); } }),
    QA_TOOLS && ui.btn('새 아트', { color: 'yellow', cls: 'sm qa', onClick: () => { ui.closePanel(); preview('apt'); } }),
    ui.btn(LANG === 'en' ? '한국어로' : 'English', { color: 'purple', onClick: () => setLang(LANG === 'en' ? 'ko' : 'en') }),
    // 튜토리얼 B (③ 10/22: a lighter 1·2판 to try — this device; tutb.js)
    QA_TOOLS && ui.btn(TUT_B ? '튜토리얼 B 끄기' : '튜토리얼 B 켜기', { color: TUT_B ? 'gray' : 'green', cls: 'sm qa', onClick: () => { setTutB(!TUT_B); const u = new URLSearchParams(location.search); u.delete('tut'); location.replace(location.pathname + (u.toString() ? '?' + u : '') + location.hash); } }),
    // compare the new incident stages with the old find-the-list stages (10/17 pivot)
    QA_TOOLS && ui.btn(G.save.settings?.oldMode ? '판 방식: 물건 찾기' : '판 방식: 사건', { color: 'green', cls: 'sm qa', onClick: () => { const S = G.save.settings || (G.save.settings = {}); S.oldMode = !S.oldMode; G.persist(); ui.closePanel(); ui.toast(S.oldMode ? '이제 판이 물건 목록 찾기로 나와 (옛 방식)' : '이제 판이 사건으로 나와: 숨은 친구를 찾아라!', 'green'); } }),
    ...layBtn, ...extra, ...(fs ? [fs] : []),
    // 경제·내 방 로비 (10/19, built in but off until the user picks): try it on this device, or go back
    QA_TOOLS && ui.btn(G.econ ? '새 경제 끄기' : '새 경제·내 방 로비 켜기', { color: G.econ ? 'gray' : 'pink', cls: 'sm qa', onClick: () => { try { localStorage.setItem('sbk-econ', G.econ ? '0' : '1'); } catch {} location.replace(location.pathname + location.search.replace(/[?&]econ=[01]/, '').replace(/^&/, '?') + location.hash); } })),
    // font credits (한국기계연구원 서체 is 공공누리 제1유형: the credit has to be shown)
    h('div', { class: 'credits' }, VERSION_LABEL),   // the version name in the game (Discovery 26-4 rule)
    h('div', { class: 'credits' }, '글꼴: 카페24 써라운드 · 써라운드 에어 (카페24) / Fredoka · Bagel Fat One · 주아 (OFL) / 본 저작물은 한국기계연구원에서 2022년 작성하여 공공누리 제1유형으로 개방한 \'한국기계연구원 서체\'를 이용하였으며, 해당 저작물은 한국기계연구원 웹폰트(www.kimm.re.kr/webfont)에서 무료로 받을 수 있습니다.'),
    h('div', { class: 'credits thanks' }, '감사합니다')],
    // (one way out: the ✕ at the corner — the gray 닫기 under the credits said it twice; 2D UI 정리 ⑫ 10/19)
    buttons: [] });
  { const g = document.querySelector('.panel.more .row.wrap'), main = g ? [...g.children].filter(b => b.classList?.contains('btn') && !b.classList.contains('qa') && !b.classList.contains('reset')) : [];
    if (main.length % 2) main[main.length - 1].classList.add('wide'); }   // (an odd one out spans the two columns — ③ 10/21)
}

const HOME_LIGHT = { ambColor: '#fff0e0', amb: 1.5, sunColor: '#fff6e6', sun: 2.3 };

export class HomeScene {
  constructor(G) { this.G = G; this.name = 'home'; }
  async enter() {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    G.setBg(['#eaf4ff', '#fff0dc']); G.world.setLight(HOME_LIGHT);
    const root = this.root = new THREE.Group();
    // the geometry this visit makes for itself, given back on exit (홈 왕복마다 geometry +21 → 0, GPT review 10/18): the
    // ground planes, merged furniture bodies, deFlush's lifted copies, the chimney smoke. Shared caches (PARTS, kit
    // GEO/MAT, every texture) stay — no disposeTree here. Materials aren't disposed (see kit.js disposeTree: that only
    // deleted warm shader programs); they go with the garbage collector.
    const owned = this.owned = { g: new Set() };
    // the neighbourhood on the ground: houses, yards, sidewalk and a street running off past the screen
    const V = buildVillage(root);
    const main = this.main = V.main;
    this.fh = [];
    for (const f of V.fh) {
      const ch = new Char(f.k), d = f.front + .5;
      ch.root.position.set(f.x + Math.sin(f.ry) * d + Math.cos(f.ry) * f.dx, 0, f.z + Math.cos(f.ry) * d - Math.sin(f.ry) * f.dx); ch.root.rotation.y = f.ry + (f.x < 0 ? .45 : -.45); root.add(ch.root);
      this.fh.push({ k: f.k, g: f.g, ch, x: f.x, z: f.z });
    }
    root.traverse(o => { if (o.isMesh && (o.userData.ground || o.userData.baked)) owned.g.add(o.geometry); });
    const pre = new Map(); root.traverse(o => { if (o.isMesh) pre.set(o, o.geometry); });
    deFlush(root, [], 'home-village', null, true);   // flush faces (a sign on a wall, a lid on a box) would flicker
    for (const [o, g] of pre) if (o.geometry !== g) owned.g.add(o.geometry);   // deFlush's private copies
    // what characters must keep out of: every house (roof overhang, porch and steps included), wall, hedge, tree and
    // street prop. Everyone stands and walks a body's width away from them.
    root.updateMatrixWorld(true);
    const solids = this.solids = [];
    const solid = (o, grow = 0) => { const b = new THREE.Box3().setFromObject(o, true); b.expandByVector(new THREE.Vector3(grow, 0, grow)); solids.push(b); };
    for (const o of V.solids) {
      if (o.userData.tree) { const p = o.position, s = o.scale.x || 1; solids.push(new THREE.Box3(new THREE.Vector3(p.x - .42 * s, 0, p.z - .42 * s), new THREE.Vector3(p.x + .42 * s, 2, p.z + .42 * s))); }
      else solid(o, .02);
    }
    const clear = this.clear = (x, z, r = .32) => {
      if (Math.abs(x) > 8 || z < -4 || z > 3.4) return false;
      for (const b of solids) { const dx = Math.max(b.min.x - x, 0, x - b.max.x), dz = Math.max(b.min.z - z, 0, z - b.max.z); if (dx * dx + dz * dz < r * r) return false; }
      return true;
    };
    const nearestClear = (x, z, r) => {
      if (clear(x, z, r)) return [x, z];
      for (let ring = .2; ring < 2.5; ring += .2) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, qx = x + Math.cos(a) * ring, qz = z + Math.sin(a) * ring; if (clear(qx, qz, r)) return [qx, qz]; }
      return [x, z];
    };
    for (const f of this.fh) { const [x, z] = nearestClear(f.ch.root.position.x, f.ch.root.position.z, .36); f.ch.root.position.set(x, 0, z); }
    this.nearestClear = nearestClear;
    // chimney smoke from the top of 몽글이's chimney (world space)
    this.chimney = main.userData.chimney ? main.localToWorld(main.userData.chimney.clone()) : null;
    this.smoke = [];
    if (this.chimney) for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), mat('#ffffff', { opacity: .8, rim: .5 }).clone()); p.castShadow = false; root.add(p); this.smoke.push({ m: p, t: i / 4 }); owned.g.add(p.geometry); }
    this.clouds = [];
    // 몽글이, front and centre on the yard in front of its door
    const m = this.mong = new Char('mong'); m.root.position.set(0, 0, 1.55); m.root.scale.setScalar(1.8); m.pose = 'wave'; root.add(m.root);   // the hero: big, front and centre
    // locals: 보드킹 cruises the yard, 삐딱이 sulks by the wall, 컵돌이 and 꼬깔이 hang out by the door
    this.locals = [['skater', 1.3, 1.9], ['grumpy', -1.5, 2.25, .35], ['mug', -.95, 1.2, .3], ['cone', .98, 1.15, -.3]].map(([k, x, z, ry = 0]) => {
      const c = new Char(k); const [cx, cz] = nearestClear(x, z, .34); c.root.position.set(cx, 0, cz); c.root.rotation.y = ry; root.add(c.root); return c;
    });
    this.locals[0].wander(this.tw, { x0: 1.0, x1: 1.8, z0: 1.0, z1: 2.5 }, { others: [m, ...this.locals, ...this.fh.map(f => f.ch)], pause: [.6, 1.8], clear });
    this.visitors = new Visitors(G, { parent: root, mong: m, tw: this.tw, active: () => !G.ui.panelOpen,
      entry: () => [.25, 3.3], meet: () => [.55, 2.15], say: (ch, t, ms) => this.say(ch, t, ms), clear });
    W.root.add(root);
    W.home.set(0, .25, 1.5); W.target.copy(W.home); W.yaw = .2; W.pitch = .44; W.zoom = 1; W.minPitch = .25; W.maxPitch = .95; W.bounds = 0; W.autoSpin = 0; W.vYaw = 0;
    this.frame();
    W.shadowDirty = true;
    W.onTap = (x, y) => this.tap(x, y);
    W.onRotate = null; W.onDragStart = null;
    { const c = settleOpen(G); if (c) setTimeout(() => G.ui.toast(`지난번 털다 만 집 정산 · 코인 +${c}`, 'green'), 900); }   // (QA9 P2: the app closed mid-raid)
    runRaids(G);   // residents who sneaked in while you were away (coins land before the HUD shows them)
    this.buildHud();
    G.audio.music('home');
    this.tw.wait(.8).then(() => this.raidNews());
  }
  // 털리기 news: who came, what they took, what they missed
  raidNews(tries = 0) {
    const G = this.G; if (this.dead) return;
    const list = unseen(G.save); if (!list.length) return;
    if (G.booting) { this.tw.wait(.5).then(() => this.raidNews(tries)); return; }   // still on the start screen
    if (G.ui.panelOpen || G.pending) { if (tries < 20) this.tw.wait(1.5).then(() => this.raidNews(tries + 1)); return; }
    const took = list.filter(e => e.kind === 'steal');
    const rows = list.slice(-4).map(e => h('div', { class: 'raidrow' + (e.kind === 'steal' ? ' bad' : ' good') }, h('img', { src: G.thumbs['face_' + e.face] || G.thumbs.face_mong }),
      h('div', {}, newsLine(e)), ...(e.item ? [h('img', { class: 'ri', src: G.thumbs['item_' + e.item] })] : e.lost ? [h('img', { class: 'ri', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(ICON.coin.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')) })] : [])));
    const close = () => { markSeen(G); G.ui.closePanel(); };
    // ① 털림 다시 보기: in my room (the 내 방 lobby, 내 집), the newest raid with a record plays back; a row plays its own
    const last = [...list].reverse().find(e => canReplay(this, e));
    const replay = e => { markSeen(G); G.ui.closePanel(); playRaidReplay(this, e); };
    if (last) rows.forEach((r, i) => { const e = list.slice(-4)[i]; if (canReplay(this, e)) { r.classList.add('tap'); r.addEventListener('click', () => replay(e)); } });
    G.audio.sfx(took.length ? 'miss' : 'coin');
    // (② 10/22, user "좀 개털려야 돈을 쓰지"): robbed, the next thing to do is right here — a padlock: hang a spare one, or buy one
    const goHide = () => { markSeen(G); G.ui.closePanel(); if (this.setMode) this.setMode('hide'); else G.go('myhome', { mode: 'hide' }); };
    const owned = locksOwned(G.save), spare = owned > locksUsed(G.save);
    const lockBtn = !took.length ? null : spare || owned >= LOCK_MAX ? G.ui.btn(spare ? '자물쇠 걸기' : '더 꽁꽁', { color: 'orange', icon: 'lock', cls: 'sm', onClick: goHide })
      : G.ui.btn('자물쇠 사기', { color: 'orange', icon: 'lock', cls: 'sm', onClick: () => { markSeen(G); G.ui.closePanel(); askBuyLock(G, goHide); } });
    const tookThing = took.some(e => e.item);
    G.ui.panel({ title: '내가 없는 동안…', color: took.length ? 'red' : 'green',
      body: [...rows, h('div', { class: 'txt' }, tookThing ? '털어 간 친구 방에 가서 찾아내면 되찾을 수 있어!' : took.length ? '자물쇠를 걸면 덜 털려!' : '잘 숨겨 둔 덕분이야! 더 꽁꽁 숨겨 보자'),
        ...(took.length && shieldLeft(G.save) ? [h('div', { class: 'shieldline', html: ICON.lock }, h('span', {}, `문단속! ${shieldTxt(shieldLeft(G.save))} 동안 아무도 못 와`))] : [])],
      buttons: last ? [G.ui.btn('나중에', { color: 'gray', cls: 'sm', onClick: close }), ...(lockBtn ? [lockBtn] : []), G.ui.btn('다시 보기', { color: 'green', icon: 'play', cls: 'big', onClick: () => replay(last) })]
        : tookThing ? [G.ui.btn('나중에', { color: 'gray', cls: 'sm', onClick: close }), lockBtn, G.ui.btn('되찾으러 가기', { color: 'green', cls: 'big', onClick: () => { markSeen(G); G.go('visit', { force: holderOf(G.save) }); } })]
        : took.length ? [G.ui.btn('나중에', { color: 'gray', cls: 'sm', onClick: close }), lockBtn]
        : [G.ui.btn('좋아!', { color: 'green', onClick: close })] });
  }
  // Portrait: 몽글이 big and centred just above the play button, its house filling the screen behind it, the roof
  // ridge tucked under the logo. Landscape: a wider look down the whole lane with 몽글이 above the centred buttons.
  frame() {
    const W = this.G.world, land = W.W > W.H * 1.05;
    if (land === this._land) return;
    this._land = land;
    if (land) W.setFit(3.8, 5.3, .545); else W.setFit(3.8, 4.5, .567);
  }
  // 친구 도감: everyone you have met (stage hosts so far + characters earned), the rest as silhouettes with a hint
  friendBook() {
    const G = this.G, S = G.save, met = new Set(['mong', ...(S.chars || [])]);
    const firstStage = {};
    for (let i = 0; i < STAGE_COUNT; i++) { const sp = stageSpec(i), k = sp.timed ? 'raccoon' : THEMES[sp.room]?.friend; if (k && firstStage[k] == null) firstStage[k] = i; if (k && i < (S.stage || 0)) met.add(k); }
    for (const [i, k] of Object.entries(CHAR_UNLOCK)) if (firstStage[k] == null || +i < firstStage[k]) firstStage[k] = +i;
    const keys = Object.keys(CHAR_DEFS).filter(k => k !== 'mom');
    const grid = h('div', { class: 'friendgrid' });
    for (const k of keys) {
      const ok = met.has(k), at = firstStage[k];
      grid.append(h('div', { class: 'fcell' + (ok ? '' : ' locked') }, h('img', { src: G.thumbs['face_' + k] }),
        h('div', { class: 'fname' }, ok ? CHAR_DEFS[k].name : '???'), h('div', { class: 'fhint' }, ok ? '' : at != null ? `스테이지 ${at + 1}에서 만날 수 있어` : '동네 어딘가에')));
    }
    G.ui.panel({ title: `친구 도감 ${[...met].filter(k => keys.includes(k)).length}/${keys.length}`, color: 'pink', body: [grid], buttons: [G.ui.btn('닫기', { color: 'blue', cls: 'sm', onClick: () => G.ui.closePanel() })] });
  }
  say(ch, text, ms = 1300) {
    const b = h('div', { class: 'bubble pop' }, text);
    this.G.ui.wui.append(b);
    const V = new THREE.Vector3();
    const upd = () => { const p = this.G.world.toScreen(ch.root.getWorldPosition(V).setY(ch.headTop() + .2)); b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; };
    upd(); const iv = setInterval(upd, 30);
    setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
  }
  exit() {
    if (this.gone) return; this.gone = true;
    this.dead = true; this.visitors?.dispose(); this.locals?.forEach(c => c.stopWander()); this.G.world.root.remove(this.root); this.G.world.autoSpin = 0; this.G.world.onTap = null; this.G.ui.clear();
    if (this.owned) { for (const g of this.owned.g) g?.dispose(); this.owned = null; }
  }
  buildHud() {
    const G = this.G, ui = G.ui, col = ui.col(), S = G.save;
    const lv = lvOf(S).lv;   // (털기도 Lv을 올려요 — level.js, 10/20)
    const prof = h('div', { class: 'profile' }, h('div', { class: 'av' }, h('img', { src: G.thumbs.face_mong })), h('div', {}, h('div', { class: 'nm ol' }, '몽글이'), h('div', { class: 'lv' }, `Lv.${lv}`, h('span', { class: 'lvt' }, ' 숨바꼭질 탐정'))));
    // review shortcut: tap the profile 5 times quickly → pick any stage (★ = story stage)
    let taps = [];
    prof.style.pointerEvents = 'auto';
    prof.addEventListener('pointerup', () => {
      const now = performance.now(); taps = [...taps.filter(t => now - t < 2500), now];
      if (taps.length < 5 || !QA_TOOLS) return;   // (a QA shortcut: not in the store build — src/build.js)
      taps = [];
      const st = G.save.settings || (G.save.settings = {}); st.review = !st.review; G.persist();
      G.ui.toast(st.review ? '리뷰 모드: 지도에서 모든 판이 열려요' : '리뷰 모드 꺼짐', 'green');
      if (st.review) openRoadmap(G);
    });
    col.append(prof);
    const pills = h('div', { class: 'pills' }); this.coinPill = ui.pill('coin', S.coins); this.starPill = ui.pill('star', S.stars || 0);
    pills.append(this.starPill, this.coinPill); col.append(pills);
    G.coinPills = [this.coinPill];
    const snd = ui.ibtn(G.audio.muted ? 'mute' : 'sound', 'purple', () => { G.audio.setMuted(!G.audio.muted); snd.innerHTML = ''; snd.insertAdjacentHTML('beforeend', ICON[G.audio.muted ? 'mute' : 'sound']); sndName(); });
    // (GPT QA QA05 10/26: the town's sound button had no name) what a press does, kept up to date
    const sndName = () => { const t = tr(G.audio.muted ? '소리 켜기' : '소리 끄기'); snd.setAttribute('aria-label', t); snd.title = t; snd.setAttribute('aria-pressed', String(!G.audio.muted)); }; sndName();
    snd.style.cssText += 'width:44px;height:44px';
    // no title on the home any more (10/18): the start screen shows the logo, and 몽글이's house with its nameplate says the rest
    const idx = S.stage || 0, sp = stageSpec(idx), th = THEMES[sp.room] || THEMES.bunny, reg = regionOf(idx), endless = idx >= STAGE_COUNT;
    const bar = h('div', { class: 'homebar' });
    // the ending comes after the last 야식 boss: whoever went home from 70판's result panel (or reloaded before the ending
    // played) is sent to that boss first — it was the only way to the ending (QA 10/18)
    this.playBtn = playButton(G);
    const unlocked = G.homeOpen();
    const roomBtn = ui.btn('내 집', { color: 'orange', icon: unlocked ? 'home' : 'lock', disabled: !unlocked, cls: 'stack', sub: unlocked ? '꾸미고 숨기기' : '스테이지 2 클리어', onClick: (dis) => dis ? ui.toast('2판을 깨면 열려!', 'red') : G.go('myhome') });
    if (unlocked && !G.save.tut?.home) roomBtn.classList.add('pulse');   // just opened: point the way
    const raidBtn = ui.btn('놀러 가기', { color: 'pink', icon: unlocked ? 'play' : 'lock', disabled: !unlocked, cls: 'stack', sub: unlocked ? '남이 숨긴 물건 찾기' : '스테이지 2 클리어', onClick: (dis) => dis ? ui.toast('2판을 깨면 열려!', 'red') : G.go('visit') });
    // the side column stays short so it never reaches the play button on a short screen (Safari with its bars, a phone
    // turned sideways): 지도 and 도감 stay out, everything else lives behind 더보기
    const side = h('div', { class: 'homeside' });   // (one colour for the side buttons: same role, same look — 2D UI 정리 ② 10/19)
    side.append(snd,
      ui.btn('지도', { color: 'purple', cls: 'sm', onClick: () => openRoadmap(G) }),
      bookBadge(G, ui.btn('도감', { color: 'purple', cls: 'sm', onClick: () => openCardBook(G) })),
      ui.btn('더보기', { color: 'purple', cls: 'sm', onClick: () => openMore(G) }));
    col.append(side);
    bar.append(this.playBtn, h('div', { class: 'row2' }, roomBtn, raidBtn));
    col.append(bar);
    // arrow over the next friend's house
    this.arrowFor = this.fh.find(f => f.k === th.friend);
    this.arrow = h('div', { class: 'bubble', style: 'font-size:15px' + (this.arrowFor ? '' : ';display:none') }, `다음: ${CHAR_DEFS[th.friend].name}네`);
    ui.wui.append(this.arrow);
  }
  tap(x, y) {
    const G = this.G, W = G.world;
    const hits = W.pick(x, y, [this.root]);
    for (const hh of hits.slice(0, 1)) {
      for (let o = hh.object; o; o = o.parent) {
        const ch = o.userData.char;
        if (ch) { const r = ch.react(this.tw, (n, p) => G.audio.sfx(n, p)); this.say(ch, r.line); return; }
        if (o === this.main) { G.audio.sfx('door'); if (G.homeOpen()) G.go('myhome'); else G.ui.toast('몽글이 집! 스테이지 2를 깨면 들어갈 수 있어', ''); return; }
        const fh = this.fh.find(f => f.g === o);
        if (fh) { G.audio.sfx('pop', 3); G.ui.toast(`${CHAR_DEFS[fh.k].name}네 집`, ''); return; }
      }
    }
  }
  update(dt) {
    this.tw.update(dt);
    this.t = (this.t || 0) + dt;
    this.mong.update(dt);
    for (const f of this.fh) f.ch.update(dt);
    for (const c of this.locals || []) c.update(dt);
    this.visitors?.update(dt);
    const cp = this.chimney;
    if (cp) for (const s of this.smoke) {
      s.t = (s.t + dt * .35) % 1;
      const k = s.t;
      s.m.position.set(cp.x + Math.sin(k * 6 + s.t) * .1, cp.y + k * 1.5, cp.z + k * .25);
      s.m.scale.setScalar(.4 + k * 1.3); s.m.material.opacity = .85 * (1 - k);
    }
    for (const c of this.clouds) { c.c.position.y = c.y + Math.sin(this.t * .6 + c.ph) * .15; c.c.rotation.y += dt * .05; }
    const W = this.G.world;
    this.frame();
    // the view sways gently from side to side (circling all the way round showed the backs of the houses)
    W.autoSpin = .03 * Math.cos(this.t * .11) + .0005;
    if (this.arrowFor) { const p = W.toScreen(new THREE.Vector3(this.arrowFor.x, 1.9 + Math.sin(this.t * 3) * .08, this.arrowFor.z)); this.arrow.style.left = p.x + 'px'; this.arrow.style.top = p.y + 'px'; }
  }
  botStep(dt) { this._bt = (this._bt || 0) + dt; if (this._bt > 1.2) { this._bt = 0; this.playBtn.press(); } }
  state() { return { scene: 'home', stage: (this.G.save.stage || 0) + 1, coins: this.G.save.coins }; }
}

// 룩 실험 (look.js, 10/19): the home street's own houses, trees and hedges stand behind a stage map's walls so the map
// reads as one corner of a bigger town (the same pieces, so nothing new to match)
export const HOUSE_KIT = { mong: houseMong, bunny: houseBunny, bear: houseBear, cat: houseCat, peng: housePeng, tree, hedge };
