// 몽글 TV (10/19): the arcade inside the world (user: "레데리나 지티에이처럼 게임기 누르면 미니게임 나오는 거", "2d게임으로,
// 약간 픽셀 느낌", "꽤 중간이나 어려운 레벨로 만들고 성공하면 손가락 몇 개 주는 느낌"). A TV or a monitor in a stage (pcdesk ·
// officedesk · tvlow · tvstand) and the TV in 내 방 open an old CRT with a 160×120 pixel game, ported from the story room's
// prototype (sumbak-story/proto/monitor-tv.html — look and tone approved: "그래픽이나 톤은 저거 맞는 것 같음"):
//   이삿짐 쌓기   a box slides side to side; tap to drop it on the stack, what hangs over falls off
//   몽글 점프     몽글이 runs along the alley; tap to jump the boxes and pots, last till the bar fills
//   상자 깨기     a pillow bounces a ball into the boxes; three of them hide a friend, find all three
// After the user played it on the phone (10/19 저녁, via 인수인계): no channels to pick — "4개 게임을 각 스테이지마다 랜덤
// 분배… 너무 자주 나오지 않아도 괜찮아. 틀면 옵션 선택하는 거 없이 게임만 플레이하게? 그리고 나가기 버튼만", "다 레벨 좀
// 어렵게… 2, 3, 4만 쓸 거야" (어디 숨었게? is out). So about half the stages with a TV have it on, each with one game of its
// own (tvGameFor: the same stage always the same game); the screen and ✕ only. Harder than the prototype, and harder again
// from 4장 (tvLevel). A win pays once a stage: +3 taps (never past the stage's own count), or 30 coins when the taps are full
// ("이거 이기면 손가락 주는 거 아니었나?" — a full hand showed no reward at all). 내 방's TV plays a random one, no reward.
// 10/19 night (user: "그 판 이기면 돈이랑 클릭 몇 개 주기"): a win pays both, +3 taps and 30 coins, shown with the hand and the
// coin on the CLEAR! card and under the screen; the screen got a soft glass sheen and curved, darker edges.
// One 2D canvas while it's open, wiped on close (iPhone memory: sumbakkokjip-phone-memory). Words: script.js MONITOR_TV.
// The pixel letters on the canvas (TAP TO START, CLEAR!, TRY AGAIN, +3) are a picture: a 3×5 bitmap font below, no web font.
import * as THREE from 'three';
import { h, ICON } from './ui.js';
import { tr } from './i18n.js';
import { MONITOR_TV as T, newCard } from './script.js';
import { EN } from './i18n-en-dict.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { REGIONS, regionOf } from './stages.js';

export const TV_TYPES = new Set(['pcdesk', 'officedesk', 'tvlow', 'tvstand']);
export const tvLevel = idx => (Math.max(0, REGIONS.indexOf(regionOf(Math.min(69, Math.max(0, idx || 0))))) >= 3 ? 'hard' : 'mid');
export const TV_GAMES = ['stack', 'run', 'brk'];
const TV_CH = { stack: 2, run: 3, brk: 4 };   // (the prototype's channel numbers, on the set's label)
export const TV_COINS = 30;   // a win: about a quarter of a stage clear, under a secret find (+50)
export const TV_TAPS = 3;     // and the taps, on top of the stage's own count
// this file's own words (script.js is the story room's): both rewards on the start line
const K = (ko, en) => { EN[ko] = en; return ko; };
const TT = { win: K('이기면', 'Win:') };
// which stages have it on, and which game: from the stage number alone, so a retry or a replay is the same (null = off).
// About half the stages; with the v150 maps the TV is on at 6판 몽글 점프, 14판 이삿짐, 20·30판 상자 깨기, 64판 이삿짐.
const mix = n => { let x = Math.imul((n + 12) ^ 0x5bd1e995, 0x9E3779B1) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x85EBCA77) >>> 0; x ^= x >>> 13; return x >>> 0; };
export const tvGameFor = idx => { const m = mix(idx); return m % 2 ? TV_GAMES[(m >>> 9) % 3] : null; };
const fill = (s, o = {}) => tr(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const NAMES = new Proxy({}, { get: (_, k) => tr(CHAR_DEFS[k]?.name || '') });

// ── pixels (the prototype's, drawing on whichever canvas `g` is)
const W = 160, H = 120;
let g = null;
const PAL = { k: '#2b2030', w: '#fff3f7', p: '#ff8fb8', c: '#ffb3cc', e: '#2b2030', b: '#c98a55', B: '#a9703f', m: '#f2d2b0', g: '#7fd36b', G: '#4fa94a', y: '#ffe14d', W: '#ffffff', M: '#fff1d6' };
const SPR = {
  bunny: ['..kk....kk..', '.kpwk..kwpk.', '.kpwk..kwpk.', '.kpwk..kwpk.', '..kwkkkkwk..', '.kwwwwwwwwk.', 'kwwwwwwwwwwk', 'kwwekwwkewwk', 'kwcwwwwwwcwk', 'kwwwwkkwwwwk', 'kwwwwwwwwwwk', '.kwwwwwwwwk.', '..kkkkkkkk..'],
  bear:  ['.kkk....kkk.', 'kbBbk..kbBbk', 'kbbbkkkkbbbk', '.kbbbbbbbbk.', 'kbbbbbbbbbbk', 'kbbekbbkebbk', 'kbbbbmmbbbbk', 'kbcbmkkmbcbk', 'kbbbbmmbbbbk', '.kbbbbbbbbk.', '..kkkkkkkk..'],
  frog:  ['.kkk....kkk.', 'kWWWk..kWWWk', 'kWekgkkgkeWk', '.kkggggggkk.', 'kggggggggggk', 'kgggggggggGk', 'kgcggggggcgk', 'kggkkkkkkggk', 'kgggggggggGk', '.kggggggggk.', '..kkkkkkkk..'],
  mong:  ['..kk....kk..', '.kMMk..kMMk.', '.kMMMkkMMMk.', 'kMMMMMMMMMMk', 'kMMekMMkeMMk', 'kMcMMMMMMcMk', 'kMMMMkkMMMMk', '.kMMMMMMMMk.', '..kkkkkkkk..'],
};
function spr(name, x, y, flip = false) {
  const s = SPR[name], w = s[0].length;
  for (let r = 0; r < s.length; r++) for (let c = 0; c < w; c++) { const ch = s[r][flip ? w - 1 - c : c]; if (ch === '.') continue; g.fillStyle = PAL[ch]; g.fillRect(Math.round(x + c), Math.round(y + r), 1, 1); }
}
const sw = n => SPR[n][0].length, sh = n => SPR[n].length;
function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
// 3×5 letters (M, N, W wider); `y` is the baseline as with fillText, size 16 = twice as big
const GL = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'], '+': ['...', '.#.', '###', '.#.', '...'], '-': ['...', '...', '###', '...', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'], '.': ['.', '.', '.', '.', '#'], ':': ['.', '#', '.', '#', '.'], ' ': ['..', '..', '..', '..', '..'],
};
function px(text, x, y, col = '#fff', size = 8) {
  const s = size >= 16 ? 2 : 1, cs = [...String(text).toUpperCase()].map(c => GL[c] || GL[' ']);
  let at = Math.round(x - (cs.reduce((a, q) => a + q[0].length, 0) + cs.length - 1) * s / 2);
  const top = Math.round(y - 5 * s);
  g.fillStyle = col;
  for (const q of cs) { for (let r = 0; r < 5; r++) for (let c = 0; c < q[r].length; c++) if (q[r][c] === '#') g.fillRect(at + c * s, top + r * s, s, s); at += (q[0].length + 1) * s; }
}
function hand(x, y) { const s = ['..k.....', '.kwk....', '.kwk....', '.kwkkkk.', 'kwkwkwkk', 'kwwwwwwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..']; for (let r = 0; r < s.length; r++) for (let c = 0; c < s[r].length; c++) { const ch = s[r][c]; if (ch !== '.') rect(x + c * 2, y + r * 2, 2, 2, ch === 'k' ? '#2b2030' : '#ffffff'); } }
// a cardboard box (centre x, top y, width, height), lid open by `lid`
function cbox(x, y, w = 26, h = 20, lid = -1) {
  const L = x - w / 2; rect(L - 1, y - 1, w + 2, h + 2, '#2b2030'); rect(L, y, w, h, '#d9a066'); rect(L, y + h - Math.min(5, h / 3), w, Math.min(5, h / 3), '#c0864c'); rect(x - 2, y, 4, h, '#f3d9a4');
  if (lid >= 0) { const ly = y - 1 - Math.round(lid * 9); rect(L - 2, ly - 4, w + 4, 6, '#2b2030'); rect(L - 1, ly - 3 - Math.round(lid * 3), w + 2, 4, '#e7b47c'); }
}
const stars = Array.from({ length: 22 }, () => ({ x: Math.random() * W | 0, y: Math.random() * 46 | 0, t: Math.random() * 6 }));
const MOON = ['..yyy..', '.yyy...', 'yyy....', 'yyy....', 'yyy....', '.yyy...', '..yyy..'];
function night(t, floorY = 92) {
  rect(0, 0, W, H, '#1d1640'); rect(0, 34, W, 30, '#2a2058'); rect(0, 52, W, 20, '#35296c');
  for (const s of stars) if (Math.sin(t * 2 + s.t) > -.2) rect(s.x, s.y, 1, 1, '#fff6c8');
  MOON.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'y') rect(132 + i, 8 + j, 1, 1, '#ffe9a8'); }));
  rect(0, floorY, W, H - floorY, '#5b4a3a'); for (let x = 0; x < W; x += 16) rect(x, floorY, 1, H - floorY, '#6d5a47'); rect(0, floorY, W, 2, '#7d6852');
}
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

// ── the TV in the room: a little pixel picture on its screen (one 64×36 texture for every screen in the room), dark at
// the start, then on with a flicker, and a flicker again every few seconds — it's on, you can tap it. off(f): the TV's own
// screen instead (a 흑백 target not found yet). screenAt: is (x, y) on that screen (always the TV, even right by a drawer)?
// One sheet (10/19, user: "뭔가 텍스처도 겹쳐 있어"): the picture is opaque and covers the whole screen, the set's own
// screen is hidden while it shows, and the flicker dims it instead of fading it — a see-through plane sat on layer 2 (no
// ink, not in the ID pass), so the old screen's face and lines showed through it.
export function tvScreens(furns, { off = null } = {}) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const g0 = g; g = c.getContext('2d');
  rect(0, 0, 64, 36, '#1d1640'); rect(0, 12, 64, 10, '#2a2058'); rect(0, 18, 64, 10, '#35296c');
  for (const [x, y] of [[4, 3], [13, 7], [21, 2], [30, 9], [38, 4], [45, 10], [9, 12], [34, 1], [26, 14]]) rect(x, y, 1, 1, '#fff6c8');
  MOON.forEach((r, j) => [...r].forEach((q, i) => { if (q === 'y') rect(52 + i, 3 + j, 1, 1, '#ffe9a8'); }));
  rect(0, 28, 64, 8, '#5b4a3a'); for (let x = 0; x < 64; x += 8) rect(x, 28, 1, 8, '#6d5a47'); rect(0, 28, 64, 1, '#7d6852');
  cbox(14, 21, 12, 7, 0); spr('mong', 30, 19); spr('bunny', 46, 15);
  g = g0;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const list = new Map(), sz = new THREE.Vector3(), ct = new THREE.Vector3();
  for (const f of furns) {
    if (!f || !TV_TYPES.has(f.type) || list.has(f)) continue;
    let scr = null; f.group.traverse(o => { if (!scr && o.isMesh && /-screen$/.test(o.geometry?.name || '')) scr = o; });
    const e = { f, scr, plane: null, wait: 1 + Math.random() * 1.6, k: -1, on: false, lvl: -1 };
    if (scr) {
      const geo = scr.geometry; if (!geo.boundingBox) geo.computeBoundingBox();
      const b = geo.boundingBox; b.getSize(sz); b.getCenter(ct);
      const pg = new THREE.PlaneGeometry(sz.x, sz.y); pg.translate(ct.x, ct.y, b.max.z + .002);
      const p = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: tex }));
      p.position.copy(scr.position); p.quaternion.copy(scr.quaternion); p.scale.copy(scr.scale); p.visible = false; p.userData.tvGlow = true;
      scr.parent.add(p); e.plane = p;
    }
    list.set(f, e);
  }
  const FLICK = [.3, 1, .55, 1], DARK = .06;   // (brightness: off, then the flicker steps)
  return {
    has: f => list.has(f),
    update(dt) {
      for (const e of list.values()) {
        const p = e.plane; if (!p) continue;
        const dark = !!off?.(e.f);
        e.wait -= dt;
        if (e.k < 0 && e.wait <= 0) { e.k = 0; e.on = true; e.wait = 5 + Math.random() * 5; }
        let lv = e.on ? 1 : DARK;
        if (e.k >= 0) { e.k += dt; const i = Math.floor(e.k / .1); if (i >= FLICK.length) e.k = -1; else lv = FLICK[i]; }
        if (p.visible === dark) { p.visible = !dark; if (e.scr) e.scr.visible = dark; }
        if (!dark && e.lvl !== lv) { e.lvl = lv; p.material.color.setScalar(lv); }
      }
    },
    screenAt(world, f, x, y, pad = 6) {
      const p = list.get(f)?.plane; if (!p || !p.visible) return false;
      const b = new THREE.Box3().setFromObject(p); if (b.isEmpty()) return false;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const qx of [b.min.x, b.max.x]) for (const qy of [b.min.y, b.max.y]) for (const qz of [b.min.z, b.max.z]) { const s = world.toScreen(new THREE.Vector3(qx, qy, qz)); x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); }
      return x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad;
    },
    dispose() {
      for (const e of list.values()) if (e.plane) { e.plane.parent?.remove(e.plane); e.plane.geometry.dispose(); e.plane.material.dispose(); if (e.scr) e.scr.visible = true; }
      list.clear(); tex.dispose(); c.width = c.height = 0;
    },
  };
}

// ── the CRT itself
let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `.mtv{position:absolute;inset:0;z-index:30;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(42,20,60,.62);touch-action:none;animation:fadein .2s;transition:opacity .18s}
.mtv.out{opacity:0}
.mtv-box{position:relative;width:min(calc(100vw - 32px),420px,calc((100vh - 290px) * 1.15));width:min(calc(100vw - 32px),420px,calc((100dvh - 290px) * 1.15));display:flex;flex-direction:column;gap:10px;color:#2b2030;font-family:var(--font)}
.mtv-mon{background:linear-gradient(180deg,#ece4d2,#cfc4ad);border:4px solid #2b2030;border-radius:24px;padding:14px 14px 8px;box-shadow:0 8px 0 -2px #b9ad95,0 14px 24px -10px rgba(43,32,48,.45)}
.mtv-scr{position:relative;background:#141026;border:4px solid #2b2030;border-radius:14px;overflow:hidden;aspect-ratio:4/3}
.mtv-scr canvas{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;cursor:pointer;animation:mtvon .32s cubic-bezier(.2,1.2,.4,1)}
.mtv-scr::before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:10px;mix-blend-mode:screen;background:radial-gradient(130% 85% at 16% -8%,rgba(255,255,255,.16),rgba(255,255,255,0) 46%),linear-gradient(118deg,rgba(255,255,255,0) 8%,rgba(255,255,255,.09) 9%,rgba(255,255,255,.035) 26%,rgba(255,255,255,0) 27%,rgba(255,255,255,0) 62%,rgba(255,255,255,.05) 63%,rgba(255,255,255,0) 71%);box-shadow:inset 0 0 18px 4px rgba(0,0,0,.42),inset 0 0 3px 1px rgba(255,255,255,.08)}
.mtv-scr::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px),radial-gradient(ellipse at 50% 50%,transparent 60%,rgba(0,0,0,.45));mix-blend-mode:multiply}
@keyframes mtvon{0%{transform:scale(1,.02);filter:brightness(3)}60%{transform:scale(1,1.04);filter:brightness(1.4)}100%{transform:none;filter:none}}
.mtv-lbl{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding:0 4px;font-size:12px;letter-spacing:.12em}
.mtv-brand{color:#8a7e66}.mtv-chn{color:#6a4fd6}
.mtv-led{width:10px;height:10px;border-radius:50%;background:#7bff9a;box-shadow:0 0 8px #7bff9a;border:2px solid #2b2030}
.mtv-say{min-height:2.5em;background:#fffaf2;border:3px solid #2b2030;border-radius:14px;padding:5px 12px;font-size:17px;line-height:1.25;text-align:center;display:flex;align-items:center;justify-content:center;word-break:keep-all}
.mtv-say .mtv-coin svg,.mtv-say .mtv-ico svg{width:1.15em;height:1.15em;vertical-align:-.22em;margin:0 1px 0 3px}
.mtv-say .mtv-ico{white-space:nowrap;margin-left:2px}
.mtv-x{position:absolute!important;right:-12px;top:-14px;z-index:2}
@media (prefers-reduced-motion: reduce){.mtv-scr canvas{animation:none}}`;
  document.head.append(s);
}

// Open it. level 'mid' | 'hard'; game 'stack' | 'run' | 'brk' (none: a random one). pay (a campaign stage): { state() →
// 'gain' | 'coin' | 'already', win() → { taps } | { coins } | null } — win() is asked on every win and pays only once.
// Resolves when it's closed: { won } (any win).
export function openMongleTV(G, { level = 'mid', game = null, pay = null } = {}) {
  if (G.tv) return G.tv.done;
  style();
  let resolve; const done = new Promise(r => { resolve = r; });
  const lv = level === 'hard' ? 'hard' : 'mid';
  const A = G.audio;
  const beep = (f, d = .07, type = 'square', v = .05) => {
    try {
      const c = A?.ctx; if (!c || A.muted || c.state !== 'running') return;
      const o = c.createOscillator(), a = c.createGain(); o.type = type; o.frequency.value = f; a.gain.value = v;
      o.connect(a); a.connect(A.sfxBus || A.master || c.destination); o.start(); a.gain.exponentialRampToValueAtTime(.0001, c.currentTime + d); o.stop(c.currentTime + d + .02);
    } catch {}
  };
  let alive = true, wonAny = false, gain = null;   // gain: what the last win paid ({ taps } | { coins } | null)
  const fanfare = () => [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => alive && beep(f, .1), k * 110));

  // the page
  const cv = h('canvas', { width: W, height: H, 'aria-label': 'MONGLE TV' });
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const key = TV_GAMES.includes(game) ? game : TV_GAMES[Math.random() * TV_GAMES.length | 0];
  const chLbl = h('span', { class: 'mtv-chn' }, 'CH ' + TV_CH[key]);
  const sayEl = h('div', { class: 'mtv-say', role: 'status', 'aria-live': 'polite' });
  const say = t => { sayEl.textContent = t; };
  const xb = G.ui.ibtn('close', 'red', () => close()); xb.classList.add('mtv-x');
  const box = h('div', { class: 'mtv-box' },
    h('div', { class: 'mtv-mon' }, h('div', { class: 'mtv-scr' }, cv), h('div', { class: 'mtv-lbl' }, h('span', { class: 'mtv-brand' }, 'MONGLE·TV'), chLbl, h('span', { class: 'mtv-led' }))),
    sayEl, xb);
  const root = h('div', { class: 'mtv' }, box);
  for (const ev of ['pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'wheel', 'click', 'dblclick', 'contextmenu']) root.addEventListener(ev, e => e.stopPropagation());
  // the first line: start, and the taps a win would bring while there are any to bring
  const sayStart = () => pay?.state() === 'gain'
    ? sayEl.replaceChildren(tr(T.start) + ' · ' + tr(TT.win), h('span', { class: 'mtv-ico', html: ICON.hand }), '+' + TV_TAPS, h('span', { class: 'mtv-ico', html: ICON.coin }), '+' + TV_COINS)
    : say(tr(T.start));
  // a game won: the fanfare, and what this stage still has to give
  const won = () => { fanfare(); wonAny = true; gain = pay?.win?.() || null; return gain; };
  const sayEnd = (ok, line) => {
    if (!ok) return say(line + ' · ' + tr(T.again));
    if (gain?.taps || gain?.coins) return sayEl.replaceChildren(line + ' ·',
      ...(gain.taps ? [h('span', { class: 'mtv-ico', html: ICON.hand }), '+' + gain.taps] : []),
      ...(gain.coins ? [h('span', { class: 'mtv-ico', html: ICON.coin }), '+' + gain.coins] : []));
    say(pay && pay.state() === 'already' ? line + ' · ' + tr(T.already) : line);
  };
  const COIN = ['..kkkk..', '.kyyyyk.', 'kyWyyyok', 'kyWyyyok', 'kyyyyyok', 'kyyyyook', '.kooook.', '..kkkk..'], CC = { k: '#2b2030', y: '#ffd23f', W: '#fff6c4', o: '#d99a0b' };
  function overlay(ok, extra) {
    rect(18, 30, 124, 52, 'rgba(20,16,38,.8)');
    px(ok ? 'CLEAR!' : 'TRY AGAIN', 80, 50, ok ? '#7bff9a' : '#ff8fb8', 16);
    const coin = x => COIN.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') rect(x + i * 2, 59 + j * 2, 2, 2, CC[c]); }));
    if (ok && gain?.taps && gain?.coins) { hand(28, 57); px('+' + gain.taps, 57, 73, '#ffe14d', 16); coin(82); px('+' + gain.coins, 113, 73, '#ffe14d', 16); }
    else if (ok && gain?.taps) { hand(58, 58); px('+' + gain.taps, 92, 72, '#ffe14d', 16); }
    else if (ok && gain?.coins) { coin(52); px('+' + gain.coins, 94, 72, '#ffe14d', 16); }
    else if (extra) px(extra, 80, 72, '#ffffff', 8);
  }

  // ═══ 이삿짐 쌓기 (CH 2) — a box slides side to side; tap to drop it on the stack, what hangs over falls off
  const STACK = (() => {
    const LV = { mid: { goal: 14, v0: 80, dv: 8 }, hard: { goal: 16, v0: 92, dv: 9 } };   // (10/19 "좀 어렵게": the prototype's 'hard' is the start now)
    const BH = 8, BASE = 104; let st, layers, cur, dir, cam, chips, perfect, winT = 0;
    const topY = () => BASE - layers.length * BH;
    function next() { const L = layers[layers.length - 1]; cur = { x: dir > 0 ? 6 : W - 6 - L.w, w: L.w }; }
    return {
      qa: () => ({ st, cx: cur?.x, lx: layers[layers.length - 1].x, n: layers.length - 1 }),
      qaWin() { if (st !== 'play') this.start(); const L = layers[layers.length - 1]; while (layers.length < LV[lv].goal) layers.push({ x: L.x, w: L.w }); cur.x = L.x; this.down(); },
      reset() { st = 'title'; layers = [{ x: 60, w: 40 }]; cur = null; cam = 0; chips = []; sayStart(); },
      start() { st = 'play'; layers = [{ x: 60, w: 40 }]; dir = 1; cam = 0; chips = []; perfect = 0; gain = null; next(); say(tr(T.stack.go) + ' ' + fill(T.stack.count, { n: 0, goal: LV[lv].goal })); },
      down() {
        if (st === 'title' || st === 'end') return this.start(); if (st !== 'play') return;
        const L = layers[layers.length - 1], a = Math.max(cur.x, L.x), b = Math.min(cur.x + cur.w, L.x + L.w), over = b - a;
        if (over <= 0) { st = 'end'; chips.push({ x: cur.x, w: cur.w, y: topY() - BH, vy: 0 }); beep(150, .25, 'sawtooth'); sayEnd(false, fill(T.stack.lose, { n: layers.length - 1 })); return; }
        if (Math.abs(cur.x - L.x) < 1.6) { layers.push({ x: L.x, w: L.w }); perfect = 1; beep(988, .08); }
        else { if (cur.x < L.x) chips.push({ x: cur.x, w: L.x - cur.x, y: topY() - BH, vy: 0 }); if (cur.x + cur.w > L.x + L.w) chips.push({ x: L.x + L.w, w: cur.x + cur.w - (L.x + L.w), y: topY() - BH, vy: 0 }); layers.push({ x: a, w: over }); beep(440 + layers.length * 25, .06); }
        const n = layers.length - 1;
        if (n >= LV[lv].goal) { st = 'win'; winT = .9; won(); sayEnd(true, fill(T.stack.win, { n })); return; }
        dir = -dir; next(); say(fill(T.stack.count, { n, goal: LV[lv].goal }) + (perfect ? ' · ' + tr(T.stack.perfect) : '')); perfect = 0;
      },
      frame(t, now, dt) {
        night(t, 108);
        if (st === 'win' && (winT -= dt) <= 0) st = 'end';
        const n = layers.length - 1, want = Math.max(0, (n - 5) * BH); cam += (want - cam) * Math.min(1, dt * 6);
        g.save(); g.translate(0, Math.round(cam));
        layers.forEach((L, i) => cbox(L.x + L.w / 2, BASE - i * BH, L.w, BH - 1));
        if (st === 'play') { const sp = LV[lv].v0 + LV[lv].dv * n; cur.x += dir * sp * dt; if (cur.x < 4) { cur.x = 4; dir = 1; } if (cur.x + cur.w > W - 4) { cur.x = W - 4 - cur.w; dir = -1; } cbox(cur.x + cur.w / 2, topY() - BH, cur.w, BH - 1); }
        for (const c of chips) { c.vy += 220 * dt; c.y += c.vy * dt; cbox(c.x + c.w / 2, c.y, c.w, BH - 1); }
        chips = chips.filter(c => c.y + cam < H + 20);
        if (st === 'win' || (st === 'end' && n >= LV[lv].goal)) { const L = layers[layers.length - 1]; spr('bunny', L.x + L.w / 2 - 6, topY() - 13 + Math.abs(Math.sin(t * 8)) * -3); }
        g.restore();
        if (st === 'title') { cbox(80, 84, 40, 7); cbox(80, 76, 34, 7); cbox(80, 68, 28, 7); spr('bunny', 74, 54); if (Math.sin(t * 5) > 0) px('TAP TO START', 80, 30); }
        else { rect(4, 4, 6, 50, '#2b2030'); const f = Math.min(1, n / LV[lv].goal); rect(5, 5 + 48 * (1 - f), 4, 48 * f, '#7bff9a'); }
        if (st === 'end') overlay(n >= LV[lv].goal, `${n} / ${LV[lv].goal}`);
      },
    };
  })();

  // ═══ 몽글 점프 (CH 3) — 몽글이 runs along the alley; tap to jump over boxes and pots, last till the bar fills
  const RUN = (() => {
    const LV = { mid: { secs: 25, v0: 82, dv: 3, gap: [55, 100] }, hard: { secs: 30, v0: 90, dv: 3.4, gap: [50, 92] } };
    const GY = 100; let st, me, obs, tm, dist, nextAt, hills;
    return {
      qa: () => ({ st, tm, y: me.y, near: obs.filter(o => o.x > 20 && o.x < 70).map(o => o.x) }),
      qaWin() { if (st !== 'play') this.start(); obs = []; tm = LV[lv].secs - .001; },
      reset() { st = 'title'; me = { y: GY, vy: 0 }; obs = []; tm = 0; hills = Array.from({ length: 6 }, (_, i) => ({ x: i * 34, h: 10 + (i * 7) % 14 })); sayStart(); },
      start() { st = 'play'; me = { y: GY, vy: 0 }; obs = []; tm = 0; dist = 0; nextAt = 60; gain = null; say(tr(T.run.go)); },
      down() { if (st === 'title' || st === 'end') return this.start(); if (st !== 'play') return; if (me.y >= GY - .5) { me.vy = -150; beep(520, .05); } },
      frame(t, now, dt) {
        night(t, GY + 2);
        const sp = st === 'play' ? LV[lv].v0 + LV[lv].dv * tm : 20;
        for (const hl of hills) { hl.x -= sp * .25 * dt; if (hl.x < -34) hl.x += 204; rect(hl.x, GY + 2 - hl.h - 12, 30, hl.h + 12, '#2c2450'); rect(hl.x + 4, GY + 2 - hl.h - 8, 4, 4, '#ffd36b'); rect(hl.x + 18, GY + 2 - hl.h - 8, 4, 4, '#ffd36b'); }
        if (st === 'play') {
          tm += dt; dist += sp * dt;
          // (never closer than one jump can clear: 0.71 s in the air — at full speed two close pots were a sure crash)
          if (dist > nextAt) { const big = lv === 'hard' && Math.random() < .3; obs.push({ x: W + 4, w: big ? 18 : (Math.random() < .5 ? 10 : 8), h: big ? 10 : (Math.random() < .5 ? 10 : 13), pot: Math.random() < .4 }); const [a, b] = LV[lv].gap; nextAt = dist + Math.max(a + Math.random() * (b - a) + sp * .25, sp * .78 + 16); }
          me.vy += 420 * dt; me.y = Math.min(GY, me.y + me.vy * dt); if (me.y >= GY) me.vy = 0;
          for (const o of obs) o.x -= sp * dt; obs = obs.filter(o => o.x > -24);
          const hit = obs.some(o => o.x < 30 + 10 && o.x + o.w > 30 + 2 && me.y - 2 > GY - o.h);
          if (hit) { st = 'end'; beep(150, .25, 'sawtooth'); sayEnd(false, fill(T.run.lose, { s: tm.toFixed(1) })); }
          else if (tm >= LV[lv].secs) { st = 'end'; won(); sayEnd(true, fill(T.run.win, { s: LV[lv].secs })); }
        }
        for (const o of obs) { if (o.pot) { rect(o.x, GY + 2 - o.h, o.w, o.h, '#2b2030'); rect(o.x + 1, GY + 2 - o.h + 5, o.w - 2, o.h - 6, '#c9603c'); rect(o.x + 1, GY + 2 - o.h + 1, o.w - 2, 4, '#5fbf54'); } else cbox(o.x + o.w / 2, GY + 2 - o.h, o.w, o.h - 1); }
        spr('mong', 28, me.y - 8 + (st === 'play' && me.y >= GY && Math.sin(t * 20) > 0 ? -1 : 0));
        if (st === 'title') { if (Math.sin(t * 5) > 0) px('TAP TO START', 80, 40); }
        else { const f = Math.min(1, tm / LV[lv].secs); rect(40, 6, 80, 6, '#2b2030'); rect(41, 7, 78 * f, 4, '#7bff9a'); }
        if (st === 'end') overlay(tm >= LV[lv].secs, `${tm.toFixed(1)}S`);
      },
    };
  })();

  // ═══ 상자 깨기 (CH 4) — 몽글이 bounces a ball off a pillow into the boxes; three boxes hide a friend, find all three
  const BREAK = (() => {
    const LV = { mid: { v: 98, lives: 2, pw: 24, peek: false }, hard: { v: 106, lives: 2, pw: 22, peek: false } };
    const COLS = 7, ROWS = 3, BW = 20, BHt = 9, X0 = 10, Y0 = 18, PY = 92, PW = LV[lv].pw;
    let st, bricks, pad, ball, lives, found, pops, launched, gotWho, drag = false;
    const WHO = ['bunny', 'bear', 'frog'];
    function build() {
      bricks = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bricks.push({ x: X0 + c * BW, y: Y0 + r * (BHt + 1), alive: true, who: null });
      const idx = bricks.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 3); idx.forEach((i, k) => { bricks[i].who = WHO[k]; });
    }
    function serve() { ball = { x: pad.x, y: PY - 3, vx: 0, vy: 0 }; launched = false; }
    function launch() { const a = (Math.random() - .5) * .9, v = LV[lv].v; ball.vx = v * Math.sin(a); ball.vy = -v * Math.cos(a); launched = true; beep(520, .05); }
    const padTo = x => { pad.x = Math.max(PW / 2 + 1, Math.min(W - PW / 2 - 1, x)); };
    return {
      qa: () => ({ st, bx: ball?.x, by: ball?.y, vy: ball?.vy, found, lives }),
      qaWin() { if (st !== 'play') this.start(); found = 3; gotWho = WHO.slice(); },
      reset() { st = 'title'; build(); pad = { x: 80 }; ball = null; pops = []; found = 0; gotWho = []; sayStart(); },
      start() { st = 'play'; build(); pad = { x: 80 }; lives = LV[lv].lives; found = 0; gotWho = []; pops = []; gain = null; serve(); say(tr(T.brk.go)); },
      down(x) { if (st === 'title' || st === 'end') return this.start(); drag = true; padTo(x); if (st === 'play' && !launched) launch(); },
      move(x) { if (drag && st === 'play') padTo(x); },
      up() { drag = false; },
      frame(t, now, dt) {
        night(t, 112);
        if (st === 'play') {
          if (!launched) { ball.x = pad.x; ball.y = PY - 3; }
          else for (let k = 0; k < 4; k++) {
            const hh = dt / 4; ball.x += ball.vx * hh; ball.y += ball.vy * hh;
            if (ball.x < 2) { ball.x = 2; ball.vx = Math.abs(ball.vx); } if (ball.x > W - 2) { ball.x = W - 2; ball.vx = -Math.abs(ball.vx); } if (ball.y < 2) { ball.y = 2; ball.vy = Math.abs(ball.vy); }
            if (ball.vy > 0 && ball.y + 1.5 >= PY && ball.y < PY + 4 && Math.abs(ball.x - pad.x) <= PW / 2 + 1) {   // the pillow: where it lands sets the angle
              const v = LV[lv].v, off = Math.max(-1, Math.min(1, (ball.x - pad.x) / (PW / 2))); ball.vx = v * .85 * off; ball.vy = -Math.sqrt(Math.max(v * v - ball.vx * ball.vx, v * v * .2)); ball.y = PY - 2; beep(300, .03);
            }
            for (const b of bricks) {
              if (!b.alive || ball.x < b.x - 1.5 || ball.x > b.x + BW + 1.5 || ball.y < b.y - 1.5 || ball.y > b.y + BHt + 1.5) continue;
              const qx = Math.min(ball.x - (b.x - 1.5), b.x + BW + 1.5 - ball.x), qy = Math.min(ball.y - (b.y - 1.5), b.y + BHt + 1.5 - ball.y);
              if (qx < qy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
              b.alive = false; beep(700 + Math.random() * 200, .04);
              if (b.who) { found++; gotWho.push(b.who); pops.push({ who: b.who, x: b.x + BW / 2, y: b.y + 2, t: 0 }); say(fill(T.brk.found, { who: NAMES[b.who] })); beep(988, .1); }
              break;
            }
            if (ball.y > H + 2) { lives--; beep(150, .25, 'sawtooth'); if (lives <= 0) { st = 'end'; sayEnd(false, fill(T.brk.lose, { n: found })); } else { serve(); say(fill(T.brk.miss, { n: lives })); } break; }
          }
          if (st === 'play' && found >= 3) { st = 'end'; won(); sayEnd(true, tr(T.brk.win)); }
        }
        for (const b of bricks) if (b.alive) {
          cbox(b.x + BW / 2, b.y, BW - 2, BHt - 1);
          if (b.who && LV[lv].peek && Math.sin(t * 3 + b.x) > .3) { rect(b.x + 6, b.y - 2, 1, 2, '#2b2030'); rect(b.x + 12, b.y - 2, 1, 2, '#2b2030'); }   // (중간: the hidden friend's ear tips poke out now and then)
        }
        for (const p of pops) { p.t += dt; spr(p.who, p.x - 6, p.y - 10 - p.t * 14); }
        pops = pops.filter(p => p.t < 1.4);
        // the pillow, held over 몽글이's head
        rect(pad.x - PW / 2 - 1, PY - 1, PW + 2, 6, '#2b2030'); rect(pad.x - PW / 2, PY, PW, 4, '#ffb3cc'); rect(pad.x - PW / 2 + 2, PY + 1, PW - 4, 1, '#ffe0ec');
        spr('mong', pad.x - 6, PY + 5);
        if (ball && st !== 'title') { rect(ball.x - 2, ball.y - 2, 4, 4, '#2b2030'); rect(ball.x - 1, ball.y - 1, 2, 2, '#ffe14d'); }
        if (st === 'title') { if (Math.sin(t * 5) > 0) px('TAP TO START', 80, 66); }
        else {
          for (let i = 0; i < LV[lv].lives; i++) rect(6 + i * 9, 5, 7, 7, i < lives ? '#ff6b81' : '#5a4f7c');
          WHO.forEach((w, i) => { const got = gotWho.includes(w); rect(118 + i * 13, 4, 11, 10, got ? '#7bff9a' : '#2b2030'); if (got) spr(w, 118 + i * 13 - .5, 3.5 - (sh(w) - 10)); });
        }
        if (st === 'end') overlay(found >= 3, `${found} / 3`);
      },
    };
  })();

  // ── input, the frame loop
  const GAME = { stack: STACK, run: RUN, brk: BREAK }[key];
  const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture?.(e.pointerId); } catch {} const [x, y] = at(e); GAME.down(x, y); });
  cv.addEventListener('pointermove', e => { const [x, y] = at(e); GAME.move?.(x, y); });
  cv.addEventListener('pointerup', () => GAME.up?.());
  cv.addEventListener('pointercancel', () => GAME.up?.());
  // a keyboard: space plays (the middle of the screen), Esc closes
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    else if (e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) { GAME.down(80, 80); setTimeout(() => GAME.up?.(), 60); } }
  };
  addEventListener('keydown', onKey, true);
  // the TV's own music while it plays, the room's back when it closes (사운드 세션 10/19 — it used to turn the room's down)
  let musicBack = null;
  try { musicBack = A?.pushMusic?.('tv'); } catch {}
  let last = performance.now(), raf = 0;
  const loop = now => {
    if (!alive) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
    g = ctx; GAME.frame(now / 1000, now, dt);
    raf = requestAnimationFrame(loop);
  };
  function close() {
    if (!alive) return; alive = false;
    cancelAnimationFrame(raf); removeEventListener('keydown', onKey, true);
    try { musicBack?.(); } catch {}
    cv.width = cv.height = 0;   // (the pixels go now, not when the page lets go of the element — iPhone memory)
    if (g === ctx) g = null;
    root.classList.add('out'); setTimeout(() => root.remove(), 200);
    G.tv = null;
    resolve({ won: wonAny });
  }
  // (QA: headless checks drive it through G.tv.qa — the game's state, a tap, a drag)
  G.tv = { close, done, qa: { game: key, s: () => GAME.qa(), down: (x, y) => GAME.down(x, y), move: x => GAME.move?.(x), up: () => GAME.up?.(), say: () => sayEl.textContent, win: () => GAME.qaWin() } };
  document.getElementById('overlay').append(root);
  g = ctx; GAME.reset();
  raf = requestAnimationFrame(loop);
  newCard(G, 'mongletv');   // the first time: "새로 얻었다! 몽글 TV" for 3 s (no card to read)
  return done;
}
