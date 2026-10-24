// 공용 새 (10/24 사용자 "참새 아이들 애니 줄 수 있음?" · 21판 "비둘기 제대로 만들고 애니메이션도"): 우리 그림체의 덩어리 큰 참새·비둘기와
// 그 대기 동작. 새 한 마리는 부품 묶음(뿌리 · 뜀 · 몸 · 머리 · 꼬리, 비둘기는 두 발도)이고, 묶음마다 f.live라 정지 화면 굽기(bake.js)는
// 묶음 안에서만 합쳐 한 덩어리로 움직인다. 정점은 건드리지 않고 묶음의 회전·위치만 바꾼다.
// 동작은 시간만으로 정해지는 순수 함수(새마다 시드로 박자를 어긋나게): 한 칸(약 1~1.8초)마다 동작 하나를 짧고 또렷하게 하고 나머지는
// 가만히 있는다 — 가만히 있는 동안은 값이 그대로라 부분 다시 그리기(dirty.js)가 아무것도 다시 그리지 않는다(발열).
// 화면 밖이면 돌리지 않는다(room.js가 매 프레임 부르는 f.updateView에 걸어 카메라를 본다).
// 참새: 고개 두리번 · 갸웃 · 콕콕 쪼기 · 꼬리 까딱 · 제자리 폴짝(살짝 돌며).
// 비둘기: 걷다 멈추기(발 번갈아, 고개 앞뒤로 끄덕) · 끄덕끄덕 쪼기 · 두리번 · 가슴 부풀리기.
// 좌표: 새는 +x를 보고, 발이 y 0. addPigeon / addSparrow(f, x, y, z, ry, { s, seed, tone, range })가 그 자리에 놓는다.
import * as THREE from 'three';
import { sph, cyl, cone, cap, put, grp, blobShadow } from './kit.js';

const PI = Math.PI, HP = PI / 2;
const INK = '#2a1d33';
const hh = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7 + 1.7) * 43758.5453; return x - Math.floor(x); };
const sm = k => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const bump = (u, a, b) => (u <= a || u >= b ? 0 : Math.sin(PI * (u - a) / (b - a)));
const hold = (u, a, b, e = .1) => Math.min(sm((u - a) / e), sm((b - u) / e));
const lerp = (a, b, k) => a + (b - a) * k;

// a group whose origin sits at pivot p (bird coordinates); parts go in at bird coordinates with at()
function pivotGroup(parent, p, f) {
  const g = grp(); g.position.set(p[0] - (parent.userData.o?.[0] || 0), p[1] - (parent.userData.o?.[1] || 0), p[2] - (parent.userData.o?.[2] || 0));
  g.userData.o = p; parent.add(g); (f.live ||= []).push(g); return g;
}
function at(g, m, x, y, z, rx = 0, ry = 0, rz = 0, s = null) {
  const o = g.userData.o || [0, 0, 0];
  put(m, x - o[0], y - o[1], z - o[2], rx, ry, rz, s); m.castShadow = false; g.add(m); return m;
}
const both = fn => { fn(1); fn(-1); };

// 화면 밖이면 건너뜀: 뿌리 자리를 카메라로 비춰 화면 안(조금 넉넉히)인지 본다
const V = new THREE.Vector3();
function onScreen(root, cam) {
  if (!cam) return true;
  V.setFromMatrixPosition(root.matrixWorld).project(cam);
  return V.z < 1 && Math.abs(V.x) < 1.25 && Math.abs(V.y) < 1.25;
}
// a piece's birds: one updateView for all of them, chained after whatever the piece already had
function drive(f, bird) {
  if (!f.birds) {
    f.birds = [];
    const prev = f.updateView;
    let T = 0;
    f.updateView = (wd, dt = 1 / 60) => {
      prev?.(wd, dt);
      T += Math.min(dt || 0, .5);
      for (const b of f.birds) if (onScreen(b.root, wd?.cam)) b.pose(T);
    };
  }
  f.birds.push(bird);
}

// ── 참새 (Eurasian tree sparrow, 한국 참새): 밤색 정수리, 흰 뺨에 까만 점, 까만 턱받이, 갈색 등에 짙은 줄, 흰 날개 띠 ──────────
const SP = { back: '#b98a5e', streak: '#6e4a33', wing: '#a5734b', tip: '#6e4a33', belly: '#f1e6d6', crown: '#a0603a', cheek: '#fbf6ee', beak: '#4a3f55', leg: '#d9a07a', bar: '#fffaf0' };
export function addSparrow(f, x, y, z, ry = 0, o = {}) {
  const s = o.s ?? 1, seed = o.seed ?? (x * 13.7 + z * 7.1);
  const root = grp(); put(root, x, y, z, 0, ry, 0, s); root.userData.o = [0, 0, 0]; f.add(root); (f.live ||= []).push(root);
  const sh = blobShadow(.055, .22); sh.position.y = .004; sh.layers.set(2); sh.userData.noOcclude = true; root.add(sh);
  const hop = pivotGroup(root, [0, 0, 0], f);
  both(k => {
    at(hop, cyl(.0055, .0055, .036, SP.leg, null, 6), .004, .02, k * .017);
    for (const a of [-.35, 0, .35]) at(hop, cap(.0042, .016, SP.leg), .016, .004, k * .017 + Math.sin(a) * .012, 0, a, -HP);
    at(hop, cap(.0042, .012, SP.leg), -.008, .004, k * .017, 0, 0, HP);
  });
  const body = pivotGroup(hop, [0, .04, 0], f);
  at(body, sph(.058, SP.back, null, 14, 11), 0, .075, 0, 0, 0, .25, [1.35, 1, 1.05]);
  at(body, sph(.05, SP.belly, null, 14, 11), .022, .063, 0, 0, 0, .1, [1.2, .9, 1.02]);
  for (const [dx, dz] of [[-.035, .018], [-.01, -.016], [.012, .012], [-.055, -.004]]) at(body, sph(.016, SP.streak, null, 8, 6), dx, .113 + dx * .25, dz, 0, .3, .2, [1.5, .35, .55]);
  both(k => {
    at(body, sph(.045, SP.wing, null, 12, 9), -.018, .082, k * .043, 0, 0, .3, [1.45, .72, .44]);
    at(body, sph(.03, SP.bar, null, 10, 8), -.012, .084, k * .046, 0, 0, .45, [.28, .8, .7]);
    at(body, sph(.03, SP.tip, null, 10, 8), -.074, .095, k * .028, 0, k * .2, .35, [1.45, .45, .5]);
  });
  const tail = pivotGroup(body, [-.065, .09, 0], f);
  at(tail, sph(.04, '#8a5e3e', null, 12, 8), -.1, .098, 0, 0, 0, -.18, [1.35, .26, .72]);
  at(tail, sph(.026, SP.back, null, 10, 8), -.07, .093, 0, 0, 0, -.18, [1.2, .5, .9]);
  const head = pivotGroup(body, [.045, .105, 0], f);
  at(head, sph(.045, SP.cheek, null, 16, 12), .06, .136, 0);
  at(head, sph(.046, SP.crown, null, 16, 12), .055, .149, 0, 0, 0, 0, [1.02, .72, 1.02]);
  at(head, sph(.034, SP.crown, null, 12, 9), .028, .132, 0, 0, 0, 0, [1, 1, .96]);
  at(head, sph(.02, INK, null, 10, 8), .089, .106, 0, 0, 0, 0, [.8, 1, 1.15]);
  both(k => {
    at(head, sph(.011, INK, null, 8, 6), .062, .127, k * .04, 0, 0, 0, [1.1, 1, .4]);
    at(head, sph(.0095, INK, null, 8, 6), .084, .143, k * .031);
    at(head, sph(.0032, '#ffffff', null, 6, 4), .089, .147, k * .036);
  });
  at(head, cone(.011, .027, SP.beak, null, 8), .109, .134, 0, 0, 0, -HP);
  const rest = { body: body.rotation.z, tail: tail.rotation.z };
  const L = .95 + .55 * hh(seed, 1), off = hh(seed, 2) * 20, range = o.turn ?? .7;
  // 지난 칸들 가운데 마지막으로 그 동작을 한 칸 (없으면 null)
  const act = k => { const r = hh(seed, k * 3.1); return r < .26 ? 'look' : r < .42 ? 'tilt' : r < .58 ? 'peck' : r < .72 ? 'tail' : r < .82 ? 'hop' : 'rest'; };
  const last = (k, a) => { for (let j = k - 1; j > k - 9; j--) if (act(j) === a) return j; return null; };
  const yawOf = j => (j == null ? 0 : (hh(seed, j * 5.3) - .5) * 1.3);
  const turnOf = j => (j == null ? 0 : (hh(seed, j * 7.7) - .5) * range);
  const pose = T => {
    const tt = T + off, k = Math.floor(tt / L), ts = tt - k * L, a = act(k);
    let yaw = yawOf(last(k, 'look')), turn = turnOf(last(k, 'hop')), roll = 0, lean = 0, nod = 0, flick = 0, up = 0, squash = 1;
    if (a === 'look') yaw = lerp(yaw, yawOf(k), sm(ts / .12));
    if (a === 'tilt') roll = (hh(seed, k * 2.3) < .5 ? -1 : 1) * .45 * hold(ts, .05, .75, .1);
    if (a === 'peck') { const p = bump(ts, .04, .24) + bump(ts, .3, .5) + (hh(seed, k) < .4 ? bump(ts, .56, .74) : 0); lean = -.55 * p; nod = -.5 * p; yaw *= .4; }
    if (a === 'tail') flick = .5 * (bump(ts, .02, .14) + bump(ts, .18, .3));
    if (a === 'hop') {
      turn = lerp(turn, turnOf(k), sm((ts - .07) / .24));
      up = .045 * bump(ts, .07, .31); squash = 1 - .12 * bump(ts, 0, .1) - .1 * bump(ts, .27, .4);
      flick = .25 * bump(ts, .07, .31);
    }
    root.rotation.y = ry + turn;
    hop.position.y = up; hop.scale.set(1, squash, 1);
    body.rotation.z = rest.body + lean;
    head.rotation.set(roll, yaw, nod);
    tail.rotation.z = rest.tail + flick;
  };
  pose(0);
  drive(f, { root, pose });
  return root;
}

// ── 비둘기 (도시 비둘기): 회청색 몸, 날개에 짙은 줄 둘, 초록·보라 무지갯빛 목, 흰 콧등, 주황 눈, 분홍 발 ─────────────────────────
const PG = {
  grey: { body: '#a7afc9', breast: '#b3bad3', belly: '#bfc5dc', head: '#9aa2c4', wing: '#9ba3c3', bar: '#555b80', tip: '#6f7698', tail: '#8e96b8' },
  dark: { body: '#8d94b0', breast: '#9aa0bb', belly: '#a6abc4', head: '#7f86a6', wing: '#858ca9', bar: '#43486a', tip: '#5d6384', tail: '#7a809f' },
  pied: { body: '#e7e8ef', breast: '#eceef4', belly: '#f4f5f9', head: '#a7afc9', wing: '#dcdee8', bar: '#8e96b8', tip: '#a7afc9', tail: '#cfd2df' },
};
export function addPigeon(f, x, y, z, ry = 0, o = {}) {
  const s = o.s ?? 1, seed = o.seed ?? (x * 11.3 + z * 5.9), C = PG[o.tone] || PG.grey, range = o.range ?? .12;
  const root = grp(); put(root, x, y, z, 0, ry, 0, s); root.userData.o = [0, 0, 0]; f.add(root); (f.live ||= []).push(root);
  const walker = pivotGroup(root, [0, 0, 0], f);
  const sh = blobShadow(.085, .22); sh.position.y = .004; sh.layers.set(2); sh.userData.noOcclude = true; walker.add(sh);
  const feet = [1, -1].map(k => {
    const g = pivotGroup(walker, [.004, .06, k * .026], f);
    at(g, cyl(.0085, .0085, .055, '#ff8fa8', null, 8), .004, .032, k * .026);
    for (const a of [-.4, 0, .4]) at(g, cap(.0055, .024, '#ff8fa8'), .024, .006, k * .026 + Math.sin(a) * .016, 0, a, -HP);
    at(g, cap(.0055, .016, '#ff8fa8'), -.012, .006, k * .026, 0, 0, HP);
    return g;
  });
  const body = pivotGroup(walker, [0, .07, 0], f);
  at(body, sph(.08, C.body, null, 18, 13), 0, .118, 0, 0, 0, .18, [1.5, 1.05, 1.1]);
  at(body, sph(.07, C.breast, null, 16, 12), .052, .122, 0, 0, 0, 0, [1, 1.05, 1.05]);
  at(body, sph(.062, C.belly, null, 14, 10), 0, .088, 0, 0, 0, 0, [1.3, .78, 1]);
  both(k => {
    at(body, sph(.07, C.wing, null, 16, 12), -.022, .128, k * .058, 0, 0, .22, [1.5, .64, .42]);
    for (const dx of [-.035, -.07]) at(body, sph(.05, C.bar, null, 10, 8), dx, .124 - dx * .15, k * .064, 0, 0, .55, [.22, .55, .5]);
    at(body, sph(.05, C.tip, null, 12, 9), -.122, .132, k * .036, 0, k * .15, .3, [1.45, .42, .5]);
  });
  // 무지갯빛 목: 초록 바탕에 보라 얼룩
  at(body, sph(.054, '#7fcbb0', null, 16, 12), .078, .168, 0, 0, 0, -.2, [1, 1.05, 1]);
  both(k => {
    at(body, sph(.034, '#b08fd8', null, 12, 9), .086, .158, k * .032, 0, 0, 0, [1.1, 1.2, .62]);
    at(body, sph(.02, '#9fe0c6', null, 10, 8), .1, .178, k * .03, 0, 0, 0, [1, 1, .5]);
  });
  const tail = pivotGroup(body, [-.1, .12, 0], f);
  at(tail, sph(.08, C.tail, null, 14, 8), -.165, .11, 0, 0, 0, .2, [1, .17, .58]);
  at(tail, sph(.05, C.bar, null, 12, 8), -.226, .098, 0, 0, 0, .2, [.42, .24, .86]);
  const head = pivotGroup(body, [.085, .18, 0], f);
  at(head, sph(.048, C.head, null, 16, 12), .108, .218, 0);
  both(k => {
    at(head, sph(.0145, '#ff9a3c', null, 10, 8), .124, .228, k * .034, 0, 0, 0, [1, 1, .5]);
    at(head, sph(.0075, INK, null, 8, 6), .128, .229, k * .04);
    at(head, sph(.0028, '#ffffff', null, 6, 4), .131, .232, k * .043);
  });
  at(head, sph(.012, '#f3f1f6', null, 10, 8), .146, .217, 0, 0, 0, 0, [1.2, .8, 1]);
  at(head, cone(.0105, .036, '#5a5370', null, 8), .166, .207, 0, 0, 0, -HP - .15);
  const rest = { body: body.rotation.z, tail: tail.rotation.z };
  const L = 1.3 + .6 * hh(seed, 1), off = hh(seed, 2) * 30;
  const act = k => { const r = hh(seed, k * 3.7); return r < .3 ? 'walk' : r < .52 ? 'peck' : r < .7 ? 'look' : r < .78 ? 'puff' : 'rest'; };
  const last = (k, a) => { for (let j = k - 1; j > k - 9; j--) if (act(j) === a) return j; return null; };
  const posOf = j => (j == null ? 0 : (hh(seed, j * 6.1) - .5) * 2 * range);
  const yawOf = j => (j == null ? 0 : (hh(seed, j * 5.3) - .5) * 1.1);
  const pose = T => {
    const tt = T + off, k = Math.floor(tt / L), ts = tt - k * L, a = act(k);
    const jw = last(k, 'walk'), pw = last(jw ?? k, 'walk');
    let px = posOf(jw), face = jw == null ? 0 : (posOf(jw) < posOf(pw) ? PI : 0);
    let yaw = yawOf(last(k, 'look')), lean = 0, nod = 0, thrust = 0, puff = 1, fan = 0;
    const lift = [0, 0];
    if (a === 'walk') {
      const to = posOf(k), dirFace = to < px ? PI : 0, D = Math.abs(to - px), dur = Math.min(L - .25, Math.max(.35, D / .22));
      const turnK = sm(ts / .18);
      face = face === dirFace ? face : lerp(face, dirFace, turnK);
      const u = Math.min(1, Math.max(0, (ts - .14) / dur));
      px = lerp(px, to, u);
      if (u > 0 && u < 1) {
        const ph = (ts - .14) * 7.5;
        lift[0] = Math.max(0, Math.sin(ph * PI)) * .016; lift[1] = Math.max(0, -Math.sin(ph * PI)) * .016;
        thrust = .022 * ((ph * .5) % 1 < .35 ? sm(((ph * .5) % 1) / .35) : 1 - sm((((ph * .5) % 1) - .35) / .65));
      }
      yaw = 0;
    }
    if (a === 'peck') { const p = bump(ts, .05, .3) + bump(ts, .36, .6) + (hh(seed, k) < .5 ? bump(ts, .66, .9) : 0); lean = -.5 * p; nod = -.6 * p; yaw *= .3; }
    if (a === 'look') yaw = lerp(yaw, yawOf(k), sm(ts / .16));
    if (a === 'puff') { const p = hold(ts, .05, .9, .2); puff = 1 + .09 * p; fan = .18 * p; nod = .15 * p; }
    walker.position.x = px;
    walker.rotation.y = face;
    for (let i = 0; i < 2; i++) feet[i].position.y = lift[i];
    body.rotation.z = rest.body + lean; body.scale.set(1, puff, puff);
    head.position.x = .085 + thrust; head.rotation.set(0, yaw, nod);
    tail.rotation.z = rest.tail + fan * .4; tail.scale.z = 1 + fan;
  };
  pose(0);
  drive(f, { root, pose });
  return root;
}
