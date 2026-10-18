// Renders 3D icons (items, furniture, character faces) to data URLs once at boot, so the HUD matches the 3D look.
// In the cartoon style the icons go through the same ink-outline post as the game.
import * as THREE from 'three';
import { STYLE, disposeTree } from './gfx/kit.js';
import { ToonPost } from './gfx/toonpost.js';
import { ART, applyArt, sortLayers } from './gfx/style.js';

// ONE offscreen renderer for every icon, made the first time and kept (10/18). Each batch used to make its own WebGL
// context and drop it, but the shared shape / material caches keep listeners pointing at every renderer that ever drew
// them, so the old contexts never went away: a few more each stage and boss, until Safari dropped the game's own context
// or reloaded the tab (user: "몇 판 하다 보면 하얗게 변하고 처음 로딩 화면", even on an iPhone 18 Pro).
let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setClearColor(0x000000, 0);
  const toon = STYLE.mode !== 'std';
  const scene = new THREE.Scene();
  let post = null;
  if (toon) {
    r.toneMapping = THREE.NoToneMapping;
    scene.add(new THREE.AmbientLight(ART.ambColor, ART.amb + .25));
    const d = new THREE.DirectionalLight(ART.sunColor, ART.sun); d.position.set(2, 4, 3); scene.add(d);
    post = new ToonPost(r, { budget: 300 * 300 * 4 }); applyArt(post);
  } else {
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    scene.add(new THREE.HemisphereLight('#ffffff', '#d9c6ff', 1.6));
    const d = new THREE.DirectionalLight('#fff4e6', 1.6); d.position.set(2, 4, 3); scene.add(d);
  }
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 100);   // orthographic like the game (the ink pass assumes it)
  let cur = 0;
  const size = n => { if (n === cur) return; cur = n; r.setSize(n, n, false); post?.setSize(n, n, { dpr: 1, lineCss: 2.4, maxSS: 2 }); };
  return (SHARED = { r, canvas, scene, post, cam, toon, size });
}
export function thumbCtx(size = 160) {
  const { r, canvas, scene, post, cam, toon, size: setSize } = shared();
  const one = job => {
    setSize(size);   // (a batch of another size may have run in between)
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
    // the model was built only for its picture: free it now (a batch of 200 pieces left ~140 MB behind, 10/18)
    scene.remove(obj); disposeTree(obj);
    return url;
  };
  return { one, done() {} };   // the renderer stays for the next batch
}
export function renderThumbs(jobs, size = 160) {
  const C = thumbCtx(size), out = {};
  for (const job of jobs) out[job.key] = C.one(job);
  C.done();
  return out;
}
