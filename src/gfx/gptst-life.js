// 27판 역의 열차 둘·벚나무·역 고양이·토끼 승객 (GPT 작업장 gpt-station gptstation2-life.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로,
// 동물은 이미 우리 ChibiCat·Char, 열차 글자는 우리 fitText로; 지나가는 열차는 f.tick → 우리 f.idle).
// Gentle, bounded life. Live groups survive furniture's static-geometry batching.
import * as THREE from 'three';
import { sign, stretchCabin } from './gptst-kit.js';
import { grp, put, mesh, mat, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { ChibiCat } from './cat.js';
import { Char } from './chars.js';
const B={}, HP=Math.PI/2;
const C={cream:'#f4f2f0',wood:'#cf9b6b',brown:'#6f4b30',sage:'#52b89b',mint:'#80cfb5',pink:'#e876aa',coral:'#ed876f',sky:'#68b7dc'};

const trainLabel=(parent,text,w,h,x,y,z,ry=0)=>sign(parent,text,w,h,x,y,z,C.cream,C.brown,ry);
const nonsolid=f=>{f.noSolid=true;f.collideBox=[-.01,-1,-.01,.01,-.9,.01];};
// These are the game's own actors at their native scale. Furniture batching must
// leave their original face, ear and limb nodes intact so the native idle works.
function actorRoot(f,actor){
  actor.root.traverse(o=>{if(o.isMesh){o.userData.noMerge=true;delete o.userData.char;}});
  (f.live||=[]).push(actor.root);actor.update(0);return actor.root;
}
function actorTick(actor){
  let previous=null;
  return t=>{const dt=previous==null?0:Math.max(0,Math.min(.1,t-previous));previous=t;actor.update(dt);};
}

B.gpt2_train=f=>{
  nonsolid(f);
  const car=grp(); f.add(car); f.live=[car]; f.car=car;
  const cabin=mc('gpt2-local-car-metric-v2',({add,tube})=>{
    add(G.box(6.2,.18,1.04,.065),C.brown,0,.43,0);
    add(G.box(6.18,.53,1.12,.11),C.sage,0,.8,0);
    add(G.box(6.18,.77,1.12,.11),C.sky,0,1.43,0);
    add(G.box(6.2,.085,1.13,.018),C.coral,0,1.035,0);
    add(G.box(6.26,.19,1.18,.08),'#e6b2c9',0,1.92,0);
    for(const side of [-1,1]) for(const x of [-2.4,-1.65,-.9,.9,1.65,2.4]){
      add(G.box(.57,.48,.035,.045),C.brown,x,1.43,side*.565);
      add(G.box(.47,.37,.018,.035),C.sky,x,1.445,side*.589);
      // A small reflection keeps the glass bright without inventing passengers.
      add(G.box(.05,.31,.012,.006),'#d4e2e5',x-.14,1.46,side*.604,0,0,-.2);
    }
    for(const z of [-.58,.58]) for(const x of [-.18,.18]){
      add(G.box(.33,2.05/1.45,.05,.02),C.mint,x,.43+2.05/1.45/2,z);
      add(G.box(.25,.42,.017,.025),C.sky,x,1.37,z+Math.sign(z)*.035);
      add(G.box(.027,.16,.026,.008),C.brown,x+(x<0?.11:-.11),.95,z+Math.sign(z)*.05);
    }
    for(const x of [-3.12,3.12]){
      add(G.box(.045,.5,.8,.055),C.brown,x,1.43,0);
      add(G.box(.018,.39,.67,.04),C.sky,x+Math.sign(x)*.03,1.445,0);
      for(const z of [-.36,.36]) add(G.sph(.088,10,6),'#feb53d',x+Math.sign(x)*.04,.86,z,0,0,0,[.4,1,1]);
      add(G.box(.11,.11,.9,.025),'#a09769',x,.51,0);
    }
    for(const x of [-2.1,2.1]){
      add(G.box(.9,.18,.8,.035),C.brown,x,.34,0);
      for(const dx of [-.28,.28]) for(const z of [-.4,.4]){
        add(G.cyl(.19,.19,.09,12),C.brown,x+dx,.27,z,HP);
        add(G.cyl(.09,.09,.102,10),'#c6c393',x+dx,.27,z,HP);
      }
      add(G.box(.7,.13,.57,.045),'#c6c393',x,2.08,0);
      for(let dx=-.24;dx<.3;dx+=.12) add(G.box(.035,.015,.37,.005),'#a09769',x+dx,2.152,0);
    }
    tube([-.5,2.02,0],[-.2,2.32,0],.028,C.brown); tube([-.2,2.32,0],[.2,2.02,0],.028,C.brown);
  });
  stretchCabin(cabin,.43,1.45);car.add(cabin);f.doorClearHeight=2.05;
  // This car passes on the separate rear track, then leaves the scene entirely.
  // Idle geometry stays at the origin and hidden so its bbox cannot widen the view.
  car.position.x=0;car.visible=false;
  let last=null, clock=0, next=22, run=null;
  f.moving=false; f.passCount=0;
  f.pass=(duration=4)=>{
    const start=f.passCount%2===0?-10.3:10.3;
    car.position.x=start;car.visible=true;run={start,end:-start,at:clock,duration:Math.max(.25,duration)};f.moving=true;f.passCount++;
  };
  f.tick=t=>{
    const dt=last==null?0:Math.max(0,Math.min(.25,t-last));last=t;clock+=dt;
    if(!run&&clock>=next)f.pass(4.8);
    if(run){const u=Math.min(1,(clock-run.at)/run.duration),v=u*u*(3-2*u);car.position.x=run.start+(run.end-run.start)*v;if(u===1){run=null;f.moving=false;car.visible=false;car.position.x=0;next=clock+24;}}
  };
};

// The permanent platform train keeps v1's cream/sage local-car silhouette. Its
// open doors and missing middle/front roof reveal a genuine furnished interior.
// Origin is on the rail bed; seat height is .58 m above the finished carriage floor.
B.gpt2_waitingtrain=f=>{
  nonsolid(f);
  const green='#52b89b',mint='#80cfb5',silver='#a5bdc6',floorY=.55,seatLift=.143;
  const base=f.chassis=grp(),body=f.navigationBody=grp(),roof=f.cutawayRoof=grp(),steps=f.doorsteps=grp();
  f.add(base);f.add(body);f.add(roof);f.add(steps);
  // Stable groups also keep the actual body/floor refs available to navigation.
  f.live=[body,roof,steps];f.waitingTrain=f.group;
  base.add(mc('gpt2-waitingtrain-chassis-v1',({add,tube})=>{
    add(G.box(6.2,.10,1.14,.035),C.brown,0,.485,0);
    add(G.box(6.18,.10,1.22,.035),'#e6b2c9',0,.50,0);
    for(let x=-2.9;x<3;x+=.29)add(G.box(.018,.012,1.09,.004),'#d7bc91',x,.557,0);
    for(const x of [-2.1,2.1]){
      add(G.box(.93,.12,.54,.035),C.brown,x,.43,0);
      for(const dx of [-.27,.27])for(const z of [-.34,.34]){
        add(G.cyl(.13,.13,.09,14),C.brown,x+dx,.40,z,HP);
        add(G.cyl(.062,.062,.101,10),silver,x+dx,.40,z,HP);
      }
      for(const dx of [-.27,.27])tube([x+dx,.40,-.34],[x+dx,.40,.34],.028,silver,8);
    }
  }));
  body.add(mc('gpt2-waitingtrain-body-v1',({add,tube})=>{
    // The far wall has individually framed window openings, not a full solid
    // box. Its blue rear glass remains a calm backdrop to the real seats.
    add(G.box(6.13,.51,.075,.035),green,0,.805,-.605);
    add(G.box(6.12,.09,.084,.017),'#ed876f',0,1.065,-.605);
    add(G.box(6.12,.17,.084,.035),C.cream,0,2.528,-.605);
    for(const x of [-2.91,-2.16,-1.44,-.72,0,.72,1.44,2.16,2.91])add(G.box(.075,1.343,.08,.02),C.cream,x,1.8015,-.605);
    for(const x of [-2.55,-1.8,-1.08,-.36,.36,1.08,1.8,2.55]){
      add(G.box(.60,1.05,.035,.045),C.brown,x,1.70,-.61);
      add(G.box(.51,.94,.018,.035),C.sky,x,1.70,-.635);
      add(G.box(.51,.035,.045,.008),silver,x,1.51,-.626);
    }
    // Front side walls stop at the actual door openings. The upper cutaway is
    // empty, giving a clear view of upholstery, floor, handles and luggage.
    for(const [left,right] of [[-3.02,-1.85],[-.85,1.30],[2.30,3.02]]){
      const x=(left+right)/2,w=right-left;
      add(G.box(w,.44,.065,.035),green,x,.77,.575);
      add(G.box(w,.075,.073,.015),'#ed876f',x,1.025,.575);
      add(G.box(w,.075,.075,.025),C.cream,x,1.10,.575);
    }
    add(G.box(6.13,.10,.075,.025),C.cream,0,2.663,.575);
    for(const x of [-3.02,-1.88,-.82,1.27,2.33,3.02])add(G.box(.065,2.143,.075,.02),C.cream,x,1.5915,.575);
    for(const x of [-3.06,3.06]){
      // Narrow cab end with blue windshield, cream brow and rounded green nose.
      add(G.box(.12,.55,1.25,.065),green,x,.81,0);
      add(G.box(.12,.15,1.25,.045),C.cream,x,1.13,0);
      add(G.box(.12,.20,1.25,.05),C.cream,x,2.503,0);
      for(const z of [-.565,.565])add(G.box(.12,1.283,.12,.035),C.cream,x,1.8015,z);
      add(G.box(.132,.93,1.01,.055),C.brown,x,1.74,0);
      add(G.box(.015,.81,.88,.045),C.sky,x+Math.sign(x)*.073,1.76,0);
      add(G.box(.018,.028,.40,.008),C.brown,x+Math.sign(x)*.085,1.43,-.02,0,.12);
      for(const z of [-.42,.42]){
        add(G.cyl(.09,.09,.05,12),C.brown,x+Math.sign(x)*.078,.89,z,0,0,HP);
        add(G.cyl(.064,.064,.015,12),'#ffe6a3',x+Math.sign(x)*.108,.89,z,0,0,HP);
      }
      add(G.box(.12,.11,1.01,.025),silver,x,.57,0);
    }
    // .58 m cushion tops, measured above the finished .563 m cabin floor. Four soft mochi-sized seats.
    for(const x of [-2.25,-.75,.75,2.15]){
      for(const dx of [-.20,.20])add(G.box(.065,.483,.065,.018),C.brown,x+dx,floorY+.2415,-.28);
      add(G.box(.59,.07,.43,.025),'#cf9b6b',x,floorY+seatLift+.335,-.29);
      add(G.box(.57,.16,.44,.065),mint,x,floorY+seatLift+.37,-.27);
      add(G.box(.57,.44,.13,.06),green,x,floorY+seatLift+.64,-.46,-.08);
      add(G.box(.53,.016,.019,.004),'#fbf7f0',x,floorY+seatLift+.447,-.052);
      for(const dx of [-.30,.30]){
        tube([x+dx,floorY+seatLift+.34,-.40],[x+dx,floorY+seatLift+.60,-.40],.024,silver,7);
        tube([x+dx,floorY+seatLift+.60,-.40],[x+dx,floorY+seatLift+.60,-.10],.024,silver,7);
      }
    }
    // Warm interior lighting and four chunky straps use the same maple/mint
    // vocabulary as the approved train-car scene, without a heavy roof slab.
    tube([-2.65,2.10,-.29],[2.65,2.10,-.29],.028,'#cf9b6b',8);
    for(const x of [-2.25,-.60,.65,2.10]){
      tube([x,2.10,-.29],[x,1.91,-.29],.022,C.cream,6);
      add(G.tor(.065,.022,Math.PI*2,6,14),C.cream,x,1.845,-.29);
    }
    for(const x of [-1.1,1.1]){
      add(G.box(.65,.065,.12,.02),silver,x,2.34,-.42);
      add(G.box(.57,.025,.10,.015),'#ffe6b9',x,2.297,-.42);
    }
    // A case and tote on the real floor, and a newspaper/cup on separate seats.
    add(G.box(.33,.34,.24,.05),'#cf9b6b',2.69,floorY+.17,-.03);
    for(const x of [2.59,2.79])add(G.box(.028,.345,.254,.009),C.brown,x,floorY+.172,-.03);
    add(G.tor(.064,.021,Math.PI,6,12),C.brown,2.69,floorY+.38,-.03);
    add(G.box(.075,.105,.018,.009),C.cream,2.75,floorY+.23,.106,0,0,-.17);
    add(G.box(.29,.25,.22,.045),C.pink,-2.70,floorY+.125,-.05);
    add(G.tor(.065,.022,Math.PI,6,12),C.brown,-2.70,floorY+.31,-.05);
    add(G.box(.26,.025,.20,.009),C.cream,-.75,floorY+seatLift+.465,-.22,0,.13);
    add(G.box(.023,.018,.19,.005),'#e6b2c9',-.63,floorY+seatLift+.485,-.22,0,.13,-.15);
    for(const z of [-.27,-.22,-.17])add(G.box(.16,.008,.015,.003),'#a09769',-.76,floorY+seatLift+.485,z,0,.13);
    add(G.cyl(.047,.041,.105,10),C.cream,.90,floorY+seatLift+.505,-.20);
    add(G.cyl(.049,.049,.018,10),green,.90,floorY+seatLift+.566,-.20);
  }));
  // Paired leaves sit in their side pockets, leaving two true 1.0 x 2.05 m
  // openings. They stay open: the station's passing train remains the live toy.
  const doors=f.openDoors=[];
  for(const cx of [-1.35,1.80])for(const s of [-1,1]){
    const door=grp();put(door,cx+s*.80,1.5815,.61);body.add(door);doors.push(door);
    door.add(mc('gpt2-waitingtrain-openleaf-v1|'+s,({add})=>{
      add(G.box(.48,2.003,.035,.025),mint,0,0,0);
      add(G.box(.35,.69,.018,.035),C.brown,0,.31,.024);
      add(G.box(.29,.61,.012,.025),C.sky,0,.31,.040);
      add(G.box(.028,.18,.025,.008),silver,-s*.16,-.13,.030);
      add(G.box(.41,.035,.022,.006),'#fbf7f0',0,-.9415,.027);
    }));
  }
  steps.add(mc('gpt2-waitingtrain-thresholds-v1',({add})=>{
    for(const x of [-1.35,1.80]){
      // The front tread meets the .424 m platform, then rises to carriage floor.
      add(G.box(1.0,.075,.24,.018),silver,x,.3865,.65);
      add(G.box(.95,.06,.16,.018),'#e6b2c9',x,.475,.575);
      for(const dx of [-.36,-.12,.12,.36])add(G.box(.023,.012,.13,.004),C.brown,x+dx,.430,.68);
    }
  }));
  roof.position.y=.163;
  roof.add(mc('gpt2-waitingtrain-cutroof-v1',({add,tube})=>{
    // A narrow rear roof and short rounded cab hoods frame the cutaway instead
    // of covering it. Their connected cream edge keeps the familiar silhouette.
    add(G.box(4.65,.14,.40,.06),'#e6b2c9',0,2.61,-.47);
    add(G.box(4.70,.055,.075,.02),green,0,2.56,-.245);
    for(const x of [-2.73,2.73]){
      add(G.box(.84,.17,1.36,.08),'#e6b2c9',x,2.61,0);
      add(G.box(.86,.055,1.37,.02),green,x,2.52,0);
      add(G.box(.48,.10,.33,.035),silver,x,2.744,-.13);
      for(const dx of [-.15,-.05,.05,.15])add(G.box(.025,.014,.23,.004),'#a09769',x+dx,2.801,-.13);
    }
    tube([-1.0,2.69,-.46],[-.74,2.91,-.46],.026,C.brown,8);
    tube([-.74,2.91,-.46],[-.43,2.69,-.46],.026,C.brown,8);
    add(G.box(.52,.035,.09,.012),C.brown,-.74,2.93,-.46);
  }));
  trainLabel(body,'봄빛 27',.90,.18,.10,.805,.617);
  trainLabel(body,'벚꽃마을',.82,.16,.10,2.663,.620);
  f.carFloorY=floorY;f.seatHeight=.58;f.doorClearWidth=1.0;f.doorClearHeight=2.05;
  f.doorCenters=[-1.35,1.80];f.waiting=true;
};

B.gpt2_sakura=f=>{
  nonsolid(f);
  f.add(mc('gpt2-sakura-trunk-v2-pink',({add,tube})=>{
    add(G.cyl(.17,.25,1.8,10),'#c67f2a',0,.9,0);
    for(const [x,z,h] of [[-.75,-.05,2.12],[.65,-.25,2.35],[.35,.62,2.2],[-.15,-.65,2.45]]){
      tube([0,.85,0],[x,h,z],.09,'#c67f2a');tube([x*.6,h*.8,z*.6],[x*1.3,h+.18,z*1.3],.055,'#cf9b6b');
    }
    // Low circular bed, roots, flowers and a forgotten gardener's basket.
    add(G.cyl(1.08,1.1,.17,28),'#eecfa3',0,.085,0);
    add(G.cyl(.96,.99,.035,28),'#c6c393',0,.19,0);
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8; add(G.box(.36,.09,.16,.035),'#feebc8',Math.sin(a)*1.02,.2,Math.cos(a)*1.02,0,a);
      if(i%3===0)add(G.sph(.07,6,4),'#e876aa',Math.sin(a)*.78,.23,Math.cos(a)*.78,0,a,.12,[1.35,.4,.85]);
    }
    // A handful of thick fallen petals gives the pink crown a quiet echo on the warm paving.
    // Bed petals rest above the soil; outer petals stay on the island and clear the front edge.
    for(const [i,[x,z]] of [[-1.2,.18],[-.96,.72],[-.4,.85],[.45,.82],[1.18,.25],[.76,-1.03],[-.72,-1.07],[1.12,-.55]].entries()){
      const onBed=Math.hypot(x,z)<.96;
      add(G.sph(.065,7,5),i%2?'#e876aa':'#ed876f',x,onBed?.23:.026,z,0,i*.9,.1,[1.4,.38,.85]);
    }
  }));
  const crown=grp();f.add(crown);f.live=[crown];
  crown.add(mc('gpt2-sakura-crown-v2-pink',({add})=>{
    const lobes=[[-.85,2.45,-.15,.72],[.75,2.62,-.22,.77],[.3,2.48,.66,.73],[-.3,2.98,-.12,.79],[-.05,2.66,-.8,.68],[-.65,2.62,.6,.65]];
    lobes.forEach(([x,y,z,r],i)=>{
      add(G.sph(r,12,8),i%2?'#f4afd0':'#e876aa',x,y,z,0,0,0,[1.15,.78,1]);
      for(let k=0;k<7;k++){
        const a=k*2.4;add(G.sph(.18,7,5),k%3?'#f4afd0':'#ed876f',x+Math.cos(a)*r*.82,y+Math.sin(k*1.6)*r*.45,z+Math.sin(a)*r*.8,0,0,0,[1,.65,1]);
      }
      // A few soft five-petal clusters break up the large lobes without becoming a dotted texture.
      // They sit partly within the front shell, attached like blossoms rather than floating badges.
      if(i!==4){
        const bx=x+r*.34,by=y+r*.28,bz=z+r*.86;
        for(let p=0;p<5;p++){
          const a=p*Math.PI*.4+i*.3;
          add(G.sph(.052,7,5),i%2?'#f4afd0':'#ed876f',bx+Math.sin(a)*.065,by+Math.cos(a)*.065,bz,0,0,a,[1,.9,.55]);
        }
        add(G.sph(.024,6,4),'#f6e0bf',bx,by,bz+.018,0,0,0,[1,1,.7]);
      }
    });
  }));
  f.tick=t=>{crown.rotation.z=Math.sin(t*.48)*.009;};
};

B.gpt2_cat=f=>{
  nonsolid(f);
  // The existing builder's size option sets a ~.60 m station cat; root scale stays 1.
  const actor=f.catActor=new ChibiCat({scale:.44});
  const cat=f.cat=actorRoot(f,actor);put(cat,0,.025,0);f.add(cat);
  f.navigationBody=actor.body;f.tick=actorTick(actor);
};

B.gpt2_birds=f=>{
  // No existing flying-bird actor is available. Reserve the intended location
  // for the game's future bird rather than fabricate a new animal silhouette.
  nonsolid(f);const spot=f.markedSpot=grp();
  spot.name='gpt2-existing-bird-reserved';spot.userData.markedSpot={kind:'existing-game-bird',count:3};f.add(spot);
};

B.gpt2_traveller=f=>{
  nonsolid(f);const actor=f.travellerActor=new Char('bunny');actor.pose='hold';
  const traveller=f.traveller=actorRoot(f,actor);put(traveller,0,.004,0);f.add(traveller);
  f.navigationBody=actor.body;
  // The luggage and newspaper remain separate station props, sized beside the
  // unchanged native bunny instead of replacing its body with a custom model.
  const luggage=f.luggage=grp();f.add(luggage);f.live.push(luggage);
  luggage.add(mc('gpt2-traveller-luggage-v2-native',({add})=>{
    add(G.box(.58,.62,.3,.065),'#cf9b6b',.67,.36,.02);
    for(const x of [.5,.83])add(G.box(.045,.59,.316,.012),C.brown,x,.36,.02);
    add(G.tor(.1,.028,Math.PI,6,12),C.brown,.67,.7,.02);
    add(G.box(.14,.18,.02,.015),C.cream,.75,.5,.188,0,0,.15);
    add(G.box(.38,.38,.26,.055),'#f4afd0',-.61,.22,.08);
    add(G.tor(.1,.025,Math.PI,6,12),'#a09769',-.61,.48,.08);
  }));
  const paper=f.newspaper=grp();put(paper,0,.26,.42,.25);f.add(paper);f.live.push(paper);
  paper.add(mc('gpt2-traveller-paper-v2-native',({add})=>{
    add(G.box(.34,.04,.24,.015),'#fefde9',0,0,0);
    add(G.box(.028,.018,.23,.006),'#f6e0bf',.156,.025,0,0,0,-.2);
    for(let x=-.12;x<.13;x+=.07)add(G.box(.025,.01,.16,.004),'#b8a68b',x,.026,0);
  }));
  actor.held=paper;paper.userData.grip=.2;paper.userData.gy=.4;paper.userData.gz=.64;
  // (① 10/22: the bunny and its two bags are in the way — our walk grid, not the workshop's nav)
  f.walkBoxes=[[-.82,0,-.22,.98,.9,.3]];
  f.tick=actorTick(actor);
};
export const GPTST_LIFE_BUILDERS=B;
export const GPTST_LIFE_INFO={
  gpt2_train:{w:7,d:2,name:'천천히 오가는 봄빛 열차',hidden:true},
  gpt2_waitingtrain:{w:7,d:2,name:'문을 열고 기다리는 벚꽃마을 로컬 열차',hidden:true},
  gpt2_sakura:{w:3,d:3,name:'꽃잎이 흩날리는 벚나무',hidden:true},
  gpt2_cat:{w:1,d:1,name:'꼬리를 흔드는 역 고양이',hidden:true},
  gpt2_birds:{w:1,d:1,name:'기존 게임 새 배치를 위한 예약 지점',hidden:true},
  gpt2_traveller:{w:2,d:1,name:'짐을 챙겨 기다리는 토끼 승객',hidden:true},
};
