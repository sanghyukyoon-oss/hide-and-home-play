// Renders 3D icons (items, furniture, character faces) to data URLs once at boot, so the HUD matches the 3D look.
// In the cartoon style the icons go through the same ink-outline post as the game.
import * as THREE from 'three';
import { STYLE } from './gfx/kit.js';
import { ToonPost } from './gfx/toonpost.js';
import { ART, applyArt, sortLayers } from './gfx/style.js';

// one offscreen renderer that draws icons one at a time (renderThumbs uses it for a whole batch; main.js keeps one alive
// to draw the furniture icons a few at a time after boot)
export function thumbCtx(size = 160) {
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(size, size, false);
  r.setClearColor(0x000000, 0);
  const toon = STYLE.mode !== 'std';
  const scene = new THREE.Scene();
  let post = null;
  if (toon) {
    r.toneMapping = THREE.NoToneMapping;
    scene.add(new THREE.AmbientLight(ART.ambColor, ART.amb + .25));
    const d = new THREE.DirectionalLight(ART.sunColor, ART.sun); d.position.set(2, 4, 3); scene.add(d);
    post = new ToonPost(r, { budget: size * size * 4 }); applyArt(post);
    post.setSize(size, size, { dpr: 1, lineCss: 2.4, maxSS: 2 });
  } else {
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    scene.add(new THREE.HemisphereLight('#ffffff', '#d9c6ff', 1.6));
    const d = new THREE.DirectionalLight('#fff4e6', 1.6); d.position.set(2, 4, 3); scene.add(d);
  }
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 100);   // orthographic like the game (the ink pass assumes it)
  const one = job => {
    const obj = job.build();
    scene.add(obj);
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj, true);
    const c = job.center ? new THREE.Vector3(...job.center) : box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const rad = (job.radius ?? Math.max(sz.x, sz.y, sz.z) * .5 * (job.fit || 1)) * (toon ? 1.08 : 1);
    const dir = new THREE.Vector3(...(job.dir || [.55, .75, 1])).normalize();
    const dist = rad * 8;
    cam.position.copy(c).addScaledVector(dir, dist);
    if (job.lookY != null) c.y = job.lookY;
    cam.lookAt(c);
    const half = rad * 1.18;
    cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half;
    cam.near = Math.max(.01, dist - rad * 4); cam.far = dist + rad * 4; cam.updateProjectionMatrix();
    if (post) { sortLayers(scene); post.assignIds(scene); post.render(scene, cam); }
    else r.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    scene.remove(obj);
    return url;
  };
  return { one, done() { r.dispose(); r.forceContextLoss?.(); } };
}
export function renderThumbs(jobs, size = 160) {
  const C = thumbCtx(size), out = {};
  for (const job of jobs) out[job.key] = C.one(job);
  C.done();
  return out;
}
