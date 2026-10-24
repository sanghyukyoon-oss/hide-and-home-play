// 판 시작·끝 연출 (③ 10/21, user: "27부터는 뭔가 여행 분위기로 스토리 작가 연출 좀… 19-26이 너무 재미없어서"): the story
// room's staging table (_handoff/plan-19to50.json → script.js scene.stage = { start, moment, end }) played inside the stage —
// 3–6 s at its start (after the banner, before the talk) and at its end (after the cheer, before the closing words). Never a
// scene between stages. A touch anywhere skips to the end of it. Not for bots, previews, my-room visits or a retry's start.
// Each key: { start(S, c), hide(S, ov), end(S, c) } — c.wait(s) resolves at once once skipped; c.skipped.
import * as THREE from 'three';
import { h } from './ui.js';
import { sceneAt } from './script.js';
import { ease } from './util.js';
import { trainView } from './gfx/traincar-props.js';
import { Char } from './gfx/chars.js';
import { closeBack } from './closeup.js';
import { moveItem } from './hunt.js';
import { ITEMS } from './gfx/items.js';
import { spotFits } from './fitspot.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// (21·31판 bosses: the key sits on the boss's story object — script.js BOSSES → story.js storyFor)
const keyOf = (S, phase) => !S.custom && !S.preview && !S.model && !S.G.bot ? sceneAt(S.idx)?.stage?.[phase] || S.story?.stage?.[phase] || null : null;
// the zoom that shows a box about `frac` of the screen wide (measured, like closeShot: the fit depends on the room)
function fitZoom(W, box, frac = .8) {
  const t0 = W.target.clone(), z0 = W.zoom, c = box.getCenter(V(0, 0, 0));
  W.target.copy(c); W.zoom = 1; W.updateCam();
  let w = 0; for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) for (const y of [box.min.y, box.max.y]) { const p = W.toScreen(V(x, y, z)); w = Math.max(w, Math.abs(p.x - W.W / 2) * 2); }
  W.target.copy(t0); W.zoom = z0; W.updateCam();
  return Math.max(.6, Math.min(6, W.W * frac / Math.max(1, w)));
}
const furnOf = (S, type) => { for (const R of S.room.rooms || [S.room]) for (const r of R.furns) if (r.type === type) return { R, r }; return null; };

export async function staging(S, phase) {
  if (phase === 'start' && S.retryRun) return;
  const k = keyOf(S, phase), fx = k && FX[k]?.[phase]; if (!fx) return;
  const G = S.G, W = G.world, back = { target: W.target.clone(), zoom: W.zoom, yaw: W.yaw, pitch: W.pitch };
  let skip = null; const skipped = new Promise(r => { skip = r; });
  const c = { skipped: false, wait: s => Promise.race([S.tw.wait(s), skipped]) };
  const ov = h('div', { class: 'stg-skip' }); ov.addEventListener('pointerdown', e => { e.stopPropagation(); c.skipped = true; skip(); });
  document.getElementById('overlay').append(ov);
  // (the stage left mid-scene — pause → home: its tweens stop, so nothing above would ever finish and the touch layer
  // would stay over the next scene)
  let iv = 0; const gone = new Promise(r => { iv = setInterval(() => { if (S.dead || G.scene !== S) r(); }, 150); });
  try { await Promise.race([fx(S, c), skipped.then(() => S.tw.wait(.05)), gone]); } catch (e) { console.warn('staging', k, e); }
  clearInterval(iv); ov.remove();
  if (c.skipped) c.finish?.();
  if (S.dead) return;
  // (back to where the stage is played from)
  if (phase === 'start') await W.flyTo(S.tw, { ...back, dur: .45 });
}
// while the friend hides (사건 판, r1Hide's eyes-shut card)
export function stagingHide(S, ov) { const k = keyOf(S, 'start'); FX[k]?.hide?.(S, ov); }
export const stagingHasHide = S => !!FX[keyOf(S, 'start')]?.hide;
export function stagingHidden(S) { const k = keyOf(S, 'start'); FX[k]?.hidden?.(S); }

// ── 28판 시작: 창밖이 흐르고 객실이 살짝 흔들린다 → 숨는 동안 터널(까만 1초) → 밝아지면 너굴이 자리에 모자만
function flowWindows(S) {
  // (traincar4 ⑧ 10/23: its windows and the land outside flow on their own — only the rumble starts here)
  const tex = trainView(); if (S._flow || (!tex && !furnOf(S, 'tc4scenery') && !furnOf(S, 'tc5shell') && !furnOf(S, 'tc6shell'))) return;
  S._flow = true;
  if (tex) {
    tex.wrapS = THREE.MirroredRepeatWrapping; tex.needsUpdate = true;
    // (the whole stage: the train is moving)
    S.ambient?.ticks.push(t => { tex.offset.x = t * .14; });
  }
  S.G.audio.loopSfx?.('trainRumble', .45);
}
function sway(S, dur, amp = .004) {
  const g = S.room.group, z0 = g.rotation.z;
  return S.tw.run(dur, k => { g.rotation.z = z0 + Math.sin(k * dur * 11) * amp * Math.sin(k * Math.PI); }).then(() => { g.rotation.z = z0; });
}
function hatMesh() {
  // (사용자 메모 10/24 28판 "가방, 모자 오브젝트 디테일"): 너굴이's straw hat — a wide brim in woven rings, a round crown with a dent,
  // a red ribbon round it tied in a bow at the side with two tails
  const g = new THREE.Group(), m = c => new THREE.MeshToonMaterial({ color: c });
  const add = (geo, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m(c)); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); g.add(o); return o; };
  add(new THREE.CylinderGeometry(.19, .19, .016, 32), '#f2d58a');
  for (const [r, c] of [[.185, '#e3c06a'], [.16, '#f7e3a8'], [.135, '#e3c06a']]) add(new THREE.TorusGeometry(r, .006, 4, 32), c, 0, .009, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(.112, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#f5dc94', 0, .008, 0, 0, 0, 0, 1, 1.05, 1);
  add(new THREE.CylinderGeometry(.03, .05, .02, 14), '#ecc977', 0, .12, 0);
  add(new THREE.CylinderGeometry(.114, .114, .034, 24, 1, true), '#e2584f', 0, .03, 0);
  add(new THREE.SphereGeometry(.026, 10, 8), '#e2584f', .1, .035, .05, 0, .6, 0, 1.2, .8, .6); add(new THREE.SphereGeometry(.026, 10, 8), '#e2584f', .1, .035, -.0, 0, -.6, 0, 1.2, .8, .6);
  add(new THREE.BoxGeometry(.016, .05, .012), '#c94a42', .12, .0, .03, 0, 0, .3); add(new THREE.BoxGeometry(.016, .05, .012), '#c94a42', .125, .0, .0, 0, 0, -.25);
  add(new THREE.SphereGeometry(.014, 8, 6), '#c94a42', .11, .035, .025);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const tunnel = {
  async start(S, c) {
    const G = S.G, W = G.world;
    flowWindows(S);
    // in to the window at seat height, the carriage rocking a little
    // (the window that faces the camera — one on the far wall, seen from inside the carriage; any train window piece: twindow,
    // twindow2 — traincar3's big flowing ones, ③ 10/22 — and never one with its blind down)
    let win = null, best = -1; const cd = V(0, 0, 0); W.cam.getWorldDirection(cd);
    for (const R of S.room.rooms || [S.room]) for (const r of [...R.furns, ...(R.decors || [])]) {
      if (!/^twindow|^gpt_tc2_window/.test(r.type) || r.f.parts?.some(q => /블라인드/.test(q.label) && q.t < .5)) continue;   // (gpt_tc2_window: 28판 두 량 객차의 흐르는 창, ② 10/22)
      const g = r.f.group, n = V(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion())), d = -n.dot(cd);
      if (d > best) { best = d; const b = new THREE.Box3(); g.traverse(o => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry') b.expandByObject(o); }); win = { c: b.isEmpty() ? g.getWorldPosition(V(0, 1.5, 0)) : b.getCenter(V(0, 0, 0)), n }; }
    }
    if (win && best > .2) W.flyTo(S.tw, { target: V(win.c.x, win.c.y - .25, win.c.z), zoom: Math.max(W.zoom * 1.8, 2.6), dur: .6 });
    await Promise.race([sway(S, 2.6), c.wait(2.6)]);
  },
  hide(S, ov) {
    ov.classList.add('tunnel'); S.G.audio.sfx('tunnel');
    sway(S, 1.4, .007);
  },
  hidden(S) {
    const p = S.friendHome; if (!p) return;
    const hat = hatMesh(), R = S.room.rooms ? S.room.rooms[0] : S.room;
    const lp = R.group.worldToLocal(p.clone()); hat.position.set(lp.x, lp.y + .02, lp.z); hat.rotation.set(.12, Math.random() * 6, .08);
    R.group.add(hat); S.stgHat = hat;
  },
};

// ── 27판 끝: 기차가 들어와 멈추고 문이 치익 → 개굴이가 폴짝 타고 → 문 앞 바닥의 까만 발자국
function prints(R, x, y, z, ax, n = 3) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#2a2233' });
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1, px = x - ax * (n - 1 - i) * .2, pz = z + .16 * (n - 1 - i) / (n - 1 || 1) + s * .03;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(.035, 12), m); pad.rotation.x = -Math.PI / 2; pad.position.set(px, y, pz); g.add(pad);
    for (const [dx, dz] of [[-.03, -.035], [0, -.048], [.03, -.035]]) { const t = new THREE.Mesh(new THREE.CircleGeometry(.013, 8), m); t.rotation.x = -Math.PI / 2; t.position.set(px + dx, y, pz + dz); g.add(t); }
  }
  R.group.add(g); return g;
}
const trainIn = {
  async end(S, c) {
    const G = S.G, W = G.world, F = furnOf(S, 'train'); if (!F?.r.f.car) return;
    const { R, r } = F, car = r.f.car, x0 = S.stgCarAway ? car.position.x + 40 : car.position.x, f = S.friend;
    S.stgCarAway = false;
    const doors = r.f.doors || [];
    const fp = f?.root.getWorldPosition(V(0, 0, 0));
    const door = doors.map(d => ({ d, p: d.getWorldPosition(V(0, 0, 0)) })).sort((a, b) => (fp ? a.p.distanceTo(fp) - b.p.distanceTo(fp) : 0))[0];
    c.finish = () => { car.position.x = x0; if (door) door.d.position.x = door.d.userData.x0 ?? door.d.position.x; };
    // the track, then the train comes in from the far end and slows to a stop
    car.position.x = x0; car.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(car), cp = box.getCenter(V(0, 0, 0));
    W.flyTo(S.tw, { target: cp, zoom: fitZoom(W, box, .95), dur: .5 });
    car.position.x = x0 - 9; G.audio.sfx('trainArrive');
    // (the wind of it: the cherry petals fly)
    setTimeout(() => !S.dead && S.ambient?.gust?.(), 900);
    await Promise.race([S.tw.run(2.4, k => { car.position.x = x0 - 9 * (1 - k); car.position.y = Math.sin(k * 40) * .006 * (1 - k); W.shadowDirty = true; }, ease.outCubic), c.wait(2.4)]);
    car.position.set(x0, 0, car.position.z); if (S.dead || c.skipped || !door) return;
    // the door slides open, 치익
    await c.wait(.2); G.audio.sfx('trainDoor');
    const dx0 = door.d.userData.x0 = door.d.position.x;
    await Promise.race([S.tw.run(.4, k => { door.d.position.x = dx0 + .5 * k; }, ease.outCubic), c.wait(.4)]);
    if (S.dead || c.skipped) return;
    // 개굴이 hops up to the door and in
    const dp = door.d.getWorldPosition(V(0, 0, 0)), lp = R.group.worldToLocal(dp.clone());
    const gy = f ? f.root.position.y : 0;
    if (f) {
      f.on = false; f.pose = 'cheer'; f.setFace?.('happy');
      await f.hopTo?.(S.tw, lp.x, lp.z + .5, { height: .35, dur: .4, sfx: n => G.audio.sfx(n) });
      if (S.dead || c.skipped) return;
      const from = f.root.position.clone();
      await S.tw.run(.35, k => { f.root.position.set(from.x, from.y + Math.sin(k * Math.PI) * .3 + .2 * k, from.z - .45 * k); f.root.scale.setScalar(1 - .7 * k); });
      f.root.visible = false; G.audio.sfx('pop', 2);
    }
    // the black footprints at the door: they got on too
    S.stgPrints = prints(R, lp.x - .05, gy + .012, lp.z + .62, -1);
    await W.flyTo(S.tw, { target: V(dp.x, dp.y - .3, dp.z + .5), zoom: Math.min(4.5, Math.max(2.4, W.zoom * 2)), dur: .6 });
    await c.wait(.9);
  },
};

// ── 30판 끝: 하늘이 노을빛으로 → 멀리 돌아가는 기차가 빠앙 지나감 → 몽글이 폴짝
function trainSilhouette() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64; const x = cv.getContext('2d');
  x.fillStyle = '#5b3f73';
  for (let k = 0; k < 3; k++) { x.beginPath(); x.roundRect ? x.roundRect(8 + k * 166, 10, 158, 46, 12) : x.rect(8 + k * 166, 10, 158, 46); x.fill(); }
  x.fillStyle = '#ffd98a'; for (let k = 0; k < 3; k++) for (let w = 0; w < 5; w++) x.fillRect(22 + k * 166 + w * 28, 20, 16, 12);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, .5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  m.layers.set(2); m.renderOrder = 2;
  return m;
}
const SUN = { ambColor: '#ffc2a6', sunColor: '#ff9a5c', bg: ['#ff9f86', '#ffd3a1'] };
const sunsetTrain = {
  async end(S, c) {
    const G = S.G, W = G.world, R = S.room.rooms ? S.room.rooms[0] : S.room;
    const hc = W.hemi.color.clone(), sc = W.sun.color.clone(), hi = W.hemi.intensity, si = W.sun.intensity;
    const th = hc.clone().set(SUN.ambColor), ts = sc.clone().set(SUN.sunColor);
    const bg0 = S.th?.bg || ['#ffe9d6', '#fff6ea'], A = new THREE.Color(bg0[0]), B = new THREE.Color(bg0[1]), A1 = new THREE.Color(SUN.bg[0]), B1 = new THREE.Color(SUN.bg[1]);
    const glow = k0 => { const k = k0 * .6; W.hemi.color.copy(hc).lerp(th, k); W.sun.color.copy(sc).lerp(ts, k); W.hemi.intensity = hi * (1 - .08 * k); W.sun.intensity = si * (1 - .15 * k); G.setBg(['#' + A.clone().lerp(A1, k0).getHexString(), '#' + B.clone().lerp(B1, k0).getHexString()]); };
    c.finish = () => glow(1);
    W.flyTo(S.tw, { zoom: W.zoom * .8, dur: 1.2 });
    await Promise.race([S.tw.run(1.6, glow, ease.inOutQuad), c.wait(1.6)]);
    glow(1); if (S.dead || c.skipped) return;
    // far off behind the room, the train home goes by — 빠앙
    // (behind the room as you look at it, crossing from one side to the other, facing you)
    const cd = V(0, 0, 0); W.cam.getWorldDirection(cd); cd.y = 0; cd.normalize();
    const rt = V(-cd.z, 0, cd.x), far = Math.max(R.w, R.d) / 2 + 1.8, ctr = R.group.getWorldPosition(V(0, 0, 0)).addScaledVector(cd, far), half = Math.max(R.w, R.d) / 2 + 2;
    const tr = trainSilhouette(), P0 = ctr.clone().addScaledVector(rt, -half).setY(.05), P1 = ctr.clone().addScaledVector(rt, half).setY(.05);
    tr.scale.setScalar(1.6); W.scene.add(tr); S.stgTrain = tr;
    G.audio.sfx('trainHorn');
    const hero = S.hero?.ch;
    if (hero) { hero.setFace?.('wow'); setTimeout(() => { if (S.dead) return; hero.setFace?.('happy'); hero.hopTo?.(S.tw, hero.root.position.x - .25, hero.root.position.z, { height: .35, dur: .38 }); }, 700); }
    await Promise.race([S.tw.run(3.4, k => { tr.position.lerpVectors(P0, P1, k); tr.quaternion.copy(W.cam.quaternion); }), c.wait(3.4)]);
    tr.parent?.remove(tr);
  },
};

// ── 19~26판: 있는 블록으로 — 카메라 컷, 경례·폴짝·부르르, 느낌표, 작은 소품
const chOf = S => S.friend || null;
const scr = (W, ch, k = .5) => W.toScreen(V(ch.root.position.x, ch.root.position.y + ch.headTop() * ch.root.scale.y * k, ch.root.position.z));
const hopK = (h, k) => h * 4 * k * (1 - k);
// a close look at someone: in front of them, about a third of the screen tall
// (from a turn and tilt where nothing stands in the way — stage.js helloView, 26판's yard wall hid 멍뭉이)
function lookAt(S, ch, zoomMul = 1.7, dur = .55) {
  const W = S.G.world, p = ch.root.getWorldPosition(V(0, 0, 0)); p.y += ch.headTop() * .5;
  const view = S.helloView ? S.helloView(ch, p, { target: W.target.clone(), yaw: W.yaw, pitch: W.pitch, zoom: W.zoom }) : {};
  return W.flyTo(S.tw, { target: p, zoom: Math.min(6, Math.max(2.2, W.zoom * zoomMul)), ...view, dur });
}
// 경례: turn to you, a hop with the paw up, a happy face
async function salute(S, ch, sfx = null) {
  const G = S.G, W = G.world; if (!ch) return;
  ch.faceTo(W.cam.position.x, W.cam.position.z); ch.pose = 'wave'; ch.setFace?.('happy');
  if (sfx) G.audio.sfx(sfx);
  await S.tw.run(.42, k => { ch.rx.y = hopK(.3, k); }); ch.rx.y = 0; ch.squash = .3;
}
// 부르르: a wet shake, drops flying off
async function shakeOff(S, ch) {
  const G = S.G, W = G.world; ch.setFace?.('dizzy');
  const s = scr(W, ch, .6); W.fx.burst(s.x, s.y, { n: 22, colors: ['#8fd3ff', '#5ab8ff', '#ffffff'], shape: 'dot', speed: 260, size: 8, gravity: 520, up: 120, life: .7 });
  G.audio.sfx('blub');
  await S.tw.run(.7, k => { ch.rx.rz = Math.sin(k * Math.PI * 10) * .22 * (1 - k); }); ch.rx.rz = 0; ch.setFace?.('happy');
}
function capMesh() {
  const g = new THREE.Group(), m = c => new THREE.MeshToonMaterial({ color: c });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.13, .12, .1, 20), m('#2f4a8a')); crown.position.y = .05; g.add(crown);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, .03, 20), m('#2f4a8a')); top.position.y = .11; g.add(top);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .015, 16, 1, false, -Math.PI / 2, Math.PI), m('#1d2b52')); brim.position.set(0, .01, .08); brim.scale.z = 1.2; g.add(brim);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(.03, 5), m('#ffd23f')); badge.position.set(0, .07, .127); g.add(badge);
  return g;
}
const partsDispatch = {
  async start(S, c) {
    const G = S.G, f = chOf(S); G.audio.sfx('sirenFire');
    if (f) { await lookAt(S, f); await c.wait(.2); await salute(S, f); }
    await c.wait(1.2);
  },
};
const pengShake = {
  async end(S, c) {
    const G = S.G, W = G.world, f = chOf(S); if (!f) return;
    await lookAt(S, f, 1.2);
    // the finished truck's hose: a spray onto 펭펭이, then the shake
    const s = scr(W, f, 1.4);
    for (let i = 0; i < 6; i++) S.tw.wait(i * .08).then(() => !S.dead && W.fx.burst(s.x + 40 - i * 6, s.y - 30, { n: 10, colors: ['#8fd3ff', '#ffffff'], shape: 'dot', speed: 180, size: 10, gravity: 600, life: .5 }));
    G.audio.sfx('swish'); f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 });
    await c.wait(.7); if (c.skipped) return;
    await shakeOff(S, f); await c.wait(.6);
  },
};
const jarHide = {
  async start(S, c) {
    const G = S.G, W = G.world, back = { target: W.target.clone(), zoom: W.zoom, pitch: W.pitch };
    // down out of the sky onto the roof
    W.target.y += 3; W.zoom = back.zoom * .7; W.updateCam();
    await W.flyTo(S.tw, { target: back.target, zoom: back.zoom, dur: 1.4 });
    const f = chOf(S); if (f && !c.skipped) await salute(S, f, 'giggle');
    await c.wait(.8);
  },
};
const inkyTraceLook = {
  async end(S, c) {
    const W = S.G.world, m = (S.prints || [])[0]; if (!m) return;
    await c.wait(.4);
    const p = m.getWorldPosition(V(0, 0, 0));
    await W.flyTo(S.tw, { target: p, zoom: Math.min(6, W.zoom * 1.5), dur: 1.4 });
    await c.wait(1.2);
  },
};
const smokeCat = {
  async start(S, c) {
    const G = S.G, W = G.world, R = S.room, f = chOf(S);
    // along the alley, one side to the other, then to 멍뭉이: 삐익! and a salute
    const ctr = R.group.getWorldPosition(V(0, 0, 0)), rt = V(1, 0, -1).normalize(), half = Math.max(R.w || 4, R.d || 4) * .3, y = W.target.y;
    W.target.copy(ctr.clone().addScaledVector(rt, -half).setY(y)); W.updateCam();
    await W.flyTo(S.tw, { target: ctr.clone().addScaledVector(rt, half).setY(y), zoom: W.zoom * 1.25, dur: 1.8 });
    if (f && !c.skipped) { await lookAt(S, f, 1.2, .4); await salute(S, f, 'whistle'); }
    await c.wait(.9);
  },
};
const sniffPoint = {
  async end(S, c) {
    const G = S.G, W = G.world, f = chOf(S), R = S.room; if (!f) return;
    await lookAt(S, f, 1.1);
    f.setFace?.('sus'); G.audio.sfx('hmm');
    await S.tw.run(.8, k => { f.rx.rx = .18 * Math.sin(k * Math.PI) ; f.rx.rz = Math.sin(k * Math.PI * 6) * .06; }); f.rx.rx = f.rx.rz = 0;
    if (c.skipped) return;
    // the far end of the alley (삐딱이네 골목): turn that way, a little hop, the camera follows the nose
    const end = R.group.getWorldPosition(V(0, 0, 0)).add(V(-(R.w || 6) / 2, 0, -(R.d || 4) / 4));
    f.faceTo(end.x, end.z); f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 }); G.audio.sfx('gasp');
    await S.tw.run(.35, k => { f.rx.y = hopK(.22, k); }); f.rx.y = 0;
    await W.flyTo(S.tw, { target: end.setY(W.target.y), dur: .9 });
    await c.wait(.7);
  },
};
const boardStop = {
  async start(S, c) {
    const G = S.G, f = chOf(S); if (!f) return;
    const p0 = f.root.position.clone(), from = p0.clone().add(V(-2.2, 0, 0));
    await lookAt(S, f, 1.2, .4);
    f.root.position.copy(from); f.faceTo(p0.x + 5, p0.z); f.setFace?.('happy');
    await Promise.race([S.tw.run(.9, k => { f.root.position.lerpVectors(from, p0, k); f.rx.rz = -.12 * Math.sin(k * Math.PI); }, ease.outCubic), c.wait(.9)]);
    f.root.position.copy(p0); f.rx.rz = 0;
    G.audio.sfx('boardStop'); f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 }); f.squash = .35;
    await c.wait(1.2);
  },
};
const whistleTest = {
  async start(S, c) {
    const f = chOf(S); if (!f) return;
    await lookAt(S, f, 1.5); await salute(S, f, 'whistle'); await c.wait(1.1);
  },
};
const capOn = {
  async end(S, c) {
    const G = S.G, W = G.world, m = S.hero?.ch; if (!m) return;
    await lookAt(S, m, 1.4);
    // 임명식: a police cap drops onto 몽글이, a sparkle, the fanfare
    const cap = capMesh(), top = m.headTop(); cap.position.set(0, top + .6, 0); m.root.add(cap); S.stgCap = cap;
    G.audio.sfx('fanfare');
    await S.tw.run(.45, k => { cap.position.y = top - .06 + .66 * (1 - k) * (1 - k); }, ease.outBounce);
    m.setFace?.('happy'); m.squash = .3;
    const s = scr(W, m, 1); W.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 180, size: 10, gravity: 200 });
    await c.wait(1.0); if (c.skipped) return;
    // the black prints, off toward the station (off the edge of the room)
    const R = S.room.rooms ? S.room.rooms[0] : S.room, lp = R.group.worldToLocal(m.root.getWorldPosition(V(0, 0, 0)));
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#2a2233' }), ex = (R.w || 6) / 2;
    for (let i = 0, x = lp.x - .5; x > -ex - .2; i++, x -= .28) { const d = new THREE.Mesh(new THREE.CircleGeometry(.04, 12), mat); d.rotation.x = -Math.PI / 2; d.position.set(x, lp.y + .012, lp.z + (i % 2 ? .07 : -.07)); g.add(d); }
    R.group.add(g); S.stgPrints = g;
    await W.flyTo(S.tw, { target: R.group.localToWorld(V(-ex, 0, lp.z)), dur: 1.1 });
    await c.wait(.8);
  },
};

// ── 21·23·25·31~34판
const toon = c => new THREE.MeshToonMaterial({ color: c });
const roomOf = S => S.room.rooms ? S.room.rooms[0] : S.room;
const findF = (S, re) => { for (const R of S.room.rooms || [S.room]) for (const r of R.furns) if (re.test(r.type)) return r; return null; };
const topOf = r => { const b = new THREE.Box3().setFromObject(r.f.group); return V((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2); };
// a prop put down at a world point — in the room's group, so it goes with the room when the stage ends (moves later: in
// that group's frame, which is the world's unless the room was moved)
const place = (S, obj, p) => { const R = roomOf(S); R.group.updateMatrixWorld(true); obj.position.copy(R.group.worldToLocal(p.clone())); R.group.add(obj); S.G.world.idsDirty = true; (S.stgProps ||= []).push(obj); return obj; };
// a clear spot on the floor near p (none: p itself)
function clearNear(S, p, min = .45, max = 1.2) {
  const R = roomOf(S);
  for (let r = min; r <= max; r += .2) for (let a = 0; a < 12; a++) {
    const x = p.x + Math.cos(a * Math.PI / 6 + .3) * r, z = p.z + Math.sin(a * Math.PI / 6 + .3) * r;
    if (R.clearAt?.(x, z, .25) !== false) return V(x, 0, z);
  }
  return p.clone();
}
function stoolMesh(col = '#e2403a') {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(.16, .15, .05, 18), toon(col)); seat.position.y = .4; g.add(seat);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .78, l = new THREE.Mesh(new THREE.CylinderGeometry(.018, .024, .4, 6), toon(col)); l.position.set(Math.cos(a) * .1, .2, Math.sin(a) * .1); l.rotation.set(Math.sin(a) * .12, 0, -Math.cos(a) * .12); g.add(l); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function bagMesh(col = '#7fc4e8') {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(.26, .22, .14), toon(col)); b.position.y = .11; g.add(b);
  const h = new THREE.Mesh(new THREE.TorusGeometry(.07, .013, 6, 14, Math.PI), toon(col)); h.position.y = .22; g.add(h);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// 의자 두 개: the map's own chairs or stools, or (none in this alley yet) two little red plastic stools beside 삐딱이
function twoSeats(S) {
  if (S.stgSeats) return S.stgSeats;
  const own = []; for (const R of S.room.rooms || [S.room]) for (const r of R.furns) if (/chair|stool/.test(r.type) && own.length < 2) own.push(topOf(r));
  if (own.length === 2) return (S.stgSeats = own);
  const f = chOf(S), p = f ? f.root.getWorldPosition(V(0, 0, 0)) : V(0, 0, 0), a = clearNear(S, p, .6), b = clearNear(S, a, .45, .8);
  place(S, stoolMesh('#e2403a'), a); place(S, stoolMesh('#f08a3c'), b);
  return (S.stgSeats = [a.clone().setY(.43), b.clone().setY(.43)]);
}
const twoChairs = {
  async start(S, c) {
    const W = S.G.world, f = chOf(S), [a, b] = twoSeats(S), mid = a.clone().add(b).multiplyScalar(.5);
    await W.flyTo(S.tw, { target: mid, zoom: Math.min(6, W.zoom * 1.8), dur: .7 });
    if (f && !c.skipped) { f.faceTo(W.cam.position.x, W.cam.position.z); f.setFace?.('sus'); f.pose = 'idle'; S.G.audio.sfx('hmm'); await S.tw.run(.4, k => { f.rx.rx = -.15 * Math.sin(k * Math.PI / 2); }); }
    await c.wait(1.4); if (f) f.rx.rx = 0;
  },
};
const bagOnChair = {
  async end(S, c) {
    const G = S.G, W = G.world, f = chOf(S), [, b] = twoSeats(S);
    await W.flyTo(S.tw, { target: b, zoom: Math.min(6, W.zoom * 1.6), dur: .6 });
    const bag = place(S, bagMesh(S.idx === 24 ? '#ffb3c6' : '#7fc4e8'), b.clone().setY(b.y + .6));
    await S.tw.run(.35, k => { bag.position.y = b.y + .6 * (1 - k * k); }, ease.linear);
    G.audio.sfx(S.idx === 24 ? 'pop' : 'thump'); W.shadowDirty = true;
    if (f) { f.faceTo(b.x, b.z); f.setFace?.('happy'); }
    await c.wait(1.2);
  },
};
const bagBurst = {
  async start(S, c) {
    const G = S.G, W = G.world, f = chOf(S); if (!f) return;
    await lookAt(S, f, 1.6);
    const bag = bagMesh('#ffb3c6'); bag.position.set(.22, f.headTop() * .25, .12); f.root.add(bag); S.stgBag = bag;
    await c.wait(.5); if (c.skipped) return;
    // the strap goes 툭 — everything in it all over the alley
    G.audio.sfx('pop', 3); G.hitstop(.05);
    const s = scr(W, f, .35);
    W.fx.burst(s.x + 30, s.y, { n: 26, colors: ['#ff6b57', '#ffd23f', '#7fc4e8', '#9be38f', '#ffffff'], shape: 'dot', speed: 360, size: 13, gravity: 620, up: 260, life: 1 });
    f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 });
    await S.tw.run(.3, k => { bag.rotation.z = -.5 * k; bag.scale.y = 1 - .45 * k; });
    await c.wait(1.3);
  },
};
// 경광등: red and blue light sweeping over the screen
const policeLights = {
  async start(S, c) {
    const G = S.G, f = chOf(S), car = findF(S, /patrolcar/);
    if (car) await S.G.world.flyTo(S.tw, { target: topOf(car), zoom: Math.min(6, S.G.world.zoom * 1.5), dur: .6 });
    G.audio.sfx('sirenPolice');
    const sw = h('div', { class: 'stg-siren' }); document.getElementById('overlay').append(sw); c.finish = () => sw.remove();
    await c.wait(1.8); sw.remove();
    if (f && !c.skipped) { await lookAt(S, f, 1.4, .45); await salute(S, f); }
    await c.wait(.9);
  },
};
function crayonBoxMesh() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(.24, .14, .06), toon('#f5e6c8')); g.add(b); g.scale.setScalar(1.6);
  const cols = ['#ff5a5a', '#ffb13d', '#ffe14d', '#6fd16f', '#5aa6ff', '#a87bff'];
  cols.forEach((col, i) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .08, 6), toon(col)); k.position.set(-.1 + i * .04, .09, 0); g.add(k); });
  return g;
}
const crayonBox = {
  async end(S, c) {
    const G = S.G, W = G.world, m = S.hero?.ch; if (!m) return;
    await lookAt(S, m, 1.6);
    const box = crayonBoxMesh(); box.position.set(.22, m.headTop() * .18, .32); box.rotation.set(-.3, -.4, 0); m.root.add(box); S.stgCrayon = box;
    box.scale.setScalar(.01);
    await S.tw.run(.35, k => box.scale.setScalar(.01 + .99 * k), ease.outBack);
    G.audio.sfx('pop', 2); m.setFace?.('wow'); m._fx?.(S.tw, 'ques', { x: .3, y: .9 });
    await c.wait(1.5);
  },
};
// 31 귀가: the friends walk in one after another from the alley's mouth (Char.walkTo), the train fading far off
const comeHome = { start: (S, c) => walkIn(S, c) };
// (cam: false — the walk only, the camera somewhere else: 31판 극장's sign lights up meanwhile)
async function walkIn(S, c, { cam = true } = {}) {
  {
    const G = S.G, W = G.world, R = roomOf(S), f = chOf(S);
    // 몽글이 and two of the trip's friends with their bags (개굴이's fishing bag, 너굴이's straw hat); they stay by the alley's
    // mouth for the stage (S.npcs: still, and gone with the stage)
    const walkers = [];
    if (S.hero?.ch) walkers.push({ ch: S.hero.ch, to: S.hero.ch.root.position.clone() });
    const ex = R.group.localToWorld(V(-R.w / 2 + .3, 0, R.d / 4)), y0 = 0;
    for (const [k, prop] of [['frog', 'bag'], ['raccoon', 'hat']]) {
      if (S.th?.friend === k || !Char) continue;
      const ch = new Char(k); W.root.add(ch.root); (S.npcs ||= []).push({ ch, on: false });
      if (prop === 'bag') { const b = bagMesh('#5fae5a'); b.scale.setScalar(.8); b.position.set(.2, ch.headTop() * .2, .1); ch.root.add(b); }
      else { const hat = hatMesh(); hat.position.y = ch.headTop() - .04; ch.root.add(hat); }
      walkers.push({ ch, to: clearNear(S, ex.clone().add(V(1.2 + walkers.length * .5, 0, 0)), .2, 1) });
    }
    G.audio.sfx('trainAway'); const stop = G.audio.loopSfx?.('footsteps', .5);
    c.finish = () => { stop?.(); for (const w of walkers) w.ch.root.position.set(w.to.x, w.to.y ?? y0, w.to.z); };
    walkers.forEach((w, i) => { w.ch.root.position.set(ex.x - .6 - i * .6, w.to.y ?? y0, ex.z + (i % 2 ? .2 : -.2)); });
    if (cam) await W.flyTo(S.tw, { target: ex.clone().add(V(.8, 0, 0)).setY(W.target.y), zoom: Math.min(6, Math.max(2.4, W.zoom * 2.2)), dur: .5 });
    const runs = walkers.map((w, i) => S.tw.wait(i * .4).then(() => w.ch.walkTo?.(S.tw, w.to.x, w.to.z)));
    const fp = f ? f.root.getWorldPosition(V(0, 0, 0)) : ex;
    if (cam) S.tw.wait(1.2).then(() => !S.dead && !c.skipped && W.flyTo(S.tw, { target: fp.clone().setY(W.target.y), dur: 2.2 }));
    await Promise.race([Promise.all(runs), c.wait(4)]);
    stop?.();
    for (const w of walkers) w.ch.faceTo(fp.x, fp.z);
    if (f && !c.skipped) { f.faceTo(W.cam.position.x, W.cam.position.z); f.setFace?.('sus'); }
    await c.wait(.9);
  }
}

// ── 31판 별빛극장 (cinema — 스토리 룸 10/23, _handoff/cinema-staging-notes-1023.md). ⑧'s pieces: cin_marquee (f.bulbs in the
// order they light, f.letters 별·빛·극·장, f.dimChar), cin_projector (its crank part, f.lensAt, f.beam — off), cin_screen (f.film on
// its '-screen' plane — hidden), cin_popcorn (the glass lid part, the key hanging on the shelf above), cin_curtain, cin_seatrow.
// In the stage a touch only (드래그 = the camera): the crank and the curtain cord go by themselves once touched.
const LIT = '#ffd36a';
// a bulb or a letter dark / lit again: ⑧'s bulbs and letters glow on their own (each its own material), so 'dark' takes the glow
// down and 'lit' puts back what it was; a piece that doesn't glow gets an emissive copy of its material instead
function glow(o, on, col = LIT, k = 1.3) {
  o?.traverse?.(m => {
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
    const u = m.userData, M = m.material;
    if (u.stgEi == null && M.emissive) { u.stgEi = M.emissiveIntensity; u.stgC0 = M.color?.clone(); }
    if (u.stgEi > 0) { M.emissiveIntensity = on ? u.stgEi : 0; if (u.stgC0) M.color.copy(u.stgC0).multiplyScalar(on ? 1 : .42); return; }
    if (!u.stgMat0) u.stgMat0 = M;
    if (!on) { m.material = u.stgMat0; return; }
    if (!u.stgLit) { u.stgLit = u.stgMat0.clone(); if (u.stgLit.emissive) { u.stgLit.emissive.set(col); u.stgLit.emissiveIntensity = k; } else u.stgLit.color?.set(col); }
    m.material = u.stgLit;
  });
}
const haloTo = (f, on) => { const hl = f?.halo; if (!hl?.material) return; if (hl.userData.stgOp == null) hl.userData.stgOp = hl.material.opacity; hl.material.opacity = on ? hl.userData.stgOp : 0; };
const boxOf = o => new THREE.Box3().setFromObject(o);
// what of it shows (a hidden beam or film would make the projector's box reach the screen)
function visBox(o) {
  const b = new THREE.Box3(); o.updateMatrixWorld(true);
  o.traverse(m => { if (!m.isMesh) return; for (let q = m; q; q = q.parent) { if (!q.visible) return; if (q === o) break; } b.expandByObject(m); });
  return b.isEmpty() ? boxOf(o) : b;
}
const marqueeFlicker = {
  async start(S, c) {
    const G = S.G, W = G.world, F = furnOf(S, 'cin_marquee'), f = F?.r.f;
    const bulbs = f?.bulbs || [], letters = f?.letters || [];
    c.finish = () => { for (const b of bulbs) glow(b, true); for (const l of letters) glow(l, true, '#fff1c8', .9); haloTo(f, true); };
    // (dark already if PREP ran — it does when this scene plays; dark now otherwise)
    for (const b of bulbs) glow(b, false); for (const l of letters) glow(l, false); haloTo(f, false);
    // the friends with their trip bags walk up to the doors meanwhile (what alley-boss's comeHome did)
    const walk = walkIn(S, c, { cam: false });
    if (f) { const b = boxOf(f.group); await W.flyTo(S.tw, { target: b.getCenter(V(0, 0, 0)), zoom: fitZoom(W, b, .7), dur: .55 }); }
    await c.wait(.35);
    // 딸깍, one bulb after another (about 2.4 s for the lot), then the name comes on
    const gap = Math.min(.18, Math.max(.05, 2.4 / Math.max(1, bulbs.length)));
    for (let i = 0; i < bulbs.length && !c.skipped && !S.dead; i++) { glow(bulbs[i], true); if (i % 2 === 0) G.audio.sfx('click', i % 5); W.shadowDirty = true; await c.wait(gap); }
    if (!c.skipped) { for (const l of letters) glow(l, true, '#fff1c8', .9); G.audio.sfx('star'); }
    c.finish();
    await Promise.race([walk, c.wait(2)]);
  },
};
// the film on the screen: an old film's look over it — the picture flickers, scratches run down it, the edges are dark
function filmLook(S, film) {
  if (!film || film.userData.stgLook) return;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 144; const x = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const over = new THREE.Mesh(film.geometry, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  over.position.z = .004; over.renderOrder = 2; over.userData.noOutline = true; film.add(over); film.userData.stgLook = over;
  const mat = film.material, c0 = mat.color?.clone();
  let t = 0, next = 0;
  const tick = dt => {
    if (S.dead) return; t += dt; if (t < next) return; next = t + .08;
    x.clearRect(0, 0, 256, 144);
    // (the picture has its own old-film look — grain, scratches, dark edges — so only what moves goes on top: a soft edge, a scratch now and then)
    const g = x.createRadialGradient(128, 72, 60, 128, 72, 150); g.addColorStop(0, 'rgba(60,35,10,0)'); g.addColorStop(1, 'rgba(40,22,6,.28)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 144);
    for (let k = 0; k < 2; k++) if (Math.random() < .45) { x.fillStyle = Math.random() < .5 ? 'rgba(255,248,230,.45)' : 'rgba(30,18,8,.4)'; x.fillRect(Math.random() * 256, 0, 1 + Math.random(), 144); }
    for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(20,12,4,.4)'; x.fillRect(Math.random() * 256, Math.random() * 144, 2, 2); }
    tex.needsUpdate = true;
    if (c0) mat.color.copy(c0).multiplyScalar(.9 + Math.random() * .1);
  };
  if (S.ambient?.ticks) S.ambient.ticks.push(tick);
  else { let last = performance.now(); const iv = setInterval(() => { if (S.dead) return clearInterval(iv); const n = performance.now(); tick((n - last) / 1000); last = n; }, 80); }
}
// a point on the film by where it is in the picture (u from the left, v from the top)
function filmPoint(film, u, v) {
  const g = film.geometry; if (!g.boundingBox) g.computeBoundingBox();
  const b = g.boundingBox, sz = b.getSize(V(0, 0, 0)), flatZ = sz.z <= Math.min(sz.x, sz.y);
  const p = flatZ ? V(b.min.x + sz.x * u, b.max.y - sz.y * v, b.max.z) : V(b.min.x + sz.x * u, b.max.y, b.min.z + sz.z * v);
  return film.localToWorld(p);
}
const projectorFilm = {
  async end(S, c) {
    const G = S.G, W = G.world, P = furnOf(S, 'cin_projector')?.r.f, Sc = furnOf(S, 'cin_screen')?.r.f;
    if (!P || !Sc) return;
    const crank = P.parts.find(p => p.kind === 'crank') || P.parts.find(p => !p.lock) || P.parts[0], beam = P.beam, film = Sc.film;
    const show = () => { crank?.setOpen(1); furnOf(S, 'cin_curtain')?.r.f.parts?.[0]?.setOpen(1); if (beam) beam.visible = true; if (film) { film.visible = true; filmLook(S, film); } W.idsDirty = true; W.shadowDirty = true; };
    c.finish = show;
    // the crank: it winds itself (드르륵), the projector whirs on
    { const b = visBox(P.group); await W.flyTo(S.tw, { target: b.getCenter(V(0, 0, 0)), zoom: fitZoom(W, b, .55), dur: .5 }); }
    G.audio.sfx('ratchet'); const stop = G.audio.loopSfx?.('projector', .5);
    // (it runs on under the closing words, then winds down)
    setTimeout(() => stop?.(), 6000);
    if (crank) await Promise.race([S.tw.run(1, k => crank.setOpen(k), ease.inOutQuad), c.wait(1)]);
    // the light out of the little window, then the film on the screen
    if (beam) {
      beam.visible = true; const ms = []; beam.traverse(m => { if (m.isMesh && m.material) ms.push([m.material, m.material.opacity ?? 1]); });
      for (const [m] of ms) { m.transparent = true; m.opacity = 0; }
      await Promise.race([S.tw.run(.35, k => { for (const [m, o] of ms) m.opacity = o * k; }), c.wait(.35)]);
      for (const [m, o] of ms) m.opacity = o;
    }
    // the stage curtain goes up by itself if it's still down (⑧ cin_curtain: one part, the cord and the two halves)
    const cur = furnOf(S, 'cin_curtain')?.r.f.parts?.[0];
    // (looking at the screen more from the front than the room's view does: most of the way round to face it)
    let yaw = W.yaw;
    if (film) { const n = film.getWorldDirection(V(0, 0, 0)), y1 = Math.atan2(n.x, n.z); let dy = y1 - W.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; yaw = W.yaw + dy * .7; }
    { const b = visBox(Sc.group); await W.flyTo(S.tw, { target: b.getCenter(V(0, 0, 0)), zoom: fitZoom(W, b, .9), yaw, dur: .8 }); }
    if (cur && !(cur.t > .9) && !c.skipped) { G.audio.sfx(cur.sfx || 'swish'); await Promise.race([S.tw.run(.8, k => cur.setOpen(Math.max(cur.t, k)), ease.inOutQuad), c.wait(.8)]); cur.setOpen(1); }
    G.audio.sfx('flip');
    if (film) { film.visible = true; filmLook(S, film); W.idsDirty = true; }
    // (the beam softer once the picture is up — at full it washed the picture out)
    beam?.traverse(m => { if (m.isMesh && m.material?.transparent) m.material.opacity *= .5; });
    await c.wait(1);
    // in to the corner: 먹물이 and the young 삐딱이 (where they are in the picture: Sc.filmCorner [u, v], else ⑧'s picture's — bottom right)
    if (film && !c.skipped) {
      const [u, v] = Sc.filmCorner || [.8, .8], p = filmPoint(film, u, v), bb = visBox(Sc.group);
      const z = fitZoom(W, bb, .9) * 1.8;
      await W.flyTo(S.tw, { target: p, zoom: Math.min(6, z), yaw, dur: 1.1, e: ease.inOutCubic });
      await c.wait(1.4);
    }
    show();
  },
};
// in the stage (stage.js onPart / the tap on a piece): the popcorn machine overflows as its lid opens; the sign's one letter
// goes out on a touch (the key on the shelf falls the usual way, its hang on the lid's part)
export function stagingPart(S, part) {
  const t = part?.furn?.type;
  // (⑧'s machine pops and overflows on its own — f.popcornPile, f.spill: then nothing more here)
  if (t === 'cin_popcorn' && !part.furn.popcornPile && !part._popped && !(part.t > .5) && !part.lock) { part._popped = true; popcorn(S, part.furn); }
}
export function stagingTap(S, furn) {
  if (furn?.type !== 'cin_marquee' || furn.parts?.length) return false;   // (⑧'s sign has its own part for it: 'flick')
  const L = furn.letters?.length ? furn.letters : furn.dimChar ? [furn.dimChar] : [];
  const one = furn.dimChar && L.includes(furn.dimChar) ? furn.dimChar : L[2] || L[0];
  if (!one) return true;
  const G = S.G; one.userData.stgOff = !one.userData.stgOff;
  // a buzz and a flicker, then it stays out ('별빛극 장') — another touch brings it back
  (async () => { for (const k of [0, 1, 0, 1]) { glow(one, k ? !one.userData.stgOff : one.userData.stgOff, '#fff1c8', .9); G.audio.sfx('click', 2); await S.tw.wait(.07); } glow(one, !one.userData.stgOff, '#fff1c8', .9); G.world.idsDirty = true; })();
  return true;
}
function popcorn(S, f) {
  const G = S.G, W = G.world, b = boxOf(f.group), top = V((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2), y0 = b.min.y;
  const N = 46, geo = new THREE.IcosahedronGeometry(.04, 0), mat = new THREE.MeshToonMaterial({ color: '#fff3c4' });
  const im = new THREE.InstancedMesh(geo, mat, N); im.frustumCulled = false;
  const col = new THREE.Color(); for (let i = 0; i < N; i++) im.setColorAt(i, col.set(i % 5 ? '#fff3c4' : '#ffd35a'));
  const R = roomOf(S); R.group.updateMatrixWorld(true); R.group.add(im); (S.stgProps ||= []).push(im);
  const inv = R.group.matrixWorld.clone().invert(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1);
  const ks = Array.from({ length: N }, (_, i) => {
    const a = Math.random() * Math.PI * 2, out = .25 + Math.random() * .45, rest = V(top.x + Math.cos(a) * (Math.max(b.max.x - b.min.x, .3) / 2 + out * .6), y0 + .06 + Math.random() * .04, top.z + Math.sin(a) * (Math.max(b.max.z - b.min.z, .3) / 2 + out * .6));
    return { a, d: i * .02, rest, up: .25 + Math.random() * .35, spin: Math.random() * 6 };
  });
  const at = V(0, 0, 0);
  S.tw.run(1.5, k => {
    for (let i = 0; i < N; i++) {
      const p = ks[i], kk = Math.min(1, Math.max(0, (k * 1.5 - p.d) / 1));
      at.lerpVectors(top, p.rest, kk); at.y += Math.sin(kk * Math.PI) * p.up;
      if (kk <= 0) at.copy(top).setY(-100);
      q.setFromAxisAngle(V(0, 1, 0), p.spin * kk); m.compose(at.clone().applyMatrix4(inv), q, one); im.setMatrixAt(i, m);
    }
    im.instanceMatrix.needsUpdate = true; W.shadowDirty = true;
  });
  for (let i = 0; i < 6; i++) setTimeout(() => !S.dead && G.audio.sfx('pop', 2 + i % 4), i * 140);
  const s = W.toScreen(top); W.fx.burst(s.x, s.y, { n: 14, shape: 'circle', colors: ['#fff3c4', '#ffd35a', '#ffffff'], speed: 170, up: 120, gravity: 260, size: 8, life: .6 });
}
function doodleTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const x = cv.getContext('2d');
  x.lineCap = 'round'; x.lineJoin = 'round';
  const line = (col, w, pts) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
  // a house, three friends, a wavy sky
  line('#ff6b57', 11, [[30, 120], [60, 60], [90, 120], [30, 120]]);
  line('#ffb13d', 11, [[40, 120], [40, 140], [80, 140], [80, 120]]);
  for (const [cx, col] of [[140, '#6fd16f'], [180, '#5aa6ff'], [215, '#ffd23f']]) { x.strokeStyle = col; x.lineWidth = 11; x.beginPath(); x.arc(cx, 105, 16, 0, 7); x.stroke(); line(col, 11, [[cx, 121], [cx, 145]]); }
  line('#a87bff', 9, [[20, 30], [60, 20], [100, 34], [140, 18], [180, 30], [230, 22]]);
  // the one friend left uncoloured — drawn in nothing but the dark outline it should have had
  x.setLineDash([6, 8]); line('#8f86a0', 6, [[110, 125], [110, 100], [124, 92], [110, 100]]); x.setLineDash([]);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const crayonWall = {
  async end(S, c) {
    const G = S.G, W = G.world, R = roomOf(S), f = chOf(S);
    // (from the view the stage is played in, not the win close-up: what is seen is judged from there)
    await closeBack(S); if (S.dead) return;
    // on the back wall (the one away from the camera), near 삐딱이
    const fp = f ? R.group.worldToLocal(f.root.getWorldPosition(V(0, 0, 0))) : V(0, 0, 0);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({ map: doodleTex(), alphaTest: .4 }));
    // a bare stretch of the back wall (N, else W) — rays from the room's middle reach the wall itself, not a piece in front,
    // across the picture's whole width — nearest 삐딱이
    R.group.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(), solid = [R.group], hitsWall = (o, d) => { rc.set(R.group.localToWorld(o), d); const h = rc.intersectObjects(solid, true)[0]; let f = null; for (let q = h?.object; q && !f; q = q.parent) f = q.userData?.furn; return h && !f ? h : null; };
    // (and seen: nothing between it and the camera — 31판's stairs run along a bare-looking wall)
    const cd = W.cam.getWorldDirection(V(0, 0, 0)).negate(), seen = lp => { rc.set(R.group.localToWorld(lp.clone()).addScaledVector(cd, .05), cd); return !rc.intersectObjects(solid, true).length; };
    const okAt = (lp, ax) => [-.5, 0, .5].flatMap(d => [-.15, .3].map(dy => seen(lp.clone().add(ax === 'x' ? V(d, dy, 0) : V(0, dy, d))))).filter(Boolean).length >= 5;
    const cands = [];
    for (let x = -R.w / 2 + .9; x <= R.w / 2 - .9; x += .25) {
      const hs = [hitsWall(V(x, .95, -R.d / 2 + .6), V(0, 0, -1))];
      const lp = hs[0] && R.group.worldToLocal(hs[0].point.clone()).add(V(0, 0, .03)); if (lp && okAt(lp, 'x')) cands.push({ p: lp, ry: 0 });
    }
    for (let z = -R.d / 2 + .9; z <= R.d / 2 - .9; z += .25) {
      const hs = [hitsWall(V(-R.w / 2 + .6, .95, z), V(-1, 0, 0))];
      const lp = hs[0] && R.group.worldToLocal(hs[0].point.clone()).add(V(.03, 0, 0)); if (lp && okAt(lp, 'z')) cands.push({ p: lp, ry: Math.PI / 2 });
    }
    const fl = fp;
    const at = cands.sort((a, b) => a.p.distanceTo(fl) - b.p.distanceTo(fl))[0] || { p: V(Math.max(-R.w / 2 + 1, Math.min(R.w / 2 - 1, fl.x)), .95, -R.d / 2 + .06), ry: 0 };
    pl.position.copy(at.p); pl.rotation.y = at.ry; R.group.add(pl); (S.stgProps ||= []).push(pl);
    W.idsDirty = true;
    await W.flyTo(S.tw, { target: pl.getWorldPosition(V(0, 0, 0)), zoom: Math.min(7, W.zoom * 3.2), dur: .8 });
    await c.wait(1.6); if (c.skipped) return;
    G.audio.sfx('hmm');
    const m = S.hero?.ch; if (!m) return;
    await lookAt(S, m, 1.6);
    const box = crayonBoxMesh(); box.position.set(.22, m.headTop() * .18, .32); box.rotation.set(-.3, -.4, 0); m.root.add(box); S.stgCrayon = box;
    m.setFace?.('sus'); m._fx?.(S.tw, 'ques', { x: .3, y: .9 });
    await c.wait(1.3);
  },
};
function ticketMesh() {
  const cv = document.createElement('canvas'); cv.width = 96; cv.height = 48; const x = cv.getContext('2d');
  x.fillStyle = '#fff3d6'; x.fillRect(0, 0, 96, 48); x.fillStyle = '#e8724f'; x.fillRect(0, 0, 96, 9);
  x.fillStyle = '#3a2453'; x.font = 'bold 15px sans-serif'; x.fillText('호수섬 →', 8, 32);
  x.fillStyle = '#ffffff'; for (let y = 4; y < 48; y += 8) { x.beginPath(); x.arc(96, y, 3, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, .1), new THREE.MeshBasicMaterial({ map: t })); m.rotation.x = -Math.PI / 2; m.rotation.z = .3;
  return m;
}
const konbiniTicket = {
  async start(S, c) {
    const G = S.G, W = G.world, R = roomOf(S), ctr = findF(S, /^counter2$|counter/);
    G.audio.sfx('doorBell');
    await c.wait(.5); if (!ctr) return;
    const top = topOf(ctr);
    await W.flyTo(S.tw, { target: top, zoom: Math.min(6, W.zoom * 1.7), dur: .7 });
    // a black shadow darts across in front of the counter, and leaves half a ticket on it
    const sh = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#1e1626' })); sh.scale.set(1.4, .8, 1);
    const a = top.clone().add(V(-1.6, -.5, .6)), b = top.clone().add(V(1.6, -.5, .6));
    place(S, sh, a); G.audio.sfx('whoosh');
    await S.tw.run(.45, k => { sh.position.lerpVectors(a, b, k); sh.position.y = a.y + Math.sin(k * Math.PI) * .2; });
    sh.visible = false;
    S.stgTicket = place(S, ticketMesh(), top.clone().add(V(.08, .012, .05)));
    await c.wait(1.2);
  },
};
const ticketGone = {
  async end(S, c) {
    const G = S.G, W = G.world, t = S.stgTicket; if (!t?.visible) return;
    await W.flyTo(S.tw, { target: t.getWorldPosition(V(0, 0, 0)), zoom: Math.min(6, W.zoom * 1.8), dur: .6 });
    await c.wait(.5);
    const s = W.toScreen(t.getWorldPosition(V(0, 0, 0))); W.fx.burst(s.x, s.y, { n: 10, colors: ['#3a2453', '#6b5a7a'], shape: 'dot', speed: 120, size: 8, gravity: -40 });
    G.audio.sfx('pop', -2); t.visible = false;
    await c.wait(1.1);
  },
};
function sockMesh() { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .12, 4, 8), toon('#ff7eb6')); g.add(a); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.035, .05, 4, 8), toon('#ff7eb6')); b.rotation.z = Math.PI / 2; b.position.set(.04, -.07, 0); g.add(b); return g; }
const washerSock = {
  async start(S, c) {
    const G = S.G, W = G.world, w = findF(S, /washer/); if (!w) return;
    const top = topOf(w), g = w.f.group, x0 = g.position.x, z0 = g.position.z;
    await W.flyTo(S.tw, { target: top.clone().add(V(0, -.3, 0)), zoom: Math.min(6, W.zoom * 1.7), dur: .6 });
    G.audio.sfx('washerSlam'); await c.wait(.3);
    const stop = G.audio.loopSfx?.('washerRumble', .6); c.finish = () => { stop?.(); g.position.x = x0; g.position.z = z0; };
    await Promise.race([S.tw.run(1.4, k => { g.position.x = x0 + Math.sin(k * 70) * .012; g.position.z = z0 + Math.cos(k * 53) * .01; W.shadowDirty = true; }), c.wait(1.4)]);
    g.position.x = x0; g.position.z = z0;
    // one sock flies out and is gone
    const sock = place(S, sockMesh(), top.clone()), d = V(1.8, 0, .6);
    G.audio.sfx('whoosh');
    await S.tw.run(.6, k => { sock.position.set(top.x + d.x * k, top.y + Math.sin(k * Math.PI) * .9, top.z + d.z * k); sock.rotation.z = k * 9; });
    sock.visible = false; stop?.();
    await c.wait(.6);
  },
};
const sandShake = {
  async end(S, c) {
    const G = S.G, W = G.world, bk = findF(S, /laundrybasket/), f = chOf(S);
    if (bk) {
      const p = topOf(bk); await W.flyTo(S.tw, { target: p, zoom: Math.min(6, W.zoom * 1.7), dur: .6 });
      const s = W.toScreen(p); G.audio.sfx('swish');
      for (let i = 0; i < 4; i++) S.tw.wait(i * .15).then(() => !S.dead && W.fx.burst(s.x + (i - 1.5) * 14, s.y - 10, { n: 10, colors: ['#ecd7ae', '#e0c99c', '#f6e8c8'], shape: 'dot', speed: 110, size: 5, gravity: 380, life: .9 }));
      await c.wait(1.1); if (c.skipped) return;
    }
    if (f) { await lookAt(S, f, 1.3, .45); f.setFace?.('sus'); const R = roomOf(S), door = R.group.localToWorld(V(R.w / 2, 0, R.d / 2)); f.faceTo(door.x, door.z); await S.tw.run(.3, k => { f.rx.rx = -.2 * Math.sin(k * Math.PI); }); f.rx.rx = 0; }
    await c.wait(1);
  },
};
const parfaitSpill = {
  async start(S, c) {
    const G = S.G, W = G.world, f = chOf(S); if (!f) return;
    await lookAt(S, f, 1.4);
    const s = scr(W, f, .7); G.audio.sfx('pop', 1); G.hitstop(.04);
    W.fx.burst(s.x + 20, s.y, { n: 24, colors: ['#ff8fb8', '#8fd3ff', '#ffe14d', '#ffffff', '#b98a5a'], shape: 'dot', speed: 340, size: 11, gravity: 600, up: 240, life: .9 });
    f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 });
    await c.wait(1.4);
  },
};
function flagMesh() {
  const g = new THREE.Group();
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .3, 6), toon('#d9a466')); st.position.y = .15; g.add(st);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 40; const x = cv.getContext('2d');
  for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#2f7fd8'; x.fillRect(0, i * 8, 64, 8); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(.12, .075), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); fl.position.set(.06, .26, 0); g.add(fl);
  return g;
}
const flagPick = {
  async end(S, c) {
    const G = S.G, W = G.world, P = S.kitParfait?.g; if (!P) return;
    // the top of what is stacked (the layers shown), over the cup's middle
    const b = new THREE.Box3(); P.updateMatrixWorld(true); P.traverseVisible(o => { if (o.isMesh) b.expandByObject(o); });
    const c0 = new THREE.Box3().setFromObject(P).getCenter(V(0, 0, 0)), top = V(c0.x, b.max.y, c0.z);
    await W.flyTo(S.tw, { target: top, zoom: Math.min(6, W.zoom * 1.8), dur: .6 });
    const fl = place(S, flagMesh(), top.clone().add(V(0, .5, 0))); fl.scale.setScalar(1.8); fl.rotation.y = Math.atan2(W.cam.position.x - top.x, W.cam.position.z - top.z);
    await S.tw.run(.3, k => { fl.position.y = top.y + .5 * (1 - k) - .05 * k; }, ease.inQuad);
    G.audio.sfx('pop', 3); const s = W.toScreen(top); W.fx.burst(s.x, s.y - 20, { n: 10, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 160, size: 9, gravity: 200 });
    const m = S.hero?.ch; if (m) { m.faceTo(top.x, top.z); m.setFace?.('happy'); m.hopTo?.(S.tw, m.root.position.x, m.root.position.z, { height: .3, dur: .35 }); }
    await c.wait(1.4);
  },
};

// ── 27판: 시작 (가방 펑, 기차는 아직 안 옴) · 판 안 건널목 (버튼 → 차단기 → 화물 기차 휙 → 지붕 위 밀짚모자 빙글) · 끝은 trainIn
// set up before the stage is shown (a retry too): the train isn't in yet (it pulls in at the end — trainIn), and a straw
// hat lies on the shelter roof (the crossing's train blows it down)
function roofHat(S) {
  const sh = findF(S, /platshelter|platformroof/);
  if (sh && !S.stgRoofHat) { const t = topOf(sh); S.stgRoofHat = place(S, hatMesh(), t.clone().add(V(-.3, .02, 0))); S.stgRoofHat.rotation.set(.15, .6, .1); }
  // (27판 방탈출: the gold tip of the locker key peeps out from under the brim — what the crossing's train is for)
  if (S.stgRoofHat && S.spec.hatKey && !S.stgHatTip) {
    const m = new THREE.MeshToonMaterial({ color: '#f2c94c' }), tip = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .011, 6, 14), m); ring.position.set(.2, .012, 0); ring.rotation.x = Math.PI / 2; tip.add(ring);
    const bit = new THREE.Mesh(new THREE.BoxGeometry(.07, .014, .016), m); bit.position.set(.15, .012, 0); tip.add(bit);
    S.stgRoofHat.add(tip); S.stgHatTip = tip;
  }
}
const PREP = {
  // 31판 극장: the sign dark until the friends arrive (marqueeFlicker lights it — prep runs only when that scene will play)
  marqueeFlicker(S) {
    if (S.retryRun) return;
    const f = furnOf(S, 'cin_marquee')?.r.f; if (!f) return;
    for (const b of f.bulbs || []) glow(b, false); for (const l of f.letters || []) glow(l, false); haloTo(f, false);
  },
  bagPop(S) {
    const F = furnOf(S, 'train'); if (F?.r.f.car && !S.stgCarAway) { F.r.f.car.position.x -= 40; S.stgCarAway = true; }
    roofHat(S);
  },
};
// GPT 벚꽃역의 장치 부품 (② 10/22): 한 번 누르면 단계마다 소리 내며 끝까지 (stage.js togglePart steps 러너) — [초, [[t, 소리]…]]
const GPT2_STEPS = {
  pulley: [2.2, [[0, 'ratchet'], [.45, 'creak'], [.88, 'land'], [.96, 'snore']]], flipsign: [1, [[0, 'flip'], [.85, 'pop']]],
  falsebottom: [1, [[0, 'thunk'], [.7, 'pop']]], signal: [1, [[0, 'latch'], [.5, 'ratchet'], [.9, 'creak']]],
  parcelrack: [1.6, [[0, 'slide'], [.85, 'thunk']]], locker: [1.1, [[0, 'door_metal'], [.6, 'slide']]], fishingbag: [.8, [[0, 'rustle'], [.75, 'found']]],
};
export function stagingPrep(S) {
  const k = keyOf(S, 'start'); try { PREP[k]?.(S); } catch (e) { console.warn('staging prep', k, e); }
  for (const p of S.room.parts) { const st = GPT2_STEPS[p.gpt2Device]; if (st && !p.steps) { p.dur = st[0]; p.steps = st[1]; } }
  if (S.spec.hatKey) try { roofHat(S); } catch (e) { console.warn('staging prep hat', e); }
}
// 27판 방탈출 (② 레벨 10/22, user: "인터렉션 및 방탈출적인 요소"): the coin locker's key is in the straw hat on the platform
// roof — out of sight and out of the hints, the bot and the start-view tidying (vacHidden) — with the way to it the crossing
// (it.under: nextGoal points there). It waits on the luggage, where the hat lands when the freight train blows it down.
const HAT_LAND = /suitcases|luggagecart|stationluggage|tripbag/;
export function hatKeyHide(S) {
  const key = S.items.find(i => i.role === 'key' && !i.found), cross = S.room.parts.find(p => p.crossing);
  if (!key || !cross) return;
  const fitsH = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && spotFits(type, s);
  const near = s => HAT_LAND.test(s.furn?.type || '') && !s.reserved && !s.hang && !s.part && ['on', 'floor', 'beside'].includes(s.kind) && fitsH('key', s);
  // (GPT 벚꽃역 ② 10/22: the hat blows into the cat pulley's basket up on its gantry — the key waits in the basket, and the
  // crank brings it down: crossing → hat → crank → key → locker, either of the first two first)
  const pul = S.room.parts.find(p => p.gpt2Device === 'pulley'), bs = pul?.spots.find(s => !s.item && fitsH('key', s));
  const land = bs || S.room.spots.find(s => near(s) && !s.item);
  if (bs) { bs.reserved = false; key.hatPulley = pul; pul.afterOpen = S2 => { if (key.hatIn && key.vacHidden && !key.found) hatKeyShow(S2, key); }; }
  if (land) moveItem(key, land);
  else {   // (the luggage's places taken: swap with a thing to find there that fits where the key was)
    const o = S.items.find(i => i.role === 'target' && !i.friend && !i.found && i.spot && near(i.spot) && fitsH(i.type, key.spot));
    if (o) { const ks = key.spot, os = o.spot; ks.item = null; os.item = null; moveItem(key, os); moveItem(o, ks); }
  }
  key.under = cross; key.vacHidden = true; key.g.visible = false; S.G.world.idsDirty = true;
}
// the hat is down: on the luggage, the key shows; in the pulley's basket up on the gantry, the crank brings it down first
function hatLanded(S, it) {
  it.hatIn = true;
  const pul = it.hatPulley;
  if (pul && pul.t < .88) { it.under = pul; return; }   // (the hints and the bot: the crank now)
  hatKeyShow(S, it);
}
function hatKeyShow(S, it) {
  const G = S.G, W = G.world;
  it.under = null; it.vacHidden = false; it.g.visible = true; W.idsDirty = true;
  // (in the cat pulley's basket: hung from the sleeping cat's collar at the basket's front — inside, the cat and the hat hid it)
  const bk = it.hatPulley?.furn?.basket; if (bk) { bk.attach(it.g); it.g.position.set(0, .31, .46); it.g.rotation.set(Math.PI / 2, 0, -.12); bk.updateMatrixWorld(true); }
  const g = it.g, y0 = g.position.y;
  S.tw.run(.35, k => { if (!S.dead) g.position.y = y0 + Math.sin(k * Math.PI) * .12; }).then(() => { if (!S.dead) g.position.y = y0; });
  G.audio.sfx('clink');
  const p = W.toScreen(S.worldCenter(it)); W.fx.burst(p.x, p.y - 10, { n: 14, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 140, gravity: -30, life: .7, size: 9 });
}
const bagPop = {
  async start(S, c) {
    const G = S.G, W = G.world, f = chOf(S), F = furnOf(S, 'train');
    G.audio.sfx('crossingFar');
    if (!f) return;
    await lookAt(S, f, 1.5); if (c.skipped) return;
    f.setFace?.('happy'); G.audio.sfx('hop');
    await S.tw.run(.4, k => { f.rx.y = hopK(.4, k); }); f.rx.y = 0; f.squash = .3;
    const bag = findF(S, /tripbag/), s = bag ? W.toScreen(topOf(bag)) : scr(W, f, .3);
    G.audio.sfx('pop', 3); G.hitstop(.04);
    W.fx.burst(s.x, s.y, { n: 24, colors: ['#5fae5a', '#ffd23f', '#7fc4e8', '#ff8a4c', '#ffffff'], shape: 'dot', speed: 360, size: 11, gravity: 600, up: 260, life: 1 });
    f.setFace?.('wow'); f._fx?.(S.tw, 'excl', { y: 1 });
    await c.wait(1.2);
  },
};
function freightMesh() {
  const g = new THREE.Group(), add = (w, h, d, col, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(col)); m.position.set(x, y, 0); m.castShadow = true; g.add(m); return m; };
  // the engine and its cab, three wagons behind, wheels
  add(1.3, .9, .8, '#3d6fb3', 0, .8); add(1.32, .12, .82, '#2b4f82', 0, 1.3); add(.5, .5, .78, '#3d6fb3', -.55, 1.45);
  for (let i = 0; i < 3; i++) { const x = -1.45 - i * 1.5; add(1.4, .85, .78, ['#b0613f', '#8a7a5c', '#b0613f'][i], x, .78); add(1.42, .06, .8, '#5a3e2e', x, 1.22); }
  for (let x = .4; x > -5.6; x -= .7) for (const z of [-.3, .3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .06, 12), toon('#3a3048')); w.rotation.x = Math.PI / 2; w.position.set(x, .22, z); g.add(w); }
  return g;
}
export async function stagingCrossing(S, part) {
  const G = S.G, W = G.world;
  if (S._crossRun) return; S._crossRun = true;
  const xs = []; for (const R of S.room.rooms || [S.room]) for (const r of R.furns) if (r.type === 'crossing') xs.push(r.f);
  const gx = S.room.parts.filter(p => p.gpt2Device === 'crossing');   // (GPT 벚꽃역: the barrier is the part itself)
  try {
    G.audio.sfx('crossingNear'); xs.forEach(f => { f.ringing = true; });
    await S.tw.run(.55, k => { xs.forEach(f => f.arm?.setOpen(k)); gx.forEach(p => p.setOpen(k)); W.shadowDirty = true; }, ease.outCubic); if (S.dead) return;
    await S.tw.wait(.35);
    // the freight train along the track (in the track's own frame: the platform train's), fast, right through the crossing
    const F = furnOf(S, 'train') || furnOf(S, 'gpt2_train');   // (GPT 벚꽃역: along its far track, between the platform and the far street)
    if (F) {
      const tr = freightMesh(); F.r.f.group.add(tr); W.idsDirty = true;
      const x0 = -7, x1 = 13; tr.position.set(x0, .1, -.02);
      G.audio.sfx('trainPass'); S.ambient?.gust?.(1.2);
      const hid = (S.items || []).filter(i => i.under?.crossing && !i.found);
      const hat = S.stgRoofHat, fall = hat && !S.stgHatDown && (keyOf(S, 'moment') === 'crossing' || hid.length > 0);
      const pass = S.tw.run(3, k => { tr.position.x = x0 + (x1 - x0) * k; W.shadowDirty = true; });
      if (fall) {
        S.stgHatDown = true;
        await S.tw.wait(.7); if (S.dead) return;
        // the wind of it: the hat spins off the roof and down onto the platform
        const R = roomOf(S), h0 = hat.position.clone(), h1 = h0.clone().add(V(.7, 0, .35)), gy = R.group.worldToLocal(furnOf(S, 'platshelter')?.r.f.group.getWorldPosition(V(0, 0, 0)) || V(0, 0, 0)).y + .02;
        h1.y = gy;
        // (27판: onto the luggage where the key waits, a hand's width beside it so the key shows)
        const basket = hid[0]?.hatPulley?.furn?.basket;
        if (basket) { R.group.updateMatrixWorld(true); const bp = R.group.worldToLocal(basket.getWorldPosition(V(0, 0, 0))); h1.set(bp.x + .15, bp.y + .42, bp.z - .05); }
        else if (hid[0]) { R.group.updateMatrixWorld(true); const kp = R.group.worldToLocal(hid[0].g.getWorldPosition(V(0, 0, 0))); h1.set(kp.x - .2, kp.y, kp.z + .06); }
        G.audio.sfx('whoosh');
        await S.tw.run(1.1, k => { hat.position.lerpVectors(h0, h1, k); hat.position.y = h0.y + (gy - h0.y) * k * k + Math.sin(k * Math.PI) * .35; hat.rotation.y = .6 + k * 9; hat.rotation.z = Math.sin(k * 12) * .4 * (1 - k); W.shadowDirty = true; });
        hat.rotation.set(0, hat.rotation.y, 0); G.audio.sfx('pop', 2);
        if (S.stgHatTip) { S.stgHatTip.parent?.remove(S.stgHatTip); S.stgHatTip = null; }
        if (basket) basket.attach(hat);   // (it rides down with the basket)
        for (const it of hid) hatLanded(S, it);
      }
      await pass; tr.parent?.remove(tr); tr.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    }
    // (no hat to blow down — a bot, a retry without the start: the key still comes out when the train has gone)
    for (const it of (S.items || []).filter(i => i.under?.crossing && !i.found)) hatLanded(S, it);
    await S.tw.wait(.3); if (S.dead) return;
    await S.tw.run(.5, k => { xs.forEach(f => f.arm?.setOpen(1 - k)); gx.forEach(p => p.setOpen(1 - k)); W.shadowDirty = true; }, ease.inOutQuad);
  } finally { xs.forEach(f => { f.ringing = false; }); S._crossRun = false; }
}

// ── 29판 흑백 (개굴이네 연잎 연못 집 frogpond, 10/24 — 스토리 룸 islandGray stage: { start: 'grayArrive', end: 'inkyTree' })
// 시작: 개굴이가 집 데크(기둥 위 둥근 마루 — 없으면 물가 잔교·좌대)에서 폴짝 뛰어내려 착지 → 물방울 튐; 바로 뒤 먹물이 대시로 색이 빠짐(stage.js inkyDash)
const deckTop = S => {
  const r = [...(S.room.rooms || [S.room])].flatMap(R => R.furns).find(q => q.f.heroKey === 's3c_house') || findF(S, /^(lakedeck|fishdock)$/);
  if (!r) return null;
  const b = new THREE.Box3().setFromObject(r.f.group);
  return r.f.heroKey === 's3c_house' ? V((b.min.x + b.max.x) / 2, b.min.y + .8, (b.min.z + b.max.z) / 2 + .35) : V((b.min.x + b.max.x) / 2, b.min.y + .32, (b.min.z + b.max.z) / 2);
};
const grayArrive = {
  async start(S, c) {
    const G = S.G, W = G.world, f = chOf(S); if (!f) return;
    const p0 = f.root.position.clone(), top = deckTop(S);
    const from = top ? f.root.parent.worldToLocal(top.clone()) : p0.clone().setY(p0.y + .5);
    // (no 먹물이 dash to drain it: the colour stays on until the hop lands, then drains here)
    const u = W.post?.u.gray, drain = !!(S.spec.gray && u && u.value > .5 && !S._dash);
    if (drain) u.value = 0;
    c.finish = () => { f.root.position.copy(p0); f.squash = 0; if (drain) u.value = 1; };
    await lookAt(S, f, 1.25, .45);
    f.root.position.copy(from); f.faceTo(W.cam.position.x, W.cam.position.z); f.setFace?.('happy'); G.audio.sfx('pop');
    await c.wait(.35);
    // the hop down off the deck: up a little, then down onto the lawn
    const dy = from.y - p0.y;
    await Promise.race([S.tw.run(.62, k => { f.root.position.lerpVectors(from, p0, k); f.root.position.y = p0.y + dy * (1 - k) + .45 * 4 * k * (1 - k); }, ease.inOutQuad), c.wait(.62)]);
    f.root.position.copy(p0); f.squash = .4; G.audio.sfx('blub');
    const s = scr(W, f, .05); W.fx.burst(s.x, s.y, { n: 16, colors: ['#8fd3ff', '#ffffff'], shape: 'dot', speed: 200, size: 7, gravity: 520, up: 140, life: .55 });
    f.setFace?.('wow');
    if (drain) { G.audio.sfx('whoosh'); await Promise.race([S.tw.run(.7, k => { u.value = k; }, ease.inOutQuad), c.wait(.7)]); u.value = 1; }
    await c.wait(.6);
  },
};
// 끝: 색이 다 돌아온 뒤 — 먹물이가 큰 나무 꼭대기(없으면 개굴이 집 지붕 위)에 앉아 손을 흔듦; 카메라가 올려다봄
const inkyTree = {
  async end(S, c) {
    const G = S.G, W = G.world, ch = S.villain?.ch; if (!ch) return;
    const tree = findF(S, /^(tree|bigtree)$/), house = [...(S.room.rooms || [S.room])].flatMap(R => R.furns).find(q => q.f.heroKey === 's3c_house');
    const r = tree || house; if (!r) return;
    // (stage.js: 먹물이's bolt off the edge is still running on its own tween — let it end first, then it is up there)
    for (let i = 0; i < 30 && ch.root.visible && !c.skipped; i++) await c.wait(.1);
    const b = new THREE.Box3().setFromObject(r.f.group), top = V((b.min.x + b.max.x) / 2, b.max.y - (tree ? .12 : .05), (b.min.z + b.max.z) / 2);
    ch.root.visible = true; ch.root.scale.setScalar(.85);
    ch.root.position.copy(ch.root.parent.worldToLocal(top.clone())); ch.faceTo(W.cam.position.x, W.cam.position.z); ch.setFace?.('happy'); ch.pose = 'wave';
    G.world.idsDirty = true;
    await lookAt(S, ch, 1.3, .6);
    G.audio.sfx('pop'); ch.bump?.(.4);
    await c.wait(1.8);
  },
};
const FX = { grayArrive, inkyTree, bagPop, tunnel, trainIn, sunsetTrain, partsDispatch, pengShake, jarHide, inkyTraceLook, smokeCat, sniffPoint, boardStop, whistleTest, capOn,
  twoChairs, bagOnChair, bagBurst, policeLights, crayonBox, comeHome, crayonWall, konbiniTicket, ticketGone, washerSock, sandShake, parfaitSpill, flagPick,
  marqueeFlicker, projectorFilm };
export const STAGING_KEYS = Object.keys(FX);
