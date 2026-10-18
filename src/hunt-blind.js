// Places no view can see into, even with their door or lid open — measured 10/18 in every room an ordinary stage uses
// (a 9 cm probe at the spot, the default camera at 2 tilts × 6 turns, zoomed to it: seen from none). Under / behind
// places are left out on purpose: they are the hard ones, and a real thing there sticks out. Keyed by the furniture's
// type, the spot's label and index, and where the piece stands (×10, rounded) — so a room changed in 배치 편집 simply
// has no entries until it is measured again. The 숨은그림찾기 stages never put anything here (stages.js planStage avoid).
import * as THREE from 'three';
export const BLIND = {
  alley1: ['aircon|실외기 위|1|20,-20', 'garden|텃밭 상자 위|1|15,0', 'vending|자판기 위|2|0,-20'],
  alley3: ['garden|텃밭 상자 위|1|5,20', 'gate|대문 기둥 위|3|15,-25', 'gate|대문 안쪽|0|15,-25'],
  alleyhouse: ['bookshelf|책장 1층|2|30,-30', 'bookshelf|책장 1층|2|40,-30', 'bookshelf|책장 2층|1|40,-30', 'bookshelf|책장 3층|0|40,-30', 'counter|조리대 위|2|10,-30', 'counter|조리대 위|3|10,-30', 'counter|찬장 위칸|1|0,-30', 'counter|찬장 위칸|1|10,-30', 'desk|책상 위|3|15,-30', 'diningset|식탁 위|1|5,-10', 'dishcab|찬장 서랍|2|20,-30', 'dishcab|찬장 선반 위|4|20,-30', 'dishcab|찬장 아래칸|1|20,-30', 'dishcab|찬장 위칸|0|20,-30', 'fridge|냉동실|2|30,-30', 'fridge|냉장고 아래칸|0|30,-30', 'fridge|냉장고 위칸|1|30,-30', 'garden|무 뽑은 자리|0|-25,-30', 'gate|대문 안쪽|0|-25,-35', 'gate|대문 안쪽|1|-25,-35', 'plant|화분 흙 위|1|50,-30', 'wardrobe|옷장 아래칸|1|0,-30'],
  apt: ['balconywin|창틀 위|0|-35,-20', 'balconywin|커튼 뒤 창틀|1|-35,-20', 'diningset|의자 위|2|15,15', 'monstera|화분 흙 위|1|-30,-25', 'recordcab|레코드장 칸|1|-30,25', 'robovac|로봇청소기 위|0|-10,25', 'snackcart|간식 카트 가운데칸|1|30,-25', 'tvlow|TV장 위|3|-15,-25', 'wallshelf2|선반 아래칸|1|-35,10'],
  aptmap: ['bigfridge|냉장실 아래칸|0|10,-25', 'bookshelf|책장 1층|2|-10,-25', 'bookshelf|책장 2층|1|-10,-25', 'bookshelf|책장 3층|0|-10,-25', 'counter|조리대 위|2|40,-25', 'counter|조리대 위|3|40,-25', 'floorlamp|스탠드 쟁반|0|-30,-25', 'plant|화분 흙 위|1|50,-5', 'stool|의자 위|0|0,25', 'tvlow|TV장 위|3|-45,-25', 'wallrack|선반 아래칸|1|35,-30', 'wallrack|선반 위칸|2|35,-30', 'wallshelf2|선반 아래칸|1|-21,-30', 'wallshelf2|선반 아래칸|1|-65,10', 'wallshelf2|선반 위칸|0|-21,-30'],
  bear: ['bookshelf|책장 2층|1|25,-20', 'floorlamp|스탠드 쟁반|0|-25,-20', 'kotatsu|코타츠 위|1|-15,-10', 'monstera|화분 흙 위|1|25,-10'],
  bear2: ['bookshelf|책장 1층|2|-45,-20', 'bookshelf|책장 2층|1|-45,-20', 'catbowls|밥그릇 앞|1|45,20', 'counter|조리대 위|2|35,-20', 'counter|조리대 위|3|25,-20', 'counter|조리대 위|3|35,-20', 'table|탁자 위|1|-25,10', 'wallrack|선반 아래칸|1|30,-25', 'wallshelf|벽 선반|0|-50,15', 'wallshelf|벽 선반|1|-50,15'],
  bunnybath: ['plant|화분 흙 위|1|5,20', 'stool|의자 위|0|-35,10', 'vanity|세면대 위|1|35,-20', 'wallshelf2|선반 아래칸|1|36,-25', 'wallshelf2|선반 위칸|0|36,-25', 'wallshelf|벽 선반|0|-15,-25', 'wallshelf|벽 선반|1|-15,-25', 'wardrobe|옷장 아래칸|1|-35,-20'],
  cabin: ['bookshelf|책장 3층|0|-50,-30', 'counter|찬장 위칸|1|-20,-30', 'counter|찬장 위칸|1|-30,-30', 'desk|책상 위|3|-5,-30', 'dishcab|찬장 서랍|2|-10,-30', 'dishcab|찬장 선반 위|4|-10,-30', 'dishcab|찬장 아래칸|1|-10,-30', 'dishcab|찬장 위칸|0|-10,-30', 'drawers|서랍장 위|3|-20,-30', 'drawers|서랍장 위|3|-40,-30', 'log|통나무 속|1|15,30', 'stool|의자 위|0|-10,-20', 'wardrobe|옷장 아래칸|1|-40,-30'],
  camp1: ['firewood|그루터기 위|1|15,-20', 'firewood|장작 옆|2|15,-20', 'lantern|캠핑 테이블 위|1|0,0'],
  camp2: ['log|통나무 위|2|-5,20', 'mushrooms|납작 버섯 위|1|-20,20', 'tent|텐트 옆|1|-5,-20'],
  campwide: ['firewood|그루터기 위|1|0,-25', 'log|통나무 위|2|-35,0'],
  firestation: ['bench|벤치 위|1|20,-5', 'firetruck|소방차 지붕 위|2|-15,-10', 'hosereel|호스 릴 위|1|-35,-25'],
  fishing: ['bench|벤치 위|1|15,-25', 'fishsign|간판 위|1|30,-25', 'pond|연잎 위|2|0,5'],
  house2f: ['bookshelf|책장 1층|2|-15,-30', 'bookshelf|책장 2층|1|-15,-30', 'bookshelf|책장 3층|0|-15,-30', 'counter|조리대 위|3|25,-30', 'counter|찬장 위칸|1|15,-30', 'desk|책상 위|3|-10,-30', 'diningset|의자 위|2|10,20', 'fridge|냉동실|2|5,-30', 'fridge|냉장고 아래칸|0|5,-30', 'fridge|냉장고 위칸|1|5,-30', 'plant|화분 흙 위|1|15,30', 'stool|의자 위|0|-15,-20', 'window|커튼 뒤 창틀|0|-30,-16'],
  house3: ['counter|조리대 위|3|20,-30', 'counter|찬장 위칸|1|20,-30', 'desk|책상 위|2|-25,-20', 'desk|책상 위|3|-25,-20', 'drawers|서랍장 위|3|20,-30', 'fridge|냉동실|2|10,-30', 'fridge|냉장고 아래칸|0|10,-30', 'fridge|냉장고 위칸|1|10,-30', 'kitchentable|식탁 위|2|15,-10', 'kitchentable|식탁 위|3|15,-10', 'monstera|화분 흙 위|1|-10,-10', 'recordcab|레코드장 칸|1|-20,-30', 'recordcab|레코드판 위|0|-20,-30', 'tvlow|TV장 가운데 칸|2|-25,30', 'tvlow|TV장 위|3|-25,30', 'wardrobe|옷장 아래칸|1|0,-30'],
  konbini: ['counter2|계산대 위|1|20,10', 'cupnoodlebar|컵라면 바 위|1|-25,5', 'magazinerack|신문 칸|1|25,-20', 'snackshelf|진열대 뒤편|2|0,0'],
  kpop: ['fanstool|팬 의자 위|0|-10,25', 'fanstool|팬 의자 위|0|0,15', 'fanstool|팬 의자 위|0|10,15', 'kpopstage|무대 오른쪽|2|0,-20', 'kpopstage|무대 위|1|0,-20', 'micstand|스탠드 받침|0|0,-5', 'speaker|스피커 위|0|-20,-25'],
  laundry: ['plant|화분 흙 위|1|-20,20', 'stool|의자 위|0|10,-10', 'washer3|건조기 안|1|0,-20'],
  lobby: ['lobbysofa|로비 소파 위|2|-10,10'],
  museum: ['artcrate|작품 상자 위|1|30,15', 'guidedesk|안내 데스크 위|1|15,25'],
  officefloor: ['bookshelf|책장 1층|2|-15,-20', 'bookshelf|책장 2층|1|-15,-20', 'coffeebar|커피 바 위|1|15,-20', 'filecab|캐비닛 위|3|45,0', 'kitchentable|식탁 위|2|20,0', 'officechair|의자 위|1|-15,20', 'officechair|의자 위|1|-45,10', 'officedesk|책상 위|2|-20,10', 'whiteboard|화이트보드 받침|0|-30,-25', 'window|커튼 뒤 창틀|0|50,0'],
  oneroom: ['loftbed|로프트 아래 책상|1|-20,-20', 'minikitchen|조리대 위|3|10,-20', 'shoerack|신발장 위|2|25,10'],
  park2: ['bench|벤치 위|1|-15,-20', 'pond|연잎 위|1|0,0', 'pond|연잎 위|2|0,0'],
  park3: ['picnic|돗자리 위|1|-20,0'],
  parkwide: ['bench|벤치 위|1|-20,25', 'picnic2|피크닉 테이블 위|1|20,-25', 'pond|연잎 위|0|5,5', 'pond|연잎 위|1|5,5', 'pond|연잎 위|2|5,5'],
  peng: ['bookshelf|책장 2층|1|-15,-20', 'bookshelf|책장 3층|0|-15,-20', 'futon|이불 속|1|20,-20', 'plantshelf|식물 선반 위칸|2|-25,10'],
  playground: ['picnic2|피크닉 테이블 위|1|5,25', 'sandbox2|모래 양동이 안|1|-25,10', 'streetlamp2|가로등 받침 위|0|30,5'],
  rooftop: ['antenna|안테나 받침 옆|0|5,-20'],
  school: ['bookshelf|책장 1층|2|-30,-25', 'plant|화분 흙 위|1|-20,-25', 'schooldesk|의자 위|2|-10,25', 'schooldesk|의자 위|2|20,25', 'schooldesk|책상 서랍 속|1|-10,25', 'schooldesk|책상 서랍 속|1|-10,5', 'schooldesk|책상 서랍 속|1|-20,25', 'schooldesk|책상 서랍 속|1|-20,5', 'schooldesk|책상 서랍 속|1|10,25', 'schooldesk|책상 서랍 속|1|10,5', 'schooldesk|책상 서랍 속|1|20,25', 'schooldesk|책상 서랍 속|1|20,5', 'schooldesk|책상 위|0|-10,25', 'schooldesk|책상 위|0|-10,5', 'schooldesk|책상 위|0|-20,5', 'schooldesk|책상 위|0|10,5'],
  shopmap: ['cupnoodlebar|컵라면 바 위|1|-55,5', 'foldingtable2|빨래 테이블 위|1|20,0', 'washer3|세탁기 안|0|15,-20'],
  street: ['bench2|정류장 벤치 위|1|-10,-10', 'vending|자판기 위|2|5,-30'],
  study: ['bookshelf|책장 3층|0|-25,-20', 'desk|책상 위|2|10,0', 'desk|책상 위|3|10,0', 'floorlamp|스탠드 쟁반|0|25,-20', 'secretshelf|책장 아래칸|1|0,-20', 'secretshelf|책장 위|3|0,-20', 'stool|의자 위|0|15,10'],
  trail: ['exerciser|운동기구 받침 위|0|30,25', 'lanterns|등 기둥 꼭대기|0|-5,25', 'pavilion|정자 마루 위|0|15,-20', 'woodstairs|계단 위 쉼터|1|-25,-5'],
};
const P = new THREE.Vector3();
export const spotKey = s => { s.furn?.group?.getWorldPosition(P); return `${s.furn?.type || '?'}|${s.label}|${s.idx ?? ''}|${Math.round(P.x * 10)},${Math.round(P.z * 10)}`; };
export function blindFor(room) {
  const set = BLIND[room] && new Set(BLIND[room]); if (!set) return null;
  return s => set.has(spotKey(s));
}
