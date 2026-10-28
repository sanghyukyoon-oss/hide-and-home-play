// 털기 메타의 영어 (10/20 — Discovery 26-4 needs English + Korean; the raid's own words were left Korean on the English screen).
// 타이머 털기 · 정찰 · 다시 보기 · 문단속 · 털린 흔적 · 자물쇠: exact lines here, sentences with names and numbers as patterns.
// (A name capture never takes in ' · ', so a line made of pieces is still split and translated piece by piece.)
import { addI18n, tr } from './i18n.js';

const S = 's';
addI18n({
  // 털 집 찾기 (10/20)
  '냥펀치DJ': 'DJ Cat Punch', 'K팝 연습실': 'K-pop Studio', '내 무대 밟지 마! …숨긴 건 찾아도 돼.': "Don't step on my stage! …The hidden stuff is fair game.",
  '삼색바리스타': 'Calico Barista', '골목 카페와 부엌': 'Alley Café & Kitchen', '오늘의 원두는… 비밀이야.': "Today's beans are… a secret.",
  '비 오는 날 연못': 'Rainy Day Pond', '볼주머니 편의점': 'Cheek Pouch Mart', '마당 있는 거실': 'Living Room with a Yard', '절대 못 찾는 서재': "The Impossible Study",
  'Lv.UP!': 'Lv. UP!',
  '털 집 찾는 중…': 'Finding a house to raid…', '찾았다!': 'Found one!', '다른 집을 찾고 있어': 'Looking for another house',
  '동네에서 털 만한 집을 찾고 있어': 'Searching the neighborhood for a house to raid', '집으로': 'Home', '다른 집 찾기': 'Next', '무료': 'Free', '최근에 턴 집': 'Recently raided', '12시간 안에 또 턴 집이라 보상이 ⅓만 나와요': 'Raided within the last 12 hours · ⅓ rewards',
  '딸기우유냥': 'Strawberry Milk Cat', '딸기 다락방': 'Strawberry Loft', '내 방 예쁘지? 구경만 하고 가~': 'Cute room, right? Just look, okay~',
  '턱시도관장': 'Curator Tux', '작은 미술관': 'Little Gallery', '작품엔 손대지 마세요. 숨긴 건… 찾아도 되고.': "Please don't touch the art. The hidden things… are fair game.",
  // 타이머 털기 (raidrun.js)
  '보물 털었다!': 'Got the treasure!', '내 거 찾았다!': 'Found mine!', '다 셌다! 거기까지~': "Done counting! That's it~", '어? 벌써 가?': 'Huh? Leaving already?',
  '몽땅 털었다!': 'Cleaned out!', '그만 털기!': 'Raid stopped!', '보물까지 싹!': 'Treasure and all!', '하나도 안 남겼어!': 'Not a thing left!', '찾은 만큼 내 거!': 'What you found is yours!',
  '찾은 물건': 'Found', '보물 포함': 'incl. treasure', '되찾은 내 물건': 'My things back', '슬쩍 (이미 있음)': 'Snagged (already had)', '전에 몽땅 턴 집이라 ⅓만 나와요': 'Cleaned out before · ⅓ pay',
  '털기 끝!': 'Raid over!', '★ 절반': '★ Half', '★ 보물': '★ Treasure', '★ 전부': '★ All', '다른 집': 'Another house', '그만 털기': 'Stop raiding', '보물': 'Treasure', '털기': 'Raid',
  // 정찰
  '정찰': 'Scout', '전에 몽땅 턴 집': 'Cleaned out before', '가져올 수 있는 것': 'Up for grabs', '목록': 'List', '다음 집': 'Next house', '털러 가기': 'Raid it!',
  // 다시 보기 (raidreplay.js)
  '방금': 'just now', '복수하러 왔지롱!': 'Revenge time!', '쉿… 아무도 없지?': 'Shh… nobody home?', '여기 수상한데?': 'Looks suspicious…', '어디 보자…': "Let's see…",
  '어디 보자… 딸깍!': "Let's see… click!", '잠겼잖아!': "It's locked!", '헤헤, 이건 내 거~': 'Hehe, mine now~', '없네?': 'Nothing?', '여긴 없네~': 'Nothing here~', '하나도 없잖아! 흥!': 'Nothing at all! Hmph!',
  '자물쇠를 땄어!': 'Lock picked!', '자물쇠가 막았다!': 'The lock held!', '안 들킴!': 'Not found!', '털렸다…': 'Robbed…', '지켜 냈다!': 'Defended!',
  '안 들킴': 'Stayed hidden', '자물쇠가 막음': 'Lock held', '들켰지만 두고 감': 'Found, left behind', '털림': 'Taken', '잘 숨겨 둔 덕분이야!': 'Your hiding paid off!',
  '터치하면 닫혀': 'tap to shut', '더 꽁꽁 숨기기': 'Hide better', '복수하러 가기': 'Get revenge',
  // 문단속 · 자물쇠
  '털린 뒤라 문을 꽁꽁 잠갔어': 'After the raid, the door is locked tight', '자물쇠를 다 썼어': 'All padlocks in use',
  '잠근 서랍 속 물건은 동네 주민이 거의 못 털어 가': 'Things in a locked drawer are hardly ever taken', '다른 데 걸린 걸 풀어서 옮겨 봐': 'Take one off and move it',
  // 손에 든 물건 (handhold.js — 보물 지키기 · 내 집 숨기기, 10/20)
  '원하는 곳으로 드래그해서 숨겨!': 'Drag it anywhere to hide it!', '셋 다 숨겼어! 위의 시작을 터치': 'All three hidden! Tap Start up top', '꼭 숨겨야 해': 'Must be hidden', '다 숨겼어!': 'All hidden!',
  // 보물 지키기 숨기기 (boss.js, 10/20): 핀·시간 없음·조이스틱
  '✓ 숨겼다!': '✓ Hidden!', '보물을 숨겨! 너굴이는 눈 감고 기다려': 'Hide your treasures! Rocky waits, eyes shut', '바로 시작!': 'Start now!',
  '셋 다 숨겼어! 곧 너굴이가 찾기 시작해': 'All three hidden! Rocky starts looking soon', '휘슬을 불어 너굴이를 따돌려!': 'Blow the whistle to lure Rocky away!', '비켜~': 'Scoot~',
  '너굴이가 눈 감고 기다리는 동안 보물을 드래그해서 숨겨. 서랍 안, 커튼 뒤, 선반 위… 놓은 곳에 쏙 들어가.': 'While Rocky waits with eyes shut, drag a treasure to hide it. In a drawer, behind a curtain, on a shelf… it slips right in where you drop it.',
  '너굴이가 찾기 시작하면 난 가만히 있을게. 휘슬을 불면 보물 말고 내 쪽으로 달려와!': 'When Rocky starts looking, I stay put. Blow the whistle and Rocky runs to me, not the treasure!',
  // 친구 지킴이 (10/20)
  '친구가 막았다!': 'A friend stopped it!', '안 돼! 몽글이 거야!': "No! That's Mongle's!", '앗!': 'Eek!', '앗! 친구가 지키고 있었어?': 'Eek! A friend was on guard?', '친구가 막음': 'Stopped by friends',
  // 숨기기 = 가구 놓기처럼 (hidehold.js, 10/20)
  '여기 숨기기': 'Hide here', '숨을 곳': 'Hiding place',
  '보물을 골라, 드래그해서 숨겨!': 'Pick a treasure, drag it to hide!', '숨을 곳으로 드래그': 'Drag to a hiding place', '숨을 곳(가구) 가까이로 드래그해 봐!': 'Drag it near a hiding place (furniture)!',
  '자물쇠': 'Padlock', '서랍을 잠가 지켜': 'lock a drawer to guard it',
  // 자주 털리게 (② 10/22): the coin purse, the padlock button on '내가 없는 동안…'
  '자물쇠 걸기': 'Hang a padlock', '자물쇠 사기': 'Buy a padlock', '더 꽁꽁': 'Hide better', '자물쇠를 걸면 덜 털려!': 'Padlocks keep raiders out!',
  // 지키기 도구 (② 10/22)
  '미끼 상자': 'Decoy Box', '바나나 껍질': 'Banana Peel', '경보 벨': 'Alarm Bell', '순찰 로봇청소기': 'Patrol Robot Vacuum', '로봇청소기': 'Robot Vacuum',
  '털이범이 들고 감': 'a raider takes it instead', '미끄덩 한 번': 'one slip', '서랍에 달기': 'hang on a drawer', '털이범을 쫓아내': 'chases raiders out', '이미 있어': 'You have one', '있어': 'Owned',
  '미끼 상자! 꾸미기에서 방에 놓아 봐': 'Decoy Box! Place it in Decorate', '바나나 껍질! 꾸미기에서 방에 놓아 봐': 'Banana Peel! Place it in Decorate',
  '경보 벨! 숨기기에서 서랍에 달아 봐': 'Alarm Bell! Hang it on a drawer in Hide', '로봇청소기! 꾸미기에서 방에 놓아 봐': 'Robot Vacuum! Place it in Decorate',
  '벨을 다 달았어 · 상점 아이템에서 하나 더': 'All your bells are up · get another in the shop', '벨을 달았어! 이 서랍을 열면 따르릉': 'Bell hung! Open this drawer and it rings',
  '따르르릉!': 'Brrring!', '미끄덩!': 'Whoops!', '위잉~ 로봇청소기!': 'Whirr~ Robot vacuum!', '미끼 상자를 들고 갔다! 메롱~': 'They took the decoy box! Nyah~', '지키기 도구': 'Guard tool',
}, [
  // (② 10/22) 지키기 도구: the news lines and the hide row
  [/^([^·]+?)[이가] 미끼 상자를 들고 갔어! 속았지롱 \+(\d+)$/, (n, c) => `${n} ran off with the decoy box! Fooled! +${c}`],
  [/^([^·]+?)[이가] 경보 벨에 놀라서 도망갔어! \+(\d+)$/, (n, c) => `${n} fled from the alarm bell! +${c}`],
  [/^([^·]+?)[이가] 바나나 껍질에 미끄러져서 빈손으로 갔어! \+(\d+)$/, (n, c) => `${n} slipped on a banana peel and left empty-handed! +${c}`],
  [/^([^·]+?)[이가] 로봇청소기한테 쫓겨났어! \+(\d+)$/, (n, c) => `${n} got chased out by the robot vacuum! +${c}`],
  [/^벨 (\d+)\/(\d+)$/, (a, b) => `Bells ${a}/${b}`],
  [/^(.+) 벨 달기$/, l => `Bell on ${l}`],
  [/^(.+) 벨 떼기$/, l => `Bell off ${l}`],
  [/^(\d+)판부터$/, n => `From stage ${n}`],
  [/^미끄덩! -(\d+)초$/, n => `Whoops! -${n}s`],
  [/^메롱! 미끼였다 -(\d+)초$/, n => `Nyah! A decoy -${n}s`],
  [/^따르르릉! -(\d+)초$/, n => `Brrring! -${n}s`],
  [/^(.+), 우리 집에도 놓을 수 있어! \(상점 아이템\)$/, t => `${t.split('·').map(x => tr(x)).join(' & ')} — you can put it in your home too! (Shop · Items)`],
  // (② 10/22) a coin purse taken, or a gift's thing found and left: before the plain news lines
  [/^([^·]+?)[이가] (복수하러 와서 )?코인 (\d+)개를 털어 갔어! -(\d+)$/, (n, rv, c) => `${n} ${rv ? 'came for revenge and ' : ''}took ${c} coins! -${c}`],
  [/^([^·]+?)[이가] 왔다가 빈손으로 갔어!$/, n => `${n} came and left empty-handed!`],
  [/^코인 (\d+)개$/, n => `${n} coins`],
  [/^코인 -(\d+)$/, n => `-${n} coins`],
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
  [/^털다 나온 집 정산 · 코인 \+(\d+)$/, n => `Raid left half way · +${n} coins`],
  [/^지난번 털다 만 집 정산 · 코인 \+(\d+)$/, n => `Last unfinished raid · +${n} coins`],
  [/^보물 (\d+)\/(\d+)$/, (a, b) => `Treasure ${a}/${b}`],
  [/^숨길 물건 (\d+)\/(\d+)$/, (a, b) => `To hide ${a}/${b}`],
  [/^(\d+)개 다 숨겼어! 옮기려면 드래그해$/, n => `All ${n} hidden! Drag one to move it`],
]);
