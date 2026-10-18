import * as THREE from 'three';
// Room themes, hand-placed layouts, stage specs and a seeded planner that hides targets / keys / decoys.
import { rng } from './util.js';
import { indexSpots } from './room.js';
import { resolveHost, makeFreeSpot } from './freehide.js';
import { ITEMS, TARGET_POOL, DECOY_POOL } from './gfx/items.js';
import { FURN_INFO } from './gfx/furniture.js';
import { digPatch } from './gfx/outdoor.js';
import { tvPuzzle } from './gfx/apt-props.js';
import { applyEdit } from './layedits.js';

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
    lofts: [{ i: 0, j: 0, w: 2, d: 2, y: 1.45, ladder: 'S', ladderAt: .45 }], cut: [{ i: 4, j: 3, w: 2, d: 2 }],
    furniture: [LF('futon', 0, 0, 0, null, 1.45), F('desk', 0, 1), F('chest', 0, 0), F('wardrobe', 2, 0), F('drawers', 3, 0), F('rug', 2, 2), F('beanbag', 3, 2), F('plantshelf', 4, 2), F('plant', 5, 2), F('laundrybasket', 1, 3), F('trash', 3, 4)],
    decor: [D('window', 'N', .25), D('posterwall', 'N', 1.6), D('catclock', 'N', 2.5), D('window', 'W', .1), D('door', 'W', -1.6)], friendAt: [2.4, 1.0] },
  bear: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    raised: [{ i: 0, j: 0, w: 3, d: 2, h: .3, kind: 'carpet', a: '#dfe6b4', b: '#c9d39a', stepX: .6 }], cut: [{ i: 0, j: 4, w: 2, d: 1 }],
    furniture: [F('floorlamp', 0, 0), F('recordcab', 1, 0), F('zabuton', 0, 1), F('kotatsu', 1, 1), F('zabuton', 2, 1),
      F('sofa2', 3, 0), F('bookshelf', 5, 0, 0, { seed: 11 }), F('monstera', 5, 1), F('rug', 3, 1), F('table', 3, 2), F('tvlow', 3, 4, 2), F('chest', 0, 2, 1), F('plant', 5, 4)],
    decor: [D('window', 'N', -1.6), D('curtainwin', 'N', 1.0), D('catclock', 'W', -2.05), D('picture', 'W', 1.9), D('window', 'W', .3), D('door', 'W', -1.1)], friendAt: [1.8, 1.0] },
  cat: { w: 6, d: 5, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    raised: [{ i: 3, j: 3, w: 3, d: 2, h: .25, kind: 'planks', a: '#e9b57c', b: '#b9824a', stepX: -1 }], cut: [{ i: 0, j: 4, w: 1, d: 1 }],
    furniture: [F('fridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('kimchifridge', 4, 0), F('bookshelf', 0, 2, 1, { seed: 21 }), F('counter', 2, 2, 2), F('counter', 3, 2, 2), F('stool2', 1, 2), F('plant', 5, 2),
      F('kitchentable', 4, 3), F('stool2', 3, 3), F('catbowls', 1, 4), F('trash', 2, 4)],
    decor: [D('wallrack', 'N', .5), D('window', 'N', -1.45), D('window', 'N', 2.4), D('catclock', 'W', 1.2), D('door', 'W', -1.0)], friendAt: [1.4, 1.0] },
  // 몽글 파출소: the front desk, a barred cell on the back wall, lockers, a WANTED board with 잉키 on it, a waiting bench
  police: { w: 7, d: 6, walls: { N: 'wall', W: 'wall' }, wallH: 2.9,
    furniture: [F('filecab', 0, 0), F('safe', 1, 0), F('jailcell', 2, 0), F('lockers', 4, 0), F('watercooler', 5, 0), F('plantbig', 6, 0),
      F('reception', 2, 2), F('officechair', 2, 1), F('officedesk', 4, 2), F('lostbox', 6, 2), F('copier', 6, 4), F('bench2', 0, 4), F('cones', 3, 5), F('plant', 6, 5)],
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
    floorZones: [{ i: 4, j: 0, w: 3, d: 2, kind: 'checker', a: '#fffaf0', b: '#cfe8d6' }],   // the kitchen corner
    furniture: [F('monstera', 0, 0), F('tvlow', 1, 0), F('floorlamp', 3, 0), F('bigfridge', 4, 0), F('kimchifridge', 5, 0), F('snackcart', 6, 0),
      F('dryrack', 0, 1, 1), F('sofa2', 0, 2, 1), F('laundrybasket', 0, 4), F('recordcab', 0, 5, 1),
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
      F('cupnoodlebar', 0, 2, 1), F('snackshelf', 2, 2), F('counter2', 4, 3), F('plant', 5, 1), F('trash', 3, 4), F('boxes', 1, 4)],
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
    decor: [D('elevator', 'N', -1.5), D('noticeboard', 'N', 1.5), D('mailboxes2', 'W', 1.0), D('door', 'W', -1.6)], friendAt: [-.4, .6] },
  // 빌딩 옥상: a parapet round the back, the stair door, a water tank, AC units, washing on a line, a sun lounger
  rooftop: { w: 6, d: 5, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
    furniture: [F('antenna', 3, 0), F('watertank', 4, 0), F('outdoorunit', 5, 0), F('outdoorunit', 5, 1),
      F('laundryline', 1, 2), F('deckchair', 3, 3), F('rooftopgarden', 0, 3), F('rooftopgarden', 0, 4), F('boxes', 5, 4)],
    decor: [D('rooftopdoor', 'N', -2.0)], friendAt: [.9, .1] },
  // 동네 뒷산 산길: pines, a pavilion, a spring, a little bridge over a stream, a lantern string, a hiker's tent
  trail: { w: 7, d: 6, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // grass on both sides of the dirt path that climbs from the stairs to the pavilion
    floorZones: [{ i: 0, j: 0, w: 4, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' }, { i: 0, j: 4, w: 2, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' },
      { i: 5, j: 4, w: 2, d: 2, kind: 'grass', a: '#9fd27a', b: '#86c063' }, { i: 6, j: 0, w: 1, d: 3, kind: 'grass', a: '#9fd27a', b: '#86c063' }],
    furniture: [F('pine2', 0, 0), F('pine2', 2, 0), F('pavilion', 4, 0), F('pine2', 6, 1), F('trailsign', 1, 1), F('rockpile', 3, 1),
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
      F('amphora', 1, 4), F('donutart', 6, 2), F('museumbench', 2, 4), F('artcrate', 6, 4), F('artcrate', 0, 5), F('guidedesk', 4, 5), F('plantbig', 6, 5)],
    decor: [D('artwave', 'N', -1.6), D('artstars', 'N', 1.6), D('artlisa', 'W', 1.5), D('artpearl', 'W', -.6)],
    friendAt: [.4, -.3] },
  // 개굴이의 낚시터: a pond in the middle, the fishing platform on its north bank (the rod reaches over the water), a
  // tackle box and bait by the platform, reeds round the edge, a parasol seat and a cooler on the east bank
  fishing: { w: 7, d: 6, walls: { N: 'hedge', W: 'fence', S: 'none', E: 'none' },
    furniture: [F('pond', 2, 2), F('fishdock', 2, 1), F('tree', 0, 0), F('bench', 4, 0), F('fishsign', 6, 0), F('tacklebox', 1, 1), F('baitbucket', 4, 1),
      F('reeds', 5, 3), F('reeds', 1, 4), F('parasol', 6, 2), F('cooler', 6, 4), F('campchair', 0, 2), F('bush', 0, 5), F('picnic', 3, 5), F('reeds', 5, 5)],
    friendAt: [1.6, 1.2] },
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
  park1: { walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
    furniture: [F('slidetower', 0, 0), F('lostbox', 2, 0), F('swings2', 3, 0), F('tree', 0, 2), F('springrider', 2, 2), F('sandbox2', 3, 2), F('hopscotch', 0, 3), F('bench', 1, 4), F('parkbin', 4, 4)], friendAt: [-.4, .6] },
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
THEMES.firestation = OUT('곰돌이네 119 안전센터', 'bear', ['#fff1ea', '#f1e6e0'], { ...ALLEY, wallKind: 'brick', wall: '#e8806f', wall2: '#c9584b', wainscot: '#8a8f9e', trim: '#f4f4ec', wallEdge: '#f6d6c8', plaster: '#f1e4e8' });
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
          F('sofa', 1, 2), F('plant', 5, 2), F('liftbasket', 5, 3), F('rug', 1, 3), F('table', 2, 4), F('diningset', 3, 5), F('laundrybasket', 2, 6), F('stool', 5, 6), F('plant', 4, 6)],
        decor: [D('window', 'W', 2.0), D('picture', 'W', -1.8), D('window', 'E', 1.6)] } },   // nothing hung on the back wall under the balcony: it is in shadow and out of sight
      { at: [0, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [2.5] }, gable: 'N', timber: true,
        furniture: [F('plant', 0, 0), F('desk', 1, 0), F('stool', 1, 1), F('bookshelf', 3, 0, 0, { seed: 31 }), F('chest', 4, 0), F('bed', 5, 0), F('rug', 2, 1), F('beanbag', 4, 2)],
        decor: [D('window', 'W', 0), D('picture', 'N', -1.7), D('clock', 'E', 0)] } },
    ] };
  },
  // 침실 + 욕실
  bunnybath: () => ({ theme: THEMES.bunnybath, friendAt: [-1.5, 1.5], nBonus: 2, rooms: [
    { at: [-2.5, 0], layout: RM('bunny', 5, 5, { walls: { E: 'door' }, door: { wall: 'S', u: -1.2 },
      furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('plant', 4, 0), F('desk', 0, 3, 1), F('rug', 2, 2), F('stool', 1, 3), F('catbed', 4, 3), F('yarnbasket', 1, 4)],
      decor: [D('picture', 'N', -1.9), D('wallshelf', 'N', 1.6), D('window', 'W', -.5), D('clock', 'W', 1.6)] }) },
    { at: [2.5, 0], layout: RM('bath', 5, 5, { walls: { W: 'none' },
      furniture: [F('bathtub', 1, 0), F('vanity', 3, 0), F('laundrybasket', 0, 1), F('toilet', 4, 2, 3), F('laundry', 4, 4), F('rug', 1, 2), F('plant', 0, 4), F('trash', 3, 4)],
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
        furniture: [F('stairsup', 6, 3), F('bookshelf', 0, 0, 0, { seed: 17 }), F('recordcab', 1, 0), F('floorlamp', 2, 0), F('fridge', 4, 0), F('counter', 5, 0, 0, { variant: 'stove' }), F('dishcab', 6, 0),
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
    { at: [-3.0, 0], layout: { ...LAYOUTS.apt, theme: THEMES.apt, bleed: null, walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.2 }, floorZones: [],
      // (장치판 '로봇청소기 대소동': the robot vacuum that drives, and a 천장 빨래건조대 in place of the floor rack)
      furniture: [...LAYOUTS.apt.furniture.filter(f => !['bigfridge', 'kimchifridge', 'snackcart', 'diningset'].includes(f.type)).map(f => f.type === 'robovac' ? { ...f, type: 'robovacgo' } : f.type === 'dryrack' ? { ...f, type: 'ceilrack' } : f), F('bookshelf', 5, 0, 0, { seed: 7 })] } },
    { at: [3.0, 0], layout: { w: 5, d: 6, theme: THEMES.aptkitchen, bleed: null, wallH: 3.0, walls: { N: 'wall', W: 'none', E: 'wall' },
      furniture: [F('bigfridge', 0, 0), F('kimchifridge', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('snackcart', 4, 0),
        F('diningset', 1, 3), F('plant', 4, 2), F('trash', 4, 5), F('laundrybasket', 0, 5)],
      decor: [D('wallrack', 'N', .5), D('catclock', 'E', 0)] } },
  ] }),
  // 큰 단지 놀이터: the playground and a pavilion garden side by side
  playgroundwide: () => ({ theme: THEMES.playground, friendAt: [3.5, 1.5], nBonus: 3, rooms: [
    { at: [-3.5, 0], layout: { ...LAYOUTS.playground, theme: THEMES.playground } },
    { at: [3.5, 0], layout: { w: 7, d: 6, theme: THEMES.playground, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      furniture: [F('aptwall', 0, 0), F('aptwall', 2, 0), F('pavilion2', 4, 0), F('planter', 0, 2), F('picnic2', 2, 2),
        F('bbqgrill', 6, 2), F('streetlamp2', 0, 4), F('swings2', 1, 4), F('springrider', 4, 3), F('catfeeder', 6, 4), F('icecart', 4, 5)] } },
  ] }),
  // 편의점 + 빨래방: two shops side by side, one door between
  shopmap: () => ({ theme: THEMES.konbini, friendAt: [2.5, 1.2], nBonus: 3, rooms: [
    { at: [-3.0, 0], layout: { ...LAYOUTS.konbini, theme: THEMES.konbini, walls: { N: 'wall', W: 'wall', E: 'door' }, doorAt: { E: 1.0 } } },
    { at: [2.5, 0], layout: { ...LAYOUTS.laundry, theme: THEMES.laundry, walls: { N: 'wall', W: 'none', E: 'wall' } } },
  ] }),
  // 빌딩 로비 + 사무실
  lobbymap: () => {
    const office = MAPS.officefloor().rooms[0].layout;
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
      decor: [D('clock', 'N', -1.5), D('window', 'E', 0)] }) },
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
        furniture: [F('jangdok', 0, 0), F('garden', 2, 0), F('catfeeder', 3, 1), F('daeya', 0, 2), F('clothesline', 1, 2), F('pyeongsang', 0, 4), F('bike', 2, 6), F('trashbags', 0, 6)],
        decor: [D('gate', 'N', 1.0), D('mailbox', 'W', 1.0)] } },
      { at: [2, 0], level: 0, layout: { w: 7, d: 7, theme: down, wallH: 2.9, timber: true, walls: { W: 'door' }, doorAt: { W: 1.0 },
        furniture: [F('stairsup', 6, 3), F('kimchifridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('fridge', 4, 0), F('bookshelf', 5, 0, 0, { seed: 51 }), F('plant', 6, 0),
          F('diningset', 1, 2), F('rug', 3, 3), F('sofa2', 3, 3), F('table', 4, 4), F('shoerack', 0, 5, 1), F('chest', 1, 6), F('tvlow', 3, 6, 2), F('laundrybasket', 5, 6)],
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
        furniture: [F('stairsup', 0, 3), F('bookshelf', 0, 0, 0, { seed: 71 }), F('drawers', 1, 0), F('counter', 2, 0, 0, { variant: 'stove' }), F('counter', 3, 0), F('dishcab', 4, 0), F('plant', 5, 0),
          F('sofa', 1, 2), F('chest', 5, 2), F('rug', 2, 3), F('table', 3, 4), F('beanbag', 1, 4), F('laundrybasket', 2, 6), F('trunk', 5, 6), F('lamp', 4, 6)],
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
        furniture: [F('stairsup', 5, 3), F('minikitchen', 0, 0), F('minifridge', 2, 0), F('ricecooker', 3, 0), F('washer2', 4, 0), F('shoerack', 5, 0),
          F('hanger', 0, 2), F('rug', 1, 3), F('foldtable', 2, 4), F('beanbag', 1, 4), F('sofa2', 1, 2), F('mirror2', 0, 5, 1), F('plantshelf', 0, 6), F('laundrybasket', 3, 6), F('pcdesk', 4, 6)],
        decor: [D('curtainwin', 'W', 1.6), D('posterwall', 'W', -1.0)] } },
      { at: [0, -2], level: 1, layout: { w: 6, d: 3, theme: up, walls: { S: 'rail' }, railGaps: { S: [-2.5] },
        furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('bookshelf', 3, 0, 0, { seed: 81 }), F('plant', 5, 0), F('beanbag', 2, 2), F('chest', 0, 2, 1)],
        decor: [D('window', 'N', -.5), D('clock', 'W', 0)] } },
    ] };
  },
  // 큰 놀이터
  parkwide: () => ({ theme: THEMES.parkwide, friendAt: [-.5, -1.5], nBonus: 3, rooms: [
    { at: [0, 0], layout: RM('park1', 8, 6, { walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
      // the big park: a playground on the left, the pond in the middle, a picnic corner on the right
      furniture: [F('slidetower', 0, 0), F('swings2', 2, 0), F('tree', 4, 0), F('picnic2', 5, 0), F('bush', 7, 0),
        F('springrider', 2, 2), F('pond', 3, 2), F('streetlamp2', 6, 2), F('bbqgrill', 7, 2), F('hopscotch', 0, 3), F('reeds', 2, 4),
        F('planter', 6, 4), F('parkbin', 0, 5), F('bench', 1, 5), F('icecart', 5, 5), F('tree', 7, 5)] }) },
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

// ── Stages: 4 regions, 50 stages. Region 1 is hand-tuned; the rest are generated from region rules so that
// difficulty rises through more targets, deeper hiding places and new lock mechanics, not just smaller items or
// shorter timers. Region rooms that are not built yet fall back to indoor rooms so the game always runs.
export const STAGES = [
  { room: 'bunny', n: 3, inside: 0, behind: 0, time: 60, tut: 1, clutter: .4 },
  { room: 'bunny', n: 4, inside: 2, behind: 0, time: 70, tut: 2, clutter: .5 },
  { room: 'museum', n: 4, inside: 1, behind: 0, time: 75, clutter: .45 },   // 흑백판: the museum that lost its colours (homage stage)
  { room: 'bear', n: 4, inside: 1, behind: 0, time: 80, lock: ['pad'], clutter: .50, tut: 4 },
  { room: 'fishing', n: 5, inside: 2, behind: 0, time: 80, clutter: .45 },
  { room: 'study', n: 4, inside: 1, behind: 0, time: 90, clutter: .5, showcase: true },   // 비밀 서재 (was 냥냥이네 부엌, still in the boss)
  { room: 'peng', n: 5, inside: 2, behind: 0, time: 90, lock: ['code'], clutter: .55, tut: 7 },
  { room: 'bunnybath', n: 6, inside: 2, behind: 1, time: 85, night: true, clutter: .60 },
  { room: 'bear2', n: 6, inside: 2, behind: 0, time: 95, lock: ['color'], clutter: .60 },
  { room: 'house2f', n: 6, inside: 2, behind: 0, time: 95, lock: ['pad'], clutter: .65, lockOn: { pad: ['chest'] }, clueIn: { pad: 'liftbasket' } },
  { room: 'house3', n: 7, inside: 3, behind: 1, time: 105, lock: ['pad', 'code'], clutter: .65 },
  { room: 'catstory', n: 6, inside: 2, behind: 1, time: 125, lock: ['lever'], hard: true, boss: true, clutter: .75 },
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
export const PLAN = {
  apt: ['apt', 'police:gray', 'oneroom:dark', 'school', 'aptkitchen:gray', 'duplex:timed', 'firestation', 'aptmap:show', 'policefront:boss'],
  alley: ['street', 'alley1', 'skatepark:gray', 'alley3', 'alleyhouse', 'street:night', 'alley1:timed', 'skatepark:gray', 'alleyhouse:show', 'alleywide:boss'],
  shop: ['konbini', 'laundry', 'cafe:gray', 'konbini', 'shopmap:night', 'cafe:gray', 'konbini:timed', 'laundry:show', 'shopmap:boss'],
  park: ['playground', 'park1:gray', 'park2', 'park3', 'playground:night', 'playgroundwide:timed', 'park2:gray', 'parkwide:show', 'playgroundwide:boss'],
  camp: ['trail', 'camp1', 'camp2:dark', 'camp3:gray', 'cabin', 'trail:night', 'camp1:timed', 'campwide', 'camp2:gray', 'cabin:show', 'campwide:boss'],
  building: ['lobby', 'kpop', 'museum', 'officefloor:gray', 'rooftop:night', 'lobbymap:timed', 'officefloor:dark', 'kpop:show', 'lobby:gray', 'lobbymap:boss'],
};
const planAt = (kind) => { const out = []; for (const [rid, list] of Object.entries(PLAN)) { const R = REGIONS.find(q => q.id === rid); list.forEach((e, l) => { if ((e.split(':')[1] || '') === kind) out.push(R.from + l); }); } return out; };
// 너굴이's "숨바꼭질 놀이": a few stages run against a clock (the only timed ones); none in the first region any more —
// the 비밀번호 tutorial (stage 7) used to have the clock on top of it
export const TIMED = new Set(planAt('timed'));
// stage index → character you meet (and can then see around town); 너굴이 comes from the first timed stage you clear
export const CHAR_UNLOCK = { 11: 'cat', 20: 'tv', 30: 'coolcat', 39: 'sundae', 48: 'dj', 59: 'snowy', 69: 'robot' };
export function regionOf(idx) { return REGIONS.find(r => idx < r.to) || REGIONS[REGIONS.length - 1]; }
// lock schedule inside a region (index = stage within the region); the last stage is the region's escape-room boss
const LOCK_PLAN = [[], ['pad'], [], ['code'], ['color'], [], ['lever'], ['pad', 'color'], [], ['code', 'lever'], ['pad', 'code'], ['color', 'lever']];
// Timer per stage from the balance pass (tools/balance.py): human-pace bot clear time / (1 - wanted spare time).
// Stages missing here keep their rule-based time. Replace with real playtest numbers when there are some.
export const TIME_TUNE = { 0: 45, 1: 80, 2: 80, 3: 90, 4: 80, 5: 85, 6: 110, 7: 100, 8: 105, 9: 95, 10: 125, 11: 105};
// 흑백판: the room has lost its colour; what you find (things AND a few pieces of furniture) gets it back
// (user, 10/17: "흑백인판이 있어서 찾은거는 색칠되게", "가구들같이 큰것들도 찾게 — 난이도 조절용")
export const GRAY = new Set([2, ...planAt('gray')]);
// 숨은그림 되살리기 (10/18, user: "계속 캐릭터가 숨어대니까 짜증난다. 진득하게 숨은그림찾는 코어가 사라진거같아"): the owner
// hides only on these stages (0-based; 1판 is its own tutorial hide) — the ★장치판, three chapter openings where the friend says
// so, 8 (night bedroom, right before the pajama party) and 16 (classroom). Every other ordinary stage is a hidden-object stage
// again, the owner standing by. Story + level sessions' plan: _handoff/stage-mix-plan-20261018.md, level-mix-shape-20261018.md.
// ?mix=0 brings back the 10/17 rule (every ordinary stage a friend hunt) to compare.
export const FRIEND_HIDE = new Set([5, 7, 15, 19, 21, 29, 38, 40, 47, 49, 58, 67]);
// 숨은그림 판의 물건 수와 그중 자물쇠 사슬 끝에 있는 물건 수 (stage number from 1; 레벨 세션 B1: ≤ 60 % of the spots you can
// really see on that map, chains ≤ the map's lockable pieces; 32·33·35·61·65 count the spots added 10/18)
const HO_SHAPE = {
  2: [6, 0], 4: [7, 1], 5: [7, 1], 7: [7, 1], 9: [8, 2], 10: [8, 1], 11: [8, 2],
  13: [8, 2], 15: [7, 1], 19: [8, 2],
  23: [9, 2], 25: [10, 2], 26: [11, 3], 27: [10, 2],
  32: [10, 1], 33: [9, 2], 35: [10, 1], 36: [11, 2],
  43: [10, 2], 44: [9, 2], 45: [10, 1],
  51: [10, 2], 52: [10, 2], 54: [12, 3], 55: [9, 2], 57: [12, 3],
  61: [10, 2], 62: [11, 2], 63: [11, 2], 65: [9, 1], 67: [12, 3],
};
const MIX_OLD = typeof location !== 'undefined' && /[?&]mix=0(&|$)/.test(location.search);   // 12 (was 7; user 10/17: "흑백판 재밌다, 약간 늘려도") — none timed, dark, boss or with a colour lock
export function stageSpec(idx) {
  idx = Math.max(0, idx);
  if (idx >= STAGE_COUNT) return endlessSpec(idx);
  const s = baseSpec(idx);
  if (TIME_TUNE[idx]) s.time = TIME_TUNE[idx];
  if (TIMED.has(idx)) { s.timed = true; s.time = Math.round(s.time * 1.3 / 5) * 5; }
  if (GRAY.has(idx) && !s.timed && !s.boss) { s.gray = true; s.night = false; if (Array.isArray(s.lock)) s.lock = s.lock.filter(k => k !== 'color'); }   // a colour lock can't be read in grey
  // 사건 판 (10/17 pivot): from stage 3 on, every ordinary stage is a small incident — the owner hides behind a lock and
  // you work your way to them; 흑백판 keep their own colour game, timed and boss stages theirs
  // (대본 10/18: the 열쇠·비밀번호 lessons, tut 4 and 7, are friend-finding stages too; only the two tutorials aren't)
  if (idx >= 2 && !s.timed && !s.boss && !s.gray && !(s.tut <= 2) && (MIX_OLD || FRIEND_HIDE.has(idx))) s.incident = true;
  // a hidden-object stage (레벨 세션 B2): hard spots (under / behind) 0 in chapters 1-2, 1 in 3-4, 2 from 5; inside a drawer
  // or door 30 % early, 40 % later
  if (!MIX_OLD && s.tut === 2 && HO_SHAPE[2]) s.n = HO_SHAPE[2][0];   // the things tutorial keeps its own spots, just the count
  if (!MIX_OLD && !s.incident && !s.timed && !s.boss && !(s.tut <= 2)) {   // (4판 key, 7판 code lessons are hidden-object stages too)
    const ch = REGIONS.indexOf(regionOf(idx)), shape = HO_SHAPE[idx + 1];
    if (shape) {   // how many things, and how many of them sit at the end of a lock chain
      s.n = shape[0];
      const kinds = (Array.isArray(s.lock) ? s.lock : s.lock === 'both' ? ['pad', 'code'] : s.lock ? [s.lock] : []).slice(0, shape[1]);   // (chapter 1 writes one lock as a word)
      for (const k of ['pad', 'code', 'lever', 'color']) if (kinds.length < shape[1] && !kinds.includes(k) && !(k === 'color' && (s.gray || s.night || s.dark))) kinds.push(k);
      s.lock = kinds;
    }
    s.behind = ch <= 1 ? 0 : ch <= 3 ? 1 : 2; s.inside = Math.round((s.n || 6) * (ch <= 1 ? .3 : .4));
  }
  return s;
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
  if (idx < STAGES.length) return { ...STAGES[idx], idx, seed, region: 'home' };
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
  if (P) { const [r0, k0 = ''] = P.split(':'); kind = k0; if (LAYOUTS[r0] || MAPS[r0]) room = r0; }
  const boss = P ? kind === 'boss' : local === len - 1;
  let lock = boss ? ['pad', 'code', 'color', 'lever'] : LOCK_PLAN[local % LOCK_PLAN.length];
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
    torn: ri >= 1 && (boss || local % 3 === 1),
    dig: R.id === 'park' && (boss || local % 2 === 0),
    tv: R.id === 'apt' && lock.includes('code'),
    sock: room === 'laundry' || room === 'shopmap',   // the pair puzzle only where there are washers (it was every shop stage)
    dark: P ? kind === 'dark' : ['apt', 'camp', 'building'].includes(R.id) && !boss && local % 4 === 2,
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

const fits = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);

// Mount a lever (or a light switch) where it stays visible: a free wall slot, else a free back-edge tile.
function mountLever(room, r) {
  const RS = room.rooms || [room];
  const slots = [];
  // a lever must stay visible: skip wall slots that already carry decor or stand behind tall furniture
  const TALL = ['wardrobe', 'bookshelf', 'fridge', 'plant', 'lamp', 'tvstand', 'boxes', 'dishcab', 'cattower', 'fishtank', 'vending', 'pole', 'shopfront', 'stairs', 'clothesline', 'tree', 'pine', 'tent', 'slide', 'swing'];
  for (const Rm of RS) {
    const mountable = w => ['wall', 'alleywall'].includes(Rm.walls[w]?.kind || 'wall');
    const tileOf = (w, u) => w === 'N' ? [Math.floor(u + Rm.w / 2), 0] : w === 'S' ? [Math.floor(-u + Rm.w / 2), Rm.d - 1] : w === 'W' ? [0, Math.floor(-u + Rm.d / 2)] : [Rm.w - 1, Math.floor(u + Rm.d / 2)];
    const blocked = (w, u) => { const [ti2, tj] = tileOf(w, u); return Rm.furns.some(f => { if (!TALL.includes(f.type) && !(f._h ??= new THREE.Box3().setFromObject(f.f.group).max.y - Rm.group.position.y > 1.0)) return false; const [fw, fd] = Rm.footprint(f.type, f.rot); return ti2 >= f.i && ti2 < f.i + fw && tj >= f.j && tj < f.j + fd; }); };
    const half = Math.max(Rm.w, Rm.d) / 2 - .6;
    for (const w of ['N', 'W', 'E', 'S']) for (let u = -half; u <= half + .01; u += 1) if (mountable(w) && !Rm.decors.some(d => d.wall === w && Math.abs(d.u - u) < .95) && !blocked(w, u)) slots.push([Rm, w, u]);
  }
  let lv = null;
  if (slots.length) { const [Rm, w, u] = slots[Math.floor(r() * Math.min(slots.length, 6))]; lv = Rm.addDecor('lever', w, u); }
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
  const all = room.spots.filter(s => !s.reserved && (!s.part || (s.part.reach ?? 1) >= .55));
  const used = new Set();
  const take = (pred, type) => {
    const c = r.shuffle(all.filter(s => !used.has(s) && pred(s) && (!type || fits(type, s))));
    if (!c.length) return null;
    used.add(c[0]); return c[0];
  };
  // a theme can bring its own things to find first (the everyday rooms hide a remote, slippers, a tangerine…)
  const own = (room.T?.pool || []).filter(t => ITEMS[t]);
  const ownN = Math.min(own.length, Math.ceil(spec.n / 2));
  // the first stages only ask for things with a readable shape (a thin pencil under a loft was hard even with a hint)
  const THIN = ['pencil', 'usb', 'earphones', 'receipt', 'postit', 'hairpin', 'idcard'];
  const tool = t => (dig && t === 'shovel') || (tv && t === 'remote') || (spec.sock && t === 'sock') || (spec.idx >= 0 && spec.idx < 6 && THIN.includes(t));   // a stage's tool is never a target or a decoy
  // the common things rotate through the stages (a window that moves on 5 places a stage) so the same milk carton
  // doesn't turn up stage after stage (user, 10/17: "계속 찾는것만 찾게"); the place's own things come first
  const common = TARGET_POOL.filter(t => !own.includes(t) && !tool(t)), off = ((spec.idx ?? 0) * 5) % Math.max(1, common.length);
  const turn = [...common.slice(off), ...common.slice(0, off)];
  // the place's own things rotate too: neighbouring stages of one region take different ones
  const mine = own.filter(t => !tool(t)), oo = mine.length ? ((spec.idx ?? 0) * ownN) % mine.length : 0;
  const ownTurn = [...mine.slice(oo), ...mine.slice(0, oo)];
  const targets = [...r.shuffle(ownTurn.slice(0, ownN)), ...r.shuffle(turn.slice(0, Math.max(6, spec.n))), ...turn.slice(Math.max(6, spec.n))].slice(0, spec.n);
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
  const lockKinds = spec.lock === 'both' ? ['pad', 'code'] : Array.isArray(spec.lock) ? spec.lock : spec.lock ? [spec.lock] : [];
  const prefer = { pad: ['chest', 'mailbox', 'cooler', 'bike', 'picnic', 'tent'], code: ['safe', 'vending', 'shopfront', 'lostbox', 'trunk', 'slide'], color: ['kpopstage', 'wardrobe', 'chest', 'safe', 'gate', 'parkbin', 'trunk'], lever: ['wardrobe', 'safe', 'chest', 'aircon', 'firewood', 'slide'] };
  for (const lk of lockKinds) {
    const free = room.parts.filter(p => p.lockable && p.spots.length && (p.reach ?? 1) >= .55 && !locks.some(l => l.part === p));
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
    const wd = r.shuffle(room.parts.filter(p => p.furn.type === 'washer3' && p.spots.length && (p.reach ?? 1) >= .55 && !locks.some(l => l.part === p)))[0];
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
    for (let k = ti; k < targets.length && !s; k++) if ((s = take(x => x.part === L.part, targets[k]))) [targets[ti], targets[k]] = [targets[k], targets[ti]];
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
    const cs = (spec.clueIn?.[L.kind] && take(x => x.furn.type === spec.clueIn[L.kind] && x.part && !inLocked(x), chainType)) || take(x => !inLocked(x) && x.kind !== 'on', chainType) || take(x => !inLocked(x), chainType);
    if (cs) placements.push({ type: chainType, spot: cs, role, code: L.code, forPart: L.part });
  }
  const lockedParts = new Set(locks.map(l => l.part));
  const partsUsed = new Set();
  const want = { inside: spec.inside || 0, behind: spec.behind || 0 };
  for (; ti < targets.length; ti++) {
    const type = targets[ti];
    let s = null;
    if (want.inside > 0) {
      s = take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part) && !partsUsed.has(x.part), type) || take(x => x.kind === 'inside' && x.part && !lockedParts.has(x.part), type);
      if (s) { want.inside--; partsUsed.add(s.part); }
    }
    if (!s && want.behind > 0) { s = take(x => x.kind === 'under' || x.kind === 'behind', type); if (s) want.behind--; }
    if (!s) s = take(x => x.kind === 'on', type) || take(x => (x.kind === 'under' || x.kind === 'behind'), type) || take(x => x.kind === 'inside' && !lockedParts.has(x.part), type);
    if (s) placements.push({ type, spot: s, role: 'target' });
  }
  // decoys: clutter in plain sight + red herrings inside containers
  const decoyTypes = DECOY_POOL.concat(TARGET_POOL.filter(t => !targets.includes(t))).filter(t => !tool(t));
  const fill = (pred, frac) => {
    const c = r.shuffle(all.filter(s => !used.has(s) && pred(s)));
    const n = Math.round(c.length * frac);
    for (let k = 0; k < n; k++) {
      const s = c[k];
      const opts = r.shuffle(decoyTypes.slice()).filter(t => fits(t, s));
      if (!opts.length) continue;
      used.add(s); placements.push({ type: opts[0], spot: s, role: 'decoy', v: r.int(0, 3) });
    }
  };
  // the story's secret collectible: tucked away somewhere open (not inside anything locked)
  if (story?.secret) { const ss = take(x => (x.kind === 'under' || x.kind === 'behind') && !inLocked(x), story.secret) || take(x => !inLocked(x) && x.kind !== 'on', story.secret); if (ss) placements.push({ type: story.secret, spot: ss, role: 'secret' }); }
  fill(s => s.kind === 'on', spec.clutter ?? .5);
  fill(s => s.kind === 'under' || s.kind === 'behind', (spec.clutter ?? .5) * .45);
  fill(s => s.kind === 'inside' && !lockedParts.has(s.part), .35);
  // a dark room: the lights are out until you find the switch (a lever on a wall where it can be seen)
  let light = null;
  if (spec.dark) { const sw = mountLever(room, r); if (sw) { light = sw.f.parts[0]; light.isLight = true; light.label = '전등 스위치'; } }
  if (tv && !tv.lock) { tv.on(''); tv = null; }   // no code lock to point at: just a TV that is on
  return { targets: placements.filter(p => p.role === 'target').map(p => p.type), placements, locks, light, tv, rotSeed: r };
}

// 사건 판 (10/17 pivot, user: "물건 목록 대신 작은 사건… 행동이 이어지는 발견… 끝나면 남는 변화"): the room's owner hides
// inside a big piece of furniture behind a lock, and finding them is the goal. There is always at least one lock; with two,
// the clue of the friend's lock waits inside the other one (key → box → note → safe → friend). A couple of things to
// find remain as a bonus. Built on planStage: the friend's marker is forced in as the first target, so the first lock
// guards it and every rule about clues and dead ends still holds.
const HIDEOUT = ['wardrobe', 'bigfridge', 'fridge', 'chest', 'trunk', 'tent', 'firetruck', 'jailcell', 'patrolcar', 'lockers', 'safe', 'dishcab', 'pastrycase', 'shopfront', 'washer3', 'minifridge', 'tentsmall', 'cooler', 'kpopstage', 'artcrate', 'lostbox', 'vending', 'drawers', 'mailbox', 'picnic',
  // 10/18 (레벨 세션): stages 41 / 48 / 50 had no hideout at all (or one) — 103동 door, recycling bins, ice-cream cart,
  // grill, park bin, wish box, hiking pack; and 8's shower curtain and bed as R1 decoys
  'aptwall', 'recyclebins', 'icecart', 'bbqgrill', 'parkbin', 'shrinebox', 'backpack2', 'bathtub', 'bed'];
export function planIncident(room, spec, story = null) {
  const given = Array.isArray(spec.lock) ? spec.lock.slice() : spec.lock === 'both' ? ['pad', 'code'] : spec.lock ? [spec.lock] : [];
  const DOOR = ['pad', 'code', 'color'];
  const kind0 = given.find(k => DOOR.includes(k)) || (spec.idx % 2 ? 'code' : 'pad');
  const order = [kind0, ...given.filter(k => k !== kind0)];
  if (spec.idx >= 9 && !order.some((k, i) => i > 0 && DOOR.includes(k))) order.push(kind0 === 'pad' ? 'code' : 'pad');   // from stage 10 on, two doors in a row
  const bonus = Math.max(2, Math.min(3, Math.round((spec.n || 4) / 2)));
  const s2 = { ...spec, n: 1 + bonus, lock: order, force: ['friendtoken'], inside: Math.min(spec.inside || 0, 1), behind: Math.min(spec.behind || 0, 1),
    hideout: HIDEOUT };
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
      if (g) { sp = g.spot; if (fits(g.type, clue.spot)) g.spot = clue.spot; else { plan.placements.splice(plan.placements.indexOf(g), 1); plan.targets.splice(plan.targets.indexOf(g.type), 1); } }
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
  const plan = planStage(room, { ...spec, lock: ['pad'], lockOn: { pad: ['chest'] }, n: Math.max(2, (spec.n || 4) - 1) }, story);
  const r = rng(spec.seed + 77);
  // the missing book goes in the padlocked chest, in place of the bonus thing hidden there
  const L = plan.locks.find(l => l.kind === 'pad');
  let bp = L && plan.placements.find(p => p.role === 'target' && p.spot.part === L.part);
  if (bp) plan.targets.splice(plan.targets.indexOf(bp.type), 1);
  else bp = plan.placements.find(p => p.role === 'target');
  if (!bp) return null;
  if (!L) plan.targets.splice(plan.targets.indexOf(bp.type), 1);
  Object.assign(bp, { type: 'spinebook', role: 'book', forPart: shelf });
  // a scrambled shelf: at most one book already in its place; one of the five is the missing one
  let order;
  do order = r.shuffle([0, 1, 2, 3, 4]); while (order.filter((id, s) => id === s).length > 1);
  const missing = r.int(0, 4);
  const spine = { part: shelf, kind: 'spine', code: order.join('') }, marble = { part: door, kind: 'marble', code: 'marble' };
  plan.locks.push(spine, marble);
  plan.placements.push({ type: 'friendtoken', spot: door.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: door, lock: marble };
  plan.showcase = { shelf, door, order, missing };
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
    const opts = r.shuffle(decoyTypes.slice()).filter(t => fits(t, s));
    if (!opts.length) continue;
    used.add(s); placements.push({ type: opts[0], spot: s, role: 'decoy', v: r.int(0, 3) }); n++;
  }
  return { targets, placements, locks, rotSeed: r };
}
