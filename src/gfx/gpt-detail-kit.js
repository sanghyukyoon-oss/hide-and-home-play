// Additive workshop dressing. Sample the *built* map: even baked vertex colours are
// reused verbatim, so a new toy never introduces a hue or runs vivid() a second time.
import * as THREE from 'three';
import { rbox, cyl, sph, put, grp } from './kit.js';
import { bakeItem } from './bake.js';

export function createDetailKit(room) {
  const root = grp(); root.name = 'gpt-detail-dressing';
  root.userData.gptDetail = true;
  const swatches = [], seen = new Set(), cache = new Map();
  room.group.traverse(o => {
    if (!o.isMesh || o.userData.proxy || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m?.color || m.map || m.transparent || (m.emissive?.getHex() && m.emissiveIntensity > 0) || (!m.isMeshToonMaterial && !m.isMeshStandardMaterial)) return;
    const keep = c => {
      const id = [c.r, c.g, c.b].join(','); if (seen.has(id)) return; seen.add(id);
      const mm = m.clone(); mm.vertexColors = false; mm.color.copy(c);
      // The colour is copied in linear space, without remapping or saturation changes.
      swatches.push({ color: c.clone(), material: mm });
    };
    const vc = m.vertexColors && o.geometry.attributes.color;
    if (vc) for (let i = 0; i < vc.count; i++) keep(new THREE.Color().setRGB(vc.getX(i), vc.getY(i), vc.getZ(i)).multiply(m.color));
    else keep(m.color);
  });
  if (!swatches.length) throw new Error('gpt detail: map has no painted material swatches');
  const material = hex => {
    if (cache.has(hex)) return cache.get(hex);
    const target = new THREE.Color(hex); let best = swatches[0], distance = Infinity;
    for (const s of swatches) {
      const d = (target.r-s.color.r)**2 + (target.g-s.color.g)**2 + (target.b-s.color.b)**2;
      if (d < distance) { distance = d; best = s; }
    }
    cache.set(hex, best.material); return best.material;
  };
  const stats = [];
  const make = container => {
    const add = (o, hex, x, y, z) => {
      o.material = material(hex); put(o,x,y,z); container.add(o); return o;
    };
    const api = {
      root: container,
      box: (w,h,d,hex,x=0,y=0,z=0,r=0) => add(rbox(w,h,d,'#ffffff',r),hex,x,y,z),
      cylinder: (rt,rb,h,hex,x=0,y=0,z=0,seg=10) => add(cyl(rt,rb,h,'#ffffff',null,seg),hex,x,y,z),
      sphere: (r,hex,x=0,y=0,z=0,scale=[1,1,1]) => {
        const o=add(sph(r,'#ffffff',null,10,6),hex,x,y,z); o.scale.set(...scale); return o;
      },
      rod: (a,b,r,hex) => {
        const A=new THREE.Vector3(...a), B=new THREE.Vector3(...b), v=B.clone().sub(A);
        const o=add(cyl(r,r,v.length(),'#ffffff',null,8),hex,...A.clone().add(B).multiplyScalar(.5).toArray());
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return o;
      },
      prop: (name,x,y,z,build,ry=0) => {
        const g=grp(); g.name='gpt-detail-'+name; g.userData.gptDetailProp=name;
        put(g,x,y,z,0,ry); container.add(g); build(make(g)); return g;
      },
      paper: (w,h,hex,x,y,z,ry=0) => api.prop('pinned-paper',x,y,z,k=>{
        k.box(w,h,.03,hex,0,0,0);
        k.box(w*.25,.035,.035,room.T.trim||hex,0,h*.47,.035);
        // A lifted corner gives a real thickness to the paper; no text or stretched UVs.
        const corner=k.box(w*.18,h*.16,.03,hex,w*.41,-h*.42,.025); corner.rotation.y=-.14;
      },ry),
    };
    return api;
  };
  const api=make(root);
  api.finish=()=>{
    const surface=grp(); surface.name='gpt-detail-surfaces';
    for(const child of root.children.slice()) if(child.isMesh) surface.add(child);
    if(surface.children.length) root.add(surface);
    // Each separate object gets one ink ID and one baked draw, without becoming
    // furniture, a pick target, a hiding spot, or an obstacle in the walk grid.
    for(const g of root.children){
      let vertices=0; g.traverse(o=>{if(o.isMesh) vertices+=o.geometry.attributes.position.count;});
      const isProp=!!g.userData.gptDetailProp;
      if(isProp) stats.push({name:g.userData.gptDetailProp,vertices});
      bakeItem(g);
      const id={}; g.traverse(o=>{if(o.isMesh) o.userData.og=id;});
    }
    root.userData.gptDetailStats=stats;
    root.userData.gptDetailPalette=swatches.map(s=>s.color.toArray());
    room.group.add(root); return root;
  };
  return api;
}
