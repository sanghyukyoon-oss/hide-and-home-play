// 31판 새 보스 맵 「별빛극장의 비밀 영사실」 cinema (⑧ 10/23 — 스토리 룸 안 A, ② 레벨 자물쇠 조건, ③ 연출 필드; 모델은 gfx/cinema-props.js).
// 방 하나(9 × 6 m) 위에 바탕 조각 cin_shell(둥근 섬·바닥·뒷벽·거대 필름 릴 벽·무대·칸막이)과 극장 가구를 놓는다. 2층 영사실은 엔진 다락(lofts:
// 갑판·난간·동쪽 사다리) 위의 작은 부스(cin_projroom_door)이고, 그 안에 영사기. 걸어 다니는 곳은 1층(보행 섬 0 — walk.mjs).
// 판 종류는 보스(3장 자물쇠 pad·code·color): ② 몫 stageSpec lockOn { code: cin_ticketbooth, pad: cin_hall_door, color: cin_projroom_door },
// clueHang pad → cin_popcorn(팝콘 기계가 넘치면 위 선반 열쇠가 툭). 친구는 삐딱이(grumpy). 저녁 빛은 look.js RECIPES.cinema.
// 미리보기: ?gptmap=cinema (gpt-import.js GPT_STAGE 31), shoot.py 31:cinema.
import { registerFurniture } from './gfx/furniture.js';
import { CIN_BUILDERS, CIN_INFO, CIN, CIN_BOOTH } from './gfx/cinema-props.js';

const PI = Math.PI, HP = PI / 2;
const F = (type, x, z, a = 0, opts = null, y = null) => ({ type, x, z, a, ...(opts ? { opts } : {}), ...(y != null ? { y } : {}) });
// 자리 (방 기준 미터; 카메라는 +x +z 쪽, 뒷벽 N은 z -3, 릴 벽 W는 x -4.5)
const DECK = CIN.LOFT.y;
const BOOTH_AT = [1.45, -2.38];
const PROJ_AT = [.95, -2.46, DECK + .06];
const SCREEN_AT = [-4.38, -.35, CIN.STAGE.h];
// 영사기 기준(a = -90°: 영사기 +z가 방 -x) 영사 창 자리와 스크린 가운데까지 — f.lensAt·f.beam
const toProj = ([x, y, z]) => [z - PROJ_AT[1], y - PROJ_AT[2], PROJ_AT[0] - x];
const LENS_W = [BOOTH_AT[0] + CIN_BOOTH.LENS[0], DECK + CIN_BOOTH.LENS[1], BOOTH_AT[1] + CIN_BOOTH.LENS[2]];
const SCREEN_W = [SCREEN_AT[0] + .006, SCREEN_AT[2] + 1.42, SCREEN_AT[1]];
const LENS = toProj(LENS_W), AIM = toProj(SCREEN_W).map((v, i) => +(v - LENS[i]).toFixed(3));

export const CINEMA_THEME = base => ({ ...base, name: '별빛극장', friend: 'grumpy', bg: ['#c3c8ec', '#9aa3dc'],
  base: '#b9afa4', floorKind: 'carpet', floor: '#92474f', floor2: '#7d3d45', wood: '#d9a066', woodD: '#9a6538', fwood: '#d9a066', fwoodD: '#9a6538',
  wall: '#efdccd', wall2: '#e3c3b2', trim: '#fff4e2',
  pool: ['snack', 'juicebox', 'candy', 'umbrella', 'glasses', 'bubbletea', 'cookie', 'coffee'] });

export function installCinema(LAYOUTS, THEMES) {
  registerFurniture(CIN_BUILDERS, CIN_INFO);
  THEMES.cinema = CINEMA_THEME(THEMES.alley1 || THEMES.my);
  LAYOUTS.cinema = { w: CIN.RW, d: CIN.RD, theme: THEMES.cinema, slab: 'none', bleed: null, wallH: CIN.NH, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (카메라 — 허브 10/24 '화면 꽉': 판 줌 1.5를 곱하면 폭 약 10.6 m — 릴·세로 간판·영사실·팝콘 통이 폰 세로 화면 가운데를 채우고 섬 끝만 살짝 잘림;
    // 키 큰 간판·릴 때문에 무게가 위로 쏠려, 보는 곳을 카메라 반대쪽(뒤·왼쪽)으로 옮겨 그림 가운데가 위아래 HUD 사이에 오게)
    yaw: .7, fitW: 15.0, homeShift: [-2.0, -2.4],
    // 2층 영사실 갑판 (엔진 다락: 갑판·앞 난간, 동쪽 사다리)
    lofts: [{ i: CIN.LOFT.x0 + CIN.RW / 2, j: 0, w: CIN.LOFT.x1 - CIN.LOFT.x0, d: CIN.LOFT.z1 - CIN.LOFT.z0, y: DECK, ladder: 'E', ladderAt: .55 }],
    furniture: [
      F('cin_shell', 0, 0),
      // 뒷벽 위에 높이 선 거대 세로 전구 간판 (카메라 쪽으로 조금 돌림)
      F('cin_marquee', -2.25, -3.12, .5, null, CIN.NH),
      // 무대: 스크린, 그 앞 커튼
      F('cin_screen', SCREEN_AT[0], SCREEN_AT[1], HP, null, SCREEN_AT[2]),
      F('cin_curtain', -4.08, -.35, HP, null, CIN.STAGE.h),
      // 객석: 좌석 줄 둘(넷씩) + 마지막 줄은 커플석과 좌석 둘 (모두 스크린을 봄)
      F('cin_seatrow', -2.95, -.35, -HP, { n: 4, under: [1, 2] }), F('cin_seatrow', -2.0, -.35, -HP, { n: 4, under: [0, 3] }),
      F('cin_twinseat', -1.05, -.98, -HP), F('cin_seatrow', -1.05, .25, -HP, { n: 2, under: [1] }),
      // 로비: 다락 밑 상영관 문, 팝콘 매점(위 선반), 팝콘 통 매표소, 오늘의 상영 판, 포스터 받침, 벤치·휴지통
      F('cin_hall_door', 1.0, -1.33), F('cin_popcorn', 2.12, -.88),
      F('cin_ticketbooth', 3.9, -2.2, .35), F('cin_showtimes', 3.95, -.5, -.6),
      F('cin_posterstand', 1.95, 2.4, -.2, { k: 1 }), F('bench', 3.6, 2.45, 0, { bigSpots: true }), F('trash', 4.15, .75),
      // 2층: 영사실 부스, 안의 영사기, 문 옆 필름 통
      F('cin_projroom_door', BOOTH_AT[0], BOOTH_AT[1], 0, null, DECK),
      F('cin_projector', PROJ_AT[0], PROJ_AT[1], -HP, { lens: LENS, aim: AIM, beamSize: [2.7, 1.55] }, PROJ_AT[2]),
      F('cin_filmcans', .72, -1.5, 0, null, DECK),
      // 극장 앞 (섬 위): 세워 둔 자전거
      F('bike', 5.05, 1.0, HP),
    ],
    decor: [],
    friendAt: [-.35, 2.0] };
}
