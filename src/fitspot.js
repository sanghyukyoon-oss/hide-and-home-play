// 자리에 맞는 물건 (10/19 저녁, 사용자 실폰: 3판 "축구공.. (작은 새집 안)", "도넛도 이렇게 뚫려 있다"(바구니 옆면), 5판 "스테이지5
// 열쇠 뚫어 버렸네? 크기 키우다가 ㅋ", 3판 "고무오리 얼굴이 바구니 쪽에 있음. 돌려 봐야 하는데"; 스토리 룸 원칙 "몸이 들어가야
// 해요 · 뚫고 박히면 안 돼요"): a thing goes to a place only if it fits there at the size it will be drawn.
//   size  — the drawn size (stage.js: ~34 cm on the longest side, at least 1.25×) is held to the place's box: its headroom
//           (maxH) and the room round it — four rays out from the place, low and at mid height, against its own piece of
//           furniture and the room's walls. Inside something (a drawer, a birdhouse, a basket) it keeps 10% air.
//           A tight place may draw its thing a little smaller (down to 80% of the wanted size); tighter than that, the place
//           is not used for that thing at all.
//   face  — a thing looks out of its hiding place: behind a piece, away from it (you find it from that side); in a drawer
//           or behind a door, out of the front; anywhere else at the start view.
// One test for the planner (stages.js fits), the first-screen tidy (tiers.js), the key moves (hunt.js) and the drawing
// (stage.js), so they never disagree. ?fit=0 turns the box test off (headroom only, as before).
import * as THREE from 'three';
import { ITEMS, buildItem } from './gfx/items.js';

const ON = typeof location === 'undefined' || !/[?&]fit=0(&|$)/.test(location.search);
const PROBE = typeof location === 'undefined' || !/[?&]probe=0(&|$)/.test(location.search);
const FAR = 1;                       // (a place with nothing round it within a metre is open)
const AIR_IN = 1.1, AIR_ON = 1;      // inside: 10% room to spare; on / under / behind: just clear (fitClear adds 1.5 cm)
const KEEP = .8;                     // the least of the wanted size a tight place may draw
const FOLIAGE = /^(bush|reeds|hedge|grass|shrub|flowerbed|haystack|leafpile)/;
// (and under covers — a pillow, a quilt, a cushion: a thing tucked under there peeks out, and that is a good hiding place —
// user 10/19 "베개 밑으로 살짝 삐져나온 건 왜 괜찮게 느껴지지", 스토리 룸 원칙 3)
const COVERS = /^(bed|futon|zabuton|kotatsu|catbed|bunkbed|hammock|cushion)/;   // (soft ones: not a sofa or a beanbag, whose firm body a thing went into — 겹침 QA v173 소파 쿠션 밑·빈백 밑)
export const nestles = spot => FOLIAGE.test(spot?.furn?.type || '') || (spot?.kind === 'inside' && COVERS.test(spot?.furn?.type || ''));   // (a bush, the reeds: a thing peeks out between the leaves)

// the model's own size at scale 1 (meshes only — the tap sphere is added later, in attachItem)
const NAT = new Map();
export function natSize(type) {
  let v = NAT.get(type); if (v) return v;
  if (!ITEMS[type]?.build) return new THREE.Vector3(.2, .2, .2);   // (not a thing of the list: a cameo, a story prop)
  const g = buildItem(type), b = new THREE.Box3(), bb = new THREE.Box3();
  g.updateMatrixWorld(true);
  g.traverse(o => { if (o.isMesh && o.geometry && o.visible !== false) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  v = b.isEmpty() ? new THREE.Vector3(.2, .2, .2) : b.getSize(new THREE.Vector3());
  NAT.set(type, v); return v;
}

// the size a thing is drawn at, as a multiple of the place's own scale (stage.js; was inline there)
const DECOY_LONG = .17, DECOY_MIN = .15;   // 흩뿌림 소품의 긴 변 (m): 적어도 이만큼은 크게, 이보다 작게밖에 안 되면 안 놓음
// 실제로 큰 흩뿌림 소품은 제 크기대로 (m, [바라는 긴 변, 이보다 작으면 안 놓음]): 접은 우산·밀짚모자가 20 cm, 슬리퍼가 10 cm로 장난감처럼
// 보였음 — 사용자 10/24 2판 "쓰레빠 웰케 작아짐… 작게 들어간 오브젝트 발견해서 크기 맞춰줘", 1~31판 측정(①)
// (② 10/25 판별 메모 "작게 들어간 물건 전체 크기 맞추기" — 32~70판 측정: 삽 42 → 19 cm, 수건 35 → 17 cm, 라켓 68 → 27 cm, 프라이팬
// 66 → 34 cm로 장난감처럼 → 제 크기 목록에; 찾을 물건이어도 이 크기를 원함)
export const DECOY_SIZE = { umbrella: [.55, .45], strawhat: [.36, .3], slipper: [.26, .22], ball2: [.24, .2], books: [.22, .19], gimbap2: [.21, .18],
  shovel: [.38, .3], towel: [.3, .24], gpt_racket: [.55, .42], gpt_fryingpan: [.42, .34] };
// 손바닥만 한 물건의 긴 변 상한(m) — 34 cm로 키우면 의자 좌석·화분·캐릭터보다 커짐 (아트 점검 2차 10/24: 왕관 10·17·63·69, 블록 55·65,
// 공 65, 도넛 1·2판, 머그 36; ②)
// (티슈 상자 22 cm: 23판 장독대에서 의자·평상보다 큰 장난감 상자처럼 보임 — GPT 정밀 QA ART-10, ②)
// (⑪ 10/24 밤: 33판 빨래방 바닥의 카운터 호출 종이 캐릭터 머리만 함 → 16 cm)
const KEY_IN = .2;
export const LONG_MAX = { crown: .2, block: .14, ball: .24, ball2: .24, donut: .17, mug: .18, tissue: .22, gpt_deskbell: .16 };
// (19판부터, 사용자 10/29 "펼쳐진 단서나 종이 중 너무 큰 게 있어": 펼친 종이는 손바닥만 하게 — 1~18판은 stage.js가 그린 뒤 줄임)
const PAPER_LONG = /^(note|notepiece|colornote|postit|letter|receipt|gpt_receipt|lottery|map|starmap|report|trainticket|ticket)$/;
const longMax = type => LONG_MAX[type] || (RULE && PAPER_LONG.test(type) ? .21 : 0);
export function wantScale(type, spot, role, want = .34) {
  // (a decoy: 1.08 of the place's scale, but never under ~17 cm on its longest side — in a small place a mug came out 12 cm and a
  // book stack 15 cm, ⑥ 10/24 5판 실폰 "ㅈㄴ 작은 컵이랑 책이 가끔 등장함")
  if (role === 'decoy') { const nat = natSize(type), big = Math.max(nat.x, nat.y, nat.z) || .2, D = DECOY_SIZE[type], d = Math.min(Math.max(1.08, Math.min(D ? 4 : 2.4, (D ? D[0] : DECOY_LONG) / (spot.scale || 1) / big)), RULE ? Math.max(D ? D[0] : .34, DECOY_LONG) / (spot.scale || 1) / big : Infinity); return longMax(type) ? Math.min(d, longMax(type) / (spot.scale || 1) / big) : d; }
  const nat = natSize(type), big = Math.max(nat.x, nat.y, nat.z) || .2;
  if (DECOY_SIZE[type]) want = Math.max(want, DECOY_SIZE[type][0]);
  // (19판부터 10/29 1.0.278 QA: 조립 부품(소방차 운전석 등)은 장난감 차 조각 — 38 cm 상한 밖, 48 cm)
  if (RULE && /^kit_/.test(type)) want = Math.max(want, .48);
  const room = (spot.maxH + .02) / Math.max(.01, (ITEMS[type]?.h || .2) * (spot.scale || 1));
  const ss = spot.scale || 1, lim = ITEMS[type]?.flat ? 2.4 : room;
  // (사용자 10/29 "19판부터 숨긴 물건들 전반적으로 너무 큼": 1.25배 이상 키우는 바닥값이 원래 큰 모델(GPT 라켓·소쿠리·가위)을 60~85 cm로
  // 만들었음 — 바라는 크기보다 이미 큰 모델은 바라는 크기로 줄여 그림; 작은 모델만 예전처럼 1.25배 이상)
  const base = want / ss / big;
  const sc = RULE && base < 1.25 && !/^kit_/.test(type) ? Math.min(lim, base) : Math.max(1.15, Math.min(lim, Math.max(1.25, Math.min(2.4, want / ss / big))));
  // (⑪ 10/26 9판 실폰 "여기 열쇠는 왜 이리 크고 못생겼냐": 방 안 세면대 위 열쇠가 30 cm — 실내 판(물건 크기 .42 밑)만 20 cm로; 넓은 바깥 맵은 그대로)
  if (type === 'key' && want < .42) return Math.min(sc, KEY_IN / ss / big);
  return longMax(type) ? Math.min(sc, longMax(type) / ss / big) : sc;
}

// the room round a place: free distance along the furniture's own ±x and ±z (and which way is out of its front)
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Vector3(), _b = new THREE.Box3();
// the room being planned: its walls, its matrices brought up to date — once per stage, before the planner (stage.js)
let WALLS = [], ROOMS = [];
// (사용자 10/29 "1~18은 어느 정도 완벽하게 해 놨으니까 건들지 말고 19부터 이후로 가자": 덮개 크기·얇은 덮개·크기 바닥값 규칙은 19판부터만 —
// stage.js가 판마다 켬; 1~18판·내 방·털기는 예전 그대로)
let RULE = false;
export const sizeRule = () => RULE;
export function fitPrep(room, rule = false) {
  WALLS = []; ROOMS = []; RULE = !!room && !!rule;
  if (!room?.group) return;
  ROOMS = (room.rooms || [room]).map(R => R.group);
  room.group.updateMatrixWorld(true);
  room.group.traverse(o => { if (o.isMesh && o.userData.wall) WALLS.push({ m: o, box: new THREE.Box3().setFromObject(o) }); });
}
// (fast: rays only against the walls within a metre of the place, and a piece's own meshes listed once — the first K took
// 60–250 ms a stage on a desktop to plan, 레벨 1~10 밸런스 10/19)
const wallsNear = p => WALLS.filter(w => w.box.distanceToPoint(p) < FAR).map(w => w.m);
const FMESH = new WeakMap();
function meshesOf(g) {
  let l = FMESH.get(g); if (l) return l;
  l = []; const walk = o => { if (o.userData.item) return; if (o.isMesh && !o.userData.proxy) l.push(o); for (const c of o.children) walk(c); };   // (not a thing put there)
  walk(g); FMESH.set(g, l); return l;
}
export function clearance(spot) {
  if (spot._clr) return spot._clr;
  const fg = spot.furn?.group, a = spot.anchor;
  if (!fg || !a) return (spot._clr = { px: FAR, nx: FAR, pz: FAR, nz: FAR });
  const rc = new THREE.Raycaster(); rc.far = FAR;
  a.getWorldPosition(_o);
  const own = meshesOf(fg).filter(o => o.visible !== false), targets = [...own, ...wallsNear(_o)];
  fg.getWorldQuaternion(_q);
  const out = {};
  // (one height, its middle: the place picked is tried again with the thing's own shape — shapeFits)
  const hs = [Math.min(.15, Math.max(.05, spot.maxH * .5)) * (spot.scale || 1)];
  for (const [k, x, z] of [['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]]) {
    _d.set(x, 0, z).applyQuaternion(_q); _d.y = 0; _d.normalize();
    let best = FAR;
    for (const h of hs) {
      a.getWorldPosition(_o); _o.y += h; rc.set(_o, _d);
      const hit = rc.intersectObjects(targets, false)[0];
      if (hit) best = Math.min(best, hit.distance);
    }
    out[k] = best;
  }
  // (and straight down its middle, from just under its headroom: a plant's stem, a floor lamp's pole running up through the
  // place — 겹침 QA 10/19, 5판 스탠드 쟁반 · 화분 흙 위 줄기 — nothing but a thing tucked under covers may sit round that)
  // (19판부터 10/29: 뚜껑 없는 통 안·옆 자리도 — 20판 빨래 기둥이 꽂힌 깡통 위 자리는 'beside')
  if ((spot.kind === 'on' || RULE && (spot.kind === 'inside' || spot.kind === 'beside') && !spot.part) && !spot.wallFace && !nestles(spot)) {   // (out on top of something only: a box's closed lid and its own insides are not a pole)
    const top = Math.max(.05, Math.min(spot.maxH, .5) - .02) * (spot.scale || 1);
    a.getWorldPosition(_o); _o.y += top; rc.set(_o, _d.set(0, -1, 0)); rc.far = top - .015;
    out.mid = rc.intersectObjects(own, false).length > 0;
  }
  return (spot._clr = out);
}

// the most this thing may be drawn at this place (× the place's scale): its headroom and the room round it
// under a cover you lift (a newspaper, a cushion, a pillow, a beanbag, a crate's top): only as tall as the gap under it when it
// lies shut, plus a soft cover's give (half its thickness) — 3판 a football came up from under a flat newspaper (user 10/20:
// "신문지 밑에서 축구공이 솟아났네.. 매직인가"); a sheet gives 1 cm. Measured once per place, while it is shut.
// (a soft one gives half its thickness, 6 cm at most: a 22 cm ball of yarn under a beanbag no)
const GAP = new WeakMap(), RESTS = /(신문지|담요|쿠션|베개|방석|빈백|이불|러그|매트) ?밑/;   // (a cover that lies on what it hides — not a box's lid or a birdhouse roof)
function coverGap(spot, box = false) {
  if (GAP.has(spot)) return GAP.get(spot);
  let v = null;
  const p = spot.part, a = spot.anchor;
  if (p?.pivots?.length && a && !(p.t > .05)) {
    const b = new THREE.Box3(), bb = new THREE.Box3();
    for (const pv of p.pivots) { pv.updateMatrixWorld(true); for (const m of meshesOf(pv)) { if (!m.geometry?.attributes?.position) continue; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); } }
    if (!b.isEmpty()) { const y = a.getWorldPosition(new THREE.Vector3()).y, thick = b.max.y - b.min.y; v = Math.max(0, b.min.y - y) + (box ? .01 : thick > .05 ? Math.min(.06, thick * .5) : .012); }
  }
  GAP.set(spot, v); return v;
}
export function capScale(type, spot, role) {
  if (!ITEMS[type]) return 0;
  if (type === 'friendtoken') return Infinity;   // (not a thing — the marker of where a friend hides)
  const cc = coverCap(type, spot); if (cc <= 0) return 0;
  // headroom (as before, but for the model's real height)
  const nat = natSize(type), ss = spot.scale || 1;
  let cap = ITEMS[type].flat || spot.kind === 'in' ? Infinity : (spot.maxH + .02) / Math.max(.01, nat.y * ss);
  if (spot.part?.kind === 'lift' && !ITEMS[type].flat && RESTS.test(spot.label || '')) { const g = coverGap(spot); if (g != null) cap = Math.min(cap, g / Math.max(.005, nat.y * ss)); }
  // (and in a box with a lid or a top that lifts — a toy chest, a cooler, a laundry basket, an art crate: no taller than the box is deep when shut; 2·5·7판's
  // 34–40 cm things stood 7–12 cm out of the toy chest, 9판's duck 20 cm out of the basket — 레벨 기획안 E, 10/20)
  else if ((spot.part?.kind === 'lid' || spot.part?.kind === 'lift') && spot.kind === 'inside' && !ITEMS[type].flat) { const g = coverGap(spot, true); if (g != null) cap = Math.min(cap, g / Math.max(.005, nat.y * ss)); }
  // the room round it (not for a wall frame, not sunk in a ball pit or a pond, where it is meant to be half in)
  // (not among leaves or reeds either: a thing nestled in a bush is meant to peek out between the stalks — 스토리 룸 원칙 3)
  if (ON && !spot.wallFace && spot.kind !== 'in' && !nestles(spot)) {
    const c = clearance(spot), air = spot.kind === 'inside' ? AIR_IN : AIR_ON;
    const cx = Math.min(c.px, c.nx), cz = Math.min(c.pz, c.nz);
    // squared to the furniture either way round (fitClear turns a long key along a cubby the same way)
    const fit = (w, d) => Math.min(cx / Math.max(.001, w / 2 * air), cz / Math.max(.001, d / 2 * air));
    cap = Math.min(cap, Math.max(fit(nat.x * ss, nat.z * ss), fit(nat.z * ss, nat.x * ss)));
    if (c.mid) return 0;
  }
  return Math.min(cap, cc);
}

// 가리는 것보다 큰 물건 X (사용자 10/29 실폰 "가린 물건보다 큰 물건이 나오지 않게 해줘 제발": 22판 전단지 밑 김밥, 포스터 뒤 우산,
// 방석보다 큰 연 — 납작한 물건(flat)은 높이 제한이 없고 벽 자리는 옆 공간도 안 재서 우산이 55 cm로 그려졌음): a thing under or behind
// something you lift, flip or draw aside is no longer or wider than that cover, and behind a thin sheet on a wall (a poster, a flyer,
// a frame) only a flat thing goes — 5 cm thick at most. The cover is measured in its own frame, shut (its moving pivots only).
const SHEETS = /^(lift|flip|curtain|picture|cushion|awning)$/, BOXY = /^(door|drawer|lid|slide|shutter|hatch)$/, THIN_IN = .05, COV = new WeakMap(), _cb = new THREE.Box3(), _cbb = new THREE.Box3(), _cm = new THREE.Matrix4(), _cs = new THREE.Vector3();
function coverSize(p) {
  if (COV.has(p)) return COV.get(p);
  let best = null;
  for (const pv of p.pivots || []) {
    pv.updateMatrixWorld(true); _cm.copy(pv.matrixWorld).invert(); _cb.makeEmpty();
    for (const m of meshesOf(pv)) { if (!m.geometry?.attributes?.position || m.visible === false) continue; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); _cb.union(_cbb.copy(m.geometry.boundingBox).applyMatrix4(new THREE.Matrix4().multiplyMatrices(_cm, m.matrixWorld))); }
    if (_cb.isEmpty()) continue;
    pv.getWorldScale(_cs); const d = [(_cb.max.x - _cb.min.x) * Math.abs(_cs.x), (_cb.max.y - _cb.min.y) * Math.abs(_cs.y), (_cb.max.z - _cb.min.z) * Math.abs(_cs.z)].sort((a, b) => b - a);
    if (!best || d[0] * d[1] > best[0] * best[1]) best = d;
  }
  COV.set(p, best); return best;
}
const THIN_AT = /(종이|전단지|포스터|액자|달력|메모판|게시판|벽보|지도판|그림|사진|러그|방석|커튼|신문지|매트)/;
const FLAT_OK = /^(note|notepiece|colornote|postit|letter|receipt|gpt_receipt|lottery|ticket|trainticket|photo|sticker|card|idcard|key|coin|gpt_coin|map|starmap|gpt_luggagetag|gpt_passport|report|stampbook)$/;
export function coverCap(type, spot) {
  if (!RULE) return Infinity;
  const p = spot?.part, sheet = !!p && (SHEETS.test(p.kind) || spot.wallFace && !BOXY.test(p.kind)); if (!sheet || !ITEMS[type]) return Infinity;
  const c = coverSize(p); if (!c) return Infinity;
  const n = natSize(type), ss = spot.scale || 1, d = [n.x, n.y, n.z].sort((a, b) => b - a);
  let cap = Math.min(c[0] * .95 / Math.max(.005, d[0] * ss), c[1] * .95 / Math.max(.005, d[1] * ss));
  // (허브 10/29 사용자 "종이 뒤에는 쪽지 같은 거나 작은 거 있어야지": 얇은 덮개 — 종이·전단지·포스터·액자·달력·메모판·러그·방석·커튼·신문지 — 는
  // 납작 전용 자리: 쪽지·사진·카드·열쇠·동전 같은 것만)
  if ((spot.wallFace && !BOXY.test(p.kind) || THIN_AT.test(spot.label || '') && !/위$/.test(spot.label || '') || c[2] < .035) && !FLAT_OK.test(type)) return 0;
  if (spot.wallFace && !BOXY.test(p.kind)) cap = Math.min(cap, THIN_IN / Math.max(.002, d[2] * ss));
  return cap;
}
// (the planner's last-chance place and the drawing's fallback draw a thing at .6 of its model at least: the cover has to take that)
export const coverFits = (type, spot) => coverCap(type, spot) >= .6;
// (the drawing: a thing a device or a fixed list put under a cover it does not fit — 24판 배수구 메달 — keeps its size, never 0; the planner never picks such a place)
export const coverDraw = (type, spot) => { const c = coverCap(type, spot); return c > 0 ? c : Infinity; };

// fitClear's measure, before the thing is there: its own model on the place at scale sc, turned square to the furniture
// either way, rays from its middle to the four sides against its furniture and the walls → how much of sc fits (1 = all)
const EDGE_KINDS = new Set(['on', 'behind', 'under']);   // (out in the open next to its piece; in a box the box's insides are fitClear's)
const PROTO = new Map(), _pb = new THREE.Box3(), _pbb = new THREE.Box3(), _pc = new THREE.Vector3(), _pd = new THREE.Vector3(), _po = new THREE.Vector3();
const _eb = new THREE.Box3(), _mb2 = new THREE.Box3(), _ta = new THREE.Vector3(), _tb = new THREE.Vector3(), _tc = new THREE.Vector3(), _ray = new THREE.Ray(), _hp = new THREE.Vector3();
const segIn = (p, q, box) => { const L = p.distanceTo(q); if (L < 1e-5) return false; _ray.origin.copy(p); _ray.direction.subVectors(q, p).divideScalar(L); return !!_ray.intersectBox(box, _hp) && _hp.distanceTo(p) <= L; };
// does any triangle of these meshes reach into the box (a corner inside it, or an edge through it)
function edgesThrough(meshes, box) {
  for (const m of meshes) {
    const g = m.geometry, pos = g?.attributes?.position; if (!pos) continue;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!_mb2.copy(g.boundingBox).applyMatrix4(m.matrixWorld).intersectsBox(box)) continue;
    const idx = g.index, n = idx ? idx.count : pos.count, mw = m.matrixWorld;
    for (let i = 0; i + 2 < n; i += 3) {
      _ta.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw);
      _tb.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mw);
      _tc.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mw);
      if (box.containsPoint(_ta) || box.containsPoint(_tb) || box.containsPoint(_tc) || segIn(_ta, _tb, box) || segIn(_tb, _tc, box) || segIn(_tc, _ta, box)) return true;
    }
  }
  return false;
}
function furnRoot(a) { let fr = a; while (fr.parent && !ROOMS.includes(fr.parent)) fr = fr.parent; return fr.parent ? fr : null; }
function probe(type, spot, sc, edgeOnly = false) {
  const key = type + '@' + sc.toFixed(3) + (edgeOnly ? 'e' : ''); spot._probe ||= {};
  if (spot._probe[key] != null) return spot._probe[key];
  const a = spot.anchor, fr = furnRoot(a);
  if (!fr || !ITEMS[type]?.build) return (spot._probe[key] = 1);
  let g = PROTO.get(type); if (!g) { g = buildItem(type); PROTO.set(type, g); }
  const mine = new Set(); g.traverse(o => mine.add(o));
  const rc = new THREE.Raycaster(); a.getWorldPosition(_pc);
  const targets = [...meshesOf(fr).filter(o => o.visible !== false), ...wallsNear(_pc)];
  a.add(g); g.position.set(0, 0, 0); g.scale.setScalar(sc * (spot.scale || 1));
  let best = 0;
  for (const ry of [0, Math.PI / 2]) {
    g.rotation.set(0, ry, 0); g.position.set(0, 0, 0); g.updateMatrixWorld(true); centerOn(g, spot);
    _pb.makeEmpty();
    g.traverse(o => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _pb.union(_pbb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
    if (_pb.isEmpty()) { best = 1; break; }
    _pb.getCenter(_pc);
    let k = 1;
    for (const [dx, dz, half] of [[1, 0, _pb.max.x - _pc.x], [-1, 0, _pc.x - _pb.min.x], [0, 1, _pb.max.z - _pc.z], [0, -1, _pc.z - _pb.min.z]]) {
      if (half <= .01) continue;
      rc.set(_pc, _pd.set(dx, 0, dz)); rc.far = half + .05;
      const hit = rc.intersectObjects(targets, false).find(h => !mine.has(h.object));
      if (hit) k = Math.min(k, (hit.distance - .015) / half);
      // and from its edge in to its middle (a ray that starts inside a stem or a pole never sees it): a plant's stem, a floor
      // lamp's pole, a swing's chain inside the thing's own outline — 겹침 QA 10/19 — and it doesn't go there at all
    }
    // out on top of something: no edge of the furniture's own triangles passes through the thing (a floor lamp's pole 1.2 cm
    // off the middle, a plant's thin slanting stem slipped between rays — 겹침 QA 10/20 실측). Its box less 5 mm a side, from
    // 1 cm above the place up (what it stands on is no crossing). In a box or a drawer the closed lid and the insides are fitClear's.
    if (EDGE_KINDS.has(spot.kind) || RULE && spot.kind === 'beside') {   // (and behind or under a piece: 10판's heart behind the big pot grazed it 4 cm — 겹침 QA v178)
      a.getWorldPosition(_po);
      // (at the size it will be drawn: shrunk by k round its middle when the side rays said a little less fits)
      const kk = edgeOnly ? 1 : Math.max(0, Math.min(1, k)), hx = (_pb.max.x - _pb.min.x) / 2 * kk, hz = (_pb.max.z - _pb.min.z) / 2 * kk;
      _eb.min.set(_pc.x - hx + .005, _pb.min.y, _pc.z - hz + .005); _eb.max.set(_pc.x + hx - .005, _pb.min.y + (_pb.max.y - _pb.min.y) * kk, _pc.z + hz - .005);
      _eb.min.y = Math.max(_eb.min.y, _po.y + .01);
      if (!_eb.isEmpty() && edgesThrough(meshesOf(fr).filter(o => o.visible !== false), _eb)) k = 0;
    }
    if (edgeOnly) { best = k > 0 ? 1 : 0; if (best) break; continue; }
    best = Math.max(best, k);
    if (best >= 1) break;
  }
  a.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
  return (spot._probe[key] = Math.max(0, best));
}
// (19판부터 10/29 1.0.280 실폰 20판 "연 뚫린 거 어케 해 봐": 빨래 기둥이 꽂힌 통 안의 연을 기둥이 관통): a thing as drawn — its box, 15% in from
// each side and from 1 cm above where it stands — has an edge of its own piece of furniture running through it (its own lid or door
// that covers it left out). smallfix.js unpierce moves it.
const _pb2 = new THREE.Box3(), _pbb2 = new THREE.Box3(), _pc2 = new THREE.Vector3(), _ps2 = new THREE.Vector3(), _pa2 = new THREE.Vector3();
export function pierced(g, spot) {
  const a = spot?.anchor, fr = a && furnRoot(a); if (!fr) return false;
  _pb2.makeEmpty(); g.updateMatrixWorld(true);
  g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _pb2.union(_pbb2.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  if (_pb2.isEmpty()) return false;
  _pb2.getCenter(_pc2); _pb2.getSize(_ps2).multiplyScalar(.35);
  a.getWorldPosition(_pa2);
  _eb.min.set(_pc2.x - _ps2.x, Math.max(_pc2.y - _ps2.y, _pa2.y + .01), _pc2.z - _ps2.z); _eb.max.set(_pc2.x + _ps2.x, _pc2.y + _ps2.y, _pc2.z + _ps2.z);
  if (_eb.isEmpty()) return false;
  const own = new Set(); for (const pv of spot.part?.pivots || []) pv.traverse(o => own.add(o));
  return edgesThrough(meshesOf(fr).filter(o => o.visible !== false && !own.has(o)), _eb);
}
// how big this thing is drawn at this place (× the place's scale), or 0 when it does not fit there
export function drawnScale(type, spot, role = 'target', want = .34) {
  const sc = wantScale(type, spot, role, want), cap = capScale(type, spot, role);
  if (cap >= sc) return sc;
  // (a decoy is clutter: in a tight place it may be drawn smaller, down to .6 — 3판 kept 2 of its 6 otherwise; but not under ~15 cm:
  // smaller it reads as a toy of itself, so the place gets none — ⑥ 10/24)
  if (role === 'decoy') { const nat = natSize(type), big = Math.max(nat.x, nat.y, nat.z) || .2; return cap >= .6 && cap * (spot.scale || 1) * big >= (DECOY_SIZE[type]?.[1] || DECOY_MIN) ? cap : 0; }
  // (19판부터: a big model drawn smaller than its own size keeps 80% of that)
  return cap >= (RULE && sc < 1 ? sc * KEEP : Math.max(1, sc * KEEP)) ? cap : 0;
}
export const spotFits = (type, spot, role) => drawnScale(type, spot, role) > 0;
// drawn at (nearly) the full size wanted — ~34 cm on its longest side: not held down by a low headroom (1장's place preference)
export const fullSize = (type, spot, min = .29) => { const n = natSize(type), d = drawnScale(type, spot, 'target'); return d > 0 && d * (spot.scale || 1) * Math.max(n.x, n.y, n.z) >= min; };   // (min: 19판부터 .33 — #94 10/21)
// the place a planner or a tidy has picked, tried with the thing's own shape the way the drawing's fitClear measures it, so the
// drawing doesn't shrink it again (겹침 QA 10/19: 52 places went down to 57%): true when it keeps 80% of the wanted size. Only
// for the place picked (a dozen a stage), not every candidate — every candidate cost 100–300 ms a stage.
export function shapeFits(type, spot, role = 'target') {
  if (!PROBE || spot.wallFace || spot.kind === 'in' || nestles(spot) || !ITEMS[type]?.build) return true;
  // (a decoy too, on top of something: nothing running through it — 겹침 QA 10/20, a pot on the monstera's soil)
  if (role === 'decoy') { if (!EDGE_KINDS.has(spot.kind) && !(RULE && spot.kind === 'beside')) return true; const d = drawnScale(type, spot, 'decoy'); return d > 0 && probe(type, spot, d, true) > 0; }
  const want = wantScale(type, spot, role), sc = drawnScale(type, spot, role);
  if (!(sc > 0) || sc >= want * 2) return sc > 0;
  return sc * probe(type, spot, sc) >= (RULE && want < 1 ? want * KEEP : Math.max(1, want * KEEP)) - 1e-6;
}

// which way a thing at this place looks (world yaw: its own +z, where a face or a label is, turned to it)
const VIEW = Math.PI / 4;   // (the start view: stage.js frameCamera — yaw π/4 for every stage)
const SIDEWAYS = new Set(['door', 'drawer', 'slide', 'shutter', 'hatch']);
export function faceYaw(spot) {
  const fg = spot.furn?.group;
  if (fg && spot.kind === 'inside' && spot.part && SIDEWAYS.has(spot.part.kind)) {   // out of the front it opens from
    fg.getWorldQuaternion(_q); _d.set(0, 0, 1).applyQuaternion(_q); return Math.atan2(_d.x, _d.z);
  }
  // in a cubby or on a shelf with sides and a back (walls close on three sides): out of the furniture's front, the open side
  const c = spot._clr;
  if (fg && c && (spot.kind === 'on' || spot.kind === 'inside') && [c.px, c.nx, c.nz].filter(v => v < .4).length >= 2) {
    fg.getWorldQuaternion(_q); _d.set(0, 0, 1).applyQuaternion(_q); return Math.atan2(_d.x, _d.z);
  }
  if (fg && spot.kind === 'behind' && spot.anchor) {   // away from the piece it hides behind
    _b.setFromObject(fg).getCenter(_c); spot.anchor.getWorldPosition(_o);
    const dx = _o.x - _c.x, dz = _o.z - _c.z; if (dx * dx + dz * dz > 1e-4) return Math.atan2(dx, dz);
  }
  return VIEW;
}
// turn a thing on its place so it looks that way (a little either side, so a room of things isn't all lined up)
const _e = new THREE.Euler();
export function faceItem(g, spot, jit = 0) {
  if (spot.wallFace || !spot.anchor || !g) return;
  spot.anchor.updateWorldMatrix(true, false); spot.anchor.getWorldQuaternion(_q); _e.setFromQuaternion(_q, 'YXZ');
  g.rotation.y = faceYaw(spot) - _e.y + jit;
}
// the thing sits in the middle of its place (a key's model starts at its ring: it hung out over the cubby's edge), feet where they were
const _m = new THREE.Vector3(), _w = new THREE.Vector3(), _bb = new THREE.Box3(), _mb = new THREE.Box3();
export function centerOn(g, spot) {
  if (spot.wallFace || !spot.anchor || !g?.parent) return;
  g.updateMatrixWorld(true); _mb.makeEmpty();
  g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _mb.union(_bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  if (_mb.isEmpty()) return;
  _mb.getCenter(_m); spot.anchor.getWorldPosition(_w); _m.y = _w.y;   // (only across: the height stays)
  const local = g.parent.worldToLocal(_m.clone()), at = g.parent.worldToLocal(_w.clone());
  g.position.x -= local.x - at.x; g.position.z -= local.z - at.z; g.updateMatrixWorld(true);
}
// the drawing: a thing on top of something, turned to look out, whose turned corners now reach into its furniture (a duck on a
// swing seat turned to the start view met the ropes, 겹침 QA 10/20) goes square to the furniture again — whichever way is clear
const _ib = new THREE.Box3(), _ibb = new THREE.Box3(), _ia = new THREE.Vector3();
function itemBox(g) { _ib.makeEmpty(); g.updateMatrixWorld(true); g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _ib.union(_ibb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } }); return _ib; }
export function squareIfCrossing(g, spot) {
  if (!PROBE || !g || !EDGE_KINDS.has(spot.kind) || spot.wallFace || nestles(spot) || !spot.anchor) return;
  const fr = furnRoot(spot.anchor); if (!fr) return;
  const ms = meshesOf(fr).filter(o => o.visible !== false);
  spot.anchor.getWorldPosition(_ia);
  const crosses = () => { const b = itemBox(g); if (b.isEmpty()) return false; b.min.x += .005; b.min.z += .005; b.max.x -= .005; b.max.z -= .005; b.min.y = Math.max(b.min.y, _ia.y + .01); return !b.isEmpty() && edgesThrough(ms, b); };
  if (!crosses()) return;
  const ry = g.rotation.y;
  for (const a of [0, Math.PI / 2]) { g.rotation.y = a; g.position.x = g.position.z = 0; centerOn(g, spot); if (!crosses()) return; }
  g.rotation.y = ry; g.position.x = g.position.z = 0; centerOn(g, spot);
}
// a thing on top of something sits on it: when the place's mark is a little under the board it stands on (a plant shelf's top
// shelf: 6–9 mm sunk, 겹침 QA v178), it comes up onto the surface — never more than 2 cm (a thing meant to sit in sand stays)
const _sd = new THREE.Vector3(0, -1, 0), _so = new THREE.Vector3(), _sl = new THREE.Vector3();
export function settleOn(g, spot) {
  if (!g || spot.kind !== 'on' || spot.wallFace || nestles(spot) || !spot.anchor || !g.parent) return;
  const fr = furnRoot(spot.anchor); if (!fr) return;
  const b = itemBox(g); if (b.isEmpty()) return;
  const rc = new THREE.Raycaster(); b.getCenter(_so); _so.y = b.min.y + .02; rc.set(_so, _sd); rc.far = .021;
  const hit = rc.intersectObjects(meshesOf(fr).filter(o => o.visible !== false), false)[0];
  if (!hit) return;
  const up = hit.point.y - b.min.y;
  if (up > .001 && up < .02) {   // (up by that much in the world, whatever the place's own frame is)
    const pw = g.parent.getWorldPosition(new THREE.Vector3()), a1 = g.parent.worldToLocal(pw.clone()), a2 = g.parent.worldToLocal(pw.clone().add(_sl.set(0, up, 0)));
    g.position.add(a2.sub(a1)); g.updateMatrixWorld(true);
  }
}
