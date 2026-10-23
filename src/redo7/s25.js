// 25판 모퉁이 행복슈퍼 3안 cornershop3 (⑦ 10/23 — 사용자 "GPT 맵의 큰 골격은 맘에 듦, 디테일이 엉망 → 같은 골격으로 자연스럽고 디테일 있게 새로"):
// GPT 골격(gptcornershop: 2층 모퉁이 가게집 단면 + 바깥 철계단 → 옥상 데크 + 셔터 + 옥상 도르래 바구니 + 앞길 횡단보도)을 정본 방 문법으로.
//   1층 가게(벽 N·W, 앞·옆 열린 단면) · 옆 마당(철계단·도르래 기둥·데크 밑 자판기·자전거) · 앞 보도(과일 좌판·아이스크림 냉동고·평상·
//   박스 더미·문 앞 고양이·뽑기·입간판·전봇대·우체통) · 2층 방(뒤쪽 3 m, 난간·박공) · 옥상 데크(물탱크·고추 말리기)
//   땅은 gfx/redo7-s25-props.js cs3_base: 보도는 걷는 높이, 차도는 연석 한 단 아래로 앞·옆 두 길이 모퉁이에서 만남(벽 X).
// 옛 25판(alley3)·GPT 대안(gptcornershop)은 키로 남음. 대본·물건 표·자물쇠 칸은 roomalias.js가 alley3로 이어 줌(cornershop3 → alley3).
// 장치(설계서 25, gpt-chains-a.js gptcornershop과 같은 줄): 가게 시계(관찰 자물쇠) → 계산대 돈통(counter2, 비밀번호) → 크랭크 손잡이 →
//   셔터 크랭크(cs3_shutter): 셔터가 감기며 → 가게 안 도르래 바구니(liftbasket)가 2층으로 올라가고 → 옥상 바구니(cs3_hoist)가 내려옴 → 바구니 속.
//   부품은 모두 터치하면 저절로 움직임(판 안 드래그는 카메라 — 허브 10/23). 장치를 끄려면 아래 CHAIN_ON을 false로.
import { registerFurniture } from '../gfx/furniture.js';
import { CS3_BUILDERS, CS3_INFO, CS3_STAIRS, CS3_COUNTER, CS3_EN } from '../gfx/redo7-s25-props.js';
import { SHOP_BUILDERS } from '../gfx/shop-props.js';
import { addI18n } from '../i18n.js';

const CHAIN_ON = true;
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const AT = (type, x, z, a = 0, opts) => ({ type, x, z, a, opts });
// map → room-local (each room's centre)
const SHOP = [-1.5, -1.5], YARD = [2.5, -1.5], FRONT = [0, 2], UP = [-1.5, -2.5], DECK = [2.5, -3];
const at = (o, type, x, z, a = 0, opts) => AT(type, x - o[0], z - o[1], a, opts);

export function install(ctx) {
  const { LAYOUTS, THEMES, MAPS, SWAP, LOOK, SPEC } = ctx;
  registerFurniture(CS3_BUILDERS, CS3_INFO);
  addI18n({ ...CS3_EN, '멍뭉이네 모퉁이 행복슈퍼': "Mong's Corner Happy Mart" });
  const old = THEMES.alley3 || {}, kon = THEMES.konbini || THEMES.my || {};
  THEMES.cornershop3 = { ...old, name: '멍뭉이네 모퉁이 행복슈퍼', friend: old.friend ?? 'shiba', bg: ['#fbe9d8', '#f4dcc6'] };
  // 가게 안: 흰 타일 벽에 민트 징두리, 회백 체크 바닥 (편의점 소품 색은 편의점 테마 그대로)
  const shop = { ...kon, ...THEMES.cornershop3, wallKind: 'tile', wall: '#fbf6ec', wall2: '#e8eef0', wainscot: '#9fd3c2', trim: '#ffffff', wallEdge: '#fff8ee',
    floorKind: 'checker', floor: '#f3eee4', floor2: '#dfe7e4', base: '#d6d0c6' };
  // 옆 마당·앞 보도: 회베이지 보도블록 (점자 블록은 횡단보도 앞에만 — 바탕 섬이 그림)
  const yard = { ...old, floorKind: 'brickpave', pave: '#ddd6cc', tactile: false, floor: '#ddd6cc', floor2: '#cfc7bc', base: '#d6d0c6', plaster: '#f6ecd6', brick: '#d99a7e', roofTile: '#6aa7a0' };
  // 2층 방: 크림 줄무늬 벽, 꿀색 마루, 청록 지붕 (GPT 골격의 민트 지붕을 순하게)
  const up = { ...THEMES.my, wallKind: 'stripe', wall: '#fff4e6', wall2: '#ffe6cf', wainscot: '#e9b88f', trim: '#fff8ee', floorKind: 'planks', floor: '#f1cd9c', floor2: '#ddb07a',
    clad: '#fff3e2', roof: '#5f9f98', roof2: '#7fbcb2', base: '#e8d6bc' };
  const deck = { ...up, floorKind: 'tile', floor: '#e9e4da', floor2: '#dcd5c9' };
  const map = () => ({ theme: THEMES.cornershop3, friendAt: [-1.2, 2.55], nBonus: 0, fitAll: true, bleed: false, homeShift: [1.0, 1.0], rooms: [
    { at: SHOP, level: 0, layout: { w: 5, d: 5, theme: shop, wallH: 2.9, exact: true, noEntry: true, walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' },
      furniture: [F('drinkfridge', 0, 0), F('cs3_goods', 2, 0), F('liftbasket', 4, 0, 0, { up: true }),
        F('cupnoodlebar', 0, 1, 1), F('snackshelf', 1, 2),
        at(SHOP, 'counter2', .35, -1.0, -Math.PI / 2, { cs3: true }), F('cs3_crates', 0, 3), F('cs3_crates', 1, 4, 1),
        at(SHOP, 'cs3_front', SHOP[0], SHOP[1]), at(SHOP, 'cs3_fascia', SHOP[0], SHOP[1]), at(SHOP, 'cs3_shutter', .22, .86)],
      decor: [{ type: 'clockposter', wall: 'W', u: -.2 }, { type: 'window', wall: 'W', u: 1.6 }] } },
    { at: YARD, level: 0, layout: { w: 3, d: 5, theme: yard, exact: true, noEntry: true, walls: { N: 'alleywall', W: 'none', S: 'none', E: 'none' },
      furniture: [F('stairsup', 1, 2, 0, { steel: true }), at(YARD, 'cs3_hoist', 3.6, -1.35), at(YARD, 'cs3_deck', YARD[0], YARD[1]),
        F('vending', 0, 0), F('garden', 1, 0), F('bike2', 0, 1), F('trashbags', 2, 1), F('aircon', 0, 3, 1), F('boxstack', 0, 4)],
      decor: [{ type: 'mailbox', wall: 'N', u: .9 }] } },
    { at: FRONT, level: 0, layout: { w: 8, d: 2, theme: yard, exact: true, noEntry: true, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      furniture: [at(FRONT, 'cs3_base', 0, 0), F('cs3_stand', 0, 0), at(FRONT, 'cs3_cat', -1.86, 1.3), at(FRONT, 'icecreamchest', .1, 1.48),
        F('cs3_gacha', 5, 0), at(FRONT, 'postbox2', 2.95, 2.78), F('pyeongsang', 0, 1), at(FRONT, 'cs3_sign', .75, 2.86), at(FRONT, 'pole', 3.82, 2.86),
        // 건너편 보도 (방 밖, 길 너머): 화단 둘 · 소화전
        at(FRONT, 'cs3_planter', -3.0, 5.62), at(FRONT, 'cs3_planter', 6.62, -1.0, Math.PI / 2), at(FRONT, 'hydrant', 6.55, 5.5)] } },
    { at: UP, level: 1, layout: { w: 5, d: 3, theme: up, exact: true, walls: { N: 'wall', W: 'wall', S: 'rail', E: 'none' }, gable: 'N', timber: true,
      slab: 'cut', cut: [{ i: 4, j: 0, w: 1, d: 1 }],
      furniture: [F('bed', 0, 0), F('drawers', 1, 0), F('desk', 2, 0), F('stool', 3, 1), F('rug', 1, 1), F('dryrack', 0, 2), F('beanbag', 1, 2)],
      decor: [{ type: 'window', wall: 'N', u: -.4 }, { type: 'picture', wall: 'W', u: .3 }] } },
    { at: DECK, level: 1, layout: { w: 3, d: 2, theme: deck, exact: true, walls: { N: 'rail', E: 'rail', S: 'rail', W: 'none' }, railGaps: { S: [0] },
      furniture: [F('plant', 0, 0), F('rooftopgarden', 1, 0), F('watertank', 2, 0), F('chilimat', 2, 1)] } },
  ] });
  // (철계단: stairsup 이름 그대로 겉모양만, 계산대: 이 판만 찜기 칸 닫음 — main.js가 정본 조각을 나중에 다시 등록하므로 맵을 지을 때 감쌈; opts.steel·opts.cs3 없는 건 그대로)
  MAPS.cornershop3 = () => { registerFurniture({ stairsup: CS3_STAIRS, counter2: CS3_COUNTER(SHOP_BUILDERS.counter2) }, {}); return map(); };
  // 맑은 낮빛: 흰 해, 하늘색 하늘 (받침 블록은 바탕 섬이 대신)
  LOOK.cornershop3 = { light: { ambColor: '#f1f4f8', amb: 1.3, sunColor: '#fff4e6', sun: 2.5, shadow: .55 }, sky: ['#9fd4f2', '#d8eef9', '#eef6fb'], itemSize: .46 };
  // 판 설정: 비밀번호 자물쇠는 계산대 돈통(관찰 자물쇠 — 가게 벽시계), 시작 줌은 찍어 보고 맞춤
  SPEC.cornershop3 = s => { s.lockOn = { ...(s.lockOn || {}), code: ['counter2'] }; s.zoom = 1.12; };
  SWAP[25] = ['alley3', 'cornershop3'];
  if (CHAIN_ON) import('../gpt-chains.js').then(({ CHAINS, CHAINS_ON }) => {
    const G = CHAINS.gptcornershop, st = G?.steps?.[0];
    if (!st) return;
    CHAINS.cornershop3 = {
      spec: { lockOn: { code: ['counter2'] } },
      steps: [{ dev: 'cs3_shutter#0:0', tool: 'pulleyhandle', behind: ['code', 'pad', 'color'], dur: 2.4, payoff: 'cs3_hoist#0:0',
        links: [{ dev: 'liftbasket#0:0', at: .35 }, { dev: 'cs3_hoist#0:0', at: .7 }],
        sfx: [[.03, 'ratchet'], [.35, 'lift_metal'], [.7, 'ratchet'], [.97, 'land']], need: st.need, found: st.found, line: st.line }],
      aux: [{ dev: 'cs3_gacha#0:0', sfx: [[.05, 'ratchet'], [.6, 'pop']], line: G.aux?.[0]?.line },
        { dev: 'cs3_sign#0:0', sfx: [[.5, 'flip']] }, { dev: 'cs3_cat#0:0', sfx: [[.1, 'giggle']] }],
    };
    CHAINS_ON[25] = 'cornershop3';
  }).catch(e => console.error(e));
}
