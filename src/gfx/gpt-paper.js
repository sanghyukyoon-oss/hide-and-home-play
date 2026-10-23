// 글자·종이 손질 (① 10/22 — 사용자 "글자 삐져나온 것들이나 종이에 붙은 텍스처는 니가 더 잘 만드니까 한 번 더 봐 줘야겠다"):
// GPT 맵의 캔버스 글자(포스터·간판·쪽지·라벨)를 우리 식으로 다시 그리는 도구.
//   fitText   게임 폰트로, 칸(여백 8~10%를 뺀 폭)에 맞을 때까지 줄이고, 필요하면 줄을 바꾼다. 영어 화면에선 영어(tr)로.
//   textTex   글자가 든 캔버스: 2배로 그리고, 웹 폰트가 늦게 오면 한 번 더 그린다 (furniture.js liveTex와 같은 약속)
//   paperFill 종이 바탕: 살짝 미색, 가장자리 한 톤 어둡게, 결 몇 가닥
//   paperSheet 벽에 붙은 종이 한 장: 그림 + 테이프 두 조각이나 핀 하나 + 접혀 들린 모서리 (납작한 색 사각형 X)
// 새 글자는 WORDS에 한·영을 같이 적는다 (i18n 사전에 없을 때만 더함).
import * as THREE from 'three';
import { canvasTex, mat, mesh, put, grp } from './kit.js';
import { tr } from '../i18n.js';
import { EN } from '../i18n-en-dict.js';

export const WORDS = {
  '벚꽃마을역': 'Sakura Town', '표 사는 곳': 'Tickets', '시간표': 'Timetable', '음료': 'Drinks', '27 완행': 'Local 27',
  '바닷마을': 'Seaside Town', '바닷마을역': 'Seaside Town Stn.', '봄 완행': 'Spring Local',
  '벚꽃': 'Sakura', '호수': 'Lake', '바다': 'Sea', '산골': 'Hills', '종점': 'Last stop', '들판': 'Fields',
  '책 고치는 날': 'Book Fixing Day', '토요일 2시': 'Sat 2 pm', '제본 교실': 'Bookbinding Class', '토요일 두 시': 'Saturday 2 pm',
  '비누방울 빨래방': 'Bubble Laundry', '빨래 · 개기 · 쉬기': 'Wash · Fold · Rest', '흙과 잎 공방': 'Clay & Leaf',
  '도자기 공방': 'Pottery Studio', '달나라 모험': 'Moon Quest', '별 보는 밤': 'Stargazing Night', '로봇 주말': 'Robot Weekend',
  '몽글 파출소': 'Mongle Police', '민원 안내': 'Help Desk', '분실물': 'Lost & Found', '주인 찾아요': 'Owner Wanted', '노란 가방': 'Yellow Bag',
  '동네 소식': 'Town News', '안전 귀가': 'Safe Home', '동네 게시판': 'Notice Board', '주차': 'Parking', '순찰': 'Patrol', '집들이': 'Housewarming',
  '모퉁이 상점': 'Corner Shop', '어서 와요': 'Welcome', '열쇠 → 문': 'Key → Door', '캡슐 상점': 'Capsule Toys',
  '24시간': '24 hours', '고양이 조심': 'Cats about', '골목 쉼터  ·  12': 'Alley Stop · 12', '따끈따끈 분식': 'Hot Snacks', '모퉁이 24': 'Corner 24', '순찰 중': 'On Patrol',
  '영업 중': 'Open', '오늘의 메뉴': "Today's Menu", '우편함': 'Mail', '작은 꽃병부터': 'Small vase first', '조심조심': 'Careful', '천천히 가요': 'Go slow', '택배': 'Parcels', '토마토': 'Tomato',
  '…내가': '…I', '삐딱이네': "Grumpy's", '수도 계량함': 'Water Meter', '쉿!': 'Shh!', '일어나는 시간': 'wake up at', '창고': 'Shed', '창턱 시계': 'Sill clock',
  '벚꽃역': 'Sakura Stn.', '잠시': 'Back', '자리 비움': 'soon', '열차 시간표': 'Timetable', '늦지 말아요': "Don't be late", '출발 08:10': 'Departs 08:10', '다음 칸': 'Next car', '간식': 'Snacks',
  '빨래 시간': 'Wash times', '찬물': 'Cold', '그늘에': 'Shade dry', '오전': 'AM', '오후': 'PM',
};
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

export const FONT = (px, weight = '') => `${weight ? weight + ' ' : ''}${px}px Ssurround, Jua, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
export const PAPER = '#fbf3e0', PAPER_BACK = '#eadcbc', TAPE = '#efdcae', INK = '#4a3528';

// write s around (x, y) inside maxW (the caller leaves the 8–10% margin out of maxW): the biggest size up to px that fits,
// broken into up to o.lines lines at spaces first; never wider than maxW (fillText's own cap is the last guard)
export function fitText(c, s, x, y, maxW, px, color, o = {}) {
  s = tr(s);
  const lines = o.lines || 1, min = o.min || Math.max(7, Math.round(px * .45)), lh = o.lh || 1.12, wt = o.weight || '';
  c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  const rowsAt = size => {
    c.font = FONT(size, wt);
    if (c.measureText(s).width <= maxW || lines < 2) return [s];
    const out = []; let cur = '';
    for (const w of s.split(' ')) { const t = cur ? cur + ' ' + w : w; if (!cur || c.measureText(t).width <= maxW) cur = t; else { out.push(cur); cur = w; } }
    out.push(cur); return out.length <= lines ? out : null;
  };
  let size = px, rows = null;
  for (; size >= min; size--) { const r = rowsAt(size); if (r && r.every(t => c.measureText(t).width <= maxW)) { rows = r; break; } }
  if (!rows) { size = min; rows = rowsAt(min) || [s]; }
  c.font = FONT(size, wt);
  const y0 = y - (rows.length - 1) * size * lh / 2;
  rows.forEach((t, i) => {
    if (o.stroke) { c.lineJoin = 'round'; c.strokeStyle = o.stroke; c.lineWidth = o.sw || Math.max(2, size * .18); c.strokeText(t, x, y0 + i * size * lh, maxW); }
    c.fillStyle = color; c.fillText(t, x, y0 + i * size * lh, maxW);
  });
  return size;
}

// a canvas texture with lettering: drawn at 2x (draw(c, w, h) in 1x units), drawn again once the game font has arrived
export function textTex(w, h, draw) {
  const run = cx => { cx.save(); cx.scale(2, 2); draw(cx, w / 2, h / 2); cx.restore(); };
  const t = canvasTex(w, h, run);
  if (typeof document !== 'undefined' && document.fonts && !document.fonts.check('20px Ssurround')) {
    document.fonts.load('20px Ssurround').then(() => { const cx = t.image.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, w, h); run(cx); t.needsUpdate = true; }).catch(() => {});
  }
  return t;
}

// paper: a warm off-white, its edge a shade darker, a few faint fibres (seeded, so a sheet looks the same every time)
export function paperFill(c, W, H, tint = PAPER, seed = 1) {
  c.fillStyle = tint; c.fillRect(0, 0, W, H);
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  c.globalAlpha = .07; c.strokeStyle = '#8a6a3a'; c.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const x = rnd() * W, y = rnd() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * W * .2, y + (rnd() - .5) * H * .05); c.stroke(); }
  c.globalAlpha = .18; c.lineWidth = Math.max(2, W * .02); c.strokeRect(0, 0, W, H); c.globalAlpha = 1;
}

// a sheet on a wall (+z out of the wall, its centre at the group's origin): the picture tex on a thin card, held by two
// strips of tape at the top corners or one pin, and its bottom-right corner folded over and lifted (the back of the paper
// shows). The sheet itself is cut at the fold (a five-sided shape), so its outline follows the fold too.
export function paperSheet(w, h, tex, { hold = 'tape', curl = true, pin = '#e8604c', back = PAPER_BACK } = {}) {
  const g = grp(), k = Math.min(w, h) * .2, sh = new THREE.Shape();
  sh.moveTo(-w / 2, -h / 2); sh.lineTo(curl ? w / 2 - k : w / 2, -h / 2); if (curl) sh.lineTo(w / 2, -h / 2 + k); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.closePath();
  const geo = new THREE.ShapeGeometry(sh), uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  g.add(put(mesh(geo, mat('#ffffff', { map: tex, rim: 0 }), { cast: false }), 0, 0, .004));
  if (curl) {
    // the folded flap: the corner triangle turned over onto the sheet, its tip lifted a little off it
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute([w / 2 - k, -h / 2, .007, w / 2, -h / 2 + k, .007, w / 2 - k, -h / 2 + k, .022], 3));
    fg.computeVertexNormals();
    g.add(mesh(fg, mat(back, { side: THREE.DoubleSide, rim: 0 }), { cast: false }));
  }
  if (hold === 'tape') for (const s of [-1, 1]) g.add(put(mesh(new THREE.BoxGeometry(Math.max(.05, w * .2), Math.max(.018, w * .07), .004), mat(TAPE, { rim: 0 }), { cast: false }), s * (w / 2 - w * .05), h / 2 - h * .02, .008, 0, 0, s * -.65));
  else if (hold === 'pin') g.add(put(mesh(new THREE.SphereGeometry(Math.max(.012, w * .035), 10, 8), mat(pin, { rim: 0 }), { cast: false }), 0, h / 2 - Math.max(.03, h * .08), .018));
  return g;
}
