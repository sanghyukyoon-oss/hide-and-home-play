// The journey map: all stages on one winding path, region by region (bottom = stage 1). Opens from home.
// Cleared stages show their stars, the next one carries 몽글이, story stages show their cast, bosses are big.
import { STAGE_COUNT, REGIONS, stageSpec, THEMES } from './stages.js';
import { storyFor } from './story.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { h, ICON } from './ui.js';

const REGION_LOOK = {
  home: { bg: ['#fff4e6', '#ffe6d2'], band: '#ffd9bf', ink: '#b8643a', cast: ['bunny', 'bear', 'cat', 'peng'], blurb: '친구들 집에서 숨바꼭질' },
  alley: { bg: ['#f1ecff', '#e3dcf5'], band: '#d6cdee', ink: '#6b55a8', cast: ['grumpy', 'skater', 'shiba'], blurb: '정겨운 골목길 탐험' },
  park: { bg: ['#e9fbe2', '#d4f2c8'], band: '#bfe7ad', ink: '#3d8a3a', cast: ['frog', 'squirrel', 'hamster'], blurb: '공원에서 소풍 대소동' },
  camp: { bg: ['#e4efff', '#d9e3f7'], band: '#c6d4ef', ink: '#3f5f9e', cast: ['panda', 'sleepy', 'robot'], blurb: '산길 따라 캠핑장으로' },
  apt: { bg: ['#fff6e6', '#ffe9cc'], band: '#ffdcae', ink: '#a8622e', cast: ['bunny', 'tv', 'mug'], blurb: '이사 온 아파트 집들이' },
  shop: { bg: ['#e9fbf4', '#d8f3e8'], band: '#bfe8d6', ink: '#2f8a6a', cast: ['shiba', 'cone', 'sundae'], blurb: '편의점·빨래방·카페 탐방' },
  building: { bg: ['#eef2ff', '#dde4f7'], band: '#c9d3ef', ink: '#3c4f8f', cast: ['nerd', 'robot', 'dj'], blurb: '로비부터 옥상까지 수수께끼' },
};
const STEP = 112, PAD_BOTTOM = 150, HEAD = 150;
const LOCK_NAME = { pad: '열쇠', code: '비밀번호', color: '색깔', lever: '레버' };

export function openRoadmap(G, { onClose } = {}) {
  const S = G.save, cur = Math.min(S.stage || 0, STAGE_COUNT - 1), review = !!S.settings?.review;
  const root = h('div', { class: 'roadmap' });
  const stars = Object.values(S.best || {}).reduce((a, b) => a + b, 0);
  const back = h('div', { class: 'rm-back', html: ICON.home });
  root.append(h('div', { class: 'rm-top' }, back, h('div', { class: 'rm-title ol' }, '몽글이의 여행 지도'),
    h('div', { class: 'rm-stars', html: ICON.star }, h('span', {}, `${stars} / ${STAGE_COUNT * 3}`)), review ? h('div', { class: 'rm-review' }, '리뷰 모드: 전부 열림') : null));
  const scroll = h('div', { class: 'rm-scroll' }), track = h('div', { class: 'rm-track' });
  scroll.append(track); root.append(scroll);
  // layout: stage i sits at y measured from the bottom; each region starts with a header band
  const pos = [];
  let y = PAD_BOTTOM;
  for (const R of REGIONS) {
    const L = REGION_LOOK[R.id];
    const y0 = y - 70;
    for (let i = R.from; i < R.to; i++) { const k = i - R.from; pos[i] = { x: 50 + Math.sin(k * .95 + R.from) * 28, y }; y += STEP; }
    const y1 = y + HEAD - 40;
    const band = h('div', { class: 'rm-band', style: `bottom:${y0}px;height:${y1 - y0}px;background:linear-gradient(0deg, ${L.bg[0]}, ${L.bg[1]})` });
    // region header (at the region's start, i.e. its top edge in scroll order = after its last stage)
    const head = h('div', { class: 'rm-head', style: `bottom:${y + 6}px;border-color:${L.ink}` },
      h('div', { class: 'rm-faces' }, ...L.cast.map(k => h('img', { src: G.thumbs['face_' + k] }))),
      h('div', {}, h('div', { class: 'rm-rname', style: `color:${L.ink}` }, R.name), h('div', { class: 'rm-rblurb' }, `${R.from + 1}~${R.to}판 · ${L.blurb}`)));
    track.append(band, head);
    y += HEAD;
  }
  const H = y + 40;
  track.style.height = H + 'px';
  // the winding path
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'rm-path'); svg.setAttribute('viewBox', `0 0 100 ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
  let d = '';
  for (let i = 0; i < STAGE_COUNT; i++) {
    const p = pos[i], yy = H - p.y;
    if (!i) { d += `M ${p.x} ${yy}`; continue; }
    const q = pos[i - 1], qy = H - q.y;
    d += ` C ${q.x} ${qy - 45}, ${p.x} ${yy + 45}, ${p.x} ${yy}`;
  }
  for (const [cls, w] of [['rm-road', 11], ['rm-dash', 2.2]]) {
    const pth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pth.setAttribute('d', d); pth.setAttribute('class', cls); pth.setAttribute('stroke-width', w); pth.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(pth);
  }
  track.append(svg);
  // nodes
  for (let i = 0; i < STAGE_COUNT; i++) {
    const sp = stageSpec(i), story = storyFor(i), best = S.best?.[i] || 0;
    const open = i <= cur || review, done = best > 0, here = i === cur;
    const cls = ['rm-node', story ? 'story' : '', sp.boss ? 'boss' : '', done ? 'done' : '', here ? 'here' : '', open ? '' : 'locked'].filter(Boolean).join(' ');
    const n = h('div', { class: cls, style: `left:${pos[i].x}%;bottom:${pos[i].y}px` });
    if (story?.cast) n.append(h('img', { class: 'rm-cast', src: G.thumbs['face_' + story.cast] }));
    n.append(h('div', { class: 'rm-num ol' }, String(i + 1)));
    if (!open) n.append(h('div', { class: 'rm-lock', html: ICON.lock }));
    if (story) n.append(h('div', { class: 'rm-badge' }, '★ 스토리'));
    else if (sp.boss) n.append(h('div', { class: 'rm-badge boss' }, '보스'));
    if (done) n.append(h('div', { class: 'rm-stars3' }, ...[0, 1, 2].map(k => h('i', { html: k < best ? ICON.star : ICON.starGray }))));
    if (here) n.append(h('img', { class: 'rm-me', src: G.thumbs.face_mong }));
    n.addEventListener('pointerup', e => { e.stopPropagation(); if (!open) { G.audio.sfx('locked'); G.ui.toast('앞 판을 깨면 열려요!', 'red'); return; } info(i); });
    track.append(n);
  }
  const info = i => {
    const sp = stageSpec(i), story = storyFor(i), th = THEMES[sp.room] || {};
    G.audio.sfx('pop', 3);
    const locks = (sp.lock || []).map(k => LOCK_NAME[k]).filter(Boolean);
    G.ui.panel({
      title: `스테이지 ${i + 1}`, color: story ? 'orange' : sp.boss ? 'red' : 'blue',
      body: [
        h('div', { class: 'big-txt' }, story ? story.title : th.name || ''),
        h('div', { class: 'txt' }, [`찾을 물건 ${sp.n}개`, locks.length ? `자물쇠: ${locks.join('·')}` : null, story ? ['스토리', story.chain ? '퍼즐' : null, story.secret ? '비밀 아이템' : null].filter(Boolean).join(' · ') : sp.boss ? '방탈출 보스' : sp.hard ? '하드' : null].filter(Boolean).join(' · ')),
        th.friend ? h('div', { class: 'rm-who' }, h('img', { src: G.thumbs['face_' + (story?.cast || th.friend)] }), h('span', {}, `${CHAR_DEFS[story?.cast || th.friend]?.name || ''}의 방`)) : null,
      ].filter(Boolean),
      buttons: [G.ui.btn('닫기', { color: 'blue', cls: 'sm', onClick: () => G.ui.closePanel() }), G.ui.btn('플레이', { color: 'green', icon: 'play', cls: 'big', onClick: () => { close(); G.go('stage', { idx: i }); } })],
    });
  };
  const close = () => { G.ui.closePanel(true); root.classList.add('out'); setTimeout(() => root.remove(), 200); onClose?.(); };
  back.addEventListener('pointerup', e => { e.stopPropagation(); G.audio.sfx('btn'); close(); });
  root.addEventListener('pointerdown', e => e.stopPropagation());
  document.getElementById('app').append(root);
  // start scrolled to the current stage
  requestAnimationFrame(() => { scroll.scrollTop = H - pos[cur].y - scroll.clientHeight * .6; });
  return { close };
}
