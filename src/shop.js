// Shop panel: furniture, wallpaper, paint, floors and home-zone expansions, all bought with in-game coins.
import { h, ICON } from './ui.js';
import { FURN_INFO } from './gfx/furniture.js';
import { SHOP_FURN, WALLPAPERS, PAINTS, FLOORS, HOME_ZONES, ZONE_TYPES, HOME_STYLES, ZONE_SIZES, pinZoneFurniture, furnPrice, zoneLayout, STARTER } from './catalog.js';
import { Room } from './room.js';
import { layoutFor, LAYOUTS } from './stages.js';
import { renderThumbs } from './thumbs.js';
import { PICK_ITEMS, chapterOfFurn, chapterNow, ECON, KEEPSAKE_PRICE } from './econ.js';
import { ITEMS } from './gfx/items.js';
import { locksOwned, LOCK_PRICE, LOCK_MAX, holderOf } from './raid.js';   // 자물쇠 사기 (털기 메타 10/19)
import { EN } from './i18n-en-dict.js';
import { SPECIALS, SPECIAL_TXT, specialState, feats } from './specials.js';
import { cardCount } from './cardbook.js';   // 스페셜 칸 (10/20)
import { lockPic } from './gifts.js';   // (the padlock in 3D, made once)
import * as THREE from 'three';
import { put, rbox, tor, sph, cyl } from './gfx/kit.js';
import { hasWall, hasFloor, patternThumb } from './patterns.js';   // 벽지·바닥 더하기 (10/20)

// furniture not open yet (10/19 night, user: "아직 오픈하지 못한 가구들은 실루엣만 보여주고"): a later chapter's piece, or a chapter
// box's piece nobody has shown you, stays in the grid as its own picture gone dark (no name, no price) under the rest
const K = (ko, en) => { EN[ko] = en; return ko; };
const SIL_TXT = {
  head: K('아직 안 열린 가구', 'Furniture not open yet'),
  box: K('장을 끝내면 들어와', 'Comes when the chapter ends'),   // (no chapter box since 10/20: its pieces come into the shop at the chapter's end)
  boxToast: K('그 장 마지막 판을 깨면 상점에 들어와!', 'It comes to the shop when you clear the chapter\'s last stage!'),
  chToast: K('아직 안 열렸어! 그 장에 가면 상점에 들어와', 'Not open yet! It comes to the shop in its chapter'),
};
const chOpens = c => K(`${c}장에서 열려`, `Opens in chapter ${c}`);
const PAT_LATER = K('다음 장에 들어오는 무늬', 'Patterns coming in later chapters');

const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };

// a little 3D picture of each home style (its stage set, or the plain zone with the starter furniture), made once
const STYLE_ART = {};
const fakeWorld = { shadowDirty: false, yaw: Math.PI / 4 };
// one theme's picture, drawn later (the 테마 tab: each room picture is a whole room — ~1 s for the lot at once)
function stylePic(st) {
  if (STYLE_ART[st.id]) return h('img', { src: STYLE_ART[st.id], alt: '', draggable: 'false' });
  const im = h('img', { class: 'lazy', alt: '', draggable: 'false', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' });
  LAZY.push({ el: im, fn: () => { try { Object.assign(STYLE_ART, renderThumbs([styleJob(st)], 220)); } catch {} if (STYLE_ART[st.id]) im.src = STYLE_ART[st.id]; im.classList.remove('lazy'); } });
  return im;
}
function styleJob(st) {
  return { key: st.id, dir: [.9, .95, 1], fit: .92, build: () => {
    const lay = st.theme && LAYOUTS[st.theme] ? { ...layoutFor(st.theme), bleed: null } : { ...zoneLayout({ type: st.indoor ? 'room' : 'yard', style: st.id, furniture: STARTER[st.indoor ? 'room1' : 'yard'] }), bleed: null };
    lay.walls = { ...(lay.walls || {}), S: 'none', E: 'none' };   // the picture looks in from the open front
    return new Room(fakeWorld, lay).group;
  } };
}

const TABS = [['tools', '아이템'], ['items', '물건'], ['furn', '가구'], ['special', '스페셜'], ['style', '테마'], ['size', '방 크기'], ['wall', '벽지'], ['paint', '페인트'], ['floor', '바닥'], ['zone', '구역 확장']];

// ctx: { G, zone (current zone object or null), onChange() }
export function openShop(G, ctx = {}, tab = 'furn') {
  const ui = G.ui, H = G.save.home;
  const zone = ctx.zone, ztype = zone ? ZONE_TYPES[zone.type] : null;
  const tabsEl = h('div', { class: 'shoptabs' });
  const grid = h('div', { class: 'shopgrid' });
  const note = h('div', { class: 'txt', style: 'font-size:14px;margin:4px 0 8px' });
  // a later chapter's wallpapers / floors under the rest: their picture gone dark, '???', and when they come (10/20)
  const laterPats = (list, floor) => {
    if (!list.length) return;
    grid.append(h('div', { class: 'shopsep' }, PAT_LATER));
    for (const p of list.sort((x, y) => (x.ch || 1) - (y.ch || 1))) {
      const sw = patSwatch(floor ? p.floorKind : p.wallKind, floor ? p.floor : p.wall, floor ? p.floor2 : p.wall2, floor); sw.style.filter = 'grayscale(1) brightness(.55)';
      grid.append(h('div', { class: 'card silc', 'aria-label': '???', onclick: () => { ui.toast(SIL_TXT.chToast, ''); G.audio.sfx('locked'); } }, sw, h('div', {}, '???'), h('div', { style: 'font-size:11px;color:#9b6cff' }, chOpens(p.ch))));
    }
  };
  // a piece bought: into the 보관함 — and where the scene can (내 방), straight out into the room, the shop closed (10/20)
  const bought = (t, name) => {
    H.inventory.push(t); G.persist();
    if (ctx.onBought) { ui.closePanel(true); ctx.onBought({ kind: 'furn', type: t }); return; }
    ui.toast(`${name} 구입! 보관함에서 꺼내 놓자`, 'green'); ctx.onChange?.('furn');
  };
  const render = () => {
    tabsEl.innerHTML = '';
    for (const [k, label] of TABS) if ((k !== 'items' && k !== 'tools' || G.econ) && (k !== 'special' || G.econ) && !(k === 'zone' && ECON)) tabsEl.append(h('button', { class: 'shoptab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; G.audio.sfx('click'); render(); } }, label));
    grid.innerHTML = '';
    note.textContent = '';
    if (tab === 'tools') {
      // 아이템 (③ 10/21, user on the 물건 tab: "이건 뭐지 .. 아이템으로 따로 빼야될거같은데? 디자인도"): the things you use — a
      // magnifier for the bag (60, up to 5; 경제 설계서 3-2), a padlock for a drawer at home (털기 메타 10/19: keys aren't sold,
      // they'd skip the lock puzzles) — on a tab of their own, away from the things you hide; drawn in 3D like every other card,
      // how many you have on a badge
      const L = G.save.lens || (G.save.lens = { bag: 0 }), bag = L.bag || 0, full = bag >= 5;
      note.textContent = '판과 내 집에서 쓰는 도구';
      grid.append(card(G, { img: lensPic(), name: '돋보기', sub: '판에서 힌트', price: 60, badge: full ? '가득' : `${bag}/5`, badgeOn: full, blocked: full ? '가방이 꽉 찼어' : null, one: true,
        onBuy: () => { L.bag = Math.min(5, (L.bag || 0) + 1); G.persist(); ui.toast(`돋보기 가방 ${L.bag}/5`, 'green'); render(); } }));
      const lk = locksOwned(G.save), lkFull = lk >= LOCK_MAX;
      grid.append(card(G, { img: lockPic(), name: '자물쇠', sub: '서랍 잠그기', price: LOCK_PRICE, badge: lkFull ? '가득' : `${lk}/${LOCK_MAX}`, badgeOn: lkFull, blocked: lkFull ? `${LOCK_MAX}개 다 있어` : null, one: true,
        onBuy: () => { G.save.raid.locksOwned = lk + 1; G.persist(); ui.toast(`자물쇠 ${lk + 1}개째! 숨기기에서 서랍을 잠가 봐`, 'green'); render(); } }));
    } else if (tab === 'items') {
      // 경제·로비 on (설계서 4-1): a thing you've found in a stage (도감) to hide at home (40). Something a resident took isn't for
      // sale: go and get it back. (The tools went to 아이템.)
      const took = new Set(Object.values(G.save.raid?.stolen || {}).flat());   // (raid.js: room id → the things taken from you)
      for (const t of (G.save.seen || []).filter(t => ITEMS[t] && !G.save.collection.includes(t))) {
        grid.append(card(G, { img: G.thumbs['item_' + t], name: ITEMS[t].name, sub: took.has(t) ? '털려 갔어' : '도감에서 본 것', price: took.has(t) ? null : 40, action: took.has(t) ? '되찾기' : '', one: true,
          onBuy: () => { G.collect(t); ui.toast(`${ITEMS[t].name} · 이제 내 집에 숨길 수 있어`, 'green'); render(); },
          onUse: took.has(t) ? () => { ui.closePanel(); G.go('visit', { force: holderOf(G.save, t) }); } : null }));
      }
      // (③ 10/21, user: "상점에서 물건들도 살수있게 해줘. 물건 종류도 많고 이쁜것들 위주로"): the pretty ones (① 맵·아트's list) for sale from the
      // start, a little dearer than one you've already met in a stage — each is a new card in the 도감 too (ten open a 스페셜)
      const seenSet = new Set(G.save.seen || []);
      const fresh = SHOP_ITEMS.filter(t => ITEMS[t] && !G.save.collection.includes(t) && !seenSet.has(t) && !took.has(t));
      if (fresh.length) {
        G.needThumbs?.(fresh.map(t => 'item_' + t));
        grid.append(h('div', { class: 'shopsep' + (grid.children.length ? '' : ' first') }, '새 물건'));
        for (const t of fresh) grid.append(card(G, { img: G.thumbs['item_' + t], name: ITEMS[t].name, sub: '도감 +1', price: ITEM_NEW_PRICE, one: true,
          onBuy: () => { G.collect(t); ui.toast(`${ITEMS[t].name} · 이제 내 집에 숨길 수 있어`, 'green'); render(); } }));
      }
    } else if (tab === 'furn') {
      note.textContent = zone ? `${zone.name}에 놓을 수 있는 가구예요. 숨을 곳이 많을수록 찾기 어려워져요.` : '';
      // 경제·로비 on: a chapter's pieces stay out until its last stage is cleared; then they're here as 기념품, at their price,
      // on top (and they go in any room). (10/20: the chapter box gives a gift now, not these — 재QA ST75-CHAPTER-SHOP-COPY)
      const offered = G.econ ? (H.offered || []).filter(t => FURN_INFO[t]) : [];
      for (const t of offered) { const owned = countOwned(H, t); grid.append(card(G, { img: pic(G, 'furn_' + t), name: FURN_INFO[t].name, sub: PICK_ITEMS.has(t) ? '장을 끝내면 들어오는 기념품' : '판을 깨서 들어온 기념품', price: furnPrice(t) || KEEPSAKE_PRICE, tag: owned ? `기념품 · 보유 ${owned}` : '기념품',
        onBuy: () => bought(t, FURN_INFO[t].name) })); }
      const later = [];
      for (const it of SHOP_FURN) {
        if (G.econ && offered.includes(it.type)) continue;   // (on top, as 기념품 — a chapter's pieces and the keepsakes, 10/20)
        if (ztype && !(ztype.indoor ? it.indoor : it.outdoor)) continue;
        const inf = FURN_INFO[it.type]; if (!inf) continue;
        // not open yet: a chapter box's piece you haven't been shown, or a later chapter's piece — a silhouette below
        const boxed = G.econ && PICK_ITEMS.has(it.type) && !countOwned(H, it.type), ch = chapterOfFurn(it.type);
        if (boxed || (G.econ && ch > chapterNow(G.save) && !countOwned(H, it.type))) { later.push({ t: it.type, ch, boxed }); continue; }
        const owned = countOwned(H, it.type);
        grid.append(card(G, { img: pic(G, 'furn_' + it.type), name: inf.name, sub: spotLater(G, it.type), price: furnPrice(it.type), tag: owned ? `보유 ${owned}` : null,
          onBuy: () => bought(it.type, inf.name) }));
      }
      if (later.length) {
        grid.append(h('div', { class: 'shopsep' }, SIL_TXT.head));
        later.sort((a, b) => (a.boxed - b.boxed) || (a.ch - b.ch) || a.t.localeCompare(b.t));
        for (const L of later) grid.append(silCard(G, L));
      }
    } else if (tab === 'wall' || tab === 'paint') {
      if (!zone || !ztype.indoor) { note.textContent = '벽지와 페인트는 실내 구역(방·창고)에 쓸 수 있어요.'; }
      const laterP = [];
      for (const wp of tab === 'wall' ? WALLPAPERS : PAINTS) {
        const owned = H.owned.wall.includes(wp.id) || !wp.price, on = zone?.paint?.wallId === wp.id || (!zone?.paint?.wallId && wp.price === 0 && tab === 'wall');
        if (G.econ && !owned && (wp.ch || 1) > chapterNow(G.save)) { laterP.push(wp); continue; }   // (a later chapter's pattern: below, dark — 10/20)
        const look = { wallId: wp.id, wallKind: wp.wallKind, wall: wp.wall, wall2: wp.wall2, ...(wp.wainscot ? { wainscot: wp.wainscot } : {}) };
        grid.append(card(G, { swatch: patSwatch(wp.wallKind, wp.wall, wp.wall2, false), name: wp.name, price: owned ? null : wp.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '바르기' : null,
          // (10/20, user: "상점 벽 바닥은 미리보기 가능하게 가능?": one you don't own goes on your walls first — 사기 or 되돌리기)
          onBuy: null, blocked: !zone || !ztype.indoor ? '실내에서만 바를 수 있어' : null,
          onUse: () => owned ? apply() : !zone || !ztype.indoor ? ui.toast('실내에서만 바를 수 있어', 'red') : preview(wp.name, wp.price, look, () => H.owned.wall.push(wp.id)) }));
        function apply() {
          if (!zone || !ztype.indoor) { ui.toast('실내에서만 바를 수 있어', 'red'); G.persist(); render(); return; }
          zone.paint = { ...(zone.paint || {}), ...look };
          G.persist(); G.audio.sfx('place'); ctx.onChange?.('paint'); render(); peekShop(G, ctx);
        }
      }
      laterPats(laterP, false);
    } else if (tab === 'floor') {
      const laterP = [];
      for (const fl of FLOORS) {
        if (ztype && fl.indoor !== ztype.indoor) continue;
        const owned = fl.price === 0 || H.owned.floor.includes(fl.id), on = zone?.paint?.floorId === fl.id;
        if (G.econ && !owned && (fl.ch || 1) > chapterNow(G.save)) { laterP.push(fl); continue; }
        const look = { floorId: fl.id, floorKind: fl.floorKind, floor: fl.floor, floor2: fl.floor2 };
        grid.append(card(G, { swatch: patSwatch(fl.floorKind, fl.floor, fl.floor2, true), name: fl.name, price: owned ? null : fl.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '깔기' : null,
          onBuy: null,   // (미리보기 first, as the walls)
          onUse: () => owned ? apply() : zone && preview(fl.name, fl.price, look, () => H.owned.floor.push(fl.id)) }));
        function apply() {
          if (!zone) return;
          zone.paint = { ...(zone.paint || {}), ...look };
          G.persist(); G.audio.sfx('place'); ctx.onChange?.('paint'); render(); peekShop(G, ctx);
        }
      }
      laterPats(laterP, true);
    } else if (tab === 'special') {
      // 스페셜 (10/20): open ones at their price; locked ones dark, with their condition and how far along
      note.textContent = SPECIAL_TXT.note;
      const f = feats(G.save); f.cards = cardCount(G);   // (도감으로 열리는 스페셜 — ③ 10/21)
      for (const sp of SPECIALS) {
        const inf = FURN_INFO[sp.t]; if (!inf) continue;
        const st = specialState(G.save, sp, f), owned = countOwned(H, sp.t);
        if (!st.open) {
          grid.append(h('div', { class: 'card silc', onclick: () => { ui.toast(`${SPECIAL_TXT.locked} · ${sp.say}`, ''); G.audio.sfx('locked'); } },
            pic(G, 'furn_' + sp.t),
            h('div', {}, '🔒 ' + sp.say), h('div', { style: 'font-size:11px;color:#9b6cff' }, `${st.have}/${st.n}`)));
          continue;
        }
        grid.append(card(G, { img: pic(G, 'furn_' + sp.t), name: inf.name, sub: sp.say, price: sp.price, tag: owned ? `보유 ${owned}` : SPECIAL_TXT.head,
          onBuy: () => bought(sp.t, inf.name) }));
      }
    } else if (tab === 'style') {
      note.textContent = zone ? `${zone.name}의 분위기를 통째로 바꿔요. 바꾸면 벽지·바닥은 그 테마 것으로 돌아가요.` : '';
      H.owned.style = H.owned.style || [];
      const shown = HOME_STYLES.filter(st => !ztype || st.indoor === ztype.indoor);
      for (const st of shown) {
        const owned = st.price === 0 || H.owned.style.includes(st.id), on = (zone?.style || (st.price === 0 ? st.id : null)) === st.id && (zone?.style ? true : st.price === 0);
        grid.append(card(G, { img: stylePic(st), swatch: swatch(st.sw[0], st.sw[1], st.indoor ? 'wood' : 'dots'), name: st.name, price: owned ? null : st.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '바꾸기' : null,
          onBuy: null,   // (user 10/20: "테마도 미리보기 가능하게" — one you don't own goes on the room first: 사기 or 되돌리기)
          onUse: () => owned ? apply() : zone && preview(st.name, st.price, null, () => H.owned.style.push(st.id), st.id) }));
        function apply() {
          if (!zone) return;
          zone.style = st.id; zone.paint = {};
          G.persist(); G.audio.sfx('place'); ui.toast(`${ga(zone.name)} '${st.name}' 테마로 바뀌었어!`, 'green'); ctx.onChange?.('paint'); render(); peekShop(G, ctx);
        }
      }
    } else if (tab === 'size') {
      const cur = zone?.size || 0;
      note.textContent = zone ? `${zone.name} 크기를 한 칸씩 넓혀요. 놓아 둔 가구와 숨긴 물건은 그대로예요.` : '';
      ZONE_SIZES.forEach((S, k) => {
        const owned = k <= cur, next = k === cur + 1;
        grid.append(card(G, { swatch: swatch('#fff3e0', '#e8c49a', 'wood'), name: `${S.w} × ${S.d}`, sub: (k === 0 ? '기본 크기' : owned ? '넓힘' : next ? '다음 단계' : '앞 단계를 먼저') + (G.econ && !ECON && k >= 1 && k <= 3 ? ' · 친구 자리 +1' : ''), price: owned || !next ? null : S.price, tag: k === cur ? '지금 크기' : owned ? '보유' : null,
          onUse: ECON && next ? () => growPeek(k, S) : null,   // (방 넓히기: 미리보기 first — the new row on the floor, then 넓히기 or 되돌리기)
          onBuy: owned || !next || ECON ? null : () => { if (!zone) return; const from = zone.size || 0; pinZoneFurniture(zone); zone.size = k; G.persist();
            if (ECON) { ui.closePanel(); ctx.onClose?.(); ctx.onChange?.('grow', from); return; }   // (방 넓히기: the walls go out in the room, as from its sign)
            G.audio.sfx('win'); ui.toast(`${ga(zone.name)} ${S.w}×${S.d}로 넓어졌어!`, 'green'); ctx.onChange?.('paint'); render(); } }));
      });
    } else if (tab === 'zone') {
      note.textContent = '스테이지를 깨면 무료로 열리고, 미리 사서 열 수도 있어요.';
      for (const z of HOME_ZONES) {
        const open = G.zoneOpen(z.id);
        grid.append(card(G, { swatch: swatch(z.type === 'yard' || z.type === 'park' ? '#9be07f' : '#ffe6c8', z.type === 'storage' ? '#c99c6c' : '#ffffff', z.type === 'park' ? 'dots' : 'wood'),
          name: z.name, sub: open ? '열림' : `스테이지 ${z.unlock.stage}에서 무료`, price: open ? null : z.unlock.price, tag: open ? '보유' : null,
          onBuy: open ? null : () => { H.bought.push(z.id); G.ensureZone(z.id); G.persist(); ui.toast(`${ga(z.name)} 열렸어!`, 'green'); ctx.onChange?.('zone'); } }));
      }
    }
    runLater(grid);   // (the icons and spot counts left for later: the cards in view first, a little each frame)
  };
  // 방 넓히기 미리보기 (UI 세션 10/20, user: "벽·바닥으로 가야 저거 늘리는 UI 나오는 걸로 하자"): the shop steps aside and the room shows
  // its next row on the floor (dashed, arrows running out — myhome.js growTick); the bar asks 넓히기 (the coins, the walls go out)
  // or 되돌리기 (back to this tab). Nothing is bought while you look.
  function growPeek(k, S) {
    if (!zone) return;
    const A = ZONE_SIZES[zone.size || 0];
    ui.closePanel(true); ctx.onPreview?.(true); ctx.onChange?.('growpeek', true); G.audio.sfx('place');
    const done = () => { G._pvUndo = null; bar.remove(); ctx.onChange?.('growpeek', false); ctx.onPreview?.(false); };
    G._pvUndo = () => { G._pvUndo = null; bar.remove(); };   // (QA9: the scene left while this was up — main.js go; the bar went with it)
    const grow = ui.btn('넓히기', { color: 'green', icon: 'hammer', cls: 'sm', onClick: () => {
      const need = S.price - (G.save.coins || 0);
      if (need > 0) { ui.toast(`코인 ${need}개 더 모으면 넓힐 수 있어`, 'red'); G.audio.sfx('miss'); return; }
      done(); const from = zone.size || 0; G.addCoins(-S.price); G.audio.sfx('buy'); pinZoneFurniture(zone); zone.size = k; G.persist(); ctx.onClose?.(); ctx.onChange?.('grow', from); } });
    if ((G.save.coins || 0) < S.price) grow.classList.add('short');
    const bar = h('div', { class: 'previewbar', style: 'position:absolute;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fffaf2;border:4px solid var(--ink,#3a2453);border-radius:20px;pointer-events:auto;z-index:30;white-space:nowrap' },
      h('div', { style: 'display:flex;flex-direction:column;line-height:1.15' }, h('b', {}, `${A.w} × ${A.d}`, h('span', { style: 'font-family:system-ui,sans-serif;margin:0 5px' }, '→'), `${S.w} × ${S.d}`), h('span', { style: 'font-size:13px;color:#8a6a9a' }, h('span', { html: `${ICON.coin}`.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"') + ' ' + S.price + ' · ' }), h('span', {}, `가구 놓을 칸 +${S.w * S.d - A.w * A.d}`))),
      ui.btn('되돌리기', { color: 'blue', cls: 'sm', onClick: () => { done(); openShop(G, ctx, tab); } }), grow);
    document.getElementById('app').append(bar);
  }
  // 미리보기 (10/20): the shop steps aside, the room wears it, and a bar at the bottom asks — 사기 (the coins, and it stays) or
  // 되돌리기 (back as it was). Either way the shop comes back on the same tab. Nothing is saved while you look.
  // (style: a theme's id — the whole room's look tried on, its walls and floor back to the theme's own, as 바꾸기 does)
  function preview(name, price, look, own, style = null) {
    if (!zone) return;
    const was = zone.paint ? { ...zone.paint } : null, wasStyle = zone.style;
    // (QA9 10/21) while you look, the room's own look rides in the save (zone._pv): a save written meanwhile (the lobby saves on a
    // mode change) and an app closed mid-look come back as they were — main.js puts it back on load — and leaving the scene
    // undoes it (G._pvUndo, main.js go): the bar used to stay up over the next scene, its buttons working the old one
    zone._pv = { paint: was, style: wasStyle };
    G._pvUndo = () => { G._pvUndo = null; bar.remove(); zone.paint = was; if (style) zone.style = wasStyle; delete zone._pv; };
    ui.closePanel(true); ctx.onPreview?.(true); if (style) { zone.style = style; zone.paint = {}; } else zone.paint = { ...(zone.paint || {}), ...look }; ctx.onChange?.('paint'); ctx.onPreview?.(true); G.audio.sfx('place');   // (the view before the rebuild too: the lobby mustn't fly back to its close-up)
    // (10/20, user: "테마든 벽이든 사기 누르면 다시 상점으로 나오는 게 아니고 방으로 가야 할 듯": 사기 → the room, dressed in it; 되돌리기 → the shop's same tab)
    const done = keep => { G._pvUndo = null; delete zone._pv; bar.remove(); if (!keep) { zone.paint = was; if (style) zone.style = wasStyle; ctx.onChange?.('paint'); ctx.onPreview?.(true); } ctx.onPreview?.(false); if (keep && ctx.onBought) ctx.onBought({ kind: style ? 'style' : 'paint' }); else openShop(G, ctx, tab); };
    const buy = ui.btn('사기', { color: 'green', icon: 'coin', cls: 'sm', onClick: () => {
      if ((G.save.coins || 0) < price) { ui.toast('코인이 모자라!', 'red'); G.audio.sfx('miss'); return; }
      G.addCoins(-price); own(); G.persist(); G.audio.sfx('buy'); ui.toast(`${name} 샀어!`, 'green'); done(true); } });
    const bar = h('div', { class: 'previewbar', style: 'position:absolute;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fffaf2;border:4px solid var(--ink,#3a2453);border-radius:20px;pointer-events:auto;z-index:30;white-space:nowrap' },
      h('div', { style: 'display:flex;flex-direction:column;line-height:1.15' }, h('b', {}, name), h('span', { style: 'font-size:13px;color:#8a6a9a', html: `${ICON.coin}`.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"') + ' ' + price })),
      ui.btn('되돌리기', { color: 'blue', cls: 'sm', onClick: () => done(false) }), buy);
    document.getElementById('app').append(bar);
  }
  render();
  const coinPill = ui.pill('coin', G.save.coins);
  G.coinPills = [...(G.coinPills || []), coinPill];
  ui.panel({ title: '상점', color: 'orange', cls: 'shop', body: [h('div', { class: 'shophead' }, coinPill), tabsEl, note, grid], close: () => ctx.onClose?.() });
}

// 바르기 대 보기 (③ 10/21): with the shop open the new walls went on behind it and showed only once it was shut —
// the shop steps down out of the way for a moment so the room shows them, then comes back on the same tab (a touch brings it back at once)
const PEEK = typeof location === 'undefined' || !/[?&]shoppeek=0(&|$)/.test(location.search);   // (on: 검토 10/21 '기본은 넣는 쪽'; ?shoppeek=0 for the old way)
function peekShop(G, ctx) {
  const ui = G.ui, p = ui.panelOpen; if (!PEEK || !p || p._peek) return;
  p._peek = true; ctx.onPreview?.(true); ui.overlay.classList.add('shoppeek');
  const back = () => { if (!p._peek) return; p._peek = false; clearTimeout(t); removeEventListener('pointerdown', back, true); ui.overlay.classList.remove('shoppeek'); ctx.onPreview?.(false); };
  const t = setTimeout(back, 1600);
  setTimeout(() => { if (p._peek) addEventListener('pointerdown', back, true); }, 80);
}
// the hiding things the shop sells from the start (① 맵·아트 10/21 후보 (가) — the starter donut·duck, kit parts and the plain ones left out)
const SHOP_ITEMS = ['cookie', 'console', 'teddy', 'crown', 'gift', 'icecream', 'cupcake', 'heart', 'star', 'bunnyband', 'snowglobe', 'honeypot', 'medal', 'firehelmet', 'strawhat', 'yarn', 'slipper', 'bubbletea', 'onigiri', 'ramen', 'keyring', 'rubberduck2', 'hairpin', 'acorn', 'coin', 'sunglasses'];
const ITEM_NEW_PRICE = 80;   // (one you've met in a stage: 40)
// 상점 빨리 열기 (③ 10/21, user on the phone: "상점 들어갈때 좀 느려 ㅋㅋ 갯수가 많아서 그런가"): the first open drew every furniture icon
// it hadn't drawn yet (up to ~200 3D renders) and built every piece once to count its hiding spots — 2+ s before the panel
// showed. Now the panel opens at once: a missing icon is a soft placeholder and a spot count '…', filled in afterwards in page
// order (the cards in view first), 12 ms of it a frame. A drawn icon stays for the session (G.thumbStore — data URLs drawn by
// the one shared icon renderer: no new WebGL context, no texture kept)
let LAZY = [];
function runLater(root) {
  const q = LAZY; LAZY = []; let i = 0;
  const step = () => {
    if (!root.isConnected) return;
    const t0 = performance.now();
    while (i < q.length && performance.now() - t0 < 12) { const it = q[i++]; if (it.el.isConnected) it.fn(); }
    if (i < q.length) requestAnimationFrame(step);
  };
  if (q.length) requestAnimationFrame(step);
}
function pic(G, key) {
  const src = G.thumbStore?.[key]; if (src) return h('img', { src, alt: '', draggable: 'false' });
  const im = h('img', { class: 'lazy', alt: '', draggable: 'false', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' });
  LAZY.push({ el: im, fn: () => { G.needThumbs?.([key]); const u = G.thumbStore?.[key]; if (u) im.src = u; im.classList.remove('lazy'); } });   // (no icon to draw: the placeholder goes all the same)
  return im;
}
function spotLater(G, t) {
  if (_sc[t] != null) return `숨을 곳 ${_sc[t]}`;
  const el = h('span', {}, '숨을 곳 …');
  LAZY.push({ el, fn: () => { el.textContent = `숨을 곳 ${spotCount(G, t)}`; } });
  return el;
}
let LENS_PIC = null;
const lensPic = () => LENS_PIC ||= renderThumbs([{ key: 'lens', dir: [.2, .3, 1], fit: 1.05, build: () => {
  const g = new THREE.Group(), o = { metal: .4, rough: .35 };
  g.add(put(tor(.07, .017, '#ff7a45', o, Math.PI * 2, 10, 28), 0, .03, 0));                       // the rim
  g.add(put(cyl(.068, .068, .008, '#bfe9ff', { rough: .1 }, 28), 0, .03, 0, Math.PI / 2, 0, 0));   // the glass
  g.add(put(sph(.016, '#ffffff', null, 10, 8), -.028, .058, .006));                                  // a glint
  g.add(put(rbox(.032, .11, .032, '#8a5a3a', .014), .062, -.07, 0, 0, 0, Math.PI / 5));          // the handle
  g.add(put(rbox(.04, .022, .04, '#ffb23a', .01, o), .042, -.042, 0, 0, 0, Math.PI / 5));        // its collar
  return g;
} }], 160).lens;
let buyAt = 0;   // (QA3 10/19) one purchase per 0.45 s: a double tap bought twice
function card(G, { img, swatch: sw, name, sub, price, tag, badge, badgeOn, action, onBuy, onUse, blocked = null, one = false }) {
  const c = h('div', { class: 'card' + (one ? ' one' : '') + (blocked && price != null ? ' maxed' : '') },
    tag ? h('div', { class: 'tag' }, tag) : null,
    badge ? h('div', { class: 'cnt' + (badgeOn ? ' on' : '') }, badge) : null,
    img instanceof Element ? img : img ? h('img', { src: img }) : sw,
    h('div', {}, name),
    sub ? h('div', { class: 'sub', style: 'font-size:11px;color:#9b6cff' }, sub) : null,
    price != null ? h('div', { class: 'pr', html: ICON.coin + price }) : h('div', { class: 'pr', style: 'color:#2f8f1b' }, action || ''));
  c.addEventListener('click', () => {
    if (price != null && onBuy) {
      if (blocked) { G.ui.toast(blocked, 'red'); G.audio.sfx('miss'); return; }   // (QA3 10/19: the coins went first)
      if (performance.now() - buyAt < 450) return; buyAt = performance.now();
      if (G.save.coins < price) { G.ui.toast('코인이 모자라!', 'red'); G.audio.sfx('miss'); return; }
      G.addCoins(-price); G.audio.sfx('buy'); onBuy();
    } else if (onUse) onUse();
  });
  return c;
}
// a piece not open yet: its icon as a dark silhouette, '???', and when it opens
function silCard(G, { t, ch, boxed }) {
  return h('div', { class: 'card silc', 'aria-label': '???', onclick: () => { G.ui.toast(boxed ? SIL_TXT.boxToast : SIL_TXT.chToast, ''); G.audio.sfx('locked'); } },
    pic(G, 'furn_' + t),
    h('div', {}, '???'),
    h('div', { style: 'font-size:11px;color:#9b6cff' }, boxed ? SIL_TXT.box : chOpens(ch)));
}
function swatch(a, b, kind) {
  const bg = kind === 'plain' ? a : kind === 'stripe' ? `repeating-linear-gradient(90deg, ${a} 0 10px, ${b} 10px 18px)`
    : kind === 'check' ? `conic-gradient(${b} 25%, ${a} 0 50%, ${b} 0 75%, ${a} 0) 0 0/18px 18px`
    : kind === 'wood' ? `repeating-linear-gradient(90deg, ${a} 0 14px, ${b} 14px 16px)`
    : `radial-gradient(${b} 22%, transparent 24%) 0 0/14px 14px, ${a}`;
  return h('div', { class: 'swatch', style: `background:${bg}` });
}
// a pattern's swatch: the painted picture for the newer ones (patterns.js), the CSS stand-in for the first eight
function patSwatch(kind, a, b, floor) {
  if (!(floor ? hasFloor(kind) : hasWall(kind))) return swatch(a, b, floor ? kind === 'checker' ? 'check' : kind === 'planks' ? 'wood' : 'dots' : kind);
  return h('div', { class: 'swatch', style: `background:url(${patternThumb(kind, a, b, floor)}) 0 0/100% 100%` });
}
function countOwned(H, t) { let n = H.inventory.filter(x => x === t).length; for (const id in H.zones) n += H.zones[id].furniture.filter(f => f.type === t).length; return n; }
const _sc = {};
function spotCount(G, t) { if (_sc[t] == null) { try { _sc[t] = G.makeFurniture(t).spots.length; } catch { _sc[t] = 1; } } return _sc[t]; }
