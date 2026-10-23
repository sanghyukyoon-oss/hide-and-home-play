// A new 20판 modeling alternative. Story device types remain canonical; no existing map or builder is replaced.
const F = (type, i, j, rot = 0, opts = {}, y) => ({ type, i, j, rot, opts, ...(y != null ? { y } : {}) });

export const gptRoofTheme = baseTheme => ({
  ...baseTheme,
  name: '햇살 가득 토순이네 옥상 집들이',
  // (바닥은 orig 20판의 주황 나무 데크 — 허브 10/23 '바닥이 아직 민트 초록 판 … orig 20처럼 나무 데크 바닥')
  bg: ['#d4e2e5', '#fef2e1'],
  floorKind: 'planks', floor: '#e3a463', floor2: '#cf8c4c', base: baseTheme.base || '#e9dfd0',
  wallKind: 'plain', wall: '#fef2e1', wall2: '#feebc8', wainscot: '#feebc8', trim: '#fefde9', wallEdge: '#fefde9',
  wood: '#eecfa3', woodD: '#6f4b30', accent: '#e98774', accent2: '#84ae9d', accent3: '#feb53d',
  fabric: '#e98774', fabric2: '#fef2e1', onggi: '#b67d53',
});

export const gptRoofLayout = {
  w: 7, d: 6, wallH: .56, slab: 'none',
  walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
  // Shell and deck are merged scenery with no solid full-map collision box. Broad central circulation stays clear.
  furniture: [
    F('gptroofshell', 0, 0),
    F('gptroofdeck', .225, .35),
    F('pyeongsang', .3, .55, 0, {}, .145),
    F('gptroofpartytable', .3, 1.5, 0, {}, .145),
    F('gptroofjars', 2.55, .28),
    F('gptroofstairhut', 4.7, .17),
    F('gptroofgarden', 4.5, 3.45),
    F('roofline', .96, 4.5),
    F('gptrooflaundry', .75, 3.8),
  ],
  // Free central roof, between the deck, jars, laundry line and kitchen garden.
  friendAt: [-.45, .3],
  decor: [],
};

export const GPT_ROOF_DEVICE_NOTES = {
  map: 'gptvillaroof',
  shellDrop: 3.45,
  scale: 'table top .78 above .145 deck; hut door panel2.06 / clear2.0725; vase vessels .25/.34/.43; canonical pyeongsang/roofline/pulley scale retained',
  pulley: 'gptroofjars → canonical pulleyjang (큰 항아리 + 도르래 누름돌 유지, 중간·작은 항아리 뚜껑에 pad/color lockable 연결)',
  quilt: 'roofline (실제 clothBend 이불 + quiltKeyAt, inside / on / beside spots)',
  lounge: 'pyeongsang 방석·상보 유지 + 바로 앞 gptroofpartytable 서랍의 실제 비밀 바닥 (뒤집는 집들이 간판→서랍→바닥)',
  vases: 'gptroofpartytable.vaseClue: code 012, row order [1,0,2], small red / medium yellow / tall blue; public on spot 꽃병 관찰 쪽지 받침 maxH.4 scale1.2',
  hut: 'gptroofstairhut: .841×2.073 clear opening, outward door sweep local z .85..1.68; real seven-step flight to maintenance hatch',
  devices: '도르래 장독대 / 벤딩 이불 / 집들이 간판 뒤집기(뒷면 장독대 화살표)→서랍→비밀 바닥 / 연결 물탱크 배관→텃밭 바퀴→기어→상추 리프트→씨앗함·꽃 개화 / 옥탑 내림 레버→기어→랙→점검문 (모두 실제 part·sound·inside spot)',
  collision: 'shell/deck noSolid + tiny distant collideBox; hut tank included in local body box; front opening and central path stay clear',
};
