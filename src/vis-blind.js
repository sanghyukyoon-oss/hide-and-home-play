// 가시성 검사에 걸린 자리 (② 10/29, 사용자 "소방차 숨기는 곳 바로 옆이 벽이라 보이지도 않아") — 19판부터만 안 씀(hunt-blind.js blindFor).
// 문을 연 채 화면 중심으로 끌어와 8방향 × 2기울기 × 2줌, 34 cm 물건이 손가락에 먼저 닿고 20 px 이상인 시점이 하나도 없는 자리;
// 정본 1.0.277, 폰 390×844. 다시 굽기: ~/sumbak-fix1029-lv/tools/vis.js (mkvis.py → visbake.py). 키: 가구|자리|번호|위치(hunt-blind.js spotKey)
export const VIS_BLIND = {
  firestation3b: ['fs3_house|옷 선반 위|4|0,0', 'firetruck|소방차 장비 칸|0|-19,-9', 'firetruck|소방차 장비 칸|1|-19,-9', 'firetruck|소방차 밑|3|-19,-9'],
  policefront3: ['patrolcar|순찰차 밑|3|-11,31'],
  skatebowl: ['skb_kiosk|매점 선반|1|29,-23'],
  cornershop3: ['cs3_goods|과자 칸 끝|1|-10,-35', 'cs3_goods|통조림 옆|3|-10,-35'],
  doghouse3: ['dishcab|찬장 위칸|0|-15,-30', 'dishcab|찬장 아래칸|1|-15,-30', 'wallshelf2|선반 위칸|0|-8,-35', 'wallshelf2|선반 아래칸|1|-8,-35'],
  laundry: ['washer3|세탁기 안|0|0,-20'],
  aptlobby3: ['dolly|손수레 밑|1|5,5', 'lobbysofa|로비 소파 밑|1|10,-15'],
  cabin: ['gptcabin_secret|회전 책장 뒤 선반|1|-45,-25', 'picture|액자 뒤|0|-55,-8', 'window|커튼 뒤 창틀|0|-55,-20'],
  officefloor: ['gptfusebox|두꺼비집 아래 케이블 칸|0|-30,-20'],
};
