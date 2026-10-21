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

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const keyOf = (S, phase) => !S.custom && !S.preview && !S.model && !S.G.bot ? sceneAt(S.idx)?.stage?.[phase] || null : null;
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
  try { await Promise.race([fx(S, c), skipped.then(() => S.tw.wait(.05))]); } catch (e) { console.warn('staging', k, e); }
  ov.remove();
  if (c.skipped) c.finish?.();
  if (S.dead) return;
  // (back to where the stage is played from)
  if (phase === 'start') await W.flyTo(S.tw, { ...back, dur: .45 });
}
// while the friend hides (사건 판, r1Hide's eyes-shut card)
export function stagingHide(S, ov) { const k = keyOf(S, 'start'); FX[k]?.hide?.(S, ov); }
export function stagingHidden(S) { const k = keyOf(S, 'start'); FX[k]?.hidden?.(S); }

// ── 28판 시작: 창밖이 흐르고 객실이 살짝 흔들린다 → 숨는 동안 터널(까만 1초) → 밝아지면 너굴이 자리에 모자만
function flowWindows(S) {
  const tex = trainView(); if (!tex || S._flow) return;
  tex.wrapS = THREE.MirroredRepeatWrapping; tex.needsUpdate = true;
  // (the whole stage: the train is moving)
  S._flow = true; S.ambient?.ticks.push(t => { tex.offset.x = t * .14; });
  S.G.audio.loopSfx?.('trainRumble', .45);
}
function sway(S, dur, amp = .004) {
  const g = S.room.group, z0 = g.rotation.z;
  return S.tw.run(dur, k => { g.rotation.z = z0 + Math.sin(k * dur * 11) * amp * Math.sin(k * Math.PI); }).then(() => { g.rotation.z = z0; });
}
function hatMesh() {
  const g = new THREE.Group(), m = c => new THREE.MeshToonMaterial({ color: c });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .018, 24), m('#e8c36a')); g.add(brim);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.11, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), m('#f0d27e')); top.position.y = .008; top.scale.y = .9; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.112, .112, .03, 20, 1, true), m('#e2584f')); band.position.y = .025; g.add(band);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const tunnel = {
  async start(S, c) {
    const G = S.G, W = G.world;
    flowWindows(S);
    // in to the window at seat height, the carriage rocking a little
    // (the window that faces the camera — one on the far wall, seen from inside the carriage)
    let win = null, best = -1; const tex = trainView(), cd = V(0, 0, 0); W.cam.getWorldDirection(cd);
    S.room.group.traverse(o => {
      if (!o.isMesh || o.material?.map !== tex) return;
      if (o.userData.furn?.parts?.some(q => /블라인드/.test(q.label) && q.t < .5)) return;
      const n = V(0, 0, 1).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion())), d = -n.dot(cd);
      if (d > best) { best = d; win = { o, n }; }
    });
    if (win && best > .2) { const p = win.o.getWorldPosition(V(0, 0, 0)); W.flyTo(S.tw, { target: V(p.x, p.y - .25, p.z), zoom: Math.max(W.zoom * 1.8, 2.6), dur: .6 }); }
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
    const { R, r } = F, car = r.f.car, x0 = car.position.x, f = S.friend;
    const doors = r.f.doors || [];
    const fp = f?.root.getWorldPosition(V(0, 0, 0));
    const door = doors.map(d => ({ d, p: d.getWorldPosition(V(0, 0, 0)) })).sort((a, b) => (fp ? a.p.distanceTo(fp) - b.p.distanceTo(fp) : 0))[0];
    c.finish = () => { car.position.x = x0; if (door) door.d.position.x = door.d.userData.x0 ?? door.d.position.x; };
    // the track, then the train comes in from the far end and slows to a stop
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
    await W.flyTo(S.tw, { target: V(dp.x, dp.y - .3, dp.z + .5), zoom: W.zoom * 2, dur: .6 });
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

const FX = { tunnel, trainIn, sunsetTrain, partsDispatch, pengShake, jarHide, inkyTraceLook, smokeCat, sniffPoint, boardStop, whistleTest, capOn };
export const STAGING_KEYS = Object.keys(FX);
