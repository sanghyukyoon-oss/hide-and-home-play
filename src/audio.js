// WebAudio-synthesized SFX + generative music box BGM. No asset files.
import { store } from './util.js';
import { hapticFor } from './feel.js';

export function createAudio({ storageKey = 'sbk.mute' } = {}) {
  const A = { ctx: null, master: null, sfxBus: null, musicBus: null, muted: store.get(storageKey, false), _timer: null, _step: 0, mood: 'home' };
  function ensure() {
    if (A.ctx) return A.ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { A.ctx = new AC(); } catch { return null; }
    A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : .9;
    const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    A.master.connect(comp).connect(A.ctx.destination);
    A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = .8; A.sfxBus.connect(A.master);
    A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = .3; A.musicBus.connect(A.master);
    return A.ctx;
  }
  A.unlock = () => { const c = ensure(); if (c && c.state === 'suspended') c.resume(); if (A._wantMusic && !A._timer) A.music(A.mood); };
  addEventListener('pointerdown', A.unlock, { capture: true });
  A.setMuted = m => { A.muted = m; store.set(storageKey, m); if (A.master) A.master.gain.setTargetAtTime(m ? 0 : .9, A.ctx.currentTime, .02); };

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
  function noise({ dur = .15, vol = .3, at = 0, type = 'bandpass', f = 1800, f2 = null, q = 1 }) {
    const c = A.ctx; if (!c) return;
    const t0 = c.currentTime + at, len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl).connect(g).connect(A._bus || A.sfxBus); s.start(t0);
  }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  const hz = semi => 440 * 2 ** ((semi - 9) / 12);

  A.sfx = (name, p = 0) => {
    hapticFor(name);   // 손맛 2: a tap's sound also buzzes (even with the sound off)
    if (!ensure() || A.muted) return;
    p = Math.min(p, 12);
    switch (name) {
      case 'tap': tone({ type: 'triangle', f: 700, f2: 980, dur: .06, vol: .25 }); break;
      case 'click': tone({ type: 'square', f: 1300, dur: .03, vol: .1, filter: 'lowpass', q: 3000 }); break;
      case 'btn': tone({ type: 'triangle', f: 520, f2: 820, dur: .08, vol: .3 }); tone({ type: 'sine', f: 1040, dur: .06, vol: .12, at: .03 }); break;
      case 'open': noise({ dur: .16, vol: .18, f: 700, f2: 1400, q: 1.5 }); tone({ type: 'triangle', f: 210, f2: 320, dur: .12, vol: .22 }); break;
      case 'drawer': noise({ dur: .22, vol: .2, f: 900, f2: 1800, q: 2 }); tone({ type: 'triangle', f: 150, dur: .06, vol: .2, at: .18 }); break;
      case 'close': tone({ type: 'sine', f: 190, f2: 90, dur: .1, vol: .3 }); noise({ dur: .05, vol: .12, type: 'lowpass', f: 700 }); break;
      case 'lift': tone({ type: 'sine', f: 380, f2: 760, dur: .14, vol: .22 }); noise({ dur: .12, vol: .08, f: 2500 }); break;
      case 'found': {
        const n = PENTA[p % PENTA.length];
        tone({ type: 'triangle', f: hz(n + 3), f2: hz(n + 15), dur: .1, vol: .32 });
        tone({ type: 'sine', f: hz(n + 15), dur: .28, vol: .22, at: .07 });
        tone({ type: 'sine', f: hz(n + 22), dur: .22, vol: .1, at: .13 });
        noise({ dur: .05, vol: .1, f: 4000 });
        break;
      }
      case 'special': [0, 7, 12, 19].forEach((s, i) => tone({ type: 'triangle', f: hz(s + 5), dur: .18, vol: .2, at: i * .05 })); break;
      case 'miss': tone({ type: 'sine', f: 300, f2: 170, dur: .14, vol: .3 }); break;
      case 'wobble': tone({ type: 'sine', f: 420, f2: 360, dur: .14, vol: .18, vib: 30 }); break;
      case 'dizzy': for (let i = 0; i < 6; i++) tone({ type: 'sine', f: i % 2 ? 520 : 740, dur: .1, vol: .16, at: i * .08 }); break;
      case 'locked': for (let i = 0; i < 3; i++) tone({ type: 'square', f: 900 + i * 40, dur: .03, vol: .08, at: i * .06, filter: 'lowpass', q: 2500 }); tone({ type: 'sine', f: 200, dur: .1, vol: .2 }); break;
      case 'unlock': tone({ type: 'square', f: 1500, dur: .03, vol: .1, filter: 'lowpass', q: 3000 }); [0, 4, 7, 12].forEach((s, i) => tone({ type: 'triangle', f: hz(s + 12), dur: .2, vol: .18, at: .08 + i * .06 })); break;
      case 'tick': tone({ type: 'square', f: 1600, dur: .025, vol: .06, filter: 'lowpass', q: 3500 }); break;
      case 'tock': tone({ type: 'square', f: 1100, dur: .03, vol: .07, filter: 'lowpass', q: 2500 }); break;
      case 'heart': tone({ type: 'sine', f: 70, f2: 45, dur: .14, vol: .55 }); tone({ type: 'sine', f: 66, f2: 42, dur: .16, vol: .45, at: .17 }); break;
      case 'hop': tone({ type: 'sine', f: 300 + p * 20, f2: 560 + p * 20, dur: .08, vol: .14 }); break;
      case 'land': tone({ type: 'sine', f: 140, f2: 80, dur: .08, vol: .22 }); break;
      case 'hmm': tone({ type: 'triangle', f: 330, f2: 300, dur: .22, vol: .16, vib: 6 }); tone({ type: 'triangle', f: 300, f2: 340, dur: .2, vol: .14, at: .22, vib: 6 }); break;
      case 'gasp': tone({ type: 'triangle', f: 300, f2: 900, dur: .25, vol: .25 }); break;
      case 'angry': tone({ type: 'sawtooth', f: 180, f2: 140, dur: .35, vol: .12, filter: 'lowpass', q: 1200, vib: 20 }); break;
      case 'phew': tone({ type: 'sine', f: 700, f2: 300, dur: .5, vol: .2 }); noise({ dur: .4, vol: .08, f: 1200, f2: 400 }); break;
      case 'coin': tone({ type: 'square', f: 988 + p * 30, dur: .06, vol: .1, filter: 'lowpass', q: 4000 }); tone({ type: 'square', f: 1319 + p * 40, dur: .14, vol: .1, at: .06, filter: 'lowpass', q: 4000 }); break;
      case 'whoosh': noise({ dur: .28, vol: .22, f: 400, f2: 2600, q: .8 }); break;
      case 'swish': noise({ dur: .16, vol: .18, f: 2400, f2: 900, q: 1.2 }); break;
      case 'pop': tone({ type: 'sine', f: hz(PENTA[p % PENTA.length]), f2: hz(PENTA[p % PENTA.length]) * 1.6, dur: .09, vol: .35 }); noise({ dur: .04, vol: .1, f: 3000 }); break;
      case 'star': tone({ type: 'triangle', f: hz(12 + p * 4), dur: .4, vol: .3 }); tone({ type: 'sine', f: hz(24 + p * 4), dur: .3, vol: .14, at: .02 }); break;
      case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone({ type: 'triangle', f: hz(s), dur: .32, vol: .24, at: i * .07 })); break;
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
      case 'door': noise({ dur: .3, vol: .14, f: 500, f2: 900, q: 3 }); tone({ type: 'triangle', f: 160, f2: 120, dur: .3, vol: .12, vib: 8 }); break;
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

  // Music box loop. mood: 'home' | 'play' | 'tense'
  const MOODS = {
    home: { bpm: 96, root: -7, prog: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], mel: [12, 16, 19, 16, 14, 12, 9, 12] },
    play: { bpm: 118, root: -5, prog: [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]], mel: [12, 14, 16, 19, 21, 19, 16, 14] },
    tense: { bpm: 84, root: -10, prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], mel: [12, 15, 12, 10, 12, 15, 17, 15] },
  };
  A.music = (mood = 'home') => {
    A.mood = mood; A._wantMusic = true;
    if (A._timer) { clearInterval(A._timer); A._timer = null; }
    if (!ensure() || A.ctx.state !== 'running') return;
    const M = MOODS[mood] || MOODS.home;
    const stepDur = 60 / M.bpm / 2; let next = A.ctx.currentTime + .06;
    A._timer = setInterval(() => {
      if (!A.ctx) return;
      if (A.muted) { next = A.ctx.currentTime + .05; return; }
      while (next < A.ctx.currentTime + .25) {
        const s = A._step++, bar = Math.floor(s / 8) % M.prog.length, chord = M.prog[bar], at = next - A.ctx.currentTime;
        if (s % 8 === 0) chord.forEach(n => tone({ type: 'triangle', f: hz(M.root + n), dur: stepDur * 7.6, vol: .06, attack: .1, at, bus: A.musicBus, filter: 'lowpass', q: 1300 }));
        if (s % 4 === 0) tone({ type: 'sine', f: hz(M.root - 12 + chord[0]), dur: stepDur * 3, vol: .14, at, bus: A.musicBus });
        if (s % 4 === 2) tone({ type: 'sine', f: hz(M.root - 12 + chord[2]), dur: stepDur * 2, vol: .09, at, bus: A.musicBus });
        // music-box melody: sine + octave bell
        if ((s * 5) % 8 < 5) {
          const n = M.mel[s % M.mel.length] + (bar === 2 ? -3 : 0);
          tone({ type: 'sine', f: hz(M.root + n), dur: stepDur * 1.6, vol: .07, at, bus: A.musicBus });
          tone({ type: 'sine', f: hz(M.root + n + 12), dur: stepDur * .9, vol: .025, at, bus: A.musicBus });
        }
        if (mood !== 'home' && s % 2 === 1) tone({ type: 'square', f: 5200, dur: .015, vol: .012, at, bus: A.musicBus, filter: 'highpass', q: 4000 });
        next += stepDur;
      }
    }, 60);
  };
  A.stopMusic = () => { A._wantMusic = false; if (A._timer) { clearInterval(A._timer); A._timer = null; } };
  return A;
}
