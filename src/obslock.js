// 관찰 자물쇠 (레벨 보고서 R4, 10/18): the code and the colours are in the room, the note only says where to look.
//   · 비밀번호: a clock in the room shows the time — the wall clock if the room has one, else an alarm clock on top of
//     something — and the note says "벽시계를 봐! 몇 시 몇 분?". The safe takes it on a 3-wheel dial (시 : 분).
//   · 색깔: three vases of three sizes stand together; the note says "작은 것부터". The lock takes three colour taps.
//   · a code shown elsewhere (TV, puzzle frame, torn note) keeps its clue; only the input is now the dial.
//   · tapping the clock or the vases shows them big (they are small on a phone); three wrong tries offer 척척 로봇.
// Nothing is typed in for you any more. The bot (G.bot) knows the answer and goes straight through. ?obs=0 = the old locks.
import * as THREE from 'three';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { rbox, sph, cyl, tor, put, grp, mat, canvasTex } from './gfx/kit.js';
import { attachItem } from './room.js';
import { LOCK_COLORS } from './gfx/items.js';
import { h } from './ui.js';
import { newCard, obsCards } from './script.js';

const K = (ko, en) => { if (en) EN[ko] = en; return ko; };
export const OBS = !/[?&]obs=0(&|$)/.test(location.search);
// (the cards' observation wording is no longer switched on here: chapters 2-6 use plain notes — 10/18)

const T = {
  noteWall: K('쪽지: "벽시계를 봐! 몇 시 몇 분?"', 'Note: "Look at the wall clock! What time is it?"'),
  noteAlarm: K('쪽지: "알람시계를 봐! 몇 시 몇 분?"', 'Note: "Look at the alarm clock! What time is it?"'),
  noteVase: K('쪽지: "꽃병 세 개를 봐! 작은 것부터"', 'Note: "Look at the three vases! Smallest first"'),
  paperClock: K('시계를 봐!', 'Check the clock!'), paperVase: K('꽃병을 봐!', 'Check the vases!'),
  paperTime: K('몇 시 몇 분?', 'What time?'), paperSmall: K('작은 것부터', 'Smallest first'),
  title: K('비밀번호', 'Code'), colorTitle: K('색깔 자물쇠', 'Color Lock'),
  hintWall: K('벽시계가 가리키는 시각', 'The time on the wall clock'), hintAlarm: K('알람시계가 가리키는 시각', 'The time on the alarm clock'),
  hintCode: K('알아낸 비밀번호를 맞춰 봐', 'Dial the code you found'), hintNoCode: K('어딘가에 숫자가 있어', 'The numbers are somewhere'),
  hintVase: K('작은 꽃병부터 큰 꽃병까지', 'From the smallest vase to the biggest'), hintColor: K('찾은 색깔 순서대로', 'In the order you found'),
  open: K('열기!', 'Open!'), clear: K('지우기', 'Clear'), hour: K('시', 'h'), min: K('분', 'min'),
  wrong: K('아니야… 다시 잘 봐!', 'Not quite… look again!'),
  hands: K('짧은 바늘은 시, 긴 바늘은 분', 'Short hand = hour, long hand = minutes'),
  vases: K('작은 것부터 순서대로!', 'Smallest first!'), ok: K('알겠어!', 'Got it!'),
  lookClock: K('시계', 'Clock'), lookVase: K('꽃병 세 개', 'Three vases'),
  // (③ 10/21, 19~50 다시 짜기 — 스토리 룸: 19판 '119' 포스터, 27판 기차 시간표) two more pictures to read the code off
  notePoster: K('쪽지: "벽 포스터를 봐! 불나면 몇 번?"', 'Note: "Look at the poster! Fire — which number?"'),
  noteTimetable: K('쪽지: "시간표를 봐! 별표 기차는 몇 시?"', 'Note: "Check the timetable! When is the ★ train?"'),
  paperPoster: K('포스터를 봐!', 'Check the poster!'), paperTimetable: K('시간표를 봐!', 'Check the timetable!'),
  paperNumber: K('몇 번?', 'Which number?'), paperStar: K('별표 기차', 'The ★ train'),
  hintPoster: K('포스터에 적힌 번호', 'The number on the poster'), hintTimetable: K('별표 기차 시각 (네 자리)', 'The ★ train\'s time (four digits)'),
  lookPoster: K('불조심 포스터', 'Fire safety poster'), lookTimetable: K('기차 시간표', 'Train timetable'),
  d1: K('바다', 'Sea'), d2: K('산', 'Hills'), d3: K('시내', 'Town'), d4: K('공항', 'Airport'),
  poster1: K('불나면!', 'Fire!'), poster2: K('바로 신고', 'Call right away'), tt: K('기차 시간표', 'Train timetable'), ttMine: K('우리 기차', 'Our train'),
};

// ── what the room shows
function drawClock(c, w, H, M, { hands = true } = {}) {
  const r = w / 2;
  c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(r, r, r - 4, 0, 7); c.fill();
  c.lineWidth = w * .045; c.strokeStyle = '#3b2a55'; c.beginPath(); c.arc(r, r, r - w * .03, 0, 7); c.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = r * (big ? .8 : .86), r1 = r * .9;
    c.strokeStyle = big ? '#3b2a55' : '#c9bcd8'; c.lineWidth = big ? w * .018 : w * .007;
    c.beginPath(); c.moveTo(r + Math.sin(a) * r0, r - Math.cos(a) * r0); c.lineTo(r + Math.sin(a) * r1, r - Math.cos(a) * r1); c.stroke();
  }
  c.fillStyle = '#3b2a55'; c.font = `bold ${Math.round(w * .13)}px Ssurround, Jua, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(String(i), r + Math.sin(a) * r * .64, r - Math.cos(a) * r * .64 + w * .008); }
  if (!hands) return;
  const hand = (a, len, wd, col) => {
    c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round';
    c.beginPath(); c.moveTo(r - Math.sin(a) * len * .16, r + Math.cos(a) * len * .16); c.lineTo(r + Math.sin(a) * len, r - Math.cos(a) * len); c.stroke();
  };
  hand(((H % 12) + M / 60) / 12 * Math.PI * 2, r * .46, w * .062, '#ff5d73');   // short, thick, pink: the hour
  hand(M / 60 * Math.PI * 2, r * .76, w * .036, '#3b6fd8');                     // long, thin, blue: the minutes
  c.fillStyle = '#ffc93c'; c.beginPath(); c.arc(r, r, w * .045, 0, 7); c.fill(); c.lineWidth = w * .012; c.strokeStyle = '#3b2a55'; c.stroke();
}
const faceMat = (H, M) => new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c, w) => drawClock(c, w, H, M)) });   // a bright dial: it reads in a dark room too
function faceDisc(r, m) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m); d.castShadow = false; return d; }

// an alarm clock: pink case, twin bells, little feet, the dial facing front (+z) — about 26 cm tall
function alarmClock(H, M) {
  const g = grp(), case_ = '#ff8fb0', cy = .135;
  g.add(put(cyl(.105, .105, .07, case_, { rough: .5 }, 32), 0, cy, 0, Math.PI / 2, 0, 0));
  g.add(put(tor(.1, .014, '#ffffff', null, Math.PI * 2, 8, 32), 0, cy, .036));
  g.add(put(faceDisc(.094, faceMat(H, M)), 0, cy, .037));
  for (const sx of [-1, 1]) {
    g.add(put(sph(.045, '#ffc93c', { metal: .3, rough: .4 }, 16, 10), sx * .07, cy + .1, -.005, 0, 0, -sx * .5, [1, .75, 1]));
    g.add(put(sph(.018, '#3b2a55', null, 8, 6), sx * .07, .02, .01));
  }
  g.add(put(rbox(.03, .05, .02, '#3b2a55', .008), 0, cy + .12, -.005));
  return g;
}
// the room's own wall clock gets a new dial plate over the printed one (its painted hands are part of the case mesh)
function wallClockDial(rec, H, M) {
  const g = grp(), cy = 2.0;
  g.add(put(cyl(.215, .215, .03, rec.f.T?.accent || '#ff8fb0', null, 36), 0, cy, .08, Math.PI / 2, 0, 0));
  g.add(put(faceDisc(.2, faceMat(H, M)), 0, cy, .096));
  rec.f.group.add(g);
  return g;
}
// three vases, small / middle / tall, each a lock colour, stood in a shuffled row
const VASE_H = [.14, .2, .27];
function vaseTrio(code, order) {
  const g = grp();
  order.forEach((k, slot) => {
    const c = LOCK_COLORS[+code[k]][0], hh = VASE_H[k], v = grp(), x = (slot - 1) * .14;
    v.add(put(sph(.055 + k * .008, c, { rough: .45 }, 18, 12), 0, hh * .34, 0, 0, 0, 0, [1, hh / .16, 1]));
    v.add(put(cyl(.024, .031, hh * .36, c, { rough: .45 }, 14), 0, hh * .78, 0));
    v.add(put(tor(.028, .009, '#ffffff', null, Math.PI * 2, 6, 16), 0, hh * .96, 0, Math.PI / 2));
    v.add(put(sph(.026, '#ffffff', null, 10, 8), 0, hh + .02, 0));
    v.position.x = x; g.add(v);
  });
  return g;
}
function drawVases(c, w, hgt, code, order) {
  c.fillStyle = '#fff7ee'; c.fillRect(0, 0, w, hgt);
  c.fillStyle = '#e9d6c4'; c.fillRect(0, hgt * .82, w, hgt * .18);
  order.forEach((k, slot) => {
    const cx = w * (.22 + slot * .28), base = hgt * .82, vh = hgt * (.3 + k * .17), vw = w * (.1 + k * .02), col = LOCK_COLORS[+code[k]][0];
    c.fillStyle = col; c.strokeStyle = '#3b2a55'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(cx, base - vh * .36, vw, vh * .36, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.rect(cx - vw * .38, base - vh * .98, vw * .76, vh * .4); c.fill(); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, base - vh - 10, 11, 0, 7); c.fill(); c.stroke();
  });
}
// 119 포스터: red frame, a little fire truck, the number big
function drawPoster(c, w, hgt) {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, hgt);
  c.strokeStyle = '#ff4f66'; c.lineWidth = w * .06; c.strokeRect(w * .03, w * .03, w - w * .06, hgt - w * .06);
  c.fillStyle = '#3b2a55'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `bold ${Math.round(w * .13)}px Ssurround, Jua, sans-serif`;
  c.fillText(tr(T.poster1), w / 2, hgt * .17);
  const tx = w * .22, ty = hgt * .27, tw = w * .56, th = hgt * .18;   // a little fire truck
  c.fillStyle = '#ff4f66'; c.strokeStyle = '#3b2a55'; c.lineWidth = w * .02;
  c.beginPath(); c.rect(tx, ty + th * .2, tw * .7, th * .6); c.fill(); c.stroke(); c.beginPath(); c.rect(tx + tw * .7, ty + th * .38, tw * .3, th * .42); c.fill(); c.stroke();
  c.fillStyle = '#9fd6ff'; c.fillRect(tx + tw * .76, ty + th * .44, tw * .16, th * .16);
  c.fillStyle = '#3b2a55'; for (const fx of [.18, .58, .86]) { c.beginPath(); c.arc(tx + tw * fx, ty + th * .86, th * .14, 0, 7); c.fill(); }
  c.fillStyle = '#ffc93c'; c.fillRect(tx + tw * .08, ty + th * .08, tw * .16, th * .14);
  c.fillStyle = '#ff4f66'; c.font = `bold ${Math.round(w * .36)}px Ssurround, Jua, sans-serif`; c.fillText('119', w / 2, hgt * .66);
  c.fillStyle = '#3b2a55'; c.font = `bold ${Math.round(w * .1)}px Ssurround, Jua, sans-serif`; c.fillText(tr(T.poster2), w / 2, hgt * .88);
}
// 기차 시간표: four trains, ours starred (its time is the code)
function drawTimetable(c, w, hgt, rows, star) {
  c.fillStyle = '#23405f'; c.fillRect(0, 0, w, hgt);
  c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `bold ${Math.round(w * .1)}px Ssurround, Jua, sans-serif`; c.fillText(tr(T.tt), w / 2, hgt * .12);
  rows.forEach(([H, M, dest], i) => {
    const y = hgt * (.3 + i * .18), mine = i === star;
    c.fillStyle = mine ? '#ffd23f' : 'rgba(255,255,255,.12)'; c.fillRect(w * .06, y - hgt * .07, w * .88, hgt * .14);
    c.fillStyle = mine ? '#23405f' : '#ffffff'; c.font = `bold ${Math.round(w * .11)}px Ssurround, Jua, sans-serif`;
    c.textAlign = 'left'; c.fillText(`${H}:${String(M).padStart(2, '0')}`, w * .1, y);
    c.textAlign = 'right'; c.font = `bold ${Math.round(w * .075)}px Ssurround, Jua, sans-serif`; c.fillText(mine ? '★ ' + tr(T.ttMine) : dest, w * .9, y);
  });
}
// a picture on a little stand (a poster frame / a timetable board), facing front (+z), about 45 cm tall
function standBoard(draw, cw, ch, bw, bh, frame) {
  const g = grp(), m = new THREE.MeshBasicMaterial({ map: canvasTex(cw, ch, draw) });
  g.add(put(rbox(bw + .04, bh + .04, .025, frame, .008), 0, .06 + bh / 2, 0));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), m); p.castShadow = false; g.add(put(p, 0, .06 + bh / 2, .014));
  g.add(put(rbox(.03, .08, .03, frame, .008), -bw * .3, .03, -.03), put(rbox(.03, .08, .03, frame, .008), bw * .3, .03, -.03));
  return g;
}
const posterProp = () => standBoard((c, w, hgt) => drawPoster(c, w, hgt), 192, 256, .27, .36, '#ff8fb0');
const timetableProp = (rows, star) => standBoard((c, w, hgt) => drawTimetable(c, w, hgt, rows, star), 256, 224, .34, .3, '#3a5f8a');
// the note itself no longer carries the answer, only where to look
function paperMat(kind) {
  if (kind === 'poster' || kind === 'timetable') return new THREE.MeshBasicMaterial({ map: canvasTex(256, 200, (c, w, hgt) => {
    c.fillStyle = '#fff7d6'; c.fillRect(0, 0, w, hgt);
    c.fillStyle = '#ff6f91'; c.font = 'bold 32px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(tr(kind === 'poster' ? T.paperPoster : T.paperTimetable), w / 2, 40);
    c.fillStyle = kind === 'poster' ? '#ff4f66' : '#23405f'; c.font = 'bold 54px Ssurround, Jua, sans-serif'; c.fillText(kind === 'poster' ? '? ? ?' : '★ ?:??', w / 2, 108);
    c.fillStyle = '#3b2a55'; c.font = 'bold 24px Ssurround, Jua, sans-serif'; c.fillText(tr(kind === 'poster' ? T.paperNumber : T.paperStar), w / 2, 176);
  }) });
  return new THREE.MeshBasicMaterial({ map: canvasTex(256, 200, (c, w, hgt) => {
    c.fillStyle = kind === 'clock' ? '#fff7d6' : '#eef6ff'; c.fillRect(0, 0, w, hgt);
    c.fillStyle = '#ff6f91'; c.font = 'bold 32px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(tr(kind === 'clock' ? T.paperClock : T.paperVase), w / 2, 36);
    if (kind === 'clock') { c.save(); c.translate(w / 2 - 50, 66); drawClock(c, 100, 0, 0, { hands: false }); c.restore(); }
    else { c.save(); c.translate(w / 2 - 70, 66); drawVases(c, 140, 100, '012', [1, 0, 2]); c.restore(); }
    c.fillStyle = '#3b2a55'; c.font = 'bold 24px Ssurround, Jua, sans-serif'; c.fillText(tr(kind === 'clock' ? T.paperTime : T.paperSmall), w / 2, 184);
  }) });
}
function restyleNote(it, kind) {
  if (!it.g) return;
  for (const ch of [...it.g.children]) if (!ch.userData.proxy) it.g.remove(ch);
  it.g.add(put(rbox(.24, .01, .19, kind === 'clock' ? '#fff7d6' : '#eef6ff', .003), 0, .005, 0));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(.23, .18), paperMat(kind)); p.castShadow = false;
  it.g.add(put(p, 0, .0105, 0, -Math.PI / 2));
}

// ── setting it up as the stage loads (after the things are placed)
const rng = seed => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
function seenFrom(S, obj) {
  const W = S.G.world, R = S.room, c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()), keep = { y: W.yaw, p: W.pitch, z: W.zoom, t: W.target.clone() };
  let v = 0; W.zoom = 1; W.target.copy(c);
  for (const p of [.62, .95]) for (let k = 0; k < 6; k++) { W.yaw = k * Math.PI / 3 + Math.PI / 6; W.pitch = p; W.updateCam(); R.update(1); R.group.updateMatrixWorld(true); if (!W.occluded(obj, c, [R.group])) v++; }
  W.yaw = keep.y; W.pitch = keep.p; W.zoom = keep.z; W.target.copy(keep.t); W.updateCam(); R.update(1);
  return v;
}
const NOT_ON = /plant|monstera|tree|bush|garden|flower|pot|cactus|lamp|bin|trash|stairs|ladder|mushroom|rock|stone|fire|tent|fence|lantern|sign|umbrella/;   // a clock in a flowerpot reads wrong
// a free top-of-something place, away from the lock's own piece, that most views can see
function propSpot(S, L, build, need, used, rand, t0) {
  const sp = S.room.spots.filter(s => !s.item && !s.reserved && !s.wallFace && s.anchor && s.kind === 'on' && !s.part && s.furn !== L.part.furn && !used.has(s.furn)
    && (s.maxH ?? 1) >= need * .75 && !NOT_ON.test(s.furn?.type || ''));
  for (let i = sp.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [sp[i], sp[j]] = [sp[j], sp[i]]; }
  for (const s of sp.slice(0, 12)) {
    if (performance.now() - t0 > 300) break;
    const g = build(), sc = Math.min(1, (s.maxH ?? 1) / need);
    attachItem(s, g, { scale: sc }); g.updateMatrixWorld(true);
    if (seenFrom(S, g) >= 4) return { s, g };
    s.anchor.remove(g); if (s.itemGroup === g) s.itemGroup = null;
  }
  return null;
}
// no free top anywhere (a playground's few places are all taken): a little crate on open ground, the clue on top
function groundSpot(S, L, build, used, rand, t0) {
  const furns = (S.room.rooms || [S.room]).flatMap(R => R.furns || []);
  const boxes = furns.map(e => new THREE.Box3().setFromObject(e.f.group)).filter(b => b.max.y - b.min.y > .04);
  if (!boxes.length) return null;
  const R = S.room, cz = R.center?.z || 0, all = boxes.reduce((u, b) => u.union(b), new THREE.Box3());
  const inside = R.w && R.d ? (x, z) => Math.abs(x) < R.w / 2 - .4 && Math.abs(z - cz) < R.d / 2 - .4 : (x, z) => x > all.min.x + .3 && x < all.max.x - .3 && z > all.min.z + .3 && z < all.max.z - .3;
  const free = (x, z, pad = .28) => inside(x, z) && !boxes.some(b => b.min.y < .5 && x > b.min.x - pad && x < b.max.x + pad && z > b.min.z - pad && z < b.max.z + pad);
  const lp = new THREE.Box3().setFromObject(L.part.furn.group).getCenter(new THREE.Vector3()), fp = S.friend?.root?.position;
  const pts = [];
  for (let x = all.min.x; x <= all.max.x; x += .5) for (let z = all.min.z; z <= all.max.z; z += .5)
    if (free(x, z) && Math.hypot(x - lp.x, z - lp.z) > 1 && (!fp || Math.hypot(x - fp.x, z - fp.z) > 1)) pts.push([x, z]);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  for (const [x, z] of pts.slice(0, 10)) {
    if (performance.now() - t0 > 400) break;
    const g = grp(), crate = '#d9a066';
    g.add(put(rbox(.36, .16, .28, crate, .02), 0, .08, 0));
    for (const sx of [-1, 1]) g.add(put(rbox(.02, .17, .29, '#b97f48', .006), sx * .17, .085, 0));
    const top = build(); top.position.y = .16; g.add(top);
    const a = new THREE.Object3D(); R.group.add(a); a.position.copy(R.group.worldToLocal(new THREE.Vector3(x, 0, z)));
    a.rotation.y = Math.atan2(S.G.world.cam.position.x - x, S.G.world.cam.position.z - z);
    a.add(g); a.updateMatrixWorld(true);
    if (seenFrom(S, g) >= 4) return { s: { kind: 'on', label: '상자 위', part: null, anchor: a, ground: true }, g };
    R.group.remove(a);
  }
  return null;
}
export function obsSetup(S) {
  // (from chapter 7 only — 1장 덜어내기 10/18: the code / colour locks of chapters 2-6 are plain notes again)
  if (!OBS || S.custom || S.spec.boss || S.spec.endless || (S.idx < 60 && !S.spec.obs && !S.spec.obsKind)) return null;   // (19~50 다시 짜기: a stage the plan gives a picture clue — spec.obs / spec.obsKind 'poster' | 'timetable')
  const locks = (S.plan.locks || []).filter(L => (L.kind === 'code' || L.kind === 'color') && L.part?.lock);
  if (!locks.length) return null;
  const O = { src: new Map(), wrong: new Map(), free: new Set() }, used = new Set(), t0 = performance.now(), rand = rng(1 + S.idx * 7919 + locks.length);
  const rooms = S.room.rooms || [S.room], decors = rooms.flatMap(R => R.decors || []);
  const wallClocks = decors.filter(d => d.type === 'clock'), oneWall = wallClocks.length === 1 && !decors.some(d => d.type === 'catclock');
  for (const L of locks) {
    if (L.kind === 'code' && (L.tv || L.puzzle || L.part.lock.tv || L.part.lock.puzzle || S.spec.torn)) continue;   // the code shows elsewhere: only the input changes
    const note = S.items.find(i => (i.role === 'note' || i.role === 'color') && i.forPart === L.part && i.piece == null && !i.found);
    if (!note) continue;
    let src = null;
    if (L.kind === 'code' && S.spec.obsKind === 'poster') {
      const p = propSpot(S, L, posterProp, .4, used, rand, t0) || groundSpot(S, L, posterProp, used, rand, t0);
      if (p) { src = { kind: 'poster', code: '119', g: p.g, spot: p.s }; L.code = '119'; L.part.lock.code = '119'; note.code = '119'; }
    } else if (L.kind === 'code' && S.spec.obsKind === 'timetable') {
      // four trains from 10 to 12 o'clock, minutes in fives; ours (a 4-digit code) is starred
      const rows = [], dests = [T.d1, T.d2, T.d3, T.d4].map(tr);
      for (let i = 0; i < 4; i++) rows.push([10 + Math.floor(i * .75), 5 * (1 + Math.floor(rand() * 11)), dests[i]]);
      rows.sort((a, b) => a[0] * 60 + a[1] - b[0] * 60 - b[1]);
      const star = Math.floor(rand() * 4), code = `${rows[star][0]}${String(rows[star][1]).padStart(2, '0')}`;
      const build = () => timetableProp(rows, star);
      const p = propSpot(S, L, build, .35, used, rand, t0) || groundSpot(S, L, build, used, rand, t0);
      if (p) { src = { kind: 'timetable', rows, star, code, g: p.g, spot: p.s }; L.code = code; L.part.lock.code = code; note.code = code; }
    } else if (L.kind === 'code') {
      // the code becomes a time: hour 1–9, minutes in fives (a clock read at a glance, not to the minute)
      const n = +L.code || 0, H = 1 + n % 9, M = 5 * (Math.floor(n / 9) % 12), code = `${H}${String(M).padStart(2, '0')}`;
      if (oneWall && !used.has('wall')) { used.add('wall'); src = { kind: 'clock', wall: true, H, M, g: wallClockDial(wallClocks[0], H, M) }; }
      else { const p = propSpot(S, L, () => alarmClock(H, M), .27, used, rand, t0) || groundSpot(S, L, () => alarmClock(H, M), used, rand, t0); if (p) src = { kind: 'clock', wall: false, H, M, g: p.g, spot: p.s }; }
      if (src) { L.code = code; L.part.lock.code = code; note.code = code; }
    } else {
      // three different colours (a repeated one makes the sizes pointless): a repeat becomes the next unused colour
      const ds = []; for (const ch of L.code) { let d = +ch; while (ds.includes(d)) d = (d + 1) % LOCK_COLORS.length; ds.push(d); }
      const code = ds.join('');
      const order = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      if (order[0] === 0 && order[1] === 1) [order[1], order[2]] = [order[2], order[1]];   // never already small-to-big left to right
      const p = propSpot(S, L, () => vaseTrio(code, order), .3, used, rand, t0) || groundSpot(S, L, () => vaseTrio(code, order), used, rand, t0);
      if (p) { src = { kind: 'vase', order, code, g: p.g, spot: p.s }; L.code = code; L.part.lock.code = code; note.code = code; }   // (only once it stands: else the note keeps its own answer)
    }
    if (!src) continue;   // nowhere for it: the note keeps its answer (the dial still asks for it)
    if (src.spot && !src.spot.ground) { used.add(src.spot.furn); src.spot.item = { obs: src }; }
    const it = { type: 'obs', role: 'obs', obs: src, g: src.g, spot: src.spot || { kind: 'on', label: tr(T.lookClock), part: null }, found: false };
    src.g.traverse(o => { if (o.isMesh && !o.userData.proxy) o.castShadow = true; });
    src.g.userData.item = it; S.items.push(it);
    O.src.set(L.part, src); src.note = note;
    restyleNote(note, src.kind);
  }
  O.ms = Math.round(performance.now() - t0);   // (it runs while the stage loads)
  return O;
}

// ── picking up the note: where to look, not the answer
export async function obsClue(S, it, s) {
  const src = S.obs?.src.get(it.forPart); if (!src || it.piece != null || src.note !== it) return false;
  const G = S.G;
  if (src.kind === 'poster' || src.kind === 'timetable') {
    S.codes.add(it.code);
    const P = S.codePill; P.style.display = ''; P.classList.remove('need'); P.set(src.kind === 'poster' ? '📋 ? ? ?' : '🚆 ?:??');
    await G.ui.flyImg(G.thumbs.item_note, s.x, s.y, P, { size: 64 });
    G.ui.toast(tr(src.kind === 'poster' ? T.notePoster : T.noteTimetable), 'green');
  } else if (src.kind === 'clock') {
    S.codes.add(it.code);
    const P = S.codePill; P.style.display = ''; P.classList.remove('need'); P.set('🕐 ?:??');
    await G.ui.flyImg(G.thumbs.item_note, s.x, s.y, P, { size: 64 });
    G.ui.toast(tr(src.wall ? T.noteWall : T.noteAlarm), 'green');
  } else {
    S.colorCodes.add(it.code);
    const P = S.colorPill; P.style.display = ''; P.classList.remove('need'); P.querySelector('.v').textContent = '🏺 ? ? ?';
    await G.ui.flyImg(G.thumbs.item_colornote, s.x, s.y, P, { size: 64 });
    G.ui.toast(tr(T.noteVase), 'green');
  }
  S.pointAt(it.forPart);
  return true;
}

// ── the inputs
let css = false;
function style() {
  if (css) return; css = true;
  const st = document.createElement('style');
  st.textContent = `.obs-hint{font-size:17px;color:#6a5a8a;margin:2px 0 10px;text-align:center;word-break:keep-all}.obs-hint.bad{color:#e8455f}
.obs-dial{display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0 6px}
.obs-w{display:flex;flex-direction:column;align-items:center;gap:4px;touch-action:none}
.obs-a{width:58px;height:40px;border-radius:14px;background:#efe6ff;color:#5b4b8a;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 0 #cdbdf0}
.obs-a span{display:inline-block}.obs-a.dn span{transform:rotate(180deg)}
.obs-n{width:58px;height:68px;border-radius:16px;background:#3b3f5c;color:#9ff0c8;font-size:44px;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:inset 0 3px 0 rgba(0,0,0,.25)}
.obs-colon{font-size:40px;color:#3b2a55;font-weight:bold;margin:0 -2px}
.obs-lab{display:flex;justify-content:center;gap:8px;font-size:14px;color:#8a7aa8;margin-bottom:6px}
.obs-lab span{width:58px;text-align:center}.obs-lab span.w2{width:124px}
.obs-slots{display:flex;justify-content:center;gap:14px;margin:4px 0 12px}
.obs-slot{width:46px;height:46px;border-radius:50%;border:4px dashed #c9bcd8;box-sizing:border-box}
.obs-slot.on{border:4px solid #3b2a55}
.obs-pal{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.obs-c{width:46px;height:46px;border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(42,26,61,.35);cursor:pointer}
.obs-shake{animation:obsShake .36s}
@keyframes obsShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
.obs-big{display:block;margin:0 auto 6px;width:min(230px,60vw);height:auto;border-radius:18px}`;
  document.head.append(st);
}
const tapEl = (el, fn) => { el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('pointerup', e => { e.stopPropagation(); fn(e); }); return el; };
function wrongTry(S, part, box, res, hintEl) {
  const W8 = S.obs?.wrong || (S._lockWrong ||= new Map()), G = S.G, n = (W8.get(part) || 0) + 1; W8.set(part, n);
  G.audio.sfx('locked'); box.classList.remove('obs-shake'); void box.offsetWidth; box.classList.add('obs-shake');
  // said in the panel itself (a toast sat dimmed behind it)
  if (hintEl) { hintEl._t ??= hintEl.textContent; hintEl.textContent = '❌ ' + tr(T.wrong); hintEl.classList.add('bad'); clearTimeout(hintEl._to); hintEl._to = setTimeout(() => { hintEl.textContent = hintEl._t; hintEl.classList.remove('bad'); }, 1300); }
  if (n === 3 && S.obs && S.offerRobot) setTimeout(() => { G.ui.closePanel(); res(false); setTimeout(() => !S.dead && !S.result && part.lock && S.offerRobot(part), 400); }, 500);   // (R4's 척척 로봇; a plain lock just starts over)
}
function dialPanel(S, part, src) {
  style();
  return new Promise(res => {
    const G = S.G, L = part.lock, v = [...L.code].map(() => 0), nums = [];   // (as many wheels as the code has digits)
    const close = () => res(false);
    const wheel = i => {
      const n = h('div', { class: 'obs-n' }, '0'); nums.push(n);
      const set = d => { v[i] = (v[i] + d + 10) % 10; n.textContent = String(v[i]); G.audio.sfx('tock'); };
      let y0 = null, acc = 0;
      n.addEventListener('pointerdown', e => { e.stopPropagation(); y0 = e.clientY; acc = 0; try { n.setPointerCapture(e.pointerId); } catch {} });
      n.addEventListener('pointermove', e => { if (y0 == null) return; acc += y0 - e.clientY; y0 = e.clientY; while (Math.abs(acc) >= 26) { set(acc > 0 ? 1 : -1); acc -= Math.sign(acc) * 26; } });
      n.addEventListener('pointerup', e => { e.stopPropagation(); y0 = null; });
      return h('div', { class: 'obs-w' }, tapEl(h('div', { class: 'obs-a' }, h('span', {}, '▲')), () => set(1)), n, tapEl(h('div', { class: 'obs-a dn' }, h('span', {}, '▲')), () => set(-1)));   // (the game font has no ▼: the ▲ turned over)
    };
    const clock = src?.kind === 'clock';
    const dial = h('div', { class: 'obs-dial' }, wheel(0), clock ? h('div', { class: 'obs-colon' }, ':') : null, ...v.slice(1).map((_, i) => wheel(i + 1)));
    const lab = clock ? h('div', { class: 'obs-lab' }, h('span', {}, tr(T.hour)), h('span', { style: 'width:14px' }), h('span', { class: 'w2' }, tr(T.min))) : null;
    const hint = clock ? (src.wall ? T.hintWall : T.hintAlarm) : src?.kind === 'poster' ? T.hintPoster : src?.kind === 'timetable' ? T.hintTimetable : S.codes.has(L.code) ? T.hintCode : T.hintNoCode;
    const hintEl = h('div', { class: 'obs-hint' }, (clock ? '🕐 ' : src?.kind === 'poster' ? '📋 ' : src?.kind === 'timetable' ? '🚆 ' : '🔢 ') + tr(hint));
    const go = () => {
      if (v.join('') === L.code) { G.ui.closePanel(); if (clock) S.codePill.set(`🕐 ${L.code[0]}:${L.code.slice(1)}`); res(true); return; }
      wrongTry(S, part, dial, res, hintEl);
    };
    G.ui.panel({ title: tr(T.title), color: 'blue', close, cls: 'obs-panel', body: [hintEl, dial, lab].filter(Boolean),
      buttons: [G.ui.btn(tr(T.open), { color: 'green', onClick: go })] });
  });
}
function colorPanel(S, part, src) {
  style();
  return new Promise(res => {
    const G = S.G, L = part.lock, picked = [], N = L.code.length;
    const slots = [...L.code].map(() => h('div', { class: 'obs-slot' })), row = h('div', { class: 'obs-slots' }, ...slots);
    const paint = () => slots.forEach((el, i) => { const d = picked[i]; el.classList.toggle('on', d != null); el.style.background = d != null ? LOCK_COLORS[d][0] : ''; });
    const pick = d => {
      if (picked.length >= N) return;
      picked.push(d); paint(); G.audio.sfx('pop', 3 + picked.length * 2);
      if (picked.length < N) return;
      if (picked.join('') === L.code) { setTimeout(() => { G.ui.closePanel(); if (src?.kind === 'vase') S.colorPill.querySelector('.v').innerHTML = '🏺 ' + picked.map(d => `<i class="cdot" style="background:${LOCK_COLORS[d][0]}"></i>`).join(''); res(true); }, 220); return; }
      wrongTry(S, part, row, res, hintEl); setTimeout(() => { picked.length = 0; paint(); }, 420);
    };
    const pal = h('div', { class: 'obs-pal' }, ...LOCK_COLORS.map(([c], d) => tapEl(h('div', { class: 'obs-c', style: `background:${c}` }), () => pick(d))));
    const hintEl = h('div', { class: 'obs-hint' }, src?.kind === 'vase' ? '🏺 ' + tr(T.hintVase) : '🎨 ' + tr(T.hintColor));
    G.ui.panel({ title: tr(T.colorTitle), color: 'blue', close: () => res(false), cls: 'obs-panel', body: [hintEl, row, pal],
      buttons: [G.ui.btn(tr(T.clear), { color: 'gray', onClick: () => { picked.length = 0; paint(); } })] });
  });
}
// every code / colour lock, not only R4's (③ 10/21, user on 22판: "이런 색깔 순서는 직접 넣게 해줄려? 뭔가 너무 다 자동이라"): once
// you know the code (the note, the colour card — the HUD keeps it as a hint), tapping the lock opens the same dial / colour
// buttons and you put it in yourself — wrong: 덜컹 and start over; right: 철컥. A bot just opens it
export async function lockInput(S, part) {
  if (S.obs) return obsInput(S, part);
  const G = S.G, L = part.lock;
  if (G.bot || S.botOn?.()) { await S.tw.wait(.3); return !S.dead; }
  S.paused = true;
  await newCard(G, L.kind);
  const ok = S.dead ? false : await (L.kind === 'code' ? dialPanel(S, part, null) : colorPanel(S, part, null));
  S.paused = false;
  return ok && !S.dead;
}
// stage.js asks this when a code / colour lock it could open is tapped: true = the right answer went in
export async function obsInput(S, part) {
  const G = S.G, L = part.lock;
  if (G.bot || S.obs.free.has(part)) { await S.tw.wait(.3); return !S.dead; }   // the bot knows the answer; 척척 로봇 opens it for you
  S.paused = true;
  await newCard(G, L.kind);
  const ok = S.dead ? false : await (L.kind === 'code' ? dialPanel(S, part, S.obs.src.get(part)) : colorPanel(S, part, S.obs.src.get(part)));
  S.paused = false;
  return ok && !S.dead;
}
// tapping the clock or the vases: a big look (no answer given — the same picture, just big enough for a phone)
export function obsLook(S, it) {
  const G = S.G, src = it.obs; if (G.bot || G.ui.panelOpen) return;
  style();
  const cv = document.createElement('canvas'); cv.className = 'obs-big';
  let sub;
  if (src.kind === 'clock') { cv.width = cv.height = 360; drawClock(cv.getContext('2d'), 360, src.H, src.M); sub = T.hands; }
  else if (src.kind === 'poster') { cv.width = 270; cv.height = 360; drawPoster(cv.getContext('2d'), 270, 360); sub = T.hintPoster; }
  else if (src.kind === 'timetable') { cv.width = 360; cv.height = 315; drawTimetable(cv.getContext('2d'), 360, 315, src.rows, src.star); sub = T.hintTimetable; }
  else { cv.width = 360; cv.height = 260; drawVases(cv.getContext('2d'), 360, 260, src.code, src.order); sub = T.vases; }
  G.audio.sfx('pop');
  S.paused = true;
  const close = () => { S.paused = false; };
  G.ui.panel({ title: tr(src.kind === 'clock' ? T.lookClock : src.kind === 'poster' ? T.lookPoster : src.kind === 'timetable' ? T.lookTimetable : T.lookVase), color: 'blue', close, body: [cv, h('div', { class: 'obs-hint' }, tr(sub))],
    buttons: [G.ui.btn(tr(T.ok), { color: 'green', onClick: () => { G.ui.closePanel(); close(); } })] });
}
