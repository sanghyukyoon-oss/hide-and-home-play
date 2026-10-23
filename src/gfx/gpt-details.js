// Isolated art layer for the nine selected maps. No stage/device/walk data changes.
import { addHomeDetails } from './gpt-details-home.js';
import { addTownDetails } from './gpt-details-town.js';
import { addTravelDetails } from './gpt-details-travel.js';

const KEYS = ['gptotakumix','firestation2','gptvillaroof','gptpolicefront','gptalley','gptcornershop','gptdoghouse','gptstation','gpttraincar2'];
export function installGptDetails(MAPS, LAYOUTS) {
  const mark=(layout,key,index=0)=>({...layout,gptDetailKey:key,gptDetailIndex:index});
  for(const key of KEYS){
    if(MAPS[key]){
      const original=MAPS[key];
      MAPS[key]=(...args)=>{
        const map=original(...args);
        return {...map,rooms:map.rooms.map((r,i)=>({...r,layout:mark(r.layout,key,i)}))};
      };
    } else if(LAYOUTS[key]) LAYOUTS[key]=mark(LAYOUTS[key],key);
  }
}
export function addGptDetails(room) {
  if(!room.L.gptDetailKey || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('gptdetail')==='0')) return;
  const args=[room,room.L.gptDetailKey,room.L.gptDetailIndex||0];
  addHomeDetails(...args); addTownDetails(...args); addTravelDetails(...args);
}
