// GPT workshop, 2026-10-22. A cut-away local train, using the game's merged/toon prop pipeline.
// Every new builder is prefixed gpt_. Story equivalents and spot ordering are preserved explicitly.
import * as THREE from 'three';
import { put, grp, mesh, mat, canvasTex } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { TRAINCAR_BUILDERS as OLD } from './traincar-props.js';
import { Char } from './chars.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)

const PI = Math.PI, HP = PI / 2;
const C = { ivory: '#fef2e1', ivory2: '#e8d7b7', cream: '#fefde9', steel: '#dbdcde', steel2: '#aaa996',
  ink: '#644936', seat: '#84ae9d', seat2: '#6f9989', pipe: '#c6c393', pink: '#e6b5a1', pink2: '#c98f81',
  leather: '#6f4b30', wood: '#eecfa3', rust: '#ee9d4c', gold: '#f8b15b', dark: '#a09769' };
const B = {};
// The 10/22 pass is opt-in for the selected single carriage. Other workshop maps share these builders.
// Paint is snapped before the normal toon pipeline; no global renderer/material settings are changed.
const FIX_PAINT = {
  '#dbdcde': '#f2dcbc', '#aaa996': '#a09769', '#6f9989': '#84ae9d',
  '#e6b5a1': '#ef9b86', '#c98f81': '#d97862', '#9caaa4': '#84ae9d', '#c7d6bf': '#c6c393',
  '#d5b3a5': '#ef9b86', '#f8eee0': '#fef2e1', '#e3c58b': '#eecfa3', '#bca773': '#c67f2a',
  '#d6c8ac': '#eecfa3', '#e8ddc4': '#fef2e1', '#b5b6a4': '#84ae9d', '#f4dc9f': '#feebc8',
  '#d6e0d9': '#a2c8bb', '#e7d8bc': '#f2dcbc', '#cfbea0': '#e8d7b7',
  '#dfc99f': '#eecfa3', '#b18b77': '#c67f2a', '#799b93': '#84ae9d', '#d7b784': '#eaa440',
  '#c1aba4': '#ef9b86', '#91aaa4': '#a2c8bb', '#bc9256': '#c67f2a', '#9baea8': '#84ae9d',
  '#d9d3bf': '#f2dcbc', '#aa5847': '#d97862', '#d3b28d': '#c67f2a', '#e7c58b': '#eecfa3',
  '#d4e1d4': '#a2c8bb', '#8fa98d': '#84ae9d', '#c7b397': '#e8d7b7', '#fbf0d7': '#fef2e1',
  '#f1d8a1': '#feebc8', '#e3cba0': '#eecfa3', '#b8b5a5': '#a09769',
};
const trainMesh = fixed => fixed ? (key, build) => mc(key + '|fix-1022', api => {
  const paint = color => FIX_PAINT[color] || color;
  build({ ...api, add: (geo, color, ...at) => api.add(geo, paint(color), ...at),
    tube: (a, b, r, color, seg = 6, r2 = r) => api.tube(a, b, r, paint(color), Math.min(seg, r < .035 ? 6 : 8), r2) });
}) : mc;
// One rounded segment is plenty at phone scale; preserve the established silhouette and lower the vertex budget.
const FIX_G = { ...G,
  // Millimetre trim does not need 324 bevel vertices; keep rounded corners on the large toy silhouettes.
  box: (w, h, d, r = .02) => Math.min(w, h, d) < .06 ? new THREE.BoxGeometry(w, h, d) : G.box(w, h, d, r, 1),
  cyl: (rt, rb, h, seg = 14, open = false) => G.cyl(rt, rb, h, Math.min(seg, 10), open),
  sph: (r, ws = 10, hs = 8) => G.sph(r, Math.min(ws, 10), Math.min(hs, 6)),
  tor: (R, t, arc = PI * 2, rs = 6, ts = 22) => G.tor(R, t, arc, Math.min(rs, R < .12 ? 4 : 6), Math.min(ts, R < .12 ? 10 : 16)),
};
const trainGeometry = fixed => fixed ? FIX_G : G;

const basic = (map, opts = {}) => { const m = new THREE.MeshBasicMaterial({ map, ...opts }); m.toneMapped = false; return m; };
const sign = (w, h, draw, x, y, z) => {
  const tw = Math.min(2048, Math.round(128 * w / h)), th = Math.max(24, Math.round(tw * h / w));
  return put(mesh(new THREE.PlaneGeometry(w, h), basic(canvasTex(tw, th, draw)), { cast: false }), x, y, z);
};
const story = (f, key) => { f.storyType = key; };

// Match the game's round typefaces, with a measured 10% margin on every edge.
export function fittedTrainText(c, text, W, H, maxPx = 72, korean = false) {
  text = tr(text);   // (영어 화면에선 영어, ① 10/22)
  let px = Math.max(8, Math.floor(Math.min(maxPx, H * .8))), m;
  const measure = () => {
    c.font = korean ? `bold ${px}px "Ssurround", "Jua", sans-serif` : `bold ${px}px "LatinRound", "Ssurround", "Jua", sans-serif`;
    m = c.measureText(text);
    return { a: m.actualBoundingBoxAscent ?? px * .75, d: m.actualBoundingBoxDescent ?? px * .25 };
  };
  let h = measure();
  while ((m.width > W * .8 || h.a + h.d > H * .8) && px > 8) { px--; h = measure(); }
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(text, W / 2, H / 2 + (h.a - h.d) / 2);
}

// Passenger belongings use deliberately large, legible shapes. They leave one cushion free for a hiding spot.
function belongings(add, tube, kind, Y, fixed = false) {
  const G = trainGeometry(fixed);
  if (fixed && kind === 'toy') {
    // A 33cm toy and 19cm milk carton, rather than a toy nearly as tall as a companion.
    const addBase = add, tubeBase = tube;
    const size = x => x < 0 ? { k: .72, x: -.48 } : { k: .90, x: .65 };
    add = (g, color, x, y, z, rx, ry, rz, sc = 1) => {
      const b = size(x), scale = Array.isArray(sc) ? sc.map(n => n * b.k) : sc * b.k;
      addBase(g, color, b.x + (x - b.x) * b.k, Y + (y - Y) * b.k, .06 + (z - .06) * b.k, rx, ry, rz, scale);
    };
    tube = (a, b, r, color, ...rest) => {
      const q = size(a[0]), pos = v => [q.x + (v[0] - q.x) * q.k, Y + (v[1] - Y) * q.k, .06 + (v[2] - .06) * q.k];
      tubeBase(pos(a), pos(b), r * q.k, color, ...rest);
    };
  }
  if (kind === 'paper') {
    add(G.box(.48, fixed ? .006 : .022, .34, fixed ? .002 : .006), C.cream, .43, Y + (fixed ? .004 : .012), -.015, 0, -.18, 0);
    if (fixed) {
      // A thin folded newspaper with a small raised edge and a separate piece of warm paper tape.
      add(G.box(.105, .004, .075, .001), C.cream, .615, Y + .015, .105, -.24, -.18, .08);
      add(G.box(.085, .006, .035, .001), C.wood, .23, Y + .012, -.14, 0, -.18, -.18);
    }
    add(G.box(.19, .005, .018, .001), C.steel2, .35, Y + (fixed ? .0095 : .026), -.12, 0, -.18, 0);
    for (let k = 0; k < 4; k++) add(G.box(.37, .005, .012, .001), '#9caaa4', .43, Y + (fixed ? .0095 : .027), -.065 + k * .045, 0, -.18, 0);
    add(G.box(.12, .005, .09, .001), '#c7d6bf', .31, Y + (fixed ? .0095 : .028), .015, 0, -.18, 0);
    add(G.cyl(.072, .062, .15, 12), C.cream, .81, Y + .075, .09);
    add(G.cyl(.075, .075, .045, 12), C.rust, .81, Y + .09, .09);
    add(G.cyl(.076, .076, .018, 12), C.gold, .81, Y + .16, .09);
    tube([.77, Y + .17, .08], [.85, Y + .30, .12], .007, C.wood, 5);
  } else if (kind === 'bag') {
    add(G.box(.33, .35, .19, .035, 2), '#d5b3a5', -.53, Y + .175, -.04, 0, .15, 0);
    add(G.box(.25, .07, .012, .006), '#f8eee0', -.53, Y + .23, .061, 0, .15, 0);
    for (const z of [-.10, .035]) add(G.tor(.075, .012, PI, 5, 12), C.leather, -.53, Y + .34, z);
    add(G.box(.31, .09, .22, .026), '#e3c58b', .51, Y + .045, .045, 0, -.2, 0);
    for (let k = 0; k < 4; k++) add(G.box(.27, .007, .01, .002), '#bca773', .51, Y + .094, -.025 + k * .045, 0, -.2, 0);
  } else if (kind === 'toy') {
    add(G.box(.18, .20, .13, .025, 2), '#d6c8ac', -.48, Y + .12, .06);
    add(G.box(.21, .14, .15, .025, 2), '#e8ddc4', -.48, Y + .29, .06);
    for (const s of [-1, 1]) {
      add(G.sph(.018, 6, 4), C.ink, -.48 + s * .052, Y + .31, .14);
      add(G.box(.05, .13, .05, .01), '#b5b6a4', -.48 + s * .13, Y + .13, .06, 0, 0, s * .18);
      add(G.box(.065, .055, .10, .01), C.wood, -.48 + s * .055, Y + .027, .08);
    }
    add(G.cyl(.008, .008, .06, 5), C.steel2, -.48, Y + .4, .06);
    add(G.sph(.025, 7, 4), C.rust, -.48, Y + .44, .06);
    add(G.box(.15, .18, .12, .02), '#f4dc9f', .65, Y + .09, .06);
    add(G.box(.07, .035, .08, .01), C.gold, .65, Y + .195, .06);
    add(G.box(.09, .055, .009, .006), C.cream, .65, Y + .105, .125);
  }
}

// tbench2 equivalent: separately upholstered cushions, piping, cast aluminium legs, recessed heater.
// The drawer's bay is empty geometry; its tray has a bottom, both sides and a back.
B.gpt_tbench2 = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'tbench2');
  const W = 1.94, D = .76, Y = o.fix1022 ? .58 : .54, a = o.priority ? C.pink : C.seat, b = o.priority ? C.pink2 : C.seat2;
  f.add(mc('gpt-train-bench-v3|' + !!o.priority + '|' + !!o.drawer + '|' + (o.stuff || ''), ({ add, tube }) => {
    // Feet and case: no solid box inside the drawer half.
    for (const x of [-.83, .83]) {
      add(G.box(.12, .08, .58, .02), C.steel2, x, .06, -.055);
      add(G.box(.07, .29, .46, .015), C.steel, x, .205, -.055);
    }
    add(G.box(W, .07, .66, .02), C.ivory2, 0, .365, -.04);
    if (o.drawer) {
      add(G.box(.96, .24, .63, .025), C.ivory2, -.49, .22, -.045);
      add(G.box(.85, .035, .59, .007), C.steel2, .47, .105, -.045);
      add(G.box(.04, .23, .62, .007), C.ivory2, .94, .235, -.045);
      add(G.box(.04, .23, .62, .007), C.ivory2, .015, .235, -.045);
      add(G.box(.88, .23, .025, .006), C.steel2, .47, .235, -.35);
      for (const x of [.07, .87]) add(G.box(.022, .035, .52, .004), C.steel2, x, .19, .10);
    } else add(G.box(W, .24, .63, .025), C.ivory2, 0, .22, -.045);
    for (const x of o.drawer ? [-.49] : [-.49, .49]) {
      add(G.box(.75, .145, .022, .01), C.steel2, x, .215, .283);
      for (let k = 0; k < 5; k++) add(G.box(.65, .011, .012, .003), '#a09769', x, .165 + k * .023, .3);
      add(G.box(.78, .017, .025, .004), C.steel, x, .293, .3);
    }
    // Three independent padded seats, each with a plump back and a sewn edge.
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * .64;
      add(G.box(.615, .195, D, .075, 2), a, x, Y - .085, -.015);
      add(G.box(.56, .032, .018, .008), C.pipe, x, Y - .022, .361);
      add(G.box(.615, .61, .19, .075, 2), b, x, Y + .28, -.305, -.09, 0, 0);
      add(G.box(.53, .02, .025, .009), a, x, Y + .506, -.176, -.09, 0, 0);
      for (const sx of [-1, 1]) add(G.box(.014, .42, .025, .005), a, x + sx * .25, Y + .27, -.187, -.09, 0, 0);
      add(G.sph(.012, 6, 4), C.pipe, x, Y + .265, -.182, 0, 0, 0, [1, 1, .35]);
    }
    add(G.box(W + .03, .055, .19, .02), C.ivory, 0, 1.155 + (o.fix1022 ? .04 : 0), -.35);
    // Finely profiled solid end panels with rounded steel rails.
    for (const s of [-1, 1]) {
      const x = s * .963;
      tube([x, .10, .30], [x, .80, .30], .025, C.steel, 8);
      tube([x, .80, .30], [x, .93, -.12], .025, C.steel, 8);
      tube([x, .93, -.12], [x, .64, -.23], .025, C.steel, 8);
      add(G.box(.032, .36, .30, .012), '#d6e0d9', x, .64, .015);
      add(G.box(.060, .035, .35, .014), C.wood, x, .806, .09, -.22, 0, 0);
    }
    if (o.priority) {
      add(G.box(.19, .18, .012, .018), C.cream, 0, .96, -.168, -.09, 0, 0);
      add(G.sph(.034, 8, 6), C.pink2, 0, 1.0, -.15, 0, 0, 0, [1, 1, .25]);
      add(G.box(.085, .038, .01, .012), C.pink2, 0, .935, -.148);
    }
    if (o.stuff) belongings(add, tube, o.stuff, Y + .018, o.fix1022);
  }));
  if (o.fix1022) f.gptSizeAudit = { trainSeat: Y + .0125 };
  if (o.fix1022 && o.stuff) f.gptSmallAudit = o.stuff === 'paper' ? [
    { label: '신문', width: .48, height: .006, depth: .34 },
    { label: '컵라면 용기', width: .152, height: .169, depth: .152 },
  ] : o.stuff === 'bag' ? [
    { label: '장바구니', width: .33, height: .427, depth: .19 },
    { label: '도시락', width: .31, height: .0975, depth: .22 },
  ] : [
    { label: '로봇 장난감', width: .31 * .72, height: .465 * .72, depth: .23 * .72 },
    { label: '우유 팩', width: .15 * .90, height: .2125 * .90, depth: .12 * .90 },
  ];
  f.spot('under', null, -.55, .02, .48, { maxH: .23, label: '벤치 밑', scale: .95 });
  f.spot('on', null, o.stuff === 'bag' ? -.03 : -.05, Y + .024, .16, { maxH: .62, label: '벤치 위', scale: 1.35 });

  if (o.drawer) {
    const tray = grp(); put(tray, .47, .22, .37); f.add(tray);
    tray.add(mc('gpt-train-seat-drawer-v2', ({ add, tube }) => {
      add(G.box(.86, .255, .045, .014), C.ivory, 0, 0, .015);
      add(G.box(.74, .17, .015, .012), '#e7d8bc', 0, 0, .045);
      add(G.box(.79, .025, .49, .006), '#cfbea0', 0, -.105, -.23);
      for (const s of [-1, 1]) add(G.box(.027, .18, .49, .006), C.ivory2, s * .383, -.025, -.23);
      for (const s of [-1, 1]) add(G.box(.025, .032, .49, .004), C.steel, s * .401, -.03, -.23);
      add(G.box(.78, .18, .025, .006), C.ivory2, 0, -.025, -.466);
      tube([-.10, .015, .09], [.10, .015, .09], .018, C.steel2, 8);
      for (const x of [-.10, .10]) tube([x, .015, .056], [x, .015, .09], .012, C.steel, 6);
    }));
    const p = f.part('drawer', tray, (t, b) => { tray.position.z = b.p.z + .40 * t; }, { label: '벤치 서랍', sfx: 'drawer', dur: .32 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .27, y: 0, z: .078, parent: tray };
    f.spot('inside', tray, 0, -.085, -.21, { part: p, maxH: .24, label: '벤치 서랍 안', scale: 1.0 });
  }
  if (o.drawer) {
    // One reversible train bench: release, slide just clear of its neighbours, then turn around on its steel base.
    // Its seat and all belongings/anchors move together; the floor rails remain fixed and connected.
    const seat = grp(); for (const child of [...f.group.children]) seat.add(child); f.add(seat);
    f.add(mc('gpt-train-reversible-seat-base-v1', ({ add }) => {
      for (const x of [-.50, .50]) {
        add(G.box(.075, .025, 1.25, .008), C.steel2, x, .018, .33);
        for (const z of [-.22, .88]) add(G.box(.13, .025, .10, .008), C.steel, x, .020, z);
      }
    }));
    const release = grp(); put(release, 0, .25, .35); seat.add(release);
    release.add(mc('gpt-train-reversible-seat-release-v1', ({ add, tube }) => {
      tube([-.10, 0, .02], [.10, 0, .02], .025, C.rust, 8);
      for (const x of [-.10, .10]) tube([x, 0, -.04], [x, 0, .02], .018, C.steel2, 6);
    }));
    seat.add(mc('gpt-train-reversible-seat-bearing-v1', ({ add }) => add(G.cyl(.18, .18, .10, 14), C.steel2, 0, .14, -.03)));
    const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const turn = f.part('swivel', seat, (t, b) => {
      seat.position.z = b.p.z + .75 * smooth(t / .35);
      seat.rotation.y = b.r.y + PI * smooth((t - .35) / .65);
      release.rotation.x = -.20 * Math.sin(t * PI);
    }, { label: '회전 좌석', sfx: 'ratchet', dur: 1.6 });
    turn.handle = release; turn.gptAuxiliary = 'rotating-seat';
    (f.live ||= []).push(release); // Keep the coloured lever geometry under its handle reference after static baking.
    f.parts.splice(f.parts.indexOf(turn), 1); f.parts.unshift(turn);
    f.gptSeat = seat;
  }
  // The original sill projects 26cm from the wall. Leave a real gap behind the padded back instead of intersecting it.
  const clearance = grp(); for (const child of [...f.group.children]) clearance.add(child);
  clearance.position.z = .17; f.add(clearance);
};

// A scoped, rail-only window keeps the existing blind/ledge interfaces while excluding the inherited country art.
// Every texture consists solely of long horizontal railway streaks over cream; there are no scene silhouettes.
function railLineWindow(f, T, o) {
  const mc = trainMesh(true), G = FIX_G, W = 1.86, H = 1.24, cy = 1.62;
  f.add(mc('gpt-train-rail-window-frame|' + !!o.paw, ({ add }) => {
    for (const sy of [-1, 1]) {
      add(G.box(W + .18, .09, .12, .035), C.steel, 0, cy + sy * (H / 2 + .045), .06);
      add(G.box(W + .02, .026, .02, .006), C.leather, 0, cy + sy * (H / 2 - .005), .045);
    }
    for (const sx of [-1, 1]) {
      add(G.box(.09, H + .18, .12, .035), C.steel, sx * (W / 2 + .045), cy, .06);
      add(G.box(.026, H - .02, .02, .006), C.leather, sx * (W / 2 - .005), cy, .045);
      add(G.box(.08, .03, .04, .01), C.wood, sx * .45, cy - H / 2 - .02, .10);
      add(G.box(.03, .045, .03, .008), C.ink, sx * .45 + .03, cy - H / 2, .12);
    }
    add(G.box(.045, H, .06, .01), C.steel, .25, cy, .05);
    add(G.box(W - .1, .04, .06, .01), C.steel, 0, cy + H * .22, .05);
    add(G.box(W + .34, .07, .26, .02), C.ivory2, 0, cy - H / 2 - .09, .13);
    add(G.cyl(.05, .05, .006, 14), C.gold, -.7, cy - .42, .047, HP, 0, 0);
    add(G.box(.08, .06, .006, .01), '#b0e5e8', .7, cy + .48, .047);
    if (o.paw) {
      add(G.sph(.03, 8, 6), C.leather, -.2, cy - .2, .045, 0, 0, 0, [1, 1.1, .2]);
      for (let k = 0; k < 3; k++) add(G.sph(.012, 6, 5), C.leather, -.2 + (k - 1) * .028, cy - .16, .045, 0, 0, 0, [1, 1, .2]);
    }
  }));
  const bg = mesh(new THREE.PlaneGeometry(W, H), basic(null, { color: C.ivory }), { cast: false });
  put(bg, 0, cy, .022); f.add(bg);
  const layers = [
    { y: [.34, .38, .61], color: '#a2c8bb', width: .55, speed: 12, metres: 5 },
    { y: [.67, .72, .84, .89], color: '#a09769', width: .73, speed: 20, metres: 3 },
  ].map((cfg, i) => {
    const tex = canvasTex(512, 256, (c, tw, th) => {
      cfg.y.forEach((y, k) => {
        const x = (k * 137 + i * 47) % tw, w = tw * cfg.width;
        c.fillStyle = cfg.color;
        for (const wrap of [-tw, 0, tw]) c.fillRect(x + wrap, th * y, w, i ? 4 : 3);
        c.fillStyle = C.cream;
        for (const wrap of [-tw, 0, tw]) c.fillRect(x + wrap, th * y + (i ? 5 : 4), w, 2);
      });
    });
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(W / cfg.metres, 1);
    const line = mesh(new THREE.PlaneGeometry(W, H), basic(tex, { transparent: true, depthWrite: false }), { cast: false });
    put(line, 0, cy, .024 + i * .002); line.layers.set(2); line.renderOrder = i + 1;
    line.userData.noOcclude = true; f.add(line);
    return { tex, ...cfg };
  });
  f.gptRailFlow = { onlyRailLines: true, speeds: layers.map(l => l.speed) };
  f.tick = t => {
    const u = f.group.position.x - W / 2;
    for (const l of layers) l.tex.offset.x = ((u + t * l.speed) / l.metres) % 1;
  };
  if (!o.blind) f.spot('on', null, .5, cy - H / 2 - .06, .16, { maxH: .22, label: '창턱', scale: .75 });
  if (o.blind) {
    const BZ = .29, BW = W + .14;
    f.add(mc('gpt-train-rail-window-roll', ({ add }) => {
      add(G.cyl(.065, .065, BW + .06, 14), C.gold, 0, cy + H / 2 + .1, BZ - .01, 0, 0, HP);
      for (const side of [-1, 1]) add(G.box(.04, .15, BZ - .02, .01), C.steel, side * (BW / 2 + .05), cy + H / 2 + .1, (BZ - .02) / 2 + .02);
    }));
    const bl = grp(); put(bl, 0, cy + H / 2 + .1, BZ); f.add(bl);
    bl.add(mc('gpt-train-rail-window-blind', ({ add, tube }) => {
      add(G.box(BW, 1, .012, .004), C.ivory2, 0, -.5, 0);
      add(G.box(BW + .02, .04, .03, .01), C.gold, 0, -1, 0);
      tube([0, -1, .01], [0, -1.08, .02], .006, C.wood, 4);
      add(G.tor(.04, .011, PI * 2, 6, 14), C.cream, 0, -1.12, .02);
    }));
    bl.scale.y = H * .55;
    const p = f.part('lift', bl, t => { bl.scale.y = Math.max(.05, H * .55 * (1 - .92 * t)); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    f.spot('inside', null, -.4, cy - H / 2 - .06, .16, { part: p, maxH: .25, label: '블라인드 뒤 창턱', scale: .75 });
  }
}

// The approved blind/card mechanism is preserved; the selected carriage opts into fast rail lines only.
B.gpt_twindow2 = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'twindow2');
  if (o.fix1022) railLineWindow(f, T, o); else OLD.twindow2(f, T, { ...o, flow: true });
  // Phone QA: a window ledge is too shallow for tap-sized mugs. Keep the inherited anchors for clue designers only.
  for (const s of f.spots) s.reserved = true;
  f.add(mc('gpt-train-window-fittings-v2', ({ add }) => {
    for (const s of [-1, 1]) {
      add(G.box(.055, 1.52, .055, .015), C.ivory2, s * 1.06, 1.62, .035);
      add(G.box(.035, .12, .055, .009), C.steel2, s * .68, 1.018, .17);
      add(G.box(.12, .025, .045, .009), C.steel, s * .68, 1.087, .18);
    }
    add(G.box(1.88, .045, .15, .015), C.wood, 0, .88, .18);
    add(G.box(.20, .07, .018, .012), C.ivory, -.53, 2.31, .09);
    for (const x of [-.60, -.46]) add(G.sph(.01, 6, 4), C.steel2, x, 2.31, .104, 0, 0, 0, [1, 1, .3]);
  }));
  if (o.blind) {
    // A reversible trip card, uncovered first and then flipped. Its pictures are bindable clues, not an invented lock code.
    const card = grp(); put(card, .34, 1.94, .20, 0, PI, 0); f.add(card);
    card.add(mc('gpt-train-blind-trip-card-v1', ({ add }) => {
      add(G.box(.86, .32, .035, .022), C.wood, 0, 0, 0);
      add(G.box(.79, .25, .014, .012), C.cream, 0, 0, .027);
      add(G.cyl(.055, .055, .014, 16), C.rust, -.24, 0, .047, HP, 0, 0);
      const tri = new THREE.Shape(); tri.moveTo(-.055, -.05); tri.lineTo(.055, -.05); tri.lineTo(0, .06); tri.closePath();
      add(G.ext(tri, .014, .002), C.gold, 0, 0, .041);
      add(G.box(.108, .108, .014, .012), C.seat2, .24, 0, .047);
      add(G.box(.79, .25, .012, .012), C.ivory2, 0, 0, -.027);
      add(G.box(.21, .018, .013, .006), C.wood, 0, 0, -.04);
    }));
    const p = f.parts.find(v => v.label === '롤 블라인드'), apply = p.apply;
    // A paw left by the stowaway: printed on the lowering blind, with a separate thumb so it reads as a hand.
    const hand = grp(); put(hand, -.57, -.61, .036); p.pivots[0].add(hand);
    hand.add(mc('gpt-train-blind-handprint-v1', ({ add }) => {
      add(G.sph(.09, 12, 8), C.leather, 0, 0, 0, 0, 0, -.12, [1.10, 1.16, .12]);
      for (const [x, y, r] of [[-.105, .095, -.34], [-.045, .16, -.1], [.025, .17, .08], [.092, .12, .30]])
        add(G.box(.045, .115, .015, .021, 2), C.leather, x, y, 0, 0, 0, r);
      add(G.box(.055, .13, .015, .024, 2), C.leather, -.13, -.005, 0, 0, 0, -.80);
    }));
    card.userData.base = { p: card.position.clone(), r: card.rotation.clone(), s: card.scale.clone() };
    p.pivots.push(card);
    p.apply = (t, ...b) => {
      apply(t, ...b);
      const k = Math.max(0, Math.min(1, (t - .76) / .24));
      card.rotation.y = PI * (1 - k * k * (3 - 2 * k));
    };
    p.dur = .85;
    p.gptAuxiliary = 'clue-reveal';
    p.gptClueReveal = { kind: 'travel-pictograms', symbols: ['circle', 'triangle', 'square'], handprint: true, answer: null, bindable: true };
    f.gptTravelCard = card;
    f.gptHandprint = hand;
  }
};

function duffel(add, tube, x, y, z, color, fixed = false) {
  const G = trainGeometry(fixed);
  add(G.box(.62, .31, .37, .10, 2), color, x, y + .155, z);
  for (const s of [-1, 1]) {
    add(G.box(.045, .30, .38, .014), C.leather, x + s * .205, y + .16, z);
    add(G.tor(.065, .013, PI, 5, 12), C.leather, x + s * .085, y + .31, z);
  }
  tube([x - .22, y + .315, z], [x + .22, y + .315, z], .008, C.gold, 5);
  add(G.box(.11, .09, .02, .012), C.cream, x + .21, y + .18, z + .205, 0, 0, -.2);
}
function suitcase(add, tube, x, y, z, color, fixed = false) {
  const G = trainGeometry(fixed);
  add(G.box(.48, .33, .32, .05, 2), color, x, y + .165, z);
  for (const sx of [-1, 1]) {
    add(G.box(.025, .31, .34, .006), C.leather, x + sx * .16, y + .165, z);
    add(G.box(.05, .04, .025, .006), C.gold, x + sx * .16, y + .19, z + .18);
    tube([x + sx * .075, y + .34, z], [x + sx * .075, y + .39, z], .015, C.leather, 6);
  }
  tube([x - .075, y + .39, z], [x + .075, y + .39, z], .018, C.leather, 6);
}
function rackFrame(add, tube, x, y) {
  for (const sx of [-1, 1]) {
    const xx = x + sx * 1.08;
    tube([xx, y, .08], [xx, y, .64], .022, C.steel, 8);
    tube([xx, y - .29, .075], [xx, y, .62], .020, C.steel2, 7);
    add(G.box(.07, .36, .035, .012), C.steel2, xx, y - .13, .055);
  }
  tube([x - 1.1, y, .65], [x + 1.1, y, .65], .025, C.steel, 8);
  for (let k = 0; k < 11; k++) tube([x - 1 + k * .2, y - .014, .10], [x - 1 + k * .2, y - .014, .61], .012, C.steel2, 5);
  tube([x - 1.08, y, .10], [x + 1.08, y, .10], .018, C.steel, 6);
}

// trailrack2 equivalent: leather straps/buckles, steel stanchions, three real open racks; the middle net lifts.
B.gpt_trailrack2 = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'trailrack2');
  const L = o.len || 11.8, Y = 2.27, R = .72, rackY = 2.63, short = L <= 6;
  if (o.fix1022) f.gptSmallAudit = [
    { label: '여행 가방', width: .62, height: .388, depth: .37 },
    { label: '작은 트렁크', width: .48, height: .408, depth: .34 },
    { label: '접은 우산', width: .152, height: .8585, depth: .15 },
    { label: '객실 조명', width: 1.38, height: .12, depth: .21 },
    { label: '객실 종이 광고', width: (L - .25) / 12, height: .245, depth: .032 },
  ];
  f.collideBox = [-L / 2, 2.22, .50, L / 2, 2.80, .77];
  f.add(mc('gpt-train-rail-v4|' + L, ({ add, tube }) => {
    tube([-L / 2, Y, R], [L / 2, Y, R], .040, C.steel, 12);
    for (const x of short ? [-2.45, 0, 2.45] : [-5, -3, -1, 1, 3, 5]) {
      tube([x, Y, R], [x, Y + .20, .10], .026, C.steel2, 8);
      add(G.box(.10, .14, .025, .02), C.steel2, x, Y + .2, .045);
      add(G.tor(.042, .011, PI * 2, 5, 12), C.steel2, x, Y, R, 0, HP, 0);
      tube([x, .08, 1.03], [x, Y - .05, 1.03], .029, C.steel, 10);
      tube([x, Y - .05, 1.03], [x, Y, R], .029, C.steel, 8);
      add(G.cyl(.075, .075, .025, 12), C.steel2, x, .04, 1.03);
      add(G.cyl(.042, .042, .045, 10), C.steel2, x, .09, 1.03);
    }
    for (let k = 0; k < (short ? 6 : 13); k++) {
      const x = short ? -2.25 + k * .90 : -5.3 + k * .86;
      if (Math.abs(x) < .95) continue;
      add(G.tor(.043, .013, PI * 2, 5, 12), C.leather, x, Y, R, 0, HP, 0);
      add(G.box(.052, .30, .014, .006), C.leather, x, Y - .18, R + .045);
      add(G.box(.073, .047, .023, .006), C.steel, x, Y - .12, R + .057);
      add(G.box(.037, .019, .014, .004), C.leather, x, Y - .12, R + .074);
      add(G.tor(.082, .021, PI * 2, 8, 20), C.cream, x, Y - .415, R + .045);
    }
    // Roof remains a narrow cut edge; ribs and lamps describe its original curvature.
    const curve = new THREE.CylinderGeometry(.47, .47, L + .35, 14, 1, true, 0, HP); curve.rotateZ(HP); curve.rotateY(PI);
    add(curve, C.ivory2, 0, 2.63, .005);
    add(G.box(L + .35, .075, .54, .022), C.seat2, 0, 3.125, .23);
    add(G.box(L + .25, .035, .035, .008), C.gold, 0, 3.073, .505);
    for (let x = short ? -1.7 : -5.1; x < (short ? 1.8 : 5.4); x += 1.7) {
      add(G.box(1.38, .065, .19, .025), C.steel2, x, 3.00, .61);
      add(G.box(1.28, .040, .15, .018), C.cream, x, 2.965, .615);
      for (const sx of [-1, 1]) add(G.box(.045, .10, .21, .012), C.steel, x + sx * .66, 3.01, .61);
    }
    for (const x of short ? [0] : [-3.55, 0, 3.55]) rackFrame(add, tube, x, rackY);
    duffel(add, tube, -.68, rackY, .37, '#dfc99f', o.fix1022);
    suitcase(add, tube, .77, rackY, .36, '#b18b77', o.fix1022);
    if (!short) {
      suitcase(add, tube, -3.98, rackY, .35, '#799b93', o.fix1022);
      duffel(add, tube, -3.00, rackY, .37, '#d7b784', o.fix1022);
      duffel(add, tube, 3.09, rackY, .37, '#c1aba4', o.fix1022);
      suitcase(add, tube, 4.02, rackY, .35, '#91aaa4', o.fix1022);
    }
    // Folded hooked umbrella, with visible ribs and fastening strap, attached to the rail.
    const ux = short ? L / 2 - .48 : 4.58;
    add(G.tor(.060, .016, PI, 6, 12), C.leather, ux, Y + .01, R, 0, HP, 0);
    tube([ux, Y, R + .06], [ux, Y - .17, R + .06], .014, C.leather, 7);
    add(G.cyl(.042, .012, .56, 10), C.gold, ux, Y - .45, R + .06);
    for (const dx of [-.022, .022]) tube([ux + dx, Y - .2, R + .101], [ux + dx * .25, Y - .71, R + .075], .006, '#bc9256', 4);
    add(G.tor(.034, .009, PI * 2, 5, 12), C.leather, ux, Y - .43, R + .06, HP, 0, 0);
    add(G.cone(.010, .045, 6), C.steel2, ux, Y - .75, R + .06, PI, 0, 0);
  }));
  const net = grp(); put(net, 0, rackY + .015, .66); f.add(net);
  net.add(mc('gpt-train-lifting-net-v2', ({ tube }) => {
    for (let k = 0; k <= 10; k++) tube([-1.07 + k * .214, 0, 0], [-1.07 + k * .214, -.23, .025], .009, C.leather, 4);
    for (let k = 0; k < 4; k++) tube([-1.07, -.07 * k, .008 * k], [1.07, -.07 * k, .008 * k], .009, C.leather, 4);
    tube([-1.1, -.23, .025], [1.1, -.23, .025], .017, C.wood, 6);
  }));
  const p = f.part('lift', net, t => { net.rotation.x = -1.18 * t; }, { label: '그물 짐 선반', sfx: 'rustle', dur: .35 });
  f.spot('on', null, .04, rackY + .035, .39, { part: p, maxH: .36, label: '짐 선반 위', scale: 1.0 });
  // Anticipation without sparkles: a striped raccoon tail curls over the net before the luggage moves.
  if (o.tail !== false) {
    const tail = grp(); put(tail, .21, 2.78, .50); f.add(tail); (f.live ||= []).push(tail);
    // The animal silhouette comes directly from the canonical character. Only its attachment pose changes.
    const source = new Char('raccoon'), nativeTail = source.tail;
    nativeTail.removeFromParent(); nativeTail.position.set(0, 0, 0);
    nativeTail.scale.setScalar(source.S); nativeTail.rotation.x = PI;
    nativeTail.traverse(v => { if (v.isMesh) delete v.userData.char; });
    tail.add(nativeTail);
    f.gptTail = tail;
  }
  // The fan stays outside static baking, so it actually turns in the live game.
  const fan = grp(); put(fan, short ? -L / 2 + .75 : -5.15, 2.68, 1.02); f.add(fan); (f.live ||= []).push(fan);
  fan.add(mc('gpt-train-fan-v1', ({ add }) => {
    for (let k = 0; k < 3; k++) {
      const a = k * PI * 2 / 3;
      add(G.box(.39, .028, .13, .045), '#9baea8', Math.cos(a) * .23, 0, Math.sin(a) * .23, 0, -a, .05);
    }
    add(G.sph(.09, 10, 6), C.steel2, 0, 0, 0, 0, 0, 0, [1, .5, 1]);
  }));
  f.tick = t => { fan.rotation.y = t * 1.25; };
  if (o.fix1022) f.add(mc('gpt-train-paper-ad-edges|' + L, ({ add }) => {
    for (let k = 0; k < 12; k++) {
      const x = (k + .5) * (L - .25) / 12 - (L - .25) / 2;
      add(G.box((L - .25) / 12 - .035, .245, .012, .003), C.cream, x, 2.41, .102);
      add(G.box(.105, .038, .012, .002), C.wood, x - .20, 2.52, .118, 0, 0, -.12);
      if (k % 3 === 0) add(G.box(.075, .055, .008, .002), C.cream, x + .39, 2.313, .127, 0, -.32, -.08);
    }
  }));
  // A single face-only ad atlas: no texture wrapping over unrelated sides of a box.
  f.add(sign(L - .25, .24, (c, W, H) => {
    const cols = o.fix1022 ? ['#fef2e1', '#feebc8', '#fefde9', '#f2dcbc', '#fef2e1', '#f6e0bf'] : ['#e7dfcd', '#e5cfbd', '#d3dfce', '#d7dfdf', '#e3d2cf', '#ebe0c4'];
    for (let k = 0; k < 12; k++) {
      const x = k * W / 12, w = W / 12;
      c.fillStyle = C.wood; c.fillRect(x, 0, w, H); c.fillStyle = cols[k % 6]; c.fillRect(x + 1, 6, w - 2, H - 12);
      c.fillStyle = [C.rust, o.fix1022 ? '#84ae9d' : C.seat2, C.leather][k % 3]; c.beginPath(); c.arc(x + w / 2, H * .42, Math.min(w * .23, H * .28), 0, PI * 2); c.fill();
      c.fillRect(x + w * .22, H * .71, w * .56, 5); c.fillRect(x + w * .32, H * .82, w * .36, 3);
    }
  }, 0, 2.41, o.fix1022 ? .112 : .105));
};

// tdoorend2 equivalent, built over Room's real N:'door' opening. It opens into a modelled gangway.
B.gpt_tdoorend2 = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'tdoorend2');
  const DW = 1.09, DH = 2.06;
  if (o.fix1022) f.gptSizeAudit = { doorClearHeight: DH };
  f.add(mc('gpt-train-portal-v3', ({ add, tube }) => {
    // Portal frame: the middle remains empty. Sliding pocket is entirely in front of the wall.
    for (const sx of [-1, 1]) {
      add(G.box(.085, DH + .07, .29, .022), C.steel, sx * .595, DH / 2, .105);
      add(G.box(.023, DH, .025, .006), C.ink, sx * .548, DH / 2, .26);
    }
    add(G.box(1.28, .10, .29, .022), C.steel, 0, DH + .02, .105);
    add(G.box(1.24, .035, .34, .01), C.steel2, 0, .018, .02);
    for (let k = 0; k < 6; k++) add(G.box(1.12, .006, .018, .002), C.ivory, 0, .039, -.10 + k * .05);
    add(G.box(1.18, .235, .07, .03), C.ink, 0, 2.37, .055);
    // Half-height protective pocket panel and clear handle/button fittings.
    add(G.box(1.03, .79, .065, .025), '#d9d3bf', -1.18, .45, .24);
    add(G.box(1.04, .055, .08, .015), C.wood, -1.18, .88, .25);
    tube([.86, .75, .19], [.86, 1.55, .19], .030, C.steel2, 10);
    for (const y of [.76, 1.54]) add(G.box(.10, .055, .10, .012), C.steel, .86, y, .10);
    add(G.box(.19, .24, .065, .025), C.ivory2, .86, .54, .09);
    add(G.cyl(.055, .055, .035, 14), C.rust, .86, .54, .145, HP, 0, 0);
    add(G.box(.23, .32, .07, .025), C.steel, .98, 2.34, .06);
    add(G.box(.155, .10, .015, .012), C.ink, .98, 2.41, .108);
    for (let k = 0; k < 4; k++) add(G.box(.12, .009, .012, .002), C.steel2, .98, 2.31 - k * .025, .109);
    add(G.box(.39, .48, .16, .03), C.rust, -1.85, .48, .08);
    add(G.box(.29, .34, .018, .015), C.cream, -1.85, .5, .173);
    add(G.cyl(.06, .06, .25, 10), '#aa5847', -1.85, .46, .193);
    add(G.box(.08, .04, .055, .008), C.ink, -1.85, .61, .19);
    // Full 1.8m gangway behind the opening: floor, ribs, handrails, rear vestibule and next door.
    add(G.box(1.08, .09, 1.90, .02), '#e8d7b7', 0, -.035, -.90);
    for (const sx of [-1, 1]) {
      add(G.box(.09, 2.04, 1.64, .012), '#a2c8bb', sx * .59, 1.02, -1.06);
      tube([sx * .48, .96, -.25], [sx * .48, .96, -1.70], .021, C.steel2, 8);
      for (let k = 0; k < 7; k++) add(G.box(.10, 2.06, .06, .012), k % 2 ? '#84ae9d' : '#c6c393', sx * .59, 1.03, -.29 - k * .22);
    }
    add(G.box(1.27, .09, 1.65, .015), C.ivory2, 0, 2.06, -1.03);
    for (let k = 0; k < 3; k++) add(G.box(.50, .025, .20, .01), C.cream, 0, 1.998, -.52 - k * .50);
    add(G.box(1.25, 2.10, .075, .015), C.ivory2, 0, 1.03, -1.88);
    add(G.box(.77, 1.83, .04, .02), C.steel2, 0, .925, -1.83);
    add(G.box(.67, 1.74, .035, .02), '#a2c8bb', 0, .93, -1.798);
    add(G.box(.32, .58, .02, .035), '#b0e5e8', 0, 1.28, -1.772);
    add(G.box(.035, .25, .045, .008), C.cream, .22, .85, -1.754);
    for (let k = 0; k < 8; k++) add(G.box(.92, .006, .028, .003), '#a09769', 0, .017, -.25 - k * .20);
  }));
  f.add(sign(1.02, .14, (c, W, H) => { c.fillStyle = C.ink; c.fillRect(0, 0, W, H); c.fillStyle = o.fix1022 ? C.cream : '#f3d899'; fittedTrainText(c, o.fix1022 ? '다음 칸' : '03  →  04', W, H, 66, o.fix1022); }, 0, 2.37, .101));
  const door = grp(); put(door, 0, 0, .285); f.add(door);
  door.add(mc('gpt-train-sliding-door-v3', ({ add, tube }) => {
    // Window opening is geometry, not a painted rectangle covering a solid leaf.
    add(G.box(DW, .92, .065, .025), '#a2c8bb', 0, .48, 0);
    add(G.box(DW, .27, .065, .025), '#a2c8bb', 0, 1.918, 0);
    for (const sx of [-1, 1]) add(G.box(.255, .90, .065, .018), '#a2c8bb', sx * .417, 1.35, 0);
    for (const sx of [-1, 1]) add(G.box(.038, .89, .085, .012), C.steel2, sx * .284, 1.35, .012);
    for (const sy of [-1, 1]) add(G.box(.60, .04, .085, .012), C.steel2, 0, 1.35 + sy * .445, .012);
    tube([.39, .70, .09], [.39, 1.12, .09], .021, C.steel2, 8);
    for (const y of [.70, 1.12]) tube([.39, y, .036], [.39, y, .09], .016, C.steel, 6);
    add(G.box(.31, .10, .014, .012), C.ivory, -.17, .70, .043);
    add(G.box(.18, .017, .014, .004), C.rust, -.17, .70, .057);
    add(G.box(DW - .06, .025, .02, .006), C.steel2, 0, .13, .045);
  }));
  // Near-clear glass keeps the real passage visible from the shut door's window as well.
  const glass = mesh(new THREE.PlaneGeometry(.53, .83), mat('#b0e5e8', { opacity: .14, side: THREE.DoubleSide }), { cast: false });
  put(glass, 0, 1.35, .014); door.add(glass);
  const p = f.part('door', door, (t, b) => { door.position.x = b.p.x - 1.12 * t; }, { label: '연결문', sfx: 'slide', dur: .42 });
  f.spot('inside', null, 0, .035, -.16, { part: p, maxH: .55, label: '연결문 너머', scale: 1.0 });
  const fireSpot = f.spot('on', null, -1.85, .74, .10, { maxH: .20, label: '소화기함 위', scale: .8 });
  fireSpot.reserved = true; // A useful future clue ledge, too small for the automatic phone-size target pool.
};

// tcart2 equivalent. Closed lid covers all food; opened lid exposes a genuine divided bin.
B.gpt_tcart2 = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'tcart2');
  const W = .90, D = .66, Y = .87, TOP = 1.09;
  f.add(mc('gpt-train-snack-cart-v4', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * .44, z = sz * .27;
      tube([x, .13, z], [x, 1.05, z], .024, C.steel, 8);
      add(G.box(.10, .10, .065, .014), C.steel2, x, .105, z);
      add(G.cyl(.065, .065, .055, 12), C.dark, x, .065, z, HP, 0, 0);
      add(G.cyl(.025, .025, .061, 10), C.steel, x, .065, z, HP, 0, 0);
    }
    // Lower storage shelf has a lip, a basket of wrapped buns and a folded serving cloth.
    add(G.box(.86, .035, .60, .012), C.ivory2, 0, .30, 0);
    for (const sx of [-1, 1]) add(G.box(.035, .09, .60, .008), C.steel, sx * .425, .335, 0);
    add(G.box(.83, .09, .03, .008), C.steel, 0, .335, -.29);
    add(G.box(.35, .14, .38, .025), C.wood, -.21, .40, -.02);
    for (let k = 0; k < 3; k++) add(G.box(.31, .012, .014, .003), '#d3b28d', -.21, .36 + k * .036, .18);
    for (const x of [-.29, -.13]) {
      add(G.sph(.075, 10, 6), '#e7c58b', x, .49, -.04, 0, 0, 0, [1, .8, 1.2]);
      add(G.box(.10, .015, .16, .008), C.cream, x, .53, -.04, 0, .1, -.15);
    }
    for (let k = 0; k < 3; k++) add(G.box(.28, .023, .23, .014), k % 2 ? '#d4e1d4' : C.cream, .21, .33 + k * .025, -.12);
    // Empty bin body: bottom, side, rear and front walls, plus one real divider.
    add(G.box(W, .035, D, .016), C.ivory2, 0, Y, 0);
    for (const sx of [-1, 1]) add(G.box(.035, .20, D, .015), C.gold, sx * (W / 2 - .017), .98, 0);
    for (const sz of [-1, 1]) add(G.box(W - .06, .20, .035, .015), C.gold, 0, .98, sz * (D / 2 - .017));
    add(G.box(.025, .16, D - .08, .006), C.ivory2, -.08, .97, 0);
    // Drinks and egg cartons are below the rim; food never intersects a closed lid.
    for (const x of [.09, .25, .35]) {
      add(G.cyl(.047, .052, .12, 10), '#8fa98d', x, .945, -.16);
      add(G.cyl(.025, .025, .035, 8), C.seat2, x, 1.02, -.16);
      add(G.box(.060, .045, .009, .006), C.cream, x, .95, -.105);
    }
    add(G.box(.23, .045, .25, .01), '#c7b397', -.27, .915, -.07);
    for (let k = 0; k < 4; k++) add(G.sph(.044, 8, 6), '#fbf0d7', -.32 + (k % 2) * .10, .957, -.14 + Math.floor(k / 2) * .11, 0, 0, 0, [1, 1.18, 1]);
    add(G.box(.17, .09, .09, .014), '#f1d8a1', -.28, .94, .20);
    for (const x of [-.32, -.23]) add(G.box(.045, .022, .04, .005), C.cream, x, .995, .20);
    // Serving handle attached to both corner posts.
    for (const z of [-.25, .25]) tube([-.43, 1.0, z], [-.60, 1.16, z], .022, C.steel2, 8);
    add(G.box(.39, .115, .018, .016), C.cream, 0, .98, .345);
  }));
  f.add(sign(.33, .078, (c, W, H) => { c.fillStyle = C.cream; c.fillRect(0, 0, W, H); c.fillStyle = o.fix1022 ? '#84ae9d' : C.seat2; fittedTrainText(c, o.fix1022 ? '간식' : 'SNACK', W, H, 65, o.fix1022); }, 0, .98, .36));
  const lid = grp(); put(lid, 0, TOP, -D / 2); f.add(lid);
  lid.add(mc('gpt-train-cart-lid-v3', ({ add, tube }) => {
    add(G.box(W + .07, .055, D + .07, .025), C.ivory, 0, .025, D / 2);
    add(G.box(W - .08, .018, D - .08, .014), '#e3cba0', 0, .061, D / 2);
    for (const sx of [-1, 1]) tube([sx * .08, .06, D / 2], [sx * .08, .12, D / 2], .014, C.steel2, 6);
    tube([-.08, .12, D / 2], [.08, .12, D / 2], .020, C.leather, 8);
    for (const sx of [-1, 1]) add(G.cyl(.026, .026, .14, 10), C.steel, sx * .29, .015, 0, 0, 0, HP);
  }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.55 * t; }, { label: '간식 카트 뚜껑', sfx: 'open', dur: .36 });
  p.lockable = false;
  // The clock-controlled drawer is a separate genuine compartment between the bread basket and the food bin.
  // Its extended slides still overlap the fixed rails at the full .45m stroke.
  f.add(mc('gpt-train-cart-drawer-case-v1', ({ add }) => {
    add(G.box(.87, .035, .46, .010), C.ivory2, 0, .835, .11);
    add(G.box(.87, .026, .46, .008), C.steel2, 0, .585, .11);
    add(G.box(.86, .23, .025, .006), C.ivory2, 0, .71, -.11);
    for (const sx of [-1, 1]) {
      add(G.box(.026, .23, .46, .008), C.ivory2, sx * .422, .71, .11);
      add(G.box(.022, .036, .50, .004), C.steel, sx * .405, .64, .19);
    }
  }));
  const drawer = grp(); put(drawer, 0, .72, .365); f.add(drawer);
  drawer.add(mc('gpt-train-cart-clock-drawer-v1', ({ add, tube }) => {
    add(G.box(.86, .22, .045, .015), C.ivory, 0, 0, .015);
    add(G.box(.74, .13, .014, .012), '#f2dcbc', 0, 0, .047);
    add(G.box(.78, .025, .42, .006), C.ivory2, 0, -.105, -.21);
    for (const sx of [-1, 1]) {
      add(G.box(.024, .16, .42, .006), C.ivory2, sx * .378, -.035, -.21);
      add(G.box(.018, .030, .42, .004), C.steel2, sx * .398, -.075, -.21);
    }
    add(G.box(.78, .16, .024, .006), C.ivory2, 0, -.035, -.408);
    tube([-.11, .015, .095], [.11, .015, .095], .022, C.rust, 8);
    for (const x of [-.11, .11]) tube([x, .015, .054], [x, .015, .095], .014, C.steel2, 6);
  }));
  const dp = f.part('drawer', drawer, (t, b) => { drawer.position.z = b.p.z + .45 * t; }, { label: '간식 카트 서랍', sfx: 'drawer', dur: .42 });
  dp.lockable = true; dp.lockKind = 'code'; dp.noHide = true;
  dp.handle = drawer; dp.gptAuxiliary = 'cart-drawer';
  dp.lockAt = { x: .25, y: 0, z: .075, parent: drawer };
  f.spot('inside', drawer, 0, -.085, -.19, { part: dp, maxH: .18, label: '간식 카트 서랍 안', scale: 1.0 });
  f.gptCartDrawer = drawer;
  f.spot('on', null, .21, .40, .17, { maxH: .30, label: '카트 아래 칸', scale: .95 });
  // The trolley itself can be pushed; lid, rising tray, locks and hiding anchors all travel with it.
  const trolley = grp(); for (const child of [...f.group.children]) trolley.add(child); f.add(trolley);
  const grip = grp(); put(grip, -.60, 1.16, 0); trolley.add(grip);
  grip.add(mc('gpt-train-cart-push-grip-v1', ({ tube }) => tube([0, 0, -.25], [0, 0, .25], .030, C.leather, 10)));
  (f.live ||= []).push(grip);
  const push = f.part('slide', trolley, (t, b) => {
    const k = Math.max(0, Math.min(1, t));
    trolley.position.z = b.p.z + .62 * k * k * (3 - 2 * k);
  }, { label: '간식 카트 밀기', sfx: 'slide', dur: 1.5 });
  push.gptAuxiliary = 'cart-push'; push.handle = grip;
  // Parent tagging runs first, so the lid keeps its own part marker and remains independently tappable.
  f.parts.splice(f.parts.indexOf(push), 1); f.parts.unshift(push);
  if (f.lockAt) f.lockAt.parent = trolley;
  if (o.fix1022) { trolley.scale.y = .81; f.gptSizeAudit = { counterTop: (TOP + .070) * .81 }; }
  f.gptTrolley = trolley;
};

// Sixth train device: crank -> exposed gear and rope drum -> lowered basket -> false bottom / key tray.
// It is an ordinary searchable part, so sound, tweening, padlocks and designer-placed clues use existing game paths.
// noHide keeps a friend out of the small mechanism; the inside spot remains usable for a key or a clue card.
B.gpt_trainpulley = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  const X = -.15, Z = .55, TOP = 2.61, HIGH = 1.91, LOW = .66;
  if (o.fix1022) f.gptSmallAudit = [
    { label: '짐 바구니', width: .65, height: .44, depth: .46 },
    { label: '도르래 손잡이 바퀴', width: .454, height: .454, depth: .255 },
  ];
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  f.add(mc('gpt-train-pulley-frame-v2', ({ add, tube }) => {
    // A slender bolted luggage-lift frame fixed to the end bulkhead, with an overhead beam and twin sheaves.
    for (const x of [-.60, .50]) {
      add(G.box(.075, 2.37, .09, .018), C.steel2, x, 1.45, .11);
      for (const y of [.32, 1.38, 2.57]) {
        add(G.box(.16, .12, .045, .015), C.steel, x, y, .06);
        for (const sx of [-1, 1]) add(G.cyl(.014, .014, .012, 6), C.ink, x + sx * .047, y, .092, HP, 0, 0);
      }
    }
    add(G.box(1.21, .12, .16, .025), C.wood, -.05, 2.67, .14);
    for (const x of [X - .22, X + .22]) {
      tube([x, 2.67, .16], [x, 2.67, Z], .025, C.steel2, 8);
      for (const sx of [-1, 1]) add(G.box(.025, .17, .12, .007), C.steel, x + sx * .066, 2.60, Z);
      add(G.tor(.082, .017, PI * 2, 6, 16), C.gold, x, TOP, Z, 0, HP, 0);
      add(G.cyl(.035, .035, .17, 10), C.steel2, x, TOP, Z, 0, 0, HP);
    }
    // Visible supports, bearings and a simple guide for the power train, rather than a featureless mechanism box.
    for (const [x, y] of [[.40, 1.22], [.25, 1.66], [.25, 2.20]]) {
      add(G.box(.23, .20, .065, .03), C.ivory2, x, y, .15);
      add(G.cyl(.075, .075, .13, 12), C.steel2, x, y, .22, HP, 0, 0);
    }
    tube([.25, 1.79, .22], [.25, 2.09, .22], .034, C.steel2, 8);
    tube([.21, 1.22, .255], [.10, 1.66, .255], .014, C.leather, 6);
    tube([.59, 1.22, .255], [.40, 1.66, .255], .014, C.leather, 6);
    tube([.25, 2.34, .23], [X + .22, 2.61, Z], .010, C.leather, 5);
    tube([.25, 2.34, .23], [X - .22, 2.61, Z], .010, C.leather, 5);
    add(G.box(.82, .09, .11, .02), C.wood, X, .38, .16);
    add(G.box(.69, .04, .44, .015), C.ivory2, X, .43, Z);
  }));
  const crank = grp(); put(crank, .40, 1.22, .30); f.add(crank);
  crank.add(mc('gpt-train-pulley-crank-v1', ({ add, tube }) => {
    add(G.tor(.198, .029, PI * 2, 7, 22), C.rust, 0, 0, 0);
    for (const a of [0, HP, PI, PI + HP]) tube([0, 0, 0], [Math.cos(a) * .19, Math.sin(a) * .19, 0], .019, C.steel, 7);
    add(G.cyl(.058, .058, .09, 12), C.gold, 0, 0, .012, HP, 0, 0);
    tube([.18, 0, .02], [.18, 0, .14], .022, C.steel2, 8);
    add(G.cyl(.035, .035, .13, 10), C.leather, .18, 0, .19, HP, 0, 0);
  }));
  const gear = grp(); put(gear, .25, 1.66, .29); f.add(gear);
  gear.add(mc('gpt-train-pulley-gear-v1', ({ add, tube }) => {
    add(G.tor(.135, .030, PI * 2, 6, 20), C.gold, 0, 0, 0);
    for (let k = 0; k < 12; k++) {
      const a = k * PI * 2 / 12;
      add(G.box(.065, .045, .055, .008), C.gold, Math.cos(a) * .165, Math.sin(a) * .165, 0, 0, 0, a);
      if (k % 3 === 0) tube([0, 0, 0], [Math.cos(a) * .13, Math.sin(a) * .13, 0], .021, C.wood, 6);
    }
    add(G.cyl(.050, .050, .075, 12), C.steel2, 0, 0, .008, HP, 0, 0);
  }));
  const drum = grp(); put(drum, .25, 2.20, .29); f.add(drum);
  drum.add(mc('gpt-train-pulley-drum-v1', ({ add }) => {
    add(G.cyl(.105, .105, .13, 14), C.leather, 0, 0, 0, HP, 0, 0);
    for (const z of [-.07, .07]) add(G.cyl(.14, .14, .025, 14), C.steel, 0, 0, z, HP, 0, 0);
    for (let k = 0; k < 5; k++) add(G.tor(.107, .009, PI * 2, 4, 16), C.gold, 0, 0, -.05 + k * .025);
    add(G.box(.038, .11, .016, .008), C.rust, 0, .071, .091);
  }));
  const ropes = grp(); put(ropes, X, TOP, Z + .082); f.add(ropes);
  ropes.add(mc('gpt-train-pulley-long-ropes-v1', ({ add }) => {
    for (const x of [-.22, .22]) add(G.cyl(.013, .013, 1, 6), C.leather, x, -.5, 0);
  }));
  const basket = grp(); put(basket, X, HIGH, Z); f.add(basket);
  basket.add(mc('gpt-train-pulley-basket-v2', ({ add, tube }) => {
    add(G.box(.65, .045, .43, .015), '#eecfa3', 0, .02, 0);
    for (const sx of [-1, 1]) {
      add(G.box(.035, .32, .43, .012), C.wood, sx * .31, .18, 0);
      for (const z of [-.18, .18]) tube([sx * .28, .34, z], [sx * .22, .40, .082], .015, C.steel2, 6);
      add(G.tor(.035, .011, PI * 2, 5, 12), C.steel, sx * .22, .39, .082);
    }
    for (const z of [-.20, .20]) for (const y of [.10, .23, .33]) add(G.box(.64, .065, .035, .01), y === .33 ? C.wood : '#f2dcbc', 0, y, z);
    for (const sx of [-1, 1]) for (const z of [-.22, .22]) add(G.box(.045, .32, .018, .006), C.steel2, sx * .27, .18, z);
    add(G.box(.27, .11, .018, .014), C.cream, 0, .23, .23);
    add(G.box(.12, .025, .018, .005), C.seat2, 0, .23, .248);
  }));
  const falseBottom = grp(); put(falseBottom, 0, .17, -.19); basket.add(falseBottom);
  falseBottom.add(mc('gpt-train-pulley-false-bottom-v1', ({ add }) => {
    add(G.box(.56, .025, .38, .009), C.wood, 0, .012, .19);
    for (const x of [-.16, 0, .16]) add(G.box(.012, .005, .35, .002), '#a09769', x, .028, .19);
    add(G.tor(.032, .010, PI * 2, 5, 12), C.steel2, 0, .04, .31, HP, 0, 0);
  }));
  const tray = grp(); put(tray, 0, .055, .02); basket.add(tray);
  tray.add(mc('gpt-train-pulley-key-tray-v1', ({ add }) => {
    add(G.box(.49, .025, .25, .012), C.cream, 0, 0, 0);
    for (const sx of [-1, 1]) add(G.box(.023, .06, .25, .006), C.ivory2, sx * .235, .025, 0);
    add(G.box(.49, .06, .023, .006), C.ivory2, 0, .025, -.113);
    add(G.box(.17, .035, .035, .012), C.gold, 0, .025, .15);
  }));
  // One ridiculous forgotten sock rises beside the usable clue tray, rather than occupying its hiding spot.
  const sock = grp(); put(sock, -.18, .07, -.07); basket.add(sock);
  sock.add(mc('gpt-train-pulley-forgotten-sock-v1', ({ add }) => {
    add(G.box(.115, .25, .105, .038, 2), C.rust, 0, .135, 0);
    add(G.box(.20, .10, .12, .04, 2), C.rust, .045, .055, .035);
    add(G.sph(.058, 10, 6), C.cream, .145, .055, .035, 0, 0, 0, [1, .75, 1]);
    add(G.box(.14, .055, .13, .020), C.cream, 0, .255, 0);
    for (const y of [.15, .205]) add(G.box(.12, .025, .115, .010), C.seat2, 0, y, 0);
  }));
  // Nested moving groups must survive the furniture baking pass independently.
  (f.live ||= []).push(falseBottom, tray, sock);
  const p = f.part('wheel', [crank, gear, drum, ropes, basket], t => {
    crank.rotation.z = -PI * 4 * smooth(t / .55);
    gear.rotation.z = PI * 3 * smooth((t - .10) / .45);
    drum.rotation.z = -PI * 3 * smooth((t - .18) / .37);
    const down = smooth((t - .23) / .32);
    basket.position.y = HIGH + (LOW - HIGH) * down;
    ropes.scale.y = TOP - basket.position.y - .40;
    falseBottom.rotation.x = -1.45 * smooth((t - .55) / .24);
    const reveal = smooth((t - .79) / .21);
    tray.position.z = .02 + .18 * reveal; tray.position.y = .055 + .085 * reveal;
    tray.visible = reveal > .001;
    const surprise = smooth((t - .87) / .13);
    sock.visible = surprise > .001; sock.scale.setScalar(Math.max(.035, surprise));
    sock.position.y = .07 + .09 * surprise + Math.sin(surprise * PI) * .045;
    sock.rotation.z = Math.sin(surprise * PI * 2) * .16;
  }, { label: '짐 바구니 도르래', sfx: 'ratchet', dur: 2.9 });
  p.lockable = true; p.lockKind = 'pad'; p.noHide = true;
  p.lockAt = { x: .36, y: 1.18, z: .55 };
  p.chain = ['크랭크', '기어와 로프 드럼', '바구니 하강', '이중 바닥과 열쇠 트레이'];
  p.gptDevice = 'trainpulley'; p.handle = crank;
  p.gptConsequence = { kind: 'lowered-luggage', clue: true, funny: 'mismatched-sock' };
  f.spot('inside', tray, 0, .025, .015, { part: p, maxH: .30, label: '도르래 바구니 이중 바닥', scale: 1.05 });
  f.pulleyChain = { crank, gear, drum, ropes, basket, falseBottom, tray };
  f.gptClue = tray; f.gptFunny = sock;
  p.setOpen(0);
};

// Physical cut section of the vehicle, no toy plinth. It retains the approved slight, occasional car jolt.
B.gpt_tshell = (f, T, o = {}) => {
  const mc = trainMesh(o.fix1022), G = trainGeometry(o.fix1022);
  story(f, 'tshell');
  const L = o.len || 12, CW = o.width || 5;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  const prof = new THREE.Shape();
  prof.moveTo(-.21, -.63); prof.lineTo(-.21, 2.65); prof.quadraticCurveTo(-.21, 3.28, .42, 3.28);
  prof.lineTo(.92, 3.28); prof.lineTo(.92, 3.10); prof.lineTo(.42, 3.10); prof.quadraticCurveTo(-.035, 3.10, -.035, 2.65);
  prof.lineTo(-.035, -.015); prof.lineTo(CW + .05, -.015); prof.lineTo(CW + .05, -.63); prof.closePath();
  const ring = new THREE.ExtrudeGeometry(prof, { depth: .16, bevelEnabled: false, curveSegments: 9 }); ring.rotateY(-HP);
  f.add(mc('gpt-train-car-body-v4|' + L + '|' + CW, ({ add, tube }) => {
    add(G.box(L + .16, .44, CW + .22, .07), C.seat2, 0, -.28, CW / 2 - .03);
    add(G.box(L + .10, .055, CW + .17, .016), C.ivory2, 0, -.03, CW / 2 - .03);
    for (const x of [-L / 2 + .16, L / 2]) add(ring, C.seat2, x, 0, 0);
    // A low cut sill on the near side, with an exterior livery stripe and welded panels.
    add(G.box(L, .39, .12, .025), C.ivory2, 0, -.16, CW + .06);
    add(G.box(L - .1, .095, .035, .008), C.rust, 0, -.12, CW + .139);
    add(G.box(L - .1, .030, .038, .006), C.gold, 0, -.23, CW + .14);
    for (let x = -L / 2 + 1; x < L / 2; x += 2) add(G.box(.02, .27, .025, .004), C.steel2, x, -.19, CW + .14);
    for (const x of [-L / 2 + 1.22, L / 2 - 1.22]) {
      add(G.box(1.64, .24, CW - .90, .04), C.dark, x, -.84, CW / 2);
      for (const dx of [-.50, .50]) {
        tube([x + dx, -.98, .42], [x + dx, -.98, CW - .42], .075, C.steel2, 10);
        for (const z of [.51, CW - .51]) {
          add(G.cyl(.31, .31, .18, 18), C.dark, x + dx, -1.04, z, HP, 0, 0);
          add(G.cyl(.19, .19, .195, 14), '#a09769', x + dx, -1.04, z, HP, 0, 0);
          add(G.cyl(.085, .085, .21, 10), C.steel2, x + dx, -1.04, z, HP, 0, 0);
        }
        for (const z of [.82, CW - .82]) {
          add(G.box(.16, .10, .30, .02), C.steel2, x + dx, -.70, z);
          for (let k = 0; k < 4; k++) add(G.tor(.075, .014, PI * 2, 5, 12), C.dark, x + dx, -.79 + k * .027, z, HP, 0, 0);
        }
      }
    }
    add(G.box(2.6, .31, 1.2, .05), '#a09769', 0, -.70, CW / 2);
    for (let k = 0; k < 7; k++) add(G.box(.15, .20, .025, .006), '#6f4b30', -.9 + k * .30, -.71, CW / 2 + .62);
  }));
  if (o.jolt) {
    let root = null, z0 = 0, y0 = 0, next = 3, active = false;
    f.tick = t => {
      if (!root) { root = f.group; while (root.parent && !root.parent.isScene) root = root.parent; z0 = root.rotation.z; y0 = root.position.y; }
      if (t < next) { if (active) { root.rotation.z = z0; root.position.y = y0; active = false; } return; }
      const k = (t - next) / .55;
      if (k >= 1) { root.rotation.z = z0; root.position.y = y0; active = false; next = t + 7; return; }
      active = true; const e = Math.sin(k * PI * 3) * (1 - k);
      root.rotation.z = z0 + e * .0035; root.position.y = y0 + Math.abs(e) * .006;
    };
  }
};

// A cheap far ring under/around the car. It is a floor furniture piece solely to keep it independent of wall cutaways.
// Layer 2 is colour only (no ID/ink pass); no userData.floor means it does not enlarge the game's camera/pan bounds.
B.gpt_trainworld = (f, T, o = {}) => {
  if (o.fix1022) {
    f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
    const rails = trainMesh(true)('gpt-train-track-only', ({ add }) => {
      add(G.box(3.25, .08, 72, 0), '#e8d7b7', 0, -1.45, 0);
      for (const x of [-1.99, 1.99]) add(G.box(.10, .12, 72, 0), '#a09769', x, -1.35, 0);
      for (let z = -35; z <= 35; z += 1.5) {
        add(G.box(4.60, .11, .20, 0), '#6f4b30', 0, -1.415, z);
        for (const x of [-1.99, 1.99]) add(G.box(.23, .025, .25, 0), '#c6c393', x, -1.345, z);
      }
    });
    rails.layers.set(2); rails.castShadow = rails.receiveShadow = false;
    rails.userData.noOcclude = true; f.add(rails); f.gptRailOnly = true;
    return;
  }
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  const ground = canvasTex(256, 256, (c, W, H) => {
    const g = c.createRadialGradient(W / 2, H / 2, W * .07, W / 2, H / 2, W * .5);
    g.addColorStop(0, 'rgba(198,195,147,.96)'); g.addColorStop(.50, 'rgba(162,200,187,.88)'); g.addColorStop(.78, 'rgba(242,220,188,.38)'); g.addColorStop(1, 'rgba(254,242,225,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  const base = mesh(new THREE.PlaneGeometry(90, 90), basic(ground, { transparent: true, depthWrite: false }), { cast: false, recv: false });
  put(base, 0, -1.51, 0, -HP); base.layers.set(2); base.userData.noOcclude = true; f.add(base);
  const ring = mc('gpt-train-passing-country-v3', ({ add }) => {
    // Rails continue far beyond both cut ends; cross ties and ballast are low-poly and sparsely sampled outside the car.
    add(G.box(3.25, .08, 72, .0), '#c6c393', 0, -1.45, 0);
    for (const x of [-1.99, 1.99]) add(G.box(.10, .12, 72, .0), '#b8b5a5', x, -1.35, 0);
    for (let z = -35; z <= 35; z += 1.5) {
      add(G.box(4.60, .11, .20, .0), '#a09769', 0, -1.415, z);
      for (const x of [-1.99, 1.99]) add(G.box(.23, .025, .25, .0), '#c6c393', x, -1.345, z);
    }
    // Broad field bands, a drainage channel, low hedges and a handful of farmhouse silhouettes.
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 5; k++) add(G.box(3.5, .02, 38, .0), ['#c6c393', '#d9dfbd', '#a2c8bb', '#dedfc4', '#bdd4b5'][k], sx * (5 + k * 3.6), -1.49, k % 2 ? 5 : -5);
      add(G.box(.55, .025, 48, .0), '#b0e5e8', sx * 4.0, -1.46, 0);
      for (let k = 0; k < 6; k++) {
        const z = -25 + k * 10, x = sx * (10 + (k % 3) * 3.0);
        add(G.box(1.7, .70, 1.30, .0), k % 2 ? '#f2dcbc' : '#f6e0bf', x, -1.10, z);
        add(G.box(1.98, .15, 1.55, .0), k % 2 ? '#a2c8bb' : '#eecfa3', x, -.69, z, 0, 0, sx * .10);
        add(G.box(.28, .27, .02, .0), '#b0e5e8', x - .35, -1.08, z + .662);
        add(G.box(.28, .27, .02, .0), '#b0e5e8', x + .35, -1.08, z + .662);
        for (let j = 0; j < 3; j++) add(G.sph(.55, 5, 3), '#a2c8bb', x + sx * 2.4 + j * .65, -1.07, z + .5, 0, 0, 0, [1.0, .8, 1.0]);
      }
    }
  });
  // Use the same merged vertex colours, but avoid lighting, ink and shadows in distant terrain.
  ring.material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }); ring.material.toneMapped = false;
  ring.material.onBeforeCompile = sh => {
    sh.uniforms.gptTrainHaze = { value: new THREE.Color('#fef2e1') };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 gptTrainWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\ngptTrainWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 gptTrainWorld;\nuniform vec3 gptTrainHaze;')
      .replace('#include <opaque_fragment>', 'float distanceToCar=length(gptTrainWorld.xz); float haze=smoothstep(8.0,31.0,distanceToCar); outgoingLight=mix(outgoingLight,gptTrainHaze,haze*.88); diffuseColor.a*=1.0-smoothstep(19.0,40.0,distanceToCar);\n#include <opaque_fragment>');
  };
  ring.material.customProgramCacheKey = () => 'gpttrain-distance-fade-v2-warm';
  ring.layers.set(2); ring.castShadow = ring.receiveShadow = false; ring.userData.noOcclude = true; f.add(ring);
};

export const GPTTRAIN_BUILDERS = B;
// A flat, readable workshop variant. Its gadget code remains the canonical "pulleyhandle" in the story planner.
export const GPTTRAIN_ITEMS = {
  gpt_pulleyhandle: { name: '도르래 손잡이', h: .10, flat: true, build() {
    const item = grp();
    item.add(mc('gpt-train-flat-pulley-handle-v1', ({ add, tube }) => {
      tube([-.28, .052, -.06], [.06, .052, -.06], .021, C.steel2, 10);
      add(G.sph(.025, 10, 6), C.steel, -.28, .052, -.06);
      tube([.06, .052, -.06], [.06, .052, .075], .023, C.steel2, 10);
      tube([.06, .052, .075], [.23, .052, .075], .045, C.rust, 12);
      for (const x of [.06, .23]) add(G.sph(.045, 12, 8), C.rust, x, .052, .075);
      add(G.cyl(.047, .047, .025, 12), C.gold, .065, .052, .075, 0, 0, HP);
    }));
    return item;
  } },
};
export const GPTTRAIN_INFO = {
  gpt_tbench2: { w: 2, d: 1, name: '긴 벤치', hidden: true },
  gpt_twindow2: { wall: true, span: 2, name: '기차 창', hidden: true },
  gpt_trailrack2: { wall: true, span: 12, name: '손잡이 봉과 짐 선반', hidden: true },
  gpt_tdoorend2: { wall: true, span: 5, name: '연결문', hidden: true },
  gpt_tcart2: { w: 1, d: 1, name: '간식 카트', hidden: true },
  gpt_trainpulley: { wall: true, span: 2, name: '짐 바구니 도르래', hidden: true },
  gpt_tshell: { wall: true, span: 12, name: '차체', hidden: true },
  gpt_trainworld: { w: 1, d: 1, name: '기차 밖 들판', hidden: true },
};
