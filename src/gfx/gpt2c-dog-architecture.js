// Built details of Woofy's yard. No surrounding plinth and no decorative hiding spots.
// (gpt2-c 작업장 gptdoghouse-architecture.js, fix-1022 a83e02b — ① 10/22 들여옴; 끝의 gpt2c_dogground는 우리 쪽에서 더함)
import * as THREE from 'three';
import { rbox, cyl, sph, put, grp, mesh, mat, geo } from './kit.js';
import { makeFurniture } from './furniture.js';

const B = {};
const addBox = (g, w, h, d, c, x, y, z, r = .015) => g.add(put(rbox(w, h, d, c, r), x, y, z));
const stem = (g, a, b, r, c) => {
  const A = new THREE.Vector3(...a), Z = new THREE.Vector3(...b), v = Z.clone().sub(A);
  const o = cyl(r, r, v.length(), c, null, 6);
  o.position.copy(A.add(Z).multiplyScalar(.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(o);
};
const flower = (g, x, y, z, c) => {
  stem(g, [x, y, z], [x, y + .23, z], .012, '#47b694');
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI * .4;
    g.add(put(sph(.045, c, null, 6, 4), x + Math.cos(a) * .05, y + .23, z + Math.sin(a) * .05, 0, 0, 0, [1, .45, 1]));
  }
  g.add(put(sph(.027, '#feb53d', null, 6, 4), x, y + .245, z));
};
B.gptyarddetails = (f, T, opts = {}) => {
  const g = grp(); f.add(g);
  const groundScale = opts.groundScale || 1; g.scale.set(groundScale, 1, groundScale);
  // Low garden walls enclose only the back and west: the south gateway has a real street behind it.
  addBox(g, 4.16, .82, .17, '#a7d8e4', -3.08, .41, -3.67, .035);
  addBox(g, 4.3, .10, .27, '#c67f2a', -3.08, .87, -3.67, .03);
  addBox(g, .18, .70, 5.9, '#a7d8e4', -5.15, .35, -.64, .035);
  addBox(g, .28, .09, 6.03, '#c67f2a', -5.15, .745, -.64, .03);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 10; k++) {
    const z = -3.3 + k * .57 + (row % 2) * .22;
    if (z > 2.14) continue;
    addBox(g, .015, .12, .49, row % 2 ? '#eecfa3' : '#b7d7e4', -5.047, .1 + row * .17, z, .004);
  }
  // Separate raised beds, with the soil visibly recessed below thick terracotta rims.
  for (const [x, z, w, d] of [[-4.76, -1.08, .46, .86], [-1.75, -3.32, .74, .32], [4.42, -1.5, .52, 1.9]]) {
    addBox(g, w, .18, d, '#ed6670', x, .09, z, .035);
    addBox(g, w - .075, .02, d - .075, '#6f4b30', x, .159, z, .006);
    for (let k = 0; k < 4; k++) flower(g, x + ((k % 2) - .5) * (w - .16), .17, z + (Math.floor(k / 2) - .5) * (d - .14), k % 2 ? '#f198ba' : '#ed6670');
  }
  // Wide route from the gate to the house, never a painted doorway illusion.
  for (const [x, z, a] of [[-3, 3], [-2.4, 2.5], [-1.85, 1.96], [-1.45, 1.43]]) {
    const o = put(rbox(.70, .065, .49, '#b7d7e4', .09), x, .032, z, 0, a || -.25);
    g.add(o);
  }
  // A modest house foundation, rather than an island under the whole level.
  addBox(g, 5.12, .14, 7.10, '#a5cbd5', 1.5, -.085, 0, .035);
  // A short real foyer wall frames the opening; the rest is cut away so the yard chain stays readable.
  // The foyer moves with the enlarged plan; its opening still hugs the metre-sized door.
  const portalHalf = .53 / groundScale + .12;
  for(const z of [1-portalHalf,1+portalHalf])addBox(g,.15,2.10,.24,'#fef2e1',-1,1.05,z,.018);
  addBox(g,.17,.22,1.06 / groundScale + .48,'#fef2e1',-1,2.21,1,.018);
  // Veranda columns carry the visible front of the first-floor balcony.
  const supports = opts.corner ? [[-.79, .30], [1.79, .64], [3.79, -.39]] : [[-.79, -.39], [3.79, -.39]];
  for (const [x, z] of supports) {
    addBox(g, .15, 2.50, .15, '#eaa440', x, 1.25, z, .025);
    addBox(g, .23, .1, .23, '#fef2e1', x, .05, z, .018);
  }
  // Two light-coloured beams underneath the balcony, not through the furniture.
  if (opts.corner) {
    addBox(g, 2.96, .16, .13, '#c67f2a', .5, 2.42, .64, .015);
    addBox(g, 1.96, .16, .13, '#c67f2a', 3, 2.42, -.39, .015);
    addBox(g, .14, .16, .58, '#c67f2a', -.79, 2.42, .49, .015);
  } else addBox(g, 4.96, .16, .13, '#c67f2a', 1.5, 2.42, -.39, .015);
  // A tap and hose reel by the garden wall. Hose is a continuous tube attached at both ends.
  addBox(g, .035, .28, .16, '#86cdd3', -5.035, .38, -.18, .02);
  const reel = put(cyl(.15, .15, .10, '#47b694', null, 12), -4.96, .43, -.18, 0, 0, Math.PI / 2); g.add(reel);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-4.89, .43, -.18), new THREE.Vector3(-4.75, .18, -.12), new THREE.Vector3(-4.72, .07, .02), new THREE.Vector3(-4.55, .07, .08)]);
  g.add(mesh(geo('gpt-hose', () => new THREE.TubeGeometry(curve, 16, .018, 5, false)), mat('#47b694')));
  // Five inky paw impressions lead through the gate toward the station-side street.
  for (let k = 0; k < 5; k++) {
    const x = -2.86 + k * .28, z = 3.95 + k * .31;
    g.add(put(sph(.065, '#6f4b30', null, 8, 4), x, .011, z, 0, .3, 0, [.8, .08, 1]));
    for (const dx of [-.045, 0, .045]) g.add(put(sph(.024, '#6f4b30', null, 6, 4), x + dx, .012, z + .085, 0, 0, 0, [1, .18, 1]));
  }
  f.collideBox = [0, -.12, 0, .001, -.11, .001];
};

// One continuous L-shaped slab. Adjacent rectangular slabs would share a flickering top face.
B.gptcornerslab = (f, T, opts = {}) => {
  const groundScale = opts.groundScale || 1; f.group.scale.set(groundScale, 1, groundScale);
  const s = new THREE.Shape(), points = [[-1.25,-3.75],[2.25,-3.75],[2.25,-2.75],[4.25,-2.75],[4.25,-.25],[2.25,-.25],[2.25,.75],[-1.25,.75]];
  points.forEach(([x,z],i)=>i ? s.lineTo(x,-z) : s.moveTo(x,-z)); s.closePath();
  const g = geo('gpt-corner-L-slab',()=>new THREE.ExtrudeGeometry(s,{depth:.34,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:2}));
  f.add(put(mesh(g,mat('#eecfa3')),0,2.53,0,-Math.PI/2));
};

// 바탕 (① 10/22): the workshop drew the street ring, the yard's walls and the corner slab as map scenery (its map.js def.scenery).
// Ours has none, and a piece in a room counts its whole box against the other rooms' walking tiles (walkGrid) — the ring's
// 70 m box would close every floor. So the yard's 바탕 piece builds them apart and hangs them on the map's root on its first
// frame (Room.update → f.idle), and each ground room's piece gives the walking walls inside it as walkBoxes
// (raised beds, the hose reel, the foyer's short walls, the veranda columns). Positions are the workshop's, scaled by k.
const yardWalls = (k, corner) => {
  const box = (x, z, w, d, h, y = 0) => [x * k - w * k / 2, y, z * k - d * k / 2, x * k + w * k / 2, y + h, z * k + d * k / 2];
  const half = .53 / k + .12, foyer = [box(-1, 1 - half, .15, .24, 2.1), box(-1, 1 + half, .15, .24, 2.1)];
  const cols = (corner ? [[-.79, .30], [1.79, .64], [3.79, -.39]] : [[-.79, -.39], [3.79, -.39]]).map(([x, z]) => box(x, z, .23, .23, 2.5));
  return { yard: [box(-4.76, -1.08, .46, .86, .45), box(-1.75, -3.32, .74, .32, .45), box(-4.98, -.18, .16, .32, .3, .28), ...foyer], house: [...foyer, ...cols] };
};
const GROUND_THEMES = new WeakMap();   // (one theme object per map's sky and ground: bake.js remembers its flush plans by theme)
const groundTheme = (T, o) => {
  let m = GROUND_THEMES.get(T); if (!m) GROUND_THEMES.set(T, m = new Map());
  const key = [o.sky, o.far, o.ground, o.paving].join('|');
  if (!m.has(key)) m.set(key, { ...T, gptSky: o.sky, gptGroundFar: o.far, gptGround: o.ground, gptPaving: o.paving });
  return m.get(key);
};
B.gpt2c_dogground = (f, T, o = {}) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.2, 0, .001, -.15, .001];
  const k = o.k || 1, [ax, az] = o.at || [0, 0];
  f.walkBoxes = (yardWalls(k, o.corner)[o.side] || []).map(b => [b[0] - ax, b[1], b[2] - az, b[3] - ax, b[4], b[5] - az]);
  if (o.side !== 'yard') return;
  const theme = groundTheme(T || {}, o);
  const parts = [makeFurniture('gptneighborhood', theme), makeFurniture('gptyarddetails', theme, o.corner ? { corner: true, groundScale: k } : { groundScale: k })];
  if (o.corner) parts.push(makeFurniture('gptcornerslab', theme, { groundScale: k }));
  f.idle = () => {
    if (f.gptGroundOn) return;
    const root = f.group.parent?.parent; if (!root) return;
    f.gptGroundOn = true;
    for (const p of parts) root.add(p.group);
  };
};

export const GPTARCH_BUILDERS = B;
export const GPTARCH_INFO = {
  gptyarddetails: { w: 1, d: 1, name: '멍뭉이네 마당 디테일', hidden: true, price: 0 },
  gptcornerslab: { w: 1, d: 1, name: 'ㄱ자 계단집 바닥', hidden: true, price: 0 },
  gpt2c_dogground: { w: 1, d: 1, name: '멍뭉이네 바탕', hidden: true, price: 0 },
};
