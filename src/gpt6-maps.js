// GPT 작업장 맵 (⑥ 10/22 — 사용자 고르기 시트, _handoff/gpt-picks-1022.md·gpt-compare-picks-1022.md): 등록과 판 표를 한곳에.
// GPT가 작업장에서 손보기(크기·색·글자, fix-1022)를 하고 ⑥이 들여와 남은 어긋남·보행 칸·찾을 물건 크기를 맞췄다.
// 들여오기 규칙(10/22 허브·②): 빌더(모델 + 부품 움직임)와 배치만 — GPT 장치·걷기·맵 등록 엔진은 안 가져온다. 장치는 정본
// 부품(part)으로 ②b가 잇고(가구의 parts와 gpt* 메타는 그대로 둠), 걷기는 정본 walkGrid: GPT 빌더가 적어 둔 몸통 상자
// (walkBoxes·collideBox)와 높은 바닥(walkSurfaces — 테라스·데크·다리)을 정본의 정밀 몸통(f.walkSolids)으로 넘긴다.
// 바꾼 판의 옛 맵은 키 그대로 남는다(shopmap·park2 …). 판 표는 판 번호가 아니라 '옛 맵:판 종류' → 새 맵(② 31~39판 번호
// 밀기에도 그대로); 한 줄 지우면 그 판은 옛 맵으로 돌아간다. 판 이야기·옛 방 표는 roomalias.js(스토리 룸) ROOM_AS로 찾는다.
import { registerFurniture } from './gfx/furniture.js';
import { GPT_SHOPNIGHT_BUILDERS, GPT_SHOPNIGHT_INFO, makeShopnightMap } from './gfx/gpt-shopnight.js';
import { GPT_PARK2_BUILDERS, GPT_PARK2_INFO, makePark2Map } from './gfx/gpt-park2.js';
import { GPT_DAY_BUILDERS, GPT_DAY_INFO } from './gfx/gpt-day-props.js';
import { hamsterMap, PLAY_BODIES } from './gpt6-play.js';

// 판 표 PLAN의 '옛 맵:판 종류' → 새 맵 키. (10/22 18시 사용자 시트 결정, _handoff/gpt-compare-picks-1022.md: 44 모래 언덕 물레방아만 채택 —
// 37 밤 상가·47 연못 정자는 원본(옛 shopmap·park2)으로 돌아가고 gptshopnight·gptpark2는 키로만 남음)
export const GPT6_SWAP = { park3: 'gptplayhamster' };
// 새 맵마다 시작 줌·물건 크기 (#94 시작 화면 28px — 폰 세로 390×844에서 잼)
const SPEC = {
  gptshopnight: { zoom: 1.08, itemSize: .46 },
  gptpark2: { zoom: 1.08, itemSize: .5 },   // (.46 left one thing at 27 px; the park already fills the width, so the things grow, not the zoom)
  gptplayhamster: { zoom: 1.4, itemSize: .5 },
  // 36판 새 안 밤의 문구점 (⑨ 10/23, stationery-map.js — 가게와 보도가 한 화면, 물건 28px)
  stationery: { zoom: 1.5, itemSize: .48 },
};

export function installGpt6(THEMES, MAPS, PLAN) {
  registerFurniture(walkable(GPT_SHOPNIGHT_BUILDERS), hide(GPT_SHOPNIGHT_INFO)); registerFurniture(walkable(GPT_PARK2_BUILDERS), hide(GPT_PARK2_INFO));
  registerFurniture(walkable(GPT_DAY_BUILDERS), hide(GPT_DAY_INFO));
  const calm = { ...THEMES.my, wallKind: 'plain', wood: '#eecfa3', woodD: '#6f4b30', body: '#fef2e1', accent: '#84ae9d', accent2: '#dc967a', accent3: '#edc678',
    wall: '#fef2e1', wall2: '#f6e0bf', trim: '#fefde9', wallEdge: '#feebc8', wainscot: '#c6c393', floorKind: 'brickpave', floor: '#e8d7b7', floor2: '#f2dcbc', base: '#d5b692',
    bg: ['#edf2e7', '#dce5d7'], light: { ambColor: '#fff0e2', amb: 1.5, sunColor: '#fff3e0', sun: 2 } };
  THEMES.gptshopnight = { ...calm, name: '별빛 아래 문 닫기 전', friend: 'grumpy', bg: ['#3a4ea6', '#8f8bd0'], floor: '#f2dcbc', floor2: '#e8d7b7',
    light: { ambColor: '#fff0e2', amb: 1.6, sunColor: '#fff3e0', sun: 1.65 } };
  // (a sky of its own, drawn in the scene: on the 흑백 stage it greys with the park — the page behind stayed cream)
  THEMES.gptpark2 = { ...calm, name: '먹물이의 연못 정자', friend: 'squirrel', floor: '#e8d7b7', floor2: '#eecfa3', bg: ['#fef2e1', '#c6c393'], sky: ['#d6ebf2', '#fef2e1', '#e4dfc0'] };
  MAPS.gptshopnight = () => ({ ...makeShopnightMap(THEMES.gptshopnight), bleed: false });
  MAPS.gptpark2 = () => ({ ...makePark2Map(THEMES.gptpark2), bleed: false });
  // (44판: the park's theme is the playground's own, taken when the map is built — main.js registers it after this file)
  MAPS.gptplayhamster = () => hamsterMap(THEMES);
  // (the table's own syntax, 10/22 ② RENUM: 'new|old:kind' — the old map stands in if the new one isn't there)
  for (const list of Object.values(PLAN)) list.forEach((e, l) => { if (GPT6_SWAP[e]) list[l] = GPT6_SWAP[e] + '|' + e; });
  // THEMES under the new key too (② 10/22: THEMES takes no alias) — the theme the map is built in, taken the first time it is asked for
  Object.defineProperty(THEMES, 'gptplayhamster', { configurable: true, enumerable: false,
    get() { const t = MAPS.gptplayhamster().theme; Object.defineProperty(THEMES, 'gptplayhamster', { value: t, writable: true, configurable: true, enumerable: false }); return t; } });
}
// (상점엔 안 나옴 — 맵 조각들)
const hide = info => Object.fromEntries(Object.entries(info).map(([k, v]) => [k, { ...v, hidden: true }]));
// the GPT pieces' own body boxes, local [x0, y0, z0, x1, y1, z1], as the canon's precise bodies; a raised floor (a terrace, a
// deck, a bridge) is a body too — the canon walk grid keeps to the ground, so nobody stands sunk in a step
const walkable = B => Object.fromEntries(Object.entries(B).map(([k, build]) => [k, (f, ...a) => {
  build(f, ...a);
  if (PLAY_BODIES[k]) { f.walkSolids = PLAY_BODIES[k]; return; }   // (a whole playground's ground: only its bodies stop a walker — gpt6-play.js)
  if (f.noSolid) return;
  const boxes = typeof f.walkBoxes === 'function' ? f.walkBoxes() : f.walkBoxes || (f.gptWalkBox ? [f.gptWalkBox] : null) || (f.collideBox && f.collideBox[4] > .06 ? [f.collideBox] : null);
  if (!boxes) return;
  f.walkSolids = [...boxes, ...(f.walkSurfaces || []).filter(s => s.y > .06).map(s => [s.box[0], 0, s.box[1], s.box[2], s.y, s.box[3]]), ...(KEEP_OUT[k] || [])];
}]));
// little pockets of ground nobody can walk into once the decks are bodies (47판: behind the pavilion's back corner, the
// pond's west rim) — part of the piece's body, so no walk tile is left stranded there
const KEEP_OUT = {
  gpt_p2pavilion: [[1.85, 0, -1.1, 2.75, .5, -.55]],
  gpt_p2pond: [[-2.65, 0, 1.1, -2.1, .5, 1.7]],
};

// stageSpec's last word for a stage on one of these maps
export function gpt6Spec(s) {
  const g = SPEC[s.room];
  if (!g) return s;
  s.zoom = g.zoom; s.itemSize = g.itemSize;
  return s;
}
