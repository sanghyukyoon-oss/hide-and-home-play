// 털기 메타의 영어 (10/20 — Discovery 26-4 needs English + Korean; the raid's own words were left Korean on the English screen).
// 타이머 털기 · 정찰 · 다시 보기 · 문단속 · 털린 흔적 · 자물쇠: exact lines here, sentences with names and numbers as patterns.
// (A name capture never takes in ' · ', so a line made of pieces is still split and translated piece by piece.)
import { addI18n, tr } from './i18n.js';

const S = 's';
addI18n({
  // 털 집 찾기 (10/20)
  '냥펀치DJ': 'DJ Cat Punch', 'K팝 연습실': 'K-pop Studio', '내 무대 밟지 마! …숨긴 건 찾아도 돼.': "Don't step on my stage! …The hidden stuff is fair game.",
  '삼색바리스타': 'Calico Barista', '골목 카페와 부엌': 'Alley Café & Kitchen', '오늘의 원두는… 비밀이야.': "Today's beans are… a secret.",
  '비 오는 날 연못': 'Rainy Day Pond', '볼주머니 편의점': 'Cheek Pouch Mart', '마당 있는 거실': 'Living Room with a Yard', '절대 못 찾는 서재': "The Study You'll Never Solve",
  'Lv.UP!': 'Lv. UP!',
  '털 집 찾는 중…': 'Finding a house to raid…', '찾았다!': 'Found one!', '다른 집을 찾고 있어': 'Looking for another house',
  '동네에서 털 만한 집을 찾고 있어': 'Looking around the neighbourhood for a house to raid', '집으로': 'Home', '다른 집': 'Next', '무료': 'Free',
  '딸기우유냥': 'Strawberry Milk Cat', '딸기 다락방': 'Strawberry Loft', '내 방 예쁘지? 구경만 하고 가~': 'Pretty, right? Just look, okay~',
  '턱시도관장': 'Curator Tux', '작은 미술관': 'Little Gallery', '작품엔 손대지 마세요. 숨긴 건… 찾아도 되고.': "Please don't touch the art. The hidden things… fair game.",
  // 타이머 털기 (raidrun.js)
  '보물 털었다!': 'Got the treasure!', '내 거 찾았다!': 'Found mine!', '다 셌다! 거기까지~': "Done counting! That's it~", '어? 벌써 가?': 'Huh? Leaving already?',
  '몽땅 털었다!': 'Cleaned out!', '그만 털기!': 'Raid stopped!', '보물까지 싹!': 'Treasure and all!', '하나도 안 남겼어!': 'Not a thing left!', '찾은 만큼 내 거!': 'What you found is yours!',
  '찾은 물건': 'Found', '보물 포함': 'treasure too', '되찾은 내 물건': 'Mine, back', '슬쩍 (이미 있음)': 'Snagged (had it)', '전에 몽땅 턴 집이라 ⅓만 나와요': 'Cleaned out before · ⅓ pay',
  '털기 끝!': 'Raid over!', '★ 절반': '★ Half', '★ 보물': '★ Treasure', '★ 전부': '★ All', '다른 집': 'Other houses', '그만 털기': 'Stop raiding', '보물': 'Treasure', '털기': 'Raid',
  // 정찰
  '정찰': 'Scout', '전에 몽땅 턴 집': 'Cleaned out before', '가져올 수 있는 것': 'Up for grabs', '목록': 'List', '다음 집': 'Next house', '털러 가기': 'Raid it!',
  // 다시 보기 (raidreplay.js)
  '방금': 'just now', '복수하러 왔지롱!': 'Revenge time!', '쉿… 아무도 없지?': 'Shh… nobody home?', '여기 수상한데?': 'Looks suspicious…', '어디 보자…': "Let's see…",
  '어디 보자… 딸깍!': "Let's see… click!", '잠겼잖아!': "It's locked!", '헤헤, 이건 내 거~': 'Hehe, mine now~', '없네?': 'Nothing?', '여긴 없네~': 'Nothing here~', '하나도 없잖아! 흥!': 'Nothing at all! Hmph!',
  '자물쇠를 땄어!': 'Lock picked!', '자물쇠가 막았다!': 'The lock held!', '안 들킴!': 'Not found!', '털렸다…': 'Robbed…', '지켜 냈다!': 'Defended!',
  '안 들킴': 'Not found', '자물쇠가 막음': 'Lock held', '들켰지만 두고 감': 'Found, left behind', '털림': 'Taken', '잘 숨겨 둔 덕분이야!': 'Your hiding paid off!',
  '터치하면 닫혀': 'tap to shut', '더 꽁꽁 숨기기': 'Hide better', '복수하러 가기': 'Get revenge',
  // 문단속 · 자물쇠
  '털린 뒤라 문을 꽁꽁 잠갔어': 'Robbed, so the door is locked', '자물쇠가 다 쓰였어': 'Out of padlocks',
  '잠근 서랍 속 물건은 동네 주민이 거의 못 털어 가': 'Things in a locked drawer are hardly ever taken', '다른 데 걸린 걸 풀어서 옮겨 봐': 'Take one off and move it',
  // 손에 든 물건 (handhold.js — 보물 지키기 · 내 집 숨기기, 10/20)
  '어디든 터치해서 숨겨!': 'Tap anywhere to hide it!', '셋 다 숨겼어! 위의 시작을 터치': 'All three hidden! Tap Start up top', '꼭 숨겨야 해': 'Must be hidden', '다 숨겼어!': 'All hidden!',
  // 보물 지키기 숨기기 (boss.js, 10/20): 핀·시간 없음·조이스틱
  '✓ 숨겼다!': '✓ Hidden!', '보물을 숨겨! 너굴이는 눈 감고 기다려': 'Hide your treasures! Rocky waits, eyes shut', '바로 시작!': 'Start now!',
  '셋 다 숨겼어! 곧 너굴이가 찾아': 'All three hidden! Rocky starts looking soon', '조이스틱으로 움직이고, 휘슬로 엉뚱한 데로!': 'Move with the stick, whistle to lure it away!', '비켜~': 'Scoot~',
  '너굴이가 눈 감고 기다리는 동안 숨길 곳을 터치! 서랍 안, 커튼 뒤, 선반 위… 누른 곳에 바로 쏙 들어가.': 'While Rocky waits with eyes shut, tap a hiding place! In a drawer, behind a curtain, on a shelf… it pops right in where you tap.',
  '찾기 시작하면 조이스틱으로 움직이고, 휘슬을 불면 너굴이가 내 쪽으로 엉뚱하게 달려와!': 'Once it starts looking, move with the stick — blow the whistle and Rocky runs my way instead!',
  // 친구 지킴이 (10/20)
  '친구가 막았다!': 'A friend stopped it!', '안 돼! 몽글이 거야!': "No! That's Mongle's!", '앗!': 'Eek!', '앗! 친구가 지키고 있었어?': 'Eek! A friend was on guard?', '친구가 막음': 'Stopped by friends',
  // 숨기기 = 가구 놓기처럼 (hidehold.js, 10/20)
  '여기 숨기기': 'Hide here', '숨을 곳': 'Hiding place',
  '보물을 골라, 드래그해서 숨겨!': 'Pick a treasure, drag it to hide!', '숨을 곳으로 드래그': 'Drag to a hiding place', '숨을 곳(가구) 가까이로 드래그해 봐!': 'Drag it near a hiding place (furniture)!',
  '자물쇠': 'Padlock', '서랍을 잠가 지켜': 'lock a drawer to guard it',
}, [
  // the raid news (raid.js newsLine): revenge first, so the plain one doesn't take "복수하러 와서 …" for a name
  [/^([^·]+?)[이가] 복수하러 와서 ([^·]+?)[을를] 털어 갔어!(?: \(못 찾은 물건 덕에 \+(\d+)\))?$/, (n, it, c) => `${n} came for revenge and took ${it}!` + (c ? ` (+${c} for what they missed)` : '')],
  [/^([^·]+?)[이가] ([^·]+?)[을를] 털어 갔어!(?: \(못 찾은 물건 덕에 \+(\d+)\))?$/, (n, it, c) => `${n} took ${it}!` + (c ? ` (+${c} for what they missed)` : '')],
  // 타이머 털기
  [/^([^·]+?)[이가] (\d+) 셀 동안 털어라!$/, (n, t) => `Raid it before ${n} counts to ${t}!`],
  [/^(\d+)개 털었어$/, n => `Took ${n}`],
  [/^([^·]+?)[이가] (?:복수하러 와서 )?([^·]+?)[을를] 털어 갔어! \(친구가 (\d+)개 막아 줌\)$/, (n, it, k) => `${n} took ${it}! (friends stopped ${k})`],
  [/^([^·]+?)[이가] 왔다가 (.+?)한테 막혀서 하나도 못 가져갔어! \+(\d+)$/, (n, f, c) => `${n} came, but ${f.split('·').map(x => tr(x)).join(' & ')} stopped them — nothing taken! +${c}`],
  [/^아직 ([^·]+?)[이가] 내 물건 (\d+)개를 갖고 있어\. 다시 털러 오자!$/, (n, k) => `${n} still has ${k} of mine. Come back for ${+k > 1 ? 'them' : 'it'}!`],
  [/^([^·]+?)[이가] 복수하러 올지도!$/, n => `${n} might come for revenge!`],
  // 정찰
  [/^시간 (\d+)초$/, t => `Time ${t}${S}`],
  [/^물건 (\d+)개$/, n => `${n} thing${+n > 1 ? 's' : ''}`],
  [/^자물쇠 (\d+)$/, n => `Locks ${n}`],
  [/^최대 (\d+)$/, n => `Up to ${n}`],
  // 다시 보기
  [/^(\d+)분 전$/, m => `${m} min ago`],
  [/^(\d+)시간 전$/, h => `${h} h ago`],
  [/^([^·]+?)[이가] 몰래 왔어$/, n => `${n} snuck in`],
  [/^([^·]+?)[이가] 복수하러 왔어$/, n => `${n} came for revenge`],
  [/^못 찾은 물건 덕에 코인 \+(\d+) \(이미 받았어\)$/, c => `+${c} coins for what they missed (paid already)`],
  [/^([^·]+?)[이가] 집에 가서 찾으면 되찾을 수 있어!$/, n => `Find it at ${n}'s place to get it back!`],
  [/^열어 놓고 간 서랍 (\d+)개$/, n => `${n} drawer${+n > 1 ? 's' : ''} left open`],
  // 문단속 · 털린 흔적 · 자물쇠
  [/^문단속 (\d+):(\d\d)$/, (h, m) => `Locked ${h}:${m}`],
  [/^문단속! ([^·]+?) 동안 아무도 못 와$/, t => `Door locked! Nobody can come for ${t}`],
  [/^([^·]+?) 동안 아무도 못 와$/, t => `Nobody can come for ${t}`],
  [/^(\d+)시간 (\d+)분$/, (h, m) => `${h} h ${m} min`],
  [/^(\d+)시간$/, h => `${h} h`],
  [/^(\d+)분$/, m => `${m} min`],
  [/^정리 끝! 털린 흔적이 싹 사라졌어 \+(\d+)$/, n => `All tidy! +${n}`],
  [/^지금 (\d+)개를 다 걸었어\. 하나 더 살까\?$/, n => (+n > 1 ? `All ${n} are in use. Buy one more?` : 'Your one padlock is in use. Buy another?')],
  [/^사기 (\d+)$/, p => `Buy ${p}`],
  [/^자물쇠는 (\d+)개까지야$/, n => `Up to ${n} padlocks`],
  [/^자물쇠 (\d+)개째! 숨기기에서 서랍을 잠가 봐$/, n => `Padlock #${n}! Lock a drawer in Hide`],
  [/^자물쇠 (\d+)개째!$/, n => `Padlock #${n}!`],
  [/^자물쇠 (\d+)\/(\d+)$/, (a, b) => `Padlocks ${a}/${b}`],
  [/^(\d+)개 다 있어$/, n => `All ${n} owned`],
  [/^가진 것 (\d+)개$/, n => `Have ${n}`],
  [/^목록에서 고르고, 드래그해서 숨겨요 · 최대 (\d+)개$/, n => `Pick from the list, drag to hide · up to ${n}`],
  [/^경험치 \+(\d+)$/, n => `XP +${n}`],
  [/^보물 (\d+)\/(\d+)$/, (a, b) => `Treasure ${a}/${b}`],
  [/^숨길 물건 (\d+)\/(\d+)$/, (a, b) => `To hide ${a}/${b}`],
  [/^(\d+)개 다 숨겼어! 옮기려면 드래그해$/, n => `All ${n} hidden! Drag one to move it`],
]);
