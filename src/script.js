// 숨바꼭집 대본 (2026-10-18; _handoff/script-ko-en-20261018.md — Claude 안 + GPT 안을 합친 것). Every line the friends say,
// Korean and English side by side (K registers the English in the dictionary, so a Korean edit can't drift from it).
// Lines are tied to a map + the kind of stage + how many times you've met that friend — never to a stage number — so a
// new level plan keeps the story in order (user, 10/18: "레벨디자인도 다시할꺼라서 변경될수도 있어").
// Spine: "다음엔 우리 집에서 놀자". Each friend has one hiding habit, one tell, one promise that comes back later; a gift is
// the friend's seat at your place; 먹물이 is the kid nobody ever said "next time" to.
import * as THREE from 'three';
import { EN } from './i18n-en-dict.js';
import { stageSpec, THEMES, layoutFor, STAGE_COUNT, REGIONS, REGION_INTRO } from './stages.js';
import { STORIES, setStoryBinder } from './story.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { sph, put } from './gfx/kit.js';
import { h } from './ui.js';
import { tr } from './i18n.js';
import { rng } from './util.js';

const K = (ko, en) => { if (en) EN[ko] = en; return ko; };
const L = (who, ko, en) => ({ who, text: K(ko, en) });

// ── each friend: the bubble as they hide, intros (first meeting, then the ones after it in turn), what they say when
// found, and the bubbles from the hideout — on a clue found, on the lock being touched, when you're stuck (their tell)
const FR = {
  bunny: { hide: K('이번엔 안 웃을 거야!', "Not giggling this time!"),
    intro: [[L('bunny', '몽글아! 숨바꼭질 하자!', 'Mongle! Hide-and-seek time!')],
      [L('bunny', '오늘은 진짜 안 웃을게. 진짜로.', "I really won't giggle today. Really."), L('mong', '…꼬리는?', '…And the tail?')],
      [L('bunny', '웃음 참는 연습 했어. 한 시간이나!', 'I practiced not giggling. For a whole hour!'), L('mong', '…웃으면서?', '…While giggling?')]],
    found: [L('bunny', '푸핫! 또 웃었다!', 'Pfft! Giggled again!'), L('bunny', '다음엔 진짜야. 진짜 진짜.', 'Next time for real. Really really.')],
    clue: [K('흡…!', 'Mmph…!'), K('(킥) 아, 아니야!', '(hee) N-no!')], lock: [K('(콧바람이 새는 소리)', '(a snort escapes)')],
    stuck: [K('(꼬리가 삐죽 나왔다 쏙)', '(a tail pops out, then ducks back)'), K('킥…', 'Hee…')] },
  bear: { hide: K('으헤헤, 숨는다~', 'Ehehe, hiding!'),
    intro: [[L('bear', '으헤헤, 왔구나. 오늘은 내가 숨을게.', "Ehehe, you came. I'll hide today.")],
      [L('bear', '이번엔 안 잘 거야. 아마도.', "I won't fall asleep this time. Probably."), L('mong', '…베개는 왜 들고 있어?', '…Then why the pillow?')],
      [L('bear', '꿀 챙겼어. 찾으면 같이 먹자.', "I packed honey. Find me and we'll share.")]],
    found: [L('bear', '으헤헤, 들켰다. 기다리다 졸았어.', 'Ehehe, busted. Dozed off waiting.'), L('bear', '꿀 반 숟갈 남겼어. 네 거야.', 'I saved you half a spoon of honey.')],
    clue: [K('헉… 그거 찾았어?', 'Huh… you found that?')], lock: [K('(꿀꺽)', '(gulp)')], stuck: [K('드르… 쿨…', 'Zzz… snrk…')] },
  frog: { hide: K('이번엔 안 들킨다!', 'Not getting caught this time!'),
    intro: [[L('frog', '개굴! 숨바꼭질 챔피언 납신다!', 'Ribbit! The champion has arrived!')],
      [L('frog', '복수전이다, 개굴! 거품 연습 했어.', 'Rematch, ribbit! I practiced my bubbles.'), L('mong', '…안 내는 연습?', "…Practiced not making them?"), L('frog', '…아.', '…Oh.')]],
    found: [L('frog', '개굴?! 거품이 또 배신했어!', 'Ribbit?! The bubbles betrayed me again!'), L('frog', '한 판 더! 다음엔 진짜야!', 'One more! For real next time!')],
    clue: [K('개, 개굴?!', 'R-ribbit?!')], lock: [K('(뽀글)', '(blub)')], stuck: [K('개굴~ 개굴~ (콧노래)', 'Ribbit~ ribbit~ (humming)')] },
  peng: { hide: K('1등 비결 보여 줄게!', 'Watch a pro!'),
    intro: [[L('peng', '펭! 오늘은 1등 할 거야!', "Peng! Today I'm number one!")],
      [L('peng', '새 비결 생겼어. 오늘은 진짜 1등!', 'Got a new pro tip. Number one for real today!'), L('mong', '…몇 번?', '…Which number?'), L('peng', '비밀이야!', 'Secret!')]],
    found: [L('peng', '펭… 또 들켰어?', 'Peng… caught again?'), L('peng', '비결이 하나 더 늘었네…', "Guess that's another tip…")],
    clue: [K('아, 아냐! 그거 아니야!', 'N-no! Not that!')], lock: [K('(덜덜덜)', '(shiver shiver)')], stuck: [K('펭… 여기 좀 춥다…', "Peng… it's cold in here…")] },
  cat: { hide: K('찾을 테면 찾아보라냥.', 'Find me if you can.'),
    intro: [[L('cat', '흥. 놀아 주러 온 거 아니다냥.', "Hmph. I'm not here to play with you."), L('mong', '…꼬리는 신났는데.', '…Your tail looks excited.')],
      [L('cat', '캣타워, 잘 있냐냥?', 'How is my cat tower doing?'), L('mong', '꼭대기 비워 뒀어.', 'Kept the top free.')]],
    found: [L('cat', '흥. 꼬리는 안 숨겼거든.', 'Hmph. I let my tail show. On purpose.'), L('cat', '…다음 판도 해 준다냥.', "…I'll play another round.")],
    clue: [K('흥, 우연이다냥.', 'Hmph. Lucky.')], lock: [K('(꼬리가 쏙 나옴)', '(a tail slips out)')], stuck: [K('(꼬리를 살랑)', '(tail swish)')] },
  shiba: { hide: K('쉿! 꼬리도 쉿!', 'Shh! You too, tail!'),
    intro: [[L('shiba', '킁킁! 오늘은 내가 숨는다. 조용히!', "Sniff sniff! I'm hiding today. Quietly!")],
      [L('shiba', '이번엔 꼬리랑 약속했어. 가만히 있기로.', 'My tail and I made a deal. It stays still.'), L('mong', '…꼬리가 대답했어?', '…Did your tail agree?')]],
    found: [L('shiba', '나는 조용했어. 꼬리는 아니었지만.', "I was quiet. My tail wasn't."), L('shiba', '다음 순찰도 같이 가자!', 'Come on patrol again!')],
    clue: [K('킁…!', 'Sniff…!')], lock: [K('(붕붕붕)', '(wag wag wag)')], stuck: [K('(꼬리가 삐죽 나와서 붕붕)', '(a tail pokes out, wag wag)')] },
  grumpy: { hide: K('숨었어. …천천히 와도 되고.', 'Hidden. …No rush, I guess.'),
    intro: [[L('grumpy', '뭐야. 놀러 왔어? …한 판만이야.', 'What? Here to play? …One game.')],
      [L('grumpy', '오늘도 한 판만. …시간은 많지만.', "One game again. …I've got time, though.")]],
    found: [L('grumpy', '흥. …운 좋았네.', 'Hmph. …Lucky.'), L('grumpy', '한 판 더 해도 되고.', 'Could do one more.')],
    clue: [K('…운 좋네.', '…Lucky.')], lock: [K('거기 아니라고. …거기 맞아.', 'Not there. …Fine. There.')], stuck: [K('(혀 차는 소리)', '(tsk)')] },
  squirrel: { hide: K('다 숨겼어! 나까지!', 'Hid everything! Me too!'),
    intro: [[L('squirrel', '도토리 숨기기 대장 다람이야!', "I'm Chippy, acorn-hiding champ!")],
      [L('squirrel', '이번엔 어디 숨겼는지 메모해 뒀어.', 'This time I wrote down where I hid everything.'), L('mong', '…메모는 어디 있어?', "…And where's the note?"), L('squirrel', '…숨겼어.', '…I hid it.')]],
    found: [L('squirrel', '헉! 도토리 냄새로 찾았지?', 'Whoa! You smelled the acorns, right?'), L('squirrel', '너무 잘 숨겨서 나도 까먹을 뻔!', 'I hid so well I almost forgot!')],
    clue: [K('헉, 내 도토리…!', 'Hey, my acorn…!')], lock: [K('(오도독)', '(crunch)')], stuck: [K('(도토리 굴러가는 소리)', '(an acorn rolls)')] },
  hamster: { hide: K('웁웁! 숨는다!', 'Mmf! Hiding!'),
    intro: [[L('hamster', '웁웁! 볼에 씨앗 넣고 숨을 거야!', "Mmf! I'm hiding with my cheeks full!")],
      [L('hamster', '이번엔 볼 비우고 숨는다!', 'Empty cheeks this time!'), L('mong', '…진짜?', '…Really?'), L('hamster', '…반만.', '…Half.')]],
    found: [L('hamster', '웁…! 볼이 빵빵해서 들켰나 봐!', 'Mmf…! My cheeks gave me away!'), L('hamster', '씨앗 하나 줄게. 아껴 먹어!', 'Here, have a seed. Make it last!')],
    clue: [K('웁?!', 'Mmf?!')], lock: [K('(오물오물)', '(nibble nibble)')], stuck: [K('(쳇바퀴 도는 소리)', '(a wheel squeaks)')] },
  sundae: { hide: K('녹기 전에 찾아 줘~!', 'Find me before I melt!'),
    intro: [[L('sundae', '어서 와! 오늘은 내가 숨을게. 토핑 골라 놓고!', "Welcome! I'm hiding today. Toppings picked!")],
      [L('sundae', '이번엔 시원한 데 숨을 거야. 안 녹게!', 'Somewhere cool this time. No melting!')]],
    found: [L('sundae', '휴~ 다 녹을 뻔했어!', 'Phew! I almost melted!'), L('sundae', '체리는 너 가져. 찾아 준 상!', "The cherry's yours. Finder's prize!")],
    clue: [K('앗, 그거…!', "Oh, that's…!")], lock: [K('(뚝… 뚝…)', '(drip… drip…)')], stuck: [K('(달콤한 냄새)', '(a sweet smell)')] },
  skater: { hide: K('보드 타고 휙!', 'Kickflip and gone!'),
    intro: [[L('skater', '요! 오늘 최고 기록 세운다!', 'Yo! New record today!')],
      [L('skater', '이번엔 보드 내려놓고 숨는다.', "This time I'm hiding without the board."), L('mong', '…할 수 있어?', '…Can you?'), L('skater', '…아마도.', '…Maybe.')]],
    found: [L('skater', '와우! 킥플립보다 빠르다!', 'Whoa! Faster than a kickflip!'), L('skater', '다음엔 보드 태워 줄게!', "Next time, I'll let you ride!")],
    clue: [K('어? 어?', 'Huh? Huh?')], lock: [K('(드르륵, 바퀴 소리)', '(a wheel rattles)')], stuck: [K('(보드 끝이 삐죽)', '(a board tip sticks out)')] },
  panda: { hide: K('기다리는 건 자신 있어.', "I'm great at waiting."),
    intro: [[L('panda', '판다는 숨는 데 고수야. 천천히 찾아.', 'Pandas are pro hiders. Take your time.')],
      [L('panda', '오늘도 기다려 줄게. 천천히 와.', "I'll wait again today. No rush.")]],
    found: [L('panda', '고수를 찾다니. 인정!', 'You found a pro. Respect!'), L('panda', '대나무 하나 나눠 줄게. 아삭!', 'Have some bamboo. Crunch!')],
    clue: [K('오…', 'Ooh…')], lock: [K('(아삭아삭)', '(crunch crunch)')], stuck: [K('(대나무 씹는 소리)', '(bamboo munching)')] },
  sleepy: { hide: K('찾으면… 깨워 줘…', 'Wake me… when you find me…'),
    intro: [[L('sleepy', '숨바꼭질… 좋아… 숨어서 잘게…', "Hide-and-seek… nice… I'll nap while I hide…")],
      [L('sleepy', '이번엔… 안 자고… 쿨…', "This time… I won't… zzz…")]],
    found: [L('sleepy', '음냐… 벌써 아침이야?', 'Mmh… is it morning already?'), L('sleepy', '끝나면 깨워 줘. 같이 돌아가게.', "Wake me when we're done. We'll walk home together."), L('mong', '…응. 약속.', '…Okay. Promise.')],
    clue: [K('음냐…?', 'Mmh…?')], lock: [K('(쌕쌕)', '(soft breathing)')], stuck: [K('드르렁~', 'Snore…')] },
  robot: { hide: K('은신 모드 가동. 삐빅.', 'Stealth mode on. BEEP.'),
    intro: [[L('robot', '삐빅. 숨바꼭질 프로그램 실행.', 'BEEP. Running hide-and-seek program.')],
      [L('robot', '삐빅. 지난 기록 분석 완료. 이번엔 안 들킴.', 'BEEP. Past records analyzed. Will not be found.'), L('mong', '…지난번에도 그랬어.', '…You said that last time.')]],
    found: [L('robot', '발견됨. 축하 프로토콜 실행. 삐빅삐빅!', 'Found. Running celebration protocol. BEEP BEEP!'), L('robot', '동행 기록 저장. 삭제하지 않음.', 'Memory saved. Will not delete.')],
    clue: [K('삐빅?', 'BEEP?')], lock: [K('(위잉…)', '(whirr…)')], stuck: [K('(삐빅, 불빛이 깜빡)', '(beep, a light blinks)')] },
  nerd: { hide: K('논리적으로 숨었으니 논리적으로 찾아.', 'I hid logically. Find me logically.'),
    intro: [[L('nerd', '흠. 오늘은 내가 문제를 내지.', 'Hm. Today, I set the puzzle.')],
      [L('nerd', '흠. 너만을 위한 새 퍼즐이야.', 'Hm. A new puzzle, just for you.')]],
    found: [L('nerd', '놀랍군. 계산보다 빨라.', 'Remarkable. Faster than I calculated.'), L('nerd', '다음 문제는 더 어렵게 만들지.', "I'll make the next one harder.")],
    clue: [K('오, 오오?', 'Oh— oh?')], lock: [K('흠흠.', 'Ahem.')], stuck: [K('흠흠. 힌트는… 아니, 안 줘.', 'Ahem. A hint… no. No hints.')] },
  dj: { hide: K('비트 따라와! 둠칫!', 'Follow the beat! Boom-tss!'),
    intro: [[L('dj', '둠칫! 새 곡 녹음 중이야. 찾으면 첫 곡 들려줄게!', 'Boom-tss! Recording a new track. Find me and you hear it first!')],
      [L('dj', '이번엔 볼륨 줄이고 숨는다!', 'Volume down this time!'), L('mong', '…아직 커.', '…Still loud.')]],
    found: [L('dj', '둠칫! 네가 오늘의 MVP!', "Boom-tss! You're today's MVP!"), L('dj', '이 곡 제목은 「찾았다」로 할게!', 'I\'m calling this track "Found You"!')],
    clue: [K('둠…칫?', 'Boom…tss?')], lock: [K('(쿵짝쿵짝)', '(thump thump)')], stuck: [K('(어디선가 베이스 소리)', '(a bassline from somewhere)')] },
  inky: { hide: K('…안 나갈 거야.', "…I'm not coming out."), intro: [[]], found: [],
    clue: [K('…!', '…!')], lock: [K('…', '…')], stuck: [K('(작은 콧노래)', '(a tiny hum)')] },
};
const ANY = { hide: K('숨는다~!', 'Hiding~!'), intro: [[L('?', '숨바꼭질 하자! 내가 숨을게~', "Let's play hide-and-seek! I'll hide!")]],
  found: [L('?', '들켰다~! 어떻게 찾았어?!', 'Busted! How did you find me?!'), L('?', '다음에도 같이 놀자!', "Let's play again next time!")],
  clue: [K('헉, 그걸 찾았어?!', 'Whoa, you found that?!')], lock: [K('어, 어? 거기 열면 안 돼~', "W-wait, don't open that!")], stuck: [K('킥킥…', 'Hee hee…')] };
// The friends who host many stages (70판 대본 점검 10/18: 멍뭉이 8번, 판다 6번…) get more meetings, each intro paired with
// its own reveal (the same index), so a joke set up when they hide is the one paid off when they're found. Index 0 is the
// first meeting; after that they go round in order.
const MORE = {
  shiba: { intro: [
      [L('shiba', '순찰 중엔 잠복이 기본이지. 나 찾아 봐!', 'A good cop knows how to lie low. Come find me!')],
      [L('shiba', '오늘은 꼬리에 리본 묶었어. 무거워서 안 흔들릴걸?', "I tied a ribbon on my tail. Too heavy to wag, I bet."), L('mong', '…리본이 더 눈에 띄어.', "…The ribbon's even easier to spot.")],
      [L('shiba', '킁… 너한테서 간식 냄새 나. 못 찾으면 그거 내 거!', "Sniff… you smell like snacks. Can't find me? They're mine!")],
      [L('shiba', '이번엔 진짜 진짜 조용히. …멍.', 'Really, really quiet this time. …Woof.')],
      [L('shiba', '마지막 순찰 코스야. 여기서 숨바꼭질 한 판!', 'Last stop on the patrol route. One round here!')]],
    reveals: [null, [L('shiba', '멍! 꼬리야, 약속했잖아…', 'Woof! Tail, we had a deal…'), L('shiba', '…그래도 3초는 참았어.', '…I held still for three seconds, though.')],
      [L('shiba', '킁, 잠복 실패.', 'Sniff. So much for lying low.'), L('shiba', '너 탐정 해도 되겠다. 순찰 파트너로 임명!', "You could be a detective. You're my patrol partner now!")],
      [L('shiba', '리본이 문제였어…', 'The ribbon was the problem…'), L('shiba', '내일은 꼬리를 주머니에 넣어 올게.', 'Tomorrow my tail goes in my pocket.')],
      [L('shiba', '멍! 졌다. 간식은 네 거야.', 'Woof! You win. The snacks are yours.'), L('shiba', '…냄새만 맡을게.', "…I'll just smell them.")],
      [L('shiba', '방금 멍 해서 들킨 거지?', 'I gave myself away with that woof, didn\'t I?'), L('shiba', '순찰 일지에 적어 둬야지. 「오늘도 들킴」.', 'Into the patrol log it goes: "Caught again."')],
      [L('shiba', '멍멍! 순찰 끝!', 'Woof woof! Patrol complete!'), L('shiba', '오늘도 같이 돌아 줘서 고마워.', 'Thanks for walking the route with me again.')]] },
  panda: { intro: [
      [L('panda', '흑백 무늬라 그늘에선 안 보일걸.', 'With black-and-white fur, I vanish in the shade.')],
      [L('panda', '산에선 소리가 멀리 가. 귀를 잘 기울여.', 'Sounds carry far on a mountain. Listen closely.')],
      [L('panda', '상자 찾기 전에 몸풀기 한 판!', 'A warm-up round before we look for the box!')],
      [L('panda', '오두막은 숨을 데가 많아. 구석구석 봐.', "The cabin's full of hiding spots. Check every corner.")]],
    reveals: [null, [L('panda', '오, 왔구나. 딱 좋은 속도야.', "Oh, you're here. Just the right speed."), L('panda', '기다리는 것도 숨바꼭질이야.', 'Waiting is part of hide-and-seek, too.')],
      [L('panda', '그늘에서도 찾네. 눈이 좋구나.', 'You found me even in the shade. Good eyes.'), L('panda', '…어릴 때 그 애도 그늘을 좋아했는데.', '…That kid back then liked the shade, too.')],
      [L('panda', '아삭 소리 때문이지? 대나무는 못 참겠어.', "It was the crunching, right? I can't resist bamboo."), L('panda', '다음엔 씹지 않고 기다릴게.', "Next time I'll wait without chewing.")],
      [L('panda', '좋아. 그 눈이면 상자도 찾겠다.', 'Good. Eyes like that will find the box.'), L('panda', '거기 묻은 거, 너한테 꼭 보여 주고 싶어.', 'I really want to show you what we buried there.')],
      [L('panda', '들켰네. 역시 너야.', "Caught. Knew it'd be you."), L('panda', '…누가 찾으러 와 주는 거, 좋다.', "…It's nice when someone comes looking.")]] },
  frog: { intro: [
      [L('frog', '개굴! 밤엔 개구리 세상이야. 못 찾을걸!', "Ribbit! Night belongs to frogs. You won't find me!")],
      [L('frog', '큰 공원이다! 연못이 있으니까 내가 유리해!', "Big park! There's a pond, so I've got the edge!")]],
    reveals: [null, [L('frog', '거품 연습은… 실패야.', 'Bubble practice… failed.'), L('frog', '한 판 더! 다음엔 진짜야!', 'One more! For real next time!')],
      [L('frog', '개굴?! 밤에도 보여?', 'Ribbit?! You can see me at night?'), L('frog', '…야광 개구리였나 봐, 나.', "…Guess I'm a glow-in-the-dark frog.")],
      [L('frog', '연못만 쳐다보다가 들켰어…', 'I got caught staring at the pond…'), L('frog', '그래도 이번 판은 재밌었다, 개굴!', 'Still, that was a fun round. Ribbit!')]] },
  bear: { reveals: [null, [L('bear', '으헤헤… 또 졸았어.', 'Ehehe… dozed off again.'), L('bear', '…베개가 너무 푹신했어.', '…The pillow was too soft.')],
      [L('bear', '으헤헤, 꿀 냄새 때문이지?', 'Ehehe, it was the honey smell, right?'), L('bear', '반 숟갈씩 나눠 먹자.', 'Half a spoon each.')]] },
  nerd: { intro: [[L('nerd', '흠. 정전도 변수일 뿐이지.', 'Hm. A blackout is just another variable.')]],
    reveals: [null, [L('nerd', '놀랍군. 1층은 벌써 풀었어.', "Remarkable. The first floor's already solved."), L('nerd', '위층에서 기다리지.', "I'll be waiting upstairs.")],
      [L('nerd', '어둠 속에서도 찾다니. 계산 밖이야.', 'Even in the dark. Outside my calculations.'), L('nerd', '…솔직히 이런 친구, 처음이야.', "…Honestly, I've never had a friend like you.")]] },
  dj: { reveals: [null, [L('dj', '볼륨은 줄였는데 심장 소리가 커서…', 'I turned the volume down, but my heartbeat was so loud…'), L('dj', '다음 곡 제목은 「또 찾았다」!', 'Next track: "Found You Again"!')]] },
  sundae: { reveals: [null, [L('sundae', '시원한 데도 금방 찾네!', 'You found me even somewhere cool!'), L('sundae', '다음엔 냉동고에 숨을까… 아니, 그건 너무 추워.', 'Maybe the freezer next time… no, too cold.')]] },
};
for (const [k, m] of Object.entries(MORE)) { if (m.intro) FR[k].intro.push(...m.intro); if (m.reveals) FR[k].reveals = m.reveals; }
const fr = k => FR[k] || ANY;
const as = (lines, who) => lines.map(l => (l.who === '?' ? { ...l, who } : l));
// which of a friend's meetings this is → which intro (and its paired reveal): the first once, then the rest in turn
const turn = (n, len) => (n === 0 || len < 2 ? 0 : 1 + ((n - 1) % (len - 1)));
K('숨는다~!', 'Hiding~!');
export const BONUS_SAY = [K('그것도 찾았어? 눈 좋다!', 'You found that too? Sharp eyes!'), K('앗, 그거 내 보물인데!', "Hey, that's my treasure!")];

// ── scenes: the first stage (in campaign order) whose map and kind match gets it, once. type: tut1 · tut2 · incident ·
// gray · timed. host: who hides there (when the map's own owner isn't the one in the story).
const SCENES = [
  { id: 'first', type: 'tut1', room: 'bunny', hide: K('폭신한 데가 좋지만… 오늘은 상자다~!', 'Fluffy spots are the best… but today, the box!'),
    intro: [L('bunny', '몽글아! 왔구나!', 'Mongle! You came!'), L('bunny', '나 찾아봐. 이번엔 안 웃을 거야.', "Come find me. I won't giggle this time.")],
    clue: K('앗, 내 간식!', 'Hey, my snack!'), peek: K('킥… 아, 아니야. 안 웃었어.', "Hee— n-no. I didn't giggle."), mongClue: K('…저쪽.', '…Over there.'),
    reveal: [L('bunny', '네가 오니까 자꾸 웃음이 났어.', "I heard you coming. I couldn't stop giggling."), L('bunny', '다음엔 진짜 안 웃을 거야.', "Next time, I really won't giggle."), L('mong', '…꼬리도 숨겨.', '…Hide your tail too.')] },
  { id: 'drawers', type: 'tut2', room: 'bunny',
    intro: [L('bunny', '이번엔 내가 아니라 내 물건들이야.', 'Not me this time. My things.'), L('bunny', '서랍까지 꼭 닫았지.', 'I even shut the drawers.'), L('mong', '…안 웃는 연습은?', '…What about not giggling?'), L('bunny', '그, 그건 다음에!', "Th-that's for next time!")],
    finds: [K('내 머리핀!', 'My hairpin!'), K('내 최애 스티커…!', 'My favorite sticker…!'), K('그건 아끼는 건데!', 'I love that one!'), K('마지막 건 절대 못 찾아!', "You'll never find the last one!")],
    drawerFull: K('앗, 거긴…!', 'Hey, not in th—!'), drawerEmpty: K('거긴 양말 서랍인데…', "That's my sock drawer…"),
    after: [L('bunny', '다 찾았어?! 서랍까지 닫았는데!', 'All of them?! I shut the drawers!'), L('bunny', '이번엔 네가 숨겨 봐. 내가 찾을게!', "Your turn to hide something. I'll find it!")], homeChoice: true },
  { id: 'museum', type: 'gray', room: 'museum', teachMove: true,
    intro: [L('bear', '으헤헤, 새 그림 걸었는데…', 'Ehehe, I just hung a new painting…'), L('bear', '…내가 좋아하는 색이 없어졌어.', '…and my favorite color is gone.'), L('bunny', '방금 까만 거 봤어! 저쪽으로 휙!', 'I just saw something inky! It went that way!'), L('mong', '봤어. 작았어.', 'I saw. It was small.'), L('mong', '색을 가져가서 숨긴 거야. 찾으면 돌아와.', 'It took the colors and hid them. Find them, and they come back.')],
    firstColor: K('응, 이 색이야.', 'Yes. That one.'),
    caught: K('…날 찾았어?', '…You found me?'),
    after: [L('bear', '으헤헤… 색은 다 돌아왔네. 고마워, 몽글아.', 'Ehehe… the colors are all back. Thanks, Mongle.'), L('mong', '…발자국. 급하게 뛰었어.', '…Footprints. It ran in a hurry.'), L('bunny', '…쟤, 우리랑 놀고 싶은 거 아냐?', '…Maybe that kid just wants to play with us?')] },
  { id: 'bear', type: 'incident', room: 'bear',
    intro: [L('bear', '미술관 고마웠어. 오늘은 우리 집!', 'Thanks for the museum. Today, my place!'), L('bear', '이번엔 잠가 뒀지. 으헤헤.', 'And this time I locked myself in. Ehehe.')],
    reveal: [L('bear', '으헤헤, 들켰다. 기다리다 졸았어.', 'Ehehe, busted. I dozed off waiting.'), L('bear', '꿀 먹을래? 숟가락 두 개 챙겼어.', 'Want some honey? I brought two spoons.'), L('mong', '…하나는 쓴 거 같은데.', '…One of them looks used.'), L('bear', '으헤헤.', 'Ehehe.')] },
  { id: 'fishing', type: 'incident', room: 'fishing',
    intro: [L('frog', '개굴! 낚시터에선 내가 챔피언이야.', "Ribbit! At the fishing spot, I'm the champ."), L('frog', '이번엔 물소리도 내 편이야.', "The water's on my side this time.")],
    stuck: [K('(뽀글)', '(blub)')],
    reveal: [L('frog', '거품이 배신했어!', 'The bubbles betrayed me!'), L('frog', '한 판 더! 이번엔 안 들킨다!', "One more! I won't get caught this time!"), L('mong', '수풀에서도 그랬어.', 'You said that in the bushes.')] },
  { id: 'study', type: 'incident', room: 'study', card: 'chain', hide: K('흠. 책 냄새 나는 곳이 제일 편하지.', 'Hm. Anywhere that smells like books is the comfiest.'),
    intro: [L('nerd', '흠. 토순이를 한 번에 찾았다는 그 몽글이군.', "Hm. So you're the Mongle who found Bunbun on the first try."), L('nerd', '이 서재엔 내가 만든 비밀 방이 있지.', 'I built a secret room in this study.'), L('nerd', '아직 아무도 끝까지 못 풀었어. 난 거기 있을게.', "No one's ever solved it all the way. I'll be in there.")],
    stuck: [K('흠흠. 무지개가 끊긴 건 봤겠지?', 'Ahem. You noticed the rainbow is broken, yes?')],
    reveal: [L('nerd', '놀랍군. 계산보다 빨라.', 'Remarkable. Faster than I calculated.'), L('nerd', '…사실 누가 풀어 주길 기다렸어.', '…Truth is, I hoped someone would solve it.'), L('nerd', '퍼즐은 혼자 하면 재미없거든.', 'Puzzles are no fun alone.'), L('nerd', '다음 퍼즐은 너만을 위해 만들지.', "I'll make the next one just for you.")] },
  { id: 'peng', type: 'incident', room: 'peng',
    intro: [L('peng', '펭! 네가 박사 퍼즐 푼 애야?', "Peng! You're the one who solved Doc's puzzle?"), L('peng', '나는 동네 숨기 2등. 1등은 너굴이.', "I'm the second-best hider in town. Rocky's first."), L('peng', '오늘 1등 될 거야. 꽁꽁 잠그고 숨거든!', "Today I'm number one. I'm locking myself in tight!")],
    reveal: [L('peng', '펭… 추워서 떤 거 들켰어?', 'Peng… did my shivering give me away?'), L('peng', '1등 비결 1번. 숨을 땐 숨도 참아.', 'Pro tip number one. When you hide, hold your breath.'), L('mong', '넌 떨었잖아.', 'You were shivering.'), L('peng', '…비결 2번. 떨지 않기.', "…Tip number two. Don't shiver."), L('peng', '너굴이는 진짜 못 찾을걸. 걔는 반칙해.', "You'll never find Rocky, though. Rocky cheats.")] },
  { id: 'bunnybath', type: 'incident', room: 'bunnybath', hide: K('폭신폭신한 데… 앗, 말하면 안 되지!', "Somewhere fluffy… oops, I wasn't supposed to say!"),
    intro: [L('bunny', '몽글아! 오늘은 진짜 안 웃을게.', "Mongle! Tonight I really won't giggle."), L('bunny', '연습 많이 했어. 거울 보고.', 'I practiced a lot. In the mirror.'), L('mong', '…거울 보고 웃었지?', '…And giggled at the mirror?'), L('bunny', '아, 안 웃었거든?!', 'I— I did NOT!')],
    reveal: [L('bunny', '푸핫! 반칙이야, 네 발소리 웃겨!', 'Pfft! No fair, your footsteps are funny!'), L('mong', '내 발소리가 뭐.', "What's wrong with my footsteps?"), L('bunny', '몰라! 그냥 웃겨!', "I don't know! They just are!")] },
  { id: 'bear2', type: 'incident', room: 'bear2',
    intro: [L('bear', '으헤헤, 왔구나. 이번엔 접시도 두 개야.', 'Ehehe, you came. Two plates this time.'), L('mong', '숟가락은?', 'And the spoons?'), L('bear', '…깨끗한 걸로 두 개.', '…Two clean ones.')],
    stuck: [K('(지글지글)', '(sizzle sizzle)')],
    reveal: [L('bear', '들켰다… 놀래 주려고 팬케이크 구웠어.', 'Busted… I was making pancakes to surprise you.'), L('bear', '조금 탔어. 탄 건 내 거.', "They're a little burnt. The burnt ones are mine.")] },
  { id: 'house2f', type: 'incident', room: 'house2f', lock: [K('(흡… 숨 참는 소리)', '(mmph… holding a breath)')],
    intro: [L('peng', '펭! 비결 2번 연습했어. 오늘은 안 떨어.', 'Peng! I practiced tip number two. No shivering today.'), L('peng', '그리고 우리 집은 2층! 높을수록 1등이지!', 'And my house has two floors! Higher means number one!')],
    stuck: [K('쿵! …아무 소리 안 났어.', "Thud! …That wasn't me.")],
    reveal: [L('peng', '펭! 안 떨었는데!', "Peng! I didn't shiver!"), L('mong', '쿵 했잖아.', 'You went thud.'), L('peng', '…비결 3번. 쿵 하지 않기.', "…Tip number three. Don't go thud."), L('mong', '…적어 둘게. 비결 3번.', '…Writing that down. Tip three.'), L('peng', '너라면 너굴이도 찾겠다.', 'You could find Rocky, I bet.')] },
  { id: 'house3', type: 'incident', room: 'house3',
    intro: [L('bear', '다락에 옛날 상자가 있어. 같이 볼래?', "There's an old box in the attic. Want to look?"), L('bear', '근데 그 전에… 나 숨는다! 으헤헤.', "But first… I'm hiding! Ehehe.")],
    reveal: [L('bear', '으헤헤, 들켰다. 근데 나도 찾았어. 어릴 때 인형.', 'Ehehe, busted. But I found something too. My old teddy.'), L('bear', '곰인형의 곰인형이야. 으헤헤.', "A teddy bear's teddy bear. Ehehe."), L('bear', '아 참, 냥냥이가 네 얘기 묻더라. 엄청 궁금한 눈치던데?', 'Oh, Nyannyan was asking about you. Seemed really curious.')] },
  // 우리 아파트
  { id: 'apt', type: 'incident', room: 'apt',
    intro: [L('bunny', '집이 넓으니까 이번엔 못 찾을걸? 웃음도 참고!', "The place is huge. You won't find me this time! No giggling, either!"), L('mong', '…꼬리는?', '…And the tail?'), L('bunny', '꼬, 꼬리도 넣을 거야!', 'Th-the tail is going in too!')],
    reveal: [L('bunny', '푸핫! 좁은 데 숨으니까 웃음이 나!', 'Pfft! Tight spots make me giggle!'), L('bunny', '집들이 와 줘서 고마워. 진짜로.', 'Thanks for coming to my housewarming. Really.')] },
  { id: 'police', type: 'gray', room: 'police',
    intro: [L('shiba', '킁킁. 색깔 도둑 신고가 들어왔어. 파출소까지 회색이야!', "Sniff sniff. A color thief struck! Even the police station's gray!"), L('shiba', '나는 조용히 잠복할게. 넌 숨겨진 색을 찾아 줘.', "I'll lie low and keep watch. You find the hidden colors.")],
    caught: K('…파출소에서도 날 찾네.', '…You found me even at the police station.'),
    after: [L('shiba', '킁. 크레파스 냄새만 남았어.', 'Sniff. Nothing left but a crayon smell.'), L('shiba', '근데 저 애, 동네 명부에도 없어.', "And that kid's not even on the town list."), L('shiba', '다음 순찰엔 같이 가자.', 'Come on patrol with me next time.')] },
  { id: 'oneroom', type: 'incident', room: 'oneroom', hide: K('웁…! 무서워서 숨는다!', 'Mmf…! Too scary. Hiding!'), name: K('햄찌네 원룸', "Hammy's Studio"),
    intro: [L('hamster', '웁웁! 불 나갔어! 해바라기씨 먹다가!', 'Mmf! The lights went out! Mid-snack!'), L('mong', '스위치부터 찾자. 금방 찾으러 갈게.', "Let's find the switch. I'll come find you.")],
    reveal: [L('hamster', '…무서워서 씨앗 다 먹었어.', '…I got scared and ate all my seeds.'), L('mong', '볼은 아직 빵빵한데.', 'Your cheeks are still full.'), L('hamster', '…비상식량이야.', '…Emergency rations.')] },
  { id: 'school', type: 'incident', room: 'school', hide: K('교실엔 폭신한 데가 없는데… 어디 숨지?', "Nothing fluffy in a classroom… where do I hide?"),
    intro: [L('bunny', '쉬는 시간 10분! 교실 숨바꼭질은 사물함이 국룰이야.', 'Ten-minute recess! Classroom hide-and-seek? Lockers. Everyone knows.'), L('bunny', '종 치기 전에 찾아야 해. 시계는 없어. 그냥 기분이야.', "Find me before the bell. There's no timer. It's just a vibe.")],
    reveal: [L('bunny', '벌써?! 종도 안 쳤는데!', "Already?! The bell hasn't even rung!"), L('bunny', '쉬는 시간이 한 번 더 있으면 좋겠다.', 'I wish we got a second recess.')] },
  { id: 'firestation', type: 'incident', room: 'firestation', host: 'peng', name: K('동네 119 안전센터', 'The Neighborhood Fire Station'),
    intro: [L('peng', '펭! 오늘은 소방서 체험의 날. 나는 소방관 2등!', "Peng! It's fire station day. I'm the second-best firefighter!"), L('mong', '1등은?', "Who's first?"), L('peng', '…아직 안 정해졌어.', '…Not decided yet.')],
    reveal: [L('peng', '비결 4번. 소방관 모자는 벗고 숨기…', 'Tip number four. Take the helmet off before you hide…'), L('mong', '…몇 번까지 있어?', '…How many tips are there?'), L('peng', '1등 될 때까지!', 'As many as it takes to be number one!')] },
  { id: 'aptmap', type: 'incident', room: 'aptmap', host: 'bear', hide: K('으헤헤, 맛있는 냄새 나는 데로 가야지~', "Ehehe, I'll go wherever smells tasty~"),
    intro: [L('bunny', '곰돌이도 집들이 왔어! 숨바꼭질 하재.', 'Bearie came to the housewarming too! Wants to play hide-and-seek.'), L('bunny', '청소기가 자꾸 이상한 걸 물고 다녀. 조심해!', 'And the robot vacuum keeps carrying weird stuff around. Careful!')],
    reveal: [L('bear', '어… 다 끝났어? 따뜻해서 그만.', 'Huh… is it over? It was just so warm up there.'), L('mong', '…높은 데서도 자네.', '…You even sleep up high.')] },
  // 동네 골목
  { id: 'alley1', type: 'incident', room: 'alley1',
    reveal: [L('grumpy', '…진짜 찾았네.', '…You actually found me.'), L('mong', '…의자가 두 개네.', '…There are two chairs.'), L('grumpy', '하, 하나는 가방 놓는 거야.', "O-one's for my bag.")] },
  { id: 'skatepark', type: 'gray', room: 'skatepark',
    after: [L('inky', '…색 돌려놓는 거, 잘하네.', "…You're good at putting colors back."), L('mong', '너는 가져가는 거 잘하고.', "And you're good at taking them.")] },
  { id: 'skatepark2', type: 'gray', room: 'skatepark', after: [L('skater', '색 찾아 줘서 고마워! 바퀴도 다시 알록달록!', 'Thanks for the colors! My wheels are rainbow again!')] },
  { id: 'alley3', type: 'incident', room: 'alley3',
    intro: [L('shiba', '이번엔 진짜 조용히 숨는다. 꼬리도.', "I'm hiding quietly this time. Tail included.")],
    lock: [K('(붕붕붕)', '(wag wag wag)')],
    reveal: [L('shiba', '꼬리야… 왜 그랬어.', 'Tail… why?')] },
  // 편의점·상가
  { id: 'konbini', type: 'incident', room: 'konbini', always: true,
    reveal: [L('shiba', '간식 코너 앞이라 꼬리가 그만…', 'The snack aisle set my tail off…'), L('shiba', '순찰 일지에 적어 둬야지. 「오늘도 들킴」.', 'Into the patrol log it goes: "Caught again."')],   // (no hiding in it: plays even if the shop falls back to a find-the-things stage)
    intro: [L('mong', '토순이는 도넛. 곰돌이는 꿀. 냥냥이는 생선.', 'Bunbun likes donuts. Bearie, honey. Nyannyan, fish.'), L('shiba', '친구들 좋아하는 걸 다 외웠어?', 'You memorized what all your friends like?'), L('mong', '일기장에 있어.', "It's in my diary."), L('shiba', '그럼 내 건?', 'Then what about me?'), L('mong', '…간식 전부.', '…Every snack.'), L('shiba', '정답!', 'Bingo!')] },
  { id: 'laundry', type: 'incident', room: 'laundry',
    reveal: [L('sundae', '휴~ 다 녹을 뻔! …어, 양말 한 짝 여기 있다.', "Phew! Almost melted! …Oh, here's a missing sock."), L('sundae', '체리는 너 가져. 찾아 준 상!', "The cherry's yours. Finder's prize!")],
    intro: [L('sundae', '세탁기 돌렸더니 양말이 한 짝씩 없어졌어!', "I ran the washer and now every sock's missing its pair!"), L('mong', '…양말도 숨바꼭질 하나 봐.', '…Guess socks play hide-and-seek too.')] },
  { id: 'cafe', type: 'gray', room: 'cafe', inky: K('카페 색은 달콤해 보여서. 내 거야.', 'Café colors looked sweet. Mine now.'),
    after: [L('sundae', '…계산대에 누가 동전을 두고 갔어. 크레파스 그림이랑.', '…Someone left coins on the counter. And a crayon drawing.'), L('mong', '…숨바꼭질 그림이다. 구석에 까만 동그라미.', '…A hide-and-seek drawing. A little inky blob in the corner.'), L('mong', '나쁜 애는 아니야.', 'Not a bad kid.')] },
  // 공원·놀이터
  { id: 'cafe2', type: 'gray', room: 'cafe', inky: K('카페는 두 번 와도 달콤하거든.', "The café's just as sweet the second time."), caught: K('…두 번이나 찾았네.', '…Twice now.') },
  { id: 'playground', type: 'incident', room: 'playground', hide: K('물… 아니, 오늘은 물 없는 데!', 'Water… no! No water today!'),
    intro: [L('frog', '개굴! 낚시터 복수전이다. 이번엔 물 없는 데 숨는다!', "Ribbit! Fishing-spot rematch. This time I'm hiding away from water!")],
    stuck: [K('…물이 그리워.', '…I miss the water.')],
    reveal: [L('frog', '물이 그리워서 나왔어…', 'I missed the water, so I came out…'), L('frog', '한 판 더! 다음엔 진짜야!', 'One more! For real next time!')] },
  { id: 'park1', type: 'gray', room: 'park1', inky: K('…놀이터는 시끄러워서 싫어.', '…Playgrounds are too loud anyway.'), caught: K('…쳇.', '…Tch.'),
    after: [L('inky', '…다들 같이 노는 애가 있네.', "…Everyone's got someone to play with."), L('inky', '…왜 따라와? 찾지 마.', "…Why do you keep following me? Don't come looking."), L('mong', '찾지 말라면서 발자국은 남겨.', 'Says "don\'t come looking." Leaves footprints anyway.')] },
  { id: 'park2gray', type: 'gray', room: 'park2', inky: K('…또 따라왔어? 찾지 말랬잖아.', "…You followed me again? I said don't."), caught: K('…찾지 말랬는데.', '…I told you not to look.') },
  { id: 'park2', type: 'incident', room: 'park2',
    intro: [L('squirrel', '먹을 건 다 숨겼어.', 'I hid all the food.'), L('mong', '오늘 먹을 것도?', "Even today's lunch?"), L('squirrel', '……그것도.', '…That too.')] },
  // 산길·캠핑
  { id: 'camp2', type: 'incident', room: 'camp2',
    intro: [L('sleepy', '랜턴이… 꺼졌어… 스위치는… 쿨…', 'The lantern… went out… the switch is… zzz…'), L('mong', '자지 마. 같이 찾자.', "Don't fall asleep. Let's look together.")],
    reveal: [L('sleepy', '음냐… 불 켜졌네.', "Mmh… the light's on."), L('sleepy', '끝나면 깨워 줘. 같이 돌아가게.', "Wake me when we're done. We'll walk home together.")] },
  { id: 'camp3', type: 'gray', room: 'camp3',
    intro: [L('robot', '삐빅. 기지 색상 데이터 손실. 원인: 작고 까만 생명체.', 'BEEP. Base color data lost. Cause: small inky life-form.')],
    after: [L('robot', '삐빅. 같은 생명체, 아주 오래된 기록에도 있음.', 'BEEP. Same life-form found in very old records.')] },
  { id: 'trailnight', type: 'incident', room: 'trail', night: true,
    intro: [L('panda', '밤 산길이야. 이정표 따라와.', 'Night trail. Follow the signposts.'), L('panda', '먼저 숨어 있을게. 소리 잘 들어 봐.', "I'll go hide first. Listen closely.")] },
  // 빌딩
  { id: 'lobby', type: 'incident', room: 'lobby',
    intro: [L('nerd', '흠. 1층부터 시작이야. 빌딩 전체가 퍼즐이지.', "Hm. We start on the first floor. The whole building's the puzzle."), L('robot', '삐빅. 박사 제작 기간 54일. 수면 부족.', 'BEEP. Doc spent 54 days on it. Not enough sleep.'), L('nerd', '…그건 말 안 해도 돼.', "…You didn't have to mention that.")] },
  // 빌딩의 흑백판: this time 먹물이 doesn't run (a 흑백판 always has 먹물이 in it, so the talk can't fall through)
  { id: 'office', type: 'gray', room: 'officefloor', caught: K('…응. 나야.', "…Yeah. It's me."),
    after: [L('mong', '…이번엔 도망 안 가네.', "…You're not running this time."), L('inky', '다들 찾다가 집에 가. 해 지면.', 'Everyone gives up and goes home. When the sun goes down.'), L('inky', '…"다음에 또 하자"는 말, 아무도 안 해 줬어.', '…Nobody ever said "next time" to me.'), L('mong', '(크레파스 상자를 내밂) 이거 네 거지.', '(holds out the crayon box) This is yours, right?'), L('inky', '…아직 있었어?', '…You kept it?'), L('mong', '분실물이었어. 주인 찾았다.', 'It was in the lost-and-found. Found the owner.'), L('inky', '…색은 다 돌려놓을게.', "…I'll give all the colors back.")] },
];

// ── 숨은그림 판 (10/18 배정: 기본 판은 숨은그림찾기, 친구 숨기는 13판만 — _handoff/stage-mix-plan-20261018.md).
// The host stays out and talks four times: intro, first find, half, one left (hiddenSay), then after. goal: the banner's
// noun when the things weren't simply hidden by the host. Same map + same kind + order as the 사건 scenes.
SCENES.push(
  { id: 'bearH', type: 'hidden', room: 'bear',
    intro: [L('bear', '미술관 고마웠어. 오늘은 우리 집!', 'Thanks for the museum. Today, my place!'), L('bear', '손님 오면 주려고 좋은 걸 숨겨 놨는데… 어디 뒀더라. 으헤헤.', "I hid some nice things for guests… but where'd I put them? Ehehe."), L('mong', '…같이 찾자.', "…Let's look together.")],
    say: { first: K('으헤헤, 그거 거기 있었구나!', "Ehehe, so that's where it was!"), half: K('벌써 반이야? 난 반도 기억 안 나는데.', "Halfway already? I don't even remember half of them."), last: K('하나 남았어. …꿀단지는 아니겠지?', "One left. …It's not the honey pot, is it?") },
    after: [L('bear', '다 찾았다! 꿀 먹을래? 숟가락 두 개 챙겼어.', 'All found! Want some honey? I brought two spoons.'), L('mong', '…하나는 쓴 거 같은데.', '…One of them looks used.'), L('bear', '으헤헤.', 'Ehehe.')] },
  { id: 'fishingH', type: 'hidden', room: 'fishing',
    intro: [L('frog', '개굴! 낚시터에선 내가 챔피언이야.', "Ribbit! At the fishing spot, I'm the champ."), L('frog', '내 보물을 물가에 숨겨 놨어. 다 찾으면 인정!', "I hid my treasures by the water. Find them all and I'll admit it!")],
    say: { first: K('개굴?! 그걸 벌써?', 'Ribbit?! Already?'), half: K('반이나…! 물소리가 도와줄 줄 알았는데.', 'Half…! I thought the water would cover for me.'), last: K('마지막 건 진짜 못 찾을걸! …아마.', "You'll never find the last one! …Probably.") },
    after: [L('frog', '다 찾았다고?! 한 판 더! 다음엔 내가 숨는다!', 'All of them?! One more round! Next time, I hide!'), L('mong', '…수풀에서도 그랬어.', '…You said that in the bushes too.')] },
  { id: 'pengH', type: 'hidden', room: 'peng',
    intro: [L('peng', '펭! 네가 박사 퍼즐 푼 애야?', "Peng! You're the one who solved Doc's puzzle?"), L('peng', '나는 동네 숨기 2등. 1등은 너굴이.', "I'm the second-best hider in town. Rocky's first."), L('peng', '오늘은 내 물건을 꽁꽁 숨겼어. 다 찾으면 1등 비결 알려 줄게!', "Today I hid my stuff tight. Find it all and I'll tell you my number-one secret!")],
    say: { first: K('펭! 그건 연습용이야!', 'Peng! That one was for practice!'), half: K('반이나…? 1등 계획에 차질이…', 'Half…? My number-one plan is slipping…'), last: K('마지막 건 비결 1번으로 숨겼어. 못 찾을걸!', 'I hid the last one with tip number one. Good luck!') },
    after: [L('peng', '1등 비결 1번. 숨길 땐 숨도 참아.', 'Pro tip number one. Hold your breath while you hide stuff.'), L('mong', '…물건은 숨 안 쉬어.', "…Stuff doesn't breathe."), L('peng', '…비결 2번 생각해 올게.', "…I'll come up with tip number two.")] },
  { id: 'bear2H', type: 'hidden', room: 'bear2',
    intro: [L('bear', '으헤헤, 왔구나. 이번엔 접시도 두 개야.', 'Ehehe, you came. Two plates this time.'), L('mong', '숟가락은?', 'And the spoons?'), L('bear', '…깨끗한 걸로 두 개. 팬케이크 굽는 동안 내가 숨긴 거 찾아 봐.', '…Two clean ones. While I make pancakes, find what I hid.')],
    say: { first: K('으헤헤, 그건 부엌 거야.', 'Ehehe, that goes in the kitchen.'), half: K('반 찾았네! 팬케이크도 반 구웠어.', 'Half found! The pancakes are half done too.'), last: K('하나 남았어! 킁킁… 아, 이건 팬케이크 냄새.', "One left! Sniff… oh, that's just the pancakes.") },
    after: [L('bear', '다 찾았다! 놀래 주려고 팬케이크 구웠어. 조금 탔어.', 'All found! I made pancakes to surprise you. A little burnt.'), L('bear', '탄 건 내 거. 으헤헤.', 'The burnt ones are mine. Ehehe.')] },
  { id: 'house2fH', type: 'hidden', room: 'house2f',
    intro: [L('peng', '펭! 비결 2번 생각해 왔어. 높은 데 숨기기!', 'Peng! I came up with tip number two. Hide stuff up high!'), L('peng', '우리 집은 2층이야. 높을수록 1등이지!', 'My house has two floors. Higher means number one!')],
    say: { first: K('펭! 그건 일부러 낮은 데 둔 거야!', 'Peng! I put that one low. On purpose!'), half: K('반이나…? 비결 2번이 안 통해…', "Half…? Tip number two isn't working…"), last: K('마지막 건 제일 높은 데! …쿵. 아무 소리 안 났어.', "The last one's the highest of all! …Thud. That wasn't me.") },
    after: [L('peng', '…비결 3번. 높은 데 올라갈 땐 쿵 하지 않기.', "…Tip number three. Don't go thud when you climb up high."), L('mong', '…적어 둘게. 비결 3번.', '…Writing that down. Tip three.'), L('peng', '너라면 너굴이 물건도 찾겠다.', "I bet you could even find Rocky's stuff.")] },
  { id: 'house3H', type: 'hidden', room: 'house3',
    intro: [L('bear', '다락에 옛날 상자가 있어. 같이 볼래?', "There's an old box in the attic. Want to look?"), L('bear', '근데 열쇠랑 이것저것이 세 층에 다 흩어졌어. 으헤헤.', 'But the key and a bunch of stuff got scattered over three floors. Ehehe.')],
    say: { first: K('으헤헤, 그건 아기 때 쓰던 거야.', 'Ehehe, I used that when I was little.'), half: K('반 찾았다! 다락 냄새 난다.', 'Half found! I can smell the attic.'), last: K('하나 남았어. 그게 제일 소중한 건데…', "One left. And it's the most precious one…") },
    after: [L('bear', '상자 열었다! 어릴 때 인형이야. 곰인형의 곰인형. 으헤헤.', "The box is open! My old teddy. A teddy bear's teddy bear. Ehehe."), L('bear', '아 참, 냥냥이가 네 얘기 묻더라. 엄청 궁금한 눈치던데?', 'Oh, Nyannyan was asking about you. Seemed really curious.')] },
  { id: 'aptH', type: 'hidden', room: 'apt', goal: ['이삿짐 속 물건', 'things from the moving boxes'],
    intro: [L('bunny', '이삿짐 풀다가 내 물건이 다 어디 갔는지 모르겠어!', "I was unpacking, and now I can't find any of my stuff!"), L('bunny', '상자마다 「잡동사니」라고 써 놨거든.', "I labeled every box 'Random Stuff.'"), L('mong', '…그럼 다 열어 보자.', '…Then we open them all.')],
    say: { first: K('그거! 그거 찾고 있었어!', 'That! I was looking for that!'), half: K('반 풀었다! 이제 좀 집 같아.', "Half unpacked! It's starting to feel like home."), last: K('하나 남았어. …아마 상자 속 상자 속에.', 'One left. …Probably in a box inside a box.') },
    after: [L('bunny', '다 풀었다! 이제 진짜 우리 집이야.', "All unpacked! Now it's really home."), L('bunny', '집들이 와 줘서 고마워. 진짜로.', 'Thanks for coming to my housewarming. Really.')] },
  { id: 'oneroomH', type: 'hidden', room: 'oneroom', name: K('햄찌네 원룸', "Hammy's Studio"), goal: ['쏟아진 물건', 'spilled things'],
    intro: [L('hamster', '웁웁! 불 나갔어! 간식 먹다가 다 쏟았어!', 'Mmf! The lights went out! I spilled everything mid-snack!'), L('mong', '스위치부터 찾자. 그다음에 하나씩.', 'Switch first. Then one at a time.')],
    say: { first: K('웁! 그거 내 거야!', "Mmf! That's mine!"), half: K('반 찾았어… 이제 덜 무서워.', "Half found… it's less scary now."), last: K('하나 남았어. …볼에 넣은 건 아니야. 진짜로.', "One left. …It's not in my cheeks. Really.") },
    after: [L('hamster', '…무서워서 씨앗은 다 먹었어.', '…I got scared and ate all the seeds, though.'), L('mong', '볼은 아직 빵빵한데.', 'Your cheeks are still full.'), L('hamster', '…비상식량이야.', '…Emergency rations.')] },
  { id: 'firestationH', type: 'hidden', room: 'firestation', host: 'peng', name: K('동네 119 안전센터', 'The Neighborhood Fire Station'),
    intro: [L('peng', '펭! 오늘은 소방서 체험의 날. 나는 소방관 2등!', "Peng! It's fire station day. I'm the second-best firefighter!"), L('mong', '1등은?', "Who's first?"), L('peng', '…아직 안 정해졌어. 오늘 미션은 내가 숨긴 거 다 찾기!', "…Not decided yet. Today's mission: find everything I hid!")],
    say: { first: K('펭! 빠르다. 출동 속도 1등!', 'Peng! Fast. First-class response time!'), half: K('반이야. 사이렌 울려야 하나…', 'Halfway. Should I sound the siren…'), last: K('마지막 건 비결 4번으로 숨겼어!', 'I hid the last one with tip number four!') },
    after: [L('peng', '비결 4번은… 다음에 알려 줄게. 아직 안 만들었어.', "Tip number four is… for next time. I haven't made it up yet."), L('mong', '…몇 번까지 있어?', '…How many tips are there?'), L('peng', '1등 될 때까지!', 'As many as it takes to be number one!')] },
  { id: 'alley1H', type: 'hidden', room: 'alley1', goal: ['흩어진 물건', 'scattered things'],
    intro: [L('grumpy', '…뭐야. 내 골목에서 뭐 해.', '…What. What are you doing in my alley.'), L('shiba', '킁. 삐딱이 물건이 골목에 흩어졌다는 신고야.', "Sniff. We got a report that Grumpy's stuff is all over the alley."), L('grumpy', '…찾든가 말든가. 건드리지만 마.', "…Find it or don't. Just don't touch anything.")],
    say: { first: K('…그거 내 거 아니야. …내 거야.', "…That's not mine. …Okay, it's mine."), half: K('…반이나? 할 일 없어?', "…Half already? Don't you have anything better to do?"), last: K('…하나 남았어. 별로 안 궁금하지만.', '…One left. Not that I care.') },
    after: [L('grumpy', '…다 찾았네. 고맙단 말은 안 해.', "…You found it all. I'm not saying thanks."), L('mong', '…의자가 두 개네.', '…There are two chairs.'), L('grumpy', '하, 하나는 가방 놓는 거야.', "O-one's for my bag.")] },
  { id: 'alley3H', type: 'hidden', room: 'alley3', host: 'grumpy', name: K('동네 슈퍼', 'Corner Store'), goal: ['쏟아진 물건', 'spilled things'],
    intro: [L('grumpy', '…장 보다가 가방이 터졌어.', '…My bag split open while I was shopping.'), L('grumpy', '…줍는 거 도와주든가. 말든가.', "…Help me pick it up. Or don't."), L('mong', '…도와줄게.', "…I'll help.")],
    say: { first: K('…그거 내 거 맞아. 고마운 건 아니고.', "…Yeah, that's mine. Not that I'm grateful."), half: K('…반. 생각보다 빠르네.', '…Half. Faster than I thought.'), last: K('…하나 남았어. 그건 꼭 찾아야 돼.', '…One left. That one I really need.') },
    after: [L('grumpy', '…다 찾았네. 가방은 새로 사야겠다.', '…You found it all. Guess I need a new bag.'), L('mong', '…가방 놓을 의자는 있어?', '…Got a chair for the bag?'), L('grumpy', '…있어. 두 개.', '…Yeah. Two.')] },
  { id: 'alleyhouseH', type: 'hidden', room: 'alleyhouse',
    intro: [L('shiba', '여긴 우리 집! 마당이랑 집 곳곳에 보물을 숨겨 뒀거든.', "This is my place! I've stashed treasures all over the yard and the house."), L('shiba', '순경 눈썰미 시험이야. 다 찾으면 명예 순경!', "It's an officer's eye test. Find them all and you're an honorary officer!"), L('mong', '…해 볼게.', "…I'll try.")],
    say: { first: K('킁! 그거 내가 아끼는 거!', "Sniff! That's one of my favorites!"), half: K('반이나! 시험 점수 벌써 50점!', 'Half! Fifty points already!'), last: K('하나 남았어. 이건 순경도 못 찾는 데야.', "One left. Even officers can't find this spot.") },
    after: [L('shiba', '합격! 오늘부터 명예 순경이야.', "You pass! From today, you're an honorary officer."), L('mong', '…코 없이도?', '…Even without a nose?'), L('shiba', '눈으로 찾는 순경도 있어야지!', 'Every squad needs an officer who sees!')] },
  { id: 'streetH', type: 'hidden', room: 'street', night: true, host: 'skater', goal: ['떨어진 물건', 'dropped things'],
    intro: [L('skater', '요! 밤 골목 보드 투어 중이었는데…', 'Yo! I was doing a night board tour of the alleys…'), L('skater', '넘어지면서 주머니에 있던 게 다 날아갔어!', 'Wiped out, and everything in my pockets went flying!')],
    say: { first: K('요! 나이스 캐치!', 'Yo! Nice catch!'), half: K('반! 이 정도면 묘기 점수 만점!', "Half! That's a perfect trick score!"), last: K('하나 남았어. 마지막 건 제일 멀리 날아갔나 봐!', 'One left. Guess the last one flew the farthest!') },
    after: [L('skater', '다 찾았다! 넘어진 것도 기술이었던 걸로!', "Got 'em all! Let's call the wipeout a trick!"), L('mong', '…무릎은 괜찮아?', '…Are your knees okay?'), L('skater', '요… 사실 좀 아파.', 'Yo… kinda hurts, actually.')] },
  { id: 'konbiniH', type: 'hidden', room: 'konbini',
    intro: [L('mong', '토순이는 도넛. 곰돌이는 꿀. 냥냥이는 생선.', 'Bunbun likes donuts. Bearie, honey. Nyannyan, fish.'), L('shiba', '친구들 좋아하는 걸 다 외웠어?', 'You memorized what all your friends like?'), L('mong', '일기장에 있어.', "It's in my diary."), L('shiba', '그럼 내 건?', 'Then what about me?'), L('mong', '…간식 전부.', '…Every snack.'), L('shiba', '정답! 그럼 간식 사기 전에 미션. 내가 가게에 숨긴 거 다 찾기!', 'Bingo! Now, a mission before snacks. Find everything I hid in the shop!')],
    say: { first: K('킁! 눈썰미 합격!', 'Sniff! Sharp eyes. Pass!'), half: K('반! 네 배에서 또 소리 난다.', "Half! Your stomach's at it again."), last: K('하나 남았어! 찾으면 간식 산다!', 'One left! Find it and we buy snacks!') },
    after: [L('shiba', '다 찾았다! 간식은 내가 쏜다.', 'All found! Snacks are on me.'), L('grumpy', '…나도 하나. 배고파서야.', "…One for me too. 'Cause I'm hungry.")] },
  { id: 'laundryH', type: 'hidden', room: 'laundry', host: 'grumpy', goal: ['빨래방 분실물', 'things lost in the laundromat'],
    intro: [L('grumpy', '…세탁기 돌렸더니 양말이 한 짝씩 없어졌어.', "…I ran the washer and now every sock's missing its pair."), L('mong', '…양말도 숨바꼭질 하나 봐.', '…Guess socks play hide-and-seek too.'), L('grumpy', '…재미없어. 주머니에 넣어 둔 것도 다 없어졌어.', '…Not funny. Everything in my pockets is gone too.')],
    say: { first: K('…그거 내 거야. 냄새 맡지 마.', "…That's mine. Don't sniff it."), half: K('…반. 양말 짝 맞추는 거 원래 잘해?', '…Half. Are you always this good at matching socks?'), last: K('…하나 남았어. 양말은 원래 하나씩 사라진대.', '…One left. They say socks always vanish one at a time.') },
    after: [L('grumpy', '…다 찾았네. 짝 맞춰 준 건… 고맙다고 해 두지.', '…You found them all. Matching the pairs… fine. Thanks.'), L('grumpy', '…옆 카페 디저트 맛있대. 같이 가든가.', "…Heard the café next door has good desserts. Come along, or don't.")] },
  { id: 'konbini2H', type: 'hidden', room: 'konbini',
    intro: [L('shiba', '킁. 순찰 마지막 코스! 오늘은 내가 간식을 숨겼어. 찾아 봐!', 'Sniff. Last stop on patrol! Today I hid the snacks. Find them!'), L('mong', '…아까 산 거지?', '…The ones we just bought?'), L('shiba', '…반은 먹었어.', '…I ate half.')],
    say: { first: K('킁! 그건 내가 아껴 둔 건데!', 'Sniff! I was saving that one!'), half: K('반! 꼬리가 또 들썩들썩.', "Half! My tail's going again."), last: K('하나 남았어. 이건 진짜 어렵게 숨겼다!', 'One left. I hid this one really well!') },
    after: [L('shiba', '순찰 일지: 「오늘도 들킴. 간식은 나눠 먹음.」', "Patrol log: 'Caught again. Shared the snacks.'")] },
  { id: 'shopmapH', type: 'hidden', room: 'shopmap', night: true, host: 'grumpy', goal: ['흩어진 물건', 'scattered things'],
    intro: [L('grumpy', '…문 닫을 시간인데 가게 열쇠랑 이것저것이 안 보여.', "…It's closing time, and the shop key and a bunch of stuff are missing."), L('sundae', '빨래방 쪽도야! 오늘 하루 종일 정신없었어.', "The laundromat too! It's been a crazy day."), L('mong', '…알바야?', '…You work here?'), L('grumpy', '…아니. 그냥 도와주는 거야.', '…No. Just helping out.')],
    say: { first: K('…하나. 됐어.', '…One. Fine.'), half: K('…반. 셔터는 반만 내려도 되겠네.', '…Half. Could pull the shutter halfway down.'), last: K('…하나 남았어. 찾으면 불 끄고 가자.', "…One left. Find it and we'll turn off the lights.") },
    after: [L('grumpy', '…문단속 끝. 오늘 같이 있어 준 건… 나쁘지 않았어.', "…All locked up. Having you around today… wasn't bad."), L('sundae', '내일은 카페로 와! 디저트 쏠게.', "Come to the café tomorrow! Dessert's on me.")] },
  { id: 'park2H', type: 'hidden', room: 'park2',
    intro: [L('squirrel', '먹을 건 다 숨겼어.', 'I hid all the food.'), L('mong', '오늘 먹을 것도?', "Even today's lunch?"), L('squirrel', '……그것도. 어디 숨겼는지는… 기억 안 나.', "…That too. Where I hid it… I don't remember.")],
    say: { first: K('아! 거기였구나! 고마워!', 'Oh! So that was the spot! Thanks!'), half: K('반이다! 이제 점심은 먹겠다.', 'Half! At least we have lunch now.'), last: K('하나 남았어. …겨울 거라 깊이 숨겼을 거야.', "One left. …That one's for winter, so I hid it deep.") },
    after: [L('squirrel', '다 찾았다! 오늘은 숨기지 말고 같이 먹자.', "All found! Today, no hiding. Let's eat together."), L('mong', '…응. 반은 다람이 거.', '…Okay. Half is yours.')] },
  { id: 'park3H', type: 'hidden', room: 'park3', goal: ['소풍 보물', 'picnic treasures'],
    intro: [L('hamster', '웁웁! 소풍엔 보물찾기지! 내가 보물을 숨겼어!', 'Mmf! Picnics need a treasure hunt! I hid the treasures!'), L('hamster', '이번엔 안 무서워. 해 떠 있으니까!', "I'm not scared this time. The sun's out!")],
    say: { first: K('웁! 첫 번째 보물!', 'Mmf! First treasure!'), half: K('반이야! 볼에 넣어 둔 건 반칙 아니지?', "Halfway! Keeping some in my cheeks isn't cheating, right?"), last: K('하나 남았어! 그건 제일 좋은 보물이야.', "One left! It's the best treasure.") },
    after: [L('hamster', '다 찾았다! 정전 때 고마웠어. 이건 보답!', 'All found! Thanks for the blackout night. This is my thank-you!'), L('mong', '…씨앗이네.', '…Seeds.'), L('hamster', '비상식량 아니고 선물용이야!', 'Not emergency rations. Gift rations!')] },
  { id: 'playgroundH', type: 'hidden', room: 'playground', night: true, goal: ['낮에 흘린 물건', 'things dropped during the day'],
    intro: [L('frog', '개굴! 밤 놀이터 탐험이다. 낮에 놀다 흘린 게 많아.', 'Ribbit! Night playground expedition. We dropped lots of stuff playing today.'), L('frog', '이번엔 내가 숨긴 게 아니니까 진 거 아니야!', "I didn't hide these, so it doesn't count as losing!")],
    say: { first: K('개굴! 밤에도 잘 찾네!', 'Ribbit! You find stuff at night too!'), half: K('반이다! 개굴개굴, 밤엔 노래가 절로 나와.', 'Half! Ribbit ribbit, night makes me want to sing.'), last: K('하나 남았어. 찾으면 집에 가서 자자.', 'One left. Then home to bed.') },
    after: [L('frog', '다 찾았다! 다음엔 큰 공원에서 한 판!', 'All found! Next time, a round in the big park!'), L('mong', '…또 숨을 거지?', "…You're going to hide again, aren't you?"), L('frog', '개굴. 당연하지.', 'Ribbit. Obviously.')] },
  { id: 'camp1H', type: 'hidden', room: 'camp1', host: 'robot', goal: ['흩어진 짐', 'scattered bits of gear'],
    intro: [L('panda', '캠핑장 도착. 올라오다가 짐이 다 흩어졌어.', 'Made it to camp. Our stuff got scattered on the way up.'), L('robot', '삐빅. 산속 기지에서 내려왔음. 큐브봇이 수색을 돕겠음.', 'BEEP. Came down from the mountain base. Cubebot will assist the search.'), L('panda', '천천히 찾아. 기다릴게.', "Take your time. I'll wait.")],
    say: { first: K('삐빅. 1개 회수.', 'BEEP. One recovered.'), half: K('삐빅. 회수율 50%. 판다 표정: 흐뭇.', "BEEP. 50% recovered. Panda's expression: pleased."), last: K('삐빅. 1개 남음. 가장 깊은 곳으로 추정.', 'BEEP. One left. Probably the deepest spot.') },
    after: [L('panda', '고마워. 이제 텐트 치자.', "Thanks. Now let's pitch the tent."), L('panda', '어릴 때 묻은 건… 캠핑장 한가운데 있어. 나중에.', "What we buried as kids… it's in the middle of camp. Later."), L('robot', '삐빅. 「나중에」 일정 저장.', "BEEP. 'Later' saved to schedule.")] },
  { id: 'camp2H', type: 'hidden', room: 'camp2', goal: ['꿈속 물건', "things from Dozy's dreams"],
    intro: [L('sleepy', '랜턴이… 꺼졌어… 스위치는… 쿨…', 'The lantern… went out… the switch is… zzz…'), L('mong', '자지 마. 같이 찾자.', "Don't fall asleep. Let's look together."), L('sleepy', '음냐… 꿈에서 쓰던 것들도… 다 흩어졌어…', 'Mmh… my dream stuff… got scattered too…')],
    say: { first: K('음냐… 그거 내 베개 친구…', "Mmh… that's my pillow buddy…"), half: K('반… 반쯤 깼어…', "Half… I'm half awake…"), last: K('하나… 남았… 쿨…', 'One… left… zzz…') },
    after: [L('sleepy', '음냐… 불 켜졌네.', "Mmh… the light's on."), L('sleepy', '끝나면 깨워 줘. 같이 돌아가게.', "Wake me when we're done. We'll walk home together."), L('mong', '…응. 약속.', '…Okay. Promise.')] },
  { id: 'cabinH', type: 'hidden', room: 'cabin',
    intro: [L('panda', '여긴 우리 오두막. 어릴 때 쓰던 게 아직 여기저기 있어.', 'This is our cabin. Things from when we were little are still lying around.'), L('panda', '찾으면 하나씩 얘기해 줄게.', "Find them and I'll tell you about each one.")],
    say: { first: K('그거… 처음 산에 온 날 거야.', "That one… it's from my first day on the mountain."), half: K('반이네. 그때도 이렇게 같이 찾았어.', 'Half. We used to look for things together like this back then.'), last: K('하나 남았어. 그건… 찾으면 알 거야.', "One left. That one… you'll know when you find it.") },
    after: [L('panda', '다 찾았구나. 고마워.', 'You found them all. Thank you.'), L('panda', '이 오두막, 다음엔 숨바꼭질 하기 딱 좋겠다.', 'This cabin would be perfect for hide-and-seek next time.')] },
  { id: 'trailH', type: 'hidden', room: 'trail', night: true, host: 'sleepy', goal: ['산길에 떨어뜨린 물건', 'things dropped on the trail'],
    intro: [L('sleepy', '음냐… 밤이 되니까 눈이 말똥말똥해.', "Mmh… now that it's night, I'm wide awake."), L('sleepy', '낮에 졸면서 걷다가… 이것저것 떨어뜨렸어.', 'I dozed while walking up today… and dropped a bunch of stuff.'), L('mong', '…랜턴 들고 같이 가자.', "…Grab the lantern. Let's go together.")],
    say: { first: K('오… 그거 내 거야. 잠결에 떨어뜨렸나 봐.', "Ooh… that's mine. Must've dropped it half asleep."), half: K('반이다. 밤엔 내가 더 잘 찾는 것 같아.', 'Half. I think I find stuff better at night.'), last: K('하나 남았어. …찾으면 이제 자도 돼?', 'One left. …Can I sleep once we find it?') },
    after: [L('sleepy', '다 찾았네… 별이 엄청 많아.', 'All found… so many stars.'), L('mong', '…응.', '…Yeah.'), L('sleepy', '음냐… 이제 진짜 졸려…', "Mmh… now I'm really sleepy…")] },
  { id: 'campwideH', type: 'hidden', room: 'campwide', host: 'robot', goal: ['흩어진 물건', 'scattered things'],
    intro: [L('panda', '캠핑장 한가운데야. 오늘 밤 캠프파이어 하자.', 'This is the middle of camp. Campfire tonight.'), L('robot', '삐빅. 준비물 위치 데이터 손실. 다들 아무 데나 두고 감.', 'BEEP. Supply location data lost. Everyone left things wherever.')],
    say: { first: K('삐빅. 졸졸이 소지품 확인.', "BEEP. Dozy's belongings confirmed."), half: K('삐빅. 50%. 캠프파이어까지 예상 시간 단축.', 'BEEP. 50%. Campfire ETA shortened.'), last: K('삐빅. 1개 남음. 찾으면 점화 허가.', 'BEEP. One left. Find it and ignition is approved.') },
    after: [L('robot', '삐빅. 준비 완료. 불꽃 데이터 기록 시작.', 'BEEP. All set. Recording flame data.'), L('panda', '불 피우기 전에… 묻어 둔 상자, 곧 보여 줄게.', "Before we light it… I'll show you the buried box soon.")] },
  { id: 'lobbyH', type: 'hidden', room: 'lobby', goal: ['1층 단서', 'first-floor clues'],
    intro: [L('nerd', '흠. 1층부터 시작이야. 빌딩 전체가 퍼즐이지.', "Hm. We start on the first floor. The whole building's the puzzle."), L('robot', '삐빅. 박사 제작 기간 54일. 수면 부족.', 'BEEP. Doc spent 54 days on it. Not enough sleep.'), L('nerd', '…그건 말 안 해도 돼.', "…You didn't have to mention that.")],
    say: { first: K('흠. 첫 단서. 예상 시간보다 빠르군.', 'Hm. First clue. Ahead of schedule.'), half: K('절반. …계산을 다시 해야겠어.', "Half. …I'll need to recalculate."), last: K('마지막 단서야. 이건 꽤 공들였지.', 'Last clue. I put real work into this one.') },
    after: [L('nerd', '1층 통과. 다음 층은 더 어려워.', 'First floor cleared. The next ones are harder.'), L('robot', '삐빅. 박사 기분 상승 감지.', "BEEP. Detecting a rise in Doc's mood.")] },
  { id: 'kpopH', type: 'hidden', room: 'kpop', goal: ['무대 소품', 'stage props'],
    intro: [L('dj', '둠칫! 네가 몽글이? 소문 들었어. 숨은 거 다 찾는 애!', "Boom-chk! You're Mongle? I've heard. The kid who finds everything!"), L('dj', '공연 전에 무대 소품이 다 사라졌어. 리허설 10분 전!', 'My stage props all vanished before the show. Ten minutes to rehearsal!')],
    say: { first: K('둠칫! 첫 소품 컴백!', "Boom-chk! First prop's back!"), half: K('절반! 베이스 올려!', 'Halfway! Turn up the bass!'), last: K('하나 남았어! 그게 하이라이트 소품이야!', "One left! That's the highlight prop!") },
    after: [L('dj', '찾았다! 다음 곡 제목은 「다 찾았다」!', "Found 'em! Next song title: 'Found It All'!"), L('dj', '다음엔 내가 숨는다. 볼륨 줄이고!', 'Next time, I hide. Volume down!')] },
  { id: 'museumH', type: 'hidden', room: 'museum',
    intro: [L('bear', '으헤헤, 미술관 색이 돌아와서 전시를 새로 했어.', 'Ehehe, the colors came back, so I put up a new exhibit.'), L('bear', '제목은 「숨은 그림 찾기」! 전시실 곳곳에 숨겨 놨어.', "It's called 'Hidden Pictures'! I hid things all over the gallery.")],
    say: { first: K('으헤헤, 첫 관람객 합격!', 'Ehehe, first visitor passes!'), half: K('반이야. 관람 시간 아직 남았어.', "Half. There's still time before closing."), last: K('하나 남았어. 그건 내 최고 작품이야.', "One left. That's my masterpiece.") },
    after: [L('bear', '다 찾았다! 전시 대성공. 으헤헤.', "All found! The exhibit's a hit. Ehehe."), L('bear', '처음 미술관 왔을 때 기억나? 그땐 다 회색이었는데.', 'Remember your first visit? Everything was gray back then.'), L('mong', '…이젠 알록달록해.', "…Now it's full of color.")] },
  { id: 'rooftopH', type: 'hidden', room: 'rooftop', night: true,
    intro: [L('robot', '삐빅. 숨바꼭질 대신 보물찾기 실행. 부품 숨김 완료.', 'BEEP. Running treasure hunt instead of hide-and-seek. Parts hidden.'), L('robot', '저장할 기록: 몽글이가 다 찾는 데 걸린 시간.', 'Data to save: how long it takes Mongle to find them all.')],
    say: { first: K('삐빅. 1개 발견. 예측보다 빠름.', 'BEEP. One found. Faster than predicted.'), half: K('삐빅. 50% 달성. 예측 수정 중.', 'BEEP. 50% done. Revising prediction.'), last: K('삐빅. 1개 남음. 예측 포기.', 'BEEP. One left. Prediction abandoned.') },
    after: [L('robot', '삐빅. 보물찾기 종료. 기록: 「즐거움」 수치 상승.', "BEEP. Treasure hunt over. Log: 'fun' levels rising."), L('mong', '…너도 재밌었구나.', '…You had fun too.')] },
  { id: 'officeH', type: 'hidden', room: 'officefloor', goal: ['어둠 속 물건', 'things in the dark'],
    intro: [L('nerd', '흠. 정전이군. 정전도 변수일 뿐이지.', 'Hm. A blackout. Just another variable.'), L('nerd', '…연구 노트랑 도구가 어둠 속 어딘가에 있어. 같이 찾아 줄래?', '…My notes and tools are somewhere in the dark. Will you help me look?')],
    say: { first: K('흠. 어둠 속에서도 찾는군.', 'Hm. You find things even in the dark.'), half: K('절반. 손전등보다 네 눈이 낫다.', 'Half. Your eyes beat my flashlight.'), last: K('하나 남았어. …옆에 있어 줘서 다행이야.', "One left. …I'm glad you're here.") },
    after: [L('nerd', '어둠 속에서도 다 찾다니. 계산 밖이야.', 'You found everything in the dark. Beyond my calculations.'), L('nerd', '…솔직히 이런 친구, 처음이야.', "…Honestly, I've never had a friend like you.")] },
);

// ── 먹물이 in the 흑백판, by where we are in the story: a voice → caught again → quiet → helping you look
const INKY = [
  { intro: K('…킥. 못 찾을걸.', "…Heh. Bet you can't."), caught: K('…쳇.', '…Tch.'),
    miss: [K('…킥.', '…Heh.')], idle: [K('바로 코앞인데.', "It's right under your nose.")], found: [K('…쳇.', '…Tch.')], furn: [K('…그 큰 걸 찾았어?', '…You found the big one?')] },
  { intro: K('…넌 왜 맨날 끝까지 찾아?', '…Why do you always look till the end?'), caught: K('…쳇. 또 찾았네.', '…Tch. Found me again.'),
    miss: [K('거기 아니야.', 'Not there.')], idle: [K('다들 금방 포기하던데.', 'Everyone else gives up fast.')], found: [K('…또 찾았어?', '…Found it again?')], furn: [K('…그것까지?', '…That too?')] },
  { intro: K('…또 왔어?', '…You came again?'), caught: K('…너는 안 가네.', "…You don't go home, huh."),
    miss: [K('…', '…')], idle: [K('…아직 있어?', '…Still here?')], found: [K('…응.', '…Yeah.')], furn: [K('…응.', '…Yeah.')] },
  { intro: K('여긴 아직 못 돌려놨어. 같이 찾자. 어디 뒀는지 알아.', "Haven't put this one back yet. Let's look. I know where."), caught: K('봐, 다 돌아왔지?', 'See? All back.'),
    miss: [K('거긴 아니야. 나라면 거기 안 숨겨.', "Not there. I'd never hide it there.")], idle: [K('구석구석 봐. 난 늘 엉뚱한 데 숨겨.', 'Check every corner. I always pick the weird spots.'), K('…그건 내가 봐도 어렵다.', "…Okay, even I think that one's hard.")], found: [K('그거 내가 제일 잘 숨긴 건데.', 'That was my best hiding spot.')], furn: [K('맞아, 그거.', "Yep, that one.")] },
];
// more of 먹물이 per phase, taken in turn by the 흑백판 count, so it doesn't say the same thing every time (70판 점검 10/18)
const INKY_V = [
  { intro: [], caught: [] },
  { intro: [K('오늘 색깔은 특히 예뻤는데. 내 거야.', 'Today\'s colors were extra pretty. Mine now.'), K('알록달록한 건 다 숨겨 버렸지롱.', 'I hid everything colorful. Nyeh-heh!'), K('또 너야? 이번엔 안 들킬 거야.', 'You again? Not getting caught this time.')],
    caught: [K('…또 들켰다.', '…Caught again.'), K('…또 날 찾았어?', '…You found me again?'), K('흥, 이번만이야.', 'Hmph. I let you win. Just this once.')] },
  { intro: [K('…다른 애들은 벌써 집에 갔는데.', '…Everyone else already went home.'), K('…오늘도 찾으러 온 거야?', '…You came looking again today?')],
    caught: [K('…해 지기 전에 찾았네.', '…You found me before sundown.'), K('…응.', '…Yeah.')] },
  { intro: [], caught: [] },
];
const GRAY_OWNER = [K('앗, 색깔이 몽땅 사라졌어!', 'Whoa, all the colors are gone!'), K('또 회색이야. 그 까만 애 짓이야!', "Gray again. It's that inky little sneak!"), K('여기가 흑백 영화가 됐어…', 'This place turned into a black-and-white movie…')];
const GRAY_BY = {
  bunny: [K('몽글아! 여기가 흑백 영화가 됐어!', 'Mongle! This place turned into a black-and-white movie!')],
  skater: [K('요! 내 보드가 회색이 됐어! 바퀴까지!', 'Yo! My board went gray! Even the wheels!'), K('또야? 그 까만 애, 내 보드보다 빨라!', "Again? That inky sneak's faster than my board!")],
  sundae: [K('내 체리가 회색이야! 맛도 회색 맛 나…', "My cherry's gray! It even tastes gray…"), K('또 회색이야! 이번엔 시럽까지 가져갔어.', 'Gray again! It took the syrup this time.')],
  frog: [K('개굴! 다 회색이야. 나도 회색 될 뻔!', "Ribbit! Everything's gray. I almost went gray too!")],
  squirrel: [K('내 도토리가 회색이야! …원래 갈색이었나?', 'My acorns are gray! …Wait, were they brown?')],
  sleepy: [K('음냐… 꿈이 흑백이네… 아, 꿈 아니구나…', 'Mmh… a black-and-white dream… oh. Not a dream…')],
  nerd: [K('흠. 여기 색상값이 전부 0이군.', 'Hm. Every color value in here reads zero.'), K('흠. 아직 회색인 데가 남았군.', 'Hm. A few spots are still gray.')],
};
const GRAY_MONG2 = [K('…크레파스 냄새.', '…Smells like crayons.'), K('하나씩 찾자.', 'One at a time.')];
const GRAY_MONG = K('까만 애가 색을 가져가 숨겼어. 찾으면 돌아와.', 'That inky kid took the colors and hid them. Find them, and they come back.');

// ── 너굴이's timed stages: the champion, a new excuse every time
const ROCKY = [
  [L('raccoon', '네가 펭펭이 이겼다는 애? 나 너굴이. 동네 숨기 1등.', "You beat Pengpeng? I'm Rocky. Number-one hider in town."), L('raccoon', '내가 셀 동안 다 찾으면 인정해 줄게.', "Beat my count and I'll admit you're good."), L('raccoon', '천천히 셀게. …조금만.', "I'll go slow. …Kinda.")],
  [L('raccoon', '저번엔 봐준 거야. 오늘은 진짜로 센다!', 'Last time I went easy. Today I count for real!')],
  [L('raccoon', '이번엔 반칙 안 해. …아마.', 'No cheating this time. …Probably.'), L('mong', '반칙했었어?', 'You cheated?'), L('raccoon', '안 했거든?!', 'Did NOT!')],
  [L('raccoon', '1등 자리는 못 줘. 하나, 둘…!', 'Not giving up my number-one spot. One, two…!')],
  [L('raccoon', '…솔직히 너 좀 잘해. 그래도 센다!', "…Okay, you're kinda good. Still counting!")],
  [L('raccoon', '마지막 승부다! 지면… 다음에 또 해!', "Final showdown! If I lose… there's always next time!")],
];
const ROCKY_WIN = [K('오늘은 봐준 거야. 진짜야.', 'I went easy on you today. For real.'), K('…봐준 거라니까.', '…I said I went easy.'), K('바, 반칙 아니야!', "Th-that wasn't cheating!"), K('…다음엔 진짜야.', '…Next time is for real.'), K('…방금 건 진짜 안 봐줬어.', "…I really didn't go easy that time."), K('…인정. 너 1등. 다음 판까지만!', "…Fine. You're number one. Until next round!")];
export const ROCKY_LOSE = K('메롱~ 1등은 아무나 하나!', "Nyah-nyah~ Number one isn't for just anyone!");

// ── the region bosses (escape rooms): bound to the first boss stage on their map
const BOSS = [
  { id: 'grumpycat', room: 'catstory', title: K('심통난 냥냥이', 'Sulky Nyannyan'), cast: 'cat',
    intro: [L('mong', '내 놀이 일기장이 없어졌어.', 'My play diary is gone.'), L('cat', '흥. 몰라. 아무것도 안 봤다냥.', "Hmph. Don't know. Didn't see a thing, meow."), L('mong', '…수염에 잉크 묻었는데.', "…You've got ink on your whiskers."), L('cat', '차, 찾을 수 있으면 찾아보라냥! 저 위는 내 자리다냥!', 'F-find it yourself, then! And that spot up there is MINE!')],
    chain: { treatOn: ['yarnbasket', 'chest'], treatIn: ['dishcab', 'safe', 'fridge', 'fishtank'], hero: 'diary', treat: 'fishsnack' },
    secret: 'goldbone',
    lines: { blocked: [K('비킬 생각 없다냥.', 'Not moving.'), K('흥. 생선이면 몰라도.', "Hmph. Unless it's fish."), K('…냄새는 좋네. 아니, 안 비켜.', '…Smells nice. No. Still not moving.')],
      fed: K('냠… 이, 이번만이다냥.', 'Nom… J-just this once.'),
      tap: [K('흥.', 'Hmph.'), K('(꼬리를 휙)', '(tail flick)'), K('일기장? 무슨 일기장?', 'Diary? What diary?'), K('…재밌는 거 써 있어?', '…Anything good in it?')] },
    outro: [L('cat', '…다들 네 일기장에 나온다길래. 나도 있나 궁금했다냥.', "…Everyone said they're in your diary. I wanted to see if I was."),
      L('mong', '토순이, 웃음 못 참음. 곰돌이, 기다리다 잠.', "Bunbun: can't stop giggling. Bearie: naps while waiting."), L('mong', '펭펭이, 비결이 세 개.', 'Pengpeng: three pro tips.'),
      L('mong', '냥냥이 칸은… 오늘 쓰면 돼.', 'Your page… I can write it today.'), L('cat', '…뭐라고 쓸 건데.', '…What are you going to write?'),
      L('mong', '꼬리는 못 숨김.', "Can't hide that tail."), L('cat', '…! (꼬리를 휙 감춤)', '…! (tucks the tail away)'),
      L('cat', '이거, 캣타워. 네 방에 둬. 내가 가면 앉게.', 'Here. A cat tower. Keep it at your place. For when I visit.'),
      L('mong', '…맨 뒷장에 까만 발자국. 누가 또 봤네.', '…Inky footprints on the last page. Someone else read it.'),
      L('cat', '그 까만 애? 졸졸이가 알 거다냥. 밤새 창밖만 보거든.', 'The inky one? Ask Dozy. Dozy watches the window all night.')],
    reward: { furn: 'cattower', coins: 200 } },
  { id: 'apt-boss', room: 'policefront', title: K('분실물 보관함', 'The Lost-and-Found'), cast: 'shiba',
    intro: [L('shiba', '분실물 보관함을 너무 꼼꼼히 잠갔어.', 'I locked the lost-and-found a little too well.'), L('shiba', '열쇠, 번호, 색깔, 레버까지… 킁.', 'Key, code, colors, a lever… sniff.'), L('shiba', '주인들한테 돌려줘야 해. 같이 열자!', "We have to get these back to their owners. Let's open them together!")],
    secret: 'goldbone',
    lines: { tap: [K('킁킁, 거의 다 왔어!', "Sniff sniff, we're close!"), K('그건 우산 주인 거야.', "That one's the umbrella owner's."), K('(꼬리를 붕붕)', '(tail wagging)')] },
    outro: [L('shiba', '다 돌려줬다! …하나 남았네. 이름 없는 크레파스 상자.', 'All returned! …Except one. A crayon box with no name.'), L('mong', '(상자 바닥에 까만 손자국) …알 것 같아.', '(a small inky handprint on the bottom) …I think I know whose.'), L('shiba', '그럼 네가 갖고 있어. 주인 만나면 전해 줘.', 'Then you hold onto it. Give it back when you find the owner.'), L('bunny', '짐 다 풀었어! 이 코타츠는 너네 집에 둘래.', "All unpacked! This kotatsu's going to your place."), L('bunny', '내 자리야. 이제 호텔 놀이 하자! 지배인은 너!', "That's my spot. Now let's play hotel! You're the manager!")],
    reward: { furn: 'kotatsu', coins: 250 } },
  { id: 'alley-boss', room: 'alleywide', title: K('삐딱이의 비밀 아지트', "Grumpy's Secret Hideout"), cast: 'grumpy',
    intro: [L('grumpy', '오늘도 한 판만. …시간은 많지만.', "One game again. …I've got time, though."), L('grumpy', '자물쇠 네 개 걸어 놨어. 열 수 있으면 열어 봐.', 'I put four locks on it. Open them if you can.')],
    secret: 'pawprint',
    lines: { tap: [K('흥.', 'Hmph.'), K('…거기 말고.', '…Not there.'), K('찾든 말든 상관없거든!', "I don't care if you find it!")] },
    outro: [L('grumpy', '…진짜 다 열었네.', '…You actually opened all of it.'), L('mong', '삐딱이, 까만 애 알아? 크레파스 들고 다니는.', 'Grumpy, know the inky one? Carries crayons around.'), L('grumpy', '…어릴 때 같이 놀았던 것도 같고. 기억 안 나.', "…Maybe we played as kids. Don't remember."), L('grumpy', '내일도… 이 시간엔 있어.', "I'll be here tomorrow. Same time."), L('mong', '우리 집에도 의자 하나 놓을게.', "I'll put out a chair at my place too."), L('grumpy', '이거, 떡볶이 포장마차. 의자는 두 개면 돼.', "Here. My tteokbokki stall. Two stools. That's plenty.")],
    reward: { furn: 'tteokstall', coins: 300 } },
  { id: 'shop-boss', room: 'shopmap', title: K('마감 시간의 금고', 'The Closing-Time Safe'), cast: 'sundae',
    intro: [L('sundae', '마감인데 금고가 안 열려! 번호를 찢어서 숨겼거든… 내가.', "The safe won't open! I tore up the code and hid it… myself."), L('shiba', '사장님, 그걸 왜…', 'Boss, why would you…')],
    secret: 'goldbone',
    lines: { tap: [K('코코아 한 잔 줄까?', 'Want some cocoa?'), K('번호를 왜 찢었을까, 나…', 'Why did I tear up the code…'), K('빨리빨리! 문 닫을 시간이야!', "Hurry, hurry! It's closing time!")] },
    outro: [L('sundae', '금고 안엔 돈 대신… 다 같이 먹을 간식.', 'Inside the safe… not money. Snacks for everyone.'), L('sundae', '마감하고 먹으려고.', 'For after closing.'), L('sundae', '이 간식 카트 줄게. 같이 먹을 건 이미 준비했어.', "Take this snack cart. It's already packed for sharing.")],
    reward: { furn: 'snackcart', coins: 300 } },
  { id: 'park-boss', room: 'playgroundwide', title: K('소풍 바구니를 지켜라', 'Save the Picnic Basket'), cast: 'frog',
    intro: [L('frog', '개굴! 소풍 도시락이 몽땅 사라졌어!', 'Ribbit! The whole picnic lunch is gone!'), L('squirrel', '나 아니야! …아마도.', 'Not me! …Probably.'), L('frog', '숨긴 데마다 자물쇠야. 딱 다람이 솜씨다, 개굴!', "Every hiding spot's locked. Classic Chippy, ribbit!")],
    secret: 'furball',
    lines: { tap: [K('개굴!', 'Ribbit!'), K('배고파 개굴…', "I'm hungry, ribbit…"), K('개굴… 도시락 냄새 난다.', 'Ribbit… I can smell lunch.')] },
    outro: [L('squirrel', '너무 꼭꼭 숨겼어. 나도 못 찾을 만큼.', "I hid it so well, even I couldn't find it."), L('frog', '그러니까 친구가 있어야 해, 개굴!', "That's why you need friends. Ribbit!"), L('squirrel', '이 벤치 가져가. 너 쉬는 자리도 있어야지.', 'Take this bench. You need somewhere to rest, too.')],
    reward: { furn: 'bench2', coins: 320 } },
  { id: 'camp-boss', room: 'campwide', title: K('캠핑장 보물상자', 'The Campsite Treasure Box'), cast: 'panda',
    intro: [L('panda', '다 왔다. 어릴 때 묻은 상자, 이 근처야.', 'We made it. The box we buried is around here.'), L('sleepy', '열쇠는 텐트에… 쪽지는 계곡에… 색깔 카드는… 몰라…', "Key's in the tent… note's by the stream… color card… no idea…"), L('mong', '자물쇠는 네 개. 다 열어 보자.', "Four locks. Let's open them all.")],
    secret: 'goldbone',
    lines: { tap: [K('천천히 해. 기다려 줄게.', "Take your time. I'll wait."), K('상자, 거의 다 찾았어!', "We're close to the box!"), K('졸졸이 깨우지 마~', "Don't wake Dozy!")] },
    outro: [L('panda', '찾았다. 어릴 때 다 같이 묻은 거.', 'Found it. The one we buried as kids.'), L('panda', '사진이다. 나, 토순이, 삐딱이, 곰돌이…', 'A photo. Me, Bunbun, Grumpy, Bearie…'), L('mong', '…구석에 하나 더. 까만 애.', '…One more, in the corner. Small and inky.'),
      L('panda', '(조용히) 그날 숨바꼭질 했어.', '(quietly) We played hide-and-seek that day.'), L('panda', '끝까지 못 찾은 애가 있었는데…', 'One kid was never found…'), L('panda', '해가 져서, 다들 그냥 집에 갔어.', 'The sun went down, and everyone just went home.'),
      L('mong', '…그 애, 아직 숨어 있는 거 아닐까.', "…Maybe that kid's still hiding."), L('panda', '이 랜턴 가져가. 오늘 밤엔 불 켜 두자.', "Take this lantern. Let's leave a light on tonight.")],
    reward: { furn: 'lantern', coins: 350 } },
  { id: 'bld-boss', room: 'lobbymap', title: K('로비의 마지막 수수께끼', 'The Last Riddle in the Lobby'), cast: 'nerd',
    intro: [L('nerd', '마지막 단계야. 자물쇠 넷, 찢어진 번호 셋, 레버 하나.', 'Final stage. Four locks, three torn codes, one lever.'), L('robot', '삐빅. 성공 확률 계산 중… 생략. 몽글이니까.', "BEEP. Calculating odds… skipped. It's Mongle."), L('mong', '끝까지 찾자. 가 보자.', "We look till the end. Let's go.")],
    secret: 'diary',
    lines: { tap: [K('논리적으로 생각해 봐!', 'Think logically!'), K('삐빅. 힌트: 박사가 금지함.', 'BEEP. Hints: banned by Doc.'), K('거의 다 왔어!', 'Almost there!')] },
    outro: [L('nerd', '상자 안엔… 동네 친구들이 쓴 쪽지야.', 'Inside the box… notes from everyone in town.'), L('mong', '(쪽지마다) "다음엔 몽글이네서!"', '(every note says) "Next time, at Mongle\'s!"'), L('robot', '삐빅. 동행 기록 저장. 삭제하지 않음.', 'BEEP. Memory saved. Will not delete.'), L('nerd', '이 레코드장 가져가. 둠칫이 「찾았다」도 넣어 놨어.', 'Take this record cabinet. DJ Bop\'s "Found You" is inside.')],
    reward: { furn: 'recordcab', coins: 600 } },
];

// ── chapter cinematics: why we go somewhere new (stages.js REGION_INTRO, rewritten in place)
const REGION = {
  apt: { title: K('토순이네 새 집', "Bunbun's New Place"), cast: ['mong', 'bunny'], lines: [L('bunny', '몽글아! 새 집이야! 짐은 아직 덜 풀었지만.', 'Mongle! New place! Not quite unpacked yet.'), L('mong', '…발자국도 이쪽으로 왔어.', '…The footprints came this way, too.')] },
  alley: { title: K('순찰 가자!', 'Patrol Time!'), cast: ['mong', 'shiba', 'grumpy'], lines: [L('shiba', '약속한 순찰이다! 오늘은 골목.', 'Patrol time, like I promised! Today, the alleys.'), L('shiba', '삐딱이네 골목은 조심해. 걔는 말을 좀… 삐딱하게 해.', "Careful in Grumpy's alley. Grumpy talks a little… grumpy."), L('mong', '…그래서 삐딱이구나.', '…Hence the name.')] },
  shop: { title: K('배고픈데 편의점 가자!', "Snack Run!"), cast: ['mong', 'shiba', 'grumpy'], lines: [L('mong', '(꼬르륵)', '(grumble)'), L('shiba', '사건이다. 네 배에서.', "We've got a case. Your stomach."), L('grumpy', '…나도 간다. 배고파서야. 너 때문 아니고.', "…I'm coming too. 'Cause I'm hungry. Not 'cause of you.")] },
  park: { title: K('공원으로 소풍', 'Picnic in the Park'), cast: ['mong', 'frog', 'squirrel'], lines: [L('frog', '개굴! 날 좋다! 공원으로 소풍 가자!', "Ribbit! Nice day! Let's picnic in the park!"), L('squirrel', '먹을 건 내가 챙겼어. …숨겨 놨지만.', "I packed the food. …And hid it.")] },
  camp: { title: K('산길 따라 캠핑장', 'Up the Trail to Camp'), cast: ['mong', 'panda', 'sleepy'], lines: [L('panda', '주말엔 산이지. 어릴 때 다 같이 캠핑장에 뭘 묻었어.', 'Weekend hike! As kids, we buried something at the campsite.'), L('panda', '캠핑장에 가면 보여 줄게. 천천히 가자. 기다려 줄게.', "I'll show you at the campsite. Let's take it slow. I'll wait for you.")] },
  building: { title: K('약속한 퍼즐', 'The Promised Puzzle'), cast: ['mong', 'nerd', 'robot'], lines: [L('nerd', '몽글아, 약속 기억하지? 너만을 위한 퍼즐.', 'Mongle, remember my promise? A puzzle just for you.'), L('robot', '삐빅. 로비부터 옥상까지, 단서가 층마다 숨겨져 있음.', 'BEEP. Clues hidden on every floor, lobby to rooftop.'), L('mong', '…발자국이 이 빌딩으로 들어갔어.', '…The footprints go into this building.')] },
};

// ── the boss games: a few lines before (lead) and after the first win (out), by game and set-up
const GAME = {
  'whack:0': { lead: [L('frog', '개굴! 수풀 놀이 할 사람?', 'Ribbit! Who wants to play in the bushes?'), L('frog', '고개 내밀 때 톡 하면 찾은 거야.', "Tap us when we pop up. That's a catch!"), L('raccoon', '나도 낄래~ 근데 나 누르면 하나 빼기다?', 'Count me in! Tap me, though, and you lose one.'), L('mong', '…누구야.', "…Who's that?")],
    out: [L('frog', '손 빠르다! 내 낚시터에도 와. 거기선 못 찾을걸?', "Fast hands! Come to my fishing spot. You won't find me there.")] },
  'yasik:0': { lead: [L('bunny', '몽글아! 오늘 너네 집에서 자도 돼?', 'Mongle! Can I sleep over at your place tonight?'), L('bunny', '(꼬르륵) …들었어?', '(grumble) …Did you hear that?'), L('mong', '네 배.', 'Your stomach.'), L('bunny', '냉장고에 푸딩 있잖아…', "There's pudding in the fridge…"), L('mom', '얘들아~ 이제 자야지~', 'Kids! Bedtime!'), L('mong', '…이번엔 우리가 안 들킬 차례.', '…Our turn to stay out of sight.')],
    out: [L('bunny', '푸딩 두 개야! 하나는 내 거.', "Two puddings! One's mine."), L('mom', '…냉장고 문은 닫고 자라~', '…And close the fridge before bed, dears.'), L('mong', '…!!', '…!!')] },
  'blanket:0': { lead: [L('bunny', '오늘 다 같이 파자마 파티! 불 끄고 이불 뒤집어쓰기!', "Pajama party tonight! Lights off, blankets on!"), L('bunny', '왼쪽부터 한 명씩, 누군지 맞혀 봐!', "Left to right, one by one. Guess who's who!")],
    out: [L('bear', '으헤헤… 이제 자도 돼?', 'Ehehe… can I sleep now?'), L('bunny', '안 돼! 아직 밤 안 샜어!', "No! We haven't stayed up all night yet!")] },
  'wakeup:0': { lead: [L('cat', '졸졸이는 아침엔 꼭 잔다냥.', 'Only thing is, Dozy sleeps all morning.'), L('mong', '졸졸아, 까만 애 봤어?', 'Dozy, did you see the inky one?'), L('sleepy', '드르렁~ 쿨쿨…', 'Zzz… snore…'), L('cat', '…깨워야겠다냥.', "…We'll have to wake Dozy up.")],
    out: [L('sleepy', '음냐… 까만 애? 봤어… 매일 밤 혼자 걸어가.', 'Mmh… the inky one? Yeah… it walks by alone every night.'), L('sleepy', '아파트 쪽으로… 쿨…', 'Toward the apartments… zzz…'), L('mong', '…혼자.', '…Alone.'),
      L('bunny', '몽글아! 나 아파트로 이사 가!', "Mongle! I'm moving to the apartments!"), L('bunny', '집들이 와 줄 거지?', "You'll come to my housewarming, right?"), L('mong', '응. 다음엔 너네 새 집에서.', 'Yeah. Next time, at your new place.'), L('bunny', '그리고 마지막엔 다 같이 너네 집! 약속!', 'And at the end, everyone at your place! Promise!')] },
  'hotel:2': { lead: [L('bunny', '지배인 몽글이! 3박 4일 동안 방 잘 부탁해!', 'Manager Mongle! Take good care of our rooms!')] },
  'yasik:1': { lead: [L('sundae', '간식은 챙겼고… 문제는 집에 가져가는 거.', 'Snacks: packed. Problem: getting them home.'), L('mong', '…엄마.', '…Mom.')], out: [L('mong', '…엄마 발소리에 맞춰 걸었어.', "…I matched my steps to Mom's.")] },
  'wakeup:1': { lead: [L('panda', '졸졸이 또 안 일어나.', "Dozy's out cold. Again."), L('mong', '…약속했으니까. 깨워서 같이 내려가자.', "…I promised. Let's wake Dozy and walk down together.")], out: [L('sleepy', '음냐… 응. 같이.', 'Mmh… yeah. Together.')] },
  // 쉬어가기 (10/18 정본 배치: 두더지 3·27·58, 이불 8·46, 무궁화 24·63) — 너굴이 rivalry runs through them
  'whack:1': { lead: [L('raccoon', '변장 완벽! 너굴이는 여기 없다~', "Perfect disguise! Rocky's not here~"), L('mong', '…방금 이름 말했어.', '…You just said your name.')] },
  'whack:2': { lead: [L('frog', '개굴! 수풀 피버 타임! 다들 엄청 빨라.', "Ribbit! Speed round! Everyone's super fast.")] },
  'blanket:1': { lead: [L('bunny', '소풍 끝나고 낮잠 파티! 근데… 이불 하나가 수상해.', 'Post-picnic nap party! But… one blanket looks suspicious.'), L('raccoon', '(이불 속에서) 쉿.', '(under a blanket) Shh.')] },
  'redlight:0': { lead: [L('raccoon', '운동장에선 이거지. 무궁화 꽃이 피었습니다!', 'Schoolyard rules: Red light, green light!'), L('mong', '…또 너굴이.', '…Rocky again.')] },
  'redlight:1': { lead: [L('raccoon', '마지막 무궁화 승부다! 이번엔 안 봐줘.', 'Final red light, green light! No going easy this time.')] },
  'yasik:2': { lead: [L('bunny', '약속했지! 마지막은 다 같이 너네 집!', 'You promised! Last of all, everyone at your place!'), L('shiba', '(벌써 잠듦) 쿨… (꼬리만 붕붕)', '(already asleep) zzz… (tail still wagging)'), L('mong', '…멍뭉이는 뛰면 깨. 살금살금.', '…Woofy wakes up if we run. Tiptoe.')], ending: true },
};
// the small games run by scenes/mini.js: their talk in place of the one in minis.js — the old 손전등 intro was 판다's
// "캠핑의 꽃은…", which came up first in an apartment and again as the building's boss. The rule stays in the host's mouth
// as a game rule (the way kids explain a game); how to touch the screen is on screen.
const MINI = {
  lamp: [L('hamster', '웁웁! 이제 안 무서워. 불 끄고 손전등 술래 하자!', 'Mmf! Not scared anymore. Lights off, flashlight tag!'), L('hamster', '불빛에 비친 친구를 톡 하면 찾은 거야!', "Tap whoever's in the light. That's a catch!")],
  'lamp:boss': [L('nerd', '불 끄고 손전등 술래. 이번엔 여덟 명이야.', 'Lights off, flashlight tag. Eight of us this time.'), L('raccoon', '나도 숨는다~ 가짜도 섞어 놨지롱.', "I'm hiding too~ And I mixed in some fakes."), L('mong', '…다 찾을게.', "…I'll find all of you.")],
};
export const miniLead = (kind, boss) => MINI[kind + (boss ? ':boss' : '')] || null;

// ── R1 몰래 숨기 (레벨 보고서 R1, ?hide=1 시제품 — stage.js r1Hide / r1Trail / r1Wrong): you can't watch them hide any more.
// The friend talks from the hideout in their own way: ready, a wrong spot ("여긴 없지롱"), the real spot's tell, close by.
export const R1 = { close: K('눈 감아! 엿보면 안 돼!', 'Close your eyes! No peeking!'), nums: [K('하나', 'One'), K('둘', 'Two'), K('셋', 'Three')] };
// [hidden (from the hideout, after 셋), wrong (a wrong spot was opened), near (3 wrong: close by), trail (몽글이, first look at the trail)]
const R1F = {
  bunny: [['다 숨었다~! (킥)', 'All hidden~! (hee)'], ['거긴 아니야~ 킥', 'Not there~ hee'], ['흡, 가, 가까워…!', "Mmph, y-you're close…!"], ['…부스러기. 토순이가 흘렸네.', '…Crumbs. Bunbun dropped them.']],
  bear: [['다 숨었어… 으헤헤…', 'All hidden… ehehe…'], ['거긴… 쿨… 아니야…', 'Not… zzz… there…'], ['으헤헤, 꿀 냄새 나지?', 'Ehehe, smell the honey?'], ['…부스러기. 곰돌이는 먹으면서 숨는구나.', '…Crumbs. Bearie snacks while hiding.']],
  frog: [['개굴! 준비 완료!', 'Ribbit! Ready!'], ['개굴~ 거긴 마른 데잖아!', "Ribbit~ that spot's dry!"], ['개, 개굴… 물 튀었나?', 'R-ribbit… did I splash?'], ['…젖은 발자국. 개굴이다.', "…Wet footprints. That's Froggy."]],
  peng: [['펭! 1등 자리 확보!', 'Peng! Number-one spot secured!'], ['펭! 거긴 너무 따뜻해!', "Peng! That spot's way too warm!"], ['비결 1번… 숨 참기…', 'Tip one… hold your breath…'], ['…바닥이 살짝 차가워. 펭펭이 지나갔어.', '…The floor is a little cold. Pengpeng went by.']],
  cat: [['…다 숨었다냥.', '…Hidden.'], ['흥. 거긴 내 자리가 아니다냥.', "Hmph. That's not my spot."], ['…꼬리 안 나왔지?', "…My tail's not showing, right?"], ['…털. 냥냥이 거.', "…Fur. That's Nyannyan's."]],
  shiba: [['숨었어! 조용히! …멍!', 'Hidden! Quietly! …Woof!'], ['킁… 거긴 냄새도 안 나잖아!', "Sniff… you can't even smell me there!"], ['꼬리야, 가만있어…!', 'Tail, stay still…!'], ['…간식 부스러기. 멍뭉이는 못 참지.', "…Snack crumbs. Woofy can't resist."]],
  grumpy: [['…됐어. 찾든가.', "…Done. Find me or don't."], ['틀렸어. …한 번 더 해도 돼.', 'Wrong. …You can try again.'], ['흥, 거의 다 왔네.', 'Hmph. Almost.'], ['…부스러기. 일부러 흘린 것 같은데.', '…Crumbs. Looks like they were dropped on purpose.']],
  squirrel: [['다 숨었어! 나까지!', 'All hidden! Me too!'], ['거긴 도토리만 있지롱!', 'Only acorns there!'], ['헉, 내 비상식량 근처야!', "Eek, that's near my snack stash!"], ['…도토리 껍질. 다람이 길이다.', "…Acorn shells. Chippy's trail."]],
  hamster: [['웁웁! 됐어!', 'Mmf mmf! Ready!'], ['웁! 거긴 씨앗만 있어!', 'Mmf! Only seeds there!'], ['볼이… 빵빵해서… 들킬 것 같아…', "My cheeks… too full… gonna get caught…"], ['…씨앗 껍질. 햄찌다.', "…Seed shells. That's Hammy."]],
  sundae: [['다 숨었어~ 녹기 전에 와!', 'All hidden! Come before I melt!'], ['거긴 아니야~ 빨리빨리!', 'Not there! Hurry, hurry!'], ['맞아, 시원한 쪽!', 'Yes, the cool side!'], ['…끈적한 시럽 자국.', '…A sticky syrup trail.']],
  skater: [['요! 착지 완료!', 'Yo! Landed it!'], ['거긴 보드도 없잖아~', 'No board over there~'], ['와우, 거의 킥플립 속도다!', 'Whoa, almost kickflip speed!'], ['…바퀴 자국.', '…Wheel tracks.']],
  panda: [['숨었어. 천천히 와.', 'Hidden. Come slowly.'], ['거긴 아니야. 천천히 해.', 'Not there. Take your time.'], ['오, 가까워. 기다릴게.', "Ooh, close. I'll wait."], ['…대나무 잎.', '…A bamboo leaf.']],
  sleepy: [['숨었어… 이제… 잘게…', 'Hidden… now… nap…'], ['거기… 아니야… 쿨…', 'Not… there… zzz…'], ['음냐… 발소리… 가깝다…', 'Mmh… footsteps… close…'], ['…하품 소리가 저쪽에서 났어.', '…A yawn, from over there.']],
  robot: [['삐빅. 은신 완료.', 'BEEP. Stealth complete.'], ['삐빅. 오답. 재탐색 권장.', 'BEEP. Wrong. Recommend new search.'], ['삐빅. 거리 1미터 이내.', 'BEEP. Distance under one meter.'], ['…나사 하나. 큐브봇이다.', "…A loose screw. That's Cubebot."]],
  nerd: [['흠. 준비됐다.', 'Hm. Ready.'], ['흠. 논리적으로 다시 생각해 봐.', 'Hm. Think it through again.'], ['흠, 그 근처가 합리적이지.', 'Hm, that area is the logical choice.'], ['…연필 자국. 박사님 계산 메모.', "…Pencil marks. Doc's math notes."]],
  dj: [['둠칫! 셋업 끝!', 'Boom-tss! Setup done!'], ['거긴 비트가 안 들리잖아!', "Can't hear the beat there!"], ['볼륨 줄여야 하나…', 'Should I turn it down…'], ['…음표 스티커.', '…A music-note sticker.']],
};
const R1_ANY = [['다 숨었다~!', 'All hidden~!'], ['거긴 아니야~', 'Not there~'], ['히히~ 여기 근처야!', "Hee hee~ I'm close by!"], ['…부스러기가 저쪽으로 이어져.', '…Crumbs, leading that way.']];
for (const v of [...Object.values(R1F), R1_ANY]) for (const [ko, en] of v) K(ko, en);
const R1_AT = { hidden: 0, wrong: 1, near: 2, trail: 3 };
// r1Line(friend kind, 'hidden' | 'wrong' | 'near' | 'trail' | 'real', n): one line to show. 'wrong' takes turns between the
// friend's own and the plain "여긴 없지롱~" (n = how many wrong so far); 'real' is the friend's tell from the true hideout.
// 'trail' names that friend's own trace (개굴이 wet footprints, 냥냥이 fur…); 'crumbs' is for the crumb trail the prototype
// drops now — the friend's line where it is about crumbs, else the plain one.
const CRUMBY = new Set(['bunny', 'bear', 'shiba', 'grumpy']);
export function r1Line(kind, what, n = 0) {
  if (what === 'real') return fr(kind).lock?.[0] || K('킥킥', 'Hee hee');
  if (what === 'crumbs') return (CRUMBY.has(kind) ? R1F[kind] : R1_ANY)[3][0];
  const row = R1F[kind] || R1_ANY, i = R1_AT[what];
  if (i == null) return '';
  if (what === 'wrong' && n % 2 === 1) return R1_ANY[1][0];
  return row[i][0];
}
export const ENDING = [L('bunny', '(속닥) 내일은 뭐 하고 놀까?', '(whispering) What should we play tomorrow?'), L('mong', '숨바꼭질. 내일은 내가 숨길게. 너희가 찾아.', 'Hide-and-seek. Tomorrow I hide stuff, and you all find it.'), L('bunny', '좋아. 찾을 땐 웃어도 되지?', "Deal. I'm allowed to giggle when I'm seeking, right?"), L('inky', '(현관문 틈으로 빼꼼) …다음에, 나도 돼?', '(peeking in at the door) …Is "next time" for me too?'), L('mong', '응, 먹물아. 그다음엔 네가 숨어. 끝까지 찾을게.', "Yeah, Inky. After that, you hide. I'll look till the end."), L('bunny', '(킥) 이번엔 색 가져가기 없기!', '(hee) No taking the colors this time!')];
export const ENDING_CARD = K('숨는 건, 누가 찾아 주길 바라서야.', 'We only hide because we hope someone will come looking.');

// ── my home, the first time (after stage 2): 토순이 comes over and you hide one thing for her
export const HOME_TUT = {
  hello: [L('bunny', '여기가 너네 집이구나!', 'So this is your place!'), L('bunny', '이거 숨겨 봐. 아무 데나!', 'Hide this. Anywhere you like!')],
  both: K('아래에서 숨길 물건을 고르고, 숨길 곳을 톡', 'Pick an item, then tap a hiding spot'),
  count: [L('bunny', '좋아, 눈 감았다! 하나, 둘, 셋…!', 'Okay, eyes closed! One, two, three…!')],
  found: [L('bunny', '찾았다! 헤헤, 다음엔 더 깊이 숨겨 봐.', 'Found it! Hehe. Hide it better next time.')],
  missed: [L('bunny', '으으, 어디 숨겼어?! …알려 주지 마!', "Ugh, where'd you put it?! …Don't tell me!")],
  bye: [L('bunny', '이렇게 숨겨 두면, 동네 애들이 찾으러 놀러 와.', 'Hide things like this, and kids in town come over to look.'), L('bunny', '오늘은 여기까지! 또 놀러 올게.', "That's it for today! I'll come over again.")],
};

// ── on-screen instructions (▶): one action, stays until it's done, says more when you're stuck
export const DO = {
  donut: K('도넛을 톡', 'Tap the donut'), donut2: K('바닥의 도넛을 톡 눌러 봐', 'Tap the donut on the floor'),
  turnBadge: K('↻ 회전을 톡', 'Tap ↻ Turn'), turnBadge2: K('오른쪽 아래 ↻ 회전 버튼을 톡', 'Tap ↻ Turn at the bottom right'),
  turnDrag: K('옆으로 끌어서 방 돌리기', 'Drag sideways to turn the room'), turnDrag2: K('흔들리는 상자 앞이 보일 때까지 쭉 끌어 봐', 'Drag until the box faces you'),
  turnAny: K('방을 돌려서 상자 앞을 봐', 'Turn the room to face the box'),
  // 기본 조작 F (조작감 세션, 10/18): the turn dial bottom right — push it sideways to turn, up/down to tilt
  turnDial: K('돌림판을 옆으로 밀어 방 돌리기', 'Slide the dial to turn the room'),
  tilt: K('돌림판을 위아래로 밀어 기울이기', 'Slide the dial up or down to tilt'), tilt2: K('돌림판을 위아래로 쭉 밀면 위에서 내려다볼 수 있어', 'Slide the dial up or down to look from above'),
  turnDial2: K('오른쪽 아래 돌림판을 쭉 밀어서 상자 앞을 봐', 'Slide the dial till the box faces you'),
  box: K('상자를 톡', 'Tap the box'), box2: K('흔들리는 상자를 톡 눌러 봐', 'Tap the shaking box'),
  drawer: K('서랍을 톡 해서 열기', 'Tap a drawer to open it'), drawer2: K('서랍이나 문을 톡! 안에 물건이 있어', 'Tap drawers and doors to look inside'),
  zoom: K('두 손가락을 벌려 크게 보기', 'Spread two fingers to zoom in'),
  move: K('한 손가락으로 끌어서 옆으로 가 봐', 'Drag one finger to move'),
  moveE: K('✥ 이동을 톡 하고, 끌어서 옆으로 가 봐', 'Tap ✥ Move, then drag'),
};
// ── 엄마 몰래 야식, 첫째 밤: the practice the first time (bosses/yasik.js; GPT 안 10/18). The same rules: one action, over
// only when it's done, a more exact line (…2) when you're stuck. Never "stand still and you're safe": in her eyes,
// standing still gets you caught too
export const YASIK_DO = {
  press: K('가고 싶은 바닥을 꾹 누르고 있기', 'Hold down where you want to go'), press2: K('반짝이는 바닥을 손가락으로 꾹! 떼면 멈춰', 'Hold the glowing spot. Let go to stop'),
  cover: K('가구 뒤 반짝이는 곳까지 가기', 'Head for the glow behind furniture'), cover2: K('반짝이는 곳을 꾹 누르고 있으면 거기로 가', 'Hold the glowing spot to walk there'),
  safe: K('가구 뒤는 엄마 눈에 안 보여', "Mom can't see you behind furniture"), back: K('가구 뒤로 돌아가기', 'Get back behind the furniture'),
  wait: K('엄마가 돌아봐! 가구 뒤에서 기다리기', "Mom's turning! Stay hidden"),
  hide: K('얼른 가구 뒤로!', 'Quick, behind the furniture!'), still: K('보이는 데선 멈춰도 들켜! 가구 뒤로', "Freezing won't fool Mom! Hide!"),
  phew: K('휴~ 안 들켰다!', 'Phew! Not spotted!'), now: K('지금이야! 엄마가 다시 TV 봐', "Now! Mom's watching TV again"),
  go: K('엄마가 TV 볼 때 냉장고 쪽으로', 'TV time! Sneak to the fridge'), edge: K('엄마가 돌아볼 때까지 여기서 기다리기', 'Wait here until Mom turns'),
  away: K('지금이야! 엄마가 딴 데 봐', "Now! Mom's looking away"),
  open: K('냉장고를 톡 해서 열기', 'Tap the fridge to open it'), open2: K('냉장고 문을 손가락으로 한 번 톡!', 'Tap the fridge door once!'),
  grab: K('냉장고를 꾹 눌러 간식 꺼내기', 'Hold the fridge to grab a snack'), grab2: K('냉장고에서 손가락을 떼지 말고 꾹', 'Keep holding the fridge!'),
  shut: K('불빛이 보여! 냉장고를 톡 해서 닫기', "Light's showing! Tap to close it"),
  home: K('방문으로 돌아가기', 'Back to your room'),
  safeTag: K('안전', 'Safe'), seenTag: K('보여', 'Seen'),
};
// ── 🆕 cards: a new mechanic, gained the first time you run into it (메모리 teach-by-acquisition)
const CARDS = {
  pad: { t: K('열쇠 자물쇠', 'Key Lock'), s: [['🔒', K('자물쇠가 보이면', 'Spot a lock')], ['🔑', K('방에서 열쇠를 찾아서', 'Find the key')], ['👆', K('자물쇠를 톡', 'Tap the lock')]] },
  code: { t: K('비밀번호 금고', 'Code Safe'), s: [['🔢', K('금고가 보이면', 'Spot a safe')], ['📝', K('숫자 쪽지를 찾아서', 'Find the code note')], ['👆', K('금고를 톡', 'Tap the safe')]] },
  color: { t: K('색깔 자물쇠', 'Color Lock'), s: [['🎨', K('색깔 자물쇠가 보이면', 'Spot a color lock')], ['🃏', K('색깔 순서 카드를 찾아서', 'Find the color card')], ['👆', K('자물쇠를 톡', 'Tap the lock')]] },
  lever: { t: K('쇠사슬', 'Chains'), s: [['⛓️', K('쇠사슬이 감겨 있으면', 'Spot chains')], ['🔴', K('벽의 빨간 레버를 찾아서', 'Find the red lever on a wall')], ['👆', K('레버를 톡', 'Tap the lever')]] },
  treat: { t: K('버티는 친구', "Won't Budge"), s: [['😾', K('누가 길을 막고 있으면', 'Spot someone in the way')], ['🐟', K('좋아하는 간식을 찾아서', 'Find their favorite snack')], ['👆', K('그 친구를 톡', 'Tap them')]] },
  chain: { t: K('연쇄 장치', 'Domino Gadgets'), s: [['🧩', K('하나를 풀면', 'Solve one thing')], ['⚙️', K('다음 장치가 움직여', 'The next one moves')], ['👀', K('방이 바뀌는 걸 잘 봐', 'Watch the room change')]] },
};
K('새로 얻었다!', 'New card!'); K('알겠어!', 'Got it!');
// the 🆕 cards for the diary's '배운 것' page: every card, and whether it's been gained yet
export const learnedCards = G => Object.entries(CARDS).map(([k, c]) => ({ k, t: c.t, s: c.s, have: !!G.save.cards?.[k] }));

// ── a gift is the friend's seat at your place (원칙 2: "네 방에 둬. 내가 가면 앉게."): when it's out in the room, that
// friend comes by, goes to it and says so. top: where they sit on it (local to the piece); none = they stand at its front.
const SEATS = {
  cattower: { who: 'cat', top: [-.02, 1.38, -.2], say: K('내 자리, 그대로네.', 'You kept my spot.'), mong: K('꼭대기 비워 뒀어.', 'Kept the top free.') },
  kotatsu: { who: 'bunny', say: K('내 자리 남겨 뒀네! …안 웃을게.', "You saved my spot! …I won't giggle."), mong: K('…벌써 웃잖아.', "…You're already giggling.") },
  tteokstall: { who: 'grumpy', say: K('…의자 두 개, 그대로네. 한 판만 앉았다 갈게.', "…Still two stools. I'll sit for one game."), mong: K('시간은 많잖아.', "You've got time.") },
  snackcart: { who: 'sundae', say: K('간식 카트 잘 있네! 오늘 건 내가 채워 왔어.', "The snack cart's still here! I brought today's refill."), mong: K('…체리는 내 거.', "…The cherry's mine.") },
  bench2: { who: 'squirrel', top: [0, .44, -.16], say: K('벤치 그대로네. 밑에 도토리 숨겨 놨어.', 'You kept the bench. I hid acorns under it.'), mong: K('…어디 숨겼는지는 기억나?', '…Remember where?') },
  lantern: { who: 'panda', say: K('랜턴, 아직 켜 두는구나.', 'You still keep the lantern lit.'), mong: K('…누가 올지 모르니까.', '…In case someone comes.') },
  recordcab: { who: 'nerd', say: K('레코드장 잘 있군. 맨 아래 칸에 새 퍼즐 넣어 뒀지.', "The cabinet's still here. New puzzle in the bottom drawer."), mong: K('…찾아볼게.', "…I'll find it.") },
};
// the seats out in this room: only a piece the friend really gave you (its boss story done) — a kotatsu from the shop is
// just a kotatsu. Positions are in the room group's space (the visitors walk in it).
export function giftSeats(G, room) {
  const done = G.save.storyDone || {}, out = [];
  room.group.updateMatrixWorld(true);
  for (const r of room.furns || []) {
    const S = SEATS[r.type];
    if (!S || out.some(o => o.who === S.who) || !BOSS.some(b => b.reward?.furn === r.type && done[b.id])) continue;
    const g = r.f.group, st = room.frontOf(r.f), top = S.top ? room.group.worldToLocal(g.localToWorld(new THREE.Vector3(...S.top))) : null;
    out.push({ who: S.who, type: r.type, stand: [st.x, st.z], top, at: [g.position.x, g.position.z], say: S.say, mong: S.mong });
  }
  return out;
}

// ── 몽글이's play diary (도감 카드 → 크게 보기): one line per friend — the tell you catch them by, and what you two promised
const DIARY = {
  mong: K('나. 본 건 다 적어 둠.', 'Me. I write down everything I see.'),
  bunny: K('웃음을 못 참음. 다음엔 진짜 안 웃기로 약속.', "Can't hold in a giggle. Promised: no giggling next time."),
  bear: K('기다리다 잠듦. 숟가락은 꼭 두 개 챙김.', 'Falls asleep waiting. Always brings two spoons.'),
  frog: K('거품 때문에 들킴. 지면 꼭 "한 판 더".', 'Bubbles give Froggy away. Loses? "One more round."'),
  nerd: K('퍼즐 자랑하다 힌트를 흘림. 다음 퍼즐은 나만을 위해.', 'Drops hints while showing off. Next puzzle: just for me.'),
  peng: K('추우면 덜덜. 1등 비결이 만날 때마다 하나씩 늘어남.', 'Shivers in the cold. One more pro tip every time.'),
  cat: K('꼬리는 못 숨김. 캣타워 꼭대기는 냥냥이 자리.', "Can't hide that tail. The top of the cat tower is Nyannyan's."),
  shiba: K('조용히 해도 꼬리가 먼저 움직임. 순찰은 같이.', 'Stays quiet, but the tail moves first. We patrol together.'),
  grumpy: K('"한 판만"이라면서 다음 판을 준비해 둠. 내일도 이 시간.', 'Says "one game," has the next one ready. Same time tomorrow.'),
  squirrel: K('뭐든 다 숨김. 오늘 먹을 도시락까지.', "Hides everything. Even today's lunch."),
  hamster: K('볼이 빵빵해서 들킴. 씨앗은 비상식량.', 'Full cheeks give Hammy away. Seeds are emergency rations.'),
  sundae: K('녹기 전에 찾아 줘야 함. 같이 먹을 간식은 늘 준비.', 'Find Parfait before the melting starts. Always has snacks for two.'),
  skater: K('보드랑 한 몸. 바퀴 색이 돌아오면 제일 신남.', 'Never without the board. Happiest when the wheels get their color back.'),
  panda: K('대나무 씹는 소리로 들킴. 천천히 와도 기다려 줌.', 'Bamboo munching gives Panda away. Waits for me, however slow.'),
  sleepy: K('코 고는 소리로 들킴. 끝나면 깨워서 같이 돌아가기.', 'Snoring gives Dozy away. Wake Dozy at the end, walk home together.'),
  robot: K('삐빅 소리로 들킴. 같이 간 기록은 지우지 않음.', 'Beeps give Cubebot away. Never deletes a trip together.'),
  raccoon: K('자랑하다 들킴. 지면 "봐준 거야".', 'Gets caught bragging. Loses? "I went easy on you."'),
  dj: K('숨어도 베이스 소리가 남. 새 곡은 내가 제일 먼저 듣기.', 'Still loud while hiding. I hear every new track first.'),
  trickster: K('내가 숨긴 걸 몰래 딴 데 옮김. 눈 떼지 말 것.', 'Sneaks my hidden things somewhere else. Keep an eye out.'),
  inky: K('색 묻은 발자국을 남김. 다음엔 같이 놀기.', 'Leaves colored footprints. Next time, we play together.'),
};
export const diaryLine = k => DIARY[k] || null;
export const BOOK = { diary: K('몽글이 일기장', "Mongle's diary"), learned: K('배운 것', 'What I Learned'), notYet: K('판에서 처음 만나면 얻어', 'Find one in a stage to unlock') };
export const UI = { homeHide: K('내 집에서 숨겨 보기', 'Hide something at home'), keepGoing: K('계속 찾기', 'Keep searching'), homeHideEnd: K('내 집에서 숨기기', 'Hide something at home'), keepPlaying: K('계속 놀기', 'Keep playing') };

// ── binding: walk the campaign once (after the themes are registered) and pin every scene / boss story / count
const typeOf = s => s.tut === 1 ? 'tut1' : s.tut === 2 ? 'tut2' : s.boss ? 'boss' : s.timed ? 'timed' : s.gray ? 'gray' : s.incident ? 'incident' : 'hidden';   // hidden = 숨은그림 판
let B = null;
function bind() {
  if (B) return B;
  B = { scene: {}, host: {}, meet: {}, fmeet: {}, gray: {}, timed: {}, type: {} };
  const specs = []; for (let i = 0; i < STAGE_COUNT; i++) specs.push(stageSpec(i));
  const used = new Set(), met = {}, fmet = {}, gown = {}; let g = 0, t = 0; B.grayOwn = {};
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i], ty = typeOf(s); B.type[i] = ty;
    const pick = t => SCENES.find(x => !used.has(x.id) && x.type === t && x.room === s.room && (x.night == null || !!s.night === x.night));
    const sc = pick(ty);
    if (sc) { used.add(sc.id); B.scene[i] = sc; }
    // a visit told the other way (사건 ↔ 숨은그림) is used up with it, so it can't land on a later visit to the same map
    if (ty === 'hidden' || ty === 'incident') { const tw = pick(ty === 'hidden' ? 'incident' : 'hidden'); if (tw) used.add(tw.id); }
    const th = THEMES[s.room] || layoutFor(s.room)?.theme;
    const host = sc?.host || (s.timed ? 'raccoon' : th?.friend);
    B.host[i] = host;
    if (ty === 'incident' || ty === 'tut1') { B.fmeet[i] = fmet[host] || 0; fmet[host] = (fmet[host] || 0) + 1; }
    if (ty === 'incident' || ty === 'hidden' || ty === 'tut1' || ty === 'tut2') { B.meet[i] = met[host] || 0; met[host] = (met[host] || 0) + 1; }
    if (ty === 'gray') { B.gray[i] = g++; B.grayOwn[i] = gown[host] = (gown[host] ?? -1) + 1; }
    if (ty === 'timed') B.timed[i] = t++;
  }
  // 먹물이's phase: a voice the first time, then caught again, quiet from the camp on, helping once the talk is behind you
  const R = id => REGIONS.find(r => r.id === id)?.from ?? 999;
  const roof = Object.keys(B.scene).find(i => B.scene[i].id === 'office');
  B.inky = i => (roof != null && i > +roof) ? 3 : !B.gray[i] ? 0 : i < R('camp') ? 1 : 2;   // the first 흑백판 only hears it
  // boss stories onto the first boss stage of their map (roadmap.js and the planner read STORIES by stage index)
  for (const k of Object.keys(STORIES)) delete STORIES[k];
  for (const S of BOSS) { const i = specs.findIndex((s, j) => s.boss && s.room === S.room && !STORIES[j]); if (i >= 0) STORIES[i] = S; }
  for (const [id, r] of Object.entries(REGION)) if (REGION_INTRO[id]) Object.assign(REGION_INTRO[id], r);
  // "토순이 찾기" for every friend (the banner's goal line)
  for (const [k, d] of Object.entries(CHAR_DEFS)) if (d?.name) K(`${d.name} 찾기`, `Find ${EN[d.name] || d.name}`);
  return B;
}
setStoryBinder(bind);

// ── what a stage scene asks for
export const sceneAt = idx => (idx >= 0 ? bind().scene[idx] || null : null);
export const hostAt = idx => (idx >= 0 ? bind().scene[idx]?.host || null : null);
export const goalLine = kind => K(`${CHAR_DEFS[kind]?.name || '친구'} 찾기`);
// before a 사건 판: the scene's lines, else the host's intro for this meeting (first, then the others in turn)
export function incidentIntro(idx, host) {
  const sc = sceneAt(idx); if (sc?.intro) return sc.intro;
  const F = fr(host), n = bind().meet[idx] || 0, list = F.intro.filter(x => x.length);
  if (!list.length) return [];
  return as(list[turn(n, list.length)] || list[0], host);
}
// when found: the scene's lines, else the reveal paired with this meeting's intro (or the host's usual one)
export function incidentReveal(idx, host) {
  const sc = sceneAt(idx); if (sc?.reveal) return sc.reveal;
  const F = fr(host), n = bind().meet[idx] || 0, R = F.reveals;
  return as((R && R[turn(n, R.length)]) || F.found, host);
}
// a 사건 판 that fell back to a find-the-things stage (no big furniture to hide in): the host says so, no hiding lines
const FALLBACK = {
  shiba: L('shiba', '킁. 순찰 마지막 코스! 오늘은 내가 간식을 숨겼어. 찾아 봐!', 'Sniff. Last stop on patrol! Today I hid the snacks. Find them!'),
  robot: L('robot', '삐빅. 숨바꼭질 대신 보물찾기 실행. 부품 숨김 완료.', 'BEEP. Running treasure hunt instead of hide-and-seek. Parts hidden.'),
};
export const fallbackIntro = host => [FALLBACK[host] || L(host || 'bunny', '오늘은 숨바꼭질 말고 보물찾기! 내 물건 찾아 줘.', 'No hiding today. Treasure hunt! Find my stuff.')];
// ── 숨는 버릇 (레벨 보고서 R2, 10/18): the friend lets its habit slip as it runs to hide (once a stage). HABIT_LINE is the
// 도감 card's '숨는 버릇' line. Candidate weights live in the stage code; these only say it.
const HABIT_HIDE = {
  bunny: [K('폭신한 데가 최고야~ …방금 거 못 들었지?', "Fluffy spots are the best~ …You didn't hear that, right?")],
  bear: [K('으헤헤, 맛있는 냄새 나는 데로 가야지~', "Ehehe, I'll go wherever smells tasty~")],
  frog: [K('개굴! 물가가 최고지~ …아, 말해 버렸다.', 'Ribbit! Nothing beats the water~ …Oops, I said it.'), K('개굴~ 시원한 데로 간다~', 'Ribbit~ Off somewhere cool~')],
  nerd: [K('흠. 책 냄새 나는 곳이 제일 편하지.', 'Hm. Anywhere that smells like books is the comfiest.')],
  peng: [K('펭! 차가운 데가 최고야. …비결 아니야!', "Peng! Cold spots are the best. …That's not a tip!")],
  cat: [K('흥. 높은 데가 내 자리다냥.', 'Hmph. Up high is my spot, meow.')],
  shiba: [K('킁킁… 냄새 좋은 데 찾았다! 아니, 숨는다!', 'Sniff sniff… found a great smell! I mean, hiding!'), K('킁. 이번엔 냄새 나는 데 안 가. …아마.', 'Sniff. Not going anywhere smelly this time. …Probably.')],
  grumpy: [K('…구석이 편해. 그게 다야.', "…Corners are comfy. That's all.")],
  hamster: [K('웁! 좁고 어두운 데… 근데 무서운데…', 'Mmf! Somewhere small and dark… but that\'s scary…')],
  sundae: [K('바람 솔솔 부는 데가 좋아. 안 녹게~', "Somewhere breezy. So I don't melt~")],
  squirrel: [K('도토리 묻은 데 근처가 좋아… 어디였더라?', 'Near where I buried my acorns… where was that?')],
  panda: [K('초록초록한 데가 마음이 편해.', 'Somewhere green feels like home.'), K('나무 냄새 나는 데… 아니, 비밀.', "Somewhere that smells like wood… no, that's a secret.")],
  sleepy: [K('음냐… 잠들기 좋은 데로…', 'Mmh… somewhere good for a nap…')],
  robot: [K('삐빅. 기계 사이 은신 모드.', 'BEEP. Engaging hide-among-machines mode.')],
  dj: [K('둠칫… 스피커 옆이 제일 편해. 쉿!', 'Boom-chk… right by the speakers is comfiest. Shh!')],
  skater: [K('요! 보드 탈 데 근처에 있을게!', "Yo! I'll be near somewhere I can ride!")],
};
export const HABIT_LINE = {
  bunny: K('폭신한 곳에 잘 숨어', 'Hides somewhere fluffy'), bear: K('먹을 것 근처에 잘 숨어', 'Hides near food'),
  frog: K('물가나 시원한 곳에 잘 숨어', 'Hides near water or somewhere cool'), nerd: K('책 근처에 잘 숨어', 'Hides near books'),
  peng: K('차가운 곳에 잘 숨어', 'Hides somewhere cold'), cat: K('높은 곳이나 상자에 잘 숨어', 'Hides up high or in boxes'),
  shiba: K('냄새 나는 곳에 잘 숨어', 'Hides somewhere smelly'), grumpy: K('구석진 곳에 잘 숨어', 'Hides in out-of-the-way corners'),
  hamster: K('좁고 어두운 곳에 잘 숨어', 'Hides in small, dark spots'), sundae: K('바람 잘 드는 곳에 잘 숨어', 'Hides somewhere breezy'),
  squirrel: K('먹이 숨긴 곳 근처에 잘 숨어', 'Hides near its food stash'), panda: K('초록빛이나 나무 근처에 잘 숨어', 'Hides near green things or wood'),
  sleepy: K('잠들기 좋은 곳에 잘 숨어', 'Hides anywhere good for a nap'), robot: K('기계 사이에 잘 숨어', 'Hides among machines'),
  dj: K('스피커 옆에 잘 숨어', 'Hides right by the speakers'), skater: K('보드 탈 수 있는 곳 근처에 잘 숨어', 'Hides near anywhere you can ride'),
  raccoon: K('가짜들 사이에 잘 숨어', 'Hides among decoys'), inky: K('눈에 띄는 데 숨고, 찾아 주길 기다려', 'Hides in plain sight, hoping someone will look'),
};
export const hideLine = (idx, host) => { const H = HABIT_HIDE[host]; return sceneAt(idx)?.hide || (H ? H[(bind().fmeet[idx] || 0) % H.length] : fr(host).hide); };
// bubbles from the hideout: 'clue' (you found something), 'lock' (you touched the locked door), 'stuck' (a while, nothing)
export const hidePool = (idx, host, kind) => sceneAt(idx)?.[kind] || fr(host)[kind] || ANY[kind];
// 흑백판
export const grayPhase = idx => bind().inky(idx);
const inkyV = (idx, what) => { const p = grayPhase(idx), g = bind().gray[idx] || 0, all = [INKY[p][what], ...INKY_V[p][what]]; return all[g % all.length]; };
export function grayIntro(idx, owner, villain) {
  const sc = sceneAt(idx), b = bind(), g = b.gray[idx] || 0, k = b.grayOwn[idx] || 0, inky = sc?.inky || inkyV(idx, 'intro');
  if (sc?.intro) return villain && !sc.intro.some(l => l.who === 'inky') ? [...sc.intro, L('inky', inky)] : sc.intro;
  // the owner in their own voice (first time, second time), else a plain line; 몽글이 says the rule the first few times
  const own = GRAY_BY[owner]?.[k] || GRAY_OWNER[g % GRAY_OWNER.length], out = [L(owner, own), L('mong', g <= 2 ? GRAY_MONG : GRAY_MONG2[g % 2])];
  if (villain) out.push(L('inky', inky));
  return out;
}
export const inkyTaunt = (idx, kind) => INKY[grayPhase(idx)][kind] || null;
export const inkyCaught = idx => sceneAt(idx)?.caught || inkyV(idx, 'caught');
// 먹물이 stays to talk (빌딩 흑백판) and, after that, stays as a friend — no more running off
export const inkyStays = idx => sceneAt(idx)?.id === 'office' || grayPhase(idx) === 3;
export const sceneAfter = idx => sceneAt(idx)?.after || (bind().type[idx] === 'hidden' ? [L(bind().host[idx] || 'bunny', HID_ANY.after)] : null);

// ── 엿보는 친구 (hunt.js CAMEO, 검토 세션 10/18): the host of a stage still to come, peeking from behind furniture; find it
// and it says one line. Before you've met them: a shy hello. After: a friend's tease. 먹물이 has its own three, by the story.
const CAMEO = {   // a: before you've met them (a shy hello) · b: after (a friend's tease); each list takes turns
  bunny: { b: [K('킥, 들켰다! 다음 판은 나랑 놀자!', 'Hee, busted! Play with me next round!'), K('푸핫, 엿보다 웃음이 나서 들켰어!', 'Pfft, I giggled while peeking and got caught!'), K('킥… 이번엔 안 웃었는데!', "Hee… I didn't even giggle this time!")] },
  bear: { a: [K('으헤헤… 몰래 보고 있었어. 나 곰돌이야.', "Ehehe… I was watching. I'm Bearie.")], b: [K('으헤헤, 들켰다. 다음엔 나랑 놀자!', 'Ehehe, busted. Play with me next!'), K('으헤헤… 엿보다 졸았어.', 'Ehehe… I dozed off peeking.'), K('으헤헤, 꿀 냄새 때문에 들켰나?', 'Ehehe, was it the honey smell?')] },
  frog: { a: [K('개굴! 들켰다~ 난 개굴이. 낚시터 챔피언!', "Ribbit! Busted~ I'm Froggy. Fishing champ!")], b: [K('개굴! 들켰다~ 다음 판은 내 차례!', "Ribbit! Busted~ Next round's mine!"), K('개굴! 엿보기도 챔피언인 줄 알았는데!', 'Ribbit! I thought I was the peeking champ too!')] },
  nerd: { a: [K('흠. 관찰력이 좋군. 언제 내 서재로 와 보게.', 'Hm. Sharp eyes. Drop by my study sometime.')], b: [K('흠. 관찰력은 여전하군.', 'Hm. Sharp as ever.'), K('흠. 엿보기도 계산했는데. 변수는 너야.', "Hm. I calculated the peek too. You're the variable."), K('흠. …사실 찾아 주길 바랐어.', "Hm. …Truth is, I hoped you'd find me.")] },
  peng: { a: [K('펭! 몰래 구경 중이었어. 나는 동네 숨기 2등!', "Peng! Just watching. I'm the town's second-best hider!")], b: [K('펭! 엿볼 땐 숨도 참았는데…', 'Peng! I even held my breath while peeking…'), K('펭! 비결 노트에 적어야지. 「엿보기 금지.」', "Peng! Into the tip notebook: 'No peeking.'")] },
  cat: { a: [K('흥. 그냥 지나가던 거다냥.', 'Hmph. Just passing by.')], b: [K('흥. 또 지나가던 거다냥.', 'Hmph. Just passing by. Again.')] },
  shiba: { a: [K('킁! 잠복 중이었는데… 들켰다. 난 멍뭉이 순경!', "Sniff! I was on stakeout… busted. I'm Officer Woofy!")], b: [K('킁! 잠복 실패. 순찰 같이 가자!', 'Sniff! Stakeout failed. Come on patrol!'), K('킁! 꼬리가 또 나와 있었어?', 'Sniff! Was my tail sticking out again?')] },
  grumpy: { a: [K('…뭘 봐. 그냥 있던 거야.', '…What? I was just standing here.')], b: [K('…뭘 봐. 우리 골목 오든가.', '…What? Come to my alley, then.'), K('…엿본 거 아니야. 경치 본 거야.', "…I wasn't peeking. I was enjoying the view.")] },
  hamster: { a: [K('웁! 볼 때문에 들켰어! 난 햄찌야.', "Mmf! My cheeks gave me away! I'm Hammy.")], b: [K('웁! 또 볼 때문에…!', 'Mmf! My cheeks again…!')] },
  sundae: { a: [K('앗, 녹기 전에 들켰다! 난 파르페야.', "Oh, busted before I melted! I'm Parfait."), K('앗, 들켰다! 이따 빨래방에서 봐!', 'Oh, busted! See you at the laundromat!')], b: [K('앗, 또 들켰다! 녹기 전에 놀자!', "Oh, busted again! Let's play before I melt!")] },
  squirrel: { a: [K('헉, 도토리 줍다 들켰어! 난 다람이.', "Eek, caught picking up acorns! I'm Chippy.")], b: [K('헉, 또 들켰다! 도토리 하나 줄게.', 'Eek, busted again! Have an acorn.')] },
  panda: { a: [K('천천히 와. 산에서 기다릴게.', "Take your time. I'll wait on the mountain.")], b: [K('들켰다. 천천히 찾아도 되는데.', 'Busted. You could have taken your time.'), K('들켰네. 엿보는 것도 고수인데.', "Busted. And I'm a pro at peeking, too.")] },
  sleepy: { a: [K('음냐… 여기서 자다 들켰네…', 'Mmh… caught napping here…')], b: [K('음냐… 또 자다 들켰네…', 'Mmh… caught napping again…')] },
  robot: { a: [K('삐빅. 관찰 결과: 들킴.', 'BEEP. Observation: spotted.')], b: [K('삐빅. 숨기 성공률 0% 갱신.', 'BEEP. Hiding success rate: still 0%.')] },
  dj: { a: [K('둠칫! 비트 맞추다 들켰다!', 'Boom-chk! Caught mid-beat!'), K('둠칫! 볼륨 낮췄는데 들켰다!', 'Boom-chk! Turned the volume down and still got caught!')], b: [K('둠칫! 다음 무대에서 보자!', 'Boom-chk! See you at the next show!')] },
  skater: { a: [K('요! 다음엔 파크로 와!', 'Yo! Hit the park next!')], b: [K('요! 또 들켰네. 보드 타러 와!', 'Yo! Busted again. Come ride!')] },
  raccoon: { b: [K('히히, 들켰네~ 다음 판은 시간 재기다!', 'Hee-hee, you caught me~ Next round, we race the clock!')] },
};
const CAMEO_INKY = [K('…킥. 나도 숨는 거 잘해.', "…Heh. I'm good at hiding too."), K('…엿보는 것까지 찾아? 이상한 애.', '…You even find the ones peeking? Weird kid.'), K('…다음엔, 나도 끝까지 찾아 줄 거야?', '…Next time, will you look for me till the end too?')];
const CAMEO_ANY = K('들켰다! 다음에 또 보자!', 'Busted! See you next time!');
// n = how many times this friend has peeked before (hunt.js counts it), so the same friend doesn't say the same thing twice
export function CAMEO_LINE(kind, idx = 0, n = 0) {
  const R = id => REGIONS.find(r => r.id === id)?.from ?? 999;
  if (kind === 'inky') return CAMEO_INKY[idx < R('park') ? 0 : idx < R('camp') ? 1 : 2];
  const C = CAMEO[kind]; if (!C) return CAMEO_ANY;
  const b = bind(), met = Object.keys(b.host).some(j => +j <= idx && b.host[j] === kind);
  const list = (met ? C.b : C.a) || C.b || C.a;
  return list[n % list.length];
}

// ── 숨은그림 판 (stage.js calls these): the host's opening talk, the banner, and four bubbles while you look
const HID_ANY = {
  intro: K('오늘은 숨바꼭질 말고 보물찾기! 내 물건 찾아 줘.', 'No hiding today. Treasure hunt! Find my stuff.'),
  first: K('벌써 하나 찾았어?', 'Found one already?'), half: K('반이나 찾았네!', "That's half of them!"), last: K('하나 남았어!', 'Just one left!'),
  after: K('다 찾았다! 고마워, 몽글아.', 'All found! Thanks, Mongle.'),
};
export const isHidden = idx => bind().type[idx] === 'hidden';
export const hiddenIntro = (idx, host) => sceneAt(idx)?.intro || [L(host || bind().host[idx] || 'bunny', HID_ANY.intro)];
// which: 'first' (the first find) · 'half' (found reaches half) · 'last' (exactly one left) — say it as the host's bubble
export const hiddenSay = (idx, host, which) => sceneAt(idx)?.say?.[which] || HID_ANY[which] || null;
// the banner when the scene names the things ("이삿짐 속 물건 8개를 찾아라!"); null = the usual "X가 숨긴 물건 N개를 찾아라!"
export function hiddenGoal(idx, n) {
  const g = sceneAt(idx)?.goal; if (!g) return null;
  return K(`${g[0]} ${n}개를 찾아라!`, `Find the ${n} ${g[1]}!`);
}
// 너굴이
export const timedIntro = idx => ROCKY[Math.min(ROCKY.length - 1, bind().timed[idx] || 0)];
export const timedWin = idx => [L('raccoon', ROCKY_WIN[(bind().timed[idx] || 0) % ROCKY_WIN.length])];
// boss games
export const gameLines = (kind, lv) => GAME[`${kind}:${lv}`] || null;

// ── 1판: a fixed little scene instead of a random room (GPT 첫판 안): 토순이 hides in the toy box, drops her donut on the way;
// the box stands with its front away from you, so turning the room is how you see her tail sticking out.
export function firstLayout(Lay) {
  // (2,4): in the open by the rug, clear of the loft ladder, its front turned to the back wall
  return { ...Lay, furniture: Lay.furniture.map(f => (f.type === 'chest' ? { ...f, i: 2, j: 4, rot: 2 } : f)) };
}
export function planFirst(room, spec) {
  const box = room.parts.find(p => p.furn.type === 'chest' && p.spots.length);
  if (!box) return null;
  const W = new THREE.Vector3(), at = s => (room.spotWorld ? W.copy(room.spotWorld(s)) : s.anchor?.getWorldPosition?.(W), W), front = s => { const p = at(s); return p.x + p.z; };
  const fits = s => (0.17 <= s.maxH + .001);
  const cands = room.spots.filter(s => s.kind === 'on' && !s.part && !s.reserved && fits(s));
  // dropped on the floor or the rug as she ran (not on top of a plant pot), the nearest to you
  const low = cands.filter(s => at(s).y < .35);
  (low.length ? low : cands).sort((a, b) => front(b) - front(a));
  const ds = (low.length ? low : cands)[0];
  if (!ds) return null;
  return { targets: ['friendtoken'], placements: [{ type: 'friendtoken', spot: box.spots[0], role: 'target' }, { type: 'donut', spot: ds, role: 'clue' }],
    locks: [], light: null, tv: null, rotSeed: rng(spec.seed || 1), incident: { part: box, lock: null }, first: { box } };
}
// a little white tail poking out of the front of the box (seen only from the front)
export function boxTail(part) {
  const g = part.furn.group, b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  const q = new THREE.Quaternion(); g.getWorldQuaternion(q);
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q); f.y = 0; f.normalize();
  const depth = Math.abs(f.x) > Math.abs(f.z) ? sz.x : sz.z;
  const t = put(sph(.075, '#ffffff'), c.x + f.x * (depth / 2 + .03), b.min.y + sz.y * .42, c.z + f.z * (depth / 2 + .03));
  t.userData.noPick = true;
  return { mesh: t, front: f, center: c };
}

// ── small UI pieces: the 🆕 card, a two-way choice, the ending card
let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `.ncard{pointer-events:auto;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(42,26,61,.45);z-index:60;animation:pop .3s}
.ncard .nc{background:#fffaf2;border:4px solid #fff;border-radius:26px;box-shadow:0 8px 0 rgba(42,26,61,.35);padding:18px 20px 16px;width:min(340px,calc(100vw - 32px));box-sizing:border-box;text-align:center;color:#3b2a55}
.ncard .nk{display:inline-block;background:#ff6f91;color:#fff;border-radius:999px;padding:3px 12px;font-size:15px;margin-bottom:6px}
.ncard .nt{font-size:26px;margin-bottom:10px}
.ncard .ns{display:flex;align-items:center;gap:10px;text-align:left;font-size:18px;padding:7px 4px;border-top:2px dashed #f1e2d0}
.ncard .ns b{font-size:26px;width:36px;text-align:center}
.ncard .nb{margin-top:12px;background:#7ad37a;color:#fff;border-radius:18px;padding:10px 0;font-size:20px;box-shadow:0 4px 0 #4f9d55;cursor:pointer}
.chooser{pointer-events:auto;position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:60}
.chooser .cb{min-width:min(300px,calc(100vw - 48px));padding:13px 18px;border-radius:20px;background:#fff;color:#3b2a55;font-size:20px;border:3px solid #3b2a55;box-shadow:0 5px 0 rgba(42,26,61,.4);text-align:center;cursor:pointer}
.chooser .cb.main{background:#ff8fb0;color:#fff;border-color:#fff}
.endcard{pointer-events:auto;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,14,34,.82);color:#fff;font-size:24px;text-align:center;padding:0 28px;z-index:61;opacity:0;transition:opacity .8s;line-height:1.45;word-break:keep-all}
.ncard .ns span,.chooser .cb{word-break:keep-all}`;
  document.head.append(s);
}
export function newCard(G, kind) {
  const C = CARDS[kind]; if (!C || G.bot || G.skipTalk) return Promise.resolve();
  const seen = G.save.cards || (G.save.cards = {});
  if (seen[kind]) return Promise.resolve();
  seen[kind] = true; G.persist?.(); style();
  return new Promise(res => {
    const ok = h('div', { class: 'nb' }, tr('알겠어!'));
    const root = h('div', { class: 'ncard' }, h('div', { class: 'nc' }, h('div', { class: 'nk' }, tr('새로 얻었다!')), h('div', { class: 'nt ol' }, tr(C.t)),
      ...C.s.map(([e, t]) => h('div', { class: 'ns' }, h('b', {}, e), h('span', {}, tr(t)))), ok));
    root.addEventListener('pointerdown', e => e.stopPropagation());
    ok.addEventListener('pointerup', e => { e.stopPropagation(); G.audio?.sfx?.('click'); root.remove(); res(); });
    document.getElementById('overlay').append(root);
    G.audio?.sfx?.('special');
  });
}
export function choose(G, opts) {
  style();
  return new Promise(res => {
    if (G.bot) return res(opts.length - 1);
    const root = h('div', { class: 'chooser' });
    opts.forEach((o, i) => { const b = h('div', { class: 'cb' + (i === 0 ? ' main' : '') }, tr(o)); b.addEventListener('pointerup', e => { e.stopPropagation(); G.audio?.sfx?.('click'); root.remove(); res(i); }); root.append(b); });
    root.addEventListener('pointerdown', e => e.stopPropagation());
    document.getElementById('overlay').append(root);
  });
}
export function endCard(G) {
  style();
  return new Promise(res => {
    const root = h('div', { class: 'endcard ol' }, tr(ENDING_CARD));
    document.getElementById('overlay').append(root);
    requestAnimationFrame(() => { root.style.opacity = '1'; });
    const done = () => { root.style.opacity = '0'; setTimeout(() => { root.remove(); res(); }, 600); };
    const t = setTimeout(done, G.bot ? 10 : 3200);
    root.addEventListener('pointerup', e => { e.stopPropagation(); clearTimeout(t); done(); });
  });
}

// ── 영어 이름 통일 (10/18 영어 리뷰): the dictionary still had Shiba / Sleepy / Boomy / Bunny / Pengu / Kitty for the friends
// in a few places — one name each, as everywhere else (Woofy, Dozy, DJ Bop, Bunbun, Pengpeng, Nyannyan)
K('졸졸이 코풍선', "Dozy's Nose Bubble"); K('멍뭉이 어질어질', 'Dizzy Woofy'); K('펭펭이네 2층집 · 계단도 있어!', "Pengpeng's two-story house · with stairs!");
K('토순이랑 단짝 · 바로 옆집이 좋아요', "Bunbun's bestie · wants to be next door"); K('단짝 토순이·곰돌이까지 여섯 집!', 'Six homes, plus besties Bunbun & Bearie!');
K('판다랑 멍뭉이도 이사 왔어요', 'Panda and Woofy moved in too'); K('토순아, 반가워!', 'Hi, Bunbun!'); K('졸졸이가 헤드폰을 끼고 잔다…', "Dozy's napping with headphones on…");
K('졸졸이 방', "Dozy's Room"); K('멍뭉이가 자고 있어. 뛰면 깨!', "Woofy's asleep. Don't run!");
K('멍뭉이 순경의 파출소 앞', "Outside Officer Woofy's Police Station"); K('멍뭉이 순경의 파출소', "Officer Woofy's Police Station"); K('토순이네 교실', "Bunbun's Classroom");
K('멍뭉이네 마당 2층집', "Woofy's House with a Yard"); K('토순이랑 단짝 · 바로 옆방이 좋아요', "Bunbun's bestie · wants the room next door");
K('판다랑 멍뭉이도 체크인했어요', 'Panda and Woofy checked in too'); K('단짝 토순이·곰돌이까지 방이 꽉 찼어요!', "Every room's taken, besties Bunbun & Bearie too!");
K('둠칫이가 또 왔어요… 이번엔 여섯 명!', "DJ Bop's back… six guests this time!"); K('손전등 술래', 'Flashlight Tag'); K('손전등 술래 · 보스', 'Flashlight Tag · Boss');
// 흑백판·보스판 배너: 숨긴 건 그 판 친구가 아님 (3차 리뷰) — stage.js banner
for (let n = 1; n <= 12; n++) { K(`숨겨진 물건 ${n}개를 찾아 색을 되찾아라!`, `Find the ${n} hidden things to bring the colors back!`); K(`숨겨진 물건 ${n}개를 찾아라!`, `Find the ${n} hidden things!`); }
K('억울해! 난 그냥 여기 숨어 있었다고!', 'Not fair! I was just hiding in here!'); K('진짜 도둑은 그 까만 애라니까~!', "The real thief is that inky kid, I'm telling you~!"); K('드디어 자유다~! 범인은 그 까만 애야!', "Free at last~! The culprit's that inky kid!");
// 파자마 파티 순서 안내 (사용자 10/18) — bosses/blanket.js
K('나 여기! 왼쪽부터 차례로~', "I'm here! Left to right~"); K('나 아직 차례 아니야~', "Not my turn yet~"); K('? 붙은 이불부터! 삐죽 나온 걸 보고 톡', 'Start with the ? lump. Look at what pokes out, then tap');
