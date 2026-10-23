// 40판 「지하상가」 undermall (4장 보스 「마감 시간의 금고」, 10/23 상가 장 새 맵 ⑨ — _lab/BRIEF-shop3-1023.md): 판 표(stages.js PLAN
// 'shopmap:boss')는 그대로, 미리보기 ?gptmap=undermall. 대본(shop-boss)·물건 풀·빛은 별칭 undermall → shopmap(roomalias.js)으로 따라옴.
// 자물쇠 셋은 stageSpec이 맵 가구에 건다(stages.js 'undermall' 한 줄): 열쇠 → 물품 보관함, 색 → 관리실 열쇠 걸이함, 비밀번호 → 관리실 금고
// (마지막 목표 — 안에 다 같이 먹을 간식). 보조 장치 셋(셔터 레버 · 에스컬레이터 · 회전문)과 지도판 뒤집기는 UM_CHAIN(gpt-chains.js가 붙임).
// 배치(맵 원점, 8 × 6): 뒤 벽(북)에 옷 가게 · 분식집(앞에 분식 매대) · 문 닫은 열쇠 가게, 그 오른쪽 끝이 관리실(금고). 왼쪽 벽(서)에
// 에스컬레이터(뒤 구석에서 지상으로) · 꽃집 · 물품 보관함 · 회전문(지하철). 가운데 통로는 비우고, 앞 오른쪽에 안내 지도판, 앞에 벤치.
import { registerFurniture } from './gfx/furniture.js';
import { UM_BUILDERS, UM_INFO } from './gfx/undermall-props.js';
import { EN } from './i18n-en-dict.js';

const K = (ko, en) => { if (EN[ko] == null) EN[ko] = en; return ko; };
const PI = Math.PI;

export function installUndermall(MAPS, THEMES) {
  registerFurniture(UM_BUILDERS, UM_INFO);
  // (큰 면은 순하게: 회백·연민트 바둑판 타일 바닥, 회백 벽 — 10/24 허브 '누렇지 않게', 기준 30판 낮빛; 빛과 하늘은 상가 거리 shopmap의 것 — look.js lookRecipe가 별칭으로)
  // (② 10/23: 등록 때는 편의점 테마가 아직 없어 친구 없는 THEMES.my로 굳었음 — 편의점 테마가 생긴 뒤 첫 값으로 박아 두고, 대입도 받음)
  const OWN = { name: K('지하상가', 'Underground Mall'), floorKind: 'checker', floor: '#f1f4f2', floor2: '#d9ebe6',
    wallKind: 'plain', wall: '#f2f5f4', wall2: '#e3e9e8', base: '#d5d9d8', accent: '#8aa0c8', accent2: '#ef8a7e', accent3: '#f2b544' };
  let made = null;
  Object.defineProperty(THEMES, 'undermall', { configurable: true, enumerable: true,
    get() { if (made) return made; const b = THEMES.konbini, t = { ...(b || THEMES.my), ...OWN }; if (b) made = t; return t; },
    set(v) { made = v; } });
  const F = (type, x, z, a = 0, opts) => ({ type, x, z, a, ...(opts ? { opts } : {}) });
  MAPS.undermall = () => {
    const T = THEMES.undermall;
    return { theme: T, friendAt: [.35, .65], nBonus: 3, fitAll: true, fitW: 14.0, homeShift: [-1.5, -1.72], bleed: false, rooms: [{ at: [0, 0], layout: {
      w: 8, d: 6, theme: T, bleed: false, slab: 'none', walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      furniture: [
        F('um_hall', 0, 0),
        F('um_shopstall', -1.95, -2.275, 0, { variant: 'clothes', W: 1.4, D: 1.45 }),
        F('um_shopstall', -.55, -2.275, 0, { variant: 'snack', W: 1.4, D: 1.45 }),
        F('um_shopstall', .85, -2.275, 0, { variant: 'keys', W: 1.4, D: 1.45 }),
        F('um_shopstall', -3.35, -.2, PI / 2, { variant: 'flower', W: 1.3, D: 1.3 }),
        F('um_kiosk', -.55, -1.15),
        F('um_office', 2.8, -1.5),
        F('um_safe', 3.3, -2.5),
        F('um_escalator', -3.45, -1.95),
        F('um_lockers', -3.75, 2.4, PI / 2),
        F('um_revolvingdoor', -3.27, 1.15),
        F('um_mapboard', 3.3, 2.3, .6),
      ],
      decor: [],
    } }] };
  };
}

// 보조 장치 (gpt-chains.js CHAINS 형식 — 보스판은 recipeFor가 주 연쇄 steps를 비우고 보조만 돌림, 설계서 40: 셔터 레버 15 · 회전문 19 ·
// 컨베이어 27). 판 목표와 상관없는 장난감: 터치 한 번 → 저절로 끝까지, 단계 소리, 처음 한 번 친구가 한 줄.
export const UM_CHAIN = {
  aux: [
    { dev: 'um_shopstall#2:0', sfx: [[.05, 'latch'], [.25, 'ratchet'], [.7, 'lift_metal'], [.97, 'clink']], line: K('드르륵… 열쇠 가게도 아직 안 닫았네?', 'Rrrattle… the key shop is still open?') },
    { dev: 'um_escalator#0:0', sfx: [[.05, 'click'], [.2, 'ratchet'], [.6, 'ratchet'], [.95, 'pop']], line: K('누가 쇼핑백을 놓고 올라갔나 봐!', 'Someone left a shopping bag on the stairs!') },
    { dev: 'um_revolvingdoor#0:0', sfx: [[.1, 'door'], [.6, 'swish'], [.95, 'thunk']], line: K('빙글! 뒤에 우산 바구니가 있었네', 'Whirl! There was an umbrella basket behind it') },
    { dev: 'um_mapboard#0:0', sfx: [[.4, 'flip'], [.95, 'pop']], line: K('뒷면에 낙서: "까꿍!"', 'Scribbled on the back: "Peekaboo!"') },
  ],
};
