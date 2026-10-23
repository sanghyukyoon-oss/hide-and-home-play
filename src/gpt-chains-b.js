// 공원·캠프 새 맵 연쇄 장치 (②b 10/23 — ⑩이 짓는 45·49·55·56·58판 새 맵, 설계서 _handoff/device-fun-design-1022.md 3절).
// ②b의 표 엔진(gpt-chains.js) 그대로, 줄만 여기에. 판 번호로 켬(CHAINS_ON_B) — 판 표가 그 판에 새 맵 키를 쓸 때만 움직임.
// 시간 판(56)·보스(49)는 보조만(엔진 recipeFor가 주 연쇄를 버림).
import { EN } from './i18n-en-dict.js';

const K = (ko, en) => { EN[ko] = en; return ko; };

export const CHAINS_B = {
  // 45판 별 지붕 밤 놀이터(숨은그림·밤): 가로등을 끄면 개구리 그림자 배에 숫자(= 분실물 상자 비밀번호, 쪽지 없음) → 상자 속 태엽 손잡이
  // → 놀이탑 별 등불이 빙글 → 별 등불 상자 속 물건 (설계서 45: 가로등 그림자 숫자 → 창고 다이얼). 그림자 숫자·별 등불 상자는 ⑩ 모델 쪽
  // (gptShadow.setCode · 별 부품의 inside 칸) — 없으면 비밀번호는 쪽지 그대로, 별 등불은 장난감으로만 돌아요.
  starplay: {
    spec: { lock: ['code'], lockOn: { code: ['lostbox'] } },
    clue: { dev: 'sp_lamp#0:0', lock: 'lostbox', any: true, shadow: true, pill: '💡 ?:??', toast: K('가로등을 끄니 개구리 그림자 배에 숫자가!', 'With the lamp off, there are numbers on the frog shadow’s tummy!') },
    steps: [{ dev: 'sp_startower#0:0', tool: 'chainwinder', behind: ['code', 'pad'], dur: 2.0, body: true,
      sfx: [[.05, 'ratchet'], [.4, 'special'], [.9, 'pop']],
      need: K('별 등불 태엽 구멍이 비어 있어! 감으면 별이 돌 것 같은데', 'The star lamp’s winding hole is empty! Wind it and the star would spin'),
      found: K('태엽 손잡이다! 놀이탑 별 등불에 끼워 보자', 'A winding key! Fit it on the star lamp on the tower'),
      line: K('별 등불이 빙글~ 별 상자가 열렸어!', 'The star lamp spins~ and the star box opens!') }],
    aux: [{ dev: 'sp_swings#0:0', sfx: [[.1, 'creak'], [.6, 'creak']] }, { dev: 'sp_spinner#0:0', sfx: [[.05, 'gearUp'], [.6, 'swish']], line: K('뺑뺑이 빙글빙글~ 어지러워', 'Round and round~ dizzy!') },
      { dev: 'sp_lamp#1:0', sfx: [[.1, 'click']] }],
  },
  // 49판 소풍 잔디 언덕 보스(자물쇠 넷 그대로): 보조 — 분수 레버(물줄기가 퐁)
  picnichill: {
    aux: [{ dev: 'ph_fountain#0:0', sfx: [[.05, 'latch'], [.3, 'whoosh'], [.8, 'blub']], line: K('분수가 퐁! 소풍 바구니까지 튀었어', 'The fountain spurts — all the way to the picnic basket!') }],
  },
  // 55판 반딧불 계곡(숨은그림·밤): 레버 자물쇠 뒤 수문 손잡이 → 개울 징검다리가 하나씩 쑥쑥 올라오고 → 건너편 반딧불 병 뚜껑이 퐁,
  // 반딧불이 확 퍼지며 병 속 물건 (설계서 55: 계곡 레버 → 징검다리가 올라옴 → 졸졸이 물건)
  fireflyvalley: {
    steps: [{ dev: 'vl_stepstones#0:0', tool: 'chainlever', behind: ['lever', 'pad', 'code'], links: [{ dev: 'vl_jarstump#0:0', at: .85 }], payoff: 'vl_jarstump#0:0', dur: 2.2, body: true,
      sfx: [[.05, 'latch'], [.2, 'blub'], [.4, 'thunk'], [.6, 'thunk'], [.85, 'pop']],
      need: K('개울 수문 말뚝에 손잡이 꽂는 자리가 비어 있어! 물을 막으면 징검다리가 올라올 텐데', 'The creek gate post has no handle! Stop the water and the stepping stones would rise'),
      found: K('수문 손잡이다! 개울가 징검다리 말뚝에 꽂아 보자', 'The gate handle! Put it in the post by the stepping stones'),
      line: K('징검다리가 쑥쑥! …건너편 반딧불 병이 퐁 열렸어', 'Up come the stepping stones! …and the firefly jar across pops open') }],
    aux: [{ dev: 'vl_scope#0:0', sfx: [[.1, 'swish'], [.8, 'special']], line: K('망원경 끝에 별자리… 반딧불 병 쪽이야!', 'A constellation in the telescope… pointing at the firefly jar!') },
      { dev: 'vl_sleepmat#0:0', line: K('베개 밑은 졸졸이 비밀 서랍', 'Under the pillow: Jolly’s secret drawer') }],
  },
  // 56판 개울가 징검다리 캠핑(시간 판): 장난감 둘 — 손 펌프(물이 콸콸), 해먹
  creekcamp: {
    aux: [{ dev: 'ck_pump#0:0', sfx: [[.05, 'creak'], [.45, 'blub'], [.8, 'blub']], line: K('펌프질 퐁퐁! 양동이에 물이 찼어', 'Pump, pump! The bucket fills up') }, { dev: 'ck_hammock#0:0', sfx: [[.1, 'creak']] }],
  },
  // 58판 흔들다리 숲(흑백): 오르골 비밀번호 자물쇠 뒤 도르래 손잡이 → 고목 위 쉼터의 바구니가 스르륵 내려와 → 바구니 속 물건(색 조각)
  // (설계서 58: 레버 → 작은 승강기 바구니 → 색 조각; 오르골은 그 판 자물쇠로)
  bridgewood: {
    steps: [{ dev: 'bw_bigtree#0:0', tool: 'pulleyhandle', behind: ['code', 'lever', 'pad'], dur: 1.8, body: true,
      sfx: [[.05, 'ratchet'], [.5, 'ratchet'], [.92, 'land']],
      need: K('고목 위 바구니 도르래에 손잡이가 빠져 있어!', 'The basket pulley up the old tree has no handle!'),
      found: K('도르래 손잡이다! 고목의 바구니 도르래에 끼워 보자', 'The pulley handle! Fit it on the basket pulley of the old tree'),
      line: K('바구니가 스르륵 내려왔다!', 'Down comes the basket!') }],
    aux: [{ dev: 'bw_signpost#0:0', sfx: [[.5, 'flip']], line: K('화살표 판 뒤: "바구니는 고목 위"', 'Behind the arrow sign: "The basket is up the old tree"') },
      { dev: 'bw_bridge#0:0', sfx: [[.1, 'creak'], [.5, 'creak']], line: K('흔들흔들~ 다리가 출렁', 'Sway, sway~ the bridge wobbles') }],
  },
};
// 판 번호 → 줄 (판 표가 그 판에 새 맵 키를 쓰면 켜짐)
export const CHAINS_ON_B = { 45: 'starplay', 49: 'picnichill', 55: 'fireflyvalley', 56: 'creekcamp', 58: 'bridgewood' };
