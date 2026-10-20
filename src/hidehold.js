// 숨기기 = 가구 놓기처럼 (10/20 user, 실폰: "숨길 때가 문제네. 기본적으로 가구 배치하듯 해야 됨. 배치 가능한 목록을 먼저 볼 수 있는
// UI 만들고 그중에서 한 아이템씩 선택하고, 선택한 거 누르면 가구처럼 이동 가능, 끌어서 회전도 가능하게. 톡 터치하는 게 카메라 이동이랑
// 헷갈려서 오동작 많이 해서 이 방법으로"). Pick a thing from the list at the bottom: it is set down in the room "held" — a glowing ring
// under it and the furniture tool over it ([↻] [여기 숨기기] [✕]). Drag the held thing (only the held thing — any other drag still moves
// the view): near a hiding place (in a drawer, under the bed…) it glows green and snaps there, a closed drawer opening to show it; anywhere
// else it sits on the surface under the finger. [여기 숨기기] keeps it there. A tap on the empty room does nothing.
// Used by 숨기기 at home (scenes/myhome.js); the scene gives: room, spotByKey, items, H, tw, G, placeTreasure(spot), freePlace(s, type, moving, ry).
import * as THREE from 'three';
import { buildItem, ITEMS } from './gfx/items.js';
import { pickSurface } from './freehide.js';
import { h, ICON } from './ui.js';

const SNAP_PX = 64;   // a hiding place this near the finger on the screen takes the thing
const V = new THREE.Vector3();
const fits = (type, s) => { const d = ITEMS[type]; return !!d && d.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || d.flat); };

// the hiding places a thing could go now (free, big enough, not a locked one for the key or the note)
function placesFor(S, type) {
  const locks = S.H.hide.locks || {}, chain = type === 'key' || type === 'note';
  return Object.values(S.spotByKey || {}).filter(s => (!s.item || s.item.type === type) && fits(type, s) && !(chain && s.part && locks[s.part.key]));
}

export function holdStart(S, type) {
  const G = S.G, W = G.world;
  if (!type) return;
  holdCancel(S, true);
  // already hidden: pick it up (its old place comes back if you let go with ✕)
  const hid = S.H.hide, at = hid.items.findIndex(e => e.item === type), prev = at >= 0 ? hid.items[at] : null;
  if (prev) S.removeItem(type);
  const g = buildItem(type, { code: hid.code || '000' }); g.traverse(o => { if (o.isMesh) o.userData.held = true; });
  S.room.group.add(g);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .3, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthTest: false }));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 10; S.room.group.add(ring);
  const ui = G.ui;
  const tool = h('div', { class: 'ftool holdtool' },
    ui.btn(null, { color: 'blue', icon: 'rotate', onClick: () => holdRotate(S) }),
    ui.btn('여기 숨기기', { color: 'green', icon: ICON.check, onClick: () => holdConfirm(S) }),
    ui.btn(null, { color: 'gray', icon: 'close', onClick: () => holdCancel(S) }));
  const label = h('div', { class: 'holdlabel' });
  ui.wui.append(tool, label);
  tool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
  S.held = { type, g, ring, tool, label, prev, prevAt: at, ry: (Math.random() - .5) * 1.2, target: null, opened: null };
  // where it first sits: out in the open on the surface in the middle of the screen (so you see it), then you drag it into a place
  let at0 = null;
  for (const [fx, fy] of [[.5, .5], [.5, .58], [.42, .52], [.58, .52], [.5, .42]]) { const s = pickSurface(W, S.room, innerWidth * fx, innerHeight * fy); if (s && !s.side && (!s.part || s.part.t > .5)) { at0 = s; break; } }
  holdTo(S, { free: at0 || { key: 'room', node: S.room.group, label: '바닥', point: S.room.group.localToWorld(new THREE.Vector3(0, 0, 0)) } });
  G.audio.sfx('pop', 4);
  const s0 = g.scale.x; S.tw.run(.3, k => g.scale.setScalar(s0 * (.4 + .6 * k + Math.sin(k * Math.PI) * .25)));
  S.onHold?.(type);
}

// put the held thing at a target: a hiding place ({ fixed: spot }) or a surface ({ free: pickSurface result })
function holdTo(S, t) {
  const H = S.held; if (!H) return;
  const W = S.G.world, R = S.room;
  // a closed drawer it snapped into opens to show it; the one it left shuts again
  const part = t.fixed?.part || null;
  if (H.opened && H.opened !== part) { const p = H.opened; H.opened = null; if (p.t > .5 && !p.busy) S.openPart(p, false); }
  if (part && part.t < .5 && !part.lock && !part.busy) { H.opened = part; S.openPart(part, true); }
  const wp = t.fixed ? R.spotWorld(t.fixed) : t.free.point.clone();
  H.g.position.copy(R.group.worldToLocal(wp.clone())); H.g.rotation.set(0, H.ry, 0);
  H.ring.position.copy(H.g.position); H.ring.position.y += .015;
  H.ring.material.color.set(t.fixed ? '#5be37a' : '#ffffff');
  H.label.textContent = t.fixed ? (t.fixed.label || '숨을 곳') : (t.free.label || '');
  H.label.classList.toggle('snap', !!t.fixed);
  if (t.fixed && H.target?.fixed !== t.fixed) S.G.audio.sfx('tap', 12);
  H.target = t;
  W.shadowDirty = true; W.idsDirty = true;
}

export function holdRotate(S) {
  const H = S.held; if (!H) return;
  H.ry += Math.PI / 4; H.g.rotation.y = H.ry; S.G.audio.sfx('click');
}

// drag: only when it starts on the held thing (or right by it); anything else is the camera's
export function holdDrag(S, x, y) {
  const H = S.held; if (!H) return null;
  const W = S.G.world, p = W.toScreen(H.g.getWorldPosition(V.set(0, 0, 0)));
  if (Math.hypot(p.x - x, p.y - y) > 70) return null;
  const R = S.room;
  return {
    move: (mx, my) => {
      // a hiding place near the finger takes it ("착")
      let best = null, bd = SNAP_PX;
      for (const s of placesFor(S, H.type)) { const q = W.toScreen(R.spotWorld(s)); const d = Math.hypot(q.x - mx, q.y - my); if (d < bd) { bd = d; best = s; } }
      if (best) { if (H.target?.fixed !== best) holdTo(S, { fixed: best }); return; }
      const s = pickSurface(W, R, mx, my, H.g);
      if (s && !s.side && (!s.part || s.part.t > .5)) holdTo(S, { free: s });
    },
    end: () => {}, cancel: () => {},
  };
}

export async function holdConfirm(S) {
  const H = S.held; if (!H || !H.target) return;
  const { type, target, ry } = H;
  holdCancel(S, true, true);   // (the held mesh goes; the real one is put by the scene's own place)
  S.selItem = type;
  let ok = true;
  if (target.fixed) await S.placeTreasure(target.fixed, ry);
  else ok = await S.freePlace(target.free, type, false, ry);
  if (!ok) holdStart(S, type);   // (nobody could ever see it there: keep holding)
  S.onHoldDone?.(ok);
}

// ✕ (or another pick): the held thing goes back — to its old place if it had one
export function holdCancel(S, quiet = false, keepPrev = false) {
  const H = S.held; if (!H) return;
  S.held = null;
  H.g.parent?.remove(H.g); H.ring.parent?.remove(H.ring); H.ring.geometry.dispose(); H.ring.material.dispose();
  H.tool.remove(); H.label.remove();
  if (H.opened && H.opened.t > .5 && !H.opened.busy) S.openPart(H.opened, false);
  if (H.prev && !keepPrev) { S.H.hide.items.splice(Math.max(0, H.prevAt), 0, H.prev); S.restoreItem(H.prev); S.G.persist(); }
  if (!quiet) S.G.audio.sfx('pop', 1);
  S.G.world.shadowDirty = true; S.G.world.idsDirty = true;
  S.onHoldDone?.(false);
}

// every frame: the tool over the held thing, the label by the ring, the ring breathing
export function holdTick(S, t) {
  const H = S.held; if (!H) return;
  const W = S.G.world, b = new THREE.Box3().setFromObject(H.g), top = W.toScreen(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .12, (b.min.z + b.max.z) / 2));
  const tw = H.tool.offsetWidth || 220; H.tool.style.left = Math.max(tw / 2 + 8, Math.min(innerWidth - tw / 2 - 8, top.x)) + 'px'; H.tool.style.top = Math.max(70, top.y) + 'px';   // (never off the edge)
  const r = W.toScreen(H.ring.getWorldPosition(V.set(0, 0, 0)));
  H.label.style.left = r.x + 'px'; H.label.style.top = (r.y + 18) + 'px';
  H.ring.scale.setScalar(1 + Math.sin(t * 6) * .12);
}
