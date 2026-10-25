// 도감: every friend and every hideable thing as a collectible card. Cards you have show their art, rarity stars, number,
// home region and a line; rare ones have a holo foil that follows your finger. Missing ones show the card back with a
// hint. Tap a card to hold it up close (it tilts with your finger). Card art is rendered once per tab on first open.
import { h } from './ui.js';
import { CHAR_DEFS, Char, charLine } from './gfx/chars.js';
import { ITEMS, buildItem } from './gfx/items.js';
import { THEMES, stageSpec, STAGE_COUNT, CHAR_UNLOCK, REGIONS } from './stages.js';
import { STARTER_ITEMS } from './catalog.js';
import { STORY_ITEMS } from './gfx/story-props.js';
import { renderThumbs, spinView } from './thumbs.js';
import { diaryLine, learnedCards, BOOK, HABIT_LINE, diarySecret, secretOpen, SECRET_UI, inkyNamed } from './script.js';
import { tr } from './i18n.js';
import { ECON, ownedFriends } from './econ.js';
import { SHOP_ITEMS } from './shop.js';   // (where a thing card really opens — 외부 QA17-03)
// 카드 속 배경 · 패럴랙스 (③ 10/21, user OK 10/22 "ㄱ 좋네")
import { cardScene } from './cardscene.js';

const ART = {};
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };   // key → data URL, filled per tab
// 대본 (10/18): the 도감 is also 몽글이's play diary — a friend's tell and promise under their card, and a page of the
// 🆕 cards you've gained (배운 것)
let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `.cb-diary{width:min(74vw,340px);box-sizing:border-box;background:#fffdf4 repeating-linear-gradient(transparent 0 25px,#eadcc4 25px 26px);border-left:6px solid #ff9fb8;border-radius:6px 14px 14px 6px;padding:8px 12px 9px 14px;color:#3b2a55;line-height:26px;transform:rotate(-1.2deg);box-shadow:0 5px 0 rgba(20,10,30,.35);word-break:keep-all}
.cb-diary b{display:block;font-size:12px;line-height:18px;margin-bottom:2px;color:#c0577f}
.cb-diary span{font-size:15px}
.cb-diary .cb-habit{margin-top:4px}
.tcard.sec .cb-holo{opacity:.9;animation:cbshine 4s ease-in-out infinite alternate}.tcard.big.sec .cb-holo{animation:none}.tcard.sec{box-shadow:0 0 0 2px #fff8 inset,0 0 16px #ffd84aaa}
.cb-learned{display:flex;flex-direction:column;gap:10px;max-height:min(58vh,560px);overflow-y:auto;padding:4px 4px 8px;touch-action:pan-y;-webkit-overflow-scrolling:touch}
.cl-card{background:#fffaf2;border:3px solid var(--ink,#3b2a55);border-radius:16px;padding:8px 10px 10px;color:#3b2a55;box-shadow:0 4px 0 rgba(42,26,61,.25)}
.cl-card.off{border-style:dashed;opacity:.65;display:flex;align-items:center;gap:10px;box-shadow:none}
.cl-t{font-size:19px;margin-bottom:6px}
.cl-card.off .cl-t{margin:0;font-size:24px;width:30px;text-align:center}
.cl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.cl-s{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;font-size:13px;line-height:1.3;word-break:keep-all;background:#fff;border-radius:10px;padding:6px 4px}
.cl-s b{font-size:24px;line-height:1.2}
.cl-hint{font-size:14px;word-break:keep-all}`;
  document.head.append(s);
}
function learnedPage(G) {
  const list = learnedCards(G);
  const grid = h('div', { class: 'cb-learned' }, ...list.map(c => (c.have
    ? h('div', { class: 'cl-card' }, h('div', { class: 'cl-t ol' }, tr(c.t)),
      h('div', { class: 'cl-steps' }, ...c.s.map(([e, t]) => h('div', { class: 'cl-s' }, h('b', {}, e), h('span', {}, tr(t))))))
    : h('div', { class: 'cl-card off' }, h('div', { class: 'cl-t' }, '?'), h('div', { class: 'cl-hint' }, tr(BOOK.notYet))))));
  return { grid, have: list.filter(c => c.have).length, total: list.length };
}
const regionOf = idx => REGIONS.find(r => idx >= r.from && idx < r.to) || REGIONS[0];
// friends who are rewards or specials shine (★★★); stage hosts are ★★; everyone else in the neighbourhood ★
const SPECIAL = new Set(['churro', 'raccoon', ...Object.values(CHAR_UNLOCK)]);

function friendCards(G) {
  const S = G.save, met = new Set(['mong', ...(S.chars || []), ...Object.keys(S.met || {})]);
  const first = {}, hosts = new Set();
  for (let i = 0; i < STAGE_COUNT; i++) {
    const sp = stageSpec(i), k = sp.timed ? 'raccoon' : THEMES[sp.room]?.friend;
    if (k) { hosts.add(k); if (first[k] == null) first[k] = i; if (i < (S.stage || 0)) met.add(k); }
  }
  for (const [i, k] of Object.entries(CHAR_UNLOCK)) if (first[k] == null || +i < first[k]) first[k] = +i;
  const keys = Object.keys(CHAR_DEFS).filter(k => k !== 'mom' && !k.includes('_'));
  return keys.map((k, n) => {
    const at = first[k], reg = at != null ? regionOf(at) : null;
    return { id: 'c:' + k, art: 'card_' + k, no: n + 1, of: keys.length, name: k === 'inky' && !inkyNamed(S) ? '???' : CHAR_DEFS[k].name, have: met.has(k),   // (먹물이: ??? until it says its name, 64판 — GPT QA ST-NAME)
      rar: SPECIAL.has(k) ? 3 : hosts.has(k) ? 2 : 1, region: reg?.id || 'home', regionName: reg?.name || '동네',
      theme: Object.values(THEMES).find(T => T.friend === k) || null, line: charLine(k), hint: at != null ? `스테이지 ${at + 1}에서 만날 수 있어` : '판에서 만난 친구를 터치해 봐', build: () => buildCharArt(k), spin: () => spinChar(k) };
  });
}
// (외부 QA17-03 10/21): a thing found in a stage is only *seen* (save.seen) — the card opens when it is yours (save.collection:
// the shop's 물건 tab sells what you've seen, 40, and its 새 물건, 80; a gift; without 경제 a stage's first clear gives one). So a
// card says how it really opens, and a seen one shows its dark shape with '발견' — found, not yet yours
function thingHint(G, k, seen) {
  if (!G.econ) return '판을 처음 깨면 하나씩 내 것이 돼요';
  if (seen) return '찾아봤어! 상점 물건 탭에서 데려와요';
  return SHOP_ITEMS.includes(k) ? '상점 물건 탭에서 살 수 있어요' : '판에서 찾으면 상점에 나와요';
}
function itemCards(G) {
  const own = new Set(G.save.collection || []), seen = new Set(G.econ ? G.save.seen || [] : []);
  const keys = Object.keys(ITEMS).filter(k => !ITEMS[k].decoy && !ITEMS[k].kit && k !== 'key' && k !== 'note');   // (a model kit's pieces come back as the model)
  return keys.map((k, n) => {
    const it = ITEMS[k], starter = STARTER_ITEMS.includes(k);
    const size = it.h < .09 ? '납작' : it.h < .18 ? '작음' : it.h < .3 ? '보통' : '큼';
    return { id: 'i:' + k, art: 'card_item_' + k, no: n + 1, of: keys.length, name: it.name, have: own.has(k),
      rar: starter ? 1 : STORY_ITEMS[k] ? 3 : 2, region: 'item', regionName: `크기 ${size}`,
      line: it.flat ? '얇아서 틈새에 쏙 들어가요' : starter ? '처음부터 내 방에 있던 물건' : '판에서 찾아 모은 물건',
      hint: thingHint(G, k, seen.has(k)), seen: !own.has(k) && seen.has(k), build: () => buildItem(k, { code: '★★★' }), item: true };
  });
}
function spinChar(k) { const c = new Char(k); c.setFace('happy'); c.pose = 'wave'; c.update(0); c.shadow.visible = false; return { root: c.root, tick: dt => c.update(dt) }; }   // (the big card's 3D: it keeps waving)
function buildCharArt(k) { const c = new Char(k); c.setFace('happy'); c.pose = 'wave'; c.update(0); c.shadow.visible = false; return c.root; }

function ensureArt(cards) {
  const jobs = cards.filter(c => (c.have || c.seen) && !ART[c.art]).map(c => c.item
    ? { key: c.art, build: c.build, dir: [.45, .6, 1], fit: 1.05 }
    : { key: c.art, build: c.build, dir: [.32, .38, 1], fit: 1.02 });
  if (jobs.length) Object.assign(ART, renderThumbs(jobs, 300));
}

function cardEl(c, G, { big = false } = {}) {
  const seen = G.save.cardSeen || (G.save.cardSeen = {});
  if (!c.have) return h('div', { class: 'tcard back' + (c.seen ? ' found' : '') + (big ? ' big' : '') },
    c.seen ? h('div', { class: 'cb-found' }, '발견') : null,
    c.seen && ART[c.art] ? h('div', { class: 'cb-q sil' }, h('img', { src: ART[c.art], alt: '' })) : h('div', { class: 'cb-q' }, '?'),
    h('div', { class: 'cb-hint' }, c.hint), h('div', { class: 'cb-no' }, `No.${String(c.no).padStart(3, '0')}`));
  // 별 셋 = 비밀 한 줄 (스토리 룸 10/19, user "캐릭터 카드"): a friend whose secret is open has a holo card
  const sec = c.id.startsWith('c:') && secretOpen(G.save.best, c.id.slice(2)); if (sec) style();
  const el = h('div', { class: `tcard r${c.rar} reg-${c.region}` + (big ? ' big' : '') + (sec ? ' sec' : ''), role: 'button', tabindex: '0', 'aria-label': `${c.name} 카드` },
    h('div', { class: 'cb-top' }, h('span', { class: 'cb-name' }, c.name), h('span', { class: 'cb-rar' }, '★'.repeat(c.rar))),
    h('div', { class: 'cb-art' }, h('img', { src: ART[c.art] || '', alt: '' })),
    h('div', { class: 'cb-line' }, c.line ? `“${c.line}”` : ''),
    h('div', { class: 'cb-foot' }, h('span', {}, `No.${String(c.no).padStart(3, '0')}/${c.of}`), h('span', {}, c.regionName)),
    h('div', { class: 'cb-holo' }));
  if (!big && !seen[c.id]) el.append(h('div', { class: 'cb-new' }, 'NEW'));
  return el;
}

// hold a card up close: it tilts toward the finger and the foil slides with it
function zoom(c, G) {
  const seen = G.save.cardSeen || (G.save.cardSeen = {}); if (!seen[c.id]) { seen[c.id] = 1; G.persist(); }
  const card = cardEl(c, G, { big: true });
  // a friend card can be made your own character: it walks with you in stages and hides in the boss stages
  const kind = c.id.startsWith('c:') ? c.id.slice(2) : null, isHero = kind && (G.save.hero || 'mong') === kind;
  // 같이 다니는 친구 (10/19): the friend you pick walks beside 몽글이 in the stages (companion.js); 몽글이 stays the hero
  // (친구 부르기 10/20, 레벨 세션: only a friend you've called home walks along — one you haven't wouldn't be with you)
  const notMine = ECON && kind && kind !== 'mong' && !isHero && !ownedFriends(G.save.home).has(kind);
  const heroBtn = kind ? G.ui.btn(kind === 'mong' ? (isHero ? '혼자 다니는 중' : '혼자 다니기') : isHero ? '같이 다니는 중' : notMine ? '집에 부르면 같이 다녀' : '같이 다니기', { color: isHero || notMine ? 'gray' : 'pink', cls: 'sm', disabled: isHero || notMine,
    onClick: dis => { if (dis) { if (notMine) G.ui.toast('꾸미기 → 친구에서 먼저 집에 불러 줘', ''); return; } G.save.hero = kind; G.persist(); G.audio.sfx('special'); G.ui.toast(kind === 'mong' ? '이제 몽글이 혼자 다녀요' : `이제 ${ga(c.name)} 같이 다녀요!`, 'green'); layer.remove(); } }) : null;
  // 몽글이's diary line for this friend: the tell, the promise
  const line = kind && diaryLine(kind);
  // R2: how this friend hides — '???' until you've found them hiding twice, then their habit fills in (three never came in
  // one campaign: a friend hides at most twice in the 70 stages — GPT QA L04, 10/19; a replay counts too)
  const hn = kind ? (G.save.habitSeen?.[kind] || 0) : 0, habit = kind && HABIT_LINE[kind];
  const habitEl = habit ? h('div', { class: 'cb-habit' }, h('b', {}, tr('숨는 버릇')), h('span', {}, hn >= 2 ? tr(habit) : `??? (${hn}/2)`)) : null;
  // 별 셋 = 비밀 한 줄 (스토리 룸 10/19): '???' until a stage this friend hosts gets three stars
  const sec = kind && diarySecret(kind), secEl = sec ? h('div', { class: 'cb-habit' }, h('b', {}, tr(SECRET_UI.book)), h('span', {}, secretOpen(G.save.best, kind) ? tr(sec) : tr(SECRET_UI.bookLock))) : null;
  const diary = line || habitEl || secEl ? h('div', { class: 'cb-diary' }, ...(line ? [h('b', {}, tr(BOOK.diary)), h('span', {}, tr(line))] : []), ...(habitEl ? [habitEl] : []), ...(secEl ? [secEl] : [])) : null;
  if (diary) style();
  // 도감 3D (③ 10/21, user: "캐릭터가 정면에 있다가 … 퍼스펙티브 꺾이면 약간 각도 변경되고 그런 인터렉션 … 캐릭터 더 크게"): the picture
  // turns into the friend or the thing itself, big in its tile and facing you (a friend keeps waving); rub the card and as it tilts
  // the friend turns the other way, as if it stood inside the card (the card's ±30° → ±20°, up and down ±10° — user 10/21 "반대방향으로 … 각 범위는 약간 좁혀"), a soft shadow under it and looks up or down a little; let go and it eases back to face you.
  // No spinning round any more, no device tilt (that asks for a permission) — the finger only
  const art = c.have && card.querySelector('.cb-art'), sv = art && spinView({ build: c.spin || c.build, dir: c.item ? [.45, .6, 1] : [.32, .38, 1], fit: c.item ? 1.05 : 1.02, zoom: c.item ? .8 : 1.02, shadow: true }, 300);
  let spinCv = null, want = { y: 0, p: 0 }, scene = null;
  if (sv) {
    spinCv = h('canvas', { class: 'cb-3d', width: 300, height: 300 }); const ctx = spinCv.getContext('2d');
    const y0 = sv.facing, cur = { y: 0, p: 0 };
    sv.draw(y0, ctx); art.querySelector('img')?.replaceWith(spinCv);
    // (③ 10/21, user: "도감카드 안에 배경도 만들어주고 패럴랙스로"): the place behind the friend (far, middle) and a few things in
    // front (near), each sliding its own amount with the tilt
    scene = cardScene(c.region, { theme: c.theme }); art.classList.add('scened'); art.prepend(scene.back); art.append(scene.front);
    let last = performance.now(), acc = 0;
    const loop = now => {
      if (!spinCv.isConnected) { sv.dispose(); return; }
      const dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
      const k = 1 - Math.exp(-dt * 9), moving = Math.abs(want.y - cur.y) + Math.abs(want.p - cur.p) > .002;
      cur.y += (want.y - cur.y) * k; cur.p += (want.p - cur.p) * k;
      if (acc >= 1 / 30 && (moving || !c.item)) { sv.draw(y0 + cur.y, ctx, acc, cur.p); acc = 0; }   // (30 a second at most; a thing stands still unless it moves)
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
  }
  // the card has a thickness (③ 10/21 시안): thin slices behind it, a shade darker — the edge shows as it tilts
  // (~10 px: 3% of the card's width)
  const slices = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(z => h('div', { class: 'cb-slice', style: `transform: translateZ(${-z * 1.1}px)` }));
  const wrap = h('div', { class: 'cb-wrap' }, ...slices, card); card.style.transform = 'translateZ(0)';
  const layer = h('div', { class: 'cb-zoom' }, wrap, ...(diary ? [diary] : []), ...(heroBtn ? [heroBtn] : []), h('div', { class: 'cb-tip' }, '카드를 드래그해 봐 · 바깥을 터치하면 닫혀요'));
  // (user 10/22 "카드 움직일 때 왜 이렇게 덜덜덜 … 부드럽게 슥"): the finger was measured against the card's own box, which moves
  // as the card turns — so each tilt changed the next one (shake); and each move jumped. Now: the box is taken once, flat, and
  // a frame loop eases the card toward the finger (and back when you let go), one transform a frame
  let r0 = null, aim = { x: 0, y: 0 }, now$ = { x: 0, y: 0 }, held = false, raf = 0, tl = 0;
  const flatBox = () => { if (!held) r0 = card.getBoundingClientRect(); };
  const tilt = (x, y) => { if (!r0) flatBox(); held = true; const r = r0;
    aim = { x: Math.max(-.5, Math.min(.5, (x - r.left) / r.width - .5)), y: Math.max(-.5, Math.min(.5, (y - r.top) / r.height - .5)) }; go(); };
  const settle = () => { held = false; aim = { x: 0, y: 0 }; go(); };   // (let go: card and friend ease back to face you)
  const step = t => {
    const dt = Math.min(.05, tl ? (t - tl) / 1000 : 1 / 60); tl = t; raf = 0;
    if (!wrap.isConnected) return;
    const k = 1 - Math.exp(-dt * (held ? 12 : 8));
    now$.x += (aim.x - now$.x) * k; now$.y += (aim.y - now$.y) * k;
    const nx = now$.x, ny = now$.y;
    // (user 10/21 "카드 각 더 꺾을 수 있게": ±15° more)
    wrap.style.transform = `rotateY(${nx * 44}deg) rotateX(${-ny * 40}deg)`; scene?.move(nx, ny);
    card.style.setProperty('--hx', `${50 + nx * 90}%`); card.style.setProperty('--hy', `${50 + ny * 90}%`);
    want = { y: -nx * 2 * .35, p: -ny * 2 * .175 };
    if (held || Math.abs(aim.x - nx) + Math.abs(aim.y - ny) > .001) go(); else { tl = 0; if (!held) flatBox(); }
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(step); };
  layer.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) tilt(e.clientX, e.clientY); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) layer.addEventListener(ev, settle);
  layer.addEventListener('pointerdown', e => { e.stopPropagation(); if (heroBtn?.contains(e.target) || diary?.contains(e.target)) return; if (!wrap.contains(e.target)) { layer.remove(); return; } tilt(e.clientX, e.clientY); });
  for (const ev of ['pointerup', 'wheel']) layer.addEventListener(ev, e => e.stopPropagation());
  G.audio.sfx('flip');   // (a card picked up — paper flip, 사운드 10/20)
  document.getElementById('app').append(layer);
  // (the edge: the card's colour, a shade darker)
  { const f2 = getComputedStyle(card).getPropertyValue('--f2').trim() || '#ff9fc4'; wrap.style.setProperty('--edge', `color-mix(in srgb, ${f2} 62%, #3a2453)`); }
}

// 도감's number (user 10/20: "도감이랑 내 방에 숫자 배지"): cards you have that came since the book was last opened; opening it
// clears the number (the cards inside keep their own NEW until you look at each)
// (③ 10/21: a card turned holo counts as new too — the result panel no longer says so)
// 도감 cards you have (friends met + things collected) — 상점 스페셜 opens one every ten (specials.js)
export const cardCount = G => [...friendCards(G), ...itemCards(G)].filter(c => c.have).length;
const haveIds = G => { const f = friendCards(G).filter(c => c.have); return [...f.map(c => c.id), ...itemCards(G).filter(c => c.have).map(c => c.id), ...f.filter(c => c.id.startsWith('c:') && secretOpen(G.save.best, c.id.slice(2))).map(c => 's:' + c.id)]; };
export function bookBadge(G, btn) {
  const S = G.save; if (!S.bookOpened) { S.bookOpened = haveIds(G); G.persist(); }
  if (!S.bookSec) { S.bookSec = 1; S.bookOpened = [...new Set([...S.bookOpened, ...haveIds(G).filter(id => id.startsWith('s:'))])]; G.persist(); }   // (holo cards from before 10/21: already seen)
  const was = new Set(S.bookOpened), n = haveIds(G).filter(id => !was.has(id)).length + (S.bookExtra || 0);   // (bookExtra: a page in '배운 것' that just opened — 같이 다니는 친구, ③ 10/21)
  if (n) btn.append(h('div', { class: 'badge new bookn' }, String(n)));
  return btn;
}
export function openCardBook(G, tab = 'friends') {
  { const S = G.save, b = haveIds(G); if ((S.bookOpened || []).length !== b.length || b.some(id => !S.bookOpened.includes(id))) { S.bookOpened = b; G.persist(); } }
  document.querySelectorAll('.badge.bookn').forEach(e => e.remove());
  if (G.save.bookExtra) { delete G.save.bookExtra; G.persist(); }
  G.audio?.sfx?.('flip');   // (the book opens / a tab turns — 사운드 10/20)
  const cards = tab === 'learned' ? [] : tab === 'items' ? itemCards(G) : friendCards(G);
  if (cards.some(c => c.have && !ART[c.art])) G.ui.toast('카드 인쇄 중…', '');
  // let the toast paint, then print the cards (a short pause on first open per tab)
  requestAnimationFrame(() => setTimeout(() => {
    let grid, have, total;
    if (tab === 'learned') { style(); ({ grid, have, total } = learnedPage(G)); }
    else {
      ensureArt(cards);
      have = cards.filter(c => c.have).length; total = cards.length;
      grid = h('div', { class: 'cb-grid' });
      for (const c of cards) { const el = cardEl(c, G); if (c.have) el.addEventListener('click', () => { zoom(c, G); el.querySelector('.cb-new')?.remove(); }); grid.append(el); }
    }
    const tabs = h('div', { class: 'cb-tabs' },
      G.ui.btn('친구', { color: tab === 'friends' ? 'pink' : 'gray', cls: 'sm', onClick: () => tab !== 'friends' && openCardBook(G, 'friends') }),
      G.ui.btn('물건', { color: tab === 'items' ? 'pink' : 'gray', cls: 'sm', onClick: () => tab !== 'items' && openCardBook(G, 'items') }),
      G.ui.btn(tr(BOOK.learned), { color: tab === 'learned' ? 'pink' : 'gray', cls: 'sm', onClick: () => tab !== 'learned' && openCardBook(G, 'learned') }));
    const bar = h('div', { class: 'cb-prog' }, h('i', { style: `width:${Math.round(have / Math.max(1, total) * 100)}%` }));
    const nSeen = tab === 'items' ? cards.filter(c => c.seen).length : 0;   // (found in a stage, not yet yours — QA17-03)
    const legend = nSeen ? h('div', { class: 'cb-legend' }, h('span', {}, h('b', {}, '내 것'), ` ${have}`), h('span', { class: 'f' }, h('b', {}, '발견'), ` ${nSeen}`)) : null;
    // (one way out, as 상점 and 더보기: the ✕ at the corner — the cards get the room the 닫기 row took; 2D UI 정리 ⑬ 10/19)
    G.ui.panel({ title: `도감 ${have}/${total}`, color: 'pink', cls: 'cardbook', body: [tabs, bar, ...(legend ? [legend] : []), grid], close: () => {} });
  }, 30));
}
