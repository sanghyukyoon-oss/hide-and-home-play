// 내 Lv (10/20 user: "그래서 많이 털면 레벨 오르는 거지?"): one ruler for me and the houses I raid (their owner's Lv on the scout card).
// Stars from the stages count as before (6 stars = 1 Lv, so nobody's Lv drops), and a raid adds a lot on top: each thing
// found, each of its stars, the 보물. A full raid of five is nearly a whole Lv. A house raided clean before gives a third.
export const XP = { star: 10, per: 60, find: 4, raidStar: 8, treasure: 6 };
export const xpOf = save => (save.stars || 0) * XP.star + (save.raidXp || 0);
export function lvOf(save) { const x = xpOf(save); return { lv: 1 + Math.floor(x / XP.per), into: x % XP.per, need: XP.per, xp: x }; }
// a raid's XP (rate: the house's own rate — ⅓ when it was cleaned out before)
export const raidXp = (found, stars, treasure, rate = 1) => Math.max(1, Math.round((found * XP.find + stars * XP.raidStar + (treasure ? XP.treasure : 0)) * rate));
export function addRaidXp(save, n) { const a = lvOf(save).lv; save.raidXp = (save.raidXp || 0) + n; const b = lvOf(save).lv; return { from: a, to: b, up: b > a }; }
