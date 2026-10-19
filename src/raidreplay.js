// ① 털림 다시 보기 + 복수하러 가기 (내 집 지키기·털기 메타, 10/19 — Clash's defence replay; user: "클래시옵클랜처럼 숨기고
// 공격하는걸… 딱 아 이거구나 싶게"). Back home, the news says who came; [다시 보기] plays it in my own room: the resident
// sneaks in, sniffs where I hid things, opens drawers, rattles a padlock that holds ("자물쇠가 막았다!"), walks right past
// things it never noticed ("안 들킴!"), and runs off with the one it took. Then the tally and [복수하러 가기] straight to
// that resident's house (② 정찰). The raid is still raid.js raidOnce's dice; this only plays back its record (ev.rp).
import * as THREE from 'three';
import { Char } from './gfx/chars.js';
import { buildItem, ITEMS } from './gfx/items.js';
import { attachItem } from './room.js';
import { resolveHost, makeFreeSpot, dropFreeSpot } from './freehide.js';
import { h } from './ui.js';
import { practiceRooms } from './net.js';
import { stolenBy, residentId } from './raid.js';
import { setScoutList } from './raidrun.js';
import { makePractice } from './scenes/visit.js';

const V = new THREE.Vector3();
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const pick = a => a[Math.floor(Math.random() * a.length)];
const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 2 ? '방금' : m < 60 ? `${m}분 전` : `${Math.round(m / 60)}시간 전`; };

// can this scene play it: my room (내 집 or the 내 방 lobby) with the record
export const canReplay = (S, ev) => !!(ev?.rp?.items?.length && S?.room && S.spotByKey && S.partByKey && S.openPart);

// 복수하러 가기: that resident's house, scouted first (the list for 다음 집 is the neighbourhood, robbers first)
export function goRevenge(G, who) {
  const list = practiceRooms((r, i) => makePractice(r, i, stolenBy(G.save, residentId(i))));
  list.sort((a, b) => (b.stolen?.length || 0) - (a.stolen?.length || 0));
  setScoutList(list);
  const room = list.find(r => r.id === who);
  if (room) G.go('stage', { custom: room, scout: true }); else G.go('visit');
}

// how it went, from the record: things never found, the ones a lock kept, the one taken
function tally(S, ev) {
  const rp = ev.rp, partOf = e => e.free ? e.free.part || (e.free.host?.startsWith?.('p:') ? e.free.host.slice(2) : null) : S.spotByKey[e.spot]?.part?.key;
  const kept = rp.items.filter(e => !e.found), byLock = kept.filter(e => { const k = partOf(e); return k && rp.locks[k]; });
  const left = rp.items.filter(e => e.found && e.item !== ev.item).length;   // found, but a raid takes one thing
  return { kept: kept.length, byLock: byLock.length, left, total: rp.items.length };
}

export async function playRaidReplay(S, ev) {
  const G = S.G, W = G.world, tw = S.tw, rp = ev.rp;
  if (S.replaying || !canReplay(S, ev)) return;
  S.replaying = true;
  if (rp.zone && rp.zone !== S.zoneId && G.zoneOpen(rp.zone)) S.switchZone(rp.zone);
  // the stage: no buttons, no 몽글이 (you were out), the whole room in view
  if (S.col) S.col.style.visibility = 'hidden';
  const away = [S.mong, ...(S.seated || []).map(s => s.ch)].filter(Boolean); for (const c of away) c.root.visible = false;
  S.busyTut = true; S.visitors?.drop();
  const joy0 = W.joyHidden; W.joyHidden = true;
  const look = W.home.clone(); look.y += .7;   // (a raised look-at point sits the room lower on the screen, under the bar)
  W.flyTo(tw, { target: look, zoom: 1.1, dur: .6 });
  let skip = false;
  const bar = h('div', { class: 'rpbar' }, h('img', { src: G.thumbs['face_' + ev.face] || G.thumbs.face_mong }),
    h('div', { class: 'rpt' }, h('b', {}, '다시 보기'), h('span', {}, `${ago(ev.at)} · ${ga(ev.nick)} ${ev.revenge ? '복수하러 왔어' : '몰래 왔어'}`)),
    G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => { skip = true; } }));
  G.ui.hud.append(bar);
  // the things as they were: what's still hidden is in place; the taken one (gone since) goes back just for the replay
  const temps = [], visits = [], shut = new Set(), hiddenReal = [];
  for (const e of rp.items) {
    let it = S.items[e.item];
    if (!it) {
      let spot = null;
      if (e.free) { const host = resolveHost(S.room, e.free.host, S.partByKey, e.free.part); if (host && Array.isArray(e.free.p)) spot = makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0); }
      else spot = S.spotByKey[e.spot];
      if (!spot || spot.item) continue;
      const g = buildItem(e.item, { code: S.H.hide.code || '000' });
      attachItem(spot, g, { rotY: .3 });
      if (spot.part && spot.part.t < .5) g.visible = false;
      it = { type: e.item, spot, g }; spot.item = it; temps.push(it);
    }
    const part = it.spot.part || null;
    visits.push({ e, it, part, locked: !!(part && rp.locks[part.key]) });
  }
  const taken = ev.kind === 'steal' ? visits.find(v => v.e.item === ev.item) : null;
  const misses = visits.filter(v => !v.e.found).sort(() => Math.random() - .5);
  const seq = [...misses.filter(v => v.locked).slice(0, 1), ...misses.filter(v => !v.locked)].slice(0, taken ? 3 : 4);
  if (taken) seq.push(taken);
  // the resident
  const ch = new Char(ev.face), room = S.room;
  const door = room.doorDecor ? room.frontOf(room.doorDecor.f) : null, [ex, ez] = door ? [door.x, door.z] : [-1.9, 2.1];
  ch.root.position.set(ex, 0, ez); ch.root.scale.setScalar(.01); ch.pose = 'search'; ch.setFace('sus');
  room.group.add(ch.root); W.idsDirty = true;
  S.update = dt => { Object.getPrototypeOf(S).update.call(S, dt); ch.update(dt); };   // (this scene's own update, plus the resident)
  const live = () => !S.dead && !skip;
  const local = g => room.group.worldToLocal(g.getWorldPosition(V.set(0, 0, 0)).clone());
  const stand = v => {
    const f = v.it.spot.furn;
    if (f?.rec && f.group) { const p = room.frontOf(f); return [p.x, p.z]; }
    const p = local(v.it.g), k = .55 / Math.max(.01, Math.hypot(p.x, p.z));
    return [p.x - p.x * k, p.z - p.z * k];
  };
  const walk = async (x, z, fast = false) => {
    const c = ch.root.position, route = S.visitors?.route(c.x, c.z, x, z) || [[x, z]];
    let ax = c.x, az = c.z;
    for (const [bx, bz] of route) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / .42));
      for (let i = 1; i <= n && live(); i++) await ch.hopTo(tw, ax + (bx - ax) * i / n, az + (bz - az) * i / n, { height: .18, dur: fast ? .16 : .25 });
      ax = bx; az = bz;
    }
  };
  const floatAt = (g, text, cls) => { const s = W.toScreen(g.getWorldPosition(new THREE.Vector3())), m = Math.min(120, innerWidth / 3); G.ui.floatText(Math.max(m, Math.min(innerWidth - m, s.x)), s.y - 40, text, cls); };   // (kept on screen: a thing by the edge)
  G.audio.sfx('pop', 6);
  await tw.run(.3, k => ch.root.scale.setScalar(Math.max(.01, k)));
  if (S.dead) return;
  S.say(ch, ev.revenge ? '복수하러 왔지롱!' : '쉿… 아무도 없지?', 1400);
  await tw.wait(1.2);
  let carry = null;
  for (const v of seq) {
    if (!live()) break;
    const [sx, sz] = stand(v);
    await walk(sx, sz);
    if (!live()) break;
    const p = local(v.it.g); ch.faceTo(p.x, p.z); ch.pose = 'search'; ch.setFace('sus');
    S.say(ch, pick(['킁킁…', '여기 수상한데?', '어디 보자…']), 1000);
    await tw.wait(.95); if (!live()) break;
    if (v.locked && v === taken) {   // a padlock that didn't hold (the dice: rare, never zero) — picked, then opened
      G.audio.sfx('locked'); ch.setFace('sus'); S.say(ch, '어디 보자… 딸깍!', 1200);
      await tw.wait(1.2); if (!live()) break;
      G.audio.sfx('unlock'); floatAt(v.it.g, '자물쇠를 땄어!', 'red big');
      await tw.wait(.5); if (!live()) break;
    } else if (v.locked) {   // a padlock that holds
      G.audio.sfx('locked'); const fg = v.part.furn.group, x0 = fg.position.x;
      await tw.run(.45, k => { fg.position.x = x0 + Math.sin(k * Math.PI * 8) * .03 * (1 - k); }); fg.position.x = x0;
      ch.setFace('angry'); S.say(ch, '잠겼잖아!', 1200); floatAt(v.it.g, '자물쇠가 막았다!', 'green big');
      await tw.wait(1.2); continue;
    }
    if (v.part && v.part.t < .5) { await S.openPart(v.part, true); shut.add(v.part); v.it.g.visible = true; }
    if (!live()) break;
    if (v === taken) {   // found: up it comes, and off they go with it
      ch.setFace('wow'); ch.pose = 'cheer'; S.say(ch, '찾았다!', 1000); G.audio.sfx('found', 3);
      const g = v.it.g, s0 = g.scale.x;
      await tw.run(.35, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .5)));
      g.visible = false; if (!temps.includes(v.it)) hiddenReal.push(g);
      carry = buildItem(v.e.item, { code: S.H.hide.code || '000' }); carry.position.set(0, ch.headTop() * .5, .3); carry.scale.setScalar(1.3); ch.root.add(carry);   // (held out in front: a bubble over the head would hide it)
      ch.setFace('happy'); S.say(ch, '헤헤, 이건 내 거~', 1200);
      await tw.wait(1.1);
      if (v.part && shut.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    } else {   // right there, and never noticed
      ch.setFace('sad'); S.say(ch, v.part ? '없네?' : '여긴 없네~', 1000); floatAt(v.it.g, '안 들킴!', 'green');
      await tw.wait(1.0);
      if (v.part && shut.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    }
  }
  if (live()) {
    if (!taken) { ch.setFace('angry'); ch.pose = 'flail'; S.say(ch, '하나도 없잖아! 흥!', 1400); await tw.wait(1.4); }
    ch.pose = 'idle';
    if (live()) await walk(ex, ez, !!taken);
    if (live()) await tw.run(.25, k => ch.root.scale.setScalar(Math.max(.01, 1 - k)));
  }
  if (S.dead) return;
  // everything back as it is now
  for (const part of shut) { part.setOpen(0); part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); }
  for (const it of temps) { it.g.parent?.remove(it.g); it.spot.item = null; it.spot.itemGroup = null; if (it.spot.free) dropFreeSpot(it.spot); }
  for (const g of hiddenReal) g.visible = true;
  ch.root.parent?.remove(ch.root);
  delete S.update;
  for (const c of away) c.root.visible = true;
  S.busyTut = false; W.joyHidden = joy0; W.shadowDirty = true; W.idsDirty = true;
  bar.remove();
  if (S.col) S.col.style.visibility = '';
  if (S.lobby && S.mode === 'lobby') S.frameLobby?.();
  S.replaying = false;
  replayCard(S, ev);
}

// the tally: kept · a lock held · taken, the coins it paid, and what to do about it
function replayCard(S, ev) {
  const G = S.G, t = tally(S, ev), stole = ev.kind === 'steal';
  const row = (k, v, cls = '') => h('div', { class: 'lrow ' + cls }, h('span', { class: 'k' }, k), h('b', {}, v));
  const rows = [row('안 들킴', `${t.kept}개`, 'good')];
  if (t.byLock) rows.push(row('자물쇠가 막음', `${t.byLock}개`, 'good'));
  if (t.left) rows.push(row('들켰지만 두고 감', `${t.left}개`));
  if (stole) rows.push(row('털림', ITEMS[ev.item]?.name || '물건', 'bad'));
  G.ui.panel({
    title: stole ? '털렸다…' : '지켜 냈다!', color: stole ? 'red' : 'green', cls: 'rpend',
    body: [h('div', { class: 'rpface' }, h('img', { src: G.thumbs['face_' + ev.face] || G.thumbs.face_mong }), ...(stole ? [h('img', { class: 'ri', src: G.thumbs['item_' + ev.item] })] : [])),
      h('div', { class: 'loottab' }, ...rows),
      ...(ev.coins ? [h('div', { class: 'txt' }, `못 찾은 물건 덕에 코인 +${ev.coins} (이미 받았어)`)] : []),
      h('div', { class: 'txt' }, stole ? `${ga(ev.nick)} 집에 가서 찾으면 되찾을 수 있어!` : '잘 숨겨 둔 덕분이야!')],
    buttons: stole
      ? [G.ui.btn('더 꽁꽁 숨기기', { color: 'purple', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),
        G.ui.btn('복수하러 가기', { color: 'orange', cls: 'big', onClick: () => { G.ui.closePanel(); goRevenge(G, ev.who); } })]
      : [G.ui.btn('더 꽁꽁 숨기기', { color: 'purple', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),
        G.ui.btn('좋아!', { color: 'green', cls: 'big', onClick: () => G.ui.closePanel() })],
  });
}
