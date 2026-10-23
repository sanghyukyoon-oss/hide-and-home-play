// 18판 비교안 '너굴이네 오락실 2층집' otakuloft4 (① 10/23 — 사용자 승인 방향: 1층은 문 닫은 동네 오락실, 2층이 너굴이 방, 건물은 오락기 모양 단면,
// 지붕엔 조이스틱 간판, 시간 놀이와 이어지게; 공통 — 판마다 거대 소품 건물 하나, 뒤 멀리 다음 판 건물(19판 소방서)이 작게 보이는 이어지는 동네).
// 게임기 집 otakuloft3는 그대로 두고 나란히 고르게 하는 안. 건물·섬·뒤 동네는 gfx/otakuloft4-props.js ol4_shell.
// 2층(다락 판, 바닥 2.1 m) — 너굴이 이불·만화책장(비밀 칸)·빨래 건조대·컴퓨터 책상·브라운관·둥지·러그·빈백;
// 1층 오락실 — 앞: 인형 뽑기 둘·빨강 경품 오락기(자물쇠), 2층 밑: 캡슐 뽑기·동전 교환기·오락기 둘·경품 상자·세탁기(너굴이 빨래)
// 부품 키 유지: arcade3(pad)·drawerstairs(code, 2층으로)·loftpulley(단서 걸이)·mangashelf·crtset·beanbag. 판 표는 그대로 — ?gptmap=otakuloft4.
import { registerFurniture } from './gfx/furniture.js';
import { OL4_BUILDERS, OL4_INFO } from './gfx/otakuloft4-props.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const Y2 = 2.1, LF = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts, y: Y2 });
// 1층 바닥은 오락실 카펫(남색에 분홍 점), 받침은 캐비닛 몸 색 — 옛 테마는 main.js가 뒤에 만들어서 처음 쓸 때 합침
const OWN = { name: '너굴이네 오락실 2층집', friend: 'raccoon', floorKind: 'carpet', floor: '#4a4f86', floor2: '#ff9fcf', base: '#a8433f', rug: '#5d6aa6', rug2: '#ffd98a' };
let memo = null, memoOf = null;

export function installOtakuloft4(LAYOUTS, THEMES) {
  registerFurniture(OL4_BUILDERS, OL4_INFO);
  Object.defineProperty(THEMES, 'otakuloft4', { configurable: true, enumerable: true, get() {
    const b = THEMES.otakuloft || THEMES.oneroom || THEMES.my;
    if (memoOf !== b) { memoOf = b; memo = { ...b, ...OWN }; }
    return memo;
  } });
  LAYOUTS.otakuloft4 = { w: 7, d: 6, slab: 'none', bleed: null, wallH: 3.3, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    yaw: .62, fitW: 13.4, homeShift: [-.4, -.45],
    lofts: [{ i: 0, j: 0, w: 7, d: 3, y: Y2, ladder: 'stairs', ladderAt: 3.0 }],
    furniture: [
      { type: 'ol4_shell', x: 0, z: 0, a: 0 },
      // 2층 너굴이 방
      LF('otakufuton', 0, 0), LF('mangashelf', 1, 0, 0, { h: 1.45, seed: 4, secret: true }), LF('dryrack', 2, 0), LF('pcdesk', 3, 0), LF('crtset', 4, 0), LF('loftnest', 6, 0),
      LF('rug', 3, 1), LF('beanbag', 4, 1), LF('floormess', 1, 2, 0, { kind: 1 }),
      // 1층 오락실: 2층 밑 줄
      F('boxstack', 0, 0), F('gpt_gacha', 1, 0), { ...F('ol4_changer', 2, 0), dx: .1 }, F('arcade3', 3, 0, 0, { kind: 1 }), F('arcade3', 4, 0, 0, { kind: 2 }), F('gamerack', 5, 0), F('washer2', 6, 0), F('laundrybasket', 6, 1),
      // 앞: 인형 뽑기 둘(옆벽 따라), 빨강 경품 오락기, 2층으로 서랍 계단과 바구니 도르래
      F('sp2_claw', 0, 3, 1), F('sp2_claw', 0, 4, 1), F('arcade3', 1, 3, 0, { kind: 0, prize: true }),
      F('loftpulley', 5, 3, 0, { y: Y2 }), F('drawerstairs', 6, 3, 0, { y: Y2 }),
      F('parcel', 4, 5), F('trash', 6, 5)],
    decor: [],
    friendAt: [.6, 1.4] };
}
