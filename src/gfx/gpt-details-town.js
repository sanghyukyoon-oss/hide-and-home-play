// Additive, non-interactive dressing for the three street dioramas. All colours
// below are existing map swatches; the kit reuses their exact built materials.
// Device geometry, furniture records, collision and spot lists are untouched.
import { createDetailKit } from './gpt-detail-kit.js';

const PI = Math.PI;
const FIRE = { red: '#e8433d', redD: '#b8322e', cream: '#f4f4ec', wood: '#e9b77c', dark: '#b97a45', blue: '#c9cfe0', blueD: '#a9b2c8', gold: '#e2b448', green: '#84ae9d', soil: '#6f4b30', paving: '#d4d7de' };
const POLICE = { cream: '#fef2e1', pale: '#f6e0bf', green: '#84ae9d', greenL: '#a2c8bb', blue: '#84ae9d', dark: '#6f4b30', wood: '#eaa440', gold: '#feb53d', red: '#ee9d4c', paving: '#dfe2ea', steel: '#a09769' };
const ALLEY = { cream: '#fef2e1', pale: '#f6e0bf', green: '#84ae9d', greenL: '#a2c8bb', dark: '#6f4b30', wood: '#eecfa3', gold: '#f8b15b', red: '#e97866', blue: '#b0e5e8', steel: '#a09769', pot: '#ee9d4c', paving: '#e8d7b7' };

function cup(k, C, x=0, y=0, z=0, color=C.cream) {
  k.cylinder(.085,.066,.18,color,x,y+.09,z,10);
  k.cylinder(.066,.066,.014,C.dark,x,y+.183,z,10);
  k.rod([x+.073,y+.14,z],[x+.145,y+.14,z],.019,color);
  k.rod([x+.145,y+.14,z],[x+.145,y+.055,z],.019,color);
  k.rod([x+.145,y+.055,z],[x+.070,y+.055,z],.019,color);
}

function bucket(k,C,color=C.green) {
  k.cylinder(.20,.16,.29,color,0,.145,0,12);
  k.cylinder(.213,.213,.045,color,0,.293,0,12);
  k.cylinder(.176,.176,.016,C.dark,0,.313,0,12);
  k.cylinder(.156,.156,.01,C.blue||C.greenL,0,.316,0,12);
  k.rod([-.19,.24,0],[-.19,.48,0],.022,C.steel||C.blueD);
  k.rod([-.19,.48,0],[.19,.48,0],.022,C.steel||C.blueD);
  k.rod([.19,.48,0],[.19,.24,0],.022,C.steel||C.blueD);
  k.box(.16,.045,.055,C.wood,0,.48,0);
}

function broom(k,C) {
  k.rod([-.07,.20,.07],[.09,1.16,-.03],.027,C.dark);
  for(let i=0;i<4;i++) k.box(.075,.25,.12,C.wood,-.115+i*.075,.145,.075);
  k.box(.31,.055,.135,C.green,0,.24,.075);
  for(let i=0;i<4;i++) k.box(.024,.14,.018,C.gold,-.10+i*.066,.095,.145);
}

function boots(k,C,color=C.gold) {
  for(const x of [-.105,.105]) {
    k.sphere(.115,color,x,.075,.055,[.83,.6,1.55]);
    k.cylinder(.082,.075,.25,color,x,.19,-.045,10);
    k.cylinder(.090,.090,.045,C.cream,x,.318,-.045,10);
    k.cylinder(.063,.063,.015,C.dark,x,.343,-.045,10);
    k.box(.15,.035,.21,C.dark,x,.033,.04);
  }
}

function plant(k,C,color=C.red,flower=false) {
  k.cylinder(.19,.145,.29,color,0,.145,0,10);
  k.cylinder(.205,.205,.05,color,0,.285,0,10);
  k.cylinder(.164,.164,.018,C.dark,0,.317,0,10);
  for(let i=0;i<5;i++) {
    const a=i*2.4, x=Math.cos(a)*.12, z=Math.sin(a)*.10, y=.49+(i%2)*.12;
    k.rod([0,.31,0],[x,y,z],.018,C.green);
    k.sphere(.115,i%2?C.green:C.greenL||C.green,x,y,z,[1.25,.48,.85]);
    if(flower) k.sphere(.07,i%2?C.gold:C.cream,x,y+.06,z,[1,.65,1]);
  }
}

function wateringCan(k,C) {
  k.cylinder(.17,.19,.26,C.green,0,.15,0,10);
  k.cylinder(.18,.18,.035,C.greenL,0,.29,0,10);
  k.cylinder(.115,.115,.016,C.dark,0,.315,0,10);
  k.rod([.13,.12,0],[.36,.33,0],.046,C.green);
  const rose=k.cylinder(.065,.045,.07,C.gold,.375,.35,0,10); rose.rotation.z=-.8;
  k.rod([-.14,.08,0],[-.29,.08,0],.026,C.green);
  k.rod([-.29,.08,0],[-.29,.30,0],.026,C.green);
  k.rod([-.29,.30,0],[-.14,.30,0],.026,C.green);
}

function basket(k,C) {
  k.box(.43,.27,.31,C.wood,0,.15,0,.022);
  for(const y of [.08,.15,.22]) k.box(.45,.025,.325,C.dark,0,y,0);
  k.rod([-.15,.29,0],[-.15,.47,0],.025,C.dark);
  k.rod([-.15,.47,0],[.15,.47,0],.025,C.dark);
  k.rod([.15,.47,0],[.15,.29,0],.025,C.dark);
  k.box(.26,.04,.24,C.cream,0,.31,.035);
  k.box(.075,.025,.25,C.red,-.065,.341,.035);
}

function firestation(k) {
  const C=FIRE;
  // Low scored kerb and a real sill where the concrete apron meets the road.
  for(let i=0;i<12;i++) k.box(.635,.075,.16,C.paving,-3.57+i*.65,.034,1.035);
  for(const x of [-3.88,3.88]) for(let j=0;j<4;j++) k.box(.12,.07,.76,C.paving,x,.025,-.72+j*.78);
  k.box(1.72,.045,.20,C.blueD,-.3,.025,-2.80);
  for(let i=0;i<5;i++) k.box(.25,.018,.055,C.cream,-.92+i*.31,.054,-2.69);
  // A maintenance corner lives outside the appliance and doghouse sweeps.
  k.prop('fire-extinguisher',-2.35,0,-2.71,p=>{
    p.cylinder(.125,.125,.42,C.red,0,.25,0,12);
    p.sphere(.125,C.red,0,.45,0,[1,.55,1]);
    p.cylinder(.055,.055,.08,C.gold,0,.53,0,8);
    p.box(.19,.045,.065,C.blueD,0,.59,0);
    p.box(.16,.15,.024,C.cream,0,.28,.126);
    p.rod([.09,.54,0],[.19,.44,0],.022,C.soil);
    p.rod([.19,.44,0],[.19,.17,.03],.022,C.soil);
    p.box(.06,.12,.06,C.soil,.19,.12,.03);
  });
  k.prop('spare-fire-hose',-2.34,.01,-2.15,p=>{
    for(let i=0;i<6;i++) p.cylinder(.22-i*.031,.22-i*.031,.014,C[i%2?'dark':'wood'],0,.018+i*.014,0,16);
    p.rod([.15,.035,.10],[.34,.035,.15],.035,C.wood);
    const coupling=p.cylinder(.055,.055,.12,C.gold,.34,.06,.15,10); coupling.rotation.z=PI/2;
  });
  k.prop('fire-wash-bucket',3.55,0,-1.26,p=>bucket(p,C,C.blue));
  k.prop('fire-broom',3.80,0,-1.72,p=>broom(p,{...C,green:C.red}));
  k.prop('fire-service-toolbox',3.55,0,.74,p=>{
    p.box(.49,.29,.32,C.red,0,.16,0,.026);
    p.box(.51,.06,.34,C.redD,0,.31,0);
    p.rod([-.10,.35,0],[-.10,.45,0],.025,C.blueD);
    p.rod([-.10,.45,0],[.10,.45,0],.025,C.blueD);
    p.rod([.10,.45,0],[.10,.35,0],.025,C.blueD);
    for(const x of [-.16,.16]) p.box(.055,.10,.035,C.gold,x,.265,.18);
  });
  k.prop('fire-drying-boots',3.58,0,1.51,p=>boots(p,C,C.gold));
  k.prop('fire-lunch-basket',-2.50,0,2.72,p=>basket(p,C));
  k.prop('fire-rescue-crate',-3.74,0,1.48,p=>{
    p.box(.38,.25,.38,C.wood,0,.145,0);
    for(const x of [-.18,.18]) p.box(.035,.27,.40,C.dark,x,.15,0);
    for(const z of [-.18,.18]) for(const y of [.09,.19]) p.box(.39,.045,.035,C.dark,0,y,z);
    p.box(.29,.10,.24,C.blue,0,.33,0);
    p.box(.29,.026,.245,C.cream,0,.39,0);
  });
  k.prop('fire-thermos',-1.79,.464,2.52,p=>{
    p.cylinder(.08,.08,.30,C.red,0,.15,0,10);
    p.cylinder(.085,.085,.065,C.blueD,0,.328,0,10);
    p.box(.075,.13,.018,C.cream,0,.17,.08);
  });
  k.prop('fire-dog-care-tin',3.60,0,.40,p=>{
    p.cylinder(.115,.115,.22,C.cream,0,.11,0,10);
    p.cylinder(.124,.124,.045,C.red,0,.24,0,10);
    p.box(.15,.085,.02,C.gold,0,.12,.112);
    p.sphere(.026,C.red,-.048,.13,.132);
    p.sphere(.026,C.red,.048,.13,.132);
    p.box(.09,.025,.025,C.red,0,.13,.132);
  });
}

function police(k) {
  const C=POLICE;
  // Quiet seams, shallow kerb blocks and the two existing entry-step nosings.
  for(let i=2;i<12;i++) k.box(.63,.065,.13,C.paving,-3.575+i*.65,.028,-.295);
  for(const x of [-3.91,3.91]) for(let i=0;i<3;i++) k.box(.10,.055,.50,C.pale,x,.02,.40+i*.55);
  k.box(1.36,.025,.055,C.pale,-1.65,.097,-1.89);
  k.box(1.19,.025,.05,C.pale,-1.65,.187,-2.145);
  // Masonry around the foundation remains below its cut-away wall height.
  for(const x of [-3.65,-3.12,-2.59,-.62,-.09,.44,.97,1.50,2.03,2.56,3.09,3.62]) {
    k.box(.49,.10,.045,C.pale,x,.065,-2.618);
  }
  k.prop('police-window-flask',1.20,.955,-2.295,p=>{
    p.cylinder(.075,.075,.24,C.red,0,.12,0,10);
    p.cylinder(.08,.08,.055,C.cream,0,.267,0,10);
    p.box(.055,.105,.018,C.cream,0,.14,.075);
    cup(p,C,.21,0,0);
  });
  k.prop('police-window-pencils',1.78,.955,-2.31,p=>{
    p.cylinder(.085,.075,.16,C.gold,0,.08,0,10);
    p.cylinder(.061,.061,.01,C.dark,0,.164,0,10);
    for(let i=0;i<3;i++) {
      p.rod([-.035+i*.035,.10,0],[-.045+i*.04,.34+(i%2)*.04,0],.014,[C.red,C.green,C.wood][i]);
      p.sphere(.018,C.pale,-.045+i*.04,.35+(i%2)*.04,0,[.75,1.4,.75]);
    }
  });
  k.prop('police-document-tray',.45,.955,-2.30,p=>{
    p.box(.30,.035,.19,C.green,0,.02,0);
    p.box(.265,.035,.16,C.cream,0,.055,0);
    p.box(.26,.024,.158,C.pale,.006,.083,-.004);
    p.box(.075,.022,.04,C.gold,.05,.107,.03);
  });
  k.prop('police-entrance-flowers',-.69,0,-2.28,p=>plant(p,C,C.red,true));
  k.prop('police-umbrella-stand',3.67,0,.65,p=>{
    p.cylinder(.16,.14,.27,C.green,0,.135,0,10);
    p.cylinder(.125,.125,.018,C.dark,0,.28,0,10);
    p.cylinder(.075,.045,.42,C.blue,-.025,.49,0,8);
    p.rod([-.025,.68,0],[-.025,.86,0],.022,C.dark);
    p.rod([-.025,.86,0],[.065,.86,0],.022,C.dark);
    p.rod([.065,.86,0],[.065,.79,0],.022,C.dark);
    p.rod([.075,.2,.045],[.115,.75,.045],.022,C.gold);
  });
  k.prop('police-flower-watering-can',3.52,0,1.77,p=>wateringCan(p,C),PI);
  k.prop('police-sweeping-set',3.62,0,1.04,p=>{
    broom(p,C);
    p.box(.25,.035,.25,C.greenL,-.23,.025,.10);
    p.box(.25,.10,.035,C.greenL,-.23,.07,-.01);
    p.rod([-.23,.11,-.01],[-.23,.59,-.04],.021,C.dark);
  });
  k.prop('police-pet-water-bowl',3.41,0,.05,p=>{
    p.cylinder(.18,.22,.095,C.gold,0,.055,0,12);
    p.cylinder(.144,.144,.016,C.greenL,0,.11,0,12);
    p.sphere(.028,C.cream,-.04,.12,.04,[1,.3,1]);
  });
  k.prop('police-safety-wands',-3.69,0,1.55,p=>{
    p.box(.27,.24,.26,C.green,0,.13,0);
    p.box(.24,.025,.23,C.dark,0,.255,0);
    for(const x of [-.066,.066]) {
      p.cylinder(.025,.025,.32,C.gold,x,.39,0,8);
      p.cylinder(.035,.035,.24,C.red,x,.61,0,8);
      p.cylinder(.038,.038,.045,C.cream,x,.75,0,8);
    }
  });
  k.prop('police-child-scooter',-.28,0,2.76,p=>{
    p.box(.55,.06,.20,C.green,0,.12,0,.025);
    for(const x of [-.19,.21]) { const w=p.cylinder(.085,.085,.06,C.dark,x,.085,0,10); w.rotation.x=PI/2; }
    p.rod([.20,.15,0],[.27,.72,0],.027,C.wood);
    p.rod([.27,.72,-.19],[.27,.72,.19],.026,C.green);
    p.rod([.27,.72,-.20],[.27,.72,-.11],.035,C.gold);
    p.rod([.27,.72,.11],[.27,.72,.20],.035,C.gold);
  },-.08);
  k.prop('police-street-cleaning-pail',-3.63,0,2.65,p=>bucket(p,C));
}

function alley(k) {
  const C=ALLEY;
  // Side kerb joints and doorstep noses keep the quiet asphalt centre open.
  for(let i=0;i<9;i++) for(const x of [-3.95,3.95]) k.box(.325,.024,.035,C.pale,x,.107,-3.29+i*.80);
  k.box(.98,.045,.28,C.paving,2.74,.025,-1.53);
  k.box(1.05,.025,.065,C.pale,-3.20,.19,-1.78);
  // Small warm repair courses on the house's blind side and the shed jambs.
  for(let row=0;row<4;row++) for(let i=0;i<4;i++) {
    k.box(.035,.105,.34,i%2?C.pale:C.wood,-3.833,.33+row*.135,-3.40+i*.37+(row%2)*.08);
  }
  for(const x of [1.995,3.485]) for(let i=0;i<5;i++) k.box(.29,.10,.035,i%2?C.pale:C.wood,x,.32+i*.125,-1.844);
  for(const x of [-3.57,-2.91,-2.25,-1.59]) {
    k.box(.055,.15,.11,C.green,x,3.285,-2.055);
    k.box(.10,.035,.08,C.greenL,x,3.23,-2.03);
  }
  k.prop('alley-house-laundry',-3.94,.10,-2.76,p=>{
    // Its tiny stand is against the blind wall, clear of the real porch door.
    for(const z of [-.48,.48]) {
      p.rod([0,.05,z],[0,2.18,z],.025,C.dark);
      p.box(.17,.065,.18,C.paving,0,.0325,z);
    }
    p.rod([0,2.16,-.48],[0,2.16,.48],.02,C.dark);
    for(const [i,z] of [-.25,.22].entries()) {
      p.box(.045,.43,.32,i?C.cream:C.red,0,1.94,z);
      p.box(.055,.04,.32,C.pale,-.004,1.76,z);
      for(const dz of [-.10,.10]) p.box(.055,.075,.035,C.gold,.025,2.17,z+dz);
    }
  });
  k.prop('alley-shed-broom',3.60,0,-1.75,p=>broom(p,C));
  k.prop('alley-watering-can',3.46,0,-1.40,p=>wateringCan(p,C),PI);
  k.prop('alley-seedling-tray',3.31,0,-.93,p=>{
    p.box(.56,.075,.33,C.wood,0,.045,0);
    for(const x of [-.18,0,.18]) {
      p.cylinder(.074,.059,.125,C.pot,x,.145,0,8);
      p.cylinder(.057,.057,.012,C.dark,x,.21,0,8);
      p.rod([x,.20,0],[x,.35,0],.014,C.green);
      p.sphere(.065,C.greenL,x-.045,.30,0,[1,.45,.8]);
      p.sphere(.065,C.green,x+.045,.335,0,[1,.45,.8]);
    }
  });
  k.prop('alley-kerb-flowers',3.54,0,1.80,p=>plant(p,C,C.pot,true));
  k.prop('alley-rubber-clogs',-3.53,0,.22,p=>{
    for(const x of [-.105,.105]) {
      p.sphere(.12,C.gold,x,.07,0,[.8,.6,1.55]);
      p.sphere(.065,C.dark,x,.125,-.045,[.8,.15,1.0]);
      p.box(.15,.035,.055,C.cream,x,.125,-.10);
      for(const z of [.025,.085]) p.sphere(.015,C.dark,x,.13,z,[1,.35,1]);
    }
  },.08);
  k.prop('alley-woven-house-basket',-3.52,0,.86,p=>basket(p,C));
  k.prop('alley-paper-recycling-bundle',3.55,0,.95,p=>{
    p.box(.36,.20,.27,C.pale,0,.115,0);
    for(let i=0;i<4;i++) p.box(.37,.024,.28,C.cream,0,.05+i*.048,0);
    p.box(.035,.23,.285,C.dark,0,.13,0);
    p.box(.375,.23,.025,C.dark,0,.13,0);
    p.box(.24,.032,.14,C.wood,0,.242,0);
  },-.12);
  k.prop('alley-neighbour-cat-bowl',-3.52,0,1.55,p=>{
    p.cylinder(.19,.22,.10,C.red,0,.06,0,12);
    p.cylinder(.15,.15,.016,C.cream,0,.12,0,12);
    for(const [x,z] of [[-.05,0],[.05,.025],[.02,-.06]]) p.sphere(.03,C.dark,x,.143,z,[1,.6,1]);
  });
  k.prop('alley-tea-table-napkin',-1.23,.784,1.49,p=>{
    p.box(.17,.025,.13,C.cream,0,.013,0);
    p.box(.035,.016,.13,C.red,-.04,.033,0);
    p.cylinder(.044,.044,.10,C.gold,.025,.07,-.005,8);
    p.cylinder(.047,.047,.025,C.cream,.025,.13,-.005,8);
  },.12);
}

export function addTownDetails(room,key,index=0) {
  if(index!==0 || !['firestation2','gptpolicefront','gptalley'].includes(key)) return null;
  const k=createDetailKit(room);
  if(key==='firestation2') firestation(k);
  if(key==='gptpolicefront') police(k);
  if(key==='gptalley') alley(k);
  return k.finish();
}
