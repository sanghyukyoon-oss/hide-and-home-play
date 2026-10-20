// Story stages: each region opens with a small incident (its first stage) and resolves it in its boss stage.
// A story stage adds a dialogue intro/outro, a story puzzle (a stubborn character who wants a treat), a slide-puzzle
// picture that reveals a code, a secret bonus item and a memento furniture reward for your home.
import * as THREE from 'three';
import { rbox, put, plane, mat, canvasTex } from './gfx/kit.js';
import { registerFurniture } from './gfx/furniture.js';
import { h } from './ui.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { rbox as _rb, sph, cyl, tor, grp } from './gfx/kit.js';
import { tr } from './i18n.js';

// who: a CHAR_DEFS key (face thumbnail `face_<who>`), or 'mong'
export const STORIES = {
  0: { id: 'tutorial', title: '토순이의 숨바꼭질',
    intro: [{ who: 'bunny', text: '몽글아! 내가 방에 간식을 숨겨 놨어~' }, { who: 'bunny', text: '방을 빙글빙글 돌려 보면서 찾아봐!' }],
    outro: [{ who: 'bunny', text: '우와, 다 찾았네! 너 숨바꼭질 천재다!' }] },
  11: { id: 'grumpycat', title: '심통난 냥냥이', cast: 'cat',
    intro: [
      { who: 'mong', text: '어? 내 보물 일기장이 없어졌어!' },
      { who: 'cat', text: '흥. 몰라. 난 아무것도 안 봤다냥.' },
      { who: 'mong', text: '…수염에 잉크가 묻어 있는데?' },
      { who: 'cat', text: '찾을 수 있으면 찾아보라냥! 상자 위는 내 자리다냥!' },
    ],
    // order of the escape chain: picture puzzle → cupboard (code) → fish treat → cat moves off the chest → diary
    chain: { treatOn: ['yarnbasket', 'chest'], treatIn: ['dishcab', 'safe', 'fridge', 'fishtank'], hero: 'diary', treat: 'fishsnack' },
    secret: 'goldbone',
    lines: {
      blocked: ['내 자리다냥! 비켜 줄 생각 없다냥.', '흥! 맛있는 거라도 주면 몰라도~', '생선 냄새가 나면 생각해 볼게냥.'],
      fed: '냠냠… 이, 이번만 봐준다냥!',
      tap: ['흥.', '냥…', '내 일기장 아니다냥!', '(꼬리를 휙)'],
    },
    outro: [
      { who: 'cat', text: '…사실 일기장에 내 얘기가 있나 궁금했다냥.' },
      { who: 'mong', text: '"냥냥이는 내 제일 친한 친구" 라고 써 놨는데?' },
      { who: 'cat', text: '!!! …미안하다냥. 이거 내 캣타워인데 너 가져라냥.' },
    ],
    reward: { furn: 'cattower', coins: 200 } },
};
// ── stories for the regions after the friends' houses (stages 13–70): two small scenes inside each region and an
// escape-room boss with a secret and a keepsake. Indices are stage index (stage number − 1).
Object.assign(STORIES, {
  // 우리 아파트 (13–21) · host 토순이, who just moved in
  15: { id: 'apt-boxes', title: '이삿짐 대소동',
    intro: [{ who: 'bunny', text: '이삿짐 상자를 아직 다 못 풀었어… 리모컨도 어디 들어갔는지 몰라!' }, { who: 'mong', text: '상자 하나하나 열어 보자!' }] },
  18: { id: 'apt-night', title: '정전된 밤',
    intro: [{ who: 'bunny', text: '앗, 갑자기 불이 나갔어! 무서워…' }, { who: 'mong', text: '괜찮아, 스위치부터 찾자. 손전등 대신 내 눈을 믿어!' }] },
  20: { id: 'apt-boss', title: '집들이 깜짝 파티', cast: 'bunny',
    intro: [
      { who: 'bunny', text: '몽글아! 집들이 선물을 숨겨 놨는데… 숨긴 곳을 내가 까먹었어!' },
      { who: 'mong', text: '또?' },
      { who: 'bunny', text: '냉장고마다 자물쇠를 걸어 놨거든. 비밀번호는 쪽지를 찢어서 여기저기 뒀고…' },
      { who: 'mong', text: '방탈출 하자는 거지? 좋아!' },
    ],
    secret: 'goldbone',
    lines: { tap: ['헤헤, 나도 몰라~', '김치냉장고 쪽은 아닐걸? 아마도…', '선물 찾으면 같이 뜯자!'] },
    outro: [
      { who: 'bunny', text: '찾았다! 이건 너 주려고 산 코타츠야. 겨울에 같이 귤 까먹자!' },
      { who: 'mong', text: '최고의 집들이야!' },
    ],
    reward: { furn: 'kotatsu', coins: 250 } },

  // 동네 골목 (22–31) · 멍뭉이와 삐딱이
  24: { id: 'alley-sniff', title: '킁킁 탐정 멍뭉이',
    intro: [{ who: 'shiba', text: '킁킁… 이 골목 어딘가에 맛있는 냄새가 나!' }, { who: 'mong', text: '냄새 말고 눈으로 찾아보자~' }] },
  27: { id: 'alley-race', title: '너굴이의 골목 술래잡기',
    intro: [{ who: 'raccoon', text: '골목 숨바꼭질이다! 내가 셀 동안 다 찾아야 해~' }, { who: 'mong', text: '빨리빨리!' }] },
  30: { id: 'alley-boss', title: '삐딱이의 비밀 아지트', cast: 'grumpy',
    intro: [
      { who: 'grumpy', text: '흥, 내 아지트는 절대 못 들어와. 대문도 우체통도 다 잠가 놨거든.' },
      { who: 'shiba', text: '삐딱이 또 저런다. 사실 같이 놀고 싶은 거야.' },
      { who: 'grumpy', text: '아, 아니거든!? …열쇠는 어디 뒀는지 나도 기억 안 나.' },
    ],
    secret: 'pawprint',
    lines: { tap: ['흥.', '…거기 말고.', '찾든 말든 상관없거든!'] },
    outro: [
      { who: 'grumpy', text: '…진짜 다 찾았네. 이거, 떡볶이 포장마차. 내 단골인데 너 가져.' },
      { who: 'mong', text: '삐딱이도 사실 착하구나~' },
      { who: 'grumpy', text: '시끄러!' },
    ],
    reward: { furn: 'tteokstall', coins: 300 } },

  // 편의점·상가 (32–40) · 멍뭉이와 파르페
  33: { id: 'shop-snack', title: '삼각김밥 실종 사건',
    intro: [{ who: 'shiba', text: '삼각김밥 하나만 사 먹으려 했는데 진열대가 엉망이야!' }, { who: 'mong', text: '어지른 범인부터 찾자!' }] },
  36: { id: 'shop-laundry', title: '빨래방의 짝 잃은 양말',
    intro: [{ who: 'sundae', text: '세탁기 돌렸더니 양말이 한 짝씩 사라졌어…' }, { who: 'mong', text: '양말 요정의 짓이다!' }] },
  39: { id: 'shop-boss', title: '마감 시간의 금고', cast: 'sundae',
    intro: [
      { who: 'sundae', text: '큰일이야! 카페 마감하는데 금고 비밀번호를 잊어버렸어.' },
      { who: 'shiba', text: '사장님이 비밀번호를 쪽지에 써서 찢어 버렸대!' },
      { who: 'mong', text: '조각을 모으면 되겠다. 가게를 다 뒤져 보자!' },
    ],
    secret: 'goldbone',
    lines: { tap: ['커피 한 잔 줄까?', '금고는 계산대 근처일 거야…', '빨리빨리! 문 닫을 시간이야!'] },
    outro: [
      { who: 'sundae', text: '살았다! 고마워서 간식 카트 하나 줄게. 집에 두고 출출할 때 꺼내 먹어!' },
    ],
    reward: { furn: 'snackcart', coins: 300 } },

  // 공원 (41–49) · 개굴이와 다람이
  42: { id: 'park-acorn', title: '다람이의 도토리 창고',
    intro: [{ who: 'squirrel', text: '겨울 대비 도토리를 숨겼는데, 어디 숨겼는지 기억이 안 나!' }, { who: 'mong', text: '다람쥐는 원래 그렇대~' }] },
  45: { id: 'park-tag', title: '너굴이의 공원 숨바꼭질',
    intro: [{ who: 'raccoon', text: '이번엔 공원이다! 내가 열까지 세는 동안 찾아봐~' }] },
  48: { id: 'park-boss', title: '소풍 바구니를 지켜라', cast: 'frog',
    intro: [
      { who: 'frog', text: '개굴! 소풍 도시락을 누가 몽땅 숨겼어!' },
      { who: 'squirrel', text: '나 아니야! …아마도.' },
      { who: 'frog', text: '분리수거함까지 자물쇠가 걸려 있어. 이건 방탈출이야!' },
    ],
    secret: 'furball',
    lines: { tap: ['개굴!', '배고파 개굴…', '그네 밑도 봤어?'] },
    outro: [
      { who: 'squirrel', text: '사실… 내가 너무 신나서 숨겼어. 미안해! 이 벤치 줄게.' },
      { who: 'frog', text: '다 같이 먹자 개굴!' },
    ],
    reward: { furn: 'bench2', coins: 320 } },

  // 산길·캠핑 (50–60) · 판다와 졸졸이
  52: { id: 'camp-trail', title: '이정표를 따라서',
    intro: [{ who: 'panda', text: '등산 지도를 잃어버렸어. 길에 떨어뜨렸나 봐!' }, { who: 'mong', text: '내려가면서 찾아보자.' }] },
  55: { id: 'camp-night', title: '캠핑장의 밤',
    intro: [{ who: 'sleepy', text: '랜턴이 꺼졌어… 스위치는… 어디였더라… zzz' }, { who: 'mong', text: '자지 마! 같이 찾자!' }] },
  59: { id: 'camp-boss', title: '산꼭대기 보물상자', cast: 'panda',
    intro: [
      { who: 'panda', text: '산꼭대기에 옛날 보물상자가 있대. 근데 자물쇠가 네 개나 걸려 있어!' },
      { who: 'sleepy', text: '열쇠는 텐트에… 쪽지는 계곡에… 색깔 카드는… 몰라…' },
      { who: 'mong', text: '네 개 다 열어 보자!' },
    ],
    secret: 'goldbone',
    lines: { tap: ['대나무 먹을래?', '정상까지 거의 다 왔어!', '졸졸이 깨우지 마~'] },
    outro: [
      { who: 'panda', text: '보물은… 우리가 어릴 때 묻어 둔 타임캡슐이었어!' },
      { who: 'mong', text: '우리 그때 사진이다! 이 몬스테라는 기념으로 가져갈게.' },
    ],
    reward: { furn: 'monstera', coins: 350 } },

  // 빌딩 (61–70) · 박사와 큐브봇
  62: { id: 'bld-lobby', title: '로비의 분실물',
    intro: [{ who: 'robot', text: '삐빅. 분실물 보관함 정리 필요. 몽글, 협조 바람.' }, { who: 'mong', text: '로봇도 물건을 잃어버리는구나!' }] },
  66: { id: 'bld-dark', title: '퇴근 후의 사무실',
    intro: [{ who: 'nerd', text: '다들 퇴근해서 불이 꺼졌어. 스위치를 켜야 단서가 보일 거야.' }] },
  69: { id: 'bld-boss', title: '옥상의 마지막 수수께끼', cast: 'nerd',
    intro: [
      { who: 'nerd', text: '몽글아, 수수께끼 상자의 마지막 단계야. 옥상에 모든 단서가 있어.' },
      { who: 'robot', text: '삐빅. 자물쇠 넷. 찢어진 비밀번호 셋. 레버 하나. 성공 확률… 몽글이라면 100%.' },
      { who: 'mong', text: '마지막 숨바꼭질, 가 보자!' },
    ],
    secret: 'diary',
    lines: { tap: ['논리적으로 생각해 봐!', '삐빅. 힌트: 위를 봐.', '거의 다 왔어!'] },
    outro: [
      { who: 'nerd', text: '상자 안엔… 동네 친구들이 쓴 편지가 가득해. "몽글아 고마워!"' },
      { who: 'mong', text: '…다들 나 몰래 이런 걸 준비했구나.' },
      { who: 'robot', text: '삐빅. 축하. 몽글은 이 동네 최고의 숨바꼭질 탐정.' },
    ],
    reward: { furn: 'recordcab', coins: 600 } },
});

// script.js (대본, 10/18) re-pins STORIES onto stages by map, not by stage number, the first time a story is asked for;
// the texts above are the old ones, script.js replaces them
let binder = null;
export const setStoryBinder = f => { binder = f; };
export function storyFor(idx) { binder?.(); return STORIES[idx] || null; }

// ── dialogue: a bottom card with the speaker's face; tap to advance, ≫ to skip
// A chapter cinematic when the journey moves somewhere new: letterbox bars, a title card, the cast hopping in, then
// a few lines telling why we go there ("배고픈데 편의점 가자!"). Tap to skip; bots and QA runs skip it.
export async function playCinematic(G, c) {
  if (!c || G.bot || G.skipTalk) return;
  const root = h('div', { class: 'cine' },
    h('div', { class: 'cine-bar top' }), h('div', { class: 'cine-bar bot' }),
    // (장 카드 A '이야기책 라벨' — user 10/20 "챕터 디자인 맘에 안 드네" → A: a cream label with an ink edge, the chapter on an
    // orange tab, the region underneath; the cast hop in under it)
    h('div', { class: 'cine-card' }, h('div', { class: 'cine-ch' }, tr(`${c.chapter}장`)), h('div', { class: 'cine-title' }, c.title), c.region ? h('div', { class: 'cine-sub' }, tr(c.region)) : ''),
    h('div', { class: 'cine-faces' }, ...(c.cast || []).map((k, i) => h('img', { src: G.thumbs['face_' + k], style: `animation-delay:${.35 + i * .2}s` }))));
  document.getElementById('app').append(root);
  G.audio.sfx('whoosh');
  await new Promise(res => { const t = setTimeout(res, 1900); root.addEventListener('pointerdown', () => { clearTimeout(t); res(); }, { once: true }); });
  root.classList.add('talk');   // the bottom bar slides away so the dialogue card is clear
  // the lines go inside the cinematic: in #overlay (z 20) they sat under it (z 30), so a tap never reached them and the
  // chapter start froze (user, 10/18 13판 'CHAPTER 2'; bots skip cinematics, so no run had caught it)
  await playDialog(G, c.lines || [], { parent: root });
  root.classList.add('out');
  await new Promise(res => setTimeout(res, 350));
  root.remove();
}
// onLine(line, i): called as each line shows (a stage uses it to bring the camera in on whoever is talking)
export function playDialog(G, lines, { title = null, onLine = null, parent = null } = {}) {
  return new Promise(res => {
    const root = h('div', { class: 'dlg' });
    const card = h('div', { class: 'dlg-card' });
    const face = h('img'), faceBox = h('div', { class: 'dlg-face' }, face);   // the face fills its frame (user, 10/17: "얼굴만 가득")
    const name = h('div', { class: 'dlg-name ol' });
    const text = h('div', { class: 'dlg-text' });
    const next = h('div', { class: 'dlg-next' }, '▼');
    const skip = h('div', { class: 'dlg-skip' }, '건너뛰기 ≫');
    card.append(faceBox, h('div', { class: 'dlg-body' }, name, text), next);
    if (title) root.append(h('div', { class: 'dlg-title ol3' }, title));
    root.append(card, skip);
    (parent || document.getElementById('overlay')).append(root);
    let i = -1, typing = null;
    const NAMES = { mong: '몽글이' };
    const show = () => {
      i++;
      if (i >= lines.length) { root.classList.add('out'); setTimeout(() => root.remove(), 220); return res(); }
      const L = lines[i];
      onLine?.(L, i);
      face.src = G.thumbs['face_' + L.who] || G.thumbs.face_mong;
      name.textContent = L.name ? tr(L.name) : (NAMES[L.who] || CHAR_DEFS[L.who]?.name || L.who);   // (a line can carry its own name tag: 먹물이 is '???' until 64판)
      card.classList.toggle('right', L.who !== 'mong');
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
      G.audio.sfx('pop', L.who === 'mong' ? 4 : 1);
      let k = 0; text.textContent = ''; const LT = tr(L.text);
      G.audio.voice?.(LT, L.who);   // (목소리: 너굴이's babble, quiet and short — 10/20)
      clearInterval(typing);
      typing = setInterval(() => { k++; text.textContent = LT.slice(0, k); if (k >= LT.length) { clearInterval(typing); typing = null; } }, 28);
    };
    root.addEventListener('pointerup', e => {
      e.stopPropagation();
      if (i >= lines.length) return;   // already done and fading out (a skip left the typing id set, so a later tap read past the end)
      if (e.target === skip) { clearInterval(typing); typing = null; i = lines.length - 1; return show(); }
      if (typing) { clearInterval(typing); typing = null; text.textContent = tr(lines[i].text); return; }
      show();
    });
    root.addEventListener('pointerdown', e => e.stopPropagation());
    // QA bot: skip the talk whenever the bot is (or becomes) active
    const botIv = setInterval(() => { if (!document.body.contains(root)) return clearInterval(botIv); if (G.bot || G.skipTalk) { clearInterval(botIv); clearInterval(typing); i = lines.length - 1; show(); } }, 300);
    show();
  });
}

// ── slide puzzle (3×3): the picture shows the code once it is put back together
function puzzleArt(code) {
  return canvasTex(384, 384, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, '#fff1d6');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // a cat portrait
    c.fillStyle = '#ffb26b';
    c.beginPath(); c.moveTo(118, 112); c.lineTo(140, 40); c.lineTo(178, 96); c.fill();
    c.beginPath(); c.moveTo(266, 112); c.lineTo(244, 40); c.lineTo(206, 96); c.fill();
    c.beginPath(); c.ellipse(192, 150, 104, 88, 0, 0, 7); c.fill();
    c.fillStyle = '#ffd9a3'; c.beginPath(); c.ellipse(192, 176, 58, 40, 0, 0, 7); c.fill();
    c.fillStyle = '#2a1d33'; for (const x of [150, 234]) { c.beginPath(); c.ellipse(x, 140, 10, 13, 0, 0, 7); c.fill(); }
    c.fillStyle = '#ff8fa8'; c.beginPath(); c.moveTo(184, 164); c.lineTo(200, 164); c.lineTo(192, 174); c.fill();
    c.strokeStyle = '#2a1d33'; c.lineWidth = 3; for (const s of [-1, 1]) for (const dy of [-6, 6]) { c.beginPath(); c.moveTo(192 + s * 40, 172 + dy); c.lineTo(192 + s * 92, 166 + dy * 2); c.stroke(); }
    // the code
    // one digit per bottom tile, so the order only shows once the picture is whole
    c.fillStyle = '#ff6f91'; c.font = 'bold 24px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText(tr('찬장 비밀번호'), 192, 240);
    String(code).split('').forEach((d, i) => {
      const x = 64 + i * 128;
      c.fillStyle = '#ffffff'; c.strokeStyle = '#3b2a55'; c.lineWidth = 5;
      c.beginPath(); c.roundRect?.(x - 44, 270, 88, 92, 18); c.fill(); c.stroke();
      c.fillStyle = '#3b2a55'; c.font = 'bold 70px Ssurround, Jua, sans-serif'; c.fillText(d, x, 342);
    });
  });
}
export function slidePuzzle(G, code) {
  return new Promise(res => {
    const tex = puzzleArt(code), src = tex.image.toDataURL ? tex.image.toDataURL() : tex.image.src;
    const N = 3, tiles = [...Array(N * N).keys()];          // tiles[pos] = piece id, piece N*N-1 = the gap
    const gapId = N * N - 1;
    let gap = gapId;
    const nb = p => [p - N, p + N, p % N ? p - 1 : -1, p % N < N - 1 ? p + 1 : -1].filter(q => q >= 0 && q < N * N);
    let prev = -1;
    for (let k = 0; k < 26; k++) { const opts = nb(gap).filter(q => q !== prev); const q = opts[Math.floor(Math.random() * opts.length)]; [tiles[gap], tiles[q]] = [tiles[q], tiles[gap]]; prev = gap; gap = q; }
    const root = h('div', { class: 'slide' });
    const board = h('div', { class: 'slide-board' });
    const hint = h('div', { class: 'slide-hint ol' }, '조각을 밀어서 그림을 맞춰 봐!');
    const close = h('div', { class: 'slide-close' }, '✕');
    root.append(hint, board, close);
    document.getElementById('overlay').append(root);
    const cells = tiles.map(() => h('div', { class: 'slide-tile' }));
    cells.forEach(c => board.append(c));
    const paint = () => tiles.forEach((id, pos) => {
      const c = cells[pos];
      c.style.left = (pos % N) * 33.333 + '%'; c.style.top = Math.floor(pos / N) * 33.333 + '%';
      if (id === gapId) { c.style.backgroundImage = 'none'; c.classList.add('gap'); return; }
      c.classList.remove('gap');
      c.style.backgroundImage = `url(${src})`;
      c.style.backgroundPosition = `${(id % N) * 50}% ${Math.floor(id / N) * 50}%`;
    });
    const solved = () => tiles.every((id, pos) => id === pos);
    const done = ok => { root.classList.add('out'); setTimeout(() => root.remove(), 250); res(ok); };
    const move = pos => {
      if (!nb(gap).includes(pos)) { G.audio.sfx('wobble'); return; }
      [tiles[gap], tiles[pos]] = [tiles[pos], tiles[gap]]; gap = pos; G.audio.sfx('tap', 3); paint();
      if (solved()) {
        cells[gapId].style.backgroundImage = `url(${src})`; cells[gapId].style.backgroundPosition = '100% 100%'; cells[gapId].classList.remove('gap');
        board.classList.add('won'); hint.textContent = `비밀번호 ${code}!`; G.audio.sfx('special');
        setTimeout(() => done(true), 1100);
      }
    };
    // a tap picks the board cell under the finger (cells are laid out by position)
    board.addEventListener('pointerup', e => {
      e.stopPropagation();
      const r = board.getBoundingClientRect(), col = Math.floor((e.clientX - r.left) / r.width * N), row = Math.floor((e.clientY - r.top) / r.height * N);
      if (col >= 0 && col < N && row >= 0 && row < N) move(row * N + col);
    });
    root.addEventListener('pointerdown', e => e.stopPropagation());
    close.addEventListener('pointerup', e => { e.stopPropagation(); done(false); });
    paint();
    if (G.bot) setTimeout(() => { tiles.forEach((_, i) => { tiles[i] = i; }); gap = gapId; paint(); hint.textContent = `비밀번호 ${code}!`; setTimeout(() => done(true), 300); }, 500);
  });
}

// ── the puzzle picture on the wall: a framed 3×3 grid that shows its scrambled art until it is solved
const FRAME_TEX = canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#fff6e4'; c.fillRect(0, 0, w, h);
  const cols = ['#ffd27a', '#9fd8ff', '#ffb3c7', '#b7e8a8', '#ffe9a8', '#c9b6ff', '#ffc49a', '#a8e6dc'];
  for (let i = 0; i < 9; i++) { if (i === 8) continue; c.fillStyle = cols[i]; c.fillRect((i % 3) * 85 + 4, Math.floor(i / 3) * 85 + 4, 77, 77); }
  c.fillStyle = '#3b2a55'; c.font = 'bold 54px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText('?', 213, 236);
});
registerFurniture({
  puzzleframe: (f, T) => {
    f.add(put(rbox(.74, .74, .06, T.woodD || '#c99a6b', .03), 0, 1.62, .03));
    const face = put(plane(.62, .62, mat('#ffffff', { map: FRAME_TEX })), 0, 1.62, .062);
    face.userData.noMerge = true;   // its material is swapped when the puzzle is solved
    f.add(face); f.puzzleFace = face;
    f.add(put(rbox(.3, .08, .04, '#ffe14d', .02), 0, 1.22, .05));
  },
}, { puzzleframe: { wall: true, span: 1, name: '퍼즐 액자', price: 0, hidden: true } });
export function setFrameSolved(furn, code) {
  if (!furn?.puzzleFace) return;
  furn.puzzleFace.material = mat('#ffffff', { map: puzzleArt(code) });
}

// Simple stand-ins so a story stage still runs if gfx/story-props.js has not been merged yet.
const FALLBACK_ITEMS = {
  fishsnack: { name: '생선 간식', h: .14, build() { const g = grp(); g.add(put(sph(.13, '#7fc8ff'), 0, .07, 0, 0, 0, 0, [1.3, .55, .7])); g.add(put(cyl(.0, .07, .08, '#7fc8ff', null, 3), -.2, .07, 0, 0, 0, Math.PI / 2)); return g; } },
  diary: { name: '몽글이 일기장', h: .12, build() { const g = grp(); g.add(put(_rb(.32, .1, .24, '#ff9ec2', .03), 0, .05, 0)); g.add(put(sph(.04, '#ffe14d'), .16, .06, 0)); return g; } },
  goldbone: { name: '황금 생선뼈', h: .06, flat: true, build() { const g = grp(); g.add(put(_rb(.3, .04, .04, '#ffd23f', .015), 0, .02, 0)); for (const x of [-.08, 0, .08]) g.add(put(_rb(.03, .03, .16, '#ffd23f', .01), x, .02, 0)); return g; } },
};
export function ensureStoryItems(ITEMS) { for (const k in FALLBACK_ITEMS) if (!ITEMS[k]) ITEMS[k] = FALLBACK_ITEMS[k]; }
