// 빛 쓸기 (user 10/19, 3판을 해 보고: "낚싯대에 도르래는 너무 헤메고 있으면 살짝 빛 효과… 라잇스윕 같은거. 저렇게 인터렉션
// 되는건 라잇스윕 한번씩 가끔 주는게 좋을거같아"): a shine passes once over a mechanism you can work — the fishing reel,
// the pulley basket, a lever, a device — now and then, and more often once you've been stuck a while. Only on things whose
// use isn't obvious (a drawer or a door never shines: that would give the hiding places away), and only while it still
// has something to give (never used, or something unfound in it). ?sweep=0 turns it off.
// The look (아트·룩뎁 세션 10/19, for the cel render): two crisp bands on the screen diagonal ↘ — a broad one and a thin
// one trailing it — mixed toward warm white rather than added (a yellow reel or a wooden basket never washes out), 1 px
// anti-aliased edges, .6 s ease in-out, three small stars as the band crosses the middle. Where the furniture's own body
// is small (the pulley's frame and crank), it shines too, so the band reads at the size of the thing.
import * as THREE from 'three';
import { ease } from './util.js';

const ON = typeof location === 'undefined' || !/[?&]sweep=0(&|$)/.test(location.search);
const OLD = typeof location !== 'undefined' && /[?&]hints=old(&|$)/.test(location.search);   // (the v157 timing, to compare)
const MECH = new Set(['fishdock', 'liftbasket']);   // furniture whose moving part is a mechanism (levers, devices: by flag)
const BODY = new Set(['liftbasket']);               // …and whose body shines with it (not the fishing dock: the whole deck would)
const DIR = new THREE.Vector2(.7071, -.7071);       // ↘ on the screen, whichever way the room is turned
const DUR = .6, GAP = 45, GAP_STUCK = 15, STUCK = 30;   // (10/19 evening, user again: "힌트가 너무 많다" — 25/8/15 → 45/15/30)
//   // (14 / 5.5 / 10 → 25 / 8 / 15: user 10/19 "힌트도 너무 많은 듯")

function shine(meshes) {
  const U = { uSwT: { value: -99 }, uSwOn: { value: 0 }, uSwW: { value: .1 } };
  const done = new Map();
  for (const o of meshes) {
    if (!o.material || Array.isArray(o.material)) continue;
    let m = done.get(o.material);
    if (!m) {
      m = o.material.clone();
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = 'varying vec3 vSwV;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vSwV = mvPosition.xyz;');
        sh.fragmentShader = 'varying vec3 vSwV;\nuniform float uSwT, uSwOn, uSwW;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
          '#include <dithering_fragment>\n  float sd = dot(vSwV.xy, vec2(.7071, -.7071)) - uSwT;\n  float aa = fwidth(sd);\n' +
          '  float bm = 1.0 - smoothstep(uSwW * .5 - aa, uSwW * .5 + aa, abs(sd));\n' +
          '  float bt = 1.0 - smoothstep(uSwW * .14 - aa, uSwW * .14 + aa, abs(sd + uSwW * 1.15));\n' +
          '  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, .965, .85), uSwOn * max(bm * .62, bt * .5));');
      };
      m.customProgramCacheKey = () => 'sweep2';
      done.set(o.material, m);
    }
    o.material = m;
  }
  return done.size ? U : null;
}

export function sweepSetup(S) {
  S.sweeps = [];
  if (!ON || S.custom || S.preview) return;
  for (const p of S.room.parts || []) {
    if (!(p.isLever || p.device || MECH.has(p.furn?.type))) continue;
    const piv = new Set(p.pivots || []), meshes = [];
    for (const pv of piv) pv.traverse(o => { if (o.isMesh && !o.userData.proxy) meshes.push(o); });
    const pivMeshes = meshes.slice();   // (the band is measured on these: the body only takes the band as it passes — 아트 10/19)
    // the body: what the bake left under the furniture's group, outside every moving part
    if (BODY.has(p.furn?.type) && p.furn.group) {
      const moving = new Set(); for (const q of p.furn.parts || []) for (const pv of q.pivots) moving.add(pv);
      const walk = o => { if (moving.has(o)) return; if (o.isMesh && !o.userData.proxy) meshes.push(o); for (const c of o.children) walk(c); };
      walk(p.furn.group);
    }
    const U = shine(meshes); if (U) S.sweeps.push({ part: p, meshes, piv: pivMeshes, U, used: false });
  }
  S._swT = 30;   // the first one only after half a minute (was 7 s: 10/19 evening "힌트가 너무 많다")
}

// 몽글 TV (10/20, user: "티비게임 반짝이는 거, 도르래에도 들어간 그 반짝이 넣어 줘"): a TV that plays takes the same shine as
// the pulley — one rule, a shine means you can press it. Its body and the picture on its screen shine; the band is sized
// on the body. It counts as worked (no more shines) once the TV has been opened (stage.js openTv sets part.t).
export function sweepAddTv(S, f, screen) {
  if (!ON || !S.sweeps || !f?.group) return;
  const moving = new Set(); for (const q of f.parts || []) for (const pv of q.pivots || []) moving.add(pv);
  const body = [];
  const walk = o => { if (moving.has(o) || o === screen) return; if (o.isMesh && !o.userData.proxy && o.visible) body.push(o); for (const c of o.children) walk(c); };
  walk(f.group);
  const U = shine(screen ? [...body, screen] : body);
  if (U) S.sweeps.push({ part: { t: 0, busy: false, spots: [], tv: f }, meshes: body, piv: body, U, used: false });
}

// one shine on this part now (7판: a tap on the key hanging out of reach shines the pulley's crank — stage.js tapHung)
export function shinePart(S, part) { const sw = S.sweeps?.find(x => x.part === part); if (sw && !sw.run && !part.busy) play(S, sw); }

// is it still worth pointing at: never worked yet, or something not found in it
const worth = sw => !sw.used || sw.part.spots?.some(s => s.item && !s.item.found && s.item.role !== 'decoy');

export function sweepUpdate(S, dt) {
  if (!S.sweeps?.length || !S.running || S.result || S.paused || S.cine || S.tutEls) return;   // (not over a lesson's hand — one guide at a time, 10/20)
  for (const sw of S.sweeps) if (sw.part.t > .5) sw.used = true;
  if (!OLD) {
    // (10/19 evening, user a third time: "힌트가 너무 많다" — 레벨 1~10 추천): only when stuck — half a minute without a find —
    // once for that stretch, at most twice a stage; never on a clock
    if ((S.idle || 0) < STUCK) { S._swDone = false; return; }
    if (S._swDone || (S._swN || 0) >= 2) return;
    const list = S.sweeps.filter(sw => worth(sw) && !sw.run && !sw.part.busy);
    if (!list.length) return;
    S._swDone = true; S._swN = (S._swN || 0) + 1;
    play(S, list[Math.floor(Math.random() * list.length)]); return;
  }
  if ((S._swT -= dt) > 0) return;
  const stuck = (S.idle || 0) > STUCK;
  S._swT = (stuck ? GAP_STUCK : GAP) + Math.random() * 3;
  const list = S.sweeps.filter(sw => worth(sw) && !sw.run && !sw.part.busy);
  if (!list.length) return;
  play(S, list[Math.floor(Math.random() * list.length)]);
}

const P = new THREE.Vector3();
function play(S, sw) {
  const W = S.G.world, inv = W.cam.matrixWorldInverse, box = new THREE.Box3();
  W.cam.updateMatrixWorld();
  // where the thing is along the screen diagonal (the visible pieces only: not a hair-thin line, not a net under the water)
  // (measured on the moving part only: with a tall body in the measure the band grew wide and a thin post went white —
  // 아트 10/19; the body just takes the band as it passes)
  let lo = 1e9, hi = -1e9; const seen = new THREE.Box3();
  const measure = sw.piv?.length ? sw.piv : sw.meshes;
  for (const o of measure) {
    if (!o.visible) continue;
    box.setFromObject(o); if (box.isEmpty()) continue;
    const d = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    if (Math.min(d.x, d.z) < .03 || c.y < .1) continue;
    seen.union(box);
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      P.set(x, y, z).applyMatrix4(inv); const v = P.x * DIR.x + P.y * DIR.y; lo = Math.min(lo, v); hi = Math.max(hi, v);
    }
  }
  if (lo > hi) return;
  const Wd = sw.U.uSwW.value = Math.max(.05, (hi - lo) * .2), a = lo - 1.4 * Wd, b = hi + 1.4 * Wd;
  sw.run = true; sw.U.uSwOn.value = 1;
  let starred = false;
  // (the still-view redraw only redraws a mesh whose fingerprint moved, and a uniform isn't one: the whole picture is
  // redrawn while the band passes — .6 s every 15 s or so)
  S.tw.run(DUR, k => {
    sw.U.uSwT.value = a + (b - a) * k; W.dirty?.invalidate?.();
    if (!starred && k >= .5) {   // the stars as the band crosses the middle — on a small reel they are the main thing
      starred = true; const sp = W.toScreen(seen.getCenter(new THREE.Vector3()));
      W.fx.burst(sp.x, sp.y, { n: 3, shape: 'star', speed: 40, gravity: -20, life: .7, size: 9, colors: ['#fff6c0', '#ffffff'] });
    }
  }, ease.inOutCubic).then(() => { sw.U.uSwOn.value = 0; sw.U.uSwT.value = -99; sw.run = false; W.dirty?.invalidate?.(); });
}
