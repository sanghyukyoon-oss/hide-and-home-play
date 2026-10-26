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
    const g = x.createRadialGradient(W / 2, H * .44, 0, W / 2, H * .44, H * .62);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.38, '#fffcf7'); g.addColorStop(1, '#f8f1e7');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    try { x.drawImage(gl, 0, 0, W, H); } catch {}
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = fn => raf(t => { fn(t); if (!pending) { pending = true; queueMicrotask(copy); } });
  // 화질 단계 고정(2: 슈퍼샘플 없이 dpr 2 = 정확히 1080×1920) — 느려져도 해상도를 내리지 않는다
  const pin = setInterval(() => {
    const w = window.G && window.G.world; if (!w || !w.setLevel) return;
    clearInterval(pin); const set = w.setLevel.bind(w); set(2); w.setLevel = () => {};
  }, 200);
  window.__rec = { canvas: cv, stream: fps => {
    const s = cv.captureStream(fps || 60), c = window.__recCtx;
    if (c) { c.resume?.(); c.__recDest.stream.getAudioTracks().forEach(t => s.addTrack(t)); }
    return s;
  } };
})();
