// 28판 봄빛 로컬 열차 두 량 — traincar4 (⑧ 10/23, 사용자 "2량으로, GPT 대안 참고해 완전히 새 디자인. 창밖 배경은 패럴랙스로 계속 옆으로
// 지나가게, 배경 하늘색"; 허브: 칸 사이 통로를 숨는 자리·장치로, 가끔 터널, 28판은 맑은 한낮). 옛 키(traincar·traincar2·traincar3·
// gpttraincar2)와 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=traincar4, 대본·물건·빛은 roomalias.js(traincar4 → traincar3 → traincar).
// 모델은 gfx/traincar4-props.js. 방 하나(5 × 13)에 z를 따라: 앞 칸(1호차 좌석칸, z -6.5..-.5) · 연결 통로(1 m — 두 칸 사이 바닥은
// 가운데 1 m만 남기고 뚫림, 아래로 선로가 보임) · 뒤 칸(2호차 식당칸 + 꼬리 전망 소파, z .5..6.5). 창 쪽 벽은 방의 벽이 아니라 칸마다
// tc4wall(두 칸 사이가 끊겨 보이게; 방의 벽처럼 카메라 쪽이면 무릎 높이로 접힘).
//   앞 칸: 창 쪽에 청록 긴 좌석 둘(신문·컵라면 / 서랍 자물쇠·귤), 그 위 짐 선반(여행 가방 = 너굴이 숨는 칸, 배낭), 출입문 한 쌍,
//          앞 끝벽(노선도·행선 표시·운전실 문·소화기함·하차 벨), 열린 쪽에 좌석 하나(밀짚모자), 통로에 간식 카트(비밀번호), 바닥 짐
//   통로: 고무 주름막(누르면 출렁 벌어짐, 사이 숨김 자리) · 뒤 칸 끝벽의 통로 미닫이 문(자물쇠 가능, 그 뒤 너굴이 크기 자리)
//   뒤 칸: 창 쪽 마주보기 자리 둘(커튼 창, 방석 밑 칸), 열린 쪽 역 도시락 매대(서랍 자물쇠·빵 진열장), 꼬리에 전망 소파와 낮은 난간
// 바깥: tc4scenery가 통로 한가운데에서 기차 둘레 전체를 그림(두꺼운 층진 받침, 풍경 띠마다 다른 빠르기, 가끔 터널).
import { registerFurniture } from './gfx/furniture.js';
import { TRAINCAR4_BUILDERS, TRAINCAR4_INFO } from './gfx/traincar4-props.js';
import { ROOM_AS } from './roomalias.js';

// 방 키 별칭: 대본(traincarInc)·물건 풀·빛·장치 표는 옛 28판 traincar3 → traincar 것을 그대로 받음 (roomalias.js 표는 그대로 두고 여기서 한 줄)
ROOM_AS.traincar4 = ['traincar3', 'traincar'];

const HP = Math.PI / 2;
const ft = (type, x, z, a = 0, opts = {}) => ({ type, x, z, a, opts });
const D = (type, wall, u, opts = {}) => ({ type, wall, u, opts });
// the window wall's pieces stand on the car's open floor edge at x -2.5, their backs to the (piece) wall
const hung = (type, z, opts = {}) => ft(type, -2.5, z, HP, opts);

export function makeTraincar4(theme) {
  const zA = -3.5, zB = 3.5;
  return { w: 5, d: 13, exact: true, bleed: null, slab: 'none', noEntry: true, wallH: 3.0, theme, fitW: 11.7, yaw: .42,
    walls: { N: 'wall', W: 'none', S: 'none', E: 'none' },
    // the gap between the cars: only the middle metre of floor goes across
    cut: [{ i: 0, j: 6, w: 2, d: 1 }, { i: 3, j: 6, w: 2, d: 1 }],
    // 2호차 (식당칸): a coral-and-cream checker floor
    floorZones: [{ i: 0, j: 7, w: 5, d: 6, kind: 'checker', a: '#f6e6d2', b: '#efc8bb' }],
    friendAt: [.2, 4.9],
    furniture: [
      // 1호차 (좌석칸)
      ft('tc4shell', 0, zA, 0, { car: 0 }), ft('tc4wall', 0, zA, 0, { car: 0 }),
      hung('twindow4', -5.25, { cup: true }), hung('twindow4', -3.3, { blind: true }), hung('tc4sidedoor', -1.42),
      hung('tc4rack', zA, { len: 6.0, racks: [1.75, -.2], door: [-2.55, -1.3], fan: -1.92 }),
      ft('tc4bench', -2.11, -5.25, HP, { stuff: 'paper' }), ft('tc4bench', -2.11, -3.3, HP, { drawer: true, stuff: 'mikan' }),
      ft('tc4bench', 2.11, -5.25, -HP, { stuff: 'hat' }),
      ft('tc4cart', .45, -2.85, .15), ft('tc4luggage', 1.95, -1.6, -.35),
      ft('tc4endwall', 0, -.57, 0, { end: 1 }),
      // 연결 통로 · 바깥 풍경
      ft('tc4gangway', 0, 0), ft('tc4scenery', 0, 0),
      // 2호차 (식당칸)
      ft('tc4endwall', 0, .57, 0, { end: -1, door: true }),
      ft('tc4shell', 0, zB, 0, { car: 1 }), ft('tc4wall', 0, zB, 0, { car: 1 }),
      hung('twindow4', 1.85, { curtain: true }), hung('twindow4', 4.08, { curtain: true, cup: true }),
      ft('tc4booth', -1.84, 1.85, HP), ft('tc4booth', -1.84, 4.08, HP),
      ft('tc4counter', 1.92, 2.6, HP), ft('tc4sofa', .4, 5.9, 0), ft('tc4tail', 0, 6.42, 0)],
    decor: [D('tc4front', 'N', 0)] };
}

export function installTraincar4(MAPS, THEMES, LAYOUTS) {
  registerFurniture(TRAINCAR4_BUILDERS, TRAINCAR4_INFO);
  // (친구·대본·물건은 옛 28판 traincar3 그대로 — 테마 바탕은 그 판 것, 색만 이 판의 크림·주황·청록)
  const old = THEMES.traincar3 || THEMES.traincar || {};
  THEMES.traincar4 = { ...old, name: '봄빛 로컬 열차', friend: old.friend ?? 'raccoon', bg: ['#bfe5f8', '#e6f6fd'], base: '#8fc66a',
    wallKind: 'plain', wall: '#fbf2df', wall2: '#fbf2df', wainscot: '#cde7dc', trim: '#f2963a', wallEdge: '#f7ead0',
    floorKind: 'planks', floor: '#e6bf84', floor2: '#dcb377', wood: '#c98f55' };
  LAYOUTS.traincar4 = makeTraincar4(THEMES.traincar4);
}
