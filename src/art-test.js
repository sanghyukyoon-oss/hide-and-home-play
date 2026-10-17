// Art test: the same room + cat rendered as  기존(soft PBR) / 카툰(cel + ink outline) / 픽셀(low-res cel + 1px ink + posterize).
// Also trials the new camera: drag to rotate, release snaps to one of 4 diagonal views; limited tilt; pinch/wheel zoom.
import * as THREE from 'three';
import { setStyle, STYLE } from './gfx/kit.js';
import { Room, attachItem } from './room.js';
import { THEMES, LAYOUTS, stageSpec, planStage } from './stages.js';
import { buildItem } from './gfx/items.js';
import { Char } from './gfx/chars.js';
import { ToonPost } from './gfx/toonpost.js';
import { qs, clamp, lerp } from './util.js';

// Common rules for the cartoon look: matte, saturated-but-harmonious, big silhouettes, ink lines, tinted shadows.
const TOY = {
  ...THEMES.bunny, name: '토순이네 침실 (아트 테스트)',
  base: '#ff8fb0', floorKind: 'planks', floor: '#f4d3a2', floor2: '#d29f68',
  wallKind: 'heart', wall: '#fff0cf', wall2: '#ffb1c6', wainscot: '#83d8c8', trim: '#ffffff', wallEdge: '#ffd9ae',
  wood: '#f0c58e', woodD: '#c98f58', body: '#fff7ea', accent: '#ff6f91', accent2: '#4fb8ff', accent3: '#ffd23f',
  door: '#ff8fb0', knob: '#ffd23f', sheet: '#ffffff', pillow: '#fff1c4', fabric: '#ff9db8', fabric2: '#ffc4d5',
  curtain: '#ff7fa3', rug: '#ffd23f', rug2: '#ff8fb0', pot: '#ff7f5c', top: '#ffffff',
};
// pastel → vivid: push saturation, pull very light tints down a touch so colours read as paint, not chalk
function vivid(hex) {
  const c = new THREE.Color(hex), h = {}; c.getHSL(h);
  if (h.s < .05) return '#' + c.getHexString();
  h.s = Math.min(1, h.s * 1.1 + .05);
  if (h.l > .82) h.l -= .05;
  c.setHSL(h.h, h.s, h.l);
  return '#' + c.getHexString();
}

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
const post = new ToonPost(renderer);
const cam = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 200);
let scene, room, chars = [], lights, mode = qs.get('style') || 'toon';

// ── camera rig with 4-way snap
const rig = { yaw: Math.PI / 4 + (+(qs.get('view') || 0)) * Math.PI / 2, yawGoal: null, pitch: +(qs.get('pitch') || .62), zoom: 1, vYaw: 0 };
const VIEWS = [0, 1, 2, 3].map(k => Math.PI / 4 + k * Math.PI / 2);
function nearestView(y, bias = 0) {
  const k = Math.round((y - Math.PI / 4) / (Math.PI / 2) + bias);
  return Math.PI / 4 + k * Math.PI / 2;
}
const fakeWorld = { shadowDirty: true, get yaw() { return rig.yaw; } };

// ── render settings (controller). Values persist per browser so they can be tuned and then fixed in code.
const KEY = 'sbk.art.settings.v5';
export const DEFAULTS = {
  // fixed from the user's tuning (2026-10-14): one unified near-black line, no creases, no AO, light cast shadows
  lineW: 3, overlap: .25, innerStr: 0, innerRatio: .7, innerSens: .3, lineAlpha: 1,
  ink: '#1f1a22', tint: 0, tintDark: .9,
  ao: 0, aoR: .1, aoTint: '#c6a3ff', shadowStr: .3,
  sun: 2.1, amb: 1.25, shade: .6, mid: .84, ss: 2,
};
let S = { ...DEFAULTS };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
function saveS() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
function applyS({ sizes = false } = {}) {
  const u = post.u;
  u.innerRatio.value = S.innerRatio; u.innerStr.value = S.innerStr; u.lineAlpha.value = S.lineAlpha; u.overlap.value = S.overlap;
  u.nLo.value = mode === 'pixel' ? .3 : S.innerSens; u.nHi.value = u.nLo.value + .18;
  u.ink.value.set(S.ink); u.tint.value = S.tint; u.tintDark.value = S.tintDark;
  u.aoStr.value = S.ao; post.au.radius.value = S.aoR; u.aoTint.value.set(S.aoTint);
  if (lights && mode !== 'std') {
    lights.forEach(l => { if (l.isAmbientLight) l.intensity = S.amb; if (l.isDirectionalLight) { l.intensity = S.sun; l.shadow.intensity = S.shadowStr; } });
    if (STYLE.grad) { const d = STYLE.grad.image.data; d[0] = Math.round(S.shade * 255); d[1] = Math.round(Math.max(S.shade, S.mid) * 255); STYLE.grad.needsUpdate = true; }
  }
  if (sizes) resize(); else post.setLine(S.lineW);
  saveS();
}

function build() {
  setStyle(mode === 'std' ? 'std' : 'toon', { remap: mode === 'std' ? null : vivid, steps: [S.shade, Math.max(S.shade, S.mid), 1] });
  scene = new THREE.Scene();
  lights = [];
  if (mode === 'std') {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    lights.push(new THREE.HemisphereLight('#fff4fb', '#d9c6ff', 1.35));
    const s = new THREE.DirectionalLight('#fff0dc', 1.9); lights.push(s);
    const f = new THREE.DirectionalLight('#cfe6ff', .45); f.position.set(-6, 4, -3); lights.push(f);
  } else {
    renderer.toneMapping = THREE.NoToneMapping;
    lights.push(new THREE.AmbientLight('#c9b6ff', S.amb));          // shadow side reads lavender, not grey
    const s = new THREE.DirectionalLight('#fff3e0', S.sun); lights.push(s);
  }
  const sun = lights.find(l => l.isDirectionalLight);
  sun.position.set(4, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 });
  sun.shadow.radius = mode === 'std' ? 1 : 3;
  lights.forEach(l => scene.add(l));
  const theme = mode === 'std' ? THEMES.bunny : TOY;
  room = new Room(fakeWorld, { w: 5, d: 5, theme, ...LAYOUTS.bunny });
  scene.add(room.group);
  // the same props as stage 8 (7 targets + clutter)
  const spec = stageSpec(7), plan = planStage(room, spec);
  for (const l of plan.locks) l.part.furn.setLock(l.part, l.kind, l.code);
  for (const p of plan.placements) { const g = buildItem(p.type, { code: p.code, v: p.v }); attachItem(p.spot, g, { rotY: (plan.rotSeed() - .5) * 1.4, scale: p.role === 'decoy' ? 1.08 : 1.15 }); }
  chars = [];
  for (const [k, x, z] of [['cat', .35, .55], ['mong', 1.15, .95]]) {
    const c = new Char(k); c.root.position.set(x, .03, z); c.root.rotation.y = .78; c.setFace(k === 'mong' ? 'happy' : 'normal'); scene.add(c.root); chars.push(c);
  }
  scene.traverse(o => { if (o.userData.proxy) o.layers.set(1); if (o.material?.transparent && o.isMesh && !o.userData.proxy) o.layers.set(2); });
  post.assignIds(scene);
  if (mode !== 'std') post.u.levels.value = mode === 'pixel' ? 9 : 0;
  document.getElementById('app').dataset.mode = mode;
  resize();
  applyS();
  updateLabel();
}
function dispose() { if (!scene) return; scene.traverse(o => { if (o.isMesh) o.geometry?.dispose?.(); }); }

function resize() {
  const w = innerWidth, h = innerHeight;
  const pr = mode === 'pixel' ? clamp(300 / Math.min(w, h * .75), .25, 1) : Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const db = renderer.getDrawingBufferSize(new THREE.Vector2());
  post.setSize(db.x, db.y, { dpr: pr, lineCss: S.lineW, pixelArt: mode === 'pixel', maxSS: S.ss });
  const a = w / h, viewH = Math.max(7.5 / .94 / a, 6.6 / .62);
  cam.top = viewH * .47; cam.bottom = -viewH * .53; cam.left = -viewH * a / 2; cam.right = viewH * a / 2; cam.updateProjectionMatrix();
}
addEventListener('resize', resize);

// The key light travels with the camera (studio light), so all four views get the same lit-from-front-left look.
function updLight() {
  const sun = lights.find(l => l.isDirectionalLight);
  const a = rig.yaw + .55;
  sun.position.set(Math.sin(a) * 7, 10, Math.cos(a) * 7);
  sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
}
function updCam() {
  updLight();
  const d = 40, cp = Math.cos(rig.pitch), t = new THREE.Vector3(0, .75, 0);
  cam.position.set(d * cp * Math.sin(rig.yaw), .75 + d * Math.sin(rig.pitch), d * cp * Math.cos(rig.yaw));
  cam.lookAt(t);
  if (cam.zoom !== rig.zoom) { cam.zoom = rig.zoom; cam.updateProjectionMatrix(); }
}

// ── input: drag = rotate (snap on release), vertical drag = tilt within limits, pinch/wheel = zoom
const ptrs = new Map(); let drag = null, pinch = null;
const app = document.getElementById('app');
app.addEventListener('pointerdown', e => {
  if (e.target !== canvas) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, x0: e.clientX, moved: false, v: 0, t: performance.now() }; rig.yawGoal = null; }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null; }
});
app.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); rig.zoom = clamp(rig.zoom * d / pinch, 1, 2.4); pinch = d; return; }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(e.clientX - drag.x0) > 8) drag.moved = true;
  const k = 5.2 / Math.max(innerWidth, 360);
  rig.yaw -= dx * k; rig.pitch = clamp(rig.pitch + dy * k * .6, .45, .95);
  const now = performance.now(); drag.v = lerp(drag.v, -dx * k / Math.max(.001, (now - drag.t) / 1000), .5); drag.t = now;
  drag.x = e.clientX; drag.y = e.clientY;
});
const up = e => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
  if (drag && ptrs.size === 0) {
    // fling picks the next view in the flick direction, otherwise the nearest
    const bias = Math.abs(drag.v) > 2.5 ? Math.sign(drag.v) * .45 : 0;
    rig.yawGoal = nearestView(rig.yaw, bias / 1);
    drag = null;
  }
};
app.addEventListener('pointerup', up); app.addEventListener('pointercancel', up);
app.addEventListener('wheel', e => { e.preventDefault(); rig.zoom = clamp(rig.zoom * Math.exp(-e.deltaY * .0015), 1, 2.4); }, { passive: false });

// ── UI
function updateLabel() {
  document.querySelectorAll('[data-style]').forEach(b => b.classList.toggle('on', b.dataset.style === mode));
}
document.querySelectorAll('[data-style]').forEach(b => b.addEventListener('click', () => { if (mode === b.dataset.style) return; dispose(); mode = b.dataset.style; build(); }));
document.getElementById('rotL').addEventListener('click', () => { rig.yawGoal = nearestView(rig.yaw) - Math.PI / 2; });
document.getElementById('rotR').addEventListener('click', () => { rig.yawGoal = nearestView(rig.yaw) + Math.PI / 2; });

// ── controller panel
const FIELDS = [
  ['선', [
    ['lineW', '선 굵기', .5, 5, .1, 'px'], ['lineAlpha', '선 불투명도', 0, 1, .05],
    ['overlap', '겹침선 기준 (같은 물체가 겹칠 때, 높을수록 적음)', .05, 1, .01]]],
  ['주름선 (선택)', [
    ['innerStr', '주름선 진하기 (0 = 끔)', 0, 1, .05], ['innerRatio', '주름선 굵기 비율', .1, 1.5, .05], ['innerSens', '주름선 감도 (낮을수록 많음)', .05, .6, .01]]],
  ['선 색', [
    ['ink', '기본 선 색', 'color'], ['tint', '물체색 섞기 (0=통일, 1=물체색)', 0, 1, .05], ['tintDark', '물체색 밝기 (낮을수록 진함)', .15, .9, .01]]],
  ['AO (구석 그늘)', [['ao', 'AO 세기', 0, 1, .01], ['aoR', 'AO 반경', .1, 1, .01], ['aoTint', 'AO 색', 'color']]],
  ['빛과 명암', [['shadowStr', '드리운 그림자 진하기', 0, 1, .05], ['sun', '빛 세기', 0, 4, .05], ['amb', '어두운 면 밝기', 0, 3, .05], ['shade', '셀 그림자 단계', .3, 1, .01], ['mid', '셀 중간 단계', .4, 1, .01]]],
  ['성능', [['ss', '슈퍼샘플 배율', 1, 2, .05, 'x']]],
];
const PRESETS = {
  '검정 통일': { ink: '#1f1a22', tint: 0 },
  '진자주 통일': { ink: '#3d2233', tint: 0 },
  '컬러 트레스': { ink: '#3d2233', tint: .35, tintDark: .45 },
  '물체색만': { tint: 1, tintDark: .45 },
};
const panel = document.getElementById('panel'), body = document.getElementById('panelBody');
const inputs = {};
function fmt(v, st, unit = '') { return (st < .1 ? (+v).toFixed(2) : (+v).toFixed(1)) + unit; }
function buildPanel() {
  body.innerHTML = '';
  const pr = document.createElement('div'); pr.className = 'presets';
  for (const name in PRESETS) { const b = document.createElement('button'); b.textContent = name; b.onclick = () => { Object.assign(S, PRESETS[name]); syncInputs(); applyS(); }; pr.append(b); }
  body.append(Object.assign(document.createElement('div'), { className: 'ghead', textContent: '선 색 프리셋' }), pr);
  for (const [group, list] of FIELDS) {
    body.append(Object.assign(document.createElement('div'), { className: 'ghead', textContent: group }));
    for (const [k, label, a, b, st, unit] of list) {
      const row = document.createElement('label'); row.className = 'row';
      const top = document.createElement('div'); top.className = 'rtop';
      const name = document.createElement('span'); name.textContent = label;
      const val = document.createElement('b');
      top.append(name, val); row.append(top);
      const inp = document.createElement('input');
      if (a === 'color') { inp.type = 'color'; inp.value = S[k]; inp.oninput = () => { S[k] = inp.value; val.textContent = inp.value; applyS(); }; val.textContent = S[k]; }
      else {
        Object.assign(inp, { type: 'range', min: a, max: b, step: st, value: S[k] });
        inp.oninput = () => { S[k] = +inp.value; val.textContent = fmt(inp.value, st, unit); applyS({ sizes: k === 'ss' }); };
        val.textContent = fmt(S[k], st, unit);
      }
      inp.id = 'set-' + k;
      row.append(inp); body.append(row);
      inputs[k] = { inp, val, st, unit };
    }
  }
}
function syncInputs() { for (const k in inputs) { const { inp, val, st, unit } = inputs[k]; inp.value = S[k]; val.textContent = inp.type === 'color' ? S[k] : fmt(S[k], st, unit); } }
buildPanel();
const appEl = document.getElementById('app');
document.getElementById('panelBtn').addEventListener('click', () => { panel.hidden = !panel.hidden; appEl.classList.toggle('panel-open', !panel.hidden); });
document.getElementById('panelClose').addEventListener('click', () => { panel.hidden = true; appEl.classList.remove('panel-open'); });
document.getElementById('resetBtn').addEventListener('click', () => { S = { ...DEFAULTS }; syncInputs(); applyS({ sizes: true }); toast('기본값으로 되돌렸어요'); });
document.getElementById('copyBtn').addEventListener('click', () => {
  const txt = JSON.stringify(S, null, 2);
  const done = () => toast('설정값을 복사했어요');
  const fallback = () => { const ta = document.getElementById('copyArea'); ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); toast('아래 칸을 길게 눌러 복사해 주세요'); };
  try { navigator.clipboard.writeText(txt).then(done, fallback); } catch { fallback(); }
});
function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

// ── loop
let last = performance.now(), frames = 0, fps = 60, acc = 0, n = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 12); last = now; frames++;
  acc += dt; n++; if (acc > .5) { fps = Math.round(n / acc); acc = 0; n = 0; }
  if (rig.yawGoal != null) { rig.yaw += (rig.yawGoal - rig.yaw) * (1 - Math.exp(-dt * 10)); if (Math.abs(rig.yawGoal - rig.yaw) < .001) { rig.yaw = rig.yawGoal; rig.yawGoal = null; } }
  updCam();
  room.update(dt);
  // the characters turn to face whichever of the four views you settle on
  for (const c of chars) { c.update(dt); let d = rig.yaw - c.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.root.rotation.y += d * (1 - Math.exp(-dt * 4)); }
  if (mode === 'std') { renderer.setRenderTarget(null); renderer.render(scene, cam); }
  else post.render(scene, cam);
  requestAnimationFrame(frame);
}
build();
requestAnimationFrame(frame);
window.__art = {
  post,
  dbg: () => { const ids = new Set(); let hooked = 0, n = 0; scene.traverse(m => { if (m.isMesh) { n++; ids.add(m.userData.oid); if (m.onBeforeRender === post._hook) hooked++; } }); const b = new Uint8Array(4); const W = post.nd.width, H = post.nd.height; const pts = [[.5, .45], [.42, .4], [.6, .5], [.5, .6]].map(([x, y]) => { renderer.readRenderTargetPixels(post.nd, Math.round(W * x), Math.round(H * y), 1, 1, b); return [...b]; }); return { n, distinct: ids.size, hooked, pts }; },
  ready: true,
  set: m => { dispose(); mode = m; build(); },
  view: k => { rig.yaw = VIEWS[((k % 4) + 4) % 4]; rig.yawGoal = null; },
  pitch: p => { rig.pitch = p; }, zoom: z => { rig.zoom = z; },
  stats: () => ({ mode, fps, ss: +post.ss.toFixed(2), calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
  settings: o => { if (o) { Object.assign(S, o); syncInputs(); applyS({ sizes: true }); } return S; },
  panel: on => { panel.hidden = !on; appEl.classList.toggle('panel-open', !!on); },
  cat: f => chars.forEach(c => c.setFace(f)),
};
window.__jam = { ready: true };
document.getElementById('boot')?.remove();
