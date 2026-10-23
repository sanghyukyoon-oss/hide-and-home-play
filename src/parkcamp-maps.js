// 공원·캠프 새 맵 다섯 (10/23 — 스토리 룸 표 _handoff/redo-34to70-order-1023.md: 5장·6장에서 같은 맵이 되풀이되던 판을 새로).
// 옛 키(playground·playgroundwide·trail·camp1·camp2)와 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=키, 판에 넣는 건 허브가.
// 대본·물건 풀·숨김 표는 roomalias.js 별칭으로 옛 키를 따라감:
//   45 별 지붕 밤 놀이터 starplay → playground · 49 소풍 잔디 언덕 picnichill → playgroundwide · 55 반딧불 계곡 fireflyvalley → trail · 56 개울가 징검다리 캠핑 creekcamp → camp1 · 58 흔들다리 숲 bridgewood → camp2
// 둥근 섬 받침이 바닥을 대신함(layout.hideFloor — 네모 바닥판 숨김). 모델은 gfx/pc-kit.js 공용 + 맵마다 gfx/<키>-props.js.
import { registerFurniture } from './gfx/furniture.js';
import { VL_BUILDERS, VL_INFO } from './gfx/fireflyvalley-props.js';
import { BW_BUILDERS, BW_INFO } from './gfx/bridgewood-props.js';
import { CK_BUILDERS, CK_INFO } from './gfx/creekcamp-props.js';
import { SP_BUILDERS, SP_INFO } from './gfx/starplay-props.js';
import { PH_BUILDERS, PH_INFO } from './gfx/picnichill-props.js';

const HP = Math.PI / 2;
const at = (type, x, z, a = 0, opts) => ({ type, x, z, a, ...(opts ? { opts } : {}) });
// an outdoor island map: no walls, no slab, the island piece is the floor; the camera fits the whole island (fitW 11 m — its shore runs ~.7 m past the 8 × 7 map)
const islandMap = (w, d, theme, furniture, extra = {}) => ({ w, d, get theme() { return theme(); }, fitW: 11, exact: true, noEntry: true, slab: 'none', bleed: null, hideFloor: true, wallH: 0,
  walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, decor: [], furniture, ...extra });

// (installGpt runs before main.js lays the playground · trail themes over THEMES.my — so each new theme is made from its old map's
// theme the first time it is asked for, when that one is there: friend, pool and colours follow the old map)
function lazyTheme(THEMES, key, oldKeys, extra) {
  let made = null;
  Object.defineProperty(THEMES, key, { enumerable: true, configurable: true,
    get() { if (made) return made; const old = oldKeys.map(k => THEMES[k]).find(Boolean) || THEMES.my, t = { ...old, ...extra, friend: old.friend ?? null }; if (old !== THEMES.my) made = t; return t; },
    set(v) { made = v; } });
  return () => THEMES[key];
}

export function installParkCamp(LAYOUTS, THEMES) {
  registerFurniture(VL_BUILDERS, VL_INFO); registerFurniture(BW_BUILDERS, BW_INFO); registerFurniture(CK_BUILDERS, CK_INFO); registerFurniture(SP_BUILDERS, SP_INFO); registerFurniture(PH_BUILDERS, PH_INFO);
  // ── 55판 반딧불 계곡 (숨은그림 · 밤 · 졸졸이): 개울이 대각선으로 흐르는 작은 계곡 섬 — 폭포 바위·큰 참나무·별 보기 바위·졸졸이 잠자리
  {
    const theme = lazyTheme(THEMES, 'fireflyvalley', ['trail'], { name: '반딧불 계곡', floorKind: 'grass', floor: '#9fd47c', floor2: '#86c066', base: '#a8785a' });
    LAYOUTS.fireflyvalley = islandMap(8, 7, theme, [
      at('vl_island', 0, 0), at('vl_fireflies', 0, 0),
      at('vl_falls', -2.6, -2.75), at('vl_oak', 2.75, -2.65), at('firewood', .55, -2.85),
      at('lantern', -3.45, -1.15), at('vl_reeds', -.35, -1.5), at('vl_logbridge', -.75, -.45, 1.01), at('vl_scope', 2.35, -.65, -.15),
      at('tentsmall', -3.3, .15, .35), at('vl_sleepmat', -2.5, 1.55, .25), at('backpack2', -3.55, 2.65, .4),
      at('trunk', 3.5, .5, -HP), at('vl_stepstones', 2.25, 1.45, HP), at('shrinebox', -1.3, 2.9, .2),
      at('vl_jarstump', .6, 2.6), at('mushrooms', 1.95, 3.05), at('vl_reeds', 3.7, 1.85, .4),
    ], { friendAt: [-.9, 1.9] });
  }
  // ── 58판 흔들다리 숲 (흑백 · 졸졸이): 골짜기로 갈라진 두 언덕을 흔들다리가 이음 — 왼쪽 큰 고목과 나무 위 쉼터(도르래 바구니),
  // 오른쪽 숲길·이정표·오르골 그루터기·등불 기둥 (흑백이라 밝은 길·짙은 침엽수·굵은 실루엣으로 회색에서도 읽히게)
  {
    const theme = lazyTheme(THEMES, 'bridgewood', ['camp2'], { name: '흔들다리 숲', floorKind: 'grass', floor: '#a9d58a', floor2: '#94c878', base: '#9c7458' });
    LAYOUTS.bridgewood = islandMap(8, 7, theme, [
      at('bw_land', 0, 0), at('bw_bridge', .58, -.25, .087),
      at('bw_bigtree', -2.6, -1.85), at('bw_ferns', -1.0, -3.05), at('mushrooms', -3.6, -3.15), at('firewood', -3.5, .75, HP),
      at('lantern', -1.15, 1.6), at('bw_logtunnel', -1.45, 2.95, .1), at('pine', -3.65, 2.9),
      at('bw_signpost', 2.45, -1.35, -.3), at('trunk', 3.5, -2.55, -.4), at('bw_lamppost', 3.6, .3), at('bw_musicstump', 3.05, 1.55), at('backpack2', 3.55, 3.05, .3), at('pine', 2.55, 3.0),
    ], { friendAt: [-1.5, .3] });
  }
  // ── 56판 개울가 징검다리 캠핑 (시간제 · 너굴이): 왼쪽 앞을 휘감는 개울, 징검다리 건너 자갈 물가(카누·낚싯대), 이쪽 다진 흙 캠프 자리 —
  // 큰 돔 텐트, 해먹, 버너 올린 캠핑 테이블, 손 펌프, 빨랫줄, 불 꺼진 돌 화덕과 의자 둘
  {
    const theme = lazyTheme(THEMES, 'creekcamp', ['camp1'], { name: '개울가 징검다리 캠핑', floorKind: 'grass', floor: '#a3d77e', floor2: '#8fcc6e', base: '#a8785a' });
    LAYOUTS.creekcamp = islandMap(8, 7, theme, [
      at('ck_land', 0, 0), at('vl_stepstones', -2.35, .55, 1.16),
      at('ck_canoe', -3.45, 2.05, HP - .25), at('ck_rod', -3.55, .6, -.6), at('ck_pump', -2.35, -2.65, .3), at('ck_line', -1.9, -1.2, .6),
      at('ck_hammock', -.05, -3.0), at('ck_tent', 2.65, -2.45, -.2), at('backpack2', 1.0, -1.45, -.4), at('firewood', 3.5, -.2, HP),
      at('ck_kitchen', .3, .35), at('campchair', 2.05, 1.95, .8), at('campchair', 3.45, 2.05, -.7),
      at('cooler', 1.05, 2.5, .2), at('lantern', -.4, 2.85),
    ], { friendAt: [1.1, -.6] });
  }
  // ── 45판 별 지붕 밤 놀이터 (숨은그림 · 밤 · 개굴이): 말랑한 고무 바닥 놀이터 — 별 지붕 놀이탑(미끄럼틀), 둥근 정글짐 돔, 그네, 뺑뺑이,
  // 가로등 둘, 뒤로 불 켜진 단지 아파트 두 동 (GPT gptplaynight 골격 참고)
  {
    const theme = lazyTheme(THEMES, 'starplay', ['playground'], { name: '별 지붕 밤 놀이터', floorKind: 'grass', floor: '#a5d482', floor2: '#8fcc6e', base: '#d9c4a5' });
    LAYOUTS.starplay = islandMap(8, 7, theme, [
      at('sp_land', 0, 0), at('sp_startower', -2.4, -2.05), at('sp_dome', 2.3, -2.25), at('sp_lamp', -.15, -3.0), at('lostbox', 3.6, -3.0, -.3),
      at('sp_spinner', .2, -.35), at('springrider', 2.0, .25, -.4), at('sp_lamp', 3.6, .85), at('sp_swings', -2.5, 1.55),
      at('sandbox2', 2.85, 2.5), at('seesaw2', .1, 2.85), at('parkbin', -3.6, 2.95), at('catfeeder', -1.6, 3.0),
    ], { friendAt: [1.0, -1.1] });
  }
  // ── 49판 소풍 잔디 언덕 (보스 · 다람이·개굴이): 뒤로 솟은 잔디 언덕과 꼭대기 그늘 나무(연이 걸림), 앞 잔디에 돗자리와 3단 도시락·
  // 파라솔·레버 분수·다람이네 도토리 집; 보스 자물쇠 넷이 들어갈 상자(도시락·도토리 집·분실물 보관함·쓰레기통·피크닉 바구니)
  {
    const theme = lazyTheme(THEMES, 'picnichill', ['playgroundwide', 'playground'], { name: '소풍 잔디 언덕', floorKind: 'grass', floor: '#a8da80', floor2: '#94cf6e', base: '#a8785a' });
    LAYOUTS.picnichill = islandMap(8, 7, theme, [
      at('ph_land', 0, 0), at('ph_acornhouse', -2.6, -2.75, .3), at('tree', -3.55, -1.4), at('ph_kite', -1.0, -1.85), at('lostbox', 2.0, -2.85, -.2), at('ph_fountain', 2.9, -1.2),
      at('ph_mat', -.5, .55, .15), at('ph_bigbasket', .9, -.65, .3), at('ph_blanket', 1.65, 1.35, -.3), at('ph_parasol', -2.6, .75), at('parkbin', 3.6, .2),
      at('ph_bubbles', -.75, 2.4), at('icecart', -2.65, 2.8, .1), at('picnic', .75, 2.9, .4), at('bench', 3.2, 2.55, -HP),
    ], { friendAt: [.8, 1.7] });
  }
}
