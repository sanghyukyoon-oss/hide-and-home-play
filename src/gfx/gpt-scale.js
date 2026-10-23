// 스케일 맞춤 (① 10/22 — 사용자 "GPT가 한 거 우리 거랑 스케일감이 약간 달라서", 26판 멍뭉이네 "스케일이 안 맞는 게 많다"):
// GPT 가구를 우리 크기로 맞춘다. 모양만 키우거나 줄이고, 그 안·위에 숨기는 우리 물건은 우리 크기 그대로 둔다.
// (가구를 통째로 키우면 그 속 물건도 같이 커져서, 물건이 거인처럼 보이는 비율이 그대로 남는다)
// 기준 — 우리 같은 종류를 잰 값 (_lab/measure.mjs, 1.0.173):
//   캐릭터 0.56~0.6 m (몽글이 .56, 냥냥이 .60) · 의자 좌판 .52~.55 · 벤치 .47~.55 · 탁자 .69~.77 · 책상 .80
//   옷장·냉장고·책장 2.07~2.15 · 사물함 1.86 · 자판기 1.72 · 신발장 1.34 · 드럼 세탁기 1.11 · 문 1.9
// 쓰는 법: scaleBuilders(BUILDERS, { key: 배율 }) — 등록 전에 감싸 둔다. 배율 1이면 건드리지 않는다.
import * as THREE from 'three';

// a built piece, its shape scaled by s about its origin (on the floor): the group's own scale stays free for 배치 편집 (room.fine),
// each hiding place keeps our things at our size (spot.scale ÷ s), and the boxes it collides with / hangs a lock on follow the shape
export function scaleFurn(f, s) {
  if (!s || s === 1) return f;
  const inner = new THREE.Group(); inner.name = 'gpt-scale';
  for (const c of [...f.group.children]) inner.add(c);
  inner.scale.setScalar(s); f.group.add(inner);
  for (const sp of f.spots) sp.scale = (sp.scale ?? 1) / s;
  if (Array.isArray(f.collideBox)) f.collideBox = f.collideBox.map(v => v * s);
  for (const L of [f.lockAt, ...f.parts.map(p => p.lockAt)]) if (L && !L.parent && L.x != null) { L.x *= s; L.y *= s; L.z *= s; }
  f.gptScale = s;
  return f;
}
export function scaleBuilders(B, table) {
  for (const [k, s] of Object.entries(table)) {
    const b = B[k]; if (!b || !s || s === 1) continue;
    B[k] = (f, ...a) => { const r = b(f, ...a); scaleFurn(f, s); return r; };
  }
  return B;
}

// 맵별 배율 (이번 넷: 우리와 같은 크기로 지어져 맵 전체 배율은 1 — 재 본 값은 _handoff 표) · 낱개 손질
export const MAP_SCALE = { gptotaku: 1, gptotaku2: 1, gptstation: 1, gptseastation: 1, gpttraincar: 1, gptroom1: 1, gptroom2: 1, gptroom3: 1 };
export const PIECE_SCALE = {
  gptlaundrywasher: .88,    // 1.31 m → 1.15 (우리 드럼 세탁기 1.11 — 빨래방 것이라 조금 크게)
  gpt_storycabinet: .88,    // 2.44 m → 2.15 (우리 옷장·책장 높이)
  // gpt_tc_bench: .8 — 기차 좌석 좌판 0.78 → 0.62 (우리 0.55), gpttraincar-props.js에서 감쌈
};
