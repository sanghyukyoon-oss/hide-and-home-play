// 22~26판 다시 만들기 (⑦ 10/23 — 사용자 1~70 검토 시트 메모, _handoff/redo-18to33-1023.md): 판마다 새 맵 키를 만들고 옛 맵은 그대로 둬요.
// 판 하나 = redo7/sNN.js 하나(그 판 패치는 그 파일과 새 gfx 파일만 고침). 각 파일의 install()이 맵을 등록하고 SWAP[판 번호]에 [옛 키, 새 키]를 적어요.
// 판 표(PLAN)는 그대로 — 새 키는 정본의 새 맵 스위치(stages.js NEW_MAPS, ?newmaps=1)에만 올라가요(사용자가 월요일에 고름).
// 되돌리기 = 그 판 파일의 SWAP 줄 지우기. 이야기·물건 표·빛은 roomalias.js가 옛 키로 이어 줘요.
import { install as s22 } from './redo7/s22.js';
import { install as s23 } from './redo7/s23.js';
import { install as s24 } from './redo7/s24.js';
import { install as s25 } from './redo7/s25.js';
import { install as s26 } from './redo7/s26.js';

// 새 키의 룩(look.js lookRecipe가 먼저 찾음)과 판 설정 손질(stages.js stageSpec 끝에서 s.room이 이 키일 때: 줌·물건 크기·자물쇠 자리…)
export const REDO_LOOK = {}, REDO_SPEC = {};

export function installRedo7(T) {
  const SWAP = {};
  for (const f of [s22, s23, s24, s25, s26]) f({ ...T, SWAP, LOOK: REDO_LOOK, SPEC: REDO_SPEC });
  for (const [n, [, to]] of Object.entries(SWAP)) if (T.LAYOUTS[to] || T.MAPS[to]) T.NEW_MAPS[n] = to;
}
