// 멍뭉이네 밖으로 이어지는 동네. Scenery only: no floor marker, pick target or hiding spot.
// (gpt2-c 작업장 gptdoghouse-surround.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// Keep the playable house/yard inside x ±5.2, z ±4.2. All buildings and trees stand beyond it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, mat, mesh, STYLE } from './kit.js';

const B = {};
const FADE = '#6bc7eb';
const NO_PICK = () => {};
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mapped = color => new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(color) : color);

// One shared toon material and one merged mesh for the entire ring. No far-object ink or shadows.
const VM = new Map();
function vertexMaterial() {
  const key = STYLE.mode;
  if (!VM.has(key)) {
    const m = mat('#ffffff', { rim: 0 }).clone();
    m.vertexColors = true;
    m.name = 'gpt-neighborhood-toon';
    VM.set(key, m);
  }
  return VM.get(key);
}

function pitchedRoof(w, h, d) {
  // A closed triangular prism: a solid chunky silhouette from every rotation.
  const v = [
    -w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2,
    -w / 2, 0, d / 2, w / 2, 0, d / 2, 0, h, d / 2,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 2, 5, 4, 2, 4, 1, 0, 1, 4, 0, 4, 3]);
  g.computeVertexNormals();
  return g;
}

// (① 10/22 공통 룩 키트: 바깥 판 19·20·21·23·25·27도 이 동네를 깐다 — 판마다 집 벽·지붕 색만 테마의 townWalls·townRoofs로, 좌우는 townFlip, 높이는 townY; gfx/town-kit.js)
const WALLS = ['#f5b8c7', '#a5dfc6', '#b7daf0', '#f5b8c7', '#fef2e1', '#a5dfc6'], ROOFS = ['#4e97d5', '#e96d78', '#36b4a5', '#4e97d5', '#e96d78', '#e782b2'];
function ringGeometry(T = {}) {
  const sky = T.gptSky || FADE, paving = T.gptPaving || '#8fc6d5', walls = T.townWalls || WALLS, roofs = T.townRoofs || ROOFS;
  return geo('gptdog-neighborhood-v2|' + STYLE.mode + '|' + sky + '|' + paving + '|' + walls.join() + '|' + roofs.join(), () => {
    const list = [], fade = mapped(sky), xf = new THREE.Matrix4();
    const add = (src, color, x, y, z, ry = 0) => {
      const g = src.index ? src.toNonIndexed() : src.clone();
      src.dispose();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      xf.makeRotationY(ry); xf.setPosition(x, y, z); g.applyMatrix4(xf);
      const p = g.attributes.position, c = mapped(color), colors = new Float32Array(p.count * 3), v = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        // Spatial haze, not global fog: near ring keeps soft colour; distant silhouettes dissolve into the ground.
        const r = Math.hypot(p.getX(i), p.getZ(i));
        v.copy(c).lerp(fade, .12 + .85 * smooth(9, 31, r));
        colors[i * 3] = v.r; colors[i * 3 + 1] = v.g; colors[i * 3 + 2] = v.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); list.push(g);
    };
    const box = (w, h, d, color, x, y, z, ry = 0) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z, ry);
    const tree = (x, z, s = 1, shade = '#63c79e') => {
      add(new THREE.CylinderGeometry(.12 * s, .18 * s, 1.45 * s, 6), '#c67f2a', x, .7 * s, z);
      add(new THREE.SphereGeometry(.95 * s, 6, 4), shade, x, 1.75 * s, z);
      add(new THREE.SphereGeometry(.66 * s, 6, 4), '#8bcf79', x + .12 * s, 2.35 * s, z - .08 * s);
    };
    const house = (x, z, w, d, h, wall, roof, ry = 0, far = false) => {
      const c = Math.cos(ry), s = Math.sin(ry);
      const at = (u, v) => [x + u * c + v * s, z - u * s + v * c];
      box(w + .22, .12, d + .22, '#b9d8e1', x, .03, z, ry);
      box(w, h, d, wall, x, h / 2 + .09, z, ry);
      add(pitchedRoof(w + .42, .78, d + .38), roof, x, h + .09, z, ry);
      if (far) return;
      // Front and rear windows are small chunky inserts, separated from the wall face by 1.5 cm.
      for (const side of [-1, 1]) for (const u of [-w * .27, w * .27]) {
        const [wx, wz] = at(u, side * (d / 2 + .025));
        box(.63, .74, .045, '#fefde9', wx, h * .56 + .12, wz, ry);
        const [gx, gz] = at(u, side * (d / 2 + .055));
        box(.47, .58, .03, '#69bde5', gx, h * .56 + .12, gz, ry);
      }
      for (const side of [-1, 1]) {
        const [wx, wz] = at(side * (w / 2 + .025), 0);
        box(.045, .7, .65, '#fefde9', wx, h * .56 + .12, wz, ry);
        const [gx, gz] = at(side * (w / 2 + .055), 0);
        box(.03, .54, .49, '#69bde5', gx, h * .56 + .12, gz, ry);
      }
      // A short chimney creates a lived-in roof silhouette without detail noise.
      const [cx, cz] = at(w * .26, -.25);
      box(.34, .62, .38, '#eecfa3', cx, h + .65, cz, ry);
      box(.46, .1, .49, '#c67f2a', cx, h + 1.0, cz, ry);
    };

    // South street and its sidewalks continue across the frame. A narrow side lane gives depth past the house.
    box(66, .025, 3.1, paving, 0, -.026, 5.8);
    box(66, .055, .7, '#c9e5e9', 0, -.015, 7.72);
    for (const x of [-19.3, 19.3]) box(27.4, .055, .65, '#c9e5e9', x, -.015, 3.9);
    box(2.25, .025, 38, paving, -7.5, -.027, -15.75);
    box(.55, .055, 26, '#c9e5e9', -9.05, -.015, -5.6);
    box(.48, .055, 26, '#c9e5e9', -5.95, -.015, -5.6);
    // Faded street markings: geometry, so their scale stays consistent on every view.
    for (let x = -29; x <= 29; x += 4.1) box(1.45, .008, .065, '#fefde9', x, -.008, 5.8);
    for (let z = -27; z <= 1; z += 4) box(.06, .008, 1.4, '#fefde9', -7.5, -.008, z);

    // Immediate neighbours: one storey, leaving the two-storey protagonist house dominant.
    house(-3.2, -10.4, 3.7, 3.1, 2.15, walls[0 % walls.length], roofs[0 % roofs.length]);
    house(2.5, -11.2, 4.1, 3.4, 2.5, walls[1 % walls.length], roofs[1 % roofs.length]);
    house(10.5, -6.5, 3.35, 4.1, 2.1, walls[2 % walls.length], roofs[2 % roofs.length], -.14);
    house(11.3, 1.4, 3.8, 3.0, 2.25, walls[3 % walls.length], roofs[3 % roofs.length], .08);
    house(-12.0, -5.2, 3.6, 3.4, 2.35, walls[4 % walls.length], roofs[4 % roofs.length], .12);
    house(-12.2, 1.0, 3.5, 3.1, 1.95, walls[5 % walls.length], roofs[5 % roofs.length], .07);
    // A few pale garden strips and low fences imply homes beyond the play area.
    box(6.1, .055, 1.35, '#8bcf79', 1.7, -.018, -7.45);
    box(1.4, .055, 6.8, '#8bcf79', 7.1, -.018, -1.25);
    box(5.1, .32, .13, '#c9e5e9', 1.7, .16, -6.65);
    box(.13, .33, 5.3, '#c9e5e9', 7.35, .165, -1.2);
    for (const [x, z, s, col] of [
      [-5.7, -7.7, .92, '#63c79e'], [5.95, -8.3, 1.05, '#8bcf79'],
      [7.5, 2.6, .93, '#84ae9d'], [-10.1, 3.1, .9, '#8bcf79'],
      [8.1, -13.6, 1.08, '#84ae9d'], [-14.4, -11.0, 1.13, '#63c79e'],
      [-16.8, 5.0, .82, '#63c79e'], [17.5, 4.4, .96, '#8bcf79'],
    ]) tree(x, z, s, col);

    // Far ring: silhouette blocks with pitched roofs, no windows, no individual outlines.
    const far = [
      [-21, -12, 4.8, 4.0, 2.5], [-18.2, -20, 4.2, 4.1, 2.8], [-10.6, -21, 4.8, 3.6, 2.2],
      [-2.8, -20.8, 5.2, 4.3, 2.9], [5.4, -22, 4.3, 4.1, 2.6], [13.4, -19.2, 4.3, 3.8, 2.2],
      [21, -13.8, 4.7, 4.3, 2.7], [22.4, -4.9, 4.2, 4.2, 2.4], [23.8, 4.7, 4.2, 4.0, 2.3],
      [-23.5, -.5, 4.3, 4.1, 2.8], [-22, 10.6, 4.8, 4.2, 2.3],
      [-10.9, 13.7, 4.6, 3.6, 2.3], [0.5, 15.5, 4.9, 3.9, 2.25], [12.6, 14.3, 4.7, 4.0, 2.5],
    ];
    far.forEach(([x, z, w, d, h], i) => house(x, z, w, d, h, walls[(i + 1) % walls.length], roofs[(i + 2) % roofs.length], (i % 3 - 1) * .08, true));
    for (const [x, z, s] of [[-27, -7, 1.3], [-25, -20, 1.1], [1, -28, 1.1], [24, -22, 1.25], [27, 7, 1.2], [-16, 20, 1.0], [18, 22, 1.1]]) tree(x, z, s, '#8bcf79');

    const result = mergeGeometries(list, false);
    list.forEach(g => g.dispose());
    result.computeBoundingBox(); result.computeBoundingSphere();
    return result;
  });
}

function groundGeometry(T = {}) {
  const sky = T.gptGroundFar || T.gptSky || FADE, ground = T.gptGround || '#92cddb';
  return geo('gptdog-boundless-ground-v2|' + STYLE.mode + '|' + sky + '|' + ground, () => {
    const g = new THREE.PlaneGeometry(70, 70, 20, 20); g.rotateX(-Math.PI / 2); g.translate(0, -.055, 0);
    const p = g.attributes.position, colors = new Float32Array(p.count * 3), alpha = new Float32Array(p.count);
    const near = mapped(ground), far = mapped(sky), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x), Math.abs(z));
      c.copy(near).lerp(far, smooth(5, 31, Math.hypot(x, z)));
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      alpha[i] = 1 - smooth(24, 35, r);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('gptAlpha', new THREE.BufferAttribute(alpha, 1));
    return g;
  });
}

const GM = new Map();
function groundMaterial() {
  if (!GM.has(STYLE.mode)) {
    const m = mat('#ffffff', { rim: 0 }).clone();
    m.vertexColors = true; m.transparent = true; m.depthWrite = false;
    m.name = 'gpt-boundless-ground-fade';
    // Alpha lives on this material only; the normal toon gradient and lighting remain intact.
    m.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float gptAlpha; varying float vGptAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGptAlpha = gptAlpha;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGptAlpha;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= vGptAlpha;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'gptdog-ground-fade-v1-' + STYLE.mode;
    GM.set(STYLE.mode, m);
  }
  return GM.get(STYLE.mode);
}

function scenery(m, name) {
  m.name = name; m.layers.set(2); m.castShadow = false; m.receiveShadow = false; m.raycast = NO_PICK;
  m.userData.scenery = true; m.userData.noOcclude = true; m.userData.noMerge = true;
  return m;
}

B.gptneighborhood = (f, T = {}) => {
  f.group.name = 'gpt-neighborhood-surround';
  f.group.userData.scenery = true;
  // The furnished scene's collision pass must not mistake this ring's huge bounding box for a solid room-sized item.
  f.collideBox = [-.001, -.2, -.001, .001, -.15, .001];
  f.noOccupied = true; f.noSolid = true;
  const ground = scenery(mesh(groundGeometry(T), groundMaterial(), { cast: false, recv: false }), 'gpt-ground-to-horizon');
  ground.renderOrder = -2;
  const ring = scenery(mesh(ringGeometry(T), vertexMaterial(), { cast: false, recv: false }), 'gpt-neighborhood-merged-ring');
  // (a mirrored town for another stage, and one set lower under a roof-top stage — 20판)
  if (T.townFlip) ring.scale.x = -1;
  ring.rotation.y = T.townRot || 0;
  ground.position.y += T.townY || 0; ring.position.y += T.townY || 0;
  f.add(ground); f.add(ring);
};

export const GPTSURROUND_BUILDERS = B;
export const GPTSURROUND_INFO = {
  gptneighborhood: { w: 1, d: 1, name: '경계 없이 이어지는 동네', price: 0, hidden: true },
};
