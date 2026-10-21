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

const FX = { tunnel, trainIn, sunsetTrain };
export const STAGING_KEYS = Object.keys(FX);
