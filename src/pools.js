// B-1 그 집 물건 (스토리 세션 표 _handoff/item-pools-20261018.md, 10/18 밤 user "진행하자" — 갓겜 기획안 P0 L1): what each place's
// owner keeps about, from the models we have. A hidden-object stage takes nearly its whole list from here (n−1, n−2 from
// 8 up) and only tops up from the common TARGET_POOL; its decoys come from the same list's unused things + DECOY_POOL.
// Socks only at the laundromat. Rooms not listed keep their theme's own pool.
export const ROOM_POOLS = {
  bunny: ['donut', 'slipper', 'candy', 'cupcake', 'heart', 'star', 'teddy', 'gift'],
  bunnybath: ['rubberduck2', 'toothbrush', 'towel', 'tissue', 'slipper', 'donut', 'hairpin', 'duck'],
  school: ['pencil', 'postit', 'juicebox', 'hairpin', 'donut', 'ball', 'glasses', 'snack'],
  apt: ['remote', 'slipper', 'mandarin', 'gamepad', 'tissue', 'donut', 'cookie', 'milk'],
  aptkitchen: ['remote', 'slipper', 'mandarin', 'gamepad', 'tissue', 'donut', 'cookie', 'milk'],
  aptmap: ['remote', 'slipper', 'mandarin', 'gamepad', 'tissue', 'donut', 'cookie', 'milk'],
  bear: ['teddy', 'cookie', 'milk', 'cupcake', 'snack', 'mandarin', 'icecream', 'apple'],
  bear2: ['teddy', 'cookie', 'milk', 'cupcake', 'snack', 'mandarin', 'icecream', 'apple'],
  house3: ['teddy', 'cookie', 'milk', 'cupcake', 'snack', 'mandarin', 'icecream', 'apple'],
  museum: ['star', 'heart', 'crown', 'glasses', 'pencil', 'postit', 'teddy', 'gift'],
  study: ['glasses', 'stapler', 'coffee', 'apple', 'star', 'cookie', 'milk', 'pencil'],
  officefloor: ['glasses', 'pencil', 'postit', 'stapler', 'usb', 'coffee', 'receipt', 'apple'],
  peng: ['crown', 'star', 'icecream', 'milk', 'sunglasses', 'juicebox', 'ball', 'whistle'],
  house2f: ['crown', 'star', 'icecream', 'milk', 'sunglasses', 'juicebox', 'ball', 'whistle'],
  cat: ['fishsnack', 'milk', 'teddy', 'heart', 'star', 'cookie', 'mandarin', 'icecream'],   // 냥냥이네 부엌 (11판; 레벨 세션)
  firestation: ['whistle', 'crown', 'star', 'juicebox', 'milk', 'ball', 'sunglasses', 'umbrella'],
  police: ['whistle', 'snack', 'cookie', 'ball', 'umbrella', 'keyring', 'juicebox', 'idcard'],
  policefront: ['whistle', 'snack', 'cookie', 'ball', 'umbrella', 'keyring', 'juicebox', 'idcard'],
  alley3: ['whistle', 'snack', 'cookie', 'ball', 'umbrella', 'keyring', 'juicebox', 'idcard'],
  alleyhouse: ['whistle', 'snack', 'cookie', 'ball', 'umbrella', 'keyring', 'juicebox', 'idcard'],
  street: ['bubbletea', 'kimbap', 'onigiri', 'fishcake', 'umbrella', 'cookie', 'milk', 'whistle'],
  alley1: ['fishcake', 'earphones', 'gamepad', 'umbrella', 'coffee', 'lottery', 'receipt', 'keyring'],
  alleywide: ['fishcake', 'earphones', 'gamepad', 'umbrella', 'coffee', 'lottery', 'receipt', 'keyring'],
  skatepark: ['sunglasses', 'juicebox', 'bubbletea', 'ball2', 'earphones', 'gamepad', 'keyring', 'snack'],
  oneroom: ['earphones', 'ramen', 'keyring', 'toothbrush', 'coin', 'remote', 'slipper', 'mandarin'],
  duplex: ['earphones', 'ramen', 'keyring', 'toothbrush', 'coin', 'remote', 'slipper', 'mandarin'],
  park3: ['kimbap', 'onigiri', 'juicebox', 'candy', 'cookie', 'snack', 'keyring', 'coin'],
  konbini: ['receipt', 'sandwich', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap', 'ramen'],
  shopmap: ['receipt', 'sandwich', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap', 'ramen'],
  laundry: ['sockpair', 'towel', 'tissue', 'coin', 'slipper', 'receipt', 'coffee', 'keyring'],
  cafe: ['coffee', 'icecream', 'cupcake', 'donut', 'cookie', 'bubbletea', 'milk', 'candy'],
  playground: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  playgroundwide: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  park1: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  parkwide: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'duck', 'bubbletea', 'ball'],
  fishing: ['rubberduck2', 'juicebox', 'duck', 'sunglasses', 'ball2', 'bubbletea'],
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
