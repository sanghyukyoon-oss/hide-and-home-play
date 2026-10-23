// 28판 두 량 객차 (GPT 작업장 gpt-station gpttraincar2-props.js + gpttraincar2-motion.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로,
// 칸 이름 글자는 우리 fitText로. 창밖이 흐르는 건 작업장 런타임 대신 선로 조각의 f.idle이 맵 안의 창을 함께 돌림 — 엔진 수정 없음).
// Two-car train: measured passenger seats, a coral dining bay and rail-only scrolling windows.
// Shared builder keys and all working drawers, lids and connecting doors are preserved.
import * as THREE from 'three';
import { grp, put, mesh, mat, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { GPTST_CAR1_BUILDERS as V1 } from './gptst-traincar1.js';
import { sign } from './gptst-kit.js';

const B = {}, PI = Math.PI, HP = PI / 2;
// Evening look match: natural wood, neutral walls, clear mint/sky/coral/pink paint.
const C = { teal: '#50b99c', tealD: '#318fa3', mint: '#6bc7b0', blue: '#63aeda', blueD: '#3f8db1', pink: '#e575a3',
  pale: '#e9f0ed', cream: '#fbf7f0', maple: '#bc9168', woodD: '#6f4b30', silver: '#c8d8db', dark: '#644936',
  ochre: '#f8b15b', coral: '#ee7b72', white: '#fbf7f0', floor: '#d1ae90', window: '#9dcde8' };
const labels = texCache();
// V2 uses the approved v1 shapes/materials/mechanisms at the game's measured furniture scale.
// Never resize the shared geometry: only these new-key instances receive a transform.
B.gpt_tc2_bench = (f, T, o = {}) => {
  V1.gpt_tc_bench(f, T, o); f.group.scale.y = .76; f.v1Builder = 'gpt_tc_bench';
  f.scaleReference = { seatTop: .775 * .76, originalSeatTop: .775 };
};
B.gpt_tc2_cart = (f, T, o = {}) => {
  V1.gpt_tc_cart(f, T, o); f.group.scale.setScalar(.94); f.v1Builder = 'gpt_tc_cart';
  f.scaleReference = { counterTop: .9925 * .94, originalCounterTop: .9925 };
};
const plate = (f, text, w, h, x, y, z, bg = C.cream, fg = C.tealD) => sign(f.group, text, w, h, x, y, z, bg, fg);

// A warm coral dining bay, visibly different from the first car's longitudinal teal seats.
B.gpt_tc2_diningbooth=f=>{
  // Train seats are .58m; the separate pedestal keeps the table at .80m.
  const seatLift=.13, tableLift=.08;
  f.add(mc('gpt-tc2-dining-bay-fix1022',({add,tube})=>{
    for(const side of [-1,1]){
      add(G.box(1.46,.12,.57,.045),C.maple,0,.30+seatLift,side*.82);
      add(G.box(1.40,.18,.59,.075),C.coral,0,.36+seatLift,side*.82);
      add(G.box(1.43,.50,.16,.065),C.pink,0,.61+seatLift,side*1.08);
      add(G.box(1.45,.055,.18,.022),C.maple,0,.90+seatLift,side*1.08);
      for(const x of [-.59,.59])add(G.box(.09,.41,.43,.02),C.woodD,x,.205,side*.82);
      for(const x of [-.4,0,.4])add(G.box(.025,.31,.025,.006),C.cream,x,.64+seatLift,side*.985);
    }
    add(G.cyl(.075,.10,.72,10),C.tealD,0,.36,0);
    add(G.cyl(.33,.36,.055,16),C.woodD,0,.035,0);
    add(G.box(1.30,.075,.72,.09),C.maple,0,.6625+tableLift,0);
    add(G.box(1.20,.018,.62,.065),C.cream,0,.708+tableLift,0);
    for(const x of [-.38,.38]){
      add(G.cyl(.115,.115,.023,16),C.white,x,.735+tableLift,0);
      add(G.box(.15,.10,.11,.035),C.ochre,x,.797+tableLift,0,0,x);
      add(G.cyl(.07,.055,.12,12),C.teal,x,.777+tableLift,.19);
      add(G.tor(.04,.014,PI*1.7,5,12),C.teal,x+.068,.81+tableLift,.19,0,HP);
    }
    add(G.cyl(.055,.07,.17,12),C.coral,0,.80+tableLift,-.20);
    tube([0,.87+tableLift,-.20],[0,1.02+tableLift,-.20],.018,C.teal);
    for(const x of [-.05,.05])add(G.sph(.055,8,6),C.cream,x,1.02+tableLift,-.20);
  }));
  f.spot('on',null,.2,.80,0,{maxH:.3,label:'식당차 테이블 위'});
  f.scaleReference={seatTop:.58,tableTop:.797};
};
B.gpt_tc2_snackcounter=f=>{
  // Raise the service surface and its contents together; cups/bread retain real object sizes.
  const lift=.17;
  f.add(mc('gpt-tc2-snack-counter-fix1022',({add,tube})=>{
    add(G.box(1.75,.075,.73,.03),C.maple,0,.08,0);
    add(G.box(1.75,.75,.06,.025),C.blue,0,.475,-.34);
    for(const x of [-.84,.13,.84])add(G.box(.07,.75,.70,.025),C.maple,x,.475,0);
    add(G.box(1.82,.075,.80,.045),C.maple,0,.7025+lift,0);
    add(G.box(1.70,.018,.70,.035),C.cream,0,.749+lift,0);
    add(G.box(.85,.04,.60,.02),C.maple,-.35,.79+lift,-.02);
    for(const x of [-.64,-.35,-.06])for(const z of [-.16,.10]){
      add(G.cyl(.09,.08,.09,10),C.ochre,x,.85+lift,z);
      add(G.sph(.095,10,6),C.cream,x,.91+lift,z,0,0,0,[1,.55,1]);
    }
    add(G.cyl(.14,.15,.025,14),C.woodD,.51,.7705+lift,-.06);
    add(G.cyl(.17,.17,.39,14),C.silver,.51,.975+lift,-.06);
    add(G.cyl(.19,.19,.055,14),C.tealD,.51,1.18+lift,-.06);
    add(G.cyl(.045,.045,.06,10),C.maple,.51,1.23+lift,-.06);
    tube([.51,.87+lift,.08],[.51,.87+lift,.20],.028,C.tealD);
    for(const x of [.32,.61])add(G.cyl(.065,.055,.13,12),C.coral,x,.825+lift,.25);
    for(const x of [-.55,-.25,.05]){
      add(G.box(.18,.20,.15,.02),C.cream,x,.22,-.10);
      add(G.box(.12,.04,.025,.006),C.coral,x,.24,-.015);
    }
  }));
  const drawer=grp();put(drawer,-.36,.39+lift,.34);f.add(drawer);
  drawer.add(mc('gpt-tc2-snack-drawer-fix1022',({add})=>{
    add(G.box(.87,.44,.055,.025),C.pink,0,0,0);
    add(G.box(.82,.035,.59,.01),C.maple,0,-.20,-.27);
    for(const x of [-.4,.4])add(G.box(.035,.36,.59,.01),C.cream,x,-.02,-.27);
    add(G.box(.82,.36,.035,.01),C.cream,0,-.02,-.55);
    add(G.box(.22,.05,.065,.018),C.blueD,0,.04,.055);
    add(G.box(.30,.10,.25,.02),C.cream,0,-.13,-.25);
  }));
  const p=f.part('drawer',drawer,(t,b)=>{drawer.position.z=b.p.z+.38*t;},{label:'간식차 수납 서랍',sfx:'drawer',dur:.3});
  f.spot('inside',drawer,0,-.14,-.27,{part:p,maxH:.22,label:'간식차 실제 수납칸'});
  plate(f,'간식 · 차',.66,.17,-.36,.62,.383,C.cream,C.tealD);
  f.scaleReference={counterTop:.928};
};

B.gpt_tc2_shell = (f, T, o = {}) => {
  const inner = o.innerEnd === -1 ? -1 : 1;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  // (① 10/22 보행: our walk grid keeps a body .26 m clear of the next room's pieces box by box — the gangway room's tiles start
  // .25 m past the car's end, so the chassis, its end rails and the coupler end within 3.47 m of the car's middle (were 3.52–3.62))
  f.add(mc('gpt-tc2-shell-v1|' + inner + '|walk', ({ add, tube }) => {
    // Native Room's 5×7 planks sit on this thick, softly edged chassis.
    // The exact 7m end faces leave the physical 1.6m gap between the two cars.
    add(G.box(5.38, .53, 6.94, .15), C.tealD, 0, -.275, 0);
    add(G.box(5.46, .12, 6.94, .055), C.maple, 0, -.08, 0);
    add(G.box(5.42, .075, 6.94, .03), C.cream, 0, -.185, 0);
    add(G.box(.16, .34, 6.95, .055), C.cream, 2.62, .14, 0);
    add(G.box(.178, .08, 6.94, .025), C.maple, 2.62, .35, 0);
    add(G.box(.175, .1, 6.92, .025), C.teal, 2.63, .11, 0);
    // Inner cut-end rail is in two chunks: the 1.6m centre is an actual open floor passage.
    for (const s of [-1, 1]) {
      add(G.box(1.81, .28, .17, .05), C.cream, s * 1.72, .11, inner * 3.37);
      add(G.box(1.81, .07, .195, .025), C.maple, s * 1.72, .285, inner * 3.37);
    }
    // Keep the familiar low outer cut edge at the visible S end of the second carriage.
    if (inner === -1) {
      add(G.box(5.26, .28, .17, .05), C.cream, 0, .11, 3.42);
      add(G.box(5.32, .07, .195, .025), C.maple, 0, .285, 3.42);
    }
    for (const z of [-2.15, 2.15]) {
      add(G.box(4.8, .22, 1.18, .04), C.dark, 0, -.67, z);
      for (const dx of [-.8, .8]) add(G.box(.72, .17, .85, .04), '#a09769', dx, -.59, z);
      // Connected springs / axle housing: only the actual circular wheels rotate below.
      for (const x of [-1.76, 1.76]) {
        add(G.box(.65, .1, .69, .025), C.silver, x, -.72, z);
        for (const dz of [-.21, .21]) add(G.cyl(.067, .067, .12, 8), C.woodD, x, -.67, z + dz);
      }
    }
    // The original rolled-back roof lip remains narrow so it never covers the seats / centre aisle.
    for (const z of [-3.38, 3.38]) {
      add(G.box(.2, 2.98, .18, .04), C.teal, -2.61, 1.47, z);
      for (let k = 0; k < 6; k++) {
        const a = k / 5 * HP;
        add(G.box(.22, .16, .2, .035), C.cream, -2.55 + .45 * (1 - Math.cos(a)), 2.95 + .45 * Math.sin(a), z, 0, 0, -a);
      }
    }
    add(G.box(.62, .14, 6.92, .05), C.teal, -2.3, 3.31, 0);
    add(G.box(.12, .08, 6.85, .02), C.maple, -2.02, 3.25, 0);
    // Two warm painted lights are firmly bracketed to the retained eave, with no bloom.
    for (const z of [-2.25, 2.25]) {
      tube([-2.11, 3.22, z], [-1.86, 3.04, z], .025, C.silver);
      add(G.box(.22, .065, .48, .025), C.maple, -1.85, 3.01, z);
      add(G.box(.17, .025, .4, .012), '#ffefd0', -1.85, 2.962, z);
    }
    add(G.box(.035, .17, .48, .025), C.tealD, 2.722, -.34, 1.25);
    for (let k = 0; k < 3; k++) add(G.box(.04, .065, .045, .006), C.cream, 2.746, -.34, 1.12 + k * .12);
    // Underside cable and little coupler join the actual connector chassis rather than stopping in the air.
    tube([-.34, -.45, inner * 3.12], [-.34, -.45, inner * 3.42], .035, C.dark);
    add(G.box(.52, .16, .15, .035), C.silver, 0, -.4, inner * 3.39);
  }));
  const wheels = [];
  for (const x of [-2.08, 2.08]) for (const bz of [-2.15, 2.15]) for (const dz of [-.32, .32]) {
    const wheel = grp(); put(wheel, x, -.83, bz + dz); f.add(wheel); wheels.push(wheel);
    wheel.add(mc('gpt-tc2-wheel-v1|' + Math.sign(x), ({ add }) => {
      add(G.cyl(.285, .285, .17, 18), '#644936', 0, 0, 0, 0, 0, HP);
      add(G.cyl(.12, .12, .185, 12), C.silver, 0, 0, 0, 0, 0, HP);
      // Three quiet spokes make rotation visible even on a small screen.
      for (let k = 0; k < 3; k++) add(G.box(.018, .38, .035, .007), '#84ae9d', Math.sign(x) * .096, 0, 0, k * PI / 3);
      add(G.cyl(.045, .045, .205, 10), C.maple, 0, 0, 0, 0, 0, HP);
    }));
  }
  f.live = wheels; f.wheels = wheels; f.wheelSpeed = o.wheelSpeed ?? 6.3;
  f.tick = t => { for (const wheel of wheels) wheel.rotation.x = -t * f.wheelSpeed; };
};

// Open-sided accordion connector. The passage is real floor, with no back wall across it.
// Each end has its own pair of sliding leaves; at full open the centre clears 1.6m.
B.gpt_tc2_gangway = f => {
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('gpt-tc2-gangway-v1|walk', ({ add, tube }) => {
    add(G.box(1.75, .23, 1.56, .05), C.tealD, 0, -.19, 0);
    add(G.box(1.6, .055, 1.54, .015), C.floor, 0, -.018, 0);
    // Transverse overlapping tread plates connect the wooden floors flush at both thresholds.
    for (let z = -.68; z <= .69; z += .17) {
      add(G.pbox(1.55, .014, .145), z < 0 ? '#f6e0bf' : '#eecfa3', 0, .019, z);
      add(G.box(1.45, .009, .018, .004), C.silver, 0, .032, z + .05);
    }
    for (const s of [-1, 1]) {
      // (① 10/22 보행: the frame and threshold .07 m nearer the middle — the cars' last rows of walking tiles are .25 m past the
      // room's ends, and our walk grid takes this whole piece's box; the bulkhead wings are gpt_tc2_gangwing, in the cars' rooms)
      const z = s * .71;
      for (const x of [-.85, .85]) add(G.box(.1, 2.2, .13, .025), C.maple, x, 1.1, z);
      add(G.box(1.8, .12, .13, .025), C.maple, 0, 2.23, z);
      add(G.box(1.68, .025, .1, .009), C.silver, 0, .009, s * .725);
      add(G.box(1.6, .012, .04, .004), C.ochre, 0, .029, s * .755);
    }
    // Retain the far accordion wall and a low near return for a cutaway view into the corridor.
    add(G.box(.11, 2.12, 1.31, .025), '#f6e0bf', -.91, 1.06, 0);
    add(G.box(.11, .46, 1.31, .025), '#f6e0bf', .91, .23, 0);
    for (let z = -.62; z <= .63; z += .155) {
      add(G.box(.14, 2.13, .065, .018), '#a2c8bb', -.94, 1.065, z);
      add(G.box(.14, .48, .065, .018), '#a2c8bb', .94, .24, z);
    }
    add(G.box(.24, .1, 1.4, .025), C.cream, -.88, 2.18, 0);
    // Handrails have end brackets, rounded grips and a continuous route across the bellows.
    for (const x of [-.79, .79]) {
      tube([x, .95, -.61], [x, .95, .61], .029, C.maple, 8);
      for (const z of [-.61, .61]) {
        tube([x, .95, z], [x + Math.sign(x) * .1, .95, z], .023, C.silver);
        add(G.box(.04, .12, .09, .012), C.silver, x + Math.sign(x) * .12, .95, z);
      }
    }
    // Flexible coupling and safety cables below the walkway, connected at both car ends.
    add(G.box(.4, .17, 1.54, .025), C.silver, 0, -.4, 0);
    tube([-.34, -.45, -.74], [-.34, -.54, 0], .033, C.dark);
    tube([-.34, -.54, 0], [-.34, -.45, .74], .033, C.dark);
  }));
  const doors = [];
  for (const [i, end] of [-1, 1].entries()) {
    const leaves = [-1, 1].map(s => {
      const leaf = grp(); put(leaf, s * .385, .035, end * .69); f.add(leaf);
      leaf.add(mc('gpt-tc2-connector-leaf-v1|' + s + '|' + end, ({ add }) => {
        add(G.box(.755, 2.085, .055, .025), C.mint, 0, 1.055, 0);
        for (const face of [-1, 1]) {
          add(G.box(.49, .72, .018, .045), C.cream, 0, 1.48, face * .037);
          add(G.box(.41, .62, .018, .035), '#b0e5e8', 0, 1.48, face * .058);
          add(G.box(.029, .27, .032, .009), C.silver, -s * .265, .91, face * .055);
          add(G.box(.13, .045, .018, .006), C.cream, 0, .65, face * .04);
        }
      })); return leaf;
    });
    const p = f.part('door', leaves, (t, a, b) => { leaves[0].position.x = a.p.x - .80 * t; leaves[1].position.x = b.p.x + .80 * t; },
      { label: `${i + 1}호차 연결문`, sfx: 'slide', dur: .4 });
    p.gptTraincar2Door = true; p.lockable = false; doors.push(p);
  }
  f.gangwayDoors = doors; f.passWidth = 1.6;
  f.setGangwayOpen = t => { for (const p of doors) { p.reach = 1; p.setOpen(t); } };
};

// (① 10/22) the gangway's bulkhead wings at one car's end, as their own piece in that car's room: o.end -1 = the first car's end
// (the gangway's north side), 1 = the second's. The workshop's shapes, set .08 m further from the corridor than it had them, so
// this piece's box stays .26 m clear of the gangway room's walking tiles; its walls block walking by their own boxes (the doorway
// between them stays open).
B.gpt_tc2_gangwing = (f, T, o = {}) => {
  const s = o.end === 1 ? 1 : -1, z0 = s * .08;
  f.noSolid = true; f.collideBox = [-2.51, 0, z0 - .06, 2.55, 2.68, z0 + .06];
  f.walkBoxes = [[-2.51, 0, z0 - .08, -.89, 2.68, z0 + .08], [.89, 0, z0 - .08, 2.55, .46, z0 + .08]];
  f.add(mc('gpt-tc2-gangwing|' + s, ({ add }) => {
    add(G.box(1.62, 2.68, .12, .035), C.cream, -1.7, 1.34, z0);
    add(G.box(1.66, .4, .12, .035), C.cream, 1.72, .2, z0);
    add(G.box(1.68, .06, .16, .025), C.maple, 1.72, .43, z0);
    add(G.box(1.63, .08, .07, .018), C.maple, -1.7, .86, z0 - s * .08);
    add(G.box(.28, .32, .07, .022), C.cream, -1.18, 1.45, z0 - s * .085);
    add(G.box(.18, .045, .018, .006), C.teal, -1.18, 1.47, z0 - s * .135);
  }));
  // The sign is on the retained far bulkhead, away from the usable doorway.
  plate(f, s === 1 ? '식당칸' : '객실칸', .65, .19, -1.7, 2.36, z0 + .068);
};

// Reuse the window frame, then replace its scenic face with rails and sleepers only.
// Each new texture has independent repeat/offset state; the original window cache is untouched.
function railWindowTexture() {
  return labels.get('gpt-tc2-window-rails-fix1022', () => canvasTex(512, 320, (c, W, H) => {
    // A plain warm backdrop is blank space, with no landscape/ground/horizon painted behind it.
    c.fillStyle=C.window; c.fillRect(0,0,W,H);
    c.fillStyle=C.woodD;
    for(let x=-48;x<W+48;x+=64){
      c.beginPath(); c.moveTo(x, H*.37); c.lineTo(x+20,H*.37);
      c.lineTo(x+72,H*.88); c.lineTo(x+39,H*.88); c.closePath(); c.fill();
    }
    for(const y of [H*.47,H*.72]){
      c.fillStyle=C.woodD; c.fillRect(0,y,W,13);
      c.fillStyle=C.silver; c.fillRect(0,y+2,W,5);
    }
  }));
}

B.gpt_tc2_window = (f, T, o = {}) => {
  V1.gpt_tc_window(f, T, o);
  let view = null;
  f.group.traverse(object => { if (object.isMesh && object.geometry.type === 'PlaneGeometry' && object.material?.map) view = object; });
  if (!view) throw new Error('gpt_tc2_window: v1 scenic face not found');
  view.material = view.material.clone();
  const tex = railWindowTexture().clone(); tex.wrapS = THREE.RepeatWrapping; tex.needsUpdate = true;
  view.material.map = tex; view.material.needsUpdate = true; view.userData.noMerge = true;
  f.live = [view]; f.windowView = view; f.windowTexture = tex; f.railOnlyWindow = true;
  // The landscape controller owns the shared scenery clock. Leave a per-window phase hint without
  // another tick writing offsets onto the controller's shared texture.
  f.windowPhase = o.phase ?? (o.view || 0) * .19;
  // (① 10/22: the runtime's start state, and the mark the rails piece finds each window by — gpt_tc2_landscape's idle moves them all)
  tex.repeat.x = .95; tex.offset.x = f.windowPhase; view.userData.gptstFlow = f.windowPhase;
};

// Rail-only motion: one fixed pool of sleepers. No exterior scenery or per-frame allocations.
const wrap=(z,span)=>((z+span/2)%span+span)%span-span/2;
B.gpt_tc2_landscape=f=>{
  f.noSolid=true;f.collideBox=[0,-3,0,0,-2,0];
  f.add(mc('gpt-tc2-rails-only-v2',({add})=>{
    for(const x of [-2.08,2.08]){
      add(G.box(.18,.12,20,.022),'#a09769',x,-1.18,0);
      add(G.box(.28,.035,20,.01),'#e8d7b7',x,-1.104,0);
    }
  }));
  const sleepers=new THREE.InstancedMesh(G.box(4.9,.095,.22,.025),mat('#6f4b30'),36);
  sleepers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sleepers.castShadow=false;sleepers.receiveShadow=true;f.add(sleepers);f.live=[sleepers];
  const matrix=new THREE.Matrix4();f.motion={time:0,near:0,mid:0,far:0,sky:0,windowOffset:0,paused:false,speed:8.1};
  let last=null;
  f.tick=t=>{
    const dt=last==null?0:Math.max(0,Math.min(.25,t-last));last=t;if(!f.motion.paused)f.motion.time+=dt;
    f.motion.near=f.motion.time*8.1;f.motion.windowOffset=-f.motion.time*.95;
    for(let i=0;i<sleepers.count;i++){matrix.makeTranslation(0,-1.3,wrap(-10+i*20/sleepers.count+f.motion.near,20));sleepers.setMatrixAt(i,matrix);}sleepers.instanceMatrix.needsUpdate=true;
  };
  f.nearInstances=sleepers;f.layers={mid:[],far:[],clouds:[]};f.tick(0);
  // (① 10/22 — what the workshop's runtime did each frame, here in our room's idle: the rails piece stands in the gangway room under
  // the middle of the train; it hides the map's generic cake slab, which would cover the bogies and the gap between the cars, and
  // slides every rail window of the map with the same clock)
  f.noOccupied=true;
  let wins=null;
  f.idle=t=>{
    f.tick(t);
    const map=f.group.parent?.parent; if(!map)return;
    if(!wins){
      for(const c of map.children)if(c.isMesh&&c.userData.og)c.visible=false;
      const found=[];map.traverse(o=>{if(o.isMesh&&o.userData.gptstFlow!=null&&o.material?.map)found.push(o);});
      if(found.length)wins=found;
    }
    if(wins)for(const w of wins)w.material.map.offset.x=f.motion.windowOffset+w.userData.gptstFlow;
  };
};

export const GPTST_CAR2_BUILDERS = B;
export const GPTST_CAR2_INFO = {
  gpt_tc2_diningbooth:{w:1.6,d:2.4,name:'산호색 마주보기 식당 좌석과 .80m 테이블',hidden:true},
  gpt_tc2_snackcounter:{w:2,d:1,name:'빵과 따뜻한 차가 있는 간식차 카운터',hidden:true},
  gpt_tc2_bench: { w: 2, d: 1, name: '서랍이 있는 .589m 좌면 기차 좌석', hidden: true },
  gpt_tc2_cart: { w: 1, d: 1, name: '.933m 상판과 열리는 뚜껑이 있는 간식 카트', hidden: true },
  gpt_tc2_shell: { w: 5, d: 7, name: '바퀴가 도는 봄빛 열차 차체', hidden: true },
  gpt_tc2_gangway: { w: 1.6, d: 1.6, name: '두 칸을 잇는 실제 주름 연결 통로', hidden: true },
  gpt_tc2_gangwing: { w: 5, d: 1, name: '연결 통로 양옆 칸 끝 벽', hidden: true },
  gpt_tc2_window: { wall: true, span: 2, name: '선로와 침목만 빠르게 흐르는 기차 창', hidden: true },
  gpt_tc2_landscape: { w: 1, d: 1, name: '빠르게 흐르는 선로와 침목만', hidden: true },
};
