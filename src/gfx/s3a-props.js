// 3판 A안 「개굴이의 낚시터」 레벨업 (fishing3, 10/24): 정본 3판의 구도·배치·연못·나무·울타리는 그대로, 모델·텍스처·빛만 새로.
// 조각마다 정본 조각의 숨김 자리(이름·종류·위치)와 부품(이름·움직임)을 그대로 지켜요 — 판 표·장치(릴)·찾을 물건 수가 같게.
// 판에서는 정본 종류 이름 그대로 두고 그림만 바꿔 끼움: F('pond', 2, 2, 0, { gptHero: 's3a_pond' }) (furniture.js makeFurniture).
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { clothBend } from './clothbend.js';
import { G, mc, mt, TX, PI, HP, mix, pondTex, texMat, paintTex, stone, lily, lotus, cattails, daisy, tuft, crown, butterfly, dragonfly, scenery } from './s3-kit.js';

const B = {};
const WOOD = '#e6b47a', WOODD = '#b98552', WOODL = '#f2cf9c';
const roundRectPath = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

// ── 연못 (3×3): 맑은 물판(깊이 그러데이션·물고기 그림자·비단잉어·잔물결), 매끈한 따뜻한 회색 돌 테, 이끼·작은 꽃, 연잎 셋·연꽃 ──────
// a lily pad with its notch, a paler heart and fine curved veins, a dewdrop or two (the pond's own: veins drawn as thin tubes)
function lilyV(add, tube, x, z, r, rot, y = .036, c1 = '#58ad5c', c2 = '#7cc86c', drops = 1) {
  lily(add, x, z, r, rot, y, c1, c2);
  const vc = mix(c2, '#ffffff', .35);
  for (let k = 0; k < 8; k++) { const a = rot + .5 + k * (PI * 2 - .75) / 7, bend = .16 * (k % 2 ? 1 : -1);
    const pts = [.14, .5, .9].map(t => { const aa = a + bend * t * t; return [x + Math.cos(aa) * r * t, y + .026, z - Math.sin(aa) * r * t]; });
    tube(pts[0], pts[1], .0042, vc, 3); tube(pts[1], pts[2], .0032, vc, 3); }
  for (let k = 0; k < drops; k++) { const a = rot + 1.4 + k * 2.2, px = x + Math.cos(a) * r * .45, pz = z - Math.sin(a) * r * .45; add(G.sph(.02, 10, 8), '#dff6ff', px, y + .032, pz, 0, 0, 0, [1, .65, 1]); add(G.sph(.007, 6, 4), '#ffffff', px - .007, y + .043, pz - .005); }
}
// a koi seen from above, lying just under the surface (flat, no outline) — body, tail, two fins and its patches
const KOI = { orange: ['#ff8a4c', '#ffffff'], white: ['#ffffff', '#ff6a5a'], gold: ['#ffc85a', '#fff3d6'] };
function koiMesh(kind) {
  const [c1, c2] = KOI[kind];
  return mc('s3a-koi|' + kind, ({ add }) => {
    add(G.sph(.085, 14, 8), c1, 0, 0, 0, 0, 0, 0, [1, .28, .42]);
    add(G.sph(.05, 12, 6), c1, -.1, 0, 0, 0, 0, 0, [.9, .2, .3]);
    const tail = new THREE.Shape(); tail.moveTo(0, 0); tail.quadraticCurveTo(-.05, .05, -.09, .06); tail.quadraticCurveTo(-.07, 0, -.09, -.06); tail.quadraticCurveTo(-.05, -.05, 0, 0);
    const tg = G.ext(tail, .006, 0, 8); tg.rotateX(-HP); add(tg, mix(c1, '#ffffff', .25), -.13, -.003, 0);
    for (const sz of [-1, 1]) add(G.sph(.03, 8, 5), mix(c1, '#ffffff', .3), .02, -.004, sz * .04, 0, sz * .7, 0, [1.2, .15, .55]);
    add(G.sph(.034, 10, 6), c2, .02, .014, .006, 0, 0, 0, [1.2, .3, .8]); add(G.sph(.026, 10, 6), c2, -.06, .012, -.008, 0, 0, 0, [1, .3, .8]);
    for (const sz of [-1, 1]) add(G.sph(.009, 6, 4), '#2a1d33', .072, .016, sz * .022);
  });
}
B.s3a_pond = f => {
  const R = 1.32;
  f.add(mc('s3a-pond-bed', ({ add }) => {
    add(G.cyl(R + .02, R + .04, .024, 48), '#9fd9d3', 0, .01, 0);
  }));
  const water = new THREE.Mesh(new THREE.CircleGeometry(R - .02, 72), texMat(pondTex('a-vivid2', { deep: '#3aaedb', mid: '#5ec9ea', shallow: '#8edcf2', edge: '#b9eaf3', koi: false, fish: [[.6, .66, -1.1, 1.0]] })));
  water.rotation.x = -HP; water.position.y = .03; water.receiveShadow = true; f.add(water);
  // the stone ring: plump lavender-grey stones with a soft speckle (stone texture), a smaller one tucked between pairs
  // (10/24 사용자 "원래 3판이 더 싱그러워": 정본 3판처럼 통통한 연보라 회색 돌 — 크고 둥글게, 두세 톤)
  const LAV = ['#d4cce4', '#c3b9d9', '#ddd7ea', '#b6acca'];
  f.add(mt('s3a-pond-rim', TX.stone(), ({ add }) => {
    for (let k = 0; k < 20; k++) {
      const a = k / 20 * PI * 2 + (k % 3) * .05, s = .17 + (k * 37 % 5) * .018, rr = R + .05 + (k % 2) * .05;
      stone(add, Math.cos(a) * rr, Math.sin(a) * rr, s, k + 2, LAV[k % 4], 0, .62, a);
      if (k % 2) { const b = a + PI / 20, r2 = R + .17; stone(add, Math.cos(b) * r2, Math.sin(b) * r2, .1, k + 7, LAV[(k + 1) % 4], 0, .6, b); }
    }
  }));
  f.add(mc('s3a-pond-life', ({ add, tube }) => {
    // soft moss on a few stones' tops, moss and grass between the stones, small flowers
    for (const k of [1, 4, 7, 9, 12, 15, 18]) { const a = k / 20 * PI * 2 + (k % 3) * .05, rr = R + .05 + (k % 2) * .05, s = .17 + (k * 37 % 5) * .018;
      for (let q = 0; q < 3; q++) add(G.sph(.045 - q * .008, 8, 5), q % 2 ? '#7fbf5e' : '#6aae58', Math.cos(a + q * .05) * (rr + .04) , s * .62 * .9 + .005, Math.sin(a + q * .05) * (rr + .04), 0, a, 0, [1.4, .35, 1]); }
    for (const a of [.3, 1.2, 2.05, 2.9, 3.7, 4.6, 5.5]) tuft(add, Math.cos(a) * (R + .3), Math.sin(a) * (R + .3), .9, '#5fae5a', '#86c96a');
    for (const [a, c] of [[.75, '#ffffff'], [2.45, '#ffffff'], [4.1, '#ffe14d'], [5.05, '#ffffff']]) daisy(add, Math.cos(a) * (R + .32), Math.sin(a) * (R + .32), 1, c, c === '#ffffff' ? '#ffcf3a' : '#ffb300');
    // a lotus on its own little pad, a closed bud, a tiny lone pad
    lilyV(add, tube, -.5, .35, .16, 2.6, .036, '#58ad5c', '#7cc86c', 0); lotus(add, -.5, .35, 1, .06);
    tube([-.2, .03, .1], [-.19, .22, .11], .007, '#5fae5a', 5); add(G.sph(.035, 10, 8), '#ffb6cc', -.19, .25, .11, 0, 0, 0, [.8, 1.4, .8]);
    lilyV(add, tube, .15, .78, .09, 1.1, .034, '#5fb45e', '#84cc70', 0);
  }));
  const pad = (x, z, r, rot) => {
    put(f.add(mc('s3a-lilyv|' + r + '|' + rot, ({ add, tube }) => lilyV(add, tube, 0, 0, r, rot, .036))), x, 0, z);
    f.spot('on', null, x, .065, z, { maxH: .28, label: '연잎 위', scale: .7 });
  };
  pad(.45, -.4, .25, .4); pad(-.35, -.55, .21, 2.1); pad(.7, .45, .23, 4.4);
  f.spot('behind', null, -1.15, 0, -.55, { maxH: .25, label: '연못가 돌 뒤', scale: .7 });
  // three koi circling slowly just under the surface, now and then a ring where one comes up (no outline, never in the way of a tap)
  const fish = [['orange', .78, .0, .16], ['white', .55, 2.1, -.12], ['gold', .95, 4.2, .1]].map(([k, rr, ph, sp]) => { const m = scenery(koiMesh(k)); m.renderOrder = 1; f.add(m); return { m, rr, ph, sp }; });
  const ring = scenery(new THREE.Mesh(new THREE.RingGeometry(.86, 1, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false })));
  ring.rotation.x = -HP; ring.renderOrder = 2; ring.visible = false; f.add(ring);
  const place = t => {
    for (const q of fish) { const a = q.ph + t * q.sp, r = q.rr * (1 + .08 * Math.sin(t * .3 + q.ph)), x = Math.cos(a) * r, z = Math.sin(a) * r * .9;
      q.m.position.set(x, .038, z); q.m.rotation.y = -a - Math.sign(q.sp) * HP + Math.sin(t * 3 + q.ph) * .12; }
    const k = (t % 5.5) / 1.2; if (k < 1) { const q = fish[Math.floor(t / 5.5) % 3]; if (!ring.visible) ring.position.set(q.m.position.x, .04, q.m.position.z); ring.visible = true; ring.scale.setScalar(.04 + k * .16); } else ring.visible = false;
  };
  place(0);
  f.tick = place;
};

// ── 낚시 좌대 (2×1): 결 있는 판자 데크·기둥, 대나무 낚싯대, 노란 릴, 둥근 나무 의자(민트 방석), 작은 깡통, 감아 둔 밧줄 ─────────────
B.s3a_fishdock = f => {
  const D = .9, Y = .28;
  f.add(mt('s3a-dock-planks', TX.plank(), ({ add }) => {
    for (let k = 0; k < 9; k++) { const x = -.84 + k * .21; add(G.box(.2, .055, D, .014), k % 3 === 1 ? WOODL : k % 3 === 2 ? shade(WOOD, -.04) : WOOD, x, Y + .01, 0, 0, 0, 0, 1, { w: .45 }); }
  }));
  f.add(mc('s3a-dock-frame', ({ add, tube }) => {
    add(G.box(1.94, .05, .07, .015), WOODD, 0, Y - .03, D / 2 - .03); add(G.box(1.94, .05, .07, .015), WOODD, 0, Y - .03, -D / 2 + .03);
    // posts: flush under the deck at the back, two mooring posts with a rope round them on the water side
    for (const sx of [-1, 1]) { add(G.cyl(.055, .06, Y, 12), WOODD, sx * .86, Y / 2 - .02, -(D / 2 - .07)); add(G.cyl(.06, .066, Y + .26, 12), WOODD, sx * .88, (Y + .26) / 2 - .02, D / 2 - .05);
      add(G.sph(.062, 12, 8), shade(WOODD, .1), sx * .88, Y + .24, D / 2 - .05, 0, 0, 0, [1, .55, 1]); for (const y of [Y + .1, Y + .14]) add(G.tor(.066, .016, PI * 2, 6, 16), '#efe0c0', sx * .88, y, D / 2 - .05, HP, 0, 0); }
    // a step up from the lawn at the back
    add(G.box(.6, .12, .2, .02), WOODD, -.3, .06, -D / 2 - .1);
    // the rod holder post, a coiled rope at the corner, the tin
    add(G.cyl(.042, .046, .46, 12), WOODD, .55, Y + .22, .2);
    for (let k = 0; k < 4; k++) add(G.tor(.075 - k * .012, .016, PI * 2, 6, 18), '#e9d8b6', .82, Y + .045 + k * .012, -.3, HP, 0, 0);
    add(G.cyl(.075, .075, .085, 16), '#e9edf2', -.02, Y + .075, .25); add(G.cyl(.077, .077, .02, 16), '#6fb6e6', -.02, Y + .1, .25);
    add(G.cyl(.062, .062, .01, 14), '#a8805a', -.02, Y + .112, .25); for (const [x, z] of [[-.04, .23], [.0, .27], [-.01, .22]]) add(G.cap(.008, .03, 2, 5), '#ff9ab0', x, Y + .122, z, HP, x * 20, 0);
    // nail heads at every plank's ends, a striped towel folded at the corner
    for (let k = 0; k < 9; k++) for (const sz of [-1, 1]) add(G.sph(.008, 6, 4), '#7a5a3e', -.84 + k * .21, Y + .04, sz * (D / 2 - .07));
    add(G.box(.22, .03, .16, .01), '#ffffff', .8, Y + .052, .28); for (const x of [.73, .8, .87]) add(G.box(.025, .031, .16, .004), '#7fc6ef', x, Y + .053, .28);
    // the round stool with a mint cushion
    add(G.cyl(.15, .15, .05, 18), WOODL, -.45, Y + .2, -.1);
    for (const a of [0, 2.09, 4.19]) tube([-.45 + Math.cos(a) * .11, Y + .02, -.1 + Math.sin(a) * .11], [-.45 + Math.cos(a) * .08, Y + .2, -.1 + Math.sin(a) * .08], .018, WOODD, 6);
    add(G.cyl(.145, .15, .05, 18), '#8fdcc4', -.45, Y + .25, -.1); add(G.sph(.02, 8, 6), '#ffffff', -.45, Y + .278, -.1);
    // the bamboo rod: pale segments with nodes, a red float on the tip
    const A = [.55, Y + .4, .2], Bq = [.75, Y + 1.25, 1.25];
    for (let k = 0; k < 5; k++) { const t0 = k / 5, t1 = (k + 1) / 5, p0 = A.map((v, i) => v + (Bq[i] - v) * t0), p1 = A.map((v, i) => v + (Bq[i] - v) * t1); tube(p0, p1, .016 - k * .002, k % 2 ? '#e9d48a' : '#dcc472', 6); }
    for (let k = 1; k < 5; k++) { const p = A.map((v, i) => v + (Bq[i] - v) * k / 5); add(G.sph(.019 - k * .002, 8, 6), '#c9a95a', ...p); }
    // a cork grip at the butt, little line guides under the rod, the tip-top ring
    { const p0 = A.map((v, i) => v + (Bq[i] - v) * .03), p1 = A.map((v, i) => v + (Bq[i] - v) * .12); tube(p0, p1, .022, '#d9b48a', 8); }
    for (const t of [.3, .52, .72, .9]) { const p = A.map((v, i) => v + (Bq[i] - v) * t); add(G.tor(.014, .003, PI * 2, 4, 10), '#8a95a8', p[0], p[1] - .022, p[2], 0, 0, 0); }
    add(G.tor(.012, .004, PI * 2, 4, 10), '#8a95a8', .75, Y + 1.27, 1.27);
  }));
  // the reel on the holder: a part with the line and the keep-net (정본과 같은 자리·움직임)
  const reel = grp(); put(reel, .62, Y + .38, .2); f.add(reel);
  reel.add(mc('s3a-reel2', ({ add }) => {
    add(G.cyl(.075, .075, .055, 20), '#ffcf3c', 0, 0, 0, 0, 0, HP); add(G.cyl(.042, .042, .062, 16), '#ffffff', 0, 0, 0, 0, 0, HP);
    for (let k = 0; k < 3; k++) add(G.tor(.046 + k * .006, .004, PI * 2, 4, 18), '#f2f2f6', 0, 0, 0, 0, HP, 0);
    for (const sx of [-1, 1]) add(G.tor(.075, .007, PI * 2, 4, 22), '#e9b830', sx * .029, 0, 0, 0, HP, 0);
    add(G.box(.025, .11, .025, .008), '#5b6a8a', .04, -.05, 0); add(G.cap(.018, .03, 2, 6), '#ff6a6a', .07, -.11, 0, 0, 0, HP); add(G.sph(.016, 8, 6), '#c9cfdc', .04, 0, 0);
  }));
  const NET = { x: .75, z: 1.25 }, yLo = -.35, yHi = Y + .55;
  const net = grp(); put(net, NET.x, yLo, NET.z); f.add(net);
  net.add(mc('s3a-keepnet', ({ add, tube }) => {
    add(G.cyl(.2, .16, .04, 20), '#3f8f78', 0, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; tube([Math.cos(a) * .16, 0, Math.sin(a) * .16], [Math.cos(a) * .2, .26, Math.sin(a) * .2], .006, '#3f8f78', 4); }
    for (const y of [.09, .18]) add(G.tor(.18 + y * .08, .006, PI * 2, 4, 24), '#3f8f78', 0, y, 0, HP, 0, 0);
    add(G.tor(.2, .018, PI * 2, 6, 24), '#ffcf3c', 0, .26, 0, HP, 0, 0);
    for (const [x, z] of [[.2, 0], [-.2, 0], [0, .2], [0, -.2]]) tube([x, .26, z], [0, .55, 0], .004, '#f2f2f6', 3);
  }));
  // the float (찌) on the line just above the net: red top, white middle — it rides the line up as the net comes in
  net.add(mc('s3a-float', ({ add, tube }) => {
    add(G.sph(.034, 12, 9), '#ff4f5e', 0, .41, 0, 0, 0, 0, [1, 1.15, 1]); add(G.sph(.032, 12, 9), '#ffffff', 0, .38, 0, 0, 0, 0, [1, .9, 1]);
    tube([0, .43, 0], [0, .5, 0], .004, '#ff4f5e', 4); tube([0, .35, 0], [0, .31, 0], .004, '#ffffff', 4);
  }));
  // water running off the net as it comes up (shown only while it's out of the pond)
  const drips = grp(mc('s3a-drips', ({ add }) => { for (const [x, y, z, s2] of [[.12, -.06, .05, 1], [-.1, -.12, -.04, .8], [.03, -.2, .1, .9], [-.06, -.04, .12, .7], [.15, -.15, -.08, .6], [-.13, -.24, .02, .7]]) add(G.sph(.016 * s2, 8, 6), '#bfeaff', x, y, z, 0, 0, 0, [.8, 1.4, .8]); }));
  net.add(drips); drips.scale.setScalar(.001);
  // a ring opening on the water where the net breaks the surface
  const splash = grp(scenery(new THREE.Mesh(new THREE.RingGeometry(.8, 1, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .7, depthWrite: false }))));
  splash.children[0].rotation.x = -HP; put(splash, NET.x, .042, NET.z); splash.visible = false; f.add(splash);   // (not one of the part's pivots: the room's reach test would find it in the pond and stop the reel at a third)
  const line = grp(); put(line, NET.x, Y + 1.25, NET.z); f.add(line);
  line.add(mc('s3a-line', ({ add }) => add(G.cyl(.004, .004, 1, 4), '#f2f2f6', 0, -.5, 0)));
  const setLine = ny => { line.scale.y = Math.max(.05, Y + 1.25 - (ny + .55)); };
  setLine(yLo);
  // (손맛 10/24: 감기 시작에 줄이 팽팽해지며 찌가 살짝 잠겼다가 올라오고, 그물망이 물 밖으로 나오면 물이 뚝뚝, 물 위엔 둥근 물결)
  const p = f.part('lift', [net, reel, line], (t, bN, bR) => {
    const dip = t < .16 ? -.06 * Math.sin(t / .16 * PI) : 0, e = t < .16 ? 0 : (t - .16) / .84;
    net.position.y = bN.p.y + (yHi - yLo) * e * e * (3 - 2 * e) + dip; net.rotation.y = t * 1.2;
    reel.rotation.x = -t * PI * 8; setLine(net.position.y);
    drips.scale.setScalar(t > .55 ? Math.min(1, (t - .55) / .25) : .001);
    const sk = (t - .25) / .45; splash.visible = sk > 0 && sk < 1; if (splash.visible) splash.scale.setScalar(.05 + sk * .3);
  }, { label: '낚싯대 릴', sfx: 'swish', dur: 1.1 });
  f.spot('inside', net, 0, .05, 0, { part: p, maxH: .24, label: '물속 그물망', scale: .75 });
  f.spot('on', null, -.45, Y + .29, -.1, { maxH: .3, label: '좌대 의자 위', scale: .7 });
  f.spot('under', null, -.2, 0, -.3, { maxH: .2, label: '좌대 밑', scale: .7 });
};

// ── 나무 (1×1): 판의 얼굴 — 결 있는 줄기와 뿌리, 크고 폭신한 세 톤 잎 덩어리, 연분홍 꽃 몇 송이; 크림 새집(지붕이 들림), 밑동 구멍 ──────
B.s3a_tree = (f, T, o = {}) => {
  if (o.vivid) f.collideBox = [-.3, 0, -.3, .3, 1.6, .3];   // (A: just the trunk — the big crown's box stopped the tackle box's lid at a third)
  f.add(mt('s3a-tree-trunk', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.15, .22, 1.55, 16), '#a8734a', 0, .77, 0, 0, 0, .03, 1, .25);
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + .5; tube([Math.sin(a) * .1, .26, Math.cos(a) * .1], [Math.sin(a) * .36, .02, Math.cos(a) * .36], .085, '#9c6a43', 10, .035); }
    tube([.02, 1.3, 0], [-.42, 1.82, .1], .085, '#a8734a', 10, .05); tube([.02, 1.35, 0], [.38, 1.9, -.12], .08, '#a8734a', 10, .05); tube([0, 1.45, 0], [.05, 2.0, .3], .07, '#a8734a', 10, .045);
  }));
  f.add(mc('s3a-tree-hollow', ({ add }) => { add(G.sph(.12, 14, 10), '#3d2a2a', 0, .14, .17, 0, 0, 0, [1, 1.3, .4]); add(G.tor(.12, .025, PI * 2, 6, 18), '#8a5a38', 0, .14, .175, 0, 0, 0, [1, 1.3, 1]); }));
  f.spot('behind', null, 0, 0, .33, { maxH: .25, label: '나무 밑동', scale: .7 });
  if (o.vivid) f.add(mt('s3a-tree-crown-v', TX.leaf(), ({ add }) => crown(add, 0, 2.08, 0, .74, '#6fc46a', '#54ab5c', '#a2dc80', 5, { n: 16, c: ['#ffd1df', '#ffffff', '#ffc1d4'] })));
  else f.add(mc('s3a-tree-crown', ({ add }) => crown(add, 0, 2.08, 0, .74, '#6fc46a', '#54ab5c', '#a2dc80', 5, { n: 16, c: ['#ffd1df', '#ffffff', '#ffc1d4'] })));
  if (o.vivid) f.add(mc('s3a-tree-foot', ({ add }) => {
    for (const [x, z, s2, c] of [[.3, -.18, 1, '#ff7a6a'], [.36, -.05, .7, '#fff1e0']]) { add(G.cyl(.016 * s2, .02 * s2, .07 * s2, 8), '#fff6e6', x, .035 * s2, z); add(G.sph(.045 * s2, 12, 8, ), c, x, .075 * s2, z, 0, 0, 0, [1, .6, 1]); if (c !== '#fff1e0') for (const [dx, dz] of [[.015, .01], [-.012, .016], [0, -.018]]) add(G.sph(.008, 6, 4), '#ffffff', x + dx * s2, .1 * s2, z + dz * s2); }
  }));
  // the birdhouse: cream walls, an open front (low lip + header) so what sits inside shows once the roof is up, a perch
  const hx = 0, hy = .66, hz = .27;
  f.add(mc('s3a-birdhouse', ({ add }) => {
    add(G.box(.22, .025, .2, .006), '#fff3dc', hx, hy - .1, hz);
    add(G.box(.22, .22, .025, .006), '#fff3dc', hx, hy, hz - .09);
    for (const sx of [-1, 1]) add(G.box(.025, .22, .2, .006), '#fff3dc', hx + sx * .1, hy, hz);
    add(G.box(.22, .05, .025, .006), '#fff3dc', hx, hy - .075, hz + .09); add(G.box(.22, .045, .025, .006), '#fff3dc', hx, hy + .085, hz + .09);
    add(G.cyl(.011, .011, .08, 6), '#a8734a', hx, hy - .07, hz + .13, HP);
    add(G.box(.06, .3, .03, .008), '#a8734a', hx, hy - .2, hz - .12);
    add(G.sph(.016, 8, 6), '#7fc8a8', hx - .07, hy + .085, hz + .105); add(G.sph(.016, 8, 6), '#ffb6c8', hx + .07, hy + .085, hz + .105);
  }));
  const roof = grp(mc('s3a-bh-roof' + (o.vivid ? '-v' : ''), ({ add }) => { add(G.box(.16, .028, .26, .01), '#ff8a7a', -.06, .03, 0, 0, 0, .62); add(G.box(.16, .028, .26, .01), '#ff8a7a', .06, .03, 0, 0, 0, -.62); add(G.sph(.022, 8, 6), '#ffffff', 0, .085, 0);
    // (A) rows of little shingles on both slopes
    if (o.vivid) for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) add(G.box(.05, .012, .06, .004), shade('#ff8a7a', (r + q) % 2 ? .06 : -.05), sx * (.03 + r * .043), .052 - r * .027, -.09 + q * .06, 0, 0, -sx * .62);
  }));
  put(roof, hx, hy + .11, hz); f.add(roof);
  const p = f.part('lift', roof, (t, b) => { roof.position.y = b.p.y + .2 * t; roof.position.x = b.p.x + .12 * t; roof.rotation.z = -.5 * t; }, { label: '새집 지붕', sfx: 'lift' });
  f.spot('inside', null, hx, hy - .08, hz, { part: p, maxH: .18, label: '새집 안', scale: .55 });
  f.spot('behind', null, 0, 0, -.34, { maxH: .45, label: '나무 뒤', scale: .85 });
};

// ── 벤치 (2×1): 꿀색 판자 등받이, 청록 무쇠 다리(동그란 팔걸이), 신문지(들림), 끝에 앉은 참새 ─────────────────────────────
const newsTex = () => paintTex('s3a-news', 256, 192, (c, w, h) => {
  c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#4a5a7a'; c.fillRect(14, 12, w - 28, 22);
  c.fillStyle = '#c9cfdc'; for (let y = 46; y < h - 10; y += 12) { c.fillRect(14, y, 104, 6); c.fillRect(136, y, 106, 6); }
  c.fillStyle = '#9fd0e8'; c.fillRect(136, 46, 106, 54);
});
B.s3a_bench = (f, T, o = {}) => {
  const sy = .42;
  f.add(mc('s3a-bench-iron', ({ add, tube }) => {
    for (const sx of [-1, 1]) {
      const x = sx * .78, c = '#3e8f7c';
      tube([x, 0, .16], [x, sy, .14], .032, c); tube([x, 0, -.18], [x, sy, -.16], .032, c); tube([x, sy, -.16], [x, .9, -.29], .03, c);
      tube([x, sy - .03, .19], [x, sy - .03, -.2], .03, c);
      add(G.tor(.1, .028, PI * 1.3, 6, 16), c, x, sy + .14, .1, 0, HP, .3);
      add(G.sph(.04, 10, 8), c, x, sy + .14, .22); add(G.cyl(.05, .05, .03, 10), shade(c, -.15), x, .015, .16); add(G.cyl(.05, .05, .03, 10), shade(c, -.15), x, .015, -.18);
    }
  }));
  f.add(mt('s3a-bench-slats', TX.plank(), ({ add }) => {
    for (const [z, c] of [[.13, WOODL], [0, WOOD], [-.13, WOODL]]) add(G.box(1.82, .05, .11, .02), c, 0, sy + .02, z, 0, 0, 0, 1, { w: .8 });
    for (const [y, z] of [[.6, -.215], [.77, -.255]]) add(G.box(1.82, .11, .04, .02), WOOD, 0, y, z, -.22, 0, 0, 1, { w: .8 });
  }));
  if (o.vivid) f.add(mc('s3a-bench-bolts', ({ add, tube }) => {
    for (const sx of [-1, 1]) { for (const z of [.13, 0, -.13]) add(G.sph(.011, 6, 4), '#3e5a50', sx * .78, sy + .047, z); for (const y of [.62, .77]) add(G.sph(.011, 6, 4), '#3e5a50', sx * .78, y + .04, -.2 - (y - .6) * .25); }
    tube([-.78, .12, -.01], [.78, .12, -.01], .016, '#3e8f7c', 6);
  }));
  const np = grp(put(new THREE.Mesh(new THREE.BoxGeometry(.44, .022, .3), texMat(newsTex())), 0, 0, 0)); put(np, .45, sy + .056, 0, 0, .22, 0); f.add(np);
  const p = f.part('lift', np, (t, b) => { np.position.y = b.p.y + .3 * t; np.rotation.x = -.38 * t; np.rotation.z = .15 * t; }, { label: '신문지', sfx: 'swish' });
  f.spot('inside', null, .45, sy + .045, 0, { part: p, maxH: .3, label: '신문지 밑', scale: .82 });
  f.spot('on', null, -.42, sy + .045, 0, { maxH: .45, label: '벤치 위', scale: .85 });
  f.spot('under', null, 0, 0, -.02, { maxH: .35, label: '벤치 밑', scale: .85 });
  // a sparrow on the backrest's end
  f.add(mc('s3a-sparrow', ({ add }) => {
    add(G.sph(.075, 12, 9), '#c99a74', 0, 0, 0, 0, 0, .1, [1.25, .95, .95]); add(G.sph(.055, 12, 9), '#f4e8d8', .02, -.02, .03, 0, 0, 0, [1.1, .8, .8]);
    add(G.sph(.05, 12, 9), '#c99a74', .085, .06, 0); add(G.sph(.03, 8, 6), '#ffffff', .1, .05, .03, 0, 0, 0, [1, .9, .5]);
    add(G.cone(.016, .035, 6), '#ffb84a', .14, .055, 0, 0, 0, -HP); add(G.sph(.009, 6, 5), '#2a1d33', .105, .075, .035);
    add(G.box(.08, .018, .05, .008), '#8a6448', -.1, .01, 0, 0, 0, .35);
  }));
  f.group.children.at(-1).position.set(-.62, .9, -.3);
};

// ── 낚시터 간판 (1×1): 크림 판에 그린 물고기와 물결, 작은 박공 지붕, 판자 다리 ──────────────────────────────────────
const signTex = () => paintTex('s3a-sign', 512, 272, (c, w, h) => {
  c.fillStyle = '#fff6e4'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#e9d6b4'; c.lineWidth = 3; for (let y = 60; y < h; y += 68) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.lineCap = 'round'; c.lineWidth = 10; c.strokeStyle = '#8fd3ea';
  for (const y of [208, 236]) { c.beginPath(); for (let x = 40; x <= w - 40; x += 6) { const yy = y + Math.sin(x / 26 + y) * 7; x === 40 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  c.fillStyle = '#4fb2db'; c.beginPath(); c.ellipse(240, 118, 108, 56, 0, 0, PI * 2); c.fill();
  c.beginPath(); c.moveTo(150, 118); c.lineTo(86, 66); c.quadraticCurveTo(106, 118, 86, 170); c.closePath(); c.fill();
  c.fillStyle = '#86d0ec'; c.beginPath(); c.ellipse(250, 136, 70, 24, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(302, 102, 15, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.beginPath(); c.arc(306, 102, 8, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = 5; c.beginPath(); c.arc(318, 132, 12, .2, 1.4); c.stroke();
  c.fillStyle = '#ffd84a'; for (const [x, y, s] of [[400, 70, 14], [430, 110, 9], [380, 150, 7]]) { c.beginPath(); c.arc(x, y, s, 0, PI * 2); c.fill(); }
});
B.s3a_fishsign = f => {
  f.add(mc('s3a-sign-frame', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.07, .98, .07, .02), WOODD, sx * .34, .49, -.05); add(G.cyl(.05, .06, .04, 10), shade(WOODD, -.1), sx * .34, .02, -.05); }
    add(G.box(.9, .5, .05, .025), WOOD, 0, .78, -.03);
    add(G.box(.52, .03, .24, .01), '#ff8a7a', -.23, 1.1, -.03, 0, 0, .42); add(G.box(.52, .03, .24, .01), '#ff8a7a', .23, 1.1, -.03, 0, 0, -.42);
    add(G.sph(.035, 10, 8), '#ffffff', 0, 1.22, -.03);
    tuft(add, .3, .08, .9); tuft(add, -.36, .1, .8); daisy(add, .22, .14, .9);
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.82, .43), texMat(signTex())); board.position.set(0, .78, -.003); f.add(board);
  f.spot('behind', null, 0, 0, -.25, { maxH: .3, label: '간판 뒤', scale: .7 });
  f.spot('on', null, 0, 1.04, -.02, { maxH: .2, label: '간판 위', scale: .55 });
};

// ── 낚시 도구함 (1×1): 민트 두 단 상자, 크림 띠, 놋쇠 걸쇠·손잡이; 뚜껑 안 칸칸이 찌·루어 ────────────────────────────────
B.s3a_tacklebox = (f, T, o = {}) => {
  const C = o.vivid ? '#3fae86' : '#4fbf9c', vk = o.vivid ? '-v' : '';
  f.add(mc('s3a-tackle' + vk, ({ add, tube }) => {
    add(G.box(.62, .26, .38, .035), C, 0, .13, 0);
    add(G.box(.64, .05, .4, .015), '#fff2d6', 0, .19, 0);
    for (const sx of [-1, 1]) add(G.box(.07, .06, .025, .01), '#e9b84a', sx * .2, .19, .205);
    add(G.box(.5, .02, .3, .006), shade(C, -.3), 0, .255, 0);
    for (const [x, c] of [[-.2, '#ff6a6a'], [-.07, '#ffd84a'], [.06, '#7fb8ff'], [.19, '#ff9ec2']]) { add(G.cap(.024, .07, 2, 6), c, x, .265, .03, 0, 0, HP); add(G.sph(.016, 6, 5), '#ffffff', x + .05, .265, .03); }
    for (const x of [-.135, 0, .135]) add(G.box(.01, .03, .28, .003), '#e8f6f0', x, .265, 0);
  }));
  const lid = grp(); put(lid, 0, .26, -.19); f.add(lid);
  lid.add(mc('s3a-tacklelid' + vk, ({ add, tube }) => {
    add(G.box(.62, .07, .38, .03), shade(C, .08), 0, .035, .19);
    tube([-.12, .07, .19], [-.1, .14, .19], .014, '#e9b84a', 6); tube([.12, .07, .19], [.1, .14, .19], .014, '#e9b84a', 6); tube([-.1, .14, .19], [.1, .14, .19], .016, '#e9b84a', 6);
  }));
  const p = f.part('lid', lid, (t, b) => { lid.rotation.x = -1.6 * t; }, { label: '도구함 뚜껑', sfx: 'open' });
  f.spot('inside', null, 0, .25, 0, { part: p, maxH: .14, label: '도구함 안', scale: .6 });
  f.spot('on', lid, 0, .06, .19, { maxH: .3, label: '도구함 위', scale: .7 });
};

// ── 미끼통 (1×1): 흰 법랑 양동이에 하늘색 테, 철사 손잡이, 안에 톱밥, 작은 뜰채 ─────────────────────────────────────────
B.s3a_baitbucket = (f, T, o = {}) => {
  const BK = o.vivid ? '#ff8a5a' : '#f6f8fb', RM = o.vivid ? '#ff6a3a' : '#5fb0e6';
  f.add(mc('s3a-baitbucket' + (o.vivid ? '-v' : ''), ({ add, tube }) => {
    add(G.cyl(.2, .16, .3, 22), BK, 0, .15, 0);
    add(G.tor(.2, .018, PI * 2, 6, 24), RM, 0, .3, 0, HP, 0, 0); add(G.cyl(.165, .165, .02, 22), RM, 0, .01, 0);
    add(G.cyl(.18, .18, .02, 20), '#d9b98a', 0, .27, 0);
    for (const [x, z] of [[-.06, .04], [.05, -.05], [.08, .07]]) add(G.sph(.02, 6, 5), '#c9a372', x, .282, z);
    tube([-.2, .3, 0], [-.12, .44, 0], .008, '#aab6c8', 4); tube([-.12, .44, 0], [.12, .44, 0], .008, '#aab6c8', 4); tube([.12, .44, 0], [.2, .3, 0], .008, '#aab6c8', 4);
    add(G.cyl(.02, .02, .07, 8), '#ffcf3c', 0, .44, 0, 0, 0, HP);
    // a little fishing scoop leaning on it
    tube([.24, .0, .1], [.33, .5, .1], .012, WOODD, 5); add(G.tor(.08, .01, PI * 2, 4, 16), '#5fb0e6', .34, .56, .1, .3, 0, .2);
  }));
  f.spot('inside', null, 0, .28, 0, { maxH: .2, label: '미끼통 안', scale: .6 });
  f.spot('behind', null, 0, 0, -.3, { maxH: .25, label: '미끼통 뒤', scale: .7 });
};

// ── 갈대 (1×1): 부들과 납작한 갈대 잎, 연보라 붓꽃 둘, 발치의 조약돌 ──────────────────────────────────────────────────
B.s3a_reeds = (f, T, o = {}) => {
  const seed = o.seed || 1;
  f.add(mc('s3a-reeds|' + seed + (o.vivid ? '-v' : ''), ({ add, tube }) => {
    cattails(add, tube, 0, 0, 1, seed, 12);
    for (const [x, z, h] of [[.18, .12, .42], [-.16, .16, .36]]) { add(G.cyl(.006, .007, h, 4), '#5fa45a', x, h / 2, z); for (let k = 0; k < 3; k++) { const a = k * 2.09; add(G.sph(.04, 8, 6), '#c4b2f2', x + Math.cos(a) * .03, h + .01, z + Math.sin(a) * .03, 0, -a, .9, [1.4, .45, .8]); } add(G.sph(.018, 6, 5), '#ffe27a', x, h + .03, z); }
    stone(add, .22, -.14, .08, 3); stone(add, -.2, -.1, .06, 5); stone(add, .05, .24, .07, 8);
    if (o.vivid && seed === 1) dragonfly(add, .05, .74, .02, .9, '#ff8a5a');
  }));
  f.spot('inside', null, 0, 0, .05, { maxH: .26, label: '갈대 속', scale: .7 });
};

// ── 파라솔 의자 (1×1): 산호·크림 여덟 폭 파라솔(물결 끝단), 흰 대, 하늘색 줄무늬 나무 비치 의자 ─────────────────────────────
const stripeTex = (a, b, n = 8) => paintTex('s3a-stripe|' + a + b + n, 128, 128, (c, w, h) => { for (let k = 0; k < n; k++) { c.fillStyle = k % 2 ? b : a; c.fillRect(k * w / n, 0, w / n + 1, h); } });
B.s3a_parasol = (f, T, o = {}) => {
  f.collideBox = [-.3, 0, -.2, .3, .8, .34];   // (the pole and the beach chair: the canopy's wide box held a neighbour's lid at a third — 10/24)
  const P1 = o.vivid ? '#ff6f80' : '#ff8f8a', P2 = o.vivid ? '#ffffff' : '#fff6ea';
  f.add(mc('s3a-parasol' + (o.vivid ? '-v' : ''), ({ add, tube }) => {
    tube([0, 0, -.1], [0, 1.5, -.1], .026, '#f6f2ea', 8);
    add(G.cyl(.09, .11, .04, 14), '#d9d2c9', 0, .02, -.1);
    for (let k = 0; k < 8; k++) {
      const c = k % 2 ? P2 : P1, g = new THREE.ConeGeometry(.78, .34, 4, 1, true, k * PI / 4, PI / 4); add(g, c, 0, 1.44, -.1);
      const a = k * PI / 4 + PI / 8; add(G.sph(.075, 10, 6), c, Math.sin(a) * .72, 1.27, -.1 + Math.cos(a) * .72, 0, a, 0, [1.4, .5, .5]);
    }
    add(G.cone(.79, .02, 8), '#ffd9d4', 0, 1.27, -.1, PI, 0, 0);
    add(G.sph(.045, 10, 8), P1, 0, 1.64, -.1);
    if (o.vivid) { for (let k = 0; k < 8; k++) { const a = k * PI / 4; tube([0, 1.12, -.1], [Math.sin(a) * .7, 1.28, -.1 + Math.cos(a) * .7], .007, '#e8e8f0', 4); }
      add(G.cyl(.04, .04, .05, 10), '#e8e8f0', 0, 1.12, -.1); add(G.cyl(.035, .035, .04, 10), '#c9cfe0', 0, .75, -.1);
      for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; add(G.sph(.014, 6, 4), k % 2 ? P1 : '#ffd84a', Math.sin(a) * .79, 1.22, -.1 + Math.cos(a) * .79); } }
    // the beach chair's wooden frame
    for (const sx of [-1, 1]) { tube([sx * .21, 0, .32], [sx * .21, .3, .02], .018, WOOD, 6); tube([sx * .21, 0, -.06], [sx * .21, .3, .3], .018, WOOD, 6); tube([sx * .21, .3, .3], [sx * .21, .72, -.12], .018, WOOD, 6); }
    tube([-.21, .72, -.12], [.21, .72, -.12], .016, WOOD, 6); tube([-.21, .3, .3], [.21, .3, .3], .016, WOOD, 6);
  }));
  const cloth = texMat(stripeTex('#7fc6ef', '#ffffff'));
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.42, .02, .34), cloth); seat.position.set(0, .3, .12); f.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(.42, .44, .02), cloth); back.position.set(0, .52, .0); back.rotation.x = -.42; f.add(back);
  f.spot('on', null, 0, .32, .12, { maxH: .3, label: '파라솔 의자 위', scale: .75 });
  f.spot('under', null, 0, 0, .12, { maxH: .22, label: '파라솔 의자 밑', scale: .7 });
};

// ── 아이스박스 (1×1): 하늘색 몸통에 흰 띠·흰 뚜껑, 회색 손잡이; 안은 흰 안감·얼음·캔 (자물쇠 가능) ────────────────────────────
B.s3a_cooler = (f, T, o = {}) => {
  const vk = o.vivid ? '-v' : '', body = o.vivid ? '#3f8cff' : '#5fbde6', W = .66, H = .4, D = .44, z0 = -.04, fz = z0 + D / 2;
  f.add(mc('s3a-cooler-body' + vk, ({ add }) => {
    const t = .04, r = .016;
    add(G.box(W, t, D, r), body, 0, t / 2, z0);
    add(G.box(W, H, t, r), body, 0, H / 2, z0 - D / 2 + t / 2); add(G.box(W, H, t, r), body, 0, H / 2, fz - t / 2);
    for (const sx of [-1, 1]) add(G.box(t, H, D, r), body, sx * (W / 2 - t / 2), H / 2, z0);
    add(G.box(W + .012, .06, D + .012, .012), '#ffffff', 0, .1, z0);
    for (const sx of [-1, 1]) { add(G.box(.05, .07, .2, .02), '#9aa6b8', sx * (W / 2 + .02), H - .1, z0); }
    if (o.vivid) { add(G.box(.24, .06, .012, .006), '#ffffff', -.12, .25, fz + .004); add(G.sph(.022, 8, 6), '#ffd84a', -.2, .25, fz + .012); add(G.box(.12, .015, .012, .003), '#ff6a6a', -.07, .25, fz + .012);
      add(G.cyl(.022, .022, .02, 10), '#c9cfdc', W / 2 - .07, .05, fz + .006, HP, 0, 0); }
  }));
  const iw = W - .08, idp = D - .08, fy = .215;
  f.add(mc('s3a-cooler-in', ({ add }) => {
    add(G.box(iw, .02, idp, .004), '#f7fbff', 0, fy - .01, z0);
    for (const sx of [-1, 1]) add(G.box(.006, H - fy, idp, .002), '#f7fbff', sx * (iw / 2 - .003), fy + (H - fy) / 2, z0);
    for (const sz of [-1, 1]) add(G.box(iw, H - fy, .006, .002), '#f7fbff', 0, fy + (H - fy) / 2, z0 + sz * (idp / 2 - .003));
    add(G.cyl(.042, .042, .12, 14), '#ff7a6a', -.2, fy + .06, z0 - .1); add(G.cyl(.042, .042, .12, 14), '#8fd88a', -.105, fy + .06, z0 - .115);
    for (const [x, z] of [[-.2, -.1], [-.105, -.115]]) add(G.cyl(.036, .04, .012, 14), '#dfe5f0', x, fy + .126, z0 + z);
    for (const [x, z, r] of [[-.22, .07, .3], [-.15, .1, -.5], [.01, -.13, .7], [.17, -.12, .2], [.22, .1, -.3], [-.04, .12, .1]]) add(G.box(.05, .045, .05, .012), '#d3f1ff', x, fy + .022, z0 + z, 0, r, 0);
  }));
  const lid = grp(mc('s3a-cooler-lid' + vk, ({ add }) => { add(G.box(W + .04, .09, D + .04, .035), '#ffffff', 0, .045, D / 2 + .02); add(G.box(W - .12, .02, D - .14, .01), '#d9f0fb', 0, .095, D / 2 + .02); add(G.box(.14, .03, .05, .012), '#9aa6b8', 0, .05, D + .045); }));
  put(lid, 0, H, z0 - D / 2 - .02); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.75 * t; }, { label: '아이스박스', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: H - .13, z: fz + .045 };
  f.spot('inside', null, .1, .22, z0 + .04, { part: p, maxH: .3, label: '아이스박스 안', scale: .85 });
  f.spot('behind', null, 0, 0, -.4, { maxH: .4, label: '아이스박스 뒤', scale: .8 });
  f.spot('on', lid, 0, .105, D / 2 + .02, { maxH: .35, label: '아이스박스 위', scale: .8 });
};

// ── 캠핑 의자 (1×1): 회청 접이 다리, 하늘색 천, 산호·크림 체크 담요(구부러지며 들림) ─────────────────────────────────────
// (A: 정본 3판처럼 빨간 체크 담요 — 진한 빨강 바탕에 어두운 줄과 흰 가는 줄)
const plaidRed = () => paintTex('s3a-plaid-red', 128, 128, (c, w, h) => {
  c.fillStyle = '#e8505b'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(90,20,40,.38)'; for (let k = 0; k < 4; k++) { c.fillRect(k * 32 + 6, 0, 12, h); c.fillRect(0, k * 32 + 6, w, 12); }
  c.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 4; k++) { c.fillRect(k * 32 + 25, 0, 2, h); c.fillRect(0, k * 32 + 25, w, 2); }
});
const plaidTex = () => paintTex('s3a-plaid', 128, 128, (c, w, h) => {
  c.fillStyle = '#fff3e6'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,128,120,.55)'; for (let k = 0; k < 4; k++) { c.fillRect(k * 32 + 4, 0, 14, h); c.fillRect(0, k * 32 + 4, w, 14); }
  c.fillStyle = 'rgba(120,190,170,.5)'; for (let k = 0; k < 4; k++) { c.fillRect(k * 32 + 24, 0, 3, h); c.fillRect(0, k * 32 + 24, w, 3); }
});
B.s3a_campchair = (f, T, o = {}) => {
  const sy = .4, seat = '#7cc4ec';
  f.add(mc('s3a-cchair' + (o.vivid ? '-v' : ''), ({ add, tube }) => {
    for (const sx of [-1, 1]) { const x = sx * .26, c = '#5a6a86'; tube([x, 0, .2], [x, sy + .02, -.2], .022, c); tube([x, 0, -.2], [x, sy + .02, .2], .022, c); tube([x, sy + .02, -.2], [x, .9, -.32], .02, c); tube([x, sy + .18, .22], [x, sy + .18, -.24], .022, c); }
    add(G.cyl(.045, .04, .08, 14), '#ffcf3c', .31, sy + .2, .17);
    if (o.vivid) { add(G.cyl(.032, .028, .1, 12), '#fff6d6', .31, sy + .27, .17); add(G.cyl(.03, .03, .01, 12), '#ffe27a', .31, sy + .315, .17); tube([.31, sy + .3, .17], [.33, sy + .38, .16], .004, '#ff6a8a', 4); add(G.sph(.016, 8, 6), '#9fe07a', .3, sy + .325, .18, 0, 0, 0, [1, .4, 1]);
      add(G.box(.04, .12, .16, .01), '#5aa0d0', -.29, sy + .1, .02); }
    add(G.box(.52, .04, .42, .015), seat, 0, sy, 0, .05, 0, 0);
    add(G.box(.52, .46, .035, .015), seat, 0, sy + .27, -.26, -.22, 0, 0);
  }));
  const pm = texMat(o.vivid ? plaidRed() : plaidTex());
  const bl = grp(put(new THREE.Mesh(new THREE.BoxGeometry(.46, .035, .38), pm), 0, .03, 0), put(new THREE.Mesh(new THREE.BoxGeometry(.46, .24, .03), pm), 0, -.08, .2, .15, 0, 0));
  put(bl, 0, sy, .01); f.add(bl);
  const p = f.part('lift', bl, clothBend(f, bl, { hinge: [0, .03, -.17], along: [0, 0, 1], toward: [0, 1, 0], len: .4, turn: 2.4, tip: .25, rise: .08 }), { label: '담요', sfx: 'lift', dur: .5 });
  f.spot('inside', null, 0, sy + .02, -.02, { part: p, maxH: .3, label: '담요 밑', scale: .85 });
  f.spot('under', null, 0, 0, -.02, { maxH: .3, label: '의자 밑', scale: .85 });
};

// ── 덤불 (1×1): 수국 덤불 두 쪽(하늘색·연보라·흰 꽃송이) — 두 쪽이 벌어짐 ──────────────────────────────────────────────
B.s3a_bush = (f, T, o = {}) => {
  const half = sx => {
    const pv = new THREE.Group(); put(pv, sx * .46, 0, 0, 0, sx > 0 ? PI : 0, 0);
    pv.add(mc('s3a-bush-half' + (o.vivid && sx < 0 ? '-v' : ''), ({ add }) => {
      if (o.vivid && sx < 0) { add(G.sph(.028, 10, 8), '#ff4f5e', .36, .5, .22, 0, 0, 0, [1, .6, 1.2]); add(G.sph(.014, 8, 6), '#2a1d33', .36, .51, .25); for (const [dx, dz] of [[.012, -.006], [-.012, -.006], [0, -.02]]) add(G.sph(.006, 6, 4), '#2a1d33', .36 + dx, .517, .22 + dz); }
      for (const [x, y, z, r, c] of [[.24, .28, 0, .3, '#5fae5f'], [.14, .22, .2, .22, '#6fbb64'], [.14, .22, -.2, .22, '#549f58'], [.3, .5, .05, .22, '#6fbb64'], [.12, .46, -.04, .2, '#5fae5f']]) add(G.sph(r, 16, 11), c, x, y, z);
      for (const [x, y, z, c] of [[.2, .5, .24, '#a9c6ff'], [.38, .62, .1, '#c9b8f6'], [.08, .4, .3, '#ffffff'], [.42, .34, .24, '#a9c6ff'], [.26, .64, -.14, '#ffffff']]) {
        for (let k = 0; k < 7; k++) { const a = k * .9, b = (k % 3) * .5; add(G.sph(.032, 8, 6), k % 4 ? c : mix(c, '#ffffff', .5), x + Math.cos(a) * .05 * Math.cos(b), y + Math.sin(b) * .04, z + Math.sin(a) * .05 * Math.cos(b)); }
      }
    }));
    f.add(pv); return pv;
  };
  const L = half(-1), R = half(1);
  const p = f.part('lift', [L, R], (t, bl, br) => { L.rotation.z = .55 * t; L.position.x = bl.p.x - .08 * t; R.rotation.z = .55 * t; R.position.x = br.p.x + .08 * t; }, { label: '덤불', sfx: 'swish' });
  f.spot('inside', null, 0, 0, .04, { part: p, maxH: .4, label: '덤불 속', scale: .9 });
  f.spot('behind', null, 0, 0, -.4, { maxH: .4, label: '덤불 뒤', scale: .8 });
  f.spot('on', L, .3, .7, .05, { maxH: .3, label: '덤불 위', scale: .7 });
};

// ── 피크닉 (1×1): 산호 체크 돗자리, 등나무 바구니(뚜껑 — 자물쇠 가능), 하늘색 보온병, 딸기 접시 ──────────────────────────────
const ginghamTex = () => paintTex('s3a-gingham', 128, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,120,120,.42)';
  for (let k = 0; k < 8; k++) { c.fillRect(k * 16, 0, 8, h); c.fillRect(0, k * 16, w, 8); }
});
const weaveTex = () => paintTex('s3a-weave', 128, 128, (c, w, h) => {
  c.fillStyle = '#e2b46c'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const o = (y / 16 + x / 16) % 2; c.fillStyle = o ? '#efc788' : '#cf9c56'; roundRectPath(c, x + 1, y + 2, 14, 12, 5); c.fill(); }
});
const ginghamRed = () => paintTex('s3a-gingham-red', 128, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(240,70,80,.55)';
  for (let k = 0; k < 8; k++) { c.fillRect(k * 16, 0, 8, h); c.fillRect(0, k * 16, w, 8); }
});
B.s3a_picnic = (f, T, o = {}) => {
  f.add(put(new THREE.Mesh(new THREE.BoxGeometry(.94, .018, .9), texMat(o.vivid ? ginghamRed() : ginghamTex())), 0, .01, 0));
  const W = .5, H = .26, D = .34, z0 = -.1, y0 = .02, wm = texMat(weaveTex());
  const basket = grp(); f.add(basket);
  const t = .03;
  for (const [w, h, d, x, y, z] of [[W, t, D, 0, y0 + t / 2, z0], [W, H, t, 0, y0 + H / 2, z0 - D / 2 + t / 2], [W, H, t, 0, y0 + H / 2, z0 + D / 2 - t / 2], [t, H, D, -W / 2 + t / 2, y0 + H / 2, z0], [t, H, D, W / 2 - t / 2, y0 + H / 2, z0]]) basket.add(put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm), x, y, z));
  f.add(mc('s3a-pic-bits' + (o.vivid ? '-v' : ''), ({ add }) => {
    for (const sx of [-1, 1]) add(G.tor(.055, .014, PI, 5, 12), '#b9803f', sx * (W / 2 + .005), y0 + H - .07, z0, 0, HP, 0);
    add(G.cyl(.055, .055, .22, 16), '#7cc4ec', .3, .13, .25); add(G.cyl(.058, .058, .045, 16), '#ffffff', .3, .26, .25);
    add(G.cyl(.11, .1, .02, 18), '#ffffff', -.3, .03, .28);
    for (const [x, z] of [[-.33, .26], [-.27, .3], [-.3, .22]]) { add(G.sph(.026, 8, 6), '#ff5a6a', x, .055, z, 0, 0, 0, [1, 1.15, 1]); add(G.cone(.018, .015, 5), '#5fae5a', x, .085, z); }
    if (o.vivid) { add(G.box(.16, .006, .16, .002), '#fff6e0', .28, .023, -.28, 0, .5, 0);
      for (const [y, c, h] of [[.03, '#f2d29a', .018], [.045, '#8fd06a', .008], [.053, '#ff8a7a', .008], [.064, '#ffe08a', .01], [.077, '#f2d29a', .018]]) add(new THREE.CylinderGeometry(.07, .07, h, 3), c, .28, y, -.28, 0, .5, 0); }
  }));
  const lid = grp(mc('s3a-pic-lid', ({ add }) => { add(G.box(W + .04, .045, D + .04, .018), '#c98f4c', 0, .022, D / 2 + .02); add(G.box(W - .08, .02, D - .06, .008), '#e2b06c', 0, .05, D / 2 + .02); add(G.box(.1, .025, .03, .008), '#b9803f', 0, .02, D + .045); }));
  put(lid, 0, y0 + H, z0 - D / 2 - .02); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.7 * t; }, { label: '피크닉 바구니', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.035, z: D + .055, parent: lid };
  f.spot('inside', null, 0, y0 + .03, z0, { part: p, maxH: .2, label: '피크닉 바구니 안', scale: .75 });
  f.spot('on', null, -.24, .02, .27, { maxH: .4, label: '돗자리 위', scale: .85 });
  f.spot('behind', null, 0, .02, -.36, { maxH: .35, label: '바구니 뒤', scale: .8 });
};

// ── 둘레 (숨김 자리 없음): 생울타리·흰 울타리·풀밭 둘레의 꽃·덤불·징검돌·나비·잠자리 ─────────────────────────────────────
// 생울타리 (북쪽, 길이 L): 둥글게 다듬은 회양목, 두 톤 잎 덩어리, 흰·연분홍 작은 꽃
B.s3a_hedge = (f, T, o = {}) => {
  f.noSolid = true; f.noOccupied = true;
  const L = o.len || 7, r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(17);
  f.add(mt('s3a-hedge|' + L, TX.leaf(), ({ add }) => {
    add(G.box(L + .3, .5, .5, .2), '#5aaa5e', 0, .27, -.26, 0, 0, 0, 1, { w: .6 });
    for (let x = -L / 2 - .05; x <= L / 2 + .05; x += .29) add(G.sph(.21 + r() * .05, 16, 11), r() < .5 ? '#64b464' : '#579f5a', x, .55 + r() * .04, -.26 + (r() - .5) * .08, 0, 0, 0, 1, { w: .6 });
    for (let x = -L / 2 + .1; x <= L / 2; x += .42) add(G.sph(.17, 14, 10), '#6dbd68', x, .3, -.06, 0, 0, 0, [1, 1, .6], { w: .6 });
  }));
  f.add(mc('s3a-hedge-fl|' + L, ({ add }) => {
    for (let x = -L / 2 + .2; x < L / 2; x += .33 + r() * .2) add(G.sph(.034, 8, 6), r() < .6 ? '#ffffff' : '#ffc6d8', x, .3 + r() * .42, -.02 - r() * .04);
    for (let x = -L / 2 + .15; x < L / 2; x += .5 + r() * .3) tuft(add, x, .1, .8);
  }));
};
// 흰 울타리 (서쪽, 길이 L, z 방향): 뾰족 머리 말뚝, 가로대 둘, 모자 쓴 기둥, 나팔꽃 덩굴 조금
B.s3a_fence = (f, T, o = {}) => {
  f.noSolid = true; f.noOccupied = true;
  const L = o.len || 6, H = .74;
  f.add(mt('s3a-fence-wood|' + L, TX.plank(), ({ add }) => {
    const n = Math.round(L / .17);
    for (let i = 0; i <= n; i++) { const z = -L / 2 - .05 + i * (L + .1) / n; add(G.box(.035, H - .1, .1, .015), i % 3 ? '#fffaf0' : '#fff4e2', -.03, (H - .1) / 2, z, 0, 0, 0, 1, .5); add(G.cone(.07, .09, 4), '#fffaf0', -.03, H - .055, z, 0, PI / 4, 0, [.5, 1, 1], .5); }
    for (const y of [.2, .5]) add(G.box(.045, .07, L + .12, .015), '#f4ecdc', -.075, y, 0, 0, 0, 0, 1, .5);
    for (let i = 0; i <= Math.round(L); i++) { const z = -L / 2 + i * L / Math.round(L); add(G.box(.1, H + .06, .1, .025), '#fffaf0', -.075, (H + .06) / 2, z, 0, 0, 0, 1, .5); add(G.box(.13, .04, .13, .015), '#efe6d6', -.075, H + .1, z, 0, 0, 0, 1, .5); }
  }));
  f.add(mc('s3a-fence|' + L, ({ add, tube }) => {
    const n = Math.round(L / .17);
    for (let i = 0; i <= n; i++) { const z = -L / 2 - .05 + i * (L + .1) / n; for (const y of [.2, .5]) add(G.sph(.007, 5, 4), '#b9ad98', -.008, y, z); }
    // morning-glory vines climbing two stretches
    for (const z0 of [-1.6, 1.3]) for (let k = 0; k < 9; k++) { const z = z0 + k * .12, y = .12 + Math.abs(Math.sin(k * .9)) * .45; add(G.sph(.045, 8, 6), k % 2 ? '#5fae5a' : '#79c26a', .0, y, z, 0, 0, 0, [.5, 1, 1]); if (k % 3 === 1) { add(G.cone(.04, .05, 8), k % 2 ? '#9cc0ff' : '#c9b2f6', .02, y + .05, z, 0, 0, -HP); add(G.sph(.012, 6, 5), '#ffffff', .045, y + .05, z); } }
    for (let z = -L / 2 + .3; z < L / 2; z += .55) tuft(add, .12, z, .8);
  }));
};
// 풀밭 둘레의 작은 생활: 판 밖 꽃무더기·작은 덤불, 연못 위 잠자리, 나비 둘, 남쪽에서 들어오는 징검돌 (방 가운데 기준 좌표)
B.s3a_around = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];   // (the flies in the air are no obstacle: the cooler's lid stopped at a third)
  // (10/24: 판 밖 디딤돌·꽃무더기는 뺌 — 정본 3판처럼 판 가장자리가 또렷하게)
  // a dragonfly over the pond, two butterflies by the flowers — light, out of the way
  const fly = mc('s3a-flies', ({ add }) => { dragonfly(add, .1, .75, .55, .6); butterfly(add, -2.5, .7, 2.3, '#ffd3e4', .4, .9); butterfly(add, 2.7, .85, .9, '#fff2a8', 2.2, .85); });
  f.add(scenery(fly));
};

export const S3A_BUILDERS = B;
export const S3A_INFO = {
  s3a_hedge: { w: 1, d: 1, name: '생울타리', price: 0, hidden: true },
  s3a_fence: { w: 1, d: 1, name: '울타리', price: 0, hidden: true },
  s3a_around: { w: 1, d: 1, name: '낚시터 둘레', price: 0, hidden: true },
};
