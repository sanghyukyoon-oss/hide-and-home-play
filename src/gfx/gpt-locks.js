// Shared toy lock hardware. +z is the visible face; origin/footprint match Furn.setLock.
// New builder only: legacy setLock(), taps, socket recolouring and keyOpen() keep their APIs.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, mesh, mat, put, grp, canvasTex, texCache, SHADOW, STYLE } from './kit.js';

const PI = Math.PI, HP = PI / 2;
const C = { brass: '#eaa440', edge: '#c67f2a', cream: '#fef2e1', light: '#feebc8', brown: '#6f4b30', coral: '#eb9475', sage: '#84ae9d' };
const prints = texCache();
const clamp = t => Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
// Segment 1 bevels are deliberately used here: even the four-wheel lock stays below 3k vertices.
function box(w, h, d, color, r = .008) {
  r = Math.min(r, Math.min(w, h, d) * .45);
  return mesh(geo(`gptlock:box:${w}:${h}:${d}:${r}`, () => new RoundedBoxGeometry(w, h, d, 1, r)), mat(color));
}
function block(w, h, d, color) {
  return mesh(geo(`gptlock:block:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)), mat(color));
}
function cylinder(r, h, color, seg = 10) {
  return mesh(geo(`gptlock:cyl:${r}:${h}:${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg)), mat(color));
}
function ring(r, t, color, sx = 1, sy = 1) {
  const m = mesh(geo(`gptlock:ring:${r}:${t}`, () => new THREE.TorusGeometry(r, t, 5, 16)), mat(color));
  m.scale.set(sx, sy, 1); return m;
}
function tube(key, points, r, color, closed = false, segments = 20) {
  return mesh(geo(`gptlock:tube:${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'centripetal'), segments, r, 6, closed)), mat(color));
}
function shapeMesh(key, shape, depth, color) {
  return mesh(geo(`gptlock:shape:${key}`, () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 3 })), mat(color));
}
function keyhole() {
  // One continuous classic keyhole; no crossed discs or coplanar decals.
  const s = new THREE.Shape();
  s.moveTo(-.006, -.013); s.lineTo(-.0035, -.002);
  s.absarc(0, .005, .008, Math.PI * 1.35, Math.PI * 3.65, true);
  s.lineTo(.006, -.013); s.closePath();
  return shapeMesh('keyhole', s, .002, C.brown);
}
function star() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = HP + i * PI / 5, r = i % 2 ? .015 : .031; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  s.closePath(); return shapeMesh('star', s, .012, C.brass);
}
function rivet(x, y, z, parent, color = C.edge) {
  const m = cylinder(.005, .003, color, 8); put(m, x, y, z, HP); parent.add(m);
}
function motion(g, apply) {
  g.userData.open = t => { const v = clamp(t); if (v !== g.userData.openT) SHADOW.moved = true; g.userData.openT = v; apply(v); };
  g.userData.open(0);
}

const fixedMaterials = new Map();
function batchFixed(g) {
  // Keep every articulated piece and recolourable socket intact. Only the direct,
  // rigid shell meshes merge; this cuts mobile colour/shadow/ID draw calls.
  if (STYLE.mode === 'std') return;
  const fixed = g.children.filter(o => o.isMesh && !o.userData.og && !o.userData.noMerge && !g.userData.sockets?.includes(o));
  const geometry = geo(`gptlock:fixed:${g.name}:${STYLE.mode}`, () => {
    const pieces = fixed.map(o => {
      o.updateMatrix(); const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); src.applyMatrix4(o.matrix);
      for (const key of Object.keys(src.attributes)) if (key !== 'position' && key !== 'normal') src.deleteAttribute(key);
      if (o.matrix.determinant() < 0) {
        // A baked reflection needs the winding correction that Object3D's negative
        // scale otherwise gives the renderer (the lower dial visor is mirrored).
        for (const attribute of Object.values(src.attributes)) {
          const a = attribute.array, stride = attribute.itemSize;
          for (let i = 0; i < attribute.count; i += 3) for (let k = 0; k < stride; k++) {
            const j = (i + 1) * stride + k, q = (i + 2) * stride + k, value = a[j]; a[j] = a[q]; a[q] = value;
          }
        }
      }
      const count = src.attributes.position.count, colors = new Float32Array(count * 3), c = o.material.color;
      for (let i = 0; i < count; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
      src.setAttribute('color', new THREE.BufferAttribute(colors, 3)); return src;
    });
    const joined = mergeGeometries(pieces, false), indexed = mergeVertices(joined, .000001);
    pieces.forEach(o => o.dispose()); joined.dispose(); return indexed;
  });
  let material = fixedMaterials.get(STYLE.mode);
  if (!material) { material = mat('#ffffff').clone(); material.vertexColors = true; fixedMaterials.set(STYLE.mode, material); }
  fixed.forEach(o => g.remove(o));
  const shell = mesh(geometry, material); shell.name = 'gpt_fixed_shell'; g.add(shell);
}

function pad() {
  const g = grp(), shackle = grp();
  g.name = 'gpt_pad'; shackle.name = 'gpt_shackle'; shackle.userData.og = shackle;
  // MUST remain the first child: keyfx.js animates children[0] directly.
  g.add(shackle); put(shackle, .042, .014, -.002);
  const pts = [[0, 0, 0], [0, .07, 0]];
  for (let i = 1; i <= 10; i++) { const a = PI - i * PI / 10; pts.push([.042 + .042 * Math.cos(a), .07 + .042 * Math.sin(a), 0]); }
  pts.push([.084, .03, 0]);
  shackle.add(tube('shackle', pts.map(([x, y, z]) => [-x, y, z]), .012, C.light, false, 24));
  const end = geo('gptlock:shackle-end', () => new THREE.CircleGeometry(.012, 12).rotateX(HP));
  for (const [x, y] of [[0, 0], [-.084, .03]]) shackle.add(put(mesh(end, mat(C.light)), x, y, 0));
  g.add(box(.13, .108, .056, C.brass, .014));
  // Cream inset escutcheon, warm lower lip. Contact faces are separated in z.
  g.add(put(box(.084, .073, .009, C.light, .004), 0, -.003, .0295));
  g.add(put(keyhole(), 0, -.01, .035));
  g.add(put(block(.086, .009, .008, C.edge), 0, -.045, .027));
  for (const x of [-.05, .05]) rivet(x, -.031, .0295, g);
  g.userData.shackle = shackle;
  motion(g, t => {
    const lift = Math.min(1, t / .45), turn = Math.max(0, (t - .4) / .6);
    shackle.position.y = .014 + .036 * (1 - (1 - lift) ** 3);
    shackle.rotation.y = 1.2 * turn * turn * (3 - 2 * turn);
  });
  return g;
}

// Ten printed faces wrapped ONLY around a real wheel, never around the lock housing.
// Axle is X: rotation.x moves the numbered facets into view. Initial display is 000,
// independent of the secret code passed to the builder.
function digitTexture() {
  return prints.get('gptlock:digits-v2', () => canvasTex(128, 640, (c, w, h) => {
    c.fillStyle = C.cream; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (let d = 0; d < 10; d++) {
      let size = 62, metrics;
      do {
        c.font = `700 ${size}px LatinRound, Ssurround, sans-serif`;
        metrics = c.measureText(String(d));
        if (metrics.width <= w * .68 && (metrics.actualBoundingBoxAscent || size * .74) + (metrics.actualBoundingBoxDescent || 0) <= 64 * .76) break;
      } while (--size > 20);
      const ascent = metrics.actualBoundingBoxAscent || size * .74, descent = metrics.actualBoundingBoxDescent || 0;
      c.fillStyle = C.brown; c.fillText(String(d), w / 2, d * 64 + 32 + (ascent - descent) / 2);
    }
  }));
}
function wheelGeometry() {
  return geo('gptlock:wheel-v1', () => {
    // Indexed ten-sided barrel, separately unwrapped tread and end caps.
    const p = [], n = [], uv = [], ix = [], r = .035, half = .018;
    for (let i = 0; i < 10; i++) {
      const a = (i - .5) * PI / 5, b = (i + .5) * PI / 5, start = p.length / 3;
      for (const [x, angle, u, v] of [[-half, a, 0, 1 - (i + 1) / 10], [half, a, 1, 1 - (i + 1) / 10], [-half, b, 0, 1 - i / 10], [half, b, 1, 1 - i / 10]]) {
        p.push(x, r * Math.sin(angle), r * Math.cos(angle)); n.push(0, Math.sin(i * PI / 5), Math.cos(i * PI / 5)); uv.push(u, v);
      }
      ix.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
    }
    // Solid end caps sample the unprinted margin of the atlas.
    for (const side of [-1, 1]) {
      const start = p.length / 3; p.push(side * half, 0, 0); n.push(side, 0, 0); uv.push(.03, .03);
      for (let i = 0; i <= 10; i++) { const a = (i - .5) * PI / 5; p.push(side * half, r * Math.sin(a), r * Math.cos(a)); n.push(side, 0, 0); uv.push(.03, .03); }
      for (let i = 0; i < 10; i++) side > 0 ? ix.push(start, start + i + 2, start + i + 1) : ix.push(start, start + i + 1, start + i + 2);
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.setIndex(ix); return out;
  });
}
function codeLock(code, target = null) {
  const g = target || grp(); g.clear();
  const n = /^\d{4}$/.test(String(code)) ? 4 : 3, w = n === 4 ? .226 : .188;
  g.name = n === 4 ? 'gpt_code4' : 'gpt_code';
  // Real open wheel chamber: back, two cheeks and two rails. The spinning
  // barrels have clearance; they are not pushed through a solid housing block.
  g.add(put(box(w + .014, .13, .012, C.coral, .005), 0, 0, -.023));
  for (const sy of [-1, 1]) g.add(put(box(w + .014, .023, .064, C.coral, .009), 0, sy * .0535, .007));
  for (const sx of [-1, 1]) g.add(put(box(.026, .084, .064, C.coral, .009), sx * (w / 2 - .006), 0, .007));
  // Dark back wall gives the cream number wheels a quiet, readable recess.
  g.add(put(block(w - .025, .077, .006, C.brown), 0, 0, -.014));
  const wheels = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * .044;
    const m = mesh(wheelGeometry(), mat('#ffffff', { map: digitTexture() }));
    m.name = `gpt_wheel_${i}`; m.userData.og = m; put(m, x, 0, .027); g.add(m); wheels.push(m);
  }
  // Bridges across the recess, not a solid face that intersects the wheels.
  const railGeo = geo(`gptlock:wheel-rail:${w}`, () => {
    // L section: front visor masks adjacent numerals, upper web joins the body.
    // The barrel has clearance below the web and behind the visor (no intersection).
    const s = new THREE.Shape();
    s.moveTo(-.0605, .02); s.lineTo(-.063, .02);
    s.quadraticCurveTo(-.068, .02, -.068, .025);
    s.lineTo(-.068, .0565); s.quadraticCurveTo(-.068, .0625, -.062, .0625);
    s.lineTo(-.019, .0625); s.lineTo(-.019, .038); s.lineTo(-.0605, .038); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: w - .006, bevelEnabled: false, curveSegments: 3 })
      .rotateY(HP).translate(-(w - .006) / 2, 0, 0);
  });
  for (const sy of [-1, 1]) { const rail = mesh(railGeo, mat(C.light)); rail.scale.y = sy; g.add(rail); }
  for (const sx of [-1, 1]) { g.add(put(block(.01, .071, .014, C.edge), sx * (w / 2 - .005), 0, .042)); rivet(sx * (w / 2 - .009), 0, .051, g, C.light); }
  // Small fixed index at twelve o'clock; the face reads 000, never the solution.
  g.add(put(block(.012, .006, .003, C.coral), 0, .046, .070));
  const latch = put(box(.027, .027, .028, C.brass, .008), w / 2 + .004, 0, .002); g.add(latch); latch.userData.noMerge = true;
  g.userData.wheels = wheels;
  g.userData.setDigit = (i, value) => { if (wheels[i] && Number.isFinite(+value)) { const d = ((+value % 10) + 10) % 10; wheels[i].rotation.x = d * PI / 5; wheels[i].userData.digit = d; SHADOW.moved = true; } };
  wheels.forEach((_, i) => g.userData.setDigit(i, 0));
  motion(g, t => { latch.position.x = w / 2 + .004 - .024 * t; });
  return g;
}

function colorLock() {
  const g = grp(), sockets = [], latch = grp(); g.name = 'gpt_color';
  g.add(box(.24, .12, .05, C.sage, .012));
  g.add(put(box(.221, .094, .008, C.light, .0035), 0, -.004, .029));
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * .069;
    g.add(put(ring(.026, .006, C.edge), x, -.003, .039));
    // Geometry is flattened, not object scale: the legacy bounce resets scale to 1.
    const sk = mesh(geo('gptlock:socket-lens', () => new THREE.SphereGeometry(.023, 12, 8).scale(1, 1, .55)), mat(C.cream).clone());
    sk.name = `gpt_socket_${i}`; put(sk, x, -.003, .042); g.add(sk); sockets.push(sk);
    // A small tally under each jewel expresses the left-to-right order without tiny text.
    for (let k = 0; k <= i; k++) g.add(put(block(.004, .006, .002, C.edge), x + (k - i / 2) * .007, -.04, .034));
  }
  put(latch, .09, .066, .006); g.add(latch); latch.add(box(.035, .024, .034, C.brass, .008));
  g.userData.sockets = sockets;
  g.userData.setColor = (i, color) => { if (sockets[i]) { sockets[i].material.color.set(color); SHADOW.moved = true; } };
  motion(g, t => { latch.position.x = .09 - .028 * t; latch.rotation.z = -.22 * t; });
  return g;
}

function leverLock() {
  const g = grp(), chain = grp(); g.name = 'gpt_lever';
  g.add(box(.2, .1, .044, C.coral, .012));
  g.add(put(box(.177, .076, .009, C.light, .004), 0, 0, .028));
  // Two real eyes, the right one with a hinged gate. Links pass through the holes.
  for (const sx of [-1, 1]) { g.add(put(block(.028, .048, .012, C.edge), sx * .082, 0, .036)); rivet(sx * .082, -.016, .044, g); }
  const eye = put(ring(.025, .01, C.brass), -.082, .012, .062, HP); eye.userData.og = eye; g.add(eye);
  // The split right eye opens about its rear mounting point.
  const gate = put(grp(), .082, .012, .037); gate.userData.og = gate; g.add(gate);
  gate.add(put(mesh(geo('gptlock:gate-v2', () => new THREE.TorusGeometry(.025, .01, 5, 16, PI * 1.55)), mat(C.brass)), 0, 0, .025, HP, 0, -.45));
  // Pivot on the left eye's inner-side segment, so the retained link cannot
  // cut through that eye as it drops. Constant 2cm tube thickness and alternating
  // XY/XZ planes. These are threaded,
  // not fused ovals: the closest closed-state surface clearance is 2mm.
  put(chain, -.057, .012, .062); g.add(chain);
  const ellipse = [];
  for (let i = 0; i < 24; i++) { const a = i * PI / 12; ellipse.push([Math.cos(a) * .035, Math.sin(a) * .028, 0]); }
  for (let i = 0; i < 3; i++) {
    // (⑥ 10/23 우리 칠: brass links sank into a wicker basket or a wooden chest — 41판; cream links with one sage link read on
    // wood and wicker alike, no grey metal)
    const link = tube('chain-v2', ellipse, .01, i === 1 ? C.sage : C.cream, true, 32);
    put(link, .01 + i * .047, 0, 0, i === 1 ? HP : 0);
    link.name = `gpt_chain_${i}`; link.userData.og = link; chain.add(link);
  }
  const tag = put(grp(), .057, -.037, .024); chain.add(tag); tag.add(star());
  const mark = cylinder(.004, .002, C.light, 8); put(mark, 0, 0, .013, HP); tag.add(mark);
  g.userData.chain = chain; g.userData.gate = gate;
  motion(g, t => { const release = Math.min(1, t / .28), drop = Math.max(0, (t - .2) / .8); gate.rotation.x = -1.25 * release; chain.rotation.z = -1.36 * drop * drop * (3 - 2 * drop); tag.rotation.z = .25 * drop; });
  return g;
}

export function gptLock(kind, code = null, target = null) {
  const g = kind === 'pad' ? pad() : kind === 'color' ? colorLock() : kind === 'lever' ? leverLock() : codeLock(code, target);
  // A lock keeps its own single ink silhouette when attached to the same drawer part.
  batchFixed(g);
  g.userData.og = g; g.userData.kind = kind; return g;
}
