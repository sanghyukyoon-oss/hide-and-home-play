// 물건마다 나올 법한 자리 (user 10/19, 1~10판을 폰으로 해 보고: "아이스크림 같은 건 왜 상자에서 나오냐 ㅋㅋ … 아이스크림·
// 음료수는 냉장고에서 나올 확률을 높여 주던가"): what you find inside something should make sense for that something.
// Only things tucked INSIDE (a drawer, a door, a lid) are judged — out on top of a table anything may lie about.
//   never: a cold thing in a toy box, a book in the fridge
//   like:  where it belongs (ice cream in the freezer, socks in the drawers) — the planner tries these first
// Matched on names: the item's type and the furniture's type (one table for all 70 stages; 11~70판 레벨 세션 fills in
// its own furniture). ?aff=0 turns it off.
import * as THREE from 'three';
import { ITEMS } from './gfx/items.js';
import { sizeRule } from './fitspot.js';

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

const PAPER = /(전단지|포스터|액자|달력|벽보|게시판|지도판|메뉴판|표지판|시험표)/;
const LONGS = /^(umbrella|gpt_racket|shovel|gpt_kite|gpt_ukulele|gpt_fryingpan|gpt_rollingpin|gpt_telescope)$/, SOFT = /(이불|베개|빈백|쿠션|방석|담요|식탁보|매트|러그)/, SMALLBOX = /(대야|항아리|바구니|상자|서랍|통|함 안|수거함|우체통|우편함)/;
const furnOf = s => s.furn?.type || s.part?.furn?.type || '';
const cat = type => COLD.test(type) ? 'cold' : FOOD.test(type) ? 'food' : CLOTH.test(type) ? 'cloth' : BATH.test(type) ? 'bath' : 'other';
export const itemKind = cat;   // (숨기기 목록의 '음식' 칩 — ③ 10/21)

// 한 판의 자리표 (스토리 룸 10/19, 사용자 3판 실폰: "축구공.. (작은 새집 안) 어떻게 의자 밑에서 오리가 나오니 ㅠ 스토리랑 상의해서
// 다시 숨겨 줄래"): for a place the story room has gone through thing by thing — every kind of place, not only inside;
// the first rule that matches decides. planStage names the place (setPlace) before it plans.
const k = (re, kinds) => s => re.test(furnOf(s)) && (!kinds || kinds.includes(s.kind));
const PLACE = {
  fishing: [   // 3판 개굴이 낚시터
    // 오리·고무 오리: 갈대 속(오리가 숨는 곳), 연잎 위(물에 떠 있음) — 담요 밑·새집·아이스박스·신문지 밑은 아니에요
    // (② 10/25 판별 메모 "수풀이 오리를 뚫음": 갈대 속은 줄기가 오리 몸을 뚫고 지나가 → 연잎 위만, 갈대 속은 X)
    [/duck/, k(/pond/, ['on']), 'like'],
    [/duck/, s => k(/reeds|bush|baitbucket|tacklebox/)(s) || k(/campchair|tree|cooler|bench/, ['inside'])(s), 'never'],   // (벤치 신문지 밑은 싸 둔 간식 자리)
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
// 2판 토순이네 침실(처음 배우는 판, 사용자 10/24 "2판이 좀 어렵대 사람들이 … 머리띠 다른 곳에"): 토순이 머리띠는 다락 이불 위·서랍장 위
// (시작 화면에서 보이는 곳) — 책상 밑 상자 같은 열어야 하는 데는 아니에요 (②)
PLACE.bunny = [
  // (2판 사용자 10/24·10/26 "스테이지 2 여기에 숨기지 말라니까… 아 진짜": 다락 밑 책상 옆 빨간 장난감 상자 안과 같은 다락 밑 책상 자리(위·밑·서랍)는
  // 어떤 물건도 X — 처음 판에 안 보이는 어두운 자리. 1판 토순이는 친구라 이 표와 상관없이 상자에 숨음)
  [/./, s => /^(장난감 상자 안|책상 위|책상 밑|책상 서랍|책상 아래 서랍)$/.test(s.label || ''), 'never'],
  [/bunnyband/, s => s.label === '이불 위' || s.label === '서랍장 위', 'like'],
  [/bunnyband/, s => s.kind === 'inside', 'never'],
  // (안경도 식물 선반 위 — 옷장 위칸까지 열면 처음 판에 열어 보는 게 둘이 됐음)
  [/glasses/, s => /^식물 선반/.test(s.label || ''), 'like'],
  [/glasses/, s => s.kind === 'inside', 'never'],
];
let place = null;
// (3판 ⑩ 안 fishing3r·fishisle: 원래 3판 자리표 그대로)
PLACE.fishing3r = PLACE.fishisle = PLACE.fishing;
// (3판 세 안 A fishing3 · B fishing2b · C frogpond — stage3-maps.js: 같은 조각 종류라 원래 3판 자리표 그대로)
PLACE.fishing3 = PLACE.fishing2b = PLACE.frogpond = PLACE.fishing;
export const setPlace = room => { place = PLACE[room] || null; };
// (the places the story room picked for a thing come first — planStage take)
export const placeLike = (type, spot) => { if (!ON || !place || !spot || isCold(type)) return false; for (const [re, at, v] of place) if (re.test(type) && at(spot)) return v === 'like'; return false; };
const tiny = type => (ITEMS[type]?.h ?? 1) <= .15;   // (손바닥보다 작은 것: an acorn, a candy)
const low = type => !!ITEMS[type]?.flat || (ITEMS[type]?.h ?? 1) <= .06;   // (담요에 덮일 납작한 것: sunglasses, a card, a note)

// 'like' | 'never' | 'ok' for putting this type inside this spot
export function affinity(type, spot) {
  if (!ON || !spot || !type || type === 'friendtoken') return 'ok';   // (a friend may hide anywhere — even the fridge)
  if (place && !isCold(type)) for (const [re, at, v] of place) if (re.test(type) && at(spot)) return v;
  // (조립 부품은 화분 흙 위 X: 잎에 묻혀 8판 로봇 몸통이 첫 화면 15 px 파란 조각으로만 보임 — GPT 정밀 QA ART-05, ② 10/24)
  if (/^kit_/.test(type) && /화분 흙/.test(spot.label || '')) return 'never';
  // (사용자 10/29 실폰 "22판 전단지 들추니 김밥": 먹을 것은 종이 한 장 뒤·밑(전단지·포스터·액자·달력·벽보·게시판·지도판·메뉴판) X)
  if (sizeRule() && (cat(type) === 'food' || cat(type) === 'cold') && (spot.wallFace || PAPER.test(spot.label || ''))) return 'never';
  // (사용자 10/29 "큰 물건이 작은 틈 X": 우산·라켓·삽처럼 긴 것은 베개·이불·빈백·쿠션·방석·담요·식탁보 밑이나 대야·항아리·작은 통 안 X)
  if (sizeRule() && LONGS.test(type) && (SOFT.test(spot.label || '') || /기둥|밑동|줄기/.test(spot.label || '') && (spot.kind === 'under' || spot.kind === 'behind') || spot.kind === 'inside' && SMALLBOX.test(spot.label || '') && !/우산꽂이/.test(spot.label || ''))) return 'never';
  if (spot.kind !== 'inside') return 'ok';
  const f = furnOf(spot), c = cat(type);
  // (every stage, 스토리 룸 원칙 1 "몸이 들어가야 해요"): a birdhouse holds only something smaller than a hand, a camp
  // chair's blanket or a rug only something flat enough to lie under it
  if (/^tree/.test(f)) return tiny(type) ? 'ok' : 'never';
  if (/campchair/.test(f)) return low(type) ? 'ok' : 'never';
  if (/^trash/.test(f)) return /^(note|receipt|postit|lottery|colornote|notepiece|ticket|letter|paper)/.test(type) ? 'ok' : 'never';   // (an indoor bin holds paper only — 2판's heart in the bin was a why-would-she: 숨기기 원칙 4, 검토 10/20)
  if (/^rug/.test(f)) return low(type) ? 'ok' : 'never';   // (under a rug only something flat — a ball under it went into the sofa standing on it: 겹침 QA 감사 10/19)
  if (/fishdock/.test(f)) return c === 'cold' ? 'like' : 'never';                     // the keep-net in the pond: drinks kept cool there (스토리 룸 10/19 — a ball or a donut in the water made no sense; the reel's junk is its own)
  if (c === 'cold') return F_COLD.test(f) ? 'like' : 'never';                           // ice cream, milk, drinks: only where it stays cold
  if (F_COLD.test(f)) return c === 'food' ? 'like' : 'never';                           // the fridge holds food, not a ball or a key
  if (F_DISH.test(f)) return c === 'food' ? 'like' : 'never';                          // (6판: a teddy came out of the dish cabinet)
  if (c === 'food') return F_KITCHEN.test(f) ? 'like' : F_CLOTH.test(f) || F_BATH.test(f) || F_TRASH.test(f) ? 'never' : 'ok';
  if (c === 'cloth') return F_CLOTH.test(f) ? 'like' : F_KITCHEN.test(f) || F_BATH.test(f) ? 'never' : 'ok';
  if (/^soap/.test(type)) return F_BATH.test(f) ? 'like' : 'never';                     // a bar of soap only in the bathroom (10/21 실폰 9판: it lay in the yarn basket)
  if (c === 'bath') return F_BATH.test(f) ? 'like' : F_KITCHEN.test(f) ? 'never' : 'ok';
  return F_TOY.test(f) ? 'like' : 'ok';                                                 // toys and odds and ends: a box is a fine place
}
export const affOk = (type, spot) => affinity(type, spot) !== 'never';
export const affLike = (type, spot) => affinity(type, spot) === 'like';
export const isCold = type => COLD.test(type || '');
// how odd a place is for a thing (엉뚱한 자리 한 쌍, 스토리 룸 10/21 → ③): 3 a cold thing out of the fridge, 2 a thing to eat away
// from the kitchen, 1 clothes out of the wardrobe or a bath thing out of the bathroom (or anywhere it should never be), 0 not odd
export function oddness(type, spot) {
  if (!spot || affinity(type, spot) === 'like') return 0;
  const f = furnOf(spot), k = cat(type);
  if (k === 'cold') return F_COLD.test(f) ? 0 : 3;
  if (k === 'food') return F_KITCHEN.test(f) || F_COLD.test(f) ? 0 : 2;
  if (k === 'cloth') return F_CLOTH.test(f) ? 0 : 1;
  if (k === 'bath') return F_BATH.test(f) ? 0 : 1;
  return affinity(type, spot) === 'never' ? 1 : 0;
}

// 버릇 자리 (검토 세션 10/19 P0-1, 사용자 승인: "대사가 버릇을 약속하는데 판이 안 지켜요"): the host's habit place — a furniture
// name from its habit list (hunt.js HABIT, or the stage's own list); with habitHigh (7판 펭펭이 "비결 2번: 높은 데 숨기기!")
// anything 1.1 m or more above the ground (a top shelf, the freezer, the whole upstairs of a two-storey house — not the
// kitchen counter); with habitRoom k every place in room k of a map (9판: the bathroom after the bath). One test for the
// planner and the first-screen tidy.
const _hv = new THREE.Vector3(), _fv = new THREE.Vector3();
// the floor a place stands on: its own room's (a two-storey map's upper rooms sit 2.9 m up)
const floorOf = (room, x) => { const R = room?.rooms?.find(r => r.spots.includes(x)) || room; return R?.group ? R.group.getWorldPosition(_fv).y : 0; };
export function habitSpot(spec, room) {
  const words = spec?.prefer?.length ? spec.prefer : null, high = !!spec?.habitHigh;
  const area = spec?.habitRoom != null && room?.rooms?.[spec.habitRoom] ? new Set(room.rooms[spec.habitRoom].spots) : null;
  if (!words && !high && !area) return null;
  return x => (!!words && !!x.furn?.type && words.some(w => x.furn.type.includes(w)))
    || (!!area && area.has(x))
    || (high && !!x.anchor && x.anchor.getWorldPosition(_hv).y - floorOf(room, x) >= .9);   // (above the floor it is on: 검토 10/20 — 7판's "높은 데" counted the upstairs floor itself, a stool's underside too; 0.9 m is over a penguin's head: counters, top shelves, the freezer, window sills)
}
