// 19판 곰돌이네 119 안전센터 2 — firestation2 (① 10/22, 사용자: "지금 정본 유지 + 손본 안(GPT 소방서)의 오브젝트를 가져와 재배치, 도르래 같은 장치 추가").
// 바탕은 정본 firestation(stages.js LAYOUTS — 벽돌 차고·셔터·소방차·장비 걸이·사물함·길·자전거·가로등·택배 상자); 옛 키는 그대로 둔다.
// GPT 소방서(gfx/gpt3k-fire-props.js, gpt3k-import.js가 등록)에서 크기·양식이 맞는 조각 셋만 들여 우리 8×6 마당에 다시 놓음:
//   호스 건조탑 gpt_hosetower — 손잡이를 돌리면 호스가 올라가는 도르래, 북서 구석(옛 호스 릴 자리), 3.5 m로 줄임
//   출동 종 gpt_firebell — 당기면 종이 흔들림, 서쪽 담 앞(옛 벽 종·콘 자리)
//   졸린 소방견 집 gpt_firedoghouse — 지붕이 열리고 시바가 잠, 마당 오른쪽(옛 벤치·공구함 자리)
// 섬 받침·건물 몸체·소방봉(곰돌이가 이 판의 숨은 친구라 둘이 됨)·훈련 마당·안내판(119 포스터 단서와 헷갈림)·쉼터는 뺌.
// 벤치는 길 건너편 가장자리(자전거와 가로등 사이)로, 우편함은 담의 길 쪽으로, 소방차는 오른쪽으로 85 cm(탑 손잡이가 보이게)·차고는 그 가운데로.
// 대본·물건 풀·자물쇠·조립 키트·빛은 옛 키로 이어짐(roomalias.js firestation2 → firestation).
import { townTheme, withTown } from './gfx/town-kit.js';

const F = (type, i, j, rot = 0, fine) => ({ type, i, j, rot, ...fine });
const D = (type, wall, u) => ({ type, wall, u });

export function installFirestation2(LAYOUTS, THEMES) {
  const old = LAYOUTS.firestation;
  if (!old || !THEMES.firestation) return;
  // (공통 룩 키트: 26판 동네 배경 — 집 벽은 옛 19판의 옅은 벽돌·크림·흰 파랑, 지붕은 남색·벽돌 빨강)
  THEMES.firestation2 = townTheme(THEMES.firestation, { gptSky: '#ffe6c8', gptGround: '#eadbc8', gptGroundFar: '#ffe6c8', gptPaving: '#ddd0c0', townWalls: ['#f6d2c4', '#e8eef5', '#fbe9c8', '#f3c9bd', '#eef2f4', '#f8e2b8'], townRoofs: ['#4d7996', '#e0604a', '#5c8fb5', '#c9503f', '#4d7996', '#d9734f'] });
  LAYOUTS.firestation2 = withTown({
    ...old, theme: THEMES.firestation2,
    furniture: [
      { type: 'gpt_hosetower', x: -3.22, z: -2.25, s: .75 },
      F('gearrack', 5, 0), F('lockers', 7, 0),
      F('firetruck', 1, 1, 0, { dx: .85 }),
      { type: 'gpt_firebell', x: -3.45, z: -.6, a: Math.PI / 2 },
      { type: 'gpt_firedoghouse', x: 2.55, z: -.35 },
      F('cones', 0, 3), F('hydrant', 4, 3),
      F('bike2', 0, 5), F('bench', 2, 5), F('streetlamp', 4, 5), F('boxstack', 7, 5),
    ],
    decor: [D('firegarage', 'N', -.3), D('mailbox', 'W', -1.6)],
    friendAt: [2.6, 1.6],
  });
}
