// New GPT furniture; existing builders are intentionally untouched. Front is +z.
// Static pieces use the game's cached, vertex-coloured HG/hmc toon pipeline.
import { THREE, G, mc, grp, put, PI, HP, C, box, ball, cyl, ring, feet, shell, shelf,
  handle, door, doubleDoor, lid, drawer, bottle, can, book, folded, shoe, plant, wheel,
  mug, bread, basket, frontWall, insideCylinder, pullOutTray, info } from './gpt-furniture-kit.js';
import { GPT_FURNITURE_EXTRA_BUILDERS, GPT_FURNITURE_EXTRA_INFO } from './gpt-furniture-extra.js';
const B = {};

// The two rejected props rebuilt from connected mechanical parts and stocked interiors.
B.gpt_bicycle = f => {
  f.add(mc('gpt_bicycle', ({ add, tube }) => {
    const rear = [-.56, .35, 0], front = [.56, .35, 0], crank = [-.1, .34, 0], seat = [-.23, .85, 0], head = [.34, .83, 0];
    for (const x of [-.56, .56]) {
      ring(add, .3, .048, C.dark, x, .35, 0);
      ring(add, .265, .017, C.cream, x, .35, 0);
      cyl(add, .055, .12, C.steel, x, .35, 0, HP);
      for (let i = 0; i < 10; i++) { const a = i * PI / 5; tube([x, .35, .012], [x + Math.cos(a) * .252, .35 + Math.sin(a) * .252, .012], .009, C.steel); }
    }
    for (const [a, b] of [[rear, seat], [seat, crank], [rear, crank], [seat, head], [head, crank]]) tube(a, b, .035, C.mint, 10);
    for (const z of [-.065, .065]) { tube([head[0], head[1], z], [.56, .35, z], .023, C.mint); tube([-.23, .85, z], [-.56, .35, z], .018, C.mint); }
    tube([-.23, .85, 0], [-.24, .94, 0], .026, C.steel);
    box(add, .28, .09, .2, C.brown, -.26, .97, 0, .04);
    tube([.34, .83, 0], [.3, 1.02, 0], .025, C.steel);
    tube([.3, 1.02, 0], [.35, 1.08, -.22], .021, C.steel);
    tube([.3, 1.02, 0], [.35, 1.08, .22], .021, C.steel);
    for (const z of [-.21, .21]) tube([.35, 1.08, z], [.22, 1.08, z], .03, C.brown);
    // The crank spindle passes through the frame. Both pedals connect to its arms.
    cyl(add, .1, .035, C.steel, -.1, .34, .085, HP);
    ring(add, .081, .012, C.dark, -.1, .34, .11);
    ring(add, .055, .01, C.dark, -.56, .35, .11);
    tube([-.56, .408, .11], [-.1, .423, .11], .01, C.dark);
    tube([-.56, .292, .11], [-.1, .257, .11], .01, C.dark);
    tube([-.1, .34, -.12], [-.1, .34, .14], .025, C.steel);
    tube([-.1, .34, .14], [-.02, .24, .14], .022, C.steel);
    tube([-.1, .34, -.12], [-.18, .44, -.12], .022, C.steel);
    box(add, .12, .045, .1, C.dark, -.02, .24, .18, .012);
    box(add, .12, .045, .1, C.dark, -.18, .44, -.17, .012);
    // Carrier, mudguards and a kickstand are supported by frame tubes.
    box(add, .4, .045, .27, C.cream, -.55, .77, 0, .018);
    for (const z of [-.11, .11]) { tube([-.69, .75, z], [-.56, .35, z], .015, C.steel); tube([-.38, .75, z], [-.23, .8, z], .015, C.steel); }
    for (const x of [-.56, .56]) ring(add, .355, .02, C.cream, x, .35, 0, 0, 0, 0, PI);
    tube([-.1, .34, -.025], [-.24, .025, .2], .02, C.steel);
    // Basket bottom and four separately modelled walls; groceries are seated inside.
    basket(add, .34, .24, .4, .64, .79, 0, C.wood);
    tube([.4, .8, -.14], [.58, .83, -.14], .018, C.steel);
    tube([.4, .8, .14], [.58, .83, .14], .018, C.steel);
    bread(add, .61, .835, -.06, .75); bottle(add, .66, .835, .095, C.coral, .55);
    ball(add, .05, C.yellow, .5, .79, .12);
  }));
  f.spot('on', null, -.54, .8, 0, { scale: .75, maxH: .4, label: '자전거 짐받이' });
};

B.gpt_vending = f => {
  const w = .96, h = 1.72, d = .68, y = .08;
  f.add(mc('gpt_vending|stocked', ({ add }) => {
    feet(add, w, d, y, C.dark); shell(add, w, h, d, y, 0, C.cream, true, C.sage);
    box(add, w + .03, .14, d + .015, C.coral, 0, y + h - .02, 0, .045);
    for (const sy of [.44, .81, 1.18]) {
      shelf(add, .75, .5, sy, -.02, C.steel);
      box(add, .75, .055, .025, C.cream, 0, sy - .01, .246, .008);
      for (let k = 0; k < 4; k++) {
        const x = -.28 + k * .18;
        if (sy < .6) can(add, x, sy, -.055, [C.coral, C.yellow, C.mint, C.sky][k]);
        else if (sy < 1) bottle(add, x, sy, -.055, [C.mint, C.sky, C.yellow, C.coral][k], .85);
        else { box(add, .115, .2, .12, [C.yellow, C.pink, C.sky, C.sage][k], x, sy + .1, -.055, .025); box(add, .075, .07, .008, C.paper, x, sy + .1, .011, .006); }
        box(add, .07, .018, .01, C.dark, x, sy - .01, .267, .004);
      }
    }
    shelf(add, .74, .5, .22, -.03, C.dark);
    box(add, .74, .1, .055, C.coral, 0, .25, .24, .018);
    // A returned can is in a recessed delivery tray, seated on its bottom.
    can(add, -.23, .22, .1, C.sky, .7);
  }));
  const pv = grp(); put(pv, -.45, .89, .355); f.add(pv);
  pv.add(mc('gpt_vending|window-door', ({ add }) => {
    const w = .9, hh = 1.48;
    for (const x of [.035, .735, .875]) box(add, x === .735 ? .17 : .07, hh, .075, C.coral, x, 0, 0, .023);
    for (const yy of [-hh / 2, hh / 2]) box(add, w, .085, .075, C.coral, .45, yy, 0, .025);
    box(add, .6, .12, .08, C.cream, .35, .57, .012, .015);
    for (const x of [.14, .27, .4, .53]) { cyl(add, .035, .013, [C.coral, C.yellow, C.sage, C.sky][Math.round((x-.14)/.13)], x, .57, .06, HP); }
    handle(add, .77, -.27, .04, .26, C.cream, false);
    box(add, .12, .16, .016, C.navy, .76, .28, .05, .012);
    box(add, .08, .024, .012, C.yellow, .76, .28, .065, .004);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) cyl(add, .018, .018, q ? C.yellow : C.cream, .735 + q * .055, .1 - r * .06, .06, HP);
    box(add, .58, .1, .07, C.coral, .34, -.53, .005, .018);
  }));
  const p = f.part('door', pv, t => { pv.rotation.y = -1.85 * t; }, { label: '상품이 든 자판기 문', dur: .35 });
  f.spot('inside', null, .22, .44, .12, { part: p, maxH: .28, scale: .7, label: '자판기 선반' });
};

B.gpt_wardrobe = f => {
  f.add(mc('gpt_wardrobe', ({ add, tube }) => {
    feet(add, .98, .62, .13); shell(add, .98, 1.48, .62, .13, 0, C.cream);
    shelf(add, .86, .5, 1.28, -.015); folded(add, -.18, 1.28, 0, C.pink, .27); folded(add, -.18, 1.355, 0, C.sage, .27);
    tube([-.39, 1.19, 0], [.39, 1.19, 0], .025, C.steel);
    for (const [x, c, len] of [[-.28,C.coral,.53],[-.06,C.sage,.63],[.18,C.sky,.56]]) {
      tube([x, 1.17, 0], [x-.12, 1.08, 0], .012, C.wood); tube([x-.12, 1.08, 0], [x+.12, 1.08, 0], .012, C.wood); tube([x+.12, 1.08, 0], [x,1.17,0],.012,C.wood);
      box(add, .2, len, .1, c, x, 1.06-len/2, .015,.04); box(add,.32,.12,.1,c,x,1.01,.015,.035);
    }
    shoe(add, -.25, .185, .04, C.brown); shoe(add, -.11, .185, .04, C.brown);
  }));
  const p = doubleDoor(f, 'gpt_wardrobe', .95, 1.43, .875, .345, C.sage, (a,cx) => {
    for (let k=0;k<6;k++) box(a,.3,.025,.018,C.mint,cx,-.45+k*.055,.043,.006);
    box(a,.12,.055,.018,C.cream,cx,.43,.044,.012);
  });
  f.spot('inside',null,.22,.185,.08,{part:p,maxH:.4,scale:.8,label:'옷장 바닥'});
};

B.gpt_schoollocker = f => {
  f.add(mc('gpt_schoollocker',({add})=>{
    feet(add,.82,.54,.1,C.steel); shell(add,.82,1.45,.54,.1,0,C.sky,true,C.cream);
    box(add,.035,1.34,.44,C.steel,0,.82,-.015,.008);
    for(const y of [.2,.78,1.28]) shelf(add,.7,.42,y,-.01,C.cream);
    book(add,-.24,.78,-.03,C.coral,.32);book(add,-.1,.78,-.03,C.yellow,.28);
    folded(add,.18,1.28,-.02,C.pink,.25,.28);
    shoe(add,.15,.2,0,C.mint);shoe(add,.28,.2,0,C.mint);
  }));
  const p=doubleDoor(f,'gpt_schoollocker',.79,1.39,.82,.3,C.sky,(a,cx)=>{
    for(let k=0;k<4;k++) box(a,.2,.018,.01,C.blue,cx,.36+k*.04,.044,.003);
    box(a,.16,.07,.012,C.paper,cx,.15,.045,.007);cyl(a,.018,.015,C.dark,cx,-.14,.055,HP);
  });
  f.spot('inside',null,-.15,.2,.08,{part:p,maxH:.44,scale:.8,label:'학교 사물함'});
};

B.gpt_pantrycabinet = f => {
  f.add(mc('gpt_pantrycabinet',({add})=>{
    feet(add,.86,.56,.13);shell(add,.86,1.32,.56,.13,0,C.cream);
    for(const y of [.22,.62,1.03]) {
      shelf(add,.74,.45,y,-.02,C.wood);
      for(let k=0;k<3;k++) if(y<.4) bottle(add,-.23+k*.23,y,-.03,[C.mint,C.coral,C.yellow][k]);
      else if(y<.9) {cyl(add,.078,.18,[C.sky,C.pink,C.sage][k],-.23+k*.23,y+.09,-.03);cyl(add,.081,.025,C.wood,-.23+k*.23,y+.195,-.03);}
      else box(add,.16,.23,.2,[C.paper,C.yellow,C.coral][k],-.23+k*.23,y+.115,-.04,.018);
    }
    plant(add,.23,1.45,0,C.coral,.7);
  }));
  const p=doubleDoor(f,'gpt_pantrycabinet',.83,1.27,.815,.31,C.yellow,(a,cx)=>box(a,.26,.98,.014,C.cream,cx,0,.04,.02));
  f.spot('inside',null,.23,.62,.1,{part:p,maxH:.3,scale:.7,label:'식료품 찬장'});
};

B.gpt_toychest = f => {
  f.add(mc('gpt_toychest',({add})=>{
    feet(add,.87,.61,.1);shell(add,.87,.51,.61,.1,0,C.cream,false,C.wood);frontWall(add,.87,.51,.61,.1);
    for(const x of [-.33,.33]) box(add,.075,.42,.02,C.yellow,x,.36,.319,.013);
    box(add,.18,.19,.18,C.yellow,-.24,.25,-.04,.025);ball(add,.11,C.coral,-.23,.455,-.04);
    box(add,.14,.19,.12,C.wood,-.055,.25,-.155,.02);ball(add,.09,C.sky,-.055,.435,-.155);
    box(add,.17,.16,.13,C.sage,.24,.235,-.16,.025);box(add,.09,.11,.08,C.pink,.22,.37,-.16,.02);
    ring(add,.08,.022,C.yellow,.2,.447,-.14,HP);
  }));
  const p=lid(f,'gpt_toychest',.91,.65,.61,0,C.coral,(a)=>{handle(a,0,.078,.55,.19);box(a,.19,.016,.19,C.cream,0,.083,.32,.03);});
  const s=f.spot('inside',null,.15,.175,.11,{part:p,maxH:.3,scale:.7,label:'장난감 상자'});
  pullOutTray(f,p,s,.33,{w:.28,d:.24,color:C.cream,up:.35});
};

B.gpt_travelcase = f => {
  f.add(mc('gpt_travelcase',({add,tube})=>{
    shell(add,.75,.92,.4,.12,0,C.sky,true,C.cream);
    for(const x of [-.23,.23]) wheel(add,x,.09,-.08,.09,false);
    for(const x of [-.19,.19]){tube([x,1,-.14],[x,1.32,-.14],.025,C.steel);ring(add,.034,.009,C.dark,x,1.047,-.14,HP);}
    box(add,.44,.065,.08,C.dark,0,1.33,-.14,.025);
    folded(add,-.12,.18,-.03,C.coral,.3,.28);folded(add,-.12,.255,-.03,C.cream,.3,.28);
    shoe(add,.19,.18,0,C.yellow,.9);book(add,-.12,.33,-.03,C.mint,.22,.1,.19);
    box(add,.62,.03,.3,C.cream,0,.565,-.01,.012);
    // Elastic packing straps lie across the contents, with a real buckle.
    box(add,.62,.05,.025,C.wood,0,.62,.165,.012);box(add,.08,.085,.04,C.cream,0,.62,.18,.015);
  }));
  const p=door(f,'gpt_travelcase',.75,.91,0,.59,.235,C.sky,(a,cx)=>{
    for(const x of [-.22,-.11,0,.11,.22]) box(a,.025,.69,.022,C.blue,cx+x,0,.042,.012);
    box(a,.13,.12,.02,C.cream,cx-.17,.2,.057,.014);box(a,.14,.07,.02,C.yellow,cx+.13,-.2,.057,.01);
    handle(a,cx,.49,0,.22,C.dark);
  });
  f.spot('inside',null,.15,.58,.02,{part:p,maxH:.3,scale:.7,label:'캐리어 정리 칸'});
};

B.gpt_mailbox = f => {
  f.add(mc('gpt_mailbox',({add})=>{
    box(add,.5,.1,.42,C.wood,0,.05,0,.04);box(add,.14,.75,.14,C.wood,0,.45,0,.025);
    shell(add,.67,.48,.48,.8,0,C.coral,true,C.cream);
    // Curved cap is a real half-cylinder, with a hollow letter chamber under it.
    add(G.cyl(.35,.35,.51,24),C.coral,0,1.27,0,HP,0,0,[1,.5,.25]);
    box(add,.23,.014,.23,C.paper,-.17,.865,-.04,.006,0,.15);box(add,.2,.018,.19,C.yellow,-.17,.883,-.04,.005,0,-.1);
    box(add,.035,.3,.035,C.steel,.365,1.2,0,.01);box(add,.18,.12,.035,C.yellow,.43,1.32,0,.015);
  }));
  const p=door(f,'gpt_mailbox',.65,.44,0,1.04,.27,C.coral,(a,cx)=>{
    box(a,.4,.035,.014,C.dark,cx,.1,.04,.01);box(a,.22,.085,.014,C.paper,cx,-.06,.044,.01);
    box(a,.18,.008,.008,C.edge,cx,-.06,.056,.002);
  });
  const s=f.spot('inside',null,.15,.88,.06,{part:p,maxH:.27,scale:.65,label:'편지함 안'});
  pullOutTray(f,p,s,.3,{w:.25,d:.21,color:C.cream});
};

B.gpt_shoecabinet = f => {
  f.add(mc('gpt_shoecabinet',({add})=>{
    feet(add,1,.49,.2);shell(add,1,.88,.49,.2,0,C.cream,true,C.wood);
    for(const y of [.27,.56,.83]) {
      shelf(add,.88,.4,y,0,C.wood);
      for(const [x,c] of [[-.3,C.coral],[-.16,C.coral],[.17,C.sage],[.31,C.sage]]) shoe(add,x,y,0,c,.87);
    }
    plant(add,-.32,1.08,-.04,C.coral,.65);box(add,.24,.03,.18,C.wood,.3,1.095,0,.02);
    ring(add,.035,.008,C.yellow,.29,1.12,0,HP);
  }));
  const p=doubleDoor(f,'gpt_shoecabinet',.97,.83,.64,.28,C.wood,(a,cx)=>{
    for(let k=0;k<7;k++) box(a,.34,.025,.016,C.edge,cx,-.25+k*.07,.04,.006);
  });
  const s=f.spot('inside',null,0,.58,.08,{part:p,maxH:.2,scale:.65,label:'신발장 가운데칸'});
  pullOutTray(f,p,s,.32,{w:.2,d:.25,color:C.wood});
};

B.gpt_picnicbasket = f => {
  f.add(mc('gpt_picnicbasket',({add})=>{
    basket(add,.76,.38,.55,0,.02,0,C.wood);
    // An arched handle connects to both short sides.
    ring(add,.34,.035,C.edge,0,.38,0,0,0,0,PI);
    folded(add,-.18,.075,-.06,C.pink,.25,.24);bottle(add,.2,.075,-.07,C.mint,.8);
    bread(add,.04,.075,.12,.85);
  }));
  const p=lid(f,'gpt_picnicbasket',.78,.57,.4,0,C.wood,(a)=>{
    for(let k=1;k<7;k++) box(a,.016,.01,.5,C.edge,-.39+k*.78/7,.081,.285,.004);
  });
  f.spot('inside',null,-.16,.075,.09,{part:p,maxH:.25,scale:.7,label:'피크닉 바구니 안'});
};

B.gpt_washer = f => {
  const front=.33, cy=.53, r=.235;
  f.add(mc('gpt_washer',({add})=>{
    feet(add,.79,.64,.07,C.dark);shell(add,.79,.94,.64,.07,0,C.cream);
    // Four front rails leave a physical circular opening rather than covering the cavity.
    box(add,.79,.19,.06,C.cream,0,.915,front-.03,.025);box(add,.79,.18,.06,C.cream,0,.16,front-.03,.025);
    for(const s of [-1,1]) box(add,.1,.58,.06,C.cream,s*.345,.535,front-.03,.02);
    ring(add,.25,.045,C.steel,0,cy,front-.015);
    insideCylinder(add,.232,.232,.44,C.steel,0,cy,.03,HP);
    cyl(add,.23,.025,C.navy,0,cy,-.2,HP);
    for(let i=0;i<16;i++){const a=i*PI/8;ball(add,.011,C.dark,Math.cos(a)*.19,cy+Math.sin(a)*.19,-.183);}
    folded(add,-.09,.315,-.15,C.pink,.2,.16);folded(add,-.1,.39,-.15,C.sky,.18,.14);
    cyl(add,.055,.04,C.wood,.26,.917,.35,HP);box(add,.19,.065,.015,C.navy,0,.92,.34,.008);
    box(add,.17,.09,.018,C.white,-.24,.916,.34,.012);handle(add,-.24,.918,.349,.1);
    folded(add,-.13,1.01,-.04,C.sage,.35,.36);bottle(add,.25,1.01,-.09,C.yellow,.7);
  }));
  const pv=grp();put(pv,-.28,cy,.365);f.add(pv);
  pv.add(mc('gpt_washer|porthole',({add})=>{
    ring(add,r+.035,.043,C.cream,.28,0,0);ring(add,r-.01,.025,C.navy,.28,0,.006);
    handle(add,.5,0,.03,.12,C.wood,false);
  }));
  const p=f.part('door',pv,t=>{pv.rotation.y=-1.9*t;},{label:'빨래가 든 세탁기',dur:.32});
  const s=f.spot('inside',null,0,.345,.15,{part:p,maxH:.27,scale:.65,label:'세탁기 드럼'});
  pullOutTray(f,p,s,.37,{w:.23,d:.2,color:C.steel});
};

B.gpt_recordconsole = f => {
  f.add(mc('gpt_recordconsole',({add,tube})=>{
    feet(add,1.15,.54,.24);shell(add,1.15,.53,.54,.24,0,C.wood);
    box(add,.05,.42,.46,C.edge,-.12,.5,0,.01);
    for(const x of [-.38,.38]){
      box(add,.28,.34,.035,C.dark,x,.49,.26,.015);ring(add,.085,.012,C.edge,x,.49,.285);
      cyl(add,.066,.018,C.navy,x,.49,.287,HP);cyl(add,.025,.025,C.steel,x,.49,.3,HP);
    }
    for(let k=0;k<5;k++) book(add,-.06+k*.065,.3,-.03,[C.coral,C.yellow,C.sage,C.sky,C.lilac][k],.3,.045,.29);
    box(add,.83,.04,.42,C.edge,0,.79,0,.018);
    cyl(add,.18,.025,C.dark,-.15,.823,0);ring(add,.12,.006,C.steel,-.15,.838,0,HP);
    cyl(add,.04,.008,C.coral,-.15,.843,0);cyl(add,.025,.06,C.steel,.26,.84,-.12);
    tube([.26,.87,-.12],[.26,.87,.12],.012,C.steel);tube([.26,.87,.12],[.03,.87,.16],.012,C.steel);
    for(const x of [-.43,.43])box(add,.04,.12,.45,C.cream,x,.86,0,.015);
    box(add,.82,.12,.035,C.cream,0,.86,-.215,.012);
  }));
  const p=lid(f,'gpt_recordconsole',.9,.47,.92,0,C.cream);
  f.spot('inside',null,.22,.81,.08,{part:p,maxH:.2,scale:.65,label:'레코드 플레이어'});
};

B.gpt_aquarium = f => {
  f.add(mc('gpt_aquarium',({add,tube})=>{
    feet(add,.99,.57,.15);shell(add,.99,.67,.57,.15,0,C.wood);
    box(add,1.05,.1,.62,C.cream,0,.87,0,.035);box(add,.98,.07,.55,C.navy,0,.955,0,.025);
    box(add,.85,.035,.43,C.wood,0,1.01,0,.012);
    box(add,.91,.53,.035,C.sky,0,1.28,-.25,.012);
    for(const x of [-.48,.48]) box(add,.035,.59,.54,C.cream,x,1.27,0,.012);
    for(const y of [.99,1.56]) box(add,.99,.055,.55,C.cream,0,y,0,.018);
    for(let k=0;k<10;k++) ball(add,.033,[C.cream,C.yellow,C.coral][k%3],-.38+k*.083,1.045,.11*Math.sin(k),[1,.6,1]);
    for(const x of [-.31,.3]) for(let k=0;k<3;k++) {tube([x,1.04,-.1],[x+(k-1)*.06,1.35+k*.035,-.1],.018,C.leaf);ball(add,.04,C.sage,x+(k-1)*.05,1.29+k*.035,-.1,[.6,1.6,.45]);}
    for(const [x,y,c] of [[-.12,1.31,C.coral],[.22,1.4,C.yellow]]){
      ball(add,.09,c,x,y,.05,[1.3,.68,.45]);add(G.cone(.07,.11,3),c,x-.13,y,.05,0,0,-HP);ball(add,.012,C.dark,x+.075,y+.015,.09);
    }
    bottle(add,-.25,.22,0,C.sky,.8);box(add,.21,.3,.25,C.yellow,.2,.37,0,.025);
  }));
  const p=doubleDoor(f,'gpt_aquarium',.96,.61,.5,.32,C.sage);
  f.spot('inside',null,.2,.205,.1,{part:p,maxH:.35,scale:.75,label:'어항 받침장'});
};

B.gpt_bookcart = f => {
  f.add(mc('gpt_bookcart',({add,tube})=>{
    for(const x of [-.38,.38]) for(const z of [-.22,.22]) wheel(add,x,.095,z,.085);
    for(const x of [-.4,.4]) for(const z of [-.23,.23]) tube([x,.17,z],[x,1.02,z],.025,C.sage);
    for(const y of [.23,.61,.99]){
      shelf(add,.85,.5,y,0,C.cream);
      box(add,.86,.075,.025,C.sage,0,y+.012,.255,.008);
      for(let k=0;k<5;k++) book(add,-.31+k*.12,y,-.02,[C.coral,C.sky,C.yellow,C.lilac,C.sage][k],.26+(k%2)*.06,.08,.26);
    }
    tube([-.4,1.02,-.23],[-.4,1.15,-.23],.025,C.sage);tube([-.4,1.15,-.23],[-.4,1.15,.23],.025,C.sage);
  }));
  f.spot('on',null,.23,.99,.11,{maxH:.35,scale:.7,label:'이동 책수레 위'});
};

export const GPT_FURNITURE_BUILDERS = { ...B, ...GPT_FURNITURE_EXTRA_BUILDERS };
export const GPT_FURNITURE_INFO = {
  gpt_bicycle: info('바구니 자전거','park',2,1,false,'연결된 프레임·크랭크·체인·양쪽 페달·지지된 짐받이'),
  gpt_vending: info('과자와 음료 자판기','shop',1,1,true,'세 선반 12개 개별 상품·프레임 문·배출 트레이'),
  gpt_wardrobe: info('외출 준비 옷장','home',1,1,true,'옷걸이 옷과 접은 옷, 신발'),
  gpt_schoollocker: info('두 칸 학교 사물함','school',1,1,true,'책·체육복·실내화'),
  gpt_pantrycabinet: info('식료품 찬장','kitchen',1,1,true,'병·저장 유리병·식품 상자 세 단'),
  gpt_toychest: info('장난감 보물상자','home',1,1,true,'공·블록·고리가 든 두꺼운 상자'),
  gpt_travelcase: info('여행 캐리어','travel',1,1,true,'옷·신발·책과 짐 고정 끈'),
  gpt_mailbox: info('기둥 우편함','park',1,1,true,'내부 편지·깃발·투입구'),
  gpt_shoecabinet: info('루버 신발장','home',1,1,true,'세 선반의 여섯 켤레 신발'),
  gpt_picnicbasket: info('점심 피크닉 바구니','park',1,1,true,'병·빵·천과 짜임 벽'),
  gpt_washer: info('빨래 드럼 세탁기','home',1,1,true,'실제 원통 드럼·빨래·문틀'),
  gpt_recordconsole: info('레코드 수납장','hobby',2,1,true,'음반과 스피커·회전판·톤암'),
  gpt_aquarium: info('열대어 어항장','home',1,1,true,'자갈·수초·물고기와 청소용품장'),
  gpt_bookcart: info('도서관 책수레','school',1,1,false,'세 단 책장·밀대·바퀴'),
  ...GPT_FURNITURE_EXTRA_INFO,
};
