// 판마다 대표 소품 (G3, ⑥ 10/22 — user "G3 대표 소품 ㄱ"): a stage whose map comes back gets one hero piece of its own
// (gfx/hero-props.js) in place of an everyday piece of the same size — the k-th piece of that type, counted through the map's
// rooms in order. Same footprint, so paths and the room the planner sees stay put; the hero brings its own hiding spot(s).
// map key → { type, k, to } (10/22 ② RENUM: by the map, not the stage number)
// (10/22 저녁 사용자 "클로드가 한 거는 쨍하고 이쁜데 지피티는 뭔가 RGB가 아닌 듯", 18시 시트 '채택': 골목 보스 맵(33판)의 계단은
// 다시 ⑥ 벽화 계단 — GPT 무지개 계단 gpt_hero_rainbowstairs는 키로 남음)
export const HEROES = { alleywide: { type: 'stairs', to: 'muralstairs' } };
export function heroLayout(room, L) {
  const h = HEROES[room]; if (!h || !L) return L;
  let seen = 0, done = false;
  const sw = lay => ({ ...lay, furniture: (lay.furniture || []).map(f => {
    if (done || f.type !== h.type) return f;
    if (seen++ !== (h.k || 0)) return f;
    done = true; return { ...f, type: h.to };
  }) });
  return L.rooms ? { ...L, rooms: L.rooms.map(r => ({ ...r, layout: sw(r.layout) })) } : sw(L);
}
