// GPT workshop, 2026-10-22. New outdoor police-front models only.
// Static colour geometry uses the canon HG/hmc toon pipeline. Every door has a
// hollow case behind it; every drawer carries its own floor, sides and hide spot.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc } from './house-props.js';
import { TOWN_BUILDERS } from './town-props.js';
import { reindexExact } from './bake.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)

const PI = Math.PI, HP = PI / 2;
// hmc emits triangle soup. Re-index this workshop's meshes only, retaining
// distinct face normals/colours so the canon's crisp toon creases stay intact.
const mc = (key, build) => {
  const m = hmc(key, build), source = m.geometry;
  m.geometry = geo('gpt-police-indexed|' + source.uuid, () => {
    const g = mergeVertices(source); g.name = source.name; return g;
  });
  return m;
};
// LOOK.md palette: cream/sand dominate, honey wood and sage carry the middle,
// brown is confined to small frames and feet; blue remains a police-sign accent.
const C = { cream: '#fef2e1', pale: '#f6e0bf', blue: '#84ae9d', navy: '#6f4b30', police: '#84ae9d',
  mint: '#a2c8bb', steel: '#a09769', dark: '#6f4b30', wood: '#eaa440', woodD: '#c67f2a',
  white: '#fefde9', yellow: '#feb53d', coral: '#ee9d4c', leaf: '#84ae9d', leaf2: '#c6c393', soil: '#6f4b30' };
const B = {}, TEX = texCache();
const font = px => `700 ${px}px "Ssurround", "Jua", system-ui, sans-serif`;
const decal = (w, h, tex) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex }), { cast: false });
// Never use fillText(maxWidth): it silently squeezes letters. Fit actual glyph
// metrics within a 10% safe border and retain the game's round Korean face.
const fitText = (c, text, x, y, width, height, maxSize) => {
  text = tr(text);   // (영어 화면에선 영어 — 사전 gfx/gpt-paper.js WORDS, ① 10/22)
  let size = Math.floor(Math.min(maxSize, height * .82));
  do { c.font = font(size); if (c.measureText(text).width <= width) break; } while (--size > 8);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y);
};
const label = (key, title, { bg = C.navy, fg = C.white, sub = '', w = 512, h = 128 } = {}) =>
  TEX.get('gpt-police|' + key, () => canvasTex(w, h, (c, W, H) => {
    c.fillStyle = bg; roundRect(c, 0, 0, W, H, 12); c.fill();
    c.fillStyle = fg;
    fitText(c, title, W / 2, sub ? H * .35 : H * .50, W * .80, H * (sub ? .48 : .80), H * .64);
    if (sub) fitText(c, sub, W / 2, H * .76, W * .80, H * .24, H * .22);
  }));
// Each notice has its own face texture and a real lifted corner. Pins and
// masking tape sit above the surface and turn together with the notice panel.
const paper = (key, w, h, draw, cw = 512, ch = 768) => {
  const g = grp(), geometry = new THREE.PlaneGeometry(w, h, 4, 4), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = Math.max(0, (p.getX(i) / w - .25) * 4), v = Math.max(0, (-p.getY(i) / h - .25) * 4);
    p.setZ(i, .027 * u * v);
  }
  geometry.computeVertexNormals();
  const tex = TEX.get('gpt-police-paper|' + key, () => canvasTex(cw, ch, (c, W, H) => {
    c.fillStyle = C.white; c.fillRect(0, 0, W, H); draw(c, W, H);
  }));
  g.add(mesh(geometry, mat('#ffffff', { map: tex, side: THREE.DoubleSide }), { cast: false }));
  g.add(mc('gpt-police-paper-fix|' + key, ({ add }) => {
    add(G.box(w + .008, h + .008, .006, .003), C.woodD, .007, -.007, -.009);
    for (const x of [-w * .29, w * .28]) add(G.box(w * .25, h * .075, .009, .003), C.pale, x, h * .45, .009, 0, 0, x < 0 ? -.12 : .10);
    add(G.sph(.012, 6, 4), C.coral, 0, h * .43, .013, 0, 0, 0, [1, 1, .5]);
  }));
  return g;
};
const star = (r, r2) => {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const a = HP + k * PI / 5, rr = k % 2 ? r2 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (!k) s.moveTo(x, y); else s.lineTo(x, y); }
  s.closePath(); return s;
};
const phase = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const gear = (key, r, color, teeth = 10) => mc(key, ({ add }) => {
  add(G.cyl(r * .78, r * .78, .055, teeth), color, 0, 0, 0, HP);
  add(G.tor(r * .58, .025, PI * 2, 5, teeth * 2), C.steel, 0, 0, .035);
  add(G.cyl(.043, .043, .10, 8), C.navy, 0, 0, .035, HP);
  for (let k = 0; k < teeth; k++) { const a = k * PI * 2 / teeth; add(G.box(r * .30, .075, .07, .008), color, Math.cos(a) * r, Math.sin(a) * r, 0, 0, 0, a - HP); }
});
const cord = () => mesh(G.cyl(.016, .016, 1, 6), mat('#eecfa3'));
const setCord = (o, x, z, top, bottom) => { const len = Math.max(.025, top - bottom); o.scale.y = len; o.position.set(x, bottom + len / 2, z); };
const handleAt = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
const reaction = (p, line, sounds) => {
  p.gptReaction = line; p.gptSounds = sounds;
  p.afterOpen = S => { if (p.gptReacted || !S.friend || S.dead) return; p.gptReacted = true; S.say(S.friend, line, 1500); };
};
const crank = (key, r = .20) => mc(key, ({ add }) => {
  add(G.box(r, .055, .06, .02), C.navy, r / 2, 0, .075);
  add(G.cyl(.055, .055, .12, 10), C.yellow, r, 0, .14, HP);
  add(G.sph(.063, 8, 6), C.yellow, r, 0, .21);
});
const flowers = (add, tube, cx, y, z, spread = .6) => {
  for (let k = 0; k < 5; k++) {
    const x = cx + (k - 2) * spread / 4, zz = z + (k % 2 ? -.065 : .065), yy = y + .16 + (k % 3) * .045;
    tube([x, y, zz], [x, yy, zz], .018, C.leaf, 5);
    add(G.sph(.085, 7, 5), k % 2 ? C.leaf : C.leaf2, x - .045, y + .07, zz, 0, 0, -.4, [1, .5, .8]);
    add(G.sph(.08, 7, 5), C.leaf2, x + .045, y + .11, zz, 0, 0, .4, [1, .5, .8]);
    const color = [C.white, '#ee9d4c', C.yellow, C.white, '#ee9d4c'][k];
    for (let p = 0; p < 5; p++) { const a = p * PI * 2 / 5; add(G.sph(.047, 6, 4), color, x + Math.cos(a) * .044, yy + .025, zz + Math.sin(a) * .044, 0, 0, 0, [1, .55, 1]); }
    add(G.sph(.027, 6, 4), C.yellow, x, yy + .045, zz, 0, 0, 0, [1, .6, 1]);
  }
};
const leafyPot = (add, tube, x, y, z) => {
  add(G.cyl(.19, .145, .30, 10), C.coral, x, y + .15, z);
  add(G.tor(.185, .025, PI * 2, 5, 12), C.pale, x, y + .29, z, HP);
  add(G.cyl(.158, .158, .02, 10), C.soil, x, y + .302, z);
  tube([x, y + .31, z], [x, y + .96, z], .025, C.woodD, 6);
  for (let k = 0; k < 7; k++) {
    const a = k * 2.4, yy = y + .48 + k * .07, dx = Math.cos(a) * .15, dz = Math.sin(a) * .12;
    tube([x, yy - .04, z], [x + dx, yy, z + dz], .018, C.leaf, 5);
    add(G.sph(.12, 7, 5), k % 2 ? C.leaf : C.leaf2, x + dx, yy + .02, z + dz, 0, -a, .22, [1.5, .45, .85]);
  }
};

// Eight-metre facade anchored on the rear row, with a real entry and service
// window cut out of it. The building continues behind the playable forecourt.
B.gpt_policebox = f => {
  const FZ = -.13, BACK = -2.05, W = 7.6, H = 2.62, DY = .18;
  const DL = -2.23, DR = -1.07, WL = -.45, WR = 2.05, WIN0 = .90, WIN1 = 2.03;
  // The rear band stops adjacent furniture doors without counting the canopy.
  // The complete building AABB blocks generic floor nodes; the explicit step
  // paths below are the only way onto its actual treads and indoor landing.
  f.collideBox = [-3.8, 0, -2.14, 3.8, 2.8, -.17];
  f.add(mc('gpt-policebox-v1', ({ add, tube }) => {
    // Thick foundations, two entrance steps and a floor that continues indoors.
    add(G.box(W, .18, 2.04, .045), C.pale, 0, .09, -1.08);
    add(G.box(1.48, .09, .7, .025), '#e8d7b7', (DL + DR) / 2, .045, .27);
    add(G.box(1.3, .09, .46, .02), '#fef2e1', (DL + DR) / 2, .135, .13);
    add(G.box(1.02, .025, .4, .01), '#a09769', (DL + DR) / 2, .205, -.35);
    // A low partition keeps the hall/office plan legible in the roof cut-away.
    add(G.box(.10, .70, 1.55, .015), '#f2dcbc', -.68, DY + .35, -1.16);
    // A three-step corridor stair is visible through the entrance when opened.
    for (let k = 0; k < 3; k++) add(G.box(1.02, .12 * (k + 1), .3, .018), '#eecfa3', -1.65, DY + .06 * (k + 1), -1.22 - .29 * k);
    tube([-2.13, .62, -1.12], [-2.13, .91, -1.94], .025, C.steel, 7);
    for (const z of [-1.16, -1.88]) tube([-2.13, .24, z], [-2.13, z < -1.5 ? .88 : .65, z], .022, C.steel, 7);
    // Interior counter, stool, monitor, pigeonholes and files behind the window.
    // Interior counter: .92 m above the .18 m landing; outer service ledge:
    // .95 m above the forecourt. Stool seat is .475 m above its own floor.
    add(G.box(2.25, .08, .62, .025), C.wood, .80, 1.06, -.89);
    for (const x of [-.21, 1.81]) add(G.box(.08, .84, .46, .015), C.woodD, x, .60, -.92);
    add(G.box(.68, .42, .045, .025), C.dark, .70, 1.38, -1.03);
    add(G.box(.58, .32, .014, .01), '#b0e5e8', .70, 1.38, -.998);
    add(G.box(.05, .20, .05, .01), C.dark, .70, 1.13, -1.03); add(G.box(.35, .035, .18, .01), C.dark, .70, 1.085, -.98);
    add(G.box(.30, .03, .16, .01), C.white, 1.4, 1.115, -.70, 0, -.1);
    add(G.cyl(.24, .24, .07, 10), C.mint, .65, .62, -1.46); add(G.cyl(.045, .07, .41, 8), C.steel, .65, .405, -1.46);
    add(G.box(.55, .08, .54, .035), C.steel, .65, .2, -1.46);
    for (const y of [.84, 1.31, 1.78]) add(G.box(1.18, .05, .28, .01), C.white, 2.82, y, -1.8);
    for (const x of [2.24, 3.4]) add(G.box(.045, 1.0, .28, .01), C.white, x, 1.30, -1.8);
    for (let k = 0; k < 4; k++) add(G.box(.11, .31, .19, .01), [C.blue, C.coral, C.yellow, C.mint][k], 2.36 + k * .14, 1.49, -1.8, 0, 0, (k - 1) * .02);
  }));
  // Canonical Room walls fold the near side to knee height using an inward
  // normal dot camera heading < -.18. A furniture wall cannot join Room.walls,
  // so its separate tagged groups expose that same update through updateView.
  const cuts = [];
  const wallCut = (key, n, build) => {
    const g = grp(); g.position.y = DY; f.add(g);
    const m = mc('gpt-police-cutaway-' + key + '-v1', build);
    // userData.wall belongs to Room.walls: facing.js otherwise mistakes a
    // building's own facade for a wall blocking its own doorway hide spot.
    m.userData.gptWall = key; m.userData.noMerge = true; m.userData.gptCutaway = 'wall'; g.add(m);
    (f.live || (f.live = [])).push(g);
    const q = { g, kind: 'wall', n: new THREE.Vector3(...n), k: 1, stub: .58 / (H - DY), decor: [] }; cuts.push(q); return q;
  };
  const WH = H - DY;
  wallCut('N', [0, 0, 1], ({ add }) => add(G.box(W, WH, .16, .025), C.pale, 0, WH / 2, BACK));
  wallCut('W', [1, 0, 0], ({ add }) => add(G.box(.18, WH, 1.93, .025), C.pale, -W / 2 + .09, WH / 2, -1.1));
  wallCut('E', [-1, 0, 0], ({ add }) => add(G.box(.18, WH, 1.93, .025), C.pale, W / 2 - .09, WH / 2, -1.1));
  const facade = wallCut('S', [0, 0, 1], ({ add }) => {
    // This outward facade must fold from behind as well, otherwise it still
    // hides the forecourt after the near rear wall and roof have folded away.
    const wall = (a, b, y0 = DY, y1 = H) => add(G.box(b - a, y1 - y0, .2, .025), C.cream, (a + b) / 2, (y0 + y1) / 2 - DY, FZ - .1);
    wall(-W / 2, DL); wall(DR, WL); wall(WR, W / 2);
    wall(DL, DR, 2.30, H); wall(WL, WR, DY, WIN0); wall(WL, WR, WIN1, H);
    for (const [a, b] of [[-W / 2, DL], [DR, W / 2]]) add(G.box(b - a, .23, .035, .008), C.blue, (a + b) / 2, .54 - DY, FZ + .018);
  });
  const facadeDecor = grp(); f.add(facadeDecor); facade.decor.push(facadeDecor); (f.live || (f.live = [])).push(facadeDecor);
  const decorMesh = mc('gpt-police-facade-trim-v1', ({ add, tube }) => {
    for (const x of [DL - .025, DR + .025]) add(G.box(.085, 2.19, .31, .015), C.white, x, 1.27, FZ + .015);
    add(G.box(DR - DL + .15, .09, .31, .015), C.white, -1.65, 2.34, FZ + .015);
    for (const x of [WL + .02, WR - .02]) add(G.box(.075, WIN1 - WIN0, .21, .012), C.blue, x, (WIN1 + WIN0) / 2, FZ + .02);
    add(G.box(.055, WIN1 - WIN0 - .08, .1, .012), C.blue, 1.31, (WIN1 + WIN0) / 2, FZ + .04);
    add(G.box(WR - WL + .18, .10, .48, .025), C.wood, .8, WIN0, FZ + .12);
    add(G.box(WR - WL + .15, .075, .22, .015), C.blue, .8, WIN1, FZ + .04);
    add(G.box(3.18, .45, .11, .05), C.police, .8, 2.37, FZ + .10);
    add(G.ext(star(.16, .075), .025, .006), C.yellow, -.55, 2.37, FZ + .17);
    add(G.box(.45, .32, .05, .025), C.yellow, -2.70, 1.72, FZ + .04);
    add(G.box(.16, .22, .055, .025), C.navy, DR + .19, 1.10, FZ + .065);
    add(G.cyl(.042, .042, .025, 10), C.yellow, DR + .19, 1.12, FZ + .108, HP);
    tube([3.62, 2.6, -.46], [3.62, .20, -.46], .045, C.steel, 8);
    add(G.box(.32, .04, .28, .02), '#a09769', 3.62, .2, -.38);
    add(G.cyl(.115, .14, .11, 12), C.white, -2.65, 2.15, FZ + .09);
    add(G.sph(.11, 10, 6), '#b0e5e8', -2.65, 2.22, FZ + .09, 0, 0, 0, [1, .8, 1]);
    // Two tended pots flank the building, clear of the 1.05 m entry and window
    // lever. Their bases sit on the foundation, rather than floating outdoors.
    for (const x of [-3.22, 3.20]) leafyPot(add, tube, x, DY, FZ + .05);
  }); decorMesh.userData.noMerge = true; facadeDecor.add(decorMesh);
  const roofCut = (key, box, build) => {
    const g = grp(), m = mc('gpt-police-cutaway-' + key + '-v1', build); f.add(g); g.add(m);
    m.userData.noMerge = true; m.userData.gptCutaway = 'roof'; (f.live || (f.live = [])).push(g);
    cuts.push({ g, kind: 'roof', box });
  };
  // Keep an architectural outline instead of a solid blank roof filling a
  // quarter of the phone: a shallow front canopy and a narrow rear roof strip.
  roofCut('front-canopy', [-3.93, 2.56, -.26, 3.93, 2.76, .20], ({ add }) => {
    add(G.box(W + .26, .16, .46, .055), C.cream, 0, 2.68, FZ + .10);
    add(G.box(W + .18, .075, .14, .02), C.yellow, 0, 2.60, FZ + .26);
  });
  roofCut('rear-roof-strip', [-3.86, 2.65, -2.07, 3.86, 3.36, -1.55], ({ add, tube }) => {
    add(G.box(W + .12, .075, .38, .03), '#e8d7b7', 0, 2.69, -1.88);
    // A neighbour's short drying line sits above the eave, entirely behind the
    // facade. It adds everyday life without using a single walking-floor cell.
    for (const x of [1.05, 3.48]) {
      add(G.box(.20, .07, .22, .02), C.woodD, x, 2.76, -1.82);
      tube([x, 2.76, -1.82], [x, 3.33, -1.82], .028, C.navy, 6);
    }
    tube([1.05, 3.28, -1.82], [2.26, 3.22, -1.82], .019, C.woodD, 5);
    tube([2.26, 3.22, -1.82], [3.48, 3.28, -1.82], .019, C.woodD, 5);
    for (const [k, x] of [1.50, 2.25, 3.0].entries()) {
      const y = k === 1 ? 3.025 : 3.06;
      add(G.box(.42, .34, .028, .012), [C.coral, C.mint, C.cream][k], x, y, -1.82, 0, 0, (k - 1) * .045);
      add(G.box(.36, .035, .032, .008), C.pale, x, y - .12, -1.80);
      for (const dx of [-.13, .13]) add(G.box(.035, .072, .042, .007), C.yellow, x + dx, y + .16, -1.80);
    }
  });
  const camDir = new THREE.Vector3(), normal = new THREE.Vector3(), p3 = new THREE.Vector3(), origin = new THREE.Vector3();
  f.gptCutaways = cuts;
  f.updateView = (W, dt = 1 / 60) => {
    if (!W || !Number.isFinite(W.yaw)) return;
    f.group.updateWorldMatrix(true, false); f.group.parent?.getWorldPosition(origin);
    camDir.set(Math.sin(W.yaw), 0, Math.cos(W.yaw));
    const smooth = 1 - Math.exp(-Math.max(0, dt) * 12), cot = 1 / Math.tan(W.pitch || .62);
    for (const q of cuts) {
      if (q.kind === 'wall') {
        normal.copy(q.n).transformDirection(f.group.matrixWorld);
        const want = normal.dot(camDir) < -.18 ? 0 : 1, prev = q.k;
        q.k += (want - q.k) * smooth; if (Math.abs(q.k - want) < .002) q.k = want;
        if (q.k !== prev) { q.g.scale.y = q.stub + (1 - q.stub) * q.k; W.shadowDirty = true; }
        for (const g of q.decor) if (g.visible !== (q.k > .65)) { g.visible = q.k > .65; W.shadowDirty = true; W.idsDirty = true; }
      } else {
        // Project only this roof onto the floor along the view ray. It hides
        // solely when it covers the actual walking apron, regardless of yaw.
        const b = q.box; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) {
          p3.set(x, y, z).applyMatrix4(f.group.matrixWorld); const h = p3.y - origin.y;
          p3.x -= camDir.x * h * cot; p3.z -= camDir.z * h * cot;
          x0 = Math.min(x0, p3.x); x1 = Math.max(x1, p3.x); z0 = Math.min(z0, p3.z); z1 = Math.max(z1, p3.z);
        }
        const blocks = x1 > origin.x - 4 && x0 < origin.x + 4 && z1 > origin.z - 1.8 && z0 < origin.z + 3;
        if (q.g.visible === blocks) { q.g.visible = !blocks; W.shadowDirty = true; W.idsDirty = true; }
      }
    }
  };
  facadeDecor.add(put(decal(2.56, .32, label('station', '몽글 파출소', { bg: C.police, w: 1024 })), .95, 2.37, FZ + .163));
  facadeDecor.add(put(decal(.37, .22, label('112', '112', { bg: C.yellow, fg: C.navy, w: 216 })), -2.7, 1.72, FZ + .072));
  facadeDecor.add(put(decal(.8, .16, label('help', '민원 안내', { bg: C.cream, fg: C.navy, w: 640 })), .35, .75, FZ + .033));
  // Door glass is inset in a frame, with nothing behind it except the corridor.
  const door = grp(); put(door, DL + .055, DY + .035, FZ + .048); f.add(door);
  const DW = DR - DL - .11, DH = 2.08;
  door.add(mc('gpt-police-entry-door-v1', ({ add }) => {
    for (const x of [.035, DW - .035]) add(G.box(.07, DH, .075, .015), C.blue, x, DH / 2, 0);
    for (const y of [.065, .72, DH - .035]) add(G.box(DW - .10, y === .72 ? .075 : .10, .075, .014), C.blue, DW / 2, y, 0);
    add(G.box(DW - .10, .59, .06, .018), C.blue, DW / 2, .38, 0);
    add(G.box(.035, .35, .09, .012), C.steel, DW - .16, .99, .066);
    for (const y of [.86, 1.12]) add(G.box(.035, .045, .075, .01), C.steel, DW - .16, y, .042);
  }));
  const glass = put(mesh(G.pbox(DW - .13, DH - .82, .016), mat('#b0e5e8', { opacity: .28 }), { cast: false }), DW / 2, 1.39, 0);
  door.add(glass);
  const p = f.part('door', door, t => { door.rotation.y = -1.48 * t; }, { label: '파출소 현관문', sfx: 'door', dur: .38 });
  facade.decor.push(door);
  // Local coordinates on the modeled supports, never a second ground plane
  // under the foundation. The door gates only the interior continuation.
  f.walkSteps = [
    { label: '파출소 바깥 현관 두 계단', width: .95, points: [
      [-1.65, 0, 1.15], [-1.65, 0, .80], [-1.65, .09, .50], [-1.65, .18, .28],
    ] },
    { label: '열린 현관과 실내 계단', width: .95, door: p, minOpen: .95, points: [
      [-1.65, .18, .28], [-1.65, .18, -.12], [-1.65, .2175, -.40],
      [-1.65, .18, -.75], [-1.65, .18, -.91], [-1.65, .30, -1.20],
      [-1.65, .42, -1.51], [-1.65, .54, -1.69],
    ] },
  ];
  f.gptEntryPart = p;
  f.spot('inside', null, -1.65, .215, -.50, { part: p, maxH: .52, scale: .95, label: '파출소 현관 안' });
  f.spot('on', null, -.02, .96, .04, { maxH: .42, scale: .85, label: '민원 창구 선반' });
  // Device 2: the outside lever winds a visible gear and gathers the slatted
  // service shutter into its top housing, exposing the office and its clue shelf.
  const winMachine = mc('gpt-police-window-machine-v1', ({ add, tube }) => {
    add(G.box(2.52, .16, .26, .035), C.blue, .8, 2.11, FZ + .12);
    add(G.box(.26, .69, .13, .03), C.cream, 2.40, 1.57, FZ + .13);
    tube([2.34, 1.86, FZ + .21], [2.04, 2.11, FZ + .21], .035, C.steel, 8);
    add(G.cyl(.07, .07, .12, 10), C.navy, 2.42, 1.27, FZ + .20, HP);
  }); winMachine.userData.noMerge = true; facadeDecor.add(winMachine);
  const shutter = grp(); put(shutter, .8, 1.46, FZ + .13); f.add(shutter);
  shutter.add(mc('gpt-police-window-shutter-v1', ({ add }) => {
    for (let k = 0; k < 9; k++) add(G.box(2.31, .116, .07, .012), k % 3 ? C.cream : C.pale, 0, -.488 + k * .122, 0);
    add(G.box(.42, .055, .11, .015), C.blue, 0, -.50, .045);
  }));
  const lever = grp(); put(lever, 2.42, 1.27, FZ + .28); f.add(lever);
  lever.add(mc('gpt-police-service-lever-v1', ({ add }) => {
    add(G.box(.055, .34, .06, .015), C.navy, 0, .17, 0);
    add(G.cap(.065, .13, 2, 8), C.coral, 0, .36, 0, 0, 0, HP);
  }));
  const winGear = grp(); put(winGear, 2.34, 1.86, FZ + .23); winGear.add(gear('gpt-police-window-gear-v1', .15, C.yellow)); f.add(winGear);
  const wp = f.part('lift', [lever, winGear, shutter], t => {
    lever.rotation.z = -1.15 * t; winGear.rotation.z = -PI * 3 * t;
    const u = phase(t, .12, .95); shutter.scale.y = 1 - .90 * u; shutter.position.y = 1.46 + .495 * u;
  }, { label: '민원 창구 레버와 셔터', sfx: 'lift', dur: .85 });
  facade.decor.push(lever, winGear, shutter);
  wp.gptDevice = 'policeWindow'; wp.gptHandle = handleAt(lever, 0, .36, 0); f.gptWindowPart = wp;
  reaction(wp, '창구도 기지개 켜네!', ['creak', 'swish', 'clink', 'latch']);
  f.spot('inside', null, .10, 1.115, -.76, { part: wp, maxH: .48, scale: 1, label: '셔터 안 민원 창구' });
};

// Four independently opening, cushion-sized compartments for the lost-property
// boss. No painted facade: bottoms, partitions and backs are all solid geometry.
B.gpt_lostlockers = f => {
  // The four-door case follows the 1.86 m locker reference. The gears are an
  // attached device above it, measured separately from the storage body.
  const W = 1.68, D = .66, H = 1.86, Z = -.10, FZ = Z + D / 2, CW = .79, CH = .76, Y0 = .17;
  f.add(mc('gpt-lostlockers-case-v1', ({ add }) => {
    add(G.box(W, .12, D, .035), C.navy, 0, .10, Z);
    add(G.box(W + .08, .09, D + .07, .025), C.mint, 0, H, Z);
    add(G.pbox(W, H - .16, .045), '#a2c8bb', 0, (H + .16) / 2, Z - D / 2 + .0225);
    add(G.pbox(W - .08, H - .22, .018), '#84ae9d', 0, (H + .16) / 2, Z - D / 2 + .054);
    for (const x of [-W / 2 + .025, 0, W / 2 - .025]) add(G.box(.05, H - .17, D, .012), C.mint, x, (H + .17) / 2, Z);
    for (const y of [Y0, Y0 + CH + .045, Y0 + CH * 2 + .09]) add(G.box(W - .06, .045, D, .01), C.mint, 0, y, Z);
    // The fixed keepsakes sit at the back, leaving the foreground hide trays free.
    add(G.box(.22, .08, .18, .025), '#eecfa3', -.55, Y0 + .08, Z - .15);
    add(G.box(.22, .045, .18, .02), C.coral, -.55, Y0 + .14, Z - .15);
    add(G.box(.23, .12, .14, .035), C.yellow, .56, Y0 + CH + .13, Z - .16);
    add(G.box(.12, .08, .02, .015), C.yellow, .56, Y0 + CH + .22, Z - .14);
  }));
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const k = row * 2 + col, x = col ? .42 : -.42, by = Y0 + row * (CH + .045) + .025, cy = by + CH / 2;
    const left = col === 0, hinge = x + (left ? -1 : 1) * CW / 2, dir = left ? 1 : -1;
    const dv = grp(); put(dv, hinge, cy, FZ + .025); f.add(dv);
    dv.add(mc('gpt-lostlockers-door-v1|' + k, ({ add }) => {
      const dx = dir * CW / 2, color = [C.cream, '#a2c8bb', '#a2c8bb', C.cream][k];
      add(G.box(CW - .035, CH - .035, .045, .025), color, dx, 0, 0);
      add(G.box(.22, .13, .016, .015), C.white, dx - dir * .10, .11, .032);
      for (let n = 0; n < k + 1; n++) add(G.sph(.023, 6, 4), C.navy, dx - dir * .175 + n * .057, .11, .045, 0, 0, 0, [1, 1, .5]);
      add(G.box(.035, .15, .065, .015), C.navy, dir * (CW - .12), -.065, .049);
      for (const y of [-.10, .12]) add(G.box(.035, .035, .02, .006), C.steel, dir * .025, y, .035);
      for (let n = 0; n < 3; n++) add(G.box(.22, .014, .009, .005), '#84ae9d', dx - dir * .08, -.16 - n * .036, .028);
    }));
    const p = f.part('door', dv, t => { dv.rotation.y = dir * -1.57 * t; }, { label: `분실물 보관함 ${k + 1}번`, sfx: 'door', dur: .34 });
    p.lockable = true; p.lockKind = ['pad', 'code', 'color', 'lever'][k];
    p.lockAt = { x: dir * (CW - .21), y: -.13, z: .075, parent: dv };
    if (!k) f.lockAt = p.lockAt;
    const s = f.spot('inside', null, x, by + .035, Z + .07, { part: p, maxH: .48, scale: .95, label: `분실물 ${k + 1}번 칸 안` });
    const tray = f.pullOut(p, s, FZ + .16, { w: .57, d: .42, color: '#f2dcbc' });
    // pullOut animates this sibling of the door pivot; keep its real mesh out
    // of static-body baking so the tray travels with its hidden find.
    (f.live || (f.live = [])).push(tray);
  }
  // Device 1, the primary escape-room chain. The upper case is a real shallow
  // clue cupboard; meshing gears engage the shutter's toothed rack. Its rope
  // passes over a supported pulley and a counterweight descends as it opens.
  // Translate the whole attached mechanism with its anchors and ropes; shorten
  // only its empty guide headroom, keeping the original lift travel and ratios.
  const rig = grp(); rig.position.y = .24; f.add(rig);
  const addRig = o => { rig.add(o); return o; };
  const BAY_X = .39, BAY_Y = 1.91, MECH_Z = FZ + .13, RISE = .49, TOP = 2.67;
  addRig(mc('gpt-police-gearcabinet-frame-v1', ({ add, tube }) => {
    add(G.box(1.68, .075, .62, .025), C.navy, 0, 1.69, Z);
    add(G.box(1.65, .52, .045, .015), '#a2c8bb', 0, 1.96, Z - .28);
    add(G.box(.77, .48, .09, .02), C.cream, -.43, 1.95, FZ + .015);
    for (const x of [.005, .795]) add(G.box(.055, .52, .70, .014), C.mint, x, 1.95, Z + .035);
    add(G.box(.83, .055, .70, .014), C.mint, .40, 2.22, Z + .035);
    add(G.box(.70, .035, .65, .012), C.wood, .40, 1.72, Z + .04);
    add(G.cyl(.10, .10, .035, 12), C.steel, BAY_X, 1.755, -.01);
    for (const x of [-.55, -.21]) add(G.cyl(.033, .033, .20, 8), C.steel, x, 1.94, MECH_Z - .07, HP);
    // The upright guides continue above the box so the raised shutter stays
    // mechanically attached, rather than floating above it.
    for (const x of [.005, .795]) add(G.box(.045, .96, .075, .012), C.steel, x, 2.160, FZ + .09);
    add(G.box(1.73, .065, .12, .018), C.navy, -.025, TOP + .045, MECH_Z);
    add(G.box(.045, 1.02, .07, .012), C.navy, -.855, 2.185, MECH_Z - .10);
    for (const x of [-.84, BAY_X]) {
      add(G.cyl(.078, .078, .07, 12), C.yellow, x, TOP, MECH_Z, HP);
      add(G.tor(.078, .012, PI * 2, 5, 14), C.woodD, x, TOP, MECH_Z + .04);
    }
    tube([-.84, TOP + .075, MECH_Z], [BAY_X, TOP + .075, MECH_Z], .014, '#eecfa3', 6);
  }));
  const g1 = grp(); put(g1, -.55, 1.94, MECH_Z); addRig(g1);
  g1.add(gear('gpt-police-chain-gear1-v1', .18, C.yellow, 12)); g1.add(crank('gpt-police-chain-crank-v1', .22));
  const g2 = grp(); put(g2, -.21, 1.94, MECH_Z); addRig(g2); g2.add(gear('gpt-police-chain-gear2-v1', .145, C.coral, 10));
  const gate = grp(); put(gate, BAY_X, BAY_Y, FZ + .095); addRig(gate);
  gate.add(mc('gpt-police-chain-shutter-v1', ({ add }) => {
    add(G.box(.72, .43, .055, .024), C.yellow, 0, 0, 0);
    for (let k = 0; k < 9; k++) add(G.box(.07, .025, .07, .005), C.steel, -.425, -.21 + k * .053, .025);
    add(G.box(.11, .44, .055, .012), C.navy, -.37, 0, 0);
    add(G.box(.25, .045, .10, .012), C.navy, 0, -.14, .05);
    add(G.tor(.028, .011, PI * 2, 5, 10), C.steel, .078, .23, .035);
  }));
  gate.add(put(decal(.59, .15, label('lost', '분실물', { bg: C.yellow, fg: C.navy, w: 504 })), 0, .03, .034));
  const weight = grp(); put(weight, -.918, 2.29, MECH_Z); addRig(weight);
  weight.add(mc('gpt-police-chain-lostboot-weight-v1', ({ add }) => {
    // The unclaimed single rain boot IS the counterweight. It has an open cuff,
    // a chunky toe and a cream sole, and drops into view while doing real work.
    add(G.cyl(.066, .072, .17, 10), C.coral, 0, -.10, 0);
    add(G.tor(.059, .015, PI * 2, 5, 12), C.yellow, 0, -.008, 0, HP);
    add(G.cyl(.049, .049, .012, 10), C.navy, 0, -.014, 0);
    add(G.box(.15, .10, .20, .04), C.coral, 0, -.215, .035);
    add(G.sph(.067, 8, 6), C.coral, 0, -.21, .12, 0, 0, 0, [1.05, .65, 1]);
    add(G.box(.155, .032, .23, .014), C.cream, 0, -.271, .04);
    add(G.tor(.028, .011, PI * 2, 5, 10), C.steel, 0, .025, -.025);
    add(G.box(.07, .044, .015, .008), C.yellow, 0, -.10, .074);
  }));
  // A shallow carrier appears only AFTER the shutter clears it. The actual key
  // spot rides a quarter-turn shelf, so the end changes both geometry and
  // the reachable hiding place instead of revealing a painted key decoration.
  const carrier = grp(); put(carrier, BAY_X, 1.765, -.01); addRig(carrier);
  carrier.add(mc('gpt-police-chain-clue-carrier-v2', ({ add }) => {
    // Lift the actual support with its clue: the rim must sit below a flat key.
    add(G.box(.52, .025, .30, .012), C.wood, 0, .0175, 0);
    add(G.box(.52, .055, .035, .012), C.yellow, 0, .015, .145);
    for (const x of [-.25, .25]) add(G.box(.025, .045, .28, .008), C.woodD, x, .01, 0);
  }));
  const spring = grp(); put(spring, BAY_X, 1.745, -.01); addRig(spring);
  spring.add(mc('gpt-police-chain-carrier-spring-v1', ({ add }) => {
    // A wound torsion spring and its spindle live beneath the turning shelf.
    for (let k = 0; k < 3; k++) add(G.tor(.058 + k * .015, .012, PI * 2, 5, 12), C.steel, 0, -.015, 0, HP);
    add(G.cyl(.031, .031, .065, 8), C.woodD, 0, .001, 0);
  }));
  const leftRope = cord(), rightRope = cord(); addRig(leftRope); addRig(rightRope);
  const ropeAt = u => {
    setCord(leftRope, -.918, MECH_Z, TOP, 2.315 - RISE * u);
    setCord(rightRope, BAY_X + .078, MECH_Z, TOP, BAY_Y + .235 + RISE * u);
  }; ropeAt(0);
  const cp = f.part('lift', [g1, g2, gate, weight, leftRope, rightRope, carrier, spring], t => {
    g1.rotation.z = -PI * 3 * phase(t, 0, .78); g2.rotation.z = PI * 3 * (.18 / .145) * phase(t, .06, .82);
    const u = phase(t, .23, .82); gate.position.y = BAY_Y + RISE * u; weight.position.y = 2.29 - RISE * u; ropeAt(u);
    const v = phase(t, .80, 1); carrier.rotation.y = HP * v; spring.rotation.y = HP * v;
  }, { label: '손잡이 → 톱니 → 장화추와 셔터 → 열쇠 선반', sfx: 'ratchet', dur: 2.4 });
  cp.gptDevice = 'policeGear'; cp.gptChain = ['crank', 'gears', 'boot-and-shutter', 'turning-clue-shelf'];
  cp.gptHandle = handleAt(g1, .22, 0, .21);
  reaction(cp, '장화가 무게추였어?!', ['ratchet', 'gearUp', 'clink', 'latch']);
  f.gptChainPart = cp;
  const clue = f.spot('inside', carrier, -.075, .046, 0, { part: cp, maxH: .39, scale: 1.25, label: '분실물 회전 선반 안 열쇠' });
  clue.gptClue = 'policeGear';
};

// Full-height lost-property shelf, with two real drawers below its open cubbies.
B.gpt_lostshelf = f => {
  const W = 1.63, Z = -.08, D = .66, FZ = Z + D / 2;
  f.add(mc('gpt-lostshelf-case-v2', ({ add, tube }) => {
    for (const x of [-.75, .75]) add(G.box(.10, 1.89, D, .022), C.wood, x, 1.005, Z);
    // Widen the usable cubbies; the bags, paper and drawer hardware keep their
    // real-world sizes rather than stretching with the cabinet.
    for (const y of [.2, .64, 1.32, 1.95]) add(G.box(W, .07, D, .018), C.wood, 0, y, Z);
    add(G.box(W - .10, 1.73, .035, .01), '#f2dcbc', 0, 1.045, Z - D / 2 + .02);
    add(G.box(.065, .64, D, .01), C.wood, 0, 1.00, Z);
    for (const x of [-.57, .57]) for (const z of [Z - .22, Z + .22]) add(G.box(.08, .15, .08, .02), C.navy, x, .075, z);
    // A recognisable folded raincoat and rounded overnight bag in upper cubbies.
    add(G.box(.31, .075, .25, .025), C.yellow, -.45, .73, Z - .09);
    add(G.box(.28, .055, .23, .02), '#feb53d', -.45, .79, Z - .09);
    add(G.box(.35, .24, .21, .05), '#ee9d4c', .42, .81, Z - .09);
    tube([.34, .95, Z - .08], [.34, 1.02, Z - .08], .02, C.woodD, 6);
    tube([.34, 1.02, Z - .08], [.5, 1.02, Z - .08], .02, C.woodD, 6);
    tube([.5, 1.02, Z - .08], [.5, .95, Z - .08], .02, C.woodD, 6);
    add(G.box(.72, .055, .40, .018), C.mint, -.32, 2.01, Z);
    add(G.box(.19, .025, .25, .008), C.white, .49, 2.00, Z, 0, .08);
  }));
  for (const sx of [-1, 1]) {
    const dv = grp(); put(dv, sx * .39, .425, FZ); f.add(dv);
    dv.add(mc('gpt-lostshelf-drawer-v1|' + sx, ({ add }) => {
      add(G.box(.72, .32, .055, .025), C.mint, 0, 0, .015);
      add(G.box(.70, .035, .51, .008), '#eecfa3', 0, -.145, -.24);
      for (const x of [-.34, .34]) add(G.box(.025, .24, .5, .008), '#c67f2a', x, -.01, -.24);
      add(G.box(.70, .24, .025, .008), '#c67f2a', 0, -.01, -.48);
      add(G.box(.20, .045, .065, .015), C.navy, 0, .015, .065);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .48 * t; }, { label: sx < 0 ? '왼쪽 보관 서랍' : '오른쪽 보관 서랍', sfx: 'drawer', dur: .34 });
    f.spot('inside', dv, 0, -.115, -.21, { part: p, maxH: .32, scale: .9, label: '보관 선반 서랍 안' });
  }
  f.spot('on', null, .10, 2.00, .07, { maxH: .36, scale: .9, label: '보관 선반 위' });
  f.spot('under', null, -.39, 1.36, .15, { maxH: .51, scale: 1, label: '분실물 열린 선반' });
};

const notices = () => {
  const g = grp();
  const lost = paper('lost-bag', .40, .60, (c, W, H) => {
    c.fillStyle = C.navy; fitText(c, '주인 찾아요', W * .5, H * .15, W * .80, H * .14, 66);
    c.fillStyle = C.yellow; c.beginPath(); c.ellipse(W * .5, H * .49, W * .27, H * .17, 0, 0, PI * 2); c.fill();
    // A cat-ear bag illustration, not a new 3D character.
    for (const x of [.28, .66]) { c.beginPath(); c.moveTo(W * x, H * .43); c.lineTo(W * (x + .025), H * .25); c.lineTo(W * (x + .16), H * .40); c.fill(); }
    c.fillStyle = C.navy;
    for (const x of [.42, .58]) { c.beginPath(); c.arc(W * x, H * .49, W * .022, 0, PI * 2); c.fill(); }
    fitText(c, '노란 가방', W * .5, H * .80, W * .80, H * .13, 63);
    c.fillStyle = C.coral; c.fillRect(W * .14, H * .91, W * .72, H * .018);
  });
  g.add(put(lost, -.275, -.005, .045, 0, 0, -.025));
  const news = paper('town-news', .46, .25, (c, W, H) => {
    c.fillStyle = C.navy; fitText(c, '동네 소식', W * .5, H * .28, W * .80, H * .29, 61);
    c.fillStyle = C.blue;
    for (const [y, width] of [[.56, .72], [.72, .60], [.85, .66]]) c.fillRect(W * .14, H * y, W * width, H * .035);
  }, 552, 300);
  g.add(put(news, .235, .185, .045, 0, 0, .025));
  const safe = paper('safe-way', .46, .28, (c, W, H) => {
    c.fillStyle = C.navy; fitText(c, '안전 귀가', W * .5, H * .23, W * .80, H * .26, 61);
    c.strokeStyle = C.yellow; c.lineWidth = H * .085; c.lineCap = 'round';
    c.beginPath(); c.moveTo(W * .16, H * .80); c.lineTo(W * .34, H * .53); c.lineTo(W * .60, H * .76); c.lineTo(W * .84, H * .48); c.stroke();
  }, 552, 336);
  g.add(put(safe, .235, -.175, .045, 0, 0, -.015));
  return g;
};
B.gpt_policenotice = f => {
  f.add(mc('gpt-police-notice-v1', ({ add }) => {
    for (const x of [-.46, .46]) { add(G.box(.075, 1.53, .075, .02), C.navy, x, .80, -.05); add(G.box(.26, .07, .29, .025), '#a09769', x, .035, -.05); }
    add(G.box(1.31, .075, .30, .025), C.navy, 0, 1.72, -.05);
    add(G.box(.88, .20, .065, .02), C.cream, 0, 1.89, -.04);
  }));
  // Device 4: the board turns on a central vertical spindle. Its right edge
  // swings backwards and left edge forwards, clear of both car and shelf.
  f.add(mc('gpt-police-notice-pocket-v1', ({ add }) => {
    add(G.box(1.18, .88, .035, .014), '#e8d7b7', 0, 1.18, -.20);
    for (const x of [-.59, .59]) add(G.box(.055, .91, .28, .014), C.woodD, x, 1.18, -.075);
    for (const y of [.73, 1.63]) add(G.box(1.22, .055, .28, .014), C.woodD, 0, y, -.075);
    add(G.box(.89, .035, .22, .01), C.wood, 0, .80, -.06);
    add(G.box(.89, .12, .035, .01), C.mint, 0, .86, .055);
    for (const y of [.70, 1.66]) add(G.cyl(.035, .035, .12, 8), C.steel, 0, y, .105);
  }));
  const panel = grp(); put(panel, 0, 1.18, .115); f.add(panel);
  panel.add(mc('gpt-police-notice-turn-panel-v1', ({ add }) => {
    add(G.box(1.11, .82, .055, .025), C.wood, 0, 0, 0);
    add(G.cyl(.055, .055, .08, 10), C.yellow, .41, -.27, .07, HP);
    add(G.box(.35, .17, .015, .012), C.yellow, 0, .03, -.038);
  }));
  panel.add(notices());
  // Once the panel turns clear, the note shelf rises over the pocket lip and
  // travels .35 m forward. A phone-sized clue can stand outside the case.
  const noteTray = grp(); put(noteTray, .30, .825, -.065); f.add(noteTray);
  noteTray.add(mc('gpt-police-notice-clue-tray-v2', ({ add }) => {
    // Raise the real support and its clue together so flat paper clears the lip.
    add(G.box(.48, .025, .28, .012), C.wood, 0, .025, 0);
    add(G.box(.48, .045, .035, .01), C.yellow, 0, .015, .135);
    for (const x of [-.23, .23]) add(G.box(.025, .05, .27, .008), C.woodD, x, .02, 0);
  }));
  const np = f.part('door', [panel, noteTray], t => {
    panel.rotation.y = 1.60 * phase(t, 0, .62);
    noteTray.position.y = .825 + .14 * phase(t, .60, .76);
    noteTray.position.z = -.065 + .35 * phase(t, .76, 1);
  }, { label: '빙글 게시판과 앞으로 나오는 단서함', sfx: 'door', dur: .95 });
  np.gptDevice = 'policeNotice'; np.gptHandle = handleAt(panel, .41, -.27, .115);
  reaction(np, '게시판이 까꿍했어!', ['flip', 'swish', 'clink', 'pop']);
  const clue = f.spot('inside', noteTray, 0, .050, 0, { part: np, maxH: .70, scale: 1.55, label: '게시판 뒤 앞으로 나온 단서 선반' });
  clue.gptClue = 'policeNotice';
  f.add(put(decal(.80, .15, label('notice', '동네 게시판', { bg: C.cream, fg: C.navy, w: 684 })), 0, 1.89, -.001));
};

B.gpt_policebench = f => {
  f.add(mc('gpt-police-bench-v1', ({ add, tube }) => {
    for (const x of [-.68, .68]) {
      for (const z of [-.19, .22]) add(G.box(.075, .43, .075, .02), C.navy, x, .225, z);
      tube([x, .20, -.2], [x, .20, .22], .025, C.navy, 6);
      add(G.box(.065, .50, .065, .015), C.navy, x, .66, -.21, -.09);
      tube([x, .62, -.16], [x, .62, .24], .025, C.navy, 7);
      tube([x, .45, .23], [x, .62, .23], .025, C.navy, 7);
    }
    for (const y of [.69, .85]) add(G.box(1.72, .13, .06, .018), C.wood, 0, y, -.24, -.09);
    // Real hollow under-seat storage with a clear top opening.
    add(G.box(1.42, .035, .40, .012), '#eecfa3', 0, .13, .015);
    for (const x of [-.73, .73]) add(G.box(.045, .28, .43, .012), C.blue, x, .285, .015);
    for (const z of [-.18, .21]) add(G.box(1.42, .25, .035, .012), z < 0 ? C.blue : C.mint, 0, .285, z);
  }));
  // Device 3: the whole slatted seat flips up on its rear hinge, carrying its
  // folded cape and anything resting on top, and reveals the box beneath it.
  const seat = grp(); put(seat, 0, .47, -.20); f.add(seat);
  seat.add(mc('gpt-police-bench-flip-seat-v1', ({ add }) => {
    for (let k = 0; k < 3; k++) add(G.box(1.72, .065, .14, .018), k === 1 ? '#eecfa3' : C.wood, 0, 0, .07 + k * .16);
    add(G.box(.30, .055, .25, .02), C.blue, .48, .062, .235);
    add(G.box(.25, .025, .25, .015), C.yellow, .48, .10, .235);
    add(G.box(.25, .055, .08, .014), C.navy, -.13, -.005, .47);
  }));
  const bp = f.part('lid', seat, t => { seat.rotation.x = -1.18 * t; }, { label: '대기 벤치 뒤집는 좌석', sfx: 'lift', dur: .60 });
  bp.gptDevice = 'policeBench'; bp.gptHandle = handleAt(seat, -.13, -.005, .51);
  reaction(bp, '의자 밑이 더 아늑한데?', ['creak', 'lift', 'thunk', 'pop']);
  f.spot('inside', null, -.20, .155, .03, { part: bp, maxH: .29, scale: 1, label: '벤치 좌석 밑 비밀함' });
  f.spot('on', seat, -.24, .035, .27, { maxH: .45, scale: 1, label: '대기 벤치 위' });
  f.spot('under', null, .20, .015, .10, { maxH: .09, scale: .9, label: '벤치 아래' });
};

// A bicycle whose wheel hubs, triangle frame, fork, chain, cranks, pedals,
// handlebar and kickstand all connect. No billboard basket or floating pedals.
B.gpt_policebikerack = f => {
  f.add(mc('gpt-police-bike-v1', ({ add, tube }) => {
    const TYRE = '#6f4b30', RIM = '#e8d7b7', FRAME = '#84ae9d', y = .325, z = -.05;
    for (const x of [-.59, .59]) {
      add(G.tor(.285, .035, PI * 2, 6, 18), TYRE, x, y, z);
      add(G.tor(.247, .012, PI * 2, 5, 18), RIM, x, y, z + .016);
      for (let k = 0; k < 8; k++) { const a = k * PI / 4; tube([x, y, z + .018], [x + Math.cos(a) * .242, y + Math.sin(a) * .242, z + .018], .009, RIM, 4); }
      add(G.cyl(.034, .034, .12, 8), C.steel, x, y, z, HP);
    }
    const rear = [-.59, y, z], bb = [-.05, .31, z], seat = [-.22, .77, z], head = [.40, .79, z], headLow = [.37, .67, z], front = [.59, y, z];
    for (const [a, b] of [[rear, bb], [rear, seat], [bb, seat], [seat, head], [bb, headLow], [headLow, head]]) tube(a, b, .026, FRAME, 7);
    for (const zz of [-.065, .065]) { tube([headLow[0], headLow[1], z + zz], [front[0], front[1], z + zz], .021, FRAME, 6); tube([rear[0], rear[1], z + zz], [bb[0], bb[1], z + zz], .016, FRAME, 6); }
    tube([-.22, .77, z], [-.25, .92, z], .022, C.steel, 6); add(G.box(.31, .075, .19, .035), '#6f4b30', -.25, .94, z);
    tube([.40, .79, z], [.45, .98, z], .024, C.steel, 6);
    tube([.45, .98, z], [.53, 1.035, z], .024, C.steel, 6);
    tube([.53, 1.035, z - .20], [.53, 1.035, z + .20], .022, C.steel, 6);
    for (const s of [-1, 1]) tube([.53, 1.035, z + s * .13], [.53, 1.035, z + s * .23], .031, '#6f4b30', 6);
    // Chain and crank share the bottom bracket; each pedal is attached to a crank.
    add(G.tor(.079, .014, PI * 2, 5, 12), C.dark, bb[0], bb[1], z + .098);
    tube([-.59, y + .03, z + .09], [-.05, .38, z + .09], .010, C.dark, 4);
    tube([-.59, y - .03, z + .09], [-.05, .24, z + .09], .010, C.dark, 4);
    for (const s of [-1, 1]) {
      const ex = bb[0] + s * .11, ey = bb[1] + s * .085, zz = z + s * .12;
      tube([bb[0], bb[1], zz], [ex, ey, zz], .018, C.steel, 6);
      add(G.box(.13, .035, .10, .012), C.dark, ex, ey, zz + s * .055);
    }
    // Attached rear carrier and curved mudguards, with generous tyre clearance.
    add(G.box(.43, .045, .23, .018), C.steel, -.54, .71, z);
    for (const zz of [-.085, .085]) tube([-.66, y, z + zz], [-.69, .69, z + zz], .016, C.steel, 5);
    tube([-.33, .71, z], [-.22, .77, z], .016, C.steel, 5);
    for (const x of [-.59, .59]) add(G.tor(.335, .017, PI * .80, 5, 14), C.cream, x, y, z, 0, 0, .10 * PI);
    tube([-.20, .30, z + .07], [-.38, .025, z + .23], .019, C.dark, 6);
    add(G.box(.075, .025, .10, .012), C.dark, -.38, .02, z + .23);
    // Real low wheel holder: two triangular loops sit either side of the front
    // tyre. The empty adjacent bay makes the rack's purpose clear from above.
    for (const dz of [z - .075, z + .075, .40, .60]) {
      tube([.40, .055, dz], [.76, .40, dz], .025, C.steel, 6);
      tube([.76, .40, dz], [.94, .055, dz], .025, C.steel, 6);
    }
    for (const x of [.37, .97]) add(G.box(.08, .045, .9, .015), C.navy, x, .025, .21);
    add(G.box(.09, .47, .07, .015), C.navy, .96, .25, .67);
    add(G.box(.31, .29, .06, .02), C.cream, .96, .61, .67);
  }));
  f.add(put(decal(.25, .23, label('bike-p', '주차', { bg: C.cream, fg: C.navy, w: 140 })), .96, .61, .708));
  // Device 5: an intentionally small courier lift occupies the rack's empty bay.
  // Its handwheel winds the same visible rope that supports the hollow basket;
  // the basket rises above the opaque front guard to reveal its real contents.
  const BX = .65, BZ = .51, BY = .13, TOP = 1.28, RISE = .56;
  f.add(mc('gpt-police-rack-liftframe-v1', ({ add, tube }) => {
    for (const x of [.33, .97]) add(G.box(.055, 1.20, .07, .014), C.navy, x, .64, .38);
    add(G.box(.74, .075, .15, .02), C.blue, .65, 1.27, .44);
    add(G.box(.69, .48, .055, .025), '#a2c8bb', .65, .30, .735);
    add(G.box(.69, .055, .40, .014), C.blue, .65, .055, .54);
    for (const x of [.32, .98]) add(G.box(.035, .47, .33, .01), '#84ae9d', x, .30, .54);
    add(G.cyl(.075, .075, .08, 12), C.yellow, BX, TOP, BZ, HP);
    tube([BX, TOP + .06, BZ], [.96, 1.08, .76], .014, '#eecfa3', 6);
    tube([.96, .96, .41], [.96, .96, .77], .028, C.steel, 7);
    add(G.box(.34, .16, .012, .012), C.cream, .65, .36, .77);
    // A large envelope motif is geometry on the front guard, never a fake key.
    add(G.box(.26, .14, .015, .012), C.cream, .65, .35, .778);
    tube([.52, .42, .79], [.65, .33, .79], .009, C.blue, 4);
    tube([.65, .33, .79], [.78, .42, .79], .009, C.blue, 4);
  }));
  const wheel = grp(); put(wheel, .96, .96, .81); f.add(wheel);
  wheel.add(gear('gpt-police-rack-hoist-wheel-v1', .19, C.yellow, 12));
  wheel.add(crank('gpt-police-rack-hoist-crank-v1', .21));
  const basket = grp(); put(basket, BX, BY, BZ); f.add(basket);
  basket.add(mc('gpt-police-courier-basket-v1', ({ add }) => {
    add(G.box(.51, .035, .30, .014), C.wood, 0, 0, 0);
    for (const x of [-.25, .25]) add(G.box(.035, .17, .30, .012), C.woodD, x, .10, 0);
    for (const z of [-.14, .14]) add(G.box(.48, .17, .025, .01), C.wood, 0, .10, z);
    for (const z of [-.14, .14]) add(G.box(.52, .035, .045, .01), C.yellow, 0, .20, z);
    for (const x of [-.22, .22]) add(G.box(.025, .24, .025, .008), C.navy, x, .30, 0);
    add(G.box(.46, .035, .035, .012), C.navy, 0, .42, 0);
  }));
  const rope = cord(); f.add(rope); setCord(rope, BX, BZ, TOP, BY + .44);
  // The story recipe's actual bicycle bell is also the courier station's
  // thumb trigger. A visible sheathed cable runs from it to the rack drum.
  f.add(mc('gpt-police-bell-cable-v1', ({ add, tube }) => {
    tube([.52, 1.045, .08], [.77, .72, .28], .012, C.woodD, 6);
    tube([.77, .72, .28], [.96, .96, .76], .012, C.woodD, 6);
    add(G.cyl(.040, .04, .07, 8), C.steel, .52, 1.06, .08);
  }));
  const bell = grp(); put(bell, .52, 1.105, .08); f.add(bell);
  bell.add(mc('gpt-police-bike-bell-v1', ({ add }) => {
    add(G.sph(.0475, 10, 6), C.yellow, 0, 0, 0, 0, 0, 0, [1, .60, 1]);
    add(G.tor(.042, .009, PI * 2, 5, 14), C.steel, 0, -.015, 0, HP);
    add(G.sph(.011, 7, 5), C.cream, -.009, .026, .016);
  }));
  const thumb = grp(); put(thumb, .43, 1.07, .14); f.add(thumb);
  thumb.add(mc('gpt-police-bell-thumb-v1', ({ add }) => {
    add(G.box(.12, .025, .035, .008), C.navy, .04, .014, 0, 0, 0, .22);
    add(G.sph(.037, 8, 6), C.coral, -.012, .035, 0, 0, 0, 0, [1, .55, 1]);
  }));
  const rp = f.part('lift', [wheel, basket, rope, bell, thumb], t => {
    wheel.rotation.z = -PI * 4 * t;
    const u = phase(t, .15, .96); basket.position.y = BY + RISE * u; setCord(rope, BX, BZ, TOP, BY + .44 + RISE * u);
    thumb.rotation.z = -.50 * phase(t, 0, .18) + .50 * phase(t, .25, .45);
    bell.rotation.z = .13 * Math.sin(PI * 6 * t) * Math.sin(PI * t);
  }, { label: '자전거 거치대 우편 바구니 도르래', sfx: 'lift', dur: 1.0 });
  rp.gptDevice = 'policeCourier'; rp.gptHandle = handleAt(thumb, -.012, .035, 0);
  reaction(rp, '띵! 우편물도 엘리베이터 타네!', ['clink', 'slide', 'clink', 'land']);
  f.spot('inside', basket, 0, .03, .01, { part: rp, maxH: .34, scale: 1, label: '우편 도르래 바구니 안' });
};

// The canon patrolcar builder is called verbatim. This wrapper adds only an
// obvious press switch, two cheap painted light sweeps and a fitted Korean
// plate. Vehicle geometry and the canonical builder remain unchanged.
B.gpt_patrolcar = (f, T, opts) => {
  TOWN_BUILDERS.patrolcar(f, T, opts);
  const plate = f.group.children.find(o => o.isMesh && o.material?.map &&
    Math.abs((o.geometry?.parameters?.width || 0) - .30) < 1e-6 &&
    Math.abs((o.geometry?.parameters?.height || 0) - .075) < 1e-6);
  if (plate) {
    plate.material = mat('#ffffff', { map: label('patrol-plate-ko', '순찰', { bg: C.cream, fg: C.navy, w: 256, h: 64 }) });
    plate.userData.gptLocalizedPlate = true;
  }
  // The imported body is triangle soup. Match the indexed switch's format so
  // baking can still batch it, using the engine's bit-exact corner deduper.
  // This instance owns the indexed copies; canon geometry stays intact.
  f.group.traverse(o => {
    if (!o.isMesh || o.geometry?.index || !o.geometry?.attributes?.position) return;
    const source = o.geometry;
    o.geometry = geo('gpt-police-car-exact|' + source.uuid, () => {
      const g = reindexExact(source.clone()); g.name = source.name; return g;
    });
  });
  // The canonical car stays untouched; only this copy's find anchor allows a
  // drink/carton large enough for the phone camera to read and tap.
  const roofSpot = f.spots.find(s => s.kind === 'on' && s.label === '순찰차 지붕 위');
  if (roofSpot) { roofSpot.maxH = .40; roofSpot.scale = 1; }
  f.add(mc('gpt-police-siren-switch-base-v1', ({ add }) => {
    add(G.box(.22, .12, .20, .025), C.cream, .51, .625, .25);
    add(G.cyl(.079, .079, .025, 12), C.woodD, .51, .695, .25);
  }));
  const button = grp(); put(button, .51, .72, .25); f.add(button);
  button.add(mc('gpt-police-siren-button-v1', ({ add }) => {
    add(G.cyl(.069, .069, .045, 12), C.coral, 0, 0, 0);
    add(G.box(.045, .012, .045, .008), C.cream, 0, .029, 0, 0, PI / 4);
  }));
  const sweep = grp(); put(sweep, -.06, .018, 0); f.add(sweep);
  const patches = [];
  for (const [a, color] of [[0, '#b0e5e8'], [PI, '#ee9d4c']]) {
    const g = new THREE.CircleGeometry(.80, 14, -.24, .48);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const p = new THREE.Mesh(g, m); p.rotation.x = -HP; p.rotation.z = a;
    p.castShadow = false; p.receiveShadow = false; p.renderOrder = 3; p.layers.set(2); p.userData.noOcclude = true;
    sweep.add(p); patches.push(p);
  }
  const sp = f.part('lift', [button, sweep], t => {
    button.position.y = .72 - .033 * phase(t, 0, .18);
    const u = phase(t, .04, .96); sweep.rotation.y = PI * 2 * u;
    for (const p of patches) p.material.opacity = .27 * Math.sin(PI * u);
  }, { label: '순찰차 경광등 스위치', sfx: 'click', dur: .95 });
  sp.gptDevice = 'policeSiren'; sp.gptHandle = handleAt(button, 0, .025, 0); f.gptSirenPart = sp;
  reaction(sp, '빛도 순찰 중이야!', ['click', 'sirenPolice', 'clink', 'latch']);
};

B.gpt_policeflowers = f => {
  // Separate solids keep the gaps between the three kerb objects walkable.
  // A single AABB would incorrectly fill the empty strip beside the bench.
  f.noSolid = true;
  f.walkBoxes = [
    [-.445, 0, -.30, .445, .78, .28],
    [.69, 0, -.98, 1.01, .55, -.66],
    [.69, 0, -1.60, 1.01, .55, -1.28],
  ];
  f.add(mc('gpt-police-flowerbox-v1', ({ add, tube }) => {
    add(G.box(.83, .35, .52, .055), '#ee9d4c', 0, .205, -.01);
    add(G.box(.89, .07, .58, .025), '#f6e0bf', 0, .40, -.01);
    add(G.box(.76, .025, .45, .018), C.soil, 0, .44, -.01);
    for (const x of [-.28, .28]) add(G.box(.09, .05, .35, .015), C.woodD, x, .025, -.01);
    flowers(add, tube, 0, .45, -.01, .60);
    // Two .55 m cones sit on the continuing street beyond the right kerb,
    // leaving the original playable aisle beside the bench completely open.
    for (const [x, z] of [[.85, -.82], [.85, -1.44]]) {
      add(G.box(.32, .055, .32, .025), C.coral, x, .0275, z);
      add(G.cone(.14, .49, 10), C.coral, x, .30, z);
      add(G.cyl(.068, .091, .075, 10), C.white, x, .335, z);
      add(G.cyl(.033, .052, .06, 10), C.white, x, .452, z);
    }
  }));
};

export const GPT_POLICE_BUILDERS = B;
export const GPT_POLICE_INFO = {
  gpt_policebox: { w: 8, d: 1, name: '몽글 파출소 건물', hidden: true, price: 0 },
  gpt_lostlockers: { w: 2, d: 1, name: '분실물 보관함', hidden: true, price: 0 },
  gpt_lostshelf: { w: 2, d: 1, name: '분실물 정리 선반', hidden: true, price: 0 },
  gpt_policenotice: { w: 1, d: 1, name: '동네 게시판', hidden: true, price: 0 },
  gpt_policebench: { w: 2, d: 1, name: '파출소 대기 벤치', hidden: true, price: 0 },
  gpt_policebikerack: { w: 2, d: 1, name: '자전거 거치대', hidden: true, price: 0 },
  gpt_patrolcar: { w: 2, d: 1, name: '경광등 스위치 순찰차', hidden: true, price: 0 },
  gpt_policeflowers: { w: 1, d: 1, name: '파출소 꽃상자', hidden: true, price: 0 },
};
