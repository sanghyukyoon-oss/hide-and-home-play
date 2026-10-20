// 털기 메타의 영어 (10/20 — Discovery 26-4 needs English + Korean; the raid's own words were left Korean on the English screen).
// 타이머 털기 · 정찰 · 다시 보기 · 문단속 · 털린 흔적 · 자물쇠: exact lines here, sentences with names and numbers as patterns.
// (A name capture never takes in ' · ', so a line made of pieces is still split and translated piece by piece.)
import { addI18n } from './i18n.js';

const S = 's';
addI18n({
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
  '콕 하면 닫혀': 'tap to shut', '더 꽁꽁 숨기기': 'Hide better', '복수하러 가기': 'Get revenge',
  // 문단속 · 자물쇠
  '털린 뒤라 문을 꽁꽁 잠갔어': 'Robbed, so the door is locked', '자물쇠가 다 쓰였어': 'Out of padlocks',
  '잠근 서랍 속 물건은 동네 주민이 거의 못 털어 가': 'Things in a locked drawer are hardly ever taken', '다른 데 걸린 걸 풀어서 옮겨 봐': 'Take one off and move it',
  '자물쇠': 'Padlock', '서랍을 잠가 지켜': 'lock a drawer to guard it',
}, [
  // the raid news (raid.js newsLine): revenge first, so the plain one doesn't take "복수하러 와서 …" for a name
  [/^([^·]+?)[이가] 복수하러 와서 ([^·]+?)[을를] 털어 갔어!(?: \(못 찾은 물건 덕에 \+(\d+)\))?$/, (n, it, c) => `${n} came for revenge and took ${it}!` + (c ? ` (+${c} for what they missed)` : '')],
  [/^([^·]+?)[이가] ([^·]+?)[을를] 털어 갔어!(?: \(못 찾은 물건 덕에 \+(\d+)\))?$/, (n, it, c) => `${n} took ${it}!` + (c ? ` (+${c} for what they missed)` : '')],
  // 타이머 털기
  [/^([^·]+?)[이가] (\d+) 셀 동안 털어라!$/, (n, t) => `Raid it before ${n} counts to ${t}!`],
  [/^(\d+)개 털었어$/, n => `Took ${n}`],
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
]);
