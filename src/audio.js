// WebAudio-synthesized SFX + streamed background music per scene slot (every slot without its own file plays the lobby song).
import { store } from './util.js';
import { hapticFor } from './feel.js';

// ── 소리 파일 자리 (사운드 세션 10/19, user: "지피티가 효과음 만든 것도 있거든? 비지엠이랑. 이거 받아다가 적용도 해 줘")
// Suno·Google로 만든 곡은 audio/gpt/ 에 넣고, 아래 그 칸의 gpt: null 을 그 파일 경로로 바꾼다 (웹은 폴더를 못 읽어서 이 표가 목록).
// 10/20 사용자 규칙: 음악은 Suno·Google로만 만든다(코드로 만든 곡 X). 자기 곡이 없는 칸은 로비 곡을 그대로 이어서 튼다 —
// 같은 곡이면 장면이 바뀌어도 처음부터 다시 틀지 않는다. gain: 곡끼리 크기 맞춤(1 = 그대로). 주소에 ?bgm=lobby → 전부 로비 곡.
// 음악은 <audio> 하나로 흘려 듣기(스트리밍)만 한다 — 통째로 풀면 아이폰에서 곡당 ~50 MB. 표·만드는 법: audio/README-sound.md
export const BGM = {
  // (10/20 user: "지금 정본 노래 좋음 첫 시작할 때 나오는 노래. 이걸 메인으로" + 수노 곡은 "내가 스샷 찍은 3개만 써") the main song 「햇살 사이 숨은 친구」
  // is what the game opens with (홈·로비·내 집) and the default of every slot (boss·king too, until a song they like); the stages,
  // mini and TV get the three Suno songs
  lobby: { tmp: 'audio/bgm-home-v01.mp4', gpt: null, gain: 1 },   // 홈·로비·내 집 — 메인 곡
  // (10/20 user: "미니게임 노래가 젤 좋음 이거 승격. 미니게임은 따로 노래 쓰지 말고 원래 거 들으면 될 듯 이어지게") the Suno 'ingame' song
  // is the stages' song now, and the mini games play the same file, so it just goes on across
  map: { tmp: 'audio/bgm-home-v01.mp4', gpt: 'audio/gpt/bgm-map.mp4', gain: 1 },   // 스테이지(맵) (Suno 'ingame' 1:02)
  // (10/21 user: "미니게임 노래는 다 좋네? 1, 3으로 돌려 쓰자") the mini games take turns between two Suno songs (gpts)
  mini: { tmp: 'audio/bgm-home-v01.mp4', gpt: 'audio/gpt/bgm-map.mp4', gpts: ['audio/gpt/bgm-map.mp4'], gain: 1 },   // → ['audio/gpt/bgm-mini-1.mp4', 'audio/gpt/bgm-mini-3.mp4'] when the two Suno files are in
  tv: { tmp: 'audio/bgm-home-v01.mp4', gpt: 'audio/gpt/bgm-tv.mp4', gain: 1 },   // 몽글 TV (Suno 'hideandhome-tv-v1' 2:16)
  // (10/20 user: "티비게임에 나오는 노래도 정규 음악으로 넣어 줄래?") the TV song is the boss games' song too
  boss: { tmp: 'audio/bgm-home-v01.mp4', gpt: 'audio/gpt/bgm-tv.mp4', gain: 1 },   // 방탈출 보스판·보스 놀이·엄마 습격    → audio/gpt/bgm-boss.mp4
  king: { tmp: 'audio/bgm-home-v01.mp4', gpt: 'audio/gpt/bgm-tv.mp4', gain: 1 },   // (10/21 user: "4도 좋은데 어디 쓸 만한 데") 마지막 보스·결정전 — Suno minigame-v3 ④
  tense: { gpt: null, gain: 1 },   // 다급할 때 (없으면 지금 곡을 1.07배로) → audio/gpt/bgm-tense.mp4
};
// 효과음 파일 (사운드 10/20, 사용자: "효과음 ㅇㅋ", "ASMR스럽고… 질감 같은 게 잘 느껴지고 디테일한 사운드"): 사내 AI Proxy →
// ElevenLabs sound-generation 으로 만든 audio/sfx/<이름>.mp4 (모노 AAC, 0.1~1.2초, 코드 소리 크기에 맞춤). 파일이 아직 안 왔거나
// 못 읽으면 코드로 만든 소리가 대신 난다. <이름>_<재질>(open_metal …)은 그 재질의 가구에서만 난다(sfxPart, 아래 MAT).
// 하나를 바꾸려면 SFX_FILES.<이름> = '경로' (또는 { src, gain, pitch, vary }), 코드 소리로 되돌리려면 null. 목록: audio/README-sound.md
const SFX_SET = ('tap click btn gearUp gearDown ratchet tick tock tapLow miss found special star coin buy key unlock locked latch win lose cheer ' +
  'whoosh swish swish_paper swish_leaves swish_plastic rustle flip pop place wobble dizzy hop land thump thunk clink blub heart snore ' +
  'giggle hmm gasp angry phew creak slide lift lift_fabric lift_metal lift_ceramic lift_stone lift_plastic open open_metal open_plastic ' +
  'open_paper open_wicker close close_metal close_plastic close_paper close_wicker door door_metal drawer drawer_metal drawer_plastic ' +
  'drawerClose drawerClose_metal drawerClose_plastic').split(' ');
export const SFX_FILES = Object.fromEntries(SFX_SET.map(n => [n, 'audio/sfx/' + n + '.mp4']));
// pitch: 연달아 찾을수록 음이 올라감(코드 소리처럼) · vary: 칠 때마다 높이가 조금씩 달라짐(빠르게 반복되는 소리)
Object.assign(SFX_FILES, {
  found: { src: 'audio/sfx/found.mp4', pitch: true }, pop: { src: 'audio/sfx/pop.mp4', pitch: true }, star: { src: 'audio/sfx/star.mp4', pitch: true },
  tap: { src: 'audio/sfx/tap.mp4', vary: .05 }, tick: { src: 'audio/sfx/tick.mp4', vary: .03 },
  coin: { src: 'audio/sfx/coin.mp4', vary: .06 }, hop: { src: 'audio/sfx/hop.mp4', vary: .08 },
  // (10/20 user: "회전 효과음은 예전 게 더 나은 것 같다") the camera turn's tick is the code sound again
  ratchet: null,
  bloom: 'audio/sfx/bloom.mp4',   // 흑백판 끝 색이 번질 때 '뾰로롱' (사운드 v3 10/20, 종 없이)
  mugunghwa: null,   // (10/21 user: "무궁화꽃이 음성 이상하다, 전에 거가 더 나음") back to 너굴이's voice, one syllable at a time; the TTS take is in _backup/sfx-mugunghwa-tts.mp4
});
// 가구 재질: 부분의 이름표(label)로 정한다 — 첫 번째로 맞는 줄. 없으면 나무(기본 소리).
// (10/20 user, 1판: "쓸모없이 깡깡하는 이상한 소리" — the room's bins are plastic, but 휴지통 was listed as metal)
const MAT = [
  ['fabric', /수건|담요/],
  ['plastic', /김치냉장고|장난감|아이스박스|복합기|턴테이블|라바콘|러버콘|트렁크|양동이|바가지|미끄럼틀|꺼내는 곳|어항|쓰레기 봉투|방수포|BINS|휴지통/],
  ['metal', /금고|냉장고|냉동|자판기|동전|우편함|우체통|실외기|보일러|세탁기|공구함|도구함|캐비닛|맨홀|밥솥|코펠|냄비|솥|그릴|셔터|유치장|순찰차|대문|옥상|돈통|정수기|찜기|분필|우유 투입함|에어컨|엘리베이터/],
  ['paper', /택배|작품 상자|소원 상자|짐칸 상자|장식 상자|^상자|포스터|전단지|차트|신문지/],
  ['wicker', /바구니/],
  ['ceramic', /단지|화분|변기/],
  ['stone', /돌|바위/],
  ['leaves', /덤불|가지|버섯/],
  ['fabric', /방석|이불|쿠션|담요|러그|베개|빈백|빨래|수건|천|식탁보|상보|매트|방화복|커튼/],
];
const matOf = label => { const l = String(label || ''); for (const [m, re] of MAT) if (re.test(l)) return m; return null; };

export function createAudio({ storageKey = 'sbk.mute' } = {}) {
  const A = { ctx: null, master: null, sfxBus: null, musicBus: null, muted: store.get(storageKey, false), voiceOn: store.get('sbk.voice', true), mood: 'home' };
  const MUSIC_VOL = .3;
  function ensure() {
    if (A.ctx) return A.ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { A.ctx = new AC(); } catch { return null; }
    A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : .9; A.master.connect(A.ctx.destination);
    // the squeeze is on the sound effects only (10/20: it sat on everything, so a loud tap pressed the music down with it)
    const comp = A._comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(A.master);
    A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = .8; A.sfxBus.connect(comp);
    A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = MUSIC_VOL; A.musicBus.connect(A.master);
    loadSfxFiles();
    return A.ctx;
  }
  // (QA3 10/19) a touch's pointerdown is not a "user activation" for audio in Safari / Chrome — the lift is — so the first
  // tap's resume could be refused; after a call or Siri iOS leaves the context 'interrupted' (not 'suspended'), which this
  // never resumed: no sound until a reload. Any state but running resumes, on presses and lifts; the music starts once the
  // context really runs (it used to wait for the next touch). The page hidden (home button, another app): everything
  // stops — Android kept the music box playing behind the home screen.
  // (10/20, user: "음악이 끊길 때가 있어 — 터치하거나 돌릴 때") every press, lift and click came here and asked the music
  // again, which wrote the element's pitch setting each time — on iPhone that resets the audio path, a cut you hear. And
  // each haptic tick is a made-up click (feel.js tick1), ~8 a second while turning. Now: made-up events are ignored, and
  // the track that is already playing what was asked is not touched at all.
  const goMusic = () => { if (!A._wantMusic) return; if (A._req && T.url && T.el && !T.el.paused && !T.swapT && !T.stopT) return; A.music(A.mood); };
  A.unlock = e => { if (e && e.isTrusted === false) return; const c = ensure(); if (c && c.state !== 'running' && c.state !== 'closed' && !document.hidden) { const pr = c.resume(); pr?.then?.(goMusic, () => {}); } goMusic(); };
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) addEventListener(ev, A.unlock, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { const c = A.ctx; if (!c || c.state === 'closed') return; try { if (document.hidden) { c.suspend()?.catch?.(() => {}); pauseDecks(); } else c.resume()?.then?.(goMusic, () => {}); } catch {} });
  A.setMuted = m => { A.muted = m; store.set(storageKey, m); if (A.master) A.master.gain.setTargetAtTime(m ? 0 : .9, A.ctx.currentTime, .02); if (T.el && !T.gain) T.el.volume = m || !T.goal ? 0 : MUSIC_VOL; };

  function tone({ type = 'sine', f = 440, f2 = null, dur = .12, vol = .5, attack = .004, at = 0, bus = A._bus || A.sfxBus, q = 0, filter = null, detune = 0, vib = 0 }) {
    const c = A.ctx; if (!c) return;
    const t0 = c.currentTime + at;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 14; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + .02); }
    const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let node = o;
    if (filter) { const fl = c.createBiquadFilter(); fl.type = filter; fl.frequency.value = q || 2000; node.connect(fl); node = fl; }
    node.connect(g).connect(bus); o.start(t0); o.stop(t0 + dur + .03);
  }
  // attack: a soft swell instead of an instant start; grain: a rolling rattle (drawer runners)
  function noise({ dur = .15, vol = .3, at = 0, type = 'bandpass', f = 1800, f2 = null, q = 1, attack = 0, grain = 0 }) {
    const c = A.ctx; if (!c) return;
    const t0 = c.currentTime + at, len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (grain) for (let i = 0, ph = Math.random() * 6; i < len; i++) d[i] *= .45 + .55 * Math.abs(Math.sin(ph + i / c.sampleRate * Math.PI * grain));
    const s = c.createBufferSource(); s.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain();
    if (attack) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); } else g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl).connect(g).connect(A._bus || A.sfxBus); s.start(t0);
  }
  // a small bell: the note, its octave and a faint third partial dying faster
  const bell = (f, at = 0, vol = .2, dur = .5) => { tone({ f, dur, vol, at }); tone({ f: f * 2, dur: dur * .45, vol: vol * .3, at }); tone({ f: f * 3.01, dur: dur * .2, vol: vol * .1, at }); };
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  const hz = semi => 440 * 2 ** ((semi - 9) / 12);

  // ── sound files (SFX_FILES): fetched and decoded once when the audio wakes; until one has arrived, the made sound plays
  const sfxBuf = {};
  let sfxAsked = false;
  function loadSfxFiles() {
    if (sfxAsked || !A.ctx) return; sfxAsked = true;
    // four at a time, the everyday ones first (a burst of ~70 fetches and decodes at once is a memory spike on a phone)
    const FIRST = ['tap', 'btn', 'click', 'pop', 'found', 'miss', 'open', 'close', 'drawer', 'drawerClose', 'whoosh', 'swish', 'lift', 'ratchet'];
    const q = Object.entries(SFX_FILES).filter(([, e]) => typeof e === 'string' ? e : e?.src).sort(([a], [b]) => (FIRST.includes(b) ? 1 : 0) - (FIRST.includes(a) ? 1 : 0));
    const next = () => {
      const it = q.shift(); if (!it) return;
      const [name, e] = it, src = typeof e === 'string' ? e : e.src;
      fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(ab => new Promise((res, rej) => A.ctx.decodeAudioData(ab, res, rej)))
        .then(b => { sfxBuf[name] = b; }, err => console.warn('sfx file', name, src, err?.message || err))
        .finally(next);
    };
    for (let i = 0; i < 4; i++) next();
  }
  function playFile(name, p) {
    const b = sfxBuf[name]; if (!b) return false;
    const e = SFX_FILES[name], c = A.ctx, s = c.createBufferSource(), g = c.createGain();
    let rate = e?.pitch ? 2 ** (PENTA[Math.max(0, p | 0) % 5] / 12) : 1;
    if (e?.vary) rate *= 1 + (Math.random() - .5) * 2 * e.vary;
    s.buffer = b; s.playbackRate.value = rate;
    g.gain.value = e?.gain ?? 1; s.connect(g).connect(A._bus || A.sfxBus); s.start();
    return true;
  }
  // a furniture part's own sound in its material (a metal cupboard, a cardboard box …) when that file is in; else the plain one
  A.sfxPart = (part, name) => {
    const m = matOf(part?.label), v = m && name + '_' + m;
    A.sfx(v && sfxBuf[v] ? v : name);
  };

  A.sfx = (name, p = 0, buzz = true) => {
    // (the material comes off first, then drawerClose reads as close: drawerClose_metal / _plastic had no buzz — 외부 재QA 10/20 TECH-AUDIO-DRAWER-HAPTIC)
    if (buzz) { const b = name.split('_')[0]; hapticFor(b === 'drawerClose' ? 'close' : b); }   // 손맛 2: a tap's sound also buzzes (even with the sound off) — buzz false: it already did (QA3 10/19)
    if (!ensure() || A.muted) return;
    p = Math.min(p, 12);
    // (10/20 user: "무궁화는… 보이스 넣을 건데 디졸브 잘 넣거나 후처리 잘해서 어색하지 않게") the chant: the music steps back under it and comes up again
    if (name === 'mugunghwa') A.duck(4, .32);
    if (name === 'win' || name === 'lose') { A.duck(name === 'win' ? 2.6 : 2); if (A._hurry) A.hurry(false); }   // the jingle over the music, not under it; the hurry is over
    if (playFile(name, p)) return;
    switch (name) {
      case 'tap': tone({ type: 'triangle', f: 700, f2: 980, dur: .06, vol: .25 }); break;
      case 'click': tone({ type: 'square', f: 1300, dur: .03, vol: .1, filter: 'lowpass', q: 3000 }); break;
      // move ⇄ turn (a second-finger tap in F): a little latch — up into turning, down back to moving (10/18)
      case 'gearUp': tone({ type: 'triangle', f: 520, f2: 900, dur: .07, vol: .12 }); noise({ dur: .02, vol: .08, type: 'bandpass', f: 3200, q: 4, at: .045 }); break;
      case 'gearDown': tone({ type: 'triangle', f: 820, f2: 480, dur: .07, vol: .1 }); noise({ dur: .02, vol: .06, type: 'bandpass', f: 2200, q: 4, at: .04 }); break;
      // the turn ratchet (10/18): a tiny woody tick, a little different every time so a fast spin rolls "드르르륵"
      case 'ratchet': { const r = Math.random(); noise({ dur: .016, vol: .1, type: 'bandpass', f: 2100 + r * 800, q: 4 }); tone({ type: 'triangle', f: 640 + r * 140, dur: .014, vol: .04 }); break; }   // (QA3-cam8 "약간 작게" 70% → 10/20 user: "저음에서 소리가 아예 안 들려… 거슬리지 않게 좋게 들리는 정도로" — ×2, a touch lower and longer so it reads as a soft wooden tick)
      case 'btn': tone({ type: 'triangle', f: 520, f2: 820, dur: .08, vol: .3 }); tone({ type: 'sine', f: 1040, dur: .06, vol: .12, at: .03 }); break;
      // 사운드 세션 10/19: a lid / a cupboard door — a little hinge, the air, a soft wooden pop (it was one noise sweep)
      case 'open': tone({ type: 'triangle', f: 640, f2: 900, dur: .07, vol: .05, vib: 25 }); noise({ dur: .18, vol: .13, f: 600, f2: 1500, q: 1.4, attack: .03 }); tone({ type: 'sine', f: 230, f2: 380, dur: .13, vol: .2, at: .02 }); break;
      // a drawer: the runners roll (grain), then it knocks against its stop
      case 'drawer': noise({ dur: .24, vol: .19, f: 800, f2: 1700, q: 1.8, attack: .03, grain: 34 }); tone({ type: 'sine', f: 190, f2: 120, dur: .08, vol: .22, at: .2 }); noise({ dur: .04, vol: .1, type: 'lowpass', f: 900, at: .2 }); break;
      case 'close': tone({ type: 'sine', f: 200, f2: 92, dur: .11, vol: .3 }); noise({ dur: .06, vol: .12, type: 'lowpass', f: 700 }); tone({ type: 'triangle', f: 1400, dur: .025, vol: .035, at: .01 }); break;
      case 'lift': tone({ type: 'sine', f: 380, f2: 760, dur: .14, vol: .22 }); noise({ dur: .12, vol: .08, f: 2500 }); break;
      // a find: two little bells a fifth apart, rising with the count (p), and a breath of sparkle (사운드 세션 10/19)
      case 'found': {
        const f = hz(PENTA[p % PENTA.length] + 15);
        tone({ type: 'triangle', f: f / 2, f2: f, dur: .07, vol: .14 });
        bell(f, .02, .2, .4); bell(f * 1.5, .1, .19, .6);
        noise({ dur: .3, vol: .035, type: 'highpass', f: 6500, at: .08, attack: .04 });
        break;
      }
      case 'special': [0, 7, 12, 19].forEach((s, i) => tone({ type: 'triangle', f: hz(s + 5), dur: .18, vol: .2, at: i * .05 })); break;
      // a wrong tap: a soft "uh-oh", two steps down, round and short — it says no without scolding (사운드 세션 10/19)
      case 'miss': tone({ type: 'triangle', f: 349, f2: 330, dur: .1, vol: .27, filter: 'lowpass', q: 1600 }); tone({ type: 'triangle', f: 262, f2: 233, dur: .17, vol: .27, at: .1, filter: 'lowpass', q: 1300 }); noise({ dur: .04, vol: .05, type: 'lowpass', f: 900 }); break;
      // a few taps left (3, then 1): two quick pips over a low knock — "look before you tap"
      case 'tapLow': tone({ type: 'sine', f: 120, f2: 80, dur: .1, vol: .22 }); for (let i = 0; i < 2; i++) { tone({ type: 'sine', f: 1175, dur: .07, vol: .13, at: .03 + i * .13 }); tone({ type: 'triangle', f: 587, dur: .06, vol: .08, at: .03 + i * .13 }); } break;
      case 'wobble': tone({ type: 'sine', f: 420, f2: 360, dur: .14, vol: .18, vib: 30 }); break;
      case 'dizzy': for (let i = 0; i < 6; i++) tone({ type: 'sine', f: i % 2 ? 520 : 740, dur: .1, vol: .16, at: i * .08 }); break;
      case 'locked': for (let i = 0; i < 3; i++) tone({ type: 'square', f: 900 + i * 40, dur: .03, vol: .08, at: i * .06, filter: 'lowpass', q: 2500 }); tone({ type: 'sine', f: 200, dur: .1, vol: .2 }); break;
      // a key picked up: a little jingle of keys and one bell
      case 'key': [3150, 3720, 2890, 3400].forEach((f, i) => { tone({ f, dur: .14 - i * .02, vol: .09, at: i * .045 }); tone({ f: f * 2.7, dur: .05, vol: .02, at: i * .045 }); }); noise({ dur: .12, vol: .04, type: 'highpass', f: 7000, attack: .01 }); bell(hz(31), .2, .13, .5); break;
      // a lock opens: clack-clunk, then a bright bell arpeggio up (it was one click and triangles)
      case 'unlock': noise({ dur: .03, vol: .14, type: 'bandpass', f: 2600, q: 3 }); tone({ type: 'square', f: 1800, dur: .02, vol: .05, filter: 'lowpass', q: 4000 }); tone({ type: 'sine', f: 180, f2: 115, dur: .09, vol: .22, at: .07 }); noise({ dur: .035, vol: .1, type: 'bandpass', f: 1400, q: 3, at: .07 }); [0, 4, 7, 12].forEach((s, i) => bell(hz(s + 24), .17 + i * .065, .13, .45)); break;
      case 'tick': tone({ type: 'square', f: 1600, dur: .025, vol: .06, filter: 'lowpass', q: 3500 }); break;
      case 'tock': tone({ type: 'square', f: 1100, dur: .03, vol: .07, filter: 'lowpass', q: 2500 }); break;
      case 'heart': tone({ type: 'sine', f: 70, f2: 45, dur: .14, vol: .55 }); tone({ type: 'sine', f: 66, f2: 42, dur: .16, vol: .45, at: .17 }); break;
      case 'hop': tone({ type: 'sine', f: 300 + p * 20, f2: 560 + p * 20, dur: .08, vol: .14 }); break;
      case 'land': tone({ type: 'sine', f: 140, f2: 80, dur: .08, vol: .22 }); break;
      case 'hmm': tone({ type: 'triangle', f: 330, f2: 300, dur: .22, vol: .16, vib: 6 }); tone({ type: 'triangle', f: 300, f2: 340, dur: .2, vol: .14, at: .22, vib: 6 }); break;
      case 'gasp': tone({ type: 'triangle', f: 300, f2: 900, dur: .25, vol: .25 }); break;
      case 'angry': tone({ type: 'sawtooth', f: 180, f2: 140, dur: .35, vol: .12, filter: 'lowpass', q: 1200, vib: 20 }); break;
      case 'phew': tone({ type: 'sine', f: 700, f2: 300, dur: .5, vol: .2 }); noise({ dur: .4, vol: .08, f: 1200, f2: 400 }); break;
      // a coin: the two-note chirp kept, now as bells with only a hint of the old square's shine
      case 'coin': bell(988 + p * 30, 0, .11, .12); bell(1319 + p * 40, .06, .13, .32); tone({ type: 'square', f: 1319 + p * 40, dur: .04, vol: .025, at: .06, filter: 'lowpass', q: 5000 }); break;
      // the change of scene: a softer, rounder air (it started at full volume — a click on every iris)
      case 'whoosh': noise({ dur: .32, vol: .17, f: 350, f2: 2400, q: .7, attack: .09 }); noise({ dur: .24, vol: .04, type: 'highpass', f: 5000, at: .03, attack: .1 }); break;
      case 'swish': noise({ dur: .16, vol: .18, f: 2400, f2: 900, q: 1.2 }); break;
      case 'pop': tone({ type: 'sine', f: hz(PENTA[p % PENTA.length]), f2: hz(PENTA[p % PENTA.length]) * 1.6, dur: .09, vol: .35 }); noise({ dur: .04, vol: .1, f: 3000 }); break;
      // 흑백판 끝 '뾰로롱' (10/20): a quick rising run of little bells and a soft shimmer while the colour spreads
      case 'bloom':
        [0, 2, 4, 7, 9, 12, 14, 16, 19].forEach((s, i) => bell(hz(s + 19), i * .05, .07, .45));
        tone({ type: 'sine', f: hz(19), f2: hz(31), dur: .5, vol: .07 });
        noise({ dur: .9, vol: .035, type: 'highpass', f: 6500, attack: .1 });
        break;
      case 'star': tone({ type: 'triangle', f: hz(12 + p * 4), dur: .4, vol: .3 }); tone({ type: 'sine', f: hz(24 + p * 4), dur: .3, vol: .14, at: .02 }); break;
      // a win: the quick arpeggio, then the chord held under a bell and a sparkle run (the music steps back for it — duck)
      case 'win':
        [0, 4, 7, 12].forEach((s, i) => tone({ type: 'triangle', f: hz(s + 12), dur: .24, vol: .2, at: i * .075 }));
        [12, 16, 19, 24].forEach(s => tone({ type: 'triangle', f: hz(s + 12), dur: 1, vol: .085, at: .32, attack: .012 }));
        bell(hz(36), .32, .11, 1.1);
        for (let i = 0; i < 5; i++) tone({ f: hz(31 + PENTA[i]), dur: .16, vol: .05, at: .5 + i * .06 });
        noise({ dur: .5, vol: .035, type: 'highpass', f: 7000, at: .32, attack: .06 });
        break;
      case 'lose': [7, 4, 0, -5].forEach((s, i) => tone({ type: 'triangle', f: hz(s - 5), dur: .34, vol: .2, at: i * .14 })); break;
      case 'giggle': for (let i = 0; i < 4; i++) tone({ type: 'sine', f: 900 + (i % 2) * 220, f2: 1200 + (i % 2) * 200, dur: .07, vol: .14, at: i * .075 }); break;
      case 'place': tone({ type: 'sine', f: 260, f2: 520, dur: .1, vol: .26 }); tone({ type: 'triangle', f: 780, dur: .08, vol: .1, at: .06 }); break;
      case 'buy': [0, 7, 12].forEach((s, i) => tone({ type: 'square', f: hz(s + 12), dur: .1, vol: .08, at: i * .06, filter: 'lowpass', q: 3500 })); break;
      // 몰래 숨기 v2: each hideout's own sound, and the friends' tells from inside
      case 'thump': tone({ type: 'sine', f: 170, f2: 80, dur: .14, vol: .38 }); noise({ dur: .07, vol: .14, type: 'lowpass', f: 600 }); break;
      case 'latch': tone({ type: 'square', f: 1800, dur: .025, vol: .09, filter: 'lowpass', q: 4000 }); tone({ type: 'square', f: 1250, dur: .03, vol: .09, at: .07, filter: 'lowpass', q: 3500 }); tone({ type: 'sine', f: 260, f2: 200, dur: .08, vol: .16, at: .07 }); break;
      case 'rustle': for (let i = 0; i < 4; i++) noise({ dur: .06, vol: .13, f: 3200 + i * 300, q: 1.4, at: i * .06 }); break;
      case 'clink': tone({ type: 'triangle', f: 2100, dur: .09, vol: .12 }); tone({ type: 'triangle', f: 2750, dur: .12, vol: .08, at: .05 }); break;
      case 'slide': noise({ dur: .4, vol: .15, f: 500, f2: 1300, q: 1.8 }); tone({ type: 'sine', f: 180, dur: .06, vol: .14, at: .36 }); break;
      case 'creak': tone({ type: 'sawtooth', f: 330, f2: 520, dur: .45, vol: .06, filter: 'lowpass', q: 1400, vib: 18 }); break;
      case 'thunk': noise({ dur: .12, vol: .16, type: 'lowpass', f: 900 }); tone({ type: 'sine', f: 120, f2: 70, dur: .16, vol: .35, at: .02 }); break;
      case 'snore': noise({ dur: .55, vol: .16, type: 'lowpass', f: 260, f2: 520, q: 2 }); tone({ type: 'sawtooth', f: 85, f2: 110, dur: .5, vol: .05, filter: 'lowpass', q: 400 }); noise({ dur: .4, vol: .07, f: 1600, f2: 900, q: 1, at: .65 }); break;
      case 'blub': for (let i = 0; i < 3; i++) tone({ type: 'sine', f: 380 + i * 140, f2: 900 + i * 220, dur: .06, vol: .2, at: i * .09 }); break;
      // a door (room door, elevator, rooftop): it swings through the air, then settles with a soft wooden knock
      case 'door': noise({ dur: .32, vol: .13, f: 420, f2: 950, q: 2.5, attack: .05 }); tone({ type: 'triangle', f: 150, f2: 112, dur: .24, vol: .1, vib: 5 }); tone({ type: 'sine', f: 125, f2: 72, dur: .13, vol: .22, at: .3 }); noise({ dur: .05, vol: .08, type: 'lowpass', f: 650, at: .3 }); break;
      case 'mugunghwa': case 'cheer': break;   // (file only)
      case 'drawerClose': noise({ dur: .16, vol: .15, f: 1500, f2: 800, q: 1.8, attack: .02, grain: 34 }); tone({ type: 'sine', f: 170, f2: 100, dur: .09, vol: .26, at: .13 }); noise({ dur: .04, vol: .1, type: 'lowpass', f: 800, at: .13 }); break;
      case 'flip': noise({ dur: .09, vol: .14, f: 3000, f2: 1600, q: 1.2, attack: .01 }); noise({ dur: .03, vol: .06, type: 'highpass', f: 5000, at: .06 }); break;   // (a Suno·Google file only — without one 너굴이's voice says the chant, bosses/redlight.js)
      default: tone({ f: 600, dur: .05, vol: .2 });
    }
  };

  // a sound from a place: left/right by where it is on screen, quieter when it is off screen (몰래 숨기 v2)
  A.sfxAt = (name, pan = 0, gain = 1) => {
    if (!ensure() || A.muted) return A.sfx(name);
    const c = A.ctx, g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    g.gain.value = gain;
    if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(A.sfxBus); } else g.connect(A.sfxBus);
    A._bus = g; try { A.sfx(name); } finally { A._bus = null; }
    setTimeout(() => { try { g.disconnect(); p?.disconnect(); } catch {} }, 3000);
  };
  A.hasFile = name => !!sfxBuf[name];

  // ── 목소리 (10/20): a friend's line as cute babble — one soft blip per syllable, its vowel colouring the blip (animal-
  // crossing-like gibberish made from the text, nobody's real voice). Short (8 syllables at most), quiet, never two at once;
  // off with setVoice(false) (설정 → 목소리). Only 너굴이 has one for now (VOICES).
  const VOICES = { raccoon: { f0: 590, step: .072, vol: .12, wave: 'triangle' } };
  //            a          e          i          o          u   (F1/F2, raised for a small animal)
  const VOW = { a: [950, 1500], e: [620, 2300], i: [400, 2800], o: [620, 1100], u: [440, 1000] };
  const JUNG = 'aeaeoeoeoaeeouoeiuuii';   // the 21 Hangul vowels → a e i o u
  const voiceOf = who => { if (!who) return null; for (const k in VOICES) if (who === k || who.startsWith(k + '_')) return VOICES[k]; return null; };
  function syllables(text, max) {
    const out = [];
    for (const ch of String(text)) {
      const c = ch.codePointAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) { const k = c - 0xAC00; out.push({ v: JUNG[Math.floor((k % 588) / 28)], hard: Math.floor(k / 588) !== 11, n: k }); }
      else if (/[aeiouy]/i.test(ch)) out.push({ v: ch.toLowerCase() === 'y' ? 'i' : ch.toLowerCase(), hard: true, n: c });
      if (out.length >= max) break;
    }
    return out;
  }
  A.setVoice = on => { A.voiceOn = !!on; store.set('sbk.voice', A.voiceOn); };
  A.voice = (text, who, { max = 8, one = false } = {}) => {
    const V = voiceOf(who);
    if (!V || !A.voiceOn || !ensure() || A.muted || A.ctx.state !== 'running') return;
    const c = A.ctx, now = c.currentTime;
    if (!one && A._voiceEnd > now) return;
    const syl = syllables(text, one ? 1 : max); if (!syl.length) return;
    const ask = /[?？]\s*$/.test(text), cheer = /[!！~]\s*$/.test(text);
    const out = c.createGain(); out.gain.value = V.vol; out.connect(A.sfxBus);
    syl.forEach((S, i) => {
      const t0 = now + i * V.step, d = V.step * .82, last = i === syl.length - 1;
      const semi = [0, 3, 5, 7, 5, 3, 0, 2][S.n % 8] + (cheer ? 2 : 0) + (ask && last ? 5 : 0);
      const f = V.f0 * 2 ** (semi / 12), o = c.createOscillator(), g = c.createGain();
      o.type = V.wave; o.frequency.setValueAtTime(f * 1.04, t0); o.frequency.exponentialRampToValueAtTime(f * (ask && last ? 1.12 : .96), t0 + d);
      const [F1, F2] = VOW[S.v] || VOW.a, b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter();
      b1.type = b2.type = 'bandpass'; b1.frequency.value = F1; b2.frequency.value = F2; b1.Q.value = 3; b2.Q.value = 5;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + .008); g.gain.setValueAtTime(1, t0 + d * .45); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
      o.connect(b1).connect(g); o.connect(b2).connect(g); g.connect(out);
      const dry = c.createGain(); dry.gain.value = .35; o.connect(dry).connect(g);
      o.start(t0); o.stop(t0 + d + .02);
      if (S.hard) noise({ dur: .012, vol: .05, type: 'bandpass', f: 3200, q: 2, at: i * V.step });
    });
    A._voiceEnd = now + syl.length * V.step;
    setTimeout(() => { try { out.disconnect(); } catch {} }, (syl.length * V.step + .5) * 1000);
  };

  // the music steps back for a moment (a win's jingle) and comes back on its own
  A.duck = (sec = 2, to = .3) => {
    if (!A.musicBus) return;
    const g = A.musicBus.gain, t = A.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * to, t + .08); g.setValueAtTime(MUSIC_VOL * to, t + sec); g.linearRampToValueAtTime(MUSIC_VOL, t + sec + .8);
  };

  // ── background music: a slot per scene (BGM above), streamed, faded across (사운드 세션 10/19, 10/20)
  // One <audio> element for every track (memory, and iPhone lets an element play on its own only after a tap has started it
  // once — a second element would stay silent until the next tap): the track going out fades down, the next one comes in
  // as soon as it really plays (~0.8 s in all, under the iris). A slot with no file of its own plays the lobby song — the
  // same file, so it just goes on. A gpt file that can't be read is dropped (the lobby song again).
  const XF = .8, TRACK_GAIN = .55, HURRY = 1.07;
  const lobbyOnly = /[?&]bgm=(lobby|tmp)\b/.test(location.search), failed = new Set();
  const own = slot => { const b = BGM[slot]; if (!b) return null; const g = b.gpts ? b.gpts[(A._rot || 0) % b.gpts.length] : b.gpt; const url = (g && !lobbyOnly && !failed.has(g) && g) || b.tmp; return url ? { url, gain: b.gain ?? 1 } : null; };
  const fileOf = slot => own(slot) || own('lobby');
  const T = A._trk = { el: null, gain: null, url: null, slot: null, want: null, goal: 0, pending: null, swapT: 0, stopT: 0, rate: 1 };
  function mkTrack() {
    const el = T.el = new Audio(); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous'; el.setAttribute('playsinline', '');
    try { const node = A.ctx.createMediaElementSource(el); T.gain = A.ctx.createGain(); T.gain.gain.value = 0; node.connect(T.gain).connect(A.musicBus); } catch { T.gain = null; }
    el.addEventListener('playing', () => { if (T.pending != null) { fade(T.pending, XF * .6); T.pending = null; } });
    el.addEventListener('error', () => {
      if (!T.url || !Object.values(BGM).some(b => b.gpt === T.url || b.gpts?.includes(T.url))) return;
      console.warn('bgm file', T.url, 'could not be read — playing the lobby song');
      failed.add(T.url); T.url = null; A._req = null; goMusic();
    });
  }
  // the speed only when it changes, and never the pitch setting (writing it, even the same value, cut the sound on iPhone)
  function setRate(rate) {
    if (T.rate === rate && T.el.playbackRate === rate) return;
    T.rate = rate; T.el.defaultPlaybackRate = rate; T.el.playbackRate = rate;
  }
  function fade(to, sec) {
    T.goal = to;
    if (!T.gain) { T.el.volume = A.muted || !to ? 0 : MUSIC_VOL; return; }   // (no WebAudio route: plain volume)
    const g = T.gain.gain, t = A.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + sec);
  }
  function swap() {
    T.swapT = 0; const w = T.want;
    T.url = w.url; T.el.src = w.url; T.rate = 0; setRate(w.rate);
    fade(0, .02); T.pending = w.level;   // (comes up on 'playing' — a slow network doesn't eat the fade-in)
    if (!document.hidden) T.el.play()?.catch?.(() => {});   // (refused before a tap: goMusic tries again on the next one)
  }
  function playSlot(slot, rate) {
    if (!T.el) mkTrack();
    const f = fileOf(slot); if (!f) return stopTrack();
    const url = f.url, level = TRACK_GAIN * f.gain;
    clearTimeout(T.stopT); T.stopT = 0;
    T.slot = slot; T.want = { url, rate, level };
    if (T.url === url) {   // this file already (another slot falling back to the same song too): it goes on, at its own level
      if (T.swapT) { clearTimeout(T.swapT); T.swapT = 0; }
      setRate(rate);
      if (T.pending != null) T.pending = level; else if (T.goal !== level) fade(level, .35);
      if (T.el.paused && !document.hidden) T.el.play()?.catch?.(() => {});
      return;
    }
    if (T.swapT) return;   // (the swap under way takes the newest want)
    if (T.url && !T.el.paused) { fade(0, XF * .45); T.swapT = setTimeout(swap, XF * 450); } else swap();
  }
  function release() { T.el.pause(); T.el.removeAttribute('src'); try { T.el.load(); } catch {} T.url = null; T.pending = null; }
  function stopTrack(sec = .5) {
    if (!T.el || !T.url) return;
    clearTimeout(T.swapT); T.swapT = 0; T.pending = null;
    if (T.stopT) return;
    fade(0, sec); T.stopT = setTimeout(() => { T.stopT = 0; release(); }, sec * 1000 + 80);
  }
  function pauseDecks() { T.el?.pause(); }

  // mood → slot: 'home' the lobby, 'play' this scene's own (A.scene), 'tense' the tense file or the playing track hurried;
  // a slot's name works as a mood too ('boss', 'king', 'tv' …)
  const SCENE_SLOT = { stage: 'map', mini: 'mini', boss: 'boss', bossgame: 'boss' };
  A.playSlot = 'map'; A._hurry = false; A._req = null;
  A.scene = (name, data = {}) => {
    A.playSlot = data.final || data.kind === 'finale' ? 'king' : SCENE_SLOT[name] || 'map';
    if (A.playSlot === 'mini') A._rot = (A._rot || 0) + 1;   // (the next mini game, the other song)
    A._hurry = false; A._req = null; if (T.el && T.url) setRate(1);
  };
  // 막판 (the stage's last 10 seconds): the track playing hurries a little; off again on the next scene
  A.hurry = (on = true) => { A._hurry = !!on; if (A._req) A._req.rate = on ? HURRY : 1; if (T.el && T.url) setRate(on ? HURRY : 1); };
  function request(mood) {
    if (mood === 'tense') {
      if (own('tense')) return { slot: 'tense', rate: 1 };
      const now = T.url && !T.stopT ? T.slot : null, s = now === 'boss' || now === 'king' ? now : 'boss';
      return { slot: s, rate: s === now ? HURRY : 1 };
    }
    const slot = mood === 'home' ? 'lobby' : mood === 'play' ? A.playSlot : BGM[mood] ? mood : 'lobby';
    return { slot, rate: A._hurry ? HURRY : 1 };
  }
  // (a pushed slot — 몽글 TV — gives the music back to what was playing when it closes)
  A.pushMusic = slot => {
    const prev = { mood: A.mood, want: A._wantMusic };
    A.music(slot);
    return () => { if (A.mood !== slot) return; if (prev.want) A.music(prev.mood); else A.stopMusic(); };
  };
  // (10/20: the music box that played when a slot had no file is gone — music comes from Suno·Google files only)
  A.music = (mood = 'home') => {
    const again = mood === A.mood && A._wantMusic && A._req;
    A.mood = mood; A._wantMusic = true;
    if (!ensure() || A.ctx.state !== 'running') { if (!again) A._req = null; return; }
    if (!again) A._req = request(mood);
    playSlot(A._req.slot, A._req.rate);
  };
  A.stopMusic = () => { A._wantMusic = false; A._req = null; stopTrack(); };
  return A;
}
