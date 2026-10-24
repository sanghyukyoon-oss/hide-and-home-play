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
  // (28판 새 맵 traincar5 ⑧ 10/24, 사용자 "찾는 물건 다 새롭게 해줄래? 계속 찾는것만 찾으니 이상하다"): 기차 여행 물건 8 — gfx/trip-items.js + 귤·스노우볼
  traincar5: ['trainticket', 'ekiben', 'guidebook', 'filmcam', 'stampbook', 'thermos', 'mandarin', 'snowglobe'],
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
  // (10/24 ② 다양하게 — 사용자 "뒤쪽 판에 찾을 오브젝트들이 찾던 거 계속 찾는 거 같은데", "다양하게": 13~70판을 맵 주제 풀로 다시 —
  //  같은 물건 8판 안 다시 X, 70판에 5번까지, 안 쓰이던 GPT 물건 65종(부엌·학교·여행·바닷가·정원·악기…)을 그 주제 맵에; 이야기·장치 물건은 그대로)
  14: ['policecap', 'whistle', 'fishcake', 'gpt_oden', 'keyring', 'coin'],
  15: ['ramen', 'remote', 'diary', 'gpt_hairdryer', 'gpt_iron', 'gpt_lintroller', 'gpt_tapemeasure', 'gpt_hotwaterbottle', 'gpt_sewingkit', 'yarn'],
  16: ['crayons', 'stapler', 'books', 'gpt_calculator', 'gpt_scissors', 'gpt_abacus'],
  17: ['kimbap', 'gpt_teapot', 'gpt_fryingpan', 'gpt_colander', 'gpt_rollingpin', 'gpt_ovenmitt', 'gpt_juicer'],
  18: ['headphones', 'gpt_earphones', 'cookie', 'gpt_tambourine', 'gamepad', 'bubbletea', 'crown'],
  20: ['honeypot', 'gpt_wateringcan', 'gpt_gardengloves', 'gpt_kite', 'mug', 'towel', 'gift', 'gpt_racket'],
  21: ['policecap', 'whistle', 'gpt_receipt', 'gpt_binoculars', 'juicebox', 'coffee', 'fishcake', 'gpt_oden'],
  22: ['keyring', 'coin', 'umbrella', 'gpt_passport', 'gpt_neckpillow', 'gpt_traveladapter', 'gpt_luggagetag', 'map', 'gpt_coin', 'snack'],
  23: ['tissue', 'diary', 'gpt_hairdryer', 'gpt_iron', 'gpt_lintroller', 'gpt_tapemeasure', 'gpt_hotwaterbottle', 'gpt_sewingkit', 'yarn', 'remote'],
  24: ['star', 'medal', 'ball2', 'sunglasses', 'gpt_ukulele', 'bellball'],
  25: ['gpt_waffle', 'onigiri', 'mandarin', 'gpt_eggcarton', 'cookie', 'candy', 'icecream', 'ramen', 'sandwich', 'gpt_juicer'],
  26: ['ball', 'bellball', 'block', 'acorn', 'gpt_octopus', 'gpt_tambourine', 'bunnyband', 'crayons', 'strawhat', 'slipper'],
  27: ['map', 'bobber', 'strawhat', 'donut', 'bubbletea', 'kimbap', 'cupcake', 'pot', 'milk', 'apple'],
  // (28판 traincar5 ⑧ 10/24: 기차 여행 물건 — 판 목록에서만 뽑음, ROOM_POOLS만이면 공용 풀이 섞임)
  28: ['trainticket', 'ekiben', 'guidebook', 'filmcam', 'stampbook', 'thermos', 'mandarin', 'snowglobe'],
  29: ['tadpolejar', 'frogboots', 'snowglobe', 'umbrella', 'rubberduck2', 'gpt_conch', 'gpt_flippers'],   // (10/24 사용자 "찾는 물건 신기하거나 좋아 보이는 걸로": 연못 집의 올챙이 병·개구리 장화; ② 예비 둘: 소라·오리발)
  30: ['towel', 'duck', 'snack', 'crown', 'snowglobe', 'yarn', 'gamepad', 'gift'],
  32: ['gpt_waffle', 'onigiri', 'mandarin', 'gpt_eggcarton', 'cookie', 'candy'],
  33: ['gpt_deskbell', 'gpt_pricegun', 'gpt_coin', 'gpt_lintroller', 'gpt_iron', 'tissue', 'slipper', 'mug', 'diary'],
  35: ['donut', 'honeypot', 'juicebox', 'icecream', 'coffee', 'ramen', 'sandwich', 'gpt_juicer', 'gpt_oden', 'bubbletea'],
  36: ['gpt_triangleruler', 'gpt_palette', 'gpt_holepunch', 'gpt_drawingcompass', 'gpt_tapedispenser', 'gpt_gluegun', 'stapler', 'gpt_calculator', 'gpt_scissors', 'gpt_abacus'],
  37: ['crayons', 'books', 'picframe', 'glasses', 'block', 'pot', 'ball', 'milk'],
  38: ['gpt_hairdryer', 'gpt_tapemeasure', 'gpt_hotwaterbottle', 'gpt_sewingkit', 'remote', 'yarn', 'gpt_receipt', 'gift'],
  39: ['duck', 'rubberduck2', 'bellball', 'teddy', 'medal', 'sockpair', 'block'],
  40: ['gpt_deskbell', 'gpt_pricegun', 'gpt_coin', 'gpt_lintroller', 'gpt_iron', 'tissue', 'slipper', 'gpt_passport', 'gpt_neckpillow'],
  41: ['gpt_racket', 'gpt_gardengloves', 'gpt_wateringcan', 'gpt_octopus', 'gpt_kite', 'gpt_tambourine', 'gpt_ukulele', 'bellball', 'bunnyband', 'acorn'],
  42: ['ball2', 'strawhat', 'gpt_flippers', 'gpt_lifering', 'gpt_conch', 'fishsnack'],
  43: ['mic', 'cheerstick', 'headphones', 'gpt_earphones', 'gamepad', 'sunglasses', 'console', 'apple', 'teddy', 'heart'],
  44: ['block', 'ball', 'crayons', 'juicebox', 'icecream', 'coffee', 'ramen', 'sandwich', 'gpt_juicer', 'gpt_oden'],
  45: ['gift', 'pot', 'crown', 'star', 'towel', 'snowglobe', 'umbrella', 'milk', 'medal', 'books'],
  46: ['gpt_waffle', 'snack', 'onigiri', 'mandarin', 'gpt_eggcarton', 'donut', 'cookie', 'candy', 'bubbletea'],
  47: ['kimbap', 'cupcake', 'duck', 'glasses', 'yarn', 'remote', 'slipper', 'gpt_kite'],
  48: ['gpt_octopus', 'rubberduck2', 'bobber', 'gpt_racket', 'gpt_gardengloves', 'gpt_wateringcan', 'gpt_tambourine', 'gpt_ukulele', 'bellball', 'bunnyband'],
  49: ['acorn', 'ball2', 'strawhat', 'ball', 'block', 'gift', 'crayons', 'mic', 'headphones', 'cheerstick'],
  50: ['camplantern', 'smores', 'starmap', 'sleeppillow', 'gpt_teapot', 'gpt_binoculars', 'map', 'mug', 'gpt_conch', 'whistle'],
  51: ['honeypot', 'gpt_icecubetray', 'gpt_fryingpan', 'gpt_colander', 'gpt_rollingpin', 'gpt_ovenmitt'],
  52: ['camplantern', 'sleeppillow', 'diary', 'gpt_hairdryer', 'gpt_tapemeasure', 'gpt_hotwaterbottle', 'gpt_sewingkit', 'tissue'],
  53: ['starmap', 'beaker', 'gpt_telescope', 'trophy', 'picframe', 'gpt_palette', 'gpt_drawingcompass'],
  54: ['smores', 'map', 'apple', 'gpt_juicer', 'gpt_waffle', 'gpt_eggcarton', 'onigiri', 'milk'],
  55: ['gpt_gardengloves', 'gpt_racket', 'gpt_wateringcan', 'gpt_octopus', 'gpt_kite', 'gpt_tambourine', 'gpt_ukulele', 'bellball'],
  56: ['acorn', 'strawhat', 'mandarin', 'sandwich', 'kimbap', 'pot', 'teddy', 'heart'],
  57: ['gpt_teapot', 'gpt_binoculars', 'mug', 'gpt_conch', 'whistle', 'gpt_flippers', 'gpt_lifering', 'fishsnack'],
  58: ['honeypot', 'gpt_iron', 'gpt_lintroller', 'remote', 'glasses', 'yarn', 'crown'],
  59: ['camplantern', 'sleeppillow', 'gpt_icecubetray', 'gpt_fryingpan', 'gpt_colander', 'gpt_rollingpin', 'gpt_ovenmitt'],
  60: ['starmap', 'rubberduck2', 'bobber', 'towel', 'sunglasses', 'duck', 'block', 'bunnyband', 'ball', 'ball2'],
  61: ['picframe', 'trophy', 'gpt_tapedispenser', 'gpt_holepunch', 'gpt_calculator', 'stapler', 'gpt_deskbell', 'gpt_earphones'],
  62: ['mic', 'headphones', 'cheerstick', 'gamepad', 'gpt_ukulele', 'gpt_tambourine', 'console', 'snowglobe'],
  63: ['beaker', 'gpt_telescope', 'gpt_palette', 'gpt_drawingcompass', 'medal', 'gpt_triangleruler', 'gpt_gluegun', 'gpt_scissors'],
  64: ['mug', 'coffee', 'gpt_abacus', 'books', 'crayons', 'star', 'icecream'],
  65: ['crown', 'gpt_racket', 'gpt_gardengloves', 'gpt_wateringcan', 'gpt_octopus', 'gpt_kite', 'bellball', 'acorn'],
  66: ['snack', 'juicebox', 'ramen', 'gpt_waffle', 'gpt_oden', 'donut', 'cookie', 'candy'],
  67: ['umbrella', 'apple', 'pot', 'teddy', 'heart', 'towel', 'block', 'milk'],
  68: ['mic', 'gpt_earphones', 'bubbletea', 'headphones', 'cheerstick', 'gpt_ukulele', 'gpt_tambourine'],
  69: ['gpt_tapedispenser', 'gpt_holepunch', 'gpt_calculator', 'stapler', 'picframe', 'gpt_deskbell', 'trophy'],
  70: ['gamepad', 'onigiri', 'sandwich', 'mandarin', 'gpt_eggcarton', 'gpt_juicer', 'snowglobe', 'medal', 'mug', 'glasses'],
};
// socks belong to the laundromat (user: "양말은 매번 찾고, 안 찾는 판에도 양말 나오고")
export const SOCKS = new Set(['sock', 'sockpair']);
export const SOCK_ROOMS = new Set(['laundry']);
