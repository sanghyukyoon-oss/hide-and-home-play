// (⑥ 10/22 밤 배색 — 사용자 "채도만 높여 놓고 조화롭지도 이쁘지도 않음": 색마다 GPT 원색의 밝기는 그대로 두고 색상은 이 맵 배색 꿀빛 나무·민트·하늘·코랄(+잎 초록)으로,
// 옅은 큰 면은 부드럽게, 아주 진한 빨강·금빛 노랑만 작은 포인트로)
// Small procedural modeling kit for the GPT park additions. All materials use the game's toon pipeline.
import * as THREE from 'three';
import { rbox, sph, mat, mesh, geo, canvasTex, texCache, put } from './kit.js';

export const C = { cream:'#f6efe8', wood:'#d7a274', dark:'#604d60', mint:'#8bcfbe', red:'#e67065', blue:'#7aadd9', yellow:'#d9a87d', lilac:'#a3c6e4', leaf:'#7ec567', soil:'#ce8d55' };
export function box(parent,w,h,d,color,x=0,y=0,z=0,r=.04) { const m=put(rbox(w,h,d,color,r),x,y,z); parent.add(m); return m; }
export function ball(parent,r,color,x=0,y=0,z=0) { const m=put(sph(r,color,null,12,8),x,y,z); parent.add(m); return m; }
export function cylinder(parent,rt,rb,h,color,x=0,y=0,z=0,seg=12) { const m=put(mesh(geo(`gpt-cyl|${rt}|${rb}|${h}|${seg}`,()=>new THREE.CylinderGeometry(rt,rb,h,seg)),mat(color)),x,y,z); parent.add(m); return m; }
export function group(parent,x=0,y=0,z=0) { const g=new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; }
export function rod(parent,a,b,r,color) { const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A); const m=cylinder(parent,r,r,v.length(),color,...A.clone().add(B).multiplyScalar(.5).toArray(),8); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return m; }
export function hollow(parent,w,h,d,color,x=0,y=0,z=0,t=.06) {
  const g=group(parent,x,y,z);
  box(g,w,t,d,color,0,t/2,0); box(g,w,h,t,color,0,h/2,-(d-t)/2);
  box(g,t,h,d-t,color,-(w-t)/2,h/2,t/2); box(g,t,h,d-t,color,(w-t)/2,h/2,t/2);
  return g;
}
const labels=texCache();
export function label(parent,text,w,h,x=0,y=0,z=0,{bg='#f6efe8',fg='#604d60',ry=0}={}) {
  const map=labels.get(`gpt-label|${text}|${bg}|${fg}|${w/h}`,()=>canvasTex(512,Math.max(64,Math.min(512,Math.round(512*h/w))),(c,W,H)=>{
    c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
    let size=Math.round(H*.66);c.font=`bold ${size}px Ssurround, sans-serif`;while(c.measureText(text).width>W*.8 && size>8){size--;c.font=`bold ${size}px Ssurround, sans-serif`;}c.fillText(text,W/2,H/2);
  }));
  const m=put(mesh(geo(`gpt-labelplane|${w}|${h}`,()=>new THREE.PlaneGeometry(w,h)),mat('#ffffff',{map})),x,y,z);
  m.rotation.y=ry;parent.add(m);return m;
}
export const phase=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));

// One merged furniture body can have several logical mechanisms. The markers feed devices.js's phased sound hooks.
export function mechanism(f,kind,pivots,apply,{label:caption='장치',sfx='swish',dur=1.25,chain=[]}={}) {
  const p=f.part(kind,pivots,apply,{label:caption,sfx,dur});
  p.gptDevice=true;p.gptChain=chain;p.gptPhases=chain.length ? [{at:.32,sfx:'clink'},{at:.68,sfx:'open'}] : [];
  return p;
}
