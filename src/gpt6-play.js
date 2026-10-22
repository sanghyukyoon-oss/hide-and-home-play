// GPT 작업장 gpt3-f 놀이터 맵 (⑥ 10/22 — 43 놀이터 대회 광장, 44 모래 언덕 보물찾기, 46 경주 공원 + 받침 없는 변형은 키로):
// 작업장의 맵 배치(gpt-day-maps·gpt-wide-maps)만 옮겼다 — 걷기 엔진(gpt-ground: 높이 구역·몸통)은 안 가져오고, 그 몸통과
// 사람이 못 올라서는 높은 구역을 지형 조각의 정본 몸통(f.walkSolids)으로 적었다(정본 walkGrid는 땅만 걷는다; 12 cm 이하 턱은 땅).
// 받침은 작업장 것(gpt-plinth) 대신 옛 맵 룩의 블록(look.js — roomalias로 playground·park3·playgroundwide).
const walls = { N: 'none', W: 'none', S: 'none', E: 'none' };
const F = (type, x, z, opts = {}, a = 0) => ({ type, x, z, a, opts, id: type });
const outdoor = (T, name, friend, extra) => ({ ...T.my, ...T.playground, name, friend, ...extra });
// (⑥ 10/22 밤 — 허브 "1~10판처럼 귀엽고 디테일도": the ground in a colour of its own (grass, not the workshop's yellow cream)
// and a few lived-in things at the edges with hiding spots of their own — placed by node (_lab/place.mjs), no walk island)
const GRASS = { floorKind: 'grass', floor: '#a3d483', floor2: '#93c873', grass: '#a3d483', grass2: '#93c873' };
const LIVED = {
  contest: [{ type: 'bush', x: 3.7, z: -3.1 }, { type: 'parkbin', x: -4.05, z: -3.1, a: Math.PI / 2 }, { type: 'picnic', x: -3.8, z: .9 }, { type: 'plant', x: -3.3, z: -3.1 }, { type: 'daeya', x: .95, z: -2.85 }],
  hamster: [{ type: 'bush', x: 3.7, z: -3.1 }, { type: 'picnic', x: -3.8, z: 2.4 }, { type: 'plant', x: 3.7, z: 3.15 }, { type: 'parkbin', x: -4.05, z: -3.1, a: Math.PI / 2 }, { type: 'mushrooms', x: .2, z: -3.1, a: Math.PI / 2 }],
  race: [{ type: 'bush', x: -4.75, z: -3 }, { type: 'parkbin', x: -5, z: -2.25 }, { type: 'cooler', x: 5, z: -3 }, { type: 'plant', x: -3.75, z: -3 }],
};
const map = (theme, w, d, friendAt, furniture) => ({ theme, friendAt, rooms: [{ at: [0, 0], layout: { w, d, theme, walls, exact: true, furniture } }] });

export function contestMap(T) {
  const theme = outdoor(T, '놀이터 대회', 'frog', { bg: ['#fef2e1', '#d4e2e5'], base: '#c67f2a', ...GRASS, wood: '#eaa440', woodD: '#6f4b30' });
  return map(theme, 8.6, 7.2, [.05, 1.20], [
    F('gptcontestterrain', 0, 0),
    F('gptcontestpodium', -1.33, -1.57),
    F('loftpulley', -3.63, -1.68, { y: 1.12, gptWorkshop: true, fix1022: true }),
    F('gptprizebox', 1.02, -1.93),
    F('gpttimingpost', 3.13, -1.96),
    F('gptstarterbarrier', -1.92, 1.22),
    { ...F('gptofficialbench', 1.83, .12), y: .053 },
    { ...F('gptcontestswing', 3.20, 1.80), y: .080 },
    ...LIVED.contest,
  ]);
}
export function hamsterMap(T) {
  const theme = outdoor(T, '햄찌의 모래 보물 정원', 'hamster', { bg: ['#fef2e1', '#e8d7b7'], base: '#c67f2a', ...GRASS, wood: '#eaa440', woodD: '#6f4b30' });
  return map(theme, 8.6, 7.2, [-.10, 1.40], [
    F('gpthamsterterrain', 0, 0),
    F('gptsandhill', 1.67, -1.34),
    F('gptsandbox', -2.08, -.08),
    F('gpthamper', 1.53, 1.88),
    F('gptsunflowerbox', -2.93, -2.64),
    F('gptbalancelog', -.58, 2.26),
    ...LIVED.hamster,
  ]);
}
const place = (type, x, z, y = 0, a = 0) => ({ type, x, z, y, a, id: type });
export function raceMap(T, open = false) {
  const base = T.playground || T.my;
  const theme = { ...base, name: '너굴 경주공원', bg: ['#fef2e1', '#f6e0bf'], base: '#eecfa3', ...GRASS, floor: '#9fd17d', floor2: '#8fc66d',
    grass: '#9fd17d', grass2: '#8fc66d', sand: '#f3dcc0', sand2: '#e9cfb3', wood: '#eecfa3', woodD: '#c67f2a', wall: '#fef2e1', trim: '#fefde9' };
  if (open) theme.sky = ['#fef2e1', '#f6e0bf', theme.floor];
  return { theme, bleed: open ? { unlit: true, fade: 5 } : true, friendAt: [-1.4, 1.6], nBonus: 3,
    rooms: [{ at: [0, 0], layout: { w: 11, d: 7, theme, walls: { ...walls }, exact: true, bleed: null, texRes: 512, decor: [], furniture: [
      place('gptraceterrain', 0, 0),
      place('gptracestart', -3.65, 2.08, .04),
      place('gptracepodium', 2.4, -.75, .125),
      { ...place('gptwidefountain', -4.2, -.65, .04), opts: { fix1022: true } },
      { ...place('gptwidemarblerun', -.7, -.6, .125), opts: { fix1022: true } },
      place('gptracebalance', 0, .35, .125),
      place('gptracescore', .6, -2.55, .04),
      place('gptracecooler', 3.85, 2.03, .04),
      ...(open ? [] : LIVED.race),
    ] } }] };
}

// the workshop's ground bodies (gpt-ground.js), room-local [x0, y0, z0, x1, y1, z1] on the map's terrain piece: rails, posts,
// the hill's body and the steps up it, the back service strip — everything a walker can't stand in
const R = (x, z, w, d, top = 2.5) => [x - w / 2, 0, z - d / 2, x + w / 2, top, z + d / 2];
const O = (x, z, r, top = 2.5) => [x - r, 0, z - r, x + r, top, z + r];
export const PLAY_BODIES = {
  gptcontestterrain: [R(0, -3.16, 8.36, .5), O(-3.58, .9, .35), O(3.65, -2.62, .35), R(-4.27, 0, .06, 7.2), R(4.27, 0, .06, 7.2), R(0, 3.57, 8.6, .06), R(-3.64, -2.54, 1.30, .78)],
  gpthamsterterrain: [R(0, -3.2, 8.3, .5), O(-3.76, 2.38, .44), O(3.4, -2.8, .44), O(3.65, 2.45, .44), R(4.27, 0, .06, 7.2), R(0, 3.57, 8.6, .06),
    R(1.805, -1.46, 2.93, 2.15, 1.24), R(1.85, -1.76, 2.32, 1.35, 1.57), R(2, -1.94, 1.43, .89, 1.83), R(.85, .02, 1.16, .68, 1.35), R(2.87, .10, .96, .76, 2.10), R(2.87, -.32, .12, .12, 2.32),
    R(2, -2.48, 1.64, .09, 2.65), R(2, -1.40, 1.64, .09, 2.65), R(2.77, -1.94, .09, 1.10, 2.65), R(.745, -2.30, .69, .06, 2.60), R(.745, -1.58, .69, .06, 2.60),
    R(-.42, -1.19, .06, 1.48, 2.45), R(.32, -1.00, .06, 1.10, 2.14), R(1.74, 2.53, 1.70, .57, .31), R(.77, 2.32, .24, .24, .53), R(2.38, 2.38, .30, .28, .25), O(-2.65, -2.201, .06, .60),
    ...Array.from({ length: 6 }, (_, i) => R(-.05, -.49 - i * .28, .80, .38, .28 + i * .31)), R(.595, -1.94, .99, .78, 1.96), R(2, -1.94, 1.82, 1.36, 1.96)],
  gptraceterrain: [R(-3, -2.85, 3.5, 1.4), O(-4.7, -2.65, .65), O(4.8, -2.65, .65), R(2.88, -3.25, 2.64, .12)],
};
