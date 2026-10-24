// B-1 그 집 물건 (스토리 세션 표 _handoff/item-pools-20261018.md, 10/18 밤 user "진행하자" — 갓겜 기획안 P0 L1): what each place's
// owner keeps about, from the models we have. A hidden-object stage takes nearly its whole list from here (n−1, n−2 from
// 8 up) and only tops up from the common TARGET_POOL; its decoys come from the same list's unused things + DECOY_POOL.
// Socks only at the laundromat. Rooms not listed keep their theme's own pool.
// (새 찾을 것 11종 10/20 — 새 물건 모델 세션: 판 주제 물건 하나씩, 자주 나오던 별·공·오리·귤 자리에; 3판 낚시터엔 찌·밀짚모자)
// each place's own new thing comes on its list every time (the rotation below could leave it out: 11·14·19판 did)
// (11·19판 are kit stages now — the cat tower, the fire truck: the bell ball goes to 15판's one-room, the helmet to 16판's school)
export const ROOM_FEATURE = { bunny: ['bunnyband'], fishing: ['bobber', 'strawhat'], peng: ['snowglobe'], house2f: ['snowglobe'], bear: ['honeypot'], bear2: ['honeypot'],
  bunnybath: ['soap'], museum: ['medal'], cat: ['bellball'], oneroom: ['bellball'], police: ['policecap'], policefront: ['policecap'], school: ['crayons', 'firehelmet'], firestation: ['firehelmet'],
  station: ['bobber'], island2: ['bobber', 'strawhat'], seaside: ['fishsnack'], bearbakery: ['honeypot'], library: ['crayons'] };
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
  otakuloft: ['gamepad', 'console', 'snack', 'ramen', 'sunglasses', 'gift', 'teddy', 'bubbletea'],   // 18판 너굴이네 복층 (오타쿠 방: 게임·간식 — 작은 모델 없이)
  park3: ['kimbap', 'onigiri', 'juicebox', 'candy', 'cookie', 'snack', 'keyring', 'coin'],
  konbini: ['receipt', 'sandwich', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap', 'ramen'],
  // 36판 새 안 밤의 문구점 (⑨ 10/23): 문구·장난감, 할머니 안경
  stationery: ['crayons', 'stapler', 'candy', 'snack', 'ball2', 'teddy', 'gamepad', 'glasses'],
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
  // (새 맵 10/21 — ② 레벨: 그 집 물건, 얇은 것 없이 — 넓은 맵이라 작게 보여요)
  villaroof2: ['bubbletea', 'juicebox', 'sunglasses', 'snack', 'icecream', 'cupcake', 'gift', 'mandarin'],   // 20판 옥상 집들이
  station: ['strawhat', 'bobber', 'kimbap', 'onigiri', 'juicebox', 'umbrella', 'map', 'bubbletea'],   // 27판 개굴이 낚시 가방
  traincar: ['onigiri', 'kimbap', 'juicebox', 'bubbletea', 'map', 'umbrella', 'sunglasses', 'gimbap2'],   // 28판 기차 객실 간식·여행 짐
  // (28판 기차 객실 2·3차 10/22 — 사용자 OK traincar3): 기차 간식·여행 짐, 작은 것 없이(주먹밥·주스팩·김밥은 14~20px로 나와서 뺌)
  traincar2: ['bubbletea', 'sandwich', 'snack', 'gimbap2', 'map', 'umbrella', 'sunglasses', 'strawhat'],
  traincar3: ['bubbletea', 'sandwich', 'snack', 'gimbap2', 'map', 'umbrella', 'sunglasses', 'strawhat'],
  island2: ['bobber', 'strawhat', 'rubberduck2', 'juicebox', 'sunglasses', 'gimbap2', 'duck', 'ball2'],   // 29판 호수 섬
  seaside: ['fishsnack', 'strawhat', 'icecream', 'sunglasses', 'bubbletea', 'coin', 'rubberduck2', 'juicebox'],   // 30판 바닷가 가게
  bearbakery: ['donut', 'cupcake', 'cookie', 'milk', 'honeypot', 'apple', 'candy', 'sandwich'],   // 35판 곰제과
  library: ['glasses', 'crayons', 'apple', 'milk', 'teddy', 'heart', 'star', 'coin'],   // 37판 도서관 (박사 "대출대에 누가 동전을")
  aptlobby2: ['umbrella', 'keyring', 'coffee', 'slipper', 'remote', 'gift', 'milk', 'ball2'],   // 38판 아파트 현관
  aptlobby3: ['umbrella', 'keyring', 'coffee', 'slipper', 'remote', 'gift', 'milk', 'ball2'],   // 38판 아파트 현관 3차
};
// 판별 찾을 것 목록 (19~70 다시 짜기 10/21 — 스토리 룸 plan-19to50·51to70.json itemKeys, ② 레벨이 넣음; 판 번호는 1부터): 이 판은 이 목록에서만
// 골라요(그 집 주인다운 것, 앞 3판과 겹침 0). 함정은 같은 종류를 빼요(planStage decoyTypes)
// (10/22 시트 7번 "추천대로": 6·7장에 큰 새 물건 10종 — ⑥ more-items.js — 캠핑 51~60 랜턴·침낭 베개·별자리 지도·마시멜로 꼬치, 빌딩 61~70 마이크·
// 응원봉·헤드폰·트로피·액자·비커; 하나에 두 판씩(랜턴 세 판), 앞 3판과 안 겹치게. 작은 휴지·하트·방울 공 자리를 비켜 줌)
export const STAGE_ITEMS = {
  20: ['gift', 'cupcake', 'mandarin', 'snack', 'icecream', 'honeypot'],
  22: ['policecap', 'umbrella', 'fishcake', 'glasses', 'slipper', 'mug', 'sunglasses', 'towel'],
  23: ['yarn', 'pot', 'books', 'tissue', 'snowglobe', 'stapler', 'heart', 'crayons'],
  24: ['star', 'crown', 'medal', 'gamepad'],
  25: ['apple', 'milk', 'onigiri', 'kimbap', 'ramen', 'candy', 'sandwich', 'donut'],
  26: ['ball', 'bellball', 'whistle', 'teddy', 'block', 'cookie', 'gift', 'cupcake'],
  27: ['bobber', 'strawhat', 'map', 'rubberduck2', 'snack', 'umbrella', 'mandarin', 'icecream'],
  28: ['console', 'mug', 'sunglasses', 'slipper', 'bunnyband'],
  29: ['tadpolejar', 'frogboots', 'snowglobe', 'umbrella', 'rubberduck2'],   // (10/24 사용자 "찾는 물건 신기하거나 좋아 보이는 걸로": 연못 집의 올챙이 병·개구리 장화)
  30: ['fishsnack', 'snowglobe', 'crown', 'star', 'towel', 'bellball'],
  32: ['sandwich', 'ramen', 'onigiri', 'kimbap'],
  33: ['sockpair', 'teddy', 'block', 'tissue', 'gift', 'slipper', 'bunnyband'],
  35: ['cupcake', 'donut', 'cookie', 'honeypot', 'milk', 'apple', 'icecream', 'heart'],
  36: ['umbrella', 'remote', 'glasses', 'mug', 'whistle', 'books', 'sunglasses', 'crown'],
  37: ['crayons', 'star', 'stapler', 'snowglobe', 'yarn', 'towel'],
  38: ['ramen', 'mandarin', 'kimbap', 'sandwich', 'juicebox', 'tissue'],
  39: ['duck', 'rubberduck2', 'bellball', 'teddy', 'medal', 'sockpair', 'block'],
  41: ['acorn', 'cookie', 'snack', 'donut', 'apple', 'honeypot', 'candy', 'strawhat'],
  42: ['ball', 'bobber', 'whistle', 'umbrella'],
  43: ['icecream', 'bunnyband', 'gamepad', 'crayons', 'crown', 'towel', 'console', 'gift'],
  44: ['fishsnack', 'mandarin', 'sandwich', 'milk', 'heart', 'star', 'mug', 'block'],
  45: ['rubberduck2', 'duck', 'teddy', 'bellball', 'sunglasses', 'glasses', 'medal', 'snowglobe'],
  46: ['slipper', 'cupcake', 'books', 'pot', 'yarn', 'tissue', 'remote'],
  47: ['acorn', 'cookie', 'donut', 'candy', 'snack', 'apple'],
  48: ['bobber', 'strawhat', 'map', 'fishcake', 'mug', 'heart', 'icecream', 'star'],
  50: ['towel', 'whistle', 'mandarin', 'sandwich', 'umbrella', 'block', 'gift', 'teddy'],
  51: ['crown', 'medal', 'bellball', 'snowglobe'],
  52: ['milk', 'slipper', 'sleeppillow', 'yarn', 'camplantern', 'duck'],
  53: ['gamepad', 'console', 'starmap', 'ball', 'star'],
  54: ['map', 'books', 'honeypot', 'pot', 'mug', 'smores'],
  55: ['acorn', 'strawhat', 'snack', 'towel', 'sockpair', 'block'],
  56: ['umbrella', 'mandarin', 'apple', 'camplantern', 'teddy', 'gift'],
  57: ['bobber', 'rubberduck2', 'crown', 'medal', 'sleeppillow', 'starmap'],
  58: ['candy', 'cookie', 'slipper', 'milk', 'smores'],
  59: ['star', 'duck', 'ball', 'books', 'pot'],
  61: ['mug', 'glasses', 'policecap', 'picframe', 'trophy', 'towel'],
  62: ['sunglasses', 'mic', 'gamepad', 'console', 'headphones', 'cheerstick'],
  63: ['medal', 'crown', 'snowglobe', 'beaker', 'books', 'pot'],
  64: ['stapler', 'crayons', 'apple', 'star', 'duck'],
  65: ['ball', 'rubberduck2', 'umbrella', 'block', 'camplantern', 'mug'],
  66: ['cupcake', 'donut', 'cookie', 'slipper', 'fishcake', 'trophy'],
  67: ['beaker', 'glasses', 'picframe', 'towel', 'books', 'teddy'],
  68: ['sunglasses', 'mic', 'gamepad', 'console', 'cheerstick'],
  69: ['pot', 'snowglobe', 'crown', 'medal', 'headphones'],
};
// socks belong to the laundromat (user: "양말은 매번 찾고, 안 찾는 판에도 양말 나오고")
export const SOCKS = new Set(['sock', 'sockpair']);
export const SOCK_ROOMS = new Set(['laundry']);
