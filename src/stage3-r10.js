// 3판 개굴이의 낚시터 다시 — ⑩ 안 (10/24, 사용자 "스테이지3 맵 3개 다 다시 — A는 지금 정본 오리지널 베이스로 디테일과 느낌, 전체 레벨 올린 판,
// B는 새 낚시터 … 셋 다 싱그럽고 깨끗한 느낌"). stage3-maps.js(⑫ fishing3·fishing2b·frogpond)와 겹치지 않게 키를 따로 둠 — 고를 후보로만:
//   A' fishing3r — 원래 3판 7×6 배치 그대로, 모델·풀밭·물·빛 레벨업 (미리보기 ?gptmap=fishing3r&lv=3)
//   B' fishisle  — 「개굴이네 낚시 섬」 물 위 작은 섬 (미리보기 ?gptmap=fishisle&lv=3)
// 판 표(PLAN 3 = fishing)·NEW_MAPS는 안 건드림. 조각 종류 이름은 정본 그대로 두고 그림만 바꿔 끼움(opts.gptHero) — 릴 reelcatch(29판도)·자리표·대본은 그대로;
// 대본·물건 풀은 roomalias.js 별칭, 자리표는 affinity.js PLACE로 fishing 것.
import { registerFurniture } from './gfx/furniture.js';
import { FS3_BUILDERS, FS3_INFO } from './gfx/fishing3-props.js';
import { FI_BUILDERS, FI_INFO } from './gfx/fishisle-props.js';

const HP = Math.PI / 2;
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const Hf = (type, i, j, hero, rot = 0) => F(type, i, j, rot, { gptHero: hero });
const at = (type, x, z, a = 0, hero, opts) => ({ type, x, z, a, opts: hero ? { gptHero: hero, ...opts } : opts });

export function installStage3R10({ LAYOUTS, THEMES }) {
  registerFurniture(FS3_BUILDERS, FS3_INFO); registerFurniture(FI_BUILDERS, FI_INFO);
  if (!THEMES.fishing) return;
  // ── A' fishing3r: 원래 3판의 7×6 배치 그대로(연못 가운데, 북쪽 둑의 좌대, 나무·벤치·간판, 도구함·미끼통, 갈대, 파라솔·아이스박스,
  // 캠핑 의자·덤불·피크닉) — 벽(산울타리·울타리)은 같은 자리의 새 조각으로, 풀밭 소품·나비·잠자리 더함
  THEMES.fishing3r = { ...THEMES.fishing, floorKind: 'grass', floor: '#a6dd80', floor2: '#9dd779' };
  LAYOUTS.fishing3r = { w: 7, d: 6, theme: THEMES.fishing3r, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    furniture: [
      { type: 'fs3_meadow', x: 0, z: 0 }, { type: 'fs3_hedge', x: .1, z: -3.27, opts: { len: 7.2 } }, { type: 'fs3_fence', x: -3.56, z: .1, opts: { len: 6 } },
      Hf('pond', 2, 2, 'fs3_pond'), Hf('fishdock', 2, 1, 'fs3_dock'), Hf('tree', 0, 0, 'fs3_tree'), Hf('bench', 4, 0, 'fs3_bench'), Hf('fishsign', 6, 0, 'fs3_sign'),
      Hf('tacklebox', 1, 1, 'fs3_tackle'), Hf('baitbucket', 4, 1, 'fs3_bait'), Hf('reeds', 5, 3, 'fs3_reeds'), Hf('reeds', 1, 4, 'fs3_reeds'), Hf('parasol', 6, 2, 'fs3_parasol'),
      F('cooler', 6, 4), F('campchair', 0, 2), Hf('bush', 0, 5, 'fs3_bush'), F('picnic', 3, 5), Hf('reeds', 5, 5, 'fs3_reeds')],
    friendAt: [1.6, 1.2] };
  // ── B' fishisle 「개굴이네 낚시 섬」: 물 위 작은 섬(7×6) — 큰 나무+그네(뒤 왼쪽), 개구리 지붕 미끼 가게(뒤 오른쪽), 서쪽 물가의 릴 좌대,
  // 앞 오른쪽 잔교·나룻배·통발, 앞 왼쪽 모래사장, 잔교 어귀 간판; 수국 덤불·파라솔·도구함·미끼통·갈대는 A' 빌더 같이 씀
  THEMES.fishisle = { ...THEMES.fishing, floorKind: 'grass', floor: '#a9e083', floor2: '#a1db7c', base: '#fbefcf' };
  LAYOUTS.fishisle = { w: 7, d: 6, theme: THEMES.fishisle, fitW: 9.8, homeShift: [.25, -.1], exact: true, noEntry: true, slab: 'none', bleed: null, hideFloor: true, wallH: 0,
    walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, decor: [],
    furniture: [
      at('fi_land', 0, 0), at('tree', -2.2, -1.85, 0, 'fi_tree'), at('fi_shop', 1.95, -1.95), at('fishsign', .85, 2.1, .75, 'fs3_sign'),
      at('fishdock', -3.05, .95, -HP, 'fs3_dock'), at('tacklebox', -2.0, .25, .3, 'fs3_tackle'), at('baitbucket', -1.95, 1.6, 0, 'fs3_bait'),
      at('bush', -3.0, -.35, HP, 'fs3_bush'), at('bush', 3.05, .35, -HP, 'fs3_bush'), at('reeds', 3.05, 1.85, 0, 'fs3_reeds'), at('reeds', -.35, 2.65, 0, 'fs3_reeds'),
      at('parasol', .55, .45, -.4, 'fs3_parasol'), at('cooler', 1.3, .95, .25), at('campchair', -.35, -1.25, .5),
      at('fi_pier', 2.15, 2.55),
    ],
    friendAt: [-.4, .9] };
}
