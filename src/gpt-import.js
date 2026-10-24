// GPT 작업장에서 들여온 맵·가구·물건 (① 10/22 — 사용자 고르기 시트, _handoff/gpt-picks-1022.md): 등록과 미리보기를 한곳에.
// 들여올 때 네 단계를 거쳤다: 색 맞춤(tools/gpt-recolor.mjs) → 글자·종이(gfx/gpt-paper.js) → 동물은 우리 캐릭터로 → 스케일(gfx/gpt-scale.js).
// 바꾼 판의 옛 맵은 키 그대로 남는다(otakuloft …); 판 표(stages.js PLAN)만 새 키를 가리킨다.
// 미리보기: ?gptmap=<맵 키> — 그 맵을 찾을 물건 6개와 함께 바로 연다 (진행·보상 없음).
import { registerFurniture } from './gfx/furniture.js';
import { ITEMS } from './gfx/items.js';
import { GPT_ROOM_BUILDERS, GPT_ROOM_INFO } from './gfx/gpt-otaku-room.js';
import { GPT_OTAKU_BUILDERS, GPT_OTAKU_INFO } from './gfx/gpt-otaku-props.js';
import { installGptOtakuMaps } from './gpt-otaku.js';
import { harmonizeBuilders } from './gfx/gpt-paint.js';   // 맵마다 3~4색 배색으로 모으기 (① 10/22 사용자 "채색 다시 신경 써서" — 채도 올리기 X, 명암은 GPT 그대로)
import { PAL } from './gfx/gpt-palettes.js';
import { surfaceBuilders } from './gfx/gpt-surface.js';
import { townTheme, withTown } from './gfx/town-kit.js';
// (공통 룩 키트 10/22 밤: 바깥 판마다 26판 동네의 구조(흐린 큰 집·길) — 하늘·땅은 그 판 orig 배경처럼 따뜻하게, 집 벽은 그 판 배색의 옅은 색,
// 지붕은 그 판 포인트 색, 뒤집기·돌림으로 배치도 판마다 다르게; 청록 땅은 26판만)
const TOWN_OF = {
  gptvillaroof: { townY: -3.45, townRot: Math.PI / 2, gptSky: '#ffe4c2', gptGround: '#d6e6c8', gptGroundFar: '#ffe4c2', gptPaving: '#e2dacd', townWalls: ['#e6f1e0', '#fbefd6', '#f6dfe2', '#e8f0f4', '#f5e6cf', '#e3eedc'], townRoofs: ['#5f9e55', '#c9733f', '#e88d9b', '#4f8fb0', '#b7602f', '#6aa86a'] },
  gptpolicefront: { townFlip: true, gptSky: '#c4d6e8', gptGround: '#dfe2e8', gptGroundFar: '#c4d6e8', gptPaving: '#cfd3dc', townWalls: ['#e6edf7', '#f6efe2', '#e7f2e8', '#f7e4e2', '#eef1f6', '#f3ead8'], townRoofs: ['#205792', '#d9534f', '#2e8a49', '#3b6aa6', '#c94b4b', '#4a7aa8'] },
  gptalley: { townRot: Math.PI, gptSky: '#e6cbb4', gptGround: '#ecd9c6', gptGroundFar: '#e6cbb4', gptPaving: '#dccab8', townWalls: ['#f4e7d6', '#e5f0e6', '#f5dfd9', '#eae9f2', '#f6ecd8', '#e2efe4'], townRoofs: ['#2f8f5a', '#d84a4f', '#4f7b9c', '#b76e40', '#3d9c69', '#c6503f'] },
  gptcornershop: { townFlip: true, townRot: Math.PI / 2, gptSky: '#e6cbb4', gptGround: '#efdccc', gptGroundFar: '#e6cbb4', gptPaving: '#e0cdbd', townWalls: ['#f3e6f2', '#f6ecd8', '#f6dddd', '#e8eff5', '#efe4f0', '#f4ead6'], townRoofs: ['#8959a6', '#ee4850', '#76bf4f', '#b56d3f', '#7a4f99', '#d84a55'] },
};
import { GPT_BUILDERS as GPT_PROP_BUILDERS, GPT_INFO as GPT_PROP_INFO, GPT_ITEMS } from './gfx/gpt-props.js';
// 20판 햇살 빌라 옥상 집들이 · 21판 동네 파출소 앞 (gpt2-a, fix-1022 반영): 빌더와 배치만 — 작업장의 장치·걷기·맵 등록 엔진은 뺌
import { GPT_ROOF_BUILDERS, GPT_ROOF_INFO } from './gfx/gpt2a-roof-props.js';
import { GPT_POLICE_BUILDERS, GPT_POLICE_INFO } from './gfx/gpt2a-police-props.js';
import { gptRoofLayout, gptRoofTheme } from './gpt2a-roof-map.js';
import { gptPoliceLayout, gptPoliceTheme } from './gpt2a-police-map.js';
// 25판 동네 모퉁이 2층 가게집 (gpt3-j, fix-1022 반영): 빌더와 배치만 — 작업장의 걷기·장치 엔진은 뺌
import { GPT_CORNER_BUILDERS, GPT_CORNER_INFO } from './gfx/gptcorner-props.js';
import { GPT_HOME_BUILDERS, GPT_HOME_INFO } from './gfx/gptcorner-home-props.js';
import { GPT_SHOP_BUILDERS, GPT_SHOP_INFO } from './gfx/gptcorner-shop-props.js';
import { GPT_CORNER_THEME, gptCornerMap } from './gptcorner-map.js';
// 23판 삐딱이네 골목 (gpt2-b, fix-1022 반영): 빌더와 배치만 — 작업장의 장치·걷기 엔진은 뺌 (22판 거리는 사용자 10/22 '원본 유지')
import { GPT_ALLEY_BUILDERS, GPT_ALLEY_INFO, GPT_ALLEY_THEME, createGptAlleyMap } from './gfx/gpt2b-alley-props.js';
import { GPT_ALLEY_ITEMS } from './gfx/gpt2b-alley-items.js';
// 긴 객실 한 칸 gptlongcar · 벚꽃역 동네형 gptsakura (gpt2-d, fix-1022 반영; 판 자리는 ②가 31·32판으로): 빌더와 배치만, 겹치던 이름은 바꿈
import { GPTSTATION_BUILDERS as SAKURA_BUILDERS, GPTSTATION_INFO as SAKURA_INFO } from './gfx/gptsakura-props.js';
import { GPTTRAIN_BUILDERS as LONGCAR_BUILDERS, GPTTRAIN_INFO as LONGCAR_INFO, GPTTRAIN_ITEMS as LONGCAR_ITEMS } from './gfx/gptlongcar-props.js';
import { registerGptStationMap as installSakura } from './gptsakura-map.js';
import { registerGptTrainMap as installLongcar } from './gptlongcar-map.js';
// 64판 햇살 책방 다락 gptroom1 (gpt-free, fix-1022 반영): 빌더와 배치만 — 넓힌판·작업장 장치·걷기 엔진은 뺌
import { GPT_ROOM1_BUILDERS, GPT_ROOM1_INFO, createGptRoom1 } from './gfx/gptfree-room1.js';
// 19판 몽글 119 안전센터 gptfirestation + 소방차·순찰차 2 (gpt3-k, fix-1022 반영): 빌더와 배치만, 색은 GPT 원색 그대로
import { installGpt3k } from './gpt3k-import.js';
// 26판 멍뭉이네 마당 2층집 gptdoghouse · 골목 계단집 gptdoghouse2 (gpt2-c, fix-1022 반영): 빌더와 배치만, GPT 원색 그대로
import { installGpt2cDoghouse } from './gpt2c-import.js';

// 27판 봄 아침 기차역 · 28판 두 량 객차 · 해변역 · 기차 여행 소품 2 (gpt-station, fix-1022 반영): 빌더와 배치만 — gptst-import.js
import { installGptStation } from './gptst-import.js';
// 36판 새 안 밤의 문구점 stationery (⑨ 10/23): 문구점 실루엣 단면 + 보도·연석 턱 + 둥근 섬 — stationery-map.js (미리보기 판 번호는 등록할 때 GPT_STAGE에)
import { installStationery } from './stationery-map.js';
// 19판 곰돌이네 119 안전센터 2 firestation2: 정본 firestation 배치 + GPT 소방서 조각 셋(호스 건조탑 도르래·출동 종·소방견 집) — firestation2-map.js
import { installFirestation2 } from './firestation2-map.js';
// 공원·캠프 새 맵 다섯(45·49·55·56·58판, 10/23 새로 지음): 둥근 섬 받침 + 공용 키트 gfx/pc-kit.js — parkcamp-maps.js
import { installParkCamp } from './parkcamp-maps.js';
// 30판 바닷가 가게 2 — seaside2 (⑧ 10/23: 같은 맵, 디테일 업)
import { installSeaside2 } from './seaside2-map.js';
import { installGptDetails } from './gfx/gpt-details.js';
// 28판 봄빛 로컬 열차 두 량 traincar4 (⑧ 10/23 — 패럴랙스 창밖·연결 통로·하늘색 바깥): 우리 모델 — traincar4-map.js
import { installTraincar4 } from './traincar4-map.js';
// 28판 봄빛 로컬 전차 두 량 traincar5 (⑧ 10/24 — 하늘색 한 장 바깥, 창 안만 흐름, 공중에 뜬 두 량 단면; 블록아웃 5a·5b는 미리보기로): traincar5-map.js
import { installTraincar5 } from './traincar5-map.js';
// 28판 B안 2층 식당·침대 열차 한 량 인형집 단면 traincar6 (⑧ 10/24, 미리보기 키 — NEW_MAPS는 그대로): traincar6-map.js
import { installTraincar6 } from './traincar6-map.js';
import { installUndermall } from './undermall-map.js';
// 39판 새 맵 카페 지하 냉동 창고 cafefreezer (⑨ 10/23): 흙 속 단면 지하 + 냉동실·도르래 바구니 얼음·온풍기 — cafefreezer-map.js
import { installCafefreezer } from './cafefreezer-map.js';
// 27판 '벚꽃마을역' station4 (⑧ 10/24 — 처음부터 다시: 앞뒤로 긴 섬·승강장 가까운 카메라; 새 맵 스위치 NEW_MAPS 27): station4-map.js
import { installStation4 } from './station4-map.js';
// 3판 세 안 A fishing3 · B fishing2b · C frogpond (10/24): 미리보기 ?gptmap=키&lv=3 — stage3-maps.js
import { installStage3, S3_STAGE } from './stage3-maps.js';

// 31판 새 보스 맵 별빛극장의 비밀 영사실 cinema (⑧ 10/23 — 스토리 룸 안 A): 거대 소품 극장 단면 + 둥근 섬 — cinema-map.js
import { installCinema } from './cinema-map.js';
// the maps each 들여온 key opens on (its campaign stage, for the preview's lighting and HUD)
export const GPT_STAGE = { fishing3r: 3, fishisle: 3, gptotaku: 18, gptotakumix: 18, gptfirestation: 19, firestation2: 19, gptvillaroof: 20, gptpolicefront: 21, gptalley: 23, gptcornershop: 25, gptdoghouse: 26, gptdoghouse2: 26, gptstation: 27, gpttraincar2: 28, gptseastation: 30, gptlongcar: 31, gptsakura: 32, gptroom1: 64, starplay: 45, picnichill: 49, fireflyvalley: 55, creekcamp: 56, bridgewood: 58, cafefreezer: 39, undermall: 40, seaside2: 30 };

// a workshop piece that lists the boxes it really blocks with (gpt2-b gptWalkBoxes) walks by those, not by the box round all of it (room.js walkBoxes)
// (gpt2-d: a piece with a walkBoxes list walks by that list instead of its whole box)
const boxesOnly = B => { for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); if (Array.isArray(f.walkBoxes)) f.noSolid = true; return r; }; } return B; };
const walkByBoxes = B => { for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); if (f.gptWalkBoxes) { f.walkBoxes = f.gptWalkBoxes; f.noSolid = true; } return r; }; } return B; };

export function installGpt(MAPS, THEMES, LAYOUTS) {
  // (판 표 stages.js PLAN의 '새키|옛키': 여기서 새 키가 등록되면 그 판이 새 맵으로; 옛 키 표는 roomalias.js asRoom으로 찾음)
  // 18판: GPT 원색의 명암은 그대로, 색상만 네 색 배색으로(청록·흐린 파랑·참나무·코랄), 크림 노랑은 절반 — 쨍한 색은 만화책 등·피규어·캔에만
  registerFurniture(GPT_ROOM_BUILDERS, GPT_ROOM_INFO); registerFurniture(GPT_OTAKU_BUILDERS, GPT_OTAKU_INFO); installGptOtakuMaps(MAPS, THEMES);
  // 가구·큰 소품 61 + 차 2 (상점엔 안 나옴 — 판에 놓는 건 ②·⑥) · 찾을 물건 65 (판마다 목록에 넣는 건 ②)
  registerFurniture(GPT_PROP_BUILDERS, Object.fromEntries(Object.entries(GPT_PROP_INFO).map(([k, v]) => [k, { ...v, hidden: true }])));
  Object.assign(ITEMS, GPT_ITEMS);
  // (20판 아래 빌라 몸통 gptroofshell은 배색으로 모으지 않음 — 크림을 빼니 하늘빛을 받아 푸르스름했다, 허브 10/22 밤)
  { const { gptroofshell, ...rest } = GPT_ROOF_BUILDERS; registerFurniture(surfaceBuilders(GPT_ROOF_BUILDERS, 'roof'), GPT_ROOF_INFO); }
  registerFurniture(surfaceBuilders(GPT_POLICE_BUILDERS, 'police'), GPT_POLICE_INFO);
  THEMES.gptvillaroof = townTheme(gptRoofTheme(THEMES.villaroof2 || THEMES.villaroof), TOWN_OF.gptvillaroof); LAYOUTS.gptvillaroof = withTown({ ...gptRoofLayout, theme: THEMES.gptvillaroof });
  THEMES.gptpolicefront = townTheme(gptPoliceTheme(THEMES.policefront), TOWN_OF.gptpolicefront); LAYOUTS.gptpolicefront = withTown({ ...gptPoliceLayout, theme: THEMES.gptpolicefront });
  registerFurniture(surfaceBuilders(GPT_CORNER_BUILDERS, 'corner'), GPT_CORNER_INFO); registerFurniture(surfaceBuilders(GPT_HOME_BUILDERS, 'corner'), GPT_HOME_INFO); registerFurniture(surfaceBuilders(GPT_SHOP_BUILDERS, 'corner'), GPT_SHOP_INFO);
  THEMES.gptcornershop = { ...GPT_CORNER_THEME, friend: THEMES.alley3?.friend || GPT_CORNER_THEME.friend }; MAPS.gptcornershop = () => { const m = gptCornerMap(), L = m.rooms[0].layout; m.rooms[0].layout = withTown({ ...L, theme: townTheme(L.theme, TOWN_OF.gptcornershop) }); return m; };
  registerFurniture(surfaceBuilders(walkByBoxes(GPT_ALLEY_BUILDERS), 'alley'), GPT_ALLEY_INFO); Object.assign(ITEMS, GPT_ALLEY_ITEMS);
  // (그 판의 친구는 옛 판 그대로 — 도감·친구 열림)
  THEMES.gptalley = townTheme({ ...THEMES.alley1, ...GPT_ALLEY_THEME, friend: THEMES.alley1?.friend ?? null }, TOWN_OF.gptalley);
  MAPS.gptalley = () => { const m = createGptAlleyMap(THEMES.gptalley); m.rooms[0].layout = withTown(m.rooms[0].layout); return m; };
  registerFurniture(harmonizeBuilders(boxesOnly(SAKURA_BUILDERS), PAL.train), SAKURA_INFO); registerFurniture(harmonizeBuilders(boxesOnly(LONGCAR_BUILDERS), PAL.train), LONGCAR_INFO); Object.assign(ITEMS, LONGCAR_ITEMS);
  installSakura(LAYOUTS, THEMES); installLongcar(LAYOUTS, THEMES);
  registerFurniture(harmonizeBuilders(GPT_ROOM1_BUILDERS, PAL.room1), GPT_ROOM1_INFO);
  THEMES.gptroom1 = createGptRoom1(THEMES.officefloor).theme; MAPS.gptroom1 = () => createGptRoom1(THEMES.officefloor);
  installGpt3k(MAPS, THEMES, LAYOUTS);
  installGpt2cDoghouse(MAPS, THEMES, LAYOUTS);
  installGptStation(MAPS, THEMES, LAYOUTS);
  installStationery(LAYOUTS, THEMES); GPT_STAGE.stationery = 36;
  installFirestation2(LAYOUTS, THEMES);
  installParkCamp(LAYOUTS, THEMES);
  installGptDetails(MAPS, LAYOUTS);
  installTraincar4(MAPS, THEMES, LAYOUTS); GPT_STAGE.traincar4 = 28;
  installTraincar5(MAPS, THEMES, LAYOUTS); GPT_STAGE.traincar5 = GPT_STAGE.traincar5a = GPT_STAGE.traincar5b = 28;
  installTraincar6(MAPS, THEMES, LAYOUTS); GPT_STAGE.traincar6 = 28;
  installUndermall(MAPS, THEMES);
  installCafefreezer(LAYOUTS, THEMES);
  installSeaside2(LAYOUTS, THEMES);
  installStation4(LAYOUTS, THEMES); GPT_STAGE.station4 = 27;
  installStage3(LAYOUTS, THEMES); Object.assign(GPT_STAGE, S3_STAGE);   // 3판 세 안 (10/24 — stage3-maps.js)
  installCinema(LAYOUTS, THEMES); GPT_STAGE.cinema = 31;
}

export function gptPreview(qs, THEMES) {
  const room = qs.get('gptmap');
  if (!room || !THEMES[room] && !GPT_STAGE[room]) return null;
  const lv = +(qs.get('lv') || GPT_STAGE[room] || 1);
  const previewZoom = +qs.get('gptzoom');   // workshop camera only; campaign zoom stays in stages.js
  return { idx: lv - 1, direct: true, preview: true,
    spec: { room, n: 6, lock: [], clutter: 0, timed: false, night: false, gray: false, dark: false, showcase: false, time: 9999, zoom: Number.isFinite(previewZoom) && previewZoom > 0 ? Math.max(.5, Math.min(3, previewZoom)) : 1 } };
}

// 18~21판 다시 (① 10/23 — redo1-maps.js): 새로 지은 맵 키의 미리보기 판 번호
import { REDO1_STAGE } from './redo1-maps.js';
Object.assign(GPT_STAGE, REDO1_STAGE);
