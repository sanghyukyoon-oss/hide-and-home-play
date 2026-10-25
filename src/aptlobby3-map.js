// 38판 아파트 현관 3차 (10/24 — 사용자 메모 "이거 택배 트럭 뭐 그런 건가.. 구조 설계 다시 해 주고, 벽도 잘 만들어 주고, 디테일 잘 잡아 줘.
// '어서 오세요' 매트는 왜 아무 데나 걸려 있냐. 엘베는 스위치 누르면 엘베 오게끔."). 앞 버전(aptlobby2)은 그대로 두고 새 키 aptlobby3:
//   구조 — 로비(6×6, 뒤·왼쪽 벽)와 유리 현관 바깥(2×6, 하늘 아래 보도)을 두 칸으로 나눔: 뒷벽은 유리 앞에서 끝나고 돌기둥이
//   벽 끝과 유리를 이음 → 트럭이 실내에 든 것처럼 보이던 것(이삿짐 트럭)은 뺌. 바깥은 자전거·화단·단지 가로등.
//   벽 — 엘리베이터를 가운데 두고 양옆 화분·벽등, 오른쪽 무인 택배함; 왼쪽 벽은 우편함·게시판·소화전함·벽등, 그 밑 벤치.
//   매트 — '어서 오세요'는 유리문 바로 바깥 바닥에 하나만(실내 가운데 깔던 긴 매트·파란 매트는 뺌).
//   엘베 — 호출 버튼을 누르면 버튼에 불 → 문 위 화살표 등이 켜지며 '딩동' → 문이 열림(문만 눌러서는 안 열림).
// 대본(ROCKY_ROOM)·물건 풀·숨김 표는 aptlobby2 것을 같이 씀.
import { registerFurniture } from './gfx/furniture.js';
import { APTLOBBY3_BUILDERS, APTLOBBY3_INFO } from './gfx/aptlobby3-props.js';

const HP = Math.PI / 2;
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, ...(opts ? { opts } : {}) });
const D = (type, wall, u, opts) => ({ type, wall, u, ...(opts ? { opts } : {}) });
const at = (type, x, z, a = 0, opts) => ({ type, x, z, a, ...(opts ? { opts } : {}) });

export function installAptLobby3({ THEMES, MAPS, PLAN }) {
  registerFurniture(APTLOBBY3_BUILDERS, APTLOBBY3_INFO);
  if (!THEMES.aptlobby) return;
  const T = THEMES.aptlobby3 = { ...THEMES.aptlobby, name: '우리 아파트 현관' };
  const lob = { ...T, floorKind: 'tile', floor: '#f4efea', floor2: '#e7e0d8' };
  const out = { ...T, floorKind: 'brick', floor: '#d3d5dc', floor2: '#c5c8d1' };
  MAPS.aptlobby3 = () => ({ theme: T, friendAt: [-.9, .6], rooms: [
    // ── 로비 (x -4..2): 대리석 바닥, 앞줄은 낮은 턱, 뒷벽 가운데 엘리베이터
    { at: [-1, 0], layout: { w: 6, d: 6, theme: lob, walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' }, wallH: 3.0, panels: true, exact: true,
      // (바닥은 한 판 — 한 단 올렸더니 벽의 엘리베이터 바닥·유리 현관 안 발판이 그 밑에 묻혀 '엘리베이터 안'·'발판 위' 물건을 못 찾음, 회귀 10/24)
      furniture: [F('plant', 0, 0), F('plant', 3, 0), F('gpt_parcelcabinet', 4, 0),
        F('bench', 0, 2, 1), F('boxes', 0, 4), F('lockbox', 1, 4), F('dolly', 4, 3), F('umbrellastand', 5, 4),
        F('lowwall', 0, 5), F('lowwall', 2, 5),
        // (⑪ 10/26 아트 점검 '빈 바닥': 크림 대리석이 화면 절반을 차지해 휑함 → 가운데 큰 러그, 기다리는 소파·정수기·잡지꽂이)
        F('rug', 2, 2), F('lobbysofa', 4, 1, 2), F('watercan', 5, 2, 3), F('magazinerack', 1, 3, 1),
        at('al3_pillar', 2.85, -2.5)],
      decor: [D('al3_elevator', 'N', -1.0), D('al3_sconce', 'N', -2.5), D('al3_sconce', 'N', .5), D('clock', 'N', 1.55),
        D('mailboxes2', 'W', -.9), D('noticeboard', 'W', 1.0), D('firebox', 'W', -2.55), D('al3_sconce', 'W', 2.2)] } },
    // ── 현관 바깥 (x 2..4): 보도, 유리 현관(문은 바깥으로 열림), 매트, 자전거, 화단, 가로등 — 뒤는 산울타리
    { at: [3, 0], layout: { w: 2, d: 6, theme: out, walls: { N: 'hedge', W: 'none', S: 'none', E: 'none' }, exact: true,
      furniture: [F('glassentry', 0, 1), F('streetlamp2', 0, 0), F('bike2', 1, 0, 1), F('planter', 1, 4, 1),
        at('al3_mat', -.45, .85, HP)] } },
  ] });
  // 38판: 앞 버전 aptlobby2 → aptlobby3 (판 설정 timed 그대로)
  for (const k in PLAN) PLAN[k] = PLAN[k].map(e => e === 'aptlobby2:timed' ? 'aptlobby3:timed' : e);
}
