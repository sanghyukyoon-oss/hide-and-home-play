// 기차 여행 2차 (GPT 작업장 gpt-station, fix-1022 반영 — ① 10/22 들여옴): 27판 봄 아침 기차역 gptstation · 28판 두 량 객차 gpttraincar2 ·
// 해변 도착역 gptseastation(등록만) · 소품 23종(stationprops2, 가구로만 hidden).
// 빌더와 배치만 — 작업장의 장치·걷기·맵 등록 엔진, 미리보기 분기, 객실 흔들림 런타임은 뺌(장치·자물쇠 잇기는 ② 몫).
// 색: GPT 원색의 명암 그대로, 색상만 맵마다 배색(PAL.station·car·sea)으로 모음 — 사용자 10/22 '채색 다시 신경 써서'. 판 표는 stages.js PLAN '새키|옛키', 대본·물건·장치는 roomalias.js.
import { registerFurniture } from './gfx/furniture.js';
import { harmonizeBuilders } from './gfx/gpt-paint.js';
import { PAL } from './gfx/gpt-palettes.js';
import { surfaceBuilders } from './gfx/gpt-surface.js';
import { townTheme, withTown } from './gfx/town-kit.js';
import { withIdle } from './gfx/gptst-kit.js';
import { GPTST_V1_BUILDERS, GPTST_V1_INFO } from './gfx/gptst-station-props.js';
import { GPTST_STORAGE_BUILDERS, GPTST_STORAGE_INFO } from './gfx/gptst-storage.js';
import { GPTST_TERRAIN_BUILDERS, GPTST_TERRAIN_INFO } from './gfx/gptst-terrain.js';
import { GPTST_LIFE_BUILDERS, GPTST_LIFE_INFO } from './gfx/gptst-life.js';
import { GPTST_DEVICE_BUILDERS, GPTST_DEVICE_INFO } from './gfx/gptst-devices.js';
import { GPTST_CAR1_BUILDERS, GPTST_CAR1_INFO } from './gfx/gptst-traincar1.js';
import { GPTST_CAR2_BUILDERS, GPTST_CAR2_INFO } from './gfx/gptst-traincar2.js';
// 기차 여행 2차 소품 23종(stationprops2 = 받침·선로 5 + 열차·생활 6 + 역 건물 5 + 장치 7) 중 역 건물 5 · 해변 도착역 소품 5
import { GPTST_ARCH_BUILDERS, GPTST_ARCH_INFO } from './gfx/gptst-arch.js';
import { GPTST_SEA_BUILDERS, GPTST_SEA_INFO } from './gfx/gptst-seastation.js';
import { makeGptStation, makeGptTraincar2, makeGptSeastation } from './gptst-maps.js';

// 자물쇠가 설 수 있는 부품 (① 10/22): 작업장 부품엔 자물쇠 표시가 하나도 없어서(작업장은 자기 장치 엔진으로 잠금) 우리 판짜기가 27판
// 자물쇠도, 28판 너굴이가 숨을 자물쇠 칸도 못 찾았어요(28판 사건이 그냥 숨은그림으로 떨어짐). 여기는 '설 수 있다'만 — 어느 판에 어떤
// 자물쇠를 거는지·연쇄 잇기는 ② 몫(27판 code = 매표 창구는 ② HAT_KEY와 같음). [부품 종류, 자물쇠 종류, 자물쇠 자리(그 부품 기준 x, y, z)]
const LOCKS = {
  gpt_ticketoffice: ['drawer', 'code', [.4, -.02, .07]], gpt_luggagecart: ['door', 'pad', [.5, -.12, .09]], gpt2_v1bench: ['lid', 'pad', [0, -.05, .6]],
  gpt_tc2_cart: ['lid', 'code', [0, -.06, .64]], gpt_tc2_bench: ['drawer', 'pad', [.25, -.02, .06]], gpt_tc2_snackcounter: ['drawer', 'pad', [.3, -.05, .06]],
};
// 숨길 자리 더 (① 10/22 물건 기본 배치): 넓힌 역의 GPT 조각들엔 자리가 10곳뿐(옛 27판 역 24곳) — 27판 숨은그림 8개 + 열쇠·쪽지·함정이
// 다 못 들어가서, 조각이 이미 가진 면 위에 자리를 더함(건너편 둘 — ② 노트 '건너편 숨김 자리 1~2'). [종류, x, y, z, 높이 한도, 이름]
const SPOTS = {
  gpt_ticketgate: [['on', -.54, .905, -.2, .35, '개찰구 위'], ['on', .54, .905, -.2, .35, '개찰구 위']],
  gpt_timetable: [['under', 0, .005, .05, .6, '시간표 아래']],
  gpt_ticketoffice: [['on', .45, 1.56, -.53, .3, '매표소 선반 위']],
  gpt2_parcelrack: [['under', .35, .005, .1, .5, '소포 선반 아래']],
  gpt2_traveller: [['on', .52, .675, .02, .3, '여행 가방 위']],
  gpt2_signal: [['on', .18, 1.03, -.1, .3, '신호기 위']],
  gpt2_waitingtrain: [['on', -2.25, 1.145, -.25, .35, '대기 열차 좌석'], ['on', 2.15, 1.145, -.25, .35, '대기 열차 좌석']],
  gpt2_farstreet: [['on', -2.82, .79, -.17, .25, '자전거 바구니'], ['on', 1.6, .09, .25, .5, '건너편 꽃길']],
  gpt2_farshop: [['on', .31, .95, .27, .42, '찻집 카운터']],
};
const withLocksSpots = B => {
  for (const k in B) {
    const L = LOCKS[k], S = SPOTS[k]; if (!L && !S) continue;
    const b = B[k];
    B[k] = (f, ...a) => {
      const r = b(f, ...a);
      if (L) { const p = f.parts.find(q => q.kind === L[0]); if (p) { const [x, y, z] = L[2]; p.lockable = true; p.lockKind = L[1]; p.lockAt = { x, y, z, parent: p.pivots[0] }; } }
      for (const [kind, x, y, z, maxH, label] of S || []) f.spot(kind, null, x, y, z, { maxH, label, scale: .9 });
      return r;
    };
  }
  return B;
};

// (10/23 사용자 "27, 28 … 아예 GPT가 만든 채색으로": 역·객차는 GPT 원색 + 질감(gpt-surface.js)만, 풀밭·선로 받침(terrain)은 그대로, 해변역은 배색 그대로)
const paintOf = (B, pal) => pal === PAL.station ? surfaceBuilders(B, 'station') : pal === PAL.car ? surfaceBuilders(B, 'car') : pal ? harmonizeBuilders(B, pal) : B;

export function installGptStation(MAPS, THEMES, LAYOUTS) {
  // (가구로만, 상점엔 안 나옴: 작업장 INFO가 모두 hidden)
  for (const [B, I, pal] of [[GPTST_V1_BUILDERS, GPTST_V1_INFO, PAL.station], [GPTST_STORAGE_BUILDERS, GPTST_STORAGE_INFO, PAL.station], [GPTST_TERRAIN_BUILDERS, GPTST_TERRAIN_INFO, null],
    [GPTST_LIFE_BUILDERS, GPTST_LIFE_INFO, PAL.station], [GPTST_DEVICE_BUILDERS, GPTST_DEVICE_INFO, PAL.station], [GPTST_CAR1_BUILDERS, GPTST_CAR1_INFO, PAL.car], [GPTST_CAR2_BUILDERS, GPTST_CAR2_INFO, PAL.car],
    [GPTST_ARCH_BUILDERS, GPTST_ARCH_INFO, PAL.station], [GPTST_SEA_BUILDERS, GPTST_SEA_INFO, PAL.sea]])
    registerFurniture(withLocksSpots(withIdle(paintOf(B, pal))), Object.fromEntries(Object.entries(I).map(([k, v]) => [k, { ...v, hidden: true }])));
  // 27판: 그 판의 친구는 옛 27판(station) 그대로
  const st = makeGptStation(THEMES.station);
  // (공통 룩 키트: 26판 동네 배경 — 집 벽은 orig 27판의 옅은 벚꽃·연두·크림, 지붕은 벚꽃 분홍·풀 초록·나무)
  THEMES.gptstation = townTheme({ ...st.theme, friend: THEMES.station?.friend ?? st.theme.friend }, { townRot: -Math.PI / 2, gptSky: '#d6e8f2', gptGround: '#dfeacb', gptGroundFar: '#fbe6cc', gptPaving: '#ece2cf', townWalls: ['#fbe4e8', '#e7f3df', '#f8efd8', '#e9f0f6', '#fde3df', '#eef5e4'], townRoofs: ['#ea8fa0', '#5aa84a', '#bd864f', '#4f8fb0', '#e48ca0', '#6db35a'] });
  LAYOUTS.gptstation = withTown({ ...st, theme: THEMES.gptstation });
  // 28판: 친구는 옛 28판(traincar3) 그대로
  const base = THEMES.traincar3 || THEMES.traincar;
  THEMES.gpttraincar2 = { ...makeGptTraincar2(base).theme, friend: base?.friend ?? 'raccoon' };
  MAPS.gpttraincar2 = () => makeGptTraincar2(THEMES.gpttraincar2);
  // 해변 도착역: 등록만(판 표에 없음) — 친구는 옛 키 seaside 그대로
  const seaBase = THEMES.seaside || THEMES.station;
  THEMES.gptseastation = { ...makeGptSeastation(seaBase).theme, friend: seaBase?.friend ?? 'frog' };
  MAPS.gptseastation = () => makeGptSeastation(THEMES.gptseastation);
}
