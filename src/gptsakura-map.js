// Keep canonical station furniture keys for staging.js (barrier, freight train, hat and fishing bag).
export function registerGptStationMap(LAYOUTS,THEMES) {
  THEMES.gptsakura={...THEMES.station,name:'벚꽃역의 아침',gptStationFix:true,lamp:'#6f4b30',concrete:'#e7ded1',floorKind:'grass',floor:'#c2c1af',floor2:'#a2c8bb',bg:['#f8f3ec','#d4e2e5']};
  const at=(type,x,z,y=0,opts={})=>({type,x,z,y,opts});
  LAYOUTS.gptsakura={w:10,d:5,slab:'none',bleed:{fade:12},exact:true,walkRaised:true,yaw:.64,fitW:11.2,
    walls:{N:'none',W:'none',S:'none',E:'none'},theme:THEMES.gptsakura,
    petals:{n:24,from:[-.7,-2.8,2.8,-.8]},
    raised:[{i:0,j:0,w:8,d:2,h:.36,kind:'tile',a:'#fef2e1',b:'#f6e0bf',edge:'#eecfa3',trim:'#fcfcf4',strip:'#feb53d',step:false,stairs:[{side:'E',at:-.05,w:.6,steps:3}]}],
    furniture:[
      at('gpt_stationworld',0,0),
      at('gpt_stationlocal',0,-5.20),
      at('gpt_stationoffice',-4,-1.77,.36),
      at('platshelter',-1.6,-1.62,.36),
      at('gpt_stationvending',.35,-2.18,.36),
      at('gpt_stationlockers',1.87,-2.03,.36),
      {...at('treesakura',1.2,-3.0),s:1.5},
      at('gpt_sakuratimetable',.30,1.80),
      at('gpt_sakuragate',-2.50,1.00),
      at('tripbag',-1.38,-.66,.36),
      at('gpt_sakuracat',1.53,-.60,.36),
      at('train',-2.5,0,0,{kerb:false}),
      at('crossing',2.69,.83),at('crossing',3.95,-1.08,0,{flip:true}),
      at('streetlamp',2.7,-2.35,.36),
      at('gpt_suitcases',-.90,1.55),
    ],friendAt:[1.6,2.0]};
}
