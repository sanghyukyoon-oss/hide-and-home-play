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
import { TOWN_SKY } from './gfx/town-kit.js';
import * as THREE from 'three';
import { put, rbox, mat, shade, fadeDisc } from './gfx/kit.js';
import { reindexExact } from './gfx/bake.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFurniture, FURN_INFO } from './gfx/furniture.js';
import { HOUSE_KIT } from './scenes/home.js';
import { THEMES } from './stages.js';
import { asRoom } from './roomalias.js';
import { groundTex } from './gfx/outdoor.js';

const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const RAW = QS.get('look');
export const LOOK = new Set(RAW === '0' ? [] : (RAW && RAW !== '1' ? RAW : 'light,ring,fill,glow,items').split(','));
// 포근한 밤 (G2, ⑥ 아트 진단 10/21 — 밤 판이 1~17판의 37~67% 밝기라 "어둡고 우울"): one night for every night stage — a deep blue
// sky going down to a soft violet, small stars and a moon, a gentle bluish fill bright enough to read every corner, and a cream
// moon instead of a cold one; the lamps (look.js nightLights / glows) make the warm pools. 정전 (a power cut) is the same night
// a step darker until the switch — moonlit blue, never black-violet.
export const COZY_NIGHT = { light: { ambColor: '#c8cff6', amb: 1.24, sunColor: '#fff0dc', sun: 1.55, shadow: .48 },
  sky: Object.assign(['#1f2b72', '#3a4ea6', '#8f8bd0'], { stars: true }) };
export const COZY_DARK = { light: { ambColor: '#aab6ee', amb: .86, sunColor: '#d6defc', sun: .8, shadow: .45 },
  sky: Object.assign(['#18225e', '#2c3c88', '#6a68b0'], { stars: true }) };
const cozyNight = (sky, extra = {}) => ({ light: COZY_NIGHT.light, sky: Object.assign([...sky], { stars: true, ...extra }) });
const HP = Math.PI / 2, PI = Math.PI;

// ── recipes ─────────────────────────────────────────────────────────────────────────────────────────────────────
// map coordinates: x across (W wall at -w/2), z deep (N wall at -d/2); the camera starts on the +x +z side
const RECIPES = {
  street: {
    // late afternoon: a low golden sun from the camera's left, a cool soft fill so the shaded sides go a little blue
    light: { ambColor: '#ece6f2', amb: 1.12, sunColor: '#ffdcb0', sun: 2.6, shadow: .62 },
    sky: ['#a9d4ee', '#ffe3c4', '#e9c3a8'],
    // night (27판 street:night): moonlight as before, a deep sky, the lamps doing the rest
    night: cozyNight(['#1f2b72', '#3a4ea6', '#8f8bd0']),
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
  // 개굴이의 기차역 (새 3판, 10/20): a spring morning on a country platform — clear warm light, a soft blossom-pink sky
  // over pale green (the cherry tree and the green train carry the colour; the backdrop stays mid and quiet)
  station: {
    // (27판 아침 10/21, 사용자 "27 당근 아침이지. 아침에 여행가는거니까"): a fresh morning — warm butter sunlight, a cool clear fill,
    // a peach-to-sky backdrop; the sun stays where it was (no long shadows)
    light: { ambColor: '#eef1f6', amb: 1.28, sunColor: '#ffe4b0', sun: 2.6, shadow: .56 },
    sky: ['#fbe6cc', '#fdf1e2', '#d6e8f2'],
    // (C안 10/20: a green island of land ringed with big mossy boulders, floating on a pale spring backdrop)
    rim: { h: .7, earth: '#7a5a40', round: .9, big: true, stone: '#a8927a', stone2: '#937d66', moss: '#6cb84a', grass: '#7fc75a', fringe: 'bush', lowRow: false,
      fringeSkip: [[-5, -.5, .7], [5, -.5, .7], [3.5, 2.5, .8], [3.5, -2.5, .8]],
      flowers: [[-3.2, 1.8, 7], [-1.2, 2.6, 6], [1.0, 2.4, 6], [3.3, 2.0, 6], [3.3, -2.4, 5]] },
  },
  // 호수 섬 (새 4판, 10/20): the island stands a step up out of a clear lake that fades into a soft summer sky
  island: {
    light: { ambColor: '#f2f4f0', amb: 1.3, sunColor: '#fff4dc', sun: 2.6, shadow: .58 },
    sky: ['#9fe0e6', '#c4eef0', '#7fd2dc'],
    ground: { size: 34, fade: [4, 11], kind: 'water', y: -.3, T: { water: '#62cfd9' } },
    // (C안: big grey boulders with moss, the lawn rolling over them, lilies and cattails round the shore, a path of stones
    // from the cottage door to the deck)
    rim: { h: .5, earth: '#a98060', round: 2.0, big: true, stone: '#c6c1cf', stone2: '#aaa4b8', lilies: 26, fringe: true,
      fringeSkip: [[-3.3, -1.5, .7], [-3.3, .5, 1.1], [3.3, 1.5, .8]],
      path: [[.7, -1.15], [.9, -.7], [1.1, -.25], [1.3, .2], [1.5, .62], [1.75, 1.0]],
      flowers: [[-.3, .3, 7], [-2.2, -.6, 6], [.3, 1.9, 6], [2.2, -.4, 5], [-1.0, 1.6, 5]] },
    itemSize: .38,
  },
  // 빌라 옥상 (10/21, 18판 시안): late sun — warm peach light, a pink-to-lilac sky; the villa's walls going down under it
  villaroof: {
    light: { ambColor: '#ffe9dc', amb: 1.25, sunColor: '#ffcf9a', sun: 2.6, shadow: .58 },
    sky: ['#f7b7a0', '#fbd6c0', '#c9a7d6'],
    block: { layers: [{ h: .1, color: '#f3eadc', out: .05 }, { h: .5, color: '#e9dfd0' }, { h: 1.1, color: '#e1d5c3', stones: true }] },
    itemSize: .38,
  },
  // 동네 도서관 (10/21, 17판 시안): warm lamp-and-window light on a dusty-blue backdrop; a thin cream block under it
  library: {
    light: { ambColor: '#f6eee6', amb: 1.28, sunColor: '#fff0d6', sun: 2.5, shadow: .56 },
    sky: ['#aec4e6', '#cbd9ef', '#9db5dd'],
    block: { layers: [{ h: .12, color: '#f3e8d6', out: .03 }, { h: .22, color: '#d9c9ae' }] },
    itemSize: .38,
  },
  // 아파트 현관 (10/21, 13판 시안): warm afternoon through the glass, a soft peach backdrop; a thin block under it (the picture)
  aptlobby: {
    light: { ambColor: '#f6f0ea', amb: 1.3, sunColor: '#fff0dc', sun: 2.5, shadow: .56 },
    sky: ['#f6e4d6', '#fbefe6', '#ead2c0'],
    block: { layers: [{ h: .1, color: '#efe6da', out: .03 }, { h: .22, color: '#d6cabb' }] },
    itemSize: .38,
  },
  // 바닷가 가게 (10/20 밤): bright clean daylight, a pale sea-blue sky; the square stands on a thin stone block (the ref)
  seaside: {
    light: { ambColor: '#f4f6f8', amb: 1.32, sunColor: '#fff6e6', sun: 2.6, shadow: .56 },
    sky: ['#d4ecf6', '#eef7fb', '#c4e2f0'],
    block: { layers: [{ h: .07, color: '#e9e3da', out: .03 }, { h: .22, color: '#d8cfc0', stones: true }, { h: .3, color: '#c7a77c' }] },
    itemSize: .38,
  },
  // 개굴이의 낚시터 (3판, 사용자 10/23 메모 "배경 주변이 타는 거 같아"): the yellow-green glow round the meadow went; a clear park sky
  // and a soil block under the lawn like 30판's plinth — grass lip, brown soil, a band of stones, darker earth (A안).
  // B안 fishingtown: the same pond in 26판's neighbourhood ring instead (gfx/gpt2c-dog-surround.js), the ground running on
  fishing: {
    light: { ambColor: '#f2f8f0', amb: 1.32, sunColor: '#fff6e2', sun: 2.55, shadow: .56 },
    sky: ['#cfe9f6', '#eef7f4', '#d9eedf'],
    block: { layers: [{ h: .08, color: '#8fd06a', out: .04 }, { h: .24, color: '#a57c56' }, { h: .26, color: '#b8ad9c', stones: true }, { h: .22, color: '#8a6648' }] },
  },
  fishingtown: {
    light: { ambColor: '#f2f8f0', amb: 1.32, sunColor: '#fff6e2', sun: 2.55, shadow: .56 },
    sky: ['#cfe9f6', '#eef7f4', '#d9eedf'],
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
    // (10/20 아트 기획안 A-2, 사용자 "진행 ㄱ": the room sank into one blue and the things in it with it — a little more
    // moonlight, still blue; the lamps' warm pools do the rest)
    night: { light: { ambColor: '#a3aaea', amb: 1.0, sunColor: '#cdd4ff', sun: .78, shadow: .5 }, sky: ['#151a45', '#25286a', '#33316f'] },
  },
  // 미술관 (10판, 흑백): a gallery's quiet lilac-grey
  museum: {
    light: { ambColor: '#f2eef6', amb: 1.3, sunColor: '#fff6ea', sun: 2.4, shadow: .62 },
    sky: ['#ddd6e8', '#e8e2f0', '#cdc4dc'],
  },
  // (개굴이의 낚시터, 3판: no recipe any more — 10/19 back to the first 3판's own bright island, user: "처음걸로 되돌리고")

});
// ── 편의점·카페 (31~40판, 10/19 user refs: an isometric cosy café and the TUTU shop — "이런 판이나 이런느낌의 판도 몇개
// 있었으면"): each shop its own colours, a printed wallpaper of its own little icon behind it, a band round the top of
// its walls, and the bare walls and floor filled with shop things that are not to be found (no new hiding places).
//   theme — colours the room is built in (this look only; the shop's own theme stays for 내 집 and the maps)
//   slab — the room on a thick base instead of its floor fading out (the camera keeps the bleed room's close fit)
//   pattern — the backdrop's icon, printed small and faint over the sky
//   band — the strip round the top of the walls: stripes (konbini) or a plain moulding (café)
//   wall — [type, wall, u]: hidden-free wall pieces (shop-props.js, 룩 section)
Object.assign(RECIPES, {
  konbini: {
    light: { ambColor: '#f2f5f8', amb: 1.3, sunColor: '#fff9ee', sun: 2.45, shadow: .62 },
    // (G2 10/21: the backdrop was charcoal — 32판 흑백 and 40판 at 61% of 1~17판's brightness; now a warm shop-floor cream, the same print)
    sky: ['#f3e7d6', '#f8efe3', '#e8d8c4'],
    pattern: { icon: 'onigiri', ink: 'rgba(150,110,70,.08)' },
    theme: { floorKind: 'planks', floor: '#f1c890', floor2: '#dba56a', base: '#e0a564' },
    slab: true,   // a shop stands on its own slab, like a toy shop on a shelf (both refs), not on a floor fading out
    band: { stripes: ['#4fc28a', '#fff8e8', '#ffb14a', '#fff8e8', '#ff7a6b', '#fff8e8', '#ffd84a', '#fff8e8'], h: .3, trim: '#4fc28a' },
    wall: [['welcome', 'N', -1.0], ['saleposters', 'N', 2.5], ['yummyposter', 'W', -.35]],
    fill: [
      { furn: 'basketstack', x: -2.5, z: -1.1, ry: .3 },
      { furn: 'boxstack', x: 2.55, z: 2.05, ry: -.4, s: .8 },
      { furn: 'plant', x: 1.5, z: -1.15, s: .8 },
      { furn: 'doormat', door: 'W', opts: { color: '#4fc28a' } },   // inside the door (wherever the layout put it)
    ],
  },
  cafe: {
    light: { ambColor: '#f6ece0', amb: 1.24, sunColor: '#ffe2bc', sun: 2.55, shadow: .62 },
    sky: ['#d3dca9', '#c6d199', '#b4c186'],
    pattern: { icon: 'cup', ink: 'rgba(96,112,44,.2)' },
    theme: { wall: '#f1e4bb', wall2: '#e8d7a6', wainscot: '#a8693f', wallEdge: '#fbf3dc', floor: '#cf9256', floor2: '#a46a3a', base: '#8a5634', stool: '#ff9f6b' },
    slab: true,
    band: { color: '#8a5634', h: .16, trim: '#c98a52', bulbs: true },   // and a string of little bulbs in loops under it
    wall: [['menutrio', 'N', -2.0], ['cupshelf', 'N', -.5], ['cafesign', 'W', 1.95]],
    fill: [
      { furn: 'stool2', theme: 'cafe', x: -2.4, z: -1.05, ry: .2 },
      { furn: 'stool2', theme: 'cafe', x: -1.6, z: -1.05, ry: -.2 },
      { furn: 'plantbig', x: -2.55, z: -.05, s: .85 },
      { furn: 'aframe', theme: 'cafe', x: 2.55, z: 2.0, ry: -.7 },
      { furn: 'monstera', x: 2.6, z: 1.0, s: .8 },
      { furn: 'doormat', door: 'W', opts: { color: '#a8693f' } },
    ],
  },
  // 빨래방 (33·39판): sky-blue and white, an awning stripe in the same, a periwinkle backdrop of little tees, socks on a
  // line across the window wall
  laundry: {
    light: { ambColor: '#eef3fa', amb: 1.3, sunColor: '#fff8ee', sun: 2.45, shadow: .62 },
    sky: ['#aebcf0', '#9eaee6', '#8d9ed9'],
    pattern: { icon: 'shirt', ink: 'rgba(255,255,255,.2)' },
    theme: { base: '#8cc3ea' },
    slab: true,
    band: { stripes: ['#5aa9ec', '#ffffff'], h: .26, trim: '#5aa9ec' },
    wall: [['welcome', 'N', -1.0, { word: 'LAUNDRY', cols: ['#5aa9ec', '#ffffff', '#ffc23d', '#7fd6c0'] }], ['sockline', 'W', -1.2, { len: 2.4 }], ['washguide', 'W', -1.4]],
    fill: [
      { furn: 'dryrack', x: 2.05, z: -.95, ry: -.3 },
      { furn: 'boxes', x: 2.05, z: .05, ry: .2, s: .7 },
      { furn: 'doormat', door: 'W', opts: { color: '#5aa9ec' } },
    ],
  },
  // 상가 맵 (36판 밤·40판 보스): the konbini and the laundry side by side, each half in its own recipe's colours and things
  shopmap: {
    light: { ambColor: '#f2f5f8', amb: 1.3, sunColor: '#fff9ee', sun: 2.45, shadow: .62 },
    // (G2 10/21: the backdrop was charcoal — 32판 흑백 and 40판 at 61% of 1~17판's brightness; now a warm shop-floor cream, the same print)
    sky: ['#f3e7d6', '#f8efe3', '#e8d8c4'],
    pattern: { icon: 'onigiri', ink: 'rgba(150,110,70,.08)' },
    night: cozyNight(['#1f2b72', '#33449a', '#7f7cc4'], { pattern: { icon: 'onigiri', ink: 'rgba(255,255,255,.06)' } }),
    slab: true,
    rooms: ['konbini', 'laundry'],
  },
});
// 6~9판 show a whole house at once: their things were 7–15 px on a phone at the start view (rooms 1–5: 15–30 px),
// so things on these maps are drawn to ~38 cm instead of ~28 (still only as big as the spot has room for). ?look=…
// without 'items' keeps the old size.
// ── G1 블록 디오라마 (⑥ 아트 진단 10/21; user taste 10/20 "떠 있는 얇은 네모 바닥 X" — the station's island, the seaside's stone block
// and the villa roof's brick block were the ones liked): the outdoor maps no longer run their floor out into a white fog — each
// stands on a block whose sides show its layers (a kerb or grass lip, a band of stone, then earth), over a quiet pastel sky.
// Light stays the map theme's own (lookTheme falls back to it). Night / 정전 stages on these maps take the 포근한 밤.
const KERB = (lip = '#e6e0d8', stone = '#cdc5ba', earth = '#b98f68') => ({ layers: [{ h: .08, color: lip, out: .04 }, { h: .24, color: stone, stones: true }, { h: .32, color: earth }] });
const GRASS = (lip = '#86c868', soil = '#a57c56', earth = '#8a6648') => ({ layers: [{ h: .08, color: lip, out: .04 }, { h: .2, color: soil }, { h: .26, color: '#b8ad9c', stones: true }, { h: .2, color: earth }] });
const DIRT = (lip = '#dcae74', rock = '#b9a99a', earth = '#8a6648') => ({ layers: [{ h: .07, color: lip, out: .04 }, { h: .26, color: rock, stones: true }, { h: .3, color: earth }] });
const SKY_ALLEY = ['#f2d6c0', '#f8e8da', '#e6cbb4'], SKY_PARK = ['#bfe3f2', '#e8f5ee', '#bfe0c8'], SKY_CAMP = ['#cfe3f2', '#f4ecdc', '#e2c9a6'];
Object.assign(RECIPES, {
  alley1: { sky: SKY_ALLEY, block: KERB() },
  alley3: { sky: SKY_ALLEY, block: KERB() },
  alleywide: { sky: SKY_ALLEY, block: KERB() },
  policefront: { sky: ['#cfe0f0', '#eaf2f8', '#c4d6e8'], block: KERB('#e8e6e2', '#cfcbc6', '#a98a6a') },
  skatepark: { sky: ['#dfe3ea', '#eef1f5', '#d2d7e0'], block: KERB('#e2e2e0', '#c9c8c4', '#9f8a72') },
  kpop: { sky: ['#f2d4e4', '#fbebf3', '#e6c4d8'], block: KERB('#f3e2e8', '#e0cbd3', '#b998a6') },
  playground: { sky: ['#f4dfc4', '#fbf0e2', '#e9d0b0'], block: KERB('#ece0cf', '#d6c8b4', '#b08c66') },
  playgroundwide: { sky: ['#f4dfc4', '#fbf0e2', '#e9d0b0'], block: KERB('#ece0cf', '#d6c8b4', '#b08c66') },
  park1: { sky: SKY_PARK, block: GRASS() },
  park2: { sky: SKY_PARK, block: GRASS() },
  park3: { sky: SKY_PARK, block: GRASS() },
  parkwide: { sky: SKY_PARK, block: GRASS() },
  trail: { sky: SKY_CAMP, block: GRASS('#7fbf5c', '#9a7450', '#7d5c40') },
  camp1: { sky: SKY_CAMP, block: DIRT() },
  camp2: { sky: SKY_CAMP, block: DIRT() },
  camp3: { sky: SKY_CAMP, block: DIRT() },
  campwide: { sky: SKY_CAMP, block: DIRT() },
});
RECIPES.bear2 = { ...RECIPES.bear, itemSize: .38 };
RECIPES.bunnybath.itemSize = .38;
RECIPES.station.itemSize = .38;   // (a wide platform at zoom 1.2: things ≥ 28 px on the start view — 레벨)
// 기차 여행 밤 (10/21, 27판 밤 자리): the station and the lake at night — a deep blue sky, cool moonlight, and warm pools under
// the station lamp, the shelter's lanterns and the stopped train's windows, the crossing's red lamps; on the island the
// lighthouse, the cottage window and the deck lantern
RECIPES.station.night = { light: { ambColor: '#9fa8f0', amb: .92, sunColor: '#c4ccff', sun: .7, shadow: .5 }, sky: ['#141a46', '#262a68', '#3a3a7a'] };
RECIPES.station.glows = [[2.5, -2.0, 1.3, '#ffd27a', .415], [-2.0, -1.7, 1.1, '#ffc46e', .415], [-3.0, .45, .8, '#ffe7a8'], [-1.5, .45, .8, '#ffe7a8'], [0, .45, .8, '#ffe7a8'],
  [2.5, 1.0, .6, '#ff6a5a', .135], [4.5, -1.0, .6, '#ff6a5a']];
RECIPES.island.night = { light: { ambColor: '#9fa8f0', amb: .92, sunColor: '#c4ccff', sun: .72, shadow: .5 }, sky: ['#121a44', '#1e2a62', '#2c3672'] };
RECIPES.island.glows = [[1.3, -1.2, .9, '#ffd27a'], [2.6, 2.4, .7, '#ffc46e']];
// 섬 3차 (10/21, 앞 버전은 island 그대로): a tidier shore — one row of low tufts with a hydrangea now and then, stones filling the
// rounded corners
RECIPES.island2 = { ...RECIPES.island, rim: { ...RECIPES.island.rim, fringe: 'tidy', cornerFill: true } };
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
// 7판 a little brighter (user 10/20 on a phone: "스테이지 7은 약간 더 밝게") — more fill and a whiter sun, a touch lighter shade;
// the sun stays where it is (no long shadows). 8판 keeps the house light it had.
RECIPES.house2f = { ...RECIPES.house2f, light: { ambColor: '#f3eff5', amb: 1.36, sunColor: '#ffe6c6', sun: 2.75, shadow: .56 } };
// ── 11~20판 (우리 아파트 장, 10/20 아트 개선안 — 사용자 컨펌 전): the same rule as 1~10 — no white glow behind the room, a
// mid-value backdrop of the room's own colour and a light mood; the sun stays where it is (no long shadows)
Object.assign(RECIPES, {
  // 냥냥이네 부엌 (11판): a mint kitchen on a soft sage
  cat: { light: { ambColor: '#f0eef2', amb: 1.26, sunColor: '#ffe8c8', sun: 2.55, shadow: .62 }, sky: ['#cfe3d6', '#dcece2', '#bdd5c6'] },
  // 박사님의 비밀 서재 (12판): a whiter light on the room's own deep green (10/23 사용자 메모: "뭔가 라이팅이 누런디. 이상함" —
  // was parchment, a little dusky: amb #f2ebe6 1.24 · sun #ffe0b4 2.55 · sky #e2d3bb #ebdfcb #d2bfa3)
  study: { light: { ambColor: '#eef1f0', amb: 1.3, sunColor: '#fff4e6', sun: 2.5, shadow: .62 }, sky: ['#d3e2d9', '#e1ece5', '#c2d5ca'] },
  // 우리 아파트 거실 (13판) and the 투룸 map (20판): an afternoon apartment, warm peach
  apt: { light: { ambColor: '#f2ecf0', amb: 1.24, sunColor: '#ffe2bc', sun: 2.6, shadow: .62 }, sky: ['#ecd3c2', '#f3e0d2', '#dec2ad'] },
  // 파출소 (14판, 흑백) · 아파트 주방 (17판, 흑백): the gallery's quiet lilac-grey, a cooler and a warmer one
  // gray: the light while the stage is 흑백 (14·17판, 기획안 B-2): white walls and pale floors all came out one light grey
  // with only the outlines left — a little less light and deeper shade, so walls, floor and things sit in three greys like
  // 4·10판. The day light comes back with the colour (stage.js colorBloom)
  police: { light: { ambColor: '#f2eef6', amb: 1.3, sunColor: '#fff6ea', sun: 2.4, shadow: .62 }, sky: ['#d8d5e6', '#e5e2ef', '#c8c3d9'],
    gray: { light: { ambColor: '#f2eef6', amb: 1.02, sunColor: '#fff6ea', sun: 2.15, shadow: .74 } } },
  aptkitchen: { light: { ambColor: '#f2eef6', amb: 1.3, sunColor: '#fff6ea', sun: 2.4, shadow: .62 }, sky: ['#e0d6dd', '#ebe3e8', '#d0c4cc'],
    gray: { light: { ambColor: '#f2eef6', amb: 1.02, sunColor: '#fff6ea', sun: 2.15, shadow: .74 } } },
  // 햄찌네 원룸 (15판): a small flat in dusty lavender
  oneroom: { light: { ambColor: '#f2eef6', amb: 1.28, sunColor: '#fff0dc', sun: 2.5, shadow: .62 }, sky: ['#d9d0e6', '#e5def0', '#c9bedc'] },
  // 토순이네 교실 (16판): a school morning, powder blue
  school: { light: { ambColor: '#eef0f6', amb: 1.28, sunColor: '#fff4e2', sun: 2.5, shadow: .62 }, sky: ['#cbdcec', '#dde8f2', '#bccde0'] },
  // 햄찌네 복층 원룸 (18판, 너굴이 술래): warm sand
  duplex: { light: { ambColor: '#f2ecf0', amb: 1.24, sunColor: '#ffe2bc', sun: 2.6, shadow: .62 }, sky: ['#e6d6c0', '#efe4d4', '#d8c5ab'] },
  // 동네 119 안전센터 (19판): out on the street — the houses' late-afternoon sky
  // (19판 3차 10/21, user on the phone: "좀 어둡고 우울함"): a bright warm afternoon — warm white light, a clear blue sky down to cream
  firestation: { light: { ambColor: '#fff4ea', amb: 1.38, sunColor: '#fff0d6', sun: 2.55, shadow: .54 }, sky: ['#a6d9f4', '#fff3e2', '#ffe6c8'] },
});
RECIPES.aptmap = RECIPES.apt;
// 2판 토순이 다락 놀이방 (10/20): late-morning light under the roof, a soft rose-lilac backdrop (1판's dusty rose, a step cooler)
RECIPES.bunnyattic = { light: { ambColor: '#f4eef6', amb: 1.3, sunColor: '#fff0dc', sun: 2.5, shadow: .6 }, sky: ['#e3cbdc', '#efdde7', '#d4b8cb'], itemSize: .38 };
// 6판 곰돌이 빵 굽는 부엌 (10/20): a warm baking afternoon, a butter-apricot backdrop
RECIPES.bearbakery = { light: { ambColor: '#f4ece8', amb: 1.28, sunColor: '#ffe6c2', sun: 2.55, shadow: .6 }, sky: ['#ecd3b4', '#f4e3cc', '#dfc29e'], itemSize: .44 };
// (다락·곰제과 v2, 10/21 — 사용자는 v1을 고름; 후보로 남겨 둠)
RECIPES.bearbakery2 = { ...RECIPES.bearbakery, itemSize: .4 };
RECIPES.bunnyattic1 = RECIPES.bunnyattic2 = RECIPES.bunnyattic;
// (22·27판 골목 'street': waits for the user's art sign-off — 10/19 "22판 골목 룩 … 빼고"; sumbak-look keeps it)
delete RECIPES.street;
RECIPES.aptlobby2 = RECIPES.aptlobby;   // (현관 2차: the same light)
// (G1 10/21) the street (22판, its old look still waits on the user — deleted above) and the fire station (19판) stand on the
// kerb block too: the street gets only a sky and the block, the fire station keeps its light and sky
RECIPES.street = { sky: ['#f4dcc4', '#faeadc', '#e9cfb6'], block: KERB() };
RECIPES.firestation = { ...RECIPES.firestation, block: KERB('#e8e6e2', '#cfcbc6', '#a98a6a') };
// 28판 기차 객실 (10/21): bright seaside morning through the windows, a sky-blue backdrop; the car's underside as a block — cream
// floor edge, the blue body band, the dark undercarriage
RECIPES.traincar = { light: { ambColor: '#eef3f8', amb: 1.3, sunColor: '#fff2dc', sun: 2.5, shadow: .55 }, sky: ['#bfe1f7', '#e6f4fd', '#a9d5f2'],
  block: { layers: [{ h: .1, color: '#f6ecd8', out: .06 }, { h: .22, color: '#5072b0', out: .06 }, { h: .08, color: '#f08a3c', out: .06 }, { h: .3, color: '#3a3f4c' }] }, itemSize: .38 };
// (2차 10/21): the car floats over a sky of soft clouds, like the picture
RECIPES.traincar2 = { ...RECIPES.traincar, clouds: true };
// (3차 10/22, 사용자 "뒤에 구름 배경 빼고"): inside a train the outside is only what the windows show — a calm deep slate behind
// the car, no clouds, the same light
RECIPES.traincar3 = { ...RECIPES.traincar, sky: ['#3b4664', '#48546f', '#323b56'] };
// (20판 2차 10/21): the neighbours' rooftops printed very faint along the bottom of the backdrop — boxy villas, a yellow tank
// here and there, an antenna, a little rooftop room
// (20판 3차 10/21, user on the phone: "20도 어둡고 우울"): a bright, warm afternoon instead of the sunset — a clear blue sky
// going down to warm cream, warm white light; the faint neighbours' roofs in a pale blue-grey. (the sun stays where it was:
// no long shadows — the mood is in the light's colour and the sky)
RECIPES.villaroof2 = { ...RECIPES.villaroof, light: { ambColor: '#fff6ec', amb: 1.4, sunColor: '#fff2dc', sun: 2.55, shadow: .52 },
  sky: ['#9fd4f2', '#fff3e2', '#ffe4c2'], skyline: { ink: '#9fb6cc', tank: '#efc75e' } };

// GPT 들여온 맵의 아침 빛 (gpt2-d 벚꽃역 동네형·긴 객실 한 칸, ① 10/22)
const GPT_MORNING = { ambColor: '#fff0e2', amb: 1.3, sunColor: '#fff3e0', sun: 2.4, shadow: .63 };
RECIPES.gptsakura = { light: GPT_MORNING, sky: ['#b0e5e8', '#fef2e1', '#f6e0bf'], shadow: false, itemSize: .58 };
RECIPES.gptlongcar = { light: GPT_MORNING, sky: ['#b0e5e8', '#fef2e1', '#f6e0bf'], shadow: false, itemSize: .70 };
// (공통 룩 키트 ① 10/22: 26판 동네 배경을 까는 바깥 판은 하늘도 26판처럼 — 옛 판의 빛·받침은 그대로; gfx/town-kit.js)
// (허브 10/22 밤: 판마다 하늘은 그 판 orig 것 그대로 — 바깥 판이 다 같은 청록이면 똑같고 차갑다; 청록 하늘·땅은 26판만)
const townRecipe = old => ({ light: RECIPES[old]?.light, block: RECIPES[old]?.block, sky: RECIPES[old]?.sky || TOWN_SKY });
RECIPES.firestation2 = townRecipe('firestation');
// (20판: the GPT shell is the villa below the roof — the old 20판's brick block under it showed through as half-drawn bricks, 사용자 "그리다 만 벽돌 텍스처 같은 건 버리자")
RECIPES.gptvillaroof = { ...townRecipe('villaroof2'), block: undefined }; RECIPES.gptpolicefront = townRecipe('policefront'); RECIPES.gptalley = townRecipe('alley1'); RECIPES.gptcornershop = townRecipe('alley3');
RECIPES.gptstation = { ...townRecipe('station'), block: undefined };
// (GPT maps on their own island or ground — 19·26·27·28판, 해변역: lookRecipe doesn't lend them the old map's block too, ① 10/22)
const OWN_BASE = new Set(['gptfirestation', 'gptdoghouse', 'gptdoghouse2', 'gptstation', 'gpttraincar2', 'gptseastation']);
export function lookRecipe(room, spec) {
  if (!LOOK.size || spec?.custom) return null;
  if (RECIPES[room]) return RECIPES[room];
  // (a GPT map under a new key: its old map's sky (with its skyline, clouds, rain, stars), light, night, block and thing size — roomalias.js; not what
  // sits where the old map's furniture or ground was: its glows, ring, rooms, ground, floor, slab, fills — ① 10/22: 18판's arcade glows floated in the new room)
  const o = RECIPES[asRoom(room)]; if (!o) return null;
  const { glows, ring, rooms, ground, floor, slab, fill, theme, ...sky } = o;
  if (OWN_BASE.has(room)) delete sky.block;
  return sky;
}
// a GPT map's own mood where the old one's backdrop doesn't suit it (LOOK 10/22 "each map its own backdrop", ⑥): 44판 모래 언덕 —
// a clear summer blue over the park's grass block
RECIPES.gptplayhamster = { ...RECIPES.park3, sky: ['#5fb2e6', '#c2e5f4', '#dcf0e6'] };

// ── light and sky (stage.enter, before the room is built) ──────────────────────────────────────────────────────
// returns the theme with the look's light and background, so every later light change (lights on at a night stage's
// end) goes back to the look's day, not the house light
export function lookTheme(R, th) {
  if (!R || !LOOK.has('light')) return th;
  return { ...th, light: R.light || th.light, bg: [R.sky[1], R.sky[2]], sky: R.pattern || R.skyline || R.clouds || R.rain ? Object.assign([...R.sky], { pattern: R.pattern, skyline: R.skyline, clouds: R.clouds, rain: R.rain }) : R.sky };
}
// the colours a shop's room is built in (this stage only): a lone room takes the recipe's theme; a map whose recipe lists
// rooms gives each of those rooms its own recipe's theme and remembers which (lookKey: the look's pieces go in by it)
export function lookLayout(R, layout) {
  if (!R || !LOOK.has('light')) return layout;
  if (!layout.rooms) return R.theme ? { ...layout, theme: { ...layout.theme, ...R.theme } } : layout;
  if (!R.rooms) return layout;
  return { ...layout, rooms: layout.rooms.map(r => {
    const k = R.rooms.find(q => THEMES[q] === r.layout.theme), S = k && RECIPES[k];
    return S ? { ...r, layout: { ...r.layout, lookKey: k, theme: S.theme ? { ...r.layout.theme, ...S.theme } : r.layout.theme } } : r;
  }) };
}
// The backdrop is drawn twice: as the page's CSS (what shows while the scene changes) and inside the 3D canvas as the
// scene's background, so the canvas is opaque. A see-through canvas let the browser lay the page under the faded edges
// (the floor running off past the walls), and those half-clear pixels came out over-bright: the pale halo under every
// room, in the old look too. The post pass already leaves the background out of the outline IDs.
// the shop's own little icon, printed faint in a staggered grid over the backdrop (like a shop's wallpaper or bag)
function skyPattern(x, { icon, ink }) {
  x.save(); x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = 2.2; x.lineCap = 'round';
  const draw = (cx0, cy0) => {
    x.save(); x.translate(cx0, cy0); x.scale(.78, .78); const cx = 0, cy = 0;
    if (icon === 'cup') {
      x.beginPath(); x.moveTo(cx - 8, cy - 5); x.lineTo(cx + 7, cy - 5); x.lineTo(cx + 6, cy + 7); x.quadraticCurveTo(cx - .5, cy + 10, cx - 7, cy + 7); x.closePath(); x.fill();
      x.beginPath(); x.arc(cx + 8.5, cy, 3.6, -1.3, 1.3); x.stroke();
      for (const dx of [-3, 2.5]) { x.beginPath(); x.moveTo(cx + dx, cy - 8); x.quadraticCurveTo(cx + dx + 3, cy - 11, cx + dx, cy - 14); x.stroke(); }
      x.fillRect(cx - 10, cy + 10, 19, 2);
    } else if (icon === 'shirt') {
      x.beginPath(); x.moveTo(cx - 4, cy - 10); x.quadraticCurveTo(cx, cy - 6, cx + 4, cy - 10); x.lineTo(cx + 12, cy - 6); x.lineTo(cx + 9, cy);
      x.lineTo(cx + 6, cy - 2); x.lineTo(cx + 6, cy + 10); x.lineTo(cx - 6, cy + 10); x.lineTo(cx - 6, cy - 2); x.lineTo(cx - 9, cy); x.lineTo(cx - 12, cy - 6); x.closePath(); x.fill();
    } else {   // 삼각김밥
      x.beginPath(); x.moveTo(cx, cy - 10); x.quadraticCurveTo(cx + 2, cy - 11, cx + 11, cy + 6); x.quadraticCurveTo(cx + 11, cy + 9, cx + 8, cy + 9);
      x.lineTo(cx - 8, cy + 9); x.quadraticCurveTo(cx - 11, cy + 9, cx - 11, cy + 6); x.quadraticCurveTo(cx - 2, cy - 11, cx, cy - 10); x.closePath(); x.fill();
      x.fillRect(cx - 5, cy + 1, 10, 8);
    }
    x.restore();
  };
  for (let row = 0, y = 14; y < 530; row++, y += 38) for (let xx = row % 2 ? 0 : 22; xx < 280; xx += 44) draw(xx, y);
  x.restore();
}
// the neighbours' rooftops (20판 옥상): two rows of flat-roofed blocks across the bottom of the backdrop, the far row fainter;
// on some a little tank, an antenna or a rooftop room — all one colour, only a shade off the sky
function skyLine(x, { ink, tank }) {
  let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (const [top, a, hv] of [[300, .13, 46], [350, .2, 60]]) {
    x.globalAlpha = a; let px = -6;
    while (px < 262) {
      const w = 22 + R() * 34, y = top + R() * hv - hv / 2;
      x.fillStyle = ink; x.fillRect(px, y, w + .5, 520 - y);
      const r = R();
      if (r < .3) { x.fillStyle = tank; x.beginPath(); x.ellipse(px + w * .6, y - 5, 5, 6, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = ink; x.fillRect(px + w * .6 - 4, y - 2, 8, 2); }
      else if (r < .52) x.fillRect(px + w * .15, y - 10, w * .4, 10);
      else if (r < .68) { x.fillRect(px + w * .7, y - 16, 1.2, 16); x.fillRect(px + w * .7 - 4, y - 13, 9, 1.2); }
      x.globalAlpha = a * .7; x.fillStyle = '#fff6ea';
      for (let k = 0; k < 3; k++) if (R() < .5) x.fillRect(px + 4 + k * (w - 8) / 3, y + 8 + R() * 14, 3, 4);
      x.globalAlpha = a; px += w + R() * 3;
    }
  }
  x.globalAlpha = 1;
}
// soft white clouds over the backdrop, more of them low down (the 기차 객실 floats over them)
// a night sky (포근한 밤): small soft stars over the top half, a few brighter twinkles, a round cream moon high on the left
function skyStars(x) {
  let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) { const px = R() * 256, py = R() * 250, r = R() < .15 ? 1.6 : .9; x.fillStyle = `rgba(255,248,226,${.45 + R() * .5})`; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
  for (let i = 0; i < 6; i++) { const px = 20 + R() * 216, py = 18 + R() * 190, s = 3 + R() * 2; x.strokeStyle = 'rgba(255,246,214,.85)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px - s, py); x.lineTo(px + s, py); x.moveTo(px, py - s); x.lineTo(px, py + s); x.stroke(); }
  const g = x.createRadialGradient(58, 70, 4, 58, 70, 46); g.addColorStop(0, 'rgba(255,240,200,.45)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 140, 140);
  x.fillStyle = '#fff3d2'; x.beginPath(); x.arc(58, 70, 15, 0, 7); x.fill();
  x.fillStyle = 'rgba(232,214,170,.55)'; for (const [dx, dy, r] of [[-5, -3, 3], [4, 4, 2.2], [3, -6, 1.6]]) { x.beginPath(); x.arc(58 + dx, 70 + dy, r, 0, 7); x.fill(); }
}
function skyClouds(x) {
  let sd = 7; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) {
    const cx = R() * 300 - 20, cy = 40 + Math.pow(R(), .6) * 470, s = 14 + R() * 22;
    x.globalAlpha = .55 + R() * .35; x.fillStyle = '#ffffff';
    for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx + (k - 2) * s * .7, cy - (k % 2) * s * .35, s * (k === 2 ? 1 : .75), s * (k === 2 ? .8 : .6), 0, 0, Math.PI * 2); x.fill(); }
  }
  x.globalAlpha = 1;
}
// rain falling over a night backdrop: thin slanted streaks, a few brighter, drawn once (no animation — 실폰 발열)
function skyRain(x) {
  let sd = 13; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  x.save(); x.lineCap = 'round';
  for (let i = 0; i < 260; i++) { const px = R() * 280 - 12, py = R() * 520, L = 10 + R() * 16; x.strokeStyle = R() < .15 ? 'rgba(220,235,255,.45)' : 'rgba(180,200,240,.22)'; x.lineWidth = R() < .2 ? 1.2 : .8; x.beginPath(); x.moveTo(px, py); x.lineTo(px - L * .18, py + L); x.stroke(); }
  x.restore();
}
let SKY_TEX = null;
export function setSky(sky) {
  const app = document.getElementById('app'), W = typeof G !== 'undefined' ? G.world : null;
  if (SKY_TEX) { if (W && W.scene.background === SKY_TEX) W.scene.background = null; SKY_TEX.dispose(); SKY_TEX = null; }
  if (!sky) { app?.classList.remove('look-sky'); W?.dirty?.invalidate(); return; }
  if (app) { app.style.setProperty('--skyA', sky[0]); app.style.setProperty('--skyB', sky[1]); app.style.setProperty('--skyC', sky[2]); app.classList.add('look-sky'); }
  if (W) {
    // (a printed wallpaper needs the pixels: a pattern sky is drawn at twice the size, in the same 256×512 units)
    const k2 = sky.pattern ? 2 : 1, c = document.createElement('canvas'); c.width = 256 * k2; c.height = 512 * k2;
    const x = c.getContext('2d'); x.scale(k2, k2);
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, sky[0]); g.addColorStop(.42, sky[1]); g.addColorStop(1, sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    if (sky.pattern) skyPattern(x, sky.pattern);
    if (sky.skyline) skyLine(x, sky.skyline);
    if (sky.clouds) skyClouds(x);
    if (sky.stars) skyStars(x);
    if (sky.rain) skyRain(x);
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
    if (R.rim) this.buildRim(R.rim);   // (with or without a lake round it)
    if (R.block) this.buildBlock(R.block);
    else if (!ring && LOOK.has('light') && R.sky) this.tintAprons();   // (as before for every older room: a ring of ground and no tint)
    // (not on a seamless meadow: the map is no island there, and the dark rim drew its square back — user 10/19 "저 경계 남는것도 짜증나는데")
    // the rooms the shop pieces go into: the room itself, or each room of a map that names its own recipe (상가 맵:
    // the konbini half and the laundry half, each in its own colours)
    this.subs = this.isMap ? (stage.room.rooms || []).filter(r => r.L.lookKey && RECIPES[r.L.lookKey]).map(r => [r, RECIPES[r.L.lookKey]]) : [[this.room, R]];
    if (LOOK.has('light') && R.slab && !ring) this.buildSlab();
    else if (LOOK.has('light') && R.sky && R.shadow !== false && !(ring && R.ground?.seamless)) this.contactShadow(ring);
    if (LOOK.has('light')) this.clipSunPatches();
    if (LOOK.has('light') && R.sky) this.toneWalls();
    if (LOOK.has('ring') && R.ring) this.buildRing();
    this.filled = [];
    if (LOOK.has('fill')) for (const [rm, S] of this.subs) { if (S.band) this.buildBand(rm, S.band); if (S.wall) this.buildWallDecor(rm, S.wall); if (S.fill) this.buildFill(rm, S.fill); }
    if (this.filled.length || this.wallPieces?.length) this.clearSightlines();
    if (LOOK.has('glow') && stage.spec.night) { if (R.glows && (!this.isMap || R.mapGlows)) this.buildGlows(); else this.nightLights(); }
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
    const base = this.fadePlane(walk, -SS / 2, SS / 2, -SS / 2, SS / 2, f0, f1, G.y ?? -.012, G.walk || G.kind ? [0, 0] : [-w / 2, d / 2], G.seamless ? 256 : 128);
    if (G.seamless) { base.userData.floor = true; base.userData.inkLayer = true; }
    this.groundPlane = base;
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

  // the cake slab room.js builds for a room that does not bleed, under a bleed room (whose camera fit stays as it was):
  // its fading floor goes, the room stands on a base in its own colour
  // an island's edge (호수 섬, user refs 10/20: "바위나 흙 둘레가 두껍게 보이는 단면"): a band of earth under the floor's rim
  // going down into the water, ringed by rounded stones of two greys — one merged mesh, outlined as one shape
  buildRim(o) {
    for (const ap of this.aprons()) ap.visible = false;   // (the see-through ground at y 0 was drawn over the boulders below it: pale blobs round the foot)
    const r = this.room, w = r.w, d = r.d, p = r.group.position, H = o.h ?? .42, y0 = -H, rc = Math.min(o.round || 0, w / 2 - .5, d / 2 - .5);
    const rng = n => ((Math.sin(n * 127.1) * 43758.5453) % 1 + 1) % 1, EARTH = o.earth || '#b98c5e';
    const list = [], c = new THREE.Color(), push = (g, col, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => {
      g = g.index ? g.toNonIndexed() : g; g.scale(sx, sy, sz); g.rotateY(ry); g.translate(x, y, z);
      // (faces turned down are darkened: the hemisphere light's bright ground colour lit the boulders' undersides as pale blobs
      // round the island's foot — 10/21)
      const n = g.attributes.position.count, a = new Float32Array(n * 3), nr = g.attributes.normal; c.set(col);
      for (let i = 0; i < n; i++) { const k = 1 + (nr ? Math.min(0, nr.getY(i)) : 0) * .75; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
      list.push(g);
    };
    // the shoreline: the map's rectangle with its corners rounded off (radius rc), a little outside the floor's edge
    const hx = w / 2 + .04, hz = d / 2 + .04, path = [];
    const corner = (cx, cz, a0) => { for (let k = 0; k <= 8; k++) { const a = a0 + k / 8 * HP; path.push([cx + Math.cos(a) * rc, cz + Math.sin(a) * rc]); } };
    if (rc > 0) { corner(hx - rc, hz - rc, 0); corner(-hx + rc, hz - rc, HP); corner(-hx + rc, -hz + rc, PI); corner(hx - rc, -hz + rc, PI * 1.5); }
    else path.push([hx, hz], [-hx, hz], [-hx, -hz], [hx, -hz]);
    // the earth band under it, down into the water
    const sh = new THREE.Shape(path.map(([x, z]) => new THREE.Vector2(x, z)));
    const eg = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false, curveSegments: 4 }); eg.rotateX(HP); eg.computeVertexNormals();
    push(eg, EARTH, p.x, -.004, p.z);
    // big rounded boulders all round the shore (island C안: grey stones, some with moss on top), a lower half-sunk row
    // outside them, a soft grass lip along the top so the lawn rolls over the edge instead of ending on a line
    let k = 0;
    const MOSS = o.moss || '#8fcf6a', GRASS = o.grass || '#97d872';
    for (let i = 0; i < path.length; i++) {
      const [x0, z0] = path[i], [x1, z1] = path[(i + 1) % path.length], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / (o.big ? .62 : .42)));
      for (let q = 0; q < n; q++, k++) {
        const t = q / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, nl = Math.hypot(x, z) || 1;
        const s = o.big ? .3 + rng(k) * .16 : .2 + rng(k) * .12, col = rng(k + 50) < .5 ? (o.stone || '#c9c2d8') : (o.stone2 || '#b1a9c4');
        const sx = p.x + x + x / nl * (o.big ? .08 : 0), sz = p.z + z + z / nl * (o.big ? .08 : 0), sy = y0 + (o.big ? .3 : .14) + rng(k + 9) * .08;
        push(new THREE.SphereGeometry(1, 9, 6), col, sx, sy, sz, s * 1.25, s * .95, s * 1.1, rng(k + 3) * 3);
        if (o.big) push(new THREE.SphereGeometry(1, 8, 5), shade(col, .12), sx - s * .15, sy + s * .45, sz - s * .1, s * .7, s * .4, s * .65, rng(k + 3) * 3);   // (a lighter top: rounded stone, not a lump)
        if (o.big && rng(k + 70) < .45) push(new THREE.SphereGeometry(1, 10, 6), MOSS, sx, sy + s * .62, sz, s * .85, s * .35, s * .8, rng(k + 5) * 3);
        if (o.big && o.lowRow !== false && q % 2 === 0) { const ox = x / nl * .45, oz = z / nl * .45, s2 = .2 + rng(k + 11) * .12; push(new THREE.SphereGeometry(1, 10, 7), o.stone2 || '#b1a9c4', sx + ox, y0 + .02, sz + oz, s2 * 1.3, s2 * .8, s2 * 1.1, rng(k + 13) * 3); }
        if (o.big) push(new THREE.SphereGeometry(1, 8, 6), rng(k + 21) < .5 ? GRASS : shade(GRASS, -.08), p.x + x * .985, .01, p.z + z * .985, .2 + rng(k + 17) * .08, .08, .2, 0);
      }
    }
    // the fringe (the C·D안 density): hydrangea balls, white daisy mounds and ferns all along the shore just inside the
    // stones — the picture's lush edge — skipping where something stands (o.fringeSkip: [x, z, r] in room coordinates)
    if (o.fringe) {
      const skip = o.fringeSkip || [], HY = ['#9fb3ff', '#c39bff', '#ffb3d6', '#8fd0ff'];
      let q = 0;
      for (let i = 0; i < path.length; i++) {
        const [x0, z0] = path[i], [x1, z1] = path[(i + 1) % path.length], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .4));
        for (let m = 0; m < n * 2; m++, q++) {
          const row = m % 2, t = (Math.floor(m / 2) + row * .5) / n, ex = x0 + (x1 - x0) * t, ez = z0 + (z1 - z0) * t, nl = Math.hypot(ex, ez) || 1, ins = row ? .62 : .28, x = ex - ex / nl * ins, z = ez - ez / nl * ins;
          if (row && q % 3 === 2) continue;   // (the inner row thinner)
          if (skip.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr)) continue;
          const kind = q % 3, bx = p.x + x, bz = p.z + z;
          if (o.fringe === 'tidy') {   // (섬 3차 10/21, 확대하면 "지저분"): one row along the lawn's edge — low leafy tufts, a hydrangea
            // only every fourth place, nothing piled on the stones
            if (row) continue;
            const r = .13 + (q % 3) * .02;
            if (q % 8 === 0) { push(new THREE.SphereGeometry(1, 8, 6), '#5cb45a', bx, .1, bz, .24, .15, .24); const c = HY[(q >> 3) % HY.length];
              for (let k = 0; k < 7; k++) { const a = k * 2.4, rr = k ? .09 : 0; push(new THREE.SphereGeometry(.08, 7, 5), k % 2 ? c : shade(c, .12), bx + Math.cos(a) * rr, .25 + (k ? 0 : .05), bz + Math.sin(a) * rr); } }
            else if (q % 2 === 0) for (const [dx, dz, s, c] of [[0, 0, 1, '#6cbf5a'], [-.1, .05, .7, '#7fcf6a']]) push(new THREE.SphereGeometry(1, 10, 7), c, bx + dx, r * .6 * s, bz + dz, r * s * 1.1, r * s * .7, r * s);
            continue;
          }
          if (o.fringe === 'bush') {   // (station 3차 10/21, user "덩어리가 겹쳐… 똥 싼 거 같다"): a tidy leafy tuft standing OUT on the shore
            // stones, not on the floor — one outer row only, smooth, every second one, so nobody stands in it
            if (row || q % 2) continue;
            if (Math.abs(ex) < w / 2 - .02 && Math.abs(ez) < d / 2 - .02) continue;   // (a rounded corner runs inside the floor: no tuft where someone may stand)
            const ox = p.x + ex + ex / nl * .02, oz = p.z + ez + ez / nl * .02, r = .17 + (q % 3) * .03;
            for (const [dx, dz, s, c] of [[0, 0, 1, '#6cbf5a'], [-.12, .06, .75, '#7fcf6a'], [.12, -.05, .7, '#5aa84a']]) push(new THREE.SphereGeometry(1, 12, 9), c, ox + dx, r * .8 * s, oz + dz, r * s * 1.1, r * s * .85, r * s * 1.05);
            if (q % 4 === 0) for (let k = 0; k < 3; k++) push(new THREE.SphereGeometry(.03, 6, 4), '#ffffff', ox + Math.cos(k * 2.1) * r * .6, r * 1.45, oz + Math.sin(k * 2.1) * r * .6);
            continue;
          }
          if (kind === 0) {   // hydrangea: leaves, then a ball of little florets in one colour
            push(new THREE.SphereGeometry(1, 8, 6), '#5cb45a', bx, .12, bz, .3, .18, .3); const c = HY[(q >> 1) % HY.length];
            for (let k = 0; k < 9; k++) { const a = k * 2.4, r = k ? .11 : 0; push(new THREE.SphereGeometry(.095, 7, 5), k % 2 ? c : shade(c, .12), bx + Math.cos(a) * r, .3 + (k ? 0 : .06), bz + Math.sin(a) * r); }
          } else if (kind === 1) {   // a daisy mound
            push(new THREE.SphereGeometry(1, 8, 6), '#7fcf6a', bx, .1, bz, .28, .2, .28);
            for (let k = 0; k < 7; k++) { const a = k * 1.3, r = .07 + (k % 2) * .09; push(new THREE.CylinderGeometry(.055, .055, .012, 8), '#ffffff', bx + Math.cos(a) * r, .26, bz + Math.sin(a) * r); push(new THREE.SphereGeometry(.022, 5, 4), '#ffd23f', bx + Math.cos(a) * r, .272, bz + Math.sin(a) * r); }
          } else {   // a fern: a fan of long flat leaves
            for (let k = 0; k < 7; k++) { const g = new THREE.ConeGeometry(.07, .55, 4); g.rotateZ(.85); g.rotateY(k * .9); push(g, k % 2 ? '#4fa64f' : '#6cbf5a', bx, .2, bz, 1, 1, 1); }
          }
        }
      }
    }
    // (o.cornerFill, 섬 3차): a few more stones out round each rounded corner, low, so no lake shows between them at floor level
    if (o.cornerFill && rc > 0) for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) for (let m = 0; m < 5; m++) {
      const a = (m + .5) / 5 * HP, ax = sx * (w / 2 - rc + Math.cos(a) * (rc + .28)), az = sz * (d / 2 - rc + Math.sin(a) * (rc + .28)), s = .26 + rng(m * 7 + sx * 3 + sz) * .1, col = m % 2 ? (o.stone || '#c9c2d8') : (o.stone2 || '#b1a9c4');
      push(new THREE.SphereGeometry(1, 9, 6), col, p.x + ax, -.08 + rng(m + 2) * .06, p.z + az, s * 1.3, s * .8, s * 1.15, rng(m + sx) * 3);
    }
    // little clumps of white and yellow flowers on the lawn (o.flowers: [x, z, n])
    for (const [x, z, n] of o.flowers || []) for (let m = 0; m < n; m++) { const a = m * 2.4, r = .08 + (m % 3) * .07; push(new THREE.SphereGeometry(.035, 6, 5), m % 3 ? '#ffffff' : '#ffe27a', p.x + x + Math.cos(a) * r, .045, p.z + z + Math.sin(a) * r); push(new THREE.SphereGeometry(.05, 6, 4), '#6cbf5a', p.x + x + Math.cos(a) * r, .02, p.z + z + Math.sin(a) * r, 1, .5, 1); }
    // stepping stones across the lawn (o.path: [x, z] in the room's own coordinates)
    for (const [x, z] of o.path || []) push(new THREE.CylinderGeometry(.17, .19, .04, 9), '#d6d0dc', p.x + x, .02, p.z + z, 1, 1, .8, rng(x * 7 + z) * 3);
    // the lake's plants (o.lilies: how many clumps): lily pads, a few lotus flowers, cattails, scattered round the shore
    for (let q = 0; q < (o.lilies || 0); q++) {
      const a = rng(q * 3.1 + 1) * PI * 2, rr = Math.max(w, d) / 2 + .6 + rng(q * 5.3 + 2) * 2.2, cx = p.x + Math.cos(a) * rr * (w / Math.max(w, d)) * 1.05, cz = p.z + Math.sin(a) * rr * (d / Math.max(w, d)) * 1.05, wy = (this.R.ground?.y ?? -.3) + .012;
      const kind = rng(q * 9.7 + 4);
      if (kind < .62) { for (let m = 0; m < 3; m++) { const r = .17 + rng(q * 11 + m) * .1; push(new THREE.CylinderGeometry(r, r, .015, 14, 1, false, .3, PI * 1.8), m % 2 ? '#7fcf6a' : '#5cb45a', cx + (m - 1) * .3, wy, cz + ((m * 7) % 3 - 1) * .22, 1, 1, 1, rng(q + m) * 6); }
        if (kind < .3) { for (let m = 0; m < 6; m++) { const aa = m / 6 * PI * 2; push(new THREE.SphereGeometry(.06, 8, 6), '#ffb3cf', cx + Math.cos(aa) * .06, wy + .07, cz + Math.sin(aa) * .06, .7, 1, 1.4, -aa); } push(new THREE.SphereGeometry(.045, 8, 6), '#ffe27a', cx, wy + .09, cz); } }
      else for (let m = 0; m < 3; m++) { const ox = (m - 1) * .09, h = .5 + rng(q * 13 + m) * .3; push(new THREE.CylinderGeometry(.012, .016, h, 5), '#6aa85a', cx + ox, wy + h / 2, cz + m * .05); push(new THREE.CapsuleGeometry(.03, .12, 2, 6), '#8b5e3c', cx + ox, wy + h - .02, cz + m * .05); }
    }
    const g = mergeGeometries(list); list.forEach(q => q.dispose());
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }));
    m.userData.og = {}; m.receiveShadow = true; m.castShadow = false; this.group.add(m); this.own.push(g, m.material);
    // the floor's square corners outside the rounded shore: covered with the lake itself (the ground plane's own material
    // and texture coordinates, a hair above the floor), so the island reads round — user 10/20 "바닥에 네모가 싫은가봐"
    const gp = this.groundPlane; if (!rc || !gp) return;
    const GW = gp.geometry.parameters.width, GD = gp.geometry.parameters.height, gx0 = gp.position.x - GW / 2, gz1 = gp.position.z + GD / 2;
    const pos = [], uv = [], put3 = (x, z) => { pos.push(p.x + x, .03, p.z + z); uv.push((p.x + x - gx0) / GW, (gz1 - (p.z + z)) / GD); };
    for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const cx = sx * (w / 2), cz = sz * (d / 2), ax = sx * (w / 2 - rc), az = sz * (d / 2 - rc);
      for (let q = 0; q < 8; q++) {
        const a0 = q / 8 * HP, a1 = (q + 1) / 8 * HP;
        put3(cx, cz); put3(ax + sx * Math.cos(a0) * rc, az + sz * Math.sin(a0) * rc); put3(ax + sx * Math.cos(a1) * rc, az + sz * Math.sin(a1) * rc);
      }
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cg.computeVertexNormals();
    const cm = new THREE.Mesh(cg, gp.material); cm.material.side = THREE.DoubleSide; cm.renderOrder = 2; cm.userData.noOcclude = true; cm.layers.set(2);
    this.group.add(cm); this.own.push(cg);
  }
  // a diorama block (user refs 10/20: the pharmacy corner, the grocery — "네모로 넣을거면 이것도 참조"): the map stands on
  // a thick block whose sides show its layers — a pale kerb lip, a band of stone, then earth — so the square reads as a
  // little world cut out and set on the table, not a floor plane floating on the backdrop
  buildBlock(o) {
    for (const ap of this.aprons()) ap.visible = false;
    // (G1 10/21: a map of several rooms stands on one block round all its ground-floor rooms, like buildSlab)
    let w, d, p;
    if (this.isMap) {
      const b = new THREE.Box3(), v = new THREE.Vector3();
      for (const q of this.room.rooms.filter(q => !q.level)) { const qp = q.group.position; b.expandByPoint(v.set(qp.x - q.w / 2, 0, qp.z - q.d / 2)); b.expandByPoint(v.set(qp.x + q.w / 2, 0, qp.z + q.d / 2)); }
      w = b.max.x - b.min.x; d = b.max.z - b.min.z; p = { x: (b.min.x + b.max.x) / 2 - this.group.position.x, z: (b.min.z + b.max.z) / 2 - this.group.position.z };
    } else { w = this.room.w; d = this.room.d; p = this.room.group.position; }
    const list = [], c = new THREE.Color();
    const push = (g, col, x, y, z) => {
      g = g.index ? g.toNonIndexed() : g; g.translate(x, y, z);
      const n = g.attributes.position.count, a = new Float32Array(n * 3); c.set(col);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
      list.push(g);
    };
    let y = 0;
    for (const L of o.layers) { push(new THREE.BoxGeometry(w + (L.out || 0) * 2, L.h, d + (L.out || 0) * 2), L.color, p.x, y - L.h / 2 - .002, p.z); y -= L.h; }
    // stones set in the stone band, staggered, a shade darker — the band reads as masonry
    const S = o.layers.find(L => L.stones); if (S) {
      let yy = 0; for (const L of o.layers) { if (L === S) break; yy -= L.h; }
      const rows = Math.max(1, Math.round(S.h / .12)), hh = S.h / rows, ox = w / 2 + (S.out || 0) + .004, oz = d / 2 + (S.out || 0) + .004;
      for (let q = 0; q < rows; q++) {
        const yc = yy - hh * (q + .5);
        for (let x = -ox + (q % 2 ? .2 : 0); x < ox - .1; x += .4) { push(new THREE.BoxGeometry(Math.min(.34, ox - x - .02), hh * .78, .02), shade(S.color, -.07), p.x + x + .17, yc, p.z + oz); }
        for (let z = -oz + (q % 2 ? .2 : 0); z < oz - .1; z += .4) { push(new THREE.BoxGeometry(.02, hh * .78, Math.min(.34, oz - z - .02)), shade(S.color, -.11), p.x + ox, yc, p.z + z + .17); }
      }
    }
    const g = mergeGeometries(list); list.forEach(q => q.dispose());
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }));
    m.userData.og = {}; m.receiveShadow = true; m.castShadow = false; this.group.add(m); this.own.push(g, m.material);
  }
  buildSlab() {
    for (const ap of this.aprons()) ap.visible = false;
    const RS = this.isMap ? this.room.rooms.filter(r => !r.level) : [this.room], b = new THREE.Box3(), v = new THREE.Vector3();
    for (const r of RS) { const p = r.group.position; b.expandByPoint(v.set(p.x - r.w / 2, 0, p.z - r.d / 2)); b.expandByPoint(v.set(p.x + r.w / 2, 0, p.z + r.d / 2)); }
    const T = RS[0].T, sx = b.max.x - b.min.x, sz = b.max.z - b.min.z, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, og = {};
    const a = put(rbox(sx + .5, .36, sz + .5, T.base, .16), cx, -.2, cz), c = put(rbox(sx + .62, .2, sz + .62, shade(T.base, -.08), .1), cx, -.4, cz);
    // (a map's group stands at the world origin, a lone room's too: both pieces go in world coordinates)
    for (const o of [a, c]) { o.userData.og = og; o.receiveShadow = true; o.castShadow = false; this.room.group.add(o); }
  }
  // the strip round the top of the solid walls (TUTU's awning stripes; a café's moulding), part of each wall's decor so it
  // goes when the wall folds down
  buildBand(room, B) {
    const WH = room.L.wallH || 2.9;
    let map = null;
    if (B.stripes) {
      const c = document.createElement('canvas'); c.width = 32 * B.stripes.length; c.height = 8;
      const x = c.getContext('2d'); B.stripes.forEach((col, k) => { x.fillStyle = col; x.fillRect(k * 32, 0, 32, 8); });
      map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = THREE.RepeatWrapping; map.magFilter = THREE.NearestFilter; this.own.push(map);
    }
    for (const k of ['N', 'W', 'E', 'S']) {
      const wl = room.walls[k]; if (!wl || !['wall', 'door'].includes(room.L.walls?.[k] || 'wall')) continue;
      const og = {}, len = wl.len, y = WH - .05 - B.h / 2;
      let m;
      if (map) { const t = map.clone(); t.needsUpdate = true; t.repeat.set(len / (.16 * B.stripes.length), 1); this.own.push(t); m = mat('#ffffff', { map: t, rough: .9, rim: .1 }); }
      else m = mat(B.color, { rough: .85, rim: .1 });
      const band = new THREE.Mesh(new THREE.BoxGeometry(len, B.h, .03), m); band.position.set(0, y, .017); band.userData.og = og;
      const trim = rbox(len, .045, .06, B.trim, .015); put(trim, 0, y - B.h / 2 - .02, .03); trim.userData.og = og;
      for (const o of [band, trim]) { o.castShadow = false; o.receiveShadow = true; wl.decor.add(o); }
      if (B.bulbs) {   // a string of little bulbs in shallow loops just under the moulding (a café's 꼬마전구)
        const spans = Math.max(2, Math.round(len / 1.1)), y0 = y - B.h / 2 - .07, P = (a, b, t) => new THREE.Vector3(a + (b - a) * t, y0 - .13 * 4 * t * (1 - t), .06);
        const pts = [], bulbs = [];
        for (let k = 0; k < spans; k++) {
          const a = -len / 2 + .15 + k * (len - .3) / spans, b = a + (len - .3) / spans;
          for (let i = k ? 1 : 0; i <= 8; i++) pts.push(P(a, b, i / 8));
          for (const t of [.22, .5, .78]) { const q = P(a, b, t), g = new THREE.SphereGeometry(.045, 10, 8); g.scale(1, 1.2, 1); g.translate(q.x, q.y - .055, q.z); bulbs.push(g); }
        }
        const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, .006, 4), mat('#5b3a26', { rough: .9, rim: 0 }));
        const lit = new THREE.Mesh(mergeGeometries(bulbs), mat('#fff6d0', { emissive: '#ffd27a', ei: 1.4, rim: 0 })); bulbs.forEach(g => g.dispose());
        wire.castShadow = false; wire.userData.og = og;
        lit.castShadow = false; lit.layers.set(2);   // no ink round a bulb (it read as a black dot): drawn in colour only
        wl.decor.add(wire, lit);
      }
    }
  }
  // shop things on the bare walls (no spots: nothing hides in them); a piece is skipped where the room already hung
  // something within its reach (a lever the planner mounted, the layout's own posters and doors)
  buildWallDecor(room, list) {
    for (const [type, k, u, opts] of list) {
      const wl = room.walls[k]; if (!wl || !FURN_INFO[type] || !['wall', 'door'].includes(room.L.walls?.[k] || 'wall')) continue;   // (a map's open side has no wall)
      const half = (FURN_INFO[type].span || 1) / 2 + (FURN_INFO[type].pad ?? .35);
      // (high: a piece up by the wall top, over whatever hangs lower — the washing line)
      if (!FURN_INFO[type].high && room.decors.some(d => d.wall === k && Math.abs(d.u - u) < half)) continue;
      const f = makeFurniture(type, room.T || this.T, opts);
      f.group.position.set(u, 0, 0); f.group.userData.lookFill = true;
      f.group.traverse(o => { if (o.isMesh) o.castShadow = false; });
      wl.decor.add(f.group); (this.wallPieces ||= []).push({ g: f.group, wl });
    }
  }
  // Nothing the look adds may hide a hidden thing: from 12 headings at two pitches round the start view, a sight line to
  // each hidden thing that a fill or wall piece cuts first (before the room's own furniture would) takes that piece away.
  // The things are placed by a seed, so this runs on every stage start (review 10/19: the 12-ray check, 0 of 12).
  clearSightlines() {
    const items = (this.stage.items || []).filter(it => it.g && !it.vacHidden); if (!items.length) return;
    const rooms = this.room.rooms || [this.room], pieces = [...this.filled.map(g => ({ g })), ...(this.wallPieces || [])];
    const ofPiece = new Map(), skip = new Set(), others = [], lay = new THREE.Layers(); lay.set(0); lay.enable(2);
    for (const pc of pieces) { pc.ms = []; pc.g.traverse(m => { if (m.isMesh) { pc.ms.push(m); ofPiece.set(m, pc); } }); }
    for (const r of rooms) for (const k in r.walls) r.walls[k].g.traverse(m => skip.add(m));
    for (const it of items) it.g.traverse(m => skip.add(m));
    this.room.group.updateMatrixWorld(true);
    this.room.group.traverse(m => { if (m.isMesh && m.visible && !ofPiece.has(m) && !skip.has(m) && !m.userData.floor && m.layers.test(lay)) others.push(m); });
    const rc = new THREE.Raycaster(), p = new THREE.Vector3(), d = new THREE.Vector3(), o = new THREE.Vector3(), c = new THREE.Vector3(), bad = new Set();
    for (const it of items) {
      it.g.getWorldPosition(p); p.y += .08;
      for (const pitch of [.5, .75]) for (let k = 0; k < 12; k++) {
        const yaw = k * Math.PI / 6; c.set(Math.sin(yaw), 0, Math.cos(yaw)); d.set(c.x * Math.cos(pitch), Math.sin(pitch), c.z * Math.cos(pitch));
        // a wall piece only counts while its wall stands (a wall on the camera's side folds down and its pieces go)
        const ms = []; for (const pc of pieces) if (!bad.has(pc) && !(pc.wl && pc.wl.tall && pc.wl.n.dot(c) < -.18)) ms.push(...pc.ms);
        if (!ms.length) continue;
        rc.set(o.copy(p).addScaledVector(d, 12), d.clone().negate()); rc.far = 11.95;
        const hl = rc.intersectObjects(ms, false)[0]; if (!hl) continue;
        const ho = rc.intersectObjects(others, false)[0];
        if (!ho || hl.distance < ho.distance) bad.add(ofPiece.get(hl.object));
      }
    }
    for (const pc of bad) { pc.g.parent?.remove(pc.g); this.filled = this.filled.filter(g => g !== pc.g); }
    this.cleared = bad.size;
  }
  buildFill(room, list) {
    const st = this.stage, ox = room.group.position.x, oz = room.group.position.z;   // (a map's room: its fill is laid out round its own middle)
    // never next to something hidden, the friend, or where the layout says the friend stands
    const keep = [];
    const v = new THREE.Vector3();
    for (const it of st.items || []) { it.g.getWorldPosition(v); keep.push([v.x, v.z]); }
    const fa = st.layout?.friendAt; if (fa) keep.push([fa[0], fa[1]]);
    room.group.updateMatrixWorld(true);
    for (const e of list) {
      if (!FURN_INFO[e.furn]) continue;
      // door: a mat just inside the layout's door on that wall (layout edits move doors about)
      let ex = e.x, ez = e.z, ery = e.ry || 0;
      if (e.door) {
        const dr = room.decors.find(q => q.type === 'door' && q.wall === e.door), wl = room.walls[e.door]; if (!dr || !wl) continue;
        const p = wl.g.localToWorld(new THREE.Vector3(dr.u, 0, .42)); ex = p.x - ox; ez = p.z - oz; ery = wl.g.rotation.y;
      }
      if (keep.some(([x, z]) => Math.hypot(x - ox - ex, z - oz - ez) < .75)) continue;
      if (room.clearAt && !room.clearAt(ox + ex, oz + ez, .3)) continue;
      const f = makeFurniture(e.furn, (e.theme && THEMES[e.theme]) || room.T || this.T, e.opts);
      put(f.group, ex, 0, ez, 0, ery, 0, e.s || null);
      f.group.userData.lookFill = true;
      room.group.add(f.group); this.filled.push(f.group);
    }
  }

  buildGlows() {
    const tex = glowTex();
    for (const [x, z, r, c, y = .014] of this.R.glows || []) {   // (y: a pool on a raised floor — the station's platform)
      const m = new THREE.MeshBasicMaterial({ color: c, map: tex, transparent: true, opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m);
      p.rotation.x = -HP; p.position.set(x, y, z); p.renderOrder = 3; p.userData.noOcclude = true; p.layers.set(2);
      this.room.group.add(p);
    }
    // halos: [x, y, z, size, colour] — the soft glow round a lamp or a screen, colour only like nightLights' (18판 섞은 안 2차)
    for (const [x, y, z, sz, c] of this.R.halos || []) {
      const sm = new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
      const sp = new THREE.Sprite(sm); sp.position.set(x, y, z); sp.scale.setScalar(sz); sp.renderOrder = 4; sp.userData.noOcclude = true; sp.layers.set(2);
      this.room.group.add(sp); this.own.push(sm);
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
      // colour only, like the halo below: on layer 0 the pool went into the outline pass too — with no outline ID of its
      // own (added after the IDs were given out) it drew in whatever ID came before it, a 1.6 cm step over the floor; on
      // the phone that came out as red / green / black dots all over the lamp's light (10/20 실폰 9판 "변기 쪽도 이럼")
      p.layers.set(2);
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
          // colour only: a sprite on layer 0 went into the outline pass as a solid square — an inked card standing beside
          // the lamp (user, 9판 on a phone: "가장 왼쪽 스탠드 쪽에 이상한 플레인이 수직으로 있어")
          sp.layers.set(2);
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
// the soft disc of a lamp's light: white, fading out (kit.js fadeDisc — a canvas gradient came out speckled on the iPhone)
function glowTex() {
  return GLOW ||= fadeDisc(128, '#ffffff', r => r < .35 ? 1 - .45 * r / .35 : .55 * (1 - (r - .35) / .65));
}
// 18판 너굴이네 복층 (10/21): a rainy night outside, warm inside — the arcade screens, the CRT, the desk lamp and the fairy
// lights; no long shadows (the light colour and level only). The backdrop is the night sky with rain falling over it.
RECIPES.otakuloft = { light: { ambColor: '#efe9f6', amb: 1.2, sunColor: '#ffe8c8', sun: 2.0, shadow: .55 }, sky: ['#1a2036', '#252f4c', '#141a2c'], rain: true, itemSize: .38,
  night: { light: { ambColor: '#e9e4f6', amb: 1.15, sunColor: '#ffe2bc', sun: 1.8, shadow: .5 }, sky: Object.assign(['#141a2e', '#1f2842', '#10142a'], { rain: true }) },
  glows: [[.5, -2.0, 1.1, '#7cf0ff'], [1.5, -2.0, 1.1, '#ff6fb8'], [2.5, -2.0, 1.1, '#ffd27a'], [-2.6, -.6, 1.0, '#9fd8ff'], [-2.0, -2.6, .8, '#ffd98a', 1.66], [-1.6, -1.8, .9, '#ffd98a', 1.66], [-.6, .6, 1.2, '#ffcf8a']] };
// 18판 섞은 안 (gptotakumix, 10/22 사용자 "원본처럼 라이팅도 좀 주고"): otakuloft의 비 오는 밤 하늘·빛 그대로, 빛 웅덩이만 이 방 가구 자리에 —
// 오락기 둘(청록·분홍), 브라운관, 컴퓨터 모니터, 장스탠드, 복층 협탁 램프(데크 위 2.225), 비 오는 창(창가 벤치 위) 앞 달빛
// (mapGlows: 방 하나짜리 맵이라도 맵은 nightLights로 갔다 — 이 키만 자리 정한 빛으로)
// (2차 10/22 사용자 "약간 전체적으로 어둡게 … 어두운 판 9판(욕조 있는 방)처럼"): 빛은 9판 bunnybath 밤처럼 푸른 달빛으로 낮추고(amb 1.15→1.0,
// 해 1.8→.9), 하늘도 9판의 남보라 밤에 비; 대신 빛 웅덩이를 키우고 늘려(복층 밑 꼬마전구 띠, 창 앞 달빛) 램프·화면엔 번지는 빛(halos)을 —
// 어두운 바탕에 따뜻한 데가 또렷하게
RECIPES.gptotakumix = { ...RECIPES.otakuloft, mapGlows: true,
  night: { light: { ambColor: '#aab1ea', amb: 1.0, sunColor: '#d2d8ff', sun: .9, shadow: .5 }, sky: Object.assign(['#151a45', '#25286a', '#33316f'], { rain: true }) },
  glows: [[1.05, -1.65, 1.15, '#7cf0ff'], [1.85, -1.65, 1.15, '#ff6fb8'], [-1.3, -.1, 1.1, '#9fd8ff'], [2.95, .55, .95, '#cfe6ff'], [-2.2, -.2, 1.6, '#ffc278'],
    [-1.4, -2.05, 1.0, '#ffd98a', 2.225], [-2.35, .95, 1.15, '#7f9bff'], [-2.9, -.85, .8, '#ffd27a'], [.05, -.95, .75, '#ffd27a']],
  halos: [[1.05, 1.3, -2.05, .95, '#7cf0ff'], [1.85, 1.3, -2.05, .95, '#ff8fc8'], [-1.33, .8, -.5, .7, '#9fd8ff'], [-2.25, 1.3, -.36, 1.15, '#ffd98f'],
    [-1.38, 2.95, -2.4, .8, '#ffd98f'], [2.95, 1.05, .4, .6, '#cfe6ff']] };
