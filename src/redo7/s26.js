// 26판 멍뭉이네 마당 2층집 새 안 doghouse3 (⑦ 10/23 — 사용자 1~70 검토 메모 "새로. 2층집 외 배경은 하얀 느낌의 단순한 동네(자리만 잡혀 있게)"):
// 옛 alleyhouse(골목 담 안 마당 + 집, 마당이 집 뒤에 가려짐)는 키로 남고, 새 집은 카메라 쪽으로 열린 마당을 둔 2층집 —
// 왼쪽 집(1층 부엌·거실, 계단, 2층 멍뭉이 방), 오른쪽 앞 마당(개집·빨랫줄·텃밭·수돗가, 앞에 낮은 울타리와 대문).
// 집 둘레는 하얀 동네 키트(gfx/whitetown-kit.js): 앞 큰길·옆길·연석·횡단보도와 흰 덩어리 집·나무만, 색 없이. 멀리 다음 판 동네 역이 작게.
// 판 부품: 자물쇠 비밀번호는 2층 금고(시계는 2층 박공벽 벽시계 하나 — obslock.js가 그 시계를 씀), 색깔은 마당 개집 지붕(꽃병 셋은
// obslock이 빈 자리에 둠). 이야기·물건 표·보물 지키기는 옛 키 alleyhouse로 이어짐(roomalias.js).
import { registerFurniture } from '../gfx/furniture.js';
import { D3_BUILDERS, D3_INFO } from '../gfx/redo7-s26-props.js';
import { WHITETOWN_BUILDERS, WHITETOWN_INFO } from '../gfx/whitetown-kit.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const at = (type, x, z, a = 0, opts) => ({ type, x, z, a, opts });
const PI = Math.PI, HP = PI / 2;

export function install({ MAPS, THEMES, SWAP, LOOK, SPEC }) {
  registerFurniture(D3_BUILDERS, D3_INFO); registerFurniture(WHITETOWN_BUILDERS, WHITETOWN_INFO);
  const old = THEMES.alleyhouse || {};
  const base = { ...(THEMES.my || {}), friend: old.friend ?? 'shiba' };
  // (큰 면은 순하게: 1층 크림 줄무늬 벽에 세이지 징두리, 2층 연하늘 나무벽, 주홍 기와 지붕; 포인트는 작은 것들)
  const house = { ...base, name: old.name || '멍뭉이네 마당 2층집', bg: ['#f7f6f3', '#eceae6'],
    wallKind: 'stripe', wall: '#fff8ee', wall2: '#f3e2cc', wainscot: '#b9d3b4', trim: '#fffaf2', wallEdge: '#fffaf2',
    floorKind: 'planks', floor: '#e2b07a', floor2: '#c98f58', base: '#efe6da', clad: '#fff5e8',
    roof: '#ee8a6a', roof2: '#f4a184', door: '#7fa6d8', accent: '#ff8f6b', accent2: '#7fb6e8', pot: '#ff9b73', fence: '#f4ece0' };
  const up = { ...house, wallKind: 'wood', wall: '#e4f0f6', wall2: '#cfe2ec', wainscot: '#9fc3d8', floor: '#ecc694', floor2: '#d6a670' };
  const yard = { ...house, floorKind: 'grass', floor: '#a9d98a', floor2: '#94ca74', base: '#a2d282' };
  THEMES.doghouse3 = house;
  MAPS.doghouse3 = () => ({ theme: house, friendAt: [3.3, 1.4], nBonus: 3, fitAll: true, rooms: [
    // 1층: 뒤 부엌(위층 밑), 앞 거실, 서쪽 벽 계단, 동쪽 벽 마당 문
    { at: [-2, 0], level: 0, layout: { w: 6, d: 7, theme: house, wallH: 2.9, timber: true, walls: { E: 'door' }, doorAt: { E: .9 },
      furniture: [{ ...F('stairsup', 0, 3), dz: .27 },
        F('fridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('kimchifridge', 4, 0), F('plant', 5, 0),
        F('diningset', 2, 2), F('shoerack', 5, 2, 3),
        F('tvlow', 2, 3), F('lamp', 4, 3), F('rug', 2, 4), F('table', 3, 4), F('sofa2', 2, 6, 2), F('laundrybasket', 5, 6), F('beanbag', 1, 5),
        // 하얀 동네 (공용 키트): 집터 둘레 x ±5.2, z ±3.7은 비우고, 앞 큰길·오른쪽 옆길, 멀리 북동쪽에 다음 판 동네 역
        at('whitetown', 0, 0, 0, { at: [-2, 0], clear: [-5.2, -3.7, 5.2, 3.7], ground: false, sky: '#d9eefa', seed: 26,
          landmarks: [{ build: 'd3_farstation', x: -5.5, z: -17.5, ry: .3, s: .85 }], skip: [[-5.5, -17.5, 6]] })],
      decor: [D('window', 'W', -.6), D('picture', 'W', 1.9), D('wallshelf2', 'N', 1.2)] } },
    // 2층: 멍뭉이 방 — 침대·옷장·책상·금고·책장, 박공벽에 벽시계
    { at: [-2, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [2.5] }, gable: 'N', timber: true,
      furniture: [F('bookshelf', 0, 0, 0, { seed: 41 }), F('safe', 1, 0), F('desk', 2, 0), F('stool', 2, 1, 2), F('wardrobe', 4, 0), F('bed', 5, 0), F('chest', 3, 2), F('plant', 5, 2)],
      decor: [D('clock', 'N', .4), D('window', 'W', 0), D('picture', 'N', -1.9)] } },
    // 마당: 풀밭, 뒤·옆은 낮은 울타리, 앞은 대문 울타리
    { at: [3, 0], level: 0, layout: { w: 4, d: 7, theme: yard, walls: { N: 'fence', E: 'fence', W: 'none', S: 'none' },
      furniture: [{ ...F('d3_kennel', 0, 0), dx: .38, dz: .2 }, F('watertap', 3, 0), F('clothesline', 0, 2), F('bike', 2, 2), F('garden', 2, 4),
        F('d3_doorstep', 0, 4, 1), F('d3_frontfence', 0, 6),
        at('d3_yardpath', 0, 0, 0, { pts: [[1.0, 2.8], [.75, 2.3], [.2, 1.95], [-.4, 1.65], [-.95, 1.35]] })] } },
  ] });
  // 빛과 하늘: 맑은 낮빛(흰 해·하늘색 하늘 — 허브 빛 규칙 10/23, 늦은 햇살·살구빛 X) — 바닥은 룩의 옅은 보도판이 멀리까지(방 둘레 번짐 대신),
  // 동네는 하얀 동네 키트(gfx/whitetown-kit.js), 먼 집은 하늘 가운데 색으로 흐려짐
  LOOK.doghouse3 = {
    light: { ambColor: '#f4f6fb', amb: 1.32, sunColor: '#fff4e6', sun: 2.5, shadow: .56 },
    sky: ['#9fd3f2', '#d9eefa', '#bfe2f6'],
    ground: { size: 60, fade: [12, 26], walk: ['#e6e8eb', '#dfe2e6'] },
    itemSize: .38,
  };
  // 시작 줌: 집과 마당이 폰 세로에 다 들어오게 (옛 26판 1.4는 집 왼쪽이 잘렸음 — 찍어 보고 정함)
  // (허브 10/24 "찾을 것이 집 안에 몰려 있으니 2~3개를 마당으로"): 이 판의 버릇 자리(hunt.js spec.habit)를 마당 세 곳으로 — 빨랫줄 받침·
  // 수돗가·댓돌 — 그리고 물건마다 먼저 거기부터(habitMore). 자리가 셋뿐이라 개집 안(색깔 자물쇠)까지 마당에 2~3개. 주인의 원래 버릇
  // 단어(조리대·냉장고…)는 집 안 조리대를 먼저 잡아서 이 맵에서만 바꿈
  SPEC.doghouse3 = s => { s.zoom = 1.3; s.habit = ['clothesline', 'watertap', 'doorstep']; s.habitMore = true; s.lockOn = { ...s.lockOn, code: ['safe'], color: ['d3_kennel'] }; };
  SWAP[26] = ['alleyhouse', 'doghouse3'];
}
