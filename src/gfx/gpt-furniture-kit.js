// GPT prop workshop: shared solid geometry details. Every visible panel has thickness;
// boxes which open are separate walls, never a solid box hidden behind a moving face.
import * as THREE from 'three';
import { HG as G, hmc as mc } from './house-props.js';
import { grp, put } from './kit.js';
export { THREE, G, mc, grp, put };
export const PI = Math.PI, HP = PI / 2;
export const C = {
  cream: '#fdf6da', white: '#fefde9', liner: '#feebc8', wood: '#f8b15b', edge: '#c67f2a',
  sage: '#a2c8bb', mint: '#76b5a2', sky: '#80c2e1', blue: '#4f86b0', coral: '#f28b6a',
  yellow: '#f9c25e', pink: '#f7a8b8', lilac: '#e8a7b3', dark: '#644936', steel: '#afbfb4',
  navy: '#34626a', brown: '#97663e', leaf: '#889a66', soil: '#6f4b30', paper: '#fefde9',
};
export const box = (a, w, h, d, c, x = 0, y = h / 2, z = 0, r = .025, rx = 0, ry = 0, rz = 0) => a(G.box(w, h, d, r, 2), c, x, y, z, rx, ry, rz);
export const ball = (a, r, c, x, y, z, scale = 1) => a(G.sph(r, 12, 8), c, x, y, z, 0, 0, 0, scale);
export const cyl = (a, r, h, c, x, y, z, rx = 0, rz = 0, rt = r) => a(G.cyl(rt, r, h, 16), c, x, y, z, rx, 0, rz);
export const ring = (a, r, t, c, x, y, z, rx = 0, ry = 0, rz = 0, arc = PI * 2) => a(G.tor(r, t, arc, 5, 24), c, x, y, z, rx, ry, rz);
export function feet(a, w, d, y = .12, c = C.edge, z = 0) {
  for (const x of [-w / 2 + .08, w / 2 - .08]) for (const zz of [-d / 2 + .07, d / 2 - .07]) box(a, .075, y, .075, c, x, y / 2, z + zz, .017);
}
export function shell(a, w, h, d, y = .1, z = 0, c = C.cream, top = true, back = C.liner, t = .055) {
  box(a, w, t, d, c, 0, y + t / 2, z);
  box(a, w - t * 2, h - t, t, back, 0, y + h / 2 + t / 2, z - d / 2 + t / 2, .012);
  for (const s of [-1, 1]) box(a, t, h - t, d, c, s * (w - t) / 2, y + h / 2 + t / 2, z, .018);
  if (top) box(a, w - t * 2, t, d - t, c, 0, y + h - t / 2, z + t / 2, .018);
}
// A lid-opening container needs this fourth wall; shell() leaves its front free for cabinet doors.
export function frontWall(a,w,h,d,y=.1,z=0,c=C.cream,t=.055) {
  box(a,w-t*2,h-t,t,c,0,y+(h+t)/2,z+(d-t)/2,.018);
}
// The wall of a drum/vessel seen from its cavity: reverse winding as well as normals.
export function insideCylinder(a,rt,rb,h,c,x,y,z,rx=0,seg=24) {
  const g=G.cyl(rt,rb,h,seg,true),idx=g.index.array,n=g.attributes.normal;
  for(let i=0;i<idx.length;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t;}
  for(let i=0;i<n.count;i++)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));
  a(g,c,x,y,z,rx);
}
export function shelf(a, w, d, y, z = 0, c = C.wood) { box(a, w, .045, d, c, 0, y - .0225, z, .012); }
export function handle(a, x, y, z, w = .18, c = C.edge, horizontal = true) {
  const h = horizontal ? .03 : w, ww = horizontal ? w : .03;
  for (const s of [-1, 1]) box(a, .025, .025, .045, c, x + (horizontal ? s * (w - .03) / 2 : 0), y + (horizontal ? 0 : s * (w - .03) / 2), z + .022);
  box(a, ww, h, .035, c, x, y, z + .05, .015);
}
export function door(f, key, w, h, x, y, z, color = C.sage, detail = null, direction = 1) {
  const p = grp(); put(p, x - direction * w / 2, y, z); f.add(p);
  p.add(mc(key + '|door|' + direction, ({ add, tube }) => {
    box(add, w - .008, h - .008, .065, color, direction * w / 2, 0, 0, .028);
    handle(add, direction * (w - .085), 0, .033, Math.min(.22, h * .34), C.edge, false);
    for (const yy of [-h * .3, h * .3]) cyl(add, .023, .075, C.steel, 0, yy, 0);
    if (detail) detail(add, direction * w / 2, tube);
  }));
  const part = f.part('door', p, t => { p.rotation.y = -direction * 1.85 * t; }, { label: '수납장 문', sfx: 'open', dur: .32 });
  return part;
}
export function doubleDoor(f, key, w, h, y, z, color = C.sage, detail = null) {
  const ps = [-1, 1].map(s => door(f, key + s, w / 2, h, s * w / 4, y, z, color, detail, -s));
  // Keep one interaction for the pair; the independent pivots stay properly tagged by Furn.finalize.
  f.parts.splice(f.parts.length - 2, 2);
  const pv = ps.map(p => p.pivots[0]);
  return f.part('door', pv, t => { pv[0].rotation.y = -1.8 * t; pv[1].rotation.y = 1.8 * t; }, { label: '양문 수납장', dur: .32 });
}
export function lid(f, key, w, d, y, z = 0, color = C.wood, detail = null) {
  const p = grp(); put(p, 0, y, z - d / 2); f.add(p);
  p.add(mc(key + '|lid', ({ add, tube }) => {
    box(add, w, .075, d, color, 0, .0375, d / 2, .035);
    if (detail) detail(add, tube, d);
  }));
  return f.part('lid', p, t => { p.rotation.x = -1.8 * t; }, { label: '상자 뚜껑', dur: .32 });
}
export function pullOutTray(f,p,s,frontZ,options) {
  const o={w:.34,d:.24,up:0,...options},tray=f.pullOut(p,s,frontZ,o),start=tray.position.clone();
  const register=g=>{g.userData.base={p:g.position.clone(),r:g.rotation.clone(),s:g.scale.clone()};p.pivots.push(g);};
  // bakeStatic only preserves registered moving pivots. Keep tray decor with the tray.
  register(tray);
  const guide=grp(),mount=grp(),vertical=o.up>0,offset=o.w*.34;
  guide.name='gpt-tray-guide';mount.name='gpt-tray-guide-mount';
  guide.position.copy(start);mount.position.copy(start);tray.parent.add(guide,mount);
  let rest,stroke;
  if(vertical){
    const base=o.supportBaseY??start.y-.025;
    guide.position.y=base;mount.position.y=base;
    rest=Math.max(.004,start.y-.01-base);stroke=o.up;
    guide.add(mc('gpt-tray-guide|vertical|'+o.w,({add})=>{
      for(const x of [-offset,offset])box(add,.024,1,.024,C.steel,x,.5,0,.005);
    }));
    mount.add(mc('gpt-tray-mount|vertical|'+o.w,({add})=>{
      for(const x of [-offset,offset])box(add,.055,.012,.065,C.steel,x,.006,0,.004);
    }));
    guide.scale.y=rest;
  }else{
    rest=Math.min(.08,o.d*.3);stroke=Math.max(.1,frontZ-start.z+o.d/2+.04);
    guide.add(mc('gpt-tray-guide|horizontal|'+o.w,({add})=>{
      for(const x of [-offset,offset])box(add,.024,.025,1,C.steel,x,-.0225,.5,.005);
    }));
    mount.add(mc('gpt-tray-mount|horizontal|'+o.w,({add})=>{
      for(const x of [-offset,offset])box(add,.055,.05,.08,C.steel,x,-.039,.01,.005);
    }));
    guide.scale.z=rest;
  }
  // New hardware is fully retracted/hidden at t=0, preserving the existing closed silhouette.
  guide.visible=mount.visible=false;register(guide);register(mount);
  const apply=p.apply;
  p.apply=(t,...bases)=>{
    apply(t,...bases);
    guide.scale[vertical?'y':'z']=rest+stroke*t;
    guide.visible=mount.visible=t>.0001;
  };
  return tray;
}
export function drawer(f, key, w, h, d, x, y, z, color = C.wood, fill = null) {
  const p = grp(); put(p, x, y, z); f.add(p);
  p.add(mc(key + '|drawer', ({ add, tube }) => {
    box(add, w, .04, d, C.wood, 0, .02, -d / 2);
    for (const s of [-1, 1]) box(add, .035, h - .04, d - .035, C.wood, s * (w - .035) / 2, (h + .04) / 2, -(d + .035) / 2);
    box(add, w - .07, h - .04, .035, C.wood, 0, (h + .04) / 2, -d + .0175);
    box(add, w + .03, h, .065, color, 0, h / 2, .015, .023);
    handle(add, 0, h / 2, .048, Math.min(.22, w / 2));
    if (fill) fill(add, tube);
  }));
  const part = f.part('drawer', p, t => { p.position.z = z + Math.min(d * .82, .46) * t; }, { label: '서랍', dur: .3 });
  const s=f.spot('inside', p, w * .22, .065, -d * .4, { part, maxH: h - .08, scale: .65, label: '서랍 안' });
  // A small organizer tray rises with the opened drawer, so its contents clear the front lip.
  pullOutTray(f,part,s,z,{w:w*.36,d:d*.55,color:C.cream,up:Math.min(.085,h*.4)});
  return part;
}
export function bottle(a, x, y, z, c = C.mint, s = 1) {
  cyl(a, .055 * s, .16 * s, c, x, y + .08 * s, z, 0, 0, .05 * s);
  cyl(a, .031 * s, .065 * s, c, x, y + .1925 * s, z);
  cyl(a, .034 * s, .027 * s, C.cream, x, y + .2385 * s, z);
  box(a, .083 * s, .073 * s, .009 * s, C.paper, x, y + .088 * s, z + .052 * s, .007);
}
export function can(a, x, y, z, c = C.coral, s = 1) {
  cyl(a, .05 * s, .14 * s, c, x, y + .07 * s, z);
  for (const yy of [.008, .135]) cyl(a, .051 * s, .012 * s, C.steel, x, y + yy * s, z);
  box(a, .07 * s, .045 * s, .009 * s, C.paper, x, y + .075 * s, z + .048 * s, .006);
}
export function book(a, x, y, z, c = C.coral, h = .3, w = .09, d = .22, angle = 0) {
  box(a, w, h, d, C.paper, x, y + h / 2, z, .008, 0, 0, angle);
  for (const s of [-1, 1]) box(a, .014, h + .014, d + .012, c, x + s * w / 2, y + h / 2, z, .006, 0, 0, angle);
  box(a, w + .02, h + .014, .025, c, x, y + h / 2, z + d / 2, .008, 0, 0, angle);
  box(a, w * .7, .025, .008, C.cream, x, y + h * .7, z + d / 2 + .015, .003);
}
export function folded(a, x, y, z, c = C.sky, w = .3, d = .25) {
  box(a, w, .075, d, c, x, y + .0375, z, .035);
  box(a, w * .82, .015, .012, C.cream, x, y + .048, z + d / 2 + .008, .004);
}
export function shoe(a, x, y, z, c = C.coral, s = 1) {
  box(a, .105 * s, .035 * s, .25 * s, C.cream, x, y + .0175 * s, z, .017);
  box(a, .099 * s, .08 * s, .19 * s, c, x, y + .065 * s, z - .02 * s, .035);
  box(a, .095 * s, .05 * s, .1 * s, c, x, y + .053 * s, z + .06 * s, .025);
  for (const zz of [-.02, .02, .06]) box(a, .06 * s, .012 * s, .012 * s, C.paper, x, y + .101 * s, z + zz * s, .004);
}
export function plant(a, x, y, z, c = C.coral, s = 1) {
  cyl(a, .09 * s, .14 * s, c, x, y + .07 * s, z, 0, 0, .115 * s);
  cyl(a, .097 * s, .014 * s, C.soil, x, y + .145 * s, z);
  for (let k = 0; k < 6; k++) {
    const ang = k * PI / 3;
    a(G.sph(.07 * s, 8, 6), k % 2 ? C.leaf : C.sage, x + Math.cos(ang) * .075 * s, y + (.21 + k % 2 * .04) * s, z + Math.sin(ang) * .075 * s, 0, -ang, -.5, [1.3, .45, .8]);
  }
  ball(a, .065 * s, C.leaf, x, y + .26 * s, z, [.8, 1.2, .8]);
}
export function wheel(a, x, y, z, r = .11, side = true) {
  cyl(a, r, .07, C.dark, x, y, z, side ? 0 : HP, side ? HP : 0);
  cyl(a, r * .62, .082, C.steel, x, y, z, side ? 0 : HP, side ? HP : 0);
  cyl(a, r * .2, .09, C.cream, x, y, z, side ? 0 : HP, side ? HP : 0);
}
export function mug(a, x, y, z, c = C.yellow, s = 1) {
  a(G.cyl(.07 * s, .06 * s, .13 * s, 16, true), c, x, y + .065 * s, z);
  cyl(a, .06 * s, .02 * s, C.brown, x, y + .105 * s, z);
  ring(a, .043 * s, .014 * s, c, x + .075 * s, y + .07 * s, z, 0, HP);
}
export function bread(a, x, y, z, s = 1) {
  ball(a, .12 * s, C.wood, x, y + .08 * s, z, [1, .66, .72]);
  for (const xx of [-.045, .015, .065]) box(a, .02 * s, .009 * s, .1 * s, C.paper, x + xx * s, y + .158 * s, z, .004, 0, .3);
}
export function basket(a, w, h, d, x = 0, y = 0, z = 0, color = C.wood) {
  box(a, w, .045, d, color, x, y + .0225, z);
  for (const ss of [-1, 1]) {
    box(a, .045, h, d, color, x + ss * (w - .045) / 2, y + h / 2, z);
    box(a, w - .09, h, .04, color, x, y + h / 2, z + ss * (d - .04) / 2);
    for (let k = 1; k < 4; k++) box(a, w + .008, .014, .008, C.edge, x, y + h * k / 4, z + ss * d / 2, .004);
    for (let k = 1; k < 7; k++) box(a, .012, h, .009, C.paper, x - w / 2 + k * w / 7, y + h / 2, z + ss * (d / 2 + .004), .003);
  }
}
export const info = (name, theme, w = 1, d = 1, open = false, description = '') => ({ name, w, d, price: 0, hidden: true, region: theme, theme, open, description });
