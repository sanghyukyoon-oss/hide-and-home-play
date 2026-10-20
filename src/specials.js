// 상점 '스페셜' 칸 (경제 세션 10/20 — user: "맵에 없는 스페셜 가구나 물건도 상점에서 살 수 있게 해 줄래? 이것도 레벨에 따라 잠금 풀리게도.
// 어떤 거 해금 조건은 친구네 습격 5번 이상 뭐 이런 것도 있음 좋고"). Pieces the shop's 가구 tab never sells (one stage's showpiece at
// most), each opened by how far you've come or by something you've done; until then a dark silhouette with its condition and how
// far along you are. The design session's '특별 선물' models go in this list as they come.
import { EN } from './i18n-en-dict.js';
import { ownedFriends } from './econ.js';

const K = (ko, en) => { EN[ko] = en; return ko; };

// feats: counters kept in save.feats (raids: a friend's house cleared on 놀러 가기 · keeps: a raid on my home that took nothing)
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
    friends: ownedFriends(save.home || {}).size,
  };
}

// t: furniture type · price · need: [feat, n] · say: the condition as one line
export const SPECIALS = [
  { t: 'schooldesk', price: 200, need: ['stage', 10], say: K('10판 깨기', 'Clear stage 10') },
  { t: 'funbox', price: 240, need: ['stars3', 10], say: K('별 셋 10판', '3 stars on 10 stages') },
  { t: 'photoheart', price: 260, need: ['friends', 3], say: K('친구 3명 부르기', 'Call 3 friends home') },
  { t: 'merchtable', price: 280, need: ['raids', 3], say: K('친구네 털기 3번', "Raid friends' homes 3 times") },
  { t: 'graffitiwall', price: 300, need: ['stage', 30], say: K('30판 깨기', 'Clear stage 30') },
  { t: 'donutart', price: 360, need: ['keeps', 3], say: K('털림 막기 3번', 'Keep your treasure safe from 3 raids') },
  { t: 'quarterpipe', price: 380, need: ['raids', 5], say: K('친구네 털기 5번', "Raid friends' homes 5 times") },
  { t: 'thinker', price: 450, need: ['stars3', 30], say: K('별 셋 30판', '3 stars on 30 stages') },
];
// where one stands: open, and how far along (have / n)
export function specialState(save, sp, f = feats(save)) {
  const [k, n] = sp.need, have = Math.min(n, f[k] || 0);
  return { open: have >= n, have, n };
}
export const SPECIAL_TXT = {
  head: K('스페셜', 'Special'),
  note: K('맵에서 거의 못 보는 특별한 가구예요. 조건을 채우면 열려요.', 'Rare pieces you hardly see in the stages. Meet the condition to open one.'),
  locked: K('아직 잠겨 있어! 조건을 채우면 열려', 'Still locked! Meet the condition to open it'),
};
