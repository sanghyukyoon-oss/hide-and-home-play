// 18~21판 다시 (① 10/23): 처음부터 새로 지은 맵 키들 — 옛 키는 그대로 두고, 새 맵 스위치(?newmaps=1 · stages.js NEW_MAPS)에 등록만.
// 판 표(PLAN)는 사용자가 고른 뒤 바꿈. 대본·물건 풀·빛은 roomalias.js가 옛 키로 이어 줌.
import { installPolicefront3 } from './policefront3-map.js';
import { installVillaroof3 } from './villaroof3-map.js';
import { installOtakuloft3 } from './otakuloft3-map.js';
import { installOtakuloft4 } from './otakuloft4-map.js';
import { installOtakuloft5 } from './otakuloft5-map.js';
import { installFirestation3 } from './firestation3-map.js';

// 미리보기 ?gptmap=키 가 여는 판 (그 판 빛·HUD) — gpt-import.js GPT_STAGE에 더해짐
// (18판: otakuloft5 오락실 2층집 다시 짓기가 새 맵 스위치 안, 앞 두 안 otakuloft3 게임기 집·otakuloft4 오락실 2층집 B는 미리보기만)
export const REDO1_STAGE = { otakuloft3: 18, otakuloft4: 18, otakuloft5: 18, firestation3: 19, firestation3b: 19, villaroof3: 20, policefront3: 21 };

export function installRedo1({ LAYOUTS, THEMES, NEW_MAPS }) {
  installOtakuloft3(LAYOUTS, THEMES); installOtakuloft4(LAYOUTS, THEMES); installOtakuloft5(LAYOUTS, THEMES);
  installFirestation3(LAYOUTS, THEMES);
  installVillaroof3(LAYOUTS, THEMES);
  installPolicefront3(LAYOUTS, THEMES);
  Object.assign(NEW_MAPS, { 18: 'otakuloft5', 19: 'firestation3b', 20: 'villaroof3', 21: 'policefront3' });
}
