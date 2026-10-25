// 상점 '스페셜' 칸 (경제 세션 10/20 — user: "맵에 없는 스페셜 가구나 물건도 상점에서 살 수 있게 해 줄래? 이것도 레벨에 따라 잠금 풀리게도.
// 어떤 거 해금 조건은 친구네 습격 5번 이상 뭐 이런 것도 있음 좋고"). Pieces the shop's 가구 tab never sells (one stage's showpiece at
// most), each opened by how far you've come or by something you've done; until then a dark silhouette with its condition and how
// far along you are. The design session's '특별 선물' models go in this list as they come.
import { EN } from './i18n-en-dict.js';

const K = (ko, en) => { EN[ko] = en; return ko; };

// feats: counters kept in save.feats (raids: a friend's house cleared on 놀러 가기 · keeps: a raid on my home that took nothing —
// nothing found, or every find stopped by a friend at home; 털기 세션 10/20)
export function bumpFeat(save, key, n = 1) { const F = save.feats || (save.feats = {}); F[key] = (F[key] || 0) + n; }
// an old save starts from what it still shows: the friends' houses already cleared and the raids kept in the last log
export function feats(save) {
  const F = save.feats || {};
  const cleared = Object.values(save.visits || {}).filter(v => v?.ok).length;
  const keptLog = (save.raid?.log || []).filter(e => e.kind === 'fail').length;
  return {
    stage: save.stage || 0,
    stars3: Object.values(save.best || {}).filter(s => s >= 3).length,
    raids: Math.max(F.raids || 0, cleared),
    keeps: Math.max(F.keeps || 0, keptLog),
    cards: 0,   // (도감 cards: the caller fills it in from cardbook.js cardCount — the book isn't known here)
  };
}

// t: furniture type · price · need: [feat, n] · say: the condition as one line. Conditions you can read at a glance only: N판 깨기,
// 별 셋 N판, 친구네 털기 N번, 털림 막기 N번 (10/20, user: "3명 부르기 스페셜에 있네 이건 뭐냐" — no friend-count ones).
// A piece whose model isn't in yet (FURN_INFO has no such type) is left out of the shop; the 'sp_' ones are the design session's
// new models (user: "스페셜 꽤 많이 줘 봐. 오토바이라던지 BMX라던지. 램프 좋네. 기타라던지") and appear once they are registered.
// (10/20 밤, 경제 — 인수인계: "판·털기·별 조건이 고르게 퍼지게 한 표로"): 27 pieces in the order you'd open them, the price
// rising with it (200 → 800). Conditions: 판 깨기 12 (5 … 70) · 별 셋 6 (5 … 40) · 친구네 털기 6 (2 … 10) · 털림 막기 3 (2 · 4 · 6).
// gf_: the special-gift session's models that weren't picked as a boss gift (user: "선물 후보하고 남은 것들은 다 상점의 스페셜 코너로")
export const SPECIALS = [
  // 도감으로 열리는 열 개 (③ 10/21, user: "카드는 모으면 뭔가 리워드가 있어야하지않을까? … 상점 물건 하나 공짜로 주지말고 좀 돈좀 쓰게
  // 설계해주는게 낫겠어. 스페셜에 물건이나 가구 살수있게 풀어지는게 어때? 보상창 안떠도 되고 뱃지 넘버만 올라가는것 동의"): every ten 도감 cards
  // (friends met + things collected, 121 in all) opens one for buying — no gift, no window, a number on 상점. Prices 300 → 900:
  // a stage pays ~130 coins, so each is a few stages of saving (1~20판 ≈ 2,300 · 1~70판 ≈ 9,200)
  { t: 'sp_neonlamp', price: 300, need: ['cards', 10], say: K('도감 10장이면 열려요', 'Collect 10 cards to unlock') },
  { t: 'sp_guitar', price: 360, need: ['cards', 20], say: K('도감 20장이면 열려요', 'Collect 20 cards to unlock') },
  { t: 'sp_jukebox', price: 420, need: ['cards', 30], say: K('도감 30장이면 열려요', 'Collect 30 cards to unlock') },
  { t: 'sp_rocket', price: 480, need: ['cards', 40], say: K('도감 40장이면 열려요', 'Collect 40 cards to unlock') },
  { t: 'sp_arcade', price: 540, need: ['cards', 50], say: K('도감 50장이면 열려요', 'Collect 50 cards to unlock') },
  { t: 'sp_scope', price: 600, need: ['cards', 60], say: K('도감 60장이면 열려요', 'Collect 60 cards to unlock') },
  { t: 'sp_hammock', price: 660, need: ['cards', 70], say: K('도감 70장이면 열려요', 'Collect 70 cards to unlock') },
  { t: 'sp_piano', price: 720, need: ['cards', 80], say: K('도감 80장이면 열려요', 'Collect 80 cards to unlock') },
  { t: 'sp_moto', price: 800, need: ['cards', 90], say: K('도감 90장이면 열려요', 'Collect 90 cards to unlock') },
  { t: 'sp_dino', price: 900, need: ['cards', 100], say: K('도감 100장이면 열려요', 'Collect 100 cards to unlock') },
  { t: 'grindrail', price: 220, need: ['raids', 2], say: K('친구네 털기 2번', "Raid friends' homes 2 times") },
  { t: 'schooldesk', price: 240, need: ['stage', 10], say: K('10판 깨기', 'Clear stage 10') },
  { t: 'gf_musicbox', price: 260, need: ['stage', 12], say: K('12판 깨기', 'Clear stage 12') },
  { t: 'funbox', price: 260, need: ['stars3', 10], say: K('별 셋 10판', '3 stars on 10 stages') },
  { t: 'merchtable', price: 280, need: ['raids', 3], say: K('친구네 털기 3번', "Raid friends' homes 3 times") },
  { t: 'photoheart', price: 280, need: ['stage', 15], say: K('15판 깨기', 'Clear stage 15') },
  { t: 'donutart', price: 300, need: ['keeps', 2], say: K('털림 막기 2번', 'Keep your treasure safe from 2 raids') },
  { t: 'gf_photoframe', price: 300, need: ['raids', 4], say: K('친구네 털기 4번', "Raid friends' homes 4 times") },
  { t: 'gf_terrarium', price: 340, need: ['stars3', 15], say: K('별 셋 15판', '3 stars on 15 stages') },
  { t: 'quarterpipe', price: 340, need: ['raids', 5], say: K('친구네 털기 5번', "Raid friends' homes 5 times") },
  { t: 'gf_starlamp', price: 380, need: ['keeps', 4], say: K('털림 막기 4번', 'Keep your treasure safe from 4 raids') },
  { t: 'graffitiwall', price: 400, need: ['stage', 30], say: K('30판 깨기', 'Clear stage 30') },
  { t: 'gf_train', price: 440, need: ['stage', 35], say: K('35판 깨기', 'Clear stage 35') },
  { t: 'thinker', price: 460, need: ['stars3', 25], say: K('별 셋 25판', '3 stars on 25 stages') },
  // 스페셜 2차 25개 (⑥ 스페셜 물건 10/21, user: "스페셜 물건도 잔뜩 해줘" → "다 조아 ㄱㄱ"): 판 깨기 11 (5 … 60) · 별 셋 6 (3 … 30) ·
  // 친구네 털기 3 (1 · 6 · 8) · 털림 막기 3 (1 · 3 · 5) · 도감 110·120장 (관람차·범퍼카: 도감 줄의 끝). 값 300 → 950, 열리는 순서대로 오름
  { t: 'sp2_radio', price: 300, need: ['stage', 5], say: K('5판 깨기', 'Clear stage 5') },
  { t: 'sp2_mushlamp', price: 320, need: ['stars3', 3], say: K('별 셋 3판', '3 stars on 3 stages') },
  { t: 'sp2_neonheart', price: 340, need: ['stage', 8], say: K('8판 깨기', 'Clear stage 8') },
  { t: 'sp2_teepee', price: 340, need: ['raids', 1], say: K('친구네 털기 1번', "Raid a friend's home once") },
  { t: 'sp2_bigbear', price: 360, need: ['stars3', 8], say: K('별 셋 8판', '3 stars on 8 stages') },
  { t: 'sp2_globe', price: 380, need: ['stage', 18], say: K('18판 깨기', 'Clear stage 18') },
  { t: 'sp2_cotton', price: 400, need: ['keeps', 1], say: K('털림 막기 1번', 'Keep your treasure safe from 1 raid') },
  { t: 'sp2_turntable', price: 420, need: ['stage', 22], say: K('22판 깨기', 'Clear stage 22') },
  { t: 'sp2_eggchair', price: 440, need: ['stars3', 12], say: K('별 셋 12판', '3 stars on 12 stages') },
  { t: 'sp2_planet', price: 460, need: ['stage', 25], say: K('25판 깨기', 'Clear stage 25') },
  { t: 'sp2_pizza', price: 480, need: ['raids', 6], say: K('친구네 털기 6번', "Raid friends' homes 6 times") },
  { t: 'sp2_fountain', price: 500, need: ['stage', 28], say: K('28판 깨기', 'Clear stage 28') },
  { t: 'sp2_greenhouse', price: 520, need: ['stars3', 18], say: K('별 셋 18판', '3 stars on 18 stages') },
  { t: 'sp2_lighthouse', price: 540, need: ['stage', 33], say: K('33판 깨기', 'Clear stage 33') },
  { t: 'sp2_helmet', price: 560, need: ['keeps', 3], say: K('털림 막기 3번', 'Keep your treasure safe from 3 raids') },
  { t: 'sp2_trampoline', price: 580, need: ['stage', 40], say: K('40판 깨기', 'Clear stage 40') },
  { t: 'sp2_pinball', price: 600, need: ['stars3', 20], say: K('별 셋 20판', '3 stars on 20 stages') },
  { t: 'sp2_flowercart', price: 620, need: ['stage', 45], say: K('45판 깨기', 'Clear stage 45') },
  { t: 'sp2_cloudsofa', price: 650, need: ['raids', 8], say: K('친구네 털기 8번', "Raid friends' homes 8 times") },
  { t: 'sp2_aquarium', price: 680, need: ['stage', 50], say: K('50판 깨기', 'Clear stage 50') },
  { t: 'sp2_claw', price: 700, need: ['stars3', 30], say: K('별 셋 30판', '3 stars on 30 stages') },
  { t: 'sp2_dj', price: 740, need: ['stage', 60], say: K('60판 깨기', 'Clear stage 60') },
  { t: 'sp2_phonebox', price: 780, need: ['keeps', 5], say: K('털림 막기 5번', 'Keep your treasure safe from 5 raids') },
  { t: 'sp2_ferris', price: 850, need: ['cards', 110], say: K('도감 110장이면 열려요', 'Collect 110 cards to unlock') },
  { t: 'sp2_bumper', price: 950, need: ['cards', 120], say: K('도감 120장이면 열려요', 'Collect 120 cards to unlock') },
  // 스페셜 3차 4개 (⑥ 내 방 10/24, user: "지붕이랑 아이템들 새로 추가해주고"): 가챠 머신 · 고무 풀장 · 붕어빵 포장마차 · 즉석사진 부스
  { t: 'sp3_gacha', price: 440, need: ['stage', 16], say: K('16판 깨기', 'Clear stage 16') },
  { t: 'sp3_pool', price: 520, need: ['stars3', 22], say: K('별 셋 22판', '3 stars on 22 stages') },
  { t: 'sp3_bungeo', price: 640, need: ['stage', 38], say: K('38판 깨기', 'Clear stage 38') },
  { t: 'sp3_photobooth', price: 760, need: ['raids', 7], say: K('친구네 털기 7번', "Raid friends' homes 7 times") },
];
// where one stands: open, and how far along (have / n)
export function specialState(save, sp, f = feats(save)) {
  const [k, n] = sp.need, have = Math.min(n, f[k] || 0);
  return { open: have >= n, have, n };
}
export const SPECIAL_TXT = {
  head: K('스페셜', 'Special'),
  note: K('판에서 거의 못 보는 특별한 가구예요. 조건을 채우면 열려요.', 'Rare furniture you hardly ever see in stages. Meet the goal to unlock one.'),
  locked: K('아직 잠겨 있어! 조건을 채우면 열려', 'Still locked! Meet the goal to unlock it'),
};
// how many card-opened specials there are now (the lobby turns a new one into a number on 상점 — ③ 10/21)
export const cardOpened = (cards, has = () => true) => SPECIALS.filter(sp => sp.need[0] === 'cards' && cards >= sp.need[1] && has(sp.t)).length;
