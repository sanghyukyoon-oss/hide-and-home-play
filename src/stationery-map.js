// 36판 새 안 '밤의 문구점' stationery (⑨ 10/23 — 상가 장 새 맵: 36판 상가 거리 shopmap:night 자리; 판 표 PLAN은 그대로, 미리보기 ?gptmap=stationery).
// 동네 문구점 한 채의 실루엣 단면 + 가게 앞 보도·연석 턱 + 찻길 조금 + 층진 둥근 섬 — 모델은 gfx/stationery-props.js.
// 대본(shopmapH, ifMap stationery)·물건 풀·빛은 roomalias.js 별칭 stationery → shopmap으로 따라오고, 물건 풀은 pools.js의 stationery 줄(문구·장난감),
// 장치 연쇄는 gpt-chains.js CHAINS.stationery(가로등 → 셔터 숫자 그림자 → 금고 → 셔터 레버 → 열쇠 트레이).
import { registerFurniture } from './gfx/furniture.js';
import { ST_BUILDERS, ST_INFO } from './gfx/stationery-props.js';

const P = (type, x, z, a = 0, opts) => ({ type, x, z, a, opts });
// 테마: 상가 거리(편의점) 색을 바탕으로, 바닥은 보도블록 — 옛 테마는 main.js가 뒤에 만들어서 처음 쓸 때 합침
const OWN = { name: '밤의 문구점', friend: 'grumpy', floorKind: 'brickpave', floor: '#d5c4b8', floor2: '#c9b8b0', base: '#c3b6a5' };

export function installStationery(LAYOUTS, THEMES) {
  registerFurniture(ST_BUILDERS, ST_INFO);
  // (② 10/23: 36 → 39 → 36에서 친구가 없는 테마로 열린 일 — 옛 테마가 생긴 뒤 첫 값으로 박아 두고, 대입도 받음: parkcamp-maps lazyTheme과 같은 방식)
  let made = null;
  Object.defineProperty(THEMES, 'stationery', { configurable: true, enumerable: true,
    get() { if (made) return made; const b = THEMES.shopmap || THEMES.konbini, t = { ...(b || THEMES.my), ...OWN }; if (b) made = t; return t; },
    set(v) { made = v; } });
  LAYOUTS.stationery = { w: 7, d: 5.5, slab: 'none', bleed: null, wallH: 2.4, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (카메라: 판 줌 1.5를 곱한 뒤 가게와 보도가 한 화면 — 찻길 양 끝만 잘림, 물건 28px)
    fitW: 9.3, homeShift: [-.08, .48],
    furniture: [
      P('st_shop', 0, 0),
      // 가게 안: 뒷벽 크레파스 진열대(왼쪽 — 창고 칸에 안 가리게, 앞은 비워 둠: 끝 장면이 그 앞에서) · 학용품 선반, 옆벽 노트·스티커 벽, 계산대와 그 밑 금고, 회전 진열대, 박스 더미
      P('st_crayonrack', -2.25, -2.48), P('st_shelf', -.35, -2.54), P('st_stickerwall', -3.39, -1.3, Math.PI / 2),
      P('st_counter', -2.05, -.16), P('st_safe', -1.59, -.16), P('st_snackrack', .45, -.4), P('st_boxes', .66, -1.45),
      // 창고 칸: 반쯤 내린 셔터와 오른쪽 레버
      P('st_shutter', 1.875, -1.0), P('st_shutterlever', 3.12, -.72),
      // 가게 앞 보도: 뽑기 기계 줄 · 오락기 · 영업 중 팻말 · 평상(고양이) · 가로등
      P('st_gacha', -2.45, 1.2), P('st_arcade', -.98, 1.25), P('st_flipsign', .6, 1.15), P('st_bench', 1.68, 1.32), P('st_streetlamp', 3.3, 2.5)],
    decor: [],
    friendAt: [-2.25, -1.6] };
}
