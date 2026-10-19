// 로비 = 내 방 (경제·메타 설계서 2장, 10/19 — user: "로비는 내 방으로 변경하는게 좋겠어. … 내방 꾸미는 재미를 알려주고싶어서.
// 처음엔 빈 공간에 캐릭터 혼자있고 친구들 몇 있고 (새로만나는 캐릭터) … 내가 좋아하는 캐릭터 배치할수있게 … 방 열리면서 튜토").
// With G.econ on, the first screen is 몽글이's room. The play button, map, card book, shop and 더보기 (with 동네 구경, the old
// neighbourhood home) move here; 꾸미기 · 숨기기 · 놀러 가기 sit under the play button. Friends you've met come in and sit down
// (3 seats, +1 for each of the first three room sizes); in 꾸미기 they move, turn and go to the friend box like furniture.
import * as THREE from 'three';
import { MyHomeScene } from './myhome.js';
import { HomeScene, playButton, openMore } from './home.js';
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { openRoadmap } from '../roadmap.js';
import { openCardBook } from '../cardbook.js';
import { runRaids } from '../raid.js';
import { shieldChip } from '../raidreplay.js';   // 문단속 (털기 메타 10/19)
import { playDialog } from '../story.js';
import { clearFollowupFinish } from '../followup.js';
import { HOME_TUT, ENDING, endCard, choose, giftSeats, newCard, BUDDY_LINE, UI as SUI } from '../script.js';
import * as SCRIPT from '../script.js';   // (ROOM_ARRIVE: a friend's first line in your room — 스토리 룸, read if it is there)
import { indexSpots } from '../room.js';
import { starBoxState, starBoxThree } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)
import { buildItem, ITEMS } from '../gfx/items.js';
import { h, ICON } from '../ui.js';
import { ease, clamp } from '../util.js';
import { tr } from '../i18n.js';
import { metFriends, seatsOf, seatedAll, PICKS, pickPanel, takePick, chapterOfFurn, chapterNow } from '../econ.js';
import { SHOP_FURN, STARTER_ITEMS } from '../catalog.js';
import { regionOf } from '../stages.js';
import { QA_TOOLS } from '../build.js';
import { TV_TYPES, tvScreens, openMongleTV, tvLevel } from '../mongletv.js';   // 몽글 TV (10/19)
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

export class LobbyScene extends MyHomeScene {
  constructor(G) { super(G); this.name = 'home'; this.lobby = true; this.seated = []; }
  async enter(o = {}) {
    const G = this.G;
    if (!o.ending) runRaids(G);   // residents who sneaked in while you were away (coins land before the pills show them)
    // 판 끝 집으로 가져가기 (10/19): on the way to the next stage, the room for under 3 s (the room's first opening plays instead)
    const pass = o.passage && G.homeOpen() && G.save.tut?.home ? o.passage : null;
    this._shelfHold = new Set([...(pass?.items || []), ...(pass?.item ? [pass.item] : [])]);   // (the things fly onto the shelf, so the shelf starts without them)
    await super.enter({ ...o, mode: pass ? 'passage' : !o.mode || o.mode === 'view' ? 'lobby' : o.mode });
    if (this.dead) return;
    if (o.ending) return this.playEnding(o.ending);   // 엔딩 (스토리 룸 10/19)
    if (pass) return this.runPassage(pass);
    delete this.H.shelfNew;
    // things gathered for the room that never passed through it (the 홈 button instead of '다음'): set down now, quietly
    const Q = this.H.homeQ; if (Q?.furns?.length && G.homeOpen()) { for (const f of Q.furns) { const i = this.H.inventory.lastIndexOf(f); if (i >= 0) { this.placeFromInv(i); this.select(null); } } }
    this.H.homeQ = { friends: [], furns: [], items: [] };
    this.tw.wait(.8).then(() => !this.dead && HomeScene.prototype.raidNews.call(this));
    const tut = G.save.tut || (G.save.tut = {});
    if (G.homeOpen() && !tut.home) await this.roomOpens();
    else if (G.homeOpen() && this.H.giftDue) { const t = await this.giftCards(GIFTS); if (this.dead) return; this.giveGift(t); this.frameLobby(); this.arrivals(); }   // (left before picking)
    else if (G.homeOpen()) this.arrivals();
    // 같이 다니는 친구 (10/19, user OK): after 12판, once — a 🆕 badge and a friend in the room asks to come along
    if (G.homeOpen() && (G.save.stage || 0) >= 12 && !G.save.cards?.buddy && !G.bot) setTimeout(() => !this.dead && this.mode === 'lobby' && !this.busyTut && this.buddyHint(), 5200);
    // a new chapter's furniture is in the shop now (설계서 N3): one toast, once per chapter
    const ch = chapterNow(G.save);
    if (G.homeOpen() && ch > (this.H.shopCh || 1)) {
      const n = SHOP_FURN.filter(it => chapterOfFurn(it.type) === ch).length; this.H.shopCh = ch; G.persist();
      if (n) setTimeout(() => !this.dead && G.ui.toast(`상점에 '${REGION_NAME(REGIONS_AT(ch))}' 가구 ${n}개가 들어왔어!`, 'green'), 3200);
    }
  }

  // ── the lobby's HUD: profile, ★ · coins · magnifiers, the side column, the play button and the three room buttons
  lobbyHud() {
    const G = this.G, ui = G.ui, S = G.save, col = this.col, open = G.homeOpen();
    const lv = 1 + Math.floor((S.stars || 0) / 6), hero = 'mong';   // (the room's owner is always 몽글이; save.hero is the friend who walks along — 10/19)
    const prof = h('div', { class: 'profile' }, h('div', { class: 'av' }, h('img', { src: G.thumbs['face_' + hero] || G.thumbs.face_mong })), h('div', {}, h('div', { class: 'nm ol' }, nameOf(hero) || '몽글이'), h('div', { class: 'lv' }, `Lv.${lv}`, h('span', { class: 'lvt' }, ' 숨바꼭질 탐정'))));
    let taps = [];   // review shortcut, as on the old home: the profile 5 times quickly → every stage open on the map
    prof.addEventListener('pointerup', () => {
      const now = performance.now(); taps = [...taps.filter(t => now - t < 2500), now];
      if (taps.length < 5 || !QA_TOOLS) return;   // (a QA shortcut: not in the store build — src/build.js)
      taps = [];
      const st = S.settings || (S.settings = {}); st.review = !st.review; G.persist();
      ui.toast(st.review ? '리뷰 모드: 지도에서 모든 판이 열려요' : '리뷰 모드 꺼짐', 'green');
      if (st.review) openRoadmap(G);
    });
    col.append(prof);
    const pills = h('div', { class: 'pills lobbypills' }); const sp = ui.pill('star', S.stars || 0), cp = ui.pill('coin', S.coins);
    pills.append(sp, cp);
    if (S.lens) {   // the magnifier bag (설계서 5장): how many are waiting for the stages
      const lp = ui.pill('hint', `${S.lens.bag ?? 0}`, 'lens');
      lp.style.pointerEvents = 'auto';
      lp.addEventListener('click', () => ui.toast(`돋보기 가방 ${S.lens.bag ?? 0}/5 · 판을 돋보기 없이 깨거나 놀이를 이기면 +1`, ''));
      pills.append(lp);
    }
    col.append(pills); G.coinPills = [cp];
    const snd = ui.ibtn(G.audio.muted ? 'mute' : 'sound', 'purple', () => { G.audio.setMuted(!G.audio.muted); snd.innerHTML = ''; snd.insertAdjacentHTML('beforeend', ICON[G.audio.muted ? 'mute' : 'sound']); });
    snd.style.cssText += 'width:44px;height:44px';
    const town = ui.btn('동네 구경', { color: 'orange', onClick: () => { ui.closePanel(); G.go('town'); } });
    const side = h('div', { class: 'homeside' }, snd,
      ui.btn('지도', { color: 'purple', cls: 'sm', onClick: () => openRoadmap(G) }),
      ui.btn('도감', { color: 'purple', cls: 'sm', onClick: () => openCardBook(G) }),
      ui.btn('상점', { color: 'purple', cls: 'sm', onClick: () => open ? this.shop() : ui.toast('스테이지 2를 깨면 열려!', 'red') }),
      ui.btn('더보기', { color: 'purple', cls: 'sm', onClick: () => openMore(G, [town]) }));
    col.append(side);
    this.playBtn = playButton(G);
    const lock = (label, color, icon, go) => ui.btn(label, { color, icon: open ? icon : 'lock', disabled: !open, onClick: dis => dis ? ui.toast('스테이지 2를 깨면 열려!', 'red') : go() });
    const row = h('div', { class: 'row2 three' },
      lock('꾸미기', 'orange', 'paint', () => this.setMode('edit')),
      lock('숨기기', 'purple', 'hide', () => this.setMode('hide')),
      lock('놀러 가기', 'pink', 'play', () => G.go('visit')));
    col.append(h('div', { class: 'homebar' }, this.playBtn, row));
    // the boxes of chapters you'd already finished before this update (설계서 8장): one 🎁 each, opened here
    const q = (this.H.boxQ || []).filter(i => PICKS[i] && !(i in (this.H.picks || {})));
    const sb = open ? starBoxState(S).pending : 0;   // 별 상자 waiting (the room wasn't passed since it came)
    if ((q.length || sb) && open) {
      const gift = ui.btn(q.length ? `🎁 지난 장 선물 ${q.length}` : `🎁 별 상자${sb > 1 ? ' ' + sb : ''}`, { color: 'yellow', cls: 'sm pulse', onClick: async () => {
        if (!q.length) { gift.remove(); await this.openStarBoxLobby(); return; }
        const i = q[0], t = await pickPanel(G, PICKS[i], { title: `${REGION_NAME(i)} 선물 상자!`, line: '하나 골라! 나머지 둘은 상점 기념품 칸에서 살 수 있어' });
        takePick(G, i, t); ui.toast(`${FURN_INFO[t].name} · 꾸미기 보관함에 들어갔어`, 'green'); this.setMode('lobby');
      } });
      gift.style.cssText += 'position:absolute;left:12px;top:calc(76px + var(--safeT));pointer-events:auto';
      col.append(gift);
    }
    // 문단속 (털기 메타 10/19): robbed, the door stays locked a while — a chip under the profile counts it down
    const sh = shieldChip(G, q.length && open ? 124 : 76); if (sh) col.append(sh);
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
  showGhosts() { for (const g of this._ghosts || []) g.visible = this.mode === 'lobby' || this.mode === 'passage'; }
  // where the next friend sits: the first marked seat, else any clear floor
  seatSpot() { const g = (this._ghosts || []).shift(); if (g) { g.parent?.remove(g); return g.userData.spot; } return this.freeSpot(); }
  seatFriends() {
    const z = this.zone; z.friends = z.friends || [];
    this.seated = [];
    for (const f of z.friends.slice()) {
      if (!CHAR_DEFS[f.k]) { z.friends = z.friends.filter(x => x !== f); continue; }
      if (!this.room.clearAt(f.x, f.z, .3)) { const p = this.freeSpot(f); if (!p) { this.toBox(f.k); continue; } f.x = p.x; f.z = p.z; }   // furniture moved onto the seat
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
    const R = this.room, taken = [this.mong.root.position, ...this.seated.map(s => s.rec), ...extra], c = [];   // (a seat, not where its friend is walking from)
    for (let x = -R.w / 2 + .6; x <= R.w / 2 - .6; x += .35) for (let z = -R.d / 2 + .6; z <= R.d / 2 - .6; z += .35) {
      if (!R.clearAt(x, z, .32) || taken.some(p => Math.hypot(p.x - x, p.z - z) < .9)) continue;
      c.push({ x: +x.toFixed(2), z: +z.toFixed(2), d: near ? Math.hypot(x - near.x, z - near.z) : Math.hypot(x - .9, z - 1.1) });
    }
    c.sort((a, b) => a.d - b.d);
    return c[0] || null;
  }
  doorAt() { const d = this.room.doorDecor ? this.room.frontOf(this.room.doorDecor.f) : null; return d ? { x: d.x, z: d.z } : { x: -this.room.w / 2 + .6, z: this.room.d / 2 - .6 }; }
  // sit `k` down at p: walking in from the door (a newcomer) or popping up (placed from the box)
  async seatOne(k, p, walk = false) {
    const z = this.zone, rec = { k, x: p.x, z: p.z, a: Math.atan2(2.2 - p.x, 2.2 - p.z) };
    z.friends.push(rec); this.H.friendBox = (this.H.friendBox || []).filter(x => x !== k);
    const s = this.addSeated(rec), ch = s.ch, G = this.G;
    if (walk) {
      const d = this.doorAt(); ch.root.position.set(d.x, 0, d.z);
      await ch.walkTo(this.tw, p.x, p.z); if (this.dead) return s;
      ch.root.rotation.y = rec.a;
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
    if (full && !H.fullTold) { H.fullTold = 1; setTimeout(() => !this.dead && G.ui.toast('자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', ''), 2200); }
    G.persist();
  }

  // ── 꾸미기: [가구 | 친구]; a friend is tapped, dragged, turned and boxed like a piece of furniture
  editHud() {
    super.editHud();
    const tabs = h('div', { class: 'invtabs' },
      h('button', { class: 'shoptab' + (this.invTab !== 'friends' ? ' on' : ''), onclick: () => { this.invTab = 'furn'; this.setMode('edit'); } }, '가구'),
      h('button', { class: 'shoptab' + (this.invTab === 'friends' ? ' on' : ''), onclick: () => { this.invTab = 'friends'; this.setMode('edit'); } }, `친구 ${this.zone.friends?.length || 0}/${seatsOf(this.zone)}`));
    this.cardsEl?.before(tabs);
  }
  renderInv() {
    if (this.invTab !== 'friends') return super.renderInv();
    const G = this.G, el = this.cardsEl; if (!el) return;
    el.innerHTML = '';
    const box = this.H.friendBox || [];
    if (!box.length) el.append(h('div', { style: 'padding:14px;font-size:16px;color:#8a6a9a' }, '친구 상자가 비었어요. 방에 앉은 친구를 톡 하면 상자에 넣을 수 있어요'));
    for (const k of box) el.append(h('div', { class: 'card', onclick: () => this.placeFriend(k) }, h('img', { src: G.thumbs['face_' + k] }), h('div', {}, nameOf(k))));
  }
  placeFriend(k) {
    const G = this.G, z = this.zone;
    if (!(this.H.friendBox || []).includes(k)) return;   // (already out of the box: a double tap seated it twice — QA3 10/19)
    if ((z.friends?.length || 0) >= seatsOf(z)) { G.ui.toast(seatsOf(z) >= 6 ? '자리가 꽉 찼어 (최대 6)' : '자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', 'red'); return; }
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
      ui.btn(null, { color: 'red', icon: 'box', onClick: () => { this.room.group.remove(s.ch.root); this.seated = this.seated.filter(x => x !== s); this.toBox(s.k); this.fsel = null; G.audio.sfx('pop', 2); G.persist(); this.setMode('edit'); } }));
    ui.wui.append(this.ftool);
    this.ftool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
    s.ch.bump(.3); G.audio.sfx('click');
  }
  seatedHit(x, y) { const hit = this.pick(x, y); return hit.kind === 'char' ? this.seated.find(s => s.ch === hit.char) || null : null; }
  tap(x, y) {
    if (this.mode === 'passage') return this.passageDone();
    if (this.mode === 'lobby') {
      const hit = this.pick(x, y); if (hit.kind === 'char' && hit.char === this.mong) { this.heroView(); this.reactChar(this.mong); return; }
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
    if (mode === 'passage') {   // 판 끝 집으로 가져가기: no buttons, just "톡 하면 계속"
      const G = this.G, W = G.world; this.mode = 'passage'; this.sel = null; G.ui.clear(); if (this.room) this.fitCam();
      W.joyHidden = true; W.dragTurn = W.spinQuiet = false; W.autoSpin = 0;
      const col = this.col = G.ui.col(), hint = h('div', { class: 'ol passhint', style: 'position:absolute;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:rgba(42,26,61,.5);color:#fff;border-radius:999px;padding:8px 18px;font-size:16px;white-space:nowrap;pointer-events:auto' }, '톡 하면 계속');
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
  closeShot() {
    const W = this.G.world, m = this.mong, p = m.root.position, t0 = W.target.clone(), z0 = W.zoom, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const meas = (y, z) => { W.target.set(p.x, y, p.z); W.zoom = z; W.updateCam(); const f = W.toScreen(V(p.x, 0, p.z)), hd = W.toScreen(V(p.x, m.headTop(), p.z)); return { feet: f.y, size: f.y - hd.y }; };
    const z = clamp(3 * W.H * .16 / Math.max(1, meas(1, 3).size), 2.2, W.maxZoom || 7);
    const a = meas(1, z), b = meas(2, z), want = W.H * .45 + a.size / 2;
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
    if (this.dead || !this.room) return;
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
    if (this.targetCount() < MAX_HIDE) {
      const n0 = this.targetCount();
      this.setMode('hide');
      const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .16}px` }, tr(HOME_TUT.both));
      G.ui.tut.append(tip); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = 'hidden');   // (not two bands on top of each other — 검토 v108)
      while (!this.dead && this.targetCount() === n0) await this.tw.wait(.1);
      tip.remove(); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = ''); if (this.dead) return;
      await this.tw.wait(.6); if (this.dead) return;
      const rec = this.H.hide.items[this.H.hide.items.length - 1], inside = !!(rec?.free?.part || (rec?.spot && this.spotByKey?.[rec.spot]?.part));
      await playDialog(G, HOME_TUT.count); if (this.dead) return;
      await this.tw.wait(.7); if (this.dead) return;
      await playDialog(G, inside ? HOME_TUT.missed : HOME_TUT.found); if (this.dead) return;
    }
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
    const spot = this.freeSpot(); const inky = spot ? sit('inky', spot.x, spot.z) : null; if (inky) inky.ch.root.visible = false;
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
    if (!stay) return G.go('stage', { idx: after + 1 });
    for (const s of temp) { this.room.group.remove(s.ch.root); this.seated = this.seated.filter(x => x !== s); }
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
  async runPassage({ item = null, furn = null, items = [], furns = [], friends = [], box = false, next = null }) {
    const G = this.G, W = G.world, H = this.H, z = this.zone, tw = this.tw;
    items = [...new Set([...items, ...(item ? [item] : [])])]; furns = [...furns, ...(furn ? [furn] : [])];
    this._next = next; this.busyTut = true; W.onTap = () => this.passageDone();
    this._boxWant = box && starBoxState(G.save).pending > 0;   // (a box to open: a tap cuts the shows short, never the box)
    // ① the data first, so a page closed now keeps all of it: the pieces into the room, the friends to seats (or the box)
    const frecs = [];
    for (const f of furns) { const i = H.inventory.lastIndexOf(f); if (i < 0) continue; const n0 = this.room.furns.length; this.placeFromInv(i); this.select(null); if (this.room.furns.length > n0) frecs.push(this.room.furns[this.room.furns.length - 1]); }
    H.friendKnown = metFriends(G.save);
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
    await Promise.race([Promise.all(jobs), tw.wait(2.5), new Promise(r => { this._skipShows = r; })]);
    if (this.dead) return;
    if (this._boxWant) { this._boxWant = false; this._boxing = true; m.pose = 'idle'; await this.openStarBoxes(); if (this.dead) return; await tw.wait(.6); }
    else await tw.wait(Math.max(.3, 2 - (performance.now() - t0) / 1000));
    this.passageDone();
  }
  // the lobby's 🎁 별 상자: one of three, set down in the room, 몽글이 goes over to it
  async openStarBoxLobby() {
    const G = this.G, H = this.H; if (starBoxState(G.save).pending <= 0) return;
    const n = H.starBoxOpened || 0, three = starBoxThree(G.save, n);
    const t = three.length ? await pickPanel(G, three, { title: '별 상자!', line: '별 15개를 모았어! 마음에 드는 걸 하나 골라', tag: '별 상자' }) : null;
    if (this.dead) return;
    H.starBoxOpened = n + 1;
    if (t) { H.inventory.push(t); this.placeFromInv(H.inventory.length - 1); this.select(null); }
    G.persist(); this.setMode('lobby');
    const f = t && this.zone.furniture[this.zone.furniture.length - 1]; if (f) this.heroCheer({ x: f.x, z: f.z });
  }
  // 별 상자 (경제 A1+A2): a gift box drops in front of 몽글이; a tap opens it — one of three pieces, set straight down in the room
  async openStarBoxes() {
    const G = this.G, W = G.world, H = this.H, tw = this.tw, m = this.mong, R = this.room.group;
    for (let guard = 0; guard < 3 && starBoxState(G.save).pending > 0 && !this.dead; guard++) {
      const n = H.starBoxOpened || 0, three = starBoxThree(G.save, n);
      const b = noPick(buildItem('gift', { code: '★★★' })), s1 = 3.2, at = (guard === 0 && this._boxAt) || this.boxSpot();
      b.scale.setScalar(.01); b.position.set(at.x, 1.4, at.z); R.add(b); W.idsDirty = true; G.audio.sfx('pop', 3);
      await tw.run(.45, k => { b.scale.setScalar(s1 * Math.max(.01, Math.min(1, k * 1.6))); b.position.y = 1.4 * (1 - k) + Math.abs(Math.sin(k * Math.PI)) * .2; }, ease.outBounce); if (this.dead) return;
      m.faceTo(at.x, at.z);
      const hint = this.col?.querySelector('.passhint'); if (hint) hint.textContent = tr('🎁 상자를 톡!');
      const wiggle = setInterval(() => { b.rotation.z = Math.sin(performance.now() / 90) * .08; }, 30);
      await new Promise(res => { this._boxTap = res; W.onTap = () => res(); });
      clearInterval(wiggle); this._boxTap = null; W.onTap = () => this.passageDone();
      if (this.dead) return;
      G.audio.sfx('special'); W.fx.confetti?.(40);
      const t = three.length ? await pickPanel(G, three, { title: '별 상자!', line: '별 15개를 모았어! 마음에 드는 걸 하나 골라', tag: '별 상자' }) : null;
      if (this.dead) return;
      R.remove(b);
      H.starBoxOpened = n + 1;
      if (t) { H.inventory.push(t); this.placeFromInv(H.inventory.length - 1); this.select(null); const f = this.zone.furniture[this.zone.furniture.length - 1]; if (f) { m.faceTo(f.x, f.z); m.pose = 'cheer'; m.setFace?.('wow'); m.bump(.4); } }
      G.persist();
      if (hint) hint.textContent = tr('톡 하면 계속');
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
    if (!this.H.fullTold) { this.H.fullTold = 1; G.persist(); G.ui.toast('자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', ''); }
    await tw.wait(1.2); if (this.dead) return;
    await tw.run(.2, q => ch.root.scale.setScalar(Math.max(.01, 1 - q))); this.room.group.remove(ch.root); if (this.guest === ch) this.guest = null;
  }
  update(dt) {
    super.update(dt);
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
    if (this.ftool && this.fsel) {
      const p = this.G.world.toScreen(new THREE.Vector3(this.fsel.ch.root.position.x, this.fsel.ch.headTop() + .35, this.fsel.ch.root.position.z));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  botStep(dt) {
    if (this.mode === 'passage') return this.passageDone();
    if (this.mode !== 'lobby') return super.botStep(dt);
    this._bt = (this._bt || 0) + dt; if (this._bt > 1.2) { this._bt = 0; this.playBtn?.press(); }
  }
  state() { if (this.mode === 'passage') return { scene: 'home', passage: true }; return this.mode === 'lobby' ? { scene: 'home', lobby: true, stage: (this.G.save.stage || 0) + 1, coins: this.G.save.coins, friends: this.seated.map(s => s.k) } : super.state(); }
}
