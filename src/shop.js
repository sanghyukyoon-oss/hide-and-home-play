// Shop panel: furniture, wallpaper, paint, floors and home-zone expansions, all bought with in-game coins.
import { h, ICON } from './ui.js';
import { FURN_INFO } from './gfx/furniture.js';
import { SHOP_FURN, WALLPAPERS, PAINTS, FLOORS, HOME_ZONES, ZONE_TYPES, HOME_STYLES, ZONE_SIZES, pinZoneFurniture, furnPrice, zoneLayout, STARTER } from './catalog.js';
import { Room } from './room.js';
import { layoutFor, LAYOUTS } from './stages.js';
import { renderThumbs } from './thumbs.js';

// a little 3D picture of each home style (its stage set, or the plain zone with the starter furniture), made once
const STYLE_ART = {};
const fakeWorld = { shadowDirty: false, yaw: Math.PI / 4 };
function styleArt(list) {
  const jobs = list.filter(st => !STYLE_ART[st.id]).map(st => ({ key: st.id, dir: [.9, .95, 1], fit: .92, build: () => {
    const lay = st.theme && LAYOUTS[st.theme] ? { ...layoutFor(st.theme), bleed: null } : { ...zoneLayout({ type: st.indoor ? 'room' : 'yard', style: st.id, furniture: STARTER[st.indoor ? 'room1' : 'yard'] }), bleed: null };
    lay.walls = { ...(lay.walls || {}), S: 'none', E: 'none' };   // the picture looks in from the open front
    return new Room(fakeWorld, lay).group;
  } }));
  if (jobs.length) try { Object.assign(STYLE_ART, renderThumbs(jobs, 220)); } catch {}
  return STYLE_ART;
}

const TABS = [['furn', '가구'], ['style', '테마'], ['size', '방 크기'], ['wall', '벽지'], ['paint', '페인트'], ['floor', '바닥'], ['zone', '구역 확장']];

// ctx: { G, zone (current zone object or null), onChange() }
export function openShop(G, ctx = {}, tab = 'furn') {
  const ui = G.ui, H = G.save.home;
  const zone = ctx.zone, ztype = zone ? ZONE_TYPES[zone.type] : null;
  const tabsEl = h('div', { class: 'shoptabs' });
  const grid = h('div', { class: 'shopgrid' });
  const note = h('div', { class: 'txt', style: 'font-size:14px;margin:4px 0 8px' });
  const render = () => {
    tabsEl.innerHTML = '';
    for (const [k, label] of TABS) tabsEl.append(h('button', { class: 'shoptab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; G.audio.sfx('click'); render(); } }, label));
    grid.innerHTML = '';
    note.textContent = '';
    if (tab === 'furn') {
      note.textContent = zone ? `${zone.name}에 놓을 수 있는 가구예요. 숨을 곳이 많을수록 찾기 어려워져요.` : '';
      for (const it of SHOP_FURN) {
        if (ztype && !(ztype.indoor ? it.indoor : it.outdoor)) continue;
        const inf = FURN_INFO[it.type]; if (!inf) continue;
        const owned = countOwned(H, it.type);
        grid.append(card(G, { img: G.thumbs['furn_' + it.type], name: inf.name, sub: `숨을 곳 ${spotCount(G, it.type)}`, price: furnPrice(it.type), tag: owned ? `보유 ${owned}` : null,
          onBuy: () => { H.inventory.push(it.type); G.persist(); ui.toast(`${inf.name} 구입! 보관함에서 꺼내 놓자`, 'green'); ctx.onChange?.('furn'); } }));
      }
    } else if (tab === 'wall' || tab === 'paint') {
      if (!zone || !ztype.indoor) { note.textContent = '벽지와 페인트는 실내 구역(방·창고)에 쓸 수 있어요.'; }
      for (const wp of tab === 'wall' ? WALLPAPERS : PAINTS) {
        const owned = H.owned.wall.includes(wp.id), on = zone?.paint?.wallId === wp.id || (!zone?.paint?.wallId && wp.price === 0 && tab === 'wall');
        grid.append(card(G, { swatch: swatch(wp.wall, wp.wall2, wp.wallKind), name: wp.name, price: owned ? null : wp.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '바르기' : null,
          onBuy: owned ? null : () => { H.owned.wall.push(wp.id); apply(); },
          onUse: () => apply() }));
        function apply() {
          if (!zone || !ztype.indoor) { ui.toast('실내 구역에서만 바를 수 있어요', 'red'); G.persist(); render(); return; }
          zone.paint = { ...(zone.paint || {}), wallId: wp.id, wallKind: wp.wallKind, wall: wp.wall, wall2: wp.wall2, ...(wp.wainscot ? { wainscot: wp.wainscot } : {}) };
          G.persist(); G.audio.sfx('place'); ctx.onChange?.('paint'); render();
        }
      }
    } else if (tab === 'floor') {
      for (const fl of FLOORS) {
        if (ztype && fl.indoor !== ztype.indoor) continue;
        const owned = fl.price === 0 || H.owned.floor.includes(fl.id), on = zone?.paint?.floorId === fl.id;
        grid.append(card(G, { swatch: swatch(fl.floor, fl.floor2, fl.floorKind === 'checker' ? 'check' : fl.floorKind === 'planks' ? 'wood' : 'dots'), name: fl.name, price: owned ? null : fl.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '깔기' : null,
          onBuy: owned ? null : () => { H.owned.floor.push(fl.id); apply(); },
          onUse: () => apply() }));
        function apply() {
          if (!zone) return;
          zone.paint = { ...(zone.paint || {}), floorId: fl.id, floorKind: fl.floorKind, floor: fl.floor, floor2: fl.floor2 };
          G.persist(); G.audio.sfx('place'); ctx.onChange?.('paint'); render();
        }
      }
    } else if (tab === 'style') {
      note.textContent = zone ? `${zone.name}의 분위기를 통째로 바꿔요. 바꾸면 벽지·바닥은 그 테마 것으로 돌아가요.` : '';
      H.owned.style = H.owned.style || [];
      const shown = HOME_STYLES.filter(st => !ztype || st.indoor === ztype.indoor), art = styleArt(shown);
      for (const st of shown) {
        const owned = st.price === 0 || H.owned.style.includes(st.id), on = (zone?.style || (st.price === 0 ? st.id : null)) === st.id && (zone?.style ? true : st.price === 0);
        grid.append(card(G, { img: art[st.id], swatch: swatch(st.sw[0], st.sw[1], st.indoor ? 'wood' : 'dots'), name: st.name, price: owned ? null : st.price, tag: on ? '사용 중' : owned ? '보유' : null,
          action: owned ? '바꾸기' : null,
          onBuy: owned ? null : () => { H.owned.style.push(st.id); apply(); },
          onUse: () => apply() }));
        function apply() {
          if (!zone) return;
          zone.style = st.id; zone.paint = {};
          G.persist(); G.audio.sfx('place'); ui.toast(`${zone.name}이(가) '${st.name}'(으)로 바뀌었어요!`, 'green'); ctx.onChange?.('paint'); render();
        }
      }
    } else if (tab === 'size') {
      const cur = zone?.size || 0;
      note.textContent = zone ? `${zone.name}을(를) 한 칸씩 넓혀요. 놓아 둔 가구와 숨긴 물건은 그대로예요.` : '';
      ZONE_SIZES.forEach((S, k) => {
        const owned = k <= cur, next = k === cur + 1;
        grid.append(card(G, { swatch: swatch('#fff3e0', '#e8c49a', 'wood'), name: `${S.w} × ${S.d}`, sub: k === 0 ? '기본 크기' : owned ? '넓힘' : next ? '다음 단계' : '앞 단계를 먼저', price: owned || !next ? null : S.price, tag: k === cur ? '지금 크기' : owned ? '보유' : null,
          onBuy: owned || !next ? null : () => { if (!zone) return; pinZoneFurniture(zone); zone.size = k; G.persist(); G.audio.sfx('win'); ui.toast(`${zone.name}이(가) ${S.w}×${S.d}로 넓어졌어요!`, 'green'); ctx.onChange?.('paint'); render(); } }));
      });
    } else if (tab === 'zone') {
      note.textContent = '스테이지를 깨면 무료로 열리고, 미리 사서 열 수도 있어요.';
      for (const z of HOME_ZONES) {
        const open = G.zoneOpen(z.id);
        grid.append(card(G, { swatch: swatch(z.type === 'yard' || z.type === 'park' ? '#9be07f' : '#ffe6c8', z.type === 'storage' ? '#c99c6c' : '#ffffff', z.type === 'park' ? 'dots' : 'wood'),
          name: z.name, sub: open ? '열림' : `스테이지 ${z.unlock.stage}에서 무료`, price: open ? null : z.unlock.price, tag: open ? '보유' : null,
          onBuy: open ? null : () => { H.bought.push(z.id); G.ensureZone(z.id); G.persist(); ui.toast(`${z.name}이(가) 열렸어요!`, 'green'); ctx.onChange?.('zone'); } }));
      }
    }
  };
  render();
  const coinPill = ui.pill('coin', G.save.coins);
  G.coinPills = [...(G.coinPills || []), coinPill];
  ui.panel({ title: '상점', color: 'orange', cls: 'shop', body: [h('div', { class: 'shophead' }, coinPill), tabsEl, note, grid], close: () => ctx.onClose?.() });
}

function card(G, { img, swatch: sw, name, sub, price, tag, action, onBuy, onUse }) {
  const c = h('div', { class: 'card' },
    tag ? h('div', { class: 'tag' }, tag) : null,
    img ? h('img', { src: img }) : sw,
    h('div', {}, name),
    sub ? h('div', { style: 'font-size:11px;color:#9b6cff' }, sub) : null,
    price != null ? h('div', { class: 'pr', html: ICON.coin + price }) : h('div', { class: 'pr', style: 'color:#2f8f1b' }, action || ''));
  c.addEventListener('click', () => {
    if (price != null && onBuy) {
      if (G.save.coins < price) { G.ui.toast('코인이 부족해요!', 'red'); G.audio.sfx('miss'); return; }
      G.addCoins(-price); G.audio.sfx('buy'); onBuy();
    } else if (onUse) onUse();
  });
  return c;
}
function swatch(a, b, kind) {
  const bg = kind === 'plain' ? a : kind === 'stripe' ? `repeating-linear-gradient(90deg, ${a} 0 10px, ${b} 10px 18px)`
    : kind === 'check' ? `conic-gradient(${b} 25%, ${a} 0 50%, ${b} 0 75%, ${a} 0) 0 0/18px 18px`
    : kind === 'wood' ? `repeating-linear-gradient(90deg, ${a} 0 14px, ${b} 14px 16px)`
    : `radial-gradient(${b} 22%, transparent 24%) 0 0/14px 14px, ${a}`;
  return h('div', { class: 'swatch', style: `background:${bg}` });
}
function countOwned(H, t) { let n = H.inventory.filter(x => x === t).length; for (const id in H.zones) n += H.zones[id].furniture.filter(f => f.type === t).length; return n; }
const _sc = {};
function spotCount(G, t) { if (_sc[t] == null) { try { _sc[t] = G.makeFurniture(t).spots.length; } catch { _sc[t] = 1; } } return _sc[t]; }
