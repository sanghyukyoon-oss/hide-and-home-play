// 녹화판 안쪽(게임 창): 1080×1920 고정, WebAudio를 녹음 줄기로 갈라 냄, 매 프레임 합성 캔버스에 옮겨 그림 — 게임 코드는 그대로
(() => {
  Object.defineProperty(window, 'devicePixelRatio', { get: () => 2, configurable: true });   // 540×960 창 × 2 = 1080×1920
  // 소리: 스피커로 가는 모든 연결을 녹음용 출구에도 같이 잇는다
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...a) {
    if (typeof AudioDestinationNode !== 'undefined' && d instanceof AudioDestinationNode) {
      const c = this.context; if (!c.__recDest) { c.__recDest = c.createMediaStreamDestination(); window.__recCtx = c; }
      try { oc.call(this, c.__recDest); } catch {}
    }
    return oc.call(this, d, ...a);
  };
  // 합성 캔버스: 배경(하늘 그림이 없는 판의 CSS 바탕) + 게임 캔버스. 게임이 그린 바로 그 rAF 안에서 옮겨 그린다
  const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  let pending = false;
  const copy = () => {
    pending = false;
    const gl = document.getElementById('gl'); if (!gl) return;
    // (10/26) 판마다 다른 바탕: #app 의 radial-gradient(120% 80% at 50% 30%, #fff 0, --bgA 45%, --bgB 100%)를 그대로 다시 그림
    const app = document.getElementById('app'), cs = app && getComputedStyle(app);
    const A = (cs && cs.getPropertyValue('--bgA').trim()) || '#fffcf7', B = (cs && cs.getPropertyValue('--bgB').trim()) || '#f8f1e7';
    x.save(); x.fillStyle = B; x.fillRect(0, 0, W, H);
    x.translate(W / 2, H * .3); x.scale(1.2 * W / (.8 * H), 1);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, .8 * H);
    try { g.addColorStop(0, '#ffffff'); g.addColorStop(.45, A); g.addColorStop(1, B); } catch { g.addColorStop(0, '#fff'); g.addColorStop(1, '#f8f1e7'); }
    x.fillStyle = g; x.fillRect(-W, -H, W * 4, H * 4); x.restore();
    try { x.drawImage(gl, 0, 0, W, H); } catch {}
    const fx = document.getElementById('fx');   // 반짝이·별 같은 2D 이펙트 층
    if (fx && fx.width) try { x.drawImage(fx, 0, 0, W, H); } catch {}
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = fn => raf(t => { fn(t); if (!pending) { pending = true; queueMicrotask(copy); } });
  // 화질 단계 고정(1: 슈퍼샘플 1.5 + dpr 2 = 1080×1920, 그림자 2048) — 느려져도 내리지 않는다
  // (10/26: 2단계는 이제 그림자 512(저사양 최적화)라 녹화가 거칠었음 → 1단계)
  const pin = setInterval(() => {
    const w = window.G && window.G.world; if (!w || !w.setLevel) return;
    clearInterval(pin); const set = w.setLevel.bind(w); set(1); w.setLevel = () => {};
  }, 200);

  // 녹화판 저장은 본게임과 따로: 이 창의 localStorage 키 앞에 'rec:'를 붙인다(본게임 진행은 건드리지 않음)
  const SP = Storage.prototype, gi = SP.getItem, si = SP.setItem, ri = SP.removeItem, P = 'rec:';
  SP.getItem = function (k) { return gi.call(this, P + k); };
  SP.setItem = function (k, v) { return si.call(this, P + k, v); };
  SP.removeItem = function (k) { return ri.call(this, P + k); };
  // 모든 판 열기(1~70, 보스·놀이 포함) + 튜토리얼 표시 끄기 — 녹화판 저장에만
  const open = setInterval(() => {
    const G = window.G, J = window.__jam; if (!G || !G.save || !J || !J.ready) return;
    clearInterval(open);
    G.save.tut = Object.assign({ move: 1, ftap: 1, ftapRe: 1, dbl: 1 }, G.save.tut || {});
    try { J.call('stageTo', 70); } catch {}
    try { G.persist && G.persist(); } catch {}
  }, 300);
  // 구석 연타: 오른쪽 아래 5번 = UI 전부 숨김/보임, 오른쪽 위 3번 = 다음 판, 왼쪽 위 3번 = 이전 판 (1초 안, 구석 15%)
  const st = document.createElement('style'); st.id = '__recHide';
  const hideUI = on => {
    if (on) { st.textContent = '#app > :not(#gl):not(#bg), body > :not(#app):not(script):not(style){opacity:0 !important}'; document.head.appendChild(st); }
    else st.remove();
    try { parent.__recUI && parent.__recUI.chrome(!on); } catch {}
  };
  let hidden = false; const hits = { br: [], tr: [], tl: [] };
  const zone = (x, y) => {
    const w = innerWidth, h = innerHeight, cx = w * .15, cy = h * .15;
    if (x > w - cx && y > h - cy) return 'br';
    if (x > w - cx && y < cy) return 'tr';
    if (x < cx && y < cy) return 'tl';
    return null;
  };
  const go = d => {
    const G = window.G; if (!G) return;
    const i = G.scene && G.scene.name === 'stage' ? G.scene.idx + d : 0;
    G.go('stage', { idx: Math.max(0, Math.min(69, i)), direct: true });
  };
  let eat = false;   // 이번 손가락은 게임에 넘기지 않는다
  const down = e => {
    const p = e.touches ? e.touches[0] : e, z = zone(p.clientX, p.clientY);
    eat = false; if (!z) return;
    const now = performance.now(), a = hits[z].filter(t => now - t < 1000); a.push(now); hits[z] = a;
    // 게임 화면(3D 캔버스)을 누른 구석 터치는 늘 막고, 구석 HUD 버튼은 첫 번째만 통과시킨다
    const onCanvas = e.target && (e.target.id === 'gl' || e.target === document.body || e.target.id === 'app');
    eat = onCanvas || a.length >= 2;
    if (eat) { e.stopImmediatePropagation(); e.preventDefault(); }
    const need = z === 'br' ? 5 : 3;
    if (a.length >= need) {
      hits[z] = [];
      if (z === 'br') { hidden = !hidden; hideUI(hidden); }
      else go(z === 'tr' ? 1 : -1);
    }
  };
  const block = e => { if (eat) { e.stopImmediatePropagation(); e.preventDefault(); } };
  for (const t of ['pointerdown', 'mousedown', 'touchstart']) addEventListener(t, down, { capture: true, passive: false });
  for (const t of ['pointermove', 'pointerup', 'mouseup', 'touchmove', 'touchend', 'click', 'dblclick']) addEventListener(t, block, { capture: true, passive: false });
  window.__recHide = hideUI;
  window.__rec = { canvas: cv, stream: fps => {
    const s = cv.captureStream(fps || 60), c = window.__recCtx;
    if (c) { c.resume?.(); c.__recDest.stream.getAudioTracks().forEach(t => s.addTrack(t)); }
    return s;
  } };
})();
