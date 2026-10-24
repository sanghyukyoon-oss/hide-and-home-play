// 28판 기차 여행 찾을 물건 (⑧ 10/24, 사용자 "찾는 물건 다 새롭게 해줄래? 계속 찾는것만 찾으니 이상하다"; 허브: 기차 여행 물건 8개 —
// 기차표·역 도시락·여행 가이드북·필름 카메라·역 스탬프 수첩·보온병 + 귤(mandarin)·스노우볼(snowglobe)). 덩어리 크고 귀엽게, 굵은 잉크선
// (한 덩어리 hmc), 시작 화면 줌에서 28px 넘게 — more-items.js 크기 관례. 글자는 우리 글꼴로 그림(한·영).
//   trainticket 표 지갑째 (가죽 케이스에 투명 창, 그 안에 봄빛 로컬선 표, 끈·똑딱단추)  ekiben 역 도시락 (종이 포장·붉은 끈·나무젓가락)
//   guidebook 여행 가이드북 (호수 섬 지도 표지·색 견출지)  filmcam 필름 카메라 (크림 윗판·검은 몸통·큰 렌즈·셔터·끈 고리)
//   stampbook 역 스탬프 수첩 (펼친 두 쪽에 역 도장)  thermos 보온병 (컵 뚜껑·손잡이 끈·띠)
import * as THREE from 'three';
import { put, grp, mat, mesh, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { addI18n } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
addI18n({
  '기차표': 'Train ticket', '역 도시락': 'Station bento', '여행 가이드북': 'Travel guidebook', '필름 카메라': 'Film camera', '역 스탬프 수첩': 'Station stamp book', '보온병': 'Thermos',
  '봄빛 로컬선': 'Spring Local Line', '벚꽃역': 'Sakura Stn.', '호수 섬': 'Lake Island', '호수 섬 여행': 'Lake Island Trip', '승차권': 'Ticket', '역 스탬프': 'Station stamps',
});
const TX = texCache();
const flat = (w, h, tex) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex, rim: 0 }), { cast: false });
const ticketTex = () => TX.get('trip-ticket', () => textTex(256, 128, (c, W, H) => {
  c.fillStyle = '#e9f4ef'; c.fillRect(0, 0, W, H); c.fillStyle = '#2f9c88'; c.fillRect(0, 0, W, 22);
  fitText(c, '봄빛 로컬선', W / 2, 11, W * .7, 13, '#ffffff', { weight: '700' });
  fitText(c, '벚꽃역', W * .27, 60, W * .4, 20, '#2a2233', { weight: '700' }); fitText(c, '호수 섬', W * .73, 60, W * .4, 20, '#c2453c', { weight: '700' });
  c.fillStyle = '#2a2233'; c.beginPath(); c.moveTo(W * .47, 52); c.lineTo(W * .55, 60); c.lineTo(W * .47, 68); c.fill();
  fitText(c, '승차권', W * .3, 98, W * .4, 13, '#6f6880'); c.fillStyle = '#f2963a'; c.fillRect(W * .62, 88, 70, 18);
}));
const ekibenTex = () => TX.get('trip-ekiben', () => textTex(256, 192, (c, W, H) => {
  c.fillStyle = '#fff3e0'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f6b6c8'; for (let k = 0; k < 9; k++) { const x = (k * 53) % W, y = 20 + (k * 37) % (H - 40); for (let p = 0; p < 5; p++) { const a = p * PI * 2 / 5; c.beginPath(); c.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, 7); c.fill(); } }
  c.fillStyle = '#c2453c'; c.fillRect(W * .2, H * .3, W * .6, H * .4); c.fillStyle = '#fff8ef'; c.fillRect(W * .23, H * .34, W * .54, H * .32);
  fitText(c, '역 도시락', W / 2, H / 2, W * .5, 26, '#c2453c', { weight: '700' });
}));
const guideTex = () => TX.get('trip-guide', () => textTex(256, 320, (c, W, H) => {
  c.fillStyle = '#ffd25a'; c.fillRect(0, 0, W, H); c.fillStyle = '#7cc3ee'; c.fillRect(14, 70, W - 28, 150);
  c.fillStyle = '#9fd07a'; c.beginPath(); c.ellipse(W / 2, 150, 70, 44, 0, 0, 7); c.fill(); c.fillStyle = '#5fb35a'; c.beginPath(); c.arc(W / 2 - 18, 140, 16, 0, 7); c.fill();
  c.fillStyle = '#e8574a'; c.beginPath(); c.arc(W / 2 + 30, 146, 9, 0, 7); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(30, 205); c.quadraticCurveTo(W / 2, 180, W / 2 + 30, 150); c.stroke(); c.setLineDash([]);
  fitText(c, '호수 섬 여행', W / 2, 38, W - 30, 30, '#2a2233', { weight: '700' }); fitText(c, '봄빛 로컬선', W / 2, 260, W - 40, 18, '#2f9c88', { weight: '700' });
}));
const stampTex = () => TX.get('trip-stamps', () => textTex(320, 224, (c, W, H) => {
  c.fillStyle = '#fffaf1'; c.fillRect(0, 0, W, H); c.fillStyle = '#e6dccb'; c.fillRect(W / 2 - 2, 0, 4, H);
  const st = (x, y, r, col, s) => { c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 8, 0, 7); c.stroke(); fitText(c, s, x, y, r * 1.4, 15, col, { weight: '700' }); };
  st(80, 80, 44, '#d9473c', '벚꽃역'); st(240, 120, 48, '#3f7cc4', '호수 섬'); st(90, 175, 30, '#2f9c88', '봄빛');
  fitText(c, '역 스탬프', W * .75, 26, W * .4, 16, '#8b8790', { weight: '700' });
}));

const RAW = {
  // 기차표: a ticket in its leather card case — the clear window shows the printed ticket, a strap loop and a gold snap
  trainticket: { name: '기차표', h: .06, flat: true, build() {
    const g = grp();
    g.add(mc('trip-ticketcase', ({ add, tube }) => {
      add(G.box(.27, .028, .19, .025), '#3f5f9c', 0, .014, 0); add(G.box(.26, .006, .18, .01), '#2f4a7c', 0, .03, 0);
      add(G.box(.23, .004, .13, .008), '#d8eef8', .0, .033, .01); add(G.box(.27, .03, .03, .012), '#34528a', 0, .016, -.095);
      add(G.cyl(.016, .016, .012, 12), '#f2c14e', .1, .036, -.08); tube([-.135, .02, -.06], [-.2, .02, -.1], .01, '#2f4a7c', 6); add(G.tor(.03, .008, PI * 2, 5, 12), '#2f4a7c', -.215, .02, -.11, HP, 0, 0);
    }));
    const t = flat(.21, .11, ticketTex()); put(t, 0, .0365, .01, -HP); g.add(t);
    return g;
  } },
  // 역 도시락: a square box in a printed paper wrap with a red string tied across, chopsticks tucked under the string
  ekiben: { name: '역 도시락', h: .13, build() {
    const g = grp();
    g.add(mc('trip-ekiben', ({ add, tube }) => {
      add(G.box(.26, .1, .2, .02), '#c99a62', 0, .05, 0); add(G.box(.265, .02, .205, .01), '#a8764a', 0, .005, 0);
      add(G.box(.27, .012, .21, .006), '#fff3e0', 0, .106, 0);
      add(G.box(.28, .012, .02, .004), '#d9473c', 0, .114, 0); add(G.box(.02, .012, .22, .004), '#d9473c', 0, .114, 0); add(G.sph(.022, 8, 6), '#d9473c', 0, .122, 0);
      for (const dz of [-.012, .012]) add(G.box(.24, .012, .012, .004), '#e4c08c', .02, .126, .05 + dz, 0, .12, 0);
    }));
    const tp = flat(.26, .19, ekibenTex()); put(tp, 0, .1125, 0, -HP); g.add(tp);
    return g;
  } },
  // 여행 가이드북: a fat paperback lying down, the island map on its cover, coloured index tabs sticking out of the pages
  guidebook: { name: '여행 가이드북', h: .07, flat: true, build() {
    const g = grp();
    g.add(mc('trip-guide', ({ add }) => {
      add(G.box(.22, .06, .28, .012), '#fffaf1', .004, .032, 0); add(G.box(.226, .008, .286, .006), '#e8b84a', 0, .062, 0); add(G.box(.226, .008, .286, .006), '#e8b84a', 0, .004, 0);
      add(G.box(.014, .066, .286, .006), '#d9a83a', -.112, .033, 0);
      for (const [z, c] of [[-.08, '#e8574a'], [-.02, '#5f86c4'], [.05, '#6cc46a'], [.1, '#ff9fb8']]) add(G.box(.04, .008, .03, .004), c, .124, .03 + (z > 0 ? .01 : 0), z);
    }));
    const cv = flat(.21, .27, guideTex()); put(cv, .004, .0665, 0, -HP); g.add(cv);
    return g;
  } },
  // 필름 카메라: a chunky rangefinder — cream top plate, black leatherette body, a big lens, the viewfinder, a red shutter button, strap lugs
  filmcam: { name: '필름 카메라', h: .17, build() {
    const g = grp();
    g.add(mc('trip-filmcam', ({ add }) => {
      add(G.box(.26, .12, .1, .03), '#2f2b38', 0, .07, 0); add(G.box(.27, .045, .105, .02), '#f2e6cc', 0, .145, 0);
      for (let k = 0; k < 5; k++) add(G.box(.24, .006, .004, .002), '#3d3946', 0, .03 + k * .018, .052);
      add(G.cyl(.052, .056, .06, 20), '#3b3647', .02, .07, .07, HP, 0, 0); add(G.cyl(.04, .04, .02, 20), '#c3c9d2', .02, .07, .1, HP, 0, 0); add(G.cyl(.028, .028, .012, 18), '#5fa8d9', .02, .07, .112, HP, 0, 0);
      add(G.box(.05, .03, .02, .008), '#bfe5f8', -.08, .145, .055); add(G.box(.04, .024, .02, .006), '#26232c', .08, .145, .055);
      add(G.cyl(.015, .015, .02, 12), '#e5554b', .09, .177, -.01); add(G.cyl(.02, .02, .016, 12), '#c3c9d2', -.07, .175, -.01);
      for (const s of [-1, 1]) add(G.tor(.014, .004, PI * 2, 4, 10), '#c3c9d2', s * .138, .12, 0, 0, HP, 0);
    }));
    return g;
  } },
  // 역 스탬프 수첩: a little notebook lying open, the station stamps inked on both pages, a ribbon
  stampbook: { name: '역 스탬프 수첩', h: .05, flat: true, build() {
    const g = grp();
    g.add(mc('trip-stampbook', ({ add }) => {
      for (const s of [-1, 1]) { add(G.box(.15, .012, .2, .006), '#3f9e86', s * .078, .006, 0, 0, 0, -s * .05); add(G.box(.14, .01, .19, .004), '#fffaf1', s * .074, .016, 0, 0, 0, -s * .05); }
      add(G.box(.012, .02, .2, .004), '#2f7f6c', 0, .012, 0); add(G.box(.012, .004, .09, .002), '#e5554b', .02, .024, .12, 0, .2, 0);
    }));
    const pg = flat(.28, .19, stampTex()); put(pg, 0, .0225, 0, -HP); g.add(pg);
    return g;
  } },
  // 보온병: a tall flask — the cup lid on top, a band and a strap with a buckle, a little flower on the side
  thermos: { name: '보온병', h: .28, build() {
    const g = grp();
    g.add(mc('trip-thermos', ({ add, tube }) => {
      add(G.cyl(.058, .062, .2, 20), '#7fc8b4', 0, .1, 0); add(G.cyl(.06, .06, .03, 20), '#f2e6cc', 0, .185, 0);
      add(G.cyl(.052, .056, .06, 20), '#3f9e86', 0, .23, 0); add(G.cyl(.054, .054, .01, 20), '#2f7f6c', 0, .262, 0);
      add(G.cyl(.064, .064, .012, 20), '#5fa896', 0, .006, 0);
      tube([.06, .17, 0], [.075, .1, 0], .01, '#e8b84a', 5); tube([.075, .1, 0], [.06, .035, 0], .01, '#e8b84a', 5); add(G.box(.02, .02, .02, .004), '#c3c9d2', .074, .1, 0);
      for (let p = 0; p < 5; p++) { const a = p * PI * 2 / 5; add(G.sph(.012, 6, 4), '#fff3c8', Math.sin(a) * .016, .11 + Math.cos(a) * .016, .062); } add(G.sph(.008, 6, 4), '#f2963a', 0, .11, .066);
    }));
    return g;
  } },
};
export const TRIP_ITEMS = RAW;
