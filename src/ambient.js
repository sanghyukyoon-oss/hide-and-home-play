// Idle life in a room: only what would naturally move on its own — plants sway from the pot, clothes on a rail sway,
// curtains flutter, the hanging cat clock swings,
// warm things (tea on the kotatsu, a pot on the stove, the rice cooker) send up a little steam. Hidden things are never
// animated on their own (a moving target would be easy to spot); they only ride along with their host's gentle sway.
// Nothing here marks the shadow map dirty: the motion is small, so the cast shadows stay as they were (no extra pass).
import * as THREE from 'three';

const SWAY = [
  [/^(plant|monstera|plantbig|bush|tree|pine|pine2|flower|garden|planter|cactus|sprout)/, { a: .028, f: 1.15 }],
  [/^(hanger|clothesline|laundryline|dryrack)$/, { a: .018, f: .9 }],
];
const STEAM = { kotatsu: { up: .02 }, ricecooker: { up: .02 }, counter: { up: .05, only: o => o?.variant === 'stove' } };
const PUFF = new THREE.SphereGeometry(.05, 10, 8);

export class Ambient {
  constructor(room) {
    this.t = Math.random() * 10; this.sway = []; this.steam = []; this.flutter = []; this.swing = [];
    const rooms = room.rooms || [room];
    for (const R of rooms) R.group.updateMatrixWorld(true);   // boxes below need the room's real placement
    // moving parts that hang: curtains flutter a little (open or shut), a hanging clock swings while it hangs closed
    for (const R of rooms) for (const r of [...R.furns, ...(R.decors || [])]) for (const p of r.f.parts || []) {
      if (/커튼/.test(p.label)) for (const pv of p.pivots) this.flutter.push({ pv, x0: pv.rotation.x, ph: Math.random() * 6.3 });
      else if (p.label === '고양이 시계') this.swing.push({ p, pv: p.pivots[0], ph: Math.random() * 6.3 });
    }
    for (const R of rooms) for (const r of R.furns) {
      const g = r.f.group, sw = SWAY.find(([re]) => re.test(r.type));
      if (sw) this.sway.push({ g, x0: g.rotation.x, z0: g.rotation.z, ...sw[1], ph: Math.random() * 6.3 });
      const st = STEAM[r.type];
      if (st && (!st.only || st.only(r.opts))) {
        const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
        const src = R.group.worldToLocal(new THREE.Vector3(c.x, b.max.y + st.up, c.z));
        const puffs = [0, 1, 2].map(i => {
          const m = new THREE.Mesh(PUFF, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
          m.userData.noOcclude = true; m.renderOrder = 3; m.layers.set(2); R.group.add(m);
          return { m, k: i / 3 };
        });
        this.steam.push({ src, puffs });
      }
    }
  }
  update(dt) {
    const t = this.t += dt;
    for (const s of this.sway) {
      const w = Math.sin(t * s.f + s.ph), v = Math.sin(t * s.f * .73 + s.ph * 1.7);
      s.g.rotation.z = s.z0 + w * s.a; s.g.rotation.x = s.x0 + v * s.a * .6;
    }
    for (const c of this.flutter) c.pv.rotation.x = c.x0 + (Math.sin(t * 1.7 + c.ph) * .6 + Math.sin(t * 2.9 + c.ph * 2) * .4) * .045;
    for (const c of this.swing) if (c.p.t < .01 && !c.p.busy) c.pv.rotation.z = Math.sin(t * 2.1 + c.ph) * .06;
    for (const s of this.steam) for (const p of s.puffs) {
      p.k = (p.k + dt / 2.4) % 1;
      const k = p.k, sz = .5 + k * 1.3;
      p.m.position.set(s.src.x + Math.sin(k * 6 + p.k * 3) * .04, s.src.y + k * .32, s.src.z);
      p.m.scale.setScalar(sz * .8); p.m.material.opacity = Math.pow(1 - k, 1.3) * Math.min(1, k * 8) * .6;   // thick at the spout, thinning as it rises
    }
  }
  dispose() { for (const s of this.steam) for (const p of s.puffs) { p.m.parent?.remove(p.m); p.m.material.dispose(); } }
}
