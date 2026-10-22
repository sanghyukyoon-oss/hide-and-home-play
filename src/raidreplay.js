// ① 털림 다시 보기 + 복수하러 가기 (내 집 지키기·털기 메타, 10/19 — Clash's defence replay; user: "클래시옵클랜처럼 숨기고
// 공격하는걸… 딱 아 이거구나 싶게"). Back home, the news says who came; [다시 보기] plays it in my own room: the resident
// sneaks in, sniffs where I hid things, opens drawers, rattles a padlock that holds ("자물쇠가 막았다!"), walks right past
// things it never noticed ("안 들킴!"), and runs off with the one it took. (Since ③ 10/21 the resident isn't drawn — only
// their finger: swipes and taps.) Then the tally and [복수하러 가기] straight to
// that resident's house (② 정찰). The raid is still raid.js raidOnce's dice; this only plays back its record (ev.rp).
import * as THREE from 'three';
import { buildItem, ITEMS } from './gfx/items.js';
import { attachItem } from './room.js';
import { resolveHost, makeFreeSpot, dropFreeSpot } from './freehide.js';
import { h, ICON } from './ui.js';
import { practiceRooms } from './net.js';
import { stolenBy, residentId, shieldLeft, locksOwned, locksUsed, LOCK_PRICE, LOCK_MAX } from './raid.js';
import { setScoutList } from './raidrun.js';
import { makePractice } from './scenes/visit.js';
import { housePool } from './presets.js';
import { bananaPeel } from './gfx/defense-props.js';
import { makeFurniture } from './gfx/furniture.js';

const V = new THREE.Vector3();
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 2 ? '방금' : m < 60 ? `${m}분 전` : `${Math.round(m / 60)}시간 전`; };

// 문단속 (Clash's shield): robbed once, the door stays locked for eight hours — a chip on the 내 방 lobby counts it down
export const shieldTxt = ms => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)}시간` + (m % 60 ? ` ${m % 60}분` : '') : `${m}분`; };
export function shieldChip(G, top) {
  if (!shieldLeft(G.save)) return null;
  const v = h('span', { class: 'v' }), el = h('div', { class: 'shieldchip', role: 'button', tabindex: '0', style: `top:calc(${top}px + var(--safeT))`, html: ICON.lock });
  el.append(v);
  const tick = () => { const ms = shieldLeft(G.save); if (!el.isConnected && el._on) return clearInterval(el._t); el._on = true; if (!ms) { el.remove(); clearInterval(el._t); return; } const m = Math.ceil(ms / 60e3); v.textContent = `문단속 ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  tick(); el._t = setInterval(tick, 20e3);
  el.addEventListener('click', () => G.ui.toast(`털린 뒤라 문을 꽁꽁 잠갔어 · ${shieldTxt(shieldLeft(G.save))} 동안 아무도 못 와`, 'green'));
  return el;
}

// can this scene play it: my room (내 집 or the 내 방 lobby) with the record
export const canReplay = (S, ev) => !!(ev?.rp?.items?.length && S?.room && S.spotByKey && S.partByKey && S.openPart);

// 복수하러 가기: that resident's house, scouted first (the list for 다음 집 is the neighbourhood, robbers first)
export function goRevenge(G, who) {
  // (털 집 찾기 10/20: their house — a ready-made one or a resident's — scouted with the search's own buttons)
  const list = housePool(G, { practiceRooms, makePractice, stolenBy, residentId });
  setScoutList([]);
  const room = list.find(r => r.id === who);
  if (room) G.go('stage', { custom: { ...room, found: true }, scout: true }); else G.go('visit');
}

// how it went, from the record: things never found, the ones a lock kept, the one taken
function tally(S, ev) {
  const rp = ev.rp, partOf = e => e.free ? e.free.part || (e.free.host?.startsWith?.('p:') ? e.free.host.slice(2) : null) : S.spotByKey[e.spot]?.part?.key;
  const kept = rp.items.filter(e => !e.found), byLock = kept.filter(e => { const k = partOf(e); return k && rp.locks[k]; });
  const left = rp.items.filter(e => e.found && !e.by && e.item !== (ev.item || ev.got)).length;   // found, but a raid takes one thing
  const byFriend = rp.items.filter(e => e.by && !e.by.startsWith('tool:')).length;   // 친구 지킴이 (10/20)
  return { kept: kept.length, byLock: byLock.length, byFriend, left, total: rp.items.length };
}

// 친구 지킴이 (10/20): the friend sitting at home hops over to the thing and back — "친구가 막았다!" (no words: ③ 10/21, the
// replay shows only what the resident did with their finger, user "말풍선 나오는것좀 제거해줘. 상대방이 나오지 않아도 되고")
async function friendBlock(S, k, g, tw, live, floatAt) {
  const G = S.G, fr = (S.seated || []).find(s => s.k === k);
  floatAt(g, '친구가 막았다!', 'pink big');
  if (!fr) { await tw.wait(1.1); return; }
  const c = fr.ch, p = c.root.position, home = p.clone(), tp = S.room.group.worldToLocal(g.getWorldPosition(V.set(0, 0, 0)).clone()), a = Math.atan2(p.x - tp.x, p.z - tp.z);
  const to = { x: tp.x + Math.sin(a) * .5, z: tp.z + Math.cos(a) * .5 };
  G.audio.sfx('pop', 4);
  await tw.run(.4, k2 => { p.x = home.x + (to.x - home.x) * k2; p.z = home.z + (to.z - home.z) * k2; p.y = home.y + Math.sin(k2 * Math.PI) * .5; });
  if (!live()) { p.copy(home); return; }
  c.faceTo(tp.x, tp.z); c.setFace?.('angry'); c.bump?.(.4);
  await tw.wait(.8);
  c.setFace?.('happy');
  await tw.run(.4, k2 => { p.x = to.x + (home.x - to.x) * k2; p.z = to.z + (home.z - to.z) * k2; p.y = home.y + Math.sin(k2 * Math.PI) * .4; });
  p.copy(home);
}

export async function playRaidReplay(S, ev) {
  const G = S.G, W = G.world, tw = S.tw, rp = ev.rp;
  if (S.replaying || !canReplay(S, ev)) return;
  S.replaying = true;
  if (rp.zone && rp.zone !== S.zoneId && G.zoneOpen(rp.zone)) S.switchZone(rp.zone);
  // the stage: no buttons, no 몽글이 (you were out), the whole room in view
  if (S.col) S.col.style.visibility = 'hidden';
  const away = [S.mong].filter(Boolean); for (const c of away) c.root.visible = false;   // (몽글이만 외출 — 친구들은 집을 지켜요, 10/20)
  S.busyTut = true; S.visitors?.drop();
  const messed = new Set(messHere(S)); for (const p of messed) { p.setOpen(0); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); }   // (털린 흔적: shut until the resident opens them)
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
  const taken = ev.kind === 'steal' ? visits.find(v => v.e.item === (ev.item || ev.got)) : null;   // (ev.got: a coin purse taken from beside it — ② 10/22)
  const misses = visits.filter(v => !v.e.found).sort(() => Math.random() - .5);
  const guarded = visits.filter(v => v.e.by).slice(0, 4);   // 친구 지킴이: found, and a friend stepped in
  const seq = [...misses.filter(v => v.locked).slice(0, 1), ...misses.filter(v => !v.locked)].slice(0, Math.max(1, (taken ? 3 : 4) - guarded.length));
  seq.push(...guarded.sort(() => Math.random() - .5));
  if (taken) seq.push(taken);
  // (③ 10/21, user: "내방 털리는거 다시보는데 이런 말풍선 나오는것좀 제거해줘. 상대방이 나오지 않아도 되고. 조작하는것만 보이면 될거같아.
  // 터치하는거나 이동하는거"): no resident and no words — only their finger: a swipe that turns the view (a short trail), a tap
  // where they opened or looked (a ring spreading). The big result words stay, a little above the tap so the finger shows
  const live = () => !S.dead && !skip, wait = s => tw.wait(s);
  const wpos = g => g.getWorldPosition(new THREE.Vector3());
  const floatAt = (g, text, cls) => { const s = W.toScreen(wpos(g)), m = Math.min(120, innerWidth / 3); G.ui.floatText(Math.max(m, Math.min(innerWidth - m, s.x)), Math.max(150, s.y - 120), text, cls); };   // (kept on screen, clear of the finger)
  const fing = h('div', { class: 'hand rpfinger', html: ICON.hand, style: `left:${innerWidth * .5}px;top:${innerHeight * .7}px` });
  G.ui.wui.append(fing);
  const outs = [fing];
  let fx = innerWidth * .5, fy = innerHeight * .7;
  const fingerTo = (x, y, ms) => { const a = fing.animate([{ left: fx + 'px', top: fy + 'px' }, { left: x + 'px', top: y + 'px' }], { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }); fx = x; fy = y; return a.finished.catch(() => {}); };
  const press = () => fing.animate([{ scale: '1' }, { scale: '.84', offset: .4 }, { scale: '1' }], { duration: 220, easing: 'ease-out' });
  const tapAt = async (x, y, sfx = true) => {
    await fingerTo(x, y, 360); if (!live()) return;
    press(); if (sfx) G.audio.sfx('tap', 4);
    const r = h('i', { class: 'rpripple', style: `left:${x}px;top:${y}px` }); G.ui.wui.append(r); outs.push(r);
    r.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: .95 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' });
    await wait(.28);
  };
  const tapOn = g => { const s = W.toScreen(wpos(g)); return tapAt(Math.max(40, Math.min(innerWidth - 40, s.x)), Math.max(120, Math.min(innerHeight - 120, s.y))); };
  // a swipe sideways: the view turns with the finger (towards the next thing, the way that brings it nearest the middle)
  const onScreen = g => { const s = W.toScreen(wpos(g)); return Math.hypot(s.x - innerWidth / 2, (s.y - innerHeight * .5) * .7); };
  const swipe = async g => {
    const y0 = W.yaw; let dir = 1;
    if (g) { const d = []; for (const sg of [1, -1]) { W.yaw = y0 - sg * .4; W.updateCam(); d.push(onScreen(g)); } W.yaw = y0; W.updateCam(); dir = d[0] <= d[1] ? 1 : -1; }
    const y = innerHeight * .58, xa = innerWidth * (dir > 0 ? .3 : .7), xb = innerWidth * (dir > 0 ? .7 : .3);
    await fingerTo(xa, y, 300); if (!live()) return;
    const tr = h('i', { class: 'rptrail', style: `left:${Math.min(xa, xb)}px;top:${y}px;width:${Math.abs(xb - xa)}px;transform-origin:${dir > 0 ? 'left' : 'right'} center` }); G.ui.wui.append(tr); outs.push(tr);
    tr.animate([{ transform: 'translateY(-50%) scaleX(0)', opacity: .9 }, { transform: 'translateY(-50%) scaleX(1)', opacity: .9, offset: .6 }, { transform: 'translateY(-50%) scaleX(1)', opacity: 0 }], { duration: 760, easing: 'ease-out', fill: 'forwards' });
    G.audio.sfx('swish');
    await Promise.all([fingerTo(xb, y, 440), W.flyTo(tw, { yaw: y0 - dir * .4, dur: .44, e: x => x })]);
    await wait(.15);
  };
  const yaw0 = W.yaw;
  await wait(.5); if (S.dead) return;
  for (const v of seq) {
    if (!live()) break;
    await swipe(v.it.g); if (!live()) break;
    if (onScreen(v.it.g) > Math.min(innerWidth, innerHeight) * .42) { await swipe(v.it.g); if (!live()) break; }   // (still far off: once more)
    if (v.locked && v === taken) {   // a padlock that didn't hold (the dice: rare, never zero) — tapped at, then open
      await tapOn(v.it.g); G.audio.sfx('locked'); await wait(.35); if (!live()) break;
      await tapOn(v.it.g); G.audio.sfx('unlock'); floatAt(v.it.g, '자물쇠를 땄어!', 'red big');
      await wait(.5); if (!live()) break;
    } else if (v.locked) {   // a padlock that holds
      await tapOn(v.it.g); if (!live()) break;
      G.audio.sfx('locked'); const fg = v.part.furn.group, x0 = fg.position.x;
      floatAt(v.it.g, '자물쇠가 막았다!', 'green big');
      await tw.run(.45, k => { fg.position.x = x0 + Math.sin(k * Math.PI * 8) * .03 * (1 - k); }); fg.position.x = x0;
      await wait(.9); continue;
    }
    if (v.part && v.part.t < .5) { await tapOn(v.it.g); if (!live()) break; await S.openPart(v.part, true); shut.add(v.part); v.it.g.visible = true; }
    if (!live()) break;
    if (v === taken) {   // found: tapped, up it comes and off it goes
      await tapOn(v.it.g); if (!live()) break;
      G.audio.sfx('found', 3);
      const g = v.it.g, s0 = g.scale.x, p0 = g.position.clone();
      await tw.run(.3, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .5)));
      if (ev.lost) {   // the coin purse beside it goes; the thing stays where it was
        const s = W.toScreen(wpos(g)); floatAt(g, `코인 -${ev.lost}`, 'red big'); G.audio.sfx('whoosh');
        W.fx.burst(s.x, s.y, { n: 14, shape: 'circle', colors: ['#ffd23f', '#ffb300', '#fff3a0'], speed: 220, up: 160, gravity: 500, size: 8, life: .7 });
        await wait(.8);
        if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
        continue;
      }
      floatAt(g, '가져갔다!', 'red big'); G.audio.sfx('whoosh');
      await tw.run(.45, k => { g.position.y = p0.y + k * k * 1.6; g.scale.setScalar(s0 * (1 - k * .8)); });
      g.visible = false; g.position.copy(p0); g.scale.setScalar(s0); if (!temps.includes(v.it)) hiddenReal.push(g);
      await wait(.4);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    } else if (v.e.by?.startsWith('tool:')) {   // found — and a 지키기 도구 stops them (② 10/22): only the finger and the words
      await tapOn(v.it.g); if (!live()) break;
      G.audio.sfx('found', 2);
      const k = v.e.by.slice(5);
      // (③ 10/22, ② 인수 'HANDOFF-DEFENSE-1022': each stop a funny little cut, not only words — the finger is the raider; the
      // camera comes in on it first, the room is too small from afar for a peel or a bell)
      const back0 = { target: W.target.clone(), zoom: W.zoom };
      await W.flyTo(tw, { target: wpos(v.it.g).setY(.45), zoom: Math.max(2.2, W.zoom * 1.9), dur: .4 }); if (!live()) break;
      { const q = W.toScreen(wpos(v.it.g)); await fingerTo(Math.max(40, Math.min(innerWidth - 40, q.x)), Math.max(120, Math.min(innerHeight - 120, q.y)), 200); }
      if (k === 'bell') {
        // 따르르릉: the bell on that drawer shakes hard, the finger jumps back and shivers
        G.audio.sfx('bellRing'); floatAt(v.it.g, '따르르릉!', 'red big');
        const ring = v.part?.bellRing, x0 = fx, y0 = fy;
        fing.animate([{ translate: '0 0' }, { translate: '0 -46px', offset: .18 }, { translate: '-5px -40px', offset: .3 }, { translate: '5px -42px', offset: .42 }, { translate: '-5px -40px', offset: .54 }, { translate: '0 -44px' }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
        if (ring) await tw.run(1.4, q => ring(q * 1.4)); else await wait(1.2);
        fing.getAnimations().forEach(a => { if (a.effect?.getKeyframes?.()[1]?.translate) a.cancel(); }); void x0; void y0;
      } else if (k === 'banana') {
        // 미끄덩: a peel on the floor in front of it, the finger steps on it and spins off in an arc, the peel skids away
        const R = S.room.rooms ? S.room.rooms[0] : S.room, gp = wpos(v.it.g), peel = bananaPeel();
        const cd = new THREE.Vector3(W.cam.position.x - gp.x, 0, W.cam.position.z - gp.z).normalize();
        peel.position.copy(R.group.worldToLocal(gp.clone().addScaledVector(cd, .55).setY(R.group.position.y))); peel.scale.setScalar(2.2); R.group.add(peel); outs.push({ remove: () => peel.parent?.remove(peel) });
        W.idsDirty = true; W.shadowDirty = true;
        const ps = W.toScreen(peel.getWorldPosition(new THREE.Vector3()));
        await fingerTo(ps.x, ps.y - 10, 300); if (!live()) break;
        G.audio.sfx('slide'); floatAt(v.it.g, '미끄덩!', 'gold big');
        const away = fx < innerWidth / 2 ? 1 : -1, p0 = peel.position.clone();
        tw.run(.5, q => { peel.position.x = p0.x - away * q * .6; peel.position.z = p0.z + q * .3; peel.rotation.y = q * 6; W.shadowDirty = true; });
        await fing.animate([{ left: fx + 'px', top: fy + 'px', rotate: '0deg' }, { left: (fx + away * 90) + 'px', top: (fy - 120) + 'px', rotate: away * 400 + 'deg', offset: .55 }, { left: (fx + away * 170) + 'px', top: (fy + 40) + 'px', rotate: away * 720 + 'deg' }], { duration: 750, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
        fx += away * 170; fy += 40; G.audio.sfx('thump');
        fing.animate([{ rotate: '0deg' }, { rotate: '0deg' }], { duration: 1, fill: 'forwards' });
      } else {
        // 위잉: the robot vacuum of this room charges at the finger; it runs
        const R = S.room.rooms ? S.room.rooms[0] : S.room, rv = R.furns?.find(r => /robovac/.test(r.type));
        G.audio.sfx('whoosh'); floatAt(v.it.g, '위잉~ 로봇청소기!', 'green big');
        if (rv) {
          const g = rv.f.group, p0 = g.position.clone(), to = R.group.worldToLocal(wpos(v.it.g).setY(R.group.position.y)), r0 = g.rotation.y;
          g.rotation.y = Math.atan2(to.x - p0.x, to.z - p0.z);
          await tw.run(.6, q => { g.position.lerpVectors(p0, to, q * .8); g.position.x += Math.sin(q * 30) * .01; W.shadowDirty = true; });
          const away = fx < innerWidth / 2 ? -1 : 1;
          await fing.animate([{ translate: '0 0' }, { translate: `${away * 14}px -18px`, offset: .3 }, { translate: `${away * 60}px 0` }], { duration: 380, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
          tw.run(.6, q => { g.position.lerpVectors(to, p0, q); W.shadowDirty = true; }).then(() => { g.position.copy(p0); g.rotation.y = r0; });
        } else await wait(1);
      }
      if (!live()) break;
      await fingerTo(fx + (fx < innerWidth / 2 ? -1 : 1) * innerWidth * .6, fy, 420);   // (off it runs)
      W.flyTo(tw, { ...back0, dur: .4 });
      fingerTo(innerWidth * .5, innerHeight * .7, 10);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    } else {   // right there, and never noticed: the finger taps beside it and moves on
      const s = W.toScreen(wpos(v.it.g)); await tapAt(Math.max(40, Math.min(innerWidth - 40, s.x + 46)), Math.max(120, Math.min(innerHeight - 120, s.y + 30))); if (!live()) break;
      floatAt(v.it.g, '안 들킴!', 'green');
      await wait(.8);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }   // (털린 흔적: left open)
    }
  }
  if (ev.decoy && live()) {   // 미끼 상자 (② 10/22): what they carried off was the box — 몽글이 on a spring, '메롱!'
    // (③ 10/22: the box comes back for a moment where it stood, the finger lifts its flaps, 몽글이 springs out with its tongue
    // out, the finger jumps back — then off the box goes with them)
    const R = S.room.rooms ? S.room.rooms[0] : S.room, at = ev.decoyAt;
    let box = null; try { box = makeFurniture('decoybox', R.T || {}); } catch {}
    if (box?.springFace) {
      const p = at?.x != null ? at : at ? R.tileToWorld(at.i, at.j, 1, 1) : { x: 0, z: R.d / 4 };
      box.group.position.set(p.x, 0, p.z); box.group.rotation.y = Math.atan2(W.cam.position.x - p.x, W.cam.position.z - p.z); R.group.add(box.group); outs.push({ remove: () => box.group.parent?.remove(box.group) });
      W.idsDirty = true; W.shadowDirty = true;
      await W.flyTo(tw, { target: box.group.getWorldPosition(new THREE.Vector3()).setY(.45), zoom: 3.6, pitch: .55, dur: .45 }); box.springFace.g.scale.setScalar(1.9); if (!live()) { box.group.parent?.remove(box.group); }
      await tapOn(box.group);
      const lid = box.parts?.[0]; if (lid) await tw.run(.18, q => lid.setOpen(q));
      G.audio.sfx('pop', 4); G.audio.sfx('giggle'); floatAt(box.group, '메롱~!', 'gold big');
      await Promise.all([tw.run(.7, q => { box.springFace.pop(q); W.shadowDirty = true; }), fing.animate([{ translate: '0 0' }, { translate: '30px -70px', rotate: '20deg', offset: .3 }, { translate: '40px -60px', rotate: '10deg' }], { duration: 500, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {})]);
      await wait(.6);
      G.ui.floatText(innerWidth / 2, innerHeight * .3, '미끼 상자를 들고 갔다!', 'gold big'); G.audio.sfx('whoosh');
      const p0 = box.group.position.clone(); await tw.run(.45, q => { box.group.position.y = p0.y + q * q * 1.6; box.group.scale.setScalar(1 - q * .8); W.shadowDirty = true; });
      box.group.parent?.remove(box.group);
    } else { G.audio.sfx('giggle'); G.ui.floatText(innerWidth / 2, innerHeight * .42, '미끼 상자를 들고 갔다! 메롱~', 'gold big'); await wait(1.4); }
  }
  fing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
  if (!S.dead) await W.flyTo(tw, { yaw: yaw0, target: look, zoom: 1.1, dur: .45 });
  outs.forEach(o => o.remove());
  if (S.dead) return;
  // everything back as it is now
  for (const part of shut) if (!messed.has(part)) { part.setOpen(0); part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); }
  for (const part of messed) { part.setOpen(1); part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); }   // (as the resident left them)
  for (const it of temps) { it.g.parent?.remove(it.g); it.spot.item = null; it.spot.itemGroup = null; if (it.spot.free) dropFreeSpot(it.spot); }
  for (const g of hiddenReal) g.visible = true;
  for (const c of away) c.root.visible = true;
  S.busyTut = false; W.joyHidden = joy0; W.shadowDirty = true; W.idsDirty = true;
  bar.remove();
  if (S.col) S.col.style.visibility = '';
  if (S.lobby && S.mode === 'lobby' && !messHere(S).length) S.frameLobby?.();   // (털린 흔적 left: stay on the whole room, so the open drawers are there to shut)
  S.replaying = false;
  replayCard(S, ev);
}

// the tally: kept · a lock held · taken, the coins it paid, and what to do about it
function replayCard(S, ev) {
  const G = S.G, t = tally(S, ev), stole = ev.kind === 'steal';
  const row = (k, v, cls = '') => h('div', { class: 'lrow ' + cls }, h('span', { class: 'k' }, k), h('b', {}, v));
  const rows = [row('안 들킴', `${t.kept}개`, 'good')];
  if (t.byLock) rows.push(row('자물쇠가 막음', `${t.byLock}개`, 'good'));
  if (t.byFriend) rows.push(row('친구가 막음', `${t.byFriend}개`, 'good'));
  if (ev.tool) rows.push(row('지키기 도구', { decoy: '미끼 상자', bell: '경보 벨', banana: '바나나 껍질', robovac: '로봇청소기' }[ev.tool] || '', 'good'));
  if (t.left) rows.push(row('들켰지만 두고 감', `${t.left}개`));
  if (stole) rows.push(row('털림', ev.lost ? `코인 ${ev.lost}개` : ITEMS[ev.item]?.name || '물건', 'bad'));
  G.ui.panel({
    title: stole ? '털렸다…' : '지켜 냈다!', color: stole ? 'red' : 'green', cls: 'rpend',
    body: [h('div', { class: 'rpface' }, h('img', { src: G.thumbs['face_' + ev.face] || G.thumbs.face_mong }), ...(stole ? [ev.lost ? h('img', { class: 'ri', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(ICON.coin.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')) }) : h('img', { class: 'ri', src: G.thumbs['item_' + ev.item] })] : [])),
      h('div', { class: 'loottab' }, ...rows),
      ...(ev.coins ? [h('div', { class: 'txt' }, `못 찾은 물건 덕에 코인 +${ev.coins} (이미 받았어)`)] : []),
      ...(stole && shieldLeft(G.save) ? [h('div', { class: 'shieldline', html: ICON.lock }, h('span', {}, `문단속! ${shieldTxt(shieldLeft(G.save))} 동안 아무도 못 와`))] : []),
      h('div', { class: 'txt' }, stole ? (ev.lost ? '자물쇠를 걸면 덜 털려!' : `${ga(ev.nick)} 집에 가서 찾으면 되찾을 수 있어!`) : '잘 숨겨 둔 덕분이야!'),
      ...(messHere(S).length ? [h('div', { class: 'txt sm' }, `열어 놓고 간 서랍 ${messHere(S).length}개 · 터치하면 닫혀`)] : [])],
    buttons: stole
      ? [G.ui.btn('더 꽁꽁 숨기기', { color: 'orange', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),   // (UI ②: 주황 = 내 집, 초록 하나 = 제일 할 일)
        G.ui.btn('복수하러 가기', { color: 'green', cls: 'big', onClick: () => { G.ui.closePanel(); goRevenge(G, ev.who); } })]
      : [G.ui.btn('더 꽁꽁 숨기기', { color: 'orange', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),
        G.ui.btn('좋아!', { color: 'green', cls: 'big', onClick: () => G.ui.closePanel() })],
  });
}

// ── 털린 흔적 (10/19, user via 인수인계: "내 방 털고 가면 문·서랍 같은 걸 다 열고 가서, 닫는 거 정리해 줘야 되는 거 어때?").
// The drawers, lids and doors a resident went through stay open when you come home — you see at once that someone was
// here. A tap shuts each one (탁!); shutting the last pays a little. Leaving them open costs nothing: Clash gave up
// making you re-arm traps by hand because it was a chore. A lock that held stays shut; the replay opens them in order.
const MESS_PAY = 10;
const partOfEntry = (S, e) => e.free ? (e.free.part ? S.partByKey[e.free.part] : (e.free.host?.startsWith?.('p:') ? S.partByKey[e.free.host.slice(2)] : null)) : S.spotByKey[e.spot]?.part;
// after build: the raids on this zone not looked at yet leave their parts open (once per raid); then open them all
export function messOpen(S) {
  const G = S.G, H = S.H, R = G.save.raid;
  if (!S.partByKey) return;
  const mess = new Set(H.mess || []);
  let changed = false;
  for (const ev of R?.log || []) {
    if (!ev.rp || ev.messed || ev.rp.zone !== S.zoneId) continue;
    ev.messed = true; changed = true;
    for (const e of ev.rp.items) { const p = partOfEntry(S, e); if (p && !ev.rp.locks[p.key] && !H.hide.locks?.[p.key]) mess.add(p.key); }
  }
  // (only this zone's parts that still exist and aren't locked now)
  const here = [...mess].filter(k => S.partByKey[k] && !H.hide.locks?.[k]);
  const other = (H.mess || []).filter(k => !S.partByKey[k]);
  H.mess = [...new Set([...other, ...here])];
  for (const k of here) { const p = S.partByKey[k]; p.setOpen(1); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); }
  if (changed) G.persist();
}
export const messHere = S => (S.H.mess || []).map(k => S.partByKey?.[k]).filter(Boolean);
// a part shut by hand (MyHomeScene.openPart): 탁! — the last one pays
export function messShut(S, part) {
  const G = S.G, H = S.H;
  if (S.replaying || !H.mess?.includes(part.key)) return;
  H.mess = H.mess.filter(k => k !== part.key);
  const W = G.world, s = W.toScreen((part.pivots?.[0] || part.furn.group).getWorldPosition(new THREE.Vector3()));
  G.ui.floatText(s.x, s.y - 30, '탁!', 'gold'); W.fx.burst(s.x, s.y, { n: 8, shape: 'star', colors: ['#ffffff', '#fff3a0'], speed: 140, gravity: 40 });
  if (!messHere(S).length) { G.addCoins(MESS_PAY); G.audio.sfx('coin'); G.ui.toast(`정리 끝! 털린 흔적이 싹 사라졌어 +${MESS_PAY}`, 'green'); if (S.lobby && S.mode === 'lobby') setTimeout(() => !S.dead && S.frameLobby?.(), 900); }
  G.persist();
}

// ── 자물쇠가 모자랄 때: one more, right here (or the shop's 물건 tab)
export function askBuyLock(G, onBought) {
  const owned = locksOwned(G.save);
  if (owned >= LOCK_MAX) { G.ui.toast(`자물쇠는 ${LOCK_MAX}개까지야 · 다른 데 걸린 걸 풀어서 옮겨 봐`, 'red'); G.audio.sfx('miss'); return; }
  const buy = () => {
    if (G.save.coins < LOCK_PRICE) { G.ui.toast('코인이 모자라!', 'red'); G.audio.sfx('miss'); return; }
    G.addCoins(-LOCK_PRICE); G.audio.sfx('buy'); G.save.raid.locksOwned = owned + 1; G.persist();
    G.ui.closePanel(); G.ui.toast(`자물쇠 ${owned + 1}개째!`, 'green'); onBought?.();
  };
  G.ui.panel({ title: '자물쇠가 다 쓰였어', color: 'orange', cls: 'lockbuy',
    body: [h('div', { class: 'lockicon', html: ICON.lock }), h('div', { class: 'txt' }, `지금 ${locksUsed(G.save)}개를 다 걸었어. 하나 더 살까?`), h('div', { class: 'txt sm' }, '잠근 서랍 속 물건은 동네 주민이 거의 못 털어 가')],
    buttons: [G.ui.btn('나중에', { color: 'gray', cls: 'sm', onClick: () => G.ui.closePanel() }),
      G.ui.btn(`사기 ${LOCK_PRICE}`, { color: 'green', icon: 'coin', cls: 'big', onClick: buy })] });
}
