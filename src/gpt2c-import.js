// 26판 후보 둘 — 멍뭉이네 마당 2층집 gptdoghouse · 멍뭉이네 골목 계단집 gptdoghouse2 (gpt2-c 작업장, fix-1022 a83e02b; ① 10/22 들여옴).
// 빌더(모델 + 부품 움직임)와 배치만: 작업장의 장치 런타임(gptdoghouse-runtime·hints)·걷기 엔진(gptdoghouse-walk)·물건 자리(gptdoghouse-targets)·
// 미리보기 분기(gptDoghouseSpec)는 뺐다 — 장치·자물쇠 연결은 ② 몫. 두 맵이 빌더를 같이 쓰니 한 번만 등록.
// 색: GPT 원색의 명암 그대로, 색상만 26판 배색 PAL.dog로 모음(사용자 10/22 '채색 다시 신경 써서'), 테마는 벽 크림만 옅은 중성 (gpt2c-doghouse-map.js).
import { registerFurniture } from './gfx/furniture.js';
import { softenBuilders } from './gfx/gpt-paint.js';
import { surfaceBuilders } from './gfx/gpt-surface.js';
import { ITEMS } from './gfx/items.js';
import { GPTDOG_BUILDERS, GPTDOG_INFO } from './gfx/gpt2c-dog-devices.js';
import { GPTWHISTLE_BUILDERS, GPTWHISTLE_INFO, GPTWHISTLE_ITEMS } from './gfx/gpt2c-dog-whistle.js';
import { GPTCHAIN_BUILDERS, GPTCHAIN_INFO } from './gfx/gpt2c-dog-chain.js';
import { GPTPUZZLE_BUILDERS, GPTPUZZLE_INFO } from './gfx/gpt2c-dog-puzzles.js';
import { GPTCADET_BUILDERS, GPTCADET_INFO } from './gfx/gpt2c-dog-cadet.js';
import { GPTSURROUND_BUILDERS, GPTSURROUND_INFO } from './gfx/gpt2c-dog-surround.js';
import { GPTARCH_BUILDERS, GPTARCH_INFO } from './gfx/gpt2c-dog-architecture.js';
import { gpt2cDoghouseMaps } from './gpt2c-doghouse-map.js';

export function installGpt2cDoghouse(MAPS, THEMES, LAYOUTS) {
  void LAYOUTS;
  for (const [B, I] of [[GPTDOG_BUILDERS, GPTDOG_INFO], [GPTWHISTLE_BUILDERS, GPTWHISTLE_INFO], [GPTCHAIN_BUILDERS, GPTCHAIN_INFO],
    [GPTPUZZLE_BUILDERS, GPTPUZZLE_INFO], [GPTCADET_BUILDERS, GPTCADET_INFO], [GPTARCH_BUILDERS, GPTARCH_INFO]]) registerFurniture(surfaceBuilders(B, 'dog'), I);
  // (the town backdrop is shared by the outdoor stages and takes each stage's town colours from its theme — not repainted with 26판's scheme)
  registerFurniture(softenBuilders(GPTSURROUND_BUILDERS, .075), GPTSURROUND_INFO);
  Object.assign(ITEMS, GPTWHISTLE_ITEMS);   // (명예 순경 모자: 호루라기 연쇄의 상 — 판 목록에 넣는 건 ②)
  const { themes, maps } = gpt2cDoghouseMaps(THEMES);
  Object.assign(THEMES, themes); Object.assign(MAPS, maps);
}
