// 26판 후보 둘 (gpt2-c, fix-1022 a83e02b 반영 — ① 10/22 들여옴): 멍뭉이네 마당 2층집 gptdoghouse · 멍뭉이네 골목 계단집 gptdoghouse2.
// 들여온 것은 배치(방·가구 자리·테마)뿐: 작업장의 장치 엔진·걷기 엔진·물건 자리(targets)·미리보기 분기는 뺐다.
// 바뀐 점: 작업장 map.js의 def.scenery(동네·마당 디테일·ㄱ자 바닥)는 우리 map.js에 없어서, 방마다 '바탕' 조각(gpt2c_dogground)이
// 대신 짓고 걷기 벽(화단·기둥·현관 벽)을 walkBoxes로 준다 (gfx/gpt2c-dog-architecture.js).
// 색: 빌더는 GPT 원색 그대로 (10/22 사용자 — 18판 다시 칠한 것보다 원색이 낫다), 테마는 벽의 크림만 옅은 중성으로.
import { FURN_INFO } from './gfx/furniture.js';

// The director's 12:36 correction (workshop): enlarge the authored footprint, keep furniture and character heights.
export const GPT2C_GROUND_SCALE = 1.25;
function spaciousHouse(m) {
  const k = GPT2C_GROUND_SCALE;
  m.gptGroundScale = k; m.fitW *= k;
  m.friendAt = m.friendAt.map((v, i) => i < 2 ? v * k : v);
  for (const r of m.rooms) {
    const L = r.layout, w = L.w, d = L.d;
    r.at = r.at.map(v => v * k);
    L.furniture = (L.furniture || []).map(fd => {
      const info = FURN_INFO[fd.type] || { w: 1, d: 1 }, turn = (fd.rot || 0) % 2;
      const fw = turn ? info.d : info.w, dd = turn ? info.w : info.d;
      const x = fd.x ?? (-w / 2 + fd.i + fw / 2), z = fd.z ?? (-d / 2 + fd.j + dd / 2);
      const out = { ...fd, x: (x + (fd.dx || 0)) * k,
        z: (z + (fd.dz || 0)) * k, a: fd.a ?? (fd.rot || 0) * Math.PI / 2 };
      // Stairs keep their real three-metre run and 2.9m rise. Their top follows the enlarged landing edge.
      if (fd.type === 'gptrotaryline') out.x += .25;
      if (fd.type === 'stool') { out.z += .35; out.x -= .1; }
      if (fd.type === 'stairsup') out.z = z + (fd.dz || 0) + (k - 1) * -.5;
      delete out.i; delete out.j; delete out.rot; delete out.dx; delete out.dz;
      return out;
    });
    L.w *= k; L.d *= k;
    L.decor = (L.decor || []).map(dd => ({ ...dd, u: dd.u * k }));
    if (L.railGaps) L.railGaps = Object.fromEntries(Object.entries(L.railGaps).map(([side, values]) => [side, values.map(v => v * k)]));
  }
  // The narrow variant's landing overlaps by 25cm so the half-metre walking grid crosses its one-metre opening.
  if (m.rooms.length === 4) {
    m.rooms[2].layout.w = 4; m.rooms[2].at[0] = .75;
    m.rooms[2].layout.railGaps.E = [.125];
  }
  // (the ground, the street ring, the yard's walls and the corner slab: one 바탕 piece in the yard draws them; each ground room gets its walking walls)
  const T = m.theme, ground = side => ({ side, corner: !!m.gptCorner, k, sky: T.gptSky, far: T.gptGroundFar || T.gptSky, ground: T.gptGround, paving: T.gptPaving });
  for (const [r, side] of [[m.rooms[0], 'yard'], [m.rooms[1], 'house']]) {
    r.layout.furniture.push({ type: 'gpt2c_dogground', x: 0, z: 0, a: 0, opts: { ...ground(side), at: [r.at[0], r.at[1]] } });
  }
  return m;
}

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
// (벽의 크림 #fef2e1·#feebc8 → 아주 옅은 중성 — 사용자 "색이 왜 이렇게 누래?"; 하늘·바닥·가구는 GPT 것 그대로)
const WALL = { wall: '#f6f2ec', wall2: '#ebe5dc', trim: '#faf7f2', wallEdge: '#faf7f2', clad: '#f4efe8' };

export function gpt2cDoghouseMaps(THEMES) {
  const friend = THEMES.alleyhouse?.friend ?? 'shiba';   // (그 판의 친구는 옛 26판 그대로 — 도감·친구 열림)
  const house = { ...THEMES.my, friend, name: '멍뭉이네 마당 2층집',
    bg: ['#72c6e3', '#90d4d1'], gptSky: '#6bc7eb', gptGround: '#4cae9b', gptPaving: '#8fc6d5',
    // (텍스처 조금 더 — 사용자 10/22 '채색과 텍스처 디테일 약간만 더': 아래층은 옅은 하늘 꽃 벽지)
    wallKind: 'flower', wainscot: '#78bad1',
    floorKind: 'planks', floor: '#e7be85', floor2: '#c67f2a', base: '#f2dcbc',
    wood: '#eaa440', woodD: '#6f4b30', fwood: '#eaa440', fwoodD: '#6f4b30',
    door: '#4c99da', accent: '#ed6670', accent2: '#4c99da', accent3: '#feb53d',
    curtain: '#4c99da', sofa: '#47b6a3', fabric: '#83c9e0', fabric2: '#fff0db',
    quilt: '#e87eae', sheet: '#fef2e1', pillow: '#ffca57', rug: '#73c1db', rug2: '#f4d4e0',
    // (10/23 역할별 원본 색: 지붕은 orig 26판 보라, 문·커튼은 보라·크림 쪽으로 — 배경 동네는 그대로)
    roof: '#4c99da', roof2: '#71bfd4', pot: '#ed6670', ...WALL };
  const yard = { ...house, floorKind: 'grass', floor: '#70b950', floor2: '#409a62', base: '#7fc96b' };
  const up = { ...house, wallKind: 'wood', wall: '#9fd0e0', wall2: '#7db9d1', wainscot: '#47b6a3',
    floor: '#f0c68b', floor2: '#c67f2a' };
  const corner = { ...house, name: '멍뭉이네 골목 계단집', bg: ['#eaa3be', '#86bbd0'],
    gptSky: '#e494b4', gptGround: '#408fc6', gptGroundFar: '#6bbbe4', gptPaving: '#d8a9bb',
    roof: '#ed6670', roof2: '#e993b1' };

  const mainHouse = () => ({ theme: house, fitAll: true, fitW: 13.2, yaw: .50,
    friendAt: [-1.65, 1.9], nBonus: 0, bleed: true,
    rooms: [
      { at: [-3, 0], layout: { w: 4, d: 7, theme: yard,
        walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, noEntry: true,
        // (호루라기 연쇄를 15 cm씩 왼쪽·뒤로: 마당 북서쪽 구석이 걷기 섬이었음 — walk.mjs FIX, ① 10/22)
        furniture: [F('safe', 0, 0), F('gptdogkennel', 1, 0), { type: 'gptrotaryline', x: -1.05, z: .45, a: 0 },
          { ...F('gpttraining', 1, 5), dz: .2 }, { type: 'gptcadetlift', x: 1.20, z: -.15, a: 0 }, { type: 'gptwhistlecourse', x: -.02, z: -1.07, a: 0 }, { type: 'gptyardgate', x: 0, z: 3.4, a: 0 }], decor: [] } },
      { at: [1.5, 0], layout: { w: 5, d: 7, theme: house, wallH: 2.9, timber: true,
        walls: { N: 'wall', W: 'none', S: 'none', E: 'none' },
        furniture: [F('counter', 0, 0, 0, { variant: 'stove' }), F('counter', 1, 0),
          F('gptgearcabinet', 2, 0), F('fridge', 3, 0), F('plant', 4, 0),
          F('diningset', 0, 2), F('rug', 1, 4), F('sofa2', 1, 3), F('gptweightbench', 1, 5),
          { ...F('stairsup', 4, 3, 0, { side: 'left' }), dz: .27 },
          { type: 'laundrybasket', x: .9, z: -1.75, a: 0 },
          { type: 'gptentrydoor', x: -2.5, z: 1, a: Math.PI / 2 }],
        decor: [{ ...D('window', 'N', -1.2), dy: .38 }] } },
      { at: [1.5, -2], level: 1, layout: { w: 5, d: 3, theme: up, timber: true, gable: 'N',
        walls: { N: 'wall', W: 'wall', E: 'wall', S: 'rail' }, railGaps: { S: [-2] },
        furniture: [F('bed', 0, 0), F('gptcadetdesk', 2, 0), { type: 'stool', x: .5, z: -.87, a: 0 },
          F('bookshelf', 1, 0, 0, { seed: 26 }), { type: 'beanbag', x: -1.8, z: 1, a: 0 }],
        decor: [D('window', 'W', 0), D('clock', 'N', 1.65), { ...D('gptbadgeboard', 'N', -2), dy: .40 }] } },
    ] });
  // Second structure: a narrow side wing and an open landing, rather than the wide rear balcony.
  const cornerHouse = () => {
    const m = mainHouse();
    m.theme = corner; m.yaw = .62; m.gptCorner = true;
    m.rooms[1].layout = { ...m.rooms[1].layout, theme: corner,
      furniture: [F('counter', 0, 0, 0, { variant: 'stove' }), F('counter', 1, 0), F('gptgearcabinet', 2, 0),
        F('fridge', 3, 0), F('plant', 4, 0), F('sofa2', 1, 2), F('rug', 1, 3),
        { ...F('gptweightbench', 2, 4), dz: .5 }, F('diningset', 0, 5),
        { ...F('stairsup', 4, 3, 0, { side: 'left' }), dz: .27 },
        { type: 'gptentrydoor', x: -2.5, z: 1, a: Math.PI / 2 }] };
    m.rooms[2] = { at: [.5, -1.5], level: 1, layout: { w: 3, d: 4, theme: { ...up, ...corner, wall: '#f4bfd0', wall2: '#eaaac0', wainscot: '#76baaa', floor: up.floor, floor2: up.floor2 },
      slab: 'none', timber: true, gable: 'N',
      walls: { N: 'wall', W: 'wall', E: 'rail', S: 'rail' }, railGaps: { E: [0] },
      furniture: [F('bed', 0, 0), F('bookshelf', 1, 0, 0, { seed: 27 }),
        { type: 'gptcadetdesk', x: -.95, z: .9, a: Math.PI / 2 }, { type: 'stool', x: -.8, z: .9, a: 0 }],
      decor: [D('window', 'W', -.5), D('clock', 'N', .95), { ...D('gptbadgeboard', 'N', -1), dy: .40 }] } };
    m.rooms.push({ at: [3, -1.5], level: 1, layout: { w: 2, d: 2, theme: up, slab: 'none',
      walls: { N: 'rail', W: 'none', E: 'rail', S: 'rail' }, railGaps: { S: [-.5] },
      furniture: [F('laundrybasket', 0, 0)], decor: [] } });
    return m;
  };
  return { themes: { gptdoghouse: house, gptdoghouse2: corner },
    maps: { gptdoghouse: () => spaciousHouse(mainHouse()), gptdoghouse2: () => spaciousHouse(cornerHouse()) } };
}
