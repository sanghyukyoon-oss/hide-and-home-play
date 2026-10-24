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
};

B.gptwidemarblerun=(f,T,o={})=>{
  const P=o.fix1022?RACE_P:BASE_WIDE_P,g=f.group;
  for(const x of [-.82,.82]){box(g,.14,1.38,.18,P.wood,x,.69,-.34);box(g,.48,.1,.7,P.honey,x,.05,-.1);}
  function trough(a,b){
    const A=new THREE.Vector3(...a),D=new THREE.Vector3(...b).sub(A),q=group(g,...A.clone().addScaledVector(D,.5).toArray());q.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),D.clone().normalize());
    box(q,D.length(),.075,.4,P.honey,0,-.18,0,.025);for(const z of [-.205,.205])box(q,D.length(),.13,.055,P.mint,0,-.09,z,.02);
  }
  const path=[[-1.04,1.55,0],[.97,1.23,0],[1.18,1.20,0],[1.18,.86,0],[-.95,.59,0],[-1.15,.56,0],[-1.15,.34,0],[.65,.29,0],[.86,.29,.16]];
  trough(path[0],path[1]);trough(path[3],path[4]);trough(path[6],path[7]);
  // Wide open U turns let the large marble actually drop between levels.
  for(const [x,y] of [[1.18,1.04],[-1.15,.45]]){const funnel=ring(g,.235,.04,P.gold,x,y,0);funnel.rotation.x=PI/2;for(const z of [-.23,.23])rod(g,[x-.08,y+.12,z],[x+.08,y-.12,z],.035,P.gold);}
  const marble=group(g,...path[0]);ball(marble,.145,P.red);const stripe=ring(marble,.12,.028,P.cream,0,0,0);stripe.rotation.y=PI/2;
  hollow(g,.66,.19,.6,P.honey,.85,0,.15);const bell=group(g,.85,.62,.15);rod(g,[.85,.63,-.24],[.85,.63,.15],.03,P.wood);cylinder(bell,.07,.2,.22,P.gold,0,-.1,0);ball(bell,.045,P.wood,0,-.24,0);
  const boot=group(g,.94,.14,.29);box(boot,.16,.1,.25,P.blue);box(boot,.16,.2,.13,P.blue,0,.12,-.06);(f.live||=[]).push(boot);
  const p=mechanism(f,'lever',[marble,bell],t=>{
    const k=phase(t,0,.88)*(path.length-1),i=Math.min(path.length-2,Math.floor(k)),u=k-i;marble.position.lerpVectors(new THREE.Vector3(...path[i]),new THREE.Vector3(...path[i+1]),u);marble.rotation.z=-t*PI*9;
    const hit=phase(t,.86,1);bell.rotation.z=Math.sin(hit*PI*5)*.25*(1-hit);boot.rotation.z=-Math.sin(hit*PI)*.45;
  },{label:'미니 구슬 길: 홈통 → 종 → 장화',dur:2.45,sfx:'clink',chain:['구슬','홈통 낙하','종','장화 까꿍']});
  p.gptLoop='clink';p.gptPhases=[{at:.26,sfx:'land'},{at:.62,sfx:'clink'},{at:.89,sfx:'doorBell'}];p.gptFinish='giggle';p.gptFunny='구슬보다 장화가 먼저 도착!';
  inside(f,g,p,.63,.085,.31,'구슬 종 아래 받침',.4);
  if (o.scale) g.scale.setScalar(o.scale);   // (43판 아트 점검 ② 10/23: a smaller run under the bike shelter's roofline)
};

export const GPT_WIDE_BUILDERS=B;

export const GPT_WIDE_DEVICE_BUILDERS = B;
export const GPT_WIDE_DEVICE_INFO = { gptwidefountain: { w: 2, d: 2, name: '분수 휴식 레버', hidden: true }, gptwidemarblerun: { w: 3, d: 1, name: '미니 구슬 종 길', hidden: true } };
