// 비밀 서재의 책등 퍼즐 (2026-10-18): five picture books stand in the wrong order; tap one, then another, and they swap.
// When the rainbow runs across all five spines unbroken, the panel says so and closes (resolves true). ✕ closes it
// (false) and keeps the order you got to. order[slot] = book id, changed in place.
import { h } from './ui.js';
import { spinePicture, SPINE_N } from './gfx/showcase-props.js';

export function spinePuzzle(G, order) {
  return new Promise(res => {
    const src = spinePicture().toDataURL();
    const root = h('div', { class: 'slide spine' });
    const hint = h('div', { class: 'slide-hint ol' }, '두 권을 차례로 눌러 자리를 바꿔 봐!');
    const sub = h('div', { class: 'spine-sub ol' }, '책등 그림이 하나로 이어지게');
    const board = h('div', { class: 'spine-board' });
    const close = h('div', { class: 'slide-close' }, '✕');
    root.append(hint, board, sub, close);
    document.getElementById('overlay').append(root);
    const cells = order.map(() => h('div', { class: 'spine-book' }));
    cells.forEach(c => board.append(c));
    let sel = -1, over = false;
    const paint = () => cells.forEach((c, s) => {
      c.style.backgroundImage = `url(${src})`;
      c.style.backgroundPosition = `${order[s] * 100 / (SPINE_N - 1)}% 50%`;
      c.classList.toggle('sel', s === sel);
    });
    const solved = () => order.every((id, s) => id === s);
    const done = ok => { if (over) return; over = true; root.classList.add('out'); setTimeout(() => root.remove(), 250); res(ok); };
    const pick = s => {
      if (over) return;
      if (sel < 0) { sel = s; G.audio.sfx('tap', 2); paint(); return; }
      if (sel === s) { sel = -1; paint(); return; }
      [order[sel], order[s]] = [order[s], order[sel]]; sel = -1; G.audio.sfx('swish'); paint();
      if (solved()) {
        // settled the moment it is right: closing it now can't lose the win (GPT QA 10/18: ✕ within 1.1 s kept the door shut)
        over = true; res(true);
        board.classList.add('won'); hint.textContent = '무지개 완성!'; sub.textContent = '딸깍… 어디선가 소리가 났어'; G.audio.sfx('special');
        setTimeout(() => { root.classList.add('out'); setTimeout(() => root.remove(), 250); }, 1100);
      }
    };
    board.addEventListener('pointerup', e => {
      e.stopPropagation();
      const r = board.getBoundingClientRect(), s = Math.floor((e.clientX - r.left) / r.width * SPINE_N);
      if (s >= 0 && s < SPINE_N) pick(s);
    });
    root.addEventListener('pointerdown', e => e.stopPropagation());
    close.addEventListener('pointerup', e => { e.stopPropagation(); done(false); });
    paint();
    if (solved()) { over = true; res(true); setTimeout(() => root.remove(), 50); return; }   // already right (set before it was closed): no puzzle again
    // the bot sorts them one swap at a time
    if (G.bot) {
      const step = () => { if (over) return; const s = order.findIndex((id, k) => id !== k); if (s < 0) return; const t = order.indexOf(s); pick(s); setTimeout(() => { pick(t); setTimeout(step, 350); }, 250); };
      setTimeout(step, 500);
    }
  });
}
