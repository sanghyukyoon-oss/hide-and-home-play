// 손에 든 물건 (숨기기, 10/20 — user on the phone, 보스 · 보물 지키기: "에딧 하듯이 처음에 숨길 아이템이 정중앙에 크게 나오고 →
// 작아지고 → 숨기고 → (다음 것) 크게 나오고 → 숨기고 해야 될 것 같은데, 이거 전혀 내가 숨기는 건지 모르겠어").
// The thing to hide comes up big in the middle of the screen, shrinks into the hand chip at the bottom ("어디든 콕 해서
// 숨겨! · 1/3"); when it is hidden it flies from the hand to the place you tapped. The 보물 지키기 boss and 숨기기 at home
// both use it, so hiding feels the same everywhere. A tap during the big show finishes it at once.
import { h } from './ui.js';

const APP = () => document.getElementById('app');
export class Hand {
  // parent: the scene's HUD column (the chip goes with it when the HUD is rebuilt)
  // inline: the chip sits in the parent's own flow (first in it) instead of floating over the screen
  constructor(G, parent, { bottom = 'calc(118px + var(--safeB))', inline = false } = {}) {
    this.G = G; this.busy = false; this.type = null;
    this.img = h('img', { alt: '' });
    this.nameEl = h('b', {}); this.hintEl = h('span', {}); this.countEl = h('div', { class: 'hcount' });
    this.el = h('div', { class: 'handchip empty' + (inline ? ' inline' : ''), style: inline ? '' : `bottom:${bottom}` }, h('div', { class: 'hpic' }, this.img), h('div', { class: 'htxt' }, this.nameEl, this.hintEl), this.countEl);
    if (inline) parent.prepend(this.el); else parent.append(this.el);
  }
  get alive() { return this.el.isConnected; }
  set(type, { name = '', hint = '', count = '' } = {}) {
    this.type = type;
    this.img.src = type ? this.G.thumbs['item_' + type] || '' : '';
    this.nameEl.textContent = name; this.hintEl.textContent = hint; this.countEl.textContent = count;
    this.el.classList.toggle('empty', !type); if (type) this.el.classList.remove('alldone');
  }
  pop() { this.el.classList.remove('pop'); void this.el.offsetWidth; this.el.classList.add('pop'); }
  // the big show: the thing in the middle, a label over it, then down into the hand. big = false: just into the hand.
  show(type, { name = '', hint = '', count = '', label = '', big = true } = {}) {
    const G = this.G;
    this.skip?.();
    if (!big || G.bot || !this.alive) { this.set(type, { name, hint, count }); this.pop(); return Promise.resolve(); }
    this.set(null, { hint });
    this.busy = true;
    const src = G.thumbs['item_' + type] || '';
    const card = h('div', { class: 'handbig' }, h('div', { class: 'hlabel ol' }, label || name), h('img', { src, alt: '' }), h('div', { class: 'hname ol' }, name));
    APP().append(card);
    G.audio.sfx('pop', 5);
    return new Promise(res => {
      let done = false;
      const finish = () => {
        if (done) return; done = true; this.skip = null;
        card.remove(); this.busy = false;
        if (this.alive) { this.set(type, { name, hint, count }); this.pop(); G.audio.sfx('click'); }
        res();
      };
      this.skip = finish;
      const a1 = card.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
      a1.onfinish = () => setTimeout(() => {
        if (done) return;
        const r = this.el.getBoundingClientRect(), c = card.getBoundingClientRect();
        const dx = r.left + 36 - (c.left + c.width / 2), dy = r.top + r.height / 2 - (c.top + c.height / 2), s = 64 / c.width;
        const a2 = card.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${s})`, opacity: .9 }], { duration: 420, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
        a2.onfinish = finish;
      }, 520);
    });
  }
  // hidden: the picture flies from the hand to (x, y) on the screen and the hand empties
  drop(x, y) {
    if (!this.alive || !this.type) return Promise.resolve();
    const r = this.img.getBoundingClientRect(), src = this.img.src;
    this.set(null, { hint: this.hintEl.textContent });
    if (!r.width || this.G.bot) return Promise.resolve();
    const fly = h('img', { class: 'flyimg', src, style: `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px` });
    APP().append(fly);
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const a = fly.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * .5}px, ${dy * .5 - 70}px) scale(1.1)`, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: .6 }], { duration: 360, easing: 'cubic-bezier(.45,0,.55,1)' });
    return new Promise(res => { a.onfinish = () => { fly.remove(); res(); }; });
  }
  // nothing left to hide: the chip says what's next
  done(text) { this.skip?.(); this.set(null, { hint: text }); this.el.classList.add('alldone'); this.pop(); }
  remove() { this.skip?.(); this.el.remove(); }
}
