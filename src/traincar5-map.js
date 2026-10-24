// 28판 시골 전차 두 량 — traincar5 (허브가 고른 A의 디테일판) · 러프 블록아웃 두 안 traincar5a · traincar5b (⑧ 10/24, 사용자 "전차 완전 새롭게 다시… 완전 디테일하고 좋아 보이게";
// 허브: 기차 바깥은 하늘색 한 장, 창 안만 흐름, 공중에 뜬 두 량 단면, 맑은 낮빛, 두 량이 폰 세로 화면을 꽉 채우게). 미리보기 전용 —
// 판 표(stages.js PLAN·NEW_MAPS)와 옛 키(traincar·traincar3·gpttraincar2·traincar4)는 그대로. 미리보기 ?gptmap=traincar5a / traincar5b.
// 대본·물건·빛 표는 roomalias.js 별칭(→ traincar3 → traincar). 모델은 gfx/traincar5-props.js.
// 카메라: 두 안 같은 yaw .4(기차를 길이 쪽으로 비스듬히 보아 두 량이 세로 화면에 길게 서고, 먼 쪽 창도 보이게) · fitW 7.5(가장 가까이) · 판 줌.
//   A 일렬 청록 로컬 전차 (4 × 13): 1호차 = 앞코 운전실 칸막이 + 양쪽 롱시트 + 손잡이 봉·짐 선반 / 연결 통로(곧게, 고무 주름막) /
//     2호차 = 창가 박스석 둘 + 짐 선반, 바닥 짐, 꼬리 전망석 소파와 열린 꼬리 난간. 지붕은 다 걷고 처마만, 가까운 쪽은 낮은 턱.
//   B 엇갈린 레트로 노면 전차 (6 × 14): 두 량을 2 m 엇갈려(굽은 길을 도는 듯) 비스듬한 연결 통로로 이음 — 먼 칸(2호차) = 앞코
//     운전실(큰 앞창·운전대) + 짐칸(철망 칸·자전거·과일 상자) + 접이 좌석 / 가까운 칸(1호차) = 양쪽 박스석 넷 + 짐 선반, 꼬리.
//     가까운 쪽은 허리 높이 벽, 지붕은 두 량의 바깥 끝(앞코·꼬리)에만 한 토막 남김. 버터 크림 + 순한 하늘파랑, 나무 마루.
import { registerFurniture } from './gfx/furniture.js';
import { TRAINCAR5_BUILDERS, TRAINCAR5_INFO } from './gfx/traincar5-props.js';
import { ROOM_AS } from './roomalias.js';

ROOM_AS.traincar5 = ['traincar3', 'traincar'];
ROOM_AS.traincar5a = ['traincar3', 'traincar'];
ROOM_AS.traincar5b = ['traincar3', 'traincar'];

const HP = Math.PI / 2;
const ft = (type, x, z, a = 0, opts = {}) => ({ type, x, z, a, opts });
const CAM = { yaw: .4, fitW: 7.5 };
const base = theme => ({ exact: true, bleed: null, slab: 'none', noEntry: true, wallH: 3.0, theme, ...CAM, walls: { N: 'none', W: 'none', S: 'none', E: 'none' } });

export function makeTraincar5a(theme) {
  const v = 'a', X0 = -2, zA = -3.5, zB = 3.5;
  const win = (z, o = {}) => ft('twindow5', X0, z, HP, { v, ...o });
  return { ...base(theme), w: 4, d: 13,
    cut: [{ i: 0, j: 0, w: 4, d: 1 }, { i: 0, j: 6, w: 1, d: 1 }, { i: 3, j: 6, w: 1, d: 1 }],
    floorZones: [{ i: 1, j: 6, w: 2, d: 1, kind: 'planks', a: '#6b6878', b: '#615e6e' }],
    friendAt: [.4, 4.6],
    furniture: [
      // 1호차: 운전실 칸막이 · 롱시트 둘 · 짐 선반(여행 가방) · 창 둘
      ft('tc5shell', 0, zA, 0, { v, w: 4, len: 6, nose: true }), ft('tc5wall', 0, zA, 0, { v, w: 4, len: 6 }),
      ft('tc5end', 0, -5.55, 0, { v, w: 4, kind: 'cab', dir: 1 }),
      win(-4.25, { blind: true }), win(-2.35),
      ft('tc5long', X0 + .31, -3.3, HP, { v, len: 3.2, drawer: true }), ft('tc5long', 1.69, -3.3, -HP, { v, len: 3.2 }),
      ft('tc5rack', X0, -3.3, HP, { v, len: 3.6, straps: true, case: -.8 }),
      ft('tc5end', 0, -.57, 0, { v, w: 4, kind: 'arch', dir: -1 }),
      // 연결 통로
      ft('tc5gang', 0, 0, 0, { len: 1, hw: .9 }),
      // 2호차: 통로 문(자물쇠) · 박스석 둘 · 짐 선반 · 바닥 짐 · 꼬리 전망석 + 난간
      ft('tc5end', 0, .57, 0, { v, w: 4, kind: 'door', dir: 1 }),
      ft('tc5shell', 0, zB, 0, { v, w: 4, len: 6, tail: true }), ft('tc5wall', 0, zB, 0, { v, w: 4, len: 6 }),
      win(1.75, { curtain: true }), win(3.7),
      ft('tc5box', X0 + .5, 1.75, HP, { v, drawer: true }), ft('tc5box', X0 + .5, 3.7, HP, { v }),
      ft('tc5rack', X0, 2.75, HP, { v, len: 3.8, case: .9 }),
      ft('tc5bags', 1.35, 2.3, -.4, { v }),
      ft('tc5view', 0, 5.2, 0, { v, w: 1.6 }), ft('tc5end', 0, 6.42, 0, { v, w: 4, kind: 'deck', dir: -1 })] };
}

export function makeTraincar5b(theme) {
  const v = 'b', xP = -1, xQ = 1, zP = -4, zQ = 4;
  const win = (x, z, o = {}) => ft('twindow5', x, z, HP, { v, ...o });
  return { ...base(theme), w: 6, d: 14,
    // the two cars 2 m apart sideways; between them only the slanted walk across stays
    cut: [{ i: 4, j: 0, w: 2, d: 6 }, { i: 0, j: 8, w: 2, d: 6 }, { i: 0, j: 6, w: 1, d: 1 }, { i: 3, j: 6, w: 3, d: 1 }, { i: 0, j: 7, w: 2, d: 1 }, { i: 4, j: 7, w: 2, d: 1 }],
    floorZones: [{ i: 1, j: 6, w: 2, d: 1, kind: 'planks', a: '#6b6878', b: '#615e6e' }, { i: 2, j: 7, w: 2, d: 1, kind: 'planks', a: '#6b6878', b: '#615e6e' }],
    friendAt: [1.2, 5.9],
    furniture: [
      // 먼 칸(2호차): 앞코 운전실 · 짐칸 · 접이 좌석 · 창 둘 · 통로 문(자물쇠)
      ft('tc5shell', xP, zP, 0, { v, w: 4, len: 6, nose: true, half: true }), ft('tc5wall', xP, zP, 0, { v, w: 4, len: 6, cap: -1 }),
      ft('tc5cab', xP, -6.5, 0, { v, w: 4 }),
      win(xP - 2, -5.15, { blind: true }), win(xP - 2, -2.05),
      ft('tc5cargo', xP - 1.6, -4.1, HP, { v }),
      ft('tc5long', xP - 1.69, -2.0, HP, { v, len: 1.6, drawer: true }),
      ft('tc5end', xP, -1.07, 0, { v, w: 4, kind: 'door', dir: -1 }),
      // 비스듬한 연결 통로
      ft('tc5gang', 0, 0, 0, { len: 2, dx: 2, hw: .9 }),
      // 가까운 칸(1호차): 박스석 넷 · 짐 선반(여행 가방) · 창 둘 · 꼬리
      ft('tc5end', xQ, 1.07, 0, { v, w: 4, kind: 'arch', dir: 1 }),
      ft('tc5shell', xQ, zQ, 0, { v, w: 4, len: 6, tail: true, half: true }), ft('tc5wall', xQ, zQ, 0, { v, w: 4, len: 6, cap: 1 }),
      win(xQ - 2, 2.6, { curtain: true }), win(xQ - 2, 4.75),
      ft('tc5box', xQ - 1.5, 2.6, HP, { v, drawer: true }), ft('tc5box', xQ - 1.5, 4.75, HP, { v }),
      ft('tc5box', xQ + 1.5, 2.6, -HP, { v }), ft('tc5box', xQ + 1.5, 4.75, -HP, { v }),
      ft('tc5rack', xQ - 2, 3.65, HP, { v, len: 4.0, case: -.9 }),
      ft('tc5end', xQ, 6.93, 0, { v, w: 4, kind: 'rear', dir: -1 })] };
}

// ── 28판 최종 키 traincar5 (⑧ 10/24, 허브가 A를 고름 → 디테일): A 바탕, 시작 화면에서 창 안 흐르는 띠가 보이게 yaw .62(양 끝은 조금 잘림)
// (사용자 메모 10/24 손보기: 객차 흔들림·흐르는 선로, 통로 문은 열어 둠(몽글이가 뚫고 지나가지 않게)·문 퀄, 창턱 길이, 운전실 2 m로 넓히고 앞쪽 끝까지,
//  가방·모자·서랍·신문·손잡이·광고·복도 디테일)
//   1호차 (z -6.5..-.5): 앞코 운전실(칸막이 위 노선도·행선 표시, 운임함, 문 안에 계기판·운전석·기관사 모자·운행표·큰 앞창),
//     창 쪽 롱시트(좌석 서랍 자물쇠, 놓고 간 신문·컵라면)와 가까운 쪽 롱시트(귤 망·차), 짐 선반(여행 가방 = 너굴이 자리·배낭),
//     손잡이 봉과 걸린 광고 둘, 창 둘(롤 블라인드 / 하차 벨), 창 쪽 출입문(문 창에도 풍경이 흐름) + 정리권 발권기, 문 위 벽 선풍기,
//     세로 손잡이 봉 + 하차 벨, 광고 띠
//   연결 통로 (z -.5..5): 고무 주름막(숨는 자리), 놓고 간 빨간 우산; 2호차 끝벽의 통로 문(비밀번호, 문 뒤 너굴이 크기 자리)
//   2호차 (z .5..6.5): 창가 박스석 둘(좌석 서랍 자물쇠·역 도시락 / 카드·과자), 창 셋(커튼·컵 / 맑은 창 / 꼬리 창), 창 사이 액자 광고,
//     더플백 선반, 바닥 짐, 꼬리 전망석 소파와 열린 꼬리 난간(꼬리 등·깃발), 광고 띠
export function makeTraincar5(theme) {
  const v = 'a', X0 = -2, zA = -3.5, zB = 3.5;
  const win = (z, o = {}) => ft('twindow5', X0, z, HP, { v, ww: 1.3, ...o });
  // (사용자 메모 10/24: 1호차 창은 롱시트 등받이 위로 올리고 얇은 창턱만 — 창턱이 등받이를 뚫지 않게; 2호차 박스석 창은 창턱 없이 탁자가 창턱)
  const win1 = (z, o = {}) => win(z, { ww: 1.0, hh: 1.2, cy: 1.78, sill: 'short', ...o });
  return { ...base(theme), w: 4, d: 13, yaw: .62,
    // the cab's two tiles have no floor to walk on (its own rubber floor is drawn) · the gap between the cars but for the walk across
    cut: [{ i: 0, j: 0, w: 4, d: 2 }, { i: 0, j: 6, w: 1, d: 1 }, { i: 3, j: 6, w: 1, d: 1 }],
    floorZones: [{ i: 1, j: 6, w: 2, d: 1, kind: 'planks', a: '#6b6878', b: '#615e6e' }],
    friendAt: [.4, 4.6],
    furniture: [
      // 흐르는 선로(두 량 밑 한 판, 침목만 뒤로 흐르고 양 끝은 옅어짐) + 객차 흔들림
      ft('tc5track', 0, 0, 0, { len: 20 }),
      // 1호차: 넓힌 운전실(2 m) · 운전실 옆 창 · 창 둘(롤 블라인드 / 하차 벨) · 롱시트 둘 · 짐 선반 · 옆 출입문 · 세로 봉 · 정리권 발권기 · 통로 매트
      ft('tc5shell', 0, zA, 0, { v, w: 4, len: 6, nose: true, carNo: 1, noTrack: true }), ft('tc5wall', 0, zA, 0, { v, w: 4, len: 6, ads: true, fan: -1.25 }),
      ft('tc5end', 0, -4.5, 0, { v, w: 4, kind: 'cab', dir: 1, depth: 2.0 }),
      win(-5.55, { ww: .9, hh: 1.0, cy: 1.85, sill: 'none', noSill: true }),
      win1(-3.6, { blind: true }), win1(-2.45, { bell: true }),
      ft('tc5door', X0, -1.25, HP, { v, dw: .8 }),
      ft('tc5long', X0 + .31, -2.95, HP, { v, len: 2.1, drawer: true, stuff: 'paper' }), ft('tc5long', 1.69, -2.75, -HP, { v, len: 3.0, stuff: 'mikan', noUnder: true }),
      ft('tc5rack', X0, -2.95, HP, { v, len: 2.2, ry: 2.52, brackets: [-1.0, 0, 1.0], straps: true, case: .6, pack: -.55, hang: [0] }),
      ft('tc5pole', 1.15, -1.0, 0, { v }), ft('tc5mat', 0, -2.6, 0, { len: 3.4, w: 1.1 }),
      ft('tc5end', 0, -.57, 0, { v, w: 4, kind: 'arch', dir: -1, ticket: true }),
      // 연결 통로
      ft('tc5gang', 0, 0, 0, { len: 1, hw: .9, umbrella: true }),
      // 2호차: 통로 문(주머니 벽에 열어 둠) · 박스석 둘 · 창 셋 · 더플백 선반 · 바닥 짐 · 통로 매트 · 꼬리 전망석
      ft('tc5end', 0, .57, 0, { v, w: 4, kind: 'door', dir: 1, sign: 2 }),
      ft('tc5shell', 0, zB, 0, { v, w: 4, len: 6, tail: true, carNo: 2, noTrack: true }), ft('tc5wall', 0, zB, 0, { v, w: 4, len: 6, ads: true, posters: [2.72], pk: 1 }),
      win(1.75, { curtain: true, sill: 'none' }), win(3.7, { sill: 'none' }), win(5.55, { ww: 1.1, hh: 1.2, cy: 1.78, sill: 'short', noSill: true }),
      ft('tc5box', X0 + .5, 1.75, HP, { v, drawer: true, stuff: 'bento' }), ft('tc5box', X0 + .5, 3.7, HP, { v, stuff: 'cards' }),
      ft('tc5rack', X0, 2.72, HP, { v, len: 3.6, ry: 2.52, noCase: true, duffel: -.9 }),
      ft('tc5bags', 1.35, 2.3, -.4, { v }), ft('tc5mat', .45, 2.85, 0, { len: 3.9, w: 1.1 }),
      ft('tc5view', 0, 5.2, 0, { v, w: 1.6 }), ft('tc5end', 0, 6.42, 0, { v, w: 4, kind: 'deck', dir: -1, spot: false })] };
}

export function installTraincar5(MAPS, THEMES, LAYOUTS) {
  registerFurniture(TRAINCAR5_BUILDERS, TRAINCAR5_INFO);
  // (친구·대본·물건은 옛 28판 traincar3 그대로 — 테마 바탕은 그 판 것, 마루 색만 이 안의 것)
  const old = THEMES.traincar3 || THEMES.traincar || {};
  const sky = ['#9fd3f1', '#e6f6fd'];
  THEMES.traincar5a = { ...old, name: '청록 로컬 전차', friend: old.friend ?? 'raccoon', bg: sky, base: '#8fc66a', wallKind: 'plain', wall: '#fbf2df', wall2: '#fbf2df',
    floorKind: 'planks', floor: '#e6bf84', floor2: '#dcb377', wood: '#c98f55' };
  THEMES.traincar5b = { ...old, name: '레트로 노면 전차', friend: old.friend ?? 'raccoon', bg: sky, base: '#8fc66a', wallKind: 'plain', wall: '#fdf3dc', wall2: '#fdf3dc',
    floorKind: 'planks', floor: '#c99560', floor2: '#bd8854', wood: '#b9824e' };
  THEMES.traincar5 = { ...THEMES.traincar5a, name: '봄빛 로컬 전차' };
  LAYOUTS.traincar5 = makeTraincar5(THEMES.traincar5);
  LAYOUTS.traincar5a = makeTraincar5a(THEMES.traincar5a);
  LAYOUTS.traincar5b = makeTraincar5b(THEMES.traincar5b);
}
