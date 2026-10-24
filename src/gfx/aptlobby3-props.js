// 38판 아파트 현관 3차 (10/24, 사용자 메모 "택배 트럭 뭐 그런 건가… 구조 설계 다시, 벽도 잘, 디테일 잘. '어서 오세요' 매트는 왜
// 아무 데나… 엘베는 스위치 누르면 엘베 오게끔"): the pieces the rebuilt lobby needs on top of aptlobby-props / building-props —
// the elevator that only comes when its call button is pressed, the stone
// pillar that closes the wall between the back wall's end and the glass, wall lamps, the welcome mat that lies flat at the door.
import * as THREE from 'three';
import { put, grp } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { BUILDING_BUILDERS } from './building-props.js';
import { SHOP_BUILDERS } from './shop-props.js';

const PI = Math.PI, HP = PI / 2;
const CREAM = '#f3eadc', STONE = '#e9dfd0', STONE2 = '#d9ccb9', TRIM = '#fbf6ee', STEEL = '#a9b0c2', STEEL2 = '#7d8498', INK = '#3a3048', WARM = '#ffe6a8';
const ease = t => t * t * (3 - 2 * t), seg = (t, a, b) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
const B = {};

// 엘리베이터 (wall, span 2): the travertine lift from the office lobby, but its doors no longer open by themselves — a call
// panel beside them with a big round ▲ button; pressed, the button lights, the arrow lamp over the doors counts the car
// down (a chime), then the doors slide open. Everything hidden in the car comes with that one button.
B.al3_elevator = (f, T) => {
  BUILDING_BUILDERS.elevator(f, T);
  const door = f.parts.pop();   // (the doors: moved only by the button now — not tappable on their own)
  door.setOpen(0); (f.live ||= []).push(...door.pivots);   // (still moving pieces — kept out of the static bake)
  // the call panel: a brushed plate standing proud of the cladding right of the doors, a big gold ▲ button over a small ▼
  // one — big enough to read and press on a phone; the whole plate is the button (it presses in)
  const panel = grp(); put(panel, .72, 1.08, .6); f.add(panel);
  panel.add(mc('al3-callplate', ({ add }) => {
    add(G.box(.26, .46, .03, .014), '#e6e9ef', 0, 0, 0);
    add(G.box(.28, .48, .012, .006), STEEL2, 0, 0, -.014);
    add(G.cyl(.03, .03, .014, 16), '#ffffff', 0, -.12, .02, HP, 0, 0);
    add(G.cone(.016, .02, 3), INK, 0, -.12, .03, 0, 0, PI, [1, 1, .3]);
    add(G.cone(.03, .04, 3), INK, 0, .07, .036, 0, 0, 0, [1, 1, .3]);
  }));
  const ring = new THREE.MeshStandardMaterial({ color: '#f2c94c', emissive: '#ffb020', emissiveIntensity: 0, roughness: .4 });
  const cap = new THREE.Mesh(G.cyl(.07, .07, .026, 22), ring); cap.rotation.x = HP; cap.position.set(0, .07, .018); cap.userData.noMerge = true; panel.add(cap);
  // the arrival lamp left of the floor display: a ▼ in a steel frame that lights as the car comes down
  const lampMat = new THREE.MeshStandardMaterial({ color: '#f6e7c4', emissive: '#ffcf5a', emissiveIntensity: 0, roughness: .5 });
  const lamp = grp(); put(lamp, -.4, 2.05, .6); f.add(lamp);
  lamp.add(mc('al3-lampframe', ({ add }) => add(G.box(.16, .16, .02, .01), STEEL2, 0, 0, 0)));
  const lit = new THREE.Mesh(G.cone(.045, .07, 3), lampMat); lit.rotation.set(HP, 0, PI); lit.scale.set(1, 1, .3); lit.position.set(0, 0, .014); lit.userData.noMerge = true; lamp.add(lit);
  const p = f.part('button', [panel, lamp], (t, bp) => {
    panel.position.z = bp.p.z - .014 * Math.sin(PI * seg(t, 0, .25));
    ring.emissiveIntensity = t > .02 && t < .98 ? .9 : 0;
    lampMat.emissiveIntensity = 1.2 * Math.sin(PI * seg(t, .15, .55)) + .6 * seg(t, .45, .6) * (1 - seg(t, .9, 1));
    door.setOpen(seg(t, .5, 1));
  }, { label: '엘리베이터 호출 버튼', sfx: 'stationChime', dur: 1.4 });
  for (const s of f.spots) { s.part = p; p.spots.push(s); }
  door.spots = [];
  f.callPart = p;
};

// 돌기둥 (floor, 1×1 at the wall's end): a cream stone pillar with a plinth and a trim cap — where the back wall stops, the
// glass wall starts against it (no gap between the lobby's wall and the entrance)
B.al3_pillar = (f, T) => {
  f.noOccupied = true;
  const H = 3.0;
  f.add(mc('al3-pillar', ({ add }) => {
    add(G.box(.36, H, .98, .03), STONE, 0, H / 2, 0);
    add(G.box(.42, .16, 1.0, .02), STONE2, 0, .08, 0);
    add(G.box(.42, .1, 1.0, .02), TRIM, 0, H - .05, 0);
    for (const y of [.95, 1.9]) add(G.box(.37, .015, .99, .004), STONE2, 0, y, 0);
  }));
  f.walkSolids = [[-.21, 0, -.5, .21, H, .5]];
};

// 벽등 (wall, span 1): a brass wall lamp with a frosted shade, warm, for the lobby's bare stretches
B.al3_sconce = (f, T) => {
  f.add(mc('al3-sconce', ({ add }) => {
    add(G.box(.12, .2, .02, .01), '#c9a25a', 0, 1.95, .01);
    add(G.box(.03, .03, .12, .01), '#c9a25a', 0, 1.95, .07);
    add(G.cyl(.08, .11, .16, 16), '#fff3d6', 0, 1.98, .15);
    add(G.cyl(.085, .085, .015, 16), '#c9a25a', 0, 2.065, .15);
  }));
};

// 어서 오세요 매트 (floor, flat, not a cell blocker): the welcome mat at the door, lying on the floor
B.al3_mat = (f, T, o = {}) => {
  f.noOccupied = true;
  SHOP_BUILDERS.doormat(f, T, { color: o.color || '#4f8f7a' });
  f.group.scale.set(1.3, 1, 1.3);
};

export const APTLOBBY3_BUILDERS = B;
export const APTLOBBY3_INFO = {
  al3_elevator: { wall: true, span: 2, name: '엘리베이터', hidden: true },
  al3_pillar: { w: 1, d: 1, name: '돌기둥', hidden: true },
  al3_sconce: { wall: true, span: 1, name: '벽등', hidden: true },
  al3_mat: { w: 1, d: 1, name: '어서 오세요 매트', hidden: true },
};
