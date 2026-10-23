// GPT workshop: a lived-in spring station. All labels are planar decals; all cabinets are hollow.
import * as THREE from 'three';
import { put, grp, mat, plane, canvasTex, texCache, STYLE, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { STATION_BUILDERS } from './station-props.js';
import { ChibiCat } from './cat.js';
import { buildStationRail, STATION_RAIL_INFO } from './gptsakura-rail.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)

const B = {}, HP = Math.PI / 2;
B.gpt_stationlocal = buildStationRail;
const C = { cream: '#fef2e1', mint: '#a2c8bb', teal: '#649b88', dark: '#644936', wood: '#c67f2a', pale: '#f2dcbc', steel: '#b8b39e', pink: '#f3967a', ink: '#6f4b30' };
const labels = texCache();
function label(parent, text, w, h, x, y, z, bg = C.cream, fg = C.ink, size = 56, paper = false) {
  const cw=512,ch=Math.max(64,Math.round(cw*h/w));
  const tx = labels.get(['fit-ko-v3',text,bg,fg,size,cw,ch].join('|'), () => canvasTex(cw,ch, (c,W,H) => {
    c.fillStyle = bg; c.fillRect(0,0,W,H); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = text.split('\n').map(t => tr(t));   // (영어 화면에선 영어, ① 10/22)
    let fs=Math.max(1,Math.floor(Math.min(size*2,H*.8/(lines.length*1.25))));
    const font=()=>{c.font=`700 ${fs}px "Ssurround", "Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;};
    font();
    while(fs>1&&lines.some(t=>c.measureText(t).width>W*.8)){fs--;font();}
    lines.forEach((t,i) => c.fillText(t,W/2,H/2+(i-(lines.length-1)/2)*fs*1.25));
  }));
  const panel=put(plane(w,h,mat('#ffffff',{map:tx})),x,y,z);
  if(paper){
    // A gently curled lower corner, with two real tape strips above the printed safe area.
    panel.geometry=new THREE.PlaneGeometry(w,h,8,8);
    const pos=panel.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const corner=Math.max(0,(pos.getX(i)/w-.23)/.27)*Math.max(0,(-pos.getY(i)/h-.23)/.27);
      pos.setZ(i,.035*corner*corner);
    }
    panel.geometry.computeVertexNormals();
    for(const sx of[-1,1])panel.add(mc(`gpt-paper-tape|${w}|${h}|${sx}`,({add})=>add(G.box(w*.17,h*.045,.012,.003),C.pale,sx*w*.29,h*.47,.012,0,0,sx*.1)));
  }
  parent.add(panel); return panel;
}
function bottle(add,x,y,z,col,s=1) {
  add(G.cyl(.036*s,.04*s,.18*s,10),col,x,y+.09*s,z);
  add(G.cyl(.018*s,.020*s,.07*s,8),col,x,y+.215*s,z);
  add(G.cyl(.022*s,.022*s,.025*s,8),C.cream,x,y+.26*s,z);
  add(G.cyl(.041*s,.041*s,.07*s,10),'#fef2e1',x,y+.1*s,z);
}

B.gpt_stationworld = f => {
  // These are scenery, never navigation floors. Room.w/d alone define the playable camera bounds.
  f.collideBox = [0,-.1,0,0,0,0]; f.noSolid = true;
  // Only nearby structures block walkers; the town/fields never become one enormous obstacle.
  const fences = [[-5.7,-3.59],[-1.41,2.5]];
  const gardens = [[-5.3,1.55],[-4.35,1.55],[-3.4,3.1],[-2.45,3.1],[-1.5,3.1],[-.55,3.1],[.4,3.1]];
  f.walkBoxes = [
    ...fences.map(([a,b]) => [a-.04,0,.95,b+.04,.67,1.03]),
    ...gardens.map(([x,z]) => [x-.35,-.05,z-.263,x+.35,.41,z+.263]),
  ];
  const far = grp(); f.add(far); (f.live ||= []).push(far);
  const town = mc('gpt-station-town-v3',({add,tube}) => {
    // A continuous crossing street and low-detail homes beyond the platform.
    add(G.pbox(2.1,.025,34),'#e8d7b7',3.65,.002,0);
    for (const x of [2.5,4.8]) add(G.pbox(.18,.045,34),'#f6e0bf',x,.011,0);
    for (let z=-15;z<17;z+=1.5) add(G.pbox(.07,.01,.65),'#fef2e1',3.65,.021,z);
    add(G.pbox(40,.025,1.08),'#c6c393',0,.006,0);
    // The existing train builder owns the central 10.2m of track.
    for(const [a,b] of [[-20,-6.15],[4.15,20]]) {
      const mid=(a+b)/2,L=b-a;
      for (const z of [-.3,.26]) add(G.pbox(L,.05,.045),'#b8b39e',mid,.085,z);
      for(let x=a+.16;x<b;x+=.48) add(G.pbox(.13,.035,.84),'#a09769',x,.045,-.02);
    }
    const homes=[[-7,-10.5,2.3,2.1,'#feebc8','#84ae9d'],[-3.6,-11.5,2.5,2.6,'#f2dcbc','#c6c393'],[.2,-11,2.1,1.9,'#f6e0bf','#a2c8bb'],[7.4,-10,2.5,2.5,'#fef2e1','#84ae9d'],[8.3,3.5,2.6,1.8,'#feebc8','#84ae9d'],[-8.5,4.8,2.4,2,'#f6e0bf','#a2c8bb']];
    for (const [x,z,w,h,col,roof] of homes) {
      add(G.pbox(w,h,1.8),col,x,h/2-.02,z);
      for(const s of [-1,1]) add(G.pbox(w+.2,.12,1.15),roof,x,h+.25,z+s*.47,s*.31,0,0);
      for(const xx of [-.58,.4]) { add(G.pbox(.48,.55,.025),'#b0e5e8',x+xx,h*.6,z+.913); add(G.pbox(.53,.06,.1),'#eecfa3',x+xx,h*.6-.3,z+.95); }
      add(G.pbox(.55,1.12,.035),'#c67f2a',x+.2,.56,z+.925);
      for(const sx of [-1,1]) add(G.pbox(.07,.7,.03),col,x+sx*.65,h*.6,z+.935);
      add(G.pbox(w+.8,.35,.18),'#c6c393',x,.16,z+1.45);
    }
    for(const [x,z] of [[-6.5,-3.8],[6,-3],[7,1],[-7,2.5],[-10,-8],[10,-9]]) {
      add(G.cyl(.075,.09,2.6,8),'#a09769',x,1.3,z);
      add(G.sph(.8,8,6),'#c6c393',x,2.5,z,0,0,0,[1,.8,1]);
      add(G.sph(.6,8,6),'#c6c393',x+.42,2.8,z+.1);
    }
    for(const [x,z] of [[-6,-2],[6,-2],[6,6],[-10,0]]) {
      add(G.cyl(.065,.09,3.6,8),'#a09769',x,1.8,z); add(G.pbox(1.0,.08,.08),'#84ae9d',x,3.3,z);
      tube([x,3.33,z],[x,3.12,z+7],.009,'#a09769',4);
    }
    // Low agricultural plots and drainage ditch carry the ground past the front of the phone view.
    for(let k=0;k<4;k++) add(G.pbox(6,.025,.55),k%2?'#c6c393':'#c6c393',-2,-.016,5+k*.8);
    add(G.pbox(18,.035,.48),'#a2c8bb',-2,-.025,9.2);
  });
  town.traverse(o=>{if(o.isMesh){o.layers.set(2);o.castShadow=false;o.receiveShadow=false;o.userData.noMerge=true;o.userData.noOcclude=true;}});
  // Distance haze is evaluated in world units, with no extra transparent draw pass.
  town.material = new THREE.MeshBasicMaterial({vertexColors:true});
  town.material.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 gptWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngptWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 gptWorld;').replace('#include <opaque_fragment>','float haze=smoothstep(4.0,13.0,length(gptWorld.xz)); outgoingLight=mix(outgoingLight,vec3(0.91,0.84,0.70),haze*.92);\n#include <opaque_fragment>');
  };
  town.material.customProgramCacheKey=()=> 'gptstation-distance-haze-v1'; far.add(town);
  // The foreground is a garden adjoining the town, rather than a ring around a table-top island.
  f.add(mc('gpt-station-near-v4',({add,tube})=>{
    // The 2.10m opening clears the whole cabinet, including its moving crank/wing.
    for(const [a,b] of fences) {
      const n=Math.ceil((b-a)/.68),step=(b-a)/n;
      for(let k=0;k<=n;k++) add(G.pbox(.08,.67,.08),C.cream,a+k*step,.335,.99);
      for(let k=0;k<n;k++) for(const y of [.24,.54]) add(G.pbox(step-.05,.065,.06),C.pale,a+(k+.5)*step,y,.99);
    }
    for(const [x,z] of gardens) {
      add(G.sph(.35,8,5),'#84ae9d',x,.18,z,0,0,0,[1,.65,.75]);
      for(let k=0;k<3;k++) add(G.sph(.045,6,4),k%2?'#f3967a':'#feebc8',x-.15+k*.15,.36,z-.05);
    }
    // The actual 0.12 / 0.24 / 0.36m platform stairs are supplied by Room.buildRaised.
    // A small roadside drainage grate, and the crossing's timber infill between rails.
    for(let k=0;k<5;k++) add(G.pbox(.4,.018,.025),'#a09769',4.78,.01,1.1+k*.065);
    for(let k=0;k<5;k++) add(G.pbox(.18,.04,.48),'#c67f2a',3.25+k*.2,.055,-.02);
  }));
};

B.gpt_stationoffice = f => {
  f.collideBox=[-.96,0,-.58,.96,2.35,.6];
  f.add(mc('gpt-station-office-v2',({add,tube})=>{
    add(G.box(1.96,.14,1.3,.035),C.pale,0,.07,0);
    add(G.box(1.9,2.2,.09,.025),C.cream,0,1.24,-.58);
    for(const x of [-.92,.92]) {add(G.box(.1,2.2,1.25,.025),C.cream,x,1.24,0);add(G.box(.12,.7,1.27,.02),C.mint,x,.5,0);}
    // Ticket hatch has a deep counter and real ledgers behind it; doorway beside it is fully open.
    add(G.box(.9,.78,.08,.02),C.mint,-.4,.52,.55);
    add(G.box(1.08,.12,.4,.025),C.wood,-.4,.89,.55);
    add(G.box(1.84,.24,.12,.03),C.cream,0,2.31,.55);
    for(const x of [-.91,.12,.91]) add(G.box(.085,2.2,.12,.025),C.teal,x,1.24,.55);
    add(G.box(.85,.07,.15,.025),C.teal,-.4,1.67,.55);
    add(G.box(.65,.08,.32,.018),C.wood,-.45,.92,-.24);
    for(let k=0;k<3;k++) add(G.box(.13,.28,.18,.012),['#c67f2a','#84ae9d','#eaa440'][k],-.68+k*.18,1.1,-.25);
    add(G.box(.28,.13,.23,.025),C.dark,-.36,1.015,.53);
    for(const s of [-1,1]) add(G.box(2.15,.12,.83,.035),s>0?'#84ae9d':'#649b88',0,2.56,s*.34,s*.28,0,0);
    add(G.box(2.22,.1,.12,.04),C.teal,0,2.68,0);
    for(let x=-.95;x<1;x+=.23) for(const s of [-1,1]) tube([x,2.63,0],[x,2.41,s*.74],.013,'#a2c8bb',5);
    // Notice board, sturdy doormat and a little kettle in the open office.
    add(G.box(.5,.62,.035,.02),C.wood,.48,1.27,-.52);
    add(G.box(.57,.035,.42,.025),'#a09769',.51,.16,.25);
    add(G.cyl(.11,.13,.17,12),'#eecfa3',-.7,1.045,-.2);
  }));
  // The window awning clears the open doorway; its petal still tumbles onto the counter.
  const awning=grp();put(awning,-.4,1.79,.45);f.add(awning);
  awning.add(mc('gpt-station-office-awning',({add})=>{
    add(G.box(1.04,.065,.59,.025),C.pale,0,0,.27);
    for(let k=0;k<5;k++)add(G.box(.11,.012,.57,.006),k%2?C.cream:'#f8b15b',-.4+k*.2,.04,.27);
    add(G.box(1.08,.12,.06,.02),C.wood,0,-.04,.55);
    add(G.box(.20,.17,.08,.025),C.mint,.66,-.12,.05);
  }));
  const petal=grp();put(petal,-.15,1.85,.70);f.add(petal);
  petal.add(mc('gpt-awning-petal',({add})=>{for(let k=0;k<5;k++){const a=k*Math.PI*2/5;add(G.sph(.055,7,5),C.pink,Math.cos(a)*.05,0,Math.sin(a)*.05,0,0,0,[1,.3,1]);}}));
  const aw=f.part('lift',[awning,petal],t=>{awning.rotation.x=-.82*t;petal.position.set(-.15+.12*Math.sin(t*Math.PI),1.85-.83*t,.70+.12*t);petal.rotation.z=t*6;},{label:'역 차양 손잡이',sfx:'rustle',dur:.7});
  aw.noHide=true;aw.gptAuxiliary='clue-reveal';aw.handle=awning;
  label(f.group,'벚꽃역',1.35,.22,0,2.31,.626,C.cream,C.teal,53);
  label(f.group,'잠시\n자리 비움',.39,.48,.48,1.27,-.488,C.cream,C.dark,42,true);
  f.gptSizeAudit={counterTop:.95,doorClearHeight:2.05};
  f.gptSmallAudit=[{label:'장부',height:.28,width:.13,depth:.18},{label:'주전자',height:.17,width:.26,depth:.26},{label:'역무실 안내 종이',height:.48,width:.39,depth:.035}];
  f.spot('on',null,-.62,.96,.6,{maxH:.65,label:'매표소 카운터'});
  f.spot('inside',null,.5,.16,.05,{maxH:.6,label:'역무실 안'});
};

B.gpt_sakuragate = f => {
  f.add(mc('gpt-ticket-gate-v1',({add})=>{
    for(const x of [-.62,.62]) {
      if(x<0) add(G.box(.42,.85,.76,.065),C.mint,x,.425,0);
      else {
        for(const s of [-1,1]) add(G.box(.05,.85,.76,.02),C.mint,x+s*.185,.425,0);
        add(G.box(.36,.85,.06,.02),C.mint,x,.425,-.35);
        add(G.box(.4,.09,.76,.025),C.teal,x,.045,0);
      }
      add(G.box(.46,.1,.79,.04),C.cream,x,.88,0);
      add(G.box(.2,.055,.23,.025),C.dark,x,.951,-.13);
      add(G.box(.12,.014,.09,.008),'#a2c8bb',x,.983,-.13);
      add(G.box(.17,.03,.018,.005),C.dark,x,.954,.2);
      add(G.box(.13,.18,.025,.015),'#feebc8',x,.65,.395);
    }
  }));
  const flap=grp();put(flap,-.43,.52,.22);f.add(flap);
  flap.add(mc('gpt-ticket-flap',({add})=>add(G.box(.45,.32,.07,.06),C.teal,.2,0,0)));
  const crank=grp();put(crank,-.62,.59,.47);f.add(crank);
  crank.add(mc('gpt-gate-crank',({add})=>{
    add(G.cyl(.14,.14,.055,14),C.wood,0,0,0,HP,0,0);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;add(G.box(.055,.065,.06,.012),C.wood,Math.cos(a)*.15,Math.sin(a)*.15,0,0,0,a);}
    add(G.box(.08,.32,.05,.025),C.teal,0,.13,.05);
    add(G.cyl(.06,.06,.16,12),'#f3967a',0,.28,.12,HP,0,0);
  }));
  const flag=grp();put(flag,.62,1.08,-.2);f.add(flag);
  flag.add(mc('gpt-gate-flip-flag',({add})=>{
    add(G.box(.32,.22,.07,.035),'#f3967a',0,0,0);
    add(G.box(.22,.14,.014,.02),'#84ae9d',0,0,-.045);
    add(G.box(.17,.035,.014,.008),C.cream,0,0,.045);
    add(G.box(.035,.15,.014,.008),C.cream,0,0,.046);
  }));
  const tray=grp();put(tray,.62,.39,.36);f.add(tray);
  tray.add(mc('gpt-gate-ticket-tray',({add})=>{
    add(G.box(.34,.045,.46,.015),C.pale,0,0,-.19);
    for(const s of [-1,1])add(G.box(.025,.16,.46,.008),C.wood,s*.16,.07,-.19);
    add(G.box(.35,.23,.04,.02),C.mint,0,.07,.03);
    add(G.box(.14,.035,.035,.012),C.teal,0,.1,.067);
  }));
  const stage=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
  const p=f.part('wheel',[crank,flap,flag,tray],t=>{
    crank.rotation.z=-Math.PI*2*stage(t,0,.65);
    flag.rotation.y=Math.PI*stage(t,.25,.5);
    flap.rotation.y=-HP*stage(t,.4,.75);
    tray.position.z=.36+.52*stage(t,.7,1);
  },{label:'개찰구 크랭크',sfx:'ratchet',dur:1.45});
  p.gptDevice='ticketgate';p.handle=crank;
  const clue=label(flag,'03',.24,.14,0,0,-.066,C.cream,C.teal,90);clue.rotation.y=Math.PI;clue.visible=false;
  (f.live ||= []).push(clue);f.gptClue=clue;
  f.gptConsequence={kind:'flipped-clue',clue:'03',meaning:'승차권의 3번 승강장'};
  f.spot('inside',tray,0,.035,-.17,{part:p,maxH:.29,label:'개찰구 비밀 표 서랍',scale:1});
};

B.gpt_stationvending = f => {
  const W=1.05,D=.67,H=1.88;
  f.add(mc('gpt-vending-cabinet-v2',({add})=>{
    add(G.box(W,.12,D,.035),C.teal,0,.08,0);
    add(G.box(W,.12,D,.035),C.cream,0,H,0);
    add(G.box(W-.04,H-.18,.065,.02),C.mint,0,H/2,-D/2+.025);
    for(const s of [-1,1]) add(G.box(.07,H-.14,D,.025),C.cream,s*(W/2-.035),H/2,0);
    for(const y of [.57,.94,1.31]) {
      add(G.box(.85,.045,.51,.012),'#a2c8bb',0,y,-.015);
      for(let k=0;k<4;k++) bottle(add,-.32+k*.21,y+.035,-.02,['#f3967a','#84ae9d','#eaa440','#b0e5e8'][k]);
      add(G.box(.83,.04,.035,.008),C.cream,0,y+.04,.25);
    }
    add(G.box(.85,.05,.5,.02),C.dark,0,.19,0);
    add(G.pbox(.35,.025,.40),C.dark,-.175,.2775,.10);
  }));
  const door=grp();put(door,-W/2,0,D/2+.035);f.add(door);
  door.add(mc('gpt-vending-door-v2',({add})=>{
    for(const x of [.025,W-.025]) add(G.box(.07,H-.04,.08,.02),C.cream,x,H/2,0);
    for(const y of [.18,1.65,H-.025]) add(G.box(W,.08,.08,.02),C.cream,W/2,y,0);
    // Four pieces frame a real pickup aperture; the can travels through the empty centre.
    add(G.box(.175,.37,.09,.012),C.mint,.0875,.37,0);
    add(G.box(.525,.37,.09,.012),C.mint,.7875,.37,0);
    add(G.box(.35,.125,.09,.012),C.mint,.35,.4925,0);
    add(G.box(.35,.105,.09,.012),C.mint,.35,.2375,0);
    add(G.pbox(.35,.14,.025),C.dark,.35,.36,-.40);
    add(G.box(.23,.36,.09,.025),C.teal,.85,1.37,.045);
    add(G.cyl(.045,.045,.025,12),'#feb53d',.85,1.39,.105,HP,0,0);
    add(G.box(.13,.025,.025,.008),C.dark,.85,1.49,.105);
    for(let k=0;k<4;k++) add(G.sph(.028,8,6),'#feb53d',.19+k*.19,.75,.055);
  }));
  // Lightly tinted display pane; products are geometry behind it, not a stretched box texture.
  door.add(put(plane(.75,.78,mat('#b0e5e8',{opacity:.12})),.44,1.18,.009));
  label(door,'음료',.81,.18,.52,1.76,.047,C.cream,C.teal,65);
  const p=f.part('door',door,t=>door.rotation.y=-1.65*t,{label:'음료 자판기 문',sfx:'door'});
  p.lockable=true; p.lockKind='pad'; p.lockAt={x:.85,y:.98,z:.12,parent:door};
  const button=grp();put(button,.85,1.39,.14);door.add(button);
  button.add(mc('gpt-vending-push-button',({add})=>add(G.cyl(.085,.085,.06,12),'#feb53d',0,0,0,HP,0,0)));
  const can=grp();put(can,-.175,.327,.12);f.add(can);
  can.add(mc('gpt-vending-dispensed-can',({add})=>{
    add(G.cyl(.036,.036,.13,12),'#f3967a',0,0,0,0,0,HP);
    for(const x of[-.07,.07])add(G.cyl(.037,.037,.012,12),C.cream,x,0,0,0,0,HP);
    add(G.box(.07,.012,.04,.004),C.cream,0,.031,0);
  }));
  const vend=f.part('lift',[button,can],t=>{button.position.z=.14-.06*Math.sin(t*Math.PI);can.position.z=.12+.43*t;can.rotation.x=t*Math.PI*2;},{label:'자판기 음료 버튼',sfx:'clink',dur:.75});
  vend.noHide=true;vend.handle=button;vend.gptAuxiliary='clue-reveal';
  f.spot('inside',null,.28,.235,.14,{part:p,maxH:.34,label:'자판기 아래 상품 칸',scale:1});
  f.spot('inside',null,-.26,.99,.14,{part:p,maxH:.32,label:'자판기 가운데 선반',scale:.85});
  // The source cabinet is 1.92m tall; compress only Y to the team's 1.72m machine.
  const sy=1.72/1.92; f.group.scale.y=sy;
  f.gptSizeAudit={vendingHeight:1.72};
  f.gptSmallAudit=[{label:'병 음료',height:.2725*sy,width:.082,depth:.078},{label:'배출 캔',height:.074*sy,width:.152,depth:.074},{label:'음료 간판',height:.18*sy,width:.81,depth:.012}];
};

B.gpt_stationlockers = f => {
  const W=1.36,D=.58;
  f.gptSizeAudit={lockerHeight:1.8625};
  f.add(mc('gpt-locker-carcass-v1',({add})=>{
    add(G.box(W,.1,D,.025),C.teal,0,.05,0);
    add(G.box(W,1.73,.05,.015),'#a2c8bb',0,.94,-.27);
    for(const x of [-.66,0,.66]) add(G.box(.045,1.8,D,.012),C.cream,x,.96,0);
    for(const y of [.16,1.0,1.84]) add(G.box(W,.045,D,.012),C.cream,0,y,0);
  }));
  for(let row=0;row<2;row++) for(let col=0;col<2;col++) {
    const x=-.63+col*.66,y=.18+row*.84,pv=grp();put(pv,x,y,.311);f.add(pv);
    pv.add(mc('gpt-locker-door-'+row+col,({add})=>{
      add(G.box(.6,.78,.05,.025),row%2?'#84ae9d':'#a2c8bb',.3,.39,0);
      add(G.box(.035,.12,.045,.012),C.teal,.51,.37,.047);
      add(G.box(.18,.11,.016,.006),C.cream,.24,.56,.032);
      for(let k=0;k<3;k++) add(G.pbox(.14,.012,.008),C.teal,.25,.1+k*.03,.03);
    }));
    label(pv,''+(101+row*100+col),.18,.1,.24,.56,.043,C.cream,C.teal,75);
    const p=f.part('door',pv,t=>pv.rotation.y=-1.8*t,{label:`코인 로커 ${101+row*100+col}`,sfx:'door'});
    p.lockable=true; p.lockKind='code'; p.lockAt={x:.51,y:.12,z:.07,parent:pv};
    f.spot('inside',null,x+.3,y+.04,.03,{part:p,maxH:.65,label:'로커 안',scale:.9});
  }
};

B.gpt_sakuratimetable = f => {
  f.add(mc('gpt-timetable-posts-v2',({add})=>{
    for(const x of [-.68,.68]) {add(G.box(.085,1.95,.085,.02),C.teal,x,.975,0);add(G.box(.29,.065,.35,.025),C.pale,x,.032,0);}
    add(G.box(1.55,.07,.23,.025),C.teal,0,1.95,-.01);
  }));
  const board=grp();put(board,0,1.35,0);f.add(board);
  board.add(mc('gpt-timetable-board-v2',({add})=>{
    add(G.box(1.22,1.12,.11,.045),C.teal,0,0,0);
    add(G.box(.22,.16,.1,.025),C.wood,.64,-.34,0);
  }));
  const display=label(board,'열차 시간표\n07:45   08:10\n08:30   09:05',1.1,.98,0,0,.062,C.cream,C.teal,42,true);
  const reverse=label(board,'출발 08:10\n늦지 말아요',1.1,.98,0,0,-.062,C.cream,C.teal,48,true);reverse.rotation.y=Math.PI;
  (f.live ||= []).push(board);display.userData.noMerge=true;
  const p=f.part('door',board,t=>board.rotation.y=Math.PI*t,{label:'시간표 뒤집기',sfx:'flip',dur:.65});
  p.noHide=true;p.handle=board;p.gptAuxiliary='clue-reveal';
  // A designer can bind real per-run obslock numbers to the front; the board always stays a real flipping part.
  f.bindTimetable=(rows,star,draw)=>{
    // Preserve the exact per-run times/star clue, with fitted Korean cells and our warm paper palette.
    const tx=canvasTex(512,448,(c,w,h)=>{
      c.fillStyle=C.cream;c.fillRect(0,0,w,h);c.textBaseline='middle';
      const text=(t,x,y,maxW,fs,align='center')=>{
        t=tr(t);
        c.textAlign=align;let size=fs;
        do{c.font=`700 ${size}px "Ssurround", "Jua", sans-serif`;if(c.measureText(t).width<=maxW)break;}while(--size>1);
        c.fillText(t,x,y);
      };
      c.fillStyle=C.dark;text('열차 시간표',w*.5,h*.12,w*.8,46);
      rows.forEach(([hr,min,dest],i)=>{
        const y=h*(.30+i*.17),mine=i===star;
        c.fillStyle=mine?'#feb53d':C.pale;c.fillRect(w*.10,y-h*.065,w*.80,h*.13);
        c.fillStyle=C.dark;text(`${hr}:${String(min).padStart(2,'0')}`,w*.14,y,w*.31,45,'left');
        text(mine?'★ 우리 열차':String(dest),w*.86,y,w*.34,31,'right');
      });
    });
    display.material=mat('#ffffff',{map:tx});reverse.material=display.material;return display;
  };
  f.spot('behind',null,0,.02,-.24,{maxH:.4,label:'시간표 뒤'});
};

B.gpt_sakuracat = f => {
  f.add(mc('gpt-station-cat-mat-v2',({add})=>{
    add(G.box(.7,.07,.57,.065),'#eecfa3',0,.045,0);
    add(G.box(.3,.075,.2,.035),C.mint,-.4,.087,.43);
    add(G.cyl(.105,.105,.07,12),C.cream,-.42,.08,.45);
  }));
  const cat = new ChibiCat({ scale: .44 });
  cat.root.position.y = .081; cat.root.rotation.y = .5;
  cat.shadow.scale.multiplyScalar(.44/.62);
  f.gptSmallAudit=[{label:'고양이 물그릇',height:.07,width:.21,depth:.21},{label:'고양이 방석',height:.07,width:.70,depth:.57}];
  f.add(cat.root); (f.live ||= []).push(cat.root); f.cat = cat;
  let last = null;
  f.tick = t => { cat.update(last == null ? 0 : Math.min(.05, Math.max(0,t-last))); last = t; };
  f.spot('beside',null,.48,.025,0,{maxH:.65,label:'역장 고양이 옆',scale:1.05});
};

B.gpt_suitcases=f=>{
  f.gptSmallAudit=[{label:'아래 여행 가방',height:.33,width:.82,depth:.54},{label:'위 여행 가방',height:.25,width:.66,depth:.45},{label:'피크닉 바구니',height:.30,width:.63,depth:.48}];
  f.add(mc('gpt-station-luggage-v2',({add,tube})=>{
    add(G.box(.82,.33,.54,.05),C.wood,0,.175,0);
    for(const x of [-.27,.27])add(G.box(.045,.34,.55,.012),C.pale,x,.18,0);
    add(G.box(.83,.035,.55,.015),'#c67f2a',0,.29,0);
    tube([-.1,.22,.30],[.1,.22,.30],.02,C.dark,8);
    add(G.box(.66,.25,.45,.045),'#f8b15b',0,.475,0);
    for(const x of [-.21,.21])add(G.box(.035,.25,.46,.008),C.cream,x,.475,0);
    // Open woven basket: an actual floor and four walls, sized for a phone-readable findable.
    add(G.box(.60,.035,.46,.012),C.pale,0,.625,0);
    for(const s of [-1,1]){
      add(G.box(.035,.25,.46,.01),'#eecfa3',s*.285,.765,0);
      add(G.box(.55,.25,.035,.01),'#eecfa3',0,.765,s*.212);
      for(let k=0;k<4;k++)add(G.box(.55,.014,.012,.003),'#f6e0bf',0,.67+k*.06,s*.235);
    }
    for(let x=-.23;x<.28;x+=.1)for(const z of[-.237,.237])add(G.box(.013,.23,.009,.003),C.wood,x,.765,z);
  }));
  const lid=grp();put(lid,0,.9,-.23);f.add(lid);
  lid.add(mc('gpt-station-picnic-lid',({add})=>{
    add(G.box(.63,.05,.48,.025),C.pale,0,.025,.23);
    for(let k=0;k<5;k++)add(G.box(.58,.008,.028,.004),'#f3967a',0,.056,.05+k*.085);
    for(const x of[-.12,.12])add(G.box(.028,.009,.45,.003),C.cream,x,.057,.23);
  }));
  const p=f.part('lift',lid,t=>lid.rotation.x=-1.3*t,{label:'여행 바구니 뚜껑',sfx:'rustle',dur:.4});
  f.spot('inside',null,0,.654,0,{part:p,maxH:.29,label:'여행 바구니 안',scale:1});
  f.spot('beside',null,.55,.02,.38,{maxH:.65,label:'여행 가방 옆',scale:1.05});
};

// Preserve canonical staging keys while applying this workshop's fixes only to its station theme.
// Cached source geometry is cloned before recolouring/scaling, so every other map keeps its builders.
const canonicalPalette={
  '#fff4e2':C.cream,'#ffffff':'#fefde9','#6cc28e':'#84ae9d','#4f9f74':C.teal,
  '#cfc9dc':'#f6e0bf','#3d4b70':'#84ae9d','#9cc9ee':'#b0e5e8','#b9bfcf':C.steel,
  '#8f95a8':'#a09769','#3a3048':C.dark,'#d9a466':'#eaa440','#a8733f':C.wood,
  '#ddd8e2':'#f2dcbc','#c5bfcd':'#eecfa3','#ffd23f':'#feb53d','#ff5d6c':'#ee795e',
  '#ffc4d8':'#f6b0aa','#ff9ec2':'#ef8791','#8b5e4a':C.dark,'#d9d6e2':'#f2dcbc',
  '#4a4256':C.dark,'#efe8da':C.cream,'#bcb6c4':'#eecfa3','#9ea5b8':'#a09769',
  '#2a2233':C.dark,'#7cc47a':'#84ae9d','#7fcf6a':'#a2c8bb','#5cb45a':'#84ae9d',
  '#f08fb4':'#e87884','#ffe1ea':'#f7cabc','#fff3b0':'#feebc8'
};
for(const amt of[.25,.20,.12])canonicalPalette[shade('#7cc47a',amt)]=shade('#84ae9d',amt);
function stationColours(f){
  const tint=c=>STYLE.mode!=='std'&&STYLE.remap?STYLE.remap(c):c;
  const key=c=>[c.r,c.g,c.b].map(v=>Math.round(v*1e6)).join(',');
  const map=new Map(Object.entries(canonicalPalette).map(([a,b])=>[key(new THREE.Color(tint(a))),new THREE.Color(tint(b))]));
  const color=new THREE.Color();
  f.group.traverse(o=>{
    if(!o.isMesh)return;
    if(o.geometry?.attributes?.color){
      o.geometry=o.geometry.clone();const a=o.geometry.attributes.color;
      for(let i=0;i<a.count;i++){
        color.setRGB(a.getX(i),a.getY(i),a.getZ(i));const replacement=map.get(key(color));
        if(replacement)a.setXYZ(i,replacement.r,replacement.g,replacement.b);
      }
      a.needsUpdate=true;
    }
  });
}
function springShelter(f){
  // The same four-post curved-tile shelter; straight trim now uses low-cost boxes.
  f.add(mc('gpt-station-shelter-fix-v1',({add,tube})=>{
    for(const x of[-.85,.85])for(const z of[-.35,.3]){
      add(G.box(.13,1.95,.13,.03),C.cream,x,.975,z);
      add(G.pbox(.2,.1,.2),C.pale,x,.05,z);add(G.pbox(.18,.08,.18),C.pale,x,1.92,z);
      const sx=x<0?1:-1;add(G.tor(.22,.035,HP,4,8),C.cream,x+sx*.22,1.78,z,0,0,sx<0?0:HP);
    }
    for(const z of[-.35,.3])add(G.pbox(1.9,.12,.12),C.cream,0,2,z);
    for(let k=0;k<12;k++){
      const t=k/11,x=-1.05+t*2.25,curve=t>.7?Math.pow((t-.7)/.3,1.6):0,y=2.14-curve*.4,rz=-curve*.9;
      add(G.pbox(.22,.10,1.1),k%2?C.mint:C.teal,x,y,-.02,0,0,rz);
      for(let r=0;r<4;r++)add(G.pbox(.20,.02,.02),C.teal,x,y+.06,-.45+r*.28,0,0,rz);
    }
    add(G.pbox(1.75,.06,.05),C.teal,-.2,2.12,.55);
    for(const x of[-.6,.65]){
      add(G.cyl(.012,.012,.20,6),C.dark,x,1.85,.32);
      add(G.pbox(.14,.04,.14),C.dark,x,1.75,.32);
      add(G.box(.11,.16,.11,.02),'#feb53d',x,1.65,.32);
      add(G.pbox(.14,.03,.14),C.dark,x,1.56,.32);
    }
    add(G.box(1.2,.07,.38,.02),C.wood,0,.44,-.1);
    for(const x of[-.5,.5])add(G.pbox(.06,.44,.32),C.dark,x,.22,-.1);
    for(let k=0;k<3;k++)add(G.pbox(1.2,.06,.03),C.wood,0,.58+k*.1,-.28,-.12,0,0);
    for(const x of[-.3,.3]){
      add(G.box(.42,.08,.32,.05),C.pink,x,.51,-.08);
      add(G.box(.36,.30,.10,.05),C.pink,x,.69,-.22,-.15,0,0);
      for(let k=0;k<3;k++){
        add(G.pbox(.42,.006,.025),C.cream,x,.553,-.18+k*.1);
        add(G.pbox(.025,.006,.32),C.cream,x-.14+k*.14,.557,-.08);
      }
    }
    for(const x of[-.55,.55]){
      add(G.box(.42,.2,.22,.02),C.wood,x,.1,-.4);
      for(let k=0;k<5;k++)add(G.sph(.07,6,4),k%2?C.mint:[C.pink,'#feb53d',C.cream][k%3],x-.16+k*.08,.25,-.4);
    }
  }));
  f.spot('under',null,.2,0,-.1,{maxH:.3,label:'벤치 밑',scale:.8});
  f.spot('on',null,-.3,.55,-.08,{maxH:.3,label:'벤치 위',scale:.75});
  f.spot('beside',null,.55,.2,-.4,{maxH:.2,label:'꽃상자 사이',scale:.6});
  f.gptSizeAudit={benchSeatHeight:.55};
  f.gptSmallAudit=[{label:'쉼터 등갓',height:.23,width:.14,depth:.14},{label:'꽃상자',height:.20,width:.42,depth:.22}];
}
for(const key of['train','crossing','treesakura','tripbag','platshelter']){
  const original=STATION_BUILDERS[key];
  B[key]=(f,T,o={})=>{
    if(!T?.gptStationFix)return original(f,T,o);
    if(key==='platshelter'){springShelter(f);return;}
    original(f,T,o);stationColours(f);
    if(key==='train'){
      // Car, sliding door, catenary and paw retain their exact staging object identities.
      const lift=y=>y<=.34?y:.34+(y-.34)*2.05;
      f.group.traverse(mesh=>{
        if(!mesh.isMesh||!['train-car','train-door','train-catenary','train-paw'].includes(mesh.geometry?.name))return;
        mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position;
        for(let i=0;i<p.count;i++)p.setY(i,mesh.geometry.name==='train-door'?p.getY(i)*2.05:lift(p.getY(i)));
        p.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
      });
      for(const door of f.doors||[])door.position.y=lift(door.position.y);
      f.gptSizeAudit={doorClearHeight:2.009,doorPanelHeight:2.05};
    }
    if(key==='tripbag')f.gptSmallAudit=[{label:'낚시 가방 몸통',height:.32,width:.62,depth:.36},{label:'낚싯대',height:.032,width:1,depth:.032}];
  };
}

export const GPTSTATION_BUILDERS=B;
export const GPTSTATION_INFO={
  gpt_stationlocal:STATION_RAIL_INFO,
  gpt_stationworld:{w:1,d:1,name:'이어지는 역 주변 동네',hidden:true},
  gpt_stationoffice:{w:2,d:2,name:'벚꽃역 매표소',hidden:true},
  gpt_sakuragate:{w:2,d:1,name:'개찰구',hidden:true},
  gpt_stationvending:{w:1,d:1,name:'상품이 든 음료 자판기',hidden:true},
  gpt_stationlockers:{w:2,d:1,name:'벚꽃역 코인 로커',hidden:true},
  gpt_sakuratimetable:{w:2,d:1,name:'벚꽃역 열차 시간표',hidden:true},
  gpt_sakuracat:{w:1,d:1,name:'역장 고양이',hidden:true},
  gpt_suitcases:{w:1,d:1,name:'벚꽃역 여행 가방',hidden:true},
};
