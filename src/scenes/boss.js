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
import { h, ICON } from '../ui.js';
import { lensPlus } from '../lens.js';   // 경제 B5 (10/19)
import { giftRow } from '../gift.js';
import { chapterGift } from '../gifts.js';   // 선물은 아주 가끔 (10/20)
import { gameStar } from '../starbox.js';   // 별 상자 (경제 A1+A2, 10/19)   // 놀이 보상: 누가, 왜 주는지 (경제·로비 10/19)
import { Tweens, clamp } from '../util.js';
import { walkGrid, gridPath, nearestTile, crossOK } from '../companion.js';
import { Ambient } from '../ambient.js';
import { disposeTree } from '../gfx/kit.js';
import { Hand } from '../handhold.js';   // 손에 든 보물: 하나씩 크게 → 손 → 콕 → 쏙 (10/20)

// once in the middle of each region (level design 10/18): the first after stage 5 as a gentle try, then after 17, 26, 36, 45,
// 55, 65 — no longer right after a region's escape-room boss (two bosses back to back)
// 10/18: also the old flashlight-boss slots after 31 and 49 (user chose 보물 지키기 new maps there)
export const BOSS_AFTER = [17, 26, 36, 48, 54];
const SEP = .55;   // 너굴이와 몽글이 몸 사이 (겹침 QA 규칙 0.55 m — 10/20 user: "너굴이가 몽글이 몸을 뚫고 지나가요")   // 18·27·37·49·55판 뒤 (10/18 밤: one a chapter from 2장, the 골목 one back)
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

// (③ 10/22: the walk grid fell apart into islands — 보스1's ground floor under the balcony cut off by the sofa and table row,
// the two shops of the shop street, the playground's fenced corners — so 너굴이 never went there and nothing there was a hiding
// place): an island is joined to the rest across the narrowest gap a body can squeeze through (a step of up to 1.6 m, the
// line of it clear at .2 → .16 → .12 m, never through a wall). Only between islands — the open floor keeps its normal grid.
function bridgeGrid(tiles, opts) {
  const comp = new Map(), comps = [];
  const label = () => { comp.clear(); comps.length = 0; for (const t of tiles) { if (comp.has(t)) continue; const id = comps.length, list = [], q = [t]; comp.set(t, id); while (q.length) { const u = q.pop(); list.push(u); for (const v of u.nb) if (!comp.has(v)) { comp.set(v, id); q.push(v); } } comps.push(list); } };
  const clear = (a, b, r) => { for (const k of [.15, .3, .5, .7, .85]) { const x = a.x + (b.x - a.x) * k, z = a.z + (b.z - a.z) * k, R = k < .5 ? a.R : b.R; if (!R.clearAt(x, z, r, opts)) return false; } return crossOK(a.R, b.R, (a.x + b.x) / 2, (a.z + b.z) / 2); };
  for (let pass = 0; pass < 24; pass++) {
    label(); if (comps.length < 2) break;
    let joined = false;
    for (const r of [.2, .16, .12]) {
      for (const [ci, list] of comps.entries()) {
        if (list.length < 3 || list.stair) continue;
        let best = null, bd = 9;
        for (const t of list) for (const u of tiles) {
          if (comp.get(u) === ci || u.stair || t.stair || Math.abs((u.y || 0) - (t.y || 0)) > .05) continue;
          const d = Math.hypot(u.x - t.x, u.z - t.z); if (d > 1.6 || d >= bd) continue;
          if (clear(t, u, r)) { bd = d; best = [t, u]; }
        }
        if (best) { best[0].nb.push(best[1]); best[1].nb.push(best[0]); joined = true; break; }
      }
      if (joined) break;
    }
    if (!joined) break;
  }
  return tiles;
}

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
    W.onPad = null; W.onTap = (x, y) => this.tapAt(x, y); W.onDragStart = (x, y) => this.holdDrag(x, y); W.onRotate = null;   // (숨길 땐 들고 있는 보물만 드래그로 옮겨요 — 나머지는 카메라)
    this.lures = 0; this.fooled = 2 + Math.floor(Math.random() * 2);   // how many whistles it falls for (never said)
    this.buildHud();
    G.audio.music('play');
    if (this.tier === 0 && !G.skipTalk && !G.bot) {
      const { playDialog } = await import('../story.js');
      await playDialog(G, [
        { who: 'raccoon', text: '이번엔 보물 지키기야! 네가 제일 아끼는 보물 3개, 내가 다 찾으면 내 거~' },
        { who: 'mong', text: '너굴이가 눈 감고 기다리는 동안 숨길 곳을 터치! 서랍 안, 커튼 뒤, 선반 위… 누른 곳에 바로 쏙 들어가.' },
        { who: 'mong', text: '찾기 시작하면 조이스틱으로 움직이고, 휘슬을 불면 너굴이가 내 쪽으로 엉뚱하게 달려와!' },
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
    const all = bridgeGrid(walkGrid(this.rooms, .24, this.T.climb ? { raised: true } : null), this.T.climb ? { raised: true } : null), seen = new Set(); let best = [];
    for (const t of all) { if (seen.has(t)) continue; const comp = [], q = [t]; seen.add(t); while (q.length) { const u = q.pop(); comp.push(u); for (const v of u.nb) if (!seen.has(v)) { seen.add(v); q.push(v); } } if (comp.length > best.length) best = comp; }
    this.tiles = best;
    // 몽글이's own floor (③ 10/21, user: "몽실이 계단을 못오른다 ㅋㅋ"): every walkable tile, raised ones too, joined up stairs and
    // across floors — the part 너굴이's floor is in. The pad walks it tile to tile, so a step onto the stairs goes up them
    { const allH = bridgeGrid(walkGrid(this.rooms, .24, { raised: true }), { raised: true }), set = new Set(best), seenH = new Set(); let pick = best;
      for (const t of allH) { if (seenH.has(t)) continue; const comp = [], q = [t]; seenH.add(t); while (q.length) { const u = q.pop(); comp.push(u); for (const v of u.nb) if (!seenH.has(v)) { seenH.add(v); q.push(v); } }
        if (comp.some(u => best.some(b => Math.hypot(b.x - u.x, b.z - u.z) < .05 && Math.abs((b.y || 0) - (u.y || 0)) < .1)) && comp.length >= pick.length) pick = comp; }
      this.htiles = pick.length ? pick : best; }
    // hiding places: the walkable point right beside each piece something can be tucked under, inside or behind
    this.spots = [];
    for (const R of this.rooms) for (const r of R.furns) {
      if (r.type === 'rug') continue;
      const name = HIDE[r.type] || `${r.f.name || '가구'} 뒤`;
      const b = new THREE.Box3().setFromObject(r.f.group), c = b.getCenter(new THREE.Vector3());
      // (③ 10/22, user: "장독대나 이런 데 자유롭게 숨기지는 못하나 봐?"): near enough by the piece's own edge, not its middle — a long
      // row of jars, a bike along a wall were out because their middles were 1.4 m from where you stand
      const fy = r.f.group.getWorldPosition(new THREE.Vector3()).y, t = near3(this.tiles, c.x, fy, c.z);
      const edge = t ? Math.hypot(Math.max(b.min.x - t.x, 0, t.x - b.max.x), Math.max(b.min.z - t.z, 0, t.z - b.max.z)) : 9;
      if (!t || edge > .8 || Math.abs((t.y || 0) - fy) > .6) continue;
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
      h('div', { style: 'display:flex;flex-direction:column;flex:1;min-width:0;gap:3px' }, this.tlEl = h('div', { class: 'tl' }, '보물을 골라, 드래그해서 숨겨!'), h('div', { class: 'tbar' }, this.tbarI = h('i', { style: 'width:100%' }))),
      this.tnum = h('div', { class: 'num ol' }, String(this.T.time)));
    top.append(this.timerEl, h('div', { class: 'stagetag ol', html: `보스<b>${this.tier + 1}</b>` }));
    col.append(top);
    this.slots = this.treasures.map(t => h('div', { class: 'tslot' }, h('img', { src: G.thumbs['item_' + t.type] })));
    col.append(h('div', { class: 'tslots' }, ...this.slots));
    this.hideBtn = ui.btn('휘슬 삐익!', { color: 'pink', cls: 'big', onClick: () => this.whistle() });
    this.goBtn = ui.btn('바로 시작!', { color: 'green', cls: 'boss-go', onClick: () => { if (this.phase === 'count' && this.treasures.every(t => t.spot)) this._startAt = this.t; } });   // (셋 다 숨기면 2초 뒤 저절로 — 이 버튼은 바로)
    col.append(this.goBtn, h('div', { class: 'boss-left' }, this.hideBtn));
    this.cardsEl = h('div', { class: 'cards bosscards' }); col.append(h('div', { class: 'modebar bossbar' }, this.cardsEl));   // 숨길 보물 목록 (가구 놓기처럼, 10/20)
    this.vig = h('div', { class: 'boss-vig' }); document.getElementById('app').append(this.vig);
    this.drawSlots();
  }
  // the next treasure to hide: big in the middle, then into the hand; none left — the hand says start
  // 숨기기 = 가구 놓기처럼 (10/20 user: "배치 가능한 목록을 먼저 … 하나씩 선택 … 가구처럼 이동 … 회전도"): the three treasures in a list;
  // a tap holds one in the room, a drag takes it to a hiding place (it snaps, glowing), [여기 숨기기] puts it there
  nextHeld() {
    const G = this.G; if (!this.cardsEl || this.dead) return;
    this.cardsEl.innerHTML = '';
    if (this.phase !== 'count') { this.cardsEl.parentElement.style.display = 'none'; return; }
    for (const t of this.treasures) {
      // (③ 10/21, user: "숨기기 … 방 배치 물건숨기기랑 … 아예 똑같이 이질감 없게"): as at home — a hidden one shows where, and a tap
      // picks it up again to move it
      const c = h('div', { class: 'card' + (t.spot ? ' done' : '') + (this.held?.t === t ? ' sel' : '') }, t.spot ? h('div', { class: 'tag' }, '숨김') : null, h('img', { src: G.thumbs['item_' + t.type] }), h('div', {}, t.name),
        h('div', { style: 'font-size:11px;color:#9b6cff' }, t.spot ? (t.fs?.label || t.spot.name) : ''));
      c.addEventListener('click', () => { G.audio.sfx('click'); if (t.spot) this.unhide(t); this.holdStart(t); });
      this.cardsEl.append(c);
    }
    this.tlEl.textContent = this.treasures.every(t => t.spot) ? '셋 다 숨겼어! 곧 너굴이가 찾아' : '보물을 골라, 드래그해서 숨겨!';
  }
  holdStart(t) {
    const G = this.G, W = G.world;
    this.holdEnd();
    const g = buildItem(t.type); g.scale.setScalar(.85); W.root.add(g);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .3, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthTest: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 10; W.root.add(ring);
    const ui = G.ui, tool = h('div', { class: 'ftool holdtool' },
      ui.btn(null, { color: 'blue', icon: 'rotate', onClick: () => { const H = this.held; if (H) { H.ry += Math.PI / 4; H.g.rotation.y = H.ry; G.audio.sfx('click'); } } }),
      ui.btn('여기 숨기기', { color: 'green', icon: ICON.check, onClick: () => this.holdConfirm() }),
      ui.btn(null, { color: 'gray', icon: 'close', onClick: () => { this.holdEnd(); this.nextHeld(); } }));
    const label = h('div', { class: 'holdlabel' }); ui.wui.append(tool, label);
    tool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
    this.held = { t, g, ring, tool, label, ry: (Math.random() - .5) * 1.2, spot: null, fs: null, opened: null };
    this.showPlaces(true);
    const p = W.screenToGround(innerWidth / 2, innerHeight * .5, 0) || this.hero.root.position.clone();
    this.holdTo(null, p);
    G.audio.sfx('pop', 4); this.nextHeld();
  }
  // where a held treasure can go, as at home (hidehold.js): each piece's own hiding places — in a drawer, behind a door, on a
  // shelf — or, for a piece with none, tucked beside it; never one taken
  hidePlaces() {
    const out = [], V = new THREE.Vector3(), h0 = ITEMS[this.held?.t.type]?.h || .2;
    for (const s of this.spots) {
      if (s.tre) continue;
      const fl = (s.f.spots || []).filter(q => !q.bossTre && !q.item && q.anchor && h0 * .85 * (q.scale || 1) <= (q.maxH ?? 9) + .001);
      if (fl.length) for (const fs of fl) out.push({ s, fs, p: fs.anchor.getWorldPosition(V.clone()), label: fs.label || s.name });
      else out.push({ s, fs: null, p: s.c.clone().setY(Math.max(s.c.y, (s.t.y || 0) + .35)), label: s.name });
    }
    return out;
  }
  // a hiding place (snapped, green, its name; a shut drawer opens to show it, the one it left shuts) or the floor under the finger
  holdTo(c, p) {
    const H = this.held; if (!H) return;
    const part = c?.fs?.part || null;
    if (H.opened && H.opened !== part) { const P = H.opened; H.opened = null; if (P.t > .5) this.tw.run(.18, k => P.setOpen(1 - k)); }
    if (part && part.t < .5) { H.opened = part; this.tw.run(.18, k => part.setOpen(k)); }
    const at = c ? c.p : p;
    H.g.position.copy(at); H.g.rotation.set(0, H.ry, 0);
    H.ring.position.set(at.x, (c ? c.p.y : (p.y || 0)) + .015, at.z);
    H.ring.material.color.set(c ? '#5be37a' : '#ffffff');
    H.label.textContent = c ? c.label : '숨을 곳으로 드래그'; H.label.classList.toggle('snap', !!c);
    if (c && (H.spot !== c.s || H.fs !== c.fs)) this.G.audio.sfx('tap', 12);
    H.spot = c?.s || null; H.fs = c?.fs || null; this.G.world.shadowDirty = true;
  }
  holdDrag(x, y) {
    const H = this.held, W = this.G.world; if (!H || this.phase !== 'count') return null;
    const p = W.toScreen(H.g.getWorldPosition(new THREE.Vector3())); if (Math.hypot(p.x - x, p.y - y) > 70) return null;   // (only the held thing drags — anything else is the camera's, as at home)
    return {
      move: (mx, my) => {
        let best = null, bd = 64;   // (hidehold.js SNAP_PX)
        for (const c of this.hidePlaces()) { const q = W.toScreen(c.p); const d = Math.hypot(q.x - mx, q.y - my); if (d < bd) { bd = d; best = c; } }
        if (best) { if (H.spot !== best.s || H.fs !== best.fs) this.holdTo(best); } else { const g = W.screenToGround(mx, my, 0); if (g) this.holdTo(null, g); }
      },
      end: () => {}, cancel: () => {},
    };
  }
  // a hidden treasure back in the hand (its card tapped again) — the place it was is free again
  unhide(t) {
    if (!t.spot || this.phase !== 'count') return;
    t.g?.parent?.remove(t.g); t.g = null;
    if (t.fs) { t.fs.bossTre = null; t.fs = null; }
    t.spot.tre = null; t.spot = null;
    t.pin?.remove(); t.pin = null;
    this._startAt = null; this.goBtn?.classList.remove('pulse');
    this.G.world.idsDirty = true; this.G.world.shadowDirty = true; this.drawSlots();
  }
  holdConfirm() {
    const H = this.held, G = this.G; if (!H) return;
    if (!H.spot) { G.ui.toast('숨을 곳(가구) 가까이로 드래그해 봐!', ''); G.audio.sfx('miss'); return; }
    const { t, spot, ry } = H, fs = H.fs; if (H.opened) { H.opened.setOpen(0); H.opened = null; } this.holdEnd(true);
    const was = this.treasures.find(x => !x.spot); if (was !== t) { const i = this.treasures.indexOf(t), j = this.treasures.indexOf(was); [this.treasures[i], this.treasures[j]] = [this.treasures[j], this.treasures[i]]; }   // (hideTreasure takes the first not hidden)
    this.hideTreasure(spot, false, fs);
    if (t.g) t.g.rotation.y = ry;
    this.drawSlots(); this.nextHeld();
    // (user: "하나 숨기면 다음 아이템으로 바로 넘어가도 좋고"): the next one still in your hands comes up by itself
    const nx = this.treasures.find(x => !x.spot); if (nx && !G.bot) this.holdStart(nx);
  }
  // (③ 10/22, user "숨길 수 있는 곳이 적게 느껴져"): while a treasure is in your hand every place it can go shows — a small soft
  // glowing dot, pulsing (one instanced mesh, gone when the hand is empty)
  showPlaces(on) {
    const W = this.G.world;
    if (this._dots) { this._dots.parent?.remove(this._dots); this._dots.geometry.dispose(); this._dots.material.dispose(); this._dots = null; }
    if (!on || !this.held) return;
    const ps = this.hidePlaces(); if (!ps.length) return;
    const m = new THREE.InstancedMesh(new THREE.RingGeometry(.045, .1, 20), new THREE.MeshBasicMaterial({ color: '#ffb300', transparent: true, opacity: .9, depthTest: false }), ps.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), S1 = new THREE.Vector3(1, 1, 1);
    ps.forEach((c, i) => { M.compose(c.p.clone().setY(c.p.y + .03), Q, S1); m.setMatrixAt(i, M); });
    m.renderOrder = 9; m.frustumCulled = false; m.layers.set(2); W.root.add(m); this._dots = m;
  }
  holdEnd(quiet = false) {
    const H = this.held; if (!H) return; this.held = null; this.showPlaces(false);
    H.g.parent?.remove(H.g); H.ring.parent?.remove(H.ring); H.ring.geometry.dispose(); H.ring.material.dispose(); H.tool.remove(); H.label.remove();
    if (H.opened && H.opened.t > .5) { const P = H.opened; this.tw.run(.18, k => P.setOpen(1 - k)); }
    if (!quiet) this.G.audio.sfx('pop', 1);
  }
  holdTick() {
    const H = this.held; if (!H) return;
    const W = this.G.world, b = new THREE.Box3().setFromObject(H.g), top = W.toScreen(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .15, (b.min.z + b.max.z) / 2));
    const tw = H.tool.offsetWidth || 220; H.tool.style.left = Math.max(tw / 2 + 8, Math.min(innerWidth - tw / 2 - 8, top.x)) + 'px'; H.tool.style.top = Math.max(110, top.y) + 'px';
    const r = W.toScreen(H.ring.position); H.label.style.left = r.x + 'px'; H.label.style.top = (r.y + 18) + 'px';
    H.ring.scale.setScalar(1 + Math.sin((this.t || 0) * 6) * .12);
    if (this._dots) this._dots.material.opacity = .7 + Math.sin((this.t || 0) * 5) * .25;
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
    if (this.phase === 'count') return;   // (숨기기 = 가구 놓기처럼: 터치로는 숨기지 않아요 — 목록에서 골라 드래그, [여기 숨기기] — 10/20)
    if (f && this.phase === 'count' && this.treasures.some(t => !t.spot)) {
      const fs = (f.spots || []).filter(q => !q.bossTre).sort((a, b) => a.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(hit.point) - b.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(hit.point))[0] || null;
      if (spot && !spot.tre) { this.hand?.drop(x, y); this.hideTreasure(spot, false, fs); setTimeout(() => this.nextHeld(), 650); } else if (spot) this.hideTreasure(spot, false, fs); else this.G.ui.toast('여기엔 숨길 데가 없어! 다른 가구를 터치', '');
      W.fx.ring(x, y, { r: 40, color: '#ff9ec2', width: 6, life: .4 }); return;
    }
    const p = spot ? spot.t : hit.point; this._ty = spot ? (spot.t.y || 0) : hit.point.y;
    this.walkTo(p.x, p.z); this._ty = null; W.fx.ring(x, y, { r: 30, color: '#ffffff', width: 5, life: .35 });
  }
  walkTo(x, z, then = null) {
    const T = this.htiles || this.tiles, hp = this.hero.root.position, a = near3(T, hp.x, hp.y, hp.z), b = near3(T, x, this._ty ?? hp.y, z);
    this.hpath = a && b ? (gridPath(a, b) || []) : []; this.hthen = then;
    if (!this.hpath.length && then) { this.hthen = null; then(); }
  }
  stepHero(dt) {
    const t = this.hpath?.[0]; if (!t) return;
    const p = this.hero.root.position, dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), st = this.T.run * dt;
    { const sp = this.seek.root.position, nx = d <= st ? t.x : p.x + dx / d * st, nz = d <= st ? t.z : p.z + dz / d * st; if (Math.hypot(nx - sp.x, nz - sp.z) < SEP && Math.hypot(nx - sp.x, nz - sp.z) < Math.hypot(p.x - sp.x, p.z - sp.z)) return; }   // (너굴이 몸 앞에선 멈춤)
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
    if (!s) { G.ui.toast('숨길 가구를 터치해 봐!', ''); return; }
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
    this.addPin(t);   // 숨긴 자리 위 초록 핀 (계속 떠 있음 — 10/20)
    // (as at home: hearts and the place's name, no words from 몽글이 — ③ 10/21)
    if (!quiet) { G.audio.sfx('pop', 3 + this.treasures.filter(x => x.spot).length); setTimeout(() => !this.dead && G.audio.sfx('star', this.treasures.filter(x => x.spot).length - 1), 180); 
      { const p = this.G.world.toScreen(this.pinAt(t)); G.world.fx.burst(p.x, p.y + 30, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 }); G.ui.floatText(p.x, p.y - 20, fs?.label || s.name, ''); } const s0 = g.scale.x; this.tw.run(.25, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .3))); }
    this.drawSlots();
    if (this.treasures.every(x => x.spot)) { this.goBtn.classList.add('pulse'); if (this._startAt == null) this._startAt = this.t + 2; }   // (셋 다: 2초 뒤 너굴이가 찾기 시작)
  }
  // 위치 핀 (10/20 — user: "콕 해도 숨겨졌다 표시가 안 떠서 이상해요 … 위치 핀 마크"): a green map pin over each hidden
  // treasure, with the treasure's picture in it; it stays all game, and turns grey when 너굴이 finds that one
  pinAt(t) { const v = new THREE.Vector3(); (t.g || t.spot.f.group).getWorldPosition(v); if (!t.g) v.y += .4; v.y += .35; return v; }
  addPin(t) {
    if (t.pin) return;
    const G = this.G, el = h('div', { class: 'tpin drop', html: '<svg viewBox="0 0 40 52"><path d="M20 50C20 50 4 31 4 19a16 16 0 0 1 32 0c0 12-16 31-16 31z" fill="#3cc46a" stroke="#1d6b38" stroke-width="3"/><circle cx="20" cy="19" r="10.5" fill="#fff"/></svg>' }, h('img', { src: G.thumbs['item_' + t.type] }));
    t.pin = el; G.ui.wui.append(el); this.placePin(t);
  }
  placePin(t) { if (!t.pin) return; const p = this.G.world.toScreen(this.pinAt(t)); t.pin.style.left = p.x + 'px'; t.pin.style.top = p.y + 'px'; t.pin.classList.toggle('lost', !!t.lost); }
  // 찾기 시작: 너굴이가 돌아서고, 조이스틱이 생겨 몽글이를 움직여요 (숨기는 동안엔 가만히 — 10/20)
  startSeek() {
    const G = this.G, W = G.world;
    this.holdEnd(true); this.hideRest(); this.phase = 'seek'; this.sState = 'search'; this.nextHeld();
    this.say(this.seek, '찾는다~!', 1200); G.audio.sfx('special'); this.tlEl.textContent = '조이스틱으로 움직이고, 휘슬로 엉뚱한 데로!'; this.seek.root.rotation.y += Math.PI;
    W.joyOn = true; W.onPad = (dir, v, dt) => this.padMove(dir, v, dt);
  }
  // the pad moves 몽글이 the way it is pushed on the screen; never into furniture, never into 너굴이 (SEP)
  padMove(dir, v, dt) {
    if (this.phase !== 'seek' || this.result || this.paused || !v) return;
    const W = this.G.world, p = this.hero.root.position, Y = W.yaw, st = this.T.run * v * dt;
    const mx = dir[0] * Math.cos(Y) + dir[1] * Math.sin(Y), mz = -dir[0] * Math.sin(Y) + dir[1] * Math.cos(Y);
    this.hpath = null;
    // (외부 QA 10/21 #06) canStep, not just canStand: a step across a room edge has to go through the doorway (crossOK) — the pad
    // used to slide 몽글이 through the closed wall beside the door
    // (③ 10/21: "몽실이 계단을 못오른다") the pad follows 몽글이's walk grid — a point is reachable when it lies by the tile 몽글이 is on
    // or one joined to it; the grid joins the stairs' steps and the floors, so pushing onto the stairs climbs them (a free slide
    // checked against the room under you only ever knew the ground floor)
    const T = this.htiles || this.tiles, sp = this.seek.root.position;
    let cur = this._ht; if (!cur || Math.hypot(cur.x - p.x, cur.z - p.z) > .3 || Math.abs((cur.y || 0) - p.y) > .6) cur = this._ht = near3(T, p.x, p.y, p.z);
    const tryAt = (x, z) => {
      if (Math.hypot(x - sp.x, z - sp.z) < SEP) return false;
      if (!cur) return false;
      // on the way from this tile to a joined one (stair steps sit far apart): near that line is walkable
      let best = null, bd = .17;
      for (const t of [cur, ...(cur.nb || [])]) {
        const ex = t.x - cur.x, ez = t.z - cur.z, L = ex * ex + ez * ez, k = L ? Math.max(0, Math.min(1, ((x - cur.x) * ex + (z - cur.z) * ez) / L)) : 0;
        const d = Math.hypot(cur.x + ex * k - x, cur.z + ez * k - z); if (d < bd) { bd = d; best = k > .5 ? t : cur; }
      }
      if (!best) {   // (on the ground floor the old free slide still goes: it reaches a little closer to furniture than the grid's tiles)
        if ((cur.y || 0) > .1 || !this.canStep(p.x, p.z, x, z)) return false;
        p.x = x; p.z = z; this._ht = null; return true;
      }
      p.x = x; p.z = z; this._ht = best; return true;
    };
    tryAt(p.x + mx * st, p.z + mz * st) || tryAt(p.x + mx * st, p.z) || tryAt(p.x, p.z + mz * st);
    const a = Math.atan2(mx, mz), r = this.hero.root.rotation.y; this.hero.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 12);
    this.hero.lift = Math.abs(Math.sin(this.t * 14)) * .06;
    { const t = this._ht || near3(T, p.x, p.y, p.z); if (t) p.y += ((t.y || 0) - p.y) * Math.min(1, dt * 10); }
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
    if (this.hopping) return false;
    if (this.route?.length) {
      const t = this.route[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), st = speed * dt;
      // 몽글이 몸은 뚫지 않아요(SEP). 막히면 (③ 10/22, user 실폰 보스2 "숨기기 판 계단 막으면 너구리가 못 내려감" — 막기는 재밌지만
      // 영영 갇히면 안 됨): 한쪽으로만 비켜 보고(옆이 없으면 제자리 — 떨지 않게), .5초 넘으면 발 동동 화남, 1.2초면 "비켜~" 하고
      // 몽글이를 옆으로 폴짝 밀고, 그게 안 되면(계단·좁은 길) 2.4초에 몽글이를 뛰어넘어 가던 길로
      const hp = this.hero.root.position, nx = d <= st ? t.x : p.x + dx / d * st, nz = d <= st ? t.z : p.z + dz / d * st;
      if (Math.hypot(nx - hp.x, nz - hp.z) < SEP) {
        const dd = Math.max(d, 1e-4), px = -dz / dd, pz = dx / dd;
        if (!this.blockT) this.blockSide = ((hp.x - p.x) * px + (hp.z - p.z) * pz) > 0 ? -1 : 1;
        const side = this.blockSide, sx = p.x + px * side * st, sz = p.z + pz * side * st;
        if (Math.hypot(sx - hp.x, sz - hp.z) >= Math.min(SEP, Math.hypot(p.x - hp.x, p.z - hp.z)) && this.canStep(p.x, p.z, sx, sz)) { p.x = sx; p.z = sz; }
        this.blockT = (this.blockT || 0) + dt; this.prog = null;
        if (this.blockT > .5) {
          if (!this._mad) { this._mad = true; S.setFace?.('angry'); this.say(S, '비켜!!', 800); this.G.audio.sfx('thump', -2); }
          // 발 동동
          S.lift = Math.abs(Math.sin(this.t * 22)) * .05;
        } else S.lift = 0;
        // (on the stairs there is no side to push you to — and pushed aside you came straight back: then over you it goes)
        const onStair = (this.htiles || []).some(u => u.stair && Math.hypot(u.x - hp.x, u.z - hp.z) < .45 && Math.abs((u.y || 0) - hp.y) < .5);
        if (this.blockT > 1.2 && !this._nudged) { this._nudged = true; if (onStair || this.t - (this._nudgeAt ?? -9) < 4) this.hopOver(); else if (this.nudgeHero()) { this._nudgeAt = this.t; this.blockT = 0; this._mad = false; S.setFace?.('normal'); } }
        if (this.blockT > 2.4) this.hopOver();
        return false;
      }
      if (this.blockT) { this.blockT = 0; this._nudged = false; if (this._mad) { this._mad = false; S.setFace?.('normal'); } }
      // (③ 10/22, user: "너구리 어디 갇혀서 ㄷㄷㄷㄷ 떨림"): no headway on the next step for 1.5 s — skip to the one after it; 3.5 s
      // on the same one — 퐁, it is there (a puff, never stuck for good)
      const pr = this.prog;
      if (!pr || pr.t !== t) this.prog = { t, d, at: this.t, t0: this.t };
      else if (d < pr.d - .05) { pr.d = d; pr.at = this.t; }
      else if (this.t - pr.t0 > 3.5) { this.poof(t.x, t.y || 0, t.z); this.route.shift(); this.prog = null; return false; }
      else if (this.t - pr.at > 1.5 && this.route.length > 1) { this.route.shift(); this.prog = null; return false; }
      if (d <= st) { p.x = t.x; p.z = t.z; this.route.shift(); }
      else { p.x += dx / d * st; p.z += dz / d * st; }
      p.y += ((t.y || 0) - p.y) * Math.min(1, dt * 10);
      if (d > .02) { const a = Math.atan2(dx, dz), r = S.root.rotation.y; S.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 10); }
      S.lift = d > .02 ? Math.abs(Math.sin(this.t * 11)) * .05 * k : 0;
      return false;
    }
    S.lift = 0;
    return true;
  }
  // over 몽글이's head and down on the far side, on its own way (the first step of its route past you) — else a new place to look
  hopOver() {
    const S = this.seek, p = S.root.position, hp = this.hero.root.position;
    this.blockT = 0; this._nudged = false; this._mad = false;
    const i = (this.route || []).findIndex(t => Math.hypot(t.x - hp.x, t.z - hp.z) > SEP + .15 && Math.hypot(t.x - p.x, t.z - p.z) > Math.hypot(hp.x - p.x, hp.z - p.z));
    if (i < 0) { this.route = null; this.target = null; return; }
    const to = this.route[i], x0 = p.x, y0 = p.y, z0 = p.z; this.route.splice(0, i + 1); this.hopping = true;
    S.setFace?.('happy'); this.say(S, '영차!', 700); this.G.audio.sfx('hop');
    this.tw.run(.5, k => { p.x = x0 + (to.x - x0) * k; p.z = z0 + (to.z - z0) * k; p.y = y0 + ((to.y || 0) - y0) * k + Math.sin(k * Math.PI) * .75; S.root.rotation.y = Math.atan2(to.x - x0, to.z - z0); })
      .then(() => { this.hopping = false; S.squash = .3; this.G.audio.sfx('land'); S.setFace?.('normal'); });
  }
  // stuck against something: a puff, and it is at the next step
  poof(x, y, z) {
    const S = this.seek, W = this.G.world, p = S.root.position, a = W.toScreen(p.clone().setY(p.y + .4));
    W.fx.burst(a.x, a.y, { n: 10, colors: ['#ffffff', '#e8e2f2'], shape: 'dot', speed: 120, size: 12, gravity: -30, life: .5 });
    p.set(x, y, z); const b = W.toScreen(p.clone().setY(p.y + .4));
    W.fx.burst(b.x, b.y, { n: 10, colors: ['#ffffff', '#e8e2f2'], shape: 'dot', speed: 120, size: 12, gravity: -30, life: .5 });
    this.G.audio.sfx('pop', 2); this.stuckN = (this.stuckN || 0) + 1;
  }
  // 너굴이 길을 막고 서 있으면: "비켜~" 하고 몽글이가 옆 빈자리로 폴짝 (몸으로 막기는 없음 — user 10/18)
  nudgeHero() {
    const p = this.hero.root.position, sp = this.seek.root.position, a = Math.atan2(p.x - sp.x, p.z - sp.z);
    for (const da of [Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 0, Math.PI * .75, -Math.PI * .75]) {
      const x = sp.x + Math.sin(a + da) * (SEP + .35), z = sp.z + Math.cos(a + da) * (SEP + .35);
      if (!this.canStep(p.x, p.z, x, z)) continue;   // (the hop sideways stays on this side of a wall too — #06)
      this.say(this.seek, '비켜~', 700); this.hpath = null;
      const x0 = p.x, z0 = p.z; this.tw.run(.25, k => { p.x = x0 + (x - x0) * k; p.z = z0 + (z - z0) * k; this.hero.lift = Math.sin(k * Math.PI) * .25; });
      return true;
    }
    return false;
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
    // while 너굴이 searches the view follows 너굴이 (③ 10/22, user: "너구리 찾을 땐 카메라 너구리 팔로우해 줘"), not for 2.5 s after you
    // dragged, turned or pinched it yourself; while you hide it is all yours
    if (W.drag?.moved || W.ptrs?.size > 1) this.lookT = this.t;
    if (this.phase === 'seek' && !this.result && this.t - (this.lookT ?? -99) > 2.5) {
      const hp = this.seek.root.position;
      W.target.x += (hp.x - W.target.x) * (1 - Math.exp(-dt * 5)); W.target.z += (hp.z - W.target.z) * (1 - Math.exp(-dt * 5)); W.target.y += (hp.y + .6 - W.target.y) * (1 - Math.exp(-dt * 4));
    }
    if (!this.result && this.phase !== 'intro') this.stepHero(dt);
    this.whT = Math.max(0, (this.whT || 0) - dt);
    this.hideBtn.style.visibility = this.phase === 'seek' && !this.result ? '' : 'hidden';
    this.hideBtn.classList.toggle('disabled', this.whT > 0);
    this.goBtn.style.display = this.phase === 'count' && !this.result && this.treasures.every(t => t.spot) ? '' : 'none';
    this.holdTick();
    for (const t of this.treasures) this.placePin(t);
    if (this.phase === 'intro' || this.result) return;
    if (this.phase === 'count') {
      // 숨기는 동안엔 시간 제한 없음 (10/20 user): 너굴이는 눈 감고 기다리고, 셋 다 숨기면 2초 뒤(또는 '바로 시작!') 찾기 시작
      if (this._startAt != null && this.t >= this._startAt) this.startSeek();
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
    gameStar(G, String(this.after), left);   // (별 상자: one star a treasure kept)
    G.audio.sfx('win'); G.world.fx.confetti(140); this.seek.setFace?.('sad'); this.say(this.seek, '으아~ 다 못 찾았어!', 1800); this.hero.pose = 'cheer';
    G.stats.log.push({ boss: this.tier + 1, result: 'win', left });
    setTimeout(() => { if (this.dead) return;
      // (선물은 아주 가끔 10/20: 49판 뒤 보물 지키기 gives a special gift on this card, gifts.js chapterGift; no 별 막대)
      const next = G.ui.btn('다음 판', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('stage', { idx: this.after + 1 }) }), gift = chapterGift(G, this.after, [next]);
      G.ui.panel({ title: '보물 지키기 성공!', color: 'green',
      body: [h('div', { class: 'tslots end' }, ...this.treasures.map(t => h('div', { class: 'tslot ' + (t.lost ? 'lost' : 'hidden') }, h('img', { src: G.thumbs['item_' + t.type] })))),
        ...(G.playMode ? [] : [giftRow(G, 'treasure')].filter(Boolean)), h('div', { class: 'txt' }, `보물 ${left}개를 지켰어!`), h('div', { class: 'reward' }, G.playMode ? '연습이라 코인은 없어' : `코인 +${coins}`), ...(first ? [h('div', { class: 'txt' }, '다음 너굴이는 코가 더 좋아질 거야…!')] : []), ...(gift ? [gift] : [])],
      buttons: [this.nextBtn = next] }); }, 1200);
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
      if (this.treasures.every(t => t.spot)) { this._startAt = Math.min(this._startAt ?? this.t, this.t); return; }
      if (!this.bspot || this.bspot.tre) { const pool = this.spots.filter(s => !s.tre); this.bspot = (mode === 'random' ? pool.sort(() => Math.random() - .5) : pool.sort((a, b) => Math.hypot(b.t.x - sp.x, b.t.z - sp.z) - Math.hypot(a.t.x - sp.x, a.t.z - sp.z)))[0]; this.bpath = null; }
      if (this.bspot) { this.hideTreasure(this.bspot); this.bspot = null; }   // (숨기는 동안 몽글이는 가만히 — 봇도 콕만)
      return;
    }
    // seek: when it heads for a real treasure, whistle it away (from wherever we are)
    if (mode !== 'random' && this.target?.tre && !this.target.tre.lost && !(this.whT > 0) && this.sState === 'search') this.whistle();
  }
  state() { return { scene: 'boss', phase: this.phase, s: this.sState, left: this.treasures.filter(t => !t.lost).length, time: +(this.time || 0).toFixed(1), result: this.result || null }; }
}
const CHAR_OK = k => !!k && k !== 'mom' && !!CHAR_DEFS[k];
