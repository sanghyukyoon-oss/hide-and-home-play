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
import { spotFits, drawnScale, wantScale, capScale, coverCap, coverDraw, pierced, faceItem, centerOn, nestles, squareIfCrossing, settleOn } from './fitspot.js';
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
  const want = S.itemWant || .34, sc = Math.min(drawnScale(it.type, s, 'target', want) || Math.max(.6, Math.min(wantScale(it.type, s, 'target', want), capScale(it.type, s))), coverDraw(it.type, s));
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
    if (it.own || it.lightSwitch || !it.spot?.anchor || it.found || it.friend || it.furnTarget || it.hang || it.pileHidden || it.vacHidden || !it.g || !it.spot || it.role !== 'target') continue;
    // (24판 ② 10/23: a chain's reward stays where the chain ends — the 배수구, 25판 옥상 바구니 — the chain's own camera shows it;
    // 10/24 허브: not tiny there either — drawn bigger in its own place, up to 2.2×, so a finger finds it (25판 쿠키 봇 빗나감 14번)
    if (it.spot.part?.chainVia || it.spot.part?.device === 'chain') {
      const px = screenPx(W, it.g), sp = it.spot;
      if (px > 0 && px < MIN_PX) { const sc = Math.min(it.g.scale.x / (sp.scale || 1) * Math.min(2.2, MIN_PX * 1.15 / px), coverDraw(it.type, sp), Math.max(it.g.scale.x / (sp.scale || 1), wantScale(it.type, sp, 'target', S.itemWant || .34))); redraw(it, sp, sc); moved.push(`${it.type}: ${sp.label} ${Math.round(px)}px → 키움`); }
      continue;
    }
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
        if (o === it || o.found || o.friend || o.furnTarget || o.hang || o.pileHidden || !o.g || !o.spot || o.role !== 'target' || o.spot.part?.lock || o.spot.part?.chainVia || o.spot.part?.device === 'chain' || !fits(o.type, here) || !fits(it.type, o.spot)) continue;
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

// 안 보이는 물건 옮기기 (② 10/29, 사용자 "소방차 숨기는 곳 바로 옆이 벽이라 보이지도 않아"; 20판 38 cm 라켓이 전구 기둥 밑에 깔려 봇도 못 찾음):
// from 19판, a thing on the list that no view a player can take sees — its place opened, the view centred on it, 8 turns × 2 tilts
// at zoom 1.5, the tap test (world.visibleAt) — goes to the nearest free open place where one does. Not behind a lock or in a chain.
function seenAny(S, it) {
  const W = S.G.world, R = S.room, p = it.spot.part, wasT = p?.t ?? 0, v = it.g.visible;
  if (p?.setOpen) p.setOpen(1);
  it.g.visible = true;
  const c = S.worldCenter(it), y0 = W.yaw, p0 = W.pitch, z0 = W.zoom, t0 = W.target.clone();
  let ok = false;
  outer: for (const pt of [.62, 1.0]) for (let k = 0; k < 8; k++) {
    W.zoom = 1.5; W.pitch = pt; W.yaw = k * Math.PI / 4 + .2; W.target.copy(c); W.clampTarget?.(true); W.updateCam();
    R.update?.(1); R.group.updateMatrixWorld(true);
    if (W.visibleAt(it.g, c, [R.group])) { ok = true; break outer; }
  }
  W.yaw = y0; W.pitch = p0; W.zoom = z0; W.target.copy(t0); W.updateCam();
  if (p?.setOpen) p.setOpen(wasT);
  it.g.visible = v; R.update?.(1);
  return ok;
}
export function unhide(S) {
  const R = S.room, moved = [], blind = blindFor(S.spec.room) || (() => false), t0 = performance.now();
  // (and a thing the planner had to put where it makes no sense — 70판 우편함 주먹밥: the planner's last chance; moves the same way)
  // (10/29 1.0.280 실폰 "21 스테이지도 쪽지 안 보임" — 순찰차 밑: the clues too — a note, a key, a colour card — not only the things on the list)
  for (const it of S.items) {
    if (performance.now() - t0 > 600) break;
    if (it.own || it.lightSwitch || !it.spot?.anchor || it.found || it.friend || it.furnTarget || it.hang || it.pileHidden || it.vacHidden || !it.g || !it.spot || it.role === 'secret' || (it.role === 'decoy' && affOk(it.type, it.spot)) || it.spot.part?.lock || it.spot.part?.chainVia || it.spot.part?.device === 'chain') continue;
    if (seenAny(S, it) && affOk(it.type, it.spot)) continue;
    const old = it.spot, sc0 = it.g.scale.x / (old.scale || 1), c0 = S.worldCenter(it);
    const d = s => s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(c0);
    const cands = R.spots.filter(s => s !== old && !s.item && !s.reserved && !s.hang && !s.wallFace && s.anchor && !blind(s) && (!s.part || (!s.part.lock && (s.part.reach ?? 1) >= .55)) && fits(it.type, s) && !(it.forPart && s.furn === it.forPart.furn)).sort((a, b) => d(a) - d(b)).slice(0, 12);
    let dest = null;
    for (const s of cands) { moveFull(S, it, s); if (seenAny(S, it) && affOk(it.type, s)) { dest = s; break; } }
    if (dest) moved.push(`${it.type}: ${old.label} → ${dest.label} (안 보임·엉뚱한 자리)`); else put(it, old, sc0);
    const p = it.spot.part; it.g.visible = !p || p.t > .5;
  }
  // (behind a lock, where it makes no sense — 70판 202호 우편함 주먹밥: trade places with a thing on the list that does belong there)
  for (const it of S.targets) {
    if (it.own || it.lightSwitch || !it.spot?.anchor || it.found || it.friend || it.furnTarget || !it.g || !it.spot?.part?.lock || affOk(it.type, it.spot)) continue;
    const here = it.spot;
    for (const o of S.targets) {
      if (o === it || o.found || o.friend || o.furnTarget || o.hang || o.pileHidden || o.vacHidden || !o.g || !o.spot || o.spot.part?.lock || o.spot.part?.chainVia || o.spot.part?.device === 'chain' || !fits(o.type, here) || !fits(it.type, o.spot)) continue;
      const there = o.spot;
      moveFull(S, o, here); moveFull(S, it, there);
      for (const x of [o, it]) { const q = x.spot.part; x.g.visible = !q || q.t > .5; }
      moved.push(`${it.type} ↔ ${o.type} (자물쇠 칸 ${here.label})`); break;
    }
  }
  S.G.world.idsDirty = true;
  return moved;
}

// 크기 맞추기 (② 10/29 허브 QA: 첫 화면 18 px 미만 9개 — 19판 소방차 부품 9~16 px, 26판 블록 10 px, 40판 호출 종 12 px; 부품보다 큼 23판
// 일기장 ×1.22·50판 지도 ×1.06): from 19판, every thing on the list both fits what hides it (its cover's box, the opening of a lidded pot,
// the piece it sits under or behind — stage.js fitUnderCover's measure) and reads at least FLOOR px on the start view. Scaled within
// those two where it can be; where it can't, it goes to the nearest free open place where it can (a lock's thing stays in its lock).
const FLOOR = 20, _bx = new THREE.Box3(), _bb = new THREE.Box3();
function extOf(o) {
  _bx.makeEmpty(); o.updateMatrixWorld(true);
  const walk = m => { if (m !== o && m.userData.item) return; if (m.isMesh && !m.userData.proxy && m.geometry && m.visible !== false) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); _bx.union(_bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); } for (const c of m.children) walk(c); };
  walk(o); return _bx.isEmpty() ? null : _bx.getSize(new THREE.Vector3());
}
function coverLim(sp) {
  const part = sp.part;
  if (part?.pivots?.length) {
    const e = new THREE.Vector3(); for (const pv of part.pivots) { const x = extOf(pv); if (x) e.max(x); }
    if ((part.kind === 'lid' || part.kind === 'lift') && (sp.kind === 'inside' || sp.kind === 'in')) return Math.max(e.x, e.z) * .85;
    return sp.kind === 'inside' || sp.kind === 'in' ? Math.max(e.x, e.y, e.z) : Math.max(e.x, e.z);
  }
  if ((sp.kind === 'under' || sp.kind === 'behind') && sp.furn?.group) { const h = extOf(sp.furn.group); if (h) return sp.kind === 'under' ? Math.max(h.x, h.z) : Math.max(h.x, h.y); }
  return Infinity;
}
// the scale factor that makes it fit both, or 0 when none does
function sizeFix(W, it) {
  const e = extOf(it.g); if (!e) return 1;
  const imax = Math.max(e.x, e.y, e.z), lim = coverLim(it.spot), px = screenPx(W, it.g);
  // (사용자 10/29 9판 "열쇠가 다른 판보다 큼": 20 px로 키울 때도 열쇠는 22 cm, 그 밖은 42 cm를 넘지 않음 — 화분 흙 위 열쇠가 44 cm)
  const grow = (it.type === 'key' ? .22 : .42) / imax;
  const fmax = Math.min(lim === Infinity ? Infinity : lim * .95 / imax, Math.max(1, grow)), fmin = px > 0 ? Math.min(FLOOR / px, Math.max(1, grow)) : 1;
  if (fmin > fmax * 1.001) return 0;
  return Math.min(Math.max(1, fmin), fmax);
}
export function sizeUp(S) {
  const W = S.G.world, R = S.room, out = [], t0 = performance.now(), blind = blindFor(S.spec.room) || (() => false);
  W.updateCam?.(); R.group.updateMatrixWorld(true);
  for (const it of S.items.filter(i => i.role !== 'decoy' && i.role !== 'secret')) {
    if (performance.now() - t0 > 500) break;
    if (it.own || it.lightSwitch || !it.spot?.anchor || it.found || it.friend || it.furnTarget || it.hang || it.pileHidden || it.vacHidden || it.lightSwitch || !it.g || !it.spot || it.spot.part?.chainVia || it.spot.part?.device === 'chain') continue;
    let f = sizeFix(W, it);
    if (f > 0) { if (Math.abs(f - 1) > .01) { it.g.scale.multiplyScalar(f); settleOn(it.g, it.spot); out.push(`${it.type} ×${f.toFixed(2)} @${it.spot.label}`); } continue; }
    if (it.spot.part?.lock) continue;
    const old = it.spot, sc0 = it.g.scale.x / (old.scale || 1), c0 = S.worldCenter(it);
    const d = s => s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(c0);
    const cands = R.spots.filter(s => s !== old && !s.item && !s.reserved && !s.hang && !s.wallFace && s.anchor && !blind(s) && (!s.part || (!s.part.lock && (s.part.reach ?? 1) >= .55)) && fits(it.type, s)).sort((a, b) => d(a) - d(b)).slice(0, 16);
    let dest = null;
    for (const s of cands) { moveFull(S, it, s); f = sizeFix(W, it); if (f > 0 && seenAny(S, it)) { if (Math.abs(f - 1) > .01) { it.g.scale.multiplyScalar(f); settleOn(it.g, s); } dest = s; break; } }
    if (dest) out.push(`${it.type}: ${old.label} → ${dest.label} (크기)`); else put(it, old, sc0);
    const p = it.spot.part; it.g.visible = !p || p.t > .5;
  }
  W.idsDirty = true;
  return out;
}

// 관통 옮기기 (② 10/29 1.0.280 실폰 20판 "연 뚫린 거": 빨래 기둥이 꽂힌 통 안의 연): from 19판, a thing that an edge of its own piece of
// furniture runs through (fitspot.js pierced) goes to the nearest free open place where nothing does and it can be seen; a decoy
// with no such place is taken away.
export function unpierce(S) {
  const W = S.G.world, R = S.room, out = [], t0 = performance.now(), blind = blindFor(S.spec.room) || (() => false);
  R.group.updateMatrixWorld(true);
  for (const it of [...S.items]) {
    if (performance.now() - t0 > 600) break;
    if (it.own || it.lightSwitch || !it.spot?.anchor || it.found || it.friend || it.furnTarget || it.hang || it.pileHidden || it.vacHidden || it.lightSwitch || !it.g || !it.spot || (it.role !== 'target' && it.role !== 'decoy') || it.spot.part?.chainVia || it.spot.part?.device === 'chain') continue;
    if (!pierced(it.g, it.spot)) continue;
    const old = it.spot, sc0 = it.g.scale.x / (old.scale || 1), c0 = S.worldCenter(it);
    let dest = null;
    if (!old.part?.lock) {
      const d = s => s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(c0);
      const cands = R.spots.filter(s => s !== old && !s.item && !s.reserved && !s.hang && !s.wallFace && s.anchor && !blind(s) && (!s.part || (!s.part.lock && (s.part.reach ?? 1) >= .55)) && fits(it.type, s)).sort((a, b) => d(a) - d(b)).slice(0, 16);
      for (const s of cands) { moveFull(S, it, s); if (!pierced(it.g, s) && (it.role === 'decoy' || seenAny(S, it))) { dest = s; break; } }
    }
    if (dest) out.push(`${it.type}: ${old.label} → ${dest.label} (관통)`);
    else if (it.role === 'decoy') { put(it, old, sc0); it.g.parent?.remove(it.g); old.item = null; S.items.splice(S.items.indexOf(it), 1); out.push(`${it.type}: ${old.label} 뺌 (관통)`); continue; }
    else { put(it, old, sc0); out.push(`${it.type}: ${old.label} 관통 남음`); }
    const p = it.spot.part; it.g.visible = !p || p.t > .5;
  }
  W.idsDirty = true;
  return out;
}
