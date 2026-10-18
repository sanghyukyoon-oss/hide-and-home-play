// Heat test build only (window.SBK_PERF_TEST, or ?hud=1): a small pill at the top that shows the frame-cost savings
// and switches them on/off for an A/B on a real phone. Tap = flip and reload (the choice is kept on this device).
import { OPT_STORE, OPT_IS_ON } from './world.js';

export function installPerfHud(world) {
  const on = OPT_IS_ON;   // what this page really runs with (an explicit ?opt= wins over the stored switch)
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top, 0px) + 62px);z-index:9999;'
    + 'font:600 10px/1.25 system-ui,-apple-system,sans-serif;color:#fff;padding:3px 8px;border-radius:10px;pointer-events:auto;'
    + 'white-space:nowrap;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.25);-webkit-user-select:none;user-select:none;'
    + `background:${on ? 'rgba(30,140,90,.88)' : 'rgba(170,60,60,.88)'}`;
  document.body.append(el);
  el.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    // the address carries the choice (works even where storage is blocked); the stored switch is for pages whose
    // address can't carry one (the claude.ai artifact)
    try { localStorage.setItem(OPT_STORE, on ? '0' : '1'); } catch {}
    const u = new URL(location.href); u.searchParams.set('opt', on ? '0' : '1');
    location.replace(u.toString());
  });
  const gl = world.renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).replace(/^ANGLE \(|\)$/g, '').replace(/^.*Renderer: |^(Apple|Google|Qualcomm|ARM|Intel)[^,]*, /, '').replace(/ ?(OpenGL|Direct3D|Metal|Vulkan).*$/, '').replace(/, Unspecified.*$/, '').slice(0, 24);
  // per second: frames the game updated, and of those how many reached the GPU (whole or in boxes); the share of the
  // screen drawn again is over the updated frames (a skipped frame counts 0, a whole one 100%)
  const P0 = () => ({ t: performance.now(), ...world.perf });
  let q = P0();
  setInterval(() => {
    const p = P0(), dt = (p.t - q.t) / 1000;
    const n = p.frames - q.frames, area = p.area - q.area, drawn = (p.fulls - q.fulls) + (p.parts - q.parts);
    q = p;
    const fps = Math.round(n / dt), dfps = Math.round(drawn / dt), pct = n ? Math.round(100 * area / n) : 0;
    const post = world.post, res = post ? `${post.color.width}×${post.color.height}` : '';
    el.innerHTML = `${on ? '최적화 켬' : '원본(최적화 끔)'} · 갱신 ${fps} · 그림 ${dfps}fps · 다시 그린 면적 ${pct}%<br><span style="font-weight:400;opacity:.85">${res} · ${gpu} · 탭=${on ? '끄기' : '켜기'}</span>`;
  }, 1000);
}
