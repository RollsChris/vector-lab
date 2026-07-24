/**
 * "Zero → Hero" GLSL fragment-shader course for the Shader Playground.
 *
 * Each chapter is a self-contained, heavily-commented GLSL ES 1.00 fragment shader that the
 * learner loads straight into the editor. The shaders are the lesson: read the comments, run
 * it, then tweak the numbers. Every shader MUST compile cleanly on its own (the e2e suite
 * loads and compiles all of them and fails on any GLSL error).
 *
 * The chapters build strictly on each other:
 *   pixels → coordinates → colour → shapes → edges → time → waves → tiling →
 *   polar → palettes → noise → fractal noise → a 2D "hero" composition →
 *   then a bonus 3D raymarching track (rays → SDF sphere → lighting → a 3D hero solid).
 */
export interface ShaderChapter {
  /** Short title shown on the chapter button. */
  title: string;
  /** One-line "what you'll learn" summary (plain text). */
  idea: string;
  /** The full fragment shader source for this chapter. */
  code: string;
  /** Authored explanation for the chapter's central formula, when it has one. */
  derivationId?: string;
}

export const CHAPTERS: ShaderChapter[] = [
  {
    title: "Hello, pixel",
    idea: "A shader runs once per pixel. Your only job is to set its colour.",
    code: `// CHAPTER 1 — Hello, pixel
// The GPU runs this tiny program ONCE FOR EVERY PIXEL, all at the same time.
// There are no loops over the screen — you just describe ONE pixel's colour.
//
// Set gl_FragColor = vec4(red, green, blue, alpha).
// Each channel runs 0.0 (none) .. 1.0 (full). alpha = opacity (keep it 1.0).

void main() {
  // Flat blue everywhere. Change these three numbers and press Compile.
  gl_FragColor = vec4(0.10, 0.55, 0.90, 1.0);
}`,
  },
  {
    title: "Coordinates (vUv)",
    idea: "vUv tells each pixel WHERE it is: x = 0→1 left→right, y = 0→1 bottom→top.",
    code: `// CHAPTER 2 — Where am I? (vUv)
// Every pixel is handed its position in "vUv": a vec2 that goes
//   x: 0.0 on the left  -> 1.0 on the right
//   y: 0.0 at the bottom -> 1.0 at the top
// Feed those numbers straight into colour to SEE them:
//   red   = vUv.x  (brighter to the right)
//   green = vUv.y  (brighter going up)
// The black corner is (0,0); the yellow corner is (1,1).

varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
}`,
  },
  {
    title: "Mixing colours",
    idea: "mix(a, b, t) blends colour a into colour b as t goes 0→1.",
    derivationId: "shader-mix",
    code: `// CHAPTER 3 — Blending colours with mix()
// mix(a, b, t) returns a when t = 0, b when t = 1, and a smooth blend between.
// Use vUv.x (which runs 0..1 across the screen) as t to fade one colour to another.

varying vec2 vUv;

void main() {
  vec3 warm = vec3(0.95, 0.30, 0.20); // left colour
  vec3 cool = vec3(0.20, 0.45, 0.95); // right colour
  vec3 col  = mix(warm, cool, vUv.x);
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    title: "Shapes from distance",
    idea: "length(p) measures distance. A disc is just 'distance < radius'.",
    derivationId: "shader-distance-disc",
    code: `// CHAPTER 4 — Your first shape (distance fields)
// Trick: re-centre the coordinates so (0,0) is the MIDDLE of the screen,
// then measure how far each pixel is from the centre with length().
// "Inside a radius" gives you a filled circle.

varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;            // shift so centre is (0,0), range -0.5..0.5
  float d = length(p);          // distance from the centre
  float disc = step(d, 0.30);   // 1.0 when d < 0.30 (inside), else 0.0
  gl_FragColor = vec4(vec3(disc), 1.0);
}`,
  },
  {
    title: "Soft edges & glow",
    idea: "smoothstep() fades smoothly between two values — anti-aliased edges and glows.",
    derivationId: "shader-smoothstep",
    code: `// CHAPTER 5 — Hard vs soft edges (smoothstep)
// step() gives a hard, jagged edge. smoothstep(a, b, x) ramps smoothly from
// 0 to 1 as x goes from a to b — perfect for clean edges and soft glows.

varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float d = length(p);

  // 1.0 inside the disc, fading to 0.0 across a thin soft rim (0.28 -> 0.30):
  float circle = 1.0 - smoothstep(0.28, 0.30, d);

  // A soft halo: bright near the centre, falling off with distance.
  float glow = 0.03 / d;

  vec3 col = vec3(circle) + glow * vec3(0.25, 0.6, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    title: "Animate with time",
    idea: "u_time is seconds. Feed it into sin()/cos() to make things move.",
    derivationId: "shader-remap-sine",
    code: `// CHAPTER 6 — Adding time
// u_time is the number of seconds since the lesson opened (it keeps climbing).
// sin() and cos() swing between -1 and 1, so "0.5 + 0.5 * sin(...)" gives a
// value that breathes between 0 and 1. Drive a colour blend with it.

uniform float u_time;
varying vec2 vUv;

void main() {
  float pulse = 0.5 + 0.5 * sin(u_time * 2.0);   // breathes 0..1
  vec3 dark = vec3(0.08, 0.10, 0.20);
  vec3 hot  = vec3(0.95, 0.45, 0.20);
  gl_FragColor = vec4(mix(dark, hot, pulse), 1.0);
}`,
  },
  {
    title: "Waves",
    idea: "Put POSITION inside sin() for stripes; add u_time to make them travel.",
    derivationId: "shader-travelling-wave",
    code: `// CHAPTER 7 — Waves (sin of position + time)
// Feeding POSITION into sin() makes repeating stripes. The number 30.0 sets how
// many stripes; subtracting u_time slides them sideways so they travel.

uniform float u_time;
varying vec2 vUv;

void main() {
  float wave = 0.5 + 0.5 * sin(vUv.x * 30.0 - u_time * 4.0);
  vec3 col = vec3(wave) * vec3(0.4, 0.9, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    title: "Repetition (fract)",
    idea: "fract(x) keeps only the fractional part, so patterns repeat in a grid.",
    derivationId: "shader-fract-tiling",
    code: `// CHAPTER 8 — Repeating a pattern (fract)
// fract(x) throws away the whole-number part, leaving 0..1 that resets over and
// over. Multiply the coordinates up first, take fract(), and ONE cell tiles the
// whole screen. Here: a grid of soft dots, gently drifting with time.

uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 cell = fract(vUv * 6.0 + vec2(u_time * 0.10, 0.0)); // 6x6 tiles, drifting
  float d = length(cell - 0.5);                            // distance to cell centre
  float dot = 1.0 - smoothstep(0.20, 0.25, d);
  gl_FragColor = vec4(vec3(dot) * vec3(0.3, 0.9, 0.7), 1.0);
}`,
  },
  {
    title: "Polar (rings & rays)",
    idea: "radius = length(p), angle = atan(p.y, p.x). Pattern the angle for rays, radius for rings.",
    derivationId: "shader-polar",
    code: `// CHAPTER 9 — Polar coordinates (angle & radius)
// Instead of x/y, describe a pixel by how FAR it is from the centre (radius) and
// which DIRECTION it lies in (angle). A pattern in the angle makes RAYS; a pattern
// in the radius makes RINGS. Multiply them together and spin with time.

uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);            // radius
  float a = atan(p.y, p.x);       // angle in radians

  float rays  = 0.5 + 0.5 * sin(a * 8.0 + u_time);
  float rings = 0.5 + 0.5 * sin(r * 40.0 - u_time * 2.0);

  gl_FragColor = vec4(vec3(rays * rings), 1.0);
}`,
  },
  {
    title: "Colour palettes",
    idea: "0.5 + 0.5*cos(6.2831*(t+offset)) turns one number into smooth rainbow colour.",
    derivationId: "shader-palette",
    code: `// CHAPTER 10 — Cosine colour palettes
// A famous trick (Inigo Quilez): shift three cosine waves to turn a SINGLE number
// 't' into a rich, smooth colour. Change the offsets to invent your own palette.

uniform float u_time;
varying vec2 vUv;

vec3 palette(float t) {
  // The vec3 offsets push red/green/blue out of phase = a rainbow.
  return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.00, 0.33, 0.67)));
}

void main() {
  float t = vUv.x + 0.2 * sin(vUv.y * 10.0 + u_time);
  gl_FragColor = vec4(palette(t), 1.0);
}`,
  },
  {
    title: "Randomness & noise",
    idea: "GPUs have no rand(). A hash + smooth blend gives 'value noise' — the basis of textures.",
    derivationId: "shader-value-noise",
    code: `// CHAPTER 11 — Faking randomness (value noise)
// The GPU has no rand(), so we HASH a position into a pseudo-random number.
// Hashing the corners of a grid and smoothly blending between them gives
// "value noise" — soft random blobs that underlie clouds, terrain and textures.

uniform float u_time;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);              // smooth the blend (no hard cells)
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float n = noise(vUv * 8.0 + u_time * 0.3);
  gl_FragColor = vec4(vec3(n), 1.0);
}`,
  },
  {
    title: "Fractal noise (fbm)",
    idea: "Stack noise layers at doubling detail to get clouds, smoke and marble.",
    derivationId: "shader-fbm",
    code: `// CHAPTER 12 — Layered noise (fbm)
// One layer of noise looks blobby. Add several layers, each at DOUBLE the
// frequency and HALF the strength, and you get natural-looking detail:
// "fractional Brownian motion" (fbm) — the heart of clouds, smoke and marble.

uniform float u_time;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),            hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p){
  float value = 0.0;
  float amp = 0.5;
  for (int k = 0; k < 5; k++) {   // 5 layers ("octaves")
    value += amp * noise(p);
    p *= 2.0;                     // finer detail each layer
    amp *= 0.5;                   // but fainter
  }
  return value;
}

void main() {
  float n = fbm(vUv * 4.0 + vec2(u_time * 0.2, 0.0));
  vec3 col = mix(vec3(0.05, 0.10, 0.20), vec3(0.90, 0.95, 1.0), n);
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    title: "2D hero",
    idea: "Domain-warped fbm + polar swirl + palette + time + mouse. Every piece is from earlier chapters.",
    derivationId: "shader-domain-warp",
    code: `// CHAPTER 13 — 2D HERO: everything at once
// Read it slowly: every technique here came from an earlier chapter.
//  • fbm noise (Ch 11-12)     • polar angle/radius (Ch 9)
//  • cosine palette (Ch 10)   • time + mouse        • a soft vignette (Ch 5)
// "Domain warping" = feeding noise into the input of more noise, for that
// liquid, marbled look. Move your mouse over the canvas.

uniform float u_time;
uniform vec2  u_mouse;
varying vec2  vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),            hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

vec3 palette(float t){ return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67))); }

void main() {
  vec2 p = vUv - 0.5;
  p += (u_mouse - 0.5) * 0.5;                 // the mouse drags the whole field
  float r = length(p);
  float a = atan(p.y, p.x);

  // Domain warp: noise feeding noise for a liquid, marbled flow.
  vec2 q = vec2(fbm(p * 3.0 + u_time * 0.10),
                fbm(p * 3.0 - u_time * 0.15));
  float n = fbm(p * 3.0 + q * 2.0 + vec2(cos(u_time * 0.2), sin(u_time * 0.2)));

  float swirl = 0.5 + 0.5 * sin(a * 3.0 + r * 10.0 - u_time);
  vec3 col = palette(n + swirl * 0.3 + u_time * 0.05);

  col *= smoothstep(0.90, 0.20, r);           // darken the edges (vignette)
  gl_FragColor = vec4(col, 1.0);
}`,
  },

  // ── Bonus track: true 3D with raymarching ─────────────────────────────────────
  {
    title: "3D · rays per pixel",
    idea: "Pretend each pixel fires a ray into a 3D world. Build the ray, colour it by direction.",
    derivationId: "shader-ray",
    code: `// CHAPTER 14 — Going 3D: one ray per pixel
// "But the quad is flat — how can it be 3D?" Here's the trick the whole industry
// uses (Shadertoy, demos, even some games): we PRETEND each pixel fires a ray
// into an imaginary 3D world, and work out what that ray would hit.
//
// A ray needs two things:
//   ro = ray origin     (where the camera sits)
//   rd = ray direction  (which way THIS pixel looks — slightly different per pixel)
//
// To see the idea, just colour each pixel by its ray direction.

uniform vec2 u_resolution;
varying vec2 vUv;

void main() {
  // Centre the coords and fix the aspect ratio so shapes won't look stretched.
  vec2 uv = vUv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  vec3 ro = vec3(0.0, 0.0, 2.0);            // camera, 2 units in front of the scene
  vec3 rd = normalize(vec3(uv, -1.0));      // each pixel looks a touch differently

  // Map the x/y/z of the direction to red/green/blue so you can SEE the spread.
  gl_FragColor = vec4(rd * 0.5 + 0.5, 1.0);
}`,
  },
  {
    title: "3D · a sphere (SDF)",
    idea: "An SDF says how far a point is from a shape. March the ray forward until it touches.",
    derivationId: "shader-sdf-raymarch",
    code: `// CHAPTER 15 — A real 3D sphere (signed distance + raymarching)
// A "signed distance function" (SDF) answers: how far is this point from the shape?
//   sdSphere(p, r) = length(p) - r   (negative = inside, 0 = exactly on the surface)
//
// RAYMARCHING: start at the camera and repeatedly step forward by the distance the
// SDF reports. That distance is the BIGGEST step we can take without overshooting,
// so we creep right up to the surface, then stop. No triangles needed.

uniform vec2 u_resolution;
varying vec2 vUv;

float sdSphere(vec3 p, float r) { return length(p) - r; }
float map(vec3 p) { return sdSphere(p, 1.0); }   // "the scene" = one sphere

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));

  float t = 0.0;           // how far we've travelled along the ray
  float hit = 0.0;
  for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;  // current position on the ray
    float d = map(p);      // distance to the nearest surface
    if (d < 0.001) { hit = 1.0; break; }   // close enough — we hit it
    t += d;                // safe step forward
    if (t > 20.0) break;   // shot off into empty space — give up
  }

  gl_FragColor = vec4(vec3(hit), 1.0);     // white where we hit, black where we missed
}`,
  },
  {
    title: "3D · light & normals",
    idea: "The SDF's gradient is the surface normal — use it for diffuse + specular lighting.",
    derivationId: "shader-lighting",
    code: `// CHAPTER 16 — Lighting a 3D surface (normals)
// A white blob isn't very 3D. To shade it we need the surface NORMAL — the
// direction the surface faces. With an SDF we get it almost free: the gradient
// (how the distance changes as we nudge x, y, z a hair) points straight outward.
// Diffuse light = how directly the normal faces the light. Add a shiny highlight
// and you have a believable solid.

uniform vec2  u_resolution;
uniform float u_time;
varying vec2  vUv;

float sdSphere(vec3 p, float r) { return length(p) - r; }
float map(vec3 p) { return sdSphere(p, 1.0); }

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));

  float t = 0.0; bool hit = false; vec3 p = ro;
  for (int i = 0; i < 80; i++) {
    p = ro + rd * t;
    float d = map(p);
    if (d < 0.001) { hit = true; break; }
    t += d; if (t > 20.0) break;
  }

  vec3 col = vec3(0.05, 0.07, 0.12);                 // background
  if (hit) {
    vec3 n = calcNormal(p);
    vec3 lightDir = normalize(vec3(sin(u_time), 0.6, cos(u_time)));   // light orbits
    float diff = max(dot(n, lightDir), 0.0);                          // diffuse
    float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0); // highlight
    col = vec3(0.2, 0.5, 1.0) * diff + vec3(1.0) * spec + 0.05;
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    title: "3D hero · morphing solid",
    idea: "Rotation, two SDFs melted with smin, a torus, palette colour, mouse-look camera and rim light.",
    derivationId: "shader-smin-composition",
    code: `// CHAPTER 17 — 3D HERO: a morphing, lit solid you can orbit
// Everything from chapters 14-16, plus a few classic tricks:
//   • rotate the scene with time (mat2 rotation)
//   • a torus SDF alongside the sphere
//   • smin() — a "smooth minimum" that MELTS two shapes together like metaballs
//   • a cosine palette for colour, a rim/fresnel glow, and gamma correction
//   • move your MOUSE to orbit the camera

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
varying vec2  vUv;

mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
// Smooth minimum: like min(a,b) but blends across a band of width k.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
vec3 palette(float t) { return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67))); }

float map(vec3 p) {
  p.xz *= rot(u_time * 0.5);                       // spin the whole scene
  p.xy *= rot(u_time * 0.3);
  float s  = sdSphere(p - vec3(0.6 * sin(u_time), 0.0, 0.0), 0.7);
  float to = sdTorus(p, vec2(1.0, 0.3));
  return smin(s, to, 0.5);                          // melt them together
}
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  // Camera orbits the centre; the mouse tilts it.
  vec3 ro = vec3(0.0, 0.0, 4.0);
  ro.yz *= rot((u_mouse.y - 0.5) * 2.0);
  ro.xz *= rot((u_mouse.x - 0.5) * 3.0);
  vec3 fwd = normalize(-ro);
  vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up  = cross(fwd, rgt);
  vec3 rd  = normalize(uv.x * rgt + uv.y * up + 1.5 * fwd);

  float t = 0.0; bool hit = false; vec3 p = ro;
  for (int i = 0; i < 90; i++) {
    p = ro + rd * t;
    float d = map(p);
    if (d < 0.001) { hit = true; break; }
    t += d; if (t > 30.0) break;
  }

  vec3 col = vec3(0.03, 0.04, 0.08);
  if (hit) {
    vec3 n = calcNormal(p);
    vec3 l = normalize(vec3(0.8, 0.9, 0.6));
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(reflect(-l, n), -rd), 0.0), 48.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);     // rim light
    vec3 base = palette(length(p) * 0.2 + u_time * 0.05);
    col = base * (0.15 + diff) + spec * vec3(1.0) + fres * vec3(0.3, 0.5, 1.0);
  }
  col = pow(col, vec3(0.4545));                              // gamma correct
  gl_FragColor = vec4(col, 1.0);
}`,
  },
];
