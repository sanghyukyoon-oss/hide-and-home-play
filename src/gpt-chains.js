// GPT 새 맵 연쇄 장치 (②b 레벨, 10/22 — _handoff/device-fun-design-1022.md): 36·43~70판에 들어온 GPT 맵의 장치를 정본 엔진
// 위에서 돌린다. GPT 작업장이 만든 가구 부품(t 0..1로 움직이는 part)은 그대로 쓰고, 연쇄는 판마다 표(CHAINS) 한 줄:
//   도구(dev가 원하는 물건) — 판의 첫 자물쇠 뒤에 숨는다 → 장치 dev를 터치하면 부품이 끝까지 돌고 → 중간(at)에 links가
//   저절로 이어서 움직이고 → 마지막 부품 안(payoff)에서 보상(찾을 물건·자물쇠 열쇠·친구)이 나온다.
// 보조 장치(aux)는 판 목표와 상관없는 장난감: 끝까지 움직이게(reach 1), 단계 소리, 웃긴 한 줄. 같은 판에 둘 이상 같은 조작은 X.
// 훅: chainPrep(room, spec) 짜기 전(보상 자리 비워 두기) · chainPlan(S, plan) 짠 뒤 · runChain(S, part) devices.js RUN.chain
// 맵이 없거나(옛 맵으로 열림) 부품을 못 찾으면 아무것도 안 한다 — 판은 원래대로 돈다.
import * as THREE from 'three';
import { EN } from './i18n-en-dict.js';
import { ITEMS } from './gfx/items.js';
import { grp, put, cyl, sph, rbox, tor } from './gfx/kit.js';
import { rng } from './util.js';
import { CHAINS_A, ON_A } from './gpt-chains-a.js';   // (18~28판 줄 — ② 10/22; GPT 맵 스위치가 켜졌을 때만)
import { CHAINS_B, CHAINS_ON_B } from './gpt-chains-b.js';   // (공원·캠프 새 맵 45·49·55·56·58판 — ②b 10/23)
import { UM_CHAIN } from './undermall-map.js';
import { registerFurniture } from './gfx/furniture.js';
import { GPT_WIDE_DEVICE_BUILDERS, GPT_WIDE_DEVICE_INFO } from './gfx/gpt-wide-devices.js';
import { GPT_LOBBY_DEVICE_BUILDERS, GPT_LOBBY_DEVICE_INFO } from './gfx/gpt-lobby-devices.js';
import { GPT_CAMP_DEVICE_BUILDERS, GPT_CAMP_DEVICE_INFO } from './gfx/gpt-camp-devices.js';
import { GPT_CABIN_DEVICE_BUILDERS, GPT_CABIN_DEVICE_INFO } from './gfx/gpt-cabin-devices.js';
import { GPT_LAB_DEVICE_BUILDERS, GPT_LAB_DEVICE_INFO } from './gfx/gpt-lab-devices.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const fits = (type, s) => ITEMS[type] && ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);

// ── 도구 (판마다 새로 찾는 물건 — 줍는 순간 "어디에 쓸지"가 보이게 생김새로)
const HP = Math.PI / 2;
export const CHAIN_ITEMS = {
  chainmarble: { name: K('대회 구슬', 'Contest marble'), h: .16, noCollect: true, build() {
    const g = grp(put(sph(.08, '#6fa8dc', null, 16, 12), 0, .08, 0));
    g.add(put(tor(.081, .012, '#fff4df', null, Math.PI * 2, 6, 18), 0, .08, 0, 0, .6, 0));
    return g;
  } },
  chainflash: { name: K('손전등', 'Flashlight'), h: .1, noCollect: true, build() {
    const g = grp(put(cyl(.035, .035, .2, '#ffb347', null, 12), 0, .04, 0, 0, 0, HP));
    g.add(put(cyl(.05, .036, .06, '#604d60', null, 12), .12, .04, 0, 0, 0, HP));
    g.add(put(cyl(.042, .042, .01, '#fff3a8', null, 12), .155, .04, 0, 0, 0, HP));
    return g;
  } },
  chainlever: { name: K('레버 손잡이', 'Lever handle'), h: .08, flat: true, noCollect: true, build() {
    const g = grp(put(cyl(.016, .016, .22, '#9aa3ad', null, 8), 0, .02, 0, HP, 0, 0));
    g.add(put(sph(.04, '#e8414e', null, 12, 8), 0, .03, .12));
    return g;
  } },
  chainwinder: { name: K('태엽 손잡이', 'Wind-up key'), h: .1, flat: true, noCollect: true, build() {
    const g = grp(put(cyl(.012, .012, .12, '#c79a4a', null, 8), 0, .02, 0, HP, 0, 0));
    for (const s of [-1, 1]) g.add(put(tor(.035, .012, '#e0b45c', null, Math.PI * 2, 6, 14), s * .04, .02, -.07, HP, 0, 0));
    return g;
  } },
  chainfan: { name: K('부채', 'Hand fan'), h: .05, flat: true, noCollect: true, build() {
    const g = grp(); for (let i = -2; i <= 2; i++) g.add(put(rbox(.05, .012, .2, i % 2 ? '#e77b64' : '#fff4df', .004), i * .03, .012, -.04, 0, i * .22, 0));
    g.add(put(cyl(.012, .012, .08, '#8a5a3a', null, 8), 0, .012, .07, HP, 0, 0));
    return g;
  } },
  chainacorn: { name: K('왕도토리', 'Big acorn'), h: .14, noCollect: true, build() {
    const g = grp(put(sph(.065, '#b8743f', null, 14, 10), 0, .065, 0));
    g.add(put(sph(.07, '#7a5232', null, 14, 8), 0, .1, 0, 0, 0, 0, [1, .55, 1]));
    g.add(put(cyl(.01, .012, .04, '#5a3a22', null, 6), 0, .14, 0));
    return g;
  } },
};

// ── 판별 연쇄 표. 부품 찾기: 'type#n:k' = 그 종류 n번째 가구의 k번째 부품, '@id' = 부품의 gptId(캠핑 작업장).
// steps: 장치 단계 — 첫 단의 도구는 판 자물쇠(behind 순서) 뒤에, 다음 단의 도구는 앞 단 보상 칸(payoff)에, 마지막 단 보상은
//   찾을 물건 하나(reward 'target') 또는 판 자물쇠 열쇠('key'). 한 단 = { dev, tool, links:[{dev, at}], payoff, dur,
//   sfx:[[at, 소리]…], need(도구 없이 만졌을 때), found(도구 주웠을 때), line(끝난 뒤 한 줄) }
// aux: 보조 장난감 [{ dev, sfx, line }] — 판 목표와 상관없음. at: { 판 번호: { steps?, aux? } } 같은 맵 다른 판의 차이.
// 시간판·보스판은 보조만(설계서 3: 시간 판 장치 2개까지, 보스는 보조 2~3), ★장치판은 정본 PLANS(devices.js)가 주 장치.
export const CHAINS = {
  // 36판 밤 빵집·서점 골목: 가로등 스위치 → 셔터에 숫자 그림자(= 금고 비밀번호) → 금고 속 레버 손잡이 → 셔터 레버: 톱니가 돌고
  // 셔터가 말려 올라가며 → 열쇠 트레이가 쑥 (설계서 36: 그림자 숫자 → 금고 다이얼 → 셔터 레버)
  gptshopnight: {
    spec: { lock: ['code'], lockOn: { code: ['gpt_nightsafe'] } }, open: ['gpt_nightsafe#0:0'],
    clue: { dev: 'gpt_nightshadow#0:0', lock: 'gpt_nightsafe', pill: '💡 ?:??', toast: K('셔터에 숫자 그림자가 비쳤어! 금고 비밀번호인가?', 'Numbers in shadow on the shutter! The safe code?') },
    steps: [{ dev: 'gpt_nightshadow#0:1', tool: 'chainlever', dur: 2.8, sfx: [[.2, 'ratchet'], [.7, 'lift_metal'], [.96, 'clink']],
      need: K('셔터 레버에 손잡이가 빠져 있어! 손잡이가 어디 있을까?', 'The shutter lever has no handle! Where could it be?'),
      found: K('레버 손잡이다! 셔터 옆 레버에 끼워 보자', 'A lever handle! Fit it on the lever by the shutter'),
      line: K('드르륵… 셔터 뒤에서 트레이가 쑥! …열쇠도 야근하네?', 'Rrrattle… a tray slides out behind the shutter! …even the keys work late?') }],
    aux: [{ dev: 'gpt_nightsign#0:0', sfx: [[.5, 'flip']], line: K('간판 뒷면에 낙서: "까꿍"', 'Scribbled on the back of the sign: "Peekaboo"') },
      { dev: 'gpt_nightvending#0:0', sfx: [[.6, 'clink']] }, { dev: 'gpt_nightbakery#0:0', sfx: [[.3, 'rustle']], line: K('차양이 착착 접힌다', 'The awning folds up') }, { dev: 'gpt_nightbench#0:0' }],
  },
  // 36판 새 안 밤의 문구점 (⑨ 10/23 stationery — 위 gptshopnight와 같은 짜임, 부품은 st_*): 가로등 스위치 → 반쯤 내린 셔터에 숫자 그림자
  // (= 계산대 밑 금고 비밀번호) → 금고 속 레버 손잡이 → 셔터 레버: 톱니가 돌고 셔터가 말려 올라가며 → 창고 안 열쇠 트레이가 쑥
  // 보조: 뽑기 손잡이(캡슐 퐁) · 오락기 버튼(화면 반짝·동전 짤랑) · 불량식품 회전 진열대(반 바퀴) · 영업 중 팻말(뒷면 낙서)
  stationery: {
    spec: { lock: ['code'], lockOn: { code: ['st_safe'] } }, open: ['st_safe#0:0'],
    clue: { dev: 'st_streetlamp#0:0', lock: 'st_safe', pill: '💡 ?:??', toast: K('셔터에 숫자 그림자가 비쳤어! 금고 비밀번호인가?', 'Numbers in shadow on the shutter! The safe code?') },
    steps: [{ dev: 'st_shutterlever#0:0', tool: 'chainlever', links: [{ dev: 'st_shutter#0:0', at: .4 }], payoff: 'st_shutter#0:0', dur: 1.0, sfx: [[.05, 'latch'], [.3, 'ratchet'], [.7, 'ratchet']],
      need: K('셔터 레버에 손잡이가 빠져 있어! 손잡이가 어디 있을까?', 'The shutter lever has no handle! Where could it be?'),
      found: K('레버 손잡이다! 셔터 옆 레버에 끼워 보자', 'A lever handle! Fit it on the lever by the shutter'),
      line: K('드르륵… 셔터 뒤에서 트레이가 쑥! …열쇠도 야근하네?', 'Rrrattle… a tray slides out behind the shutter! …even the keys work late?') }],
    aux: [{ dev: 'st_gacha#0:0', sfx: [[.05, 'ratchet'], [.6, 'pop']], line: K('캡슐 퐁! …뭐가 들었을까', 'Pop goes a capsule! …What is inside?') },
      { dev: 'st_arcade#0:0', sfx: [[.05, 'click'], [.3, 'tick'], [.7, 'coin']], line: K('1등! …동전도 하나 굴러 나왔어', 'First place! …and a coin rolled out') },
      { dev: 'st_snackrack#0:0', sfx: [[.05, 'gearUp'], [.85, 'click']] }, { dev: 'st_flipsign#0:0', sfx: [[.5, 'flip']], line: K('팻말 뒷면에 낙서: "까꿍"', 'Scribbled on the back of the sign: "Peekaboo"') }],
  },
  // 47판 흑백 연못 정자: 레버 자물쇠 뒤 도르래 손잡이 → 도토리 나무 도르래가 바구니를 내림 → 왕도토리 → 다람쥐 집 저울에 올리면
  // 저울이 기울며 집 문이 열리고 → 색 조각 (설계서 47: 도르래 → 도토리 → 저울 → 색 조각)
  gptpark2: {
    steps: [{ dev: 'gpt_p2acornhouse#0:0', tool: 'pulleyhandle', behind: ['lever', 'pad', 'code'], dur: 1.9, sfx: [[.05, 'ratchet'], [.5, 'ratchet'], [.86, 'land']],
      found: K('도르래 손잡이다! 도토리 나무 도르래 크랭크에 끼워 보자', 'The pulley handle! Fit it on the crank of the acorn tree pulley'),
      need: K('도르래 크랭크에 손잡이가 빠져 있어! 나무 위 바구니에 뭐가 달그락…', 'The pulley crank has no handle! Something rattles in the basket up the tree…'),
      line: K('바구니가 내려왔다! 왕도토리가 들어 있어', 'The basket is down! A big acorn inside') },
    { dev: 'gpt_p2acornhouse#0:1', tool: 'chainacorn', avoid: ['acorn'], dur: 2.2, sfx: [[.05, 'place'], [.25, 'thunk'], [.6, 'latch'], [.95, 'special']],
      need: K('다람쥐 집 저울이 한쪽으로 들려 있어. 뭔가 무거운 걸 올려야 하나?', "The squirrel house's scale is tipped up. Something heavy goes on it?"),
      found: K('왕도토리다! 다람쥐 집 저울에 올려 보자', 'A big acorn! Put it on the squirrel house scale'),
      line: K('…도토리 하나에 집이 열려?!', '…One acorn opens the house?!') }],
    aux: [{ dev: 'gpt_p2scope#0:0', sfx: [[.5, 'swish']], line: K('망원경 카드: "나무 위 바구니 → 다람쥐 집"', 'The telescope card: "basket up the tree → squirrel house"') },
      { dev: 'gpt_p2pond#0:0', sfx: [[.1, 'ratchet'], [.6, 'blub']] }, { dev: 'gpt_p2pavilion#0:0' }, { dev: 'gpt_p2wisteria#0:1', sfx: [[.5, 'flip']] }],
  },
  // 43판 단지 놀이터(원본 맵) + GPT 미니 구슬 길 ★구슬(5장 주인공): 미끄럼틀은 그대로, 그네 뒤 빈칸(3×1)에 작은 구슬 길(허브 10/22 밤:
  // "놀이터 얼굴은 두고 빈 구석에 작게"). 판 비밀번호 자물쇠 뒤 대회 구슬 → 구슬 길 어디든 터치 → 홈통을 지그재그로 데굴 → 종 땡 →
  // 종 아래 받침의 물건 (장화가 까꿍)
  playground: {
    // (아트 점검 ⑪ 10/23 '레일이 자전거 보관대 지붕·그네 틀을 뚫고 지나감' — 실제로 겹치진 않고 1.55 m 길이 둘 사이에 서서 그렇게 보임:
    // ② 78%로 줄여 보관대 지붕선 아래로. 미끄럼틀·그네 자리는 그대로)
    layout: { add: [{ type: 'gptwidemarblerun', i: 3, j: 1, opts: { scale: .78 } }] },
    steps: [{ dev: 'gptwidemarblerun#0:0', tool: 'chainmarble', behind: ['code', 'pad', 'color'], dur: 2.6, body: true,
      sfx: [[.05, 'clink'], [.26, 'land'], [.45, 'clink'], [.62, 'clink'], [.89, 'doorBell']],
      need: K('구슬 길 꼭대기가 비어 있어! 대회 구슬이 어디 있지?', 'The top of the marble run is empty! Where is the contest marble?'),
      found: K('대회 구슬이다! 놀이터 구슬 길 꼭대기에 올려 보자', 'The contest marble! Put it at the top of the playground marble run'),
      line: K('데구르르… 땡! 구슬보다 장화가 먼저 도착!', 'Roll… ding! The boot beat the marble!') }],
    aux: [{ dev: 'springrider#0:0' }, { dev: 'seesaw2#0:0' }],
  },

  // 46판 너굴이와 경주(시간 판, 원본 넓은 놀이터): GPT 분수 레버(물이 멎으면 바닥이 보임)·미니 구슬 길(홈통 → 종 → 장화 까꿍)을
  // 오른쪽 놀이터 빈칸에(스프링 놀이기구 자리·뒷벽 앞). 시간 판이라 장난감 둘만 — 안 건드려도 클리어
  playgroundwide: {
    layout: { room: 1, remove: ['springrider#0'], add: [{ type: 'gptwidefountain', i: 4, j: 3 }, { type: 'gptwidemarblerun', i: 0, j: 1 }] },
    aux: [{ dev: 'gptwidefountain#0:0', sfx: [[.05, 'whoosh'], [.14, 'blub'], [.5, 'blub']], line: K('분수도 잠깐 쉬는 중!', 'Even the fountain takes a break!') },
      { dev: 'gptwidemarblerun#0:0', sfx: [[.05, 'clink'], [.26, 'land'], [.62, 'clink'], [.89, 'doorBell']], line: K('구슬보다 장화가 먼저 도착!', 'The boot beat the marble!') }],
  },
  // 66판 빌딩 로비 시간 판(원본 로비+사무실): 로비 벽 엘리베이터를 GPT '층 버튼 엘리베이터'로 — 누를 때마다 다음 층(1층 화분 →
  // 2층 손 흔드는 너굴이 → 3층 물건). 시간 판이라 장난감 하나, 안 건드려도 클리어
  lobbymap: {
    layout: { room: 0, decor: { elevator: 'gpt_floor_elevator' } },
    aux: [{ dev: 'gpt_floor_elevator#0:1', sfx: [[.05, 'stationChime'], [.27, 'ratchet'], [.53, 'door_metal'], [.96, 'pop']], repeat: true, line: K('너굴아, 엘리베이터에서 뭐 해?', 'Raccoon, what are you doing in the elevator?') }],
  },
  // 57판 넓은 캠프장(원본) + GPT 모닥불 ★캠프파이어(6장 주인공): 오른쪽 바비큐·바위 자리에 작은 모닥불 선풍기, 뒤 텐트 옆에 신호 나무 바구니
  // (허브 10/22 밤: 캠프 소품 크기·갈색·초록, 가운데는 비움, 판다 X).
  // 간식 자물쇠(작은 텐트 주인) 뒤 성냥 → 선풍기가 불씨를 키움 → 젖은 덮개가 들리며 별 모양 연기 신호 → 나무 바구니가 내려옴
  campwide: {
    layout: { remove: ['bbqgrill#0', 'rock#1'], add: [{ type: 'gptfire_fan', i: 5, j: 3 }, { type: 'gptfire_treebasket', i: 6, j: 1 }] },
    steps: [{ dev: '@fire-fan', tool: 'matches', behind: ['treat', 'pad', 'color', 'code'], links: [{ dev: '@fire-smoke', at: .45 }, { dev: '@fire-basket', at: .85 }], payoff: '@fire-basket', dur: 2.6, body: true,
      sfx: [[.05, 'pop'], [.3, 'whoosh'], [.6, 'whoosh'], [.88, 'ratchet']],
      need: K('모닥불이 꺼져 있어. 선풍기로 부치려면 먼저 불씨가 있어야 해!', 'The campfire is out. You need a spark before the fan can help!'),
      found: K('성냥이다! 모닥불에 불씨를 붙여 보자', 'Matches! Light the campfire'),
      line: K('연기 신호다! 나무 위 바구니가 스르륵… 준비물이 왔어!', 'A smoke signal! The basket comes down from the tree… the supplies!') }],
  },
  // 54판 통나무 오두막(원본) + GPT 책장 손바퀴: 아래층 책장·서랍장 자리에. 자물쇠 뒤 태엽 손잡이 → 손바퀴(오두막 어디든 그 가구를
  // 누르면) → 책장이 빙글 돌고 → 뒤에서 넓은 비밀 서랍이 쑥 "열쇠보다 야식을 더 꼭꼭 숨겼네!"
  cabin: {
    layout: { room: 0, remove: ['bookshelf#0', 'drawers#0'], add: [{ type: 'gptcabin_secret', i: 0, j: 0 }] },
    steps: [{ dev: '@cabin-crank', tool: 'chainwinder', behind: ['pad', 'color', 'code'], links: [{ dev: '@cabin-bookcase', at: .3 }, { dev: '@cabin-hidden-drawer', at: .85 }], payoff: '@cabin-hidden-drawer', dur: 2.4, body: true,
      sfx: [[.05, 'gearUp'], [.3, 'creak'], [.85, 'drawer']],
      need: K('책장 손바퀴에 손잡이가 빠져 있어! 돌리면 책장이 움직일 것 같은데', 'The bookcase wheel has no handle! Turning it would move the shelf…'),
      found: K('태엽 손잡이다! 책장 옆 손바퀴에 끼워 보자', 'A winding key! Fit it on the wheel by the bookcase'),
      line: K('책장이 빙글! …열쇠보다 야식을 더 꼭꼭 숨겼네!', 'The bookcase spins! …the midnight snacks were hidden better than the key!') }],
  },
  // 67판 정전된 사무실(원본) + GPT 비상전원 두꺼비집: 복사기 자리에. 자물쇠 뒤 손전등 → 두꺼비집 레버(2.5초: 철컥 → 아래 덮개 열림)
  // → 케이블 칸의 물건 + 불이 켜짐 (벽 전등 스위치로도 불은 켜짐 — 두꺼비집은 그 칸까지)
  officefloor: {
    layout: { room: 0, remove: ['copier#0'], add: [{ type: 'gptfusebox', i: 1, j: 0 }] },
    steps: [{ dev: 'gptfusebox#0:0', tool: 'chainflash', behind: ['code', 'pad', 'color'], dur: 2.5, lights: true, body: true,
      sfx: [[.02, 'latch'], [.25, 'creak'], [.65, 'click'], [.95, 'unlock']],
      need: K('너무 깜깜해서 두꺼비집 레버가 안 보여… 손전등이 있으면!', 'Too dark to see the fuse-box lever… if only there were a flashlight!'),
      found: K('손전등이다! 두꺼비집을 비춰 보자', 'A flashlight! Shine it on the fuse box'),
      line: K('철컥! 비상등이 켜졌다!', 'Clunk! The emergency lights are on!') }],
  },
  // 43판 놀이터 대회 ★구슬(5장 주인공): 상품 상자(비밀번호) 속 구슬 → 시상대 구슬 길 → 종(개굴이 모자) → 도르래가 상품 바구니를 끌어올림
  gptplaycontest: {
    steps: [{ dev: 'gptcontestpodium#0:0', tool: 'chainmarble', behind: ['code', 'pad', 'color'], links: [{ dev: 'loftpulley#0:0', at: .84 }], dur: 3.1,
      sfx: [[.06, 'clink'], [.32, 'clink'], [.56, 'clink'], [.76, 'doorBell'], [.98, 'fanfare']],
      need: K('구슬 길 꼭대기 구슬 자리가 비어 있어! 대회 구슬이 어디 있지?', 'The marble slot at the top of the run is empty! Where is the contest marble?'),
      found: K('대회 구슬이다! 시상대 구슬 길 꼭대기에 올려 보자', 'The contest marble! Put it at the top of the podium run'),
      line: K('띵! …종이 개굴이 모자였어?! 도르래가 상품을 올린다!', 'Ding! …the bell was a frog hat?! The pulley hoists the prize!') }],
    aux: [{ dev: 'gptstarterbarrier#0:0', line: K('물총 발사! 출발봉이 번쩍', 'Squirt! Up goes the start bar') },
      { dev: 'gptofficialbench#0:2', line: K('점수판 뒤에 "시계를 봐!"', 'Behind the scoreboard: "Check the clock!"') },
      { dev: 'gptcontestswing#0:0' }],
  },  // 44판 모래 언덕 보물찾기: 색깔 자물쇠 보물 바구니 속 레버 손잡이 → 물레 레버: 물길이 열리고 물레방아·톱니가 돌며 줄을 감아
  // 씨앗 자루를 언덕 위로 끌어올림 → 자루 안 (설계서 44: 꽃병 색 → 보물 상자 → 레버 → 물레방아 → 씨앗 자루 "선물용이야!")
  gptplayhamster: {
    spec: { lockOn: { color: ['gpthamper'] } },
    steps: [{ dev: 'gptsandhill#0:0', tool: 'chainlever', behind: ['color', 'lever', 'pad', 'code'], dur: 3.0,
      sfx: [[.02, 'latch'], [.15, 'waterLap'], [.4, 'gearUp'], [.7, 'ratchet'], [.95, 'giggle']],
      need: K('물레 레버에 손잡이가 빠져 있어! 물길만 열면 물레가 돌 텐데…', 'The water-wheel lever has no handle! Open the channel and the wheel would turn…'),
      found: K('레버 손잡이다! 모래 언덕 물레 레버에 끼워 보자', 'A lever handle! Fit it on the water-wheel lever on the sand hill'),
      line: K('물레가 돌아 자루가 올라온다! …비상식량 아니고 선물용이야!', 'The wheel turns and up comes the sack! …It is a gift, not snacks!') }],
    aux: [{ dev: 'gptsandbox#0:0', sfx: [[.2, 'creak'], [.8, 'thump']], line: K('굴착기 버킷으로 모래 한 삽!', 'One scoop of sand!') },
      { dev: 'gptbalancelog#0:0', line: K('선물 무게는 똑같이!', 'Gifts weigh the same!') }, { dev: 'gpthamper#0:1', sfx: [[.3, 'rustle']] }, { dev: 'gptsunflowerbox#0:1', sfx: [[.4, 'flip']] }],
  },
  // 46판 너굴이와 경주(시간 판): 장치 둘만 — 분수 레버(물이 그치면 바닥 동전), 미니 구슬 길
  gptplaybig: { aux: [{ dev: 'gptwidefountain#0:0', sfx: [[.1, 'whoosh'], [.6, 'blub']], line: K('물이 멈췄다! 연못 바닥이 다 보여', 'The water stopped! You can see the whole bottom') },
    { dev: 'gptwidemarblerun#0:0', sfx: [[.1, 'clink'], [.45, 'clink'], [.8, 'doorBell']] }] },
  // 54판 판다네 통나무 오두막: 자물쇠 뒤 태엽 손잡이 → 책장 손바퀴를 감으면 책장이 빙글 돌고 → 뒤에서 넓은 비밀 서랍이 쑥
  // (설계서 54: 오르골 대신 허용된 회전 선반 대안) · 다락 문이 안에서 덜컹 — 59판 예고
  gptcabin2: {
    steps: [{ dev: '@cabin-crank', tool: 'chainwinder', behind: ['pad', 'color', 'code'], links: [{ dev: '@cabin-bookcase', at: .3 }, { dev: '@cabin-hidden-drawer', at: .85 }], payoff: '@cabin-hidden-drawer', dur: 2.4,
      sfx: [[.05, 'gearUp'], [.3, 'creak'], [.85, 'drawer']],
      need: K('책장 손바퀴에 손잡이가 빠져 있어! 돌리면 책장이 움직일 것 같은데', 'The bookcase wheel has no handle! Turning it would move the shelf…'),
      found: K('태엽 손잡이다! 책장 옆 손바퀴에 끼워 보자', 'A winding key! Fit it on the wheel by the bookcase'),
      line: K('책장이 빙글! …열쇠보다 야식을 더 꼭꼭 숨겼네!', 'The bookcase spins! …the midnight snacks were hidden better than the key!') }],
    aux: [{ dev: '@cabin-fireplace-lever', sfx: [[.2, 'latch'], [.7, 'pop']], line: K('퐁! 굴뚝으로 연기 한 줌', 'Poof! A puff of smoke up the chimney') },
      { dev: '@cabin-rockingchair', sfx: [[.3, 'creak']] }, { dev: '@cabin-musicbox', sfx: [[.1, 'tick'], [.5, 'star'], [.9, 'star']] },
      { dev: '@cabin-attic-tell', sfx: [[.2, 'thunk']], line: K('…다락에서 덜컹? 누가 있나?', '…A thump in the attic? Someone up there?') }],
    // 59판 ★별자리 다락은 정본 starloft가 주 장치(성냥 → 별 랜턴 → 다락 문) — 오두막 장치들은 보조로
    at: { 59: { aux: [{ dev: '@cabin-crank', sfx: [[.05, 'gearUp']], links: [{ dev: '@cabin-bookcase', at: .3 }] }, { dev: '@cabin-musicbox', sfx: [[.1, 'tick'], [.5, 'star'], [.9, 'star']] },
      { dev: '@cabin-fireplace-lever', sfx: [[.2, 'latch'], [.7, 'pop']] }, { dev: '@cabin-rockingchair', sfx: [[.3, 'creak']] }] } },
  },
  // 57판 별빛 캠프파이어 언덕 ★캠프파이어(6장 주인공): 자물쇠 뒤 성냥 → 모닥불 선풍기: 불씨가 커지고 → 젖은 덮개가 들리며 별 모양
  // 연기 신호 → 나무 위 바구니가 스르륵 내려옴(판다의 준비물) · 60판 보스는 보조 둘
  gptcampfire: {
    steps: [{ dev: '@fire-fan', tool: 'matches', behind: ['treat', 'pad', 'color', 'code'], links: [{ dev: '@fire-smoke', at: .45 }, { dev: '@fire-basket', at: .85 }], payoff: '@fire-basket', dur: 2.6,
      sfx: [[.05, 'pop'], [.3, 'whoosh'], [.6, 'whoosh'], [.88, 'ratchet']],
      need: K('모닥불이 꺼져 있어. 선풍기로 부치려면 먼저 불씨가 있어야 해!', 'The campfire is out. You need a spark before the fan can help!'),
      found: K('성냥이다! 모닥불에 불씨를 붙여 보자', 'Matches! Light the campfire'),
      line: K('연기 신호다! 나무 위 바구니가 스르륵… 준비물이 왔어!', 'A smoke signal! The basket comes down from the tree… the supplies!') }],
    aux: [{ dev: '@fire-telescope', sfx: [[.3, 'swish'], [.9, 'special']], line: K('별 지도: 오늘 밤엔 별똥별!', 'The star chart: shooting stars tonight!') }, { dev: '@fire-tent', sfx: [[.3, 'rustle']] }],
    at: { 60: { aux: [{ dev: '@fire-fan', sfx: [[.05, 'pop'], [.5, 'whoosh']] }, { dev: '@fire-hammock', sfx: [[.3, 'swish']] }] } },
  },
  // 65판 과학 옥상 밤: 자물쇠 뒤 크랭크 손잡이 → 관측 크랭크: 돔이 열리고 망원경이 쑥 올라 건너편 빌딩 시계를 겨눔(그 시각 3:15 =
  // 운석 상자 비밀번호, 쪽지 대신) → 별지도 서랍 → 운석 상자 다이얼 → 보물 (설계서 65: 망원경 → 건너편 시계 → 옥상 상자 다이얼)
  gptroof: {
    spec: { lock: ['pad', 'code'], lockOn: { code: ['gptmeteorbox'] } },
    clue: { dev: 'gpt_roof_telescope#0:0', lock: 'gptmeteorbox', code: '315', pill: '🔭 ?:??', toast: K('망원경 끝에 건너편 빌딩 시계가 딱! 몇 시 몇 분이지?', 'The telescope lands on the clock across the street! What time does it say?') },
    steps: [{ dev: 'gpt_roof_telescope#0:0', tool: 'chainwinder', behind: ['pad'], dur: 2.7, sfx: [[.05, 'ratchet'], [.2, 'slide'], [.52, 'swish'], [.95, 'special']],
      need: K('관측 돔 크랭크에 손잡이가 빠져 있어! 돔을 열면 망원경이 나올 텐데', 'The observatory crank has no handle! Open the dome and the telescope comes up'),
      found: K('크랭크 손잡이다! 관측 돔 크랭크에 끼워 보자', 'A crank handle! Fit it on the observatory dome'),
      line: K('건너편 시계가 이렇게 컸어?', 'Was that clock always this big?') }],
    aux: [{ dev: 'gpt_roof_service#0:0', sfx: [[.1, 'latch'], [.5, 'blub'], [.9, 'pop']] }, { dev: 'gpt_roof_service#0:1', sfx: [[.2, 'swish'], [.8, 'thump']] },
      { dev: 'gptgreenhouse#0:2', sfx: [[.1, 'ratchet'], [.6, 'blub']], line: K('물이 차오르고 새싹 트레이가 쑥!', 'The water rises and up comes the sprout tray!') }, { dev: 'gptantenna#0:0', sfx: [[.1, 'ratchet'], [.8, 'special']] },
      { dev: 'gpt_roof_lift#0:1', sfx: [[.05, 'stationChime'], [.4, 'ratchet'], [.7, 'door_metal'], [.95, 'pop']] }],
  },
  // 67판 정전된 박사 연구실: 자물쇠 뒤 손전등 → 두꺼비집 레버를 내리면 비상등이 차례로 켜지고 → 연구 노트 금고가 열림 → 불도 켜짐
  gptlab: {
    steps: [{ dev: 'gptfusebox#0:0', tool: 'chainflash', behind: ['code', 'pad'], links: [{ dev: 'gptemergencycab#0:1', at: .5 }, { dev: 'gptemergencycab#0:0', at: .9 }], payoff: 'gptemergencycab#0:0', dur: 2.5, lights: true,
      sfx: [[.05, 'latch'], [.35, 'creak'], [.6, 'click'], [.95, 'unlock']],
      need: K('너무 깜깜해서 두꺼비집 레버가 안 보여… 손전등이 있으면!', 'Too dark to see the fuse-box lever… if only there were a flashlight!'),
      found: K('손전등이다! 두꺼비집을 비춰 보자', 'A flashlight! Shine it on the fuse box'),
      line: K('철컥! 비상등이 차례로 켜지고… 연구 노트 금고가 열렸다!', 'Clunk! The emergency lights come on one by one… the notebook safe opens!') }],
    aux: [{ dev: 'gptchalkboard#0:0', sfx: [[.5, 'flip']] }, { dev: 'gptmarblebench#0:0', sfx: [[.05, 'clink'], [.35, 'clink'], [.65, 'clink'], [.95, 'pop']], line: K('구슬이 실험대를 한 바퀴! 띵', 'The marble rolls round the bench! Ding') }],
  },
  // 69판 마지막 흑백 아트리움(먹물이와 같이): 자물쇠 뒤 구슬 → 로비 구슬 키네틱 아트를 같이 굴리면 → 색 조각 ("마지막 퍼즐은 같이 풀자")
  // · 66판 시간 판은 보조 둘(엘리베이터·지름길 레버) · 70판 보스는 장마다 주인공 장치가 한 번씩 인사
  gptatrium: {
    steps: [{ dev: 'gpt_kinetic_art#0:0', tool: 'chainmarble', behind: ['pad', 'code', 'color'], dur: 3.0,
      sfx: [[.05, 'click'], [.25, 'clink'], [.5, 'ratchet'], [.75, 'stationChime'], [.95, 'pop']],
      need: K('키네틱 아트 꼭대기 구슬 자리가 비어 있어. 마지막 구슬은 어디 있지?', 'The top of the kinetic sculpture has an empty marble cup. Where is the last marble?'),
      found: K('마지막 구슬이다! 로비 키네틱 아트에 올려 보자', 'The last marble! Put it on the lobby sculpture'),
      line: K('"마지막 퍼즐은 같이 풀자" …데구루루, 띵!', '"Let us solve the last puzzle together" …roll, roll, ding!') }],
    aux: [{ dev: 'gpt_floor_elevator#0:1', sfx: [[.05, 'stationChime'], [.4, 'ratchet'], [.7, 'door_metal'], [.95, 'pop']] }, { dev: 'gpt_flip_directory#0:0', sfx: [[.5, 'flip']] }, { dev: 'gpt_revolving_door#0:0', sfx: [[.3, 'door']] }],
    at: { 66: { aux: [{ dev: 'gpt_floor_elevator#0:1', sfx: [[.05, 'stationChime'], [.4, 'ratchet'], [.7, 'door_metal'], [.95, 'pop']] }, { dev: 'gpt_atrium_auxlever#0:0', sfx: [[.2, 'latch'], [.8, 'stationChime']] }] },
      70: { aux: [{ dev: 'gpt_chapter_gallery#0:0', sfx: [[.05, 'crossingNear'], [.4, 'trainPass'], [.9, 'stationChime']] }, { dev: 'gpt_chapter_gallery#0:1', sfx: [[.1, 'click'], [.4, 'ratchet'], [.8, 'giggle']] },
        { dev: 'gpt_chapter_gallery#0:2', sfx: [[.1, 'swish'], [.3, 'pop'], [.55, 'whoosh'], [.9, 'giggle']] }, { dev: 'gpt_kinetic_art#0:0', sfx: [[.25, 'clink'], [.75, 'stationChime']] },
        { dev: 'gpt_floor_elevator#0:1', sfx: [[.05, 'stationChime'], [.7, 'door_metal']] }] } },
  },
};
CHAINS.gptplaybig_open = CHAINS.gptplaybig; CHAINS.gptatrium_open = CHAINS.gptatrium; CHAINS.gptcampfire_open = CHAINS.gptcampfire;
Object.assign(CHAINS, CHAINS_A, CHAINS_B);
// (40판 지하상가 undermall: 맵이 그 키일 때만 — 정본 판 shopmap엔 안 붙음)
CHAINS.undermall = UM_CHAIN; ON_A.push('undermall');
// 정본에 켠 판 → 표의 줄 (10/22 저녁 사용자 비교 시트: GPT 맵은 44판만, 43·46·66판은 원본 맵에 GPT 장치를 옮겨 붙임 —
// _handoff/gpt-compare-picks-1022.md). 판 번호(1부터)에 붙어서, 같은 맵을 쓰는 다른 판(45판 놀이터 밤 …)은 그대로.
// (?chains=all: 맵 키로 표의 모든 줄 — ②b 측정용)
export const CHAINS_ON = { 36: 'stationery', 43: 'playground', 44: 'gptplayhamster', 46: 'playgroundwide', 54: 'cabin', 57: 'campwide', 66: 'lobbymap', 67: 'officefloor' };   // (43·57 off until redone — hub art check 10/22: 43 lost its slide to a big cream marble run, 57 a mint-yellow canopy + panda mid-camp)
Object.assign(CHAINS_ON, CHAINS_ON_B);
const ALL = typeof location !== 'undefined' && /[?&]chains=all(&|$)/.test(location.search);
const recipeFor = spec => {
  const k = CHAINS_ON[spec.idx + 1], R = (k && (CHAINS[k].map || k) === spec.room ? CHAINS[k] : null) || (ALL || ON_A.includes(spec.room) ? CHAINS[spec.room] : null); if (!R) return null;
  const o = R.at?.[spec.idx + 1] ? { ...R, ...R.at[spec.idx + 1] } : R;
  return spec.showcase || spec.timed || spec.boss || spec.kit ? { ...o, steps: [] } : o;   // (조립판: 부품 찾기가 목표 — 장치는 보조만, ② 10/22 19판)
};
// 원본 맵에 장치 가구 옮겨 붙이기 — 그 판에서만 (stage.js, 방을 짓기 전): layout.room번째 방에서 remove('type#n')를 빼고 add를 넣음
export function chainLayout(spec, L) {
  const k = CHAINS_ON[spec.idx + 1], R = k && CHAINS[k]; if (!R?.layout || (R.map || k) !== spec.room) return L;
  const { room = 0, remove = [], add = [], decor = {} } = R.layout;   // (decor: 벽 장식 바꾸기 { 옛 키: 새 키 })
  const edit = lay => { const seen = {}; return { ...lay, furniture: [...(lay.furniture || []).filter(f => { const n = seen[f.type] = (seen[f.type] ?? -1) + 1; return !remove.includes(f.type + '#' + n) && !remove.includes(f.type); }), ...add.map(f => ({ rot: 0, ...f }))], decor: (lay.decor || []).map(d => decor[d.type] ? { ...d, type: decor[d.type] } : d) }; };
  return L.rooms ? { ...L, rooms: L.rooms.map((r, i) => i === room ? { ...r, layout: edit(r.layout) } : r) } : edit(L);
}

// 부품 찾기
function findPart(room, ref) {
  if (!ref) return null;
  if (ref[0] === '@') return room.parts.find(p => p.gptId === ref.slice(1) || p.id === ref.slice(1)) || null;
  const [ft, k = '0'] = ref.split(':'), [type, n = '0'] = ft.split('#');
  const furns = [...new Set(room.parts.filter(p => p.furn.type === type).map(p => p.furn))];
  const f = furns[+n]; return f ? f.parts[+k] || null : null;
}

// 짜기 전: 장치 부품과 보상 자리를 플래너에게서 비워 둔다 (장치 속에 아무 물건이나 들어가 버리면 연쇄 보상이 묻힘)
export function chainPrep(room, spec) {
  const R = recipeFor(spec); if (!R) return null;
  if (R.spec) Object.assign(spec, R.spec);   // (그 판 자물쇠 종류·자리 — 36판 금고에 비밀번호)
  for (const ref of R.open || []) findPart(room, ref)?.spots.forEach(s => { s.reserved = false; });   // (작업장이 비워 둔 칸: 자물쇠 뒤 도구 자리)
  let steps = (R.steps || []).map(st => {
    const P = findPart(room, st.dev); if (!P) return null;
    const links = (st.links || []).map(l => ({ ...l, part: findPart(room, l.dev) })).filter(l => l.part);
    return { st, P, links, pay: (st.payoff && findPart(room, st.payoff)) || links[links.length - 1]?.part || P };
  });
  if (steps.some(x => !x)) steps = [];   // (a step missing on this map: no chain, the stage plays as it is)
  const held = steps.flatMap(x => [x.P, ...x.links.map(l => l.part), x.pay]).flatMap(p => p.spots).filter(s => !s.reserved);
  held.forEach(s => { s.reserved = true; });
  return { R, steps, held };
}

// 짠 뒤: 도구를 자물쇠 뒤에, 장치 자물쇠(gadget)를 걸고, 다음 단 도구·마지막 보상을 장치 끝 칸에
export function chainPlan(S, plan, cp) {
  if (!cp) return plan;
  const { R, steps, held } = cp, room = S.room, spec = S.spec;
  held.forEach(s => { s.reserved = false; });
  const used = new Set(plan.placements.map(p => p.spot)), r = rng(spec.seed + 977), dbg = [];
  const take = (part, type) => { const s = part.spots.find(s => !used.has(s) && fits(type, s)); if (s) used.add(s); return s; };
  const Ps = new Set(steps.map(x => x.P)), mine = new Set(steps.flatMap(x => [x.P, ...x.links.map(l => l.part), x.pay]));
  if (steps.length) {
    // 마지막 단 보상: 찾을 물건 하나(겉에 있던 것, 작은 것부터) / 판 자물쇠 열쇠
    const last = steps[steps.length - 1];
    let reward = last.st.reward === 'key' ? plan.placements.find(p => p.role === 'key') : null;
    if (reward) { const s = take(last.pay, reward.type); if (s) reward.spot = s; else reward = null; }
    const locked = new Set(plan.locks.map(l => l.part)), byH = (a, b) => ITEMS[a.type].h - ITEMS[b.type].h;
    const pool = plan.placements.filter(p => p.role === 'target' && p.type !== 'friendtoken' && !locked.has(p.spot.part) && !mine.has(p.spot.part) && !(last.st.avoid || []).includes(p.type));
    if (!reward) for (const p of [...pool.filter(p => !p.spot.part).sort(byH), ...pool.filter(p => p.spot.part).sort(byH)]) {
      const s = take(last.pay, p.type); if (s) { p.spot = s; reward = p; break; }
    }
    dbg.push('reward ' + (reward ? reward.type + '@' + reward.spot.label : '-'));
    // 둘째 단부터: 도구는 앞 단 보상 칸에
    for (let i = 1; i < steps.length; i++) {
      const x = steps[i], s = take(steps[i - 1].pay, x.st.tool);
      if (s) plan.placements.push({ type: x.st.tool, spot: s, role: 'gadget', code: x.st.tool, forPart: x.P });
      dbg.push('tool' + i + ' ' + (s ? s.label : '-'));
    }
    // 첫 단 도구: 판 자물쇠 뒤 물건 자리 → 없으면 아무 칸 안 → 없으면 아무 데나
    const x0 = steps[0], tool = x0.st.tool;
    let tp = null;
    for (const k of x0.st.behind || ['pad', 'code', 'color']) {
      const L = plan.locks.find(l => l.kind === k && !Ps.has(l.part)); if (!L) continue;
      tp = plan.placements.find(p => p.role === 'target' && p.spot.part === L.part && p.type !== 'friendtoken' && fits(tool, p.spot));
      if (tp) { plan.targets.splice(plan.targets.indexOf(tp.type), 1); Object.assign(tp, { type: tool, role: 'gadget', code: tool, forPart: x0.P }); break; }
      const s = take(L.part, tool);
      if (s) { tp = { type: tool, spot: s, role: 'gadget', code: tool, forPart: x0.P }; plan.placements.push(tp); break; }
    }
    if (!tp) {
      const free = room.spots.filter(s => !s.reserved && !used.has(s) && fits(tool, s) && !mine.has(s.part) && !(s.part && (plan.locks.some(l => l.part === s.part) || s.part.isGadget)));
      const s = r.pick(free.filter(s => s.part)) || r.pick(free);
      if (s) { tp = { type: tool, spot: s, role: 'gadget', code: tool, forPart: x0.P }; plan.placements.push(tp); }
    }
    dbg.push('tool0 ' + (tp ? tp.spot.label : '-'));
    // 장치 부품: 끝까지(reach 1), 고르게(linear), 단계 소리, 이어지는 부품은 혼자 열리지 않게
    for (const x of steps) {
      plan.locks.push({ part: x.P, kind: 'gadget', code: x.st.tool });
      arm(S, x.P, x.st); Object.assign(x.P, { device: 'chain', chain: { M: x.st, links: x.links, pay: x.pay }, needItem: x.st.tool, needMsg: x.st.need });
      for (const l of x.links) { arm(S, l.part, l); l.part.isGadget = true; l.part.chainVia = x.P; }
      if (x.st.body) { x.P.furn.group.traverse(o => { if (o.isMesh && !o.userData.part) o.userData.part = x.P; }); x.P.handle = x.P.furn.group; }   // (the whole piece is its handle: 43판 시상대 — the slot on top was a few px)
      x.P.isGadget = true;   // (ran once: it stays as it ends — a second touch only wobbles)
    }
    plan.chainTool = steps.map(x => x.st.tool).join('>');
    plan.chainFound = Object.fromEntries(steps.filter(x => x.st.found).map(x => [x.st.tool, x.st.found]));
  }
  // 단서 보여 주기: 스위치를 켜면 판 비밀번호가 그 자리에 비친다(36판 가로등 → 셔터 그림자) — 쪽지 대신
  if (R.clue) {
    const C = findPart(room, R.clue.dev), L = plan.locks.find(l => l.kind === 'code' && l.part.furn.type === R.clue.lock) || (R.clue.any ? plan.locks.find(l => l.kind === 'code') : null);   // (any: the shown number opens whichever piece the code lock went on)
    if (C && L && (!R.clue.shadow || C.furn.gptShadow)) {   // (shadow: the map must be able to show the number — else the note stays)
      plan.placements = plan.placements.filter(p => !(p.role === 'note' && p.forPart === L.part));
      if (R.clue.code) L.code = R.clue.code;   // (a code painted on the map: 65판 건너편 시계 3:15)
      else { const n = +L.code || 0; L.code = `${1 + n % 9}${String(5 * (Math.floor(n / 9) % 12)).padStart(2, '0')}`; }   // (a time, read at a glance: 9:35, never 1:70)
      C.furn.gptShadow?.setCode(L.code); C.reach = 1; C.chainClue = L; L.part.clueVia = C;
      const ao = C.afterOpen;
      C.afterOpen = s => { ao?.(s); if (s.codes.has(L.code)) return; s.codes.add(L.code); const P = s.codePill; P.style.display = ''; P.classList.remove('need'); P.set(R.clue.pill || '💡 ?:??'); s.G.ui.toast(R.clue.toast, 'green'); s.pointAt?.(L.part); };
      dbg.push('clue ' + L.code);
    }
  }
  for (const a of R.aux || []) { const q = findPart(room, a.dev); if (q && !q.device && !q.isGadget && !plan.locks.some(l => l.part === q)) { aux(S, q, a); dbg.push('aux ' + (q.label || q.kind)); } }
  plan.chainDbg = dbg;
  return plan;
}

// 부품을 장치로: 끝까지 열리고(reach 1), 정해진 길이 동안 고르게 단계 소리(② 러너 part.steps — 터치 한 번 더면 끝으로, 끝난
// 장치는 다시 안 닫힘), 중간(at)에 다음 부품이 저절로
function arm(S, p, o) {
  p.reach = 1; if (o.dur) p.dur = o.dur;
  if (o.sfx) p.steps = o.sfx; else p.steps ||= [[0, p.sfx || 'open']];
  if (p._chainArmed) return; p._chainArmed = true;
  const ap = p.apply;
  p.apply = (t, ...b) => {
    const t0 = p._lastT ?? 0; p._lastT = t; ap(t, ...b);
    if (!p._run || t <= t0) return;
    for (const l of p._run.links) if (!l.go && t >= l.at) { l.go = true; p._run.wait.push(S.togglePart(l.part, true)); }
  };
}
// 보조 장치: 장난감 — 끝까지 움직이고, 단계 소리, 처음 한 번 웃긴 한 줄
function aux(S, p, a) {
  p.reach = 1;
  const links = (a.links || []).map(l => ({ part: findPart(S.room, l.dev), at: l.at ?? .8 })).filter(l => l.part);
  for (const l of links) { arm(S, l.part, {}); l.part.isGadget = true; l.part.chainVia = p; }
  if (a.sfx || links.length) { arm(S, p, a); p._run = { links, wait: [] }; }   // (opening only: t going up)
  if (a.line) { const ao = p.afterOpen; p.afterOpen = s => { ao?.(s); if (!p._said) { p._said = true; s.say(s.friend, a.line, 1500); } }; }
}

// 장치 한 판: 카메라가 장치와 이어지는 것들을 다 보이게 돌고 → 부품이 돌며 단계 소리 → 중간에 다음 장치가 저절로 → 끝 한 줄
export async function runChain(S, part, clearYaw) {
  const G = S.G, W = G.world, tw = S.tw, C = part.chain, M = C.M;
  S.cine = true;
  const objs = [part.pivots[0], ...C.links.map(l => l.part.pivots[0])], box = new THREE.Box3();
  for (const o of objs) box.expandByObject(o);
  const at = box.getCenter(new THREE.Vector3()), span = box.getSize(new THREE.Vector3()).length();
  const zoom = Math.max(W.zoom, Math.min(1.8, 3.2 / Math.max(1.4, span)));
  await W.flyTo(tw, { yaw: clearYaw(S, objs, at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  G.audio.sfx('pop', 2);
  const c = W.toScreen(S.partCenter(part)); W.fx.burst(c.x, c.y, { n: 10, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 120, life: .5, size: 9 });
  await tw.wait(.25);
  part._run = { links: C.links.map(l => ({ part: l.part, at: l.at ?? .8 })), wait: [] };
  await S.togglePart(part, true);
  await Promise.all(part._run.wait);
  part._run = null;
  if (S.dead) return;
  const p = W.toScreen(S.partCenter(C.pay));
  W.fx.burst(p.x, p.y, { n: 16, shape: 'star', colors: ['#ffe14d', '#ffffff', '#ff8fb8'], speed: 200 }); W.fx.ring(p.x, p.y, { r: 70, color: '#ffe14d', width: 6 });
  if (M.line) S.say(S.friend, M.line, 2000);
  if (M.lights && S.dark) await S.lightsOn();   // (67판: 두꺼비집이 정전도 푼다)
  S.cine = false; S.idle = 0;
}

Object.assign(ITEMS, CHAIN_ITEMS);
registerFurniture(GPT_WIDE_DEVICE_BUILDERS, GPT_WIDE_DEVICE_INFO);   // (46판에 옮겨 붙이는 GPT 분수·구슬 길)
registerFurniture(GPT_LOBBY_DEVICE_BUILDERS, GPT_LOBBY_DEVICE_INFO);   // (66판 로비 벽의 GPT 층 버튼 엘리베이터)
registerFurniture(GPT_CAMP_DEVICE_BUILDERS, GPT_CAMP_DEVICE_INFO);   // (57판 캠프장의 GPT 모닥불 선풍기·나무 바구니)
registerFurniture(GPT_CABIN_DEVICE_BUILDERS, GPT_CABIN_DEVICE_INFO);   // (54판 오두막의 GPT 책장 손바퀴)
registerFurniture(GPT_LAB_DEVICE_BUILDERS, GPT_LAB_DEVICE_INFO);   // (67판 사무실의 GPT 두꺼비집)
