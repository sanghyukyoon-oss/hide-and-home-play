// 27판 넓힌 역의 받침·선로·건너편 (GPT 작업장 gpt-station gptstation2-terrain.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로, 찻집 간판 글자는 우리 fitText로;
// 선로 띠와 건너편은 걷지 않는 곳 — walkBoxes, 받침은 바닥 칸을 차지하지 않음 noOccupied).
// A modest extension of the first station: the original forecourt and a lived-in lane beyond two tracks.
// Shared first-station builders keep their keys and geometry while receiving the workshop fix palette.
import * as THREE from 'three';
import { signTex } from './gptst-kit.js';
import { HG as SHAPES, hmc as mc } from './house-props.js';
import { canvasTex } from './kit.js';
import { GPTST_V1_BUILDERS as V1 } from './gptst-station-props.js';
import { GPTST_STORAGE_BUILDERS as STORAGE } from './gptst-storage.js';
const HP=Math.PI/2, B={};
// Sub-pixel bevels on ties/rails/strips cost hundreds of vertices each; retain rounded hero silhouettes.
const G={...SHAPES,box:(w,h,d,r=.02,seg=1)=>Math.min(w,h,d)<.08?SHAPES.pbox(w,h,d):SHAPES.box(w,h,d,r,seg)};
const C={cream:'#fbf7f0',pale:'#f4f2f0',wood:'#cf9b6b',brown:'#6f4b30',green:'#52b89b',mint:'#80cfb5',sand:'#d9bdcc',pink:'#e876aa'};

// This is also the navigation mask. It follows the inset neutral off-white cap, not the wider bevel below it.
export function station2IslandOutline(inset=.07){
  const x=5.4-inset,n=-6.5+inset,s=3.5-inset,r=.4;
  const p=new THREE.Shape();p.moveTo(-x+r,n);p.lineTo(x-r,n);p.quadraticCurveTo(x,n,x,n+r);
  p.lineTo(x,s-r);p.quadraticCurveTo(x,s,x-r,s);p.lineTo(-x+r,s);p.quadraticCurveTo(-x,s,-x,s-r);
  p.lineTo(-x,n+r);p.quadraticCurveTo(-x,n,-x+r,n);p.closePath();
  return p.getPoints(16).map(v=>[v.x,v.y]);
}
function cap(inset){const p=station2IslandOutline(inset),s=new THREE.Shape();s.moveTo(p[0][0],-p[0][1]);for(const [x,z]of p.slice(1))s.lineTo(x,-z);s.closePath();return s;}
B.gpt2_island=f=>{
  f.noSolid=true;f.collideBox=[-5.4,-.8,-6.5,5.4,-.05,3.5];
  f.walkOutline=station2IslandOutline().map(([x,y])=>({x,y}));
  f.add(mc('gpt2-first-station-plinth-v3',({add})=>{
    for(const[y,h,c,k]of[[-.78,.20,'#937e86',.03],[-.58,.31,'#79b7c3',0],[-.27,.22,'#e5ced9',.035],[-.05,.05,C.pale,.07]])add(G.ext(cap(k),h,.025,1),c,0,y,0,-HP);
    for(let x=-4.6;x<5;x+=.7)for(const z of[-6.49,3.49])add(G.box(.027,.18,.025,.006),'#8e91a9',x,-.41,z);
    // The first map's understated paving; edge details leave its open middle readable.
    for(let x=-4.5;x<4.9;x+=1.05)for(const z of[1.2,2.25])add(G.box(.76,.011,.024,.005),'#dedce2',x,.007,z);
    add(G.box(1.05,.025,.26,.018),'#a7bbc4',-.6,.024,2.95);
    for(let x=-1.04;x<-.1;x+=.11)add(G.box(.035,.012,.2,.005),'#6f4b30',x,.043,2.95);
  }));
  f.navigationFloor=f.group;f.navigationIslandCap=f.group;f.islandCapY=.025;
  // (① 10/22: the island is scenery and ground, not a piece standing on the floor's tiles)
  f.noOccupied=true;
};
B.gpt2_platformedge=f=>{
  f.noSolid=true;f.collideBox=[-5.2,-.1,-5.1,5.2,-.05,1];
  f.add(mc('gpt2-first-station-two-rails-v3',({add,tube})=>{
    // Track heights match the approved v1: wheel contact is the .184 m rail tread.
    for(const z of[-2.65,-4.4]){
      add(G.box(10.55,.06,1.27,.04),'#a7bbc4',0,.035,z);
      for(let x=-5.12;x<5.2;x+=.35){
        add(G.box(.14,.07,.98,.018),'#a68c73',x,.09,z);
        for(const side of[-1,1])add(G.sph(.062,5,4),'#d3c9b5',x+.09,.075,z+side*.56,0,0,0,[1.4,.6,1]);
      }
      for(const dz of[-.33,.33]){
        add(G.box(10.6,.09,.055,.01),'#7799a7',0,.13,z+dz);
        add(G.box(10.6,.018,.075,.006),'#d5e4e5',0,.175,z+dz);
      }
    }
    // A continuous timber crossing; small flangeways remain alongside each rail.
    add(G.box(1.3,.075,7.4,.025),'#e2c79e',4.0,.045,-1.55);
    for(const track of[-2.65,-4.4])for(const[dz,d]of[[-.60,.42],[0,.53],[.60,.42]])add(G.box(1.3,.16,d,.018),'#b99e79',4,.08,track+dz);
    for(const x of[3.41,4.59])add(G.box(.035,.016,1.0,.006),'#fbf7f0',x,.092,-.9);
    // The slightly wider platform retains v1 tactile colours and thickness.
    add(G.box(8.35,.012,.18,.005),'#feb53d',-.8,.397,-1.82);
    add(G.box(8.35,.012,.045,.005),'#fbf7f0',-.8,.397,-1.96);
    for(let x=-4.9;x<3.3;x+=.19)for(const z of[-1.86,-1.79])add(G.cyl(.018,.018,.013,5),'#d4ad4c',x,.41,z);
    // Low visible rod follows the east strip from the signal to the near barrier.
    tube([4.8,.055,-3.05],[4.8,.055,-1.25],.028,'#7799a7');
    tube([4.8,.055,-1.25],[3.3,.055,-1.25],.028,'#7799a7');
  }));
  f.navigationFloor=f.group;f.noOccupied=true;
  // (① 10/22 — the workshop's walking rule, as our walk boxes: the track band z -5.08..-1.95 and all beyond it is only seen;
  // the timber crossing x 4 ± .65 joins the forecourt as far as the middle of the first track, like the workshop's publicMinZ -3.55)
  f.walkBoxes=[[-5.6,0,-7,3.35,1.2,-1.95],[4.65,0,-7,5.6,1.2,-1.95],[3.35,0,-7,4.65,1.2,-3.55]];
};

// The shared bench now has a measured .50 m seat, including its coherent moving lid.
B.gpt2_v1bench=(f,T,o={})=>{STORAGE.gpt_storagebench(f,T,o);};

// A second little business across the tracks, made from the first ticket-office kit.
// It is a static street vignette: its open service window and real shelves remain visible.
B.gpt2_farshop=(f,T,o={})=>{
  V1.gpt_ticketoffice(f,T,o);f.group.scale.set(.82,1,.64);
  for(const p of f.parts)p.setOpen(0);f.parts.length=0;f.spots.length=0;
  f.collideBox=[-1.15,0,-.79,1.15,2.1,.60];
  f.group.traverse(m=>{
    if(!m.isMesh||m.geometry.type!=='PlaneGeometry')return;
    const main=Math.abs(m.position.y-1.78)<.01;if(!main&&Math.abs(m.position.y-.54)>.01)return;
    const text=main?'벚꽃 찻집':'차';
    const tx=signTex(text,main?6.4:1,1,main?C.green:C.cream,C.brown,{size:.57});
    m.material=m.material.clone();m.material.map=tx;m.material.needsUpdate=true;
  });
};
B.gpt2_farstreet=f=>{
  f.noSolid=true;f.collideBox=[-5.2,-1,-.65,5.2,-.8,.65];
  f.add(mc('gpt2-first-station-far-lane-v3',({add,tube})=>{
    add(G.box(10.3,.08,1.15,.07),'#d9bdcc',0,.04,0);
    add(G.box(10.35,.13,.12,.035),'#f4f2f0',0,.065,.53);
    // Picket fence broken into three quiet sections, with real posts and foot rails.
    for(const[lo,hi]of[[-4.8,-2.9],[-2.1,.2],[.9,2.3]]){
      for(const y of[.32,.67])add(G.box(hi-lo,.065,.065,.015),C.wood,(lo+hi)/2,y,-.43);
      for(let x=lo;x<=hi+.01;x+=.28){add(G.box(.085,.79,.075,.026),C.cream,x,.435,-.43);add(G.sph(.046,7,5),C.cream,x,.84,-.43,0,0,0,[1,.65,1]);}
    }
    // A whole bicycle leans on the fence: both tyres, connected frame/fork, saddle and actual pedals.
    const x0=-3.25,z=-.17,by=.046;
    const bikeAdd=(g,c,x,y,z,...rest)=>add(g,c,x,y+by,z,...rest);
    const bikeTube=(a,b,...rest)=>tube([a[0],a[1]+by,a[2]],[b[0],b[1]+by,b[2]],...rest);
    for(const x of[-.41,.41]){
      bikeAdd(G.tor(.21,.026,Math.PI*2,6,16),C.brown,x0+x,.27,z);
      bikeAdd(G.tor(.17,.012,Math.PI*2,5,14),'#b9b6a8',x0+x,.27,z);
      for(let a=0;a<Math.PI*2;a+=Math.PI/3)bikeTube([x0+x,.27,z],[x0+x+Math.sin(a)*.17,.27+Math.cos(a)*.17,z],.009,'#b9b6a8',5);
    }
    for(const[a,b]of[[[-.41,.27],[-.11,.55]],[[-.11,.55],[.02,.27]],[[.02,.27],[-.41,.27]],[[.02,.27],[.29,.55]],[[.29,.55],[-.11,.55]],[[.29,.55],[.41,.27]],[[.29,.55],[.26,.71]],[[.26,.71],[.43,.72]]])bikeTube([x0+a[0],a[1],z],[x0+b[0],b[1],z],.024,C.green,6);
    bikeTube([x0-.11,.55,z],[x0-.12,.61,z],.025,C.brown);bikeAdd(G.box(.23,.055,.13,.025),C.brown,x0-.13,.63,z);
    bikeAdd(G.cyl(.067,.067,.045,10),C.wood,x0+.02,.27,z+.015,HP);
    bikeTube([x0+.02,.27,z+.045],[x0+.12,.20,z+.045],.018,C.brown);bikeAdd(G.box(.13,.035,.075,.012),C.brown,x0+.14,.20,z+.045);
    bikeAdd(G.box(.22,.17,.18,.03),C.mint,x0+.43,.66,z);bikeAdd(G.box(.23,.035,.19,.015),C.cream,x0+.43,.755,z);
    // The street has a few paving seams and planter pots instead of a large dark road.
    for(let x=-4.7;x<5;x+=.7)add(G.box(.025,.013,.72,.006),'#d7c6ac',x,.087,.02);
    for(const x of[-4.95,3.0]){add(G.cyl(.14,.105,.21,10),C.wood,x,.185,.18);add(G.cyl(.15,.15,.045,10),C.cream,x,.292,.18);for(let k=0;k<5;k++){const a=k*2.4;add(G.sph(.09,7,5),k%2?C.mint:C.green,x+Math.sin(a)*.08,.37,.18+Math.cos(a)*.08,0,a,0,[1,.75,.8]);add(G.sph(.047,6,4),k%2?C.pink:C.cream,x+Math.sin(a)*.11,.43,.18+Math.cos(a)*.11);}}
  }));
  f.navigationFloor=f.group;
};
export const GPTST_TERRAIN_BUILDERS=B;
export const GPTST_TERRAIN_INFO={
  gpt2_island:{w:10.8,d:10,name:'첫 벚꽃역에서 조금 넓힌 층층 받침',hidden:true},
  gpt2_platformedge:{w:10.6,d:7.5,name:'두 선로와 기존 빛깔의 승강장 끝',hidden:true},
  gpt2_v1bench:{w:2,d:1,name:'첫 역 모습의 .50m 대기 벤치',hidden:true},
  gpt2_farshop:{w:1.9,d:1,name:'선로 건너 작은 벚꽃 찻집',hidden:true},
  gpt2_farstreet:{w:10.3,d:1.15,name:'울타리와 자전거가 놓인 맞은편 꽃길',hidden:true},
};
