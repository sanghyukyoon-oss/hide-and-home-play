// Foldable notes: a rectangular sheet cut ONLY at creases, never a swapped closed/open model.
// Local paper coordinates: XY, front +Z, .9 × 1.2. group starts lying on XZ.
// Call useCartoonStyle() before construction, then ToonPost.assignIds(scene) as for other props.
// face is the ENTIRE inner sheet, including every moving flap, with one continuous 0..1 UV.
// Set face.material.map to your CanvasTexture; do not replace the material. Canvas top is +Y.
import * as THREE from 'three';
import { mat, canvasTex, forgetMats, SHADOW } from './kit.js';

const W = .9, H = 1.2, THICK = .009, MARGIN = .08, EPS = 1e-7;
const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// Fold definitions are in the XY positions reached AFTER earlier folds close.
// start/end describe the reverse (opening) schedule. Positive side = cross(axis, point).
const F = (x, y, dx, dy, side, start, end) => ({ x, y, dx, dy, side, start, end });
const DESIGNS = {
  gpt_note_letter: {
    name: '하트 편지', description: '줄종이 · 모서리를 접어 만든 봉투형 편지', paper: '#fef2e1', line: '#c9c6b2', accent: '#d77e75', pattern: 'lines',
    // T-shaped letter in the middle pose: open the triangular collar, lower leaf, then corner tucks.
    folds: [F(-.45, .18, .45, .42, 1, .76, 1), F(.45, .18, -.45, .42, -1, .76, 1), F(0, -.2, 1, 0, -1, .35, .72), F(0, .2, 1, 0, 1, .03, .34)],
  },
  gpt_note_triangle: {
    name: '삼각 비밀쪽지', description: '연한 모눈 · 세 번 접은 학교 쪽지', paper: '#f2f1dc', line: '#b4c6b9', accent: '#84ae9d', pattern: 'grid',
    // Tuck a .3 strip to make a .9 square, fold diagonally, bisect its right-angle corner.
    folds: [F(0, -.3, 1, 0, -1, .69, 1), F(-.45, -.3, 1, 1, 1, .35, .68), F(0, .15, 1, -1, 1, .02, .34)],
  },
  gpt_note_memo: {
    name: '테이프 메모', description: '버터색 메모 · 두 겹 접기와 민트 테이프', paper: '#fff0bf', line: '#d4c8a3', accent: '#84ae9d', pattern: 'lines', tape: true,
    folds: [F(0, 0, 1, 0, -1, .65, 1), F(0, 0, 0, 1, -1, .31, .64), F(.12, .44, 1, -.55, 1, .02, .30)],
  },
  gpt_note_card: {
    name: '스티커 카드', description: '살구색 카드 · 작은 하트 봉인', paper: '#fae0c7', line: '#e3bca5', accent: '#ee9d4c', pattern: 'plain', seal: true,
    folds: [F(0, 0, 1, 0, -1, .66, 1), F(0, .3, 0, 1, 1, .31, .65), F(.30, .60, 1, -1, 1, .02, .30)],
  },
};

export const GPT_NOTE_INFO = Object.freeze(Object.fromEntries(Object.entries(DESIGNS).map(([key, d]) => [key, Object.freeze({
  key, name: d.name, description: d.description, width: W, height: H, aspect: W / H, safeMargin: MARGIN,
  stages: ['봉인 / 첫 날개', '큰 날개', '마지막 접기'],
})])));

function sideOf(p, f) { return ((p.x - f.x) * -f.dy + (p.y - f.y) * f.dx) * f.side; }
function area(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p.ox * q.oy - q.ox * p.oy; } return Math.abs(a) / 2; }
function clip(poly, f, positive) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], da = sideOf(a, f), db = sideOf(b, f);
    if (positive ? da >= -EPS : da <= EPS) out.push({ ...a });
    if ((da > EPS && db < -EPS) || (da < -EPS && db > EPS)) {
      const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t });
    }
  }
  return out.filter((p, i) => !i || Math.hypot(p.ox - out[i - 1].ox, p.oy - out[i - 1].oy) > EPS);
}
function partition(folds) {
  let pieces = [{ points: [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(([x, y]) => ({ x, y, ox: x, oy: y })), moves: [] }];
  for (const f of folds) {
    const len = Math.hypot(f.dx, f.dy); f.dx /= len; f.dy /= len;
    const next = [];
    for (const p of pieces) for (const moving of [false, true]) {
      const pts = clip(p.points, f, moving);
      if (pts.length < 3 || area(pts) < EPS) continue;
      if (moving) for (const v of pts) { const d = (v.x - f.x) * -f.dy + (v.y - f.y) * f.dx; v.x += 2 * d * f.dy; v.y -= 2 * d * f.dx; }
      next.push({ points: pts, moves: [...p.moves, moving] });
    }
    pieces = next;
  }
  return pieces;
}

function paperTexture(d, inner) {
  return canvasTex(384, 512, (c, w, h) => {
    c.fillStyle = inner ? '#fef9e9' : d.paper; c.fillRect(0, 0, w, h);
    // Fixed, very quiet fibre: no randomness / canvas creation in unfold().
    c.fillStyle = 'rgba(139,112,76,.045)';
    for (let i = 0; i < 170; i++) { const x = (i * 137) % w, y = (i * 83) % h; c.fillRect(x, y, 1, i % 3 + 1); }
    if (inner) return; // deliberately no password, clue, text, or permanent margin marks
    c.strokeStyle = d.line; c.lineWidth = 1.4; c.globalAlpha = .64;
    if (d.pattern !== 'plain') for (let y = 26; y < h; y += 27) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    if (d.pattern === 'grid') for (let x = 6; x < w; x += 27) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    c.globalAlpha = 1;
    // Small outside-only doodles, large enough to survive the icon view.
    c.strokeStyle = d.accent; c.fillStyle = d.accent; c.lineWidth = 4; c.lineCap = 'round';
    const heart = (x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-26, -10, -12, -27, 0, -14); c.bezierCurveTo(12, -27, 26, -10, 0, 6); c.stroke(); c.restore(); };
    if (d.pattern === 'grid') {
      c.beginPath(); c.moveTo(285, 300); c.lineTo(304, 282); c.lineTo(323, 300); c.lineTo(304, 320); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(304, 270); c.lineTo(304, 260); c.moveTo(337, 300); c.lineTo(347, 300); c.stroke();
    } else { heart(156, 103, .9); heart(222, 120, .6); heart(130, 352, .6); }
    // (③ 10/22: the game's own round font, not a thin Latin serif — the house look; Korean words)
    c.font = "24px Ssurround, 'Apple SD Gothic Neo', sans-serif"; c.textAlign = 'center';
    const label = d.tape ? '기억해!' : d.seal ? '비밀 쪽지' : '너에게';
    // Explicit 10% safe text margin, even on the outside label.
    const max = w * .8; let size = 24; while (c.measureText(label).width > max && size > 10) c.font = `${--size}px Ssurround, sans-serif`;
    c.fillText(label, w / 2, 163);
  });
}

function geometry(positions, uv = null) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}

/** Build one independently disposable note. Does not register or replace existing game items. */
export function createNote(key = 'gpt_note_letter', options = {}) {
  const design = DESIGNS[key]; if (!design) throw new RangeError(`Unknown GPT note: ${key}`);
  const folds = design.folds.map(f => ({ ...f }));
  const ownedG = new Set(), ownedM = new Set(), ownedT = new Set();
  const ownG = g => { ownedG.add(g); return g; };
  const ownM = m => { const clone = m.clone(); ownedM.add(clone); return clone; };
  const outerTex = paperTexture(design, false), innerTex = paperTexture(design, true); ownedT.add(outerTex); ownedT.add(innerTex);
  const innerMat = ownM(mat('#ffffff', { map: innerTex, rim: 0 }));
  const backMat = ownM(mat('#ffffff', { map: outerTex, rim: 0 }));
  const edgeMat = ownM(mat('#e4cfaa', { rim: 0 }));
  const group = new THREE.Group(); group.name = key; group.rotation.x = -Math.PI / 2; group.position.y = .006;
  const tag = { key, width: W, height: H, aspect: W / H, safeMargin: MARGIN, thickness: THICK };
  group.userData.gptNote = tag;
  // One continuous content-face ID; real overlapping flap backs use moving-part IDs below.
  const item = { type: key }; group.userData.item = item;
  const allFront = [], allUV = [], panels = [];
  for (const [index, piece] of partition(folds).entries()) {
    const points = piece.points.map(p => new THREE.Vector2(p.ox, p.oy));
    const center = points.reduce((v, p) => v.add(p), new THREE.Vector2()).multiplyScalar(1 / points.length);
    const front = [], uv = [], back = [], backUV = [], edges = [], weights = [];
    const push = (a, z, out, tex) => { out.push(a.x, a.y, z); if (tex) tex.push(a.x / W + .5, a.y / H + .5); };
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      for (const [p, w] of [[center, 1], [a, 0], [b, 0]]) { push(p, THICK / 2, front, uv); weights.push(w); }
      for (const p of [center, b, a]) {
        push(p, -THICK / 2, back, null);
        // Reading side of the paper's back. After a fold its writing rotates, but never mirrors.
        backUV.push(.5 - p.x / W, p.y / H + .5);
      }
      // Creases are connected paper, not cut edges. Only cap the original sheet perimeter;
      // capping both sides of an internal crease would leave coplanar faces at t=1.
      const outerEdge = (Math.abs(Math.abs(a.x) - W / 2) < EPS && Math.abs(a.x - b.x) < EPS) ||
        (Math.abs(Math.abs(a.y) - H / 2) < EPS && Math.abs(a.y - b.y) < EPS);
      if (outerEdge) edges.push(a.x, a.y, -THICK / 2, b.x, b.y, -THICK / 2, b.x, b.y, THICK / 2, a.x, a.y, -THICK / 2, b.x, b.y, THICK / 2, a.x, a.y, THICK / 2);
    }
    const shell = new THREE.Group(); shell.name = `${key}_flap_${index}`; shell.matrixAutoUpdate = false;
    // The envelope's closing flap needs a real overlap contour to read as a letter.
    // Other packets keep one silhouette ID: outlining every thin stacked layer makes a black band.
    // The continuous inner face always stays ONE ID, so open sheets have no artificial crease ink.
    if (key === 'gpt_note_letter' && piece.moves[folds.length - 1]) shell.userData.og = shell;
    const bg = ownG(geometry(back, backUV));
    shell.add(new THREE.Mesh(bg, backMat));
    if (edges.length) shell.add(new THREE.Mesh(ownG(geometry(edges)), edgeMat));
    group.add(shell);
    const panel = { group: shell, vertices: points, folds: piece.moves, center, front: new Float32Array(front), weights, offset: allFront.length / 3, backBase: new Float32Array(back), backGeometry: bg, matrix: new THREE.Matrix4() };
    allFront.push(...front); allUV.push(...uv); panels.push(panel);
  }
  const fg = ownG(geometry(allFront, allUV)); fg.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const face = new THREE.Mesh(fg, innerMat); face.name = `${key}_inner_sheet`; face.frustumCulled = false;
  face.userData = { ...tag, safeRect: { u0: MARGIN, v0: MARGIN, u1: 1 - MARGIN, v1: 1 - MARGIN }, canvasSize: [576, 768] };
  group.add(face);
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const matrices = folds.map(() => new THREE.Matrix4()), angles = folds.map(() => 0);
  const axis = new THREE.Vector3(), moveA = new THREE.Matrix4(), moveB = new THREE.Matrix4(), rot = new THREE.Matrix4(), pos = new THREE.Vector3();
  // Place each hinge above the ACTUAL previous stack, including its front/back thickness.
  // Corner tucks occupy fewer layers than full half-folds; assuming a power-of-two layer
  // count either intersects them or makes the letter needlessly thick.
  for (let i = 0; i < folds.length; i++) {
    let movingTop = -Infinity, fixedTop = -Infinity;
    for (const p of panels) {
      const m = p.matrix.identity();
      for (let j = 0; j < i; j++) if (p.folds[j]) m.premultiply(matrices[j]);
      for (const z of [-THICK / 2, THICK / 2]) {
        pos.set(p.center.x, p.center.y, z).applyMatrix4(m);
        if (p.folds[i]) movingTop = Math.max(movingTop, pos.z); else fixedTop = Math.max(fixedTop, pos.z);
      }
    }
    const f = folds[i]; f.axisZ = (movingTop + fixedTop + THICK * .12) / 2;
    axis.set(f.dx, f.dy, 0); rot.makeRotationAxis(axis, Math.PI * f.side);
    moveA.makeTranslation(f.x, f.y, f.axisZ); moveB.makeTranslation(-f.x, -f.y, -f.axisZ);
    matrices[i].copy(moveA).multiply(rot).multiply(moveB);
  }
  let last = NaN, disposed = false;
  function unfold(value) {
    if (disposed) return api;
    const t = Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : 0;
    if (t === last) return api; last = t; SHADOW.moved = true;
    for (let i = 0; i < folds.length; i++) {
      const f = folds[i], a = 1 - ease((t - f.start) / (f.end - f.start)); angles[i] = a;
      // Each folded layer has real thickness. The hinge sits halfway above the previous stack.
      const z = f.axisZ;
      axis.set(f.dx, f.dy, 0); rot.makeRotationAxis(axis, Math.PI * f.side * a);
      moveA.makeTranslation(f.x, f.y, z); moveB.makeTranslation(-f.x, -f.y, -z);
      matrices[i].copy(moveA).multiply(rot).multiply(moveB);
    }
    const dst = fg.attributes.position.array;
    for (const panel of panels) {
      const m = panel.matrix.identity(); let bend = 0;
      for (let i = 0; i < folds.length; i++) if (panel.folds[i]) { m.premultiply(matrices[i]); bend = Math.max(bend, Math.sin(angles[i] * Math.PI) * .0003); }
      panel.group.matrix.copy(m); panel.group.matrixWorldNeedsUpdate = true;
      const back = panel.backGeometry.attributes.position.array;
      for (let j = 0; j < panel.front.length / 3; j++) {
        const k = j * 3, bulge = panel.weights[j] * bend;
        pos.set(panel.front[k], panel.front[k + 1], panel.front[k + 2] + bulge).applyMatrix4(m);
        const at = panel.offset * 3 + k; dst[at] = pos.x; dst[at + 1] = pos.y; dst[at + 2] = pos.z;
        // Back uses the same triangle fan, opposite winding; only each fan's centre bends.
        back[k + 2] = panel.backBase[k + 2] + (j % 3 === 0 ? bend : 0);
      }
      panel.backGeometry.attributes.position.needsUpdate = true; panel.backGeometry.computeVertexNormals();
    }
    fg.attributes.position.needsUpdate = true; fg.computeVertexNormals(); fg.computeBoundingSphere();
    group.userData.gptNote.t = t;
    return api;
  }
  // Outside tape / seal is attached to the outermost flap, never floats at a fixed world position.
  // It returns to the back of the sheet when fully open and cannot cover the clue surface.
  function decoration() {
    if (!design.tape && !design.seal) return;
    let target = null, highest = -Infinity;
    // A tiny folded ear can be the highest piece. It cannot support a whole tape strip or seal.
    // Require the complete decoration footprint + clearance to fit its actual paper polygon.
    const hx = design.tape ? .15 : .086, hy = design.tape ? .075 : .086;
    const fits = p => [[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]].every(([dx,dy]) => {
      const x = p.center.x + dx, y = p.center.y + dy;
      return p.vertices.every((a,i) => { const b=p.vertices[(i+1)%p.vertices.length]; return (b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x) >= -EPS; });
    });
    for (const p of panels) { pos.set(p.center.x, p.center.y, 0).applyMatrix4(p.matrix); const n = new THREE.Vector3(0, 0, -1).transformDirection(p.matrix); if (n.z > .5 && pos.z > highest && fits(p)) { highest = pos.z; target = p; } }
    if (!target) return;
    const dec = new THREE.Group(); dec.name=`${key}_outside_${design.tape?'tape':'seal'}`;
    dec.position.set(target.center.x, target.center.y, -THICK / 2 - (design.tape ? .0003 : .004)); dec.rotation.x = Math.PI;
    if (design.tape) {
      // Solid waxed tape with a serrated torn edge; same toon pipeline as the paper.
      const s = new THREE.Shape(); const pts = [[-.13,-.046],[.12,-.046],[.113,-.025],[.13,-.008],[.113,.009],[.13,.027],[.12,.046],[-.13,.046],[-.12,.025],[-.137,.007],[-.12,-.01],[-.137,-.028]];
      pts.forEach(([x,y],i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath();
      const g = ownG(new THREE.ExtrudeGeometry(s, { depth: .004, bevelEnabled: false }));
      dec.add(new THREE.Mesh(g, ownM(mat(design.accent, { rim: 0 })))); dec.rotation.z = -.12;
    } else {
      const g = ownG(new THREE.CylinderGeometry(.075, .075, .008, 16)); g.rotateX(Math.PI / 2);
      const seal = new THREE.Mesh(g, ownM(mat(design.accent, { rim: 0 }))); dec.add(seal);
      const tex = canvasTex(64, 64, c => { c.clearRect(0,0,64,64); c.fillStyle='#fff3de'; c.beginPath(); c.moveTo(32,48); c.bezierCurveTo(1,29,17,9,32,23); c.bezierCurveTo(47,9,63,29,32,48); c.fill(); }); ownedT.add(tex);
      const hm = new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false }); ownedM.add(hm);
      const heart = new THREE.Mesh(ownG(new THREE.PlaneGeometry(.1,.1)), hm); heart.position.z=.005; heart.layers.set(2); dec.add(heart);
    }
    target.group.add(dec);
  }
  function setContentCanvas(canvas) {
    if (disposed) throw new Error('Note has been disposed');
    // Caller keeps ownership of supplied canvases. We own only textures made through this helper.
    if (!canvas || !canvas.width || !canvas.height) throw new TypeError('Expected a nonempty HTMLCanvasElement');
    if (api.contentTexture) { api.contentTexture.dispose(); ownedT.delete(api.contentTexture); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
    ownedT.add(texture); api.contentTexture = texture; face.material.map = texture; face.material.needsUpdate = true;
    return texture;
  }
  function dispose() {
    if (disposed) return; disposed = true;
    // mat() caches texture-keyed source materials before we clone them. Drop those references too.
    forgetMats(ownedT);
    for (const g of ownedG) g.dispose(); for (const m of ownedM) m.dispose(); for (const tx of ownedT) tx.dispose();
    group.removeFromParent();
  }
  const api = { key, group, face, panels, info: GPT_NOTE_INFO[key], unfold, setContentCanvas, dispose };
  unfold(0); decoration(); if (options.unfold != null) unfold(options.unfold);
  if (options.canvas) setContentCanvas(options.canvas);
  return api;
}

// Named factory keys for easy integration without modifying the existing ITEMS/buildItem registry.
export const gpt_note_letter = options => createNote('gpt_note_letter', options);
export const gpt_note_triangle = options => createNote('gpt_note_triangle', options);
export const gpt_note_memo = options => createNote('gpt_note_memo', options);
export const gpt_note_card = options => createNote('gpt_note_card', options);

// (③ 10/22, user: "삼각은 좀 이상하고 3가지 다양하게 써 주면 좋겠음"): the three used in the game, one picked by the note's code
// so the same note is the same paper in the room and when it opens
export const NOTE_KEYS = ['gpt_note_letter', 'gpt_note_memo', 'gpt_note_card'];
export const noteKeyFor = code => NOTE_KEYS[[...String(code || '0')].reduce((a, d) => a + (d.charCodeAt(0) || 0), 0) % NOTE_KEYS.length];
