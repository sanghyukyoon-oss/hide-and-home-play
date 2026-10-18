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
import { playDialog } from '../story.js';
import { HOME_TUT } from '../script.js';
import { h, ICON } from '../ui.js';
import { ease, clamp } from '../util.js';
import { tr } from '../i18n.js';
import { metFriends, seatsOf, seatedAll, PICKS, pickPanel, takePick, chapterOfFurn, chapterNow } from '../econ.js';
import { SHOP_FURN } from '../catalog.js';
import { regionOf } from '../stages.js';
const REGION_NAME = i => regionOf(i)?.name || '';
const REGIONS_AT = ch => [0, 12, 21, 31, 40, 49, 60][ch - 1] ?? 0;   // (the first stage of chapter ch)

const GIFTS = ['drawers', 'chest', 'wardrobe'];   // 집들이 선물: each has a drawer, a lid or a door — "inside, nobody finds it" follows
const MAX_HIDE = 5;
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const nameOf = k => CHAR_DEFS[k]?.name || '';

export class LobbyScene extends MyHomeScene {
  constructor(G) { super(G); this.name = 'home'; this.lobby = true; this.seated = []; }
  async enter(o = {}) {
    const G = this.G;
    runRaids(G);   // residents who sneaked in while you were away (coins land before the pills show them)
    await super.enter({ ...o, mode: !o.mode || o.mode === 'view' ? 'lobby' : o.mode });
    if (this.dead) return;
    this.tw.wait(.8).then(() => !this.dead && HomeScene.prototype.raidNews.call(this));
    const tut = G.save.tut || (G.save.tut = {});
    if (G.homeOpen() && !tut.home) await this.roomOpens();
    else if (G.homeOpen() && this.H.giftDue) { const t = await this.giftCards(GIFTS); if (this.dead) return; this.giveGift(t); this.frameLobby(); this.arrivals(); }   // (left before picking)
    else if (G.homeOpen()) this.arrivals();
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
    const lv = 1 + Math.floor((S.stars || 0) / 6), hero = S.hero || 'mong';
    const prof = h('div', { class: 'profile' }, h('div', { class: 'av' }, h('img', { src: G.thumbs['face_' + hero] || G.thumbs.face_mong })), h('div', {}, h('div', { class: 'nm ol' }, nameOf(hero) || '몽글이'), h('div', { class: 'lv' }, `Lv.${lv}`, h('span', { class: 'lvt' }, ' 숨바꼭질 탐정'))));
    let taps = [];   // review shortcut, as on the old home: the profile 5 times quickly → every stage open on the map
    prof.addEventListener('pointerup', () => {
      const now = performance.now(); taps = [...taps.filter(t => now - t < 2500), now];
      if (taps.length < 5) return;
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
      ui.btn('도감', { color: 'pink', cls: 'sm', onClick: () => openCardBook(G) }),
      ui.btn('상점', { color: 'yellow', cls: 'sm', onClick: () => open ? this.shop() : ui.toast('스테이지 2를 깨면 열려요!', 'red') }),
      ui.btn('더보기', { color: 'blue', cls: 'sm', onClick: () => openMore(G, [town]) }));
    col.append(side);
    this.playBtn = playButton(G);
    const lock = (label, color, icon, go) => ui.btn(label, { color, icon: open ? icon : 'lock', disabled: !open, onClick: dis => dis ? ui.toast('스테이지 2를 깨면 열려요!', 'red') : go() });
    const row = h('div', { class: 'row2 three' },
      lock('꾸미기', 'orange', 'paint', () => this.setMode('edit')),
      lock('숨기기', 'purple', 'hide', () => this.setMode('hide')),
      lock('놀러 가기', 'pink', 'play', () => G.go('visit')));
    col.append(h('div', { class: 'homebar' }, this.playBtn, row));
    // the boxes of chapters you'd already finished before this update (설계서 8장): one 🎁 each, opened here
    const q = (this.H.boxQ || []).filter(i => PICKS[i] && !(i in (this.H.picks || {})));
    if (q.length && open) {
      const gift = ui.btn(`🎁 지난 장 선물 ${q.length}`, { color: 'yellow', cls: 'sm pulse', onClick: async () => {
        const i = q[0], t = await pickPanel(G, PICKS[i], { title: `${REGION_NAME(i)} 선물 상자!`, line: '하나 골라! 나머지 둘은 상점 기념품 칸에 올라가' });
        takePick(G, i, t); ui.toast(`${FURN_INFO[t].name} · 꾸미기 보관함에 들어갔어`, 'green'); this.setMode('lobby');
      } });
      gift.style.cssText += 'position:absolute;left:12px;top:calc(76px + var(--safeT));pointer-events:auto';
      col.append(gift);
    }
  }

  // ── friends in the room
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
  freeSpot(near = null) {
    const R = this.room, taken = [this.mong.root.position, ...this.seated.map(s => s.rec)], c = [];   // (a seat, not where its friend is walking from)
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
      const p = z.friends.length < seatsOf(z) ? this.freeSpot() : null;
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
    if ((z.friends?.length || 0) >= seatsOf(z)) { G.ui.toast(seatsOf(z) >= 6 ? '자리가 꽉 찼어 (최대 6)' : '자리가 꽉 찼어 · 방을 넓히면 자리가 늘어', 'red'); return; }
    const p = this.freeSpot(); if (!p) { G.ui.toast('앉을 자리가 없어요! 가구를 조금 치워 봐', 'red'); return; }
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
    if (this.mode === 'edit') { const s = this.seatedHit(x, y); if (s) { this.selectFriend(s); return; } this.selectFriend(null); }
    return super.tap(x, y);
  }
  dragStart(x, y) {
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
            if (!cur.ok) { cur = start; this.G.ui.toast('거긴 앉을 수 없어요', 'red'); }
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
    const r = super.setMode(mode);
    if (mode === 'lobby') this.frameLobby(); else this.frameRoom();
    return r;
  }
  // the lobby looks at 몽글이 and whoever sits with it, close up while the room is still bare (user, 10/19: "처음에 너무
  // 썰렁하니까 캐릭터 쪽 클로즈업으로 잡아주자"), opening out as furniture and friends fill it; 꾸미기·숨기기 see the whole room
  frameLobby(dur = .7) {
    if (this.dead || !this.room) return;
    const W = this.G.world, pts = [this.mong.root.position, ...this.seated.map(s => s.rec), ...(this.guest ? [this.guest.root.position] : [])];
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
    const spread = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.z - cz)));
    const filled = (this.zone.furniture?.length || 0) + this.seated.length;
    const zoom = clamp(Math.min(2.5 - filled * .08, 2.3 / Math.max(1, spread + .35)), 1.15, 2.5);
    const target = new THREE.Vector3(cx, 1.05, cz);   // (a raised look-at point sits the group lower on the screen, nearer the buttons)
    if (this._framed) W.flyTo(this.tw, { target, zoom, dur }); else { W.target.copy(target); W.zoom = zoom; this._framed = true; }
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
    G.audio.sfx('special'); G.ui.toast('토순이가 네 방 친구가 됐어!', 'green'); G.persist(); this.frameLobby();
    this.busyTut = false;
    this.arrivals();
    this.playBtn?.classList.add('pulse');
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

  update(dt) {
    super.update(dt);
    for (const s of this.seated) s.ch.update(dt);
    this.guest?.update(dt);
    if (this.ftool && this.fsel) {
      const p = this.G.world.toScreen(new THREE.Vector3(this.fsel.ch.root.position.x, this.fsel.ch.headTop() + .35, this.fsel.ch.root.position.z));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  botStep(dt) {
    if (this.mode !== 'lobby') return super.botStep(dt);
    this._bt = (this._bt || 0) + dt; if (this._bt > 1.2) { this._bt = 0; this.playBtn?.press(); }
  }
  state() { return this.mode === 'lobby' ? { scene: 'home', lobby: true, stage: (this.G.save.stage || 0) + 1, coins: this.G.save.coins, friends: this.seated.map(s => s.k) } : super.state(); }
}
