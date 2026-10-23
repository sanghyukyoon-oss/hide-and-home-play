// GPT 23: 삐딱이네 생활 골목. Exterior façades, an actual courtyard, honest moving interiors.
// New keys only. Static geometry is vertex-colour merged; each door/lid remains one rigid batch.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, mat, mesh, grp, put, STYLE, canvasTex, texCache } from './kit.js';
import { gptSurroundHaze } from './gpt2b-surround.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)
const PI = Math.PI, HP = PI / 2, TEX = texCache();
const C = { plaster:'#f2dcbc', cream:'#fef2e1', tile:'#84ae9d', tileD:'#a09769', brick:'#c67f2a',
  brickL:'#eecfa3', stone:'#e8d7b7', mortar:'#f6e0bf', road:'#e8d7b7', iron:'#a09769', green:'#84ae9d',
  greenL:'#a2c8bb', wood:'#eecfa3', woodD:'#6f4b30', leaf:'#c6c393', leafD:'#a09769', pot:'#ee9d4c',
  brown:'#c67f2a', brownD:'#6f4b30', gold:'#f8b15b', white:'#fefde9', ink:'#644936', red:'#e97866', orange:'#f8b15b' };
const G = {
  box:(w,h,d,r=.025)=>new RoundedBoxGeometry(w,h,d,1,Math.min(r,w*.42,h*.42,d*.42)),
  hard:(w,h,d)=>new THREE.BoxGeometry(w,h,d),
  cyl:(rt,rb,h,n=12,open=false)=>new THREE.CylinderGeometry(rt,rb,h,n,1,open),
  sph:(r,n=10,m=7)=>new THREE.SphereGeometry(r,n,m),
  tor:(r,t,n=24)=>new THREE.TorusGeometry(r,t,5,n),
  lathe:(p,n=20)=>new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),n)
};
const VM = new Map();
function vertexMat(){const k=STYLE.mode;if(!VM.has(k))VM.set(k,k==='std'?new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88}):new THREE.MeshToonMaterial({vertexColors:true,gradientMap:STYLE.grad}));return VM.get(k);}
function batch(key,build){
  const g=geo('gptalley|'+STYLE.mode+'|'+key,()=>{
    const list=[];
    const add=(src,c,x=0,y=0,z=0,rx=0,ry=0,rz=0,s=1)=>{
      const q=src.index?src.toNonIndexed():src.clone();
      for(const a of Object.keys(q.attributes))if(a!=='position'&&a!=='normal')q.deleteAttribute(a);
      q.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),typeof s==='number'?new THREE.Vector3(s,s,s):new THREE.Vector3(...s)));
      const col=new THREE.Color(STYLE.mode!=='std'&&STYLE.remap?STYLE.remap(c):c),a=new Float32Array(q.attributes.position.count*3);
      for(let i=0;i<a.length;i+=3){a[i]=col.r;a[i+1]=col.g;a[i+2]=col.b;}q.setAttribute('color',new THREE.BufferAttribute(a,3));list.push(q);
    };
    const bar=(a,b,r,c,n=8)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A),m=new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize()),new THREE.Vector3(1,1,1));const q=G.cyl(r,r,v.length(),n);q.applyMatrix4(m);add(q,c);};
    const box=(w,h,d,c,x=0,y=0,z=0,rx=0,ry=0,rz=0,r=.025)=>add(G.box(w,h,d,r),c,x,y,z,rx,ry,rz);
    build({add,bar,box});const expanded=mergeGeometries(list,false),out=mergeVertices(expanded);expanded.dispose();for(const q of list)q.dispose();out.name='gptalley:'+key;return out;
  });return mesh(g,vertexMat());
}
function textPanel(text,w,h,{bg=C.cream,fg=C.iron,size=32}={}){
  text=tr(text);   // (영어 화면에선 영어 — gfx/gpt-paper.js WORDS, ① 10/22)
  const H=128,W=Math.max(128,Math.round(H*w/h));
  const tex=TEX.get('gptalley.label.v3|'+text+'|'+bg+'|'+fg+'|'+W+'x'+H+'|'+size,()=>canvasTex(W,H,(c,W,H)=>{
    c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.textAlign='left';c.textBaseline='alphabetic';
    const maxW=W*.8,maxH=H*.8;let px=Math.min(size,maxH),ink;
    // Measure the actual game font and centre its ink, preserving a 10% paper margin on every side.
    for(let pass=0;pass<8;pass++){
      c.font=`bold ${px}px "Ssurround", "Jua", "LatinRound", "Apple SD Gothic Neo", sans-serif`;
      const m=c.measureText(text),left=m.actualBoundingBoxLeft??0,right=m.actualBoundingBoxRight??m.width,ascent=m.actualBoundingBoxAscent??px*.8,descent=m.actualBoundingBoxDescent??px*.2;
      ink={left,ascent,w:Math.max(1,left+right),h:Math.max(1,ascent+descent)};
      const fit=Math.min(1,maxW/ink.w,maxH/ink.h);if(fit>=1)break;px*=fit*.99;
    }
    c.fillText(text,(W-ink.w)/2+ink.left,(H-ink.h)/2+ink.ascent);
  }));
  return mesh(new THREE.PlaneGeometry(w,h),mat('#ffffff',{map:tex}),{cast:false});
}
function wakeNote(){
  const note=grp(),w=.48,h=.35,fold=.075;
  note.add(batch('wake-note-paper',A=>{
    // A clipped sheet and raised triangular corner leave a real paper edge and a small shadow gap.
    const sheet=new THREE.Shape();sheet.moveTo(-w/2,-h/2);sheet.lineTo(w/2-fold,-h/2);sheet.lineTo(w/2,-h/2+fold);sheet.lineTo(w/2,h/2);sheet.lineTo(-w/2,h/2);sheet.closePath();
    A.add(new THREE.ExtrudeGeometry(sheet,{depth:.008,bevelEnabled:false}),C.white);
    const corner=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([w/2-fold,-h/2,.009,w/2,-h/2,.05,w/2,-h/2+fold,.009],3));corner.computeVertexNormals();A.add(corner,C.cream);
    A.box(.14,.045,.018,C.gold,-.10,h/2,.014,0,0,-.09,.004);
    A.box(.12,.045,.018,C.gold,.11,h/2,.014,0,0,.11,.004);
  }));
  note.add(put(textPanel('…내가',.39,.105,{bg:C.white,fg:C.woodD,size:44}),0,.065,.010));
  note.add(put(textPanel('일어나는 시간',.39,.105,{bg:C.white,fg:C.woodD,size:38}),0,-.065,.010));
  return note;
}
function pot(A,x,y,z,r=.18,h=.27,flowers=false){
  A.add(G.cyl(r,r*.72,h,12),C.pot,x,y+h/2,z);A.add(G.cyl(r*1.05,r*1.05,.055,12),C.brick,x,y+h-.008,z);A.add(G.cyl(r*.88,r*.88,.018,12),C.brownD,x,y+h+.018,z);
  for(let i=0;i<5;i++){let a=i*2.4,s=r*.45;A.bar([x,y+h,z],[x+Math.cos(a)*s,y+h+.25+(i%2)*.1,z+Math.sin(a)*s],.018,C.leafD,5);A.add(G.sph(r*.65,7,5),i%2?C.leaf:C.leafD,x+Math.cos(a)*s,y+h+.25+(i%2)*.1,z+Math.sin(a)*s,0,a,.2,[1,.55,.7]);if(flowers)A.add(G.sph(.055,7,5),i%2?C.gold:C.red,x+Math.cos(a)*s,y+h+.34+(i%2)*.1,z+Math.sin(a)*s);}
}
function roof(A,x,y,z,w,d,c=C.tile){
  const pitch=.22;
  A.box(w+.18,.09,d/2+.15,c,x,y,z-d/4,-pitch,0,0);A.box(w+.18,.09,d/2+.15,c,x,y,z+d/4,pitch,0,0);
  A.add(G.cyl(.075,.075,w+.24,10),C.tileD,x,y+.13,z,0,0,HP);
  for(let i=0;i<Math.ceil(w/.26);i++){let xx=x-w/2+.1+i*.26;A.bar([xx,y-.075,z-d/2-.04],[xx,y+.1,z],.022,C.tileD,5);A.bar([xx,y+.1,z],[xx,y-.075,z+d/2+.04],.022,C.tileD,5);}
}
const B={};
// A low-cost neighbourhood continues behind both sides. It does not expand the playable camera bounds.
B.gpt_alley_context=f=>{
  f.noSolid=true;f.collideBox=[0,0,0,0,0,0];f.spot('on',null,-3.10,.025,.90,{maxH:.7,label:'집 앞 골목 바닥'});f.spot('on',null,.50,.025,-.40,{maxH:.7,label:'골목 중앙 돌길'});
  const far=batch('neighbourhood',A=>{
    // Distant architecture has no bevels or ink: 12 triangles per block.
    A.box=(w,h,d,c,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>A.add(G.hard(w,h,d),c,x,y,z,rx,ry,rz);
    // (① 10/22 공통 룩 키트: 바닥판·바깥 길·긴 연석은 뺌 — 사용자 "알 수 없는 파란색은 뭘까?"; 둘레는 26판 동네 배경 gptneighborhood가 깔고, 여기는 가까운 이웃집·나무만)
    const homes=[[-6.4,-4.2,2.6,2.3,2.4,C.cream],[-6.7,-8,2.9,3.1,2.3,C.plaster],[-2.9,-7.4,3.2,2.3,2.4,C.stone],[1.1,-8.1,3.0,2.7,2.4,'#feebc8'],[5.3,-6.3,2.7,3.2,2.5,C.plaster],[7.1,-1.4,2.5,2.5,2.9,C.cream]];
    for(const [x,z,w,h,d,c]of homes){A.box(w,h,d,c,x,h/2,z);roof(A,x,h+.05,z,w,d,C.greenL);for(let q=0;q<2;q++){A.box(.53,.65,.06,C.green,x-w*.24+q*w*.48,h*.65,z+d/2+.04);A.box(.03,.65,.08,C.cream,x-w*.24+q*w*.48,h*.65,z+d/2+.08);}A.box(w+.1,.13,.2,C.wood,x,.2,z+d/2+.07);}
    // A far, quiet cluster of foliage breaks the roofline; all one low-poly mesh.
    for(const [x,z]of [[-7.2,-1.4],[4.5,-8.7],[7.7,-5.8],[-1,-10.5]]){A.bar([x,0,z],[x,2.3,z],.12,C.woodD,7);for(let j=0;j<3;j++)A.add(G.sph(.8,8,5),j%2?C.greenL:C.leaf,x+(j-1)*.5,2.3+(j%2)*.6,z,0,0,0,[1,.9,1]);}
  });
  far.castShadow=false;far.layers.set(2);gptSurroundHaze(far,'#f2dcbc');f.add(far);f.live=[far];
  f.add(batch('near-kerbs',A=>{
    A.box(.32,.12,7.8,C.stone,-3.95,.04,-.2);A.box(.32,.12,5.2,C.stone,3.95,.04,.6);
    // Drain covers have actual dark apertures, not floating graphic patches.
    for(let z=-1.5;z<3.1;z+=2.1){A.box(.38,.045,.55,C.iron,3.55,.029,z);for(let i=0;i<5;i++)A.box(.29,.012,.025,C.wood,3.55,.059,z-.2+i*.1,0,0,0,.002);}
    for(let i=0;i<7;i++){let x=-3.55+i*1.02;A.box(.12,.014,.028,'#feebc8',x,.018,3.18,0,0,0,.002);}
  }));
};
// House is an exterior mass with deep window bays and proper sill. The small porch door reveals a hallway.
B.gpt_alley_house=f=>{
  const F=.67;
  f.collideBox=[-1.49,0,-.7,1.49,3.47,.7];
  f.add(batch('house-shell',A=>{
    // Omit the lower front at the doorway: opening it never exposes a solid facade.
    A.box(2.9,3.42,.12,C.plaster,0,1.71,-.64);A.box(.13,3.42,1.25,C.plaster,-1.39,1.71,-.02);A.box(.13,3.42,1.25,C.plaster,1.39,1.71,-.02);
    A.box(1.88,2.30,.16,C.plaster,.49,1.15,F-.08);A.box(.15,2.30,.16,C.plaster,-1.36,1.15,F-.08);A.box(2.9,1.1,.16,C.plaster,0,2.86,F-.08);
    A.box(2.96,.13,.23,C.brick,0,.16,F);A.box(1.2,.08,.86,C.stone,-.84,.065,.95);A.box(1.05,.08,.55,C.mortar,-.84,.145,.87);
    // Brick footing, deliberately regular and restrained.
    for(let row=0;row<3;row++)for(let j=0;j<6;j++){let x=-1.25+j*.48+(row%2)*.2;if(x<-.31&&x> -1.3)continue;A.box(.42,.13,.04,row%2?C.brick:C.brickL,x,.29+row*.17,F+.025,0,0,0,.012);}
    A.box(.95,.07,1.15,C.stone,-.84,.08,-.04);A.box(.88,2.12,.04,C.wood,-.84,1.145,-.55);A.box(.45,.055,.38,C.wood,-.84,.39,-.38);
    // Door jamb and lintel, porch canopy and mailbox.
    for(const x of [-1.28,-.38])A.box(.08,2.24,.18,C.woodD,x,1.20,F+.04);A.box(1.0,.09,.19,C.woodD,-.83,2.31,F+.04);
    A.box(1.18,.09,.71,C.tile,-.83,2.37,.93,.10);A.bar([-1.31,2.02,.71],[-1.31,2.34,1.18],.035,C.iron);A.bar([-.35,2.02,.71],[-.35,2.34,1.18],.035,C.iron);
    A.box(.33,.42,.14,C.green,-1.15,1.45,F+.2);A.box(.25,.035,.03,C.iron,-1.15,1.57,F+.29);
    // Bay window sits in a pale sage recess, cream frame, actual sill.
    A.box(1.42,1.03,.07,'#a2c8bb',.54,1.37,F+.016);A.box(1.58,.12,.58,C.cream,.54,.85,F+.17);
    for(const x of [-.2,.54,1.28])A.box(.065,1.13,.16,C.cream,x,1.4,F+.08);for(const y of [.88,1.93])A.box(1.55,.06,.16,C.cream,.54,y,F+.08);
    for(const x of [-.08,1.15])for(let i=0;i<3;i++)A.box(.058,.82,.08,'#eecfa3',x+(i-1)*.048,1.4,F+.12,0,0,.018*(i-1));
    // Upper-story windows are small and quiet; a warm tiled hipped cap and gutter anchor the silhouette.
    for(const x of [-.73,.75]){A.box(.73,.58,.08,C.greenL,x,2.86,F+.035);A.box(.82,.065,.18,C.cream,x,2.54,F+.08);for(const dx of [-.38,0,.38])A.box(.045,.65,.12,C.cream,x+dx,2.86,F+.09);A.box(.82,.06,.14,C.cream,x,3.19,F+.09);}
    roof(A,0,3.49,0,3.03,1.58);A.bar([-1.51,3.36,.86],[1.52,3.36,.86],.05,C.leaf,10);A.bar([1.48,.16,.82],[1.48,3.36,.82],.047,C.leaf,10);
    // The flower pot is carried by the rotating rack below.
    // A pair of lived-in slip-on shoes lives inside the entry rather than on the road.
    for(const x of [-.97,-.72]){A.add(G.sph(.1,10,6),'#84ae9d',x,.15,-.12,0,0,0,[.8,.5,1.65]);A.box(.12,.05,.12,C.cream,x,.187,-.18);}
  }));
  const door=grp();put(door,-1.23,.2,F+.08);door.add(batch('house-porch-door',A=>{A.box(.81,2.03,.08,C.green,.405,1.015,0);A.box(.64,.95,.025,C.greenL,.405,1.37,.055);A.box(.64,.67,.025,C.greenL,.405,.47,.055);A.add(G.sph(.045,8,6),C.gold,.68,1.0,.09);A.box(.16,.05,.025,C.cream,.41,1.94,.055);}));f.add(door);
  const p=f.part('door',door,t=>{door.rotation.y=-1.8*t;},{label:'삐딱이네 현관',sfx:'door'});f.spot('inside',null,-.83,.2,.1,{part:p,maxH:.46,label:'현관 안 신발장'});
  // Physical twin-bell alarm clock, 7:25. One front-only dial texture, not a box wrap.
  const clock=grp();put(clock,.33,.91,F+.29);clock.scale.setScalar(.8);clock.add(batch('alarm-clock',A=>{
    A.add(G.cyl(.18,.18,.11,24),C.red,0,.22,0,HP);A.add(G.tor(.169,.017,28),C.cream,0,.22,.066);
    for(const x of [-.125,.125]){A.bar([x*.7,.34,0],[x,.43,0],.024,C.gold);A.add(G.sph(.09,12,7),C.gold,x,.44,0,0,0,-x*3,[1,.65,.75]);A.add(G.sph(.035,8,5),C.iron,x,.035,.015,0,0,0,[1,1,1.4]);}
    A.box(.025,.095,.025,C.iron,0,.44,0);A.add(G.sph(.023,8,5),C.gold,0,.22,.087);
    const hand=(ang,len,width,color)=>A.bar([0,.22,.082],[Math.sin(ang)*len,.22+Math.cos(ang)*len,.082],width,color,6);
    hand((7+25/60)/12*PI*2,.092,.015,C.red);hand(25/60*PI*2,.139,.009,C.iron);
  }));
  const dial=TEX.get('gptalley.clockface.v2',()=>canvasTex(256,256,(c,w,h)=>{c.fillStyle=C.white;c.fillRect(0,0,w,h);c.strokeStyle=C.woodD;c.fillStyle=C.woodD;c.lineWidth=3;c.textAlign='center';c.textBaseline='middle';for(let i=1;i<=12;i++){let a=i/12*PI*2,px=29;c.font=`bold ${px}px "Ssurround", "Jua", sans-serif`;const width=c.measureText(String(i)).width;if(width>35){px*=35/width;c.font=`bold ${px}px "Ssurround", "Jua", sans-serif`;}c.fillText(String(i),128+Math.sin(a)*91,128-Math.cos(a)*91);}for(let i=0;i<60;i++){let a=i/60*PI*2,r=i%5?118:113;c.beginPath();c.moveTo(128+Math.sin(a)*r,128-Math.cos(a)*r);c.lineTo(128+Math.sin(a)*122,128-Math.cos(a)*122);c.stroke();}}));
  clock.add(put(mesh(new THREE.CircleGeometry(.154,28),mat('#ffffff',{map:dial}),{cast:false}),0,.22,.071));f.add(clock);
  f.group.userData.gptClock={H:7,M:25,group:clock};f.gptClock={g:clock,H:7,M:25};f.live=[clock];
  // Recipe 23 auxiliary 19: the pot rack turns to show the wake-up-time note on its real back face.
  f.add(batch('spinning-pot-bracket',A=>{A.box(.57,.065,.65,C.wood,.98,.94,F+.37);A.bar([.75,.70,F+.08],[.75,.92,F+.61],.035,C.woodD);A.bar([1.20,.70,F+.08],[1.20,.92,F+.61],.035,C.woodD);}));
  const rack=grp();put(rack,.98,.98,F+.40);rack.add(batch('spinning-pot-rack',A=>{A.box(.54,.065,.38,C.wood,0,.035,0);A.box(.54,.72,.055,C.cream,0,.40,-.035);A.bar([0,.02,0],[0,.81,0],.024,C.gold);pot(A,-.12,.07,.115,.085,.14,true);pot(A,.14,.07,.11,.075,.12,false);}));
  rack.add(put(wakeNote(),0,.41,-.07,0,PI));f.add(rack);
  const spin=f.part('rotate',rack,t=>{rack.rotation.y=PI*t;},{label:'화분 회전 선반',sfx:'gearUp',dur:1.5});spin.gptAux=true;spin.gptChain=['화분 선반 돌기','뒷면 나타남','기상 시간 쪽지'];spin.gptSounds=[[.15,'gearUp'],[.85,'flip']];spin.gptEndSound='click';spin.gptClueReveal=true;
  f.spot('inside',rack,0,.1,-.12,{part:spin,maxH:.3,label:'회전 화분 선반 뒷면'}).reserved=true;
  // Recipe 23 auxiliary 21: the striped canopy unrolls and its forgotten ball rolls off into the open alley.
  f.add(batch('bay-awning-roller',A=>{A.add(G.cyl(.085,.085,1.81,16),C.woodD,.53,2.43,F+.11,0,0,HP);for(const x of [-.38,1.44])A.box(.075,.22,.20,C.green,x,2.42,F+.08);}));
  const cloth=grp();put(cloth,.53,2.41,F+.10);cloth.add(batch('bay-awning-cloth',A=>{A.box(1.78,.055,.80,C.cream,0,0,.40);for(let i=0;i<6;i++)A.box(.14,.012,.79,C.green,-.71+i*.285,.034,.40);A.add(G.cyl(.035,.035,1.82,12),C.green,0,-.015,.80,0,0,HP);A.box(1.80,.14,.045,C.green,0,-.06,.80);}));cloth.scale.z=.12;f.add(cloth);
  const ball=grp();put(ball,.53,2.646,F+.18);ball.add(batch('awning-lost-ball',A=>{A.add(G.sph(.14,14,10),C.cream);A.add(G.tor(.125,.016,20),C.red);A.add(G.tor(.125,.016,20),C.gold,0,0,0,HP);A.add(G.tor(.125,.016,20),C.green,0,0,0,0,HP);}));f.add(ball);
  const awning=f.part('awning',[cloth,ball],t=>{const unroll=Math.min(1,t/.36),roll=Math.max(0,Math.min(1,(t-.36)/.64));cloth.scale.z=.12+.88*unroll;if(t<=.36)ball.position.set(.53,2.646-.051*unroll,F+.18+.77*unroll);else ball.position.set(.53+1.13*roll,2.595-2.45*roll*roll,F+.95+(3.08-F-.95)*roll);ball.rotation.x=-PI*(unroll+roll*4);},{label:'차양 → 잊어버린 공 데굴',sfx:'rustle',dur:1.5});awning.gptAux=true;awning.gptChain=['줄무늬 차양 펴짐','공이 가장자리로','골목으로 데굴'];awning.gptSounds=[[.08,'rustle'],[.38,'clink'],[.93,'hop']];awning.gptEndSound='thump';awning.gptReaction='…거기 올려 뒀었나.';
  f.spot('inside',null,.53,2.36,F+.18,{part:awning,maxH:.2,label:'차양 안쪽'}).reserved=true;

  f.spot('on',null,-.07,.925,F+.32,{maxH:.3,label:'알람시계 옆 창턱'});f.spot('behind',null,1.05,.92,F+.31,{maxH:.27,label:'창턱 화분 뒤'});
  f.add(put(textPanel('삐딱이네',.35,.13,{bg:C.cream,fg:C.woodD,size:40}),-.83,2.20,F+.18));
};
// A gate with two genuinely moving leaves and an unobstructed paved courtyard behind them.
B.gpt_alley_yardgate=f=>{
  f.collideBox=[-1.37,0,-.11,1.37,1.85,.17];
  f.add(batch('yard-and-posts',A=>{
    A.box(2.6,.1,2.55,'#f2dcbc',0,.015,-1.24);A.box(2.78,.12,.34,C.stone,0,.04,.12);
    for(let iz=0;iz<5;iz++)for(let ix=0;ix<4;ix++)A.box(.55,.025,.43,(ix+iz)%2?C.cream:C.stone,-.89+ix*.59,.079,-.4-iz*.47,0,0,0,.018);
    for(const x of [-1.28,1.28]){A.box(.27,1.82,.32,C.brickL,x,.91,0);A.box(.37,.12,.42,C.cream,x,1.88,0);for(let y=.16;y<1.73;y+=.2)A.box(.278,.018,.328,C.mortar,x,y,0,0,0,0,.002);}
    // Boundary walls flank the yard; no wall crosses the gate's opening or first 2.3 metres of yard.
    for(const x of [-1.38,1.38]){A.box(.12,.65,2.53,C.plaster,x,.4,-1.38);A.box(.2,.08,2.58,C.tile,x,.76,-1.38);}
    A.box(2.82,.51,.14,C.plaster,0,.35,-2.65);A.box(2.92,.075,.21,C.tile,0,.64,-2.65);
    // Garden inside: a real destination that can be seen through the opening.
    A.box(1.1,.2,.46,C.brickL,-.65,.17,-2.32);A.box(.98,.025,.35,C.brownD,-.65,.282,-2.32);
    for(const x of [-.95,-.65,-.35]){A.bar([x,.29,-2.32],[x,.68,-2.32],.021,C.leafD);for(let i=0;i<3;i++)A.add(G.sph(.14,7,5),i%2?C.leaf:C.leafD,x+(i-1)*.08,.52+(i%2)*.17,-2.32,0,i,0,[1,.55,.65]);}
    pot(A,.91,.1,-1.9,.22,.35,true);pot(A,.88,.1,-.74,.15,.25,false);
    // Low wooden bench and a coiled garden hose inside the yard.
    A.box(.8,.08,.32,C.wood,-.53,.43,-1.73);for(const x of [-.84,-.22])A.box(.07,.34,.25,C.woodD,x,.23,-1.73);
    for(let i=0;i<3;i++)A.add(G.tor(.19+i*.035,.019,18),'#a2c8bb',.73,.12+i*.018,-2.33,HP);
    A.box(.32,.38,.09,C.cream,1.3,1.3,.23);A.add(G.sph(.045,8,5),C.gold,1.3,1.32,.29);
  }));
  const leaves=[];
  for(const side of [-1,1]){
    const pv=grp();put(pv,side*1.115,.16,.095);
    pv.add(batch('gate-leaf|'+side,A=>{
      const x=-side*.55;A.box(1.095,1.39,.085,C.green,x,.695,0);
      for(const y of [.11,.69,1.27])A.box(.97,.075,.045,C.greenL,x,y,.058);
      for(const xx of [-.46,.46])A.box(.055,1.27,.045,C.greenL,x+xx,.69,.058);
      for(let i=0;i<6;i++)A.box(.027,.41,.03,C.greenL,x-.36+i*.145,1.0,.058);
      A.add(G.tor(.057,.014,18),C.gold,-side*.98,.72,.08);A.add(G.sph(.026,8,5),C.gold,-side*.98,.81,.08);
      for(const y of [.25,1.16])A.add(G.cyl(.045,.045,.16,10),C.iron,0,y,0);
    }));f.add(pv);leaves.push(pv);
  }
  // Phone-readable mechanical chain: a hand crank drives two meshing gears, retracts the real bolt, then opens both leaves.
  const gear=(radius,color,key,n=12)=>batch(key,A=>{A.add(G.tor(radius*.68,radius*.24,24),color);A.add(G.cyl(radius*.21,radius*.21,.085,12),C.iron,0,0,0,HP);for(let i=0;i<n;i++){let a=i/n*PI*2;A.box(radius*.28,radius*.38,.075,color,Math.cos(a)*radius*.89,Math.sin(a)*radius*.89,0,0,0,a-HP,.012);}});
  const ga=grp(),gb=grp();put(ga,-1.28,1.23,.30);put(gb,-.90,1.23,.30);ga.add(gear(.235,C.gold,'gate-drive-gear'));gb.add(gear(.155,C.iron,'gate-driven-gear',8));
  ga.add(batch('gate-hand-crank',A=>{A.bar([0,0,.09],[.08,-.25,.09],.035,C.iron);A.add(G.cyl(.065,.065,.15,12),C.red,.08,-.25,.16,HP);}));f.add(ga);f.add(gb);
  const bolt=grp();put(bolt,.99,.72,.13);bolt.add(batch('gate-bolt',A=>{A.box(.52,.065,.065,C.gold);A.box(.06,.17,.075,C.gold,-.16,.08,.015);}));leaves[0].add(bolt);
  leaves[0].add(batch('gate-bolt-keepers',A=>{for(const x of [.71,.94]){A.box(.055,.16,.035,C.iron,x,.72,.095);A.box(.055,.035,.10,C.iron,x,.64,.15);}}));
  // A thick two-faced garden sign turns over at the end. It stands clear of the bench's usable hiding spot.
  f.add(batch('gate-clue-post',A=>{A.box(.07,.42,.07,C.woodD,.08,.78,-2.52);}));
  const clue=grp();put(clue,.08,1.05,-2.52);clue.add(batch('gate-clue-board',A=>A.box(.73,.30,.055,C.wood)));
  clue.add(put(textPanel('쉿!',.65,.23,{bg:C.cream,fg:C.red,size:60}),0,0,.032));clue.add(put(textPanel('창턱 시계',.65,.23,{bg:C.cream,fg:C.woodD,size:40}),0,0,-.032,0,PI));f.add(clue);
  const p=f.part('door',[...leaves,ga,gb,bolt,clue],t=>{ga.rotation.z=-PI*4*t;gb.rotation.z=PI/8+PI*6*t;bolt.position.x=.99-.42*Math.min(1,t/.42);const opening=Math.max(0,(t-.25)/.75);leaves[0].rotation.y=-1.60*opening;leaves[1].rotation.y=1.60*opening;clue.rotation.y=PI*Math.max(0,(t-.78)/.22);},{label:'크랭크 → 톱니 → 빗장 → 마당 대문',sfx:'door',dur:1.5});
  p.gptAux=true;p.gptClueReveal=true;p.gptChain=['손잡이 두 바퀴','맞물린 톱니와 빗장','양문 열림','뒤집힌 마당 표지의 시계 단서'];
  p.gptSounds=[[.15,'gearUp'],[.25,'latch'],[.36,'creak'],[.82,'flip']];p.gptEndSound='click';


  f.spot('inside',null,-.53,.48,-1.73,{part:p,maxH:.4,label:'대문 안 마당 벤치'}).reserved=true;f.spot('inside',null,.37,.1,-.8,{part:p,maxH:.5,label:'대문 안 돌길'}).reserved=true;
  f.spot('behind',null,-1.13,.11,.39,{maxH:.32,label:'대문 기둥 옆'});
};
// No solid shell behind this door: deep shelves, boots, a watering can and a genuinely usable central interior.
B.gpt_alley_shed=f=>{
  const W=1.94,D=1.54,H=2.35,F=.77;
  f.collideBox=[-1,0,-.8,1,2.63,.8];
  f.add(batch('shed-shell-and-contents',A=>{
    A.box(W,.13,D,C.stone,0,.065,0);A.box(.12,H,D,C.plaster,-.91,H/2+.1,0);A.box(.12,H,D,C.plaster,.91,H/2+.1,0);A.box(W,H,.1,C.plaster,0,H/2+.1,-.72);
    A.box(.37,2.11,.12,C.plaster,-.745,1.155,F-.06);A.box(.37,2.11,.12,C.plaster,.745,1.155,F-.06);A.box(W,.27,.12,C.plaster,0,2.32,F-.06);
    // Two warm rails support a retracting corrugated roof, exposing the real control alcove when the door unlocks.
    for(const x of [-.97,.97]){A.box(.07,.07,3.0,C.woodD,x,2.46,-.65);A.box(.08,2.45,.08,C.plaster,x,1.225,-1.98);}
    A.box(1.23,.055,.21,C.woodD,0,.16,.84);for(const x of [-.59,.59])A.box(.07,2.10,.22,C.woodD,x,1.185,F);A.box(1.27,.075,.22,C.woodD,0,2.27,F);
    // Two thick timber shelves to the left/back leave a tall empty bay for hiding.
    for(const x of [-.67,.68])A.box(.065,1.58,.57,C.woodD,x,.94,-.36);
    for(const y of [.27,.93,1.58])A.box(1.42,.07,.58,C.wood,0,y,-.36);
    for(const x of [-.43,-.08,.28]){A.box(.22,.31,.28,x<0?'#eecfa3':'#c6c393',x,1.77,-.41);A.box(.21,.045,.025,C.cream,x,1.76,-.25);}
    // Small square seed box with an open handle notch read as wood, not a stretched texture.
    A.box(.43,.30,.28,C.wood,-.36,.46,-.38);A.box(.24,.035,.018,C.woodD,-.36,.50,-.227);
    A.add(G.cyl(.15,.17,.23,12),C.greenL,.32,1.09,-.36);A.add(G.tor(.12,.018,16),C.green,.32,1.25,-.36,HP);A.bar([.44,1.11,-.36],[.65,1.3,-.36],.04,C.greenL);A.add(G.tor(.11,.023,16),C.greenL,.16,1.12,-.36,0,HP);
    for(const x of [-.51,-.23]){A.add(G.cyl(.08,.08,.28,12),'#a09769',x,.32,.13);A.box(.17,.1,.28,'#a09769',x,.2,.20);A.add(G.cyl(.065,.065,.012,12),C.brownD,x,.468,.13);}
    // Rake and broom lean with their heads attached to their poles.
    A.bar([.69,.19,-.05],[.74,1.75,-.15],.022,C.woodD);A.box(.35,.06,.08,C.iron,.69,.2,-.05);for(let i=0;i<5;i++)A.bar([.55+i*.07,.19,-.05],[.55+i*.07,.13,.05],.012,C.iron,5);
    A.bar([-.74,.16,-.56],[-.67,1.6,-.56],.022,C.woodD);A.box(.24,.24,.09,'#eecfa3',-.73,.25,-.56);
    // Side windows, real louvred vent and a rain barrel outside.
    A.box(.035,.48,.64,'#b0e5e8',1.0,1.4,-.17);for(const z of [-.49,.15])A.box(.05,.56,.05,C.cream,1.024,1.4,z);A.box(.05,.05,.72,C.cream,1.024,1.65,-.17);A.box(.05,.05,.72,C.cream,1.024,1.15,-.17);
    A.box(.40,.21,.06,C.iron,.68,2.15,F+.02);for(let i=0;i<4;i++)A.box(.33,.015,.015,C.leaf,.68,2.08+i*.045,F+.059);
  }));
  const roofPanel=grp();roofPanel.add(batch('shed-retracting-roof',A=>{A.box(1.98,.13,1.72,C.tile,0,2.53,0,.055);for(let x=-.95;x<1;x+=.23)A.box(.03,.035,1.68,C.tileD,x,2.61,.01,.055,0,0,.008);}));f.add(roofPanel);
  const pv=grp();put(pv,-.55,.19,F+.075);pv.add(batch('shed-door',A=>{
    A.box(1.08,2.02,.08,C.greenL,.54,1.01,0);for(let i=0;i<5;i++)A.box(.024,1.92,.023,C.green,.108+i*.215,1.01,.052,0,0,0,.007);
    for(const y of [.18,1.83])A.box(.92,.065,.035,C.leaf,.54,y,.068);A.bar([.13,.25,.07],[.95,1.75,.07],.035,C.leaf);A.box(.06,.17,.04,C.iron,.93,1.0,.082);A.add(G.sph(.032,8,5),C.gold,.94,1.0,.12);
  }));f.add(pv);const p=f.part('door',[pv,roofPanel],t=>{pv.rotation.y=-1.82*t;roofPanel.position.z=-1.12*t;},{label:'알람시계 창고 문',sfx:'door',dur:1.2});p.lockable=true;p.lockKind='code';p.lockAt={parent:pv,x:.94,y:.89,z:.13};f.lockAt=p.lockAt;
  const s=f.spot('inside',null,.26,.32,.22,{part:p,maxH:.5,label:'창고 안 아래 칸'});(f.live??=[]).push(f.pullOut(p,s,F+.05,{w:.45,d:.38,color:C.wood}));
  const ss=f.spot('inside',null,.02,.98,-.30,{part:p,maxH:.45,label:'창고 안 선반'});(f.live??=[]).push(f.pullOut(p,ss,F+.06,{w:.4,d:.32,color:C.wood}));
  f.spot('on',null,-.78,.17,1.01,{maxH:.34,label:'창고 문턱 옆'});f.add(put(textPanel('창고',.47,.18,{bg:C.cream,fg:C.woodD,size:52}),0,2.33,F+.025));
  // Main recipe 23: this lever is physically behind the coded door. It controls the separate shutter/bag bay.
  const mount=grp();put(mount,0,0,.07);mount.add(batch('shed-lever-mount',A=>{A.box(.63,.96,.08,C.cream,.42,1.09,.48);A.box(.09,.46,.02,C.woodD,.42,1.10,.532);A.add(G.cyl(.08,.08,.09,14),C.gold,.42,.95,.56,HP);}));f.add(mount);
  const lever=grp();put(lever,.42,.95,.68);lever.add(batch('shed-main-lever',A=>{A.bar([0,0,0],[0,.38,0],.037,C.iron);A.add(G.sph(.115,12,8),C.orange,0,.41,0);}));f.add(lever);
  // The real bearing plate is a touchable control; preserve its independently turning lever in the static baker.
  const control=grp();control.add(mount,lever);f.add(control);
  const main=f.part('slide',[control,lever],t=>{lever.rotation.z=-1.25*Math.min(1,t/.22);},{label:'창고 레버 → 셔터 → 의자 사이 가방',sfx:'latch',dur:2.8});main.gptMain=true;main.gptPrerequisite=p;main.handle=control;main.gptChain=['창고 안 레버','셔터가 철컥 올라감','의자 둘 사이 가방'];main.gptSounds=[[.08,'latch'],[.24,'ratchet'],[.42,'slide'],[.88,'rustle']];main.gptEndSound='land';main.gptReaction='…의자가 두 개였네.';f.gptMainLever=main;f.gptShedDoor=p;
};
// Closed earthenware pots have an actual thick hollow lip and deep interior, not a solid cylinder under the lid.
B.gpt_alley_jangdok=f=>{
  f.add(batch('jangdok-platform',A=>{A.box(2.12,.15,.96,C.stone,0,.075,0);for(let i=0;i<4;i++)A.box(.47,.03,.82,i%2?C.cream:C.mortar,-.78+i*.52,.16,0);}));
  for(const [i,x,z,r,h]of [[0,-.65,.05,.35,.82],[1,.1,-.10,.29,.68],[2,.68,.13,.24,.53]]){
    f.add(batch('onggi-body|'+i,A=>{
      A.add(G.lathe([[r*.56,0],[r*.80,.07],[r*.98,h*.34],[r,h*.5],[r*.88,h*.78],[r*.69,h*.94],[r*.69,h],[r*.54,h],[r*.54,h*.86],[r*.72,h*.65],[r*.78,h*.30],[r*.55,.09],[0,.09]],22),C.brown,x,.18,z);
      A.add(G.cyl(r*.56,r*.56,.025,18),C.brownD,x,.28,z);A.add(G.tor(r*.625,.033,22),C.brownD,x,.18+h-.006,z,HP);
      for(const y of [.18+h*.29,.18+h*.62])A.add(G.tor(r*(y<.18+h*.5?.96:.97),.012,22),C.orange,x,y,z,HP);
    }));
    const lid=grp();put(lid,x,.18+h+.017,z);lid.add(batch('onggi-lid|'+i,A=>{A.add(G.cyl(r*.75,r*.79,.065,22),C.brownD,0,.028,0);A.add(G.sph(r*.75,16,7),C.brown,0,.057,0,0,0,0,[1,.23,1]);A.add(G.sph(.045,9,6),C.brownD,0,.11,0);}));f.add(lid);
    const p=f.part('lift',lid,(t,b)=>{lid.position.y=b.p.y+.4*t;lid.position.x=b.p.x+(i===0?-.2:.2)*t;lid.rotation.z=(i===0?.5:-.5)*t;},{label:['큰 장독 뚜껑','중간 장독 뚜껑','작은 장독 뚜껑'][i],sfx:'lift'});
    const s=f.spot('inside',null,x,.34,z,{part:p,maxH:.4,label:'장독 속',scale:i===2?.7:.85});s.reserved=true;(f.live??=[]).push(f.pullOut(p,s,0,{w:r*.85,d:r*.85,color:C.brownD,up:h-.11}));
  }
  f.spot('behind',null,-.26,.025,.88,{maxH:.65,label:'장독대 앞 골목 바닥'});
};
// Two unmistakable moulded plastic chairs: chunky curved backs with actual open vertical slots, four splayed legs.
B.gpt_alley_chair=(f,T,o={})=>{
  const color=o.color||C.red;
  const body=f.add(batch('plastic-chair|'+color,A=>{
    A.box(.66,.11,.62,color,0,.455,.02,0,0,0,.08);A.box(.68,.09,.11,color,0,.485,-.27,0,0,0,.035);
    for(const s of [-1,1]){A.bar([s*.27,.455,-.23],[s*.33,.025,-.32],.047,color);A.bar([s*.27,.455,.25],[s*.33,.025,.35],.047,color);A.bar([s*.27,.475,-.25],[s*.28,1.075,-.30],.055,color);}
    A.box(.67,.14,.10,color,0,1.065,-.30,-.09,0,0,.05);A.box(.61,.075,.08,color,0,.675,-.27);
    for(const x of [-.18,0,.18])A.box(.075,.32,.08,color,x,.855,-.285,-.06);
    // Moulded rim and a small cream worn mark keep the broad silhouette readable.
    A.box(.47,.014,.035,C.wood,0,.516,.22,0,0,0,.007);
  }));f.spot('on',null,0,.525,.12,{maxH:.58,label:color===C.red?'빨간 의자 위':'주황 의자 위'});f.spot('under',null,0,.03,.12,{maxH:.30,label:'플라스틱 의자 밑'}).reserved=true;f.spot('on',null,o.secret?1.06:-.70,.025,o.secret?.58:.55,{maxH:.65,label:'의자 옆 골목 바닥'});
  if(o.secret){
    const drawer=grp();put(drawer,0,.22,.03);drawer.add(batch('chair-secret-drawer',A=>{A.box(.43,.035,.42,C.wood,0,0,0);for(const x of [-.215,.215])A.box(.035,.13,.42,color,x,.055,0);for(const z of [-.205,.205])A.box(.40,.13,.035,color,0,.055,z);A.box(.05,.045,.16,C.cream,.235,.055,0);}));f.add(drawer);
    const floor=grp();drawer.add(floor);floor.add(batch('chair-knitting',A=>{A.box(.37,.02,.34,C.cream,0,.025,0);A.add(G.sph(.075,14,10),C.red,0,.10,0);for(let j=0;j<4;j++)A.add(G.tor(.065,.009,18),C.cream,0,.10,0,.4+j*.35,.4*j);A.bar([-.15,.06,-.08],[.17,.10,.14],.014,C.woodD);A.bar([.16,.06,-.10],[-.18,.10,.14],.014,C.woodD);A.box(.19,.012,.22,C.red,.10,.043,.05);}));
    const secret=f.part('drawer',[body,drawer,floor],t=>{drawer.position.x=.71*Math.min(1,t/.6);drawer.position.z=.03;floor.position.y=.18*Math.max(0,(t-.6)/.4);},{label:'의자 비밀 바닥과 몰래 뜨던 털실',sfx:'drawer',dur:1.5});secret.gptAux=true;secret.gptChain=['의자 아래 서랍','이중바닥 들림','몰래 뜨던 털실'];secret.gptSounds=[[.15,'drawer'],[.66,'thunk']];secret.gptEndSound='rustle';secret.gptReaction='…두 코만 더 뜨면 됐는데.';f.spot('inside',floor,0,.04,0,{part:secret,maxH:.17,label:'의자 이중바닥'}).reserved=true;
  }
};
// A step-through bicycle. Every structural tube terminates at a hub/joint; pedals share the crank axle.
B.gpt_alley_bicycle=f=>{
  const scale=.8;
  const A0=[-.77,.52,0],B0=[.77,.52,0],crank=[-.12,.49,0],seat=[-.37,1.03,0],head=[.40,1.08,0];
  const bicycle=f.add(batch('bicycle',A=>{
    for(const [wx,wy,wz]of [A0,B0]){
      A.add(G.tor(.445,.045,32),C.ink,wx,wy,wz);A.add(G.tor(.395,.016,32),'#c6c393',wx,wy,wz);A.add(G.cyl(.065,.065,.14,12),C.iron,wx,wy,0,HP);
      for(let i=0;i<12;i++){const a=i/12*PI*2;A.bar([wx,wy,.01],[wx+Math.sin(a)*.392,wy+Math.cos(a)*.392,.01],.009,'#a09769',5);}
    }
    const frame=C.green;
    for(const [a,b]of [[A0,seat],[A0,crank],[seat,crank],[crank,[.28,.62,0]],[[.28,.62,0],head],[seat,[.29,.81,0]]])A.bar(a,b,.042,frame,9);
    for(const z of [-.07,.07])A.bar([.46,.98,z],[.77,.52,z],.027,frame,8);
    A.bar(head,[.46,.98,0],.04,frame);A.bar([.46,.98,-.07],[.46,.98,.07],.04,frame);A.bar(head,[.47,1.30,0],.032,C.iron);A.bar([.47,1.30,-.25],[.47,1.30,.25],.028,C.iron);for(const z of [-.26,.26])A.bar([.47,1.30,z],[.35,1.30,z],.036,C.brownD);
    A.bar(seat,[-.40,1.17,0],.026,C.iron);A.box(.35,.09,.23,C.brownD,-.42,1.18,0,0,0,.04,.04);
    // Real chain guard and crankshaft, a lower chain line, opposite crank arms and attached pedals.
    A.add(G.cyl(.12,.12,.03,16),C.iron,crank[0],crank[1],.085,HP);A.add(G.tor(.092,.012,20),'#c6c393',crank[0],crank[1],.11);
    A.bar([-.77,.56,.075],[-.12,.59,.075],.014,C.iron,5);A.bar([-.77,.48,.075],[-.12,.39,.075],.014,C.iron,5);
    A.bar([-.12,.49,-.16],[-.12,.49,.16],.024,'#c6c393');A.bar([-.12,.49,.16],[.03,.33,.16],.023,C.iron);A.bar([-.12,.49,-.16],[-.27,.65,-.16],.023,C.iron);
    A.box(.17,.055,.13,C.iron,.06,.33,.20);A.box(.17,.055,.13,C.iron,-.30,.65,-.20);A.box(.055,.025,.115,C.gold,.12,.34,.20);
    // Rear rack has stays, front basket has a bottom and rim with deliberately open weave.
    A.bar([-.95,.98,-.15],[-.95,.98,.15],.024,C.iron);for(const z of [-.15,.15]){A.bar([-.95,.98,z],[-.45,.98,z],.024,C.iron);A.bar([-.77,.52,z*.45],[-.90,.98,z],.018,C.iron);}
    A.box(.5,.055,.34,C.wood,-.73,1.01,0);A.bar([.49,1.17,0],[.80,1.17,0],.023,C.iron);A.box(.40,.045,.43,C.wood,.81,1.10,0);
    for(const y of [1.14,1.29,1.42]){for(const z of [-.23,.23])A.bar([.59,y,z],[1.03,y,z],.019,C.wood);for(const x of [.59,1.03])A.bar([x,y,-.23],[x,y,.23],.019,C.wood);}
    for(const x of [.59,.70,.81,.92,1.03])for(const z of [-.23,.23])A.bar([x,1.11,z],[x,1.42,z],.014,C.wood);for(const z of [-.11,0,.11])for(const x of [.59,1.03])A.bar([x,1.11,z],[x,1.42,z],.014,C.wood);
    // Kickstand touches the ground, both mudguards follow the wheels, and the light attaches to fork crown.
    A.bar([-.24,.47,-.05],[-.44,.04,.32],.022,C.iron);A.add(G.cyl(.047,.047,.09,10),C.cream,.66,.98,.10,HP);A.add(new THREE.TorusGeometry(.462,.022,5,18,PI),C.cream,-.77,.52,0);A.add(new THREE.TorusGeometry(.462,.022,5,18,PI),C.cream,.77,.52,0);
  }));bicycle.scale.setScalar(scale);f.spot('on',null,.81*scale,1.15*scale,0,{maxH:.28,label:'자전거 앞 바구니',scale:.75});f.spot('behind',null,-.73*scale,1.05*scale,0,{maxH:.22,label:'자전거 짐받이'});
};
// Three individual, thick-walled recycling bins. Lids swing away from the actual empty cavities.
B.gpt_alley_recycling=f=>{
  for(const [i,x,c,label]of [[0,-.61,'#a2c8bb','병'],[1,0,'#c6c393','캔'],[2,.61,'#eecfa3','종이']]){
    f.add(batch('recycle-body|'+i,A=>{
      A.box(.50,.075,.54,c,x,.09,0);for(const sx of [-1,1])A.box(.045,.59,.54,c,x+sx*.23,.405,0);for(const z of [-.25,.25])A.box(.43,.59,.045,c,x,.405,z);
      A.box(.41,.025,.42,'#a09769',x,.14,0);A.box(.28,.19,.025,C.cream,x,.47,.279);
      for(const z of [-.15,.15])A.add(G.cyl(.065,.065,.07,10),C.iron,x-.25,.08,z,0,0,HP);
      for(let j=0;j<3;j++)A.box(.025,.33,.025,C.cream,x-.13+j*.13,.36,-.286);
    }));
    const pv=grp();put(pv,x,.735,-.29);pv.add(batch('recycle-lid|'+i,A=>{A.box(.56,.075,.62,c,0,0,.29);A.box(.18,.05,.065,C.cream,0,.063,.5);}));f.add(pv);
    const p=f.part('lid',pv,t=>{pv.rotation.x=-1.8*t;},{label:label+' 분리수거함',sfx:'open'});const s=f.spot('inside',null,x,.18,0,{part:p,maxH:.38,label:label+' 분리수거함 안',scale:.8});s.reserved=true;(f.live??=[]).push(f.pullOut(p,s,0,{w:.34,d:.32,color:C.cream,up:.55}));
    f.add(put(textPanel(label,.20,.13,{bg:C.cream,fg:C.iron,size:58}),x,.48,.297));
  }
  f.spot('behind',null,.85,.03,-.32,{maxH:.36,label:'분리수거함 뒤'});
};
// A single quiet domestic motif in the foreground rather than a wall-to-wall pile of clutter.
B.gpt_alley_living=f=>{
  f.add(batch('outdoor-table-and-plants',A=>{
    A.box(1.0,.09,.59,C.wood,0,.735,0);for(const x of [-.40,.40])for(const z of [-.22,.22])A.box(.07,.685,.07,C.woodD,x,.3475,z);
    A.add(G.cyl(.19,.19,.035,20),C.cream,-.22,.80,.02);A.add(G.sph(.11,12,7),C.gold,-.22,.865,.02,0,0,0,[1,.55,1]);
    A.add(G.cyl(.075,.06,.16,14),C.white,.21,.86,-.03);A.add(G.tor(.048,.013,14),C.white,.29,.875,-.03,0,HP);A.add(G.cyl(.058,.058,.01,14),C.brownD,.21,.946,-.03);
    pot(A,.8,0,-.16,.19,.29,true);pot(A,-.84,0,.1,.17,.25,false);
  }));f.spot('on',null,.06,.795,.16,{maxH:.32,label:'작은 마당 탁자 위'});f.spot('under',null,0,.04,0,{maxH:.47,label:'마당 탁자 아래'});
};
// Water-meter box: orange control lever → connecting gear/rack → sliding grate → rising clue tray.
// This is a functional Furn part, so generic taps, reversing, sound and future locks all work unchanged.
B.gpt_alley_waterlever=f=>{
  f.add(batch('water-meter-body',A=>{
    A.box(1.08,.08,.92,C.stone,0,.05,0);A.box(1.08,.31,.065,C.greenL,0,.235,-.43);A.box(1.08,.31,.065,C.greenL,0,.235,.43);for(const x of [-.505,.505])A.box(.07,.31,.80,C.greenL,x,.235,0);
    A.box(.91,.018,.75,'#a09769',0,.10,0);for(const x of [-.56,.56])A.box(.055,.065,1.52,C.iron,x,.42,.30);
    // A real pipe, valve body and gauge occupy the back/left, leaving the front/right tray cavity clear.
    A.bar([-.35,.13,-.30],[-.35,1.03,-.30],.065,'#c6c393',10);A.bar([-.35,1.03,-.30],[-.08,1.03,-.30],.065,'#c6c393',10);A.add(G.cyl(.10,.10,.17,12),C.iron,-.35,.80,-.30);
    A.box(.45,.29,.13,C.cream,-.30,1.11,-.27);A.add(G.cyl(.09,.09,.035,18),C.white,-.30,1.11,-.185,HP);A.bar([-.30,1.11,-.158],[-.35,1.16,-.158],.012,C.red,5);
    // A low guide housing and fixed toothed rail make the transfer from lever to cover visually explicit.
    A.box(.16,.40,.18,C.iron,.36,.61,-.35);for(let i=0;i<8;i++)A.box(.025,.035,.06,C.gold,.31,.45+i*.045,-.24);
  }));
  const lever=grp();put(lever,-.35,.80,-.18);lever.add(batch('water-orange-lever',A=>{A.add(G.cyl(.055,.055,.09,12),C.gold,0,0,0,HP);A.bar([0,0,.065],[.04,.36,.065],.035,C.iron);A.add(G.sph(.10,12,7),C.orange,.04,.39,.065);}));f.add(lever);
  const pinion=grp();put(pinion,.34,.67,-.21);pinion.add(batch('water-pinion',A=>{A.add(G.cyl(.13,.13,.055,16),C.gold,0,0,0,HP);for(let i=0;i<10;i++){const a=i/10*PI*2;A.box(.045,.065,.055,C.gold,Math.cos(a)*.13,Math.sin(a)*.13,0,0,0,a-HP,.008);}}));f.add(pinion);
  const rack=grp();put(rack,.44,.41,-.20);rack.add(batch('water-rack',A=>{A.box(.075,.40,.06,C.cream);for(let i=0;i<8;i++)A.box(.05,.025,.06,C.gold,-.045,-.165+i*.045,0);}));f.add(rack);
  const cover=grp();put(cover,0,.42,0);cover.add(batch('water-sliding-grate',A=>{for(const z of [-.41,.41])A.box(1.02,.07,.065,C.iron,0,0,z);for(const x of [-.48,.48])A.box(.06,.07,.78,C.iron,x,0,0);for(let i=0;i<6;i++)A.box(.075,.045,.74,C.iron,-.375+i*.15,0,0);A.box(.28,.06,.08,C.gold,0,.055,.30);}));f.add(cover);
  const phase=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
  const p=f.part('slide',[lever,pinion,rack,cover],t=>{lever.rotation.z=-1.1*phase(t,0,.12);pinion.rotation.z=1.24*phase(t,.12,.40);rack.position.y=.41+.16*phase(t,.12,.40);cover.position.z=.83*phase(t,.35,.65);},{label:'수도 레버 → 톱니 → 미닫이 비밀함',sfx:'door',dur:2.8});
  p.gptMain=true;p.gptChain=['주황 레버','맞물린 톱니와 랙','미닫이 덮개','이중바닥 장화와 시계 쪽지'];
  p.gptSounds=[[.13,'ratchet'],[.36,'slide'],[.68,'lift_metal'],[.94,'blub']];p.gptEndSound='land';
  p.gptReaction='…내 장화가 왜 거기서 나와?';p.gptFunny=p.gptReaction;

  const spot=f.spot('inside',null,.10,.13,.10,{part:p,maxH:.24,label:'수도 계량함 비밀 트레이'}),tray=f.pullOut(p,spot,0,{w:.65,d:.51,color:C.cream,up:.34});(f.live??=[]).push(tray);const a=p.apply;p.apply=(t,...b)=>{a(t,...b);tray.position.z=.10+.65*t;};
  const clueSpot=f.spot('inside',null,-.05,.105,-.14,{part:p,maxH:.12,label:'계량함 이중바닥의 시계 쪽지'});const clueTray=f.pullOut(p,clueSpot,0,{w:.67,d:.49,color:C.stone,up:.35});f.live.push(clueTray);const open=p.apply;p.apply=(t,...b)=>{open(t,...b);const rise=phase(t,.65,1);tray.position.y=.13+.34*rise;tray.position.z=.10+.65*rise;clueTray.position.y=.105+.35*rise;};
  // The forgotten single rain boot fits below the closed grate, then rides up beside the actual instruction note.
  // Its cuff has a real dark opening. A small toe peeking through the grate supplies anticipation without a sparkle hint.
  const boot=grp();put(boot,-.29,.012,0);boot.add(batch('meter-lost-rainboot',A=>{
    A.box(.16,.025,.30,C.woodD,0,.013,.035,0,0,0,.025);A.box(.16,.065,.29,C.orange,0,.055,.035,0,0,0,.045);
    A.add(G.cyl(.076,.068,.17,12,true),C.orange,0,.15,-.055);A.add(G.cyl(.058,.058,.012,12),C.brownD,0,.085,-.055);A.add(G.tor(.076,.014,18),C.cream,0,.235,-.055,HP);
    A.box(.045,.10,.015,C.red,0,.15,.019);A.box(.075,.025,.035,C.cream,0,.075,.168);
  }));clueTray.add(boot);
  f.add(put(textPanel('수도 계량함',.62,.15,{bg:C.cream,fg:C.iron,size:40}),0,.26,.468));
};
// Separate spatial ownership keeps the remote shutter from making one solid collision box across the entire alley.
B.gpt_alley_bagbay=f=>{
  f.collideBox=[-.72,0,-.53,.72,.90,.53];
  f.add(batch('bagbay-shell',A=>{A.box(1.42,.10,1.03,C.stone,0,.05,0);for(const x of [-.675,.675]){A.box(.07,.74,.96,C.cream,x,.43,0);A.box(.07,.76,.07,C.iron,x,.46,.50);}A.box(1.40,.69,.055,C.cream,0,.40,-.48);A.box(1.48,.20,.35,C.green,0,.85,.38);A.add(G.cyl(.075,.075,1.36,16),C.iron,0,.78,.42,0,0,HP);}));
  const slats=[];for(let i=0;i<8;i++){const slat=grp();slat.add(batch('bagbay-slat',A=>{A.box(1.28,.073,.055,C.greenL);A.box(1.27,.013,.015,C.green,0,-.027,.034);}));f.add(slat);slats.push(slat);}
  const bag=grp();put(bag,0,.105,0);bag.add(batch('two-chair-bag',A=>{A.box(1.0,.06,.72,C.green,0,.03,0);for(const x of [-.47,.47])A.box(.055,.40,.68,C.greenL,x,.23,0);for(const z of [-.335,.335]){A.box(.90,.40,.045,C.greenL,0,.23,z);A.add(new THREE.TorusGeometry(.19,.026,6,18,PI),C.woodD,0,.41,z);}A.box(.89,.025,.61,C.cream,0,.07,0);A.box(.24,.18,.026,C.cream,0,.25,.363);A.add(G.sph(.03,8,5),C.red,0,.25,.383);}));f.add(bag);
  const part=f.part('shutter',[...slats,bag],t=>{const opening=Math.max(0,Math.min(1,(t-.22)/.48));slats.forEach((slat,i)=>{const path=.14+i*.078+.74*opening;if(path<=.73){slat.position.set(0,path,.505);slat.rotation.x=0;slat.visible=true;}else{const a=(path-.73)/.10;slat.position.set(0,.73+Math.sin(Math.min(a,PI))*.1,.405+Math.cos(Math.min(a,PI))*.1);slat.rotation.x=-Math.min(a,PI);slat.visible=a<PI;}});bag.position.y=.105+.01*Math.sin(PI*Math.max(0,(t-.72)/.28));bag.position.z=.25*Math.max(0,Math.min(1,(t-.70)/.30));},{label:'창고 레버가 여는 의자 사이 셔터',sfx:'slide',dur:2.8});part.gptRemote=true;part.gptMainReward=true;
  const spot=f.spot('inside',bag,0,.12,.03,{part,maxH:.50,label:'의자 두 개 사이 가방 안'});spot.gptMainReward=true;spot.reserved=true;f.gptBagPart=part;f.gptBagGroup=bag;f.gptBagSpot=spot;part.setOpen(0);
};
export function bindGptAlleyRecipe(room){
  const furns=(room.rooms||[room]).flatMap(R=>R.furns||[]),shed=furns.find(r=>r.type==='gpt_alley_shed')?.f,bay=furns.find(r=>r.type==='gpt_alley_bagbay')?.f;
  if(!shed?.gptMainLever||!bay?.gptBagPart)return null;const main=shed.gptMainLever,remote=bay.gptBagPart,spot=bay.gptBagSpot;
  if(!main.gptBound){const apply=main.apply;main.apply=(t,...b)=>{apply(t,...b);remote.setOpen(t);};main.gptBound=true;main.spots.push(spot);spot.part=main;remote.gptController=main;remote.gptPrerequisite=main;main.gptMainRewardSpot=spot;main.gptFocusObjects=[main.handle,bay.group];}
  return {main,door:shed.gptShedDoor,bagPart:remote,bagSpot:spot,bagGroup:bay.gptBagGroup};
}
export const GPT_ALLEY_BUILDERS=B;
export const GPT_ALLEY_INFO={
  gpt_alley_context:{w:1,d:1,name:'계속되는 동네 골목',hidden:true,price:0},
  gpt_alley_house:{w:3,d:2,name:'삐딱이네 집과 알람시계',price:0},
  gpt_alley_yardgate:{w:3,d:1,name:'돌길 마당 대문',price:0},
  gpt_alley_shed:{w:2,d:2,name:'속이 있는 시계 창고',price:0},
  gpt_alley_jangdok:{w:2,d:1,name:'뚜껑 열리는 장독대',price:0},
  gpt_alley_chair:{w:1,d:1,name:'플라스틱 의자',price:0},
  gpt_alley_bicycle:{w:2,d:1,name:'생활 자전거',price:0},
  gpt_alley_recycling:{w:2,d:1,name:'세 가지 분리수거함',price:0},
  gpt_alley_living:{w:2,d:1,name:'골목의 작은 티타임',price:0},
  gpt_alley_waterlever:{w:1,d:1,name:'톱니 레버 수도 비밀함',price:0},
  gpt_alley_bagbay:{w:1,d:1,name:'의자 사이 셔터와 가방',price:0}
};
// (색 다시 맞춤 ① 10/22: 베이지 바닥·벽 → 회색 포장·중성 벽·하늘 배경)
export const GPT_ALLEY_THEME={name:'삐딱이네 생활 골목',friend:'grumpy',bg:['#fef2e1','#f2dcbc'],base:C.road,floorKind:'asphalt',floor:C.road,floor2:'#eecfa3',asphalt:C.road,wall:C.plaster,wall2:C.brick,trim:C.cream,wood:C.wood,woodD:C.woodD,accent:C.green,accent2:'#b0e5e8',accent3:C.gold,light:{ambColor:'#fff0e2',amb:1.4,sunColor:'#fff3e0',sun:2.2,shadow:.63}};
export function createGptAlleyMap(theme){
  const F=(type,x,z,a=0,opts={})=>({type,x,z,a,opts}),T={...theme,...GPT_ALLEY_THEME};
  return {theme:T,fitW:10.9,friendAt:[.15,.35],rooms:[{at:[0,0],layout:{theme:T,w:8,d:7,bleed:{size:15},slab:'none',exact:true,walls:{N:'none',W:'none',E:'none',S:'none'},furniture:[
    F('gpt_alley_context',0,0),F('gpt_alley_house',-2.36,-2.90),F('gpt_alley_yardgate',.35,-1.93),F('gpt_alley_shed',2.74,-2.62),
    F('gpt_alley_jangdok',-2.62,-.93),F('gpt_alley_recycling',2.88,.05,-.08),F('gpt_alley_bicycle',1.58,1.62,-.13),
    F('gpt_alley_bagbay',-1.55,2.30),F('gpt_alley_living',-1.61,1.28,.12),F('gpt_alley_chair',-2.84,2.25,.42,{color:C.red}),F('gpt_alley_chair',-.26,2.23,-.38,{color:C.orange,secret:true})
  ],decor:[],friendAt:[.15,.35]}}]};
}
