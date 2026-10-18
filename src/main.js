// 숨바꼭집 — boot, scene flow, save, game loop, debug/bot contract (window.__jam).
import * as THREE from 'three';
import { World, QUALITY, hasWebGL2, OPT } from './world.js';
import { hapticLight } from './feel.js';
import { UI } from './ui.js';
import { purgeGeo } from './gfx/kit.js';
import { createAudio } from './audio.js';
import { store, qs } from './util.js';
import { renderThumbs, thumbCtx } from './thumbs.js';
import { useCartoonStyle } from './gfx/style.js';
import { ITEMS, buildItem } from './gfx/items.js';
import { makeFurniture, FURN_INFO, registerFurniture } from './gfx/furniture.js';
import { OUTDOOR_BUILDERS, OUTDOOR_INFO, groundTex, boundary } from './gfx/outdoor.js';
import { setOutdoorKit } from './room.js';
import { ensureStoryItems } from './story.js';
import { STORY_BUILDERS, STORY_INFO, STORY_ITEMS } from './gfx/story-props.js';
import { MAP_BUILDERS, MAP_INFO, MAP_THEMES } from './gfx/map-props.js';
import { HOUSE_BUILDERS, HOUSE_INFO } from './gfx/house-props.js';
import { FISH_BUILDERS, FISH_INFO } from './gfx/fishing-props.js';
import { SKATE_BUILDERS, SKATE_INFO } from './gfx/skate-props.js';
import { KPOP_BUILDERS, KPOP_INFO } from './gfx/kpop-props.js';
import { MAZE_BUILDERS, MAZE_INFO } from './gfx/maze-props.js';
import { MUSEUM_BUILDERS, MUSEUM_INFO } from './gfx/museum-props.js';
import { SHOWCASE_BUILDERS, SHOWCASE_INFO } from './gfx/showcase-props.js';
import { DEVICE_BUILDERS, DEVICE_INFO, DEVICE_ITEMS } from './gfx/device-props.js';
import { TOWN_BUILDERS, TOWN_INFO } from './gfx/town-props.js';
import { APT_BUILDERS, APT_INFO, APT_THEMES, APT_ITEMS } from './gfx/apt-props.js';
import { loadTune } from './tune.js';
import { STREET_BUILDERS, STREET_INFO, STREET_THEMES, STREET_ITEMS } from './gfx/street-props.js';
import { SHOP_BUILDERS, SHOP_INFO, SHOP_THEMES, SHOP_ITEMS } from './gfx/shop-props.js';
import { BUILDING_BUILDERS, BUILDING_INFO, BUILDING_THEMES, BUILDING_ITEMS } from './gfx/building-props.js';
import { TRAIL_BUILDERS, TRAIL_INFO, TRAIL_THEMES, TRAIL_ITEMS } from './gfx/trail-props.js';
import { ONEROOM_BUILDERS, ONEROOM_INFO, ONEROOM_THEMES, ONEROOM_ITEMS } from './gfx/oneroom-props.js';
import { PLAYGROUND_BUILDERS, PLAYGROUND_INFO, PLAYGROUND_THEMES, PLAYGROUND_ITEMS } from './gfx/playground-props.js';
import { addHomeStyle } from './catalog.js';
import { KIT_ITEMS, KIT_BUILDERS, KIT_INFO } from './gfx/modelkit-props.js';
import { Char, CHAR_DEFS } from './gfx/chars.js';
import { THEMES, LAYOUTS, STAGE_COUNT } from './stages.js';
import { HOME_ZONES, STARTER, STARTER_ITEMS, registerOutdoorShop, registerStoryShop } from './catalog.js';
import { runRaids } from './raid.js';
import { recordPlay, net } from './net.js';
import { HomeScene } from './scenes/home.js';
import { StageScene } from './scenes/stage.js';
import { MyHomeScene } from './scenes/myhome.js';
import { VisitScene } from './scenes/visit.js';
import { BossScene } from './scenes/boss.js';
import { MiniScene } from './scenes/mini.js';
import { BossGameScene } from './scenes/bossgame.js';
import { LayEditScene } from './scenes/layedit.js';
import { LobbyScene } from './scenes/lobby.js';
import { ECON, econMigrate, econSaveFields } from './econ.js';
import { installI18n, i18nMisses, LANG, setLang } from './i18n.js';
import { openGallery, playGame } from './gallery.js';
installI18n();   // English players see English everywhere (see i18n.js)

// outdoor props (alley / park / camp) join the furniture registry, the room shell and the shop
registerFurniture(OUTDOOR_BUILDERS, OUTDOOR_INFO);
registerFurniture(STORY_BUILDERS, STORY_INFO);
registerFurniture(MAP_BUILDERS, MAP_INFO);
for (const k in MAP_THEMES) THEMES[k] = { ...THEMES.my, ...MAP_THEMES[k] };
registerStoryShop(Object.fromEntries(Object.entries(MAP_INFO).filter(([k]) => k !== 'stairsup')));
Object.assign(ITEMS, STORY_ITEMS);
// the everyday apartment set (art direction 2026-10-15): props, items, rooms with a warm afternoon light
registerFurniture(APT_BUILDERS, APT_INFO);
registerFurniture(HOUSE_BUILDERS, HOUSE_INFO);
registerFurniture(FISH_BUILDERS, FISH_INFO);
registerFurniture(SKATE_BUILDERS, SKATE_INFO);
registerFurniture(KPOP_BUILDERS, KPOP_INFO);
registerFurniture(MAZE_BUILDERS, MAZE_INFO);
registerFurniture(MUSEUM_BUILDERS, MUSEUM_INFO);
registerFurniture(SHOWCASE_BUILDERS, SHOWCASE_INFO);
registerFurniture(DEVICE_BUILDERS, DEVICE_INFO); Object.assign(ITEMS, DEVICE_ITEMS);   // R6 장치판
registerFurniture(TOWN_BUILDERS, TOWN_INFO);
// 프라모델 조립판 (modelkit.js): the kit's pieces are things to find; the finished model is furniture you get, not one you buy
registerFurniture(KIT_BUILDERS, KIT_INFO); Object.assign(ITEMS, KIT_ITEMS);
Object.assign(ITEMS, APT_ITEMS);
const WARM = { ambColor: '#ffeedd', amb: 1.5, sunColor: '#fff4e0', sun: 2.3 };
for (const k in APT_THEMES) THEMES[k] = { ...THEMES.my, ...APT_THEMES[k], friend: 'bunny', light: WARM, pool: ['remote', 'slipper', 'mandarin', 'gamepad', 'tissue', 'cookie', 'milk', 'sock'] };
registerStoryShop(APT_INFO);
registerFurniture(STREET_BUILDERS, STREET_INFO);
Object.assign(ITEMS, STREET_ITEMS);
for (const k in STREET_THEMES) THEMES[k] = { ...THEMES.my, ...STREET_THEMES[k], friend: 'shiba', pool: ['bubbletea', 'kimbap', 'onigiri', 'fishcake', 'umbrella', 'cookie', 'milk', 'sock'] };
// the corner's sidewalk is warm light paving (the road is its own darker zone), so the street reads bright
Object.assign(THEMES.street, { floorKind: 'brickpave', floor: '#ecd6b8', floor2: '#dcbd98', pave: '#efcfac',
  light: { ambColor: '#fff2e4', amb: 1.6, sunColor: '#fff6e8', sun: 2.45 } });   // bright afternoon (the dusk light read as too dark)
registerStoryShop(STREET_INFO);
// 편의점·빨래방·카페 (region 4): shop interiors, also wearable as a home theme
registerFurniture(SHOP_BUILDERS, SHOP_INFO);
Object.assign(ITEMS, SHOP_ITEMS);
const SHOP_POOL = ['receipt', 'sandwich', 'sockpair', 'coffee', 'lottery', 'onigiri', 'bubbletea', 'kimbap'];
for (const k in SHOP_THEMES) THEMES[k] = { ...THEMES.my, ...SHOP_THEMES[k], friend: k === 'konbini' ? 'shiba' : 'sundae', light: WARM, pool: SHOP_POOL };
THEMES.shopmap = { ...THEMES.konbini, name: '편의점과 빨래방' };
registerStoryShop(SHOP_INFO);
addHomeStyle({ id: 'st-cafe', name: '동네 카페', indoor: true, theme: 'cafe', price: 450, bleed: true, sw: ['#e4b47e', '#7fbf8f'] });
// 빌딩 (region 7): the lobby and the rooftop
registerFurniture(BUILDING_BUILDERS, BUILDING_INFO);
Object.assign(ITEMS, BUILDING_ITEMS);
const BLD_POOL = ['idcard', 'usb', 'stapler', 'sunglasses', 'postit', 'coffee', 'receipt', 'remote'];
for (const k in BUILDING_THEMES) THEMES[k] = { ...THEMES.my, ...BUILDING_THEMES[k], friend: k === 'lobby' ? 'nerd' : 'robot', pool: BLD_POOL };
// 둠칫이의 K-POP 무대 (must-have theme, 10/17): the plaza in front of the building at dusk — rooftop paving in pinks
// 곰돌이의 몽글 미술관 (homage stage, 10/17): warm white walls, honey parquet, a lavender dado
THEMES.museum = { ...THEMES.my, name: '곰돌이의 몽글 미술관', friend: 'bear', bg: ['#f3e6ea', '#e9dff2'], floorKind: 'planks', floor: '#c98f5a', floor2: '#b07a48',
  wallKind: 'plain', wall: '#8a3352', wall2: '#7a2c48', wainscot: '#4a2236', trim: '#e2b24e', wallEdge: '#f3d9a0', rug: '#c8324a', rug2: '#ffd36e' };   // a gallery: wine walls, gold trim, warm parquet (10/17 redo: "미술관 구려")
THEMES.kpop = { ...THEMES.rooftop, name: '둠칫이의 K-POP 무대', friend: 'dj', bg: ['#f1e4ff', '#ffe2ef'], base: '#c4b6d6', floor: '#efdcea', floor2: '#dcc4da', pave: '#f2d4e2',
  plaster: '#f4ecf6', brick: '#b98bd0', roofTile: '#ff7fb0', fence: '#e9dcf5', pool: ['sunglasses', 'earphones', 'bubbletea', 'juicebox', 'postit', 'coffee', 'receipt', 'idcard'] };
THEMES.lobbymap = { ...THEMES.lobby, name: '빌딩 로비와 사무실' };
registerStoryShop(BUILDING_INFO);
// 원룸 (region 2 and a home theme)
registerFurniture(ONEROOM_BUILDERS, ONEROOM_INFO);
Object.assign(ITEMS, ONEROOM_ITEMS);
for (const k in ONEROOM_THEMES) THEMES[k] = { ...THEMES.my, ...ONEROOM_THEMES[k], friend: 'hamster', light: WARM, pool: ['earphones', 'ramen', 'keyring', 'toothbrush', 'coin', 'remote', 'slipper', 'mandarin'] };
registerStoryShop(ONEROOM_INFO);
addHomeStyle({ id: 'st-oneroom', name: '나의 원룸', indoor: true, theme: 'oneroom', price: 350, bleed: true, sw: ['#e9e2d6', '#f4c58e'] });
// 단지 놀이터 (concept I, region 5)
registerFurniture(PLAYGROUND_BUILDERS, PLAYGROUND_INFO);
Object.assign(ITEMS, PLAYGROUND_ITEMS);
for (const k in PLAYGROUND_THEMES) THEMES[k] = { ...THEMES.my, ...PLAYGROUND_THEMES[k], friend: 'frog', pave: '#eedcc0', pool: ['shovel', 'ball2', 'rubberduck2', 'juicebox', 'hairpin', 'acorn', 'bubbletea', 'sock'] };
registerStoryShop(PLAYGROUND_INFO);
addHomeStyle({ id: 'st-playground', name: '단지 놀이터', indoor: false, theme: 'playground', price: 450, bleed: true, walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, sw: ['#eedcc0', '#e8564a'] });
// 산길 (region 6)
registerFurniture(TRAIL_BUILDERS, TRAIL_INFO);
Object.assign(ITEMS, TRAIL_ITEMS);
for (const k in TRAIL_THEMES) THEMES[k] = { ...THEMES.my, ...TRAIL_THEMES[k], friend: 'panda', pool: ['acorn', 'gimbap2', 'towel', 'whistle', 'map', 'bubbletea', 'onigiri', 'sock'] };
registerStoryShop(TRAIL_INFO);
addHomeStyle({ id: 'st-trail', name: '산길 마당', indoor: false, theme: 'trail', price: 450, bleed: true, walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, sw: ['#b99a78', '#5f9a5a'] });
addHomeStyle({ id: 'st-rooftop', name: '빌딩 옥상', indoor: false, theme: 'rooftop', price: 500, bleed: true, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' }, sw: ['#e8dccb', '#7f93c9'] });
addHomeStyle({ id: 'st-konbini', name: '편의점', indoor: true, theme: 'konbini', price: 450, bleed: true, sw: ['#fdfdfb', '#a9dccb'] });
addHomeStyle({ id: 'st-lobby', name: '빌딩 로비', indoor: true, theme: 'lobby', price: 500, bleed: true, sw: ['#eef2f6', '#7f93c9'] });
addHomeStyle({ id: 'st-laundry', name: '빨래방', indoor: true, theme: 'laundry', price: 400, bleed: true, sw: ['#e9f6ff', '#8fc6e8'] });
// the living room floor a deeper honey than the furniture wood, so boards and furniture don't melt together
Object.assign(THEMES.apt, { floor: '#dea366', floor2: '#a86d3c', bg: ['#fff6e6', '#ffe9cc'] });
THEMES.aptmap = { ...THEMES.apt, name: '우리 아파트 투룸' };
ensureStoryItems(ITEMS);
registerStoryShop(STORY_INFO);
setOutdoorKit({ groundTex, boundary });
registerOutdoorShop(OUTDOOR_INFO);

const KEY = 'sumbakkokjip.v1';
// (경제·로비 on: 몽글이's room starts as a rug and 몽글이, nothing else — 설계서 2-2)
const starterOf = id => ECON && id === 'room1' ? STARTER[id].filter(f => f.type === 'rug') : STARTER[id] || [];
const newZone = id => { const z = HOME_ZONES.find(x => x.id === id); return { id, type: z.type, name: z.name, ...(z.type === 'room' ? { style: 'st-open' } : {}), furniture: starterOf(id).map((f, i) => ({ ...f, id: id + '-' + i })), paint: {} }; };
const defaultHome = () => ({ zones: { room1: newZone('room1') }, current: 'room1', inventory: ECON ? [] : ['wardrobe'], bought: [], owned: { wall: [], floor: [] }, hide: { zoneId: 'room1', items: [], locks: {}, code: null }, published: null, claimedFails: 0 });
const defaultSave = () => econSaveFields({ v: 2, stage: 0, best: {}, coins: 150, stars: 0, home: defaultHome(), collection: STARTER_ITEMS.slice(), visits: {} });
// v1 (with the old Mom-inspection room) → v2: keep coins, progress and the furniture you placed
function migrate(s) {
  if (!s) return defaultSave();
  if (s.v === 2) return s;
  const n = defaultSave();
  n.stage = s.stage || 0; n.best = s.best || {}; n.coins = s.coins ?? 150; n.stars = s.stars || 0;
  if (s.myroom?.furniture) n.home.zones.room1.furniture = s.myroom.furniture.map(f => ({ type: f.type, i: f.i, j: f.j, rot: f.rot || 0, id: f.id }));
  if (s.myroom?.inventory) n.home.inventory = s.myroom.inventory.slice();
  return n;
}
if (qs.has('reset')) store.del(KEY);
// progress also rides in the page address (#s=…) on the web copy: a tab Safari reloads after a crash, a bookmark, or a
// browser that keeps no storage (in-app browsers, private tabs, blocked cookies) still continue where you were
// (user, 10/18: "웹 버전 내가 한 곳까지 기억해 주는 것도 가능? 계속 첫 판부터 하고 있음")
const WEB = !window.claude;
const b64e = str => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = str => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
const hashSave = (() => { if (!WEB || qs.has('reset')) return null; try { const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash); return m ? JSON.parse(b64d(m[1])) : null; } catch { return null; } })();
const storageOk = (() => { try { localStorage.setItem('sumbakkokjip.t', '1'); return localStorage.getItem('sumbakkokjip.t') === '1'; } catch { return false; } })();
try { navigator.storage?.persist?.(); } catch {}   // ask the browser to keep this site's storage
let stored = store.get(KEY, null);
// which copy is newer: every save carries a revision (GPT QA 10/18 P1: an old bookmark with more coins rolled back later
// purchases, furniture and collection) — the address only wins when it is newer, or when there is nothing in storage
if (hashSave && (!stored || (hashSave.rev || 0) > (stored.rev || 0))) stored = hashSave;
let save = econMigrate(migrate(stored));   // (경제·로비: new fields only, and only with it on — coins, stages, stars, furniture untouched)
// 처음 하는 사람 (기획안 7장 '처음 20분', 사용자 10/18 밤 승인): 저장이 하나도 없으면 타이틀 다음 바로 1판으로 간다. 홈은
// 2판 뒤 '내 집 열림'과 함께 처음 본다. (주소의 #s= 저장도 stored에 들어 있으니, 그걸로 이어 하는 사람은 처음이 아니다)
const firstRun = !stored;
let hashT = 0;
const saveToHash = () => { if (!WEB) return; clearTimeout(hashT); hashT = setTimeout(() => { try { history.replaceState(null, '', location.pathname + location.search + '#s=' + b64e(JSON.stringify(save))); } catch {} }, 400); };

// locked cartoon art direction (?style=std shows the original soft render for comparison)
if (qs.get('style') !== 'std') useCartoonStyle();
const audio = createAudio();
// the turn ratchet and the move ⇄ turn latch (10/18, user: "회전할 때 ㄷ드드드득 … asmr과 아주 약한 햅틱", "이동하면서 톡 할 때도
// 효과음과 햅틱으로 알려 주는 거지") — world.js calls these; the latch's buzz is world.js's own haptic()
const ratchetFx = buzz => { audio.sfx('ratchet'); if (buzz) hapticLight(); };
if (!hasWebGL2()) {
  const b = document.querySelector('#boot .boot-load') || document.getElementById('boot');
  b.innerHTML = '<div class="boot-sub">이 폰의 브라우저는 3D 그림(WebGL2)을 지원하지 않아요.<br>최신 크롬이나 사파리에서 열어 주세요.</div>';
  throw new Error('WebGL2 not supported');
}
const world = new World(document.getElementById('gl'), document.getElementById('fx'));
world.ratchet = ratchetFx; world.switchFx = m => audio.sfx(m === 'turn' ? 'gearUp' : 'gearDown');
if (window.SBK_PERF_TEST || qs.get('hud') === '1') import('./perfhud.js').then(m => m.installPerfHud(world)).catch(e => console.error(e));
// weaker phones (few cores or little memory) start a couple of steps down the quality ladder; it adapts from there
// (Safari under-reports CPU cores, so only a reported small memory counts — that is Android Chrome on a low-end phone)
const weak = (navigator.deviceMemory || 8) <= 3;
world.setLevel(weak ? 2 : 0);
loadTune(world);   // the look the user set in the 세팅 panel, kept on this device
const ui = new UI(audio);

const G = {
  world, ui, audio, save, thumbs: {}, scene: null, econ: ECON, pending: null, bot: qs.has('bot'), botMode: qs.get('bot') === 'random' ? 'random' : 'smart', botErr: +(qs.get('err') ?? .25),
  timeScaleUser: 1, fast: +(qs.get('fast') || 1), hitstopUntil: 0, coinPills: [],
  stats: { cleared: 0, fails: 0, levelSecs: [], log: [], visits: 0, stageStart: 0 },
  // (practice runs from 놀이 모음 never reach storage: a reload mid-practice keeps the real save — GPT QA 10/18 P2)
  persist() { if (G.playMode) return; save.rev = (save.rev || 0) + 1; store.set(KEY, save); saveToHash(); },
  storageOk,
  firstRun,   // (this session started with no save at all — see boot)
  setBg([a, b]) { const app = document.getElementById('app'); app.style.setProperty('--bgA', a); app.style.setProperty('--bgB', b); },
  hitstop(sec) { G.hitstopUntil = performance.now() + sec * 1000; },
  makeFurniture: t => makeFurniture(t, THEMES.my),
  addCoins(n, anim = true) {
    const from = save.coins; save.coins = Math.max(0, save.coins + n); G.persist();
    for (const p of G.coinPills) { if (!p.isConnected) continue; const v = p.querySelector('.v'); if (anim) ui.countUp(v, from, save.coins, 500); else v.textContent = save.coins; p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
  },
  homeOpen: () => (save.stage || 0) >= 2 || qs.get('scene') === 'myhome',
  zoneOpen(id) { const z = HOME_ZONES.find(x => x.id === id); if (!z) return false; return (save.stage || 0) >= z.unlock.stage || save.home.bought.includes(id); },
  ensureZone(id) { if (!save.home.zones[id]) save.home.zones[id] = newZone(id); return save.home.zones[id]; },
  collect(type) { if (!ITEMS[type] || ITEMS[type].decoy || ITEMS[type].noCollect || save.collection.includes(type)) return false; save.collection.push(type); G.persist(); return true; },
  onStageClear(idx, stars, coins) {
    const out = {};
    save.best[idx] = Math.max(save.best[idx] || 0, stars);
    save.stars = Object.values(save.best).reduce((a, b) => a + b, 0);
    const before = save.stage || 0;
    out.firstClear = idx + 1 > before;
    // a stage you'd already cleared pays a third (레벨 세션 B5: no farming one stage over and over)
    if (!out.firstClear) { coins = Math.round(coins / 3); out.repeat = true; }
    save.coins += coins; out.awarded = coins;
    save.stage = Math.max(before, idx + 1);
    if (before < 2 && save.stage >= 2) out.unlockedHome = true;
    if (before < STAGE_COUNT && save.stage >= STAGE_COUNT) out.allClear = true;
    out.newZones = HOME_ZONES.filter(z => z.unlock.stage > before && z.unlock.stage <= save.stage && z.unlock.stage > 0 && !save.home.bought.includes(z.id)).map(z => { G.ensureZone(z.id); return z.name; });
    G.persist();
    G.stats.cleared++; const secs = (gameTime - G.stats.stageStart); G.stats.levelSecs.push(secs); G.stats.log.push({ stage: idx + 1, result: 'clear', stars, secs: +secs.toFixed(1) });
    return out;
  },
  onStageFail(idx) { G.stats.fails++; G.stats.log.push({ stage: idx + 1, result: 'fail', secs: +(gameTime - G.stats.stageStart).toFixed(1) }); },
  onVisitResult(room, ok, found, total, coins) {
    if (room.selfTest) return { awarded: 0, selfTest: true };
    const key = room.practice ? room.id : room.owner;
    const prev = save.visits[key];
    const firstWin = ok && !prev?.ok;
    save.visits[key] = { ok: ok || !!prev?.ok, at: Date.now() };
    const awarded = ok ? (firstWin ? coins : Math.round(coins / 3)) : 0;
    save.coins += awarded;
    G.persist();
    if (!room.practice) recordPlay(room.owner, { found, total, ok });
    G.stats.visits++; G.stats.log.push({ visit: key, result: ok ? 'clear' : 'fail' });
    return { awarded, repeat: ok && !firstWin };
  },
  async go(name, data = {}) {
    if (G.pending) return;
    // 놀이 모음 practice: going on to a stage or home ends it — the save goes back to how it was, and the list opens again
    // (QA 10/18: also 내 집 / 놀러 가기 — the ending's "hide at home" took the practice save there; and the real save comes back
    // only after the practice scene has gone, so a game that ends during the iris can't pay into it)
    const endPractice = G.playMode && !['bossgame', 'mini', 'boss'].includes(name);
    if (endPractice) { name = 'home'; data = { gallery: true }; }
    G.pending = name;
    audio.sfx('whoosh');
    await ui.irisOut();
    G.scene?.exit();
    G.scene = null;
    if (endPractice) {
      const snap = JSON.parse(G.playMode.snap); for (const k of Object.keys(save)) delete save[k]; Object.assign(save, snap);
      G.playMode = null;   // (nothing to write: practice never persisted)
      // the practice link (?play=…&lv=…) leaves the address too: a reload (iOS drops big tabs) went back into practice (QA 10/18)
      if (WEB && /[?&]play=/.test(location.search)) { const u = new URLSearchParams(location.search); u.delete('play'); u.delete('lv'); try { history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '') + location.hash); } catch {} }
    }
    world.vYaw = 0; world.yawGoal = null; world.snap = !!save.settings?.snap; world.clearTap(); settleUntil = performance.now() + 5000;
    const S = new SCENES[name](G);
    G.scene = S;
    G.stats.stageStart = gameTime;
    world.gaugeOn = name === 'stage' || name === 'boss';   // the zoom gauge only where you search (my home has its own cards and buttons)
    document.getElementById('app').dataset.scene = name;   // style.css shrinks the play HUD on stage/boss
    world.joyHidden = name === 'home' || name === 'visit';   // the home screen just sways and the visit list is a list: nothing to turn there
    const p = S.enter(data);
    purgeGeo();   // free cached shapes the last two scenes didn't use (memory on phones)
    world.update(0); world.shadowDirty = true; world.idsDirty = true;
    G.pending = null;
    await ui.irisIn();
    await p;
    if (name === 'home' && data.gallery && G.scene === S) openGallery(G);
  },
  // 놀이 모음: play a boss or 쉬어가기 on its own (a copy of the save is kept and put back afterwards — see go)
  startPlay() { if (!G.playMode) G.playMode = { snap: JSON.stringify(save) }; },
};
// make sure every zone that is already open exists in the save
for (const z of HOME_ZONES) if (G.zoneOpen(z.id)) G.ensureZone(z.id);
window.G = G;
// 배치 편집 is the author's tool: shown to the artifact's owner only (and always when running outside claude.ai)
G.owner = false;
G.ownerP = (async () => { try { if (!window.claude?.use) return (G.owner = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || qs.has('owner')); const u = await window.claude.use('user'); return (G.owner = !!(await u?.isOwner?.())); } catch { return false; } })();   // the public web copy (GitHub Pages) shows no author tools
// 경제·로비 on: home (the first screen) is 몽글이's room, and 내 집 goes there too; the neighbourhood is 더보기 → 동네 구경
const SCENES = { home: ECON ? LobbyScene : HomeScene, town: HomeScene, stage: StageScene, myhome: ECON ? LobbyScene : MyHomeScene, visit: VisitScene, boss: BossScene, mini: MiniScene, bossgame: BossGameScene, layedit: LayEditScene };

// ── 3D icons
async function bgFurnThumbs() {
  if (!G.furnJobs?.size) return;
  const C = thumbCtx(160);
  try {
    while (G.furnJobs.size) {
      // only on the home screen: never while a stage is being played (on a phone this ran under stage 1)
      if (G.scene?.name !== 'home' || G.pending) { await new Promise(r => setTimeout(r, 1500)); continue; }
      let n = 0;
      for (const [k, j] of G.furnJobs) { G.thumbStore[k] = C.one(j); G.furnJobs.delete(k); if (++n >= 8) break; }
      await new Promise(r => setTimeout(r, 60));
    }
  } finally { C.done(); }
}
function buildThumbs() {
  const jobs = [];
  for (const k in ITEMS) if (!ITEMS[k].noThumb) jobs.push({ key: 'item_' + k, build: () => buildItem(k, { code: '★★★' }), dir: ITEMS[k].flat ? [.25, 1.3, .7] : [.45, .55, 1], fit: ITEMS[k].flat ? 1.05 : 1.0 });
  for (let k = 0; k < 4; k++) jobs.push({ key: 'sock_' + k, build: () => buildItem('sockp', { code: String(k) }), dir: [.25, 1.3, .7], fit: 1.05 });   // the pair-sock patterns
  // furniture icons (~200) are not needed to start: drawn a few at a time once the home is up (bgFurnThumbs), or all at
  // once the moment something asks for one first (the shop, 배치 편집, a 흑백판's furniture targets) — boot was 3+ s of icons
  const furnJobs = new Map();
  for (const k in FURN_INFO) if (!FURN_INFO[k].wall && !FURN_INFO[k].hidden) furnJobs.set('furn_' + k, { key: 'furn_' + k, build: () => makeFurniture(k, THEMES.my).group, dir: [.75, .7, 1], fit: 1.0 });
  G.furnJobs = furnJobs;
  // face icons: framed on the face, grown upwards for anyone whose ears or hat stand taller, so the whole head fits and
  // every frame can keep an even margin round it (user, 10/17: "틀 안에 가둘 때 마진 잘 지켜줘")
  const face = (k, f, key) => {
    const c0 = new Char(k); c0.update(0); c0.shadow.visible = false;
    const S = c0.S, top = new THREE.Box3().setFromObject(c0.root, true).max.y, K = 1.18 * 1.08;
    const r0 = S * (k === 'mom' ? .56 : .5), cy0 = S * (k === 'mom' ? .42 : .36), bot = cy0 - r0 * K, tp = Math.max(cy0 + r0 * K, top + S * .06);
    jobs.push({ key, build: () => { const c = new Char(k); c.setFace(f); c.update(0); c.shadow.visible = false; return c.root; }, dir: [0, .1, 1], center: [0, (bot + tp) / 2, 0], radius: (tp - bot) / 2 / K });
  };
  face('mong', 'normal', 'face_mong'); face('mong', 'happy', 'face_mong_happy'); face('mong', 'wow', 'face_mong_wow'); face('mong', 'dizzy', 'face_mong_dizzy'); face('mong', 'sweat', 'face_mong_sweat');
  for (const k in CHAR_DEFS) if (!['mong', 'mom'].includes(k)) face(k, 'normal', 'face_' + k);
  const store = renderThumbs(jobs, 160);
  // a furniture icon not drawn yet is drawn when asked for — just that one. (It used to draw every remaining piece, ~200,
  // in one go: 2+ s frozen and +140 MB, which is what reloaded the page on an iPhone 13 mini at stage 3 — the 흑백판
  // museum asks for its furniture targets' icons. user, 10/18: "아이폰13미니에서 3판 하면 튕긴다")
  G.thumbs = new Proxy(store, { get(t, k) {
    if (typeof k === 'string' && !(k in t) && G.furnJobs?.has(k)) G.needThumbs([k]);
    return t[k];
  } });
  // draw the given furniture icons that are still missing, in one batch (a grid that shows many asks for them all first)
  G.needThumbs = keys => {
    const jobs = keys.map(k => G.furnJobs?.get(k)).filter(Boolean);
    if (!jobs.length) return;
    for (const j of jobs) G.furnJobs.delete(j.key);
    Object.assign(store, renderThumbs(jobs, 160));
  };
  G.hasThumb = k => k in store || !!G.furnJobs?.has(k);   // there is (or can be) an icon, without drawing it
  G.thumbStore = store;
  // default (D): one finger turns around the pressed spot, the pad moves, the gauge or a pinch zooms; B and C are options
  { const S = G.save.settings || (G.save.settings = {}); if (!S.ctrlV4) { S.ctrlV4 = 1; delete S.ctrl; delete S.joy; G.persist(); } }   // 2026-10-17: everyone to the new default once
  // 2026-10-18 (user, after the feel lab: "원래 톡이랑 이거랑 두 가지만 남기고 이동 패드랑 나머지 카메라 옵션은 없어도 될 거 같아.
  // 지금 만든 게 기본으로"): F (one finger moves, the turn dial or a two-finger twist turns) is the default for everyone once;
  // E (a second-finger tap turns) is the only other choice; no pad, no 4-way snap
  { const S = G.save.settings || (G.save.settings = {}); if (!S.ctrlV5) { S.ctrlV5 = 1; delete S.ctrl; delete S.joy; delete S.snap; world.snap = false; G.persist(); } }
  world.scheme = G.save.settings?.ctrl === 'E' ? 'E' : 'F';
  world.joyOn = false;
}

// '#play-mini-<kind>' = the campaign's current (minis.js) version of a break game that also has a new one
const PLAY_HASH = /^#play-(?:mini-)?([a-z][a-z0-9]*)(?:-(\d+))?$/.exec(location.hash || '');
const galleryPlay = (id, k) => playGame(G, id, k, !!PLAY_HASH?.[0]?.startsWith('#play-mini-'));

// ── loop
let last = performance.now(), gameTime = 0, frames = 0, fpsNow = 60, fpsAcc = 0, fpsN = 0, updMs = 0, drawMs = 0, slow = 0, fast = 0, settleUntil = 0;
let lastDraw = 0;
// the screen's refresh (median gap between animation callbacks): on a 90/120 Hz phone the browser calls us 90/120
// times a second, so even while a finger moves we draw only every Nth call — counted in callbacks, not milliseconds,
// so frames stay evenly spaced and a 60 Hz screen never drops a frame to timestamp jitter. N = the highest even rate
// up to ~60 fps, unless that falls under 40 fps (then one step up): 60 Hz → 60, 75 → 75, 90 → 45, 100 → 50,
// 120 → 60, 144 → 48, 165 → 55, 240 → 60. The boundaries (64/128/192 Hz, and 80 Hz for the 40 fps floor) sit well away
// from real screens' rates, and a new N must come out the same three checks in a row, so it never flips.
export function capN(hz) { let n = Math.max(1, Math.ceil(hz / 64)); if (n > 1 && hz / n < 40) n--; return n; }
let rafLast = 0, rafN = 1, rafTick = 0, rafCount = 0, rafWant = 1, rafAgree = 0; const rafGaps = [];
function frame(now) {
  // phones draw less often whenever nothing is being touched or moved — the picture is the same, only the frame count
  // drops (user, 10/18: "아트 유지하면서 최적화 가능할까?"): 60 fps while a finger is on the screen or the view moves, 30 fps
  // a moment after it settles (was 1.5 s), 20 fps behind a menu / result panel
  if (rafLast) { rafGaps.push(now - rafLast); if (rafGaps.length > 40) rafGaps.shift(); }
  rafLast = now;
  if (OPT.fpsCap && (++rafCount & 15) === 0 && rafGaps.length >= 20) {
    const g = rafGaps.slice().sort((a, b) => a - b)[rafGaps.length >> 1], want = g > 0 ? capN(1000 / g) : 1;
    if (want !== rafWant) { rafWant = want; rafAgree = 1; } else if (++rafAgree >= 3) rafN = want;
  }
  const gap = !world.phone ? 0 : ui.panelOpen ? 48 : now - world.lastActive > 350 ? 30 : 0;
  world.capped = gap > 0;
  if (gap && now - lastDraw < gap) { requestAnimationFrame(frame); return; }
  if (!gap && rafN > 1 && ++rafTick < rafN) { requestAnimationFrame(frame); return; }
  rafTick = 0; lastDraw = now;
  const rdt = Math.min((now - last) / 1000, 1 / 12); last = now;
  frames++; fpsAcc += rdt; fpsN++;
  if (fpsAcc > .5) {
    fpsNow = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0;
    // adaptive quality: supersampling is what keeps the ink lines smooth, so only give it up after ~5 s of real
    // struggle (never while loading, switching scenes or in a background tab) and take it back when frames recover
    if (save.settings?.perf) {
      let el = document.getElementById('perf');
      if (!el) { el = document.createElement('div'); el.id = 'perf'; document.body.append(el); }
      // count the scene itself (the renderer's own counter only sees the last post-processing pass)
      if (now - (+el.dataset.at || 0) > 1500) {
        el.dataset.at = now;
        let meshes = 0, tris = 0;
        world.scene.traverseVisible(o => { if (o.isMesh && o.layers.mask & 5) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position?.count || 0) / 3; } });
        el.dataset.n = meshes; el.dataset.t = Math.round(tris / 1000);
      }
      el.textContent = `${fpsNow} fps · 화질 ${world.level}단계(x${world.maxSS}, dpr ${world.renderer.getPixelRatio()}) · 메시 ${el.dataset.n} · 삼각형 ${el.dataset.t}k`;
    } else document.getElementById('perf')?.remove();
    if (now < settleUntil || document.visibilityState !== 'visible' || G.pending || world.capped) { slow = fast = 0; }   // (a frame rate we lowered on purpose is not a struggling GPU)
    else {
      // a steady ~30 fps is a capped screen (low power mode, some in-app browsers), not a struggling GPU: never trade
      // crispness for it. Supersampling goes first under real strain; resolution only when frames really drop (<22).
      const capped = fpsNow >= 27 && fpsNow <= 31;
      slow = ((fpsNow < 32 && !capped && world.level < 2) || fpsNow < 22) ? slow + 1 : 0;
      fast = fpsNow >= 55 ? fast + 1 : 0;
      if (slow >= 10 && world.level < QUALITY.length - 1) { world.setLevel(world.level + 1); slow = 0; settleUntil = now + (world.phone ? 15000 : 4000); }
      // phones only ever step down: every step re-creates the screen-sized buffers, and going back up and down (60 fps while
      // the view moves, less when it doesn't) piled up memory until iOS reloaded the tab (iPhone 13 mini, 10/18)
      else if (fast >= 16 && world.level > 0 && !world.phone) { world.setLevel(world.level - 1); fast = 0; settleUntil = now + 4000; }
    }
  }
  let gdt = rdt * (G.timeScaleUser || 1) * (G.fast || 1);
  if (now < G.hitstopUntil) gdt *= .05;
  gameTime += gdt;
  const t0 = performance.now();
  try {
    if (G.bot && G.scene && !G.pending) G.scene.botStep?.(gdt, G.botMode);
    G.scene?.update(gdt);
    world.update(rdt);
    world.fx.update(rdt);
  } catch (e) { console.error(e); }
  const t1 = performance.now();
  world.render();
  const t2 = performance.now();
  updMs = updMs * .9 + (t1 - t0) * .1; drawMs = drawMs * .9 + (t2 - t1) * .1;
  requestAnimationFrame(frame);
}

async function boot() {
  const tb0 = performance.now();
  bootBar(40);   // the modules (three.js and the game) are in
  try { await Promise.all(['600 20px LatinRound', '600 20px Ssurround', '600 20px SsurroundAir', '20px TitleKo', '700 20px Chapter'].flatMap(f => [document.fonts?.load(f, 'Aa1'), document.fonts?.load(f, '가나')])); } catch {}
  const tb1 = performance.now();
  bootBar(55);
  await new Promise(r => { requestAnimationFrame(r); setTimeout(r, 60); });   // let the bar paint before the thumbnails block the thread
  buildThumbs();
  G.bootMs = { fonts: Math.round(tb1 - tb0), thumbs: Math.round(performance.now() - tb1), sinceStart: Math.round(performance.now()) };
  bootBar(72);
  requestAnimationFrame(frame);
  // a person starts from the start screen and taps it; QA links (?lv, ?scene, ?play) and the bots go straight in
  const tapToStart = !(qs.has('lv') || qs.has('scene') || qs.has('play') || PLAY_HASH || G.bot);
  G.booting = tapToStart;
  const lv = qs.get('lv'), sc = qs.get('scene'), play = qs.get('play') || PLAY_HASH?.[1];
  // one game of 놀이 모음 straight away: ?play=<id>&lv=<n> on the web, #play-<id>-<n> on the artifact (claude.ai passes the
  // address's # part to the page; n is 1-based; 'mini-' before the id is allowed) — links from the docs and the lab hub
  const playLv = qs.get('play') ? +(qs.get('lv') || 1) : +(PLAY_HASH?.[2] || 1);
  const going = play ? (galleryPlay(play, playLv - 1) || G.go('home'))
    : lv ? G.go('stage', { idx: Math.max(0, +lv - 1) })
    : sc === 'myhome' ? G.go('myhome', { mode: qs.get('mode') || 'view' })
    : sc === 'visit' ? G.go('visit')
    : tapToStart && firstRun ? G.go('stage', { idx: 0 })   // the very first time: straight into 1판 (bots and QA links keep the home)
    : G.go('home');
  if (firstRun) G.persist();   // the next launch is not the first any more, even if this one ends inside 1판
  // lift the boot cover once the scene is built — a stage can open with a dialog that waits for a tap behind it
  bootBar(90);
  while (G.pending) await new Promise(r => requestAnimationFrame(r));
  bootBar(100);
  if (tapToStart) await bootTap();
  G.booting = false;
  document.getElementById('boot').classList.add('gone');
  setTimeout(() => document.getElementById('boot')?.remove(), 600);
  // the QA hooks go in before the first scene settles (a stage that opens with a dialogue waits for a tap, and the bots /
  // headless checks need __jam meanwhile — story session 10/18)
  installJam();
  await going;
  // (no background drawing of all ~200 furniture icons any more: each grid draws the icons it shows — see G.needThumbs)
  // keep the two copies in step (a save that came from the address goes back into storage) and say so when this browser
  // cannot keep anything — then the address is what remembers
  if (WEB) { G.persist(); if (!storageOk) setTimeout(() => ui.toast('이 브라우저는 저장이 안 돼요 · 지금 주소를 북마크하면 이어서 할 수 있어요', 'red'), 1500); }
}

// start screen (index.html #boot): the bar follows the boot steps; the CSS creep covers the module download before this runs
function bootBar(p) {
  const i = document.querySelector('#boot .boot-bar i'); if (!i) return;
  if (i.style.animation !== 'none') { const w = i.getBoundingClientRect().width; i.style.animation = 'none'; i.style.width = w + 'px'; i.offsetWidth; }
  i.style.width = p + '%';
}
// full bar → "터치해서 시작"; the tap wakes the audio (audio.unlock listens on pointerdown) and lifts the cover
async function bootTap() {
  const boot = document.getElementById('boot'); if (!boot) return;
  await new Promise(r => setTimeout(r, 380));   // let the bar visibly reach the end
  boot.classList.add('ready');
  await new Promise(res => boot.addEventListener('pointerup', res, { once: true }));
  audio.sfx('btn');
}

function installJam() {
  const errors = [];
  addEventListener('error', e => errors.push(String(e.message || e)));
  addEventListener('unhandledrejection', e => errors.push('unhandled: ' + String(e.reason)));
  const fpsSamples = [];
  setInterval(() => { fpsSamples.push(fpsNow); if (fpsSamples.length > 120) fpsSamples.shift(); }, 500);
  window.__THREE = THREE;   // QA probes
  window.__jam = {
    ready: true, version: '0.2.0',
    state: () => ({ ...(G.scene?.state?.() || { scene: 'boot' }), to: G.pending }),
    start: () => G.go('stage', { idx: save.stage || 0 }),
    startRect: () => { const b = G.scene?.playBtn; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; },
    bot: on => { G.bot = !!on; },
    level: n => G.go('stage', { idx: n - 1 }),
    call: (name, ...a) => API[name]?.(...a),
    metrics: () => {
      const info = world.renderer.info.render;
      return { gameTime: +gameTime.toFixed(1), wallTime: +(performance.now() / 1000).toFixed(1), frames, fpsNow, fpsAvg: fpsSamples.length ? Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length) : null, fpsMin: fpsSamples.length ? Math.min(...fpsSamples) : null,
        errors: errors.slice(-10), levelsCleared: G.stats.cleared, fails: G.stats.fails, avgLevelSec: G.stats.levelSecs.length ? +(G.stats.levelSecs.reduce((a, b) => a + b, 0) / G.stats.levelSecs.length).toFixed(1) : null,
        log: G.stats.log.slice(-20), drawCalls: info.calls, tris: info.triangles, updMs: +updMs.toFixed(2), drawMs: +drawMs.toFixed(2), visits: G.stats.visits, ss: world.maxSS, net: net().ok };
    },
  };
}
const API = {
  lang: l => setLang(l), i18nMisses: () => i18nMisses(),
  go: (n, d) => G.go(n, d),
  coins: n => { save.coins = n; G.persist(); },
  stageTo: n => { save.stage = n; for (const z of HOME_ZONES) if (G.zoneOpen(z.id)) G.ensureZone(z.id); G.persist(); },
  mode: m => G.scene?.setMode?.(m),
  zone: id => G.scene?.switchZone?.(id),
  win: () => { const s = G.scene; if (s?.targets) { s.targets.forEach(t => { t.found = true; }); s.win(); } },
  lose: () => { const s = G.scene; if (s?.lose) { s.time = 0; } },
  yaw: y => { world.yaw = y; world.yawGoal = null; },
  pitch: p => { world.pitch = p; },
  zoom: z => { world.zoom = z; },
  bot: (m, err) => { G.bot = true; G.botMode = m || 'smart'; if (err != null) G.botErr = err; },
  fast: f => { G.fast = f; },
  botHold: v => { G.botHold = !!v; },
  scene: () => G.scene,
  skipTalk: v => { G.skipTalk = !!v; },
  raid: n => runRaids(G, { force: n || 1 }),   // QA: residents raid my home right now
  ss: v => world.setQuality(v),
  noTimer: v => { G.noTimer = !!v; },
  stats: () => G.stats,
  audit: () => G.scene?.audit?.(),
  goal: () => { const g = G.scene?.nextGoal?.(); return g && { kind: g.kind, label: g.part?.label || g.item?.spot.label, type: g.item?.type, locked: !!g.part?.lock, partT: g.part?.t, busy: g.part?.busy, occl: world.occluded(g.obj, g.pos, [G.scene.room.group]) }; },
  shop: tab => G.scene?.shop?.(tab),
  locks: () => (G.scene?.plan?.locks || []).map(l => l.kind + '@' + l.part.furn.type + (l.lever ? '/' + l.lever.furn.type : '')),
};
boot();
