// GPT 작업장 gpt3-k에서 들여온 것 (① 10/22, fix-1022 반영): 19판 몽글 119 안전센터 gptfirestation + 새 소방차·순찰차 2 (vehicles2).
// 빌더와 배치만 — 작업장의 장치 엔진·보행 그래프·맵 등록·미리보기·키트 등록은 뺌. 색: GPT 원색의 명암 그대로, 색상만 19판 배색 PAL.fire로 모음(차는 그대로) — 사용자 10/22 '채색 다시 신경 써서'.
// 판 자리: stages.js PLAN 'gptfirestation|firestation' (대본·물건·장치 표는 roomalias.js가 옛 키 firestation으로 이어 줌).
import { registerFurniture } from './gfx/furniture.js';
import { surfaceBuilders } from './gfx/gpt-surface.js';
import { GPT_FIRE_BUILDERS, GPT_FIRE_INFO, GPT_FIRE_LAYOUT, GPT_FIRE_THEME } from './gfx/gpt3k-fire-props.js';
import { GPT_POLICECAR2_BUILDERS, GPT_POLICECAR2_INFO } from './gfx/gpt3k-policecar2-props.js';

// The island's two clipped front corners are no ground, and the ladder's three lowest treads leave no headroom: walking
// barriers there (the workshop's groundBlocks; the island stands at the room's centre, so local = room metres)
const ISLAND_EDGES = [[-4.43, 0, .15, -3.46, .5, .58], [-4, 0, 3.5, -3, .5, 4], [-5, 0, 2.6, -4.6, .5, 3], [4.45, 0, 2.45, 5, .5, 3], [3.95, 0, 3.6, 5, .5, 4]];
// the island under the station is floor and backdrop: no tiles taken, and its nominal 10×8 slot (w·d .1, as the workshop
// did) doesn't stop a thing being set down anywhere on it (room.js canPlaceAt)
const floorOnly = B => { const b = B.gpt_firebase; B.gpt_firebase = (f, ...a) => { const r = b(f, ...a); f.noOccupied = true; f.walkBoxes = ISLAND_EDGES; return r; }; return B; };
const INFO = { ...GPT_FIRE_INFO, gpt_firebase: { ...GPT_FIRE_INFO.gpt_firebase, w: .1, d: .1 } };
// The garage and the equipment terrace stand 18.5 cm up on the station's threshold slab, and the station body is
// noSolid (its rooms are open): without the workshop's walk graph a walker on the ground would stand sunk in that slab,
// so the slab is a walking barrier (room.js walkBoxes) — the ground walkers keep to the outdoor apron. Local metres.
const STATION_SLABS = [[-3.03, -.04, -2.02, 3.03, .19, 2.02], [1.82, -.02, -1.68, 4.98, .19, -.22]];
const slabBoxes = B => { const b = B.gpt_firehouse; B.gpt_firehouse = (f, ...a) => { const r = b(f, ...a); f.walkBoxes = STATION_SLABS; return r; }; return B; };

export function installGpt3k(MAPS, THEMES, LAYOUTS) {
  // 소방서 조각 9 + 꼬마 소방차 2 · 미니 조립 모형 (상점엔 안 나옴)
  // (차·미니 소방차는 색이 뜻이라 그대로, 나머지만 배색으로)
  const B = { ...GPT_FIRE_BUILDERS }, cars = Object.fromEntries(Object.entries(B).filter(([k]) => /truck|car/.test(k)));
  registerFurniture(slabBoxes(floorOnly({ ...surfaceBuilders(Object.fromEntries(Object.entries(B).filter(([k]) => !cars[k])), 'fire'), ...cars })), Object.fromEntries(Object.entries(INFO).map(([k, v]) => [k, { ...v, hidden: true }])));
  // 순찰차 2 (판에 놓는 건 ②·⑥)
  registerFurniture({ ...GPT_POLICECAR2_BUILDERS }, GPT_POLICECAR2_INFO);
  // (그 판의 친구는 옛 19판 그대로 — 곰돌이; 옛 테마 위에 GPT 테마)
  THEMES.gptfirestation = { ...THEMES.firestation, ...GPT_FIRE_THEME, friend: THEMES.firestation?.friend ?? 'bear' };
  LAYOUTS.gptfirestation = { ...GPT_FIRE_LAYOUT, theme: THEMES.gptfirestation };
}
