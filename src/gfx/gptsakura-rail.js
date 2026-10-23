// The workshop's parked local and a second, independent passing line.
// The original `train` furniture remains the stage-27 crossing/arrival anchor.
import { grp, put, SHADOW } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const HP = Math.PI / 2;
// Reserve bevel geometry for the broad silhouettes; narrow frames and trim are already chunky.
const box=(w,h,d,r=.02)=>r>=.04?G.box(w,h,d,r):G.pbox(w,h,d);
const C = { cream:'#fef2e1', pale:'#f6e0bf', sage:'#84ae9d', green:'#649b88',
  wood:'#eaa440', brown:'#6f4b30', steel:'#b8b39e', glass:'#b0e5e8', pink:'#f3967a' };

// One deterministic pose: no timers, spawned meshes, materials, or textures per trip.
export function stationPassPose(time) {
  const t = Math.max(0, Number.isFinite(time) ? time : 0), cycle = Math.floor(t / 24), phase = t % 24;
  const active = phase >= 4 && phase < 10, u = Math.max(0, Math.min(1, (phase - 4) / 6));
  const direction = cycle % 2 ? -1 : 1;
  return { active, cycle, phase, x: direction * (-19 + 38 * u) || 0, yaw: direction > 0 ? 0 : Math.PI };
}

function localCoach() {
  const car = grp(); car.name = 'gpt-parked-local';
  const body = mc('gpt-station-local-v1', ({add,tube}) => {
    // A real floor and hollow cabin. The front half of the roof is cut away,
    // so the open doors lead to seats/aisle rather than a painted dark panel.
    add(box(6.2,.13,1.54,.06),C.green,0,.345,0);
    add(box(5.92,.055,1.39,.025),C.pale,0,.438,0);
    for (const x of [-2.83,2.83]) {
      add(box(.13,2.26,1.48,.055),C.cream,x,1.60,0);
      add(box(.15,.53,1.19,.045),C.glass,x,2.0,.015);
      add(box(.16,.085,1.32,.025),C.sage,x,1.08,0);
      for(const z of [-.47,.47]) add(G.cyl(.075,.075,.045,12),C.wood,x+(x>0?.086:-.086),.83,z,0,0,HP);
      add(box(.17,.12,1.22,.025),C.brown,x,.50,0);
    }
    // The back wall has genuine window openings between its posts.
    add(box(5.6,.52,.075,.025),C.sage,0,.70,-.724);
    add(box(5.6,.15,.075,.025),C.cream,0,2.595,-.724);
    for(const x of [-2.66,-1.72,-.76,.2,1.16,2.12,2.66]) {
      add(box(.075,1.62,.075,.018),C.cream,x,1.71,-.724);
    }
    // Front wall: two .92m door openings and two broad open windows.
    for(const [a,b] of [[-2.76,-1.76],[-.84,.84],[1.76,2.76]]) {
      const x=(a+b)/2,w=b-a;
      add(box(w,.53,.075,.025),C.sage,x,.70,.724);
      add(box(w,.10,.075,.025),C.cream,x,2.57,.724);
      for(const xx of [a+.035,b-.035]) add(box(.07,1.62,.075,.018),C.cream,xx,1.71,.724);
      add(box(w-.08,.045,.09,.015),C.pink,x,1.04,.735);
    }
    // Only the far roof remains: its rounded edge exposes the cabin in dollhouse view.
    add(box(5.89,.15,.78,.075),C.cream,0,2.70,-.365);
    add(box(5.92,.075,.08,.035),C.green,0,2.69,.02);
    for(const x of [-1.5,1.5]) add(box(.63,.13,.44,.045),C.steel,x,2.82,-.43);
    // Seats share the game's ~.58m seat height relative to their own cabin floor.
    for(const x of [-2.15,0,2.15]) {
      add(box(.88,.16,.32,.055),C.pink,x,.966,-.47);
      add(box(.88,.51,.10,.045),C.pink,x,1.246,-.62);
      for(const xx of [x-.33,x+.33]) add(box(.055,.41,.22,.018),C.brown,xx,.68,-.47);
    }
    for(const x of [-.4,.4]) {
      tube([x,.47,-.14],[x,2.54,-.14],.022,C.steel,8);
      add(G.tor(.055,.014,Math.PI*2,6,12),C.brown,x,2.31,-.06);
      add(box(.035,.20,.028,.012),C.brown,x,2.47,-.06);
    }
    // A readable route badge uses geometry; no clipped sign texture.
    add(box(.48,.24,.025,.045),C.green,2.91,1.30,.34,0,HP,0);
    for(const x of [-2.04,2.04]) {
      add(box(.76,.15,1.17,.04),C.brown,x,.20,0);
      for(const xx of [x-.24,x+.24]) for(const z of [-.61,.61]) {
        add(G.cyl(.17,.17,.08,12),C.brown,xx,.17,z,HP,0,0);
        add(G.cyl(.07,.07,.085,10),C.steel,xx,.17,z,HP,0,0);
      }
    }
  });
  car.add(body);
  return car;
}

export function buildStationRail(f) {
  // Both lines are outside the original 10x5m playable grid. They do not
  // introduce planner spots or a new walking island behind the station.
  f.noSolid = true; f.collideBox = [0,0,0,0,0,0];
  const local = localCoach(); f.add(local); (f.live ||= []).push(local); f.localTrain = local;
  const leaves = [];
  for(const center of [-1.30,1.30]) for(const s of [-1,1]) {
    const leaf = grp(); put(leaf,center+s*.228,.46,.78); local.add(leaf); f.live.push(leaf);
    leaf.add(mc('gpt-station-local-door-v1',({add})=>{
      add(box(.45,.64,.07,.03),C.sage,0,.32,0);
      for(const x of [-.202,.202]) add(box(.045,1.18,.07,.015),C.cream,x,1.23,0);
      add(box(.45,.075,.07,.018),C.cream,0,1.79,0);
      add(box(.45,.07,.07,.015),C.cream,0,.66,0);
      add(box(.03,.17,.04,.012),C.brown,-s*.14,.93,.055);
    }));
    // 2.05m leaf from the sill; usable clear height above the cabin floor is 2.0545m.
    leaf.scale.y=2.05/1.8275;
    leaves.push({leaf,center,s});
  }
  const doors = f.part('door',leaves.map(r=>r.leaf),t=>{
    leaves.forEach(({leaf,center,s})=>{leaf.position.x=center+s*(.228+.49*t);});
  },{label:'정차 열차 열린 출입문',sfx:'slide',dur:.55});
  doors.noHide = true; doors.gptStartOpen = true; doors.setOpen(1); f.localDoors = doors;
  f.gptSizeAudit={trainSeatHeight:.5805,doorClearHeight:2.0545};
  f.gptSmallAudit=[{label:'열차 손잡이',height:.138,width:.138,depth:.0242},{label:'행선 배지',height:.24,width:.48,depth:.025}];
  f.railInfo = { floor:.4655, seat:1.046, doorHeight:2.0545, doorClearWidth:.920,
    localTrackZ:-5.20, passingTrackZ:-7.48, period:24, passDuration:6,
    cameraSideRoofCut:true, sceneryOnly:true };
  // Low, continuous track beds plus the rear platform meet the actual door sill.
  f.add(mc('gpt-station-parallel-tracks-v1',({add})=>{
    for(const z of [0,-2.28]) {
      add(G.pbox(40,.045,1.76),'#e8d7b7',0,.01,z);
      for(let x=-19.8;x<20;x+=.6) add(G.pbox(.14,.05,1.52),'#a09769',x,.048,z);
      for(const zz of [-.61,.61]) add(G.pbox(40,.065,.045),C.steel,0,.09,z+zz);
    }
    add(box(7.7,.36,1.78,.025),'#e8d7b7',-.45,.18,1.72);
    add(G.pbox(7.65,.018,.14),'#feb53d',-.45,.369,.92);
    add(G.pbox(7.65,.016,.035),C.cream,-.45,.37,.86);
    for(let x=-4.1;x<3.3;x+=.25) for(const z of [.88,.93]) add(G.cyl(.015,.015,.012,6),C.wood,x,.383,z);
  }));
  // Two simple joined commuter cars on the OTHER line, reused for every pass.
  const passing = grp(); passing.name='gpt-periodic-train'; f.add(passing); f.live.push(passing); f.passingTrain=passing;
  passing.add(mc('gpt-station-passing-pair-v1',({add})=>{
    for(const cx of [-2.48,2.48]) {
      add(box(4.65,.54,1.45,.10),C.sage,cx,.72,0);
      add(box(4.62,1.45,1.43,.09),C.cream,cx,1.75,0);
      add(box(4.66,.13,1.47,.065),C.green,cx,2.54,0);
      add(box(4.69,.07,1.48,.025),C.pink,cx,1.02,0);
      for(const x of [-1.67,-.98,-.29,.4,1.09,1.78]) for(const z of [-.727,.727]) {
        add(box(.47,.62,.025,.03),C.glass,cx+x,1.84,z);
      }
      for(const bx of [-1.43,1.43]) for(const z of [-.61,.61]) {
        add(G.cyl(.17,.17,.08,10),C.brown,cx+bx,.20,z,HP,0,0);
      }
    }
    add(box(.32,.7,1.09,.035),C.steel,0,1.01,0);
    for(const x of [-.1,0,.1]) add(box(.035,1.17,1.22,.015),C.brown,x,1.13,0);
  }));
  passing.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  f.setRailTime = t => {
    const pose=stationPassPose(t),old=passing.visible;
    passing.visible=pose.active; passing.position.set(pose.x,0,-2.28); passing.rotation.y=pose.yaw;
    f.railPose=pose; if(old!==passing.visible||pose.active) SHADOW.moved=true;
    return pose;
  };
  f.idle = t => f.setRailTime(f.railPreviewTime ?? t);
  f.setRailTime(0);
}

export const STATION_RAIL_INFO = { w:1,d:1,name:'승강장 정차 열차와 다른 선로',hidden:true };
