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
  // school: the 8 '책상 서랍 속' spots left 10/18 — the desk cubby was a solid box; it's an open shelf now (town-props B.schooldesk)
  shopmap: ['washer3|세탁기 안|0|25,-20'],
  // 새 맵 (10/21, ②레벨 측정: 물건을 두고 문을 연 채 줌 1.3·24시점 중 손가락이 잡는 시점 2 미만 — map-art d2ba0b7 배치)
  station: ['platshelter|꽃상자 사이|2|-20,-20', 'treesakura|벚나무 뿌리 사이|0|5,-20'],
  seaside: ['cafeumbrella|파라솔 테이블 밑|0|25,30', 'cafeumbrella|파라솔 테이블 밑|0|35,20', 'fishstall|좌판 밑|0|10,10', 'fishstall|좌판 밑|1|10,10', 'seadeck|데크 밑|1|-25,-25',
    'flagdeck|데크 밑|1|-25,-25', 'chalksign|칠판 뒤|0|35,-20'],   // (② 10/21: 30판 ★ — the deck is the flag deck there, and the chalkboard's back)
  bearbakery: ['bkfacade|창 화분 상자|0|25,-25', 'bkparasol|접이식 의자 위|2|35,0', 'bkparasol|파라솔 테이블 밑|0|35,0', 'bkparasol|파라솔 테이블 위|1|35,0', 'breadbasket|빵 바구니 안|0|25,10', 'floursacks|사과 상자 위|1|15,0'],
  island: ['baitbucket|미끼통 뒤|1|-20,15', 'baitbucket|미끼통 안|0|-20,15', 'cooler|아이스박스 안|0|-30,15', 'cottage|창가 꽃상자|2|15,-20', 'lakedeck|챔피언 의자 밑|1|25,15', 'picnicset|그루터기 옆|2|5,10', 'rocks|바위 틈|0|30,-5', 'tacklebox|도구함 위|1|-20,5'],
  island2: ['baitbucket|미끼통 뒤|1|-20,15', 'baitbucket|미끼통 안|0|-20,15', 'cooler|아이스박스 안|0|-30,15', 'cottage|창가 꽃상자|2|15,-20', 'lakedeck|챔피언 의자 밑|1|25,15', 'picnicset|그루터기 옆|2|5,10', 'rocks|바위 틈|0|30,-5', 'tacklebox|도구함 위|1|-20,5'],
  library: ['readingnook|계단 밑|3|-25,-20', 'readingnook|다락 의자 위|1|-25,-20', 'libshelf|낮은 책장 칸|0|-20,10', 'libshelf|낮은 책장 칸|0|-10,10', 'libshelf|낮은 책장 칸|0|0,10'],
  villaroof2: ['snacktable|상 밑|0|-10,-15'],
  aptlobby: ['elevator|엘리베이터 안|0|-10,-30', 'movetruck|트럭 밑|0|30,-25'],
  aptlobby2: ['elevator|엘리베이터 안|0|-10,-30', 'movetruck|트럭 밑|0|30,-25'],
  bunnyattic: ['roundwin|동그란 창틀 위|0|-30,-5'],
  bunnyattic1: ['roundwin|동그란 창틀 위|0|-30,-5'],
};
const P = new THREE.Vector3();
export const spotKey = s => { s.furn?.group?.getWorldPosition(P); return `${s.furn?.type || '?'}|${s.label}|${s.idx ?? ''}|${Math.round(P.x * 10)},${Math.round(P.z * 10)}`; };
export function blindFor(room) {
  const set = BLIND[room] && new Set(BLIND[room]); if (!set) return null;
  return s => set.has(spotKey(s));
}
