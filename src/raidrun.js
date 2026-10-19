// 타이머 털기 (내 집 지키기·털기 메타, 10/19 — user: "클래시옵클랜처럼 숨기고 공격하는걸… 딱 아 이거구나 싶게",
// "타이머 모드로해야겠구나"). Someone else's room plays against its owner's count: 너굴이's clock, unchanged (a find in a
// combo gives seconds back, a wrong tap takes 2), and no tap limit on top. The clock running out is not a loss — you keep
// what you found. Each find flies into the loot bag at the top and pays at once; the room's 보물 (what's behind its lock,
// else what's inside a drawer) pays more. At the end three stars stamp in, Clash-style: ★ half · ★ the 보물 · ★ everything.
// Not in testing my own room (selfTest) or an art preview. Diagnosis: https://claude.ai/artifact/GP26M9AFDHdPV7GvCFFBcn
import { h, ICON } from './ui.js';
import { ITEMS } from './gfx/items.js';
import { retrieve, canGrab } from './raid.js';
import { lensClear } from './lens.js';

// what a raid pays (a room raided before pays a third). A full clear of 5 things is about what the old win paid (40+15n+…).
export const RAID = { find: 15, treasure: 40, star: 15, back: 20 };
const OFF = (() => { try { return new URLSearchParams(location.search).get('raid') === '0'; } catch { return false; } })();   // ?raid=0: the old visit (no clock, all or nothing) to compare
export const isRaid = S => !OFF && !!(S.custom && !S.custom.selfTest && !S.preview);
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const ownerOf = S => S.custom.nick || S.custom.ownerName || '주인';
const val = (S, v) => Math.max(1, Math.round(v * S.raidRun.rate));

// after buildHud: the 보물, the loot bag, the clock in the top bar
export function raidSetup(S) {
  if (!isRaid(S)) return;
  const G = S.G, key = S.custom.practice ? S.custom.id : S.custom.owner;
  const repeat = !!G.save.visits?.[key]?.ok;
  S.raidRun = { bag: 0, shown: 0, rate: repeat ? 1 / 3 : 1, repeat };
  // the 보물: never one of my own things; behind the room's lock first, then inside a drawer or a lid, else one by the room's seed
  const mine = new Set(S.custom.stolen || []), pool = S.targets.filter(t => !mine.has(t.type)), cand = pool.length ? pool : S.targets;
  const locked = t => t.spot?.part && S.plan.locks.some(l => l.part === t.spot.part);
  const tre = cand.find(locked) || cand.find(t => t.spot?.part) || cand[(S.spec.seed || 0) % cand.length];
  if (tre) { tre.treasure = true; tre.slot?.classList.add('treasure'); tre.slot?.append(h('div', { class: 'tretag' }, '보물')); }
  S.lootPill = G.ui.pill('coin', '0', 'loot');
  S.inv.prepend(S.lootPill);
  S.tlEl.textContent = S.th.name;   // (the tag says 털기 N개; the title says whose house — UI 세션 10/19)
  S.tnum.textContent = String(Math.ceil(S.spec.time));
  S.tbarI.style.width = '100%';
}
export const raidGoal = S => `${ga(ownerOf(S))} ${Math.ceil(S.spec.time)} 셀 동안 털어라!`;
// just before play: the owner starts counting (the bubble over their head is the clock, as with 너굴이)
export function raidStart(S) {
  if (!S.raidRun) return;
  S.timerOn = true;
  if (S.custom.brag && !S.scouted) setTimeout(() => !S.dead && !S.result && S.say(S.friend, S.custom.brag, 1800), 300);
}

// a find: into the bag (it pays now), the number rolls up when it lands
export function raidFind(S, it, s) {
  const G = S.G, R = S.raidRun;
  const v = val(S, it.treasure ? RAID.treasure : RAID.find);
  R.bag += v;
  if (it.treasure) { G.ui.floatText(s.x, s.y - 92, '보물 털었다!', 'gold big'); G.world.fx.ring(s.x, s.y, { r: 130, color: '#ffb300', width: 10 }); G.hitstop?.(.08); }
  else if (S.custom.stolen?.includes(it.type)) G.ui.floatText(s.x, s.y - 92, '내 거 찾았다!', 'gold');
  const pill = S.lootPill;
  G.ui.flyImg(it.thumb || G.thumbs['item_' + it.type], s.x, s.y, pill, { size: 56, dur: 560 }).then(() => {
    if (S.dead) return;
    const from = R.shown; R.shown += v;
    pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop');
    G.ui.floatText(pill.getBoundingClientRect().right + 6, pill.getBoundingClientRect().top + 6, `+${v}`, 'gold');
    G.ui.countUp(pill.querySelector('.v'), from, R.shown, 380, n => { if (n % 5 === 0) G.audio.sfx('coin', 0); });
  });
}

// the end — everything found ('all'), the count ran out ('time') or you stopped ('stop'): what you found is yours
export async function raidSettle(S, why) {
  const G = S.G, W = G.world, R = S.raidRun;
  if (S.result || S.dead) return;
  S.clearTapTimers();
  S.result = 'clear'; S.running = false; S.tEnd = S.t;
  if (G.ui.panelOpen) G.ui.closePanel(true);
  S.paused = false;
  const n = S.targets.length, found = S.targets.filter(t => t.found), all = found.length === n, tre = S.targets.find(t => t.treasure);
  const stars = [found.length * 2 >= n, !!tre?.found, all], starN = stars.filter(Boolean).length;
  S.stars = starN;
  // the moment: the bag is full, or the owner finished counting
  const f = S.friend;
  if (all) { W.fx.confetti(90); G.audio.sfx('win'); S.setMong('happy', 'hop'); }
  else {
    G.audio.sfx('lose');
    f.pose = 'idle'; f.setFace?.('wow'); f.faceTo?.(0, 0); f.bump?.(.4);
    S.say(f, why === 'time' ? '다 셌다! 거기까지~' : '어? 벌써 가?', 1500);
    S.setMong('happy', 'hop');
  }
  G.ui.banner(all ? '몽땅 털었다!' : why === 'time' ? '시간 끝!' : '그만 털기!', all ? (tre ? '보물까지 싹!' : '하나도 안 남겼어!') : `${found.length}개 털었어 · 찾은 만큼 내 거!`, 1100);
  await S.tw.wait(1.3);
  if (S.dead) return;
  // coins: the bag (paid per find) + the stars, sent as they are
  const starCoins = val(S, RAID.star) * starN;
  const res = G.onVisitResult(S.custom, all, found.length, n, R.bag + starCoins, true);
  // my things come back only if found; one thing pocketed from what was found
  const back = retrieve(G, S.custom, found.map(t => t.type));
  let got = null;
  if (found.some(t => !back.includes(t.type)) && canGrab(G, S.custom)) got = await S.pickLoot(back, found);
  if (S.dead) return;
  const lensLine = all && G.econ ? lensClear(S) : null;
  // the panel: three stamps, the loot tally, a total that rolls up
  const starEls = [0, 1, 2].map(() => h('div', { class: 'st', html: ICON.star }));
  const line = (k, sub, v) => h('div', { class: 'lrow' }, h('span', { class: 'k' }, k, sub ? h('small', {}, sub) : ''), h('b', {}, `+${v}`));
  const rows = [line('찾은 물건', `${found.length}/${n}` + (tre?.found ? ' · 보물 포함' : ''), R.bag)];
  if (starN) rows.push(line('별', '★'.repeat(starN), starCoins));
  if (back.length) rows.push(line('되찾은 내 물건', `${back.length}개`, back.length * RAID.back));
  if (got && !got.isNew) rows.push(line('슬쩍 (이미 있음)', ITEMS[got.item]?.name || '', got.coins));
  const total = R.bag + starCoins + back.length * RAID.back + (got?.coins || 0);
  const cv = h('span', {}, '0');
  const left = S.custom.stolen?.filter(t => !back.includes(t)) || [];
  const p = G.ui.panel({
    title: all ? '몽땅 털었다!' : '털기 끝!', color: all ? 'green' : 'orange', cls: 'raidend',
    body: [h('div', { class: 'stars' }, ...starEls),
      h('div', { class: 'starwhy' }, ...['★ 절반', '★ 보물', '★ 전부'].map((t, i) => h('span', { class: stars[i] ? 'on' : '' }, t))),
      h('div', { class: 'loottab' }, ...rows),
      h('div', { class: 'reward', html: ICON.coin }, cv),
      ...(R.repeat ? [h('div', { class: 'txt' }, '전에 몽땅 턴 집이라 ⅓만 나와요')] : []),
      ...(lensLine ? [h('div', { class: 'txt lensline' }, lensLine)] : []),
      ...(left.length ? [h('div', { class: 'txt' }, `아직 ${ga(ownerOf(S))} 내 물건 ${left.length}개를 갖고 있어. 다시 털러 오자!`)] : []),
      ...(got ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['item_' + got.item] }), h('div', {}, h('b', {}, '슬쩍 챙김!'), h('div', {}, ITEMS[got.item]?.name || '')))] : []),
      ...(got && S.custom.resident ? [h('div', { class: 'txt' }, `${ga(S.custom.nick)} 복수하러 올지도!`)] : [])],
    buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
      S.nextBtn = G.ui.btn('다른 집', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('visit') })],
  });
  for (let i = 0; i < 3; i++) {
    await S.tw.wait(.34); if (S.dead) return;
    if (stars[i]) { starEls[i].classList.add('on', 'stamp'); G.audio.sfx('star', i); }
  }
  await S.tw.wait(.15); if (S.dead) return;
  G.ui.countUp(cv, 0, total, 800, v => { if (v % 10 === 0) G.audio.sfx('coin', 0); });
  return { res, p };
}

// ── ② 정찰 + 다음 집 (Clash's scout screen): tapping a house on the list shows the room first — slowly turning, its things
// put away (the scout shows the place, never the answers), the clock not running — with what you could take home:
// the 보물, my own things they hold, how many NEW things there are to pocket, the most coins it can pay.
// [털러 가기] starts the raid right here (no reload); [다음 집] opens the next house on the list; [목록] goes back.
let LIST = [];
export const setScoutList = rooms => { LIST = rooms || []; };
const sameRoom = (a, b) => a === b || (a.practice ? a.id === b.id : a.owner && a.owner === b.owner);
export function raidScout(S) {
  const G = S.G, W = G.world, ui = G.ui, R = S.raidRun, C = S.custom;
  if (G.bot || !R) return Promise.resolve(true);
  S.scouted = true;
  const shown = S.items.filter(it => it.g.visible); for (const it of shown) it.g.visible = false;
  S.col.style.visibility = 'hidden';
  const press = W.onPress; W.onPress = null;
  const v0 = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom }, joy0 = W.joyHidden;
  W.joyHidden = true;   // (the zoom gauge and the turn dial wait too)
  // pulled back and lifted a little, so the whole room turns above the card
  const lift = W.target.clone(); lift.y -= .9;
  W.flyTo(S.tw, { zoom: v0.zoom * .82, target: lift, dur: .5 }).then(() => { if (!S.dead && !done) W.autoSpin = .28; });
  W.shadowDirty = true;
  let done = false;
  setTimeout(() => !S.dead && S.scouted && C.brag && S.say(S.friend, C.brag, 2400), 500);
  // what it can pay: every find (보물 more), all three stars, my own things back
  const mine = (C.stolen || []).filter(t => S.targets.some(x => x.type === t));
  const tre = S.targets.find(t => t.treasure), n = S.targets.length;
  const max = S.targets.reduce((a, t) => a + val(S, t.treasure ? RAID.treasure : RAID.find), 0) + val(S, RAID.star) * 3 + mine.length * RAID.back;
  const have = new Set(G.save.collection);
  const news = [...new Set(S.targets.map(t => t.type))].filter(t => !mine.includes(t) && !have.has(t) && ITEMS[t] && !ITEMS[t].decoy);
  const grabOk = canGrab(G, C);
  const tile = (src, tag, cls) => h('div', { class: 'stile ' + cls }, h('img', { src }), h('div', { class: 'stag' }, tag));   // (no line under: the tag says it — UI 세션 10/19)
  const tiles = [];
  if (tre) tiles.push(tile(tre.thumb || G.thumbs['item_' + tre.type], '보물', 'tre'));
  for (const t of mine.slice(0, 3)) tiles.push(tile(G.thumbs['item_' + t], '내 거', 'mine'));
  if (news.length) tiles.push(h('div', { class: 'stile new' + (grabOk ? '' : ' off') }, h('b', { class: 'ol' }, String(news.length)), h('div', { class: 'stag' }, 'NEW')));
  const facts = [`시간 ${Math.ceil(S.spec.time)}초`, `물건 ${n}개`, ...(S.plan.locks.length ? [`자물쇠 ${S.plan.locks.length}`] : []), ...(R.repeat ? ['전에 몽땅 턴 집 · ⅓'] : [])];
  const i = LIST.findIndex(r => sameRoom(r, C)), next = LIST.length > 1 ? LIST[(i + 1) % LIST.length] : null;
  return new Promise(res => {
    const end = go => { if (done) return; done = true; wrap.remove(); if (go) start(); res(go); };
    const start = () => {
      W.autoSpin = 0; W.onPress = press; W.joyHidden = joy0;
      for (const it of shown) it.g.visible = true;
      S.col.style.visibility = '';
      W.flyTo(S.tw, { yaw: v0.yaw, pitch: v0.pitch, zoom: v0.zoom, target: W.home, dur: .45 });
      W.shadowDirty = true;
    };
    const card = h('div', { class: 'panel scout' },
      h('div', { class: 'ribbon purple ol3' }, '정찰'),
      h('div', { class: 'shead' }, h('img', { src: G.thumbs['face_' + (C.face || S.th.friend)] || G.thumbs.face_mong }), h('div', {}, h('div', { class: 'sname' }, S.th.name), h('div', { class: 'sfacts' }, facts.join(' · ')))),
      h('div', { class: 'slabel' }, '가져올 수 있는 것'),
      h('div', { class: 'stiles' }, ...tiles),
      h('div', { class: 'reward smax', html: ICON.coin }, h('span', {}, `최대 ${max}`)),
      h('div', { class: 'row' },
        ui.btn('목록', { color: 'gray', cls: 'sm', onClick: () => { end(false); G.go('visit'); } }),
        ...(next ? [ui.btn('다음 집', { color: 'blue', cls: 'sm', onClick: () => { end(false); G.go('stage', { custom: next, scout: true }); } })] : []),
        ui.btn('털러 가기', { color: 'green', icon: 'play', cls: 'big', onClick: () => end(true) })));
    const wrap = h('div', { class: 'scoutwrap' }, card);
    ui.hud.append(wrap);
  });
}
