// 도감 카드 속 배경 (③ 10/21, user: "도감카드 안에 배경도 만들어주고 패럴랙스로 해줘"): three flat layers drawn once on small
// canvases — far (the sky or the wall), middle (things of the place), near (sparkles, leaves, petals) — behind and in front of
// the friend's 3D, each sliding its own amount as the card tilts. The place is the friend's region (their home, the alley,
// the park…); a thing's card gets a warm room with shelves. Cheap: three 2D canvases per open card, drawn once, no WebGL.
import { h } from './ui.js';

const W = 360, H = 300;
// the regions' colours: sky / wall, floor, and the place's own accent
const LOOK = {
  home: { sky: ['#ffe9f1', '#ffd3e2'], floor: '#f6c6a8', acc: '#ff8fb8', in: true },
  apt: { sky: ['#e6f8ef', '#c6ecd9'], floor: '#e9c79f', acc: '#5cc08a', in: true },
  alley: { sky: ['#ffe9cf', '#ffc996'], floor: '#d7b89a', acc: '#ff8a4c', in: false },
  shop: { sky: ['#e3f1ff', '#bcdcff'], floor: '#d9e2ec', acc: '#4aa3ff', in: true },
  park: { sky: ['#e2f6ff', '#bfe8ff'], floor: '#a6db6f', acc: '#6fbf45', in: false },
  camp: { sky: ['#ffd9b8', '#c9a7e8'], floor: '#b89a74', acc: '#ff9a4c', in: false },
  building: { sky: ['#d8dcff', '#a9b0f0'], floor: '#c9c3e0', acc: '#7b7ff0', in: false },
  item: { sky: ['#fff4dc', '#ffe1b0'], floor: '#e6b98a', acc: '#ffb23a', in: true },
};
const INK = '#3a2453';
const cv = draw => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d')); return c; };
const rr = (c, x, y, w, hh, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, hh, r) : c.rect(x, y, w, hh); };
const blob = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };

// far: the sky or the wall, and what's far off in it
function far(L, key) {
  return cv(c => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.sky[0]); g.addColorStop(1, L.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.lineWidth = 4; c.strokeStyle = INK;
    if (L.in) {
      // a window with its curtains and a frame on the wall
      c.fillStyle = '#bfe6ff'; rr(c, 120, 40, 120, 96, 10); c.fill(); c.stroke();
      c.strokeStyle = '#ffffffcc'; c.beginPath(); c.moveTo(180, 42); c.lineTo(180, 134); c.moveTo(122, 88); c.lineTo(238, 88); c.stroke();
      c.fillStyle = (L.curtain || L.acc) + 'cc'; for (const x of [104, 230]) { rr(c, x, 34, 26, 116, 8); c.fill(); }
      c.strokeStyle = INK; c.fillStyle = '#fffaf0'; rr(c, 34, 58, 52, 40, 6); c.fill(); c.stroke(); blob(c, 60, 78, 9, L.acc);
      if (key === 'shop') { c.fillStyle = '#ffffffaa'; for (let k = 0; k < 3; k++) { rr(c, 268, 50 + k * 34, 70, 8, 3); c.fill(); } }
      if (L.wains) { c.fillStyle = L.wains; c.fillRect(0, H * .58, W, H * .14); c.fillStyle = '#ffffff99'; c.fillRect(0, H * .58, W, 4); }
      c.fillStyle = L.floor; c.fillRect(0, H * .72, W, H * .28);
      if (L.floor2) { c.fillStyle = L.floor2 + '55'; for (let k = 0; k < 6; k++) c.fillRect(0, H * .72 + k * 15, W, 2); }
    } else {
      // the sun (or the moon)
      blob(c, 296, 58, 26, '#fff6c8');
      for (const [x, y, s] of [[70, 60, 1], [210, 42, .8]]) { c.fillStyle = '#ffffffd9'; for (const [dx, r] of [[-22, 16], [0, 22], [22, 16]]) { c.beginPath(); c.arc(x + dx * s, y, r * s, 0, 7); c.fill(); } }
      if (key === 'camp') { c.fillStyle = '#9c86c9'; c.beginPath(); c.moveTo(0, 190); c.lineTo(90, 96); c.lineTo(170, 180); c.lineTo(250, 110); c.lineTo(360, 196); c.lineTo(360, 300); c.lineTo(0, 300); c.fill(); }
      else if (key === 'building') { c.fillStyle = '#8a8fd6'; for (let k = 0; k < 7; k++) { const bw = 40 + (k * 13) % 22, bh = 70 + (k * 37) % 80; c.fillRect(k * 54 - 6, H * .7 - bh, bw, bh); } c.fillStyle = '#fff6c8'; for (let k = 0; k < 18; k++) c.fillRect(8 + (k * 61) % 340, 150 + (k * 23) % 50, 6, 8); }
      else if (key === 'alley') { c.fillStyle = '#e8a77c'; for (let k = 0; k < 5; k++) { const x = k * 78 - 10; c.fillRect(x, 120, 70, 90); c.fillStyle = '#c96b4f'; c.beginPath(); c.moveTo(x - 6, 124); c.lineTo(x + 35, 96); c.lineTo(x + 76, 124); c.fill(); c.fillStyle = '#e8a77c'; } }
      else { c.fillStyle = '#9fd88a'; c.beginPath(); c.moveTo(0, 200); c.quadraticCurveTo(110, 140, 220, 196); c.quadraticCurveTo(300, 160, 360, 190); c.lineTo(360, 300); c.lineTo(0, 300); c.fill(); }
      c.fillStyle = L.floor; c.fillRect(0, H * .74, W, H * .26);
    }
  });
}
// middle: things of the place, at the sides (the friend stands in the middle)
function mid(L, key) {
  return cv(c => {
    c.lineWidth = 4; c.strokeStyle = INK;
    const side = (x, flip) => {
      if (L.in) {
        if (key === 'item' || key === 'shop') { c.fillStyle = '#d9a066'; rr(c, x, 118, 70, 110, 6); c.fill(); c.stroke(); c.fillStyle = '#b97f48'; for (const y of [150, 188]) c.fillRect(x + 4, y, 62, 5); blob(c, x + 18, 140, 9, L.acc); blob(c, x + 46, 178, 8, '#9fd6ff'); }
        else { c.fillStyle = '#7cc46a'; for (const [dx, dy, r] of [[0, 0, 26], [-16, 14, 20], [16, 14, 20]]) blob(c, x + 35 + dx * (flip ? -1 : 1), 150 + dy, r, '#7cc46a'); c.fillStyle = '#e29a6a'; rr(c, x + 18, 172, 34, 44, 6); c.fill(); c.stroke(); }
      } else if (key === 'park' || key === 'camp') {
        c.fillStyle = key === 'camp' ? '#4f8f5f' : '#6fbf45'; c.beginPath(); c.moveTo(x + 35, 96); c.lineTo(x + 76, 196); c.lineTo(x - 6, 196); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#8a5a3a'; c.fillRect(x + 29, 196, 12, 28);
      } else {
        // a street lamp
        c.fillStyle = '#5a5f7a'; c.fillRect(x + 32, 92, 7, 132); blob(c, x + 35, 92, 13, '#fff1a8');
        c.fillStyle = L.acc; rr(c, x + 8, 196, 54, 28, 6); c.fill(); c.stroke();
      }
    };
    side(6, false); side(W - 76, true);
  });
}
// near: little things floating in front, a soft vignette at the edge
function near(L, key) {
  return cv(c => {
    const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, '#0000'); g.addColorStop(1, '#3a245322'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const pts = [[30, 40], [330, 70], [60, 250], [300, 240], [180, 24], [340, 170], [18, 160]];
    for (const [i, [x, y]] of pts.entries()) {
      if (key === 'park' || key === 'alley') { c.fillStyle = i % 2 ? '#ffb3cc' : '#9be38f'; c.beginPath(); c.ellipse(x, y, 9, 5, i, 0, 7); c.fill(); }
      else if (key === 'camp' || key === 'building') blob(c, x, y, 4 + (i % 3), '#fff6a8');
      else { c.fillStyle = i % 2 ? '#ffffff' : L.acc; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? 3 : 9; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); }
    }
  });
}

// the scene for a card: { back (far + middle), front (near), move(nx, ny) } — nx, ny in −.5….5, the card's tilt
export function cardScene(region, { sil = false, theme = null } = {}) {
  const key = LOOK[region] ? region : 'home';
  // a friend's own room colours (their stage's theme: the wall, its panel, the floor, the curtains, their accent) — each friend's
  // card a different room, not one pink wall for everyone at home
  const L = theme ? { ...LOOK[key], ...(LOOK[key].in ? { sky: [theme.wall || LOOK[key].sky[0], theme.wall2 || LOOK[key].sky[1]], floor: theme.floor || LOOK[key].floor, floor2: theme.floor2, wains: theme.wainscot, curtain: theme.curtain } : {}), acc: theme.accent || LOOK[key].acc } : LOOK[key];
  const lay = (cls, c) => { const d = h('div', { class: 'cb-pl ' + cls }); c.className = 'cb-plc'; d.append(c); return d; };
  const f = lay('far', far(L, key)), m = lay('mid', mid(L, key)), n = lay('near', near(L, key));
  const back = h('div', { class: 'cb-par' + (sil ? ' sil' : '') }, f, m), front = h('div', { class: 'cb-par front' + (sil ? ' sil' : '') }, n);
  // deeper layers slide against the tilt, the near one with it — as if the card were a window onto the place
  const move = (nx, ny, ease = false) => {
    for (const [el, k] of [[f, -14], [m, -6], [n, 16]]) { el.style.transition = ease ? 'transform .35s cubic-bezier(.2, 1.4, .4, 1)' : ''; el.style.transform = `translate(${(nx * k).toFixed(1)}px, ${(ny * k * .8).toFixed(1)}px)`; }
  };
  return { back, front, move };
}
