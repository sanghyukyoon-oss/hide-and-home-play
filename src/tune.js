// The look settings panel (세팅): the user tunes light, shadow, cel steps, line and the camera live in the game.
// Values stay on this device (localStorage) and "값 복사" hands them over so they can be fixed in gfx/style.js.
import { ART, TUNE, applyArt } from './gfx/style.js';
import { STYLE } from './gfx/kit.js';
import { h } from './ui.js';

const KEY = 'sumbakkokjip.tune';
const DEF = { ...TUNE, shadowStr: ART.shadowStr, shade: ART.shade, mid: ART.mid, lineW: ART.lineW, ink: ART.ink, sharpen: ART.sharpen };

const FIELDS = [
  ['빛과 명암', [['bright', '전체 밝기', .6, 1.6, .01, '×'], ['sunMul', '햇빛 세기', .4, 1.8, .01, '×'], ['ambMul', '그늘 밝기', .4, 1.8, .01, '×'],
    ['shadowStr', '그림자 진하기', 0, 1, .01], ['shadeTint', '그늘 색 (0 회색 → 1 보라)', 0, 1, .01], ['shade', '셀 그림자 단계 (낮을수록 진함)', .3, 1, .01], ['mid', '셀 중간 단계', .4, 1, .01], ['sharpen', '선명하게 (언샵 마스크)', 0, 1.5, .01]]],
  ['선', [['lineW', '선 굵기', .5, 4, .1, 'px'], ['ink', '선 색', 'color']]],
  ['AO (구석·접지 그늘)', [['ao', 'AO 세기 (0 = 끔)', 0, 1, .01], ['aoR', 'AO 범위', .03, .3, .01]]],
  ['카메라 (지금 화면)', [['camZoom', '줌', .6, 3, .01, '×'], ['camPitch', '내려다보는 각도', .2, 1.3, .01]]],
];

export function loadTune(W) {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  if (o) apply(W, o);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(current())); } catch {} }
function current() { return { bright: TUNE.bright, sunMul: TUNE.sunMul, ambMul: TUNE.ambMul, shadowStr: ART.shadowStr, shade: ART.shade, mid: ART.mid, lineW: ART.lineW, ink: ART.ink, sharpen: ART.sharpen, shadeTint: ART.shadeTint || 0, ao: ART.ao, aoR: ART.aoR, gloss: ART.gloss || 0 }; }

function apply(W, o) {
  for (const k of ['bright', 'sunMul', 'ambMul']) if (o[k] != null) TUNE[k] = +o[k];
  for (const k of ['shadowStr', 'shade', 'mid', 'lineW', 'sharpen', 'ao', 'aoR', 'gloss', 'shadeTint']) if (o[k] != null) ART[k] = +o[k];
  if (o.ink) ART.ink = o.ink;
  if (W.toon) {
    W.sun.shadow.intensity = ART.shadowStr; W.shadowDirty = true;
    const g = STYLE.grad; if (g) { g.image.data[0] = Math.round(ART.shade * 255); g.image.data[1] = Math.round(ART.mid * 255); g.needsUpdate = true; }
    if (W.post) { applyArt(W.post); W.post.setLine(ART.lineW * (W.lineScale || 1)); }
    W.setLight(W._light ?? null);
  }
}

export function openTune(G, { onClose } = {}) {
  const W = G.world;
  document.getElementById('tune')?.remove();
  const vals = () => ({ ...current(), camZoom: W.zoom, camPitch: W.pitch });
  const S = vals();
  const body = h('div', { class: 'tbody' });
  const inputs = {};
  const fmt = (v, st, unit = '') => (st < .1 ? (+v).toFixed(2) : (+v).toFixed(1)) + unit;
  for (const [group, list] of FIELDS) {
    body.append(h('div', { class: 'ghead' }, group));
    for (const [k, label, a, b, st, unit] of list) {
      const val = h('b', {}, '');
      const inp = document.createElement('input');
      if (a === 'color') { inp.type = 'color'; inp.value = S[k]; val.textContent = S[k]; inp.oninput = () => { val.textContent = inp.value; set(k, inp.value); }; }
      else {
        Object.assign(inp, { type: 'range', min: a, max: b, step: st, value: S[k] });
        val.textContent = fmt(S[k], st, unit);
        inp.oninput = () => { val.textContent = fmt(inp.value, st, unit); set(k, +inp.value); };
      }
      inputs[k] = { inp, val, st, unit };
      body.append(h('label', { class: 'row' }, h('div', { class: 'rtop' }, h('span', {}, label), val), inp));
    }
  }
  function set(k, v) {
    if (k === 'camZoom') { W.minZoom = Math.min(W.minZoom, v); W.maxZoom = Math.max(W.maxZoom, v); W.zoom = v; return; }
    if (k === 'camPitch') { W.minPitch = Math.min(W.minPitch, v); W.maxPitch = Math.max(W.maxPitch, v); W.pitch = v; return; }
    apply(W, { [k]: v }); save();
    if (k === 'ao' || k === 'aoR') { W.aoAuto = false; W._applyAO?.(); }   // touching AO here undoes a slow phone's auto-off
  }
  // camera: the turn dial (default) or the second-finger tap — the only two left (10/18)
  const ST = G.save.settings || (G.save.settings = {});
  const ctrlLbl = () => ST.ctrl === 'E' ? '조작: 톡 (끌면 이동 · 다른 손 톡 = 회전)' : '조작: 기본 (끌면 이동 · 돌림판이나 두 손가락 비틀기 = 회전)';
  const ctrlBtn = G.ui.btn(ctrlLbl(), { color: 'purple', cls: 'sm', onClick: () => { ST.ctrl = ST.ctrl === 'E' ? 'F' : 'E'; W.scheme = ST.ctrl; W.eMode = W.eBase = 'move'; G.persist(); ctrlBtn.querySelector('.lbl').textContent = ctrlLbl(); } });
  // quick switches for the two looks the user wanted to try: AO and the vinyl-toy sheen on characters
  const aoLbl = () => ART.ao > .001 ? 'AO: 켜짐' : 'AO: 꺼짐';
  const aoBtn = G.ui.btn(aoLbl(), { color: 'blue', cls: 'sm', onClick: () => { set('ao', ART.ao > .001 ? 0 : .5); aoBtn.querySelector('.lbl').textContent = aoLbl(); if (inputs.ao) { inputs.ao.inp.value = ART.ao; inputs.ao.val.textContent = (+ART.ao).toFixed(2); } } });
  const glLbl = () => ART.gloss ? '캐릭터 광택: 켜짐 (다음 화면부터)' : '캐릭터 광택: 꺼짐';
  const glBtn = G.ui.btn(glLbl(), { color: 'blue', cls: 'sm', onClick: () => { ART.gloss = ART.gloss ? 0 : .4; save(); glBtn.querySelector('.lbl').textContent = glLbl(); } });
  body.append(h('div', { class: 'ghead' }, '조작'), h('div', { class: 'tbtns' }, ctrlBtn), h('div', { class: 'ghead' }, '룩 스위치'), h('div', { class: 'tbtns' }, aoBtn, glBtn));
  const copyArea = h('textarea', { class: 'copyarea', readonly: true }); copyArea.hidden = true;
  const btns = h('div', { class: 'tbtns' },
    G.ui.btn('값 복사', { color: 'green', cls: 'sm', onClick: () => {
      const txt = JSON.stringify(vals(), null, 1);
      const fallback = () => { copyArea.hidden = false; copyArea.value = txt; copyArea.focus(); copyArea.select(); G.ui.toast('아래 칸을 길게 눌러 복사해 주세요', ''); };
      try { navigator.clipboard.writeText(txt).then(() => G.ui.toast('설정값을 복사했어요', 'green'), fallback); } catch { fallback(); }
    } }),
    G.ui.btn('기본값', { color: 'gray', cls: 'sm', onClick: () => { apply(W, DEF); save(); for (const k in inputs) { const v = vals()[k], I = inputs[k]; I.inp.value = v; I.val.textContent = I.inp.type === 'color' ? v : fmt(v, I.st, I.unit); } } }));
  const close = h('button', { class: 'tclose', onclick: () => { el.remove(); onClose?.(); } }, '×');
  const el = h('div', { id: 'tune' }, h('div', { class: 'thead' }, h('span', {}, '세팅'), close), body, btns, copyArea);
  // the panel must not turn the camera or tap the scene underneath
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) el.addEventListener(ev, e => e.stopPropagation());
  document.getElementById('app').append(el);
}
