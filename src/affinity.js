// 물건마다 나올 법한 자리 (user 10/19, 1~10판을 폰으로 해 보고: "아이스크림 같은 건 왜 상자에서 나오냐 ㅋㅋ … 아이스크림·
// 음료수는 냉장고에서 나올 확률을 높여 주던가"): what you find inside something should make sense for that something.
// Only things tucked INSIDE (a drawer, a door, a lid) are judged — out on top of a table anything may lie about.
//   never: a cold thing in a toy box, a book in the fridge
//   like:  where it belongs (ice cream in the freezer, socks in the drawers) — the planner tries these first
// Matched on names: the item's type and the furniture's type (one table for all 70 stages; 11~70판 레벨 세션 fills in
// its own furniture). ?aff=0 turns it off.
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

// 'like' | 'never' | 'ok' for putting this type inside this spot
export function affinity(type, spot) {
  if (!ON || !spot || spot.kind !== 'inside' || !type || type === 'friendtoken') return 'ok';   // (a friend may hide anywhere — even the fridge)
  const f = furnOf(spot), c = cat(type);
  if (/fishdock/.test(f)) return c === 'cold' ? 'like' : 'ok';                        // the keep-net in the pond: drinks keep cool there, anything may be caught
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
