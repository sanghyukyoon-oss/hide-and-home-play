// Stage-local art substitutions. Keep semantic furniture types: planners, affinity and locks depend on them.
// (⑥ 10/22: the user's picks — 24·25·31·32·34·37판의 맵; 33 승강기·38 승강기('이전 게 더 낫다')·39 건조기는 뺌)
// (10/22 허브 들여오기 규칙: GPT 걷기 엔진(gpt-hero-navigation.js)은 빼고 정본 walkGrid로 걷는다)
import { GPT_STREET_BUILDERS, GPT_STREET_INFO } from './gfx/gpt-hero-street.js';
import { GPT_INDOOR_BUILDERS, GPT_INDOOR_INFO } from './gfx/gpt-hero-indoor.js';

export const GPT_HERO_BUILDERS={...GPT_STREET_BUILDERS,...GPT_INDOOR_BUILDERS};
export const GPT_HERO_INFO=Object.fromEntries(Object.entries({...GPT_STREET_INFO,...GPT_INDOOR_INFO})
  .map(([key,info])=>[key,{...info,hidden:true}])); // Campaign art; avoid extra shop entries and boot thumbnails.
// map key → the piece it dresses: the hero goes with its map, not a stage number (10/22 허브: ② moves the 31~39 numbers —
// 31 긴 객실·32 벚꽃역 in, 33 빨래방 out — so 31·32·34·37판 become 33·34·35·38판)
// (10/22 18시 사용자 시트 결정 — _handoff/gpt-compare-picks-1022.md: 24 보드 정비대(색 손봄)·34 다이얼 냉동고만 채택. 33 계단은 ⑥ 벽화
// 계단(heroes.js), 35 파르페 진열장은 원본 유지, 25 바구니 도르래·38 무지개 서가는 안 고름 — 그 모델들은 키로만 남음)
export const GPT_HERO_SWAPS={
  skatepark:{source:'boardrack',key:'gpt_hero_boardstation',name:'보드킹 정비 보관대'},
  konbini:{source:'icecreamchest',key:'gpt_hero_dialfreezer',name:'토큰 다이얼 냉동고'},
};

export function heroLayout(room,layout,{enabled=true}={}) {
  const sw=GPT_HERO_SWAPS[room];
  if (!enabled || !sw || !layout) return layout;
  let seen=0;
  const apply=L=>{
    const field=sw.decor?'decor':'furniture';
    const rack=(L.furniture||[]).find(f=>f.type==='boardrack'&&f.i===6&&f.j===0), cone=(L.furniture||[]).find(f=>f.type==='cones'&&f.i===0&&f.j===2);
    const visibleSkateSwap=room==='skatepark'&&rack&&cone;
    return {...L,[field]:(L[field]||[]).map(f=>{
      // Same occupied 1x1 cells: the original rear rack is outside the portrait start camera.
      // (⑥ 10/22 사용자 "각도도 잘 맞춰주고": by the west fence the rack stood facing north, side-on to the fence —
      // turned a quarter so its back is on the fence and its boards face the yard)
      if(visibleSkateSwap && f===rack) f={...f,i:0,j:2,rot:1};
      else if(visibleSkateSwap && f===cone) f={...f,i:6,j:0};
      // Director's later walkability requirement: open the real .52m throat to the existing street apron.
      // The original layout and all hiding/part counts remain available with ?heroes=0.
      if(room==='alley3' && field==='furniture' && f.type==='clothesline') f={...f,dx:(f.dx||0)+.25,dz:(f.dz||0)-.125};
      if(room==='skatepark' && field==='furniture' && f.type==='quarterpipe') f={...f,dz:(f.dz||0)+.35};
      if(room==='alleywide' && field==='furniture' && f.type==='stairs') f={...f,dz:(f.dz||0)+.15};
      if(f.type!==sw.source) return f;
      const n=seen++;
      return n===(sw.nth??0)?{...f,opts:{...f.opts,gptHero:sw.key}}:f;
    })};
  };
  return layout.rooms?{...layout,rooms:layout.rooms.map(r=>({...r,layout:apply(r.layout)}))}:apply(layout);
}
