import { followupAt, settleFollowup, clearFollowupFinish } from '../followup.js';
// 보스전 5종 (2026-10-18): the new-game session's prototypes, played as 숨바꼭집 bosses (user, via that session: "여기서
// 괜찮은 거는 숨바꼭집의 새로운 보스전으로… 특히 엄마 몰래 야식? 이건 대박이다", "보스전 한 4~5개 타입으로 돌려써도", "그냥 난 다
// 썼으면 좋겠어"). Each game (src/bosses/<id>.js, copied from 2026-10-18_asset-lab/games) was written for the lab's `L`
// object; this scene builds that L out of the game's own world, UI and audio and turns the lab's endings into the
// campaign's: a win goes on to the next stage (coins, the boss marked done), a loss plays the boss again, and the home
// button in the game's top bar opens 계속 / 건너뛰기 / 홈.
import * as THREE from 'three';
import { h } from '../ui.js';
import { lensPlus } from '../lens.js';   // 경제 B5 (10/19)
import { giftCard, giftKey } from '../gift.js';
import { starTotal, gameStar } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)   // 놀이 보상 카드 (경제·로비 10/19)
import { Char, CHAR_DEFS } from '../gfx/chars.js';
import { ITEMS, buildItem } from '../gfx/items.js';
import { renderThumbs } from '../thumbs.js';
import { disposeTree } from '../gfx/kit.js';
import { playDialog } from '../story.js';
// 대본 (10/18): who you're with and what's at stake before a game's first time, a word after the first win, and the ending
import { gameLines, ENDING, endCard, choose, UI as SUI } from '../script.js';
import { tr } from '../i18n.js';

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
  // 인계 6 (10/19, user: "새로운 미니게임 2개… 화살표 빼내기 디벨롭", "추천대로 다 넣어줘"): 다 같이 집으로! · 발자국 따라 찾기 (쉬어가기)
  gohome: () => import('../bosses/gohome.js'), tracks: () => import('../bosses/tracks.js'),
};
// a game whose stylesheet does not come with it: linked here for the game's time on screen
const SHEETS = { flashlight: new URL('../bosses/flashlight.css', import.meta.url).href };
export const BOSS_GAME_INFO = {
  yasik: { name: '엄마 몰래 야식' }, villa: { name: '몽글 빌라 방 배정' }, tag: { name: '다 잡았다! 술래잡기' },
  wakeup: { name: '아침 깨우기 장치' }, photo: { name: '찰칵! 동네 사진관' },
  hotel: { name: '몽글 호텔 X박 X일' }, churro: { name: '추로야!!!' }, report: { name: '엄마 몰래 성적표' }, flashlight: { name: '손전등 숨바꼭질' }, whack: { name: '두더지 숨바꼭질' },
  redlight: { name: '무궁화 꽃이 피었습니다' }, inky: { name: '먹물이의 바꿔치기' }, picnic: { name: '소풍 보물찾기' }, blanket: { name: '이불 속 누구게?' },
  gohome: { name: '다 같이 집으로!' }, tracks: { name: '발자국 따라 찾기' },
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
  async enter({ kind = 'yasik', after = 4, lv = 0, interlude = false, resumeFinish = false, resumeWon = false, ...more } = {}) {
    const G = this.G, W = G.world;
    // interlude: a 쉬어가기 between stages, not a boss — a loss still goes on (smaller reward), marked done as 'm'+after
    this.kind = LOAD[kind] ? kind : 'yasik'; this.after = after; this.lv = lv; this.won = false; this._out = false; this.interlude = interlude; this.passed = false; this.fails = G._bossFails?.[after] || 0;
    this._was = { scheme: W.scheme, joyOn: W.joyOn, joyHidden: W.joyHidden, gauge: W.gaugeOn, camLock: W.camLock };
    W.scheme = 'E'; W.joyOn = false; W.joyHidden = true; W.gaugeOn = false; W.camLock = false;
    if (resumeFinish && !G.playMode) { this.won = resumeWon; this.talking = true; await Promise.resolve(); if (!this.dead) await this.finish(); return; }
    const app = document.getElementById('app'); for (const [k, v] of Object.entries(APP_FLAGS[this.kind] || {})) app.dataset[k] = v;
    // 아침 깨우기 opens with a little story and a find-the-ball-and-clock phase the first time only — remembered in the save
    // (the lab kept it per page)
    if (this.kind === 'wakeup' && more.intro == null) { const seen = G.save.bossIntro || (G.save.bossIntro = {}); more.intro = !seen.wakeup; if (!seen.wakeup) { seen.wakeup = true; G.persist(); } }
    // 엄마 몰래 야식, 첫째 밤: a step-by-step practice until it's been won once (bossIntro.yasik — 1: the basics done, the
    // trip still guided; 2: done; the game logs { practice } as it goes); never for the bots
    // (off by default since 10/18 — user: "너무 친절함 튜토가. 게임을 못하겠어 튜토 보느라"; ?yspr=1 brings the step-by-step back)
    if (this.kind === 'yasik' && this.lv === 0 && more.practice == null && !G.bot && /[?&]yspr=1(&|$)/.test(location.search)) { const n = G.save.bossIntro?.yasik || 0; more.practice = n >= 2 ? null : n ? 'go' : 'press'; }
    if (SHEETS[this.kind] && ![...document.styleSheets].some(x => x.href === SHEETS[this.kind])) {
      const l = this.sheet = document.createElement('link'); l.rel = 'stylesheet'; l.href = SHEETS[this.kind]; document.head.append(l);
      await new Promise(res => { l.onload = l.onerror = res; setTimeout(res, 2000); });
    }
    // a game file that fails to arrive (a dropped request on a shaky phone network) is asked for again twice, with a fresh
    // address (the browser remembers a failed module); if it still won't come, say so and go on rather than freeze
    let mod = null;
    for (let i = 0; i < 3 && !mod && !this.dead; i++) {
      try { mod = i ? await import(`../bosses/${this.kind}.js?retry=${i}`) : await LOAD[this.kind](); }
      catch (e) { console.warn('boss game load failed', this.kind, i, e?.message); await new Promise(r => setTimeout(r, 700 * (i + 1))); }
    }
    if (this.dead) return;
    if (!mod) { G.ui.toast('놀이를 불러오지 못했어요 · 홈에서 다시 이어할 수 있어요', 'red'); setTimeout(() => !this.dead && G.go('home'), 1200); return; }
    // 대본: the lead-in, the first time this game and set-up comes up (the game's own rules come after, in the game)
    const GL = gameLines(this.kind, this.lv), said = G.save.gameTalk || (G.save.gameTalk = {});
    if (GL?.lead && !said[this.kind + this.lv] && !G.bot && !G.skipTalk) {
      const LS = this.leadStage(GL.lead);
      await playDialog(G, GL.lead, { onLine: L => LS?.speak(L.who) });
      LS?.dispose(); if (this.dead) return; said[this.kind + this.lv] = true; G.persist();
    }
    G.audio.music?.('play');   // the boss music (사운드 세션 10/19); a game that starts its own keeps it, one that stops it on exit still can
    this.L = this.makeL();
    this.game = new mod.Game(this.L);
    await this.game.enter({ lv: this.lv, ...more });   // (more: a game's own extras, e.g. the hotel's night)
  }
  makeL() {
    const G = this.G, S = this;
    // (campaign: a won game skips its own result panel — the reward card (gift.js) is the result — 실험실·경제 10/19)
    const L = {
      THREE, world: G.world, ui: G.ui, audio: G.audio, h, title: BOSS_GAME_INFO[this.kind].name, scene: null, pending: null,
      thumbs: G._bossThumbs || (G._bossThumbs = {}), get bot() { return !!G.bot; }, get campaign() { return !G.playMode; }, get botMode() { return G.botMode || 'smart'; }, stats: { log: [], wins: 0, fails: 0 },
      get fast() { return G.fast || 1; }, get gameTime() { return S.t || 0; },
      setBg: bg => G.setBg(bg),
      makeThumbs({ faces = [], items = [] } = {}) {
        const jobs = [];
        for (const [k, f = 'normal'] of faces) { const key = `face_${k}_${f}`; if (!L.thumbs[key] && CHAR_DEFS[k]) jobs.push(faceJob(k, f, key)); }
        for (const t of items) { const key = 'item_' + t; if (!L.thumbs[key] && ITEMS[t]) jobs.push({ key, build: () => buildItem(t, { code: '★★★' }), dir: ITEMS[t].flat ? [.25, 1.3, .7] : [.45, .55, 1], fit: 1 }); }
        if (jobs.length) Object.assign(L.thumbs, renderThumbs(jobs, 128));
      },
      // held where it popped up, and a line (not a word or two) carries its speaker's face in front (2D UI 정리 ⑯, user 10/20)
      say(ch, text, ms = 1200, cls = '') {
        const t = String(tr(text) || ''), short = t.replace(/\s/g, '').length <= (/[가-힣]/.test(t) ? 6 : 12), face = !short && ch?.kind && (G.thumbs['face_' + ch.kind] || L.thumbs[`face_${ch.kind}_normal`]);
        const b = h('div', { class: 'bubble pop ' + cls + (face ? ' withface' : '') }, face ? h('img', { class: 'bface', src: face }) : '', text); G.ui.wui.append(b);
        G.audio.voice?.(text, ch?.kind);   // (목소리 — 10/20)
        const p = G.world.toScreen(new THREE.Vector3().copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .22));
        b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px';
        setTimeout(() => b.remove(), ms);
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
        if (e.practice) { const seen = G.save.bossIntro || (G.save.bossIntro = {}); if ((seen[S.kind] || 0) < e.practice) { seen[S.kind] = e.practice; G.persist(); } }
        if (e.result === 'win' && !S.won) S.win(e);
        if (e.result === 'fail' && S.interlude && !S.won && !S.passed) S.pass();
        if (e.result === 'fail') { S.fails++; (G._bossFails || (G._bossFails = {}))[S.after] = S.fails; G.stats.log.push({ bossgame: S.kind, result: 'fail' }); }
      },
    };
    return L;
  }
  win(e) {
    if (this.dead || this.won || this.passed) return;
    const G = this.G; this.won = true;
    const st = e.max ? Math.round(3 * (e.stars || 0) / e.max) : Math.max(0, Math.min(3, e.stars || 0));   // (GPT QA 10/18 P2: hotel reported 45 of 48)
    const reward = settleFollowup(G, followupAt(this.after), { coins: this.interlude ? 40 + st * 15 : 150 + st * 30, won: true, replayWin: true });
    const coins = reward.coins, lens = reward.lens;   // 경제 B5 (10/19): a won 놀이 / boss → a magnifier into the bag (not in practice)
    G.stats.log.push({ [this.interlude ? 'mini' : 'bossgame']: this.kind, result: 'win' });
    // (10/19, user: "미니게임에서 뭐 리워드를 줘야지"): the reward is a card after the game's own end panel (finish), not a toast
    if (G.playMode || G.bot) G.ui.toast(G.playMode ? (this.interlude ? '쉬어가기 성공! (연습)' : '보스 클리어! (연습)') : this.interlude ? `쉬어가기 성공! 코인 +${coins}` : `보스 클리어! 코인 +${coins}`, 'green');
    else { const sb0 = starTotal(G.save); gameStar(G, (this.interlude ? 'm' : 'g') + this.after, st); this.reward = { coins, lens, st, line: e.line || null, starBefore: sb0 }; }   // (line: the game's own result line — 실험실 10/19)   // (practice pays nothing — QA N5)
    if (lens && (G.playMode || G.bot)) G.ui.toasts?.lastElementChild?.append(lensPlus());   // ("+ 돋보기 1" under that toast's words)
  }
  // an interlude lost: still on to the next stage, with a small reward
  pass() {
    if (this.dead || this.passed || this.won) return;
    const G = this.G; this.passed = true;
    settleFollowup(G, followupAt(this.after), { coins: 15 });
    G.stats.log.push({ mini: this.kind, result: 'pass' });
  }
  async finish() {
    const G = this.G;
    if (this.finishing) return; this.finishing = true;
    G.ui.closePanel(true);
    if (!this.won && !this.passed && !G.playMode) settleFollowup(G, followupAt(this.after));   // (the game's result panel went on taking taps under the ending — QA 10/18)
    // 대본: a word after the first win; after the last 야식, the ending (once) and "hide something at home / keep playing"
    // (the ending comes after the last 야식 even when it was skipped from the pause menu — 검토 H6)
    const GLe = gameLines(this.kind, this.lv);
    if ((this.won || GLe?.ending) && !this._out && !G.bot && !G.skipTalk) {
      this._out = true; this.talking = true;   // (the game waits under these words — QA 10/18: a caught-panel wiped the ending)
      const GL = GLe, said = G.save.gameTalk || (G.save.gameTalk = {});
      if (this.won && GL?.out && !said['o' + this.kind + this.lv]) { await playDialog(G, GL.out); if (this.dead) return; said['o' + this.kind + this.lv] = true; G.persist(); }
      if (GL?.ending && !G.save.ending && !G.playMode) {   // (놀이 모음's 셋째 밤 is practice: no ending there — QA 10/18)
        // 엔딩은 몽글이네 방에서 (스토리 룸 10/19): 내 방 로비가 켜져 있으면 그 방으로 가서, 친구들 자리와 먹물이의 노크로 끝냄
        if (G.econ) return G.go('home', { ending: { after: this.after } });
        await playDialog(G, ENDING); await endCard(G);
        G.save.ending = true; G.persist();   // (saved once seen: a reload mid-ending shows it again — QA 10/18)
        clearFollowupFinish(G, this.after);
        if (await choose(G, [SUI.homeHideEnd, SUI.keepPlaying]) === 0) return G.go('myhome');
      }
    }
    // the reward card: who gives it and why (the first win only), the stars, the coins, the magnifier — then the next stage
    // (never before the ending: the last 야식 goes to the ending room above and returns before this — 스토리 룸 10/19)
    if (this.won && this.reward && !G.playMode && !G.bot) {
      const R = this.reward; this.reward = null;
      const r = await giftCard(G, { key: giftKey(this.kind, this.lv), title: this.interlude ? '쉬어가기 성공!' : '보스 클리어!', ...R, retry: R.st < 3 });
      if (this.dead) return;
      // (a small '다시' on the card under three stars: the game's own result panel with its retry is skipped in the campaign)
      if (r === 'retry') { clearFollowupFinish(G, this.after); return G.go('bossgame', { kind: this.kind, after: this.after, lv: this.lv, interlude: this.interlude }); }
    }
    clearFollowupFinish(G, this.after);
    G.go('stage', { idx: this.after + 1 });
  }
  menu() {
    const G = this.G; if (G.ui.panelOpen) return;
    this.menuOpen = true;
    G.ui.panel({ title: '잠깐!', color: 'purple', close: () => G.ui.closePanel(), body: [h('div', { class: 'txt' }, BOSS_GAME_INFO[this.kind].name)],
      buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => { G.ui.closePanel(); G.go('home'); } }),
        G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => { G.ui.closePanel(); this.finish(); } }),
        G.ui.btn('계속', { color: 'green', icon: 'play', onClick: () => G.ui.closePanel() })] });
  }
  // (10/19 user, with a screenshot of the empty lead-in: "이거 나올 때 캐릭터라도 띄워 주면 좋을 거 같은데? 아까 로비 정도 뷰로")
  // whoever speaks the lead-in stands in the middle, about as tall as 몽글이 in the lobby, the one talking hopping; gone
  // before the game builds its own scene
  leadStage(lines) {
    const W = this.G.world, who = [...new Set(lines.map(L => L.who))].filter(k => CHAR_DEFS[k]).slice(0, 3);
    if (!who.length) return null;
    W.yaw = Math.PI / 4; W.pitch = .45; W.updateCam();
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(W.cam.quaternion); r.y = 0; r.normalize();   // (side by side across the screen)
    const gap = .8, g = new THREE.Group(), chars = who.map((k, i) => { const c = new Char(k); c.root.position.copy(r).multiplyScalar((i - (who.length - 1) / 2) * gap); g.add(c.root); return c; });
    W.root.add(g); this._leadChars = chars;
    // measured on the screen like the lobby's close-up (lobby.js closeShot): the tallest about a fifth of the screen, the row
    // inside 80% of its width, feet a little under the middle
    const top = Math.max(...chars.map(c => c.headTop())), V = THREE.Vector3, ends = [chars[0], chars[chars.length - 1]].map(c => c.root.position);
    const meas = (y, z) => { W.target.set(0, y, 0); W.zoom = z; W.updateCam(); const f = W.toScreen(new V(0, 0, 0)), hd = W.toScreen(new V(0, top, 0)), l = W.toScreen(ends[0].clone()), r = W.toScreen(ends[1].clone()); return { feet: f.y, size: f.y - hd.y, wide: Math.abs(r.x - l.x) + (f.y - hd.y) }; };
    const m3 = meas(.3, 3), z = Math.min(9, Math.max(1.5, Math.min(3 * W.H * .2 / Math.max(1, m3.size), 3 * W.W * .8 / Math.max(1, m3.wide))));
    const a = meas(.2, z), b = meas(1.2, z), want = W.H * .56;
    const y = .2 + (want - a.feet) / Math.max(1e-3, b.feet - a.feet);
    W.target.set(0, y, 0); W.zoom = z; W.updateCam();
    for (const c of chars) c.faceTo(W.cam.position.x, W.cam.position.z);
    W.idsDirty = true; W.dirty?.invalidate?.();
    return {
      speak: k => { for (const c of chars) { const me = c.kind === k; c.pose = me ? 'cheer' : 'idle'; c.setFace?.(me ? 'happy' : 'normal'); if (me) c.bump(.3); } W.dirty?.invalidate?.(); },
      dispose: () => { this._leadChars = null; g.parent?.remove(g); try { disposeTree(g); } catch {} W.dirty?.invalidate?.(); },
    };
  }
  update(dt) {
    for (const c of this._leadChars || []) c.update(dt);
    if (this.menuOpen && this.G.ui.panelOpen) return;   // 잠깐! menu open: the game waits (GPT QA 10/18 P2)
    if (this.talking) return;   // the after-words / the ending (finish)
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
    const app = document.getElementById('app'); delete app.dataset.night; delete app.dataset.morning; app.classList.remove('vl', 'party', 'ht', 'ht-night', 'wh', 'rl', 'ik', 'tr', 'bk', 'gh', 'fp');
    Object.assign(W, { scheme: this._was.scheme, joyOn: this._was.joyOn, joyHidden: this._was.joyHidden, gaugeOn: this._was.gauge, camLock: this._was.camLock });
    W.onTap = null; W.onDragStart = null; W.onPad = null; W.onRotate = null;
    this.G.ui.clear();
  }
  state() { return { scene: 'bossgame', kind: this.kind, lv: this.lv, won: this.won, ...(this.game?.state?.() || {}) }; }
}
