// This is a new modeling layout. The canon policefront and patrolcar stay intact.
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });

export const gptPoliceLayout = {
  w: 8, d: 6, exact: true, bleed: {}, wallH: 2.8,
  walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
  // The pavement reaches the facade; the front half is a quiet residential road.
  // (바닥은 옛 21판 그대로 — 체크 보도 + 아스팔트 차도, 사용자 10/22 '바닥 텍스처·채색을 지금 정본과 비슷하게')
  floorZones: [{ i: 0, j: 0, w: 8, d: 2.7, kind: 'checker', a: '#eceef4', b: '#dfe2ea' }],
  furniture: [
    F('gpt_policebox', 0, 0),
    { ...F('gpt_lostshelf', 0, 1), s: .8 },
    F('gpt_lostlockers', 6, 1),
    F('gpt_policenotice', 0, 2.15),
    F('gpt_patrolcar', 1, 3),
    F('gpt_policebench', 5, 3),
    F('gpt_policebikerack', 5, 4.6),
    F('gpt_policeflowers', 7, 5),
  ],
  decor: [], friendAt: [.1, -.3],
};

export const gptPoliceTheme = (baseTheme = {}) => ({
  ...baseTheme, outdoor: true, name: '햇살 드는 동네 파출소', friend: 'shiba',
  bg: ['#fef2e1', '#e8d7b7'], floorKind: 'asphalt', floor: '#e8d7b7', floor2: '#eecfa3',
  base: '#f2dcbc', wall: '#fef2e1', wall2: '#f6e0bf', wainscot: '#84ae9d',
  trim: '#fefde9', accent: '#84ae9d', accent2: '#feb53d', accent3: '#ee9d4c',
  wood: '#eaa440', woodD: '#c67f2a', plaster: '#fef2e1', pave: '#e8d7b7',
  tactile: false,
});
