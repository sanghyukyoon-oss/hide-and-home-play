// 영어·한국어 (2026-10-17, Discovery 26-4 requires English + Korean in-game text). The game is written in Korean; in
// English every Korean text the player sees is swapped on its way to the screen:
//   1. the exact text from the dictionary (i18n-en-dict.js),
//   2. else a pattern for sentences built with numbers and names (below), its pieces translated in turn,
//   3. else phrase by phrase (longest known run of words first, Korean particles dropped).
// The DOM is watched (toasts, panels, buttons, bubbles…); dialog lines and canvas signs call tr() themselves.
// Language: the phone's language unless the player picked one (settings); switching reloads the page.
import { EN } from './i18n-en-dict.js';
import { EN_APP } from './i18n-en-app.js';
for (const k in EN_APP) if (EN[k] == null) EN[k] = EN_APP[k];   // what the app build still missed (10/19) — the dictionary wins

const KEY = 'sumbakkokjip.lang';
export const LANG = (() => {
  try { const s = localStorage.getItem(KEY); if (s === 'ko' || s === 'en') return s; } catch {}
  return (navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
})();
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch {} location.reload(); }

const HAN = /[가-힣]/;
const miss = new Set();
const P = s => tr(s);                       // translate a captured piece
const obj = n => /^(the|a|an) /i.test(n) || /^[A-Z]/.test(n) ? n : 'the ' + n;   // "the remote", but "Bunbun"
// [pattern, english(...captures)] — captures arrive already translated
const PAT = [
  [/^(\d+)장에서 열려$/, n => `Opens in chapter ${n}`],   // (상점: 아직 안 열린 가구 — 스토리 룸 10/20)
  [/^([\d.]+)배$/, n => `×${n}`],                          // (배치 편집: 크기 1.2배)
  [/^불 꺼진 층에서 친구 (\d+)명 찾기! 너굴이를 터치하면 시간이 줄어$/, n => `Find ${n} friends on the dark floor! Tapping Rocky costs time`],
  [/^([\d · ]+)판 뒤( \(.+\))?$/, (a, b) => `after stage ${a.trim()}${b ? ' ' + tr(b.trim().slice(1, -1)).replace(/^/, '(') + ')' : ''}`],
  [/^(\d+)명 찾았어… 남은 친구들이 킥킥 웃고 있어$/, n => `Found ${n}… the rest are still giggling`],
  [/^(\d+)라운드 · 잘 봐!$/, n => `Round ${n} · watch closely!`],
  [/^(\d+)명 찾았어… (\d+)명까지 조금만 더!$/, (a, b) => `Found ${a}… just a few more to ${b}!`],
  [/^간식 작전 성공! 하트 (\d+)개 남았어$/, n => `Snack mission done! ${n} heart${n === '1' ? '' : 's'} left`],
  [/^바뀐 곳 (\d+) \/ (\d+)$/, (a, b) => `Changes found ${a} / ${b}`],
  [/^잘 봐 둬! (\d+)$/, n => `Look closely! ${n}`],
  [/^찾은 친구 (\d+) \/ (\d+)$/, (a, b) => `Friends found ${a} / ${b}`],
  [/^친구 (\d+)명을 찾았어! 숨바꼭질 달인$/, n => `You found ${n} friends! Hide-and-seek master`],
  [/^(.+) 승리!$/, n => `${n}: you win!`],
  [/^보스 · (.+)$/, n => `Boss · ${n}`],
  [/^★ 보너스 (\d+)\/(\d+)$/, (a, b) => `★ Bonus ${a}/${b}`],
  [/^쉬어가기 · (.+)$/, n => `Break time · ${n}`],
  [/^(.+) 성공!$/, n => `${n}: cleared!`],
  [/^아 참, 다음은 보스 놀이 「(.+)」래! 각오해!$/, n => `Oh, next up is the boss game "${n}"! Get ready!`],
  [/^([무궁화꽃이피었습니다 ]+)$/, s => s.replace(/무/g, 'Mu').replace(/궁/g, '-gung').replace(/화/g, '-hwa').replace(/ ?꽃/g, ' kkot').replace(/이/g, '-i').replace(/ ?피/g, ' pi').replace(/었/g, '-eot').replace(/습/g, '-seum').replace(/니/g, '-ni').replace(/다/g, '-da!')],
  [/^내 코인 (\d+)$/, n => `My coins ${n}`],
  [/^(.+?)[이가] 숨었다! 소리 나는 곳을 찾아봐$/, n => `${n} is hiding! Follow the sound`],
  [/^단서를 모아 (.+?)[이가] 숨은 곳을 열어 봐!$/, n => `Gather the clues and open where ${n} is hiding!`],
  [/^아 참, (.+?)[이가] 요즘 수상해! 다음엔 거기 가 보자$/, n => `Oh right, ${n} has been acting strange lately! Let's go there next`],
  [/^(\d+)초$/, n => `${n}s`],
  [/^(\d+)분 (\d+)초$/, (m, n) => `${m}m ${n}s`],
  [/^힌트 (\d+)번$/, n => `${n} hint${n === '1' ? '' : 's'}`],
  [/^최고 콤보 x(\d+)$/, n => `best combo x${n}`],
  [/^숨긴 물건 (\d+)개$/, n => `${n} hidden`],
  // 보스 · 보물 지키기 (10/17)
  [/^(.+?)에 (.+?) 쏙!$/, (a, b) => `${b} tucked ${a.charAt(0).toLowerCase() + a.slice(1)}!`],
  [/^너굴이가 (.+?) 쪽으로 가고 있어! 막아!$/, n => `Rocky is heading for ${obj(n)}! Block him!`],
  [/^찾았다! (.+?)!$/, n => `Found it! ${n}!`],
  // 야식 셋째 간식 '아이스크림까지!' (GPT QA R2-06, 10/19): one word, then 까지
  [/^([가-힣]+)까지!$/, n => `${n} too!`],
  [/^(.+?) 들켰다!$/, n => `${n} found!`],
  [/^(.+?) 확인~$/, n => `Checking ${n.charAt(0).toLowerCase() + n.slice(1)}~`],
  [/^보물 (\d+)개를 지켰어!$/, n => `You kept ${n} treasure${n === '1' ? '' : 's'} safe!`],
  [/^보물을 숨겨! 너굴이가 세는 중… (\d+)$/, n => `Hide your treasures! Rocky is counting… ${n}`],
  [/^스테이지 (\d+)에서 만날 수 있어$/, n => `Shows up at stage ${n}`],
  [/^(\d+)탄에서 만나요$/, n => `See you in part ${n}`],   // home.js 친구 목록이 아직 이 말을 씀
  [/^크기 (.+)$/, s => `Size ${s}`],
  [/^(.+?) 카드$/, n => `${n} card`],
  [/^이제 내 캐릭터는 (.+)!$/, n => `You're playing as ${n} now!`],
  [/^이제 (.+?)[이가] 같이 다녀요!$/, n => `${n} walks with you now!`],
  [/^🎁 별 상자 (\d+)$/, n => `🎁 Star boxes ${n}`],
  [/^도감 (\d+)\/(\d+)$/, (a, b) => `Collection ${a}/${b}`],
  [/^김치냉장고 (\d+)칸$/, n => `Kimchi fridge drawer ${n}`],
  [/^(\d+)호 우편함$/, n => `Mailbox ${n}`],
  [/^우편함 (\d+)호$/, n => `Mailbox ${n}`],
  [/^서랍 (\d+)칸$/, n => `Drawer ${n}`],
  [/^책장 (\d+)층$/, n => `Bookshelf row ${n}`],
  [/^캐비닛 (\d+)칸$/, n => `Cabinet drawer ${n}`],
  [/^(\d+) fps · 화질 (\d+)단계\(x(.+?), dpr (.+?)\) · 메시 (.+?) · 삼각형 (.+?)k$/, (a, b, c, d, e, f) => `${a} fps · quality ${b} (x${c}, dpr ${d}) · meshes ${e} · tris ${f}k`],
  [/^(.+?)[이가] 복수하러 와서 (.+?)[을를] 털어 갔어!$/, (a, b) => `${a} came for revenge and took ${obj(b)}!`],
  [/^(.+?)[이가] (.+?)[을를] 털어 갔어!$/, (a, b) => `${a} snuck in and took ${obj(b)}!`],
  [/^\(못 찾은 물건 덕에 \+(\d+)\)$/, n => `(+${n} for what they couldn't find)`],
  [/^(.+?)[이가] 복수하러 왔다가 하나도 못 찾고 갔어! \+(\d+)$/, (a, n) => `${a} came for revenge and found nothing! +${n}`],
  [/^(.+?)[이가] 몰래 왔다가 하나도 못 찾고 갔어! \+(\d+)$/, (a, n) => `${a} snuck in and found nothing! +${n}`],
  [/^(\d+)~(\d+)판 · (.+)$/, (a, b, c) => `Stages ${a}–${b} · ${c}`],
  [/^스테이지 (\d+)$/, n => `Stage ${n}`],
  [/^찾을 물건 (\d+)개$/, n => `${n} things to find`],
  [/^자물쇠: (.+)$/, s => `Locks: ${s}`],
  [/^(.+?)의 방$/, n => `${n}'s room`],
  [/^숨어! 너굴이가 세는 중… (\d+)$/, n => `Hide! Rocky is counting… ${n}`],
  [/^너굴이를 따돌렸어! (♥*) 남김$/, h => `You lost Rocky! ${h} left`],
  [/^코인 \+(\d+)$/, n => `Coins +${n}`],
  [/^친구 도감 (\d+)\/(\d+)$/, (a, b) => `Friends ${a}/${b}`],
  [/^Lv\.(\d+) 숨바꼭질 탐정$/, n => `Lv.${n} Hide & Seek Detective`],
  [/^무한 모드 (\d+) · (.+)$/, (n, r) => `Endless ${n} · ${r}`],
  [/^다음: (.+?)네$/, n => `Next: ${n}'s`],
  [/^(.+?)네 집$/, n => `${n}'s house`],
  [/^저장했어요\. 그런데 숨길 자리가 (\d+)곳뿐이라 (\d+)곳은 있어야 안전해요 — 가구를 조금 더 놓아 주세요$/, (a, b) => `Saved. But there are only ${a} hiding spots — ${b} would be safe. Add a little more furniture`],
  [/^저장했어요\. 그런데 숨길 자리가 (\d+)곳뿐이라 (\d+)곳은 있어야 안전해요 — 가구를 조금 더 놓아 주세요$/, (a, b) => `Saved. But there are only ${a} hiding spots and ${b} are needed to be safe — add a little more furniture`],
  [/^저장! 이 방을 쓰는 스테이지 (\d+)개\((.+)\)에 적용돼요$/, (a, b) => `Saved! Applies to the ${a} stages using this room (${b})`],
  [/^고친 방 (\d+)개\. 아래 글을 통째로 복사해서 보내 주세요\.$/, n => `${n} edited rooms. Copy all the text below and send it.`],
  [/^같은 방을 쓰는 스테이지: (.+)$/, s => `Stages using this room: ${s}`],
  [/^스테이지 (\d+)에서 열려 · 상점에서 미리 열 수도 있어$/, n => `Opens at stage ${n} · or open it early in the shop`],
  [/^올린 방: (.*?) · 물건 (\d+)개 \(연습 모드에선 나만 볼 수 있어요\)$/, (a, b) => `Posted: ${a} · ${b} things (only you can see it in practice mode)`],
  [/^내 방에 놀러 온 사람 (\d+)명 · 도전 (\d+)번 · 다 찾음 (\d+) · 못 찾음 (\d+)$/, (a, b, c, d) => `Visitors ${a} · tries ${b} · found all ${c} · gave up ${d}`],
  [/^보상 \+(\d+)$/, n => `Reward +${n}`],
  // 친구 부르기 (경제, 10/20)
  [/^코인 (\d+)개 더 모으면 부를 수 있어$/, n => `${n} more coins and you can call them`],
  // 상점 미리보기 (경제, 10/20)
  [/^(.+) 샀어!$/, n => `Bought ${n}!`],
  // 남은 터치 → 코인 (경제, 10/20)
  [/^남긴 터치 (\d+)개 → \+(\d+)$/, (a, b) => `${a} touches saved → +${b}`],
  // 선물 상자 (경제, 10/20)
  [/^자물쇠 (\d+)개째! 숨기기에서 서랍을 잠가 봐$/, n => `Padlock no. ${n}! Lock a drawer when you hide things`],
  [/^(.+) · 숨기기에서 집에 숨겨 봐$/, n => `${n} · hide it at home`],
  [/^(.+) · 꾸미기 보관함에 들어갔어$/, n => `${n} · it's in your decorating storage`],
  [/^코인 (\d+)개!$/, n => `${n} coins!`],
  [/^코인 (\d+)$/, n => `${n} coins`],
  // 방 넓히기 (경제, 10/20)
  [/^넓히기 (\d+)$/, n => `Expand ${n}`],
  [/^가구 놓을 칸 \+(\d+)$/, n => `+${n} tiles for furniture`],
  [/^코인 (\d+)개 더 모으면 넓힐 수 있어$/, n => `${n} more coins and you can expand it`],
  [/^한 번에 (\d+)개까지 숨길 수 있어$/, n => `You can hide up to ${n} at a time`],
  [/^이제 (.+?)에 숨겨! 전에 숨긴 방은 저장해 뒀어$/, n => `Now hiding in ${obj(n)}! The old room is saved`],
  [/^물건 고르고 숨길 곳 터치 · 최대 (\d+)개$/, n => `Pick a thing and tap where to hide it · up to ${n}`],
  [/^스테이지에서 찾은 물건이 여기 모여요 \((\d+)종\)$/, n => `Things you found in stages gather here (${n} kinds)`],
  [/^(.+?) 잠금 풀기$/, n => `Unlock ${n}`],
  [/^(.+?) 잠그기$/, n => `Lock ${n}`],
  [/^(.+?) 잠금 해제$/, n => `${n} unlocked`],
  [/^(.+?)[을를]\(를\) 다시 놓아 주세요$/, n => `Put ${obj(n)} back`],
  [/^(.+?)을\(를\) 다시 놓아 주세요$/, n => `Put ${obj(n)} back`],
  [/^(.+?) · 숨긴 물건 (\d+)개$/, (a, b) => `${a} · ${b} hidden`],
  [/^몽글이 방 · 방어 (\d+)승 (\d+)패$/, (a, b) => `Mongle's Room · defended ${a} · lost ${b}`],
  [/^숨긴 물건 (\d+)개$/, n => `${n} hidden`],
  [/^(.+?) 구입! 보관함에서 꺼내 놓자$/, n => `Bought ${n}! Take it out of storage`],
  [/^보유 (\d+)$/, n => `Owned ${n}`],
  // 경제·로비 (10/19)
  [/^돋보기 가방 (\d+)\/5$/, n => `Magnifier bag ${n}/5`],
  [/^친구 (\d+)명이 놀러 왔어!$/, n => `${n} friends came over!`],
  [/^(.+?)(?:이|가) 놀러 왔어!$/, n => `${n} came over!`],
  [/^친구 (\d+)\/(\d+)$/, (a, b) => `Friends ${a}/${b}`],
  [/^도감 \+(\d+)$/, n => `Card book +${n}`],
  [/^상점에 '(.+?)' 가구 (\d+)개가 들어왔어!$/, (r, n) => `${n} pieces from '${r}' are in the shop!`],
  [/^🎁 지난 장 선물 (\d+)$/, n => `🎁 Past chapter gifts ${n}`],
  [/^(.+?) 선물 상자!$/, n => `${n} gift box!`],
  [/^(.+?) · 꾸미기 보관함에 들어갔어$/, n => `${n} · in your decorating storage`],
  [/^(.+?) · 이제 내 집에 숨길 수 있어$/, n => `${n} · you can hide it at home now`],
  [/^숨을 곳 (\d+)$/, n => `Hiding spots ${n}`],
  [/^엄마의 촉: 다음엔 '(.+?)'부터 의심할걸\?$/, n => `Mom's hunch: next time she'll check '${n}' first`],
  [/^(\d+)분 (\d+)초$/, (m, s) => `${m}m ${s}s`],
  [/^(\d+)초$/, s => `${s}s`],
  [/^숨겨 둔 물건 (\d+)개를 찾아라!$/, n => `Find the ${n} hidden things!`],
  [/^(.+?)[이가] 숨긴 물건 (\d+)개를 찾아라!$/, (a, n) => `Find the ${n} things ${a} hid!`],
  [/^너굴이가 세는 중 · (\d+)\/(\d+)$/, (a, b) => `Rocky is counting · ${a}/${b}`],
  [/^(\d+)개$/, n => `${n}`],
  [/^콤보 x(\d+)!$/, n => `Combo x${n}!`],
  [/^(.+?) 획득! (.+?)한테 갖다 주자$/, (a, b) => `Got ${obj(a)}! Take it to ${b}`],
  [/^(.+?) 획득! 모래밭의 빨간 X를 터치!$/, a => `Got ${obj(a)}! Tap the red X in the sandbox!`],
  [/^색깔 순서: (.+)$/, s => `Color order: ${s}`],
  [/^쪽지 조각을 다 모았다! 비밀번호 (.+)$/, s => `All note scraps found! Password ${s}`],
  [/^쪽지 조각 (\d+)\/(\d+)! 나머지 조각도 어딘가에 있어$/, (a, b) => `Note scrap ${a}/${b}! The rest are somewhere around`],
  [/^비밀번호는 (.+?)! 금고를 열어봐$/, s => `The password is ${s}! Open the safe`],
  [/^(.+?)[이가] 비켜 주지 않아! 좋아하는 간식을 찾아 줘$/, a => `${a} won't budge! Find their favorite treat`],
  [/^막혔어\? 삐빅! 코인 (\d+)개면 내가 대신 열어 줄게\.$/, n => `Stuck? Beep! For ${n} coins I'll open it for you.`],
  [/^가진 코인 (\d+)$/, n => `Your coins ${n}`],
  [/^부탁해 \((\d+)\)$/, n => `Please (${n})`],
  [/^코인이 모자라! \((\d+) 필요\)$/, n => `Not enough coins! (${n} needed)`],
  [/^TV에 나온 비밀번호: (.+)$/, s => `Password on TV: ${s}`],
  [/^TV를 켰다! 비밀번호는 (.+)$/, s => `TV on! The password is ${s}`],
  [/^찬장 비밀번호는 (.+?)!$/, s => `The cupboard password is ${s}!`],
  [/^비밀번호 (.+?)! 잠긴 찬장을 열어 봐$/, s => `Password ${s}! Open the locked cupboard`],
  [/^비밀 아이템 발견! (.+)$/, n => `Secret item found! ${n}`],
  [/^(\d+)판 올클리어!$/, n => `All ${n} stages cleared!`],
  [/^걸린 시간 (.+)$/, s => `Time ${s}`],
  [/^ · 힌트 (\d+)번$/, n => ` · ${n} hints`],
  [/^· 힌트 (\d+)번$/, n => `· ${n} hints`],
  [/^ · 최고 콤보 x(\d+)$/, n => ` · best combo x${n}`],
  [/^· 최고 콤보 x(\d+)$/, n => `· best combo x${n}`],
  [/^(.+?) · 내 집에 숨길 수 있어요$/, n => `${n} · you can hide it at home`],
  [/^(.+?)[이가] 이제 동네에 놀러 와요$/, n => `${n} will visit town now`],
  [/^(.+?) · 다시 내 집에 숨길 수 있어 \(\+20\)$/, n => `${n} · you can hide it at home again (+20)`],
  [/^(\d+)개 되찾았다! \(\+(\d+)\)$/, (a, b) => `Got ${a} back! (+${b})`],
  [/^외 (\d+)개$/, n => `+${n} more`],
  [/^(.+?) · 내 수집품에 추가! 내 집에 숨길 수 있어$/, n => `${n} · added to your collection! Hide it at home`],
  [/^(.+?) · 이미 있어서 코인 \+(\d+)$/, (n, c) => `${n} · already had it, coins +${c}`],
  [/^(.+?)[이가] 눈치챘을지도… 복수하러 올 수 있어! 내 집 물건을 더 꼭꼭 숨겨 둬$/, n => `${n} may have noticed… they might come for revenge! Hide your things at home extra well`],
  [/^(.+?) · 내 집 보관함에 들어갔어요$/, n => `${n} · added to your home storage`],
  [/^내 집에 (.+?)[이가] 생겼어!$/, n => `Your home now has a ${n}!`],
  [/^(\d+) \/ (\d+) 찾음$/, (a, b) => `${a} / ${b} found`],
  [/^(.+?) · 찾은 물건 (\d+)\/(\d+)$/, (a, b, c) => `${a} · found ${b}/${c}`],
  [/^내 물건 (\d+)개를 갖고 있어! 되찾으러 가자$/, n => `They have ${n} of your things! Go get them back`],
  [/^ · (\d+)명 도전, (\d+)명 성공$/, (a, b) => ` · ${a} tried, ${b} succeeded`],
  [/^(.+?)에 놓을 수 있는 가구예요\. 숨을 곳이 많을수록 찾기 어려워져요\.$/, n => `Furniture for the ${n}. More hiding spots make it harder to search.`],
  [/^(.+?)의 분위기를 통째로 바꿔요\. 바꾸면 벽지·바닥은 그 테마 것으로 돌아가요\.$/, n => `Changes the whole look of the ${n}. Walls and floor switch to the theme's.`],
  [/^(.+?)[이가] '(.+?)' 테마로 바뀌었어!$/, (a, b) => `${a} is now '${b}'!`],
  [/^(.+?) 크기를 한 칸씩 넓혀요\. 놓아 둔 가구와 숨긴 물건은 그대로예요\.$/, n => `Widens the ${n} one tile at a time. Furniture and hidden things stay put.`],
  [/^(.+?)[이가] (\d+)×(\d+)로 넓어졌어!$/, (a, w, d) => `${a} is now ${w}×${d}!`],
  [/^스테이지 (\d+)에서 무료$/, n => `Free at stage ${n}`],
  [/^(.+?)[이가] 열렸어!$/, n => `${n} is open!`],
  [/^비밀번호 (.+?)!$/, s => `Password ${s}!`],
  [/^말썽이가 (.+?)[을를]?\(를\) 다른 데 숨겼어!$/, n => `Trixie hid ${obj(n)} somewhere else!`],
  [/^(.+?)[이가] 코인 (\d+)개를 선물했어!$/, (a, n) => `${a} gave you ${n} coins!`],
  // 몽글 호텔 X박 X일 (hotel.js)
  [/^몽글 호텔 · (\d박 \d일)$/, a => `Mongle Hotel · ${tr(a)}`],
  [/^(\d박 \d일) 여행 끝$/, a => `End of the ${tr(a)}`],
  [/^(\d+) 파티룸$/, a => `${a} Party`],
  [/^(\d+) 공사 중$/, a => `${a} Closed`],
  [/^(\d+)호 공사 중! 오늘은 못 써요$/, a => `Room ${a} is under repair! Closed tonight`],
  [/^(\d+)호는 공사 중이에요$/, a => `Room ${a} is under repair`],
  [/^둠칫이 생일! 파티룸\((\d+)호\)으로 보내 줘$/, a => `It's DJ Bop's birthday! Party room ${a}, please`],
  [/^(.+?)랑 싸웠대 · 오늘은 옆방 싫어!$/, a => `Fought with ${tr(a)} · not next door tonight!`],
  [/^오늘 생일! 파티룸\((\d+)호\)에 묵고 싶어$/, a => `Birthday today! Wants party room ${a}`],
  [/^손님 (\d+)명 남음$/, a => `${a} guest${a === '1' ? '' : 's'} left`],
  [/^명 · 행복한 손님 (\d+)\/(\d+)$/, (a, b) => ` · happy guests ${a}/${b}`],
  [/^\/ (\d+) · 그래도 불 끌까\?$/, a => `/ ${a} · lights out anyway?`],
  [/^(.+?) 어디 있지…$/, a => `Where's ${tr(a)}…?`],
  [/^(.+?) 보고 싶다…$/, a => `I miss ${tr(a)}…`],
  [/^(.+?)랑 옆방 하고 싶어$/, a => `I want the room next to ${tr(a)}`],
  [/^(.+?)[이가] 잠을 설쳤대…$/, a => `${tr(a)} slept badly…`],
  [/^(.+) \(불만 (\d+)명\)$/, (a, b) => `${tr(a)} (${b} unhappy)`],
  [/^별 (\d+) \/ (\d+) · (.+)$/, (a, b, c) => `Stars ${a} / ${b} · ${tr(c)}`],
  // 추로야!!! (churro.js)
  [/^장난 게이지를 먼저 채우자 \((\d+)\/(\d+)\)$/, (a, b) => `Fill the mischief meter first (${a}/${b})`],
  [/^물건 전부 툭 \((\d+)\/(\d+)\)$/, (a, b) => `Knock off everything (${a}/${b})`],
  [/^장난 게이지 (\d+)\/(\d+) · 깨지는 물건은 2칸$/, (a, b) => `Mischief meter ${a}/${b} · breakables count double`],
  // 아침 깨우기 (wakeup.js)
  [/^새 조각! (.+)$/, a => `New piece! ${tr(a)}`],
  [/^조각 (\d+)개로$/, a => `${a} piece${a === '1' ? '' : 's'} or fewer`],
  [/^(?:(.+?!) )?조각 (\d+)개로도 돼!$/, (a, b) => `${a ? tr(a) + ' ' : ''}You can do it with ${b} piece${b === '1' ? '' : 's'}!`],
  // bossgame.js · stage.js
  [/^보스 클리어! 코인 \+(\d+)$/, a => `Boss cleared! Coins +${a}`],
  // QA 10/18: English gaps found in the campaign (before the broad patterns at the end)
  [/^쉬어가기 성공! 코인 \+(\d+)$/, a => `Break cleared! Coins +${a}`],
  [/^★ 헛짚기 (\d+)번$/, a => `★ Wrong picks: ${a}`],
  [/^헛손질 (\d+)$/, a => `Missed taps: ${a}`],
  [/^남은 물건 (\d+)개도 찾아 줘!$/, a => `Find the other ${a} things too!`],
  [/^(\d+)판$/, a => `Stage ${a}`],
  [/^(.+?)[을를] 터치하면 엄마가 가요$/, n => `Tap the ${n.charAt(0).toLowerCase() + n.slice(1)} and Mom goes to it`],
  [/^터치하면 (술래|엄마)가 끄러 가요 · 한 번만$/, w => `Tap it and ${w === 'Mom' ? 'Mom' : 'the seeker'} goes to turn it off · once`],
  [/^꺼내는 중… (\d+)\/(\d+)$/, (a, b) => `Taking one out… ${a}/${b}`],
  [/^(.+) = (.+)$/, (a, b) => `${a} = ${b}`],   // 이불 속 누구게?: a miss names the clue
  [/^(\d+)점부터 성공! 이불 모양이랑 꼬리를 잘 봐$/, a => `Clear at ${a} pts! Watch the lump's shape and the tails`],
  [/^내 집에 (.+?)[이가] 생겼어!$/, a => `Your home now has a ${tr(a)}!`],
  // 엄마 몰래 성적표 (report.js)
  [/^엄마: (.+?) 뒤지는 중$/, a => `Mom's searching: ${tr(a)}`],
  [/^엄마: (.+?)\?$/, a => `Mom: ${tr(a)}?`],
  [/^(.+?) 위험해!$/, a => `Danger: ${tr(a)}!`],
  [/^킁킁… (.+?) 수상한데\?$/, a => `Sniff sniff… ${tr(a)}? Suspicious…`],
  // 손전등 숨바꼭질 (flashlight.js)
  [/^배터리 (\d+)초 남기고 (\d+)명 다 찾았어!$/, (a, b) => `Found all ${b} with ${a}s of battery left!`],
  [/^(\d+)명 중 (\d+)명 찾았어!$/, (a, b) => `Found ${b} of ${a}!`],
  [/^(.+?)에서 찾았다!$/, a => `Found you! (${tr(a)})`],
  [/^-(\d+)초$/, a => `-${a}s`],
  // 두더지 숨바꼭질 (whack.js)
  [/^(\d+)점 · 친구 (\d+)명 찾음 · 최고 (\d+)연속$/, (a, b, c) => `${a} pts · ${b} friend${b === '1' ? '' : 's'} found · best ${c} in a row`],
  [/^(\d+)점부터 성공! 너굴이는 꾹 참기$/, a => `Clear at ${a} pts! Don't tap Rocky`],
  [/^(\d+) 연속$/, a => `${a} in a row`],   // the combo tag: shown through CSS attr(data-combo), so it needs tr() in updCombo()
  // 무궁화 꽃이 피었습니다 (redlight.js)
  [/^(.+?[!?]) (\S+) 아웃!$/, (a, b) => `${tr(a)} ${tr(b)}'s out!`],
  [/^(\d+)초 안에 땡 하면 별 하나 더!$/, a => `Tag within ${a}s for an extra star!`],
  [/^친구 (\d+)명 구출 · (\d+)초에 땡(?: · 아슬아슬 (\d+)번)?$/, (a, b, c) => `${a} friend${a === '1' ? '' : 's'} rescued · tagged at ${b}s${c ? ` · ${c} close call${c === '1' ? '' : 's'}` : ''}`],
  [/^잡힌 횟수 (\d+)번(?: · 친구 (\d+)명 구출)?$/, (a, b) => `Caught ${a} time${a === '1' ? '' : 's'}${b ? ` · ${b} friend${b === '1' ? '' : 's'} rescued` : ''}`],
  // 잉키의 바꿔치기 (inky.js): the real thing talks back; the noun comes with its particle (화분이), tr() drops it
  [/^나 진짜 (.+)거든\?$/, a => `I'm a real ${a.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())}, honest!`],
  [/^난 그냥 (.+)야!$/, a => `Just a plain old ${a.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())}!`],
  [/^진짜 (.+)라니까~$/, a => `I'm a real ${a.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())}, I tell ya~`],
  [/^색만 뺏긴 진짜 (.+)야 ㅠㅠ$/, a => `A real ${a.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())}, just drained of color T_T`],
  [/^(\d+)점 · (\d+)번 찾음 · 최고 (\d+)연속$/, (a, b, c) => `${a} pts · found ${b} time${b === '1' ? '' : 's'} · best ${c} in a row`],
  [/^(\d+)점이면 성공! 깜빡 눈을 노려봐$/, a => `Clear at ${a} pts! Watch for blinking eyes`],
  // 소풍 보물찾기 (picnic.js)
  [/^남은 쪽지 (\d+)장$/, a => `${a} slip${a === '1' ? '' : 's'} left`],
  [/^가을 소풍 · 몽글이 쪽지 (\d+)장$/, a => `Autumn Picnic · Mongle's slips: ${a}`],
  [/^몽글이 · 쪽지 (\d+)장$/, a => `Mongle · ${a} slip${a === '1' ? '' : 's'}`],
  [/^(\d+)점부터 성공! "뜨거워~" 쪽 옆을 뒤져 봐$/, a => `Clear at ${a} pts! Search next to the "hot~" spots`],
  // 이불 속 누구게? (blanket.js)
  [/^냠! \+(\d+)$/, a => `Nom! +${a}`],
  [/^(\d+)점부터 성공! 삐죽 나온 귀·꼬리를 잘 봐$/, a => `Clear at ${a} pts! Watch the ears and tails poking out`],
  // 다 같이 집으로! (gohome.js) · 발자국 따라 찾기 (tracks.js)
  [/^\/ (\d+) 집에 감$/, a => `/ ${a} home`],
  [/^꽝! -(\d+)초$/, a => `Bonk! -${a}s`],
  [/^(.+) \((\d+)\/(\d+)\)$/, (a, b, c) => `${tr(a)} (${b}/${c})`],   // a round of a two-round set: "놀이터 (1/2)"
  [/^(\d+)\/(\d+)명 집에 감 · 꽝 (\d+)번$/, (a, b, c) => `${a}/${b} home · ${c} bonk${c === '1' ? '' : 's'}`],
  [/^(.+?) 어디 숨었지\?$/, a => `Where's ${tr(a)} hiding?`],
  [/^\+(\d+) 연속!$/, a => `+${a} streak!`],
  [/^(\d+)점부터 성공! 카드의 발자국 모양을 봐$/, a => `Clear at ${a} pts! Match the print on the card`],
  // 놀이 모음 (gallery.js): slot note for a game taken out of the campaign (the '…판 뒤' notes already have a pattern in i18n.js)
  [/^안 쓰임 \(([\d/]+) 뺌\)$/, a => `not in the story (cut ${a})`],
  [/^(.+?) 쏙!$/, n => `${n} — slipped in!`],
  [/^((?:(?! · ).)+?) \+(\d+)$/, (a, n) => `${a} +${n}`],   // (not across ' · ': pieces are translated one by one below)
  [/^(.+?)의 (.+)$/, (a, b) => `${a}'s ${b.replace(/^(the|a|an) /i, '')}`],   // broad ones last (no article after a possessive: "Grumpy's Room You'll Never Solve", not "Grumpy's The Room…" — 이웃 방 이름 10/20)
];

// QA 10/18: words that showed in Korean on English screens
Object.assign(EN, {
  '★ 명탐정 (헛짚기 0)': '★ Master detective (0 wrong picks)', '방탈출': 'Escape room', '돌림판': 'Turn dial', '터치 전환': 'Tap to switch',
  '토끼 귀 흉내 내는 너굴이!': 'Rocky in fake bunny ears!', '삐죽 나온 줄무늬 꼬리를 봐': 'Look for the striped tail poking out',
  '고양이 친구들이 왔다!': 'The cat friends are here!', '꼬리 색이랑 생선을 잘 봐': 'Watch the tail colors and the fish',
  '길쭉한 귀 모양': 'long ears', '까만 발이랑 동그란 귀': 'black paws and round ears', '조그만 이불': 'a tiny lump', '말린 꼬리': 'a curly tail',
  '동그란 눈 두 개': 'two round eyes', '삐죽 나온 보드': 'a board poking out', '쿨쿨 Zzz': 'snoring Zzz', '학사모랑 책': 'a grad cap and a book',
  '커다란 꼬리': 'a big bushy tail', '삐죽삐죽 가시': 'spiky quills', '헤드폰이랑 음표': 'headphones and music notes', '동그란 귀, 꼬리는 없음': 'round ears, no tail',
  '주황 꼬리랑 생선': 'an orange tail and a fish', '까만 꼬리': 'a black tail', '하얀 꼬리': 'a white tail', '주황 꼬리, 생선은 없음': 'an orange tail, no fish',
  '줄무늬 꼬리': 'a striped tail', '반짝반짝': 'sparkles',
});

// a feature's own words (털기 메타 10/20, i18n-raid.js): its dictionary entries (the main dictionary wins) and its sentence
// patterns, tried before the others
export function addI18n(dict = {}, pats = []) { for (const k in dict) if (EN[k] == null) EN[k] = dict[k]; PAT.unshift(...pats); }
export function tr(s) {
  if (LANG !== 'en' || s == null) return s;
  s = String(s);
  if (!HAN.test(s)) return s;
  if (EN[s] != null) return EN[s];
  const t = s.trim(), i = s.indexOf(t), lead = s.slice(0, i), tail = s.slice(i + t.length);
  if (EN[t] != null) return lead + EN[t] + tail;
  // 'name!' (every find, QA 10/18: '도넛!' stayed Korean): the word, then its punctuation
  const pm = t.match(/^([\s\S]*?[가-힣)])([!?~…]+)$/); if (pm && EN[pm[1]] != null) return lead + EN[pm[1]] + pm[2] + tail;
  // a quoted line: translate what is inside the quotes (“흥, …?” was only in the dictionary without them)
  const q = t.match(/^([“"‘'「])([\s\S]+)([”"’'」])$/); if (q) return lead + q[1] + tr(q[2]) + q[3] + tail;
  // (a capture that is the whole text isn't translated again: '이', '다'… matched the chant pattern and looped forever — QA 10/18)
  for (const [re, f] of PAT) { const m = t.match(re); if (m) return lead + f(...m.slice(1).map(x => (x == null ? '' : HAN.test(x) && x !== t ? P(x) : x))) + tail; }
  // pieces joined with " · " (a visit card's details, the time and hints after a clear): each piece on its own
  if (t.includes(' · ')) return lead + t.split(' · ').map(x => tr(x)).join(' · ') + tail;
  return lead + phrases(t) + tail;
}
// longest run of known words first; a trailing Korean particle is dropped from a word that is otherwise known
const PARTICLE = /(이|가|을|를|은|는|의|에|도|로|으로|와|과|랑|이랑|한테|에서|네)$/;
function phrases(t) {
  const w = t.split(' '), out = [];
  for (let i = 0; i < w.length;) {
    let done = false;
    for (let j = w.length; j > i; j--) {
      const ph = w.slice(i, j).join(' ');
      // (one Korean letter on its own is not a word to swap inside a sentence: 수 → Wed, 무 → Radish, 톡 → Pat — QA N9)
      const one = s => s.length < 2 && w.length > 1;
      const hit = one(ph) ? null : EN[ph] ?? (PARTICLE.test(ph) && !one(ph.replace(PARTICLE, '')) ? EN[ph.replace(PARTICLE, '')] : null);
      if (hit != null) { out.push(hit); i = j; done = true; break; }
    }
    if (!done) { if (HAN.test(w[i])) miss.add(w[i]); out.push(w[i]); i++; }
  }
  return out.join(' ');
}
export const i18nMisses = () => [...miss];

// watch the page: every Korean text that shows up is swapped for its English
export function installI18n() {
  if (LANG !== 'en') return;
  document.documentElement.lang = 'en';
  const fix = n => {
    if (n.nodeType === 3) { const v = n.nodeValue; if (HAN.test(v)) { const r = tr(v); if (r !== v) n.nodeValue = r; } return; }
    if (n.nodeType !== 1) return;
    for (const a of ['aria-label', 'title', 'placeholder']) { const v = n.getAttribute(a); if (v && HAN.test(v)) n.setAttribute(a, tr(v)); }
    for (const c of n.childNodes) fix(c);
  };
  fix(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') fix(m.target); else for (const a of m.addedNodes) fix(a); } })
    .observe(document.body, { subtree: true, childList: true, characterData: true });
}
