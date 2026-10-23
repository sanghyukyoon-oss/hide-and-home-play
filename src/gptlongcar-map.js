// New workshop map. Canonical traincar3 and all of its builders remain untouched.
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts: { ...opts, fix1022: true } });
const D = (type, wall, u, opts) => ({ type, wall, u, opts: { ...opts, fix1022: true } });

export function registerGptTrainMap(LAYOUTS, THEMES) {
  THEMES.gptlongcar = { ...THEMES.traincar3,
    name: '봄날의 로컬 열차', bg: ['#f8f3ec', '#e7ded1'],
    wallKind: 'plain', wall: '#f8f3ec', wall2: '#f4ecdf', wainscot: '#dfd8cc',
    trim: '#fcfcf4', wallEdge: '#f4ecdf', floorKind: 'tile', floor: '#ebe2d5', floor2: '#e7ded1',
    base: '#a2c8bb', wood: '#eecfa3', woodD: '#c67f2a', accent: '#ee9d4c',
    pool: ['bubbletea', 'sandwich', 'snack', 'gimbap2', 'map', 'umbrella', 'sunglasses', 'strawhat'],
  };
  LAYOUTS.gptlongcar = {
    w: 5, d: 12, slab: 'none', bleed: null, exact: true,
    // The N doorway is a genuine gap through the shell, matching gpt_tdoorend2's 1.09m passage.
    walls: { N: 'door', W: 'wall', E: 'none', S: 'none' }, doorAt: { N: 0 },
    wallH: 3.0, yaw: .30, fitW: 10.8, theme: THEMES.gptlongcar,
    furniture: [
      { type: 'gpt_trainworld', x: 0, z: 0, opts: { fix1022: true } },
      // Physical chassis stays visible when the window wall folds down during camera rotation.
      { type: 'gpt_tshell', x: -2.5, z: 0, a: Math.PI / 2, opts: { len: 12, width: 5, jolt: true, fix1022: true } },
      F('gpt_tbench2', 0, 1, 1, { stuff: 'paper' }), F('gpt_tbench2', 0, 3, 1, { drawer: true }),
      F('gpt_tbench2', 0, 5, 1, { stuff: 'bag' }), F('gpt_tbench2', 0, 7, 1), F('gpt_tbench2', 0, 9, 1, { stuff: 'paper' }),
      F('gpt_tbench2', 4, 1, 3), F('gpt_tbench2', 4, 3, 3), F('gpt_tbench2', 4, 5, 3, { stuff: 'toy', priority: true }),
      F('gpt_tbench2', 4, 7, 3, { stuff: 'bag' }), F('gpt_tbench2', 4, 9, 3),
      F('gpt_tcart2', 2.2, 6),
    ],
    decor: [
      D('gpt_twindow2', 'W', -4.6, { flow: true }), D('gpt_twindow2', 'W', -2.3, { blind: true, flow: true }),
      D('gpt_twindow2', 'W', 0, { paw: true, flow: true }), D('gpt_twindow2', 'W', 2.3, { flow: true }),
      D('gpt_twindow2', 'W', 4.6, { flow: true }), D('gpt_trailrack2', 'W', 0, { len: 11.8 }),
      D('gpt_tdoorend2', 'N', 0),
      D('gpt_trainpulley', 'N', 1.78),
    ],
    friendAt: [.25, -.75],
  };
  return LAYOUTS.gptlongcar;
}
