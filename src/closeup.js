// 말할 때·끝날 때 카메라 (user 10/19, from playing 1~10판 on the phone: "마지막에 캐릭터가 등장하거나 말하는 경우 카메라를 잘
// 잡아 줘야지… 약간 클로즈업해서, 이즈아웃 스무스하게"; the 스토리 룸 listed when and whom). Only at the moments a friend
// pops out or a stage ends — never while you look for things (the user dislikes a camera that moves without the finger),
// and not like the 10/17 cinematic talk camera the user threw out on 10/18 ("너무 느려진다"): no letterbox, a short smooth
// ease-out, and the same way back.
//   - portrait (a stage's end, a friend found, and who speaks in those talks — user 10/19: "스테이지 끝날 때마다 마지막에
//     캐릭터 잡을 때 로테이션이랑 스케일감 통일되면 좋겠는데? 캐릭터 정면으로 항상 비슷한 앵글로 이즈아웃해서"): every
//     stage the same shot — the stage's start view (the diagonal its room is laid out for) at the same tilt; if something
//     stands in front of the character there (the floor's front edge, a wall, another floor), a little higher tilt, then the
//     diagonals beside it, then the back one (the one it is least hidden from), the character
//     a fifth of the screen tall with its feet a little under the middle, turned to face you. A longer turn takes a little
//     longer (0.8 s, up to 1.15 s for half a turn).
//     Measured on the screen like bossgame.leadStage / the lobby's close-up, so the size doesn't depend on the room.
//     Later speakers in the same talk keep that view's turn and tilt and are framed the same size.
//   - light (먹물이 found mid-stage): no turning, ×1.5 of the start view, the face a little above the middle
//   - someone already framed: no move at all
//   - a finger on the glass: the camera is handed over on the spot (the move stops; no going back later either)
//   - the view moved by hand after the close-up settled (a drag, the dial, the zoom gauge, a button): no going back either
//     (GPT QA R2-07 10/19: the return used to undo a move that had already ended — only fingers still down were seen)
// ?closeup=0 turns it off.
import * as THREE from 'three';
import { ease, clamp } from './util.js';

export const CLOSEUP_ON = typeof location === 'undefined' || !/[?&]closeup=0(&|$)/.test(location.search);
const DUR = .65, AT_Y = .44;   // light: where the face goes — a little above the middle (the dialog card sits at the bottom)
const P_DUR = .8, P_PITCH = .45, P_SIZE = .2, P_FEET = .56, P_WIDE = .8;   // portrait: tilt, height (a fifth), feet, row width — as the lobby's close-up and bossgame.leadStage
const DIAG = [0, 1, 2, 3].map(k => Math.PI / 4 + k * Math.PI / 2);
const P_PITCH2 = .62;   // portrait: the tilt tried next when something stands in front at the first (the floor's front edge)
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

const posOf = c => c.root.getWorldPosition(new THREE.Vector3());
// the spot to look at: the head of one character, or the middle of several
function headOf(chs) {
  const p = new THREE.Vector3(); let n = 0;
  for (const c of chs) { const q = posOf(c); q.y += (c.headTop?.() ?? .4) * .7; p.add(q); n++; }
  return n ? p.divideScalar(n) : null;
}

// how much of a character something stands in front of, as the camera is now: a 5×3 grid over it on the screen; a
// point counts only where the ray reaches the character and something else (a wall, the floor's front edge, another
// floor, furniture, someone else) comes first — points beside its outline don't count
function covered(W, c) {
  // (the box from the feet and the head's height, about as wide as tall: a character's whole box takes in the flat shadow
  // disc at its feet, far wider than it is)
  const p = posOf(c), h = c.headTop?.() ?? .5, right = new THREE.Vector3(1, 0, 0).applyQuaternion(W.cam.quaternion); right.y = 0; right.normalize();
  const f = W.toScreen(p), t = W.toScreen(p.clone().setY(p.y + h)), r = W.toScreen(p.clone().addScaledVector(right, h * .5));
  const hw = Math.abs(r.x - f.x), x0 = f.x - hw, x1 = f.x + hw, y0 = t.y, y1 = f.y;
  const mine = o => { for (; o; o = o.parent) if (o === c.root) return true; return false; };
  let n = 0;
  for (const fx of [.15, .33, .5, .67, .85]) for (const fy of [.12, .45, .8]) {
    let other = false;
    for (const hit of W.pick(x0 + (x1 - x0) * fx, y1 - (y1 - y0) * fy, [W.root])) {
      if (hit.object.userData.proxy || !hit.object.visible) continue;
      if (mine(hit.object)) { if (other) n++; break; }
      other = true;
    }
  }
  return n;
}

// the target that puts the point P at (atX, H*atY) at zoom z (with the view's current turn and tilt)
function placeAt(W, P, z, atY, atX = W.W / 2) {
  W.zoom = z; W.target.set(P.x, W.target.y, P.z); W.updateCam();
  // slide along the view so P (not its foot on the target plane) is in the middle, then move it to atY
  const s = W.toScreen(P), a = W.screenToGround(W.W / 2, W.H / 2, W.target.y), b = W.screenToGround(s.x, s.y, W.target.y);
  if (a && b) W.target.add(b.sub(a));
  W.updateCam();
  const c = W.screenToGround(W.W / 2, W.H / 2, W.target.y), d = W.screenToGround(atX, W.H * atY, W.target.y);
  if (c && d) W.target.add(c.sub(d));
  W.updateCam();
  return W.target.clone();
}
const view = W => ({ zoom: W.zoom, yaw: W.yaw, pitch: W.pitch, target: W.target.clone() });
function setView(W, v) { W.zoom = v.zoom; W.yaw = v.yaw; W.pitch = v.pitch; W.target.copy(v.target); W.updateCam(); }
const moved = (W, v) => Math.abs(W.zoom - v.zoom) > 1e-3 || Math.abs(W.yaw - v.yaw) > 1e-3 || Math.abs(W.pitch - v.pitch) > 1e-3 || W.target.distanceTo(v.target) > 1e-3;

// light: the view's turn and tilt as they are, zoom ×mul of the start view, the faces a little above the middle
function lightShot(S, chs, mul) {
  const W = S.G.world, P = headOf(chs); if (!P) return null;
  const z = clamp(Math.max(W.zoom, (S.view0?.zoom || 1) * (chs.length > 1 ? mul * .85 : mul)), W.minZoom, W.maxZoom);
  const s = W.toScreen(P);
  if (W.zoom >= z * .92 && Math.abs(s.x - W.W / 2) < W.W * .22 && Math.abs(s.y - W.H * AT_Y) < W.H * .16) return null;   // already big near the middle
  const save = view(W), target = placeAt(W, P, z, AT_Y); setView(W, save);
  return { zoom: z, yaw: W.yaw, pitch: W.pitch, target };
}

// portrait: the same shot every stage (see the top). keepTurn: a later speaker in the same talk — this view's turn and tilt.
function portraitShot(S, chs, keepTurn) {
  const W = S.G.world, save = view(W), room = S.room;
  const feet = chs.map(posOf), F = feet.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(feet.length);
  const top = Math.max(...chs.map(c => c.headTop?.() ?? .5));
  const pitches = keepTurn ? [W.pitch] : [P_PITCH, P_PITCH2].map(v => clamp(v, W.minPitch, W.maxPitch));
  // the stage's own start view first (the diagonal the room is laid out for: its walls behind, nothing in front), then the
  // two beside it, then the back one — taken the short way round from where the view is now
  const home = S.view0?.yaw ?? Math.PI / 4;
  const yaws = keepTurn ? [W.yaw] : DIAG.map(d => home + wrap(d - home)).sort((a, b) => Math.abs(a - home) - Math.abs(b - home)).map(y => W.yaw + wrap(y - W.yaw));
  let best = null, bestN = Infinity;
  search: for (const yaw of yaws) for (const pitch of pitches) {
    W.yaw = yaw; W.pitch = pitch;
    // the size at zoom 1, measured on the screen: feet to the top of the tallest head, and the row's width
    W.zoom = 1; W.target.set(F.x, save.target.y, F.z); W.updateCam();
    const ys = feet.map(p => W.toScreen(p)), hs = feet.map(p => W.toScreen(p.clone().setY(p.y + top)));
    const tall = Math.max(1, ...ys.map((f, i) => f.y - hs[i].y)), xs = ys.map(f => f.x), wide = Math.max(...xs) - Math.min(...xs) + tall * .6;
    // (a little past the play zoom's limit for the small ones — a penguin is a fifth of the screen only at ×10.6 — so every
    // stage's shot is the same size; nothing is played at that zoom: the win panel comes, or the view goes back)
    const z = clamp(Math.min(W.H * P_SIZE / tall, W.W * P_WIDE / Math.max(1, wide)), W.minZoom, W.maxZoom * 1.3);
    const target = placeAt(W, F, z, P_FEET);
    room?.update?.(1);   // (the walls that hide themselves for this view)
    const n = chs.reduce((s, c) => s + covered(W, c), 0);
    if (n < bestN) { best = { zoom: z, yaw, pitch, target, anchor: F }; bestN = n; }   // (the start view wins a tie: the list starts there)
    if (!n) break search;
  }
  setView(W, save); room?.update?.(1);
  if (!moved(W, best)) return null;   // already framed so
  return best;
}

// glide to the view `to` (and turn the characters to face it); a finger on the glass stops it where it is and hands the
// camera over (→ false). A newer glide (the next speaker) takes over from wherever this one is.
// anchor (portrait): the view turns round the character's feet, which slide on the screen from where they are now to
// where they end up — it stays in the picture all the way (a straight slide of the look-at point while the view turned
// swung it out of the screen half way)
async function glide(S, to, dur = DUR, face = [], anchor = null) {
  const W = S.G.world, from = view(W), dy = wrap(to.yaw - from.yaw), id = S._glideId = (S._glideId || 0) + 1; let gave = false;
  const a0 = anchor && W.toScreen(anchor), a1 = anchor && screenIn(W, to, anchor);
  const turns = face.map(c => ({ c, r0: c.root.rotation.y, d: wrap(to.yaw - c.root.rotation.y) }));   // facing the camera = the view's turn
  W.flying = true; W.zoomGoal = null; W.yawGoal = null; W.vYaw = 0; S._closeAt = null;
  await S.tw.run(dur, k => {
    if (gave || S.dead || S._glideId !== id) return;
    if (W.ptrs?.size) { gave = true; W.flying = false; return; }
    W.zoom = from.zoom + (to.zoom - from.zoom) * k; W.yaw = from.yaw + dy * k; W.rawYaw = W.yaw; W.pitch = from.pitch + (to.pitch - from.pitch) * k;
    if (anchor) { if (k >= 1) W.target.copy(to.target); else placeAt(W, anchor, W.zoom, (a0.y + (a1.y - a0.y) * k) / W.H, a0.x + (a1.x - a0.x) * k); }
    else W.target.lerpVectors(from.target, to.target, k);
    for (const t of turns) t.c.root.rotation.y = t.r0 + t.d * k;
  }, ease.outCubic);
  if (S._glideId === id && !gave) { W.flying = false; S._closeAt = view(W); }   // where it settled: a later change is the player's
  return !gave;
}
// where P is on the screen in the view v
function screenIn(W, v, P) { const save = view(W); setView(W, v); const s = W.toScreen(P); setView(W, save); return s; }

// come in on one or more characters. Returns the view to go back to, or null when nothing moved.
export async function closeUp(S, chs, { portrait = false, mul = 1.5 } = {}) {
  const G = S.G, W = G.world;
  if (!CLOSEUP_ON || S.dead || G.bot || W.camLock || W.ptrs?.size) return null;
  chs = (Array.isArray(chs) ? chs : [chs]).filter(c => c?.root?.visible);
  if (!chs.length) return null;
  W.updateCam();
  const to = portrait ? portraitShot(S, chs, !!S._closePortrait) : lightShot(S, chs, mul);
  if (!to) return null;
  const back = S._closeBack || view(W);   // (moving on to the next speaker: still the first view)
  S._closeBack = back; if (portrait) S._closePortrait = true;
  S._closeAnchor = to.anchor || null;
  const done = await glide(S, to, portrait ? P_DUR + .35 * Math.abs(wrap(to.yaw - W.yaw)) / Math.PI : DUR, portrait ? chs : [], to.anchor);
  if (!done) { S._closeBack = null; S._closePortrait = false; S._closeAnchor = null; return null; }
  return back;
}

// back to the view from before the close-up (if you haven't taken the camera since: a finger down now, or the view
// changed since the close-up settled; a close-up still gliding is simply turned round)
export async function closeBack(S) {
  const back = S._closeBack, at = S._closeAt, por = S._closePortrait, anchor = S._closeAnchor; S._closeBack = S._closeAt = S._closeAnchor = null; S._closePortrait = false;
  const W = S.G.world;
  if (!back || S.dead || W.ptrs?.size) return;
  if (!W.flying && (!at || moved(W, at))) return;
  await glide(S, back, por ? P_DUR + .35 * Math.abs(wrap(back.yaw - W.yaw)) / Math.PI : DUR, [], por ? anchor : null);
}
