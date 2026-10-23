import { affOk, affLike, isCold, habitSpot, placeLike } from './affinity.js';
import { spotFits, shapeFits, fullSize } from './fitspot.js';   // 자리에 맞는 물건 (10/19)   // 물건마다 나올 법한 자리 (10/19)
import * as THREE from 'three';
// Room themes, hand-placed layouts, stage specs and a seeded planner that hides targets / keys / decoys.
import { rng } from './util.js';
import { asRoom, asRooms } from './roomalias.js';
const sockRoom = r => asRooms(r).some(k => SOCK_ROOMS.has(k));
import { indexSpots } from './room.js';
import { resolveHost, makeFreeSpot } from './freehide.js';
import { ITEMS, TARGET_POOL, DECOY_POOL } from './gfx/items.js';
import { FURN_INFO } from './gfx/furniture.js';
import { digPatch } from './gfx/outdoor.js';
import { tvPuzzle } from './gfx/apt-props.js';
import { installGpt6, gpt6Spec } from './gpt6-maps.js';   // GPT 작업장 맵 36·43~70판 (⑥ 10/22)
// 22~26판 다시 만들기 (⑦ 10/23): 판마다 새 맵 키 → NEW_MAPS — redo7.js
import { installRedo7, REDO_SPEC } from './redo7.js';
import { applyEdit } from './layedits.js';
import { planDevice } from './devices.js';
import { ROOM_POOLS, ROOM_FEATURE, SOCKS, SOCK_ROOMS, STAGE_ITEMS } from './pools.js';

export const THEMES = {
  bunny: { name: '토순이네 침실', friend: 'bunny', bg: ['#fff4ea', '#ffe6d4'], base: '#e8b98c', floorKind: 'planks', floor: '#d9a066', floor2: '#a96c3c', wallKind: 'heart', wall: '#fff7ef', wall2: '#ffb3a3', wainscot: '#bfe3d3', trim: '#ffffff', wallEdge: '#fffaf4',
    wood: '#f6d6ae', woodD: '#d9a876', body: '#fffaf3', accent: '#ff8f86', accent2: '#8fcff2', accent3: '#ffd25c', door: '#9fd9c4', knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#ffb3a3', fabric2: '#ffe0d6', curtain: '#9fd9c4', rug: '#fff1d6', rug2: '#ff9f8f', pot: '#f08a5d', top: '#ffffff',
    sofa: '#fff0d8', quilt: '#ff8f86', cloth: '#9fd9c4', throw: '#8fcff2', duvet: '#8fcff2', bean: '#ffcf5c' },
  bear: { name: '곰돌이네 거실', friend: 'bear', bg: ['#f6f6e8', '#ebeed6'], base: '#c99a6b', floorKind: 'planks', floor: '#b97f4c', floor2: '#86552d', wallKind: 'stripe', wall: '#f4f7e8', wall2: '#dfe9c6', wainscot: '#f2d9b0', trim: '#ffffff', wallEdge: '#fbfcf3',
    wood: '#f3cf9c', woodD: '#d29c62', body: '#fffaf1', accent: '#ff9f6b', accent2: '#7fb8e8', accent3: '#ffd25c', door: '#f6c58e', knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#7fb8e8', fabric2: '#c6e0f5', curtain: '#ffcb8f', rug: '#fff3df', rug2: '#ffb27a', pot: '#e9845a', top: '#ffffff',
    sofa: '#7fb8e8', quilt: '#ff8f6b', cloth: '#ffe08a', throw: '#ffd25c' },
  cat: { name: '냥냥이네 부엌', friend: 'cat', bg: ['#eef9f2', '#dcf0e3'], base: '#a9d8bf', floorKind: 'checker', floor: '#fff8ec', floor2: '#f1c6a3', wallKind: 'tile', wall: '#f4fbf7', wall2: '#cfeedd', wainscot: '#8fd0b4', trim: '#ffffff', wallEdge: '#f8fdfa',
    wood: '#ecbd86', woodD: '#c98d55', body: '#ffffff', accent: '#5fc4a4', accent2: '#ff9f8a', accent3: '#ffd25c', door: '#8fd6bd', knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#ffb68a', fabric2: '#ffe1c9', curtain: '#ff9f8a', rug: '#ffe9d6', rug2: '#ffffff', pot: '#ff9f8a', top: '#fff7ea',
    cloth: '#ff9f8a', kimchi: '#9b3b4b' },
  peng: { name: '펭펭이네 다락방', friend: 'peng', bg: ['#eef2fb', '#dfe6f6'], base: '#b9a27f', floorKind: 'planks', floor: '#caa06f', floor2: '#946a3e', wallKind: 'star', wall: '#eef2ff', wall2: '#ffd36e', wainscot: '#7f93c9', trim: '#ffffff', wallEdge: '#f5f7ff',
    wood: '#f3d6ad', woodD: '#cf9f68', body: '#f7f9ff', accent: '#6f95e8', accent2: '#ffd36e', accent3: '#ff8f86', door: '#9fb5ef', knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#9fb5ef', fabric2: '#d8e2fb', curtain: '#6f95e8', rug: '#fff0c7', rug2: '#6f95e8', pot: '#ff8f86', top: '#ffffff',
    duvet: '#6f95e8', bean: '#ffd36e' },
  my: { name: '몽글이 방', friend: null, bg: ['#fff3e3', '#ffe2c4'], base: '#ffcf9f', floorKind: 'planks', floor: '#f4d4ad', floor2: '#ddb184', wallKind: 'dots', wall: '#fff8ee', wall2: '#ffe6c8', wainscot: '#ffe8cc', trim: '#ffffff', wallEdge: '#fffaf3',
    wood: '#f0cba0', woodD: '#d0a070', body: '#fffaf4', accent: '#ffb35c', accent2: '#8fd3ff', accent3: '#ff9ec2', door: '#ffc98f', knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#ffc9a6', fabric2: '#ffdcc4', curtain: '#ffcf8f', rug: '#ffe6c9', rug2: '#ffffff', pot: '#7fbfff', top: '#ffffff' },
};

// Outdoor regions reuse the 'my' palette for any indoor piece and add ground / boundary colours (gfx/outdoor.js keys).
const OUT = (name, friend, bg, extra) => ({ ...THEMES.my, name, friend, bg, trim: '#ffffff', ...extra });
const ALLEY = { floorKind: 'asphalt', base: '#b9b4c8', floor: '#7d7b8e', floor2: '#6b697c', wall: '#f4e8d4', wall2: '#d9745a' };
const PARK = { floorKind: 'grass', base: '#8fcf6a', floor: '#8fd46a', floor2: '#7cc45a' };
const CAMP = { floorKind: 'dirt', base: '#c99a6b', floor: '#c99a6b', floor2: '#b38358' };
Object.assign(THEMES, {
  alley1: OUT('삐딱이네 골목길', 'grumpy', ['#fff0de', '#f6dcc2'], { ...ALLEY }),
  alley2: OUT('보드킹의 계단 골목', 'skater', ['#ffeede', '#f1d9cf'], { ...ALLEY, plaster: '#f1e4e8', brick: '#c9846e', gate: '#3b8fd8' }),
  // 보드킹의 스케이트 파크 (must-have theme, 10/17): replaces the stair alley in the alley region
  skatepark: OUT('보드킹의 스케이트 파크', 'skater', ['#fff0e6', '#e9e6f6'], { ...ALLEY, floor: '#c9c4d6', floor2: '#b6b0c6', plaster: '#f1e4e8', fence: '#c9cfe0', pool: ['sunglasses', 'juicebox', 'bubbletea', 'ball2', 'earphones', 'cap'] }),
  alley3: OUT('멍뭉이네 동네 슈퍼', 'shiba', ['#fff3dc', '#f7e1bc'], { ...ALLEY, plaster: '#f6ecd6', roofTile: '#7a5f9e', gate: '#2fa36b' }),
  park1: OUT('개굴이의 놀이터', 'frog', ['#e4f6ff', '#d6f3d8'], { ...PARK }),
  park2: OUT('다람이의 공원 벤치', 'squirrel', ['#eaf7ff', '#e4f3cf'], { ...PARK, grass: '#9ad66f', hedge: '#47ad57', flower: '#ffd23f' }),
  park3: OUT('햄찌의 소풍 마당', 'hamster', ['#fff6e2', '#e1f4d2'], { ...PARK, grass: '#a2da74', fence: '#ffe9c9' }),
  // 개굴이의 낚시터 (must-have theme, 10/17): an early outdoor stage so the first friends' stages aren't all rooms
  // 개굴이의 기차역 (10/20, new 3판 — 레벨 plan-stages-1to20-v2): pale platform paving, the station's cream wall, spring green
  station: OUT('개굴이의 기차역', 'frog', ['#eef3e2', '#dce8cc'], { ...PARK, grass: '#9ad672', base: '#a98060', tactile: false,
    wall: '#fff4e2', wall2: '#f2e2c8', wainscot: '#6cc28e', trim: '#ffffff', wallEdge: '#fffaf0' }),
  // 바닷가 가게 (10/20 밤, user ref "이것도 좋다"): grey cobbles, sand, a strip of shallow sea; the friend is a placeholder
  // 빌라 옥상 정원 (18판 시안 — id villaroof, not 'rooftop': that is the building chapter's roof)
  villaroof: { ...THEMES.my, friend: 'raccoon', name: '빌라 옥상 정원', bg: ['#fbd6c0', '#c9a7d6'], wallKind: 'plain', wall: '#f3eadc', wall2: '#e8dccb', wainscot: '#e8dccb', trim: '#ffffff', wallEdge: '#fbf6ee',
    floorKind: 'tile', floor: '#93c4a0', floor2: '#86b893', base: '#e9dfd0' },
  // 동네 도서관 (17판 흑백 판 시안 — story room: 토순이's)
  library: { ...THEMES.my, friend: 'bunny', name: '동네 도서관', bg: ['#cbd9ef', '#9db5dd'], wallKind: 'plain', wall: '#fbf3e4', wall2: '#efe2c8', wainscot: '#5f7fae', trim: '#d9a466', wallEdge: '#fffaf0',
    floorKind: 'planks', floor: '#e2a96a', floor2: '#c98f58', base: '#c9a47c', rug: '#8fa9d4', rug2: '#ffffff', wood: '#e9b884', woodD: '#c4905c' },
  aptlobby: { ...THEMES.my, friend: 'nerd', name: '우리 아파트 현관', bg: ['#fbefe6', '#ead2c0'], wallKind: 'plain', wall: '#f3eadc', wall2: '#e8dccb', wainscot: '#d2c2ad', trim: '#ffffff', wallEdge: '#fbf6ee',
    floorKind: 'tile', floor: '#e6ddd3', floor2: '#d9cfc4', base: '#d9cfc2', pave: '#cfd2da' },
  seaside: OUT('냥냥이네 바닷가 가게', 'cat', ['#eef6fb', '#dceef6'], { floorKind: 'brickpave', base: '#d8cfc0', floor: '#dfe2e8', floor2: '#cdd1da', pave: '#d9dce4', tactile: false, water: '#7fd3e8', sand: '#efd9ae' }),
  island: OUT('개굴이의 호수 섬', 'frog', ['#e2f2f8', '#d4ecf2'], { ...PARK, base: '#b98c5e', grass: '#97d872', sand: '#f2dca8' }),
  fishing: OUT('개굴이의 낚시터', 'frog', ['#e2f6ff', '#d4f1e2'], { ...PARK, grass: '#97d872', hedge: '#4cae5c', flower: '#ff9ec2', pool: ['rubberduck2', 'juicebox', 'acorn', 'sunglasses', 'ball2', 'bubbletea'] }),
  camp1: OUT('판다의 캠핑장', 'panda', ['#e9ecff', '#dcefe6'], { ...CAMP }),
  camp2: OUT('졸졸이의 텐트', 'sleepy', ['#ebe4ff', '#e2ecf2'], { ...CAMP, tent: '#7f9cff', tent2: '#ffd23f' }),
  camp3: OUT('큐브봇의 산속 기지', 'robot', ['#e4eeff', '#e9e6d6'], { ...CAMP, dirt: '#c3a079', tent: '#4fc28f', tent2: '#fff3df' }),
});

THEMES.catstory = { ...THEMES.cat, name: '심통난 냥냥이' };
// 박사님의 비밀 서재 (showcase incident, 10/18): deep green and honey, a study full of books
THEMES.study = { ...THEMES.bear, name: '박사님의 비밀 서재', friend: 'nerd', bg: ['#f3efe2', '#e6dfca'], base: '#a87a4c', floorKind: 'planks', floor: '#b3804e', floor2: '#7f5430',
  wallKind: 'stripe', wall: '#f6f0df', wall2: '#e3d6b8', wainscot: '#5f9e86', trim: '#ffffff', wallEdge: '#fbf7ec', wood: '#ecc28e', woodD: '#c08a52', accent: '#5aa88a', accent2: '#e8b04a', accent3: '#ff8f7a',
  door: '#8fd6bd', fabric: '#5aa88a', fabric2: '#cfe8dc', curtain: '#e8b04a', rug: '#f6e3c0', rug2: '#c0504d', sofa: '#5aa88a', bean: '#e8b04a' };

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const LF = (type, i, j, rot = 0, opts, y = 1.45) => ({ type, i, j, rot, opts, y });   // furniture up in a loft

export const LAYOUTS = {
  bunny: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    // (10/19 겹침 QA: the tall wardrobe stood at the loft's edge — its top 42cm into the loft floor and, from v162, its door
    // into the curtain; the low drawers take that place under the loft's rim and the wardrobe moves one along)
    lofts: [{ i: 0, j: 0, w: 2, d: 2, y: 1.45, ladder: 'S', ladderAt: .45 }], cut: [{ i: 4, j: 3, w: 2, d: 2 }],
    furniture: [LF('futon', 0, 0, 0, null, 1.45), F('desk', 0, 1), F('chest', 0, 0), F('drawers', 2, 0), F('wardrobe', 3, 0), F('rug', 2, 2), F('beanbag', 3, 2), F('plantshelf', 4, 2), F('plant', 5, 2), F('laundrybasket', 1, 3), F('trash', 3, 4)],
    decor: [D('window', 'N', .25), D('posterwall', 'N', 1.6), D('catclock', 'N', 2.5), D('window', 'W', .1), D('door', 'W', -1.6)], friendAt: [2.4, 1.0] },
  bear: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    raised: [{ i: 0, j: 0, w: 3, d: 2, h: .3, kind: 'carpet', a: '#dfe6b4', b: '#c9d39a', stepX: .6 }], cut: [{ i: 0, j: 4, w: 2, d: 1 }],
    furniture: [F('floorlamp', 0, 0), F('recordcab', 1, 0), F('zabuton', 0, 1), F('kotatsu', 1, 1), F('zabuton', 2, 1),
      F('sofa2', 3, 0), F('bookshelf', 5, 0, 0, { seed: 11 }), F('monstera', 5, 1), F('rug', 3, 1), F('table', 3, 2), F('tvlow', 3, 4, 2), F('chest', 0, 2, 1),
      // (the potted tree stood on the corner nearest the camera and hid whoever stood behind it — user, 5판 on a phone:
      // "제일 앞 나무가 캐릭터 가리고 있어"; 10/19 to the back, between the record cabinet and the sofa)
      F('plant', 2, 0)],
    decor: [D('window', 'N', -1.6), D('curtainwin', 'N', 1.0), D('catclock', 'W', -2.05), D('picture', 'W', 1.9), D('window', 'W', .3), D('door', 'W', -1.1)], friendAt: [1.8, 1.0] },
  cat: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    raised: [{ i: 3, j: 3, w: 3, d: 2, h: .25, kind: 'planks', a: '#e9b57c', b: '#b9824a', stepX: -1 }], cut: [{ i: 0, j: 4, w: 1, d: 1 }],
    furniture: [F('fridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('kimchifridge', 4, 0), F('bookshelf', 0, 2, 1, { seed: 21 }), F('counter', 2, 2, 2), F('counter', 3, 2, 2), F('stool2', 1, 2), F('plant', 5, 2),
      F('kitchentable', 4, 3), F('stool2', 3, 3), F('catbowls', 1, 4), F('trash', 2, 4)],
    decor: [D('wallrack', 'N', .5), D('window', 'N', -1.45), D('window', 'N', 2.4), D('catclock', 'W', 1.2), D('door', 'W', -1.0)], friendAt: [1.4, 1.0] },
  // 몽글 파출소: the front desk, a barred cell on the back wall, lockers, a WANTED board with 잉키 on it, a waiting bench
  police: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('filecab', 0, 0), F('safe', 1, 0), F('jailcell', 2, 0), F('lockers', 4, 0), F('watercooler', 5, 0), F('plantbig', 6, 0),
      F('reception', 2, 2), F('officechair', 2, 1), F('officedesk', 4, 2), F('lostbox', 6, 2), F('copier', 6, 4), F('lobbysofa', 0, 4), F('cones', 3, 5), F('plant', 6, 5)],
    decor: [D('wantedboard', 'W', .5), D('window', 'W', -1.2), D('door', 'W', 2.4), D('catclock', 'N', 3.0)], friendAt: [.5, -.6] },
  // 119 안전센터 (outside): the engine out on the apron in front of the half-open bay, hose reel, hydrant, cones, the bell
  firestation: { w: 8, d: 6, bleed: {}, wallH: 3.2, walls: { N: 'wall', W: 'alleywall', S: 'none', E: 'none' },
    floorZones: [{ i: 0, j: 0, w: 8, d: 4, kind: 'checker', a: '#d4d7de', b: '#c6c9d1' }],
    furniture: [F('hosereel', 0, 0), F('gearrack', 5, 0), F('lockers', 7, 0), F('firetruck', 1, 1), F('cones', 0, 3), F('cones', 4, 3), F('hydrant', 7, 3),
      F('bench', 5, 2), F('toolbox', 7, 2), F('bike2', 0, 5), F('streetlamp', 4, 5), F('boxstack', 7, 5)],
    decor: [D('firegarage', 'N', -1.0), D('firebell', 'N', .7), D('mailbox', 'W', 1.6)], friendAt: [2.6, 1.6] },
  // 파출소 앞 (outside): the door with the blue lamp, the patrol car parked out front, the WANTED board on its post
  policefront: { w: 8, d: 6, bleed: {}, wallH: 3.0, walls: { N: 'wall', W: 'alleywall', S: 'none', E: 'none' },
    floorZones: [{ i: 0, j: 0, w: 8, d: 2, kind: 'checker', a: '#eceef4', b: '#dfe2ea' }],
    furniture: [F('plantbig', 0, 0), F('postbox2', 3, 0), F('vending', 4, 0), F('lostbox', 7, 0), F('noticeboard2', 0, 2), F('patrolcar', 2, 3), F('cones', 4, 3),
      F('bench', 5, 2), F('hydrant', 7, 2), F('bike2', 5, 4), F('streetlamp', 0, 5), F('cones', 3, 5), F('plant', 7, 5)],
    decor: [D('policefront', 'N', -1.6), D('wantedboard', 'N', 2.4), D('mailbox', 'W', 1.2)], friendAt: [1.0, .2] },
  // 토순이네 교실: the chalkboard on the front wall, the teacher's desk, two rows of pupils' desks, lockers at the side
  school: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('bookshelf', 0, 0, 0, { seed: 91 }), F('plant', 1, 0), F('lockers', 5, 0), F('lockers', 6, 0), F('officedesk', 2, 1),
      F('schooldesk', 1, 3), F('schooldesk', 2, 3), F('schooldesk', 4, 3), F('schooldesk', 5, 3), F('schooldesk', 1, 5), F('schooldesk', 2, 5), F('schooldesk', 4, 5), F('schooldesk', 5, 5),
      F('plantbig', 0, 2), F('chest', 0, 4, 1), F('trash', 6, 5)],
    decor: [D('chalkboard', 'N', -.5), D('window', 'W', -.8), D('window', 'W', 1.2), D('catclock', 'N', 1.3)], friendAt: [-.2, .9] },
  // 곰돌이 소방서: the red engine in the bay, the gear on the back wall, the pole in the corner, the 출동 벨
  fire: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('gearrack', 0, 0), F('lockers', 2, 0), F('hosereel', 3, 0), F('metalshelf', 4, 0), F('firepole', 6, 0),
      F('firetruck', 2, 2), F('officedesk', 0, 4), F('stool', 1, 3), F('cones', 0, 2), F('watercooler', 6, 3), F('toolbox', 6, 5), F('cones', 5, 5)],
    decor: [D('firebell', 'W', -1.4), D('window', 'W', .8)], friendAt: [1.0, 2.0] },
  // the secret bookcase (2×1, it rolls one tile right) on the back wall between two ordinary ones; row 1 stays clear
  study: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9, cut: [{ i: 5, j: 4, w: 1, d: 1 }],
    furniture: [F('bookshelf', 0, 0, 0, { seed: 41 }), F('safe', 1, 0), F('secretshelf', 2, 0), F('bookshelf', 4, 0, 0, { seed: 43 }), F('floorlamp', 5, 0),
      F('chest', 0, 2, 1), F('rug', 1, 2), F('beanbag', 1, 3), F('table', 2, 3), F('desk', 3, 2), F('stool', 4, 3), F('drawers', 5, 2, 3), F('plant', 0, 4), F('trash', 4, 4)],
    decor: [D('window', 'W', .6), D('picture', 'W', 1.9), D('door', 'W', -1.0), D('catclock', 'N', 2.5)], friendAt: [.2, -.9] },
  peng: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    lofts: [{ i: 3, j: 0, w: 3, d: 2, y: 1.45, ladder: 'S', ladderAt: -.6 }], raised: [{ i: 0, j: 2, w: 1, d: 2, h: .35, kind: 'carpet', a: '#c9d6fb', b: '#aebff0', step: false }], cut: [{ i: 5, j: 4, w: 1, d: 1 }],
    furniture: [LF('futon', 4, 0, 1, null, 1.45), F('wardrobe', 0, 0), F('bookshelf', 1, 0, 0, { seed: 31 }), F('safe', 2, 0),
      F('parcel', 3, 0), F('boxes', 4, 0), F('beanbag', 0, 2), F('plantshelf', 0, 3),
      F('rug', 2, 2), F('drawers', 5, 3, 3), F('trash', 4, 4), F('laundrybasket', 1, 4)],
    decor: [D('window', 'N', -.5), D('window', 'N', 2.3), D('picture', 'N', 1.0), D('window', 'W', .5), D('clock', 'W', 1.6), D('door', 'W', -1.9)], friendAt: [2.4, 1.2] },
  // story boss of region 1: 냥냥이 sits on the chest; the puzzle frame on the wall gives the cupboard code
  // the everyday look (concept F): a Korean apartment living room with a kotatsu, a kimchi fridge and an American fridge,
  // filling the screen — the floor runs on past the walls (bleed) and the walls stand taller
  apt: { w: 7, d: 6, bleed: {}, wallH: 3.0, walls: { N: 'wall', W: 'wall' },
    // the kitchen corner: one step up (10/21 사용자 "아파트도 이런 부분은 단차가 있어야할거같아" — the tiles only changed colour, the
    // floor ran on flat), a low tiled platform with a rounded wooden nosing and a darker plinth at its foot
    raised: [{ i: 4, j: 0, w: 3, d: 2, h: .1, kind: 'checker', a: '#fffaf0', b: '#cfe8d6', edge: '#d9c6a8', trim: '#ffffff', nose: '#c98d55', plinth: '#a87452', step: false }],
    // (the 베란다 창 on the W wall reaches .3 into the room — sill, curtain — and the monstera's leaves and the drying rack's
    // feet stood in it, 81 cm of leaf through the curtain: they stand a little off the wall, the TV stand with them; 겹침 QA 10/19)
    furniture: [{ ...F('monstera', 0, 0), dx: .24 }, { ...F('tvlow', 1, 0), dx: .2 }, F('floorlamp', 3, 0), F('bigfridge', 4, 0), F('kimchifridge', 5, 0), F('snackcart', 6, 0),
      { ...F('dryrack', 0, 1, 1), dx: .1 }, F('sofa2', 0, 2, 1), F('laundrybasket', 0, 4), F('recordcab', 0, 5, 1),
      F('rug', 1, 2), F('kotatsu', 2, 2), F('zabuton', 2, 3), F('zabuton', 3, 2), F('robovac', 2, 5), F('parcel', 3, 4),
      F('diningset', 4, 4), F('plant', 6, 2), F('stool', 6, 5)],
    decor: [D('balconywin', 'W', 2.0), D('picture', 'W', .5), D('wallshelf2', 'W', -1.0), D('catclock', 'N', -1.5), D('wallshelf2', 'N', .2), D('picture', 'N', 3.0)], friendAt: [1.6, .6],
    sun: [{ from: [-3.5, -3.0, -3.5, -1.0], dir: [3.2, 1.2] }] },
  // concept G: a neighbourhood corner — paved sidewalk, an L of road at the front and right, a konbini, a tteokbokki
  // stall, vending machines, an American post box and hydrant, a stop sign and a bus stop
  street: { w: 8, d: 7, bleed: {}, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    floorZones: [{ i: 0, j: 5, w: 8, d: 2, kind: 'asphalt', a: '#a49dab', b: '#958e9d' }, { i: 6, j: 0, w: 2, d: 5, kind: 'asphalt', a: '#a49dab', b: '#958e9d' }],
    furniture: [F('pole', 0, 0), F('konbini', 1, 0), F('vending', 3, 0), F('vending', 4, 0), F('boxstack', 5, 0),
      F('potgate', 0, 1), F('tteokstall', 0, 2, 1), F('postbox2', 0, 4, 1), F('redstools', 1, 3), F('hydrant', 1, 4),
      F('bench2', 2, 2), F('streetlamp', 5, 1), F('bike2', 2, 4), F('stopsign', 4, 4), F('mirrorpole', 5, 4),
      F('cones', 6, 3), F('manhole', 4, 6), F('cones', 1, 6)],
    decor: [D('catsign', 'W', 2.5), D('mailbox', 'N', 3.0)], friendAt: [2.5, 2.0] },
  // the apartment kitchen (concept F's other half): fridges, a dining table, a snack cart, a kitchen tile floor
  aptkitchen: { w: 6, d: 5, bleed: {}, wallH: 3.0, walls: { N: 'wall', W: 'wall' },
    furniture: [F('bigfridge', 0, 0), F('kimchifridge', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('dishcab', 4, 0), F('snackcart', 5, 0),
      F('diningset', 2, 2), F('rug', 2, 3), F('laundrybasket', 0, 2), F('plant', 5, 2), F('trash', 5, 1), F('zabuton', 1, 3), F('parcel', 0, 4)],
    decor: [D('wallrack', 'N', 1.0), D('catclock', 'N', -.6), D('wallshelf2', 'W', -2.05), D('door', 'W', .75), D('window', 'W', -.7)], friendAt: [-.5, .9] },
  // 편의점 안: drink fridges along the back, snack gondolas, the counter with a steamer, a cup-noodle bar
  konbini: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('drinkfridge', 0, 0), F('drinkfridge', 2, 0), F('icecreamchest', 4, 0), F('magazinerack', 5, 0),
      { ...F('cupnoodlebar', 0, 2, 1), dz: -.1 }, F('snackshelf', 2, 2), F('counter2', 4, 3), F('plant', 5, 1), F('trash', 3, 4), F('boxes', 1, 4)],   // (the cup-noodle bar's end stood in the door's frame — 32·35·36·38·40판; 겹침 QA 10/19)
    decor: [D('clockposter', 'W', 1.6), D('clockposter', 'N', 2.5), D('door', 'W', -1.9)], friendAt: [.6, .9] },
  // 빨래방: coin washers, a change machine, a folding table, baskets
  laundry: { w: 5, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('washer3', 0, 0), F('washer3', 1, 0), F('washer3', 2, 0), F('vendcoin', 3, 0), F('magazinerack', 4, 0),
      F('foldingtable2', 1, 2), F('laundrybasket', 4, 3), F('stool', 3, 1), F('plant', 0, 4), F('laundrybasket', 0, 2)],
    decor: [D('clockposter', 'N', 2.0), D('window', 'W', .9), D('door', 'W', -1.3)], friendAt: [1.4, 1.4] },
  // 동네 카페: the coffee bar and pastry case, little tables, a chalk menu
  cafe: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('espresso', 0, 0), F('pastrycase', 2, 0), F('bookshelf', 4, 0, 0, { seed: 61 }), F('plant', 5, 0),
      F('cafetable', 1, 2), F('cafetable', 3, 2), F('cafetable', 1, 4), F('cafetable', 4, 4), F('magazinerack', 5, 2), F('rug', 2, 3)],
    decor: [D('menuboard', 'W', .5), D('clockposter', 'W', -2.2), D('door', 'W', -1.3), D('window', 'N', .5)], friendAt: [1.1, .4] },
  // 빌딩 로비: the elevator and mailboxes on the walls, a reception desk, a security gate, a sofa
  lobby: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 3.0,
    furniture: [F('plantbig', 0, 0), F('watercan', 5, 0), F('securitygate', 3, 1), F('lostfound', 5, 2),
      F('lobbysofa', 1, 3), F('reception', 3, 3), F('plantbig', 0, 4), F('rug', 0, 2)],
    // (the mailboxes hung 24 cm into the big plant in the corner — 61·66·69·70판: a little further along the wall; 겹침 QA 10/19)
    decor: [D('elevator', 'N', -1.5), D('noticeboard', 'N', 1.5), D('mailboxes2', 'W', .7), D('door', 'W', -1.6)], friendAt: [-.4, .6] },
  // 빌딩 옥상: a parapet round the back, the stair door, a water tank, AC units, washing on a line, a sun lounger
  rooftop: { w: 6, d: 5, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    furniture: [F('antenna', 3, 0), F('watertank', 4, 0), F('outdoorunit', 5, 0), F('outdoorunit', 5, 1),
      F('laundryline', 1, 2), F('deckchair', 3, 3), F('rooftopgarden', 0, 3), F('rooftopgarden', 0, 4), F('boxes', 5, 4)],
    decor: [D('rooftopdoor', 'N', -2.0)], friendAt: [.9, .1] },
  // 동네 뒷산 산길: pines, a pavilion, a spring, a little bridge over a stream, a lantern string, a hiker's tent
  trail: { w: 7, d: 6, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // grass on both sides of the dirt path that climbs from the stairs to the pavilion
    // (10/23 아트 점검 50-1: the signpost at (1,1) stood right in front of the pine at (0,0) — the tree seemed to grow out of its top; now (1,0), between the pines)
    floorZones: [{ i: 0, j: 0, w: 4, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' }, { i: 0, j: 4, w: 2, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' },
      { i: 5, j: 4, w: 2, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' }, { i: 6, j: 0, w: 1, d: 3, kind: 'grass', a: '#9fd27a', b: '#86c063' }],
    furniture: [F('pine2', 0, 0), F('pine2', 2, 0), F('pavilion', 4, 0), F('pine2', 6, 1), F('trailsign', 1, 0), F('rockpile', 3, 1),
      F('woodstairs', 0, 2), F('stonewall', 5, 2), F('stream', 2, 3), F('bridge', 3, 3), F('stream', 5, 3), F('spring', 6, 3),
      F('bench3', 1, 4), F('tentsmall', 0, 5), F('lanterns', 2, 5), F('backpack2', 4, 5), F('shrinebox', 5, 5), F('exerciser', 6, 5)],
    friendAt: [-2.0, .5] },
  // 보드킹의 스케이트 파크: the quarter-pipe on the back wall (its board rolls down when tapped), a painted wall and the
  // board rack beside it, a fun box and a rail in the open, cones and a bench at the front
  skatepark: { w: 7, d: 6, walls: { N: 'alleywall', W: 'fence', S: 'none', E: 'none' },
    furniture: [F('vending', 0, 0), F('quarterpipe', 2, 0), F('graffitiwall', 4, 0), F('boardrack', 6, 0), F('funbox', 1, 3), F('grindrail', 4, 3),
      F('cones', 6, 2), F('bench', 4, 5), F('trashbags', 0, 5), F('hydrant', 6, 5), F('cones', 0, 2)],
    friendAt: [3.2, 1.0] },
  // 둠칫이의 K-POP 무대: the stage on the back wall (its curtain is the colour lock — the fans' light-stick colours), a
  // speaker on each side, the photo-zone heart and the merch table on the flanks, the mic in front and rows of fan stools
  kpop: { w: 7, d: 6, walls: { N: 'alleywall', W: 'fence', S: 'none', E: 'none' },
    furniture: [F('speaker', 1, 0), F('kpopstage', 2, 0), F('speaker', 5, 0), F('vending', 6, 0), F('micstand', 3, 2),
      F('photoheart', 0, 2), F('merchtable', 5, 2), F('fanstool', 2, 4), F('fanstool', 3, 4), F('fanstool', 4, 4), F('fanstool', 2, 5), F('fanstool', 4, 5),
      F('cones', 0, 5), F('trashbags', 6, 5)],
    friendAt: [1.0, .5] },
  // 곰돌이의 몽글 미술관: the wave and the starry night on the back wall behind velvet ropes, 몽나리자 and the pearl-earring
  // bunny on the side wall, the bronze Thinker between them, a draped piece to unveil, an easel, crates, the guide desk
  museum: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 3.0,
    furniture: [F('rug', 2, 2), F('rug', 4, 2), F('easel', 0, 0), F('thinker', 3, 0), F('veiled', 6, 0), F('stanchion', 1, 1), F('stanchion', 4, 1),
      F('amphora', 1, 4), F('donutart', 6, 2), F('museumbench', 2, 4), F('artcrate', 6, 4), F('artcrate', 0, 5, 1), F('guidedesk', 4, 5, 2), F('plantbig', 6, 5)],   // (안내 데스크·작품 상자: 서랍과 자물쇠가 방 쪽을 보게 — user 10/19 "안내데스크도 벽 쪽으로 서랍이 열림")
    decor: [D('artwave', 'N', -1.6), D('artstars', 'N', 1.6), D('artlisa', 'W', 1.5), D('artpearl', 'W', -.6)],
    friendAt: [.4, -.3] },
  // 개굴이의 낚시터: a pond in the middle, the fishing platform on its north bank (the rod reaches over the water), a
  // tackle box and bait by the platform, reeds round the edge, a parasol seat and a cooler on the east bank
  fishing: { w: 7, d: 6, walls: { N: 'hedge', W: 'fence', S: 'none', E: 'none' },
    furniture: [F('pond', 2, 2), F('fishdock', 2, 1), F('tree', 0, 0), F('bench', 4, 0), F('fishsign', 6, 0), F('tacklebox', 1, 1), F('baitbucket', 4, 1),
      F('reeds', 5, 3), F('reeds', 1, 4), F('parasol', 6, 2), F('cooler', 6, 4), F('campchair', 0, 2), F('bush', 0, 5), F('picnic', 3, 5), F('reeds', 5, 5)],
    // (10/19 back to the first 3판: the stream came out again — user, after the redrafts: "처음걸로 되돌리고 아주 약간만 다듬어줘")
    friendAt: [1.6, 1.2] },
  // 개굴이의 기차역 (10/20 디자인, new 3판): the stopped train on its track along the back, the level crossing beside it; the
  // ticket window, coin lockers, a vending machine and an umbrella stand against the station wall; a timetable, a bench
  // under the cherry tree, 개굴이's burst fishing bag in the middle of the platform, the flower bed and the tap
  station: { w: 10, d: 5, slab: 'none', walls: { N: 'none', W: 'none', S: 'none', E: 'none' },   // (the look's rim is its ground: no cake slab)
    // (station C안 v5 10/20: long along the track like the picture — the stone platform along the back under the shelter
    // and the huge cherry tree, the track down the middle with the train in, the crossing road near the east end with a
    // barrier each side, flower fences and a garden along the front)
    floorZones: [{ i: 0, j: 2, w: 10, d: 1, kind: 'asphalt', a: '#b0a596', b: '#a3988a' }, { i: 8, j: 0, w: 1, d: 5, kind: 'sand', a: '#ecd7ae', b: '#e0c99c' }],
    // (수정 10/21, user "단차… 지저분하지 않게… 깔끔하고 디테일"): three levels — the stone platform with a pale nosing, the
    // track bed, the garden a step up from it behind a continuous fence; the platform things gathered round the shelter
    // (bags, can, 개굴이's bag), the strays (tap, umbrella stand) gone
    raised: [{ i: 0, j: 0, w: 8, d: 2, h: .4, kind: 'tile', a: '#f3ede6', b: '#e8e0d6', edge: '#c9bfae', trim: '#fbf6f0', stone: '#c9bfae', strip: '#f2c94c', step: false },
      { i: 0, j: 3, w: 8, d: 2, h: .12, kind: 'grass', a: '#9ad672', b: '#8fcf6a', edge: '#a98060', trim: '#d9c9a8', step: false }],
    furniture: [F('planter', 0, 0), F('platshelter', 2, 0), F('suitcases', 4, 1), F('tripbag', 6, 0), F('coinlocker', 7, 1), F('treesakura', 5, 0, 0, { big: true }), F('streetlamp', 7, 0),
      F('train', 1, 2, 0, { kerb: false }), F('crossing', 7, 3), F('crossing', 9, 1, 0, { flip: true }),
      F('flowerfence', 0, 3), F('flowerfence', 1, 3), F('flowerfence', 2, 3), F('flowerfence', 3, 3), F('flowerfence', 4, 3), F('flowerfence', 5, 3), F('flowerfence', 6, 3), F('bush', 9, 4)],
    // (개굴이 stands on the platform: 4,1 stays clear for it, story room 10/20)
    friendAt: [-.5, -.9] },
  // 개굴이의 호수 섬 (10/20 디자인, new 4판 — 3판 낚시터 다시): an island a step up out of the lake. The big tree in the
  // middle-back, the deck running out east over the water with the champion chair at its end (under the tree's crown),
  // the rod's platform on the north shore reaching out over the water, the rowboat pulled up on the south sand
  island: { w: 7, d: 6, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (island C안 10/20: the big tree with its swing at the back left, the cottage at the back right, a path of stepping
    // stones down to the deck at the front right with the boat tied to it; the reel's platform on the west shore. The four
    // corner cells are lake — look.js rounds the shore)
    // (C+D안 섞기 10/20, user: "역1, 섬 둘 다 괜찮은데 섞어도 괜찮을 듯": the lighthouse islet out over a rope bridge at the back
    // left, a picnic blanket with a parasol in the middle)
    // (수정 10/21): the tree on a grassy knoll a step up with a stone edge, the cottage on its stone plinth — two levels over
    // the lawn; the fishing things (tackle, bait, cooler) together by the reel's platform; open lawn kept round the picnic
    // (2차 10/21: the square tiers read boxy on a natural island — gone; the level change is the boulder shore itself)
    furniture: [F('bigtree', 1, 0), F('cottage', 4, 0), F('islet', 0, 1), F('fishdock', 0, 2, 3), F('tacklebox', 1, 3), F('baitbucket', 1, 4), F('cooler', 0, 4),
      F('picnicset', 3, 3), F('lakedeck', 5, 4), F('reeds', 4, 5), F('rocks', 6, 2)],
    friendAt: [2.0, .9] },
  // 빌라 옥상 정원 (10/21 디자인 시안, 18판 — 고른 그림 rooftop-a): sunset on a villa's roof. Low cream walls at the back,
  // an ivy-hung parapet along the front and the east side; the pyeongsang with a snack table and string lights at the back
  // left, the jars and the water tank at the back right, lettuce and chilli boxes in the middle, a drying rack and a tarp
  villaroof: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: .75, theme: THEMES.villaroof,
    // (수정 10/21): the pyeongsang corner on a raised wooden deck with a nosing; the garden boxes on a low brick bed along the
    // middle; the jars and tank together at the back right; loose pots cut to two
    raised: [{ i: 0, j: 0, w: 3, d: 3, h: .2, kind: 'planks', a: '#d9a466', b: '#c99456', edge: '#a8733f', trim: '#e9c28e', step: 'full' },
      { i: 3, j: 2, w: 3, d: 1, h: .16, kind: 'tile', a: '#c98a6a', b: '#b97a5a', edge: '#a86a4a', trim: '#e0a888', step: false }],
    furniture: [F('lightline', 0, 0), F('pyeongsang', 0, 1), F('snacktable', 2, 1), F('jangdok', 3, 0), F('watertank', 5, 0), F('wcan', 6, 0),
      F('foambox', 3, 2), F('foambox', 4, 2, 0, { kind: 'chili' }), F('foambox', 5, 2, 0, { kind: 'chili' }),
      F('plantbig', 0, 4), F('dryrack', 3, 4), F('tarppile', 5, 4),
      F('parapet', 0, 5, 0, { seed: 1 }), F('parapet', 2, 5, 0, { seed: 2 }), F('parapet', 4, 5, 0, { seed: 3 }), F('parapet', 6, 1, 1, { seed: 4 }), F('parapet', 6, 3, 1, { seed: 5 })],
    friendAt: [-1.2, .2] },
  // 동네 도서관 (10/21 디자인 시안, 17판 흑백 — 고른 그림 library-a): split level. The reading nook up a short stair at the
  // back left under the arched window; tall shelves on the back wall, the librarian's desk and the book drop on the right;
  // low shelves, the reading table and the book cart down in front
  library: { w: 7, d: 7, walls: { N: 'wall', W: 'wall' }, wallH: 3.0, panels: true, theme: THEMES.library,
    // (수정 10/21): three levels — the reading nook up its stair, the librarian's corner a step up with a pale nosing, the
    // reading floor; the shelves along the walls and one line of low shelves; plants cut to three
    raised: [{ i: 3, j: 0, w: 4, d: 3, h: .16, kind: 'planks', a: '#c98f58', b: '#b97f4c', edge: '#a8733f', trim: '#f0d3a8', step: 'full' }],
    furniture: [F('readingnook', 0, 0), F('plant', 2, 0), F('bookshelf', 3, 0, 0, { seed: 41 }), F('bookshelf', 4, 0, 0, { seed: 43 }), F('bookshelf', 5, 0, 0, { seed: 47 }), F('bookshelf', 6, 0, 0, { seed: 53 }),
      F('libladder', 5, 1), F('bookshelf', 0, 3, 1, { seed: 49 }), F('libdesk', 3, 2), F('bookdrop', 6, 2),
      F('libshelf', 1, 4, 0, { seed: 2 }), F('libshelf', 2, 4, 0, { seed: 1 }), F('libshelf', 3, 4, 0, { seed: 4 }),
      F('readtable', 2, 6), F('bookcart', 5, 5), F('plant', 6, 6)],
    decor: [D('archwindow', 'W', -1.9), D('clock', 'N', -.4)], friendAt: [-.8, .4] },
  // 아파트 1층 현관 (10/21 디자인 시안, 13판 — 고른 그림 aptlobby-a): moving day. Cream marble walls and floor; the elevator
  // and a picture on the back wall, the mailboxes over a bench on the left; boxes, a padlocked box and a hand truck; the
  // glass entrance down the east side with its door open, the moving truck's open back outside on the pavement; a low
  // cream ledge along the front
  aptlobby: { w: 8, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 3.0, panels: true, theme: THEMES.aptlobby,
    // (수정 10/21, user "단차… 지저분하지 않게… 깔끔하고 디테일"): the lobby is a step up from the entry strip by the glass and
    // the front ledge, with a pale nosing; the boxes in one heap in the front-left corner and one by the truck; the
    // elevator between two plants; open floor kept in the middle
    raised: [{ i: 0, j: 0, w: 5, d: 5, h: .18, kind: 'tile', a: '#f4efea', b: '#e7e0d8', edge: '#d6ccbf', trim: '#fbf8f4', step: 'full' }],
    floorZones: [{ i: 6, j: 0, w: 2, d: 6, kind: 'brickpave', a: '#cfd2da', b: '#c2c6cf' }],
    furniture: [F('plant', 1, 0), F('plant', 4, 0), F('bench', 0, 2, 1),
      F('boxpile', 0, 4), F('lockbox', 1, 4), F('boxes', 1, 3),
      F('dolly', 5, 3), F('glassentry', 6, 1), F('movetruck', 6, 0), F('boxstack', 7, 4), F('planter', 7, 2, 1), F('lowwall', 0, 5), F('lowwall', 2, 5)],
    decor: [D('elevator', 'N', -1.0), D('picture', 'N', 1.4), D('mailboxes2', 'W', -.4)], friendAt: [-.6, .4] },
  // 바닷가 가게 (10/20 밤 디자인 시안, user ref): the shallows and the deck on stilts at the back left with a boat in front of
  // it, the white clapboard shop at the back middle, a sand strip down the middle, the cobbled square at the right and
  // front with a seafood stall, barrels, parasol tables, the chalkboard, and the life-ring clock post by the deck
  seaside: { w: 8, d: 7, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    floorZones: [{ i: 0, j: 0, w: 3, d: 5, kind: 'water', a: '#7fd3e8', b: '#6cc6de' }, { i: 0, j: 5, w: 3, d: 2, kind: 'sand', a: '#efd9ae', b: '#e6cd9c' }, { i: 3, j: 2, w: 1, d: 5, kind: 'sand', a: '#efd9ae', b: '#e6cd9c' }],
    // (수정 10/21): the shop stands on a stone plinth a step up from the square with a pale nosing; the square's things
    // gathered — the stall with its barrels, the two parasol tables together on the east side; one barrel group, not two
    // (2차 10/21): the square is a quay a step above the sand, its edge a stone wall with ivy; the shop a step above that
    raised: [{ i: 3, j: 0, w: 5, d: 2, h: .42, kind: 'tile', a: '#e9e6e2', b: '#dcd8d2', edge: '#bfb8ae', trim: '#f6f3ee', stone: '#c9c2b6', step: false },
      { i: 4, j: 2, w: 4, d: 5, h: .26, kind: 'tile', a: '#dfe2e8', b: '#cfd3db', edge: '#b9b3a8', trim: '#eef0f4', stone: '#c9c2b6', step: false }],
    furniture: [F('seadeck', 0, 0), F('seashop', 3, 0), F('chalksign', 7, 1), F('plantbig', 7, 0), F('ringpost', 3, 2), F('streetlamp', 7, 2),
      F('fishstall', 4, 4), F('barrels', 6, 3), F('cafeumbrella', 6, 6), F('cafeumbrella', 7, 5), F('planter', 4, 6)],
    friendAt: [1.0, 1.0] },
  // 18판 너굴이네 복층 (otakuloft, 10/21 — 시안 A + 서랍 계단; 사용자 "현실적인 복층 … 원룸같이 디테일한 방", 15판 원룸이 통과 기준): a
  // real duplex studio on a rainy night. A mezzanine on posts over the back left (futon between comic shelves, the PC desk,
  // the drying rack, a reading nest), drawer stairs up to it, a basket pulley at its rail; under it the clear plastic drawers, the game
  // shelf, the little fridge and the parcels; three retro arcade cabinets along the back right (the red one gives prizes);
  // along the west wall the CRT and its consoles under a rainy window, the shoe cabinet and the door; the comic shelf with the
  // red volume up on the mezzanine; the figure case and the trash on the east; rug, beanbag and floor table with noodles in front; the middle clear
  otakuloft: { w: 7, d: 6, bleed: {}, wallH: 3.3, walls: { N: 'wall', W: 'wall' }, homeShift: [.5, -.5],
    lofts: [{ i: 0, j: 0, w: 4, d: 2, y: 1.65, ladder: 'stairs', ladderAt: 1.5 }],
    furniture: [LF('otakufuton', 0, 0, 0, null, 1.65), LF('mangashelf', 1, 0, 0, { h: 1.45, seed: 4, secret: true }, 1.65), LF('pcdesk', 2, 0, 0, null, 1.65), LF('figurecase', 3, 0, 0, { h: 1.35 }, 1.65),
      LF('dryrack', 2, 1, 0, null, 1.65), LF('loftnest', 1, 1, 0, null, 1.65),
      F('pdrawers', 0, 0), F('gamerack', 1, 0), F('boxstack', 2, 0), F('mangashelf', 3, 0, 0, { h: 1.2, seed: 11 }), F('laundrybasket', 0, 1),
      F('drawerstairs', 3, 2), F('loftpulley', 2, 2),
      F('arcade3', 4, 0, 0, { kind: 0, prize: true, tilt: -.22 }), F('arcade3', 5, 0, 0, { kind: 1, tilt: -.22 }), F('arcade3', 6, 0, 0, { kind: 2, tilt: -.22, gap: false }),
      F('crtset', 0, 2, 1), F('shoerack', 0, 4, 1),
      F('rug', 1, 2), F('beanbag', 1, 3), F('foldtable', 2, 3), F('floormess', 2, 4, 0, { kind: 1 }),
      F('gamerack', 6, 2), F('minifridge', 6, 3), F('plant', 6, 4), F('trash', 5, 5), F('parcel', 4, 5)],
    decor: [D('rainwin', 'W', -1.0, { y: .45 }), D('rainwin', 'W', .6, { y: .45 }), D('otakuposter', 'N', -2.6, { kind: 0, y: 2.55 }), D('otakuposter', 'N', -.9, { kind: 1, y: 2.55 }),
      D('otakuposter', 'N', 2.9, { kind: 2, y: 2.45 }), D('fairylights', 'N', 2.0, { len: 3, y: 2.95 }), D('fairylights', 'W', -1.5, { len: 3, y: 3.05 }), D('door', 'W', -2.5), D('aircon2', 'N', .9),
      D('otakushelf', 'W', 2.2, { y: 2.4 }), D('otakuframes', 'N', 1.9, { y: 2.3 })],
    friendAt: [1.4, .6] },
  // 원룸: a Korean one-room — loft bed over a desk, a mini kitchen, a washer by the door, a clothes rail
  oneroom: { w: 6, d: 5, bleed: {}, wallH: 2.9, walls: { N: 'wall', W: 'wall' },
    furniture: [F('loftbed', 0, 0), F('hanger', 2, 0), F('minikitchen', 3, 0), F('minifridge', 5, 0),
      F('mirror2', 0, 2, 1), F('rug', 1, 2), F('foldtable', 2, 2), F('beanbag', 1, 3), F('pcdesk', 3, 3),
      F('plantshelf', 1, 4), F('ricecooker', 5, 2), F('shoerack', 5, 3), F('washer2', 5, 4), F('laundrybasket', 4, 4)],
    decor: [D('curtainwin', 'W', 1.2), D('posterwall', 'W', -.6), D('door', 'W', -1.9), D('aircon2', 'N', 2.5)], friendAt: [-.6, .6] },
  // 단지 놀이터 (concept I): the 103동 wall at the back, a slide tower, swings, a sandbox, a pavilion, the ice-cream cart
  playground: { w: 7, d: 6, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    floorZones: [{ i: 1, j: 2, w: 4, d: 2, kind: 'sand', a: '#f3dca6', b: '#e6c98a' }],
    furniture: [F('aptwall', 0, 0), F('bikeshelter', 2, 0), F('recyclebins', 4, 0), F('noticeboard2', 6, 0),
      F('slidetower', 1, 1), F('swings2', 3, 2), F('springrider', 5, 2), F('catfeeder', 6, 1),
      F('sandbox2', 0, 3), F('seesaw2', 2, 4), F('hopscotch', 4, 3), F('streetlamp2', 6, 3),
      F('icecart', 0, 5), F('picnic2', 3, 5), F('bbqgrill', 5, 5), F('planter', 5, 4)],
    friendAt: [1.7, .9] },
  catstory: { furniture: [F('fridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('fishtank', 4, 0),
      F('cattower', 0, 1, 1), F('catbed', 0, 2, 1), F('yarnbasket', 0, 3, 1), F('catbowls', 0, 4, 1),
      F('kitchentable', 2, 2), F('stool2', 2, 1), F('stool2', 3, 3, 2), F('trash', 4, 2), F('plant', 4, 4)],
    decor: [D('wallrack', 'N', -.5), D('clock', 'N', 2.0), D('puzzleframe', 'W', -.5), D('window', 'E', 0)], door: { wall: 'S', u: -1.2 }, friendAt: [1.5, .9] },
  my: { furniture: [F('bed', 0, 0, 0), F('drawers', 1, 0), F('plant', 4, 0), F('chest', 0, 3, 1), F('rug', 2, 2)],
    decor: [D('picture', 'N', -2.0), D('window', 'N', .6), D('clock', 'W', 0)], door: { wall: 'E', u: 0 } },
  // ── 골목길: plaster-and-brick walls at the back, open towards the camera
  alley1: { walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    furniture: [F('vending', 2, 0), F('pole', 3, 0), F('aircon', 4, 0), F('jangdok', 0, 2, 1), F('daeya', 1, 2), F('garden', 3, 2), F('pyeongsang', 1, 4), F('trashbags', 4, 4), F('bike', 3, 3, 2)],
    decor: [D('gate', 'N', -1.45), D('mailbox', 'W', 1.0)], friendAt: [2.0, -1.0] },
  alley2: { walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    furniture: [F('stairs', 0, 0), F('vending', 3, 0), F('aircon', 4, 0), F('daeya', 2, 1), F('garden', 0, 2, 1), F('trashbags', 0, 4), F('pyeongsang', 2, 2), F('bike', 1, 3), F('jangdok', 2, 4), F('pole', 4, 4)],
    decor: [D('mailbox', 'N', 0)], friendAt: [2.0, 0] },
  alley3: { walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    furniture: [F('vending', 0, 0), F('shopfront', 1, 0), F('bike', 2, 1), F('pole', 4, 1), F('jangdok', 0, 2, 1), F('clothesline', 3, 2), F('pyeongsang', 1, 3), F('trashbags', 0, 4), F('garden', 2, 4), F('daeya', 4, 4)],
    decor: [D('gate', 'N', 1.5), D('mailbox', 'W', 1.0)], friendAt: [2.0, 1.0] },
  // ── 공원: picket fence and a flowering hedge
  // the three parks each have their own thing (10/17: they were the same nine pieces shuffled): 개굴이's is the
  // playground, 다람이's has a pond, 햄찌's is a picnic yard
  // (10/19 겹침 QA, user "미끄럼틀 뚫는 부분 정리": the tree stood on both of the tower's landings and the lost-property box on the
  // climbing wall's foot — tree (0,2)→(1,3), box (2,0)→(2,1))
  park1: { walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
    furniture: [F('slidetower', 0, 0), F('lostbox', 2, 1), F('swings2', 3, 0), F('tree', 1, 3), F('springrider', 2, 2), F('sandbox2', 3, 2), F('hopscotch', 0, 3), F('bench', 1, 4), F('parkbin', 4, 4)], friendAt: [-.4, .6] },
  park2: { walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
    furniture: [F('bench', 0, 0), F('tree', 3, 0), F('streetlamp2', 4, 0), F('picnic', 0, 2), F('pond', 1, 1), F('reeds', 4, 2), F('lostbox', 4, 3), F('bush', 0, 4), F('planter', 2, 4), F('parkbin', 4, 4)], friendAt: [2.0, -1.3] },
  park3: { walls: { N: 'hedge', W: 'fence', S: 'none', E: 'none' },
    furniture: [F('planter', 0, 0), F('bush', 2, 0), F('tree', 3, 0), F('parkbin', 4, 0), F('picnic', 0, 2), F('picnic2', 1, 2), F('bbqgrill', 3, 2), F('lostbox', 4, 2), F('noticeboard2', 0, 4), F('catfeeder', 1, 4), F('icecart', 3, 4)], friendAt: [0, -1.3] },
  // ── 산 캠핑장: rocky ledge behind, dirt clearing in front
  camp1: { walls: { N: 'cliff', W: 'cliff', S: 'none', E: 'none' },
    furniture: [F('tent', 0, 0), F('pine', 2, 0), F('firewood', 3, 0), F('log', 0, 2, 1), F('lantern', 2, 2), F('campchair', 3, 2), F('cooler', 4, 2), F('rock', 1, 4), F('mushrooms', 4, 4), F('trunk', 1, 2)], friendAt: [2.0, 1.0] },
  camp2: { walls: { N: 'cliff', W: 'cliff', S: 'none', E: 'none' },
    furniture: [F('pine', 0, 0), F('tent', 1, 0), F('pine', 3, 0), F('rock', 4, 0), F('firewood', 0, 2, 1), F('lantern', 2, 2), F('campchair', 3, 2), F('cooler', 4, 2), F('mushrooms', 0, 4), F('log', 1, 4), F('rock', 4, 4), F('trunk', 1, 2)], friendAt: [1.0, 1.0] },
  camp3: { walls: { N: 'cliff', W: 'cliff', S: 'none', E: 'none' },
    furniture: [F('firewood', 0, 0), F('pine', 2, 0), F('tent', 3, 0), F('pine', 0, 1), F('lantern', 0, 2), F('campchair', 1, 2), F('log', 3, 2), F('cooler', 0, 4), F('rock', 2, 4), F('mushrooms', 4, 4), F('trunk', 2, 1)], friendAt: [2.0, 1.0] },
};

// ── Bigger maps: several rooms joined by doorways or stacked in floors (see src/map.js). Room-local tiles are
// 0..w-1 / 0..d-1 as in LAYOUTS; `at` is the room centre in the map; friendAt is in map coordinates [x, z, level].
const RM = (theme, w, d, extra) => ({ w, d, theme: THEMES[theme], ...extra });
THEMES.bear2 = { ...THEMES.bear, name: '곰돌이네 집 (거실·부엌)' };
// 2판 토순이 다락 놀이방 (10/20, GPT 컨셉 bunnyattic-a·b; 사용자 "그냥 보기에 ㅈㄴ 이쁘면 됨"): a playroom under the roof — the
// walls' tops slope up to the back corner (attic), honey planks, blush stripes over a sage wainscot, pink · sage · carrot ·
// lilac; the loft bed (the tilt lesson's curtain, tiers.js) along the back wall, a round window over a window seat with two
// drawers (the drawer lesson), a teepee, a toy trunk, a cloud rug with a train, a dollhouse (gfx/bunnyattic-props.js)
THEMES.bunnyattic = { ...THEMES.bunny, name: '토순이네 다락 놀이방', bg: ['#f6e6ee', '#ecd6e2'], base: '#e2b48a',
  floorKind: 'planks', floor: '#e6b47c', floor2: '#c99059', wallKind: 'stripe', wall: '#fff4ee', wall2: '#fbe6e2', wainscot: '#cfe3c8', trim: '#ffffff', wallEdge: '#fffaf6',
  wood: '#f2c48c', woodD: '#c98d55', beam: '#b97a48', body: '#fff8f1', accent: '#ff9fb0', accent2: '#9ed3b4', accent3: '#ffb347', knob: '#ffd84a',
  fabric: '#ffc2cc', fabric2: '#ffe4e8', curtain: '#ffd0d6', rug: '#fff6ea', rug2: '#ffc2cc', lilac: '#c9b6f2', sage: '#a9cf9c', pillow: '#fff3d6', sheet: '#ffffff',
  quilt: '#ff9fb0', duvet: '#ffc2cc' };
// (10/21 사용자 "ㅇㅇ 괜춘": v1 under a real gable — ridge and rafters over the back; the plain sloped v1 stays as bunnyattic1)
LAYOUTS.bunnyattic = { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.3, attic: { rise: 1.5, gable: true },
  lofts: [{ i: 3, j: 0, w: 3, d: 2, y: 1.45, ladder: 'S', ladderAt: -.7, curtainColor: '#ffd0d6' }],
  furniture: [LF('futon', 4, 0, 1, null, 1.45), F('dollhouse', 0, 0), F('plant', 1, 0), F('toybasket', 2, 0), F('cushionpile', 3, 0), F('toytrunk', 4, 0), F('lowshelf', 5, 0),
    F('windowseat', 0, 1, 1), F('bookrack', 0, 3, 1), F('cloudrug', 1, 2), F('bunnytent', 5, 2), F('rockhorse', 4, 4, 3)],
  decor: [D('roundwin', 'W', .5), D('bunnyframes', 'W', -1.0), D('bunting', 'N', -1.3)], friendAt: [1.0, 1.4],
  sun: [{ from: [-3, -1.1, -3, .1], dir: [2.4, .9] }] };
// 6판 곰돌이 빵 굽는 부엌 (10/20, GPT 컨셉 bearbakery-a·b): a little bakery kitchen bent round a peninsula — honey herringbone
// in the dining corner, cream-and-sage tiles in the kitchen running round to the door (two floors, an L), cream walls over a
// sage wainscot, red gingham, brick, bread; the brick dome oven is type 'stove' (6판's pancake smoke, script.js ifMap), the
// bread cabinet locks (the key lesson) (gfx/bearbakery-props.js)
THEMES.bearbakery = { ...THEMES.bear, name: '곰제과', bg: ['#f7ecd8', '#efdfc4'], base: '#d9b48a',
  floorKind: 'herring', floor: '#e6b37c', floor2: '#cf9a62', wallKind: 'dots', wall: '#fff8ec', wall2: '#f6e8cf', wainscot: '#a9c9a0', trim: '#ffffff', wallEdge: '#fffbf3',
  wood: '#efc07f', woodD: '#c4874d', body: '#fffaf0', sage: '#a9c9a0', sage2: '#8fb787', brick: '#d97a5c', brick2: '#b95f45', cloth: '#e8574a', top: '#f6dfb6',
  accent: '#e8574a', accent2: '#a9c9a0', accent3: '#ffd25c', knob: '#e8b84a', fabric: '#e8574a', fabric2: '#fbd9cf', curtain: '#e8574a', rug: '#fff3dc', rug2: '#e8574a' };
// 곰제과 앞마당 (10/20 밤, 사용자가 보낸 바닷가 가게 그림에서 예쁜 점만 — 흰 판자 · 줄무늬 차양 · 앞마당 좌판 · 파라솔): pale stone
// paving in front of the shop's white clapboard face
THEMES.bakeyard = { ...THEMES.bearbakery, name: '곰제과 앞마당', floorKind: 'hex', floor: '#ebe6dd', floor2: '#d3cbbd', base: '#cfc8bb',
  wallKind: 'plain', wall: '#fbf8f2', wall2: '#fbf8f2', wainscot: '#fbf8f2', wallEdge: '#ffffff' };
// 20판 토순이네 빌라 옥상 집들이 (10/21 스토리 룸 '기차 여행 편', 앞 버전은 villaroof 그대로): pennants under the string lights,
// a cake and a present on the snack table, a bunch of balloons in the deck's back corner — the rest of the roof as it is
// (20판 2차 10/21, 레퍼런스 보드 villaroof-refs-1021): the 옥탑방 in the back right corner with the yellow tank on its roof (the
// blue tank and the watering can go — 한적함; the two parapets on the right move down a cell), red and black rubber tubs for the chilli
// boxes, the quilt on a clothesline for the drying rack, the parasol and red chairs for the big pot; the jars stay (devices)
LAYOUTS.villaroof2 = { ...LAYOUTS.villaroof, walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' }, furniture: [F('lightline', 0, 0, 0, { party: true }), F('pyeongsang', 0, 1), F('snacktable', 2, 1, 0, { party: true }), F('balloons', 2, 0), F('jangdok', 3, 0),
  F('oktap', 5, 0), F('foambox', 3, 2), F('rubbertub', 4, 2), F('rubbertub', 5, 2, 0, { kind: 'onion' }),
  F('parasolset', 0, 4), F('roofline', 3, 4), F('chilimat', 5, 4), F('potrow', 0, 2), F('rooftap', 3, 1),
  F('parapet', 0, 5, 0, { seed: 1, extL: -.07 }), F('parapet', 2, 5, 0, { seed: 2 }), F('parapet', 4, 5, 0, { seed: 3, extR: .74 }), F('parapet', 6, 2, 1, { seed: 4, extR: .55, postR: true }), F('parapet', 6, 4, 1, { seed: 5 })] };
// (20판 3차 2판 10/21, user: "옥상은 테두리 더 좀 이상함.. 식물 막 벽 뚫고"): no S / E wall — the ivy parapet itself is the roof's
// front and side edge (a low wall stood behind it and the ivy grew through it); the runs meet at the front-right corner and
// the side run reaches the 옥탑방, so the edge is closed all round
// (20판 3차 10/21, user: "대체 저 파란 건 대체 뭘까 … 디테일 잡자"): the blue tarp pile gives way to chillies drying on a straw mat;
// pots along the deck's edge and the rooftop tap with its hose and bucket in front of the jars — the middle of the roof stays open
THEMES.villaroof2 = THEMES.villaroof;
// 현관 2차 (10/21, 앞 버전은 aptlobby 그대로): a little more of an apartment lobby's life on the walls —
// the notice board by the bench, the red fire-hose cabinet in the corner, a clock by the elevator (a rug read as a living room)
THEMES.aptlobby2 = THEMES.aptlobby;
LAYOUTS.aptlobby2 = { ...LAYOUTS.aptlobby, decor: [...LAYOUTS.aptlobby.decor, D('noticeboard', 'W', 1.7), D('firebox', 'N', -3.5), D('clock', 'N', .25)] };
// 28판 기차 객실 (10/21 기차 여행 편 ★장치판, 고른 그림 gpt-FINAL-B2+B1, 스토리 룸 장면 traincarInc): half a carriage — the
// window wall (W) with three sea windows (one under a roll blind), the rail, handles, luggage net and fan over the benches; the
// end wall (N) with the sliding door to the next car; navy benches down both sides (one with a drawer), a snack cart in the aisle
THEMES.traincar = { ...THEMES.my, friend: 'raccoon', name: '기차 객실', bg: ['#cfe8fa', '#eaf5fd'], base: '#dfe6ee',
  floorKind: 'tile', floor: '#efe4cc', floor2: '#e8dcc2', wallKind: 'plain', wall: '#f6ecd8', wall2: '#f6ecd8', wainscot: '#e9dcc0', trim: '#cfd3db', wallEdge: '#f9f2e4' };
LAYOUTS.traincar = { w: 4, d: 8, walls: { N: 'wall', W: 'wall' }, wallH: 2.8, theme: THEMES.traincar,
  furniture: [F('tbench', 0, 0, 1), F('tbench', 0, 2, 1, { stuff: true }), F('tbench', 0, 4, 1), F('tbench', 0, 6, 1),
    F('tbench', 3, 2, 3), F('tbench', 3, 4, 3, { drawer: true }), F('tbench', 3, 6, 3), F('tcart', 1, 4)],
  decor: [D('twindow', 'W', -2.6, { blind: true }), D('twindow', 'W', -.3), D('twindow', 'W', 2.0), D('trailrack', 'W', 0), D('tdoorend', 'N', .3)],
  friendAt: [.2, 1.6] };
// 28판 기차 객실 2차 (10/21 검토 "그림과 차이가 커서 2차" + 사용자 "디테일 … 지하철 광고도 좀 빼곡하게"): shorter and wider (5×7),
// seen side-on like the picture (yaw: the window wall faces you, the door wall at the right back), cream floor; benches down
// both long sides with the aisle clear, the car body's cut ends and wheels (tshell), the walls and the top busy with little
// things (trailrack2), the floor empty
THEMES.traincar2 = { ...THEMES.traincar, floorKind: 'carpet', floor: '#f3e9d2', floor2: '#ece0c6', wall: '#f8efdc', wall2: '#f8efdc', wainscot: '#ecdfc4' };
LAYOUTS.traincar2 = { w: 5, d: 7, walls: { N: 'wall', W: 'wall' }, wallH: 3.0, yaw: 1.1, fitW: 7.8, theme: THEMES.traincar2,
  // (② 10/21: the drawer bench faces the start view now — on the far side its drawer showed only from behind the car)
  furniture: [F('tbench2', 0, 1, 1, { stuff: 'paper' }), F('tbench2', 0, 3, 1, { drawer: true }), F('tbench2', 0, 5, 1, { stuff: 'bag' }),
    F('tbench2', 4, 1, 3), F('tbench2', 4, 3, 3), F('tbench2', 4, 5, 3, { stuff: 'toy', priority: true }), F('tcart2', 2, 4)],
  decor: [D('tshell', 'W', 0, { len: 7, width: 5 }), D('twindow2', 'W', -2.3, { blind: true }), D('twindow2', 'W', 0, { paw: true }), D('twindow2', 'W', 2.3),
    D('trailrack2', 'W', 0), D('tdoorend2', 'N', 0)], friendAt: [.2, 1.6] };
// 28판 기차 객실 3차 (10/22, 사용자 "기차는 가로로 더 긴 형태여야 될 듯. 뒤에 구름 배경 빼고 창문으로 풍경은 계속 앞으로 가는 것처럼"):
// traincar2's car made long like a real carriage (12 long, the same 5 wide) — five windows down the window wall with the
// landscape sliding past in each (twindow2 o.flow), two rows of five benches, the rail and the racks run the whole length, the
// snack cart in the middle of the aisle; seen at a slant along its length on a tall screen; a calm dark slate behind the car
// (no sky — look.js RECIPES.traincar3), and now and then the car gives a little rock (tshell o.jolt). The pieces, their parts
// and places keep traincar2's names (② 10/22).
THEMES.traincar3 = { ...THEMES.traincar2, bg: ['#323b56', '#3b4664'] };
LAYOUTS.traincar3 = { w: 5, d: 12, walls: { N: 'wall', W: 'wall' }, wallH: 3.0, yaw: .7, fitW: 10.8, theme: THEMES.traincar3,
  furniture: [F('tbench2', 0, 1, 1, { stuff: 'paper' }), F('tbench2', 0, 3, 1, { drawer: true }), F('tbench2', 0, 5, 1, { stuff: 'bag' }), F('tbench2', 0, 7, 1), F('tbench2', 0, 9, 1, { stuff: 'paper' }),
    F('tbench2', 4, 1, 3), F('tbench2', 4, 3, 3), F('tbench2', 4, 5, 3, { stuff: 'toy', priority: true }), F('tbench2', 4, 7, 3, { stuff: 'bag' }), F('tbench2', 4, 9, 3),
    F('tcart2', 2, 6)],
  decor: [D('tshell', 'W', 0, { len: 12, width: 5, jolt: true }), D('twindow2', 'W', -4.6, { flow: true }), D('twindow2', 'W', -2.3, { blind: true, flow: true }), D('twindow2', 'W', 0, { paw: true, flow: true }),
    D('twindow2', 'W', 2.3, { flow: true }), D('twindow2', 'W', 4.6, { flow: true }), D('trailrack2', 'W', 0, { len: 11.8 }), D('tdoorend2', 'N', 0)], friendAt: [.2, 1.6] };
// 섬 3차 (10/21): the same island, a tidier shore (look.js RECIPES.island2) — island stays as the user saw it
THEMES.island2 = THEMES.island;
LAYOUTS.island2 = LAYOUTS.island;
// 다락 v1 박공 없이 (10/20~21의 경사 벽 그대로 — 후보로 남겨 둠)
THEMES.bunnyattic1 = THEMES.bunnyattic;
LAYOUTS.bunnyattic1 = { ...LAYOUTS.bunnyattic, attic: { rise: 1.6 } };
THEMES.bunnyattic2 = { ...THEMES.bunnyattic, wall: '#fff5ef', wall2: '#fbece7' };
// 다락 v2 (10/21 단차·정리 — 사용자는 v1을 더 좋아함: "토순이도 앞버전이 더 낫다"; 후보로 남겨 둠)
LAYOUTS.bunnyattic2 = { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.3, attic: { rise: 1.6 },
  lofts: [{ i: 3, j: 0, w: 3, d: 2, y: 1.45, ladder: 'S', ladderAt: -.7, curtainColor: '#ffd0d6' }],
  // (10/21 사용자 "단차 … 정리"): the window side a step up — a pale board platform with a nosing and two stairs
  raised: [{ i: 0, j: 1, w: 1, d: 3, h: .3, kind: 'planks', a: '#f3d2a6', b: '#e2b884', edge: '#f6e6d6', nose: '#c98d55', plinth: '#a87452', stairs: [{ side: 'E', at: .4, w: .9 }] }],
  furniture: [LF('futon', 4, 0, 1, null, 1.45), F('plant', 0, 0), F('toybasket', 1, 0), F('lowshelf', 3, 0), F('toytrunk', 4, 0), F('cushionpile', 5, 0),
    F('windowseat', 0, 1, 1), F('bookrack', 0, 3, 1), F('atticswing', 2, 1), F('cloudrug', 1, 2), F('dollhouse', 5, 3)],
  decor: [{ ...D('roundwin', 'W', .5, { cy: 2.06 }) }, D('bunnyframes', 'W', -1.0), D('bunting', 'N', -1.3)], friendAt: [1.0, 1.4],
  sun: [{ from: [-3, -1.1, -3, .1], dir: [2.4, .9] }] };
// 곰제과 v2 (10/21 — 사용자는 v1 맵을 더 좋아함: "이게 더 좋은데"; v2는 bearbakery2로 남겨 둠), 사용자 "단차 … 지저분하지 않게 정리 … 깔끔하고 디테일해야"; 기준 GPT bearbakery-c): one shop on three levels —
// the kitchen up on a tiled platform at the back (oven, counter, sink, the locking bread cabinet; stairs down), a booth on a
// lower wooden step at the right, the shop floor in front (the glass bread case, the register, bread racks on the wall), the
// shop's low front window with its striped awning at the front edge, the 현관 a step down at the corner
THEMES.bearbakery2 = { ...THEMES.bearbakery, name: '곰제과', floorKind: 'planks', floor: '#e2ad74', floor2: '#c99059', wallKind: 'plain' };
LAYOUTS.bearbakery2 = { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 2.9, cut: [{ i: 6, j: 5, w: 1, d: 1 }],
  raised: [
    { i: 0, j: 0, w: 5, d: 2, h: .45, kind: 'smalltile', a: '#fbf6ea', b: '#d7e6cc', edge: '#e6d6bb', nose: '#c4874d', plinth: '#9a7656', stairs: [{ side: 'S', at: -1.5, w: 1.1 }] },
    { i: 5, j: 0, w: 2, d: 3, h: .25, kind: 'herring', a: '#e6b37c', b: '#cf9a62', edge: '#efe3cc', nose: '#c4874d', plinth: '#9a7656', stairs: [{ side: 'S', at: 0, w: 1 }] }],
  furniture: [F('stove', 0, 0), F('bakecounter', 2, 0), F('bakesink', 3, 0), F('breadcab', 4, 0), F('bakeisland', 2, 1), F('floursacks', 4, 1),
    F('bkbooth', 5, 0), F('plant', 6, 2),
    F('bkrack', 0, 3, 1), F('bkrack', 0, 4, 1), F('bkcase', 2, 3), F('bkregister', 4, 3), F('bkfront', 0, 5)],
  decor: [{ ...D('bakejars', 'N', -1.3), dy: .45 }, { ...D('potrail', 'N', .35), dy: .45 }, D('ginghamwin', 'W', .85)],
  friendAt: [0, -.4], sun: [{ from: [-3.5, -1.5, -3.5, -.2], dir: [2.4, 1.0] }] };
THEMES.bunny2 = { ...THEMES.bunny, name: '토순이네 침실과 놀이방' };
THEMES.house2f = { ...THEMES.peng, name: '펭펭이네 2층집' };
THEMES.alleywide = { ...THEMES.alley1, name: '골목 상가 거리' };
THEMES.cabin = { ...THEMES.camp1, name: '판다네 통나무 오두막', friend: 'panda', bg: ['#e9ecff', '#dcefe6'] };
THEMES.duplex = { ...THEMES.my, name: '햄찌네 복층 원룸', friend: 'hamster', bg: ['#fff4e6', '#f3e6d6'] };
// 동네 공공장소 (10/18): the apartment region's police box, classroom and fire station
THEMES.police = { ...THEMES.my, name: '멍뭉이 순경의 파출소', friend: 'shiba', bg: ['#eef3fb', '#dfe7f6'], floorKind: 'checker', floor: '#eef2fa', floor2: '#cbd7ee', base: '#b9c6e0',
  wallKind: 'stripe', wall: '#f4f7fd', wall2: '#dbe5f6', wainscot: '#3f6fd8', trim: '#ffffff', wallEdge: '#fafcff', accent: '#3f6fd8', accent2: '#ffd23f', accent3: '#ff8f7a', locker: '#7fa8e8' };
THEMES.school = { ...THEMES.my, name: '토순이네 교실', friend: 'bunny', bg: ['#fff8e8', '#eef4dc'], floorKind: 'planks', floor: '#d9a86b', floor2: '#b9824a', base: '#c99a6b',
  wallKind: 'stripe', wall: '#fffaf0', wall2: '#e8f0d6', wainscot: '#8fc98a', trim: '#ffffff', wallEdge: '#fffdf6', accent: '#8fc98a', accent2: '#ffb35c', accent3: '#8fd3f4', locker: '#ffb35c' };
THEMES.fire = { ...THEMES.my, name: '곰돌이 소방서', friend: 'bear', bg: ['#fff1ea', '#f6e2d8'], floorKind: 'checker', floor: '#d4d7de', floor2: '#c2c5ce', base: '#b9bcc6',
  wallKind: 'stripe', wall: '#fff6f0', wall2: '#f6d6c8', wainscot: '#e8433d', trim: '#ffffff', wallEdge: '#fffaf6', accent: '#e8433d', accent2: '#ffd23f', accent3: '#8fd3f4', locker: '#e86a5d' };
// outside: the fire station's apron and the police box's front (user, 10/18: "소방서는 실외로… 경찰서도 실외", "경찰서는 실내 실외 다 쓰자")
THEMES.firestation = OUT('곰돌이네 119 안전센터', 'bear', ['#fff1ea', '#f1e6e0'], { ...ALLEY, wallKind: 'brick', wall: '#f09a84', wall2: '#de7c69', wainscot: '#c9ccd8', trim: '#f4f4ec', wallEdge: '#f6d6c8', plaster: '#f6ecef' });   // (19판 3차 10/21 "어둡고 우울": lighter, warmer brick, a pale plinth)
THEMES.policefront = OUT('멍뭉이 순경의 파출소 앞', 'shiba', ['#eef3fb', '#e3e8f2'], { ...ALLEY, wallKind: 'tile', wall: '#f4f7fd', wall2: '#cfdcf3', wainscot: '#3f6fd8', trim: '#ffffff', wallEdge: '#fafcff', plaster: '#eef1f8' });
THEMES.alleyhouse = { ...THEMES.alley3, name: '멍뭉이네 마당 2층집', friend: 'shiba', bg: ['#fff3dc', '#f2e6cc'] };
THEMES.parkwide = { ...THEMES.park1, name: '큰 놀이터' };
THEMES.campwide = { ...THEMES.camp1, name: '산속 캠핑장 한가운데' };
THEMES.bunnybath = { ...THEMES.bunny, name: '토순이네 침실과 욕실' };
THEMES.house3 = { ...THEMES.bear, name: '곰돌이네 다락 3층집', bg: ['#fff4e6', '#f1e3cf'] };
THEMES.officefloor = { ...THEMES.my, name: '박사의 연구 사무실', friend: 'nerd', bg: ['#eef3fb', '#dfe8f5'] };
export const MAPS = {
  // 거실 + 부엌, 가운데 문으로 연결
  bear2: () => ({ theme: THEMES.bear2, friendAt: [-1.5, 1.5], nBonus: 2, rooms: [
    { at: [-2.5, 0], layout: RM('bear', 5, 5, { walls: { E: 'door' }, door: { wall: 'S', u: -1.2 },
      furniture: [F('bookshelf', 0, 0, 0, { seed: 11 }), F('sofa', 1, 0), F('plant', 3, 0), F('lamp', 4, 0), F('tvstand', 0, 2, 1), F('rug', 1, 2), F('table', 2, 3), F('chest', 0, 4, 1), F('stool', 4, 4), F('drawers', 4, 1, 3)],
      decor: [D('window', 'N', -.5), D('clock', 'N', 1.6), D('picture', 'W', 1.0), D('wallshelf', 'W', -1.5)] }) },
    { at: [2.5, 0], layout: RM('cat', 5, 5, { walls: { W: 'none' },
      furniture: [F('fridge', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('dishcab', 4, 0), F('kitchentable', 2, 2), F('stool2', 2, 1), F('stool2', 3, 3, 2), F('trash', 4, 2), F('catbowls', 4, 4), F('plant', 0, 4)],
      decor: [D('wallrack', 'N', .5), D('window', 'E', 0)] }) },
  ] }),
  // 침실 + 놀이방
  bunny2: () => ({ theme: THEMES.bunny2, friendAt: [1.5, 1.5], nBonus: 2, rooms: [
    { at: [-2.5, 0], layout: RM('bunny', 5, 5, { walls: { E: 'door' }, door: { wall: 'S', u: -1.2 },
      furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('plant', 4, 0), F('desk', 0, 3, 1), F('rug', 2, 2), F('stool', 1, 3), F('trash', 4, 4), F('catbed', 3, 4)],
      decor: [D('picture', 'N', -1.9), D('wallshelf', 'N', 1.6), D('window', 'W', -.5), D('clock', 'W', 1.6)] }) },
    { at: [2.5, 0], layout: RM('peng', 5, 5, { walls: { W: 'none' },
      furniture: [F('boxes', 1, 0), F('chest', 2, 0), F('bookshelf', 3, 0, 0, { seed: 41 }), F('yarnbasket', 4, 0), F('cattower', 4, 2, 3), F('rug', 1, 2), F('table', 2, 4), F('stool', 1, 4), F('boxes', 4, 4)],
      decor: [D('window', 'N', -1.2), D('picture', 'E', -1), D('wallshelf', 'E', 1.2)] }) },
  ] }),
  // 1층 거실·부엌 + 2층 침실 (인형의 집처럼 앞이 열린 단면)
  // 펭펭이네 2층집 (2026-10-17 시범, "한 채의 집"): one house — the upper floor sits back over the rear half so the
  // living room below stays in view, real stairs climb the west wall to a gap in the balcony rail, a pulley basket
  // runs between the floors, a gable with a chimney and half-timbering on the outside. Lower floor: living room,
  // kitchen under the balcony, dining by the window; upper floor: a blue-panelled reading and sleeping loft.
  house2f: () => {
    const down = { ...THEMES.peng, wallKind: 'flower', wall: '#fff1ea', wall2: '#ffb9a6', wainscot: '#f4c39e', trim: '#fff8ee', floorKind: 'planks', floor: '#e9b98a', floor2: '#d49c6a' };
    const up = { ...THEMES.peng, wallKind: 'wood', wall: '#b9d3f3', wall2: '#9dbbe8', wainscot: '#87a8dc', trim: '#fff8ee', floorKind: 'planks', floor: '#f1cd9c', floor2: '#ddb07a', clad: '#fff3e2' };
    return { theme: THEMES.house2f, friendAt: [1.6, 1.8], nBonus: 3, fitAll: true, rooms: [
      // the stairs start a tile in from the front (a floor row at their foot) and land on the balcony's front edge
      { at: [0, 0], level: 0, layout: { w: 6, d: 7, theme: down, wallH: 2.9, timber: true,
        furniture: [F('stairsup', 0, 3), F('plant', 0, 0), F('bookshelf', 1, 0, 0, { seed: 13 }), F('lamp', 2, 0), F('fridge', 3, 0), F('counter', 4, 0, 0, { variant: 'stove' }), F('counter', 5, 0),
          // 이어진 집 (10/19): the kitchen pulley rides up through the balcony's hatch, a slide comes down from the balcony
          // into a ball pit, the dining table moved to the window side
          // (소파 0.4칸 동쪽: 계단과 소파 사이로 부엌 줄까지 길 — ③ 10/22, 보물 지키기 보스1에서 너굴이가 못 지나감)
          { ...F('sofa', 1, 2), dx: .4 }, F('liftbasket', 5, 2, 0, { up: true, crank: 'left', hook: true }), F('rug', 1, 3), F('table', 2, 4), F('tubeslide', 3, 3), F('diningset', 4, 3),
          F('ballpit', 3, 5), F('laundrybasket', 2, 6), F('plant', 5, 5), F('stool', 5, 6)],
        decor: [D('window', 'W', 2.0), D('picture', 'W', -1.8), D('window', 'E', 1.6)] } },   // nothing hung on the back wall under the balcony: it is in shadow and out of sight
      // (the balcony's front-right tile is a hatch: the kitchen pulley comes up through it, 10/19)
      { at: [0, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [2.5, -.5] }, gable: 'N', timber: true, slab: 'cut', cut: [{ i: 5, j: 2, w: 1, d: 1 }],
        furniture: [F('plant', 0, 0), F('desk', 1, 0), F('stool', 1, 1), F('bookshelf', 3, 0, 0, { seed: 31 }), F('chest', 4, 0), F('bed', 5, 0), F('rug', 2, 1), F('beanbag', 4, 2)],
        decor: [D('window', 'W', 0), D('picture', 'N', -1.7), D('clock', 'E', 0)] } },
    ] };
  },
  // 침실 + 욕실
  bunnybath: () => ({ theme: THEMES.bunnybath, friendAt: [-1.5, 1.5], nBonus: 2, rooms: [
    { at: [-2.5, 0], layout: RM('bunny', 5, 5, { walls: { E: 'door' }, door: { wall: 'S', u: -1.2 },
      furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('plant', 4, 0), F('desk', 0, 3, 1), F('rug', 2, 2), F('stool', 1, 3), F('catbed', 4, 3), F('yarnbasket', 1, 4, 1)],   // (털실 바구니: 자물쇠가 방 쪽을 보게 — user 10/19 "바구니 자물쇠가 벽 쪽에 있어서")
      decor: [D('picture', 'N', -1.9), D('wallshelf', 'N', 1.6), D('window', 'W', -.5), D('clock', 'W', 1.6)] }) },
    { at: [2.5, 0], layout: RM('bath', 5, 5, { walls: { W: 'none' },
      furniture: [F('bathtub', 1, 0, 0, { blackout: true }), F('vanity', 3, 0), F('laundrybasket', 0, 1), F('toilet', 4, 2, 3), F('laundry', 4, 4, 3), F('rug', 1, 2), F('plant', 0, 4), F('trash', 3, 4)],
      decor: [D('wallshelf2', 'N', -1.0), D('mirrorcab', 'N', 1.0), D('window', 'E', -1.5)] }) },
  ] }),
  // 곰돌이네 다락 3층집 (user 10/17: the 2층집 look is good, floors floating apart are not — "찾기 불편하기만 할듯"): one house
  // under one roof like 펭펭이네 2층집 — the ground floor, a bedroom balcony at the back up the stairs on the right, and an
  // attic loft over its left end up a ladder, under the gable
  house3: () => {
    const down = { ...THEMES.bear, wallKind: 'stripe', wall: '#f4f7e8', wall2: '#dfe9c6', wainscot: '#f2d9b0', trim: '#fff8ee', floorKind: 'planks', floor: '#c98f5a', floor2: '#9a6538' };
    const up = { ...THEMES.bear, wallKind: 'wood', wall: '#f6dcb4', wall2: '#ecc48f', wainscot: '#d9a066', trim: '#fff8ee', floorKind: 'planks', floor: '#f1cd9c', floor2: '#ddb07a', clad: '#fff3e2', roof: '#5f9e86', roof2: '#7fbfa4' };
    return { theme: THEMES.house3, friendAt: [1.6, 1.8], nBonus: 3, fitAll: true, rooms: [
      { at: [0, 0], level: 0, layout: { w: 7, d: 7, theme: down, wallH: 2.9, timber: true,
        // (the stairs stand .27 forward: the upper floor's slab runs .25 past its rooms, and the top tread and the stringers went into
        // its edge — "계단이 바닥판 모서리에 묻혀 보임"; now the top step meets the slab's front face; 겹침 QA 10/19)
        furniture: [{ ...F('stairsup', 6, 3), dz: .27 }, F('bookshelf', 0, 0, 0, { seed: 17 }), F('recordcab', 1, 0), F('floorlamp', 2, 0), F('fridge', 4, 0), F('counter', 5, 0, 0, { variant: 'stove' }), F('dishcab', 6, 0),
          // (10/19 the brass pole and the balcony hatch came out again: the hatch sat right under the loft's ladder, so the
          // ladder's foot hung over a hole and the pole stood in the air past the loft — user on a phone, 8판: "기둥이랑
          // 사다리, 심지어 사다리는 떨어져 있음. 기둥이랑 뭐여")
          F('sofa2', 0, 2), F('monstera', 2, 2), F('kitchentable', 4, 2), F('stool2', 4, 3), F('rug', 0, 3), F('zabuton', 0, 4), F('kotatsu', 1, 4), F('chest', 3, 5), F('tvlow', 0, 6, 2), F('plant', 2, 6), F('laundrybasket', 5, 6)],
        decor: [D('window', 'W', 2.0), D('picture', 'W', -.4)] } },
      { at: [0, -2], level: 1, layout: { w: 7, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [-3.0] }, gable: 'N', timber: true,
        lofts: [{ i: 0, j: 0, w: 3, d: 2, y: 1.45, ladder: 'S', ladderAt: .9 }],
        furniture: [LF('futon', 0, 0, 0, null, 1.45), LF('yarnbasket', 1, 0, 0, null, 1.45), LF('catbed', 2, 0, 0, null, 1.45), F('chest', 0, 0), F('desk', 0, 1), F('wardrobe', 3, 0), F('bed', 4, 0), F('drawers', 5, 0), F('plant', 6, 0), F('beanbag', 3, 2), F('yarnbasket', 5, 2)],
        decor: [D('window', 'E', 0), D('picture', 'N', 1.6)] } },
    ] };
  },
  // 우리 아파트 투룸: 거실 + 주방, 문 없는 벽으로 이어진 한 집 (the floor runs on past the walls, no cake slab)
  aptmap: () => ({ theme: THEMES.apt, friendAt: [1.6, 1.0], nBonus: 3, bleed: true, rooms: [
    // the living room without its kitchen corner: the kitchen next door has the fridges and the table
    { at: [-3.0, 0], layout: { ...LAYOUTS.apt, theme: THEMES.apt, bleed: null, walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.2 }, floorZones: [], raised: [],
      // (장치판 '로봇청소기 대소동': the robot vacuum that drives, and a 천장 빨래건조대 in place of the floor rack)
      furniture: [...LAYOUTS.apt.furniture.filter(f => !['bigfridge', 'kimchifridge', 'snackcart', 'diningset'].includes(f.type)).map(f => f.type === 'robovac' ? { ...f, type: 'robovacgo' } : f.type === 'dryrack' ? { ...f, type: 'ceilrack' } : f), F('bookshelf', 5, 0, 0, { seed: 7 })] } },
    { at: [3.0, 0], layout: { w: 5, d: 6, theme: THEMES.aptkitchen, bleed: null, wallH: 3.0, walls: { N: 'wall', W: 'none', E: 'wall' },
      // (the 양문 냉장고 stood 14 cm into the living room's wall — that wall is .24 thick on this side — and its doors could
      // only open a crack: it stands clear of it; 겹침 QA 10/19)
      furniture: [{ ...F('bigfridge', 0, 0), dx: .16 }, F('kimchifridge', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('snackcart', 4, 0),
        F('diningset', 1, 3), F('plant', 4, 2), F('trash', 4, 5), F('laundrybasket', 0, 5)],
      decor: [D('wallrack', 'N', .5), D('catclock', 'E', 0)] } },
  ] }),
  // 큰 단지 놀이터: the playground and a pavilion garden side by side
  playgroundwide: () => ({ theme: THEMES.playground, friendAt: [3.5, 1.5], nBonus: 3, rooms: [
    { at: [-3.5, 0], layout: { ...LAYOUTS.playground, theme: THEMES.playground } },
    { at: [3.5, 0], layout: { w: 7, d: 6, theme: THEMES.playground, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      furniture: [F('aptwall', 0, 0), F('aptwall', 2, 0), F('pavilion2', 4, 0), F('planter', 0, 2), F('picnic2', 2, 2),
        F('bbqgrill', 6, 2), F('streetlamp2', 0, 4), F('swings2', 1, 4), F('springrider', 4, 3), F('catfeeder', 6, 4), F('icecart', 4, 5),
        // (리포트 v3 개선 4: the 공원 boss had nothing to lock but one box — a lost-property locker, a park bin, the recycling)
        F('lostbox', 6, 0), F('parkbin', 6, 5), F('recyclebins', 0, 5)] } },
  ] }),
  // 편의점 + 빨래방: two shops side by side, one door between
  shopmap: () => ({ theme: THEMES.konbini, friendAt: [2.5, 1.2], nBonus: 3, rooms: [
    { at: [-3.0, 0], layout: { ...LAYOUTS.konbini, theme: THEMES.konbini, walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.0 } } },
    { at: [2.5, 0], layout: { ...LAYOUTS.laundry, theme: THEMES.laundry, walls: { N: 'wall', W: 'none', E: 'wall' } } },
  ] }),
  // 빌딩 로비 + 사무실
  lobbymap: () => {
    const office0 = MAPS.officefloor().rooms[0].layout;
    // Four separate lockable pieces for the final riddle: replace the loose boxes with the office safe.
    // Same 1×1 footprint; its door faces the room, so the lever's fourth lock has a reachable target.
    const office = { ...office0, furniture: office0.furniture.map(f => f.type === 'boxes' && f.i === 0 && f.j === 4 ? F('safe', 0, 4, 1) : f) };
    return { theme: THEMES.lobby, friendAt: [2.5, 1.2], nBonus: 3, rooms: [
      { at: [-3.0, 0], layout: { ...LAYOUTS.lobby, theme: THEMES.lobby, walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.0 } } },
      { at: [2.5, 0], layout: { ...office, door: null, walls: { N: 'wall', W: 'none', E: 'wall' } } },
    ] };
  },
  // 사무실: 큰 업무 공간 + 탕비실
  officefloor: () => ({ theme: THEMES.officefloor, friendAt: [3.5, 1.5], nBonus: 3, rooms: [
    { at: [-2.5, 0], layout: RM('office', 5, 5, { walls: { E: 'door' }, door: { wall: 'S', u: -1.2 },
      furniture: [F('filecab', 0, 0), F('copier', 1, 0), F('bookshelf', 3, 0, 0, { seed: 51 }), F('plant', 4, 0), F('officedesk', 0, 2), F('officechair', 0, 3, 2), F('cubicle', 2, 2), F('officedesk', 2, 3), F('officechair', 3, 4, 2), F('boxes', 0, 4)],
      decor: [D('whiteboard', 'N', -.5), D('window', 'W', 0)] }) },
    { at: [2.5, 0], layout: RM('office', 5, 5, { walls: { W: 'none' },
      furniture: [F('coffeebar', 1, 0), F('watercooler', 2, 0), F('fridge', 3, 0), F('trash', 4, 0), F('kitchentable', 1, 2), F('stool2', 1, 3, 2), F('stool2', 2, 3, 2), F('filecab', 4, 2, 3), F('plant', 4, 4), F('safe', 0, 4, 1)],
      decor: [D('clock', 'N', -1.5), D('window', 'E', -1.3)] }) },   // (the window was right behind the tall file cabinet — 64·67판: between it and the bin now, its curtain clear of the cabinet; 겹침 QA 10/19)
  ] }),
  // 넓은 골목: 가게 두 곳이 늘어선 거리
  alleywide: () => ({ theme: THEMES.alleywide, friendAt: [3.0, 1.0], nBonus: 3, rooms: [
    { at: [0, 0], layout: RM('alley1', 9, 5, { walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
      furniture: [F('vending', 0, 0), F('shopfront', 1, 0), F('pole', 3, 0), F('aircon', 4, 0), F('stairs', 5, 0), F('vending', 7, 0), F('trashbags', 8, 0),
        F('jangdok', 0, 2, 1), F('daeya', 1, 2), F('pyeongsang', 2, 3), F('bike', 5, 2), F('garden', 7, 2), F('clothesline', 4, 4), F('trashbags', 8, 4), F('daeya', 6, 4)],
      decor: [D('mailbox', 'W', 1.0), D('mailbox', 'N', -0.5)] }) },   // no gate: the whole back wall is taken (stairs, shopfront)
  ] }),
  // 멍뭉이네 마당 2층집 (user 10/17: "저런 2층 이쁜… 골목도 마찬가지"): the 2층집 grammar in the alley — a walled yard
  // with crocks, a washtub and a 평상 on the left, the house on the right with a door onto the yard, the bedroom balcony
  // at the back up the stairs, one gable roof
  alleyhouse: () => {
    const yard = { ...THEMES.alley3, floorKind: 'grass', floor: '#9ad66f', floor2: '#86c45c', base: '#8fcf6a' };
    const down = { ...THEMES.my, wallKind: 'stripe', wall: '#fff7ea', wall2: '#f6dcc2', wainscot: '#e8b98c', trim: '#fff8ee', floorKind: 'planks', floor: '#d9a066', floor2: '#a96c3c' };
    const up = { ...THEMES.my, wallKind: 'wood', wall: '#ffe3cf', wall2: '#f7c9a8', wainscot: '#e9a37a', trim: '#fff8ee', floorKind: 'planks', floor: '#f1cd9c', floor2: '#ddb07a', clad: '#fff3e2', roof: '#7a5f9e', roof2: '#9a80bf' };
    return { theme: THEMES.alleyhouse, friendAt: [-2.5, 1.5], nBonus: 3, fitAll: true, rooms: [
      { at: [-3.5, 0], level: 0, layout: { w: 4, d: 7, theme: yard, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
        // (10/19 겹침 QA, 26·30판: the 텃밭 stood right behind the gate — its doors opened into it — and the 급식소 stood
        // 10 cm into the house's wall) both moved to free tiles of the yard
        furniture: [F('jangdok', 0, 0), F('garden', 2, 4), F('catfeeder', 1, 1), F('daeya', 0, 2), F('clothesline', 1, 2), F('pyeongsang', 0, 4), F('bike', 2, 6), F('trashbags', 0, 6)],
        decor: [D('gate', 'N', 1.0), D('mailbox', 'W', 1.0)] } },
      { at: [2, 0], level: 0, layout: { w: 7, d: 7, theme: down, wallH: 2.9, timber: true, walls: { W: 'door' }, doorAt: { W: 1.0 },
        // (the stairs stand .27 forward, as in 8·18판: the upper floor's slab runs .25 past its rooms and the top of the stairs
        // went into its edge; 겹침 QA 10/19)
        furniture: [{ ...F('stairsup', 6, 3), dz: .27 }, F('kimchifridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('fridge', 4, 0), F('bookshelf', 5, 0, 0, { seed: 51 }), F('plant', 6, 0),
          F('diningset', 1, 2), F('rug', 3, 3), F('sofa2', 3, 3), F('table', 4, 4), F('shoerack', 0, 5, 1), F('chest', 1, 6, 1), F('tvlow', 3, 6, 2), F('laundrybasket', 5, 6)],
        decor: [D('window', 'W', -2.2)] } },
      { at: [2, -2], level: 1, layout: { w: 7, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [-3.0] }, gable: 'N', timber: true,
        furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('desk', 2, 0), F('stool', 2, 1), F('bookshelf', 4, 0, 0, { seed: 61 }), F('chest', 5, 0), F('plant', 6, 0), F('yarnbasket', 0, 2), F('beanbag', 4, 2)],
        decor: [D('window', 'W', 0), D('clock', 'E', 0)] } },
    ] };
  },
  // 판다네 통나무 오두막: the 2층집 grammar on the mountain — a log cabin on the left (stairs up to an attic bedroom under
  // the gable), its door opening onto a camp ground under the cliff on the right
  cabin: () => {
    const camp = { ...THEMES.camp1 };
    const down = { ...THEMES.my, wallKind: 'wood', wall: '#e4b27a', wall2: '#c98f5a', wainscot: '#a8703e', trim: '#fff3e2', floorKind: 'planks', floor: '#c98f5a', floor2: '#9a6538', base: '#c99a6b' };
    const up = { ...THEMES.my, wallKind: 'wood', wall: '#f0c992', wall2: '#dba86c', wainscot: '#b97a45', trim: '#fff3e2', floorKind: 'planks', floor: '#e9b98a', floor2: '#c98f5a', clad: '#fff3e2', roof: '#4f7f5a', roof2: '#6fa27a' };
    return { theme: THEMES.cabin, friendAt: [3.5, 1.5], nBonus: 3, fitAll: true, rooms: [
      { at: [-2.5, 0], level: 0, layout: { w: 6, d: 7, theme: down, wallH: 2.9, timber: true, walls: { E: 'door' }, doorAt: { E: 1.0 },
        // (the stairs stand .27 forward, as in 8·18판: the upper floor's slab runs .25 past its rooms and the top of the stairs
        // went into its edge; 겹침 QA 10/19)
        furniture: [{ ...F('stairsup', 0, 3), dz: .27 }, F('bookshelf', 0, 0, 0, { seed: 71 }), F('drawers', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('dishcab', 4, 0), F('plant', 5, 0),
          F('sofa', 1, 2), F('chest', 5, 2), F('rug', 2, 3), F('table', 3, 4), F('beanbag', 1, 4), F('laundrybasket', 2, 6), F('trunk', 5, 6, 3), F('lamp', 4, 6)],
        decor: [D('window', 'W', 2.0), D('picture', 'W', -.4)] } },
      { at: [3.0, 0], level: 0, layout: { w: 5, d: 7, theme: camp, walls: { N: 'cliff', W: 'none', S: 'none', E: 'none' },
        furniture: [F('firewood', 0, 0), F('pine', 2, 0), F('pine2', 4, 0), F('tent', 2, 2), F('cooler', 4, 2), F('lantern', 1, 3), F('campchair', 2, 4), F('rock', 4, 4), F('log', 0, 6), F('backpack2', 3, 6), F('mushrooms', 4, 6)] } },
      { at: [-2.5, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [2.5] }, gable: 'N', timber: true,
        furniture: [F('wardrobe', 1, 0), F('bed', 2, 0), F('drawers', 3, 0), F('desk', 4, 0), F('stool', 4, 1), F('beanbag', 3, 2), F('yarnbasket', 5, 2)],
        decor: [D('window', 'E', 0), D('picture', 'N', -1.6)] } },
    ] };
  },
  // 햄찌네 복층 원룸: the 2층집 grammar inside an apartment — a one-room flat two storeys tall, the kitchen and the sofa
  // below, a sleeping mezzanine with a rail up the stairs on the right (no roof: a flat in a block)
  duplex: () => {
    const T = THEMES.oneroom || THEMES.my;
    const down = { ...T, wallKind: T.wallKind || 'dots' }, up = { ...T, floor: '#e9d2b0', floor2: '#d4b88e' };
    return { theme: THEMES.duplex, friendAt: [-1.2, 1.6], nBonus: 3, fitAll: true, rooms: [
      { at: [0, 0], level: 0, layout: { w: 6, d: 7, theme: down, wallH: 2.9,
        // (the stairs stand .27 forward: the upper floor's slab runs .25 past its rooms, and the top tread and the stringers went into
        // its edge — "계단이 바닥판 모서리에 묻혀 보임"; now the top step meets the slab's front face; 겹침 QA 10/19)
        furniture: [{ ...F('stairsup', 5, 3), dz: .27 }, F('minikitchen', 0, 0), F('minifridge', 2, 0), F('ricecooker', 3, 0), F('washer2', 4, 0), F('shoerack', 5, 0),
          F('hanger', 0, 2), F('rug', 1, 3), F('foldtable', 2, 4), F('beanbag', 1, 4), F('sofa2', 1, 2), F('mirror2', 0, 5, 1), F('plantshelf', 0, 6), F('laundrybasket', 3, 6), F('pcdesk', 4, 6, 3)],
        decor: [D('curtainwin', 'W', 1.6), D('posterwall', 'W', -1.0)] } },
      { at: [0, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [-2.5] },
        furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('bookshelf', 3, 0, 0, { seed: 81 }), F('plant', 5, 0), F('beanbag', 2, 2), { ...F('chest', 0, 2, 1), dz: -.06 }],   // (the toy chest's front stood in the balcony rail; 겹침 QA 10/19)
        decor: [D('window', 'N', -.5), D('clock', 'W', 0)] } },
    ] };
  },
  // 큰 놀이터
  parkwide: () => ({ theme: THEMES.parkwide, friendAt: [-.5, -1.5], nBonus: 3, rooms: [
    { at: [0, 0], layout: RM('park1', 8, 6, { walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
      // the big park: a playground on the left, the pond in the middle, a picnic corner on the right
      // (10/19 겹침 QA: the swings stood on the climbing wall's foot and through the tree — swings (2,0)→(3,0), tree (4,0)→(7,1))
      // (10/23 아트 점검 48-1: the ice-cream cart's awning hung over the pond's rim and water — cart and planter swap: the cart to (6,4), its back on open grass)
      furniture: [F('slidetower', 0, 0), F('swings2', 3, 0), F('tree', 7, 1), F('picnic2', 5, 0), F('bush', 7, 0),
        F('springrider', 2, 2), F('pond', 3, 2), F('streetlamp2', 6, 2), F('bbqgrill', 7, 2), F('hopscotch', 0, 3), F('reeds', 2, 4),
        F('icecart', 6, 4), F('parkbin', 0, 5), F('bench', 1, 5), F('planter', 5, 5), F('tree', 7, 5)] }) },
  ] }),
  // 큰 캠핑장
  campwide: () => ({ theme: THEMES.campwide, friendAt: [2.5, 1.5], nBonus: 3, rooms: [
    { at: [0, 0], layout: RM('camp1', 8, 6, { walls: { N: 'cliff', W: 'cliff', S: 'none', E: 'none' },
      furniture: [F('tent', 0, 0), F('pine', 2, 0), F('firewood', 3, 0), F('tent', 5, 0), F('pine', 7, 0),
        F('log', 0, 2, 1), F('lantern', 2, 2), F('campchair', 3, 2), F('cooler', 4, 2), F('trunk', 6, 2), F('campchair', 7, 3, 3),
        F('rock', 1, 5), F('mushrooms', 4, 5), F('pine', 7, 5), F('rock', 5, 4),
        F('backpack2', 5, 2), F('lanterns', 2, 4), F('bbqgrill', 6, 4), F('tentsmall', 0, 5)] }) },
  ] }),
};

// 6판 곰제과 (10/20): the kitchen (left, inside: herringbone + sage tiles, brick oven 'stove', the bread cabinet that locks) opens
// through a doorway onto the shop's front yard (right, outside: the white clapboard front with striped awnings, a bread stall,
// a parasol table, crates, flour sacks, a lamp post)
MAPS.bearbakery = () => ({ theme: THEMES.bearbakery, friendAt: [-.84, -1.2], rooms: [
  { at: [-1.5, 0], layout: RM('bearbakery', 5, 5, { walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.0 },
    floorZones: [{ i: 1, j: 0, w: 4, d: 2, kind: 'smalltile', a: '#fbf6ea', b: '#d7e6cc' }],
    furniture: [F('breadcab', 0, 0), F('bakesink', 1, 0), F('stove', 2, 0), F('bakecounter', 4, 0),
      F('breadbasket', 0, 2, 0, { v: 0 }), F('bakeisland', 1, 2), F('breadcart', 0, 4, 1), F('plant', 4, 4)],
    decor: [D('potrail', 'N', -1.5), D('bakejars', 'N', 1.5), D('ginghamwin', 'W', -.2), D('chalkmenu', 'W', -1.75)],
    sun: [{ from: [-2.5, -.6, -2.5, .4], dir: [2.4, 1.0] }] }) },
  { at: [2.5, 0], layout: RM('bakeyard', 3, 5, { walls: { N: 'wall', W: 'none', E: 'none', S: 'none' },
    furniture: [F('bkstall', 1, 0), F('bklamp', 0, 1), F('floursacks', 0, 2), F('bkparasol', 2, 2), F('breadbasket', 1, 3, 0, { v: 1 }), F('bkcrates', 1, 4), F('bkplanter', 2, 4)],
    decor: [D('bkfacade', 'N', 0)], sun: [] }) },
] });
// ── Stages: 4 regions, 50 stages. Region 1 is hand-tuned; the rest are generated from region rules so that
// difficulty rises through more targets, deeper hiding places and new lock mechanics, not just smaller items or
// shorter timers. Region rooms that are not built yet fall back to indoor rooms so the game always runs.
// 1장 (레벨 세션 10/18, user "ㅇ" to "하나 배우고 세 판 써먹기"): the friend game once at each end, hidden objects in between —
// turn, zoom, drawers first, then from 5판 one padlock a stage. Nothing else new in this chapter; the old 3판 흑백 museum,
// 6판 서재 and the 12판 냥냥이 escape room moved (서재 → 12판 finale, 흑백 → 4장, 간식 → 6장 — see PLAN).
export const STAGES = [
  { room: 'bunny', n: 3, inside: 0, behind: 0, time: 60, tut: 1, clutter: .4 },
  { room: 'bunny', n: 4, inside: 2, behind: 0, time: 70, tut: 2, clutter: .5 },
  { room: 'fishing3', n: 6, inside: 1, behind: 0, time: 80, clutter: .45 },   // 3판 = A안 개굴이의 낚시터 레벨업 + 여우비 (10/24 사용자 "3판은 A로"; C frogpond·B fishing2b·옛 fishing은 ?gptmap= 미리보기로 남김)
  { room: 'peng', n: 3, inside: 1, behind: 0, time: 85, clutter: .35 },   // 흑백 (GRAY, 10/19 user "초반에 흑백 하나, 4 정도에"): 3 things + 2 grey furniture + 먹물이 — the first 흑백 (5 → 3, 1~10판 밸런스 10/19: a new rule's first stage carried the most to find, 8; now 6 — and clutter .5 → .35: a 흑백 stage has no decoy cap, fewer things left room for 9 decoys)
  { room: 'bear', n: 7, inside: 1, behind: 0, time: 90, lock: ['pad'], clutter: .5, tut: 4, habitMore: true, habit: ['kotatsu', 'table', 'zabuton', 'sofa', 'tvlow', 'recordcab', 'fridge', 'kitchen', 'counter', 'snack'] },   // (곰돌이: "손님 주려고 숨겨 놨는데" — by the food, 검토 P0-1)   // the key lesson (🆕 열쇠 card on the first padlock)
  { room: 'bear2', n: 7, inside: 2, behind: 0, time: 95, lock: ['pad'], clutter: .55, zoom: 1.3, lockOn: { pad: ['dishcab'] } },   // zoom: 폰 세로 시작 줌(넓은 맵, 레벨 세션 10/19)
  { room: 'house2f', n: 8, inside: 2, behind: 0, time: 95, lock: ['pad'], clutter: .6, lockOn: { pad: ['chest'] }, clueIn: { pad: 'liftbasket' }, clueHang: { pad: 'liftbasket' }, zoom: 1.4, habitHigh: true, habitMore: true, habit: [] },   // (habit: [] — only 'high up' is 펭펭이's habit here, not its everyday list: the bottom shelf counted as a habit place — 검토 10/20)   // (clueHang: the key hangs at the pulley's top, out of reach, until the basket comes up — user 10/20)   // (펭펭이 "비결 2번: 높은 데 숨기기!" — up high, every other thing as on any stage: the upstairs alone already holds half the house, 검토 P0-1)
  { room: 'house3', n: 6, inside: 2, behind: 0, time: 100, lock: ['pad'], clutter: .3, zoom: 1.4, kit: 'robot', lockOn: { pad: ['wardrobe'] } },   // 프라모델 조립판 (10/19, 스토리 룸·레벨 세션 합의): 곰돌이가 어릴 때 못 맞춘 꼬마 로봇 — 부품 6개, 머리는 잠긴 상자 속(열쇠 세 번째), 함정 절반 (modelkit.js)
  // (9판 정전 ② 10/23, user: "스위치 찾게 해서(혹은 두꺼비집) 그거 찾으면 밝게 변하는 거 어떰?" — dark: a power cut on the night; the switch on a wall)
  { room: 'bunnybath', n: 7, inside: 2, behind: 0, time: 95, lock: ['pad'], night: true, dark: true, lightItem: true, lightAt: [[0, 'N', .1], [0, 'W', 1.1], [1, 'N', -.2]],   // (u: the places the start view sees — ② probe 10/24) clutter: .6, zoom: 1.25, habitMore: true, sureIn: 'bathtub',
    habitRoom: 1, habit: ['bed', 'futon', 'pillow', 'zabuton', 'catbed'], clueOn: { pad: ['plant'] }, clueRoom: 1 },   // ("목욕 끝! …내 물건 다 어디 갔지?" — the bathroom and the bed; one in the tub by the bubbles; the key in the bathroom where the first view reaches, its plant by the door — 검토 P0-1·P1-4)   // (then 이불 속 누구게 — the pajama party)
  { room: 'museum', n: 5, inside: 1, behind: 0, time: 100, lock: ['pad'], clutter: .55, artHunt: 'artstars' },   // 흑백 (GRAY): the museum that lost its colours — 먹물이's first
  { room: 'cat', n: 8, inside: 2, behind: 0, time: 105, lock: ['pad'], clutter: .3, kit: 'cattower' },   // 캣타워 조립판 (10/20, user "조립식 많이 들어가면 좋겠다" — 레벨 세션: 11판·19판; 함정 절반 as 8판; the top bed behind the lock)
  { room: 'study', n: 4, inside: 1, behind: 0, time: 110, clutter: .5, showcase: true },   // 비밀 서재 ★ — the chapter's finale (friend game)
];
// 70 stages in 7 regions. Stages 1–12 are the hand-made friends' houses; every region after it opens with a short
// cinematic saying why we go there (REGION_INTRO) and ends on an escape-room boss. Rooms not built yet are skipped.
// ── 보스 미로 (user 10/17: "보스전 맵이 좀 넓어야… 미로같이 코너랑 사각이 많은 맵이 좋지 않을까? 약간 넓고 이쁘고"):
// six 5×4 rooms in two rows (15×8 in all). On the left a loop to run round (A1 A2 B2 B1), on the right a dead end (B2 → B3
// → A3) behind a solid wall. The seeker can't see through walls (crossOK) or past furniture, so every doorway is a corner
// to slip round. Indoors the rooms are joined by doorways; outdoors the cells are open ground and the same plan is drawn
// with rows of crates, hedges or rocks along the cell edges.
//   A1 A2 | A3        doorways: A1–A2, A1–B1, A2–B2, B1–B2, B2–B3, A3–B3 (A2 | A3 is a wall)
//   B1 B2   B3
const M_AT = n => [(n % 3 - 1) * 5, n < 3 ? -2 : 2];
const M_WALLS = [
  { N: 'wall', W: 'wall', E: 'door', S: 'door' }, { N: 'wall', W: 'none', E: 'wall', S: 'door' }, { N: 'wall', W: 'none', E: 'none', S: 'door' },
  { N: 'none', W: 'wall', E: 'door', S: 'none' }, { N: 'none', W: 'none', E: 'door', S: 'none' }, { N: 'none', W: 'none', E: 'none', S: 'none' },
];
// doorway tiles: A1 east j1 / south i1, A2 south i3, A3 south i2, B1 east j2, B2 east j1 (and the tiles they open onto stay clear)
const M_DOORS = [{ E: -.5, S: 1 }, { S: -1 }, { S: 0 }, { E: .5 }, { E: -.5 }, {}];
const mazeIn = (themes, cells) => () => ({ theme: themes[0], friendAt: [0, 0], bleed: true, rooms: cells.map((f, n) => ({ at: M_AT(n),
  layout: { w: 5, d: 4, theme: themes[n % themes.length], bleed: null, walls: M_WALLS[n], doorAt: M_DOORS[n], furniture: f } })) });
const edgeCol = (t, i, gap) => [0, 1, 2, 3].filter(j => j !== gap).map((j, k) => F(t[(i + j + k) % t.length], i, j));
const edgeRow = (t, j, gap, skip = []) => [0, 1, 2, 3, 4].filter(i => i !== gap && !skip.includes(i)).map((i, k) => F(t[(i + j + k + 1) % t.length], i, j));
const M_EDGES = t => [[...edgeCol(t, 4, 1), ...edgeRow(t, 3, 1, [4])], [...edgeCol(t, 4, -1), ...edgeRow(t, 3, 3, [4])], edgeRow(t, 3, 2), edgeCol(t, 4, 2), edgeCol(t, 4, 1), []];
const mazeOut = (theme, kN, kW, wallT, cells) => () => { const E = M_EDGES(wallT); return { theme, friendAt: [0, 0], bleed: true, rooms: cells.map((f, n) => ({ at: M_AT(n),
  layout: { w: 5, d: 4, theme, bleed: null, walls: { N: n < 3 ? kN : 'none', W: n % 3 === 0 ? kW : 'none', E: 'none', S: 'none' }, furniture: [...E[n], ...f] } })) }; };
const swapT = (cells, m) => cells.map(c => c.map(f => (m[f.type] ? { ...f, type: m[f.type] } : f)));
const HOUSE_CELLS = [
  [F('bed', 0, 0), F('wardrobe', 2, 0), F('bookshelf', 3, 0), F('lamp', 4, 0), F('plant', 0, 3), F('chest', 3, 3), F('boxes', 4, 3)],
  [F('bookshelf', 0, 0), F('tvlow', 1, 0), F('plantbig', 4, 0), F('sofa', 1, 2), F('table', 4, 2), F('beanbag', 4, 3), F('monstera', 0, 3)],
  [F('boxes', 0, 0), F('boxes', 1, 0), F('wardrobe', 3, 0), F('drawers', 4, 0), F('bookshelf', 0, 2), F('chest', 4, 2), F('boxes', 4, 3), F('laundrybasket', 0, 3)],
  [F('fridge', 0, 0), F('counter', 2, 0), F('dishcab', 3, 0), F('kitchentable', 1, 2), F('plant', 0, 3), F('boxes', 4, 3)],
  [F('shoerack', 0, 0), F('drawers', 1, 0), F('plantbig', 4, 0), F('desk', 1, 3), F('pcdesk', 4, 3)],
  [F('bookshelf', 0, 0), F('bookshelf', 1, 0), F('chest', 3, 0), F('drawers', 4, 0), F('kotatsu', 3, 2), F('sofa2', 1, 3), F('plantbig', 4, 3)],
];
const SHOP_CELLS = [
  [F('drinkfridge', 0, 0), F('snackshelf', 2, 0), F('magazinerack', 4, 0), F('snackshelf', 2, 2), F('icecreamchest', 0, 3), F('boxes', 3, 3)],
  [F('cupnoodlebar', 1, 0), F('drinkfridge', 3, 0), F('snackshelf', 1, 2), F('icecreamchest', 4, 2), F('magazinerack', 0, 3), F('boxes', 4, 3)],
  [F('boxes', 0, 0), F('boxes', 1, 0), F('boxes', 3, 0), F('boxes', 4, 0), F('chest', 0, 2), F('boxes', 4, 2), F('laundrybasket', 0, 3), F('boxes', 4, 3)],
  [F('washer3', 0, 0), F('washer3', 2, 0), F('washer3', 3, 0), F('cafetable', 1, 2), F('laundrybasket', 0, 3), F('laundrybasket', 4, 3)],
  [F('espresso', 0, 0), F('pastrycase', 4, 0), F('cafetable', 1, 3), F('cafetable', 3, 3)],
  [F('plantbig', 0, 0), F('counter2', 3, 0), F('cafetable', 1, 2), F('cafetable', 3, 2), F('pastrycase', 0, 3), F('monstera', 4, 3)],
];
const ALLEY_CELLS = [
  [F('pyeongsang', 0, 0)], [F('jangdok', 1, 1)], [F('recyclebins', 0, 0), F('vending', 4, 0), F('boxstack', 2, 1)],
  [F('pyeongsang', 1, 2), F('trashbags', 0, 3)], [F('boxstack', 2, 0), F('jangdok', 1, 2)], [F('vending', 4, 0), F('recyclebins', 3, 2), F('boxstack', 1, 2), F('trashbags', 0, 3)],
];
const PARK_CELLS = [
  [F('bench', 0, 0)], [F('slide', 1, 1)], [F('planter', 0, 0), F('bush', 4, 0), F('picnic2', 1, 1)],
  [F('bench', 1, 2), F('bush', 0, 3)], [F('bush', 1, 0), F('planter', 1, 2)], [F('bush', 4, 0), F('picnic2', 3, 2), F('tree', 1, 3), F('bush', 4, 3)],
];
const CAMP_CELLS = [
  [F('tent', 0, 0)], [F('log', 1, 1)], [F('firewood', 0, 0), F('pine2', 4, 0), F('cooler', 2, 1)],
  [F('tent', 1, 2), F('rock', 0, 3)], [F('cooler', 2, 0), F('log', 1, 2)], [F('pine2', 4, 0), F('firewood', 3, 2), F('rock', 1, 2), F('tree', 0, 3)],
];
Object.assign(MAPS, {
  mazehome: mazeIn(['bunny', 'bear', 'peng', 'cat', 'my', 'bear'].map(k => THEMES[k]), HOUSE_CELLS),
  mazehome2: () => mazeIn(['peng', 'cat', 'bunny', 'bear', 'cat', 'my'].map(k => THEMES[k]), swapT(HOUSE_CELLS, { sofa: 'sofa2', table: 'kotatsu' }))(),
  mazeapt: () => mazeIn(['apt', 'aptkitchen', 'apt', 'aptkitchen', 'apt', 'oneroom'].map(k => THEMES[k] || THEMES.my), swapT(HOUSE_CELLS, { fridge: 'bigfridge', sofa: 'sofa2' }))(),
  mazeshop: () => mazeIn(['konbini', 'konbini', 'konbini', 'laundry', 'cafe', 'cafe'].map(k => THEMES[k] || THEMES.my), SHOP_CELLS)(),
  mazebuilding: () => mazeIn(['lobby', 'lobby', 'lobby', 'lobby', 'lobby', 'lobby'].map(k => THEMES[k] || THEMES.my), swapT(HOUSE_CELLS, { bed: 'bookshelf', kitchentable: 'desk', tvlow: 'desk', kotatsu: 'table' }))(),
  mazealley: () => mazeOut(THEMES.alley1, 'alleywall', 'alleywall', ['crateblock', 'crateblock', 'crateblock', 'vending', 'crateblock'], ALLEY_CELLS)(),
  mazepark: () => mazeOut(THEMES.park2, 'hedge', 'fence', ['hedgeblock'], PARK_CELLS)(),
  mazecamp: () => mazeOut(THEMES.camp1, 'hedge', 'fence', ['rockblock'], CAMP_CELLS)(),
  mazecamp2: () => mazeOut(THEMES.camp2 || THEMES.camp1, 'hedge', 'fence', ['hedgeblock'], CAMP_CELLS)(),
});
// the boss of each region plays in its maze (the second boss in the same region gets the other version)
export const BOSS_MAZE = { home: ['mazehome', 'mazehome2'], apt: ['mazeapt'], alley: ['mazealley'], shop: ['mazeshop'], park: ['mazepark'], camp: ['mazecamp', 'mazecamp2'], building: ['mazebuilding'] };

export const REGIONS = [
  { id: 'home', name: '몽글 마을 집', from: 0, to: 12, rooms: ['bunny', 'bear', 'cat', 'peng'] },
  { id: 'apt', name: '우리 아파트', from: 12, to: 21, rooms: ['apt', 'aptkitchen', 'oneroom'], wide: ['duplex', 'aptmap'] },
  { id: 'alley', name: '동네 골목', from: 21, to: 31, rooms: ['street', 'alley1', 'skatepark', 'alley3'], wide: ['alleyhouse', 'alleywide'] },
  { id: 'shop', name: '편의점·상가', from: 31, to: 40, rooms: ['konbini', 'laundry', 'cafe'], wide: ['shopmap'] },
  { id: 'park', name: '공원·놀이터', from: 40, to: 49, rooms: ['playground', 'park1', 'park2', 'park3'], wide: ['playgroundwide', 'parkwide'] },
  { id: 'camp', name: '산길·캠핑', from: 49, to: 60, rooms: ['trail', 'camp1', 'camp2', 'camp3'], wide: ['cabin', 'campwide'] },
  { id: 'building', name: '빌딩', from: 60, to: 70, rooms: ['lobby', 'kpop', 'rooftop', 'museum'], wide: ['officefloor', 'lobbymap'] },
];
export const STAGE_COUNT = 70;
// the reason we move on, told as a little cinematic before each region's first stage
export const REGION_INTRO = {
  // 1장 (UI 세션 10/20, user: "1장은 2장 아파트처럼 뭐 타이틀 없냐?"): the same chapter card before 1판 — the card alone, no talk
  // (1판 has its own opening); the title is the 스토리 룸's to change (script.js REGION)
  home: { chapter: 1, title: '숨바꼭질, 시작!', cast: ['mong', 'bunny'], lines: [] },
  apt: { chapter: 2, title: '우리 아파트로!', cast: ['mong', 'bunny'], lines: [
    { who: 'bunny', text: '몽글아, 우리 아파트로 이사 왔어! 집들이하러 올래?' },
    { who: 'mong', text: '갈래 갈래! 근데… 짐 정리는 다 했어?' },
    { who: 'bunny', text: '헤헤, 아직. 리모컨이랑 슬리퍼가 어디 갔는지 모르겠어. 같이 찾아 줘!' }] },
  alley: { chapter: 3, title: '동네 한 바퀴', cast: ['mong', 'shiba', 'grumpy'], lines: [
    { who: 'shiba', text: '멍! 몽글아, 동네 산책 가자! 골목마다 재밌는 게 숨어 있어.' },
    { who: 'grumpy', text: '흥, 내 골목에서 뭘 찾는다고? …뭐, 구경 정도는 해도 돼.' },
    { who: 'mong', text: '삐딱이네 골목! 이번엔 뭘 숨겨 놨으려나~' }] },
  shop: { chapter: 4, title: '배고픈데 편의점 가자!', cast: ['mong', 'shiba'], lines: [
    { who: 'mong', text: '꼬르륵… 너무 돌아다녔더니 배고파.' },
    { who: 'shiba', text: '편의점 가자! 삼각김밥 하나씩 먹고 빨래방이랑 카페도 들르자!' },
    { who: 'mong', text: '좋아! 근데 왜 가게마다 물건이 다 숨어 있지…?' }] },
  park: { chapter: 5, title: '공원으로 소풍', cast: ['mong', 'frog', 'squirrel'], lines: [
    { who: 'frog', text: '개굴! 배도 불렀으니 공원으로 소풍 가자!' },
    { who: 'squirrel', text: '내가 도토리를 잔뜩 숨겨 놨어. 다 찾으면 같이 먹자!' }] },
  camp: { chapter: 6, title: '산길 따라 캠핑장', cast: ['mong', 'panda', 'sleepy'], lines: [
    { who: 'panda', text: '주말엔 산이지! 산길 따라 올라가면 캠핑장이 있어.' },
    { who: 'sleepy', text: '나는… 텐트에서 자고 있을게… 물건은… 알아서 찾아…' },
    { who: 'mong', text: '등산 시작! 이정표 잘 보고 가자!' }] },
  building: { chapter: 7, title: '빌딩 꼭대기의 비밀', cast: ['mong', 'nerd', 'robot'], lines: [
    { who: 'nerd', text: '몽글아, 연구소 빌딩에 수수께끼 상자가 도착했어.' },
    { who: 'robot', text: '삐빅. 로비부터 옥상까지, 단서가 층마다 숨겨져 있음.' },
    { who: 'mong', text: '마지막 숨바꼭질이다! 옥상까지 가 보자!' }] },
};
// 너굴이's "숨바꼭질 놀이": a few stages run against a clock (the only timed ones), with roomier timers than the model
// ── 레벨 디자인 (2026-10-18, _handoff/level-design-20261018.md; user: "전체 레벨디자인, 보스, 미니게임구성…", "아파트쪽이
// 지겹다… 계속 사는곳만 나오고… 경찰서·소방서·학교"): every region after the first is one line, one entry per stage, room:kind.
// kinds: (none) 사건 판 · gray 흑백 · night 밤 · dark 정전 · timed 너굴이 시간 놀이 · show 장치판 · boss 방탈출 보스.
// Homes and public places take turns; a pretty map comes twice; the same map never twice in a row. A room not built yet
// falls back to the region's pool. 보물 지키기 (boss.js BOSS_AFTER) comes once in the middle of each region.
// 장마다 새 규칙 하나 (10/18 night, the same pass): 2장 비밀번호 · 3장 색깔 · 4장 흑백 · 5장 레버 · 6장 간식 · 7장 관찰 자물쇠, each on
// the chapter's first stage (its 🆕 card comes with the first lock of the kind); 흑백 / 장치 / 미니게임 at most one a chapter,
// 정전 (a light switch) from 6장, after the lever. Kinds as before, plus treat (the host sits on a box till fed).
// (기차 여행 편 10/21 — 사용자 OK, 스토리 룸 기획안 v4; ② 레벨 배치): 20 빌라 옥상 ★(장독대 도르래) · 27 기차역 아침 · 28 기차 객실 ★(3장 시간 판은
// 빠짐) · 29 호수 섬 흑백 · 30 바닷가 가게 ★ · 35 곰제과 · 37 도서관 흑백 · 38 아파트 현관 시간 놀이. 판 종류·자물쇠 자리는 그대로
// (판 자리 되돌리기 10/23 — 사용자 검토 시트 "32 초기맵으로", "33도 초기맵으로… 골목은 33 이후로 나오지 않게"; 스토리 룸·② 레벨):
// 10/22 번호 밀기(RENUM-31to39)를 거꾸로 — 골목 22~31(10판, 31 골목 보스 → ⑧의 별빛극장 cinema가 들어오면 그 키로) · 상가 32~40(9판:
// 32 편의점 흑백 · 33 빨래방 · 38 아파트 현관 시간 판 되살림). 31 긴 객실·32 벚꽃역은 키로만 보관. 25 모퉁이 가게집·64 햇살 책방 다락은 그대로.
// 'new|old': 새 맵이 아직 없으면 옛 맵으로(GPT 맵이 정본에 들어오는 대로 저절로 바뀜)
// GPT 맵 스위치 (① 10/23 — 사용자 "게임처럼 돌려 볼 수 있게 세팅"): ?gptmaps=1이면 PLAN의 'new|old' 판이 GPT 새 맵, ?gptmaps=0이면 옛 맵.
// 한 번 고르면 기억(localStorage gptmaps); 기본은 꺼짐 — 지금 플레이어의 판은 그대로
// (10/23 사용자 "18판 원래 맵으로 돌려줄래? 클로드로 만든 맵으로" — 18판은 스위치와 상관없이 otakuloft; GPT 섞은 안 gptotakumix는 맵만 남김)
export const GPT_MAPS_ON = (() => { try { const q = new URLSearchParams(location.search).get('gptmaps'); if (q === '1' || q === '0') localStorage.setItem('gptmaps', q); return (q ?? localStorage.getItem('gptmaps')) === '1'; } catch (e) { return false; } })();
// 새 맵 스위치 (10/23 사용자 "18~33 거의 다 새로" + 스토리 룸 34~70 표 — 아트 결정은 사용자가 월요일에): ?newmaps=1이면 아래 판이
// 새 맵으로, ?newmaps=0이면 원래대로. 한 번 고르면 기억(localStorage newmaps); 기본은 꺼짐 — 고른 판은 PLAN에 새 키만 넣고 여기서 빼요
// (10/24 사용자 "맵 완성하고 빌드에 넣어 줘": 다 되고 점검을 통과한 판은 기본으로 새 맵 — NEW_DEFAULT. ?newmaps=1은 아직 덜 된 판까지 전부,
// ?newmaps=0은 전부 옛 맵. 기억은 그대로 localStorage newmaps)
export const NEW_MAPS_MODE = (() => { try { const q = new URLSearchParams(location.search).get('newmaps'); if (q === '1' || q === '0') localStorage.setItem('newmaps', q); return q ?? localStorage.getItem('newmaps') ?? 'default'; } catch (e) { return 'default'; } })();
export const NEW_MAPS_ON = NEW_MAPS_MODE !== '0';
export const NEW_DEFAULT = new Set([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 36, 39, 40]);   // 기본으로 새 맵인 판 (점검 통과 + 사용자 거절 없음; 45·49·55·56·58 공원·캠프는 10/24 사용자 "너무 실망"으로 뺌 — ?newmaps=1로만)
export const NEW_MAPS = { 27: 'station4', 28: 'traincar5', 30: 'seaside2', 31: 'cinema', 36: 'stationery', 39: 'cafefreezer', 40: 'undermall', 45: 'starplay', 49: 'picnichill', 55: 'fireflyvalley', 56: 'creekcamp', 58: 'bridgewood' };   // 판 번호 → 새 맵 키 (⑩ 공원·캠프 10/23)
export const PLAN = {
  apt: ['apt', 'police:gray', 'oneroom', 'school', 'aptkitchen:gray', 'otakuloft:timed', 'firestation2|firestation', 'gptvillaroof|villaroof2:show', 'gptpolicefront|policefront:boss'],
  alley: ['street', 'gptalley|alley1', 'skatepark:gray', 'gptcornershop|alley3', 'gptdoghouse|alleyhouse', 'gptstation|station', 'gpttraincar2|traincar3:show', 'island2:gray', 'seaside:show', 'alleywide:boss'],
  shop: ['konbini:gray', 'laundry', 'cafe', 'bearbakery', 'shopmap:night', 'library:gray', 'aptlobby2:timed', 'laundry:show', 'shopmap:boss'],
  park: ['park2', 'park1:gray', 'playground', 'park3', 'playground:night', 'playgroundwide:timed', 'park2:gray', 'parkwide:show', 'playgroundwide:boss'],   // (opens on park2: the playground has no place for a lever)
  camp: ['trail:treat', 'camp1', 'camp2:dark', 'camp3:gray', 'cabin', 'trail:night', 'camp1:timed', 'campwide:treat', 'camp2:gray', 'cabin:show', 'campwide:boss'],
  building: ['lobby', 'kpop', 'museum', 'gptroom1|officefloor:gray', 'rooftop:night', 'lobbymap:timed', 'officefloor:dark', 'kpop:show', 'lobby:gray', 'lobbymap:boss'],
};
// each chapter's locks: the kinds it may use (a boss takes them all), then each stage's locks in order — the chapter's new
// kind first and most, the older ones mixed back in; a timed / ★ / boss stage's entry is not used
const REGION_LOCKS = {
  home: { kinds: ['pad'] },
  apt: { kinds: ['pad', 'code'], plan: [['code'], ['pad'], ['code'], ['code'], ['code'], [], ['pad', 'code']] },
  alley: { kinds: ['pad', 'code', 'color'], plan: [['color'], ['color'], [], ['code'], ['color', 'pad'], ['code'], [], []] },   // (v2: 24·29 are 흑백 — no colour in grey — so the colour lock moves onto 23: 22·23·26 then the boss; alley3 takes no colour lock, and 26 loses it when the padlock goes first)
  shop: { kinds: ['pad', 'code', 'color'], plan: [[], ['pad'], [], ['code'], ['pad', 'code'], []] },   // (the café has nothing that locks; no colour lock at night)
  park: { kinds: ['pad', 'code', 'color', 'lever'], plan: [['lever'], ['pad'], ['code'], ['lever', 'color'], ['pad'], [], ['lever']] },   // (47 park2 흑백 takes the lever too: 41·44·47 then the boss)
  camp: { kinds: ['pad', 'code', 'color', 'lever'], plan: [[], ['lever'], ['pad'], ['code'], ['pad', 'color'], ['lever', 'code'], [], ['pad', 'color', 'lever'], ['code', 'lever']] },
  building: { kinds: ['pad', 'code', 'color', 'lever'], plan: [['code'], ['color'], ['pad', 'code'], ['pad'], ['pad'], [], ['code', 'pad'], [], ['pad', 'color']] },
};
// the extra twists each used to bring along (TV 비밀번호, 찢어진 쪽지, 모래 파기, 짝 양말): off while each chapter teaches
// one thing; switch one back on to make it a chapter's own flavour
const EXTRA = { tv: false, torn: false, dig: false, sock: false };
// 6장 간식: who sits on what, and the snack that moves them (the stage's host guards it; 🆕 간식 card on the first touch)
// (D3 10/19: 간식 a third time on 57판 — the camp's middle, the host on the small tent; 짝 양말 a third time on 36판, the 상가 at night)
const TREAT = { trail: { on: ['shrinebox', 'tentsmall'], item: 'acorn' }, campwide: { on: ['tentsmall'], item: 'acorn' } };
// (55판 반딧불 계곡 fireflyvalley: 옛 산길과 같은 소원 상자·작은 텐트 — parkcamp-maps.js)
TREAT.fireflyvalley = TREAT.trail;
const planAt = (kind) => { const out = []; for (const [rid, list] of Object.entries(PLAN)) { const R = REGIONS.find(q => q.id === rid); list.forEach((e, l) => { if ((e.split(':')[1] || '') === kind) out.push(R.from + l); }); } return out; };
// 너굴이's "숨바꼭질 놀이": a few stages run against a clock (the only timed ones); none in the first region any more —
// the 비밀번호 tutorial (stage 7) used to have the clock on top of it
export const TIMED = new Set(planAt('timed'));
// stage index → character you meet (and can then see around town); 너굴이 comes from the first timed stage you clear
export const CHAR_UNLOCK = { 10: 'cat', 20: 'tv', 30: 'coolcat', 39: 'sundae', 48: 'dj', 59: 'snowy', 69: 'robot' };
export function regionOf(idx) { return REGIONS.find(r => idx < r.to) || REGIONS[REGIONS.length - 1]; }
// lock schedule inside a region (index = stage within the region); the last stage is the region's escape-room boss
// (the old LOCK_PLAN — the same lock order in every region — is REGION_LOCKS above now)
// Timer per stage from the balance pass (tools/balance.py): human-pace bot clear time / (1 - wanted spare time).
// Stages missing here keep their rule-based time. Replace with real playtest numbers when there are some.
// 폰 세로 시작 줌 (0-based; 10/20 레벨·디자인 기획안 D): the wide maps started with things at 17~25 px (19·22·26·27판) and 18·20판's
// house small in the frame; 6판 at 1.3 cut the living room off the left — 1.2 shows both rooms
// (새 맵 10/21, ② 레벨 — 기차 여행 편 v4: 20판 빌라 옥상 7×6은 줌 1(aptmap의 1.2를 뺌), 27판 기차역 10×5는 1.0에서 9개 모두 첫 화면·중앙 30px
// (골목 밤의 1.2를 뺌), 29판 호수 섬 1.15 중앙 35px, 30판 바닷가 1.2 중앙 35px, 35판 곰제과 두 칸 8×5는 1.45에서 23~38px)
// (#94 19~70 10/21~22 — 사용자 "스테이지 19 이후로 이거 엄청 작게": 시작 화면에서 찾을 것이 28px 미만인 판은 줌을 올리고(상한 1.5),
// 넘치면 그 판 물건 크기도 ITEM_TUNE으로 — 측정은 메쉬 크기, 폰 세로 390×844)
// (28판 기차 객실 3차 10/22: 12m 객실을 길이로 비스듬히 보는 판 — 1.4면 앞뒤가 잘려서 1.2, ① 권장 1.15~1.2)
const ZOOM_TUNE = { 5: 1.2, 17: 1.2, 18: 1.25, 20: 1.35, 21: 1.35, 22: 1.1, 25: 1.5, 26: 1.4, 27: 1.2, 28: 1.4, 29: 1.2, 30: 1.5, 33: 1.3, 34: 1.5, 35: 1.5, 36: 1.2, 37: 1.2, 39: 1.5, 42: 1.15, 44: 1.1, 45: 1.45, 47: 1.5, 48: 1.5, 49: 1.35, 53: 1.5, 54: 1.25, 56: 1.5, 58: 1.5, 59: 1.5, 62: 1.15, 63: 1.5, 65: 1.5, 66: 1.45, 69: 1.5 };
// (공원·캠프 새 맵 10/23, parkcamp-maps.js: 둥근 섬이 다 보이는 시작 줌 — 판 번호 표(ZOOM_TUNE)는 옛 맵 값이라 맵 키로 덮어씀)
const ROOM_ZOOM = { fishisle: 1.1, starplay: 1.1, picnichill: 1.1, fireflyvalley: 1.05, creekcamp: 1.2, bridgewood: 1.25 };
// 그 판 물건 크기(기본 .34 = 34cm 기준; 룩이 있는 방은 룩 값): 넓은 맵만 크게
export const ITEM_TUNE = { 25: 0.48, 30: 0.46, 33: 0.44, 34: 0.46, 35: 0.44, 39: 0.5, 45: 0.42, 47: 0.5, 48: 0.5, 53: 0.47, 56: 0.42, 58: 0.42, 59: 0.42, 65: 0.4, 69: 0.45 };
// #94 크기 규칙(목록·자리·자물쇠 칸·작은 물건 안전망 smallfix.js)이 닿는 판: 19판부터 이 판까지 — 장 단위로 늘려 감(30 → 40 → 50 → 70)
export const SIZE_TO = 70;
export const sized = i => i >= 18 && i < SIZE_TO;
// 관찰 자물쇠 판 (판 번호는 1부터): kind 'poster'·'timetable' = 그 그림에서 비밀번호, 없으면 비밀번호는 시계·색깔은 꽃병 세 개
// 27판 방탈출 (② 레벨 10/22, user: "인터렉션 및 방탈출적인 요소 추가되면 재밌을듯"): two locks that hold each other — the coin
// locker's padlock key is in the straw hat on the platform roof (the crossing's freight train blows it down, staging.js), the
// timetable's ★ time opens the ticket window's drawer. Only on a station that has the ticket window (①'s wider station):
// without it the timetable stays on the locker as before.
const HAT_KEY = { 27: { pad: ['coinlocker', 'gpt_locker', 'gpt2_locker'], code: ['ticketoffice', 'gpt_ticketoffice'] } };
const furnTypes = room => { const L = LAYOUTS[room]; if (L) return (L.furniture || []).map(f => f.type); const M = MAPS[room]?.(); return M ? M.rooms.flatMap(r => (r.layout?.furniture || []).map(f => f.type)) : []; };
const OBS_AT = { 19: { kind: 'poster' }, 22: {}, 23: { lock: ['code'] }, 25: {}, 26: { lock: ['code', 'color'] }, 27: { kind: 'timetable' } };
export const TIME_TUNE = { 0: 45, 1: 80, 2: 80, 3: 85, 4: 90, 5: 95, 6: 100, 7: 100, 8: 105, 9: 105, 10: 110, 11: 110 };
// 흑백판: the room has lost its colour; what you find (things AND a few pieces of furniture) gets it back
// (user, 10/17: "흑백인판이 있어서 찾은거는 색칠되게", "가구들같이 큰것들도 찾게 — 난이도 조절용")
// (10/18 밤 user: "좀 더 미니게임과 흑백버전판 늘리는 게 좋을 거 같은데" — two a chapter again, 1장 one: the museum at 10판;
// 흑백 is still finding things, the colour coming back as you do, so the core stays hidden objects)
// (10/19 user: "초반에 흑백 하나 넣어줄래 한 4정도에" — 펭펭이네 다락방 at 4판 comes first, the museum at 10판 second)
export const GRAY = new Set([3, 9, ...planAt('gray')]);
// 숨은그림 되살리기 (10/18, user: "계속 캐릭터가 숨어대니까 짜증난다. 진득하게 숨은그림찾는 코어가 사라진거같아"): the owner
// hides only on these stages (0-based; 1판 is its own tutorial hide) — the ★장치판, three chapter openings where the friend says
// so, 8 (night bedroom, right before the pajama party) and 16 (classroom). Every other ordinary stage is a hidden-object stage
// again, the owner standing by. Story + level sessions' plan: _handoff/stage-mix-plan-20261018.md, level-mix-shape-20261018.md.
// ?mix=0 brings back the 10/17 rule (every ordinary stage a friend hunt) to compare.
export const FRIEND_HIDE = new Set([11, 15, 19, 27, 29, 38, 47, 50, 58, 67]);   // (27 = 28판 기차 객실 ★ — 너굴이가 터널 지나는 사이 숨음, 기차 여행 편 10/21)   // (1장: 1판 tutorial and the 12판 서재 only; 6장's opener is the 간식 stage, so 51판 camp1)
// how many things beside the friend (0-based; else half the stage's count, 2~3): 16판 교실 4 — "물건들 좀 더 찾게 해 줄래? 쉽게
// 느껴짐" (user 10/20, it was 친구+1)
const FRIEND_BONUS = { 15: 4 };
// (D1 10/19, user "추천대로": 22·41판 — 3·5장 첫 판 — are hidden-object stages now; '★장치 → 보스 → 친구' at the chapter turns read
// as three thin stages in a row. The chapter's new lock still sits at a chain end there; the friend says hello in the start line, 스토리 룸)
// 숨은그림 판의 물건 수와 그중 자물쇠 사슬 끝에 있는 물건 수 (stage number from 1; 레벨 세션 B1: ≤ 60 % of the spots you can
// really see on that map, chains ≤ the map's lockable pieces; 32·33·35·61·65 count the spots added 10/18)
const HO_SHAPE = {
  // (19~70 다시 짜기 10/21 — 스토리 룸·② 레벨: 판마다 목록이 8가지라 숨은그림 판은 8개 이하 — 25·26·27·36·43·44·45 → 8; 51~70 숨은그림은 기획대로 6)
  // (1~10판 밸런스 10/19 밤 — 사용자 실폰 30~35분 "막 다시 하고 싶진 않다": 4~11판이 거의 다 7~8개라 판마다 같은 일이었어요.
  // 5판(열쇠를 처음 배우는 판) 7 → 6, 7판(2층집) 8 → 7: 6 · 6 · 7 · 7 · 6 · 7 · 8로 오르고 8판 조립판에서 한숨)
  2: [4, 0], 3: [6, 0], 5: [6, 1], 6: [7, 1], 7: [7, 1], 8: [6, 1],   // (8판 프라모델: 부품 6개, 하나는 자물쇠 뒤)
  9: [7, 1], 11: [7, 1],   // (11판 8 → 7: 1~20판에서 가장 길었어요 — 사람 속도 봇 74초, 앞뒤 판보다 18초; 11~20판 레벨 점검 10/20)
  13: [8, 1], 14: [4, 1], 15: [8, 1], 19: [7, 2],   // (1~30 밸런스 10/20 — user "게임이 전반적으로 쉽다": 2장이 1장 끝보다 가벼웠어요(봇 42~55초 < 52~70초); 14판 흑백 물건 3 → 4, 15판 7 → 8)   // (13판's count is its kit card's — KITS.moving, 7 since 10/20; 19판 8 → 7: the big outdoor map with 24 px things, half of them behind doors, and now 말썽이's first stage — 1~20 한 줄 점검 10/20)
  22: [8, 1], 23: [8, 1], 25: [8, 1], 26: [8, 2], 27: [8, 1],   // (26판 11 → 10: 11개가 다 28px 밑, 사람 속도 봇 84초 — 27판(82초)과 둘이 1~30에서 가장 무거웠어요, 1~30 밸런스 10/20)
  33: [7, 1], 34: [9, 0], 35: [8, 1], 36: [8, 1],   // (35판 곰제과 9 → 8: 사람 속도 봇 77~79초, 1~40판에서 가장 길었어요 — ② 레벨 10/21)
    // (36: the sock puzzle is its second chain — D3)
  41: [8, 1], 43: [8, 1], 44: [8, 2], 45: [8, 1],
  50: [8, 0], 52: [6, 1], 54: [6, 2], 55: [6, 1], 57: [6, 2],   // (57: the snack box is its third chain — D3)
  61: [6, 1], 62: [6, 1], 63: [6, 2], 65: [6, 1], 67: [6, 2],
};
const MIX_OLD = typeof location !== 'undefined' && /[?&]mix=0(&|$)/.test(location.search);   // 12 (was 7; user 10/17: "흑백판 재밌다, 약간 늘려도") — none timed, dark, boss or with a colour lock
// 이삿짐 풀기·파르페 쌓기 (10/19, user picked the story room's ideas ① ②): the same hunt on the kit card (modelkit.js), on
// these stages (0-based) — 13판 우리 아파트 (the last thing in the chapter's code safe), 34판 카페 (no lock)
const KIT_AT = { 12: 'moving', 18: 'firetruck', 33: 'parfait' };   // (19판 미니 소방차 10/20 — its own start zoom and 함정 절반, below)
// (GPT 작업장 맵 ⑥ 10/22 — 사용자 고르기 시트): 36·43~70판 몇 판이 새 맵으로, 옛 맵은 키로 남음 — 판 표는 gpt6-maps.js GPT6_SWAP('옛 맵:판 종류' → 새 맵)
installGpt6(THEMES, MAPS, PLAN);
installRedo7({ LAYOUTS, THEMES, MAPS, NEW_MAPS });
// 18~21판 다시 (① 10/23 — redo1-maps.js): 새 맵 키 설치 + 새 맵 스위치(?newmaps=1)에 등록만, 판 표(PLAN)는 그대로
import { installRedo1 } from './redo1-maps.js';
installRedo1({ LAYOUTS, THEMES, NEW_MAPS });
// 3판 낚시터 ⑩ 안 A' fishing3r · B' fishisle (10/24, 미리보기 ?gptmap=키&lv=3 — 판 표는 그대로)
import { installStage3R10 } from './stage3-r10.js';
installStage3R10({ LAYOUTS, THEMES });
export function stageSpec(idx) {
  idx = Math.max(0, idx);
  if (idx >= STAGE_COUNT) return endlessSpec(idx);
  const s = baseSpec(idx);
  if (KIT_AT[idx]) s.kit = KIT_AT[idx];
  if (s.kit === 'firetruck') { s.zoom = 1.3; s.clutter = .3; s.clueHang = { pad: 'gearrack' }; s.lockOn = { code: ['lockers'] }; }   // (19판 user 10/21 "인터렉션과 방탈출적인 요소": the padlock's key in the 방화복 pocket, drops when it lifts; the locker's code = the clock, 출동 1시 19분 = 119 — plan-19to50)
  if (asRoom(s.room) === 'villaroof2') s.clueHang = { pad: 'roofline' };   // (20판: the padlock's key hangs inside the quilt, drops when it lifts — user 10/21)   // (outdoors, small things: in a little closer — 레벨 세션 10/20)
  // 관찰 자물쇠 (사용자 10/22 시트 '먼저 정할 것' 2·5 "추천대로": 직접 입력 자물쇠는 방 안을 보고 맞히기 — 3장 22판 처음, 23·25·26·27 다시;
  // 시계만 되풀이되지 않게 19판 '119' 포스터, 27판 기차 시간표 — obslock.js). lock: 그 판 자물쇠 종류(기획: 23 알람시계, 26 금고 시계 + 개집 꽃병)
  const ob = OBS_AT[idx + 1];
  if (ob) { s.obs = true; if (ob.kind) s.obsKind = ob.kind; if (ob.lock) s.lock = ob.lock.slice(); }
  const hk = HAT_KEY[idx + 1];
  if (hk && furnTypes(s.room).some(t => hk.code.includes(t))) { s.hatKey = true; s.lock = ['pad', 'code']; s.lockOn = { ...s.lockOn, pad: hk.pad, code: hk.code }; }
  if (STAGE_ITEMS[idx + 1]) s.items = STAGE_ITEMS[idx + 1];   // (19~70 다시 짜기: the stage's own list)
  if (ITEM_TUNE[idx]) s.itemSize = ITEM_TUNE[idx];
  if (TIME_TUNE[idx]) s.time = TIME_TUNE[idx];
  if (ZOOM_TUNE[idx]) s.zoom = ZOOM_TUNE[idx];
  if (ROOM_ZOOM[s.room]) s.zoom = ROOM_ZOOM[s.room];
  if (TIMED.has(idx)) { s.timed = true; s.time = Math.round(s.time * 1.3 / 5) * 5; }
  // (18판 너굴이네 복층 10/22 — 사용자 "현실적인 복층, 방구조 약간 특이하고 장치도 좀", ① otakuloft A안): 비 오는 밤, 너굴이 시간 놀이에
  // 장치 둘 — 다락↔1층 바구니 도르래에 걸린 열쇠가 내려와 경품 오락기 받침(자물쇠)을 열고, 서랍 계단 옆 숨은 칸은 비밀번호;
  // 시작 줌 1.35(1.2에서 오락기 받침 26px·택배상자 27px — #94 28px 기준)
  // (39판 카페 지하 냉동 창고 ② 10/23, ⑨ cafefreezer — 새 맵 스위치로 이 맵일 때만): 열쇠는 사물함, 색은 계단 밑 비품장(두 자물쇠가 다른
  // 가구에), 판 물건은 빨래방 양말·고무 오리 대신 냉동 창고 것
  if (s.room === 'cafefreezer') { s.lockOn = { ...s.lockOn, pad: ['fz_locker'], color: ['fz_supplycab'] }; s.items = ['icecream', 'cheese', 'milk', 'bubbletea', 'cupcake', 'teddy', 'medal']; }
  // (31판 별빛극장 보스 ② 10/23 — 스토리 룸 안 A, ⑧ cinema): 매표소 서랍 = 상영 시간표 비밀번호, 상영관 문 = 열쇠(팝콘 기계가 퐁퐁 하면
  // 위에 걸린 열쇠가 툭), 영사실 문 = 필름 통 셋 색. 보스 판이지만 관찰 단서를 씀(골목 장이 23·26·27판에서 가르친 것이 보스에서 돌아옴)
  if (s.room === 'cinema' && s.boss) Object.assign(s, { zoom: 1.6, itemSize: .6, items: ['star', 'trophy', 'icecream', 'headphones', 'teddy', 'gift', 'candy'], obsBoss: true, obsCine: true, obsKind: 'timetable', lockOn: { code: ['cin_ticketbooth'], pad: ['cin_hall_door'], color: ['cin_projroom_door'] }, clueHang: { pad: 'cin_popcorn' } });
  if (s.room === 'otakuloft') { s.night = true; s.lock = ['pad', 'code']; s.lockOn = { pad: ['arcade3'], code: ['drawerstairs'] }; s.clueHang = { pad: 'loftpulley' }; s.zoom = 1.35; }
  // (18판 새 안 otakuloft3·4·5, ① 10/23: 같은 부품 키라 같은 장치·자물쇠 — 새 맵 스위치로 열릴 때)
  if (s.room === 'otakuloft3' || s.room === 'otakuloft4' || s.room === 'otakuloft5') { s.night = true; s.lock = ['pad', 'code']; s.lockOn = { pad: ['arcade3'], code: ['drawerstairs'] }; s.clueHang = { pad: 'loftpulley' }; s.zoom = 1.35; }
  // (22~26판 다시 만들기 ⑦ 10/23: 새 맵 키의 줌·물건 크기·자물쇠 자리 — redo7/sNN.js)
  if (REDO_SPEC[s.room]) REDO_SPEC[s.room](s, idx);
  // (18판 10/22 사용자 고르기: GPT 너굴이네 비 오는 복층 A — gptotaku|otakuloft; 대본·물건은 asRoom으로 otakuloft 것): 비 오는 밤, 미니 냉장고 자물쇠·계단 옆 수납장 비밀번호
  if (s.room === 'gptotaku' || s.room === 'gptotakumix') { s.night = true; s.lock = ['pad', 'code']; s.lockOn = { pad: ['gpt_minifridge'], code: ['gpt_storage_stairs'] }; s.zoom = 1.85; }   // (줌 1.85: 방을 크게 — 옛 18판처럼, 색 분포 colorstat 엔트로피 1.5→2.0)
  // (GPT 들여온 맵 시작 줌 ① 10/22: GPT 맵은 우리 맵보다 넓게 잡혀 작게 보임 — 방을 크게, 색 분포 colorstat 기준)
  { const Z = { gptfirestation: 1.6, gptvillaroof: 1.3, gptpolicefront: 1.75, gptalley: 2.1, gptcornershop: 1.6, gptstation: 2.2, gpttraincar2: 1.05 }; if (Z[s.room]) s.zoom = Z[s.room]; }   // (② 10/22 밤: 28판 두 량 객차 1.05 — 양쪽 칸 끝까지; GPT 소방서는 1.6 — 왼쪽 계단)
  // (40판 지하상가 undermall ⑨ 10/23: 자물쇠 셋을 맵 가구에 — 열쇠 물품 보관함 · 색 관리실 열쇠 걸이함 · 비밀번호 관리실 금고; 판 전체가 한 화면, 물건은 크게)
  if (s.room === 'undermall') { s.lockOn = { pad: ['um_lockers'], color: ['um_office'], code: ['um_safe'] }; s.itemSize = .64; }
  if (s.boss && s.sock) s.n = Math.max(5, (s.n || 8) - 1);   // (the 상가 boss's fourth lock, the sock: one thing fewer to find)
  if (GRAY.has(idx) && !s.timed && !s.boss) { s.gray = true; s.night = false; if (Array.isArray(s.lock)) s.lock = s.lock.filter(k => k !== 'color'); }   // a colour lock can't be read in grey
  // 사건 판 (10/17 pivot): from stage 3 on, every ordinary stage is a small incident — the owner hides behind a lock and
  // you work your way to them; 흑백판 keep their own colour game, timed and boss stages theirs
  // (대본 10/18: the 열쇠·비밀번호 lessons, tut 4 and 7, are friend-finding stages too; only the two tutorials aren't)
  if (idx >= 2 && !s.timed && !s.boss && !s.gray && !(s.tut <= 2) && (MIX_OLD || FRIEND_HIDE.has(idx))) s.incident = true;
  if (s.incident && FRIEND_BONUS[idx]) s.bonus = FRIEND_BONUS[idx];
  // a hidden-object stage (레벨 세션 B2): hard spots (under / behind) 0 in chapters 1-2, 1 in 3-4, 2 from 5; inside a drawer
  // or door 30 % early, 40 % later
  if (!MIX_OLD && s.tut === 2 && HO_SHAPE[2]) s.n = HO_SHAPE[2][0];   // the things tutorial keeps its own spots, just the count
  if (!MIX_OLD && !s.incident && !s.timed && !s.boss && !(s.tut <= 2)) {   // (4판 key, 7판 code lessons are hidden-object stages too)
    const ch = REGIONS.indexOf(regionOf(idx)), shape = HO_SHAPE[idx + 1];
    if (shape) {   // how many things, and how many of them sit at the end of a lock chain
      s.n = shape[0];
      const kinds = (Array.isArray(s.lock) ? s.lock : s.lock === 'both' ? ['pad', 'code'] : s.lock ? [s.lock] : []).slice(0, s.hatKey ? Math.max(2, shape[1]) : shape[1]);   // (chapter 1 writes one lock as a word)   // (27판 방탈출: both its locks)
      for (const k of REGION_LOCKS[regionOf(idx).id]?.kinds || ['pad']) if (kinds.length < shape[1] && !kinds.includes(k) && !(k === 'color' && (s.gray || s.night || s.dark))) kinds.push(k);   // (only what the chapter has taught)
      s.lock = kinds;
    }
    s.behind = ch < 1 ? 0 : ch <= 3 ? 1 : 2;   // (2장부터 밑·뒤 하나 — 1~30 밸런스 10/20; was 3장부터)
    // 열어야 하는 것 (잠금 안 포함) = n × 30 % (1~2장) / 40 %; minus the chain ends = things found by opening, at least 1,
    // at most 2 in chapter 1 (레벨 세션 비율 가이드 10/18 — GPT QA found 58.5 % inside, "서랍 열기" the user agreed)
    const chains = (Array.isArray(s.lock) ? s.lock.length : 0) + (s.dig ? 1 : 0), open =   // (a sandbox dig is a chain end too — 레벨 세션)
      Math.round((s.n || 6) * (ch <= 1 ? .3 : .4));
    s.ho = true; s.inside = Math.max(1, open - chains); if (ch === 0) s.inside = Math.min(2, s.inside);
  }
  // (#94 10/22: a stage with its own list finds no more than the list — 58·64·69판 흑백, 66판 시간, 59·68판 ★ asked one to three
  // more from the common pool, the ones the story room's lists keep from the stages before)
  if (s.items && sized(idx) && s.n > s.items.length) s.n = s.items.length;
  return gpt6Spec(s);
}
// After stage 50: endless mode, every region in turn, new seed every time, a 4-lock boss every 10th
function endlessSpec(idx) {
  const k = idx - STAGE_COUNT, seed = 50000 + idx * 7919;
  const R = REGIONS[k % REGIONS.length];
  const rooms = R.rooms.filter(r => LAYOUTS[r]);
  const room = rooms[Math.floor(k / REGIONS.length) % rooms.length];
  const boss = k % 10 === 9;
  const MIX = [['pad', 'code'], ['color', 'lever'], ['pad', 'color'], ['code', 'lever'], ['pad', 'code', 'color'], ['lever']];
  const lock = boss ? ['pad', 'code', 'color', 'lever'] : MIX[k % MIX.length];
  const n = Math.min(8, 5 + (k % 4)), hard = boss || k % 5 === 4;
  return { idx, seed, room, region: R.id, n, boss, hard, night: hard && !boss, endless: true, dig: R.id === 'park' && k % 2 === 0, inside: Math.round(n * .5), behind: 2, lock,
    time: Math.round(50 + n * 8 + lock.length * 10 + (boss ? 15 : 0)), clutter: .8 };
}
function baseSpec(idx) {
  const seed = 1000 + idx * 7919;
  if (idx < STAGES.length) return { ...STAGES[idx], idx, seed, region: 'home', ...(idx === 0 ? { intro: true, chapter: 'home' } : {}) };   // (1판: 1장's card — UI 세션 10/20)
  const R = regionOf(idx), ri = REGIONS.indexOf(R);
  const local = idx - R.from, len = R.to - R.from, d = local / Math.max(1, len - 1);
  const built = R.rooms.filter(k => LAYOUTS[k]);
  const pool = built.length ? built : REGIONS[0].rooms;
  // maps grow through a region: small rooms first, then wide maps every other stage, the boss on the widest
  const wide = (R.wide || []).filter(k => MAPS[k]);
  // small rooms take turns by how many small stages came before (counting by stage number bunched the same room up
  // three times when wide maps sat in between)
  const isWide = l => wide.length && (l === len - 1 || (l >= 5 && l % 2 === 1));
  let nth = 0, wn = 0; for (let l = 0; l < local; l++) if (!isWide(l)) nth++; else wn++;
  // wide maps take turns too (by stage number they never did: the wide stages are all odd, so a pair always gave the second)
  const P = (PLAN[R.id] || [])[local];
  let room = isWide(local) ? wide[wn % wide.length] : pool[nth % pool.length], kind = '';
  if (P) { const [r0, k0 = ''] = P.split(':'); kind = k0; const ks = r0.split('|'), r1 = (GPT_MAPS_ON ? ks : ks.slice(-1)).find(k => LAYOUTS[k] || MAPS[k]); if (r1) room = r1; }
  { const nk = NEW_MAPS_ON && (NEW_MAPS_MODE === '1' || NEW_DEFAULT.has(idx + 1)) && NEW_MAPS[idx + 1]; if (nk && (LAYOUTS[nk] || MAPS[nk])) room = nk; }   // 새 맵 스위치
  const boss = P ? kind === 'boss' : local === len - 1;
  const RL = REGION_LOCKS[R.id];
  let lock = (boss ? RL?.kinds : RL?.plan?.[local]) || [];
  if (room === 'kpop') lock = ['color', ...lock.filter(k => k !== 'color')];   // the stage curtain opens to the fans' colours (placed first so it gets the curtain)
  // easier all round (user, 10/17: "게임 ㅈㄴ 어렵다.. 레벨 벨런스를"): fewer things to find, fewer tucked inside, fewer decoys
  const n = Math.min(7, 3 + Math.round(d * 3) + (ri >= 3 ? 1 : 0)) + (MAPS[room] ? Math.min(1, MAPS[room]().nBonus || 0) : 0);
  return {
    // the old silhouette-only stages are night stages now: moonlight, stars, still easy to see (user, 10/17: "실루엣만 찾아봐는 빼고 밤씬이")
    // (one stage before the first wide map: on local 5 every region's new two-storey house came out in moonlight)
    idx, seed, room, region: R.id, n, boss, hard: boss, night: P ? kind === 'night' : local % 6 === 4 && !boss, showcase: kind === 'show',
    inside: Math.round(n * (.25 + .1 * d)), behind: d > .6 ? 1 : 0, lock,
    time: Math.round(55 + n * 7 + lock.length * 9 - d * 6 + (boss ? 15 : 0)), clutter: .42 + d * .18,
    intro: local === 0, chapter: REGION_INTRO[R.id] ? R.id : null,
    torn: EXTRA.torn && ri >= 1 && (boss || local % 3 === 1),
    dig: EXTRA.dig && R.id === 'park' && (boss || local % 2 === 0),
    tv: EXTRA.tv && R.id === 'apt' && lock.includes('code'),
    // 4장's new thing: the laundromat's pair puzzle (흑백 comes from 1장 now) — and once more on the 상가 boss, whose laundry
    // corner has the same washers (리포트 v3 개선 2: a chapter's rule comes back at its boss)
    sock: (EXTRA.sock || R.id === 'shop') && ((room === 'laundry' && kind !== 'show') || room === 'shopmap'),   // (not on 39판's gadget stage — QA N7, user 10/19; 36판 too — D3)
    dark: P ? kind === 'dark' : false,
    // 6장 간식: 50판 teaches it, the night trail (55판) uses it again — 졸졸이 dozes on the box (리포트 v3 개선 3)
    treat: kind === 'treat' || (kind === 'night' && R.id === 'camp') ? TREAT[room] || null : null,
  };
}
// Every stage stands on ground that runs on past it (bleed) — no floating diorama slab (user, 2026-10-15).
// A layout can still opt out with bleed: null.
// raw: the layout as written here, without the player's own 배치 편집 fixes (layedits.js)
export function layoutFor(roomKey, raw = false) {
  if (MAPS[roomKey]) { const m = MAPS[roomKey](); if (m.bleed === undefined) m.bleed = true; m.rooms.forEach(r => { r.layout = { ...r.layout, tidy: true }; }); return raw ? m : applyEdit(roomKey, m); }
  const L = { w: 5, d: 5, theme: THEMES[roomKey], bleed: {}, ...LAYOUTS[roomKey], tidy: true };
  return raw ? L : applyEdit(roomKey, L);
}

// (and at the size it will be drawn: its box and the room round it — fitspot.js, 10/19 user "새집 안 축구공", "뚫려 있다")
// (loose: the headroom only, as before — a lock's last chance, so a lock never goes missing)
const fits = (type, s, role, loose) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat) && (loose || spotFits(type, s, role));

// Mount a lever (or a light switch) where it stays visible: a free wall slot, else a free back-edge tile.
function mountLever(room, r, pref = null, kind = 'lever') {
  const RS = room.rooms || [room];
  const slots = [];
  // a lever must stay visible: skip wall slots that already carry decor or stand behind tall furniture
  const TALL = ['wardrobe', 'bookshelf', 'fridge', 'plant', 'lamp', 'tvstand', 'boxes', 'dishcab', 'cattower', 'fishtank', 'vending', 'pole', 'shopfront', 'stairs', 'clothesline', 'tree', 'pine', 'tent', 'slide', 'swing'];
  for (const Rm of RS) {
    const mountable = w => ['wall', 'alleywall'].includes(Rm.walls[w]?.kind || 'wall');
    const tileOf = (w, u) => w === 'N' ? [Math.floor(u + Rm.w / 2), 0] : w === 'S' ? [Math.floor(-u + Rm.w / 2), Rm.d - 1] : w === 'W' ? [0, Math.floor(-u + Rm.d / 2)] : [Rm.w - 1, Math.floor(u + Rm.d / 2)];
    const hLim = kind === 'lightswitch' ? 1.2 : 1.0;   // (a switch plate sits at 1.1 m: a dresser with a jar on top doesn't hide it — 9판)
    const blocked = (w, u) => { const [ti2, tj] = tileOf(w, u); return Rm.furns.some(f => { if (!TALL.includes(f.type) && !((f._ht ??= new THREE.Box3().setFromObject(f.f.group).max.y - Rm.group.position.y) > hLim)) return false; const [fw, fd] = Rm.footprint(f.type, f.rot); return ti2 >= f.i && ti2 < f.i + fw && tj >= f.j && tj < f.j + fd; }); };
    const half = Math.max(Rm.w, Rm.d) / 2 - .6;
    const gap = kind === 'lightswitch' ? .5 : .95;   // (a switch plate is small: it fits between a mirror and a towel rack)
    for (const w of ['N', 'W', 'E', 'S']) for (let u = -half; u <= half + .01; u += kind === 'lightswitch' ? .5 : 1) if (mountable(w) && !Rm.decors.some(d => d.wall === w && Math.abs(d.u - u) < gap) && !blocked(w, u)) slots.push([Rm, w, u]);
  }
  let lv = null;
  // (pref [[room, wall], …]: a stage that wants it where the start view sees it — the first of those with room, else any back wall
  // (N·W face the start view), else anywhere — 9판's switch, ② 10/23: on a front wall it folded away with the wall)
  let pool = slots;
  let aimed = false;   // (lightAt [room, wall, u]: the free place on that wall nearest u — a point the start view sees, 9판)
  if (pref) { pool = slots.filter(([, w]) => w === 'N' || w === 'W'); for (const [ri, wl, u0] of pref) { let want = slots.filter(([Rm, w]) => Rm === RS[ri] && w === wl); if (want.length) { if (u0 != null) { want = want.slice().sort((a, b) => Math.abs(a[2] - u0) - Math.abs(b[2] - u0)); aimed = true; } pool = want; break; } } }   // (no back wall free: it stands on a back-edge tile instead, below)
  if (kind === 'lightswitch' && !aimed) pool = pool.slice().sort((a, b) => Math.abs(a[2]) - Math.abs(b[2]));   // (the switch: the middle of its wall, toward the middle of the start view)
  if (pool.length) { const [Rm, w, u] = pool[aimed ? 0 : Math.floor(r() * Math.min(pool.length, kind === 'lightswitch' ? 2 : 6))]; lv = Rm.addDecor(kind, w, u); }
  else {
    // back-edge tiles first (they never stand in front of anything), turned to face the middle
    const fa = room.L.friendAt || [99, 99];
    const tiles = [];
    for (const Rm of RS) {
      const o = Rm.group.position;
      for (let j = 0; j < Rm.d; j++) for (let i = 0; i < Rm.w; i++) {
        if (!Rm.canPlace('leverpost', i, j, 0) || Math.hypot(o.x + i - Rm.w / 2 + .5 - fa[0], o.z + j - Rm.d / 2 + .5 - fa[1]) < 1.1) continue;
        const edge = j === 0 ? 0 : i === 0 ? 1 : i === Rm.w - 1 ? 3 : j === Rm.d - 1 ? 2 : -1;
        tiles.push({ Rm, i, j, rot: edge < 0 ? 0 : edge, score: edge === 0 || edge === 1 ? 0 : edge < 0 ? 1 : 2 });
      }
    }
    tiles.sort((a, b) => a.score - b.score);
    const best = tiles.filter(t => t.score === tiles[0]?.score);
    if (!best.length) return null;
    const t = best[Math.floor(r() * best.length)];
    lv = t.Rm.addFurniture('leverpost', t.i, t.j, t.rot);
  }
  return lv;
}

// a 장치판's chain piece that a thing on the list would look like (39판 빨래방: the dryer's 500원 동전 next to a 동전 지갑 on the list
// read as one thing — 리포트 v3 P2, 11~70판 레벨 세션 10/19): kept off the list and the decoys on that stage
const DEVICE_LOOKALIKE = { laundry: ['coin'] };
// Decide what goes where. Works on the built Room's spots.
export function planStage(room, spec, story = null) {
  const r = rng(spec.seed);
  // the park's dig puzzle: a red X in the sandbox, and a 모래삽 hidden somewhere to dig it with
  let dig = null;
  if (spec.dig) {
    const sb = (room.rooms || [room]).flatMap(Rm => Rm.furns).find(e => e.type === 'sandbox' || e.type === 'sandbox2');
    if (sb) dig = digPatch(sb.f, room.T || {});
  }
  // the apartment's TV puzzle: the password of the code lock is on TV, and the TV needs the remote
  let tv = null;
  if (spec.tv) { const e = (room.rooms || [room]).flatMap(Rm => Rm.furns).find(e => e.type === 'tvlow'); if (e) tv = tvPuzzle(e.f); }
  // a part that may only open a crack (a rug with a table on it, a gate against a vending machine) hides nothing
  // 숨은그림 판: places no view can see into, even opened (measured per room, src/hunt-blind.js), are never used
  // (a drawer or door whose front looks into a wall close by holds nothing — facing.js, user 10/19 9·10판)
  const all = room.spots.filter(s => !s.reserved && !s.hang && (!s.part || ((s.part.reach ?? 1) >= .55 && !s.part.wallFacing)) && !spec.avoid?.(s));   // (a pulley's top hook only ever holds the stage's own key — clueHang)
  const used = new Set();
  let relaxAff = false;   // (a lock that would otherwise go missing takes what there is — 13판's moving boxes in the fridge)
  let relaxFit = false;   // (…and, last of all, a place a little tight for it: drawn smaller — fitspot.js)
  // (10/19: a thing on the list goes where it can be drawn at its full size first — a low shelf gap kept a juice box at 21 px)
  let placingTarget = false;
  const roomy = (type, s) => ITEMS[type]?.flat || (s.maxH + .02) / Math.max(.01, (ITEMS[type]?.h || .2) * (s.scale || 1)) >= 1.25;
  const take = (pred, type) => {
    const pool = all.filter(s => !used.has(s) && pred(s) && (!type || (fits(type, s, undefined, relaxFit) && (relaxAff || affOk(type, s)))));   // (affinity.js: nothing inside where it makes no sense)
    const roomyPool = placingTarget && type ? pool.filter(s => roomy(type, s)) : pool;
    // (3판: a place the story room picked for this thing first — affinity.js PLACE, 10/19)
    const likePool = placingTarget && type ? roomyPool.filter(s => placeLike(type, s)) : [];
    // (1장: a place where the thing is drawn at its full size first — 검토 10/20: under 28 px went from 16% to 32% of 1~10판's
    // things; not shrinking, but low places and small place scales — fitspot.js fullSize)
    // (19판부터 10/21, 사용자 "스테이지 19 이후로 이거 엄청 작게 여기저기 나오는데" — #94: the full-size rule for every stage from 19판, the
    // story room's own place too: a shelf gap or a box that would draw it at half size only when nothing else is left)
    const late = sized(spec.idx);
    const bigPool = placingTarget && type && (late || !likePool.length && (spec.idx ?? 99) < 12) ? (roomyPool.length ? roomyPool : pool).filter(s => fullSize(type, s, late ? .33 : .29)) : [];
    const likeBig = late && likePool.length ? likePool.filter(s => fullSize(type, s, .33)) : likePool;
    const c = r.shuffle(likeBig.length ? likeBig : bigPool.length ? bigPool : roomyPool.length ? roomyPool : pool);
    if (!c.length) return null;
    // (the one picked tried with the thing's own shape — fitspot.js shapeFits; the next one if it would be drawn too small)
    const pick = !type || relaxFit ? c[0] : c.find(s => shapeFits(type, s)) || null;
    if (!pick) return null;
    used.add(pick); return pick;
  };
  // a theme can bring its own things to find first (the everyday rooms hide a remote, slippers, a tangerine…)
  // (B-1 그 집 물건 10/18: nearly the whole list from the place's own things — n−1, n−2 from 8 up; socks only at the laundromat)
  const own = (ROOM_POOLS[spec.room] || ROOM_POOLS[asRoom(spec.room)] || room.T?.pool || []).filter(t => ITEMS[t] && (!SOCKS.has(t) || sockRoom(spec.room)));   // (a GPT map under a new key: its old map's things — roomalias.js)
  const ownN = Math.min(own.length, Math.max(1, (spec.n || 1) - (spec.n > 7 ? 2 : 1)));
  // the first stages only ask for things with a readable shape (a thin pencil under a loft was hard even with a hint)
  // (19~70 다시 짜기 10/21: the stages SIZE_TO covers too, not 1~20 only — 31·49판 bosses still drew 이어폰·영수증·머리핀 at 15~19 px)
  const THIN = ['pencil', 'usb', 'earphones', 'receipt', 'postit', 'hairpin', 'idcard', 'toothbrush'];   // (+ toothbrush: 17 px on 9판, 10/19)
  const SMALL_MODEL = ['keyring', 'lottery', 'coin', 'soap'];   // (19판부터 #94 10/21: 열쇠고리 손톱만 하게 — 17~20 px on 21·31판; 1~18판 as they are; 비누: 시트 3번 12종 10/22)
  // (짝 양말 판: no pair of socks on the list either — it would read as the puzzle's sock, and the odd ones lying about say "무늬가 달라")
  const tool = t => (dig && t === 'shovel') || (tv && t === 'remote') || (spec.sock && SOCKS.has(t)) || (spec.idx >= 0 && (spec.idx < 20 || sized(spec.idx)) && THIN.includes(t)) || (sized(spec.idx) && SMALL_MODEL.includes(t))   /* (1~20판: no pencil or USB on the list — 19 px on a phone, user 10/19 "너무 작게 하지 마"; 11~20판 too, 10/20: 11판 연필, 13판 칫솔) */
    || (spec.showcase && DEVICE_LOOKALIKE[spec.room]?.includes(t)) || (spec.treat && t === spec.treat.item);   // a stage's tool is never a target or a decoy (간식: 50·55판 listed a 도토리 beside the 도토리 that moves the host)
  // the common things rotate through the stages (a window that moves on 5 places a stage) so the same milk carton
  // doesn't turn up stage after stage (user, 10/17: "계속 찾는것만 찾게"); the place's own things come first
  const common = TARGET_POOL.filter(t => !own.includes(t) && !tool(t)), off = ((spec.idx ?? 0) * 5) % Math.max(1, common.length);
  const turn = [...common.slice(off), ...common.slice(0, off)];
  // the place's own things rotate too: neighbouring stages of one region take different ones
  const mine = own.filter(t => !tool(t)), oo = mine.length ? ((spec.idx ?? 0) * ownN) % mine.length : 0;
  const ownTurn = [...mine.slice(oo), ...mine.slice(0, oo)];
  // (and not what the last three stages you played asked for, while there is anything else — 10/20, user "비슷한 방이 계속
  // 나옴": 1~20판 103 things were 40 kinds, a star, a ball, a duck, a tangerine and a slipper five times each; stage.js keeps
  // save.recentT)
  const recent = new Set(spec.recentTypes || []), fresh = l => [...l.filter(t => !recent.has(t)), ...l.filter(t => recent.has(t))];
  const feat = (ROOM_FEATURE[spec.room] || ROOM_FEATURE[asRoom(spec.room)] || []).filter(t => ITEMS[t] && !tool(t) && own.includes(t));
  const ownT = [...feat, ...fresh(ownTurn).filter(t => !feat.includes(t))], turnT = fresh(turn);
  const targets = [...r.shuffle(ownT.slice(0, ownN)), ...r.shuffle(turnT.slice(0, Math.max(6, spec.n))), ...turnT.slice(Math.max(6, spec.n))].slice(0, spec.n);
  // (19~50 다시 짜기 10/21): a stage with its own list takes only from it (socks still only at the laundromat), the common pool
  // only if the list runs short
  const fixed = spec.items && spec.items.filter(t => ITEMS[t] && !tool(t) && (!SOCKS.has(t) || sockRoom(spec.room)));
  if (fixed?.length) { const f = r.shuffle(fixed.slice()); targets.length = 0; targets.push(...f.slice(0, spec.n)); for (const t of turnT) if (targets.length < spec.n && !targets.includes(t)) targets.push(t); }
  if (spec.force) { targets.unshift(...spec.force); targets.length = Math.min(targets.length, spec.n); }   // 사건 판: the hidden friend's marker comes first, so the first lock guards it
  const placements = [];   // { type, spot, role: 'target'|'key'|'note'|'decoy', code }
  const locks = [];        // { part, kind, code }
  let ti = 0;
  // Locks: pick every locked part first, hide one target inside each, then put each lock's clue (key, password note,
  // colour card) somewhere outside ALL locked parts so no chain can deadlock. A lever lock has no clue item: a lever
  // is mounted on a free wall instead.
  const chainPlaced = [];
  if (story?.chain) {
    const C = story.chain;
    const pick = types => { for (const t of types) { const p = room.parts.find(q => q.lockable && q.spots.length && q.furn.type === t && !locks.some(l => l.part === q)); if (p) return p; } return null; };
    const onPart = pick(C.treatOn), inPart = pick(C.treatIn);
    const frame = room.decors.find(d => d.type === 'puzzleframe');
    if (onPart && inPart) {
      const code = String(r.int(100, 999));
      locks.push({ part: inPart, kind: 'code', code, puzzle: frame || null, chain: true });
      locks.push({ part: onPart, kind: 'treat', code: 'treat', chain: true, sitter: story.cast });
      const hs = take(x => x.part === onPart, C.hero), ts = take(x => x.part === inPart, C.treat);
      if (hs) chainPlaced.push({ type: C.hero, spot: hs, role: 'target', hero: true });
      if (ts) chainPlaced.push({ type: C.treat, spot: ts, role: 'treat', forPart: onPart });
      // no picture on the wall: fall back to a code note somewhere open
      if (!frame) { const ns = take(x => !x.part || (x.part !== onPart && x.part !== inPart), 'note'); if (ns) chainPlaced.push({ type: 'note', spot: ns, role: 'note', code, forPart: inPart }); }
    }
  }
  // 6장 간식 (no story chain): the stage's host sits on a box until you bring the snack lying out in the open; one of the
  // things to find is in that box
  if (!chainPlaced.length && spec.treat && ITEMS[spec.treat.item]) {
    const sit = q => q.lockable && q.spots.length && (q.reach ?? 1) >= .55 && !q.noHide;
    const onPart = spec.treat.on.map(t => room.parts.find(q => sit(q) && q.furn.type === t)).find(Boolean) || room.parts.find(sit);
    // (the box and the snack never go missing: a little tight if that's all there is — fitspot.js, 50·55판 10/19)
    let ht = onPart && targets.find(t => onPart.spots.some(x => !used.has(x) && fits(t, x)));
    if (onPart && !ht) { relaxFit = true; ht = targets.find(t => onPart.spots.some(x => !used.has(x) && fits(t, x, undefined, true))); }
    const hs = ht && take(x => x.part === onPart, ht);
    relaxFit = false;
    let ts = hs && (take(x => x.kind === 'on' && x.part !== onPart, spec.treat.item) || take(x => x.part !== onPart && !x.part, spec.treat.item));
    if (hs && !ts) { relaxFit = true; ts = take(x => x.part !== onPart && !x.part, spec.treat.item); relaxFit = false; }
    if (ts) {
      locks.push({ part: onPart, kind: 'treat', code: 'treat', chain: true });
      targets.splice(targets.indexOf(ht), 1);
      chainPlaced.push({ type: ht, spot: hs, role: 'target', own: true }, { type: spec.treat.item, spot: ts, role: 'treat', forPart: onPart });
    } else if (hs) { used.delete(hs); }
  }
  const lockKinds = spec.lock === 'both' ? ['pad', 'code'] : Array.isArray(spec.lock) ? spec.lock : spec.lock ? [spec.lock] : [];
  const prefer = { pad: ['chest', 'mailbox', 'cooler', 'bike', 'picnic', 'tent'], code: ['safe', 'vending', 'shopfront', 'lostbox', 'trunk', 'slide'], color: ['kpopstage', 'wardrobe', 'chest', 'safe', 'gate', 'parkbin', 'trunk'], lever: ['wardrobe', 'safe', 'chest', 'aircon', 'firewood', 'slide'] };
  for (const lk of lockKinds) {
    // (10/19: no lock that faces a wall (facing.js), and a lock only where something on the list may sensibly be inside
    // (affinity.js) — but a lock never goes missing for it: 13판's code lesson lost its fridge when only boxes were left)
    const all0 = room.parts.filter(p => p.lockable && p.spots.length && (p.reach ?? 1) >= .55 && !locks.some(l => l.part === p));
    const okWall = p => !p.wallFacing && !p.lockWallFacing, holds = p => p.spots.some(s => targets.slice(ti).some(t => fits(t, s) && affOk(t, s)));
    let free = all0.filter(p => okWall(p) && holds(p));
    // (#94 10/22: not a piece where nothing on the list keeps its size — a 우편함, a 돈통, a 종이 수거함 drew it at 14~24 px; the story's
    // own pieces (spec.lockOn, never taken by another lock) and the hidden friend's hideout stay as they were)
    if (sized(spec.idx) && !spec.lockOn?.[lk] && !(spec.hideout && lk === lockKinds[0])) { const theirs = Object.values(spec.lockOn || {}).flat(), roomy = free.filter(p => !theirs.includes(p.furn.type) && p.spots.some(x => targets.slice(ti).some(t => fits(t, x) && affOk(t, x) && fullSize(t, x, .29)))); if (roomy.length) free = roomy; }
    if (!free.length) free = all0.filter(holds);
    if (!free.length) free = all0.filter(okWall);
    if (!free.length) free = all0;
    const pref = spec.lockOn?.[lk] || prefer[lk] || [];
    // 사건 판: the friend hides in the first hideout-like piece (wardrobe, fridge, chest…) in that order, else the biggest
    // lockable piece — never the region's favourite small box (a coin changer is no hideout)
    let part = null;
    if (spec.hideout && lk === lockKinds[0]) {
      const hf = free.filter(p => !p.noHide);   // a till's cash drawer is lockable but no hideout (레벨 세션 10/18)
      for (const t of spec.hideout) if ((part = hf.find(p => p.furn.type === t))) break;
      const vol = p => { const f = FURN_INFO[p.furn.type] || {}; return (f.w || 1) * (f.d || 1) * (f.h || 1); };
      part ||= hf.slice().sort((a, b) => vol(b) - vol(a))[0] || null;
    }
    part ||= free.find(p => pref.includes(p.furn.type)) || free.find(p => p.lockKind === lk) || free[0];
    if (!part) continue;
    const code = lk === 'color' ? [0, 1, 2].map(() => r.int(0, 4)).join('') : String(r.int(100, 999));
    const L = { part, kind: lk, code };
    if (lk === 'lever') {
      const lv = mountLever(room, r);
      if (!lv) continue;
      L.lever = lv.f.parts[0]; L.lever.leverFor = part;
    }
    locks.push(L);
  }
  if (dig) locks.push({ part: dig, kind: 'dig', code: 'dig' });
  // the laundromat's pair puzzle: a washer door won't open until you bring the missing sock of the one pinned on it
  if (spec.sock) {
    // (a washer door whose inside the 숨은그림 table marks as unseeable would lose its sock and the whole puzzle — prefer one
    // with a place you can see; 검토 세션 10/18)
    const wds = room.parts.filter(p => p.furn.type === 'washer3' && p.spots.length && (p.reach ?? 1) >= .55 && !locks.some(l => l.part === p));
    const wd = r.shuffle(wds.filter(p => p.spots.some(s => !spec.avoid?.(s))))[0] || r.shuffle(wds)[0];
    if (wd) locks.push({ part: wd, kind: 'sock', code: String(r.int(0, 3)) });
  }
  placements.push(...chainPlaced);
  if (chainPlaced.some(p => p.hero)) targets.pop();   // the hero item takes one of the target slots
  // every lock guards a target: if the next target is too big for it, swap in one that fits; a lock nothing fits in is
  // dropped (an empty locked box after collecting its key felt like a cheat — GPT QA 10/17, stages 29·48·60·70)
  for (let li = 0; li < locks.length; li++) {
    const L = locks[li];
    if (L.chain) continue;
    let s = null;
    // (#94: the thing that keeps its size in there first — never the hidden friend's marker, which goes first into its hideout;
    // the pieces stay the ones the stage always picked — 19판 사물함·28판 간식 카트 are the story's; smallfix.js sees to the size)
    const big = sized(spec.idx) && targets[ti] !== 'friendtoken';
    if (big) for (let k = ti; k < targets.length && !s; k++) if ((s = take(x => x.part === L.part && fullSize(targets[k], x, .33), targets[k]))) [targets[ti], targets[k]] = [targets[k], targets[ti]];
    for (let k = ti; k < targets.length && !s; k++) if ((s = take(x => x.part === L.part, targets[k]))) [targets[ti], targets[k]] = [targets[k], targets[ti]];
    // (then a little tight but where it makes sense, then anything: 43·45판's recycling bins, 50판's shrine box — 10/19)
    for (const [fit, aff] of [[true, false], [true, true]]) {
      if (s) break;
      relaxFit = fit; relaxAff = aff;
      for (let k = ti; k < targets.length && !s; k++) if ((s = take(x => x.part === L.part, targets[k]))) [targets[ti], targets[k]] = [targets[k], targets[ti]];
      relaxFit = relaxAff = false;
    }
    // (nothing on the list goes in that piece at all: the lock moves to another lockable piece something does go in, before it
    // would go missing — 13판's code lesson, the chapter's new lock, lost its piece when the moving-box card changed; 10/20)
    if (!s && !L.lever) {
      const alt = room.parts.filter(p => p !== L.part && p.lockable && p.spots.length && (p.reach ?? 1) >= .55 && !locks.some(l => l.part === p) && !p.wallFacing && !p.lockWallFacing);
      for (const p of alt) {
        for (const [fit, aff] of [[false, false], [true, false], [true, true]]) {
          relaxFit = fit; relaxAff = aff;
          for (let k = ti; k < targets.length && !s; k++) if ((s = take(x => x.part === p, targets[k]))) [targets[ti], targets[k]] = [targets[k], targets[ti]];
          relaxFit = relaxAff = false;
          if (s) break;
        }
        if (s) { L.part = p; break; }
      }
    }
    if (s) placements.push({ type: targets[ti++], spot: s, role: 'target' });
    else { if (L.lever) L.lever.leverFor = null; locks.splice(li--, 1); }
  }
  const inLocked = x => x.part && locks.some(l => l.part === x.part);
  for (const L of locks) {
    if (L.kind === 'lever' || L.chain) continue;
    if (L.kind === 'code' && tv && !tv.lock) {
      tv.lock = L; L.tv = true;
      const rs = take(x => !inLocked(x) && x.kind !== 'on', 'remote') || take(x => !inLocked(x), 'remote');
      if (rs) { placements.push({ type: 'remote', spot: rs, role: 'tool', forPart: L.part }); continue; }
      tv.lock = null; L.tv = false;   // nowhere for the remote: a plain note after all
    }
    const chainType = { pad: 'key', code: 'note', color: 'colornote', dig: 'shovel', sock: 'sockp' }[L.kind];
    const role = { pad: 'key', code: 'note', color: 'color', dig: 'tool', sock: 'sock' }[L.kind];
    if (L.kind === 'sock') {
      // the odd socks lying about: every other pattern once, so the match is a real look-and-compare
      for (let q = 0; q < 4; q++) if (String(q) !== L.code) { const ds = take(x => !inLocked(x), 'sockp'); if (ds) placements.push({ type: 'sockp', spot: ds, role: 'decoy', code: String(q) }); }
    }
    if (L.kind === 'code' && spec.torn) {
      for (let k = 0; k < L.code.length; k++) {
        const ps = take(x => !inLocked(x) && x.kind !== 'on', 'notepiece') || take(x => !inLocked(x), 'notepiece');
        if (ps) placements.push({ type: 'notepiece', spot: ps, role: 'note', code: L.code, piece: k, forPart: L.part });
      }
      continue;
    }
    // a stage can say where a clue waits (2층집: the key comes down in the pulley basket)
    // (never on the very piece it opens: 8판's key sat on top of its own wardrobe — 1~10판 레벨 세션 10/19)
    const away = x => (x.furn || x.part?.furn) !== L.part.furn;
    // (a place the stage names — 7판's key coming down in the pulley basket — is the design: headroom only there)
    let named = null, hang = null;
    // (7판: on the pulley's top hook, out of reach — the basket's own place kept empty to catch it; user 10/20)
    if (spec.clueHang?.[L.kind]) {
      named = room.spots.find(x => x.hang && x.furn?.type === spec.clueHang[L.kind] && !used.has(x) && fits(chainType, x, undefined, true)) || null;
      if (named) { used.add(named); hang = named.hang; for (const x of all) if (x.part === hang) used.add(x); }
    }
    if (!named && spec.clueIn?.[L.kind]) { relaxFit = true; named = take(x => x.furn.type === spec.clueIn[L.kind] && x.part && !inLocked(x), chainType); relaxFit = false; }
    const cs = named
      || (spec.clueOn?.[L.kind] && take(x => !inLocked(x) && x.kind === 'on' && away(x) && (spec.clueRoom == null || !!room.rooms?.[spec.clueRoom]?.spots.includes(x)) && spec.clueOn[L.kind].some(w => (x.furn?.type || '').includes(w)), chainType))   // (9판: the key in the bathroom, by the plant at its door — 검토 P1-4)
      || (spec.ho && take(x => !inLocked(x) && x.kind === 'on' && away(x), chainType))   // 숨은그림 판: a key / note / card is where you can see it
      || take(x => !inLocked(x) && x.kind !== 'on' && away(x), chainType) || take(x => !inLocked(x) && away(x), chainType) || take(x => !inLocked(x), chainType)
      || ((relaxFit = true), take(x => !inLocked(x), chainType));   // (a clue never goes missing either)
    relaxFit = false;
    if (cs) placements.push({ type: chainType, spot: cs, role, code: L.code, forPart: L.part, ...(hang && cs === named ? { hang } : {}) });
  }
  const lockedParts = new Set(locks.map(l => l.part));
  const partsUsed = new Set();
  const want = { inside: spec.inside || 0, behind: spec.behind || 0 };
  // 숨은그림 판 (10/18): about half the things go where the host would put them (곰돌이 by food, 개굴이 by water…) —
  // knowing the friend helps you look ("이 친구라면 여기 숨겼겠지")
  room.group.updateMatrixWorld(true);
  const habit = habitSpot(spec, room);   // (affinity.js: by name, 7판's 'high up', 9판's bathroom)
  // 숨은그림 판: one thing to open per piece of furniture (emptying a chest of drawers isn't looking), and the first
  // free find in plain sight (a first success inside 10 s)
  const furnUsed = new Set(), fk = x => x.furn || x.part?.furn;
  const okIn = x => !spec.ho || !furnUsed.has(fk(x));
  let firstFree = !!spec.ho;
  // (9판: one thing waits in the tub by the bubbles — 몽글이's "…거품 속에." is the one line that names a place; 스토리 룸 10/19)
  if (spec.sureIn) for (let k = ti; k < targets.length; k++) {
    const s = take(x => x.kind === 'inside' && x.furn?.type === spec.sureIn && x.part && !lockedParts.has(x.part) && !x.part.wallFacing, targets[k]);
    if (!s) continue;
    [targets[ti], targets[k]] = [targets[k], targets[ti]]; placements.push({ type: targets[ti++], spot: s, role: 'target' });
    partsUsed.add(s.part); furnUsed.add(fk(s)); break;   // (the line's own place, like a lock's: not out of the stage's count of things to open)
  }
  placingTarget = true;
  for (; ti < targets.length; ti++) {
    const type = targets[ti];
    let s = null;
    if (firstFree) { firstFree = false; s = (spec.habitMore && habit && take(x => x.kind === 'on' && habit(x), type)) || take(x => x.kind === 'on', type); }
    // (10/19 user: "아이스크림·음료수는 냉장고에서 나올 확률을 높여"): a cold thing goes into a fridge, freezer or cooler when the
    // room has a free one — within the stage's count of things to open (past it, 25판 had 5 of 9 behind doors: GPT QA R2-05)
    if (!s && isCold(type) && want.inside > 0) { s = take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part) && !partsUsed.has(x.part) && affLike(type, x), type); if (s) { want.inside = Math.max(0, want.inside - 1); partsUsed.add(s.part); furnUsed.add(fk(s)); } }
    if (!s && habit && (spec.habitMore || ti % 2 === 0)) {   // (5·7·9판: every thing tries the habit place first — the line promises it)
      // the habit place, out in the open first; inside only while there are things left to open
      s = take(x => habit(x) && x.kind !== 'inside' && (spec.ho ? x.kind === 'on' || want.behind > 0 : true), type)
        || (want.inside > 0 && take(x => habit(x) && x.kind === 'inside' && !(x.part && lockedParts.has(x.part)) && !(x.part && partsUsed.has(x.part)) && okIn(x), type));
      if (!s && !spec.ho) s = take(x => habit(x) && !(x.part && lockedParts.has(x.part)) && !(x.part && partsUsed.has(x.part)), type);
      if (s) { if (s.kind === 'inside') { want.inside--; partsUsed.add(s.part); furnUsed.add(fk(s)); } else if (s.kind !== 'on') want.behind--; }
    }
    if (!s && want.inside > 0) {
      s = take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part) && !partsUsed.has(x.part) && okIn(x) && affLike(type, x), type)   // (where it belongs first: ice cream in the freezer)
        || take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part) && !partsUsed.has(x.part) && okIn(x), type) || (!spec.ho && take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part), type));
      if (s) { want.inside--; partsUsed.add(s.part); furnUsed.add(fk(s)); }
    }
    if (!s && want.behind > 0) { s = take(x => x.kind === 'under' || x.kind === 'behind', type); if (s) want.behind--; }
    if (!s) s = take(x => x.kind === 'on', type) || (!spec.ho && take(x => (x.kind === 'under' || x.kind === 'behind'), type)) || take(x => x.kind === 'inside' && !lockedParts.has(x.part) && okIn(x), type) || (spec.ho && take(x => (x.kind === 'under' || x.kind === 'behind'), type));
    if (s) placements.push({ type, spot: s, role: 'target' });
  }
  placingTarget = false;
  // decoys: clutter in plain sight + red herrings inside containers
  // (함정, 10/18: the place's own unused things + DECOY_POOL only — never the common pool, never another stage's answers)
  const decoyTypes = DECOY_POOL.concat(own.filter(t => !targets.includes(t))).filter(t => !tool(t) && !(spec.items && targets.includes(t)));   // (a 머그컵 to find and 머그컵 decoys beside it read as one — 19~50 lists have mugs, books, blocks)
  const fill = (pred, frac) => {
    const c = r.shuffle(all.filter(s => !used.has(s) && pred(s)));
    const n = Math.round(c.length * frac);
    for (let k = 0; k < n; k++) {
      const s = c[k];
      // (two of a kind at most: the mug was 29 of 1~20판's decoys — 10/20)
      const opts = r.shuffle(decoyTypes.slice()).filter(t => placements.filter(p => p.role === 'decoy' && p.type === t).length < 2 && fits(t, s, 'decoy') && affOk(t, s));
      const t0 = opts.find(t => shapeFits(t, s, 'decoy'));   // (nothing running through it — fitspot.js)
      if (!t0) continue;
      used.add(s); placements.push({ type: t0, spot: s, role: 'decoy', v: r.int(0, 3) });
    }
  };
  // the story's secret collectible: tucked away somewhere open (not inside anything locked)
  if (story?.secret) { const ss = take(x => (x.kind === 'under' || x.kind === 'behind') && !inLocked(x), story.secret) || take(x => !inLocked(x) && x.kind !== 'on', story.secret); if (ss) placements.push({ type: story.secret, spot: ss, role: 'secret' }); }
  // (no decoy on a place that rides a lid, a rock or a bush that opens: tapping the thing to open it hit the decoy — and
  // with 톡 that cost a tap every time; a thing to find may sit there, it moves away when found — 레벨 세션 10/18)
  const pivots = new Set(room.parts.flatMap(p => p.pivots));
  const rides = s => { for (let o = s.anchor?.parent; o; o = o.parent) { if (pivots.has(o)) return true; if (o === s.furn?.group) return false; } return false; };
  fill(s => s.kind === 'on' && !rides(s), spec.clutter ?? .5);
  fill(s => s.kind === 'under' || s.kind === 'behind', (spec.clutter ?? .5) * .45);
  fill(s => s.kind === 'inside' && !lockedParts.has(s.part), .35);
  // a dark room: the lights are out until you find the switch (a lever on a wall where it can be seen)
  let light = null;
  // (9판 ② 10/23: lightItem — a plain wall switch on the list of things to find, not a lever; found, the lights come on)
  let lightItem = null;
  if (spec.dark) { const sw = mountLever(room, r, spec.lightAt, spec.lightItem ? 'lightswitch' : 'lever'); if (sw?.type === 'lightswitch') lightItem = sw; else if (sw) { light = sw.f.parts[0]; light.isLight = true; light.label = '전등 스위치'; } }
  if (tv && !tv.lock) { tv.on(''); tv = null; }   // no code lock to point at: just a TV that is on
  return { targets: placements.filter(p => p.role === 'target').map(p => p.type), placements, locks, light, lightItem, tv, rotSeed: r };
}
// 함정 상한 (11~70판 레벨 세션 10/19, 리포트 v3 P2): the decoys grew with the map — 2 to 30 a stage, over 20 on 20·26·30·54·59판 —
// while 톡 doesn't count them. At most 1.5× the things on the list, never under 6; not on 흑백판 (their own colour game) or
// 너굴이's timed stages (no 톡 there); the laundromat's odd socks are the pair puzzle, not decoys. Runs on the finished plan.
export const decoyCap = n => Math.max(6, Math.round(n * 1.5));
export function capDecoys(plan, spec) {
  const early = (spec.idx ?? -1) >= 0 && spec.idx < 20;   // (1~20판: 흑백·시간제 판도 — 17판 흑백 13개, 18판 시간제 17개가 다 보이는 데 깔렸어요, 11~20판 레벨 점검 10/20)
  if (!plan || (!early && (spec.gray || spec.timed)) || spec.tut === 1 || spec.custom) return 0;   // (2판 counts too: 8 decoys round 4 things was double — 검토 P1-3)
  // (1~10판은 찾을 것 수만큼, 6 밑으로는 안 내려감 — 6~9판에 확대·두 칸 맵·함정 두 배가 한꺼번에 와서 1장에서 제일 빡빡했어요;
  // 검토 세션 실측 + 사용자 승인 10/19, 1~10판 레벨 세션)
  // (1~20판: 찾을 것 수만큼, 6 밑으론 안 내려감 — 시간제는 1.5배. 11판 냥냥이 부엌이 함정 12개에 처음부터 8개가 보여서, 1장 끝에서
  // 가장 어수선했어요; 21판부터는 그대로)
  const n = plan.targets.length, cap = spec.tut === 2 ? n : early ? (spec.timed ? decoyCap(n) : Math.max(6, n)) : decoyCap(n);
  const dec = plan.placements.filter(p => p.role === 'decoy' && p.type !== 'sockp');
  if (dec.length <= cap) return 0;
  const drop = new Set(rng((spec.seed || 1) + 4241).shuffle(dec.slice()).slice(cap));
  plan.placements = plan.placements.filter(p => !drop.has(p));
  return drop.size;
}

// 사건 판 (10/17 pivot, user: "물건 목록 대신 작은 사건… 행동이 이어지는 발견… 끝나면 남는 변화"): the room's owner hides
// inside a big piece of furniture behind a lock, and finding them is the goal. There is always at least one lock; with two,
// the clue of the friend's lock waits inside the other one (key → box → note → safe → friend). A couple of things to
// find remain as a bonus. Built on planStage: the friend's marker is forced in as the first target, so the first lock
// guards it and every rule about clues and dead ends still holds.
const HIDEOUT = ['wardrobe', 'bigfridge', 'fridge', 'chest', 'trunk', 'tent', 'firetruck', 'jailcell', 'patrolcar', 'lockers', 'safe', 'dishcab', 'pastrycase', 'shopfront', 'washer3', 'minifridge', 'tentsmall', 'cooler', 'kpopstage', 'artcrate', 'lostbox', 'vending', 'drawers', 'mailbox', 'picnic',
  // 10/18 (레벨 세션): stages 41 / 48 / 50 had no hideout at all (or one) — 103동 door, recycling bins, ice-cream cart,
  // grill, park bin, wish box, hiking pack; and 8's shower curtain and bed as R1 decoys
  'aptwall', 'recyclebins', 'icecart', 'bbqgrill', 'parkbin', 'shrinebox', 'backpack2', 'bathtub', 'bed', 'gpt_tc_rack'];   // (gpt_tc_rack: 28판 두 량 객차 선반 위 가방 — '선반 위는 반칙', ② 10/22)
// (28판 새 키 traincar4 ⑧ 10/23: 짐 선반 여행 가방 먼저 — 대본 '…선반 위는 반칙'; 연결 통로 문 뒤도 너굴이 크기 자리)
HIDEOUT.push('tc4rack', 'tc4endwall');
// (28판 traincar5 ⑧ 10/24: 짐 선반 여행 가방 먼저 — 대본 '…선반 위는 반칙'; 연결 통로 문 뒤도 너굴이 크기 자리)
HIDEOUT.push('tc5rack', 'tc5end');
export function planIncident(room, spec, story = null) {
  const given = Array.isArray(spec.lock) ? spec.lock.slice() : spec.lock === 'both' ? ['pad', 'code'] : spec.lock ? [spec.lock] : [];
  const DOOR = ['pad', 'code', 'color'];
  // (a chapter that teaches the lever opens on it: then the lever's chain is what keeps the friend in — 레벨 세션 10/18)
  const kind0 = given[0] === 'lever' ? 'lever' : given.find(k => DOOR.includes(k)) || (spec.idx % 2 ? 'code' : 'pad');
  const order = [kind0, ...given.filter(k => k !== kind0)];
  if (spec.idx >= 9 && !order.some((k, i) => i > 0 && DOOR.includes(k))) order.push(kind0 === 'pad' ? 'code' : 'pad');   // from stage 10 on, two doors in a row
  const bonus = spec.bonus ?? Math.max(2, Math.min(3, Math.round((spec.n || 4) / 2)));
  const s2 = { ...spec, n: 1 + bonus, lock: order, force: ['friendtoken'], inside: Math.min(spec.inside || 0, 1), behind: Math.min(spec.behind || 0, 1),
    // R2 (10/18): the host's habit places first — "멍뭉이는 또 쓰레기통이겠지?" (not on the stages where the story breaks the habit)
    hideout: spec.habit ? [...HIDEOUT.filter(t => spec.habit.some(k => t.includes(k))), ...HIDEOUT.filter(t => !spec.habit.some(k => t.includes(k)))] : HIDEOUT };
  const plan = planStage(room, s2, story);
  const fp = plan.placements.find(p => p.type === 'friendtoken');
  const L0 = fp && plan.locks.find(l => l.part === fp.spot.part);
  if (!fp || !L0) return null;   // nowhere to hide behind a lock: the caller falls back to the old stage
  const L1 = plan.locks.find(l => l !== L0 && DOOR.includes(l.kind) && !l.chain);
  if (L1) {
    // the friend's clue goes inside the other lock: into a free spot there, or in place of the bonus thing it guards
    // (that one moves to where the clue was, or drops out) — key → box → note → safe → friend
    const clue = plan.placements.find(p => p.forPart === L0.part && ['key', 'note', 'color'].includes(p.role));
    const taken = new Set(plan.placements.map(p => p.spot));
    let sp = clue && L1.part.spots.find(x => !taken.has(x) && fits(clue.type, x));
    if (clue && !sp) {
      const g = plan.placements.find(p => p.role === 'target' && p.type !== 'friendtoken' && p.spot.part === L1.part && fits(clue.type, p.spot));
      if (g) {
        sp = g.spot;
        // the bonus thing it pushed out goes where the clue was, else to another free place it fits — it used to drop out
        // (16판 was friend + 1: "물건들 좀 더 찾게 해 줄래? 쉽게 느껴짐", user 10/20)
        const alt = fits(g.type, clue.spot) ? clue.spot : rng(spec.seed + 313).shuffle(room.spots.filter(x => !taken.has(x) && !x.reserved && x.kind !== 'inside' && !plan.locks.some(l => l.part === x.part) && fits(g.type, x)))[0];
        if (alt) { g.spot = alt; taken.add(alt); } else { plan.placements.splice(plan.placements.indexOf(g), 1); plan.targets.splice(plan.targets.indexOf(g.type), 1); }
      }
    }
    if (sp) { clue.spot = sp; plan.nested = true; }
  }
  plan.incident = { part: L0.part, lock: L0 };
  return plan;
}

// A stranger's published room: put back exactly what they hid (and their locks), then add a little clutter.
// 비밀 서재: the friend is behind the secret bookcase. The chain: key → chest → the missing picture book → put it back and
// set the rainbow right (책등 퍼즐) → the case rolls aside → the marble run trips the latch → the little door → friend.
export function planShowcase(room, spec, story = null) {
  const shelf = room.parts.find(p => p.secretShelf), door = room.parts.find(p => p.secret);
  if (!shelf || !door) return null;
  const plan = planStage(room, { ...spec, n: Math.max(2, (spec.n || 4) - 1) }, story);
  const r = rng(spec.seed + 77);
  // the missing book is the first thing to find, hidden like any other thing — in a place that opens (the toy chest first,
  // else a drawer), no key and padlock before it (사용자 실폰 10/20 "무슨 도감? 뭔지 전혀 모르겠다. 어렵기도 하고":
  // 열쇠 → 상자 → 책 → 책장 → 무지개 → 구슬 → 문 was seven steps; now 책 → 책장 → 무지개, the rest plays by itself)
  const tg = plan.placements.filter(p => p.role === 'target');
  const bp = tg.find(p => p.spot.part && p.spot.furn?.type === 'chest') || tg.find(p => p.spot.part) || tg[0];
  if (!bp) return null;
  plan.targets.splice(plan.targets.indexOf(bp.type), 1);
  // ...and where a picture book would be put away: a toy chest, a desk drawer, a chest of drawers (one run put it in the cookie jar)
  const used = new Set(plan.placements.map(p => p.spot)), booky = s => /^(chest|desk|drawers)/.test(s.furn?.type || '');
  if (!booky(bp.spot) || !fits('spinebook', bp.spot)) {
    const home = r.pick(room.spots.filter(s => !s.reserved && s.part && !used.has(s) && booky(s) && !plan.locks.some(l => l.part === s.part) && fits('spinebook', s)));
    if (home) bp.spot = home;
  }
  Object.assign(bp, { type: 'spinebook', role: 'book', forPart: shelf });
  // (② 10/23, user on the phone: "파란 구슬도 찾게 해서 무지개 풀고 찾은 구슬 쓰게 해서 열리게") the run's marble is missing too: another
  // thing to find, somewhere else — once the case has rolled aside it goes on the run's start and opens the cupboard. Not a lock
  // more before it: just one more find (책 → 무지개 / 구슬 → 구슬 길)
  const mp = plan.placements.filter(p => p.role === 'target' && p !== bp && p.type !== 'friendtoken' && p.spot.furn !== bp.spot.furn && !plan.locks.some(l => l.part === p.spot.part) && fits('bluemarble', p.spot))
    .sort((a, b) => (b.spot.part ? 1 : 0) - (a.spot.part ? 1 : 0))[0];
  if (mp) { plan.targets.splice(plan.targets.indexOf(mp.type), 1); Object.assign(mp, { type: 'bluemarble', role: 'gadget', code: 'bluemarble', forPart: door }); }
  // a scrambled shelf two swaps from right (was up to four): two pairs traded places, one book home; one of the five is missing
  const sw = r.shuffle([0, 1, 2, 3, 4]), order = [0, 1, 2, 3, 4];
  [order[sw[0]], order[sw[1]]] = [order[sw[1]], order[sw[0]]];
  [order[sw[2]], order[sw[3]]] = [order[sw[3]], order[sw[2]]];
  const missing = r.int(0, 4);
  const spine = { part: shelf, kind: 'spine', code: order.join('') }, marble = { part: door, kind: 'marble', code: 'marble' };
  plan.locks.push(spine, marble);
  plan.placements.push({ type: 'friendtoken', spot: door.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: door, lock: marble };
  plan.showcase = { shelf, door, order, missing, marble: !!mp };
  return plan;
}
// 아파트 장치판 '로봇청소기 대소동' (10/18): the remote lies about → the robot vacuum goes under the sofa and comes back with the
// key on its lid → the key opens a padlocked cupboard → the crank → the 천장 빨래건조대 winds down → the friend in the blanket
export function planRobovac(room, spec, story = null) {
  const vac = room.parts.find(p => p.robotVac), rack = room.parts.find(p => p.dryRack);
  if (!vac || !rack) return null;
  const plan = planStage(room, { ...spec, lock: ['pad'], n: 3 }, story);   // the chain is the stage: two bonus things beside it
  const L = plan.locks.find(l => l.kind === 'pad');
  const cp = L && plan.placements.find(p => p.role === 'target' && p.spot.part === L.part);
  const kp = L && plan.placements.find(p => p.role === 'key' && p.forPart === L.part);
  if (!cp || !kp) return null;
  plan.targets.splice(plan.targets.indexOf(cp.type), 1);
  Object.assign(cp, { type: 'crank', role: 'gadget', code: 'crank', forPart: rack });
  Object.assign(kp, { spot: vac.furn.keySpot, vacHidden: true });   // the key rides out on the robot's lid
  const used = new Set(plan.placements.map(p => p.spot));
  const r = rng(spec.seed + 91);
  const rs = r.pick(room.spots.filter(s => !s.reserved && !used.has(s) && !(s.part && plan.locks.some(l => l.part === s.part)) && fits('vacremote', s)));
  if (!rs) return null;
  plan.placements.push({ type: 'vacremote', spot: rs, role: 'gadget', code: 'vacremote', forPart: vac });
  const vl = { part: vac, kind: 'gadget', code: 'vacremote' }, rl = { part: rack, kind: 'gadget', code: 'crank' };
  plan.locks.push(vl, rl);
  plan.placements.push({ type: 'friendtoken', spot: rack.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: rack, lock: rl };
  plan.showcase = { kind: 'robovac', vac, rack };
  return plan;
}
// a 장치판 room: which chain its devices make
export function planShow(room, spec, story = null) {
  if (room.parts.some(p => p.secretShelf)) return planShowcase(room, spec, story);
  if (room.parts.some(p => p.robotVac)) return planRobovac(room, spec, story);
  if (room.parts.some(p => p.device)) return planDevice(room, spec, story, planStage);   // R6 장치판 (devices.js)
  return null;
}
export function planCustom(room, doc, seed = 1) {
  const r = rng(seed);
  const { spots, parts } = indexSpots(room);
  const placements = [], locks = [];
  for (const l of doc.locks || []) { const part = parts[l.part]; if (part && part.lockable) locks.push({ part, kind: l.kind, code: doc.code || '000' }); }
  const used = new Set();
  for (const e of doc.hidden || []) {
    let s = null;
    if (e.free) { const host = Array.isArray(e.free.p) && e.free.p.length === 3 && e.free.p.every(Number.isFinite) && resolveHost(room, e.free.host, parts, e.free.part); if (host) s = makeFreeSpot(host, { x: e.free.p[0], y: e.free.p[1], z: e.free.p[2], clone() { return this; } }, e.free.ry || 0); }
    else s = spots[e.spot];
    if (!s || used.has(s) || !ITEMS[e.item]) continue;
    used.add(s);
    const role = e.item === 'key' ? 'key' : e.item === 'note' ? 'note' : 'target';
    const forPart = role === 'key' ? locks.find(l => l.kind === 'pad')?.part : role === 'note' ? locks.find(l => l.kind === 'code')?.part : undefined;
    placements.push({ type: e.item, spot: s, role, code: doc.code, forPart });
  }
  const targets = placements.filter(p => p.role === 'target').map(p => p.type);
  const decoyTypes = DECOY_POOL.concat(TARGET_POOL.filter(t => !targets.includes(t)));
  const free = r.shuffle(Object.values(spots).filter(s => !used.has(s) && !(s.part && locks.some(l => l.part === s.part))));
  let n = 0;
  for (const s of free) {
    if (n >= 8) break;
    if (s.kind !== 'on' && r() > .3) continue;
    const opts = r.shuffle(decoyTypes.slice()).filter(t => fits(t, s, 'decoy'));
    if (!opts.length) continue;
    used.add(s); placements.push({ type: opts[0], spot: s, role: 'decoy', v: r.int(0, 3) }); n++;
  }
  return { targets, placements, locks, rotSeed: r };
}

// 3판 낚시터 B안 (① 10/23, 사용자 "배경 주변이 타는 거 같아 … 26판처럼 둘레 모델 넣는 안 시도"): 같은 연못 마당을 26판 동네 배경 속에 —
// 미리보기 ?gptmap=fishingtown&lv=3 (판 표는 그대로 fishing = A안: 흙 지층 받침)
THEMES.fishingtown = { ...THEMES.fishing, gptSky: '#d9eedf', gptGround: '#9fd27a', gptGroundFar: '#d9eedf', gptPaving: '#e6dccb',
  townWalls: ['#fbefd6', '#e6f1e0', '#f6dfe2', '#e8f0f4', '#fef2e1', '#e3eedc'], townRoofs: ['#e96d78', '#4e97d5', '#5aa84a', '#e08a4a', '#4e97d5', '#e782b2'] };
LAYOUTS.fishingtown = { ...LAYOUTS.fishing, theme: THEMES.fishingtown, furniture: [...LAYOUTS.fishing.furniture, { type: 'gptneighborhood', x: 0, z: 0, a: 0 }] };
