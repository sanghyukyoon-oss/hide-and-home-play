// GPT 장치 가구를 원본 맵으로 옮겨 붙이는 것들 (②b 10/22 저녁 — 사용자 비교 시트 "원본 유지 + GPT 장치 중 재밌는 것 이식", 46·66판)
// 모델은 GPT 작업장(gpt3-f 경주 공원) 빌더 그대로, 색은 ⑥이 다시 칠한 판(RACE_P). 키는 작업장 키 그대로(gpt-chains.js 표가 찾음).
import * as THREE from 'three';
import { calmAll } from './gpt-calm.js';
import { tor, put } from './kit.js';
import { box, ball, cylinder, rod, group, hollow, mechanism, phase } from './gpt-play-kit.js';

const B = {}, PI = Math.PI;
// (⑥ 10/22 다시 칠함 — 사용자 "gpt 모델링은 꼭 니가 색칠 좀 다시 해 줘": the workshop's pastels taken to our paint — sat ≥ .65, light .55–.65, big faces pale)
const P = { cream:'#fef2e1', white:'#fefde9', honey:'#efb36a', wood:'#d9822b', dark:'#6f4b30', red:'#ff6a50', blue:'#5cb8ee', mint:'#3fc4a8', grass:'#7cc85a', leaf:'#4cbf5a', gold:'#ffc21e', steel:'#c9d3de', water:'#5cc8f2' };
const RACE_P = { ...P, red:'#ee4b3f', blue:'#3a9be6', mint:'#22a891', leaf:'#3fae5a', steel:'#c9d3de' }, BASE_WIDE_P = RACE_P;
calmAll(P, .55); calmAll(RACE_P, .55);   // (원본 놀이터 배색에 맞춰 차분하게 — gpt-calm.js)
const ring=(parent,R,r,color,x,y,z)=>{const m=put(tor(R,r,color,null,PI*2,5,20),x,y,z);parent.add(m);return m;};
function inside(f,parent,part,x,y,z,labelText,maxH=.65) { return f.spot('inside',parent,x,y,z,{part,maxH,label:labelText,scale:1.05}); }

// (⑥ 10/24 아트 점검 "민무늬 세면대 같음" — 46판): a park fountain — a rim of stone blocks with a cream cap, a tiled pale-blue
// floor, water with ripples and two lily pads, a stone column with a bowl and a spout on top, three arcs of water falling from
// the spout past the bowl's rim, and a green cast-iron valve post with the lever. Part, pivots and the coin place as before.
B.gptwidefountain=(f,T,o={})=>{
  const g=f.group, ST='#e6ddcf', ST2='#d6ccbd', CAP='#fff4e2', WAT='#7fd0f0';
  cylinder(g,1.1,1.14,.08,'#cfc6b8',0,.04,0,24);
  for(let k=0;k<16;k++){const a=k/16*PI*2,m=box(g,.4,.26,.17,k%2?ST:ST2,Math.sin(a)*.98,.21,Math.cos(a)*.98,.035);m.rotation.y=a;}
  const cap=ring(g,.98,.075,CAP,0,.35,0);cap.rotation.x=PI/2;
  cylinder(g,.86,.86,.045,'#a9dceb',0,.19,0,24);
  for(const r of [.35,.62])ring(g,r,.008,'#8fcfe0',0,.215,0).rotation.x=PI/2;
  const water=group(g,0,.29,0);cylinder(water,.85,.85,.025,WAT,0,0,0,24);
  for(const r of [.3,.55])ring(water,r,.008,'#e3f6ff',0,.015,-.1).rotation.x=PI/2;
  for(const [x,z,s] of [[-.52,-.05,1],[.56,.02,.8]]){const pad=cylinder(water,.1*s,.1*s,.012,'#6fbf6a',x,.018,z,14);pad.scale.z=.9;}
  ball(water,.03,'#ff9fb5',-.52,.04,-.05);
  cylinder(g,.17,.21,.1,ST2,0,.25,-.38,16);cylinder(g,.09,.1,.24,ST,0,.42,-.38,14);
  cylinder(g,.26,.12,.1,ST,0,.59,-.38,18);const bowl=ring(g,.25,.03,CAP,0,.64,-.38);bowl.rotation.x=PI/2;cylinder(g,.22,.22,.012,WAT,0,.635,-.38,18);
  cylinder(g,.04,.05,.2,ST,0,.74,-.38,10);cylinder(g,.07,.04,.06,CAP,0,.86,-.38,12);ball(g,.035,'#e8c45a',0,.9,-.38);
  box(g,.17,.48,.17,'#4f8f74',-1.04,.3,.08,.03);box(g,.21,.05,.21,'#3f7a62',-1.04,.56,.08,.02);box(g,.12,.08,.012,'#e8c45a',-1.04,.36,.17,.008);
  const lever=group(g,-1.04,.6,.08);rod(lever,[0,0,0],[0,.34,0],.04,'#c9cfe0');ball(lever,.09,'#ff6b57',0,.38,0);ring(g,.08,.025,'#3f7a62',-1.04,.6,.1);
  const streams=group(g,0,.24,-.38);
  for(let k=0;k<3;k++){
    const a=k*PI*2/3+PI/2,points=[];
    for(let i=0;i<8;i++){const t=i/7;points.push([Math.cos(a)*.5*t,.62*(1-t)+Math.sin(t*PI)*.18,Math.sin(a)*.5*t]);}
    for(let i=0;i<7;i++)rod(streams,points[i],points[i+1],.03,'#bfe9fb');
  }
  const p=mechanism(f,'lever',[lever,streams,water],t=>{
    lever.rotation.z=-t*1.05;const stop=phase(t,.08,.48);streams.scale.y=Math.max(.015,1-stop);streams.visible=stop<.995;water.position.y=.29-.13*stop;
  },{label:'분수 레버: 물을 멈추면 바닥 동전',dur:1.15,sfx:'whoosh',chain:['레버','물줄기 멈춤','바닥 동전']});
  p.gptLoop='waterLap';p.gptPhases=[{at:.14,sfx:'blub'},{at:.52,sfx:'coin'}];p.gptFinish='coin';p.gptFunny='분수도 잠깐 쉬는 중!';
  // No decorative duplicate: the stage places the real existing 500-won coin on this empty basin floor.
  const s=f.spot('inside',g,0,.22,.28,{part:p,maxH:.65,label:'물이 멎은 분수 바닥의 동전 자리',scale:1.5});s.gptWant=.9;s.gptCoin=true;p.gptCoinType='coin500';p.gptCoinSpot=s;if(o.bossLever){p.gptLever=true;p.isLever=true;}
  if (o.scale) g.scale.setScalar(o.scale);   // (46판 아트 점검 ② 10/24: the basin is wider than its 2×2 tiles — a smaller one keeps off its neighbours)
};

// (⑩ 10/29 실폰 "대충 만든 오브젝트" — 43·46판): the run was three 2 m planks slanting between two posts, and from the start
// camera they cut through the swings and the seesaw like loose boards. Now a compact marble tower: a cream pegboard on two
// wooden legs with feet (a pale sky board, so it reads off the sand-coloured paving), three short gold-rimmed rails zigzagging down its face, a funnel cup on top, the bell on a bracket at
// the bottom over a honey tray, the blue boot that jumps beside it. Same part (lever), the same marble path idea, the same spot.
B.gptwidemarblerun=(f,T,o={})=>{
  const P=o.fix1022?RACE_P:BASE_WIDE_P,g=f.group,W=1.04,H=1.42,Z=-.22,y0=.12,fz=Z+.05;
  box(g,W,H,.07,'#cfe9f5',0,y0+H/2,Z,.03);box(g,W+.02,H+.02,.04,P.white,0,y0+H/2,Z-.03,.02);
  for(const x of [-W/2-.04,W/2+.04]){box(g,.09,y0+H+.04,.12,P.wood,x,(y0+H+.04)/2,Z,.025);box(g,.16,.05,.42,P.honey,x,.025,Z+.06,.02);}
  box(g,W+.2,.07,.14,P.wood,0,y0+H+.05,Z,.025);
  for(let r=0;r<6;r++)for(let c=0;c<5;c++)if((r+c)%2===0)ball(g,.016,P.white,-.4+c*.2,y0+.12+r*.24,fz-.01);
  function rail(a,b){
    const A=new THREE.Vector3(...a),D=new THREE.Vector3(...b).sub(A),q=group(g,...A.clone().addScaledVector(D,.5).toArray());q.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),D.clone().normalize());
    box(q,D.length()+.06,.03,.15,P.honey,0,-.07,0,.012);for(const z of [-.075,.075])box(q,D.length()+.06,.06,.025,P.gold,0,-.04,z,.01);
    for(const s of [-1,1])rod(g,[A.x+D.x*(.5+s*.38),A.y+D.y*(.5+s*.38)-.09,fz+.07],[A.x+D.x*(.5+s*.38),A.y+D.y*(.5+s*.38)-.09,fz-.01],.012,P.wood);
  }
  const zr=fz+.08,path=[[-.4,1.5,zr],[.36,1.34,zr],[.44,1.12,zr],[-.36,.95,zr],[-.44,.74,zr],[.3,.58,zr],[.4,.38,zr]];
  rail(path[0],path[1]);rail(path[2],path[3]);rail(path[4],path[5]);
  for(const [x,y] of [[.44,1.24],[-.44,.85]]){const c=ring(g,.075,.018,P.gold,x,y,zr);c.rotation.x=PI/2;}
  const cup=ring(g,.11,.025,P.gold,-.4,1.58,zr);cup.rotation.x=PI/2;cylinder(g,.11,.06,.08,P.honey,-.4,1.56,zr,14);
  const marble=group(g,...path[0]);ball(marble,.08,P.red);const stripe=ring(marble,.066,.016,P.cream,0,0,0);stripe.rotation.y=PI/2;
  rod(g,[.4,.5,fz],[.4,.5,zr+.06],.02,P.wood);
  const bell=group(g,.4,.5,zr+.04);cylinder(bell,.05,.13,.15,P.gold,0,-.08,0,14);ball(bell,.03,P.wood,0,-.17,0);
  hollow(g,.5,.14,.34,P.honey,.3,0,zr+.02,.04);
  const boot=group(g,-.05,.08,zr+.08);box(boot,.13,.09,.2,P.blue);box(boot,.13,.18,.1,P.blue,0,.11,-.05);box(boot,.14,.03,.21,P.cream,0,-.04,0,.01);(f.live||=[]).push(boot);
  const p=mechanism(f,'lever',[marble,bell],t=>{
    const k=phase(t,0,.88)*(path.length-1),i=Math.min(path.length-2,Math.floor(k)),u=k-i;marble.position.lerpVectors(new THREE.Vector3(...path[i]),new THREE.Vector3(...path[i+1]),u);marble.rotation.z=-t*PI*9;
    const hit=phase(t,.86,1);bell.rotation.z=Math.sin(hit*PI*5)*.25*(1-hit);boot.rotation.z=-Math.sin(hit*PI)*.45;boot.position.y=.08+.12*Math.sin(hit*PI);
  },{label:'미니 구슬 길: 홈통 → 종 → 장화',dur:2.45,sfx:'clink',chain:['구슬','홈통 낙하','종','장화 까꿍']});
  p.gptLoop='clink';p.gptPhases=[{at:.26,sfx:'land'},{at:.62,sfx:'clink'},{at:.89,sfx:'doorBell'}];p.gptFinish='giggle';p.gptFunny='구슬보다 장화가 먼저 도착!';
  inside(f,g,p,.3,.07,zr+.02,'구슬 종 아래 받침',.4);
  if (o.scale) g.scale.setScalar(o.scale);   // (43판 아트 점검 ② 10/23: a smaller run under the bike shelter's roofline)
};

export const GPT_WIDE_BUILDERS=B;

export const GPT_WIDE_DEVICE_BUILDERS = B;
export const GPT_WIDE_DEVICE_INFO = { gptwidefountain: { w: 2, d: 2, name: '분수 휴식 레버', hidden: true }, gptwidemarblerun: { w: 3, d: 1, name: '미니 구슬 종 길', hidden: true } };
