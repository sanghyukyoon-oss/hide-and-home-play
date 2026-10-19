// 룩 레벨업 실험 (2026-10-19, sumbak-look; canonical untouched): one map — 22판 우리 동네 골목 ('street') — brought toward
// concept G (art/concepts/G-street-corner.png). Four layers, each its own switch:
//   light — the chapter's own light colour and sky (a sky gradient instead of the white glow every map had). The sun
//           stays where the game always had it (high, over the camera's shoulder): a low afternoon sun threw long
//           shadows across the floors and the user found them messy (10/19, "그림자가 길어지니까 지저분함")
//   ring  — the map no longer floats: the ground, the roads and the opposite sidewalks run on past the edges, and the
//           home street's own houses and trees stand behind the walls. Tall pieces fold away on the camera's side,
//           like the walls do, so they never stand between the camera and the room
//   fill  — small things that are not to be found (pots, styrofoam planters, a rubber tub, bags) on the empty pavement
//           and the wall tops, kept away from every hidden thing
//   glow  — at night, pools of lamp light on the ground under the lamps, the shop and the vending machines (painted
//           discs, no real lights: next to nothing for a phone)
// ?look=0 turns everything off (the map as it was); ?look=light,ring picks layers. Only maps with a recipe change.
import * as THREE from 'three';
import { put, rbox, mat, shade } from './gfx/kit.js';
import { reindexExact } from './gfx/bake.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFurniture, FURN_INFO } from './gfx/furniture.js';
import { HOUSE_KIT } from './scenes/home.js';
import { THEMES } from './stages.js';
import { groundTex } from './gfx/outdoor.js';

const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const RAW = QS.get('look');
export const LOOK = new Set(RAW === '0' ? [] : (RAW && RAW !== '1' ? RAW : 'light,ring,fill,glow,items').split(','));
const HP = Math.PI / 2;

// ── recipes ─────────────────────────────────────────────────────────────────────────────────────────────────────
// map coordinates: x across (W wall at -w/2), z deep (N wall at -d/2); the camera starts on the +x +z side
const RECIPES = {
  street: {
    // late afternoon: a low golden sun from the camera's left, a cool soft fill so the shaded sides go a little blue
    light: { ambColor: '#ece6f2', amb: 1.12, sunColor: '#ffdcb0', sun: 2.6, shadow: .62 },
    sky: ['#a9d4ee', '#ffe3c4', '#e9c3a8'],
    // night (27판 street:night): moonlight as before, a deep sky, the lamps doing the rest
    night: { light: { ambColor: '#9fa8f0', amb: .9, sunColor: '#c4ccff', sun: .7, shadow: .5 }, sky: ['#141a46', '#2c2f6e', '#3d3a78'] },
    // the ground past the edges: sidewalk everywhere, the front road running on to the east, a cross street to the south
    ground: { size: 26, fade: [5.5, 9.5], walk: ['#e7e1d8', '#d6cdc1'],
      roads: [{ x0: 4, x1: 14, z0: 1.5, z1: 3.5 }, { x0: 2, x1: 4, z0: 3.5, z1: 14 }],
      curbs: [{ x0: -4, x1: 2, z: 3.5, dir: 'z' }, { x0: 4, x1: 13, z: 3.5, dir: 'z' }, { z0: -3.5, z1: 1.5, x: 4, dir: 'x' }, { z0: 3.5, z1: 13, x: 4, dir: 'x' }, { z0: 3.5, z1: 13, x: 2, dir: '-x' }],
      zebra: [{ x0: 2.15, x1: 3.85, z: 4.2, dir: 'x' }, { z0: 1.7, z1: 3.3, x: 4.75, dir: 'z' }] },
    // behind the walls: the home street's houses (front toward the map), trees between them, an apartment block
    ring: [
      { house: 'bear', x: -2.15, back: 'N' }, { house: 'cat', x: 1.35, back: 'N' },
      { furn: 'aptwall', theme: 'playground', x: 3.7, z: -5.1, ry: 0, s: 1.25 },
      { house: 'bunny', z: -1.35, back: 'W' }, { house: 'peng', z: 2.1, back: 'W' },
      { tree: 3, x: -4.75, z: -4.55, s: 1.15 }, { tree: 5, x: -5.6, z: -3.6, s: .95 }, { tree: 7, x: -.25, z: -4.75, s: .9 }, { tree: 9, x: -5.0, z: .4, s: .9 },
      // across the front road (the camera's side at the start: low things stay, tall ones fold away)
      { furn: 'bush', x: -6.2, z: 4.3 }, { furn: 'trashbags', x: -5.5, z: 4.45, ry: .4, s: .9 }, { furn: 'bench', x: -4.1, z: 4.45, ry: Math.PI },
      { hedge: 2.4, x: -1.75, z: 4.45, ry: 0 }, { furn: 'planter', theme: 'playground', x: .75, z: 4.4, ry: 0 },
      // the front yards of the houses over the road: low hedges with a gap for each gate
      { hedge: 2.8, x: -4.6, z: 5.75, ry: 0 }, { hedge: 1.2, x: -2.4, z: 5.75, ry: 0 }, { hedge: 1.6, x: .3, z: 5.75, ry: 0 },
      // across the side street
      { furn: 'aircon', x: 4.7, z: -2.9, ry: -HP }, { furn: 'bench', x: 5.0, z: -1.6, ry: -HP }, { hedge: 1.5, x: 4.85, z: .55, ry: HP },
      { hedge: 2.6, x: 6.15, z: -2.2, ry: HP }, { hedge: 1.4, x: 6.15, z: .6, ry: HP },
      // the corner block over both roads
      { furn: 'hydrant', x: 4.45, z: 4.0 }, { furn: 'cones', x: 5.9, z: 2.9, s: .9 }, { furn: 'boxstack', x: 6.7, z: 4.45, ry: .3, s: .9 }, { furn: 'bike', x: 8.3, z: 4.5, ry: .2 },
      { hedge: 2.6, x: 7.3, z: 5.75, ry: 0 },
      // tall: over the roads (fold away while the camera is on their side)
      { house: 'mong', x: -1.6, back: 'S' }, { house: 'bunny', x: 7.4, back: 'S' },
      { house: 'bear', z: -1.2, back: 'E' }, { tree: 11, x: 6.4, z: -4.6, s: 1 }, { tree: 13, x: -4.4, z: 6.6, s: .95 }, { tree: 15, x: 5.6, z: 6.6, s: .9 },
    ],
    // small things that are not to be found, on the free pavement and the tops of the walls
    fill: [
      { furn: 'trashbags', x: -2.45, z: -2.05, ry: .5, s: .8 },        // by the konbini door
      { furn: 'parcel', x: .55, z: -2.15, ry: .4, s: .8 },             // in front of the vending machines
      { furn: 'plant', x: -2.45, z: -1.0, s: .7 },                     // beside the tteokbokki stall
      { furn: 'daeya', x: 1.55, z: -.95, s: .85 },                     // a rubber tub by the lamp
      { furn: 'plant', x: 1.55, z: .05, s: .65 },
      { furn: 'recyclebins', theme: 'playground', x: 3.0, z: -3.05, ry: 0, s: .85 },   // the dead end of the side road
      { furn: 'garden', x: -1.0, z: -3.1, ry: 0, s: .7 },               // a styrofoam planter against the wall, by the vending machines
    ],
    // night pools of light: [x, z, radius, colour]
    glows: [[1.5, -1.6, 2.3, '#ffd27a'], [-2.0, -2.0, 2.0, '#fff0c0'], [-.5, -2.4, 1.3, '#a8dcff'], [.5, -2.4, 1.3, '#a8dcff'], [-3.0, -.5, 1.7, '#ffae5e'],
      [3.0, 2.5, 1.6, '#ffd27a'], [-1.0, .9, 1.3, '#ffe6b0']],
  },
};

// ── 1~10판 (10/19, user: "오늘 1~10 스테이지 반복적으로"): every room its own light mood and its own backdrop instead of
// the one white glow; the fishing ground no longer floats. Backdrops are mid-value and a little greyed so the light
// rooms stand out of them (a room is the brightest thing on screen, the backdrop frames it — not a glow behind it).
const TREE = (tree, x, z, s = 1) => ({ tree, x, z, s });
Object.assign(RECIPES, {
  // 토순이네 침실 (1·2판, the first thing anyone sees): soft morning light from the window side, dusty-rose backdrop
  bunny: {
    light: { ambColor: '#f4eef6', amb: 1.32, sunColor: '#fff0dc', sun: 2.5, shadow: .62 },
    sky: ['#ecc9c4', '#f3d9cf', '#dfb7aa'],
  },
  // 펭펭이네 다락방 (4판, 흑백): a cool attic, slate-lilac backdrop (the grey stage keeps its own colour game)
  peng: {
    light: { ambColor: '#eef0fa', amb: 1.3, sunColor: '#fff4e4', sun: 2.45, shadow: .62 },
    sky: ['#cfd5ec', '#dde2f2', '#bfc6e0'],
  },
  // 곰돌이네 거실 (5판) and 곰돌이네 집 (6판): warm afternoon, sage backdrop against the orange floor
  bear: {
    light: { ambColor: '#f0e8ee', amb: 1.24, sunColor: '#ffe2b8', sun: 2.6, shadow: .62 },
    sky: ['#d5dfbf', '#e3e9d0', '#c4cfa9'],
  },
  // 2층집 (7판) · 3층집 (8판): a house standing outdoors — late-afternoon sky above, warm ground below
  house2f: {
    light: { ambColor: '#ece6f2', amb: 1.18, sunColor: '#ffdcb0', sun: 2.6, shadow: .62 },
    sky: ['#a9d4ee', '#f6e4cf', '#dcc4ad'],
  },
  // 토순이네 욕실 밤 (9판): a deep night with no white glow behind it
  bunnybath: {
    light: { ambColor: '#f4eef6', amb: 1.32, sunColor: '#fff0dc', sun: 2.5, shadow: .62 },
    sky: ['#ecc9c4', '#f3d9cf', '#dfb7aa'],
    night: { light: { ambColor: '#9ea6ec', amb: .86, sunColor: '#c9d1ff', sun: .62, shadow: .5 }, sky: ['#151a45', '#25286a', '#33316f'] },
  },
  // 미술관 (10판, 흑백): a gallery's quiet lilac-grey
  museum: {
    light: { ambColor: '#f2eef6', amb: 1.3, sunColor: '#fff6ea', sun: 2.4, shadow: .62 },
    sky: ['#ddd6e8', '#e8e2f0', '#cdc4dc'],
  },
  // 개굴이의 낚시터 (3판): a clear day; the meadow runs on past the hedge and the fence into a wood, nothing floats
  fishing: {
    light: { ambColor: '#eef4f4', amb: 1.3, sunColor: '#fff4dc', sun: 2.55, shadow: .62 },
    sky: ['#a8d8f0', '#e3f3e8', '#bfdca5'],
    ground: { size: 26, fade: [5, 9.5], seamless: true },   // the map's own grass, running on and fading out, no line at the map's edge
    ring: [
      // behind the hedge (N) and the fence (W): one wood edge, a few big trees further back
      TREE(3, -2.4, -4.4, 1.1), TREE(5, 1.0, -4.6, 1.2), TREE(9, -4.7, -4.5, 1.15), TREE(13, 3.6, -4.4, 1.05),
      TREE(11, -.6, -6.6, 1.5), TREE(17, 3.4, -6.4, 1.4),
      TREE(19, -4.8, -1.4, 1.1), TREE(21, -4.9, 1.8, 1.05), TREE(23, -6.8, .4, 1.45),
      { furn: 'bush', x: -4.3, z: .2 }, { furn: 'bush', x: -1.2, z: -3.9 }, { furn: 'bush', x: 2.3, z: -3.95 },
      // the open sides (the camera's at the start): low meadow things stay, trees further out fold away
      { furn: 'bush', x: -2.6, z: 3.8 }, { furn: 'rock', x: .3, z: 3.8, ry: .5 }, { furn: 'mushrooms', x: 1.4, z: 3.75 },
      // the pond's stream runs on out of the map: two more reaches and a little bridge over it
      { furn: 'stream', x: -.85, z: 3.55 }, { furn: 'bridge', x: -.85, z: 4.55 }, { furn: 'stream', x: -.85, z: 5.55 }, { furn: 'stream', x: -.85, z: 6.55 },
      { furn: 'rock', x: 4.15, z: -1.4, ry: 1.2 }, { furn: 'bush', x: 4.2, z: 1.0 }, { furn: 'reeds', x: 4.3, z: 2.7 },
      TREE(27, -3.0, 5.8, 1.15), TREE(31, 5.4, 5.0, 1.15), TREE(33, 6.0, -.6, 1.25),
    ],
  },
});
// 6~9판 show a whole house at once: their things were 7–15 px on a phone at the start view (rooms 1–5: 15–30 px),
// so things on these maps are drawn to ~38 cm instead of ~28 (still only as big as the spot has room for). ?look=…
// without 'items' keeps the old size.
RECIPES.bear2 = { ...RECIPES.bear, itemSize: .38 };
RECIPES.bunnybath.itemSize = .38;
// the houses (7·8판) stand in a yard: lawn running on, hedges and a stepping-stone path to the door, trees round
RECIPES.house2f.ground = { size: 26, fade: [4.5, 9], kind: 'grass', T: { grass: '#a6d784' } };
RECIPES.house2f.ring = [
  TREE(3, -2.8, -5.3, 1.2), TREE(5, .7, -5.7, 1.35), TREE(7, 3.9, -5.1, 1.15), TREE(9, -5.4, -4.4, 1.2),
  TREE(11, -5.8, -1.6, 1.25), TREE(13, -5.9, 2.2, 1.15), { hedge: 6.4, x: -4.6, z: .2, ry: HP },
  { hedge: 2.3, x: -2.4, z: 4.7, ry: 0 }, { hedge: 2.3, x: 2.4, z: 4.7, ry: 0 }, { stones: [0, 3.8, 6.2] },
  { furn: 'planter', theme: 'playground', x: -2.4, z: 5.5, ry: 0 }, { furn: 'bush', x: -4.4, z: 4.6 }, { furn: 'bush', x: 4.5, z: 4.4 },
  { hedge: 6.4, x: 4.6, z: .2, ry: HP }, { furn: 'bush', x: 4.8, z: -3.8 },
  TREE(15, -4.6, 6.3, 1.1), TREE(17, 5.4, 6.0, 1.15), TREE(19, 6.2, -1.0, 1.2),
];
RECIPES.house2f.itemSize = .38;
RECIPES.house3 = RECIPES.house2f;
// (22·27판 골목 'street': waits for the user's art sign-off — 10/19 "22판 골목 룩 … 빼고"; sumbak-look keeps it)
delete RECIPES.street;

export function lookRecipe(room, spec) {
  if (!LOOK.size || spec?.custom) return null;
  return RECIPES[room] || null;
}

// ── light and sky (stage.enter, before the room is built) ──────────────────────────────────────────────────────
// returns the theme with the look's light and background, so every later light change (lights on at a night stage's
// end) goes back to the look's day, not the house light
export function lookTheme(R, th) {
  if (!R || !LOOK.has('light')) return th;
  return { ...th, light: R.light, bg: [R.sky[1], R.sky[2]], sky: R.sky };
}
// The backdrop is drawn twice: as the page's CSS (what shows while the scene changes) and inside the 3D canvas as the
// scene's background, so the canvas is opaque. A see-through canvas let the browser lay the page under the faded edges
// (the floor running off past the walls), and those half-clear pixels came out over-bright: the pale halo under every
// room, in the old look too. The post pass already leaves the background out of the outline IDs.
let SKY_TEX = null;
export function setSky(sky) {
  const app = document.getElementById('app'), W = typeof G !== 'undefined' ? G.world : null;
  if (SKY_TEX) { if (W && W.scene.background === SKY_TEX) W.scene.background = null; SKY_TEX.dispose(); SKY_TEX = null; }
  if (!sky) { app?.classList.remove('look-sky'); W?.dirty?.invalidate(); return; }
  if (app) { app.style.setProperty('--skyA', sky[0]); app.style.setProperty('--skyB', sky[1]); app.style.setProperty('--skyC', sky[2]); app.classList.add('look-sky'); }
  if (W) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, sky[0]); g.addColorStop(.42, sky[1]); g.addColorStop(1, sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    // a soft vignette (the corners settle, the middle where the room stands stays open) and a faint paper grain
    const v = x.createRadialGradient(128, 230, 60, 128, 260, 330);
    v.addColorStop(0, 'rgba(40,20,50,0)'); v.addColorStop(1, 'rgba(40,20,50,.13)');
    x.fillStyle = v; x.fillRect(0, 0, 256, 512);
    let sd = 3; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { x.fillStyle = R() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(60,30,60,.045)'; x.fillRect(R() * 256, R() * 512, 1, 1); }
    SKY_TEX = new THREE.CanvasTexture(c); SKY_TEX.colorSpace = THREE.SRGBColorSpace; SKY_TEX.minFilter = THREE.LinearFilter;
    W.scene.background = SKY_TEX; W.dirty?.invalidate();
  }
}

// ── the map's surroundings (after the room and its hidden things are placed) ───────────────────────────────────
export class Look {
  constructor(stage, R) {
    this.stage = stage; this.R = R; this.W = stage.G.world;
    this.group = new THREE.Group(); this.group.name = 'look';
    this.tall = [];        // { o, dir, k, sy } — pieces that fold on the camera's side
    this.own = [];         // materials and textures made here (freed on exit)
    this.room = stage.room;
    this.isMap = !!stage.room.rooms;   // a house of several rooms: everything is laid out round its middle
    if (this.isMap) { const c = stage.room.center; this.group.position.set(c.x, 0, c.z); }
    const th = stage.th;
    this.T = th;
    const ring = LOOK.has('ring') && R.ground;
    if (ring) this.buildGround();
    else if (LOOK.has('light') && R.sky) this.tintAprons();
    if (LOOK.has('light') && R.sky && R.shadow !== false) this.contactShadow(ring);
    if (LOOK.has('light')) this.clipSunPatches();
    if (LOOK.has('light') && R.sky) this.toneWalls();
    if (LOOK.has('ring') && R.ring) this.buildRing();
    if (LOOK.has('fill') && !this.isMap) this.buildFill();
    if (LOOK.has('glow') && stage.spec.night) { if (R.glows && !this.isMap) this.buildGlows(); else this.nightLights(); }
    this.W.root.add(this.group);
    this.update(1);
  }
  // the floor that runs on past the walls (the 'bleed' apron) was tinted for the old white glow and read as a pale halo
  // on the new backdrops: it takes the backdrop's own lower colour now, so the room stands on its ground, not on a glow
  aprons() { const out = []; this.room.group.traverse(o => { if (o.isMesh && o.renderOrder === -1 && o.material?.alphaMap && o.geometry?.type === 'PlaneGeometry') out.push(o); }); return out; }
  tintAprons() {
    const sky = (this.stage.spec.night && this.R.night?.sky) || this.R.sky;
    const base = this.R.floor || sky[1];   // the backdrop's own middle: the fade disappears, a cut-away corner reads as floor
    const t = speckleTex(base); this.own.push(t);
    // unlit: under the room lights (sun 2.5 + ambient 1.3) any lit colour blew out to white — the halo itself
    for (const ap of this.aprons()) { const m = new THREE.MeshBasicMaterial({ map: t, alphaMap: ap.material.alphaMap, transparent: true, depthWrite: false }); ap.material = m; this.own.push(m); }
  }
  // window light on the floor (room.js sunPatch) ran on past the room's edge onto the ground outside and made a yellow
  // band under every room: each patch is cut to its own room's floor (the quad clipped, its fade carried along)
  clipSunPatches() {
    for (const Rm of this.room.rooms || [this.room]) {
      const hw = Rm.w / 2, hd = Rm.d / 2;
      Rm.group.traverse(o => {
        if (!o.isMesh || o.renderOrder !== 2 || !o.material?.alphaMap || o.geometry?.type !== 'BufferGeometry') return;
        const g = o.geometry, P = g.attributes.position, U = g.attributes.uv; if (!P || !U || P.count !== 4) return;
        const poly = clipXZ([0, 1, 2, 3].map(i => ({ x: P.getX(i), y: P.getY(i), z: P.getZ(i), u: U.getX(i), v: U.getY(i) })), -hw, hw, -hd, hd);
        if (!poly) { o.visible = false; return; }
        const ng = polyGeo(poly);
        o.geometry = ng; g.dispose();   // (the patch's own quad, made for this room only)
      });
    }
  }
  // The cut-away walls' white edge (the wall body and its trims, what a folded front wall shows as its knee-high stub)
  // was the brightest thing on screen and pulled the eye off the room: near-white plain pieces of the walls take a cream
  // drawn from the room's backdrop instead — still the lightest frame, no longer a glare.
  toneWalls() {
    const sky = (this.stage.spec.night && this.R.night?.sky) || this.R.sky, made = new Map(), c = new THREE.Color(), hsl = {};
    for (const Rm of this.room.rooms || [this.room]) for (const k in Rm.walls) {
      const Wl = Rm.walls[k]; if (Wl.kind !== 'wall' && Wl.kind !== 'door') continue;
      Wl.body.traverse(o => {
        if (!o.isMesh || o.material?.map || !o.material?.color || o.material.transparent) return;
        o.material.color.getHSL(hsl); if (hsl.l < .9) return;   // only the near-white pieces (edge, trims)
        let m = made.get(o.material);
        if (!m) {
          m = o.material.clone();
          c.copy(o.material.color).lerp(new THREE.Color(sky[2]), this.R.edgeTone ?? .32);
          m.color.copy(c); made.set(o.material, m); this.own.push(m);
        }
        o.material = m;
      });
    }
  }
  // a soft shadow round the room's foot, so it sits on its ground instead of hovering over it
  contactShadow(ring) {
    const room = this.room, cake = this.isMap ? !room.def.bleed : !room.L.bleed && room.L.slab !== 'none';
    const w = room.w + (cake && !ring ? .62 : 0), d = room.d + (cake && !ring ? .62 : 0), F = 1.1, W = w + 2 * F, D = d + 2 * F;
    const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = Math.abs((i + .5) / N - .5) * W, v = Math.abs((j + .5) / N - .5) * D;
      const dd = Math.hypot(Math.max(0, u - w / 2), Math.max(0, v - d / 2)) / F, a = Math.max(0, 1 - dd), k = (j * N + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(255 * a * a); img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const am = new THREE.CanvasTexture(c), night = this.stage.spec.night;
    const m = new THREE.MeshBasicMaterial({ color: night ? '#0c0c2a' : '#4a3046', alphaMap: am, transparent: true, opacity: night ? .45 : .26, depthWrite: false });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m);
    // under a cake slab it hugs the slab's foot; on a bleed floor it lies just over the apron; on our ground, over that
    p.rotation.x = -HP; p.position.y = ring ? -.009 : cake ? -.5 : -.002; p.renderOrder = 0; p.userData.noOcclude = true;
    this.own.push(m, am); this.group.add(p);
  }
  // world size of the map (one room)
  get w() { return this.room.w; }
  get d() { return this.room.d; }

  buildGround() {
    const G = this.R.ground, room = this.room, w = this.w, d = this.d;
    for (const ap of this.aprons()) ap.visible = false;   // our ground takes over the fade
    const walk = G.walk ? slabTex(G.walk[0], G.walk[1]) : G.kind ? groundTex(G.kind, G.T || this.T) : room.floorTexture, zone = room.group.children.find(o => o.userData.floor && o !== room.floorMesh && o.material?.map)?.material.map;
    const S = G.size, [f0, f1] = G.fade;
    // the sidewalk all round, fading out between f0 and f1 from the map's edge
    // seamless: the ground is the map's own floor running on (the fishing meadow) — it joins the outline pass as 'floor',
    // so no ink line is drawn round the map's square edge (user 10/19: "바닥에 네모 플래인이 좀 거슬리네… 쓸모없는 네모 선");
    // made large so its own edge never comes on screen
    const SS = G.seamless ? Math.max(S, 64) : S;
    const base = this.fadePlane(walk, -SS / 2, SS / 2, -SS / 2, SS / 2, f0, f1, -.012, G.walk || G.kind ? [0, 0] : [-w / 2, d / 2], G.seamless ? 256 : 128);
    if (G.seamless) { base.userData.floor = true; base.userData.inkLayer = true; }
    if (this.stage.spec.night) base.material.color.set('#8d8aa6');   // at night the town round the corner sits in the dark
    this.group.add(base);
    const z0 = !this.isMap && room.L.floorZones?.[0], zo = z0 ? [-w / 2 + z0.i, -d / 2 + z0.j + z0.d] : [-w / 2, d / 2];
    for (const r of G.roads || []) if (zone) { const p = this.fadePlane(zone, r.x0, r.x1, r.z0, r.z1, f0, f1, -.008, zo); if (this.stage.spec.night) p.material.color.set('#8d8aa6'); this.group.add(p); }
    // curbs: a low kerb stone where a sidewalk meets a road (ink-outlined like everything else)
    const curb = '#e9e2d8';
    for (const c of G.curbs || []) {
      const along = c.dir === 'z' || c.dir === '-z' ? 'x' : 'z';
      const a0 = along === 'x' ? c.x0 : c.z0, a1 = along === 'x' ? c.x1 : c.z1, L = a1 - a0, m = (a0 + a1) / 2;
      const o = rbox(along === 'x' ? L : .14, .1, along === 'x' ? .14 : L, curb, .03);
      if (along === 'x') put(o, m, .05, c.z + .07); else put(o, c.x + (c.dir === '-x' ? -.07 : .07), .05, m);
      o.castShadow = false;
      this.group.add(o);
    }
    // zebra crossings (white bars, no outline: they are paint) — all bars one mesh
    const bars = [];
    for (const z of G.zebra || []) {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, g = new THREE.PlaneGeometry(z.dir === 'x' ? .2 : 1.1, z.dir === 'x' ? 1.1 : .2);
        g.rotateX(-HP);
        if (z.dir === 'x') g.translate(z.x0 + (z.x1 - z.x0) * t, -.004, z.z); else g.translate(z.x, -.004, z.z0 + (z.z1 - z.z0) * t);
        bars.push(g);
      }
    }
    if (bars.length) {
      const zm = new THREE.Mesh(mergeGeometries(bars), new THREE.MeshBasicMaterial({ color: '#f6f1ea', transparent: true, opacity: .92, depthWrite: false }));
      zm.renderOrder = 1; zm.userData.noOcclude = true; this.group.add(zm); bars.forEach(g => g.dispose());
    }
  }
  // a textured ground plane over [x0,x1]×[z0,z1] whose alpha fades from f0 to f1 units outside the map
  // (o = the world point where the texture's own (0, 0) lies, so the pattern runs on from the map's floor seamlessly)
  fadePlane(tex, x0, x1, z0, z1, f0, f1, y, o, N = 128) {
    const w = this.w, d = this.d, W = x1 - x0, D = z1 - z0;
    const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const span = tex.userData?.span || 2; t.repeat.set(W / span, D / span); t.offset.set(((x0 - o[0]) / span) % 1, ((o[1] - z1) / span) % 1);
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const wx = x0 + (i + .5) / N * W, wz = z0 + (j + .5) / N * D;
      const dd = Math.hypot(Math.max(0, Math.abs(wx) - w / 2), Math.max(0, Math.abs(wz) - d / 2));
      const a = 1 - Math.min(1, Math.max(0, (dd - f0) / (f1 - f0))), g = Math.round(255 * a * a * (3 - 2 * a)), k = (j * N + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = g; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const am = new THREE.CanvasTexture(c); am.flipY = true;
    const m = mat('#ffffff', { map: t, rough: .7, rim: .12 }); m.alphaMap = am; m.transparent = true; m.depthWrite = false;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m);
    p.rotation.x = -HP; p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); p.receiveShadow = true; p.renderOrder = -1; p.userData.noOcclude = true;
    return p;
  }
  buildRing() {
    const w = this.w, d = this.d;
    // every piece joins the side it stands on; a side folds as one, like a wall (N = far side of the N wall, …)
    const side = {}, NORM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
    const sideOf = (x, z) => { const ox = Math.abs(x) - w / 2, oz = Math.abs(z) - d / 2; return oz >= ox ? (z < 0 ? 'N' : 'S') : (x < 0 ? 'W' : 'E'); };
    const low = new THREE.Group(); low.name = 'look-low';
    for (const e of this.R.ring) {
      let o, isLow = false;
      if (e.house) {
        const mk = HOUSE_KIT[e.house];
        o = e.house === 'peng' ? mk(this.T) : mk();
        const front = o.userData.front ?? 1.6;
        // stand just behind the given wall (or across the road), the front toward the map
        if (e.back === 'N') put(o, e.x, 0, -d / 2 - .25 - front, 0, 0, 0);
        else if (e.back === 'S') put(o, e.x, 0, d / 2 + 2.6 + front, 0, Math.PI, 0);
        else if (e.back === 'W') put(o, -w / 2 - .25 - front, 0, e.z, 0, HP, 0);
        else put(o, w / 2 + 2.6 + front, 0, e.z, 0, -HP, 0);
      } else if (e.tree) {
        o = HOUSE_KIT.tree(e.tree, { s: e.s || 1 }); put(o, e.x, 0, e.z, 0, (e.tree * 1.7) % 6.28, 0, e.s || 1);
      } else if (e.stones) {   // a stepping-stone path: flat outlined stones, low
        o = new THREE.Group(); const [sx, z0, z1] = e.stones, n = Math.max(2, Math.round((z1 - z0) / .55));
        for (let i = 0; i < n; i++) { const st = rbox(.46 + (i % 2) * .08, .05, .34, '#e4ddd2', .05); put(st, sx + ((i * 37) % 7 - 3) * .03, .025, z0 + (i + .5) * (z1 - z0) / n, 0, (i % 3 - 1) * .12, 0); o.add(st); }
        isLow = true;
      } else if (e.hedge) {
        o = HOUSE_KIT.hedge(e.hedge, e.hedge * 10 | 0, { hgt: .5 }); put(o, e.x, 0, e.z, 0, e.ry || 0, 0); isLow = true;
      } else if (e.furn && FURN_INFO[e.furn]) {
        o = makeFurniture(e.furn, (e.theme && THEMES[e.theme]) || this.T).group;
        put(o, e.x, 0, e.z, 0, e.ry || 0, 0, e.s || null);
        isLow = new THREE.Box3().setFromObject(o).max.y < 1.05;
      } else continue;
      o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.userData.keep = true; } });
      if (isLow) { low.add(o); continue; }
      const k = e.back || sideOf(o.position.x, o.position.z);
      if (!side[k]) { side[k] = new THREE.Group(); side[k].name = 'look-' + k; }
      side[k].add(o);
    }
    // one bake per group: a side of houses and trees draws as a handful of meshes (merged copies; the cached parts stay)
    const bake = g => { mergeLike(g); this.group.add(g); };
    bake(low);
    for (const [k, g] of Object.entries(side)) { bake(g); this.tall.push({ o: g, dir: new THREE.Vector3(NORM[k][0], 0, NORM[k][1]), k: 1, sy: 1 }); }
  }

  buildFill() {
    const room = this.room, st = this.stage;
    // never next to something hidden, the friend, or where the layout says the friend stands
    const keep = [];
    const v = new THREE.Vector3();
    for (const it of st.items || []) { it.g.getWorldPosition(v); keep.push([v.x, v.z]); }
    const fa = st.layout?.friendAt; if (fa) keep.push([fa[0], fa[1]]);
    this.filled = [];
    for (const e of this.R.fill || []) {
      if (!FURN_INFO[e.furn]) continue;
      if (keep.some(([x, z]) => Math.hypot(x - e.x, z - e.z) < .75)) continue;
      if (room.clearAt && !room.clearAt(e.x, e.z, .3)) continue;
      const f = makeFurniture(e.furn, (e.theme && THEMES[e.theme]) || this.T);
      put(f.group, e.x, 0, e.z, 0, e.ry || 0, 0, e.s || null);
      f.group.userData.lookFill = true;
      room.group.add(f.group); this.filled.push(f.group);
    }
  }

  buildGlows() {
    const tex = glowTex();
    for (const [x, z, r, c] of this.R.glows || []) {
      const m = new THREE.MeshBasicMaterial({ color: c, map: tex, transparent: true, opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m);
      p.rotation.x = -HP; p.position.set(x, .014, z); p.renderOrder = 3; p.userData.noOcclude = true;
      this.room.group.add(p);
    }
  }

  // A night room lit by what is in it (any map, no per-room list): every lamp-like glowing piece gets a warm pool on the
  // floor under it and a soft halo; every window lets in a pale-blue patch of moonlight. Painted discs, no lights.
  nightLights() {
    const tex = glowTex(), W = this.W, g = new THREE.Group(); g.name = 'look-night';
    let Rm = null;   // the room being lit: a pool never runs past its floor (a desk lamp against the wall lit the ground outside)
    const pool = (x, y, z, r, c, op, sx = 1, sz = 1, rot = 0) => {
      const hx = r * sx, hz = r * sz, cs = Math.cos(rot), sn = Math.sin(rot);
      let poly = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].map(([a, b, u, v]) => ({ x: x + a * hx * cs + b * hz * sn, y, z: z - a * hx * sn + b * hz * cs, u, v }));
      const px = Rm.group.position.x, pz = Rm.group.position.z;
      poly = clipXZ(poly, px - Rm.w / 2, px + Rm.w / 2, pz - Rm.d / 2, pz + Rm.d / 2); if (!poly) return;
      const m = new THREE.MeshBasicMaterial({ color: c, map: tex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const p = new THREE.Mesh(polyGeo(poly), m);
      p.renderOrder = 3; p.userData.noOcclude = true; g.add(p); this.own.push(m);
    };
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    for (Rm of this.room.rooms || [this.room]) {
      const fy = Rm.group.position.y + .016;
      for (const f of [...Rm.furns, ...Rm.decors]) {
        if (f.hidden) continue;
        // lamps: what already glows (a desk lamp's bulb, a lantern)
        f.f.group.traverse(o => {
          if (!o.isMesh || !o.material?.emissive || o.material.emissive.getHex() === 0 || o.material.emissiveIntensity < .3) return;
          o.getWorldPosition(v);
          if (g.userData.lamps?.some(q => q.distanceTo(v) < .5)) return;
          (g.userData.lamps ||= []).push(v.clone());
          pool(v.x, fy, v.z, 2.0, '#ffb85a', 1);
          const sm = new THREE.SpriteMaterial({ map: tex, color: '#ffd98f', transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
          const sp = new THREE.Sprite(sm); sp.position.copy(v); sp.scale.setScalar(1.25); sp.renderOrder = 4; g.add(sp); this.own.push(sm);
        });
        // windows: moonlight falls in front of them
        if (/window/.test(f.type)) {
          f.f.group.getWorldPosition(v); f.f.group.getWorldDirection(n); n.y = 0; if (n.lengthSq() < 1e-4) continue; n.normalize();
          pool(v.x + n.x * 1.1, fy, v.z + n.z * 1.1, 1.0, '#8aa6ff', .75, .9, 1.6, Math.atan2(n.x, n.z));
        }
      }
    }
    W.root.add(g); this.night = g;
  }

  // tall pieces on the camera's side fold down like the walls (smoothly, as the room turns)
  update(dt) {
    const W = this.W, c = new THREE.Vector3(Math.sin(W.yaw), 0, Math.cos(W.yaw));
    // a phone that has started giving things up (a quality step down, or AO switched off for slow turning) gives up the
    // houses behind the walls too — the ground and the low things round the map stay
    // (decided once, when the stage starts: giving them up mid-stage squashed the trees and houses away in front of the
    // player — one more thing that 'jumped', 10/19)
    const lite = this.lite ??= (W.level || 0) >= 1 || !!W.aoAuto;
    for (const t of this.tall) {
      const want = lite || t.dir.dot(c) > .2 ? 0 : 1, prev = t.k;
      t.k += (want - t.k) * (1 - Math.exp(-dt * 12)); if (Math.abs(t.k - want) < .002) t.k = want;
      if (t.k !== prev || dt >= 1) { t.o.scale.y = t.sy * Math.max(.001, t.k); t.o.visible = t.k > .02; }
    }
  }
  dispose() {
    this.W.root.remove(this.group); if (this.night) this.W.root.remove(this.night);
    this.group.traverse(o => { if (o.isMesh && !o.userData.keep && o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); });
    for (const x of this.own) x.dispose?.();
    setSky(null);
  }
}

// Scenery diet: everything under a group that looks the same merges into one mesh — all plain and vertex-coloured
// pieces into one vertex-coloured mesh, textured pieces per texture (the home street's parts each carry their own copy
// of the same material, so merging by material object kept 25 meshes for one side). Merged copies; the cached parts
// the home screen uses are not touched.
function mergeLike(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), M = new THREE.Matrix4();
  const buckets = new Map(), drop = [];
  root.traverse(o => {
    if (!o.isMesh || o === root || !o.visible) return;
    const m = o.material, g = o.geometry;
    if (Array.isArray(m) || !g?.attributes?.position || m.transparent || o.userData.proxy) return;
    const tex = m.map?.source?.uuid || m.map?.uuid || '';
    const vc = !tex && (!m.emissive || m.emissive.getHex() === 0 || !m.emissiveIntensity);
    const key = vc ? 'vc' : [m.type, tex, m.vertexColors ? 'v' : '', m.color.getHexString(), m.emissive?.getHexString() || '', m.side].join('|');
    let b = buckets.get(key); if (!b) buckets.set(key, b = { list: [], mat: null, vc });
    b.list.push(o); if (!b.mat || (vc && m.vertexColors)) b.mat = m;
  });
  for (const b of buckets.values()) {
    if (b.list.length < 2) continue;
    const used = [];
    const geos = b.list.map(o => {
      let g = o.geometry.clone(); g.applyMatrix4(M.multiplyMatrices(inv, o.matrixWorld));   // (no mirrored pieces here)
      if (g.index) g = g.toNonIndexed();
      if (!g.attributes.normal) g.computeVertexNormals();
      // (a textured material that also reads vertex colours — the stream's pebbles — keeps them, or they draw black)
      const keep = b.vc ? ['position', 'normal', 'color'] : ['position', 'normal', 'uv', ...(b.mat.vertexColors ? ['color'] : [])];
      if (!b.vc && b.mat.vertexColors && !g.attributes.color) return null;
      if (b.vc && !g.attributes.color) {
        const c = o.material.color, n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k);
      if (!b.vc && !g.attributes.uv) return null;
      g.morphAttributes = {}; g.clearGroups();
      used.push(o);
      return g;
    }).filter(Boolean);
    let merged = geos.length > 1 ? mergeGeometries(geos, false) : null;
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    merged = reindexExact(merged);
    let mt = b.mat;
    if (b.vc && !mt.vertexColors) { mt = mt.clone(); mt.vertexColors = true; mt.color.set('#ffffff'); }
    const mesh = new THREE.Mesh(merged, mt); mesh.castShadow = false; mesh.receiveShadow = false; mesh.userData.merged = true;
    for (const o of used) o.parent?.remove(o);   // (a piece that could not join keeps its own mesh)
    root.add(mesh);
  }
  // empty groups left behind
  const empty = []; root.traverse(o => { if (o !== root && !o.isMesh && !o.children.length) empty.push(o); }); empty.forEach(o => o.parent?.remove(o));
  return root;
}

// a calm square-slab sidewalk for the streets round the map (the map's own bricks stay its own)
function slabTex(a, b) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 512, 512);
  let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = shade(a, (R() - .5) * .035); x.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
  x.fillStyle = b; for (let i = 0; i < 260; i++) { x.globalAlpha = .12 + R() * .2; x.beginPath(); x.arc(R() * 512, R() * 512, 1 + R() * 2.2, 0, 7); x.fill(); }
  x.globalAlpha = 1; x.strokeStyle = b; x.lineWidth = 4;
  for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(k * 128, 0); x.lineTo(k * 128, 512); x.moveTo(0, k * 128); x.lineTo(512, k * 128); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.span = 2;
  return t;
}

// clip a flat polygon [{x, y, z, u, v}] to x0..x1 × z0..z1 (Sutherland–Hodgman), carrying the texture coordinates
function clipXZ(poly, x0, x1, z0, z1) {
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t });
  for (const [k, lim, sg] of [['x', x0, 1], ['x', x1, -1], ['z', z0, 1], ['z', z1, -1]]) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = (a[k] - lim) * sg >= 0, ib = (b[k] - lim) * sg >= 0;
      if (ia) out.push(a);
      if (ia !== ib) out.push(lerp(a, b, (lim - a[k]) / (b[k] - a[k])));
    }
    poly = out; if (poly.length < 3) return null;
  }
  return poly;
}
function polyGeo(poly) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(poly.flatMap(q => [q.x, q.y, q.z]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(poly.flatMap(q => [q.u, q.v]), 2));
  const idx = []; for (let i = 1; i < poly.length - 1; i++) idx.push(0, i + 1, i);
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function mixHex(a, b, t) { return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString(); }
// a quiet ground for a room's apron: the colour with a light speckle (so it reads as a surface, not a flat fill)
function speckleTex(col) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 256, 256);
  let s = 5; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) { x.globalAlpha = .1 + R() * .12; x.fillStyle = R() < .5 ? shade(col, -.06) : shade(col, .04); x.beginPath(); x.ellipse(R() * 256, R() * 256, 3 + R() * 9, 2 + R() * 5, R() * 3, 0, 7); x.fill(); }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5);
  return t;
}

let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), g = x.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, N, N);
  return (GLOW = new THREE.CanvasTexture(c));
}
