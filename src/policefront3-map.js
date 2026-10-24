// 21판 동네 파출소 앞 3안 policefront3 (① 10/23 — 사용자 "파출소도 다시 해 줘야 할 듯. 21. 도로에 담장 있고 지금.. 흠.."):
// 담장 없이 열린 길 모퉁이. 둥근 작은 섬(보도 + 차도 조금, 낮은 연석) 위에 파출소 단면(gfx/policefront3-props.js), 앞에 순찰차·자전거·
// 우체통·자판기·벤치. 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=policefront3 (판 자리 21: gpt-import.js GPT_STAGE).
// 보스 판 부품은 정본 가구 키 그대로: patrolcar(경광등 연출 staging.js) · lostbox · vending(비밀번호 자물쇠 후보) · mailbox · postbox2
// (열쇠 자물쇠 후보) · noticeboard2 · bench · hydrant · bike2 · streetlamp · cones · plantbig · plant · wantedboard. 대본·물건 풀·빛은
// roomalias.js가 옛 키 policefront로 이어 준다.
import { registerFurniture } from './gfx/furniture.js';
import { PF3_BUILDERS, PF3_INFO } from './gfx/policefront3-props.js';

const PI = Math.PI, HP = PI / 2;
const at = (type, x, z, a = 0, o = {}) => ({ type, x, z, a, ...o });

// 방 9 × 5 = 걷는 곳(보도·파출소·모퉁이 마당). 차도(13 cm 아래)와 건너편 보도는 방 앞 z 2.5~5.6의 섬 — 순찰차·러버콘은 차도 높이에.
const RY = -.13;
export const PF3_LAYOUT = {
  w: 9, d: 5, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 9.45, homeShift: [-1.56, -2.03],
  wallH: 0, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
  furniture: [
    at('pf3_base', 0, 0), at('pf3_station', 0, 0), at('pf3_far', 0, 0), at('pf3_town', 0, 0), at('pf3_pigeons', 0, 0),
    // 파출소 안: 정수기 · 수배 게시판 아래 책상과 의자 · 왼벽 주민 우편함
    at('watercooler', -2.55, -1.92),
    at('wantedboard', -.95, -2.285),
    at('officedesk', -.95, -1.83), at('officechair', -.65, -1.05, PI),
    at('mailbox', -4.265, -.75, HP),
    // 입구 옆 분실물 보관함 · 오른쪽 모퉁이 마당
    at('lostbox', 1.6, .62),
    at('noticeboard2', 1.9, -.05),
    at('vending', 2.3, -2.05), at('postbox2', 3.15, -2.05), at('plantbig', 3.85, -1.7),
    at('bike2', 3.35, -.85),
    at('plant', -4.05, .62),
    // 보도
    at('streetlamp', -4.15, 2.05), at('bench', -2.55, 1.95), at('hydrant', 4.3, 1.2),
    // 횡단보도 오른쪽 신호등 (팔이 차도 위로)
    at('pf3_signal', 3.78, 2.24),
    // 차도 (연석 아래)
    at('patrolcar', -1.1, 3.12, 0, { y: RY }), at('cones', -3.6, 2.95, 0, { y: RY }), at('cones', .5, 2.95, 0, { y: RY }),
  ],
  decor: [], friendAt: [2.4, -1.0],
};

export function installPolicefront3(LAYOUTS, THEMES) {
  registerFurniture(PF3_BUILDERS, PF3_INFO);
  const old = THEMES.policefront || {};
  // (옛 21판 테마 위에: 바닥은 섬이 그림 — 방 바닥판은 섬 밑에 가려지는 보도색 한 가지)
  THEMES.policefront3 = { ...old, name: old.name || '멍뭉이 순경의 파출소 앞', friend: old.friend ?? 'shiba', outdoor: true,
    floorKind: 'carpet', floor: '#e6e7ec', floor2: '#e6e7ec', base: '#d3d6de', lost: '#6f9be8' };
  // 배경: 하얀 단순한 동네 pf3_town (⑦의 공용 동네가 나오면 갈아 끼울 자리), 땅은 섬 밑바닥 높이
  THEMES.policefront3.townY = -.86;
  LAYOUTS.policefront3 = { ...PF3_LAYOUT, theme: THEMES.policefront3 };
}
