// 사건 판의 이야기 (2026-10-17, user: "스토리가 있어야함.. 그래야 정이가고, 캐릭터도 계속 말 걸고 정붙이게"). Every incident
// stage is told by its host: why they hide (their own little reason), what they mutter from the hideout as you get
// closer, what they say when you open them up — and a word about the next room, so you want to see it.
// Lines are plain strings (translated by the dictionary); the hook to the next room names the next host (a pattern).

const P = {
  bunny: { why: ['깜짝 파티 준비 중이었는데… 아직 보면 안 돼! 나 숨을래!', '새 리본 자랑하려고 숨어 있을게. 찾으면 보여 줄게!'], found: '찾았다! 자, 사실 이거 너 주려고 숨겨 둔 거야~', after: '다음엔 내가 술래 할래! 꼭 놀러 와야 해?' },
  bear: { why: ['꿀단지 몰래 먹다 들킬 뻔했어… 나 숨을래!', '낮잠 자기 딱 좋은 곳을 찾았어. 쉿!'], found: '으헤헤, 들켰다~ 꿀 묻은 손 못 봤지?', after: '찾아 준 기념으로 꿀 한 숟갈 나눠 줄게!' },
  frog: { why: ['개굴! 숨바꼭질 챔피언 납신다~', '비 오는 날엔 꼭꼭 숨는 게 개구리 국룰이야!'], found: '개굴?! 내 자리를 어떻게 알았어?', after: '다음엔 연못 속에 숨어 볼까… 개굴!' },
  cat: { why: ['상자만 보면 들어가고 싶어… 냐앙', '햇볕 좋은 곳은 내 거야. 찾아볼 테면 찾아봐냥!'], found: '냐앙~ 들켰다냥. 꼬리가 나와 있었어?', after: '고마워. 츄르 하나 줄게냥!' },
  peng: { why: ['시원한 데 숨어 있을게! 펭!', '얼음 숨바꼭질은 펭귄이 최고야!'], found: '펭! 추워서 덜덜 떨던 거 들켰어?', after: '다음엔 얼음집 지어서 숨을 거야!' },
  hamster: { why: ['볼에 해바라기씨 가득 넣고 숨는 중! 웁웁', '쳇바퀴 소리 안 나게 조용히 있을게!'], found: '웁웁…! 볼이 빵빵해서 들켰나 봐!', after: '씨앗 하나 나눠 줄게. 아껴 먹어!' },
  shiba: { why: ['멍! 간식 냄새 따라왔다가 갇혔어…', '꼬리 흔들면 들키니까 꾹 참을게! 멍!'], found: '멍멍! 꼬리가 멋대로 흔들렸어!', after: '산책 가자! 아, 아니다. 다음 판 가자!' },
  grumpy: { why: ['흥, 오늘은 절대 못 찾을걸?', '시끄러워서 숨은 거야. 찾지 마!'], found: '흥… 이번만 봐준 거야.', after: '…다음에 또 와도 돼. 진짜 이번만이야.' },
  skater: { why: ['보드 타고 휙! 이번엔 내가 이긴다~', '최고 기록 세우는 중이야. 찾아봐!'], found: '와우! 킥플립보다 빠르게 찾았네!', after: '다음엔 보드 태워 줄게!' },
  sundae: { why: ['녹기 전에 찾아 줘~!', '토핑 고르다가 숨어 버렸어!'], found: '휴~ 다 녹을 뻔했어!', after: '체리는 너 가져! 찾아 준 상이야~' },
  squirrel: { why: ['도토리 숨기다가 나도 숨었어!', '겨울잠 연습 중이야. 깨우지 마~'], found: '헉! 도토리 냄새로 찾았지?', after: '내 도토리 지도 반쪽 줄게!' },
  panda: { why: ['판다는 숨는 데 고수야. 대나무 걸고 내기!', '흑백이라 어디든 잘 숨어지거든~'], found: '고수를 이기다니! 인정!', after: '대나무는 약속대로 줄게. 아삭!' },
  sleepy: { why: ['자다가 여기 들어왔는데… 꺼내 줘… 쿨쿨', '조금만 더 잘게… 찾으면 깨워 줘…'], found: '음냐… 벌써 아침이야?', after: '덕분에 푹 잤어. 고마워… 쿨…' },
  robot: { why: ['숨바꼭질 모드 가동! 삐빅', '은신 프로그램 실행 중. 찾을 확률 3퍼센트. 삐빅'], found: '발견됨! 축하 프로토콜 실행! 삐빅삐빅!', after: '데이터 갱신 완료. 넌 최고의 탐정이야.' },
  nerd: { why: ['논리적으로 숨었으니, 논리적으로 찾아 봐.', '실험 중이야. 몇 분 만에 찾는지 재 볼게!'], found: '놀랍군. 계산보다 빨라!', after: '기록 갱신이야. 논문에 써도 될까?' },
  dj: { why: ['비트가 들리는 곳으로 와! 둠칫둠칫~', '새 곡 녹음 중! 찾으면 첫 곡 들려줄게!'], found: '둠칫! 네가 오늘의 MVP!', after: '이 곡 제목은 「찾았다」로 할게!' },
};
const ANY = { why: ['숨바꼭질 하자! 내가 숨을게~', '찾을 수 있으면 찾아봐~!'], found: '들켰다~! 어떻게 찾았어?!', after: '고마워! 다음에도 같이 놀자!' };
export const persona = kind => P[kind] || ANY;

// where the way in is: told by the host as they run off
export const CLUE_TELL = {
  pad: '자물쇠 열쇠는 이 방 어딘가에 있어. 소리를 따라와 봐!',
  code: '비밀번호 쪽지는 어딘가 떨어져 있을걸? 잘 찾아봐!',
  color: '색깔 순서 카드가 있어야 열 수 있지롱~',
  marble: '무지개 그림책이 한 권 없어졌거든? 그 책이 비밀의 열쇠야. 히히',
  gadget: '로봇청소기가 요즘 이상한 걸 물고 다니더라? 히히, 난 높은 데 있을게~',
};
export const HELLO = ['똑똑! 놀러 왔어~', '안녕! 오늘은 뭐 하고 놀까?', '나 왔어! 어디 있어~?'];
// from inside the hideout
export const NEAR = ['헉, 그걸 찾았어?!', '으으, 점점 가까워진다…', '아직 멀었지롱~', '그거 아무 데나 쓰는 거 아니다~?'];
export const BUMP = ['덜컹…! 무슨 소리야?!', '어, 어? 하나 열렸어?!'];
export const BONUS = ['그것도 찾았어? 눈 좋다!', '앗, 그거 내 보물인데!'];
// the hook to the next room
export function nextHook(next) {
  if (!next) return '';
  if (next.boss) return '아 참, 너굴이가 숨바꼭질 대결을 하재! 보물 잘 지켜야 해!';
  if (next.mini) return `아 참, 다음은 보스 놀이 「${next.mini}」래! 각오해!`;
  if (next.gray) return '아 참, 어디선가 색깔 도둑이 나타났대… 조심해!';
  if (next.timed) return '아 참, 너굴이가 시간 재기 놀이 하재! 빨리빨리!';
  return next.name ? `아 참, ${next.name} 요즘 수상해! 다음엔 거기 가 보자` : '';
}
