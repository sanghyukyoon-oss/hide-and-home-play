// Corner shop workshop: a cut-away house, street furniture and tangible delivery machinery.
// All colour/geometry is fed through the game's existing toon / bake / outline pipeline.
import * as THREE from 'three';
import { HG as G, hmc as mc } from './house-props.js';
import { put, grp, rbox, mat, plane, canvasTex, texCache } from './kit.js';
import { ChibiCat } from './cat.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)

const C = { cream:'#fef2e1', pale:'#feebc8', wood:'#eecfa3', honey:'#eaa440', brown:'#6f4b30', mint:'#84ae9d', sage:'#a2c8bb', blue:'#d4e2e5', terra:'#ee9d4c', soil:'#78481d', road:'#a7a595', red:'#ee8264', leaf:'#84ae9d' };
const HP=Math.PI/2, B={};
const labels=texCache();
function label(text,w,h,bg=C.cream,fg=C.brown){
  text=tr(text);   // (영어 화면에선 영어 — 사전 gfx/gpt-paper.js WORDS, ① 10/22)
  // These are screwed enamel plaques, not loose paper. Match texture aspect and keep 9% clear margins.
  const t=labels.get([text,w,h,bg,fg].join('|'),()=>canvasTex(512,Math.max(64,Math.round(512*h/w)),(c,W,H)=>{
    c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
    let size=H*.68,metrics;
    for(let i=0;i<30;i++){
      c.font=`bold ${size}px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`;metrics=c.measureText(text);
      const height=(metrics.actualBoundingBoxAscent??size*.8)+(metrics.actualBoundingBoxDescent??size*.2);
      if(metrics.width<=W*.82&&height<=H*.82)break;
      size*=Math.min(.94,W*.82/Math.max(1,metrics.width),H*.82/Math.max(1,height));
    }
    c.fillText(text,W/2,H/2);
  }));
  const plaque=grp();plaque.add(put(rbox(w+.025,h+.025,.026,bg,.012),0,0,.015));
  plaque.add(put(plane(w,h,mat('#ffffff',{map:t})),0,0,.035));
  for(const x of [-w*.455,w*.455])plaque.add(put(rbox(.025,.025,.012,C.brown,.006),x,0,.041));
  return plaque;
}
const piece=(f,key,fn)=>f.add(mc('gptcorner|'+key,fn));
function hit(f,p,x,y,z,w=.85,h=.85,d=.2){
  // At the authored 390px start camera this projects to >=44px on its shorter screen axis.
  w=Math.max(w,1.5);h=Math.max(h,1.4);d=Math.max(d,.4);
  const q=put(rbox(w,h,d,C.cream,.01),x,y,z);q.material=new THREE.MeshBasicMaterial({visible:false});q.userData.proxy=true;
  f.add(q); // It stays separate from visible art during baking and carries the same part tag.
  q.userData.part=p; f.live=(f.live||[]).concat(q); return q;
}
function basket(add,x,y,z,w=.85,d=.7){
  add(G.box(w,.09,d,.025),C.wood,x,y+.045,z);
  for(const sx of [-1,1])add(G.box(.055,.35,d,.015),C.wood,x+sx*(w/2-.025),y+.22,z);
  for(const zz of [-1,1]){add(G.box(w,.07,.06,.015),C.honey,x,y+.37,z+zz*(d/2-.025));for(let i=0;i<5;i++)add(G.box(.055,.27,.045,.012),C.wood,x+(i-2)*w/5,y+.21,z+zz*(d/2-.025));}
}

B.gpt_foundation=(f)=>{
  f.noSolid=true; f.collideBox=[0,-1,0,0,-1,0];
  piece(f,'foundation',({add,tube})=>{
    // Three masonry strata below the map's existing paving: thick, grounded and softly bevelled.
    add(G.box(9.35,.16,8.35,.07),C.terra,0,-.59,0);
    add(G.box(9.28,.14,8.28,.05),C.soil,0,-.73,0);
    add(G.box(9.38,.08,8.38,.035),C.wood,0,-.84,0);
    for(let i=0;i<16;i++)add(G.box(.45,.1,.018,.008),C.wood,-4.15+i*.55,-.59,4.183);
    for(let i=0;i<14;i++)add(G.box(.018,.1,.45,.008),C.wood,4.683,-.59,-3.8+i*.55);
    // Raised curb and zebra crossing, with a gap at the store entrance.
    for(let i=0;i<12;i++)add(G.box(.59,.09,.2,.025),C.pale,-4.1+i*.69,.04,2.86);
    for(let i=0;i<7;i++)add(G.box(.3,.014,.78,.018),C.cream,-1.3+i*.47,.024,3.43);
    for(let i=0;i<7;i++)add(G.box(.014,.016,.43,.005),C.pale,3.36,.025,-3.5+i*.8);
    for(const x of [-3.8,3.75]){
      for(const xx of [-.32,.32])tube([x+xx,.06,3.65],[x+xx,.64,3.65],.05,C.honey,10);
      tube([x-.32,.64,3.65],[x+.32,.64,3.65],.05,C.honey,10);
    }
    // Drain cover / inset grate by the stair foot.
    add(G.box(.64,.028,.44,.04),C.brown,3.28,.025,1.95);
    for(let i=0;i<7;i++)add(G.box(.037,.018,.35,.006),C.blue,3.03+i*.08,.046,1.95);
  });
};

B.gpt_shopframe=(f)=>{
  f.noSolid=true; f.collideBox=[-2.48,0,-2.3,2.48,.05,2.3];
  // Camera-facing shell pieces fold from floor level; their window and attached details travel with them.
  const north=grp(),west=grp();f.gptWalls={N:north,W:west};f.live=(f.live||[]).concat(north,west);f.add(north);f.add(west);
  north.add(mc('gptcorner|shopframe-N',({add,tube})=>{
    add(G.box(5.1,2.68,.15,.025),C.cream,0,1.44,-2.39);
    add(G.cyl(.23,.23,.055,22),C.honey,1.95,2.21,-2.28,HP);
    add(G.cyl(.19,.19,.06,22),C.cream,1.95,2.21,-2.24,HP);
    tube([1.95,2.21,-2.2],[1.95,2.34,-2.2],.016,C.brown,6);
    tube([1.95,2.21,-2.2],[2.06,2.16,-2.2],.016,C.brown,6);
    add(G.box(.52,.55,.12,.04),C.terra,-2.15,1.77,-2.27);
    add(G.box(.38,.3,.025,.014),C.cream,-2.15,1.78,-2.19);
  }));
  west.add(mc('gptcorner|shopframe-W',({add})=>{
    // West window remains a genuine opening between masonry pieces.
    add(G.box(.15,.85,4.64,.025),C.mint,-2.51,.51,0);
    add(G.box(.15,.51,4.64,.025),C.cream,-2.51,2.55,0);
    for(const z of [-1.8,1.74])add(G.box(.15,1.43,1.1,.025),C.cream,-2.51,1.65,z);
    for(const z of [-1.24,1.18])add(G.box(.18,1.36,.07,.015),C.brown,-2.49,1.63,z);
    for(const y of [.97,2.29])add(G.box(.18,.07,2.48,.015),C.brown,-2.49,y,-.03);
    for(const z of [-.44,.38])add(G.box(.18,1.3,.045,.01),C.wood,-2.49,1.63,z);
  }));
  piece(f,'shopframe',({add,tube})=>{
    add(G.box(5.08,.09,4.86,.035),C.wood,0,.05,0);
    // Warm cut-section posts, a small facade wing and fascia. Front stays open for play.
    for(const x of [-2.5,2.5])add(G.box(.16,2.74,.16,.03),C.wood,x,1.46,2.33);
    add(G.box(5.17,.25,.22,.035),C.mint,0,2.72,2.33);
    add(G.box(.16,2.7,.16,.025),C.wood,2.5,1.43,-2.34);
    for(let i=0;i<9;i++)add(G.box(.52,.17,.025,.014),i%2?C.terra:C.pale,-2.2+i*.55,.01,2.435);
    // The storefront's remaining left window wing gives the cutaway a recognisable shop front.
    add(G.box(.91,.72,.13,.025),C.mint,-1.99,.51,2.34);
    add(G.box(.91,.09,.17,.02),C.brown,-1.99,.93,2.34);
    // Striped fabric awning over the left shop wing, with thick scalloped hem.
    for(let i=0;i<8;i++){
      const x=-2.52+(i+.5)*.31,c=i%2?C.cream:C.mint;
      add(G.box(.312,.075,.96,.025),c,x,2.37,2.59,.17);
      add(G.box(.312,.2,.095,.035),c,x,2.18,3.05);
    }
    for(const x of [-2.45,-.12])tube([x,1.95,2.35],[x,2.25,3.01],.025,C.brown,8);
  });
  f.add(put(label('모퉁이 상점',2.05,.24),-.98,2.74,2.453));
};

B.gpt_stairs=(f)=>{
  f.collideBox=[-.59,0,-2.38,.59,2.9,2.38];
  piece(f,'stairs',({add,tube})=>{
    const n=13,run=3.7,rise=2.9;
    for(let i=0;i<n;i++){
      const z=1.98-i*run/n,y=(i+1)*rise/n;
      add(G.box(1.06,.105,run/n+.035,.02),C.wood,0,y-.052,z);
      add(G.box(.93,.12,.04,.009),C.mint,0,y-.12,z+run/n/2);
      if(i%2===0)for(const x of [-.55,.55])tube([x,y,z],[x,y+.62,z],.027,C.mint,8);
    }
    for(const x of [-.52,.52]){
      tube([x,.08,2.1],[x,2.85,-1.65],.055,C.mint,8);
      tube([x,.7,2.05],[x,3.53,-1.69],.038,C.mint,8);
      tube([x,.18,-1.93],[x,2.9,-1.93],.06,C.mint,8);
    }
    add(G.box(1.3,.17,1.17,.035),C.wood,0,2.805,-2.18);
    // The landing opens into the terrace; the terrace's own perimeter rail protects its back.
    // A parcel and little work boots sit under the landing, never in the stair flight.
    add(G.box(.55,.44,.5,.035),C.wood,0,.29,-2.1);
    add(G.box(.1,.46,.51,.01),C.pale,0,.3,-2.1);
    for(const x of [-.2,.17])add(G.box(.19,.21,.3,.06),C.terra,x,.14,-1.52);
  });
  f.spot('on',null,0,2.92,-2.1,{label:'계단 참',maxH:.65,scale:1.4});
};

B.gpt_roof=(f)=>{
  f.noSolid=true;f.collideBox=[0,2.5,0,0,2.5,0];
  piece(f,'roof',({add,tube})=>{
    // Rear half of a metal gable roof: the camera half is cut away, never covers the upstairs home.
    add(G.box(5.32,.16,1.78,.04),C.mint,0,2.48,-1.02,-.32);
    for(let i=0;i<15;i++)add(G.box(.035,.05,1.73,.012),'#599b8b',-2.5+i*.357,2.58,-1.02,-.32);
    add(G.box(5.42,.15,.15,.04),C.wood,0,2.8,-.23);
    add(G.box(5.44,.12,.12,.035),C.brown,0,2.13,-1.85);
    // Chimney and dormer silhouette inherited from the two corner-shop references.
    add(G.box(.38,.8,.44,.025),C.terra,-1.83,2.75,-1.35);
    add(G.box(.49,.12,.55,.035),C.pale,-1.83,3.19,-1.35);
    add(G.box(.34,.025,.39,.015),C.brown,-1.83,3.259,-1.35);
    add(G.box(1.07,.56,.65,.03),C.cream,.48,2.81,-.88);
    add(G.box(1.22,.13,.79,.025),C.wood,.48,3.12,-.87);
    add(G.box(.81,.3,.04,.06),C.blue,.48,2.84,-.532);
    for(const x of [.12,.48,.84])add(G.box(.035,.29,.055,.01),C.brown,x,2.84,-.501);
    add(G.box(.98,.055,.055,.015),C.brown,.48,2.65,-.5);
    // A cream AC unit on the outside west wall, with real grille geometry and copper pipe.
    add(G.box(.32,.62,.8,.04),C.cream,-2.75,1.29,-.7);
    add(G.cyl(.2,.2,.04,18),C.blue,-2.94,1.29,-.7,0,0,HP);
    for(let i=0;i<5;i++)add(G.box(.035,.36,.025,.006),C.wood,-2.97,1.29,-.86+i*.08);
    tube([-2.73,.98,-.26],[-2.73,.4,-.26],.025,C.terra,8);
  });
};

B.gpt_sign=(f)=>{
  piece(f,'signpost',({add,tube})=>{
    add(G.cyl(.19,.23,.08,14),C.wood,0,.04,0);
    tube([0,.08,0],[0,2.18,0],.065,C.mint,10);
    tube([0,2.18,0],[1.14,2.18,0],.055,C.mint,10);
    for(const x of [.3,.94])tube([x,2.17,0],[x,1.98,0],.025,C.brown,8);
  });
  const pv=put(grp(),.62,1.6,0);
  pv.add(rbox(1.08,.82,.13,C.wood,.055));pv.add(put(label('어서 와요',.94,.29),0,.07,.075));
  pv.add(put(label('열쇠 → 문',.96,.28,C.cream,C.mint),0,.05,-.075,0,Math.PI));
  // Geometry clue: a capsule, key and shutter on the reverse side (legible without tiny text).
  pv.add(put(rbox(.68,.08,.03,C.mint,.018),0,-.22,-.085));
  pv.add(mc('gpt-sign-clue',({add,tube})=>{
    add(G.sph(.105,10,8),C.honey,.29,.08,-.11,0,0,0,[1,1,.35]);
    add(G.box(.18,.025,.045,.008),C.cream,.29,.08,-.15);
    add(G.tor(.065,.019,Math.PI*2,5,14),C.honey,.025,.11,-.11);
    tube([.025,.055,-.11],[.025,-.09,-.11],.021,C.honey,6);
    add(G.box(.07,.035,.04,.008),C.honey,-.002,-.07,-.11);
    for(let i=0;i<4;i++)add(G.box(.17,.035,.04,.008),C.sage,-.28,-.01+i*.06,-.11);
  }));
  f.add(pv);const p=f.part('picture',pv,t=>pv.rotation.y=Math.PI*t,{label:'뒤집는 간판',sfx:'flip',dur:.45});p.gptAction='sign';
  hit(f,p,.62,1.6,0,1.05,.85,.3);
};

B.gpt_gacha=(f)=>{
  piece(f,'gacha',({add})=>{
    add(G.box(.91,.17,.84,.05),C.wood,0,.085,0);
    add(G.box(.79,.68,.7,.07),C.red,0,.49,0);
    add(G.box(.76,.65,.66,.075),C.cream,0,1.14,-.02);
    add(G.box(.59,.44,.04,.06),C.blue,0,1.17,.329);
    for(let i=0;i<8;i++)add(G.sph(.088,10,7),[C.honey,C.mint,C.red,C.cream][i%4],-.2+(i%3)*.2,.99+Math.floor(i/3)*.13,.35);
    add(G.box(.41,.22,.025,.035),C.brown,0,.29,.365);
    add(G.box(.47,.06,.22,.018),C.cream,0,.16,.42);
    add(G.box(.065,.18,.025,.01),C.brown,.25,.67,.36);
  });
  const crank=put(grp(),-.1,.64,.42);crank.add(put(rbox(.4,.12,.13,C.cream,.045),0,0,0));crank.add(put(rbox(.13,.19,.11,C.honey,.04),.13,-.08,.08));
  const capsule=put(grp(),0,.3,.46);capsule.add(mc('gpt-open-capsule',({add})=>{
    add(G.cyl(.17,.15,.055,18),C.honey,0,-.075,0);
    add(G.tor(.17,.035,Math.PI*2,6,20),C.honey,0,-.035,0,HP);
  }));
  const capLid=put(grp(),0,-.035,-.17);capLid.add(put(rbox(.35,.07,.34,C.cream,.03),0,.035,.17));capsule.add(capLid);
  f.add(crank);f.add(capsule);
  const p=f.part('lever',[crank,capsule,capLid],t=>{crank.rotation.z=-Math.PI*2*t;capsule.position.set(0,.3,.2+.4*t);capLid.rotation.x=-1.5*t;},{label:'캡슐 손잡이',sfx:'ratchet',dur:1.6});p.gptAction='gacha';
  f.spot('inside',capsule,0,.15,0,{part:p,label:'캡슐 속',maxH:.5,scale:1.55});hit(f,p,0,.65,.48,.94,.88,.3);
  f.add(put(label('캡슐 상점',.66,.15),0,1.53,.32));
};

B.gpt_shutter=(f)=>{
  piece(f,'shutter-frame',({add})=>{
    for(const x of [-.84,.84])add(G.box(.12,2.3,.18,.025),C.mint,x,1.15,0);
    add(G.box(1.84,.24,.33,.04),C.mint,0,2.34,0);
    add(G.box(1.55,.08,.75,.025),C.wood,0,.08,-.25);
    add(G.box(1.55,1.9,.08,.015),C.pale,0,1.08,-.57);
    for(const x of [-.5,.42])add(G.box(.52,.45,.44,.04),C.wood,x,.34,-.27);
    for(const x of [-.5,.42])add(G.box(.09,.47,.45,.008),C.cream,x,.35,-.27);
  });
  const curtain=grp();curtain.add(mc('gpt-shutter-slats',({add})=>{
    for(let i=0;i<13;i++)add(G.box(1.55,.14,.09,.018),i%2?C.sage:C.mint,0,.2+i*.156,.05);
    add(G.box(.54,.12,.14,.035),C.honey,0,.45,.14);
  }));f.add(curtain);
  const crank=put(grp(),1.05,1.05,.16);crank.add(put(rbox(.12,.49,.12,C.wood,.03),0,0,0));crank.add(put(rbox(.23,.13,.18,C.honey,.04),0,-.22,.12));f.add(crank);
  const p=f.part('curtain',[curtain,crank],t=>{curtain.position.y=2.05*t;curtain.scale.y=1-.91*t;crank.rotation.z=-t*Math.PI*6;},{label:'셔터 크랭크',sfx:'ratchet',dur:1.6});p.gptAction='shutter';hit(f,p,1.03,1.05,.2,.9,1,.4);
  f.spot('inside',null,0,.6,-.1,{part:p,label:'셔터 안 택배함',maxH:.65,scale:1.4});
};

B.gpt_dumbwaiter=(f)=>{
  piece(f,'lift-frame',({add,tube})=>{
    for(const x of [-.45,.45])add(G.box(.085,3.72,.12,.018),C.mint,x,1.86,-.25);
    add(G.box(1,.13,.62,.025),C.wood,0,3.74,-.18);
    for(const x of [-.33,.33])tube([x,.2,-.3],[x,3.66,-.3],.018,C.brown,8);
    add(G.cyl(.16,.16,.085,18),C.honey,0,3.66,-.2,HP);
  });
  const car=put(grp(),0,2.9,0);car.add(mc('gpt-lift-car',({add})=>{
    add(G.box(.86,.12,.74,.025),C.wood,0,.06,0);
    for(const x of [-.39,.39])add(G.box(.07,.7,.65,.018),C.cream,x,.41,-.02);
    add(G.box(.78,.59,.06,.02),C.mint,0,.4,-.34);
    add(G.box(.92,.1,.76,.025),C.wood,0,.77,0);
    add(G.box(.4,.22,.35,.035),C.red,-.12,.24,-.08);
    add(G.cyl(.12,.1,.22,14),C.cream,.2,.23,.08);
  }));f.add(car);
  const p=f.part('drawer',car,t=>car.position.y=2.9*(1-t),{label:'층간 배달 승강기',sfx:'ratchet',dur:1.6});p.gptAction='lift';
  f.spot('inside',car,0,.14,.23,{part:p,label:'승강기 안',maxH:.7,scale:1.4});
};

B.gpt_roofbasket=(f)=>{
  piece(f,'roofpulley',({add,tube})=>{
    for(const x of [-.52,.52])tube([x,.08,-.17],[x,3.83,-.17],.055,C.mint,10);
    tube([-.61,3.83,-.17],[.61,3.83,-.17],.06,C.mint,10);
    add(G.cyl(.23,.23,.1,20),C.wood,0,3.77,-.12,HP);
    for(const x of [-.42,.42])tube([x,.45,-.13],[x,3.65,-.13],.022,C.brown,8);
  });
  const box=put(grp(),0,2.96,.18);box.add(mc('gpt-roof-basket',({add,tube})=>{
    basket(add,0,0,0,1,.8);for(const x of [-.42,.42])tube([x,.4,0],[0,.95,-.1],.024,C.brown,8);
  }));f.add(box);
  const p=f.part('lid',box,t=>box.position.y=2.96-1.96*t,{label:'옥상 도르래 바구니',sfx:'ratchet',dur:1.6});p.gptAction='pulley';
  f.spot('inside',box,0,.13,.08,{part:p,label:'배달 바구니 안',maxH:.8,scale:1.9});
};

B.gpt_watertank=(f)=>{
  piece(f,'watertank',({add,tube})=>{
    for(const x of [-.34,.34])for(const z of [-.28,.28])add(G.box(.07,.35,.07,.02),C.wood,x,.18,z);
    add(G.cyl(.45,.45,.85,22),C.sage,0,.8,0);
    for(const y of [.45,1.12])add(G.tor(.455,.035,Math.PI*2,6,24),C.mint,0,y,0,HP);
    add(G.cyl(.48,.48,.1,22),C.cream,0,1.28,0);
    add(G.box(.15,.32,.2,.025),C.mint,0,.56,.5);
    tube([0,.48,.52],[0,.3,.52],.045,C.wood,10);
    add(G.cyl(.3,.24,.22,16),C.terra,0,.11,.65);
    add(G.cyl(.26,.26,.025,16),C.soil,0,.23,.65);
  });
  const valve=put(grp(),0,.78,.6);valve.add(mc('gpt-valve-large',({add})=>{
    add(G.tor(.3795,.09075,Math.PI*2,6,20),C.honey,0,0,0);for(const a of [0,HP])add(G.box(.66,.0825,.099,.022),C.honey,0,0,0,0,0,a);
  }));f.add(valve);
  const flower=put(grp(),0,.24,.65);flower.add(mc('gpt-flower',({add,tube})=>{
    tube([0,0,0],[0,.44,0],.025,C.leaf,8);
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;add(G.sph(.1,10,8),C.honey,Math.cos(a)*.12,.49+Math.sin(a)*.12,0);}
    add(G.sph(.08,12,8),C.terra,0,.49,.04);
  }));f.add(flower);
  const water=put(grp(),0,.39,.54);water.add(mc('gpt-water',({add})=>{for(let i=0;i<5;i++)add(G.sph(.04,8,6),C.blue,0,-i*.035,.005*i);}));f.add(water);
  const p=f.part('lever',[valve,flower,water],t=>{valve.rotation.z=-Math.PI*2*t;flower.scale.setScalar(.18+.82*t);water.scale.y=Math.sin(Math.PI*t)*1.4;},{label:'물탱크 수도꼭지',sfx:'blub',dur:1.6});p.gptAction='tap';p.setOpen(0);hit(f,p,0,.78,.6,.85,.85,.35);
};

B.gpt_sleepcat=(f)=>{
  piece(f,'catmat',({add})=>{
    add(G.cyl(.47,.47,.045,26),C.pale,0,.025,0);
    add(G.cyl(.16,.13,.09,18),C.mint,.52,.045,.24);
    add(G.cyl(.13,.13,.014,18),C.brown,.52,.097,.24);
  });
  // Reuse the game's cat; only the cushion and snack belong to this new prop.
  const resident=new ChibiCat({scale:.42}),cat=resident.root;
  cat.userData.gptCanonicalCat='src/gfx/cat.js:ChibiCat';
  // This resident stays asleep. Remove unused alternate expressions before the
  // furniture baker merges plain meshes, including meshes marked invisible.
  resident.eyesHappy.forEach(e=>e.removeFromParent());resident.mouthO.removeFromParent();
  resident.eyes.forEach(e=>e.scale.y=.12);
  cat.position.y=.05;f.add(cat);
  const food=put(grp(),.52,.11,.24);food.add(mc('gpt-catfood',({add})=>{
    for(const x of [-.06,.02,.07])add(G.sph(.035,8,6),C.honey,x,.012,Math.sin(x*25)*.04);
  }));f.add(food);
  const p=f.part('cushion',[cat,food],t=>{cat.position.x=.42*t;cat.position.z=.08*t;cat.rotation.y=-.55*t;food.scale.setScalar(Math.max(.001,t));},{label:'낮잠 고양이',sfx:'snore',dur:1.2});p.gptAction='cat';p.setOpen(0);
  f.spot('inside',null,0,.07,.1,{part:p,label:'고양이 밑 방석',maxH:.5,scale:1.6}).reserved=true;hit(f,p,0,.35,.1,1,.8,.75);   // (② 10/22 봇: the cushion lifts but the cat still covers what's under it — nothing hides there)
};

B.gpt_utilitypole=(f)=>{
  piece(f,'pole',({add,tube})=>{
    add(G.cyl(.1,.16,5.1,14),C.wood,0,2.55,0);add(G.cyl(.21,.25,.35,14),C.sage,0,.175,0);
    for(const y of [4.32,4.62])add(G.box(1.12,.09,.12,.02),C.brown,0,y,0);
    for(const x of [-.45,.45])for(const y of [4.44,4.74])add(G.cyl(.065,.065,.18,10),C.cream,x,y,0);
    for(const y of [1.5,1.85])add(G.tor(.105,.02,Math.PI*2,6,16),C.mint,0,y,0,HP);
    // Short, self-contained overhead loops. They never run into an invisible neighbouring house.
    for(const z of [-.05,.1]){let prev=[-.45,4.76,z];for(let i=1;i<=8;i++){let x=-.45+i*.18,p=[x,4.76-Math.sin(i*Math.PI/8)*.31,z];tube(prev,p,.014,C.brown,6);prev=p;}}
    add(G.box(.42,.5,.14,.03),C.cream,0,1.98,.15);
  });
  f.noSolid=true;
};

export const GPT_CORNER_BUILDERS=B;
export const GPT_CORNER_INFO={
  gpt_foundation:{w:9,d:8,name:'모퉁이 지층',hidden:true},gpt_shopframe:{w:5,d:5,name:'열린 상점 골조',hidden:true},gpt_stairs:{w:2,d:5,name:'외부 계단',hidden:true},gpt_roof:{w:5,d:3,name:'단면 지붕',hidden:true},
  gpt_sign:{w:1,d:1,name:'모퉁이 간판',hidden:true},gpt_gacha:{w:1,d:1,name:'캡슐 뽑기',hidden:true},gpt_shutter:{w:2,d:1,name:'배달 창고 셔터',hidden:true},gpt_dumbwaiter:{w:1,d:1,name:'배달 승강기',hidden:true},gpt_roofbasket:{w:1,d:1,name:'옥상 바구니',hidden:true},gpt_watertank:{w:1,d:1,name:'옥상 물탱크',hidden:true},gpt_sleepcat:{w:2,d:1,name:'낮잠 고양이',hidden:true},gpt_utilitypole:{w:1,d:1,name:'동네 전신주',hidden:true}
};
