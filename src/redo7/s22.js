// 22판 우리 동네 골목 3 street3 (⑦ 10/23 — 사용자 메모 "정리만: 도로·인도 단차, 도로를 벽으로 막지 않기, 디테일 조금, 도로 방향, 인도·도로
// 사이 턱, 정지 표지·반사경 배치 정리, 버스 정류장이 인도 한복판"): 옛 street와 같은 가구(이름·숨김 자리 그대로)를 인도 6 × 5에 다시 놓음.
//   - 담(alleywall)은 인도 뒤 북·서에만 — 차도는 담에 안 막히고 섬 끝까지 흐름(gfx/redo7-street3.js 바탕)
//   - 차도는 연석 한 단 아래, 앞 큰길(동서) + 오른쪽 골목길(남북) T자, 건널목·정지선·빗물받이·건너편 인도
//   - 정류장은 큰길 연석 앞에 길을 보고, 가로등·소화전·볼록거울은 골목길 쪽 연석을 따라 한 줄(볼록거울은 모퉁이에서 두 길을 봄), 정지 표지는
//     골목길 건너편 인도 모퉁이(10/24), 맨홀 공사 자리에 러버콘 둘
// 옛 22판은 키 street로 그대로 — 판 표는 그대로고 새 맵 스위치(?newmaps=1)에서만 street3. 이야기·물건 표·빛은 roomalias.js가 street로 이어 줌.
import { registerFurniture } from '../gfx/furniture.js';
import { ST3_BUILDERS, ST3_INFO } from '../gfx/redo7-street3.js';
import { addI18n } from '../i18n.js';
import { STREET_THEMES } from '../gfx/street-props.js';

const F = (type, i, j, rot = 0, o = {}) => ({ type, i, j, rot, ...o });
const D = (type, wall, u, o = {}) => ({ type, wall, u, ...o });

export function install({ LAYOUTS, THEMES, SWAP, LOOK, SPEC }) {
  registerFurniture(ST3_BUILDERS, ST3_INFO);
  addI18n({ '골목 길바닥': 'Street corner', '빗물받이 옆': 'By the drain', '가로수 밑': 'Under the street tree', '어린이 보호': 'SCHOOL ZONE', '천천히': 'SLOW' });
  // (GPT QA NEW-UI-22 10/24: when this runs the old street theme may not be in THEMES yet — street3 came out with no name, so 22판's
  // title was blank; its friend and backdrop were missing too: the old theme straight from where it's written, under THEMES.my)
  const old = THEMES.street?.name ? THEMES.street : { ...(THEMES.my || {}), ...STREET_THEMES.street };
  THEMES.street3 = { ...old, floorKind: 'brickpave', floor: '#e8b48e', floor2: '#e8b48e', pave: '#e8b48e', tactile: false };
  LAYOUTS.street3 = {
    w: 6, d: 5, theme: THEMES.street3, slab: 'none', bleed: null, exact: true, noEntry: true,
    walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    homeShift: [.85, .85], fitW: 8.0,
    furniture: [
      { type: 'st3_base', x: 0, z: 0, a: 0 },
      F('pole', 0, 0), F('konbini', 1, 0), F('vending', 3, 0), F('vending', 4, 0), F('boxstack', 5, 0),
      F('potgate', 0, 1), F('tteokstall', 0, 2, 1), F('redstools', 1, 2), F('postbox2', 1, 4),
      F('bike2', 1, 1), F('cones', 2, 2), F('manhole', 3, 2), F('cones', 4, 2),
      F('streetlamp', 5, 1), F('hydrant', 5, 2), { ...F('mirrorpole', 5, 4), ry: 35 },
      F('bench2', 3, 4),
      // (10/29 허브 "고양이 간판이 포장마차 뒤에 가려짐": 간판을 담 끝 빈 자리로, 그 자리 우체통은 보도 쪽으로 한 칸)
      // (10/24 사용자 "정지는 건너편 쪽으로 — 후사경이랑 너무 붙어 있어서": 골목길 건너편 인도 모퉁이, 앞면이 시작 화면에 보이게)
      { type: 'stopsign', x: 5.3, z: 2.0, a: .5 },
    ],
    decor: [D('catsign', 'W', -2.0), D('mailbox', 'N', 2.5)], friendAt: [-.4, .4],
  };
  SPEC.street3 = s => { s.zoom = 1; };
  // (빛 10/23 허브·사용자 "누렇다, 이전엔 쨍하니 이뻤다": 새 맵은 맑은 낮빛 — 흰 해, 하늘색 하늘; 옛 골목 테마의 늦은 햇살은 덮음)
  LOOK.street3 = { light: { ambColor: '#f4f6fb', amb: 1.32, sunColor: '#fff4e6', sun: 2.5, shadow: .56 }, sky: ['#9fd3f2', '#d9eefa', '#bfe2f6'] };
  SWAP[22] = ['street', 'street3'];
}
