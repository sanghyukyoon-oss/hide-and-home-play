// 27판 '벚꽃마을역' station4 (⑧ 10/24 — 사용자 "역도… 완전 새롭게 다시. 완전 디테일하고 좋아 보이게", 허브가 블록아웃 A안을 고름).
// 판 표 PLAN은 그대로, 새 맵 스위치 stages.js NEW_MAPS 27 → station4 (미리보기 ?gptmap=station4).
// 구도(마지막 패스 10/24): 앞뒤로 긴 섬 — 선로가 화면을 대각선으로 지나고 단식 승강장이 그 옆으로 길게, 나무 역사는 승강장 뒤 왼쪽,
// 큰 벚나무(판의 얼굴)는 승강장 가운데 뒤; 승강장 생활 소품(벤치 위 가방·신문, 역 시계, 분리수거함, 자판기, 짐 카트, 대기선, 꽃잎);
// 찻길이 섬 동쪽 끝을 앞뒤로 지나 건널목(차단기 둘); 앞 잔디 띠에 꽃밭·자전거 거치대·역 이름판·우체통. 카메라는 승강장 가까이.
// 맑은 낮빛(look.js RECIPES.station4), 둥근 층진 섬(s4_land — 바닥 노릇, layout.hideFloor), 움직이는 배경 없음.
// 대본(stationH: bagPop → 건널목 → trainIn)·친구(개굴이)·물건 풀은 roomalias.js 별칭 station4 → station으로 따라옴.
// 연출·자물쇠가 찾는 type은 옛 이름 그대로(train·crossing·platshelter·tripbag·suitcases·coinlocker + 새 ticketoffice) — 모양만
// opts.gptHero로 gfx/station4-props.js의 빌더를 끼움.
import { registerFurniture } from './gfx/furniture.js';
import { S4_BUILDERS, S4_INFO, PY, TZ, POLES } from './gfx/station4-props.js';

const HP = Math.PI / 2;
const at = (type, x, z, a = 0, opts, y) => ({ type, x, z, a, ...(opts ? { opts } : {}), ...(y != null ? { y } : {}) });
const hero = (type, h, x, z, a = 0, y, more) => at(type, x, z, a, { gptHero: h, ...more }, y);

function lazyTheme(THEMES, key, extra) {
  let made = null;
  Object.defineProperty(THEMES, key, { enumerable: true, configurable: true,
    get() { if (made) return made; const old = THEMES.station || THEMES.my, t = { ...old, ...extra, friend: old.friend ?? 'frog' }; if (old !== THEMES.my) made = t; return t; },
    set(v) { made = v; } });
  return () => THEMES[key];
}
const OWN = { name: '벚꽃마을역', floorKind: 'grass', floor: '#a9d888', floor2: '#93cc74', base: '#a07a58' };

export function installStation4(LAYOUTS, THEMES) {
  registerFurniture(S4_BUILDERS, S4_INFO);
  const theme = lazyTheme(THEMES, 'station4', OWN);
  LAYOUTS.station4 = { w: 10, d: 7, get theme() { return theme(); }, exact: true, noEntry: true, slab: 'none', bleed: null, hideFloor: true, wallH: 0, walkRaised: true,
    walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, decor: [],
    // (마지막 패스 10/24 허브: 지금 27판처럼 승강장 가까이 — 옛 역과 같은 yaw π/4, fitW 9(옛 8.6), 27판 줌 1.4; 화면 가운데는 역사와 벚나무 사이; 섬 전체가 아니라 승강장·역사·벚나무가
    // 폰 세로 화면을 채우고, 돌려 보면 건널목·앞 꽃밭이 보임)
    yaw: Math.PI / 4, fitW: 9.0, homeShift: [-.35, -1.65],
    // the platform: x -5..3, z -1.5..0.5, a step's height (one stride up anywhere — gptsakura's way)
    raised: [{ i: 0, j: 2, w: 8, d: 2, h: PY, kind: 'tile', a: '#eeebe6', b: '#e4e0da', edge: '#cfc8bd', nose: '#fbf8f3', plinth: '#b9ad9e', stone: '#d4d0ca', step: false }],
    furniture: [
      at('s4_land', 0, 0),
      // behind the platform: the station house and its ticket window; the big cherry tree (the stage's face) behind the platform's middle
      at('s4_station', -3.0, -2.5), at('ticketoffice', -4.15, -1.5, 0, null, PY), at('s4_sakura', 1.1, -2.65, 0, { s: 1.5 }),
      // along the back of the platform: the IC gate by the door, the coin lockers (their big box faces the platform — hunt.js keeps a lock only where
      // what's inside shows from two views), the shelter with its bench, the recycling bins, the vending machines
      at('s4_icgate', -2.0, -1.05, 0, null, PY), hero('coinlocker', 's4_locker', -.85, -1.22, 0, PY), hero('platshelter', 's4_shelter', .1, -.95, 0, PY),
      at('s4_bins', 1.35, -1.25, 0, null, PY), at('s4_vend', 2.32, -1.2, 0, null, PY),
      // out on the platform: 개굴이's fishing bag, the luggage cart by the vending machines
      hero('tripbag', 's4_tripbag', -2.2, -.4, .25, PY), hero('suitcases', 's4_cart', 2.45, -.3, 0, PY),
      // the track: the train (away until the end — staging bagPop / trainIn), the crossing either side of the road
      hero('train', 's4_train', -1.0, TZ), hero('crossing', 's4_crossing', 3.35, TZ + .92), hero('crossing', 's4_crossing', 5.05, TZ - .95, Math.PI),
      // the front bank: the bikes, the station's name board, the postbox by the road; the poles along the road
      at('s4_bikes', -3.55, 2.85), at('s4_namesign', 1.95, 2.8), at('s4_post', 2.7, 3.05), at('s4_pole', POLES[0][0], POLES[0][1]), at('s4_pole', POLES[1][0], POLES[1][1]),
    ],
    // (개굴이 on the open grass of the front bank, by the bed but out of it, facing the train's door side. On the platform he can't
    // start: stage.js clears the spot against the platform's block and stands him at y 0 — then, unseen inside it, moves him to the
    // nearest seen ground, which was the flower bed by the fence (사용자 메모 '개구리 꽃에 뚫림'))
    friendAt: [-1.0, 3.45] };
}
