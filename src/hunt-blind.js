// Places no view can see into, even with their door or lid open — measured 10/18 evening on 정본 v82 in every room an
// ordinary stage uses: a 9 cm probe at the spot with nothing else placed in the room (the first table, 10/18 afternoon,
// left the stage's things in place, so a spot with a thing on it read as unseen — 158 of its 209 entries were wrong),
// the camera centred on it at 2 tilts × 6 turns: seen from none. Under / behind places are left out on purpose: they
// are the hard ones, and a real thing there sticks out. Keyed by the furniture's type, the spot's label and index, and
// where the piece stands (×10, rounded) — so a room changed in 배치 편집 simply has no entries until it is measured
// again. The 숨은그림찾기 stages never put anything here (stages.js planStage avoid).
import * as THREE from 'three';
export const BLIND = {
  alley3: ['gate|대문 안쪽|0|15,-25'],
  alleyhouse: ['bookshelf|책장 1층|2|40,-30', 'bookshelf|책장 2층|1|40,-30', 'counter|찬장 위칸|1|0,-30', 'counter|찬장 위칸|1|10,-30', 'dishcab|찬장 서랍|2|20,-30', 'dishcab|찬장 선반 위|4|20,-30', 'dishcab|찬장 아래칸|1|20,-30', 'dishcab|찬장 위칸|0|20,-30', 'fridge|냉동실|2|30,-30', 'fridge|냉장고 아래칸|0|30,-30', 'fridge|냉장고 위칸|1|30,-30', 'garden|무 뽑은 자리|0|-25,-30', 'gate|대문 안쪽|0|-25,-35', 'gate|대문 안쪽|1|-25,-35', 'wardrobe|옷장 아래칸|1|0,-30'],
  aptmap: ['bigfridge|냉장실 아래칸|0|10,-25'],
  bunnybath: ['wardrobe|옷장 아래칸|1|-35,-20'],
  cabin: ['counter|찬장 위칸|1|-20,-30', 'counter|찬장 위칸|1|-30,-30', 'dishcab|찬장 서랍|2|-10,-30', 'dishcab|찬장 선반 위|4|-10,-30', 'dishcab|찬장 아래칸|1|-10,-30', 'dishcab|찬장 위칸|0|-10,-30', 'log|통나무 속|1|15,30', 'wardrobe|옷장 아래칸|1|-40,-30'],
  house2f: ['bookshelf|책장 1층|2|-15,-30', 'bookshelf|책장 2층|1|-15,-30', 'counter|찬장 위칸|1|15,-30', 'fridge|냉동실|2|5,-30', 'fridge|냉장고 아래칸|0|5,-30', 'fridge|냉장고 위칸|1|5,-30', 'window|커튼 뒤 창틀|0|-30,-16'],
  house3: ['counter|찬장 위칸|1|20,-30', 'desk|책상 위|2|-25,-20', 'desk|책상 위|3|-25,-20', 'fridge|냉동실|2|10,-30', 'fridge|냉장고 아래칸|0|10,-30', 'fridge|냉장고 위칸|1|10,-30', 'recordcab|레코드판 위|0|-20,-30', 'wardrobe|옷장 아래칸|1|0,-30'],
  laundry: ['washer3|건조기 안|1|-20,-20'],
  officefloor: ['window|커튼 뒤 창틀|0|50,0'],
  peng: ['futon|이불 속|1|20,-20'],
  school: ['schooldesk|책상 서랍 속|1|-10,25', 'schooldesk|책상 서랍 속|1|-10,5', 'schooldesk|책상 서랍 속|1|-20,25', 'schooldesk|책상 서랍 속|1|-20,5', 'schooldesk|책상 서랍 속|1|10,25', 'schooldesk|책상 서랍 속|1|10,5', 'schooldesk|책상 서랍 속|1|20,25', 'schooldesk|책상 서랍 속|1|20,5'],
  shopmap: ['washer3|세탁기 안|0|25,-20'],
};
const P = new THREE.Vector3();
export const spotKey = s => { s.furn?.group?.getWorldPosition(P); return `${s.furn?.type || '?'}|${s.label}|${s.idx ?? ''}|${Math.round(P.x * 10)},${Math.round(P.z * 10)}`; };
export function blindFor(room) {
  const set = BLIND[room] && new Set(BLIND[room]); if (!set) return null;
  return s => set.has(spotKey(s));
}
