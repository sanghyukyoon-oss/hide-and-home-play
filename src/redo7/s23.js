// 23판 삐딱이네 반지하 집 앞마당 jangdokyard (⑦ 10/23 — 사용자 "도로에 장독대 있는 느낌 → 바닥 정리, 장독대 디테일하게 다시 모델링",
// 허브 "골목 끝 반지하 집 앞마당: 반지하로 내려가는 계단, 화분 줄, 새 장독대"): 옛 alley1은 아스팔트 한가운데 장독·평상이 놓였었다.
// 이제 방 = 시멘트 앞마당 + 대문 밖 보도 한 줄, 차도는 연석 한 단 아래 섬 양 끝까지 흐른다(gfx/redo7-s23-props.js).
// 판 부품은 옛 이름 그대로: vending · bike(짐칸 — 23판 비밀번호 자물쇠가 붙는 자리, 알람시계는 obslock이 놓음) · pole · trashbags ·
// aircon · daeya · pyeongsang · garden(⑥이 다듬는 스티로폼 텃밭 그대로). 삐딱이 '의자 두 개'(staging twoChairs)는 jd_stool 둘.
// 대본·물건 표·빛은 roomalias.js가 옛 키 alley1로 이어 준다. 판 표는 그대로 — 새 맵 스위치(?newmaps=1, stages.js NEW_MAPS)에서만 이 맵.
import { registerFurniture } from '../gfx/furniture.js';
import { addI18n } from '../i18n.js';
import { JD_BUILDERS, JD_INFO } from '../gfx/redo7-s23-props.js';

const PI = Math.PI, HP = PI / 2;
const at = (type, x, z, a = 0, o = {}) => ({ type, x, z, a, ...o });

export const JD_LAYOUT = {
  w: 6, d: 5, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 8.2,
  // (W벽은 jd_wall이 마당 길이만큼만 세움 — 보도 왼쪽 끝을 막지 않게)
  walls: { N: 'alleywall', W: 'none', S: 'none', E: 'none' },
  // 반지하 계단 우물 자리: 방 바닥을 뚫음 (x 1~3, z -2.5~-1.5; 우물은 x 1.05~2.75, z -2.3~-1.5)
  cut: [{ i: 4, j: 0, w: 2, d: 1 }],
  furniture: [
    at('jd_base', 0, 0), at('jd_house', 0, 0), at('jd_wall', 0, 0),
    // 마당 뒤: 장독대(왼쪽 구석) · 실외기 · 반지하 집
    at('jd_jangdok', -2.0, -1.85), at('aircon', -.55, -2.06),
    // 마당: 왼벽 텃밭 · 평상 · 의자 둘 · 빨간 대야 (오른쪽은 낮게 — 반지하 계단이 보이게)
    at('garden', -2.5, -.05, HP), at('pyeongsang', -.95, -.45),
    at('jd_stool', .3, -.78, 0, { opts: { c: '#e8473d' } }), at('jd_stool', .44, -.16, .4, { opts: { c: '#4f8fe8' } }),
    at('daeya', 2.22, .78),
    // 대문 밖 보도: 담 아래 화분 줄 · 자판기 · 전봇대와 쓰레기 봉투 · 담에 세운 자전거
    at('jd_pots', -2.62, 1.74), at('vending', -1.55, 1.95), at('pole', -.62, 2.05), at('trashbags', .22, 2.02), at('bike', 2.62, 2.0),
  ],
  decor: [], friendAt: [1.45, .25], homeShift: [.45, .08],
};

addI18n({
  '장독대 마당 둥근 섬': 'Jar terrace yard', '삐딱이네 집': "Grumpy's house", '담과 대문': 'Wall and gate',
  '화분 줄': 'Row of pots', '플라스틱 의자': 'Plastic stool',
  '빗물받이 옆': 'By the drain', '꽃 상자 사이': 'Between the flower boxes', '현관 매트': 'Doormat', '현관 매트 밑': 'Under the doormat',
  '반지하 계단 아래': 'At the foot of the basement stairs', '반지하 창 앞': 'By the basement window',
  '우유 주머니': 'Milk bag', '우유 주머니 안': 'In the milk bag', '담 밑': 'At the foot of the wall',
  '소쿠리 덮은 항아리': 'Jar under a basket', '소쿠리 덮은 항아리 안': 'In the basket-covered jar', '면보 덮은 항아리': 'Cloth-covered jar', '면보 덮은 항아리 안': 'In the cloth-covered jar',
  '꿀단지': 'Honey pot', '꿀단지 뚜껑': 'Honey pot lid', '꿀단지 안': 'In the honey pot', '항아리 뚜껑': 'Jar lid', '큰 항아리 뚜껑': 'Big jar lid', '작은 항아리 뚜껑': 'Small jar lid',
  '큰 항아리 안': 'In the big jar', '항아리 안': 'In the jar', '작은 항아리 안': 'In the small jar', '대야 화분 옆': 'Beside the tub planter',
  '화분 사이': 'Between the pots', '화분 뒤': 'Behind the pots',
  '의자 위': 'On the stool', '의자 밑': 'Under the stool',
});

export function install(ctx) {
  const { LAYOUTS, THEMES, SWAP, LOOK, SPEC } = ctx;
  registerFurniture(JD_BUILDERS, JD_INFO);
  const old = THEMES.alley1 || {};
  // (옛 23판 테마 위에: 바닥은 섬이 그림 — 방 바닥판은 마당 시멘트색 한 가지)
  THEMES.jangdokyard = { ...old, name: old.name || '삐딱이네 골목길', friend: old.friend ?? 'grumpy', outdoor: true,
    floorKind: 'carpet', floor: '#ddd6ca', floor2: '#ddd6ca', base: '#c9c0b2' };
  LAYOUTS.jangdokyard = { ...JD_LAYOUT, theme: THEMES.jangdokyard };
  // 맑은 낮빛 (허브 빛 규칙 10/23, 사용자 "누렇다, 이전엔 쨍하니 이뻤다"): 흰 해, 하늘색 하늘 — 해 자리는 그대로(긴 그림자 없음)
  LOOK.jangdokyard = { light: { ambColor: '#f4f6fb', amb: 1.32, sunColor: '#fff4e6', sun: 2.5, shadow: .56 }, sky: ['#9fd3f2', '#d9eefa', '#bfe2f6'], itemSize: .5 };
  // 시작 줌: 마당과 집이 폭을 채움 (차도·보도 왼쪽 끝과 건너편 보도는 화면 밖으로 이어짐) — 찾을 것 39px 이상 (헤드리스 xlog-size, #94)
  SPEC.jangdokyard = s => { s.zoom = 1.35; };
  SWAP[23] = ['alley1', 'jangdokyard'];
}
