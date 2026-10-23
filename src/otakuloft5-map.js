// 18판 새 안 '너굴이네 오락실 2층집' otakuloft5 (① 10/23 — 사용자 "완전히 새롭게 다시. 지금 예전 계단 같은 거 너무 별로야", B안 방향으로 하나만).
// 옛 18판 구조(방 안 다락·서랍 계단)를 따르지 않고 진짜 두 층: 1층 문 닫은 동네 오락실, 2층 너굴이 방(두꺼운 2층 바닥판이 뒤 절반, 앞은 두 층 높이).
// 오르기는 철제 나선 계단, 내려오기는 노란 미끄럼틀, 물건은 집게 크레인 바구니(loftpulley 자리), 자물쇠 code는 2층 긴 서랍장(drawerstairs 자리 — 이름 유지,
// gptHero로 모양만 바꿈). 건물·섬·뒤 동네는 gfx/otakuloft5-props.js ol5_shell. 판 표(PLAN)는 그대로 — 미리보기 ?gptmap=otakuloft5.
// 부품 키 유지: arcade3(pad, 빨강 경품 오락기)·drawerstairs(code)·loftpulley(단서 걸이)·mangashelf·crtset·beanbag.
import { registerFurniture } from './gfx/furniture.js';
import { OL5_BUILDERS, OL5_INFO, OL5_Y } from './gfx/otakuloft5-props.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const UP = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts, y: OL5_Y });
const OWN = { name: '너굴이네 오락실 2층집', friend: 'raccoon', floorKind: 'carpet', floor: '#4a4f86', floor2: '#ff9fcf', base: '#a8433f', rug: '#5d6aa6', rug2: '#ffd98a' };
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
      // 2층 너굴이 방 (바닥 2.5 m): 로프트 침대(밑 책상)·만화책장(빨간 권 → 숨은 칸)·브라운관과 빈백·긴 서랍장(비밀번호 칸)·러그·빨래 건조대·빨래 바구니·벗어 둔 것들
      UP('loftbed', 0, 0), UP('mangashelf', 2, 0, 0, { h: 1.45, seed: 4, secret: true }), { ...UP('crtset', 3, 0), dz: .14 }, UP('drawerstairs', 5, 0, 1, { gptHero: 'ol5_chest' }),
      UP('rug', 2, 1), UP('beanbag', 4, 1), UP('dryrack', 6, 1), UP('laundrybasket', 1, 2), UP('floormess', 5, 2, 0, { kind: 1 }),
      // 1층 오락실 — 2층 밑 줄(카메라를 낮춰야 보이는 안쪽): 오락기 둘·캡슐 뽑기·동전 교환기·경품 진열장·경품 상자
      F('arcade3', 0, 0, 0, { kind: 1 }), F('arcade3', 1, 0, 0, { kind: 2 }), F('gpt_gacha', 2, 0), { ...F('ol4_changer', 3, 0), dx: .1 }, F('ol5_prizewall', 4, 0), F('boxstack', 6, 0),
      // 앞(두 층 높이): 왼쪽 미끄럼틀(2층 → 1층), 빨강 경품 오락기(자물쇠), 가운데 집게 크레인 바구니, 인형 뽑기 둘, 오른쪽 나선 계단(1층 → 2층)
      F('ol5_slide', 0, 3), F('arcade3', 1, 3, 0, { kind: 0, prize: true }), F('loftpulley', 3, 3, 0, { y: OL5_Y, gptHero: 'ol5_crane' }),
      F('sp2_claw', 4, 4), F('sp2_claw', 5, 4), F('ol5_spiral', 6, 3),
      F('parcel', 6, 5), F('trash', 3, 5)],
    decor: [],
    friendAt: [-.6, 1.9] };
}
