// Android back button, app build only (10/19 emulator: one press closed the app at once, even mid-stage). PlayForge's WebView
// steps back through the page history when it can and closes the app when it can't, so the app keeps one spare history entry:
// a press uses it up (popstate), we handle the press here, and the next tap puts the entry back. (Chromium skips history
// entries a page adds without a user gesture, so the entry is only ever added from a tap — never at boot or inside popstate.)
// Order: a panel's ✕ (or 계속 on a pause panel) → the scene's pause → the HUD's home button → on the home screen the press
// only warns, and a second press before any tap finds no entry left, so the app closes.
// Android 16 (targetSdk 36) never calls the wrapper's onBackPressed — there the system closes the app whatever the page does;
// that needs a PlayForge fix (reported 10/19). Web and artifact builds don't install this: the browser's back stays theirs.
import { IN_APP } from './build.js';

export function installAppBack(G) {
  if (!IN_APP) return;
  let armed = false;
  addEventListener('pointerup', () => {
    if (armed) return;
    try { history.pushState({ appBack: 1 }, ''); armed = true; } catch {}
  }, true);
  addEventListener('popstate', () => {
    armed = false;
    const ui = G.ui, S = G.scene, scene = document.getElementById('app').dataset.scene;
    if (G.pending || !S) return;
    if (ui.panelOpen) {
      const x = ui.panelOpen.querySelector(':scope > .close');
      if (x) x.press();   // (buttons fire on pointerup — ui.js btn — so press() rather than click())
      else if (S.paused) { ui.closePanel(); S.paused = false; }   // the pause panel has no ✕: back = 계속
      return;   // (any other panel is a choice the player has to make: back leaves it open)
    }
    if (typeof S.pause === 'function' && !S.paused) return S.pause();   // stage, boss, mini: 홈 is in the pause panel
    if (scene !== 'home') {
      const b = ui.hud.querySelector('.ibtn[data-icon="home"]');   // 내 집, 놀러 가기…: their own back (it knows about modes)
      if (b) b.press(); else G.go('home');
      return;
    }
    ui.toast('한 번 더 누르면 게임을 닫아요', '');
  });
}
