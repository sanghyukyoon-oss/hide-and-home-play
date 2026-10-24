// 18판 새 안 '너굴이네 오락실 2층집' otakuloft5 (① 10/23 — 사용자 "완전히 새롭게 다시. 지금 예전 계단 같은 거 너무 별로야", B안 방향으로 하나만).
// 옛 18판 구조(방 안 다락·서랍 계단)를 따르지 않고 진짜 두 층: 1층 문 닫은 동네 오락실, 2층 너굴이 방(두꺼운 2층 바닥판이 뒤 절반, 앞은 두 층 높이).
// 오르기는 철제 나선 계단, 내려오기는 노란 미끄럼틀, 물건은 집게 크레인 바구니(loftpulley 자리), 자물쇠 code는 2층 긴 서랍장(drawerstairs 자리 — 이름 유지,
// gptHero로 모양만 바꿈). 건물·섬·뒤 동네는 gfx/otakuloft5-props.js ol5_shell. 판 표(PLAN)는 그대로 — 미리보기 ?gptmap=otakuloft5.
// 부품 키 유지: arcade3(pad, 빨강 경품 오락기)·drawerstairs(code)·loftpulley(단서 걸이)·mangashelf·crtset·beanbag.
// (10/24 사용자 "2층 가구는 원래 우리가 쓰던 어셋으로 · 오락기는 디테일업이나 새로 · 톤도"): 2층은 옛 18판 너굴이네 복층의 우리 가구로 — 너굴이 이불
// (인형·만화책), 만화책장(빨간 권), 컴퓨터 책상, 브라운관 세트, 다락 둥지(스탠드·만화책 탑), 러그 위 빈백, 빨래 바구니, 벗어 둔 과자 봉지;
// 1층 기계는 새로 지은 우리 그림체 — 오락기 셋(arcade3 자리에 opts.gptHero 'ol5_cab': 부품·자물쇠 약속은 그대로), 인형 뽑기 둘(분홍 곰·민트 토끼),
// 캡슐 뽑기(GPT gpt_gacha 폐기), 동전 교환기, 경품 진열장.
import { registerFurniture } from './gfx/furniture.js';
import { OL5_BUILDERS, OL5_INFO, OL5_Y } from './gfx/otakuloft5-props.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const UP = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts, y: OL5_Y });
const CAB = (i, j, opts) => F('arcade3', i, j, 0, { gptHero: 'ol5_cab', ...opts });
// (1층 카펫·2층 러그 색: 큰 면은 순하게 — 바닥은 셸의 우주 카펫이 덮고, 방 바닥 색은 그 바탕과 같게)
const OWN = { name: '너굴이네 오락실 2층집', friend: 'raccoon', floorKind: 'carpet', floor: '#686da6', floor2: '#8b90c9', base: '#6a6688', rug: '#6f86c2', rug2: '#ffd98a' };
let memo = null, memoOf = null;

export function installOtakuloft5(LAYOUTS, THEMES) {
  registerFurniture(OL5_BUILDERS, OL5_INFO);
  Object.defineProperty(THEMES, 'otakuloft5', { configurable: true, enumerable: true, get() {
    const b = THEMES.otakuloft || THEMES.oneroom || THEMES.my;
    if (memoOf !== b) { memoOf = b; memo = { ...b, ...OWN }; }
    return memo;
  } });
  LAYOUTS.otakuloft5 = { w: 7, d: 6, slab: 'none', bleed: null, wallH: 3.3, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (카메라: 돌려 볼 때 건물이 가운데 남게 중심은 섬 가운데, 시작 화면은 건물이 꽉 차게 — ① 10/24 사진 확인)
    yaw: .62, fitW: 9.6,
    furniture: [
      { type: 'ol5_shell', x: 0, z: 0, a: 0 },
      // 2층 너굴이 방 (바닥 2.5 m) — 가구는 전부 우리가 1~17판에서 쓰던 것 (사용자 10/24 "2층 가구들 전부 우리가 원래 쓰던 가구들로
      // 재배치하기로 안 했음?"): 뒤 벽 줄 다락 이불(1×2)·책장·컴퓨터 책상·낮은 TV장(2×1, 게임기)·서랍장(비밀번호 칸)·스탠드 조명;
      // 가운데 줄: 화분·러그와 빈백·빨래 바구니; 앞 난간 줄은 비움 (미끄럼틀 입구·나선 계단 도착 칸)
      UP('futon', 0, 0), UP('bookshelf', 1, 0, 0, { seed: 4 }), UP('pcdesk', 2, 0), UP('tvlow', 3, 0), UP('drawers', 5, 0), UP('floorlamp', 6, 0),
      UP('plant', 1, 1), UP('rug', 2, 1), UP('beanbag', 3, 1), UP('laundrybasket', 6, 1),
      // 1층 오락실 — 2층 밑 줄(카메라를 낮춰야 보이는 안쪽): 오락기 둘(하늘·라일락)·캡슐 뽑기·동전 교환기·경품 진열장·택배 상자
      { ...CAB(0, 0, { kind: 1, gap: 1 }), dx: -.06 }, { ...CAB(1, 0, { kind: 2 }), dx: .06 }, F('ol5_gacha', 2, 0), { ...F('ol5_changer', 3, 0), dx: .1 }, F('ol5_prizewall', 4, 0), F('boxstack', 6, 0),
      // 앞(두 층 높이): 왼쪽 미끄럼틀(2층 → 1층), 빨강 경품 오락기(자물쇠), 가운데 집게 크레인 바구니, 인형 뽑기 둘(분홍 곰·민트 토끼), 오른쪽 나선 계단(1층 → 2층)
      F('ol5_slide', 0, 3), CAB(1, 3, { kind: 0, prize: true, gap: -1 }), F('loftpulley', 3, 3, 0, { y: OL5_Y, gptHero: 'ol5_crane' }),
      // (인형 뽑기는 옛 것보다 커서 조금 뒤·안쪽으로, 휴지통은 왼쪽으로 — 앞 줄 길이 이어지게: 보행 섬 0)
      { ...F('ol5_claw', 4, 4, 0, { kind: 0 }), dx: .04, dz: -.12 }, { ...F('ol5_claw', 5, 4, 0, { kind: 1 }), dx: -.1, dz: -.12 }, F('ol5_spiral', 6, 3),
      F('parcel', 6, 5), { ...F('trash', 3, 5), dx: -.3 }],
    decor: [],
    friendAt: [-.6, 1.9] };
}
