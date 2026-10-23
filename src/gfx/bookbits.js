// 책 한 권·책 더미 (⑥ 10/23, 사용자 2~15판 메모 "이 책 어셋도 자주 나오는데 텍스쳐 좀 써서 재밌고 흥미롭게 다시"): a book that
// reads as a book even at a glance — two cover boards a hair bigger than the cream page block, a rounded spine, a title
// label by it, page lines on the fore-edge, and one small thing on the cover (a sticker dot, a stripe, a star or a heart) and
// sometimes a ribbon bookmark. Shared by every book pile (the desk's two books, the 책 decoy stack) so they all improve.
//   bookPieces(list) → [{ g: BufferGeometry, c: colour }] in the pile's own frame (y up from 0), to merge or mesh as a caller likes
//   list: [{ w, t, d, c, ry = 0, x = 0, z = 0, deco = 0..4, ribbon = false, spine = 1 | -1 }] bottom to top
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PAGE = '#fff4dc', PAGE_LINE = '#e6d3ae', GOLD = '#ffd66b', CREAM = '#fffaf0', RIBBON = '#ff5a7a';
const box = (w, h, d, r = 0) => (r > .002 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) * .45)) : new THREE.BoxGeometry(w, h, d));
const shade = (hex, k) => { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k))); return '#' + c.getHexString(); };
function star(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  return new THREE.ExtrudeGeometry(s, { depth: .002, bevelEnabled: false }).rotateX(-Math.PI / 2);
}
function heart(r) {
  const s = new THREE.Shape(); s.moveTo(0, -r);
  s.bezierCurveTo(r * 1.3, -r * .2, r * .7, r * 1.1, 0, r * .45); s.bezierCurveTo(-r * .7, r * 1.1, -r * 1.3, -r * .2, 0, -r);
  return new THREE.ExtrudeGeometry(s, { depth: .002, bevelEnabled: false }).rotateX(-Math.PI / 2);
}
export function bookPieces(list) {
  const out = [];
  let y = 0;
  for (const b of list) {
    const { w, t, d, c } = b, sp = b.spine || 1, M = new THREE.Matrix4().compose(new THREE.Vector3(b.x || 0, y, b.z || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.ry || 0, 0)), new THREE.Vector3(1, 1, 1));
    const P = (g, col, x, yy, z, rx = 0, ry = 0, rz = 0) => { g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, yy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))); g.applyMatrix4(M); out.push({ g, c: col }); };
    const bt = Math.min(.007, t * .18);   // a cover board
    // the boards and the spine (the spine side is +z for spine 1, −z for −1)
    P(box(w, bt, d, .002), c, 0, bt / 2, 0);
    P(box(w, bt, d, .002), c, 0, t - bt / 2, 0);
    P(new THREE.CylinderGeometry(t / 2, t / 2, w, 10, 1, false, -Math.PI / 2, Math.PI), c, 0, t / 2, sp * (d / 2 - .002), 0, sp > 0 ? 0 : Math.PI, Math.PI / 2);
    // the page block, set in from the three open edges, and two page lines on the fore-edge and the end
    P(box(w - .012, t - 2 * bt + .002, d - .01, .002), PAGE, 0, t / 2, -sp * .004);
    for (const f of [.36, .66]) {
      P(box(.002, .0025, d - .022), PAGE_LINE, w / 2 - .005, bt + (t - 2 * bt) * f, -sp * .004);
      P(box(w - .022, .0025, .002), PAGE_LINE, 0, bt + (t - 2 * bt) * f, -sp * (d / 2 - .0075));
    }
    // a title label on the cover by the spine (bands round the spine read as rubber bands — 10/23 첫 시안)
    P(box(w * .46, .002, .022, .001), b.band || GOLD, -w * .12, t + .0012, sp * (d / 2 - .03));
    // one thing on the cover
    const deco = b.deco ?? 0, top = t + .0012;
    if (deco === 0) P(new THREE.CylinderGeometry(.022, .022, .002, 16), CREAM, w * .18, top, -sp * d * .08);
    else if (deco === 1) P(box(w, .002, d * .16), shade(c, .16), 0, top, sp * d * .22);
    else if (deco === 2) P(star(.03), GOLD, w * .12, top, -sp * d * .05);
    else if (deco === 3) P(heart(.024), CREAM, w * .15, top, -sp * d * .05);
    else P(box(w * .5, .002, d * .32, .001), CREAM, w * .05, top, -sp * d * .05);
    if (b.ribbon) P(box(.012, .003, .05), RIBBON, -w * .22, t - bt - .001, -sp * (d / 2 + .018));
    y += t;
  }
  return out;
}
// a pile ready to place: n books, colours from cols, a little twist and size change each (seeded by v)
export function bookPile(n, cols, v = 0, { w = .24, d = .17, t = .042 } = {}) {
  const list = [];
  for (let k = 0; k < n; k++) {
    const s = 1 - k * .07, r = ((v * 7 + k * 5) % 9) / 9;
    list.push({ w: w * s, d: d * s, t: t * (.9 + r * .25), c: cols[(v + k) % cols.length], ry: (r - .5) * .5, deco: (v + k * 3) % 5, ribbon: k === n - 1 && v % 2 === 0, spine: k % 2 ? -1 : 1, x: (r - .5) * .02 });
  }
  return bookPieces(list);
}
// pieces → one Group, one merged mesh per colour (for builders that make meshes, not merged colour buffers)
export function piecesGroup(pieces, meshOf) {
  const by = new Map();
  for (const { g, c } of pieces) { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); (by.get(c) || by.set(c, []).get(c)).push(n); }
  const grp = new THREE.Group();
  for (const [c, gs] of by) grp.add(meshOf(mergeGeometries(gs, false), c));
  return grp;
}
