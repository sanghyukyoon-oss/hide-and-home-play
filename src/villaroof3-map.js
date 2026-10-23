// 20판 새 안 '햇살빌라 옥상 집들이' villaroof3 (① 10/23 — 사용자 "얘도 다시 처음부터.. 빌라 아래를 GPT처럼 대략 만들어 주고 배경도 대략 잡아
// 준 것 자체는 좋지만.. 좀 더 현실적이고 디테일하게 모델링 다시 해 줘"; 앞서 "옥상 수조 좀 더 크게, 문·벽돌색·나무·장독대가 오리지널처럼,
// 건물에 그리다 만 벽돌 텍스처 같은 건 버리자"; 검토 세션이 전한 승인 방향: 옥상 주인공은 ⑥의 스티로폼+사과 상자 텃밭 garden, 그 밖엔
// 물탱크·빨랫줄·평상·장독대 도르래, 아래층 계단실 단면을 살짝, 판마다 거대 소품 하나, 하얀 단순한 동네와 멀리 다음 판 파출소).
// 옥상 아래로 3층 적벽돌 빌라가 땅까지 이어지고(1층 필로티), 3층 계단실 모서리를 잘라 301호 현관과 계단이 보인다 — gfx/villaroof3-props.js.
// 옥상: 뒤 왼쪽 나무 데크(옛 20판 결)에 평상·집들이 상·전구 줄·풍선, 뒤 가운데 장독대(→ 도르래 장독대, devices.js), 뒤 오른쪽 계단실 위
// 거대한 노란 물탱크(이 판의 거대 소품), 앞 가운데·오른쪽 텃밭 둘(주인공, ⑥ garden 기본·마당 섞음), 앞 왼쪽 빨랫줄 이불(단서 걸이),
// 텃밭 옆 옥상 수도 — 가운데는 비움.
// 장치·자물쇠·대본 부품 키 유지: jangdok(도르래, 터치식), roofline(clueHang), snacktable(hunt-blind), 계단실 문(code 자물쇠 자리).
// 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=villaroof3 (GPT_STAGE 20), 대본·물건 풀·빛·장치는 roomalias.js로 villaroof2 것.
import { registerFurniture } from './gfx/furniture.js';
import { VR3_BUILDERS, VR3_INFO } from './gfx/villaroof3-props.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
// 테마: 옛 20판 그대로(가구가 읽는 키), 방수 바닥 초록만 — 옛 테마를 처음 쓸 때 합침
const OWN = { name: '햇살빌라 옥상 집들이', floorKind: 'tile', floor: '#8fc29d', floor2: '#86b893', base: '#e9dfd0' };
let memo = null, memoOf = null;

export function installVillaroof3(LAYOUTS, THEMES) {
  registerFurniture(VR3_BUILDERS, VR3_INFO);
  Object.defineProperty(THEMES, 'villaroof3', { configurable: true, enumerable: true, get() {
    const b = THEMES.villaroof2 || THEMES.villaroof || THEMES.my;
    if (memoOf !== b) { memoOf = b; memo = { ...b, ...OWN }; }
    return memo;
  } });
  LAYOUTS.villaroof3 = { w: 7, d: 6, slab: 'none', wallH: .6, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (카메라: 옆(E) 면을 조금 더 정면으로 — 계단실 단면과 거대 물탱크가 첫 화면에; 지금 20판처럼 bleed 맞춤이되 옥상 양 끝이 덜 잘리게 조금 넓게)
    yaw: .95, fitW: 6.2, homeShift: [.46, -.65],
    // (bleed 바닥 앞치마는 폭 0: 기본 앞치마(반투명 판, y 0)가 옥상 아래 빌라 몸통 위에 덮여 하얗게 바랜 '그리다 만 벽돌'로 보였다)
    bleed: { fade: .01 },
    // 옛 20판의 주황 나무 데크 (평상 자리)
    raised: [{ i: 0, j: 0, w: 3, d: 3, h: .2, kind: 'planks', a: '#d9a466', b: '#c99456', edge: '#a8733f', trim: '#e9c28e', step: 'full' }],
    furniture: [
      { type: 'vr3_villa', x: 0, z: 0, a: 0 }, { type: 'vr3_town', x: 0, z: 0, a: 0 },
      F('lightline', 0, 0, 0, { party: true }), { ...F('pyeongsang', 0, 1), dz: -.4 }, F('snacktable', 2, 1, 0, { party: true }), F('balloons', 2, 0), F('potrow', 0, 2),
      F('jangdok', 3, 0), F('vr3_stairhut', 5, 0),
      F('garden', 4, 4), F('garden', 5, 3), F('rooftap', 6, 4),
      F('roofline', 1, 4),
    ],
    decor: [],
    friendAt: [.6, .2] };
}
