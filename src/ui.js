// DOM UI kit: Supercell-style chunky buttons, ribbon panels, pills, toasts, world-anchored bubbles, fly-to animations.
export const ICON = {
  coin: '<svg viewBox="0 0 40 40"><circle cx="20" cy="21" r="16" fill="#d99a0b" stroke="#3a2453" stroke-width="3"/><circle cx="20" cy="19" r="14" fill="#ffd23f"/><circle cx="20" cy="19" r="9" fill="none" stroke="#ffb300" stroke-width="3"/><path d="M14 12a10 10 0 0 1 8-3" stroke="#fff6c4" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 40 40"><path d="M20 3l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L20 29.6 9.6 35.1l2-11.6-8.5-8.2 11.7-1.7z" fill="#ffd23f" stroke="#3a2453" stroke-width="3" stroke-linejoin="round"/><path d="M14 15l4-1" stroke="#fff6c4" stroke-width="3" stroke-linecap="round"/></svg>',
  starGray: '<svg viewBox="0 0 40 40"><path d="M20 3l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L20 29.6 9.6 35.1l2-11.6-8.5-8.2 11.7-1.7z" fill="#cbbfd8" stroke="#3a2453" stroke-width="3" stroke-linejoin="round"/></svg>',
  key: '<svg viewBox="0 0 40 40"><circle cx="13" cy="20" r="8" fill="#ffd23f" stroke="#3a2453" stroke-width="3"/><circle cx="13" cy="20" r="3" fill="#3a2453"/><path d="M20 20h16M30 20v6M35 20v4" stroke="#3a2453" stroke-width="7" stroke-linecap="round"/><path d="M20 20h16M30 20v6M35 20v4" stroke="#ffd23f" stroke-width="3.5" stroke-linecap="round"/></svg>',
  note: '<svg viewBox="0 0 40 40"><rect x="7" y="6" width="26" height="29" rx="5" fill="#fff7d6" stroke="#3a2453" stroke-width="3"/><path d="M12 15h16M12 21h16M12 27h10" stroke="#ff8fb8" stroke-width="3" stroke-linecap="round"/></svg>',
  hint: '<svg viewBox="0 0 40 40"><circle cx="17" cy="17" r="11" fill="#bfe8ff" stroke="#fff" stroke-width="4"/><path d="M25 25l9 9" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M12 13a6 6 0 0 1 5-4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  pause: '<svg viewBox="0 0 40 40"><rect x="10" y="8" width="7" height="24" rx="3" fill="#fff"/><rect x="23" y="8" width="7" height="24" rx="3" fill="#fff"/></svg>',
  home: '<svg viewBox="0 0 40 40"><path d="M6 19L20 7l14 12v14a2 2 0 0 1-2 2h-8V25h-8v10H8a2 2 0 0 1-2-2z" fill="#fff"/></svg>',
  sound: '<svg viewBox="0 0 40 40"><path d="M7 15h7l9-7v24l-9-7H7z" fill="#fff"/><path d="M28 13a10 10 0 0 1 0 14" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 40 40"><path d="M7 15h7l9-7v24l-9-7H7z" fill="#fff"/><path d="M28 15l8 10M36 15l-8 10" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 20 20"><path d="M4 10l4 4 8-9" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 40 40"><path d="M12 18v-5a8 8 0 0 1 16 0v5" stroke="#fff" stroke-width="4" fill="none"/><rect x="8" y="17" width="24" height="18" rx="5" fill="#ffd23f" stroke="#3a2453" stroke-width="3"/></svg>',
  play: '<svg viewBox="0 0 40 40"><path d="M12 7l22 13-22 13z" fill="#fff" stroke-linejoin="round"/></svg>',
  rotate: '<svg viewBox="0 0 40 40"><path d="M30 13A12 12 0 1 0 32 24" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M24 12h8V4" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  box: '<svg viewBox="0 0 40 40"><path d="M6 14l14-7 14 7v14l-14 7-14-7z" fill="#ffd9a3" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M6 14l14 7 14-7M20 21v14" stroke="#fff" stroke-width="3"/></svg>',
  shop: '<svg viewBox="0 0 40 40"><path d="M6 15l3-8h22l3 8z" fill="#fff"/><path d="M8 17h24v15a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="#fff" opacity=".85"/><rect x="16" y="23" width="8" height="11" rx="2" fill="#ff9d2e"/></svg>',
  hide: '<svg viewBox="0 0 40 40"><path d="M4 20s6-10 16-10 16 10 16 10-6 10-16 10S4 20 4 20z" fill="#fff"/><circle cx="20" cy="20" r="6" fill="#9b6cff"/><path d="M8 33L32 7" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
  paint: '<svg viewBox="0 0 40 40"><path d="M8 26c0-4 3-5 5-5s3 2 3 4-2 6-8 6c2-1 0-3 0-5z" fill="#fff"/><path d="M15 21L31 5l4 4-16 16" fill="#fff" opacity=".9"/></svg>',
  share: '<svg viewBox="0 0 40 40"><circle cx="11" cy="20" r="5" fill="#fff"/><circle cx="29" cy="10" r="5" fill="#fff"/><circle cx="29" cy="30" r="5" fill="#fff"/><path d="M11 20L29 10M11 20l18 10" stroke="#fff" stroke-width="3.5"/></svg>',
  close: '<svg viewBox="0 0 40 40"><path d="M12 12l16 16M28 12L12 28" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/></svg>',
  hand: '<svg viewBox="0 0 64 64"><path d="M22 34V12a5 5 0 0 1 10 0v15l2-1a5 5 0 0 1 6 2l1 1a5 5 0 0 1 6 2 5 5 0 0 1 6 3v10c0 9-6 16-16 16h-4c-6 0-10-3-13-8l-8-12a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#3a2453" stroke-width="3.5" stroke-linejoin="round"/><path d="M33 33v6M41 34v5M48 36v4" stroke="#3a2453" stroke-width="3" stroke-linecap="round"/></svg>',
  mom: '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="14" fill="#f9cfe2" stroke="#3a2453" stroke-width="3"/><path d="M7 19a13 11 0 0 1 26 0c-4-4-9-5-13-5s-9 1-13 5z" fill="#7a5240"/><circle cx="20" cy="6" r="5" fill="#7a5240" stroke="#3a2453" stroke-width="2"/><circle cx="15" cy="23" r="2" fill="#3a2453"/><circle cx="25" cy="23" r="2" fill="#3a2453"/></svg>',
};

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}

export class UI {
  constructor(audio) {
    this.audio = audio;
    this.hud = document.getElementById('hud');
    this.overlay = document.getElementById('overlay');
    // (QA3 10/19) a press on an open panel, or its dim backdrop, ends here: the games behind it listen on #app
    this.overlay.addEventListener('pointerdown', e => { if (this.overlay.classList.contains('on')) e.stopPropagation(); });
    this.toasts = document.getElementById('toasts');
    this.wui = document.getElementById('world-ui');
    // tutorial captions and the pointing hand sit above every HUD control (the zoom gauge and the turn/move switch were
    // drawn over them — user, 10/17); a layer of its own so world labels can stay under the HUD
    this.tut = document.getElementById('tut-ui') || document.getElementById('app').appendChild(h('div', { id: 'tut-ui' }));
    this.iris = document.getElementById('iris');
    this.panelOpen = null;
  }
  clear() { this.hud.innerHTML = ''; this.wui.innerHTML = ''; this.tut.innerHTML = ''; this.closePanel(); this.overlay.querySelectorAll('.chooser, .endcard').forEach(e => e.remove()); }   // (a choice left from the last scene — QA 10/18)
  col() { const c = h('div', { class: 'col' }); this.hud.append(c); return c; }
  btn(label, { color = 'green', icon = null, sub = null, cls = '', onClick = null, sfx = 'btn', disabled = false } = {}) {
    const b = h('div', { class: `btn ${color} ${cls}${disabled ? ' disabled' : ''}`, role: 'button' });
    if (icon) b.insertAdjacentHTML('beforeend', ICON[icon] || icon);
    if (label != null) {
      const l = h('span', { class: 'lbl ol' }, label);
      if (sub) { b.classList.add('stack'); l.append(h('span', { class: 'sub' }, sub)); }
      b.append(l);
    }
    let downAt = 0;
    b.addEventListener('pointerdown', e => { e.stopPropagation(); b.classList.add('down'); downAt = performance.now(); });
    const up = () => b.classList.remove('down');
    b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('pointerup', e => { e.stopPropagation(); if (!b.classList.contains('down')) return; up(); if (b.classList.contains('disabled') && !b.dataset.allowDisabled) { this.audio.sfx('miss'); b.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 }); onClick?.(true); return; } this.audio.sfx(sfx); onClick?.(); });
    b.press = () => { if (!b.classList.contains('disabled')) { this.audio.sfx(sfx); onClick?.(); } };
    b.tabIndex = 0;
    if (label != null && typeof label === 'string') {
      b.setAttribute('aria-label', label + (sub ? ' · ' + sub : ''));
      const l = b.querySelector('.lbl');
      if (l && !sub) new MutationObserver(() => b.setAttribute('aria-label', l.textContent)).observe(l, { childList: true, characterData: true, subtree: true });
    }
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (b.classList.contains('disabled')) { onClick?.(true); return; } this.audio.sfx(sfx); onClick?.(); } });
    return b;
  }
  ibtn(icon, color, onClick, badge = null) {
    const b = this.btn(null, { color, icon, cls: 'ibtn', onClick });
    b.dataset.icon = icon;   // (the app's back button finds a scene's home button by it — src/appback.js)
    if (badge != null) { const bd = h('div', { class: 'badge' }, String(badge)); b.append(bd); b.badge = bd; }
    return b;
  }
  pill(icon, value, cls = '') {
    const p = h('div', { class: 'pill ' + cls, html: `<span class="ico">${ICON[icon] || icon}</span><span class="v">${value}</span>` });
    p.set = v => { p.querySelector('.v').textContent = v; };
    return p;
  }
  panel({ title, color = 'blue', body = [], buttons = [], close = null, cls = '' }) {
    this.closePanel(true);
    const p = h('div', { class: 'panel ' + cls }, h('div', { class: `ribbon ${color} ol3` }, title), ...[].concat(body));
    if (buttons.length) p.append(h('div', { class: 'row' }, ...buttons));
    if (close) { const c = this.ibtn('close', 'red', () => { this.closePanel(); close(); }); c.classList.add('close'); p.append(c); }
    this.overlay.innerHTML = ''; this.overlay.append(p); this.overlay.classList.add('on');
    this.panelOpen = p;
    return p;
  }
  closePanel(instant = false) {
    if (!this.panelOpen) { this.overlay.classList.remove('on'); return; }
    const p = this.panelOpen; this.panelOpen = null;
    p.inert = true; p.classList.add('closing');   // it fades out for 160 ms; nothing in it may be pressed meanwhile
    this.overlay.classList.remove('on');
    if (instant) p.remove();
    else { p.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.7)', opacity: 0 }], { duration: 160, easing: 'ease-in' }).onfinish = () => p.remove(); }
  }
  toast(text, color = '') {
    const t = h('div', { class: 'toast ' + color }, text);
    // one at a time: the newest replaces what was showing (three stacked boxes covered the top of the room)
    for (const o of [...this.toasts.children]) { o.classList.add('gone'); setTimeout(() => o.remove(), 160); }
    this.toasts.append(t);
    setTimeout(() => t.remove(), 2100);
  }
  floatText(x, y, text, cls = '') {
    const t = h('div', { class: 'ftxt ol ' + cls, style: `left:${x}px;top:${y}px` }, text);
    this.wui.append(t); setTimeout(() => t.remove(), 1050);
  }
  banner(t1, t2, dur = 1400) {
    const b = h('div', { class: 'banner' }, h('div', { class: 't1 ol3' }, t1), t2 ? h('div', { class: 't2 ol' }, t2) : null);
    document.getElementById('app').append(b);
    return new Promise(res => setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 340); }, dur));
  }
  // image flies from (x0,y0) to the element's centre with an arc
  flyImg(src, x0, y0, toEl, { size = 64, dur = 620 } = {}) {
    const r = toEl.getBoundingClientRect();
    const x1 = r.left + r.width / 2, y1 = r.top + r.height / 2;
    const im = h('img', { class: 'flyimg', src, style: `left:${x0 - size / 2}px;top:${y0 - size / 2}px;width:${size}px;height:${size}px` });
    document.getElementById('app').append(im);
    const dx = x1 - x0, dy = y1 - y0;
    const a = im.animate([
      { transform: 'translate(0,0) scale(.6)', offset: 0 },
      { transform: `translate(${dx * .25}px, ${dy * .25 - 90}px) scale(1.5)`, offset: .3 },
      { transform: `translate(${dx}px, ${dy}px) scale(.7)`, offset: 1 },
    ], { duration: dur, easing: 'cubic-bezier(.45,0,.55,1)' });
    return new Promise(res => { a.onfinish = () => { im.remove(); res(); }; });
  }
  countUp(el, from, to, dur = 700, onTick) {
    const t0 = performance.now();
    return new Promise(res => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        el.textContent = v; onTick?.(v);
        if (k < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
  }
  async irisOut(x = innerWidth / 2, y = innerHeight / 2, dur = 380) { await this._iris(x, y, 1, 0, dur); }
  async irisIn(x = innerWidth / 2, y = innerHeight / 2, dur = 420) { await this._iris(x, y, 0, 1, dur); this.iris.classList.remove('on'); }
  _iris(x, y, a, b, dur) {
    const el = this.iris; el.classList.add('on');
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
    const t0 = performance.now();
    return new Promise(res => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const r = R * (a + (b - a) * e);
        const m = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + 1}px)`;
        el.style.webkitMaskImage = m; el.style.maskImage = m;
        if (k < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
  }
}

// full screen: where the browser allows it (not iPhone Safari), a button that toggles it; null when unsupported
export function fullscreenBtn(ui) {
  const el = document.documentElement, can = !!(el.requestFullscreen || el.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  if (!can) return null;
  const on = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const lbl = () => on() ? '전체화면 끄기' : '전체화면';
  const b = ui.btn(lbl(), { color: 'gray', cls: 'sm', onClick: async () => {
    try { if (on()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document); else await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); } catch { ui.toast('이 브라우저에선 전체화면이 안 돼요', ''); }
  } });
  document.addEventListener('fullscreenchange', () => { const l = b.querySelector('.lbl'); if (l) l.textContent = lbl(); });
  return b;
}
