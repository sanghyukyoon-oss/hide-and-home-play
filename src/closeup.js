// 말할 때·끝날 때 카메라 (user 10/19, from playing 1~10판 on the phone: "마지막에 캐릭터가 등장하거나 말하는 경우 카메라를 잘
// 잡아 줘야지… 약간 클로즈업해서, 이즈아웃 스무스하게"; the 스토리 룸 listed when and whom). Only at the moments a friend
// pops out or a stage ends — never while you look for things (the user dislikes a camera that moves without the finger),
// and not like the 10/17 cinematic talk camera the user threw out on 10/18 ("너무 느려진다"): no letterbox and no turning,
// just a short (0.65 s) smooth ease-out pan and zoom in (×1.5 of the stage's start view), and the same way back.
//   - someone already big near the middle: no move at all
//   - a finger on the glass: the camera is handed over on the spot (the move stops; no going back later either)
//   - the view moved by hand after the close-up settled (a drag, the dial, the zoom gauge, a button): no going back either
//     (GPT QA R2-07 10/19: the return used to undo a move that had already ended — only fingers still down were seen)
// ?closeup=0 turns it off.
import * as THREE from 'three';
import { ease, clamp } from './util.js';

export const CLOSEUP_ON = typeof location === 'undefined' || !/[?&]closeup=0(&|$)/.test(location.search);
const DUR = .65, AT_Y = .44;   // where the face goes: a little above the middle (the dialog card sits at the bottom)

// the spot to look at: the head of one character, or the middle of several
function headOf(chs) {
  const p = new THREE.Vector3(); let n = 0;
  for (const c of chs) { const r = c?.root; if (!r?.visible) continue; const q = r.getWorldPosition(new THREE.Vector3()); q.y += (c.headTop?.() ?? .4) * .7; p.add(q); n++; }
  return n ? p.divideScalar(n) : null;
}

// the camera's zoom and target that put P at (W/2, H*AT_Y) at zoom z (the view's yaw and pitch stay as they are)
function framing(W, P, z) {
  const save = { zoom: W.zoom, t: W.target.clone() };
  W.zoom = z; W.target.set(P.x, W.target.y, P.z); W.updateCam();
  // slide along the view so P (not its foot on the target plane) is in the middle, then lift it to AT_Y
  const s = W.toScreen(P), a = W.screenToGround(W.W / 2, W.H / 2, W.target.y), b = W.screenToGround(s.x, s.y, W.target.y);
  if (a && b) W.target.add(b.sub(a));
  W.updateCam();
  const c = W.screenToGround(W.W / 2, W.H / 2, W.target.y), d = W.screenToGround(W.W / 2, W.H * AT_Y, W.target.y);
  if (c && d) W.target.add(c.sub(d));
  const out = { zoom: z, target: W.target.clone() };
  W.zoom = save.zoom; W.target.copy(save.t); W.updateCam();
  return out;
}

// glide zoom and target to `to`; a finger on the glass stops it where it is and hands the camera over (→ false). A newer
// glide (the next speaker) takes over from wherever this one is.
async function glide(S, to) {
  const W = S.G.world, z0 = W.zoom, t0 = W.target.clone(), id = S._glideId = (S._glideId || 0) + 1; let gave = false;
  W.flying = true; W.zoomGoal = null; W.yawGoal = null; S._closeAt = null;
  await S.tw.run(DUR, k => {
    if (gave || S.dead || S._glideId !== id) return;
    if (W.ptrs?.size) { gave = true; W.flying = false; return; }
    W.zoom = z0 + (to.zoom - z0) * k; W.target.lerpVectors(t0, to.target, k);
  }, ease.outCubic);
  if (S._glideId === id && !gave) { W.flying = false; S._closeAt = view(W); }   // where it settled: a later change is the player's
  return !gave;
}
const view = W => ({ zoom: W.zoom, yaw: W.yaw, pitch: W.pitch, target: W.target.clone() });
const moved = (W, v) => Math.abs(W.zoom - v.zoom) > 1e-3 || Math.abs(W.yaw - v.yaw) > 1e-3 || Math.abs(W.pitch - v.pitch) > 1e-3 || W.target.distanceTo(v.target) > 1e-3;

// come in on one or more characters. Returns the view to go back to, or null when nothing moved.
export async function closeUp(S, chs, { mul = 1.5 } = {}) {
  const G = S.G, W = G.world;
  if (!CLOSEUP_ON || S.dead || G.bot || W.camLock || W.ptrs?.size) return null;
  chs = (Array.isArray(chs) ? chs : [chs]).filter(Boolean);
  const P = headOf(chs); if (!P) return null;
  W.updateCam();
  const base = S.view0?.zoom || 1, z = clamp(Math.max(W.zoom, base * (chs.length > 1 ? mul * .85 : mul)), W.minZoom, W.maxZoom);
  const s = W.toScreen(P);
  if (W.zoom >= z * .92 && Math.abs(s.x - W.W / 2) < W.W * .22 && Math.abs(s.y - W.H * AT_Y) < W.H * .16) return null;   // already big near the middle
  const back = S._closeBack || { zoom: W.zoom, target: W.target.clone() };   // (moving on to the next speaker: still the first view)
  S._closeBack = back;
  const done = await glide(S, framing(W, P, z));
  if (!done) { S._closeBack = null; return null; }
  return back;
}

// back to the view from before the close-up (if you haven't taken the camera since: a finger down now, or the view
// changed since the close-up settled; a close-up still gliding is simply turned round)
export async function closeBack(S) {
  const back = S._closeBack, at = S._closeAt; S._closeBack = S._closeAt = null;
  const W = S.G.world;
  if (!back || S.dead || W.ptrs?.size) return;
  if (!W.flying && (!at || moved(W, at))) return;
  await glide(S, back);
}
