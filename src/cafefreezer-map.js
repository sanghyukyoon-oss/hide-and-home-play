// 39판 새 맵 '카페 지하 냉동 창고' cafefreezer (⑨ 10/23 — 스토리 룸 34~70 표, 허브: 빨래방★ → 냉동 창고, 친구 파르페 ★장치판).
// 모델·부품은 gfx/cafefreezer-props.js. 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=cafefreezer (GPT_STAGE 39).
// 별칭 cafefreezer → cafe (roomalias.js): 물건 풀은 카페 것, 대본은 정확한 키 장면(cafefreezerInc)이 먼저 붙음, 빛·하늘은 look.js 자기 줄.
// 주 연쇄(핸들 → 냉동 문 → 바구니 → 온풍기 → 얼음)는 ② 레벨이 devices.js에; 여기서는 보조 장치 셋을 2장 연쇄 표(gpt-chains.js)의 aux로만 —
// ★ 판에선 표 엔진이 aux만 돌림. CHAINS_ON[39]은 그 판이 이 맵(spec.room === 'cafefreezer')일 때만 걸림(옛 laundry 판엔 영향 없음).
import { registerFurniture } from './gfx/furniture.js';
import { FZ_BUILDERS, FZ_INFO } from './gfx/cafefreezer-props.js';
import { CHAINS, CHAINS_ON } from './gpt-chains.js';

const PI = Math.PI;
// 테마: 카페 테마 위에 지하 창고 색(가구가 읽는 키는 카페 것), 친구 파르페
const OWN = { name: '카페 지하 냉동 창고', friend: 'sundae', floorKind: 'tile', floor: '#d8e6e1', floor2: '#cdddd7', base: '#a3825f',
  wallKind: 'plain', wall: '#f2f4ec', wall2: '#e4ece6', bg: ['#e6f4f8', '#bfe0ec'] };
const F = (type, x, z, a = 0, opts) => ({ type, x, z, a, opts });

export function installCafefreezer(LAYOUTS, THEMES) {
  registerFurniture(FZ_BUILDERS, FZ_INFO);
  // (② 10/23 36 → 39 → 36 오류와 같은 자리: 카페 테마가 생긴 뒤 첫 값으로 박아 두고, 대입도 받음)
  let made = null;
  Object.defineProperty(THEMES, 'cafefreezer', { configurable: true, enumerable: true,
    get() { if (made) return made; const b = THEMES.cafe, t = { ...(b || THEMES.my), ...OWN }; if (b) made = t; return t; },
    set(v) { made = v; } });
  LAYOUTS.cafefreezer = { w: 6, d: 6, slab: 'none', bleed: null, wallH: 2.9, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    yaw: PI / 4, fitW: 9.0,
    furniture: [
      F('fz_shell', 0, 0), F('fz_coldroom', 0, 0), F('fz_stairs', 0, 0),
      // 냉동실: 도르래 높은 선반(바구니 속 얼음 = 파르페), 성에 선반, 아이스크림 냉동고·통 줄, 문틀 뒤 우유 상자
      F('fz_basketpulley', -1.15, -.9), F('fz_frostshelf', -2.49, -1.45, PI / 2), F('fz_icecreamchest', -2.3, -2.5), F('fz_tubs', -2.55, -.05, .3), F('fz_crates', -.6, -2.6),
      // 앞방: 문 바로 앞 온풍기(바구니가 내려오는 자리를 봄), 사물함, 계단 밑 비품장, 대걸레, 앞 작업대
      F('fz_heater', .68, -.15, -1.71), F('fz_locker', 1.18, -2.5), F('fz_supplycab', 2.95, -2.5, PI / 2), F('fz_mop', 2.6, 1.0, -.6),
      F('fz_workbench', 1.9, 2.3),
      // 앞 띠: 뒤집는 팻말, 우유 상자 손수레, 서빙 수레
      F('fz_flipsign', -.9, 1.25, .35), F('fz_handtruck', -2.6, 2.55, .6), F('fz_cart', -.3, 2.5, .2)],
    decor: [],
    friendAt: [1.4, 1.5] };
  // 보조 장치 (2장 연쇄 표: ★ 판은 aux만) — 소리만, 말은 스토리 룸 몫
  CHAINS.cafefreezer = { aux: [
    { dev: 'fz_icecreamchest#0:0', sfx: [[.05, 'slide'], [.6, 'whoosh']] },
    { dev: 'fz_flipsign#0:0', sfx: [[.35, 'flip'], [.9, 'pop']] },
    { dev: 'fz_frostshelf#0:0', sfx: [[.08, 'tap'], [.35, 'clink'], [.75, 'thump']] }] };
  CHAINS_ON[39] ??= 'cafefreezer';
}
