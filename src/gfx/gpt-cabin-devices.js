// GPT 오두막 책장 손바퀴 장치를 원본 오두막으로 (②b 10/22 저녁 — 사용자 "원본 유지 + GPT 장치 이식", 54판): 손바퀴 → 책장이 빙글 → 뒤에서 넓은 비밀 서랍.
// 모델은 GPT 작업장(gpt3-g 판다네 통나무 오두막) 빌더 그대로, 색은 ⑥ 들여오기 판(C). 부품 id(cabin-crank …) 그대로.
import * as THREE from 'three';
import { calmAll } from './gpt-calm.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { HG as G, hmc as mc } from './house-props.js';
import { put, grp, starShape } from './kit.js';

const PI = Math.PI, HP = PI / 2;
// (⑥ 10/22 들여오기 — 사용자 "색이 왜 이렇게 누래?": the cabin was one honey hue; pale cream logs, red-brown trim, a true coral red,
// clearer teal / mint / sky, slate for the iron — the wood no longer fills the frame with orange)
const C = { cream: '#fef2e1', wood: '#e7a383', edge: '#a8553a', dark: '#6f4b30',
  leaf: '#6fb85c', mint: '#7fd0c4', teal: '#4fb39a', red: '#e8604c', yellow: '#f2c14e',
  iron: '#7f93b8', rope: '#e8d7b7', stone: '#e8d7b7', soil: '#d6b994', grass: '#9fd27a',
  blue: '#7cc3ea', pale: '#f6e0bf', paper: '#fefde9' };
const B = {};
const box = (a, w, h, d, c, x=0, y=0, z=0, rx=0, ry=0, rz=0, r=.025) => a(G.box(w,h,d,r),c,x,y,z,rx,ry,rz);
const cylinder = (a,r,h,c,x,y,z,rx=0,ry=0,rz=0) => a(G.cyl(r,r,h,12),c,x,y,z,rx,ry,rz);
function groupAt(f,x=0,y=0,z=0) { const g=grp(); put(g,x,y,z); f.add(g); return g; }
function machine(p,id,chain=null,requires=null) { p.gptId=id; p.lockable=false; if(chain)p.gptChain=chain; if(requires)p.gptRequires=requires; return p; }
function looseScenery(f) { f.noSolid=true; f.collideBox=[-.025,-2,-.025,.025,-1,.025]; }
function barkLog(a,x,y,z,len,r=.12,c=C.wood,along='x') {
  const rz=along==='x'?HP:0, rx=along==='z'?HP:0;
  a(G.cyl(r,r,len,10),c,x,y,z,rx,0,rz);
  if(along==='x') for(const s of [-1,1]) { a(G.cyl(r*.83,r*.83,.012,10),C.pale,x+s*(len/2+.007),y,z,0,0,HP); a(G.tor(r*.54,.009,PI*2,4,12),C.edge,x+s*(len/2+.015),y,z,0,HP,0); }
}
function tuft(a,x,y,z,s=1) { for(let i=0;i<3;i++) a(G.box(.035*s,.16*s,.035*s,.01),i%2?C.mint:C.leaf,x+(i-1)*.045*s,y+.06*s,z,0,i*.8,(i-1)*.32); }
function mug(a,x,y,z,c=C.red,s=1) { a(G.cyl(.075*s,.064*s,.13*s,12,true),c,x,y+.065*s,z); a(G.cyl(.062*s,.062*s,.012*s,12),C.dark,x,y+.116*s,z); a(G.tor(.05*s,.016*s,PI*1.6,5,12),c,x+.083*s,y+.072*s,z,0,0,-HP); }
function bottle(a,x,y,z,c=C.blue) { a(G.cyl(.055,.055,.18,10),c,x,y+.09,z); a(G.cyl(.026,.031,.06,10),C.cream,x,y+.21,z); }
function pine(a,tube,x,y,z,s=1) {
  tube([x,y,z],[x+.07*s,y+1.7*s,z-.03*s],.09*s,C.edge,7,.055*s);
  for(let k=0;k<3;k++) a(G.cone((.57-k*.12)*s,(.8-k*.08)*s,9),[C.leaf,'#67e0b6',C.mint][k],x+(k%2?.04:0)*s,y+(1.05+k*.43)*s,z,0,k*.6,0,[1,.82,1]);
  for(const dx of [-.18,.18]) tube([x,y+.04,z],[x+dx*s,y,z+.15*s],.055*s,C.edge,6,.018*s);
}
function flower(a,x,y,z,c=C.red) { cylinder(a,.015,.14,C.leaf,x,y+.07,z); for(let k=0;k<5;k++){const q=k*PI*2/5;a(G.sph(.035,7,5),c,x+Math.sin(q)*.035,y+.15,z+Math.cos(q)*.035,0,0,0,[1,.5,1]);} a(G.sph(.028,7,5),C.yellow,x,y+.16,z); }
function books(a,x,y,z,n=5,s=1) { for(let i=0;i<n;i++){const h=(.22+(i%3)*.035)*s;box(a,.055*s,h,.17*s,[C.red,C.blue,C.cream,C.mint,C.yellow][i%5],x+i*.065*s,y+h/2,z,0,0,i===n-1?-.08:0,.005);} }
function arrow(a,x,y,z,rot=0,c=C.yellow) { box(a,.29,.045,.035,c,x,y,z,0,0,rot); for(const k of [-1,1])box(a,.11,.035,.035,c,x+.13*Math.cos(rot)-k*.035*Math.sin(rot),y+.13*Math.sin(rot)+k*.035*Math.cos(rot),z,0,0,rot+k*.65); }
function spot(f,kind,parent,x,y,z,p,label,scale=.95,maxH=.45) { return f.spot(kind,parent,x,y,z,{part:p,maxH,scale,label}); }
const CABIN_CORAL = '#e77c60';
calmAll(C);   // (원본 오두막 배색에 맞춰 차분하게 — gpt-calm.js)
// Share exact vertices with identical normals and colours. This keeps all log
// rings and rounded edges while cutting the shell from 77,988 to under 17,000 vertices.
const cabinIndexed = new WeakMap();
function cabinMesh(key,build) {
  const m=mc(key,build);
  let g=cabinIndexed.get(m.geometry);
  if(!g){g=mergeVertices(m.geometry,1e-5);cabinIndexed.set(m.geometry,g);}
  m.geometry=g;return m;
}

B.gptcabin_secret=(f,T,o={})=>{
  if(o.gptStage===59)f.gptAuxiliary=true;
  f.add(cabinMesh('gptcabin-secret-body-v5',({add:a,tube})=>{
    box(a,1.47,.07,.82,C.edge,0,.035,-.06);box(a,1.47,1.92,.065,C.edge,0,1.025,-.44);
    for(const x of [-.7,.7])box(a,.07,1.92,.79,C.wood,x,1.025,-.06);
    box(a,1.47,.07,.79,C.wood,0,2.0,-.06);box(a,1.31,.055,.64,C.wood,0,1.22,-.09);
    books(a,-.4,1.26,-.25,4,1.2);mug(a,.38,1.255,-.24,CABIN_CORAL,1);
    box(a,.26,.57,.3,C.teal,-.91,.42,.34);tube([-.89,.66,.34],[-.72,.75,.34],.025,C.iron,6);
    arrow(a,-.92,.39,.497,0,C.yellow);
  }));
  const crank=groupAt(f,-.92,.66,.51);crank.add(cabinMesh('gptcabin-secret-crank-v3',({add:a})=>{a(G.tor(.18,.028,PI*2,5,18),C.yellow,0,0,0);for(let k=0;k<3;k++)box(a,.32,.03,.04,C.wood,0,0,0,0,0,k*PI/3);cylinder(a,.035,.15,CABIN_CORAL,.17,0,.06,HP);}));
  const socket=groupAt(f,-.92,.66,.48);socket.add(cabinMesh('gptcabin-empty-socket-v1',({add:a})=>{a(G.tor(.07,.021,PI*2,5,14),C.iron,0,0,0);cylinder(a,.039,.018,C.dark,0,0,-.015,HP);}));
  const A=machine(f.part('wheel',[crank,socket],t=>{crank.rotation.z=-t*PI*2.5;},{label:'책장 손바퀴',sfx:'gearUp',dur:.85}),'cabin-crank',['cabin-bookcase','cabin-hidden-drawer']);
  const shelf=groupAt(f,-.68,.08,.37);shelf.add(cabinMesh('gptcabin-bookcase-v5',({add:a})=>{
    box(a,1.29,1.84,.05,C.mint,.645,.92,-.15);
    for(const x of [0,1.29])box(a,.065,1.89,.3,C.wood,x,.945,0);
    for(const y of [.025,.62,1.25,1.87])box(a,1.35,.06,.3,C.wood,.645,y,0);
    books(a,.11,.65,0,8,1.25);books(a,.15,.06,0,5,1.12);books(a,.7,1.28,0,5,1.0);
    box(a,.27,.18,.23,CABIN_CORAL,1.08,.15,.015);box(a,.27,.025,.24,C.yellow,1.08,.26,.015);cylinder(a,.045,.025,C.cream,1.08,.18,.145,HP);
  }));
  const Bp=machine(f.part('door',shelf,t=>{shelf.rotation.y=-t*1.8;},{label:'빙글 도는 책장',sfx:'creak',dur:1.1}),'cabin-bookcase',null,'cabin-crank');
  const drawer=groupAt(f,0,.19,-.03);drawer.add(cabinMesh('gptcabin-hidden-drawer-v3',({add:a})=>{
    box(a,1.24,.055,.63,C.wood,0,.025,0);box(a,1.24,.36,.06,C.teal,0,.18,.31);
    for(const x of [-.59,.59])box(a,.055,.3,.58,C.wood,x,.17,0);box(a,1.17,.3,.045,C.wood,0,.17,-.29);
    box(a,.26,.055,.065,C.yellow,0,.21,.375);box(a,1.09,.025,.5,C.cream,0,.064,0);
  }));
  drawer.add(cabinMesh('gptcabin-snack-payoff-v3',({add:a})=>{
    // The funny discovery is an absurdly well hidden midnight snack, not a new animal.
    for(let i=0;i<3;i++){box(a,.31,.045,.25,[C.teal,C.wood,CABIN_CORAL][i],-.35,.105+i*.05,-.035,0,(i%2?-.12:.1),0,.008);box(a,.28,.021,.23,C.paper,-.35,.106+i*.05,-.035,0,(i%2?-.12:.1),0,.004);}
    cylinder(a,.13,.018,C.cream,-.35,.246,-.035);mug(a,-.35,.255,-.035,C.yellow,.7);
    cylinder(a,.046,.018,C.wood,-.48,.264,.1);for(const x of [-.5,-.46])a(G.sph(.006,6,4),C.dark,x,.276,.1);
  }));
  const D=machine(f.part('drawer',drawer,(t,b)=>{drawer.position.z=b.p.z+t*.92;},{label:'책장 뒤 넓은 비밀 서랍',sfx:'drawer',dur:.65}),'cabin-hidden-drawer',null,'cabin-crank');
  D.gptReaction='열쇠보다 야식을 더 꼭꼭 숨겼네!';
  spot(f,'inside',drawer,.28,.095,.02,D,'책장 뒤 비밀 서랍',1.1,.45);
  spot(f,'inside',null,.35,1.27,-.1,Bp,'회전 책장 뒤 선반',.9,.38);
  A.handle=crank;f.gptChainStart=A;if(o.gptStage===59)A.gptAuxiliary=true;
};

export const GPT_CABIN_DEVICE_BUILDERS = B;
export const GPT_CABIN_DEVICE_INFO = { gptcabin_secret: { w: 2, d: 2, name: '책장 비밀 서랍 연쇄 장치', hidden: true } };
