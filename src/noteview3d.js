// 쪽지 펼치기 3D (③ 10/22, user OK "누르면 펼쳐지면서 정보 나오게 하면 될 듯" + "모델링은 무조건 GPT에게"): the same flow as the ui87
// mock (picked up → to the middle → unfolds → the password shows → a tap folds it into its chip; the chip again → open at once),
// but the note is a 3D model: any { group, unfold(t), face } — GPT's gpt-notes.js (gpt_note_letter / triangle / memo / card) when
// it comes; until then the stand-in below, same shape. face: a mesh we draw the writing on (a canvas texture).
// Drawn by the game's own renderer (no second WebGL window — phone memory): the note sits just in front of the camera and the
// room's lights dim while it is up.
import * as THREE from 'three';
import { h } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { createNote, noteKeyFor } from './gfx/gpt-notes.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
// on in the game once GPT's folded notes are in (gpt-notes.js) and the user has seen them: until then ?note=3d
// (③ 10/22: GPT's folded notes are in and picked — on by default; ?note=flat for the old flat note and its fly to the chip)
export const NOTE3D = !(typeof location !== 'undefined' && /[?&]note=flat(&|$)/.test(location.search));
export const NOTE_TXT = { fold: K('터치하면 접어서 넣어요', 'Tap to fold it away'), title: K('비밀번호 ♡', 'Password ♡') };

// the writing on the face: handwritten digits on ruled paper (the face mesh's own uv 0..1)
// the writing for a GPT note's inner sheet (its face: one canvas over the whole open sheet, 576 × 768, 8 % kept clear)
export function noteFaceCanvas(code, line = '') {
  const cv = document.createElement('canvas'); cv.width = 576; cv.height = 768; const x = cv.getContext('2d');
  // (the face's map is the whole inner sheet: the paper itself first, its faint lines, then the writing)
  x.fillStyle = '#fef9e9'; x.fillRect(0, 0, 576, 768); x.fillStyle = 'rgba(139,112,76,.05)'; for (let i = 0; i < 220; i++) x.fillRect((i * 137) % 576, (i * 83) % 768, 1, i % 3 + 1);
  x.fillStyle = '#d8e6f6'; for (let y = 120; y < 700; y += 58) x.fillRect(46, y, 484, 3);
  x.fillStyle = '#8a7aa8'; x.font = "34px Ssurround, sans-serif"; x.textAlign = 'center'; x.fillText(line || tr(NOTE_TXT.title), 288, 250);
  x.fillStyle = '#2b62c9'; x.font = "700 170px LatinRound, Ssurround, sans-serif"; x.textBaseline = 'middle';
  const s = String(code), w = 130;
  [...s].forEach((d, i) => { x.save(); x.translate(288 + (i - (s.length - 1) / 2) * w, 420 + [0, -10, 8, -5][i % 4]); x.rotate([-.1, .07, -.05, .11][i % 4]); x.fillText(d, 0, 0); x.restore(); });
  x.strokeStyle = '#2b62c9'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(170, 540); x.quadraticCurveTo(288, 575, 406, 535); x.stroke();
  return cv;
}
// GPT's note as the view wants it ({ group, unfold, face, size }), standing up facing +z, the code written on its face
export function gptNote(code, line = '') {
  const n = createNote(noteKeyFor(code)); n.group.rotation.set(0, 0, 0); n.group.position.set(0, 0, 0);
  n.setContentCanvas(noteFaceCanvas(code, line));
  return { group: n.group, unfold: t => n.unfold(t), face: null, size: [n.info?.width || .9, n.info?.height || 1.2], dispose: () => n.dispose(), gpt: true };
}
export function noteFaceTex(code, line = '') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384; const x = cv.getContext('2d');
  x.fillStyle = '#fff8e2'; x.fillRect(0, 0, 512, 384);
  x.fillStyle = '#d8e6f6'; for (let y = 48; y < 384; y += 44) x.fillRect(0, y, 512, 3);
  x.fillStyle = '#8a7aa8'; x.font = "600 30px 'Ssurround', sans-serif"; x.save(); x.translate(34, 58); x.rotate(-.05); x.fillText(line || tr(NOTE_TXT.title), 0, 0); x.restore();
  x.fillStyle = '#2b62c9'; x.font = "700 150px 'LatinRound', 'Ssurround', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle';
  const s = String(code), w = 112;
  [...s].forEach((d, i) => { x.save(); x.translate(256 + (i - (s.length - 1) / 2) * w, 220 + [0, -8, 6, -4][i % 4]); x.rotate([-.1, .07, -.05, .11][i % 4]); x.fillText(d, 0, 0); x.restore(); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// the stand-in folded note (GPT's model replaces it): a sheet in three bands, folded in thirds and then in half; unfold(t):
// t 0 → .5 the half opens, .5 → 1 the top and bottom thirds fold out (a little bend past flat, then flat)
export function standInNote() {
  const W = 2, H = 2.6, b = H / 3, T = .02, paper = new THREE.MeshBasicMaterial({ color: '#fff4cf', toneMapped: false }), back = new THREE.MeshBasicMaterial({ color: '#efdcae', toneMapped: false });
  const panel = () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(W / 2, b, T), [paper, paper, paper, paper, paper, back]); g.add(m); return { g, m }; };
  const group = new THREE.Group(), half = new THREE.Group(); group.add(half);
  // left half fixed, right half hinged at the middle; each half three bands, the outer two hinged at the middle band
  const halves = [-1, 1].map(sx => {
    const H2 = new THREE.Group(); (sx < 0 ? group : half).add(H2);
    const mid = panel(); mid.g.position.set(sx * W / 4, 0, 0); H2.add(mid.g);
    const topH = new THREE.Group(); topH.position.set(sx * W / 4, b / 2, 0); H2.add(topH); const top = panel(); top.g.position.set(0, b / 2, 0); topH.add(top.g);
    const botH = new THREE.Group(); botH.position.set(sx * W / 4, -b / 2, 0); H2.add(botH); const bot = panel(); bot.g.position.set(0, -b / 2, 0); botH.add(bot.g);
    return { topH, botH };
  });
  // a strip of red tape on the outside, and the face: one plane over the whole open sheet (the bands fold over it)
  const tape = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .01), new THREE.MeshBasicMaterial({ color: '#ff5f6e' })); tape.position.set(-.55, .2, -.02); tape.rotation.z = .4; group.add(tape);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * .96, b * .96), new THREE.MeshBasicMaterial({ color: '#ffffff' })); face.position.z = T / 2 + .002; group.add(face);
  const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x), bend = (k) => (1 - k) * Math.PI - Math.sin(k * Math.PI) * .18;
  const unfold = t => {
    const a = ss(t / .5), c = ss((t - .5) / .5);
    half.rotation.y = bend(a) * -1; half.position.x = 0;
    for (const s of halves) { s.topH.rotation.x = -bend(c); s.botH.rotation.x = bend(c); }
    face.visible = c > .55; tape.visible = t < .9;
  };
  unfold(0);
  return { group, unfold, face, size: [W, H] };
}

// up: { make, code, x, y, open, pill, line } — make() gives the model ({ group, unfold, face, size })
export async function showNote3D(G, { make = null, code = '000', x = innerWidth / 2, y = innerHeight / 2, open = false, pill = null, line = '' } = {}) {
  const W = G.world, cam = W.cam, M = make ? make() : gptNote(code, line), g = M.group, [mw, mh] = M.size || [2, 2.6];
  void mh;
  if (M.face) { M.face.material = new THREE.MeshBasicMaterial({ map: noteFaceTex(code, line), toneMapped: false }); }
  // just in front of the camera: a world unit per screen pixel, the sheet about 240 px wide
  const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
  const at = (sx, sy, dist) => { const v = new THREE.Vector3((sx / W.W) * 2 - 1, -(sy / W.H) * 2 + 1, -1).unproject(cam); return v.add(dir.clone().multiplyScalar(dist)); };
  // (unproject gives a point on the near plane; moved on along the view to `dist`)
  const center = at(W.W / 2, W.H * .44, 1.2), from = at(x, y, 1.2);
  // (a world unit on the screen, measured: the sheet about 230 px wide)
  const upp = center.distanceTo(at(W.W / 2 + 100, W.H * .44, 1.2)) / 100, px = 230 / mw * upp;
  // the room dims while the note is up (its lights turned down; the note itself is unlit paper, so it stays bright) — a see-
  // through veil in front was drawn by the outline pass as one big object and hid nothing
  const L0 = { a: W.hemi.intensity, s: W.sun.intensity }, dim = k => { W.hemi.intensity = L0.a * (1 - .3 * k); W.sun.intensity = L0.s * (1 - .3 * k); };
  const veil = { material: { set opacity(v) { dim(v / .55); } } };
  // (the sheet faces the camera; its own tilt and spin on a pivot inside, so the camera's turn isn't lost)
  const P = new THREE.Group(); P.quaternion.copy(cam.quaternion); P.add(g);
  // (just past the camera's near plane: nothing in the room is in front of it, and its own folds keep their depth order)
  g.traverse(o => { if (o.isMesh) { o.renderOrder = 52; } });
  W.scene.add(P); W.idsDirty = true;
  const hint = h('div', { class: 'nv3-hint' }, tr(NOTE_TXT.fold)), layer = h('div', { class: 'nv3' }, hint);
  if (!document.getElementById('nv3-css')) { const st = document.createElement('style'); st.id = 'nv3-css'; st.textContent = `.nv3{position:absolute;inset:0;z-index:80;pointer-events:auto}.nv3-hint{position:absolute;left:0;right:0;top:${Math.round(innerHeight * .44 + 175)}px;text-align:center;color:#fff;font:600 17px 'Ssurround',sans-serif;opacity:0;transition:opacity .3s}.nv3.open .nv3-hint{opacity:.95}`; document.head.append(st); }
  document.getElementById('overlay').append(layer);
  let skip = false, tapped = null; const tap = new Promise(r => { tapped = r; });
  layer.addEventListener('pointerdown', e => { e.stopPropagation(); skip = true; tapped(); });
  const run = (ms, fn) => new Promise(r => { const t0 = performance.now(); const f = () => { const k = skip ? 1 : Math.min(1, (performance.now() - t0) / ms); fn(k); W.shadowDirty = true; if (k < 1) requestAnimationFrame(f); else r(); }; f(); });
  const eo = k => 1 - Math.pow(1 - k, 3);
  try {
    if (open) { M.unfold(1); P.position.copy(center); g.scale.setScalar(px); veil.material.opacity = .55; }
    else {
      M.unfold(0);
      await run(260, k => { const e = eo(k); P.position.lerpVectors(from, center, e); g.scale.setScalar(px * (.2 + .8 * e)); g.rotation.z = (1 - e) * -.2; veil.material.opacity = .55 * e; });
      g.rotation.z = 0; G.audio.sfx('flip');
      let s2 = false;
      await run(720, k => { M.unfold(k); if (k > .5 && !s2) { s2 = true; G.audio.sfx('flip', 2); } });
      M.unfold(1); skip = false;
    }
    layer.classList.add('open');
    await tap;
    layer.classList.remove('open'); G.audio.sfx('flip', -2); skip = false;
    await run(200, k => M.unfold(1 - k));
    const r = pill?.getBoundingClientRect(), to = r ? at(r.left + r.width / 2, r.top + r.height / 2, 1.2) : at(W.W / 2, W.H * .1, 1.2);
    await run(300, k => { const e = k * k; P.position.lerpVectors(center, to, e); g.scale.setScalar(px * (1 - .85 * e)); g.rotation.z = .3 * e; veil.material.opacity = .55 * (1 - e); });
  } finally {
    layer.remove(); W.scene.remove(P); dim(0);
    if (M.dispose) M.dispose(); else g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => { m.map?.dispose(); m.dispose(); }); } });
    W.idsDirty = true; W.shadowDirty = true;
    if (pill) { pill.classList.add('pop'); setTimeout(() => pill.classList.remove('pop'), 300); }
  }
}
