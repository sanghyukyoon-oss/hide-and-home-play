// GPT home architecture: four small roof canopies, never a lid over the whole room.
// Local north is -Z. The roof occupies only the rear 28% of a room; +Z is the clean, open cut-away.
// Same vertex-colour toon material/ink pipeline as house-props.js, one cached mesh per roof.
import * as THREE from 'three';
import { shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
export const GPT_ROOFS = [
  { id: 'gpt_roof_none', name: '지붕 없음', price: 0, ch: 1, sw: ['#f6e0bf', '#e1d5e3'] },
  { id: 'gpt_roof_shingle', name: '도토리 물결 지붕', price: 900, ch: 1, sw: ['#b7aa8c', '#dcc49d', '#a8c8c7'] },
  { id: 'gpt_roof_tile', name: '세이지 기와 지붕', price: 1050, ch: 2, sw: ['#a7b49a', '#d7c7a4', '#c9dac4'] },
  { id: 'gpt_roof_storybook', name: '코랄 동화 지붕', price: 1100, ch: 3, sw: ['#d98d77', '#f0bf9b', '#f4dfb9'] },
  { id: 'gpt_roof_garden', name: '옥상 작은 정원', price: 1450, ch: 4, sw: ['#e2cfaa', '#abc0a0', '#e3a58d'] },
];

const PAL = {
  gpt_roof_shingle: { roof: '#b7aa8c', tile: '#c6b89a', trim: '#e4cba5', wood: '#bd8d5c', dark: '#8f704e', clad: '#f4e5c7' },
  gpt_roof_tile: { roof: '#a0ae95', tile: '#b8c3a8', trim: '#e1d0ab', wood: '#bd996b', dark: '#8f7958', clad: '#f3e6ca' },
  gpt_roof_storybook: { roof: '#d98d77', tile: '#ecad8b', trim: '#f0d4ad', wood: '#bf8c60', dark: '#91684a', clad: '#f6e4c7' },
  gpt_roof_garden: { roof: '#dac7a5', tile: '#e7d9bd', trim: '#f1dfbe', wood: '#c59a69', dark: '#97794f', clad: '#f1e4cb' },
};

// A real little arch, with a flat sill and a soft half-moon top. Shapes lie in XY, depth along Z.
function arch(r, h, bottom = 0) {
  const s = new THREE.Shape();
  s.moveTo(-r, bottom); s.lineTo(r, bottom);
  s.absellipse(0, bottom, r, h, 0, PI, false); s.closePath();
  return s;
}
function archRing(r, h, thick) {
  const s = arch(r, h);
  const hole = new THREE.Path();
  hole.moveTo(-r + thick, thick); hole.lineTo(r - thick, thick);
  hole.absellipse(0, thick, r - thick, h - thick * 1.6, 0, PI, false); hole.closePath();
  s.holes.push(hole); return s;
}

// The rounded, scalloped exposed tile edge is geometry, never a texture wrapped across a roof.
function shingle(w, len, thick, waviness = .025) {
  const s = new THREE.Shape(), hw = w / 2, hl = len / 2;
  s.moveTo(-hw, -hl); s.lineTo(hw, -hl); s.lineTo(hw, hl - waviness);
  s.quadraticCurveTo(hw * .63, hl + waviness, hw * .32, hl - waviness * .1);
  s.quadraticCurveTo(0, hl + waviness * 1.4, -hw * .32, hl - waviness * .1);
  s.quadraticCurveTo(-hw * .7, hl + waviness, -hw, hl - waviness);
  s.closePath();
  const g = G.ext(s, thick, .006, 3);
  g.rotateX(HP); g.translate(0, thick, 0); return g;
}

// Subtract a convex opening from a tile polygon, retaining the real tile fragments around its edge.
// Keeping fragments avoids a coarse rectangular gap when a dormer crosses several shingle courses.
function outsideCut(poly, cut) {
  let inside = poly; const pieces = [];
  for (let k = 0; k < cut.length && inside.length >= 3; k++) {
    const a = cut[k], b = cut[(k + 1) % cut.length], yes = [], no = [];
    const dist = p => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let i = 0; i < inside.length; i++) {
      const p = inside[i], q = inside[(i + 1) % inside.length], dp = dist(p), dq = dist(q);
      (dp >= 0 ? yes : no).push(p);
      if ((dp >= 0) !== (dq >= 0)) {
        const t = dp / (dp - dq), hit = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        yes.push(hit); no.push(hit);
      }
    }
    if (no.length >= 3) pieces.push(no);
    inside = yes;
  }
  return pieces;
}
const polyShape = (points, cos = 1) => {
  const s = new THREE.Shape(); points.forEach(([x, u], i) => i ? s.lineTo(x, u / cos) : s.moveTo(x, u / cos)); s.closePath(); return s;
};

function supportFrame(add, tube, W, zBack, zFront, H, P) {
  // The canopy can also stand in an open room. Posts are inboard of the room-wall planes.
  const x = W / 2 - .14;
  for (const sx of [-1, 1]) for (const z of [zBack + .16, zFront - .16]) {
    add(G.box(.15, H, .15, .025), P.wood, sx * x, H / 2, z);
    add(G.box(.22, .1, .22, .025), P.trim, sx * x, .05, z);
    add(G.box(.2, .11, .2, .02), P.trim, sx * x, H - .045, z);
    // High braces leave a comfortable open passage below the roof.
    tube([sx * x, H - .43, z], [sx * (x - .3), H - .06, z], .044, P.wood, 6);
  }
  add(G.box(W - .12, .15, .17, .025), P.wood, 0, H - .025, zFront - .16);
  add(G.box(W - .12, .15, .17, .025), P.wood, 0, H - .025, zBack + .16);
}

function dormer(add, tube, P, x, z, y, roofColor) {
  const R = .49, H = .34, deep = .62;
  // Hollow curved hood. There is a recess behind the glass, a real floor and rear wall.
  add(G.ext(archRing(R + .075, H + .075, .065), deep, .012, 10), roofColor, x, y, z - deep + .035);
  add(G.ext(arch(R - .02, H - .035), .035, 0, 10), '#719693', x, y + .045, z - deep + .055);
  add(G.box(.86, .05, deep - .06, .012), P.wood, x, y + .027, z - deep / 2 + .03);
  // Pale, recessed blue glass and warm timber mullions; no painted flat black opening.
  add(G.ext(arch(R - .075, H - .075), .018, 0, 10), '#b6d8d4', x, y + .055, z - .105);
  add(G.ext(archRing(R, H, .063), .065, .008, 10), P.wood, x, y, z - .055);
  for (const sx of [-1, 1]) add(G.box(.035, .21, .045, .01), P.wood, x + sx * .18, y + .135, z - .022);
  add(G.box(.9, .04, .06, .012), P.wood, x, y + .055, z - .02);
  // A thick sill finishes the opening. The smaller entrance awning is a separate lower roof below the fascia.
  add(G.box(1.08, .1, .28, .025), P.trim, x, y - .015, z + .075);
}

function pitched(add, tube, id, W, D, H, P) {
  const B = Math.min(1.9, D * .28), zBack = -D / 2 - .12, zFront = -D / 2 + B,
    zc = (zBack + zFront) / 2, half = (zFront - zBack) / 2, rise = Math.min(.61, .35 + half * .22),
    ridge = H + rise + .08, ang = Math.atan2(rise, half), len = Math.hypot(half, rise), totalW = W + .3;
  const story = id === 'gpt_roof_storybook', sage = id === 'gpt_roof_tile';
  const dx = -W * .12, dormU = Math.min(half - .065, .715), dy = ridge - rise * dormU / half + .015,
    cos = Math.cos(ang), slope = rise / half, opening = [[dx - .49, Math.min(half - .015, dormU + .04)]];
  // Follow the curved hood's intersection with the main pitch, instead of cutting a large rectangle.
  for (let k = 0; k <= 14; k++) {
    const x = -.49 + .98 * k / 14, h = .31 * Math.sqrt(Math.max(0, 1 - (x / .49) ** 2));
    opening.push([dx + x, Math.max(.015, (ridge - dy - .06 - h) / slope)]);
  }
  opening.push([dx + .49, Math.min(half - .015, dormU + .04)]);
  supportFrame(add, tube, W, zBack + .12, zFront, H, P);
  // Front slope and its shingles share the same close-fitting curved opening under the dormer.
  for (const side of [-1, 1]) {
    const slab = (x, width, a, b) => {
      if (width < .025 || b - a < .015) return;
      const u = (a + b) / 2;
      add(G.box(width, .11, (b - a) / Math.cos(ang), .018), P.clad, x, ridge - rise * u / half - .09, zc + side * u, side * ang);
    };
    if (side < 0) slab(0, totalW, 0, half);
    else {
      const panel = polyShape([[-totalW / 2, 0], [totalW / 2, 0], [totalW / 2, half], [-totalW / 2, half]], cos);
      const hole = new THREE.Path(); opening.forEach(([x, u], i) => i ? hole.lineTo(x, u / cos) : hole.moveTo(x, u / cos)); hole.closePath();
      panel.holes.push(hole);
      const g = G.ext(panel, .11, 0, 3); g.rotateX(HP);
      add(g, P.roof, 0, ridge - .045, zc, ang);
    }
    // Four/five shingle courses: generous pieces, relief, tiny warm colour variation.
    const rows = sage ? 4 : 5, cols = Math.max(9, Math.round(totalW / (sage ? .38 : .42))), tw = totalW / cols;
    for (let r = 0; r < rows; r++) {
      const a = half * r / rows, b = half * (r + 1) / rows, u = (a + b) / 2;
      for (let c = 0; c < cols; c++) {
        const x = -totalW / 2 + (c + .5) * tw, tileLen = (b - a) / Math.cos(ang) + .045;
        const color = (c + r * 3) % 7 === 0 ? shade(P.tile, .04) : (c + r) % 3 === 0 ? P.tile : P.roof;
        const y = ridge - rise * u / half + .012 + (rows - r) * .005;
        const nearDormer = side > 0 && Math.abs(x - dx) < .49 + tw * .6;
        if (nearDormer) {
          const hw = (tw + .018) / 2, du = tileLen * cos / 2, wav = (story ? .035 : .026) * cos;
          const polygon = sage ? [[x - hw, u - du], [x + hw, u - du], [x + hw, u + du], [x - hw, u + du]] :
            [[x - hw, u - du], [x + hw, u - du], [x + hw, u + du - wav], [x + hw * .65, u + du + wav * .25],
              [x + hw * .32, u + du], [x, u + du + wav * .6], [x - hw * .32, u + du], [x - hw * .65, u + du + wav * .25], [x - hw, u + du - wav]];
          const fragment = (poly, thick, lift, c) => {
            for (const part of outsideCut(poly, opening)) {
              const g = G.ext(polyShape(part, cos), thick, 0, 2); g.rotateX(HP);
              add(g, c, 0, ridge + lift, zc, ang);
            }
          };
          fragment(polygon, .047, .058 + (rows - r) * .006, color);
          if (sage) {
            const sx = x - tw * .43;
            fragment([[sx - .035, u - du], [sx + .035, u - du], [sx + .035, u + du], [sx - .035, u + du]], .065, .105 + (rows - r) * .006, shade(color, .045));
          }
        } else if (sage) {
          // Broad pan tiles with raised tubular seams; the front lip turns gently upward.
          add(G.box(tw + .016, .055, tileLen, .024), color, x, y, zc + side * u, side * ang);
          add(G.cyl(.043, .043, tileLen, 8), shade(color, .045), x - tw * .43, y + .039, zc + side * u, HP + side * ang);
        } else add(shingle(tw + .018, tileLen, .047, story ? .035 : .026), color, x, y, zc + side * u, side * ang, side < 0 ? PI : 0);
      }
    }
    // Thick, light fascia and finished cut edges: the underside reads as timber, never a black wedge.
    add(G.box(totalW + .06, .13, .13, .035), P.wood, 0, H - .015, zc + side * (half + .035));
    add(G.box(totalW + .08, .07, .09, .025), P.trim, 0, H + .095, zc + side * (half + .065));
    for (const sx of [-1, 1]) {
      add(G.box(.13, .15, len + .12, .025), P.wood, sx * (totalW / 2 + .015), ridge - rise / 2 - .055, zc + side * half / 2, side * ang);
      add(G.box(.15, .055, len + .14, .022), P.trim, sx * (totalW / 2 + .02), ridge - rise / 2 + .065, zc + side * half / 2, side * ang);
    }
  }
  // Rounded ridge caps run parallel to the back wall, with a proper raised end tile.
  const caps = Math.max(10, Math.round(totalW / .32)), cw = totalW / caps;
  for (let k = 0; k < caps; k++) add(G.cyl(.105, .105, cw + .025, 10), k % 3 === 0 ? P.tile : shade(P.roof, .06), -totalW / 2 + (k + .5) * cw, ridge + .075, zc, 0, 0, HP);
  for (const sx of [-1, 1]) {
    add(G.cyl(.127, .127, .08, 12), P.trim, sx * (totalW / 2 + .035), ridge + .075, zc, 0, 0, HP);
    if (sage) add(G.sph(.105, 10, 7), P.tile, sx * (totalW / 2 + .04), ridge + .17, zc, 0, 0, 0, [1, 1.35, .75]);
  }
  dormer(add, tube, P, dx, zc + dormU, dy, story ? P.roof : P.tile);
  // A separate little entrance canopy sits beneath the main eave, with two visible timber brackets.
  const ay = H - .29, az = zFront + .015;
  add(G.box(1.16, .08, .28, .025), P.wood, dx, ay, az, .16);
  for (let k = 0; k < 5; k++) add(shingle(.235, .29, .035, .015), k % 2 ? P.tile : P.roof, dx + (k - 2) * .23, ay + .065, az, .16);
  for (const sx of [-1, 1]) {
    add(G.box(.065, .34, .065, .014), P.wood, dx + sx * .42, H - .16, az - .11);
    tube([dx + sx * .42, ay - .19, az - .11], [dx + sx * .42, ay - .04, az + .09], .032, P.wood, 5);
  }
  if (story) {
    // Small brick chimney, three warm courses and an open cap: recognizable at phone size.
    const cx = W * .3, cz = zc - half * .25, cy = ridge - rise * .25;
    add(G.box(.35, .64, .34, .025), '#e0b397', cx, cy + .23, cz);
    for (let k = 0; k < 3; k++) add(G.box(.365, .027, .355, .008), '#f1d5b6', cx, cy + .04 + k * .17, cz);
    for (const s of [-1, 1]) add(G.box(.49, .1, .1, .02), P.trim, cx, cy + .59, cz + s * .19);
    for (const s of [-1, 1]) add(G.box(.1, .1, .28, .02), P.trim, cx + s * .195, cy + .59, cz);
    add(G.box(.27, .025, .26, .008), '#967259', cx, cy + .53, cz);
  }
  return { B, zc, zFront, ridge };
}

function garden(add, tube, W, D, H, P) {
  const B = Math.min(1.9, D * .28), zBack = -D / 2 - .1, zFront = -D / 2 + B, zc = (zBack + zFront) / 2,
    deckY = H + .17;
  supportFrame(add, tube, W, zBack + .1, zFront, H, P);
  // A deep, layered terrace, not a paper-thin floating slab.
  add(G.box(W + .3, .22, B + .22, .045), P.wood, 0, H + .015, zc);
  add(G.box(W + .36, .09, B + .28, .03), P.trim, 0, H + .11, zc);
  add(G.box(W + .2, .06, B + .13, .025), P.roof, 0, deckY - .025, zc);
  const boards = Math.max(10, Math.round((W + .2) / .38)), step = (W + .2) / boards;
  for (let k = 0; k < boards; k++) add(G.box(step - .018, .025, B + .09, .008), k % 3 ? P.tile : '#e3d1af', -W / 2 - .1 + (k + .5) * step, deckY + .012, zc);
  // Low rear/side parapet, open front: the player can read the whole little garden.
  const parapet = '#e9d9b9';
  add(G.box(W + .22, .37, .14, .035), parapet, 0, deckY + .17, zBack - .02);
  add(G.box(W + .28, .075, .2, .028), P.trim, 0, deckY + .375, zBack - .02);
  for (const sx of [-1, 1]) {
    add(G.box(.14, .37, B + .12, .035), parapet, sx * (W / 2 + .07), deckY + .17, zc);
    add(G.box(.2, .075, B + .16, .03), P.trim, sx * (W / 2 + .07), deckY + .375, zc);
  }
  // Back corner planter: open soil, thick rim, three friendly broad-leaved shrubs.
  const px = -W * .28, pz = zBack + .36, pw = Math.min(1.25, W * .3);
  add(G.box(pw, .27, .5, .04), '#dcae8e', px, deckY + .135, pz);
  add(G.box(pw - .1, .035, .4, .012), '#a88b65', px, deckY + .28, pz);
  for (const s of [-1, 1]) add(G.box(pw + .05, .065, .075, .02), '#f0c5a2', px, deckY + .3, pz + s * .23);
  for (const s of [-1, 1]) add(G.box(.075, .065, .4, .02), '#f0c5a2', px + s * pw / 2, deckY + .3, pz);
  for (let k = 0; k < 3; k++) {
    const x = px + (k - 1) * pw * .27;
    tube([x, deckY + .27, pz], [x, deckY + .67 + (k % 2) * .12, pz], .022, '#96a078', 5);
    for (let n = 0; n < 4; n++) {
      const a = n * 2.4 + k, yy = deckY + .42 + n * .075;
      add(G.sph(.14, 8, 6), n % 2 ? '#b5c39b' : '#95b18d', x + Math.cos(a) * .08, yy, pz + Math.sin(a) * .08, 0, a, .5, [1.15, .75, .8]);
    }
  }
  // A slatted bench and folded cushion leave the front half free for a hidden treasure.
  const bx = W * .24, bz = zBack + .47, bw = Math.min(1.35, W * .31);
  for (const sx of [-1, 1]) add(G.box(.12, .32, .38, .02), P.wood, bx + sx * (bw / 2 - .13), deckY + .16, bz);
  for (let k = 0; k < 3; k++) add(G.box(bw, .07, .13, .02), k % 2 ? P.trim : P.tile, bx, deckY + .35, bz + (k - 1) * .145);
  add(G.box(bw + .04, .27, .08, .025), P.wood, bx, deckY + .51, bz - .23);
  add(G.box(.44, .09, .32, .04), '#b8c6ad', bx - bw * .22, deckY + .43, bz + .015);
  // A watering can with a real loop handle and an angled spout, kept bigger than a tiny detail speck.
  const wx = -W * .1, wz = zFront - .35;
  add(G.cyl(.105, .13, .22, 10), '#91b8ac', wx, deckY + .115, wz);
  add(G.tor(.13, .027, PI * 1.6, 5, 12), '#81a99c', wx - .11, deckY + .15, wz, 0, HP, -.55);
  tube([wx + .09, deckY + .08, wz], [wx + .27, deckY + .24, wz], .035, '#91b8ac', 6, .05);
  add(G.sph(.06, 8, 5), '#bad2bd', wx + .28, deckY + .245, wz, 0, 0, -.8, [1.1, .45, 1]);
  // Short fence across only the rear third, giving the plants a delicate climbing trellis.
  for (let k = 0; k < 5; k++) add(G.box(.045, .55, .04, .01), P.wood, px - pw / 2 + k * pw / 4, deckY + .56, zBack + .09);
  for (let k = 0; k < 2; k++) add(G.box(pw + .08, .045, .04, .01), P.wood, px, deckY + .48 + k * .27, zBack + .09);
  return { B, zc, zFront, deckY };
}

/**
 * Full-room coordinates, at floor y=0. turn is a quarter turn (same +Y convention as furniture).
 * Width/depth swap BEFORE construction at odd turns, so rectangular rooms still get a full-width rear band.
 * theme.wallH may override room.js's default 2.5 m wall top.
 * userData.gptRoofSpots is in this group's LOCAL coordinates: f.spot(s.kind, roof, s.x,s.y,s.z, s).
 * userData.gptRoofColumns contains local floor rectangles; transform through this group for placement/collision.
 */
export function makeGptRoof(id, w, d, theme = {}, turn = 0) {
  if (!id || id === 'gpt_roof_none') return null;
  const root = new THREE.Group(); root.name = id;
  const n = ((Math.round(turn) % 4) + 4) % 4;
  root.rotation.y = n * HP;
  root.userData.gptRoof = id;
  root.userData.gptRoofSpots = [];
  root.userData.gptRoofColumns = [];
  if (!PAL[id] || !Number.isFinite(w) || !Number.isFinite(d) || w < 2 || d < 2) return root;
  const W = n % 2 ? d : w, D = n % 2 ? w : d, H = Number.isFinite(theme.wallH) ? theme.wallH : 2.5,
    P = PAL[id], isGarden = id === 'gpt_roof_garden';
  // Every input affecting geometry is included: changing room size or wall height cannot reuse a stale roof.
  const key = ['gptroof-v2', id, W, D, H].join('|');
  root.add(mc(key, ({ add, tube }) => { if (isGarden) garden(add, tube, W, D, H, P); else pitched(add, tube, id, W, D, H, P); }));
  // mc's closure does not run on cache hits. Keep metadata independent of geometry generation.
  const B = Math.min(1.9, D * .28), zFront = -D / 2 + B, zc = (-D / 2 + zFront) / 2;
  for (const sx of [-1, 1]) for (const z of [-D / 2 + .16, zFront - .16]) {
    root.userData.gptRoofColumns.push({ x: sx * (W / 2 - .14), z, w: .22, d: .22 });
  }
  root.userData.gptRoofSpots.push({ x: W * .24, y: .025, z: zc + .12, kind: 'under', label: '지붕 아래', maxH: .62, scale: 1 });
  if (isGarden) root.userData.gptRoofSpots.push({ x: W * .27, y: H + .2, z: zFront - .36, kind: 'on', label: '옥상 벤치 앞', maxH: .45, scale: .9 });
  root.userData.gptRoofCoverage = { depth: B, fraction: B / D, front: zFront, wallHeight: H };
  return root;
}
