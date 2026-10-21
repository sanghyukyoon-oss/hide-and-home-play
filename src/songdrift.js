// 오래 못 찾으면 노래가 빨라짐 (10/21, user: "ㅇㅇ 타이머는 없고 노래만 빨라지면 되지않을까?" — 테스터 두 분 "평화로움을 깨고
// 싶다", 사운드 듣기 페이지 B안): a stage where nothing has been found for a minute plays its song a notch faster every 10 s,
// 1.05 → 1.10 → 1.15 → 1.20, the pitch kept (audio.js A.drift). A find takes it a notch down and the minute starts again once
// it is back to the song as written. Nothing on screen — only the song.
// The clock waits while a talk, a card, a panel, a lesson's hand or 몽글 TV is up (a pause stops update itself); it is not on
// 1판's lesson, 너굴이's timed stages (their own clock), the escape-room boss stage, a visit or a raid, a preview, or a bot.
// ?drift=0 off · ?drift=fast the minute is 6 s and a notch 1 s, with a log line each notch (QA)
const Q = typeof location === 'undefined' ? '' : location.search;
const OFF = /[?&]drift=0(&|$)/.test(Q), FAST = /[?&]drift=fast(&|$)/.test(Q);
const WAIT = FAST ? 6 : 60, STEP = FAST ? 1 : 10, TOP = 4;

const allowed = S => !(OFF || S.idx === 0 || S.spec.tut === 1 || S.spec.timed || S.spec.boss || S.custom || S.preview || S.raidRun);
const gotOf = S => S.targets.reduce((k, t) => k + (t.found ? 1 : 0), 0) + (S.secretFound ? 1 : 0);

export function songDrift(S, dt) {
  const D = S._drift ||= { on: allowed(S), n: 0, since: 0, step: 0, got: gotOf(S) };
  if (!D.on || !S.running || S.result || S.botOn?.() || S.G.bot) return;
  const got = gotOf(S);
  if (got !== D.got) { D.got = got; D.since = 0; D.step = 0; if (D.n) notch(S, D, D.n - 1, 'found'); return; }
  if (S.talking || S.cine || S.tutEls || S.G.tv || S.G.ui.panelOpen) return;
  D.since += dt;
  if (D.n === 0) { if (D.since >= WAIT) notch(S, D, 1, 'wait'); }
  else if ((D.step += dt) >= STEP && D.n < TOP) notch(S, D, D.n + 1, 'step');
}
function notch(S, D, n, why) {
  D.n = n; D.step = 0;
  S.G.audio.drift?.(n);
  if (FAST) console.log('[drift]', why, 'notch', n, 'rate', S.G.audio._drift, 't', S.t.toFixed(1));
}
