// 판마다 대표 소품 (G3, ⑥ 10/22 — user "G3 대표 소품 ㄱ"): a stage whose map comes back gets one hero piece of its own
// (gfx/hero-props.js) in place of an everyday piece of the same size — the k-th piece of that type, counted through the map's
// rooms in order. Same footprint, so paths and the room the planner sees stay put; the hero brings its own hiding spot(s).
// stage number (1-based) → { type, k, to }
export const HEROES = {
  // 골목 보스: 무지개 벽화 계단 (10/22 the user kept this one; the other stages' heroes go to the GPT workshop)
  31: { type: 'stairs', to: 'muralstairs' },
};
export function heroLayout(n, L) {
  const h = HEROES[n]; if (!h || !L) return L;
  let seen = 0, done = false;
  const sw = lay => ({ ...lay, furniture: (lay.furniture || []).map(f => {
    if (done || f.type !== h.type) return f;
    if (seen++ !== (h.k || 0)) return f;
    done = true; return { ...f, type: h.to };
  }) });
  return L.rooms ? { ...L, rooms: L.rooms.map(r => ({ ...r, layout: sw(r.layout) })) } : sw(L);
}
