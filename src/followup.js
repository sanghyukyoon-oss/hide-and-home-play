// Campaign interludes are durable work: the stage clear and its next activity share one save.
import { EN } from './i18n-en-dict.js';
import { MINI_AFTER, BOSS_GAMES } from './minis.js';
import { BOSS_AFTER } from './scenes/boss.js';

EN['놀이 이어하기'] = 'Continue activity';
export const followupLabel = f => f.scene === 'boss' ? '보물 지키기' : ({ yasik: '엄마 몰래 야식', hotel: '몽글 호텔 X박 X일', wakeup: '아침 깨우기 장치', whack: '두더지 숨바꼭질', redlight: '무궁화 꽃이 피었습니다', blanket: '이불 속 누구게?', spot: '너굴이의 바꿔치기', lamp: '손전등 술래' }[f.kind] || '놀이');

export function followupAt(after) {
  if (!Number.isInteger(after) || after < 0) return null;
  if (BOSS_AFTER.includes(after)) return { scene: 'boss', after, key: String(after) };
  const b = BOSS_GAMES[after];
  if (b) return { scene: 'bossgame', ...b, after, key: 'g' + after };
  const m = MINI_AFTER[after];
  if (m) return { scene: m.lab ? 'bossgame' : 'mini', kind: m.kind, lv: m.lv || 0, ...(m.lab ? { interlude: true } : {}), after, key: 'm' + after };
  return null;
}
const canonical = p => { const f = followupAt(p?.after); return f && f.scene === p.scene && f.key === p.key ? f : null; };
const needsFinish = f => f?.scene === 'bossgame' && !f.interlude; // story or ending; empty stories finish immediately
export function queueFollowup(save, after) {
  if (after === 69 && save.ending) { (save.bossDone || (save.bossDone = {})).g69 = true; return; }
  if (save.followup || save.followupFinish) return;
  const f = followupAt(after);
  if (f && !save.bossDone?.[f.key]) save.followup = f;
}
export function normalizeFollowup(save) {
  // Older versions could finish the ending after skipping the last night without writing g69.
  if (save.ending) { (save.bossDone || (save.bossDone = {})).g69 = true; if (save.followupFinish?.after === 69) delete save.followupFinish; }
  const p = canonical(save.followup), tail = canonical(save.followupFinish);
  if (!p || save.bossDone?.[p.key]) delete save.followup; else save.followup = p;
  if (!tail) delete save.followupFinish;
  else save.followupFinish = { ...tail, won: !!save.followupFinish.won };
  // Old saves resume only the activity immediately after their last stage; never replay an old backlog.
  if (!save.followup && !save.followupFinish) queueFollowup(save, (save.stage || 0) - 1);
  const last = followupAt(69);
  if ((save.stage || 0) >= 70 && !save.ending && !save.followup && !save.followupFinish && save.bossDone?.[last?.key]) save.followupFinish = { ...last, won: false };
}
export function resumeFollowup(save) {
  const f = canonical(save.followupFinish);
  if (f) return { name: f.scene, data: { ...f, resumeFinish: true, resumeWon: !!save.followupFinish.won } };
  const p = canonical(save.followup);
  return p ? { name: p.scene, data: { ...p } } : null;
}
// Coins, completion, magnifier and removal of pending gameplay are committed together, exactly once.
export function settleFollowup(G, f, { coins = 0, won = false, replayWin = false } = {}) {
  const s = G.save, c = canonical(f);
  if (!c || G.playMode) return { first: false, coins: 0, lens: false };
  const done = s.bossDone || (s.bossDone = {}), first = !done[c.key];
  let lens = false;
  // A fresh, deliberate replay pays a third. The scene's win guard consumes that attempt once;
  // restoring a completed tail and duplicate completion callbacks never request replayWin.
  const awarded = first ? coins : won && replayWin ? Math.round(coins / 3) : 0;
  if (first || (won && replayWin)) {
    s.coins = Math.max(0, (s.coins || 0) + awarded);
    if (won && G.econ) { const bag = s.lens || (s.lens = { bag: 0 }); const before = bag.bag || 0; bag.bag = Math.min(5, before + 1); lens = bag.bag > before; }
    done[c.key] = true;
    if (needsFinish(c)) s.followupFinish = { ...c, won };
  }
  if (s.followup?.key === c.key) delete s.followup;
  G.persist();
  return { first, coins: awarded, lens };
}
export function clearFollowupFinish(G, after) {
  if (G.playMode || G.save.followupFinish?.after !== after) return;
  delete G.save.followupFinish; G.persist();
}
// Only a deliberate next-stage action from an active activity means "skip". Home preserves it.
export function routeFollowup(G, name, data) {
  if (G.playMode || data.preview || data.custom || data.direct) return { name, data };
  if (name !== 'stage' || data.idx !== (G.save.stage || 0)) return { name, data };
  const current = G.scene, f = followupAt(current?.after);
  if (f && current?.name === f.scene && !G.save.bossDone?.[f.key]) settleFollowup(G, f);
  const pending = resumeFollowup(G.save);
  return pending || { name, data };
}
