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


// (⑥ 10/24 아트 점검 "빈 옷장처럼 보이고 민무늬" — 67판 정전 사무실): a real 분전반 — a soft grey steel cabinet on a concrete
// pad, the breaker board on its front (two rows of white breakers with black toggles, a big main breaker, a cream label strip), a
// round meter, a yellow ⚡ warning sticker, a taped 점검표, conduits running up into the ceiling, and the 두꺼비집 knife switch
// on the right with a red grip. Below: the cable cubby behind a flap (cables, a spare fuse box). Part, pivots and spots as before.
B.gptfusebox=f=>{
  const ST='#d6dbe2', STD='#a9b2c4', INK2='#3b3550', CRM='#fff4e2', YEL='#ffc23d', RED='#ff6b57', PAD='#cfc8bd';
  shape('fusebox-body2',({add,tube})=>{
    box(add,1.72,.16,.8,PAD,0,.08,0,.04);
    box(add,1.52,.04,.68,STD,0,.18,-.1,.015);
    for(const x of [-.74,.74])box(add,.06,1.76,.68,ST,x,1.04,-.1,.02);
    box(add,1.52,1.76,.06,STD,0,1.04,-.41,.02);
    box(add,1.52,.06,.68,ST,0,.64,-.1,.015);
    box(add,1.6,.1,.75,ST,0,1.93,-.1,.03);
    box(add,1.48,1.22,.62,ST,0,1.26,-.13,.03);
    box(add,1.5,1.24,.02,STD,0,1.26,.185,.01);
    box(add,.92,.82,.03,'#8b93a6',-.24,1.3,.2,.02);
    for(const [y,n] of [[1.5,6],[1.16,6]]){
      box(add,.84,.05,.02,CRM,-.24,y+.17,.215,.008);
      for(let k=0;k<n;k++){const x=-.6+k*.12;box(add,.09,.24,.05,'#f6f3fb',x,y,.225,.012);box(add,.035,.07,.035,INK2,x,y+.02,.255,.008);}
    }
    box(add,.2,.3,.06,'#f6f3fb',-.24,.98,.225,.015);box(add,.07,.1,.04,RED,-.24,1.0,.26,.01);
    add(G.cyl(.11,.11,.04,22),'#f6f3fb',-.48,1.82,.2,HP,0,0);add(G.tor(.11,.014,PI*2,4,22),STD,-.48,1.82,.222);
    add(G.box(.008,.075,.006,.002),RED,-.46,1.84,.226,0,0,-.6);add(G.sph(.012,6,5),INK2,-.48,1.82,.228);
    const tri=new THREE.Shape();tri.moveTo(-.09,0);tri.lineTo(.09,0);tri.lineTo(0,.16);tri.closePath();
    add(G.ext(tri,.006,0,1),YEL,.36,1.66,.205);add(G.ext(tri,.004,0,1),INK2,.36,1.675,.209,0,0,0,[.7,.7,1]);
    const bolt=new THREE.Shape();bolt.moveTo(.012,.11);bolt.lineTo(-.02,.05);bolt.lineTo(.004,.05);bolt.lineTo(-.012,0);bolt.lineTo(.022,.062);bolt.lineTo(-.002,.062);bolt.closePath();
    add(G.ext(bolt,.004,0,1),YEL,.36,1.68,.214);
    box(add,.2,.26,.008,CRM,.58,1.62,.198,.004,0,0,.06);for(let k=0;k<4;k++)box(add,.14,.012,.004,'#c9b89a',.58,1.69-k*.05,.203,.002,0,0,.06);
    box(add,.08,.03,.006,'#f2dfa0',.58,1.76,.204,.002,0,0,-.2);
    box(add,.3,.5,.05,STD,.5,1.1,.21,.015);for(const y of [.95,1.25])add(G.cyl(.025,.025,.06,10),'#c9cfe0',.5,y,.24,HP,0,0);
    for(const x of [.12,.36,.6])tube([x,1.98,-.3],[x,2.4,-.3],.035,'#c9cfe0',8);
    for(const x of [.12,.36,.6])add(G.tor(.042,.01,PI*2,4,12),STD,x,2.05,-.3,HP,0,0);
    box(add,1.36,.4,.04,'#5b5672',0,.4,-.37,.01);
    tube([-.6,.24,-.3],[-.3,.5,-.3],.03,'#3b3550',6);tube([-.3,.5,-.3],[.2,.3,-.3],.03,'#3b3550',6);tube([-.5,.22,-.25],[.4,.45,-.3],.024,RED,6);tube([-.2,.22,-.22],[.55,.26,-.32],.024,'#3fae7a',6);
    box(add,.26,.16,.2,'#e8bb82',.42,.27,-.14,.015);box(add,.27,.03,.21,'#f6e2b0',.42,.3,-.14,.006);
  },f.group);
  const lever=group(f.group,.5,1.1,.26);
  shape('fusebox-lever2',({add})=>{box(add,.06,.42,.05,'#c9cfe0',0,.2,0,.015);add(G.cyl(.04,.04,.2,12),RED,0,.42,0,0,0,HP);for(const s of [-1,1])add(G.sph(.042,10,8),RED,s*.1,.42,0);},lever);
  const flap=group(f.group,-.68,.35,.3);
  shape('fusebox-lower-flap2',({add})=>{box(add,1.35,.48,.05,ST,.675,.24,-.03,.02);for(const y of [.14,.22,.3])box(add,.5,.018,.01,STD,.675,y,0,.004);box(add,.18,.05,.04,YEL,1.18,.4,.005,.012);box(add,.12,.03,.03,'#a9b2c4',.2,.24,.01,.01);},flap);
  const p=part(f,'lever',[lever,flap],t=>{lever.rotation.x=1.25*step(t,0,.45);flap.rotation.y=-1.6*step(t,.5,1);},'두꺼비집 레버','latch',2.5);
  p.gptRecipe='flashlight-fuse-lights-safe';p.gptChain={role:'support',stages:[{at:0,sfx:'latch'},{at:.25,sfx:'creak'},{at:.65,sfx:'click'}],reaction:'비상등이 켜졌다!'};
  p.gptHandle=lever;p.gptTouchRadius=.7;
  f.spot('inside',null,0,.35,-.05,{part:p,maxH:.6,label:'두꺼비집 아래 케이블 칸'});
  f.spot('on',null,-.47,1.99,-.1,{maxH:.6,label:'두꺼비집 위 비상 손전등 자리'});
};

export const GPT_LAB_DEVICE_BUILDERS = B;
export const GPT_LAB_DEVICE_INFO = { gptfusebox: { w: 2, d: 1, name: '비상전원 두꺼비집 레버', hidden: true } };
