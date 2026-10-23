// 공통 룩 키트 (① 10/22 — 사용자 "아트 전반적으로 채색과 텍스처 제대로", "배경도 그 26처럼"): 바깥 판(19·20·21·23·25·27)은 26판 멍뭉이네의
// 동네 배경(흐린 청록 큰 집들이 둘러싼 동네 + 길 + 부드러운 하늘, gfx/gpt2c-dog-surround.js gptneighborhood)을 같이 쓴다.
// 판마다 다른 건 집 벽·지붕 색(그 판 orig 배색에서), 좌우 뒤집기, 높이뿐. 하늘은 look.js townRecipe.
export const TOWN_SKY = ['#72c6e3', '#9fd9e4', '#90d4d1'];
export const TOWN = { gptSky: '#6bc7eb', gptGround: '#4cae9b', gptPaving: '#8fc6d5' };
// the theme a stage's town backdrop reads (o: townWalls, townRoofs, townFlip, townY …)
export const townTheme = (T, o = {}) => ({ ...T, ...TOWN, ...o });
// a layout with the town backdrop as one more (scenery-only) piece at the room's middle
export const withTown = L => ({ ...L, furniture: [...(L.furniture || []), { type: 'gptneighborhood', x: 0, z: 0, a: 0 }] });
