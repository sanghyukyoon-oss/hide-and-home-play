// What this build is (Discovery 26-4, 10/19). The round wants the app's version name visible in the game; keep `version`/`code`
// equal to the APK/AAB's versionName/versionCode and raise both before every new upload. The app zip script turns `qa` on for
// the Debug APK only, so QA's shortcuts (리뷰 모드, 놀이 모음, 새 아트, 판 방식, 새 경제) stay out of the store build.
export const BUILD = { version: '1.0.170', code: 170, qa: false };
export const VERSION_LABEL = `v${BUILD.version} (${BUILD.code})`;
// the Android app (PlayForge WebView) serves the game from this host; everything else is the web or artifact build
export const IN_APP = location.hostname === 'appassets.androidplatform.net';
// QA shortcuts (리뷰 모드, 놀이 모음, 새 아트, 판 방식, 배치 편집, 새 경제): the Debug APK, or any build with ?qa=1 in the address —
// not the public web page any more (③ 10/21, user on 더보기: "쓸데없는것들 지우장"; 배치 편집 is the team's tool, so ?qa=1 keeps it)
export const QA_TOOLS = BUILD.qa || (typeof location !== 'undefined' && /[?&]qa=1(&|$)/.test(location.search));
