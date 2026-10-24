// ── 찾을 물건 10종 더 (10/21 #94, user: "스케일 너무 작게 들어가 있는 것들 다 수정해 주고 19-70 중복되지 않게.. 필요하다면
// 새로 해줘"): big chunky shapes that still read at the stage's start view (over 28 px there), each one point colour on
// pastel, for ② to lay through 19~70 where the lists ran short. 트로피·액자 are not the gift pieces (gf_trophy is a gold cup
// on wood, gf_photoframe a wooden cabinet): a blue-and-silver star trophy and a pink frame with gold corner balls.
// 응원봉 (cheerstick) is not 68판's device lightstick (a white stick, a pink ball): a lilac star on a fat handle.
import * as THREE from 'three';
import { rbox, sph, cyl, tor, cone, put, grp, mat, mesh, geo, extrude, starShape } from './kit.js';
import { EN } from '../i18n-en-dict.js';
Object.assign(EN, { '올챙이 유리병': 'Tadpole jar', '개구리 장화': 'Frog rain boots' });

const PI = Math.PI, HP = PI / 2;
const GLOSS = { rough: .38 };
const SILVER = { metal: .45, rough: .26 };
const flatStar = (key, R, r, d, color, o) => extrude(key, starShape(R, r), d, color, o);
// a marshmallow: a short cylinder with soft rounded edges (a lathe), its axis along y
const mallow = (R, L, color) => mesh(geo('mallow|' + R + '|' + L, () => {
  const e = R * .32, pts = [new THREE.Vector2(0, -L / 2)];
  for (let i = 0; i <= 4; i++) { const a = -HP + i / 4 * HP; pts.push(new THREE.Vector2(R - e + Math.cos(a) * e, -L / 2 + e + Math.sin(a) * e)); }
  for (let i = 0; i <= 4; i++) { const a = i / 4 * HP; pts.push(new THREE.Vector2(R - e + Math.cos(a) * e, L / 2 - e + Math.sin(a) * e)); }
  pts.push(new THREE.Vector2(0, L / 2));
  return new THREE.LatheGeometry(pts, 18);
}), mat(color));

const RAW = {
  // 랜턴: a squat camping lantern — teal base and cap, a fat glowing globe in a four-bar cage, the bail handle folded back
  camplantern: { name: '랜턴', h: .29, build() {
    const g = grp(), m = '#3f9e86', dk = '#2c6f5f';
    g.add(put(cyl(.1, .11, .045, m, GLOSS, 20), 0, .0225, 0));
    g.add(put(cyl(.085, .085, .13, '#ffe08a', { emissive: '#ffc94a', ei: .55, rough: .3 }, 20), 0, .11, 0));
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; g.add(put(cyl(.011, .011, .13, dk, null, 6), Math.cos(a) * .088, .11, Math.sin(a) * .088)); }
    g.add(put(cyl(.055, .1, .045, m, GLOSS, 20), 0, .197, 0));
    g.add(put(cyl(.028, .032, .022, dk, null, 12), 0, .23, 0));
    const h = grp(); put(h, 0, .215, 0, -.55, 0, 0); g.add(h);
    h.add(put(tor(.07, .013, dk, null, PI, 6, 18), 0, 0, 0));
    for (const s of [-1, 1]) h.add(put(sph(.018, dk, null, 10, 8), s * .07, 0, 0));
    return g;
  } },
  // 마시멜로 꼬치: two skewers fanned from one end, three fat marshmallows each (white, pink, one toasted)
  smores: { name: '마시멜로 꼬치', h: .13, flat: true, build() {
    const g = grp(), wood = '#c79a62', R = .064, y = R;
    const cols = [['#e9a95c', '#fffaf2', '#ffc4d8'], ['#fffaf2', '#ffc4d8', '#fffaf2']];
    [-1, 1].forEach((s, i) => {
      const k = grp(); put(k, -.15, y, 0, 0, s * .3, 0); g.add(k);
      k.add(put(cyl(.013, .013, .34, wood, null, 8), .17, 0, 0, 0, 0, HP));
      k.add(put(cone(.013, .03, wood, null, 8), .355, 0, 0, 0, 0, -HP));
      cols[i].forEach((c, j) => k.add(put(mallow(R, .086, c), .29 - j * .096, 0, 0, 0, 0, HP)));
    });
    return g;
  } },
  // 침낭 베개: a rolled sleeping bag — coral outside, the navy lining curling round at both ends, two straps with buckles
  sleeppillow: { name: '침낭 베개', h: .23, build() {
    const g = grp(), R = .1, L = .3, out = '#ff9a5c', lin = '#4a5aa8', st = '#4a3a5a';
    g.add(put(cyl(R, R, L, out, null, 24), 0, R, 0, 0, 0, HP));
    for (const s of [-1, 1]) {
      g.add(put(cyl(R - .006, R - .006, .008, lin, null, 24), s * (L / 2 + .002), R, 0, 0, 0, HP));
      g.add(put(tor(.066, .011, out, null, PI * 1.6, 6, 22), s * (L / 2 + .007), R, 0, 0, HP, s * .8));
      g.add(put(tor(.032, .01, out, null, PI * 1.5, 6, 16), s * (L / 2 + .007), R, 0, 0, HP, s * 2.2));
      g.add(put(tor(R + .004, .012, st, null, PI * 2, 6, 26), s * .085, R, 0, 0, HP, 0));
      g.add(put(rbox(.03, .026, .018, '#ffd23f', .005), s * .085, R + .004, R + .008));
    }
    return g;
  } },
  // 별자리 지도: a navy chart unrolled on the floor, cream rolls at both ends, the Big Dipper in gold with its lines, a moon
  starmap: { name: '별자리 지도', h: .08, flat: true, build() {
    const g = grp(), W = .34, D = .24, y = .012;
    g.add(put(rbox(W, .01, D, '#2f3b85', .004), 0, y, 0));
    for (const s of [-1, 1]) g.add(put(cyl(.038, .038, D + .02, '#f3e6c4', null, 16), s * (W / 2 + .02), .038, 0, HP, 0, 0));
    const P = [[-.13, -.06], [-.07, -.075], [-.02, -.05], [.03, -.02], [.05, .04], [.11, .05], [.115, -.01]];
    const top = y + .006;
    for (let i = 0; i < P.length - 1; i++) {
      const [x0, z0] = P[i], [x1, z1] = i === 5 ? P[6] : P[i + 1], len = Math.hypot(x1 - x0, z1 - z0);
      g.add(put(rbox(len, .003, .007, '#9fb0ff', .001), (x0 + x1) / 2, top, (z0 + z1) / 2, 0, -Math.atan2(z1 - z0, x1 - x0), 0));
    }
    g.add(put(rbox(.068, .003, .007, '#9fb0ff', .001), .0825, top, .0475, 0, 0, 0));
    P.forEach(([x, z], i) => g.add(put(flatStar('smstar', .024, .011, .008, '#ffd23f', { emissive: '#ffb300', ei: .3 }), x, top + .004, z, -HP, 0, i * .4)));
    g.add(put(flatStar('smstar2', .036, .016, .01, '#ffe680', { emissive: '#ffc400', ei: .35 }), -.11, top + .005, .07, -HP, 0, 0));
    g.add(put(cyl(.03, .03, .008, '#fff1b8', null, 18), .1, top + .004, -.085));
    g.add(put(cyl(.026, .026, .009, '#2f3b85', null, 18), .114, top + .006, -.094));
    return g;
  } },
  // 마이크: a handheld mic lying on its side — a big silver grille ball, a hot-pink band, a fat lilac handle with a switch
  mic: { name: '마이크', h: .21, build() {
    const g = grp(), k = grp(), R = .09;
    put(k, .1, R, 0, 0, 0, .2); g.add(k);
    k.add(put(sph(R, '#c3c9d8', SILVER, 22, 16), 0, 0, 0));
    for (const [rx, ry] of [[0, HP], [HP, 0], [0, HP / 2], [0, -HP / 2]]) k.add(put(tor(R + .002, .007, '#7d8499', null, PI * 2, 4, 28), 0, 0, 0, rx, ry, 0));
    k.add(put(cyl(.07, .062, .045, '#ff5d9e', GLOSS, 20), -.088, 0, 0, 0, 0, HP));
    k.add(put(cyl(.055, .038, .17, '#a898ff', GLOSS, 18), -.195, 0, 0, 0, 0, HP));
    k.add(put(rbox(.045, .014, .026, '#ffffff', .006), -.16, .052, 0));
    k.add(put(sph(.038, '#8a7ae6', null, 12, 8), -.28, 0, 0, 0, 0, 0, [.5, 1, 1]));
    return g;
  } },
  // 응원봉: a puffy glowing lilac star with a white rim, standing on two of its points, the fat white handle slanting down
  // from it to the floor — lilac bands, a pink button, a wrist strap lying by its end
  cheerstick: { name: '응원봉', h: .27, build() {
    const g = grp(), li = '#a98aff', cx = .085, cy = .118, ex = -.165, ey = .034;
    g.add(put(flatStar('csrim', .136, .072, .03, '#ffffff', GLOSS), cx, cy, -.014));
    g.add(put(flatStar('cshead', .12, .063, .066, '#c7a8ff', { emissive: '#9a6bff', ei: .5, rough: .3 }), cx, cy, .01));
    const k = grp(), len = Math.hypot(cx - ex, cy - ey), a = Math.atan2(cy - ey, cx - ex);
    put(k, ex, ey, -.02, 0, 0, a); g.add(k);
    k.add(put(cyl(.032, .032, len - .06, '#ffffff', GLOSS, 14), (len - .06) / 2, 0, 0, 0, 0, HP));
    for (const x of [.012, len - .085]) k.add(put(cyl(.037, .037, .03, li, null, 14), x, 0, 0, 0, 0, HP));
    k.add(put(sph(.016, '#ff5d9e', GLOSS, 10, 8), len * .45, .03, 0));
    g.add(put(tor(.03, .007, '#ff8fb8', null, PI * 2, 4, 16), ex - .03, .007, .02, HP, 0, 0));
    return g;
  } },
  // 헤드폰: big over-ear headphones standing on their cups, the 🎧 shape — a thick coral band padded cream underneath, fat
  // mint cups with cream cushions inside and a coral disc on each outer face
  headphones: { name: '헤드폰', h: .31, build() {
    const g = grp(), X = .125, Rc = .085, cy = .088, band = '#ff7a6a';
    for (const s of [-1, 1]) {
      g.add(put(cyl(Rc, Rc, .07, '#8fd8c8', GLOSS, 24), s * X, cy, 0, 0, 0, HP));
      g.add(put(cyl(Rc - .008, Rc - .012, .03, '#fff4e8', null, 22), s * (X - .048), cy, 0, 0, 0, HP));
      g.add(put(cyl(.046, .046, .01, band, GLOSS, 18), s * (X + .036), cy, 0, 0, 0, HP));
      g.add(put(rbox(.03, .06, .04, '#f2f2f6', .012), s * X, cy + .08, 0));
    }
    g.add(put(tor(X, .03, band, GLOSS, PI, 8, 26), 0, cy + .07, 0));
    g.add(put(tor(X - .022, .016, '#fff4e8', null, PI * .7, 6, 18), 0, cy + .07, 0, 0, 0, PI * .15));
    return g;
  } },
  // 트로피: a silver star with a sky-blue star set in it, on a short neck and a two-step royal-blue base with a gold plaque
  trophy: { name: '트로피', h: .32, build() {
    const g = grp();
    g.add(put(rbox(.22, .05, .16, '#4a63c8', .014, GLOSS), 0, .025, 0));
    g.add(put(rbox(.15, .035, .11, '#6f86e8', .012, GLOSS), 0, .0675, 0));
    g.add(put(rbox(.1, .026, .006, '#ffd23f', .003, SILVER), 0, .026, .081));
    g.add(put(cyl(.022, .038, .04, '#e6ecf8', SILVER, 14), 0, .105, 0));
    g.add(put(flatStar('trstar', .1, .05, .045, '#dfe8f8', SILVER), 0, .206, 0, 0, 0, 0));
    g.add(put(flatStar('trstar2', .046, .023, .02, '#8fd0ff', { emissive: '#4fb0ff', ei: .2, rough: .3 }), 0, .208, .032));
    return g;
  } },
  // 액자: a pink frame leaning back on its easel, gold balls on the corners, a photo of a little white friend on a green hill
  picframe: { name: '액자', h: .34, build() {
    const g = grp(), fr = grp(), W = .28, H = .32, pk = '#ff9fbf';
    put(fr, 0, 0, .03, -.3, 0, 0); g.add(fr);
    fr.add(put(rbox(W, H, .04, pk, .02, GLOSS), 0, H / 2, 0));
    fr.add(put(rbox(W - .07, H - .07, .006, '#bfe6ff', .002), 0, H / 2, .02));
    fr.add(put(mesh(geo('pfhill', () => new THREE.CircleGeometry(.105, 20, 0, PI)), mat('#8fd77a')), 0, .035, .0245, 0, 0, 0, [1, .8, 1]));
    fr.add(put(sph(.026, '#ffd23f', null, 14, 10), .06, .24, .024, 0, 0, 0, [1, 1, .3]));
    fr.add(put(sph(.036, '#ffffff', null, 14, 10), -.025, .12, .026, 0, 0, 0, [1.2, .9, .35]));
    for (const s of [-1, 1]) fr.add(put(sph(.006, '#2a1d33', null, 6, 4), -.025 + s * .014, .125, .039));
    for (const sx of [-1, 1]) for (const sy of [0, 1]) fr.add(put(sph(.026, '#ffd23f', SILVER, 12, 8), sx * W / 2, sy * H + (sy ? -.002 : .012), 0));
    g.add(put(rbox(.04, .24, .016, '#e57fa3', .006), 0, .11, -.07, .42, 0, 0));
    return g;
  } },
  // 비커: a fat glass beaker with a spout, glowing mint liquid two-thirds up, white measure lines, bubbles on top
  beaker: { name: '비커', h: .21, build() {
    const g = grp(), R = .1, H = .2;
    g.add(put(cyl(R + .008, R + .01, .014, '#cdeeff', null, 24), 0, .007, 0));
    g.add(put(cyl(R - .008, R - .008, .14, '#7ef0b0', { emissive: '#3fe08a', ei: .35, rough: .3 }, 24), 0, .082, 0));
    g.add(put(cyl(R, R, H - .014, '#cfeeff', { opacity: .55, rough: .1 }, 24, true), 0, (H + .014) / 2, 0));
    g.add(put(tor(R + .002, .011, '#e2f5ff', GLOSS, PI * 2, 6, 28), 0, H, 0, HP, 0, 0));
    g.add(put(cone(.03, .03, '#f2fbff', GLOSS, 10), 0, H - .004, R + .012, -HP * .9, 0, 0, [1, 1, .4]));
    for (const [y, w] of [[.06, .05], [.09, .03], [.12, .05], [.15, .03]]) g.add(put(rbox(w, .006, .004, '#ffffff', .002), -.03 + w / 2, y, R + .002));
    for (const [x, z, r] of [[-.03, .02, .026], [.025, -.02, .03], [.035, .04, .02], [-.04, -.04, .018]]) g.add(put(sph(r, '#c8ffe0', null, 12, 8), x, .155, z));
    return g;
  } },
  // 올챙이 유리병 (29판 개굴이네 연잎 연못 집, 10/24 사용자 "찾는 물건 신기하거나 좋아 보이는 걸로"): a fat glass jar of pond water,
  // three tadpoles wriggling in it, a little lily pad floating on top, a cork with a string loop and a frog-face label
  tadpolejar: { name: '올챙이 유리병', h: .26, build() {
    // (a toon jar: the pond water is the jar's body — pale teal, no see-through to sort — the glass shows as a bright rim, a
    // white glint stripe and an empty band at the top; the tadpoles swim against the front)
    const g = grp(), R = .08, H = .2;
    g.add(put(cyl(R, R - .004, .15, '#9fe6e0', { rough: .25 }, 24), 0, .079, 0));
    g.add(put(cyl(R + .003, R + .003, .045, '#effcff', { opacity: .55, rough: .08 }, 24, true), 0, .175, 0));
    g.add(put(cyl(R + .004, R + .004, .008, '#d6f3f6', null, 24), 0, .004, 0));
    g.add(put(cyl(R - .002, R - .002, .004, '#7fd6d8', null, 24), 0, .155, 0));
    g.add(put(tor(R, .009, '#f4feff', GLOSS, PI * 2, 6, 26), 0, H, 0, HP, 0, 0));
    g.add(put(rbox(.014, .12, .004, '#ffffff', .006), -.045, .1, R - .012, 0, -.55, 0));
    g.add(put(cyl(.05, .046, .035, '#e3b47a', null, 18), 0, H + .015, 0)); g.add(put(tor(.048, .005, '#fff1dc', null, PI * 2, 4, 16), 0, H + .02, 0, HP, 0, 0));
    g.add(put(tor(.025, .004, '#fff1dc', null, PI * 2, 4, 14), .04, H + .04, 0, 0, 0, .5));
    for (const [x, y, a] of [[-.028, .11, .5], [.03, .075, 2.6], [.0, .045, 1.1]]) {
      const z = Math.sqrt(Math.max(0, R * R - x * x)) + .002;
      g.add(put(sph(.017, '#2f3340', GLOSS, 12, 10), x, y, z, 0, 0, 0, [1, 1, .55]));
      g.add(put(cone(.011, .04, '#3d4252', null, 8), x + Math.cos(a) * .028, y + Math.sin(a) * .028, z, 0, 0, a - HP, [1, 1, .3]));
      g.add(put(sph(.004, '#ffffff', null, 6, 4), x + .006, y + .008, z + .008));
    }
    g.add(put(cyl(.038, .038, .005, '#6cc06a', null, 18), .015, .159, -.01));
    g.add(put(sph(.014, '#ffb6cc', null, 10, 8), .025, .166, -.015));
    g.add(put(rbox(.06, .04, .004, '#fff6e0', .008), .035, .05, Math.sqrt(R * R - .035 * .035) + .003, 0, .45, 0));
    return g;
  } },
  // 개구리 장화: a pair of glossy green rain boots, a frog's eyes bulging on each toe, a pink tongue-coloured pull tab, cream soles
  frogboots: { name: '개구리 장화', h: .2, build() {
    const g = grp(), C = '#7fd06a', dk = '#5aae5a';
    const boot = (x, ry) => {
      const b = grp();
      b.add(put(cyl(.045, .05, .15, C, GLOSS, 18), 0, .095, 0));
      b.add(put(rbox(.1, .055, .15, C, .025, GLOSS), 0, .028, .035));
      b.add(put(rbox(.106, .014, .158, '#fff3dc', .006), 0, .007, .035));
      b.add(put(tor(.046, .008, dk, GLOSS, PI * 2, 6, 18), 0, .17, 0, HP, 0, 0));
      b.add(put(rbox(.025, .03, .006, '#ff8fa8', .006), 0, .16, -.05));
      for (const sx of [-1, 1]) { b.add(put(sph(.02, C, GLOSS, 12, 10), sx * .025, .065, .08)); b.add(put(sph(.012, '#ffffff', null, 10, 8), sx * .025, .07, .095)); b.add(put(sph(.006, '#2a1d33', null, 8, 6), sx * .025, .071, .105)); }
      b.add(put(tor(.016, .003, '#2a1d33', null, PI * .8, 4, 10), 0, .045, .108, 0, 0, PI * 1.1));
      put(b, x, 0, 0, 0, ry, 0); g.add(b);
    };
    boot(-.055, .12); boot(.06, -.08);
    return g;
  } },
};
// drawn bigger than they were built: at the start view the first cut read 25–30 px against the stage's own 17–26 (⑥ 10/21,
// measured on the drawn shape) — × 1.3 across, and the upright ones only a little taller so they still go under a low top
// (the long ones less: × 1.3 made a 75 cm light stick)
const GROW = { smores: 1.2, starmap: 1.15, sleeppillow: 1.3, mic: 1.2, headphones: [1.3, 1.15, 1.3],
  camplantern: [1.3, 1.12, 1.3], trophy: [1.3, 1.12, 1.3], picframe: [1.3, 1.12, 1.3], beaker: [1.3, 1.12, 1.3], cheerstick: [1.15, 1.12, 1.15] };
export const MORE_ITEMS = Object.fromEntries(Object.entries(RAW).map(([k, d]) => {
  const s = [].concat(GROW[k] || 1), [x, y, z] = s.length === 3 ? s : [s[0], s[0], s[0]];
  return [k, { ...d, h: +(d.h * y).toFixed(3), build(o) { const g = grp(), m = d.build(o); m.scale.set(x, y, z); g.add(m); return g; } }];
}));
