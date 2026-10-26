// Core loop: a friend counts down while you rotate their 3D room and find what they hid.
import { applyFxOverrides } from '../fxpanel.js';
import * as THREE from 'three';
import { Room, attachItem } from '../room.js';
import { MapRooms, FLOOR_H } from '../map.js';
import { disposeTree, put, rbox } from '../gfx/kit.js';
import { Ambient } from '../ambient.js';
import { Companion, walkGrid, seenAt, wallSides, offWall } from '../companion.js';
import { BOSS_AFTER } from './boss.js';
import { MINI_AFTER, MINI_INFO, BOSS_GAMES } from '../minis.js';
import { BOSS_GAME_INFO } from './bossgame.js';
import { THEMES, stageSpec, layoutFor, planStage, planIncident, planShow, planCustom, capDecoys, STAGE_COUNT, CHAR_UNLOCK, REGION_INTRO, REGIONS, regionOf, sized } from '../stages.js';
import { spinePuzzle } from '../showcase.js';
import { deviceLayout, runDevice, deviceTell, DEVICE_FOUND } from '../devices.js';
import { chainPrep, chainPlan, chainLayout } from '../gpt-chains.js';
import { heroLayout as gptHeroLayout } from '../gpt-heroes.js';
import { tapsSetup, spendTap, somethingIn, tapsStarOk, TAP_TXT } from '../taps.js';   // 톡 횟수 (10/18)
import { LENS_FREE, lensLeft, lensBadge, takeLens, noLens, lensHint, lensBack, lensClear } from '../lens.js';   // 돋보기 가방 (경제 B5, G.econ only, 10/19)
import { seenRow } from '../gift.js';   // 결과창 도감 그림 줄 (경제·로비 10/19)
import { homeRow, PASSAGE_EVERY } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)
import { tierPass, tiltLayout } from '../tiers.js';   // 보이는 층 (1장 2~11판, 10/18)
import { fixSmall } from '../smallfix.js';   // 작은 물건 안전망 (#94, ② 레벨 10/21)
import { zoneLayout, houseLayout, ZONE_TYPES } from '../catalog.js';
import { recordPlay, logStage } from '../net.js';
import { buildItem, ITEMS, LOCK_COLORS } from '../gfx/items.js';
import { drawnScale, wantScale, capScale, faceItem, centerOn, nestles, fitPrep, squareIfCrossing, settleOn, DECOY_SIZE } from '../fitspot.js';   // 자리에 맞는 물건 (10/19)
// a placed thing's longest side as drawn (m): its own meshes, not its tap sphere
const _dl = new THREE.Box3(), _dlb = new THREE.Box3();
function drawnLong(g) {
  g.updateMatrixWorld(true); _dl.makeEmpty();
  g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _dl.union(_dlb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  if (_dl.isEmpty()) return 1;
  const v = _dl.getSize(new THREE.Vector3()); return Math.max(v.x, v.y, v.z);
}
import { setPlace, oddness, isCold } from '../affinity.js';
const HINTS_OLD = typeof location !== 'undefined' && /[?&]hints=old(&|$)/.test(location.search);   // (the v157 automatic help, to compare)
// 톡톡 두 번 확대 수업: 3판 (was 2판 — 2판 teaches turning while you drag now, one hand a stage: 1~10판 밸런스 10/19, 조작감 세션과 맞춤; ?dbl2=1 → 2판)
const DBL_AT = typeof location !== 'undefined' && /[?&]dbl2=1(&|$)/.test(location.search) ? 1 : 2;
import { FURN_INFO, makeFurniture } from '../gfx/furniture.js';
const FURN_NAME = t => FURN_INFO[t]?.name || t;
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { storyFor, playDialog, playCinematic, slidePuzzle, setFrameSolved } from '../story.js';
import { Trickster } from '../trickster.js';
import { markWallFacing } from '../facing.js';
import { sweepSetup, sweepUpdate, shinePart, sweepAddTv } from '../sweep.js';   // 빛 쓸기 (10/19)
import { reelSetup, reelCast, reelSay, reelClear } from '../reelcatch.js';   // 낚싯대 릴 뽑기 (10/19)
import { TUT_B, TUTB_TXT, tutB1, tutB2, turnLine1, firstFinds, firstFindsTalk } from '../tutb.js';
import { NOTE3D, showNote3D } from '../noteview3d.js';
import { teachDbl, DBL_ON, TILT_ON } from '../teachdbl.js';   // 두 번 톡 확대 수업 (10/19)
import { keyOpen } from '../keyfx.js';   // 열쇠 따기: 꽂고 돌려 철컥 (10/21)
import { popColors } from '../colorpop.js';   // 흑백판 끝 색이 하나씩 (10/21)
import { closeUp, closeBack, clearParts, clearTurn, covered } from '../closeup.js';
import { controlsBlock, openHelp } from '../controlshelp.js';   // 조작 요약 · 도움말 (10/20)   // 말할 때·끝날 때 카메라 (10/19)
import { armFtap, armFtapB, ftapLesson1 } from '../teachftap.js';   // 끌다가 톡 회전 수업 (10/19)
import { FEEL, haptic } from '../feel.js';
import { shown as isShown } from '../world.js';
import { persona, CLUE_TELL, HELLO, NEAR, BUMP, BONUS, nextHook } from '../incident-story.js';
// 대본 (10/18): what everyone says, tied to the map + kind of stage, not the stage number (_handoff/script-ko-en-20261018.md)
import { R1, r1Line, KIT_TALK, inkyNamed } from '../script.js';   // R1 몰래 숨기 lines (story session, 10/18)
import { staging, stagingHide, stagingHidden, stagingCrossing, stagingPrep, hatKeyHide, stagingPart, stagingTap } from '../staging.js';
import { asRoom } from '../roomalias.js';
import { grayPhase, sceneAt, hostAt, goalLine, incidentIntro, incidentReveal, hideLine, hidePool, grayIntro, inkyTaunt, inkyCaught, inkyStays, sceneAfter,
  timedIntro, timedWin, ROCKY_LOSE, BONUS_SAY, firstLayout, planFirst, boxTail, newCard, DO, UI as SUI, fallbackIntro, isHidden, hiddenIntro, hiddenGoal, hiddenSay, inkyHide, INKY_FOUND,
  stageHost, diarySecret, secretOpen, anySecret, SECRET_UI, replayHi, stuckLine } from '../script.js';
import { tr } from '../i18n.js';
import { EN } from '../i18n-en-dict.js';
const SHELF_GOAL = '빠진 그림책을 찾아서 책장에 꽂아 줘!';   // (12판 첫 손 — 스토리 룸이 대사를 맞추면 script.js로 옮겨도 돼요)
EN[SHELF_GOAL] ??= 'Find the missing picture book and put it back on the shelf!';
EN['놀이 하고 가기'] ??= 'Play the game';
// the star reasons the 흑백·너굴이·방탈출 stages had none of (QA 10/18: 2 stars on a boss with no word why)
const STAR_TXT = { time: (EN['★ 시간 넉넉히'] = '★ Time to spare', '★ 시간 넉넉히'), secret: (EN['★ 비밀 아이템'] = '★ Secret item', '★ 비밀 아이템') };
// 숨은그림 판 다듬기 (hunt.js: the host's habit places, no place nobody can see into, the key where you see it, the next
// friend peeking — an optional find) and the 몰래 숨기 v2 prototype (?hide=2, r1v2.js; off unless asked for)
import { blindFor } from '../hunt-blind.js';
import { PICKS, GIFT_AT, FREE_KITS, pickPanel, takePick, metFriends, callableFriends, friendPrice, keepsake, toShop } from '../econ.js';
import * as SCRIPT_ALL from '../script.js';   // (callResult: the stage result's '이제 ○○를 집에 부를 수 있어 · 120' — 스토리 룸)   // 경제·로비 (10/19)
import { isHunt, huntExtras, chainToView, fixBlindSpots, placeCameo, cameoFound, habitOf, coveredFrac, cameoKind, moveItem } from '../hunt.js';
import { obsSetup, obsClue, lockInput, obsLook } from '../obslock.js';   // R4 관찰 자물쇠
// R2: stages where the story has the friend break their habit (1판 the toy box, 30판 "이번엔 냄새 나는 데 안 가", 41판 "오늘은 물 없는 데!")
const HABIT_BREAK = new Set([0, 29]);   // (41판 is 다람이's lever stage since v96 — no habit-breaking line there)
import { v2Wanted, v2Setup, v2Prep, v2Hide, v2Tell, v2PointAll, v2KeyToast, v2OpenSound, v2Wrong, v2Hint, v2AfterFound, v2Stars, v2StarWhy, v2Stamp, v2Title, v2Update, v2PeekTap } from '../r1v2.js';
const JAIL_LINES = ['억울해! 난 그냥 여기 숨어 있었다고!', '진짜 도둑은 그 까만 애라니까~!', '여기 의자 딱딱해…', '열쇠 찾으면 나 좀 꺼내 줘!', '술래가 갇히면 숨바꼭질은 누가 해…'];
const ROBOT_COST = 50;
import { h, ICON } from '../ui.js';
import { ease, clamp, Tweens } from '../util.js';
import { openTune } from '../tune.js';
import { retrieve, canGrab, grab } from '../raid.js';
import { isRaid, raidSetup, raidGoal, raidStart, raidFind, raidSettle, raidScout, settleOpen } from '../raidrun.js';   // 타이머 털기 (10/19)
// 프라모델 조립판 (정식판 10/19): the things to find are a model kit's pieces — the box opens first, a runner card holds them,
// the last one sets off the build (modelkit.js). 놀이 모음's kit stage (S.model) or a campaign stage with spec.kit (8판).
import { MODEL_STAGES, modelSpec, planModel, kitForce, kitRunner, kitSetup, kitFound, kitIntro, kitTruck, kitFinish, kitReward, kitCover } from '../modelkit.js';
import { lookRecipe, lookTheme, lookLayout, setSky, Look, LOOK, COZY_NIGHT, COZY_DARK } from '../look.js';   // 룩 레벨업 실험 (?look=0 = off)
import { heroLayout } from '../heroes.js';
import { KITS } from '../gfx/modelkit-props.js';
import { IN_APP, QA_TOOLS } from '../build.js';
import { tvScreens, openMongleTV, tvLevel, tvGameFor, TV_COINS, TV_TAPS, TV_GAMES } from '../mongletv.js';   // 몽글 TV (10/19)
import { openArtHunt } from '../arthunt.js';   // 10판 그림 속 숨은그림 (10/23)
import { songDrift } from '../songdrift.js';   // 오래 못 찾으면 노래가 빨라짐 (10/21)

// 레벨 보고서 R1 '몰래 숨기' 시제품 (10/18) — only with ?hide=1 (the user compares it on the phone before anything changes):
// you don't watch the friend hide ("눈 감아! 하나, 둘, 셋" and only the sounds), 2–3 big hideouts are candidates, a trail of
// crumbs leads toward the real one, a wrong one says "여긴 없지롱~" and the real one giggles; giggles/wobbles only after 15 s
// of nothing. (Prototype simplification: after 3 wrong guesses the real one gives itself away instead of the friend moving.)
// R1 몰래 숨기 is the default since 10/18 (user: "좋아 알원"); ?hide=0 brings back the old watch-it-hide version
const HIDE_R1 = !/[?&]hide=0(&|$)/.test(location.search);
const R1_HIDE = ['wardrobe', 'bigfridge', 'fridge', 'chest', 'trunk', 'tent', 'firetruck', 'jailcell', 'patrolcar', 'lockers', 'safe', 'dishcab', 'pastrycase', 'shopfront', 'washer3', 'minifridge', 'tentsmall', 'cooler', 'kpopstage', 'artcrate', 'lostbox', 'vending', 'drawers', 'mailbox', 'picnic', 'bookshelf', 'desk', 'toybox', 'cabinet', 'closet', 'sideboard', 'shoerack', 'laundrybasket', 'dresser',
  'aptwall', 'recyclebins', 'icecart', 'bbqgrill', 'parkbin', 'shrinebox', 'backpack2', 'bathtub', 'bed'];   // 10/18 레벨 세션: 8·41·48·50판 had 0-1 candidates 

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
  furn: ['그 큰 걸 이제야 봤어? 히히', '가구까지 찾다니!'],
};

// how many 흑백판 come before this one (the first two teach the rule — 4·10판)
import { hideCard, quickHide } from '../hideshort.js';
const grayBefore = idx => { let n = 0; for (let j = 0; j < idx; j++) if (stageSpec(j).gray) n++; return n; };

export class StageScene {
  constructor(G) { this.G = G; this.name = 'stage'; }

  async enter({ idx = 0, custom = null, spec = null, preview = false, model = null, retry = false, seed = null, scout = false }) {
    const G = this.G, W = G.world;
    this.tw = new Tweens(); this.retryRun = !!retry;
    this._tapClock = 0; this.clearTapTimers();
    // a model-kit stage (modelkit.js) plays like a preview too: outside the campaign, no progress, coins or logs
    this.model = model && MODEL_STAGES[model] ? { kind: model, ...MODEL_STAGES[model] } : null;
    this.preview = preview || !!this.model;   // an art preview room: plays like a stage, touches no progress, coins or logs
    this.custom = custom; this._paid = new Set(); this.tStart = this.tEnd = null;
    let layout;
    if (this.model) {
      this.idx = -1; this.spec = modelSpec(model); this.scene = null;
      layout = layoutFor(this.spec.room);
      this.th = { ...(THEMES[this.spec.room] || layout.theme), name: this.model.title, friend: this.model.friend };
    } else if (custom) {
      // someone else's room: their furniture, their hiding places, their locks
      const seed = [...String(custom.owner || custom.id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const kinds = ['bunny', 'bear', 'cat', 'peng'];
      layout = custom.zone.rooms ? houseLayout(custom.zone) : zoneLayout(custom.zone);   // (a ready-made house may be two rooms — presets.js)
      const count = (custom.hidden || []).filter(e => e.item !== 'key' && e.item !== 'note').length;
      this.idx = -1;
      this.spec = { idx: -1, room: custom.zone.type, time: 40 + count * 12 + (custom.locks?.length ? 12 : 0), n: count, seed, custom: true };
      this.th = { ...layout.theme, name: custom.practice ? `${custom.nick}의 ${custom.title}` : `${custom.ownerName || '누군가'}의 ${custom.title || '방'}`,
        friend: custom.face && CHAR_DEFS[custom.face] && custom.face !== 'mong' ? custom.face : kinds[seed % kinds.length], bg: ZONE_TYPES[custom.zone.type]?.indoor ? ['#fff3e3', '#ffe2c4'] : ['#e4f6ff', '#d6f3d8'] };
      if (!layout.rooms) layout.friendAt = [2.0, 2.0];
    } else {
      this.idx = idx; this.spec = { ...stageSpec(idx), ...(spec || {}) };
      // (다시 할 때 자리 바꾸기 — 경제 세션 보상 고리, 10/19: a stage you've cleared before deals its things anew each replay,
      // so chasing a missing ★ is looking again, not remembering; a '다시 하기' after a loss keeps the same deal; the two
      // tutorials keep theirs — their script points at fixed places)
      const clears = G.save.clears?.[idx] || 0;
      if (clears && !retry && !spec && !(this.spec.tut <= 2)) this.spec.seed += 7919 * 13 * clears;
      // (외부 QA 10/21 QA17-01) '다시 하기' keeps the deal it was on: a replay's moved deal came back as the first one (11판's key
      // went from the bookcase to the wall shelf) — retryArgs carries the seed this run used; a new replay from home deals anew
      if (retry && seed != null) this.spec.seed = seed;
      layout = layoutFor(this.spec.room);
      this.th = THEMES[this.spec.room] || layout.theme;   // a map without its own THEMES entry wears its first room's look
      if (this.spec.timed) this.th = { ...this.th, friend: 'raccoon' };   // 너굴이 hosts the timed hide-and-seek
      this.scene = sceneAt(idx);   // 대본: this stage's own scene, if the script pins one here
      const ho = hostAt(idx); if (ho) this.th = { ...this.th, friend: ho };   // e.g. 펭펭이 at the fire station
      if (this.scene?.name) this.th = { ...this.th, name: this.scene.name };   // the stage's title, when the map's own says someone else's home
      if (this.spec.tut === 1 && !G.save.settings?.oldMode) layout = firstLayout(layout);   // 1판: the toy box faces away from you
      if (this.spec.tut === 2) layout = tiltLayout(layout);   // 2판: the loft curtained — the tilt lesson's place (tiers.js)
      if (this.spec.showcase) layout = deviceLayout(this.spec.room, layout);   // R6 장치판: the map's device piece, this stage only
      layout = chainLayout(this.spec, layout);   // (②b: a GPT device moved into this stage's own map — gpt-chains.js)
      // 판마다 대표 소품 (G3 10/22): this stage's own hero piece in place of an everyday one of the same size (heroes.js)
      layout = heroLayout(this.spec.room, layout);
    }
    if (custom) this.scene = null;
    // 프라모델 조립판: 놀이 모음's kit stage, or a campaign stage whose spec names a kit (8판 꼬마 로봇) — the hunt as always,
    // its things the kit's pieces (the one a padlock guards first), then the build (modelkit.js)
    this.kit = this.model ? { kit: this.model.kit, go: this.model.go, wrong: this.model.wrong, hid: this.model.hello } : !custom && this.spec.kit && KITS[this.spec.kit] ? { kit: this.spec.kit, ...KIT_TALK[this.spec.kit] } : null;   // (go · wrong · open · hid — 스토리 룸)
    if (this.kit && !this.model) this.spec = { ...this.spec, n: KITS[this.spec.kit].order.length, force: kitForce(this.spec.kit) };
    this.kitRetry = !!retry;
    this.lookR = lookRecipe(this.spec.room, this.spec); if (this.lookR) this.th = lookTheme(this.lookR, this.th);
    layout = lookLayout(this.lookR, layout);   // a shop's look builds its room(s) in the look's own colours, this stage only
    if (!custom && !this.model) layout = gptHeroLayout(this.spec.room, layout, { enabled: !/[?&]heroes=0(&|$)/.test(location.search) });
    const th = this.th;
    G.setBg(th.bg); W.setLight(th.light); setSky(th.sky || null);
    // 밤 판: moonlight — dimmer and bluer, but every corner still reads (no torch, no silhouettes)
    const nightL = this.lookR && LOOK.has('light') && this.lookR.night;
    if (this.spec.night && !this.plan?.light) {
      if (nightL) { G.setBg([nightL.sky[1], nightL.sky[2]]); setSky(nightL.sky); W.setLight(nightL.light); }
      // (포근한 밤 G2 10/21·10/22: a starry sky, the moon and a warmer light — no glow, the user's 10/22 call: NO_GLOW)
      else { G.setBg([COZY_NIGHT.sky[1], COZY_NIGHT.sky[2]]); setSky(COZY_NIGHT.sky); W.setLight(COZY_NIGHT.light); }
      // 판마다 밤빛 더하기 (10/23 사용자 9판 메모: "여기 라이트 약간 더 줄 수 있남? 전체적으로")
      const lift = { bunnybath: 1.25 }[this.spec.room];
      if (lift) { W.hemi.intensity *= lift; W.sun.intensity *= lift; }
    }
    // 흑백판: the look's grey-stage light, if it has one (look.js — 14·17판), till the colour comes back
    const grayL = this.lookR && LOOK.has('light') && this.lookR.gray;
    if (this.spec.gray && grayL) W.setLight(grayL.light);
    this.layout = layout;
    this.room = layout.rooms ? new MapRooms(W, layout) : new Room(W, layout);
    this.wallFacing = markWallFacing(this.room);   // 벽을 보는 서랍·자물쇠 (facing.js, 10/19)
    W.root.add(this.room.group);
    this.ambient = new Ambient(this.room);   // plants sway, clothes sway, warm things steam
    // 숨은그림 판: about half the things where this host would put them, never a place nobody can see into (hunt.js)
    this.hunt = !custom && !this.preview && isHunt(this.spec);
    if (this.hunt) this.spec = huntExtras(this.spec, th.friend);
    else if (!custom && !this.preview) this.spec = { ...this.spec, avoid: this.spec.avoid || blindFor(this.spec.room) };   // a 사건 판's bonus things, a 흑백판's too: never where nobody can see (QA N11)
    this.story = custom ? null : storyFor(this.idx);
    // 사건 판 (10/17 pivot): the owner hides behind a lock and finding them is the goal (세팅 → 더보기 has the old way)
    this.incident = !custom && !this.preview && (!!this.spec.incident || this.spec.tut === 1) && !G.save.settings?.oldMode;
    setPlace(custom ? null : this.spec.room);   // (a place the story room went through thing by thing: 3판 — affinity.js)
    fitPrep(this.room);   // (this room's walls for the box test — fitspot.js)
    // what the last three stages played asked for: this one picks other things first (stages.js planStage, 10/20)
    const recentT = G.save.recentT || [];
    if (!custom && !this.preview) this.spec = { ...this.spec, recentTypes: recentT.filter(e => e.i !== this.idx).flatMap(e => e.t) };
    const chainP = custom || this.preview ? null : chainPrep(this.room, this.spec);   // (조립판도: 보조 장치만 — gpt-chains recipeFor, ② 10/22)   // (②b 10/22: a GPT map's chained device — gpt-chains.js)
    this.plan = custom ? planCustom(this.room, custom, this.spec.seed) : this.kit ? planModel(this.room, this.spec, this.story) : (this.incident && this.spec.tut === 1 && planFirst(this.room, this.spec)) || (this.incident && this.spec.showcase && planShow(this.room, this.spec, this.story)) || (this.incident && planIncident(this.room, { ...this.spec, habit: HABIT_BREAK.has(this.idx) ? null : habitOf(th.friend) }, this.story)) || planStage(this.room, this.spec, this.story);
    // (1판: three things in plain sight beside the friend — tutb.js firstFinds, ② 10/26)
    if (this.plan?.first && this.spec.tut === 1 && TUT_B) firstFinds(this.plan, this.room);
    if (chainP) this.plan = chainPlan(this, this.plan, chainP);
    if (this.incident && !this.plan.incident) this.incident = false;
    if (!custom && !this.model && !this.preview) this.decoysCut = capDecoys(this.plan, this.spec);   // 함정 상한 (stages.js)
    if (!custom && !this.preview && !G.bot) { G.save.recentT = [{ i: this.idx, t: this.plan.targets.filter(t => t !== 'friendtoken') }, ...recentT.filter(e => e.i !== this.idx)].slice(0, 3); G.persist?.(); }
    this.v2 = null; const wantV2 = v2Wanted(this);
    if (wantV2) this.plan.placements = this.plan.placements.filter(p => p.role !== 'decoy');   // v2: a friend-finding stage has no decoys
    for (const l of this.plan.locks) {
      if (l.kind === 'treat') { l.part.lock = { kind: 'treat' }; continue; }   // guarded by a character, no lock hardware
      if (l.kind === 'dig') { l.part.lock = { kind: 'dig' }; continue; }       // the red X in the sand: dig it with the shovel
      if (l.kind === 'sock') { l.part.lock = { kind: 'sock', code: l.code }; this.sockTag(l.part, l.code); continue; }   // a lone sock pinned on a washer
      if (l.kind === 'spine' || l.kind === 'marble' || l.kind === 'gadget') { l.part.lock = { kind: l.kind, code: l.code }; l.part._hadLock = true; continue; }   // 비밀 서재
      l.part._hadLock = true;
      l.part.furn.setLock(l.part, l.kind, l.code); if (l.lever) l.part.leverPart = l.lever; if (l.puzzle) l.part.lock.puzzle = l.puzzle; if (l.tv) l.part.lock.tv = true;
    }
    if (wantV2) v2Setup(this);   // three candidates, one lock kind
    this.treats = 0; this.secretFound = false; this.guard = null;
    this.items = []; this.friendItem = null;   // (the last stage's hidden friend must not carry over)
    const r = this.plan.rotSeed;
    for (const p of this.plan.placements) {
      const g = buildItem(p.type, { code: p.code, v: p.v, piece: p.piece });
      // small things to find are drawn bigger (to ~22 cm across) as far as the spot's headroom allows — a mandarin or a
      // key was a few pixels on a phone (user, 10/17: "오렌지 너무 작아")
      // (10/18, user: "너무 작은 아이템들 있어. 오렌지 음료수나 왕관이나 또 열쇠 너무 작음 쪽지랑": to ~28 cm, up to 2x, and the
      // clues — keys, notes, colour cards, tools — too, not only the things on the list)
      // (the size: wantScale/drawnScale in fitspot.js — ~34 cm on the longest side, at least 1.25×, up to 2.4×; held to the
      // place's box: its headroom and the room round it, so nothing pokes through a cubby wall or a basket — 10/19 user)
      // (a lock's thing that had to take a tight place: as big as the place lets it, never under .6)
      const want = this.itemWant = this.spec.itemSize || LOOK.has('items') && this.lookR?.itemSize || .34;   // (spec.itemSize: a wide map's own — stages.js ITEM_TUNE, ② 레벨 10/21)
      const sc = drawnScale(p.type, p.spot, p.role, want) || Math.max(.6, Math.min(wantScale(p.type, p.spot, p.role, want), capScale(p.type, p.spot)));
      // (and it looks out of its place — 3판 "고무오리 얼굴이 바구니 쪽에 있음", user 10/19: a little either side of that)
      const jit = (r() - .5) * .7; g.userData.jit = jit;
      attachItem(p.spot, g, { rotY: 0, scale: sc }); faceItem(g, p.spot, jit); centerOn(g, p.spot); squareIfCrossing(g, p.spot); settleOn(g, p.spot);
      if ((p.spot.kind === 'on' || p.spot.kind === 'inside') && !nestles(p.spot) && !p.spot.wallFace) this.fitClear(p.spot, g);   // (not flat on a wall behind a poster or a frame: the wall it lies on read as in the way — 70%)   // (10/19 user: "스테이지5 열쇠 뚫어 버렸네? 크기 키우다가 ㅋ")
      // (a decoy that clearing its place squeezed under ~15 cm on its longest side reads as a toy of itself — 2판 커튼 뒤 창틀의
      // 토끼 슬리퍼 came out 10 cm, 사용자 10/24 "쓰레빠 웰케 작아짐": fitspot lets a decoy down to 15 cm, fitClear then took 30% more;
      // that place gets none, like a decoy fitspot already turns away)
      if (p.role === 'decoy' && drawnLong(g) < (DECOY_SIZE[p.type]?.[1] || .15)) { g.parent?.remove(g); p.spot.itemGroup = null; continue; }
      const it = { type: p.type, role: p.role, spot: p.spot, g, found: false, code: p.code, forPart: p.forPart, piece: p.piece };
      if (p.hang) it.hang = p.hang;   // (7판: on the pulley's top hook, out of reach until the basket comes up — tapHung / dropHung)
      if (p.vacHidden) { it.vacHidden = true; g.visible = false; }   // rides out on the robot vacuum (아파트 장치판)
      if (p.type === 'friendtoken') { it.friend = true; it.thumb = G.thumbs['face_' + this.th.friend]; this.friendItem = it; }
      g.userData.item = it; p.spot.item = it;
      this.items.push(it);
    }
    if (this.spec.hatKey) hatKeyHide(this);   // (27판: the locker key in the straw hat on the platform roof — the crossing's train blows it down)
    if (this.plan.showcase?.marble && this.plan.showcase.door.furn.marbleBall) this.plan.showcase.door.furn.marbleBall.visible = false;   // (12판: the run's marble is the one you find — ② 10/23)
    // (9판 ② 10/23: the wall light switch is one of the things to find — tapped, it's found and the lights come on)
    if (this.plan.lightItem) {
      const sw = this.plan.lightItem, it = { type: 'lightswitch', role: 'target', lightSwitch: true, g: sw.f.group, spot: { kind: 'on', label: '전등 스위치', part: null, furn: sw.f }, found: false };
      sw.f.group.userData.item = it; this.items.push(it); G.needThumbs?.(['item_lightswitch']);
    }
    this.targets = this.items.filter(i => i.role === 'target');
    this.look = this.lookR ? new Look(this, this.lookR) : null;   // 룩 실험: the map's surroundings, fill, night glows
    // (10/24 사용자 "배경 목업에 들어간 스트로크는 쓰지 말자. 본 스테이지에만"): 판 밖 배경(userData.scenery — 하얀 동네·먼 동네 실루엣·
    // 멀리 보이는 다음 판 건물)은 잉크 외곽선 없이 색만(layer 2); 외곽선은 판(섬·방) 안 물체에만
    { const bg = o => { if (o.userData.scenery) { o.traverse(m => { if (m.isMesh) m.layers.set(2); }); return; } for (const c of o.children) bg(c); };
      bg(this.room.group); if (this.look) bg(this.look.group); }
    if (G.world.post) {
      const P = G.world.post, nightGlow = !!(this.spec.night || this.spec.dark);   // 때깔 빛 번짐: night and power-cut stages (10/21)
      // 낮 빛 (10/21 사용자 "글로우 .12 뽀샤시 .12(→.2), 동시에 넣지 말고 기차랑 골목씬에"): the train trip gets a soft glow on its brightest
      // spots, the alleys a 뽀샤시 (a soft blurred copy of the whole picture screened on top) — one or the other, never both.
      // Same cost either way (one quarter-size bright pass + two blurs). ?glow=0.3 [&glowth=0.82] / ?diffuse=0.3 still try any stage
      // (?glowst=27,28 limits the try to those stages); ?glow=0 / ?diffuse=0 turn a stage's own off
      // 밤 빛 번짐은 판마다 따로 (10/22 사용자, 18판 너굴이네 복층: "너무 뿌옇다. 글로우 좀 줄여", "절반 줄여") — 없으면 .8
      const NIGHT_GLOW = { otakuloft: .4 };
      const DAY = { station: ['diffuse', .09], traincar: ['diffuse', .09], traincar2: ['diffuse', .09], traincar3: ['diffuse', .09], seaside: ['diffuse', .09], island2: ['diffuse', .09], street: ['diffuse', .09], alley1: ['diffuse', .09], alley3: ['diffuse', .09], alleyhouse: ['diffuse', .09], alleywide: ['diffuse', .09] };
      // (10/22 사용자 후보정 결정: 뽀샤시 .09는 기차·골목·섬만, 글로우는 아예 안 씀 — 밤 판도)
      const EARLY = null;   // (10/22 사용자 고침: "1~20판에는 뽀샤시 넣지 말라는 거였는데")
      const q = new URLSearchParams(location.search), only = (q.get('glowst') || '').split(',').filter(Boolean).map(Number);
      const num = k => { const v = q.get(k); return v != null && v !== '' && !isNaN(+v) && (!only.length || only.includes(this.idx + 1)) ? +v : null; };
      const own = !nightGlow && !this.spec.gray && (DAY[this.spec.room] || DAY[asRoom(this.spec.room)] || EARLY), gq = num('glow'), dq = num('diffuse');
      let glow = own && own[0] === 'glow' ? own[1] : 0, dif = own && own[0] === 'diffuse' ? own[1] : 0;
      if (gq != null) { glow = nightGlow ? 0 : gq; if (gq > 0) dif = 0; }
      if (dq != null) { dif = dq; if (dq > 0) glow = 0; }
      const NO_GLOW = true;   // (10/22 사용자: "글로우는 아예 안 쓰기로" — 낮 판; ?glow=N 시험은 그대로)
      if (NO_GLOW && gq == null) glow = 0;
      P.nightShade = nightGlow;   // (10/23 사용자 9판 메모: "어두울 때는 스펙큘러 하이라이트 약하게 해야겠다. 지저분하게 되네" — fxpanel.js 반짝 점 .35배)
      const nightOn = nightGlow;   // (10/22 저녁 사용자, 9판 후보정판으로 맞춰 봄: "어두운 판에서는 글로우 킬까 봐! 넘 밋밋" — 밤·정전 판만 글로우 .42·문턱 .66)
      P.bloomOn = nightOn || glow > 0 || dif > 0;
      P.bloomStr = nightOn ? (NIGHT_GLOW[this.spec.room] ?? .42) : glow;
      if (P.du?.diffuse) P.du.diffuse.value = nightGlow ? 0 : dif;
      const tl = num('tilt');   // 후보정 시험: 위·아래 흐림은 흐린 사본이 필요해서 빛 번짐 흐림을 문턱 없이 씀(이때 글로우·뽀샤시는 끔)
      if (tl > 0) { P.bloomOn = true; P.bloomStr = 0; if (P.du?.diffuse) P.du.diffuse.value = 0; }
      if (P.du?.tilt) P.du.tilt.value = tl > 0 ? tl : 0;
      const gth = q.get('glowth');
      if (P.blu?.th) P.blu.th.value = tl > 0 ? -1 : nightGlow ? .66 : dif > 0 ? .2 : gth != null && gth !== '' && !isNaN(+gth) ? +gth : .82;
      applyFxOverrides(P);   // 후보정 조절판에서 움직인 값이 판의 값 위에 (fxpanel.js)
    }
    this.hasBook = false; this.cine = false;
    if (this.plan.showcase?.shelf) { const S = this.plan.showcase; S.shelf.furn.spines.draw(S.order, S.missing); }
    else for (const e of (this.room.rooms || [this.room]).flatMap(R => R.furns)) e.f.spines?.draw([0, 1, 2, 3, 4], -1);   // 비밀 책장 outside its own stage: the rainbow, done
    this.gadgets = new Set();
    if (this.spec.gray) this.setupGray();
    this.trick = new Trickster(this);
    sweepSetup(this); reelSetup(this);
    // the start view comes first, so who stands where is chosen (and turned) for the view you start with — 몽글이 was put
    // by the last scene's camera and could start behind a slide or a desk for the whole stage (10/19 겹침 QA: 7·12판)
    this.frameCamera(); W.updateCam(); this.room.update?.(1);
    // the friend counting in the corner
    let fa = layout.friendAt || [1.6, 1.6];
    // never stand inside a piece of furniture: take the nearest clear spot to where the layout asked
    // (nor a body's width or less from a wall: 겹침 QA 10/19 — sides(): the stage's standing sides, wallSides in companion.js)
    const sides = this.sides = wallSides(this.room.rooms || [this.room]), fy = (fa[2] || 0) * FLOOR_H;
    if (this.room.clearAt && (!this.room.clearAt(fa[0], fa[1], .48) || !offWall(sides, fa[0], fy, fa[1]))) {
      let best = null;
      for (let dx = -3; dx <= 3; dx += .25) for (let dz = -3; dz <= 3; dz += .25) {
        const x = fa[0] + dx, z = fa[1] + dz, d = dx * dx + dz * dz;
        if ((!best || d < best.d) && Math.abs(x) < this.room.w / 2 - .3 && Math.abs(z - (this.room.center?.z || 0)) < this.room.d / 2 - .3 && this.room.clearAt(x, z, .48) && offWall(sides, x, fy, z)) best = { x, z, d };
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
    // (10/19 겹침 QA: 26·30판 멍뭉이 stood behind the house's wall from the start view and talked from there) a host the
    // start view can't see at all moves to the nearest clear floor it can, 3 m at most
    if (!guard && !custom) {
      const roots = (this.room.rooms || [this.room]).map(R => R.group), p = this.friend.root.position, hh = this.friend.headTop?.() || .5, v = new THREE.Vector3();
      if (!seenAt(W, v.set(p.x, p.y + hh * .45, p.z), roots) && !seenAt(W, v.set(p.x, p.y + hh * .85, p.z), roots)) {
        const t0 = performance.now(), near = walkGrid(this.room.rooms || [this.room], .4).filter(t => !t.stair && Math.abs(t.y - p.y) < .3 && Math.hypot(t.x - p.x, t.z - p.z) < 3)
          .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
        for (const t of near) { if (seenAt(W, v.set(t.x, t.y + hh * .45, t.z), roots)) { p.set(t.x, t.y, t.z); break; } if (performance.now() - t0 > 150) break; }
      }
    }
    this.spawnNpcs();
    // the player's own character walks along (not in other players' rooms)
    if (!this.custom && !this.G.save.settings?.noHero) {
      const h = new Companion(this.G, this.room.rooms || [this.room], () => [this.friend, ...(this.npcs || []).map(n => n.ch)]);
      if (h.tiles.length > 6) this.hero = h; else h.dispose();
      if (this.model && h.buddy) { h.buddy.root.parent?.remove(h.buddy.root); h.buddy = null; }   // (a model kit: nobody extra in front of the pieces)
    }
    // camera
    this.frameCamera();
    if (this.kit) kitSetup(this);   // 이삿짐's boxes, the big parfait
    if (this.villain?.hide) this.hideInky(retry);
    // (10/24 사용자 "흑백판 연출 이상한 부분 많음 … 컬러였다가 흑백이었다가 컬러였다가 … 뒤쪽은 캐릭터 숨고 흑백으로 되고 바로
    // 시작되면 될 듯"): after the first two 흑백판 (4·10판, where 먹물이 hides as the last thing to find and the rule is taught) the
    // room also starts in colour — banner, chapter card, the stage's own opening — and then 먹물이 dashes in, ducks behind
    // something and the colour drains, once; it is no target there, it wanders out a few seconds into play
    // (스토리 룸 10/24: not where 먹물이 is already helping — 69판 "여긴 아직 못 돌려놨어. 같이 찾자": a fresh dash would break its
    // promise from 64판; there the room is grey from the start, as before)
    else if (this.villain && this.spec.gray && !custom && !this.preview && grayBefore(this.idx) >= 2 && grayPhase(this.idx) < 3) this.hideInky(retry, true);
    if (this.hunt) {   // things that can be seen, the key where the start view sees it, the next friend peeking (not on the list)
      this.blindFixed = fixBlindSpots(this); chainToView(this);
      const c = placeCameo(this); if (c) { this.cameo = c; this.items.push(c); }
    }
    if (this.kit && !this.hunt) this.blindFixed = fixBlindSpots(this);   // no piece where nobody can see it, even opened
    // 1장 2~11판: one thing seen from the start, the rest a turn (or a tilt) away (갓겜 기획안 P0 L3)
    // (D4 10/19, user "추천대로": every hidden-object stage after 1장 too — they showed 2~7 of the list at once)
    // (and a friend-finding stage from 2장 with three or more things beside the friend: 16판 friend + 4 showed three of them at
    // the start — 1~30 밸런스 10/20, user "쉽게 느껴짐")
    const many = this.incident && this.idx >= 12 && this.targets.filter(t => !t.friend).length >= 3;
    if (!this.custom && !this.preview && (!this.incident || many) && this.idx >= 1 && (this.idx <= 10 || this.hunt || many)) this.tiers = tierPass(this);
    if (!this.custom && !this.preview && sized(this.idx)) this.smallFixed = fixSmall(this);   // (#94: nothing on the list under 28 px on the start view — smallfix.js)
    this.obs = obsSetup(this);   // R4: the clock / the vases in the room, the note says where to look
    // 몽글 TV (10/19): on about half the campaign stages (tvGameFor: each its own game, the same on a retry) the room's TVs
    // and monitors are on — a little pixel picture, a flicker now and then — and a tap on one plays (not the TV puzzle's TV;
    // a 흑백 target stays dark until it's found; never for the bots, the tutorials, 너굴이's timed stages or a visit)
    this.tvGame = !this.custom && !this.preview && !this.model && !this.spec.timed && !(this.spec.tut <= 2) ? tvGameFor(this.idx) : null;
    // (18판 오락실 10/24, user: "오락실 판에 우리 미니게임들 좀 넣자"): an arcade cabinet with a screen plays too, each its own game —
    // a bonus, on any stage that has one (the timed one too: the clock stops while it's open, as for the TV)
    const recs = (this.room.rooms || [this.room]).flatMap(R => R.furns).filter(e => e.f !== this.plan.tv?.f), tvF = recs.map(e => e.f);
    const arcs = !this.custom && !this.preview && !this.model ? recs.filter(e => e.f.screen?.isMesh && /arcade/.test(e.type)) : [];
    // (the game that goes with the name on the cabinet's marquee — ① otakuloft5 kind 0 몽글 점프 · 1 별똥 슈팅 · 2 너굴 레이서; else in turn)
    const BY_KIND = ['run', 'brk', 'stack'];
    arcs.forEach((e, i) => { const k = e.opts?.kind ?? e.kind; e.f.arcadeGame = k != null && BY_KIND[k % 3] || TV_GAMES[(i + this.idx) % TV_GAMES.length]; });
    if (!this.G.bot && (this.tvGame || arcs.length)) this.tvs = tvScreens(this.tvGame ? tvF : arcs.map(e => e.f), { off: f => { const gt = this.grayTarget(f); return !!(gt && !gt.found); }, cta: true });
    this.tvs?.each((f, p) => sweepAddTv(this, f, p));   // (the pulley's shine on it: a shine means you can press it — 10/20)
    if (this.v2) v2Prep(this);
    W.shadowDirty = true;
    // state
    Object.assign(this, { time: this.spec.time, timeMax: this.spec.time, timerOn: false, running: false, paused: false, combo: 0, bestCombo: 0, lastFind: -99, misses: [], dizzy: 0, keys: 0, codes: new Set(),
      result: null, scraps: {}, t: 0, idle: 0, rotAccum: 0, found: 0, missCount: 0, continued: false, botT: 0, tutStep: 0, lastSec: 99, needKey: false, needCode: false, partsOpened: 0, twinkleT: 0, _autoHint: null, _lastSpark: false, _stSoft: false, _stHard: false, _swN: 0, _swDone: false });
    this.hints = 2; this.hintsUsed = 0;   // 2 magnifiers a stage (3 → 2: #90 10/21, user "힌트 여전히 너무 많고"; with 새 경제 1 + the bag, lens.js)
    if (G.econ) { this.hints = LENS_FREE; this.bagUsed = 0; }   // 경제 B5 (10/19): the bag — none free a stage since 10/22 night, the stock carries over (lens.js)
    this.tail = null; this._dF = this._dE = false;   // (대본 bits that must not carry over from the last stage)
    this.buildHud();
    if (this.kit) kitCover(this);   // 조립판: the box comes first — its comic panel covers the room from the iris on (modelkit.js)
    raidSetup(this);   // 타이머 털기: someone else's room — the 보물, the loot bag, the owner's count
    if (this.plan.first) this.tnum.textContent = '';   // 1판: only 토순이 to find, no bonus count
    W.onTap = (x, y) => this.tap(x, y);
    W.onDoubleTap = () => this.undoLastMiss();
    W.tapInstant = (x, y) => { const hit = this.pickAt(x, y); return hit.kind === 'item' && !hit.item.found && hit.item.role !== 'decoy'; };
    W.tapZoomable = (x, y) => this.tapIdle(x, y);   // (QA3-dbl6: a double tap zooms only where a tap does nothing)
    W.onRotate = d => { this.rotAccum += Math.abs(d); };
    W.onDragStart = null;
    W.onPress = (x, y) => this.pressAt(x, y);   // 손맛 7
    G.audio.mapSong?.(this.spec);   // (this stage's own map song — 맵 곡 나눠 쓰기 10/21)
    G.audio.ambience?.(this.spec.room);   // (its own quiet beds, if it has any — audio.js AMB, 10/21)
    G.audio.music(this.spec.boss ? 'boss' : 'play');   // (방탈출 보스판: the boss music — 사운드 세션 10/19)
    this.bubble = h('div', { class: 'bubble count' }, ''); G.ui.wui.append(this.bubble);
    if (this.plan.light || this.plan.lightItem) this.goDark();
    // the first run builds 1판 behind the start screen: the banner, the talk and the hide wait for the tap
    while (G.booting && !this.dead) await new Promise(r => setTimeout(r, 100));
    if (this.dead) return;
    if (scout && this.raidRun) { const go = await raidScout(this); if (!go || this.dead) return; }   // ② 정찰: the room first, then the raid here
    stagingPrep(this);
    this.hero?.settle?.(G.world);
    const cine = !!(this.spec.intro && this.spec.chapter && !custom && !retry);
    // 13판 이삿짐 (10/21, user: "트럭 먼저 나오고 상자 날아가고 그다음에 집 배경으로 챕터 나오면 될거같은데 순서"): the truck and
    // the pile first, then the chapter card over the room itself (its 3D hello, not the comic panel), then the talk
    const truckFirst = !!(this.kit && kitTruck(this));
    // (10/23 user: "트럭 나옴 → 애들 대화 → 줌아웃 → 타이틀"): the chapter's talk goes with the truck, the card comes last on its own
    this._truckTalk = truckFirst && cine && !G.bot && !G.skipTalk ? REGION_INTRO[this.spec.chapter]?.lines || null : null;
    if (truckFirst) { await kitIntro(this); if (this.dead) return; }
    if (cine) { await playCinematic(G, { ...REGION_INTRO[this.spec.chapter], ...(this._truckTalk ? { lines: [] } : {}), region: REGIONS.find(r => r.id === this.spec.chapter)?.name, hello: this.hero && !this.kitCover ? () => this.cineHello() : null, noFaces: !!this.kitCover }); if (this.dead) return; await this.cineBye(); if (this.dead) return; }   // ('다시 하기' doesn't replay the chapter film — QA 10/18)
    // 숨은그림 판 (10/18): the owner stands by, talks at the start and three times while you look (first · half · one left)
    this.hiddenStage = !custom && !this.preview && !this.incident && !this.spec.gray && !this.spec.timed && !this.spec.boss && !(this.spec.tut <= 2) && isHidden(this.idx);   // (4판 key, 7판 code lessons are hidden-object stages too)
    // the goal in one line (대본: "토순이 찾기") — the story is in the talk, not stacked on the banner
    await G.ui.banner(th.name, custom ? (this.raidRun ? raidGoal(this) : `숨겨 둔 물건 ${this.targets.length}개를 찾아라!`) : this.model ? this.model.goal : this.incident ? goalLine(th.friend) : this.spec.gray ? `숨겨진 물건 ${this.targets.length}개를 찾아 색을 되찾아라!` : this.spec.boss ? `숨겨진 물건 ${this.targets.length}개를 찾아라!` : (this.hiddenStage && hiddenGoal(this.idx, this.targets.length)) || `${ga(CHAR_DEFS[th.friend].name)} 숨긴 물건 ${this.targets.length}개를 찾아라!`, 1250);
    if (this.dead) return;
    if (this.kit && !truckFirst) { await kitIntro(this); if (this.dead) return; }   // 프라모델: the box opens, the pieces scatter (~2.5 s, a tap skips)
    // 판 시작 연출 (스토리 룸 19~34판 staging — staging.js): 3–6 s before the talk, a touch skips it
    await staging(this, 'start'); if (this.dead) return;
    // 말 줄이기 (스토리 v2, 10/18 — user: "판 시작할 때마다 뭔가가 계속 말 거니까 되게 짜증"): a talk card only where it
    // carries something — the two tutorials, a chapter's first stage, a region boss, the first time you meet this friend;
    // otherwise the first line as the speaker's bubble and straight into play
    // (after a chapter's film the stage's own talk is a bubble, even on a first meeting: one card, not two — 검토 2차 3, 13판)
    this.talkKeep = !retry && !this.scene?.bubble && !!(custom || this.preview || this.spec.tut <= 2 || G.save.settings?.oldMode || this.spec.boss || (!cine && (this.spec.intro || this.firstMeet(th.friend))));   // (a retry: the first line only — QA 10/18)
    if (this.story?.intro) { await this.talk(this.story.intro, { title: this.story.title }); if (this.dead) return; }
    if ((this.scene?.type === 'tut2' || (this.scene?.always && !this.incident)) && this.scene.intro) { await (this.scene.bubble ? this.openTalk(this.scene.intro, { title: th.name }) : this.talk(this.scene.intro, { title: th.name })); if (this.dead) return; }   // (스토리 룸 10/19: 2판은 말풍선)   // 2판 · 편의점
    else if (this.hiddenStage && !this.kit?.hid) {
      // 다시 하기 인사 (스토리 룸 10/20): a stage already cleared — its host greets you with one different line (and, while
      // their secret is locked, what three stars would get you) instead of the first-time opening
      const rh = !custom && !this.preview && !this.model && !G.bot && G.save.best?.[this.idx] != null && stageHost(this.idx), rl = rh && replayHi(rh, secretOpen(G.save.best, rh));
      await this.openTalk(rl ? [{ who: rh, text: rl }] : hiddenIntro(this.idx, th.friend), { title: th.name }); if (this.dead) return;
    }   // (a kit's box says its own two lines — modelkit.js kitIntro)
    if (this.spec.gray && !custom) {
      // 대본: the owner, then 먹물이 by where we are in the story (a voice → caught again → quiet → helping)
      // (the first 흑백판 keeps its card: it says the rule; the next ones say it in a bubble — 레벨 v3 개선 1, was the first three)
      const grayN = grayBefore(this.idx);
      if (this._dash) {
        await this.inkyDash(); if (this.dead) return;
        this.tray.classList.add('grayst');
        // (a roaming 먹물이: it stays ducked a while, then walks out from the tile nearest its hiding place)
        const v = this.villain;
        if (v && !v.hide) {
          // (from the nearest tile it can walk on from — one with a free neighbour, as npcLoop asks)
          const g = v.hideT, tiles = this.walkTiles || [], walk = t => tiles.some(q => q !== t && q.R === t.R && Math.abs(q.i - t.i) + Math.abs(q.j - t.j) === 1 && t.R.clearAt((q.x + t.x) / 2, (q.z + t.z) / 2, .32));
          v.t = tiles.filter(walk).sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0] || v.t; v.rest = 5;
        }
      }
      await this.openTalk(grayIntro(this.idx, th.friend, !!this.villain), { title: '색을 잃은 방' }, grayN < 1);
      if (this.dead) return;
      this.giveShades();   // everyone puts the special shades on
    }
    if (this.spec.timed && !this.custom) {
      await this.openTalk(timedIntro(this.idx), { title: '너굴이의 숨바꼭질' });   // 대본: the champion, a new excuse each time
      if (this.dead) return;
      this.timerOn = true;
    }
    if (this.incident) {
      // 대본: this map's scene, else the host's own lines for how many times you've met (a joke from last time comes back)
      const lines = incidentIntro(this.idx, th.friend);
      if (lines.length && !retry) { await this.openTalk(lines, { title: th.name }); if (this.dead) return; }   // (a retry goes straight to the hide — QA 10/18)
      await this.friendHides(); if (this.dead) return;
    } else if (!custom && !this.preview && this.spec.incident && !this.scene?.always && !G.save.settings?.oldMode) {
      // a 사건 판 that fell back to finding things (no big furniture to hide in): the host says so, not a hiding line
      await this.talk(fallbackIntro(th.friend), { title: th.name }); if (this.dead) return;
    }
    raidStart(this);   // (타이머 털기: the owner starts counting)
    if (this.spec.room === 'frogpond' && !custom) reelSetup(this);   // (29판: the bucket's catch, set last — the start's spreading moved it out; the bucket is under water, winding it up is how you see it)
    this.running = true; this.tStart = this.t;
    this.hero?.settle?.(G.world);   // (the friend you brought, off any piece put down since it took its spot)
    // 7·11판: 먹물이 was here too — its footprints, laid on the view you actually play from (after the intro's camera)
    if (sceneAt(this.idx)?.trace && !custom && !this.preview && !this.villain) (async () => {
      for (let i = 0; i < 25 && (G.world.flying || this.cine) && !this.dead; i++) await this.tw.wait(.1);
      if (!this.dead) await this.inkyTrace();
    })();
    // (튜토리얼 B — tutb.js, ③ 10/22: ?tut=b or 더보기: in 2판 a line and a hand only if needed, instead of the lessons)
    // (user 10/22: "1은 원래 것이 나은 것 같음" — B changes 2판 only)
    // (1~3판 한 번에 하나만 — toasts too)
    G.ui.hush = () => !this.dead && this.hushed();
    if (TUT_B && this.spec.tut === 2) tutB2(this);
    else {
    if (this.spec.tut === 1) this.tutorial1();   // no clock: the stage waits for you
    // (1판: 토순이 says what she dropped — ② 10/26)
    if (this.spec.tut === 1 && this.plan?.first && this.targets.some(t => !t.friend)) firstFindsTalk(this);
    if (this.spec.tut === 2) { this.tutorial2(); if (TILT_ON || !DBL_ON) this.teachTilt(); }
    }
    if (this.scene?.card) newCard(G, this.scene.card);
    else if (this.obs) newCard(G, 'obs');   // 61판: the observation locks' card, once (스토리 v96 CARDS.obs)   // e.g. 비밀 서재: 🆕 연쇄 장치
    if (this.scene?.teachMove && !G.save.tut?.move) this.teachMove();
    if (this.plan.showcase?.shelf && !custom && !this.preview) this.teachShelf();   // 비밀 서재: what to do, once (사용자 실폰 10/20)
    if (!TUT_B) armFtap(this); else armFtapB(this);   // 6판부터 한 번: 끌다가 다른 손가락 톡 = 회전 (10/19)
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
    this.clearTapTimers();
    const G = this.G;
    if (this.raidRun && !this.result) { const c = settleOpen(G); if (c) setTimeout(() => G.ui.toast(`털다 나온 집 정산 · 코인 +${c}`, 'green'), 700); }   // (QA9 P2: leaving a raid half way kept nothing)
    G.tv?.close(); this.tvs?.dispose(); this.tvs = null;   // 몽글 TV
    G.world.onPan = null; G.world.onDoubleTap = null; this.tutEls?.forEach(e => e.remove()); this.trick?.dispose();
    if (G.world.post) { G.world.post.u.gray.value = 0; G.world.post.u.grayR.value = -1; G.world.post.bloomOn = false; }
    document.getElementById('app').style.removeProperty('--joyB');
    G.world.root.remove(this.room.group); G.world.root.remove(this.friend.root); this.look?.dispose(); setSky(null);
    for (const n of this.npcs || []) { n.on = false; G.world.root.remove(n.ch.root); }
    for (const m of this.prints || []) { G.world.root.remove(m); m.material.dispose(); m.geometry.dispose(); }
    this.ambient?.dispose(); if (this.hero) { disposeTree(this.hero.ch.root); if (this.hero.buddy) disposeTree(this.hero.buddy.root); this.hero.dispose(); }
    // this stage's own meshes, materials and textures (not the shared caches) go with it
    if (this.cameo) { G.world.root.remove(this.cameo.ch.root); disposeTree(this.cameo.ch.root); }
    for (const r of [this.room.group, this.friend.root, ...(this.npcs || []).map(n => n.ch.root)]) disposeTree(r);
    // (the planner's wall list lets go of this room's walls — they held its wall canvases into the next scene, QA 10/20)
    fitPrep(null);
    clearTimeout(this._moveT);
    G.world.onTap = null; G.world.onRotate = null; G.world.tapInstant = null; G.world.onPress = null; G.world.tapZoomable = null;
    G.ui.hush = null;
    G.world.camLock = false;   // (the model-kit assembly holds the camera; leaving mid-way must not keep it held)
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
      this.tnum = h('div', { class: 'num ol' }, this.spec.timed ? String(this.spec.time) : this.incident ? (this.targets.length > 1 ? `0/${this.targets.length - 1}` : '') : `0/${this.targets.length}`));
    top.append(this.timerEl);
    top.append(h('div', { class: 'stagetag ol', html: this.custom ? `${isRaid(this) ? '털기' : '놀러옴'}<b>${this.targets.length}개</b>` : this.model ? `프라모델<b>조립</b>` : this.preview ? `새 아트<b>미리</b>` : `스테이지<b>${this.idx + 1}</b>` }));
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
    // tray (a model kit: its runner card instead — modelkit.js kitRunner gives every piece its numbered cell)
    this.tray = this.kit ? kitRunner(this) : h('div', { class: 'tray' });
    this.slots = new Map();
    if (!this.kit) this.targets.forEach(it => {
      const mine = this.custom?.stolen?.includes(it.type);   // my own thing, taken from my home: get it back
      const s = h('div', { class: 'slot' + (this.spec.silhouette ? ' sil' : '') + (mine ? ' mine' : '') + (it.friend ? ' friendslot' : it.inky ? ' inkyslot' : this.incident ? ' bonus' : '') }, h('img', { src: it.thumb || G.thumbs['item_' + it.type] }), h('div', { class: 'chk', html: ICON.check }), ...(mine ? [h('div', { class: 'minetag' }, '내 거')] : []));
      this.tray.append(s); it.slot = s;
      s.addEventListener('pointerup', e => { e.stopPropagation(); this.peek(it, s); });   // (a tap shows it big — 2D UI 정리 ⑳)
    });
    col.append(this.tray);
    // many things to find: two rows of bigger pictures instead of one row of tiny ones (11 in a row were ~18 px)
    if (this.spec.gray && !this._dash) this.tray.classList.add('grayst');   // (with 먹물이's dash: once the colour has drained)   // the list is drained of colour too: shapes only
    const two = !this.kit && this.targets.length > 7, joyB = this.kit ? Math.max(118, Math.round(this.tray.getBoundingClientRect().height) + 36) : two ? 146 : 100;   // (a kit's card: just above it, however tall its skin is)
    // the buttons sit just above the (slimmer) tray (user, 10/17-18: "유아이가 너무 크고")
    document.getElementById('app').style.setProperty('--joyB', joyB + 'px');
    if (two) { this.tray.classList.add('two'); this.tray.style.setProperty('--cols', Math.ceil(this.targets.length / 2)); }
    const bottomY = `calc(${joyB}px + var(--safeB))`;   // clear of the tray
    this.mong = h('div', { class: 'mong' }, this.mongImg = h('img', { src: G.thumbs.face_mong }));
    // (not on screen any more — user 10/19 on a phone: "기능이 없어 보여서 삭제해도 되지 않을까". A find, a miss and 어질어질 each already
    // show elsewhere: the tap count and its -1, the friend's taunt, the toast and the sound. setMong still runs on it, harmlessly.)
    const side = h('div', { class: 'side', style: `bottom:${bottomY}` });
    // two rows: the buttons go up by the tray's real height (146 left the hint button 14 px over it — QA 10/19, 2D UI 정리 ⑤)
    if (two) requestAnimationFrame(() => {
      if (this.dead) return;
      const z = parseFloat(getComputedStyle(document.getElementById('hud')).zoom) || 1, need = Math.ceil(this.tray.getBoundingClientRect().height / z + 18);
      if (need > joyB) { document.getElementById('app').style.setProperty('--joyB', need + 'px'); side.style.bottom = `calc(${need}px + var(--safeB))`; }
    });
    this.hintBtn = ui.ibtn('hint', 'blue', () => this.useHint(), this.hints);
    this.hintBtn.style.width = this.hintBtn.style.height = '52px';
    if (G.econ) lensBadge(this);   // (경제 B5: free + bag)
    // zoomed in, one finger moves you around: these turn the room (or go back to the whole view) one-handed
    // back to the starting view (angle, tilt, zoom and position) whenever the view has wandered off
    const all = ui.btn('처음 시점', { color: 'gray', cls: 'sm', onClick: () => { const v = this.view0 || { yaw: Math.PI / 4, pitch: .62 }; G.world.flyTo(this.tw, { zoom: v.zoom || 1, target: G.world.home, yaw: v.yaw, pitch: v.pitch, dur: .45 }); } });
    this.zoomTools = h('div', { class: 'zoomtools' }, all);   // (보일 때만 update가 켬 — 판 시작 전 깜빡임 없게)
    side.prepend(this.zoomTools);
    side.append(this.hintBtn); col.append(side);
    tapsSetup(this);   // the hand: taps that may find nothing
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
      if (u.peek) return { kind: 'peek', node: p };   // v2: the friend's tell poking out
      if (u.item) return { kind: 'item', item: u.item, node: p };
      if (u.part) return { kind: 'part', part: u.part, node: p };
      if (u.char) return { kind: 'char', char: u.char, node: p };
      if (u.furn) return u.furn.parts[0]?.isLever ? { kind: 'part', part: u.furn.parts[0], node: p } : { kind: 'furn', furn: u.furn, node: p };
      if (u.wall) return { kind: 'wall' };
      if (u.floor) return { kind: 'floor' };
    }
    return { kind: 'none' };
  }
  pickRoots() { return [this.room.group, this.friend.root, ...(this.npcs || []).map(n => n.ch.root), ...(this.trick?.ch ? [this.trick.ch.root] : []), ...(this.cameo ? [this.cameo.ch.root] : [])]; }
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
    const ic = this.inkyIt && !this.inkyIt.found ? this.villain?.ch : null;   // 먹물이 hiding: a near miss finds it too
    if (ic?.root) { const b = new THREE.Box3().setFromObject(ic.root); if (!b.isEmpty()) consider(ic.root, b.getCenter(c), Math.max(...b.getSize(new THREE.Vector3()).toArray()) / 2 * pxPer, { kind: 'char', char: ic, node: ic.root }); }
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
    // plain furniture doesn't answer a tap any more (10/19), so it doesn't dip either — a 흑백 target still does
    if (hit.kind === 'furn') { const gt = this.grayTarget(hit.furn); if (gt && !gt.found) return { obj: hit.node, m: .035 };
      const np = this.partNear(hit.furn, x, y);
      if (this.tvAt(hit.furn) && (!np || this.tvs.screenAt(this.G.world, hit.furn, x, y))) return { obj: hit.node, m: .03 };   // 몽글 TV
      return np ? { obj: np.pivots[0], m: .06 } : null; }   // (QA3-fb5: the drawer a body tap will work dips)
    return { obj: hit.node, m: hit.kind === 'char' ? .07 : .06 };
  }
  pickExact(x, y) {
    // (⑤ QA 10/25: a thing already found that stays where it lay no longer stands in front of what is under it — on 64판 the
    // found abacus on the grey office chair took every tap on the chair, the chair never got its colour and the stage could not end)
    const hits = this.G.world.pick(x, y, this.pickRoots()).filter(hh => { const c = this.classify(hh.object); return !(c.kind === 'item' && c.item?.found); });
    if (!hits.length) return { kind: 'none' };
    const d0 = hits[0].distance;
    const ih = hits.find(hh => hh.distance - d0 < .3 && this.classify(hh.object).kind === 'item');
    const first = this.classify((ih || hits[0]).object);
    if (first.kind === 'char' && !first.char?._cameo && !first.char?._inky) {
      const behind = hits.map(hh => this.classify(hh.object)).find(c => c.kind === 'item' || c.kind === 'part');
      if (behind) return behind;
    }
    return first;
  }
  tap(x, y) {
    if (!this.running || this.paused || this.result || this.cine) return;
    const G = this.G;
    if (G.world.flying) return;   // (the camera gliding by itself — a key's tour, a lever, a hint: a tap would land on a moving view — QA N1)
    if (this.dizzy > 0) { G.audio.sfx('wobble'); return; }
    const hit = this.pickAt(x, y);
    this.lastTapAt = { x, y }; this._lastMiss = null;   // (a double tap gives back only the tap right before it — QA 10/18)
    if (hit.kind === 'peek') return v2PeekTap(this);
    { const hp = this.handlePartAt(x, y, hit); if (hp && !(hit.kind === 'item' && !hit.item.hang)) return this.onPart(hp, x, y); }   // (the crank, generously)
    if (hit.kind === 'item') {
      const it = hit.item;
      if (it.found) return;
      if (it.hang) return this.tapHung(it);   // (out of reach: no find, no 톡 spent)
      // the hidden friend is only ever found by its door opening (revealFriend): a tap on it while the door is still swinging
      // used to go to onFound and the stage could never end (level report 10/18 B1, stage 20)
      if (it.friend) { const pt = it.spot?.part; if (pt?.noPill && pt.lock) return this.useGadget(pt); if (!pt || (!pt.busy && pt.t > .5)) this.revealFriend(it); return; }
      if (it.cameo) return cameoFound(this, it);
      if (it.obs) return obsLook(this, it);   // R4: a big look at the clock / the vases
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
    if (hit.kind === 'part' && hit.part.handle) return this.nudgeHandle(hit.part);   // (not its handle: point at the handle)
    if (hit.kind === 'part') return this.onPart(hit.part, x, y);
    if (hit.kind === 'char' && hit.char?._cameo) return cameoFound(this, hit.char._cameo);
    if (hit.kind === 'char' && this.trick?.ch && hit.char === this.trick.ch) return this.trick.caught();
    if (hit.kind === 'char' && this.inkyIt && hit.char === this.villain?.ch) { if (!this.inkyIt.found) this.onFoundInky(this.inkyIt); return; }
    if (hit.kind === 'char') return this.tapChar(hit.char);
    if (hit.kind === 'furn' && hit.furn.type === 'puzzleframe') return this.openPuzzle(hit.furn);
    if (hit.kind === 'furn' && this.plan.tv && hit.furn === this.plan.tv.f) return this.useTv();
    // 몽글 TV (10/19): a tap on the screen plays; on the body only when no drawer or door is right by the finger
    const tvf = hit.kind === 'furn' && this.tvAt(hit.furn) ? hit.furn : null;
    if (tvf && this.tvs.screenAt(G.world, tvf, x, y)) return this.openTv(tvf);
    if (hit.kind === 'furn' && stagingTap(this, hit.furn)) return;   // (31판 극장 간판: a touch puts one letter out)
    // R7 (level report): a locked piece of furniture answers a tap on its body — its nearest locked door or drawer reacts
    if (hit.kind === 'furn') { const lp = this.lockedPartNear(hit.furn, x, y); if (lp) return this.onPart(lp, x, y); }
    if (hit.kind === 'furn') { const lv = hit.furn.parts?.find(p => p.isLever); if (lv) return this.onPart(lv, x, y); }   // (톡: the lever's post or box pulls it too)
    if (hit.kind === 'furn' && ft?.found && !tvf) return;   // 흑백판: a piece already coloured back is not a wrong tap (QA 10/18: each re-tap cost a 톡)
    // (10/19, user: "가구는 눌러도 반응 없지만 물건들 누르면 -1로") — the body of a plain piece of furniture: nothing at all
    // (it used to wobble and spend a 톡; a finger meant for a drawer often landed on the body)
    // (QA3-fb5 10/19, user: "스테이지2에서 책상 서랍이 잘 안닫힘") — a drawer or door often shows only a sliver past its own
    // furniture (2판's desk drawer: ~16 px of front, open or shut); a tap on the body right by one works that one
    if (hit.kind === 'furn') { const hp = hit.furn.parts?.find(p => p.handle); if (hp) return this.nudgeHandle(hp); }
    if (hit.kind === 'furn') { const np = this.partNear(hit.furn, x, y); if (np) return this.onPart(np, x, y); if (tvf) return this.openTv(tvf); return; }
    if (this.kitPileTap?.(x, y)) return;   // 13판's pile of boxes: free, like a piece of furniture's body (레벨 세션 10/20)
    this.addMiss(x, y, true);
  }
  // R7 (level report): every target left is behind something from this side. Try turning ±45°, ±90° and 180° (camera
  // only, put back at once) and point to the nearest turn that shows one — an arrow at that edge of the screen, on the
  // side the thumb would slide the dial (the room's front moves the way the thumb goes)
  turnHint() {
    const W = this.G.world, y0 = W.yaw, roots = [this.room.group];
    const hid = this.targets.filter(t => !t.found && !(t.spot.part && t.spot.part.t < .5));
    let best = null;
    for (const d of [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      W.yaw = y0 + d; W.updateCam();
      if (hid.some(t => !W.occluded(t.g, this.worldCenter(t), roots))) { best = d; break; }
    }
    W.yaw = y0; W.updateCam();
    if (best == null) return;
    const right = best < 0;   // the dial: a slide to the right lowers the yaw
    this.turnHintEl?.remove();
    const el = this.turnHintEl = h('div', { class: 'turnhint ' + (right ? 'r' : 'l') }, right ? '이쪽으로 돌려 봐 ▶' : '◀ 이쪽으로 돌려 봐');
    this.G.ui.wui.append(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
  }
  // a double tap zooms (world.js): its first tap, already counted as a miss, is given back — zooming isn't a wrong tap
  undoLastMiss() {
    if (this._missT) { this._missT = null; return; }   // still waiting: it never happened
    const m = this._lastMiss; this._lastMiss = null;
    if (!m || this.dead || this.result || performance.now() - m.at > 450) return;
    if (m.penalty) this.missCount = Math.max(0, this.missCount - 1);
    // 너굴이's clock: the zoom's first tap took 2 s and counted towards the dizzy spell — both given back (QA 10/18)
    if (m.penalty && m.timed) { this.time = Math.min(this.timeMax, this.time + 2); this.misses.pop(); }
    if (m.spent && this.tapsLeft != null) {
      this.tapsLeft = Math.min(this.tapBudget, this.tapsLeft + 1);
      if (this.tapsLeft > 0) this._tapLoseAt = null;
      const p = this.tapPill; if (p) { p.querySelector('.v').textContent = this.tapsLeft; p.classList.toggle('need', this.tapsLeft <= 3); }
    }
  }
  wobble(g) {
    const s0 = g.scale.clone();
    this.tw.run(.28, k => { const w = Math.sin(k * Math.PI * 3) * (1 - k) * .05; g.scale.set(s0.x * (1 + w), s0.y * (1 - w), s0.z * (1 + w)); }, ease.linear).then(() => g.scale.copy(s0));
  }
  addMiss(x, y, penalty) {
    const G = this.G;
    if (this.dead || this.result || !this.running || this.paused) return;
    if (this.targets.every(t => t.found)) return;   // everything is found and the win is on its way (QA 10/18)
    // (10/19, user: "더블클릭할 때 -1 뜰 때도 있음") — the counting waits 0.33 s, the double-tap window: a second tap that
    // zooms cancels it (undoLastMiss) before the '-1' shows. Only the small puff under the finger is at once.
    if (penalty) G.world.fx.burst(x, y, { n: 6, colors: ['#ffffff', '#d9c9e8'], shape: 'circle', speed: 120, size: 10, gravity: 0, life: .4 });
    // the light tick goes now, inside the touch: iPhone plays a haptic only there (the count's own buzz 0.33 s later stayed
    // silent — QA3 10/19); the counted miss's sound then comes without a second buzz (countMiss)
    if (penalty) haptic('tick');
    if (this._missT) { const m = this._missT; this._missT = null; this.countMiss(m.x, m.y, m.penalty); }   // a separate earlier miss counts now
    this._missT = { x, y, penalty, at: (this._tapClock || 0) + .33 };
  }
  clearTapTimers() { this._missT = this._lastMiss = this._tapLoseAt = null; }
  updateTapTimers(dt) {
    if (this.dead || this.paused || this.result || !this.running) return;
    // Both grace periods use the stage clock. A menu (including settings) freezes them; returning never catches up
    // wall time. Process the due instants in order so a long frame doesn't spend the same delta twice.
    const end = (this._tapClock || 0) + dt;
    for (;;) {
      const next = Math.min(this._missT?.at ?? Infinity, this._tapLoseAt ?? Infinity);
      if (next > end + 1e-9) break;
      this._tapClock = next;
      if (this._missT && this._missT.at <= next) {
        const m = this._missT; this._missT = null; this.countMiss(m.x, m.y, m.penalty);
      }
      if (this._tapLoseAt != null && this._tapLoseAt <= next) {
        this._tapLoseAt = null;
        if (this.tapsLeft <= 0 && !this.targets.every(t => t.found)) this.lose('taps');
      }
      if (this.dead || this.result || !this.running) break;
    }
    this._tapClock = end;
  }
  countMiss(x, y, penalty) {
    const G = this.G;
    if (this.dead || this.result || this.targets.every(t => t.found)) return;
    this._lastMiss = { at: performance.now(), penalty, spent: this.tapsLeft != null, timed: !!(penalty && this.timerOn) };
    spendTap(this, x, y);   // 톡: the floor, a decoy
    if (penalty && this.timerOn) { this.misses.push(this.t); this.misses = this.misses.filter(t => this.t - t < 3); }
    if (penalty) {
      this.missCount++;
      // (QA 10/20: on the first stage with taps the second miss also says "서랍·문은 공짜!" — the lesson waits until that has gone)
      if (!TUT_B && this.idx === DBL_AT && this.missCount === 2) { const go = () => { if (this.dead || this.result) return; if (DBL_ON) teachDbl(this); else G.ui.toast(DO.zoom, 'green'); }; if (this._tapTeach === 3) setTimeout(go, 2300); else go(); }   // 3판: small things far off → zoom, once it's needed
      this.taunt('miss');
      if (this.timerOn) { this.time = Math.max(0, this.time - 2); G.ui.floatText(x, y, '-2초', 'red'); }
      G.audio.sfx('miss', 0, false);   // (its tick went with the tap — addMiss)
      this.setMong('sweat', 'shake');
    }
    if (this.misses.length >= 4) this.makeDizzy();
  }
  makeDizzy() {
    const G = this.G;
    this.dizzy = 1.6; this.misses = [];
    G.audio.sfx('dizzy'); G.ui.toast('어질어질~ 천천히 찾아봐!', 'red');
    this.mongImg.src = G.thumbs.face_mong_dizzy; this.mong.classList.remove('hop', 'shake'); this.mong.classList.add('spin');
    const r = (this.tapPill || this.inv).getBoundingClientRect();   // (the stars come off the tap count now that the face is gone)
    if (r.width) G.world.fx.burst(r.left + r.width / 2, r.top, { n: 10, shape: 'star', speed: 160, gravity: 0, life: .9 });
  }

  worldCenter(it) { const b = new THREE.Box3().setFromObject(it.g); return b.getCenter(new THREE.Vector3()); }
  // 갓겜 기획안 P0 (손맛, 10/18): the two helps below are for 숨은그림 and 흑백 stages only
  get feelHelp() { return !this.model && (this.hiddenStage || this.spec.tut === 2 || (!!this.spec.gray && !this.incident && !this.spec.timed && !this.spec.boss && !this.custom && !this.preview)); }
  // F1 시선 힌트: one thing left for 20 s — the owner slowly turns (0.4 s) to look at it; no words, no sparkle, no arrow
  // (user: "F1은 화살표 빼고 친구 시선만"). The sparkle is the second help, 10 s after the look.
  // ── 7판 도르래 (user 10/20: "열쇠가 도르래 맨 위에 딱 보이게 걸려 있고, 그냥 터치하면 안 눌림. 반짝임이 아래 도르래 손잡이로 이어짐.
  // 도르래를 누르면 바구니가 올라가면서 맨 위 열쇠가 바구니에 탁 떨어짐. 그때 터치 가능"): seen but out of reach — a tap swings it on its
  // hook and a trail of sparkles runs down to the crank, which shines; no 톡 is spent
  // a hung thing swings round its hook (the point .276 over its spot — gfx/house-props.js liftbasket hook), not round its foot
  swingHung(it, a) {
    const g = it.g; if (!g?.parent) return;
    let h0 = it._hang0;
    if (!h0) {
      const P = g.parent, Z = new THREE.Vector3(0, 0, 1), at = P.worldToLocal(it.spot.anchor.localToWorld(new THREE.Vector3(0, .276, 0)));
      // a key hangs by its ring: turned so the ring end (items.js key: ring at -x, bit at +x) points straight up, the ring
      // sitting on the hook's bottom (design 10/20: it lay sideways by the post)
      if (it.type === 'key') {
        const loc = v => { g.updateMatrixWorld(true); return P.worldToLocal(g.localToWorld(v.clone())); }, RING = new THREE.Vector3(-.1, .02, 0), BIT = new THREE.Vector3(.1, .02, 0);
        const r = loc(RING), b = loc(BIT);
        g.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(Z, Math.PI / 2 - Math.atan2(r.y - b.y, r.x - b.x)));
        const r2 = loc(RING); g.position.x += at.x - r2.x; g.position.y += at.y - .05 * g.scale.x - r2.y;
      }
      h0 = it._hang0 = { p: g.position.clone(), q: g.quaternion.clone(), at, Z };
    }
    const c = Math.cos(a), s = Math.sin(a), dx = h0.p.x - h0.at.x, dy = h0.p.y - h0.at.y;
    g.position.set(h0.at.x + dx * c - dy * s, h0.at.y + dx * s + dy * c, h0.p.z);
    g.quaternion.copy(h0.q).premultiply(new THREE.Quaternion().setFromAxisAngle(h0.Z, a));
  }
  tapHung(it) {
    const G = this.G, W = G.world, part = it.hang;
    G.audio.sfx('clink');
    it._swing = true;
    this.tw.run(.7, k => { if (!this.dead && it.hang) this.swingHung(it, Math.sin(k * Math.PI * 4) * (1 - k) * .4); }, ease.linear).then(() => { it._swing = false; });
    if (!part || part.busy || part.t > .5) return;
    const a = W.toScreen(this.worldCenter(it)), b = W.toScreen(this.partCenter(part));
    for (let k = 1; k <= 6; k++) setTimeout(() => { if (this.dead) return; const t = k / 6; W.fx.burst(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, { n: 3, shape: 'star', speed: 30, gravity: -20, life: .5, size: 8, colors: ['#ffffff', '#fff3a0'] }); }, k * 70);
    setTimeout(() => !this.dead && shinePart(this, part), 450);
  }
  // the basket has come up under the hook: the thing drops into it with a bump — now it can be taken
  dropHung(it, part) {
    const G = this.G, W = G.world, spot = part.spots.find(s => s.kind === 'inside' && (!s.item || s.item === it));
    it.hang = null;
    if (!spot) return;
    it.g.visible = true;
    const from = it.g.getWorldPosition(new THREE.Vector3()), qW = it.g.getWorldQuaternion(new THREE.Quaternion());
    if (it.role === 'key' && (part.label === '이불' || part.label === '방화복')) G.audio.sfx('clink');   // (20판 이불·19판 방화복: the key drops — 차릉, user 10/21)
    moveItem(it, spot);
    // (20판 villaroof3 ① 10/24, 사용자 "떨어진 열쇠가 작음": a place may ask for what lands on it to be at least this long — spot.minLong)
    if (spot.minLong) { const L = drawnLong(it.g); if (L > .01 && L < spot.minLong) { it.g.scale.multiplyScalar(spot.minLong / L); it.g.updateMatrixWorld(true); } }
    // it falls the way it hung and turns once on the way down into how it lies in the basket, then bounces once (design 10/20)
    const g = it.g, to = g.position.clone(), f = g.parent.worldToLocal(from.clone()), qTo = g.quaternion.clone();
    const qFrom = g.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(qW), spin = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    g.position.copy(f); g.quaternion.copy(qFrom); g.visible = true;
    this.tw.run(.42, k => { if (this.dead) return; g.position.lerpVectors(f, to, k * k); spin.setFromAxisAngle(up, Math.PI * 2 * k); g.quaternion.slerpQuaternions(qFrom, qTo, k).premultiply(spin); }, ease.linear).then(() => {
      if (this.dead) return; g.position.copy(to); g.quaternion.copy(qTo); G.audio.sfx('land');
      const p = W.toScreen(this.worldCenter(it)); W.fx.burst(p.x, p.y, { n: 8, shape: 'star', speed: 90, gravity: -40, life: .6, size: 8 });
      this.wobble(part.pivots[0]);
      return this.tw.run(.24, k => { if (!this.dead) g.position.y = to.y + Math.sin(k * Math.PI) * .06; }, ease.linear).then(() => { if (!this.dead) { g.position.copy(to); this.lookHung(it); } });
    });
  }
  // ...and if it landed small or at the edge (7판's start view: 28 px behind the upstairs railing — 디자인 세션 10/20), the view
  // glides in a little to the basket and stays there: the payoff of the pulley is seeing the key drop in
  lookHung(it) {
    const W = this.G.world;
    if (this.dead || this.result || this.botOn() || W.flying) return;
    // (the meshes only: the tap sphere round every thing is 0.4 m and would read as big)
    const b = new THREE.Box3(); it.g.updateMatrixWorld(true);
    it.g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    if (b.isEmpty()) return;
    const c = b.getCenter(new THREE.Vector3()), s = W.toScreen(c), lo = W.toScreen(b.min), hi = W.toScreen(b.max);
    const px = Math.max(Math.abs(hi.x - lo.x), Math.abs(hi.y - lo.y));
    const edge = s.x < 60 || s.x > W.W - 60 || s.y < 130 || s.y > W.H - 200;
    if (px >= 40 && !edge) return;
    // (a little from above too: from the start angle the upstairs railing stands in front of the basket)
    W.flyTo(this.tw, { target: new THREE.Vector3(c.x, c.y - .15, c.z), zoom: Math.min(2.6, Math.max(W.zoom * 1.4, 2.3)), pitch: Math.min(W.maxPitch ?? .95, Math.max(W.pitch, .88)), dur: .6 });
  }
  // ── 막혔을 때 힌트, 1~5판 (user 10/20: "1~5판에서 못 찾으면 힌트 두 가지 — 말풍선으로 대놓고, 캐릭터가 간접적으로. 힌트 너무 많은 건
  // 싫음"; the lines are the story room's, script.js STUCK): soft — the host glances at a thing and lets something slip; hard —
  // the host names the furniture it is in or by. Only while two or more are left (the last one keeps K's look and sparkle)
  stuckHint(kind, left) {
    const W = this.G.world, host = stageHost(this.idx), L = host && stuckLine(host, kind), f = this.friend;
    if (!L || !f?.root) return;
    const near = it => { const s = W.toScreen(this.worldCenter(it)); return Math.hypot(s.x - W.W / 2, s.y - W.H * .47); };
    const t = left.filter(x => !x.spot?.part?.lock).sort((a, b) => near(a) - near(b))[0] || left[0];
    if (!t) return;
    let line = tr(L);
    if (kind === 'hard') {
      const ft = t.spot?.furn?.type || t.spot?.part?.furn?.type; if (!ft) return;
      let name = tr(FURN_NAME(ft)); if (/^[A-Z][a-z]/.test(name)) name = name[0].toLowerCase() + name.slice(1);   // ("near the sofa")
      line = line.replace('{f}', name);
    }
    this.gazeHint(t);
    this.say(f, line, 2600);
  }
  // 처음 판의 부드러운 도움: 화면 가운데에서 가까운 것 하나 — 친구의 눈길, 옅은 빛 세 번, 돋보기 반짝 (위치를 딱 집지 않고 '저쪽'만)
  softGlow(left) {
    const W = this.G.world, near = it => { const s = W.toScreen(this.worldCenter(it)); return Math.hypot(s.x - W.W / 2, s.y - W.H * .47); };
    const t = left.slice().sort((a, b) => near(a) - near(b))[0]; if (!t) return;
    this.gazeHint(t);
    for (let i = 0; i < 3; i++) setTimeout(() => { if (this.dead || t.found) return; const s = W.toScreen(this.worldCenter(t)); W.fx.ring(s.x, s.y, { r: 70, color: '#fff1b8', width: 5, life: 1.0 }); }, 300 + i * 650);
    const b = this.hintBtn; if (b) { b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 600); const r = b.getBoundingClientRect(); W.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 8, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 90, gravity: -20, life: .6 }); }
  }
  gazeHint(t) {
    const f = this.friend; if (!f?.root) return;
    const c = this.worldCenter(t), p = f.root.getWorldPosition(new THREE.Vector3()), r0 = f.root.rotation.y;
    let d = Math.atan2(c.x - p.x, c.z - p.z) - r0; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.tw.run(.4, k => { if (!this.dead) f.root.rotation.y = r0 + d * k; }, ease.inOutQuad);
  }
  // F2 마지막 하나: the last thing found — 0.3 s hitstop, the screen's edges glow, the owner jumps with a 'wow', a bigger chime
  // and buzz. The camera stays exactly where it is (the user dislikes a camera that moves without the finger).
  lastOneFx() {
    const G = this.G;
    G.hitstop(.3);
    const glow = h('div', { class: 'lastglow' }); G.ui.wui.append(glow); setTimeout(() => glow.remove(), 1100);
    const f = this.friend; if (f?.root) { f.setFace('wow'); f.bump?.(.6); }
    G.audio.sfx('special');
    setTimeout(() => haptic('big'), 90);
  }
  // ── a talk, filmed: the camera comes in close on whoever is speaking (letterbox bars), then back to where you were
  // (user, 10/17: "챗 될때는 카메라 클로즈업해서 시네마틱처럼")
  charFor(who) {
    const all = [this.friend, this.hero?.ch, ...(this.npcs || []).map(n => n.ch)].filter(Boolean);
    return all.find(c => c.kind === who) || (who === 'mong' ? this.hero?.ch : null) || null;
  }
  // talk over the room as it is: no cinematic camera (user, 10/18: "시네마틱 카메라 폐기할께. 너무 느려진다") — the speaker
  // just turns to face you while the dialog box runs
  // 엉뚱한 자리 한 쌍 (스토리 룸 10/21, 사용자 "ㅇㅋ"): after the win (and the host's 깜짝 한 방), before the result — 몽글이 asks
  // about the oddest place a thing was found this stage (a cold thing out of the fridge > a thing to eat away from the kitchen >
  // the rest), the host answers with their own habit (script.js quipLine). Two bubbles, the camera on whoever speaks, a tap
  // goes on. Nothing odd: nothing said. Not for a bot, a visit, a preview, a model
  async quipPair() {
    const G = this.G;
    if (this.custom || this.preview || this.model || G.bot || G.skipTalk || this.spec.gray || !SCRIPT_ALL.quipAt?.(this.idx)) return;   // (which stages: the script's — 5·7·9·11·12·13·15)
    let best = null, top = 0;
    for (const t of this.targets) { if (t.inky || t.friend || t.kitPart || !t.found) continue; const o = oddness(t.type, t.spot); if (o > top) { top = o; best = t; } }
    if (!best) return;
    const lines = SCRIPT_ALL.quipLine(this.idx, ITEMS[best.type]?.name, best.spot?.label, isCold(best.type)); if (!lines) return;
    G.ui.wui?.querySelectorAll('.bubble').forEach(b => b.remove());   // (the pop's bubble, if it is still up: one thing said at a time)
    for (const L of lines) {
      const ch = this.charFor(L.who); if (!ch) continue;
      closeUp(this, ch, { portrait: true }); ch.faceTo?.(G.world.cam.position.x, G.world.cam.position.z);
      const ms = Math.max(1700, Math.min(3600, 900 + String(L.text).length * 55)), b = this.say(ch, L.text, ms);
      await new Promise(res => { const done = () => { clearTimeout(t); removeEventListener('pointerdown', done, true); res(); }, t = setTimeout(done, ms); addEventListener('pointerdown', done, true); });
      b?.kill?.(); if (this.dead) return;
    }
  }
  async talk(lines, opts = {}) {
    const G = this.G, W = G.world, app = document.getElementById('app');
    this.talking = true; app.classList.add('cine');   // (the HUD steps aside for the dialog box, as before)
    const onLine = L => {
      opts.onLine?.(L);
      const ch = this.charFor(L.who); if (ch) ch.faceTo?.(W.cam.position.x, W.cam.position.z);
      if (opts.cam && ch) closeUp(this, ch, { portrait: true });   // (10/19) an end-of-stage talk: the camera comes to whoever speaks
    };
    // a stage's opening card (user 10/20, 12판: 박사님 behind a lamp, 몽글이 behind an open bin lid): what stands in front of
    // the speakers shuts, and if they're still hidden the view turns to where they show — not on the two tutorials (1판's box
    // has to start with its back to you)
    if (opts.title && !opts.cam && !this.running && !(this.spec.tut <= 2) && !G.skipTalk && !G.bot) {
      const chs = [...new Set(lines.map(L => this.charFor(L.who)).filter(Boolean))];
      await clearParts(this, chs); if (!this.dead) await clearTurn(this, chs);
    }
    try { await playDialog(G, lines, { ...opts, onLine }); }
    finally { this.talking = false; app.classList.remove('cine'); }
  }
  // the first stage this friend hosts (a card is worth it then)
  firstMeet(host) {
    if (!host) return false;
    for (let j = 0; j < this.idx; j++) { const s = stageSpec(j); if ((hostAt(j) || (s.timed ? 'raccoon' : THEMES[s.room]?.friend)) === host) return false; }
    return true;
  }
  // a stage's opening talk: the card when it's worth stopping for (talkKeep / keep), else just its first line as a bubble
  async openTalk(lines, opts, keep = false) {
    if (!lines?.length) return;
    if (keep || this.talkKeep) return this.talk(lines, opts);
    // the first line, then any line the script marks keep (a payback, 먹물이, a clue — 검토 세션 H1), one bubble after
    // another; each stays as long as it takes to read (H2: an English line of 60 letters didn't fit 2.2 s)
    const show = [lines[0], ...lines.filter((l, i) => i > 0 && l.keep)];
    // 첫 만남은 말 대신 동작으로 (스토리 룸 10/19): a scene marked bubble, meeting its host for the first time — the host
    // plays its own reaction (the same one a tap gives) as it says hello
    if (this.scene?.bubble && this.firstMeet(this.th.friend) && this.friend?.react) setTimeout(() => { if (!this.dead && !this.result && !this.friend.reacting) this.friend.react(this.tw, (n, p) => this.G.audio.sfx(n, p)); }, 250);
    let at = 350;
    for (const L of show) {
      const ch = this.charFor(L.who) || this.friend, n = String(tr(L.text) || '').length, ms = Math.max(1800, Math.min(4600, 900 + n * 60));
      setTimeout(() => !this.dead && !this.result && this.say(ch, L.text, ms, L.name), at);   // (L.name: '???' before 먹물이 says its name — 외부 3차 QA 10/20)
      at += ms + 250;
    }
  }
  // ── 사건 판: the owner runs and hides, giggles from the hideout, and pops out when it is opened
  async friendHides() {
    if (this.v2) return v2Hide(this);
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
    // (user 10/19, on the phone: "토순이 숨을 때 뚜껑이라도 열리고 들어가게") the lid, door or drawer opens as she gets there,
    // and shuts behind her — so you see *where* she went in, and that it is a thing that opens
    const lid = typeof part.setOpen === 'function' && ['lid', 'door', 'drawer', 'lift'].includes(part.kind) && !part.lock;
    const jump = tw.run(.75, k => { f.root.position.lerpVectors(from, pc, k); f.root.position.y = from.y + (pc.y - from.y) * k + Math.abs(Math.sin(k * Math.PI * 2)) * .35; f.root.scale.setScalar(1 - .75 * Math.max(0, k - .6) / .4); });
    if (lid) { await tw.wait(.25); G.audio.sfxPart(part, part.sfx || 'open'); await tw.run(.25, k => part.setOpen(k), ease.outCubic); }
    await jump;
    f.root.visible = false; this.friendHidden = true;
    if (lid) { await tw.wait(.1); await tw.run(.22, k => part.setOpen(1 - k), ease.inCubic); G.audio.sfxPart(part, part.kind === 'drawer' ? 'drawerClose' : 'close'); }
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
    // the full "눈 감아! 하나, 둘, 셋" only the first time; after that a short dark "쉿…" — the hiding sounds stay, they're the
    // clue (user, 10/18: "하나둘셋이것도 계속보니까 짜증나")
    const full = !G.save.r1Counted;
    if (hideCard(this)) {
    const ov = h('div', { class: 'r1-eyes' }, h('b', { class: 'ol' }, full ? R1.close : '쉿…'), this.r1N = h('span', { class: 'ol' }, ''));
    document.getElementById('overlay').append(ov);
    stagingHide(this, ov);
    f.root.visible = false;
    if (full) { for (const n of R1.nums) { if (this.dead) return; this.r1N.textContent = n; G.audio.sfx('tock'); await tw.wait(.6); } G.save.r1Counted = true; G.persist?.(); }
    else { await tw.wait(.35); if (this.dead) return; }
    G.audio.sfx('tap', 12); await tw.wait(.15); G.audio.sfx('tap', 14); await tw.wait(.2); G.audio.sfx(real.sfx || 'open'); await tw.wait(.35); G.audio.sfx('close');
    ov.classList.add('out'); setTimeout(() => ov.remove(), 300);
    } else {
      // (after the first two 사건 판: no screen-wide card — a hop and a puff, then the hiding sounds)
      await quickHide(this, f); if (this.dead) return;
      G.audio.sfx('tap', 12); await tw.wait(.12); G.audio.sfx(real.sfx || 'open'); await tw.wait(.25); G.audio.sfx('close');
    }
    this.friendHidden = true; this.r1Trail(); stagingHidden(this);
    // a word once it's done — from where they stood counting, not over the hiding place: a bubble on the hideout showed the
    // answer before anyone looked (GPT QA L03, 10/19); the crumbs and the hiding sounds are the clues
    const home = this.friendHome.clone();
    setTimeout(() => !this.dead && this.friendHidden && this.say({ root: { position: home }, headTop: () => .9 }, r1Line(this.th.friend, 'hidden'), 1300), 400);
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
    if (this.v2) return v2Tell(this, line ?? null);   // v2: a voice at the bottom, never a wobble or a bubble on the hideout
    const part = this.plan.incident?.part; if (!part) return;
    const L = hidePool(this.idx, this.th.friend, 'stuck');   // 대본: the host's own tell (토순이's tail, 곰돌이's snore…)
    const say = line || L[(this._gn = (this._gn || 0) + 1) % L.length];
    if (part.furn.parts.some(p => p.device) && deviceTell(this, part, say)) return;   // 장치판: bubbles from the pond…
    const pc = this.partCenter(part);
    this.hero?.react('event', pc, this.tw);
    this.wobble(part.furn.group);
    // (the words at most every 13 s, or when you've been still a while — 1판 had "킥…"/"삐죽… 쏙!" every 4-5 s; 검토 재검토 5)
    // (1판: the hint words only when you've been stuck a while — ② 10/26 "푹신한 거 좋아하는데도 봐야 되고 … 정신이 없다")
    const talk = this.spec.tut === 1 ? this.idle > 15 : line || this.t - (this._gigSayT ?? -99) > 13 || this.idle > 10;
    this.G.audio.sfx(talk && this.th.friend === 'bunny' && /킥|푸|히|헤/.test(say) ? 'giggleBunny' : 'wobble');   // (토순이's own giggle with her "킥…" — 사운드 10/21)
    if (talk) { this._gigSayT = this.t; this.say({ root: { position: pc }, headTop: () => .25 }, say, 1300); }
  }
  // (10/19 evening, user: "스테이지5 열쇠 뚫어 버렸네? 크기 키우다가 ㅋ" — a key in the 레코드장 칸 poked through its wall and the
  // records) a thing put in a cubby or on a shelf is measured against its own furniture: rays from its middle to the four
  // sides; anything of the furniture closer than the thing reaches (a wall, a divider, books) shrinks it to fit with a
  // little air, at most to 45%. Open tops find nothing to hit and stay as they are.
  fitClear(spot, g) {
    const rooms = (this.room.rooms || [this.room]).map(R => R.group);
    let fr = spot.anchor; while (fr.parent && !rooms.includes(fr.parent)) fr = fr.parent;
    if (!fr.parent) return;
    // (not the other things already put in the furniture, nor their tap spheres — 5판's milk and the shelf's decoys shrank to
    // 70% against a neighbour's invisible sphere, 레벨 1~10 10/19)
    const mine = new Set(); g.traverse(o => mine.add(o)); for (const it of this.items) it.g?.traverse(o => mine.add(o));
    const rc = this._fitRc || (this._fitRc = new THREE.Raycaster());
    const need = () => {   // how much it must shrink to clear the furniture on all four sides (1 = it fits)
      g.updateMatrixWorld(true);
      // (the thing's own meshes — not its tap sphere, ≥ 0.4 m across, which made every thing in a cubby shrink to 70%: 레벨 1~10 10/19)
      const box = new THREE.Box3(), bb = new THREE.Box3();
      g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
      const c = box.getCenter(new THREE.Vector3()); if (box.isEmpty()) return 1;
      let k = 1;
      for (const [dx, dz, half] of [[1, 0, box.max.x - c.x], [-1, 0, c.x - box.min.x], [0, 1, box.max.z - c.z], [0, -1, c.z - box.min.z]]) {
        if (half <= .01) continue;
        rc.set(c, new THREE.Vector3(dx, 0, dz)); rc.far = half + .05;
        const hit = rc.intersectObject(fr, true).find(h => !mine.has(h.object) && !h.object.userData.proxy && h.object.visible !== false);
        if (hit) k = Math.min(k, (hit.distance - .015) / half);
      }
      return k;
    };
    let k = need(); if (k >= .999) return;
    // first turn it square to the furniture (a long key slanting across a cubby), keep whichever way fits better
    const ry = g.rotation.y, tries = [0, Math.PI / 2].map(a => { g.rotation.y = a; return [a, need()]; }).sort((x, y) => y[1] - x[1]);
    if (tries[0][1] > k) { g.rotation.y = tries[0][0]; k = tries[0][1]; } else g.rotation.y = ry;
    // then shrink, but never below 70% (things to find getting small was the earlier complaint; a hair of overlap beats a speck)
    if (k < .999) { g.scale.multiplyScalar(Math.max(.7, k)); g.updateMatrixWorld(true); }
  }
  async revealFriend(it) {
    if (it.found || this.result) return;
    const G = this.G, W = G.world, f = this.friend, tw = this.tw;
    it.found = true; this.found++; this.friendHidden = false; this.idle = 0;
    this.hero?.react('event', this.worldCenter(it), this.tw);
    // R2: the third time you find the same friend, their hiding habit fills in on their card (획득감, not a popup)
    if (!this.custom && !this.preview) { const hs = G.save.habitSeen ||= {}, k = this.th.friend; hs[k] = (hs[k] || 0) + 1; if (hs[k] === 2) setTimeout(() => !this.dead && G.ui.toast('도감에 새 칸: 숨는 버릇!', 'green'), 1800); }
    const pc = this.partCenter(it.spot.part), fy = new THREE.Vector3(); it.spot.part.furn.group.getWorldPosition(fy);
    let d = new THREE.Vector3(W.cam.position.x - pc.x, 0, W.cam.position.z - pc.z).normalize();
    { const furn = it.spot.part.furn, R = (this.room.rooms || [this.room]).find(r => r.furns?.some(e => e.f === furn));   // (10/19 user: 1판 토순이 popped out toward the wall after the view was turned — out the furniture's front, into the room)
      if (R?.frontOf) { const fr = R.group.localToWorld(R.frontOf(furn).clone()), dv = new THREE.Vector3(fr.x - pc.x, 0, fr.z - pc.z); if (dv.lengthSq() > .01) d = dv.normalize(); } }
    const to = pc.clone().addScaledVector(d, .95); to.y = fy.y;
    // (10/19 겹침 QA: 1판 토순이 came out .29 m from 몽글이, who stands in front of the hideout) onto free floor near there,
    // a body's width from everyone else
    { const t = this.standNear(to, f, .75, 1.3, true); if (t) to.set(t.x, to.y, t.z); }
    // (10/20, user on the phone: 박사님 "문 너머 검은 곳에서 나와야 하는데 하늘에서 그냥 떨어져요") the secret-door stage: out of the dark
    // doorway the bookcase slid away from, at floor height, walking — not a pop out of the cupboard above it
    const sc = this.plan.showcase, viaDoor = sc?.shelf && it.spot.part === sc.door;
    if (viaDoor) {
      // from the floor of the nook (the friend's own spot, in the dark behind the door) out along the case's front, in the
      // game's own little walking hops; the view follows down to the floor (it was up on the marble run)
      const fg = it.spot.part.furn.group, q = new THREE.Quaternion(), fd = new THREE.Vector3(0, 0, 1).applyQuaternion(fg.getWorldQuaternion(q)); fd.y = 0; fd.normalize();
      const from = it.spot.anchor.getWorldPosition(new THREE.Vector3()); from.y = fy.y;
      const out = from.clone().addScaledVector(fd, 1.05); { const s = this.standNear(out, f, .75, 1.3, true); if (s) out.set(s.x, out.y, s.z); }
      f.root.visible = true; f.root.position.copy(from); f.root.scale.setScalar(1); f.setFace('happy'); f.pose = 'idle';
      f.root.rotation.y = Math.atan2(out.x - from.x, out.z - from.z);
      it.slot?.classList.add('found', 'bump');
      W.flyTo(tw, { target: new THREE.Vector3((from.x + out.x) / 2, fy.y + .6, (from.z + out.z) / 2), zoom: Math.min(W.zoom, 2.2), dur: .7 });
      await tw.wait(.3);
      for (let k = 1; k <= 3; k++) await f.hopTo(tw, from.x + (out.x - from.x) * k / 3, from.z + (out.z - from.z) * k / 3, { height: .18, dur: .28, sfx: k === 1 ? n => G.audio.sfx(n) : null });
      f.pose = 'cheer'; G.audio.sfx('special'); G.hitstop(.08);
      const s = W.toScreen(out.clone().setY(out.y + .5)); W.fx.burst(s.x, s.y, { n: 26, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 300 }); W.fx.ring(s.x, s.y, { r: 110, color: '#ffe14d', width: 9 });
    } else {
    // (10/20, user on the phone: "토순이 찾아서 나올 때도 뭔가 뒤로 나옴") she still faced into the hideout from hiding (friendHides):
    // she comes out facing you
    f.root.visible = true; f.root.position.copy(pc); f.root.scale.setScalar(.25); f.setFace('happy'); f.pose = 'cheer'; f.faceTo(W.cam.position.x, W.cam.position.z);
    G.audio.sfx('special'); G.hitstop(.08);
    const s = W.toScreen(pc); W.fx.burst(s.x, s.y, { n: 34, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 360 }); W.fx.ring(s.x, s.y, { r: 130, color: '#ffe14d', width: 10 });
    it.slot?.classList.add('found', 'bump');
    await tw.run(.6, k => { f.root.position.lerpVectors(pc, to, k); f.root.position.y = pc.y + (to.y - pc.y) * k + Math.sin(k * Math.PI) * .7; f.root.scale.setScalar(.25 + .75 * Math.min(1, k * 1.7)); });
    }
    f.faceTo(W.cam.position.x, W.cam.position.z);
    closeUp(this, f, { portrait: true });   // (10/19 "등장하거나 말하는 경우 카메라를 잘 잡아 줘야지") in on the friend who popped out, while the room lights up — the same frontal shot every stage
    this.tail?.mesh.parent?.remove(this.tail.mesh); this.tail = null;   // 1판: the tail goes back in with her
    // the room lights up: out of the dark, or a warm glow over the day
    const to2 = this.th.light || null, a0 = W.hemi.intensity, s0 = W.sun.intensity;
    if (this.dark || this.spec.night) { this.dark = false; W.setLight(to2); G.setBg(this.th.bg); setSky(this.th.sky || null); const a1 = W.hemi.intensity, s1 = W.sun.intensity; await tw.run(.6, k => { W.hemi.intensity = a0 + (a1 - a0) * k; W.sun.intensity = s0 + (s1 - s0) * k; }); }
    else await tw.run(.5, k => { const g = 1 + Math.sin(k * Math.PI) * .35; W.hemi.intensity = a0 * g; W.sun.intensity = s0 * g; });
    W.fx.confetti(70);
    await tw.wait(.9);
    // 대본: the host says what was really going on — once, after the pop-out (no bubble + dialog twice, no stock "next room" ad)
    if (!this.dead && !this.result && !G.skipTalk && !G.bot) await this.talk(incidentReveal(this.idx, this.th.friend), { title: this.th.name, cam: true });   // (not over a fail panel — QA 10/18)
    if (!this.result && !this.dead) {
      if (this.targets.some(t => !t.found)) closeBack(this);   // things still to find: back to where you were
      if (this.v2) return v2AfterFound(this);
      // the friend is found, but the stage ends only when everything is (user, 10/18: "캐릭터 찾으면 나머지 물건 안 찾아도
      // 깨지는 거 ㅈ같다니까") — the friend stays out and asks for the rest
      if (this.targets.every(t => t.found)) this.win();
      // (1판: 토순이 names what she dropped instead — tutb.js firstFindsTalk, ② 10/26)
      else if (this.spec.tut === 1 && this.plan?.first) this.idle = 0;
      else { const n = this.targets.filter(t => !t.found).length; this.say(f, `남은 물건 ${n}개도 찾아 줘!`, 2200); this.idle = 0; }
    }
  }
  // where everyone else stands (feet), for keeping a body's width apart (겹침 QA 10/19)
  bodies(self = null) {
    return [this.friend, this.hero?.ch, this.hero?.buddy, ...(this.npcs || []).map(n => n.ch), this.cameo?.ch, this.trick?.ch]
      .filter(c => c?.root?.parent && c !== self && c.root.visible !== false).map(c => c.root.position)
      .concat(this.floorThings().map(o => o.getWorldPosition(new THREE.Vector3())));
  }
  // things the stage itself set down on the floor after the furniture (이삿짐's boxes, the big parfait — modelkit.js kitSetup):
  // as solid as furniture to anyone placed or walking (겹침 QA 10/20, phone: 13판 식빵 walked through the moving boxes —
  // "초능력자야?" — it stood on a tile a box was then set down on, and the walkers' tiles never lost the boxes' ones)
  floorThings() { return [...(this.kitBoxes || []), ...(this.kitParfait ? [this.kitParfait.g] : [])].filter(o => o?.parent && o.visible !== false); }
  blockTile(t) { for (const L of [this.walkTiles, this.freeTiles]) { const k = L ? L.indexOf(t) : -1; if (k >= 0) L.splice(k, 1); } }
  // free floor (half-tile points clear of furniture, same level) nearest p, `gap` or more from everyone but `self`; null when
  // there is none within `reach`; see: rather where the camera sees it (a spot behind a bin counts as .8 m further)
  standNear(p, self = null, gap = .75, reach = 1.3, see = false) {
    const tiles = this.hero?.tiles || (this._walk ||= walkGrid(this.room.rooms || [this.room])), B = this.bodies(self);
    const W = this.G.world, roots = (this.room.rooms || [this.room]).map(R => R.group), v = new THREE.Vector3();
    let best = null, bd = Infinity;
    for (const t of tiles) {
      if (t.stair || Math.abs((t.y || 0) - p.y) > .3) continue;
      const d = Math.hypot(t.x - p.x, t.z - p.z); if (d > reach || d >= bd) continue;
      if (B.some(b => Math.hypot(b.x - t.x, b.z - t.z) < gap)) continue;
      const s = d + (see && !seenAt(W, v.set(t.x, (t.y || 0) + .3, t.z), roots) ? .8 : 0);
      if (s < bd) { best = t; bd = s; }
    }
    return best;
  }
  cutFlash() { const f = h('div', { class: 'cutflash' }); document.getElementById('app').append(f); setTimeout(() => f.remove(), 260); }
  // ── 흑백판
  setupGray() {
    const G = this.G, W = G.world, r = this.plan.rotSeed;
    if (W.post) { W.post.u.gray.value = 1; W.post.u.grayR.value = -1; }
    // a few pieces of furniture join the list: big and easy, they set how hard the stage is
    const RS = this.room.rooms || [this.room], k = this.idx < 12 ? 2 : 3, used = new Set();
    const tall = e => new THREE.Box3().setFromObject(e.f.group).getSize(new THREE.Vector3()).y > .3;   // not a flat thing on the ground (a hopscotch, a manhole): hard to tap
    // (② 레벨 10/21: from 21판 no piece that opens — 29판 호수 섬의 아이스박스: a tap on it found its colour instead of opening it,
    // then the thing on its lid took the tap, and the lid never opened; the bot tapped 15 times and lost the stage. Things move
    // into pieces after this (fixBlindSpots), so 'opens' rather than 'holds something now'; such pieces only when nothing else is left)
    const holds = e => e.f.parts.some(p => p.spots?.length);
    // (29판 개굴이네 연잎 연못 집 10/24: scenery pieces — the island ground, the rain — are no piece to find)
    const all = r.shuffle(RS.flatMap(R => R.furns).filter(e => e.type !== 'rug' && !e.type.startsWith('lever') && !(e.y > 1) && !e.f.noOccupied && tall(e) && G.hasThumb('furn_' + e.type)));
    // (⑤ QA 10/21, 42판: the 그네 is a frame — a tap on its middle hits the ground; 16% of its box answered, the bot ran out of
    // taps 26 times): open frames after the solid pieces too, before the ones that open (② 10/22, 24판: the grind rail and the board
    // rack too — a tap on the rail's middle went to the floor or to a thing under it, the bot lost 14 taps there twice)
    const FRAME = new Set(['swings2', 'swings', 'slidetower', 'slide', 'seesaw2', 'seesaw', 'springrider', 'pole', 'clothesline', 'dryrack', 'lightline', 'bikeshelter', 'stanchion', 'easel', 'firepole', 'parasol', 'cafeumbrella', 'bkparasol', 'streetlamp', 'streetlamp2', 'hosereel', 'ladder', 'libladder', 'pavilion', 'pavilion2', 'grindrail', 'boardrack']);
    const solid = e => !holds(e) && !FRAME.has(e.type);
    const cands = this.idx < 20 ? all : !sized(this.idx) ? [...all.filter(e => !holds(e)), ...all.filter(holds)] : [...all.filter(solid), ...all.filter(e => !holds(e) && FRAME.has(e.type)), ...all.filter(holds)];   // (pieces that open last, not out: the same draw, the same count — 53·58판 캠프는 다 열리는 것; 1~20판 as they are — 사용자 '1~20 유지')
    this.grayFurn = new Map();
    // what you find comes back alone (사용자 실폰 10/20, 14판 "의자를 찾으면 의자만 색이 돌아오는 게 나을 것 같아"): a found
    // piece doesn't colour the juice still to find on its seat, a thing left on it, or another piece of furniture standing on it
    for (const R of RS) for (const e of R.furns) e.f.group.userData.grayStop = true;
    for (const it of this.items) it.g.userData.grayStop = true;
    const pick = [];
    for (const e of cands) { if (pick.length >= k || used.has(e.type)) continue; used.add(e.type); pick.push(e); }
    // (a piece drawn by another builder — opts.gptHero: 29판의 개굴이 간판·물레방아 — gets its own icon, not the old model's)
    const tkey = e => { if (!e.f.heroKey) return 'furn_' + e.type; const k = 'furn_' + e.type + '@' + e.f.heroKey; if (!G.hasThumb(k)) G.furnJobs?.set(k, { key: k, build: () => makeFurniture(e.type, this.th, e.opts).group, dir: [.75, .7, 1], fit: 1.0 }); return k; };
    const keys = new Map(pick.map(e => [e, tkey(e)]));
    G.needThumbs([...keys.values()]);   // just these icons, in one batch
    for (const e of pick) {
      const it = { type: 'furn:' + e.type, role: 'target', furnTarget: e, g: e.f.group, spot: { kind: 'on', label: FURN_NAME(e.type), part: null }, found: false, thumb: G.thumbs[keys.get(e)] };
      if (e.f.heroKey && FURN_INFO[e.f.heroKey]?.name) it.spot.label = FURN_INFO[e.f.heroKey].name;   // (and its own name)
      this.grayFurn.set(e.f, it); this.targets.push(it);
    }
    if (G.skipTalk || G.bot) setTimeout(() => !this.dead && G.ui.toast('색을 잃은 방! 찾을 때마다 색이 돌아와 — 큰 가구도 찾아 봐', 'green'), 1500);
    for (const R of RS) for (const e of R.furns) e.f.onGray?.();   // (a piece's own grey-stage start: 29판 — the rainbow is gone while the colour is)
  }
  colorIn(g) { g.userData.colored = true; this.G.world.idsDirty = true; }
  // ── 먹물이 숨기 (스토리 룸 10/19, 사용자 "추천대로"): where it hides — a free tile where, from the start view, its head
  // shows over something but its body doesn't (level 1, the first 흑백판), or better hidden still (level 2); the colour
  // is still on until it dashes there (inkyDash)
  hideInky(retry = false, roam = false) {
    if (roam && (retry || this.G.bot || this.G.skipTalk)) return;   // (a roaming 먹물이 without the dash just stands where it was put)
    // crouched beside a big piece of furniture with part of it showing — the way a peeking friend hides (hunt.js placeCameo):
    // level 1 (the first 흑백판) wants the peek on screen at the start; level 2 is happier hidden from the start view, as
    // long as some turn of the room shows it; never right beside the owner
    const v = this.villain, ch = v.ch, W = this.G.world, R = this.room, hp = this.friend.root.position;
    const near = this.bodies(ch);   // (and not on 몽글이, the friend you brought or a walker — 겹침 QA 10/19)
    const boxes = (R.rooms || [R]).flatMap(r => r.furns).map(e => ({ e, b: new THREE.Box3().setFromObject(e.f.group) })).filter(o => o.b.max.y - o.b.min.y > .06);
    const cz = R.center?.z || 0, all = boxes.reduce((u, o) => u.union(o.b), new THREE.Box3());
    // (on a map, inside one of its rooms' floors — the map's own w/d is its outer box, centred anywhere: 36판 a peeker stood
    // 7 cm into the next room's wall — 겹침 QA 10/19)
    const inside = R.rooms ? (x, z) => R.rooms.some(q => { const o = q.group.position; return Math.abs(x - o.x) < q.w / 2 - .25 && Math.abs(z - o.z) < q.d / 2 - .25; }) : R.w && R.d ? (x, z) => Math.abs(x) < R.w / 2 - .25 && Math.abs(z - cz) < R.d / 2 - .25 : (x, z) => x > all.min.x + .1 && x < all.max.x - .1 && z > all.min.z + .1 && z < all.max.z - .1;
    const free = (x, z, pad = .05) => inside(x, z) && !boxes.some(o => x > o.b.min.x - pad && x < o.b.max.x + pad && z > o.b.min.z - pad && z < o.b.max.z + pad) && (!this.sides || offWall(this.sides, x, R.group.position.y, z));
    if (!roam) ch.root.scale.setScalar(.85);
    const roots = [R.group, ch.root], y0 = W.yaw, p0 = W.pitch, t0 = performance.now();
    let best = null;
    const tall = boxes.filter(o => o.b.max.y - o.b.min.y > .45 && o.b.max.y < 2.4).sort(() => Math.random() - .5);
    for (const o of tall) {
      if (performance.now() - t0 > 450) break;   // (it runs while the stage loads)
      const c = o.b.getCenter(new THREE.Vector3()), sz = o.b.getSize(new THREE.Vector3());
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const half = Math.abs(nx) * sz.x / 2 + Math.abs(nz) * sz.z / 2, tHalf = Math.abs(nz) * sz.x / 2 + Math.abs(nx) * sz.z / 2;
        for (const tk of [.75, -.75]) {
          const x = c.x + nx * (half + .22) + nz * tHalf * tk, z = c.z + nz * (half + .22) - nx * tHalf * tk;
          if (!free(x, z) || Math.hypot(x - hp.x, z - hp.z) < 1.2 || near.some(b => Math.hypot(b.x - x, b.z - z) < .8)) continue;
          ch.root.position.set(x, o.b.min.y, z); ch.root.rotation.y = Math.atan2(W.cam.position.x - x, W.cam.position.z - z); ch.root.updateMatrixWorld(true);
          const head = new THREE.Vector3(x, o.b.min.y + ch.headTop() * .8, z);
          const atStart = !!W.visibleAt(ch.root, head, roots), sp = W.toScreen(head);
          const onScreen = sp.x > 40 && sp.x < W.W - 100 && sp.y > 160 && sp.y < W.H - 260;
          let views = 0;
          for (let k = 0; k < 4; k++) { W.yaw = y0 + k * Math.PI / 2; W.pitch = p0; W.updateCam(); R.update?.(1); if (W.visibleAt(ch.root, head, roots)) views++; }
          W.yaw = y0; W.pitch = p0; W.updateCam(); R.update?.(1);
          if (!views) continue;
          const cov = coveredFrac(this, ch);
          const score = !roam && v.hide >= 2 ? (atStart ? 2 : 6) + (cov > .45 && cov < .9 ? 6 : 0) + Math.min(views, 3)
            : (atStart && onScreen ? 8 : 0) + (cov > .3 && cov < .85 ? 6 : 0) + Math.min(views, 3);
          if (!best || score > best.score) best = { x, z, y: o.b.min.y, score };
        }
      }
    }
    if (!best) { const t = v.t; best = { x: t.x, z: t.z, y: t.y || 0 }; }   // (no tall furniture: where it stood)
    v.hideT = best;
    ch.root.position.set(best.x, best.y, best.z); ch.root.rotation.y = Math.atan2(W.cam.position.x - best.x, W.cam.position.z - best.z); ch.setFace('happy');
    // the dash plays at the start (not on a retry, not for the bots): until then the room keeps its colour
    this._dash = !retry && !this.G.bot && !this.G.skipTalk;
    if (this._dash) { ch.root.visible = false; if (W.post) W.post.u.gray.value = 0; }
  }
  async inkyDash() {
    const v = this.villain, ch = v.ch, W = this.G.world, tw = this.tw, u = W.post?.u.gray, goal = v.hideT;
    const from = (this.freeTiles || []).filter(t => Math.abs((t.y || 0) - (goal.y || 0)) < .3).sort((a, b) => Math.hypot(b.x - goal.x, b.z - goal.z) - Math.hypot(a.x - goal.x, a.z - goal.z))[0] || goal;
    ch.root.position.set(from.x, from.y || 0, from.z); ch.root.rotation.y = Math.atan2(goal.x - from.x, goal.z - from.z); ch.root.visible = true;
    this.G.audio.sfx('whoosh');
    const drain = u ? tw.run(.95, k => { u.value = k; }, ease.inOutQuad) : Promise.resolve();
    const hops = 4;
    for (let k = 1; k <= hops && !this.dead; k++) await ch.hopTo(tw, from.x + (goal.x - from.x) * k / hops, from.z + (goal.z - from.z) * k / hops, { height: .22, dur: .17 });
    await drain; if (u) u.value = 1;
    ch.root.position.set(goal.x, goal.y || 0, goal.z); ch.root.rotation.y = Math.atan2(W.cam.position.x - goal.x, W.cam.position.z - goal.z); ch.bump(.4);
    await tw.wait(.25);
  }
  async onFoundInky(it) {
    const G = this.G, W = G.world, ch = this.villain.ch;
    it.found = true; this.idle = 0; this.found++; this._lastIt = it;
    const c = ch.root.position.clone().setY(ch.root.position.y + ch.headTop() * .6), s = W.toScreen(c);
    W.fx.burst(s.x, s.y, { n: 24, colors: ['#ff8fb8', '#ffe14d', '#8fd3f4', '#9be38f', '#c9a0ff'], speed: 330 });
    W.fx.ring(s.x, s.y, { r: 110, color: '#ffe14d', width: 9 });
    G.audio.sfx('found', this.found); G.ui.floatText(s.x, s.y - 60, INKY_FOUND, 'gold big');
    this.say(ch, inkyCaught(this.idx), 1600);   // 대본: …앗. → …또 들켰다.
    ch.setFace('wow'); ch.bump(.5); ch.faceTo(W.cam.position.x, W.cam.position.z);
    closeUp(this, ch);   // (10/19, 스토리 룸) in on 먹물이's "…앗."; back out to the wide view as it bolts (inkyBolt)
    this.hero?.react('find', c, this.tw);
    if (this.feelHelp && this.targets.every(t => t.found)) this.lastOneFx();
    this.tnum.textContent = `${this.found}/${this.targets.length}`; this.tbarI.style.width = (this.found / this.targets.length * 100) + '%';
    this.setMong('happy', 'hop');
    this.inkyBolt();
    await G.ui.flyImg(it.thumb, s.x, s.y, it.slot, { size: 70, dur: 560 });
    it.slot.classList.add('found', 'bump'); G.audio.sfx('pop', this.found);
    if (this.targets.every(t => t.found) && !this.result) this.win();
  }
  // 먹물이 runs off the edge of the room and leaves its colour-smeared footprints behind (10판 "…발자국이다", 42 · 61판)
  inkyBolt() {
    const v = this.villain, ch = v.ch, tw = this.tw, rooms = this.room.rooms || [this.room];
    const W = this.G.world, p0 = ch.root.position.clone();
    const inside = q => rooms.some(R => { const o = R.group.position; return Math.abs(q.x - o.x) < R.w / 2 - .12 && Math.abs(q.z - o.z) < R.d / 2 - .12; });
    // run off across floor you can see, so the footprints are there to see (not under the bed it hid by)
    let dir = null, bs = -1;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.71, .71], [-.71, .71], [.71, -.71], [-.71, -.71]]) {
      let vis = 0, ins = 0;
      for (let d = .3; d <= 2.4; d += .3) { const q = new THREE.Vector3(p0.x + dx * d, p0.y + .02, p0.z + dz * d); if (!inside(q)) break; ins++; const sp = W.toScreen(q); if (this.pickExact(sp.x, sp.y).kind === 'floor') vis++; }
      const sc = vis * 2 + ins * .2; if (sc > bs) { bs = sc; dir = new THREE.Vector3(dx, 0, dz).normalize(); }
    }
    const away = p0.clone().addScaledVector(dir, 5);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x), len = p0.distanceTo(away), rot = Math.atan2(dir.x, dir.z);
    // (QA3-prints9 10/19, user: "장애물 밑에도 발자국 생긴다") no print on floor that furniture or decor covers (a rug is fine)
    const solid = rooms.flatMap(R => [...R.furns, ...(R.decors || [])]).filter(q => q.type !== 'rug' && !(q.y > 1) && !q.hidden && q.f?.group?.visible !== false)
      .map(q => new THREE.Box3().setFromObject(q.f.group)).filter(b => !b.isEmpty() && b.max.y - b.min.y > .06);
    const bare = q => !solid.some(b => q.x > b.min.x - .05 && q.x < b.max.x + .05 && q.z > b.min.z - .05 && q.z < b.max.z + .05);
    const COLS = ['#ff8fb8', '#ffe14d', '#8fd3f4', '#9be38f', '#c9a0ff'];
    let last = 0, n = 0;
    return tw.wait(1.1).then(() => { if (!this.result) closeBack(this); ch.setFace('angry'); ch.root.rotation.y = rot; return tw.run(.7, k => {
      ch.root.position.lerpVectors(p0, away, k); ch.root.position.y = p0.y + Math.abs(Math.sin(k * Math.PI * 4)) * .18; ch.root.scale.setScalar(1 - .6 * k);
      for (const d = k * len; d - last > .28;) { last += .28; const q = p0.clone().addScaledVector(dir, last).addScaledVector(perp, (n % 2 ? -1 : 1) * .07); if (inside(q) && bare(q)) this.footprint(q, COLS[n % COLS.length], rot); n++; }
    }, ease.inQuad); }).then(() => { ch.root.visible = false; });
  }
  // 깜짝 한 방 (스토리 룸 10/19, 검토 → 사용자 "2·4번 추천대로"): as the last thing is found the host does one small thing that
  // is just them — a bubble (script.js scene.pop.say) and one of these moves. No card, no rule, and no camera of its own:
  // it plays inside the win close-up. ≤2 s; the result panel waits for it.
  async popMove(ch, pop) {
    const G = this.G, W = G.world, tw = this.tw, rx = ch.rx, sfx = (n, p = 0) => G.audio.sfx(n, p);
    const t = (d, fn, e = ease.outCubic) => tw.run(d, fn, e), hop = (hgt, k) => hgt * 4 * k * (1 - k);
    const scr = (k = .5) => W.toScreen(new THREE.Vector3(ch.root.position.x, ch.root.position.y + ch.headTop() * ch.root.scale.y * k, ch.root.position.z));
    ch._rxTok = null; ch.reacting = false; for (const k in rx) rx[k] = 0;   // (a tap reaction still playing stops here)
    if (pop.say) this.say(ch, tr(pop.say), 1800);
    switch (pop.move) {
      case 'flop': {   // 벌러덩 (2판 토순이: 커튼까지 쳤는데)
        ch.setFace('wow'); ch._fx(tw, 'excl', { y: 1 }); sfx('gasp');
        await t(.24, k => { rx.rx = -1.2 * k; rx.y = hop(.14, k); }, ease.outQuad);
        sfx('thump'); ch.squash = .35; ch.setFace('dizzy');
        await tw.wait(.6);
        await t(.35, k => { rx.rx = -1.2 * (1 - k); }, ease.outBack); break;
      }
      case 'splash': {   // 놀라 펄쩍 → 퐁당 (3판 개굴이)
        ch.setFace('wow'); ch._fx(tw, 'excl', { y: 1 }); sfx('gasp');
        await t(.38, k => { rx.y = hop(.55, k); }, ease.linear);
        const s = scr(.1); W.fx.burst(s.x, s.y, { n: 20, colors: ['#8fd3ff', '#5ab8ff', '#ffffff'], shape: 'dot', speed: 230, size: 9, gravity: 560, up: 170, life: .75 });
        sfx('blub'); ch.setFace('sad');
        await t(.6, k => { ch.squash = .45 * (1 - k * k); }, ease.linear);   // (sitting in the puddle)
        ch._fx(tw, 'drop', { x: .22, y: .95 });
        await t(.3, k => { rx.y = hop(.12, k); }, ease.linear); break;
      }
      case 'doze': {   // 기다리다 꾸벅 → 화들짝 (5판 곰돌이)
        ch.pose = 'idle'; ch.setFace('sus'); sfx('snore');
        for (let i = 0; i < 3; i++) ch._fx(tw, 'z', { x: .18 + i * .1, y: .85 + i * .12, delay: .1 + i * .28, dur: .9 });
        await t(.95, k => { rx.rx = .32 * Math.sin(k * Math.PI / 2); }, ease.inOutQuad);
        await tw.wait(.2);
        ch.setFace('wow'); ch._fx(tw, 'excl', { y: 1 }); sfx('gasp');
        await t(.36, k => { rx.rx = .32 * (1 - k); rx.y = hop(.3, k); }, ease.linear); break;
      }
      case 'smoke': {   // 킁킁 → 앗, 팬케이크! (6판 곰돌이: the stove smokes)
        const R = this.room, rec = (R.rooms || [R]).flatMap(r => r.furns).find(e => e.type === pop.at || e.opts?.variant === pop.at);
        // (from the stove; when the close-up has it off screen, from the screen's edge on its side — not out of the bear)
        const from = () => {
          if (!rec) { const p = scr(1.3); return { x: p.x + 60, y: p.y }; }
          const b = new THREE.Box3().setFromObject(rec.f.group), c = b.getCenter(new THREE.Vector3()); c.y = b.max.y + .05;
          const p = W.toScreen(c); return { x: clamp(p.x, 28, W.W - 28), y: clamp(p.y, 110, W.H - 200) };
        };
        ch.setFace('sus'); ch._fx(tw, 'ques', { x: .32, y: .9 }); sfx('hmm');
        for (let i = 0; i < 5; i++) tw.wait(.1 + i * .2).then(() => { if (this.dead) return; const p = from(); W.fx.burst(p.x + (Math.random() - .5) * 16, p.y, { n: 4, colors: ['#8d8d9a', '#b9b9c4', '#6c6c78'], shape: 'dot', speed: 40, size: 18, gravity: -150, life: 1.2 }); });
        await t(.8, k => { rx.rz = Math.sin(k * Math.PI * 4) * .07; }, ease.linear);   // (sniff sniff)
        ch.setFace('wow'); ch._fx(tw, 'excl', { y: 1 }); sfx('gasp');
        await t(.55, k => { rx.rz = Math.sin(k * Math.PI * 6) * .2 * (1 - k); rx.y = hop(.18, k); }, ease.linear); break;
      }
      case 'thud': {   // 신나서 뛰다 배로 쿵 (7판 펭펭이 → "비결 3번. 쿵 하지 않기")
        ch.setFace('happy'); sfx('hop');
        await t(.4, k => { rx.y = hop(.5, k); rx.rx = .9 * k * k; }, ease.linear);
        await t(.1, k => { rx.rx = .9 + .55 * k; }, ease.inQuad);
        sfx('thump'); ch.squash = .45; ch.setFace('dizzy');
        const s = scr(.4); W.fx.burst(s.x, s.y, { n: 8, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 170, size: 11, gravity: 240 });
        await tw.wait(.6);
        await t(.35, k => { rx.rx = 1.45 * (1 - k); }, ease.outBack); ch.setFace('sweat'); break;
      }
      case 'sneeze': {   // 에… 에취! 거품이 퐁퐁 (9판 토순이 욕실)
        ch.setFace('sus');
        await t(.55, k => { rx.rx = -.3 * k; }, ease.inOutQuad);
        sfx('pop', 3); ch.setFace('wow');
        const s = scr(.7); W.fx.burst(s.x, s.y, { n: 24, colors: ['#ffffff', '#cfefff', '#ffd6ec'], shape: 'dot', speed: 230, size: 13, gravity: -130, life: 1.2 });
        await t(.12, k => { rx.rx = -.3 + .75 * k; }, ease.outQuad);
        ch.squash = .4;
        await t(.4, k => { rx.rx = .45 * (1 - k); }, ease.outBack); break;
      }
    }
    for (const k in rx) rx[k] = 0;
    if (!this.dead) { ch.pose = 'cheer'; ch.setFace('happy'); }
  }
  // 6판 (검토 10/19 '이 판만의 아하'): with one thing left, the pancake smoke drifts from the stove toward it — a look, not
  // a rule, and the camera stays where you put it. A short drift (~3 s), a pause, again, until it is found.
  smokeTo(at) {
    const W = this.G.world, R = this.room, last = this.targets.find(t => !t.found);
    const rec = (R.rooms || [R]).flatMap(r => r.furns).find(e => e.type === at || e.opts?.variant === at);
    if (!rec || !last?.g) return;
    const top = () => { const b = new THREE.Box3().setFromObject(rec.f.group), c = b.getCenter(new THREE.Vector3()); c.y = b.max.y + .05; return W.toScreen(c); };
    const COL = ['rgba(150,150,165,.5)', 'rgba(185,185,196,.45)', 'rgba(125,125,140,.4)'], life = 2.4;   // (see-through: smoke, not grey balls)
    let n = 0;
    const puff = () => {
      if (this.dead || this.result || last.found) return;
      const a = top(), b = W.toScreen(this.worldCenter(last)), dx = b.x - a.x, dy = b.y - a.y;
      // (the fx layer damps a dot's sideways speed by e^-2.2t and leaves the vertical alone: aim so both land on the thing)
      const vx = dx * 2.2 / (1 - Math.exp(-2.2 * life)), vy = dy / life;
      for (let i = 0; i < 2; i++) W.fx.ps.push({ x: a.x + (Math.random() - .5) * 14, y: a.y - 4, vx: vx * (.9 + Math.random() * .2), vy: vy * (.9 + Math.random() * .2), g: 0, life, t: 0, size: 24 + Math.random() * 12, c: COL[(n + i) % 3], shape: 'dot', rot: 0, vr: 0, sway: Math.random() * 6 });
      this.tw.wait(++n % 10 ? .28 : 5).then(puff);
    };
    puff();
  }
  // 1장, between the two 흑백판 (스토리 룸 10/19 '다시 하고 싶게'): 먹물이 passed through a colour stage too — a short trail of
  // the same colour-smeared footprints across floor the start view shows. Nothing to tap, not on the list, no line; 10판's
  // "…발자국이다" is where it lands. (A floor point is a real ray hit, so a balcony or an upper floor works the same.)
  async inkyTrace() {
    const W = this.G.world, roots = this.pickRoots(), t0 = performance.now(), GS = .5;
    const frame = () => new Promise(r => requestAnimationFrame(r));   // (the scan is spread over frames: no hitch as play starts)
    // a grid point counts when the first thing the ray meets there is the bare floor right at that point (not a rug: a print
    // there would get an outline against it)
    const rooms = this.room.rooms || [this.room];
    // (not on floor under a balcony or an upper floor: it is in shadow there — 7판)
    const under = q => rooms.some(R => R.group.position.y > q.y + .5 && Math.abs(q.x - R.group.position.x) < R.w / 2 && Math.abs(q.z - R.group.position.z) < R.d / 2);
    const bare = q => { const sp = W.toScreen(q); if (sp.x < 30 || sp.x > W.W - 30 || sp.y < 170 || sp.y > W.H - 250) return null;
      const hh = W.pick(sp.x, sp.y, roots)[0]; return hh && this.classify(hh.object).kind === 'floor' && Math.hypot(hh.point.x - q.x, hh.point.z - q.z) < .1 && Math.abs(hh.point.y - q.y) < .03 ? hh.point.clone() : null; };
    // (and a little around it too — a gap between railing posts isn't a floor you can see a trail on: 7판 balcony)
    const seen = q => { const c = bare(q); return c && bare({ x: q.x + .15, y: q.y, z: q.z + .15 }) && bare({ x: q.x - .15, y: q.y, z: q.z - .15 }) ? c : null; };
    const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    // (레벨 1~10 기준 10/19) the trail must not read as a hint: where it ends — and the next .8 m on — keeps .8 m from anything
    // to find, a key, a locked piece; and it would rather end at a door or the stairs, the way out (where 먹물이 went)
    const mid = o => { const bx = new THREE.Box3().setFromObject(o); return bx.isEmpty() ? null : bx.getCenter(new THREE.Vector3()); };
    const hideG = this.plan.incident?.part?.furn?.group;   // (a 사건 판 — 20판 집들이: nor where the friend is hiding)
    const avoid = [...this.items.map(it => it.g && mid(it.g)), ...this.plan.locks.map(l => { const g = l.part?.furn?.group || l.part?.pivots?.[0]; return g && mid(g); }), ...(hideG ? [mid(hideG)] : [])].filter(Boolean);
    const exits = rooms.flatMap(R => [...(R.decors || []).filter(d => d.type === 'door' && !d.hidden), ...R.furns.filter(f => /stair/.test(f.type))]).map(r => mid(r.f.group)).filter(Boolean);
    const near = (q, list, r, dy) => list.some(c => Math.hypot(c.x - q.x, c.z - q.z) < r && Math.abs(c.y - q.y) < dy);
    const safeEnd = (e, di, dj) => [0, .4, .8].every(k => !near({ x: e.x + di * k, y: e.y, z: e.z + dj * k }, avoid, .8, 1.2));
    // one scan (a grid point: seen or not, how far in from the room's edge, under an upper floor or not), then the pick in
    // passes: in the open and half a metre in first; closer to the edge next; under a balcony last
    const grids = [];
    for (const R of rooms) {
      if (!R.w || !R.d) continue;   // (~3 rays a point, a row a frame)
      const o = R.group.position, nx = Math.floor((R.w - .6) / GS), nz = Math.floor((R.d - .6) / GS), cell = [];
      for (let i = 0; i <= nx; i++) {
        cell[i] = [];
        for (let j = 0; j <= nz; j++) {
          const q = new THREE.Vector3(o.x - nx * GS / 2 + i * GS, o.y, o.z - nz * GS / 2 + j * GS), p = seen(q);
          cell[i][j] = p && { p, edge: Math.min(R.w / 2 - Math.abs(q.x - o.x), R.d / 2 - Math.abs(q.z - o.z)), under: under(q) };
        }
        await frame(); if (this.dead || this.result) return;
      }
      grids.push({ cell, nx, nz });
    }
    let best = null;
    for (const [minEdge, okUnder] of [[.55, false], [.3, false], [.3, true]]) {
      for (const { cell, nx, nz } of grids) for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) for (const [di, dj] of D8) {
        const ok = c => c && c.edge >= minEdge && (okUnder || !c.under);
        const pts = []; for (let k = 0; k < 6 && ok(cell[i + di * k]?.[j + dj * k]); k++) pts.push(cell[i + di * k][j + dj * k].p);
        const n2 = Math.hypot(di, dj);
        // (and on the way: no print within .5 m of anything to find — 11판's trail passed 21 cm from a cookie, 레벨 1~10 10/19)
        let clearN = pts.length; for (let q = 0; q < pts.length; q++) if (near(pts[q], avoid, .5, 1.2)) { clearN = q; break; }
        for (let n = 3; n <= clearN; n++) {   // (any length that ends safe — the longest isn't always the one)
          const e = pts[n - 1]; if (!safeEnd(e, di / n2, dj / n2)) continue;
          const exit = near(e, exits, 1.3, 1.6), score = n + (exit ? 3 : 0);
          if (!best || score > best.score) best = { pts: pts.slice(0, n), dir: new THREE.Vector3(di, 0, dj).normalize(), score, exit, pass: minEdge + (okUnder ? 'u' : '') };
        }
      }
      if (best) break;
    }
    if (!best || best.pts.length < 3 || this.dead) return;
    // footsteps every .28 m along the visible run (the grid is coarser than a stride)
    const a0 = best.pts[0], a1 = best.pts.at(-1), len = a0.distanceTo(a1), steps = [];
    for (let d = 0; d <= len + .01; d += .28) steps.push(a0.clone().lerp(a1, d / len));
    best.steps = steps;
    // a paw print, flat on the floor like a smear of paint (no ink outline — it reads as the floor's own ID), in the
    // colours it carries off; a little stronger than the 흑백판's so it shows on wood
    const COLS = ['#ff6fa8', '#5ab8ff', '#a77bff', '#4fcf86'], perp = new THREE.Vector3(-best.dir.z, 0, best.dir.x), rot = Math.atan2(best.dir.x, best.dir.z);
    const fw = best.dir.clone();
    best.steps.forEach((q, k) => {
      const c = q.clone().addScaledVector(perp, (k % 2 ? -1 : 1) * .08), col = COLS[k % COLS.length];
      this.footprint(c, col, rot, { flat: true, r: .07 });
      for (const t of [-1, 0, 1]) this.footprint(c.clone().addScaledVector(fw, .1 - Math.abs(t) * .02).addScaledVector(perp, t * .05), col, rot, { flat: true, r: .026 });
    });
    this.traceAt = { n: best.steps.length, at: a0, end: a1, exit: best.exit, pass: best.pass, ms: Math.round(performance.now() - t0) };   // (for the headless check)
  }
  footprint(at, color, rot, { flat = false, r = .055 } = {}) {   // (flat: 7판's trail — no outline, part of the floor)
    const W = this.G.world, m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.set(-Math.PI / 2, 0, -rot); m.position.set(at.x, (at.y || 0) + .012, at.z); m.scale.set(.01, .01, 1);
    if (flat) m.userData.floor = true; else m.userData.colored = true;
    W.root.add(m); (this.prints || (this.prints = [])).push(m); W.idsDirty = true;
    if (flat) { m.scale.set(.75, 1.15, 1); return; }   // (the trail is just there — no pop while you play)
    this.tw.run(.18, k => m.scale.set(.75 * k, 1.15 * k, 1), ease.outBack);
  }
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
    // the first piece of furniture behind the thing tapped only — not one further back (24판: a juice box in front of the
    // quarter pipe counted the pipe behind it)
    for (const hh of this.G.world.pick(x, y, [this.room.group])) {
      const c = this.classify(hh.object); if (c.kind === 'item') continue;
      const f2 = c.kind === 'furn' ? c.furn : c.kind === 'part' ? c.part.furn : null;
      const t = f2 && this.grayTarget(f2); return t && !t.found ? t : null;
    }
    return null;
  }
  async onFoundFurn(it) {
    const G = this.G, W = G.world;
    it.found = true; this.idle = 0; this.found++; this._lastIt = it;
    setTimeout(() => !this.dead && this.taunt('furn'), 500);
    const c = this.worldCenter(it), s = W.toScreen(c);
    this.colorIn(it.g);
    W.fx.burst(s.x, s.y, { n: 22, colors: ['#ff8fb8', '#ffe14d', '#8fd3f4', '#9be38f'], speed: 320 });
    W.fx.ring(s.x, s.y, { r: 110, color: '#ffe14d', width: 9 });
    G.audio.sfx('found', this.found); G.ui.floatText(s.x, s.y - 50, it.spot.label + '!', 'gold');
    this.hero?.react('find', c, this.tw);
    if (this.feelHelp && this.targets.every(t => t.found)) this.lastOneFx();   // F2
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
    it.found = true; this.idle = 0; this.found++; this._lastIt = it;
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
    this.hero?.react('find', c, this.tw);   // 내 캐릭터 reacts to a find (it no longer trails the view)
    if (this.feelHelp && this.targets.every(t => t.found)) this.lastOneFx();   // F2
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
    if (this.hiddenStage && left > 0) {   // the owner's three bubbles: first find · half · one left (each once; one left wins a tie)
      const n = this.targets.length, said = this._hs ||= new Set();
      const which = left === 1 ? 'last' : sceneAt(this.idx)?.sayAll ? (this.found === 1 ? 'first' : this.found === Math.ceil(n / 2) ? 'half' : null) : null;   // (말 줄이기: only "one left"; a scene with sayAll — 54판 판다's memory — keeps all three)
      const line = which && !said.has(which) && !(which === 'last' && this.kitPile) && hiddenSay(this.idx, this.th.friend, which);   // (13판's pile: at one left the last box goes and its own line says it — modelkit.js popPile)
      if (line) { said.add(which); setTimeout(() => !this.dead && !this.result && this.say(this.friend, line, 1600), 350); }
      // 6판 — only after 20 s still looking for the last one (user 10/19: "1" — hints felt too many, same wait as the sparkle)
      if (left === 1 && sceneAt(this.idx)?.lastSmoke && !this._smoke) { this._smoke = true; const at = sceneAt(this.idx).lastSmoke; this.tw.wait(35).then(() => { if (!this.dead && !this.result && this.targets.some(t => !t.found)) this.smokeTo(at); }); }   // (20 → 35 s with the other helps)
    }
    if (this.raidRun) raidFind(this, it, s);   // 타이머 털기: into the loot bag
    else if (this.spec.timed) this.tlEl.textContent = `너굴이가 세는 중 · ${this.found}/${this.targets.length}`;
    else if (this.incident) { const b = this.targets.filter(t => !t.friend), bf = b.filter(t => t.found).length; this.tnum.textContent = b.length ? `${bf}/${b.length}` : ''; this.tbarI.style.width = (bf / Math.max(1, b.length) * 100) + '%'; }
    else { this.tnum.textContent = `${this.found}/${this.targets.length}`; this.tbarI.style.width = (this.found / this.targets.length * 100) + '%'; }
    this.setMong('happy', 'hop');
    if (it.role === 'target' && this.found % 2 === 1) setTimeout(() => !this.dead && this.taunt('found'), 500);   // 흑백판: the owner is a sore loser
    if (this.tutStep === 2) this.tutDone();
    const g = it.g, s0 = g.scale.x;
    if (it.lightSwitch) {   // (9판: the switch stays on the wall — the rocker flips and the lights come on)
      const rk = it.g.parent && it.spot.furn?.rocker; if (rk) this.tw.run(.18, k => { rk.rotation.x = -.22 + .44 * k; }, ease.outBack);
      this.tw.run(.35, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .3)), ease.linear).then(() => g.scale.setScalar(s0));
      if (this.dark) this.lightsOn();
    } else if (this.spec.gray) {   // a found thing in a 흑백판 stays where it was, in full colour
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
    if (this.kit) kitFound(this, it);   // 프라모델: 딸깍 back into its cell · 이삿짐: a box folds · 파르페: its layer goes on
    if (this.incident && this.friendHidden && !it.friend && Math.random() < .5) setTimeout(() => !this.dead && this.hideSay(BONUS_SAY), 700);
    if ((!this.v2 || this.v2.after) && this.targets.every(t => t.found) && !this.result) this.win();   // (사건 판 too: everything, the friend and the things — 10/18)
  }
  async onChain(it) {
    const G = this.G, W = G.world;
    if (this.incident && this.friendHidden) setTimeout(() => !this.dead && this.hideSay(hidePool(this.idx, this.th.friend, 'clue')), 900);   // the host hears you find a clue
    it.found = true; this.idle = 0;
    const c = this.worldCenter(it), s = W.toScreen(c);
    W.fx.burst(s.x, s.y, { n: 18, colors: ['#ffe14d', '#ffffff', '#ffd23f'] });
    G.audio.sfx('special');
    this.hero?.react('event', c, this.tw);
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
      G.ui.toast(this.plan.chainFound?.[it.type] || DEVICE_FOUND[it.type] || (it.code === 'vacremote' ? '청소기 리모컨이다! 로봇청소기를 깨워 볼까?' : '건조대 손잡이 찾았다! 벽의 손잡이 구멍에 끼워 보자'), 'green');
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
      G.ui.toast(it.type === 'remote' ? '리모컨 획득! TV를 터치해서 켜 보자' : `${ITEMS[it.type].name} 획득! 모래밭의 빨간 X를 터치!`, 'green');
      return;
    }
    if (this.obs && await obsClue(this, it, s)) return;   // R4: the note says where to look, not the answer
    if (it.role === 'key') {
      this.keys++;
      this.keyPill.style.display = ''; this.keyPill.classList.remove('need'); this.keyPill.set(String(this.keys));
      await G.ui.flyImg(G.thumbs.item_key, s.x, s.y, this.keyPill, { size: 64 });
      G.audio.sfx('key');   // (a jingle as it lands in the pill — 사운드 세션 10/19)
      this.keyPill.classList.add('pop'); setTimeout(() => this.keyPill.classList.remove('pop'), 300);
      G.ui.toast(this.v2 ? v2KeyToast() : '열쇠 획득! 잠긴 상자를 열어봐', 'green');
      const ks = !this._keySaid && sceneAt(this.idx)?.keySay;   // (7판: why the key was in the pulley basket — 펭펭이's tip 2)
      if (ks) { this._keySaid = true; setTimeout(() => !this.dead && !this.result && this.say(this.friend, tr(ks), 2200), 400); }
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
      // 쪽지 펼치기 (noteview3d.js, ?note=3d until GPT's folded notes are in): it opens in the middle, a tap puts it in the chip;
      // the chip, tapped again, shows it open
      if (NOTE3D && !this.botOn()) {
        this.paused = true; try { await showNote3D(G, { code: it.code, x: s.x, y: s.y, pill: this.codePill }); } finally { this.paused = false; }
        if (!this.codePill._nv) { this.codePill._nv = true; this.codePill.style.pointerEvents = 'auto'; this.codePill.addEventListener('click', () => { const c = [...this.codes].pop(); if (c && !this.paused) { this.paused = true; showNote3D(G, { code: c, open: true, pill: this.codePill }).finally(() => { this.paused = false; }); } }); }
      } else
      await G.ui.flyImg(G.thumbs.item_note, s.x, s.y, this.codePill, { size: 64 });
      G.ui.toast(`비밀번호는 ${it.code}! 금고를 열어봐`, 'green');
      this.pointAt(it.forPart);
    }
  }
  // 사건 판: a clue shows where it goes — the lock it opens hops with a little sparkle, and if it is the hideout the friend
  // inside panics. Each step of the chain points at the next. (The camera used to glance at the lock when it was off screen —
  // user 10/21 on the phone: "열쇠랑 쪽지 찾으면 카메라 이동되면서 여기다 하라 보여주잖아 그거 좀 없애자. 너무 과친절이야" — now only
  // 1판's lesson does, once)
  async pointAt(part) {
    if (!this.incident || !part?.lock || this.dead) return;
    if (this.v2?.cands.includes(part)) return v2PointAll(this);   // v2: the key fits all three
    const G = this.G, W = G.world, tw = this.tw, pc = this.partCenter(part), sc = W.toScreen(pc);
    const off = !(sc.x > 30 && sc.x < W.W - 30 && sc.y > 90 && sc.y < W.H - 170);
    const keep = { target: W.target.clone(), zoom: W.zoom };
    const moved = off && this.spec.tut === 1 && !this._pointedOnce && !this.botOn() && !this.talking; if (moved) this._pointedOnce = true;
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
      this.shelfTried = true;
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
    const ok = await spinePuzzle(G, S.order, { hand: !this.spineTaught, taught: () => { this.spineTaught = true; } });
    this.paused = false; this.idle = 0;
    S.shelf.furn.spines.draw(S.order, -1);
    if (!ok || this.dead) return;
    this.cine = true; await this.tw.wait(1.15); if (this.dead) return;   // let the '무지개 완성!' card finish first
    await this.solveShowcase();
  }
  // 비밀 서재 (사용자 실폰 10/20 "무슨 도감? 뭔지 전혀 모르겠다"): the book you need waits in the pill from the start, and one
  // hand points at the gap on the shelf with the stage's goal in one line — gone once the shelf is tapped or the book found
  async teachShelf() {
    const G = this.G, S = this.plan.showcase, bk = this.items.find(i => i.role === 'book');
    const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs.item_spinebook;
    for (let i = 0; i < 60 && (G.world.flying || this.cine || this.talking) && !this.dead; i++) await this.tw.wait(.1);
    if (this.dead || this.hasBook) return;
    const gap = () => { const b = S.shelf.furn.spines?.books?.[S.order.indexOf(S.missing)]; return b ? b.getWorldPosition(new THREE.Vector3()) : this.partCenter(S.shelf); };
    await this.teach(SHELF_GOAL, 'tap', gap, () => !!this.shelfTried || !!bk?.found || !!this.hasBook, null, 12);
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
    // (12판 ② 10/23: the run's marble is the one to find — not found yet: its empty start shows, and the cupboard waits for it)
    if (S.marble && !this.gadgets.has('bluemarble')) {
      Object.assign(door, { lock: { kind: 'gadget', code: 'bluemarble' }, needItem: 'bluemarble', needMsg: '구슬 길 출발점이 비어 있어! 파란 구슬을 찾아서 올려 줘' });
      const st = door.furn.marbleStart; if (st) { const p = W.toScreen(door.furn.group.localToWorld(st.clone())); W.fx.ring(p.x, p.y, { r: 36, color: '#3d8bff', width: 5, life: .8 }); }
      G.audio.sfx('hmm'); G.ui.toast(door.needMsg, '');
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs.item_bluemarble;
      this.cine = false; return;
    }
    if (S.marble) this.gadgets.delete('bluemarble');
    await this.runMarble(door);
  }
  // the marble on the run's start (dropped in from above when it's the one you found), the run, the cupboard opens
  async runMarble(door) {
    const G = this.G, W = G.world, tw = this.tw, f = door.furn, m = f.marbleBall;
    this.cine = true;
    const nc = this.partCenter(door);
    await W.flyTo(tw, { target: new THREE.Vector3(nc.x, nc.y + .45, nc.z), zoom: Math.max(W.zoom, 2.6), dur: .4 });
    if (m && !m.visible && f.marbleStart) {
      const st = f.marbleStart; m.visible = true; G.audio.sfx('pop', 2);
      await tw.run(.35, k => { m.position.set(st.x, st.y + .35 * (1 - k) * (1 - k), st.z); });
      G.audio.sfx('clink');
    }
    await f.marbleRun(tw, (n, p) => G.audio.sfx(n, p));
    door.lock = null; this.cine = false; this.toolPill.style.display = 'none';
    await tw.wait(.15);
    if (!this.dead) await this.togglePart(door, true);
    if (!this.dead && this.scene?.cardAfter) newCard(G, this.scene.cardAfter);   // (12판: 연쇄 장치 카드는 장치가 다 움직인 뒤에 — 스토리 룸 10/20)
  }
  async freeJailed() {
    const J = this.jailed, ch = J.ch, W = this.G.world; J.in = false;
    const P = ch.root.position, t = (this.freeTiles || []).filter(q => Math.hypot(q.x - P.x, q.z - P.z) < 3).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0] || null;
    ch.setFace?.('happy'); this.say(ch, '드디어 자유다~! 범인은 그 까만 애야!', 2000); this.G.audio.sfx('special');
    if (t) { await ch.hopTo?.(this.tw, t.x, t.z, { height: .6, dur: .55 }); ch.root.position.y = t.y || 0; ch.faceTo?.(W.cam.position.x, W.cam.position.z); }
  }
  // ── 아파트 장치판: the remote wakes the robot vacuum, the crank winds the drying rack down
  async useGadget(part) {
    const G = this.G, L = part.lock;
    if (!this.gadgets.has(L.code)) {
      G.audio.sfx('locked'); this.wobble(part.furn.group);
      G.ui.toast(part.needMsg || (L.code === 'vacremote' ? '로봇청소기가 쿨쿨 자고 있어… 리모컨이 있으면 깨울 수 있을 텐데' : '손잡이가 빠져 있어! 건조대를 내릴 손잡이를 찾아봐'), 'red');
      if (part.noPill) { if (part.coldSay && this.friendHidden) this.say({ root: { position: this.partCenter(part) }, headTop: () => .25 }, part.coldSay, 1400); return; }   // (39판 ice: the heater is the way, not a tool — ② 10/23)
      const P = this.toolPill; P.style.display = ''; P.classList.add('need'); P.querySelector('.v').textContent = '?'; P.querySelector('img').src = G.thumbs['item_' + (part.needItem || (L.code === 'vacremote' ? 'vacremote' : 'crank'))];
      return;
    }
    this.gadgets.delete(L.code); this.toolPill.style.display = 'none';
    part.lock = null; this.idle = 0;
    if (part.robotVac) return this.runVacuum(part);
    if (part.secret) return this.runMarble(part);   // (12판: the blue marble on the run — ② 10/23)
    if (part.dryRack) return this.lowerRack(part);
    if (part.device) return runDevice(this, part);   // R6 장치판 (devices.js)
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
      G.ui.toast('청소기가 소파 밑에서 열쇠를 물고 나왔어! 터치해서 집어 봐', 'green');
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
  // (QA3-fb5) the door / drawer / lid of this furniture whose screen box comes within 24 px of the tap (nearest centre wins)
  partNear(furn, x, y, R = 24) {
    const W = this.G.world; let best = null, bd = Infinity;
    for (const p of furn.parts || []) {
      if (p.busy || p.isLever || p.isGadget || p.dig || p.device || p.secret || p.secretShelf || !p.pivots?.length) continue;
      const b = new THREE.Box3(); p.pivots.forEach(o => b.expandByObject(o)); if (b.isEmpty()) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const px of [b.min.x, b.max.x]) for (const py of [b.min.y, b.max.y]) for (const pz of [b.min.z, b.max.z]) { const s = W.toScreen(new THREE.Vector3(px, py, pz)); x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); }
      const out = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)); if (out > R) continue;
      const c = W.toScreen(b.getCenter(new THREE.Vector3())), d = out * 4 + Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  // (QA3-dbl6 10/19) would a tap here do nothing — the floor, a wall, empty space, a decoy, a found thing, a plain furniture
  // body? Only there does a double tap zoom (the same order of checks as tap())
  tapIdle(x, y) {
    const hit = this.pickAt(x, y);
    if (hit.kind === 'floor' || hit.kind === 'wall' || hit.kind === 'none') return true;
    if (hit.kind === 'item') return hit.item.found || (hit.item.role === 'decoy' && !this.grayAt(x, y));
    if (hit.kind !== 'furn') return false;   // a door, drawer, lid, lever, friend, the peeking tell: it answered the first tap
    const f = hit.furn, gt = this.grayTarget(f);
    if (f.type === 'puzzleframe' || f === this.plan.tv?.f || (gt && !gt.found) || this.tvAt(f)) return false;
    return !(this.lockedPartNear(f, x, y) || f.parts?.some(p => p.isLever) || this.partNear?.(f, x, y));
  }
  // ── 몽글 TV (10/19, src/mongletv.js): a TV or monitor in this room that plays (tvScreens; no bot, no TV puzzle)
  tvAt(furn) { return !!this.tvs?.has(furn); }
  // the stage stops while it's open (clock, hint sparkle, the 톡 timers: update() is paused); a win pays once a stage: +3
  // taps and the coins together (tvReward)
  async openTv(f = null) {
    const G = this.G;
    if (G.tv || this.paused || this.result || !this.running || G.ui.panelOpen || G.bot) return;
    this.paused = true; G.audio.sfx('click');
    for (const sw of this.sweeps || []) if (sw.part.tv) sw.part.t = 1;   // (found it: no more shines on the TVs)
    const pay = this.tapsLeft == null ? null : {
      state: () => this._tvPaid ? 'already' : 'gain',
      win: () => this.tvReward(),
    };
    this.tvs?.cta(false);
    await openMongleTV(G, { level: tvLevel(this.idx), game: f?.arcadeGame || this.tvGame, pay });
    if (this.dead) return;
    this.paused = false; this.idle = 0;
    if (this._tvFly) { const f = this._tvFly; this._tvFly = null; this.rewardFly(f); }
  }
  // 10판 그림 속 숨은그림 (arthunt.js, user 10/23 "전시된 그림 하나는 2D 숨은그림 찾기"): a tap on that painting opens it big; three
  // things to find in it (what's found stays found if you close it). All three: its colour comes back, it pays like 몽글 TV
  // (once a stage), and it swings open as a tap would have opened it
  async openArt(part) {
    const G = this.G;
    if (G.tv || this.paused || this.result || !this.running || G.ui.panelOpen) return;
    this.paused = true; G.audio.sfx('click');
    this._artGot = this._artGot || new Set();
    const ok = await openArtHunt(G, { key: 'stars', got: this._artGot, gray: !!this.grayFurn?.size });
    if (this.dead) return;
    this.paused = false; this.idle = 0;
    if (!ok) return;
    this._artDone = true;
    if (this.grayFurn?.size) this.colorIn(part.furn.group);
    if (this.tapsLeft != null && !this._artPaid && !this.result) {
      this._artPaid = true;
      const taps0 = this.tapsLeft, coins0 = G.save.coins || 0;
      this.tapsLeft += TV_TAPS; G.addCoins(TV_COINS); G.audio.sfx('coin');
      this.rewardFly({ taps0, taps1: this.tapsLeft, coins0, coins1: G.save.coins || coins0 + TV_COINS });
    }
    await this.tw.wait(.5); if (this.dead) return;
    this.onPart(part);
  }
  // (10/20, user on the phone: "보상 연출이 없음 — 이겨도 톡 숫자가 오르는 게 안 보여요") once the TV has closed: "+3" with the hand
  // flies into the tap count, which counts up; a coin pill pops in beside it (the stage has no coin count of its own —
  // shown only while coins come in, as 인수인계 suggested), a coin flies into it and it counts up, then it tucks away
  rewardFly({ taps0, taps1, coins0, coins1 }) {
    const G = this.G, W = G.world, p = this.tapPill, from = { x: W.W / 2, y: W.H * .45 };
    const fly = (el, to, dur = 620) => new Promise(res => {
      const r = to.getBoundingClientRect(), x1 = r.left + r.width / 2, y1 = r.top + r.height / 2;
      el.style.left = from.x + 'px'; el.style.top = from.y + 'px'; document.getElementById('app').append(el);
      const a = el.animate([{ translate: '-50% -50%', scale: 1.4, opacity: 0 }, { translate: '-50% -50%', scale: 1.5, opacity: 1, offset: .15 },
        { translate: `calc(-50% + ${x1 - from.x}px) calc(-50% + ${y1 - from.y}px)`, scale: .7, opacity: 1 }], { duration: dur, easing: 'cubic-bezier(.5, 0, .75, .4)' });
      a.onfinish = () => { el.remove(); res(); };
    });
    if (p) {
      fly(h('div', { class: 'flyrew ol' }, h('span', { class: 'ico', html: ICON.hand }), '+' + (taps1 - taps0)), p).then(() => {
        if (this.dead) return;
        p.classList.remove('pop', 'hit'); void p.offsetWidth; p.classList.add('pop'); G.audio.sfx('coin', 2);
        G.ui.countUp(p.querySelector('.v'), taps0, taps1, 450).then(() => { if (!this.dead) { p.querySelector('.v').textContent = this.tapsLeft; p.classList.toggle('need', this.tapsLeft <= 3); } });
      });
    }
    if (coins1 > coins0 && this.inv) {
      const cp = h('div', { class: 'pill coinpop', html: `<span class="ico">${ICON.coin}</span><span class="v">${coins0}</span>` });
      this.inv.append(cp);
      setTimeout(() => fly(h('div', { class: 'flyrew ol' }, h('span', { class: 'ico', html: ICON.coin }), '+' + (coins1 - coins0)), cp).then(() => {
        if (this.dead) return;
        cp.classList.add('pop'); G.audio.sfx('coin', 0);
        G.ui.countUp(cp.querySelector('.v'), coins0, coins1, 600).then(() => setTimeout(() => { cp.classList.add('out'); setTimeout(() => cp.remove(), 300); }, 900));
      }), 260);
    }
  }
  // (10/19 night, user: "그 판 이기면 돈이랑 클릭 몇 개 주기") a win pays both now: +3 taps, even past the stage's own count (a
  // full hand used to get coins instead, so one of the two was always missing), and the coins
  tvReward() {
    if (this.tapsLeft == null || this._tvPaid || this.result) return null;
    this._tvPaid = true;
    const n = TV_TAPS, taps0 = this.tapsLeft, coins0 = this.G.save.coins || 0;
    this.tapsLeft += n;
    this.G.addCoins(TV_COINS); this.G.audio.sfx('coin');
    // (the count on screen goes up when the reward flies in, after the TV has closed — rewardFly)
    this._tvFly = { taps0, taps1: this.tapsLeft, coins0, coins1: this.G.save.coins || coins0 + TV_COINS };
    return { taps: n, coins: TV_COINS };
  }
  lockedPartNear(furn, x, y) {
    const W = this.G.world; let best = null, bd = Infinity;
    for (const p of furn.parts || []) {
      if (!p.lock || p.busy || p.t > .5 || p.isLever) continue;
      const s = W.toScreen(this.partCenter(p)), d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  partCenter(part) { const b = new THREE.Box3(); (part.handle ? [part.handle] : part.pivots).forEach(p => b.expandByObject(p)); return b.getCenter(new THREE.Vector3()); }   // (a part worked by its handle: the handle — hints, the hand, the bots)
  // a part worked only from its handle (7판's pulley crank): the one whose handle is within reach of the finger, the
  // handle being small — a generous ring round it on the screen
  handlePartAt(x, y, hit) {
    const W = this.G.world, R = 44;
    for (const p of this.room.parts) {
      if (!p.handle || p.busy) continue;
      if (hit?.kind === 'part' && hit.part === p) {   // on the thing itself: the handle yes, the basket or rope no (7판's basket starts right by it)
        for (let o = hit.node; o; o = o.parent) if (o === p.handle) return p;
        continue;
      }
      const s = W.toScreen(this.partCenter(p)); if (Math.hypot(s.x - x, s.y - y) < R) return p;   // near it, on the wall or floor
    }
    return null;
  }
  // a tap on the rest of it: a little shake and a twinkle at the handle — no wrong tap, no 톡 spent
  nudgeHandle(part) {
    const W = this.G.world, s = W.toScreen(this.partCenter(part));
    this.G.audio.sfx('wobble'); this.wobble(part.pivots[0]);
    W.fx.burst(s.x, s.y, { n: 8, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 110, gravity: -30, life: .6, size: 9 });
    W.fx.ring(s.x, s.y, { r: 40, color: '#ffe14d', width: 5, life: .5 });
  }
  // (19판 10/21, 스토리 룸 lockSay: the host's hint the first time you're at a code lock — "비번은 출동 시각이야. 탁상시계를 잘 봐!")
  lockSay(L) {
    const ls = !this._lockSaid && L?.kind === 'code' && sceneAt(this.idx)?.lockSay;
    if (ls) { this._lockSaid = true; setTimeout(() => !this.dead && !this.result && this.say(this.friend, tr(ls), 2600), 300); }
  }
  async onPart(part, x, y) {
    const G = this.G, W = G.world;
    if (part.busy && part._stepRun) { const tw = this.tw.list.find(q => q.tag === part); if (tw) { tw.t = tw.dur; part._skip = true; } return; }   // (a device running its steps: a second tap plays it to the end — 장치 설계서 원칙 2)
    if (part.busy) return;
    stagingPart(this, part);   // (31판 극장: the popcorn machine overflows as it opens)
    this.idle = Math.max(0, this.idle - 4);
    if (this.spec.artHunt && part.furn?.type === this.spec.artHunt && !this._artDone && !part.t && !G.bot) return this.openArt(part);
    if (part.isLever) return this.pullLever(part);
    if (part.crossing) return stagingCrossing(this, part);
    if (part.dig && part.t > .5) return;   // dug out: nothing to fill back in
    // stuck on the same lock twice: 척척 로봇 offers to do it for coins (for players who'd rather not puzzle)
    if (part.stuck) { this.wobble(part.furn.group); G.audio.sfx('wobble'); return; }
    if (part.lock?.kind === 'spine') return this.onSpine(part);
    if (part.lock?.kind === 'gadget') return this.useGadget(part);
    if (part.isGadget) { if (part.chainVia && part.chainVia.t < .5 && part.t < .5) return this.onPart(part.chainVia, x, y); this.wobble(part.furn.group); G.audio.sfx('wobble'); return; }   // (②b: a piece the chain moves — a touch on it works its machine)
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
      if (part === this.plan.incident?.part && this.friendHidden && !this.v2) this.hideSay(hidePool(this.idx, this.th.friend, 'lock'));
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
          const f = this.friend, ls = this.story?.lines?.blocked || sceneAt(this.idx)?.lines?.blocked || ['비켜 줄 생각 없어!'];
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
        else { this.lockSay(L); G.ui.toast(L.tv ? '비밀번호가 필요해! TV에 나올지도…?' : '비밀번호가 필요해! 쪽지를 찾아봐', 'red'); this.codePill.style.display = ''; this.codePill.classList.add('need'); this.codePill.set('? ? ?'); }
        return;
      }
      if (L.kind === 'code') this.lockSay(L);
      if ((L.kind === 'code' || L.kind === 'color') && !(await lockInput(this, part))) return;   // dial it in / tap the colours yourself (R4 and every other stage — ③ 10/21)
      part.busy = true;
      const lp = part.lockMesh ? W.toScreen(part.lockMesh.getWorldPosition(new THREE.Vector3())) : { x, y };
      if (L.kind === 'pad') {
        if (!this.custom && !this.v2) this.keys--;   // a player's room has one master key for all its padlocks (v2: the key comes back too)
        this.keyPill.set(String(this.keys));
        await G.ui.flyImg(G.thumbs.item_key, this.keyPill.getBoundingClientRect().left + 20, this.keyPill.getBoundingClientRect().top + 16, { getBoundingClientRect: () => ({ left: lp.x - 1, top: lp.y - 1, width: 2, height: 2 }) }, { size: 56, dur: 300 });
        if (this.keys <= 0) this.keyPill.style.display = 'none';
        if (part.lockMesh) { await keyOpen(this, part, lp); if (this.dead) return; part.lockMesh = null; part.lock = null; part.busy = false; await this.togglePart(part); return; }
      } else if (L.kind === 'color') {
        const digits = L.code.split('');
        for (let i = 0; i < digits.length; i++) { const sk = part.sockets?.[i]; if (sk) { sk.material = sk.material.clone(); sk.material.color.set(LOCK_COLORS[+digits[i]][0]); sk.scale.setScalar(1.4); this.tw.run(.2, k => sk.scale.setScalar(1.4 - .4 * k), ease.outBack); } G.audio.sfx('pop', 3 + i * 2); await this.tw.wait(.16); }
      } else {
        const digits = L.code.split('');
        // (⑥ 10/23 GPT 자물쇠: each wheel rolls round to its digit as it is called out)
        const lm = part.lockMesh, setD = lm?.userData.setDigit;
        for (let i = 0; i < digits.length; i++) { G.ui.floatText(lp.x + (i - 1) * 26, lp.y - 20, digits[i], 'gold'); G.audio.sfx('tock'); if (setD) { const d = +digits[i]; this.tw.run(.14, k => setD(i, d * k), ease.outCubic); } await this.tw.wait(.14); }
      }
      { const op = part.lockMesh?.userData.open; if (op) await this.tw.run(.22, k => op(k), ease.outCubic); }   // (⑥ 10/23: the latch slides back before the lock comes off)
      G.audio.sfx('unlock');
      W.fx.burst(lp.x, lp.y, { n: 16, colors: ['#ffe14d', '#ffffff'] });
      if (part.lockMesh) { const m = part.lockMesh, y0 = m.position.y; await this.tw.run(.3, k => { m.position.y = y0 + k * .3; m.scale.setScalar(1 - k); }, ease.inBack); m.parent?.remove(m); part.lockMesh = null; }
      part.lock = null; part.busy = false;
      G.ui.toast('철컥! 열렸다!', 'green');
    }
    // (opening a door, drawer or lid never costs a tap, even on nothing — user, 10/18: '서랍·문 열기 공짜')
    // (was: an empty door / drawer cost a tap)
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
    const L = G.econ;   // 경제 B5 (10/19): the robot takes a magnifier (a free one first), not coins
    G.ui.panel({ title: '척척 로봇', color: 'blue', close, body: [h('div', { class: 'txt' }, L ? '막혔어? 삐빅! 돋보기 1개면 내가 대신 열어 줄게.' : `막혔어? 삐빅! 코인 ${cost}개면 내가 대신 열어 줄게.`), h('div', { class: 'txt', style: 'font-size:14px;color:#8a6a9a' }, L ? `가진 돋보기 ${lensLeft(this)}` : `가진 코인 ${G.save.coins}`)],
      buttons: [G.ui.btn(L ? '부탁해 (돋보기 1)' : `부탁해 (${cost})`, { color: 'green', onClick: () => { close(); this.robotSolve(part); } }), G.ui.btn('내가 할래', { color: 'gray', onClick: close })] });
  }
  async robotSolve(part) {
    const G = this.G, W = G.world, L = part.lock; if (!L) return;
    if (G.econ) { if (!takeLens(this)) return noLens(this); this.hintsUsed = (this.hintsUsed || 0) + 1; } else {   // 경제 B5 (10/19): one magnifier; none → the "no magnifier" sparkle, no robot (GPT QA L05: the robot's help is a hint — no ★ 힌트 없이)
    if (G.save.coins < ROBOT_COST) { G.ui.toast(`코인이 모자라! (${ROBOT_COST} 필요)`, 'red'); return; }
    G.addCoins(-ROBOT_COST);
    }
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
    this.obs?.free.add(part);   // R4: no dial for the robot
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
    // what's in the drum counts as found the moment the door opens, like digging (the drum is hard to see into)
    for (const it of part.spots.map(s => s.item).filter(i => i && !i.found)) { if (it.role === 'target') await this.onFound(it); else if (it.role !== 'decoy') await this.onChain(it); }
  }
  shakePart(part) {
    const g = part.furn.group, s0 = g.position.x;
    this.tw.run(.3, k => { g.position.x = s0 + Math.sin(k * Math.PI * 6) * (1 - k) * .04; }, ease.linear).then(() => g.position.x = s0);
  }
  // ── the dark room: night light until the switch is found
  goDark() {
    const W = this.G.world;
    this.dark = true;
    // (포근한 밤 G2 10/21: a moonlit power cut — the same starry night a step darker, not black-violet; still dim enough to want the switch)
    W.setLight(COZY_DARK.light); this.G.setBg([COZY_DARK.sky[1], COZY_DARK.sky[2]]); setSky(COZY_DARK.sky);
    // (9판 ② 10/23: no back wall free, the switch stands on a post — the toast doesn't send you to the walls)
    const post = this.plan.light?.furn?.type === 'leverpost';
    setTimeout(() => !this.dead && this.dark && this.G.ui.toast(post ? '앗, 불이 꺼져 있어! 전등 스위치를 찾아봐' : '앗, 불이 꺼져 있어! 벽에 있는 전등 스위치를 찾아봐', 'red'), 1800);
  }
  async lightsOn() {
    const G = this.G, W = G.world;
    this.dark = false;
    G.audio.sfx('unlock'); G.hitstop(.05);
    // (9판 ② 10/23: a night with a power cut — the lights come on, the night stays: the starry sky, the room bright)
    const night = this.spec.night, NL = COZY_NIGHT.light;
    const to = night ? { ...NL, amb: NL.amb * 1.2, sun: NL.sun * 1.2 } : this.th.light || null, from = { amb: W.hemi.intensity, sun: W.sun.intensity };
    if (night) { G.setBg([COZY_NIGHT.sky[1], COZY_NIGHT.sky[2]]); setSky(COZY_NIGHT.sky); } else { G.setBg(this.th.bg); setSky(this.th.sky || null); }
    await this.tw.run(.5, k => { W.setLight(to); W.hemi.intensity = from.amb + (W.hemi.intensity - from.amb) * k; W.sun.intensity = from.sun + (W.sun.intensity - from.sun) * k; });
    W.setLight(to);
    W.fx.confetti(30);
    // (9판 사용자 10/23: "켜짐과 동시에 글로우 같은, 어두울 때만 켜지는 후보정도 꺼지는 걸로" — the night glow and the dimmed sparkle
    // points were for the dark; with the lights on the room looks like any lit room, the night sky stays)
    if (W.post) { W.post.bloomOn = false; W.post.nightShade = false; }
    G.ui.toast('딸깍! 불이 켜졌다!', 'green');
    const ls = sceneAt(this.idx)?.lightSay;   // (스토리 룸 10/23: the host's word when the lights come on — 9판 "불 켜졌다! …어, 내 물건 다 보여!")
    if (ls) setTimeout(() => !this.dead && !this.result && this.say(this.friend, tr(ls), 2400), 450);
  }
  async pullLever(lv) {
    const G = this.G, W = G.world;
    if (lv.busy || lv.t > .5) { G.audio.sfx('wobble'); return; }
    await this.togglePart(lv, true);
    if (lv.isLight) { if (this.dark) await this.lightsOn(); return; }
    const target = lv.leverFor;
    if (!target?.lock) { G.ui.toast('철컥! …아무 일도 없네', ''); return; }
    G.audio.sfx('unlock'); G.hitstop(.06);
    { const op = target.lockMesh?.userData.open; if (op) await this.tw.run(.35, k => op(k), ease.linear); }   // (⑥ 10/23 GPT 자물쇠: the gate swings and the chain drops first)
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
  // the stage is won: shut whatever stands open (doors, drawers, lids, curtains — not levers, gadgets or lifts, which are a
  // puzzle's state), all together in 0.22 s with one sound; nothing open → at once, no sound
  // (list: just these — closeup.js clearParts shuts only what stands in front of someone talking, mid-stage)
  // the end of a stage also lays back what was lifted, flipped or slid (a rug, a cushion, a blanket): left up, it went
  // through the friend in the closing shot (10/20 실폰 10판 "카펫 연 채로 엔딩 나오니까 뚫리네") — not a device's part,
  // not what something still hangs from, and no slide / hatch / shutter (12판's secret bookcase, a lift's doors: the way in)
  async shutOpenParts(list = null) {
    const kinds = list ? ['door', 'drawer', 'lid', 'curtain'] : ['door', 'drawer', 'lid', 'curtain', 'lift', 'flip'];
    const W = this.G.world, open = (list || (this.room.rooms || [this.room]).flatMap(R => R.furns).flatMap(e => e.f.parts || []))
      .filter(p => !p.busy && p.t > .05 && !p.isLever && !p.isGadget && !p.device && !p.handle && p.label !== '도르래 바구니' && kinds.includes(p.kind) && !this.items.some(it => it.hang === p));   // (the pulley stays up: it is the stage's machine, 10/21)
    if (!open.length) return;
    this.G.audio.sfx('close');
    const t0 = open.map(p => p.t);
    open.forEach(p => { p.busy = true; });
    await this.tw.run(.22, k => { open.forEach((p, i) => p.setOpen(t0[i] * (1 - k))); W.shadowDirty = true; }, ease.inQuad);
    open.forEach(p => { p.busy = false; });
  }
  async togglePart(part, open = null) {
    const G = this.G, W = G.world;
    if (part.busy) return;
    const opening = open ?? part.t < .5;
    if (part.steps && !opening) return;   // (a device stays done: a tap on it once it has run does nothing)
    part.busy = true;
    if (opening) {
      part.spots.forEach(s => { if (s.itemGroup && s.item) s.itemGroup.visible = true; });
      const junk = part.reel ? reelCast(this, part) : false;   // 낚싯대 릴: this cast may bring up junk instead
      if (this.v2?.cands.includes(part)) v2OpenSound(this, part);
      else if (part.furn?.type === 'fishdock' && G.audio.reel) G.audio.reel(true, part.dur, junk ? part.reel.kind !== 'none' : part.spots.some(s => s.item && !s.item.found));   // 낚싯대 릴: its own winding (사운드 10/21)
      else if (!part.steps) G.audio.sfxPart(part, part.sfx);   // (in its material — 사운드 10/20)
      this.partsOpened++;
      // a device piece (GPT 새 맵, ② 10/22): its steps play in time over one even run — [[at, sound], …], at 0..1 along the
      // run — and a second tap skips to the end
      if (part.steps) {
        let n = 0; part._stepRun = true;
        await this.tw.run(part.dur, k => { if (part._skip) n = Math.max(n, part.steps.length - 1); while (n < part.steps.length && k >= part.steps[n][0]) G.audio.sfx(part.steps[n++][1]); part.setOpen(k); W.shadowDirty = true; }, ease.linear, 0, part);
        part._stepRun = part._skip = false;   // (skipped: only the last sound, not all of them at once)
      } else await this.tw.run(part.dur, k => { part.setOpen(k); W.shadowDirty = true; }, part.kind === 'drawer' ? ease.outBack : ease.outCubic);
      for (const it of this.items) if (it.hang === part && !it.found) this.dropHung(it, part);   // (7판: the basket came up under the hook)
      if (part._hadLock && !part._popped && !junk) { part._popped = true; await this.popOut(part); if (this.dead) return; }
      if (junk) reelSay(this, part);
      else for (const s of part.spots) if (s.item && !s.item.found) { const p = W.toScreen(this.worldCenter(s.item)); W.fx.burst(p.x, p.y, { n: 6, shape: 'star', speed: 90, gravity: -40, life: .6, size: 8 }); }
      if (this.jailed?.in && part === this.jailed.door) this.freeJailed();
      if (part.afterOpen) part.afterOpen(this);   // (a piece that sets off another once open — 18판 서랍 계단·만화책)
      const fi = part.spots.map(s => s.item).find(it => it?.friend && !it.found); if (fi) this.revealFriend(fi);
      else if (this.v2 && this.friendHidden && this.v2.cands.includes(part) && !this.r1.told.has(part)) v2Wrong(this, part);
      else if (this.r1 && this.friendHidden && this.r1.cands.includes(part) && !this.r1.told.has(part)) this.r1Wrong(part);
      else if (this.incident && this.friendHidden && part._hadLock && !part._told) { part._told = true; setTimeout(() => !this.dead && this.hideSay(hidePool(this.idx, this.th.friend, 'clue')), 500); }
      // 2판: a drawer of hers (with something in it, or only socks) — once each way
      else if (this.scene?.drawerFull && !this.incident && part.kind === 'drawer') { const full = part.spots.some(s => s.item && !s.item.found && s.item.role === 'target'), k = full ? '_dF' : '_dE'; if (!this[k]) { this[k] = true; this.say(this.friend, full ? this.scene.drawerFull : this.scene.drawerEmpty, 1400); } }
    } else {
      if (part.furn?.type === 'fishdock' && G.audio.reel) G.audio.reel(false, part.dur); else G.audio.sfxPart(part, part.kind === 'drawer' ? 'drawerClose' : 'close');
      await this.tw.run(part.dur * .8, k => { part.setOpen(1 - k); W.shadowDirty = true; }, ease.inOutQuad);
      part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; });
      if (part.reel) reelClear(this, part);
    }
    part.busy = false;
  }

  // 툭 (③ 10/22, ② 측정: a locked compartment's thing was 14 px across behind its door — 40판 돈통·세탁기, 65판 계단실, 31 실외기
  // 속, 45·49 수거함, 67 캐비닛, 70 우편함): the first time it opens, each small thing in it hops forward to the mouth of the
  // compartment (toward you, just past the piece's own body) so it sits half out and is seen. Big things stay where they are.
  async popOut(part) {
    const W = this.G.world, f = part.furn; if (!f) return;
    const its = part.spots.map(s => s.item).filter(it => it && !it.found && !it.friend && it.g);
    if (!its.length) return;
    // the piece's body without its moving parts (an open door would make the box far bigger than the compartment), in the
    // piece's own frame — its front is +z
    const moving = new Set(); for (const q of f.parts) for (const pv of q.pivots) moving.add(pv);
    const under = o => { for (let x = o; x; x = x.parent) if (moving.has(x)) return true; return false; };
    f.group.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(f.group.matrixWorld).invert(), body = new THREE.Box3();
    f.group.traverse(o => { if (o.isMesh && !o.userData.proxy && !under(o) && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); body.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv)); } });
    if (body.isEmpty()) return;
    // (5판 실폰 10/22, user: "열쇠로 상자 땄는데 상자 밖으로 꿀단지 막 튀어나온다, 경계 지고"): it slid toward the camera —
    // through the toy box's front wall. Only a piece that opens at its front (a door, a drawer) lets it come out, and only
    // straight out of that front onto the lip; a lid or a flap opens upward — the thing hops where it lies, inside
    const front = ['door', 'drawer', 'slide', 'shutter', 'curtain'].includes(part.kind);
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(f.group.matrixWorld).setY(0), cam = W.cam.position, runs = [];
    if (fwd.lengthSq() < 1e-6) return; fwd.normalize();
    for (const it of its) {
      const b = new THREE.Box3().setFromObject(it.g), c = b.getCenter(new THREE.Vector3());
      const a = W.toScreen(b.min), z = W.toScreen(b.max), px = Math.hypot(a.x - z.x, a.y - z.y);
      if (px > 40) continue;
      const g = it.g, par = g.parent; if (!par) continue;
      const w0 = g.getWorldPosition(new THREE.Vector3()), l0 = g.position.clone(), r0 = g.rotation.z;
      const up = par.worldToLocal(w0.clone().add(new THREE.Vector3(0, .1, 0))).sub(par.worldToLocal(w0.clone()));
      let l1 = l0.clone();
      if (front && fwd.dot(new THREE.Vector3(cam.x - c.x, 0, cam.z - c.z)) > 0) {
        const cl = c.clone().applyMatrix4(inv), bl = b.clone().applyMatrix4(inv), t = body.max.z - cl.z;   // (t < 0: already out — a drawer brought it)
        const half = (bl.max.z - bl.min.z) * .35, dist = Math.min(.32, Math.max(.05, t + half - .02));
        if (t > 0) l1 = par.worldToLocal(w0.clone().addScaledVector(fwd, dist));
      }
      runs.push(this.tw.run(.34, k => { g.position.lerpVectors(l0, l1, k).addScaledVector(up, Math.sin(k * Math.PI) * (front ? 1 : .8)); g.rotation.z = r0 + Math.sin(k * Math.PI) * .25; W.shadowDirty = true; }, ease.outCubic).then(() => { g.position.copy(l1); g.rotation.z = r0; }));
    }
    if (!runs.length) return;
    this.G.audio.sfx('pop', 4);
    await Promise.all(runs);
    W.idsDirty = true;
  }

  // ── hints
  // free magnifiers first; after that each one costs 60 coins and is always asked first, and nothing is spent when there
  // is nothing left to point at (Codex QA 10/17: the third tap took 60 coins without a word)
  async useHint(paid = false) {
    const G = this.G, W = G.world;
    if (!this.running || this.result || this.paused) return;
    if (!this.nextGoal(true)) { G.ui.toast('지금은 더 알려 줄 게 없어!', ''); return; }
    // 경제 B5 (10/19): a free one, else one from the bag — no coins inside a stage; none → the idle sparkle at once
    if (G.econ) { if (!lensHint(this)) return; } else {
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
    }
    G.audio.sfx('whoosh');
    if (this.v2 && await v2Hint(this)) return;   // v2: the trail → the sound and the tell → the hideout
    const goal = this.nextGoal(true);
    if (!goal) return;
    const pos = goal.pos;
    // (10/19 evening, user: "힌트 써도 카메라가 잘 안 따라가서 잘 안 보이는 경우가 많아서, 힌트 쓰면 처음 카메라 뷰로 넘어가서 알려
    // 주는 게 나을 듯") back to the stage's first view (the 처음 시점 button's view); if the thing is hidden from there, the
    // nearest turn of that view (30° steps, a little higher) that shows it
    const v = this.view0 || { yaw: Math.PI / 4, pitch: .62, zoom: this.zoom0 || 1 };
    const y00 = W.yaw, p00 = W.pitch, z00 = W.zoom, t00 = W.target.clone();
    W.target.copy(W.home); W.zoom = v.zoom || 1;
    let best = null;
    for (const p of [v.pitch, .62, 1.0, 1.15]) {
      for (let k = 0; k < 12 && !best; k++) {
        const y = v.yaw + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6;
        W.yaw = y; W.pitch = p; W.updateCam(); this.room.update(1);
        if (!W.occluded(goal.obj, pos, [this.room.group])) best = { y, p };
      }
      if (best) break;
    }
    W.yaw = y00; W.pitch = p00; W.zoom = z00; W.target.copy(t00); W.updateCam();
    await W.flyTo(this.tw, { yaw: best ? best.y : v.yaw, pitch: best ? best.p : v.pitch, zoom: v.zoom || 1, target: W.home.clone(), dur: .6 });
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
      if (it.hang && it.hang.t < .5) return cand.push({ kind: 'part', part: it.hang, obj: it.hang.handle || it.hang.pivots[0], pos: this.partCenter(it.hang) });   // (7판: the way to the hanging key is the pulley)
      if (it.under) return cand.push({ kind: 'part', part: it.under, obj: it.under.handle || it.under.pivots?.[0] || it.under.furn.group, pos: this.partCenter(it.under) });   // (27판: the key in the roof hat — the way to it is the crossing)
      if (it.vacHidden) {   // still under the sofa: the way to it is the robot vacuum (and its remote)
        const vac = this.plan.showcase?.vac; if (!vac?.lock) return;
        if (this.gadgets.has(vac.lock.code)) return cand.push({ kind: 'part', part: vac, obj: vac.pivots[0], pos: this.partCenter(vac) });
        const rc = this.items.find(c => !c.found && c.forPart === vac);
        return rc && depth < 5 ? addItemGoal(rc, depth + 1) : undefined;
      }
      const part = (it.spot.part?.t < .5 && it.spot.part.chainVia) || it.spot.part;   // (②b: a piece the chain moves by itself — the way in is its machine)
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
          const cv = part.clueVia; if (cv && cv.t < .5) { const g = cv.lock && !this.canOpen(cv) && this.items.find(c => !c.found && c.forPart === cv); return g && depth < 5 ? addItemGoal(g, depth + 1) : cand.push({ kind: 'part', part: cv, obj: cv.pivots[0], pos: this.partCenter(cv) }); }   // (②b: the code shows when that switch is on — 36판 가로등 그림자)
          return;
        }
        return cand.push({ kind: 'part', part, obj: part.pivots[0], pos: this.partCenter(part) });
      }
      cand.push({ kind: 'item', item: it, obj: it.g, pos: this.worldCenter(it) });
    };
    const sw = this.plan.light;
    if (this.dark && sw && sw.t < .5) return { kind: 'part', part: sw, obj: sw.furn.group, pos: this.partCenter(sw) };
    const li = this.dark && this.plan.lightItem && this.targets.find(t => t.lightSwitch && !t.found);   // (9판: in the dark the switch first)
    if (li) return { kind: 'item', item: li, obj: li.g, pos: this.worldCenter(li) };
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
    if (!await step('한 손가락으로 드래그하면 이동! 쓱 드래그해 봐', 'swipe', { x: innerWidth / 2, y: innerHeight * .58 }, () => pan > 160)) return;
    this.rotAccum = 0;
    if (!await step('이번엔 돌려 보자! ↻ 회전을 터치하거나, 드래그 중에 다른 손가락으로 터치!', 'tap', at(mt), () => W.eBase === 'turn' || this.rotAccum > .3, 30, mb)) return;
    if (W.eBase === 'turn' && !await step('이제 드래그하면 방이 빙글! 손을 떼도 회전 그대로야', 'swipe', { x: innerWidth / 2, y: innerHeight * .58 }, () => this.rotAccum > 1.0)) return;
    if (W.eBase === 'turn' && !await step('다시 움직이려면 ✥ 이동을 터치!', 'tap', at(mm), () => W.eBase === 'move', 12, mb)) return;
    const z0 = W.zoom, gauge = document.querySelector('.zgauge');
    if (!await step('두 손가락을 벌리면 확대! 오른쪽 막대로도 돼', 'tap', at(gauge), () => Math.abs(W.zoom / z0 - 1) > .15, 14, gauge)) return;
    W.onPan = null;
    if (this.result || this.dead) return;
    this.tutStep = 2;
    const tip2 = h('div', { class: 'tip', style: top }, '좋아! 이제 숨은 물건을 찾아서 터치!');
    const hand2 = h('div', { class: 'hand tap', html: ICON.hand });
    ui.tut.append(tip2, hand2); this.tutEls = [tip2, hand2]; this.tutHand = hand2;
  }
  // ── 1판 (대본 10/18, GPT 첫판 안): one thing to do at a time, each only once it's needed, done only when it's really
  // done — never because time passed. Stuck for a while: the line says more and the spot rings.
  // extra: more marks drawn with this lesson and gone with it (the drag-then-tap lesson's fixed tap circle)
  async teach(text, cls, posFn, done, more = null, maxT = 0, extra = null) {
    const G = this.G, W = G.world, ui = G.ui;
    const over = () => this.dead || !!this.result || this.botOn();
    // one hand at a time (user 10/20 on the phone: 2판 showed the turn lesson's hand and the drawer's "open here" hand
    // together — the drawer lesson didn't wait): a lesson waits until the one on screen is done; done by then → none at all
    // (and a breath after the last one: two lessons back to back read as one long list of instructions — user 10/20)
    // (QA9 P3: one wait for both — a lesson that came up during the breath (?tilt=1) used to be missed and two showed at once)
    while (!over() && (this.tutEls || (this.t - (this._tutEnd ?? -9) < 1.5 && !done()))) await this.tw.wait(.2);
    if (over()) return false;
    if (done()) return true;
    const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, text);
    const hand = h('div', { class: 'hand ' + cls, html: ICON.hand });
    const more$ = extra ? [].concat(extra(posFn)) : [];
    ui.tut.append(tip, ...more$, hand); this.tutEls = [tip, hand, ...more$]; this.tutHand = hand; this.tutHandPos = posFn;
    const t0 = this.t; let said = false, ringT = 0;
    let gaveUp = false;
    while (!over() && !done()) {
      const dt = this.t - t0;
      if (maxT && dt > maxT) { gaveUp = true; break; }   // (a lesson that may end by itself: no chime then)
      if (!said && dt > 18 && more) { said = true; tip.textContent = tr(more); }   // (8 → 18 s — 검토 재검토 4)
      if (dt > 18 && this.t - ringT > 2) { ringT = this.t; const p = posFn?.(); if (p) { const s = p.sx != null ? { x: p.sx, y: p.sy } : W.toScreen(p); W.fx.ring(s.x, s.y, { r: dt > 16 ? 110 : 70, color: '#ffe14d', width: 7 }); } }
      await this.tw.wait(.1);
    }
    tip.remove(); hand.remove(); more$.forEach(e => e.remove()); this.tutEls = null; this.tutHand = null; this.tutHandPos = null; this._tutEnd = this.t;
    if (over() || gaveUp) return false;
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
    const mid = () => ({ sx: innerWidth / 2, sy: innerHeight * .58 }), pitch0 = W.pitch;
    // (the donut lesson is gone — 검토 H3 / user: "너무 친절함 튜토가"; the donut still lies there and still answers a tap)
    // ① 이동 먼저 (user 10/19: "이동하는 방법 알려 줘야 함, 회전 방법 전에"): a hand drags across the room, done once the view has
    // moved a little. It is the move lesson (tut.move — 6판's teachMove reminder then stays away); the first time only
    if (W.scheme === 'F' && !G.save.tut?.move) {
      // (user 10/21, 튜토 개선: "화면을 실제로 움직인 명확한 드래그 한 번이면 이동 안내를 완료") one drag that clearly moved the view —
      // let go after ~40 px — is enough; no adding up to a total while the view has plainly moved
      let pan = 0, live = true; const prev = W.onPan;
      W.onPan = d => { prev?.(d); if (live) pan += Math.abs(d) || 0; };
      const ok = await this.teach(DO.move, 'swipe', mid, () => (pan > 40 && !W.ptrs?.size) || pan > 140);
      live = false;
      if (!ok) return;
      (G.save.tut || (G.save.tut = {})).move = 1; G.persist?.();
    }
    // ② the box shook, but that's its back: turn the room until its front shows
    // (user 10/21: "처음부터 회전하는 목적을 알려준다 — 상자 앞쪽을 보자!", one hand on the dial showing the way; done when the box's
    // front really shows; skipped once the box is open or the friend found)
    const turnDone = () => front() || !!this.friendItem?.found || box.t > .5;
    const dial = W.turnDial instanceof Element ? W.turnDial : W.turnDial?.el || document.querySelector('.turndial');
    // 튜토리얼 B (user 10/25: "처음에 이동, 이동 중 터치 설명하고 돌림판 설명"): ② the drag + touch lesson (teachftap — three beats,
    // a caption box each, then your turn), ③ the dial below. If ② already brought the box's front round, the dial gets one
    // line of its own — done once it's pushed a little (or 12 s)
    if (TUT_B && W.scheme === 'F' && !this.botOn()) {
      // (② 10/26: the one line, no three-beat play — user "한 문장 나오는 튜토가 바로 나와야")
      await turnLine1(this);
      if (this.dead || this.result) return;
      if (turnDone() && dial && !this.friendItem?.found) {
        let dl = 0; const prevR = W.onRotate; W.onRotate = d => { prevR?.(d); if (W._tdHeld) dl += Math.abs(d) || 0; };
        await this.teach(TUTB_TXT.dial, 'dialr', () => at(dial), () => dl > .5, null, 12);
      }
    }
    if (!turnDone()) {
      // 기본 조작 F (조작감 세션 10/18): one finger always moves; the turn dial bottom right turns the room (or a two-finger twist)
      if (W.scheme === 'F' && dial) {
        // (user 10/19: "오른쪽으로 돌리라고 손가락 나와야 할 듯") the hand presses on the dial and pushes it the way that shows the
        // box's front soonest (measured 10/19: today's box needs 60° one way, 155° the other) — pushing right turns the view
        // to a smaller yaw (dialr), pushing left to a larger one (diall)
        const way = s => { const c = this.tail.front; for (let d = 5; d <= 180; d += 5) { const y = W.yaw + s * d / 57.3; if (Math.sin(y) * c.x + Math.cos(y) * c.z > .35) return d; } return 999; };
        if (!await this.teach(DO.turnFront, way(-1) <= way(1) ? 'dialr' : 'diall', () => at(dial), turnDone, DO.turnDial2)) return;
        // (tilting is taught in 2판 now, at the thing on the loft — 검토 H3; the dial's ‹ › ˄ ˅ arrows still hint it)
      }
      else if (W.scheme === 'E' && !W.joyOn) {
        const mt = W.modeBadge?.querySelector('.mt');
        if (W.eBase !== 'turn' && !await this.teach(DO.turnBadge, 'tap', () => at(mt), () => W.eBase === 'turn' || front(), DO.turnBadge2)) return;
        if (!front() && !await this.teach(DO.turnDrag, 'swipe', mid, front, DO.turnDrag2)) return;
      } else if (!await this.teach(DO.turnFront, 'swipe', mid, turnDone, DO.turnDrag2)) return;
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
    const tip = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, G.world.scheme === 'E' ? '드래그하면 이동! 드래그 중에 다른 손가락으로 터치하면 회전으로 바뀌어!' : G.world.scheme === 'D' ? '한 손가락으로 드래그하면 방이 돌아가! (누른 곳을 중심으로)' : G.world.scheme === 'B' ? '터치하고 바로 드래그하면 방이 돌아가! (옆으로·위아래로)' : G.world.scheme === 'C' ? '오른쪽 아래 스위치가 ↻ 회전일 때 옆으로 드래그하면 방이 돌아가!' : '한 손가락으로 옆으로 드래그해서 방을 돌려봐!');
    const hand = h('div', { class: 'hand swipe', html: ICON.hand, style: `left:${innerWidth / 2}px;top:${innerHeight * .58}px` });
    ui.tut.append(tip, hand);
    this.tutEls = [tip, hand];
    while (this.rotAccum < 1.0 && !this.dead && !this.botOn()) await this.tw.wait(.1);
    this.tutEls.forEach(e => e.remove());
    if (this.dead) return;
    G.audio.sfx('special');
    this.tutStep = 2;
    const tip2 = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` }, G.world.scheme === 'E' ? '숨은 물건을 찾아서 터치! (두 손가락 벌리면 확대)' : G.world.scheme === 'D' ? '숨은 물건을 찾아서 터치! (오른쪽 아래 패드로 이동 · 게이지나 두 손가락으로 확대)' : G.world.scheme === 'B' ? '숨은 물건을 찾아서 터치! (드래그하면 이동 · 터치하고 드래그하면 회전 · 오른쪽 게이지로 확대)' : G.world.scheme === 'C' ? '숨은 물건을 찾아서 터치! (스위치로 회전↔이동 · 벌리거나 두 번 터치하면 확대)' : '숨은 물건을 찾아서 터치! (두 손가락으로 드래그하면 이동 · 벌리면 확대)');
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
    const shut = t => !t.found && t.spot.part && t.spot.part.t < .5;
    const order = [...this.targets.filter(t => shut(t) && t.spot.part.kind === 'drawer'), ...this.targets.filter(t => shut(t) && t.spot.furn?.type !== 'futon'), ...this.targets.filter(shut)];   // (a real drawer first; not the curtained loft's quilt)
    if (!order.length) return;
    // (외부 QA 10/20 LEVEL-20261020-01) the hand goes only where a tap really opens it: a spot on the part that the tap's own
    // pick lands on, on screen and clear of the HUD — the first such of the list above (2판's toy chest lid sat behind the loft
    // from the opening view and the hand pointed at the loft). Nothing tappable from this view yet: look again as the view moves
    const W = this.G.world;
    const tapSpot = part => {
      const b = new THREE.Box3(); (part.handle ? [part.handle] : part.pivots).forEach(o => b.expandByObject(o)); if (b.isEmpty()) return null;
      const c = b.getCenter(new THREE.Vector3()), q = new THREE.Vector3();
      for (const [fx, fy, fz] of [[.5, .5, .5], [.5, .75, .5], [.5, .25, .5], [.25, .5, .5], [.75, .5, .5], [.5, .5, .25], [.5, .5, .75]]) {
        q.set(b.min.x + (b.max.x - b.min.x) * fx, b.min.y + (b.max.y - b.min.y) * fy, b.min.z + (b.max.z - b.min.z) * fz); if (fx === .5 && fy === .5 && fz === .5) q.copy(c);
        const s = W.toScreen(q);
        if (s.x < 24 || s.x > W.W - 24 || s.y < 110 || s.y > W.H - 170) continue;
        const hit = this.pickAt(s.x, s.y);
        if (hit.kind === 'part' && hit.part === part) return { sx: s.x, sy: s.y };
      }
      return null;
    };
    const t0 = this.t;
    let g = null, spot = null;
    while (!this.dead && !this.result && this.partsOpened === 0 && this.t - t0 < 30) {
      for (const t of order) { if (!shut(t)) continue; const sp = tapSpot(t.spot.part); if (sp) { g = t; spot = sp; break; } }
      if (g) break;
      await this.tw.wait(.5);
    }
    if (!g || this.dead || this.result || this.partsOpened > 0) return;
    // the words name what the hand points at (검토 2차 1: it said 서랍 over 2판's curtain), and the lesson ends by itself
    // after 30 s or once that thing is found, so the loft's tilt lesson isn't kept waiting behind it (검토 2차 2)
    const part = g.spot.part, k = part.kind;
    const say = k === 'drawer' ? DO.drawer : k === 'curtain' ? '커튼을 터치해서 열어봐' : k === 'door' ? '문을 터치해서 열어봐' : k === 'lid' ? '뚜껑을 터치해서 열어봐' : '터치해서 들춰 봐';   // (the user's 말투, 10/21 튜토 개선 — ⑤)
    // (the spot is looked for again now and then as the view moves; hidden from this view → the hand waits out of sight)
    let at0 = this.t;
    const at = () => { if (this.t - at0 > .25) { at0 = this.t; spot = tapSpot(part); if (this.tutHand) this.tutHand.style.visibility = spot ? '' : 'hidden'; } return spot; };
    await this.teach(say, 'tap', at, () => this.partsOpened > 0 || part.t > .5 || g.found, k === 'drawer' ? DO.drawer2 : '닫힌 곳을 터치! 안에 물건이 숨어 있어', 30);
  }
  // 2판: tilting, moved here from 1판 (검토 H3) — only if the thing on the loft futon is still there a while later, once
  async teachTilt() {
    const G = this.G, W = G.world;
    if (W.scheme !== 'F' || G.save.tut?.tilt) return;
    const loft = this.targets.find(t => !t.found && t.spot.furn?.type === 'futon'); if (!loft) return;
    await this.tw.wait(14);
    // not over the drawer lesson (it ends by itself now), and not while the dial is hidden — that used to end this lesson
    // for good, silently (검토 2차 2)
    let r = null;
    while (!this.dead && !this.result && !loft.found) {
      if (!this.tutEls) { r = document.querySelector('.turndial.on')?.getBoundingClientRect(); if (r?.width) break; }
      await this.tw.wait(.5);
    }
    if (this.dead || this.result || loft.found || !r?.width) return;
    const p1 = W.pitch;
    if (!await this.teach(DO.tilt, 'vswipe', () => ({ sx: r.left + r.width / 2, sy: r.top + r.height / 2 }), () => loft.found || Math.abs(W.pitch - p1) > .2, DO.tilt2)) return;   // (QA9: not done — the stage ended — is not learnt)
    (G.save.tut || (G.save.tut = {})).tilt = 1; G.persist();
  }
  // 미술관 (the first wide room): not moved around after a while → how to, once
  teachMove() {
    const G = this.G, W = G.world; let pan = 0; const prev = W.onPan;
    W.onPan = d => { pan += Math.abs(d) || 0; prev?.(d); };
    // (kept, so leaving the stage clears it: pending, it held the whole stage — room, canvases — 12 s into the next scene, QA 10/20)
    this._moveT = setTimeout(() => { if (this.dead || this.result) return; (G.save.tut || (G.save.tut = {})).move = 1; G.persist(); if (pan < 80) G.ui.toast(W.scheme === 'E' && W.eBase === 'turn' ? DO.moveE : DO.move, 'green'); }, 12000);
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
    this.say(f, this.story?.lines?.fed || sceneAt(this.idx)?.lines?.fed || '냠냠! 고마워!', 1600);
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
    G.ui.toast(`비밀 아이템 발견! ${ITEMS[it.type].name}`, 'green');
  }

  // 장 카드 E (UI 세션 10/21, user: "주인공만 3d로 나오는 안 … 인사하는 느낌으로" → "오 바뀐 거 좋네"): under the chapter card the
  // camera comes down to the room's own 몽글이, who turns to you, hops and says hi; cineBye flies back to the stage's framing
  async cineHello() {
    const G = this.G, W = G.world, h = this.hero; if (!h) return;
    const m = h.ch; h.on = false;
    const back = this._helloBack = { target: W.target.clone(), yaw: W.yaw, pitch: W.pitch, zoom: W.zoom };
    const T = m.root.getWorldPosition(new THREE.Vector3()); T.y += 1;
    W.flyTo(this.tw, { target: T, zoom: 2.5, ...this.helloView(m, T, back), dur: .6 });
    await this.tw.wait(.65); if (this.dead || this.hero !== h || this._helloBack !== back) return;   // (tapped through the card already: cineBye has the camera)
    const c = W.cam.position; m.faceTo(c.x, c.z); m.pose = 'wave'; m.setFace?.('happy'); m.bump(.45);
    G.audio.sfx('pop', 2);
    this._helloSay = this.say(m, '안녕!', 2200);
  }
  // the turn and tilt the hello sees 몽글이 best from (③ 10/21: 32판's counter hid all but its ears, 50·61판 a lamp post and a
  // monitor half its face): the start turn first, a higher tilt, then the turns beside it — closeup.js covered()
  helloView(m, T, back) {
    const W = this.G.world, R = this.room, p0 = Math.max(.36, W.minPitch || 0);
    let best = null;
    for (const d of [0, Math.PI / 8, -Math.PI / 8, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      for (const pitch of [p0, .55]) {
        W.yaw = back.yaw + d; W.pitch = pitch; W.zoom = 2.5; W.target.copy(T); W.updateCam(); R?.update?.(1); W.root.updateMatrixWorld(true);
        const n = covered(W, m);
        if (!best || n < best.n) best = { yaw: W.yaw, pitch, n };
        if (!n) break;
      }
      if (!best.n) break;
    }
    W.yaw = back.yaw; W.pitch = back.pitch; W.zoom = back.zoom; W.target.copy(back.target); W.updateCam(); R?.update?.(1);
    return { yaw: best.yaw, pitch: best.pitch };
  }
  async cineBye() {
    const b = this._helloBack, h = this.hero; if (!b) return;
    this._helloBack = null;
    this._helloSay?.kill(); this._helloSay = null;   // (the bubble is placed once: left up, it hung in mid-air as the camera flew back)
    if (h) { h.ch.pose = 'idle'; h.ch.setFace?.('normal'); h.on = true; }
    await this.G.world.flyTo(this.tw, { ...b, dur: .5 });
  }
  frameCamera() {
    const W = this.G.world, R = this.room;
    const big = R.rooms ? R : null, rw = R.w, rd = R.d;
    const c = big ? big.center : new THREE.Vector3(0, 0, 0), floors = big ? big.levels.length : 1;
    const span = (rw + rd) / Math.SQRT2 + .5;                       // iso width of the footprint
    // big maps: show most of it, pan for the rest · bleed rooms (floor running on past the walls): fill the screen
    const bleed = !big && R.L?.bleed, fitW = R.L?.fitW || (bleed ? span * .6 : R.L?.fitAll ? Math.min(span * .98, 11) : Math.min(span, 8.6)), tall = (floors - 1) * FLOOR_H;   // fitAll: a whole house in one look
    W.home.set(c.x, big ? (big.levels[0] * FLOOR_H + tall / 2 + .75) : .75, c.z); W.target.copy(W.home);
    if (R.L?.homeShift) { W.home.x += R.L.homeShift[0]; W.home.z += R.L.homeShift[1]; W.target.copy(W.home); }   // (a room whose key pieces sit to one side — 18판 너굴이네 오락기)
    W.yaw = R.L?.yaw ?? Math.PI / 4; W.pitch = floors > 1 ? .5 : .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0;   // (L.yaw: a room seen from its own side — 28판 기차 객실 2차)
    // (레벨 세션 10/19) 폰 세로에서 넓은 맵(두 방·두세 층)은 물건이 앞 판의 절반 크기(21~34px)로 보였어요 — 그 판은 조금 당겨서 시작
    if (this.spec.zoom && W.H > W.W) W.zoom = this.spec.zoom;
    this.zoom0 = W.zoom;   // ('처음 시점' 버튼의 기준 줌: 판이 시작되기 전(제목·상자 연출)에도 당긴 줌을 '움직임'으로 보지 않게)
    W.flying = false;   // (앞 판이 카메라를 날리는 도중에 끝나면(조립 카메라·힌트·열쇠 길 안내 중 나가기) 그 tween이 버려져 flying이 true로 남고, 다음 판 톡이 전부 무시돼요 — 레벨 세션 10/19)
    W.bounds = Math.max(2.4, Math.max(rw, rd) * .48); W.minZoom = .85; W.maxZoom = 8 + (span > 9 ? 2 : 0); W.minPitch = .06; W.maxPitch = 1.45;   // a little room past the edges
    const extra = Math.max(0, span - fitW) / 2;
    W.slack = extra > 0 ? { x: extra * .9, z: extra * .9 } : null;
    W.mapBox = undefined;   // (QA3-cam8) the move box is this map: measured from its floor the first time it is needed
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
    // (where the host really stands: the layout's spot is moved off furniture first — 겹침 QA 10/19)
    const fa = this.guard ? [99, 99] : this.friend ? [this.friend.root.position.x, this.friend.root.position.z] : (this.layout.friendAt || [1.6, 1.6]);
    const free = [];
    for (const R of rooms) {
      const occ = R.occupied(), o = R.group.position;
      for (let j = 0; j < R.d; j++) for (let i = 0; i < R.w; i++) {
        if (occ.has(i + ',' + j)) continue;
        const x = o.x + i - R.w / 2 + .5, z = o.z + j - R.d / 2 + .5;
        if (!R.clearAt(x, z, .4)) continue;   // a free tile next to a bin can still be too tight for a body
        if (this.sides && !offWall(this.sides, x, o.y, z)) continue;   // (nor hugging a wall, a cliff, a hedge)
        if (Math.hypot(x - fa[0], z - fa[1]) < 1.25) continue;   // (⑪ 10/24 61·69판: a walker a metre from the host stood into it from the camera's side)
        free.push({ i, j, x, z, y: o.y, R });
      }
    }
    this.freeTiles = free.slice().sort((a, b) => Math.hypot(a.x - 1.6, a.z - 1.6) - Math.hypot(b.x - 1.6, b.z - 1.6));
    this.walkTiles = free;   // (the walkers' own list: blockTile takes a tile out of it)
    if (sp.gray && !this.custom && free.length) {
      const t = free.slice().sort((a, b) => Math.hypot(a.x - fa[0], a.z - fa[1]) - Math.hypot(b.x - fa[0], b.z - fa[1]))[0];
      const ch = new Char('inky'); ch.root.position.set(t.x, t.y || 0, t.z); ch.root.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z); W.root.add(ch.root);
      const n = this.villain = { ch, t, next: null, on: true, rest: 4 }; this.npcs.push(n);
      // 먹물이 숨기 (스토리 룸 10/19): on the stages the script names it hides instead of standing about, and is the list's
      // last thing to find ("들켰다" is true at last); where it hides is chosen once the camera is framed (hideInky)
      const hl = this.preview ? 0 : inkyHide(this.idx);
      if (hl) { n.on = false; n.hide = hl; ch._inky = true; this.inkyIt = { type: 'inky', role: 'target', inky: true, g: ch.root, spot: { kind: 'on', label: '???', part: null }, found: false, thumb: this.G.thumbs.face_inky }; this.targets.push(this.inkyIt); }
      else this.npcLoop(n, free);
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
    // (not the friend peeking from behind something later, nor the friend you bring: 19판 곰돌이, 26판 투덜이 stood there twice — 겹침 QA 10/19)
    const peek = this.hunt ? cameoKind(this.idx) : null, buddy = this.G.save.hero;
    const pool = (NPC_POOL[sp.region] || NPC_POOL.home).filter(k => k !== this.th.friend && k !== peek && k !== buddy && CHAR_DEFS[k]);
    const taken = new Set();
    for (let k = 0; k < want && pool.length; k++) {
      const kind = pool[(seed + k * 3) % pool.length]; pool.splice(pool.indexOf(kind), 1);
      // (a tile still clear now — 33판 user 10/24 "쿨냥이 박스 뚫음": a pile of boxes put down after the tiles were counted had a
      // walker standing in its middle; the same check as each step of the walk)
      const opts = free.filter(t => !taken.has(t) && (!t.R?.clearAt || t.R.clearAt(t.x, t.z, .3))); if (!opts.length) break;
      const t = opts[(seed * 7 + k * 5) % opts.length]; taken.add(t);
      const ch = new Char(kind);
      ch.root.position.set(t.x, t.y || 0, t.z);
      ch.root.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z);
      W.root.add(ch.root);
      const n = { ch, t, next: null, on: true, rest: 3 + k * 1.5 };   // (QA3-npc12: a few seconds still once the stage starts)
      this.npcs.push(n);
      this.npcLoop(n, free);
    }
  }
  async npcLoop(n, free) {
    const tw = this.tw, ch = n.ch, W = this.G.world;
    while (n.on && !this.dead) {
      await tw.wait(.25);
      if (!n.on || this.dead) return;
      // (QA3-npc12 10/19, user: "처음 맵 나올 때 캐릭터들 막 샤샤샤 나오는데") nobody wanders before the stage has started
      if (ch.reacting || this.paused || this.result || this.talking || !this.running) continue;   // everyone holds still while a talk is filmed
      n.rest -= .25; if (n.rest > 0) continue;
      // (10/19 user: "어이없이 겹친 거" — a walker stepped onto 몽글이, who stays put since v144) not within .75 m of 몽글이, the friend
      // you brought or the host
      const bodies = [this.hero?.ch, this.hero?.buddy, this.friend?.root.visible ? this.friend : null, this.cameo?.ch, this.villain?.hide ? this.villain.ch : null].filter(Boolean).map(c => c.root.position);   // (and the peeking friend, 먹물이 in hiding — 겹침 QA 10/19: 13판 a walker .35 m from the peeker)
      const nb = free.filter(t => t.R === n.t.R && Math.abs(t.i - n.t.i) + Math.abs(t.j - n.t.j) === 1 && !this.npcs.some(o => o !== n && (o.t === t || o.next === t))
        && !bodies.some(b => Math.hypot(b.x - t.x, b.z - t.z) < 1)
        && t.R.clearAt((t.x + n.t.x) / 2, (t.z + n.t.z) / 2, .32) && t.R.clearAt(t.x, t.z, .3));   // and the way between is clear too, and the tile itself
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
    this.G.audio.sfx('pop', 6); /* (no '특수 선글라스 착용!' toast: the 흑백판 opening now says why — 스토리 C안 10/18) */
  }
  // the 흑백판 owner needles you: not too often, never over another bubble of theirs
  taunt(kind) {
    if (!this.spec.gray || this.custom || this.result || !this.running || this.t - (this._tauntAt ?? -99) < (kind === 'idle' ? 12 : 5)) return;
    // 대본: 먹물이's needling changes over the story (a voice → caught again → quiet → hints); the owner keeps the old ones
    const ih = this.inkyIt; if (ih && (ih.found || (kind !== 'idle' && kind !== 'miss'))) return;   // (숨은 먹물이: a giggle from the hideout is the hint)
    const L = (this.villain && inkyTaunt(this.idx, kind)) || TAUNT[kind]; if (!L) return;
    this._tauntAt = this.t; this._tn = (this._tn || 0) + 1;
    this.say(this.villain?.ch || this.friend, L[(this._tn * 7 + (this.idx | 0)) % L.length], 1700);   // 먹물이 does the needling when it's here
  }
  // who is talking, held still (user 10/20 on a phone: "말풍선이 누가 말하는지 모르겠고, 움직여서 정신없다" — "말풍선 앞에 얼굴
  // 박아서 고정"): a word or two stays where it popped up over the speaker's head; a line goes in one caption above the tray,
  // the speaker's face and name first, replaced by the next line — never two at once (2D UI 정리 ⑯)
  // 1~3판 한 번에 하나만 (② 10/26, user on the phone: "말풍선이니 뭐니 너무 뭐가 많이 뜨는 거 같아 … 정신이 없다"): while a lesson is on
  // screen (1판: until its four lines are done) or another line/toast is still showing, a passing line (a giggle, a hint, a 'got it!')
  // is left out; the lesson's own lines (sayNow) take the place of whatever was showing
  hushed() {
    if (this.idx > 2 || this.custom || this.preview) return false;
    if ((this.spec.tut === 1 && this.tutStep !== 3) || this.tutEls || this.frogLesson) return true;
    return performance.now() < (this._talkUntil || 0) || !!document.querySelector('.ncard, .ncard-mini');
  }
  sayNow(ch, text, ms = 1200, name) { this._lastSay?.kill?.(); this._talkUntil = 0; return this.say(ch, text, ms, name, true); }
  say(ch, text, ms = 1200, name, force = false) {
    if (!force && this.hushed()) return { el: null, kill: () => {} };
    if (this.idx <= 2) this._talkUntil = performance.now() + ms + 250;
    const r = this._say(ch, text, ms, name); if (this.idx <= 2) this._lastSay = r; return r;
  }
  _say(ch, text, ms = 1200, name) {
    this.G.audio.voice?.(text, ch?.kind);   // (목소리 — 10/20)
    const t = String(tr(text) || ''), short = t.replace(/\s/g, '').length <= (/[가-힣]/.test(t) ? 6 : 12);
    if (!short && this.col) return this.subline(ch, text, ms, name);
    const b = h('div', { class: 'bubble pop' }, text);
    this.G.ui.wui.append(b);
    // (over the head in the world — 19판 user 10/24 "멍멍이랑 말풍선 떨어져 있음": a friend inside a piece of furniture, like the dog in
    // its doghouse, has a position of its own inside that piece, and read as a place in the room the bubble sat far off)
    // (a spot-only caller passes { root: { position } } — no matrices there, so its position is already the world place)
    const real = typeof ch.root.updateWorldMatrix === 'function';
    if (real) ch.root.updateWorldMatrix(true, false);
    const wp = real ? ch.root.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3().copy(ch.root.position);
    const up = real && ch.root.parent ? ch.root.parent.getWorldScale(new THREE.Vector3()).y : 1;
    const p = this.G.world.toScreen(wp.setY(wp.y + (ch.headTop?.() ?? 0) * up + .2));
    b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px';   // (placed once — ui.js keepIn keeps it inside the screen)
    const kill = () => b.remove();
    setTimeout(kill, ms);
    return { el: b, kill };
  }
  // a picture in the list, big for a moment (user 10/20: "칸 아이콘이 작게 느껴질 때가 있다") — as its slot shows it (a 흑백
  // shape stays a shape, a grey one grey), its name under it; tapping it again or a moment closes it; the stage counts nothing
  peek(it, s) {
    if (this._peek?.isConnected && this._peek.slot === s) { this._peek.remove(); this._peek = null; return; }
    this._peek?.remove();
    const sil = s.classList.contains('sil'), gray = this.tray.classList.contains('grayst') && !s.classList.contains('found');
    const name = sil ? '' : it.friend ? (CHAR_DEFS[this.th.friend]?.name || '') : (ITEMS[it.type]?.name || '');
    const p = this._peek = h('div', { class: 'peek' + (sil ? ' sil' : '') + (gray ? ' gray' : '') }, h('img', { src: s.querySelector('img')?.src || '' }), name ? h('b', {}, name) : '');
    p.slot = s; this.col.append(p);
    const r = s.getBoundingClientRect(), cr = this.col.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.getElementById('hud')).zoom) || 1;
    p.style.left = Math.max(90, Math.min(cr.width / z - 90, (r.left + r.width / 2 - cr.left) / z)) + 'px';
    clearTimeout(this._peekT); this._peekT = setTimeout(() => { if (this._peek === p) { p.remove(); this._peek = null; } }, 1300);
    this.G.audio.sfx('btn');
  }
  subline(ch, text, ms, name) {
    const G = this.G, k = ch?.kind || this.th.friend, face = G.thumbs['face_' + k];
    // (외부 3차 QA 10/20 ST78-CAPTION-EARLY-NAME) the line's own name first; 먹물이 is ??? until it has said its name (64판)
    const who = name ?? (k === 'inky' && !inkyNamed(G.save) ? '???' : CHAR_DEFS[k]?.name);
    let s = this._sub;
    if (!s?.isConnected) { s = this._sub = h('div', { class: 'subline' }); this.col.append(s); }
    s.replaceChildren(h('div', { class: 'sl-face' }, face ? h('img', { src: face }) : ''), h('div', { class: 'sl-body' }, who ? h('b', {}, who) : '', h('span', {}, text)));
    s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
    const tok = this._subTok = (this._subTok || 0) + 1;
    const kill = () => { if (this._subTok === tok) s.classList.remove('on'); };
    setTimeout(kill, ms);
    return { el: s, kill };
  }

  // ── end states
  // 흑백판 끝 (user 10/20 on a phone: "컬러로 바뀐 방 풀샷이 안 나와서 아쉽다"): the camera stands back to the stage's start
  // view, the colour spreads out of the last thing found in a circle with a 뾰로롱, the whole room holds a moment in full
  // colour — then the friend's close-up as before
  async colorBloom() {
    const G = this.G, W = G.world, u = W.post.u, v = this.view0 || { yaw: Math.PI / 4, pitch: .62, zoom: 1 };
    await W.flyTo(this.tw, { zoom: v.zoom || 1, target: W.home, yaw: v.yaw, pitch: v.pitch, dur: .55 });
    if (this.dead) return;
    const it = this._lastIt, from = it?.g ? this.worldCenter(it) : W.home.clone(), s = W.toScreen(from);
    W.fx.ring(s.x, s.y, { r: 120, color: '#ffffff', width: 8, life: .5 });
    if (this.lookR?.gray && LOOK.has('light')) W.setLight(this.th.light);   // (the day light with the colour)
    // (10/21, user: "물건 가구마다 샤샥 돌아오는 게 … 효과 이펙트가 좀") one piece at a time out of the last thing found, then the
    // walls and floor — colorpop.js
    await popColors(this, from);
    u.gray.value = 0; u.grayR.value = -1; W.dirty?.invalidate();
    for (const R of this.room.rooms || [this.room]) for (const e of R.furns) e.f.onColor?.();   // (29판: the colour's back — the rain stops, a rainbow comes up)
    await this.tw.wait(.6);
  }
  async win() {
    if (this.raidRun) return raidSettle(this, 'all');   // 타이머 털기: everything found — the same end as the clock running out, full
    const G = this.G, W = G.world;
    this.clearTapTimers();
    this.result = 'clear'; this.running = false; this.tEnd = this.t;
    (this.tutEls || []).forEach(e => e.remove()); this.tutEls = [];
    if (this.kit) { await kitFinish(this); if (this.dead) return; }   // 프라모델: put it together first (tap the pieces in order) · 이삿짐 / 파르페: their own short end
    // ★ found everything · ★ no hint · ★ careful (no more wrong taps than there were things to find)
    const wrong = this.r1?.miss || 0;
    const stars = this.v2 ? v2Stars(this) : this.incident ? 1 + (this.hintsUsed === 0 ? 1 : 0) + (wrong <= 1 ? 1 : 0)   // ★ found them all · ★ no hint · ★ 헛짚기 1번 이하 (QA B25, user 10/19: two wrong hideouts at most, so '2번 이하' never missed)
      : this.spec.timed ? 1 + (this.time / this.timeMax >= .3 ? 1 : 0) + (this.hintsUsed === 0 ? 1 : 0)
      : 1 + (this.hintsUsed === 0 ? 1 : 0) + ((this.story?.secret ? this.secretFound : tapsStarOk(this)) ? 1 : 0);   // (톡: half of them left)
    const coins = this.custom ? 40 + this.targets.length * 15 + (this.plan.locks.length ? 20 : 0) + stars * 5 : 30 + this.targets.length * 10 + stars * 10 + (this.spec.showcase ? this.plan.locks.length * 20 : 0) + this.carefulPay();   // (검토 H5: a careful clear pays, not a combo; a gadget stage's steps pay)
    this.stars = stars;
    G.audio.sfx('win'); G.hitstop(.08);
    setTimeout(() => { if (!this.dead) G.audio.sfx('cheer', 0, false); }, 380);   // (friends' little "yay" after the jingle — a file only, 사운드 10/20)
    // one new thing to hide at home, on the first clear — given BEFORE the progress is saved, so a page closed in the
    // next second can't keep the cleared stage and lose the thing (GPT QA 10/18)
    let newItem = null, seenN = 0, seenNew = [];
    // 경제·로비 on: no thing given per stage any more — what you found goes into the card book (save.seen); things to hide
    // come from the shop's 물건 tab and 하나 슬쩍 (설계서 4-1)
    if (G.econ && !this.preview && !this.custom) { const seen = G.save.seen || (G.save.seen = []), add = [...new Set(this.targets.map(t => t.type))].filter(t => t !== 'key' && t !== 'note' && ITEMS[t] && !ITEMS[t].decoy && !ITEMS[t].noCollect && !seen.includes(t)); seen.push(...add); seenN = add.length; seenNew = add;
      // 판 끝 집으로 가져가기 (10/19): the first new thing goes on the 찾은 것 선반 at home — saved with the progress, shown on the way
      if (add.length && !this.kit) { const H = G.save.home, sh = H.shelf || (H.shelf = []); if (!sh.includes(add[0])) { sh.push(add[0]); H.shelfNew = add[0]; (H.homeQ ||= { friends: [], furns: [], items: [] }).items.push(add[0]); } } }
    else if (!this.preview && !this.custom && this.idx + 1 > (G.save.stage || 0)) { const t = this.targets.map(t => t.type).find(t => t !== 'key' && t !== 'note' && ITEMS[t] && !ITEMS[t].decoy && !ITEMS[t].noCollect && !G.save.collection.includes(t)); if (t && G.collect(t)) newItem = t; }
    // 경제 B5 (10/19): no free magnifier used → one into the bag (not a preview / model kit, not testing my own room)
    const lensLine = G.econ && !this.preview && !this.custom?.selfTest && !G.playMode ? lensClear(this, stars) : null;
    // 선물은 아주 가끔 (10/20): a chapter's last stage, cleared — its furniture into the shop's 기념품; a gift's stage (econ.js GIFT_AT)
    // also waits in boxQ for the lobby's 🎁 지난 장 선물 until its boss card gives it (takeGiftPick takes it off)
    if (G.econ && !this.custom && !this.preview && !this.model && PICKS[this.idx]) { const H = G.save.home; H.offered = [...new Set([...(H.offered || []), ...PICKS[this.idx]])]; if (GIFT_AT.includes(this.idx) && !(this.idx in (H.picks || {}))) H.boxQ = [...new Set([...(H.boxQ || []), this.idx])]; }
    // 별 셋 = 비밀 한 줄 (스토리 룸 10/19): whose stage this is, and whether their diary secret was open before this clear
    const sHost = !this.custom && !this.preview && !this.model && !G.bot ? stageHost(this.idx) : null, secret = sHost && diarySecret(sHost);
    const secWas = !!secret && secretOpen(G.save.best, sHost), secKnown = anySecret(G.save.best);
    const secretNew = !!secret && !secWas && stars >= 3, secretLock = !!secret && !secWas && stars < 3 && secKnown;
    const metBefore = G.econ && !this.custom && !this.preview ? new Set(metFriends(G.save)) : null;   // (who is new after this clear — 판 끝 집으로 가져가기)
    // (외부 QA 10/20 TECH-STORY-LOSS) the new friend, the story's gift (furniture + coins) and 11판's cat tower are given here,
    // before the clear is saved — they used to come after the 1 s wait and the outro talk, so a page closed in between kept
    // the clear and lost them for good (11·21·31·40·49·60·70판). They are still shown on the result panel as before.
    let memento = null, newFriend = null;
    if (!this.custom) {
      const got = G.save.chars || (G.save.chars = []);
      const k = this.spec.timed ? 'raccoon' : CHAR_UNLOCK[this.idx];
      if (k && !got.includes(k)) { got.push(k); newFriend = k; }
    }
    if (this.story) {
      const done = G.save.storyDone || (G.save.storyDone = {});
      if (this.story.reward && !done[this.story.id]) {
        done[this.story.id] = true;
        if (this.story.reward.furn) { keepsake(G, this.story.reward.furn); memento = this.story.reward.furn; }   // (선물은 아주 가끔 10/20: to the shop's 기념품 — econ.js)
        if (this.story.reward.coins) G.addCoins(this.story.reward.coins);
      }
    }
    // 11판, meeting 냥냥이: the cat tower — the gift of the 냥냥이 escape boss that the 1장 trim removed — so her seat at
    // your place (script.js giftSeats) still comes (user picked this, 10/18). Marked as that story's gift, once.
    if (this.idx === 10 && !this.custom && !this.preview) {
      const done = G.save.storyDone || (G.save.storyDone = {});
      if (!done.grumpycat) { done.grumpycat = true; keepsake(G, 'cattower'); memento = 'cattower'; setTimeout(() => !this.dead && G.ui.toast('도감 · 몽글이 일기장에 냥냥이가 적혔어!', 'green'), 2600); }   // (the diary page she mentions — 검토 10/19)
    }
    if (this.preview || this.custom) G.persist();   // (a stage clear saves all of it in G.onStageClear just below)
    const first = this.preview ? { awarded: 0 } : this.custom ? G.onVisitResult(this.custom, true, this.found, this.targets.length, coins) : G.onStageClear(this.idx, stars, coins);
    if (!this.preview) this.logRun('clear', stars);
    // the finished model goes home (once) — saved with the clear, before the pause (GPT QA R2-01 10/19: quitting in that
    // second kept the clear but lost the robot / boxes / parfait)
    const kitFurn = this.kit && KITS[this.kit.kit].furn, kitNew = this.kit ? kitReward(this) : null, kitShop = !!this.kit && toShop(G) && !FREE_KITS.includes(this.kit.kit);   // (only the robot comes home free — 10/20)
    // 흑백판: the whole room floods back into colour — seen as a whole room first, then the friend (colorBloom)
    // (외부 3차 QA 10/20 TECH-GRAY-BLOOM-SAVE: the clear is saved above, before this — a page closed during the bloom lost it)
    if (this.spec.gray && W.post?.u.gray.value > .5) { await this.colorBloom(); if (this.dead) return; }
    else if (this.spec.gray && W.post) W.post.u.gray.value = 0;
    W.fx.confetti(130);
    this.bubble.style.display = 'none';
    const f = this.friend; f.pose = 'cheer'; f.setFace('wow'); f.faceTo(W.cam.position.x, W.cam.position.z);
    // (10/19) the camera comes in on the friend cheering — or on 먹물이 saying "…앗." first; it goes back out when 먹물이 bolts
    // (10/20, user on the phone, 11판: an open cupboard door hid 몽글이's face in the last talk — "엔딩 갈 때 문 닫아 주는 게 나을 듯")
    // every open door, drawer, lid and curtain shuts first — one quick 탁 — then the camera comes in
    this.shutOpenParts().then(() => { if (this.dead) return; if (this.villain && !this.inkyIt) closeUp(this, this.villain.ch, { portrait: true }); else closeUp(this, this.kit && this.hero?.ch ? [f, this.hero.ch] : f, { portrait: true }); });   // (a kit stage: the friend and 몽글이 together, the model between them — user 10/20)   // (the same frontal shot every stage — user 10/19)
    // 깜짝 한 방 (스토리 룸 10/19): the host's one small moment, inside this close-up (script.js scene.pop) — else the plain cheer
    const pop = !this.custom && !this.preview && !this.model && !G.bot ? sceneAt(this.idx)?.pop : null;
    const popDone = pop ? this.popMove(f, pop) : null;
    if (!pop && !this.incident && !this.hiddenStage) this.say(f, this.model ? this.model.cheer : '우와! 다 찾았네!', 1800);   // (사건 판: the host has just had their say; 숨은그림 판: its closing talk starts with it)
    for (const n of this.npcs || []) { if (n === this.villain) continue; n.on = false; n.ch.pose = 'cheer'; n.ch.setFace('happy'); n.ch.faceTo(W.cam.position.x, W.cam.position.z); n.ch.bump(.4); }
    // 먹물이 loses: a sulk, then it bolts off the edge of the room and is gone
    if (this.villain && !this.inkyIt) {
      const v = this.villain, ch = v.ch; v.on = false; this.say(ch, inkyCaught(this.idx), 1600);   // 대본: …앗. → …또 너야? → …너는 안 가네.
      if (inkyStays(this.idx)) { ch.setFace('sus'); ch.faceTo(W.cam.position.x, W.cam.position.z); } else {   // (GPT QA ST-INKY-FACE: shy until it says yes — happy after the talk)   // 빌딩: it stays to talk, then as a friend
      ch.setFace('angry');
      const p0 = ch.root.position.clone(), away = p0.clone().add(new THREE.Vector3(p0.x >= 0 ? 4 : -4, 0, p0.z >= 0 ? 3 : -3));
      ch.root.rotation.y = Math.atan2(away.x - p0.x, away.z - p0.z);
      this.tw.wait(1.1).then(() => { closeBack(this); return this.tw.run(.7, k => { ch.root.position.lerpVectors(p0, away, k); ch.root.position.y = p0.y + Math.abs(Math.sin(k * Math.PI * 4)) * .18; ch.root.scale.setScalar(1 - .6 * k); }, ease.inQuad); }).then(() => { ch.root.visible = false; });
      }
    }
    this.setMong('happy', 'hop');
    await (popDone ? Promise.race([popDone, this.tw.wait(2.6)]) : this.tw.wait(1.0));   // (the result panel waits for the pop, ~2 s)
    if (this.dead) return;
    await this.quipPair(); if (this.dead) return;   // (after the pop, before the result)
    // 판 끝 연출 (staging.js): the train in, the sunset… before the closing words
    await staging(this, 'end'); if (this.dead) return;
    let back = [], got = null;
    // one new thing to hide at home per stage, the first time it is cleared (not every find — that gave away too much)
    // (the first-clear thing is given before the progress is saved, above — 10/18 GPT QA: leaving during the 1 s wait lost it)
    // 털기: take back what was mine, then pocket one thing from this room
    if (this.custom && !this.custom.selfTest && !this.preview) {
      back = retrieve(G, this.custom);
      if (canGrab(G, this.custom)) got = await this.pickLoot(back);
      if (this.dead) return;
    }
    if (this.story?.outro) { await this.talk(this.story.outro, { cam: true }); if (this.dead) return; }   // (its gift was given before the save, above)
    // 대본: a few words after the clear — 2판's "이번엔 네가 숨겨 봐", a 흑백판's footprints, 너굴이's excuse
    let aft = this.custom || this.preview ? null : this.spec.timed ? timedWin(this.idx) : sceneAfter(this.idx), endLines = null;
    // 말 줄이기 2 (검토 2차 3 · 레벨 리포트 v3 개선 1, 10/19): the words after a clear sit in the result panel — the
    // speaker's face and two lines at most, the script's keep lines first — instead of stopping the screen. A card only
    // where the story turns: a 사건 판 (friend found), a boss, 1·2판, or a scene the script marks keep / endCard.
    const sc0 = sceneAt(this.idx), endCard = this.incident || this.spec.boss || this.spec.tut <= 2 || !!sc0?.keep || !!sc0?.endCard;
    if (aft && !endCard) {
      const pan = aft.filter(l => l.panel), pick = new Set(pan.length ? pan.slice(0, 2) : aft.filter(l => l.keep).slice(0, 2));
      for (const l of aft) { if (pick.size >= 2) break; pick.add(l); }
      endLines = aft.filter(l => pick.has(l)); aft = null;
    }
    if (aft && !G.skipTalk && !G.bot) { await this.talk(aft, { cam: true }); if (this.dead) return; }
    if (this.villain && !this.inkyIt && inkyStays(this.idx)) this.villain.ch.setFace('happy');   // ("다음엔 같이 칠하자" — now it smiles)
    // (선물은 아주 가끔 10/20: no chapter box here any more — 31·49·70판's gift is on the win card of the boss right after,
    // gifts.js chapterGift; boxQ above keeps it for the lobby's 🎁 지난 장 선물 if that boss is left)
    // 2판 (home just opened): go and hide something at home now, or keep going — both on the result panel
    // 판 끝 집으로 가져가기 (검토 세션 10/19, 사용자 OK — "찾은 게 아무 데도 안 남는다"): '다음' goes through 몽글이's room for under
    // 3 s on the way — the friend met here walks in and sits, a piece won here is set down, the thing found goes on the shelf
    // (a tap goes straight on). Only when something new came home; not on 2판 itself (its result offers the room) — after its
    // '계속 찾기' the next stage's passage is the room's first opening (검토 P1)
    // what came home this time joins the queue for the room (homeQ — the room shows it all next time it is passed through);
    // a star box waiting turns '다음' into '🎁 방에서 열기' (별 상자, 경제 A1+A2)
    let passage = null, gotNow = [];
    if (metBefore && G.homeOpen?.() && !G.playMode && !G.bot && !this.model) {
      const H = G.save.home, Q = H.homeQ || (H.homeQ = { friends: [], furns: [], items: [] });
      const fr = metFriends(G.save).filter(k => !metBefore.has(k)), fu = (toShop(G) ? null : memento) || (kitNew && !kitShop ? kitFurn : null);
      for (const k of fr) if (!Q.friends.includes(k)) Q.friends.push(k);
      if (fu) Q.furns.push(fu);
      gotNow = [...fr.map(k => ({ face: k })), ...(fu ? [{ furn: fu }] : [])];   // (no find for the shelf: the 찾은 것 선반 is gone, 10/19 evening)
      G.persist();
      passage = { items: Q.items.slice(), furns: Q.furns.slice(), friends: Q.friends.slice(), box: false };   // (no 별 상자 since 10/20)
    }
    const homeNow = false;   // (③ 10/21, user "모든 연락은 숫자 뱃지": 2판's result no longer offers '내 집에서 숨겨 보기' — 숨기기 in the room carries a 1)
    // (10/20: a star box opens right here — 🎁 상자 열기 — not in the room: no scene between the stages, gifts.js)
    const passOn = !!passage && !homeNow && PASSAGE_EVERY && !!(passage.items.length || passage.furns.length || passage.friends.length);
    // the first run doesn't offer the home after 1판: the home first shows after 2판, when 내 집 opens (기획안 7장)
    const noHome = G.firstRun && this.idx === 0 && !this.custom && !this.preview && !this.model;
    // (② 레벨 10/21, 사용자 "19 26 미니게임 하나없이 달려서 갑갑": a stage played again still has its play after it — the save's
    // 'done' only pays it a third now (settleFollowup replayWin); 70판's last night only before the ending)
    const replayPlay = k => !G.save.bossDone?.[k] || (G.save.stage || 0) > this.idx + 1 && !(this.idx === STAGE_COUNT - 1);
    // (③ 10/22, 시트 결정 8 '다시 하는 판의 놀이'): the play after a stage comes by itself only the first time; played already, it waits
    // behind a small '놀이 하고 가기' button on this panel (when you want it) and '다음' goes straight on to the next stage
    const due = k => !G.save.bossDone?.[k];
    const bossNext = BOSS_AFTER.includes(this.idx) && due(this.idx), gameNext = !bossNext && !!BOSS_GAMES[this.idx] && due('g' + this.idx), miniNext = !bossNext && !gameNext && !!MINI_AFTER[this.idx] && due('m' + this.idx);
    const againPlay = this.custom || this.preview || this.model || bossNext || gameNext || miniNext ? null
      : BOSS_AFTER.includes(this.idx) && replayPlay(this.idx) ? () => G.go('boss', { after: this.idx })
      : BOSS_GAMES[this.idx] && replayPlay('g' + this.idx) ? () => G.go('bossgame', { kind: BOSS_GAMES[this.idx].kind, lv: BOSS_GAMES[this.idx].lv, after: this.idx })
      : MINI_AFTER[this.idx] && replayPlay('m' + this.idx) ? () => (MINI_AFTER[this.idx].lab ? G.go('bossgame', { kind: MINI_AFTER[this.idx].kind, lv: MINI_AFTER[this.idx].lv || 0, after: this.idx, interlude: true }) : G.go('mini', { kind: MINI_AFTER[this.idx].kind, after: this.idx }))
      : null;
    const starEls = [0, 1, 2].map(() => h('div', { class: 'st', html: ICON.star }));
    const cv = h('span', {}, '0');
    const p = G.ui.panel({
      title: this.model ? '완성!' : first?.allClear ? `${STAGE_COUNT}판 올클리어!` : this.v2 ? v2Title(this) : this.spec.hard ? '하드 클리어!' : (!this.custom && this.idx < 6) ? ['대단해!', '최고야!', '숨바꼭질 천재!', '멋져!', '완벽해!', '진짜 잘한다!'][this.idx] : '다 찾았다!', color: 'green', cls: 'result',
      body: [h('div', { class: 'stars' }, ...starEls), 
        // 사건 판: what each star is for, so a missing one says how to get it (GPT QA 10/18: 보너스 0/2 → '다 찾았네', 별 2개)
        ...(this.v2 ? [h('div', { class: 'starwhy' }, ...v2StarWhy(this).map(([t, on]) => h('span', { class: on ? 'on' : '' }, t)))].concat(v2Stamp(this) || [])
          : this.hiddenStage || this.model ? [h('div', { class: 'starwhy' }, h('span', { class: 'on' }, '★ 다 찾기'), h('span', { class: this.hintsUsed ? '' : 'on' }, '★ 힌트 없이'), h('span', { class: tapsStarOk(this) ? 'on' : '' }, this.tapsLeft == null ? `★ 꼼꼼하게 · 헛손질 ${this.missCount}` : TAP_TXT.star))]   // 숨은그림 판: what each star is for
          : this.incident ? [h('div', { class: 'starwhy' }, h('span', { class: 'on' }, '★ 친구 찾기'), h('span', { class: this.hintsUsed ? '' : 'on' }, '★ 힌트 없이'), h('span', { class: (this.r1?.miss || 0) <= 1 ? 'on' : '' }, (this.r1?.miss || 0) === 0 ? '★ 명탐정 (헛짚기 0)' : `★ 헛짚기 ${this.r1?.miss || 0}번`))]
          : [h('div', { class: 'starwhy' }, h('span', { class: 'on' }, '★ 다 찾기'), ...(this.spec.timed
            ? [h('span', { class: this.time / this.timeMax >= .3 ? 'on' : '' }, STAR_TXT.time), h('span', { class: this.hintsUsed ? '' : 'on' }, '★ 힌트 없이')]
            : [h('span', { class: this.hintsUsed ? '' : 'on' }, '★ 힌트 없이'), this.story?.secret ? h('span', { class: this.secretFound ? 'on' : '' }, STAR_TXT.secret)
              : h('span', { class: tapsStarOk(this) ? 'on' : '' }, this.tapsLeft == null ? `★ 꼼꼼하게 · 헛손질 ${this.missCount}` : TAP_TXT.star)]))]),
        // (10/20, user: "2판 끝나면 결과 팝업과 같이 조작법 요약" — in this panel, so it is one popup, not two)
        ...(this.spec.tut === 2 && !TUT_B && !this.custom && !this.preview && G.world.scheme === 'F' ? [controlsBlock('ftap')] : []),
        // (each line with its speaker's face and, but for 몽글이's own, a small name — two friends can share the two lines)
        ...(endLines ? [h('div', { class: 'endtalk' }, ...endLines.map(L => h('div', { class: 'et' + (L.who === 'mong' ? ' me' : '') }, G.thumbs['face_' + L.who] ? h('img', { src: G.thumbs['face_' + L.who] }) : '', h('span', {}, L.who !== 'mong' && CHAR_DEFS[L.who] ? h('b', { class: 'who' }, CHAR_DEFS[L.who].name) : '', tr(L.text)))))] : []),
        // 별 셋 = 비밀 한 줄: the line itself the moment it opens; short of three (once you know secrets exist), a grey 'one secret'
        // (③ 10/21, user: "야 개구리 대체 몇개여 … 중복아님?": one face on this panel, the talk's — the secret is a plain line, its holo
        // card a number on 도감 (cardbook.js bookBadge), a friend you can call a number on 꾸미기)
        ...(secretNew ? [h('div', { class: 'memento secret' }, h('div', {}, h('b', {}, tr(SECRET_UI.got).split(' · ')[0]), h('span', {}, tr(secret))))] : []),
        ...(secretLock ? [h('div', { class: 'memento secret', style: 'opacity:.75' }, h('div', {}, h('b', {}, '🔒 ' + tr(SECRET_UI.lockT)), h('span', {}, tr(SECRET_UI.lock))))] : []),
        ...(this.kit ? [h('div', { class: 'memento tile gift' }, h('img', { src: G.thumbs['furn_' + kitFurn] }), h('div', {}, h('b', {}, kitNew ? kitShop ? '상점 기념품!' : '내 집에 가져가요!' : '또 완성!'), h('div', {}, kitNew ? `${FURN_NAME(kitFurn)} · ${kitShop ? '상점 기념품에 들어갔어' : passOn ? '내 방으로 가져가요' : '꾸미기 보관함에 들어갔어'}` : `${FURN_NAME(kitFurn)} · ${kitShop ? '상점 기념품 칸에 있어' : '이미 내 집에 있어요'}`)))] : []),
        ...(this.model ? [] : [h('div', { class: 'reward', html: ICON.coin }, cv)]),
        /* (no '걸린 시간 · 힌트 없이!' line: the star chips above already say hints, and the time isn't a goal — 2D UI 정리 10/19) */
        ...(lensLine ? [h('div', { class: 'txt lensline' }, lensLine)] : []),   // (경제 B5: 안 쓴 돋보기는 가방에 쏙!)
        /* (no '마을 최고의 탐정' line on the last result — the ending says it — 검토 H6) */
        ...(newItem ? [h('div', { class: 'memento tile' }, h('img', { src: G.thumbs['item_' + newItem] }), h('div', {}, h('b', {}, '새 숨길 물건!'), h('div', {}, ITEMS[newItem].name)))] : []),
        /* (no '도감에 새로' and '내 방으로' rows: a number on 도감 and on 꾸미기 says it — user 10/20 "이거 필요없어. 도감이랑 내 방에 숫자 배지") */
        ...(newFriend ? [h('div', { class: 'memento tile' }, h('img', { src: G.thumbs['face_' + newFriend] }), h('div', {}, h('b', {}, '새 친구!'), h('div', {}, `${ga(CHAR_DEFS[newFriend]?.name || '')} 이제 동네에 놀러 와요`)))] : []),
        ...(back.length === 1 ? [h('div', { class: 'memento mine' }, h('img', { src: G.thumbs['item_' + back[0]] }), h('div', {}, h('b', {}, '되찾았다!'), h('div', {}, `${ITEMS[back[0]]?.name || ''} · 다시 내 집에 숨길 수 있어 (+20)`)))]
          : back.length ? [h('div', { class: 'memento mine' }, h('div', {}, h('b', {}, `${back.length}개 되찾았다! (+${back.length * 20})`), h('div', { class: 'icons' }, ...back.slice(0, 12).map(t => h('img', { src: G.thumbs['item_' + t] }))), back.length > 12 ? h('div', {}, `외 ${back.length - 12}개`) : ''))] : []),
        ...(got ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['item_' + got.item] }), h('div', {}, h('b', {}, '슬쩍 챙김!'), h('div', {}, got.isNew ? `${ITEMS[got.item]?.name || ''} · 내 수집품에 추가! 내 집에 숨길 수 있어` : `${ITEMS[got.item]?.name || ''} · 이미 있어서 코인 +${got.coins}`)))] : []),
        ...(got && this.custom?.resident ? [h('div', { class: 'txt' }, `${ga(this.custom.nick)} 눈치챘을지도… 복수하러 올 수 있어! 내 집 물건을 더 꼭꼭 숨겨 둬`)] : []),
        ...(memento ? [h('div', { class: 'memento tile gift' }, h('img', { src: G.thumbs['furn_' + memento] }), h('div', {}, h('b', {}, toShop(G) ? '상점 기념품!' : '기념 가구 획득!'), h('div', {}, `${FURN_NAME(memento)} · ${toShop(G) ? '상점 기념품에 들어갔어' : passOn ? '내 방으로 가져가요' : '꾸미기 보관함에 들어갔어'}`)))] : [])],
      buttons: this.model ? [G.ui.btn('놀이 모음', { color: 'blue', cls: 'sm', onClick: () => G.go('home', { gallery: true }) }),
        this.nextBtn = G.ui.btn('다시 조립', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', this.retryArgs()) })]
        : [...(noHome ? [] : [homeNow ? G.ui.btn(SUI.homeHide, { color: 'orange', icon: 'home', cls: 'sm', onClick: () => G.go('myhome') }) : G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') })]),
        ...(againPlay ? [G.ui.btn('놀이 하고 가기', { color: 'orange', icon: 'play', cls: 'sm', onClick: againPlay })] : []),
        this.nextBtn = this.custom?.selfTest ? G.ui.btn('내 방 고치러', { color: 'green', icon: 'home', cls: 'big', onClick: () => G.go('myhome', { zone: this.custom.back, mode: 'hide' }) })
          : this.custom ? G.ui.btn('다른 방', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('visit') })
          : this.preview ? G.ui.btn('다시 보기', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', this.retryArgs()) })
          : G.ui.btn(bossNext || gameNext || (miniNext && MINI_AFTER[this.idx].boss) ? '보스 등장!' : miniNext ? '다음' : this.idx + 1 >= STAGE_COUNT ? '무한 모드' : homeNow ? SUI.keepGoing : '다음', { color: 'green', icon: 'play', cls: 'big',
              onClick: () => {
                const go = (n, d) => passOn ? G.go('home', { passage: { ...passage, next: [n, d] }, quick: true }) : G.go(n, d); return bossNext ? go('boss', { after: this.idx }) : gameNext ? go('bossgame', { kind: BOSS_GAMES[this.idx].kind, lv: BOSS_GAMES[this.idx].lv, after: this.idx }) : miniNext ? (MINI_AFTER[this.idx].lab ? go('bossgame', { kind: MINI_AFTER[this.idx].kind, lv: MINI_AFTER[this.idx].lv || 0, after: this.idx, interlude: true }) : go('mini', { kind: MINI_AFTER[this.idx].kind, after: this.idx })) : go('stage', { idx: this.idx + 1 }); } })],
    });
    for (let i = 0; i < stars; i++) { await this.tw.wait(.28); starEls[i].classList.add('on'); G.audio.sfx('star', i); }
    const paid = first?.awarded ?? coins;
    // 남은 터치 → 코인 (10/20, user: "ㅇㅇ 그러자. 연출만 잘 해 줘"): the base counts up, then each touch kept past half flies from
    // the hand in the corner into the coin row, +5 each (a replay pays a third of it, like the rest)
    const over = this._tapOver || 0, bonus = over && !this.model ? paid - Math.round((coins - over * 5) * (first?.repeat ? 1 / 3 : 1)) : 0;
    if (!this.model) { await G.ui.countUp(cv, 0, paid - bonus, 700, v => { if (v % 10 === 0) G.audio.sfx('coin', 0); }); if (bonus > 0 && !this.dead) await this.tapCoins(cv, paid - bonus, over, bonus); }   // (a model kit pays in the model, not coins)
    // (QA 10/20: under the coin row, not inside it — in English the line ran off the panel's right edge)
    if (first?.repeat) (cv.parentElement || cv).after(h('div', { class: 'txt sm' }, '다시 깬 방이라 보상이 1/3이에요'));
    if (first?.allClear) { W.fx.confetti(220); setTimeout(() => !this.dead && W.fx.confetti(160), 900); }
    for (const z of first?.newZones || []) setTimeout(() => G.ui.toast(`내 집에 ${ga(z)} 생겼어!`, 'green'), 1700);
  }
  // a careful clear: the touches kept past half of them, 5 coins each (a stage with no touch count: no miss at all, +20 as before)
  carefulPay() {
    if (this.tapBudget == null || this.tapsLeft == null) { this._tapOver = 0; return this.missCount === 0 ? 20 : 0; }
    this._tapOver = Math.max(0, this.tapsLeft - Math.ceil(this.tapBudget / 2));
    return this._tapOver * 5;
  }
  // the kept touches fly into the coin row one by one (at most 12 trips; the last carries the rest), the pill counting down,
  // the row counting up with a coin sound, and a line under it says what they were
  async tapCoins(cv, from, over, bonus) {
    const G = this.G, row = cv.parentElement || cv, pill = this.tapPill, pr = pill?.isConnected ? pill.getBoundingClientRect() : null;
    const src = 'data:image/svg+xml;utf8,' + encodeURIComponent(ICON.hand.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')), trips = Math.min(over, 12);
    row.after(h('div', { class: 'txt sm tapcoin' }, `남긴 터치 ${over}개 → +${bonus}`));
    let got = 0;
    for (let i = 0; i < trips && !this.dead; i++) {
      const x0 = pr ? pr.left + pr.width / 2 : innerWidth * .15, y0 = pr ? pr.top + pr.height / 2 : 90;
      const step = i === trips - 1 ? bonus - got : Math.round(bonus / trips);
      G.ui.flyImg(src, x0, y0, row.querySelector('svg') || row, { size: 30, dur: 520 }).then(() => {   // (into the coin icon — UI 10/20)
        if (this.dead) return; got += step; cv.textContent = from + got; G.audio.sfx('coin', 1);
        row.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
      });
      if (pill) { const v = pill.querySelector('.v'); if (v) v.textContent = Math.max(0, (this.tapsLeft || 0) - i - 1); }
      await this.tw.wait(.11);
    }
    await this.tw.wait(.6); if (this.dead) return;
    cv.textContent = from + bonus;
  }
  // 털기: one of the things found here goes home with 몽글이
  pickLoot(back = [], only = null) {   // (only: 타이머 털기 — just what was found)
    const G = this.G;
    const pool = [...new Set((only || this.targets).map(t => t.type))].filter(t => t !== 'key' && t !== 'note' && !back.includes(t) && ITEMS[t] && !ITEMS[t].decoy);
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
    this.clearTapTimers();
    G.ui.closePanel?.();
    this.result = 'fail'; this.running = false; this.tEnd = this.t;
    const lensBk = G.econ && reason === 'taps' ? lensBack(this) : 0;   // 경제 B5 (10/19): lost to taps → the bag's magnifiers go back
    G.audio.sfx('lose');
    const f = this.friend; f.pose = 'idle'; f.setFace('wow'); f.faceTo(0, 0); f.bump(.4);
    this.bubble.style.display = 'none';
    this.say(f, reason === 'taps' ? TAP_TXT.friend : this.spec.timed && !this.custom ? ROCKY_LOSE : '다 셌다~!', 1600);
    this.setMong('dizzy', 'shake');
    if (this.preview) { /* nothing to record */ } else if (this.custom) G.onVisitResult(this.custom, false, this.found, this.targets.length, 0); else G.onStageFail(this.idx);
    if (!this.preview) this.logRun('fail', 0);
    await this.tw.wait(.9);
    if (this.dead) return;
    const contFree = !this.continued;
    G.ui.panel({
      title: reason === 'giveup' ? '포기했어' : reason === 'taps' ? TAP_TXT.title : '시간 초과!', color: 'red',
      body: [h('div', { class: 'big-txt' }, `${this.found} / ${this.targets.length} 찾음`), h('div', { class: 'txt' }, reason === 'giveup' ? '숨긴 사람이 한 수 위였네! 집주인에게 코인이 가요' : reason === 'taps' ? TAP_TXT.body : '조금만 더 하면 다 찾을 수 있어!'),
        ...(lensBk ? [h('div', { class: 'txt lensline' }, '가방에서 꺼낸 돋보기는 돌려줬어!')] : [])],
      // (laid out like every other panel — 2D UI 정리 ② 10/19: the small helper (홈) on the left, '다시 하기' orange as it is
      // everywhere else, the main thing on the right end; the mini / boss fail panels already were [건너뛰기][다시 하기])
      buttons: [
        this.custom?.selfTest ? G.ui.btn('내 방 고치러', { color: 'blue', cls: 'sm', onClick: () => G.go('myhome', { zone: this.custom.back, mode: 'hide' }) })
          : this.custom ? G.ui.btn('다른 방', { color: 'blue', cls: 'sm', onClick: () => G.go('visit') }) : G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
        G.ui.btn('다시 하기', { color: 'orange', cls: reason === 'giveup' || reason === 'taps' ? 'big' : '', onClick: () => G.go('stage', this.retryArgs()) }),
        ...(reason === 'giveup' || reason === 'taps' ? [] : [G.ui.btn('이어하기', { color: 'green', cls: 'stack', sub: contFree ? '+20초 (무료)' : G.econ ? '+20초 · 돋보기 1' : '+20초 · 코인 80', onClick: () => this.continueRun(contFree) })]),
      ],
    });
  }
  // real players only: what the balance pass needs to replace the bot model with people
  logRun(r, stars) {
    if (this.custom || this.G.bot) return;
    logStage({ s: this.idx + 1, r, stars, secs: +((this.tEnd ?? this.t) - (this.tStart ?? 0)).toFixed(1), tmax: this.timeMax, left: Math.max(0, Math.round(this.time)),
      found: this.found, total: this.targets.length, locks: this.plan.locks.length, hints: this.hintsUsed, misses: this.missCount, cont: !!this.continued, v: 1 });
  }
  retryArgs() { return this.model ? { model: this.model.kind } : this.custom ? { custom: this.custom } : this.preview ? { idx: this.idx, spec: this.spec, preview: true } : { idx: this.idx, retry: true, seed: this.spec.seed }; }
  continueRun(free) {
    const G = this.G;
    // 경제 B5 (10/19): from the 2nd on it takes a magnifier (a free one first), not coins; none → stays on the panel
    if (!free && G.econ) { if (!takeLens(this)) { G.ui.toast('돋보기가 없어!', 'red'); return; } free = true; }
    if (!free) { if (G.save.coins < 80) { G.ui.toast('코인이 모자라!', 'red'); return; } G.addCoins(-80); }
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
      // (GPT QA QA-08 10/24: Enter and Space work the row as a touch does)
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); G.audio.sfx('click'); tap(); v.textContent = val(); } });
      el.refresh = () => { v.textContent = val(); };
      return el;
    };
    const snd = row('소리', () => G.audio.muted ? '꺼짐' : '켜짐', () => G.audio.setMuted(!G.audio.muted));
    const ctrl = row('조작', () => S.ctrl === 'E' ? '터치 전환' : '돌림판', () => { S.ctrl = S.ctrl === 'E' ? 'F' : 'E'; G.world.scheme = S.ctrl; G.world.eMode = G.world.eBase = 'move'; G.persist(); });
    // (10/20, user: "조작 도움말 화면에 1~10판까지 버튼으로 다시 볼 수 있게") — the help, and this panel again when it closes
    const help = row('조작 도움말', () => '›', () => { ui.closePanel(); openHelp(G, { onClose: () => { if (!this.dead && !this.result) this.pause(); } }); });
    const voice = row('목소리', () => G.audio.voiceOn ? '켜짐' : '꺼짐', () => G.audio.setVoice?.(!G.audio.voiceOn));   // (너굴이 옹알이 — 10/20)
    const rows = [snd, voice, ctrl, help];
    const fsOk = !IN_APP && !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && document.fullscreenEnabled !== false;   // (the app is full screen already)
    if (fsOk) rows.push(row('전체화면', () => document.fullscreenElement || document.webkitFullscreenElement ? '켜짐' : '꺼짐', async () => {
      const el = document.documentElement;
      try { if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document); else await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); } catch { ui.toast('이 브라우저는 전체화면이 안 돼요', 'red'); }
    }));
    const tools = [];
    if (this.custom) tools.push(this.raidRun ? ui.btn('그만 털기', { color: 'orange', cls: 'sm', onClick: () => raidSettle(this, 'stop') }) : ui.btn('포기하기', { color: 'red', cls: 'sm', onClick: () => this.lose('giveup') }));
    // (user 10/25 "세팅용 메뉴 … 제거하자": the owner alone isn't enough any more — the artifact's owner plays it as a player; ?qa=1)
    if (G.owner && QA_TOOLS) {
      if (!this.custom && !this.preview && this.idx >= 0 && this.idx < 70) tools.push(ui.btn('배치 고치기', { color: 'orange', cls: 'sm', onClick: () => G.go('layedit', { idx: this.idx }) }));
      tools.push(ui.btn('세팅', { color: 'blue', cls: 'sm', onClick: () => { ui.closePanel(); openTune(G, { onClose: () => { if (!this.dead && !this.result) this.pause(); } }); } }));   // stays paused while tuning
      const perfLbl = () => S.perf ? '성능 표시 끄기' : '성능 표시';
      const perf = ui.btn(perfLbl(), { color: 'gray', cls: 'sm', onClick: () => { S.perf = !S.perf; G.persist(); perf.querySelector('.lbl').textContent = perfLbl(); } });
      tools.push(perf);
    }
    ui.panel({
      title: '잠깐 쉬기', color: 'purple', cls: 'pausep',
      body: [h('div', { class: 'txt' }, `${this.th.name} · 찾은 물건 ${this.found}/${this.targets.length}`), h('div', { class: 'setlist' }, ...rows), ...(tools.length ? [h('div', { class: 'row tools' }, ...tools)] : [])],
      buttons: [ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }), ui.btn('다시 하기', { color: 'orange', cls: 'sm', onClick: () => G.go('stage', this.retryArgs()) }), ui.btn('계속', { color: 'green', icon: 'play', onClick: () => { ui.closePanel(); this.paused = false; } })],
    });
  }

  // ── per-frame
  update(dt) {
    const G = this.G, W = G.world;
    if (!this.dead) this.ambient?.always(dt);   // (weather: on its own clock, paused or not — ambient.js)
    if (this.dead || this.paused) return;
    this.tw.update(dt);
    this.t += dt;
    this.updateTapTimers(dt);
    this.room.update(dt); this.ambient?.update(dt); this.look?.update(dt); this.tvs?.update(dt);
    // 7판: the key on the pulley's hook sways a little while it hangs there, round the hook
    if (this.items) for (const it of (this._hung ||= this.items.filter(i => i.hang))) if (it.hang && !it._swing) this.swingHung(it, Math.sin(this.t * 2.1) * .05);
    this.friend.update(dt); this.trick?.update(dt); this.cameo?.ch.update(dt);
    if (this.v2) v2Update(this, dt);
    for (const n of this.npcs || []) n.ch.update(dt);
    this.hero?.update(dt, this.tw, !!this.result || !!this.talking);
    if (this.dizzy > 0) { this.dizzy -= dt; if (this.dizzy <= 0) { this.mong.classList.remove('spin'); this.mongImg.src = G.thumbs.face_mong; } }
    if (this.jailed?.in && this.running && !this.result && (this._jT = (this._jT ?? 9) - dt) <= 0) { this._jT = 11 + Math.random() * 5; this.say(this.jailed.ch, JAIL_LINES[(this._jn = (this._jn || 0) + 1) % JAIL_LINES.length], 2000); }   // the one in the cell keeps pleading
    // (a hidden friend giggles once you've looked a while — 10 s, not from the start; every 7–10 s, not 4–9: 레벨 1~10 추천 10/19 —
    // the first stage's lesson keeps its old pace)
    const gigWait = HINTS_OLD || this.spec.tut === 1 ? (!this.r1 || this.idle > 15) : this.idle > (this.r1 ? 30 : 20);   // (10/21: 10 → 20 s, every 14–20 s — "힌트가 너무 많아")
    if (this.incident && this.friendHidden && this.running && !this.result && gigWait && (this.gigT = (this.gigT ?? 4) - dt) <= 0) { this.gigT = HINTS_OLD || this.spec.tut === 1 ? (this.idle > 8 ? 4 : 6.5) + Math.random() * 3 : 14 + Math.random() * 6; this.giggle(); }
    if (this.spec.night && !this.result && (this._starT = (this._starT || 0) - dt) <= 0) {
      this._starT = .45 + Math.random() * .5;
      // in the sky only: a point over the room (its walls, its floor, a lamp) or the look's ground round it gets no star — they
      // twinkled on the floor beside the lamps whenever the room reached the top of the screen (user, 9판 on a phone: "조명
      // 있는 데 점점점이 지저분하게 박혀 있어요", 10/20)
      const sx = Math.random() * W.W, sy = Math.random() * W.H * .28 + 40;
      if (!W.pick(sx, sy, [this.room.group, this.look?.group].filter(Boolean)).length)
        W.fx.burst(sx, sy, { n: 1, shape: 'star', speed: 6, gravity: 0, life: 1.3, size: 7, colors: ['#fff6c0', '#ffffff', '#cfe0ff'] });
    }
    if (this.running && !this.result && !this.paused) {
      this.idle += dt;
      songDrift(this, dt);
      sweepUpdate(this, dt);
      if (!TUT_B && this.idx === DBL_AT && this.idle > 15 && !this._dbl) teachDbl(this);
      if (this.idle > 11) this.taunt('idle');
      // a sparkle on something findable after a while of nothing: 9 s on a friend hunt; on a hidden-object stage you get
      // time to look yourself first — 12 s in chapters 1-2, 20 s from 3 (레벨 세션 B3, user: "진득하게")
      if (this.sparkAfter == null) { const ch = REGIONS.indexOf(regionOf(this.idx)); this.sparkAfter = this.incident || this.custom || this.spec.timed ? 20 : this.spec.tut <= 2 ? 20 : 35; }   // (10/19 evening "힌트가 너무 많다": 9/12/20 → 20/20/35 s)   // (12 → 20 s on hidden-object stages from 3판: user 10/19 "힌트도 너무 많은 듯")
      // F1: one thing left for 20 s → the owner looks at it; with one left the sparkle waits until 10 s after that look
      if (this.feelHelp) {
        const left = this.targets.filter(t => !t.found);
        if (left.length === 1) { this._oneAt ??= this.t; if (this._gazeAt == null && !this._autoHint && this.t - this._oneAt >= 35) { this._gazeAt = this.t; this._autoHint = 'last'; if (HINTS_OLD || !sceneAt(this.idx)?.lastSmoke) this.gazeHint(left[0]); } }   // (6판: the pancake smoke is that stage's look — not both)
        else this._oneAt = this._gazeAt = null;
      }
      const waitGaze = this.feelHelp && this._oneAt != null && (this._gazeAt == null || this.t - this._gazeAt < 10);
      // (10/19 evening, user a third time "힌트가 너무 많다" — 레벨 1~10 추천: a sparkle only for the last thing, the way the
      // owner's look and 6판's smoke already wait for it; with more left the 힌트 button is there)
      // (10/24 사용자 "처음에 못 찾으면 힌트 알려 줘": 1~3판 배우는 구간만 — 15초 동안 하나도 못 찾으면 판마다 한 번, 가까운 것 쪽으로 부드럽게:
      // 친구가 그쪽을 보고, 그 자리에 옅은 빛이 세 번, 돋보기 버튼이 반짝. 뒤 판은 원래 규칙 그대로; ②)
      if (this.idx <= 2 && !this._firstHelp && !this.custom && !this.preview && !this.tutEls && !this.talking && this.tStart != null && this.t - Math.max(this.tStart, this.lastFind ?? -99) > 15) {
        const left = this.targets.filter(t => !t.found && !t.friend && !t.furnTarget && !t.spot?.part?.lock);
        if (left.length) { this._firstHelp = true; this.softGlow(left); }
      }
      // 1~5판 막혔을 때 (2~5판의 숨은그림 — 1판은 친구 찾기의 킥킥이 있어요): 25초 soft, 45초 hard, 판마다 한 번씩, 둘 이상 남았을 때만
      if (this.idx >= 1 && this.idx <= 4 && !this.incident && !this.custom && !this.preview && !this.tutEls && !this.talking) {
        const left = this.targets.filter(t => !t.found && !t.friend && !t.furnTarget);
        if (left.length >= 2) {
          // (10/21, "힌트가 너무 많아" a fourth time: one help a stage that comes by itself — the soft one at 50 s, no hard one)
          if (!this._stSoft && !this._autoHint && this.idle > 50) { this._stSoft = true; this._autoHint = 'stuck'; this.stuckHint('soft', left); }
        }
      }
      const lastOnly = HINTS_OLD || this.targets.filter(t => !t.found).length === 1;
      // (10/21: the last thing's sparkle comes once, 10 s after the owner's look — the stage's one automatic help, not every 10 s)
      if (this.idle > this.sparkAfter && !waitGaze && lastOnly && (HINTS_OLD || (this._autoHint === 'last' && !this._lastSpark))) {
        this.twinkleT -= dt;
        if (this.twinkleT <= 0) {
          this.twinkleT = 10; this._lastSpark = true;   // (4 → 6 → 10 s: "힌트가 너무 많다", 10/19 evening)
          const vis = this.targets.filter(t => !t.found && !(t.spot.part && t.spot.part.t < .5) && !W.occluded(t.g, this.worldCenter(t), [this.room.group]));
          const pick = vis[Math.floor(Math.random() * vis.length)];
          if (pick) { const s = W.toScreen(this.worldCenter(pick)); W.fx.burst(s.x, s.y, { n: 5, shape: 'star', speed: 60, gravity: -30, life: .9, size: 9, colors: ['#ffffff', '#fff3a0'] }); }
          // (R7's '이쪽으로 돌려 봐' arrow is off: the user couldn't tell what it meant, 10/18 — turnHint() kept for later)
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
        if (sec <= 10 && sec > 0) { G.audio.sfx(sec % 2 ? 'tick' : 'tock'); if (sec === 10) G.audio.hurry?.(true); }   // (the last 10 s: the music hurries a little)
        this.timerEl.classList.toggle('danger', sec <= 10);
        this.bubble.classList.toggle('red', sec <= 10);
      }
      this.tbarI.style.width = clamp(this.time / this.timeMax * 100, 0, 100) + '%';
      if (this.time <= 0 && !this.targets.every(t => t.found)) { if (this.raidRun) raidSettle(this, 'time'); else this.lose(); }   // (타이머 털기: the count ran out — keep what you found)   // (the last find still flying when the clock ran out: it wins — QA 10/18, 이어하기 then had nothing left to find)
    }
    this.bubble.style.display = this.timerOn && !this.result ? '' : 'none';
    if (this.zoomTools) { if (!this.view0 && this.running) this.view0 = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom }; const v = this.view0, off = W.zoom > (v?.zoom || this.zoom0 || 1) + .12 || (v && (Math.abs(Math.atan2(Math.sin(W.yaw - v.yaw), Math.cos(W.yaw - v.yaw))) > .2 || Math.abs(W.pitch - v.pitch) > .12)) || W.target.distanceTo(W.home) > .6; this.zoomTools.classList.toggle('show', !!(off && this.running && !this.result && !this.tutEls)); /* (not before play starts: the title band, the kit's box — 10/19; a class, so nothing else showing the HUD can bring it back) */ }
    // (one guide at a time, 1~10판 — user 10/20 "힌트가 너무 많아": while a lesson's hand is up, '처음 시점' waits and the hint
    // button with its count steps back)
    if (this.hintBtn) { const q = !!this.tutEls; if (q !== this._hintQuiet) { this._hintQuiet = q; this.hintBtn.style.opacity = q ? '.3' : ''; this.hintBtn.style.transition = 'opacity .3s'; } }
    // friend count bubble
    const fp = W.toScreen(V.copy(this.friend.root.position).setY(this.friend.S * 1.05 + .25));
    this.bubble.style.left = fp.x + 'px'; this.bubble.style.top = fp.y + 'px';
    // tutorial hand follows its target
    if (this.tutHand) {
      let pos = null;
      if (this.tutHandPos) pos = this.tutHandPos();
      else { const g = this.nextGoal(); if (g) pos = g.pos; }
      if (pos) {
        const s = pos.sx != null ? { x: pos.sx, y: pos.sy } : W.toScreen(pos), btn = pos.sx != null;
        // (the fingertip right on the spot — a thing or a button alike: user 10/20 on the phone, "정확히 눌러야 하는 곳에";
        // it used to point from just below-right so as not to cover the thing — 검토 H4)
        this.tutHand.style.left = s.x + 'px'; this.tutHand.style.top = s.y + 'px';
        const tip = this.tutEls?.[0]; if (tip?.classList?.contains('tip')) { const top = s.y < innerHeight * .45; if (tip._low !== top) { tip._low = top; tip.style.top = (top ? innerHeight * .72 : innerHeight * .2) + 'px'; } }   // the band on the far half
      }
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
    else {   // (톡: a person taps what they see — when the finger isn't on it, turn instead of wasting a tap)
      const hit = this.pickAt(x, y), gp = goal.part, ft = goal.item?.furnTarget, on = goal.kind === 'item' ? hit.item === goal.item || (!!goal.item?.inky && hit.kind === 'char' && hit.char === this.villain?.ch) || (!!ft && !hit.item && (hit.furn === ft.f || hit.part?.furn === ft.f)) : hit.part === gp || (!!gp && (hit.furn === gp || hit.furn === gp.furn || hit.part?.furn === gp.furn));   // (a puzzle / TV goal is the furniture itself; a 흑백 furniture target is found by tapping the furniture)
      if (!on) { this._stuck = (this._stuck || 0) + 1; W.rotateBy(this._stuck % 2 ? -110 : 110, 0); this.botT = .25; return; }
    }
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
  state() { return { scene: 'stage', custom: !!this.custom, model: this.model?.kind || null, stage: this.idx + 1, found: this.found, total: this.targets.length, time: +this.time.toFixed(1), timeMax: this.timeMax, elapsed: +((this.tEnd ?? this.t) - (this.tStart ?? 0)).toFixed(1), locks: this.plan.locks.length, result: this.result, dizzy: this.dizzy > 0, keys: this.keys }; }
}
