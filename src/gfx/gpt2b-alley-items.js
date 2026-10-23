// 골목 프리뷰 전용 물건. 기존 earphones는 비교용으로 그대로 둔다.
// items.js 계약: 바닥 중앙이 원점인 Group, h는 열린 뚜껑까지의 실제 높이.
import * as THREE from 'three';
import { rbox, sph, cyl, put, grp, mat, mesh, geo } from './kit.js';

const WHITE = '#fffdf4', MINT = '#92cdbb', TRAY = '#596b72', GRILLE = '#283c45';

function roundedRect(path, w, d, r) {
  const x = -w / 2, z = -d / 2;
  path.moveTo(x + r, z);
  path.lineTo(x + w - r, z); path.quadraticCurveTo(x + w, z, x + w, z + r);
  path.lineTo(x + w, z + d - r); path.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
  path.lineTo(x + r, z + d); path.quadraticCurveTo(x, z + d, x, z + d - r);
  path.lineTo(x, z + r); path.quadraticCurveTo(x, z, x + r, z);
  path.closePath();
  return path;
}

// Real hollow shell: a bottom, a rounded rim with a hole, and two visible dark charging wells.
// No texture or opaque block fills the opening between the rim and the earbuds.
function caseRim() {
  const geometry = geo('gpt-earphone-case-rim-v1', () => {
    const shape = roundedRect(new THREE.Shape(), .35, .215, .067);
    const hole = roundedRect(new THREE.Path(), .296, .16, .047);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: .041, bevelEnabled: true, bevelThickness: .003, bevelSize: .003,
      bevelSegments: 1, curveSegments: 5,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  });
  return mesh(geometry, mat(WHITE, { rough: .6 }));
}

function earbud(side) {
  const g = grp();
  // Paired upright stems, a broad asymmetric earpiece and a short inward silicone nozzle.
  // The nozzle + dark speaker grille distinguish an earbud from a round spoon shape.
  g.add(put(cyl(.0135, .015, .084, WHITE, { rough: .55 }, 10), 0, .042, .009));
  g.add(put(sph(.033, WHITE, { rough: .55 }, 12, 8), side * .006, .092, -.002, 0, 0, .14 * side, [1.08, .82, .88]));
  g.add(put(sph(.021, '#e1e8e3', null, 10, 6), -side * .022, .092, .012, 0, 0, 0, [1.05, .75, .9]));
  g.add(put(sph(.014, GRILLE, null, 10, 6), -side * .027, .094, .025, -.25, .12 * side, 0, [.78, .65, .22]));
  g.add(put(rbox(.008, .021, .004, GRILLE, .002), side * .017, .092, .025));
  g.add(put(rbox(.011, .006, .005, '#c9b57f', .002), 0, .008, .023));
  return g;
}

export const GPT_ALLEY_ITEMS = {
  gptearphones: { name: '무선 이어폰', h: .25, build() {
    const g = grp();
    g.add(put(rbox(.351, .029, .216, MINT, .013), 0, .0145, 0));
    g.add(put(caseRim(), 0, .026, 0));
    g.add(put(rbox(.291, .008, .154, TRAY, .003), 0, .033, 0));
    for (const side of [-1, 1]) {
      // Deep wells are behind the raised white earpieces; both buds stay in their own seats.
      g.add(put(sph(.038, GRILLE, null, 12, 6), side * .082, .043, .014, 0, 0, 0, [1, .2, .9]));
      g.add(put(earbud(side), side * .082, .049, .01, 0, side * -.12, side * -.1));
    }
    // Hinge at the back, lid opened 66 degrees. Its pale inner panel faces the player.
    g.add(put(cyl(.015, .015, .21, MINT, null, 10), 0, .065, -.089, 0, 0, Math.PI / 2));
    const lid = put(grp(), 0, .076, -.089, -1.15);
    lid.add(put(rbox(.35, .024, .199, MINT, .011), 0, .004, .077));
    lid.add(put(rbox(.294, .009, .143, '#e3eee5', .004), 0, -.014, .077));
    for (const side of [-1, 1]) lid.add(put(sph(.03, '#c9dcd1', null, 10, 6), side * .081, -.020, .065, 0, 0, 0, [1.15, .13, .8]));
    g.add(lid);
    g.add(put(rbox(.025, .009, .005, '#d8f3a4', .003), 0, .043, .110));
    g.add(put(rbox(.045, .006, .007, '#c7d8c9', .002), 0, .010, .108));
    return g;
  } },
};
