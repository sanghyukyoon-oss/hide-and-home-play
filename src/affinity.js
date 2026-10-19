// 물건마다 나올 법한 자리 (user 10/19, 1~10판을 폰으로 해 보고: "아이스크림 같은 건 왜 상자에서 나오냐 ㅋㅋ … 아이스크림·
// 음료수는 냉장고에서 나올 확률을 높여 주던가"): what you find inside something should make sense for that something.
// Only things tucked INSIDE (a drawer, a door, a lid) are judged — out on top of a table anything may lie about.
//   never: a cold thing in a toy box, a book in the fridge
//   like:  where it belongs (ice cream in the freezer, socks in the drawers) — the planner tries these first
// Matched on names: the item's type and the furniture's type (one table for all 70 stages; 11~70판 레벨 세션 fills in
// its own furniture). ?aff=0 turns it off.
import * as THREE from 'three';
import { ITEMS } from './gfx/items.js';

const ON = typeof location === 'undefined' || !/[?&]aff=0(&|$)/.test(location.search);

const COLD = /^(icecream|milk|juice|bubbletea|soda|cola|popsicle|icepop|yogurt|pudding|smoothie|sundae|lemonade|drink|frozen|parfait|shake)/;
const FOOD = /(cookie|cupcake|donut|snack|apple|mandarin|orange|banana|cake|bread|candy|onigiri|kimbap|riceball|cheese|pancake|sandwich|acorn|egg|carrot|ramen|pizza|burger|muffin|macaron|jelly|choco|honey|jam|fruit|berry|grape|lemon|peach|cherry|fish|tuna|sausage|cracker|chips|gimbap|coffee|tteok|corn|potato)/;
const CLOTH = /(slipper|sock|hat|cap|scarf|glove|mitten|shirt|tie|ribbon|bow|hairpin|shoe|boot|bag|purse)/;
const BATH = /(toothbrush|toothpaste|towel|soap|shampoo|rubberduck|tissue|comb|mirror|lotion)/;

const F_COLD = /(fridge|freez|kimchi|cooler|icecart|vending|pastrycase|showcase|minifridge)/;
const F_KITCHEN = /(kitchen|counter|dishcab|cupboard|table|kotatsu|picnic|catbowls|snackcart|lunch|bento|pantry|stove|oven|microwave|cafe|bakery|diningset)/;
const F_CLOTH = /(wardrobe|drawers|dresser|closet|hanger|laundry|shoerack|locker|washer|dryer)/;
const F_BATH = /(bath|vanity|toilet|mirrorcab|sink|wallshelf2|laundry|washer)/;
const F_TOY = /(chest|toybox|trunk|artcrate|parcel|boxes|crate|lostbox)/;
const F_DISH = /(dishcab|cupboard|pastrycase)/;   // a glass dish cabinet: dishes and things to eat only
const F_TRASH = /(trash|bin|recycle)/;          // nothing to eat comes out of the bin

const furnOf = s => s.furn?.type || s.part?.furn?.type || '';
const cat = type => COLD.test(type) ? 'cold' : FOOD.test(type) ? 'food' : CLOTH.test(type) ? 'cloth' : BATH.test(type) ? 'bath' : 'other';

// 한 판의 자리표 (스토리 룸 10/19, 사용자 3판 실폰: "축구공.. (작은 새집 안) 어떻게 의자 밑에서 오리가 나오니 ㅠ 스토리랑 상의해서
// 다시 숨겨 줄래"): for a place the story room has gone through thing by thing — every kind of place, not only inside;
// the first rule that matches decides. planStage names the place (setPlace) before it plans.
const k = (re, kinds) => s => re.test(furnOf(s)) && (!kinds || kinds.includes(s.kind));
const PLACE = {
  fishing: [   // 3판 개굴이 낚시터
    // 오리·고무 오리: 갈대 속(오리가 숨는 곳), 연잎 위(물에 떠 있음) — 담요 밑·새집·아이스박스·신문지 밑은 아니에요
    [/duck/, s => k(/reeds/)(s) || k(/pond/, ['on'])(s), 'like'],
    [/duck/, k(/campchair|tree|cooler|bench/, ['inside']), 'never'],   // (벤치 신문지 밑은 싸 둔 간식 자리)
    // 축구공: 덤불 속, 벤치 밑, 파라솔 밑 — 새집·도구함·미끼통은 아니에요
    [/^ball/, s => k(/bush/, ['inside'])(s) || k(/bench|parasol/, ['under'])(s), 'like'],
    [/^ball/, k(/tree|tacklebox|baitbucket/, ['inside']), 'never'],
    // 도토리: 새집 안(새가 모아 둔 것), 나무 밑동 — 아이스박스는 아니에요
    [/acorn/, s => k(/tree/, ['inside'])(s) || (k(/tree/)(s) && s.label === '나무 밑동'), 'like'],
    [/acorn/, k(/cooler/, ['inside']), 'never'],
    // 선글라스: 좌대 의자 위(낚시꾼 거), 파라솔 아래 — 미끼통·그물망은 아니에요
    [/sunglass/, s => k(/fishdock/, ['on'])(s) || k(/parasol/)(s), 'like'],
    [/sunglass/, s => k(/baitbucket/)(s) || k(/fishdock/, ['inside'])(s), 'never'],
    // 도넛·간식: 피크닉 바구니 안, 벤치 신문지 밑(싸 둔 간식) — 바구니 뒤(뚫림)·미끼통·그물망은 아니에요
    [FOOD, s => k(/picnic|bench/, ['inside'])(s), 'like'],
    [FOOD, s => k(/picnic/, ['behind'])(s) || k(/baitbucket/)(s), 'never'],
  ],
};
let place = null;
export const setPlace = room => { place = PLACE[room] || null; };
// (the places the story room picked for a thing come first — planStage take)
export const placeLike = (type, spot) => { if (!ON || !place || !spot || isCold(type)) return false; for (const [re, at, v] of place) if (re.test(type) && at(spot)) return v === 'like'; return false; };
const tiny = type => (ITEMS[type]?.h ?? 1) <= .15;   // (손바닥보다 작은 것: an acorn, a candy)
const low = type => !!ITEMS[type]?.flat || (ITEMS[type]?.h ?? 1) <= .06;   // (담요에 덮일 납작한 것: sunglasses, a card, a note)

// 'like' | 'never' | 'ok' for putting this type inside this spot
export function affinity(type, spot) {
  if (!ON || !spot || !type || type === 'friendtoken') return 'ok';   // (a friend may hide anywhere — even the fridge)
  if (place && !isCold(type)) for (const [re, at, v] of place) if (re.test(type) && at(spot)) return v;
  if (spot.kind !== 'inside') return 'ok';
  const f = furnOf(spot), c = cat(type);
  // (every stage, 스토리 룸 원칙 1 "몸이 들어가야 해요"): a birdhouse holds only something smaller than a hand, a camp
  // chair's blanket or a rug only something flat enough to lie under it
  if (/^tree/.test(f)) return tiny(type) ? 'ok' : 'never';
  if (/campchair/.test(f)) return low(type) ? 'ok' : 'never';
  if (/^rug/.test(f)) return low(type) ? 'ok' : 'never';   // (under a rug only something flat — a ball under it went into the sofa standing on it: 겹침 QA 감사 10/19)
  if (/fishdock/.test(f)) return c === 'cold' ? 'like' : 'never';                     // the keep-net in the pond: drinks kept cool there (스토리 룸 10/19 — a ball or a donut in the water made no sense; the reel's junk is its own)
  if (c === 'cold') return F_COLD.test(f) ? 'like' : 'never';                           // ice cream, milk, drinks: only where it stays cold
  if (F_COLD.test(f)) return c === 'food' ? 'like' : 'never';                           // the fridge holds food, not a ball or a key
  if (F_DISH.test(f)) return c === 'food' ? 'like' : 'never';                          // (6판: a teddy came out of the dish cabinet)
  if (c === 'food') return F_KITCHEN.test(f) ? 'like' : F_CLOTH.test(f) || F_BATH.test(f) || F_TRASH.test(f) ? 'never' : 'ok';
  if (c === 'cloth') return F_CLOTH.test(f) ? 'like' : F_KITCHEN.test(f) || F_BATH.test(f) ? 'never' : 'ok';
  if (c === 'bath') return F_BATH.test(f) ? 'like' : F_KITCHEN.test(f) ? 'never' : 'ok';
  return F_TOY.test(f) ? 'like' : 'ok';                                                 // toys and odds and ends: a box is a fine place
}
export const affOk = (type, spot) => affinity(type, spot) !== 'never';
export const affLike = (type, spot) => affinity(type, spot) === 'like';
export const isCold = type => COLD.test(type || '');

// 버릇 자리 (검토 세션 10/19 P0-1, 사용자 승인: "대사가 버릇을 약속하는데 판이 안 지켜요"): the host's habit place — a furniture
// name from its habit list (hunt.js HABIT, or the stage's own list); with habitHigh (7판 펭펭이 "비결 2번: 높은 데 숨기기!")
// anything 1.1 m or more above the ground (a top shelf, the freezer, the whole upstairs of a two-storey house — not the
// kitchen counter); with habitRoom k every place in room k of a map (9판: the bathroom after the bath). One test for the
// planner and the first-screen tidy.
const _hv = new THREE.Vector3();
export function habitSpot(spec, room) {
  const words = spec?.prefer?.length ? spec.prefer : null, high = !!spec?.habitHigh;
  const area = spec?.habitRoom != null && room?.rooms?.[spec.habitRoom] ? new Set(room.rooms[spec.habitRoom].spots) : null;
  if (!words && !high && !area) return null;
  return x => (!!words && !!x.furn?.type && words.some(w => x.furn.type.includes(w)))
    || (!!area && area.has(x))
    || (high && !!x.anchor && x.anchor.getWorldPosition(_hv).y >= 1.1);
}
