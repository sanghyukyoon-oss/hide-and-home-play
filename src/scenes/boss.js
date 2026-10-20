import { followupAt, settleFollowup } from '../followup.js';
// 보스판 · 보물 지키기 (10/18 rework, user: "자유롭게 숨길 수 있어야 됨. 가이드 하지 말고… 원하는 곳 클릭하고 이동… 휘슬 불기로
// 다른 곳으로 유인… 세 번은 안 속게(알려 주지 말고)… 너구리 스폰 위치 랜덤… 몸으로 막는 건 취소"): tap the floor to walk there,
// tap any piece of furniture to tuck a treasure in or behind it — no glowing guide; then blow the whistle to lure 너굴이
// away (it falls for it two or three times, then no more). Earlier (2026-10-17 rework, user: "보스전이 ㅈㄴ 재미없네… 그냥 보스전 숨기는걸로 하자. 주인공이 가장 아끼는
// 3개정도 숨기고 주인공은 따라다니면서 방해하는걸로… 따라다니면서 방해하면 조금 느려지는정도"). While 너굴이 counts you run
// round the maze (the pad) and tuck your three treasures into glowing hiding places; then it goes looking. Stick close to
// it and it slows right down (and takes its time looking in); bump into it and it reels for a moment. Keep at least one
// treasure hidden until the clock runs out. Comes after stages 5, 17, 26, 36, 45, 55, 65 (BOSS_AFTER).
import * as THREE from 'three';
import { Room, attachItem } from '../room.js';
import { MapRooms } from '../map.js';
import { layoutFor, stageSpec, THEMES, REGIONS, BOSS_MAZE } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { buildItem, ITEMS } from '../gfx/items.js';
import { h } from '../ui.js';
import { lensPlus } from '../lens.js';   // 경제 B5 (10/19)
import { giftRow } from '../gift.js';
import { starTotal, gameStar, starBar } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)   // 놀이 보상: 누가, 왜 주는지 (경제·로비 10/19)
import { Tweens, clamp } from '../util.js';
import { walkGrid, gridPath, nearestTile, crossOK } from '../companion.js';
import { Ambient } from '../ambient.js';
import { disposeTree } from '../gfx/kit.js';
import { Hand } from '../handhold.js';   // 손에 든 보물: 하나씩 크게 → 손 → 콕 → 쏙 (10/20)

// once in the middle of each region (level design 10/18): the first after stage 5 as a gentle try, then after 17, 26, 36, 45,
// 55, 65 — no longer right after a region's escape-room boss (two bosses back to back)
// 10/18: also the old flashlight-boss slots after 31 and 49 (user chose 보물 지키기 new maps there)
export const BOSS_AFTER = [17, 26, 36, 48, 54];   // 18·27·37·49·55판 뒤 (10/18 밤: one a chapter from 2장, the 골목 one back)
const BOSS_MAPS = { 17: 'house2f', 26: 'alleyhouse', 36: 'shopmap', 48: 'parkwide', 54: 'cabin' };
// the nearest walkable tile to a point, floors counted (a tile right under an upper room is not near a thing up there)
const near3 = (tiles, x, y, z) => { let b = null, bd = 1e9; for (const t of tiles) { const d = Math.hypot(t.x - x, t.z - z) + Math.abs((t.y || 0) - y) * 2; if (d < bd) { bd = d; b = t; } } return b; };   // now and then, like a mid-boss (user, 10/18: "중간 보스처럼 간간히"); each region ends on a minigame boss (minis.js)   // stage index after which a boss stage comes
// tier = how many bosses before this one; each a little quicker on its feet and with a sharper nose
function tierOf(i) {
  const k = clamp(i, 0, 8);
  return {
    count: 20, time: [40, 45, 45, 50, 50, 55, 55, 60, 60][k],
    walk: 1.0 + k * .05, run: 2.8, peek: .8 + k * .02,
    near: 1.3, slow: .35,        // within `near` of you it walks at `slow` × its speed and looks in 1.7× slower
    sniff: .1 + k * .025,        // chance that its next pick is a place where a treasure really is
    climb: k % 2 === 0,          // on every other boss it can't step up onto raised floors: a safe high place
  };
}
// where a body fits: under, inside or behind these
const HIDE = {
  bed: '침대 밑', loftbed: '침대 밑', wardrobe: '옷장 안', sofa: '소파 뒤', sofa2: '소파 뒤', lobbysofa: '소파 뒤', kotatsu: '코타츠 속',
  table: '테이블 밑', kitchentable: '식탁 밑', diningset: '식탁 밑', desk: '책상 밑', pcdesk: '책상 밑', boxes: '상자 뒤', chest: '상자 뒤',
  bookshelf: '책장 옆', drawers: '서랍장 옆', counter: '조리대 옆', tvlow: 'TV장 뒤', beanbag: '빈백 뒤', monstera: '화분 뒤', plantbig: '화분 뒤',
  fridge: '냉장고 옆', bigfridge: '냉장고 옆', dishcab: '찬장 옆', foldingtable2: '테이블 밑', reception: '안내데스크 뒤', recordcab: '장식장 옆',
  washer3: '세탁기 옆', drinkfridge: '냉장고 옆', snackshelf: '진열대 뒤', cafetable: '테이블 밑', minikitchen: '부엌 옆', shoerack: '신발장 옆',
  // the shopping street, so its boss stays in the shops instead of going back to 곰돌이네 (GPT QA 10/17)
  icecreamchest: '아이스크림 통 뒤', magazinerack: '잡지꽂이 뒤', cupnoodlebar: '라면 코너 옆', counter2: '계산대 뒤', vendcoin: '교환기 옆',
  laundrybasket: '빨래 바구니 뒤', pastrycase: '진열장 뒤', espresso: '커피 머신 옆',
  kpopstage: '무대 뒤', speaker: '스피커 옆', merchtable: '굿즈 테이블 밑', photoheart: '포토존 뒤',
  thinker: '조각상 뒤', amphora: '항아리 뒤', donutart: '조각상 뒤', veiled: '작품 뒤', easel: '이젤 뒤', artcrate: '상자 뒤', museumbench: '벤치 밑', guidedesk: '데스크 뒤',
  hedgeblock: '울타리 뒤', crateblock: '상자 더미 뒤', rockblock: '바위 더미 뒤',
  quarterpipe: '램프 뒤', funbox: '펀박스 뒤', graffitiwall: '벽 뒤', boardrack: '거치대 뒤', grindrail: '레일 밑',
  reeds: '갈대 속', parasol: '파라솔 밑', fishdock: '좌대 밑', tacklebox: '도구함 뒤', fishsign: '간판 뒤', baitbucket: '미끼통 뒤',
  // outdoors
  tent: '텐트 안', tentsmall: '텐트 안', pine: '나무 뒤', pine2: '나무 뒤', tree: '나무 뒤', rock: '바위 뒤', rockpile: '바위 뒤', log: '통나무 뒤',
  bush: '덤불 속', slide: '미끄럼틀 밑', slidetower: '미끄럼틀 밑', pavilion: '정자 밑', bench: '벤치 밑', bench2: '벤치 밑', bench3: '벤치 밑',
  picnic: '테이블 밑', picnic2: '테이블 밑', vending: '자판기 옆', boxstack: '상자 뒤', trashbags: '봉투 뒤', jangdok: '장독 뒤', pyeongsang: '평상 밑',
  cooler: '아이스박스 뒤', firewood: '장작 뒤', watertank: '물탱크 뒤', outdoorunit: '실외기 뒤', deckchair: '의자 밑', stonewall: '돌담 뒤',
  konbini: '가게 옆', tteokstall: '포장마차 뒤', bikeshelter: '자전거 보관대', recyclebins: '분리수거함 뒤', sandbox2: '모래밭 옆', icecart: '수레 뒤',
  garden: '화단 뒤', daeya: '대야 뒤', shopfront: '가게 옆', lostbox: '상자 뒤', trunk: '트렁크 뒤', rooftopgarden: '화단 뒤', laundryline: '빨래 뒤',
};
const V = new THREE.Vector3();
const TREASURE_FALLBACK = ['teddy', 'console', 'crown', 'star', 'gift'];
const NOT_TREASURE = new Set(['key', 'note', 'notepiece', 'colornote', 'sockp', 'report', 'snack']);
const pick2 = a => a[Math.floor(Math.random() * a.length)];

export class BossScene {
  constructor(G) { this.G = G; this.name = 'boss'; }
  async enter({ after = 4 } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens(); this.after = after; this.tier = Math.max(0, BOSS_AFTER.indexOf(after)); this.T = tierOf(this.tier);
    const sp = stageSpec(after), reg = REGIONS.find(r => after >= r.from && after < r.to);
    // the region's maze first (a second boss in the same region gets the other one), then its wide maps and rooms
    const mz = BOSS_MAZE[reg?.id] || [], nth = BOSS_AFTER.filter(a => a < after && REGIONS.find(r => a >= r.from && a < r.to) === reg).length;
    // a real place to play in, not the six-box maze (user, 10/18: "숨기기 맵이 너무 맘에 안 든다… 정사각형 6개 모아둔 맵… 2층맵이라던지
    // 약간 넓거나 야외도 좋으니"): a two-storey house, a yard and a house, the shops side by side, the cabin and its camp
    const cands = [...new Set([BOSS_MAPS[after], ...(reg?.wide || []), sp.room, ...(reg?.rooms || []), 'house2f', 'bear2', 'bear'].filter(Boolean))]; void mz; void nth;
    for (const [ci, key] of cands.entries()) {
      const layout = layoutFor(key); if (!layout?.theme && !layout?.rooms) continue;
      const room = layout.rooms ? new MapRooms(W, layout) : new Room(W, layout);
      const rooms = room.rooms || [room];
      this.room = room; this.rooms = rooms; this.layout = layout; this.roomKey = key;   // every floor (the stairs join them)
      this.buildFloor();
      if ((this.tiles.length >= 40 && this.spots.length >= 6) || ci === cands.length - 1) break;
      disposeTree(room.group);
    }
    const th = THEMES[this.roomKey] || this.layout.theme;
    G.setBg(th.bg); W.setLight(th.light);
    W.root.add(this.room.group);
    this.ambient = new Ambient(this.room);
    this.frame();
    // 너굴이 counts at the spot farthest from where you start, facing away
    const mid = nearestTile(this.tiles, W.home.x, W.home.z) || this.tiles[0];
    const away = this.tiles.filter(t => Math.hypot(t.x - mid.x, t.z - mid.z) > 2.6);
    const far = away.length ? away[Math.floor(Math.random() * away.length)] : this.tiles.reduce((a, t) => (Math.hypot(t.x - mid.x, t.z - mid.z) > Math.hypot(a.x - mid.x, a.z - mid.z) ? t : a), mid);   // it starts somewhere new every time
    this.hero = new Char('mong'); this.hero.root.position.set(mid.x, mid.y || 0, mid.z); W.root.add(this.hero.root);   // (몽글이 hides: the 도감 pick is a friend who walks along in stages, not a new hero — 10/19; the comment had swallowed the placing, fixed same day)
    defineChar('raccoon_seek', { ...CHAR_DEFS.raccoon, name: '술래 너굴이', acc: [['hairband', { color: this.tier >= 2 ? '#7a5cff' : '#ff4f6d', bow: this.tier >= 2, side: 0 }]] });
    this.seek = new Char('raccoon_seek'); this.seek.root.position.set(far.x, far.y || 0, far.z); W.root.add(this.seek.root);
    this.seek.root.rotation.y = Math.atan2(-far.x, -far.z) + Math.PI;
    // your three favourite things: the last ones you collected (anything you can hold), else a teddy, a console, a crown
    const coll = (G.save.collection || []).filter(k => ITEMS[k] && !ITEMS[k].decoy && !NOT_TREASURE.has(k));
    const pick = [...coll.slice(-3).reverse(), ...TREASURE_FALLBACK].filter((k, i, a) => a.indexOf(k) === i).slice(0, 3);
    this.treasures = pick.map(type => ({ type, name: ITEMS[type].name, spot: null, g: null, lost: false }));
    this.time = this.T.time; this.phase = 'intro'; this.sState = 'count'; this.route = null; this.target = null; this.stun = 0; this.bumpCd = 0; this.blockT = 0;
    W.idsDirty = true; W.shadowDirty = true;
    this._was = { joy: W.joyOn, scheme: W.scheme }; W.joyOn = false;   // tap to walk, tap furniture to hide (no pad)
    W.onPad = null; W.onTap = (x, y) => this.tapAt(x, y); W.onDragStart = null; W.onRotate = null;
    this.lures = 0; this.fooled = 2 + Math.floor(Math.random() * 2);   // how many whistles it falls for (never said)
    this.buildHud();
    G.audio.music('play');
    if (this.tier === 0 && !G.skipTalk && !G.bot) {
      const { playDialog } = await import('../story.js');
      await playDialog(G, [
        { who: 'raccoon', text: '이번엔 보물 지키기야! 네가 제일 아끼는 보물 3개, 내가 다 찾으면 내 거~' },
        { who: 'mong', text: '너굴이가 세는 동안 숨길 곳을 콕! 서랍 안, 커튼 뒤, 선반 위… 누른 곳에 바로 쏙 들어가.' },
        { who: 'mong', text: '찾기 시작하면 바닥을 콕 해서 움직이고, 휘슬을 불면 너굴이가 내 쪽으로 엉뚱하게 달려와!' },
        { who: 'raccoon', text: '시간 끝까지 하나라도 남으면 네 승리! 각오해~' },
      ], { title: '보스 · 보물 지키기' });
      if (this.dead) return;
    }
    this.phase = 'count'; this.countT = this.T.count;
    this.nextHeld();   // 손에 든 보물: the first one comes up big, then into the hand (the count waits while it shows)
    if (!this.T.climb && this.rooms.some(R => R.L.raised?.length)) setTimeout(() => !this.dead && G.ui.toast('이번 너굴이는 단 위로 못 올라와! 높은 곳에 숨겨 봐', 'green'), 900);
  }
  buildFloor() {
    // only the biggest connected stretch of floor counts (a corner boxed in by furniture is no place to start or hide)
    const all = walkGrid(this.rooms, .24, this.T.climb ? { raised: true } : null), seen = new Set(); let best = [];
    for (const t of all) { if (seen.has(t)) continue; const comp = [], q = [t]; seen.add(t); while (q.length) { const u = q.pop(); comp.push(u); for (const v of u.nb) if (!seen.has(v)) { seen.add(v); q.push(v); } } if (comp.length > best.length) best = comp; }
    this.tiles = best;
    // hiding places: the walkable point right beside each piece something can be tucked under, inside or behind
    this.spots = [];
    for (const R of this.rooms) for (const r of R.furns) {
      if (r.type === 'rug') continue;
      const name = HIDE[r.type] || `${r.f.name || '가구'} 뒤`;
      const b = new THREE.Box3().setFromObject(r.f.group), c = b.getCenter(new THREE.Vector3());
      const fy = r.f.group.getWorldPosition(new THREE.Vector3()).y, t = near3(this.tiles, c.x, fy, c.z); if (!t || Math.hypot(t.x - c.x, t.z - c.z) > 1.4 || Math.abs((t.y || 0) - fy) > .6) continue;
      this.spots.push({ t, name, c, f: r.f });
    }
  }
  frame() {
    const W = this.G.world, R = this.room, big = R.rooms ? R : null;
    const c = big ? big.center : new THREE.Vector3(), span = (R.w + R.d) / Math.SQRT2 + .5;
    W.home.set(c.x, .6, c.z); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .7; W.zoom = 1.25;
    // the view is yours like in a stage (user, 10/18: "카메라가 고정이냐? 찾을 때만 캐릭터 따라가게 하고 숨은그림찾기 할 때처럼 자유롭게"):
    // drag / turn / pinch freely while you hide; while 너굴이 searches it follows 몽글이 unless you are looking round
    W.bounds = Math.max(2.6, Math.max(R.w, R.d) * .5); W.slack = null; W.minZoom = .85; W.maxZoom = 5; W.minPitch = .2; W.maxPitch = 1.35; W.camLock = false; W.inputEnabled = true; W.noDblZoom = true;   // (two drawers tapped quickly: the second was a zoom — QA3 10/19)
    W.setFit(Math.min(span, 8.6), Math.max(6.6, Math.min(span, 8.6) * .62), .47);
  }
  exit() {
    this.dead = true; const W = this.G.world; delete CHAR_DEFS.raccoon_seek;
    W.onPad = null; W.noDblZoom = false; if (this._was) { W.joyOn = this._was.joy; W.scheme = this._was.scheme; } this.ambient?.dispose();
    for (const o of [this.room.group, this.hero.root, this.seek.root, ...this.treasures.map(t => t.g).filter(Boolean)]) { W.root.remove(o); disposeTree(o); }
    this.G.ui.clear(); this.tw.clear(); this.vig?.remove();
  }

  // ── HUD: the clock, your three treasures, the hide button
  buildHud() {
    const G = this.G, ui = G.ui, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(ui.ibtn('pause', 'purple', () => this.pause()));
    this.timerEl = h('div', { class: 'timer' }, h('div', { class: 'face' }, h('img', { src: G.thumbs.face_raccoon })),
      h('div', { style: 'display:flex;flex-direction:column;flex:1;min-width:0;gap:3px' }, this.tlEl = h('div', { class: 'tl' }, '보물을 숨겨!'), h('div', { class: 'tbar' }, this.tbarI = h('i', { style: 'width:100%' }))),
      this.tnum = h('div', { class: 'num ol' }, String(this.T.time)));
    top.append(this.timerEl, h('div', { class: 'stagetag ol', html: `보스<b>${this.tier + 1}</b>` }));
    col.append(top);
    this.slots = this.treasures.map(t => h('div', { class: 'tslot' }, h('img', { src: G.thumbs['item_' + t.type] })));
    col.append(h('div', { class: 'tslots' }, ...this.slots));
    this.hideBtn = ui.btn('휘슬 삐익!', { color: 'pink', cls: 'big', onClick: () => this.whistle() });
    this.goBtn = ui.btn('다 숨겼어! 시작', { color: 'green', cls: 'boss-go', onClick: () => { if (this.phase === 'count') this.countT = Math.min(this.countT, .01); } });
    col.append(this.goBtn, h('div', { class: 'boss-left' }, this.hideBtn));
    this.hand = new Hand(G, col, { bottom: 'calc(28px + var(--safeB))' });
    this.vig = h('div', { class: 'boss-vig' }); document.getElementById('app').append(this.vig);
    this.drawSlots();
  }
  // the next treasure to hide: big in the middle, then into the hand; none left — the hand says start
  nextHeld() {
    if (!this.hand || this.dead || this.phase !== 'count') return;
    const i = this.treasures.findIndex(t => !t.spot), n = this.treasures.length;
    if (i < 0) { this.hand.done('셋 다 숨겼어! 위의 시작을 콕'); return; }
    const t = this.treasures[i];
    this.hand.show(t.type, { name: t.name, label: `보물 ${i + 1}/${n}`, hint: '어디든 콕 해서 숨겨!', count: `${i + 1}/${n}` });
  }
  drawSlots() { this.treasures.forEach((t, i) => { const el = this.slots[i]; el.classList.toggle('hidden', !!t.spot && !t.lost); el.classList.toggle('lost', t.lost); el.classList.toggle('todo', !t.spot); el.classList.toggle('danger', !t.lost && !!t.spot && this.target === t.spot && this.phase === 'seek'); }); }
  say(ch, text, ms = 1200) {
    const b = h('div', { class: 'bubble pop' }, text); this.G.ui.wui.append(b);
    this.G.audio.voice?.(text, ch?.kind);   // (목소리 — 10/20)
    const upd = () => { const p = this.G.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .2)); b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
  }
  pause() {
    if (this.result) return;
    const G = this.G; this.paused = true;
    G.ui.panel({ title: '잠깐 쉬기', color: 'purple', body: [h('div', { class: 'txt' }, '너굴이도 기다려 줄게!')],
      buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
        G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => G.go('stage', { idx: this.after + 1 }) }),
        G.ui.btn('계속', { color: 'green', icon: 'play', onClick: () => { G.ui.closePanel(); this.paused = false; } })] });
  }

  // ── you: run with the pad, tuck treasures away
  spotNear() { const p = this.hero.root.position; let b = null, bd = .9; for (const s of this.spots) { const d = Math.hypot(s.t.x - p.x, s.t.z - p.z); if (d < bd) { bd = d; b = s; } } return b; }
  roomAt(x, z) { return this.rooms.find(R => { const o = R.group.position; return Math.abs(x - o.x) <= R.w / 2 && Math.abs(z - o.z) <= R.d / 2; }) || null; }
  // a little narrower than the seeker's grid, and steps up onto anything raised: you never get stuck on a ledge
  canStand(x, z) {
    const R = this.roomAt(x, z); if (!R) return false;
    for (const [dx, dz] of [[.18, 0], [-.18, 0], [0, .18], [0, -.18]]) if (!this.roomAt(x + dx, z + dz)) return false;
    return R.clearAt(x, z, .18, { raised: true });
  }
  floorY(x, z) { const R = this.roomAt(x, z); if (!R) return 0; const o = R.group.position; return o.y + (R.heightAt(Math.floor(x - o.x + R.w / 2), Math.floor(z - o.z + R.d / 2)) || 0); }
  canStep(x0, z0, x1, z1) { if (!this.canStand(x1, z1)) return false; const A = this.roomAt(x0, z0), B = this.roomAt(x1, z1); return !A || !B || crossOK(A, B, (x0 + x1) / 2, (z0 + z1) / 2); }
  moveHero(dx, dz) {
    const p = this.hero.root.position;
    if (this.canStep(p.x, p.z, p.x + dx, p.z + dz)) { p.x += dx; p.z += dz; }
    else if (this.canStep(p.x, p.z, p.x + dx, p.z)) p.x += dx;
    else if (this.canStep(p.x, p.z, p.x, p.z + dz)) p.z += dz;
    const fy = this.floorY(p.x, p.z); p.y += (fy - p.y) * .5;
    if (Math.hypot(dx, dz) > 1e-4) { const a = Math.atan2(dx, dz), r = this.hero.root.rotation.y; this.hero.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * .35; }
  }
  runPad(dir, v, dt) {
    if (!v || this.phase === 'intro' || this.result || this.paused) return;
    const W = this.G.world, y = W.yaw, rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y);
    const sp = this.T.run * v * dt, mx = rx * dir[0] - fx * dir[1], mz = rz * dir[0] - fz * dir[1];
    this.moveHero(mx * sp, mz * sp); this.hero.lift = Math.abs(Math.sin(this.t * 14)) * .06 * v;
  }
  // tap the floor: walk there · tap a piece of furniture (while it counts): walk over and tuck a treasure in or behind it
  tapAt(x, y) {
    if (this.phase === 'intro' || this.result || this.paused) return;
    const W = this.G.world, hit = W.pick(x, y, [this.room.group])[0]; if (!hit) return;
    let f = null; for (let o = hit.object; o && !f; o = o.parent) f = o.userData?.furn || null;
    const spot = f && this.spots.find(s => s.f === f);
    // while it counts: the treasure goes straight into the very place you tapped — a drawer, behind the curtain, on the
    // shelf — the way you hide things at home (user, 10/18: "걸어다니면서 숨기지 않고 그냥 내가 원하는 곳에 배치")
    if (this.phase === 'count' && this.hand?.busy) { this.hand.skip?.(); return; }   // (a tap during the big show: straight into the hand)
    if (f && this.phase === 'count' && this.treasures.some(t => !t.spot)) {
      const fs = (f.spots || []).filter(q => !q.bossTre).sort((a, b) => a.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(hit.point) - b.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(hit.point))[0] || null;
      if (spot && !spot.tre) { this.hand?.drop(x, y); this.hideTreasure(spot, false, fs); setTimeout(() => this.nextHeld(), 650); } else if (spot) this.hideTreasure(spot, false, fs); else this.G.ui.toast('여기엔 숨길 데가 없어! 다른 가구를 콕', '');
      W.fx.ring(x, y, { r: 40, color: '#ff9ec2', width: 6, life: .4 }); return;
    }
    const p = spot ? spot.t : hit.point; this._ty = spot ? (spot.t.y || 0) : hit.point.y;
    this.walkTo(p.x, p.z); this._ty = null; W.fx.ring(x, y, { r: 30, color: '#ffffff', width: 5, life: .35 });
  }
  walkTo(x, z, then = null) {
    const hp = this.hero.root.position, a = near3(this.tiles, hp.x, hp.y, hp.z), b = near3(this.tiles, x, this._ty ?? hp.y, z);
    this.hpath = a && b ? (gridPath(a, b) || []) : []; this.hthen = then;
    if (!this.hpath.length && then) { this.hthen = null; then(); }
  }
  stepHero(dt) {
    const t = this.hpath?.[0]; if (!t) return;
    const p = this.hero.root.position, dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), st = this.T.run * dt;
    if (d <= st) { p.x = t.x; p.z = t.z; this.hpath.shift(); if (!this.hpath.length && this.hthen) { const f = this.hthen; this.hthen = null; f(); } }
    else { p.x += dx / d * st; p.z += dz / d * st; }
    p.y += ((t.y || 0) - p.y) * Math.min(1, dt * 10);
    const a = Math.atan2(dx, dz), r = this.hero.root.rotation.y; this.hero.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 12);
    this.hero.lift = Math.abs(Math.sin(this.t * 14)) * .06;
  }
  // the whistle: 너굴이 runs over to where you are and searches there — it falls for it a couple of times, then no more
  whistle() {
    if (this.phase !== 'seek' || this.result || this.paused || (this.whT || 0) > 0) return;
    const G = this.G; this.whT = 3.5; this.lures++;
    G.audio.sfx('special'); this.say(this.hero, '삐이익~!', 900);
    if (this.lures > this.fooled) { setTimeout(() => !this.dead && !this.result && this.say(this.seek, pick2(['흥, 또 휘슬? 이제 안 속아~', '그 소리 이제 질렸지롱~', '안 속는다~ 킁킁']), 1400), 500); return; }
    setTimeout(() => {
      if (this.dead || this.result) return;
      this.say(this.seek, pick2(['어? 저쪽에서 소리가!', '거기 숨었구나!', '휘슬 소리다~!']), 1100);
      const hp = this.hero.root.position;
      // it heads for you and looks in whatever is nearest you there (so don't whistle right beside your treasure!)
      const near = this.spots.slice().sort((p, q) => Math.hypot(p.t.x - hp.x, p.t.z - hp.z) - Math.hypot(q.t.x - hp.x, q.t.z - hp.z))[0];
      this.sState = 'search'; this.target = near || null; this.route = null;
      if (near) { (this.looked || (this.looked = new Set())).add(near); if (!this.goTo(near.t.x, near.t.z, near.t.y || 0)) this.target = null; }
      this.drawSlots();
    }, 450);
  }
  hideTreasure(at = null, quiet = false, fs = undefined) {
    const G = this.G, s = at || this.spotNear(), t = this.treasures.find(x => !x.spot);
    if (!t || this.phase !== 'count') return;
    if (!s) { G.ui.toast('숨길 가구를 콕 해 봐!', ''); return; }
    if (s.tre) { G.ui.toast('여긴 벌써 숨겼어! 다른 곳에', ''); return; }
    t.spot = s; s.tre = t;
    if (fs === undefined) fs = (s.f.spots || []).filter(q => !q.bossTre)[Math.floor(Math.random() * Math.max(1, (s.f.spots || []).length))] || null;
    const g = t.g = buildItem(t.type);
    if (fs) {
      // into the piece's own hiding place (a drawer or a door opens a moment and shuts again)
      attachItem(fs, g, { rotY: Math.random() * Math.PI * 2, scale: .85 }); fs.bossTre = t; t.fs = fs;
      const P = fs.part; if (P && !quiet) { this.tw.run(.2, k => P.setOpen(k)).then(() => this.tw.wait(.45)).then(() => this.tw.run(.2, k => P.setOpen(1 - k))).then(() => { g.visible = false; }); } else if (P) { g.visible = false; P.setOpen(0); }
    } else {   // a piece with no hiding place of its own: tucked in beside it, part way under
      g.scale.setScalar(.85); g.position.set(s.t.x + (s.c.x - s.t.x) * .5, (s.t.y || 0) + .01, s.t.z + (s.c.z - s.t.z) * .5); g.rotation.y = Math.random() * Math.PI * 2;
      this.G.world.root.add(g);
    }
    this.G.world.idsDirty = true; this.G.world.shadowDirty = true;
    if (!quiet) { G.audio.sfx('pop', 3 + this.treasures.filter(x => x.spot).length); this.say(this.hero, `${fs?.label || s.name}에 ${t.name} 쏙!`, 1000); const s0 = g.scale.x; this.tw.run(.25, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .3))); }
    this.drawSlots();
    if (this.treasures.every(x => x.spot)) { this.goBtn.classList.add('pulse'); if (!quiet) G.ui.toast('셋 다 숨겼어! 시작을 눌러도 돼', 'green'); }
  }
  // whatever is still in your hands when it stops counting goes somewhere at random
  hideRest() {
    const free = this.spots.filter(s => !s.tre);
    for (const t of this.treasures) if (!t.spot && free.length) this.hideTreasure(free.splice(Math.floor(Math.random() * free.length), 1)[0], true);
  }

  // ── 너굴이: walks to the next hiding place and looks in — slowly if you're in its way
  goTo(x, z, y = null) {
    const sp = this.seek.root.position, from = near3(this.tiles, sp.x, sp.y, sp.z), to = y == null ? nearestTile(this.tiles, x, z) : near3(this.tiles, x, y, z);
    this.route = from && to ? gridPath(from, to) : null;
    return !!this.route;
  }
  nextSpot() {
    const G = this.G, a = this.seek.root.position, done = this.looked || (this.looked = new Set());
    let pool = this.spots.filter(s => !done.has(s)); if (!pool.length) { done.clear(); pool = this.spots.slice(); }
    const left = pool.filter(s => s.tre && !s.tre.lost);
    let pick;
    // its nose: sometimes it heads straight for a real one (more often as the clock runs down)
    if (left.length && Math.random() < this.T.sniff + (1 - this.time / this.T.time) * .08) {
      pick = left.sort((p, q) => Math.hypot(p.t.x - a.x, p.t.z - a.z) - Math.hypot(q.t.x - a.x, q.t.z - a.z))[0];
      this.say(this.seek, '킁킁… 이쪽 냄새가?', 1100);
      G.ui.toast(`너굴이가 ${pick.tre.name} 쪽으로 가고 있어! 막아!`, 'red');
    } else pick = pool.map(s => ({ s, d: Math.hypot(s.t.x - a.x, s.t.z - a.z) + Math.random() * 2.4 })).sort((p, q) => p.d - q.d)[0].s;
    done.add(pick); this.target = pick;
    if (!this.goTo(pick.t.x, pick.t.z, pick.t.y || 0)) this.target = null;
    this.drawSlots();
  }
  stepSeeker(dt, k) {
    const S = this.seek, p = S.root.position, speed = this.T.walk * k;
    if (this.route?.length) {
      const t = this.route[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), st = speed * dt;
      if (d <= st) { p.x = t.x; p.z = t.z; this.route.shift(); }
      else { p.x += dx / d * st; p.z += dz / d * st; }
      p.y += ((t.y || 0) - p.y) * Math.min(1, dt * 10);
      const a = Math.atan2(dx, dz), r = S.root.rotation.y; S.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 10);
      S.lift = Math.abs(Math.sin(this.t * 11)) * .05 * k;
      return false;
    }
    return true;
  }
  async peekAt(s) {
    this.sState = 'peek'; const S = this.seek; S.faceTo?.(s.c.x, s.c.z);
    this.say(S, `${s.name} 확인~`, 900);
    const t0 = this.t;
    while (!this.dead && !this.result) {
      await this.tw.wait(.05);
      const k = this.blocked ? 1.7 : 1;   // you're right in front of it: it can't see past you
      if (this.t - t0 >= this.T.peek * k && this.stun <= 0) break;
    }
    if (this.dead || this.result) return;
    const t = s.tre;
    if (t && !t.lost) this.lostTreasure(t);
    else this.say(S, '없네~', 700);
    this.sState = 'search'; this.target = null; this.drawSlots();
  }
  lostTreasure(t) {
    const G = this.G, S = this.seek, g = t.g; t.lost = true;
    this.say(S, `찾았다! ${t.name}!`, 1300); G.audio.sfx('miss'); G.hitstop(.05); S.setFace?.('happy'); this.hero.setFace?.('sad');
    g.visible = true; if (g.parent !== this.G.world.root) this.G.world.root.attach(g);
    const p0 = g.position.clone();
    this.tw.run(.45, k => { g.position.lerpVectors(p0, S.root.position, k); g.position.y = p0.y + Math.sin(k * Math.PI) * .8 + k * .6; g.scale.setScalar(.85 * (1 - k * .7)); }).then(() => { g.visible = false; });
    G.ui.floatText(innerWidth / 2, innerHeight * .3, `${t.name} 들켰다!`, 'red big');
    this.drawSlots();
    if (this.treasures.every(x => x.lost)) setTimeout(() => !this.dead && this.lose(), 700);
  }

  // ── per frame
  update(dt) {
    const G = this.G, W = G.world;
    if (this.paused) return;
    this.tw.update(dt);
    this.t = (this.t || 0) + dt;
    this.room.update(dt); this.ambient?.update(dt); this.hero.update(dt); this.seek.update(dt);
    // follow 몽글이 only while 너굴이 searches, and not for 2.5 s after you dragged, turned or pinched the view yourself
    if (W.drag?.moved || W.ptrs?.size > 1) this.lookT = this.t;
    if (this.phase === 'seek' && !this.result && this.t - (this.lookT ?? -99) > 2.5) {
      const hp = this.hero.root.position;
      W.target.x += (hp.x - W.target.x) * (1 - Math.exp(-dt * 5)); W.target.z += (hp.z - W.target.z) * (1 - Math.exp(-dt * 5)); W.target.y += (hp.y + .6 - W.target.y) * (1 - Math.exp(-dt * 4));
    }
    if (!this.result && this.phase !== 'intro') this.stepHero(dt);
    this.whT = Math.max(0, (this.whT || 0) - dt);
    this.hideBtn.style.visibility = this.phase === 'seek' && !this.result ? '' : 'hidden';
    this.hideBtn.classList.toggle('disabled', this.whT > 0);
    this.goBtn.style.display = this.phase === 'count' && !this.result ? '' : 'none';
    if (this.phase === 'intro' || this.result) return;
    if (this.phase === 'count') {
      if (this.hand?.busy) return;   // (the count waits while a treasure shows big)
      const before = Math.ceil(this.countT); this.countT -= dt; const now = Math.ceil(this.countT);
      if (now !== before && now > 0) { this.say(this.seek, String(now), 800); G.audio.sfx('tap', 20 - now); this.tlEl.textContent = `보물을 숨겨! 너굴이가 세는 중… ${now}`; }
      if (this.countT <= 0) { this.hideRest(); this.hand?.remove(); this.phase = 'seek'; this.sState = 'search'; this.say(this.seek, '찾는다~!', 1200); G.audio.sfx('special'); this.tlEl.textContent = '휘슬로 엉뚱한 데로 유인해!'; this.seek.root.rotation.y += Math.PI; }
      return;
    }
    this.time -= dt; this.tnum.textContent = String(Math.max(0, Math.ceil(this.time))); this.tbarI.style.width = Math.max(0, this.time / this.T.time * 100) + '%';
    if (this.time <= 0) return this.win();
    this.blocked = false; this.stun = 0;   // (no body-blocking any more: user, 10/18 "몸으로 막는 건 취소")
    this.vig.style.opacity = this.target?.tre && !this.target.tre.lost ? '.35' : '0';
    if (this.sState === 'peek' || this.stun > 0) return;
    if (!this.route) { this.nextSpot(); return; }
    if (this.stepSeeker(dt, 1)) { const s = this.target; this.route = null; if (s) this.peekAt(s); }
  }

  // ── end
  win() {
    if (this.result) return;
    const G = this.G; this.result = 'win';
    const left = this.treasures.filter(t => !t.lost).length;
    if (!left) { this.result = null; return this.lose(); }   // the clock ran out in the moment after the last one was found (GPT QA 10/18)
    const reward = settleFollowup(G, followupAt(this.after), { coins: 80 + left * 40 + this.tier * 30, won: true, replayWin: true });
    const coins = reward.coins, first = reward.first, lens = reward.lens;   // 경제 B5 (10/19): treasures kept → a magnifier into the bag (not in practice)
    const sb0 = starTotal(G.save); gameStar(G, String(this.after), left);   // (별 상자: one star a treasure kept)
    G.audio.sfx('win'); G.world.fx.confetti(140); this.seek.setFace?.('sad'); this.say(this.seek, '으아~ 다 못 찾았어!', 1800); this.hero.pose = 'cheer';
    G.stats.log.push({ boss: this.tier + 1, result: 'win', left });
    setTimeout(() => !this.dead && G.ui.panel({ title: '보물 지키기 성공!', color: 'green',
      body: [h('div', { class: 'tslots end' }, ...this.treasures.map(t => h('div', { class: 'tslot ' + (t.lost ? 'lost' : 'hidden') }, h('img', { src: G.thumbs['item_' + t.type] })))),
        ...(G.playMode ? [] : [giftRow(G, 'treasure')].filter(Boolean)), h('div', { class: 'txt' }, `보물 ${left}개를 지켰어!`), ...(G.playMode || !G.econ ? [] : [starBar(G, sb0)]), h('div', { class: 'reward' }, G.playMode ? '연습이라 코인은 없어' : `코인 +${coins}`), ...(first ? [h('div', { class: 'txt' }, '다음 너굴이는 코가 더 좋아질 거야…!')] : [])],
      buttons: [this.nextBtn = G.ui.btn('다음 판', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', { idx: this.after + 1 }) })] }), 1200);
    if (lens) setTimeout(() => !this.dead && G.ui.panelOpen?.querySelector('.reward')?.after(lensPlus()), 1200);   // ("+ 돋보기 1" under the coins; same delay, so right after that panel)
  }
  lose() {
    if (this.result) return;
    const G = this.G; this.result = 'lose'; this.seek.pose = 'cheer'; G.audio.sfx('lose');
    G.stats.log.push({ boss: this.tier + 1, result: 'fail' });
    setTimeout(() => !this.dead && G.ui.panel({ title: '보물을 다 뺏겼다…', color: 'red', body: [h('div', { class: 'txt' }, '너굴이가 보물 쪽으로 가면 멀찍이 떨어져서 휘슬을 불어 봐! 의외의 곳에 숨기는 것도 방법이야.')],
      buttons: [G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => G.go('stage', { idx: this.after + 1 }) }),
        this.nextBtn = G.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => G.go('boss', { after: this.after }) })] }), 1000);
  }

  // ── bot (QA): hides the three far from where it counts, then shadows it
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.5 && this.G.ui.panelOpen) { this._endT = 0; const F = this.G.bossFails || (this.G.bossFails = {}); if (this.result === 'lose' && (F[this.after] = (F[this.after] || 0) + 1) >= 2) this.G.go('stage', { idx: this.after + 1 }); else this.nextBtn?.press(); } return; }
    if (this.phase === 'intro' || mode === 'idle') return;
    const hp = this.hero.root.position, sp = this.seek.root.position;
    const walkTo = (x, z) => {
      if (!this.bpath || this.bgoal !== `${x.toFixed(1)},${z.toFixed(1)}`) { this.bgoal = `${x.toFixed(1)},${z.toFixed(1)}`; const a = nearestTile(this.tiles, hp.x, hp.z), b = nearestTile(this.tiles, x, z); this.bpath = a && b ? (gridPath(a, b) || []) : []; }
      const t = this.bpath[0]; if (!t) return true;
      const dx = t.x - hp.x, dz = t.z - hp.z, d = Math.hypot(dx, dz), st = this.T.run * dt;
      if (d <= st) { hp.x = t.x; hp.z = t.z; this.bpath.shift(); } else { hp.x += dx / d * st; hp.z += dz / d * st; }
      return false;
    };
    if (this.phase === 'count') {
      if (this.treasures.every(t => t.spot)) { this.countT = Math.min(this.countT, .01); return; }
      if (!this.bspot || this.bspot.tre) { const pool = this.spots.filter(s => !s.tre); this.bspot = (mode === 'random' ? pool.sort(() => Math.random() - .5) : pool.sort((a, b) => Math.hypot(b.t.x - sp.x, b.t.z - sp.z) - Math.hypot(a.t.x - sp.x, a.t.z - sp.z)))[0]; this.bpath = null; }
      if (this.bspot && walkTo(this.bspot.t.x, this.bspot.t.z)) { this.hideTreasure(this.bspot); this.bspot = null; }
      return;
    }
    // seek: when it heads for a real treasure, whistle it away (from wherever we are)
    if (mode !== 'random' && this.target?.tre && !this.target.tre.lost && !(this.whT > 0) && this.sState === 'search') this.whistle();
  }
  state() { return { scene: 'boss', phase: this.phase, s: this.sState, left: this.treasures.filter(t => !t.lost).length, time: +(this.time || 0).toFixed(1), result: this.result || null }; }
}
const CHAR_OK = k => !!k && k !== 'mom' && !!CHAR_DEFS[k];
