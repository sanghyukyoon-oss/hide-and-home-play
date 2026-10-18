// Drop-in visitors: while the player just looks at a scene for a while, a friend wanders over to 몽글이, chats,
// sometimes leaves a small gift, and heads off again. Scenes give it a parent group, 몽글이, an entry point and a say().
import * as THREE from 'three';
import { Char, CHAR_DEFS } from './gfx/chars.js';

const SMALLTALK = ['몽글아 뭐 해~?', '놀러 왔지롱!', '오늘 날씨 진짜 좋다~', '여기 뭐 숨겼어? 궁금하다!', '방 구경 좀 해도 돼?', '나 방금 숨바꼭질하다 왔어!', '배고프다… 간식 있어?'];
const ROOMTALK = ['방 진짜 예쁘다!', '나도 이런 방 갖고 싶어…', '저 가구 어디서 샀어?', '여기 숨기면 아무도 못 찾겠는데?'];
const BYE = ['또 올게~', '나중에 숨바꼭질하자!', '안녕~ 잘 있어!', '이제 가 볼게!'];
const REPLY = ['어서 와!', '헤헤 반가워!', '고마워~', '오! 진짜?'];
const BY_KIND = {
  grumpy: ['흥, 그냥 지나가다 들렀어.', '…방이 좀 괜찮네.'],
  skater: ['보드 타고 왔다! 슝~', '여기 바닥 보드 타기 딱인데?'],
  sleepy: ['하암… 여기서 좀 자도 돼?', '음냐… 포근하다…'],
  nerd: ['이 방, 숨을 곳이 꽤 많군.', '숨바꼭질은 확률 싸움이야.'],
  cat: ['캣타워 잘 쓰고 있냥?', '일기장 얘기는 비밀이다냥.'],
  shiba: ['멍! 냄새 맡으면 다 찾을 수 있어!', '꼬리가 저절로 흔들려~'],
  frog: ['개굴! 비 오는 날 또 올게!', '여기 연못 있으면 좋겠다~'],
  dj: ['이 방 BGM 내가 깔아 줄까?', '둠칫 둠칫~'],
  robot: ['방 스캔 완료. 귀여움 100%.', '삐빅! 몽글이 발견!'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const NO = ['mong', 'mom'];

export class Visitors {
  // opts: { parent, mong, entry: () => [x, z], meet: () => [x, z], say(ch, text, ms), indoorRoom: bool, active: () => bool,
  //   seats: () => [{ who, stand: [x, z], top: Vector3|null, at: [x, z], say, mong }] — gifts out in the room (script.js giftSeats) }
  constructor(G, opts) {
    this.G = G; this.o = opts; this.tw = opts.tw;
    this.idle = 0; this.next = 12 + Math.random() * 8; this.cur = null; this.recent = []; this.sat = new Set();
    this._poke = () => { this.idle = 0; };
    addEventListener('pointerdown', this._poke);
  }
  dispose() { removeEventListener('pointerdown', this._poke); this.drop(); this.dead = true; }
  drop() { if (this.cur) { this.cur.ch.root.parent?.remove(this.cur.ch.root); this.cur = null; } }
  update(dt) {
    if (this.cur) { this.cur.ch.update(dt); return; }
    if (this.o.active && !this.o.active()) { this.idle = 0; return; }
    this.idle += dt;
    // a gift out in the room: its friend drops by sooner, the first time
    if (this.seatDue == null) this.seatDue = !!this.o.seats?.().length;
    if (this.idle > (this.seatDue && !this.sat.size ? Math.min(this.next, 7) : this.next)) this.come();
  }
  // [[x, z] …] ending at (or near) the meeting point, every step clear of furniture; null when there is no way
  route(ex, ez, mx, mz) {
    const ok = this.o.clear || (() => true), R = .3;
    const line = (ax, az, bx, bz) => { const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / .15)); for (let i = 1; i <= n; i++) if (!ok(ax + (bx - ax) * i / n, az + (bz - az) * i / n, R)) return false; return true; };
    // the meeting point itself may sit next to new furniture: take the nearest clear point to it
    if (!ok(mx, mz, R)) {
      let b = null;
      for (let dx = -1.5; dx <= 1.5; dx += .25) for (let dz = -1.5; dz <= 1.5; dz += .25) { const d = dx * dx + dz * dz; if ((!b || d < b.d) && ok(mx + dx, mz + dz, R)) b = { x: mx + dx, z: mz + dz, d }; }
      if (!b) return null; mx = b.x; mz = b.z;
    }
    if (line(ex, ez, mx, mz)) return [[mx, mz]];
    let best = null;
    for (let x = -3; x <= 3; x += .5) for (let z = -3; z <= 3; z += .5) {
      if (!ok(x, z, R) || !line(ex, ez, x, z) || !line(x, z, mx, mz)) continue;
      const d = Math.hypot(x - ex, z - ez) + Math.hypot(mx - x, mz - z);
      if (!best || d < best.d) best = { x, z, d };
    }
    return best ? [[best.x, best.z], [mx, mz]] : null;
  }
  async come() {
    const G = this.G, tw = this.tw, mong = this.o.mong;
    const skip = this.o.skip?.() || null;   // (friends already sitting in the room don't drop by — 경제·로비)
    const kinds = Object.keys(CHAR_DEFS).filter(k => !NO.includes(k) && !this.recent.includes(k) && !skip?.has(k));
    const met = (G.save.chars || []).filter(k => kinds.includes(k));
    // whoever gave a piece that's out in this room comes to sit at it first; after that, anyone (still to their seat)
    const seats = (this.o.seats?.() || []).filter(s => !skip?.has(s.who)), due = seats.find(s => !this.sat.has(s.who));
    const kind = due ? due.who : met.length && Math.random() < .6 ? pick(met) : pick(kinds); this.recent = [...this.recent.slice(-4), kind];
    const seat = seats.find(s => s.who === kind) || null;
    let [ex, ez] = this.o.entry(), [mx, mz] = seat ? seat.stand : this.o.meet();
    // a route that never walks through furniture: straight if it can, else via one corner point; no route, no visit
    const route = this.route(ex, ez, mx, mz);
    if (seat) this.sat.add(kind);   // (a seat it can't reach still counts as tried, so the others get their turn)
    if (!route) { this.idle = 0; this.next = 20 + Math.random() * 20; return; }
    [mx, mz] = route.at(-1);
    const ch = new Char(kind), cur = this.cur = { ch };
    ch.root.position.set(ex, 0, ez); ch.root.scale.setScalar(.01);
    this.o.parent.add(ch.root); G.world.idsDirty = true;
    const alive = () => !this.dead && this.cur === cur;
    G.audio.sfx('pop', 6);
    await tw.run(.3, k => { ch.root.scale.setScalar(Math.max(.01, k)); });
    // hop over in small steps
    const walk = async (pts, dur) => {
      for (let k = 1; k < pts.length && alive(); k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k], n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / .45));
        for (let i = 1; i <= n && alive(); i++) await ch.hopTo(tw, ax + (bx - ax) * i / n, az + (bz - az) * i / n, { height: .22, dur });
      }
    };
    await walk([[ex, ez], ...route], .26);
    if (!alive()) return;
    const mp = mong.root.position;
    // a jump with a height change (up onto its seat, back down to the floor)
    const leap = async (x, y, z, dur = .5) => {
      const s = ch.root.position.clone();
      if (Math.hypot(x - s.x, z - s.z) > .02) ch.root.rotation.y = Math.atan2(x - s.x, z - s.z);
      ch.squash = .25; G.audio.sfx('pop', 4);
      await tw.run(dur, k => { ch.root.position.set(s.x + (x - s.x) * k, s.y + (y - s.y) * k + .45 * 4 * k * (1 - k), s.z + (z - s.z) * k); }, t => t);
      ch.squash = .3;
    };
    let up = null;
    if (seat) {
      // its gift: a look at it first, up onto it if it has a seat, then the line that only this piece gets
      ch.faceTo(seat.at[0], seat.at[1]); ch.setFace?.('happy');
      await tw.wait(.5); if (!alive()) return;
      if (seat.top) { up = ch.root.position.clone(); await leap(seat.top.x, seat.top.y, seat.top.z); if (!alive()) return; }
    }
    ch.faceTo(mp.x, mp.z); mong.faceTo?.(ch.root.position.x, ch.root.position.z);
    const name = CHAR_DEFS[kind]?.name || '친구';
    const first = seat ? seat.say : BY_KIND[kind] ? pick(BY_KIND[kind]) : pick(this.o.indoorRoom ? [...SMALLTALK, ...ROOMTALK] : SMALLTALK);
    ch.pose = seat ? 'idle' : 'wave'; this.o.say(ch, first, seat ? 2800 : 2200); G.audio.sfx('giggle');
    if (seat) { const s = G.world.toScreen(ch.root.getWorldPosition(new THREE.Vector3()).setY(ch.root.position.y + ch.headTop() + .1)); G.world.fx.burst(s.x, s.y, { n: 10, shape: 'heart', colors: ['#ff7aa8', '#ffd1e0'], speed: 120, gravity: -60 }); }
    await tw.wait(seat ? 2.9 : 2.3); if (!alive()) return;
    ch.pose = 'idle'; mong.bump?.(.35); this.o.say(mong, seat ? seat.mong : pick(REPLY), seat ? 1900 : 1500);
    await tw.wait(seat ? 2.6 : 1.6); if (!alive()) return;   // (a seat is for sitting a while)
    if (Math.random() < .4) {
      const coins = Math.random() < .3 ? 20 : 10;
      G.addCoins(coins); G.audio.sfx('coin');
      const s = G.world.toScreen(ch.root.position.clone().setY(ch.root.position.y + ch.headTop() + .1));
      G.world.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffffff'], speed: 180, gravity: -40 });
      G.ui.toast(`${ga(name)} 코인 ${coins}개를 선물했어!`, 'green');
      await tw.wait(.8); if (!alive()) return;
    }
    this.o.say(ch, pick(BYE), 1500); ch.pose = 'wave';
    await tw.wait(1.2); if (!alive()) return;
    ch.pose = 'idle'; ch.setFace?.('normal');
    if (up) { await leap(up.x, 0, up.z, .42); if (!alive()) return; }
    await walk([...route.slice().reverse(), [ex, ez]], .24);
    if (!alive()) return;
    await tw.run(.25, k => { ch.root.scale.setScalar(Math.max(.01, 1 - k)); });
    this.drop(); this.idle = 0; this.next = 22 + Math.random() * 20;
  }
}
export { THREE };
