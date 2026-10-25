// Visit strangers' rooms: published rooms from the shared store, plus practice rooms that always exist.
import * as THREE from 'three';
import { Room, indexSpots } from '../room.js';
import { ITEMS, TARGET_POOL } from '../gfx/items.js';
import { h, ICON } from '../ui.js';
import { Tweens, rng } from '../util.js';
import { HOME_ZONES, ZONE_TYPES, zoneLayout, SHOP_FURN, STARTER } from '../catalog.js';
import { net, initNet, listRooms, roomStats, names, practiceRooms } from '../net.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { stolenBy, residentId } from '../raid.js';
import { setScoutList } from '../raidrun.js';   // ② 정찰 + 다음 집
import { housePool, pickHouse } from '../presets.js';   // 털 집 찾기 (10/20)
import { raidOf } from '../raid.js';

const fakeWorld = { shadowDirty: false, yaw: Math.PI / 4 };
// ?visit=list: the old list (to compare)
const LIST_MODE = (() => { try { return new URLSearchParams(location.search).get('visit') === 'list'; } catch { return false; } })();

// A believable practice room: a zone with furniture and a few things hidden, keyed the same way as real rooms.
// mine = things this resident took from my home: hidden here too, marked as mine
export function makePractice(r, i, mine = []) {
  const type = ['room', 'storage', 'yard', 'room', 'park', 'room', 'yard', 'park'][i % 8];
  const indoor = ZONE_TYPES[type].indoor;
  const pool = SHOP_FURN.filter(x => FURN_INFO[x.type] && (indoor ? x.indoor : x.outdoor) && x.type !== 'rug').map(x => x.type);
  const furniture = [];
  const room = new Room(fakeWorld, zoneLayout({ type, furniture: [] }));
  const tryPlace = t => {
    for (let k = 0; k < 40; k++) {
      const ii = r.int(0, 4), j = r.int(0, 4), rot = r.int(0, 3);
      if (room.canPlace(t, ii, j, rot)) { const id = 'p' + furniture.length; room.addFurniture(t, ii, j, rot, id); furniture.push({ type: t, i: ii, j, rot, id }); return true; }
    }
    return false;
  };
  if (indoor) tryPlace('rug');
  const want = indoor ? 7 : 6;
  for (let n = 0; n < 30 && furniture.length < want; n++) tryPlace(r.pick(pool));
  const { spots, parts } = indexSpots(room);
  const keys = r.shuffle(Object.keys(spots));
  const own = r.shuffle(TARGET_POOL.slice()).slice(0, 3 + (i % 3));
  const items = [...new Set([...mine, ...own])];   // mine first, so they always get a spot
  const hidden = [];
  for (const t of items) {
    const k = keys.find(k => !hidden.some(x => x.spot === k) && ITEMS[t].h * (spots[k].scale || 1) <= spots[k].maxH && (spots[k].maxH >= .1 || ITEMS[t].flat));
    if (k) hidden.push({ item: t, spot: k });
  }
  const locks = [];
  const lp = Object.entries(parts).find(([, p]) => p.lockable && p.spots.some(s => hidden.some(x => x.spot === s.key)));
  if (lp && i % 2 === 0) {
    const kind = lp[1].furn.type === 'safe' ? 'code' : 'pad';
    locks.push({ part: lp[0], kind });
    const chain = kind === 'pad' ? 'key' : 'note';
    const k = keys.find(k => !hidden.some(x => x.spot === k) && !(spots[k].part && spots[k].part === lp[1]) && ITEMS[chain].h <= spots[k].maxH);
    if (k) hidden.push({ item: chain, spot: k }); else locks.pop();
  }
  return { stolen: mine.filter(t => hidden.some(x => x.item === t)), title: ZONE_TYPES[type].name, zone: { type, furniture, paint: {} }, hidden, locks, code: String(r.int(100, 999)), count: hidden.filter(x => x.item !== 'key' && x.item !== 'note').length };
}

export class VisitScene {
  constructor(G) { this.G = G; this.name = 'visit'; }
  async enter(args = {}) {
    if (!LIST_MODE) return this.search(args);
    const G = this.G, ui = G.ui;
    this.tw = new Tweens();
    G.setBg(['#e4f3ff', '#ffe0ee']); G.world.setLight(null);
    G.world.onTap = null; G.world.onDragStart = null;
    G.audio.music('home');
    const col = ui.col();
    const back = ui.ibtn('home', 'blue', () => G.go('home'));
    back.style.cssText += 'position:absolute;left:12px;top:calc(12px + var(--safeT))';
    col.append(back);
    const pills = h('div', { class: 'pills' }); const cp = ui.pill('coin', G.save.coins); pills.append(cp); col.append(pills); G.coinPills = [cp];
    col.append(h('div', { class: 'visit-title ol3' }, '놀러 가기'));
    this.listEl = h('div', { class: 'visitlist' }, h('div', { class: 'txt' }, '방 목록 불러오는 중…'));
    col.append(this.listEl);
    col.append(h('div', { class: 'modebar' }, ui.btn('내 방 꾸미러 가기', { color: 'orange', icon: 'home', onClick: () => G.go('myhome') })));
    this.load();
  }
  // ── 털 집 찾기 (10/20 user: "진짜 클래시 오브 클랜처럼 랜덤한 방 찾는 거지. 사진에 이거는 폐기하고"): no list — the
  // '털 집 찾는 중…' and a bar for a second or so, then one house; its scout card (raidrun.js) says whose,
  // and from there [털러 가기] or [다른 집] (a few coins, the way Clash's 'next' costs gold).
  async search({ again = false, force = null } = {}) {   // (force: a house id — tests and pictures)
    const G = this.G, ui = G.ui;
    this.tw = new Tweens();
    G.setBg(['#e4f3ff', '#ffe0ee']); G.world.setLight(null);
    G.world.onTap = null; G.world.onDragStart = null;
    G.audio.music('home');
    const col = ui.col();
    const back = ui.ibtn('home', 'blue', () => G.go('home'));
    back.style.cssText += 'position:absolute;left:12px;top:calc(12px + var(--safeT))';
    const pills = h('div', { class: 'pills' }); const cp = ui.pill('coin', G.save.coins); pills.append(cp); G.coinPills = [cp];
    // (10/20 user: "이거 좀 과하고 그냥 로딩 중 프로그래스바? 그런 거 넣어 주면 되지 않을까?" — the map and the magnifier went; the words and a bar)
    const fill = h('i', {}), bar = h('div', { class: 'hbar' }, fill);
    const title = h('div', { class: 'visit-title ol3' }, '털 집 찾는 중…');
    col.append(back, pills, h('div', { class: 'hsearch' }, title, bar));
    const t0 = performance.now(), DUR = G.bot ? 300 : again ? 900 : 1300;
    fill.animate([{ width: '0%' }, { width: '70%', offset: .55 }, { width: '100%' }], { duration: DUR, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
    // the pool (shared rooms too, if they answer in time — the real players later)
    const S = G.save, R = raidOf(S);
    let shared = [];
    try {
      await Promise.race([initNet(), new Promise(res => setTimeout(res, 500))]);
      const N0 = net();
      if (N0.ok) { const rooms = await Promise.race([listRooms(), new Promise(res => setTimeout(() => res([]), 700))]); shared = (rooms || []).filter(x => x.owner && x.owner !== N0.uid && x.zone && x.hidden?.length).map(x => ({ ...x, ownerName: x.ownerName || '누군가' })); }
    } catch { }
    if (this.dead) return;
    const pool = housePool(G, { practiceRooms, makePractice, stolenBy, residentId, shared });
    // the house on offer stays the same for a while unless you pay for another (QA9 P3: 집으로 → 놀러 가기 skipped [다른 집]'s coins)
    const now = Date.now(), O = R.offer, keyOf = x => x.id || x.owner;
    const kept = !force && !again && O && now - O.at < 30 * 60e3 && !((S.visits?.[O.id]?.at || 0) > O.at) ? pool.find(x => keyOf(x) === O.id) : null;
    const pick = (force && pool.find(x => x.id === force || x.house === force)) || kept || pickHouse(pool.filter(x => !again || !O || keyOf(x) !== O.id), S.stage, R.seen || []);
    if (!kept) R.offer = { id: keyOf(pick), at: now };
    R.seen = [...(R.seen || []).filter(k => k !== (pick.id || pick.owner)), pick.id || pick.owner].slice(-4); G.persist();
    this.rooms = [pick];
    const left = DUR - (performance.now() - t0);
    if (left > 0) await new Promise(res => setTimeout(res, left));
    if (this.dead) return;
    title.textContent = '찾았다!'; G.audio.sfx('pop', 5);
    await new Promise(res => setTimeout(res, 200));
    if (this.dead) return;
    setScoutList([]);
    G.go('stage', { custom: { ...pick, found: true }, scout: true });
  }
  exit() { this.dead = true; this.G.ui.clear(); }
  async load() {
    await initNet();
    const G = this.G, N = net();
    if (this.dead) return;
    const [shared, stats] = await Promise.all([listRooms(), roomStats()]);
    if (this.dead) return;
    const mine = N.uid;
    const others = shared.filter(r => r.owner && r.owner !== mine && r.zone && r.hidden?.length);
    const nm = await names(others.map(r => r.owner));
    if (this.dead) return;   // (GPT QA R2-04 10/19: a late answer from a list you'd left set the scout's 다음 집 list)
    const myResults = G.save.visits || {};
    const practice = practiceRooms((r, i) => makePractice(r, i, stolenBy(G.save, residentId(i))));
    // residents holding my things come first
    practice.sort((a, b) => (b.stolen?.length || 0) - (a.stolen?.length || 0));
    this.rooms = [...practice.filter(p => p.stolen?.length), ...others.map(r => ({ ...r, ownerName: nm[r.owner] || '누군가', stats: stats[r.owner] })), ...practice.filter(p => !p.stolen?.length)];
    this.listEl.innerHTML = '';
    setScoutList(this.rooms);
    if (!N.ok) this.listEl.append(h('div', { class: 'note' }, '지금은 연습 방만 있어요. 공유 링크로 열면 다른 사람이 올린 방도 여기 떠요.'));
    else if (!others.length) this.listEl.append(h('div', { class: 'note' }, '아직 올라온 방이 없어요. 내 방을 먼저 올려 볼까요?'));
    for (const r of this.rooms) {
      const done = myResults[r.practice ? r.id : r.owner];
      const face = G.thumbs['face_' + (r.face || 'mong')] || G.thumbs.face_mong;
      const mine = r.stolen?.length || 0;
      const card = h('div', { class: 'vcard' + (done?.ok && !mine ? ' cleared' : '') + (mine ? ' robbed' : '') },
        h('img', { class: 'vface', src: face }),
        h('div', { class: 'vinfo' },
          h('div', { class: 'vname' }, r.practice ? `${r.nick}의 ${r.title}` : `${r.ownerName}의 ${r.title || '방'}`),
          ...(mine ? [h('div', { class: 'vmine' }, `내 물건 ${mine}개를 갖고 있어! 되찾으러 가자`)] : r.brag ? [h('div', { class: 'vbrag' }, `“${r.brag}”`)] : []),
          h('div', { class: 'vmeta' }, `숨긴 물건 ${r.count || r.hidden.length}개` + (r.locks?.length ? ' · 잠금 있음' : '') + (r.resident ? ' · 동네 주민' : r.practice ? ' · 연습' : '') + (r.stats ? ` · ${r.stats.plays}명 도전, ${r.stats.wins}명 성공` : ''))),
        mine ? h('div', { class: 'vbadge mine' }, '되찾기') : done?.ok ? h('div', { class: 'vbadge ok' }, '찾음') : h('div', { class: 'vbadge' }, '털기'));
      card.addEventListener('click', () => { G.audio.sfx('btn'); G.go('stage', { custom: r, scout: true }); });   // (② 정찰 first)
      this.listEl.append(card);
    }
  }
  update(dt) { this.tw.update(dt); }
  botStep(dt) { if (!LIST_MODE) return; this._bt = (this._bt || 0) + dt; if (this._bt > 1.5 && this.rooms?.length) { this._bt = -99; this.G.go('stage', { custom: this.rooms[0] }); } }
  state() { return { scene: 'visit', rooms: this.rooms?.length ?? 0 }; }
}
