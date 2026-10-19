// 보이는 층 (갓겜 기획안 P0 L3, 10/18 밤 user "진행하자"; 1장 2~11판, and from 10/19 every hidden-object stage after — D4): how much of the list the first screen gives away.
//   L0  seen from the start view            — one per stage, the first find (≤ 20 % of the list)
//   L1  hidden at the start, seen along at least 3 of 12 directions round it (the plan's ray measure) — at least two, one
//       of them a single turn of the dial (±45°, ±90°) away, so the first "turn to find" comes inside a minute
//   L2  hidden at the start and from the usual tilt, seen from above — 2판 puts one on the loft quilt: the tilt lesson
//   (L3 inside a drawer or door, L4 behind a lock: left as the planner put them)
// Every candidate place is measured once — a ray per direction from far out back to the place, walls cut the way that
// direction cuts them, the things themselves left out — then things move (a decoy in the way swaps places; never onto a
// lid or a rock that opens). Runs once at the start after the planner and hunt.js; returns what it did (stage.tiers).
import * as THREE from 'three';
import { ITEMS } from './gfx/items.js';
import { moveItem } from './hunt.js';
import { affOk } from './affinity.js';   // (10/19: what goes behind a door has to make sense there)

const fits = (type, s) => { const I = ITEMS[type]; return !!I && I.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || I.flat) && (I.flat || (s.maxH + .02) / (I.h * (s.scale || 1)) >= 1.25); };   // (moves only to places where the thing can be drawn at its full size — 10/19)
const shown = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
const V = () => new THREE.Vector3();

export function tierPass(S) {
  const W = S.G.world, R = S.room, t0 = performance.now();
  const start = { y: W.yaw, p: W.pitch, z: W.zoom, t: W.target.clone() };
  const restore = () => { W.yaw = start.y; W.pitch = start.p; W.zoom = start.z; W.target.copy(start.t); W.updateCam(); R.update(1); R.group.updateMatrixWorld(true); };
  restore();
  // what can hide a place: the room's meshes, not the things to find or the tap proxies
  const skip = new Set(); for (const it of S.items) it.g?.traverse(o => skip.add(o));
  const meshes = []; R.group.traverse(o => { if (o.isMesh && !o.userData.proxy && !skip.has(o)) meshes.push(o); });
  const pivots = new Set(R.parts.flatMap(p => p.pivots));
  const rides = s => { for (let o = s.anchor?.parent; o; o = o.parent) { if (pivots.has(o)) return true; if (o === s.furn?.group) return false; } return false; };
  const rc = new THREE.Raycaster();
  const C = R.spots.filter(s => !s.reserved && !s.wallFace && !s.part && s.anchor && s.kind !== 'inside');
  const P = new Map(C.map(s => [s, s.anchor.getWorldPosition(V()).add(new THREE.Vector3(0, .07 * (s.scale || 1), 0))]));
  const clear = (from, to) => { const d = V().subVectors(to, from), L = d.length(); rc.set(from, d.normalize()); rc.far = L - .1; return !rc.intersectObjects(meshes, false).some(h => shown(h.object)); };
  const along = (p, y, pi) => clear(p.clone().addScaledVector(new THREE.Vector3(Math.sin(y) * Math.cos(pi), Math.sin(pi), Math.cos(y) * Math.cos(pi)), 40), p);
  // the table: start view (the real camera, on screen and clear of the HUD), 12 directions round, one turn, from above
  const tab = new Map(C.map(s => [s, { L0: false, around: 0, low: 0, near: false, top: 0 }]));
  const cam = W.cam.position.clone();
  // (the start view checks five points of the thing — its middle, top and sides — and counts it seen if any is: a person
  // spots a star whose tip peeks through a railing; one ray at the middle called 2판's loft star hidden — 검토 재검토 1)
  const pts = s => { const p = P.get(s), k = s.scale || 1, r = .05 * k; return [p, p.clone().add(new THREE.Vector3(0, .06 * k, 0)), p.clone().add(new THREE.Vector3(r, 0, 0)), p.clone().add(new THREE.Vector3(-r, 0, 0)), p.clone().add(new THREE.Vector3(0, 0, r)), p.clone().add(new THREE.Vector3(0, 0, -r))]; };
  const onScreen = p => { const sc = W.toScreen(p); return sc.x > 24 && sc.x < W.W - 24 && sc.y > 110 && sc.y < W.H - 120; };
  for (const s of C) tab.get(s).L0 = pts(s).some(p => onScreen(p) && clear(cam, p));
  const sweep = (y, pi, fn) => { W.yaw = y; W.updateCam(); R.update(1); R.group.updateMatrixWorld(true); for (const s of C) if (along(P.get(s), y, pi)) fn(tab.get(s)); };
  // (D4 10/19: after 1장 the maps are big and outdoors — rays against hedges and trees made this up to 1 s while a stage loads; half
  // the directions there, the same shape: 6 round at the usual tilt, a quarter turn either way)
  const lite = S.idx > 10;
  for (let k = 0; k < 6; k++) for (const pi of lite ? [.62] : [.62, .95]) sweep(start.y + k * Math.PI / 3, pi, t => { t.around++; if (pi === .62) t.low++; });
  for (const d of lite ? [Math.PI / 2, -Math.PI / 2] : [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) sweep(start.y + d, start.p, t => { t.near = true; });
  if (S.idx === 1) for (let k = 0; k < 6; k++) sweep(start.y + k * Math.PI / 3, W.maxPitch ?? 1.15, t => { t.top++; });   // (as far as the dial tilts)
  restore(); S._tierTab = { tab, pts };   // (for the level tools)
  const L1 = s => !tab.get(s).L0 && tab.get(s).around >= (lite ? 2 : 3), near = s => L1(s) && tab.get(s).near;
  const L2 = s => !tab.get(s).L0 && tab.get(s).low <= 1 && tab.get(s).top >= 2;
  // moving things
  const T = () => S.targets.filter(it => !it.found && !it.friend && it.spot && !it.spot.part && tab.has(it.spot));
  const out = { l0Before: T().filter(it => tab.get(it.spot).L0).length, moved: [] };
  const free = (it, ok) => C.filter(s => s !== it.spot && ok(s) && fits(it.type, s) && (!s.item || (s.item.role === 'decoy' && fits(s.item.type, it.spot) && !rides(it.spot))))
    .map(s => ({ s, d: P.get(s).distanceTo(P.get(it.spot) || P.get(s)) + (s.kind === 'on' ? 0 : .6) + (s.item ? .3 : 0) })).sort((a, b) => a.d - b.d).map(o => o.s);
  const put = (it, s, why) => {
    const old = it.spot, d = s.item && s.item.role === 'decoy' ? s.item : null;
    if (d) moveItem(d, old);
    moveItem(it, s); out.moved.push(`${it.type}: ${old.label} → ${s.label} (${why})`);
  };
  // L0: one — the most central stays (two on a list over 10 after 1장: D4, 10/19 — a big list with one in sight read as empty)
  const keep = S.idx > 10 && S.targets.length > 10 ? 2 : 1;
  const mid = it => { const sc = W.toScreen(P.get(it.spot)); return Math.hypot(sc.x - W.W / 2, sc.y - W.H * .47); };
  const zero = T().filter(it => tab.get(it.spot).L0).sort((a, b) => mid(a) - mid(b));
  for (const it of zero.slice(keep)) { const s = free(it, s => L1(s) && !tab.get(s).L0)[0]; if (s) put(it, s, 'L0→L1'); }
  // (폰 세로 화면은 방이 한눈에 다 보여서 '처음엔 안 보이는 빈자리'가 모자라요 — 7판 2층집 8개 중 4개, 11판 냥냥이 부엌 5개가
  // 처음부터 보였어요, 리포트 v3 개선 5): what still shows goes, in turn, to a place a turn away or seen from a side or two,
  // then behind something you open (a curtain, a frame, a drawer, a door — opening is free) — never more than half the list
  // behind a door, so it stays a looking game
  const opened = () => S.targets.filter(it => !it.found && !it.friend && it.spot?.part).length;
  const soft = s => !tab.get(s).L0 && (tab.get(s).near || tab.get(s).around >= 1);
  const doors = R.spots.filter(s => s.part && !s.part.lock && !s.part.isLever && !s.part.device && !s.reserved && s.anchor && s.kind !== 'on' && !S.spec.avoid?.(s));   // (never into a place no view sees — hunt-blind.js)
  for (const it of T().filter(it => tab.get(it.spot).L0).sort((a, b) => mid(a) - mid(b)).slice(keep)) {
    const s1 = free(it, soft)[0];
    if (s1) { put(it, s1, 'L0→돌리면'); continue; }
    if ((opened() + 1) * 2 > S.targets.length) break;   // (after this move at most half behind doors: 9 things → 4, not 5 — GPT QA R2-05)
    const at = P.get(it.spot), s2 = doors.filter(s => s !== it.spot && fits(it.type, s) && affOk(it.type, s) && !s.part.wallFacing && (!s.item || (s.item.role === 'decoy' && fits(s.item.type, it.spot) && !rides(it.spot))))
      .sort((a, b) => a.anchor.getWorldPosition(V()).distanceTo(at) - b.anchor.getWorldPosition(V()).distanceTo(at))[0];
    if (s2) put(it, s2, 'L0→열어야');
  }
  if (!zero.length) { const it = T().find(x => x.spot.kind === 'on') || T()[0]; const s = it && free(it, s => tab.get(s).L0 && s.kind === 'on')[0]; if (s) put(it, s, '→L0'); }
  // L1: at least two, one a turn away
  const spare = () => T().filter(it => !tab.get(it.spot).L0 && !L1(it.spot));
  if (!T().some(it => near(it.spot))) { const it = spare()[0] || T().filter(it => L1(it.spot)).pop(); const s = it && free(it, near)[0]; if (s) put(it, s, '→L1 한 번 돌리면'); }
  while (T().filter(it => L1(it.spot)).length < 2 && spare().length) { const it = spare()[0], s = free(it, L1)[0]; if (!s) break; put(it, s, '→L1'); }
  // 2판: one on the loft quilt (or another place only seen from above)
  if (S.idx === 1 && !T().some(it => L2(it.spot))) {
    const it = spare()[0] || T().filter(it => !tab.get(it.spot).L0 && !near(it.spot)).pop() || T().filter(it => !tab.get(it.spot).L0).pop();
    const s = it && (free(it, s => s.label === '이불 위' && L2(s))[0] || free(it, L2)[0] || free(it, s => s.label === '이불 위')[0]);
    if (s) put(it, s, 'L2 기울이기');
  }
  const t = T();
  Object.assign(out, { l0After: t.filter(it => tab.get(it.spot).L0).length, l1: t.filter(it => L1(it.spot)).length, near: t.filter(it => near(it.spot)).length,
    l2: t.filter(it => L2(it.spot)).length, n: S.targets.length, places: C.length, ms: Math.round(performance.now() - t0) });
  W.idsDirty = true; W.shadowDirty = true;
  return out;
}

// 2판's room: a curtain round the loft (room.js buildLoft) so the quilt is seen only from above — the tilt lesson's place.
// Nothing else in 토순이네 침실 is hidden at the first view and seen from above (measured at phone size, 10/18): the loft
// is open through its railing, the wardrobe top shows from everywhere.
export const tiltLayout = Lay => ({ ...Lay, lofts: (Lay.lofts || []).map(l => ({ ...l, curtain: true })) });
