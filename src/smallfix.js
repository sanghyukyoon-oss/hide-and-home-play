// 작은 물건 안전망 (② 레벨 10/21, 사용자 "스테이지 19 이후로 이거 엄청 작게 여기저기 나오는데" — #94): from 19판, a thing on the list
// that the start view draws under 28 px (a mailbox slot, a fishing bag, a bike crate shrink it to fit) moves to the nearest free
// place where it reads at 28 px or more — inside something if it was inside, out on top if it was out; a thing behind a lock
// only moves inside that same piece. Measured the way the level tools do: the meshes only (not the tap sphere), the larger
// side of its box on the screen. Runs once, after the camera and the tiers, inside a time budget.
import * as THREE from 'three';
import { ITEMS } from './gfx/items.js';
import { moveItem } from './hunt.js';
import { attachItem } from './room.js';
import { blindFor } from './hunt-blind.js';
import { spotFits, drawnScale, wantScale, capScale, faceItem, centerOn, nestles, squareIfCrossing, settleOn } from './fitspot.js';
import { affOk } from './affinity.js';

export const MIN_PX = 28;
const v = new THREE.Vector3();
export function screenPx(W, obj) {
  const b = new THREE.Box3(); obj.updateMatrixWorld(true);
  obj.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  if (b.isEmpty()) return 0;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = W.toScreen(v.set(x, y, z)); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return Math.max(x1 - x0, y1 - y0);
}
// (moveItem keeps the size it had — a thing first squeezed into a mailbox stayed mailbox-sized on a table; 10/22: drawn again the
// way the stage draws a thing in its place — stage.js, the same size wanted, held to the place's box)
function redraw(it, s, sc) {
  const g = it.g;
  for (const ch of [...g.children]) if (ch.userData.proxy) g.remove(ch);
  g.parent?.remove(g);
  attachItem(s, g, { rotY: 0, scale: sc }); faceItem(g, s, g.userData.jit || 0); centerOn(g, s); squareIfCrossing(g, s); settleOn(g, s);
}
// back where it was, at the size it had there
function put(it, s, sc) { moveItem(it, s); if (Math.abs(it.g.scale.x - sc * (s.scale || 1)) > .001) redraw(it, s, sc); }
function moveFull(S, it, s) {
  moveItem(it, s);
  const want = S.itemWant || .34, sc = drawnScale(it.type, s, 'target', want) || Math.max(.6, Math.min(wantScale(it.type, s, 'target', want), capScale(it.type, s)));
  redraw(it, s, sc);
  if ((s.kind === 'on' || s.kind === 'inside') && !nestles(s) && !s.wallFace) S.fitClear(s, it.g);
}
const fits = (type, s) => { const I = ITEMS[type]; return !!I && I.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || I.flat) && spotFits(type, s) && affOk(type, s); };
export function fixSmall(S) {
  const W = S.G.world, R = S.room, t0 = performance.now(), moved = [], blind = blindFor(S.spec.room) || (() => false);
  W.updateCam?.(); R.group.updateMatrixWorld(true);
  const show = it => { const p = it.spot.part; it.g.visible = !p || p.t > .5; };
  for (const it of S.targets) {
    if (performance.now() - t0 > 400) break;   // (a time budget, not a hitch)
    if (it.found || it.friend || it.furnTarget || it.hang || it.pileHidden || it.vacHidden || !it.g || !it.spot || it.role !== 'target') continue;
    const px0 = screenPx(W, it.g); if (px0 >= MIN_PX) continue;
    const old = it.spot, sc0 = it.g.scale.x / (old.scale || 1), lockedIn = old.part?.lock ? old.part : null, wasIn = !!old.part;
    const free = s => s !== old && !s.item && !s.reserved && !s.hang && !s.wallFace && s.anchor && !blind(s) && fits(it.type, s);
    const c0 = S.worldCenter(it), d = s => s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(c0);
    const open = s => !s.part || (!s.part.lock && (s.part.reach ?? 1) >= .55);
    // inside if it was inside, then (not behind a lock) anywhere open; a lock's own piece only
    const tiers = lockedIn ? [old.part.spots.filter(free)]
      : [R.spots.filter(s => free(s) && (wasIn ? s.part && open(s) : !s.part)), R.spots.filter(s => free(s) && open(s))];
    let best = null, bestPx = px0;
    for (const cands of tiers) {
      cands.sort((a, b) => d(a) - d(b));
      for (const s of cands.slice(0, 24)) {
        moveFull(S, it, s); const px = screenPx(W, it.g);
        if (px > bestPx) { best = s; bestPx = px; }
        if (px >= MIN_PX) break;
      }
      if (bestPx >= MIN_PX) break;
    }
    if (best) moveFull(S, it, best); else put(it, old, sc0);
    // still small behind a lock: trade places with another thing on the list that reads at full size in there
    if (lockedIn && bestPx < MIN_PX) {
      const here = it.spot;
      for (const o of S.targets) {
        if (o === it || o.found || o.friend || o.furnTarget || o.hang || o.pileHidden || !o.g || !o.spot || o.role !== 'target' || o.spot.part?.lock || !fits(o.type, here) || !fits(it.type, o.spot)) continue;
        const there = o.spot, si = it.g.scale.x / (here.scale || 1), so = o.g.scale.x / (there.scale || 1);
        moveFull(S, it, there); moveFull(S, o, here);
        const a1 = screenPx(W, o.g), b1 = screenPx(W, it.g);
        if (a1 >= MIN_PX && b1 >= MIN_PX) { show(o); bestPx = b1; moved.push(`${o.type} ↔ ${it.type} (자물쇠 칸)`); break; }
        put(it, here, si); put(o, there, so);
      }
    }
    // (10/22: 40·45·49·67·70판 — a 종이 수거함, a 우편함, a 캐비닛 칸 draws everything on the list under 28 px but a flat thing:
    // this one goes out to the nearest open place where it reads at full size, and the thing on the list that reads biggest in
    // there takes the lock's place)
    if (lockedIn && bestPx < MIN_PX) {
      const here = it.spot, sih = it.g.scale.x / (here.scale || 1);
      const outs = R.spots.filter(s => free(s) && s !== here && open(s) && !s.part?.lock).sort((a, b) => d(a) - d(b)).slice(0, 24);
      let dest = null;
      for (const s of outs) { moveFull(S, it, s); if (screenPx(W, it.g) >= MIN_PX) { dest = s; break; } }
      let swapped = false;
      if (dest) for (const o of S.targets) {
        if (o === it || o.found || o.friend || o.furnTarget || o.hang || o.pileHidden || o.vacHidden || !o.g || !o.spot || o.role !== 'target' || o.spot.part?.lock || !fits(o.type, here)) continue;
        const there = o.spot, so = o.g.scale.x / (there.scale || 1);
        moveFull(S, o, here);
        if (screenPx(W, o.g) >= MIN_PX) { show(o); bestPx = screenPx(W, it.g); swapped = true; moved.push(`${o.type} → ${here.label} (자물쇠 칸), ${it.type} → 밖`); break; }
        put(o, there, so);
      }
      if (!swapped) put(it, here, sih);
    }
    show(it);
    if (it.spot !== old) moved.push(`${it.type}: ${old.label} ${Math.round(px0)}px → ${it.spot.label} ${Math.round(bestPx)}px`);
  }
  W.idsDirty = true; W.shadowDirty = true;
  return moved;
}
