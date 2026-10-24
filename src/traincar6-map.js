// 28판 B안 — 2층 식당·침대 열차 한 량 인형집 단면 traincar6 (⑧ 10/24 디테일판; 사용자 "기차 안은 다른 디자인으로 B안 또 만들어 줘.
// 반복적으로 잘 안 되고 있다."; 허브: traincar3·4·5의 짜임 — 대각선으로 긴 두 량, 위에서 내려다보는 복도 — 은 다시 쓰지 말 것).
// 미리보기 전용 — 판 표(stages.js PLAN·NEW_MAPS·NEW_DEFAULT)와 traincar5(28판 기본)는 그대로. 미리보기 ?gptmap=traincar6.
// 대본·물건·빛은 roomalias 별칭(→ traincar3 → traincar). 모델은 gfx/traincar6-props.js.
// 구도: 한 량(5 × 4)을 길이 쪽으로 옆에서 잘라 거의 정면(yaw .22, 시작 줌 1.4) — 두 층 높이의 창 벽이 카메라를 마주 보고(창 띠가 크게 흐름), 왼쪽 끝벽에
// 연결 통로 문, 오른쪽 끝은 잘린 단면. 캠핑카·정비소 단면처럼 왼쪽 위에 다락(2층 침대 칸, 사다리로 올라감), 오른쪽은 두 층 높이로 트인 식당칸.
//   1층: 왼쪽 다락 밑 짐칸 선반(여행 가방 = 너굴이 자리)·우산꽂이 구석, 끝벽 통로 문(비밀번호)·노선도·행선 판·라디오 선반·시계·포스터,
//        창가 식탁 칸(탁상 등·도시락·찻잔·메뉴 카드, 의자 서랍 자물쇠)과 그 위 짐 그물 선반, 창 쪽 옆 출입문·세로 손잡이 봉(하차 벨)·바닥 짐,
//        손잡이 고리 줄, 찻잔 수레, 창 사이 메뉴판
//   2층(다락, 바닥 2.5 m — 물건 자리, 친구는 1층만 걸음): 커튼 달린 침대 칸(베개·이불·책·안경), 슬리퍼·작은 가방·랜턴; 윗줄 둥근 모서리 창 셋
// 잘린 끝(+x)에 둥근 지붕 단면 테, 먼 끝벽도 둥근 지붕 모양; 차체 아래 대차 둘·바퀴·두꺼운 자갈 선로 토막이 화면 아래를 채움
import { registerFurniture } from './gfx/furniture.js';
import { TRAINCAR6_BUILDERS, TRAINCAR6_INFO } from './gfx/traincar6-props.js';
import { ROOM_AS } from './roomalias.js';

ROOM_AS.traincar6 = ['traincar3', 'traincar'];

const HP = Math.PI / 2, Y2 = 2.5;
const ft = (type, x, z, a = 0, opts = {}, y) => ({ type, x, z, a, opts, ...(y != null ? { y } : {}) });

export function makeTraincar6(theme) {
  const Z0 = -2, win = (x, o) => ft('twindow6', x, Z0, 0, o);
  return { w: 5, d: 4, exact: true, bleed: null, slab: 'none', noEntry: true, wallH: 5.0, theme, yaw: .22, fitW: 7.5, homeShift: [-.35, -.87],
    walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    lofts: [{ i: 0, j: 0, w: 2, d: 2, y: Y2, ladder: 'S', ladderAt: .45 }],
    friendAt: [.6, .7],
    furniture: [
      ft('tc6shell', 0, 0, 0, { len: 5, w: 4 }), ft('tc6wall', 0, 0, 0, { len: 5, w: 4, menu: 1.2 }),
      ft('tc6end', -2.5, 0, HP, { w: 4, door: -1 }),
      // 1층: 다락 밑 짐칸 선반·우산꽂이 구석, 창가 식탁 칸(그물 선반 위), 옆 출입문(손잡이 봉·하차 벨, 바닥 짐), 손잡이 고리 줄, 찻잔 수레
      ft('tc6rack', -1.55, -1.72, 0), ft('tc6corner', -2.15, -.55, 0),
      ft('tc6booth', .3, -1.45, 0, { drawer: true }), win(.3, { ww: 1.2, hh: 1.2, cy: 1.55, curtain: true }), ft('tc6net', .3, Z0, 0, { len: 1.4 }),
      ft('tc6door', 1.95, Z0, 0), ft('tc6pole', 1.4, -1.55, 0), ft('tc6bag', 2.1, 1.62, -.2),
      ft('tc6straps', 1.05, -.35, 0, { len: 2.5 }), ft('tc6cart', 1.0, 1.15, -.3),
      // 2층(다락): 침대 칸(그 위 창 롤 블라인드), 슬리퍼·작은 가방·랜턴; 식당칸·문 위 윗줄 창
      ft('tc6berth', -1.5, -1.55, 0, { len: 1.8 }, Y2), ft('tc6loftbits', -1.2, -.45, 0, {}, Y2),
      win(-1.5, { ww: 1.1, hh: .85, cy: 3.5, blind: true, up: true }),
      win(.3, { ww: 1.2, hh: 1.0, cy: 3.6, noSill: true, up: true }), win(1.95, { ww: .9, hh: 1.0, cy: 3.6, noSill: true, up: true })] };
}

export function installTraincar6(MAPS, THEMES, LAYOUTS) {
  registerFurniture(TRAINCAR6_BUILDERS, TRAINCAR6_INFO);
  const old = THEMES.traincar3 || THEMES.traincar || {};
  THEMES.traincar6 = { ...old, name: '식당·침대 열차', friend: old.friend ?? 'raccoon', bg: ['#9fd3f1', '#e6f6fd'], base: '#8fc66a', wallKind: 'plain', wall: '#fbf3e4', wall2: '#fbf3e4',
    floorKind: 'carpet', floor: '#9fb7d8', floor2: '#8aa5cc', wood: '#cf9a68', woodD: '#a8764a' };
  LAYOUTS.traincar6 = makeTraincar6(THEMES.traincar6);
}
