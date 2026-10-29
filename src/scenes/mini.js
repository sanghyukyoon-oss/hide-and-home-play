import { followupAt, settleFollowup } from '../followup.js';
// 보스 미니게임 (2026-10-18, user: "보스전마다 미니게임 새로운 미니게임… 지금 새로 구상토론하고있는것중 차용할수있는거 차용",
// "물건숨기는건 중간보스처럼 간간히"). After each region's last stage comes a different little game against that region's
// boss character (src/minis.js): sneak past 냥냥이 to the fridge, spot what 잉키 changed, 무궁화 꽃이 피었습니다 with 너굴이,
// 햄찌's shell game, pop-up hide-and-seek in the park, a torch in the dark camp, and a three-round final. 보물 지키기
// (boss.js) stays as an occasional mid-region boss.
// The frame here is shared: a room, the HUD (boss face, clock bar, a big status line, hearts), one input layer over the
// world (press / move / release / tap — no camera dragging in a minigame), intro talk, a countdown, the result panel.
import * as THREE from 'three';
import { Room } from '../room.js';
import { MapRooms } from '../map.js';
import { layoutFor, THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { h } from '../ui.js';
import { lensPlus } from '../lens.js';   // 경제 B5 (10/19)
import { giftRow, giftKey } from '../gift.js';
import { gameStar } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)   // 놀이 보상: 누가, 왜 주는지 (경제·로비 10/19)
import { Tweens } from '../util.js';
import { disposeTree } from '../gfx/kit.js';
import { playDialog } from '../story.js';
import { GAMES, MINI_INFO, MINI_AFTER } from '../minis.js';
import { miniLead } from '../script.js';

const V = new THREE.Vector3();

export class MiniScene {
  constructor(G) { this.G = G; this.name = 'mini'; }
  async enter({ kind = 'spot', after = 20, p = null } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens(); this.kind = kind; this.after = after; this.p = p; this.objs = []; this.chars = []; this.fails = 0;
    this.info = MINI_INFO[kind] || MINI_INFO.spot;
    // (user 10/29 "미니게임들 약간 카메라 줌인", then "안 잘리는 선에서") fitted to the screen once built; 바꿔치기 stays near whole
    W.fitMul = 1;
    const fit = () => { if (!this.dead && G.scene === this) W.fitToSafe(kind === 'lamp' ? 1.15 : 1.06); };
    setTimeout(fit, 600); setTimeout(fit, 1600); this._fitR = () => setTimeout(fit, 300); addEventListener('resize', this._fitR);
    this.slot = p ? { kind, p } : MINI_AFTER[after]?.kind === kind ? MINI_AFTER[after] : { kind, boss: true }; this.boss = !!this.slot.boss;   // p: 놀이 모음's own settings   // a region's boss game, or a lighter one in between
    this._was = { camLock: W.camLock, joyOn: W.joyOn, gauge: W.gaugeOn };
    W.joyOn = false; W.camLock = true; W.gaugeOn = false; W.onTap = null; W.onDragStart = null; W.onRotate = null;
    this.seq = this.info.seq || [kind]; this.si = 0;
    this.buildHud();
    if (!this.boss) { this.tagEl.innerHTML = '놀이<b>♪</b>'; this.tagEl.style.background = 'var(--g2)'; }
    G.audio.music?.(this.seq.length > 1 ? 'king' : this.boss ? 'boss' : 'play');   // 왕 결정전 · a region's boss game · 쉬어가기 (사운드 세션 10/19)
    await this.startGame(true);
  }
  // ── one game of the sequence (the final has three)
  async startGame(first) {
    const G = this.G;
    this.running = false; this.clearWorld();
    const kind = this.seq[this.si], game = this.game = new GAMES[kind](this, this.info.params?.[this.si] || this.slot.p || {});
    const L = game.map();
    const layout = typeof L === 'string' ? layoutFor(L) : L;
    this.room = layout.rooms ? new MapRooms(G.world, layout) : new Room(G.world, layout);
    G.world.root.add(this.room.group);
    const th = (typeof L === 'string' && THEMES[L]) || layout.theme || THEMES.my;
    G.setBg(game.bg || th.bg); G.world.setLight(game.light || th.light);
    game.build();
    G.world.idsDirty = true; G.world.shadowDirty = true;
    this.tlEl.textContent = game.title; this.faceImg.src = G.thumbs['face_' + (game.face || this.info.face)] || G.thumbs.face_mong;
    this.setStatus(game.goal || '', '');
    // the full explanation the first time a game comes up; after that just the banner (the status line says what to do)
    const seen = G.save.miniSeen || (G.save.miniSeen = {});
    // 대본 (script.js miniLead): lines that fit where the game happens (the panda's camping line came up in the flat too)
    const intro = miniLead(kind, this.boss) || game.intro;
    if (!G.skipTalk && !G.bot && intro?.length && (this.boss || !seen[kind])) { await playDialog(G, this.boss ? intro : intro.slice(0, 2), { title: first ? `${this.boss ? '보스' : '쉬어가기'} · ${this.info.name}` : game.title }); if (this.dead) return; }
    seen[kind] = true; G.persist();
    await G.ui.banner(game.title, '준비… 시작!', 1100); if (this.dead) return;
    this.t = 0; this.running = true; game.start?.();
  }
  clearWorld() {
    const W = this.G.world;
    this.game?.dispose?.();
    for (const o of this.objs) { W.root.remove(o); disposeTree(o); }
    for (const c of this.chars) { W.root.remove(c.root); disposeTree(c.root); }
    if (this.room) { W.root.remove(this.room.group); disposeTree(this.room.group); }
    this.objs = []; this.chars = []; this.room = null;
  }
  // helpers for the games
  add(o) { this.G.world.root.add(o); this.objs.push(o); return o; }
  char(kind, x, z, y = 0) { const c = new Char(kind); c.root.position.set(x, y, z); this.G.world.root.add(c.root); this.chars.push(c); this.G.world.idsDirty = true; return c; }
  frame({ x = 0, y = .6, z = 0, yaw = Math.PI / 4, pitch = .72, zoom = 1.2, w = 7.5, hh = 5.6, cy = .5 } = {}) {
    const W = this.G.world;
    W.home.set(x, y, z); W.target.copy(W.home); W.yaw = yaw; W.pitch = pitch; W.zoom = zoom; W.vYaw = 0; W.autoSpin = 0;
    W.bounds = 99; W.slack = null; W.minZoom = .5; W.maxZoom = 5; W.minPitch = .2; W.maxPitch = 1.4;
    W.setFit(w, hh, cy); W.updateCam?.();
  }
  screen(p) { return this.G.world.toScreen(p); }
  say(ch, text, ms = 1200) {
    const b = h('div', { class: 'bubble pop' }, text); this.G.ui.wui.append(b);
    this.G.audio.voice?.(text, ch?.kind);   // (목소리 — 10/20)
    const root = ch.root || ch;
    const upd = () => { const p = this.G.world.toScreen(V.copy(root.position).setY(root.position.y + (ch.headTop?.() ?? .5) + .2)); b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
    return b;
  }
  // ── HUD
  buildHud() {
    const G = this.G, ui = G.ui, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(ui.ibtn('pause', 'purple', () => this.pause()));
    this.timerEl = h('div', { class: 'timer' }, h('div', { class: 'face' }, this.faceImg = h('img', { src: G.thumbs.face_mong })),
      h('div', { style: 'display:flex;flex-direction:column;flex:1;min-width:0;gap:3px' }, this.tlEl = h('div', { class: 'tl' }, ''), h('div', { class: 'tbar' }, this.tbarI = h('i', { style: 'width:100%' }))),
      this.tnum = h('div', { class: 'num ol' }, ''));
    top.append(this.timerEl, this.tagEl = h('div', { class: 'stagetag ol', html: '보스<b>!</b>' }));
    col.append(top);
    this.statusEl = h('div', { class: 'mini-status ol' }, ''); col.append(this.statusEl);
    this.heartsEl = h('div', { class: 'mini-hearts' }); col.append(this.heartsEl);
    this.extraEl = h('div', { class: 'mini-extra' }); col.append(this.extraEl);
    // one input layer over the world: press / move / release, and a short still press is a tap
    const pad = this.pad = h('div', { class: 'mini-pad' });
    document.getElementById('app').append(pad);
    let down = null;
    this._release = () => { if (down) { down = null; this.game?.up?.(); } };   // (QA3-mini10: the pause lets go of a held press)
    pad.addEventListener('pointerdown', e => { if (!this.running || this.paused) return; e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch {} down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; this.game?.down?.(e.clientX, e.clientY); });
    pad.addEventListener('pointermove', e => { if (!this.running || this.paused) return; this.game?.move?.(e.clientX, e.clientY, !!down); });
    // (QA3-mini10, GPT QA TECH-04) a lift ends a press and may be a tap; a press the system took away (pointercancel, a lost
    // capture) only lets go — it was never a tap. A held press is let go even while paused, so nothing runs on by itself after.
    const end = (e, cancelled) => {
      if (!down || e.pointerId !== down.id) return; const d = down; down = null;
      this.game?.up?.(e.clientX, e.clientY);
      if (cancelled || !this.running || this.paused) return;
      if (performance.now() - d.t < 450 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 22) this.game?.tap?.(e.clientX, e.clientY);
    };
    pad.addEventListener('pointerup', e => end(e, false)); pad.addEventListener('pointercancel', e => end(e, true)); pad.addEventListener('lostpointercapture', e => end(e, true));
    pad.addEventListener('contextmenu', e => e.preventDefault());
  }
  setStatus(text, cls = '') { this.statusEl.textContent = text; this.statusEl.className = 'mini-status ol ' + cls; }
  setClock(left, total) { this.tnum.textContent = String(Math.max(0, Math.ceil(left))); this.tbarI.style.width = Math.max(0, left / total * 100) + '%'; this.timerEl.classList.toggle('danger', left < 8); }
  setHearts(n, max) { this.heartsEl.innerHTML = ''; for (let i = 0; i < max; i++) this.heartsEl.append(h('i', { class: i < n ? 'on' : '' }, '♥')); }
  setScore(text) { this.tnum.textContent = text; }
  // ── end of a game: the next of the sequence, or the result
  async done(win, detail = '') {
    if (!this.running) return; this.running = false;
    const G = this.G;
    if (win && this.si < this.seq.length - 1) {
      G.audio.sfx('special'); G.world.fx.confetti(50);
      await G.ui.banner('통과!', `${this.si + 1} / ${this.seq.length}`, 1100); if (this.dead) return;
      this.si++; return this.startGame(false);
    }
    this.result = win ? 'win' : 'lose';
    if (win) {
      const reward = settleFollowup(G, followupAt(this.after), { coins: this.boss ? 120 + this.si * 30 : 50, won: true, replayWin: true });
      const coins = reward.coins, lens = reward.lens;   // 경제 B5 (10/19): a won 놀이 → a magnifier into the bag (not in practice)
      G.audio.sfx('win'); G.world.fx.confetti(140);
      gameStar(G, 'm' + this.after, this.boss ? 3 : 2);   // (별 상자: no stars in these — a win is 2, the flashlight boss 3)
      G.stats.log.push({ mini: this.kind, result: 'win' });
      setTimeout(() => !this.dead && G.ui.panel({ title: this.boss ? `${this.info.name} 승리!` : `${this.info.name} 성공!`, color: 'green',
        body: [...(G.playMode ? [] : [giftRow(G, giftKey(this.kind, 0, this.boss))].filter(Boolean)), h('div', { class: 'txt' }, detail || this.info.winLine || '해냈다!'), h('div', { class: 'reward' }, G.playMode ? '연습이라 코인은 없어' : `코인 +${coins}`)],
        buttons: [this.nextBtn = G.ui.btn('다음 판', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', { idx: this.after + 1 }) })] }), 900);
      if (lens) setTimeout(() => !this.dead && G.ui.panelOpen?.querySelector('.reward')?.after(lensPlus()), 900);   // ("+ 돋보기 1" under the coins; same delay, so right after that panel)
    } else {
      G.audio.sfx('lose'); this.fails++;
      G.stats.log.push({ mini: this.kind, result: 'fail' });
      setTimeout(() => !this.dead && G.ui.panel({ title: '아깝다…!', color: 'red', body: [h('div', { class: 'txt' }, detail || this.game?.tip || '한 번 더 해 보자!')],
        buttons: [G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => G.go('stage', { idx: this.after + 1 }) }),
          this.nextBtn = G.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => G.go('mini', { kind: this.kind, after: this.after, p: this.p }) })] }), 900);   // (놀이 모음's own settings stay — QA 10/18)
    }
  }
  pause() {
    if (this.result || !this.running) return;
    const G = this.G; this.paused = true; this._release?.();
    G.ui.panel({ title: '잠깐!', color: 'purple', close: () => { G.ui.closePanel(); this.paused = false; }, body: [h('div', { class: 'txt' }, this.game?.goal || '')],
      buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => { G.ui.closePanel(); G.go('home'); } }), G.ui.btn('계속하기', { color: 'green', cls: 'big', onClick: () => { G.ui.closePanel(); this.paused = false; } }),
        G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => { G.ui.closePanel(); G.go('stage', { idx: this.after + 1 }); } })] });
  }
  update(dt) {
    if (this.paused) return;   // (QA3-mini10, TECH-05) the scene's tweens wait too: cups, pop-ups, the 바꿔치기 peek
    this.tw.update(dt);
    for (const c of this.chars) c.update(dt);
    this.room?.update?.(dt);
    if (!this.running || !this.game) return;
    this.t += dt; this.game.update(dt);
  }
  // QA bot: the game plays itself; on the result panel it goes on (a lost game twice → skip)
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.5 && this.G.ui.panelOpen) { this._endT = 0; if (this.result === 'lose' && this.fails >= 2) this.G.go('stage', { idx: this.after + 1 }); else this.nextBtn?.press(); } return; }
    if (this.running && !this.paused) this.game?.bot?.(dt, mode);
  }
  exit() {
    this.dead = true; const W = this.G.world; W.fitMul = 1; removeEventListener('resize', this._fitR);
    this.clearWorld(); this.pad?.remove();
    W.camLock = this._was.camLock; W.joyOn = this._was.joyOn; W.gaugeOn = this._was.gauge;
    this.G.ui.clear(); this.tw.clear();
  }
  state() { return { scene: 'mini', kind: this.kind, game: this.seq[this.si], running: !!this.running, result: this.result || null }; }
}
