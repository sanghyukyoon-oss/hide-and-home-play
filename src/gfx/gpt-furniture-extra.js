// Themed furniture collection. Modelling details carry recognition without texture stretching.
import { THREE, G, mc, grp, put, PI, HP, C, box, ball, cyl, ring, feet, shell, shelf,
  handle, door, doubleDoor, lid, drawer, bottle, can, book, folded, shoe, plant, wheel,
  mug, bread, basket, frontWall, insideCylinder, pullOutTray, info } from './gpt-furniture-kit.js';
const B = {};

B.gpt_breadcase = f => {
  f.add(mc('gpt_breadcase',({add})=>{
    feet(add,1.18,.65,.18);shell(add,1.18,.64,.65,.18,0,C.cream);
    box(add,1.24,.075,.7,C.wood,0,.86,0,.03);
    for(const y of [.95,1.26]){
      shelf(add,1.08,.52,y,0,C.wood);
      for(const x of [-.35,0,.35]){box(add,.29,.025,.36,C.cream,x,y+.012,0,.02);bread(add,x,y+.025,0,.95);}
    }
    for(const x of [-.57,.57]) for(const z of [-.28,.28]) box(add,.035,.7,.035,C.wood,x,1.23,z,.01);
    box(add,1.2,.08,.65,C.cream,0,1.61,0,.025);
    for(const x of [-.35,0,.35]){box(add,.16,.085,.025,C.paper,x,1.01,.28,.01);box(add,.09,.012,.008,C.edge,x,1.02,.298,.003);}
    basket(add,.42,.23,.39,0,.25,0);bread(add,0,.3,0,.9);
  }));
  const p=doubleDoor(f,'gpt_breadcase',1.14,.58,.5,.36,C.sage);
  f.spot('inside',null,.28,.24,.1,{part:p,maxH:.35,scale:.7,label:'빵 진열장 아래'});
};

B.gpt_coffeecart = f => {
  f.add(mc('gpt_coffeecart',({add,tube})=>{
    for(const x of [-.47,.47]) for(const z of [-.25,.25]) wheel(add,x,.1,z,.09);
    shelf(add,1.08,.65,.23,0,C.wood);shelf(add,1.08,.65,.87,0,C.wood);
    for(const x of [-.49,.49]) for(const z of [-.27,.27]) tube([x,.2,z],[x,.89,z],.035,C.sage);
    basket(add,.48,.28,.43,-.22,.23,0);for(let k=0;k<3;k++) bottle(add,.2+k*.095,.23,-.04,[C.coral,C.yellow,C.sky][k],.75);
    // Espresso machine: legs, brew group, steam pipe, catch tray and two cup stations.
    box(add,.64,.36,.34,C.cream,-.1,1.09,-.08,.05);box(add,.62,.12,.39,C.coral,-.1,1.27,-.055,.025);
    box(add,.6,.04,.3,C.steel,-.1,.94,.065,.01);box(add,.48,.13,.07,C.navy,-.1,1.13,.13,.02);
    for(const x of [-.23,.03]){cyl(add,.038,.08,C.steel,x,1.04,.16);mug(add,x,.965,.16,C.cream,.6);tube([x,1.1,.16],[x+.1,1.1,.25],.015,C.dark);}
    tube([.18,1.16,.1],[.26,1.05,.14],.012,C.steel);cyl(add,.037,.025,C.steel,-.3,1.29,.146,HP);
    for(let k=0;k<3;k++) mug(add,-.3+k*.18,1.34,-.05,C.cream,.55);
    box(add,.18,.21,.19,C.wood,.36,1.01,-.1,.015);cyl(add,.065,.12,C.brown,.36,1.18,-.1);cyl(add,.075,.035,C.cream,.36,1.26,-.1);
    tube([.51,.8,-.27],[.66,.96,-.27],.03,C.sage);tube([.66,.96,-.27],[.66,.96,.27],.03,C.sage);
  }));
  f.spot('on',null,.32,.87,.17,{maxH:.35,scale:.7,label:'커피 수레 작업대'});
};

B.gpt_artstation = f => {
  f.add(mc('gpt_artstation',({add,tube})=>{
    feet(add,1.23,.66,.71);box(add,1.3,.085,.72,C.wood,0,.75,0,.035);
    box(add,.06,.72,.52,C.edge,-.43,.36,0,.015);box(add,.45,.045,.53,C.wood,-.35,.2,0,.015);
    for(const x of [-.27,-.1,.07]) book(add,x,.79,-.15,[C.coral,C.sky,C.sage][Math.round((x+.27)/.17)],.2,.065,.17);
    // Easel holds the actual thick canvas with a tiny landscape made from geometry.
    for(const x of [-.25,.25]) tube([x,.79,-.2],[x*.7,1.56,-.25],.022,C.wood);
    box(add,.68,.045,.13,C.edge,.02,1.02,-.17,.014);
    box(add,.6,.43,.045,C.paper,.02,1.27,-.22,.02);box(add,.53,.24,.015,C.sky,.02,1.32,-.188,.01);
    ball(add,.055,C.yellow,.17,1.37,-.176,[1,1,.2]);ball(add,.14,C.sage,-.1,1.18,-.172,[1.2,.7,.1]);
    cyl(add,.085,.17,C.coral,.46,.88,.12);
    for(let k=0;k<5;k++){tube([.41+k*.023,.88,.12],[.4+k*.025,1.18+k%2*.05,.12],.01,C.wood);box(add,.022,.06,.025,[C.coral,C.sky,C.yellow][k%3],.4+k*.025,1.2+k%2*.05,.12,.006);}
    for(const [x,c] of [[.12,C.yellow],[.24,C.sky],[.36,C.coral]]){box(add,.08,.035,.1,c,x,.813,.23,.01);box(add,.035,.03,.05,C.cream,x,.846,.23,.006);}
  }));
  drawer(f,'gpt_artstation',.37,.2,.46,-.4,.44,.285,C.sage,(a)=>{box(a,.23,.025,.25,C.paper,-.02,.055,-.24,.005);});
  f.spot('on',null,.1,.795,.18,{maxH:.28,scale:.65,label:'미술 작업대'});
};

B.gpt_sewingtable = f => {
  f.add(mc('gpt_sewingtable',({add,tube})=>{
    feet(add,1.12,.62,.72);box(add,1.2,.075,.68,C.wood,0,.76,0,.025);
    box(add,.53,.055,.35,C.cream,-.05,.825,-.015,.02);
    // C-shaped sewing head leaves a clear gap over the stitch plate.
    box(add,.13,.3,.2,C.cream,.14,.99,-.04,.04);box(add,.43,.13,.2,C.cream,-.01,1.15,-.04,.04);
    box(add,.11,.12,.17,C.cream,-.2,1.06,-.025,.035);tube([-.2,1.02,0],[-.2,.86,0],.008,C.steel);
    cyl(add,.073,.06,C.coral,.235,1.06,-.04,0,HP);cyl(add,.025,.03,C.steel,.03,1.25,-.05);
    cyl(add,.035,.1,C.pink,.03,1.31,-.05);cyl(add,.05,.012,C.wood,.03,1.365,-.05);
    box(add,.23,.018,.3,C.pink,-.24,.865,.06,.006);box(add,.025,.3,.19,C.pink,-.58,.62,.1,.008);
    for(let k=0;k<3;k++) folded(add,.41,.8+k*.075,-.04,[C.sage,C.sky,C.yellow][k],.23,.31);
    box(add,.19,.05,.13,C.dark,-.05,.04,.02,.015);tube([-.05,.065,.02],[.1,.72,-.24],.008,C.dark);
  }));
  drawer(f,'gpt_sewingtable',.35,.18,.46,.38,.48,.28,C.coral,(a)=>{for(let k=0;k<3;k++)cyl(a,.033,.07,[C.pink,C.sky,C.yellow][k],-.1+k*.1,.077,-.2);});
  f.spot('on',null,-.39,.8,.16,{maxH:.3,scale:.65,label:'재봉 작업대'});
};

B.gpt_pottingbench = f => {
  f.add(mc('gpt_pottingbench',({add,tube})=>{
    feet(add,1.17,.59,.78);shelf(add,1.24,.65,.81,0,C.wood);shelf(add,1.1,.53,.24,0,C.wood);
    for(const x of [-.55,.55]) box(add,.06,.75,.07,C.edge,x,1.15,-.26,.015);
    for(let k=0;k<5;k++)box(add,1.14,.055,.03,C.wood,0,.95+k*.12,-.28,.01);
    shelf(add,1.15,.24,1.43,-.17,C.wood);plant(add,-.36,1.43,-.15,C.coral,.75);plant(add,.34,1.43,-.15,C.cream,.65);
    plant(add,-.35,.81,0,C.yellow,1);cyl(add,.15,.17,C.coral,.27,.895,.05,0,0,.18);cyl(add,.155,.015,C.soil,.27,.985,.05);
    box(add,.3,.32,.22,C.cream,-.3,.4,0,.025);box(add,.24,.15,.025,C.sage,-.3,.41,.125,.01);
    for(const x of [.05,.25,.42])cyl(add,.07,.13,C.coral,x,.305,.05,0,0,.09);
    tube([.12,1.2,-.24],[.12,.98,-.24],.015,C.wood);box(add,.08,.12,.02,C.steel,.12,.98,-.24,.025);
  }));
  f.spot('on',null,.05,.81,.17,{maxH:.4,scale:.75,label:'분갈이 작업대'});
};

B.gpt_fishstall = f => {
  f.add(mc('gpt_fishstall',({add,tube})=>{
    feet(add,1.35,.72,.7,C.blue);box(add,1.42,.1,.8,C.cream,0,.72,0,.025);
    for(const x of [-.35,.35]){
      basket(add,.61,.15,.58,x,.77,0,C.sky);
      for(let k=0;k<5;k++)box(add,.1,.06,.13,C.paper,x-.22+k*.1,.845,.1*Math.sin(k),.025,0,k*.3);
      for(let k=0;k<3;k++){
        const xx=x-.17+k*.17;ball(add,.13,C.steel,xx,.93,0,[.48,.32,1.6]);
        add(G.cone(.06,.1,3),C.blue,xx,.93,-.23,HP);ball(add,.014,C.dark,xx+.025,.96,.15);
      }
    }
    for(const x of [-.66,.66])tube([x,.73,-.33],[x,1.75,-.33],.035,C.blue);
    box(add,1.5,.12,.97,C.sky,0,1.8,-.03,.035);for(let k=0;k<5;k++)box(add,.15,.13,.98,C.cream,-.6+k*.3,1.803,-.03,.016);
    box(add,.36,.2,.04,C.navy,0,1.56,-.3,.025);for(let k=0;k<3;k++)box(add,.06,.015,.008,C.paper,-.09+k*.09,1.56,-.273,.003);
    cyl(add,.22,.3,C.blue,-.4,.15,.1);box(add,.36,.19,.39,C.cream,.35,.2,.05,.025);
  }));
  f.spot('under',null,.35,.3,.15,{maxH:.35,scale:.75,label:'생선 가게 아래'});
};

B.gpt_lifeguardchair = f => {
  f.add(mc('gpt_lifeguardchair',({add,tube})=>{
    for(const x of [-.36,.36]) for(const z of [-.31,.31])tube([x,0,z],[x*.8,1.25,z*.75],.04,C.cream);
    for(const y of [.22,.46,.7,.94])tube([-.34,y,.32-y*.06],[.34,y,.32-y*.06],.035,C.wood);
    box(add,.77,.09,.67,C.sky,0,1.19,0,.025);box(add,.78,.5,.075,C.sky,0,1.49,-.27,.035);
    for(const x of [-.37,.37]){tube([x,1.24,.22],[x,1.52,.22],.025,C.cream);tube([x,1.51,.22],[x,1.51,-.24],.032,C.cream);}
    ring(add,.17,.045,C.coral,.4,.73,-.08,0,HP);for(const yy of [-.17,.17]) box(add,.08,.07,.035,C.paper,.455,.73+yy,-.08,.012,0,HP);
    tube([-.42,1.2,-.29],[-.42,2.03,-.29],.025,C.wood);add(G.cone(.5,.18,20),C.yellow,-.42,2.04,-.29);
    ball(add,.04,C.coral,-.42,2.15,-.29);
  }));
  f.spot('on',null,0,1.24,.04,{maxH:.45,scale:.8,label:'구조대 의자'});
};

B.gpt_surfstand = f => {
  f.add(mc('gpt_surfstand',({add,tube})=>{
    box(add,1.12,.13,.54,C.wood,0,.065,0,.04);
    for(const x of [-.47,.47])tube([x,.13,-.15],[x,1.04,-.15],.035,C.edge);
    tube([-.48,.77,-.15],[.48,.77,-.15],.035,C.edge);
    for(const [x,c,h] of [[-.32,C.coral,1.22],[0,C.cream,1.5],[.32,C.sky,1.3]]){
      add(G.sph(.2,16,10),c,x,.14+h/2,-.02,-.08,0,0,[.85,h/.4,.24]);
      box(add,.045,h*.73,.025,C.yellow,x,.14+h/2,.03,.02,0,0,-.04);
      add(G.cone(.08,.15,3),C.navy,x,.34,-.09,HP,0,PI);
    }
    ring(add,.12,.025,C.navy,.48,.35,.19,HP);
    bottle(add,-.42,.13,.17,C.sage,.6);
  }));
  f.spot('on',null,.1,.13,.18,{maxH:.35,scale:.65,label:'서프보드 보관대'});
};

B.gpt_campkitchen = f => {
  f.add(mc('gpt_campkitchen',({add,tube})=>{
    for(const x of [-.55,.55]){tube([x,.03,-.3],[x,.78,.3],.03,C.steel);tube([x,.03,.3],[x,.78,-.3],.03,C.steel);}
    shelf(add,1.26,.7,.78,0,C.wood);box(add,.62,.095,.41,C.sage,-.18,.84,-.02,.025);
    for(const x of [-.34,-.02]){ring(add,.09,.013,C.dark,x,.9,-.02,HP);for(const s of [-1,1])box(add,.21,.015,.018,C.dark,x,.91,-.02,0,0,s*PI/4);}
    cyl(add,.11,.15,C.steel,-.34,.998,-.02);cyl(add,.12,.025,C.cream,-.34,1.085,-.02);ball(add,.024,C.wood,-.34,1.11,-.02);
    for(const x of [-.37,-.03])cyl(add,.026,.02,C.dark,x,.846,.196,HP);
    box(add,.5,.4,.08,C.sage,-.18,1.08,-.26,.025);
    cyl(add,.1,.29,C.coral,.44,.935,-.02);cyl(add,.045,.03,C.steel,.44,1.095,-.02);
    mug(add,.35,.82,.21,C.yellow,.7);
    basket(add,.63,.3,.43,-.19,.12,0,C.cream);bottle(add,-.3,.16,0,C.sky,.8);folded(add,.02,.16,.02,C.pink,.2,.25);
  }));
  f.spot('on',null,.2,.78,.18,{maxH:.35,scale:.7,label:'캠핑 조리대'});
};

B.gpt_telescope = f => {
  f.add(mc('gpt_telescope',({add,tube})=>{
    for(let k=0;k<3;k++){const a=k*2*PI/3;tube([0,.88,0],[Math.cos(a)*.42,.03,Math.sin(a)*.42],.034,C.wood);tube([0,.45,0],[Math.cos(a)*.25,.43,Math.sin(a)*.25],.018,C.steel);}
    cyl(add,.08,.12,C.steel,0,.91,0);box(add,.16,.17,.16,C.navy,0,1.03,0,.025);
    // Telescope barrel points up and left, with separate end rims and a dark optical recess.
    const p=new THREE.Vector3(-.42,.22,0).normalize(), center=new THREE.Vector3(0,1.19,0);
    const m=new THREE.Matrix4().compose(center,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),p),new THREE.Vector3(1,1,1));
    const a=(g,c,dy)=>{const mm=m.clone().multiply(new THREE.Matrix4().makeTranslation(0,dy,0));const v=new THREE.Vector3().setFromMatrixPosition(mm);const e=new THREE.Euler().setFromRotationMatrix(mm);add(g,c,v.x,v.y,v.z,e.x,e.y,e.z);};
    a(G.cyl(.125,.105,.65,20),C.cream,0);a(G.cyl(.145,.145,.07,20),C.sky,.32);a(G.cyl(.115,.115,.014,20),C.navy,.36);a(G.cyl(.075,.075,.016,20),C.dark,.373);
    a(G.cyl(.055,.055,.18,16),C.navy,-.41);a(G.cyl(.07,.07,.04,16),C.wood,-.49);
    tube([.1,1.19,.1],[.35,1.02,.13],.02,C.steel);ball(add,.035,C.wood,.35,1.02,.13);
  }));
  f.spot('under',null,.23,.04,.19,{maxH:.4,scale:.75,label:'천체망원경 아래'});
};

B.gpt_clawmachine = f => {
  f.add(mc('gpt_clawmachine',({add,tube})=>{
    feet(add,.87,.66,.1,C.dark);shell(add,.87,.57,.66,.1,0,C.cream,true,C.sky);
    box(add,.91,.15,.7,C.coral,0,.73,0,.035);box(add,.9,.14,.69,C.coral,0,1.63,0,.035);
    for(const x of [-.4,.4])for(const z of [-.29,.29])box(add,.05,.82,.05,C.cream,x,1.19,z,.012);
    box(add,.76,.66,.035,C.sky,0,1.19,-.3,.012);shelf(add,.77,.56,.87,0,C.yellow);
    for(let k=0;k<5;k++){
      const x=-.26+k*.13,z=.08*Math.sin(k*2);ball(add,.09,[C.pink,C.sage,C.yellow,C.lilac,C.coral][k],x,.96,z,[1,.8,.8]);ball(add,.065,C.cream,x,1.07,z);
      for(const sx of [-1,1])ball(add,.026,C.cream,x+sx*.043,1.12,z);
    }
    tube([-.34,1.51,0],[.34,1.51,0],.02,C.steel);tube([.14,1.51,0],[.14,1.29,0],.016,C.dark);
    ball(add,.045,C.steel,.14,1.27,0);for(const s of [-1,1]){tube([.14,1.27,0],[.14+s*.08,1.19,0],.015,C.steel);tube([.14+s*.08,1.19,0],[.14+s*.03,1.15,0],.015,C.steel);}
    box(add,.78,.08,.24,C.sky,0,.78,.38,.018);cyl(add,.026,.1,C.dark,-.21,.86,.39);ball(add,.045,C.coral,-.21,.93,.39);cyl(add,.055,.023,C.yellow,.2,.84,.39);
    box(add,.33,.17,.04,C.navy,-.17,.33,.34,.015);box(add,.15,.19,.025,C.steel,.27,.34,.344,.01);box(add,.08,.02,.012,C.dark,.27,.37,.365,.004);
  }));
  const p=door(f,'gpt_clawmachine',.32,.16,-.17,.33,.38,C.coral,(a,cx)=>handle(a,cx,0,.04,.14));
  f.spot('inside',null,-.17,.255,.18,{part:p,maxH:.13,scale:.55,label:'인형 뽑기 배출구'});
};

B.gpt_pinball = f => {
  f.add(mc('gpt_pinball',({add,tube})=>{
    for(const x of [-.4,.4])for(const z of [-.49,.49])tube([x,.03,z],[x,.74+(z<0?.15:0),z],.035,C.steel);
    box(add,.9,.18,1.18,C.coral,0,.79,0,.04,.12);
    box(add,.78,.045,1.05,C.sky,0,.9,0,.025,.12);
    for(const x of [-.43,.43])box(add,.045,.13,1.17,C.cream,x,.95,0,.012,.12);
    box(add,.89,.53,.13,C.cream,0,1.2,-.52,.035);box(add,.74,.34,.02,C.navy,0,1.24,-.44,.02);
    for(let k=0;k<3;k++){cyl(add,.065,.04,[C.yellow,C.coral,C.sage][k],-.2+k*.2,1.01,-.22);ring(add,.07,.014,C.cream,-.2+k*.2,1.035,-.22,HP);}
    for(const s of [-1,1])box(add,.23,.035,.07,C.yellow,s*.17,.943,.31,.02,0,s*.35);
    ring(add,.18,.018,C.wood,0,1.01,-.06,HP,0,0,PI);ball(add,.035,C.steel,.2,.97,.2);
    for(let k=0;k<4;k++)box(add,.09,.12,.02,[C.yellow,C.coral,C.sky,C.sage][k],-.18+k*.12,1.24,-.422,.012);
    cyl(add,.045,.08,C.steel,.48,.81,.31,0,HP);
  }));
  f.spot('under',null,.13,.05,.2,{maxH:.45,scale:.8,label:'핀볼 기계 아래'});
};

B.gpt_jukebox = f => {
  f.add(mc('gpt_jukebox',({add})=>{
    box(add,.95,.12,.6,C.edge,0,.06,0,.04);box(add,.87,1.2,.54,C.wood,0,.7,0,.1);
    // Arched crown with several thick coloured bands gives a distinct jukebox silhouette.
    ring(add,.38,.08,C.coral,0,1.27,.08,0,0,0,PI);ring(add,.28,.055,C.yellow,0,1.27,.15,0,0,0,PI);
    for(const x of [-.37,.37]){box(add,.13,.87,.1,C.coral,x,.81,.29,.05);box(add,.045,.76,.025,C.yellow,x,.82,.353,.02);}
    box(add,.5,.31,.035,C.cream,0,1.16,.3,.02);for(let k=0;k<5;k++)box(add,.38,.025,.012,C.paper,0,1.06+k*.05,.326,.005);
    box(add,.5,.45,.035,C.navy,0,.51,.3,.025);for(let k=0;k<7;k++)box(add,.025,.35,.016,C.wood,-.21+k*.07,.51,.326,.006);
    cyl(add,.1,.025,C.dark,0,.52,.344,HP);ring(add,.11,.015,C.yellow,0,.52,.363);
    for(let k=0;k<4;k++)cyl(add,.025,.025,[C.yellow,C.sage,C.sky,C.pink][k],-.15+k*.1,.89,.34,HP);
  }));
  f.spot('on',null,0,1.44,0,{maxH:.25,scale:.6,label:'주크박스 위'});
};

B.gpt_uprightpiano = f => {
  f.add(mc('gpt_uprightpiano',({add,tube})=>{
    feet(add,1.4,.59,.15,C.edge);box(add,1.39,.42,.54,C.wood,0,.37,-.07,.04);box(add,1.39,.82,.21,C.wood,0,.99,-.25,.04);
    box(add,1.5,.08,.3,C.edge,0,1.44,-.25,.025);box(add,1.42,.1,.41,C.edge,0,.83,.13,.025);
    for(let k=0;k<18;k++)box(add,.065,.045,.31,C.paper,-.595+k*.07,.9,.19,.008);
    for(let k=0;k<17;k++)if(![2,6,9,13,16].includes(k))box(add,.035,.04,.19,C.dark,-.56+k*.07,.94,.12,.006);
    for(const x of [-.66,.66])box(add,.1,.75,.1,C.wood,x,.5,.25,.02);
    for(const x of [-.13,0,.13]){tube([x,.23,0],[x,.14,.25],.018,C.yellow);box(add,.065,.025,.11,C.yellow,x,.13,.28,.012);}
    box(add,.53,.04,.11,C.edge,0,1.05,-.07,.012);book(add,-.09,1.06,-.16,C.paper,.25,.18,.055);
    box(add,.69,.08,.35,C.wood,0,.49,.7,.025);for(const x of [-.27,.27])for(const z of [.6,.8])box(add,.06,.45,.06,C.edge,x,.225,z,.01);
  }));
  f.spot('under',null,.23,.04,.02,{maxH:.4,scale:.75,label:'피아노 아래'});
};

B.gpt_drumkit = f => {
  f.add(mc('gpt_drumkit',({add,tube})=>{
    // All drums have rims, heads and stands; the bass drum faces the camera.
    cyl(add,.28,.35,C.coral,0,.3,.1,HP);for(const z of [-.085,.285]){cyl(add,.27,.025,C.paper,0,.3,z,HP);ring(add,.28,.018,C.steel,0,.3,z);}
    cyl(add,.08,.01,C.dark,.1,.24,.303,HP);
    for(const [x,y,z,r] of [[-.24,.78,-.05,.18],[.19,.8,-.05,.17],[.43,.43,.02,.2],[-.44,.47,.15,.18]]){
      tube([x,.05,z],[x,y-.1,z],.018,C.steel);cyl(add,r,.2,C.coral,x,y-.1,z);cyl(add,r+.01,.025,C.paper,x,y+.012,z);ring(add,r+.012,.012,C.steel,x,y+.025,z,HP);
    }
    for(const [x,y,z,r]of[[-.52,1.1,-.13,.25],[.52,1.13,-.17,.23],[-.55,.81,.3,.18]]){
      tube([x,.03,z],[x,y,z],.018,C.steel);cyl(add,r,.015,C.yellow,x,y,z,0,0,.03);cyl(add,.035,.035,C.wood,x,y+.025,z);
      for(let k=0;k<3;k++){const a=k*2*PI/3;tube([x,.2,z],[x+Math.cos(a)*.16,.025,z+Math.sin(a)*.16],.012,C.steel);}
    }
    cyl(add,.16,.08,C.navy,0,.54,-.47);tube([0,.05,-.47],[0,.5,-.47],.03,C.steel);
    tube([-.1,.84,-.1],[.17,.9,-.23],.01,C.wood);tube([.07,.84,-.1],[-.12,.9,-.23],.01,C.wood);
  }));
  f.spot('under',null,.3,.03,.32,{maxH:.35,scale:.65,label:'드럼 세트 옆'});
};

B.gpt_vanity = f => {
  f.add(mc('gpt_vanity',({add})=>{
    feet(add,1.12,.58,.75);box(add,1.2,.085,.64,C.wood,0,.79,0,.03);
    box(add,.08,.79,.46,C.edge,-.49,.4,0,.015);box(add,.08,.79,.46,C.edge,.49,.4,0,.015);
    // Rounded framed mirror has a muted solid reflection rather than a glare decal.
    box(add,.64,.72,.07,C.cream,0,1.25,-.24,.2);box(add,.53,.61,.02,C.sky,0,1.25,-.19,.17);
    for(const s of [-1,1])for(let k=0;k<4;k++)ball(add,.034,C.yellow,s*.315,1.03+k*.15,-.17);
    bottle(add,-.4,.84,.08,C.pink,.5);bottle(add,-.25,.84,.08,C.sky,.4);
    box(add,.19,.05,.14,C.coral,.38,.865,.11,.025);cyl(add,.055,.04,C.cream,.34,.91,.11);
    box(add,.42,.07,.36,C.pink,0,.47,.59,.04);feet(add,.42,.36,.435,C.wood,.59);
  }));
  drawer(f,'gpt_vanity',.38,.18,.44,-.35,.53,.29,C.cream,(a)=>{box(a,.15,.035,.1,C.pink,0,.06,-.2,.015);});
  f.spot('on',null,.12,.835,.13,{maxH:.3,scale:.65,label:'화장대 위'});
};

B.gpt_bathroomtrolley = f => {
  f.add(mc('gpt_bathroomtrolley',({add,tube})=>{
    for(const x of [-.26,.26])for(const z of [-.21,.21])wheel(add,x,.08,z,.07);
    for(const x of [-.28,.28])for(const z of [-.23,.23])tube([x,.12,z],[x,1.14,z],.022,C.steel);
    for(const y of [.2,.59,.98]){
      shelf(add,.61,.51,y,0,C.cream);for(const z of [-.25,.25])box(add,.61,.08,.025,C.sage,0,y+.02,z,.01);
    }
    for(let k=0;k<3;k++)folded(add,-.05,.2+k*.075,-.01,[C.pink,C.sky,C.cream][k],.35,.34);
    for(let k=0;k<3;k++)bottle(add,-.18+k*.18,.59,-.02,[C.yellow,C.sky,C.mint][k],.68);
    cyl(add,.07,.12,C.coral,-.18,1.04,0);for(let k=0;k<3;k++){tube([-.21+k*.03,1.02,0],[-.21+k*.03,1.22,0],.009,C.wood);box(add,.018,.04,.025,C.paper,-.21+k*.03,1.23,0,.005);}
    box(add,.23,.09,.19,C.paper,.14,1.025,0,.025);box(add,.03,.06,.03,C.paper,.12,1.1,0,.015);
    tube([-.28,1.14,-.23],[.28,1.14,-.23],.022,C.steel);
  }));
  f.spot('on',null,.12,.98,.12,{maxH:.26,scale:.65,label:'욕실 수레'});
};

B.gpt_ricebin = f => {
  f.add(mc('gpt_ricebin',({add})=>{
    feet(add,.67,.56,.08,C.wood);shell(add,.67,.75,.56,.08,0,C.cream,false,C.wood);frontWall(add,.67,.75,.56,.08);
    for(let k=0;k<12;k++)ball(add,.065,C.paper,-.22+(k%4)*.145,.18+Math.floor(k/4)*.025,-.14+Math.floor(k/4)*.14,[1,.65,.9]);
    // Broad scoop with a rim and a handle, sitting in the grain.
    cyl(add,.09,.025,C.wood,.15,.27,.04);ring(add,.085,.012,C.edge,.15,.29,.04,HP);box(add,.045,.025,.2,C.wood,.15,.28,.16,.012);
    box(add,.32,.18,.018,C.sage,0,.49,.294,.025);box(add,.17,.03,.013,C.paper,0,.49,.313,.006);
  }));
  const p=lid(f,'gpt_ricebin',.71,.6,.83,0,C.wood,(a)=>handle(a,0,.085,.47,.2));
  const s=f.spot('inside',null,-.14,.32,.08,{part:p,maxH:.3,scale:.7,label:'쌀통 안'});
  const tray=pullOutTray(f,p,s,.3,{w:.23,d:.22,color:C.wood,up:.54,supportBaseY:.135});
  tray.add(mc('gpt_ricebin|lifting-grain-tray',({add})=>{
    for(const x of [-.075,0,.075])for(const z of [-.06,0,.06])ball(add,.025,C.paper,x,.02,z,[1,.4,.7]);
  }));
  s.anchor.position.y=.035;
};

B.gpt_watercooler = f => {
  f.add(mc('gpt_watercooler',({add})=>{
    feet(add,.61,.53,.08,C.dark);shell(add,.61,.92,.53,.08,0,C.cream,true,C.sky);
    shelf(add,.48,.42,.2,0,C.cream);for(let k=0;k<4;k++)cyl(add,.055,.06,C.paper,-.15,.23+k*.055,0,0,0,.07);
    box(add,.48,.17,.09,C.navy,0,.8,.24,.02);box(add,.5,.05,.23,C.steel,0,.63,.29,.015);
    for(const [x,c]of[[-.12,C.coral],[.12,C.sky]]){box(add,.045,.08,.07,c,x,.79,.31,.012);cyl(add,.025,.045,C.steel,x,.735,.34);}
    cyl(add,.11,.07,C.cream,0,1.025,0);cyl(add,.07,.12,C.sky,0,1.08,0);cyl(add,.2,.37,C.sky,0,1.325,0,0,0,.18);
    for(const y of [1.17,1.29,1.41])ring(add,.195,.012,C.blue,0,y,0,HP);ball(add,.19,C.sky,0,1.51,0,[1,.3,1]);
    mug(add,.12,.655,.29,C.cream,.6);
  }));
  const p=door(f,'gpt_watercooler',.56,.43,0,.32,.3,C.sage);
  const s=f.spot('inside',null,.12,.22,.08,{part:p,maxH:.26,scale:.65,label:'정수기 컵 수납장'});
  pullOutTray(f,p,s,.34,{w:.23,d:.2,color:C.cream});
};

B.gpt_petcarrier = f => {
  f.add(mc('gpt_petcarrier',({add})=>{
    feet(add,.88,.67,.05,C.blue);
    shell(add,.88,.55,.67,.05,0,C.sky,true,C.cream);
    box(add,.8,.06,.58,C.pink,0,.14,0,.035);box(add,.3,.045,.18,C.paper,-.2,.192,-.18,.02);
    ball(add,.08,C.yellow,.23,.22,-.02);ring(add,.06,.02,C.coral,.2,.24,.13,HP);
    for(const x of [-.45,.45])for(let k=0;k<4;k++)box(add,.015,.045,.07,C.blue,x,.32,-.2+k*.13,.006);
    for(const x of [-.17,.17])box(add,.035,.12,.06,C.dark,x,.65,0,.015);box(add,.37,.045,.06,C.dark,0,.72,0,.018);
  }));
  const pv=grp();put(pv,-.4,.33,.37);f.add(pv);
  pv.add(mc('gpt_petcarrier|gate',({add})=>{
    for(const x of [.018,.78])box(add,.035,.49,.04,C.cream,x,0,0,.012);
    for(const y of [-.23,.23])box(add,.79,.035,.04,C.cream,.4,y,0,.012);
    for(let k=1;k<8;k++)box(add,.018,.43,.025,C.steel,k*.1,0,0,.008);
    for(const y of [-.08,.08])box(add,.75,.016,.026,C.steel,.4,y,0,.006);
    box(add,.09,.09,.04,C.yellow,.69,0,.026,.012);
  }));
  const p=f.part('door',pv,t=>{pv.rotation.y=-1.9*t;},{label:'반려동물 이동장',dur:.32});
  const s=f.spot('inside',null,.12,.19,.13,{part:p,maxH:.28,scale:.65,label:'이동장 쿠션'});
  pullOutTray(f,p,s,.4,{w:.25,d:.22,color:C.pink});
};

B.gpt_rabbitcage = f => {
  f.add(mc('gpt_rabbitcage',({add,tube})=>{
    box(add,1.02,.19,.68,C.sage,0,.095,0,.045);box(add,.9,.045,.56,C.wood,0,.21,0,.025);
    for(const x of [-.48,.48])for(const z of [-.29,.29])tube([x,.19,z],[x,.86,z],.024,C.cream);
    for(const y of [.3,.57,.85]){
      tube([-.48,y,-.29],[.48,y,-.29],.012,C.steel);
      for(const x of [-.48,.48])tube([x,y,-.29],[x,y,.29],.012,C.steel);
    }
    for(let k=0;k<9;k++)tube([-.44+k*.11,.2,-.29],[-.44+k*.11,.85,-.29],.009,C.steel);
    for(const x of [-.48,.48])for(let k=0;k<5;k++)tube([x,.2,-.23+k*.115],[x,.85,-.23+k*.115],.009,C.steel);
    for(let k=0;k<7;k++)tube([-.42+k*.14,.86,-.29],[-.42+k*.14,.86,.29],.009,C.steel);
    box(add,.32,.23,.3,C.cream,-.25,.35,-.05,.07);box(add,.14,.15,.03,C.brown,-.25,.31,.115,.06);
    cyl(add,.1,.05,C.wood,.25,.255,.1);cyl(add,.08,.025,C.leaf,.25,.288,.1);
    bottle(add,.43,.4,-.07,C.sky,.65);tube([.43,.44,-.07],[.35,.36,-.07],.012,C.steel);
    for(let k=0;k<8;k++)tube([.1+k*.03,.25,-.18],[.07+k*.03,.48,-.21],.012,C.yellow);
  }));
  const pv=grp();put(pv,-.48,.53,.31);f.add(pv);
  pv.add(mc('gpt_rabbitcage|door',({add,tube})=>{
    for(const y of [-.31,.31])tube([0,y,0],[.96,y,0],.02,C.cream);
    for(let k=0;k<9;k++)tube([k*.12,-.3,0],[k*.12,.3,0],.009,C.steel);
    tube([0,0,0],[.96,0,0],.01,C.steel);box(add,.07,.1,.04,C.yellow,.82,0,.02,.012);
  }));
  const p=f.part('door',pv,t=>{pv.rotation.y=-1.8*t;},{label:'토끼 집 문'});
  f.spot('inside',null,.1,.235,.1,{part:p,maxH:.35,scale:.75,label:'토끼 집 바닥'});
};

B.gpt_catwheel = f => {
  f.add(mc('gpt_catwheel',({add,tube})=>{
    box(add,.99,.12,.6,C.wood,0,.06,0,.04);
    for(const x of [-.32,.32]){box(add,.13,.2,.41,C.cream,x,.21,0,.025);cyl(add,.085,.28,C.steel,x,.32,0,HP);}
    // Two rims plus connected tread blocks form a genuinely hollow wheel.
    for(const z of [-.2,.2])ring(add,.57,.055,C.cream,0,.9,z);
    for(let k=0;k<24;k++){const a=k*PI/12;box(add,.135,.035,.4,k%2?C.sage:C.mint,Math.cos(a)*.55,.9+Math.sin(a)*.55,0,.01,0,0,a+HP);}
    ball(add,.06,C.coral,0,.42,.05);tube([0,.42,.05],[.12,.44,.08],.009,C.wood);
  }));
  f.spot('on',null,0,.385,.05,{maxH:.44,scale:.8,label:'캣휠 안쪽'});
};

B.gpt_rockinghorse = f => {
  f.add(mc('gpt_rockinghorse',({add,tube})=>{
    for(const z of [-.25,.25]){
      const pts=[[-.62,.17,z],[-.39,.07,z],[0,.035,z],[.39,.07,z],[.62,.17,z]];
      for(let k=0;k<pts.length-1;k++)tube(pts[k],pts[k+1],.04,C.wood,10);
      for(const x of [-.31,.31])tube([x,.1,z],[x*.7,.61,z*.65],.045,C.cream,10);
    }
    ball(add,.25,C.cream,0,.69,0,[1.7,.7,.72]);box(add,.47,.07,.27,C.coral,0,.87,0,.04);
    tube([-.29,.72,0],[-.4,1.11,0],.105,C.cream,12);ball(add,.15,C.cream,-.42,1.13,0,[1.2,.85,.75]);ball(add,.11,C.wood,-.57,1.09,0,[.8,.7,1]);
    for(const z of [-.08,.08]){add(G.cone(.045,.14,8),C.cream,-.37,1.3,z,0,0,-.15);ball(add,.016,C.dark,-.47,1.17,z*1.4);}
    for(let k=0;k<4;k++)ball(add,.055,C.wood,-.3+k*.03,1.15-k*.08,0,[.8,1.2,1.2]);
    tube([-.36,1.03,-.23],[-.36,1.03,.23],.022,C.edge);ball(add,.05,C.wood,.39,.7,-.02,[1.8,.55,.65]);
  }));
  f.spot('on',null,0,.91,0,{maxH:.3,scale:.7,label:'목마 안장'});
};

B.gpt_dollpram = f => {
  f.add(mc('gpt_dollpram',({add,tube})=>{
    for(const x of [-.31,.31])for(const z of [-.25,.25])wheel(add,x,.13,z,.12);
    for(const x of [-.28,.28]){tube([x,.16,-.24],[x,.69,.23],.025,C.steel);tube([x,.16,.24],[x,.69,-.23],.025,C.steel);}
    shell(add,.76,.3,.65,.65,0,C.pink,false,C.cream);frontWall(add,.76,.3,.65,.65,0,C.pink);folded(add,0,.71,.07,C.paper,.59,.41);
    // Folded fabric hood is supported by three curved ribs over the back half.
    box(add,.72,.26,.12,C.pink,0,1.03,-.255,.09);
    for(const z of [-.25,-.14,-.03])ring(add,.33,.025,C.wood,0,.94,z,0,0,0,PI);
    for(const x of [-.33,.33]){tube([x,.81,-.25],[x,1.22,-.52],.025,C.steel);}
    tube([-.33,1.22,-.52],[.33,1.22,-.52],.035,C.wood);
    ball(add,.08,C.yellow,0,.81,.13);ball(add,.057,C.cream,0,.91,.13);
  }));
  f.spot('on',null,.16,.785,.12,{maxH:.25,scale:.65,label:'인형 유모차 안'});
};

B.gpt_toolchest = f => {
  f.add(mc('gpt_toolchest',({add,tube})=>{
    for(const x of [-.34,.34])for(const z of [-.22,.22])wheel(add,x,.08,z,.07);
    shell(add,.85,.8,.57,.15,0,C.coral);box(add,.91,.07,.63,'#6f4b30',0,.98,0,.025);
    for(const x of [-.44,.44])for(let k=0;k<4;k++)box(add,.012,.025,.28,C.edge,x,.4+k*.08,0,.006);
    tube([.43,.79,-.2],[.57,.79,-.2],.02,C.steel);tube([.57,.79,-.2],[.57,.79,.2],.02,C.steel);
    // Hammer and spanner sit on the rubber work surface.
    box(add,.035,.03,.3,C.wood,-.13,1.03,0,.01);box(add,.18,.055,.065,C.steel,-.13,1.06,-.12,.012);
    box(add,.055,.02,.26,C.steel,.18,1.025,0,.012);ring(add,.043,.012,C.steel,.18,1.026,-.14,HP);
  }));
  for(let k=0;k<3;k++)drawer(f,'gpt_toolchest'+k,.71,.2,.45,0,.21+k*.23,.31,C.coral,(a)=>{
    box(a,.22,.025,.05,C.steel,-.16,.065,-.32,.01);box(a,.06,.055,.13,C.yellow,-.22,.075,-.19,.012);
  });
};

B.gpt_workbench = f => {
  f.add(mc('gpt_workbench',({add,tube})=>{
    feet(add,1.33,.64,.76,C.edge);shelf(add,1.43,.73,.82,0,C.wood);shelf(add,1.24,.56,.24,0,C.wood);
    for(const x of [-.61,.61])box(add,.065,.75,.065,C.edge,x,1.16,-.3,.015);
    box(add,1.26,.58,.045,C.sage,0,1.22,-.32,.02);
    for(let r=0;r<4;r++)for(let k=0;k<10;k++)cyl(add,.008,.008,C.edge,-.54+k*.12,1.04+r*.12,-.291,HP);
    for(const x of [-.38,-.12,.17]){tube([x,1.37,-.265],[x,1.1,-.265],.018,C.wood);box(add,.13,.07,.045,C.steel,x,1.36,-.265,.015);}
    box(add,.23,.12,.2,C.blue,.43,.88,.08,.018);for(const x of [.34,.52])box(add,.04,.19,.21,C.steel,x,.98,.08,.01);
    tube([.43,.93,-.08],[.43,.93,.27],.015,C.steel);tube([.43,.93,.27],[.43,1.02,.27],.012,C.steel);
    basket(add,.5,.3,.43,-.3,.24,0,C.wood);box(add,.3,.28,.29,C.coral,.34,.38,0,.02);handle(add,.34,.45,.16,.15);
    box(add,.36,.08,.2,C.wood,-.1,.86,.13,.015,0,.2);
  }));
  f.spot('on',null,-.42,.82,.18,{maxH:.4,scale:.75,label:'공구 작업대'});
};

B.gpt_bakeryoven = f => {
  f.add(mc('gpt_bakeryoven',({add})=>{
    feet(add,1.12,.68,.12,C.steel);shell(add,1.12,1.12,.68,.12,0,C.cream,true,C.cream);
    for(const y of [.25,.65]){
      shelf(add,.98,.54,y,0,C.steel);box(add,.82,.025,.42,C.navy,0,y+.012,.02,.015);
      for(const x of [-.26,0,.26])bread(add,x,y+.025,.02,.8);
    }
    box(add,1.12,.19,.075,C.sage,0,1.16,.32,.025);
    for(const x of [-.4,.4]){cyl(add,.055,.04,C.wood,x,1.16,.38,HP);box(add,.015,.03,.01,C.paper,x,1.18,.408,.004);}
    box(add,.25,.06,.015,C.navy,0,1.16,.365,.009);
    for(let k=0;k<4;k++)box(add,.045,.025,.01,C.yellow,-.08+k*.055,1.16,.38,.005);
    folded(add,.27,1.24,-.04,C.paper,.3,.3);
  }));
  const p=door(f,'gpt_bakeryoven',1.04,.86,0,.62,.38,C.coral,(a,cx)=>{
    box(a,.85,.54,.018,C.navy,cx,.02,.043,.035);handle(a,cx,.35,.045,.65,C.cream);
  });
  f.spot('inside',null,.27,.25,.16,{part:p,maxH:.25,scale:.65,label:'제빵 오븐 트레이'});
};

B.gpt_noodlecart = f => {
  f.add(mc('gpt_noodlecart',({add,tube})=>{
    for(const x of [-.55,.55])wheel(add,x,.2,0,.19);feet(add,.92,.55,.18,C.edge);
    shell(add,1.13,.65,.65,.2,0,C.wood);box(add,1.24,.075,.75,C.cream,0,.89,0,.025);
    for(const x of [-.55,.55])tube([x,.87,-.29],[x,1.76,-.29],.035,C.edge);
    box(add,1.3,.12,.86,C.coral,0,1.8,0,.04);
    // Split noren leaves stay over an actual serving opening.
    for(let k=0;k<4;k++)box(add,.28,.3,.025,C.cream,-.45+k*.3,1.58,-.29,.02);
    for(const x of [-.3,0,.3]){cyl(add,.12,.07,C.paper,x,.968,.08,0,0,.15);cyl(add,.12,.012,C.brown,x,1.007,.08);for(let k=0;k<3;k++)ring(add,.07,.009,C.yellow,x,1.023,.08,HP,0,k*.3,PI);}
    cyl(add,.14,.2,C.steel,-.35,1.02,-.15);cyl(add,.15,.025,C.cream,-.35,1.135,-.15);
    cyl(add,.065,.17,C.wood,.43,1.015,-.13);for(let k=0;k<5;k++)tube([.4+k*.016,.98,-.13],[.4+k*.018,1.28,-.13],.006,C.edge);
    bottle(add,.19,.26,0,C.coral,.8);basket(add,.46,.26,.4,-.26,.26,0,C.cream);
  }));
  const p=doubleDoor(f,'gpt_noodlecart',1.08,.59,.525,.36,C.sage);
  f.spot('inside',null,.23,.255,.1,{part:p,maxH:.33,scale:.7,label:'국수 수레 아래 찬장'});
};

B.gpt_producecart = f => {
  f.add(mc('gpt_producecart',({add,tube})=>{
    for(const x of [-.51,.51])wheel(add,x,.22,0,.21);feet(add,.8,.58,.2,C.edge);
    box(add,1.05,.14,.71,C.wood,0,.51,0,.025);
    for(const x of [-.29,.29]){
      basket(add,.48,.24,.57,x,.58,0,C.wood);
      for(let k=0;k<6;k++){const xx=x-.14+(k%3)*.14,zz=-.1+Math.floor(k/3)*.18;ball(add,.075,x<0?C.coral:C.yellow,xx,.87,zz);if(x<0)ball(add,.025,C.leaf,xx,.94,zz,[1.5,.3,1]);}
    }
    for(const x of [-.49,.49])tube([x,.56,-.29],[x,1.66,-.29],.03,C.sage);
    box(add,1.18,.1,.85,C.sage,0,1.71,0,.035);
    for(let k=0;k<4;k++)box(add,.14,.105,.86,C.cream,-.45+k*.3,1.713,0,.015);
    box(add,.4,.21,.035,C.navy,0,1.45,-.26,.015);for(let k=0;k<3;k++)box(add,.055,.018,.01,C.yellow,-.08+k*.08,1.45,-.234,.004);
    tube([.48,.58,.22],[.74,.78,.22],.025,C.edge);tube([.74,.78,.22],[.74,.78,-.22],.03,C.edge);
  }));
  f.spot('under',null,.23,.03,.19,{maxH:.35,scale:.75,label:'과일 수레 아래'});
};

B.gpt_seedcabinet = f => {
  f.add(mc('gpt_seedcabinet',({add})=>{
    feet(add,.9,.47,.17);shell(add,.9,1.25,.47,.17,0,C.wood);
    box(add,.95,.085,.53,C.edge,0,1.46,0,.025);
    // Upper pigeonholes hold visibly different seed packets, lower drawers hold tools.
    for(const y of [.86,1.13])shelf(add,.78,.36,y,0,C.wood);
    for(const x of [-.27,0,.27]){
      for(const y of [.86,1.13]){
        box(add,.22,.21,.09,C.paper,x,y+.105,-.04,.01);ball(add,.045,x<0?C.yellow:x>0?C.coral:C.sage,x,y+.12,.012,[1,1,.2]);
        box(add,.11,.018,.01,C.edge,x,y+.045,.012,.003);
      }
    }
    for(const x of [-.135,.135])box(add,.025,.53,.36,C.edge,x,1.115,0,.006);
    plant(add,-.26,1.505,0,C.coral,.65);
  }));
  for(let k=0;k<2;k++)drawer(f,'gpt_seedcabinet'+k,.76,.23,.35,0,.26+k*.26,.25,k?C.sage:C.cream,(a)=>{box(a,.18,.06,.14,C.wood,-.18,.08,-.16,.015);});
};

B.gpt_stationluggage = f => {
  f.add(mc('gpt_stationluggage',({add,tube})=>{
    for(const x of [-.35,.35])for(const z of [-.34,.34])wheel(add,x,.09,z,.08);
    box(add,.83,.09,.87,C.steel,0,.24,0,.03);
    for(const x of [-.37,.37]){tube([x,.25,-.37],[x,1.4,-.37],.03,C.steel);tube([x,1.4,-.37],[x,1.52,-.25],.03,C.steel);}
    tube([-.37,1.52,-.25],[.37,1.52,-.25],.035,C.wood);
    box(add,.66,.41,.63,C.wood,0,.49,.03,.055);for(const x of [-.22,.22])box(add,.05,.42,.64,C.edge,x,.49,.03,.016);
    box(add,.56,.34,.47,C.sage,-.03,.86,.03,.05);for(const x of [-.17,.11])box(add,.035,.35,.48,C.cream,x,.86,.03,.014);
    handle(add,-.03,1.07,.03,.22,C.edge);box(add,.15,.12,.016,C.paper,.19,.87,.28,.008,0,0,.15);
    basket(add,.5,.25,.33,0,1.06,-.04,C.cream);folded(add,0,1.11,-.04,C.pink,.37,.24);
  }));
  f.spot('on',null,.2,.285,.29,{maxH:.3,scale:.65,label:'역 짐수레 발판'});
};

B.gpt_beachchanging = f => {
  f.add(mc('gpt_beachchanging',({add,tube})=>{
    box(add,1.12,.16,.94,C.wood,0,.08,0,.045);
    for(const x of [-.51,.51])for(const z of [-.41,.41])box(add,.07,1.59,.07,C.cream,x,.95,z,.02);
    for(let k=0;k<9;k++){
      box(add,1.03,.1,.045,k%2?C.cream:C.sky,0,.28+k*.16,-.43,.012);
      for(const x of [-.53,.53])box(add,.045,.1,.83,k%2?C.cream:C.sky,x,.28+k*.16,0,.012);
    }
    box(add,1.21,.11,1.02,C.coral,0,1.8,0,.035);
    for(let k=0;k<5;k++)box(add,.085,.015,1.01,C.cream,-.48+k*.24,1.862,0,.006);
    box(add,.78,.07,.24,C.wood,0,.53,-.24,.025);
    for(const x of [-.3,.3])box(add,.06,.3,.18,C.edge,x,.35,-.24,.01);
    folded(add,-.22,.57,-.24,C.pink,.27,.2);folded(add,-.22,.645,-.24,C.yellow,.25,.19);
    tube([-.43,1.35,0],[-.36,1.35,0],.012,C.edge);box(add,.08,.43,.03,C.sage,-.41,1.12,.02,.02);
    tube([-.5,1.65,.42],[.5,1.65,.42],.02,C.steel);
  }));
  const curtains=[-1,1].map(s=>{
    const pv=grp();put(pv,s*.25,1.05,.43);f.add(pv);
    pv.add(mc('gpt_beachchanging|curtain'+s,({add})=>{
      box(add,.49,1.15,.035,C.sage,0,0,0,.015);
      for(let k=0;k<5;k++)box(add,.035,1.12,.025,C.mint,-.2+k*.1,0,.025,.012);
      for(let k=0;k<4;k++)ring(add,.025,.007,C.steel,-.18+k*.12,.595,0,0,HP);
    }));return pv;
  });
  const p=f.part('curtain',curtains,t=>{curtains.forEach((g,i)=>{g.position.x=(i?1:-1)*(.25+.19*t);g.scale.x=1-.7*t;});},{label:'해변 탈의실 커튼',sfx:'swish',dur:.4});
  f.spot('inside',null,.19,.16,.15,{part:p,maxH:.6,scale:1,label:'탈의실 안'});
};

B.gpt_gardenhose = f => {
  f.add(mc('gpt_gardenhose',({add,tube})=>{
    box(add,.85,.1,.62,C.cream,0,.05,0,.04);
    for(const x of [-.27,.27]){tube([x,.1,-.2],[x,.77,0],.03,C.wood);tube([x,.1,.2],[x,.77,0],.03,C.wood);}
    tube([-.4,.76,0],[.4,.76,0],.03,C.steel);
    for(const x of [-.28,.28]){
      cyl(add,.33,.045,C.sage,x,.76,0,0,HP);ring(add,.3,.025,C.cream,x,.76,0,0,HP);
      for(let k=0;k<5;k++){const a=k*2*PI/5;tube([x,.76,0],[x,.76+Math.sin(a)*.27,Math.cos(a)*.27],.018,C.cream);}
    }
    for(let k=0;k<8;k++)ring(add,.265,.022,C.mint,-.21+k*.06,.76,0,0,HP);
    tube([.35,.76,0],[.45,.76,0],.02,C.steel);tube([.45,.76,0],[.45,.9,0],.02,C.steel);cyl(add,.035,.1,C.wood,.45,.93,0);
    tube([0,.48,.13],[.3,.12,.26],.022,C.mint);tube([.3,.12,.26],[.5,.13,.24],.022,C.mint);
    box(add,.06,.13,.06,C.yellow,.51,.18,.24,.02,0,0,-.25);tube([.5,.23,.24],[.6,.28,.24],.023,C.steel);
    // A labelled hose-end connector rests in the little base tray.
    cyl(add,.04,.1,C.yellow,-.25,.15,.18);box(add,.22,.08,.15,C.wood,-.2,.14,-.18,.02);
  }));
  f.spot('on',null,-.15,.1,.15,{maxH:.27,scale:.65,label:'정원 호스 받침'});
};

B.gpt_umbrellastand = f => {
  f.add(mc('gpt_umbrellastand',({add,tube})=>{
    feet(add,.79,.46,.12);shell(add,.79,.57,.46,.12,0,C.wood,false,C.cream);frontWall(add,.79,.57,.46,.12,0,C.wood);
    for(const x of [-.19,0,.19])box(add,.025,.5,.36,C.edge,x,.4,0,.006);
    for(const x of [-.3975,.3975])box(add,.055,.055,.51,C.cream,x,.72,0,.015);
    for(const z of [-.2275,.2275])box(add,.74,.055,.055,C.cream,0,.72,z,.015);
    for(const x of [-.45,.45])box(add,.055,.59,.065,C.wood,x,.43,-.19,.015);
    for(const [x,c,h,z]of[[-.285,C.coral,1.21,0],[-.095,C.sage,1.37,-.02],[.095,C.sky,1.26,0],[.285,C.yellow,1.1,.02]]){
      tube([x,.23,z],[x,h,z],.014,C.edge);
      box(add,.1,.61,.09,c,x,.62,z,.045);ring(add,.06,.015,C.wood,x+.06,h,z,0,0,0,PI*1.5);
      box(add,.105,.025,.1,C.cream,x,.63,z,.01);
    }
    box(add,.37,.1,.025,C.paper,0,.42,.253,.015);box(add,.23,.018,.01,C.edge,0,.42,.273,.004);
  }));
  f.spot('behind',null,0,.015,-.36,{maxH:.4,scale:.75,label:'우산 꽂이 뒤'});
};

B.gpt_foldcampchair = f => {
  f.add(mc('gpt_foldcampchair',({add,tube})=>{
    for(const x of [-.37,.37]){
      tube([x,.03,-.31],[x,.76,.33],.028,C.steel);tube([x,.03,.31],[x,1.08,-.31],.028,C.steel);
      tube([x,.7,.31],[x,.7,-.24],.025,C.wood);
    }
    box(add,.7,.065,.58,C.sage,0,.52,.02,.035,-.12);box(add,.69,.5,.055,C.sage,0,.88,-.27,.025,-.14);
    for(const x of [-.3,.3])box(add,.025,.42,.012,C.cream,x,.87,-.218,.006,-.14);
    box(add,.85,.055,.16,C.wood,0,.72,.23,.025);
    ring(add,.07,.016,C.dark,.3,.75,.23,HP);can(add,.3,.75,.23,C.coral,.8);
    box(add,.33,.025,.2,C.cream,-.15,.57,.1,.012,0,.2);
    box(add,.23,.14,.045,C.wood,.4,.43,.1,.015);bottle(add,.4,.4,.12,C.sky,.4);
  }));
  f.spot('on',null,-.15,.56,.02,{maxH:.35,scale:.75,label:'캠핑 의자 좌석'});
};

B.gpt_ironingstation = f => {
  f.add(mc('gpt_ironingstation',({add,tube})=>{
    for(const z of [-.19,.19]){tube([-.47,.03,z],[.33,.83,z],.028,C.steel);tube([.48,.03,z],[-.33,.83,z],.028,C.steel);}
    box(add,1.16,.07,.49,C.sky,0,.85,0,.2);
    box(add,.36,.02,.4,C.pink,-.28,.898,0,.012);box(add,.025,.34,.39,C.pink,-.59,.72,0,.01);
    // Iron is a pointed extruded sole and raised handle, no detached handle block.
    const s=new THREE.Shape();s.moveTo(-.14,-.1);s.lineTo(.08,-.1);s.quadraticCurveTo(.23,0,.08,.1);s.lineTo(-.14,.1);s.closePath();
    add(G.ext(s,.035,.005,5),C.steel,.23,.925,0,HP,0,0);
    box(add,.25,.1,.16,C.cream,.23,.99,0,.04);box(add,.05,.13,.12,C.coral,.17,1.08,0,.02);box(add,.05,.13,.12,C.coral,.33,1.08,0,.02);box(add,.2,.035,.12,C.coral,.25,1.155,0,.02);
    tube([.1,.99,0],[.1,.62,-.25],.008,C.dark);tube([.1,.62,-.25],[.38,.06,-.24],.008,C.dark);
    basket(add,.47,.28,.4,.23,.04,0,C.wood);folded(add,.23,.1,0,C.paper,.35,.28);
  }));
  f.spot('on',null,-.3,.895,.02,{maxH:.3,scale:.65,label:'다리미판'});
};

B.gpt_letterpress = f => {
  f.add(mc('gpt_letterpress',({add,tube})=>{
    feet(add,.9,.7,.67,C.edge);box(add,.98,.09,.78,C.wood,0,.72,0,.025);
    box(add,.61,.1,.54,C.navy,0,.82,0,.025);box(add,.47,.035,.38,C.steel,0,.895,.04,.012);
    for(const x of [-.27,.27])box(add,.065,.6,.09,C.blue,x,1.13,-.15,.02);
    box(add,.63,.085,.17,C.blue,0,1.43,-.15,.02);cyl(add,.045,.51,C.steel,0,1.21,-.15);
    box(add,.46,.065,.4,C.dark,0,.99,.01,.015);box(add,.35,.018,.29,C.paper,0,.935,.06,.005);
    tube([0,1.47,-.15],[.33,1.61,-.15],.022,C.steel);ball(add,.055,C.wood,.35,1.62,-.15);
    for(let k=0;k<3;k++)box(add,.26,.018,.31,C.paper,.29,.785+k*.02,.15,.006,0,.08);
    cyl(add,.06,.12,C.coral,-.34,.84,.17);box(add,.14,.025,.2,C.dark,-.27,.8,-.12,.01);
  }));
  f.spot('under',null,.12,.03,.11,{maxH:.45,scale:.8,label:'활판 인쇄대 아래'});
};

B.gpt_potterywheel = f => {
  f.add(mc('gpt_potterywheel',({add,tube})=>{
    feet(add,.91,.66,.54,C.edge);box(add,.99,.12,.75,C.sage,0,.6,0,.05);
    cyl(add,.29,.07,C.cream,-.13,.705,0);ring(add,.23,.01,C.steel,-.13,.746,0,HP);
    // Hollow clay pot is an open cylinder with a visibly thick rim and base.
    add(G.cyl(.12,.1,.24,20,true),C.wood,-.13,.87,0);ring(add,.12,.018,C.edge,-.13,.99,0,HP);cyl(add,.095,.035,C.wood,-.13,.773,0);
    insideCylinder(add,.105,.085,.205,C.wood,-.13,.8825,0,0,20);
    box(add,.2,.025,.31,C.wood,.32,.68,.03,.01);for(let k=0;k<3;k++)tube([.27+k*.045,.7,-.09],[.27+k*.045,.7,.13],.009,C.edge);
    cyl(add,.1,.13,C.coral,.32,.745,-.22);cyl(add,.08,.01,C.sky,.32,.815,-.22);
    box(add,.17,.045,.16,C.dark,-.13,.045,.29,.015);tube([-.13,.06,.25],[-.13,.5,-.2],.008,C.dark);
    cyl(add,.2,.07,C.wood,0,.39,.65);for(let k=0;k<3;k++){const a=k*2*PI/3;tube([Math.cos(a)*.12,.35,.65+Math.sin(a)*.12],[Math.cos(a)*.2,.02,.65+Math.sin(a)*.2],.025,C.edge);}
  }));
  f.spot('on',null,.27,.66,.2,{maxH:.26,scale:.65,label:'도예 작업대'});
};

B.gpt_stationbench = f => {
  f.add(mc('gpt_stationbench',({add,tube})=>{
    for(const x of [-.59,.59]){tube([x,.02,.25],[x,.57,.16],.04,C.blue);tube([x,.02,-.25],[x,.57,-.16],.04,C.blue);tube([x,.48,-.17],[x,1.1,-.26],.035,C.blue);}
    for(let k=0;k<4;k++)box(add,1.43,.07,.105,C.wood,0,.57,-.16+k*.11,.02);
    for(let k=0;k<3;k++)box(add,1.43,.1,.065,C.wood,0,.79+k*.15,-.23-k*.02,.02);
    for(const x of [-.67,.67]){tube([x,.6,.18],[x,.79,.18],.025,C.blue);tube([x,.79,.18],[x,.79,-.23],.03,C.blue);}
    box(add,.34,.29,.25,C.sage,-.4,.77,.015,.05);handle(add,-.4,.93,.01,.14,C.edge);box(add,.12,.1,.018,C.paper,-.4,.79,.15,.01);
    box(add,.26,.018,.23,C.paper,.39,.625,.03,.006,0,.15);box(add,.22,.012,.026,C.sky,.39,.642,.03,.004,0,.15);
    tube([.81,.02,-.29],[.81,1.7,-.29],.035,C.blue);box(add,.51,.29,.065,C.cream,.81,1.51,-.29,.04);box(add,.35,.055,.015,C.blue,.81,1.51,-.247,.008);
  }));
  f.spot('on',null,0,.605,.03,{maxH:.4,scale:.85,label:'역 대기 벤치'});
};

B.gpt_photobooth = f => {
  f.add(mc('gpt_photobooth',({add,tube})=>{
    box(add,1.08,.15,.92,C.wood,0,.075,0,.035);shell(add,1.08,1.7,.92,.15,0,C.cream,true,C.sky);
    box(add,1.17,.19,1,C.coral,0,1.88,0,.035);box(add,.7,.12,.025,C.paper,0,1.9,.52,.012);
    box(add,.19,.085,.016,C.blue,-.15,1.9,.55,.016);box(add,.07,.025,.016,C.blue,-.18,1.95,.55,.006);
    cyl(add,.032,.012,C.dark,-.14,1.9,.567,HP);ring(add,.035,.007,C.steel,-.14,1.9,.576);
    for(let k=0;k<3;k++)box(add,.045,.055,.016,[C.pink,C.yellow,C.sky][k],.07+k*.07,1.9,.55,.007);
    box(add,.34,.08,.39,C.pink,-.24,.58,-.09,.035);box(add,.13,.38,.22,C.wood,-.24,.35,-.09,.02);
    box(add,.3,.73,.11,C.blue,.3,1.08,-.32,.03);cyl(add,.075,.045,C.dark,.3,1.27,-.24,HP);ring(add,.076,.012,C.steel,.3,1.27,-.21);
    box(add,.21,.18,.018,C.navy,.3,1,-.251,.015);box(add,.11,.065,.02,C.yellow,.3,.82,-.245,.012);
    tube([-.48,1.74,.46],[.48,1.74,.46],.02,C.steel);
    box(add,.16,.38,.04,C.coral,.51,1.12,.49,.018);box(add,.06,.025,.02,C.dark,.51,1.18,.52,.006);box(add,.11,.08,.02,C.paper,.51,1.02,.52,.006);
    // Four individual photograph panels on the exterior side.
    for(let k=0;k<3;k++){box(add,.018,.2,.14,C.paper,-.551,1.43-k*.27,-.06,.009);ball(add,.045,[C.pink,C.yellow,C.sage][k],-.566,1.44-k*.27,-.06,[.2,1,1]);}
  }));
  const pv=grp();put(pv,-.48,1.08,.49);f.add(pv);
  pv.add(mc('gpt_photobooth|curtain',({add})=>{
    box(add,.89,1.27,.035,C.sage,.445,0,0,.015);for(let k=0;k<8;k++)box(add,.03,1.24,.025,C.mint,.055+k*.11,0,.025,.012);
  }));
  const p=f.part('curtain',pv,t=>{pv.scale.x=1-.87*t;},{label:'사진 부스 커튼',sfx:'swish',dur:.4});
  f.spot('inside',null,-.23,.62,.02,{part:p,maxH:.55,scale:.9,label:'사진 부스 의자'});
};

B.gpt_icecreamcart = f => {
  f.add(mc('gpt_icecreamcart',({add,tube})=>{
    for(const x of [-.51,.51])wheel(add,x,.25,0,.24);feet(add,.8,.54,.23,C.edge);
    shell(add,1.04,.55,.69,.36,0,C.cream,false,C.sky);frontWall(add,1.04,.55,.69,.36);
    for(const x of [-.52,.52])box(add,.06,.08,.74,C.coral,x,.94,0,.018);
    for(const z of [-.34,.34])box(add,.98,.08,.06,C.coral,0,.94,z,.018);
    for(const x of [-.28,0,.28]){cyl(add,.095,.26,[C.pink,C.cream,C.mint][Math.round((x+.28)/.28)],x,.57,-.13);ball(add,.09,[C.pink,C.cream,C.mint][Math.round((x+.28)/.28)],x,.74,-.13,[1,.4,1]);}
    box(add,.55,.2,.02,C.sky,0,.65,.36,.035);ball(add,.07,C.pink,0,.68,.38,[1,1,.15]);add(G.cone(.055,.13,10),C.wood,0,.58,.385,0,0,PI);
    tube([-.52,.9,-.25],[-.52,1.89,-.25],.025,C.steel);add(G.cone(.58,.22,24),C.yellow,-.52,1.94,-.25);ball(add,.04,C.coral,-.52,2.08,-.25);
    for(const z of [-.24,.24])tube([.48,.78,z],[.76,.94,z],.025,C.wood);tube([.76,.94,-.24],[.76,.94,.24],.03,C.wood);
  }));
  const p=lid(f,'gpt_icecreamcart',1.07,.71,.99,0,C.sky,(a)=>handle(a,0,.085,.58,.28));
  const s=f.spot('inside',null,.2,.435,.17,{part:p,maxH:.2,scale:.65,label:'아이스크림 통'});
  pullOutTray(f,p,s,.39,{w:.23,d:.22,color:C.cream,up:.55});
};

B.gpt_flowercart = f => {
  f.add(mc('gpt_flowercart',({add,tube})=>{
    for(const x of [-.49,.49])wheel(add,x,.25,.07,.24);
    box(add,1.05,.1,.68,C.wood,0,.48,0,.025);feet(add,.81,.5,.43,C.edge);
    for(const [x,z,h,c]of[[-.31,-.14,.4,C.coral],[0,-.14,.49,C.yellow],[.31,-.14,.4,C.pink],[-.2,.15,.28,C.lilac],[.2,.15,.28,C.cream]]){
      cyl(add,.105,h*.5,C.steel,x,.53+h*.25,z,0,0,.14);
      for(let k=0;k<5;k++){
        const a=k*2*PI/5,xx=x+Math.cos(a)*.08,zz=z+Math.sin(a)*.08,yy=.69+h;
        tube([x,.6,z],[xx,yy,zz],.009,C.leaf);
        for(let j=0;j<5;j++){const b=j*2*PI/5;add(G.sph(.035,8,5),c,xx+Math.cos(b)*.03,yy,zz+Math.sin(b)*.03,0,0,0,[1,.6,1]);}
        add(G.sph(.023,8,5),C.yellow,xx,yy+.016,zz);
      }
    }
    for(const z of [-.22,.22])tube([.49,.47,z],[.78,.77,z],.025,C.edge);tube([.78,.77,-.22],[.78,.77,.22],.03,C.edge);
    box(add,.45,.17,.025,C.paper,0,.47,.355,.025);box(add,.23,.025,.012,C.sage,0,.47,.377,.006);
  }));
  f.spot('under',null,.1,.03,.19,{maxH:.33,scale:.75,label:'꽃 수레 아래'});
};

B.gpt_musicstand = f => {
  f.add(mc('gpt_musicstand',({add,tube})=>{
    for(let k=0;k<3;k++){const a=k*2*PI/3;tube([0,.29,0],[Math.cos(a)*.38,.025,Math.sin(a)*.38],.025,C.navy);}
    tube([0,.24,0],[0,1.15,0],.025,C.navy);cyl(add,.05,.08,C.wood,0,.78,0);
    box(add,.71,.46,.05,C.wood,0,1.29,-.02,.035,-.25);box(add,.75,.04,.14,C.edge,0,1.06,.08,.015);
    for(const x of [-.15,.15]){
      box(add,.27,.34,.018,C.paper,x,1.28,.04,.008,-.25);
      for(let r=0;r<5;r++){box(add,.2,.005,.006,C.steel,x,1.18+r*.037,.081+r*.009,.001);for(let n=0;n<2;n++)ball(add,.011,C.dark,x-.05+n*.09,1.19+r*.037,.089+r*.009,[1,.65,.25]);}
    }
    // A violin rests in a thick open case beside the stand, large enough to read.
    basket(add,.28,.1,.75,.48,.02,0,C.navy);
    ball(add,.11,C.wood,.48,.17,.12,[.8,.4,1.2]);ball(add,.085,C.wood,.48,.17,-.06,[.85,.4,1.1]);box(add,.035,.035,.31,C.edge,.48,.18,-.25,.012);
    for(const x of [.47,.49])tube([x,.195,.16],[x,.195,-.39],.004,C.steel);
    tube([.6,.14,.26],[.6,.14,-.35],.008,C.edge);
  }));
  f.spot('under',null,-.13,.03,.15,{maxH:.4,scale:.75,label:'악보대 아래'});
};

B.gpt_basketballrack = f => {
  f.add(mc('gpt_basketballrack',({add,tube})=>{
    for(const x of [-.53,.53])for(const z of [-.24,.24])wheel(add,x,.08,z,.07);
    for(const x of [-.55,.55])for(const z of [-.25,.25])tube([x,.13,z],[x,1.11,z],.025,C.blue);
    for(const y of [.3,.72]){
      for(const z of [-.2,.2])tube([-.55,y,z],[.55,y,z],.025,C.blue);
      for(const x of [-.36,0,.36]){
        ball(add,.175,C.coral,x,y+.16,0);
        ring(add,.176,.007,C.brown,x,y+.16,0,0,HP);ring(add,.176,.007,C.brown,x,y+.16,0,HP);
        ring(add,.176,.007,C.brown,x,y+.16,0);
      }
    }
    tube([-.55,1.11,-.25],[.55,1.11,-.25],.025,C.blue);
    box(add,.29,.13,.025,C.paper,0,.51,.258,.015);box(add,.16,.025,.01,C.blue,0,.51,.278,.005);
  }));
  f.spot('under',null,.1,.02,.3,{maxH:.3,scale:.65,label:'체육관 공 보관대 아래'});
};

B.gpt_parcelcabinet = f => {
  f.add(mc('gpt_parcelcabinet',({add})=>{
    feet(add,1.2,.61,.11,C.dark);shell(add,1.2,1.52,.61,.11,0,C.cream,true,C.sky);
    box(add,.04,1.42,.5,C.wood,-.19,.87,0,.009);
    for(const y of [.22,.67,1.12])shelf(add,1.08,.5,y,0,C.wood);
    for(const [x,y,w,h]of[[-.38,.22,.28,.29],[-.4,.67,.23,.24],[-.4,1.12,.27,.28],[.3,.22,.44,.29],[.27,.67,.43,.28],[.3,1.12,.4,.3]]){
      box(add,w,h,.22,C.wood,x,y+h/2,-.08,.025);box(add,.045,h+.005,.23,C.paper,x,y+h/2,-.08,.007);box(add,w*.5,.07,.012,C.paper,x,y+h*.6,.041,.005);
    }
  }));
  const left=door(f,'gpt_parcelcabinet-small',.36,1.41,-.39,.87,.34,C.sage);
  const right=door(f,'gpt_parcelcabinet-large',.73,1.41,.2,.87,.34,C.sky,(a,cx)=>{
    for(const y of [-.45,0,.45]){box(a,.36,.08,.014,C.cream,cx,y,.043,.015);box(a,.1,.018,.008,C.blue,cx,y,.058,.004);}
  });
  const s=f.spot('inside',null,.29,.69,.18,{part:right,maxH:.25,scale:.65,label:'택배함 가운데칸'});pullOutTray(f,right,s,.39,{w:.24,d:.14,color:C.wood});
};

B.gpt_teacabinet = f => {
  f.add(mc('gpt_teacabinet',({add,tube})=>{
    feet(add,1.11,.58,.17);shell(add,1.11,.55,.58,.17,0,C.wood);box(add,1.21,.075,.68,C.cream,0,.76,0,.03);
    for(const x of [-.51,.51])box(add,.055,.64,.055,C.edge,x,1.08,-.25,.014);
    box(add,1.14,.07,.31,C.wood,0,1.42,-.13,.02);box(add,1.01,.31,.025,C.sage,0,1.23,-.27,.014);
    for(const x of [-.31,0,.31]){cyl(add,.065,.17,[C.sky,C.coral,C.cream][Math.round((x+.31)/.31)],x,1.535,-.13);cyl(add,.069,.025,C.wood,x,1.633,-.13);}
    box(add,.77,.025,.4,C.wood,-.05,.81,.03,.015);
    // Teapot has separate spout, lid and a connected handle.
    ball(add,.13,C.sage,-.22,.95,.02,[1, .8,1]);cyl(add,.09,.025,C.cream,-.22,1.052,.02);ball(add,.025,C.wood,-.22,1.08,.02);
    tube([-.12,.96,.02],[.02,1.02,.02],.035,C.sage,10,.021);ring(add,.095,.022,C.sage,-.35,.97,.02,0,HP);
    for(const x of [.15,.35])mug(add,x,.825,.05,C.cream,.65);
    for(let k=0;k<4;k++)cyl(add,.09,.025,C.paper,-.32,.26+k*.025,0);box(add,.3,.21,.23,C.yellow,.27,.33,0,.025);
  }));
  const p=doubleDoor(f,'gpt_teacabinet',1.07,.49,.445,.33,C.sage,(a,cx)=>{
    for(let k=0;k<4;k++)box(a,.015,.36,.012,C.wood,cx-.15+k*.1,0,.043,.004);
  });
  f.spot('inside',null,.03,.225,.12,{part:p,maxH:.31,scale:.7,label:'차 찬장 아래'});
};

B.gpt_garden_gate = f => {
  f.add(mc('gpt_garden_gate|posts-and-fence',({add,tube})=>{
    // The two posts carry the hinges and latch. The opening between them is truly empty.
    for(const x of [-.53,.53]){
      box(add,.27,.13,.37,C.wood,x,.065,0,.035);
      box(add,.16,1.08,.2,C.cream,x,.67,0,.035);
      box(add,.23,.085,.27,C.wood,x,1.24,0,.025);
      ball(add,.085,C.cream,x,1.32,0,[1,.75,1]);
      box(add,.17,.075,.018,C.sage,x,.94,.12,.012);
    }
    for(const s of [-1,1]){
      const x=s*.94;
      box(add,.11,.82,.14,C.cream,x,.46,0,.025);
      ball(add,.07,C.wood,x,.9,0,[1,.6,1]);
      for(const y of [.37,.71])box(add,.32,.07,.07,C.wood,s*.75,y,0,.018);
      for(const dx of [.69,.82]){
        box(add,.065,.68,.065,C.sage,s*dx,.55,.015,.02);
        ball(add,.033,C.sage,s*dx,.89,.015,[1,.7,1]);
      }
    }
    for(const y of [.41,.99])cyl(add,.03,.12,C.steel,-.43,y,.045);
    box(add,.06,.12,.045,C.edge,.44,.74,.085,.012);
    // Gate stop is a small block on the right post, never a wall across the passage.
    box(add,.055,.08,.06,C.wood,.437,.39,-.015,.012);
  }));
  const pv=grp();put(pv,-.43,.68,.045);f.add(pv);
  pv.add(mc('gpt_garden_gate|picket-door',({add,tube})=>{
    for(const y of [-.28,.25])box(add,.85,.085,.075,C.wood,.425,y,0,.02);
    for(let k=0;k<6;k++){
      const x=.075+k*.14,h=.68+Math.sin((k+.5)/6*PI)*.16;
      box(add,.085,h,.075,C.sage,x,-.32+h/2,.03,.025);
      ball(add,.043,C.sage,x,-.32+h,.03,[1,.7,1]);
      cyl(add,.012,.012,C.edge,x,-.28,.078,HP);cyl(add,.012,.012,C.edge,x,.25,.078,HP);
    }
    tube([.08,-.22,-.005],[.76,.2,-.005],.03,C.wood,8);
    handle(add,.73,.06,.08,.17,C.edge,false);
    box(add,.14,.035,.045,C.steel,.8,.06,.08,.01);
  }));
  const p=f.part('door',pv,t=>{pv.rotation.y=-1.85*t;},{label:'통로가 열린 정원문',dur:.32});
  f.spot('behind',null,0,.015,-.23,{part:p,maxH:.55,scale:.9,label:'정원문 뒤 빈 통로'});
};

export const GPT_FURNITURE_EXTRA_BUILDERS=B;
export const GPT_FURNITURE_EXTRA_INFO={
  gpt_breadcase:info('갓 구운 빵 진열장','shop',2,1,true,'두 단 빵 트레이와 하부 수납장'),
  gpt_coffeecart:info('에스프레소 커피 수레','kitchen',2,1,false,'머신·그라인더·잔과 병 바구니'),
  gpt_artstation:info('그림 그리는 작업대','hobby',2,1,true,'캔버스 이젤·붓·물감 서랍'),
  gpt_sewingtable:info('재봉 작업대','hobby',2,1,true,'C자 재봉틀·실·천·페달'),
  gpt_pottingbench:info('초록 분갈이 작업대','park',2,1,false,'화분·흙·모종삽·화분 선반'),
  gpt_fishstall:info('얼음 생선 가판대','seaside',2,1,false,'차양·얼음·생선과 양동이'),
  gpt_lifeguardchair:info('해변 구조대 의자','seaside',2,2,false,'사다리·구명환·파라솔'),
  gpt_surfstand:info('서프보드 보관대','seaside',2,1,false,'세 보드·하단 핀·목제 지지대'),
  gpt_campkitchen:info('접이식 캠핑 주방','travel',2,1,false,'버너·냄비·가스와 조리 바구니'),
  gpt_telescope:info('삼각대 천체망원경','hobby',1,1,false,'대물렌즈·접안부·조절손잡이'),
  gpt_clawmachine:info('인형 뽑기 기계','shop',1,1,true,'집게·개별 인형·열리는 배출구'),
  gpt_pinball:info('장난감 핀볼','hobby',1,2,false,'범퍼·플리퍼·공·점수판'),
  gpt_jukebox:info('아치 주크박스','hobby',1,1,false,'굵은 아치 밴드·선곡표·스피커'),
  gpt_uprightpiano:info('업라이트 피아노','hobby',2,2,false,'건반·페달·악보·의자'),
  gpt_drumkit:info('연습실 드럼 세트','hobby',2,2,false,'베이스·탐·스네어·세 심벌'),
  gpt_vanity:info('분장 거울 화장대','home',2,1,true,'둥근 거울·화장품·서랍·스툴'),
  gpt_bathroomtrolley:info('욕실 정리 수레','home',1,1,false,'수건·병·칫솔과 티슈 세 단'),
  gpt_ricebin:info('나무 뚜껑 쌀통','kitchen',1,1,true,'낟알과 손잡이 달린 쌀바가지'),
  gpt_watercooler:info('물통 정수기','school',1,1,true,'물통·두 수도꼭지·받침과 컵장'),
  gpt_petcarrier:info('쿠션 이동장','home',1,1,true,'격자문·쿠션·공과 장난감'),
  gpt_rabbitcage:info('토끼 우리','home',2,1,true,'격자문·건초·집·급수병·먹이'),
  gpt_catwheel:info('자작나무 캣휠','home',2,1,false,'속 빈 원형 발판·롤러·지지대'),
  gpt_rockinghorse:info('장난감 흔들 목마','home',2,1,false,'두 활대·다리·안장·갈기'),
  gpt_dollpram:info('인형 유모차','home',1,2,false,'교차 프레임·빈 바구니·후드·인형'),
  gpt_toolchest:info('서랍 공구함','hobby',1,1,true,'세 개의 실제 슬라이드 서랍·공구'),
  gpt_workbench:info('목공 작업대','hobby',2,1,false,'타공판·망치·바이스·공구 상자'),
  gpt_bakeryoven:info('빵집 오븐','shop',2,1,true,'두 단 트레이와 여섯 빵'),
  gpt_noodlecart:info('따끈한 국수 수레','shop',2,1,true,'차양·국수 그릇·냄비·찬장'),
  gpt_producecart:info('과일 가판 수레','shop',2,1,false,'사과·레몬 바구니와 줄무늬 차양'),
  gpt_seedcabinet:info('씨앗 모종 서랍장','park',1,1,true,'여섯 씨앗 봉투와 원예 서랍'),
  gpt_stationluggage:info('여행 짐수레','travel',1,1,false,'지지 프레임·두 여행가방·천 바구니'),
  gpt_beachchanging:info('줄무늬 해변 탈의실','seaside',2,1,true,'열리는 커튼·내부 벤치·수건'),
  gpt_gardenhose:info('정원 호스 릴','park',2,1,false,'연결된 호스·릴·크랭크·노즐'),
  gpt_umbrellastand:info('현관 우산 꽂이','home',1,1,false,'고리 손잡이의 네 우산과 물받이'),
  gpt_foldcampchair:info('컵홀더 캠핑 의자','travel',1,1,false,'접이식 교차 프레임·팔걸이·수납 주머니'),
  gpt_ironingstation:info('빨래 다리미판','home',2,1,false,'뾰족한 다리미·이어진 손잡이·전선·빨래'),
  gpt_letterpress:info('작은 활판 인쇄기','hobby',1,1,false,'프레스·나사·지렛대·종이'),
  gpt_potterywheel:info('도예 물레 작업대','hobby',1,2,false,'속 빈 도자기·회전판·성형 도구·의자'),
  gpt_stationbench:info('승강장 대기 벤치','travel',2,1,false,'목제 좌판·여행가방·신문·역 표지'),
  gpt_photobooth:info('즉석 사진 부스','shop',2,1,true,'열리는 커튼·카메라·화면·좌석'),
  gpt_icecreamcart:info('파라솔 아이스크림 수레','seaside',2,2,true,'뚜껑·세 아이스크림 통·지지 파라솔'),
  gpt_flowercart:info('꽃다발 수레','shop',2,1,false,'다섯 양동이와 개별 줄기·꽃잎'),
  gpt_musicstand:info('악보대와 바이올린','hobby',1,1,false,'두 장 악보·오선·바이올린 케이스'),
  gpt_basketballrack:info('체육관 공 보관대','school',2,1,false,'두 단 프레임과 여섯 농구공'),
  gpt_parcelcabinet:info('무인 택배 보관함','travel',2,1,true,'여섯 택배·분리 문·인출 선반'),
  gpt_teacabinet:info('다기 찻장','kitchen',2,1,true,'주전자·찻잔·차통과 다기 수납장'),
  gpt_garden_gate:info('기둥 정원문','park',2,1,true,'실제 힌지·빗장·울타리와 막힘 없는 뒤 통로'),
};
