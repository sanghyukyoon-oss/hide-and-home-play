// ④ 아침 깨우기 장치 — the deterministic tile simulation (no THREE, no DOM: the game, the bots and a plain node script
// all run the same rules). A level is a grid of floor tiles; things stand on tiles and pass one "push" along:
//   공 ball     rolls straight, tile by tile, until something stops it; hitting a thing pushes that thing
//   반사판 defl  a ball (or the fan's wind) passing its tile turns 90°. o 0: E↔N, W↔S · o 1: E↔S, W↔N
//   책 book     pushed → falls that way and pushes the next tile (dominoes)
//   선풍기 fan   pushed from any side → switches on and blows along its facing (o = dir); the wind pushes the first thing
//   자명종 clock pushed → rings. Next to the bed (8 tiles round it) it wakes 졸졸이 — unless 졸졸이 wears headphones
//   고양이 cat   pushed → leaps two tiles that way. Landing on the bed wakes 졸졸이
//   레버 lever   on a back wall: anything pushed into the wall at its tile pulls it → the curtain opens → sunlight on the bed
//   쿠키 cookie  anything rolling / blowing over its tile flicks it into 몽글이's mouth (a bonus star)
// Wind reaching the bed blows the quilt off (wakes). A ball or a book bumping the bed doesn't ("음냐… 5분만…").
// simulate() returns the whole chain as a list of events, which the game animates one after another.

export const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // 0 N(-z) 1 E(+x) 2 S(+z) 3 W(-x)
export const DNAME = ['N', 'E', 'S', 'W'];
const REFL = [[1, 0, 3, 2], [3, 2, 1, 0]];
export const reflect = (d, o) => REFL[o][d];
// how many orientations a piece type has (tap cycles through them)
export const ORIENTS = { defl: 2, fan: 4, ball: 1, book: 1, clock: 1 };
export const PIECE_NAME = { defl: '반사판', fan: '선풍기', ball: '공', book: '책', clock: '자명종' };

const K = (i, j) => i + ',' + j;

// ── the three mornings. Tiles are (i, j): i along +x (screen: right-down), j along +z (screen: left-down).
// The back walls are N (j = -1) and W (i = -1). bed: [i, j] = its head tile; it covers (i, j) and (i, j + 1).
// furn: scenery that blocks a tile (type is the room furniture; w × d its footprint). fixed: pieces that are part of the
// level (can't be moved). tray: what the player gets. par: fewest pieces a solution needs (the third star).
export const LEVELS = [
  { key: 'l1', name: '첫째 아침', sub: '공을 자명종 쪽으로!', w: 6, d: 5,
    bed: [5, 0], mong: { at: [0, 4], dir: 1 },
    furn: [{ type: 'wardrobe', i: 0, j: 0 }, { type: 'bookshelf', i: 1, j: 0 }, { type: 'plant', i: 0, j: 2 }],
    fixed: [{ type: 'book', i: 4, j: 3, face: 'z' }, { type: 'book', i: 4, j: 2, face: 'z' }, { type: 'book', i: 4, j: 1, face: 'z' }, { type: 'clock', i: 4, j: 0 }],
    cookie: [3, 4], tray: ['defl'], par: 1, isNew: ['defl'] },
  { key: 'l2', name: '둘째 아침', sub: '자명종은 침대 옆에 둬야 들려', w: 6, d: 5,
    bed: [5, 0], mong: { at: [0, 4], dir: 1 },
    furn: [{ type: 'wardrobe', i: 0, j: 0 }, { type: 'desk', i: 1, j: 0, w: 2 }, { type: 'plant', i: 2, j: 2 }],
    fixed: [{ type: 'book', i: 2, j: 4 }, { type: 'ball', i: 3, j: 4 }],
    cookie: [4, 3], tray: ['clock', 'defl'], par: 2, isNew: ['clock'] },
  { key: 'l3', name: '셋째 아침', sub: '졸졸이가 헤드폰을 끼고 잔다…', w: 6, d: 5, ear: true,
    bed: [5, 0], mong: { at: [0, 1], dir: 2 },
    furn: [{ type: 'wardrobe', i: 0, j: 0 }, { type: 'plant', i: 2, j: 1 }],
    fixed: [{ type: 'book', i: 1, j: 4 }, { type: 'book', i: 2, j: 4 }, { type: 'cat', i: 5, j: 3 }],
    cookie: [3, 2], tray: ['fan', 'defl', 'defl', 'clock'], par: 3, isNew: ['fan'] },
];

// every tile a footprint covers (furniture 1×1 unless w / d say otherwise; bed is 1×2)
export function blockedTiles(LV) {
  const out = [];
  for (const f of LV.furn || []) for (let a = 0; a < (f.w || 1); a++) for (let b = 0; b < (f.d || 1); b++) out.push([f.i + a, f.j + b, f]);
  return out;
}
export function bedTiles(LV) { return [[LV.bed[0], LV.bed[1]], [LV.bed[0], LV.bed[1] + 1]]; }
export function startBall(LV) { const [dx, dz] = DIRS[LV.mong.dir]; return [LV.mong.at[0] + dx, LV.mong.at[1] + dz]; }

// tiles a piece may be placed on (free floor: no furniture, bed, fixed piece, 몽글이, the first ball or the cookie)
export function freeTiles(LV) {
  const taken = new Set();
  for (const [i, j] of blockedTiles(LV)) taken.add(K(i, j));
  for (const [i, j] of bedTiles(LV)) taken.add(K(i, j));
  for (const f of LV.fixed || []) taken.add(K(f.i, f.j));
  taken.add(K(...LV.mong.at)); taken.add(K(...startBall(LV)));
  if (LV.cookie) taken.add(K(...LV.cookie));
  const out = [];
  for (let j = 0; j < LV.d; j++) for (let i = 0; i < LV.w; i++) if (!taken.has(K(i, j))) out.push([i, j]);
  return out;
}

// placed: [{ type, i, j, o, id? }] (ids default to 'p' + index). Returns { events, result: 'win'|'fail', how, cookie, hits, stop }
export function simulate(LV, placed = []) {
  const W = LV.w, D = LV.d, cells = new Map(), pieces = {};
  const put = p => { cells.set(K(p.i, p.j), p); pieces[p.id] = p; };
  bedTiles(LV).forEach(([i, j]) => cells.set(K(i, j), { type: 'bed', id: 'bed', i, j }));
  blockedTiles(LV).forEach(([i, j, f], n) => cells.set(K(i, j), { type: 'block', id: 'blk' + n, i, j, furn: f.type }));
  cells.set(K(...LV.mong.at), { type: 'mong', id: 'mong', i: LV.mong.at[0], j: LV.mong.at[1] });
  const [bi, bj] = startBall(LV);
  put({ type: 'ball', id: 'ball0', i: bi, j: bj, o: 0 });
  (LV.fixed || []).forEach((f, n) => put({ ...f, o: f.o || 0, id: f.id || 'f' + n, fixed: true }));
  placed.forEach((p, n) => put({ ...p, o: p.o || 0, id: p.id || 'p' + n }));
  const ev = [], touched = new Set(); let hits = 0, cookie = false, steps = 0;
  const touch = (i, j) => touched.add(K(i, j));
  const inB = (i, j) => i >= 0 && j >= 0 && i < W && j < D;
  const at = (i, j) => cells.get(K(i, j));
  const nearBed = (i, j) => bedTiles(LV).some(([a, b]) => Math.max(Math.abs(a - i), Math.abs(b - j)) <= 1);
  const lever = LV.lever;
  // does a push out of tile (i, j) going d run into the lever's spot on the wall?
  const leverAt = (i, j, d) => lever && ((lever.wall === 'W' && d === 3 && i === 0 && j === lever.at) || (lever.wall === 'N' && d === 0 && j === 0 && i === lever.at));
  const end = (result, how, stop, reason) => { ev.push(result === 'win' ? { e: 'win', how } : { e: 'fail', at: stop, reason }); return { events: ev, result, how: how || null, cookie, hits, stop: stop || null, reason: reason || null, touched: [...touched].map(k => k.split(',').map(Number)) }; };
  const cookieAt = (i, j) => !cookie && LV.cookie && LV.cookie[0] === i && LV.cookie[1] === j;
  const pullLever = (i, j, by) => {
    hits++; ev.push({ e: 'lever', at: [i, j], by });
    const sunOnBed = true;   // the window is over the bed
    ev.push({ e: 'sun', wake: sunOnBed });
    return sunOnBed ? end('win', 'sun') : end('fail', null, [i, j], 'sun');
  };

  // a ball rolling from its tile in direction d
  const roll = (b, d) => {
    cells.delete(K(b.i, b.j));
    let { i, j } = b;
    for (;;) {
      if (++steps > 400) return end('fail', null, [i, j], 'loop');
      const [dx, dz] = DIRS[d], ni = i + dx, nj = j + dz;
      if (!inB(ni, nj)) {
        b.i = i; b.j = j; if (!at(i, j)) cells.set(K(i, j), b);
        if (leverAt(i, j, d)) { ev.push({ e: 'bump', id: b.id, at: [i, j], dir: d, into: 'lever' }); return pullLever(i, j, b.id); }
        ev.push({ e: 'bump', id: b.id, at: [i, j], dir: d, into: 'wall' });
        return end('fail', null, [i, j], 'wall');
      }
      const c = at(ni, nj);
      if (!c || c.type === 'defl') {
        ev.push({ e: 'step', id: b.id, from: [i, j], to: [ni, nj], dir: d });
        i = ni; j = nj; touch(i, j);
        if (cookieAt(i, j)) { cookie = true; hits++; ev.push({ e: 'cookie', at: [i, j], by: b.id }); }
        if (c) { const d2 = reflect(d, c.o); hits++; ev.push({ e: 'bounce', id: c.id, ball: b.id, at: [i, j], din: d, dout: d2 }); d = d2; }
        continue;
      }
      b.i = i; b.j = j; cells.set(K(i, j), b);
      if (c.type === 'bed') { ev.push({ e: 'bump', id: b.id, at: [i, j], dir: d, into: 'bed' }); return end('fail', null, [ni, nj], 'bed'); }
      if (c.type === 'block' || c.type === 'mong') { ev.push({ e: 'bump', id: b.id, at: [i, j], dir: d, into: c.type, target: c.id }); return end('fail', null, [i, j], c.type); }
      ev.push({ e: 'hit', id: b.id, at: [i, j], dir: d, target: c.id });
      return push(c, d, b.id);
    }
  };
  // the fan's wind from tile (i, j) going d: passes free tiles (and the cookie), bends on deflectors, pushes the first thing
  const blow = (f, d) => {
    let { i, j } = f;
    for (;;) {
      if (++steps > 400) return end('fail', null, [i, j], 'loop');
      const [dx, dz] = DIRS[d], ni = i + dx, nj = j + dz;
      if (!inB(ni, nj)) {
        if (leverAt(i, j, d)) { ev.push({ e: 'gustend', fan: f.id, at: [i, j], dir: d, into: 'lever' }); return pullLever(i, j, f.id); }
        ev.push({ e: 'gustend', fan: f.id, at: [i, j], dir: d, into: 'wall' });
        return end('fail', null, [i, j], 'wind');
      }
      const c = at(ni, nj);
      if (!c || c.type === 'defl') {
        ev.push({ e: 'gust', fan: f.id, from: [i, j], to: [ni, nj], dir: d });
        i = ni; j = nj; touch(i, j);
        if (cookieAt(i, j)) { cookie = true; hits++; ev.push({ e: 'cookie', at: [i, j], by: f.id }); }
        if (c) { const d2 = reflect(d, c.o); hits++; ev.push({ e: 'bounce', id: c.id, ball: null, at: [i, j], din: d, dout: d2 }); d = d2; }
        continue;
      }
      if (c.type === 'bed') { hits++; ev.push({ e: 'gustend', fan: f.id, at: [i, j], dir: d, into: 'bed' }); ev.push({ e: 'quilt' }); return end('win', 'wind'); }
      ev.push({ e: 'gustend', fan: f.id, at: [i, j], dir: d, into: c.type, target: c.id });
      if (c.type === 'block' || c.type === 'mong') return end('fail', null, [i, j], c.type);
      return push(c, d, f.id);
    }
  };
  const push = (c, d, by) => {
    if (++steps > 400) return end('fail', null, [c.i, c.j], 'loop');
    switch (c.type) {
      case 'ball': hits++; ev.push({ e: 'nudge', id: c.id, dir: d, by }); return roll(c, d);
      case 'book': {
        hits++; c.type = 'fallen'; ev.push({ e: 'fall', id: c.id, at: [c.i, c.j], dir: d, by });
        const [dx, dz] = DIRS[d], ni = c.i + dx, nj = c.j + dz;
        if (!inB(ni, nj)) return leverAt(c.i, c.j, d) ? pullLever(c.i, c.j, c.id) : end('fail', null, [c.i, c.j], 'wall');
        const n = at(ni, nj);
        if (!n) { touch(ni, nj); return end('fail', null, [c.i, c.j], 'empty'); }
        if (n.type === 'bed') { ev.push({ e: 'bedtap', by: c.id }); return end('fail', null, [ni, nj], 'bed'); }
        if (n.type === 'block' || n.type === 'mong' || n.type === 'defl' || n.type === 'fallen') return end('fail', null, [c.i, c.j], n.type);
        return push(n, d, c.id);
      }
      case 'clock': {
        hits++;
        const wake = nearBed(c.i, c.j) && !LV.ear;
        ev.push({ e: 'ring', id: c.id, at: [c.i, c.j], wake, near: nearBed(c.i, c.j), by });
        return wake ? end('win', 'clock') : end('fail', null, [c.i, c.j], nearBed(c.i, c.j) ? 'ear' : 'far');
      }
      case 'fan': hits++; ev.push({ e: 'fanon', id: c.id, at: [c.i, c.j], dir: c.o, by }); return blow(c, c.o);
      case 'cat': {
        hits++;
        const [dx, dz] = DIRS[d], ti = c.i + 2 * dx, tj = c.j + 2 * dz;
        const t = inB(ti, tj) ? at(ti, tj) : undefined;
        if (inB(ti, tj) && t?.type === 'bed') { ev.push({ e: 'catjump', id: c.id, from: [c.i, c.j], to: [ti, tj], land: 'bed', dir: d }); return end('win', 'cat'); }
        if (inB(ti, tj) && !t) {
          touch(ti, tj);
          ev.push({ e: 'catjump', id: c.id, from: [c.i, c.j], to: [ti, tj], land: 'floor', dir: d });
          cells.delete(K(c.i, c.j)); c.i = ti; c.j = tj; cells.set(K(ti, tj), c);
          return end('fail', null, [ti, tj], 'catfloor');
        }
        ev.push({ e: 'catjump', id: c.id, from: [c.i, c.j], to: null, land: 'stuck', dir: d });
        return end('fail', null, [c.i, c.j], 'catstuck');
      }
      default: ev.push({ e: 'thud', id: c.id, at: [c.i, c.j] }); return end('fail', null, [c.i, c.j], c.type);
    }
  };
  ev.push({ e: 'kick', id: 'ball0', dir: LV.mong.dir });
  return roll(pieces.ball0, LV.mong.dir);
}

export function starsOf(LV, r, nPlaced) {
  if (r.result !== 'win') return 0;
  return 1 + (r.cookie ? 1 : 0) + (nPlaced <= LV.par ? 1 : 0);
}

// ── brute force: every way to place any subset of the tray (each piece on a free tile, every orientation).
// visit(placed, r) is called for every arrangement; returns the count.
export function enumerate(LV, visit, { all = false } = {}) {
  const tiles = freeTiles(LV), tray = LV.tray, n = tray.length;
  let count = 0;
  const used = new Set(), placed = [];
  const rec = k => {
    if (k === n) { const r = simulate(LV, placed.map((p, q) => ({ ...p, id: 'p' + p.slot }))); count++; visit(placed.slice(), r); return; }
    // leave piece k in the tray
    if (!all) rec(k + 1);
    for (const [i, j] of tiles) {
      const key = K(i, j); if (used.has(key)) continue;
      used.add(key);
      for (let o = 0; o < (ORIENTS[tray[k]] || 1); o++) { placed.push({ type: tray[k], i, j, o, slot: k }); rec(k + 1); placed.pop(); }
      used.delete(key);
    }
  };
  rec(0);
  return count;
}

// the best solution: most stars, then fewest pieces (deterministic order)
export function solve(LV) {
  let best = null;
  enumerate(LV, (placed, r) => {
    if (r.result !== 'win') return;
    const s = starsOf(LV, r, placed.length);
    if (!best || s > best.stars || (s === best.stars && placed.length < best.placed.length)) best = { stars: s, placed, r };
  });
  return best;
}

// the same answer, much faster: a piece only changes the chain if it stands on a tile the chain reaches, so grow the
// arrangement one piece at a time on the tiles the current chain touches (what the in-page smart bot uses)
export function solveFast(LV, { limit = 400000 } = {}) {
  const free = new Set(freeTiles(LV).map(([i, j]) => K(i, j))), tray = LV.tray;
  let best = null, sims = 0;
  const consider = (placed, r) => {
    const s = starsOf(LV, r, placed.length);
    if (!best || s > best.stars || (s === best.stars && placed.length < best.placed.length)) best = { stars: s, placed: placed.slice(), r };
  };
  const rec = (placed, left) => {
    if (++sims > limit) return;
    const r = simulate(LV, placed.map(p => ({ ...p, id: 'p' + p.slot })));
    if (r.result === 'win') consider(placed, r);
    if (!left.length || (best && best.stars === 3 && placed.length >= best.placed.length)) return;
    const used = new Set(placed.map(p => K(p.i, p.j)));
    const tiles = r.touched.filter(([i, j]) => free.has(K(i, j)) && !used.has(K(i, j)));
    const types = new Set();
    for (const slot of left) {
      const type = tray[slot]; if (types.has(type)) continue; types.add(type);   // same-type pieces are interchangeable
      const rest = left.filter(x => x !== slot);
      for (const [i, j] of tiles) for (let o = 0; o < (ORIENTS[type] || 1); o++) { placed.push({ type, i, j, o, slot }); rec(placed, rest); placed.pop(); }
    }
  };
  rec([], tray.map((_, k) => k));
  return best && { ...best, sims };
}

// a random arrangement the way the random bot makes one: every tray piece on a random free tile, random orientation
export function randomPlacement(LV, rnd = Math.random) {
  const tiles = freeTiles(LV).slice(), out = [];
  LV.tray.forEach((type, k) => {
    const t = tiles.splice(Math.floor(rnd() * tiles.length), 1)[0];
    out.push({ type, i: t[0], j: t[1], o: Math.floor(rnd() * (ORIENTS[type] || 1)), slot: k });
  });
  return out;
}
