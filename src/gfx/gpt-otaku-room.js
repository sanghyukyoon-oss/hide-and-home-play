// Otaku loft architecture. All new keys are isolated from the shipped furniture set.
// Units: metres, floor-centred origins, +z is the front. Uses the game's material/bake pipeline.
import * as THREE from 'three';
import { rbox, sph, cyl, put, grp, mat, plane, canvasTex, texCache, fadeDisc } from './kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WALL_PAINT, FLOOR_PAINT, tone } from '../patterns.js';

const OAK = '#d6ae7c', EDGE = '#a67c52', CREAM = '#fff5df', INK = '#35394d', TEAL = '#5d9995';
const tex = texCache();
let lampGlow;
const box = (g, w, h, d, c, x, y, z, r = .018) => g.add(put(rbox(w, h, d, c, r), x, y, z));
function rod(g, a, b, r, c) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), delta = B.clone().sub(A);
  const m = cyl(r, r, delta.length(), c, null, 8); m.position.copy(A.add(B).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); g.add(m); return m;
}
const panel = (g, w, h, t, x, y, z) => g.add(put(plane(w, h, mat('#ffffff', { map: t })), x, y, z));
const B = {};

B.gpt_mezzanine = (f, T, o = {}) => {
  const w = o.w || 3.9, d = o.d || 2.4, y = o.h || 2.16;
  const g = f.group;
  box(g, w, .21, d, EDGE, 0, y - .105, 0, .035);
  // Real boards, restrained seams, a substantial fascia and two front support posts.
  const n = Math.round(w / .3), bw = w / n;
  for (let i = 0; i < n; i++) box(g, bw - .009, .045, d - .07, i % 3 ? '#ecd1a8' : '#e3c299', -w / 2 + bw * (i + .5), y + .0225, 0, .008);
  box(g, w + .06, .14, .1, OAK, 0, y - .13, d / 2, .018);
  for (const x of [-w / 2 + .10, w / 2 - .10]) {
    box(g, .15, y - .21, .15, OAK, x, (y - .21) / 2, d / 2 - .1, .025);
    rod(g, [x, y - .22, d / 2 - .1], [x + (x < 0 ? .25 : -.25), y - .52, d / 2 - .1], .035, EDGE);
  }
  // Front rail stops short of the stair landing on the right. Low steel balusters keep the bed readable.
  const a = -w / 2 + .05, b = w / 2 - .08, z = d / 2 + .025;
  const gap = o.entrance === 'front' ? o.gap ?? -1.1 : null;
  if (gap == null) box(g, b - a + .08, .075, .075, OAK, (a + b) / 2, y + .68, z, .025);
  else for (const [l, r] of [[a, gap - .56], [gap + .56, b]]) if (r > l) box(g, r - l, .075, .075, OAK, (l + r) / 2, y + .68, z, .025);
  for (let x = a; x <= b + .01; x += .31) if (gap == null || Math.abs(x - gap) > .56) box(g, .035, .64, .035, INK, x, y + .34, z, .008);
  // o.lights (18판 섞은 안 10/22, 옛 18판 railLights처럼): warm fairy lights looping under the front rail on the room side, the
  // bulbs one merged mesh (one draw) — from the first view the mezzanine read as bars over a bed
  if (o.lights && gap == null) {
    const pts = [], at = [], N = Math.round((b - a) / .12), k = Math.max(1, Math.round((b - a) / .6)), zz = z + .06;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = a + (b - a) * t, yy = y + .66 - Math.abs(Math.sin(t * Math.PI * k)) * .1;
      pts.push(new THREE.Vector3(x, yy, zz)); if (i % 2) at.push([x, yy - .03, zz + .006]);
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, .006, 4, false), mat('#5b5672')));
    const bulbs = new THREE.Mesh(mergeGeometries(at.map(([x, yy, z2]) => new THREE.SphereGeometry(.036, 8, 6).translate(x, yy, z2))), mat('#fff0c4', { emissive: '#ffd27a', ei: 1 }));
    bulbs.castShadow = false; g.add(bulbs);
  }
  // Side rail leaves a .95 m entrance at the front for the top of the staircase.
  const sideLen = gap == null ? d - .94 : d;
  box(g, .065, .075, sideLen, OAK, w / 2, y + .68, gap == null ? -.47 : 0, .018);
  for (let z2 = -d / 2; z2 < -d / 2 + sideLen; z2 += .3) box(g, .035, .64, .035, INK, w / 2, y + .34, z2, .008);
  if (gap == null) {
    // An L-shaped landing joins the east-side stair to the mezzanine. A top tread must lead somewhere real.
    const lx = w / 2 + .535, lz = d / 2 - .47;
    box(g, 1.07, .21, .94, EDGE, lx, y - .105, lz, .025);
    box(g, 1.06, .045, .92, '#ecd1a8', lx, y + .0225, lz, .012);
    for (const x of [w / 2 + 1.02]) {
      box(g, .13, y - .21, .13, OAK, x, (y - .21) / 2, d / 2 - .1, .018);
      box(g, .065, .075, .94, OAK, x, y + .68, lz, .018);
      for (let z2 = lz - .43; z2 <= lz + .44; z2 += .29) box(g, .035, .64, .035, INK, x, y + .34, z2, .008);
    }
    box(g, 1.06, .075, .065, OAK, lx, y + .68, d / 2 - .94, .018);
    for (let x = w / 2 + .15; x < w / 2 + 1.0; x += .28) box(g, .035, .64, .035, INK, x, y + .34, d / 2 - .94, .008);
  }
  // A warm strip below the fascia (no extra point lights / mobile shadow passes).
  box(g, w - .4, .025, .025, '#ffe3a0', 0, y - .205, d / 2 - .12, .005);
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
};

B.gpt_storage_stairs = (f, T, o = {}) => {
  const h = o.h || 2.16, n = 8, run = .34, w = 1.02, g = f.group;
  const rise = h / n, depth = n * run, z0 = -depth / 2;
  // Closed stepped side stringers, without a solid block filling the drawers.
  const sh = new THREE.Shape(); sh.moveTo(-z0, 0); sh.lineTo(-z0, h);
  for (let i = 0; i < n; i++) { sh.lineTo(-(z0 + (i + 1) * run), h - i * rise); sh.lineTo(-(z0 + (i + 1) * run), h - (i + 1) * rise); }
  sh.lineTo(-z0, 0);
  const side = (x, opening) => {
    const profile = sh.clone();
    if (opening) {
      const hole = new THREE.Path(); hole.moveTo(.445, .17); hole.lineTo(.445, 1.30); hole.lineTo(1.15, 1.30); hole.lineTo(1.15, .17); hole.closePath();
      profile.holes.push(hole);
    }
    const sg = new THREE.ExtrudeGeometry(profile, { depth: .07, bevelEnabled: false }); sg.rotateY(Math.PI / 2);
    const m = new THREE.Mesh(sg, mat('#e3d9c5')); m.castShadow = m.receiveShadow = true; g.add(put(m, x, 0, 0));
  };
  side(-w / 2, false); side(w / 2 - .07, true);
  box(g, w - .14, h - .08, .055, EDGE, 0, (h - .08) / 2, z0 + .02);
  for (let i = 0; i < n; i++) {
    const yy = h - i * rise, zz = z0 + (i + .5) * run;
    box(g, w + .045, .065, run + .035, '#edd1a5', 0, yy - .0325, zz, .012);
    // Riser drawers occupy the actual .27 m rise; their bottoms slide above the next tread.
    const tray = grp(); tray.position.set(0, yy - rise + .025, zz);
    box(tray, w - .18, .025, .28, '#c59b6b', 0, .0125, -.015);
    for (const x of [-.40, .40]) box(tray, .025, .15, .28, CREAM, x, .09, -.015);
    box(tray, .82, .15, .025, CREAM, 0, .09, -.14);
    box(tray, w - .13, rise - .13, .048, i % 3 === 0 ? '#9bb8ad' : '#d8b484', 0, (rise - .13) / 2 + .023, run / 2 - .023, .012);
    box(tray, .19, .026, .025, EDGE, 0, .12, run / 2 + .014, .007);
    if (i < 4) {
      box(tray, .26, .09, .15, ['#d77464', '#85a9ba', '#f0d38c', '#90af96'][i], -.16, .072, -.015, .01);
      box(tray, .21, .065, .16, '#eee4ce', .15, .060, -.015, .006);
    }
    g.add(tray);
    const p = f.part('slide', tray, (t, b) => { tray.position.z = b.p.z + .24 * t; }, { label: `계단 수납 ${i + 1}` });
    if (i === 4 || i === 6) f.spot('inside', tray, 0, .029, -.01, { part: p, maxH: .15, label: '계단 속 게임팩' });
  }
  // A real cupboard in the side stringer: shelves, folded blankets and a manga storage box.
  for (const z of [-1.17, -.425]) box(g, w - .14, 1.17, .045, '#c5ad89', 0, .735, z, .008);
  for (const y of [.15, .72, 1.32]) box(g, w - .12, .035, .70, '#c5ad89', 0, y, -.795, .008);
  box(g, .38, .25, .34, '#89aab8', -.12, .295, -.82, .02);
  box(g, .39, .045, .35, '#cad9d7', -.12, .442, -.82, .012);
  box(g, .008, .075, .18, CREAM, .077, .31, -.80, .003);
  for (const y of [.79, .87]) box(g, .49, .075, .38, y < .8 ? '#b9c8b4' : '#e5c393', -.04, y, -.80, .025);
  const door = grp(); put(door, w / 2 + .015, .17, -1.15);
  box(door, .045, 1.13, .70, '#99b8aa', 0, .565, .35, .018);
  box(door, .012, .92, .52, '#b8cbb8', .029, .565, .35, .014);
  box(door, .055, .14, .027, EDGE, .048, .565, .61, .008);
  g.add(door);
  const cupboard = f.part('door', door, t => { door.rotation.y = 1.50 * t; }, { label: '계단 옆 수납장' });
  f.spot('inside', null, .20, .17, -.70, { part: cupboard, maxH: .42, label: '계단 옆 진짜 수납칸' });
  // Handrail with real uprights at the ends; stair landing meets the deck at the same height.
  for (const z of [z0 + .02, depth / 2 - .12]) {
    const yy = z < 0 ? h : rise;
    box(g, .045, .72, .045, INK, w / 2 + .035, yy + .36, z, .008);
  }
  rod(g, [w / 2 + .035, h + .72, z0 + .02], [w / 2 + .035, rise + .72, depth / 2 - .12], .029, OAK);
  f.stairs = { from: { x: 0, y: 0, z: depth / 2 }, to: { x: 0, y: h, z: -depth / 2 }, steps: n, rise, run, width: w };
};

B.gpt_loft_bed = f => {
  const g = f.group;
  for (const x of [-.61, .61]) for (const z of [-.91, .91]) box(g, .075, .21, .075, EDGE, x, .105, z);
  box(g, 1.38, .18, 2.02, OAK, 0, .24, 0, .06);
  box(g, 1.29, .15, 1.94, '#fff9e9', 0, .395, 0, .09);
  box(g, 1.38, .48, .09, '#be956a', 0, .44, -.98, .035);
  const duvet = grp();
  box(duvet, 1.32, .14, 1.37, '#7faaa6', 0, .507, .265, .085);
  // Broad stitched gingham bands: geometric trim, never a stretched box texture.
  for (const x of [-.46, -.04, .38]) box(duvet, .12, .012, 1.29, '#c1d5c7', x, .582, .265, .004);
  for (const z of [-.2, .21, .62]) box(duvet, 1.28, .014, .10, '#c1d5c7', 0, .584, z, .004);
  g.add(duvet);
  box(g, .91, .17, .43, '#f9e9c8', 0, .515, -.65, .095);
  // Raccoon plush: recognisable ears, eye mask, striped tail and cream muzzle.
  const plush = grp(); plush.add(put(sph(.15, '#a88d7b', null, 12, 8), .45, .68, -.63, 0, 0, 0, [.85, 1.12, .8]));
  for (const x of [.35, .55]) plush.add(put(sph(.061, '#856e62', null, 10, 6), x, .81, -.64));
  for (const x of [.397, .503]) { plush.add(put(sph(.045, INK, null, 10, 6), x, .71, -.515, 0, 0, 0, [1.15, .8, .35])); plush.add(put(sph(.012, '#fff9e9', null, 8, 6), x, .715, -.493)); }
  plush.add(put(sph(.065, CREAM, null, 10, 6), .45, .65, -.51, 0, 0, 0, [1, .65, .45]));
  plush.add(put(sph(.018, INK, null, 8, 6), .45, .665, -.478)); g.add(plush);
  f.spot('on', null, -.3, .59, .53, { maxH: .32, label: '복층 이불 위' });
};

B.gpt_rain_window = (f, T, o = {}) => {
  const g = f.group, w = o.w || 2.0, h = o.h || 2.0, y = o.y || 1.86;
  // Front faces only: the city is painted on its own flat pane, never wrapped around a box.
  const city = tex.get(`gpt-rain-city|${w}|${h}`, () => canvasTex(Math.round(512 * w / h), 512, (c, W, H) => {
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#33485e'); sky.addColorStop(1, '#8296a0'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const colors = ['#4d6375', '#586b79', '#3b5368', '#637c89'];
    for (let i = 0; i < Math.ceil(W / 62) + 1; i++) { const x = i * 62 - 20, yy = 230 + (i * 47) % 130; c.fillStyle = colors[i % 4]; c.fillRect(x, yy, 58, H - yy);
      for (let z = yy + 16; z < H; z += 30) for (let u = x + 10; u < x + 50; u += 19) { c.fillStyle = (u + z + i) % 3 ? '#b8af82' : '#8397a1'; c.fillRect(u, z, 7, 10); }
    }
    // Small condensation beads, with no full-image smearing.
    for (let i = 0; i < 60; i++) { const x = (i * 173) % W, yy = (i * 91) % H; c.fillStyle = 'rgba(214,235,238,.35)'; c.beginPath(); c.ellipse(x, yy, 1.4, 3.6, .2, 0, 7); c.fill(); }
  }));
  box(g, w + .19, h + .19, .11, '#d9c8ae', 0, y, .08, .028);
  // o.night (18판 섞은 안, 10/22 사용자 "밖에 비 오는 애니메이션"): the city at night — lit windows that glow (unlit material, like
  // our rainwin), rain sheeting down the glass (a streak texture scrolling, added on in colour only) and the drops running faster
  if (o.night) {
    const night = tex.get(`gpt-rain-night|${w}|${h}`, () => canvasTex(Math.round(512 * w / h), 512, (c, W, H) => {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a2140'); sky.addColorStop(.75, '#2d3962'); sky.addColorStop(1, '#3f4a76'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      for (let i = 0; i < Math.ceil(W / 40) + 1; i++) {
        const x = i * 40 - 10, top = 160 + (i * 37) % 90; c.fillStyle = '#323d66'; c.fillRect(x, top, 36, H - top);
        for (let yy = top + 12; yy < H; yy += 22) for (let u = x + 6; u < x + 32; u += 12) if ((u * 7 + yy * 3 + i) % 5 === 0) { c.fillStyle = '#b9a879'; c.fillRect(u, yy, 5, 7); }
      }
      for (let i = 0; i < Math.ceil(W / 64) + 1; i++) {
        const x = i * 64 - 22, top = 250 + (i * 53) % 120; c.fillStyle = ['#1f2742', '#252e4c', '#1b2239'][i % 3]; c.fillRect(x, top, 60, H - top);
        for (let yy = top + 14; yy < H; yy += 28) for (let u = x + 9; u < x + 52; u += 16) { const k = (u * 13 + yy * 7 + i * 5) % 9; c.fillStyle = k < 3 ? '#ffd98a' : k === 3 ? '#9fd8ff' : k === 4 ? '#ffb877' : '#2e3858'; c.fillRect(u, yy, 8, 11); }
      }
    }));
    const nm = new THREE.MeshBasicMaterial({ map: night }); nm.toneMapped = false;
    g.add(put(new THREE.Mesh(new THREE.PlaneGeometry(w, h), nm), 0, y, .142));
    const streak = tex.get('gpt-rain-streaks', () => canvasTex(128, 256, (c, W, H) => {
      c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.lineCap = 'round';
      let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 44; i++) {
        const x = r() * W, yy = r() * H, len = 16 + r() * 30, a = .3 + r() * .55; c.strokeStyle = `rgba(205,228,255,${a.toFixed(2)})`; c.lineWidth = r() < .3 ? 2 : 1.2;
        for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) { c.beginPath(); c.moveTo(x + dx, yy + dy); c.lineTo(x + dx - len * .16, yy + dy + len); c.stroke(); }
      }
    }, { repeat: [1.6, 1.3] }));
    const sm = new THREE.MeshBasicMaterial({ map: streak, color: '#a9c2e6', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); sm.toneMapped = false;
    const sheet = put(new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm), 0, y, .152);
    sheet.layers.set(2); sheet.renderOrder = 3; sheet.castShadow = false; sheet.userData.noOcclude = true; sheet.userData.noMerge = true; g.add(sheet);
    const dm = new THREE.MeshBasicMaterial({ color: '#c4dcf6', transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }); dm.toneMapped = false;
    const rain = grp(); const drops = [];
    for (let i = 0; i < 26; i++) {
      const yy = (i * .317) % h, len = .07 + (i % 4) * .03;
      const m = put(new THREE.Mesh(new THREE.PlaneGeometry(.014, len), dm), (i * .397) % (w - .1) - w / 2 + .05, yy - h / 2, .16, 0, 0, -.16);
      m.layers.set(2); m.renderOrder = 3; m.castShadow = false; m.userData.noMerge = true; rain.add(m); drops.push({ m, yy, speed: .5 + (i % 5) * .12 });
    }
    rain.position.y = y; g.add(rain); f.live = [sheet, ...drops.map(d => d.m)];
    f.tick = t => { streak.offset.y = (t * .85) % 1; for (const d of drops) d.m.position.y = ((d.yy - t * d.speed) % (h - .1) + h - .1) % (h - .1) - (h - .1) / 2; };
  } else {
  panel(g, w, h, city, 0, y, .142);
  // Rain streaks move only within the glazing; the shared game tick is throttled by its existing loop.
  const rain = grp(); const drops = [];
  for (let i = 0; i < 30; i++) {
    const yy = (i * .317) % h, len = .055 + (i % 4) * .018;
    const m = put(rbox(.012, len, .008, '#aec9d0', .003), (i * .397) % (w - .1) - w / 2 + .05, yy - h / 2, .16, 0, 0, -.16);
    m.castShadow = false; rain.add(m); drops.push({ m, yy, speed: .12 + (i % 5) * .035 });
  }
  rain.position.y = y; g.add(rain); f.live = drops.map(d => d.m);
  f.tick = t => { for (const d of drops) d.m.position.y = ((d.yy - t * d.speed) % (h - .1) + h - .1) % (h - .1) - (h - .1) / 2; };
  }
  for (const x of [-w / 2, 0, w / 2]) box(g, .045, h + .05, .07, CREAM, x, y, .20, .01);
  for (const yy of [y - h / 2, y + h / 2, y - .12]) box(g, w + .05, .045, .07, CREAM, 0, yy, .20, .01);
  box(g, w + .34, .09, .34, OAK, 0, y - h / 2 - .06, .17, .028);
  // Gathered heavy curtains on a solid rod; broad folds read at 390 px.
  rod(g, [-w / 2 - .22, y + h / 2 + .15, .22], [w / 2 + .22, y + h / 2 + .15, .22], .025, EDGE);
  for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {
    box(g, .075, h + .02, .11, i % 2 ? '#d7b79a' : '#e7ccb1', sg * (w / 2 + .055) + (i - 1.5) * .047, y, .24 + (i % 2) * .025, .03);
  }
  f.noSolid = true;
};

B.gpt_reading_bay = f => {
  const g = f.group;
  box(g, 1.9, .29, .73, OAK, 0, .145, 0, .04);
  box(g, 1.83, .14, .68, '#b3c2ac', 0, .36, 0, .06);
  for (const x of [-.58, .12, .65]) box(g, .52, .12, .44, x > 0 ? '#f0dbb4' : '#d88f7c', x, .47, -.04, .055);
  box(g, 1.72, .16, .035, '#9b7856', 0, .15, .38, .012);
  for (const x of [-.55, .55]) box(g, .22, .026, .026, EDGE, x, .18, .412);
  f.spot('on', null, -.15, .56, .17, { maxH: .34, label: '창가 쿠션' });
};

B.gpt_coffee_table = f => {
  const g = f.group;
  for (const x of [-.44, .44]) for (const z of [-.29, .29]) box(g, .065, .33, .065, EDGE, x, .165, z, .02);
  box(g, 1.14, .09, .82, '#e3bd85', 0, .375, 0, .105);
  // Oversize two-tone game controller, buttons and a cord to the console.
  const pad = grp(); box(pad, .38, .065, .19, '#ebe7d8', 0, .46, .17, .055);
  box(pad, .10, .018, .026, INK, -.10, .505, .17, .005); box(pad, .026, .018, .10, INK, -.10, .506, .17, .005);
  for (const x of [.08, .145]) pad.add(put(cyl(.018, .018, .018, '#b75e54', null, 10), x, .508, .17)); g.add(pad);
  const wire = new THREE.CatmullRomCurve3([new THREE.Vector3(-.12, .46, .11), new THREE.Vector3(-.5, .43, .12), new THREE.Vector3(-.62, .12, -.05), new THREE.Vector3(-.8, .026, -.38), new THREE.Vector3(-.5, .026, -.67)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 18, .012, 5, false), mat(INK)));
  f.spot('on', null, .23, .425, -.14, { maxH: .35, label: '낮은 게임 테이블' });
};

B.gpt_woven_rug = f => {
  const g = f.group;
  box(g, 2.8, .025, 2.1, '#769590', 0, .018, 0, .17);
  box(g, 2.64, .012, 1.94, '#d6d7bd', 0, .038, 0, .14);
  box(g, 2.45, .01, 1.75, '#e4dfc5', 0, .049, 0, .13);
  for (const x of [-1.08, 1.08]) box(g, .06, .012, 1.48, '#bd9e77', x, .058, 0, .005);
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
};

B.gpt_floorlamp = f => {
  const g = f.group;
  g.add(put(cyl(.19, .20, .045, EDGE, null, 20), 0, .0225, 0));
  rod(g, [0, .04, 0], [0, 1.28, 0], .021, INK);
  // A thick open lampshade, with a bulb and rim visible from the actual room camera.
  const profile = [[.28, 0], [.17, .34], [.155, .34], [.263, .012], [.28, 0]].map(p => new THREE.Vector2(...p));
  const shade = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), mat('#f2d5a0', { side: THREE.DoubleSide }));
  shade.position.y = 1.18; shade.castShadow = true; g.add(shade);
  g.add(put(sph(.07, '#ffe8b1', { emissive: '#ffe0a0', ei: .35 }, 10, 8), 0, 1.27, 0));
  const cord = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .04, 0), new THREE.Vector3(-.11, .024, -.13), new THREE.Vector3(-.27, .024, -.18), new THREE.Vector3(-.32, .024, -.07)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 12, .009, 5, false), mat(INK)));
  if (!lampGlow) lampGlow = fadeDisc(64, '#ffcb73', r => Math.max(0, 1 - r) ** 2 * .22);
  // (① 10/22: 1.55 m였던 빛 원은 가구 상자에 들어가 1.5 m 둘레 보행 칸을 막아서 발치만)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ map: lampGlow, transparent: true, depthWrite: false }));
  put(glow, 0, .009, 0, -Math.PI / 2); glow.userData.noOcclude = true; g.add(glow);
};

B.gpt_bedside = f => {
  const g = f.group;
  box(g, .44, .40, .43, OAK, 0, .20, 0, .025);
  box(g, .34, .23, .014, '#c6996a', 0, .225, .223, .012);
  box(g, .13, .024, .018, EDGE, 0, .23, .242, .005);
  for (let i = 0; i < 3; i++) box(g, .23, .035, .21, ['#7f9fa9', '#e0c390', '#c77f6d'][i], -.035 + (i % 2) * .025, .424 + i * .036, .04, .008);
  g.add(put(cyl(.07, .085, .03, TEAL, null, 16), .10, .415, -.10));
  rod(g, [.1, .43, -.1], [.1, .68, -.1], .013, EDGE);
  g.add(put(cyl(.09, .15, .17, '#f4d397', null, 20), .10, .71, -.10));
};

// 18판 섞은 안 2차 (10/22 사용자 "텍스처 디테일하게"): 이 방만 쓰는 벽지·마루 그림 (patterns.js 방식 — 256 칸 한 장이 이어 붙음,
// a 바탕·b 강조). 상점 목록에는 안 나옴(shop.js가 이름으로 고름).
// 벽지: 넓은 띠(b)와 그 가장자리 가는 선, 띠 사이 두 줄 가는 핀 줄무늬, 띠 가운데 작은 네 갈래 반짝이·점, 종이 결
function otakuPaper(c, S, a, b) {
  let s = 29; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const edge = tone(b, -.16), pin = tone(b, -.1), star = tone(a, .6), dot = tone(b, -.2);
  for (let x = 0; x < S; x += 64) {
    c.fillStyle = b; c.fillRect(x, 0, 26, S);
    c.fillStyle = edge; c.fillRect(x, 0, 1.2, S); c.fillRect(x + 24.8, 0, 1.2, S);
    c.fillStyle = pin; c.fillRect(x + 40, 0, 1, S); c.fillRect(x + 48, 0, 1, S);
    for (let y = 0; y < S; y += 32) {
      const yy = y + ((x / 64) % 2 ? 16 : 0) + 8;
      c.save(); c.translate(x + 13, yy); c.fillStyle = star; c.beginPath();
      for (let i = 0; i < 8; i++) { const an = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? 1.4 : 4.6; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      c.fill(); c.restore();
      c.fillStyle = dot; c.beginPath(); c.arc(x + 44.5, yy + 16, 1.3, 0, 7); c.fill();
    }
  }
  for (let i = 0; i < 900; i++) { c.fillStyle = R() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(90,70,100,.05)'; c.fillRect(R() * S, R() * S, 1, 1); }
}
// 마루: 좁은 널(256 칸에 10줄 = 20 cm), 줄마다 엇갈린 이음매, 널마다 다른 톤, 물결 나뭇결·큰 무늬결·옹이, 홈 그림자와 모서리 빛
function otakuOak(c, S, a, b) {
  let s = 41; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const rows = 10, rh = S / rows, gap = tone(b, -.32), grain = tone(b, -.12), knot = tone(b, -.28);
  const plank = (bx, y, L, fill, g) => {
    for (const ox of bx + L > S ? [0, -S] : [0]) {
      const x = bx + ox;
      c.save(); c.beginPath(); c.rect(x, y, L, rh); c.clip();
      c.fillStyle = fill; c.fillRect(x, y, L, rh);
      c.strokeStyle = grain; c.lineWidth = .7;
      for (const q of g.lines) { c.globalAlpha = q.a; c.beginPath(); c.moveTo(x, y + q.y); c.bezierCurveTo(x + L * .3, y + q.y + q.w, x + L * .65, y + q.y - q.w, x + L, y + q.y + q.w * .4); c.stroke(); }
      if (g.arc) { c.globalAlpha = .22; c.lineWidth = .8; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x + g.arc.x * L, y + rh / 2, g.arc.l * (1 - k * .28), rh * (.34 - k * .09), 0, 0, 7); c.stroke(); } }
      if (g.knot) { c.globalAlpha = .55; c.fillStyle = knot; c.beginPath(); c.ellipse(x + g.knot.x * L, y + g.knot.y * rh, 2.4, 1.5, 0, 0, 7); c.fill(); c.globalAlpha = .3; c.strokeStyle = knot; c.beginPath(); c.ellipse(x + g.knot.x * L, y + g.knot.y * rh, 4.4, 2.8, 0, 0, 7); c.stroke(); }
      c.globalAlpha = .75; c.fillStyle = gap; c.fillRect(x, y, 1.1, rh);
      c.globalAlpha = .2; c.fillStyle = '#ffffff'; c.fillRect(x + 1.1, y, .8, rh);
      c.restore();
    }
  };
  for (let r = 0; r < rows; r++) {
    const y = r * rh, x0 = R() * S, L1 = 96 + R() * 64;
    for (const [bx, L] of [[x0, L1], [(x0 + L1) % S, S - L1]]) {
      const lines = []; for (let k = 0; k < 4; k++) lines.push({ y: 3 + k * (rh - 6) / 3 + (R() - .5) * 2, w: (R() - .5) * 3, a: .18 + R() * .16 });
      plank(bx, y, L, tone(a, -.08 + R() * .12), { lines, arc: R() < .45 ? { x: .25 + R() * .5, l: 18 + R() * 22 } : null, knot: R() < .3 ? { x: .15 + R() * .7, y: .3 + R() * .4 } : null });
    }
  }
  for (let r = 0; r <= rows; r++) { c.globalAlpha = .8; c.fillStyle = gap; c.fillRect(0, r * rh - .6, S, 1.2); c.globalAlpha = .22; c.fillStyle = '#ffffff'; c.fillRect(0, r * rh + .6, S, .8); }
  c.globalAlpha = 1;
}
WALL_PAINT.otakupaper ||= otakuPaper;
FLOOR_PAINT.otakuoak ||= otakuOak;

export const GPT_ROOM_BUILDERS = B;
export const GPT_ROOM_INFO = {
  gpt_mezzanine: { name: '참나무 반층 데크', w: 4, d: 3 },
  gpt_storage_stairs: { name: '게임팩 수납 계단', w: 1, d: 3 },
  gpt_loft_bed: { name: '너굴이의 체크 이불 침대', w: 2, d: 2 },
  gpt_rain_window: { name: '비 오는 도시 창', w: 2, d: 1, wall: true },
  gpt_reading_bay: { name: '쿠션 창가 벤치', w: 2, d: 1 },
  gpt_coffee_table: { name: '콘솔 놀이 테이블', w: 1, d: 1 },
  gpt_woven_rug: { name: '청록 짜임 러그', w: 3, d: 2, floor: true },
  gpt_floorlamp: { name: '비 오는 저녁의 장스탠드', w: 1, d: 1 },
  gpt_bedside: { name: '책과 램프 협탁', w: 1, d: 1 },
};
