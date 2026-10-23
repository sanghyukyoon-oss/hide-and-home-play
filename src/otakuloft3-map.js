// 18판 새 안 '너굴이네 게임기 집' otakuloft3 (① 10/23 — 사용자 "다시 맵 디자인 해 줄래? ㅠㅠ GPT 것도 별로고.. 새로 디테일 있게"; GPT·Argon 안 탈락).
// 레퍼(캠핑카·정비소 단면, "진즉 이런 걸" 버거 가게)처럼 너굴이 오타쿠 집을 '거대 게임기 모양 단면'으로: 뒷벽은 휴대용 게임기 앞면(화면 창·십자 창·A·B 창·
// 꼭대기 카트리지), 옆벽은 세워 둔 카트리지(라벨·현관문), 둥근 작은 섬(젖은 보도·웅덩이·가로등 하나) — gfx/otakuloft3-props.js ol3_shell.
// 옛 18판(otakuloft)의 좋은 것은 그대로 우리 모델로: 빨강 경품 오락기, 만화책장(비밀 칸), 다락 이불·둥지·빨래 건조대, 러그·빈백, 생활 소품.
// 장치·자물쇠·대본의 부품 키 유지: arcade3(pad 자물쇠)·drawerstairs(code, 다락 계단)·loftpulley(단서 걸이)·mangashelf·crtset·beanbag.
// 판 표(stages.js PLAN)는 그대로 — 미리보기 ?gptmap=otakuloft3 (GPT_STAGE 18), 대본·물건 풀·빛은 roomalias.js로 otakuloft 것.
import { registerFurniture } from './gfx/furniture.js';
import { OL3_BUILDERS, OL3_INFO } from './gfx/otakuloft3-props.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const LF = (type, i, j, rot = 0, opts, y = 1.65) => ({ type, i, j, rot, opts, y });
// 테마: 옛 18판 색 그대로(가구가 읽는 키), 바닥 받침만 게임기 몸 색 — 옛 테마는 main.js가 뒤에 만들어서 처음 쓸 때 합침
const OWN = { name: '너굴이네 비 오는 복층', friend: 'raccoon', base: '#a99fc6', rug: '#5d6aa6', rug2: '#ffd98a' };
let memo = null, memoOf = null;

export function installOtakuloft3(LAYOUTS, THEMES) {
  registerFurniture(OL3_BUILDERS, OL3_INFO);
  Object.defineProperty(THEMES, 'otakuloft3', { configurable: true, enumerable: true, get() {
    const b = THEMES.otakuloft || THEMES.oneroom || THEMES.my;
    if (memoOf !== b) { memoOf = b; memo = { ...b, ...OWN }; }
    return memo;
  } });
  LAYOUTS.otakuloft3 = { w: 7, d: 6, slab: 'none', bleed: null, wallH: 3.3, sun: [], walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
    // (카메라: 게임기 앞면이 조금 더 정면으로, 섬 앞쪽까지 한 화면에 — 판 줌 1.35를 곱한 뒤 기준)
    yaw: .62, fitW: 11.0, homeShift: [-.55, -.4],
    lofts: [{ i: 0, j: 0, w: 4, d: 2, y: 1.65, ladder: 'stairs', ladderAt: 1.5 }],
    furniture: [
      { type: 'ol3_shell', x: 0, z: 0, a: 0 },
      // 다락: 이불·만화책장(빨간 권 → 숨은 칸)·둥지·빨래 건조대, 큰 화면 창 밑엔 컴퓨터 책상
      LF('otakufuton', 0, 0), LF('mangashelf', 1, 0, 0, { h: 1.45, seed: 4, secret: true }), LF('loftnest', 1, 1), LF('dryrack', 2, 0), LF('pcdesk', 3, 0),
      // 다락 밑: 투명 서랍장·게임 상자 선반·택배 상자 더미·카트리지 책장, 빨래 바구니
      F('pdrawers', 0, 0), F('gamerack', 1, 0), F('boxstack', 2, 0), F('ol3_cartshelf', 3, 0), F('laundrybasket', 0, 1),
      F('drawerstairs', 3, 2), F('loftpulley', 2, 2),
      // 게임기 오른쪽 날개 밑: 빨강 경품 오락기와 까만 오락기 (계단 끝과 사이를 비워 다락 밑으로 가는 길)
      { ...F('arcade3', 4, 0, 0, { kind: 0, prize: true }), dx: .42 }, { ...F('arcade3', 5, 0, 0, { kind: 2 }), dx: .72 },
      // 카트리지 벽 쪽: 브라운관 세트, 현관 신발장
      F('crtset', 0, 2, 1), F('shoerack', 0, 4, 1),
      // 가운데: 러그·빈백·컨트롤러 소파(브라운관을 봄)·벗어 둔 것들
      F('rug', 1, 2), F('beanbag', 1, 4), F('ol3_padsofa', 2, 3, 3), F('floormess', 4, 3, 0, { kind: 1 }),
      // 열린 오른쪽: 미니 냉장고·드럼 세탁기(앞을 보고 — 사용자 10/23 '현실적인 생활 디테일', 초기 복층 집의 세탁기)·화분, 앞: 택배·휴지통
      F('minifridge', 6, 2), F('washer2', 6, 3), F('plant', 6, 4), F('parcel', 5, 5), F('trash', 6, 5)],
    decor: [],
    friendAt: [1.3, 1.0] };
}
