// Chibi cat — the representative character for the art test.
// Big head (≈60% of height), flat sticker ears, tabby stripes, cream muzzle, swaying tail, ear twitch, blink.
import * as THREE from 'three';
import { sph, cap, cone, tor, put, grp, mat, mesh, geo, blobShadow } from './kit.js';

const C = { base: '#ffab4c', dark: '#e9772a', cream: '#fff3dc', pink: '#ff8fb0', ink: '#2e1f2a', blush: '#ff7f9e' };

function earShape(w = .32, h = .34, r = .07) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, 0);
  s.lineTo(w / 2 - r, 0);
  s.quadraticCurveTo(w / 2, 0, w / 2 - r * .3, r * .9);
  s.lineTo(r * .5, h - r);
  s.quadraticCurveTo(0, h + r * .2, -r * .5, h - r);
  s.lineTo(-w / 2 + r * .3, r * .9);
  s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  return s;
}
function earMesh(key, w, h, depth, color) {
  return mesh(geo('ear-' + key, () => {
    const g = new THREE.ExtrudeGeometry(earShape(w, h), { depth, bevelEnabled: true, bevelThickness: depth * .5, bevelSize: depth * .45, bevelSegments: 3, curveSegments: 8 });
    g.translate(0, 0, -depth / 2); return g;
  }), mat(color));
}

export class ChibiCat {
  constructor({ palette = C, scale = .62 } = {}) {
    const P = this.P = { ...C, ...palette };
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    this.body.scale.setScalar(scale); this.S = scale;
    this.shadow = blobShadow(.36, .3); this.shadow.layers.set(2); this.root.add(this.shadow);
    this.t = Math.random() * 10; this.blinkT = 1.5; this.twitchT = 2; this.face = 'normal';
    const B = this.body;
    // torso
    this.torso = grp(put(sph(.3, P.base), 0, .27, 0, 0, 0, 0, [1, .88, .92]), put(sph(.21, P.cream), 0, .25, .14, 0, 0, 0, [1, .95, .6]));
    for (const sx of [-1, 1]) this.torso.add(put(cap(.03, .12, P.dark), sx * .27, .3, -.04, 0, 0, sx * .5));
    B.add(this.torso);
    for (const sx of [-1, 1]) {
      B.add(put(sph(.095, P.cream), sx * .14, .07, .2, 0, 0, 0, [1, .7, 1.15]));
      B.add(put(sph(.1, P.base), sx * .22, .07, .02, 0, 0, 0, [1, .7, 1.2]));
    }
    // head (pivot at the neck so it can bob and look around)
    this.head = new THREE.Group(); put(this.head, 0, .5, 0); B.add(this.head);
    const H = this.head;
    H.add(put(sph(.42, P.base), 0, .28, 0, 0, 0, 0, [1.12, .92, 1]));
    H.add(put(sph(.17, P.cream), 0, .17, .3, 0, 0, 0, [1.35, .8, .62]));
    for (let i = -1; i <= 1; i++) H.add(put(cap(.026, .1 - Math.abs(i) * .03, P.dark), i * .09, .58, .2 + Math.abs(i) * .02, -.75, 0, i * .25));
    // ears: flat sticker shapes
    this.ears = [];
    for (const sx of [-1, 1]) {
      const e = new THREE.Group();
      e.add(earMesh('o', .3, .32, .07, P.base));
      e.add(put(earMesh('i', .17, .2, .03, P.pink), 0, .04, .05));
      put(e, sx * .25, .54, .0, -.15, 0, -sx * .32);
      H.add(e); this.ears.push(e); e.userData.base = e.rotation.z;
    }
    // eyes
    this.eyes = []; this.eyesHappy = [];
    for (const sx of [-1, 1]) {
      const e = grp(put(sph(.068, P.ink, null, 18, 14), 0, 0, 0, 0, 0, 0, [.82, 1.18, .5]), put(sph(.026, '#ffffff', null, 10, 8), -.018, .032, .03), put(sph(.012, '#ffffff', null, 8, 6), .02, -.03, .03));
      put(e, sx * .165, .3, .37); H.add(e); this.eyes.push(e);
      const hp = put(tor(.05, .017, P.ink, null, Math.PI, 8, 14), sx * .165, .28, .385); hp.visible = false; H.add(hp); this.eyesHappy.push(hp);
    }
    H.add(put(cone(.032, .035, P.pink, null, 3), 0, .225, .42, Math.PI / 2 + .2, 0, Math.PI));
    this.mouth = grp(put(tor(.024, .009, P.ink, null, Math.PI, 6, 10), -.024, 0, 0, 0, 0, Math.PI), put(tor(.024, .009, P.ink, null, Math.PI, 6, 10), .024, 0, 0, 0, 0, Math.PI));
    put(this.mouth, 0, .185, .42); H.add(this.mouth);
    this.mouthO = put(sph(.04, '#b8324f'), 0, .16, .4, 0, 0, 0, [1, 1.2, .5]); this.mouthO.visible = false; H.add(this.mouthO);
    for (const sx of [-1, 1]) {
      H.add(put(sph(.06, P.blush, null, 14, 10), sx * .3, .2, .3, 0, sx * .6, 0, [1.1, .6, .3]));
      for (const k of [-1, 1]) H.add(put(cap(.006, .13, P.ink), sx * .4, .2 + k * .025, .22, 0, sx * .5, Math.PI / 2 + sx * k * .12));
    }
    // tail: a chain of segments, each a child of the previous, so a phase-shifted sway curls it
    this.tail = [];
    let parent = new THREE.Group(); put(parent, 0, .17, -.24, -.9, 0, 0); B.add(parent);
    for (let i = 0; i < 7; i++) {
      const r = .07 - i * .004;
      const seg = new THREE.Group(); seg.position.y = i ? .085 : 0;
      seg.add(put(sph(r, i === 6 ? P.dark : P.base, null, 12, 10), 0, .04, 0, 0, 0, 0, [1, 1.3, 1]));
      parent.add(seg); this.tail.push(seg); parent = seg;
    }
    this.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.shadow.castShadow = false;
  }
  setFace(f) {
    this.face = f;
    const happy = f === 'happy';
    this.eyes.forEach(e => e.visible = !happy);
    this.eyesHappy.forEach(e => e.visible = happy);
    this.mouth.visible = f !== 'wow'; this.mouthO.visible = f === 'wow';
  }
  update(dt) {
    this.t += dt; const t = this.t;
    const br = Math.sin(t * 3.2) * .03;
    this.torso.scale.set(1 - br * .5, 1 + br, 1 - br * .5);
    this.head.position.y = .5 + br * .3;
    this.head.rotation.y = Math.sin(t * .6) * .25;
    this.head.rotation.z = Math.sin(t * 1.1) * .05;
    // tail sway (each segment lags the one before)
    this.tail.forEach((s, i) => { s.rotation.z = Math.sin(t * 2.4 - i * .55) * .22; s.rotation.x = i ? -.12 - Math.sin(t * 1.3 - i * .4) * .05 : 0; });
    // ear twitch every few seconds
    this.twitchT -= dt;
    if (this.twitchT < 0) { this.twitchT = 2 + Math.random() * 3; this._tw = { ear: this.ears[Math.random() < .5 ? 0 : 1], k: 0 }; }
    if (this._tw) { const w = this._tw; w.k += dt / .28; const a = Math.sin(Math.min(w.k, 1) * Math.PI * 2) * .35; w.ear.rotation.z = w.ear.userData.base + a * Math.sign(w.ear.userData.base); if (w.k >= 1) { w.ear.rotation.z = w.ear.userData.base; this._tw = null; } }
    // blink
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkT = 2 + Math.random() * 2.5; this._bl = .12; }
    if (this._bl > 0) { this._bl -= dt; this.eyes.forEach(e => e.scale.y = this._bl > 0 ? .12 : 1); }
  }
}
