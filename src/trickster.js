// 말썽이 (user, 2026-10-17: "캐릭터 새로 만들어서 돌발 캐릭터… 장난꾸러기처럼"). Once in some stages, partway through, a
// prankster hops in from the edge, runs to a thing you haven't found yet, grabs it and hides it somewhere else, giggles
// and runs off. While it carries the thing, tap it: caught! — the thing is yours at once. Stage-only; never in a
// tutorial, a timed stage, a boss or someone's published room.
import * as THREE from 'three';
import { Char } from './gfx/chars.js';
import { walkGrid, gridPath, nearestTile } from './companion.js';
import { ITEMS } from './gfx/items.js';
import { ease } from './util.js';

const V = new THREE.Vector3();

// does this stage get a visit, and when (seconds of play or finds, whichever comes first)?
export function tricksterFor(stage) {
  const sp = stage.spec;
  if (stage.custom || stage.preview || sp.tut || sp.timed || sp.boss || sp.gray || stage.idx < 12 || sp.intro) return null;   // (1장은 한 번에 하나씩 배우는 장이라 말썽이는 2장부터, 장 첫 판(새 자물쇠 배우는 판)도 빼고 — QA N12, 레벨 세션 10/19)
  if ((stage.idx * 7 + 3) % 3) return null;   // about one stage in three
  return { at: 14 + (stage.idx % 4) * 4, finds: 2 };
}

export class Trickster {
  constructor(stage) { this.S = stage; this.state = 'wait'; this.ch = null; this.carry = null; }
  // called every frame by the stage
  update(dt) {
    const S = this.S;
    if (this.state === 'wait') {
      if (!S.running || S.result || S.paused) return;
      const plan = this.plan || (this.plan = tricksterFor(S));
      if (!plan) { this.state = 'off'; return; }
      if ((S.t - (S.tStart || 0)) >= plan.at || S.found >= plan.finds) this.start();
      return;
    }
    if (this.ch) { this.ch.update(dt); if (this.carry) { const p = this.ch.root.position; this.carry.g.position.set(p.x, p.y + this.ch.headTop() + .12, p.z); } }
  }
  // something it can grab: unfound, out in the open (not in a closed or locked part), and a body can stand near it
  pickVictim() {
    const S = this.S;
    return S.targets.filter(it => !it.found && !it.furnTarget && !it.friend && it.g?.parent && !(it.spot.part && (it.spot.part.t < .5 || it.spot.part.lock)))
      .map(it => ({ it, c: S.worldCenter(it) })).sort((a, b) => a.c.y - b.c.y)[0] || null;
  }
  // a new place: open, empty, fits, far from where it was, not in anything locked
  pickSpot(it, from) {
    const S = this.S, ok = s => !s.item && !(s.part && (s.part.lock || s.part.t < .5)) && (s.kind === 'on' || s.kind === 'under' || s.kind === 'behind')
      && ITEMS[it.type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[it.type].flat);
    const c = S.room.spots.filter(ok).map(s => ({ s, d: s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(from) })).filter(o => o.d > 1.6);
    c.sort((a, b) => a.d - b.d);
    return c[Math.min(c.length - 1, Math.floor(c.length * .4))]?.s || null;
  }
  async start() {
    const S = this.S, G = S.G, W = G.world;
    const v = this.pickVictim(); if (!v) { this.state = 'off'; return; }
    const tiles = this.tiles = S.hero?.tiles || walkGrid(S.room.rooms || [S.room]);
    if (!tiles.length) { this.state = 'off'; return; }
    const goalT = nearestTile(tiles, v.c.x, v.c.z);
    // in from the tile farthest from the thing
    const startT = tiles.reduce((a, t) => (Math.hypot(t.x - v.c.x, t.z - v.c.z) > Math.hypot(a.x - v.c.x, a.z - v.c.z) ? t : a), tiles[0]);
    const route = gridPath(startT, goalT); if (!route) { this.state = 'off'; return; }
    this.state = 'run';
    const ch = this.ch = new Char('trickster');
    ch.root.position.set(startT.x, (startT.y || 0) + 2.5, startT.z); W.root.add(ch.root); W.idsDirty = true;
    G.audio.sfx('whoosh');
    await S.tw.run(.35, k => { ch.root.position.y = (startT.y || 0) + 2.5 * (1 - k) * (1 - k); }, ease.linear);
    if (this.gone()) return;
    // a surprise should be seen: the camera swings over to it for a moment
    // (and back to where you were when it's gone, unless you moved the view yourself meanwhile — Codex QA 10/17)
    this.view0 = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom, target: W.target.clone() };
    this.shot = { target: new THREE.Vector3(startT.x, (startT.y || 0) + .4, startT.z), zoom: Math.max(W.zoom, 1.7) };
    W.flyTo(S.tw, { ...this.shot, dur: .45 });
    S.say(ch, '히히! 이건 내 거~', 1400);
    G.ui.toast('앗! 말썽이가 나타났다! 톡 해서 잡아라!', 'red');
    if (!await this.walk(route)) return;
    // grab
    const it = v.it; if (it.found || this.gone()) return this.leave();
    this.carry = it; it.spot.item = null; it.carried = true;
    W.root.attach(it.g); G.audio.sfx('lift'); S.say(ch, '내 거다~! 잡아 봐라~', 2600);
    const dest = this.pickSpot(it, v.c);
    if (!dest) return this.drop(it.spot), this.leave();
    const dp = dest.anchor.getWorldPosition(new THREE.Vector3()), dt = nearestTile(tiles, dp.x, dp.z);
    const r2 = gridPath(goalT, dt) || [];
    if (!await this.walk(r2)) return;
    if (it.found) return this.leave();
    this.drop(dest);
    S.say(ch, '여기 숨겨야지~ 히히', 1300);
    G.ui.toast(`말썽이가 ${ITEMS[it.type].name}을(를) 다른 데 숨겼어!`, '');
    await S.tw.wait(.6);
    this.leave();
  }
  gone() { return this.S.dead || this.S.result || this.state === 'off'; }
  async walk(route) {
    for (const t of route.slice(0, 40)) {
      while (this.S.paused && !this.gone()) await this.S.tw.wait(.1);   // (the pause menu, a close-up or a lock dial: it waits too — QA 10/18)
      if (this.gone() || this.state !== 'run') return false;
      const p = this.ch.root.position, y0 = p.y, y1 = t.y || 0;
      if (y1 !== y0) this.S.tw.run(.17, k => { p.y = y0 + (y1 - y0) * k; });
      await this.ch.hopTo(this.S.tw, t.x, t.z, { height: .2, dur: .26 });   // quick little hops: catchable
    }
    return !this.gone() && this.state === 'run';
  }
  drop(spot) {
    const it = this.carry; if (!it) return;
    this.carry = null; it.carried = false;
    spot.anchor.add(it.g); it.g.position.set(0, 0, 0); it.g.rotation.set(0, Math.random() * 6.28, 0);
    it.spot = spot; spot.item = it; spot.itemGroup = it.g;
    this.S.G.world.idsDirty = true;
  }
  async leave() {
    if (!this.ch || this.state === 'off') return;
    this.state = 'leave';
    const S = this.S, ch = this.ch, p = ch.root.position, y0 = p.y;
    await S.tw.run(.45, k => { p.y = y0 + 3 * k * k; ch.root.rotation.y += .3; }, ease.linear);
    const W = S.G.world, v = this.view0, sh = this.shot; this.view0 = null;
    if (v && sh && !S.dead && W.target.distanceTo(sh.target) < 1.2 && Math.abs(W.zoom - sh.zoom) < .25) W.flyTo(S.tw, { ...v, dur: .5 });
    this.dispose();
  }
  // the player tapped it
  async caught() {
    const S = this.S, G = S.G, W = G.world, it = this.carry;
    if (this.state !== 'run') return false;
    this.state = 'caught';
    G.audio.sfx('special'); G.hitstop(.06);
    const s = W.toScreen(V.copy(this.ch.root.position));
    W.fx.burst(s.x, s.y, { n: 20, shape: 'star', colors: ['#ffe14d', '#b9a2ff', '#ffffff'] });
    S.say(this.ch, '으앙 들켰다!', 1100);
    // met (for the card book) and a little reward
    const met = G.save.met || (G.save.met = {}); if (!met.trickster) { met.trickster = Date.now(); G.persist(); }
    G.addCoins(15);
    G.ui.toast(it ? '말썽이를 잡았다! 돌려받았어 (+15 코인)' : '말썽이를 잡았다! (+15 코인)', 'green');
    if (it) { this.carry = null; it.carried = false; S.onFound(it); }
    await S.tw.wait(.5);
    this.state = 'run'; await this.leave();
    return true;
  }
  dispose() { this.state = 'off'; if (this.ch) { this.ch.root.parent?.remove(this.ch.root); this.ch = null; this.S.G.world.idsDirty = true; } }
}
