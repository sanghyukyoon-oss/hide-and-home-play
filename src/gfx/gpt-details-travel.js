// Workshop-only surface dressing: static meshes, with no furniture, parts or
// navigation records. Requested swatches come only from each original builder;
// createDetailKit copies the nearest actual, already harmonized map material.
import { createDetailKit } from './gpt-detail-kit.js';

const HP = Math.PI / 2;
const SHOP = { wood:'#eecfa3', edge:'#c67f2a', dark:'#6f4b30', paper:'#fefde9', cream:'#fef2e1',
  green:'#84ae9d', mint:'#a2c8bb', coral:'#ee8264', clay:'#ee9d4c', sky:'#d4e2e5' };
const STATION = { wood:'#cf9b6b', edge:'#976d4e', dark:'#6f4b30', paper:'#fbf7f0', cream:'#f4f2f0',
  green:'#52b89b', mint:'#8ad1b6', pink:'#e876aa', coral:'#ed876f', yellow:'#feb53d', steel:'#a5bdc6' };
const CAR = { wood:'#bc9168', edge:'#6f4b30', dark:'#644936', paper:'#fbf7f0', cream:'#e9f0ed',
  green:'#50b99c', mint:'#6bc7b0', blue:'#63aeda', pink:'#e575a3', coral:'#ee7b72', steel:'#c8d8db' };

function crate(k, C, w=.56, d=.4, h=.31) {
  k.box(w,.06,d,C.edge,0,.03,0);
  for (const x of [-w/2+.025,w/2-.025]) k.box(.05,h,d,C.wood,x,h/2,0);
  for (const z of [-d/2+.025,d/2-.025]) {
    for (const y of [.105,h-.035]) k.box(w,.07,.05,C.wood,0,y,z);
    for (const x of [-w*.31,0,w*.31]) k.box(.045,h-.1,.035,C.edge,x,h/2,z);
  }
}
function bottle(k,C,x,z,color=C.green) {
  k.cylinder(.052,.057,.20,color,x,.18,z);
  k.cylinder(.027,.046,.055,color,x,.307,z);
  k.cylinder(.03,.03,.055,C.cream,x,.358,z);
  k.box(.065,.08,.026,C.paper,x,.18,z+.048);
}
function bag(k,C,color=C.coral) {
  k.box(.34,.31,.22,color,0,.17,0,.025);
  k.box(.22,.13,.035,C.paper,0,.16,.127);
  for (const z of [-.065,.065]) {
    k.rod([-.10,.31,z],[-.10,.44,z],.021,C.edge);
    k.rod([-.10,.44,z],[.10,.44,z],.021,C.edge);
    k.rod([.10,.44,z],[.10,.31,z],.021,C.edge);
  }
}
function books(k,C) {
  for (let i=0;i<3;i++) {
    const y=.045+i*.085, color=[C.green,C.coral,C.wood][i];
    k.box(.41,.075,.29,color,0,y,0);
    k.box(.34,.04,.025,C.paper,.025,y,.151);
    k.box(.025,.06,.30,C.edge,-.16,y,0);
  }
}
function wateringCan(k,C) {
  k.cylinder(.115,.125,.25,C.green,0,.125,0);
  k.cylinder(.12,.12,.035,C.mint,0,.265,0);
  k.cylinder(.065,.065,.037,C.dark,0,.287,0);
  k.rod([.09,.10,0],[.27,.29,0],.036,C.green);
  k.cylinder(.058,.045,.055,C.mint,.28,.31,0).rotation.z=-.65;
  k.rod([-.10,.08,0],[-.22,.08,0],.025,C.edge);
  k.rod([-.22,.08,0],[-.22,.26,0],.025,C.edge);
  k.rod([-.22,.26,0],[-.10,.26,0],.025,C.edge);
}
function plant(k,C,flower=false) {
  k.cylinder(.12,.09,.20,C.coral,0,.10,0);
  k.cylinder(.13,.13,.04,C.wood,0,.215,0);
  k.cylinder(.105,.105,.025,C.dark,0,.244,0);
  for (let i=0;i<3;i++) {
    const a=i*Math.PI*2/3, x=Math.cos(a)*.07,z=Math.sin(a)*.07;
    k.rod([0,.25,0],[x,.43+(i%2)*.08,z],.02,C.green);
    k.sphere(.09,C.mint,x,.36,z,[1,.47,.75]);
    k.sphere(flower?.067:.085,flower?(C.pink||C.paper):C.green,x,.45+(i%2)*.08,z,[1,.7,1]);
  }
}
function broom(k,C) {
  k.box(.23,.17,.12,C.wood,0,.095,0);
  for (let i=0;i<4;i++) k.box(.025,.14,.025,C.edge,-.075+i*.05,.085,.074);
  k.rod([0,.18,0],[.10,1.02,-.04],.025,C.edge);
  k.cylinder(.032,.032,.16,C.green,.092,.91,-.035);
}
function parcel(k,C) {
  k.box(.46,.31,.33,C.wood,0,.155,0);
  k.box(.07,.325,.34,C.paper,0,.162,0);
  k.box(.47,.06,.34,C.edge,0,.18,0);
  k.box(.15,.08,.027,C.paper,.13,.245,.18);
}
function rolledMat(k,C) {
  k.cylinder(.11,.11,.39,C.mint,0,.12,0).rotation.z=HP;
  for (const x of [-.13,.13]) k.cylinder(.114,.114,.035,C.edge,x,.12,0).rotation.z=HP;
  k.cylinder(.055,.055,.026,C.paper,.207,.12,0).rotation.z=HP;
}
function windowPlant(k,C,flower=false) {
  // A small-footed pot fits the actual 23 cm carriage sill without going
  // through the retained wall. Upright leaves keep its silhouette readable.
  k.cylinder(.078,.058,.17,C.coral,0,.085,0);
  k.cylinder(.084,.084,.03,C.wood,0,.185,0);
  k.cylinder(.062,.062,.022,C.dark,0,.211,0);
  for (const z of [-.07,.055]) {
    k.rod([0,.22,0],[0,.42,z],.019,C.green);
    k.sphere(.065,C.mint,0,.32,z,[.5,1.15,1]);
    k.sphere(.065,flower?C.pink:C.green,0,.44,z,[.75,.8,1]);
  }
}

function corner(k,index) {
  const C=SHOP;
  if (index===0) {
    // Shallow sidewalk joints are limited to its margins, away from the door,
    // zebra crossing, crank and the unchanged path up the staircase.
    for (const x of [-4.18,4.13]) for (let z=-3.2;z<2.7;z+=.63) {
      k.box(.45,.025,.03,C.edge,x,.018,z);
      k.box(.03,.025,.38,C.cream,x,.018,z+.22);
    }
    for (let i=0;i<13;i++) {
      const y=(i+1)*2.9/13,z=2.06-i*3.7/13;
      k.box(.84,.027,.035,C.cream,2.38,y+.013,z+.11);
    }
    // The exposed timber floor section has end grain and a lower bead.
    k.box(4.02,.045,.035,C.edge,-1.5,2.86,-.28);
    for (let i=0;i<12;i++) k.box(.027,.075,.03,C.wood,-3.35+i*.33,2.80,-.265);
    for (let x=-4.05;x<4.5;x+=.57) k.box(.027,.12,.028,C.edge,x,-.71,4.185);
    k.prop('shop-fruit-crate',-2.78,.025,2.36,q=>{
      crate(q,C);
      for (const [x,z] of [[-.13,-.09],[.11,-.09],[-.13,.10],[.11,.10]]) {
        q.sphere(.10,C.coral,x,.32,z,[1,.9,1]);
        q.box(.025,.045,.025,C.green,x,.417,z);
      }
    });
    k.prop('shop-return-bottles',-3.69,.025,2.37,q=>{
      crate(q,C,.50,.35,.24);
      for (const x of [-.12,.12]) bottle(q,C,x,0,x<0?C.green:C.sky);
    });
    k.prop('shop-sweeping-broom',-3.94,.025,1.70,q=>broom(q,C));
    k.prop('shop-delivery-parcel',-4.10,.025,-.70,q=>parcel(q,C));
    k.prop('shop-grocery-tote',-2.12,.025,2.40,q=>bag(q,C,C.mint));
    k.prop('shop-stock-tins',-2.78,.92,-.15,q=>{
      for (const z of [-.12,.12]) {
        q.cylinder(.10,.10,.24,z<0?C.coral:C.green,0,.12,z);
        q.cylinder(.105,.105,.035,C.cream,0,.257,z);
        q.box(.12,.08,.028,C.paper,0,.13,z+.095);
      }
    });
  } else if (index===1) {
    // Physical floor-board ends on the visible cut section, plus brick courses
    // on the existing chimney. No additions are parented to a moving blanket.
    for (let x=-2.25;x<1.4;x+=.32) {
      k.box(.026,.08,.03,C.edge,x,-.085,1.511);
      k.box(.15,.025,.035,C.wood,x,.016,1.43);
    }
    for (let i=0;i<4;i++) {
      k.box(.37,.028,.035,C.paper,-1.83,2.45+i*.18,-1.108);
      k.box(.028,.13,.035,C.edge,-1.83+(i%2?.08:-.07),2.525+i*.18,-1.108);
    }
    k.prop('home-reading-stack',1.18,.025,1.15,q=>books(q,C));
    k.prop('home-sewing-basket',.48,.025,1.22,q=>{
      crate(q,C,.40,.30,.23);
      q.sphere(.092,C.coral,-.08,.29,0);
      q.sphere(.085,C.mint,.09,.27,.03);
      q.rod([-.14,.30,-.06],[.12,.49,.01],.019,C.edge);
      q.rod([-.12,.30,-.02],[.14,.48,.05],.019,C.edge);
    });
  } else if (index===2) {
    for (let i=0;i<4;i++) {
      k.box(.025,.026,1.75,C.edge,-.72+i*.48,.018,0);
      k.box(1.75,.026,.025,C.cream,0,.018,-.73+i*.48);
    }
    k.prop('terrace-watering-can',-.65,.025,.35,q=>wateringCan(q,C));
    k.prop('terrace-potting-tray',.43,.025,.65,q=>{
      crate(q,C,.46,.31,.17);
      q.cylinder(.075,.055,.13,C.clay,-.10,.21,0);
      q.cylinder(.078,.078,.03,C.cream,-.10,.285,0);
      q.rod([.07,.13,0],[.13,.36,-.025],.022,C.edge);
      q.box(.10,.12,.045,C.sky,.14,.385,-.025);
    });
  }
}

function station(k) {
  const C=STATION;
  // Fine paving at the front fringe and connected stone joints in the exposed
  // plinth. The original tactile strip, stair flight and crossings stay clear.
  for (let x=-4.7;x<5.1;x+=.62) {
    k.box(.03,.11,.027,C.edge,x,-.12,4.748);
    k.box(.027,.026,.44,C.steel,x,.018,4.43);
  }
  for (const z of [.08,.48,.88,1.28,1.68]) {
    k.box(.03,.026,.025,C.edge,-5.18,.393,z);
    k.box(.60,.026,.028,C.steel,-4.97,.393,z);
  }
  // The ticket-office's solid outside flank is clad with lapped timber strips.
  for (let y=.70;y<2.15;y+=.23) k.box(.032,.035,1.05,C.edge,-3.779,y,.44);
  k.box(.06,.07,1.16,C.paper,-3.78,.53,.43);
  // Low screws / inset joins on the canopy fascia rather than extra signs.
  for (const x of [-1.37,-.49,.39,1.27,2.15]) k.box(.045,.045,.03,C.edge,x,2.73,.382);
  k.prop('station-garden-pot',-2.03,.025,4.60,q=>plant(q,C,true));
  k.prop('station-garden-can',-3.19,.025,4.43,q=>wateringCan(q,C));
  k.prop('station-wrapped-parcel',-2.56,.025,4.43,q=>parcel(q,C));
  k.prop('station-travel-tote',-.18,.025,4.43,q=>bag(q,C,C.green));
  k.prop('station-maintenance-box',-4.68,.395,1.29,q=>{
    q.box(.48,.23,.31,C.green,0,.115,0);
    q.box(.51,.065,.34,C.wood,0,.262,0);
    q.box(.19,.06,.09,C.edge,0,.323,0);
    for (const x of [-.14,.14]) q.box(.045,.11,.035,C.paper,x,.23,.177);
  });
  k.prop('station-cleaning-bucket',-5.02,.395,.54,q=>{
    q.cylinder(.14,.105,.26,C.mint,0,.13,0);
    q.cylinder(.15,.15,.035,C.paper,0,.277,0);
    q.cylinder(.118,.118,.025,C.steel,0,.302,0);
    q.rod([0,.20,0],[.07,.99,0],.025,C.edge);
    q.box(.17,.09,.12,C.paper,.07,1.02,0);
  });
  k.prop('station-platform-flower',-4.95,.395,-.34,q=>plant(q,C,true));
  k.prop('station-tea-delivery-crate',.30,.105,-4.35,q=>{
    crate(q,C,.43,.34,.26);
    for (const x of [-.10,.10]) {
      q.cylinder(.065,.065,.16,C.green,x,.25,0);
      q.cylinder(.07,.07,.03,C.wood,x,.345,0);
    }
  });
  k.prop('station-teashop-cups',4.13,1.025,-4.24,q=>{
    q.box(.48,.045,.18,C.wood,0,.023,0);
    for (const x of [-.12,.12]) {
      q.cylinder(.075,.06,.13,C.paper,x,.11,0);
      q.cylinder(.054,.054,.025,C.edge,x,.185,0);
      q.rod([x+.064,.07,0],[x+.115,.07,0],.023,C.green);
      q.rod([x+.115,.07,0],[x+.115,.15,0],.023,C.green);
      q.rod([x+.115,.15,0],[x+.064,.15,0],.023,C.green);
    }
  });
  k.prop('station-teashop-flower',4.67,1.025,-4.25,q=>plant(q,C,true));
}

function train(k,index) {
  const C=CAR;
  // Panel and rivet detail remains attached to the fixed chassis. No meshes in
  // the central aisle, door aperture, bench drawers or snack-counter sweep.
  k.box(.055,.15,6.65,C.wood,-2.398,.105,0);
  k.box(.03,.035,6.65,C.paper,-2.36,.195,0);
  for (let z=-3.05;z<=3.1;z+=.61) {
    k.box(.035,.24,.035,C.wood,2.724,-.285,z);
    for (const y of [-.36,-.22]) {
      k.cylinder(.027,.027,.03,C.steel,2.751,y,z,6).rotation.z=HP;
    }
    // Wood endgrain nicks on the existing cut-side rail.
    k.box(.12,.026,.027,C.edge,2.61,.403,z);
  }
  for (let x=-2.15;x<2.4;x+=.39) for (const z of [-3.21,3.21]) {
    if (Math.abs(x)<.8 && (index===0?z>0:z<0)) continue;
    k.box(.026,.026,.19,C.edge,x,.018,z);
  }
  const inner=index===0?1:-1;
  for (const x of [-1.85,1.85]) {
    k.box(.82,.035,.07,C.steel,x,.036,inner*3.27);
    k.box(.82,.027,.035,C.wood,x,.067,inner*3.24);
  }
  if (index===0) {
    k.prop('car-umbrella-stand',2.29,.025,-2.73,q=>{
      q.cylinder(.135,.12,.32,C.green,0,.16,0);
      q.cylinder(.14,.14,.035,C.wood,0,.337,0);
      for (const [x,z,color] of [[-.06,-.025,C.blue],[.055,.025,C.coral]]) {
        q.cylinder(.045,.035,.48,color,x,.57,z);
        q.rod([x,.80,z],[x,.91,z],.023,C.edge);
        q.rod([x,.91,z],[x+.07,.91,z],.023,C.edge);
        q.rod([x+.07,.91,z],[x+.07,.86,z],.023,C.edge);
      }
    });
    k.prop('car-weekend-tote',-1.74,.025,-3.19,q=>bag(q,C,C.pink));
    k.prop('car-window-succulent',-2.35,1.132,-2.65,q=>windowPlant(q,C));
    k.prop('car-striped-scarf',2.61,.405,-.03,q=>{
      q.box(.19,.055,.48,C.pink,0,.028,0);
      q.box(.045,.23,.48,C.pink,.115,-.06,0);
      for (const z of [-.12,.10]) {
        q.box(.20,.027,.045,C.paper,0,.067,z);
        q.box(.028,.23,.045,C.paper,.147,-.06,z);
      }
      for (const z of [-.18,-.06,.06,.18]) q.box(.035,.06,.035,C.wood,.123,-.20,z);
    });
  } else {
    k.prop('dining-window-flower',-2.35,1.132,-.21,q=>windowPlant(q,C,true));
    k.prop('dining-picnic-hamper',-2.15,.025,3.10,q=>{
      crate(q,C,.44,.32,.27);
      q.box(.35,.06,.25,C.mint,0,.30,0);
      for (const x of [-.14,.14]) q.rod([x,.30,0],[x,.44,0],.022,C.edge);
      q.rod([-.14,.44,0],[.14,.44,0],.022,C.edge);
    });
    k.prop('dining-folded-tea-towels',1.04,.325,3.42,q=>{
      for (let i=0;i<3;i++) q.box(.45,.065,.24,i===1?C.green:C.paper,0,.034+i*.07,0);
      for (const x of [-.13,.13]) q.box(.035,.026,.245,C.pink,x,.223,0);
    });
    k.prop('dining-cup-carrier',-2.17,.025,-3.08,q=>{
      q.box(.41,.065,.29,C.wood,0,.035,0);
      for (const x of [-.10,.10]) {
        q.cylinder(.07,.055,.18,C.paper,x,.16,0);
        q.cylinder(.075,.075,.035,C.green,x,.267,0);
      }
      q.box(.055,.32,.26,C.wood,0,.18,0);
      q.box(.027,.055,.14,C.edge,0,.29,.02);
    });
    k.prop('dining-reading-rack',2.37,.025,1.63,q=>{
      q.box(.28,.07,.46,C.wood,0,.035,0);
      for (const z of [-.215,.215]) q.box(.29,.28,.035,C.edge,0,.17,z);
      for (let i=0;i<3;i++) {
        q.box(.23,.36,.065,[C.pink,C.blue,C.green][i],0,.25,-.13+i*.12);
        q.box(.16,.07,.028,C.paper,0,.34,-.09+i*.12);
      }
    });
    k.prop('dining-wrapped-travel-blanket',2.29,.025,-2.83,q=>rolledMat(q,C));
  }
}

export function addTravelDetails(room,key,index=0) {
  if (!['gptcornershop','gptstation','gpttraincar2'].includes(key)) return;
  if (key==='gpttraincar2' && index===1) return;
  const k=createDetailKit(room);
  if (key==='gptcornershop') corner(k,index);
  else if (key==='gptstation') station(k);
  else train(k,index===0?0:1);
  return k.finish();
}
