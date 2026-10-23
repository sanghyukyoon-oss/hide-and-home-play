// 24판 보드킹의 스케이트 파크 새 컨셉 skatebowl (⑦ 10/23 — 사용자 "더 스케이트보드 파크답게(보울 등) 새 컨셉, 장치 더, 디테일";
// 허브 추가: 컨테이너 매점·그래피티 벽, 흑백판에서 색이 돌아올 때 그래피티가 칠해짐, 장치는 전부 터치하면 저절로): 옛 키 skatepark는 그대로,
// 새 키는 새 맵 스위치(NEW_MAPS, ?newmaps=1)에만. 모델은 gfx/redo7-s24-props.js.
// 흑백판의 색 돌아오는 가구는 안 열리는 셋(그래피티 벽·펀박스·벤치)만 남김 — 그래피티 벽이 늘 그중 하나(stage.js setupGray는 안 열리는 것부터 고름).
// 연쇄(② 레벨 24판 표와 같은 짜임, 이 맵일 때만): 호스(도구) → 보울 옆 음수대 물 레버 → 물줄기가 보울로, 물웅덩이 → 배수구 뚜껑이 둥실
// 떠올라 젖혀짐 → 배수구 쇠살 위의 찾을 물건(색 조각) 하나. 보조: 점수판 뒤집기(뒷면 점수) · 캡슐 뽑기 · 보드 진열대 · 램프 보드 · 매점 창구.
// 대본·물건 풀·이야기(보드킹 boardStop)는 roomalias.js가 skatepark로 이어 줌.
import { registerFurniture } from '../gfx/furniture.js';
import { SKB_BUILDERS, SKB_INFO, FOUNTAIN_AT } from '../gfx/redo7-s24-props.js';
import { addI18n } from '../i18n.js';
import { EN } from '../i18n-en-dict.js';
import { CHAINS, CHAINS_ON } from '../gpt-chains.js';
import { ITEMS } from '../gfx/items.js';

const PI = Math.PI, HP = PI / 2;
const at = (type, x, z, a = 0, o = {}) => ({ type, x, z, a, ...o });

addI18n({
  '스케이트 파크 바닥': 'Skate park ground', '콘크리트 보울': 'Concrete bowl', '미니 하프파이프': 'Mini half-pipe', '컨테이너 매점': 'Container snack bar',
  '3단 계단과 핸드레일': 'Three stairs and handrail', '음수대': 'Drinking fountain', '점수판': 'Scoreboard', '그래피티 벽': 'Graffiti wall', '펀박스': 'Fun box',
  '파크 벤치': 'Park bench', '캡슐 뽑기': 'Capsule toy machine', '보드 진열대': 'Board display',
  '배수구 뚜껑': 'Drain cover', '배수구 안': 'In the drain', '보울 바닥': 'Bowl floor', '보울 데크 위': 'On the bowl deck', '보울 옆': 'Beside the bowl',
  '계단 맨 위': 'Top of the stairs', '계단 아래 칸': 'On the bottom step', '계단 옆': 'Beside the stairs',
  '펀박스 위': 'On the fun box', '플랫 레일 밑': 'Under the flat rail', '펀박스 뒤': 'Behind the fun box',
  '램프 보드': 'Ramp skateboard', '보드 밑': 'Under the board', '램프 밑 천막': 'Ramp storage flap', '램프 밑 창고': 'Under-ramp storage', '램프 가운데': 'Middle of the ramp',
  '왼쪽 덱 위': 'On the ramp deck', '램프 끝 옆': 'Beside the ramp end',
  '물 레버': 'Water lever', '음수대 위': 'On the fountain', '음수대 옆': 'Beside the fountain',
  '점수판 뒷면': 'Back of the scoreboard', '점수판 밑': 'Under the scoreboard',
  '캡슐 손잡이': 'Capsule crank', '캡슐 나오는 곳': 'Capsule chute', '뽑기 기계 위': 'On the capsule machine', '뽑기 기계 옆': 'Beside the capsule machine',
  '진열대 뒤': 'Behind the board display', '진열대 받침 위': 'On the display base',
  '벤치 밑': 'Under the bench', '벤치 끝': 'End of the bench', '벤치 옆': 'Beside the bench',
  '그래피티 벽 위': 'On the graffiti wall', '그래피티 벽 끝': 'End of the graffiti wall', '스프레이 통 옆': 'By the spray cans',
  '매점 창구': 'Snack bar hatch', '매점 계산대 위': 'On the snack counter', '매점 선반': 'Snack bar shelf', '보드 보관함 문': 'Board locker door', '보관함 안': 'In the board locker',
  '보관함 선반': 'Locker shelf', '매점 지붕 위': 'On the snack bar roof', '의자 밑': 'Under the stools', '매점 옆': 'Beside the snack bar',
  '입간판 밑': 'By the park sign', '배수구 옆': 'By the drain grate',
});

export const SKATEBOWL = {
  w: 8, d: 6, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 9.6,
  walls: { N: 'none', W: 'fence', S: 'none', E: 'none' },
  furniture: [
    at('skb_base', 0, 0),
    at('skb_bowl', -2.25, -1.75), at('skb_stairs', -2.45, -.15),
    at('skb_graffiti', .45, -2.85), at('skb_kiosk', 2.85, -2.35),
    at('skb_miniramp', 3.2, .45, HP), at('skb_gacha', 3.72, -1.52),
    at('skb_funbox', .55, .5),
    at('skb_fountain', FOUNTAIN_AT[0], FOUNTAIN_AT[1]),
    at('skb_spinrack', -3.5, .15), at('skb_bench', -3.62, 1.6, HP),
    at('boardrack', -3.62, 2.95, HP, { opts: { gptHero: 'gpt_hero_boardstation' } }),
    at('skb_scoreboard', -.6, 2.85),
  ],
  decor: [], friendAt: [1.05, 1.75],
};

const K = (ko, en) => { if (EN[ko] == null) EN[ko] = en; return ko; };
// ② 레벨의 24판 연쇄 표(gpt-chains-a.js CHAINS_A.skatebowl, ② 10/23)와 같은 짜임 — ② 줄이 정본에 들어오면 그쪽을 쓰고(아래 install은
// 비어 있을 때만 채움), 아직이면 이 줄: 음수대에 호스가 빠져 있어요 → 호스를 찾아 끼우고 물 레버 → 물줄기가 보울로 → 배수구 뚜껑이
// 둥실 → 배수구 안에 색 조각(찾을 물건 하나). 도구는 ②의 호스(items.js skbhose)가 있으면 그것, 없으면 레버 손잡이.
export const SKB_CHAIN = () => ({
  steps: [{ dev: 'skb_fountain#0:0', tool: ITEMS.skbhose ? 'skbhose' : 'chainlever', dur: 2.6, payoff: 'skb_bowl#0:0', links: [{ dev: 'skb_bowl#0:0', at: .72 }],
    sfx: [[.03, 'latch'], [.18, 'whoosh'], [.42, 'blub'], [.62, 'blub'], [.8, 'lift_metal'], [.96, 'pop']],
    need: ITEMS.skbhose ? K('음수대에 호스가 빠져 있어! 파크 어딘가에 있을 텐데', 'The drinking fountain has no hose! It must be somewhere in the park') : K('음수대 물 레버에 손잡이가 빠져 있어! 손잡이가 어디 있을까?', 'The fountain lever has no handle! Where could it be?'),
    found: ITEMS.skbhose ? K('호스다! 음수대에 끼워 보자', 'A hose! Fit it on the drinking fountain') : K('레버 손잡이다! 보울 옆 음수대에 끼워 보자', 'A lever handle! Fit it on the fountain by the bowl'),
    line: K('촤아—! 물줄기가 보울로 콸콸… 배수구 뚜껑이 둥실 떴어!', 'Whoosh! Water gushes into the bowl… the drain cover floats up!') }],
  aux: [{ dev: 'skb_scoreboard#0:0', sfx: [[.5, 'flip']], line: K('점수판 뒷면: 7 · 2 · 5', 'Back of the scoreboard: 7 · 2 · 5') },
    { dev: 'skb_gacha#0:0', dur: 1.3, sfx: [[.05, 'ratchet'], [.55, 'click'], [.85, 'pop']], line: K('캡슐에서 나온 건… 보드 스티커!', 'Out of the capsule… a board sticker!') },
    { dev: 'skb_spinrack#0:0', sfx: [[.05, 'gearUp'], [.85, 'click']] },
    { dev: 'skb_miniramp#0:0', dur: 1.2, sfx: [[.05, 'rustle'], [.45, 'swish'], [.9, 'thunk']], line: K('보드가 혼자 데구르르… 램프를 타고 내려왔어', 'The board rolls down the ramp all by itself') },
    { dev: 'skb_kiosk#0:0', sfx: [[.05, 'creak'], [.7, 'lift_metal']], line: K('매점 문 열었어요~ 오늘은 핫도그!', 'Snack bar is open~ hot dogs today!') }],
});

export function install(ctx) {
  const { LAYOUTS, THEMES, SWAP, LOOK } = ctx;
  if (!THEMES.skatepark) return;
  registerFurniture(SKB_BUILDERS, SKB_INFO);
  THEMES.skatebowl = { ...THEMES.skatepark, outdoor: true, floorKind: 'carpet', floor: '#d8d4dc', floor2: '#d8d4dc', base: '#c4bfca', fence: '#b9c2d8' };
  LAYOUTS.skatebowl = { ...SKATEBOWL, theme: THEMES.skatebowl };
  // 맑은 낮빛(허브 빛 규칙 10/23 — 흰 해·하늘색 하늘, 누런 빛 X), 해는 원래 자리(긴 그림자 X); 물건은 시작 화면 28 px 넘게 .56
  LOOK.skatebowl = { light: { ambColor: '#f4f6fb', amb: 1.32, sunColor: '#fff4e6', sun: 2.5, shadow: .56 }, sky: ['#9fd3f2', '#d9eefa', '#bfe2f6'], itemSize: .56 };
  // 연쇄: 24판이 이 맵으로 열릴 때만 (gpt-chains recipeFor는 판의 방이 이 키일 때만 줄을 씀)
  if (!CHAINS.skatebowl) CHAINS.skatebowl = SKB_CHAIN();
  CHAINS_ON[24] ??= 'skatebowl';
  SWAP[24] = ['skatepark', 'skatebowl'];
}
