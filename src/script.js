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
  bear: { hide: K('으헤헤, 숨는다~', 'Heh heh, hiding~'),
    intro: [[L('bear', '으헤헤, 왔구나. 오늘은 내가 숨을게.', "Heh heh, you came. I'll hide today.")],
      [L('bear', '이번엔 안 잘 거야. 아마도.', "I won't fall asleep this time. Probably."), L('mong', '…베개는 왜 들고 있어?', '…Then why the pillow?')],
      [L('bear', '꿀 챙겼어. 찾으면 같이 먹자.', "I packed honey. Find me and we'll share.")]],
    found: [L('bear', '으헤헤, 들켰다. 기다리다 졸았어.', 'Heh heh, busted. Dozed off waiting.'), L('bear', '꿀 반 숟갈 남겼어. 네 거야.', 'I saved you half a spoon of honey.')],
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
    found: [L('cat', '흥. 꼬리는 안 숨겼거든.', "Hmph. My tail wasn't playing."), L('cat', '…다음 판도 해 준다냥.', "…I'll play another round.")],
    clue: [K('흥, 우연이다냥.', 'Hmph. Lucky.')], lock: [K('(꼬리가 쏙 나옴)', '(a tail slips out)')], stuck: [K('(꼬리를 살랑)', '(tail swish)')] },
  shiba: { hide: K('조용히 숨는다. 꼬리도.', 'Hiding quietly. Tail too.'),
    intro: [[L('shiba', '킁킁! 오늘은 내가 숨는다. 조용히!', "Sniff sniff! I'm hiding today. Quietly!")],
      [L('shiba', '이번엔 꼬리랑 약속했어. 가만히 있기로.', 'My tail and I made a deal. It stays still.'), L('mong', '…꼬리가 대답했어?', '…Did your tail agree?')]],
    found: [L('shiba', '나는 조용했어. 꼬리는 아니었지만.', "I was quiet. My tail wasn't."), L('shiba', '다음 순찰도 같이 가자!', 'Come on patrol again!')],
    clue: [K('킁…!', 'Sniff…!')], lock: [K('(붕붕붕)', '(wag wag wag)')], stuck: [K('(꼬리가 선반 위로 삐죽)', '(a tail sticks up over the shelf)')] },
  grumpy: { hide: K('한 판만이야.', 'One game.'),
    intro: [[L('grumpy', '뭐야. 놀러 왔어? …한 판만이야.', 'What. Here to play? …One game.')],
      [L('grumpy', '오늘도 한 판만. …시간은 많지만.', "One game again. …I've got time, though.")]],
    found: [L('grumpy', '흥. …운 좋았네.', 'Hmph. …Lucky.'), L('grumpy', '한 판 더 해도 되고.', 'Could do one more.')],
    clue: [K('…운 좋네.', '…Lucky.')], lock: [K('거기 아니라고. …거기 맞아.', 'Not there. …Okay, there.')], stuck: [K('(혀 차는 소리)', '(tsk)')] },
  squirrel: { hide: K('다 숨겼어! 나까지!', 'Hid everything! Me too!'),
    intro: [[L('squirrel', '도토리 숨기기 대장 다람이야!', "I'm Chippy, acorn-hiding champ!")],
      [L('squirrel', '이번엔 어디 숨겼는지 메모해 뒀어.', 'This time I wrote down where I hid everything.'), L('mong', '…메모는 어디 있어?', "…And where's the note?"), L('squirrel', '…숨겼어.', '…I hid it.')]],
    found: [L('squirrel', '헉! 도토리 냄새로 찾았지?', 'Whoa! You smelled the acorns, right?'), L('squirrel', '너무 잘 숨겨서 나도 까먹을 뻔!', 'I hid so well I almost forgot!')],
    clue: [K('헉, 내 도토리…!', 'Hey, my acorn…!')], lock: [K('(오도독)', '(crunch)')], stuck: [K('(볼이 빵빵해서) 웁웁', '(cheeks full) Mmf mmf')] },
  hamster: { hide: K('웁웁! 숨는다!', 'Mmf! Hiding!'),
    intro: [[L('hamster', '웁웁! 볼에 씨앗 넣고 숨을 거야!', "Mmf! I'm hiding with my cheeks full!")],
      [L('hamster', '이번엔 볼 비우고 숨는다!', 'Empty cheeks this time!'), L('mong', '…진짜?', '…Really?'), L('hamster', '…반만.', '…Half.')]],
    found: [L('hamster', '웁…! 볼이 빵빵해서 들켰나 봐!', 'Mmf…! My cheeks gave me away!'), L('hamster', '씨앗 하나 줄게. 아껴 먹어!', 'Here, have a seed. Make it last!')],
    clue: [K('웁?!', 'Mmf?!')], lock: [K('(오물오물)', '(nibble nibble)')], stuck: [K('(쳇바퀴 도는 소리)', '(a wheel squeaks)')] },
  sundae: { hide: K('녹기 전에 찾아 줘~!', 'Find me before I melt~!'),
    intro: [[L('sundae', '어서 와! 오늘은 내가 숨을게. 토핑 골라 놓고!', "Welcome! I'm hiding today. Toppings picked!")],
      [L('sundae', '이번엔 시원한 데 숨을 거야. 안 녹게!', 'Somewhere cool this time. No melting!')]],
    found: [L('sundae', '휴~ 다 녹을 뻔했어!', 'Phew~ I almost melted!'), L('sundae', '체리는 너 가져. 찾아 준 상!', "The cherry's yours. Finder's prize!")],
    clue: [K('앗, 그거…!', "Oh, that's…!")], lock: [K('(뚝… 뚝…)', '(drip… drip…)')], stuck: [K('(달콤한 냄새)', '(a sweet smell)')] },
  skater: { hide: K('보드 타고 휙!', 'Kickflip and gone!'),
    intro: [[L('skater', '요! 오늘 최고 기록 세운다!', 'Yo! New record today!')],
      [L('skater', '이번엔 보드 내려놓고 숨는다.', "This time I'm hiding without the board."), L('mong', '…할 수 있어?', '…Can you?'), L('skater', '…아마도.', '…Maybe.')]],
    found: [L('skater', '와우! 킥플립보다 빠르다!', 'Whoa! Faster than a kickflip!'), L('skater', '다음엔 보드 태워 줄게!', "Next time, I'll let you ride!")],
    clue: [K('어? 어?', 'Huh? Huh?')], lock: [K('(드르륵, 바퀴 소리)', '(a wheel rattles)')], stuck: [K('(보드 끝이 삐죽)', '(a board tip sticks out)')] },
  panda: { hide: K('기다리는 건 자신 있어.', "I'm great at waiting."),
    intro: [[L('panda', '판다는 숨는 데 고수야. 천천히 찾아.', 'Pandas are pro hiders. Take your time.')],
      [L('panda', '오늘도 기다려 줄게. 천천히 와.', "I'll wait again today. Come slowly.")]],
    found: [L('panda', '고수를 찾다니. 인정!', 'You found a pro. Respect!'), L('panda', '대나무 하나 나눠 줄게. 아삭!', 'Have some bamboo. Crunch!')],
    clue: [K('오…', 'Ooh…')], lock: [K('(아삭아삭)', '(crunch crunch)')], stuck: [K('(대나무 씹는 소리)', '(bamboo munching)')] },
  sleepy: { hide: K('찾으면… 깨워 줘…', 'Wake me… when you find me…'),
    intro: [[L('sleepy', '숨바꼭질… 좋아… 숨어서 잘게…', "Hide-and-seek… nice… I'll nap while I hide…")],
      [L('sleepy', '이번엔… 안 자고… 쿨…', "This time… I won't… zzz…")]],
    found: [L('sleepy', '음냐… 벌써 아침이야?', 'Mmh… is it morning already?'), L('sleepy', '끝나면 깨워 줘. 같이 돌아가게.', "Wake me when we're done. We'll walk home together.")],
    clue: [K('음냐…?', 'Mmh…?')], lock: [K('(쌕쌕)', '(soft breathing)')], stuck: [K('드르렁~', 'Snore~')] },
  robot: { hide: K('은신 모드 가동. 삐빅.', 'Stealth mode on. BEEP.'),
    intro: [[L('robot', '삐빅. 숨바꼭질 프로그램 실행.', 'BEEP. Running hide-and-seek program.')],
      [L('robot', '삐빅. 지난 기록 분석 완료. 이번엔 안 들킴.', 'BEEP. Past records analyzed. Will not be found.'), L('mong', '…지난번에도 그랬어.', '…You said that last time.')]],
    found: [L('robot', '발견됨. 축하 프로토콜 실행. 삐빅삐빅!', 'Found. Running celebration protocol. BEEP BEEP!'), L('robot', '동행 기록 저장. 삭제하지 않음.', 'Trip saved. Keeping this one.')],
    clue: [K('삐빅?', 'BEEP?')], lock: [K('(위잉…)', '(whirr…)')], stuck: [K('(삐빅, 불빛이 깜빡)', '(beep, a light blinks)')] },
  nerd: { hide: K('논리적으로 숨었으니 논리적으로 찾아.', 'I hid logically. Find me logically.'),
    intro: [[L('nerd', '흠. 오늘은 내가 문제를 내지.', 'Hm. Today, I set the puzzle.')],
      [L('nerd', '흠. 너만을 위한 새 퍼즐이야.', 'Hm. A new puzzle, just for you.')]],
    found: [L('nerd', '놀랍군. 계산보다 빨라.', 'Remarkable. Faster than I calculated.'), L('nerd', '다음 문제는 더 어렵게 만들지.', "I'll make the next one harder.")],
    clue: [K('오, 오오?', 'Oh— oh?')], lock: [K('흠흠.', 'Ahem.')], stuck: [K('흠흠. 힌트는… 아니, 안 줘.', 'Ahem. A hint… no. No hints.')] },
  dj: { hide: K('비트 따라와! 둠칫!', 'Follow the beat! Boom-tss!'),
    intro: [[L('dj', '둠칫! 새 곡 녹음 중이야. 찾으면 첫 곡 들려줄게!', 'Boom-tss! Recording a new track. Find me and you hear it first!')],
      [L('dj', '이번엔 볼륨 줄이고 숨는다!', 'Volume down this time!'), L('mong', '…아직 커.', '…Still loud.')]],
    found: [L('dj', '둠칫! 네가 오늘의 MVP!', "Boom-tss! You're today's MVP!"), L('dj', '이 곡 제목은 「찾았다」로 할게!', "I'm calling this track 'Found You'!")],
    clue: [K('둠…칫?', 'Boom…tss?')], lock: [K('(쿵짝쿵짝)', '(thump thump)')], stuck: [K('(어디선가 베이스 소리)', '(a bassline from somewhere)')] },
  inky: { hide: K('…안 나갈 거야.', "…I'm not coming out."), intro: [[]], found: [],
    clue: [K('…!', '…!')], lock: [K('…', '…')], stuck: [K('(작은 콧노래)', '(a tiny hum)')] },
};
const ANY = { hide: K('숨는다~!', 'Hiding~!'), intro: [[L('?', '숨바꼭질 하자! 내가 숨을게~', "Let's play hide-and-seek! I'll hide~")]],
  found: [L('?', '들켰다~! 어떻게 찾았어?!', 'Busted~! How did you find me?!'), L('?', '다음에도 같이 놀자!', "Let's play again next time!")],
  clue: [K('헉, 그걸 찾았어?!', 'Whoa, you found that?!')], lock: [K('어, 어? 거기 열면 안 돼~', "W-wait, don't open that~")], stuck: [K('킥킥…', 'Hee hee…')] };
// The friends who host many stages (70판 대본 점검 10/18: 멍뭉이 8번, 판다 6번…) get more meetings, each intro paired with
// its own reveal (the same index), so a joke set up when they hide is the one paid off when they're found. Index 0 is the
// first meeting; after that they go round in order.
const MORE = {
  shiba: { intro: [
      [L('shiba', '순찰 중엔 잠복이 기본이지. 나 찾아 봐!', 'On patrol, you stake out. Come find me!')],
      [L('shiba', '오늘은 꼬리에 리본 묶었어. 무거워서 안 흔들릴걸?', "I tied a ribbon on my tail. Too heavy to wag, I bet."), L('mong', '…리본이 더 눈에 띄어.', "…The ribbon's even easier to spot.")],
      [L('shiba', '킁… 너한테서 간식 냄새 나. 찾으면 그거 줘!', 'Sniff… you smell like snacks. Find me and hand them over!')],
      [L('shiba', '이번엔 진짜 진짜 조용히. …멍.', 'Really, really quiet this time. …Woof.')],
      [L('shiba', '마지막 순찰 코스야. 여기서 숨바꼭질 한 판!', 'Last stop on the patrol route. One round here!')]],
    reveals: [null, [L('shiba', '멍! 꼬리야, 약속했잖아…', 'Woof! Tail, we had a deal…'), L('shiba', '…그래도 3초는 참았어.', '…I held still for three seconds, though.')],
      [L('shiba', '킁, 잠복 실패.', 'Sniff. Stakeout failed.'), L('shiba', '너 탐정 해도 되겠다. 순찰 파트너로 임명!', "You could be a detective. You're my patrol partner now!")],
      [L('shiba', '리본이 문제였어…', 'The ribbon was the problem…'), L('shiba', '내일은 꼬리를 주머니에 넣어 올게.', "Tomorrow I'll bring my tail in a pocket.")],
      [L('shiba', '멍! 졌다. 간식은 네 거야.', 'Woof! You win. The snacks are yours.'), L('shiba', '…냄새만 맡을게.', "…I'll just smell them.")],
      [L('shiba', '방금 멍 해서 들킨 거지?', 'I gave myself away with that woof, didn\'t I?'), L('shiba', '순찰 일지에 적어 둬야지. 「오늘도 들킴」.', "I'll log it in my patrol diary: 'Caught again.'")],
      [L('shiba', '멍멍! 순찰 끝!', 'Woof woof! Patrol complete!'), L('shiba', '오늘도 같이 돌아 줘서 고마워.', 'Thanks for walking the route with me again.')]] },
  panda: { intro: [
      [L('panda', '흑백 무늬라 그늘에선 안 보일걸.', 'With black-and-white fur, I vanish in the shade.')],
      [L('panda', '산에선 소리가 멀리 가. 귀를 잘 기울여.', 'Sounds carry far on a mountain. Listen closely.')],
      [L('panda', '여기서 꼭대기까지 금방이야. 마지막 연습!', "It's not far to the top from here. One last practice!")],
      [L('panda', '오두막은 숨을 데가 많아. 천천히 둘러봐.', 'The cabin has lots of hiding spots. Take a slow look.')]],
    reveals: [null, [L('panda', '오, 왔구나. 딱 좋은 속도야.', "Oh, you're here. Just the right speed."), L('panda', '기다리는 것도 숨바꼭질이야.', 'Waiting is part of hide-and-seek, too.')],
      [L('panda', '그늘에서도 찾네. 눈이 좋구나.', 'You found me even in the shade. Good eyes.'), L('panda', '…어릴 때 그 애도 그늘을 좋아했는데.', '…That kid back then liked the shade, too.')],
      [L('panda', '아삭 소리 때문이지? 대나무는 못 참겠어.', "It was the crunching, right? I can't resist bamboo."), L('panda', '다음엔 씹지 않고 기다릴게.', "Next time I'll wait without chewing.")],
      [L('panda', '좋아. 이제 꼭대기에 가도 되겠다.', "Good. You're ready for the top."), L('panda', '거기 묻은 거, 너한테 꼭 보여 주고 싶어.', 'I really want to show you what we buried there.')],
      [L('panda', '찾았다. 역시 너야.', "Found me. Of course it's you."), L('panda', '…다 같이 찾으러 오는 거, 좋다.', '…I like it when everyone comes looking.')]] },
  frog: { intro: [
      [L('frog', '개굴! 밤엔 개구리 세상이야. 못 찾을걸!', "Ribbit! Night belongs to frogs. You won't find me!")],
      [L('frog', '큰 공원이다! 연못이 있으니까 내가 유리해!', "Big park! There's a pond, so I've got the edge!")]],
    reveals: [null, [L('frog', '거품 연습은… 실패야.', 'Bubble practice… failed.'), L('frog', '한 판 더! 다음엔 진짜야!', 'One more! For real next time!')],
      [L('frog', '개굴?! 밤에도 보여?', 'Ribbit?! You can see me at night?'), L('frog', '…야광 개구리였나 봐, 나.', "…Guess I'm a glow-in-the-dark frog.")],
      [L('frog', '연못만 쳐다보다가 들켰어…', 'I got caught staring at the pond…'), L('frog', '그래도 이번 판은 재밌었다, 개굴!', 'Still, that was a fun round. Ribbit!')]] },
  bear: { reveals: [null, [L('bear', '으헤헤… 또 졸았어.', 'Heh heh… dozed off again.'), L('bear', '…베개가 너무 푹신했어.', '…The pillow was too soft.')],
      [L('bear', '으헤헤, 꿀 냄새 때문이지?', 'Heh heh, it was the honey smell, right?'), L('bear', '반 숟갈씩 나눠 먹자.', 'Half a spoon each.')]] },
  nerd: { intro: [[L('nerd', '흠. 정전도 변수일 뿐이지.', 'Hm. A blackout is just another variable.')]],
    reveals: [null, [L('nerd', '놀랍군. 이 빌딩 퍼즐, 거의 다 풀었어.', "Remarkable. You've nearly solved the whole building."), L('nerd', '마지막 층에서 기다리지.', "I'll be waiting on the last floor.")],
      [L('nerd', '어둠 속에서도 찾다니. 계산 밖이야.', 'Even in the dark. Outside my calculations.'), L('nerd', '…솔직히 이런 친구, 처음이야.', "…Honestly, I've never had a friend like you.")]] },
  dj: { reveals: [null, [L('dj', '볼륨은 줄였는데 심장 소리가 커서…', 'I turned the volume down, but my heartbeat was so loud…'), L('dj', '다음 곡 제목은 「또 찾았다」!', "Next track: 'Found You Again'!")]] },
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
  { id: 'first', type: 'tut1', room: 'bunny', hide: K('숨는다~!', 'Hiding~!'),
    intro: [L('bunny', '몽글아! 왔다!', 'Mongle! You came!'), L('bunny', '나 찾아봐. 이번엔 안 웃을 거야.', "Come find me. I won't giggle this time.")],
    clue: K('앗, 내 간식!', 'Hey, my snack!'), peek: K('킥… 아, 아니야. 안 웃었어.', "Hee— n-no. I didn't giggle."), mongClue: K('…저쪽.', '…Over there.'),
    reveal: [L('bunny', '네가 오니까 자꾸 웃음이 났어.', "I heard you coming. I couldn't stop giggling."), L('bunny', '다음엔 진짜 안 웃을 거야.', "Next time, I really won't giggle."), L('mong', '…꼬리도 숨겨.', '…Hide your tail too.')] },
  { id: 'drawers', type: 'tut2', room: 'bunny',
    intro: [L('bunny', '이번엔 내가 아니라 내 물건들이야.', 'Not me this time. My things.'), L('bunny', '서랍까지 꼭 닫았지.', 'I even shut the drawers.'), L('mong', '…안 웃는 연습은?', '…What about not giggling?'), L('bunny', '그, 그건 다음에!', "Th-that's for next time!")],
    finds: [K('내 머리핀!', 'My hairpin!'), K('내 최애 스티커…!', 'My favorite sticker…!'), K('그건 아끼는 건데!', 'I love that one!'), K('마지막 건 절대 못 찾아!', "You'll never find the last one!")],
    drawerFull: K('앗, 거긴…!', 'Hey, not in th—!'), drawerEmpty: K('거긴 양말 서랍인데…', "That's my sock drawer…"),
    after: [L('bunny', '다 찾았어?! 서랍까지 닫았는데!', 'All of them?! I shut the drawers!'), L('bunny', '이번엔 네가 숨겨 봐. 내가 찾을게!', "Your turn to hide something. I'll find it!")], homeChoice: true },
  { id: 'museum', type: 'gray', room: 'museum', teachMove: true,
    intro: [L('bear', '으헤헤, 새 그림 걸었는데…', 'Heh heh, I just hung a new painting…'), L('bear', '…내가 좋아하는 색이 없어졌어.', '…and my favorite color is gone.'), L('bunny', '방금 까만 거 봤어! 저쪽으로 휙!', 'I saw something black! It went that way!'), L('mong', '봤어. 작았어.', 'I saw. It was small.')],
    firstColor: K('응, 이 색이야.', 'Yes. That one.'),
    caught: K('…앗.', '…Oops.'),
    after: [L('bear', '으헤헤… 색은 다 돌아왔네. 고마워, 몽글아.', 'Heh heh… the colors are all back. Thanks, Mongle.'), L('mong', '…발자국. 급하게 뛰었어.', '…Footprints. It ran in a hurry.')] },
  { id: 'bear', type: 'incident', room: 'bear',
    intro: [L('bear', '미술관 고마웠어. 오늘은 우리 집!', 'Thanks for the museum. Today, my place!'), L('bear', '이번엔 잠가 뒀지. 으헤헤.', 'And this time I locked it. Heh heh.')],
    reveal: [L('bear', '으헤헤, 들켰다. 기다리다 졸았어.', 'Heh heh, busted. I dozed off waiting.'), L('bear', '꿀 먹을래? 숟가락 두 개 챙겼어.', 'Want some honey? I brought two spoons.'), L('mong', '…하나는 쓴 거 같은데.', '…One of them looks used.'), L('bear', '으헤헤.', 'Heh heh.')] },
  { id: 'fishing', type: 'incident', room: 'fishing',
    intro: [L('frog', '개굴! 낚시터에선 내가 챔피언이야.', "Ribbit! At the fishing spot, I'm the champ."), L('frog', '이번엔 물소리도 내 편이야.', "The water's on my side this time.")],
    stuck: [K('(뽀글)', '(blub)')],
    reveal: [L('frog', '거품이 배신했어!', 'The bubbles betrayed me!'), L('frog', '한 판 더! 이번엔 안 들킨다!', "One more! I won't get caught this time!"), L('mong', '수풀에서도 그랬어.', 'You said that in the bushes.')] },
  { id: 'study', type: 'incident', room: 'study', card: 'chain',
    intro: [L('nerd', '흠. 토순이를 한 번에 찾았다는 그 몽글이군.', "Hm. So you're the Mongle who found Bunbun on the first try."), L('nerd', '이 서재엔 내가 만든 비밀 방이 있지.', 'I built a secret room in this study.'), L('nerd', '아직 아무도 끝까지 못 풀었어. 난 거기 있을게.', "No one's ever solved it all the way. I'll be in there.")],
    stuck: [K('흠흠. 무지개가 끊긴 건 봤겠지?', 'Ahem. You noticed the rainbow is broken, yes?')],
    reveal: [L('nerd', '놀랍군. 계산보다 빨라.', 'Remarkable. Faster than I calculated.'), L('nerd', '…사실 누가 풀어 주길 기다렸어. 혼자 만든 퍼즐은 재미없거든.', "…Truth is, I was waiting for someone to solve it. A puzzle's no fun alone."), L('nerd', '다음 퍼즐은 너만을 위해 만들지.', "I'll make the next one just for you.")] },
  { id: 'peng', type: 'incident', room: 'peng',
    intro: [L('peng', '펭! 네가 박사 퍼즐 푼 애야?', "Peng! You're the one who solved Doc's puzzle?"), L('peng', '나는 동네 숨기 2등. 1등은 너굴이.', "I'm the second-best hider in town. Rocky's first."), L('peng', '오늘 1등 될 거야. 꽁꽁 잠그고 숨거든!', "Today I'm number one. I'm locking myself in tight!")],
    reveal: [L('peng', '펭… 추워서 떤 거 들켰어?', 'Peng… did my shivering give me away?'), L('peng', '1등 비결 1번. 숨을 땐 숨도 참아.', 'Pro tip number one. When you hide, hold your breath.'), L('mong', '넌 떨었잖아.', 'You were shivering.'), L('peng', '…비결 2번. 떨지 않기.', "…Tip number two. Don't shiver."), L('peng', '너굴이는 진짜 못 찾을걸. 걔는 반칙해.', "You'll never find Rocky, though. He cheats.")] },
  { id: 'bunnybath', type: 'incident', room: 'bunnybath',
    intro: [L('bunny', '몽글아! 오늘은 진짜 안 웃을게.', "Mongle! Tonight I really won't giggle."), L('bunny', '연습 많이 했어. 거울 보고.', 'I practiced a lot. In the mirror.'), L('mong', '…거울 보고 웃었지?', '…And giggled at the mirror?'), L('bunny', '아, 안 웃었거든?!', 'I— I did not?!')],
    reveal: [L('bunny', '푸핫! 반칙이야, 네 발소리 웃겨!', 'Pfft! No fair, your footsteps are funny!'), L('mong', '내 발소리가 뭐.', "What's wrong with my footsteps?"), L('bunny', '몰라! 그냥 웃겨!', "I don't know! They just are!")] },
  { id: 'bear2', type: 'incident', room: 'bear2',
    intro: [L('bear', '으헤헤, 왔다. 이번엔 접시도 두 개 챙겼어.', "Heh heh, you're here. I brought two plates this time."), L('mong', '숟가락은?', 'And the spoons?'), L('bear', '…깨끗한 걸로 두 개.', '…Two clean ones.')],
    stuck: [K('(지글지글)', '(sizzle sizzle)')],
    reveal: [L('bear', '들켰다… 놀래 주려고 팬케이크 구웠어.', 'Busted… I was making pancakes to surprise you.'), L('bear', '조금 탔어. 탄 건 내 거.', "They're a little burnt. The burnt ones are mine.")] },
  { id: 'house2f', type: 'incident', room: 'house2f',
    intro: [L('peng', '펭! 비결 2번 연습했어. 오늘은 안 떨어.', 'Peng! I practiced tip number two. No shivering today.'), L('peng', '그리고 우리 집은 2층! 높을수록 1등이지!', 'And my house has two floors! Higher means number one!')],
    stuck: [K('쿵! …아무 소리 안 났어.', "Thud! …That wasn't me.")],
    reveal: [L('peng', '펭! 안 떨었는데!', "Peng! I didn't shiver!"), L('mong', '쿵 했잖아.', 'You went thud.'), L('peng', '…비결 3번. 쿵 하지 않기.', "…Tip number three. Don't go thud."), L('peng', '너라면 너굴이도 찾겠다.', 'You could find Rocky, I bet.')] },
  { id: 'house3', type: 'incident', room: 'house3',
    intro: [L('bear', '다락에 옛날 상자가 있어. 같이 볼래?', "There's an old box in the attic. Want to look?"), L('bear', '근데 그 전에… 나 숨는다! 으헤헤.', "But first… I'm hiding! Heh heh.")],
    reveal: [L('bear', '어… 찾았어? 아니, 내가 찾았다. 어릴 때 인형.', 'Huh… you found— no, I found it. My old teddy.'), L('bear', '곰인형의 곰인형이야. 으헤헤.', "A teddy bear's teddy bear. Heh heh."), L('bear', '아 참, 냥냥이가 네 얘기 묻더라. 엄청 궁금한 눈치던데?', 'Oh, Nyannyan was asking about you. Seemed really curious.')] },
  // 우리 아파트
  { id: 'apt', type: 'incident', room: 'apt',
    intro: [L('bunny', '이번엔 진짜 안 웃고 숨는다. 상자가 백 개니까!', "This time I won't giggle. There are a hundred boxes!"), L('mong', '…꼬리는?', '…And the tail?'), L('bunny', '꼬, 꼬리도 넣을 거야!', 'Th-the tail is going in too!')],
    reveal: [L('bunny', '푸핫! 상자가 너무 좁아서 웃겼어!', 'Pfft! The box was so tight it made me laugh!'), L('bunny', '집들이 와 줘서 고마워. 진짜로.', 'Thanks for coming to my housewarming. Really.')] },
  { id: 'police', type: 'gray', room: 'police',
    intro: [L('shiba', '킁킁. 색깔 도둑 신고가 들어왔어. 파출소까지 회색이야!', 'Sniff, sniff. Someone reported a color thief. Even the police box went gray!'), L('shiba', '나는 조용히 잠복할게. 넌 색을 찾아 줘.', "I'll stake out quietly. You find the colors.")],
    caught: K('…또 너야?', '…You again?'),
    after: [L('shiba', '나는 조용했어. 꼬리는 아니었지만.', "I was quiet. My tail wasn't."), L('shiba', '근데 저 애 이름이 뭐지? 동네 명부에 없어.', "But what's its name? It's not on the town list."), L('shiba', '다음 순찰엔 같이 가자.', 'Come on patrol with me next time.')] },
  { id: 'oneroom', type: 'incident', room: 'oneroom',
    intro: [L('hamster', '웁웁! 불 나갔어! 해바라기씨 먹다가!', 'Mmf! The lights went out! Mid-snack!'), L('mong', '스위치부터 찾자. 옆에 있을게.', "Let's find the switch. I'm right here.")],
    reveal: [L('hamster', '…무서워서 씨앗 다 먹었어.', '…I got scared and ate all my seeds.'), L('mong', '볼은 아직 빵빵한데.', 'Your cheeks are still full.'), L('hamster', '…비상식량이야.', '…Emergency rations.')] },
  { id: 'school', type: 'incident', room: 'school',
    intro: [L('bunny', '쉬는 시간 10분! 교실 숨바꼭질은 사물함이 국룰이야.', 'Ten-minute break! Classroom hide-and-seek means lockers. Rule number one.'), L('bunny', '종 치기 전에 찾아야 해. 시계는 없어. 그냥 기분이야.', "Find me before the bell. There's no timer. It's just a vibe.")],
    reveal: [L('bunny', '벌써?! 종도 안 쳤는데!', "Already?! The bell hasn't even rung!"), L('bunny', '쉬는 시간이 한 번 더 있으면 좋겠다.', 'I wish break lasted one more round.')] },
  { id: 'firestation', type: 'incident', room: 'firestation', host: 'peng',
    intro: [L('peng', '펭! 오늘은 소방서 체험의 날. 나는 소방관 2등!', "Peng! It's fire station day. I'm the second-best firefighter!"), L('mong', '1등은?', "Who's first?"), L('peng', '…아직 안 정해졌어.', '…Not decided yet.')],
    reveal: [L('peng', '비결 4번. 소방봉은 천천히…', 'Tip number four. Slide down the pole slowly…'), L('mong', '…몇 번까지 있어?', '…How many tips are there?'), L('peng', '1등 될 때까지!', "Until I'm number one!")] },
  { id: 'aptmap', type: 'incident', room: 'aptmap', host: 'bear',
    intro: [L('bunny', '곰돌이가 집들이 왔다가 숨었는데, 어디 갔는지 나도 몰라.', "Bearie came to the housewarming and hid. Even I don't know where."), L('bunny', '청소기가 자꾸 이상한 걸 물고 다녀.', 'And the robot vacuum keeps carrying weird stuff around.')],
    reveal: [L('bear', '어… 다 끝났어? 따뜻해서 그만.', 'Huh… is it over? It was just so warm up there.'), L('mong', '…높은 데서도 자네.', '…You even sleep up high.')] },
  // 동네 골목
  { id: 'alley1', type: 'incident', room: 'alley1',
    reveal: [L('grumpy', '…진짜 찾았네.', '…You actually found me.'), L('mong', '…의자가 두 개네.', '…There are two chairs.'), L('grumpy', '하, 하나는 가방 놓는 거야.', "O-one's for my bag.")] },
  { id: 'skatepark', type: 'gray', room: 'skatepark',
    after: [L('inky', '…색 돌려놓는 거, 잘하네.', "…You're good at putting colors back."), L('mong', '너는 가져가는 거 잘하고.', "And you're good at taking them.")] },
  { id: 'alley3', type: 'incident', room: 'alley3',
    intro: [L('shiba', '이번엔 진짜 조용히 숨는다. 꼬리도.', "I'm hiding quietly this time. Tail included.")],
    lock: [K('(붕붕붕)', '(wag wag wag)')],
    reveal: [L('shiba', '꼬리야… 왜 그랬어.', 'Tail… why?')] },
  // 편의점·상가
  { id: 'konbini', type: 'incident', room: 'konbini', always: true,   // (no hiding in it: plays even if the shop falls back to a find-the-things stage)
    intro: [L('mong', '토순이는 도넛. 곰돌이는 꿀. 냥냥이는 생선.', 'Bunbun likes donuts. Bearie, honey. Nyannyan, fish.'), L('shiba', '친구들 좋아하는 걸 다 외웠어?', 'You memorized what all your friends like?'), L('mong', '일기장에 있어.', "It's in my diary."), L('shiba', '그럼 내 건?', 'Then what about me?'), L('mong', '…간식 전부.', '…Every snack.'), L('shiba', '정답!', 'Correct!')] },
  { id: 'laundry', type: 'incident', room: 'laundry',
    intro: [L('sundae', '세탁기 돌렸더니 양말이 한 짝씩 없어졌어!', "I ran the washer and now every sock's missing its pair!"), L('mong', '…양말도 숨바꼭질 하나 봐.', '…Guess socks play hide-and-seek too.')] },
  { id: 'cafe', type: 'gray', room: 'cafe',
    after: [L('sundae', '…계산대에 누가 동전을 두고 갔어. 크레파스 그림이랑.', '…Someone left coins on the counter. And a crayon drawing.'), L('mong', '…숨바꼭질 그림이다. 구석에 까만 동그라미.', '…A hide-and-seek drawing. A black circle in the corner.'), L('mong', '나쁜 애는 아니야.', 'Not a bad kid.')] },
  // 공원·놀이터
  { id: 'playground', type: 'incident', room: 'playground',
    intro: [L('frog', '개굴! 낚시터 복수전이다. 이번엔 물 없는 데 숨는다!', "Ribbit! Fishing-spot rematch. This time I'm hiding away from water!")],
    stuck: [K('…물이 그리워.', '…I miss the water.')],
    reveal: [L('frog', '물이 그리워서 나왔어…', 'I missed the water, so I came out…'), L('frog', '한 판 더! 다음엔 진짜야!', 'One more! For real next time!')] },
  { id: 'park1', type: 'gray', room: 'park1',
    after: [L('inky', '다들 짝이 있네. 같이 노는 애.', "Everyone's got someone. Someone to play with."), L('inky', '…왜 따라와? 찾지 마.', "…Why do you keep following me? Don't come looking."), L('mong', '찾지 말라면서 발자국은 남겨.', 'Says "don\'t come looking." Leaves footprints anyway.')] },
  { id: 'park2', type: 'incident', room: 'park2',
    intro: [L('squirrel', '먹을 건 다 숨겼어.', 'I hid all the food.'), L('mong', '오늘 먹을 것도?', "Even today's lunch?"), L('squirrel', '……그것도.', '…That too.')] },
  // 산길·캠핑
  { id: 'camp2', type: 'incident', room: 'camp2',
    intro: [L('sleepy', '랜턴이… 꺼졌어… 스위치는… 쿨…', 'The lantern… went out… the switch is… zzz…'), L('mong', '자지 마. 같이 찾자.', "Don't fall asleep. Let's look together.")],
    reveal: [L('sleepy', '음냐… 불 켜졌네.', "Mmh… the light's on."), L('sleepy', '끝나면 깨워 줘. 같이 돌아가게.', "Wake me when we're done. We'll walk home together.")] },
  { id: 'camp3', type: 'gray', room: 'camp3',
    intro: [L('robot', '삐빅. 기지 색상 데이터 손실. 원인: 작고 까만 생명체.', 'BEEP. Base color data lost. Cause: small black life-form.')],
    after: [L('robot', '삐빅. 같은 생명체, 아주 오래된 기록에도 있음.', 'BEEP. Same life-form found in very old records.')] },
  { id: 'trailnight', type: 'incident', room: 'trail', night: true,
    intro: [L('panda', '지도를 떨어뜨렸어. 밤이라 이정표만 보여.', 'I dropped the map. At night, only the signposts show.'), L('panda', '먼저 숨어 있을게. 천천히 와.', "I'll go hide first. Take it slow.")] },
  // 빌딩
  { id: 'lobby', type: 'incident', room: 'lobby',
    intro: [L('nerd', '약속한 퍼즐이야. 이 빌딩 전체가 퍼즐이지.', 'The puzzle I promised you. This whole building is the puzzle.'), L('robot', '삐빅. 박사 제작 기간 54일. 수면 부족.', 'BEEP. Doc spent 54 days on it. Not enough sleep.'), L('nerd', '…그건 말 안 해도 돼.', "…You didn't have to mention that.")] },
  // 빌딩의 흑백판: this time 먹물이 doesn't run (a 흑백판 always has 먹물이 in it, so the talk can't fall through)
  { id: 'office', type: 'gray', room: 'officefloor', caught: K('…응. 나야.', "…Yeah. It's me."),
    after: [L('mong', '…이번엔 도망 안 가네.', "…You're not running this time."), L('inky', '다들 찾다가 집에 가. 해 지면.', 'Everyone gives up and goes home. When the sun goes down.'), L('inky', '"다음에" 같은 건… 나한테 없었어.', '"Next time"… nobody ever said that to me.'), L('mong', '(크레파스 상자를 내밂) 이거 네 거지.', '(holds out the crayon box) This is yours, right?'), L('inky', '…아직 있었어?', '…You kept it?'), L('mong', '분실물이었어. 주인 찾았다.', 'It was in the lost-and-found. Found the owner.'), L('inky', '…색은 다 돌려놓을게.', "…I'll give all the colors back.")] },
];

// ── 먹물이 in the 흑백판, by where we are in the story: a voice → caught again → quiet → helping you look
const INKY = [
  { intro: K('…킥. 못 찾을걸.', "…Heh. Bet you can't."), caught: K('…쳇.', '…Tch.'),
    miss: [K('…킥.', '…Heh.')], idle: [K('바로 코앞인데.', "It's right under your nose.")], found: [K('…쳇.', '…Tch.')], furn: [K('…그 큰 걸 찾았어?', '…You found the big one?')] },
  { intro: K('또 너야? 이번엔 안 들킬 거야.', 'You again? Not getting caught this time.'), caught: K('…쳇. 또 찾았네.', '…Tch. Found it again.'),
    miss: [K('거기 아니야.', 'Not there.')], idle: [K('다들 금방 포기하던데.', 'Everyone else gives up fast.')], found: [K('…또 찾았어?', '…Found it again?')], furn: [K('…그것까지?', '…That too?')] },
  { intro: K('…또 왔어?', '…You came again?'), caught: K('…너는 안 가네.', "…You're not leaving."),
    miss: [K('…', '…')], idle: [K('너는 안 가네.', "You're not leaving.")], found: [K('…응.', '…Yeah.')], furn: [K('…응.', '…Yeah.')] },
  { intro: K('이번엔 내가 같이 찾을게. 어디 뒀는지 알거든.', 'This time I\'ll help. I know where I put everything.'), caught: K('그거 내가 제일 잘 숨긴 건데.', 'That was my best hiding spot.'),
    miss: [K('거기 말고. 그 옆.', 'Not there. Next to it.')], idle: [K('위. 더 위.', 'Up. Higher.'), K('…그건 내가 봐도 어렵다.', "…Okay, even I think that one's hard.")], found: [K('그거 내가 제일 잘 숨긴 건데.', 'That was my best hiding spot.')], furn: [K('맞아, 그거.', "Yep, that one.")] },
];
const GRAY_OWNER = [K('앗, 색깔이 몽땅 사라졌어!', 'Whoa, all the colors are gone!'), K('또 회색이야. 그 까만 애 짓이야!', "Gray again. It's that black kid!"), K('내 방이 흑백 영화가 됐어…', 'My room turned into a black-and-white movie…')];
const GRAY_MONG = K('찾는 것마다 색을 돌려놓자.', "Let's bring the colors back, one by one.");

// ── 너굴이's timed stages: the champion, a new excuse every time
const ROCKY = [
  [L('raccoon', '네가 펭펭이 이겼다는 애? 나 너굴이. 동네 숨기 1등.', "So you're the kid who beat Pengpeng? I'm Rocky. Number one hider in town."), L('raccoon', '내가 셀 동안 다 찾으면 인정해 줄게. 천천히 셀게. …조금만.', "Find it all while I count, and I'll admit you're good. I'll count slow. …Kinda.")],
  [L('raccoon', '저번엔 봐준 거야. 오늘은 진짜로 센다!', 'Last time I went easy. Today I count for real!')],
  [L('raccoon', '이번엔 반칙 안 해. …아마.', 'No cheating this time. …Probably.'), L('mong', '반칙했었어?', 'You cheated?'), L('raccoon', '안 했거든?!', 'I did not?!')],
  [L('raccoon', '1등 자리는 못 줘. 하나, 둘…!', 'Not giving up my number-one spot. One, two…!')],
  [L('raccoon', '…솔직히 너 좀 잘해. 그래도 센다!', "…Okay, you're kinda good. Still counting!")],
  [L('raccoon', '마지막 승부다! 지면… 다음에 또 해!', 'Final showdown! If I lose… we go again!')],
];
const ROCKY_WIN = [K('오늘은 봐준 거야. 진짜야.', 'I went easy on you today. For real.'), K('…봐준 거라니까.', '…I said I went easy.'), K('바, 반칙 아니야!', "Th-that wasn't cheating!"), K('…다음엔 진짜야.', '…Next time is for real.')];
export const ROCKY_LOSE = K('메롱~ 1등은 아무나 하나!', "Nyah-nyah~ Number one isn't for just anyone!");

// ── the region bosses (escape rooms): bound to the first boss stage on their map
const BOSS = [
  { id: 'grumpycat', room: 'catstory', title: K('심통난 냥냥이', 'Grumpy Nyannyan'), cast: 'cat',
    intro: [L('mong', '내 놀이 일기장이 없어졌어.', 'My play diary is gone.'), L('cat', '흥. 몰라. 아무것도 안 봤다냥.', "Hmph. Don't know. Didn't see a thing, meow."), L('mong', '…수염에 잉크 묻었는데.', "…You've got ink on your whiskers."), L('cat', '차, 찾을 수 있으면 찾아보라냥! 상자 위는 내 자리다냥!', 'F-find it yourself, then! And that box is MY spot!')],
    chain: { treatOn: ['yarnbasket', 'chest'], treatIn: ['dishcab', 'safe', 'fridge', 'fishtank'], hero: 'diary', treat: 'fishsnack' },
    secret: 'goldbone',
    lines: { blocked: [K('비킬 생각 없다냥.', 'Not moving.'), K('흥. 생선이면 몰라도.', "Hmph. Unless it's fish."), K('…냄새는 좋네. 아니, 안 비켜.', '…Smells nice. No. Still not moving.')],
      fed: K('냠… 이, 이번만이다냥.', 'Nom… J-just this once.'),
      tap: [K('흥.', 'Hmph.'), K('(꼬리를 휙)', '(tail flick)'), K('일기장? 무슨 일기장?', 'Diary? What diary?'), K('…재밌는 거 써 있어?', '…Anything good in it?')] },
    outro: [L('cat', '…다들 네 일기장에 나온다길래. 나도 있나 궁금했다냥.', "…Everyone said they're in your diary. I wanted to see if I was."),
      L('mong', '토순이, 웃음을 못 참음. 곰돌이, 기다리다 잠. 펭펭이, 비결이 세 개.', 'Bunbun: can\'t hold in a giggle. Bearie: falls asleep waiting. Pengpeng: has three pro tips.'),
      L('mong', '냥냥이 칸은… 오늘 쓰면 돼.', 'Your page… I can write it today.'), L('cat', '…뭐라고 쓸 건데.', '…What are you going to write?'),
      L('mong', '꼬리는 못 숨김.', "Can't hide that tail."), L('cat', '…! (꼬리를 휙 감춤)', '…! (tucks the tail away)'),
      L('cat', '이거, 캣타워. 네 방에 둬. 내가 가면 앉게.', 'Here. A cat tower. Keep it at your place. For when I visit.'),
      L('mong', '…맨 뒷장에 발자국. 수염 잉크는 이거네.', "…Footprints on the last page. That's where the ink came from."),
      L('cat', '그 까만 애. 밤마다 창밖을 지나가. 졸졸이가 봤을걸.', "That black one. It passes the window every night. Dozy must've seen it.")],
    reward: { furn: 'cattower', coins: 200 } },
  { id: 'apt-boss', room: 'policefront', title: K('분실물 보관함', 'The Lost-and-Found'), cast: 'shiba',
    intro: [L('shiba', '분실물 보관함이 다 잠겼어. 열쇠, 번호, 색깔, 레버… 내가 너무 꼼꼼했나 봐.', 'The lost-and-found is all locked. Key, code, colors, lever… I was too thorough.'), L('shiba', '주인들한테 돌려줘야 해. 같이 열자!', "We have to get these back to their owners. Let's open them together!")],
    secret: 'goldbone',
    lines: { tap: [K('킁킁, 거의 다 왔어!', "Sniff, sniff, we're close!"), K('그건 우산 주인 거야.', "That one's the umbrella owner's."), K('(꼬리를 붕붕)', '(tail wagging)')] },
    outro: [L('shiba', '다 돌려줬다! …하나 남았네. 이름 없는 크레파스 상자.', 'All returned! …Except one. A crayon box with no name.'), L('mong', '(상자 바닥에 까만 손자국) …알 것 같아.', '(a small black handprint on the bottom) …I think I know whose.'), L('bunny', '그럼 이제 집들이 여행! 몽글 호텔 3박 4일!', "Then it's housewarming trip time! Mongle Hotel, four days, three nights!"), L('bunny', '이 코타츠 줄게. 내 자리도 남겨 줘.', 'Here, a kotatsu. Save a spot for me.')],
    reward: { furn: 'kotatsu', coins: 250 } },
  { id: 'alley-boss', room: 'alleywide', title: K('삐딱이의 비밀 아지트', "Grumpy's Secret Hideout"), cast: 'grumpy',
    intro: [L('grumpy', '오늘도 한 판만. …시간은 많지만.', "One game again. …I've got time, though."), L('grumpy', '대문도 우체통도 다 잠가 놨어. 열 수 있으면 열어 봐.', "I locked the gate and the mailbox. Open them if you can.")],
    secret: 'pawprint',
    lines: { tap: [K('흥.', 'Hmph.'), K('…거기 말고.', '…Not there.'), K('찾든 말든 상관없거든!', "I don't care if you find it!")] },
    outro: [L('grumpy', '…진짜 다 열었네.', '…You actually opened all of it.'), L('grumpy', '그 까만 애? 어릴 때 같이 놀았던 거 같기도 하고. 기억 안 나.', "The black one? Maybe we played as kids. I don't remember."), L('grumpy', '내일도… 이 시간엔 있어.', "I'll be here tomorrow. Same time."), L('mong', '의자 하나 더 놓을게.', "I'll save you a seat."), L('grumpy', '이거, 떡볶이 포장마차. 의자는 두 개면 돼.', 'Here, my tteokbokki cart. Two stools is enough.')],
    reward: { furn: 'tteokstall', coins: 300 } },
  { id: 'shop-boss', room: 'shopmap', title: K('마감 시간의 금고', 'The Closing-Time Safe'), cast: 'sundae',
    intro: [L('sundae', '마감인데 금고가 안 열려! 번호를 찢어서 숨겼거든… 내가.', "It's closing time and the safe won't open! I tore up the code and hid it… myself."), L('shiba', '사장님, 그걸 왜…', 'Boss, why would you…')],
    secret: 'goldbone',
    lines: { tap: [K('커피 한 잔 줄까?', 'Want a coffee?'), K('금고는 계산대 근처일 거야…', "The safe's near the counter, I think…"), K('빨리빨리! 문 닫을 시간이야!', "Hurry, hurry! It's closing time!")] },
    outro: [L('sundae', '금고 안엔 돈 대신… 다 같이 먹을 간식. 마감하고 먹으려고.', 'Inside the safe… not money. Snacks for everyone. For after closing.'), L('sundae', '이 간식 카트 줄게. 같이 먹을 건 이미 준비했어.', 'Take this snack cart. Snacks for two, already packed.')],
    reward: { furn: 'snackcart', coins: 300 } },
  { id: 'park-boss', room: 'playgroundwide', title: K('소풍 바구니를 지켜라', 'Save the Picnic Basket'), cast: 'frog',
    intro: [L('frog', '개굴! 소풍 도시락이 몽땅 사라졌어!', 'Ribbit! The whole picnic lunch is gone!'), L('squirrel', '나 아니야! …아마도.', 'Not me! …Probably.'), L('frog', '분리수거함까지 잠겨 있어. 이건 방탈출이야!', "Even the recycling bins are locked. This is an escape room!")],
    secret: 'furball',
    lines: { tap: [K('개굴!', 'Ribbit!'), K('배고파 개굴…', "I'm hungry, ribbit…"), K('그네 밑도 봤어?', 'Did you check under the swings?')] },
    outro: [L('squirrel', '너무 꼭꼭 숨겼어. 나도 못 찾을 만큼.', "I hid it so well, even I couldn't find it."), L('frog', '그러니까 친구가 있어야 해, 개굴!', "That's why you need friends. Ribbit!"), L('squirrel', '이 벤치 가져가. 너 쉬는 자리도 있어야지.', 'Take this bench. You need somewhere to rest, too.')],
    reward: { furn: 'bench2', coins: 320 } },
  { id: 'camp-boss', room: 'campwide', title: K('산꼭대기 보물상자', 'The Mountaintop Chest'), cast: 'panda',
    intro: [L('panda', '꼭대기에 다 왔다. 어릴 때 묻은 상자, 이 근처야.', "We made it to the top. The box we buried as kids is around here."), L('sleepy', '열쇠는 텐트에… 쪽지는 계곡에… 색깔 카드는… 몰라…', 'The key\'s in the tent… the note\'s by the stream… the color card… no idea…'), L('mong', '네 개 다 열어 보자.', "Let's open all four.")],
    secret: 'goldbone',
    lines: { tap: [K('천천히 해. 기다려 줄게.', "Take your time. I'll wait."), K('정상까지 거의 다 왔어!', "We're almost at the top!"), K('졸졸이 깨우지 마~', "Don't wake Dozy~")] },
    outro: [L('panda', '찾았다. 어릴 때 다 같이 묻은 거.', 'Found it. The one we buried as kids.'), L('panda', '사진이다. 나, 토순이, 삐딱이, 몽글이…', 'A photo. Me, Bunbun, Grumpy, Mongle…'), L('mong', '…구석에 하나 더. 까만 애.', '…One more, in the corner. A black one.'),
      L('panda', '(조용히) 그날 숨바꼭질 했어. 끝까지 못 찾은 애가 있었는데…', '(quietly) We played hide-and-seek that day. There was one kid we never found…'), L('panda', '해가 져서, 다들 그냥 집에 갔어.', 'The sun went down, and everyone just went home.'),
      L('mong', '…아무도 "다음에 또 하자" 안 했구나.', '…So nobody said "let\'s play again."'), L('panda', '이 랜턴 가져가. 오늘 밤엔 불 켜 두자.', "Take this lantern. Let's leave a light on tonight.")],
    reward: { furn: 'lantern', coins: 350 } },
  { id: 'bld-boss', room: 'lobbymap', title: K('로비의 마지막 수수께끼', 'The Last Riddle in the Lobby'), cast: 'nerd',
    intro: [L('nerd', '마지막 단계야. 자물쇠 넷, 찢어진 번호 셋, 레버 하나.', 'Final stage. Four locks, three torn codes, one lever.'), L('robot', '삐빅. 성공 확률 계산 중… 몽글이라면 생략.', "BEEP. Calculating odds… skipped. It's Mongle."), L('mong', '마지막 숨바꼭질. 가 보자.', "The last hide-and-seek. Let's go.")],
    secret: 'diary',
    lines: { tap: [K('논리적으로 생각해 봐!', 'Think logically!'), K('삐빅. 힌트: 위를 봐.', 'BEEP. Hint: look up.'), K('거의 다 왔어!', 'Almost there!')] },
    outro: [L('nerd', '상자 안엔… 동네 친구들이 쓴 쪽지야.', 'Inside the box… notes from everyone in town.'), L('mong', '(쪽지마다) "다음엔 몽글이네서!"', '(every note says) "Next time, at Mongle\'s!"'), L('robot', '삐빅. 동행 기록 저장. 삭제하지 않음.', 'BEEP. Trip saved. Keeping this one.'), L('nerd', '이 레코드장 가져가. 퍼즐은 끝. 음악은 계속.', 'Take this record cabinet. Puzzles end. Music doesn\'t.')],
    reward: { furn: 'recordcab', coins: 600 } },
];

// ── chapter cinematics: why we go somewhere new (stages.js REGION_INTRO, rewritten in place)
const REGION = {
  apt: { title: K('토순이네 새 집', "Bunbun's New Place"), cast: ['mong', 'bunny'], lines: [L('bunny', '몽글아! 새 집이야! 아직 상자투성이지만.', 'Mongle! New place! Still all boxes, though.'), L('bunny', '집들이 와 줘서 고마워!', 'Thanks for coming to my housewarming!'), L('mong', '…발자국도 이쪽으로 왔어.', '…The footprints came this way, too.')] },
  alley: { title: K('순찰 가자!', 'Patrol Time!'), cast: ['mong', 'shiba', 'grumpy'], lines: [L('shiba', '약속한 순찰이다! 오늘은 골목.', 'Patrol time, like I promised! Today, the alleys.'), L('shiba', '삐딱이네 골목은 조심해. 걔는 말을 좀… 삐딱하게 해.', "Careful in Grumpy's alley. Grumpy talks a little… grumpy."), L('mong', '…그래서 삐딱이구나.', '…Hence the name.')] },
  shop: { title: K('배고픈데 편의점 가자!', "Snack Run!"), cast: ['mong', 'shiba', 'grumpy'], lines: [L('mong', '(꼬르륵)', '(grumble)'), L('shiba', '사건이다. 네 배에서.', "We've got an emergency. In your stomach."), L('grumpy', '…나도 간다. 배고파서야. 너 때문 아니고.', "…I'm coming too. 'Cause I'm hungry. Not 'cause of you.")] },
  park: { title: K('공원으로 소풍', 'Picnic in the Park'), cast: ['mong', 'frog', 'squirrel'], lines: [L('frog', '개굴! 배도 불렀으니 공원으로 소풍 가자!', "Ribbit! We're full, so let's picnic in the park!"), L('squirrel', '먹을 건 내가 챙겼어. …숨겨 놨지만.', "I packed the food. …And hid it.")] },
  camp: { title: K('산길 따라 캠핑장', 'Up the Trail to Camp'), cast: ['mong', 'panda', 'sleepy'], lines: [L('panda', '주말엔 산이지. 어릴 때 다 같이 캠핑장에 뭘 묻었어.', 'Weekends are for mountains. We all buried something at the campsite as kids.'), L('panda', '꼭대기에 가면 보여 줄게. 천천히 가자. 기다려 줄게.', "I'll show you at the top. Let's take it slow. I'll wait for you.")] },
  building: { title: K('약속한 퍼즐', 'The Promised Puzzle'), cast: ['mong', 'nerd', 'robot'], lines: [L('nerd', '몽글아, 약속 기억하지? 너만을 위한 퍼즐.', 'Mongle, remember my promise? A puzzle just for you.'), L('robot', '삐빅. 로비부터 옥상까지, 단서가 층마다 숨겨져 있음.', 'BEEP. Clues hidden on every floor, lobby to rooftop.'), L('mong', '…옥상에서 색깔 빛이 새어 나와.', "…There's colored light leaking from the rooftop.")] },
};

// ── the boss games: a few lines before (lead) and after the first win (out), by game and set-up
const GAME = {
  'whack:0': { lead: [L('frog', '개굴! 수풀 놀이 할 사람?', 'Ribbit! Who wants to play in the bushes?'), L('frog', '고개 내밀 때 톡 하면 찾은 거야.', "Tap us when we pop up. That's a catch!"), L('raccoon', '나도 낄래~ 근데 나 누르면 하나 빼기다?', 'Count me in~ Tap me, though, and you lose one.'), L('mong', '…누구야.', "…Who's that?")],
    out: [L('frog', '손 빠르다! 내 낚시터에도 와. 거기선 못 찾을걸?', "Fast hands! Come to my fishing spot. You won't find me there.")] },
  'yasik:0': { lead: [L('bunny', '몽글아! 오늘 너네 집에서 자도 돼?', 'Mongle! Can I sleep over at your place tonight?'), L('bunny', '(꼬르륵) …들었어?', '(grumble) …Did you hear that?'), L('mong', '네 배.', 'Your stomach.'), L('bunny', '냉장고에 푸딩 있잖아…', "There's pudding in the fridge…"), L('mom', '얘들아~ 이제 자야지~', 'Kids~ Bedtime~'), L('mong', '…이번엔 우리가 안 들킬 차례.', '…Our turn to stay out of sight.')],
    out: [L('bunny', '푸딩 두 개야! 하나는 내 거.', "Two puddings! One's mine."), L('mom', '…냉장고 문은 닫고 자라~', '…Close the fridge before bed~'), L('mong', '…!!', '…!!')] },
  'blanket:0': { lead: [L('bunny', '오늘 다 같이 파자마 파티! 불 끄고 이불 뒤집어쓰기!', "Pajama party tonight! Lights off, blankets on!"), L('bunny', '누가 누군지 맞혀 봐!', "Guess who's who!")],
    out: [L('bear', '으헤헤… 이제 자도 돼?', 'Heh heh… can I sleep now?'), L('bunny', '안 돼! 아직 밤 안 샜어!', "No! We haven't stayed up all night yet!")] },
  'wakeup:0': { lead: [L('cat', '졸졸이는 밤새 창밖 보고 아침에 자.', 'Dozy watches the window all night and sleeps all morning.'), L('mong', '졸졸아, 까만 애 봤어?', 'Dozy, did you see a black one?'), L('sleepy', '드르렁~ 쿨쿨…', 'Zzz… snore…'), L('cat', '…깨워야겠다냥.', "…We'll have to wake Dozy up.")],
    out: [L('sleepy', '음냐… 까만 애? 봤어… 매일 밤 혼자 걸어가.', 'Mmh… the black one? Yeah… it walks by alone every night.'), L('sleepy', '아파트 쪽으로… 쿨…', 'Toward the apartments… zzz…'), L('mong', '…혼자.', '…Alone.'),
      L('bunny', '몽글아! 나 아파트로 이사 가!', "Mongle! I'm moving to the apartments!"), L('bunny', '집들이 와 줄 거지?', "You'll come to my housewarming, right?"), L('mong', '응. 다음엔 너네 새 집에서.', 'Yeah. Next time, at your new place.'), L('bunny', '그리고 그다음엔 너네 집! 약속!', 'And after that, your place! Promise!')] },
  'hotel:2': { lead: [L('bunny', '몽글 호텔 3박 4일! 집들이 기념 여행이야!', 'Mongle Hotel, four days, three nights! Housewarming trip!')] },
  'yasik:1': { lead: [L('sundae', '같이 먹을 건 이미 준비했어. 문제는…', 'The snacks are ready. The problem is…'), L('mong', '…엄마.', '…Mom.')], out: [L('mong', '…귤 껍질 소리에 맞춰 걸었어.', '…I walked in time with the tangerine peeling.')] },
  'wakeup:1': { lead: [L('panda', '졸졸이 또 안 일어나.', "Dozy won't get up again."), L('mong', '…약속했으니까. 깨워서 같이 내려가자.', "…I promised. Let's wake Dozy and walk down together.")], out: [L('sleepy', '음냐… 응. 같이.', 'Mmh… yeah. Together.')] },
  // 쉬어가기 (10/18 정본 배치: 두더지 3·27·58, 이불 8·46, 무궁화 24·63) — 너굴이 rivalry runs through them
  'whack:1': { lead: [L('raccoon', '이번엔 변장했지롱. 날 찾을 수 있을까~?', "I'm in disguise this time. Think you can spot me~?"), L('mong', '…꼬리가 보이는데.', '…I can see your tail.')] },
  'whack:2': { lead: [L('frog', '개굴! 수풀 피버 타임! 다들 엄청 빨라.', "Ribbit! Bush fever time! Everyone's super fast.")] },
  'blanket:1': { lead: [L('bunny', '소풍 끝나고 낮잠 파티! 근데… 이불 하나가 수상해.', 'Post-picnic nap party! But… one blanket looks suspicious.'), L('raccoon', '(이불 속에서) 쉿.', '(under a blanket) Shh.')] },
  'redlight:0': { lead: [L('raccoon', '운동장에선 이거지. 무궁화 꽃이 피었습니다!', 'Schoolyard rules: Red light, green light!'), L('mong', '…또 너굴이.', '…Rocky again.')] },
  'redlight:1': { lead: [L('raccoon', '마지막 무궁화 승부다! 이번엔 안 봐줘.', 'Final red light, green light! No going easy this time.')] },
  'yasik:2': { lead: [L('bunny', '약속했지! 마지막은 너네 집!', 'You promised! The last one is at your place!'), L('shiba', '(벌써 잠듦) 쿨… (꼬리만 붕붕)', '(already asleep) zzz… (tail still wagging)'), L('mong', '…멍뭉이는 뛰면 깨. 살금살금.', '…Woofy wakes up if we run. Tiptoe.')], ending: true },
};
// the small games run by scenes/mini.js: their talk in place of the one in minis.js — the old 손전등 intro was 판다's
// "캠핑의 꽃은…", which came up first in an apartment and again as the building's boss. The rule stays in the host's mouth
// as a game rule (the way kids explain a game); how to touch the screen is on screen.
const MINI = {
  lamp: [L('hamster', '웁웁! 불 꺼진 김에 손전등 술래 하자!', "Mmf! The lights are out anyway. Let's play flashlight tag!"), L('hamster', '불빛에 비친 친구를 톡 하면 찾은 거야!', "Tap whoever's in the light. That's a catch!")],
  'lamp:boss': [L('nerd', '불 끄고 손전등 술래. 이번엔 여덟 명이야.', 'Lights off, flashlight tag. Eight of us this time.'), L('raccoon', '나도 숨는다~ 가짜도 섞어 놨지롱.', "I'm hiding too~ And I mixed in some fakes."), L('mong', '…다 찾을게.', "…I'll find all of you.")],
};
export const miniLead = (kind, boss) => MINI[kind + (boss ? ':boss' : '')] || null;

// ── R1 몰래 숨기 (레벨 보고서 R1, ?hide=1 시제품 — stage.js r1Hide / r1Trail / r1Wrong): you can't watch them hide any more.
// The friend talks from the hideout in their own way: ready, a wrong spot ("여긴 없지롱"), the real spot's tell, close by.
export const R1 = { close: K('눈 감아! 엿보면 안 돼!', 'Close your eyes! No peeking!'), nums: [K('하나', 'One'), K('둘', 'Two'), K('셋', 'Three')] };
// [hidden (from the hideout, after 셋), wrong (a wrong spot was opened), near (3 wrong: close by), trail (몽글이, first look at the trail)]
const R1F = {
  bunny: [['다 숨었다~! (킥)', 'All hidden~! (hee)'], ['여긴 아니지롱~ 킥', 'Not there~ hee'], ['흡, 가, 가까워…!', "Mmph, y-you're close…!"], ['…부스러기. 토순이가 흘렸네.', '…Crumbs. Bunbun dropped them.']],
  bear: [['다 숨었어… 으헤헤…', 'All hidden… heh heh…'], ['거긴… 쿨… 아니야…', 'Not… zzz… there…'], ['으헤헤, 꿀 냄새 나지?', 'Heh heh, smell the honey?'], ['…부스러기. 곰돌이는 먹으면서 숨는구나.', '…Crumbs. Bearie snacks while hiding.']],
  frog: [['개굴! 준비 완료!', 'Ribbit! Ready!'], ['개굴~ 거긴 마른 데잖아!', "Ribbit~ that spot's dry!"], ['개, 개굴… 물 튀었나?', 'R-ribbit… did I splash?'], ['…젖은 발자국. 개굴이다.', "…Wet footprints. That's Froggy."]],
  peng: [['펭! 1등 자리 확보!', 'Peng! Number-one spot secured!'], ['펭! 거긴 너무 따뜻해!', "Peng! That spot's way too warm!"], ['비결 1번… 숨 참기…', 'Tip one… hold your breath…'], ['…바닥이 살짝 차가워. 펭펭이 지나갔어.', '…The floor is a little cold. Pengpeng went by.']],
  cat: [['…다 숨었다냥.', '…Hidden.'], ['흥. 거긴 내 자리가 아니다냥.', "Hmph. That's not my spot."], ['…꼬리 안 나왔지?', "…My tail's not showing, right?"], ['…털. 냥냥이 거.', "…Fur. That's Nyannyan's."]],
  shiba: [['숨었어! 조용히! …멍!', 'Hidden! Quietly! …Woof!'], ['킁… 거긴 냄새도 안 나잖아!', "Sniff… that spot doesn't even smell!"], ['꼬리야, 가만있어…!', 'Tail, stay still…!'], ['…간식 부스러기. 멍뭉이는 못 참지.', "…Snack crumbs. Woofy can't resist."]],
  grumpy: [['…됐어. 찾든가.', "…Done. Find me or don't."], ['틀렸어. …한 번 더 해도 돼.', 'Wrong. …You can try again.'], ['흥, 거의 다 왔네.', 'Hmph. Almost.'], ['…부스러기. 일부러 흘린 것 같은데.', '…Crumbs. Looks like they were dropped on purpose.']],
  squirrel: [['다 숨었어! 나까지!', 'All hidden! Me too!'], ['거긴 도토리만 있지롱!', 'Only acorns there!'], ['헉, 내 비상식량 근처야!', "Eek, that's near my snack stash!"], ['…도토리 껍질. 다람이 길이다.', "…Acorn shells. Chippy's trail."]],
  hamster: [['웁웁! 됐어!', 'Mmf mmf! Ready!'], ['웁! 거긴 씨앗만 있어!', 'Mmf! Only seeds there!'], ['볼이… 빵빵해서… 들킬 것 같아…', "My cheeks… too full… gonna get caught…"], ['…씨앗 껍질. 햄찌다.', "…Seed shells. That's Hammy."]],
  sundae: [['다 숨었어~ 녹기 전에 와!', 'All hidden~ Come before I melt!'], ['거긴 아니야~ 빨리빨리!', 'Not there~ Hurry, hurry!'], ['맞아, 시원한 쪽!', 'Yes, the cool side!'], ['…끈적한 시럽 자국.', '…A sticky syrup trail.']],
  skater: [['요! 착지 완료!', 'Yo! Landed it!'], ['거긴 보드도 없잖아~', 'No board over there~'], ['와우, 거의 킥플립 속도다!', 'Whoa, almost kickflip speed!'], ['…바퀴 자국.', '…Wheel tracks.']],
  panda: [['숨었어. 천천히 와.', 'Hidden. Come slowly.'], ['거긴 아니야. 천천히 해.', 'Not there. Take your time.'], ['오, 가까워. 기다릴게.', "Ooh, close. I'll wait."], ['…대나무 잎.', '…A bamboo leaf.']],
  sleepy: [['숨었어… 이제… 잘게…', 'Hidden… now… nap…'], ['거기… 아니야… 쿨…', 'Not… there… zzz…'], ['음냐… 발소리… 가깝다…', 'Mmh… footsteps… close…'], ['…하품 소리가 저쪽에서 났어.', '…A yawn, from over there.']],
  robot: [['삐빅. 은신 완료.', 'BEEP. Stealth complete.'], ['삐빅. 오답. 재탐색 권장.', 'BEEP. Wrong. Recommend new search.'], ['삐빅. 거리 1미터 이내.', 'BEEP. Distance under one meter.'], ['…나사 하나. 큐브봇이다.', "…A loose screw. That's Cubebot."]],
  nerd: [['흠. 준비됐다.', 'Hm. Ready.'], ['흠. 논리적으로 다시 생각해 봐.', 'Hm. Think it through again.'], ['흠, 그 근처가 합리적이지.', 'Hm, that area is the logical choice.'], ['…연필 자국. 박사님 계산 메모.', "…Pencil marks. Doc's math notes."]],
  dj: [['둠칫! 셋업 끝!', 'Boom-tss! Setup done!'], ['거긴 비트가 안 들리잖아!', "Can't hear the beat there!"], ['볼륨 줄여야 하나…', 'Should I turn it down…'], ['…음표 스티커.', '…A music-note sticker.']],
};
const R1_ANY = [['다 숨었다~!', 'All hidden~!'], ['여긴 없지롱~', 'Not here~'], ['히히~ 여기 근처야!', "Hee hee~ I'm close by!"], ['…부스러기가 저쪽으로 이어져.', '…Crumbs, leading that way.']];
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
export const ENDING = [L('bunny', '(속닥) 다음엔 어디서 놀까?', '(whispering) Where do we play next?'), L('mong', '우리 집. 이번엔 내가 숨겨 둘게.', "My place. I'll hide something this time."), L('bunny', '좋아. 웃음은 내가 참을게.', "Deal. I'll try not to giggle."),
  L('inky', '(현관문 틈으로 빼꼼) …다음에, 나도 돼?', '(peeking in at the door) …Is "next time" for me too?'), L('mong', '응. 색은 두고 와.', 'Yeah. Leave the colors at home.')];
export const ENDING_CARD = K('숨는 건, 누가 찾아 주길 바라서야.', 'We only hide because we hope someone will come looking.');

// ── my home, the first time (after stage 2): 토순이 comes over and you hide one thing for her
export const HOME_TUT = {
  hello: [L('bunny', '여기가 너네 집이구나!', 'So this is your place!'), L('bunny', '이거 숨겨 봐. 아무 데나!', 'Hide this. Anywhere you like!')],
  both: K('아래에서 숨길 물건을 고르고, 숨길 곳을 톡', 'Pick something below, then tap where to hide it'),
  count: [L('bunny', '좋아, 눈 감았다! 하나, 둘, 셋…!', 'Okay, eyes closed! One, two, three…!')],
  found: [L('bunny', '찾았다! 헤헤, 다음엔 더 깊이 숨겨 봐.', 'Found it! Hehe. Hide it deeper next time.')],
  missed: [L('bunny', '으으, 어디 숨겼어?! …알려 주지 마!', "Ugh, where'd you put it?! …Don't tell me!")],
  bye: [L('bunny', '이렇게 숨겨 두고 방을 올리면, 동네 애들이 찾으러 와.', 'Hide stuff, then post your room, and kids in town come looking.'), L('bunny', '오늘은 여기까지! 또 놀러 올게.', "That's it for today! I'll come over again.")],
};

// ── on-screen instructions (▶): one action, stays until it's done, says more when you're stuck
export const DO = {
  donut: K('도넛을 톡', 'Tap the donut'), donut2: K('바닥의 도넛을 톡 눌러 봐', 'Tap the donut on the floor'),
  turnBadge: K('↻ 회전을 톡', 'Tap ↻ Rotate'), turnBadge2: K('오른쪽 아래 ↻ 회전 버튼을 톡', 'Tap the ↻ Rotate button, bottom right'),
  turnDrag: K('옆으로 끌어서 방 돌리기', 'Drag sideways to turn the room'), turnDrag2: K('흔들리는 상자 앞이 보일 때까지 쭉 끌어 봐', 'Keep dragging until you can see the front of the box'),
  turnAny: K('방을 돌려서 상자 앞을 봐', 'Turn the room to see the front of the box'),
  // 기본 조작 F (조작감 세션, 10/18): the turn dial bottom right — push it sideways to turn, up/down to tilt
  turnDial: K('돌림판을 옆으로 밀어 방 돌리기', 'Push the dial sideways to turn the room'),
  turnDial2: K('오른쪽 아래 돌림판을 쭉 밀어서 상자 앞을 봐', 'Push the dial (bottom right) until you see the box front'),
  box: K('상자를 톡', 'Tap the box'), box2: K('흔들리는 상자를 톡 눌러 봐', 'Tap the shaking box'),
  drawer: K('서랍을 톡 해서 열기', 'Tap a drawer to open it'), drawer2: K('서랍이나 문을 톡! 안에 물건이 있어', 'Tap a drawer or door! Things are inside'),
  zoom: K('두 손가락을 벌려 크게 보기', 'Spread two fingers to zoom in'),
  move: K('한 손가락으로 끌어서 옆으로 가 봐', 'Drag with one finger to move around'),
  moveE: K('✥ 이동을 톡 하고, 끌어서 옆으로 가 봐', 'Tap ✥ Move, then drag to look around'),
};
// ── 엄마 몰래 야식, 첫째 밤: the practice the first time (bosses/yasik.js; GPT 안 10/18). The same rules: one action, over
// only when it's done, a more exact line (…2) when you're stuck. Never "stand still and you're safe": in her eyes,
// standing still gets you caught too
export const YASIK_DO = {
  press: K('가고 싶은 바닥을 꾹 누르고 있기', 'Press and hold the floor where you want to go'), press2: K('반짝이는 바닥을 손가락으로 꾹! 떼면 멈춰요', 'Hold your finger on the glowing spot! Let go to stop'),
  cover: K('가구 뒤 반짝이는 곳까지 가기', 'Go to the glowing spot behind the furniture'), cover2: K('반짝이는 곳을 꾹 누르고 있으면 거기로 가요', "Hold the glowing spot and you'll walk there"),
  safe: K('가구 뒤는 엄마 눈에 안 보여요', "Mom can't see you behind furniture"), back: K('가구 뒤로 돌아가기', 'Get back behind the furniture'),
  wait: K('엄마가 돌아봐요! 가구 뒤에서 기다리기', "Mom's looking! Wait behind the furniture"),
  hide: K('얼른 가구 뒤로!', 'Quick, behind the furniture!'), still: K('보이는 데선 멈춰도 들켜요! 가구 뒤로', 'In her sight, standing still gets you caught too! Get behind furniture'),
  phew: K('휴~ 안 들켰다!', "Phew~ she didn't see me!"), now: K('지금이야! 엄마가 다시 TV 봐요', "Now! Mom's watching TV again"),
  go: K('엄마가 TV 볼 때 냉장고 쪽으로', 'While Mom watches TV, head for the fridge'), edge: K('엄마가 돌아볼 때까지 여기서 기다리기', 'Wait here until Mom looks around'),
  away: K('지금이야! 엄마가 딴 데 봐', "Now! Mom's looking away"),
  open: K('냉장고를 톡 해서 열기', 'Tap the fridge to open it'), open2: K('냉장고 문을 손가락으로 한 번 톡!', 'Tap the fridge door once!'),
  grab: K('냉장고를 꾹 눌러 간식 꺼내기', 'Press and hold the fridge to take a snack'), grab2: K('냉장고에서 손가락을 떼지 말고 꾹', "Keep your finger on the fridge, don't let go"),
  shut: K('불빛이 보여요! 냉장고를 톡 해서 닫기', 'She can see the light! Tap the fridge to close it'),
  home: K('방문으로 돌아가기', 'Go back to your door'),
  safeTag: K('안전', 'Safe'), seenTag: K('보여요', 'Seen'),
};
// ── 🆕 cards: a new mechanic, gained the first time you run into it (메모리 teach-by-acquisition)
const CARDS = {
  pad: { t: K('열쇠 자물쇠', 'Key Lock'), s: [['🔒', K('자물쇠가 보이면', 'See a lock')], ['🔑', K('방에서 열쇠를 찾아서', 'Find the key')], ['👆', K('자물쇠를 톡', 'Tap the lock')]] },
  code: { t: K('비밀번호 금고', 'Code Safe'), s: [['🔢', K('금고가 보이면', 'See a safe')], ['📝', K('숫자 쪽지를 찾아서', 'Find the number note')], ['👆', K('금고를 톡', 'Tap the safe')]] },
  color: { t: K('색깔 자물쇠', 'Color Lock'), s: [['🎨', K('색깔 자물쇠가 보이면', 'See a color lock')], ['🃏', K('색깔 순서 카드를 찾아서', 'Find the color order card')], ['👆', K('자물쇠를 톡', 'Tap the lock')]] },
  lever: { t: K('쇠사슬', 'Chains'), s: [['⛓️', K('쇠사슬이 감겨 있으면', 'See chains')], ['🔴', K('벽의 빨간 레버를 찾아서', 'Find the red lever on a wall')], ['👆', K('레버를 톡', 'Tap the lever')]] },
  treat: { t: K('버티는 친구', "Won't Budge"), s: [['😾', K('누가 길을 막고 있으면', 'Someone blocking the way?')], ['🐟', K('좋아하는 간식을 찾아서', 'Find their favorite snack')], ['👆', K('그 친구를 톡', 'Tap them')]] },
  chain: { t: K('연쇄 장치', 'Chain Gadgets'), s: [['🧩', K('하나를 풀면', 'Solve one thing')], ['⚙️', K('다음 장치가 움직여요', 'and the next one moves')], ['👀', K('방이 바뀌는 걸 잘 봐요', 'Watch the room change')]] },
};
K('새로 얻었다!', 'New!'); K('알겠어!', 'Got it!');
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
  recordcab: { who: 'nerd', say: K('레코드장이 여기 있군. 퍼즐은 끝, 음악은 계속.', "There's the record cabinet. Puzzles end, music doesn't."), mong: K('…다음 퍼즐은?', '…And the next puzzle?') },
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
  peng: K('추우면 덜덜. 1등 비결이 만날 때마다 하나씩 늚.', 'Shivers in the cold. One more pro tip every time.'),
  cat: K('꼬리는 못 숨김. 캣타워 꼭대기는 냥냥이 자리.', "Can't hide that tail. The top of the cat tower is Nyannyan's."),
  shiba: K('조용히 해도 꼬리가 먼저 움직임. 순찰은 같이.', 'Stays quiet, but the tail moves first. We patrol together.'),
  grumpy: K('"한 판만"이라면서 다음 판을 준비해 둠. 내일도 이 시간.', 'Says "one game," has the next one ready. Same time tomorrow.'),
  squirrel: K('뭐든 다 숨김. 어디 숨겼는지 적은 메모도.', 'Hides everything. Even the note saying where.'),
  hamster: K('볼이 빵빵해서 들킴. 씨앗은 비상식량.', 'Full cheeks give Hammy away. Seeds are emergency rations.'),
  sundae: K('녹기 전에 찾아 줘야 함. 같이 먹을 간식은 늘 준비.', 'Find Parfait before the melting starts. Always has snacks for two.'),
  skater: K('보드 끝이 삐죽 나옴. 다음엔 보드 태워 주기로.', 'The board tip sticks out. Promised me a ride next time.'),
  panda: K('대나무 씹는 소리로 들킴. 천천히 와도 기다려 줌.', 'Bamboo munching gives Panda away. Waits for me, however slow.'),
  sleepy: K('코 고는 소리로 들킴. 끝나면 깨워서 같이 돌아가기.', 'Snoring gives Dozy away. Wake Dozy at the end, walk home together.'),
  robot: K('삐빅 소리로 들킴. 같이 간 기록은 지우지 않음.', 'Beeps give Cubebot away. Never deletes a trip together.'),
  raccoon: K('자랑하다 들킴. 지면 "봐준 거야".', 'Gets caught bragging. Loses? "I went easy on you."'),
  dj: K('숨어도 베이스 소리가 남. 새 곡은 내가 제일 먼저 듣기.', 'Still loud while hiding. I hear every new track first.'),
  trickster: K('내가 숨긴 걸 몰래 딴 데 옮김. 눈 떼지 말 것.', 'Sneaks my hidden things somewhere else. Keep an eye out.'),
  inky: K('색 묻은 발자국을 남김. 다음엔 같이 놀기.', 'Leaves colored footprints. Next time, we play together.'),
};
export const diaryLine = k => DIARY[k] || null;
export const BOOK = { diary: K('몽글이 일기장', "Mongle's diary"), learned: K('배운 것', 'Learned'), notYet: K('판에서 처음 만나면 얻어요', 'You get it the first time you run into it') };
export const UI = { homeHide: K('내 집에서 숨겨 보기', 'Hide something at home'), keepGoing: K('계속 찾기', 'Keep searching'), homeHideEnd: K('내 집에서 숨기기', 'Hide something at home'), keepPlaying: K('계속 놀기', 'Keep playing') };

// ── binding: walk the campaign once (after the themes are registered) and pin every scene / boss story / count
const typeOf = s => s.tut === 1 ? 'tut1' : s.tut === 2 ? 'tut2' : s.boss ? 'boss' : s.timed ? 'timed' : s.gray ? 'gray' : s.incident ? 'incident' : 'plain';
let B = null;
function bind() {
  if (B) return B;
  B = { scene: {}, host: {}, meet: {}, gray: {}, timed: {} };
  const specs = []; for (let i = 0; i < STAGE_COUNT; i++) specs.push(stageSpec(i));
  const used = new Set(), met = {}; let g = 0, t = 0;
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i], ty = typeOf(s);
    const sc = SCENES.find(x => !used.has(x.id) && x.type === ty && x.room === s.room && (x.night == null || !!s.night === x.night));
    if (sc) { used.add(sc.id); B.scene[i] = sc; }
    const th = THEMES[s.room] || layoutFor(s.room)?.theme;
    const host = sc?.host || (s.timed ? 'raccoon' : th?.friend);
    B.host[i] = host;
    if (ty === 'incident' || ty === 'tut1' || ty === 'tut2') { B.meet[i] = met[host] || 0; met[host] = (met[host] || 0) + 1; }
    if (ty === 'gray') B.gray[i] = g++;
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
  return as(n === 0 ? list[0] : list[1 + ((n - 1) % Math.max(1, list.length - 1))] || list[0], host);
}
export const incidentReveal = (idx, host) => sceneAt(idx)?.reveal || as(fr(host).found, host);
export const hideLine = (idx, host) => sceneAt(idx)?.hide || fr(host).hide;
// bubbles from the hideout: 'clue' (you found something), 'lock' (you touched the locked door), 'stuck' (a while, nothing)
export const hidePool = (idx, host, kind) => sceneAt(idx)?.[kind] || fr(host)[kind] || ANY[kind];
// 흑백판
export const grayPhase = idx => bind().inky(idx);
export function grayIntro(idx, owner, villain) {
  const sc = sceneAt(idx); if (sc?.intro) return villain && !sc.intro.some(l => l.who === 'inky') ? [...sc.intro, L('inky', INKY[grayPhase(idx)].intro)] : sc.intro;
  const g = bind().gray[idx] || 0, out = [L(owner, GRAY_OWNER[g % GRAY_OWNER.length]), L('mong', GRAY_MONG)];
  if (villain) out.push(L('inky', INKY[grayPhase(idx)].intro));
  return out;
}
export const inkyTaunt = (idx, kind) => INKY[grayPhase(idx)][kind] || null;
export const inkyCaught = idx => sceneAt(idx)?.caught || INKY[grayPhase(idx)].caught;
// 먹물이 stays to talk (빌딩 흑백판) and, after that, stays as a friend — no more running off
export const inkyStays = idx => sceneAt(idx)?.id === 'office' || grayPhase(idx) === 3;
export const sceneAfter = idx => sceneAt(idx)?.after || null;
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
  s.textContent = `.ncard{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(42,26,61,.45);z-index:60;animation:pop .3s}
.ncard .nc{background:#fffaf2;border:4px solid #fff;border-radius:26px;box-shadow:0 8px 0 rgba(42,26,61,.35);padding:18px 20px 16px;width:min(340px,calc(100vw - 32px));box-sizing:border-box;text-align:center;color:#3b2a55}
.ncard .nk{display:inline-block;background:#ff6f91;color:#fff;border-radius:999px;padding:3px 12px;font-size:15px;margin-bottom:6px}
.ncard .nt{font-size:26px;margin-bottom:10px}
.ncard .ns{display:flex;align-items:center;gap:10px;text-align:left;font-size:18px;padding:7px 4px;border-top:2px dashed #f1e2d0}
.ncard .ns b{font-size:26px;width:36px;text-align:center}
.ncard .nb{margin-top:12px;background:#7ad37a;color:#fff;border-radius:18px;padding:10px 0;font-size:20px;box-shadow:0 4px 0 #4f9d55;cursor:pointer}
.chooser{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:60}
.chooser .cb{min-width:min(300px,calc(100vw - 48px));padding:13px 18px;border-radius:20px;background:#fff;color:#3b2a55;font-size:20px;border:3px solid #3b2a55;box-shadow:0 5px 0 rgba(42,26,61,.4);text-align:center;cursor:pointer}
.chooser .cb.main{background:#ff8fb0;color:#fff;border-color:#fff}
.endcard{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,14,34,.82);color:#fff;font-size:24px;text-align:center;padding:0 28px;z-index:61;opacity:0;transition:opacity .8s;line-height:1.45;word-break:keep-all}
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
