// 3판 세 안 (10/24 — 사용자 "스테이지3 맵 3개 다 다시 해 줘 … 셋 다 싱그럽고 깨끗한 느낌. 정말로 중요한 맵"):
//   A fishing3  — 정본 3판(fishing) 구도·배치 그대로, 모델·텍스처·빛 레벨업
//   B fishing2b — 새 낚시터: 물 위 둥근 섬 디오라마(잔교·나룻배·작은 미끼 가게)
//   C frogpond  — 여우비 오는 날 개굴이네 연잎 연못 집 (대본 frogpondH는 script.js에 이미 있음)
// 판 표(stages.js PLAN 3 = fishing)는 그대로 — 미리보기 ?gptmap=fishing3&lv=3 (…fishing2b, frogpond). 숨김 자리·부품 이름·장치(릴 reelcatch)·
// 찾을 물건 수(6)는 3판과 같게: 조각 종류 이름은 정본 그대로 두고 그림만 바꿔 끼움(opts.gptHero). 대본·물건 풀은 별칭(roomalias.js)으로 fishing 것.
import { registerFurniture } from './gfx/furniture.js';
import { S3A_BUILDERS, S3A_INFO } from './gfx/s3a-props.js';
import { S3B_BUILDERS, S3B_INFO } from './gfx/s3b-props.js';
import { S3C_BUILDERS, S3C_INFO, stretchC } from './gfx/s3c-props.js';
import { REDO_LOOK } from './redo7.js';   // (look.js lookRecipe가 맨 먼저 찾는 표 — look.js는 안 건드림)
import { EN } from './i18n-en-dict.js';

export const S3_STAGE = { fishing3: 3, fishing2b: 3, frogpond: 3 };
const HP = Math.PI / 2;
const H = (type, i, j, rot, hero, o) => ({ type, i, j, rot: rot || 0, opts: { gptHero: hero, ...o } });
const AT = (type, x, z, a = 0, opts) => ({ type, x, z, a, ...(opts ? { opts } : {}) });
const HA = (type, x, z, a, hero, o) => AT(type, x, z, a, { gptHero: hero, ...o });
// 섬 판: 벽·받침 없음, 섬 조각이 바닥(네모 바닥판 숨김), 카메라는 섬 전체(잔교 끝까지)
const islandMap = (w, d, theme, furniture, extra = {}) => ({ w, d, theme, fitW: 9.0, exact: true, noEntry: true, slab: 'none', bleed: null, hideFloor: true, wallH: 0,
  walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, decor: [], furniture, ...extra });

// 빛·하늘 (look 레시피): 맑은 낮빛(흰 해, 그림자 연하게), 하늘색 → 연민트 하늘
// A: 판 풀밭이 같은 무늬(meadow)로 둘레까지 이어져 하늘빛으로 스며듦 — 네모 테두리 없음
// A: 빛·배경은 정본 3판 그대로(레시피 없음 — 연두·흰 빛무리, 또렷한 판 가장자리; 10/24 사용자 "원래 3판이 더 싱그러워 보인다")
// B: 호수 섬 — 섬 조각이 제 물·물가를 가짐(받침·바닥 그림자 없음), 섬 전체가 한 화면이라 찾을 물건을 조금 크게
REDO_LOOK.fishing2b = { light: { ambColor: '#f2f7f8', amb: 1.38, sunColor: '#fffbf2', sun: 2.6, shadow: .5 }, sky: ['#9fd3f0', '#e6f5f6', '#d4eef3'], shadow: false, itemSize: .4 };
// C: 여우비 — 해 뜬 채 밝은 하늘(어둡지 않게), 하늘 무늬에 가는 빗줄기(rain), 빛은 조금 더 하얗고 부드럽게
REDO_LOOK.frogpond = { light: { ambColor: '#f2f6f8', amb: 1.42, sunColor: '#fffaf2', sun: 2.4, shadow: .44 }, sky: ['#9fd2f0', '#eaf6f6', '#d6ecf0'], rain: true, shadow: false, itemSize: .4 };

export function installStage3(LAYOUTS, THEMES) {
  registerFurniture(S3A_BUILDERS, S3A_INFO);
  // ── A: 정본 3판 그대로의 자리 — 풀밭은 새 무늬(meadow)로 판 밖까지 한 장, 생울타리·울타리는 새 조각(벽 대신)
  // (B·C의 풀빛은 처음 정한 그대로 — S3T; A는 정본 3판 잔디색 그대로에 무늬만 meadow)
  const S3T = { ...THEMES.fishing, floorKind: 'meadow', grass: '#8bce6f', floor: '#8bce6f', floor2: '#7fc466', base: '#8bce6f' };
  THEMES.fishing3 = { ...THEMES.fishing, floorKind: 'meadow' };
  // (낚시 상자는 10/23 밤 ⑥이 다시 만든 정본 도구함 그대로 — 속이 비어 물건이 안에 들어감; 10/24 사용자 "저 낚시상자는 안에 약간 들어가 있어야지, 어디 만든 거 맘에 들었는데")
  const V = { vivid: true };   // (A: 정본 3판 소품 색 — 빨간 파라솔·파란 아이스박스·주황 미끼통·빨간 체크)
  LAYOUTS.fishing3 = { ...LAYOUTS.fishing, theme: THEMES.fishing3, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    furniture: [H('pond', 2, 2, 0, 's3a_pond'), H('fishdock', 2, 1, 0, 's3a_fishdock'), H('tree', 0, 0, 0, 's3a_tree', V), H('bench', 4, 0, 0, 's3a_bench', V), H('fishsign', 6, 0, 0, 's3a_fishsign'),
      H('tacklebox', 1, 1, 0, null), H('baitbucket', 4, 1, 0, 's3a_baitbucket', V), H('reeds', 5, 3, 0, 's3a_reeds', { seed: 1, ...V }), H('reeds', 1, 4, 0, 's3a_reeds', { seed: 2, ...V }),
      H('parasol', 6, 2, 0, 's3a_parasol', V), H('cooler', 6, 4, 0, 's3a_cooler', V), H('campchair', 0, 2, 0, 's3a_campchair', V), H('bush', 0, 5, 0, 's3a_bush', V), H('picnic', 3, 5, 0, 's3a_picnic', V),
      H('reeds', 5, 5, 0, 's3a_reeds', { seed: 3, ...V }),
      AT('s3a_hedge', 0, -3, 0, { len: 7 }), AT('s3a_fence', -3.5, 0, 0, { len: 6 }), AT('s3a_around', 0, 0), AT('s3a_rain', 0, 0)] };

  // ── B: 새 낚시터 — 맑은 호수 위 둥근 섬. 뒤(위)에 큰 나무와 미끼 가게, 오른쪽으로 물 위 잔교와 나룻배, 앞 물가에 연잎.
  // 조각은 3판과 같은 열다섯(연못→물가 연잎, 좌대→잔교, 간판→미끼 가게 옆 물고기 간판), 나머지는 A 모델 그대로
  registerFurniture(S3B_BUILDERS, S3B_INFO);
  THEMES.fishing2b = { ...S3T, name: THEMES.fishing.name };
  LAYOUTS.fishing2b = islandMap(7, 6, THEMES.fishing2b, [
    AT('s3b_island', 0, 0), AT('s3b_lakelife', 0, 0),
    HA('tree', -2.0, -1.5, 0, 's3b_tree'), HA('bench', -.55, -2.25, 0, 's3a_bench'), HA('fishsign', 1.4, -2.0, 0, 's3b_shop'),
    HA('baitbucket', .25, -1.45, 0, 's3a_baitbucket'), HA('tacklebox', 2.55, -1.3, -.3, 's3a_tacklebox'),
    HA('fishdock', 3.75, .3, 0, 's3b_jetty'), AT('s3b_boat', 4.95, 1.45, .32), HA('campchair', 2.6, -.85, 1.1, 's3a_campchair'),
    HA('picnic', -1.2, .2, .2, 's3a_picnic'), HA('parasol', .55, 1.55, -.3, 's3a_parasol'), HA('cooler', 1.55, 1.3, -.4, 's3a_cooler'),
    HA('bush', -2.95, 1.45, .5, 's3a_bush'), HA('pond', -.45, 4.6, -.15, 's3b_cove'),
    HA('reeds', -3.5, -1.15, 0, 's3a_reeds', { seed: 1 }), HA('reeds', 1.25, 3.0, 0, 's3a_reeds', { seed: 2 }), HA('reeds', 3.3, 2.05, 0, 's3a_reeds', { seed: 3 }),
  ], { friendAt: [1.9, .35] });

  // ── C: 여우비 오는 날 개굴이네 연잎 연못 집 — 연못 가운데 둥근 섬. 뒤 왼쪽에 기둥 위 연잎 지붕 집(판의 얼굴), 뒤 오른쪽에 나무,
  // 오른쪽 물가에 물레방아, 앞 물가에서 큰 연잎 징검다리. 대본은 script.js frogpondH(정확한 키), 물건 풀·숨김 표는 별칭으로 낚시터 것
  registerFurniture(S3C_BUILDERS, S3C_INFO);
  // (C에만 새로 생긴 이름의 영어 — 숨김 자리·부품 이름이 집·물레방아·연잎 우산에 맞게 바뀐 것)
  Object.assign(EN, { '개굴이네 연잎 연못 집': "Froggy's Lily Pond House", '물레방아 양동이': 'Waterwheel bucket', '물속 양동이': 'Bucket in the water',
    '물가 의자 위': 'On the pond-side stool', '물가 마루 밑': 'Under the pond deck', '현관 벤치 위': 'On the porch bench', '집 밑': 'Under the house',
    '우산 의자 위': 'On the umbrella chair', '우산 의자 밑': 'Under the umbrella chair',
    '개굴이 집': "Froggy's house", '물레방아': 'Waterwheel', '연잎 징검다리': 'Lily-pad steps', '노란 우산 의자': 'Yellow umbrella chair', '개굴이 간판': "Froggy's sign",
    '노란 우산': 'Yellow umbrella', '개굴이 집 문': "Froggy's front door", '우편함': 'Mailbox' });
  THEMES.frogpond = { ...S3T, name: '개굴이네 연잎 연못 집' };
  // (다듬기 10/24: 섬과 자리를 화면 위아래로 펼침 — stretchC, s3c-props.js; 물에 걸치는 물레방아·연잎 징검다리는 펼친 물가에 맞춘 자리 그대로)
  const HC = (type, x, z, a, hero, o) => { const [X, Z] = stretchC([x, z]); return HA(type, X, Z, a, hero, o); };
  const DC = { detail: true };   // (10/24 사용자 "전체적으로 오브젝트 디테일이 부족": A의 잔디테일(새집 기와·버섯·무당벌레·컵·케이크…)을 C 색 그대로)
  LAYOUTS.frogpond = islandMap(9, 8, THEMES.frogpond, [
    AT('s3c_island', 0, 0), AT('s3c_weather', 0, 0),
    HC('bench', -1.65, -1.5, 0, 's3c_house'), HC('tree', 1.75, -2.0, 0, 's3a_tree', DC), HC('fishsign', .35, -1.75, -.2, 's3c_sign'),
    HA('fishdock', 4.45, .95, 0, 's3c_wheel'), HC('baitbucket', 2.3, -.85, 0, 's3a_baitbucket', DC), HC('tacklebox', -.15, -.65, .3, 's3a_tacklebox', DC),
    HA('pond', 4.75, 5.55, .71, 's3c_lilysteps'), HC('parasol', .95, 1.25, -.4, 's3c_umbrella'),
    HC('picnic', -1.45, .75, .25, 's3a_picnic', DC), HC('cooler', 1.85, .9, -.5, 's3a_cooler', DC), HC('campchair', -2.75, .6, .9, 's3a_campchair', DC),
    HC('bush', -2.85, -.5, .4, 's3a_bush', DC),
    HC('reeds', -3.25, 1.85, 0, 's3a_reeds', { seed: 1, ...DC }), HC('reeds', 1.55, 2.8, 0, 's3a_reeds', { seed: 2, ...DC }), HC('reeds', 3.0, -1.55, 0, 's3a_reeds', { seed: 3, ...DC }),
  ], { friendAt: stretchC([-.55, -.3]), fitW: 8.2 });
}
