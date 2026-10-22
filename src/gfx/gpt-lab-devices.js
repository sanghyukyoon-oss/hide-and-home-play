// GPT 비상전원 두꺼비집을 원본 사무실로 (②b 10/22 저녁 — 사용자 "원본 유지 + GPT 장치 이식", 67판 정전): 손전등으로 비추고 레버를 내리면 비상등 → 불.
// 모델은 GPT 작업장(gpt3-h 정전 연구실) 빌더 그대로, 색은 ⑥ 들여오기 판.
import * as THREE from 'three';
import { calmAll } from './gpt-calm.js';
import { put, grp, mesh, mat, geo } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
// (⑥ 10/22 다시 칠함 — 사용자 "니가 색칠 다시": the lab and the roof in our paint — teal and mint machines, a clear blue, gold
// brass, coral warnings, warm woods, green plants; creams stay the walls)
const C = { cream:'#fef2e1', ivory:'#fefde9', mint:'#5fd3c0', teal:'#22a891', dark:'#6f4b30',
  ink:'#354354', blue:'#3a9be6', sky:'#5dc6ea', steel:'#679be0', gold:'#ffc21e', coral:'#f2554a',
  wood:'#d9775a', woodD:'#9a5a35', soil:'#8a5a44', leaf:'#35d649', leafD:'#2f9e52', brick:'#da6549' };
// The 10/22 pass applies only to selected maps. The exported legacy kit remains
// byte-for-byte in colour for the dropped story lab and companion gallery.
const FIX_C = {...C, ink:'#6f4b30', blue:'#67bfe0', sky:'#67d9e0', steel:'#e0b667',
  gold:'#feb53d', coral:'#e67860', wood:'#e2ae64', woodD:'#d4872b', soil:'#d5bb34',
  leaf:'#56dca6', leafD:'#37d42b', brick:'#eaa440'};
const FIX_COLORS = new Map(Object.entries(C).map(([k,v])=>[v,FIX_C[k]]));
let scienceFix = false;
const scienceColor = c => scienceFix ? (FIX_COLORS.get(c) || c) : c;
calmAll(C, .8); calmAll(FIX_C, .8);   // (원본 사무실 배색에 맞춰 차분하게 — gpt-calm.js)
const B = {};
const clamp = t => Math.max(0, Math.min(1, t));
const step = (t,a,b) => { const q=clamp((t-a)/(b-a)); return q*q*(3-2*q); };
const part = (f, kind, pivots, apply, label, sfx='open', dur=.7) => f.part(kind,pivots,apply,{label,sfx,dur});
function shape(key, fn, parent) {
  const fixed=scienceFix;
  const m=mc('gptscience-'+key+(fixed?'-fix1022':''),({add,tube,...rest})=>fn({...rest,
    add:(g,c,...args)=>add(g,fixed?(FIX_COLORS.get(c)||c):c,...args),
    tube:(a,b,r,c,...args)=>tube(a,b,r,fixed?(FIX_COLORS.get(c)||c):c,...args)}));
  parent.add(m); return m;
}
function group(parent,x=0,y=0,z=0) { const g=put(grp(),x,y,z); parent.add(g); return g; }
function box(add,w,h,d,c,x=0,y=0,z=0,r=.025,rx=0,ry=0,rz=0) { add(G.box(w,h,d,r),c,x,y,z,rx,ry,rz); }
function ring(add,r,t,c,x=0,y=0,z=0,rx=0,ry=0,rz=0) { add(G.tor(r,t,PI*2,5,22),c,x,y,z,rx,ry,rz); }
function paperCorner(add,x,y,z,s=.09) {
  const fold=new THREE.Shape();fold.moveTo(0,0);fold.lineTo(s,0);fold.lineTo(s,s);fold.closePath();
  add(G.ext(fold,.012,.002,1),C.cream,x,y,z,.24,0,0);
}
function wheel(parent,key,x,y,z,r=.23,c=C.coral) {
  const g=group(parent,x,y,z);
  shape(key,({add})=>{
    ring(add,r,.037,c);
    for(let i=0;i<3;i++) box(add,r*1.72,.035,.04,c,0,0,0,.008,0,0,i*PI/3);
    add(G.cyl(.06,.06,.09,10),C.gold,0,0,.02,HP,0,0);
    add(G.cyl(.035,.035,.14,8),C.dark,r*.83,0,.08,HP,0,0);
  },g); return g;
}
function drawer(parent,key,w=.9,d=.6,c=C.mint) {
  const g=group(parent);
  shape(key,({add})=>{
    box(add,w,.055,d,C.cream,0,.025,0,.015);
    box(add,w,.28,.065,c,0,.15,d/2-.025);
    for(const s of [-1,1]) box(add,.055,.21,d,C.wood,s*(w/2-.03),.13,0,.01);
    box(add,w,.21,.045,C.wood,0,.13,-d/2+.02,.01);
    box(add,.27,.045,.06,C.gold,0,.17,d/2+.025,.015);
  },g); return g;
}
function lockable(p,parent,x,y,z,kind='pad') { p.lockable=true; p.lockKind=kind; p.lockAt={parent,x,y,z}; }
function bookRun(add,x,y,z,n,spacing=.15) {
  for(let k=0;k<n;k++) {
    const h=.35+(k%3)*.065, c=[C.teal,C.cream,C.coral,C.gold,C.blue][k%5];
    box(add,.11,h,.29,c,x+k*spacing,y+h/2,z,.012,0,0,k===n-1?-.12:0);
    box(add,.09,.025,.012,C.ivory,x+k*spacing,y+.11,z+.151,.004);
  }
}
function plant(add,x,y,z,r=.24) {
  add(G.cyl(r*.8,r*.65,r*.7,12),C.coral,x,y+r*.35,z);
  add(G.cyl(r*.72,r*.72,.025,12),C.soil,x,y+r*.71,z);
  for(let k=0;k<5;k++) {
    const a=k*2.4;
    add(G.sph(r*.55,8,6),k%2?C.leaf:C.leafD,x+Math.cos(a)*r*.5,y+r*.95+(k%2)*r*.38,z+Math.sin(a)*r*.5,0,a,.25,[.8,1.6,.45]);
  }
}
function plinth(add,w,d) {
  // Room owns the visible floor at y=.001. Every new base face stays below it.
  box(add,w+.38,.12,d+.38,C.cream,0,-.095,0,.075);
  box(add,w+.27,.33,d+.27,C.brick,0,-.32,0,.06);
  box(add,w+.35,.37,d+.35,C.soil,0,-.675,0,.08);
  box(add,w+.4,.09,d+.4,C.woodD,0,-.905,0,.04);
  // Big masonry blocks and two continuous strata, not a floating sheet.
  for(let i=0;i<Math.floor(w/.75);i++) {
    const x=-w/2+.35+i*.75;
    box(add,.025,.23,.012,C.cream,x,-.32,d/2+.142,.003);
    box(add,.025,.23,.012,C.cream,x,-.32,-d/2-.142,.003);
  }
  for(let i=0;i<Math.floor(d/.75);i++) for(const s of [-1,1]) box(add,.012,.23,.025,C.cream,s*(w/2+.142),-.32,-d/2+.35+i*.75,.003);
  box(add,w+.36,.025,d+.36,'#dda057',0,-.68,0,.006);
}
function scenery(f) { f.gptScenery=true; f.noSolid=true; f.collideBox=[-.01,-1.1,-.01,.01,-1.02,.01]; }


B.gptfusebox=f=>{
  shape('fusebox-body',({add,tube})=>{
    box(add,1.72,.16,.8,C.cream,0,.08,0,.04);
    for(const x of [-.74,.74])box(add,.12,1.72,.68,C.mint,x,1.02,-.1,.03);
    box(add,1.6,1.72,.1,C.mint,0,1.02,-.39,.025);
    box(add,1.68,.12,.73,C.cream,0,1.93,-.1,.035);
    box(add,1.38,.07,.64,C.woodD,0,.3,-.1,.02);
    box(add,.48,.65,.09,C.cream,.35,1.2,-.25,.035);
    for(let k=0;k<3;k++){box(add,.13,.38,.065,C.gold,-.5+k*.16,1.3,-.23,.02);tube([-.5+k*.16,1.51,-.23],[-.5+k*.16,1.7,-.23],.02,C.coral,5);}
    for(let k=0;k<3;k++)tube([-.46+k*.35,1.87,-.32],[-.46+k*.35,2.17,-.32],.04,[C.coral,C.gold,C.teal][k],6);
    box(add,.14,.55,.04,C.woodD,.36,1.14,-.17,.02);
  },f.group);
  const lever=group(f.group,.36,.92,-.04);
  shape('fusebox-lever',({add})=>{box(add,.1,.48,.1,C.steel,0,.24,0,.03);add(G.sph(.13,10,8),C.coral,0,.5,0);},lever);
  const flap=group(f.group,-.68,.35,.3);
  shape('fusebox-lower-flap',({add})=>{box(add,1.35,.48,.08,C.cream,.675,.24,0,.035);box(add,.31,.055,.06,C.gold,.675,.24,.065,.018);},flap);
  const p=part(f,'lever',[lever,flap],t=>{lever.rotation.x=1.25*step(t,0,.45);flap.rotation.y=-1.6*step(t,.5,1);},'두꺼비집 레버','latch',2.5);
  p.gptRecipe='flashlight-fuse-lights-safe';p.gptChain={role:'support',stages:[{at:0,sfx:'latch'},{at:.25,sfx:'creak'},{at:.65,sfx:'click'}],reaction:'비상등이 켜졌다!'};
  p.gptHandle=lever;p.gptTouchRadius=.7;
  f.spot('inside',null,0,.35,-.05,{part:p,maxH:.6,label:'두꺼비집 아래 케이블 칸'});
  f.spot('on',null,-.47,1.99,-.1,{maxH:.6,label:'두꺼비집 위 비상 손전등 자리'});
};

export const GPT_LAB_DEVICE_BUILDERS = B;
export const GPT_LAB_DEVICE_INFO = { gptfusebox: { w: 2, d: 1, name: '비상전원 두꺼비집 레버', hidden: true } };
