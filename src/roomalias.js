// 방 키 별칭 (10/22, 스토리 룸 — _handoff/gpt-picks-1022.md · gpt-map-slots-1022.md): GPT로 다시 지은 맵은 옛 맵을 키로 남겨 두고
// 새 키로 바꿔 끼워요. 옛 방 키로 된 표(장면·보스 이야기·ifMap·방 줄, 장치·물건·숨김 자리·빛 …)가 새 키에서도 그대로 찾아지게
// '새 키 → 옛 키'를 여기 한 곳에 둬요. 새 키가 생기면 이 표에 한 줄만 더하면 돼요.
//   asRoom(key)  → 옛 키 하나 (별칭이 없으면 그 키 그대로) — 옛 키로 된 표 하나를 찾을 때
//   asRooms(key) → [그 키, 옛 키…] — 정확히 맞는 키를 먼저, 그다음 옛 키 순서로 찾을 때
// 맨 앞 옛 키가 대표예요. gptlongcar·gptsakura처럼 옛 맵이 없는 새 판도 가장 가까운 옛 방을 대표로 둬요(빛·물건 표 기본값용).
export const ROOM_AS = {
  // 18~28판 (①)
  gptotaku: 'otakuloft', gptfirestation: 'firestation', gptvillaroof: ['villaroof2', 'villaroof'], gptpolicefront: 'policefront',
  gptstreet: 'street', gptalley: 'alley1', gptcornershop: 'alley3', gptdoghouse: 'alleyhouse', gptdoghouse2: 'alleyhouse',
  gptstation: 'station', gpttraincar: 'traincar', gpttraincar2: ['traincar3', 'traincar'],
  // 기차 여행 끝 · 귀갓길 (10/22 새 판)
  gptlongcar: ['traincar2', 'traincar'], gptsakura: 'station', gptstation2: 'station', gptseastation: 'seaside',
  // 32~49판 (⑥)
  gptshopnight: 'shopmap', gptplaycontest: 'playground', gptplaynight: 'playground', gptplayhamster: 'park3',
  gptplaybig: 'playgroundwide', gptplaybig_open: 'playgroundwide', gptpark2: 'park2',
  // 50~70판 (⑥)
  gptcabin2: 'cabin', gptcampfire: 'campwide', gptcampfire_open: 'campwide', gptroof: 'rooftop', gptpractice: 'kpop',
  gptatrium: ['lobbymap', 'lobby'], gptatrium_open: ['lobbymap', 'lobby'], gptlab: 'officefloor', gptroom1: 'officefloor', gptroom1w: 'officefloor',
};
export const asRooms = key => [key, ...[].concat(ROOM_AS[key] || [])];
export const asRoom = key => [].concat(ROOM_AS[key] || key)[0];
