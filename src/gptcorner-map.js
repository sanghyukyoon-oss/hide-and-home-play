// Workshop-only map definition. Registration is explicit; campaign layouts stay untouched.
export const GPT_CORNER_THEME={
  // (색 다시 맞춤 ① 10/22: 베이지 바닥·벽 → 회색 포장·중성 벽·하늘 배경)
  name:'모퉁이 상점집',friend:'cat',bg:['#f2dcbc','#fef2e1'],base:'#e8d7b7',asphalt:'#a7a595',
  floorKind:'checker',floor:'#f6e0bf',floor2:'#e8d7b7',wallKind:'plain',wall:'#fef2e1',wall2:'#f2dcbc',wainscot:'#a2c8bb',trim:'#fefde9',wallEdge:'#feebc8',
  wood:'#eecfa3',woodD:'#c67f2a',fwood:'#eecfa3',fwoodD:'#c67f2a',body:'#fef2e1',accent:'#84ae9d',accent2:'#ee9d4c',accent3:'#eaa440',
  door:'#a2c8bb',knob:'#eaa440',sheet:'#fefde9',pillow:'#feebc8',fabric:'#84ae9d',fabric2:'#d4e2e5',curtain:'#eecfa3',rug:'#d4e2e5',rug2:'#fef2e1',pot:'#ee9d4c',top:'#fef2e1'
};
const at=(type,x,z,opts={},y=0)=>({type,x,z,a:0,opts,y});
const open={N:'none',W:'none',S:'none',E:'none'};
export function gptCornerMap(){
  const T=GPT_CORNER_THEME;
  return {theme:T,friendAt:[-.7,1.8],bleed:false,fitAll:true,nBonus:0,gptNavigation:true,rooms:[
    {at:[0,0],level:0,layout:{w:9,d:8,theme:T,walls:open,wallH:2.8,slab:'none',exact:true,tidy:false,noEntry:true,
      floorZones:[{i:0,j:7,w:9,d:1,kind:'asphalt',a:'#a7a595',b:'#c6c393'},{i:8,j:0,w:1,d:7,kind:'asphalt',a:'#a7a595',b:'#c6c393'}],
      furniture:[at('gpt_foundation',0,0),at('gpt_shopframe',-1,-.9),at('gpt_stairs',2.38,.08),
        at('gpt_goods',-0.95,-0.55),at('gpt_cooler',0.99,0.2),{...at('gpt_till',-3.04,0.5),a:Math.PI/2},
        at('gpt_shutter',.42,1.55),at('gpt_dumbwaiter',1,-.83),at('gpt_roofbasket',3.7,-.55),
        at('gpt_gacha',0.85,1.8),at('gpt_sign',-3.1,1.75),at('gpt_sleepcat',-1.6,3.5),
        at('gpt_planter',-3.85,3.3),at('gpt_planter',-2.9,3.35),at('gpt_utilitypole',3.63,-3)],decor:[]}},
    {at:[-1,-1.8],level:1,layout:{w:5,d:3,theme:{...T,base:'#eecfa3',floorKind:'planks',floor:'#f6e0bf',floor2:'#eecfa3',wallKind:'stripe',wall:'#fef2e1',wall2:'#feebc8',wainscot:'#d4e2e5'},
      wallH:2.15,walls:{N:'wall',W:'wall',S:'none',E:'none'},slab:'cut',noEntry:true,cut:[{i:4,j:2,w:1,d:1}],exact:true,tidy:false,
      furniture:[at('gpt_homebed',-1.42,-.26),at('gpt_homedesk',.56,-.9),at('gpt_homelife',1.96,-.9),at('gpt_homelaundry',-2,1.15),at('gpt_roof',0,0)],
      decor:[{type:'window',wall:'N',u:-1.48},{type:'picture',wall:'N',u:.4}]}},
    {at:[2.5,-2.3],level:1,layout:{w:2,d:2,theme:{...T,base:'#eecfa3',floorKind:'tile',floor:'#e8d7b7',floor2:'#f2dcbc'},
      slab:'cut',wallH:1,walls:{N:'rail',W:'none',E:'rail',S:'none'},exact:true,tidy:false,
      furniture:[at('gpt_watertank',.32,-.38),{...at('gpt_planter',-.67,-.5),s:.65}],decor:[]}}
  ]};
}
