// (⑥ 10/22 밤 배색 — 사용자 "채도만 높여 놓고 조화롭지도 이쁘지도 않음": 색마다 GPT 원색의 밝기는 그대로 두고 색상은 이 맵 배색 꿀빛 나무·민트·하늘·코랄(+잎 초록)으로,
// 옅은 큰 면은 부드럽게, 아주 진한 빨강·금빛 노랑만 작은 포인트로)
// Daytime park additions. Original furniture is kept under its original key.
// Medium-size physical mechanisms, open cavities, and proper independent part pivots.
import * as THREE from 'three';
import { tor, put, mesh, mat, geo } from './kit.js';
import { box, ball, cylinder, rod, group, hollow, label, mechanism, phase, C } from './gpt-play-kit.js';

const B = {}, PI = Math.PI, HP = PI / 2;
// LOOK: warm cream/wood dominate, with readable teal, friendly blue and coral paint.
const P = { cream:'#f1e6da', white:'#f6f0e9', sand:'#eaceb5', honey:'#e6c7ab', wood:'#b3743d', teal:'#6ec4ae', blue:'#71a7d6', navy:'#6cb653', red:'#e67065', coral:'#ea8980', gold:'#f0c74b', grass:'#9ad287', leaf:'#6ec4ae', dark:'#774d28', steel:'#eaceb5' };
const ring=(g,r,t,color,x,y,z,rx=0,ry=0)=>{const m=put(tor(r,t,color,null,PI*2,5,18),x,y,z);m.rotation.set(rx,ry,0);g.add(m);return m;};
const axisDisc=(g,r,h,color,x,y,z)=>{const m=cylinder(g,r,r,h,color,x,y,z,16);m.rotation.x=HP;return m;};
const knob=(g,x,y,z,c=P.red)=>{rod(g,[x,y,z],[x,y,z+.15],.035,P.steel);ball(g,.085,c,x,y,z+.19);};
const slatFace=(g,w,h,z,c,y0=0)=>{for(let y=.10;y<h;y+=.16)box(g,w,.045,.025,c,0,y0+y,z,.01);};
const groundOnly=f=>{f.collideBox=[-4.3,-.35,-3.6,4.3,-.025,3.6];};
function stool(g,x,z,c=P.teal){cylinder(g,.21,.23,.1,c,x,.47,z);for(const [sx,sz]of[[-1,-1],[-1,1],[1,-1],[1,1]])rod(g,[x+sx*.13,.44,z+sz*.13],[x+sx*.19,.02,z+sz*.19],.035,P.wood);}
function trophy(g,x,y,z,scale=1){const t=group(g,x,y,z);t.scale.setScalar(scale);box(t,.3,.08,.24,P.navy,0,.04,0,.02);cylinder(t,.06,.09,.19,P.gold,0,.17,0);cylinder(t,.21,.12,.24,P.gold,0,.38,0);for(const sx of[-1,1]){const h=ring(t,.11,.025,P.gold,sx*.19,.39,0);h.scale.x=.8;}cylinder(t,.16,.16,.025,'#a56b38',0,.507,0);return t;}
function flower(g,x,y,z,c=P.gold){rod(g,[x,.05,z],[x,y,z],.025,P.leaf);for(let k=0;k<6;k++){const a=k*PI/3;const m=ball(g,.10,c,x+Math.cos(a)*.13,y+Math.sin(a)*.13,z);m.scale.z=.45;}axisDisc(g,.085,.05,P.wood,x,y,z+.02);}
function flags(g,x0,x1,y,z){rod(g,[x0,y,z],[x1,y,z],.015,P.wood);for(let k=0;k<8;k++){const x=x0+(x1-x0)*(k+.5)/8;const s=new THREE.Shape();s.moveTo(-.13,0);s.lineTo(.13,0);s.lineTo(0,-.25);s.closePath();const m=mesh(geo('gpt-pennant',()=>new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false})),mat([P.red,P.gold,P.teal][k%3]));m.position.set(x,y-.02,z);g.add(m);}}
function drawerBox(g,w,h,d,c,x=0,y=0,z=0){const q=hollow(g,w,h,d,c,x,y,z,.055);box(q,w,h,.055,c,0,h/2,(d-.055)/2);return q;}

// 43: an actual athletics court, not the same slide/swing set for another stage.
B.gptcontestterrain=f=>{
  groundOnly(f);
  box(f,7.85,.055,5.95,'#a3d483',0,.025,0,.14);
  box(f,7.60,.025,2.0,'#eeb39a',0,.065,1.72,.13);
  for(const z of[.92,1.43,1.94,2.45])box(f,7.4,.012,.035,P.cream,0,.085,z,.006);
  for(let k=0;k<10;k++)box(f,.15,.014,1.62,k%2?P.cream:P.navy,2.85+k*.10,.089,1.69,.004);
  for(let k=0;k<3;k++){const l=label(f,String(k+1),.34,.24,-3.45,.096,1.16+k*.52,{bg:P.sand,fg:P.dark});l.rotation.x=-HP;}
  // A brick retaining edge with a low spectator rail, enough neighbouring context without a tall room wall.
  box(f,8.25,.30,.38,P.honey,0,.15,-3.16,.05);
  box(f,8.36,.10,.47,P.cream,0,.35,-3.16,.035);
  for(let k=0;k<17;k++)box(f,.025,.19,.014,'#d57562',-3.94+k*.49,.14,-2.958,.004);
  for(let k=0;k<9;k++){box(f,.07,.73,.07,P.wood,-3.9+k*.975,.75,-3.26,.015);ball(f,.06,P.gold,-3.9+k*.975,1.14,-3.26);}
  for(const y of[.61,.95])box(f,7.9,.055,.055,P.wood,0,y,-3.26,.012);
  for(const x of[-3.7,3.7]){box(f,.10,2.15,.10,P.wood,x,1.075,-2.94,.025);box(f,.32,.08,.32,P.cream,x,.04,-2.94,.025);}
  flags(f,-3.7,3.7,2.06,-2.94);
  for(const [x,z]of[[-3.58,.90],[3.65,-2.62]]){cylinder(f,.24,.3,.35,P.red,x,.175,z);cylinder(f,.21,.21,.025,P.wood,x,.35,z);for(let k=0;k<4;k++)flower(f,x+(k%2)*.18-.09,.72+(k%2)*.08,z+Math.floor(k/2)*.14-.07);}
  f.spot('on',null,-3.20,.09,2.48,{maxH:.85,label:'1번 달리기 레인',scale:1.15});
  f.spot('on',null,3.3,.09,.90,{maxH:.85,label:'결승선 옆',scale:1.15});
  f.spot('on',null,-.40,.09,2.45,{maxH:.85,label:'두 번째 레인의 준비물',scale:1.15});
  f.spot('on',null,1.30,.09,2.48,{maxH:.85,label:'결승선 안쪽 준비물',scale:1.15});
  f.spot('on',null,-.10,.065,.26,{maxH:.85,label:'시상대 앞 대기 자리',scale:1.15});
  f.spot('on',null,-1.90,.09,2.47,{maxH:.85,label:'대회 레인 중간 준비물',scale:1.15});
  f.spot('on',null,1.05,.09,1.25,{maxH:.85,label:'심판석 앞 달리기 레인',scale:1.15});
};

// Winners' podium, three physical levels. The middle dais is hollow; a crank raises its shutter.
B.gptcontestpodium=f=>{
  // The thin linkage cord reaches the neighbour; collision tests use the actual podium body, not its cord's huge AABB.
  f.collideBox=[-1.62,0,-.93,1.62,2.75,1.34];
  f.gptWalkBox=[-1.62,0,-.93,1.62,2.75,1.34];
  box(f,3.10,.14,1.64,P.wood,0,.07,0,.06);box(f,3.22,.07,1.76,P.honey,0,.175,0,.045);
  for(const [x,h,n,c]of[[-1.03,.50,'2',P.teal],[1.03,.32,'3',P.coral]]){box(f,.90,h,1.10,c,x,.21+h/2,0,.06);box(f,.98,.10,1.18,P.cream,x,.26+h,0,.04);label(f,n,.40,.30,x,.23+h/2,.565,{bg:c,fg:P.dark});}
  const cab=hollow(f,1.18,1.10,1.12,P.blue,0,.21,0,.09);box(cab,1.18,.10,1.12,P.cream,0,1.05,0,.035);box(cab,1.0,.055,.94,P.honey,0,.11,0,.018);
  const shutter=group(f,0,.29,.63);box(shutter,1.02,.92,.075,P.blue,0,.46,0,.028);slatFace(shutter,.98,.91,.047,'#4587c0');label(shutter,'1',.38,.32,0,.47,.05,{bg:P.blue,fg:P.dark});box(shutter,.22,.05,.09,P.gold,0,.12,.07,.015);
  // 5장's hero marble run: a real sloping slide, return gutter, funnel and lower bell chute.
  // Each U section has a floor and thick raised lips, not a painted line pretending to be a track.
  const path=[[1.15,2.50,-.53],[-1.10,2.04,-.53],[-1.10,1.88,.12],[.93,1.54,.12],[.93,1.24,.12],[.38,1.04,.76]];
  function trough(a,b,w=.32){const A=new THREE.Vector3(...a),E=new THREE.Vector3(...b),v=E.clone().sub(A),len=v.length(),mid=A.clone().add(E).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),v.clone().normalize());const g=group(f,...mid.toArray());g.quaternion.copy(q);box(g,len,.075,w,P.cream,0,0,0,.025);for(const z of[-w/2,w/2])box(g,len,.15,.055,P.honey,0,.075,z,.022);}
  trough(path[0],path[1],.44);trough(path[1],path[2],.44);trough(path[2],path[3],.44);trough(path[4],path[5],.42);
  for(const [x,y,z]of[[1.15,2.50,-.53],[-1.10,2.04,-.53],[-1.10,1.88,.12],[.93,1.54,.12]]){const base=x<0?.82:.64;box(f,.09,y-base,.09,P.wood,x,(y+base)/2,z,.018);ball(f,.07,P.gold,x,y+.16,z);}
  // An open truncated cone funnel has a visible throat the marble actually passes through.
  const funnel=mesh(geo('gpt-contest-funnel',()=>new THREE.CylinderGeometry(.32,.20,.30,18,1,true)),mat(P.teal,{side:THREE.DoubleSide}));funnel.position.set(.93,1.39,.12);f.add(funnel);ring(f,.32,.035,P.wood,.93,1.54,.12,HP);ring(f,.20,.025,P.wood,.93,1.24,.12,HP);
  const socket=group(f,1.15,2.58,-.53);ring(socket,.19,.035,P.teal,0,.02,0,HP);box(socket,.35,.17,.08,P.teal,0,.06,-.15,.025);label(socket,'구슬',.30,.15,0,.07,-.102,{bg:P.teal,fg:P.dark});
  const release=group(f,1.15,2.54,-.53);box(release,.055,.18,.34,P.red,-.19,.10,0,.02);knob(release,-.19,.17,.10,P.gold);
  const marble=group(f,1.15,2.70,-.53);ball(marble,.17,P.blue);const stripe=ring(marble,.174,.025,P.cream,0,0,0);stripe.rotation.y=.6;
  // Character mount only: the scene attaches the game's original Char('frog') after furniture baking.
  // Its measured .582m body stands on a real .60m stool, with the existing bell resting as its hat.
  box(f,.44,.54,.42,P.wood,.20,.27,1.05,.04);box(f,.76,.12,.58,P.cream,.20,.54,1.05,.045);
  const frog=group(f,.20,.60,1.05);frog.name='gpt-existing-frog-mount';
  f.gptCharacter={kind:'frog',parent:frog,position:[0,0,0],idle:false};
  const bell=group(f,.20,1.30,1.05);cylinder(bell,.16,.25,.24,P.gold,0,0,0,16);cylinder(bell,.26,.26,.045,P.gold,0,-.13,0);ball(bell,.045,P.wood,0,-.17,0);rod(f,[.20,1.45,1.05],[.20,1.67,1.05],.03,P.wood);
  const trip=group(f,-1.44,1.51,.55);axisDisc(trip,.13,.07,P.wood,0,0,0);rod(f,[-1.44,1.51,.55],[-2.20,2.08,-.40],.023,P.wood);
  const travel=(t)=>{const segs=[0,.32,.45,.72,.82,1];let k=0;while(k<4&&t>segs[k+1])k++;const u=phase(t,segs[k],segs[k+1]),a=path[k],b=path[k+1];return a.map((n,j)=>n+(b[j]-n)*u);};
  const p=mechanism(f,'wheel',[release,marble,frog,bell,trip,socket],t=>{release.rotation.z=-phase(t,0,.08)*1.2;const r=phase(t,.06,.78),pt=travel(r);marble.visible=t>.001;marble.position.set(pt[0],pt[1]+.19,pt[2]);marble.rotation.z=-r*PI*8;const hit=phase(t,.76,.91);bell.rotation.z=Math.sin(hit*PI*3)*.30*(1-hit);frog.rotation.z=Math.sin(hit*PI*3)*.06*(1-hit);trip.rotation.z=-phase(t,.84,1)*PI*2;},{label:'대회 구슬 길',sfx:'clink',dur:3.1,chain:['구슬을 미끄럼틀에 놓는다','구슬이 되돌이 홈통을 데굴데굴','깔때기에서 마지막 길로 쏙','개굴 종이 울리고 시상대 바구니가 움직인다']});
  p.handle=socket;p.gptPrimary=true;p.gptTool='gptmarble';p.gptLinkFurniture='loftpulley';p.gptLinkAt=.84;p.gptFunny='띵! 종이 내 모자였어, 개굴!';p.gptWrong='빈 구슬 자리가 달그락!';p.gptTell='깔때기 아래에서 개굴…';p.gptFinish='fanfare';p.gptPhases=[{at:.06,sfx:'clink'},{at:.32,sfx:'clink'},{at:.56,sfx:'clink'},{at:.76,sfx:'doorBell'},{at:.84,sfx:'ratchet'},{at:.98,sfx:'cheer'}];
  // The podium's real hiding compartment is an independent auxiliary, rather than another puzzle gate.
  const sp=mechanism(f,'door',shutter,t=>{shutter.position.y=.29+t*.92;},{label:'시상대 수납 덧문',sfx:'slide',dur:.65});
  f.spot('inside',cab,0,.19,.10,{part:sp,maxH:.73,label:'1등 시상대의 비밀칸',scale:1.1});
  f.spot('on',null,-1.02,.84,.27,{maxH:.75,label:'2등 시상대 위',scale:1.05});
};

B.gptprizebox=f=>{
  // Hollow prize chest: the lid never covers a solid grey shelf.
  const q=hollow(f,1.12,.94,.78,P.honey,0,.12,0,.075);
  box(q,.97,.07,.63,P.cream,0,.11,0,.025);
  for(const x of[-.40,.40])box(q,.07,.90,.78,P.gold,x,.47,0,.015);
  for(const x of[-.45,.45])for(const z of[-.25,.25])box(f,.10,.14,.10,P.wood,x,.07,z,.02);
  const lid=group(f,0,1.06,-.39);box(lid,1.16,.14,.82,P.honey,0,.07,.41,.06);
  for(const x of[-.40,.40])box(lid,.07,.145,.83,P.gold,x,.07,.41,.015);
  label(lid,'상품',.56,.16,0,.055,.831,{bg:P.honey,fg:P.dark});
  const p=mechanism(f,'lid',lid,t=>{lid.rotation.x=-t*1.55;},{label:'우승 상품 상자',sfx:'creak',dur:.6});p.lockable=true;p.lockKind='code';
  f.lockAt={x:0,y:.88,z:.423};
  f.spot('inside',q,0,.18,.05,{part:p,maxH:.72,label:'상품 상자 안',scale:1.1});
};

B.gpttimingpost=f=>{
  f.gptWalkBox=[-.48,0,-.35,.48,1.1,.55]; // The enlarged overhead dial is not a new wall across the floor.
  box(f,.80,.12,.70,P.cream,0,.06,0,.07);
  const cab=hollow(f,.67,.78,.47,P.navy,0,.12,0,.06);box(cab,.67,.055,.47,P.cream,0,.78,0,.02);
  box(cab,.55,.04,.34,P.honey,0,.29,.01,.012);
  cylinder(cab,.07,.07,.18,P.red,-.14,.42,0);box(cab,.15,.05,.17,P.gold,.14,.35,0,.015);
  const door=group(f,-.335,.15,.25);box(door,.67,.70,.055,P.teal,.335,.35,0,.025);knob(door,.53,.35,.025,P.gold);label(door,'기록',.40,.20,.31,.44,.034,{bg:P.teal,fg:P.white});
  // The real observation dial, case and shutters share a 35% larger head facing the default camera.
  const clock=group(f,0,2.05,-.03);clock.rotation.y=PI/8;clock.scale.setScalar(1.35);
  const clockL=group(clock,-.44,0,.23),clockR=group(clock,.44,0,.23);
  box(clockL,.44,.86,.055,P.cream,.22,0,0,.035);box(clockR,.44,.86,.055,P.cream,-.22,0,0,.035);
  label(clockL,'?',.23,.34,.22,0,.036,{bg:P.cream,fg:P.wood});label(clockR,'?',.23,.34,-.22,0,.036,{bg:P.cream,fg:P.wood});
  const p=mechanism(f,'door',[door,clockL,clockR],t=>{door.rotation.y=-t*1.65;clockL.rotation.y=-t*1.8;clockR.rotation.y=t*1.8;},{label:'경기 기록함과 시계 덧문',sfx:'door',dur:.7});
  p.handle=door;p.gptClueReveal=true;p.gptFunny='기록은 비밀이 아니었네!';
  f.spot('inside',cab,.05,.35,.07,{part:p,maxH:.30,label:'기록함 선반',scale:.95});
  box(f,.14,1.30,.14,P.wood,0,1.53,-.06,.025);
  axisDisc(clock,.48,.13,P.navy,0,0,0);axisDisc(clock,.405,.022,P.white,0,0,.082);
  for(let k=0;k<12;k++){const a=k*PI/6;rod(clock,[Math.sin(a)*.33,Math.cos(a)*.33,.105],[Math.sin(a)*.37,Math.cos(a)*.37,.105],.012,P.navy);}
  rod(clock,[0,0,.112],[.22,.13,.112],.021,P.navy);rod(clock,[0,0,.12],[0,-.32,.12],.013,P.red);ball(clock,.035,P.gold,0,0,.13);
  f.gptClockMount={parent:clock,x:0,y:0,z:.15,radius:.38};
  box(clock,.84,.10,.12,P.gold,0,.61,-.01,.035);label(clock,'대회 기록',.72,.19,0,.64,.064,{bg:P.gold,fg:P.dark});
};

B.gptstarterbarrier=f=>{
  for(const x of[-1.04,1.04]){box(f,.34,.11,.50,P.cream,x,.055,0,.045);box(f,.10,.85,.10,P.teal,x,.53,0,.025);ball(f,.10,P.gold,x,.99,0);}
  const gate=group(f,-1.04,.77,.02);box(gate,2.08,.17,.10,P.white,1.04,0,0,.025);
  for(let k=0;k<10;k++)box(gate,.115,.18,.115,k%2?P.red:P.white,.13+k*.20,0,0,.01);
  const handle=group(f,-1.04,.55,.12);rod(handle,[0,0,0],[0,.27,.08],.035,P.steel);ball(handle,.095,P.red,0,.31,.09);
  const bell=group(f,-1.04,1.21,0);cylinder(bell,.13,.20,.23,P.gold,0,0,0);cylinder(bell,.21,.21,.04,P.gold,0,-.13,0);ball(bell,.04,P.wood,0,-.16,0);
  rod(f,[-1.04,.99,0],[-1.04,1.42,0],.026,P.wood);
  // The start lever also operates the oversized play-water cannon.
  const cannon=group(f,1.04,1.03,0);const barrel=cylinder(cannon,.11,.14,.53,P.coral,0,.08,.18);barrel.rotation.x=HP;axisDisc(cannon,.105,.045,P.wood,0,.08,.46);rod(f,[1.04,.33,0],[1.04,.78,0],.065,P.teal);
  const jet=group(f,1.04,1.11,.50);const j=cylinder(jet,.045,.055,1,P.blue,0,0,.50,10);j.rotation.x=HP;jet.scale.z=.015;
  const p=mechanism(f,'lever',[handle,gate,bell,jet],t=>{handle.rotation.x=t*1.0;gate.rotation.z=phase(t,.20,.80)*HP;bell.rotation.z=Math.sin(t*PI*6)*.24*(1-t);jet.scale.z=.015+phase(t,.10,.65)*.92;},{label:'물총 레버와 출발 차단봉',sfx:'waterLap',dur:1.1,chain:['물총 레버','물이 쭈욱 나온다','출발 차단봉도 올라간다']});
  f.spot('behind',null,.76,.10,-.23,{maxH:.35,label:'출발 기둥 뒤',scale:.95});
  f.gptLever=p;
};

B.gptofficialbench=f=>{
  const q=hollow(f,2.05,.30,.70,P.honey,0,.12,0,.07);
  for(const x of[-.83,.83])for(const z of[-.22,.22])box(f,.10,.15,.10,P.wood,x,.075,z,.015);
  box(q,1.89,.055,.55,P.wood,0,.07,0,.015);box(q,.07,.24,.58,P.wood,.20,.15,0,.015);
  box(q,.58,.10,.35,P.white,-.65,.14,-.05,.04);box(q,.58,.06,.35,P.teal,-.65,.22,-.05,.025);
  const lid=group(f,0,.42,-.27);lid.name='gpt-bench-seat';for(let k=0;k<4;k++)box(lid,2.13,.08,.17,P.honey,0,.04,.09+k*.18,.02);
  const p=mechanism(f,'lid',lid,t=>{lid.rotation.x=-t*1.35;},{label:'심판 벤치 수납칸',sfx:'creak',dur:.6});
  f.spot('inside',q,-.10,.10,.08,{part:p,maxH:.20,label:'벤치 속 수건 옆',scale:1.0});
  // Independently sliding clipboard drawer, physically below the seat and beside the towels.
  const d=drawerBox(f,.58,.16,.53,P.teal,.60,.20,-.01);d.scale.set(1.18,1.18,1.10);
  const drawerGrip=group(d,0,.11,.38);for(const x of[-.10,.10])rod(drawerGrip,[x,0,-.09],[x,0,.015],.025,P.wood);box(drawerGrip,.28,.10,.10,P.gold,0,0,.035,.035);
  const dp=mechanism(f,'drawer',[d,drawerGrip],(t,b)=>{d.position.z=b.p.z+t*.46;},{label:'경기표 서랍',sfx:'drawer',dur:.45});dp.handle=drawerGrip;
  f.spot('inside',d,0,.055,-.03,{part:dp,maxH:.10,label:'경기표 서랍 안',scale:.85});
  // Backrest and the everyday details keep it a bench, rather than an unexplained box.
  for(const x of[-.88,.88])box(f,.07,.69,.07,P.wood,x,.72,-.32,.015);
  for(let k=0;k<3;k++)box(f,2.05,.12,.07,P.honey,0,.65+k*.15,-.32,.02);
  label(f,'운영석',.56,.20,0,1.0,-.275,{bg:P.honey,fg:P.dark});
  const score=group(f,0,1.46,-.32);box(score,1.40,.57,.09,P.teal,0,0,0,.05);label(score,'1 : 2 : 3',1.22,.38,0,0,.055,{bg:P.teal,fg:P.dark});label(score,'시계를 봐!',1.22,.38,0,0,-.055,{bg:P.cream,fg:P.dark,ry:PI});
  for(const x of[-.66,.66])rod(f,[x,1.05,-.32],[x,1.46,-.32],.03,P.wood);
  const sc=mechanism(f,'picture',score,t=>{score.rotation.y=t*PI;},{label:'뒤집는 대회 점수판',sfx:'flip',dur:.65});sc.gptClueReveal=true;sc.gptFunny='점수보다 시간이 중요하네!';
};

B.gptcontestswing=f=>{
  // One small freestanding swing, deliberately distinct from the old tall apartment set.
  const g=group(f,0,0,.22);f.gptWalkBox=[-.80,0,-.35,.80,1.93,.79];
  // The map raises this swing to the .080m track; its right feet land on the .053m main surface, .027m lower.
  for(const x of[-.69,.69]){rod(g,[x,0,-.46],[x,1.87,0],.065,P.wood);rod(g,[x,0,.46],[x,1.87,0],.065,P.wood);for(const z of[-.46,.46])box(g,.22,x>0?.127:.10,.22,P.cream,x,x>0?.0365:.05,z,.035).name=x>0?'gpt-swing-foot-right':'gpt-swing-foot-left';}
  box(g,1.60,.14,.14,P.honey,0,1.86,0,.035);
  const seat=group(g,0,1.80,0);for(const x of[-.27,.27])rod(seat,[x,0,0],[x,-1.36,0],.028,P.wood);box(seat,.72,.12,.40,P.teal,0,-1.38,0,.05).name='gpt-swing-seat';box(seat,.72,.18,.065,P.teal,0,-1.24,-.18,.025);
  const pushBar=group(seat,0,-1.18,.25);box(pushBar,.64,.10,.10,P.gold,0,0,0,.035);for(const x of[-.29,.29])rod(pushBar,[x,0,0],[x,-.18,-.05],.028,P.wood);
  const p=mechanism(f,'curtain',[seat,pushBar],t=>{seat.rotation.x=Math.sin(t*PI*1.5)*.36;},{label:'대회장 작은 그네',sfx:'creak',dur:1.15});p.handle=pushBar;p.gptFunny='한 번 더 밀어 줘!';
  f.spot('on',seat,0,-1.31,.02,{part:p,maxH:.65,label:'작은 그네 의자',scale:1.0});
};

// 44: sunny sand garden, soft contours and terraced height instead of a second athletics court.
B.gpthamsterterrain=f=>{
  groundOnly(f);
  // (44판 사용자 10/22 '채택 — 채색·텍스처 디테일 약간 더': no ground slab of its own — the map's grass floor, with its tufts, shows;
  // the sand path, its stepping stones and the spots sit on the grass now, with pebbles on the path and little flowers at the edges)
  box(f,7.3,.025,1.0,'#f3dcc0',0,.014,2.39,.27);
  for(const [x,z,c] of [[-2.6,2.22,'#d8c7b6'],[-1.15,2.62,'#cfc4da'],[.75,2.2,'#d8c7b6'],[2.05,2.6,'#e3cfc4'],[3.05,2.28,'#cfc4da']]){const m=ball(f,.06,c,x,.03,z);m.scale.set(1.3,.45,1);}
  for(const [x,z,c] of [[-1.4,-2.78,'#f3a6b8'],[1.0,-2.72,'#fdf8f2'],[3.95,.9,'#f6d36b'],[-3.95,.4,'#f3a6b8'],[2.45,3.2,'#fdf8f2']]){ball(f,.07,'#7fbf62',x,.03,z);for(let k=0;k<3;k++)ball(f,.045,c,x+Math.cos(k*2.1)*.07,.075,z+Math.sin(k*2.1)*.07);}
  for(let k=0;k<9;k++){const m=box(f,.57,.045,.40,k%2?P.cream:P.honey,-.15+Math.sin(k*.5)*.2,.035,1.94-k*.52,.12);m.rotation.y=Math.sin(k)*.18;}
  box(f,8.16,.32,.42,'#cf915b',0,.16,-3.18,.055);box(f,8.28,.08,.48,P.cream,0,.36,-3.18,.035);
  for(let k=0;k<20;k++){const x=-3.9+k*.41;box(f,.18,.66,.08,P.cream,x,.72,-3.24,.06);ball(f,.09,P.cream,x,1.06,-3.24);}
  for(const y of[.57,.86])box(f,8.04,.065,.09,P.cream,0,y,-3.30,.015);
  for(const [x,z]of[[-3.76,2.38],[3.40,-2.80],[3.65,2.45]]){box(f,.74,.27,.56,P.honey,x,.145,z,.08);cylinder(f,.26,.26,.025,P.wood,x,.29,z);for(let k=0;k<3;k++)flower(f,x-.19+k*.19,.72+(k%2)*.17,z,P.gold);}
  f.spot('on',null,1.00,.01,.88,{maxH:.85,label:'언덕 앞 소풍길',scale:1.15});
  f.spot('on',null,-2.85,.03,2.45,{maxH:.85,label:'모래 정원 앞 준비물',scale:1.15});
  f.spot('on',null,-3.36,.01,1.55,{maxH:.85,label:'모래밭 옆 마른 길',scale:1.15});
  f.spot('on',null,-.10,.06,.90,{maxH:.85,label:'가운데 징검다리',scale:1.15});
  f.spot('on',null,-.10,.012,3.15,{maxH:.85,label:'소풍길 앞 빈 자리',scale:1.15});
};

// A small climbing hill, carefully constructed around a genuine lower alcove.
B.gptsandhill=f=>{
  const g=f.group;f.noSolid=true; // Authored height-aware solids below replace the single scenery AABB.
  // Side wings + back + roof make the hill's open cave. There is no solid box behind its shutter.
  box(g,.73,.95,2.15,P.sand,-.965,.475,-.12,.22);box(g,1.0,.95,2.15,P.sand,1.10,.475,-.12,.22);
  box(g,1.25,.95,.38,P.sand,0,.475,-1.01,.15);box(g,2.93,.30,2.15,P.grass,.135,1.09,-.12,.19);
  // Front alcove trim, cream-lined interior, straw mat and recess shelf.
  box(g,1.16,.055,1.48,P.wood,0,.055,-.15,.025);box(g,1.15,.68,.055,P.cream,0,.42,-.80,.02);
  box(g,1.08,.06,.33,P.honey,0,.29,-.60,.015);box(g,.74,.04,.61,'#ddb088',0,.11,.00,.06);
  for(let k=0;k<6;k++)box(g,.72,.011,.015,'#d29763',0,.137,-.24+k*.09,.004);
  for(const x of[-.57,.57])box(g,.12,.93,.15,P.wood,x,.515,.84,.035);box(g,1.30,.12,.18,P.honey,0,1.01,.84,.035);
  const shutter=group(g,0,.10,1.04);for(let k=0;k<7;k++)box(shutter,1.02,.115,.075,P.teal,0,.065+k*.126,0,.018);box(shutter,.24,.06,.10,P.gold,0,.17,.07,.02);
  // Upper terrace and an observation deck on four sturdy poles.
  box(g,2.32,.36,1.35,'#9ad287',.18,1.39,-.42,.20);box(g,1.43,.28,.89,P.grass,.33,1.69,-.60,.16);
  const deck=group(g,.33,1.84,-.60);box(deck,1.82,.12,1.36,P.honey,0,.06,0,.05);
  for(const x of[-.77,.77])for(const z of[-.54,.54]){box(deck,.09,.60,.09,P.wood,x,.40,z,.02);ball(deck,.065,P.gold,x,.73,z);const h=z<0?.60:.27;box(deck,.09,h,.09,P.wood,x,-h/2,z,.018);}
  for(const z of[-.54,.54])box(deck,1.59,.08,.08,P.wood,0,.60,z,.018);
  box(deck,.08,.08,1.08,P.wood,.77,.60,0,.018); // left side is the real climbing entrance
  // Six supported treads with .68m clear space between real rails, linked to the outlook by a real horizontal landing.
  for(let k=0;k<6;k++){const y=.19+k*.31;box(g,.80,.18,.38,P.honey,-1.72,y,.85-k*.28,.04);}
  for(const x of[-2.00,-1.44])rod(g,[x,.12,1.03],[x,1.76,-.72],.055,P.wood);
  box(g,.99,.12,.78,P.honey,-1.075,1.90,-.60,.035);
  for(const x of[-2.09,-1.35]){const short=x>-1.7,y=short?1.52:1.83,z=short?-.19:-.55;rod(g,[x,.28,.85],[x,.83,.85],.025,P.wood);rod(g,[x,y,z],[x,y+.55,z],.025,P.wood);rod(g,[x,.83,.85],[x,y+.55,z],.025,P.wood);}
  for(const z of[-.96,-.24]){rod(g,[-1.27,1.96,z],[-1.27,2.51,z],.025,P.wood);rod(g,[-.58,1.96,z],[-.58,2.51,z],.025,P.wood);rod(g,[-1.27,2.51,z],[-.58,2.51,z],.025,P.wood);}
  for(const [x,y,z,c]of[[1.25,.97,.45,P.red],[1.30,1.30,.10,P.gold],[1.0,1.56,-.22,P.blue]]){const m=ball(g,.11,c,x,y,z);m.scale.set(1,.60,1.1);}
  // 44's prescribed chain: the valve feeds a real paddle wheel; its front gears wind a seed-sack hoist.
  const lever=group(g,-1.20,1.11,.73);axisDisc(lever,.11,.08,P.navy,0,0,0);rod(lever,[0,0,.07],[0,.34,.07],.035,P.steel);ball(lever,.105,P.red,0,.39,.07);
  const tank=hollow(g,.72,.30,.52,P.teal,-1.03,1.45,.74,.055);box(tank,.72,.30,.055,P.teal,0,.15,.232,.025);const tankWater=box(tank,.62,.025,.40,'#b7e1d7',0,.23,0,.025);rod(g,[-1.03,1.47,.98],[-1.03,1.47,1.20],.065,P.cream);
  const basin=hollow(g,1.16,.18,.68,P.cream,-.82,.05,1.36,.055);box(basin,1.16,.18,.055,P.cream,0,.09,.312,.025);box(basin,1.04,.025,.54,'#b7e1d7',0,.095,0,.04);
  const wheel=group(g,-.86,.76,1.18);ring(wheel,.40,.045,P.wood,0,0,0);ring(wheel,.40,.045,P.wood,0,0,.16);for(let k=0;k<8;k++){const a=k*PI/4;rod(wheel,[0,0,.08],[Math.cos(a)*.39,Math.sin(a)*.39,.08],.032,P.honey);const paddle=box(wheel,.17,.075,.24,P.teal,Math.cos(a)*.42,Math.sin(a)*.42,.08,.025);paddle.rotation.z=a;}
  function gear(parent,r,n,c){axisDisc(parent,r,.08,c,0,0,0);for(let k=0;k<n;k++){const a=k*PI*2/n;const tooth=box(parent,.09,.07,.09,c,Math.cos(a)*r,Math.sin(a)*r,.01,.012);tooth.rotation.z=a;}axisDisc(parent,.075,.105,P.cream,0,0,.02);}
  const drive=group(g,-.86,.76,1.43);gear(drive,.19,10,P.gold);const cog=group(g,-.35,.85,1.43);gear(cog,.29,12,P.honey);rod(g,[-.86,.76,1.04],[-.86,.76,1.53],.055,P.wood);
  const flow=group(g,-1.03,1.43,1.20);box(flow,.10,1,.10,'#b7e1d7',0,-.50,0,.035);flow.scale.y=.015;
  // A soft cloth silhouette, rolled mouth and a true inner wall make this instantly a sack, rather than a wooden crate.
  const sack=group(g,1.20,.12,1.44),bag=group(sack);
  const cloth=mesh(geo('gpt-hollow-seed-sack',()=>new THREE.LatheGeometry([[0,0],[.32,0],[.42,.09],[.46,.30],[.44,.53],[.415,.68],[.405,.72],[.38,.72],[.385,.66],[.395,.51],[.395,.30],[.35,.13],[0,.13]].map(([r,y])=>new THREE.Vector2(r,y)),20)),mat(P.honey));cloth.scale.z=.78;bag.add(cloth);
  const cuff=ring(bag,.395,.035,P.cream,0,.71,0,HP);cuff.scale.z=.78;
  for(const x of[-.33,.33]){ball(bag,.055,P.cream,x,.69,0);rod(bag,[x,.64,.16],[x*.70,.51,.40],.023,P.wood);}
  // Thick off-white paper, pinned with a ribbon and a lifted corner. The label keeps a 10% edge margin.
  const tag=group(bag,0,.38,.405),paperShape=new THREE.Shape();tag.name='gpt-seed-gift-tag';
  paperShape.moveTo(-.29,-.15);paperShape.lineTo(.29,-.15);paperShape.lineTo(.29,.07);paperShape.lineTo(.21,.15);paperShape.lineTo(-.29,.15);paperShape.closePath();
  tag.add(mesh(geo('gpt-seed-gift-tag',()=>new THREE.ExtrudeGeometry(paperShape,{depth:.025,bevelEnabled:false})),mat(P.white)));
  const foldShape=new THREE.Shape();foldShape.moveTo(0,0);foldShape.lineTo(.08,-.08);foldShape.lineTo(0,-.08);foldShape.closePath();
  const fold=mesh(geo('gpt-seed-tag-fold',()=>new THREE.ExtrudeGeometry(foldShape,{depth:.02,bevelEnabled:false})),mat(P.cream));fold.position.set(.21,.15,.028);fold.rotation.y=-.38;tag.add(fold);
  label(tag,'선물용',.43,.15,-.02,.01,.033,{bg:P.white,fg:P.dark});
  box(tag,.09,.12,.035,P.red,-.20,.15,.036,.012);ball(tag,.025,P.gold,-.20,.12,.063);
  rod(bag,[-.20,.69,.26],[-.20,.54,.441],.02,P.red);
  box(bag,.35,.035,.020,P.red,0,.28,.443,.008);
  for(const x of[-.30,.30])rod(sack,[x,.71,0],[0,.91,-.04],.023,P.wood);
  box(g,.10,2.32,.10,P.wood,1.20,1.16,1.02,.022);box(g,.12,.12,.55,P.wood,1.20,2.27,1.24,.025);ring(g,.12,.025,P.wood,1.20,2.15,1.40);rod(g,[-.35,.85,1.43],[1.20,2.15,1.40],.023,P.wood);
  const rope=group(g,1.20,2.15,1.40);cylinder(rope,.023,.023,1,P.wood,0,-.50,0,6);const setRope=()=>{rope.scale.y=Math.max(.06,2.15-(sack.position.y+.91));};setRope();
  const p=mechanism(f,'lever',[lever,wheel,drive,cog,flow,sack,rope,tankWater],t=>{lever.rotation.z=-phase(t,0,.15)*.9;const wet=phase(t,.10,.28),spin=phase(t,.22,.84),lift=phase(t,.48,1);flow.scale.y=.015+wet*(1-phase(t,.90,1))*.59;flow.visible=t>.10&&t<.999;tankWater.position.y=.23-phase(t,.10,.90)*.16;wheel.rotation.z=-spin*PI*5;drive.rotation.z=-spin*PI*5;cog.rotation.z=spin*PI*3.25;sack.position.y=.12+lift*1.03;sack.rotation.z=Math.sin(lift*PI*3)*.06*(1-lift);setRope();},{label:'씨앗 물레방아 레버',sfx:'latch',dur:3.0,chain:['빨간 레버가 물길을 연다','흐르는 물이 물레방아를 돌린다','맞물린 톱니가 줄을 감는다','선물용 씨앗 자루가 올라온다']});
  p.handle=lever;p.gptPrimary=true;p.gptTool='pulleyhandle';p.gptFunny='비상식량 아니고 선물용이야!';p.gptWrong='물길이 아직 잠겼다!';p.gptTell='씨앗 자루가 바스락…';p.gptFinish='giggle';p.gptPhases=[{at:.10,sfx:'waterLap'},{at:.22,sfx:'gearUp'},{at:.48,sfx:'ratchet'},{at:.98,sfx:'giggle'}];
  f.gptLever=p;p.gptLever=true;p.isLever=true;
  f.spot('inside',bag,0,.11,.02,{part:p,maxH:.65,label:'도르래로 올린 선물용 씨앗 자루 안',scale:1.05});
  // Independent cave shutter preserves the hill's genuine hiding alcove as a familiar auxiliary.
  const cave=mechanism(f,'door',shutter,t=>{shutter.position.y=.10+t*.94;},{label:'언덕 동굴 덧문',sfx:'slide',dur:.7});cave.handle=shutter;
  f.spot('inside',null,0,.15,.12,{part:cave,maxH:.75,label:'언덕 동굴의 밀짚 자리',scale:1.15});
  const outlook=f.spot('on',deck,-.10,.14,-.03,{maxH:1.0,label:'언덕 전망대 위',scale:1.15});outlook.gptWant=.76;
  const sidePath=f.spot('on',null,1.63,.065,2.44,{maxH:.85,label:'언덕 오른쪽 마른 길',scale:1.15});sidePath.gptWant=.66;
};

B.gptsandbox=f=>{
  // Low wide sandpit with properly open scoop bucket, a real buried sliding tray and sand toys.
  box(f,3.02,.13,2.48,P.wood,0,.065,0,.14);box(f,2.80,.06,2.26,P.sand,0,.16,0,.12);
  for(const x of[-1.43,1.43])box(f,.17,.22,2.48,P.honey,x,.19,0,.04);
  for(const z of[-1.14,1.14])box(f,2.88,.22,.17,P.honey,0,.19,z,.04);
  for(const [x,z]of[[-1.40,-1.10],[1.40,-1.10],[-1.40,1.10],[1.40,1.10]]){box(f,.38,.10,.38,P.teal,x,.35,z,.04);}
  // An excavator-style little play scoop, on a round swivel base.
  cylinder(f,.33,.38,.16,P.navy,-.79,.31,-.57,16);
  const arm=group(f,-.79,.43,-.57);rod(arm,[0,0,0],[.42,.65,.08],.07,P.gold);rod(arm,[.42,.65,.08],[.89,.27,.12],.065,P.gold);
  for(const [x,y,z]of[[0,0,0],[.42,.65,.08],[.89,.27,.12]])axisDisc(arm,.095,.18,P.navy,x,y,z);
  const bucket=hollow(arm,.46,.24,.38,P.teal,.90,.03,.19,.055);box(bucket,.46,.16,.055,P.teal,0,.08,.163,.02);for(let k=0;k<4;k++)box(bucket,.055,.10,.13,P.cream,-.16+k*.105,.015,.22,.015);
  const scoop=mechanism(f,'wheel',arm,t=>{arm.rotation.y=-t*1.15;arm.rotation.z=Math.sin(t*PI)*.18;},{label:'모래 굴착 팔',sfx:'creak',dur:1.1});
  f.spot('inside',bucket,0,.08,.02,{part:scoop,maxH:.25,label:'굴착기 버킷 안',scale:.85});
  // Buried treasure tray, with open sides and a moving false sandy floor.
  const recess=hollow(f,1.02,.25,.79,P.wood,.47,.20,.35,.065);
  box(recess,.90,.04,.64,P.cream,0,.10,0,.02);
  const tray=group(f,.47,.46,.35);box(tray,1.08,.07,.85,P.sand,0,.035,0,.045);box(tray,.24,.06,.11,P.teal,0,.09,.43,.02);
  for(const [x,z]of[[-.26,-.12],[.20,.12],[-.14,.23]]){const b=ball(tray,.10,'#ddb18b',x,.10,z);b.scale.y=.38;}
  const tp=mechanism(f,'drawer',tray,(t,b)=>{tray.position.z=b.p.z+t*.85;tray.rotation.x=-Math.sin(t*PI)*.10;},{label:'모래밭 가짜 바닥',sfx:'drawer',dur:.75});
  f.spot('inside',recess,0,.14,.02,{part:tp,maxH:.32,label:'모래밭에 묻힌 보물칸',scale:1.0});
  // Chunky sandcastle and bright bucket: geometric detail rather than an unreadable blue blob.
  cylinder(f,.26,.32,.27,'#dcae85',-.65,.35,.69,14);for(let k=0;k<6;k++){const a=k*PI/3;box(f,.10,.11,.11,P.sand,-.65+Math.cos(a)*.22,.53,.69+Math.sin(a)*.22,.015);}
  const pail=hollow(f,.30,.29,.30,P.red,1.02,.20,-.63,.035);box(pail,.3,.29,.035,P.red,0,.145,.133,.02);ring(pail,.15,.018,P.cream,0,.33,0);pail.rotation.y=.3;
};

B.gpthamper=f=>{
  f.gptWalkBox=[-.59,0,-.50,.59,1.10,.32];
  // A cloth-covered picnic base gives this map a picnic identity without repeating the picnic-boss map.
  box(f,1.96,.045,1.54,P.cream,0,.035,.09,.09);
  for(let k=0;k<6;k++){box(f,.085,.008,1.50,P.teal,-.82+k*.33,.064,.09,.004);box(f,1.93,.008,.075,P.teal,0,.066,-.55+k*.25,.004);}
  // The toy storage body keeps .65m target headroom above its separate secret floor; only its oversized handle shrinks.
  const q=hollow(f,1.18,.92,.76,P.honey,0,.08,-.10,.065);
  box(q,1.05,.030,.63,P.cream,0,.075,0,.02);
  for(let k=0;k<7;k++)box(q,1.19,.025,.025,P.wood,0,.15+k*.105,.385,.008);
  const lid=group(f,0,1.00,-.48);box(lid,1.22,.09,.80,P.honey,0,.045,.4,.04);slatFace(lid,1.17,.08,.81,P.wood);
  const h=ring(lid,.17,.035,P.wood,0,.14,.40);h.scale.y=.70;h.name='gpt-hamper-handle';
  const p=mechanism(f,'lid',lid,t=>{lid.rotation.x=-t*1.55;},{label:'햄찌의 소풍 보물 바구니',sfx:'creak',dur:.6});p.lockable=true;p.lockKind='color';f.lockAt={x:0,y:.83,z:.316};
  f.spot('inside',q,0,.27,.02,{part:p,maxH:.65,label:'소풍 바구니 안',scale:1.05});
  // Two familiar auxiliary moves from the recipe: sliding mat and a secret basket floor.
  const matFloor=hollow(f,1.20,.15,.50,P.honey,0,.08,.65,.045);box(matFloor,1.20,.15,.045,P.honey,0,.075,.227,.02);
  const mat=group(f,0,.25,.65);box(mat,1.28,.045,.57,P.cream,0,.025,0,.035);for(let k=0;k<5;k++)box(mat,.055,.008,.55,P.teal,-.50+k*.25,.053,0,.004);
  for(const z of[.45,.85])box(f,1.70,.045,.055,P.wood,.21,.20,z,.015);
  const mp=mechanism(f,'drawer',mat,t=>{mat.position.x=t*.42;},{label:'소풍 돗자리 미닫이',sfx:'rustle',dur:.7});f.spot('inside',matFloor,0,.055,0,{part:mp,maxH:.12,label:'돗자리 밑 숨은 칸',scale:1.0});
  const falseFloor=group(q,0,.23,-.30);box(falseFloor,1.00,.035,.58,P.cream,0,0,.29,.025);box(falseFloor,.18,.03,.06,P.teal,0,.027,.48,.01);
  rod(falseFloor,[0,0,.53],[0,-.10,.69],.025,P.wood);const floorGrip=group(falseFloor,0,-.10,.69);ball(floorGrip,.065,P.gold);
  const fp=mechanism(f,'lid',[falseFloor,floorGrip],t=>{falseFloor.rotation.x=-t*1.10;},{label:'바구니 비밀 바닥',sfx:'thunk',dur:.65});fp.handle=floorGrip;f.spot('inside',q,0,.09,.07,{part:fp,maxH:.12,label:'바구니 비밀 바닥 밑',scale:1.0});
  // A .30m thermos and .082m sandwich sit on the blanket at real picnic-object scale.
  const thermos=group(f,-.76,.08,.44);thermos.name='gpt-picnic-thermos';
  cylinder(thermos,.085,.085,.25,P.teal,0,.125,0);cylinder(thermos,.09,.09,.05,P.white,0,.275,0);
  const sandwich=group(f,.85,.08,.50);sandwich.name='gpt-picnic-sandwich';
  box(sandwich,.21,.025,.19,P.honey,0,.0125,0,.012);box(sandwich,.22,.018,.20,P.leaf,0,.034,0,.008);box(sandwich,.22,.014,.20,P.red,0,.050,0,.006);box(sandwich,.21,.025,.19,P.honey,0,.0695,0,.012);
};

B.gptsunflowerbox=f=>{
  f.gptWalkBox=[-.48,0,-.28,.48,.96,.36];
  box(f,.78,.12,.62,P.cream,0,.06,0,.06);box(f,.14,1.14,.14,P.wood,0,.65,-.04,.025);
  const cab=hollow(f,.90,.82,.53,P.teal,0,.12,.03,.065);box(cab,.90,.06,.53,P.cream,0,.82,0,.02);
  box(cab,.70,.045,.32,P.honey,0,.10,0,.01);
  const flap=group(f,0,.18,.324);box(flap,.90,.73,.055,P.teal,0,.365,0,.025);label(flap,'씨앗',.48,.21,0,.44,.034,{bg:P.teal,fg:P.dark});rod(flap,[.28,.28,.035],[.28,.28,.075],.025,P.wood);ball(flap,.06,P.gold,.28,.28,.115);
  const p=mechanism(f,'door',flap,t=>{flap.rotation.x=t*1.55;},{label:'해바라기 씨앗 우편함',sfx:'door',dur:.55});
  p.lockable=true;p.lockKind='lever';p.lockAt={parent:flap,x:.27,y:.55,z:.07};
  f.spot('inside',cab,0,.14,.04,{part:p,maxH:.65,label:'씨앗 상자 속',scale:1.0});
  box(f,.14,1.14,.14,P.wood,0,1.13,-.04,.025);
  const flowerhead=group(f,0,1.88,.01);
  for(let k=0;k<10;k++){const a=k*PI/5;const m=ball(flowerhead,.18,P.gold,Math.cos(a)*.32,Math.sin(a)*.32,0);m.scale.set(.88,1.12,.36);m.rotation.z=a-HP;}
  axisDisc(flowerhead,.265,.12,P.wood,0,0,.02);axisDisc(flowerhead,.225,.035,'#a06736',0,0,.10);
  for(let k=0;k<7;k++){const a=k*2.4;ball(flowerhead,.022,P.gold,Math.cos(a)*(.06+k*.02),Math.sin(a)*(.06+k*.02),.126);}
  // An actual front shelf supports the dynamically generated coloured observation vases.
  const clues=group(f,0,1.06,.31);box(clues,1.02,.10,.52,P.cream,0,0,0,.035);
  label(clues,'작은 꽃병부터',.86,.14,0,-.01,.269,{bg:P.cream,fg:P.dark});
  f.gptColorMount={parent:clues,x:0,y:.059,z:.04,scale:2};
  // Turning the flower folds the shelf's broad shutters away to reveal that clue.
  const coverL=group(clues,-.51,.36,.22),coverR=group(clues,.51,.36,.22);
  box(coverL,.51,.67,.06,P.honey,.255,0,0,.035);box(coverR,.51,.67,.06,P.honey,-.255,0,0,.035);
  label(coverL,'?',.28,.34,.255,0,.036,{bg:P.honey,fg:P.wood});label(coverR,'?',.28,.34,-.255,0,.036,{bg:P.honey,fg:P.wood});
  const turn=mechanism(f,'wheel',[flowerhead,coverL,coverR],t=>{flowerhead.rotation.z=-t*PI*2;coverL.rotation.y=-phase(t,.15,1)*1.8;coverR.rotation.y=phase(t,.15,1)*1.8;},{label:'해바라기 색 단서 덧문',sfx:'flip',dur:1.2});
  turn.handle=flowerhead;turn.gptClueReveal=true;
};

B.gptbalancelog=f=>{
  // The recipe's seed balance: two broad real pans and visible hanging links.
  box(f,1.75,.12,.66,P.honey,0,.06,0,.07);box(f,.14,.91,.14,P.wood,0,.53,0,.025);axisDisc(f,.16,.11,P.gold,0,1.01,.09);
  const beam=group(f,0,1.01,.09);box(beam,1.62,.10,.12,P.teal,0,0,0,.025);
  const pans=[];for(const x of[-.68,.68]){const pan=group(beam,x,-.47,0);cylinder(pan,.27,.23,.09,P.cream,0,0,0,16);for(const z of[-.17,.17])rod(pan,[0,0,z],[0,.44,0],.023,P.wood);for(let k=0;k<4;k++){const seed=ball(pan,.035,k%2?P.honey:P.gold,(k%2)*.15-.075,.085,Math.floor(k/2)*.13-.065);seed.scale.set(.8,1.2,.7);seed.name='gpt-balance-seed';}pans.push(pan);}
  label(f,'씨앗 저울',.68,.18,0,.20,.35,{bg:P.honey,fg:P.dark});
  const lp=mechanism(f,'wheel',beam,t=>{beam.rotation.z=-t*.24;pans.forEach(q=>q.rotation.z=t*.24);},{label:'햄찌의 씨앗 저울',sfx:'creak',dur:.85});lp.gptFunny='선물 무게는 똑같이!';
  f.live=pans;
  f.spot('on',pans[0],0,.15,.10,{part:lp,maxH:.35,label:'왼쪽 씨앗 저울 접시',scale:1.0});
};

export const GPT_DAY_BUILDERS=B;
export const GPT_DAY_INFO={
  gptcontestterrain:{w:8,d:7,name:'대회 마당과 관중 난간',hidden:true,floor:true},
  gptcontestpodium:{w:3,d:2,name:'우승 깃발 시상대',hidden:true},
  gptprizebox:{w:2,d:1,name:'대회 상품 상자',hidden:true},
  gpttimingpost:{w:1,d:1,name:'대회 시계 기록함',hidden:true},
  gptstarterbarrier:{w:3,d:1,name:'출발 종 차단봉',hidden:true},
  gptofficialbench:{w:2,d:1,name:'심판 수납 벤치',hidden:true},
  gptcontestswing:{w:2,d:2,name:'대회장 작은 그네',hidden:true},
  gpthamsterterrain:{w:8,d:7,name:'햄찌의 모래 정원',hidden:true,floor:true},
  gptsandhill:{w:4,d:3,name:'보물 동굴 오르기 언덕',hidden:true},
  gptsandbox:{w:3,d:3,name:'굴착 모래 보물밭',hidden:true},
  gpthamper:{w:2,d:2,name:'햄찌의 소풍 바구니',hidden:true},
  gptsunflowerbox:{w:1,d:1,name:'해바라기 씨앗 상자',hidden:true},
  gptbalancelog:{w:2,d:1,name:'햄찌의 씨앗 저울',hidden:true},
};
