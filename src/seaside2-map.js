// 30판 냥냥이네 바닷가 가게 2 — seaside2 (⑧ 10/23, 사용자 "예쁘지만 군데군데 디테일이 너무 떨어짐" → 같은 맵 유지, 디테일 업).
// 옛 30판(stages.js LAYOUTS.seaside)의 바닥·단·자리를 그대로 두고 조각만 디테일을 올린 판(gfx/seaside2-props.js). 옛 키 seaside는 그대로.
//   · 가게·좌판·나무 통·파라솔·칠판·시계 기둥은 옛 type 그대로 두고 opts.gptHero로 새 빌더만 바꿔 낌 → 자물쇠(나무 통 pad)·숨김
//     자리 순서·hunt-blind 표가 그대로 맞음
//   · 데크는 새 type seadeck2 — 30판 ★(깃발 신호)에서 devices.js SWAP.seaside2가 flagdeck2로 바꿈(장치 'flagboat' 그대로)
//   · 맨 끝에 모래성(sandcastle2, 앞 모래밭 1칸)과 바닥 풍경(sea2scene, 칸·걸음 차지 없음)을 더함 — 앞 가구 순서는 안 바뀜
//   · 대본(seasideInc)·친구(냥냥이)·물건 풀·빛 레시피는 roomalias.js seaside2 → seaside로 따라옴; 빛만 look.js RECIPES.seaside2
//     (27→28→30 아침→낮→노을: 해 질 녘 따뜻한 오후)
import { registerFurniture } from './gfx/furniture.js';
import { SEASIDE2_BUILDERS, SEASIDE2_INFO } from './gfx/seaside2-props.js';
import { addI18n } from './i18n.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const H = (type, i, j, hero, more) => F(type, i, j, 0, { gptHero: hero, ...more });

addI18n({
  '모래성': 'Sandcastle', '바닷가 풍경': 'Seaside scenery', '생선 상자 위': 'On the fish crate', '통발 안': 'In the crab trap',
  '나무 통 위': 'On the barrels', '모래성 옆': 'By the sandcastle', '냥냥 수산': 'Nyang Fish', '영업중': 'OPEN', '오늘의 메뉴': "Today's menu",
  '생선구이': 'Grilled fish', '아이스커피': 'Iced coffee', '레몬에이드': 'Lemonade', '메뉴': 'Menu',
});

export function installSeaside2(LAYOUTS, THEMES) {
  const old = LAYOUTS.seaside;
  if (!old || !THEMES.seaside) return;
  registerFurniture(SEASIDE2_BUILDERS, SEASIDE2_INFO);
  // (10/24 사용자 "약간 칙칙해짐, 원래 맑고 쨍했는데 … 해변과 모래사장 칙칙하지 않게 에메랄드빛"): 바다는 에메랄드, 모래는 밝은 크림
  THEMES.seaside2 = { ...THEMES.seaside, water: '#4fd8c8', sand: '#f6e6c2' };
  // 부두·가게 단은 회색기 빼고 밝은 크림 돌로, 모래 띠는 밝은 크림
  const zones = (old.floorZones || []).map(z => z.kind === 'sand' ? { ...z, a: '#f6e6c2', b: '#efdcb2' } : z);
  const raised = (old.raised || []).map((r, k) => ({ ...r, a: k ? '#f1eee8' : '#f4f1ec', b: k ? '#e6e2da' : '#e9e5de' }));
  LAYOUTS.seaside2 = {
    ...old, theme: THEMES.seaside2, floorZones: zones, raised,
    furniture: [
      F('seadeck2', 0, 0), H('seashop', 3, 0, 'seashop2'), H('chalksign', 7, 1, 'chalksign2'), F('plantbig', 7, 0), H('ringpost', 3, 2, 'ringpost2'), F('streetlamp', 7, 2),
      H('fishstall', 4, 4, 'fishstall2'), H('barrels', 6, 3, 'barrels2'), H('cafeumbrella', 6, 6, 'cafeumbrella2'), H('cafeumbrella', 7, 5, 'cafeumbrella2', { k: 1 }), H('planter', 4, 6, 'seaplanter2'),
      F('sandcastle2', 1, 6), { type: 'sea2scene', x: 0, z: 0, a: 0 },
    ],
  };
}
