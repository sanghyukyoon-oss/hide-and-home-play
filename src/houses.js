// 프리셋 집 데이터 (놀러 가기 = 털 집 찾기, 10/20). Plain data only — raid.js reads the owners from here without building rooms.
// The shape and the reasons: presets.js. (10/20 user: "방들이 좀 더 크고 기깔나야 할 맛이 나긴 할 듯" — every house bigger than a
// new player's room, 7×7 to 8×7 or two rooms joined, and dressed with what the player can't have yet: the specials, the later
// walls and floors, a stage set's showpieces.) Tier 1 easy … 4 hard; the owner's Lv is the same ruler as mine (level.js).
// The eight residents keep their ids (practice-<i>): an old save's stolen things and revenge still lead to their houses.
import { WALLPAPERS, FLOORS } from './catalog.js';

const wp = id => { const w = WALLPAPERS.find(x => x.id === id); return w ? { wallKind: w.wallKind, wall: w.wall, wall2: w.wall2, wainscot: w.wainscot } : {}; };
const fl = id => { const f = FLOORS.find(x => x.id === id); return f ? { floorKind: f.floorKind, floor: f.floor, floor2: f.floor2 } : {}; };
const F = (type, i, j, rot = 0) => ({ type, i, j, rot });
const D = (type, wall, u) => ({ type, wall, u });
// two rooms side by side: a (left, its east wall a doorway) and b (right, open onto a), their back walls in one line
const SIZES = [[5, 5], [6, 5], [6, 6], [7, 6], [7, 7], [8, 7]];   // (catalog.js ZONE_SIZES)
const pair = (a, b) => {
  const [wa, da] = SIZES[a.size || 0], [wb, db] = SIZES[b.size || 0];
  return { type: a.type, rooms: [
    { at: [-wa / 2, 0], walls: { E: 'door' }, door: null, ...a },
    { at: [wb / 2, (db - da) / 2], walls: { W: 'none' }, door: null, ...b },
  ] };
};

export const HOUSES = [
  // ── tier 1: easy, three things, no lock
  {
    id: 'npc-strawberry', v: 1, tier: 1,
    owner: { id: 'npc-strawberry', nick: '딸기우유냥', face: 'hayang', lv: 6 },
    title: '딸기 다락방', brag: '내 방 예쁘지? 구경만 하고 가~',
    zone: {
      type: 'room', size: 4, paint: { ...wp('wp-gingham'), ...fl('fl-pink') },
      decor: [D('curtainwin', 'N', .6), D('artpearl', 'W', 1.2), D('posterwall', 'N', 2.6), D('catclock', 'W', -1.4)],
      furniture: [
        F('loftbed', 0, 0), F('photoheart', 2, 0), F('mirror2', 4, 0), F('plantshelf', 5, 0), F('hanger', 6, 0),
        F('rug', 2, 2), F('beanbag', 2, 2), F('kotatsu', 3, 3), F('zabuton', 3, 2), F('catbed', 4, 4),
        F('wardrobe', 0, 2, 1), F('drawers', 0, 4, 1), F('monstera', 0, 6), F('floorlamp', 6, 2), F('cattower', 6, 4), F('yarnbasket', 6, 6), F('chest', 3, 6),
      ],
    },
  },
  {
    id: 'npc-sleepy', v: 1, tier: 1,
    owner: { id: 'practice-2', nick: '졸졸이', face: 'sleepy', lv: 8 },
    title: '낮잠 마당', brag: '자다가 어디 숨겼는지 까먹었어…',
    zone: {
      type: 'yard', size: 5, paint: fl('fl-grass'),
      furniture: [
        F('pyeongsang', 0, 0), F('jangdok', 2, 0), F('tree', 5, 0), F('clothesline', 6, 1, 1),
        F('tent', 0, 3), F('campchair', 2, 3), F('cooler', 3, 3), F('lantern', 3, 2), F('firewood', 0, 6),
        F('garden', 5, 3), F('daeya', 4, 5), F('bush', 7, 3), F('picnic', 5, 6), F('mushrooms', 2, 6), F('log', 6, 0, 0), F('tree', 7, 6),
      ],
    },
  },
  {
    id: 'npc-frog', v: 1, tier: 1,
    owner: { id: 'practice-6', nick: '개굴이', face: 'frog', lv: 9 },
    title: '비 오는 날 연못', brag: '개굴! 연못 근처를 잘 봐~',
    zone: {
      type: 'park', size: 5, paint: fl('fl-grass'),
      furniture: [
        F('pond', 2, 2), F('fishdock', 5, 3, 1), F('reeds', 1, 2), F('reeds', 2, 5), F('reeds', 4, 1),
        F('parasol', 0, 0), F('tacklebox', 1, 0), F('baitbucket', 2, 0), F('fishsign', 6, 0), F('tree', 7, 0),
        F('rock', 0, 4), F('bush', 0, 6), F('lantern', 6, 6), F('bench', 3, 6), F('campchair', 7, 3), F('mushrooms', 7, 5),
      ],
    },
  },
  // ── tier 2: four things
  {
    id: 'npc-boardking', v: 1, tier: 2,
    owner: { id: 'practice-1', nick: '보드킹', face: 'skater', lv: 14 },
    title: '스케이트 창고', brag: '보드 타고 숨겼으니까 빠르게 찾아 봐!',
    zone: {
      type: 'storage', size: 5, paint: { ...wp('wp-plaid'), ...fl('fl-terrazzo') },
      decor: [D('posterwall', 'W', 1.2), D('posterwall', 'W', -.4), D('saleposters', 'N', 3)],
      furniture: [
        F('graffitiwall', 0, 0), F('quarterpipe', 2, 0), F('quarterpipe', 4, 0), F('boardrack', 6, 0), F('vending', 7, 0),
        F('funbox', 3, 3), F('grindrail', 3, 5), F('speaker', 0, 2, 1), F('beanbag', 0, 3), F('boxes', 0, 5), F('chest', 0, 6),
        F('minifridge', 7, 2, 3), F('micstand', 7, 4), F('bike', 6, 6), F('trash', 5, 2),
      ],
    },
  },
  {
    id: 'npc-hamster', v: 1, tier: 2,
    owner: { id: 'practice-5', nick: '햄찌', face: 'hamster', lv: 16 },
    title: '볼주머니 편의점', brag: '볼에 넣을까 하다가 참았어!',
    zone: {
      type: 'room', size: 5, paint: { ...wp('wp-stripe'), ...fl('fl-hex2') },
      decor: [D('saleposters', 'N', -2.4), D('yummyposter', 'N', .4), D('clockposter', 'W', 1.6), D('welcome', 'W', -1)],
      furniture: [
        F('snackshelf', 0, 0), F('drinkfridge', 2, 0), F('cupnoodlebar', 4, 0), F('icecreamchest', 6, 0), F('magazinerack', 7, 0),
        F('snackshelf', 2, 3), F('basketstack', 1, 3), F('counter2', 5, 4), F('vendcoin', 7, 3),
        F('parcel', 0, 6), F('boxes', 1, 6), F('metalshelf', 3, 6), F('aframe', 7, 6), F('doormat', 6, 6),
      ],
    },
  },
  {
    id: 'npc-shiba', v: 1, tier: 2,
    owner: { id: 'practice-4', nick: '멍뭉이', face: 'shiba', lv: 18 },
    title: '마당 있는 거실', brag: '멍! 킁킁 냄새로 찾아 봐!',
    zone: pair(
      { type: 'room', size: 2, paint: { ...wp('wp-wood'), ...fl('fl-herring') }, decor: [D('balconywin', 'N', -.6), D('wallshelf2', 'W', .6)],
        furniture: [F('sofa2', 0, 0), F('recordcab', 2, 0), F('monstera', 3, 0), F('tvlow', 0, 4, 1), F('rug', 2, 2), F('kotatsu', 2, 3), F('zabuton', 3, 3), F('floorlamp', 5, 1), F('bookshelf', 0, 2, 1), F('laundrybasket', 4, 5), F('robovac', 2, 5)] },
      { type: 'yard', size: 0, paint: fl('fl-grass'),
        furniture: [F('tree', 4, 0), F('garden', 0, 0), F('catfeeder', 2, 1), F('bench', 1, 4), F('parkbin', 4, 4), F('bush', 4, 2), F('daeya', 0, 2)] }),
  },
  {
    id: 'npc-panda', v: 1, tier: 2,
    owner: { id: 'practice-7', nick: '판다', face: 'panda', lv: 20 },
    title: '대나무 공원', brag: '판다는 숨바꼭질 고수야.',
    zone: {
      type: 'park', size: 5, paint: fl('fl-grass'),
      furniture: [
        F('pavilion2', 0, 0), F('tree', 2, 0), F('pine', 3, 0), F('slidetower', 5, 0), F('streetlamp2', 7, 0),
        F('springrider', 3, 2), F('sandbox2', 5, 3), F('planter', 0, 3), F('bench', 0, 5), F('bbqgrill', 2, 5),
        F('picnic2', 2, 6), F('icecart', 6, 6), F('noticeboard2', 7, 3), F('bush', 4, 5), F('catfeeder', 0, 6),
      ],
    },
  },
  {
    id: 'npc-dj', v: 1, tier: 2,
    owner: { id: 'npc-dj', nick: '냥펀치DJ', face: 'dj', lv: 17 },
    title: 'K팝 연습실', brag: '내 무대 밟지 마! …숨긴 건 찾아도 돼.',
    zone: {
      type: 'room', size: 5, paint: { ...wp('wp-star'), ...fl('fl-carpet') },
      decor: [D('posterwall', 'N', 3), D('posterwall', 'W', 1.6), D('posterwall', 'W', -.2), D('curtainwin', 'N', -2.6)],
      furniture: [
        F('kpopstage', 2, 0), F('speaker', 1, 0), F('speaker', 5, 0), F('micstand', 3, 2), F('mirror2', 7, 0), F('hanger', 6, 0),
        F('fanstool', 1, 4), F('fanstool', 3, 4), F('fanstool', 5, 4), F('merchtable', 0, 6), F('photoheart', 5, 6),
        F('beanbag', 7, 3), F('drawers', 0, 2, 1), F('minifridge', 7, 5, 3), F('floorlamp', 3, 6),
      ],
    },
  },
  // ── tier 3: five things and a lock
  {
    id: 'npc-tuxedo', v: 1, tier: 3,
    owner: { id: 'npc-tuxedo', nick: '턱시도관장', face: 'tuxedo', lv: 27 },
    title: '작은 미술관', brag: '작품엔 손대지 마세요. 숨긴 건… 찾아도 되고.',
    zone: {
      type: 'room', size: 5, paint: { ...wp('wp-diamond'), ...fl('fl-marble') },
      decor: [D('artstars', 'N', -2), D('artwave', 'N', 1.6), D('artlisa', 'W', .8), D('artpearl', 'W', -1.4)],
      furniture: [
        F('amphora', 0, 0), F('thinker', 4, 0), F('amphora', 7, 0),
        F('rug', 3, 2), F('stanchion', 3, 2), F('museumbench', 3, 4), F('easel', 0, 3, 1), F('veiled', 7, 2), F('donutart', 6, 4),
        F('guidedesk', 0, 6), F('artcrate', 2, 6), F('artcrate', 3, 6), F('safe', 7, 6, 3), F('monstera', 0, 2), F('plant', 7, 4),
      ],
    },
  },
  {
    id: 'npc-calico', v: 1, tier: 3,
    owner: { id: 'npc-calico', nick: '삼색바리스타', face: 'calico', lv: 25 },
    title: '골목 카페와 부엌', brag: '오늘의 원두는… 비밀이야.',
    zone: pair(
      { type: 'room', size: 2, paint: { ...wp('wp-pin'), ...fl('fl-parquet') }, decor: [D('menuboard', 'N', -1.2), D('cafesign', 'N', 1.4), D('cupshelf', 'W', 1)],
        furniture: [F('espresso', 0, 0), F('pastrycase', 2, 0), F('counter2', 3, 0), F('cafetable', 1, 3), F('cafetable', 3, 3), F('cafetable', 1, 5), F('stool', 2, 3), F('stool', 4, 3), F('stool', 2, 5), F('monstera', 5, 0), F('aframe', 5, 5), F('basketstack', 0, 2)] },
      { type: 'room', size: 0, paint: { ...wp('wp-tile'), ...fl('fl-smalltile') }, decor: [D('wallrack', 'N', 0), D('jarshelf', 'E', 0)],
        furniture: [F('bigfridge', 0, 0), F('counter', 1, 0), F('counter', 2, 0), F('dishcab', 4, 0), F('kitchentable', 1, 2), F('stool2', 1, 3), F('kimchifridge', 4, 2), F('ricecooker', 4, 4), F('trash', 0, 4)] }),
  },
  // ── tier 4: six things and a lock
  {
    id: 'npc-grumpy', v: 1, tier: 4,
    owner: { id: 'practice-0', nick: '삐딱이', face: 'grumpy', lv: 36 },
    title: '절대 못 찾는 서재', brag: '흥, 이번엔 절대 못 찾을걸?',
    zone: pair(
      { type: 'room', size: 2, paint: { ...wp('wp-moon'), ...fl('fl-herring2') }, decor: [D('artstars', 'N', 0), D('catclock', 'W', 1.4)],
        furniture: [F('bookshelf', 0, 0), F('bookshelf', 1, 0), F('desk', 3, 0), F('bookshelf', 5, 0), F('floorlamp', 0, 2), F('rug', 2, 2), F('sofa', 2, 4), F('table', 3, 2), F('safe', 5, 3, 3), F('filecab', 0, 4), F('recordcab', 0, 5), F('chest', 5, 5)] },
      { type: 'room', size: 0, paint: { ...wp('wp-plaid'), ...fl('fl-dark') }, decor: [D('window', 'N', 0)],
        furniture: [F('bed', 0, 0), F('drawers', 1, 0), F('wardrobe', 2, 0), F('wardrobe', 3, 0), F('lamp', 4, 0), F('catbed', 4, 3), F('boxes', 0, 4), F('trash', 4, 4)] }),
  },
  {
    id: 'npc-nerd', v: 1, tier: 4,
    owner: { id: 'practice-3', nick: '박사', face: 'nerd', lv: 40 },
    title: '수수께끼 연구실', brag: '논리적으로 생각하면 다 찾을 수 있지.',
    zone: {
      type: 'room', size: 5, paint: { ...wp('wp-tile'), ...fl('fl-mint') },
      decor: [D('whiteboard', 'N', -1.6), D('chalkboard', 'W', .6), D('window', 'N', 2)],
      furniture: [
        F('officedesk', 0, 0), F('officechair', 1, 1), F('copier', 3, 0), F('filecab', 4, 0), F('filecab', 5, 0), F('bookshelf', 6, 0), F('bookshelf', 7, 0),
        F('cubicle', 3, 3), F('pcdesk', 3, 2), F('schooldesk', 0, 3), F('lockers', 0, 5), F('metalshelf', 6, 3, 1), F('toolbox', 7, 6),
        F('watercooler', 5, 6), F('safe', 0, 6), F('fishtank', 2, 6), F('plant', 7, 5),
      ],
    },
  },
];
