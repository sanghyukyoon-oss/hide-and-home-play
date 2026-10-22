// GPT '층 버튼 엘리베이터'를 원본 로비로 (②b 10/22 저녁 — 사용자 비교 시트 "원본 유지 + GPT 장치 이식", 66판). 모델은 GPT 작업장(gpt3-h
// 아트리움) 빌더 그대로 — 정본 엘리베이터에 층 버튼과 층 장면(1층 화분 / 2층 손 흔드는 너굴이 / 3층 물건)을 붙인 것. 색은 ⑥이 다시 칠한 판(FIX_C).
import * as THREE from 'three';
import { calmAll } from './gpt-calm.js';
import { put, grp, mat, mesh, geo, plane, canvasTex, texCache, STYLE } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { BUILDING_BUILDERS } from './building-props.js';
import { Char } from './chars.js';

const PI = Math.PI, HP = PI / 2;
const ORIGINAL_C = {
  cream: '#feebc8', ivory: '#fef2e1', pale: '#f6e0bf', stone: '#e8d7b7',
  brick: '#c89570', earth: '#a77c59', earth2: '#c39b72', teal: '#a2c8bb',
  tealD: '#56dca6', ink: '#6f4b30', brass: '#dba54f', gold: '#f8c74e',
  wood: '#eecfa3', woodD: '#b88c59', coral: '#e58c78', rose: '#edb2a2',
  blue: '#95c9d9', window: '#ffdf91', leaf: '#72a679', leaf2: '#a0c18a',
};
// Builders run synchronously. The fix scope is restored after each selected map
// prop, and its own cache namespace keeps dropped lobby/open-atrium assets intact.
// (⑥ 10/22 다시 칠함: red brick and red wood instead of honey, a clear teal and blue — the atrium was one orange)
const FIX_C = { ...ORIGINAL_C, brick: '#d9654a', earth: '#9a5a35', earth2: '#c47a42', wood: '#d9775a',
  teal: '#22a891', tealD: '#1f8f7c', brass: '#e0a83a', gold: '#ffc21e',
  woodD: '#6f4b30', coral: '#f2554a', rose: '#ff6f8a', blue: '#3a9be6',
  leaf: '#3fae5a', leaf2: '#7cc85a' };
let C = FIX_C, fix1022Active = false;   // (원본 로비 크기 그대로, 색만 ⑥ 판)
calmAll(FIX_C);   // (원본 로비 배색에 맞춰 차분하게 — gpt-calm.js)
const cacheScope = () => fix1022Active ? '-fix1022-v1' : '';
const clamp = t => Math.max(0, Math.min(1, t));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const phase = (t, a, b) => ease((t - a) / (b - a));
const B = {};
const textures = texCache();

const labelFont = px => `700 ${px}px Ssurround, LatinRound, Jua, "Apple SD Gothic Neo", sans-serif`;
function fittedLabelText(c, text, W, H, preferred) {
  const margin = .09, maxW = W * (1 - margin * 2), maxH = H * (1 - margin * 2);
  let layout = null;
  for (let px = Math.floor(Math.min(H * .7, H * .6 * preferred / 38)); px >= 6; px--) {
    c.font = labelFont(px);
    const lines = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (!line || c.measureText(candidate).width <= maxW) line = candidate;
        else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
    }
    const measures = lines.map(line => c.measureText(line));
    const width = Math.max(0, ...measures.map(m => Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0))));
    const ascent = Math.max(px * .8, ...measures.map(m => m.actualBoundingBoxAscent || 0));
    const descent = Math.max(px * .2, ...measures.map(m => m.actualBoundingBoxDescent || 0));
    const lineStep = Math.max(px * 1.12, ascent + descent), height = ascent + descent + Math.max(0, lines.length - 1) * lineStep;
    if (width <= maxW && height <= maxH) { layout = { lines, fontPx: px, width, height, ascent, lineStep, maxW, maxH, margin }; break; }
  }
  // All supplied captions are short; this fallback also keeps an unexpected caption inside its card.
  layout ||= { lines: ['…'], fontPx: 6, width: 6, height: 6, ascent: 4.8, lineStep: 7, maxW, maxH, margin };
  c.font = labelFont(layout.fontPx); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const top = (H - layout.height) / 2;
  layout.lines.forEach((line, i) => c.fillText(line, W / 2, top + layout.ascent + i * layout.lineStep));
  return layout;
}

// Every label is a single front face on a thick little paper card, with a pin and
// lifted corner. Text is measured after the game font arrives; no maxWidth stretching.
function label(text, w, h, { bg = C.ink, fg = (bg === C.tealD || bg === C.teal ? C.ink : C.ivory), size = 38 } = {}) {
  // Font loading may redraw after this builder's palette scope has ended.
  const palette = C;
  const tw = 512, th = Math.max(40, Math.round(tw * h / w));
  const ink = fg === palette.ivory || fg === palette.cream ? palette.ink : fg;
  const tex = textures.get(`gpt-arrival-paper-v2${cacheScope()}:${text}:${bg}:${ink}:${size}:${tw}:${th}`, () => {
    let fit = null;
    const draw = (c, W, H) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#e0af67'; c.fillRect(0, 0, W, H);
      c.fillStyle = palette.ivory; c.fillRect(W * .018, H * .035, W * .964, H * .93);
      c.strokeStyle = bg === palette.cream || bg === palette.ivory ? palette.stone : bg;
      c.lineWidth = Math.max(1, H * .018); c.strokeRect(W * .04, H * .065, W * .92, H * .87);
      c.fillStyle = ink; fit = fittedLabelText(c, text, W, H, size);
    };
    const t = canvasTex(tw, th, draw);
    t.userData.gptTextFit = { text, ...fit, canvas: [tw, th], fits: fit.width <= fit.maxW && fit.height <= fit.maxH };
    if (typeof document !== 'undefined' && document.fonts && !document.fonts.check('700 24px Ssurround')) {
      document.fonts.load('700 24px Ssurround').then(() => {
        draw(t.image.getContext('2d'), tw, th); t.needsUpdate = true;
        t.userData.gptTextFit = { text, ...fit, canvas: [tw, th], fits: fit.width <= fit.maxW && fit.height <= fit.maxH };
      }).catch(() => {});
    }
    return t;
  });
  const card = grp(), cw = Math.min(w * .075, h * .25), ch = h * .16;
  groupMesh(card, `paper-card-${w}-${h}-${bg}`, ({ add }) => {
    box(add, bg === palette.ink ? palette.woodD : bg, w, h, .025, 0, 0, .0125, Math.min(.018, h * .08));
    const corner = new THREE.Shape(); corner.moveTo(0, 0); corner.lineTo(cw, 0); corner.lineTo(cw, -ch); corner.closePath();
    add(G.ext(corner, .008, 0, 2), palette.cream, w / 2 - cw, h / 2 - .006, .035, -.22);
    add(G.sph(Math.min(.018, h * .055), 8, 5), palette.coral, -w * .455, h * .34, .044, 0, 0, 0, [1, 1, .45]);
  });
  card.add(put(plane(w, h, mat('#ffffff', { map: tex })), 0, 0, .03));
  return card;
}
function sign(parent, text, w, h, x, y, z, opts) { const p = label(text, w, h, opts); parent.add(put(p, x, y, z)); return p; }
function attach(f, key, fn) { const o = mc('gpt-arrival-' + key + cacheScope(), fn); f.add(o); return o; }
function groupMesh(parent, key, fn) { const o = mc('gpt-arrival-' + key + cacheScope(), fn); parent.add(o); return o; }
function box(add, color, w, h, d, x, y, z, r = .02, rx = 0, ry = 0, rz = 0) { add(G.box(w, h, d, r), color, x, y, z, rx, ry, rz); }
function wheel(parent, key, radius = .28, color = C.coral) {
  return groupMesh(parent, key, ({ add }) => {
    add(G.tor(radius, .046, PI * 2, 5, 24), color, 0, 0, 0);
    add(G.cyl(.085, .085, .1, 12), C.brass, 0, 0, .01, HP);
    for (let k = 0; k < 6; k++) box(add, color, radius * 1.9, .04, .04, 0, 0, 0, .009, 0, 0, k * PI / 3);
    add(G.cyl(.055, .055, .15, 10), C.woodD, radius, 0, .09, HP);
  });
}
function gear(parent, key, radius, color) {
  return groupMesh(parent, key, ({ add }) => {
    add(G.cyl(radius * .83, radius * .83, .11, 24), color, 0, 0, 0, HP);
    add(G.tor(radius * .53, .045, PI * 2, 5, 20), C.ivory, 0, 0, .065);
    for (let k = 0; k < 12; k++) {
      const a = k * PI / 6;
      box(add, color, .14, .2, .12, Math.cos(a) * radius * .91, Math.sin(a) * radius * .91, 0, .025, 0, 0, a - HP);
    }
    add(G.cyl(.1, .1, .15, 12), C.brass, 0, 0, .02, HP);
  });
}
function plant(add, x, y, z, s = 1, pot = C.tealD) {
  add(G.cyl(.19 * s, .14 * s, .32 * s, 12), pot, x, y + .16 * s, z);
  add(G.cyl(.17 * s, .17 * s, .025 * s, 12), C.earth, x, y + .315 * s, z);
  for (let i = 0; i < 6; i++) {
    const a = i * 2.399, r = .13 * s;
    add(G.sph(.16 * s, 8, 6), i % 2 ? C.leaf : C.leaf2,
      x + Math.cos(a) * r, y + (.53 + i % 3 * .1) * s, z + Math.sin(a) * r, 0, a, .3, [.7, 1.5, .8]);
  }
}
function books(add, x, y, z, n = 5, s = 1) {
  for (let i = 0; i < n; i++) {
    const h = (.3 + i % 3 * .055) * s;
    box(add, [C.tealD, C.coral, C.gold, C.blue][i % 4], .085 * s, h, .22 * s, x + i * .1 * s, y + h / 2, z, .008);
    box(add, C.ivory, .065 * s, .018 * s, .012, x + i * .1 * s, y + h * .76, z + .118 * s, .003);
  }
}
function envelope(add, x, y, z, color = C.ivory, s = 1, rz = 0) {
  box(add, color, .3 * s, .22 * s, .025, x, y, z, .015, 0, 0, rz);
  // The V seam makes the shape read as mail from the default camera.
  box(add, C.stone, .19 * s, .012, .01, x - .057 * s, y + .02 * s, z + .018, .003, 0, 0, -.55 + rz);
  box(add, C.stone, .19 * s, .012, .01, x + .057 * s, y + .02 * s, z + .019, .003, 0, 0, .55 + rz);
}
function archGeometry(w, spring, rise, band = .15, depth = .2) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 - band, 0); s.lineTo(-w / 2 - band, spring);
  for (let i = 0; i <= 18; i++) { const a = PI - i / 18 * PI; s.lineTo(Math.cos(a) * (w / 2 + band), spring + Math.sin(a) * (rise + band)); }
  s.lineTo(w / 2 + band, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, spring);
  for (let i = 0; i <= 18; i++) { const a = i / 18 * PI; s.lineTo(Math.cos(a) * w / 2, spring + Math.sin(a) * rise); }
  s.lineTo(-w / 2, 0); s.closePath();
  return G.ext(s, depth, .016, 10);
}
function archWindow(add, x, y, z, w = 1.25, h = 1.6) {
  const spring = h - w / 2;
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, spring);
  for (let i = 0; i <= 16; i++) { const a = PI - i / 16 * PI; s.lineTo(Math.cos(a) * w / 2, spring + Math.sin(a) * w / 2); }
  s.lineTo(w / 2, 0); s.closePath();
  add(G.ext(s, .04, 0, 8), C.window, x, y, z);
  add(archGeometry(w, spring, w / 2, .1, .075), C.ivory, x, y, z + .047);
  box(add, C.woodD, .045, h - .14, .06, x, y + (h - .14) / 2, z + .1, .008);
  box(add, C.woodD, w - .02, .045, .06, x, y + spring * .56, z + .1, .008);
  box(add, C.ivory, w + .28, .12, .28, x, y - .04, z + .08, .025);
}
function stonePlinth(add, w, d) {
  // The top is below the Room's floor plane (.001), so there is one visible top face.
  box(add, C.earth, w + .42, .37, d + .42, 0, -.64, 0, .09);
  box(add, C.earth2, w + .45, .11, d + .45, 0, -.425, 0, .035);
  box(add, C.brick, w + .5, .24, d + .5, 0, -.25, 0, .045);
  box(add, C.ivory, w + .58, .12, d + .58, 0, -.072, 0, .04);
  // Mortar lines on the front/right exposed brick band, with alternating courses.
  for (const yy of [-.31, -.2]) {
    box(add, '#e0af67', w + .43, .015, .012, 0, yy, (d + .5) / 2 + .006, .003);
    box(add, '#e0af67', .012, .015, d + .43, (w + .5) / 2 + .006, yy, 0, .003);
  }
  for (let x = -w / 2; x < w / 2; x += .52) {
    box(add, '#e0af67', .014, .1, .013, x, -.255, (d + .5) / 2 + .008, .003);
    box(add, '#e0af67', .014, .09, .013, x + .26, -.155, (d + .5) / 2 + .008, .003);
  }
  for (let z = -d / 2; z < d / 2; z += .52) box(add, '#e0af67', .013, .1, .014, (w + .5) / 2 + .008, -.255, z, .003);
  for (let i = 0; i < 15; i++) {
    const x = -w / 2 + .25 + i * (w - .5) / 14;
    box(add, i % 3 ? C.earth2 : '#e0a667', .18 + i % 2 * .1, .028, .015, x, -.58 - i % 3 * .045, (d + .42) / 2 + .008, .009);
  }
}
function scenery(f) { f.gptScenery = true; f.collideBox = [0, -2, 0, 0, -2, 0]; }
// Cameos keep the game's exact character geometry. Uniform scale only: the large
// raccoon tail otherwise exceeds this miniature lift's depth. No new animal mesh.
function existingFriend(f, kind, parent, x, y, z, height = .54) {
  const ch = new Char(kind); ch.setFace('happy'); ch.root.remove(ch.shadow);
  if (kind === 'raccoon') ch.tail.rotation.x = .65; // existing fluffy tail folds forward inside the car
  // A rigid cameo has one expression. Remove the hidden alternatives before the
  // furniture bake, whose static merger intentionally does not inspect visibility.
  const hidden = []; ch.root.traverse(o => { if (!o.visible) hidden.push(o); });
  hidden.forEach(o => o.parent?.remove(o));
  ch.root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(ch.root, true), raw = b.getSize(new THREE.Vector3());
  const scale = height / raw.y; ch.root.scale.setScalar(scale);
  put(ch.root, x, y - b.min.y * scale, z); parent.add(ch.root);
  ch.root.userData.gptCanonicalCharacter = { source: 'src/gfx/chars.js', kind, rawSize: raw.toArray(), scale, height };
  (f.gptCharacters ||= []).push(ch.root);
  (f.live ||= []).push(ch.root); // preserve the canonical root and its scale evidence through bakeStatic
  return ch;
}

B.gpt_floor_elevator = (f, T, { primary = true, architectureYScale = 2.05 / 1.8 } = {}) => {
  BUILDING_BUILDERS.elevator(f, T);
  if (fix1022Active) {
    // Preserve the source car's actual pockets and sliding doors. Stretch only
    // its architecture; the roof supplies a larger factor before its uniform .76
    // model scale. Added panorama figures, item anchors and paper stay rigid.
    const lift = grp(), children = f.group.children.slice();
    children.forEach(o => lift.add(o)); lift.scale.y = architectureYScale; f.add(lift);
    // Device planning clones elevator floor spots by parent+position, so keep
    // their parent unscaled. Moving the original anchor out of the architecture
    // also gives those later clones the same rigid item transform.
    for (const s of f.spots) {
      s.anchor.position.y *= lift.scale.y;
      f.group.add(s.anchor);
    }
    const swaps = [
      ['#dde2ea', C.pale], ['#678ae0', '#d5bb34'], ['#e0b267', C.stone],
      ['#d3dae6', C.pale], ['#6793e0', C.teal], ['#e6f3fa', '#d4e2e5'],
      ['#5d6478', C.ink], ['#3b3550', C.ink], ['#2b57d4', C.ink], ['#ffffff', C.ivory],
    ].map(([a, b]) => [new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(a) : a),
      new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(b) : b)]);
    const remove = [];
    lift.traverse(o => {
      if (!o.isMesh) return;
      const name = o.geometry.name;
      if (name === 'elev-prints' || name === 'elev-disp' || name === 'elev-hand') { remove.push(o); return; }
      if (name === 'elev-door-1' || name === 'elev-door1') o.material = mat(C.teal);
      const old = o.geometry.attributes.color;
      if (!old) return;
      o.geometry = geo('gpt-arrival-fix1022-color-' + o.geometry.uuid, () => {
        const g = o.geometry.clone(), col = g.attributes.color;
        for (let i = 0; i < col.count; i++) for (const [a, b] of swaps) {
          if (Math.abs(col.getX(i) - a.r) + Math.abs(col.getY(i) - a.g) + Math.abs(col.getZ(i) - a.b) < .00002) {
            col.setXYZ(i, b.r, b.g, b.b); break;
          }
        }
        col.needsUpdate = true; return g;
      });
    });
    remove.forEach(o => o.parent.remove(o));
    // Replace inherited tiny mixed-language atlas text with fitted game-font cards.
    sign(f.group, '층 안내\n1 · 2 · 3', .26, .406, -.7, 1.3 * architectureYScale, .623, { bg: C.cream, size: 38 });
    sign(f.group, '1 · 2 · 3', .42, .131, 0, 2.05 * architectureYScale, .623, { bg: C.tealD, size: 40 });
    const caution = sign(f.parts[0].pivots[1], '손 조심', .16, .085, -.165, -.12, .04, { bg: C.cream, size: 38 });
    // The caution moves with its door, but its letters keep their original aspect.
    caution.scale.y = 1 / architectureYScale; caution.userData.gptPaper = true;
    const capacity = label('친구 셋', .14, .05, { bg: C.cream, size: 36 });
    f.add(put(capacity, .405, .98 * architectureYScale, .41, 0, -HP));
    f.gptFix1022 = { doorOpening: 1.8 * architectureYScale, architectureYScale, inheritedDoorOpening: 1.8, miniatureRaccoonHeight: .50 };
  }
  const doorPart = f.parts[0];
  const call = grp(); put(call, .73, fix1022Active ? 1.17 : 1.03, .64); f.add(call);
  groupMesh(call, 'elevator-call', ({ add }) => {
    box(add, C.ink, .29, .42, .08, 0, 0, 0, .04);
    add(G.cyl(.085, .085, .035, 16), C.gold, 0, .06, .062, HP);
    add(G.cone(.055, .08, 3), C.ivory, 0, .06, .087, 0, 0, 0, [1, 1, .2]);
    box(add, C.teal, .13, .035, .025, 0, -.105, .05, .008);
    box(add, C.woodD, .18, .07, .018, 0, -.165, .053, .015);
    box(add, C.ink, .12, .035, .022, 0, -.165, .067, .006);
  });
  // Three miniature floor panoramas stand inside the car, behind its opening.
  // A repeated button press may advance the index with gptBeforeRun().
  const scenes = [];
  for (let i = 0; i < 3; i++) {
    const scene = grp(); put(scene, 0, 1.16, .066); f.add(scene); scenes.push(scene);
    groupMesh(scene, 'elevator-scene-' + i, ({ add }) => {
      box(add, [C.cream, C.blue, C.rose][i], .78, .62, .035, 0, 0, i === 1 ? -.055 : 0, .02);
      box(add, C.wood, .78, .06, i === 1 ? .5 : .16, 0, -.28, i === 1 ? .23 : .05, .015);
      if (i === 0) { plant(add, 0, -.28, .07, .62, C.coral); }
      if (i === 2) {
        box(add, C.teal, .48, .2, .14, 0, -.15, .06, .03);
        add(G.tor(.13, .035, PI * 2, 5, 16), C.gold, 0, .09, .08);
        box(add, C.gold, .06, .25, .04, 0, -.12, .1, .012);
      }
    });
    scene.visible = i === 0;
  }
  const raccoon = existingFriend(f, 'raccoon', scenes[1], 0, -.249, .26, .5);
  const wave = raccoon.arms[1];
  wave.position.set(.48, .5, .1);
  let floorIndex = -1;
  const floorPart = f.part('button', [call, ...scenes, wave], t => {
    call.position.z = .64 - .045 * Math.sin(PI * phase(t, 0, .2));
    for (let i = 0; i < scenes.length; i++) scenes[i].visible = i === Math.max(0, floorIndex) && (i !== 1 || t > .8);
    wave.position.set(.48, .5 + .06 * Math.sin(t * PI * 7), .1);
    wave.rotation.z = .45 * Math.sin(t * PI * 7) * phase(t, .5, .7);
    doorPart.setOpen(phase(t, .53, 1));
  }, { label: '층 버튼 · 다른 풍경이 짠!', sfx: 'stationChime', dur: 2.8 });
  floorPart.gptBeforeRun = () => { floorIndex = (floorIndex + 1) % scenes.length; };
  floorPart.gptRepeat = true;
  floorPart.gptRewardReady = () => floorIndex === 2;
  floorPart.gptFloorIndex = () => floorIndex;
  floorPart.gptRecipe = 'elevator';
  floorPart.gptStageRoles = { 61: 'main', 66: 'support', 69: 'main', 70: 'motif' };
  floorPart.gptChain = {
    stages: [{ at: 0, sfx: 'stationChime' }, { at: .27, sfx: 'ratchet' }, { at: .53, sfx: 'door_metal' }, { at: .96, sfx: 'pop' }],
    reaction: '너굴아, 엘리베이터에서 뭐 해?', role: primary ? 'main' : 'support', clue: '1층 화분 / 2층 손 흔드는 너굴이 / 3층 열쇠',
  };
  floorPart.gptPickRadius = .34;
  floorPart.gptHandle = call;
  f.floorPart = floorPart; f.doorPart = doorPart;
  // Build must start shut. fitParts may sample the button, so it restores this too.
  floorPart.setOpen(0); doorPart.setOpen(0);
  for (const s of f.spots) { s.part = floorPart; floorPart.spots.push(s); }
  doorPart.spots = [];
  for (const s of f.spots) {
    s.maxH = .58;
    s.anchor.position.set(0, s.anchor.position.y, .30);
    s.gptReadableScale = { key: 2.2 };
  }
};

export const GPT_LOBBY_DEVICE_BUILDERS = B;
export const GPT_LOBBY_DEVICE_INFO = { gpt_floor_elevator: { wall: true, span: 2, name: '층 버튼 엘리베이터', hidden: true } };
