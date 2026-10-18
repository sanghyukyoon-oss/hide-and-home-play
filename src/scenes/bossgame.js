// 보스전 5종 (2026-10-18): the new-game session's prototypes, played as 숨바꼭집 bosses (user, via that session: "여기서
// 괜찮은 거는 숨바꼭집의 새로운 보스전으로… 특히 엄마 몰래 야식? 이건 대박이다", "보스전 한 4~5개 타입으로 돌려써도", "그냥 난 다
// 썼으면 좋겠어"). Each game (src/bosses/<id>.js, copied from 2026-10-18_asset-lab/games) was written for the lab's `L`
// object; this scene builds that L out of the game's own world, UI and audio and turns the lab's endings into the
// campaign's: a win goes on to the next stage (coins, the boss marked done), a loss plays the boss again, and the home
// button in the game's top bar opens 계속 / 건너뛰기 / 홈.
import * as THREE from 'three';
import { h } from '../ui.js';
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { ITEMS, buildItem } from '../gfx/items.js';
import { renderThumbs } from '../thumbs.js';
import { disposeTree } from '../gfx/kit.js';

const LOAD = {
  yasik: () => import('../bosses/yasik.js'), villa: () => import('../bosses/villa.js'), tag: () => import('../bosses/tag.js'),
  wakeup: () => import('../bosses/wakeup.js'), photo: () => import('../bosses/photo.js'),
  // 추가 인계 2 (10/18 밤): 몽글 호텔 X박 X일 (user: "방배정 할까봐. 대신 x박x일 여행 식으로 호텔로"), 추로야!!! ("추로 주인공으로")
  hotel: () => import('../bosses/hotel.js'), churro: () => import('../bosses/churro.js'),
  // 추가 인계 3: 엄마 몰래 성적표 (user picked it, "추천"), 손전등 숨바꼭질 ("일단 해봐")
  report: () => import('../bosses/report.js'), flashlight: () => import('../bosses/flashlight.js'),
  // 인계 4: 두더지 숨바꼭질 새 버전 (a 쉬어가기, played through this wrapper with interlude: true)
  whack: () => import('../bosses/whack.js'),
  // 인계 5: 쉬어가기 4종 — 무궁화·바꿔치기를 새로 (옛 minis.js 것 대신), 소풍 보물찾기·이불 속 누구게? 새로
  redlight: () => import('../bosses/redlight.js'), inky: () => import('../bosses/inky.js'), picnic: () => import('../bosses/picnic.js'), blanket: () => import('../bosses/blanket.js'),
};
// a game whose stylesheet does not come with it: linked here for the game's time on screen
const SHEETS = { flashlight: new URL('../bosses/flashlight.css', import.meta.url).href };
export const BOSS_GAME_INFO = {
  yasik: { name: '엄마 몰래 야식' }, villa: { name: '몽글 빌라 방 배정' }, tag: { name: '다 잡았다! 술래잡기' },
  wakeup: { name: '아침 깨우기 장치' }, photo: { name: '찰칵! 동네 사진관' },
  hotel: { name: '몽글 호텔 X박 X일' }, churro: { name: '추로야!!!' }, report: { name: '엄마 몰래 성적표' }, flashlight: { name: '손전등 숨바꼭질' }, whack: { name: '두더지 숨바꼭질' },
  redlight: { name: '무궁화 꽃이 피었습니다' }, inky: { name: '잉키의 바꿔치기' }, picnic: { name: '소풍 보물찾기' }, blanket: { name: '이불 속 누구게?' },
};
// the page each game's lab html set on #app (a night sky, a morning sky)
const APP_FLAGS = { yasik: { night: '1' }, churro: { night: '1' }, flashlight: { night: '1' }, wakeup: { morning: '1' } };

// a face icon framed on the head (the lab's own framing, so the games' HUD faces look as they did there)
function faceJob(k, f, key) {
  const c0 = new Char(k); c0.update(0); c0.shadow.visible = false;
  const S = c0.S, top = new THREE.Box3().setFromObject(c0.root, true).max.y, K = 1.18 * 1.08;
  const r0 = S * (k === 'mom' ? .56 : .5), cy0 = S * (k === 'mom' ? .42 : .36), bot = cy0 - r0 * K, tp = Math.max(cy0 + r0 * K, top + S * .06);
  disposeTree(c0.root);
  return { key, build: () => { const c = new Char(k); c.setFace(f); c.update(0); c.shadow.visible = false; return c.root; }, dir: [0, .1, 1], center: [0, (bot + tp) / 2, 0], radius: (tp - bot) / 2 / K };
}

export class BossGameScene {
  constructor(G) { this.G = G; this.name = 'bossgame'; }
  async enter({ kind = 'yasik', after = 4, lv = 0, interlude = false, ...more } = {}) {
    const G = this.G, W = G.world;
    // interlude: a 쉬어가기 between stages, not a boss — a loss still goes on (smaller reward), marked done as 'm'+after
    this.kind = LOAD[kind] ? kind : 'yasik'; this.after = after; this.lv = lv; this.won = false; this.interlude = interlude; this.passed = false; this.fails = G._bossFails?.[after] || 0;
    this._was = { scheme: W.scheme, joyOn: W.joyOn, joyHidden: W.joyHidden, gauge: W.gaugeOn, camLock: W.camLock };
    W.scheme = 'E'; W.joyOn = false; W.joyHidden = true; W.gaugeOn = false; W.camLock = false;
    const app = document.getElementById('app'); for (const [k, v] of Object.entries(APP_FLAGS[this.kind] || {})) app.dataset[k] = v;
    // 아침 깨우기 opens with a little story and a find-the-ball-and-clock phase the first time only — remembered in the save
    // (the lab kept it per page)
    if (this.kind === 'wakeup' && more.intro == null) { const seen = G.save.bossIntro || (G.save.bossIntro = {}); more.intro = !seen.wakeup; if (!seen.wakeup) { seen.wakeup = true; G.persist(); } }
    if (SHEETS[this.kind] && ![...document.styleSheets].some(x => x.href === SHEETS[this.kind])) {
      const l = this.sheet = document.createElement('link'); l.rel = 'stylesheet'; l.href = SHEETS[this.kind]; document.head.append(l);
      await new Promise(res => { l.onload = l.onerror = res; setTimeout(res, 2000); });
    }
    const mod = await LOAD[this.kind](); if (this.dead) return;
    this.L = this.makeL();
    this.game = new mod.Game(this.L);
    await this.game.enter({ lv: this.lv, ...more });   // (more: a game's own extras, e.g. the hotel's night)
  }
  makeL() {
    const G = this.G, S = this;
    const L = {
      THREE, world: G.world, ui: G.ui, audio: G.audio, h, title: BOSS_GAME_INFO[this.kind].name, scene: null, pending: null,
      thumbs: G._bossThumbs || (G._bossThumbs = {}), get bot() { return !!G.bot; }, get botMode() { return G.botMode || 'smart'; }, stats: { log: [], wins: 0, fails: 0 },
      get fast() { return G.fast || 1; }, get gameTime() { return S.t || 0; },
      setBg: bg => G.setBg(bg),
      makeThumbs({ faces = [], items = [] } = {}) {
        const jobs = [];
        for (const [k, f = 'normal'] of faces) { const key = `face_${k}_${f}`; if (!L.thumbs[key] && CHAR_DEFS[k]) jobs.push(faceJob(k, f, key)); }
        for (const t of items) { const key = 'item_' + t; if (!L.thumbs[key] && ITEMS[t]) jobs.push({ key, build: () => buildItem(t, { code: '★★★' }), dir: ITEMS[t].flat ? [.25, 1.3, .7] : [.45, .55, 1], fit: 1 }); }
        if (jobs.length) Object.assign(L.thumbs, renderThumbs(jobs, 128));
      },
      say(ch, text, ms = 1200, cls = '') {
        const b = h('div', { class: 'bubble pop ' + cls }, text); G.ui.wui.append(b);
        const V = new THREE.Vector3();
        const upd = () => { const p = G.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .22)); b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
        upd(); const iv = setInterval(upd, 30); setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
        return b;
      },
      // the lab restarts a game with a level: here a won boss goes on with the campaign, anything else replays the boss
      go(d = {}) {
        if ((S.won || S.passed) && (d.lv == null || d.lv !== S.lv)) return S.finish();
        return G.go('bossgame', { ...d, kind: S.kind, after: S.after, lv: d.lv ?? S.lv, interlude: S.interlude });
      },
      homeBtn: () => G.ui.btn(null, { color: 'purple', icon: 'pause', cls: 'ibtn', onClick: () => S.menu() }),
      setGame() {}, leave() {},
      log(e) {
        L.stats.log.push(e);
        if (e.result === 'win' && !S.won) S.win(e);
        if (e.result === 'fail' && S.interlude && !S.won && !S.passed) S.pass();
        if (e.result === 'fail') { S.fails++; (G._bossFails || (G._bossFails = {}))[S.after] = S.fails; G.stats.log.push({ bossgame: S.kind, result: 'fail' }); }
      },
    };
    return L;
  }
  win(e) {
    const G = this.G; this.won = true;
    const st = e.max ? Math.round(3 * (e.stars || 0) / e.max) : Math.max(0, Math.min(3, e.stars || 0));   // (GPT QA 10/18 P2: hotel reported 45 of 48)
    const coins = this.interlude ? 40 + st * 15 : 150 + st * 30; G.addCoins(coins);
    const done = G.save.bossDone || (G.save.bossDone = {}); done[(this.interlude ? 'm' : 'g') + this.after] = true; G.persist();
    G.stats.log.push({ [this.interlude ? 'mini' : 'bossgame']: this.kind, result: 'win' });
    G.ui.toast(this.interlude ? `쉬어가기 성공! 코인 +${coins}` : `보스 클리어! 코인 +${coins}`, 'green');
  }
  // an interlude lost: still on to the next stage, with a small reward
  pass() {
    const G = this.G; this.passed = true;
    G.addCoins(15);
    const done = G.save.bossDone || (G.save.bossDone = {}); done['m' + this.after] = true; G.persist();
    G.stats.log.push({ mini: this.kind, result: 'pass' });
  }
  finish() { this.G.go('stage', { idx: this.after + 1 }); }
  menu() {
    const G = this.G; if (G.ui.panelOpen) return;
    this.menuOpen = true;
    G.ui.panel({ title: '잠깐!', color: 'purple', close: () => G.ui.closePanel(), body: [h('div', { class: 'txt' }, BOSS_GAME_INFO[this.kind].name)],
      buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => { G.ui.closePanel(); G.go('home'); } }),
        G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => { G.ui.closePanel(); this.finish(); } }),
        G.ui.btn('계속', { color: 'green', icon: 'play', onClick: () => G.ui.closePanel() })] });
  }
  update(dt) {
    if (this.menuOpen && this.G.ui.panelOpen) return;   // 잠깐! menu open: the game waits (GPT QA 10/18 P2)
    this.menuOpen = false;
    this.t = (this.t || 0) + dt;
    this.game?.update(dt);
    // the win panel's next button reads the lab's '다음 밤 / 다음 빌라…': in the campaign it goes to the next stage
    const nb = this.game?.nextBtn; if ((this.won || this.passed) && nb && !nb._relabel) {
      nb._relabel = true; const l = nb.querySelector('.lbl'); if (l) l.textContent = '다음 판';
      // a lost interlude's big button was '다시 하기': here it goes on ('다시' still replays)
      if (this.passed && !this.won) { nb.press = () => this.finish(); nb.addEventListener('pointerup', e => { e.stopImmediatePropagation(); this.finish(); }, { capture: true });
        nb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); this.finish(); } }, { capture: true }); }
    }
  }
  // QA bot: the game's own bot plays; a boss lost twice is skipped
  botStep(dt, mode) {
    if (!this.game) return;
    if (this.fails >= 2 && this.G.ui.panelOpen && !this.won) { if ((this._sk = (this._sk || 0) + dt) > 1.2) { this._sk = -99; this.G.ui.closePanel(); this.finish(); } return; }
    this.game.botStep?.(dt, mode);
  }
  exit() {
    this.dead = true; const W = this.G.world;
    this.game?.exit?.();
    this.sheet?.remove(); this.sheet = null;
    const app = document.getElementById('app'); delete app.dataset.night; delete app.dataset.morning; app.classList.remove('vl', 'party', 'ht', 'ht-night', 'wh', 'rl', 'ik', 'tr', 'bk');
    Object.assign(W, { scheme: this._was.scheme, joyOn: this._was.joyOn, joyHidden: this._was.joyHidden, gaugeOn: this._was.gauge, camLock: this._was.camLock });
    W.onTap = null; W.onDragStart = null; W.onPad = null; W.onRotate = null;
    this.G.ui.clear();
  }
  state() { return { scene: 'bossgame', kind: this.kind, lv: this.lv, won: this.won, ...(this.game?.state?.() || {}) }; }
}
