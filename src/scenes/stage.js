// Core loop: a friend counts down while you rotate their 3D room and find what they hid.
import * as THREE from 'three';
import { Room, attachItem } from '../room.js';
import { MapRooms, FLOOR_H } from '../map.js';
import { disposeTree, put, rbox } from '../gfx/kit.js';
import { Ambient } from '../ambient.js';
import { Companion } from '../companion.js';
import { BOSS_AFTER } from './boss.js';
import { MINI_AFTER, MINI_INFO, BOSS_GAMES } from '../minis.js';
import { BOSS_GAME_INFO } from './bossgame.js';
import { THEMES, stageSpec, layoutFor, planStage, planIncident, planShow, planCustom, STAGE_COUNT, CHAR_UNLOCK, REGION_INTRO } from '../stages.js';
import { spinePuzzle } from '../showcase.js';
import { zoneLayout, ZONE_TYPES } from '../catalog.js';
import { recordPlay, logStage } from '../net.js';
import { buildItem, ITEMS, LOCK_COLORS } from '../gfx/items.js';
import { FURN_INFO } from '../gfx/furniture.js';
const FURN_NAME = t => FURN_INFO[t]?.name || t;
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { storyFor, playDialog, playCinematic, slidePuzzle, setFrameSolved } from '../story.js';
import { Trickster } from '../trickster.js';
import { FEEL } from '../feel.js';
import { shown as isShown } from '../world.js';
import { persona, CLUE_TELL, HELLO, NEAR, BUMP, BONUS, nextHook } from '../incident-story.js';
// 대본 (10/18): what everyone says, tied to the map + kind of stage, not the stage number (_handoff/script-ko-en-20261018.md)
import { R1, r1Line } from '../script.js';   // R1 몰래 숨기 lines (story session, 10/18)
import { sceneAt, hostAt, goalLine, incidentIntro, incidentReveal, hideLine, hidePool, grayIntro, inkyTaunt, inkyCaught, inkyStays, sceneAfter,
  timedIntro, timedWin, ROCKY_LOSE, BONUS_SAY, firstLayout, planFirst, boxTail, newCard, DO, UI as SUI, fallbackIntro } from '../script.js';
import { tr } from '../i18n.js';
const JAIL_LINES = ['억울해요! 난 그냥 숨바꼭질 하던 중이었다고요!', '진짜 도둑은 잉키라니까요~!', '여기 의자 딱딱해…', '열쇠 찾으면 나 좀 꺼내 줘!', '술래가 갇히면 숨바꼭질은 누가 해…'];
const ROBOT_COST = 50;
import { h, ICON } from '../ui.js';
import { ease, clamp, Tweens } from '../util.js';
import { openTune } from '../tune.js';
import { retrieve, canGrab, grab } from '../raid.js';

// 레벨 보고서 R1 '몰래 숨기' 시제품 (10/18) — only with ?hide=1 (the user compares it on the phone before anything changes):
// you don't watch the friend hide ("눈 감아! 하나, 둘, 셋" and only the sounds), 2–3 big hideouts are candidates, a trail of
// crumbs leads toward the real one, a wrong one says "여긴 없지롱~" and the real one giggles; giggles/wobbles only after 15 s
// of nothing. (Prototype simplification: after 3 wrong guesses the real one gives itself away instead of the friend moving.)
// R1 몰래 숨기 is the default since 10/18 (user: "좋아 알원"); ?hide=0 brings back the old watch-it-hide version
const HIDE_R1 = !/[?&]hide=0(&|$)/.test(location.search);
const R1_HIDE = ['wardrobe', 'bigfridge', 'fridge', 'chest', 'trunk', 'tent', 'firetruck', 'jailcell', 'patrolcar', 'lockers', 'safe', 'dishcab', 'pastrycase', 'shopfront', 'washer3', 'minifridge', 'tentsmall', 'cooler', 'kpopstage', 'artcrate', 'lostbox', 'vending', 'drawers', 'mailbox', 'picnic', 'bookshelf', 'desk', 'toybox', 'cabinet', 'closet', 'sideboard', 'shoerack', 'laundrybasket', 'dresser']; 

const V = new THREE.Vector3();
const fmtTime = s => { s = Math.max(0, Math.round(s)); return s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`; };
// subject particle: 삐딱이가 / 보드킹이
export const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
// who hangs around in each region (never the counting friend)
const NPC_POOL = {
  home: ['churro', 'mug', 'paint', 'tv', 'robot', 'sundae', 'hamster', 'nerd', 'dj', 'cheese', 'hayang', 'toast', 'pot'],
  alley: ['cone', 'coolcat', 'skater', 'grumpy', 'shiba', 'paint', 'mug', 'godeung', 'kkamang', 'calico'],
  park: ['frog', 'squirrel', 'dj', 'hamster', 'skater', 'sundae', 'shiba', 'calico', 'cheese', 'pot'],
  camp: ['snowy', 'squirrel', 'panda', 'sleepy', 'robot', 'mug', 'frog'],
  apt: ['churro', 'mug', 'tv', 'paint', 'hamster', 'sundae', 'bear', 'tuxedo', 'hayang', 'toast', 'milk'],
  shop: ['shiba', 'cone', 'mug', 'sundae', 'coolcat', 'skater', 'milk', 'onigiri', 'godeung', 'kkamang'],
  building: ['nerd', 'robot', 'tv', 'dj', 'coolcat', 'mug', 'tuxedo', 'milk'],
};

const HALF_PI = Math.PI / 2;
// 흑백판: the owner tells what happened (a different telling by stage) and then needles you while you look (user, 10/17:
// "흑백 나올때도 해당 방 주인공이 스토리처럼 말하게 해줘 그리고 도발멘트도 날리고")
const GRAY_INTRO = [
  ['앗! 내 방 색깔이 몽땅 사라졌어! 누가 물감을 쏙 빼 갔나 봐…', '걱정 마! 숨은 물건을 하나씩 찾으면 색이 다시 돌아올 거야.', '흥, 온통 회색인데 찾을 수 있겠어? 이번엔 큰 가구까지 숨겨 놨다고~'],
  ['이것 봐, 세상이 흑백 영화가 됐어!', '찾은 물건마다 색이 돌아온대. 내가 다 칠해 줄게!', '과연 그럴까? 회색 속에 숨은 건 하나도 안 보일걸~ 메롱!'],
  ['쉿… 오늘은 색깔 도둑이 다녀갔어.', '그럼 내가 찾아서 색을 되찾아 줄게!', '좋아, 내기하자! 가구까지 다 찾으면 인정!'],
];
// 먹물이, the colour thief, opens every 흑백판 and hands out the special shades (user, 10/17)
const INKY_HELLO = ['후후, 색깔은 내가 냠냠 다 먹어 버렸지~', '색깔 도둑 먹물이 등장! 알록달록한 건 다 내 거야~', '어머, 다 회색이네? 내가 그랬지롱~'];
// a room can tell its own version
const GRAY_INTRO_ROOM = {
  museum: ['큰일이야! 미술관 그림들이 전부 색을 잃었어!', '숨은 물건을 찾으면 색이 돌아올 거야. 그림도 다시 칠해질걸?', '흥, 관람객 실력 좀 볼까? 큰 조각상까지 찾아내 봐~'],
};
const TAUNT = {
  idle: ['어디 있게~? 메롱!', '하나도 안 보이지? 후후', '회색이라 헷갈리지~?', '포기하면 편해~', '바로 코앞에 있는데~?', '눈 크게 떠 봐~'],
  miss: ['땡! 거기 아니야~', '틀렸지롱~', '어림없지!', '헛다리 짚었네~'],
  found: ['어? 그걸 찾았어?!', '흥, 운이 좋았네!', '이번엔 봐준 거야!', '쳇, 들켰다…'],
  furn: ['그 큰 걸 이제 봤어? ㅎㅎ', '가구까지 찾다니!'],
};

export class StageScene {
  constructor(G) { this.G = G; this.name = 'stage'; }

  async enter({ idx = 0, custom = null, spec = null, preview = false }) {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    this.preview = preview;   // an art preview room: plays like a stage, touches no progress, coins or logs
    this.custom = custom; this._paid = new Set(); this.tStart = this.tEnd = null;
    let layout;
    if (custom) {
      // someone else's room: their furniture, their hiding places, their locks
      const seed = [...String(custom.owner || custom.id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const kinds = ['bunny', 'bear', 'cat', 'peng'];
      layout = zoneLayout(custom.zone);
      const count = (custom.hidden || []).filter(e => e.item !== 'key' && e.item !== 'note').length;
      this.idx = -1;
      this.spec = { idx: -1, room: custom.zone.type, time: 40 + count * 12 + (custom.locks?.length ? 12 : 0), n: count, seed, custom: true };
      this.th = { ...layout.theme, name: custom.practice ? `${custom.nick}의 ${custom.title}` : `${custom.ownerName || '누군가'}의 ${custom.title || '방'}`,
        friend: custom.face && CHAR_DEFS[custom.face] && custom.face !== 'mong' ? custom.face : kinds[seed % kinds.length], bg: ZONE_TYPES[custom.zone.type]?.indoor ? ['#fff3e3', '#ffe2c4'] : ['#e4f6ff', '#d6f3d8'] };
      layout.friendAt = [2.0, 2.0];
    } else {
      this.idx = idx; this.spec = { ...stageSpec(idx), ...(spec || {}) };
      layout = layoutFor(this.spec.room);
      this.th = THEMES[this.spec.room] || layout.theme;   // a map without its own THEMES entry wears its first room's look
      if (this.spec.timed) this.th = { ...this.th, friend: 'raccoon' };   // 너굴이 hosts the timed hide-and-seek
      this.scene = sceneAt(idx);   // 대본: this stage's own scene, if the script pins one here
      const ho = hostAt(idx); if (ho) this.th = { ...this.th, friend: ho };   // e.g. 먹물이 hiding on the rooftop
      if (this.spec.tut === 1 && !G.save.settings?.oldMode) layout = firstLayout(layout);   // 1판: the toy box faces away from you
    }
    if (custom) this.scene = null;
    const th = this.th;
    G.setBg(th.bg); W.setLight(th.light);
    // 밤 판: moonlight — dimmer and bluer, but every corner still reads (no torch, no silhouettes)
    if (this.spec.night && !this.plan?.light) { G.setBg(['#2b3270', '#4a3f86']); W.setLight({ ambColor: '#a3adff', amb: 1.0, sunColor: '#cfd7ff', sun: .8 }); }
    this.layout = layout;
    this.room = layout.rooms ? new MapRooms(W, layout) : new Room(W, layout);
    W.root.add(this.room.group);
    this.ambient = new Ambient(this.room);   // plants sway, clothes sway, warm things steam
    this.story = custom ? null : storyFor(this.idx);
    // 사건 판 (10/17 pivot): the owner hides behind a lock and finding them is the goal (세팅 → 더보기 has the old way)
    this.incident = !custom && !this.preview && (!!this.spec.incident || this.spec.tut === 1) && !G.save.settings?.oldMode;
    this.plan = custom ? planCustom(this.room, custom, this.spec.seed) : (this.incident && this.spec.tut === 1 && planFirst(this.room, this.spec)) || (this.incident && this.spec.showcase && planShow(this.room, this.spec, this.story)) || (this.incident && planIncident(this.room, this.spec, this.story)) || planStage(this.room, this.spec, this.story);
    if (this.incident && !this.plan.incident) this.incident = false;
    for (const l of this.plan.locks) {
      if (l.kind === 'treat') { l.part.lock = { kind: 'treat' }; continue; }   // guarded by a character, no lock hardware
      if (l.kind === 'dig') { l.part.lock = { kind: 'dig' }; continue; }       // the red X in the sand: dig it with the shovel
      if (l.kind === 'sock') { l.part.lock = { kind: 'sock', code: l.code }; this.sockTag(l.part, l.code); continue; }   // a lone sock pinned on a washer
      if (l.kind === 'spine' || l.kind === 'marble' || l.kind === 'gadget') { l.part.lock = { kind: l.kind, code: l.code }; l.part._hadLock = true; continue; }   // 비밀 서재
      l.part._hadLock = true;
      l.part.furn.setLock(l.part, l.kind, l.code); if (l.lever) l.part.leverPart = l.lever; if (l.puzzle) l.part.lock.puzzle = l.puzzle; if (l.tv) l.part.lock.tv = true;
    }
    this.treats = 0; this.secretFound = false; this.guard = null;
    this.items = []; this.friendItem = null;   // (the last stage's hidden friend must not carry over)
    const r = this.plan.rotSeed;
    for (const p of this.plan.placements) {
      const g = buildItem(p.type, { code: p.code, v: p.v, piece: p.piece });
      // small things to find are drawn bigger (to ~22 cm across) as far as the spot's headroom allows — a mandarin or a
      // key was a few pixels on a phone (user, 10/17: "오렌지 너무 작아")
      let sc = p.role === 'decoy' ? 1.08 : 1.15;
      if (p.role === 'target') {
        const nat = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()), big = Math.max(nat.x, nat.y, nat.z) || .2;
        const room = (p.spot.maxH + .02) / Math.max(.01, (ITEMS[p.type]?.h || .2) * (p.spot.scale || 1));
        sc = Math.max(sc, Math.min(1.5, .22 / big, ITEMS[p.type]?.flat ? 1.5 : room));
      }
      attachItem(p.spot, g, { rotY: (r() - .5) * 1.4, scale: sc });
      const it = { type: p.type, role: p.role, spot: p.spot, g, found: false, code: p.code, forPart: p.forPart, piece: p.piece };
      if (p.vacHidden) { it.vacHidden = true; g.visible = false; }   // rides out on the robot vacuum (아파트 장치판)
      if (p.type === 'friendtoken') { it.friend = true; it.thumb = G.thumbs['face_' + this.th.friend]; this.friendItem = it; }
      g.userData.item = it; p.spot.item = it;
      this.items.push(it);
    }
    this.targets = this.items.filter(i => i.role === 'target');
    this.hasBook = false; this.cine = false;
    if (this.plan.showcase?.shelf) { const S = this.plan.showcase; S.shelf.furn.spines.draw(S.order, S.missing); }
    this.gadgets = new Set();
    if (this.spec.gray) this.setupGray();
    this.trick = new Trickster(this);
    // the friend counting in the corner
    let fa = layout.friendAt || [1.6, 1.6];
    // never stand inside a piece of furniture: take the nearest clear spot to where the layout asked
    if (this.room.clearAt && !this.room.clearAt(fa[0], fa[1], .48)) {
      let best = null;
      for (let dx = -3; dx <= 3; dx += .25) for (let dz = -3; dz <= 3; dz += .25) {
        const x = fa[0] + dx, z = fa[1] + dz, d = dx * dx + dz * dz;
        if ((!best || d < best.d) && Math.abs(x) < this.room.w / 2 - .3 && Math.abs(z - (this.room.center?.z || 0)) < this.room.d / 2 - .3 && this.room.clearAt(x, z, .48)) best = { x, z, d };
      }
      if (best) fa = [best.x, best.z, fa[2]];
    }
    this.friend = new Char(th.friend);
    this.friend.root.position.set(fa[0], (fa[2] || 0) * FLOOR_H, fa[1]);
    this.friend.root.rotation.y = Math.atan2(fa[0], fa[1]);
    this.friend.pose = this.spec.timed ? 'count' : 'idle'; this.friend.setFace('happy');
    W.root.add(this.friend.root);
    const guard = this.plan.locks.find(l => l.kind === 'treat');
    if (guard) {
      const b = new THREE.Box3().setFromObject(guard.part.furn.group), c = b.getCenter(new THREE.Vector3());
      this.friend.root.position.set(c.x, b.max.y - .02, c.z);
      this.friend.root.rotation.y = Math.atan2(W.cam.position.x - c.x, W.cam.position.z - c.z);
      this.friend.pose = 'cross'; this.friend.setFace('angry'); this.guard = guard;
    }
    this.spawnNpcs();
    // the player's own character walks along (not in other players' rooms)
    if (!this.custom && !this.G.save.settings?.noHero) {
      const h = new Companion(this.G, this.room.rooms || [this.room], () => [this.friend, ...(this.npcs || []).map(n => n.ch)]);
      if (h.tiles.length > 6) this.hero = h; else h.dispose();
    }
    // camera
    this.frameCamera();
    W.shadowDirty = true;
    // state
    Object.assign(this, { time: this.spec.time, timeMax: this.spec.time, timerOn: false, running: false, paused: false, combo: 0, bestCombo: 0, lastFind: -99, misses: [], dizzy: 0, keys: 0, codes: new Set(),
      result: null, scraps: {}, t: 0, idle: 0, rotAccum: 0, found: 0, missCount: 0, continued: false, botT: 0, tutStep: 0, lastSec: 99, needKey: false, needCode: false, partsOpened: 0, twinkleT: 0 });
    this.hints = 3; this.hintsUsed = 0;   // 3 magnifiers a stage (was 2; easier, user 10/17)
    this.tail = null; this._dF = this._dE = false;   // (대본 bits that must not carry over from the last stage)
    this.buildHud();
    if (this.plan.first) this.tnum.textContent = '';   // 1판: only 토순이 to find, no bonus count
    W.onTap = (x, y) => this.tap(x, y);
    W.tapInstant = (x, y) => { const hit = this.pickAt(x, y); return hit.kind === 'item' && !hit.item.found && hit.item.role !== 'decoy'; };
    W.onRotate = d => { this.rotAccum += Math.abs(d); };
    W.onDragStart = null;
    W.onPress = (x, y) => this.pressAt(x, y);   // 손맛 7
    G.audio.music('play');
    this.bubble = h('div', { class: 'bubble count' }, ''); G.ui.wui.append(this.bubble);
    if (this.plan.light) this.goDark();
    if (this.spec.intro && this.spec.chapter && !custom) { await playCinematic(G, REGION_INTRO[this.spec.chapter]); if (this.dead) return; }
    // the goal in one line (대본: "토순이 찾기") — the story is in the talk, not stacked on the banner
    await G.ui.banner(th.name, custom ? `숨겨 둔 물건 ${this.targets.length}개를 찾아라!` : this.incident ? goalLine(th.friend) : `${ga(CHAR_DEFS[th.friend].name)} 숨긴 물건 ${this.targets.length}개를 찾아라!`, 1250);
    if (this.dead) return;
    if (this.story?.intro) { await this.talk(this.story.intro, { title: this.story.title }); if (this.dead) return; }
    if ((this.scene?.type === 'tut2' || (this.scene?.always && !this.incident)) && this.scene.intro) { await this.talk(this.scene.intro, { title: th.name }); if (this.dead) return; }   // 2판 · 편의점
    if (this.spec.gray && !custom) {
      // 대본: the owner, then 먹물이 by where we are in the story (a voice → caught again → quiet → helping)
      await this.talk(grayIntro(this.idx, th.friend, !!this.villain), { title: '색을 잃은 방' });
      if (this.dead) return;
      this.giveShades();   // everyone puts the special shades on
    }
    if (this.spec.timed && !this.custom) {
      await this.talk(timedIntro(this.idx), { title: '너굴이의 숨바꼭질' });   // 대본: the champion, a new excuse each time
      if (this.dead) return;
      this.timerOn = true;
    }
    if (this.incident) {
      // 대본: this map's scene, else the host's own lines for how many times you've met (a joke from last time comes back)
      const lines = incidentIntro(this.idx, th.friend);
      if (lines.length) { await this.talk(lines, { title: th.name }); if (this.dead) return; }
      await this.friendHides(); if (this.dead) return;
    } else if (!custom && !this.preview && this.spec.incident && !this.scene?.always && !G.save.settings?.oldMode) {
      // a 사건 판 that fell back to finding things (no big furniture to hide in): the host says so, not a hiding line
      await this.talk(fallbackIntro(th.friend), { title: th.name }); if (this.dead) return;
    }
    this.running = true; this.tStart = this.t;
    if (this.spec.tut === 1) this.tutorial1();   // no clock: the stage waits for you
    if (this.spec.tut === 2) this.tutorial2();
    if (this.scene?.card) newCard(G, this.scene.card);   // e.g. 비밀 서재: 🆕 연쇄 장치
    if (this.scene?.teachMove && !G.save.tut?.move) this.teachMove();
    if (this.spec.boss) G.ui.toast('방탈출 보스판! 단서를 차례로 풀어 봐', 'red');
    else if (this.spec.night && !this.incident) G.ui.toast('밤이 됐어! 달빛 아래 숨은 물건을 찾아봐', 'green');
    // the locks (열쇠·비밀번호·색깔·레버·간식) come as a 🆕 card the first time you touch one (onPart); these few keep a tip
    const seen = G.save.seenLocks || (G.save.seenLocks = []);
    const LOCK_TIPS = { tv: 'TV가 꺼져 있네? 리모컨을 찾으면 뭔가 나올지도', sock: '세탁기에 짝 잃은 양말이 걸려 있어! 같은 무늬를 찾아 줘', dig: '모래밭에 빨간 X가 있어! 모래삽을 찾아서 파 보자' };
    // (사건 판: this runs after the friend has hidden; the tips wait for the 'open where they hid' line to go first)
    this.lockTips = [];
    for (const k of new Set([...this.plan.locks.filter(l => !l.tv).map(l => l.kind), ...(this.plan.tv?.lock ? ['tv'] : [])])) if (!seen.includes(k) && LOCK_TIPS[k]) { seen.push(k); G.persist(); this.lockTips.push(LOCK_TIPS[k]); }
    this.showLockTips(this.incident ? 2400 : 0);
  }
  showLockTips(delay) { let d = delay; for (const t of this.lockTips || []) { setTimeout(() => !this.dead && this.G.ui.toast(t, 'green'), d); d += 2200; } this.lockTips = []; }

  exit() {
    this.dead = true;
    const G = this.G;
    G.world.onPan = null; this.tutEls?.forEach(e => e.remove()); this.trick?.dispose();
    if (G.world.post) G.world.post.u.gray.value = 0;
    document.getElementById('app').style.removeProperty('--joyB');
    G.world.root.remove(this.room.group); G.world.root.remove(this.friend.root);
    for (const n of this.npcs || []) { n.on = false; G.world.root.remove(n.ch.root); }
    this.ambient?.dispose(); if (this.hero) { disposeTree(this.hero.ch.root); this.hero.dispose(); }
    // this stage's own meshes, materials and textures (not the shared caches) go with it
    for (const r of [this.room.group, this.friend.root, ...(this.npcs || []).map(n => n.ch.root)]) disposeTree(r);
    G.world.onTap = null; G.world.onRotate = null; G.world.tapInstant = null; G.world.onPress = null;
    G.ui.clear(); this.tw.clear();
  }

  // ── HUD
  buildHud() {
    const G = this.G, ui = G.ui, col = ui.col();
    this.col = col;
    const top = h('div', { class: 'topbar' });
    top.append(ui.ibtn('pause', 'purple', () => this.pause()));
    this.timerEl = h('div', { class: 'timer' },
      h('div', { class: 'face' }, h('img', { src: G.thumbs['face_' + this.th.friend] })),
      h('div', { style: 'display:flex;flex-direction:column;flex:1;min-width:0;gap:3px' }, this.tlEl = h('div', { class: 'tl' }, this.custom ? '숨긴 물건 찾기' : this.spec.timed ? `너굴이가 세는 중 · 0/${this.targets.length}` : this.th.name), h('div', { class: 'tbar' }, this.tbarI = h('i', { style: `width:${this.spec.timed ? 100 : 0}%` }))),
      this.tnum = h('div', { class: 'num ol' }, this.spec.timed ? String(this.spec.time) : this.incident ? `0/${this.targets.length - 1}` : `0/${this.targets.length}`));
    top.append(this.timerEl);
    top.append(h('div', { class: 'stagetag ol', html: this.custom ? `놀러옴<b>${this.targets.length}개</b>` : this.preview ? `새 아트<b>미리</b>` : `STAGE<b>${this.idx + 1}</b>` }));
    if (this.spec.hard) top.lastChild.style.background = 'var(--r2)';
    col.append(top);
    this.inv = h('div', { class: 'inv' }); col.append(this.inv);
    this.keyPill = ui.pill('key', '0'); this.codePill = ui.pill('note', '???');
    this.colorPill = ui.pill('note', ''); this.colorPill.style.display = 'none'; this.colorCodes = new Set();
    this.keyPill.style.display = 'none'; this.codePill.style.display = 'none';
    this.inv.append(this.keyPill, this.codePill, this.colorPill);
    this.tools = new Set();
    this.toolPill = h('div', { class: 'pill treat tool' }, h('img', { src: G.thumbs.item_shovel }), h('span', { class: 'v' }, '?'));
    this.toolPill.style.display = 'none'; this.inv.append(this.toolPill);
    // tray
    this.tray = h('div', { class: 'tray' });
    this.slots = new Map();
    this.targets.forEach(it => {
      const mine = this.custom?.stolen?.includes(it.type);   // my own thing, taken from my home: get it back
      const s = h('div', { class: 'slot' + (this.spec.silhouette ? ' sil' : '') + (mine ? ' mine' : '') + (it.friend ? ' friendslot' : this.incident ? ' bonus' : '') }, h('img', { src: it.thumb || G.thumbs['item_' + it.type] }), h('div', { class: 'chk', html: ICON.check }), ...(mine ? [h('div', { class: 'minetag' }, '내 거')] : []));
      this.tray.append(s); it.slot = s;
    });
    col.append(this.tray);
    // many things to find: two rows of bigger pictures instead of one row of tiny ones (11 in a row were ~18 px)
    if (this.spec.gray) this.tray.classList.add('grayst');   // the list is drained of colour too: shapes only
    const two = this.targets.length > 7;
    // the buttons sit just above the (slimmer) tray (user, 10/17-18: "유아이가 너무 크고")
    document.getElementById('app').style.setProperty('--joyB', two ? '146px' : '100px');
    if (two) { this.tray.classList.add('two'); this.tray.style.setProperty('--cols', Math.ceil(this.targets.length / 2)); }
    const bottomY = two ? 'calc(146px + var(--safeB))' : 'calc(100px + var(--safeB))';   // clear of the tray
    this.mong = h('div', { class: 'mong' }, this.mongImg = h('img', { src: G.thumbs.face_mong }));
    col.append(this.mong);
    const side = h('div', { class: 'side', style: `bottom:${bottomY}` });
    this.hintBtn = ui.ibtn('hint', 'blue', () => this.useHint(), this.hints);
    this.hintBtn.style.width = this.hintBtn.style.height = '52px';
    // zoomed in, one finger moves you around: these turn the room (or go back to the whole view) one-handed
    // back to the starting view (angle, tilt, zoom and position) whenever the view has wandered off
    const all = ui.btn('처음 시점', { color: 'gray', cls: 'sm', onClick: () => { const v = this.view0 || { yaw: Math.PI / 4, pitch: .62 }; G.world.flyTo(this.tw, { zoom: 1, target: G.world.home, yaw: v.yaw, pitch: v.pitch, dur: .45 }); } });
    this.zoomTools = h('div', { class: 'zoomtools' }, all);
    side.prepend(this.zoomTools);
    side.append(this.hintBtn); col.append(side);
    // (the ⟲ ⟳ turn buttons came out 10/18 — user: "이거 필요없지않아?"; the 회전|이동 badge and dragging turn the room)
  }
  setMong(face, anim) {
    const G = this.G;
    this.mongImg.src = G.thumbs['face_mong_' + face] || G.thumbs.face_mong;
    if (anim) { this.mong.classList.remove('hop', 'shake', 'spin'); void this.mong.offsetWidth; this.mong.classList.add(anim); }
    clearTimeout(this._mt); this._mt = setTimeout(() => { if (!this.dead && !this.dizzy) { this.mongImg.src = G.thumbs.face_mong; this.mong.classList.remove('spin'); } }, 1400);
  }

  // ── input
  classify(o) {
    for (let p = o; p; p = p.parent) {
      const u = p.userData;
      if (u.item) return { kind: 'item', item: u.item, node: p };
      if (u.part) return { kind: 'part', part: u.part, node: p };
      if (u.char) return { kind: 'char', char: u.char, node: p };
      if (u.furn) return u.furn.parts[0]?.isLever ? { kind: 'part', part: u.furn.parts[0], node: p } : { kind: 'furn', furn: u.furn, node: p };
      if (u.wall) return { kind: 'wall' };
      if (u.floor) return { kind: 'floor' };
    }
    return { kind: 'none' };
  }
  pickRoots() { return [this.room.group, this.friend.root, ...(this.npcs || []).map(n => n.ch.root), ...(this.trick?.ch ? [this.trick.ch.root] : [])]; }
  // 손맛 1: a fingertip is ~44 px, but a small thing is drawn 12–38 px and its tap area was 28–34 px across at the whole
  // view (stage 4, 375-wide phone, measured 10/18) — a near miss landed on the floor or a cabinet and counted as a miss
  // (몽글이 sweats, −2 s on a timed stage, dizzy after four). When nothing to find is right under the finger, the nearest
  // thing still to find whose tap area comes within 22 px of the finger, and that can really be seen there, is taken.
  // A direct hit on a drawer, a friend, a decoy or a gray-stage piece of furniture stays what it is.
  pickAt(x, y) {
    const hit = this.pickExact(x, y);
    if (!FEEL.fat) return hit;
    const soft = hit.kind === 'none' || hit.kind === 'floor' || hit.kind === 'wall' || (hit.kind === 'item' && hit.item.found)
      || (hit.kind === 'furn' && hit.furn.type !== 'puzzleframe' && hit.furn !== this.plan.tv?.f && !(this.grayFurn?.get(hit.furn) && !this.grayFurn.get(hit.furn).found));
    if (!soft) return hit;
    const W = this.G.world, pxPer = W.H / (W.viewH / W.zoom), R = 22, roots = this.pickRoots(), c = new THREE.Vector3();
    let best = null, bd = Infinity;
    // reachable = a tap on its centre would take it (the game's own rule, proxies included), or some part of it is
    // the first thing seen (hollow things)
    const same = (a, b) => a.kind === b.kind && (a.item ? a.item === b.item : a.char === b.char);
    const consider = (obj, center, rPx, res) => {
      const sp = W.toScreen(center), d = Math.hypot(sp.x - x, sp.y - y) - rPx;
      if (d > R || d >= bd || !isShown(obj)) return;
      if (!same(this.pickExact(sp.x, sp.y), res) && !W.visibleAt(obj, center, roots)) return;
      best = res; bd = d;
    };
    for (const it of this.items) {
      if (it.found || it.role === 'decoy' || !it.g) continue;
      let px = null; for (const ch of it.g.children) if (ch.userData.proxy) { px = ch; break; }
      if (px) { px.getWorldPosition(c); const e = px.matrixWorld.elements; consider(it.g, c, Math.hypot(e[0], e[1], e[2]) * pxPer, { kind: 'item', item: it, node: it.g }); }
      else { const b = new THREE.Box3().setFromObject(it.g); if (!b.isEmpty()) consider(it.g, b.getCenter(c), b.getSize(new THREE.Vector3()).length() / 2 * pxPer, { kind: 'item', item: it, node: it.g }); }
    }
    // the trickster on the run is caught the same way
    const tc = this.trick?.ch;
    if (tc?.root) { const b = new THREE.Box3().setFromObject(tc.root); if (!b.isEmpty()) consider(tc.root, b.getCenter(c), Math.max(...b.getSize(new THREE.Vector3()).toArray()) / 2 * pxPer, { kind: 'char', char: tc, node: tc.root }); }
    return best || hit;
  }
  // 손맛 7: what a press lands on dips a little (the same pick as the tap, so the dip also shows what the tap will take)
  pressAt(x, y) {
    if (!this.running || this.paused || this.result || this.cine) return null;
    const hit = this.pickAt(x, y);
    if (!hit.node) return null;
    if (hit.kind === 'item') return hit.item.found ? null : { obj: hit.node, m: .16 };
    return { obj: hit.node, m: hit.kind === 'furn' ? .035 : hit.kind === 'char' ? .07 : .06 };
  }
  pickExact(x, y) {
    const hits = this.G.world.pick(x, y, this.pickRoots());
    if (!hits.length) return { kind: 'none' };
    const d0 = hits[0].distance;
    const ih = hits.find(hh => hh.distance - d0 < .3 && this.classify(hh.object).kind === 'item');
    const first = this.classify((ih || hits[0]).object);
    if (first.kind === 'char') {
      const behind = hits.map(hh => this.classify(hh.object)).find(c => c.kind === 'item' || c.kind === 'part');
      if (behind) return behind;
    }
    return first;
  }
  tap(x, y) {
    if (!this.running || this.paused || this.result || this.cine) return;
    const G = this.G;
    if (this.dizzy > 0) { G.audio.sfx('wobble'); return; }
    const hit = this.pickAt(x, y);
    this.lastTapAt = { x, y };
    if (hit.kind === 'item') {
      const it = hit.item;
      if (it.found) return;
      // the hidden friend is only ever found by its door opening (revealFriend): a tap on it while the door is still swinging
      // used to go to onFound and the stage could never end (level report 10/18 B1, stage 20)
      if (it.friend) { const pt = it.spot?.part; if (!pt || (!pt.busy && pt.t > .5)) this.revealFriend(it); return; }
      if (it.role === 'target') return this.onFound(it);
      if (it.role === 'key' || it.role === 'note' || it.role === 'color' || it.role === 'treat' || it.role === 'tool' || it.role === 'sock' || it.role === 'book' || it.role === 'gadget') return this.onChain(it);
      if (it.role === 'secret') return this.onSecret(it);
      if (it.role === 'clue') return this.onClue(it);   // 1판: 토순이's dropped donut
      // 흑백판: a decoy sitting on a furniture target must not swallow the tap meant for the furniture (level report B3: 17판
      // snack cart, 175 of 204 taps lost)
      const gt = this.grayAt(x, y); if (gt) return this.onFoundFurn(gt);
      return this.onDecoy(it, x, y);
    }
    // 흑백판: a piece of furniture on the list is found by tapping any bit of it
    const ff = hit.kind === 'furn' ? hit.furn : hit.kind === 'part' ? hit.part.furn : null, ft = ff && this.grayTarget(ff);
    if (ft && !ft.found) return this.onFoundFurn(ft);
    if (hit.kind === 'part') return this.onPart(hit.part, x, y);
    if (hit.kind === 'char' && this.trick?.ch && hit.char === this.trick.ch) return this.trick.caught();
    if (hit.kind === 'char') return this.tapChar(hit.char);
    if (hit.kind === 'furn' && hit.furn.type === 'puzzleframe') return this.openPuzzle(hit.furn);
    if (hit.kind === 'furn' && this.plan.tv && hit.furn === this.plan.tv.f) return this.useTv();
    if (hit.kind === 'furn') { this.wobble(hit.furn.group); G.audio.sfx('wobble'); this.addMiss(x, y, false); return; }
    this.addMiss(x, y, true);
  }
  wobble(g) {
    const s0 = g.scale.clone();
    this.tw.run(.28, k => { const w = Math.sin(k * Math.PI * 3) * (1 - k) * .05; g.scale.set(s0.x * (1 + w), s0.y * (1 - w), s0.z * (1 + w)); }, ease.linear).then(() => g.scale.copy(s0));
  }
  addMiss(x, y, penalty) {
    const G = this.G;
    if (penalty && this.timerOn) { this.misses.push(this.t); this.misses = this.misses.filter(t => this.t - t < 3); }
    if (penalty) {
      this.missCount++;
      if (this.spec.tut === 2 && this.missCount === 2) G.ui.toast(DO.zoom, 'green');   // 2판: small things → zoom, once it's needed
      this.taunt('miss');
      if (this.timerOn) { this.time = Math.max(0, this.time - 2); G.ui.floatText(x, y, '-2초', 'red'); }
      G.audio.sfx('miss'); G.world.fx.burst(x, y, { n: 6, colors: ['#ffffff', '#d9c9e8'], shape: 'circle', speed: 120, size: 10, gravity: 0, life: .4 });
      this.setMong('sweat', 'shake');
    }
    if (this.misses.length >= 4) this.makeDizzy();
  }
  makeDizzy() {
    const G = this.G;
    this.dizzy = 1.6; this.misses = [];
    G.audio.sfx('dizzy'); G.ui.toast('어질어질~ 천천히 찾아봐!', 'red');
    this.mongImg.src = G.thumbs.face_mong_dizzy; this.mong.classList.remove('hop', 'shake'); this.mong.classList.add('spin');
    const r = this.mong.getBoundingClientRect();
    G.world.fx.burst(r.left + r.width / 2, r.top, { n: 10, shape: 'star', speed: 160, gravity: 0, life: .9 });
  }

  worldCenter(it) { const b = new THREE.Box3().setFromObject(it.g); return b.getCenter(new THREE.Vector3()); }
  // ── a talk, filmed: the camera comes in close on whoever is speaking (letterbox bars), then back to where you were
  // (user, 10/17: "챗 될때는 카메라 클로즈업해서 시네마틱처럼")
  charFor(who) {
    const all = [this.friend, this.hero?.ch, ...(this.npcs || []).map(n => n.ch)].filter(Boolean);
    return all.find(c => c.kind === who) || (who === 'mong' ? this.hero?.ch : null) || null;
  }
  // talk over the room as it is: no cinematic camera (user, 10/18: "시네마틱 카메라 폐기할께. 너무 느려진다") — the speaker
  // just turns to face you while the dialog box runs
  async talk(lines, opts = {}) {
    const G = this.G, W = G.world, app = document.getElementById('app');
    this.talking = true; app.classList.add('cine');   // (the HUD steps aside for the dialog box, as before)
    const onLine = L => {
      opts.onLine?.(L);
      const ch = this.charFor(L.who); if (ch) ch.faceTo?.(W.cam.position.x, W.cam.position.z);
    };
    try { await playDialog(G, lines, { ...opts, onLine }); }
    finally { this.talking = false; app.classList.remove('cine'); }
  }
  // ── 사건 판: the owner runs and hides, giggles from the hideout, and pops out when it is opened
  async friendHides() {
    if (HIDE_R1 && this.spec.tut !== 1) return this.r1Hide();   // (1판 still shows the hide: it teaches what hiding is)
    const G = this.G, W = G.world, f = this.friend, part = this.plan.incident.part, tw = this.tw;
    this.friendHome = f.root.position.clone();
    const pc = this.partCenter(part), from = f.root.position.clone();
    this.say(f, hideLine(this.idx, this.th.friend), 1300); G.audio.sfx('whoosh');
    await tw.wait(.35);
    // show where it goes if that is off screen, then come back
    const sc = W.toScreen(pc), off = !(sc.x > 30 && sc.x < W.W - 30 && sc.y > 90 && sc.y < W.H - 170), keep = { target: W.target.clone(), zoom: W.zoom };
    if (off) await W.flyTo(tw, { target: pc.clone().setY(W.target.y), dur: .45 });
    f.root.rotation.y = Math.atan2(pc.x - from.x, pc.z - from.z);
    await tw.run(.75, k => { f.root.position.lerpVectors(from, pc, k); f.root.position.y = from.y + (pc.y - from.y) * k + Math.abs(Math.sin(k * Math.PI * 2)) * .35; f.root.scale.setScalar(1 - .75 * Math.max(0, k - .6) / .4); });
    f.root.visible = false; this.friendHidden = true;
    this.wobble(part.furn.group); G.audio.sfx('pop', 2);
    this.giggle('쏙!');
    if (off) await W.flyTo(tw, { ...keep, dur: .45 });
    // (the goal is on the banner and the HUD face; no extra toast on top — 대본 10/18)
  }
  // R1: eyes shut while the friend hides; candidates and a crumb trail
  async r1Hide() {
    const G = this.G, W = G.world, f = this.friend, real = this.plan.incident.part, tw = this.tw;
    this.friendHome = f.root.position.clone();
    const others = [];
    for (const e of (this.room.rooms || [this.room]).flatMap(R => R.furns)) {
      if (!R1_HIDE.includes(e.type) || e.f === real.furn) continue;
      const p = (e.f.parts || []).find(q => q !== real && !q.lock && !q.isLever && !q.isGadget && !q.dig && !q.secret && !q.secretShelf && ['door', 'lid', 'drawer', 'lift'].includes(q.kind));
      if (p) others.push(p);
    }
    others.sort(() => Math.random() - .5);
    this.r1 = { real, cands: [real, ...others.slice(0, 2)], miss: 0, told: new Set(), objs: [] };
    this.say(f, hideLine(this.idx, this.th.friend), 1100);
    await tw.wait(.6);
    const ov = h('div', { class: 'r1-eyes' }, h('b', { class: 'ol' }, R1.close), this.r1N = h('span', { class: 'ol' }, ''));
    document.getElementById('overlay').append(ov);
    f.root.visible = false;
    for (const n of R1.nums) { if (this.dead) return; this.r1N.textContent = n; G.audio.sfx('tock'); await tw.wait(.6); }
    G.audio.sfx('tap', 12); await tw.wait(.15); G.audio.sfx('tap', 14); await tw.wait(.2); G.audio.sfx(real.sfx || 'open'); await tw.wait(.35); G.audio.sfx('close');
    ov.classList.add('out'); setTimeout(() => ov.remove(), 300);
    this.friendHidden = true; this.r1Trail();
    // a word from the hideout once it's done (the bubble over the hiding place, not the friend)
    setTimeout(() => !this.dead && this.friendHidden && this.say({ root: { position: this.partCenter(real) }, headTop: () => .25 }, r1Line(this.th.friend, 'hidden'), 1300), 400);
  }
  r1Trail() {
    const real = this.r1.real, pc = this.partCenter(real), y = new THREE.Vector3(); real.furn.group.getWorldPosition(y);
    const from = this.friendHome || new THREE.Vector3(), n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const k = .45 + i * .2, g = buildItem(['candy', 'cookie', 'acorn'][i % 3]);
      g.scale.multiplyScalar(.55); g.traverse(o => { o.raycast = () => {}; });
      g.position.set(from.x + (pc.x - from.x) * k + (Math.random() - .5) * .25, y.y + .02, from.z + (pc.z - from.z) * k + (Math.random() - .5) * .25);
      g.rotation.y = Math.random() * 6; this.room.group.attach(g); this.r1.objs.push(g);
    }
    this.G.world.idsDirty = true; this.G.world.shadowDirty = true;
    if (this.hero?.ch) setTimeout(() => !this.dead && this.say(this.hero.ch, r1Line(this.th.friend, 'crumbs'), 1500), 1900);   // 몽글이 notices the trail
  }
  r1Wrong(part) {
    const R = this.r1; R.told.add(part); R.miss++;
    const pc = this.partCenter(part);
    const k = this.th.friend;
    this.say({ root: { position: pc }, headTop: () => .25 }, r1Line(k, 'wrong', R.miss - 1), 1200); this.G.audio.sfx('miss');
    setTimeout(() => { if (this.dead || !this.friendHidden) return; if (R.miss >= 3) { this.giggle(r1Line(k, 'near')); setTimeout(() => !this.dead && this.friendHidden && this.giggle(r1Line(k, 'real')), 900); } else this.giggle(r1Line(k, 'real')); }, 700);
  }
  hideSay(lines) { if (this.t - (this._hsT ?? -99) < 4) return; this._hsT = this.t; this.giggle(lines[(this._hn = (this._hn || 0) + 1) % lines.length]); this.gigT = 7; }
  giggle(line) {
    const part = this.plan.incident?.part; if (!part) return;
    const L = hidePool(this.idx, this.th.friend, 'stuck');   // 대본: the host's own tell (토순이's tail, 곰돌이's snore…)
    const pc = this.partCenter(part);
    this.wobble(part.furn.group); this.G.audio.sfx('wobble');
    this.say({ root: { position: pc }, headTop: () => .25 }, line || L[(this._gn = (this._gn || 0) + 1) % L.length], 1300);
  }
  async revealFriend(it) {
    if (it.found || this.result) return;
    const G = this.G, W = G.world, f = this.friend, tw = this.tw;
    it.found = true; this.found++; this.friendHidden = false; this.idle = 0;
    const pc = this.partCenter(it.spot.part), fy = new THREE.Vector3(); it.spot.part.furn.group.getWorldPosition(fy);
    const d = new THREE.Vector3(W.cam.position.x - pc.x, 0, W.cam.position.z - pc.z).normalize(), to = pc.clone().addScaledVector(d, .95); to.y = fy.y;
    f.root.visible = true; f.root.position.copy(pc); f.root.scale.setScalar(.25); f.setFace('happy'); f.pose = 'cheer';
    G.audio.sfx('special'); G.hitstop(.08);
    const s = W.toScreen(pc); W.fx.burst(s.x, s.y, { n: 34, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 360 }); W.fx.ring(s.x, s.y, { r: 130, color: '#ffe14d', width: 10 });
    it.slot?.classList.add('found', 'bump');
    await tw.run(.6, k => { f.root.position.lerpVectors(pc, to, k); f.root.position.y = pc.y + (to.y - pc.y) * k + Math.sin(k * Math.PI) * .7; f.root.scale.setScalar(.25 + .75 * Math.min(1, k * 1.7)); });
    f.faceTo(W.cam.position.x, W.cam.position.z);
    this.tail?.mesh.parent?.remove(this.tail.mesh); this.tail = null;   // 1판: the tail goes back in with her
    // the room lights up: out of the dark, or a warm glow over the day
    const to2 = this.th.light || null, a0 = W.hemi.intensity, s0 = W.sun.intensity;
    if (this.dark || this.spec.night) { this.dark = false; W.setLight(to2); G.setBg(this.th.bg); const a1 = W.hemi.intensity, s1 = W.sun.intensity; await tw.run(.6, k => { W.hemi.intensity = a0 + (a1 - a0) * k; W.sun.intensity = s0 + (s1 - s0) * k; }); }
    else await tw.run(.5, k => { const g = 1 + Math.sin(k * Math.PI) * .35; W.hemi.intensity = a0 * g; W.sun.intensity = s0 * g; });
    W.fx.confetti(70);
    await tw.wait(.9);
    // 대본: the host says what was really going on — once, after the pop-out (no bubble + dialog twice, no stock "next room" ad)
    if (!this.dead && !G.skipTalk && !G.bot) await this.talk(incidentReveal(this.idx, this.th.friend), { title: this.th.name });
    if (!this.result && !this.dead) this.win();
  }
  cutFlash() { const f = h('div', { class: 'cutflash' }); document.getElementById('app').append(f); setTimeout(() => f.remove(), 260); }
  // ── 흑백판
  setupGray() {
    const G = this.G, W = G.world, r = this.plan.rotSeed;
    if (W.post) W.post.u.gray.value = 1;
    // a few pieces of furniture join the list: big and easy, they set how hard the stage is
    const RS = this.room.rooms || [this.room], k = this.idx < 12 ? 2 : 3, used = new Set();
    const tall = e => new THREE.Box3().setFromObject(e.f.group).getSize(new THREE.Vector3()).y > .3;   // not a flat thing on the ground (a hopscotch, a manhole): hard to tap
    const cands = r.shuffle(RS.flatMap(R => R.furns).filter(e => e.type !== 'rug' && !e.type.startsWith('lever') && !(e.y > 1) && tall(e) && G.hasThumb('furn_' + e.type)));
    this.grayFurn = new Map();
    const pick = [];
    for (const e of cands) { if (pick.length >= k || used.has(e.type)) continue; used.add(e.type); pick.push(e); }
    G.needThumbs(pick.map(e => 'furn_' + e.type));   // just these icons, in one batch
    for (const e of pick) {
      const it = { type: 'furn:' + e.type, role: 'target', furnTarget: e, g: e.f.group, spot: { kind: 'on', label: FURN_NAME(e.type), part: null }, found: false, thumb: G.thumbs['furn_' + e.type] };
      this.grayFurn.set(e.f, it); this.targets.push(it);
    }
    if (G.skipTalk || G.bot) setTimeout(() => !this.dead && G.ui.toast('색을 잃은 방! 찾을 때마다 색이 돌아와 — 큰 가구도 찾아 봐', 'green'), 1500);
  }
  colorIn(g) { g.userData.colored = true; this.G.world.idsDirty = true; }
  // 흑백판: the list names a kind of furniture, so any piece of that kind counts (level report B4: two art crates on stage 3,
  // only one — off screen — was accepted). The one you tapped is the one that gets its colour back.
  grayTarget(ff) {
    if (!this.grayFurn?.size) return null;
    const own = this.grayFurn.get(ff); if (own && !own.found) return own;
    const type = (this.room.rooms || [this.room]).flatMap(R => R.furns).find(r => r.f === ff)?.type; if (!type) return own || null;
    const t = [...this.grayFurn.values()].find(q => !q.found && q.type === 'furn:' + type); if (!t) return own || null;
    t.g = ff.group; return t;
  }
  grayAt(x, y) {
    if (!this.grayFurn?.size) return null;
    for (const hh of this.G.world.pick(x, y, [this.room.group])) {
      const c = this.classify(hh.object), f2 = c.kind === 'furn' ? c.furn : c.kind === 'part' ? c.part.furn : null;
      const t = f2 && this.grayTarget(f2); if (t && !t.found) return t;
    }
    return null;
  }
  async onFoundFurn(it) {
    const G = this.G, W = G.world;
    it.found = true; this.idle = 0; this.found++;
    setTimeout(() => !this.dead && this.taunt('furn'), 500);
    const c = this.worldCenter(it), s = W.toScreen(c);
    this.colorIn(it.g);
    W.fx.burst(s.x, s.y, { n: 22, colors: ['#ff8fb8', '#ffe14d', '#8fd3f4', '#9be38f'], speed: 320 });
    W.fx.ring(s.x, s.y, { r: 110, color: '#ffe14d', width: 9 });
    G.audio.sfx('found', this.found); G.ui.floatText(s.x, s.y - 50, it.spot.label + '!', 'gold');
    const g = it.g, s0 = g.scale.clone();
    this.tw.run(.3, k => { const w = Math.sin(k * Math.PI) * .08; g.scale.set(s0.x * (1 + w), s0.y * (1 + w * 1.4), s0.z * (1 + w)); }).then(() => g.scale.copy(s0));
    this.tnum.textContent = `${this.found}/${this.targets.length}`; this.tbarI.style.width = (this.found / this.targets.length * 100) + '%';
    this.setMong('happy', 'hop');
    await G.ui.flyImg(it.thumb, s.x, s.y, it.slot, { size: 70, dur: 560 });
    it.slot.classList.add('found', 'bump'); G.audio.sfx('pop', this.found);
    if (this.targets.every(t => t.found) && !this.result) this.win();
  }
  async onFound(it) {
    const G = this.G, W = G.world;
    it.found = true; this.idle = 0; this.found++;
    this.combo = this.t - this.lastFind < 3.5 ? this.combo + 1 : 1; this.lastFind = this.t;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const c = this.worldCenter(it), s = W.toScreen(c);
    W.fx.burst(s.x, s.y, { n: 14 + this.combo * 4, speed: 300 + this.combo * 30 });
    W.fx.ring(s.x, s.y, { r: 80, color: '#ffe14d', width: 8 });
    // a warm glow blooms out from the spot (bigger with the combo), and whoever is nearby is glad for you
    const bloom = h('div', { class: 'found-bloom', style: `left:${s.x}px;top:${s.y}px;--s:${1 + Math.min(this.combo - 1, 3) * .25}` });
    G.ui.wui.append(bloom); setTimeout(() => bloom.remove(), 900);
    for (const ch of [this.friend, ...(this.npcs || []).map(n => n.ch)]) if (ch?.root && ch.root.getWorldPosition(new THREE.Vector3()).distanceTo(c) < 2.4) { ch.bump?.(.35); }
    G.audio.sfx('found', this.found + this.combo);
    if (this.combo >= 2) {
      const bonus = Math.min(this.combo - 1, 3);
      if (this.timerOn) this.time = Math.min(this.timeMax, this.time + bonus);
      G.ui.floatText(s.x, s.y - 50, `콤보 x${this.combo}!`, 'gold big');
      if (this.combo >= 3) { G.hitstop(.06); }
    } else G.ui.floatText(s.x, s.y - 40, ITEMS[it.type].name + '!', 'gold');
    // the first stages cheer a lot: the player is still getting attached (user, 2026-10-16: "처음엔 칭찬 많이") — in the
    // friend's own voice where the script has it (대본 10/18: 2판 토순이 about each thing of hers, 미술관 곰돌이 on the first colour)
    const sc = this.scene, left = this.targets.filter(t => !t.found).length;
    if (sc?.finds && !this.incident && left > 0) { const F = sc.finds, line = left === 1 ? F[F.length - 1] : F[Math.min(this.found - 1, F.length - 2)]; setTimeout(() => !this.dead && this.say(this.friend, line, 1500), 250); }
    else if (sc?.firstColor && this.found === 1) setTimeout(() => !this.dead && this.say(this.friend, sc.firstColor, 1600), 300);
    else if (!this.custom && !this.preview && this.idx < 6) {
      const P = ['잘 찾았어!', '눈썰미 최고!', '우와 천재야!', '어떻게 알았어?!', '탐정 소질 있다!', '완벽해!', '역시 너야!', '반짝반짝 눈!'];
      setTimeout(() => !this.dead && G.ui.floatText(s.x, s.y - 92, P[(this.found + this.idx * 3) % P.length], 'gold big'), 220);
    }
    if (this.spec.timed) this.tlEl.textContent = `너굴이가 세는 중 · ${this.found}/${this.targets.length}`;
    else if (this.incident) { const b = this.targets.filter(t => !t.friend), bf = b.filter(t => t.found).length; this.tnum.textContent = `${bf}/${b.length}`; this.tbarI.style.width = (bf / Math.max(1, b.length) * 100) + '%'; }
    else { this.tnum.textContent = `${this.found}/${this.targets.length}`; this.tbarI.style.width = (this.found / this.targets.length * 100) + '%'; }
    this.setMong('happy', 'hop');
    if (it.role === 'target' && this.found % 2 === 1) setTimeout(() => !this.dead && this.taunt('found'), 500);   // 흑백판: the owner is a sore loser
    if (this.tutStep === 2) this.tutDone();
    const g = it.g, s0 = g.scale.x;
    if (this.spec.gray) {   // a found thing in a 흑백판 stays where it was, in full colour
      this.colorIn(g);
      this.tw.run(.35, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .45)), ease.linear).then(() => g.scale.setScalar(s0));
    } else {
      await this.tw.run(.16, k => g.scale.setScalar(s0 * (1 + .7 * k)), ease.outBack);
      g.visible = false;
      it.spot.item = null;
      g.parent?.remove(g);
    }
    const img = G.thumbs['item_' + it.type];
    await G.ui.flyImg(img, s.x, s.y, it.slot, { size: 70, dur: 560 });
    it.slot.classList.add('found', 'bump');
    G.audio.sfx('pop', this.found);
    if (this.incident && this.friendHidden && !it.friend && Math.random() < .5) setTimeout(() => !this.dead && this.hideSay(BONUS_SAY), 700);
    if (!this.incident && this.targets.every(t => t.found) && !this.result) this.win();   // 사건 판: finding the friend ends it, the rest is bonus
  }
  async onChain(it) {
    const G = this.G, W = G.world;
    if (this.incident && this.friendHidden) setTimeout(() => !this.dead && this.hideSay(hidePool(this.idx, this.th.friend, 'clue')), 900);   // the host hears you find a clue
    it.found = true; this.idle = 0;
    const c = this.worldCenter(it), s = W.toScreen(c);
    W.fx.burst(s.x, s.y, { n: 18, colors: ['#ffe14d', '#ffffff', '#ffd23f'] });
    G.audio.sfx('special');
    it.g.visible = false; it.spot.item = null; it.g.parent?.remove(it.g);
    if (it.role === 'treat') {
      this.treats++;
      if (!this.treatPill) { this.treatPill = h('div', { class: 'pill treat' }, h('img', { src: G.thumbs['item_' + it.type] }), h('span', { class: 'v' }, '')); this.inv.append(this.treatPill); }
      this.treatPill.style.display = ''; this.treatPill.querySelector('.v').textContent = 'x' + this.treats;
      await G.ui.flyImg(G.thumbs['item_' + it.type], s.x, s.y, this.treatPill, { size: 64 });
      G.ui.toast(`${ITEMS[it.type].name} 획득! ${CHAR_DEFS[this.friend.kind]?.name || '친구'}한테 갖다 주자`, 'green');
      return;
    }
    if (it.role === 'gadget') {
      this.gadgets.add(it.code);
      const P = this.toolPill; P.style.display = ''; P.classList.remove('need'); P.querySelector('.v').textContent = ITEMS[it.type].name; P.querySelector('img').src = G.thumbs['item_' + it.type];
      await G.ui.flyImg(G.thumbs['item_' + it.type], s.x, s.y, P, { size: 64 });
      P.classList.add('pop'); setTimeout(() => P.classList.remove('pop'), 300);
      G.ui.toast(it.code === 'vacremote' ? '청소기 리모컨이다! 로봇청소기를 깨워 볼까?' : '건조대 손잡이 찾았다! 벽의 손잡이 구멍에 끼워 보자', 'green');
      this.pointAt(it.forPart);
      return;
    }
    if (it.role === 'book') {
      this.hasBook = true;
      const P = this.toolPill; P.style.display = ''; P.classList.remove('need'); P.querySelector('.v').textContent = '그림책'; P.querySelector('img').src = G.thumbs.item_spinebook;
      await G.ui.flyImg(G.thumbs.item_spinebook, s.x, s.y, P, { size: 64 });
      P.classList.add('pop'); setTimeout(() => P.classList.remove('pop'), 300);
      G.ui.toast('빠진 그림책 찾았다! 책장에 꽂아 보자', 'green');
      this.pointAt(it.forPart);
      return;
    }
    if (it.role === 'sock') {
      (this.socks || (this.socks = new Set())).add(it.code);
      const P = this.toolPill; P.style.display = ''; P.classList.remove('need'); P.querySelector('.v').textContent = '짝 양말'; P.querySelector('img').src = this.sockImg(it.code);
      await G.ui.flyImg(this.sockImg(it.code), s.x, s.y, P, { size: 64 });
      P.classList.add('pop'); setTimeout(() => P.classList.remove('pop'), 300);
      G.ui.toast('짝 양말 찾았다! 세탁기에 걸린 양말한테 데려다 줘', 'green');
      return;
    }
    if (it.role === 'tool') {
      this.tools.add(it.type);
      const P = this.toolPill; P.style.display = ''; P.classList.remove('need'); P.querySelector('.v').textContent = ITEMS[it.type].name; P.querySelector('img').src = G.thumbs['item_' + it.type];
      await G.ui.flyImg(G.thumbs['item_' + it.type], s.x, s.y, P, { size: 64 });
      P.classList.add('pop'); setTimeout(() => P.classList.remove('pop'), 300);
      G.ui.toast(it.type === 'remote' ? '리모컨 획득! TV를 톡 눌러서 켜 보자' : `${ITEMS[it.type].name} 획득! 모래밭의 빨간 X를 톡!`, 'green');
      return;
    }
    if (it.role === 'key') {
      this.keys++;
      this.keyPill.style.display = ''; this.keyPill.classList.remove('need'); this.keyPill.set(String(this.keys));
      await G.ui.flyImg(G.thumbs.item_key, s.x, s.y, this.keyPill, { size: 64 });
      this.keyPill.classList.add('pop'); setTimeout(() => this.keyPill.classList.remove('pop'), 300);
      G.ui.toast('열쇠 획득! 잠긴 상자를 열어봐', 'green');
      this.pointAt(it.forPart);
    } else if (it.role === 'color') {
      this.colorCodes.add(it.code);
      this.colorPill.style.display = ''; this.colorPill.classList.remove('need');
      this.colorPill.querySelector('.v').innerHTML = it.code.split('').map(d => `<i class="cdot" style="background:${LOCK_COLORS[+d][0]}"></i>`).join('');
      await G.ui.flyImg(G.thumbs.item_colornote, s.x, s.y, this.colorPill, { size: 64 });
      G.ui.toast(`색깔 순서: ${it.code.split('').map(d => LOCK_COLORS[+d][1]).join(' → ')}`, 'green');
      this.pointAt(it.forPart);
    } else if (it.piece != null) {
      // a scrap of the password: show what we have, the lock opens once every scrap is in
      const got = this.scraps[it.code] || (this.scraps[it.code] = new Set()); got.add(it.piece);
      const shown = it.code.split('').map((d, i) => got.has(i) ? d : '?').join(' ');
      this.codePill.style.display = ''; this.codePill.set(shown);
      await G.ui.flyImg(G.thumbs.item_notepiece || G.thumbs.item_note, s.x, s.y, this.codePill, { size: 64 });
      if (got.size >= it.code.length) {
        this.codes.add(it.code); this.codePill.classList.remove('need');
        G.audio.sfx('unlock'); G.ui.toast(`쪽지 조각을 다 모았다! 비밀번호 ${it.code.split('').join(' ')}`, 'green');
        this.pointAt(it.forPart);
      } else G.ui.toast(`쪽지 조각 ${got.size}/${it.code.length}! 나머지 조각도 어딘가에 있어`, 'green');
      return;
    } else {
      this.codes.add(it.code);
      this.codePill.style.display = ''; this.codePill.classList.remove('need'); this.codePill.set(it.code.split('').join(' '));
      await G.ui.flyImg(G.thumbs.item_note, s.x, s.y, this.codePill, { size: 64 });
      G.ui.toast(`비밀번호는 ${it.code}! 금고를 열어봐`, 'green');
      this.pointAt(it.forPart);
    }
  }
  // 사건 판: a clue shows where it goes — the camera glances at the lock it opens (when that is off screen), the lock
  // hops, and if it is the hideout the friend inside panics. Each step of the chain points at the next.
  async pointAt(part) {
    if (!this.incident || !part?.lock || this.dead) return;
    const G = this.G, W = G.world, tw = this.tw, pc = this.partCenter(part), sc = W.toScreen(pc);
    const off = !(sc.x > 30 && sc.x < W.W - 30 && sc.y > 90 && sc.y < W.H - 170);
    const keep = { target: W.target.clone(), zoom: W.zoom };
    const moved = off && !this.botOn() && !this.talking;
    if (moved) { await tw.wait(.25); await W.flyTo(tw, { target: pc.clone().setY(W.target.y), dur: .5 }); }
    if (this.dead) return;
    const lm = part.lockMesh;
    if (lm) { const s0 = lm.scale.clone(), y0 = lm.position.y; await tw.run(.5, k => { const b = Math.sin(k * Math.PI * 2) * (1 - k); lm.position.y = y0 + Math.abs(b) * .08; lm.scale.copy(s0).multiplyScalar(1 + Math.abs(b) * .5); }, ease.linear); lm.position.y = y0; lm.scale.copy(s0); }
    else this.wobble(part.furn.group);
    const s2 = W.toScreen(pc); W.fx.burst(s2.x, s2.y, { n: 10, colors: ['#ffe14d', '#ffffff'] });
    if (part === this.plan.incident?.part && this.friendHidden) this.hideSay(hidePool(this.idx, this.th.friend, 'lock'));
    if (moved) { await tw.wait(.45); if (!this.dead && !this.result) await W.flyTo(tw, { ...keep, dur: .45 }); }
  }
  // ── 비밀 서재: put the missing book back, set the rainbow right, and the bookcase rolls aside
  async onSpine(part) {
    const G = this.G, S = this.plan.showcase;
    if (!S) return;
    if (!this.hasBook) {
      G.audio.sfx('locked'); this.wobble(part.furn.group);
      G.ui.toast('무지개 그림책 한 권이 빠져 있어! 방 어딘가에서 찾아 줘', 'red');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs.item_spinebook;
      return;
    }
    if (S.missing >= 0) {
      S.missing = -1; S.shelf.furn.spines.draw(S.order, -1); G.audio.sfx('pop', 3);
      this.toolPill.style.display = 'none';
      G.ui.toast('쏙! 그림책을 꽂았어. 이제 그림을 맞춰 볼까?', 'green');
      await this.tw.wait(.5); if (this.dead) return;
    }
    this.paused = true;
    const ok = await spinePuzzle(G, S.order);
    this.paused = false; this.idle = 0;
    S.shelf.furn.spines.draw(S.order, -1);
    if (!ok || this.dead) return;
    this.cine = true; await this.tw.wait(1.15); if (this.dead) return;   // let the '무지개 완성!' card finish first
    await this.solveShowcase();
  }
  async solveShowcase() {
    const G = this.G, W = G.world, tw = this.tw, S = this.plan.showcase, shelf = S.shelf, door = S.door;
    shelf.lock = null; shelf.busy = true; this.cine = true;
    const pc = this.partCenter(door);
    await W.flyTo(tw, { target: new THREE.Vector3(pc.x, Math.max(W.target.y, 1.0), pc.z), zoom: Math.max(W.zoom, 1.7), dur: .6 });
    shelf.furn.spines.draw(S.order, -1, true); G.audio.sfx('special');
    const sp = W.toScreen(this.partCenter(shelf)); W.fx.burst(sp.x, sp.y, { n: 18, shape: 'star', colors: ['#ffe14d', '#ffffff', '#ff8fb8'] });
    await tw.wait(.45); shelf.furn.spines.draw(S.order, -1);
    if (this.friendHidden) this.hideSay(['헉! 책장이 움직인다?!']);
    G.audio.sfx('door');
    await tw.run(1.0, k => { shelf.setOpen(k); W.shadowDirty = true; }, ease.inOutCubic);
    shelf.stuck = true; shelf.busy = false; this.partsOpened++;
    const fp = W.toScreen(this.partCenter(shelf).setY(.05)); W.fx.burst(fp.x, fp.y, { n: 14, colors: ['#e6d3ad', '#fff3d0', '#c9a37a'], shape: 'circle', speed: 160, up: 60, size: 6, life: .5 });
    // close in on the cupboard and the marble run above it
    const nc = this.partCenter(door);
    await W.flyTo(tw, { target: new THREE.Vector3(nc.x, nc.y + .45, nc.z), zoom: Math.max(W.zoom, 2.6), dur: .5 });
    await shelf.furn.marbleRun(tw, (n, p) => G.audio.sfx(n, p));
    door.lock = null; this.cine = false;
    await tw.wait(.15);
    if (!this.dead) await this.togglePart(door, true);
  }
  async freeJailed() {
    const J = this.jailed, ch = J.ch, W = this.G.world; J.in = false;
    const P = ch.root.position, t = (this.freeTiles || []).filter(q => Math.hypot(q.x - P.x, q.z - P.z) < 3).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0] || null;
    ch.setFace?.('happy'); this.say(ch, '드디어 자유다~! 고마워! 진짜 범인은 잉키야!', 2000); this.G.audio.sfx('special');
    if (t) { await ch.hopTo?.(this.tw, t.x, t.z, { height: .6, dur: .55 }); ch.root.position.y = t.y || 0; ch.faceTo?.(W.cam.position.x, W.cam.position.z); }
  }
  // ── 아파트 장치판: the remote wakes the robot vacuum, the crank winds the drying rack down
  async useGadget(part) {
    const G = this.G, L = part.lock;
    if (!this.gadgets.has(L.code)) {
      G.audio.sfx('locked'); this.wobble(part.furn.group);
      G.ui.toast(L.code === 'vacremote' ? '로봇청소기가 쿨쿨 자고 있어… 리모컨이 있으면 깨울 수 있을 텐데' : '손잡이가 빠져 있어! 건조대를 내릴 손잡이를 찾아봐', 'red');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs['item_' + (L.code === 'vacremote' ? 'vacremote' : 'crank')];
      return;
    }
    this.gadgets.delete(L.code); this.toolPill.style.display = 'none';
    part.lock = null; this.idle = 0;
    if (part.robotVac) return this.runVacuum(part);
    if (part.dryRack) return this.lowerRack(part);
    return this.togglePart(part, true);
  }
  async runVacuum(part) {
    const G = this.G, W = G.world, tw = this.tw, f = part.furn, rb = f.robot;
    part.stuck = true; this.cine = true; this.partsOpened++;
    const key = this.items.find(i => i.vacHidden && !i.found);
    // its round: under the sofa in this room if there is one (else to the middle of the room), then back out in front of it
    const R0 = this.room.rooms?.find(R => R.furns.some(r => r.f === f)) || this.room;
    const sofa = R0.furns.find(r => ['sofa2', 'sofa', 'bed', 'kotatsu'].includes(r.type));
    const V3 = THREE.Vector3;
    let under, front;
    if (sofa) {
      const c = new THREE.Box3().setFromObject(sofa.f.group).getCenter(new V3()).setY(0);
      const fwd = new V3(0, 0, 1).applyQuaternion(sofa.f.group.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
      under = c.clone().addScaledVector(fwd, .05); front = c.clone().addScaledVector(fwd, .85);
    } else { under = R0.group.getWorldPosition(new V3()).setY(0); front = under.clone().add(new V3(.7, 0, .7)); }
    const out = front.clone().addScaledVector(new V3().subVectors(front, under).normalize(), .3);
    const loc = v => { const q = f.group.worldToLocal(v.clone().setY(f.group.getWorldPosition(new V3()).y)); q.y = 0; return q; };
    const here = () => rb.getWorldPosition(new V3());
    await W.flyTo(tw, { target: here().setY(W.target.y), zoom: Math.max(W.zoom, 2.2), dur: .5 });
    const bot = { root: { position: here() }, headTop: () => .15 };
    this.say(bot, '삐빅! 청소 시작!', 1300); G.audio.sfx('special');
    const drive = async (to, speed = 1.3) => {
      const from = rb.position.clone(), tl = loc(to), d = tl.clone().sub(from);
      const a0 = rb.rotation.y, a1 = Math.atan2(d.x, d.z);
      let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      await tw.run(.25, k => { rb.rotation.y = a0 + da * k; });
      G.audio.sfx('swish');
      let lastPuff = 0;
      await tw.run(Math.max(.3, d.length() / speed), k => {
        rb.position.lerpVectors(from, tl, k); f.robotLed.scale.setScalar(1 + .3 * Math.sin(k * 30)); const hp = here(); bot.root.position.copy(hp); W.shadowDirty = true;
        W.target.x += (hp.x - W.target.x) * .12; W.target.z += (hp.z - W.target.z) * .12;   // the camera follows it round the room
        if (k - lastPuff > .12) { lastPuff = k; const sp = W.toScreen(hp); W.fx.burst(sp.x, sp.y, { n: 3, shape: 'circle', colors: ['#ffffff', '#e8ecf4'], speed: 50, up: 30, size: 5, life: .45 }); }
      }, ease.inOutSine);
    };
    await drive(front);
    await drive(under, .9);
    // rummaging under the sofa
    for (let i = 0; i < 3; i++) { G.audio.sfx('tock', 2 + i); await tw.run(.18, k => { rb.rotation.y += Math.sin(k * Math.PI) * .12 * (i % 2 ? 1 : -1); }); }
    if (sofa) this.wobble(sofa.f.group);
    if (key) { key.g.visible = true; W.idsDirty = true; }
    await drive(out, 1.0);
    this.cine = false;
    bot.root.position.copy(here());
    if (key) {
      key.vacHidden = false;
      const s2 = W.toScreen(this.worldCenter(key)); W.fx.burst(s2.x, s2.y, { n: 16, shape: 'star', colors: ['#ffe14d', '#ffffff'] }); G.audio.sfx('pop', 3);
      this.say(bot, '삐빅! 소파 밑에서 이런 게 나왔어요!', 1800);
      G.ui.toast('청소기가 소파 밑에서 열쇠를 물고 나왔어! 톡 집어 봐', 'green');
      if (this.friendHidden) setTimeout(() => !this.dead && this.hideSay(['헉, 그 열쇠를 찾았어?!']), 1200);
    }
  }
  async lowerRack(part) {
    const G = this.G, W = G.world, tw = this.tw, f = part.furn;
    const pc = this.partCenter(part);
    await W.flyTo(tw, { target: pc.clone().setY(Math.max(1.0, pc.y - .7)), zoom: Math.max(W.zoom, 1.7), dur: .5 });
    f.crank.visible = true; G.audio.sfx('pop', 2);
    if (this.friendHidden) this.hideSay(['으아, 내려간다~!']);
    tw.run(1.1, k => { f.crank.rotation.z = -k * Math.PI * 6; });
    await this.togglePart(part, true);
  }
  onDecoy(it, x, y) {
    const G = this.G, g = it.g, r0 = g.rotation.z;
    this.tw.run(.35, k => { g.rotation.z = r0 + Math.sin(k * Math.PI * 4) * (1 - k) * .35; }, ease.linear);
    G.audio.sfx('wobble');
    G.ui.floatText(x, y - 30, it.type === 'sockp' ? '무늬가 달라~' : '이건 아니야~', '');
    this.addMiss(x, y + 20, true);
  }
  partCenter(part) { const b = new THREE.Box3(); part.pivots.forEach(p => b.expandByObject(p)); return b.getCenter(new THREE.Vector3()); }
  async onPart(part, x, y) {
    const G = this.G, W = G.world;
    if (part.busy) return;
    this.idle = Math.max(0, this.idle - 4);
    if (part.isLever) return this.pullLever(part);
    if (part.dig && part.t > .5) return;   // dug out: nothing to fill back in
    // stuck on the same lock twice: 척척 로봇 offers to do it for coins (for players who'd rather not puzzle)
    if (part.stuck) { this.wobble(part.furn.group); G.audio.sfx('wobble'); return; }
    if (part.lock?.kind === 'spine') return this.onSpine(part);
    if (part.lock?.kind === 'gadget') return this.useGadget(part);
    if (part.isGadget) { this.wobble(part.furn.group); G.audio.sfx('wobble'); return; }
    if (part.lock?.kind === 'marble') {
      G.audio.sfx('locked'); this.shakePart(part);
      G.ui.toast('빗장이 걸려 있어… 위에 있는 구슬 장치가 풀어 줄 것 같아', 'red');
      return;
    }
    if (this.jailed?.in && part === this.jailed.door && part.lock && !this.canOpen(part)) this.say(this.jailed.ch, '열쇠! 열쇠가 있어야 해~!', 1400);
    if (part.lock && !this.canOpen(part) && !this.custom && !this.botOn()) { part._fails = (part._fails || 0) + 1; if (part._fails === 2 || part._fails === 5) setTimeout(() => !this.dead && !this.result && part.lock && this.offerRobot(part), 900); }
    if (part.lock?.kind === 'dig') return this.digUp(part);
    if (part.lock?.kind === 'sock') return this.matchSock(part, x, y);
    // 대본 (10/18): the first time you touch a kind of lock you can't open yet, a 🆕 card shows how it works, and the
    // friend hiding behind it gives themselves away
    if (part.lock && !this.custom && !this.canOpen(part)) {
      if (['pad', 'code', 'color', 'lever', 'treat'].includes(part.lock.kind) && !part.lock.tv) { this.paused = true; await newCard(G, part.lock.kind); this.paused = false; if (this.dead) return; }
      if (part === this.plan.incident?.part && this.friendHidden) this.hideSay(hidePool(this.idx, this.th.friend, 'lock'));
    }
    if (part.lock) {
      const L = part.lock;
      if (L.kind === 'lever') {
        G.audio.sfx('locked'); this.shakePart(part);
        G.ui.toast('쇠사슬로 묶여 있어! 벽 어딘가의 레버를 당겨 봐', 'red');
        return;
      }
      if (L.kind === 'treat') {
        if (this.treats <= 0) {
          const f = this.friend, ls = this.story?.lines?.blocked || ['비켜 줄 생각 없어!'];
          f.react(this.tw, (n, p) => G.audio.sfx(n, p)); this.say(f, ls[(this._blk = (this._blk || 0) + 1) % ls.length], 1500);
          G.ui.toast(`${CHAR_DEFS[f.kind]?.name || '친구'}가 비켜 주지 않아! 좋아하는 간식을 찾아 줘`, 'red');
          return;
        }
        this.treats--; this.treatPill && (this.treatPill.style.display = this.treats > 0 ? '' : 'none');
        await this.feedGuard();
        part.lock = null;
        return this.onPart(part, x, y);
      }
      if (L.kind === 'code' && L.puzzle && !this.codes.has(L.code)) {
        G.audio.sfx('locked'); this.shakePart(part);
        G.ui.toast('비밀번호를 모르겠어… 벽의 퍼즐 액자를 맞춰 봐!', 'red');
        return;
      }
      const can = L.kind === 'pad' ? this.keys > 0 : L.kind === 'color' ? this.colorCodes.has(L.code) : this.codes.has(L.code);
      if (!can) {
        G.audio.sfx('locked');
        const s0 = part.furn.group.position.x;
        this.tw.run(.3, k => { part.furn.group.position.x = s0 + Math.sin(k * Math.PI * 6) * (1 - k) * .04; }, ease.linear).then(() => part.furn.group.position.x = s0);
        if (part.lockMesh) { const m = part.lockMesh, y0 = m.position.y; this.tw.run(.3, k => { m.position.y = y0 + Math.sin(k * Math.PI) * .06; m.rotation.z = Math.sin(k * Math.PI * 4) * .3 * (1 - k); }, ease.linear).then(() => { m.position.y = y0; m.rotation.z = 0; }); }
        if (L.kind === 'pad') { G.ui.toast('잠겨 있어! 열쇠를 찾아봐', 'red'); this.keyPill.style.display = ''; this.keyPill.classList.add('need'); this.keyPill.set('?'); }
        else if (L.kind === 'color') { G.ui.toast('색깔 자물쇠야! 색깔 순서 카드를 찾아봐', 'red'); this.colorPill.style.display = ''; this.colorPill.classList.add('need'); this.colorPill.querySelector('.v').textContent = '? ? ?'; }
        else { G.ui.toast(L.tv ? '비밀번호가 필요해! TV에 나올지도…?' : '비밀번호가 필요해! 쪽지를 찾아봐', 'red'); this.codePill.style.display = ''; this.codePill.classList.add('need'); this.codePill.set('? ? ?'); }
        return;
      }
      part.busy = true;
      const lp = part.lockMesh ? W.toScreen(part.lockMesh.getWorldPosition(new THREE.Vector3())) : { x, y };
      if (L.kind === 'pad') {
        if (!this.custom) this.keys--;   // a player's room has one master key for all its padlocks
        this.keyPill.set(String(this.keys));
        await G.ui.flyImg(G.thumbs.item_key, this.keyPill.getBoundingClientRect().left + 20, this.keyPill.getBoundingClientRect().top + 16, { getBoundingClientRect: () => ({ left: lp.x - 1, top: lp.y - 1, width: 2, height: 2 }) }, { size: 56, dur: 420 });
        if (this.keys <= 0) this.keyPill.style.display = 'none';
      } else if (L.kind === 'color') {
        const digits = L.code.split('');
        for (let i = 0; i < digits.length; i++) { const sk = part.sockets?.[i]; if (sk) { sk.material = sk.material.clone(); sk.material.color.set(LOCK_COLORS[+digits[i]][0]); sk.scale.setScalar(1.4); this.tw.run(.2, k => sk.scale.setScalar(1.4 - .4 * k), ease.outBack); } G.audio.sfx('pop', 3 + i * 2); await this.tw.wait(.16); }
      } else {
        const digits = L.code.split('');
        for (let i = 0; i < digits.length; i++) { G.ui.floatText(lp.x + (i - 1) * 26, lp.y - 20, digits[i], 'gold'); G.audio.sfx('tock'); await this.tw.wait(.14); }
      }
      G.audio.sfx('unlock');
      W.fx.burst(lp.x, lp.y, { n: 16, colors: ['#ffe14d', '#ffffff'] });
      if (part.lockMesh) { const m = part.lockMesh, y0 = m.position.y; await this.tw.run(.3, k => { m.position.y = y0 + k * .3; m.scale.setScalar(1 - k); }, ease.inBack); m.parent?.remove(m); part.lockMesh = null; }
      part.lock = null; part.busy = false;
      G.ui.toast('철컥! 열렸다!', 'green');
    }
    await this.togglePart(part);
  }
  // the park's dig puzzle: no shovel, no digging; with it, three scoops and what was buried pops out (found at once)
  async digUp(part) {
    const G = this.G, W = G.world, X = part.digMark;
    const c = W.toScreen(this.partCenter(part));
    if (!this.tools.has('shovel')) {
      G.audio.sfx('locked');
      if (X) this.tw.run(.35, k => { X.rotation.y = Math.sin(k * Math.PI * 4) * .25 * (1 - k); X.scale.setScalar(1 + Math.sin(k * Math.PI) * .25); }, ease.linear).then(() => { X.rotation.y = 0; X.scale.setScalar(1); });
      G.ui.toast('맨손으로는 못 파겠어… 모래삽을 찾아봐!', 'red');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs.item_shovel;
      return;
    }
    part.busy = true;
    const b = this.toolPill.getBoundingClientRect();
    await G.ui.flyImg(G.thumbs.item_shovel, b.left + 20, b.top + 16, { getBoundingClientRect: () => ({ left: c.x - 1, top: c.y - 1, width: 2, height: 2 }) }, { size: 64, dur: 380 });
    for (let i = 0; i < 3; i++) {
      G.audio.sfx('swish');
      W.fx.burst(c.x + (i - 1) * 14, c.y, { n: 12, colors: ['#f3d28a', '#e6c98a', '#fff3d0', '#c99a6b'], shape: 'circle', speed: 230, up: 160, size: 7, life: .55 });
      await this.tw.wait(.17);
    }
    part.lock = null; part.busy = false;
    G.hitstop(.05);
    await this.togglePart(part, true);
    const buried = part.spots.map(s => s.item).filter(it => it && !it.found);
    G.ui.toast(buried.length ? '파냈다! 모래 속에 숨어 있었어!' : '파냈는데… 아무것도 없네', buried.length ? 'green' : '');
    for (const it of buried) { if (it.role === 'target') await this.onFound(it); else if (it.role !== 'decoy') await this.onChain(it); }
  }
  // ── 척척 로봇: a coin helper that opens a lock you are stuck on
  canOpen(part) {
    const L = part.lock; if (!L) return true;
    if (L.kind === 'lever') return false;
    if (L.kind === 'treat') return this.treats > 0;
    if (L.kind === 'dig') return this.tools.has('shovel');
    if (L.kind === 'sock') return !!this.socks?.has(L.code);
    if (L.kind === 'spine') return this.hasBook;
    if (L.kind === 'gadget') return !!this.gadgets?.has(L.code);
    if (L.kind === 'marble') return false;
    if (L.kind === 'pad') return this.keys > 0;
    if (L.kind === 'color') return this.colorCodes.has(L.code);
    return this.codes.has(L.code);
  }
  offerRobot(part) {
    const G = this.G, cost = ROBOT_COST;
    if (G.ui.panelOpen || this.paused) return;
    this.paused = true;
    const close = () => { G.ui.closePanel(); this.paused = false; };
    G.ui.panel({ title: '척척 로봇', color: 'blue', close, body: [h('div', { class: 'txt' }, `막혔어? 삐빅! 코인 ${cost}개면 내가 대신 열어 줄게.`), h('div', { class: 'txt', style: 'font-size:14px;color:#8a6a9a' }, `가진 코인 ${G.save.coins}`)],
      buttons: [G.ui.btn(`부탁해 (${cost})`, { color: 'green', onClick: () => { close(); this.robotSolve(part); } }), G.ui.btn('내가 할래', { color: 'gray', onClick: close })] });
  }
  async robotSolve(part) {
    const G = this.G, W = G.world, L = part.lock; if (!L) return;
    if (G.save.coins < ROBOT_COST) { G.ui.toast(`코인이 모자라! (${ROBOT_COST} 필요)`, 'red'); return; }
    G.addCoins(-ROBOT_COST);
    // the robot hops in beside the lock, beeps, and the lock gives
    const c = this.partCenter(part), bot = new Char('robot'), R0 = this.room.rooms?.find(R => Math.abs(c.x - R.group.position.x) <= R.w / 2 && Math.abs(c.z - R.group.position.z) <= R.d / 2) || this.room;
    const dir = new THREE.Vector3(W.cam.position.x - c.x, 0, W.cam.position.z - c.z).normalize();
    bot.root.position.set(c.x + dir.x * .7, R0.group?.position.y || 0, c.z + dir.z * .7); bot.root.rotation.y = Math.atan2(-dir.x, -dir.z);
    W.root.add(bot.root); W.idsDirty = true;
    G.audio.sfx('special');
    this.say(bot, '삐빅! 분석 중…', 1100);
    for (let k = 0; k < 2; k++) { await bot.hopTo(this.tw, bot.root.position.x, bot.root.position.z, { height: .25, dur: .3 }); }
    if (this.dead) return;
    if (L.kind === 'lever') { L.kind === 'lever' && part.leverPart ? await this.pullLever(part.leverPart) : (part.lock = null); }
    else if (L.kind === 'treat') this.treats++;
    else if (L.kind === 'dig') this.tools.add('shovel');
    else if (L.kind === 'sock') (this.socks || (this.socks = new Set())).add(L.code);
    else if (L.kind === 'pad') this.keys++;
    else if (L.kind === 'color') this.colorCodes.add(L.code);
    else { this.codes.add(L.code); if (L.puzzle) setFrameSolved(L.puzzle.f || L.puzzle, L.code); }
    this.say(bot, '해결! 삐빅~', 1000);
    if (part.lock) await this.onPart(part, 0, 0);
    await this.tw.wait(.6);
    W.root.remove(bot.root); W.idsDirty = true;
  }
  // the apartment's TV: dark until the remote is found; on, it shows the password of the code lock
  async useTv() {
    const G = this.G, W = G.world, tv = this.plan.tv, code = tv.lock?.code;
    if (tv.done) { if (code) G.ui.toast(`TV에 나온 비밀번호: ${code}`, 'green'); return; }
    if (!this.tools.has('remote')) {
      G.audio.sfx('locked'); this.wobble(tv.f.group);
      G.ui.toast('TV가 꺼져 있어. 리모컨이 어딘가 있을 텐데…', 'red');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs.item_remote;
      return;
    }
    const c = W.toScreen(tv.group.getWorldPosition(new THREE.Vector3())), b = this.toolPill.getBoundingClientRect();
    await G.ui.flyImg(G.thumbs.item_remote, b.left + 20, b.top + 16, { getBoundingClientRect: () => ({ left: c.x - 1, top: c.y - 1, width: 2, height: 2 }) }, { size: 60, dur: 380 });
    G.audio.sfx('special'); G.hitstop(.05);
    tv.on(code || '');
    W.fx.burst(c.x, c.y, { n: 18, colors: ['#8fd3f4', '#ffe0f0', '#ffd23f', '#ffffff'], speed: 220 });
    W.fx.ring(c.x, c.y, { r: 80, color: '#8fd3f4', width: 7 });
    this.toolPill.style.display = 'none';
    if (!code) return;
    this.codes.add(code);
    this.codePill.style.display = ''; this.codePill.classList.remove('need'); this.codePill.set(code.split('').join(' '));
    G.ui.toast(`TV를 켰다! 비밀번호는 ${code.split('').join(' ')}`, 'green');
  }
  // ── the laundromat's pair puzzle: a lone sock pinned on a washer door; bring its twin and the door opens
  sockImg(code) {
    const k = 'sock_' + code; if (this.G.thumbs[k]) return this.G.thumbs[k];
    return this.G.thumbs.item_sockp;
  }
  sockTag(part, code) {
    const f = part.furn, sp = part.spots[0], g = new THREE.Group();
    g.add(put(rbox(.3, .26, .025, '#fffaf0', .03), 0, 0, 0));
    g.add(put(rbox(.06, .05, .03, '#ff8fb8', .01), 0, .14, .01));   // clothes peg
    const sock = buildItem('sockp', { code }); sock.scale.setScalar(.85); sock.rotation.set(Math.PI / 2, 0, -.3); sock.position.set(.0, -.02, .03); g.add(sock);
    const a = sp.anchor.position;
    g.position.set(a.x, a.y + .27, a.z + .2);
    g.traverse(o => { if (o.isMesh) { o.userData.part = part; o.userData.furn = f; } });
    (sp.anchor.parent || f.group).add(g); part.sockTagMesh = g;
    this.G.world.idsDirty = true;
  }
  async matchSock(part, x, y) {
    const G = this.G, W = G.world, L = part.lock, tag = part.sockTagMesh;
    if (!this.socks?.has(L.code)) {
      G.audio.sfx('locked'); this.shakePart(part);
      if (tag) { const r0 = tag.rotation.z; this.tw.run(.4, k => { tag.rotation.z = r0 + Math.sin(k * Math.PI * 4) * (1 - k) * .3; }, ease.linear).then(() => tag.rotation.z = r0); }
      G.ui.toast('문에 짝 잃은 양말이 걸려 있어. 같은 무늬 양말을 찾아 줘!', 'red');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = this.sockImg(L.code);
      return;
    }
    part.busy = true;
    const c = tag ? W.toScreen(tag.getWorldPosition(new THREE.Vector3())) : { x, y }, b = this.toolPill.getBoundingClientRect();
    await G.ui.flyImg(this.sockImg(L.code), b.left + 20, b.top + 16, { getBoundingClientRect: () => ({ left: c.x - 1, top: c.y - 1, width: 2, height: 2 }) }, { size: 60, dur: 400 });
    G.audio.sfx('special'); G.hitstop(.05);
    W.fx.burst(c.x, c.y, { n: 16, shape: 'heart', colors: ['#ff8fb8', '#ffd23f', '#8fd3f4'], speed: 200, gravity: -40 });
    if (tag) { const y0 = tag.position.y; await this.tw.run(.35, k => { tag.position.y = y0 + k * .25; tag.scale.setScalar(Math.max(.001, 1 - k)); }, ease.inBack); tag.parent?.remove(tag); part.sockTagMesh = null; }
    this.toolPill.style.display = 'none';
    part.lock = null; part.busy = false;
    G.ui.toast('짝꿍 완성! 세탁기 문이 열렸어', 'green');
    await this.togglePart(part, true);
  }
  shakePart(part) {
    const g = part.furn.group, s0 = g.position.x;
    this.tw.run(.3, k => { g.position.x = s0 + Math.sin(k * Math.PI * 6) * (1 - k) * .04; }, ease.linear).then(() => g.position.x = s0);
  }
  // ── the dark room: night light until the switch is found
  goDark() {
    const W = this.G.world;
    this.dark = true;
    W.setLight({ ambColor: '#6f6aa8', amb: .55, sunColor: '#9fa0ff', sun: .35 });
    setTimeout(() => !this.dead && this.dark && this.G.ui.toast('앗, 불이 꺼져 있어! 벽에 있는 전등 스위치를 찾아봐', 'red'), 1800);
  }
  async lightsOn() {
    const G = this.G, W = G.world;
    this.dark = false;
    G.audio.sfx('unlock'); G.hitstop(.05);
    const to = this.th.light || null, from = { amb: W.hemi.intensity, sun: W.sun.intensity };
    await this.tw.run(.5, k => { W.setLight(to); W.hemi.intensity = from.amb + (W.hemi.intensity - from.amb) * k; W.sun.intensity = from.sun + (W.sun.intensity - from.sun) * k; });
    W.setLight(to);
    W.fx.confetti(30);
    G.ui.toast('딸깍! 불이 켜졌다!', 'green');
  }
  async pullLever(lv) {
    const G = this.G, W = G.world;
    if (lv.busy || lv.t > .5) { G.audio.sfx('wobble'); return; }
    await this.togglePart(lv, true);
    if (lv.isLight) { if (this.dark) await this.lightsOn(); return; }
    const target = lv.leverFor;
    if (!target?.lock) { G.ui.toast('철컥! …아무 일도 없네', ''); return; }
    G.audio.sfx('unlock'); G.hitstop(.06);
    if (target.lockMesh) { const m = target.lockMesh, y0 = m.position.y; await this.tw.run(.3, k => { m.position.y = y0 + k * .4; m.scale.setScalar(Math.max(.001, 1 - k)); }, ease.inBack); m.parent?.remove(m); target.lockMesh = null; }
    target.lock = null;
    // what the lever opened may be off screen: glide there so the payoff is seen
    { const pc = this.partCenter(target), sc = W.toScreen(pc); if (!(sc.x > 40 && sc.x < W.W - 40 && sc.y > 80 && sc.y < W.H - 160)) await W.flyTo(this.tw, { target: pc.clone().setY(W.target.y), dur: .5 }); }
    const c = W.toScreen(this.partCenter(target));
    W.fx.burst(c.x, c.y, { n: 22, colors: ['#ffe14d', '#ffffff', '#ff8fb8'], speed: 280 });
    W.fx.ring(c.x, c.y, { r: 90, color: '#ffe14d', width: 8 });
    G.ui.toast('철컥! 비밀 칸이 열렸어!', 'green');
    await this.togglePart(target, true);
  }
  async togglePart(part, open = null) {
    const G = this.G, W = G.world;
    if (part.busy) return;
    const opening = open ?? part.t < .5;
    part.busy = true;
    if (opening) {
      part.spots.forEach(s => { if (s.itemGroup && s.item) s.itemGroup.visible = true; });
      G.audio.sfx(part.sfx);
      this.partsOpened++;
      await this.tw.run(part.dur, k => { part.setOpen(k); W.shadowDirty = true; }, part.kind === 'drawer' ? ease.outBack : ease.outCubic);
      for (const s of part.spots) if (s.item && !s.item.found) { const p = W.toScreen(this.worldCenter(s.item)); W.fx.burst(p.x, p.y, { n: 6, shape: 'star', speed: 90, gravity: -40, life: .6, size: 8 }); }
      if (this.jailed?.in && part === this.jailed.door) this.freeJailed();
      const fi = part.spots.map(s => s.item).find(it => it?.friend && !it.found); if (fi) this.revealFriend(fi);
      else if (this.r1 && this.friendHidden && this.r1.cands.includes(part) && !this.r1.told.has(part)) this.r1Wrong(part);
      else if (this.incident && this.friendHidden && part._hadLock && !part._told) { part._told = true; setTimeout(() => !this.dead && this.hideSay(hidePool(this.idx, this.th.friend, 'clue')), 500); }
      // 2판: a drawer of hers (with something in it, or only socks) — once each way
      else if (this.scene?.drawerFull && !this.incident && part.kind === 'drawer') { const full = part.spots.some(s => s.item && !s.item.found && s.item.role === 'target'), k = full ? '_dF' : '_dE'; if (!this[k]) { this[k] = true; this.say(this.friend, full ? this.scene.drawerFull : this.scene.drawerEmpty, 1400); } }
    } else {
      G.audio.sfx('close');
      await this.tw.run(part.dur * .8, k => { part.setOpen(1 - k); W.shadowDirty = true; }, ease.inOutQuad);
      part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; });
    }
    part.busy = false;
  }

  // ── hints
  // free magnifiers first; after that each one costs 60 coins and is always asked first, and nothing is spent when there
  // is nothing left to point at (Codex QA 10/17: the third tap took 60 coins without a word)
  async useHint(paid = false) {
    const G = this.G, W = G.world;
    if (!this.running || this.result || this.paused) return;
    if (!this.nextGoal(true)) { G.ui.toast('지금은 더 알려 줄 게 없어!', ''); return; }
    if (this.hints <= 0 && !paid) {
      if (G.save.coins < 60) { G.ui.toast('돋보기가 없어! (코인 60 필요)', 'red'); return; }
      this.paused = true;
      G.ui.panel({ title: '돋보기를 다 썼어', color: 'blue', body: [h('div', { class: 'txt' }, '코인 60개로 돋보기를 하나 더 쓸까?'), h('div', { class: 'reward' }, `내 코인 ${G.save.coins}`)],
        buttons: [G.ui.btn('그만', { color: 'gray', cls: 'sm', onClick: () => { G.ui.closePanel(); this.paused = false; } }),
          G.ui.btn('60코인 쓰기', { color: 'green', onClick: () => { G.ui.closePanel(); this.paused = false; G.addCoins(-60); this.hints++; this.useHint(true); } })] });
      return;
    }
    this.hints--; this.hintsUsed = (this.hintsUsed || 0) + 1;
    this.hintBtn.badge.textContent = this.hints > 0 ? this.hints : '60'; this.hintBtn.badge.classList.toggle('price', this.hints <= 0);
    G.audio.sfx('whoosh');
    const goal = this.nextGoal(true);
    if (!goal) return;
    const pos = goal.pos;
    // find a yaw where it is visible
    const yaw0 = W.yaw, pitch0 = W.pitch;
    let best = null;
    for (const p of [pitch0, .62, 1.0, 1.15, .4]) {
      for (let k = 0; k < 12 && !best; k++) {
        const y = yaw0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6;
        W.yaw = y; W.pitch = p; W.updateCam(); this.room.update(1);
        if (!W.occluded(goal.obj, pos, [this.room.group])) best = { y, p };
      }
      if (best) break;
    }
    W.yaw = yaw0; W.pitch = pitch0; W.updateCam();
    if (best) await W.flyTo(this.tw, { yaw: best.y, pitch: best.p, zoom: 1.35, target: new THREE.Vector3(pos.x * .6, .75, pos.z * .6), dur: .6 });
    // 흑백판: a grey thing on grey stays invisible even with the rings round it — lend it its colour for a moment
    // (user, 10/17: "힌트썼는데도 안보여서")
    if (this.spec.gray && goal.kind === 'item' && !goal.item.g.userData.colored) {
      const g = goal.item.g; this.colorIn(g);
      setTimeout(() => { if (!this.dead && !goal.item.found) { g.userData.colored = false; W.idsDirty = true; } }, 3500);
    }
    for (let i = 0; i < 4; i++) {
      const s = W.toScreen(pos);
      W.fx.ring(s.x, s.y, { r: 70, color: '#8ad6ff', width: 8, life: .6 }); W.fx.burst(s.x, s.y, { n: 8, shape: 'star', speed: 120, gravity: 0, life: .6 });
      if (i === 0) G.ui.floatText(s.x, s.y - 60, goal.kind === 'part' ? (goal.part.lock ? '잠겨 있어!' : '여기를 열어봐!') : '여기!', 'gold');
      await this.tw.wait(.45);
    }
  }
  // Next thing a smart player would do. Used by hints and the bot.
  nextGoal(forHint = false) {
    const W = this.G.world;
    const cand = [];
    const addItemGoal = (it, depth = 0) => {
      if (it.vacHidden) {   // still under the sofa: the way to it is the robot vacuum (and its remote)
        const vac = this.plan.showcase?.vac; if (!vac?.lock) return;
        if (this.gadgets.has(vac.lock.code)) return cand.push({ kind: 'part', part: vac, obj: vac.pivots[0], pos: this.partCenter(vac) });
        const rc = this.items.find(c => !c.found && c.forPart === vac);
        return rc && depth < 5 ? addItemGoal(rc, depth + 1) : undefined;
      }
      const part = it.spot.part;
      if (part && part.t < .5) {
        if (part.lock) {
          if (part.lock.kind === 'lever') { const lv = part.leverPart; if (lv && lv.t < .5) return cand.push({ kind: 'part', part: lv, obj: lv.furn.group, pos: this.partCenter(lv) }); return; }
          if (part.lock.tv && !this.codes.has(part.lock.code) && this.tools.has('remote') && this.plan.tv) { const tv = this.plan.tv; return cand.push({ kind: 'tv', part: tv.f, obj: tv.group, pos: tv.group.getWorldPosition(new THREE.Vector3()) }); }
          if (part.lock.kind === 'marble') {   // 비밀 서재: the way to the door is the bookcase
            const S = this.plan.showcase, bk = this.items.find(i => i.role === 'book');
            if (bk && !bk.found && depth < 5) return addItemGoal(bk, depth + 1);
            return S && S.shelf.lock ? cand.push({ kind: 'part', part: S.shelf, obj: S.shelf.pivots[0], pos: this.partCenter(S.shelf) }) : undefined;
          }
          if (part.lock.puzzle && !this.codes.has(part.lock.code)) { const fr = part.lock.puzzle.f, b = new THREE.Box3().setFromObject(fr.group); return cand.push({ kind: 'puzzle', part: fr, obj: fr.group, pos: b.getCenter(new THREE.Vector3()) }); }
          const have = part.lock.kind === 'gadget' ? this.gadgets.has(part.lock.code) : part.lock.kind === 'spine' ? this.hasBook : part.lock.kind === 'sock' ? !!this.socks?.has(part.lock.code) : part.lock.kind === 'dig' ? this.tools.has('shovel') : part.lock.kind === 'pad' ? this.keys > 0 : part.lock.kind === 'treat' ? this.treats > 0 : part.lock.kind === 'color' ? this.colorCodes.has(part.lock.code) : this.codes.has(part.lock.code);
          if (have) return cand.push({ kind: 'part', part, obj: part.pivots[0], pos: this.partCenter(part) });   // aim at the door itself, not the body
          const chain = this.items.find(c => !c.found && c.forPart === part);
          if (chain && depth < 5) return addItemGoal(chain, depth + 1);
          return;
        }
        return cand.push({ kind: 'part', part, obj: part.pivots[0], pos: this.partCenter(part) });
      }
      cand.push({ kind: 'item', item: it, obj: it.g, pos: this.worldCenter(it) });
    };
    const sw = this.plan.light;
    if (this.dark && sw && sw.t < .5) return { kind: 'part', part: sw, obj: sw.furn.group, pos: this.partCenter(sw) };
    for (const it of this.targets) if (!it.found) addItemGoal(it);
    if (!cand.length) return null;
    // nearest to the screen centre first
    cand.forEach(c => { const s = W.toScreen(c.pos); c.d = Math.hypot(s.x - W.W / 2, s.y - W.H * .47); });
    cand.sort((a, b) => a.d - b.d);
    return cand[0];
  }

  // ── tutorials
  // scheme E, step by step: drag to look around → turn (the ↻ button, or a second-finger tap) → back to move → zoom
  async tutorialE() {
    const G = this.G, ui = G.ui, W = G.world;
    const top = `left:50%;top:${innerHeight * .2}px`;
    const step = async (text, handCls, handAt, done, maxT = 30, hl = null) => {
      const tip = h('div', { class: 'tip', style: top }, text);
      const hand = h('div', { class: 'hand ' + handCls, html: ICON.hand, style: `left:${handAt.x}px;top:${handAt.y}px` });
      ui.tut.append(tip, hand); this.tutEls = [tip, hand]; hl?.classList.add('hl');
      const t0 = this.t;
      const over = () => this.dead || this.botOn() || !!this.result;
      while (!over() && !done() && this.t - t0 < maxT) await this.tw.wait(.1);
      tip.remove(); hand.remove(); hl?.classList.remove('hl'); this.tutEls = null;
      if (over()) return false;
      G.audio.sfx('special'); await this.tw.wait(.35);
      return !over();
    };
    const at = el => { const b = el?.getBoundingClientRect(); return b && b.width ? { x: b.left + b.width * .3, y: b.top + b.height * .4 } : { x: innerWidth / 2, y: innerHeight * .58 }; };
    let pan = 0; W.onPan = d => { pan += d; };
    const mb = W.modeBadge, mt = mb?.querySelector('.mt'), mm = mb?.querySelector('.mm');
    W.eBase = W.eMode = 'move';
    if (!await step('한 손가락으로 끌면 이동! 쓱 끌어 봐', 'swipe', { x: innerWidth / 2, y: innerHeight * .58 }, () => pan > 160)) return;
    this.rotAccum = 0;
    if (!await step('이번엔 돌려 보자! ↻ 회전을 누르거나, 끄는 중에 다른 손가락으로 톡!', 'tap', at(mt), () => W.eBase === 'turn' || this.rotAccum > .3, 30, mb)) return;
    if (W.eBase === 'turn' && !await step('이제 끌면 방이 빙글! 손을 떼도 회전 그대로야', 'swipe', { x: innerWidth / 2, y: innerHeight * .58 }, () => this.rotAccum > 1.0)) return;
    if (W.eBase === 'turn' && !await step('다시 움직이려면 ✥ 이동을 톡!', 'tap', at(mm), () => W.eBase === 'move', 12, mb)) return;
    const z0 = W.zoom, gauge = document.querySelector('.zgauge');
    if (!await step('두 손가락을 벌리면 확대! 오른쪽 막대로도 돼', 'tap', at(gauge), () => Math.abs(W.zoom / z0 - 1) > .15, 14, gauge)) return;
    W.onPan = null;
    if (this.result || this.dead) return;
    this.tutStep = 2;
    const tip2 = h('div', { class: 'tip', style: top }, '좋아! 이제 숨은 물건을 찾아서 탭!');
    const hand2 = h('div', { class: 'hand tap', html: ICON.hand });
    ui.tut.append(tip2, hand2); this.tutEls = [tip2, hand2]; this.tutHand = hand2;
  }
  // ── 1판 (대본 10/18, GPT 첫판 안): one thing to do at a time, each only once it's needed, done only when it's really
  // done — never because time passed. Stuck for a while: the line says more and the spot rings.
  async teach(text, cls, posFn, done, more = null) {
    const G = this.G, W = G.world, ui = G.ui;
    const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, text);
    const hand = h('div', { class: 'hand ' + cls, html: ICON.hand });
    ui.tut.append(tip, hand); this.tutEls = [tip, hand]; this.tutHand = hand; this.tutHandPos = posFn;
    const t0 = this.t; let said = false, ringT = 0;
    const over = () => this.dead || !!this.result || this.botOn();
    while (!over() && !done()) {
      const dt = this.t - t0;
      if (!said && dt > 8 && more) { said = true; tip.textContent = tr(more); }
      if (dt > 8 && this.t - ringT > 2) { ringT = this.t; const p = posFn?.(); if (p) { const s = p.sx != null ? { x: p.sx, y: p.sy } : W.toScreen(p); W.fx.ring(s.x, s.y, { r: dt > 16 ? 110 : 70, color: '#ffe14d', width: 7 }); } }
      await this.tw.wait(.1);
    }
    tip.remove(); hand.remove(); this.tutEls = null; this.tutHand = null; this.tutHandPos = null;
    if (over()) return false;
    G.audio.sfx('special'); await this.tw.wait(.3);
    return !over();
  }
  // 1판: 토순이 hid in the toy box and dropped her donut. Tap the donut → the box shakes, but you see its back → turn the
  // room (↻, then drag) until its front shows her tail → tap the box. 이동·확대 wait for a stage that needs them.
  async tutorial1() {
    const G = this.G, W = G.world, P = this.plan.first;
    this.tutStep = 1;
    if (!P) return this.tutorialLegacy();
    const box = P.box, sc = this.scene || {};
    this.tail = boxTail(box); W.root.add(this.tail.mesh); W.idsDirty = true;
    const front = () => { if (!this.tail) return true; const c = this.tail.center, v = new THREE.Vector3(W.cam.position.x - c.x, 0, W.cam.position.z - c.z).normalize(); return v.dot(this.tail.front) > .3; };
    const donut = this.items.find(i => i.role === 'clue');
    const at = el => { const b = el?.getBoundingClientRect(); return b?.width ? { sx: b.left + b.width / 2, sy: b.top + b.height / 2 } : null; };
    const mid = () => ({ sx: innerWidth / 2, sy: innerHeight * .58 });
    // ① the donut she dropped — the very first tap gets an answer from the box
    if (donut && !donut.found && !await this.teach(DO.donut, 'tap', () => (donut.found ? null : this.worldCenter(donut)), () => donut.found, DO.donut2)) return;
    // ② the box shook, but that's its back: turn the room until its front shows
    if (!front() && !this.friendItem?.found) {
      // 기본 조작 F (조작감 세션 10/18): one finger always moves; the turn dial bottom right turns the room (or a two-finger twist)
      const dial = W.turnDial instanceof Element ? W.turnDial : W.turnDial?.el || document.querySelector('.turndial');
      if (W.scheme === 'F' && dial) { if (!await this.teach(DO.turnDial, 'swipe', () => at(dial), front, DO.turnDial2)) return; }
      else if (W.scheme === 'E' && !W.joyOn) {
        const mt = W.modeBadge?.querySelector('.mt');
        if (W.eBase !== 'turn' && !await this.teach(DO.turnBadge, 'tap', () => at(mt), () => W.eBase === 'turn' || front(), DO.turnBadge2)) return;
        if (!front() && !await this.teach(DO.turnDrag, 'swipe', mid, front, DO.turnDrag2)) return;
      } else if (!await this.teach(DO.turnAny, 'swipe', mid, front, DO.turnDrag2)) return;
    }
    if (this.friendHidden && sc.peek) { this.giggle(sc.peek); this._hsT = this.t; this.gigT = 6; }
    // ③ tap the box (the same tap as the donut)
    if (!this.friendItem?.found) await this.teach(DO.box, 'tap', () => this.partCenter(box), () => !!this.friendItem?.found || box.t > .5, DO.box2);
    this.tutStep = 3;
  }
  // the old drill (a room without the toy box, or the old stage mode)
  async tutorialLegacy() {
    const G = this.G, ui = G.ui;
    this.tutStep = 1;
    if (G.world.scheme === 'E' && !G.world.joyOn) return this.tutorialE();
    const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, G.world.scheme === 'E' ? '끌면 이동! 끄는 중에 다른 손가락으로 톡 하면 회전으로 바뀌어!' : G.world.scheme === 'D' ? '한 손가락으로 끌면 방이 돌아가! (누른 곳을 중심으로)' : G.world.scheme === 'B' ? '톡 누르고 바로 끌면 방이 돌아가! (옆으로·위아래로)' : G.world.scheme === 'C' ? '오른쪽 아래 스위치가 ↻ 회전일 때 옆으로 끌면 방이 돌아가!' : '한 손가락으로 옆으로 끌어서 방을 돌려봐!');
    const hand = h('div', { class: 'hand swipe', html: ICON.hand, style: `left:${innerWidth / 2}px;top:${innerHeight * .58}px` });
    ui.tut.append(tip, hand);
    this.tutEls = [tip, hand];
    while (this.rotAccum < 1.0 && !this.dead && !this.botOn()) await this.tw.wait(.1);
    this.tutEls.forEach(e => e.remove());
    if (this.dead) return;
    G.audio.sfx('special');
    this.tutStep = 2;
    const tip2 = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, G.world.scheme === 'E' ? '숨은 물건을 찾아서 탭! (두 손가락 벌리면 확대)' : G.world.scheme === 'D' ? '숨은 물건을 찾아서 탭! (오른쪽 아래 패드로 이동 · 게이지나 두 손가락으로 확대)' : G.world.scheme === 'B' ? '숨은 물건을 찾아서 탭! (끌면 이동 · 톡 하고 끌면 회전 · 오른쪽 게이지로 확대)' : G.world.scheme === 'C' ? '숨은 물건을 찾아서 탭! (스위치로 회전↔이동 · 벌리거나 두 번 탭하면 확대)' : '숨은 물건을 찾아서 탭! (두 손가락으로 끌면 이동 · 벌리면 확대)');
    const hand2 = h('div', { class: 'hand tap', html: ICON.hand });
    ui.tut.append(tip2, hand2); this.tutEls = [tip2, hand2]; this.tutHand = hand2;
  }
  tutDone() {
    this.tutEls?.forEach(e => e.remove()); this.tutEls = null; this.tutHand = null;
    this.tutStep = 3;
    this.G.ui.toast('잘했어! 이제 진짜 시작!', 'green');
  }
  // 2판: nothing opened after a while → open a drawer, and the hint stays until you have (대본: no timing out)
  async tutorial2() {
    await this.tw.wait(6);
    if (this.dead || this.result || this.partsOpened > 0) return;
    const g = this.targets.find(t => !t.found && t.spot.part && t.spot.part.t < .5);
    if (!g) return;
    const part = g.spot.part;
    await this.teach(DO.drawer, 'tap', () => this.partCenter(part), () => this.partsOpened > 0, DO.drawer2);
  }
  // 미술관 (the first wide room): not moved around after a while → how to, once
  teachMove() {
    const G = this.G, W = G.world; let pan = 0; const prev = W.onPan;
    W.onPan = d => { pan += Math.abs(d) || 0; prev?.(d); };
    setTimeout(() => { if (this.dead || this.result) return; (G.save.tut || (G.save.tut = {})).move = 1; G.persist(); if (pan < 80) G.ui.toast(W.scheme === 'E' && W.eBase === 'turn' ? DO.moveE : DO.move, 'green'); }, 12000);
  }
  // 1판: the donut 토순이 dropped — the box answers at once (GPT 첫판: 첫 탭부터 반응)
  async onClue(it) {
    const G = this.G, W = G.world, sc = this.scene || {};
    it.found = true; this.idle = 0;
    const s = W.toScreen(this.worldCenter(it));
    W.fx.burst(s.x, s.y, { n: 16, speed: 300 }); W.fx.ring(s.x, s.y, { r: 80, color: '#ffe14d', width: 8 });
    G.audio.sfx('found', 1); G.ui.floatText(s.x, s.y - 40, ITEMS[it.type].name + '!', 'gold');
    const g = it.g, s0 = g.scale.x;
    await this.tw.run(.16, k => g.scale.setScalar(s0 * (1 + .7 * k)), ease.outBack);
    g.visible = false; it.spot.item = null; g.parent?.remove(g);
    if (this.dead) return;
    if (this.plan.incident?.part && this.friendHidden) { await this.tw.wait(.3); this.giggle(sc.clue || '앗, 내 간식!'); this._hsT = this.t; this.gigT = 6; }
    if (this.hero?.ch && sc.mongClue) setTimeout(() => !this.dead && this.say(this.hero.ch, sc.mongClue, 1300), 1500);
  }
  botOn() { return !!this.G.bot; }

  // ── story pieces
  async openPuzzle(furn) {
    const G = this.G;
    const L = this.plan.locks.find(l => l.puzzle?.f === furn);
    if (!L) { this.wobble(furn.group); return; }
    if (this.codes.has(L.code)) { G.ui.toast(`찬장 비밀번호는 ${L.code}!`, 'green'); return; }
    this.paused = true;
    const ok = await slidePuzzle(G, L.code);
    this.paused = false; this.idle = 0;
    if (!ok || this.dead) return;
    this.codes.add(L.code); setFrameSolved(furn, L.code);
    this.codePill.style.display = ''; this.codePill.classList.remove('need'); this.codePill.set(L.code.split('').join(' '));
    G.ui.toast(`비밀번호 ${L.code}! 잠긴 찬장을 열어 봐`, 'green');
  }
  async feedGuard() {
    const G = this.G, W = G.world, f = this.friend;
    f.pose = 'idle'; f.setFace('happy');
    this.say(f, this.story?.lines?.fed || '냠냠! 고마워!', 1600);
    G.audio.sfx('special'); const s = W.toScreen(f.root.position.clone().setY(f.root.position.y + f.headTop()));
    W.fx.burst(s.x, s.y, { n: 12, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1'], speed: 160, gravity: -60 });
    await this.tw.wait(.6);
    const spot = (this.freeTiles || [])[0] || { x: 1.6, z: 1.6 };
    const y0 = f.root.position.y;
    await f.hopTo(this.tw, spot.x, spot.z, { height: .6, dur: .5 });
    f.root.position.y = spot.y || 0; void y0;
    f.faceTo(W.cam.position.x, W.cam.position.z);
  }
  async onSecret(it) {
    const G = this.G, W = G.world;
    it.found = true; this.secretFound = true; this.idle = 0;
    const s = W.toScreen(this.worldCenter(it));
    W.fx.burst(s.x, s.y, { n: 28, colors: ['#ffe14d', '#fff3a0', '#ffffff'], speed: 340 }); W.fx.ring(s.x, s.y, { r: 110, color: '#ffe14d', width: 10 });
    G.audio.sfx('special'); G.hitstop(.06);
    it.g.visible = false; it.spot.item = null; it.g.parent?.remove(it.g);
    G.addCoins(50); G.ui.floatText(s.x, s.y - 50, '비밀 발견! +50', 'gold big');
    G.ui.toast(`비밀 아이템 ${ITEMS[it.type].name}을(를) 찾았어!`, 'green');
  }

  frameCamera() {
    const W = this.G.world, R = this.room;
    const big = R.rooms ? R : null, rw = R.w, rd = R.d;
    const c = big ? big.center : new THREE.Vector3(0, 0, 0), floors = big ? big.levels.length : 1;
    const span = (rw + rd) / Math.SQRT2 + .5;                       // iso width of the footprint
    // big maps: show most of it, pan for the rest · bleed rooms (floor running on past the walls): fill the screen
    const bleed = !big && R.L?.bleed, fitW = bleed ? span * .6 : (R.L?.fitAll ? Math.min(span * .98, 11) : Math.min(span, 8.6)), tall = (floors - 1) * FLOOR_H;   // fitAll: a whole house in one look
    W.home.set(c.x, big ? (big.levels[0] * FLOOR_H + tall / 2 + .75) : .75, c.z); W.target.copy(W.home);
    W.yaw = Math.PI / 4; W.pitch = floors > 1 ? .5 : .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0;
    W.bounds = Math.max(2.4, Math.max(rw, rd) * .48); W.minZoom = .85; W.maxZoom = 8 + (span > 9 ? 2 : 0); W.minPitch = .06; W.maxPitch = 1.45;   // a little room past the edges
    const extra = Math.max(0, span - fitW) / 2;
    W.slack = extra > 0 ? { x: extra * .9, z: extra * .9 } : null;
    W.setFit(bleed ? fitW : fitW < 7.5 ? 7.5 : fitW, bleed ? fitW * .62 : Math.max(6.6, fitW * .62 + tall * .85), floors > 1 ? .55 : .47);
  }

  // ── characters: the counting friend plus 1–2 locals who hop between free tiles; tap any of them for a reaction
  tapChar(ch) {
    // anyone you tap goes into the card book (save.met: kind → first time)
    const met = this.G.save.met || (this.G.save.met = {}); if (ch.kind && !met[ch.kind]) { met[ch.kind] = Date.now(); this.G.persist(); }
    const r = ch.react(this.tw, (n, p) => this.G.audio.sfx(n, p));
    if (this._sayEl?.ch === ch) this._sayEl.kill();
    const sl = ch === this.friend ? this.story?.lines?.tap : ch === this.jailed?.ch && this.jailed.in ? JAIL_LINES : null;
    this._sayEl = this.say(ch, sl ? sl[(this._tapN = (this._tapN || 0) + 1) % sl.length] : r.line, 1400); this._sayEl.ch = ch;
    const n = (this.npcs || []).find(x => x.ch === ch);
    if (n) n.rest = 1.4;
  }
  spawnNpcs() {
    this.npcs = [];
    const sp = this.spec, W = this.G.world, rooms = this.room.rooms || [this.room];
    const outdoor = rooms.some(R => !!R.L.walls && !Object.values(R.L.walls).includes('door'));
    const want = sp.tut ? 0 : this.custom ? 1 : (outdoor ? 2 : (sp.idx >= 2 ? 1 : 0));
    const fa = this.guard ? [99, 99] : (this.layout.friendAt || [1.6, 1.6]);
    const free = [];
    for (const R of rooms) {
      const occ = R.occupied(), o = R.group.position;
      for (let j = 0; j < R.d; j++) for (let i = 0; i < R.w; i++) {
        if (occ.has(i + ',' + j)) continue;
        const x = o.x + i - R.w / 2 + .5, z = o.z + j - R.d / 2 + .5;
        if (!R.clearAt(x, z, .4)) continue;   // a free tile next to a bin can still be too tight for a body
        if (Math.hypot(x - fa[0], z - fa[1]) < .95) continue;
        free.push({ i, j, x, z, y: o.y, R });
      }
    }
    this.freeTiles = free.slice().sort((a, b) => Math.hypot(a.x - 1.6, a.z - 1.6) - Math.hypot(b.x - 1.6, b.z - 1.6));
    if (sp.gray && !this.custom && free.length) {
      const t = free.slice().sort((a, b) => Math.hypot(a.x - fa[0], a.z - fa[1]) - Math.hypot(b.x - fa[0], b.z - fa[1]))[0];
      const ch = new Char('inky'); ch.root.position.set(t.x, t.y || 0, t.z); ch.root.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z); W.root.add(ch.root);
      const n = this.villain = { ch, t, next: null, on: true, rest: 4 }; this.npcs.push(n); this.npcLoop(n, free);
      free.splice(free.indexOf(t), 1);
    }
    // 몽글 파출소: someone sits in the cell who shouldn't be — 너굴이, of all people (user, 10/18: "유치장에 엉뚱한 캐릭터
    // 억울하게 있으면"); tap him and he pleads, open the cell and he hops out
    const cell = !this.custom && rooms.flatMap(R => R.furns).find(r => r.type === 'jailcell');
    if (cell) {
      const p = cell.f.group.localToWorld(new THREE.Vector3(-.35, .49, -.28));
      const ch = new Char('raccoon'); ch.root.position.copy(p); ch.root.rotation.y = Math.atan2(W.cam.position.x - p.x, W.cam.position.z - p.z); ch.setFace?.('sad'); W.root.add(ch.root);
      this.jailed = { ch, in: true, door: cell.f.parts[0] }; this.npcs.push({ ch, on: false });
      setTimeout(() => !this.dead && this.jailed?.in && this.say(ch, JAIL_LINES[0], 2200), 5200);
    }
    if (free.length < 3 || !want) return;
    const seed = (sp.seed || 1) >>> 0;
    const pool = (NPC_POOL[sp.region] || NPC_POOL.home).filter(k => k !== this.th.friend && CHAR_DEFS[k]);
    const taken = new Set();
    for (let k = 0; k < want && pool.length; k++) {
      const kind = pool[(seed + k * 3) % pool.length]; pool.splice(pool.indexOf(kind), 1);
      const opts = free.filter(t => !taken.has(t));
      const t = opts[(seed * 7 + k * 5) % opts.length]; taken.add(t);
      const ch = new Char(kind);
      ch.root.position.set(t.x, t.y || 0, t.z);
      ch.root.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z);
      W.root.add(ch.root);
      const n = { ch, t, next: null, on: true, rest: 1.5 + k * 1.3 };
      this.npcs.push(n);
      this.npcLoop(n, free);
    }
  }
  async npcLoop(n, free) {
    const tw = this.tw, ch = n.ch, W = this.G.world;
    while (n.on && !this.dead) {
      await tw.wait(.25);
      if (!n.on || this.dead) return;
      if (ch.reacting || this.paused || this.result || this.talking) continue;   // everyone holds still while a talk is filmed
      n.rest -= .25; if (n.rest > 0) continue;
      const nb = free.filter(t => t.R === n.t.R && Math.abs(t.i - n.t.i) + Math.abs(t.j - n.t.j) === 1 && !this.npcs.some(o => o !== n && (o.t === t || o.next === t))
        && t.R.clearAt((t.x + n.t.x) / 2, (t.z + n.t.z) / 2, .32));   // and the way between is clear too
      if (nb.length && Math.random() < .75) {
        const t = nb[Math.floor(Math.random() * nb.length)]; n.next = t;
        if (ch.def.glide) await ch.glideTo(tw, t.x, t.z, { speed: 1.4 });
        else { const x0 = ch.root.position.x, z0 = ch.root.position.z; for (let s = 1; s <= 2 && n.on; s++) await ch.hopTo(tw, x0 + (t.x - x0) * s / 2, z0 + (t.z - z0) * s / 2, { height: .18, dur: .26 }); }
        n.t = t; n.next = null;
      } else if (!ch.def.glide) {
        // stop and look at the player for a moment
        const r0 = ch.root.rotation.y, goal = Math.atan2(W.cam.position.x - ch.root.position.x, W.cam.position.z - ch.root.position.z);
        const d = Math.atan2(Math.sin(goal - r0), Math.cos(goal - r0));
        await tw.run(.3, k => { if (n.on) ch.root.rotation.y = r0 + d * k; });
      }
      n.rest = 1.2 + Math.random() * 2.6;
    }
  }

  // ── speech
  // the special shades: on the hero and everyone in the room (먹물이 wears its own) — a pop as each pair goes on
  giveShades() {
    if (this._shaded) return; this._shaded = true;
    for (const ch of [this.hero?.ch, this.friend, ...(this.npcs || []).map(n => n.ch)]) {
      if (!ch || ch.shades || !ch.buildAcc) continue;
      try { ch.buildAcc('sunglasses', {}, CHAR_DEFS[ch.kind] || {}); ch.bump?.(.4); } catch {}
    }
    this.G.audio.sfx('pop', 6); this.G.ui.toast('특수 선글라스 착용!', 'green');
  }
  // the 흑백판 owner needles you: not too often, never over another bubble of theirs
  taunt(kind) {
    if (!this.spec.gray || this.custom || this.result || !this.running || this.t - (this._tauntAt ?? -99) < (kind === 'idle' ? 12 : 5)) return;
    // 대본: 먹물이's needling changes over the story (a voice → caught again → quiet → hints); the owner keeps the old ones
    const L = (this.villain && inkyTaunt(this.idx, kind)) || TAUNT[kind]; if (!L) return;
    this._tauntAt = this.t; this._tn = (this._tn || 0) + 1;
    this.say(this.villain?.ch || this.friend, L[(this._tn * 7 + (this.idx | 0)) % L.length], 1700);   // 먹물이 does the needling when it's here
  }
  say(ch, text, ms = 1200) {
    const b = h('div', { class: 'bubble pop' }, text);
    this.G.ui.wui.append(b);
    // keep the bubble on screen (it is centred on its x)
    const upd = () => { const p = this.G.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .2)); const hw = (b.offsetWidth || 120) / 2 + 8; b.style.left = Math.max(hw, Math.min(innerWidth - hw, p.x)) + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30);
    const kill = () => { clearInterval(iv); b.remove(); };
    setTimeout(kill, ms);
    return { el: b, kill };
  }

  // ── end states
  async win() {
    const G = this.G, W = G.world;
    this.result = 'clear'; this.running = false; this.tEnd = this.t;
    (this.tutEls || []).forEach(e => e.remove()); this.tutEls = [];
    // ★ found everything · ★ no hint · ★ careful (no more wrong taps than there were things to find)
    const stars = this.incident ? 1 + (this.hintsUsed === 0 ? 1 : 0) + (this.targets.every(t => t.found) ? 1 : 0)   // ★ found them · ★ no hint · ★ every bonus thing
      : this.spec.timed ? 1 + (this.time / this.timeMax >= .3 ? 1 : 0) + (this.hintsUsed === 0 ? 1 : 0)
      : 1 + (this.hintsUsed === 0 ? 1 : 0) + ((this.story?.secret ? this.secretFound : this.missCount <= this.targets.length) ? 1 : 0);
    const coins = this.custom ? 40 + this.targets.length * 15 + (this.plan.locks.length ? 20 : 0) + stars * 5 : 30 + this.targets.length * 10 + stars * 10 + (this.bestCombo >= 3 ? 20 : 0);
    this.stars = stars;
    G.audio.sfx('win'); G.hitstop(.08);
    // 흑백판: the whole room floods back into colour
    if (this.spec.gray && W.post) { const u = W.post.u.gray; this.tw.run(1.2, k => { u.value = 1 - k; }, ease.inOutQuad); }
    W.fx.confetti(130);
    this.bubble.style.display = 'none';
    const f = this.friend; f.pose = 'cheer'; f.setFace('wow'); f.faceTo(W.cam.position.x, W.cam.position.z);
    if (!this.incident) this.say(f, '우와! 다 찾았네!', 1800);   // (사건 판: the host has just had their say)
    for (const n of this.npcs || []) { if (n === this.villain) continue; n.on = false; n.ch.pose = 'cheer'; n.ch.setFace('happy'); n.ch.faceTo(W.cam.position.x, W.cam.position.z); n.ch.bump(.4); }
    // 먹물이 loses: a sulk, then it bolts off the edge of the room and is gone
    if (this.villain) {
      const v = this.villain, ch = v.ch; v.on = false; this.say(ch, inkyCaught(this.idx), 1600);   // 대본: …앗. → …또 너야? → …너는 안 가네.
      if (inkyStays(this.idx)) { ch.setFace('happy'); ch.faceTo(W.cam.position.x, W.cam.position.z); } else {   // 빌딩: it stays to talk, then as a friend
      ch.setFace('angry');
      const p0 = ch.root.position.clone(), away = p0.clone().add(new THREE.Vector3(p0.x >= 0 ? 4 : -4, 0, p0.z >= 0 ? 3 : -3));
      ch.root.rotation.y = Math.atan2(away.x - p0.x, away.z - p0.z);
      this.tw.wait(1.1).then(() => this.tw.run(.7, k => { ch.root.position.lerpVectors(p0, away, k); ch.root.position.y = p0.y + Math.abs(Math.sin(k * Math.PI * 4)) * .18; ch.root.scale.setScalar(1 - .6 * k); }, ease.inQuad)).then(() => { ch.root.visible = false; });
      }
    }
    this.setMong('happy', 'hop');
    const first = this.preview ? { awarded: 0 } : this.custom ? G.onVisitResult(this.custom, true, this.found, this.targets.length, coins) : G.onStageClear(this.idx, stars, coins);
    if (!this.preview) this.logRun('clear', stars);
    await this.tw.wait(1.0);
    if (this.dead) return;
    let memento = null, newFriend = null, back = [], got = null, newItem = null;
    // one new thing to hide at home per stage, the first time it is cleared (not every find — that gave away too much)
    if (first?.firstClear) { const t = this.targets.map(t => t.type).find(t => t !== 'key' && t !== 'note' && ITEMS[t] && !ITEMS[t].decoy && !ITEMS[t].noCollect && !G.save.collection.includes(t)); if (t && G.collect(t)) newItem = t; }   // (not the hidden friend's marker: GPT QA 10/18)
    // 털기: take back what was mine, then pocket one thing from this room
    if (this.custom && !this.custom.selfTest && !this.preview) {
      back = retrieve(G, this.custom);
      if (canGrab(G, this.custom)) got = await this.pickLoot(back);
      if (this.dead) return;
    }
    if (!this.custom) {
      const got = G.save.chars || (G.save.chars = []);
      const k = this.spec.timed ? 'raccoon' : CHAR_UNLOCK[this.idx];
      if (k && !got.includes(k)) { got.push(k); newFriend = k; G.persist(); }
    }
    if (this.story) {
      if (this.story.outro) await this.talk(this.story.outro);
      if (this.dead) return;
      const done = G.save.storyDone || (G.save.storyDone = {});
      if (this.story.reward && !done[this.story.id]) {
        done[this.story.id] = true;
        if (this.story.reward.furn) { G.save.home.inventory.push(this.story.reward.furn); memento = this.story.reward.furn; }
        if (this.story.reward.coins) G.addCoins(this.story.reward.coins);
        G.persist();
      }
    }
    // 대본: a few words after the clear — 2판's "이번엔 네가 숨겨 봐", a 흑백판's footprints, 너굴이's excuse
    const aft = this.custom || this.preview ? null : this.spec.timed ? timedWin(this.idx) : sceneAfter(this.idx);
    if (aft && !G.skipTalk && !G.bot) { await this.talk(aft); if (this.dead) return; }
    // 2판 (home just opened): go and hide something at home now, or keep going — both on the result panel
    const homeNow = !this.custom && !this.preview && this.scene?.homeChoice && G.homeOpen?.() && !G.save.tut?.home;
    const bossNext = BOSS_AFTER.includes(this.idx) && !G.save.bossDone?.[this.idx], gameNext = !bossNext && !!BOSS_GAMES[this.idx] && !G.save.bossDone?.['g' + this.idx], miniNext = !bossNext && !gameNext && !!MINI_AFTER[this.idx] && !G.save.bossDone?.['m' + this.idx];
    const starEls = [0, 1, 2].map(() => h('div', { class: 'st', html: ICON.star }));
    const cv = h('span', {}, '0');
    const p = G.ui.panel({
      title: first?.allClear ? `${STAGE_COUNT}판 올클리어!` : this.spec.hard ? '하드 클리어!' : (!this.custom && this.idx < 6) ? ['대단해!', '최고야!', '숨바꼭질 천재!', '멋져!', '완벽해!', '진짜 잘한다!'][this.idx] : '다 찾았다!', color: 'green',
      body: [h('div', { class: 'stars' }, ...starEls),
        // 사건 판: what each star is for, so a missing one says how to get it (GPT QA 10/18: 보너스 0/2 → '다 찾았네', 별 2개)
        ...(this.incident ? [h('div', { class: 'starwhy' }, h('span', { class: 'on' }, '★ 친구 찾기'), h('span', { class: this.hintsUsed ? '' : 'on' }, '★ 힌트 없이'), h('span', { class: this.targets.every(t => t.found) ? 'on' : '' }, `★ 보너스 ${this.targets.filter(t => t.found && !t.friend).length}/${this.targets.length - 1}`))] : []),
        h('div', { class: 'reward', html: ICON.coin }, cv),
        h('div', { class: 'txt' }, `걸린 시간 ${fmtTime((this.tEnd ?? this.t) - (this.tStart ?? 0))}` + (this.hintsUsed ? ` · 힌트 ${this.hintsUsed}번` : ' · 힌트 없이!') + (this.bestCombo >= 2 ? ` · 최고 콤보 x${this.bestCombo}` : '')),
        ...(first?.allClear ? [h('div', { class: 'txt' }, '몽글이가 마을 최고의 숨바꼭질 탐정이 됐어! 이제 무한 모드가 열렸어.')] : []),
        ...(newItem ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['item_' + newItem] }), h('div', {}, h('b', {}, '새 숨길 물건!'), h('div', {}, `${ITEMS[newItem].name} · 내 집에 숨길 수 있어요`)))] : []),
        ...(newFriend ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['face_' + newFriend] }), h('div', {}, h('b', {}, '새 친구!'), h('div', {}, `${CHAR_DEFS[newFriend]?.name || ''}가 이제 동네에 놀러 와요`)))] : []),
        ...(back.length === 1 ? [h('div', { class: 'memento mine' }, h('img', { src: G.thumbs['item_' + back[0]] }), h('div', {}, h('b', {}, '되찾았다!'), h('div', {}, `${ITEMS[back[0]]?.name || ''} · 다시 내 집에 숨길 수 있어 (+20)`)))]
          : back.length ? [h('div', { class: 'memento mine' }, h('div', {}, h('b', {}, `${back.length}개 되찾았다! (+${back.length * 20})`), h('div', { class: 'icons' }, ...back.slice(0, 12).map(t => h('img', { src: G.thumbs['item_' + t] }))), back.length > 12 ? h('div', {}, `외 ${back.length - 12}개`) : ''))] : []),
        ...(got ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['item_' + got.item] }), h('div', {}, h('b', {}, '슬쩍 챙김!'), h('div', {}, got.isNew ? `${ITEMS[got.item]?.name || ''} · 내 수집품에 추가! 내 집에 숨길 수 있어` : `${ITEMS[got.item]?.name || ''} · 이미 있어서 코인 +${got.coins}`)))] : []),
        ...(got && this.custom?.resident ? [h('div', { class: 'txt' }, `${ga(this.custom.nick)} 눈치챘을지도… 복수하러 올 수 있어! 내 집 숨김을 단단히 해 둬`)] : []),
        ...(memento ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['furn_' + memento] }), h('div', {}, h('b', {}, '기념 가구 획득!'), h('div', {}, `${FURN_NAME(memento)} · 내 집 보관함에 들어갔어요`)))] : [])],
      buttons: [homeNow ? G.ui.btn(SUI.homeHide, { color: 'orange', icon: 'home', cls: 'sm', onClick: () => G.go('myhome') }) : G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
        this.nextBtn = this.custom?.selfTest ? G.ui.btn('내 방 고치러', { color: 'green', icon: 'home', cls: 'big', onClick: () => G.go('myhome', { zone: this.custom.back, mode: 'hide' }) })
          : this.custom ? G.ui.btn('다른 방', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('visit') })
          : this.preview ? G.ui.btn('다시 보기', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', this.retryArgs()) })
          : G.ui.btn(bossNext || gameNext || (miniNext && MINI_AFTER[this.idx].boss) ? '보스 등장!' : miniNext ? '놀이 한 판!' : this.idx + 1 >= STAGE_COUNT ? '무한 모드' : homeNow ? SUI.keepGoing : '다음', { color: 'green', icon: 'play', cls: 'big',
              onClick: () => bossNext ? G.go('boss', { after: this.idx }) : gameNext ? G.go('bossgame', { kind: BOSS_GAMES[this.idx].kind, lv: BOSS_GAMES[this.idx].lv, after: this.idx }) : miniNext ? (MINI_AFTER[this.idx].lab ? G.go('bossgame', { kind: MINI_AFTER[this.idx].kind, lv: MINI_AFTER[this.idx].lv || 0, after: this.idx, interlude: true }) : G.go('mini', { kind: MINI_AFTER[this.idx].kind, after: this.idx })) : G.go('stage', { idx: this.idx + 1 }) })],
    });
    for (let i = 0; i < stars; i++) { await this.tw.wait(.28); starEls[i].classList.add('on'); G.audio.sfx('star', i); }
    const paid = first?.awarded ?? coins;
    G.ui.countUp(cv, 0, paid, 700, v => { if (v % 10 === 0) G.audio.sfx('coin', 0); });
    if (first?.repeat) cv.after(h('div', { class: 'txt' }, '다시 찾은 방이라 보상이 1/3이에요'));
    if (first?.unlockedHome) setTimeout(() => G.ui.toast('내 집이 열렸어! 방을 꾸미고 물건을 숨겨 봐', 'green'), 900);
    if (first?.allClear) { W.fx.confetti(220); setTimeout(() => !this.dead && W.fx.confetti(160), 900); }
    for (const z of first?.newZones || []) setTimeout(() => G.ui.toast(`내 집에 ${z}이(가) 생겼어!`, 'green'), 1700);
  }
  // 털기: one of the things found here goes home with 몽글이
  pickLoot(back = []) {
    const G = this.G;
    const pool = [...new Set(this.targets.map(t => t.type))].filter(t => t !== 'key' && t !== 'note' && !back.includes(t) && ITEMS[t] && !ITEMS[t].decoy);
    if (!pool.length) return Promise.resolve(null);
    const have = new Set(G.save.collection);
    return new Promise(res => {
      const cards = pool.slice(0, 6).map(t => {
        const c = h('div', { class: 'lootcard' + (have.has(t) ? ' have' : ' new'), role: 'button', tabindex: '0' },
          h('img', { src: G.thumbs['item_' + t] }), h('div', { class: 'lname' }, ITEMS[t].name), h('div', { class: 'ltag' }, have.has(t) ? '있음 · +25' : 'NEW'));
        const pick = () => { if (c.dataset.done) return; c.dataset.done = 1; G.audio.sfx('special'); G.ui.closePanel(); res(grab(G, this.custom, t)); };
        c.addEventListener('click', pick); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(); });
        return c;
      });
      G.ui.panel({ title: '하나 슬쩍!', color: 'orange', body: [h('div', { class: 'txt' }, back.length ? '내 물건은 되찾았고… 이 방에서도 하나 몰래 챙기자!' : '찾은 것 중 하나를 몰래 챙길 수 있어. 뭘 가져갈까?'), h('div', { class: 'lootgrid' }, ...cards)] });
      if (G.bot) setTimeout(() => cards[0]?.click(), 300);
    });
  }
  async lose(reason = 'time') {
    const G = this.G, W = G.world;
    G.ui.closePanel?.();
    this.result = 'fail'; this.running = false; this.tEnd = this.t;
    G.audio.sfx('lose');
    const f = this.friend; f.pose = 'idle'; f.setFace('wow'); f.faceTo(0, 0); f.bump(.4);
    this.bubble.style.display = 'none';
    this.say(f, this.spec.timed && !this.custom ? ROCKY_LOSE : '다 셌다~!', 1600);
    this.setMong('dizzy', 'shake');
    if (this.preview) { /* nothing to record */ } else if (this.custom) G.onVisitResult(this.custom, false, this.found, this.targets.length, 0); else G.onStageFail(this.idx);
    if (!this.preview) this.logRun('fail', 0);
    await this.tw.wait(.9);
    if (this.dead) return;
    const contFree = !this.continued;
    G.ui.panel({
      title: reason === 'giveup' ? '포기했어요' : '시간 초과!', color: 'red',
      body: [h('div', { class: 'big-txt' }, `${this.found} / ${this.targets.length} 찾음`), h('div', { class: 'txt' }, reason === 'giveup' ? '숨긴 사람이 한 수 위였네! 집주인에게 코인이 가요' : '조금만 더 하면 다 찾을 수 있어!')],
      buttons: [
        ...(reason === 'giveup' ? [] : [G.ui.btn('이어하기', { color: 'orange', cls: 'stack', sub: contFree ? '+20초 (무료)' : '+20초 · 코인 80', onClick: () => this.continueRun(contFree) })]),
        G.ui.btn('다시하기', { color: 'green', onClick: () => G.go('stage', this.retryArgs()) }),
        this.custom?.selfTest ? G.ui.btn('내 방 고치러', { color: 'blue', cls: 'sm', onClick: () => G.go('myhome', { zone: this.custom.back, mode: 'hide' }) })
          : this.custom ? G.ui.btn('다른 방', { color: 'blue', cls: 'sm', onClick: () => G.go('visit') }) : G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
      ],
    });
  }
  // real players only: what the balance pass needs to replace the bot model with people
  logRun(r, stars) {
    if (this.custom || this.G.bot) return;
    logStage({ s: this.idx + 1, r, stars, secs: +((this.tEnd ?? this.t) - (this.tStart ?? 0)).toFixed(1), tmax: this.timeMax, left: Math.max(0, Math.round(this.time)),
      found: this.found, total: this.targets.length, locks: this.plan.locks.length, hints: this.hintsUsed, misses: this.missCount, cont: !!this.continued, v: 1 });
  }
  retryArgs() { return this.custom ? { custom: this.custom } : this.preview ? { idx: this.idx, spec: this.spec, preview: true } : { idx: this.idx }; }
  continueRun(free) {
    const G = this.G;
    if (!free) { if (G.save.coins < 80) { G.ui.toast('코인이 부족해!', 'red'); return; } G.addCoins(-80); }
    this.continued = true; G.ui.closePanel();
    this.time = 20; this.timeMax = Math.max(this.timeMax, 20); this.result = null; this.running = true;
    this.friend.pose = 'count'; this.friend.setFace('happy'); this.bubble.style.display = '';
    this.friend.root.rotation.y = Math.atan2(this.friend.root.position.x, this.friend.root.position.z);
  }
  pause() {
    const G = this.G, ui = G.ui;
    if (this.result || !this.running) return;
    this.paused = true;
    // one aligned list (user, 10/18: "정렬도 안 됨… 마진이 안 맞아"): every setting is a full-width row — name on the left,
    // its value on the right, tap to change. Author tools (look tuning, fps, 배치 고치기) only for the owner.
    const S = G.save.settings || (G.save.settings = {});
    const row = (k, val, tap) => {
      const v = h('b', { class: 'v' }, val());
      const el = h('div', { class: 'setrow', role: 'button', tabindex: '0' }, h('span', { class: 'k' }, k), v);
      el.addEventListener('pointerup', e => { e.stopPropagation(); G.audio.sfx('click'); tap(); v.textContent = val(); });
      el.addEventListener('pointerdown', e => e.stopPropagation());
      el.refresh = () => { v.textContent = val(); };
      return el;
    };
    const snd = row('소리', () => G.audio.muted ? '꺼짐' : '켜짐', () => G.audio.setMuted(!G.audio.muted));
    const ctrl = row('조작', () => S.ctrl === 'E' ? '톡 전환' : '돌림판', () => { S.ctrl = S.ctrl === 'E' ? 'F' : 'E'; G.world.scheme = S.ctrl; G.world.eMode = G.world.eBase = 'move'; G.persist(); });
    const rows = [snd, ctrl];
    const fsOk = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
    if (fsOk) rows.push(row('전체화면', () => document.fullscreenElement || document.webkitFullscreenElement ? '켜짐' : '꺼짐', async () => {
      const el = document.documentElement;
      try { if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document); else await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); } catch { ui.toast('이 브라우저는 전체화면이 안 돼요', 'red'); }
    }));
    const tools = [];
    if (this.custom) tools.push(ui.btn('포기하기', { color: 'red', cls: 'sm', onClick: () => this.lose('giveup') }));
    if (G.owner) {
      if (!this.custom && !this.preview && this.idx >= 0 && this.idx < 70) tools.push(ui.btn('배치 고치기', { color: 'orange', cls: 'sm', onClick: () => G.go('layedit', { idx: this.idx }) }));
      tools.push(ui.btn('세팅', { color: 'blue', cls: 'sm', onClick: () => { ui.closePanel(); openTune(G, { onClose: () => { if (!this.dead && !this.result) this.pause(); } }); } }));   // stays paused while tuning
      const perfLbl = () => S.perf ? '성능 표시 끄기' : '성능 표시';
      const perf = ui.btn(perfLbl(), { color: 'gray', cls: 'sm', onClick: () => { S.perf = !S.perf; G.persist(); perf.querySelector('.lbl').textContent = perfLbl(); } });
      tools.push(perf);
    }
    ui.panel({
      title: '잠깐 쉬기', color: 'purple', cls: 'pausep',
      body: [h('div', { class: 'txt' }, `${this.th.name} · 찾은 물건 ${this.found}/${this.targets.length}`), h('div', { class: 'setlist' }, ...rows), ...(tools.length ? [h('div', { class: 'row tools' }, ...tools)] : [])],
      buttons: [ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }), ui.btn('다시하기', { color: 'orange', cls: 'sm', onClick: () => G.go('stage', this.retryArgs()) }), ui.btn('계속', { color: 'green', icon: 'play', onClick: () => { ui.closePanel(); this.paused = false; } })],
    });
  }

  // ── per-frame
  update(dt) {
    const G = this.G, W = G.world;
    this.tw.update(dt);
    if (this.paused) return;
    this.t += dt;
    this.room.update(dt); this.ambient?.update(dt);
    this.friend.update(dt); this.trick?.update(dt);
    for (const n of this.npcs || []) n.ch.update(dt);
    this.hero?.update(dt, this.tw, !!this.result || !!this.talking);
    if (this.dizzy > 0) { this.dizzy -= dt; if (this.dizzy <= 0) { this.mong.classList.remove('spin'); this.mongImg.src = G.thumbs.face_mong; } }
    if (this.jailed?.in && this.running && !this.result && (this._jT = (this._jT ?? 9) - dt) <= 0) { this._jT = 11 + Math.random() * 5; this.say(this.jailed.ch, JAIL_LINES[(this._jn = (this._jn || 0) + 1) % JAIL_LINES.length], 2000); }   // the one in the cell keeps pleading
    if (this.incident && this.friendHidden && this.running && !this.result && (!this.r1 || this.idle > 15) && (this.gigT = (this.gigT ?? 4) - dt) <= 0) { this.gigT = (this.idle > 8 ? 4 : 6.5) + Math.random() * 3; this.giggle(); }
    if (this.spec.night && !this.result && (this._starT = (this._starT || 0) - dt) <= 0) {
      this._starT = .45 + Math.random() * .5;
      W.fx.burst(Math.random() * W.W, Math.random() * W.H * .28 + 40, { n: 1, shape: 'star', speed: 6, gravity: 0, life: 1.3, size: 7, colors: ['#fff6c0', '#ffffff', '#cfe0ff'] });
    }
    if (this.running && !this.result && !this.paused) {
      this.idle += dt;
      if (this.idle > 11) this.taunt('idle');
      if (this.idle > 9) {   // a sparkle on something findable after 9 s of nothing (was 15)
        this.twinkleT -= dt;
        if (this.twinkleT <= 0) {
          this.twinkleT = 4;
          const vis = this.targets.filter(t => !t.found && !(t.spot.part && t.spot.part.t < .5) && !W.occluded(t.g, this.worldCenter(t), [this.room.group]));
          const pick = vis[Math.floor(Math.random() * vis.length)];
          if (pick) { const s = W.toScreen(this.worldCenter(pick)); W.fx.burst(s.x, s.y, { n: 5, shape: 'star', speed: 60, gravity: -30, life: .9, size: 9, colors: ['#ffffff', '#fff3a0'] }); }
        }
      }
    }
    if (this.running && this.timerOn && !this.result) {
      if (!this.G.noTimer) this.time -= dt;
      const sec = Math.ceil(this.time);
      if (sec !== this.lastSec) {
        this.lastSec = sec;
        this.tnum.textContent = Math.max(0, sec);
        this.bubble.textContent = Math.max(0, sec); this.bubble.classList.remove('pop'); void this.bubble.offsetWidth; this.bubble.classList.add('pop');
        if (sec <= 10 && sec > 0) { G.audio.sfx(sec % 2 ? 'tick' : 'tock'); }
        this.timerEl.classList.toggle('danger', sec <= 10);
        this.bubble.classList.toggle('red', sec <= 10);
      }
      this.tbarI.style.width = clamp(this.time / this.timeMax * 100, 0, 100) + '%';
      if (this.time <= 0) this.lose();
    }
    this.bubble.style.display = this.timerOn && !this.result ? '' : 'none';
    if (this.zoomTools) { if (!this.view0 && this.running) this.view0 = { yaw: W.yaw, pitch: W.pitch }; const v = this.view0, off = W.zoom > 1.12 || (v && (Math.abs(Math.atan2(Math.sin(W.yaw - v.yaw), Math.cos(W.yaw - v.yaw))) > .2 || Math.abs(W.pitch - v.pitch) > .12)) || W.target.distanceTo(W.home) > .6; this.zoomTools.style.display = off && !this.result ? '' : 'none'; }
    // friend count bubble
    const fp = W.toScreen(V.copy(this.friend.root.position).setY(this.friend.S * 1.05 + .25));
    this.bubble.style.left = fp.x + 'px'; this.bubble.style.top = fp.y + 'px';
    // tutorial hand follows its target
    if (this.tutHand) {
      let pos = null;
      if (this.tutHandPos) pos = this.tutHandPos();
      else { const g = this.nextGoal(); if (g) pos = g.pos; }
      if (pos) { const s = pos.sx != null ? { x: pos.sx, y: pos.sy } : W.toScreen(pos); this.tutHand.style.left = s.x + 'px'; this.tutHand.style.top = s.y + 'px'; }   // (a screen point: a button)
    }
  }

  // ── bots (same tap path as a player)
  botStep(dt, mode) {
    const W = this.G.world;
    if (this.result) {
      if (this.G.botHold) return;
      if (this.result === 'clear' && this.nextBtn && this.G.ui.panelOpen) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6) { this._endT = 0; this.nextBtn.press(); } }
      else if (this.result === 'fail' && this.G.ui.panelOpen) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6) { this._endT = 0; this.G.go('stage', this.retryArgs()); } }
      return;
    }
    if (!this.running || this.paused || this.cine) return;
    this.botT -= dt; if (this.botT > 0) return;
    if (mode === 'random') {
      this.botT = .3 + Math.random() * .25;
      if (Math.random() < .2) { W.rotateBy((Math.random() - .5) * 400, 0); this.rotAccum += 1; return; }
      return this.tap(W.W * (.06 + Math.random() * .88), W.H * (.22 + Math.random() * .5));
    }
    this.botT = .5 + Math.random() * .45;
    const goal = this.nextGoal();
    if (!goal) return;
    if (mode === 'human') {
      // a person does not know where things are: charge a search time per new goal, look around meanwhile
      // each thing is searched for once; after that the bot remembers where it is
      const gk = goal.item || goal.part;
      this._paid = this._paid || new Set();
      if (!this._paid.has(gk)) {
        this._paid.add(gk);
        const wait = this.humanCost(goal);
        this.botT = wait;
        if (wait > 2.5) { W.rotateBy((Math.random() < .5 ? -1 : 1) * 150, 0); this.rotAccum += .5; }
        return;
      }
    }
    this._stuck = this._stuck || 0;
    const gk = goal.item || goal.part;
    this._same = gk === this._lastGoal ? (this._same || 0) + 1 : 0; this._lastGoal = gk;
    // aim at a point where the goal really is the first thing under the finger (characters count as in the way)
    const seen = W.visibleAt(goal.obj, goal.pos, [this.room.group, this.friend.root, ...(this.npcs || []).map(n => n.ch.root)]);
    if (!seen || this._same % 6 === 5) {
      // off the screen: pan toward it first, as a player would (zooming in a little when the map is wider than the view)
      const sp = W.toScreen(goal.pos);
      if (!(sp.x > 0 && sp.x < W.W && sp.y > 0 && sp.y < W.H)) {
        if (W.zoom < 1.4 && !W.slack) W.zoom = 1.4;
        W.target.x += (goal.pos.x - W.target.x) * .6; W.target.z += (goal.pos.z - W.target.z) * .6; W.target.y += (goal.pos.y - W.target.y) * .6;
        W.clampTarget(); this.botT = .3; return;
      }
      this._stuck++;
      if (this._stuck % 7 === 6) { this._pi = ((this._pi || 0) + 1) % 4; W.pitch = [.62, 1.0, 1.15, .36][this._pi]; }
      W.rotateBy(-110, 0); this.rotAccum += .4; this.botT = .22;
      return;
    }
    // under the HUD (zoom gauge, badge, tray, top bar): slide the view so it comes out from under — what a person does
    if (seen && (seen.x < 30 || seen.x > W.W - 96 || seen.y < 150 || seen.y > W.H - 250)) {
      W.target.x += (goal.pos.x - W.target.x) * .5; W.target.z += (goal.pos.z - W.target.z) * .5; W.clampTarget(); this.botT = .25;
      this._hud = (this._hud || 0) + 1; if (this._hud < 12) return;
    }
    this._hud = 0;
    this._stuck = 0;
    const s = seen;
    const err = this.G.botErr ?? .25;
    let x = s.x, y = s.y;
    if (Math.random() < err) { x += (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 60); y += (Math.random() - .5) * 80; }
    this.tap(x, y);
  }
  // Search-time model for the human-pace bot (seconds before a person would act on this goal). A model, not a person:
  // tune the constants against real playtests.
  humanCost(goal) {
    const R = () => .7 + Math.random() * .6;
    const closed = this.room.parts.filter(p => p.spots?.length && p.t < .5 && !p.lock && !p.isLever).length;
    const clutter = this.items.filter(i => i.role === 'decoy' && !(i.spot.part && i.spot.part.t < .5)).length;
    if (goal.kind === 'item') {
      if (goal.item.spot.part) return 1.0 * R();                       // it was just revealed
      const base = goal.item.spot.kind === 'on' ? 3.0 : 4.6;         // tucked behind / under needs a turn
      return (base + clutter * .15) * (this.spec.silhouette ? 1.3 : 1) * R();
    }
    const p = goal.part;
    if (p.isLever) return 4.5 * R();                                   // notice the chain, find the lever
    if (p.lock) return 1.8 * R();                                      // clue in hand, go back to the lock
    return Math.min(9, 1.2 + closed * .45) * R();                      // opens wrong containers first
  }

  // QA: is every target (and chain item) visible from some camera angle once its container is open?
  audit() {
    const W = this.G.world, out = [];
    const y0 = W.yaw, p0 = W.pitch, z0 = W.zoom, t0 = W.target.clone();
    W.zoom = 1;
    const tags = this.room.parts.map(p => p.sockTagMesh).filter(Boolean);   // a pinned sock comes off before its door opens
    tags.forEach(t => { t.visible = false; });
    for (const it of this.items.filter(i => i.role !== 'decoy' && !i.found)) {
      const part = it.spot.part, wasT = part?.t ?? 0;
      if (part) { part.setOpen(1); it.g.visible = true; }
      W.target.copy(this.worldCenter(it));   // a player pans to where they look
      let views = 0;
      for (const p of [.36, .62, .95, 1.15]) for (let k = 0; k < 12; k++) {
        W.yaw = k * Math.PI / 6; W.pitch = p; W.updateCam(); this.room.update(1); this.room.group.updateMatrixWorld(true);
        if (!W.occluded(it.g, this.worldCenter(it), [this.room.group])) views++;
      }
      if (part) { part.setOpen(wasT); it.g.visible = wasT > .05; }
      out.push({ type: it.type, role: it.role, where: it.spot.label, views });
    }
    tags.forEach(t => { t.visible = true; });
    W.yaw = y0; W.pitch = p0; W.zoom = z0; W.target.copy(t0); W.updateCam();
    return out;
  }
  state() { return { scene: 'stage', custom: !!this.custom, stage: this.idx + 1, found: this.found, total: this.targets.length, time: +this.time.toFixed(1), timeMax: this.timeMax, elapsed: +((this.tEnd ?? this.t) - (this.tStart ?? 0)).toFixed(1), locks: this.plan.locks.length, result: this.result, dizzy: this.dizzy > 0, keys: this.keys }; }
}
