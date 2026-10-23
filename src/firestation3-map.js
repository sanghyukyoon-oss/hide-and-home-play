// 19판 곰돌이네 119 안전센터 3 — firestation3 (① 10/23, 사용자 "19도 마찬가지 — 새로 디테일 있게"): 소방서 모양 단면 + 둥근 작은 섬.
// 건물·섬은 gfx/firestation3-props.js(fs3_house · fs3_island). 옛 키(firestation · firestation2 · gptfirestation)는 그대로 둔다.
// 이 판의 부품 이름은 그대로 쓴다: 정본 장비 걸이 gearrack(자물쇠 열쇠 걸이)·사물함 lockers(비번 자물쇠)·소방차 firetruck,
// GPT 소방서 조각 셋(출동 종 gpt_firebell · 호스 건조탑 gpt_hosetower · 졸린 소방견 집 gpt_firedoghouse) — 장치 표 gpt-chains-a.js.
// 자리: 아치 차고 안에 소방차(앞을 보고, 셔터 아래), 당직 탑 아래층 왼쪽에 장비 걸이(오른쪽을 봄), 기둥 옆에 사물함, 오른쪽 계단으로 2층 당직실;
// 건조탑은 차고 왼쪽 잔디 띠(차고에 붙은 탑), 출동 종은 차고 앞 왼쪽, 소방견 집은 앞 오른쪽 잔디 모퉁이; 소화전·콘·택배 상자·자전거만 조금.
// 대본·물건 풀·빛은 옛 키로 이어짐(roomalias.js firestation3 → firestation).
import { registerFurniture } from './gfx/furniture.js';
import { FS3_BUILDERS, FS3_INFO } from './gfx/firestation3-props.js';

export function installFirestation3(LAYOUTS, THEMES) {
  if (!THEMES.firestation) return;
  registerFurniture(FS3_BUILDERS, FS3_INFO);
  // (바닥판은 섬이 대신함 — 테마 바닥은 섬 포장색 한 가지, 사물함은 흐린 파랑)
  THEMES.firestation3 = { ...THEMES.firestation, name: '곰돌이네 119 안전센터', floorKind: 'carpet', floor: '#ece5d9', floor2: '#ece5d9', base: '#d3a47a', edge: '#b0805a',
    locker: '#8fb3d3', friend: THEMES.firestation.friend ?? 'bear' };
  LAYOUTS.firestation3 = {
    w: 10, d: 8, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 15, yaw: .62,
    cut: [{ i: 0, j: 7, w: 1, d: 1 }, { i: 9, j: 7, w: 1, d: 1 }],
    wallH: 0, walls: { N: 'none', W: 'none', E: 'none', S: 'none' },
    theme: THEMES.firestation3,
    furniture: [
      { type: 'fs3_island', x: 0, z: 0 },
      { type: 'fs3_house', x: 0, z: 0 },
      { type: 'firetruck', x: -1.9, z: -.95, a: -Math.PI / 2 },
      { type: 'gearrack', x: .4, z: -1.15, a: Math.PI / 2 },
      { type: 'lockers', x: 1.82, z: -1.75 },
      { type: 'gpt_hosetower', x: -4.33, z: -3.0, s: .7 },
      { type: 'gpt_firebell', x: -4.2, z: 1.05, a: .35 },
      { type: 'gpt_firedoghouse', x: 3.6, z: 1.8 },
      { type: 'hydrant', x: 1.4, z: 2.55 },
      { type: 'cones', x: 2.45, z: 3.3, y: -.115 },
      { type: 'boxstack', x: 3.6, z: -2.7 },
      { type: 'bike2', x: 4.35, z: -1.0, a: -Math.PI / 2 },
    ],
    decor: [], friendAt: [1.2, .9],
  };
  // 비교안 firestation3b (사용자 10/23 승인 방향 "지붕은 거대 소방 헬멧"): 같은 섬·배치, 당직 탑 지붕만 거대 소방 헬멧 — 사이렌은 차고 아치 꼭대기로
  THEMES.firestation3b = THEMES.firestation3;
  LAYOUTS.firestation3b = { ...LAYOUTS.firestation3, furniture: LAYOUTS.firestation3.furniture.map(e => e.type === 'fs3_house' ? { ...e, opts: { helmet: true } } : e) };
}
