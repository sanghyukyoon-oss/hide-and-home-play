// 로비 = 내 방 (경제·메타 설계서 2장, 10/19 — user: "로비는 내 방으로 변경하는게 좋겠어. … 내방 꾸미는 재미를 알려주고싶어서.
// 처음엔 빈 공간에 캐릭터 혼자있고 친구들 몇 있고 (새로만나는 캐릭터) … 내가 좋아하는 캐릭터 배치할수있게 … 방 열리면서 튜토").
// With G.econ on, the first screen is 몽글이's room. The play button, map, card book, shop and 더보기 (with 동네 구경, the old
// neighbourhood home) move here; 꾸미기 · 숨기기 · 놀러 가기 sit under the play button. Friends you've met come in and sit down
// (3 seats, +1 for each of the first three room sizes); in 꾸미기 they move, turn and go to the friend box like furniture.
import * as THREE from 'three';
import { MyHomeScene } from './myhome.js';
import { giftChoices, giftPanel, grantGift, openStarGifts } from '../gifts.js';   // 선물 상자 (10/20)
import { HomeScene, playButton, openMore } from './home.js';
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { openRoadmap } from '../roadmap.js';
import { openCardBook, bookBadge, cardCount } from '../cardbook.js';
import { cardOpened } from '../specials.js';   // 도감으로 열리는 스페셜 (③ 10/21)
import { runRaids, unseen } from '../raid.js';
import { shieldChip } from '../raidreplay.js';   // 문단속 (털기 메타 10/19)
import { playDialog } from '../story.js';
import { clearFollowupFinish } from '../followup.js';
const SHELF_ON = false;   // 찾은 것 선반 (경제 10/19) — off: the user found it ugly (10/19 evening)
import { HOME_TUT, ENDING, endCard, choose, giftSeats, newCard, BUDDY_LINE, UI as SUI } from '../script.js';
import * as SCRIPT from '../script.js';   // (ROOM_ARRIVE: a friend's first line in your room — 스토리 룸, read if it is there)
import { indexSpots } from '../room.js';
import { starBoxState, starBoxThree } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)
import { buildItem, ITEMS } from '../gfx/items.js';
import { h, ICON } from '../ui.js';
import { ease, clamp } from '../util.js';
import { tr } from '../i18n.js';
import { nextSeat, metFriends, seatsOf, seatedAll, PICKS, pickPanel, takePick, chapterOfFurn, chapterNow, takeGiftPick, ECON, friendPrice, callableFriends } from '../econ.js';
import { SHOP_FURN, STARTER_ITEMS, WALLPAPERS, FLOORS } from '../catalog.js';
import { regionOf } from '../stages.js';
import { QA_TOOLS } from '../build.js';
import { TV_TYPES, tvScreens, openMongleTV, tvLevel } from '../mongletv.js';   // 몽글 TV (10/19)
import { lvOf } from '../level.js';   // 내 Lv: 별 + 털기 (10/20)
import { settleOpen } from '../raidrun.js';   // 털다 만 집 정산 (QA9, 10/21)
const REGION_NAME = i => regionOf(i)?.name || '';
const REGIONS_AT = ch => [0, 12, 21, 31, 40, 49, 60][ch - 1] ?? 0;   // (the first stage of chapter ch)

const GIFTS = ['drawers', 'chest', 'wardrobe'];   // 집들이 선물: each has a drawer, a lid or a door — "inside, nobody finds it" follows
const MAX_HIDE = 5;
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const nameOf = k => CHAR_DEFS[k]?.name || '';

// ── 판 끝 집으로 가져가기 (검토 세션 10/19, 사용자 OK): the 찾은 것 선반's cubbies (top row first, left to right) and the marks
// for what is still to come — a '?' in an empty cubby, a ring with a '?' where the next friend will sit
const SLOTS = [.835, .455, .075].flatMap(y => [-.6975, -.2325, .2325, .6975].map(x => [x, y]));
let QTEX = null, QMAT = null, RING = null;
const qMat = () => QMAT || (QMAT = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(32, 32, 27, 0, Math.PI * 2); x.fill();
  x.lineWidth = 4; x.setLineDash([7, 5]); x.strokeStyle = 'rgba(155,108,255,.85)'; x.stroke();
  x.fillStyle = '#9b6cff'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 32, 34);
  QTEX = new THREE.CanvasTexture(c); QTEX.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: QTEX, transparent: true, depthWrite: false });
})());
const noPick = o => { o.traverse(c => { c.userData.noPick = true; c.raycast = () => {}; }); return o; };
// 먹물이 빈 자리 (스토리 룸 10/20): one cushion and crayon footprints from the door, shared meshes so a visit adds nothing new
let INK = null;
const inkMeshes = () => INK ||= {
  cushion: new THREE.CylinderGeometry(.24, .26, .07, 20), cm: new THREE.MeshStandardMaterial({ color: '#3d3658', roughness: .9 }),
  dot: new THREE.CircleGeometry(.035, 12), paw: new THREE.CircleGeometry(.06, 14), toe: new THREE.CircleGeometry(.026, 10),
  cols: ['#ff6fa8', '#5ab8ff', '#a77bff', '#4fcf86'].map(color => new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })),
};
const qSprite = s => { const sp = new THREE.Sprite(qMat()); sp.scale.setScalar(s); return noPick(sp); };
function seatGhost() {
  RING ||= { g: new THREE.RingGeometry(.19, .25, 32), m: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8, depthWrite: false }) };
  const g = new THREE.Group(), r = new THREE.Mesh(RING.g, RING.m); r.rotation.x = -Math.PI / 2; r.position.y = .015; g.add(r);
  const q = qSprite(.26); q.position.y = .42; g.add(q);
  return noPick(g);
}
function shelfThing(t) {
  const g = buildItem(t, { code: '★★★' }), it = ITEMS[t] || {};
  g.scale.multiplyScalar(Math.min(1.4, .26 / Math.max(.05, it.h || .15))); g.rotation.y = .25;
  return noPick(g);
}

// (친구 칸 사기 10/20) every seat taken: the next seat to buy, or the box
const seatFullMsg = (save, z) => { const nx = nextSeat(save, z); return `친구 칸 ${seatsOf(z)}개가 다 찼어 · ` + (nx ? '친구 탭 끝에서 칸을 늘리거나 앉은 친구를 상자에 넣어 봐' : '앉은 친구를 상자에 넣으면 자리가 나'); };
export class LobbyScene extends MyHomeScene {
  constructor(G) { super(G); this.name = 'home'; this.lobby = true; this.seated = []; }
  async enter(o = {}) {
    const G = this.G;
    settleOpen(G);   // (③ 10/21 로비 정리: the coins come in without a toast)   // (QA9 P2: the app closed mid-raid)
    if (!o.ending) runRaids(G);   // residents who sneaked in while you were away (coins land before the pills show them)
    // 판 끝 집으로 가져가기 (10/19): on the way to the next stage, the room for under 3 s (the room's first opening plays instead)
    // (검토 P1 10/19: after 2판's '계속 찾기' the room's first opening is on the way too — 3 s, the gift set down, no pick; the
    // hide lesson waits for the first 숨기기)
    const opens = !!o.passage && G.homeOpen() && !G.save.tut?.home;
    const pass = o.passage && G.homeOpen() ? { ...o.passage, opens } : null;
    this._shelfHold = new Set([...(pass?.items || []), ...(pass?.item ? [pass.item] : [])]);   // (the things fly onto the shelf, so the shelf starts without them)
    await super.enter({ ...o, mode: pass ? 'passage' : !o.mode || o.mode === 'view' ? 'lobby' : o.mode });
    if (this.dead) return;
    if (o.ending) { this.placeInkySeat(true); return this.playEnding(o.ending); }   // 엔딩 (스토리 룸 10/19) — 먹물이는 비워 둔 방석에
    if (pass) return this.runPassage(pass);
    delete this.H.shelfNew;
    // things gathered for the room that never passed through it (the 홈 button instead of '다음'): set down now, quietly
    const Q = this.H.homeQ; if (Q?.furns?.length && G.homeOpen()) { for (const f of Q.furns) { const i = this.H.inventory.lastIndexOf(f); if (i >= 0) { this.placeFromInv(i); this.select(null); } } }
    this.H.homeQ = { friends: [], furns: [], items: [] };
    // (③ 10/21 "모든 연락은 숫자 뱃지": who came while you were away is a number on 놀러 가기 — its news open from there)
    const tut = G.save.tut || (G.save.tut = {});
    if (G.homeOpen() && !tut.home) await this.roomOpens();
    else if (G.homeOpen() && this.H.giftDue && !ECON) { const t = await this.giftCards(GIFTS); if (this.dead) return; this.giveGift(t); this.frameLobby(); this.arrivals(); }   // (left before picking)
    else if (G.homeOpen() && this.H.giftDue) { delete this.H.giftDue; this.ensureDrawer(); this.arrivals(); }   // (경제·로비: no housewarming pick any more — the room's drawer instead, 10/20)
    else if (G.homeOpen()) this.arrivals();
    if (G.homeOpen()) this.placeInkySeat();   // (after the arrivals: the friends' seats first, the inky kid's cushion on what is left)
    // 같이 다니는 친구 (10/19, user OK): after 12판, once — a 🆕 badge and a friend in the room asks to come along
    // (③ 10/21: no friend's bubble and card any more — the 같이 다니는 친구 page waits in 도감, a number on it says so)
    if (G.homeOpen() && (G.save.stage || 0) >= 12 && !G.save.cards?.buddy && !G.bot) { (G.save.cards || (G.save.cards = {})).buddy = true; G.save.bookExtra = (G.save.bookExtra || 0) + 1; G.persist(); if (this.bookBtn) { this.bookBtn.querySelector('.bookn')?.remove(); bookBadge(G, this.bookBtn); } }
    // a new chapter's furniture is in the shop now (설계서 N3): once per chapter — a number on 상점 until it is opened
    const ch = chapterNow(G.save);
    if (G.homeOpen() && ch > (this.H.shopCh || 1)) {
      const n = SHOP_FURN.filter(it => chapterOfFurn(it.type) === ch).length; this.H.shopCh = ch; G.persist();
      const m = [...WALLPAPERS, ...FLOORS].filter(p => p.ch === ch).length;   // (the chapter's new wallpapers and floors too — 10/20)
      const msg = n && m ? `상점에 '${REGION_NAME(REGIONS_AT(ch))}' 가구 ${n}개, 벽지·바닥 ${m}개가 들어왔어!` : n ? `상점에 '${REGION_NAME(REGIONS_AT(ch))}' 가구 ${n}개가 들어왔어!` : m ? `상점에 새 벽지·바닥 ${m}개가 들어왔어!` : null;
      if (msg) { this.H.shopNew = (this.H.shopNew || 0) + n + m; G.persist(); }   // (③ 10/21 "모든 연락은 숫자 뱃지": a number on 상점, not a toast)
    }
    // (③ 10/21 카드 모음: every ten 도감 cards open a 스페셜 for buying — no window, the 상점 number goes up; an old save starts counted)
    if (G.homeOpen()) { const nOpen = cardOpened(cardCount(G), t => !!FURN_INFO[t]); if (this.H.spOpenN == null) this.H.spOpenN = nOpen; else if (nOpen > this.H.spOpenN) { this.H.shopNew = (this.H.shopNew || 0) + nOpen - this.H.spOpenN; this.H.spOpenN = nOpen; } G.persist(); }
    if (G.homeOpen() && this.H.shopNew && this.shopBtn && !this.shopBtn.querySelector('.badge')) this.shopBtn.append(h('div', { class: 'badge new shopn' }, String(this.H.shopNew)));
  }

  // ── the lobby's HUD: profile, ★ · coins · magnifiers, the side column, the play button and the three room buttons
  lobbyHud() {
    const G = this.G, ui = G.ui, S = G.save, col = this.col, open = G.homeOpen();
    const lv = lvOf(S).lv, hero = 'mong';   // (the room's owner is always 몽글이; save.hero is the friend who walks along — 10/19)
    // 로비 위 바 (③ 10/21, user, the old bar gone: "이거 빠졌네? 흠.. 다시 디자인해서 잘 넣어줄래? 없어보인다 너무 ㅋㅋ"): one
    // profile-and-money bar again — the face filling its tile (ears may go), name and Lv as one block with the way to the next Lv,
    // ★ · coins · magnifiers as chips of one height with their numbers in the middle; a number that changes pops (main.js addCoins)
    const L = lvOf(S), lens = S.lens ? (S.lens.bag ?? 0) : null;
    const chip = (icon, v, cls = '') => h('div', { class: 'thchip ' + cls }, h('span', { class: 'ico', html: ICON[icon] || '' }), h('span', { class: 'v' }, String(v)));
    const cp = chip('coin', S.coins, 'coin'), chips = h('div', { class: 'thchips' }, chip('star', S.stars || 0, 'star'), cp, ...(lens != null ? [chip('hint', lens, 'lens')] : []));
    const pct = Math.round(L.into / L.need * 100);
    const prof = h('div', { class: 'thprof', style: `--xp:${pct}%` }, h('div', { class: 'thav' }, h('img', { src: G.thumbs['face_' + hero] || G.thumbs.face_mong, alt: '' })),
      h('div', { class: 'thid' }, h('div', { class: 'thname' }, h('span', { class: 'nm ol' }, nameOf(hero) || '몽글이'), h('span', { class: 'thlv' }, `Lv.${L.lv}`)),
        h('div', { class: 'thxp' }, h('i', { style: `width:${Math.round(L.into / L.need * 100)}%` }))));
    const top = h('div', { class: 'tophud f' }, prof, chips);
    let taps = [];   // review shortcut, as on the old home: the profile 5 times quickly → every stage open on the map
    prof.addEventListener('pointerup', () => {
      const now = performance.now(); taps = [...taps.filter(t => now - t < 2500), now];
      if (taps.length < 5 || !QA_TOOLS) return;   // (a QA shortcut: not in the store build — src/build.js)
      taps = [];
      const st = S.settings || (S.settings = {}); st.review = !st.review; G.persist();
      ui.toast(st.review ? '리뷰 모드: 지도에서 모든 판이 열려요' : '리뷰 모드 꺼짐', 'green');
      if (st.review) openRoadmap(G);
    });
    col.append(top); G.coinPills = [cp];
    // (③ 10/21 로비 정리: 소리 and 지도 inside 더보기 — the side keeps 도감 · 상점 · 더보기; then user "여기에도 지도 해주고": 지도 on top of the side too)
    const sndB = () => ui.btn(G.audio.muted ? '소리 켜기' : '소리 끄기', { color: 'blue', onClick: () => { G.audio.setMuted(!G.audio.muted); ui.closePanel(); } });
    const mapB = () => ui.btn('지도', { color: 'blue', onClick: () => { ui.closePanel(); setTimeout(() => openRoadmap(G), 200); } });
    const town = ui.btn('동네 구경', { color: 'orange', onClick: () => { ui.closePanel(); G.go('town'); } });
    const side = h('div', { class: 'homeside' },
      ui.btn('지도', { color: 'purple', cls: 'sm', onClick: () => openRoadmap(G) }),
      this.bookBtn = bookBadge(G, ui.btn('도감', { color: 'purple', cls: 'sm', onClick: () => openCardBook(G) })),
      this.shopBtn = ui.btn('상점', { color: 'purple', cls: 'sm', onClick: () => open ? this.shop() : ui.toast('스테이지 2를 깨면 열려!', 'red') }),
      ui.btn('더보기', { color: 'purple', cls: 'sm', onClick: () => openMore(G, [town, mapB(), sndB()]) }));
    col.append(side);
    this.playBtn = playButton(G); this.playBtn.querySelector('.sub')?.remove(); this.playBtn.classList.remove('stack');   // (③ 10/21: no '동네 골목 10/10 · 방탈출' line — the button says the stage)
    // the boxes of chapters you'd already finished before this update (설계서 8장) and a 별 상자 waiting: a number on 꾸미기, opened from it
    const q = (this.H.boxQ || []).filter(i => PICKS[i] && !(i in (this.H.picks || {})));
    const sb = open ? starBoxState(S).pending : 0;
    const giftNow = async () => {
      if (!q.length) { await this.openStarBoxLobby(); return; }
      const i = q[0], c = await giftPanel(G, giftChoices(G.save, 100 + i), { title: '선물 상자!', line: '하나 골라!' });   // (the title fits the ribbon; the shop line said nothing about this box — ③ 10/21)   // (10/20: a gift — gifts.js)
      ui.toast(grantGift(G, c), 'green'); takeGiftPick(G, i, c); this.setMode('lobby');
    };
    const news = unseen(S).length;
    const lock = (label, color, icon, go) => ui.btn(label, { color, icon: open ? icon : 'lock', disabled: !open, onClick: dis => dis ? ui.toast('스테이지 2를 깨면 열려!', 'red') : go() });
    const row = h('div', { class: 'row2 three' },
      (() => { const b = lock('꾸미기', 'orange', 'paint', () => { if (open && (q.length || sb)) return giftNow(); if (call) this.invTab = 'friends'; this.setMode('edit'); }), nx = open && this.growNext?.();   // (👋: straight to the 친구 tab)
          // (방 넓히기: the room can grow now → a 🔨 on 꾸미기; the lobby's close-up doesn't show its sign)
        // (친구 부르기 10/20: a friend you can call now — the coins and a free seat — comes first: 👋)
        const z = this.zone, call = open && ECON && (z?.friends?.length || 0) < seatsOf(z) && callableFriends(S).some(k => (S.coins || 0) >= friendPrice(k));
        // (👋 and 🔨 are not marks of their own any more: they count into 꾸미기's one number, below — user 10/20 "숫자 배지")
        this._callNow = call ? callableFriends(S).filter(k => (S.coins || 0) >= friendPrice(k)) : [];
        this._growNow = !!(nx && (S.coins || 0) >= nx.S.price);
        return b; })(),
      (() => { const b = this.hideBtn = lock('숨기기', 'purple', 'hide', () => S.tut?.hideLater || S.tut?.hideNew ? this.hideLesson() : this.setMode('hide')); if (open && (S.tut?.hideLater || S.tut?.hideNew)) b.append(h('div', { class: 'badge new hiden' }, '1')); return b; })(),
      (() => { const b = lock('놀러 가기', 'pink', 'play', () => unseen(S).length ? HomeScene.prototype.raidNews.call(this) : G.go('visit')); if (open && news) b.append(h('div', { class: 'badge new newsn' }, String(news))); return b; })());
    col.append(h('div', { class: 'homebar' }, this.playBtn, row));
    // 꾸미기's one number (user 10/20: "방꾸미기 숫자 배지", "도감이랑 내 방에 숫자 배지"): furniture you haven't seen there yet,
    // a friend you can call now that you haven't seen there, and the room once it can grow — popping in when it grows;
    // opening 꾸미기 counts them all as seen (🎁 is the 별 상자's own sign, so none here)
    const HH = this.H; if (!HH.seenFurn) HH.seenFurn = [...new Set(HH.inventory)];
    const nNew = open ? HH.inventory.filter(t => !HH.seenFurn.includes(t)).length + this._callNow.filter(k => !(HH.seenCall || []).includes(k)).length + (this._growNow && HH.seenGrow !== (this.zone?.size || 0) ? 1 : 0) + q.length + (sb ? 1 : 0) : 0;
    if (nNew) { const grew = nNew > (HH.giftPopN || 0); row.firstChild.append(h('div', { class: 'badge' + (grew ? ' new' : '') }, String(nNew))); if (grew) { HH.giftPopN = nNew; G.persist(); } }
    /* (③ 10/21 로비 정리: no 문단속 chip — the shield still works, its line shows in the news) */
  }

  // ── friends in the room
  build() {
    super.build();
    if (!this.G.homeOpen()) return;   // (the bare room before 2판: just 몽글이)
    this.ensureShelf(); this.dressShelf(); this.markSeats();
  }
  // 찾은 것 선반: one in the home (made the first time, along the back of the room); an old save starts it with the last few finds
  ensureShelf() {
    const G = this.G, H = this.H, R = this.room;
    // (10/19 evening, user: "방에 그 전시품 그거 ㅈㄴ 개별로야. 없애자") the 찾은 것 선반 is gone: none made, one already standing
    // is taken out of the room (an old save), and it doesn't come back from the box
    if (!SHELF_ON) {
      for (const z of Object.values(H.zones)) { const n = z.furniture.length; z.furniture = z.furniture.filter(f => f.type !== 'findshelf'); if (z.furniture.length !== n) G.persist(); }
      H.inventory = H.inventory.filter(t => t !== 'findshelf');
      for (const rec of R.furns.filter(r => r.type === 'findshelf')) R.removeFurniture(rec);
      return;
    }
    if (Object.values(H.zones).some(z => z.furniture.some(f => f.type === 'findshelf')) || H.inventory.includes('findshelf')) return;
    // along the left-hand wall first, facing into the room: on a phone that is the free side of the screen (the side buttons are
    // on the right, where the back wall would put it under them)
    let c = null;
    for (const x of [-R.w / 2 + .5, -R.w / 2 + 1]) { for (const z of [0, -.5, .5, -1, 1]) if (R.canPlaceAt('findshelf', x, z, Math.PI / 2)) { c = { x, z, a: Math.PI / 2 }; break; } if (c) break; }
    for (const z of [-R.d / 2 + .5, -R.d / 2 + 1]) { if (c) break; for (const x of [0, .5, -.5, 1, -1, 1.5, -1.5]) if (R.canPlaceAt('findshelf', x, z, 0)) { c = { x, z, a: 0 }; break; } }
    for (let z = -R.d / 2 + .5; !c && z <= R.d / 2 - .5; z += .5) for (let x = -R.w / 2 + 1; x <= R.w / 2 - 1; x += .5) if (R.canPlaceAt('findshelf', x, z, 0)) { c = { x, z, a: 0 }; break; }
    if (!H.shelf) H.shelf = (G.save.seen || []).filter(t => ITEMS[t] && !STARTER_ITEMS.includes(t)).slice(-4);   // (a new home: an empty shelf)
    if (!c) { H.inventory.push('findshelf'); G.persist(); return; }
    const id = 'f' + Date.now().toString(36) + 'shelf';
    this.zone.furniture.push({ type: 'findshelf', x: c.x, z: c.z, a: c.a, id });
    R.addFurnitureAt('findshelf', c.x, c.z, c.a, id);
    const idx = indexSpots(R); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    G.persist();
  }
  // the things on the shelf (the latest twelve) and a '?' in each empty cubby — "반쯤 빈 선반" = what's still to find
  dressShelf() {
    const rec = this.room.furns.find(r => r.type === 'findshelf'); if (!rec) return;
    for (const o of rec._disp || []) o.parent?.remove(o);
    rec._disp = [];
    const list = (this.H.shelf || []).filter(t => ITEMS[t]).slice(-12);
    SLOTS.forEach(([x, y], i) => {
      const t = list[i], show = t && !this._shelfHold?.has(t), o = show ? shelfThing(t) : qSprite(.17);
      o.position.set(x, show ? y : y + .13, -.25); rec.f.group.add(o); rec._disp.push(o);
    });
    this.G.world.idsDirty = true; this.G.world.shadowDirty = true;
  }
  slotWorld(rec, t) {
    const list = (this.H.shelf || []).filter(x => ITEMS[x]).slice(-12), i = list.lastIndexOf(t); if (i < 0) return null;
    rec.f.group.updateMatrixWorld(true);
    return rec.f.group.localToWorld(new THREE.Vector3(SLOTS[i][0], SLOTS[i][1] + .1, -.25));
  }
  // the seats still free in this room: a ring and a '?' on the floor ("다음 친구 자리"), in the lobby only
  markSeats() {
    for (const g of this._ghosts || []) g.parent?.remove(g);
    this._ghosts = [];
    const z = this.zone, n = Math.max(0, Math.min(3, seatsOf(z) - (z.friends?.length || 0))), used = [];
    for (let i = 0; i < n; i++) { const p = this.freeSpot(null, used); if (!p) break; used.push(p); const g = seatGhost(); g.position.set(p.x, 0, p.z); g.userData.spot = p; this.room.group.add(g); this._ghosts.push(g); }
    this.showGhosts();
  }
  // (10/19 user: "로비에 저 동그라미랑 물음표는 뭘까?" — the next friend's seat marks read as a puzzle: kept for placing, never shown)
  showGhosts() { for (const g of this._ghosts || []) g.visible = false; }
  // where the next friend sits: the first marked seat, else any clear floor
  seatSpot() { const g = (this._ghosts || []).shift(); if (g) { g.parent?.remove(g); return g.userData.spot; } return this.freeSpot(); }
  seatFriends() {
    const z = this.zone; z.friends = z.friends || [];
    this.seated = [];
    for (const f of z.friends.slice()) {
      if (!CHAR_DEFS[f.k]) { z.friends = z.friends.filter(x => x !== f); continue; }
      // furniture moved onto the seat, or 몽글이 / a friend seated first stands there now (10/19 겹침 QA: 몽글이 takes the
      // first clear spot of its own list, so new furniture moves it onto an old seat)
      const onSomeone = [this.mong.root.position, ...this.seated.map(s => s.rec)].some(q => Math.hypot(q.x - f.x, q.z - f.z) < .6);
      if (!this.room.clearAt(f.x, f.z, .3) || onSomeone) { const p = this.freeSpot(f); if (!p) { this.toBox(f.k); continue; } f.x = p.x; f.z = p.z; }
      this.addSeated(f);
    }
  }
  addSeated(f) {
    const ch = new Char(f.k);
    ch.root.position.set(f.x, 0, f.z); ch.root.rotation.y = f.a ?? Math.atan2(2.2 - f.x, 2.2 - f.z);
    this.room.group.add(ch.root);
    const s = { k: f.k, ch, rec: f }; this.seated.push(s); this.G.world.idsDirty = true;
    return s;
  }
  // a clear bit of floor for a friend: away from 몽글이, the other friends and the furniture; the front of the room first
  freeSpot(near = null, extra = []) {
    this.room._solid = null;   // (room.clearAt keeps the furniture's boxes from the first call: a piece placed or moved since wasn't in them)
    const R = this.room, taken = [this.mong.root.position, ...this.seated.map(s => s.rec), ...(this.inkySeat ? [this.inkySeat.p] : []), ...extra], c = [];   // (a seat, not where its friend is walking from)
    for (let x = -R.w / 2 + .6; x <= R.w / 2 - .6; x += .35) for (let z = -R.d / 2 + .6; z <= R.d / 2 - .6; z += .35) {
      if (!R.clearAt(x, z, .32) || taken.some(p => Math.hypot(p.x - x, p.z - z) < .9)) continue;
      c.push({ x: +x.toFixed(2), z: +z.toFixed(2), d: near ? Math.hypot(x - near.x, z - near.z) : Math.hypot(x - .9, z - 1.1) });
    }
    c.sort((a, b) => a.d - b.d);
    return c[0] || null;
  }
  // 20판 뒤 엔딩 전까지 (스토리 룸 10/20 — 20판 "다음엔 우리 집에서 놀자. 그 애도 같이."): the inky kid's crayon footprints come in from
  // the door and stop short — someone was here and slipped away (③ 10/21, user: "뭔지 모르것어 먹물이면 걍 발자국만 있으면 되지않을까":
  // no cushion any more). They come a little further in as the stages go by (20판 a little over half the way, 60판 on all the way); in the
  // ending 먹물이 walks in and sits where they stop. Not saved: laid fresh each visit. The first time, 몽글이 says a line (script.js INKY_SEAT).
  placeInkySeat(quiet = false) {
    const G = this.G, S = G.save;
    if (this.inkySeat || !this.room?.group || (S.stage || 0) < 20 || S.ending || seatedAll(this.H).has('inky')) return;
    // the way they head: the clear floor furthest from the door (a long trail, so it can creep further in), clear of friends' seats
    const R = this.room, dr0 = this.doorAt(), seats = this.zone?.friends || [];
    let q = null, qd = 0;
    for (let x = -R.w / 2 + .5; x <= R.w / 2 - .5; x += .25) for (let z = -R.d / 2 + .5; z <= R.d / 2 - .5; z += .25) {
      const dd = Math.hypot(x - dr0.x, z - dr0.z); if (dd <= qd || !R.clearAt(x, z, .32) || seats.some(f => Math.hypot(f.x - x, f.z - z) < .6) || Math.hypot(this.mong.root.position.x - x, this.mong.root.position.z - z) < .6) continue;
      q = { x, z }; qd = dd;
    }
    q ||= this.freeSpot(null, seats); if (!q) return;
    const M = inkMeshes(), g = new THREE.Group();
    const dr = dr0, len = Math.hypot(q.x - dr.x, q.z - dr.z), ux = (q.x - dr.x) / (len || 1), uz = (q.z - dr.z) / (len || 1), rot = Math.atan2(ux, uz);
    const far = Math.min(1, .55 + Math.max(0, (S.stage || 0) - 20) / 40 * .45), end = Math.max(Math.min(1.3, len - .3), (len - .3) * far);
    let k = 0, d = .35;
    for (; d <= end && k < 12; d += .3, k++) {
      // (a paw: the pad and three toes ahead of it, so it reads as a footprint, not a dot)
      const sd = k % 2 ? -1 : 1, mat = M.cols[k % 4], m = new THREE.Group();
      const pad = new THREE.Mesh(M.paw, mat); pad.scale.set(1, .85, 1); m.add(pad);
      for (const tx of [-.055, 0, .055]) { const t = new THREE.Mesh(M.toe, mat); t.position.set(tx, .075 - Math.abs(tx) * .4, 0); m.add(t); }
      m.rotation.set(-Math.PI / 2, 0, -rot); m.scale.setScalar(1.1); m.position.set(dr.x + ux * d - uz * .09 * sd, .012, dr.z + uz * d + ux * .09 * sd);
      m.traverse(o => { o.userData.floor = true; }); g.add(m);
    }
    this.room.group.add(noPick(g));
    // where they stop is the inky kid's seat in the ending (the spot they head for if that bit of floor is taken)
    const sx = dr.x + ux * (d + .1), sz = dr.z + uz * (d + .1), p = this.room.clearAt?.(sx, sz, .3) ? { x: sx, z: sz } : q;
    this.inkySeat = { p, g }; G.world.idsDirty = true;
    const L = SCRIPT.INKY_SEAT;
    if (L && !quiet && !this.H.inkySeatSeen && !G.bot) {
      this.H.inkySeatSeen = 1; G.persist?.();
      let n = 0;   // (after any friend's hello — never on top of another bubble)
      // (스토리 룸 10/21: the line comes with the footprints in sight — the view opens out to the whole room first)
      const tell = () => { if (this.dead || this.mode !== 'lobby') return; if (document.querySelector('.bubble.pop') && n++ < 5) return setTimeout(tell, 1200);
        if (this._heroView !== 'room') { this._heroView = 'room'; this.G.world.flyTo(this.tw, { target: this.G.world.home.clone(), zoom: 1, dur: .6 }); }
        setTimeout(() => !this.dead && this.mode === 'lobby' && this.say(this.mong, tr(L.text), 2600), 700); };
      setTimeout(tell, 2400);
    }
  }
  doorAt() { const d = this.room.doorDecor ? this.room.frontOf(this.room.doorDecor.f) : null; return d ? { x: d.x, z: d.z } : { x: -this.room.w / 2 + .6, z: this.room.d / 2 - .6 }; }
  // sit `k` down at p: walking in from the door (a newcomer) or popping up (placed from the box)
  async seatOne(k, p, walk = false) {
    const z = this.zone, rec = { k, x: p.x, z: p.z, a: Math.atan2(2.2 - p.x, 2.2 - p.z) };
    z.friends.push(rec); this.H.friendBox = (this.H.friendBox || []).filter(x => x !== k);
    this.G.persist();   // (QA9: the coins were saved at once and the friend only after the walk-in — an app closed meanwhile lost the friend)
    const s = this.addSeated(rec), ch = s.ch, G = this.G;
    if (walk) {
      const d = this.doorAt(); ch.root.position.set(d.x, 0, d.z);
      await ch.walkTo(this.tw, p.x, p.z); if (this.dead) return s;
      ch.root.rotation.y = rec.a;
      const L = SCRIPT.ROOM_ARRIVE?.[k]; if (L) this.say(ch, tr(L.text), 1500);   // (the same first line as on the way through — 스토리 룸)
    } else {
      ch.root.scale.setScalar(.2); G.audio.sfx('pop', 2);
      await this.tw.run(.3, k2 => ch.root.scale.setScalar(.2 + .8 * k2), ease.outBack);
    }
    ch.bump(.35); G.persist();
    return s;
  }
  toBox(k) {
    const H = this.H; for (const z of Object.values(H.zones)) if (z.friends) z.friends = z.friends.filter(f => f.k !== k);
    H.friendBox = [...new Set([...(H.friendBox || []), k])];
  }
  // whoever you've met since the last time comes in and sits down by themselves (a toast, no card — 설계서 2-4)
  arrivals() {
    const G = this.G, H = this.H, z = this.zone; z.friends = z.friends || [];
    // (경제·로비, 10/20 user: "처음부터 친구 하지 말고 친구도 돈 줘야 소환되게": a friend you meet doesn't come by itself any more —
    // you call them from 꾸미기's 친구 tab; the stage result says who can be called)
    if (ECON) { H.friendKnown = metFriends(G.save); G.persist(); return; }
    const met = metFriends(G.save), seated = seatedAll(H), box = new Set(H.friendBox || []), known = H.friendKnown;
    const fresh = met.filter(k => !seated.has(k) && !box.has(k) && !(known || []).includes(k));
    H.friendKnown = met;
    if (!fresh.length) { G.persist(); return; }
    const quiet = known == null;   // an old save's first lobby: everyone met so far, at once
    const came = []; let full = false;
    for (const k of fresh) {
      const p = z.friends.length < seatsOf(z) ? this.seatSpot() : null;
      if (!p) { H.friendBox = [...(H.friendBox || []), k]; full = true; continue; }
      came.push(k); this.seatOne(k, p, !quiet && came.length <= 2);
    }
    if (came.length) setTimeout(() => !this.dead && this.mode === 'lobby' && this.frameLobby(1), 2600);
    if (came.length) setTimeout(() => !this.dead && G.ui.toast(came.length === 1 ? `${ga(nameOf(came[0]))} 놀러 왔어!` : `친구 ${came.length}명이 놀러 왔어!`, 'green'), 600);
    if (full && !H.fullTold) { H.fullTold = 1; setTimeout(() => !this.dead && G.ui.toast(ECON ? seatFullMsg(G.save, this.zone) : '자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', ''), 2200); }
    G.persist();
  }

  // ── 꾸미기: [가구 | 친구]; a friend is tapped, dragged, turned and boxed like a piece of furniture
  editHud() {
    super.editHud();
    const tabs = h('div', { class: 'invtabs' },
      h('button', { class: 'shoptab' + (this.invTab !== 'friends' ? ' on' : ''), onclick: () => { this.invTab = 'furn'; this.setMode('edit'); } }, '가구'),
      h('button', { class: 'shoptab' + (this.invTab === 'friends' ? ' on' : ''), onclick: () => { this.invTab = 'friends'; this.setMode('edit'); } }, `친구 ${this.zone.friends?.length || 0}/${seatsOf(this.zone)}`, ECON && callableFriends(this.G.save).length ? h('span', { style: 'margin-left:4px' }, '👋') : null));
    this.cardsEl?.before(tabs);
  }
  renderInv() {
    if (this.invTab !== 'friends') return super.renderInv();
    const G = this.G, el = this.cardsEl; if (!el) return;
    el.innerHTML = '';
    const box = this.H.friendBox || [], call = ECON ? callableFriends(G.save) : [];
    if (!box.length && !call.length) el.append(h('div', { style: 'padding:14px;font-size:16px;color:#8a6a9a' }, ECON ? '판에서 친구를 만나면 여기서 집에 부를 수 있어요' : '친구 상자가 비었어요. 방에 앉은 친구를 터치하면 상자에 넣을 수 있어요'));
    for (const k of box) el.append(h('div', { class: 'card', onclick: () => this.placeFriend(k) }, h('img', { src: G.thumbs['face_' + k] }), h('div', {}, nameOf(k))));
    // 친구 부르기 (10/20): the friends you've met and not called yet — their price; a tap calls them in (they walk in at the door)
    for (const k of call) {
      const p = friendPrice(k), short = (G.save.coins || 0) < p;
      el.append(h('div', { class: 'card', style: short ? 'opacity:.6' : '', onclick: () => this.callFriend(k) }, h('img', { src: G.thumbs['face_' + k] }), h('div', {}, nameOf(k)), h('div', { class: 'pr', html: ICON.coin + p })));
    }
    // 친구 칸 사기 (10/20): the next seat, last in the row — its price, or the stage that opens it
    const nx = nextSeat(G.save, this.zone);
    if (nx) el.append(h('div', { class: 'card' + (nx.ok ? '' : ' silc'), style: nx.ok && (G.save.coins || 0) < nx.price ? 'opacity:.6' : '', onclick: () => this.buySeat() },
      h('div', { class: 'swatch', style: 'display:grid;place-items:center;font-size:30px;background:#fff3e0' }, nx.ok ? '🪑' : '🔒'),
      h('div', {}, nx.ok ? `${nx.n}번째 칸` : `${nx.stage}판 깨면`), nx.ok ? h('div', { class: 'pr', html: ICON.coin + nx.price }) : h('div', { style: 'font-size:11px;color:#9b6cff' }, `${nx.n}번째 칸`)));
  }
  // 친구 칸 사기: one more seat, in order, once its stage is cleared
  buySeat() {
    const G = this.G, z = this.zone, nx = nextSeat(G.save, z); if (!nx) return;
    const now = performance.now(); if (now - (this._seatAt || 0) < 450) return; this._seatAt = now;   // (QA9: a quick double tap bought two seats)
    if (!nx.ok) { G.ui.toast(`${nx.stage}판을 깨면 ${nx.n}번째 칸을 살 수 있어`, ''); G.audio.sfx('locked'); return; }
    if ((G.save.coins || 0) < nx.price) { G.ui.toast(`코인 ${nx.price - (G.save.coins || 0)}개 더 모으면 칸을 늘릴 수 있어`, 'red'); G.audio.sfx('miss'); return; }
    G.addCoins(-nx.price); z.seats = nx.n; G.persist(); G.audio.sfx('buy');
    G.ui.toast(`친구 칸이 ${nx.n}개가 됐어! 한 명 더 부를 수 있어`, 'green'); this.setMode('edit');
  }
  // 친구 부르기: coins, once — then the friend is yours (walks in, sits; boxed and seated again for free)
  callFriend(k) {
    const G = this.G, z = this.zone, p = friendPrice(k);
    if (!callableFriends(G.save).includes(k)) return;
    if ((z.friends?.length || 0) >= seatsOf(z)) { G.ui.toast(seatFullMsg(G.save, z), 'red'); return; }
    if ((G.save.coins || 0) < p) { G.ui.toast(`코인 ${p - (G.save.coins || 0)}개 더 모으면 부를 수 있어`, 'red'); G.audio.sfx('miss'); return; }
    const spot = this.seatSpot(); if (!spot) { G.ui.toast('앉을 자리가 없어! 가구를 조금 치워 봐', 'red'); return; }
    G.addCoins(-p); G.audio.sfx('buy');
    this.H.friendKnown = [...new Set([...(this.H.friendKnown || []), k])];
    this.seatOne(k, spot, true).then(() => { if (!this.dead && this.mode === 'edit') this.setMode('edit'); });   // (seatOne's walk says the friend's ROOM_ARRIVE line)
    G.ui.toast(`${ga(nameOf(k))} 놀러 왔어!`, 'green');
  }
  placeFriend(k) {
    const G = this.G, z = this.zone;
    if (!(this.H.friendBox || []).includes(k)) return;   // (already out of the box: a double tap seated it twice — QA3 10/19)
    if ((z.friends?.length || 0) >= seatsOf(z)) { G.ui.toast(ECON ? seatFullMsg(G.save, z) : seatsOf(z) >= seatsOf({ size: 3 }) ? '자리가 꽉 찼어 (최대 7)' : '자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', 'red'); return; }
    const p = this.seatSpot(); if (!p) { G.ui.toast('앉을 자리가 없어! 가구를 조금 치워 봐', 'red'); return; }
    this.seatOne(k, p, false).then(() => { if (!this.dead && this.mode === 'edit') this.setMode('edit'); });
  }
  selectFriend(s) {
    const G = this.G, ui = G.ui;
    this.fsel = s; this.ftool?.remove(); this.ftool = null;
    if (!s) return;
    this.select(null);
    this.ftool = h('div', { class: 'ftool' },
      ui.btn(null, { color: 'blue', icon: 'rotate', onClick: () => { s.rec.a = ((s.rec.a ?? 0) + Math.PI / 4) % (Math.PI * 2); s.ch.root.rotation.y = s.rec.a; G.audio.sfx('swish'); G.persist(); } }),
      s.k === 'mong' ? '' : ui.btn(null, { color: 'red', icon: 'box', onClick: () => { this.room.group.remove(s.ch.root); this.seated = this.seated.filter(x => x !== s); this.toBox(s.k); this.fsel = null; G.audio.sfx('pop', 2); G.persist(); this.setMode('edit'); } }));
    ui.wui.append(this.ftool);
    this.ftool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
    s.ch.bump(.3); G.audio.sfx('click');
  }
  seatedHit(x, y) {
    const hit = this.pick(x, y); if (hit.kind !== 'char') return null;
    // (③ 10/21, user: "내방배치에 몽글이도 배치 변경 가능해야됨"): 몽글이 moves and turns like a seated friend — its spot is zone.mong
    if (hit.char === this.mong && this.zone) { const p = this.mong.root.position; if (this._mongSeat?.ch !== this.mong) this._mongSeat = { k: 'mong', ch: this.mong, rec: this.zone.mong || { x: +p.x.toFixed(2), z: +p.z.toFixed(2), a: this.mong.root.rotation.y } }; this.zone.mong = this._mongSeat.rec; return this._mongSeat; }
    return this.seated.find(s => s.ch === hit.char) || null;
  }
  tap(x, y) {
    if (this.mode === 'passage') return this.passageDone();
    if (this.mode === 'lobby') {
      const hit = this.pick(x, y); if (hit.kind === 'char' && hit.char === this.mong) { if (this.hopOffRug()) return; this.heroView(); this.reactChar(this.mong); return; }
      // 몽글 TV (10/19): the TV you bought plays too — just for fun here, no taps to win (its doors still open as before)
      if (hit.kind === 'furn' && TV_TYPES.has(hit.furn.type) && !this.busyTut && !this.G.bot && !this.G.ui.panelOpen) { this.G.audio.sfx('click'); openMongleTV(this.G, { level: tvLevel(this.G.save.stage || 0) }); return; }
    }
    if (this.mode === 'edit') { const s = this.seatedHit(x, y); if (s) { this.selectFriend(s); return; } this.selectFriend(null); }
    return super.tap(x, y);
  }
  dragStart(x, y) {
    if (this.mode === 'passage') return { move() {}, end: () => this.passageDone(), cancel() {} };
    if (this.mode === 'edit' && this.fsel) {
      const s = this.seatedHit(x, y);
      if (s === this.fsel) {
        const W = this.G.world, R = this.room, g0 = W.screenToGround(x, y, 0), start = { x: s.rec.x, z: s.rec.z };
        let cur = { ...start, ok: true };
        return {
          move: (mx, my) => {
            const g = W.screenToGround(mx, my, 0); if (!g || !g0) return;
            const nx = clamp(start.x + g.x - g0.x, -R.w / 2 + .4, R.w / 2 - .4), nz = clamp(start.z + g.z - g0.z, -R.d / 2 + .4, R.d / 2 - .4);
            cur = { x: nx, z: nz, ok: R.clearAt(nx, nz, .3) }; s.ch.root.position.set(nx, .1, nz);
          },
          end: () => {
            if (!cur.ok) { cur = start; this.G.ui.toast('거긴 못 앉아', 'red'); }
            s.rec.x = +cur.x.toFixed(2); s.rec.z = +cur.z.toFixed(2); s.ch.root.position.set(s.rec.x, 0, s.rec.z); s.ch.bump(.3);
            this.G.audio.sfx('place'); this.G.persist();
          },
          cancel: () => { s.ch.root.position.set(start.x, 0, start.z); },
        };
      }
    }
    return super.dragStart(x, y);
  }
  setMode(mode) {   // (꾸미기·숨기기 '완료' come back to the lobby)
    this.fsel = null; mode = mode === 'view' ? 'lobby' : mode;
    if (mode === 'edit') { const H = this.H; H.seenFurn = [...new Set(H.inventory)]; H.seenCall = [...new Set([...(H.seenCall || []), ...(this._callNow || [])])]; if (this._growNow) H.seenGrow = this.zone?.size || 0; H.giftPopN = 0; this.G.persist(); }   // (the new ones are seen now — ⑰)
    if (mode === 'passage') {   // 판 끝 집으로 가져가기: no buttons, just "톡 하면 계속"
      const G = this.G, W = G.world; this.mode = 'passage'; this.sel = null; G.ui.clear(); if (this.room) this.fitCam();
      W.joyHidden = true; W.dragTurn = W.spinQuiet = false; W.autoSpin = 0;
      const col = this.col = G.ui.col(), hint = h('div', { class: 'ol passhint', style: 'position:absolute;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:rgba(42,26,61,.5);color:#fff;border-radius:999px;padding:8px 18px;font-size:16px;white-space:nowrap;pointer-events:auto' }, '터치하면 계속');
      hint.addEventListener('pointerup', e => { e.stopPropagation(); this.passageDone(); }); col.append(hint);
      this.showGhosts(); return;
    }
    const prev = this.mode, r = super.setMode(mode), W = this.G.world;
    W.joyHidden = mode === 'lobby';   // (the dial in 꾸미기·숨기기 — G.go hides it for a scene named home, QA3 10/19)
    // the lobby turns with one finger side to side (no moving about, no dial) and sways slowly when left alone (10/19, user OK)
    W.dragTurn = W.spinQuiet = mode === 'lobby'; W.autoSpin = 0; this._swayT = 0; this._heroView = null;
    if (mode === 'lobby') { if (this.room && this.G.homeOpen()) this.markSeats(); this.frameLobby(); } else { this.showGhosts(); this.frameRoom(); }
    // back from 꾸미기 with something new in the room: 몽글이 goes over to it, pleased (instead of the camera zooming about)
    if (mode === 'lobby' && prev === 'edit' && this._placed) { const f = this._placed; this._placed = null; this.heroCheer(f); }
    return r;
  }
  exit() { const W = this.G.world; W.dragTurn = W.spinQuiet = false; W.autoSpin = 0; this.G.tv?.close(); this.tvs?.dispose(); this.tvs = null; return super.exit(); }
  // a piece placed in 꾸미기: 몽글이 turns to it and hops (where it stands); the walk over comes on 완료
  placeFromInv(i) {
    const n0 = this.zone.furniture.length; super.placeFromInv(i);
    if (this.zone.furniture.length <= n0 || this.mode !== 'edit' || this.busyTut) return;
    const f = this.zone.furniture[this.zone.furniture.length - 1], m = this.mong; this._placed = { x: f.x, z: f.z };
    m.faceTo(f.x, f.z); m.setFace?.('happy'); m.hopTo(this.tw, m.root.position.x, m.root.position.z, { height: .3, dur: .35 }); this.G.audio.sfx('giggle');
  }
  async heroCheer(f) {
    const m = this.mong, G = this.G; if (!m || this.dead) return;
    const p = this.freeSpot(f);
    if (p && Math.hypot(p.x - f.x, p.z - f.z) < 2.2) { await m.walkTo(this.tw, p.x, p.z); if (this.dead || this.mode !== 'lobby') return; }
    m.faceTo(f.x, f.z); m.pose = 'cheer'; m.setFace?.('wow'); m.bump(.4); G.audio.sfx('special');
    const s = G.world.toScreen(new THREE.Vector3(m.root.position.x, m.headTop() + .2, m.root.position.z));
    G.world.fx.burst(s.x, s.y, { n: 10, shape: 'heart', colors: ['#ff7aa8', '#ffd1e0'], speed: 120, gravity: -60 });
    await this.tw.wait(1.4); if (this.dead) return;
    m.pose = 'idle'; m.setFace?.('happy'); m.faceTo(G.world.cam.position.x, G.world.cam.position.z);   // (then back to you)
    if (this.mode === 'lobby') this.frameLobby(.8);
  }
  // 몽글이 sitting on a rug that's down (③ 10/21, user: "내방 러그 안 들어올려진다" — a tap there was a tap on 몽글이): the
  // first tap hops it off to a clear spot beside the rug and the rug rolls up; the next tap on 몽글이 is the close-up as ever.
  // A rug with furniture on it, or no room beside it: the close-up as before. It isn't saved — next time it sits where it sat.
  hopOffRug() {
    const m = this.mong, R = this.room, W = this.G.world, p = m?.root.position; if (!p || m.hopping || !R?.parts) return false;
    const rug = R.parts.find(q => q.furn?.type === 'rug' && !q.lock && !q.busy && q.t < .5 && (() => { const b = new THREE.Box3().setFromObject(q.furn.group); return p.x > b.min.x && p.x < b.max.x && p.z > b.min.z && p.z < b.max.z; })());
    if (!rug || this.rugBlocked(rug)) return false;
    const b = new THREE.Box3().setFromObject(rug.furn.group), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    const off = (x, z) => Math.max(b.min.x - x, 0, x - b.max.x, b.min.z - z, 0, z - b.max.z) > .3, ox = R.group.position.x, oz = R.group.position.z;
    R._solid = null;
    let best = null;
    for (let a = 0; a < 24; a++) for (const d of [.4, .6, .85]) {
      const u = a * Math.PI / 12, hx = (b.max.x - b.min.x) / 2, hz = (b.max.z - b.min.z) / 2, s = Math.min(hx / Math.max(1e-3, Math.abs(Math.cos(u))), hz / Math.max(1e-3, Math.abs(Math.sin(u))));
      const x = cx + Math.cos(u) * (s + d), z = cz + Math.sin(u) * (s + d);
      if (Math.abs(x - ox) > R.w / 2 - .4 || Math.abs(z - oz) > R.d / 2 - .4 || !off(x, z) || !R.clearAt(x, z, .3) || this.seated?.some(f => Math.hypot(f.ch.root.position.x - x, f.ch.root.position.z - z) < .6)) continue;
      // (on the screen first — in the close-up a spot behind the camera's edge hops 몽글이 half out of the picture)
      const q = W.toScreen(new THREE.Vector3(x, .3, z)), seen = q.x > W.W * .2 && q.x < W.W * .8 && q.y > W.H * .25 && q.y < W.H * .72;
      const dd = Math.hypot(x - p.x, z - p.z) + (seen ? 0 : 9); if (!best || dd < best.d) best = { x, z, d: dd };
    }
    if (!best) return false;
    (async () => {
      m.setFace?.('wow'); this.G.audio.sfx('hop');
      await m.hopTo(this.tw, best.x, best.z, { height: .5, dur: .42 }); if (this.dead) return;
      this.G.audio.sfx('land'); m.setFace?.('happy'); m.faceTo(cx, cz);
      await this.tw.wait(.12); if (this.dead) return;
      await this.openPart(rug, true); if (this.dead) return;
      m.faceTo(W.cam.position.x, W.cam.position.z);
    })();
    return true;
  }
  // tap 몽글이 in the lobby: close up on it; again: the whole room; again: close up
  heroView() {
    const W = this.G.world, m = this.mong;
    const close = this._heroView === 'room' || (this._heroView == null && !this._isClose());
    this._heroView = close ? 'close' : 'room';
    if (close) m.faceTo(W.cam.position.x, W.cam.position.z);   // (its face, not its back, after the room was turned)
    W.flyTo(this.tw, close ? { ...this.closeShot(), dur: .5 } : { target: W.home.clone(), zoom: 1, dur: .55 });
  }
  // the close-up: 몽글이 about a sixth of the screen tall, its middle a little under the screen's middle — measured on the
  // screen (the lobby's fit depends on the room's size), the camera put back as it was before flying there
  closeShot(frac = .16, mid = .45) {
    const W = this.G.world, m = this.mong, p = m.root.position, t0 = W.target.clone(), z0 = W.zoom, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const meas = (y, z) => { W.target.set(p.x, y, p.z); W.zoom = z; W.updateCam(); const f = W.toScreen(V(p.x, 0, p.z)), hd = W.toScreen(V(p.x, m.headTop(), p.z)); return { feet: f.y, size: f.y - hd.y }; };
    const z = clamp(3 * W.H * frac / Math.max(1, meas(1, 3).size), 2.2, Math.max(W.maxZoom || 7, 9));
    const a = meas(1, z), b = meas(2, z), want = W.H * mid + a.size / 2;
    const y = 1 + (want - a.feet) / Math.max(1, b.feet - a.feet);
    W.target.copy(t0); W.zoom = z0; W.updateCam();
    return { target: V(p.x, y, p.z), zoom: z };
  }
  _isClose() { const W = this.G.world, m = this.mong, p = m.root.position, f = W.toScreen(new THREE.Vector3(p.x, 0, p.z)), hd = W.toScreen(new THREE.Vector3(p.x, m.headTop(), p.z)); return f.y - hd.y > W.H * .12; }
  // 같이 다니는 친구 (12판 뒤 한 번): the 🆕 badge, and the friend who sat down last asks to come along
  buddyHint() {
    newCard(this.G, 'buddy');
    const s = this.seated.find(x => x.k === BUDDY_LINE.who); if (s) { s.ch.faceTo(this.mong.root.position.x, this.mong.root.position.z); s.ch.bump(.35); this.say(s.ch, tr(BUDDY_LINE.text), 2800); }
  }
  // the lobby looks at 몽글이 and whoever sits with it, close up while the room is still bare (user, 10/19: "처음에 너무
  // 썰렁하니까 캐릭터 쪽 클로즈업으로 잡아주자"), opening out as furniture and friends fill it; 꾸미기·숨기기 see the whole room
  frameLobby(dur = .7, extra = [], cut = false) {
    if (this.dead || !this.room || this._growing || this._previewing) return;   // (방 넓히기: the room's own camera while its walls go out)
    // (10/19 evening, user with a screenshot: "로비는 이 정도 뷰에서 캐릭터 위주로 처음에 보여지는 게 나을 거 같아 … 캐릭터가 정중앙에
    // 있는 구도") the lobby's own view is 몽글이 big and dead centre; tapping 몽글이 opens out to the room (heroView). Friends
    // arriving, the room pass and the star box (extra points, or the passage mode) still frame the whole group.
    if (!extra.length && this.mode === 'lobby' && this._heroView !== 'room') {
      // (③ 10/21, user on a phone in full screen: "아주 약간 위로 가는정도면 괜찮은데 이렇게 위로 많이 가잇으면 좀 이상한거같아"):
      // 몽글이's middle a hair above the middle of the space between the top bar and the play button, measured each time
      const W = this.G.world, tb = document.querySelector('#hud .tophud')?.getBoundingClientRect().bottom, pb = this.playBtn?.isConnected ? this.playBtn.getBoundingClientRect().top : 0;
      const mid = tb && pb > tb + 100 ? (tb + pb) / 2 / W.H - .012 : .47, shot = this.closeShot(.2, mid); this._heroView = 'close';   // ("로비 캐릭터 너무 크게 잡히는 듯" — .3 → .2 of the screen)
      if (this._framed && dur > 0) W.flyTo(this.tw, { ...shot, dur }); else { W.target.copy(shot.target); W.zoom = shot.zoom; this._framed = true; }
      return;
    }
    const W = this.G.world, pts = [this.mong.root.position, ...this.seated.map(s => s.rec), ...(this.guest ? [this.guest.root.position] : []), ...extra];
    const shelf = this.room.furns.find(r => r.type === 'findshelf');   // (the 찾은 것 선반 in the picture, end to end: what's still to find)
    if (shelf && !cut) { shelf.f.group.updateMatrixWorld(true); for (const sx of [-.95, .95]) { const q = shelf.f.group.localToWorld(new THREE.Vector3(sx, 0, -.25)); pts.push({ x: q.x, z: q.z }); } }
    // (10/19, user OK: 몽글이 never gets small as the room fills — the middle leans 6 : 4 toward 몽글이, and the group is
    // measured on the screen and fills the space between the top bar, the side buttons and the play button; zoom 1.4–2.5,
    // capped a little lower as furniture fills the room so a decorated room still shows)
    const hp = this.mong.root.position, mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, mz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
    const cx = hp.x * .6 + mx * .4, cz = hp.z * .6 + mz * .4;
    const zCap = clamp(2.5 - (this.zone.furniture?.length || 0) * .06, 1.6, 2.5);   // (friends: measured below; furniture: open out a little so a decorated room shows)
    const t0 = W.target.clone(), z0 = W.zoom, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const box = (y, z) => { W.target.set(cx, y, cz); W.zoom = z; W.updateCam(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) { const f = W.toScreen(V(p.x, 0, p.z)), hd = W.toScreen(V(p.x, .62, p.z)); x0 = Math.min(x0, f.x - 24); x1 = Math.max(x1, f.x + 24); y0 = Math.min(y0, hd.y); y1 = Math.max(y1, f.y); }
      return { x0, x1, y0, y1 }; };
    const top = 92, bot = W.H - (this.mode === 'passage' ? 110 : 215), availW = W.W - 48 - 72, b2 = box(1.05, 2);
    const zoom = clamp(2 * Math.min(availW / Math.max(1, b2.x1 - b2.x0), (bot - top) / Math.max(1, b2.y1 - b2.y0)), 1.4, zCap);
    const a = box(1, zoom), b = box(2, zoom), want = (top + bot) / 2, mid = r => (r.y0 + r.y1) / 2;
    const ty = clamp(1 + (want - mid(a)) / Math.max(1, mid(b) - mid(a)), .3, 3);
    // and side to side: the group's middle in the middle of the free width (left margin to the side buttons)
    let tx = cx, tz = cz;
    { const f = box(ty, zoom), r = new THREE.Vector3(1, 0, 0).applyQuaternion(W.cam.quaternion); r.y = 0; r.normalize();
      const p0 = W.toScreen(W.target.clone()), p1 = W.toScreen(W.target.clone().add(r)), ppu = p1.x - p0.x;
      if (Math.abs(ppu) > 1) { const d = (24 + availW / 2 - (f.x0 + f.x1) / 2) / ppu; tx -= r.x * d; tz -= r.z * d; } }
    W.target.copy(t0); W.zoom = z0; W.updateCam();
    const target = V(tx, ty, tz);
    if (this._framed && !cut) W.flyTo(this.tw, { target, zoom, dur }); else { W.target.copy(target); W.zoom = zoom; W.updateCam(); this._framed = true; }
  }
  frameRoom(dur = .6) {
    if (this.dead || !this.room || !this._framed) return;
    this.G.world.flyTo(this.tw, { target: this.G.world.home.clone(), zoom: 1, dur });
  }

  // ── the room opens (2판 behind you, first time here — 설계서 2-3): the gift (a card tap), one thing hidden (as before),
  // then 토순이 asks to stay. Two things to do with your hands; no explaining up front.
  async roomOpens() {
    const G = this.G, tut = G.save.tut || (G.save.tut = {});
    if (ECON) return this.roomOpensCall();   // (10/20: no housewarming pick, 토순이 doesn't stay — she's called later)
    tut.home = true; this.H.giftDue = 1; G.persist();   // (giftDue: a page closed before the pick gets the cards again — 경제 세션 12장)
    if (G.bot || G.skipTalk) { this.giveGift(GIFTS[0]); const p = this.freeSpot(); if (p) await this.seatOne('bunny', p); this.arrivals(); return; }
    this.busyTut = true;
    await this.tw.wait(.5); if (this.dead) return;
    await G.ui.banner('몽글이 방이 열렸어!', '집들이 선물이 왔어', 1500); if (this.dead) return;
    // ① 토순이 comes in with the housewarming gifts: pick one
    const meet = this.freeSpot({ x: this.mong.root.position.x - .9, z: this.mong.root.position.z - .2 }) || { x: 0, z: 0 };
    const bun = new Char('bunny'), d = this.doorAt(); bun.root.position.set(d.x, 0, d.z); this.room.group.add(bun.root); this.guest = bun;
    await bun.walkTo(this.tw, meet.x, meet.z); if (this.dead) return;
    bun.faceTo(this.mong.root.position.x, this.mong.root.position.z); this.mong.faceTo(meet.x, meet.z);
    this.say(bun, '집들이 선물! 하나 골라 봐.', 2400);
    await this.tw.wait(.9); if (this.dead) return;
    const t = await this.giftCards(GIFTS); if (this.dead) return;
    this.giveGift(t);
    // (the gift bounces in mid-room: the view widens to take in it and 몽글이)
    const gf = this.zone.furniture[this.zone.furniture.length - 1], mp = this.mong.root.position;
    if (gf?.x != null) this.G.world.flyTo(this.tw, { target: new THREE.Vector3((gf.x + mp.x) / 2, .55, (gf.z + mp.z) / 2), zoom: 1.5, dur: .6 });
    await this.tw.wait(1.1); if (this.dead) return;
    // ② hide one thing — 토순이 looks for it (the lesson as it was: HOME_TUT)
    await this.hideLesson(); if (this.dead) return;
    // ③ she'd like to stay: she sits down where she is, and the play button is next
    this.setMode('lobby');
    this.say(bun, '나 여기 앉아도 돼?', 2000);
    await this.tw.wait(1.6); if (this.dead) return;
    this.room.group.remove(bun.root); this.guest = null;
    const p = this.freeSpot(bun.root.position) || meet;
    const z = this.zone, rec = { k: 'bunny', x: p.x, z: p.z, a: Math.atan2(2.2 - p.x, 2.2 - p.z) };
    z.friends = z.friends || []; z.friends.push(rec); this.addSeated(rec).ch.bump(.4);
    G.audio.sfx('special'); G.ui.toast('토순이 자리가 생겼어! 이제 자주 놀러 올 거야', 'green'); G.persist(); this.frameLobby();
    this.busyTut = false;
    this.arrivals();
    this.playBtn?.classList.add('pulse');
  }
  // the room's own chest of drawers (the hide lesson's "inside, nobody finds it" and the padlocks need one): there from the
  // start in a new home; an older home that never got one gets it now, quietly
  ensureDrawer() {
    const z = this.zone; if (!z || z.furniture.some(f => f.type === 'drawers') || this.H.inventory.includes('drawers')) return;
    this.H.inventory.push('drawers'); this.placeFromInv(this.H.inventory.length - 1); this.select(null); this.G.persist();
  }
  // 경제·로비 (10/20, user: "바로 선물 주네… 선물도 특이한 거 주라니까", "처음부터 친구 하지 말고 친구도 돈 줘야 소환되게"): the room
  // opens with no gift to pick — its drawer is already there — and 토순이 drops in for the hide lesson, then goes: call her back
  // from 꾸미기's 친구 tab (the first friend you buy)
  async roomOpensCall() {
    // (③ 10/21, user: "3스테이지가 끝나고 나가면 숨기라고 하는거같은데 그것도 안되게 해줘. 걍 모든 연락은 숫자 뱃지" · "숨기기하고 토순이 말
    // 걸지 말라고해줘"): no banner, no 토순이 walking in, no hide mode thrown at you — the room is simply open, and 숨기기 carries
    // a 1 until the first thing is hidden (hideNew)
    const G = this.G, tut = G.save.tut || (G.save.tut = {});
    tut.home = true; tut.hideNew = 1; delete this.H.giftDue; this.ensureDrawer(); G.persist();
    if (this.hideBtn && !this.hideBtn.querySelector('.badge')) this.hideBtn.append(h('div', { class: 'badge new hiden' }, '1'));
  }
  // the hide lesson (HOME_TUT): hide one thing, 토순이 counts and looks for it. In the room's opening, or — when the room opened
  // on the way between stages (검토 P1) — the first time 숨기기 is pressed. Left without hiding anything: it waits for next time.
  async hideLesson() {
    const G = this.G, tut = G.save.tut || (G.save.tut = {});
    if (this.targetCount() >= MAX_HIDE) { delete tut.hideLater; G.persist(); if (this.mode !== 'hide') this.setMode('hide'); return; }
    const n0 = this.targetCount();
    this.setMode('hide');
    const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .16}px` }, tr(HOME_TUT.both));
    G.ui.tut.append(tip); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = 'hidden');   // (not two bands on top of each other — 검토 v108)
    while (!this.dead && this.mode === 'hide' && this.targetCount() === n0) await this.tw.wait(.1);
    tip.remove(); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = ''); if (this.dead) return;
    if (this.targetCount() === n0) { tut.hideLater = 1; G.persist(); return; }   // (left before hiding: the lesson waits for the next 숨기기)
    delete tut.hideLater; delete tut.hideNew; G.persist();   // (no 토순이 counting and looking any more — user 10/21 "토순이 말 걸지 말라고해줘")
  }
  // ── 엔딩 (스토리 룸 10/19, 사용자 "추천대로"): 마지막 야식 뒤, 다 같이 몽글이네 방. 그동안 만난 친구들이 와서 졸고 — 선물 가구가
  // 방에 있으면 그 친구는 자기 자리에 — 토순이만 깨어 있어요. "똑, 똑." 하면 먹물이가 문으로 들어와 남겨 둔 자리에 앉아요.
  // 오늘 밤만 온 친구들이라 자리 기록(z.friends)에는 안 남겨요. 대사는 script.js ENDING 그대로.
  async playEnding({ after = 69 } = {}) {
    const G = this.G, tw = this.tw, temp = [];
    G.ui.clear(); this.visitors?.dispose(); this.visitors = null;   // (오늘 밤은 다 여기 있어서, 따로 놀러 오는 친구는 없음)
    const here = new Set(this.seated.map(s => s.k));
    const sit = (k, x, z, top = null) => {
      const s = this.addSeated({ k, x, z, a: Math.atan2(2.2 - x, 2.2 - z) }); temp.push(s);
      if (top) s.ch.root.position.set(top.x, top.y, top.z);
      return s;
    };
    // 먹물이 자리 먼저 비워 둠 (방 가운데 쪽)
    const spot = this.inkySeat?.p || this.freeSpot(); const inky = spot ? sit('inky', spot.x, spot.z) : null; if (inky) inky.ch.root.visible = false;   // (20판 뒤 비워 둔 방석이 있으면 거기 — 스토리 룸 10/20)
    for (const S of giftSeats(G, this.room)) { if (here.has(S.who)) continue; here.add(S.who); sit(S.who, S.stand[0], S.stand[1], S.top ? { x: S.top.x, y: S.top.y, z: S.top.z } : null); }
    for (const k of metFriends(G.save)) {
      if (here.has(k) || k === 'inky' || temp.length >= 12) continue;
      const p = this.freeSpot(); if (!p) break;
      here.add(k); sit(k, p.x, p.z);
    }
    if (!here.has('bunny')) { const p = this.freeSpot(this.mong.root.position); if (p) sit('bunny', p.x, p.z); }
    for (const s of this.seated) if (s.k !== 'bunny' && s.k !== 'inky') s.ch.setFace('happy');   // 다들 자 (눈 감고 웃는 얼굴)
    this.frameLobby(1);
    await tw.wait(1.1); if (this.dead) return;
    let came = false;
    await playDialog(G, ENDING, { onLine: L => {
      if (L.who !== 'inky' || came || !inky) return;
      came = true;   // "똑, 똑." — 문에서 들어와 남겨 둔 자리로
      const ch = inky.ch, d = this.doorAt(); ch.root.position.set(d.x, 0, d.z); ch.root.visible = true; G.audio.sfx('pop', 2);
      ch.walkTo(tw, spot.x, spot.z).then(() => { if (this.dead) return; ch.root.rotation.y = Math.atan2(this.mong.root.position.x - spot.x, this.mong.root.position.z - spot.z); ch.setFace('happy'); ch.bump(.4); });
    } });
    if (this.dead) return;
    await endCard(G); if (this.dead) return;
    G.save.ending = true; G.persist(); clearFollowupFinish(G, after);   // (GPT QA L02 10/19: staying home after the ending left the last 야식 as 이어하기)
    const stay = await choose(G, [SUI.homeHideEnd, SUI.keepPlaying]) === 0;
    if (this.dead) return;
    // 먹물이 keeps the seat left for it when the room has one free (else it comes in later, like any friend — arrivals)
    const z = this.zone, keep = inky && !seatedAll(this.H).has('inky') && (z.friends ||= []).length < seatsOf(z) ? inky : null;
    if (keep) { keep.ch.root.visible = true; keep.rec.a = keep.ch.root.rotation.y; z.friends.push(keep.rec); if (this.H.friendKnown) this.H.friendKnown = [...new Set([...this.H.friendKnown, 'inky'])]; G.persist(); }
    // then 추로야!!! (사용자 10/21 "추로야! 미니게임 70판 깨면 넣어줘" — ② 레벨): the first time, a bonus night, then where you chose
    if (!G.save.bossDone?.c70 && !G.playMode) return G.go('bossgame', { kind: 'churro', after, lv: 0, epilogue: stay ? 'home' : 'next' });
    if (!stay) return G.go('stage', { idx: after + 1 });
    for (const s of temp) { if (s === keep) continue; this.room.group.remove(s.ch.root); this.seated = this.seated.filter(x => x !== s); }
    this.setMode('lobby');
  }
  giftCards(list) {
    const G = this.G;
    G.needThumbs?.(list.map(t => 'furn_' + t));
    return new Promise(res => {
      let done = false;
      const cards = list.filter(t => FURN_INFO[t]).map(t => {
        const c = h('div', { class: 'lootcard new', role: 'button', tabindex: '0' }, h('img', { src: G.thumbs['furn_' + t] }), h('div', { class: 'lname' }, FURN_INFO[t].name), h('div', { class: 'ltag' }, '선물'));
        const pick = () => { if (done) return; done = true; G.audio.sfx('special'); G.ui.closePanel(); res(t); };
        c.addEventListener('click', pick); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(); });
        return c;
      });
      G.ui.panel({ title: '집들이 선물!', color: 'orange', body: [h('div', { class: 'txt' }, '마음에 드는 걸 하나 골라! 방에 바로 놓아 줄게'), h('div', { class: 'lootgrid' }, ...cards)] });
    });
  }
  giveGift(t) {
    delete this.H.giftDue;
    this.H.inventory.push(t);
    this.placeFromInv(this.H.inventory.length - 1);   // (it bounces in where there is room, nearest the middle)
    this.select(null);
  }

  // ── 판 끝 집으로 가져가기 (검토 세션 10/19 — 사용자 "막 다시 하고 싶진 않다", 진단 "찾은 게 아무 데도 안 남는다"): on the way to
  // the next stage, the room for under 3 s. The friend met there walks in from the door to a marked seat, a piece won there is
  // set down, the first new thing found flies from 몽글이 onto the shelf. One camera cut, no camera moves; a tap goes on at once.
  async runPassage({ item = null, furn = null, items = [], furns = [], friends = [], box = false, next = null, opens = false }) {
    const G = this.G, W = G.world, H = this.H, z = this.zone, tw = this.tw;
    items = [...new Set([...items, ...(item ? [item] : [])])]; furns = [...furns, ...(furn ? [furn] : [])];
    this._next = next; this.busyTut = true; W.onTap = () => this.passageDone();
    // the room's first opening, on the way (검토 P1): 토순이 brings the housewarming gift — set down, no pick (the first pick is
    // the first 별 상자) — and the hide lesson waits for the first 숨기기
    if (opens) { const tut = G.save.tut || (G.save.tut = {}); tut.home = true; tut.hideLater = 1; delete H.giftDue; H.inventory.push(GIFTS[0]); furns = [GIFTS[0], ...furns]; friends = ['bunny', ...friends]; }
    this._boxWant = box && starBoxState(G.save).pending > 0;   // (a box to open: a tap cuts the shows short, never the box)
    // ① the data first, so a page closed now keeps all of it: the pieces into the room, the friends to seats (or the box)
    const frecs = [];
    for (const f of furns) { const i = H.inventory.lastIndexOf(f); if (i < 0) continue; const n0 = this.room.furns.length; this.placeFromInv(i); this.select(null); if (this.room.furns.length > n0) frecs.push(this.room.furns[this.room.furns.length - 1]); }
    // (anyone met who hasn't come in yet — 먹물이 after the ending — walks in now too, rather than being marked as seen)
    const met = metFriends(G.save); if (H.friendKnown) { friends = [...friends, ...met.filter(k => !H.friendKnown.includes(k))]; H.friendKnown = met; }
    const seatedNow = seatedAll(H), boxNow = new Set(H.friendBox || []), comers = [], lookers = [];
    for (const k of [...new Set(friends)]) {
      if (!CHAR_DEFS[k] || seatedNow.has(k) || boxNow.has(k)) continue;
      const seat = (z.friends?.length || 0) < seatsOf(z) ? this.seatSpot() : null;
      if (seat) { const rec = { k, x: seat.x, z: seat.z, a: Math.atan2(2.2 - seat.x, 2.2 - seat.z) }; (z.friends ||= []).push(rec); comers.push({ s: this.addSeated(rec), seat }); }
      else { H.friendBox = [...new Set([...(H.friendBox || []), k])]; lookers.push(k); }
    }
    delete H.shelfNew; H.homeQ = { friends: [], furns: [], items: [] }; G.persist();
    // ② one cut that holds 몽글이 and where things happen
    const shelf = this.room.furns.find(r => r.type === 'findshelf'), slots = shelf ? items.map(t => [t, this.slotWorld(shelf, t)]).filter(([, s]) => s) : [], door = this.doorAt();
    const bx = this._boxAt = this._boxWant ? this.boxSpot() : null;   // (where the star box will come down — in the picture from the start)
    this.frameLobby(0, [...slots.map(([, s]) => s), ...comers.map(c => c.seat), ...(lookers.length && !comers.length ? [door] : []), ...frecs.map(f => ({ x: f.x, z: f.z })), ...(bx ? [bx, { x: bx.x + bx.rv.x * .5, z: bx.z + bx.rv.z * .5 }] : [])], true);   // (the door only when a friend just looks in from it; one walking in may start off the picture — the room stays big)
    // ③ the shows, together (a few at a time when much came home at once)
    const jobs = [], m = this.mong, first = slots[0]?.[1] || comers[0]?.seat || (frecs[0] && { x: frecs[0].x, z: frecs[0].z });
    slots.slice(0, 4).forEach(([t, s], i) => jobs.push(tw.wait(i * .22).then(() => !this.dead && this.flyToShelf(t, shelf, s))));
    if (slots.length > 4 || items.length > slots.length) { for (const [t] of slots.slice(4)) this._shelfHold?.delete(t); this.dressShelf(); }
    comers.slice(0, 3).forEach((c, i) => jobs.push(tw.wait(i * .35).then(() => !this.dead && this.walkIn(c.s, c.seat))));
    for (const c of comers.slice(3)) c.s.ch.bump(.3);
    if (lookers.length) jobs.push(this.peekIn(lookers[0]));
    if (first) m.faceTo(first.x, first.z);
    jobs.push(tw.wait(1.1).then(() => { if (this.dead || this._boxing) return; m.pose = 'cheer'; m.setFace?.('wow'); m.bump(.4); }));
    // at least 2 s to take it in, at most 2.8 s (검토: "판당 3초 이하") — a tap any time goes on
    const t0 = performance.now();
    if (opens) G.ui.banner('몽글이 방이 열렸어!', '집들이 선물이 왔어', 1500);
    await Promise.race([Promise.all(jobs), tw.wait(opens ? 3 : 2.5), new Promise(r => { this._skipShows = r; })]);
    if (this.dead) return;
    if (this._boxWant) { this._boxWant = false; this._boxing = true; m.pose = 'idle'; await this.openStarBoxes(); if (this.dead) return; await tw.wait(.6); }
    else await tw.wait(Math.max(.3, (opens ? 2.8 : 2) - (performance.now() - t0) / 1000));
    this.passageDone();
  }
  // the lobby's 🎁 별 상자: one of three, set down in the room, 몽글이 goes over to it
  async openStarBoxLobby() {   // (10/20: one of three gifts — a padlock, a thing to hide, a piece the shop doesn't sell; gifts.js)
    const G = this.G; if (starBoxState(G.save).pending <= 0) return;
    await openStarGifts(G); if (this.dead) return;
    this.setMode('lobby'); const m = this.mong; if (m) { m.bump(.4); m.setFace?.('wow'); }
  }
  // 별 상자 (경제 A1+A2): a gift box drops in front of 몽글이; a tap opens it — one of three pieces, set straight down in the room
  async openStarBoxes() {
    const G = this.G, W = G.world, H = this.H, tw = this.tw, m = this.mong, R = this.room.group;
    for (let guard = 0; guard < 3 && starBoxState(G.save).pending > 0 && !this.dead; guard++) {
      const n = H.starBoxOpened || 0, three = giftChoices(G.save, n);   // (10/20: gifts, not furniture — gifts.js)
      const b = noPick(buildItem('gift', { code: '★★★' })), s1 = 3.2, at = (guard === 0 && this._boxAt) || this.boxSpot();
      b.scale.setScalar(.01); b.position.set(at.x, 1.4, at.z); R.add(b); W.idsDirty = true; G.audio.sfx('pop', 3);
      await tw.run(.45, k => { b.scale.setScalar(s1 * Math.max(.01, Math.min(1, k * 1.6))); b.position.y = 1.4 * (1 - k) + Math.abs(Math.sin(k * Math.PI)) * .2; }, ease.outBounce); if (this.dead) return;
      m.faceTo(at.x, at.z);
      const hint = this.col?.querySelector('.passhint'); if (hint) hint.textContent = tr('🎁 상자를 터치!');
      const wiggle = setInterval(() => { b.rotation.z = Math.sin(performance.now() / 90) * .08; }, 30);
      await new Promise(res => { this._boxTap = res; W.onTap = () => res(); });
      clearInterval(wiggle); this._boxTap = null; W.onTap = () => this.passageDone();
      if (this.dead) return;
      G.audio.sfx('special'); W.fx.confetti?.(40);
      const t = await giftPanel(G, three, { title: '별 상자!', line: '별 15개를 모았어! 하나 골라' });
      if (this.dead) return;
      R.remove(b);
      H.starBoxOpened = n + 1;
      if (t) { G.ui.toast(grantGift(G, t), 'green'); m.pose = 'cheer'; m.setFace?.('wow'); m.bump(.4); }
      G.persist();
      if (hint) hint.textContent = tr('터치하면 계속');
      await tw.wait(.9);
    }
  }
  // where a star box comes down: beside 몽글이 as you see it — to the screen's right — not in front of it
  boxSpot() {
    const rv = new THREE.Vector3(1, 0, 0).applyQuaternion(this.G.world.cam.quaternion); rv.y = 0; rv.normalize();
    const hp = this.mong.root.position, want = { x: hp.x + rv.x * .95, z: hp.z + rv.z * .95 };
    return { ...(this.freeSpot(want) || want), rv };
  }
  passageDone() {
    if (this._boxTap) { const r = this._boxTap; this._boxTap = null; return r(); }   // (a star box waiting: the tap opens it)
    if (this._boxWant) return this._skipShows?.();   // (the box not down yet: a tap skips to it — '🎁 방에서 열기' keeps its word)
    if (this._pdone || this.dead || this.mode !== 'passage') return;
    this._pdone = true;
    const [n, d] = this._next || ['stage', { idx: this.G.save.stage || 0 }];
    this.G.go(n, { ...(d || {}), quick: true });
  }
  async flyToShelf(item, shelf, to) {
    const G = this.G, W = G.world, tw = this.tw, m = this.mong, R = this.room.group;
    const g = shelfThing(item), s1 = g.scale.x, hp = m.root.position;
    R.updateMatrixWorld(true);
    const fL = R.worldToLocal(new THREE.Vector3(hp.x, m.headTop() + .35, hp.z)), tL = R.worldToLocal(to.clone().setY(to.y - .1));
    g.position.copy(fL); g.scale.setScalar(s1 * .01); R.add(g); W.idsDirty = true; G.audio.sfx('pop', 5);
    await tw.run(.25, k => g.scale.setScalar(s1 * Math.max(.01, k)), ease.outBack); if (this.dead) return;
    await tw.wait(.15); if (this.dead) return;
    await tw.run(.55, k => { g.position.lerpVectors(fL, tL, k); g.position.y += Math.sin(k * Math.PI) * .45; }, ease.inOutQuad); if (this.dead) return;
    R.remove(g); this._shelfHold?.delete(item); this.dressShelf();
    const sp = W.toScreen(to); W.fx.burst(sp.x, sp.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 140, gravity: -30 });
    G.ui.floatText(sp.x, sp.y - 30, 'NEW', 'gold'); G.audio.sfx('special');
  }
  // the friend met in that stage: in from the door, quick hops to its seat, a cheer (and its line, when 스토리 룸 has one)
  async walkIn(s, seat) {
    const ch = s.ch, d = this.doorAt(), tw = this.tw, G = this.G;
    ch.root.position.set(d.x, 0, d.z); ch.faceTo(seat.x, seat.z); G.audio.sfx('pop', 6);
    const n = Math.max(2, Math.round(Math.hypot(seat.x - d.x, seat.z - d.z) / .6));
    for (let i = 1; i <= n; i++) { await ch.hopTo(tw, d.x + (seat.x - d.x) * i / n, d.z + (seat.z - d.z) * i / n, { height: .22, dur: .17 }); if (this.dead) return; }
    ch.root.rotation.y = s.rec.a; ch.bump(.4); ch.pose = 'cheer';
    const L = SCRIPT.ROOM_ARRIVE?.[s.k]; if (L) this.say(ch, tr(L.text), 1500);
    tw.wait(.8).then(() => { if (!this.dead) ch.pose = 'idle'; });
  }
  // no seat left: it looks in at the door, waves, and waits in the friend box (꾸미기 → 친구 to seat it)
  async peekIn(k) {
    const G = this.G, tw = this.tw, ch = new Char(k), d = this.doorAt();
    ch.root.position.set(d.x, 0, d.z); ch.faceTo(this.mong.root.position.x, this.mong.root.position.z); ch.pose = 'wave';
    ch.root.scale.setScalar(.01); this.room.group.add(ch.root); this.guest = ch; G.world.idsDirty = true; G.audio.sfx('pop', 6);
    await tw.run(.25, q => ch.root.scale.setScalar(Math.max(.01, q)), ease.outBack); if (this.dead) return;
    if (!this.H.fullTold) { this.H.fullTold = 1; G.persist(); G.ui.toast(ECON ? seatFullMsg(G.save, this.zone) : '자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', ''); }
    await tw.wait(1.2); if (this.dead) return;
    await tw.run(.2, q => ch.root.scale.setScalar(Math.max(.01, 1 - q))); this.room.group.remove(ch.root); if (this.guest === ch) this.guest = null;
  }
  update(dt) {
    super.update(dt);
    // (③ 10/21, user: "전체화면 누르면 … 몽글이나 지도가 중심이 좀 윗쪽에 있는거같거든"): the screen grew (full screen, the toolbar
    // gone) — the lobby's view is framed again for the new height, so 몽글이 stays in the middle
    { const W = this.G.world; if (this._fH && this._fH !== W.H && this.mode === 'lobby' && !this.replaying && !W.flying) this.frameLobby(.3); this._fH = W.H; }
    // 몽글 TV: the screens in this room light up (again whenever the room is rebuilt or a TV is placed, moved or boxed)
    if (!this.G.bot) {
      const tvf = this.room.furns.filter(r => TV_TYPES.has(r.type)).map(r => r.f);
      if (this._tvRoom !== this.room || tvf.length !== this._tvN || tvf.some(f => !this.tvs?.has(f))) { this.tvs?.dispose(); this._tvRoom = this.room; this._tvN = tvf.length; this.tvs = tvScreens(tvf); }
    }
    this.tvs?.update(dt);
    // left alone for 5 s: a slow sway (about ±8°, a minute a swing); a finger stops it where it is
    if (this.mode === 'lobby') {
      const W = this.G.world, idle = performance.now() - W.lastActive > 5000 && !W.flying && !this.busyTut && !this.G.ui.panelOpen;
      if (idle) { this._swayT = (this._swayT || 0) + dt; W.autoSpin = .014 * Math.cos(this._swayT * .1) * Math.min(1, this._swayT / 4); }
      else if (this._swayT) { this._swayT = 0; W.autoSpin = 0; }
    }
    for (const s of this.seated) s.ch.update(dt);
    this.guest?.update(dt);
    if (this.mode === 'lobby' && !this.busyTut && !this._growing) this.faceYou(dt);
    // (③ 10/21) the footprints only when the room is seen whole — in the lobby's close-up on 몽글이 they came out as big crayon blots
    // under the top bar (user's screenshot, by the 돋보기 chip)
    if (this.inkySeat) { const v = this.mode !== 'lobby' || this._heroView === 'room'; if (this.inkySeat.g.visible !== v) { this.inkySeat.g.visible = v; this.G.world.idsDirty = true; } }
    if (this.ftool && this.fsel) {
      const p = this.G.world.toScreen(new THREE.Vector3(this.fsel.ch.root.position.x, this.fsel.ch.headTop() + .35, this.fsel.ch.root.position.z));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  // (10/20, user: "로비에서 왜 이렇게 등 돌리고 있냐") in the lobby 몽글이 and the friends who sit with it turn, gently, to you —
  // whichever way the room has been turned or is swaying. The friends lean a little toward 몽글이 (three-quarters, not a row of
  // stiff fronts). Someone hopping is left alone, and a turn something else gave (몽글이 looking at a new piece, a friend at
  // 몽글이) is kept for 2.5 s before they look back at you. Only the picture: the seats' saved facing (rec.a) is untouched.
  faceYou(dt) {
    const cp = this.G.world.cam.position, k = 1 - Math.exp(-dt * 4.5), now = performance.now(), mp = this.mong?.root.position;
    const turn = (ch, lean) => {
      if (!ch || ch.hopping) return;
      const r = ch.root, p = r.position;
      if (ch._myYaw != null && Math.abs(r.rotation.y - ch._myYaw) > 1e-3) ch._holdTill = now + 2500;   // (someone else turned it)
      if (now < (ch._holdTill || 0)) { ch._myYaw = r.rotation.y; return; }
      let want = Math.atan2(cp.x - p.x, cp.z - p.z);
      if (lean && mp) { const tm = Math.atan2(mp.x - p.x, mp.z - p.z), d = Math.atan2(Math.sin(tm - want), Math.cos(tm - want)); want += d * .25; }
      const d = Math.atan2(Math.sin(want - r.rotation.y), Math.cos(want - r.rotation.y));
      r.rotation.y += d * k; ch._myYaw = r.rotation.y;
    };
    turn(this.mong, false);
    for (const s of this.seated) turn(s.ch, true);
  }
  botStep(dt) {
    if (this.mode === 'passage') return this.passageDone();
    if (this.mode !== 'lobby') return super.botStep(dt);
    this._bt = (this._bt || 0) + dt; if (this._bt > 1.2) { this._bt = 0; this.playBtn?.press(); }
  }
  state() { if (this.mode === 'passage') return { scene: 'home', passage: true }; return this.mode === 'lobby' ? { scene: 'home', lobby: true, stage: (this.G.save.stage || 0) + 1, coins: this.G.save.coins, friends: this.seated.map(s => s.k) } : super.state(); }
}
