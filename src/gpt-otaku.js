// Art-only maps. Installed at boot without changing a shipped map, builder or campaign stage.
const P = (type, x, z, a = 0, more = {}) => ({ type, x, z, a, ...more });
const D = (type, wall, u, more = {}) => ({ type, wall, u, ...more });

export function installGptOtakuMaps(MAPS, THEMES) {
  // GPT 원색 테마 (작업장 그대로: 낮, 회청 하늘). 18판은 이 색을 바탕으로 — 사용자 10/22 "GPT 원색이 더 낫다", 목표는 1~10판처럼 귀엽고 부드럽게
  const GPT_T = {
    ...THEMES.my, name: '너굴이네 비 오는 복층', friend: 'raccoon',
    bg: ['#a5b8c1', '#d6d6c8'], base: '#d6c2a5', floorKind: 'planks', floor: '#e6d3b5', floor2: '#cbb795',
    sky: ['#91a9b7', '#d1d9d6', '#e9decb'],
    wallKind: 'plain', wall: '#f3ecdc', wall2: '#e8decc', wainscot: '#e3d8c3', trim: '#f9efdc', wallEdge: '#fff2dc',
    wood: '#d6ae7c', woodD: '#a67c52', body: '#f7eedc', accent: '#6e9f9c', accent2: '#9bb3bd', accent3: '#d48b6d',
    light: { ambColor: '#e2e5eb', amb: 1.4, sunColor: '#ffe6bf', sun: 2.10 },
    pool: ['gamepad', 'milk', 'cookie', 'sock', 'slipper', 'remote'],
  };
  // gptotaku = 판에서 여는 키(18판 비 오는 밤 빛은 look.js가 옛 키 otakuloft에서 빌림), gptotakuday = 같은 방을 GPT 낮 하늘로
  // (색은 GPT 원색 그대로 — 사용자 10/23 "채색할수록 이상해진다 … GPT 원안으로")
  const T = THEMES.gptotaku = { ...GPT_T };
  const TD = THEMES.gptotakuday = { ...GPT_T };
  const shell = (theme, furniture, decor, more = {}) => ({
    w: 7, d: 6, theme, exact: true, bleed: null, slab: 'none', wallH: 4.05,
    walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' }, sun: [], furniture, decor, ...more,
  });
  const room = T => ({ theme: T, bleed: false, fitW: 10.6, fitAll: true, yaw: .72, friendAt: [1.95, 2.15], rooms: [
    { at: [0, 0], layout: shell(T, [
      P('gpt_mezzanine', -1.4, -1.65),
      P('gpt_storage_stairs', 1.11, .93, 0, { opts: { h: 2.205 } }),
      P('gpt_loft_bed', -2.5, -1.65, 0, { y: 2.205 }),
      P('gpt_mangashelf', -.38, -2.55, 0, { y: 2.205, s: 1.20, opts: { low: true } }),
      P('gpt_bedside', -1.48, -2.30, 0, { y: 2.205 }),
      P('gpt_mangastack', -.62, -1.17, .13, { y: 2.205 }),
      P('gpt_mangashelf', -2.45, -2.73, 0, { s: .91 }),
      P('gpt_mangashelf', -1.13, -2.73, 0, { s: .91 }),
      P('gpt_crtconsole', -0.8, -0.03),
      P('gpt_arcade', 1.97, -2.44),
      P('gpt_figurecase', 3.0, -2.50),
      P('gpt_pcdesk', 2.27, -0.62),
      P('gpt_gamingchair', 2.17, 0.58, Math.PI),
      P('hanger', -3.21, -1.4, Math.PI / 2, { s: .72 }),
      P('gpt_reading_bay', -3.01, .95, Math.PI / 2),
      P('gpt_floorlamp', -2.34, .65),
      P('gpt_woven_rug', -.69, 1.38),
      P('gpt_beanbag', -1.47, 2.04, -.15),
      P('gpt_coffee_table', -0.12, 1.25),
      P('gpt_snacktray', -.28, .91, -.1, { y: .425, s: .8 }),
      P('gpt_mangastack', -1.06, 2.70, .25),
      P('gpt_laundry', -0.45, 2.7, -.08),
      P('gpt_minifridge', 2.9, 1.82),
      P('plantshelf', 2.97, 2.57, -.32, { s: .58 }),
    ], [
      D('gpt_rain_window', 'W', -.95, { opts: { w: 1.75, h: 2.5, y: 2.22 } }),
      D('gpt_posterwall', 'N', 2.22, { dy: 1.98, s: 1.35 }),
      D('gpt_posterwall', 'N', -2.48, { dy: 2.35, s: .85 }),
      D('aircon2', 'W', 1.80, { dy: 1.20, s: .75 }),
    ]) },
  ] });
  MAPS.gptotaku = () => room(T); MAPS.gptotakuday = () => room(TD);
  // 섞은 안 (사용자 10/22 "원본과 gpt 적절히 섞어서 재배치"): GPT의 복층·수납 계단·비 오는 창·다락 침대는 그대로, 옛 18판(otakuloft)의 빨강 오락기 둘·빨래건조대 옷걸이·
  // 둥근 러그·고양이 방석·꼬마전구·애니 포스터·만화 벽 선반·벗어 둔 것들·휴지통을 들임 (자물쇠 자리 미니 냉장고·계단은 같은 키)
  // (18판 룩뎁 10/22 사용자 "벽지나 이런 것도 좀 넣어 주고 … 룩뎁 신경 써서"): 벽은 옛 18판처럼 옅은 세로 줄무늬 벽지 + 흐린 청록 판벽(액자 판·몰딩),
  // 바닥은 꿀색 쪽으로 한 톤(밝은 크림 벽과 떨어져 보이게), 러그는 흐린 파랑 — 채도는 PAL.otaku 상한 안에서
  // (2차 10/22 사용자 "텍스처 디테일하게"): 벽지는 넓은 띠·핀 줄무늬·작은 반짝이 무늬 otakupaper, 마루는 20 cm 널·나뭇결·옹이 otakuoak
  // (둘 다 gfx/gpt-otaku-room.js), 띠 색은 한 톤 더 짙게(밤빛 아래서도 무늬가 읽히게), 러그는 한 톤 깊은 파랑(하트·꽃 테가 떠 보이게)
  const TM = THEMES.gptotakumix = { ...T, wallKind: 'otakupaper', floorKind: 'otakuoak' };
  // 오락기 둘은 북쪽 벽에 반듯이 한 줄(기울기 없음, 뒤 틈 3 cm — '오락기 뒤' 자리), 계단 층계참 오른쪽으로 비켜서 화면이 가리지 않게;
  // 모니터는 우리 것(옛 18판 pcdesk·crtset): 브라운관은 복층 데크 앞 끝 밑(띠등 아래), 컴퓨터 책상은 동쪽 끝에서 앞을 보고 —
  // 계단 옆 수납장 문이 열릴 자리와 계단 옆 통로(x 2.25 줄)는 비움; 장스탠드는 창가 벤치 북쪽 끝으로(가운데 통로를 막던 자리)
  MAPS.gptotakumix = () => ({ theme: TM, bleed: false, fitW: 10.6, fitAll: true, yaw: .72, friendAt: [1.95, 2.15], rooms: [
    { at: [0, 0], layout: shell(TM, [
      P('gpt_mezzanine', -1.4, -1.65, 0, { opts: { lights: true } }),
      P('gpt_storage_stairs', 1.11, .93, 0, { opts: { h: 2.205 } }),
      P('gpt_loft_bed', -2.5, -1.65, 0, { y: 2.205 }),
      P('gpt_mangashelf', -.38, -2.55, 0, { y: 2.205, s: 1.20, opts: { low: true } }),
      P('gpt_bedside', -1.48, -2.30, 0, { y: 2.205 }),
      P('dryrack', -.45, -1.05, 0, { y: 2.205, s: .9 }),
      P('gpt_mangashelf', -2.45, -2.73, 0, { s: .91 }),
      P('gpt_mangashelf', -1.13, -2.73, 0, { s: .91 }),
      P('crtset', -1.05, -.76),
      P('arcade3', 1.05, -2.36, 0, { opts: { kind: 0, prize: true } }),
      P('arcade3', 1.85, -2.36, 0, { opts: { kind: 1 } }),
      P('gpt_figurecase', 3.0, -2.50),
      P('pcdesk', 3.0, .3),
      P('gpt_reading_bay', -3.01, .95, Math.PI / 2),
      P('gpt_floorlamp', -2.25, -.36),
      P('rug', -.6, 1.4),
      P('gpt_beanbag', -1.47, 2.04, -.15),
      P('gpt_coffee_table', -0.12, 1.25),
      P('gpt_snacktray', -.28, .91, -.1, { y: .425, s: .8 }),
      P('catbed', -3.0, 2.45, .3, { s: .85 }),
      P('floormess', -1.06, 2.7, 0, { s: .85, opts: { kind: 1 } }),
      P('gpt_laundry', -0.45, 2.7, -.08),
      P('gpt_minifridge', 2.9, 1.82),
      P('parcel', 3.1, 1.05, -.2, { s: .85 }),
      P('trash', .15, -2.6, 0, { s: .85 }),
      P('plantshelf', 2.97, 2.57, -.32, { s: .58 }),
    ], [
      D('gpt_rain_window', 'W', -.95, { opts: { w: 1.75, h: 2.5, y: 2.22, night: true } }),
      D('otakuposter', 'N', -2.48, { opts: { kind: 0, y: 3.05 } }),
      D('otakuposter', 'N', 2.0, { opts: { kind: 2, y: 2.55 } }),
      D('fairylights', 'N', 1.95, { opts: { len: 3, y: 3.25 } }),
      D('otakushelf', 'N', .9, { opts: { y: 2.55 } }),
      D('otakuframes', 'N', 3.0, { opts: { y: 2.45 } }),
      D('aircon2', 'W', 1.80, { dy: 1.20, s: .75 }),
    ], { panels: true }) },
  ] });
}
