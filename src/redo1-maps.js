// 18~21판 다시 (① 10/23): 처음부터 새로 지은 맵 키들 — 옛 키는 그대로 두고, 새 맵 스위치(?newmaps=1 · stages.js NEW_MAPS)에 등록만.
// 판 표(PLAN)는 사용자가 고른 뒤 바꿈. 대본·물건 풀·빛은 roomalias.js가 옛 키로 이어 줌.
import { installPolicefront3 } from './policefront3-map.js';
import { installVillaroof3 } from './villaroof3-map.js';

// 미리보기 ?gptmap=키 가 여는 판 (그 판 빛·HUD) — gpt-import.js GPT_STAGE에 더해짐
export const REDO1_STAGE = { villaroof3: 20, policefront3: 21 };

export function installRedo1({ LAYOUTS, THEMES, NEW_MAPS }) {
  installVillaroof3(LAYOUTS, THEMES);
  installPolicefront3(LAYOUTS, THEMES);
  Object.assign(NEW_MAPS, { 20: 'villaroof3', 21: 'policefront3' });
}
