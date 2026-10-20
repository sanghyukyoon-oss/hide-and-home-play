// Home zones (modular expansion), shop catalog (furniture, wallpaper, paint, floors, zones) and the hideable items.
import { THEMES } from './stages.js';
import { FURN_INFO } from './gfx/furniture.js';

const MY = THEMES.my;

// What each kind of zone looks like by default; paint/floor purchases override parts of it.
export const ZONE_TYPES = {
  room: { name: '방', indoor: true, walls: { N: 'wall', W: 'wall', S: 'wall', E: 'wall' }, theme: MY,
    decor: [{ type: 'window', wall: 'N', u: .6 }, { type: 'clock', wall: 'W', u: 0 }], door: { wall: 'E', u: 0 } },
  storage: { name: '창고', indoor: true, walls: { N: 'wall', W: 'wall', S: 'wall', E: 'wall' },
    theme: { ...MY, base: '#c7a27c', wallKind: 'wood', wall: '#e9c99f', wall2: '#c99c6c', wainscot: '#b98a5c', floorKind: 'checker', floor: '#d9d4cc', floor2: '#c2bcb3', wallEdge: '#f3e2c9' },
    decor: [{ type: 'wallshelf', wall: 'N', u: -1.2 }, { type: 'clock', wall: 'W', u: 1.2 }], door: { wall: 'E', u: .4 } },
  yard: { name: '마당', indoor: false, walls: { N: 'fence', W: 'fence', S: 'none', E: 'none' },
    theme: { ...MY, base: '#b98a5c', floorKind: 'grass', floor: '#9be07f', floor2: '#7cc964', fence: '#ffffff', hedge: '#6fcf6a' }, decor: [] },
  park: { name: '공원', indoor: false, walls: { N: 'hedge', W: 'hedge', S: 'none', E: 'none' },
    theme: { ...MY, base: '#b98a5c', floorKind: 'grass', floor: '#a7e389', floor2: '#86cf6b', hedge: '#5fc463' }, decor: [] },
};

// The player's home: zones unlock by stage progress for free, or earlier by buying them.
export const HOME_ZONES = [
  { id: 'room1', type: 'room', name: '몽글이 방', unlock: { stage: 0, price: 0 } },
  { id: 'room2', type: 'room', name: '작은 방', unlock: { stage: 3, price: 400 } },
  { id: 'storage', type: 'storage', name: '창고', unlock: { stage: 6, price: 700 } },
  { id: 'yard', type: 'yard', name: '마당', unlock: { stage: 9, price: 1000 } },
  { id: 'park', type: 'park', name: '앞 공원', unlock: { stage: 14, price: 1600 } },
];

export const STARTER = {
  room1: [{ type: 'bed', i: 0, j: 0, rot: 0 }, { type: 'drawers', i: 1, j: 0, rot: 0 }, { type: 'plant', i: 4, j: 0, rot: 0 }, { type: 'chest', i: 0, j: 3, rot: 1 }, { type: 'rug', i: 2, j: 2, rot: 0 }],
  room2: [{ type: 'desk', i: 0, j: 0, rot: 0 }, { type: 'bookshelf', i: 2, j: 0, rot: 0 }, { type: 'rug', i: 2, j: 2, rot: 0 }],
  storage: [{ type: 'boxes', i: 0, j: 0, rot: 0 }, { type: 'boxes', i: 1, j: 0, rot: 0 }, { type: 'wardrobe', i: 4, j: 0, rot: 0 }],
  yard: [{ type: 'plant', i: 0, j: 0, rot: 0 }, { type: 'stool', i: 2, j: 2, rot: 0 }],
  park: [{ type: 'plant', i: 0, j: 0, rot: 0 }],
};

export const WALLPAPERS = [
  { id: 'wp-dots', name: '살구 도트', wallKind: 'dots', wall: '#fff8ee', wall2: '#ffe6c8', wainscot: '#ffe8cc', price: 0 },
  { id: 'wp-heart', name: '딸기 하트', wallKind: 'heart', wall: '#fff0f5', wall2: '#ffb1c6', wainscot: '#83d8c8', price: 120 },
  { id: 'wp-stripe', name: '레몬 줄무늬', wallKind: 'stripe', wall: '#fff8d9', wall2: '#ffe98f', wainscot: '#9fd8ff', price: 120 },
  { id: 'wp-star', name: '밤하늘 별', wallKind: 'star', wall: '#5d6bb5', wall2: '#ffe27a', wainscot: '#3f4b8f', price: 180 },
  { id: 'wp-check', name: '민트 체크', wallKind: 'check', wall: '#e9fbf4', wall2: '#bfeedd', wainscot: '#ffb7a6', price: 150 },
  { id: 'wp-flower', name: '꽃밭', wallKind: 'flower', wall: '#fff4fb', wall2: '#ff9ec2', wainscot: '#9be38f', price: 180 },
  { id: 'wp-wood', name: '통나무 판넬', wallKind: 'wood', wall: '#e9c99f', wall2: '#c99c6c', wainscot: '#b98a5c', price: 150 },
  { id: 'wp-tile', name: '하늘 타일', wallKind: 'tile', wall: '#eef8ff', wall2: '#c7e6ff', wainscot: '#8fd3ff', price: 150 },
  // 벽지·바닥 더하기 (10/20, user: "상점에 벽지랑 바닥 이것도 많이 … 많이많이 해 주라"): painted by patterns.js; `ch` = the chapter
  // they come into the shop (경제 켜짐 — a few each chapter, a reason to go and look); calm ground + one accent
  { id: 'wp-cloud', name: '하늘 구름', wallKind: 'cloud', wall: '#dfeefa', wall2: '#ffffff', wainscot: '#a9cde8', price: 100, ch: 1 },
  { id: 'wp-drop', name: '비 오는 날', wallKind: 'drop', wall: '#eef3f8', wall2: '#a8c8e8', wainscot: '#7fa9cf', price: 100, ch: 1 },
  { id: 'wp-gingham', name: '딸기우유 깅엄', wallKind: 'gingham', wall: '#fff6f4', wall2: '#ffc2cc', wainscot: '#ff9fb0', price: 120, ch: 1 },
  { id: 'wp-pin', name: '크림 핀줄', wallKind: 'pin', wall: '#f7f1e6', wall2: '#d9c3a3', wainscot: '#b99a76', price: 90, ch: 2 },
  { id: 'wp-fruit', name: '체리', wallKind: 'fruit', wall: '#fffaf0', wall2: '#f0727f', wainscot: '#a8d59a', price: 160, ch: 2 },
  { id: 'wp-wave', name: '바다 물결', wallKind: 'wave', wall: '#eaf7f6', wall2: '#9fdad3', wainscot: '#5fb9b0', price: 140, ch: 2 },
  { id: 'wp-leaf', name: '초록 잎', wallKind: 'leaf', wall: '#f3f8ec', wall2: '#a9d08e', wainscot: '#7fae6e', price: 150, ch: 3 },
  { id: 'wp-scallop', name: '라일락 비늘', wallKind: 'scallop', wall: '#f4f0fb', wall2: '#cdbdf0', wainscot: '#a996dc', price: 160, ch: 3 },
  { id: 'wp-diamond', name: '금빛 격자', wallKind: 'diamond', wall: '#fbf6ee', wall2: '#e0b97a', wainscot: '#c99a5a', price: 200, ch: 3 },
  { id: 'wp-plaid', name: '코코아 체크', wallKind: 'plaid', wall: '#f6ece2', wall2: '#c48f6a', wainscot: '#9c6a4a', price: 220, ch: 4 },
  { id: 'wp-moon', name: '달밤', wallKind: 'moon', wall: '#4b5592', wall2: '#ffe08a', wainscot: '#373f72', price: 240, ch: 4 },
  { id: 'wp-paw', name: '추로 발자국', wallKind: 'paw', wall: '#f3f0f6', wall2: '#9fa3c4', wainscot: '#7e83a8', price: 260, ch: 5 },
  { id: 'wp-friends', name: '친구들 얼굴', wallKind: 'friends', wall: '#fff7ec', wall2: '#f2c9a0', wainscot: '#e0a878', price: 300, ch: 5 },
  { id: 'wp-mong', name: '몽글이 가득', wallKind: 'mong', wall: '#f9eef6', wall2: '#ffffff', wainscot: '#e9b7d3', price: 360, ch: 6 },
];
export const PAINTS = [
  ['peach', '복숭아', '#ffd9c4'], ['butter', '버터', '#fff1b8'], ['mint', '민트', '#c9f2df'], ['sky', '하늘', '#cfe8ff'],
  ['lilac', '라일락', '#e2d4ff'], ['rose', '로즈', '#ffd0dd'], ['cream', '크림', '#fff8ee'], ['cocoa', '코코아', '#c99c7a'],
].map(([id, name, c]) => ({ id: 'pt-' + id, name: name + ' 페인트', wallKind: 'plain', wall: c, wall2: c, price: 60 }));
export const FLOORS = [
  { id: 'fl-honey', name: '꿀 원목', floorKind: 'planks', floor: '#f4d4ad', floor2: '#ddb184', price: 0, indoor: true },
  { id: 'fl-dark', name: '초코 원목', floorKind: 'planks', floor: '#b98762', floor2: '#8a5d3e', price: 140, indoor: true },
  { id: 'fl-mint', name: '민트 체크', floorKind: 'checker', floor: '#ffffff', floor2: '#cdeee3', price: 140, indoor: true },
  { id: 'fl-pink', name: '분홍 체크', floorKind: 'checker', floor: '#fff4f8', floor2: '#ffc9dc', price: 140, indoor: true },
  { id: 'fl-carpet', name: '폭신 카펫', floorKind: 'carpet', floor: '#dfe6ff', floor2: '#c5d1ff', price: 160, indoor: true },
  // (more floors, 10/20 — patterns.js; `ch` as the walls above)
  { id: 'fl-white', name: '화이트 원목', floorKind: 'planks', floor: '#f3ebe0', floor2: '#d8cab8', price: 100, indoor: true, ch: 1 },
  { id: 'fl-lilac', name: '라일락 체크', floorKind: 'checker', floor: '#fbf8ff', floor2: '#ddd2f6', price: 120, indoor: true, ch: 1 },
  { id: 'fl-cherry', name: '체리 원목', floorKind: 'planks', floor: '#d99a7c', floor2: '#b06f53', price: 150, indoor: true, ch: 2 },
  { id: 'fl-smalltile', name: '하늘 욕실 타일', floorKind: 'smalltile', floor: '#eaf5fd', floor2: '#ffffff', price: 130, indoor: true, ch: 2 },
  { id: 'fl-cstripe', name: '줄무늬 카펫', floorKind: 'cstripe', floor: '#f3efe6', floor2: '#cfe3d6', price: 150, indoor: true, ch: 2 },
  { id: 'fl-herring', name: '꿀 헤링본', floorKind: 'herring', floor: '#ecc595', floor2: '#c99a68', price: 220, indoor: true, ch: 3 },
  { id: 'fl-hex', name: '민트 육각 타일', floorKind: 'hex', floor: '#dff3ea', floor2: '#ffffff', price: 200, indoor: true, ch: 3 },
  { id: 'fl-parquet', name: '바구니 마루', floorKind: 'parquet', floor: '#e6c39a', floor2: '#b98d62', price: 240, indoor: true, ch: 4 },
  { id: 'fl-terrazzo', name: '테라초', floorKind: 'terrazzo', floor: '#f4efe8', floor2: '#e9a38c', price: 260, indoor: true, ch: 4 },
  { id: 'fl-hex2', name: '꿀벌 육각 타일', floorKind: 'hex', floor: '#ffe7a6', floor2: '#fffaf0', price: 220, indoor: true, ch: 4 },
  { id: 'fl-tatami', name: '다다미', floorKind: 'tatami', floor: '#e3e2b3', floor2: '#7f9a6a', price: 280, indoor: true, ch: 5 },
  { id: 'fl-diamond', name: '사선 타일', floorKind: 'diamondf', floor: '#fbf3e6', floor2: '#f0d2b0', price: 260, indoor: true, ch: 5 },
  { id: 'fl-marble', name: '대리석', floorKind: 'marble', floor: '#f6f4f2', floor2: '#b8b0c8', price: 340, indoor: true, ch: 6 },
  { id: 'fl-herring2', name: '초코 헤링본', floorKind: 'herring', floor: '#a9795a', floor2: '#7e5338', price: 320, indoor: true, ch: 6 },
  { id: 'fl-grass', name: '잔디', floorKind: 'grass', floor: '#9be07f', floor2: '#7cc964', price: 0, indoor: false },
  { id: 'fl-sand', name: '모래', floorKind: 'sand', floor: '#f6dfa6', floor2: '#e2c27f', price: 120, indoor: false },
  { id: 'fl-brick', name: '벽돌 길', floorKind: 'brickpave', floor: '#e8b496', floor2: '#c98a6c', price: 160, indoor: false },
];

// Furniture for sale (indoor); outdoor props are added by registerOutdoorShop() once gfx/outdoor.js loads.
export const SHOP_FURN = ['wardrobe', 'bookshelf', 'desk', 'sofa', 'safe', 'table', 'tvstand', 'boxes', 'trash', 'stool', 'lamp', 'drawers', 'chest', 'plant', 'fridge', 'counter', 'bed', 'rug']
  .map(t => ({ type: t, indoor: true, outdoor: ['plant', 'stool', 'table', 'boxes', 'chest', 'trash'].includes(t) }));
export function registerOutdoorShop(info) {
  for (const t in info) if (!info[t].wall && !SHOP_FURN.some(x => x.type === t)) SHOP_FURN.push({ type: t, indoor: false, outdoor: true, region: info[t].region });
}
// story furniture for indoor rooms; mementos (cat tower …) are rewards, not for sale
// (every boss story's gift, not only the cat tower — 검토 H5: they were on sale and the reward meant nothing)
const MEMENTOS = ['cattower', 'kotatsu', 'tteokstall', 'snackcart', 'bench2', 'lantern', 'recordcab'];
export function registerStoryShop(info) {
  for (const t in info) if (!info[t].wall && !MEMENTOS.includes(t) && !SHOP_FURN.some(x => x.type === t)) SHOP_FURN.push({ type: t, indoor: true, outdoor: false });
}
export function furnPrice(t) { return FURN_INFO[t]?.price ?? 200; }

// Items a player can hide: unlocked by finding them in stages (the collection), plus a starter set.
// kept small on purpose (user, 2026-10-16: "숨기는 기본템 많이 주지말기"): the rest come one per stage you clear
export const STARTER_ITEMS = ['donut', 'duck'];

// Home styles (상점 · 테마): a zone can take on the look of a stage set — the everyday apartment, a neighbourhood alley…
// theme = a THEMES key (null = the zone type's own look); more styles join when their prop sets register (addHomeStyle).
export const HOME_STYLES = [
  // no walls, the floor running on: free to arrange anywhere (new homes start here — user, 2026-10-16)
  { id: 'st-open', name: '탁 트인 바닥', indoor: true, theme: null, price: 0, bleed: true, walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, decor: [], door: null, sw: ['#f4d4ad', '#ddb184'] },
  { id: 'st-classic', name: '몽글 기본 방', indoor: true, theme: null, price: 0, sw: ['#fff8ee', '#ffe6c8'] },
  { id: 'st-apt', name: '아파트 거실', indoor: true, theme: 'apt', price: 300, bleed: true, sw: ['#fff6e8', '#dea366'] },
  { id: 'st-aptkitchen', name: '아파트 주방', indoor: true, theme: 'aptkitchen', price: 300, bleed: true, sw: ['#fdfcf6', '#cfe8d6'] },
  { id: 'st-yard', name: '잔디 마당', indoor: false, theme: null, price: 0, sw: ['#9be07f', '#ffffff'] },
  { id: 'st-street', name: '동네 골목', indoor: false, theme: 'street', price: 400, bleed: true, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' }, sw: ['#ecd6b8', '#a49dab'] },
];
export function addHomeStyle(st) { if (!HOME_STYLES.some(s => s.id === st.id)) HOME_STYLES.push(st); }
export const styleOf = zone => HOME_STYLES.find(s => s.id === zone.style) || null;
// Room sizes (상점 · 방 크기): each step makes the zone a little bigger; furniture keeps its place relative to the centre
export const ZONE_SIZES = [{ w: 5, d: 5, price: 0 }, { w: 6, d: 5, price: 300 }, { w: 6, d: 6, price: 500 }, { w: 7, d: 6, price: 800 }, { w: 7, d: 7, price: 1200 }, { w: 8, d: 7, price: 1800 }];
export const zoneSize = zone => ZONE_SIZES[Math.min(zone.size || 0, ZONE_SIZES.length - 1)];

export function zoneLayout(zone) {
  const Z = ZONE_TYPES[zone.type] || ZONE_TYPES.room, st = styleOf(zone), S = zoneSize(zone);
  const base = st?.theme && THEMES[st.theme] ? THEMES[st.theme] : Z.theme;
  const theme = { ...base, ...(zone.paint || {}) };
  return { w: S.w, d: S.d, theme, furniture: zone.furniture.map(f => ({ ...f })), decor: zone.decor || st?.decor || Z.decor, door: zone.door !== undefined ? zone.door : st && 'door' in st ? st.door : Z.door, walls: { ...(st?.walls || Z.walls), ...(zone.walls || {}) }, indoor: Z.indoor, stack: true,
    ...(st?.bleed ? { bleed: {} } : {}) };
}
// a house of several rooms joined (털 집 찾기 프리셋, 10/20): { rooms: [{ at: [x, z], ...zone }] } → a map like the stages' two-room homes
export function houseLayout(zone) {
  if (!zone.rooms) return zoneLayout(zone);
  const rooms = zone.rooms.map(z => ({ at: z.at, layout: zoneLayout(z) }));
  return { theme: rooms[0].layout.theme, bleed: true, rooms };
}
// Before a zone changes size, pin every tile-placed piece to its centre-relative position so nothing jumps.
export function pinZoneFurniture(zone) {
  const S = zoneSize(zone);
  for (const f of zone.furniture) {
    if (f.x != null) continue;
    const inf = FURN_INFO[f.type] || {}, rot = f.rot || 0, fw = rot % 2 ? (inf.d || 1) : (inf.w || 1), fd = rot % 2 ? (inf.w || 1) : (inf.d || 1);
    f.x = -S.w / 2 + f.i + fw / 2; f.z = -S.d / 2 + f.j + fd / 2; f.a = rot * Math.PI / 2;
  }
}
