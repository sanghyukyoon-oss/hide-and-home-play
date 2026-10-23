// 18~28판 GPT 맵 연쇄 장치 (② 레벨, 10/22 — _handoff/device-fun-design-1022.md · gpt-map-devices-1022.md): ②b의 표 엔진(gpt-chains.js)
// 그대로, 줄만 여기에. 27판 역 방탈출(건널목 → 모자 → 도르래 → 로커)은 staging.js stagingCrossing·hatKeyHide가 맡음.
import { EN } from './i18n-en-dict.js';

const K = (ko, en) => { EN[ko] = en; return ko; };

export const CHAINS_A = {
  // 19판 몽글동 119 안전센터 (조립판 미니 소방차 — 부품 찾기가 판 목표라 장치는 보조만): 출동 벨을 당기면 → 차고 셔터가 말려 오르고
  // → 2층 당직실 곰돌이가 소방봉을 타고 쭉 → 소방견 집 지붕이 들썩 (설계서 GPT 19판 연쇄 — 벨 → 셔터 → 소방봉 · 2층)
  gptfirestation: {
    aux: [{ dev: 'gpt_firebell#0:0', dur: 1.6, sfx: [[.02, 'doorBell'], [.3, 'ratchet'], [.62, 'swish'], [.86, 'land']],
      links: [{ dev: 'gpt_firehouse#0:0', at: .2 }, { dev: 'gpt_firepole#0:0', at: .5 }, { dev: 'gpt_firedoghouse#0:0', at: .8 }],
      line: K('따르릉! 출동이다! …소방견은 아직 자는 중', 'Ring-ring! Call-out! …the fire dog is still asleep') },
      { dev: 'gpt_hosetower#0:0', sfx: [[.05, 'ratchet'], [.8, 'clink']] },
      { dev: 'gpt_firetraining#0:0', dur: 1.2, sfx: [[.05, 'ratchet'], [.4, 'blub'], [.9, 'thunk']], line: K('물줄기 명중! 과녁이 넘어갔어', 'Bull’s-eye! The target tips over') },
      { dev: 'gpt_fireflipsign#0:0', sfx: [[.5, 'flip']] }],
  },
  // 26판 멍뭉이네 마당 2층집 (두 변형 같은 장치): 금고 시계(관찰 자물쇠) → 호루라기 → 개집 앞 호루라기 코스: 단추 → 공이 데굴 →
  // 화분이 톡 → 명예 순경 모자 받침이 펼쳐짐 (설계서 26). 판 목록의 호루라기는 도구로 쓰여서 목록에서 빠짐.
  gptdoghouse: {
    spec: { items: ['ball', 'bellball', 'teddy', 'block', 'cookie', 'gift', 'cupcake'] },
    steps: [{ dev: 'gptwhistlecourse#0:0', tool: 'whistle', behind: ['code', 'color', 'pad'], dur: 2.8,
      sfx: [[.02, 'whistle'], [.14, 'clink'], [.38, 'clink'], [.66, 'thunk'], [.86, 'pop'], [.97, 'fanfare']],
      need: K('개집 앞 출발 단추가 조용해… 호루라기가 있으면 불어 볼 텐데', 'The start button by the kennel is quiet… if only we had a whistle'),
      found: K('호루라기다! 개집 앞 코스에서 불어 보자', 'A whistle! Blow it at the course by the kennel'),
      line: K('삐익! 공이 데굴, 화분이 툭… 명예 순경 모자 받침이 펼쳐졌어!', 'Wheeet! The ball rolls, the pot tips… up comes the honorary officer’s stand!') }],
    aux: [{ dev: 'gptgearcabinet#0:0', sfx: [[.05, 'ratchet'], [.4, 'gearUp'], [.9, 'slide']] },
      { dev: 'gptweightbench#0:0', sfx: [[.05, 'thunk'], [.55, 'slide']], line: K('뼈다귀 하나에 저울이 기울었어', 'One bone tips the scale') },
      { dev: 'gptcadetlift#0:0', sfx: [[.05, 'latch'], [.35, 'ratchet'], [.85, 'land']] },
      { dev: 'gptrotaryline#0:0', sfx: [[.2, 'swish']] },
      { dev: 'gptbadgeboard#0:0', sfx: [[.5, 'flip']], line: K('시험표 뒤: "명예 순경은 호루라기부터!"', 'Behind the test sheet: "An honorary officer starts with the whistle!"') }],
  },
  // 20판 햇살 빌라 옥상 ★(장치판 — 주 장치는 정본 devices.js 도르래 장독대): 보조만. 옥탑 내림 손잡이 → 기어 → 점검문(물탱크 → 꽃),
  // 텃밭 바퀴 → 기어 → 씨앗 상자, 집들이 간판 뒤집기 → 비밀 바닥 (설계서 20 보조: 물탱크 레버 · 평상 비밀 바닥 · 간판 뒤집기)
  gptvillaroof: {
    aux: [{ dev: 'gptroofstairhut#0:1', dur: 1.4, sfx: [[.05, 'latch'], [.35, 'gearUp'], [.7, 'creak'], [.92, 'blub']], line: K('물탱크에서 쪼르륵… 화분 꽃이 폈다!', 'A trickle from the water tank… the flowers bloom!') },
      { dev: 'gptroofgarden#0:0', dur: 1.3, sfx: [[.05, 'ratchet'], [.45, 'gearUp'], [.9, 'pop']] },
      { dev: 'gptroofpartytable#0:0', dur: 1.2, sfx: [[.05, 'flip'], [.5, 'drawer'], [.9, 'thunk']], line: K('간판 뒷면 화살표가 장독대를 가리켜!', 'The arrow on the back of the sign points at the jars!') }],
  },
  // 21판 파출소 앞 보스(자물쇠 넷 그대로): 보조 셋 — 순찰차 경광등 스위치(빛이 바닥을 쓸고 감), 자전거 우편 바구니 도르래, 분실물 톱니 셔터
  gptpolicefront: {
    aux: [{ dev: 'gpt_patrolcar#0:2', dur: 1.4, sfx: [[.02, 'click'], [.2, 'sirenPolice'], [.9, 'latch']], line: K('삐뽀삐뽀! …아무도 출동 안 해', 'Wee-woo! …nobody heads out') },
      { dev: 'gpt_policebikerack#0:0', dur: 1.3, sfx: [[.02, 'doorBell'], [.3, 'ratchet'], [.85, 'land']] },
      { dev: 'gpt_lostlockers#0:4', dur: 2.4, sfx: [[.05, 'ratchet'], [.3, 'gearUp'], [.6, 'clink'], [.92, 'latch']] }],
  },
  // 23판 삐딱이네 골목: 알람시계(관찰 자물쇠) → 창고 문 → 창고 레버 → 의자 둘 사이 셔터가 철컥 → 가방 (설계서 23). 레버는 도구 없이
  // 당기는 장치라 보조 줄로(셔터 칸은 레버로만 열림), 보조: 화분 회전 선반 · 차양(공 데굴) · 대문 크랭크 · 의자 비밀 바닥
  gptalley: {
    aux: [{ dev: 'gpt_alley_shed#0:1', dur: 2.8, sfx: [[.05, 'latch'], [.35, 'ratchet'], [.7, 'slide'], [.95, 'land']], links: [{ dev: 'gpt_alley_bagbay#0:0', at: .45 }],
      line: K('철컥! 의자 사이 셔터가 올라갔어', 'Clunk! The shutter between the chairs goes up') },
      { dev: 'gpt_alley_house#0:1', sfx: [[.05, 'gearUp'], [.8, 'click']] },
      { dev: 'gpt_alley_house#0:2', sfx: [[.05, 'rustle'], [.5, 'clink'], [.9, 'thump']], line: K('차양 위에서 잊어버린 공이 데굴!', 'A forgotten ball rolls off the awning!') },
      { dev: 'gpt_alley_yardgate#0:0', sfx: [[.05, 'ratchet'], [.45, 'gearUp'], [.8, 'latch'], [.95, 'creak']] },
      { dev: 'gpt_alley_chair#0:0', sfx: [[.05, 'drawer'], [.7, 'thunk']], line: K('의자 밑에… 몰래 뜨던 털실?', 'Under the chair… secret knitting?') }],
  },
  // 25판 모퉁이 가게집: 가게 시계(관찰 자물쇠) → 계산대 서랍 → 크랭크 손잡이 → 셔터 크랭크: 셔터가 감기며 → 층간 배달 승강기가 올라가고
  // → 옥상 도르래 바구니가 내려옴 → 바구니 속 (설계서 25: 시계 → 계산대 서랍 → 도르래 손잡이 → 바구니 도르래 → 바구니 속)
  gptcornershop: {
    spec: { lockOn: { code: ['gpt_till'] } },
    steps: [{ dev: 'gpt_shutter#0:0', tool: 'pulleyhandle', behind: ['code', 'pad', 'color'], dur: 1.8, payoff: 'gpt_roofbasket#0:0',
      links: [{ dev: 'gpt_dumbwaiter#0:0', at: .45 }, { dev: 'gpt_roofbasket#0:0', at: .8 }],
      sfx: [[.03, 'ratchet'], [.4, 'lift_metal'], [.75, 'ratchet'], [.97, 'land']],
      need: K('셔터 크랭크에 손잡이가 빠져 있어! 가게 어딘가에 있을 텐데', 'The shutter crank has no handle! It must be somewhere in the shop'),
      found: K('크랭크 손잡이다! 셔터 옆 크랭크에 끼워 보자', 'A crank handle! Fit it on the crank by the shutter'),
      line: K('드르륵… 승강기가 올라가고 옥상 바구니가 내려왔다!', 'Rrrattle… up goes the lift, and down comes the rooftop basket!') }],
    aux: [{ dev: 'gpt_gacha#0:0', sfx: [[.05, 'ratchet'], [.6, 'pop']], line: K('캡슐 뽑기! …빈 캡슐이네', 'A capsule! …an empty one') },
      { dev: 'gpt_sign#0:0', sfx: [[.5, 'flip']] }, { dev: 'gpt_watertank#0:0', sfx: [[.05, 'latch'], [.4, 'blub']] }, { dev: 'gpt_sleepcat#0:0', sfx: [[.1, 'snore'], [.8, 'giggle']] }],
  },
};
CHAINS_A.gptdoghouse2 = CHAINS_A.gptdoghouse;
CHAINS_A.firestation = CHAINS_A.gptfirestation;
CHAINS_A.firestation2 = CHAINS_A.gptfirestation;   // (19판 결정: 정본 소방서 + GPT 소방서 오브젝트 재배치 — ① firestation2)   // (19판은 정본 소방서 유지 + GPT 소방서 장치를 ①이 옮겨 놓음 — 같은 줄, 부품이 있는 것만 붙음)
// 정본에 켜는 맵 (사용자가 시트에서 고른 판만 — 검토 세션이 알려 주면 켬) — ① 10/23: GPT 맵 스위치(?gptmaps=1, stages.js GPT_MAPS_ON과 같은 값)가
// 켜졌을 때만; 꺼져 있으면 지금 플레이어의 판은 그대로
const GPT_ON = (() => { try { const q = new URLSearchParams(location.search).get('gptmaps'); return (q ?? localStorage.getItem('gptmaps')) === '1'; } catch (e) { return false; } })();
export const ON_A = !GPT_ON ? [] : ['firestation2', 'firestation', 'gptfirestation', 'gptdoghouse', 'gptdoghouse2', 'gptvillaroof', 'gptpolicefront', 'gptalley', 'gptcornershop'];
