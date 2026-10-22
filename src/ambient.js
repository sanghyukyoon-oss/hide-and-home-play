// Idle life in a room: only what would naturally move on its own — plants sway from the pot, clothes on a rail sway,
// curtains flutter, the hanging cat clock swings,
// warm things (tea on the kotatsu, a pot on the stove, the rice cooker, the street stall's pan and broth) send up a little steam. Hidden things are never
// animated on their own (a moving target would be easy to spot); they only ride along with their host's gentle sway.
// Nothing here marks the shadow map dirty: the motion is small, so the cast shadows stay as they were (no extra pass).
import * as THREE from 'three';

const SWAY = [
  [/^(plant|monstera|plantbig|bush|tree|pine|pine2|flower|garden|planter|cactus|sprout)/, { a: .028, f: 1.15 }],
  [/^(hanger|clothesline|roofline|laundryline|dryrack)$/, { a: .018, f: .9 }],
];
const STEAM = { kotatsu: { up: .02 }, ricecooker: { up: .02 }, counter: { up: .05, only: o => o?.variant === 'stove' },
  // (22판 실폰 10/21, user: "음식에 연기가 멈추어 있다..") — street food: pts are spouts in the piece's own frame (several per piece),
  // s the puff size, rise how high it climbs. The stall's frozen white balls are gone; its steam rises and thins like the rest.
  tteokstall: { pts: [[-.52, .98, -.08], [.02, 1.1, -.1]], s: 1.25, rise: .42 },   // the tteokbokki pan, the 어묵 broth
  counter2: { pts: [[.56, 1.27, -.1]], s: .9 },                                      // the konbini's 호빵 steamer
};
const PUFF = new THREE.SphereGeometry(.05, 10, 8);
// 벚꽃 (③ 10/21 #105, user: "기차역엔 벚꽃 좀 날리자"): petals drift off every cherry tree in the room — slowly, the wind carrying
// them back and away from the camera (few in front, nothing to hide what's hidden), they settle on the ground a moment and
// are gone; gust() scatters them once (27판: the train pulling in). One instanced mesh for all of them. Another spring map
// without a cherry tree turns it on with its layout's petals: { n, from: [x0, z0, x1, z1] (the room's own frame) }.
const PETAL_TREES = /^treesakura$/;
const PETAL = (() => { const g = new THREE.CircleGeometry(.055, 7); g.scale(1, .62, 1); return g; })();

export class Ambient {
  constructor(room) {
    this.t = Math.random() * 10; this.sway = []; this.steam = []; this.flutter = []; this.swing = []; this.ticks = [];
    const rooms = room.rooms || [room];
    for (const R of rooms) R.group.updateMatrixWorld(true);   // boxes below need the room's real placement
    // moving parts that hang: curtains flutter a little (open or shut), a hanging clock swings while it hangs closed
    for (const R of rooms) for (const r of [...R.furns, ...(R.decors || [])]) for (const p of r.f.parts || []) {
      if (/커튼/.test(p.label)) for (const pv of p.pivots) this.flutter.push({ pv, x0: pv.rotation.x, ph: Math.random() * 6.3 });
      else if (p.label === '고양이 시계') this.swing.push({ p, pv: p.pivots[0], ph: Math.random() * 6.3 });
    }
    this.petals = null;
    const canopies = [];
    for (const R of rooms) {
      for (const r of R.furns) if (PETAL_TREES.test(r.type)) {
        const b = new THREE.Box3().setFromObject(r.f.group), h = b.max.y - b.min.y;
        canopies.push({ R, min: R.group.worldToLocal(new THREE.Vector3(b.min.x, b.min.y + h * .42, b.min.z)), max: R.group.worldToLocal(new THREE.Vector3(b.max.x, b.min.y + h * .6, b.max.z)) });
      }
      const L = R.L?.petals; if (L?.from) canopies.push({ R, min: new THREE.Vector3(L.from[0], 2, L.from[1]), max: new THREE.Vector3(L.from[2], 2.6, L.from[3]) });
    }
    if (canopies.length) {
      const R = canopies[0].R, n = Math.max(40, Math.min(80, R.L?.petals?.n || 60));
      const m = new THREE.InstancedMesh(PETAL, new THREE.MeshBasicMaterial({ color: '#ffc6d9', side: THREE.DoubleSide, transparent: true, opacity: .95, depthWrite: false }), n);
      m.userData.noOcclude = true; m.renderOrder = 3; m.layers.set(2); m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
      const cols = ['#ff9ec0', '#ffb8d0', '#ff86b0', '#fff2f6']; for (let i = 0; i < n; i++) m.setColorAt(i, new THREE.Color(cols[i % 4]));
      R.group.add(m);
      const raised = (R.L?.raised || []).map(z => ({ x0: z.i - R.w / 2, z0: z.j - R.d / 2, x1: z.i + z.w - R.w / 2, z1: z.j + z.d - R.d / 2, h: z.h || 0 }));
      const ground = (x, z) => { for (const q of raised) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return q.h + .012; return .012; };
      const P = this.petals = { m, R, canopies, ground, list: [], gust: 0, M: new THREE.Matrix4(), Q: new THREE.Quaternion(), E: new THREE.Euler(), V: new THREE.Vector3(), S: new THREE.Vector3() };
      for (let i = 0; i < n; i++) { const q = { i }; this.spawn(q, Math.random()); P.list.push(q); }
    }
    for (const R of rooms) for (const r of R.decors || []) if (r.f.tick) this.ticks.push(r.f.tick);   // (a wall piece's own motion too: the train's windows, the rack's fan — 10/22)
    for (const R of rooms) for (const r of R.furns) {
      if (r.f.tick) this.ticks.push(r.f.tick);   // a piece's own little motion (a level crossing's lamps taking turns)
      const g = r.f.group, sw = SWAY.find(([re]) => re.test(r.type));
      if (sw) this.sway.push({ g, x0: g.rotation.x, z0: g.rotation.z, ...sw[1], ph: Math.random() * 6.3 });
      const st = STEAM[r.type];
      if (st && (!st.only || st.only(r.opts))) {
        const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
        const srcs = st.pts ? st.pts.map(q => R.group.worldToLocal(g.localToWorld(new THREE.Vector3(...q)))) : [R.group.worldToLocal(new THREE.Vector3(c.x, b.max.y + st.up, c.z))];
        srcs.forEach((src, j) => {
          const puffs = [0, 1, 2].map(i => {
            const m = new THREE.Mesh(PUFF, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
            m.userData.noOcclude = true; m.renderOrder = 3; m.layers.set(2); R.group.add(m);
            return { m, k: (i + j * .5) / 3 % 1 };
          });
          this.steam.push({ src, puffs, s: st.s || 1, rise: st.rise || .32 });
        });
      }
    }
  }
  // a petal leaves a tree (k: how far down it starts, so the first ones aren't all up in the crown)
  spawn(q, k = 0) {
    const P = this.petals, c = P.canopies[Math.floor(Math.random() * P.canopies.length)], r = Math.random;
    q.x = c.min.x + (c.max.x - c.min.x) * r(); q.z = c.min.z + (c.max.z - c.min.z) * r(); q.y = c.min.y + (c.max.y - c.min.y) * r();
    q.y -= (q.y - P.ground(q.x, q.z)) * k * .9;
    q.vy = -(.16 + r() * .12); q.ph = r() * 6.3; q.sp = 1.5 + r() * 2.5; q.rest = 0; q.s = .8 + r() * .5; q.lift = 0;
  }
  // the wind picks up once: the petals in the air fly, the ones on the ground lift again, a handful more leave the trees
  gust(dur = 1.6) {
    const P = this.petals; if (!P) return;
    P.gust = dur;
    for (const q of P.list) { if (q.rest > 0) { q.rest = 0; q.lift = .5 + Math.random() * .6; } else if (Math.random() < .35) this.spawn(q, 0); }
  }
  updatePetals(dt, t) {
    const P = this.petals, g = P.gust > 0 ? 1 + 4 * Math.min(1, P.gust) : 1; P.gust = Math.max(0, P.gust - dt);
    // the wind: along the room to the left, a little toward the front (over a platform onto its track), a slow sway on top
    const wx = (-.24 + Math.sin(t * .37) * .08) * g, wz = (.05 + Math.sin(t * .23 + 1) * .05) * g;
    for (const q of P.list) {
      if (q.rest > 0) {
        q.rest -= dt; const s = q.rest < .5 ? Math.max(0, q.rest / .5) : 1;
        P.E.set(-Math.PI / 2, q.ph, 0); P.Q.setFromEuler(P.E); P.S.setScalar(q.s * s);
        if (q.rest <= 0) this.spawn(q, 0);
      } else {
        q.lift = Math.max(0, q.lift - dt * 1.2);
        q.x += (wx + Math.sin(t * 1.3 + q.ph) * .12) * dt; q.z += (wz + Math.cos(t * 1.1 + q.ph) * .08) * dt;
        q.y += (q.vy + q.lift + Math.sin(t * 2.2 + q.ph) * .05) * dt;
        const R = P.R, gy = P.ground(q.x, q.z);
        if (q.y <= gy) { q.y = gy; q.rest = 1.2 + Math.random() * 2; }
        if (Math.abs(q.x) > R.w / 2 + 1 || Math.abs(q.z) > R.d / 2 + 1) this.spawn(q, 0);
        P.E.set(t * q.sp + q.ph, t * q.sp * .7, q.ph); P.Q.setFromEuler(P.E); P.S.setScalar(q.s);
      }
      P.M.compose(P.V.set(q.x, q.y, q.z), P.Q, P.S); P.m.setMatrixAt(q.i, P.M);
    }
    P.m.instanceMatrix.needsUpdate = true;
  }
  update(dt) {
    const t = this.t += dt;
    if (this.petals) this.updatePetals(dt, t);
    for (const s of this.sway) {
      const w = Math.sin(t * s.f + s.ph), v = Math.sin(t * s.f * .73 + s.ph * 1.7);
      s.g.rotation.z = s.z0 + w * s.a; s.g.rotation.x = s.x0 + v * s.a * .6;
    }
    for (const k of this.ticks) k(t);
    for (const c of this.flutter) c.pv.rotation.x = c.x0 + (Math.sin(t * 1.7 + c.ph) * .6 + Math.sin(t * 2.9 + c.ph * 2) * .4) * .045;
    for (const c of this.swing) if (c.p.t < .01 && !c.p.busy) c.pv.rotation.z = Math.sin(t * 2.1 + c.ph) * .06;
    for (const s of this.steam) for (const p of s.puffs) {
      p.k = (p.k + dt / 2.4) % 1;
      const k = p.k, sz = .5 + k * 1.3;
      p.m.position.set(s.src.x + Math.sin(k * 6 + p.k * 3) * .04 * s.s, s.src.y + k * s.rise, s.src.z);
      p.m.scale.setScalar(sz * .8 * s.s); p.m.material.opacity = Math.pow(1 - k, 1.3) * Math.min(1, k * 8) * .6;   // thick at the spout, thinning as it rises
    }
  }
  dispose() { if (this.petals) { this.petals.m.parent?.remove(this.petals.m); this.petals.m.material.dispose(); this.petals.m.dispose(); this.petals = null; } for (const s of this.steam) for (const p of s.puffs) { p.m.parent?.remove(p.m); p.m.material.dispose(); } }
}
