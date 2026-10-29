// 19판 곰돌이네 119 안전센터 3 — firestation3 (① 10/23, 사용자 "19도 마찬가지 — 새로 디테일 있게"): 소방서 모양 단면 + 둥근 작은 섬.
// 건물·섬은 gfx/firestation3-props.js(fs3_house · fs3_island). 옛 키(firestation · firestation2 · gptfirestation)는 그대로 둔다.
// 이 판의 부품 이름은 그대로 쓴다: 정본 장비 걸이 gearrack(자물쇠 열쇠 걸이)·사물함 lockers(비번 자물쇠)·소방차 firetruck,
// 장치 조각 셋(출동 종 fs3_bell · 호스 건조탑 fs3_hosetower · 소방견 집 fs3_doghouse — ① 10/24 GPT 것을 우리 그림체로 새로) — 장치 표 gpt-chains-a.js.
// 둘레는 훈련 마당 fs3_yard(gfx/firestation3-bg.js), 소방차는 바퀴 v2(opts.wheels — gfx/town-props.js).
// 자리: 아치 차고 안에 소방차(앞을 보고, 셔터 아래), 당직 탑 아래층 왼쪽에 장비 걸이(오른쪽을 봄), 기둥 옆에 사물함, 오른쪽 계단으로 2층 당직실;
// (10/29 밤 대수선, 사용자 "소방차 숨기는 곳 바로 옆이 벽이라 보이지도 않아"): 소방차는 새 모양(opts.fs3)·열리는 칸이 카메라 쪽(+x), 아치 기둥에 안 가리게 놓고
// 그 옆을 비움; 장비 걸이는 차 옆을 막지 않게 당직 탑 아래 뒤쪽으로(앞을 봄), 방화복·당직실 이불은 휘어지는 천; 사물함은 계단에 안 가리게 왼쪽으로,
// 호스 건조탑(장치)은 차고 뒤에 숨어 있어서 차고 왼쪽 앞 띠로, 출동 종은 그 앞으로 조금.
// 건조탑은 차고 왼쪽 잔디 띠(차고에 붙은 탑), 출동 종은 차고 앞 왼쪽, 소방견 집은 앞 오른쪽 잔디 모퉁이; 소화전·콘·택배 상자·자전거만 조금.
// 대본·물건 풀·빛은 옛 키로 이어짐(roomalias.js firestation3 → firestation).
import { registerFurniture } from './gfx/furniture.js';
import { FS3_BUILDERS, FS3_INFO } from './gfx/firestation3-props.js';
import { FS3BG_BUILDERS, FS3BG_INFO } from './gfx/firestation3-bg.js';

export function installFirestation3(LAYOUTS, THEMES) {
  if (!THEMES.firestation) return;
  registerFurniture(FS3_BUILDERS, FS3_INFO); registerFurniture(FS3BG_BUILDERS, FS3BG_INFO);
  // (바닥판은 섬이 대신함 — 테마 바닥은 섬 포장색 한 가지, 사물함은 흐린 파랑)
  THEMES.firestation3 = { ...THEMES.firestation, name: '곰돌이네 119 안전센터', floorKind: 'carpet', floor: '#ece5d9', floor2: '#ece5d9', base: '#d3a47a', edge: '#b0805a',
    locker: '#8fb3d3', friend: THEMES.firestation.friend ?? 'bear' };
  LAYOUTS.firestation3 = {
    // (the mini fire truck is built on the open apron in front of the garage, not in the island's back corner)
    kitAt: [.4, 1.7],
    w: 10, d: 8, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 15, yaw: .62,
    cut: [{ i: 0, j: 7, w: 1, d: 1 }, { i: 9, j: 7, w: 1, d: 1 }],
    wallH: 0, walls: { N: 'none', W: 'none', E: 'none', S: 'none' },
    theme: THEMES.firestation3,
    // (10/29 실폰: 파르페 모자 친구가 섬 뒤 덤불 속에 서 있었음 — 덤불은 섬 장식이라 걷는 칸 검사가 못 봄)
    npcAvoid: [[4.45, -3.35, .95], [4.55, -1.95, .75]],
    furniture: [
      { type: 'fs3_island', x: 0, z: 0 },
      { type: 'fs3_house', x: 0, z: 0 },
      { type: 'firetruck', x: -1.9, z: -1.4, y: .022, a: -Math.PI / 2, opts: { wheels: 'v2', fs3: true } },
      // (10/29 실폰: 가운데 방화복이 기본 카메라에서 소방 봉(x .55) 바로 뒤라 봉이 옷을 뚫은 것처럼 보임 → 장비 걸이와 사물함 자리를 맞바꿈:
      // 봉 뒤엔 단단한 사물함, 걸이는 오른쪽 벽에 앞을 가리는 것 없이)
      { type: 'gearrack', x: 1.1, z: -2.45, opts: { bend: true } },
      { type: 'lockers', x: -.45, z: -2.42 },
      { type: 'fs3_hosetower', x: -4.38, z: -.2, s: .7 },
      { type: 'fs3_bell', x: -4.2, z: 1.35, a: .35 },
      { type: 'fs3_doghouse', x: 3.6, z: 1.8 },
      { type: 'hydrant', x: 1.4, z: 2.55 },
      { type: 'cones', x: 2.45, z: 3.3, y: -.115 },
      { type: 'boxstack', x: 3.6, z: -2.7 },
      { type: 'bike2', x: 4.35, z: -.65, a: -Math.PI / 2 },
      // 둘레 (사용자 10/24 "배경 뒤쪽에 집 목업? 지우라 그냥 — 소방서랑 잘 어울리는 배경"): 흰 집·먼 빌라 대신 훈련 마당 —
      // 훈련탑·호스 건조대·훈련 소화전 줄·길과 횡단보도, 섬 밑동 높이의 땅에 깔아 섬이 그 위에 솟은 블록으로 (gfx/firestation3-bg.js)
      { type: 'fs3_yard', x: 0, z: 0, y: -.86, opts: { sky: '#cbe7f6' } },
    ],
    decor: [], friendAt: [1.2, .9],
  };
  // 비교안 firestation3b (사용자 10/23 승인 방향 "지붕은 거대 소방 헬멧"): 같은 섬·배치, 당직 탑 지붕만 거대 소방 헬멧 — 사이렌은 차고 아치 꼭대기로
  THEMES.firestation3b = THEMES.firestation3;
  LAYOUTS.firestation3b = { ...LAYOUTS.firestation3, furniture: LAYOUTS.firestation3.furniture.map(e => e.type === 'fs3_house' ? { ...e, opts: { helmet: true } } : e) };
}
