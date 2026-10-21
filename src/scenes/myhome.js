// Meta: 몽글이's home. Decorate modular zones (rooms → storage → yard → park), hide things, publish the room,
// and strangers who open the shared game come to find what you hid.
import * as THREE from 'three';
import { Room, attachItem, indexSpots } from '../room.js';
import { cachedGeos, STYLE, forgetMats, rbox, canvasTex, roundRect } from '../gfx/kit.js';   // (QA3-tex11; the 넓히기 sign)
import { validateRoom } from '../roomdoc.js';
import { buildItem, ITEMS } from '../gfx/items.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { Char } from '../gfx/chars.js';
import { pickSurface, resolveHost, makeFreeSpot, dropFreeSpot, toLocal, viewsOf } from '../freehide.js';
import { Visitors } from '../visitors.js';
import { h, ICON } from '../ui.js';
import { ease, clamp, Tweens } from '../util.js';
import { HOME_ZONES, ZONE_TYPES, zoneLayout, zoneSize, SHOP_FURN, ZONE_SIZES, pinZoneFurniture } from '../catalog.js';
import { playDialog } from '../story.js';
import { HOME_TUT, giftSeats } from '../script.js';
import { tr } from '../i18n.js';
import { openShop } from '../shop.js';
import { net, initNet, publishRoom, roomStats } from '../net.js';
import { seatedAll, ECON, seatsOf } from '../econ.js';
import { messOpen, messShut, askBuyLock } from '../raidreplay.js';   // 털린 흔적 · 자물쇠 사기 (털기 메타 10/19)
import { locksOwned, locksUsed } from '../raid.js';
import { Hand } from '../handhold.js';
import { holdStart, holdDrag, holdCancel, holdTick } from '../hidehold.js';   // 숨기기 = 가구 놓기처럼 (10/20)   // 손에 든 물건: 하나씩 크게 → 손 → 콕 → 쏙 (보물 지키기와 같은 손맛, 10/20)

const V = new THREE.Vector3();
const MAX_HIDE = 5;

// ── one map for the whole home (10/19 night, user: "큰방 작은방 따로 분리되어 있는 거야? 하나의 맵에서 같이 봐야지"): every open
// zone stands in the same scene under one camera, as a stage's rooms do — the rooms side by side in zone order (back edges
// in line), the yard and the park in front of them. The zone you work in (tabs, or a tap on another room) is this.room and
// stands at the origin, so everything that works in room coordinates is as before; the others are neighbours you see and
// tap to move over to. The save is untouched: each zone keeps its own furniture, paint and size.
const GAP = 1.1;
function homePlan(G, H) {
  const ids = HOME_ZONES.map(z => z.id).filter(id => G.zoneOpen(id) && H.zones[id]);
  const inside = ids.filter(id => ZONE_TYPES[H.zones[id].type]?.indoor !== false), outside = ids.filter(id => !inside.includes(id));
  const dIn = Math.max(0, ...inside.map(id => zoneSize(H.zones[id]).d)), at = {};
  const row = (list, zOf) => { let x = null, pw = 0; for (const id of list) { const S = zoneSize(H.zones[id]); x = x == null ? 0 : x + pw / 2 + GAP + S.w / 2; pw = S.w; at[id] = [x, zOf(S)]; } };
  row(inside, S => (S.d - dIn) / 2);
  row(outside, S => dIn / 2 + GAP + S.d / 2);
  return at;
}

export class MyHomeScene {
  constructor(G) { this.G = G; this.name = 'myhome'; }
  get H() { return this.G.save.home; }
  get zone() { return this.H.zones[this.zoneId]; }
  async enter({ zone = null, mode = 'view' } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    this.zoneId = zone && G.zoneOpen(zone) ? zone : (this.H.current && G.zoneOpen(this.H.current) ? this.H.current : 'room1');
    this.H.current = this.zoneId;
    this.build();
    this.homeMid(); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0; W.snap = !!G.save.settings?.snap;
    this.fitCam();
    W.onTap = (x, y) => this.tap(x, y);
    W.onRotate = null;
    W.onDragStart = (x, y) => this.dragStart(x, y);
    G.audio.music('home');
    this.setMode(mode);
    this.loadStats();
    // first visit (home opens after stage 2) — 대본 (10/18): 토순이 comes over, you hide one thing, she looks for it.
    // Decorating, the shop, locks and posting each come when they're needed, not as a speech up front.
    const tut = G.save.tut || (G.save.tut = {});
    if (!tut.home && !G.bot && !G.skipTalk && !this.lobby) {   // (the lobby — 경제·로비 on — runs its own: lobby.js roomOpens)
      tut.home = true; G.persist();
      await this.tw.wait(.6); if (this.dead) return;
      await playDialog(G, HOME_TUT.hello, { title: '내 집' }); if (this.dead) return;
      const n0 = this.targetCount();
      const raidLater = !tut.raidTip; tut.raidTip = 1;   // (the 털기 tip waits until 토순이 is done, so two tips don't stack)
      if (n0 < MAX_HIDE) {
        this.setMode('hide');
        const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .16}px` }, tr(HOME_TUT.both));
        G.ui.tut.append(tip); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = 'hidden');   // (not two bands on top of each other — 검토 v108)
        while (!this.dead && this.targetCount() === n0) await this.tw.wait(.1);   // done when something is really hidden
        tip.remove(); this.col?.querySelectorAll('.hint').forEach(e => e.style.visibility = ''); if (this.dead) return;
        await this.tw.wait(.6); if (this.dead) return;
        const rec = this.H.hide.items[this.H.hide.items.length - 1], inside = !!(rec?.free?.part || (rec?.spot && this.spotByKey?.[rec.spot]?.part));
        await playDialog(G, HOME_TUT.count); if (this.dead) return;
        await this.tw.wait(.7); if (this.dead) return;
        await playDialog(G, inside ? HOME_TUT.missed : HOME_TUT.found); if (this.dead) return;   // tucked inside → she gives up
      }
      await playDialog(G, HOME_TUT.bye);
      if (raidLater && !this.dead) G.ui.toast('서랍 속·자물쇠 안일수록 동네 주민이 못 털어 가', '');
    }
  }
  // frame the zone whatever its size (rooms can be widened in the shop)
  fitCam() {
    const W = this.G.world, M = this.mapBox(), { span } = this.frameSpan();
    this.homeMid();
    document.getElementById('app').style.setProperty('--joyB', '330px');   // above the cards and buttons
    W.slack = null;   // (a big map stage's wider box came along — QA3 10/19)
    // (the whole map can be panned to: from the view's middle to its farthest edge)
    const hx = W.home.x, hz = W.home.z, far = Math.max(M.x1 - hx, hx - M.x0, M.z1 - hz, hz - M.z0);
    W.bounds = Math.max(2.4, far * .96); W.minPitch = .06; W.maxPitch = 1.45; W.minZoom = .85; W.maxZoom = 7;
    // hiding and decorating have cards and buttons at the bottom: the room sits higher and a little smaller there
    const busy = this.mode === 'hide' || this.mode === 'edit' || this.mode === 'lobby';   // (the lobby: the play button and its row)
    W.setFit(Math.max(7.5, span), Math.max(6.6, span * .62) * (busy ? 1.05 : 1), busy ? (this.nbs?.length ? .43 : .405) : .45);   // (a wide map is shallow: a little lower)
  }
  exit() { if (this.held) { try { holdCancel(this, true); this.G.persist(); } catch {} }   // (QA9: a thing picked up to move goes back to its place)
    document.getElementById('app').style.removeProperty('--joyB'); this.dead = true; this.visitors?.dispose(); const W = this.G.world; W.root.remove(this.room.group); freeRoom(this.room.group); if (this.nbGroup) { W.root.remove(this.nbGroup); freeRoom(this.nbGroup); } W.onTap = null; W.onDragStart = null; this.G.ui.clear(); this.tw.clear(); }
  // the whole home's floor (the zone you're in at the origin): { x0, x1, z0, z1, w, d, cx, cz }
  mapBox() {
    const R = this.room, b = { x0: -R.w / 2, x1: R.w / 2, z0: -R.d / 2, z1: R.d / 2 };
    for (const n of this.nbs || []) { const p = n.room.group.position; b.x0 = Math.min(b.x0, p.x - n.room.w / 2); b.x1 = Math.max(b.x1, p.x + n.room.w / 2); b.z0 = Math.min(b.z0, p.z - n.room.d / 2); b.z1 = Math.max(b.z1, p.z + n.room.d / 2); }
    return { ...b, w: b.x1 - b.x0, d: b.z1 - b.z0, cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2 };
  }
  // how wide the view opens: the whole map, but the zone you're in never under ~2/3 of its own full-screen size (two rooms
  // fit; with three or more the rest peek in at the side and the view pans to them); t: how far the view's middle leans
  // from this zone to the middle of the map
  frameSpan() {
    const A = this.room, M = this.mapBox(), sp = (w, d) => (w + d) / Math.SQRT2 + .5;
    const one = sp(A.w, A.d), all = sp(M.w, M.d), span = Math.min(all, one * 1.6);
    return { span, t: all > one + .01 ? clamp((span - one) / (all - one), 0, 1) : 1 };
  }
  homeMid() { const b = this.mapBox(), { t } = this.frameSpan(); this.G.world.home.set(b.cx * t, .75, b.cz * t); }
  // the other open zones around the one you're in, where homePlan puts them
  buildNeighbours() {
    const W = this.G.world, plan = this.plan = homePlan(this.G, this.H), me = plan[this.zoneId] || [0, 0], g = new THREE.Group();
    this.nbs = [];
    for (const id in plan) {
      if (id === this.zoneId) continue;
      const R = new Room(W, zoneLayout(this.H.zones[id]));
      R.group.position.set(plan[id][0] - me[0], 0, plan[id][1] - me[1]);
      // (털린 흔적 already known there stays open in the picture too; it's shut by hand once you're in that room)
      const ix = indexSpots(R); for (const k of this.H.mess || []) if (!/^d\d+:/.test(k)) ix.parts[k]?.setOpen?.(1);   // (furniture ids are one per home; a wall decor's 'd0:p0' is in every room)
      g.add(R.group); this.nbs.push({ id, room: R });
    }
    return g;
  }
  // ── 방 넓히기 (10/20, user: "그냥 방으로 하자. 나중에 넓히는 거 나오고 …"): the room's next size is the first thing to save for.
  // Not a sign on the wall (user 10/20: "HUD처럼 … 점선이랑 … 넓히는 쪽 바닥에 화살표도 … 게이지 너무 크고 액자인 줄") — on the
  // floor, where the room will grow: the new row as a dashed patch with arrows running outward, on whichever side faces you
  // (the view turns: growTick moves it), and a small chip by it — how far your coins are (🔨 240 / 300), green 넓히기 once you
  // can pay. Tap the patch or the chip: a card, then 넓히기 — the walls go out. At the biggest room: the chip alone, 집 짓기.
  growNext() { const z = this.zone, k = (z?.size || 0) + 1; return z && ZONE_TYPES[z.type]?.indoor !== false && k < ZONE_SIZES.length ? { k, S: ZONE_SIZES[k] } : null; }
  buildGrowSign() {
    const G = this.G, R = this.room, nx = this.growNext(), z = this.zone;
    // (the room at its biggest: nothing on the floor — 집 짓기 is the 방 크기 tab's own card — 로드맵 예고 A)
    const house = !nx && !!z && ZONE_TYPES[z.type]?.indoor !== false && (z.size || 0) >= ZONE_SIZES.length - 1;
    if (!nx || !R) return null;
    const C = G.save.coins || 0, can = !house && C >= nx.S.price;
    const g = new THREE.Group(), gx = house ? 0 : nx.S.w - R.w, gz = house ? 0 : nx.S.d - R.d, ax = gx > 0 ? 'x' : 'z', gw = Math.max(gx, gz, 0), len = ax === 'x' ? R.d : R.w;
    const chev = [];
    if (!house && gw > 0) {
      // the new row: a pale patch with an ink dashed edge, lying on the floor's level; local +x is 'outward'
      const px = 128, tex = canvasTex(Math.round(px * gw), Math.round(px * len), (ctx, W2, H2) => {
        ctx.fillStyle = can ? 'rgba(206,246,206,.8)' : 'rgba(255,251,240,.8)'; roundRect(ctx, 8, 8, W2 - 16, H2 - 16, 22); ctx.fill();
        ctx.setLineDash([24, 16]); ctx.lineWidth = 8; ctx.strokeStyle = can ? '#2f8f3a' : '#3a2453'; ctx.stroke();
      });
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(gw, len), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      patch.rotation.x = -Math.PI / 2; patch.position.set(gw / 2, .025, 0); patch.renderOrder = 2; g.add(patch);
      // arrows: a fat arrow (shaft and head — a chevron reads as an 'ㄴ' on the tilted floor), three along the row, sliding outward
      const ctex = canvasTex(128, 128, (ctx) => {
        ctx.lineJoin = 'round'; ctx.beginPath();
        ctx.moveTo(12, 50); ctx.lineTo(62, 50); ctx.lineTo(62, 22); ctx.lineTo(116, 64); ctx.lineTo(62, 106); ctx.lineTo(62, 78); ctx.lineTo(12, 78); ctx.closePath();
        ctx.lineWidth = 12; ctx.strokeStyle = '#3a2453'; ctx.stroke(); ctx.fillStyle = can ? '#5fd36f' : '#ffb23a'; ctx.fill();
      });
      const cmat = new THREE.MeshBasicMaterial({ map: ctex, transparent: true, depthWrite: false });
      for (const zz of [-len / 3, 0, len / 3]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), cmat.clone()); m.rotation.x = -Math.PI / 2; m.position.set(gw / 2, .04, zz); m.renderOrder = 3;
        g.add(m); chev.push(m);
      }
    }
    R.group.add(g);
    g.traverse(o => { o.userData.grow = true; });
    return { g, can, house, chev, ax, gw, t: 0 };
  }
  // every frame: on the side of the room that faces you (the front walls are the folded ones), the arrows running out — only while
  // the shop's 방 크기 card is being looked at (user 10/20: "벽·바닥으로 가야 저거 늘리는 UI 나오는 걸로 하자. 계속 저게 나오니..")
  growTick(dt) {
    const gs = this.growSign; if (!gs) return;
    const R = this.room, Wl = R.walls || {};
    gs.g.visible = !!this._growPeek && !this._growing;
    if (!gs.g.visible) return;
    const sx = Wl.E?.down ? 1 : Wl.W?.down ? -1 : 1, sz = Wl.S?.down ? 1 : Wl.N?.down ? -1 : 1;
    if (gs.ax === 'x') { gs.g.position.set(sx * R.w / 2, 0, 0); gs.g.rotation.y = sx > 0 ? 0 : Math.PI; }
    else { gs.g.position.set(0, 0, sz * R.d / 2); gs.g.rotation.y = sz > 0 ? -Math.PI / 2 : Math.PI / 2; }
    gs.t += dt;
    gs.chev.forEach((m, i) => { const k = (gs.t * (gs.can ? .9 : .6) + i * .18) % 1; m.position.x = gs.gw / 2 - .16 + k * .32; m.material.opacity = .45 + .55 * Math.sin(k * Math.PI); });
  }
  // 집 짓기 · 곧 열려요 (예고 A): what's next — a picture of the two-floor house (art/concepts H, cropped) and one line
  houseCard() {
    const G = this.G, ui = G.ui, img = h('img', { src: 'art/keyart/house-teaser.webp', style: 'display:block;width:100%;max-height:46vh;object-fit:cover;object-position:top;border-radius:14px;border:3px solid var(--ink,#3a2453);margin:4px 0 8px' });
    img.onerror = () => { img.onerror = null; img.src = 'art/keyart/house-teaser.jpg'; };
    G.audio.sfx('click');
    ui.panel({ title: '집 짓기', color: 'orange', body: [img, h('div', { class: 'txt', style: 'text-align:center' }, h('b', {}, '방을 끝까지 넓혔어!')), h('div', { class: 'txt', style: 'text-align:center' }, '다음 업데이트에서 방이 여럿인 집을 지을 수 있어')],
      buttons: [ui.btn('기대할게', { color: 'green', cls: 'big', onClick: () => ui.closePanel() })] });
  }
  growAt() { return false; }   // (the floor row shows only in the shop's 방 크기 미리보기, and its bar asks — nothing to tap in the room)
  growCard() {
    const G = this.G, ui = G.ui, z = this.zone, nx = this.growNext(); if (!nx) return;
    const S0 = zoneSize(z), C = G.save.coins || 0, need = nx.S.price - C, seat = seatsOf({ size: nx.k }) > seatsOf(z);
    G.audio.sfx('click');
    ui.panel({ title: '방 넓히기', color: 'orange', body: [
      h('div', { class: 'big-txt', style: 'text-align:center' }, `${S0.w} × ${S0.d}`, h('span', { style: 'font-family:system-ui,sans-serif;margin:0 8px' }, '→'), `${nx.S.w} × ${nx.S.d}`),   // (the title font has no arrow)
      h('div', { class: 'txt', style: 'text-align:center' }, `가구 놓을 칸 +${nx.S.w * nx.S.d - S0.w * S0.d}` + (seat ? ' · 친구 자리 +1' : '')),
      h('div', { style: 'display:flex;align-items:center;justify-content:center;gap:6px;font-size:24px;margin:6px 0' }, h('span', { html: ICON.coin, style: 'width:28px;height:28px;display:inline-block' }), h('b', {}, String(nx.S.price))),
      h('div', { class: 'txt', style: `text-align:center;color:${need > 0 ? '#8a6a9a' : '#2f8f1b'}` }, need > 0 ? `코인 ${need}개 더 모으면 넓힐 수 있어` : '지금 넓힐 수 있어!')],
      buttons: [ui.btn('닫기', { color: 'blue', cls: 'sm', onClick: () => ui.closePanel() }),
        ui.btn('넓히기', { color: 'green', icon: 'coin', cls: 'big', disabled: need > 0, onClick: dis => {
          if (dis) { ui.toast(`코인 ${need}개 더 모으면 넓힐 수 있어`, 'red'); return; }
          if ((G.save.coins || 0) < nx.S.price) return;
          ui.closePanel(); const from = z.size || 0; G.addCoins(-nx.S.price); pinZoneFurniture(z); z.size = nx.k; G.persist(); this.growShow(from);
        } })] });
  }
  // the walls go out: three knocks and dust at the old corners, then the room — built again at its new size — swells from the
  // old size to the new one (the things in it keep their shape and spread out with the floor), 몽글이 cheers
  async growShow(from) {
    const G = this.G, W = G.world, tw = this.tw, A = ZONE_SIZES[from] || ZONE_SIZES[0];
    if (this.sel) this.select(null);   // (QA9: the piece picked before was the old room's — rotate / box worked a mesh that was gone)
    const push = this.growFront(A);   // (the new row goes on the side the dashed patch was on — UI 10/20)
    this.busyTut = true; this._growing = true;
    if (this.mode === 'lobby') this._heroView = 'room';   // (the lobby looks at the whole room from here on: the bigger room is the news)
    W.flyTo(tw, { target: W.home.clone(), zoom: 1, dur: .45 });
    await tw.wait(.45); if (this.dead) return;
    for (let i = 0; i < 3; i++) {
      G.audio.sfx('place', i);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const s = W.toScreen(new THREE.Vector3(sx * A.w / 2, .1, sz * A.d / 2)); W.fx.burst(s.x, s.y, { n: 6, shape: 'dot', colors: ['#e8d6b8', '#d2b892', '#fff6e6'], speed: 110, size: 9, life: .5, gravity: -30 }); }
      W.shake?.(.12); await tw.wait(.3); if (this.dead) return;
    }
    const inLobby = this.mode === 'lobby';
    this.build(); if (inLobby) this.setMode('lobby'); else this.fitCam();   // (꾸미기 stays 꾸미기)
    if (inLobby) { this._heroView = 'room'; this.homeMid(); W.target.copy(W.home); W.zoom = 1; W.updateCam?.(); }   // (setMode('lobby') forgets the view: the whole room, to see it grow)
    const R = this.room, sx0 = A.w / R.w, sz0 = A.d / R.d, p0 = R.group.position.clone();
    const keep = [...R.furns.map(r => r.f.group), ...(this.seated || []).map(s => s.ch.root), ...(this.mong?.root?.parent === R.group ? [this.mong.root] : [])].map(o => [o, o.scale.clone()]);
    // (it swells out of the old room's place: the far walls stay where they were and the room grows toward you)
    await tw.run(.6, k => { const sx = sx0 + (1 - sx0) * k, sz = sz0 + (1 - sz0) * k; R.group.scale.set(sx, 1, sz); R.group.position.set(p0.x - push.x * (1 - k), p0.y, p0.z - push.z * (1 - k)); for (const [o, s0] of keep) o.scale.set(s0.x / sx, s0.y, s0.z / sz); }, ease.outBack);
    R.group.scale.set(1, 1, 1); R.group.position.copy(p0); for (const [o, s0] of keep) o.scale.copy(s0);
    if (this.dead) return;
    G.audio.sfx('special'); W.fx.confetti?.(50);
    const m = this.mong; if (m) { m.pose = 'cheer'; m.setFace?.('wow'); m.bump(.45); }
    G.ui.banner('방이 넓어졌어!', `${R.w} × ${R.d}`, 1300);
    await tw.wait(1.2); if (this.dead) return;
    if (m) { m.pose = 'idle'; m.setFace?.('happy'); }
    this.busyTut = false; this._growing = false;
  }
  // 방 넓히기 toward you (UI 10/20: "앞쪽(점선 칸 쪽)으로만 한 줄이 붙게"): the room's floor is centred, so a bigger room moves
  // both walls out half a step. Everything in it — the furniture, the friends' seats, a thing hidden on the bare floor — moves
  // half a step back, so it keeps its place against the far wall and the new row is the one by the dashed patch (on the side
  // that faced you). Returns how far the old room's middle sits from the new one's (for the swell).
  growFront(A) {
    const z = this.zone, B = zoneSize(z), R = this.room, Wl = R?.walls || {}, gs = this.growSign;
    const sx = Wl.E?.down ? 1 : Wl.W?.down ? -1 : 1, sz = Wl.S?.down ? 1 : Wl.N?.down ? -1 : 1;
    const dx = (B.w - A.w) / 2 * sx, dz = (B.d - A.d) / 2 * sz;
    if (!dx && !dz) return { x: 0, z: 0 };
    for (const f of z.furniture || []) if (f.x != null) { f.x -= dx; f.z -= dz; }
    for (const f of z.friends || []) { f.x -= dx; f.z -= dz; }
    if (z.mong) { z.mong.x -= dx; z.mong.z -= dz; }   // (몽글이's own spot too — ③ 10/21)
    const hid = this.H.hide; if (hid?.zoneId === this.zoneId) for (const e of hid.items || []) if (e.free?.host === 'room' && Array.isArray(e.free.p)) { e.free.p[0] -= dx; e.free.p[2] -= dz; }
    this.G.persist();
    return { x: dx, z: dz };
  }
  // 상점 미리보기 (10/20): the whole room in view while a wallpaper or floor is tried on (the lobby's close-up shows none of it);
  // the lobby stops re-framing itself meanwhile
  previewView(on) {
    const W = this.G.world; this._previewing = !!on;
    if (on) { if (this.mode === 'lobby') this._heroView = 'room'; this.homeMid(); W.target.copy(W.home); W.zoom = 1; W.updateCam?.(); }
  }
  // which neighbour (zone id) is under this point of the screen, if any
  nbAt(x, y) {
    if (!this.nbs?.length) return null;
    for (const hh of this.G.world.pick(x, y, this.nbs.map(n => n.room.group))) {
      let tagged = false;
      for (let o = hh.object; o; o = o.parent) {
        const u = o.userData; if (u.furn || u.part || u.floor || u.wall) tagged = true;
        const n = tagged && this.nbs.find(q => q.room.group === o); if (n) return n.id;
      }
    }
    return null;
  }

  build() {
    const G = this.G, W = G.world;
    const old = this.room, oldNb = this.nbGroup;   // (freed below, once the new room exists — GPT QA 10/18: every rebuild left ~3 textures behind)
    if (old) W.root.remove(old.group);
    if (oldNb) W.root.remove(oldNb);
    const z = this.zone, lay = zoneLayout(z);
    G.setBg(lay.theme.bg || (ZONE_TYPES[z.type].indoor ? ['#fff3e3', '#ffe2c4'] : ['#e4f6ff', '#d6f3d8'])); G.world.setLight(lay.theme.light || null);
    this.room = new Room(W, zoneLayout(z));
    W.root.add(this.room.group);
    this.nbGroup = this.buildNeighbours(); W.root.add(this.nbGroup);
    this.growSign = ECON ? this.buildGrowSign() : null;   // (방 넓히기: the room's next row, on the floor)
    if (old) freeRoom(old.group, [this.room.group, this.nbGroup]);
    if (oldNb) freeRoom(oldNb, [this.room.group, this.nbGroup]);
    const idx = indexSpots(this.room); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    this.items = {};
    const hid = this.H.hide;
    if (hid.zoneId === this.zoneId) {
      for (const e of hid.items.slice()) {
        if (e.free) {
          const host = resolveHost(this.room, e.free.host, this.partByKey, e.free.part);
          if (!host) { hid.items = hid.items.filter(x => x !== e); continue; }
          this.putItem(e.item, makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0));
          continue;
        }
        const s = this.spotByKey[e.spot];
        if (!s || s.item) { hid.items = hid.items.filter(x => x !== e); continue; }
        this.putItem(e.item, s);
      }
      for (const pk in hid.locks) { const p = this.partByKey[pk]; if (p) p.furn.setLock(p, hid.locks[pk], hid.code); else delete hid.locks[pk]; }
    }
    messOpen(this);   // 털린 흔적: what a resident opened stays open until you shut it
    this.mong = new Char('mong'); this.mong.root.position.set(1.9, 0, 1.9); this.mong.root.rotation.y = .8;   // (the room's owner is always 몽글이 — the 도감 pick is a friend who walks along, 10/19; comment no longer swallows the placing)
    if (this.lobby) { const R = this.room, [mx, mz] = [[.7, 1.1], [.3, 1.5], [1.1, .5], [0, .6], [1.5, 1.5]].find(([x, z]) => R.clearAt(x, z, .34)) || [1.9, 1.9]; this.mong.root.position.set(mx, 0, mz); }
    // (③ 10/21, user: "내방배치에 몽글이도 배치 변경 가능해야됨"): where you put 몽글이 in 꾸미기, while it is still free
    const ms = this.lobby && this.zone?.mong; if (ms && this.room.clearAt(ms.x, ms.z, .3)) { this.mong.root.position.set(ms.x, 0, ms.z); if (ms.a != null) this.mong.root.rotation.y = ms.a; }   // (the lobby: in the middle of things, the camera on it)
    this.room.group.add(this.mong.root);
    if (this.lobby) this.seatFriends();   // the friends sitting in this room (lobby.js)
    W.idsDirty = true;
    // friends drop by while you just look at your home
    this.visitors?.dispose();
    const door = this.room.doorDecor ? this.room.frontOf(this.room.doorDecor.f) : null;
    this.visitors = new Visitors(G, { parent: this.room.group, mong: this.mong, tw: this.tw, indoorRoom: !!ZONE_TYPES[this.zone.type].indoor,
      active: () => (this.mode === 'view' || this.mode === 'lobby') && !G.ui.panelOpen && !this.busyTut, skip: () => this.lobby ? seatedAll(this.H) : null,
      entry: () => door ? [door.x, door.z] : [-1.9, 2.1], meet: () => [this.mong.root.position.x - .8, this.mong.root.position.z - .3], say: (ch, t, ms) => this.say(ch, t, ms),
      // (10/19 겹침 QA: a visitor walked onto a friend seated in the lobby, .25 m, and then stopped .42 m from 몽글이) 몽글이 and the
      // seated friends are in the way too — it still meets 몽글이 at its usual .85 m
      clear: (x, z, r) => this.room.clearAt(x, z, r) && ![this.mong.root.position, ...(this.seated || []).map(s => s.ch.root.position)].some(p => Math.hypot(p.x - x, p.z - z) < r + .3),
      seats: () => giftSeats(G, this.room) });   // 대본: a gift is its friend's seat
  }
  putItem(type, spot) {
    const g = buildItem(type, { code: this.H.hide.code || '000' });
    attachItem(spot, g, { rotY: .3 });
    const it = { type, spot, g }; g.userData.item = it; spot.item = it; this.items[type] = it;
    this.G.world.idsDirty = true;
    return it;
  }
  removeItem(type) {
    const it = this.items[type]; if (!it) return;
    it.spot.item = null; it.spot.itemGroup = null; it.g.parent?.remove(it.g);
    if (it.spot.free) dropFreeSpot(it.spot);
    delete this.items[type];
    this.H.hide.items = this.H.hide.items.filter(e => e.item !== type);
  }
  switchZone(id) {
    if (id === this.zoneId) return;
    const G = this.G;
    if (!G.zoneOpen(id)) { const z = HOME_ZONES.find(x => x.id === id); G.ui.toast(`스테이지 ${z.unlock.stage}에서 열려 · 상점에서 미리 열 수도 있어`, 'red'); return; }
    const a = this.plan?.[this.zoneId], b = this.plan?.[id], W = G.world;
    this.zoneId = id; this.H.current = id; G.persist();
    G.audio.sfx('whoosh');
    this.build();
    // the map moved under the camera (the new zone is the origin now): the view moves with it, so nothing jumps
    if (a && b) { W.target.x += a[0] - b[0]; W.target.z += a[1] - b[1]; }
    this.setMode(this.mode === 'hide' ? 'hide' : this.mode);
    W.updateCam?.();
  }

  // ── HUD
  setMode(mode) {
    if (this.held) holdCancel(this, true);   // (숨기기: a thing still held goes back)
    const G = this.G, ui = G.ui;
    this.mode = mode; this.sel = null; this.markers = null; this.ftool = null; this.dropFootprint();   // (it stayed on the floor after 완료 — QA3 10/19)
    ui.clear(); if (this.room) this.fitCam();
    const col = this.col = ui.col();
    if (mode === 'lobby') return this.lobbyHud();   // the lobby (경제·로비 on, lobby.js): its own top bar, no zone tabs
    const back = ui.ibtn('home', 'blue', () => mode === 'view' ? G.go('home') : this.setMode(this.lobby ? 'lobby' : 'view'));
    back.style.cssText += 'position:absolute;left:12px;top:calc(12px + var(--safeT))';
    col.append(back);
    const pills = h('div', { class: 'pills' }); const cp = ui.pill('coin', G.save.coins); pills.append(cp); col.append(pills); G.coinPills = [cp];
    col.append(this.zoneTabs());
    if (mode === 'view') this.viewHud();
    else if (mode === 'edit') this.editHud();
    else if (mode === 'hide') this.hideHud();
  }
  zoneTabs() {
    const G = this.G;
    const bar = h('div', { class: 'zonetabs' });
    if (ECON) return bar;   // (경제·로비: one room — 10/20 "그냥 방으로 하자"; the house and the town come later)
    let teaser = false;   // (open rooms, then only the next one to open, locked — the rest appear as they open, not four 🔒 tabs at once: 2D UI 정리 ③ 10/19)
    for (const z of HOME_ZONES) {
      const open = G.zoneOpen(z.id);
      if (!open && z.id !== this.zoneId) { if (teaser) continue; teaser = true; }
      bar.append(h('button', { class: 'zonetab' + (z.id === this.zoneId ? ' on' : '') + (open ? '' : ' locked'), onclick: () => this.switchZone(z.id) }, open ? z.name : `🔒 ${z.name}`));
    }
    return bar;
  }
  viewHud() {
    const G = this.G, ui = G.ui;
    this.recordEl = h('div', { class: 'record' }, '내 숨바꼭질 방 기록 불러오는 중…');
    this.col.append(this.recordEl);
    const bar = h('div', { class: 'modebar' });
    bar.append(h('div', { class: 'btnrow' },
      ui.btn('꾸미기', { color: 'orange', icon: 'paint', onClick: () => this.setMode('edit') }),
      ui.btn('숨기기', { color: 'purple', icon: 'hide', onClick: () => this.setMode('hide') }),
      ui.btn('상점', { color: 'yellow', icon: 'shop', onClick: () => this.shop() })));
    bar.append(ui.btn('놀러 가기', { color: 'green', icon: 'play', cls: 'big stack', sub: '다른 사람이 숨긴 방 찾기', onClick: () => G.go('visit') }));
    this.col.append(bar);
    this.renderRecord();
  }
  async loadStats() {
    await initNet(); if (this.dead) return;
    const N = net();
    if (!N.ok) { this.stats = null; this.renderRecord(); return; }
    const all = await roomStats();
    if (this.dead) return;
    this.stats = all[N.uid] || { visitors: 0, plays: 0, wins: 0, fails: 0 };
    this.renderRecord();
  }
  renderRecord() {
    const el = this.recordEl; if (!el || this.mode !== 'view') return;
    const G = this.G, H = this.H, N = net();
    el.innerHTML = '';
    if (!H.published) { el.append(h('span', {}, '아직 올린 방이 없어요. 숨기기에서 방을 꾸며 올려 보세요!')); return; }
    if (!N.ok) { el.append(h('span', {}, `올린 방: ${HOME_ZONES.find(z => z.id === H.published.zoneId)?.name || ''} · 물건 ${H.published.count}개 (연습 모드에선 나만 볼 수 있어요)`)); return; }
    const s = this.stats;
    if (!s) { el.append(h('span', {}, '기록 불러오는 중…')); return; }
    el.append(h('span', {}, `내 방에 놀러 온 사람 ${s.visitors ?? s.plays}명 · 도전 ${s.plays}번 · 다 찾음 ${s.wins} · 못 찾음 ${s.fails}`));
    const due = Math.max(0, s.fails - (H.claimedFails || 0));
    if (due > 0) el.append(G.ui.btn(`보상 +${due * 30}`, { color: 'yellow', icon: 'coin', cls: 'sm', onClick: () => { H.claimedFails = s.fails; G.addCoins(due * 30); G.persist(); G.audio.sfx('coin'); this.renderRecord(); } }));
  }
  shop(tab = 'furn') {
    if (this.H.shopNew) { delete this.H.shopNew; this.G.persist(); document.querySelectorAll('.badge.shopn').forEach(e => e.remove()); }   // (③ 10/21: the 상점 number, seen)
    openShop(this.G, { zone: this.zone, onChange: (kind, from) => {
      // (바르기 with the shop open: the room is rebuilt behind it and the shop stays — setMode's ui.clear closed it, so trying
      // several wallpapers meant opening it again each time, QA9 10/21; the HUD is redone when the shop closes)
      if (kind === 'paint') { this.build(); this.fitCam(); if (this.G.ui.panelOpen) this._modeStale = true; else this.setMode(this.mode); }
      if (kind === 'zone') { this.build(); this.setMode(this.mode); }   // (the new zone joins the map)
      if (kind === 'grow') { this.growShow(from); return; }   // (방 넓히기 from the shop: the same walls going out)
      if (kind === 'growpeek') { this._growPeek = !!from; return; }   // (방 크기 미리보기: the new row on the floor)
      if (kind === 'furn' && this.mode === 'edit') this.renderInv();
    }, onPreview: on => this.previewView(on), onBought: b => this.bought(b), onClose: () => { if (this.mode !== 'edit' || this._modeStale) { this._modeStale = false; this.setMode(this.mode); } } }, tab);
  }
  // 사면 방으로 (10/20, user: "테마든 벽이든 사기 누르면 다시 상점으로 나오는 게 아니고 방으로 가야 할 듯"): bought → 꾸미기 with it in
  // the room — a piece set down where there is room (and picked, to move it), a wallpaper / floor / theme already on — and a
  // short sparkle with the coin sound
  bought({ kind, type }) {
    const G = this.G, W = G.world;
    if (kind === 'furn') this.invTab = 'furn';   // (the lobby's 꾸미기 shows the 가구 row)
    if (this.mode !== 'edit') this.setMode('edit'); else if (kind === 'furn') this.renderInv();
    let at = null;
    if (kind === 'furn') { const i = this.H.inventory.lastIndexOf(type); if (i >= 0) { this.placeFromInv(i); const r = this.sel; if (r?.type === type) at = r.f.group.getWorldPosition(new THREE.Vector3()).setY(.6); } }
    const s = at ? W.toScreen(at) : { x: innerWidth / 2, y: innerHeight * .4 };
    W.fx.burst(s.x, s.y, { n: kind === 'furn' ? 14 : 22, shape: 'star', colors: ['#ffe14d', '#ffffff', '#ffb3c4'], speed: kind === 'furn' ? 160 : 240, gravity: -40 });
    G.audio.sfx('coin');
  }

  // ── decorate
  editHud() {
    const G = this.G, ui = G.ui;
    this.col.append(h('div', { class: 'hint' }, h('span', {}, '가구를 터치해서 고르고, 드래그해서 옮겨요')));
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    bar.append(h('div', { class: 'btnrow' },
      ui.btn('상점', { color: 'orange', icon: 'shop', onClick: () => this.shop('furn') }),
      ui.btn('벽·바닥', { color: 'pink', icon: 'paint', onClick: () => this.shop(ZONE_TYPES[this.zone.type].indoor ? 'wall' : 'floor') }),
      ui.btn('완료', { color: 'green', icon: ICON.check, onClick: () => { G.persist(); this.setMode('view'); } })));
    this.col.append(bar);
    this.renderInv();
  }
  fits(t) { const z = ZONE_TYPES[this.zone.type], it = SHOP_FURN.find(x => x.type === t); return !it || (z.indoor ? it.indoor : it.outdoor); }
  renderInv() {
    const G = this.G;
    if (!this.cardsEl) return;
    this.cardsEl.innerHTML = '';
    const inv = this.H.inventory;
    const shown = inv.map((t, i) => [t, i]).filter(([t]) => FURN_INFO[t]);
    if (!shown.length) this.cardsEl.append(h('div', { style: 'padding:14px;font-size:16px;color:#8a6a9a' }, '보관함이 비었어요. 상점에서 가구를 사 보세요!'));
    G.needThumbs?.(shown.map(([t]) => 'furn_' + t));
    for (const [t, i] of shown) {
      const ok = this.fits(t);
      this.cardsEl.append(h('div', { class: 'card' + (ok ? '' : ' lockedc'), onclick: () => ok ? this.placeFromInv(i) : G.ui.toast(ZONE_TYPES[this.zone.type].indoor ? '야외용이야' : '실내용이야', 'red') },
        h('img', { src: G.thumbs['furn_' + t] }), h('div', {}, FURN_INFO[t].name)));
    }
  }
  placeFromInv(i) {
    const G = this.G, t = this.H.inventory[i], R = this.room;
    const cands = [];
    // (10/19 겹침 QA: a gift or a star box piece was set down on 몽글이 or a seated friend) a piece's footprint and a body's
    // width round it keep clear of them while there is room elsewhere
    const bodies = [this.mong?.root.position, ...(this.seated || []).map(s => s.ch.root.position)].filter(Boolean);
    const onBody = (x, z, a) => { const o = R.obb(t, x, z, a, 1); return bodies.some(p => { const px = p.x - o.x, pz = p.z - o.z, u = px * o.c - pz * o.s, v = px * o.s + pz * o.c; return Math.abs(u) < o.hw + .3 && Math.abs(v) < o.hd + .3; }); };
    for (const keep of [true, false]) {
      for (let z = -R.d / 2 + .5; z <= R.d / 2 - .5; z += .5) for (let x = -R.w / 2 + .5; x <= R.w / 2 - .5; x += .5) for (const a of [0, Math.PI / 2])
        if (R.canPlaceAt(t, x, z, a) && !(keep && t !== 'rug' && onBody(x, z, a))) cands.push({ x, z, a, d: Math.hypot(x, z) + a * .05 });
      if (cands.length) break;
    }
    if (!cands.length) { G.ui.toast('자리가 없어! 가구를 보관함에 조금 넣어 봐', 'red'); return; }
    cands.sort((a, b) => a.d - b.d);
    const c = cands[0], id = 'f' + Date.now().toString(36) + i;
    this.H.inventory.splice(i, 1);
    this.zone.furniture.push({ type: t, x: c.x, z: c.z, a: c.a, id });
    const rec = R.addFurnitureAt(t, c.x, c.z, c.a, id);
    const idx = indexSpots(R); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    G.audio.sfx('place'); G.world.idsDirty = true;
    this.select(rec);
    const g = rec.f.group, y0 = g.position.y; this.tw.run(.35, k => { g.position.y = y0 + (1 - k) * 1.2; }, ease.outBounce);
    this.renderInv(); G.persist();
  }
  select(rec) {
    const G = this.G;
    this.sel = rec;
    this.ftool?.remove(); this.ftool = null;
    this.dropFootprint();
    if (!rec) return;
    const ui = G.ui;
    this.ftool = h('div', { class: 'ftool' },
      ui.btn(null, { color: 'blue', icon: 'rotate', onClick: () => this.rotateSel() }),
      ui.btn(null, { color: 'red', icon: 'box', onClick: () => this.storeSel() }));
    ui.wui.append(this.ftool);
    this.ftool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
    if (rec.x == null) { const [fw, fd] = this.room.footprint(rec.type, rec.rot), p = this.room.tileToWorld(rec.i, rec.j, fw, fd); this.room.moveFurnitureAt(rec, p.x, p.z, rec.rot * Math.PI / 2); }
    const fp = this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#7be04f', transparent: true, opacity: .45, depthWrite: false }));
    fp.rotation.order = 'YXZ'; fp.position.y = .02; this.room.group.add(fp);
    this.updFootprint(rec.x, rec.z, rec.a, true);
    G.audio.sfx('click');
  }
  dropFootprint() { const f = this.footprint; if (!f) return; f.parent?.remove(f); f.geometry.dispose(); f.material.dispose(); this.footprint = null; }
  updFootprint(x, z, a, ok, y = this.sel?.y || 0) {
    if (!this.sel || !this.footprint) return;   // (a mode change in the middle of a drag — QA3 10/19)
    const inf = FURN_INFO[this.sel.type];
    this.footprint.position.set(x, y + .02, z); this.footprint.rotation.set(-Math.PI / 2, a, 0); this.footprint.scale.set((inf.w || 1) - .06, (inf.d || 1) - .06, 1);
    this.footprint.material.color.set(ok ? '#7be04f' : '#ff4f66');
  }
  // 가구 위에 올리기 (10/20): a piece with something standing on it stays put — take that off first
  stackHeld(r) { if (!this.room.topsOn(r).length) return false; this.G.ui.toast('위에 올린 걸 먼저 내려 줘!', 'red'); this.G.audio.sfx('miss'); return true; }
  rotateSel() {
    const r = this.sel; if (!r || this.stackHeld(r)) return;
    for (let k = 1; k <= 8; k++) { const a = r.a + k * Math.PI / 4; if (this.room.canPlaceAt(r.type, r.x, r.z, a, r.id)) { this.room.moveFurnitureAt(r, r.x, r.z, ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)); this.syncRec(r); this.updFootprint(r.x, r.z, r.a, true); this.G.audio.sfx('swish'); this.G.persist(); return; } }
    this.G.ui.toast('돌릴 자리가 없어!', 'red');
  }
  storeSel() {
    const r = this.sel; if (!r || this.stackHeld(r)) return;
    for (const s of r.f.spots) if (s.item) this.removeItem(s.item.type);
    for (const t in this.items) { let on = false; for (let o = this.items[t].spot.anchor; o; o = o.parent) if (o === r.f.group) on = true; if (on) this.removeItem(t); }
    for (const p of r.f.parts) if (p.key) delete this.H.hide.locks[p.key];
    this.room.removeFurniture(r); this.room.fitParts();
    this.zone.furniture = this.zone.furniture.filter(f => f.id !== r.id);
    this.H.inventory.push(r.type);
    this.select(null);
    const idx = indexSpots(this.room); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    this.renderInv(); this.G.persist(); this.G.audio.sfx('pop', 2);
  }
  syncRec(r) { const f = this.zone.furniture.find(x => x.id === r.id); if (f) { f.x = +r.x.toFixed(3); f.z = +r.z.toFixed(3); f.a = +r.a.toFixed(4); f.i = r.i; f.j = r.j; f.rot = r.rot; } this.room.fitParts(); }
  dragStart(x, y) {
    if (this.mode === 'hide') {   // (숨기기: only the held thing moves; a hidden thing you drag is picked up first — the rest is the camera's)
      const d = holdDrag(this, x, y); if (d) return d;
      const hit = this.pick(x, y); if (hit.kind === 'item') { holdStart(this, hit.item.type, { x, y }); return holdDrag(this, x, y); }
      return null;
    }
    if (this.mode !== 'edit' || !this.sel) return null;
    const hit = this.pick(x, y);
    if (hit.kind !== 'furn' || hit.furn.rec !== this.sel) return null;
    if (this.stackHeld(this.sel)) return null;
    const r = this.sel, R = this.room, W = this.G.world, snap = v => Math.round(v * 4) / 4;
    const start = { x: r.x, z: r.z }, g0 = W.screenToGround(x, y, 0);
    let cur = { ...start, ok: true };
    return {
      move: (mx, my) => {
        const g = W.screenToGround(mx, my, 0); if (!g || !g0) return;
        const nx = clamp(snap(start.x + g.x - g0.x), -R.w / 2, R.w / 2), nz = clamp(snap(start.z + g.z - g0.z), -R.d / 2, R.d / 2);
        if (nx === cur.x && nz === cur.z) return;
        // (over a flat top a small piece goes up onto it — 가구 위에 올리기 10/20)
        const sp = R.stackSpot(r.type, nx, nz, r.a, r.id);
        cur = { x: nx, z: nz, ok: R.canPlaceAt(r.type, nx, nz, r.a, r.id), px: sp ? sp.x : nx, pz: sp ? sp.z : nz, y: sp ? sp.y : 0 };
        r.f.group.position.set(cur.px, cur.y + .15, cur.pz);
        this.updFootprint(cur.px, cur.pz, r.a, cur.ok, cur.y); this.G.audio.sfx('tap');
      },
      end: () => {
        if (cur.ok && (cur.x !== start.x || cur.z !== start.z)) { R.moveFurnitureAt(r, cur.px ?? cur.x, cur.pz ?? cur.z, r.a); this.syncRec(r); this.G.audio.sfx(r.on ? 'pop' : 'place', r.on ? 3 : undefined); this.G.persist(); }
        else { R.moveFurnitureAt(r, start.x, start.z, r.a); if (!cur.ok) this.G.ui.toast('거긴 놓을 수 없어', 'red'); }
        this.updFootprint(r.x, r.z, r.a, true, r.y || 0);
      },
      cancel: () => { R.moveFurnitureAt(r, start.x, start.z, r.a); this.updFootprint(r.x, r.z, r.a, true); },   // (back where it was — QA3 10/19)
    };
  }
  // hide mode: drag something you hid onto any other surface
  dragItem(x, y) {
    const hit = this.pick(x, y);
    if (hit.kind !== 'item') return null;
    const it = hit.item, type = it.type, W = this.G.world, R = this.room;
    let cur = null;
    return {
      move: (mx, my) => {
        const s = pickSurface(W, R, mx, my, it.g);
        if (!s || s.side || (s.part && s.part.t < .5)) return;
        cur = s;
        R.group.add(it.g); it.g.position.copy(R.group.worldToLocal(s.point.clone())); it.g.visible = true;
      },
      end: async () => {
        if (!cur) return;
        const ok = await this.freePlace(cur, type, true);
        if (!ok) { this.build(); this.setMode('hide'); }   // the record never changed: show it where it still is
      },
      cancel: () => { if (cur) { this.build(); this.setMode('hide'); } },
    };
  }
  // put one saved hiding record back into the room (after a refused move)
  restoreItem(e) {
    if (e.free) {
      const host = resolveHost(this.room, e.free.host, this.partByKey, e.free.part);
      if (host) this.putItem(e.item, makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0));
    } else { const s = this.spotByKey[e.spot]; if (s && !s.item) this.putItem(e.item, s); }
  }
  // hide `type` on a surface picked with pickSurface(); refuses places nobody could ever see
  async freePlace(s, type = this.selItem, moving = false, ryWant = null) {
    const G = this.G, hid = this.H.hide;
    if (!type) return false;
    if ((type === 'key' || type === 'note') && s.part && hid.locks[s.part.key]) { G.ui.toast('잠근 곳 안에 열쇠를 넣으면 못 열어!', 'red'); return false; }
    const isTarget = type !== 'key' && type !== 'note';
    if (isTarget && !this.items[type] && this.targetCount() >= MAX_HIDE) { G.ui.toast(`한 번에 ${MAX_HIDE}개까지 숨길 수 있어`, 'red'); return false; }
    const prevAt = hid.items.findIndex(e => e.item === type), prev = prevAt >= 0 ? hid.items[prevAt] : null;
    if (this.items[type]) this.removeItem(type);
    const local = toLocal(s, s.point), ry = +((ryWant ?? (Math.random() - .5) * 1.2)).toFixed(2);
    const it = this.putItem(type, makeFreeSpot(s, local, ry));
    if (!viewsOf(G.world, this.room, it)) {
      this.removeItem(type); G.audio.sfx('miss');
      if (prev) { hid.items.splice(prevAt, 0, prev); this.restoreItem(prev); }   // the old place stays
      G.ui.toast('여긴 아무도 못 찾아! 조금이라도 보이는 곳에 둬', 'red');
      return false;
    }
    const rec = { item: type, free: { host: s.key, ...(s.via ? { part: s.via } : {}), p: [local.x, local.y, local.z].map(v => +v.toFixed(3)), ry } };
    if (prev) hid.items.splice(prevAt, 0, rec); else hid.items.push(rec);
    G.persist(); G.audio.sfx('place');
    const sp = G.world.toScreen(s.point);
    G.world.fx.burst(sp.x, sp.y, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 });
    G.ui.floatText(sp.x, sp.y - 30, s.label || '여기', '');
    if (!moving) {
      const placed = new Set(hid.items.map(e => e.item));
      this.selItem = [...this.chainNeeded(), ...G.save.collection].find(x => !placed.has(x)) || null;
      this.hand?.drop(sp.x, sp.y); setTimeout(() => !this.dead && this.heldShow(true), 450);   // (손에서 그 자리로, 그다음 것이 크게)
    }
    this.renderHideCards();
    return true;
  }

  // ── hide & publish
  hideHud() {
    const G = this.G, ui = G.ui, hid = this.H.hide;
    // (10/19 night, 털기 회귀: the zone-switch toast sat on the hint bar and both were unreadable — the bar says it for a moment instead)
    let zoneMsg = null;
    if (hid.zoneId !== this.zoneId) {
      // one room is the hide-and-seek room at a time; the other rooms keep their own draft until you come back
      const drafts = this.H.drafts || (this.H.drafts = {});
      if (hid.zoneId && (hid.items.length || Object.keys(hid.locks).length)) drafts[hid.zoneId] = { items: hid.items, locks: hid.locks, code: hid.code };
      const d = drafts[this.zoneId]; delete drafts[this.zoneId];
      if (hid.items.length && hid.zoneId) zoneMsg = `이제 ${this.zone.name}에 숨겨! 전에 숨긴 방은 저장해 뒀어`;
      hid.zoneId = this.zoneId; hid.items = d?.items || []; hid.locks = d?.locks || {}; if (d?.code) hid.code = d.code;
      G.persist();
      this.build();
    }
    const hintTxt = `목록에서 고르고, 드래그해서 숨겨요 · 최대 ${MAX_HIDE}개`, hintSpan = h('span', {}, zoneMsg || hintTxt);
    this.col.append(h('div', { class: 'hint' }, hintSpan));
    if (zoneMsg) setTimeout(() => { if (!this.dead) hintSpan.textContent = tr(hintTxt); }, 2600);
    const tut = G.save.tut || (G.save.tut = {});
    if (!tut.raidTip && !this.busyTut) { tut.raidTip = 1; G.persist(); setTimeout(() => !this.dead && G.ui.toast('서랍 속·자물쇠 안일수록 동네 주민이 못 털어 가', ''), 900); }   // (not during the lobby's first hide: it sat on the hide tip — 2D UI 정리 ③)
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    this.lockRow = h('div', { class: 'btnrow' });
    bar.append(this.lockRow);
    this.pubBtn = ui.btn('방 올리기', { color: 'green', icon: 'share', onClick: dis => dis ? this.whyNot() : this.publish() });
    this.testBtn = ui.btn('내가 풀어보기', { color: 'blue', onClick: () => this.selfTest() });
    bar.append(h('div', { class: 'btnrow' }, this.testBtn, this.pubBtn));
    this.col.append(bar);
    this.selItem = null;
    this.renderHideCards();
    this.hand = null;   // (숨기기 = 가구 놓기처럼, 10/20: the list is the start — no big show; the thing picked is held in the room)
    this.markers = null;   // no round guide markers (user, 2026-10-15): tap a drawer to open it, then tap inside
  }
  chainNeeded() { return Object.values(this.H.hide.locks).map(k => k === 'pad' ? 'key' : 'note'); }
  // 손에 든 물건 (10/20): the thing picked to hide — big in the middle (big), then in the hand with how many so far
  heldShow(big) {
    const t = this.selItem, hand = this.hand; if (!hand?.alive || this.mode !== 'hide') return;
    const chain = t === 'key' || t === 'note', full = !chain && t && !this.items[t] && this.targetCount() >= MAX_HIDE;
    if (!t || full) { hand.done(full ? `${MAX_HIDE}개 다 숨겼어! 옮기려면 드래그해` : '다 숨겼어!'); return; }
    const k = Math.min(MAX_HIDE, this.targetCount() + (this.items[t] ? 0 : 1));
    hand.show(t, { name: ITEMS[t]?.name || '', label: chain ? '꼭 숨겨야 해' : `숨길 물건 ${k}/${MAX_HIDE}`, hint: '어디든 터치해서 숨겨!', count: chain ? '' : `${k}/${MAX_HIDE}`, big });
  }
  renderHideCards() {
    const G = this.G, hid = this.H.hide;
    this.cardsEl.innerHTML = '';
    const coll = G.save.collection;
    const placed = new Set(hid.items.map(e => e.item));
    const list = [...this.chainNeeded(), ...coll];
    if (!this.selItem) this.selItem = list.find(t => !placed.has(t));
    for (const t of list) {
      const e = hid.items.find(x => x.item === t), s = e && this.items[t]?.spot;   // fixed spots and free places alike
      this.cardsEl.append(h('div', { class: 'card' + (this.selItem === t ? ' sel' : '') + (s ? ' done' : ''), onclick: () => { this.selItem = t; G.audio.sfx('click'); holdStart(this, t); this.renderHideCards(); } },
        s ? h('div', { class: 'tag' }, '숨김') : null, h('img', { src: G.thumbs['item_' + t] }), h('div', {}, ITEMS[t].name), h('div', { style: 'font-size:11px;color:#9b6cff' }, s ? s.label : (t === 'key' || t === 'note') ? '꼭 숨겨야 해요' : '')));
    }
    this.cardsEl.append(h('div', { class: 'card lockedc', style: 'display:flex;align-items:center;justify-content:center;font-size:12px;min-height:110px' }, `스테이지에서 찾은 물건이 여기 모여요 (${coll.length}종)`));
    this.lockRow.innerHTML = '';
    const lockables = this.room.parts.filter(p => p.lockable && p.spots.some(s => s.item && this.items[s.item.type] === s.item && s.item.type !== 'key' && s.item.type !== 'note'));
    if (lockables.length) this.lockRow.append(h('span', { class: 'lockcount' }, `자물쇠 ${locksUsed(G.save)}/${locksOwned(G.save)}`));
    for (const p of lockables) {
      const on = !!hid.locks[p.key];
      this.lockRow.append(G.ui.btn(on ? `${p.label} 잠금 풀기` : `${p.label} 잠그기`, { color: on ? 'gray' : 'yellow', icon: 'lock', cls: 'sm', onClick: () => this.toggleLock(p) }));
    }
    const r = this.ready();
    this.pubBtn.classList.toggle('disabled', !r.ok); this.pubBtn.classList.toggle('pulse', r.ok);
  }
  targetCount() { return this.H.hide.items.filter(e => e.item !== 'key' && e.item !== 'note').length; }
  ready() {
    if (!this.targetCount()) return { ok: false, why: '먼저 물건을 하나 이상 숨겨 주세요' };
    // every record must still sit somewhere real (a free place with a sane position whose host still exists)
    for (const e of this.H.hide.items) {
      const bad = e.free ? !(Array.isArray(e.free.p) && e.free.p.length === 3 && e.free.p.every(v => Number.isFinite(v) && Math.abs(v) <= 20)) : false;
      if (bad || (this.items && !this.items[e.item])) return { ok: false, why: `${ITEMS[e.item]?.name || '물건'}을(를) 다시 놓아 주세요` };
    }
    for (const c of this.chainNeeded()) if (!this.H.hide.items.some(e => e.item === c)) return { ok: false, why: c === 'key' ? '열쇠도 다른 곳에 숨겨야 해요' : '비밀번호 쪽지도 숨겨야 해요' };
    if (this.stuckItems().length) return { ok: false, why: '열쇠나 쪽지가 잠긴 곳에 갇혀서 끝까지 못 찾아요' };
    return { ok: true };
  }
  // Play the room out the way a visitor would: the key opens every padlock, the note opens every code lock.
  // Anything still behind a closed lock at the end can never be reached.
  stuckItems() {
    const hid = this.H.hide, open = new Set(), have = {};
    const lockOf = e => { const p = e.free ? (e.free.part || (e.free.host.startsWith('p:') ? e.free.host.slice(2) : null)) : this.spotByKey[e.spot]?.part?.key; return p && hid.locks[p] ? p : null; };
    for (let changed = true; changed;) {
      changed = false;
      for (const e of hid.items) {
        if ((e.item === 'key' || e.item === 'note') && !have[e.item]) { const l = lockOf(e); if (!l || open.has(l)) { have[e.item] = true; changed = true; } }
      }
      for (const pk in hid.locks) if (!open.has(pk) && have[hid.locks[pk] === 'pad' ? 'key' : 'note']) { open.add(pk); changed = true; }
    }
    return hid.items.filter(e => { const l = lockOf(e); return l && !open.has(l); });
  }
  whyNot() { this.G.ui.toast(this.ready().why, 'red'); }
  toggleLock(p) {
    const G = this.G, hid = this.H.hide;
    if (hid.locks[p.key]) {
      const kind = hid.locks[p.key]; delete hid.locks[p.key];
      if (p.lockMesh) { p.lockMesh.parent?.remove(p.lockMesh); p.lockMesh = null; } p.lock = null;
      const c = kind === 'pad' ? 'key' : 'note';
      if (!this.chainNeeded().includes(c)) this.removeItem(c);
    } else {
      if (p.spots.some(s => s.item && (s.item.type === 'key' || s.item.type === 'note'))) { G.ui.toast('열쇠나 쪽지가 든 곳은 못 잠가', 'red'); G.audio.sfx('miss'); return; }
      if (locksUsed(G.save) >= locksOwned(G.save)) return askBuyLock(G, () => !this.dead && this.toggleLock(p));   // 자물쇠는 사서 써요 (털기 메타 10/19)
      const kind = p.furn.type === 'safe' ? 'code' : 'pad';
      hid.locks[p.key] = kind; hid.code = hid.code || String(100 + Math.floor(Math.random() * 900));
      p.furn.setLock(p, kind, hid.code);
      G.audio.sfx('unlock');
      this.selItem = kind === 'pad' ? 'key' : 'note';
      G.ui.toast(kind === 'pad' ? '잠갔어! 이제 열쇠를 다른 곳에 숨겨' : '잠갔어! 이제 비밀번호 쪽지를 다른 곳에 숨겨', 'green');
      G.world.idsDirty = true;
    }
    G.persist(); this.renderHideCards();
    this.heldShow(!!hid.locks[p.key]);   // (just locked: the key or the note comes up big — it must be hidden too)
  }
  async placeIn(place) {
    const t = this.selItem; if (!t) return;
    const def = ITEMS[t];
    const ok = s => def.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || def.flat);
    const s = place.spots.find(x => x.item?.type === t) || place.spots.find(x => !x.item && ok(x)) || place.spots.find(ok) || place.spots[0];
    await this.placeTreasure(s);
  }
  async placeTreasure(spot, ry = null) {
    const G = this.G, t = this.selItem, hid = this.H.hide;
    if (!t || !spot) return;
    const def = ITEMS[t];
    if (def.h * (spot.scale || 1) > spot.maxH + .001 || (spot.maxH < .1 && !def.flat)) { G.ui.toast('여긴 너무 좁아! 납작한 것만 들어가', 'red'); G.audio.sfx('miss'); return; }
    if ((t === 'key' || t === 'note') && spot.part && hid.locks[spot.part.key]) { G.ui.toast('잠근 곳 안에 열쇠를 넣으면 못 열어!', 'red'); return; }
    const isTarget = t !== 'key' && t !== 'note';
    if (isTarget && !this.items[t] && this.targetCount() >= MAX_HIDE) { G.ui.toast(`한 번에 ${MAX_HIDE}개까지 숨길 수 있어`, 'red'); return; }
    if (spot.item && spot.item.type !== t) this.removeItem(spot.item.type);
    if (this.items[t]) this.removeItem(t);
    const it = this.putItem(t, spot); if (ry != null) it.g.rotation.y = ry;
    hid.items.push({ item: t, spot: spot.key });
    G.persist(); G.audio.sfx('place');
    const sp = G.world.toScreen(this.room.spotWorld(spot));
    G.world.fx.burst(sp.x, sp.y, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 });
    G.ui.floatText(sp.x, sp.y - 30, spot.label, '');
    this.hand?.drop(sp.x, sp.y);   // (손에서 그 자리로)
    if (spot.part) { await this.openPart(spot.part, true); await this.tw.wait(.35); await this.openPart(spot.part, false); }
    const placed = new Set(hid.items.map(e => e.item));
    this.selItem = [...this.chainNeeded(), ...G.save.collection].find(x => !placed.has(x)) || null;
    this.renderHideCards();
    this.heldShow(true);
  }
  roomDoc() {
    const hid = this.H.hide;
    return {
      v: 2, title: this.zone.name, face: 'mong',
      zone: { type: this.zone.type, furniture: this.zone.furniture.map(f => ({ type: f.type, i: f.i, j: f.j, rot: f.rot, id: f.id, ...(f.x != null ? { x: f.x, z: f.z, a: f.a } : {}) })), paint: this.zone.paint || {},
        ...(this.zone.style ? { style: this.zone.style } : {}), ...(this.zone.size ? { size: this.zone.size } : {}) },
      hidden: hid.items.map(e => e.free ? { item: e.item, free: e.free } : { item: e.item, spot: e.spot }), locks: Object.entries(hid.locks).map(([part, kind]) => ({ part, kind })), code: hid.code || '000',
      count: this.targetCount(),
    };
  }
  // 내가 풀어보기: play my own room exactly as a visitor would — no coins, no stats — then come back to fix it
  selfTest() {
    if (this.held) holdCancel(this, true);   // (QA9: a thing still in your hand went missing from the room you test)
    const r = this.ready(); if (!r.ok) return this.whyNot();
    this.G.persist();
    this.G.go('stage', { custom: { ...this.roomDoc(), id: 'self-' + this.zoneId, practice: true, selfTest: true, nick: '나', title: this.zone.name, back: this.zoneId } });
  }
  async publish() {
    const G = this.G, H = this.H, hid = H.hide;
    if (this.held) holdCancel(this, true);   // (QA9: … and from the room you put up)
    const r = this.ready(); if (!r.ok) return this.whyNot();
    const doc = this.roomDoc();
    const bad = validateRoom(doc);
    if (bad) { G.ui.toast('방 정보가 이상해서 올리지 못했어요: ' + bad, 'red'); G.audio.sfx('miss'); return; }
    if (this._publishing) return;
    this._publishing = true;
    G.ui.toast('방을 올리는 중…', '');
    await initNet();
    const res = await publishRoom(doc);
    this._publishing = false;
    const keepOn = G.ui.btn('계속 꾸미기', { color: 'blue', cls: 'sm', onClick: () => { G.ui.closePanel(); this.setMode('view'); } });
    if (res.ok || res.why === 'offline') {
      // the published copy changes only once it really went somewhere
      H.published = { zoneId: this.zoneId, at: Date.now(), count: doc.count, online: !!res.ok };
      H.publishedDoc = doc;
      G.persist();
    }
    if (this.dead) return;   // (the answer came after you left — QA3 10/19)
    if (res.ok) {
      G.audio.sfx('win'); G.world.fx.confetti(70);
      G.ui.panel({ title: '방을 올렸어요!', color: 'green', body: [
        h('div', { class: 'big-txt' }, `${this.zone.name} · 숨긴 물건 ${doc.count}개`),
        h('div', { class: 'txt' }, '이 게임을 여는 다른 사람들이 내 방에 찾으러 와요. 못 찾고 돌아가면 보상을 받아요!'),
      ], buttons: [keepOn, G.ui.btn('놀러 가기', { color: 'green', icon: 'play', onClick: () => G.go('visit') })] });
    } else if (res.why === 'offline') {
      G.audio.sfx('place');
      G.ui.panel({ title: '이 기기에 저장했어요', color: 'blue', body: [
        h('div', { class: 'big-txt' }, `${this.zone.name} · 숨긴 물건 ${doc.count}개`),
        h('div', { class: 'txt' }, '지금은 연습 모드라 다른 사람에게는 아직 안 보여요. 공유된 Claude 링크로 열면 다른 사람이 찾으러 올 수 있어요.'),
      ], buttons: [keepOn, G.ui.btn('놀러 가기', { color: 'green', icon: 'play', onClick: () => G.go('visit') })] });
    } else {
      G.audio.sfx('miss');
      G.ui.panel({ title: '올리지 못했어요', color: 'red', body: [
        h('div', { class: 'txt' }, res.why === 'permission-denied' ? '이 링크에서는 방을 올릴 권한이 없어요.' : '연결이 잠깐 불안정했어요.'),
        h('div', { class: 'txt' }, H.published ? '전에 올린 방은 그대로 있어요.' : '숨긴 물건과 배치는 이 기기에 그대로 있어요.'),
      ], buttons: [keepOn, G.ui.btn('다시 올리기', { color: 'green', onClick: () => { G.ui.closePanel(); this.publish(); } })] });
    }
  }
  async openPart(part, open) {
    const W = this.G.world;
    if (part.busy) return;
    part.busy = true;
    if (open) { part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); this.G.audio.sfxPart(part, part.sfx); }
    else this.G.audio.sfxPart(part, part.kind === 'drawer' ? 'drawerClose' : 'close');
    const a = part.t, b = open ? 1 : 0;
    await this.tw.run(part.dur, k => { part.setOpen(a + (b - a) * k); W.shadowDirty = true; }, open ? ease.outBack : ease.inOutQuad);
    if (!open) part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; });
    part.busy = false;
    if (!open) messShut(this, part);   // (털린 흔적: 탁! — the last one pays)
  }
  hidePlaces() {
    const places = [], seen = new Set();
    for (const s of this.room.spots) {
      if (s.furn.wall && this.room.walls[s.furn.rec.wall]?.down) continue;
      // open surfaces need no marker any more (tap anywhere); only things that open get one
      if (s.part && !s.free) { if (seen.has(s.part)) continue; seen.add(s.part); places.push({ key: s.part, spots: s.part.spots.filter(q => !q.free), inside: true, pos: () => this.partCenter(s.part) }); }
    }
    return places;
  }
  partCenter(part) { const b = new THREE.Box3(); part.pivots.forEach(p => b.expandByObject(p)); return b.getCenter(new THREE.Vector3()); }
  updMarkers() {
    const W = this.G.world, want = new Set();
    for (const pl of this.hidePlaces()) {
      want.add(pl.key);
      let m = this.markers.get(pl.key);
      if (!m) {
        m = h('div', { class: 'mk' + (pl.inside ? ' inside' : '') });
        m.addEventListener('pointerdown', e => e.stopPropagation());
        m.addEventListener('pointerup', e => { e.stopPropagation(); this.placeIn(m._pl); });
        this.G.ui.wui.append(m); this.markers.set(pl.key, m);
      }
      m._pl = pl;
      const usedIt = pl.spots.map(s => s.item).find(it => it && this.items[it.type] === it);
      const sig = usedIt ? usedIt.type : '';
      if (m._sig !== sig) { m._sig = sig; m.classList.toggle('used', !!usedIt); m.innerHTML = usedIt ? `<img src="${this.G.thumbs['item_' + usedIt.type]}" style="width:28px;height:28px">` : ''; }
      const p = W.toScreen(pl.pos());
      m.style.left = p.x + 'px'; m.style.top = p.y + 'px';
    }
    for (const [k, m] of this.markers) if (!want.has(k)) { m.remove(); this.markers.delete(k); }
  }

  // ── taps
  pick(x, y) {
    const hits = this.G.world.pick(x, y, [this.room.group]);
    for (const hh of hits) {
      for (let o = hh.object; o; o = o.parent) {
        const u = o.userData;
        if (u.item) return { kind: 'item', item: u.item };
        if (u.char) return { kind: 'char', char: u.char };
        if (u.part && this.mode !== 'edit') return { kind: 'part', part: u.part };
        if (u.furn) return { kind: 'furn', furn: u.furn };
        if (u.wall || u.floor) return { kind: 'floor' };
      }
    }
    return { kind: 'none' };
  }
  tap(x, y) {
    const G = this.G, hit = this.pick(x, y);
    if (hit.kind === 'char') { this.reactChar(hit.char); return; }
    // the 넓히기 sign (방 넓히기): its card
    if (this.growSign && ['view', 'edit', 'lobby'].includes(this.mode) && !this.busyTut && !G.ui.panelOpen && this.growAt(x, y)) { if (this.growSign.house) this.houseCard(); else this.growCard(); return; }
    // a tap on another room of the map: work there now (꾸미기: and the piece under the finger is picked up as well)
    if (hit.kind === 'none' && ['view', 'edit', 'hide'].includes(this.mode) && !this.busyTut && !G.ui.panelOpen) {
      const nb = this.nbAt(x, y);
      if (nb && G.zoneOpen(nb)) { this.switchZone(nb); G.ui.toast(HOME_ZONES.find(z => z.id === nb)?.name || '', ''); if (this.mode === 'edit' && this.zoneId === nb) this.tap(x, y); return; }
    }
    if (this.mode === 'edit') { if (hit.kind === 'furn' && !hit.furn.wall) this.select(hit.furn.rec); else this.select(null); return; }
    if (this.mode === 'hide') {
      // 숨기기 = 가구 놓기처럼 (10/20): a tap never hides — pick from the list, drag, [여기 숨기기]. A hidden thing tapped is picked up.
      if (hit.kind === 'item' && hit.item.type) { holdStart(this, hit.item.type); this.selItem = hit.item.type; this.renderHideCards(); return; }
      if (hit.kind === 'part' && !hit.part.lock) { this.openPart(hit.part, hit.part.t < .5); return; }
      if (hit.kind === 'part' && hit.part.lock) { G.audio.sfx('locked'); return; }
      return;
    }
    if (hit.kind === 'part' && !hit.part.lock) this.openPart(hit.part, hit.part.t < .5);
    else if (hit.kind === 'part' && hit.part.lock) G.audio.sfx('locked');
  }
  reactChar(ch) {
    const G = this.G;
    if (ch.react) { const r = ch.react(this.tw, (n, p) => G.audio.sfx(n, p)); if (r.line) this.say(ch, r.line); return; }
    ch.bump(.4); G.audio.sfx('giggle');
  }
  say(ch, text, ms = 1300) {
    // a long line (English) wraps instead of running off the screen, and the bubble stays inside the screen
    const b = h('div', { class: 'bubble pop', style: 'white-space:normal;width:max-content;max-width:min(300px,calc(100vw - 32px));text-align:center' }, text);
    this.G.ui.wui.append(b);
    const upd = () => {
      const p = this.G.world.toScreen(V.copy(ch.root.getWorldPosition(new THREE.Vector3())).setY(ch.root.position.y + ch.headTop() + .2));   // (+ y: up on a seat)
      const hw = b.offsetWidth / 2, W = b.parentElement?.clientWidth || innerWidth;
      b.style.left = clamp(p.x, 16 + hw, Math.max(16 + hw, W - 16 - hw)) + 'px'; b.style.top = p.y + 'px';
    };
    upd(); const iv = setInterval(upd, 30);
    setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
  }
  update(dt) {
    this.tw.update(dt);
    this.room.update(dt);
    for (const n of this.nbs || []) n.room.update(dt);
    this.growTick(dt);   // (방 넓히기: the patch on the floor's front side, its arrows and chip)
    this.mong.update(dt);
    this.visitors?.update(dt);
    if (this.mode === 'hide' && this.markers) this.updMarkers();
    this._ht = (this._ht || 0) + dt; holdTick(this, this._ht);
    if (this.ftool && this.sel) {
      const b = new THREE.Box3().setFromObject(this.sel.f.group);
      const p = this.G.world.toScreen(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .1, (b.min.z + b.max.z) / 2));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  botStep(dt) {
    this._bt = (this._bt || 0) + dt; if (this._bt < 1) return; this._bt = 0;
    if (this.mode === 'view') this.setMode('hide');
    else if (this.mode === 'hide') {
      if (this.targetCount() < Math.min(3, this.G.save.collection.length)) {
        const t = this.G.save.collection.find(x => !this.items[x]);
        const free = this.room.spots.filter(s => !s.item && ITEMS[t].h <= s.maxH && (s.maxH >= .1 || ITEMS[t].flat));
        this.selItem = t; this.placeTreasure(free[Math.floor(Math.random() * free.length)]);
      } else if (!this._pub) { this._pub = true; this.publish(); }
    }
  }
  state() { return { scene: 'myhome', zone: this.zoneId, mode: this.mode, hidden: this.targetCount() }; }
}

// a room that's gone: its own shapes and textures go back (the shared, cached shapes stay; anything the new room still
// uses stays too, so a rebuild after placing a piece re-uploads nothing). Materials stay, as in kit.js disposeTree.
function freeRoom(root, keepRoot = null) {
  const keepG = cachedGeos(), keepT = new Set([STYLE.grad]);
  for (const kr of [].concat(keepRoot || [])) kr.traverse(o => { if (o.geometry) keepG.add(o.geometry); for (const m of [].concat(o.material || [])) for (const k in m) if (m[k]?.isTexture) keepT.add(m[k]); });
  const doneG = new Set(), texs = new Set();
  root.traverse(o => {
    if (o.geometry && !keepG.has(o.geometry) && !doneG.has(o.geometry)) { doneG.add(o.geometry); o.geometry.dispose(); }
    for (const m of [].concat(o.material || [])) for (const k in m) if (m[k]?.isTexture && !keepT.has(m[k])) texs.add(m[k]);
  });
  for (const t of texs) t.dispose();
  forgetMats(texs);   // (QA3-tex11: the material cache let go of them too — they kept their canvases alive)
}
