// 놀이 모음 (2026-10-18, user: "미니게임만 플레이할 수 있게 하위 채팅에서 했듯이 줄 수도 있음? 문서화해서"): every boss game and
// 쉬어가기 in one list, each level playable on its own — home → 더보기 → 놀이 모음, or the web address ?play=<id>&lv=<n>.
// Played this way nothing counts: main.js keeps a copy of the save when you start and puts it back when you come back
// to the list (or home), so campaign progress, coins and the bosses' done marks stay exactly as they were.
// Documentation: _handoff/minigames-20261018.md
import { h } from './ui.js';

const L = (...names) => names.map((label, lv) => ({ label, lv }));
// type: bossgame = the new-game session's games (scenes/bossgame.js) · mini = my 쉬어가기 (scenes/mini.js; `after` picks
// the campaign slot whose settings it uses) · boss = 보물 지키기 (scenes/boss.js; `after` picks its map)
export const GALLERY = [
  // 프라모델 조립판 (시제품 10/18, modelkit.js): an ordinary find-the-things stage whose things are a model kit's pieces;
  // the finished model is kept (내 집 보관함), so it isn't a practice run
  { sec: '새 판 (시제품)', items: [
    { id: 'model', type: 'model', name: '프라모델 조립', desc: '방에 흩어진 로봇 부품을 다 찾으면 착착 조립! 완성한 로봇은 내 집에', slots: '시제품 · 캠페인 밖', lvs: [{ label: '꼬마 로봇', kit: 'robot' }] },
  ] },
  { sec: '보스', items: [
    { id: 'yasik', type: 'bossgame', name: '엄마 몰래 야식', desc: '엄마가 안 볼 때 간식을 몰래 챙겨 와요. 들키면 끝!', slots: '12 · 40 · 70판 뒤', lvs: L('첫째 밤', '둘째 밤', '셋째 밤') },
    { id: 'wakeup', type: 'bossgame', name: '아침 깨우기 장치', desc: '장난감을 이어 붙인 연쇄 장치로 졸졸이를 깨워요', slots: '31 · 46 · 60판 뒤', lvs: L('첫째 아침', '둘째 아침', '셋째 아침') },
    { id: 'hotel', type: 'bossgame', name: '몽글 호텔 X박 X일', desc: '손님 방을 정해 모두 꿀잠 재우기. 밤마다 사건 카드', slots: '21판 뒤 (3박 4일)', lvs: L('1박 2일', '2박 3일', '3박 4일') },
    { id: 'treasure', type: 'boss', name: '보물 지키기', desc: '보물을 숨기고 휘슬로 너굴이를 따돌려요', slots: '18 · 27 · 37 · 49 · 55판 뒤', lvs: [{ label: '2층집', after: 17 }, { label: '골목 마당 2층집', after: 26 }, { label: '편의점·빨래방', after: 36 }, { label: '공원', after: 48 }, { label: '오두막·캠핑장', after: 54 }] },
  ] },
  { sec: '쉬어가기', items: [
    { id: 'whack', type: 'bossgame', interlude: true, name: '두더지 숨바꼭질', desc: '수풀에서 쏙 나온 친구를 터치! 너굴이는 꾹 참기', slots: '3 · 24 · 58판 뒤', lvs: L('공원 수풀', '변장한 너굴이', '피버 수풀') },
    { id: 'redlight', type: 'bossgame', interlude: true, name: '무궁화 꽃이 피었습니다', desc: '구호가 끝나기 전에 살금살금, 돌아보면 딱 멈추기', slots: '6 · 63판 뒤', lvs: L('운동장', '킥킥 너굴이', '두 번 돌아보기') },
    { id: 'inky', type: 'bossgame', interlude: true, name: '먹물이의 바꿔치기', desc: '물건으로 둔갑한 먹물이를 찾아 방 색을 되찾아요', slots: '새 버전 · 보류', lvs: L('곰돌이네 거실', '냥냥이네 부엌', '토순이네 침실') },
    { id: 'picnic', type: 'bossgame', interlude: true, name: '소풍 보물찾기', desc: '바위·덤불·새집을 들춰 보물 쪽지 찾기. 꽁꽁~뜨거워!', slots: '보류', lvs: L('공원', '바람 부는 날', '멍뭉이랑 소풍') },
    { id: 'blanket', type: 'bossgame', interlude: true, name: '이불 속 누구게?', desc: '이불 밖으로 삐져나온 귀·꼬리로 누군지 맞히기', slots: '9판 뒤', lvs: L('파자마 파티', '변장한 너굴이', '고양이 친구들') },
    { id: 'gohome', type: 'bossgame', interlude: true, name: '다 같이 집으로!', desc: '앞길이 열린 친구부터 터치! 해 지기 전에 모두 집으로', slots: '15 · 52판 뒤', lvs: L('놀이터', '골목길', '덤불 숨바꼭질', '빙글 너굴이', '졸린 친구들', '해 질 녘', '놀이터 + 덤불', '캠핑장 + 졸린 친구', '첫 놀이터 + 덤불') },
    { id: 'tracks', type: 'bossgame', interlude: true, name: '발자국 따라 찾기', desc: '눈 위 발자국을 따라가 숨은 친구 찾기', slots: '캠페인 밖', lvs: L('첫눈 캠핑장', '엉킨 발자국', '눈이 펑펑') },
    { id: 'lamp', type: 'mini', name: '손전등 술래', desc: '어두운 방을 손전등으로 비춰 친구 찾기', slots: '43판 뒤 · 66판 뒤 보스', lvs: [{ label: '원룸', after: 14, p: { map: 'oneroom', time: 45 } }, { label: '공원', after: 42, p: { map: 'park1', time: 45 } }, { label: '보스: 불 꺼진 사무실', after: 65 }] },
    { id: 'spot', type: 'mini', name: '너굴이의 바꿔치기 (지금 판)', desc: '잠깐 사이 바뀐 곳 찾기', slots: '34판 뒤', lvs: [{ label: '편의점', after: 33 }, { label: '캠핑장', after: 51 }] },
  ] },
  { sec: '캠페인 밖', items: [
    { id: 'flashlight', type: 'bossgame', name: '손전등 숨바꼭질', desc: '정전된 밤, 손전등으로 숨은 친구를 비춰 찾아요', slots: '안 쓰임 (10/18 뺌)', lvs: L('토순이네 침실', '곰돌이네 거실', '말썽이네 집', '펭펭이네 2층집') },
    { id: 'redlight0', kind: 'redlight', type: 'mini', name: '무궁화 꽃이 피었습니다 (옛 판)', desc: '술래가 돌아볼 때 딱 멈추기', slots: '안 쓰임 (10/18 새 판으로)', lvs: [{ label: '1판', after: 23, p: { time: 55 } }, { label: '2판', after: 62, p: { time: 55 } }] },
    { id: 'report', type: 'bossgame', name: '엄마 몰래 성적표', desc: '엄마가 뒤지는 곳을 피해 성적표를 몰래 옮겨요', slots: '안 쓰임 (10/18 뺌)', lvs: L('첫째 날', '둘째 날', '셋째 날') },
    { id: 'shell', type: 'mini', name: '햄찌의 야바위', desc: '섞이는 컵을 잘 보고 간식 든 컵 고르기', slots: '안 쓰임 (10/18 뺌)', lvs: [{ label: '냥냥이네', after: 7, p: { map: 'cat', rounds: 2 } }, { label: '공원', after: 45, p: { map: 'park2', rounds: 3 } }, { label: '캠핑장', after: 57, p: { map: 'camp2', rounds: 3 } }] },
    { id: 'finale', type: 'mini', name: '숨바꼭질 왕 결정전', desc: '바꿔치기 · 야바위 · 두더지(옛 판) 세 판 연속', slots: '안 쓰임', lvs: [{ label: '세 판 연속', after: 993 }] },
    { id: 'sneak', type: 'mini', name: '냥냥이 몰래 야식', desc: '옛 쉬어가기 시제품', slots: '안 쓰임', lvs: [{ label: '1판', after: 991 }] },
    { id: 'villa', type: 'bossgame', name: '몽글 빌라 방 배정', desc: '호텔의 원래 버전', slots: '안 쓰임', lvs: L('첫 입주', '새 이웃', '꽉 찬 빌라') },
    { id: 'tag', type: 'bossgame', name: '다 잡았다! 술래잡기', desc: '시제품', slots: '안 쓰임', lvs: L('1판', '2판', '3판') },
    { id: 'photo', type: 'bossgame', name: '찰칵! 동네 사진관', desc: '시제품', slots: '안 쓰임', lvs: L('첫 출사', '점심 출사', '노을 출사') },
    { id: 'churro', type: 'bossgame', name: '추로야!!!', desc: '추로가 주인공 (사용자 결정으로 캠페인에서 뺌)', slots: '안 쓰임', lvs: L('첫째 밤', '둘째 밤', '셋째 밤') },
  ] },
];
const ALL = GALLERY.flatMap(s => s.items);
export const galleryItem = id => ALL.find(it => it.id === id);

// start one level of one game in practice mode
export function playGame(G, id, k = 0, mini = false) {
  const it = (mini && ALL.find(x => x.type === 'mini' && (x.kind || x.id) === id)) || galleryItem(id); if (!it) return false;
  const v = it.lvs[Math.max(0, Math.min(it.lvs.length - 1, k | 0))];
  if (it.type === 'model') return G.go('stage', { model: v.kit });   // (not a practice run: the model you build is yours)
  G.startPlay();
  const kind = it.kind || it.id;
  if (it.type === 'bossgame') return G.go('bossgame', { kind, lv: v.lv, after: -1, interlude: !!it.interlude });
  if (it.type === 'mini') return G.go('mini', { kind, after: v.after, p: v.p || null });
  return G.go('boss', { after: v.after });
}

export function openGallery(G) {
  const ui = G.ui;
  const list = h('div', { class: 'gal' });
  for (const s of GALLERY) {
    list.append(h('div', { class: 'gal-sec ol' }, s.sec));
    for (const it of s.items) {
      const chips = h('div', { class: 'gal-lvs' }, ...it.lvs.map((v, k) => h('button', { class: 'gal-lv', onclick: e => { e.stopPropagation(); ui.closePanel(); playGame(G, it.id, k); } }, v.label)));
      list.append(h('div', { class: 'gal-item' }, h('div', { class: 'gal-top' }, h('b', {}, it.name), h('span', { class: 'gal-slot' }, it.slots)), h('div', { class: 'gal-desc' }, it.desc), chips));
    }
  }
  list.addEventListener('pointerdown', e => e.stopPropagation());
  ui.panel({ title: '놀이 모음', color: 'green', cls: 'galp', close: () => {},
    body: [h('div', { class: 'txt gal-note' }, '보스·쉬어가기·새 판을 골라 해요. 여기서 한 판은 진행·코인에 안 들어가요'), list],
    buttons: [ui.btn('닫기', { color: 'gray', onClick: () => ui.closePanel() })] });
}
