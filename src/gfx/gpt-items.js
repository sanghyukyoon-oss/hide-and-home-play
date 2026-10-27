// GPT's findable prop collection. Standalone geometry, the game's shared material
// pipeline, and no image maps. The normalizer gives every model a phone-sized
// silhouette, a bottom-centre origin and an exact measured height.
import * as THREE from 'three';
import { rbox, sph, cyl, tor, cone, put, grp, mesh, mat, geo, extrude, starShape } from './kit.js';

const C = { ink: '#4a3528', cream: '#fdf6da', white: '#fefde9', mint: '#8dc6b5', teal: '#428aa1', blue: '#5791be', navy: '#29575f', peach: '#efa165', red: '#e8604c', yellow: '#feb53d', wood: '#c67f2a', brown: '#845129', green: '#59924c', grey: '#a7a595', silver: '#e8d7b7' };
const box = (w, h, d, c = C.cream, r = .025) => rbox(w, h, d, c, r);
const ball = (r, c = C.cream, s = null) => { const b = sph(r, c, null, 14, 10); if (s) b.scale.set(...s); return b; };
const ring = (r, t, c = C.cream, arc = Math.PI * 2) => tor(r, t, c, null, arc, 6, Math.max(12, Math.round(24 * arc / (Math.PI * 2))));
const cylinder = (rt, rb, h, c = C.cream, seg = 18) => cyl(rt, rb, h, c, null, seg);
function rod(a, b, r, c) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av);
  const m = cylinder(r, r, v.length(), c, 10);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  m.position.copy(av.add(bv).multiplyScalar(.5)); return m;
}
function tube(key, pts, r, color, closed = false) {
  const g = geo(`gpt-tube-${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed), Math.max(12, pts.length * 4), r, 6, closed));
  return mesh(g, mat(color));
}
function polygon(key, points, depth, color) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  return extrude(`gpt-${key}`, shape, depth, color);
}
function oval(g, x, y, z, rx, ry, rz, color, radius = .1) { g.add(put(ball(radius, color, [rx, ry, rz]), x, y, z)); }
function detail(g, w, h, x, y, z, c, r = .005) { g.add(put(box(w, h, .009, c, r), x, y, z)); }
function stripe(g, x, y, z, w, d, c) { g.add(put(box(w, .009, d, c, .003), x, y, z)); }
const STAGES = {
  home: ['15 원룸', '18 다락방', '26 인형집'], kitchen: ['주방', '35 빵집', '카페'],
  school: ['학교', '책상', '서재'], travel: ['역', '공항', '캠핑카'],
  seaside: ['30 바닷가', '항구', '여름 가게'], park: ['놀이터', '뒷산', '피크닉'],
  shop: ['편의점', '잡화점', '카페'], hobby: ['취미방', '다락방', '작업실']
};
function item(name, theme, make, width = .6, opts = {}) {
  let dimensions;
  function build() {
    const g = grp(), body = make(); body.updateMatrixWorld(true);
    // precise=true measures the actual vertices. A rotated partial torus's local
    // AABB otherwise makes a U pillow look .61 wide although its mesh is only .43.
    const bounds = new THREE.Box3().setFromObject(body, true), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const s = width / Math.max(size.x, size.z);
    body.scale.multiplyScalar(s); body.position.set(-center.x * s, -bounds.min.y * s, -center.z * s); g.add(body);
    dimensions = { h: size.y * s, width: size.x * s, depth: size.z * s };
    g.name = name; g.userData.gptTheme = theme; g.userData.gptDimensions = { ...dimensions }; return g;
  }
  return { name, theme, stages: STAGES[theme], ...opts, build,
    get h() { if (!dimensions) build(); return dimensions.h; },
    get size() { if (!dimensions) build(); return { ...dimensions }; }
  };
}

export const GPT_ITEMS = {
  // TASK remakes: oden/earphones here, coin purse/USB/receipt below.
  // The other sixty entries depict new objects, not recolours.
  gpt_oden: item('접힌 어묵 꼬치', 'kitchen', () => {
    const g = grp();
    // A broad folded sheet threaded through a visible bamboo skewer. Three
    // alternating rounded folds read as fishcake from the elevated camera.
    g.add(put(cylinder(.013, .013, .67, '#c67f2a', 10), 0, .018, 0, 0, 0, Math.PI / 2));
    const folds = grp();
    for (let i = 0; i < 4; i++) {
      folds.add(put(box(.095, .11, .26, i % 2 ? '#f8b15b' : '#f4d28d', .024), -.185 + i * .115, .077, 0, 0, 0, i % 2 ? -.23 : .23));
      // Recess the curved joins from both cut ends. Equal .26 depths would
      // leave their caps coplanar with the sheet ends before the game's bake.
      if (i < 3) folds.add(put(cylinder(.056, .056, .232, '#e79738', 12), -.13 + i * .115, .075, 0, Math.PI / 2));
    }
    g.add(folds); g.add(put(cone(.018, .06, '#e79738', null, 10), .355, .018, 0, 0, 0, -Math.PI / 2));
    return g;
  }, .66, { remakeOf: 'fishcake', flat: true }),
  gpt_earphones: item('열린 무선 이어폰', 'home', () => {
    const g = grp(), shell = '#fdf6da';
    g.add(put(box(.46, .105, .29, shell, .05), 0, .053, .02));
    g.add(put(box(.40, .028, .235, '#a7a595', .035), 0, .109, .02));
    // Both shaped wells and both earbuds sit visibly inside the case.
    for (const x of [-.105, .105]) {
      oval(g, x, .128, .00, .78, .24, 1.12, '#29575f', .085);
      g.add(put(box(.054, .018, .14, '#29575f', .018), x, .131, .066));
      oval(g, x, .197, -.022, .82, .55, .90, shell, .074);
      g.add(put(box(.045, .041, .13, shell, .018), x, .169, .063));
      oval(g, x + .015, .202, .047, .5, .55, .12, C.ink, .024);
      stripe(g, x, .235, -.032, .027, .015, C.ink);
      stripe(g, x, .192, .118, .034, .013, '#a7a595');
    }
    const lid = grp();
    lid.add(put(box(.46, .24, .047, shell, .036), 0, .119, 0));
    lid.add(put(box(.395, .185, .014, '#feebc8', .027), 0, .12, .025));
    lid.position.set(0, .105, -.125); lid.rotation.x = -.20; g.add(lid);
    g.add(put(ball(.008, '#77b490'), 0, .054, .167));
    g.add(put(box(.065, .01, .008, '#969075', .003), 0, .022, .17)); return g;
  }, .60, { remakeOf: 'earphones' }),

  // (⑪ 10/24 아트 점검 — 사용자 "디테일 떨어지는 아이템": the shell was the sole's outline pushed up, a mint slab that read as a
  // lump. Now a steam iron: a pointed silver sole with steam holes, a body that rises to the back and narrows to the nose, a
  // see-through water tank at the nose, the closed handle loop with its steam and spray buttons, the heat dial, a heel to
  // stand on and a coiled cord out of the back)
  gpt_iron: item('다리미', 'home', () => {
    const g = grp();
    const sole = [[-.22, -.12], [.12, -.12], [.3, 0], [.12, .12], [-.22, .12]];
    g.add(put(polygon('iron2-sole', sole, .03, C.silver), 0, .02, 0, -Math.PI / 2));
    for (const [x, z] of [[.15, 0], [.08, -.05], [.08, .05], [0, 0], [-.08, -.05], [-.08, .05]]) g.add(put(cylinder(.008, .008, .004, '#7d8790', 8), x, .001, z));
    g.add(put(polygon('iron2-skirt', sole.map(([x, y]) => [x * .96, y * .9]), .03, C.navy), 0, .05, 0, -Math.PI / 2));
    const body = [[-.2, -.105], [.05, -.1], [.22, 0], [.05, .1], [-.2, .105]];
    g.add(put(polygon('iron2-body', body, .07, C.mint), 0, .097, 0, -Math.PI / 2));
    g.add(put(ball(.1, C.mint, [1.05, .55, .95]), -.1, .13, 0));
    g.add(put(polygon('iron2-tank', [[.02, -.075], [.14, -.04], [.19, 0], [.14, .04], [.02, .075]], .05, '#bfe6f2'), .02, .123, 0, -Math.PI / 2));
    g.add(put(box(.07, .02, .1, '#9fd4ea', .01), .1, .118, 0));
    g.add(tube('iron2-handle', [[-.2, .15, 0], [-.18, .26, 0], [-.02, .29, 0], [.1, .26, 0], [.13, .17, 0]], .028, C.cream));
    g.add(put(cylinder(.016, .016, .02, C.red, 12), .07, .286, 0));
    g.add(put(cylinder(.013, .013, .02, C.blue, 12), .02, .296, 0));
    g.add(put(cylinder(.04, .04, .02, C.cream, 18), -.07, .19, .0, 0, 0, 0));
    g.add(put(cylinder(.03, .03, .012, C.peach, 16), -.07, .204, 0));
    g.add(put(box(.012, .008, .03, C.ink, .003), -.07, .212, .01));
    g.add(put(box(.03, .1, .16, C.navy, .015), -.235, .07, 0));
    g.add(tube('iron2-cord', [[-.25, .06, 0], [-.31, .05, .02], [-.33, .03, .11], [-.27, .015, .2], [-.17, .015, .23], [-.07, .015, .2]], .011, C.ink));
    g.add(put(box(.045, .027, .06, C.ink, .007), -.05, .016, .2, 0, .6, 0)); return g;
  }),
  gpt_hotwaterbottle: item('뜨거운 물주머니', 'home', () => {
    const g = grp();
    g.add(put(box(.32,.065,.40,C.red,.045),0,.035,0));
    g.add(put(box(.105,.06,.10,C.red,.02),0,.035,-.235));
    g.add(put(cylinder(.042,.042,.05,C.cream,14),0,.035,-.30,Math.PI/2));
    for (let i=-2;i<=2;i++) g.add(put(box(.012,.008,.28,'#f2917d',.003),i*.052,.071,.012));
    g.add(put(ring(.065,.009,C.cream),0,.076,.025,Math.PI/2)); return g;
  }, .60, { flat: true }),
  gpt_cleaner: item('분무 세제', 'home', () => {
    const g=grp();
    g.add(put(box(.25,.31,.17,C.blue,.045),0,.155,0));
    g.add(put(cylinder(.055,.08,.07,C.blue,14),0,.34,0));
    g.add(put(box(.22,.06,.09,C.cream,.018),.04,.40,0));
    g.add(put(box(.06,.037,.077,C.red,.012),.17,.397,0));
    g.add(put(box(.027,.105,.03,C.cream,.01),.095,.337,.005,0,0,-.35));
    detail(g,.17,.14,0,.16,.09,C.cream,.018);
    g.add(put(ball(.035,C.mint,[.55,1,.18]),0,.17,.103));
    detail(g,.09,.012,0,.105,.104,C.blue); return g;
  }, .54),
  gpt_alarmclock: item('쌍종 알람시계', 'home', () => {
    const g=grp();
    g.add(put(cylinder(.18,.18,.11,C.red,24),0,.22,0,Math.PI/2));
    g.add(put(cylinder(.15,.15,.012,C.cream,24),0,.22,.064,Math.PI/2));
    for(let i=0;i<12;i++){ const a=i*Math.PI/6; g.add(put(box(.012,.028,.008,C.ink,.002),Math.sin(a)*.125,.22+Math.cos(a)*.125,.074,0,0,-a)); }
    g.add(rod([0,.22,.083],[-.055,.29,.083],.009,C.ink)); g.add(rod([0,.22,.086],[.078,.22,.086],.009,C.ink));
    g.add(put(ball(.018,C.yellow),0,.22,.09));
    for(const s of [-1,1]){
      g.add(rod([s*.105,.08,0],[s*.14,.02,0],.02,C.ink));
      g.add(rod([s*.095,.36,0],[s*.13,.4,0],.012,C.silver));
      oval(g,s*.14,.415,0,1,.5,.7,C.yellow,.075);
    }
    g.add(rod([0,.39,0],[0,.46,0],.01,C.ink)); g.add(put(box(.065,.015,.025,C.ink,.006),0,.466,0)); return g;
  }, .60),
  gpt_hairdryer: item('헤어 드라이어', 'home', () => {
    const g=grp();
    g.add(put(cylinder(.10,.125,.30,C.peach,18),0,.23,0,0,0,Math.PI/2));
    g.add(put(cylinder(.074,.09,.08,C.ink,18),.19,.23,0,0,0,Math.PI/2));
    g.add(put(cylinder(.102,.102,.012,C.brown,16),-.157,.23,0,0,0,Math.PI/2));
    for(const z of [-.045,0,.045]) g.add(rod([-.166,.18,z],[-.166,.28,z],.006,C.peach));
    g.add(put(box(.07,.20,.08,C.peach,.025),-.025,.095,0,0,0,-.14));
    detail(g,.021,.045,-.001,.105,.047,C.ink);
    g.add(tube('dryer-cord',[[-.01,.01,0],[-.02,.01,.14],[.13,.012,.17],[.23,.012,.08]],.012,C.ink));
    g.add(put(box(.055,.025,.037,C.ink,.008),.25,.016,.06)); return g;
  }),
  gpt_sewingkit: item('바느질 반짇고리', 'home', () => {
    const g=grp();
    g.add(put(box(.43,.09,.29,C.cream,.035),0,.045,0));
    g.add(put(box(.385,.018,.245,C.peach,.018),0,.094,0));
    const lid=grp(put(box(.43,.26,.032,C.red,.025),0,.13,0),put(box(.36,.20,.013,'#efc7aa',.018),0,.13,.022));
    lid.position.set(0,.08,-.135); lid.rotation.x=-.16; g.add(lid);
    for(const [i,c] of [C.blue,C.yellow,C.mint].entries()){
      const x=-.12+i*.12;
      g.add(put(cylinder(.039,.039,.065,c,12),x,.137,-.01));
      for(const y of [.107,.168])g.add(put(cylinder(.045,.045,.009,C.cream,12),x,y,-.01));
    }
    g.add(put(ball(.065,C.red,[1,.52,.8]),0,.13,.075));
    for(const x of [-.022,.022]){g.add(rod([x,.15,.075],[x-.01,.205,.07],.003,C.silver));g.add(put(ball(.009,C.yellow),x-.01,.205,.07));}
    detail(g,.055,.028,0,.051,.153,C.yellow); return g;
  }),
  gpt_lintroller: item('돌돌이 청소기', 'home', () => {
    const g=grp();
    g.add(put(cylinder(.075,.075,.30,C.white,18),-.055,.085,0,0,0,Math.PI/2));
    for(const x of [-.205,.095])g.add(put(cylinder(.079,.079,.013,C.mint,18),x,.085,0,0,0,Math.PI/2));
    g.add(tube('lint-arm',[[.105,.085,0],[.16,.085,0],[.16,.085,.17],[.03,.085,.20]],.017,C.silver));
    g.add(put(cylinder(.037,.037,.22,C.mint,14),-.06,.085,.20,0,0,Math.PI/2));
    for(const x of [-.13,-.09,-.05])g.add(put(ring(.037,.004,C.teal),x,.085,.20,0,Math.PI/2));return g;
  }),
  gpt_tapemeasure: item('줄자', 'home', () => {
    const g=grp();
    g.add(put(box(.28,.24,.14,C.yellow,.055),-.08,.12,0));
    g.add(put(cylinder(.075,.075,.016,C.ink,18),-.08,.13,.078,Math.PI/2));
    g.add(put(cylinder(.058,.058,.02,C.cream,18),-.08,.13,.09,Math.PI/2));
    g.add(put(box(.035,.035,.10,C.ink,.007),-.06,.25,0));
    g.add(put(box(.30,.012,.085,'#fae6ae',.003),.20,.025,0));
    for(let i=0;i<7;i++)g.add(put(box(.006,.004,i%2?.025:.045,C.brown,.001),.06+i*.038,.033,.015));
    g.add(put(box(.016,.055,.095,C.silver,.003),.35,.027,0));
    g.add(tube('tape-loop',[[-.22,.15,0],[-.32,.14,0],[-.34,.04,0],[-.23,.015,0]],.015,C.ink));return g;
  }),

  gpt_teapot: item('법랑 주전자', 'kitchen', () => {
    const g=grp();
    oval(g,0,.17,0,1.10,.87,1,C.cream,.17);
    g.add(put(cylinder(.14,.15,.025,C.teal,20),0,.305,0));
    g.add(put(ball(.028,C.wood),0,.34,0));
    g.add(tube('teapot-spout',[[.13,.12,0],[.23,.16,0],[.27,.25,0],[.30,.27,0]],.045,C.cream));
    g.add(put(cylinder(.031,.033,.018,C.brown,14),.305,.28,0,0,0,-.6));
    g.add(tube('teapot-handle',[[-.12,.24,0],[-.26,.29,0],[-.31,.18,0],[-.23,.08,0],[-.14,.11,0]],.026,C.teal));
    g.add(put(ring(.12,.012,C.teal),0,.033,0,Math.PI/2));return g;
  }),
  gpt_fryingpan: item('달걀 프라이팬', 'kitchen', () => {
    const g=grp();
    g.add(put(cylinder(.18,.15,.05,C.ink,24),-.10,.029,0));
    g.add(put(cylinder(.157,.157,.012,'#6f4b30',24),-.10,.057,0));
    g.add(put(ring(.173,.012,C.grey),-.1,.062,0,Math.PI/2));
    g.add(put(box(.13,.03,.045,C.silver,.008),.13,.045,0));
    g.add(put(box(.25,.055,.078,C.wood,.025),.30,.05,0,0,0,-.05));
    for(const [x,z,r]of[[-.135,-.02,.09],[-.06,.01,.08],[-.11,.052,.07]])oval(g,x,.075,z,1,.15,1,C.white,r);
    oval(g,-.11,.093,.008,1,.45,1,C.yellow,.063);return g;
  }, .66, { flat: true }),
  gpt_colander: item('손잡이 채반', 'kitchen', () => {
    const g=grp();
    // A genuinely open rib basket: the gaps are geometry, no painted holes.
    g.add(put(ring(.18,.016,C.mint),0,.19,0,Math.PI/2));
    g.add(put(cylinder(.10,.10,.018,C.mint,18),0,.018,0));
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,dx=Math.cos(a),dz=Math.sin(a);
      g.add(tube(`colander-rib-${i}`,[[dx*.085,.025,dz*.085],[dx*.13,.075,dz*.13],[dx*.17,.16,dz*.17],[dx*.18,.19,dz*.18]],.011,C.mint));
    }
    for(const [r,y]of[[.125,.063],[.155,.115]])g.add(put(ring(r,.009,C.mint),0,y,0,Math.PI/2));
    for(const s of [-1,1])g.add(put(ring(.05,.013,C.teal),s*.214,.18,0,Math.PI/2,0,0,[1.3,1,1]));return g;
  }),
  gpt_garlic: item('통마늘', 'kitchen', () => {
    const g=grp();
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7; oval(g,Math.cos(a)*.077,.12,Math.sin(a)*.077,.76,1.2,.73,i%2?C.cream:'#f6e0bf',.105);}
    g.add(put(cone(.08,.19,C.cream,null,12),0,.27,0));
    g.add(put(cylinder(.025,.033,.08,'#cabb8d',12),.012,.385,0,0,0,-.18));
    g.add(put(cylinder(.065,.07,.018,C.brown,14),0,.016,0));
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;g.add(rod([Math.cos(a)*.03,.01,Math.sin(a)*.03],[Math.cos(a)*.08,.005,Math.sin(a)*.08],.004,'#af9865'));}return g;
  }, .5),
  gpt_rollingpin: item('나무 밀대', 'kitchen', () => {
    const g=grp();
    g.add(put(cylinder(.074,.074,.34,C.wood,18),0,.078,0,0,0,Math.PI/2));
    for(const s of[-1,1]){
      g.add(put(cylinder(.025,.025,.07,C.brown,12),s*.20,.078,0,0,0,Math.PI/2));
      g.add(put(cylinder(.038,.031,.12,C.peach,14),s*.27,.078,0,0,0,Math.PI/2));
      g.add(put(ball(.031,C.peach,[.5,1,1]),s*.33,.078,0));
    }
    for(const z of[-.036,.022])g.add(put(box(.25,.005,.004,'#e4a95d',.001),0,.148,z));return g;
  }, .66, { flat: true }),
  gpt_ovenmitt: item('누빔 오븐 장갑', 'kitchen', () => {
    const g=grp();
    g.add(put(box(.20,.065,.34,C.red,.055),-.02,.037,-.01));
    g.add(put(ball(.073,C.red,[.8,.47,1.35]),.105,.038,-.045));
    g.add(put(box(.21,.075,.065,C.cream,.018),-.02,.04,.165));
    for(let i=-2;i<=2;i++)g.add(put(box(.014,.004,.245,'#f5a4a8',.003),-.02+i*.033,.072,-.025,0,i%2?.1:-.1));
    g.add(put(ring(.027,.007,C.cream),-.09,.04,.21,Math.PI/2));return g;
  }, .56, { flat: true }),
  gpt_juicer: item('오렌지 착즙기', 'kitchen', () => {
    const g=grp();
    g.add(put(cylinder(.18,.14,.075,C.yellow,22),0,.041,0));
    g.add(put(cylinder(.155,.155,.012,'#f4d28d',22),0,.084,0));
    g.add(put(ring(.171,.012,C.cream),0,.088,0,Math.PI/2));
    g.add(put(cone(.082,.14,C.cream,null,10),0,.155,0));
    for(let i=0;i<8;i++){let a=i*Math.PI/4;g.add(rod([Math.sin(a)*.075,.095,Math.cos(a)*.075],[Math.sin(a)*.018,.205,Math.cos(a)*.018],.009,C.yellow));}
    g.add(put(ring(.047,.014,C.yellow),-.214,.054,0,Math.PI/2));
    g.add(put(cone(.055,.09,C.yellow,null,3),.18,.062,0,0,0,-Math.PI/2));
    const half=mesh(geo('gpt-half-orange',()=>new THREE.SphereGeometry(.10,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2)),mat('#eaa440'));
    g.add(put(half,.17,.080,.16,0,0,0,[1,.75,1]));
    g.add(put(cylinder(.091,.091,.012,'#fae6ae',18),.17,.083,.16));
    for(let i=0;i<6;i++){const a=i*Math.PI/3;g.add(rod([.17,.091,.16],[.17+Math.sin(a)*.079,.091,.16+Math.cos(a)*.079],.003,C.cream));}return g;
  }),
  gpt_waffle: item('버터 와플', 'kitchen', () => {
    const g=grp();
    g.add(put(box(.37,.055,.32,'#c67f2a',.03),0,.033,0));
    for(let i=0;i<4;i++)for(let j=0;j<3;j++){
      const x=-.135+i*.09,z=-.10+j*.10;
      g.add(put(box(.072,.018,.078,'#f9bb68',.012),x,.068,z));
      g.add(put(box(.043,.008,.046,'#c67f2a',.006),x,.079,z));
    }
    g.add(put(box(.10,.025,.085,'#fae6ae',.009),.018,.106,-.012,0,.2,0));
    g.add(put(ball(.055,'#c76204',[1.5,.10,1]),-.04,.087,.075));return g;
  }, .58, { flat: true }),

  gpt_calculator: item('탁상 계산기', 'school', () => {
    const g=grp();g.add(put(box(.31,.065,.43,C.mint,.025),0,.035,0));
    stripe(g,0,.074,-.12,.245,.10,C.ink); stripe(g,0,.080,-.122,.215,.066,'#a2c8bb');
    for(let i=0;i<4;i++)for(let j=0;j<3;j++)g.add(put(box(.055,.02,.045,i===3&&j===2?C.red:C.cream,.007),-.08+j*.08,.081,-.025+i*.058));
    for(let i=0;i<3;i++)g.add(put(box(.018,.004,.029,C.navy,.002),.03+i*.032,.084,-.122));
    stripe(g,-.08,.082,-.194,.10,.018,C.navy);return g;
  }, .36, { flat: true }),   // (.59 → .36, 10/27: a desk calculator as big as a pupil's desk top — 16판 stood on the floor like a cabinet)
  gpt_scissors: item('둥근 안전 가위', 'school', () => {
    const g=grp();
    for(const s of[-1,1]){
      g.add(put(ring(.073,.024,s<0?C.red:C.yellow),s*.075,.028,.145,Math.PI/2,0,0,[.78,1.05,1]));
      g.add(rod([s*.05,.029,.09],[-s*.06,.029,-.19],.018,C.silver));
      oval(g,-s*.064,.03,-.205,.55,.25,1,C.silver,.033);
    }
    g.add(put(cylinder(.027,.027,.025,C.ink,12),0,.04,.025));return g;
  }, .58, { flat: true }),
  gpt_abacus: item('알록달록 주판', 'school', () => {
    const g=grp();
    for(const z of[-.17,.17])g.add(put(box(.48,.045,.043,C.wood,.012),0,.03,z));
    for(const x of[-.22,.22])g.add(put(box(.045,.045,.34,C.wood,.012),x,.03,0));
    g.add(put(box(.44,.04,.024,C.wood,.005),0,.03,-.065));
    for(let i=0;i<6;i++){
      const x=-.17+i*.068;g.add(rod([x,.033,-.15],[x,.033,.15],.006,C.silver));
      for(let j=0;j<4;j++)g.add(put(ball(.024,[C.red,C.yellow,C.mint][i%3],[1,.7,.7]),x,.033,-.125+j*.077));
    }return g;
  }, .64, { flat: true }),
  gpt_triangleruler: item('삼각자', 'school', () => {
    const g=grp(),shape=new THREE.Shape();shape.moveTo(-.24,-.18);shape.lineTo(.24,-.18);shape.lineTo(-.24,.22);shape.closePath();
    const hole=new THREE.Path();hole.moveTo(-.14,-.095);hole.lineTo(-.14,.045);hole.lineTo(.03,-.095);hole.closePath();shape.holes.push(hole);
    g.add(put(extrude('gpt-triangle-ruler',shape,.018,C.yellow),0,.019,0,-Math.PI/2));
    for(let i=0;i<10;i++)g.add(put(box(.006,.004,i%2?.023:.037,C.brown,.001),-.19+i*.041,.037,.15));
    for(let i=0;i<6;i++)g.add(put(box(i%2?.023:.037,.004,.006,C.brown,.001),-.21,.037,-.11+i*.045));return g;
  }, .61, { flat: true }),
  gpt_palette: item('수채화 팔레트', 'school', () => {
    const g=grp();
    g.add(put(box(.40,.055,.28,C.cream,.025),0,.03,0));
    for(let i=0;i<4;i++)for(let j=0;j<2;j++){
      const x=-.145+i*.096,z=-.065+j*.13;
      g.add(put(cylinder(.041,.041,.012,'#a7a595',14),x,.062,z));
      g.add(put(cylinder(.033,.033,.016,['#e8604c','#feb53d','#899962','#4b93b6','#a86664','#f28b6a','#a2c8bb','#755039'][j*4+i],14),x,.07,z));
    }
    const lid=grp(put(box(.40,.22,.022,C.mint,.02),0,.11,0),put(box(.34,.165,.008,C.cream,.012),0,.11,.016));
    lid.position.set(0,.048,-.14);lid.rotation.x=-.22;g.add(lid);
    // The loose brush rests beside the palette. Both its handle and the broad
    // bristle end touch the same .0025-high raw floor as the palette's base.
    g.add(rod([-.21,.0115,.17],[.19,.0205,.17],.009,C.wood));g.add(put(cone(.018,.08,C.brown,null,10),.23,.0205,.17,0,0,-Math.PI/2));return g;
  }, .66),
  // (⑪ 10/24 아트 점검: a red slab tilted on a navy slab — now a two-hole punch: a steel base with a paper guide and its
  // ruler marks, the clear chip tray in front with paper dots inside, two punch towers, the curved lever with a rubber grip)
  gpt_holepunch: item('이공 펀치', 'school', () => {
    const g=grp();
    g.add(put(box(.36,.03,.24,C.navy,.014),0,.015,0));
    g.add(put(box(.33,.012,.07,'#cfe9f2',.006),0,.033,.1));
    for(let i=0;i<7;i++)g.add(put(box(.006,.004,.025,C.ink,.002),-.15+i*.05,.04,.1));
    g.add(put(box(.012,.03,.2,C.yellow,.004),-.17,.045,-.01));
    for(const x of[-.08,.08]){g.add(put(cylinder(.032,.038,.08,C.silver,14),x,.07,-.04));g.add(put(cylinder(.036,.036,.012,C.ink,14),x,.112,-.04));}
    g.add(put(box(.34,.035,.2,C.red,.03),0,.14,-.02,.18));g.add(put(box(.3,.04,.05,C.ink,.018),0,.12,.085,.3));g.add(put(cylinder(.016,.016,.36,C.silver,12),0,.125,-.11,0,0,Math.PI/2));
    detail(g,.1,.016,0,.162,-.02,C.cream);
    return g;
  }, .57),
  gpt_drawingcompass: item('제도 컴퍼스', 'school', () => {
    const g=grp();
    for(const s of[-1,1]){
      g.add(rod([0,.04,-.17],[s*.14,.04,.18],.017,C.silver));
      g.add(put(box(.032,.03,.11,s<0?C.blue:C.wood,.008),s*.15,.04,.22,0,s*.15,0));
      g.add(put(cone(.017,.055,C.ink,null,8),s*.159,.04,.29,Math.PI/2));
    }
    g.add(put(cylinder(.045,.045,.03,C.blue,14),0,.046,-.17));
    g.add(put(box(.04,.033,.09,C.blue,.012),0,.043,-.24));
    g.add(rod([-.08,.04,.04],[.08,.04,.04],.006,C.ink));
    g.add(put(cylinder(.028,.028,.018,C.grey,14),0,.056,.04));return g;
  }, .62, { flat: true }),

  gpt_passport: item('여권과 항공권', 'travel', () => {
    const g=grp();
    g.add(put(box(.29,.025,.40,C.navy,.018),-.035,.018,0,0,-.12));
    g.add(put(box(.25,.018,.34,C.cream,.006),-.033,.036,0,0,-.12));
    g.add(put(box(.29,.014,.40,C.navy,.015),-.035,.054,0,0,-.12));
    g.add(put(ring(.066,.006,C.yellow),-.045,.066,-.01,Math.PI/2));
    g.add(put(ring(.062,.004,C.yellow),-.045,.067,-.01,Math.PI/2,0,0,[.5,1,1]));
    stripe(g,-.045,.068,-.01,.12,.005,C.yellow);stripe(g,-.045,.068,-.125,.14,.015,C.yellow);
    const ticket=grp(put(box(.13,.013,.32,C.cream,.005),0,.01,0));
    stripe(ticket,0,.019,-.11,.13,.035,C.red);
    for(let i=0;i<7;i++)stripe(ticket,-.035+i*.012,.019,.078,.004,.08,C.ink);
    ticket.position.set(.14,.016,.025);ticket.rotation.y=.15;g.add(ticket);return g;
  }, .60, { flat: true }),
  gpt_binoculars: item('쌍안경', 'travel', () => {
    const g=grp();
    for(const x of[-.11,.11]){
      g.add(put(cylinder(.076,.095,.25,C.green,18),x,.10,0,Math.PI/2));
      for(const z of[-.135,.135])g.add(put(cylinder(z<0?.072:.094,z<0?.072:.094,.035,C.ink,18),x,.10,z,Math.PI/2));
      g.add(put(cylinder(.075,.075,.008,C.blue,18),x,.10,.155,Math.PI/2));
      g.add(put(cylinder(.04,.04,.009,'#7fb6d6',16),x,.10,-.155,Math.PI/2));
    }
    g.add(put(box(.16,.06,.10,C.green,.018),0,.10,0));
    g.add(put(cylinder(.035,.035,.075,C.ink,14),0,.155,-.035,Math.PI/2));
    g.add(tube('binocular-strap',[[-.17,.07,-.06],[-.27,.02,.01],[-.23,.015,.23],[0,.015,.30],[.23,.015,.23],[.27,.02,.01],[.17,.07,-.06]],.012,C.brown));return g;
  }, .66),
  gpt_neckpillow: item('여행 목베개', 'travel', () => {
    const g=grp();
    // U shape with a broad open centre, two rounded front tips and sewn seams.
    const a=Math.PI/2+.66,b=a+Math.PI*1.58;
    g.add(put(ring(.16,.07,C.mint,Math.PI*1.58),0,.075,0,Math.PI/2,0,a));
    for(const t of[a,b])g.add(put(ball(.072,C.mint),Math.cos(t)*.16,.075,Math.sin(t)*.16));
    g.add(put(ring(.16,.004,C.teal,Math.PI*1.58),0,.143,0,Math.PI/2,0,a));
    g.add(put(box(.045,.012,.028,C.cream,.004),-.205,.087,.03));return g;
  }, .61),
  gpt_thermos: item('손잡이 보온병', 'travel', () => {
    const g=grp();
    g.add(put(cylinder(.095,.10,.32,C.mint,20),0,.18,0));
    g.add(put(cylinder(.101,.103,.035,C.ink,20),0,.022,0));
    g.add(put(cylinder(.095,.095,.08,C.cream,20),0,.38,0));
    g.add(put(cylinder(.097,.097,.014,C.teal,20),0,.425,0));
    g.add(tube('thermos-handle',[[.09,.34,0],[.20,.33,0],[.20,.17,0],[.10,.15,0]],.025,C.teal));
    detail(g,.11,.08,0,.21,.101,C.cream,.009);detail(g,.065,.013,0,.21,.112,C.teal);return g;
  }, .48),
  gpt_traveladapter: item('여행용 멀티 어댑터', 'travel', () => {
    const g=grp();
    g.add(put(box(.26,.20,.25,C.cream,.035),0,.10,0));
    detail(g,.195,.145,0,.11,.13,C.navy,.018);
    for(const x of[-.046,.046])detail(g,.018,.055,x,.126,.14,C.ink,.005);
    detail(g,.022,.027,0,.067,.14,C.ink,.005);
    stripe(g,0,.207,-.015,.15,.09,C.mint);
    for(const z of[-.035,.035])g.add(put(box(.09,.022,.025,C.ink,.003),0,.214,z));
    for(const x of[-.05,.05])g.add(put(box(.018,.075,.035,C.silver,.003),x,.10,-.16));
    detail(g,.045,.02,.087,.045,.134,C.red);return g;
  }, .54),
  gpt_luggagetag: item('가죽 여행 가방표', 'travel', () => {
    const g=grp();
    g.add(put(box(.22,.032,.32,C.peach,.025),0,.02,.025));
    g.add(put(box(.17,.01,.20,C.cream,.009),0,.042,.045));
    for(let i=0;i<3;i++)stripe(g,0,.05,-.005+i*.045,.115,.009,C.brown);
    g.add(tube('luggage-tag-strap',[[-.045,.025,-.14],[-.055,.025,-.29],[.055,.025,-.29],[.045,.025,-.14]],.014,C.brown));
    g.add(put(box(.10,.015,.036,C.yellow,.004),0,.042,-.19));return g;
  }, .57, { flat: true }),

  gpt_flippers: item('오리발 한 쌍', 'seaside', () => {
    const g=grp();
    for(const s of[-1,1]){
      const f=grp();
      f.add(put(polygon(`fin-${s}`,[[-.085,.18],[.085,.18],[.12,-.20],[-.12,-.20]],.025,C.teal),0,.025,0,-Math.PI/2));
      f.add(put(box(.12,.06,.17,C.yellow,.04),0,.056,-.09));
      f.add(put(box(.085,.018,.10,C.ink,.025),0,.084,-.10));
      for(const x of[-.065,.065])f.add(put(box(.014,.025,.21,C.mint,.005),x,.048,.08,0,0,x*.5));
      f.position.set(s*.13,0,s*.035);f.rotation.y=s*.13;g.add(f);
    }return g;
  }, .66, { flat: true }),
  gpt_snorkelmask: item('스노클 물안경', 'seaside', () => {
    const g=grp();
    g.add(put(box(.34,.13,.10,C.yellow,.05),-.03,.075,0));
    for(const x of[-.11,.05]){
      detail(g,.13,.082,x,.083,.057,C.teal,.025);
      detail(g,.10,.055,x-.008,.092,.066,'#a2c8bb',.015);
    }
    g.add(put(cone(.035,.07,C.yellow,null,4),-.03,.043,.065,Math.PI/2));
    g.add(tube('snorkel-pipe',[[.14,.035,0],[.23,.055,0],[.24,.35,0],[.20,.40,0]],.022,C.teal));
    g.add(put(cylinder(.03,.03,.07,C.red,12),.205,.39,0,0,0,-.5));
    g.add(tube('mask-strap',[[-.20,.08,-.015],[-.22,.07,-.14],[.15,.07,-.14],[.16,.08,0]],.015,C.brown));return g;
  }, .62),
  gpt_lifering: item('구명환', 'seaside', () => {
    const g=grp();
    g.add(put(ring(.18,.055,C.cream),0,.06,0,Math.PI/2));
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      const wrap=ring(.18,.057,C.red,.40);wrap.rotation.set(Math.PI/2,0,a-.20);wrap.position.y=.06;g.add(wrap);
    }
    g.add(put(ring(.255,.009,C.brown),0,.025,0,Math.PI/2));
    for(let i=0;i<4;i++){const a=i*Math.PI/2;g.add(rod([Math.cos(a)*.21,.045,Math.sin(a)*.21],[Math.cos(a)*.255,.025,Math.sin(a)*.255],.009,C.brown));}return g;
  }, .64, { flat: true }),
  gpt_beachbucket: item('모래놀이 양동이', 'seaside', () => {
    const g=grp();
    // Lathed open tapered wall with a separate solid bottom.
    const points=[[.09,.02],[.14,.25],[.125,.25],[.077,.035]].map(([x,y])=>new THREE.Vector2(x,y));
    g.add(mesh(geo('gpt-open-beach-bucket',()=>new THREE.LatheGeometry(points,20)),mat(C.yellow)));
    g.add(put(cylinder(.085,.085,.02,C.yellow,18),0,.02,0));
    g.add(put(ring(.135,.011,C.cream),0,.25,0,Math.PI/2));
    g.add(tube('bucket-handle',[[-.14,.20,0],[-.16,.36,0],[0,.41,0],[.16,.36,0],[.14,.20,0]],.013,C.red));
    g.add(put(box(.12,.02,.16,C.red,.025),.20,.024,.02));
    g.add(rod([.20,.025,.07],[.20,.025,.26],.016,C.red));
    g.add(put(ring(.036,.011,C.red),.20,.025,.29,Math.PI/2));return g;
  }, .62),
  gpt_conch: item('소라 껍데기', 'seaside', () => {
    const g=grp();
    // The stepped spire extends beyond the body, so its shell silhouette is
    // readable even at a tiny angle. A dark oval mouth sits inside a flared lip.
    oval(g,.045,.13,0,1.12,.82,.90,C.peach,.145);
    oval(g,-.095,.155,0,.92,.92,1,'#f3b275',.107);
    oval(g,-.185,.18,0,.85,1,1,'#eecfa3',.074);
    g.add(put(cone(.057,.17,C.cream,null,14),-.265,.192,0,0,0,Math.PI/2));
    for(const [x,y,r]of[[-.168,.171,.073],[-.085,.15,.101]])g.add(put(ring(r,.008,'#e18b6b'),x,y,0,0,Math.PI/2));
    oval(g,.143,.095,.095,1.02,.62,.20,'#a15b51',.088);
    g.add(put(ring(.081,.019,C.cream),.143,.095,.109,0,.28,-.22,[1.12,.72,1]));
    for(const [x,y]of[[-.02,.245],[.055,.245],[.125,.21]])g.add(put(cone(.021,.057,C.cream,null,8),x,y,-.032,0,0,-.35));return g;
  }, .60),
  gpt_fishingreel: item('낚시 릴', 'seaside', () => {
    const g=grp();
    g.add(put(cylinder(.10,.10,.10,C.silver,18),0,.16,0,Math.PI/2));
    g.add(put(cylinder(.079,.079,.09,'#75a7a5',18),0,.16,.09,Math.PI/2));
    for(const z of[.045,.14])g.add(put(cylinder(.10,.10,.014,C.navy,18),0,.16,z,Math.PI/2));
    g.add(put(cylinder(.035,.035,.018,C.yellow,14),0,.16,.154,Math.PI/2));
    g.add(tube('reel-bail',[[-.10,.16,.11],[-.11,.29,.11],[.11,.29,.11],[.10,.16,.11]],.008,C.silver));
    g.add(rod([0,.16,-.06],[.16,.16,-.06],.014,C.silver));g.add(rod([.16,.16,-.06],[.16,.07,-.06],.014,C.silver));
    g.add(put(ball(.034,C.wood,[1.25,.7,.7]),.16,.065,-.06));
    g.add(rod([0,.13,-.01],[0,.025,-.01],.025,C.navy));g.add(put(box(.17,.025,.075,C.navy,.01),0,.015,-.01));return g;
  }, .56),
  gpt_sunscreen: item('선크림', 'seaside', () => {
    const g=grp();
    g.add(put(cylinder(.075,.075,.055,C.yellow,18),0,.03,0));
    g.add(put(box(.18,.27,.10,C.cream,.027),0,.19,0));
    g.add(put(box(.18,.022,.095,C.yellow,.006),0,.333,0));
    detail(g,.13,.13,0,.20,.057,C.blue,.018);
    g.add(put(cylinder(.035,.035,.008,C.yellow,12),0,.216,.066,Math.PI/2));
    for(let i=0;i<6;i++){let a=i*Math.PI/3;g.add(rod([Math.sin(a)*.043,.216+Math.cos(a)*.043,.068],[Math.sin(a)*.056,.216+Math.cos(a)*.056,.068],.004,C.yellow));}
    detail(g,.065,.012,0,.145,.068,C.cream);return g;
  }, .46),
  // (⑪ 10/24 아트 점검: a pink ball on eight pink lumps — now a plush octopus: a tall soft head with a crease, shiny eyes
  // with a white catch-light, cheeks and a little 'o' mouth, eight arms that curl up at the tips with pale suckers under them,
  // and a stitched patch on the head)
  gpt_octopus: item('문어 봉제인형', 'seaside', () => {
    const g=grp(), pk='#e891a8', pl='#fbc9d4', dk='#c9708a';
    oval(g,0,.2,-.01,1,1.12,.95,pk,.13);
    g.add(put(ring(.115,.006,dk,Math.PI),0,.25,-.01,Math.PI/2-.2,0,0));
    oval(g,0,.075,0,1.25,.5,1.25,pk,.12);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+.2,s=Math.sin(a),c=Math.cos(a),cs=i%2?1:-1;
      g.add(tube('octo2-arm'+i,[[s*.08,.05,c*.08],[s*.17,.03,c*.17],[s*.24,.03,c*.24],[s*.27+c*.03*cs,.06,c*.27-s*.03*cs],[s*.24+c*.05*cs,.09,c*.24-s*.05*cs]],.03,pk));
      for(const k of[.15,.21])g.add(put(ball(.009,pl),s*k,.006,c*k));
    }
    for(const x of[-.05,.05]){g.add(put(ball(.022,C.ink),x,.2,.115));g.add(put(ball(.007,'#ffffff'),x+.008,.21,.133));}
    for(const x of[-.085,.085])oval(g,x,.17,.105,1,.6,.25,'#ff9fb2',.024);
    g.add(put(ring(.012,.005,C.ink),0,.155,.122,0,0,0));
    g.add(put(box(.05,.045,.012,pl,.01),.06,.3,.03,-.5,.4,.2));
    for(const k of[-1,1])g.add(put(box(.003,.03,.004,dk,.001),.06+k*.02,.3,.04,-.5,.4,.2));
    return g;
  }, .63),

  gpt_kite: item('리본 연', 'park', () => {
    const g=grp();
    const points=[[0,.26],[-.19,.025],[0,-.23],[.19,.025]];
    g.add(put(polygon('kite',points,.014,C.yellow),0,.025,0,-Math.PI/2));
    g.add(put(polygon('kite-blue',[[0,.25],[-.18,.025],[0,-.22]],.017,C.blue),-.09,.039,0,-Math.PI/2));
    g.add(rod([0,.05,-.26],[0,.05,.23],.006,C.wood));g.add(rod([-.19,.05,-.025],[.19,.05,-.025],.006,C.wood));
    g.add(tube('kite-tail',[[0,.025,.23],[.08,.02,.33],[.05,.02,.44],[.14,.02,.5]],.006,C.brown));
    for(const [x,z]of[[.07,.33],[.055,.43]]){
      g.add(put(cone(.034,.06,C.red,null,3),x-.025,.025,z,0,0,-Math.PI/2));g.add(put(cone(.034,.06,C.red,null,3),x+.025,.025,z,0,0,Math.PI/2));
    }return g;
  }, .67, { flat: true }),
  gpt_bouquet: item('들꽃 꽃다발', 'park', () => {
    const g=grp();
    g.add(put(cone(.095,.25,C.cream,null,8),0,.145,0,0,0,Math.PI));
    for(const [x,y,z,c]of[[-.09,.30,.01,C.red],[.07,.35,-.015,C.yellow],[.03,.29,.08,'#eca2a8'],[-.02,.39,-.03,C.cream]]){
      g.add(rod([0,.05,0],[x,y,z],.007,C.green));
      for(let i=0;i<5;i++){let a=i*Math.PI*2/5;oval(g,x+Math.sin(a)*.043,y,z+Math.cos(a)*.043,1,.55,1,c,.028);}
      g.add(put(ball(.022,C.yellow),x,y+.01,z));
      oval(g,x*.5+.035,y*.55,z,1.3,.4,.6,C.green,.04);
    }
    g.add(put(ring(.055,.012,C.red),0,.11,0,Math.PI/2));return g;
  }, .53),
  gpt_birdhouse: item('작은 새집', 'park', () => {
    const g=grp();
    g.add(put(box(.23,.24,.21,C.wood,.018),0,.14,0));
    for(const s of[-1,1])g.add(put(box(.19,.025,.28,C.red,.008),s*.076,.315,0,0,0,s*-.62));
    g.add(put(cylinder(.051,.051,.012,C.brown,20),0,.205,.112,Math.PI/2));
    g.add(put(cylinder(.043,.043,.014,C.ink,20),0,.205,.121,Math.PI/2));
    g.add(rod([0,.10,.10],[0,.10,.19],.014,C.wood));
    g.add(put(box(.29,.025,.25,C.cream,.01),0,.017,0));
    for(const x of[-.07,.07])detail(g,.006,.18,x,.14,.111,'#e29f60',.001);return g;
  }, .52),
  gpt_wateringcan: item('동네 물뿌리개', 'park', () => {
    const g=grp();
    g.add(put(cylinder(.115,.13,.22,C.mint,20),-.025,.12,0));
    g.add(put(ring(.105,.013,C.teal),-.025,.235,0,Math.PI/2));
    g.add(put(cylinder(.085,.085,.012,C.ink,18),-.025,.225,0));
    g.add(tube('wateringcan-handle',[[-.12,.20,0],[-.24,.27,0],[-.25,.10,0],[-.13,.07,0]],.022,C.teal));
    g.add(tube('wateringcan-spout',[[.08,.06,0],[.21,.15,0],[.28,.27,0]],.025,C.mint));
    g.add(put(cylinder(.061,.035,.045,C.yellow,18),.295,.29,0,0,0,-.6));
    for(const [x,z]of[[0,0],[-.02,.02],[.02,-.02]])g.add(put(ball(.005,C.brown),.32+x,.307,.0+z));return g;
  }, .66),
  gpt_lantern: item('캠핑 랜턴', 'park', () => {
    const g=grp();
    g.add(put(cylinder(.13,.145,.06,C.red,20),0,.03,0));
    g.add(put(cylinder(.103,.103,.23,'#fae6ae',18),0,.175,0));
    for(let i=0;i<4;i++){let a=i*Math.PI/2;g.add(rod([Math.cos(a)*.11,.06,Math.sin(a)*.11],[Math.cos(a)*.11,.29,Math.sin(a)*.11],.012,C.red));}
    g.add(put(cylinder(.14,.11,.065,C.red,20),0,.325,0));g.add(put(cylinder(.055,.075,.035,C.red,16),0,.375,0));
    g.add(tube('lantern-handle',[[-.12,.33,0],[-.13,.49,0],[0,.54,0],[.13,.49,0],[.12,.33,0]],.012,C.ink));
    g.add(put(cylinder(.022,.022,.025,C.ink,12),0,.045,.145,Math.PI/2));return g;
  }, .5),
  gpt_walkietalkie: item('무전기', 'park', () => {
    const g=grp();g.add(put(box(.25,.29,.14,C.yellow,.028),0,.145,0));
    g.add(put(cylinder(.016,.021,.15,C.ink,10),-.080,.36,0));
    g.add(put(cylinder(.026,.026,.045,C.ink,12),.080,.314,0));
    detail(g,.14,.055,0,.22,.067,C.navy,.008);detail(g,.106,.025,0,.22,.074,'#a2c8bb');
    for(let i=0;i<4;i++)detail(g,.12,.009,0,.145-i*.024,.066,C.brown,.003);
    detail(g,.032,.035,.055,.035,.066,C.red);
    g.add(put(box(.024,.07,.06,C.red,.008),-.131,.22,0));return g;
  }, .49),
  gpt_gardengloves: item('정원 작업 장갑', 'park', () => {
    const g=grp();
    for(const s of[-1,1]){
      const hand=grp();hand.add(put(box(.12,.04,.15,C.cream,.028),0,.024,.01));
      for(let i=0;i<4;i++)hand.add(put(box(.025,.04,.11-Math.abs(i-1.5)*.015,C.cream,.012),-.045+i*.03,.024,-.10));
      hand.add(put(box(.033,.04,.09,C.cream,.015),.083,.024,-.015,0,-.5));
      hand.add(put(box(.13,.045,.07,C.green,.014),0,.027,.11));
      for(let i=0;i<3;i++)stripe(hand,-.035+i*.035,.047,.015,.012,.10,C.mint);
      hand.position.set(s*.095,0,s*.025);hand.rotation.y=s*.13;g.add(hand);
    }return g;
  }, .61, { flat: true }),
  gpt_mushroombasket: item('버섯 채집 바구니', 'park', () => {
    const g=grp();
    g.add(put(box(.30,.11,.24,C.wood,.035),0,.06,0));g.add(put(box(.25,.018,.19,C.brown,.025),0,.121,0));
    for(const z of[-.124,.124])for(let i=0;i<6;i++)detail(g,.025,.085,-.125+i*.05,.065,z,'#e3a859');
    for(const z of[-.125,.125])for(const y of[.04,.085])detail(g,.29,.012,0,y,z,'#a67a49');
    g.add(tube('mushroom-basket-handle',[[-.15,.10,0],[-.15,.29,0],[0,.34,0],[.15,.29,0],[.15,.10,0]],.018,C.wood));
    for(const [x,z,h]of[[-.07,-.04,.10],[.065,.03,.075],[.0,.07,.055]]){
      g.add(put(cylinder(.023,.025,h,C.cream,12),x,.13+h/2,z));
      g.add(put(ball(.065,'#c76204',[1,.50,1]),x,.13+h,z));
      g.add(put(cylinder(.055,.055,.01,'#eecfa3',16),x,.12+h,z));
    }return g;
  }, .59),

  gpt_grocerybag: item('장본 종이 봉투', 'shop', () => {
    const g=grp();
    g.add(put(box(.27,.25,.20,'#da994c',.018),0,.125,0));
    g.add(put(box(.23,.015,.16,C.brown,.008),0,.258,0));
    for(const z of[-.08,.08])g.add(tube(`bag-handle-${z}`,[[-.085,.22,z],[-.085,.36,z],[.085,.36,z],[.085,.22,z]],.009,'#aa864e'));
    g.add(put(cylinder(.046,.046,.16,C.green,14),-.065,.30,-.035));
    g.add(put(cylinder(.028,.028,.06,C.cream,12),-.065,.405,-.035));
    g.add(put(ball(.073,C.red),.06,.31,.03));
    g.add(put(box(.075,.20,.065,'#f9bb68',.025),.055,.36,-.04,0,0,-.18));
    for(let i=0;i<3;i++)g.add(put(box(.055,.006,.01,'#c67f2a',.002),.05,.32+i*.045,-.002,0,0,-.18));
    detail(g,.10,.07,0,.13,.106,C.cream,.012);return g;
  }, .53),
  gpt_eggcarton: item('달걀 한 판', 'shop', () => {
    const g=grp();
    g.add(put(box(.37,.045,.25,'#c6c393',.018),0,.025,0));
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      const x=-.115+i*.115,z=-.059+j*.118;
      g.add(put(cylinder(.043,.036,.035,'#a7a595',12),x,.05,z));
      oval(g,x,.10,z,.72,1,.72,i%2?C.cream:'#eecfa3',.052);
    }
    const lid=grp(put(box(.37,.20,.025,'#d4c498',.018),0,.10,0));
    detail(lid,.24,.10,0,.11,.018,C.cream,.007);detail(lid,.16,.018,0,.13,.025,C.green);detail(lid,.10,.013,0,.095,.025,C.brown);
    lid.position.set(0,.035,-.12);lid.rotation.x=-.23;g.add(lid);return g;
  }, .64),
  gpt_deskbell: item('카운터 호출 종', 'shop', () => {
    const g=grp();
    g.add(put(cylinder(.15,.17,.045,C.ink,22),0,.025,0));
    oval(g,0,.065,0,1,.67,1,C.yellow,.14);
    g.add(put(cylinder(.022,.022,.06,C.silver,12),0,.18,0));
    g.add(put(cylinder(.053,.053,.025,C.red,18),0,.218,0));
    g.add(put(ball(.049,C.red,[1,.25,1]),0,.231,0));return g;
  }, .51),
  gpt_pricegun: item('가격표 라벨기', 'shop', () => {
    const g=grp();
    g.add(put(box(.28,.16,.14,C.red,.03),-.015,.20,0));
    g.add(put(cylinder(.065,.065,.14,C.red,18),-.14,.24,0,Math.PI/2));
    g.add(put(cylinder(.043,.043,.15,C.cream,18),-.14,.24,0,Math.PI/2));
    g.add(put(box(.07,.19,.10,C.red,.022),.025,.09,0,0,0,-.25));
    g.add(put(box(.028,.10,.045,C.ink,.01),.088,.116,0,0,0,-.25));
    g.add(put(box(.13,.02,.13,C.cream,.006),.17,.14,0));
    stripe(g,.175,.154,0,.09,.07,C.yellow);
    for(let i=0;i<4;i++)stripe(g,.14+i*.022,.16,0,.005,.04,C.ink);return g;
  }, .59),
  gpt_tapedispenser: item('테이프 디스펜서', 'shop', () => {
    const g=grp();
    g.add(put(box(.39,.06,.18,C.navy,.022),0,.035,0));
    g.add(put(box(.16,.095,.17,C.navy,.025),-.105,.09,0));
    g.add(put(ring(.087,.032,'#cbcf98'),-.105,.165,0));
    g.add(put(ring(.059,.014,C.cream),-.105,.165,.024));
    g.add(put(box(.225,.008,.045,'#cbcf98',.003),.0625,.2125,0,0,0,-.293));
    g.add(put(box(.05,.13,.17,C.navy,.012),.17,.10,0));
    g.add(put(box(.046,.013,.165,C.silver,.003),.17,.172,0));
    for(let i=0;i<7;i++)g.add(put(cone(.009,.015,C.silver,null,3),.18,.181,-.069+i*.023));return g;
  }, .59),
  gpt_icecubetray: item('얼음 틀', 'kitchen', () => {
    const g=grp();
    g.add(put(box(.40,.035,.23,C.blue,.025),0,.025,0));
    for(let i=0;i<4;i++)for(let j=0;j<2;j++){
      const x=-.146+i*.098,z=-.054+j*.108;
      g.add(put(box(.083,.035,.09,C.teal,.014),x,.051,z));
      g.add(put(box(.067,.025,.074,i===3&&j===1?'#24708b':'#b0e5e8',.012),x,.071,z));
      if(i!==3||j!==1)stripe(g,x-.012,.085,z-.015,.027,.009,C.cream);
    }
    for(const s of[-1,1])g.add(put(ring(.036,.009,C.blue),s*.23,.027,0,Math.PI/2));return g;
  }, .65, { flat: true }),

  gpt_ukulele: item('우쿨렐레', 'hobby', () => {
    const g=grp();
    oval(g,0,.061,.105,1,.30,1.07,C.wood,.13);oval(g,0,.063,-.035,.78,.29,.90,C.wood,.12);
    g.add(put(box(.052,.045,.29,C.brown,.008),0,.066,-.22));
    g.add(put(box(.09,.048,.12,C.wood,.015),0,.067,-.405));
    g.add(put(cylinder(.045,.045,.009,C.brown,18),0,.102,.015));
    g.add(put(cylinder(.035,.035,.011,C.ink,18),0,.109,.015));
    stripe(g,0,.108,.16,.10,.022,C.brown);
    for(let i=0;i<4;i++)g.add(rod([-.015+i*.01,.116,.16],[-.015+i*.01,.094,-.43],.0018,C.cream));
    for(let i=0;i<5;i++)stripe(g,0,.094,-.13-i*.043,.055,.005,C.silver);
    for(const s of[-1,1])for(const z of[-.38,-.43])g.add(put(ball(.014,C.cream,[1.4,.6,1]),s*.054,.069,z));return g;
  }, .68, { flat: true }),
  // (⑪ 10/24 아트 점검: the jingles sat inside the red rim, so it read as a plain red plate — now a wooden frame with four
  // slots, a pair of silver jingles standing in each (face out, a pin through), a printed drum head with a star, the rim's
  // tacks and a ribbon tied through the frame)
  gpt_tambourine: item('탬버린', 'hobby', () => {
    const g=grp(), R=.18;
    g.add(put(cylinder(R,R,.06,C.wood,28),0,.05,0));
    g.add(put(cylinder(R-.012,R-.012,.062,'#e9b27a',28),0,.05,0));
    g.add(put(cylinder(R+.004,R+.004,.008,C.cream,28),0,.083,0));
    g.add(put(polygon('tamb2-star',[...Array(10)].map((_,i)=>{const a=i*Math.PI/5,r=i%2?.04:.09;return[Math.sin(a)*r,Math.cos(a)*r];}),.004,C.red),0,.089,0,-Math.PI/2));
    g.add(put(ring(.13,.005,C.peach),0,.088,0,Math.PI/2));
    for(let i=0;i<12;i++){const a=i*Math.PI/6;g.add(put(ball(.007,C.silver),Math.sin(a)*(R-.006),.082,Math.cos(a)*(R-.006)));}
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+.4,x=Math.sin(a)*(R+.016),z=Math.cos(a)*(R+.016);
      g.add(put(box(.07,.034,.012,C.ink,.004),x-Math.sin(a)*.014,.05,z-Math.cos(a)*.014,0,a,0));
      for(const k of[-.015,.015]){const d=put(cylinder(.024,.024,.006,'#d9dee3',16),x+Math.cos(a)*k,.05,z-Math.sin(a)*k,Math.PI/2,a,0);d.rotation.order='YXZ';g.add(d);
        g.add(put(ball(.006,'#9aa3ab'),x+Math.cos(a)*k+Math.sin(a)*.006,.05,z-Math.sin(a)*k+Math.cos(a)*.006));}
    }
    g.add(tube('tamb2-ribbon',[[-.17,.05,.07],[-.24,.03,.1],[-.29,.01,.06],[-.33,.005,.12]],.008,C.blue));
    g.add(tube('tamb2-ribbon2',[[-.17,.05,.07],[-.23,.02,.15],[-.26,.005,.21]],.008,C.yellow));
    return g;
  }, .62, { flat: true }),
  gpt_sailboat: item('돛단배 장난감', 'hobby', () => {
    const g=grp();
    g.add(put(polygon('sailboat-hull',[[-.23,.05],[.20,.05],[.14,-.055],[-.13,-.055]],.18,C.red),0,.075,0));
    g.add(put(box(.30,.017,.145,C.cream,.025),0,.136,0));
    g.add(rod([0,.14,0],[0,.48,0],.009,C.wood));
    g.add(put(polygon('sail-left',[[-.014,.015],[-.014,.29],[-.18,.015]],.012,C.cream),-.097,.31,0));
    g.add(put(polygon('sail-right',[[.012,.025],[.012,.25],[.15,.025]],.012,C.blue),.081,.29,.009));
    g.add(put(polygon('sail-flag',[[0,0],[.095,-.02],[0,-.055]],.01,C.yellow),.04,.50,0));
    for(const z of[-.099,.099])g.add(put(box(.35,.014,.009,C.cream,.003),0,.096,z));return g;
  }, .64),
  gpt_racket: item('배드민턴 라켓', 'hobby', () => {
    const g=grp();
    g.add(put(ring(.12,.013,C.red),0,.025,-.11,Math.PI/2,0,0,[1,1.22,1]));
    for(let i=-3;i<=3;i++){
      const x=i*.027,z=.145*Math.sqrt(1-(x/.12)**2);g.add(rod([x,.026,-.11-z],[x,.026,-.11+z],.0025,C.cream));
      const zz=i*.034,xx=.12*Math.sqrt(1-(zz/.146)**2);g.add(rod([-xx,.028,-.11+zz],[xx,.028,-.11+zz],.0025,C.cream));
    }
    g.add(rod([-.025,.025,.025],[0,.025,.15],.007,C.silver));g.add(rod([.025,.025,.025],[0,.025,.15],.007,C.silver));
    g.add(put(cylinder(.018,.018,.15,C.navy,12),0,.025,.20,Math.PI/2));
    for(let i=0;i<5;i++)g.add(put(ring(.019,.003,C.grey),0,.025,.15+i*.025,Math.PI/2));
    // A shuttlecock gives the object a second unmistakable sport cue.
    g.add(put(ball(.025,C.cream),.16,.025,.17));g.add(put(cone(.055,.10,C.cream,null,8),.16,.047,.24,Math.PI/2));
    g.add(put(ring(.054,.006,C.red),.16,.047,.29));return g;
  }, .68, { flat: true }),
  gpt_chessknight: item('체스 나이트', 'hobby', () => {
    const g=grp();
    g.add(put(cylinder(.115,.13,.045,C.cream,20),0,.025,0));
    g.add(put(cylinder(.075,.10,.08,C.cream,18),0,.085,0));
    g.add(put(polygon('chess-horse',[[-.065,-.10],[.065,-.10],[.08,.02],[.16,.06],[.15,.14],[.055,.19],[.02,.25],[-.015,.18],[-.07,.22],[-.09,.10]],.085,C.cream),0,.29,0));
    g.add(tube('knight-mane',[[-.075,.485,0],[-.11,.405,0],[-.095,.295,0],[-.07,.205,0]],.024,C.brown));
    for(const z of[-.055,.055])g.add(put(ball(.011,C.ink),.087,.414,z));
    g.add(put(box(.07,.011,.10,C.brown,.003),.13,.347,0));return g;
  }, .47),
  gpt_rollerskate: item('레트로 롤러스케이트', 'hobby', () => {
    const g=grp();
    g.add(put(box(.34,.08,.15,C.cream,.025),.015,.15,0));
    g.add(put(box(.16,.20,.15,C.peach,.03),-.075,.27,0));
    g.add(put(box(.17,.10,.15,C.peach,.025),.095,.21,0));
    g.add(put(box(.17,.025,.16,C.cream,.01),-.075,.378,0));
    g.add(put(box(.33,.02,.17,C.silver,.008),.015,.10,0));
    for(const x of[-.10,.13])for(const z of[-.10,.10]){
      g.add(put(cylinder(.049,.049,.035,C.mint,16),x,.051,z,Math.PI/2));
      g.add(put(cylinder(.019,.019,.039,C.cream,12),x,.051,z,Math.PI/2));
    }
    g.add(put(box(.18,.018,.10,C.cream,.007),.035,.283,0,0,0,-.45));
    for(let i=0;i<4;i++){
      const x=-.025+i*.035,y=.316-i*.016;
      g.add(rod([x,y,-.044],[x,y,.044],.004,C.brown));
    }
    g.add(put(ball(.028,C.red),.19,.07,0));return g;
  }, .59),
  gpt_telescope: item('작은 천체 망원경', 'hobby', () => {
    const g=grp();
    const scope=grp();scope.add(put(cylinder(.068,.078,.35,C.cream,18),0,0,0,0,0,Math.PI/2));
    scope.add(put(cylinder(.082,.082,.07,C.navy,18),.20,0,0,0,0,Math.PI/2));
    scope.add(put(cylinder(.065,.065,.009,C.blue,18),.24,0,0,0,0,Math.PI/2));
    scope.add(put(cylinder(.026,.035,.12,C.navy,12),-.23,0,0,0,0,Math.PI/2));
    scope.rotation.z=.25;scope.position.y=.32;g.add(scope);
    g.add(put(cylinder(.023,.023,.14,C.wood,12),0,.20,0));
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;g.add(rod([0,.21,0],[Math.sin(a)*.19,.025,Math.cos(a)*.19],.012,C.wood));g.add(put(ball(.021,C.ink,[1,.5,1]),Math.sin(a)*.19,.015,Math.cos(a)*.19));}
    g.add(put(ball(.031,C.navy),0,.26,0));return g;
  }, .65),
  gpt_toyrocket: item('장난감 우주 로켓', 'hobby', () => {
    const g=grp();
    g.add(put(cylinder(.08,.08,.25,C.cream,18),0,.27,0));
    g.add(put(cone(.08,.15,C.red,null,18),0,.47,0));
    g.add(put(cylinder(.065,.08,.06,C.navy,16),0,.12,0));
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;const fin=polygon(`rocket-fin-${i}`,[[0,.12],[.085,-.08],[.13,-.08],[.075,.15]],.02,C.red);
      fin.rotation.y=a;fin.position.set(Math.cos(a)*.065,.12,-Math.sin(a)*.065);g.add(fin);
    }
    g.add(put(cylinder(.037,.037,.014,C.navy,18),0,.31,.084,Math.PI/2));
    g.add(put(cylinder(.026,.026,.019,C.blue,16),0,.31,.094,Math.PI/2));
    g.add(put(ring(.08,.009,C.yellow),0,.20,0,Math.PI/2));return g;
  }, .49),
  gpt_gluegun: item('공예 글루건', 'hobby', () => {
    const g=grp();
    g.add(put(box(.28,.13,.105,C.mint,.025),0,.225,0));
    g.add(put(cone(.035,.095,C.silver,null,12),.184,.225,0,0,0,-Math.PI/2));
    g.add(put(box(.07,.19,.095,C.mint,.022),-.065,.11,0,0,0,-.25));
    g.add(put(box(.026,.10,.035,C.yellow,.009),.01,.145,0,0,0,-.25));
    g.add(put(cylinder(.019,.019,.18,C.cream,12),-.22,.25,0,0,0,Math.PI/2));
    g.add(tube('gluegun-stand',[[.07,.19,-.045],[.095,.035,-.075],[.095,.035,.075],[.07,.19,.045]],.007,C.ink));
    g.add(tube('gluegun-cord',[[-.04,.02,0],[-.12,.015,.12],[-.29,.015,.12],[-.34,.015,.02]],.009,C.ink));
    g.add(put(box(.055,.025,.035,C.ink,.007),-.35,.016,-.01));return g;
  }, .65),
  gpt_coin: item('동전이 든 딸깍 지갑', 'home', () => {
    const g=grp();
    // An open, thick-walled purse. The lathed cross-section returns down the
    // inner wall to a separate floor, leaving a real cavity below the clasp.
    const profile=[[0,0],[.065,0],[.12,.055],[.13,.14],[.12,.18],[.106,.18],[.116,.14],[.105,.06],[.052,.025],[0,.025]].map(([x,y])=>new THREE.Vector2(x,y));
    const pouch=mesh(geo('gpt-hollow-coin-purse',()=>new THREE.LatheGeometry(profile,24)),mat('#bd6b76'));
    pouch.scale.set(1.4,1,.7);g.add(pouch);
    g.add(put(ring(.113,.009,C.yellow),0,.183,0,Math.PI/2,0,0,[1.4,.7,1]));
    for(const s of[-1,1]){
      g.add(tube(`purse-clasp-${s}`,[[s*.15,.18,-.025],[s*.09,.21,-.055],[s*.015,.225,-.06]],.009,C.yellow));
      g.add(put(ball(.018,C.yellow),s*.015,.229,-.06));
    }
    for(const [x,z,y]of[[-.045,-.015,.16],[.055,.015,.135]]){
      g.add(put(cylinder(.056,.056,.015,C.yellow,22),x,y,z,Math.PI/2));
      g.add(put(ring(.046,.004,'#c67f2a'),x,y,z+.009));
    }
    // A second coin lies on the floor, showing its actual raised rim and motif.
    g.add(put(cylinder(.077,.077,.025,C.yellow,24),.20,.013,.10));
    g.add(put(ring(.065,.005,'#c67f2a'),.20,.031,.10,Math.PI/2));
    g.add(put(extrude('gpt-purse-coin-star',starShape(.038,.018),.008,'#fae6ae'),.20,.036,.10,-Math.PI/2));
    for(let i=0;i<10;i++){const a=i*Math.PI/5;g.add(put(box(.003,.012,.008,'#aa864e',.001),.20+Math.sin(a)*.077,.013,.10+Math.cos(a)*.077,0,a));}
    return g;
  }, .63, { remakeOf: 'coin' }),
  gpt_usb: item('뚜껑을 벗긴 USB', 'school', () => {
    const g=grp();
    g.add(put(box(.28,.075,.14,C.blue,.025),0,.04,0));
    stripe(g,-.015,.083,0,.17,.085,C.cream);
    // The USB-A shell has real retention openings and a visible contact bed.
    const plug=grp();
    plug.add(put(box(.13,.012,.105,C.silver,.003),0,.012,0));
    for(const z of[-.047,.047])plug.add(put(box(.13,.048,.011,C.silver,.003),0,.036,z));
    for(const z of[-.046,0,.046])plug.add(put(box(.13,.012,z===0?.025:.014,C.silver,.003),0,.066,z));
    for(const x of[-.055,.055])plug.add(put(box(.02,.012,.105,C.silver,.003),x,.066,0));
    plug.add(put(box(.105,.014,.080,C.ink,.003),-.01,.029,0));
    for(const z of[-.03,-.01,.01,.03])plug.add(put(box(.075,.005,.010,C.yellow,.002),.009,.039,z));
    plug.position.set(.20,.002,0);g.add(plug);
    // The USB trident is drawn on one face from raised coloured geometry.
    g.add(rod([-.065,.089,0],[.045,.089,0],.003,C.navy));
    g.add(rod([-.015,.089,0],[.005,.089,-.026],.003,C.navy));g.add(rod([.005,.089,-.026],[.025,.089,-.026],.003,C.navy));
    g.add(rod([-.025,.089,0],[-.005,.089,.027],.003,C.navy));g.add(put(ball(.008,C.navy,[1,.3,1]),-.005,.089,.027));
    g.add(put(cone(.010,.025,C.navy,null,3),.055,.089,0,0,0,-Math.PI/2));
    g.add(put(ring(.026,.008,C.navy),-.16,.04,0,Math.PI/2));
    // Hollow cap beside the stick: no solid grey face pretending to be inside.
    const cap=grp();
    for(const y of[.007,.070])cap.add(put(box(.14,.014,.14,C.blue,.005),0,y,0));
    for(const z of[-.063,.063])cap.add(put(box(.14,.055,.014,C.blue,.005),0,.038,z));
    cap.add(put(box(.014,.055,.12,C.blue,.005),-.063,.038,0));
    cap.position.set(.11,0,.19);cap.rotation.y=-.18;g.add(cap);return g;
  }, .65, { remakeOf: 'usb', flat: true }),
  gpt_receipt: item('접힌 장보기 영수증', 'shop', () => {
    const g=grp(), path=[[-.24,.045],[-.12,.045],[-.025,.115],[.065,.115],[.18,.025],[.28,.025]], half=.13,t=.012;
    // A continuous thick ribbon follows the folds; its underside and cut ends
    // are modelled too. Printed marks follow each local face instead of a box UV.
    const positions=[],indices=[];
    for(const [z,y]of path)positions.push(-half,y+t/2,z,half,y+t/2,z,-half,y-t/2,z,half,y-t/2,z);
    for(let i=0;i<path.length-1;i++){
      const a=i*4,b=a+4;
      indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);
    }
    indices.push(0,1,2,1,3,2);const end=(path.length-1)*4;indices.push(end,end+2,end+1,end+1,end+2,end+3);
    const paper=geo('gpt-folded-receipt',()=>{const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));b.setIndex(indices);b.computeVertexNormals();return b;});
    g.add(mesh(paper,mat(C.cream)));
    function mark(w,z,c=C.ink,d=.007,x=0){
      const i=Math.max(0,path.findIndex((p,j)=>j<path.length-1&&z>=p[0]&&z<=path[j+1][0]));
      const [z0,y0]=path[i],[z1,y1]=path[i+1],k=(z-z0)/(z1-z0),angle=Math.atan2(y1-y0,z1-z0);
      g.add(put(box(w,.003,d,c,.001),x,y0+(y1-y0)*k+t/2+.003,z,-angle));
    }
    mark(.12,-.203,C.red,.018);mark(.18,-.168,C.navy,.009);
    for(const [i,z]of[-.11,-.068,-.022,.024,.071,.12].entries()){
      mark(i%2?.105:.13,z,C.grey,.006,-.035);mark(.035,z,C.ink,.007,.084);
    }
    mark(.22,.158,C.navy,.004);mark(.10,.18,C.ink,.012,-.045);mark(.044,.18,C.red,.013,.082);
    for(let i=0;i<13;i++)mark(i%3===0?.007:.003,.232,C.ink,.035,-.083+i*.014);
    // Cream paper retains a warm edge that separates it from pale room floors.
    for(const x of[-half,half])for(let i=0;i<path.length-1;i++){
      const [z0,y0]=path[i],[z1,y1]=path[i+1];g.add(rod([x,y0,z0],[x,y1,z1],.0025,'#cabb8d'));
    }
    return g;
  }, .65, { remakeOf: 'receipt', flat: true }),
};
