// Heat test build only (window.SBK_PERF_TEST, or ?hud=1): a small pill at the top that shows the frame-cost savings
// and switches them on/off for an A/B on a real phone. Tap = flip and reload (the choice is kept on this device).
import { OPT_STORE } from './world.js';

export function installPerfHud(world) {
  const on = (() => { try { return localStorage.getItem(OPT_STORE) !== '0'; } catch { return true; } })() && new URLSearchParams(location.search).get('opt') !== '0';
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top, 0px) + 62px);z-index:9999;'
    + 'font:600 10px/1.25 system-ui,-apple-system,sans-serif;color:#fff;padding:3px 8px;border-radius:10px;pointer-events:auto;'
    + 'white-space:nowrap;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.25);-webkit-user-select:none;user-select:none;'
    + `background:${on ? 'rgba(30,140,90,.88)' : 'rgba(170,60,60,.88)'}`;
  document.body.append(el);
  el.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    try { localStorage.setItem(OPT_STORE, on ? '0' : '1'); } catch {}
    const u = new URL(location.href); u.searchParams.delete('opt');
    if (u.toString() === location.href) location.reload(); else location.replace(u.toString());
  });
  const gl = world.renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).replace(/^ANGLE \(|\)$/g, '').replace(/^.*Renderer: |^(Apple|Google|Qualcomm|ARM|Intel)[^,]*, /, '').replace(/ ?(OpenGL|Direct3D|Metal|Vulkan).*$/, '').replace(/, Unspecified.*$/, '').slice(0, 24);
  let t0 = performance.now(), n0 = 0, a0 = 0;
  setInterval(() => {
    const p = world.perf, now = performance.now(), dt = (now - t0) / 1000;
    const n = p.frames - n0, area = p.area - a0, fps = Math.round(n / dt);
    t0 = now; n0 = p.frames; a0 = p.area;
    const pct = n ? Math.round(100 * area / n) : 0;
    const post = world.post, res = post ? `${post.color.width}×${post.color.height}` : '';
    el.innerHTML = `${on ? '최적화 켬' : '원본(최적화 끔)'} · ${fps}fps · 다시 그림 ${pct}%<br><span style="font-weight:400;opacity:.85">${res} · ${gpu} · 탭=${on ? '끄기' : '켜기'}</span>`;
  }, 1000);
}
