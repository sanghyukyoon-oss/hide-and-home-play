// Cartoon post: one clean closed ink line around every object + optional creases + soft AO, supersampled.
//
// Outline source = an object-ID buffer. Every outline group (a furniture body, a drawer/door, an item, a character,
// a wall, the floor…) is drawn with its own ID. A line is drawn where the ID changes, on the nearer object's side
// (ties broken by ID so only one side draws). That closes every silhouette even where objects touch (bed leg on the
// floor, wardrobe against the wall), which depth-only edges cannot do, and it never fires inside a smooth surface.
// Inside one object, a large depth jump (an ear over a head) still draws a line ("overlap"). Normal creases are an
// opt-in extra. Targets get exactly the same treatment as everything else, and nothing outlines through a wall.
//
// Layers: 0 = drawn + outlined, 1 = pick proxies (never drawn), 2 = drawn but not outlined (blob shadows, blush).
// Everything renders at ~2x internal resolution and is box-filtered down, which anti-aliases the ink.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const COMMON = `
uniform sampler2D tDepth, tId;
uniform float near, far;
uniform vec4 fr;            // orthographic frustum in view space: left, right, bottom, top (zoom applied)
#ifdef PACKED
float rawD(vec2 uv){ vec2 b = texture2D(tId, uv).ba; return (floor(b.x * 255. + .5) * 256. + floor(b.y * 255. + .5)) / 65535.; }
#else
float rawD(vec2 uv){ return texture2D(tDepth, uv).x; }
#endif
float lin(vec2 uv){ return near + rawD(uv) * (far - near); }
vec3 viewPos(vec2 uv){ return vec3(mix(fr.x, fr.y, uv.x), mix(fr.z, fr.w, uv.y), -lin(uv)); }
float idAt(vec2 uv){ vec4 t = texture2D(tId, uv); return floor(t.r * 255. + .5) + floor(t.g * 255. + .5) * 256.; }
vec3 nor(vec2 uv){ vec2 xy = texture2D(tId, uv).ba * 2. - 1.; return vec3(xy, sqrt(max(0., 1. - dot(xy, xy)))); }
`;
const ID_VERT = 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const ID_FRAG = `
uniform float uId; varying vec3 vN;
void main(){
#ifdef PACKED
  float v = floor(gl_FragCoord.z * 65535. + .5);
  gl_FragColor = vec4(mod(uId, 256.) / 255., floor(uId / 256.) / 255., floor(v / 256.) / 255., mod(v, 256.) / 255.);
#else
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  gl_FragColor = vec4(mod(uId, 256.) / 255., floor(uId / 256.) / 255., n.x * .5 + .5, n.y * .5 + .5);
#endif
}`;
const AO = `
varying vec2 vUv;
uniform vec2 res; uniform float radius, bias;
${COMMON}
float bayer(vec2 p){ vec2 q = mod(floor(p), 4.); int i = int(q.x + q.y * 4.);
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.; return 0.; }
void main(){
  if (rawD(vUv) > .9999) { gl_FragColor = vec4(0.); return; }
  vec3 P = viewPos(vUv), N = nor(vUv);
  vec3 up = abs(N.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
  vec3 T = normalize(cross(up, N)), B = cross(N, T);
  float rot = bayer(gl_FragCoord.xy) * 6.2832;
  float occ = 0.;
  const int S = 12;
  for (int i = 0; i < S; i++) {
    float f = (float(i) + .5) / float(S);
    float a = rot + float(i) * 2.39996;
    float r = radius * mix(.15, 1., f);
    vec3 s = P + (T * cos(a) + B * sin(a)) * r * .9 + N * (r * .45 + .01);
    vec2 suv = vec2((s.x - fr.x) / (fr.y - fr.x), (s.y - fr.z) / (fr.w - fr.z));
    if (suv.x < 0. || suv.x > 1. || suv.y < 0. || suv.y > 1.) continue;
    float sz = viewPos(suv).z;
    float range = smoothstep(0., 1., radius / max(abs(P.z - sz), 1e-4));
    occ += step(s.z + bias, sz) * range;
  }
  gl_FragColor = vec4(occ / float(S), 0., 0., 1.);
}`;
const BLUR = `
varying vec2 vUv;
uniform sampler2D tAO; uniform vec2 aoRes;
void main(){
  vec2 px = 1. / aoRes; float s = 0.;
  for (int y = -2; y < 2; y++) for (int x = -2; x < 2; x++) s += texture2D(tAO, vUv + (vec2(x, y) + .5) * px).r;
  gl_FragColor = vec4(s / 16., 0., 0., 1.);
}`;
const EDGE = `
varying vec2 vUv;
uniform sampler2D tColor, tAOb;
uniform vec2 res; uniform float thick, innerRatio, overlap, nLo, nHi, innerStr, lineAlpha, tint, tintDark, levels, aoStr, useAO;
uniform vec3 ink, aoTint; uniform float dbg, gray, grayLine;
uniform vec2 grayC; uniform float grayR;
uniform sampler2D tMask; uniform float useMask, blk;
${COMMON}
void main(){
  vec2 px = 1. / res;
  float id0 = idAt(vUv), d0 = lin(vUv);
  // the block mask (see MASK): 0 = no ID change and no steep depth step anywhere this pixel's brush can reach, so the
  // search below could only end with dist = 1e5 — skip it (same result, ~2 taps instead of 25)
  bool look = id0 > .5;
  if (look && useMask > .5) look = texelFetch(tMask, ivec2(gl_FragCoord.xy / blk), 0).r > .5;
  vec2 o[8];
  o[0]=vec2(1,0); o[1]=vec2(-1,0); o[2]=vec2(0,1); o[3]=vec2(0,-1);
  o[4]=vec2(.7071,.7071); o[5]=vec2(-.7071,.7071); o[6]=vec2(.7071,-.7071); o[7]=vec2(-.7071,-.7071);
  // distance (in internal px) to the nearest boundary this pixel owns; coverage = brush width minus that distance
  float dist = 1e5;
  if (look) {
    for (int k = 0; k < 3; k++) {
      float r = thick * (float(k) + 1.) / 3.;
      for (int i = 0; i < 8; i++) {
        vec2 uv = vUv + o[i] * r * px;
#ifdef PACKED
        vec4 tt = texture2D(tId, uv);
        float id1 = floor(tt.r * 255. + .5) + floor(tt.g * 255. + .5) * 256.;
        float d1 = near + (floor(tt.b * 255. + .5) * 256. + floor(tt.a * 255. + .5)) / 65535. * (far - near);
#else
        float id1 = idAt(uv), d1 = lin(uv);
#endif
        bool owns = false;
        if (abs(id1 - id0) > .5) owns = d0 < d1 - .02 || (abs(d0 - d1) <= .02 && id0 > id1);
        else owns = d1 - d0 > overlap;        // same object folding over itself (ear over head)
        if (owns) dist = min(dist, r);
      }
    }
  }
  float step4 = thick / 3.;
  float eo = clamp((thick + step4 * .5 - dist) / step4, 0., 1.);
  float ei = 0.;
#ifndef PACKED
  if (innerStr > 0. && innerRatio > 0. && id0 > .5) {
    vec3 n0 = nor(vUv); float ne = 0.;
    for (int i = 0; i < 8; i++) { vec2 uv = vUv + o[i] * thick * innerRatio * px; if (abs(idAt(uv) - id0) < .5) ne = max(ne, 1. - dot(n0, nor(uv))); }
    ei = smoothstep(nLo, nHi, ne) * innerStr * smoothstep(.22, .5, n0.z) * (1. - eo);
  }
#endif
  float e = max(eo, ei) * lineAlpha;
  vec4 c = texture2D(tColor, vUv);   // premultiplied (opaque scene over a transparent clear)
  vec3 col = c.rgb;
  if (useAO > .5) { float ao = texture2D(tAOb, vUv).r * aoStr; col = mix(col, col * aoTint, clamp(ao, 0., 1.)); }
  // 흑백판: everything drained of colour except what has been found (IDs from 40000 up, see assignIds)
  // (흑백판 끝: with grayR ≥ 0 the colour comes back inside a growing circle round grayC — screen uv, height = 1)
  if (gray > 0. && id0 < 39999.5) { float gk = gray; if (grayR >= 0.) gk *= smoothstep(grayR - .05, grayR + .05, length((vUv - grayC) * vec2(res.x / res.y, 1.)));
    float l = dot(col, vec3(.299, .587, .114)); vec3 gc = vec3(l * 1.04 + .02);
    if (grayLine > .5) {   // 펜화: paper, one pale step of shade, hatching only in the darkest
      float sh = 1. - smoothstep(.2, .3, l), dk = 1. - smoothstep(.07, .12, l);
      float hatch = step(fract((gl_FragCoord.x + gl_FragCoord.y) / 7.), .22) * dk;
      gc = vec3(mix(.975, .86, sh) * (1. - .55 * hatch));
    }
    col = mix(col, gc, gk); }
  if (levels > 0.) col = floor(col * levels + .5) / levels;
  // colour-trace line: a darker, slightly richer version of the object's own colour, mixed with the picked ink.
  // darkened in display (gamma) space so 'tintDark' reads as perceived brightness: .5 = half as bright as the object
  vec3 obj = sqrt(max(col, 0.)) * tintDark; obj *= obj;
  obj = max(mix(vec3(dot(obj, vec3(.299, .587, .114))), obj, 1.25), 0.);
  vec3 line = mix(ink, obj, tint * (1. - grayLine * gray));   // (펜화: plain ink lines)
  gl_FragColor = vec4(col * (1. - e) + line * e, c.a * (1. - e) + e);
  if (dbg > .5) gl_FragColor = vec4(eo, fract(id0 * .137), dist > 1e4 ? 0. : 1., 1.);
}`;
// Block mask for the edge pass (packed ID+depth only). One texel per BLK×BLK block of internal pixels: 1 when, inside
// the block (and one pixel past its right/top side), two side-by-side pixels have different IDs or a depth step above
// T. T = overlap / (2K) with K = the brush reach in pixels, so any same-ID depth jump the edge pass could see over its
// reach (a path of at most 2K steps) shows up as at least one step above T. Then DILATE spreads it over the blocks a
// pixel's brush can reach. Where the result is 0 the edge pass finds nothing anyway.
const MASK = `
uniform sampler2D tId; uniform vec2 res; uniform float near, far, T;
float dAt(vec4 t){ return near + (floor(t.b * 255. + .5) * 256. + floor(t.a * 255. + .5)) / 65535. * (far - near); }
float iAt(vec4 t){ return floor(t.r * 255. + .5) + floor(t.g * 255. + .5) * 256.; }
void main(){
  ivec2 b0 = ivec2(gl_FragCoord.xy) * BLK, mx = ivec2(res) - 1;
  float pid[BLK + 1], pd[BLK + 1];
  float f = 0., lid = 0., ld = 0.;
  for (int j = 0; j <= BLK; j++) for (int i = 0; i <= BLK; i++) {
    vec4 t = texelFetch(tId, clamp(b0 + ivec2(i, j), ivec2(0), mx), 0);
    float id = iAt(t), d = dAt(t);
    if (i > 0 && (abs(id - lid) > .5 || abs(d - ld) > T)) f = 1.;
    if (j > 0 && (abs(id - pid[i]) > .5 || abs(d - pd[i]) > T)) f = 1.;
    pid[i] = id; pd[i] = d; lid = id; ld = d;
  }
  gl_FragColor = vec4(f, 0., 0., 1.);
}`;
const DILATE = `
uniform sampler2D tM; uniform vec2 mres;
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy), mx = ivec2(mres) - 1; float f = 0.;
  for (int y = -R; y <= R; y++) for (int x = -R; x <= R; x++) f = max(f, texelFetch(tM, clamp(c + ivec2(x, y), ivec2(0), mx), 0).r);
  gl_FragColor = vec4(f, 0., 0., 1.);
}`;
// 흑백판 RGB 분리 세기: CSS px at the screen corners while a stage is grey (0 = off; ?gsplit=N to try another)
const GSQ = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('gsplit') : null;
export const GRAY_SPLIT = GSQ != null && GSQ !== '' && !isNaN(+GSQ) ? +GSQ : 1.4;
// and a plain side-to-side split over the whole screen, CSS px (10/21 사용자 "화면 전체는 1.5로" → "전체 좌우 .5로 원복" → "채널 밀기, 전체 .8·가생이 1.5" → "전체 .6, 가생이 1.4"; ?gsplith=) — both numbers are
// the user's to tune: change them here
const GHQ = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('gsplith') : null;
export const GRAY_SPLIT_H = GHQ != null && GHQ !== '' && !isNaN(+GHQ) ? +GHQ : .6;
// 흑백판 펜화 시험 (10/21, Hidden Folks 결 — 결정 전 비교만): ?grayline=1 — white paper and ink lines, the shade one pale grey step
// with a little hatching in the darkest of it
export const GRAY_LINE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('grayline') === '1';
// where it starts, as a share of the way from the middle to a corner (10/21 사용자: 가장자리만이라 차이가 안 보임 → 안쪽부터; ?gsfrom=)
const GFQ = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('gsfrom') : null;
export const GRAY_SPLIT_FROM = GFQ != null && GFQ !== '' && !isNaN(+GFQ) ? +GFQ : .33;
const BRIGHT = `
varying vec2 vUv;
uniform sampler2D tSrc; uniform vec2 srcRes; uniform float th;
void main(){
  vec2 q = 1.5 / srcRes;
  vec3 c = (texture2D(tSrc, vUv + vec2(-q.x, -q.y)).rgb + texture2D(tSrc, vUv + vec2(q.x, -q.y)).rgb
          + texture2D(tSrc, vUv + vec2(-q.x, q.y)).rgb + texture2D(tSrc, vUv + vec2(q.x, q.y)).rgb) * .25;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(th, th + .35, l), 1.);
}`;
const GBLUR = `
varying vec2 vUv;
uniform sampler2D tSrc; uniform vec2 dir;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * .227;
  c += (texture2D(tSrc, vUv + dir * 1.385).rgb + texture2D(tSrc, vUv - dir * 1.385).rgb) * .316;
  c += (texture2D(tSrc, vUv + dir * 3.231).rgb + texture2D(tSrc, vUv - dir * 3.231).rgb) * .07;
  gl_FragColor = vec4(c, 1.);
}`;
const DOWN = `
varying vec2 vUv;
#define SPLIT_MAX ${typeof location !== 'undefined' && new URLSearchParams(location.search).get('gsmode') === 'max' ? 'true' : 'false'}
uniform sampler2D tSrc, tBloom; uniform vec2 outRes, splitC; uniform float sharpen, split, splitH, splitFrom, grade, bloom;
void main(){
  vec2 q = .25 / outRes;   // 4 bilinear taps = box filter over the ~2x2 supersampled footprint
  vec4 c = (texture2D(tSrc, vUv + vec2(-q.x, -q.y)) + texture2D(tSrc, vUv + vec2(q.x, -q.y))
         + texture2D(tSrc, vUv + vec2(-q.x, q.y)) + texture2D(tSrc, vUv + vec2(q.x, q.y))) * .25;
  // 흑백판 RGB 분리 (10/21 사용자: "일괄로 좌우로 약간 … 블루, 레드로, 블루레드만 스크린으로 합성 … 중심점을 화면 가운데로 … 가생이로
  // 갈수록 색수차 범위 커지게"): red to the left and blue to the right by splitH px everywhere, plus a little more outward from
  // the middle of the screen (splitC — the visible screen's centre in this target's uv) growing to split px at the corners.
  // Only red and blue move, and only lighten what is there (a screen-like blend): grey stays clean, the lines get thin
  // red/blue rims. Two more taps; off (0) everywhere else.
  if (split > .001 || splitH > .001) {
    vec2 dv = (vUv - splitC) * vec2(outRes.x / outRes.y, 1.);
    float k = smoothstep(splitFrom, 1., length(dv) / length(vec2(.5 * outRes.x / outRes.y, .5)));
    vec2 off = (vec2(splitH, 0.) + normalize(dv + 1e-5) * split * k * vec2(1., 1.)) / outRes;
    float sr = texture2D(tSrc, vUv + off).r, sb = texture2D(tSrc, vUv - off).b;
    c.r = SPLIT_MAX ? max(c.r, sr) : sr; c.b = SPLIT_MAX ? max(c.b, sb) : sb;
  }
  if (sharpen > .001) {
    // unsharp mask: a blur about one output pixel wide, the difference added back
    vec2 r = 1.1 / outRes;
    vec4 b = (texture2D(tSrc, vUv + vec2(-r.x, 0.)) + texture2D(tSrc, vUv + vec2(r.x, 0.)) + texture2D(tSrc, vUv + vec2(0., -r.y)) + texture2D(tSrc, vUv + vec2(0., r.y))) * .25;
    c.rgb = max(c.rgb + (c.rgb - b.rgb) * sharpen, 0.);
  }
  // 때깔 (10/21 사용자 "색보정이랑 빛번짐 ㄱ"): split tone — the light parts a touch warmer, the shade a touch cooler — and a little more colour in
  // the middle tones; 0 = off (linear light here)
  if (grade > .001) {
    float l = dot(c.rgb, vec3(.2126, .7152, .0722));
    float hi = smoothstep(.18, .75, l), lo = 1. - smoothstep(.02, .16, l);
    c.rgb *= mix(vec3(1.), vec3(1.045, 1.005, .94), hi * grade) * mix(vec3(1.), vec3(.94, .975, 1.07), lo * grade);
    float mid = 1. - abs(sqrt(l) * 2. - 1.);
    c.rgb = max(mix(vec3(l), c.rgb, 1. + .2 * grade * mid), 0.);
  }
  // soft glow round bright lights (night stages only — see bloomOn): a quarter-size blurred bright pass added back
  if (bloom > .001) c.rgb += texture2D(tBloom, vUv).rgb * bloom;
  gl_FragColor = linearToOutputTexel(c);
}`;

// Outline groups: which meshes share one closed outline.
function groupKey(m) {
  for (let o = m; o; o = o.parent) {
    const u = o.userData;
    if (u.item) return o;              // an item group (inside a drawer or not)
    if (u.char) return u.char;         // a whole character
    if (u.og) return u.og;             // any group that should read as one shape (a cloud, a tree)
  }
  const u = m.userData;
  if (u.part) return u.part;           // a drawer, door, lid, cushion… (moves on its own)
  if (u.furn) return u.furn;           // the furniture body
  if (u.wall) return 'wall-' + u.wall;
  if (u.floor) return 'floor';
  return m;                            // anything else outlines on its own
}

export class ToonPost {
  constructor(renderer, { budget = 4.5e6, maxSS = 2, samples = 4, opt = {} } = {}) {
    this.r = renderer; this.budget = budget; this.maxSS = maxSS; this.ss = 1;
    const rt = (o = {}) => new THREE.WebGLRenderTarget(1, 1, o);
    // half-float colour needs one of these; without them (some older GPUs) the target is incomplete and nothing draws
    const ex = renderer.extensions, CT = ex.has('EXT_color_buffer_float') || ex.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.color = rt({ samples, type: CT });
    this.nd = rt({ depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType) });
    this.nd.texture.minFilter = this.nd.texture.magFilter = THREE.NearestFilter;
    // full-screen passes only: no depth buffer (they never depth-test; each one was a screen-sized buffer for nothing)
    this.ao = rt({ depthBuffer: false }); this.aoB = rt({ depthBuffer: false });
    this.comp = rt({ type: CT, depthBuffer: false });
    this.idMat = new THREE.ShaderMaterial({ uniforms: { uId: { value: 0 } }, vertexShader: ID_VERT, fragmentShader: ID_FRAG, side: THREE.DoubleSide, blending: THREE.NoBlending });
    const shared = { tDepth: { value: this.nd.depthTexture }, tId: { value: this.nd.texture }, near: { value: .1 }, far: { value: 200 }, fr: { value: new THREE.Vector4(-1, 1, -1, 1) } };
    this.shared = shared;
    this.u = {
      ...shared, tColor: { value: this.color.texture }, tAOb: { value: this.aoB.texture },
      res: { value: new THREE.Vector2(1, 1) }, thick: { value: 2 }, innerRatio: { value: .6 }, overlap: { value: .25 },
      nLo: { value: .3 }, nHi: { value: .48 }, innerStr: { value: 0 }, lineAlpha: { value: 1 },
      ink: { value: new THREE.Color('#3d2233') }, tint: { value: .35 }, tintDark: { value: .45 }, levels: { value: 0 },
      aoStr: { value: .5 }, useAO: { value: 1 }, dbg: { value: 0 }, aoTint: { value: new THREE.Color('#6e5a8f') }, gray: { value: 0 }, grayLine: { value: GRAY_LINE ? 1 : 0 }, grayC: { value: new THREE.Vector2(.5, .5) }, grayR: { value: -1 },
      tMask: { value: null }, useMask: { value: 0 }, blk: { value: 8 },
    };
    this.au = { ...shared, res: { value: new THREE.Vector2(1, 1) }, radius: { value: .4 }, bias: { value: .015 } };
    this.bu = { tAO: { value: this.ao.texture }, aoRes: { value: new THREE.Vector2(1, 1) } };
    this.du = { tSrc: { value: this.comp.texture }, outRes: { value: new THREE.Vector2(1, 1) }, sharpen: { value: .45 }, split: { value: 0 }, splitH: { value: 0 }, splitC: { value: new THREE.Vector2(.5, .5) }, splitFrom: { value: GRAY_SPLIT_FROM },
      grade: { value: 0 }, tBloom: { value: null }, bloom: { value: 0 } };
    // 때깔 (10/21): the colour grade (gradeWant 0..1, held off while a 흑백판 is grey) and a night glow (bloomOn: set by the stage
    // on night and power-cut stages only, stage.js; bloomStr)
    this.gradeWant = 1; this.bloomOn = false; this.bloomStr = .8;
    this.blA = rt({ depthBuffer: false }); this.blB = rt({ depthBuffer: false });
    this.blu = { tSrc: { value: this.comp.texture }, srcRes: { value: new THREE.Vector2(1, 1) }, th: { value: .5 } };
    this.gbu = { tSrc: { value: this.blA.texture }, dir: { value: new THREE.Vector2(1, 0) } };
    const quad = m => { const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m)); return s; };
    const sm = (uniforms, fragmentShader) => new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
    this.aoScene = quad(sm(this.au, AO));
    this.packed = false;
    this.blurScene = quad(sm(this.bu, BLUR));
    this.edgeScene = quad(sm(this.u, EDGE));
    this.downScene = quad(sm(this.du, DOWN));
    this.brightScene = quad(sm(this.blu, BRIGHT)); this.gblurScene = quad(sm(this.gbu, GBLUR));
    // the edge pass's block mask (opt.mask) and the redraw-only-what-changed path (render(…, rects))
    this.opt = { mask: false, inval: true, ...opt };
    const BLK = 8; this.blk = BLK;
    this.mask = rt({ depthBuffer: false }); this.maskD = rt({ depthBuffer: false });
    for (const t of [this.mask, this.maskD]) t.texture.minFilter = t.texture.magFilter = THREE.NearestFilter;
    this.mu = { tId: shared.tId, res: { value: new THREE.Vector2(1, 1) }, near: shared.near, far: shared.far, T: { value: .02 } };
    this.mdu = { tM: { value: this.mask.texture }, mres: { value: new THREE.Vector2(1, 1) } };
    const msm = (uniforms, fragmentShader, defines) => Object.assign(sm(uniforms, fragmentShader), { defines });
    this.maskScene = quad(msm(this.mu, MASK, { BLK }));
    this.dilMat = msm(this.mdu, DILATE, { R: 1 }); this.dilScene = quad(this.dilMat);
    this.u.tMask.value = this.maskD.texture; this.u.blk.value = BLK;
    this.gl = renderer.getContext();
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.lineCss = 2.2; this.dpr = 1; this.pixelArt = false;
    this.bgClear = new THREE.Color().setRGB(0, 0, .5, THREE.LinearSRGBColorSpace);
    const idMat = this.idMat;
    this._hook = function (r, s, c, g, material) { if (material === idMat) { material.uniforms.uId.value = this.userData.oid || 0; material.uniformsNeedUpdate = true; } };
  }
  // Give every mesh under root its outline-group ID. Call after building or changing the scene.
  assignIds(root) {
    const ids = new Map(); let next = 1;
    root.traverse(m => {
      if (!m.isMesh) return;
      const k = groupKey(m);
      if (!ids.has(k)) ids.set(k, next++);
      // anything under a group marked `colored` keeps its colour in a 흑백판 (its IDs live from 40000 up) — up to a group
      // marked `grayStop` (another piece of furniture, a thing sitting on it: what you found comes back alone)
      let col = false; for (let o = m; o; o = o.parent) { if (o.userData.colored) { col = true; break; } if (o.userData.grayStop) break; }
      m.userData.oid = ids.get(k) % 39000 + (col ? 40000 : 0);
      m.onBeforeRender = this._hook;
    });
    return next - 1;
  }
  // w, h = drawing-buffer size of the canvas.
  setSize(w, h, { dpr = this.dpr, lineCss = this.lineCss, pixelArt = this.pixelArt, maxSS = this.maxSS } = {}) {
    this.dpr = dpr; this.lineCss = lineCss; this.pixelArt = pixelArt; this.maxSS = maxSS; this.w = w; this.h = h;
    this.ss = pixelArt ? 1 : Math.max(1, Math.min(maxSS, Math.sqrt(this.budget / (w * h))));
    const iw = Math.round(w * this.ss), ih = Math.round(h * this.ss);
    this.color.setSize(iw, ih); this.nd.setSize(iw, ih); this.comp.setSize(iw, ih);
    const aw = Math.max(1, Math.round(iw / 2)), ah = Math.max(1, Math.round(ih / 2));
    this.ao.setSize(aw, ah); this.aoB.setSize(aw, ah);
    const mw = Math.ceil(iw / this.blk), mh = Math.ceil(ih / this.blk);
    this.mask.setSize(mw, mh); this.maskD.setSize(mw, mh); this.mu.res.value.set(iw, ih); this.mdu.mres.value.set(mw, mh);
    this.u.res.value.set(iw, ih); this.au.res.value.set(aw, ah); this.bu.aoRes.value.set(aw, ah); this.du.outRes.value.set(w, h);
    this.blA.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4))); this.blB.setSize(this.blA.width, this.blA.height); this.blu.srcRes.value.set(iw, ih);
    this.setLine(lineCss);
    const f = pixelArt ? THREE.NearestFilter : THREE.LinearFilter;
    this.comp.texture.minFilter = this.comp.texture.magFilter = f;
  }
  // Pack depth into the ID buffer (half the texture reads) whenever creases and AO are both off.
  syncPacking() {
    const want = this.u.innerStr.value <= 0 && this.u.aoStr.value <= .001;
    if (want === this.packed) return;
    this.packed = want;
    for (const m of [this.idMat, this.edgeScene.children[0].material]) { if (want) m.defines.PACKED = ''; else delete m.defines.PACKED; m.needsUpdate = true; }
  }
  // at least ~2.2 device px: on a 1x desktop screen the 1.5 px line broke up along long diagonals (roof edges)
  setLine(lineCss) { this.lineCss = lineCss; this.u.thick.value = this.pixelArt ? 1 : Math.max(2.2 * this.ss, lineCss * this.dpr * this.ss); }
  // the brush reach in internal px (K, one extra for float rounding at texel edges) → mask threshold and dilation radius
  _maskSetup() {
    const K = Math.floor(this.u.thick.value + .5) + 1, B = this.blk;
    this.mu.T.value = this.u.overlap.value / (2 * K);
    const R = Math.max(Math.ceil(K / B), Math.floor((B - 1 + K) / B));
    if (this.dilMat.defines.R !== R) { this.dilMat.defines.R = R; this.dilMat.needsUpdate = true; }
  }
  // how far (internal px) an AO sample reaches from its pixel: radius·(.9 + .45) + .01 view units along the screen
  // (see AO: tangent offset ·.9, normal offset ·.45 + .01), plus a pixel for rounding the depth lookups
  aoReach() {
    const fr = this.shared.fr.value, ppu = this.color.width / Math.max(1e-6, fr.y - fr.x);
    return Math.ceil((this.au.radius.value * 1.35 + .01) * ppu) + 3;
  }
  // a depth attachment nobody reads again: tell a tiled GPU not to write it back to memory
  _dropDepth() { if (this.opt.inval) this.gl.invalidateFramebuffer(this.gl.FRAMEBUFFER, [this.gl.DEPTH_ATTACHMENT]); }
  // rects: null = the whole frame; else only these boxes (internal px, [x0,y0,x1,y1], y up) are drawn again — the rest
  // of every buffer still holds the previous frame, which is the same picture there
  render(scene, cam, rects = null) {
    const r = this.r, s = this.shared;
    if (this.bloomOn) rects = null;   // (the glow reaches past any box: a whole frame while it is on)
    this.syncPacking();
    s.near.value = cam.near; s.far.value = cam.far;
    s.fr.value.set(cam.left / cam.zoom, cam.right / cam.zoom, cam.bottom / cam.zoom, cam.top / cam.zoom);
    const prevMask = cam.layers.mask;
    const canDrop = this.color.samples === 0;   // (a multisampled target is resolved by three after the pass)
    const scene3 = (target, scis, fn) => {
      r.setRenderTarget(target);
      for (const b of scis || [null]) {
        if (b) { target.scissor.set(b[0], b[1], b[2] - b[0], b[3] - b[1]); target.scissorTest = true; r.setRenderTarget(target); }
        fn(b);
      }
      target.scissorTest = false;
    };
    const cull = rects && this.cullFor;   // hide meshes that miss a box (no draw call; the picture is the same)
    // 1) colour, layers 0 + 2
    cam.layers.set(0); cam.layers.enable(2);
    scene3(this.color, rects, b => { cull?.(b, true); r.clear(); r.render(scene, cam); });
    if (canDrop) this._dropDepth();
    // 2) object IDs + view normals + depth, layer 0 only
    const bg = scene.background; scene.background = null;
    cam.layers.set(0);
    const sm = r.shadowMap.enabled; r.shadowMap.enabled = false;
    scene.overrideMaterial = this.idMat;
    // empty background: id 0 and, when depth is packed into b/a, the FARTHEST depth (a mid value used to sit behind
    // everything only while the camera range was huge; with a tight range it cut outlines off the back half of a scene)
    this.bgClear.setRGB(0, 0, this.packed ? 1 : .5, THREE.LinearSRGBColorSpace);
    r.setClearColor(this.bgClear, this.packed ? 1 : .5);
    scene3(this.nd, rects, b => { cull?.(b, true); r.clear(); r.render(scene, cam); });
    if (this.packed) this._dropDepth();   // packed: depth lives in the ID buffer, the depth texture is never read
    cull?.(null, false);
    scene.overrideMaterial = null; r.shadowMap.enabled = sm; scene.background = bg;
    r.setClearColor(0x000000, 0);
    cam.layers.mask = prevMask;
    // 3) AO at half internal resolution + 4x4 blur (cancels the 4x4 Bayer rotation pattern)
    const useAO = this.u.aoStr.value > .001 && !this.pixelArt;
    this.u.useAO.value = useAO ? 1 : 0;
    // a box redraw: AO only where a sample could reach the box (its radius on screen), the blur a little further
    const aoReach = useAO && rects ? this.aoReach() : 0;
    if (useAO && rects) {
      const aw = this.ao.width, ah = this.ao.height, h = aoReach + 2;
      const aoBoxes = rects.map(b => [Math.max(0, Math.floor((b[0] - h) / 2)), Math.max(0, Math.floor((b[1] - h) / 2)), Math.min(aw, Math.ceil((b[2] + h) / 2)), Math.min(ah, Math.ceil((b[3] + h) / 2))]);
      scene3(this.ao, aoBoxes, () => { r.clear(); r.render(this.aoScene, this.qCam); });
      scene3(this.aoB, aoBoxes.map(b => [Math.max(0, b[0] - 3), Math.max(0, b[1] - 3), Math.min(aw, b[2] + 3), Math.min(ah, b[3] + 3)]), () => { r.clear(); r.render(this.blurScene, this.qCam); });
    } else if (useAO) {
      r.setRenderTarget(this.ao); r.clear(); r.render(this.aoScene, this.qCam);
      r.setRenderTarget(this.aoB); r.clear(); r.render(this.blurScene, this.qCam);
    }
    // 3b) block mask for the edge pass (full frames: a redraw of a few small boxes just runs the full search there)
    const useMask = this.opt.mask && this.packed && !rects && this.u.dbg.value < .5;
    this.u.useMask.value = useMask ? 1 : 0;
    if (useMask) {
      this._maskSetup();
      r.setRenderTarget(this.mask); r.render(this.maskScene, this.qCam);
      r.setRenderTarget(this.maskD); r.render(this.dilScene, this.qCam);
    }
    // 4) ink + AO at internal resolution (a box redraw reaches one brush width past the box), 5) box-filter down
    // (with AO the ink pass must also redo every pixel whose blurred AO moved: the AO reach + blur + filtering)
    const reach = Math.max(Math.ceil(this.u.thick.value) + 2, aoReach ? aoReach + 10 : 0), W = this.comp.width, H = this.comp.height;
    const er = rects && rects.map(b => [Math.max(0, b[0] - reach), Math.max(0, b[1] - reach), Math.min(W, b[2] + reach), Math.min(H, b[3] + reach)]);
    scene3(this.comp, er, () => { r.clear(); r.render(this.edgeScene, this.qCam); });
    r.setRenderTarget(null);
    // the grey stage's RGB split: only while the whole room is grey — off from the moment the colour starts coming back
    const gon = this.u.gray.value > .5 && this.u.grayR.value < 0, pr = r.getPixelRatio();
    this.du.split.value = gon ? GRAY_SPLIT * pr : 0; this.du.splitH.value = gon ? GRAY_SPLIT_H * pr : 0;
    if (gon) {   // (the middle of what you see: the canvas can reach past the screen, so not simply the target's middle)
      const cv = r.domElement, b = cv.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) this.du.splitC.value.set((innerWidth / 2 - b.left) / b.width, 1 - (innerHeight / 2 - b.top) / b.height);
    }
    this.du.grade.value = this.u.gray.value > .5 && this.u.grayR.value < 0 ? 0 : this.gradeWant;
    if (this.bloomOn) {
      const W4 = this.blA.width, H4 = this.blA.height;
      r.setRenderTarget(this.blA); r.render(this.brightScene, this.qCam);
      this.gbu.tSrc.value = this.blA.texture; this.gbu.dir.value.set(1 / W4, 0); r.setRenderTarget(this.blB); r.render(this.gblurScene, this.qCam);
      this.gbu.tSrc.value = this.blB.texture; this.gbu.dir.value.set(0, 1 / H4); r.setRenderTarget(this.blA); r.render(this.gblurScene, this.qCam);
      r.setRenderTarget(null);
      this.du.tBloom.value = this.blA.texture; this.du.bloom.value = this.bloomStr;
    } else this.du.bloom.value = 0;
    if (er) {
      // the canvas keeps its pixels (preserveDrawingBuffer): only the screen boxes these comp boxes reach are redone
      // (the down pass reads up to ~1.6 output px around a pixel). setScissor takes CSS px.
      const k = 1 / this.ss, pr = r.getPixelRatio(), cw = this.w, ch = this.h;
      r.setScissorTest(true);
      for (const b of er) {
        const m = 3 + Math.ceil(this.du.split.value + this.du.splitH.value), x0 = Math.max(0, Math.floor(b[0] * k) - m), y0 = Math.max(0, Math.floor(b[1] * k) - m), x1 = Math.min(cw, Math.ceil(b[2] * k) + m), y1 = Math.min(ch, Math.ceil(b[3] * k) + m);
        r.setScissor(Math.floor(x0 / pr), Math.floor(y0 / pr), Math.ceil((x1 - x0) / pr) + 1, Math.ceil((y1 - y0) / pr) + 1);
        r.clear(); r.render(this.downScene, this.qCam);
      }
      r.setScissorTest(false);
    } else { r.clear(); r.render(this.downScene, this.qCam); }
  }
}
