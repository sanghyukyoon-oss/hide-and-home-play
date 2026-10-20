// B-1 그 집 물건 (스토리 세션 표 _handoff/item-pools-20261018.md, 10/18 밤 user "진행하자" — 갓겜 기획안 P0 L1): what each place's
// owner keeps about, from the models we have. A hidden-object stage takes nearly its whole list from here (n−1, n−2 from
// 8 up) and only tops up from the common TARGET_POOL; its decoys come from the same list's unused things + DECOY_POOL.
// Socks only at the laundromat. Rooms not listed keep their theme's own pool.
// (새 찾을 것 11종 10/20 — 새 물건 모델 세션: 판 주제 물건 하나씩, 자주 나오던 별·공·오리·귤 자리에; 3판 낚시터엔 찌·밀짚모자)
// each place's own new thing comes on its list every time (the rotation below could leave it out: 11·14·19판 did)
// (11·19판 are kit stages now — the cat tower, the fire truck: the bell ball goes to 15판's one-room, the helmet to 16판's school)
export const ROOM_FEATURE = { bunny: ['bunnyband'], fishing: ['bobber', 'strawhat'], peng: ['snowglobe'], house2f: ['snowglobe'], bear: ['honeypot'], bear2: ['honeypot'],
  bunnybath: ['soap'], museum: ['medal'], cat: ['bellball'], oneroom: ['bellball'], police: ['policecap'], policefront: ['policecap'], school: ['crayons', 'firehelmet'], firestation: ['firehelmet'] };
export const ROOM_POOLS = {
  bunny: ['donut', 'slipper', 'candy', 'cupcake', 'heart', 'bunnyband', 'teddy', 'gift'],
  bunnybath: ['rubberduck2', 'toothbrush', 'towel', 'tissue', 'slipper', 'donut', 'hairpin', 'soap'],
  school: ['pencil', 'postit', 'juicebox', 'hairpin', 'firehelmet', 'crayons', 'glasses', 'snack'],
  apt: ['remote', 'slipper', 'mandarin', 'gamepad', 'tissue', 'donut', 'cookie', 'milk'],
  aptkitchen: ['mandarin', 'milk', 'kimbap', 'onigiri', 'sandwich', 'cookie', 'tissue', 'apple'],   // (방마다 다른 물건 10/20 — user "비슷한 방이 계속 나옴": was the 거실's list)
  aptmap: ['remote', 'gamepad', 'console', 'gift', 'umbrella', 'keyring', 'coin', 'candy'],
  bear: ['teddy', 'cookie', 'snack', 'console', 'candy', 'gift', 'gamepad', 'honeypot'],   // (곰돌이 거실: 손님 줄 간식과 놀 거리 — 부엌과 따로, 10/20)
  bear2: ['milk', 'apple', 'honeypot', 'icecream', 'kimbap', 'onigiri', 'sandwich', 'cupcake'],   // (곰돌이 부엌: 부엌 것 — 거실과 따로, 10/20)
  house3: ['teddy', 'cookie', 'milk', 'cupcake', 'snack', 'mandarin', 'icecream', 'apple'],
  museum: ['medal', 'heart', 'crown', 'glasses', 'pencil', 'postit', 'teddy', 'gift'],
  study: ['glasses', 'stapler', 'coffee', 'apple', 'star', 'cookie', 'milk', 'pencil'],
  officefloor: ['glasses', 'pencil', 'postit', 'stapler', 'usb', 'coffee', 'receipt', 'apple'],
  peng: ['crown', 'snowglobe', 'icecream', 'milk', 'sunglasses', 'juicebox', 'ball', 'whistle'],
  house2f: ['crown', 'sunglasses', 'whistle', 'gamepad', 'ball2', 'umbrella', 'snowglobe', 'bubbletea'],   // (펭펭이 2층집 ≠ 다락 — 4판과 같은 목록이었어요, 10/20)
  cat: ['fishsnack', 'milk', 'teddy', 'heart', 'bellball', 'cookie', 'mandarin', 'icecream'],   // 냥냥이네 부엌 (11판; 레벨 세션)
  firestation: ['whistle', 'crown', 'firehelmet', 'juicebox', 'milk', 'ball', 'sunglasses', 'umbrella'],
  police: ['whistle', 'snack', 'cookie', 'policecap', 'umbrella', 'keyring', 'juicebox', 'idcard'],
  policefront: ['whistle', 'umbrella', 'coffee', 'fishcake', 'juicebox', 'policecap', 'keyring', 'sunglasses'],
  alley3: ['fishcake', 'coffee', 'umbrella', 'candy', 'keyring', 'bubbletea', 'gamepad', 'lottery'],
  alleyhouse: ['kimbap', 'onigiri', 'ball2', 'umbrella', 'gift', 'teddy', 'gamepad', 'slipper'],
  street: ['bubbletea', 'kimbap', 'onigiri', 'fishcake', 'umbrella', 'cookie', 'milk', 'whistle'],
  alley1: ['fishcake', 'earphones', 'gamepad', 'umbrella', 'coffee', 'lottery', 'receipt', 'keyring'],
  alleywide: ['fishcake', 'earphones', 'gamepad', 'umbrella', 'coffee', 'lottery', 'receipt', 'keyring'],
  skatepark: ['sunglasses', 'juicebox', 'bubbletea', 'ball2', 'earphones', 'gamepad', 'keyring', 'snack'],
  oneroom: ['earphones', 'ramen', 'keyring', 'toothbrush', 'coin', 'remote', 'slipper', 'bellball'],
  duplex: ['gamepad', 'console', 'bubbletea', 'coin', 'gift', 'sunglasses', 'umbrella', 'ramen'],   // (복층 ≠ 원룸 — 15·18판이 같은 목록이었어요, 10/20)
  park3: ['kimbap', 'onigiri', 'juicebox', 'candy', 'cookie', 'snack', 'keyring', 'coin'],
  konbini: ['receipt', 'sandwich', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap', 'ramen'],
  shopmap: ['receipt', 'sandwich', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap', 'ramen'],
  laundry: ['sockpair', 'towel', 'tissue', 'coin', 'slipper', 'receipt', 'coffee', 'keyring'],
  cafe: ['coffee', 'icecream', 'cupcake', 'donut', 'cookie', 'bubbletea', 'milk', 'candy'],
  playground: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  playgroundwide: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  park1: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  parkwide: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  fishing: ['rubberduck2', 'juicebox', 'duck', 'sunglasses', 'ball2', 'bubbletea', 'bobber', 'strawhat'],
  park2: ['acorn', 'gimbap2', 'juicebox', 'cookie', 'apple', 'snack', 'mandarin', 'candy'],
  trail: ['gimbap2', 'towel', 'whistle', 'map', 'onigiri', 'mandarin', 'acorn', 'bubbletea'],
  camp1: ['map', 'towel', 'gimbap2', 'onigiri', 'coffee', 'mandarin', 'whistle', 'umbrella'],
  cabin: ['map', 'towel', 'gimbap2', 'onigiri', 'coffee', 'mandarin', 'whistle', 'umbrella'],
  campwide: ['map', 'towel', 'gimbap2', 'onigiri', 'coffee', 'mandarin', 'whistle', 'umbrella'],
  camp2: ['teddy', 'milk', 'towel', 'slipper', 'candy', 'mandarin', 'cookie', 'tissue'],
  camp3: ['usb', 'remote', 'earphones', 'gamepad', 'console', 'keyring', 'idcard', 'stapler'],
  kpop: ['sunglasses', 'earphones', 'bubbletea', 'juicebox', 'postit', 'coffee', 'idcard', 'gamepad'],
};
// socks belong to the laundromat (user: "양말은 매번 찾고, 안 찾는 판에도 양말 나오고")
export const SOCKS = new Set(['sock', 'sockpair']);
export const SOCK_ROOMS = new Set(['laundry']);
