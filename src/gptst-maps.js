// 기차 여행 2차 맵 배치 (GPT 작업장 gpt-station fix-1022 — ① 10/22 들여옴: 배치와 테마만. 작업장의 보행·장치 엔진, 맵 플래그
// gptStation2Nav·gptStation2Tracks·gptTraincar2·gptSeastationNav, 미리보기 분기는 뺌 — 걷는 곳은 우리 walkGrid, 막는 곳은 조각의 walkBoxes)
const HP = Math.PI / 2;

// ── 27판 봄 아침 기차역 (gptstation = 작업장의 넓힌 첫 역 gptstation2 + fix-1022 손질). 폭 10.8 m, 선로 두 줄 건너 찻집·꽃길은
// 보이기만 하고 못 걸어감(gpt2_platformedge의 walkBoxes). 작업장 방은 깊이 13 m에 내용이 북쪽 10 m(받침 z -6.5..3.5)라
// 바닥이 받침 밖으로 3 m 남아서 작업장은 방 바닥을 숨겼어요(그리고 자기 걷기 엔진으로 실제 면을 따라 걸었음). 우리 걷기는 1 m 칸의
// 높이(heightAt)를 보니까: 방을 작업장 z -6.0..3.5(깊이 9.5)로 잡고 모든 z를 +1.25 옮겨 승강장 북쪽 끝(-2.0)이 칸 경계에 오게,
// 승강장은 서쪽 받침 끝까지(x -5.4..3.6, 폭 8.6 → 9 — 서쪽 .3 m·동쪽 .1 m 넓어짐), 높이 .38 → .37(한 걸음 .38 미만이어야 오르내림 —
// 계단은 그림으로만, 모서리 어디서든 오름: 벚꽃역 gptsakura와 같은 방식). 받침 북쪽 .5 m(건너편 뒤)는 방 바닥 밖이라 받침 윗면이 보임.
const Z = 1.25, PY = .37;
const at = (type, x, z, y = 0, opts = {}, a = 0) => ({ type, x, z: +(z + Z).toFixed(3), y, a, opts });
export function makeGptStation(base = {}) {
  const theme = { ...base, name: '벚꽃마을 작은 기차역', friend: base.friend ?? 'frog',
    // (작업장 색 그대로 — 사용자 10/22 "GPT 원색이 낫다": 벽 없음, 바닥·받침은 이미 중성 오프화이트)
    bg: ['#f1a7bd', '#75bf9d'], sky: ['#f1a7bd', '#63b5df', '#75bf9d'],
    floorKind: 'brickpave', floor: '#fbf7f0', floor2: '#e3ddd3',
    base: '#c9af93', wood: '#c89262', woodD: '#6f4b30', body: '#fbf7f0', accent: '#e97483', trim: '#f4efe8',
    light: { ambColor: '#fff0e2', amb: 1.45, sunColor: '#fff3e0', sun: 2.2, shadow: .5 } };
  return { w: 10.8, d: 9.5, theme, slab: 'none', bleed: false, exact: true, noEntry: true, walkRaised: true,
    fitW: 15.6, yaw: .68, friendAt: [-.9, 1.4 + Z],
    walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    raised: [{ i: 0, j: 4, w: 9, d: 2.8, h: PY, kind: 'tile', a: '#fbf7f0', b: '#e3ddd3', edge: '#c6c5be', nose: '#f4efe8', plinth: '#b99476', stone: '#d4dbd7',
      step: false, stairs: [{ side: 'S', at: 3.3, w: 1.8 }] }],
    petals: { n: 48, from: [2.6, 1.65 + Z, 2.75, 2.7 + Z] },
    // (the island's top a hair under the room's floor plane — the floor shows, no flicker between the two)
    furniture: [at('gpt2_island', 0, 0, -.01), at('gpt2_platformedge', 0, 0),
      at('gpt2_waitingtrain', -.25, -2.65, -.086), at('gpt2_train', 0, -4.4, .104),
      at('gpt_ticketoffice', -2.7, -.65, PY), at('gpt_platformroof', .38, -.8, PY),
      at('gpt2_v1bench', -.5, -.45, PY), at('gpt_ticketgate', -.05, .4, PY),
      at('gpt_drinkmachine', -3.67, 1.80), at('gpt_timetable', -1.95, 1.8), at('gpt_luggagecart', .7, 1.45),
      at('gpt_sakura', 2.6, 2.75, 0, { small: true }), at('gpt_flowerbox', 1.1, 2.97),
      // (fix-1022: the cat's feet on the 1.72 m vending top; ① 10/22 보행 섬 0: 매표 창구 +.45/-.2, 시간표 -.1, 꽃상자 +.1 — walk.mjs FIX)
      at('gpt2_cat', -3.67, 1.80, 1.695), at('gpt2_traveller', -1.2, 2.95, .021),
      at('gpt2_flipsign', 1.9, -5.78, .08), at('gpt2_falsebottom', -1.45, -5.78, .08, {}, HP),
      at('gpt2_locker', -4.7, 2.75, 0, {}, HP), at('gpt2_signal', 4.8, -3.38),
      at('gpt2_crossing', 3.25, -1.70, PY), at('gpt2_crossing', 4.95, -5.45, 0, { flip: true }),
      at('gpt2_parcelrack', 2.35, -.75, PY), at('gpt2_pulley', 4.15, 2.5),
      at('gpt2_farstreet', 0, -5.8), at('gpt2_farshop', 4.0, -5.76, .08),
      // (fix-1022: only this full-size tree beside the passing train has a shallower blossom crown)
      at('gpt_sakura', -4.35, -5.72, .08, { small: true }), at('gpt_sakura', .5, -5.77, .08, { crownDepth: .80 })],
    decor: [] };
}

// ── 28판 두 량 객차 (gpttraincar2): 청록 대기석 칸과 코럴 식당 칸, 그 사이 1.6 m 주름 통로(실제로 걸어 건넘). 창 여섯은 선로·침목만
// 빠르게 흐름 — 가운데 통로 방의 gpt_tc2_landscape가 침목을 돌리고 창을 함께 밀어요(작업장 런타임의 일; 객실 흔들림은 뺌).
const ft = (type, x, z, opts = {}, a = 0) => ({ type, x, z, a, opts });
const D = (type, wall, u, opts = {}) => ({ type, wall, u, opts });
export function makeGptTraincar2(baseTheme = {}) {
  const theme = { ...baseTheme, name: '봄빛 로컬 열차, 두 칸의 여행', friend: baseTheme.friend ?? 'raccoon',
    bg: ['#5bbbd0', '#7186d4'], sky: ['#64bf7c', '#5bbbd0', '#7186d4'],
    base: '#318fa3', floorKind: 'planks', floor: '#d1ae90', floor2: '#c39b7d',
    wallKind: 'stripe', wall: '#f4efe8', wall2: '#f4efe8', wainscot: '#c8d8db', trim: '#bc9168', wallEdge: '#fbf7f0',
    wood: '#bc9168', woodD: '#6f4b30', accent: '#50b99c', accent2: '#e575a3', fabric: '#63aeda' };
  const car = (index, innerEnd) => ({
    w: 5, d: 7, exact: true, bleed: null, slab: 'none', wallH: 3.05, noEntry: true,
    theme: { ...theme, wall: index ? '#f8e9ec' : '#ecf5ef', wall2: index ? '#f8e9ec' : '#ecf5ef',
      floor: index ? '#d7bea6' : '#c59e82', floor2: index ? '#c7a88e' : '#b98e72',
      wainscot: index ? '#eab0c7' : '#9fcbd9' },
    walls: { N: index === 0 ? 'door' : 'none', W: 'wall', S: 'none', E: 'none' },
    ...(index === 0 ? { doorAt: { N: 0 } } : {}),
    // (the gangway's bulkhead wings stand at the inner end, in this car's room — gpt_tc2_gangwing, ① 10/22 보행)
    furniture: [ft('gpt_tc2_shell', 0, 0, { innerEnd }), ft('gpt_tc2_gangwing', 0, innerEnd * 3.425, { end: -innerEnd }),
      ...(index ? [
        ft('gpt_tc2_diningbooth', -1.30, -1.65), ft('gpt_tc2_diningbooth', -1.30, 1.65),
        ft('gpt_tc2_snackcounter', 1.85, .15, {}, -HP), ft('gpt_tc_luggage', 1.95, 2.75),
      ] : [
        ft('gpt_tc2_bench', -1.82, -1.98, { stuff: 'paper' }, HP),
        ft('gpt_tc2_bench', -1.82, .12, { arms: 'left' }, HP),
        ft('gpt_tc2_bench', -1.82, 2.22, { stuff: 'bag', arms: 'left' }, HP),
        ft('gpt_tc2_bench', 1.82, -1.05, { light: true }, HP * 3),
        ft('gpt_tc2_bench', 1.82, 1.05, { stuff: 'knit', light: true, arms: 'right' }, HP * 3),
        ft('gpt_tc2_cart', .18, -.35), ft('gpt_tc_luggage', 1.95, 2.85),
      ])],
    decor: [D('gpt_tc2_window', 'W', -2.25, { view: 0, phase: index * .4 }),
      D('gpt_tc2_window', 'W', 0, { view: 1, phase: index * .4 + .16 }),
      D('gpt_tc2_window', 'W', 2.25, { view: 2, phase: index * .4 + .32 }),
      ...(index ? [] : [D('gpt_tc_rack', 'W', 0)]), ...(index === 0 ? [D('gpt_tc_end', 'N', 0)] : [])],
  });
  return { theme, bleed: false, fitAll: true, fitW: 18.4, yaw: 1.1, homeShift: [0, -.4],   // (② 10/22 밤: 가운데가 오른쪽 칸으로 쏠려 왼쪽 칸 끝이 잘림 → 중심을 조금 당김)
    friendAt: [.45, 5.95],
    // Body axes run along z. Each 7m car is separated by a 1.6m accordion gangway.
    rooms: [{ at: [0, -4.3], layout: car(0, 1) },
      { at: [0, 0], layout: { w: 1.6, d: 1.6, exact: true, bleed: null, slab: 'none', noEntry: true,
        theme, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
        furniture: [ft('gpt_tc2_gangway', 0, 0), ft('gpt_tc2_landscape', 0, 0)], decor: [] } },
      { at: [0, 4.3], layout: car(1, -1) }],
  };
}

// ── 해변 도착역 (gptseastation, 등록만 — 판 자리 없음: 30판 바닷가 가게 옛 키 seaside의 이웃). 작업장 방 9×7(z -3.5..3.5)의 승강장
// 북쪽 끝(-2.0)을 1 m 칸 경계에 맞추려고 방을 z -3.0..3.5(깊이 6.5)로 잡고 모든 z를 -.25 옮김(보이는 건 같음; 선로 바닥 북쪽 .24 m는 방 밖).
const SZ = -.25;
const sat = (type, x, z, y = 0, opts = {}, a = 0) => ({ type, x, z: +(z + SZ).toFixed(3), y, a, opts });
export function makeGptSeastation(base = {}) {
  const theme = { ...base, name: '바닷마을 도착역', friend: base.friend ?? 'frog', bg: ['#63bfda', '#65cfa5'],
    sky: ['#7568d7', '#63bfda', '#65cfa5'],
    floorKind: 'tile', floor: '#f9f7f4', floor2: '#c4dcd9', base: '#bcd8cd',
    wood: '#d59b59', woodD: '#6f4b30', body: '#fbf7f0', accent: '#4389c7', tactile: false,
    light: { ambColor: '#fff0e2', amb: 1.4, sunColor: '#fff3e0', sun: 2.15, shadow: .48 } };
  return { theme, bleed: false, fitAll: true, fitW: 12.8, yaw: .68, friendAt: [-2.3, .60 + SZ],
    rooms: [{ at: [0, 0], layout: {
      w: 9, d: 6.5, theme, slab: 'none', exact: true, walkRaised: true,
      walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      // (the harbour: our water floor zone, so nothing is put down and nobody stands in it — z 1.13..3.5)
      floorZones: [{ i: 0, j: 4.13, w: 9, d: 2.37, kind: 'water', a: '#58bdd4', b: '#48aaba' }],
      raised: [{ i: 0, j: 1, w: 9, d: 2.2, h: .34, kind: 'tile', a: '#f4efe8', b: '#c8dddf',
        edge: '#d8cebb', plinth: '#78ae9d', stone: '#e8e5df', step: false }],
      furniture: [sat('gpt_searailbed', 0, 0), sat('gpt_seawater', 0, 0),
        sat('gpt_localtrain', -.95, -2.65, .0805), sat('gpt_ticketoffice', -3.25, -.85, .34),
        sat('gpt_storagebench', -.43, -1.03, .34), sat('gpt_seasign', 1.9, -1.03, .34),
        sat('gpt_drinkmachine', 3.75, -.65, .34), sat('gpt_luggagecart', .78, -.26, .34),
        sat('gpt_flowerbox', 2.15, -.2, .34), sat('gpt_stationcat', 3.65, -1.65, .34),
        sat('gpt_seagrass', 3.65, .55), sat('gpt_seapier', 1.4, .76)],
      decor: [],
    } }] };
}
