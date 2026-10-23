// 기차 여행 2차 (GPT 작업장 gpt-station fix-1022 — 27판 봄 아침 기차역 · 28판 두 량 객차 · 해변 도착역 · 소품 23종, ① 10/22 들여옴):
// 그 작업장 빌더들이 같이 쓰는 손질. 간판 글자는 우리 fitText로(게임 글꼴·칸 82 % 맞춤·영어 화면은 tr) — 작업장의 textLayout 측정은 뺌.
import * as THREE from 'three';
import { put, mesh, mat, texCache } from './kit.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

// 간판·라벨의 새 낱말 (사전에 없을 때만 더함)
const WORDS = {
  '봄빛 27': 'Spring 27', '벚꽃마을역': 'Sakura Town', '벚꽃마을': 'Sakura Town', '기차표': 'Tickets', '시원한 음료': 'Cold Drinks',
  '기차 시간표': 'Timetable', '벚꽃 찻집': 'Sakura Tea', '차': 'Tea', '봄기차 27': 'Spring Train 27', '분실물': 'Lost & Found',
  '기차 신호': 'Signal', '고양이 짐차': 'Cat Lift', '여행 짐': 'Luggage', '27번 보관함': 'Locker 27', '봄빛 열차': 'Spring Line',
  '집': 'Home', '공원': 'Park', '꽃길': 'Flowers', '언덕': 'Hill', '강가': 'River', '바다': 'Sea',
  '간식 · 차': 'Snacks · Tea', '식당칸': 'Dining Car', '객실칸': 'Seat Car',
};
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];
export const addWords = words => { for (const k in words) if (EN[k] == null) EN[k] = words[k]; };

const SIGNS = texCache();
// a flat sign's picture: its ground colour, the words as big as fit in 82 % of its width (the game font, English on an English screen)
export function signTex(text, w, h, bg, fg, { lines = 1, size = .6 } = {}) {
  const W = 512, H = Math.max(64, Math.round(512 * h / w));
  return SIGNS.get(['gptst-sign', text, bg, fg, W, H, lines, size].join('|'), () => textTex(W, H, (c, cw, ch) => {
    c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
    fitText(c, text, cw / 2, ch / 2, cw * .82, Math.max(8, Math.round(ch * size / lines)), fg, { weight: '700', lines });
  }));
}
// the sign on a thin plane, its front +z, at (x, y, z) in parent (turned ry)
export function sign(parent, text, w, h, x, y, z, bg, fg, ry = 0) {
  const p = mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: signTex(text, w, h, bg, fg), rim: 0 }), { cast: false });
  put(p, x, y, z, 0, ry); parent.add(p); return p;
}

// a train cabin's real door height: the shape above its floor stretched up, the wheels and rail contact where they were
// (the cached paint mesh is cloned, so another car never gets a second stretch)
export function stretchCabin(m, floor, factor) {
  m.geometry = m.geometry.clone();
  const p = m.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > floor) p.setY(i, floor + (y - floor) * factor); }
  p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere();
}

// the workshop moved its pieces with f.tick(t) from its own runtime; our room calls f.idle(t) every frame (room.js update)
export function withIdle(B) {
  for (const k in B) {
    const b = B[k]; if (b.gptstIdle) continue;
    const w = (f, ...a) => { const r = b(f, ...a); if (f.tick && !f.idle) f.idle = t => f.tick(t); return r; };
    w.gptstIdle = true; B[k] = w;
  }
  return B;
}
