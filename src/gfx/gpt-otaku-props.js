// GPT otaku studio kit. All floor pieces use bottom-centre origin, face +z, and measure in game tiles.
// Static coloured detail is merged per piece, using the same toon/ink pipeline as the original furniture.
// Register with installGptOtakuProps(registerFurniture), or registerFurniture(GPT_OTAKU_BUILDERS, GPT_OTAKU_INFO).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, STYLE, canvasTex, texCache } from './kit.js';
import { fitText, textTex, paperFill, paperSheet } from './gpt-paper.js';   // 글자·종이 손질 (① 10/22)

const PI = Math.PI, HP = PI / 2;
const C = {
  // (GPT 원색 그대로 — 사용자 10/23 "채색 변경했던 스테이지 전부 GPT 원안으로")
  cream: '#f7eee0', white: '#fffaf1', wood: '#c69160', edge: '#a66f48', dark: '#3e4556', ink: '#2e3548',
  sage: '#91b7a8', teal: '#699fa5', rust: '#d88067', mustard: '#e8b75e', blue: '#89acc5', purple: '#aaa0bf',
  metal: '#a6aeb8', pale: '#d9d9d5', red: '#c6605e', green: '#7eaa87', paper: '#f1eadb', glow: '#b8d4cf',
};
const BOOK = [C.cream, C.sage, C.rust, C.blue, C.cream, C.mustard, C.purple, C.white];
const G = {
  box(w, h, d, r = .018) { r = Math.min(r, w * .4, h * .4, d * .4); return r > .004 ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d); },
  sph: (r, w = 10, h = 7) => new THREE.SphereGeometry(r, w, h),
  cyl: (rt, rb, h, n = 12) => new THREE.CylinderGeometry(rt, rb, h, n),
  tor: (r, t, arc = PI * 2) => new THREE.TorusGeometry(r, t, 4, 18, arc),
};
const X = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
  typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
const Y = new THREE.Vector3(0, 1, 0);
const VM = new Map();
function vmat() {
  if (!VM.has(STYLE.mode)) VM.set(STYLE.mode, STYLE.mode === 'std'
    ? new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .84 })
    : new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad }));
  return VM.get(STYLE.mode);
}
function mc(key, build) {
  const merged = geo('gptotaku|' + STYLE.mode + '|' + key, () => {
    const list = [];
    const addM = (src, transform, color) => {
      const g = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      g.applyMatrix4(transform);
      const c = new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(color) : color);
      const a = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); list.push(g);
    };
    const add = (g, c, ...args) => addM(g, X(...args), c);
    const box = (w, h, d, c, x = 0, y = 0, z = 0, r = .018, rx = 0, ry = 0, rz = 0) => add(G.box(w, h, d, r), c, x, y, z, rx, ry, rz);
    const tube = (a, b, r, c, n = 6) => {
      const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
      addM(G.cyl(r, r, delta.length(), n), new THREE.Matrix4().compose(av.add(bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, delta.normalize()), new THREE.Vector3(1, 1, 1)), c);
    };
    const cable = (pts, r = .008, c = C.ink) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 24, r, 5, false), c);
    build({ add, box, tube, cable });
    const g = mergeGeometries(list, false); list.forEach(g => g.dispose()); return g;
  });
  return mesh(merged, vmat());
}
function panel(parent, w, h, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  const p = put(mesh(geo(`gpt-plane|${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), m, { cast: false }), x, y, z, rx, ry, rz);
  parent.add(p); return p;
}
const PRINTS = texCache();
function print(kind) {
  const t = PRINTS.get('gpt-' + kind, () => textTex(512, 512, ctx => {
    ctx.scale(.5, .5); const W = 512;
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const circle = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill(); };
    const text = (s, x, y, size, color, align = 'center') => fitText(ctx, s, x, y, align === 'center' ? W * .84 : W * .42, size, color, { align });
    if (kind === 'crt' || kind === 'arcade') {
      rect(0, 0, W, W, '#243a4b');
      for (let i = 0; i < 36; i++) circle((i * 83 + 31) % W, (i * 59 + 47) % 330, i % 3 === 0 ? 3 : 2, '#88bec5');
      circle(389, 125, 52, '#efcf85'); circle(365, 109, 52, '#243a4b');
      rect(0, 350, 512, 162, '#5f8d9c');
      for (let i = 0; i < 9; i++) rect(i * 67 - 12, 350 - (i % 3) * 43, 48, 162, i % 2 ? '#416d7e' : '#527e8c');
      rect(50, 370, 90, 16, '#d7bb7d'); rect(224, 312, 112, 17, '#d7bb7d'); rect(382, 392, 96, 17, '#d7bb7d');
      // A small pixel raccoon hero: a recognisable original game scene, not a texture wrapped around a box.
      rect(264, 264, 44, 41, '#dfb178'); rect(255, 252, 14, 25, '#dfb178'); rect(302, 252, 14, 25, '#dfb178');
      rect(261, 273, 49, 13, '#435264'); rect(269, 276, 8, 7, '#fff2d1'); rect(293, 276, 8, 7, '#fff2d1');
      rect(273, 305, 26, 8, '#ce755f'); text('달나라 모험', 256, 65, 40, '#e8dfb0');
      text('HI 024800', 28, 108, 19, '#c7e5df', 'left'); text('P1  ×  3', 30, 477, 20, '#e7d29c', 'left');
      for (let y = 0; y < W; y += 7) rect(0, y, W, 1, '#243a4b50');
    } else if (kind === 'desktop') {
      rect(0, 0, W, W, '#95b9bd');
      circle(420, 114, 88, '#d6d6bc'); rect(0, 365, W, 147, '#69928c');
      for (let i = 0; i < 5; i++) { rect(26, 35 + i * 71, 31, 35, i % 2 ? '#e3cd9e' : '#f4ece1'); rect(20, 76 + i * 71, 46, 5, '#ecf0e5'); }
      rect(118, 94, 314, 278, '#f0e8d9'); rect(118, 94, 314, 29, '#506f7d');
      rect(138, 146, 125, 122, '#c8d4c4'); text('02 : 18', 280, 319, 28, '#5d7c87');
      rect(0, 475, W, 37, '#3f6571'); circle(22, 492, 11, '#edb782');
    } else if (kind === 'poster-space') {
      rect(0, 0, W, W, '#486b82');
      circle(358, 182, 116, '#e3bf7e'); circle(329, 152, 112, '#486b82');
      for (let i = 0; i < 22; i++) circle((i * 79 + 25) % W, (i * 43 + 36) % 365, i % 3 ? 3 : 5, '#f4ddac');
      rect(0, 406, W, 106, '#e7d1a8'); text('별 보는 밤', 256, 459, 46, '#39566b');
      ctx.strokeStyle = '#a8c7c1'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(272, 239, 223, 46, -.5, 0, PI * 2); ctx.stroke();
    } else {
      rect(0, 0, W, W, '#d6c0a1'); rect(35, 35, 442, 442, '#e5daca');
      circle(256, 195, 119, '#a8b9ae');
      // Mecha club print with a bold, simple silhouette.
      rect(211, 131, 90, 83, '#eee9d9'); rect(174, 204, 164, 116, '#6b8c96');
      rect(224, 159, 64, 16, '#5b6a75'); rect(244, 186, 23, 16, '#cb8166');
      for (const x of [143, 328]) { rect(x, 209, 42, 124, '#e8e1d1'); rect(x - 9, 329, 60, 25, '#bb7d63'); }
      for (const x of [189, 278]) rect(x, 315, 50, 65, '#777c8a');
      text('로봇 주말', 256, 436, 44, '#465d6b');
    }
  }));
  return mat('#ffffff', { map: t, emissive: kind === 'crt' || kind === 'arcade' ? '#9dc6c4' : null, ei: .18, rim: 0 });
}

// A figure has explicit head, limbs and a small display base. Large features survive the room camera.
function figure({ add, box, tube }, x, y, z, variant = 0, scale = 1) {
  const p = (a, b, c) => [x + a * scale, y + b * scale, z + c * scale];
  const A = (g, c, a, b, d, rx = 0, ry = 0, rz = 0, s = 1) => add(g, c, ...p(a, b, d), rx, ry, rz, typeof s === 'number' ? s * scale : s.map(v => v * scale));
  A(G.cyl(.10, .11, .025, 14), C.dark, 0, .0125, 0);
  if (variant % 3 === 0) { // chunky robot with antenna and shoulder armour
    A(G.box(.10, .115, .065), C.blue, 0, .17, 0);
    A(G.box(.09, .073, .07), C.white, 0, .267, 0);
    A(G.box(.065, .013, .008, .002), C.teal, 0, .272, .039);
    A(G.box(.025, .028, .014, .003), C.rust, 0, .239, .04);
    for (const s of [-1, 1]) {
      A(G.box(.05, .06, .07), C.white, s * .083, .194, 0);
      A(G.box(.035, .08, .04), C.blue, s * .09, .132, 0, 0, 0, s * .13);
      A(G.box(.041, .085, .045), C.white, s * .032, .079, 0);
      A(G.box(.045, .027, .07), C.rust, s * .034, .039, .015);
      A(G.box(.012, .045, .012, .002), C.mustard, s * .036, .318, 0, 0, 0, -s * .6);
    }
  } else if (variant % 3 === 1) { // original anime adventurer with scarf, hair and boots
    A(G.cyl(.038, .062, .09, 9), C.sage, 0, .167, 0);
    A(G.sph(.048), '#e4bd99', 0, .259, 0);
    A(G.sph(.05), C.dark, 0, .285, -.007, 0, 0, 0, [1, .65, 1]);
    for (const s of [-1, 1]) {
      A(G.cyl(.014, .014, .085, 7), C.dark, s * .025, .08, 0);
      A(G.box(.035, .027, .054), C.edge, s * .026, .043, .01);
      A(G.cyl(.015, .015, .09, 7), '#e4bd99', s * .065, .173, 0, 0, 0, s * .4);
      A(G.sph(.006, 5, 4), C.ink, s * .017, .264, .043);
    }
    A(G.tor(.033, .01), C.rust, 0, .223, 0, HP);
    A(G.box(.022, .1, .012), C.rust, .04, .173, .04, 0, 0, -.3);
  } else { // raccoon mascot figure
    A(G.sph(.065), C.mustard, 0, .115, 0, 0, 0, 0, [.85, 1.05, .85]);
    A(G.sph(.065), '#c9a17c', 0, .232, 0);
    for (const s of [-1, 1]) {
      A(G.sph(.026), '#c9a17c', s * .045, .281, 0);
      A(G.sph(.013), C.dark, s * .045, .282, .018);
      A(G.sph(.021), C.dark, s * .025, .242, .052, 0, 0, -s * .2, [1.2, .8, .35]);
      A(G.sph(.008), C.white, s * .026, .245, .060);
      A(G.sph(.022), '#c9a17c', s * .055, .135, .01);
      A(G.sph(.025), C.edge, s * .03, .055, .025, 0, 0, 0, [1, .65, 1.4]);
    }
    A(G.sph(.025), C.cream, 0, .214, .055, 0, 0, 0, [1, .65, .55]);
    A(G.sph(.009), C.ink, 0, .225, .072);
  }
}
function books({ box }, x0, y, z, n, variant = 0, bw = .062, bh = .285, bd = .24) {
  for (let i = 0; i < n; i++) {
    const x = x0 + bw * i, h = bh - (i % 7 === 0 ? .016 : 0), c = BOOK[(Math.floor(i / 4) + variant) % BOOK.length];
    box(bw - .007, h, bd, c, x, y + h / 2, z, .006);
    box(bw - .018, .009, .006, C.paper, x, y + h - .035, z + bd / 2 + .006, .001);
    box(bw - .018, .013, .006, i % 4 ? C.dark : C.rust, x, y + .065, z + bd / 2 + .006, .001);
    // Chunky vertical title and the volume badge on the spine.
    box(.010, .09, .006, c === C.cream || c === C.white ? C.teal : C.white, x, y + .17, z + bd / 2 + .006, .002);
    box(.018, .018, .006, C.paper, x, y + .025, z + bd / 2 + .006, .002);
  }
}
function controller(o, x, y, z, ry = 0, scale = 1) {
  const g = grp();
  g.add(mc(`controller|${scale}`, ({ add, box }) => {
    box(.22, .045, .10, C.pale, 0, .0225, 0, .025);
    for (const s of [-1, 1]) add(G.sph(.045), C.pale, s * .084, .018, .035, 0, 0, s * .2, [1, .55, 1.35]);
    box(.046, .012, .014, C.dark, -.067, .052, -.006, .003); box(.014, .012, .046, C.dark, -.067, .052, -.006, .003);
    for (const [dx, dz, c] of [[.055, .01, C.rust], [.085, -.018, C.blue]]) add(G.cyl(.012, .012, .01, 8), c, dx, .052, dz);
    box(.024, .007, .009, C.dark, .005, .050, .016, .003);
  }));
  put(g, x, y, z, 0, ry, 0, scale); o.add(g); return g;
}

const B = {};
B.gpt_mangashelf = (f, T = {}, opts = {}) => {
  const wood = T.gptwood || C.wood, rows = opts.low ? 3 : 5, H = .14 + rows * .365;
  f.add(mc('mangashelf|' + wood + '|' + rows, o => {
    const { box } = o;
    box(1.22, H - .04, .035, C.edge, 0, H / 2, -.166, .006);
    for (const sx of [-1, 1]) box(.068, H, .39, wood, sx * .596, H / 2, 0);
    for (let row = 0; row <= rows; row++) box(1.14, .045, .39, wood, 0, .075 + row * .365, 0, .008);
    box(1.25, .065, .41, wood, 0, H - .0325, 0, .015);
    for (let row = 0; row < rows; row++) books(o, -.512, .098 + row * .365, .015, 17, row, .063, .29, .255);
    for (const sx of [-1, 1]) box(.055, .055, .32, C.edge, sx * .52, .0275, 0, .008);
  }));
  f.spot('on', null, .32, H, -.015, { maxH: .30, label: '만화책장 위', scale: .8 });
};
B.gpt_mangastack = f => {
  f.add(mc('mangastack', ({ box }) => {
    for (let i = 0; i < 5; i++) {
      const y = .032 + i * .062, x = i % 2 ? .025 : -.012, z = i % 3 ? -.005 : .015;
      box(.34, .055, .245, BOOK[i], x, y, z, .007);
      box(.295, .034, .008, C.paper, x + .005, y, z + .125, .002);
      box(.045, .042, .009, BOOK[i], x - .145, y, z + .127, .002);
      for (const dx of [-.105, -.075]) box(.012, .024, .009, C.dark, x + dx, y, z + .133, .001);
    }
    box(.23, .008, .16, C.cream, .025, .315, .005, .003);
    box(.08, .008, .125, C.teal, -.025, .323, -.005, .002);
    box(.07, .009, .04, C.mustard, .055, .324, .035, .002);
  }));
  f.spot('on', null, .03, .331, .01, { maxH: .18, label: '만화책 더미', scale: .65 });
};
B.gpt_figurecase = f => {
  const W = .90, H = 1.72, D = .40;
  f.add(mc('figurecase-frame', o => {
    const { box } = o;
    box(W, .14, D, C.cream, 0, .10, 0); box(W, .08, D, C.cream, 0, H - .04, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.055, .06, .055, C.dark, sx * .34, .03, sz * .12, .006);
    box(W - .08, H - .22, .035, '#ddd8ca', 0, (H + .06) / 2, -.183, .005);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.035, H - .18, .035, C.dark, sx * .425, (H + .1) / 2, sz * .183, .007);
    for (const y of [.19, .67, 1.15, 1.63]) { box(.81, .022, .34, '#c6d3d1', 0, y, -.007, .006); box(.81, .016, .017, C.metal, 0, y, .17, .004); }
    for (const y of [.22, .70, 1.18]) for (let i = 0; i < 3; i++) figure(o, -.27 + i * .27, y, 0, i + Math.floor(y * 10), .95);
    // Warm LED strips are tucked under each shelf rather than drawn across the front of the figures.
    for (const y of [.65, 1.13, 1.61]) box(.72, .012, .018, '#f7deb0', 0, y, -.145, .003);
    for (const sx of [-1, 1]) box(.026, .13, .035, C.metal, sx * .055, .90, .217, .006);
  }));
  const glass = mat('#b8d5d4', { opacity: .105, rim: 0, side: THREE.DoubleSide });
  panel(f.group, .79, 1.44, glass, 0, .91, .203);
  for (const s of [-1, 1]) panel(f.group, .32, 1.44, glass, s * .447, .91, 0, 0, s * HP);
  f.add(mc('figurecase-glints', ({ box }) => { box(.013, .83, .006, '#e7f3ed', -.33, 1.08, .21, .001, 0, 0, -.07); box(.009, .30, .006, '#e7f3ed', -.29, 1.39, .21, .001, 0, 0, -.07); }));
  f.spot('on', null, .24, H, -.03, { maxH: .25, label: '피규어 진열장 위', scale: .7 });
};
B.gpt_crtconsole = f => {
  f.add(mc('crt-console', ({ add, box, cable }) => {
    // Low open media bench: every cavity has a real back, base and contained machines.
    box(1.18, .075, .78, C.wood, 0, .39, 0); box(1.13, .065, .49, C.wood, 0, .09, -.025);
    for (const s of [-1, 1]) box(.065, .36, .50, C.wood, s * .535, .24, -.025);
    box(1.07, .30, .025, C.edge, 0, .245, -.26, .004); box(.045, .29, .48, C.wood, .09, .24, -.025, .004);
    for (const x of [-.47, .47]) for (const z of [-.18, .17]) box(.055, .055, .055, C.edge, x, .0275, z, .01);
    box(.40, .09, .30, C.pale, -.22, .17, -.01); box(.34, .025, .20, '#b3bac2', -.22, .2275, -.035, .009);
    box(.15, .013, .03, C.ink, -.22, .247, .03, .003); box(.026, .013, .025, C.rust, -.36, .218, .146, .004);
    box(.018, .013, .025, C.dark, -.31, .218, .146, .004);
    for (let i = 0; i < 5; i++) box(.034, .16, .18, BOOK[i], .19 + i * .054, .20, -.055, .004);
    // CRT shell and projecting curved face.
    box(.76, .55, .45, '#c0b9a8', -.06, .71, -.145, .065);
    box(.67, .45, .045, C.dark, -.08, .73, .101, .037);
    box(.51, .36, .025, '#243a4b', -.13, .74, .135, .04);
    for (const y of [.61, .68]) add(G.cyl(.022, .022, .018, 12), C.pale, .235, y, .135, HP);
    for (let i = 0; i < 5; i++) box(.057, .007, .009, '#6f716f', .235, .79 + i * .025, .132, .002);
    box(.13, .012, .011, C.cream, -.08, .497, .133, .002); add(G.sph(.009, 6, 4), '#8bbba8', .232, .536, .138);
    // Controllers rest on the tabletop in front; their cords visibly meet the console's front ports.
    cable([[-.30, .20, .152], [-.40, .27, .31], [-.46, .40, .36], [-.37, .44, .37], [-.29, .44, .28]], .008);
    cable([[-.25, .20, .152], [-.12, .25, .31], [.16, .40, .38], [.34, .44, .27]], .008);
    cable([[.25, .55, -.21], [.47, .39, -.25], [.59, .08, -.22], [.66, .024, -.07], [.62, .024, .20]], .010);
  }));
  panel(f.group, .49, .335, print('crt'), -.13, .74, .154);
  controller(f.group, -.31, .435, .28, -.22, .82); controller(f.group, .35, .435, .27, .18, .82);
  f.spot('under', null, .34, .123, .145, { maxH: .20, label: '레트로 게임대 선반', scale: .65 });
};
B.gpt_arcade = (f, T = {}, opts = {}) => {
  const body = opts.color || T.gptarcade || C.rust;
  f.add(mc('arcade|' + body, ({ add, box, cable }) => {
    box(.72, .07, .70, C.dark, 0, .035, -.015);
    // Base and narrow back silhouette; the console shelf sits against a recessed screen tower.
    box(.64, .78, .57, body, 0, .445, -.055, .035);
    box(.64, .92, .43, body, 0, 1.14, -.125, .025);
    for (const s of [-1, 1]) box(.065, .78, .54, C.dark, s * .323, .59, -.018, .008);
    box(.70, .10, .43, C.dark, 0, 1.64, -.125, .015);
    box(.56, .19, .025, C.cream, 0, 1.55, .105, .006);
    box(.57, .49, .03, C.dark, 0, 1.20, .105, .016);
    box(.46, .36, .025, '#243a4b', 0, 1.205, .13, .028);
    box(.73, .10, .44, C.dark, 0, .895, .155, .018, -.14);
    box(.66, .026, .36, C.cream, 0, .95, .158, .008, -.14);
    // Two-player panel, sticks and grouped buttons have unambiguous contact with the control deck.
    for (const sx of [-1, 1]) {
      const x = sx * .20;
      add(G.cyl(.027, .027, .009, 12), C.dark, x - .055, .973, .15);
      add(G.cyl(.010, .012, .075, 8), C.metal, x - .055, 1.012, .15);
      add(G.sph(.030), sx < 0 ? C.rust : C.blue, x - .055, 1.055, .15);
      for (const [dx, dz, c] of [[.02, -.02, C.rust], [.07, -.02, C.mustard], [.045, .045, C.blue]]) add(G.cyl(.018, .020, .014, 10), c, x + dx, .977 + dz * .14, .15 + dz);
    }
    box(.22, .18, .018, C.dark, -.14, .58, .247, .008);
    for (const x of [-.19, -.10]) { box(.045, .07, .008, C.metal, x, .603, .264, .004); box(.025, .009, .009, C.ink, x, .614, .270, .002); }
    box(.29, .12, .015, C.dark, .13, .25, .245, .005);
    for (let i = 0; i < 6; i++) box(.21, .009, .008, '#66717a', .13, .21 + i * .016, .257, .002);
    for (const s of [-1, 1]) {
      box(.014, .51, .32, C.mustard, s * .358, .44, -.04, .003, 0, 0, s * .18);
      box(.018, .28, .25, C.cream, s * .360, .59, -.04, .003, 0, 0, -s * .18);
    }
    cable([[.18, .16, -.345], [.27, .035, -.40], [.48, .03, -.38], [.53, .03, -.23]], .012);
  }));
  panel(f.group, .44, .337, print('arcade'), 0, 1.205, .151);
  // Flat marquee art has its own face mapping.
  panel(f.group, .52, .15, print('poster-space'), 0, 1.55, .125);
  f.spot('on', null, .18, 1.696, -.12, { maxH: .24, label: '아케이드 위', scale: .7 });
};
B.gpt_gamingchair = f => {
  f.add(mc('gaming-chair', ({ add, box, tube }) => {
    add(G.cyl(.044, .060, .31, 12), C.dark, 0, .23, 0);
    for (let i = 0; i < 5; i++) {
      const a = i * PI * 2 / 5, x = Math.sin(a) * .28, z = Math.cos(a) * .28;
      tube([0, .10, 0], [x, .065, z], .026, C.dark);
      add(G.cyl(.045, .045, .046, 10), C.dark, x, .045, z, HP, a);
    }
    box(.46, .095, .45, C.dark, 0, .442, 0, .045);
    box(.34, .055, .37, C.teal, 0, .493, .01, .035);
    // Backrest reclines towards the back of the footprint; bolsters stay connected to the central cushion.
    box(.40, .69, .095, C.dark, 0, .855, -.20, .06, -.13);
    box(.26, .52, .032, C.teal, 0, .87, -.139, .04, -.13);
    for (const s of [-1, 1]) {
      box(.073, .49, .08, C.dark, s * .195, .79, -.157, .03, -.13, 0, -s * .10);
      tube([s * .24, .45, -.10], [s * .24, .65, -.06], .025, C.dark);
      box(.09, .045, .29, C.dark, s * .24, .67, .015, .02);
    }
    box(.25, .095, .047, C.cream, 0, 1.078, -.139, .018, -.13);
    box(.22, .11, .06, C.dark, 0, .658, -.10, .025, -.13);
    for (const s of [-1, 1]) box(.07, .045, .016, C.ink, s * .080, 1.007, -.094, .009);
  }));
  f.spot('on', null, 0, .526, .04, { maxH: .34, label: '게이밍 체어 방석', scale: .8 });
};
B.gpt_snacktray = f => {
  f.add(mc('snack-tray', ({ add, box, tube }) => {
    box(.68, .035, .43, C.wood, 0, .0175, 0, .025);
    for (const s of [-1, 1]) box(.024, .035, .39, C.edge, s * .326, .050, 0, .006);
    for (const s of [-1, 1]) box(.63, .035, .018, C.edge, 0, .050, s * .203, .006);
    // Open ramen cup: visible broth, noodles, seaweed and a half-peeled foil lid.
    add(G.cyl(.105, .074, .17, 18), C.cream, -.145, .12, .01);
    add(G.cyl(.106, .088, .085, 18), C.rust, -.145, .118, .01);
    add(G.cyl(.098, .098, .008, 18), '#bb8a51', -.145, .208, .01);
    add(G.tor(.101, .007), C.white, -.145, .209, .01, HP);
    for (let i = 0; i < 6; i++) add(G.tor(.030, .0045, PI * 1.5), '#ead29b', -.18 + i % 3 * .032, .216, -.018 + Math.floor(i / 3) * .037, HP, i * .35);
    box(.029, .009, .035, C.green, -.11, .222, .008, .003, 0, .5); add(G.cyl(.020, .02, .008, 10), C.cream, -.18, .223, .035);
    add(G.cyl(.017, .017, .009, 10), C.mustard, -.18, .23, .035);
    for (const z of [-.009, .010]) tube([-.31, .236, z], [.04, .236, z + .045], .006, '#e2bd85', 6);
    box(.062, .04, .005, C.cream, -.145, .134, .105, .002);
    // Half-open biscuit carton, individual biscuits and a drink can.
    box(.17, .19, .12, C.mustard, .14, .133, -.058, .01);
    box(.13, .09, .008, C.cream, .14, .147, .007, .003); box(.09, .018, .009, C.rust, .14, .158, .017, .002);
    box(.17, .055, .014, C.mustard, .14, .252, -.11, .003, -.45);
    for (let i = 0; i < 3; i++) box(.025, .085, .024, '#b17b4e', .09 + i * .045, .25, -.04, .006, 0, 0, (i - 1) * .10);
    add(G.cyl(.050, .05, .16, 16), C.teal, .21, .116, .11); add(G.cyl(.05, .05, .008, 16), C.metal, .21, .201, .11);
    add(G.tor(.012, .003), C.dark, .21, .207, .11, HP); box(.055, .05, .006, C.cream, .21, .12, .162, .003);
    // A real crumpled napkin, low enough to leave the food visible.
    box(.15, .007, .11, C.paper, .015, .039, .13, .008, 0, -.2);
  }));
  f.spot('on', null, .02, .045, .12, { maxH: .16, label: '과자 쟁반', scale: .65 });
};
B.gpt_beanbag = f => {
  f.add(mc('beanbag-chair-v2', ({ add, box, cable }) => {
    // A low bag, visible shallow seat, soft arms and a higher back. The seat sits above
    // the base surface rather than being buried inside it as an unreadable blob.
    add(G.sph(.39, 20, 12), '#ce886a', 0, .160, .02, 0, 0, 0, [1.10, .41, 1.05]);
    add(G.sph(.31, 18, 12), '#ce886a', 0, .43, -.22, -.12, 0, 0, [1.17, .85, .67]);
    for (const s of [-1, 1]) add(G.sph(.22, 14, 10), '#ce886a', s * .31, .27, .03, 0, 0, -s * .08, [.42, .72, 1.20]);
    add(G.sph(.28, 18, 10), '#e1a385', 0, .302, .14, .03, 0, 0, [1.08, .12, 1.07]);
    add(G.tor(.25, .007, PI), '#a96a52', 0, .297, .125, HP - .08, 0, 0);
    for (const s of [-1, 1]) cable([[s * .16, .08, .26], [s * .29, .19, .27], [s * .35, .34, .13], [s * .29, .48, -.12], [s * .17, .62, -.22]], .0045, '#b67457');
    box(.06, .018, .027, C.cream, .30, .20, .19, .003, 0, -.4, .3);
    // A folded throw sits over the back edge, with thick doubled cloth and a short fringe.
    box(.25, .025, .34, '#ead5aa', -.08, .700, -.22, .014, -.1, 0, -.06);
    box(.25, .21, .025, '#ead5aa', -.08, .59, -.395, .012, -.10, 0, -.06);
    for (let i = 0; i < 6; i++) box(.009, .025, .012, C.cream, -.19 + i * .041, .475, -.416, .003, 0, 0, -.06);
  }));
  f.spot('on', null, .05, .337, .17, { maxH: .26, label: '빈백 가운데', scale: .8 });
};
B.gpt_laundry = f => {
  f.add(mc('laundry', ({ add, box }) => {
    box(.48, .045, .37, C.cream, 0, .0275, 0, .035);
    // Hollow basket walls and widely spaced slots make the clothing visible from the room camera.
    for (const sx of [-1, 1]) { box(.035, .31, .36, C.cream, sx * .224, .18, 0, .012); box(.035, .04, .38, C.edge, sx * .224, .348, 0, .010); }
    for (const sz of [-1, 1]) {
      box(.45, .045, .025, C.cream, 0, .08, sz * .171, .008); box(.48, .045, .035, C.edge, 0, .348, sz * .171, .010);
      for (let i = 0; i < 7; i++) box(.025, .23, .024, C.cream, -.196 + i * .065, .21, sz * .171, .006);
    }
    for (const [x, y, z, c, s] of [[-.08, .12, .02, C.blue, [1.5, .7, 1]], [.10, .21, -.04, C.rust, [1.3, .7, 1]], [-.06, .29, .01, C.cream, [1.5, .6, 1]], [.10, .32, .02, C.purple, [1, .5, .8]]]) add(G.sph(.12, 12, 8), c, x, y, z, 0, .3, .1, s);
    // Overshirt draped over the front rim; sleeves stay attached.
    box(.18, .18, .034, C.blue, -.03, .294, .195, .016, .14);
    box(.075, .10, .035, C.blue, -.14, .31, .194, .013, .14, 0, -.5);
    box(.075, .10, .035, C.blue, .08, .31, .194, .013, .14, 0, .5);
    for (let i = 0; i < 3; i++) add(G.sph(.006, 5, 4), C.cream, -.03, .25 + i * .037, .218);
    // Paired socks on the floor are a single, readable small cluster rather than tiny loose items.
    for (const s of [-1, 1]) { box(.085, .025, .18, C.cream, .31 + s * .05, .02, .15 + s * .025, .016, 0, -.2); box(.09, .035, .07, C.teal, .31 + s * .05, .045, .09 + s * .025, .012, 0, -.2); }
  }));
  f.spot('on', null, .06, .39, .01, { maxH: .24, label: '세탁 바구니 속', scale: .75 });
};
B.gpt_posterwall = f => {
  f.add(mc('poster-wall', ({ box }) => {
    for (const [x, y, w, h, c, a] of [[-.24, 1.12, .53, .70, C.wood, -.055], [.28, 1.00, .45, .58, C.dark, .06]]) {
      box(w, h, .034, c, x, y, .022, .008, 0, 0, a); box(w - .045, h - .045, .012, C.cream, x, y, .048, .003, 0, 0, a);
    }
    for (const [x, y] of [[-.43, 1.43], [.42, 1.25]]) box(.09, .035, .009, '#dac59d', x, y, .064, .002, 0, 0, -.15);
  }));
  panel(f.group, .47, .64, print('poster-space'), -.24, 1.12, .062, 0, 0, -.055);
  panel(f.group, .39, .52, print('poster-robot'), .28, 1.00, .062, 0, 0, .06);
  // the little note under them: a scribbled list on paper, taped up (not a flat card with stripes)
  const note = PRINTS.get('gpt-poster-note', () => textTex(136, 120, (c, W, H) => {
    paperFill(c, W, H, undefined, 9); c.strokeStyle = C.teal; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { c.beginPath(); for (let k = 0; k <= 10; k++) c.lineTo(W * (.16 + k * .066 * (i === 2 ? .7 : 1)), H * (.32 + i * .2) + Math.sin(k * 1.7 + i) * 2); c.stroke(); }
  }));
  f.add(put(paperSheet(.17, .15, note, { hold: 'tape' }), .02, .56, .012, 0, 0, -.06));
};
B.gpt_minifridge = f => {
  const W = .56, H = .81, D = .49, ZF = .245, inner = '#e7e7de';
  f.add(mc('otaku-fridge-body', ({ add, box }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.045, .055, .045, C.dark, sx * .205, .0275, sz * .175, .006);
    box(W, H, .04, C.sage, 0, H / 2 + .05, -.225, .022);
    for (const s of [-1, 1]) box(.04, H, D, C.sage, s * .26, H / 2 + .05, 0, .02);
    for (const y of [.075, .835]) box(.48, .05, .49, C.sage, 0, y, 0, .012);
    box(.47, .69, .012, inner, 0, .46, -.198, .003);
    for (const s of [-1, 1]) box(.009, .69, .415, inner, s * .235, .46, .012, .002);
    for (const y of [.11, .425]) box(.46, .018, .36, '#c8d9d7', 0, y, -.02, .005);
    box(.43, .09, .31, C.white, 0, .75, -.025, .01); box(.36, .012, .006, C.metal, 0, .743, .136, .002);
    // Food behind the door: three cans above, a milk carton and a meal container below.
    for (let i = 0; i < 3; i++) { add(G.cyl(.039, .039, .14, 12), [C.mustard, C.teal, C.rust][i], -.15 + i * .13, .504, -.10); add(G.cyl(.04, .04, .008, 12), C.metal, -.15 + i * .13, .578, -.10); box(.034, .045, .006, C.cream, -.15 + i * .13, .51, -.057, .002); }
    box(.12, .22, .13, C.cream, -.13, .23, -.09, .009); box(.12, .06, .13, C.blue, -.13, .37, -.09, .008);
    box(.19, .09, .15, C.pale, .10, .164, -.09, .012); box(.20, .023, .16, C.rust, .10, .22, -.09, .008);
  }));
  const door = grp(); put(door, -.278, .455, ZF + .024); f.add(door);
  door.add(mc('otaku-fridge-door', ({ add, box }) => {
    box(.555, .80, .055, C.sage, .2775, 0, 0, .028);
    box(.024, .27, .028, C.cream, .481, .105, .051, .009);
    for (const y of [-.02, .23]) box(.025, .025, .031, C.metal, .481, y, .030, .006);
    // Door bins project INTO the fridge while closed. Their bottom, lip and contents move with the door.
    for (const y of [-.25, .12]) { box(.43, .014, .07, C.cream, .277, y, -.064, .004); box(.43, .065, .012, C.cream, .277, y + .032, -.094, .004); }
    for (let i = 0; i < 3; i++) { add(G.cyl(.021, .021, .11, 10), [C.teal, C.rust, C.mustard][i], .13 + i * .095, -.188, -.065); add(G.cyl(.012, .012, .025, 8), C.cream, .13 + i * .095, -.12, -.065); }
    // A magnet photo, a shopping memo and a small geometric star sticker on the exterior.
    box(.16, .19, .007, C.cream, .17, .10, .034, .003, 0, 0, -.08);
    box(.12, .11, .008, C.blue, .17, .12, .045, .003, 0, 0, -.08);
    add(G.sph(.03), C.mustard, .17, .13, .054, 0, 0, 0, [1, 1, .2]);
    box(.16, .12, .007, C.paper, .35, -.19, .034, .003, 0, 0, .06);
    for (let i = 0; i < 3; i++) box(.11, .007, .008, C.teal, .35, -.16 - i * .029, .044, .001, 0, 0, .06);
    add(G.cyl(.014, .014, .01, 10), C.rust, .17, .205, .045, HP);
    add(G.cyl(.014, .014, .01, 10), C.mustard, .35, -.115, .045, HP);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.85 * t; }, { label: '오타쿠 미니 냉장고', sfx: 'open', dur: .32 });
  f.spot('inside', null, .10, .12, .07, { part: p, maxH: .25, label: '냉장고 아래칸', scale: .75 });
  f.spot('on', null, 0, .86, 0, { maxH: .26, label: '냉장고 위', scale: .75 });
};
B.gpt_pcdesk = f => {
  f.add(mc('otaku-pcdesk', ({ add, box, cable }) => {
    box(1.28, .07, .64, C.wood, 0, .76, 0, .022);
    for (const x of [-.56, .56]) for (const z of [-.24, .24]) box(.045, .72, .045, C.dark, x, .36, z, .008);
    box(1.14, .045, .035, C.dark, 0, .15, -.24, .007);
    box(.26, .035, .19, C.dark, -.10, .812, -.105, .018); box(.035, .18, .035, C.dark, -.10, .91, -.105, .006);
    box(.73, .46, .055, C.dark, -.10, 1.12, -.13, .025); box(.67, .39, .015, '#95b9bd', -.10, 1.13, -.092, .015);
    box(.48, .025, .16, C.pale, -.10, .812, .18, .012);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 12; k++) box(.027, .008, .021, k === 0 || k === 11 ? C.sage : C.white, -.30 + k * .036, .832, .132 + row * .031, .002);
    box(.08, .011, .019, C.sage, -.09, .833, .235, .002);
    box(.22, .008, .21, C.teal, .37, .8, .16, .008);
    add(G.sph(.052), C.cream, .36, .822, .17, 0, 0, 0, [.72, .38, 1.05]);
    // Ventilated tower with visible fan rings, the front left open for the chair.
    box(.25, .48, .42, C.cream, .42, .27, -.04, .025); box(.19, .43, .018, C.dark, .42, .27, .179, .012);
    for (const y of [.17, .35]) { add(G.tor(.066, .009), C.teal, .42, y, .195); add(G.sph(.025), C.metal, .42, y, .2, 0, 0, 0, [1, 1, .35]); }
    box(.08, .008, .008, C.sage, .42, .46, .195, .002);
    // Desktop speakers, pencil cup and headphones hung from the left desk edge.
    for (const x of [-.55, .40]) { box(.10, .18, .11, C.cream, x, .886, -.14, .014); add(G.cyl(.031, .031, .01, 12), C.dark, x, .872, -.078, HP); }
    add(G.cyl(.04, .035, .105, 10), C.mustard, .54, .85, .04);
    for (let i = 0; i < 3; i++) add(G.cyl(.004, .004, .16, 6), [C.rust, C.blue, C.dark][i], .522 + i * .018, .958, .04, 0, 0, (i - 1) * .10);
    add(G.tor(.10, .018, PI * 1.15), C.dark, -.64, .65, -.02, 0, HP, -.16);
    for (const z of [-.10, .07]) add(G.sph(.045), C.dark, -.65, .60, z, 0, 0, 0, [.45, 1.3, 1]);
    cable([[-.10, 1.03, -.166], [-.12, .80, -.23], [.10, .45, -.24], [.40, .10, -.24]], .009);
    cable([[.42, .10, -.25], [.60, .03, -.33], [.67, .024, -.22], [.64, .024, -.02]], .010);
  }));
  panel(f.group, .65, .37, print('desktop'), -.10, 1.13, -.078);
  f.spot('under', null, -.30, .015, -.035, { maxH: .49, label: '컴퓨터 책상 밑', scale: .8 });
  f.spot('on', null, .54, .810, .23, { maxH: .18, label: '컴퓨터 책상 오른쪽', scale: .65 });
};

export const GPT_OTAKU_BUILDERS = B;
export const GPT_OTAKU_INFO = {
  gpt_mangashelf: { w: 2, d: 1, name: '만화책 전집 책장', price: 380, region: 'home' },
  gpt_mangastack: { w: 1, d: 1, name: '읽던 만화책 더미', price: 80, region: 'home' },
  gpt_figurecase: { w: 1, d: 1, name: '피규어 유리 진열장', price: 420, region: 'home' },
  gpt_crtconsole: { w: 2, d: 1, name: 'CRT 레트로 게임대', price: 360, region: 'home' },
  gpt_arcade: { w: 1, d: 1, name: '문 퀘스트 아케이드', price: 560, region: 'home' },
  gpt_gamingchair: { w: 1, d: 1, name: '청록 게이밍 체어', price: 220, region: 'home' },
  gpt_snacktray: { w: 1, d: 1, name: '야식 라면 쟁반', price: 90, region: 'home' },
  gpt_beanbag: { w: 1, d: 1, name: '독서 빈백', price: 180, region: 'home' },
  gpt_laundry: { w: 1, d: 1, name: '셔츠와 세탁 바구니', price: 100, region: 'home' },
  gpt_posterwall: { wall: true, span: 1, name: 'SF와 로봇 포스터', price: 100, region: 'home' },
  gpt_minifridge: { w: 1, d: 1, name: '야식 미니 냉장고', price: 260, region: 'home' },
  gpt_pcdesk: { w: 2, d: 1, name: '밤샘 PC 책상', price: 420, region: 'home' },
};
export function installGptOtakuProps(registerFurniture) { registerFurniture(GPT_OTAKU_BUILDERS, GPT_OTAKU_INFO); }
