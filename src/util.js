export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuint: t => 1 - Math.pow(1 - t, 5),   // the house default: quick off the mark, a long soft landing (user, 10/17: "이지아웃 쎄게")
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const s = 1.70158; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  outBackBig: t => { const s = 2.6; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  inBack: t => { const s = 1.70158; return (s + 1) * t * t * t - s * t * t; },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
};

// Game-time tweens. run(dur, fn(k)) calls fn with eased k in 0..1 and resolves at the end.
export class Tweens {
  constructor() { this.list = []; }
  run(dur, fn, e = ease.outQuint, delay = 0, tag = null) {
    return new Promise(res => { this.list.push({ t: -delay, dur: Math.max(dur, 1e-4), fn, e, res, tag }); });
  }
  to(obj, props, dur, e = ease.outQuint, delay = 0, tag = null) {
    let from = null;
    return this.run(dur, k => {
      if (!from) { from = {}; for (const p in props) from[p] = obj[p]; }
      for (const p in props) obj[p] = from[p] + (props[p] - from[p]) * k;
    }, e, delay, tag ?? obj);
  }
  wait(sec, tag = null) { return this.run(sec, () => {}, ease.linear, 0, tag); }
  kill(tag) { this.list = this.list.filter(x => x.tag !== tag); }
  clear() { this.list = []; }
  update(dt) {
    const L = this.list; if (!L.length) return;
    this.list = [];
    const keep = [];
    for (const tw of L) {
      tw.t += dt;
      if (tw.t < 0) { keep.push(tw); continue; }
      const k = Math.min(tw.t / tw.dur, 1);
      tw.fn(tw.e(k));
      if (k >= 1) tw.res(); else keep.push(tw);
    }
    this.list = keep.concat(this.list);
  }
}

export function rng(seed = 1) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return r;
}

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

export const qs = new URLSearchParams(location.search);
