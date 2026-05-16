/**
 * CRT / glitch post-process (VFX.js) — after https://codepen.io/fand/pen/YPXBwVd
 */
const CUTON_SESSION_KEY = "aday-blog-cuton-done-v1";
const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
let liteBoot = prefersReducedMotion;
try {
  liteBoot = liteBoot || sessionStorage.getItem(CUTON_SESSION_KEY) === "1";
} catch {
  // ignore
}

if (liteBoot) {
  document.body.classList.add("vfx-off");
} else {
  const postShader = `
precision highp float;
uniform sampler2D src;
uniform vec2 offset;
uniform vec2 resolution;
uniform float time;
out vec4 outColor;

vec4 readTex(vec2 uv) {
  vec4 c = texture(src, uv);
  c.a *= smoothstep(.5, .499, abs(uv.x - .5)) * smoothstep(.5, .499, abs(uv.y - .5));
  return c;
}

vec2 zoom(vec2 uv, float t) {
  return (uv - .5) * t + .5;
}

float rand(vec3 p) {
  return fract(sin(dot(p, vec3(829., 4839., 432.))) * 39428.);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;
  float l = length(p);

  float dist = pow(l, 2.) * .3;
  dist = smoothstep(0., 1., dist);
  uv = zoom(uv, 0.5 + dist);

  vec2 du = (uv - .5);
  float a = atan(p.y, p.x);
  float rd = rand(vec3(a, time, 0.));
  uv = (uv - .5) * (1.0 + rd * pow(l * 0.7, 3.) * 0.3) + .5;

  vec2 uvr = uv;
  vec2 uvg = uv;
  vec2 uvb = uv;

  float d = (1. + sin(uv.y * 20. + time * 3.) * 0.1) * 0.05;
  uvr.x += 0.0015;
  uvb.x -= 0.0015;
  uvr = zoom(uvr, 1. + d * l * l);
  uvb = zoom(uvb, 1. - d * l * l);

  vec4 cr = readTex(uvr);
  vec4 cg = readTex(uvg);
  vec4 cb = readTex(uvb);

  outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 1.);

  vec4 deco;

  float res = resolution.y;
  deco += (
    sin(uv.y * res * .7 + time * 100.) *
    sin(uv.y * res * .3 - time * 130.)
  ) * 0.05;

  deco += smoothstep(.01, .0, min(fract(uv.x * 20.), fract(uv.y * 20.))) * 0.1;

  outColor += deco * smoothstep(2., 0., l);
  outColor *= 1.8 - l * l;
  outColor += rand(vec3(p, time)) * 0.1;
}
`;

  const elementShader = `
precision highp float;
uniform sampler2D src;
uniform vec2 offset;
uniform vec2 resolution;
uniform float time;
uniform float id;
out vec4 outColor;

vec4 readTex(vec2 uv) {
  vec4 c = texture(src, uv);
  c.a *= smoothstep(.5, .499, abs(uv.x - .5)) * smoothstep(.5, .499, abs(uv.y - .5));
  return c;
}

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(829., 483.))) * 394.);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 uvr = uv, uvg = uv, uvb = uv;

  float r = rand(vec2(floor(time * 43.), id));
  if (r > 0.8) {
    float y = sin(floor(uv.y / 0.07)) + sin(floor(uv.y / 0.003 + time));
    float f = rand(vec2(y, floor(time * 5.0) + id)) * 2. - 1.;
    uvr.x += f * 0.1;
    uvg.x += f * 0.2;
    uvb.x += f * 0.3;
  }

  float r2 = rand(vec2(floor(time * 37.), id + 10.));
  if (r2 > 0.9) {
    uvr.x += sin(uv.y * 7. + time + id + 1.) * 0.03;
    uvg.x += sin(uv.y * 5. + time + id + 2.) * 0.03;
    uvb.x += sin(uv.y * 3. + time + id + 3.) * 0.03;
  }

  vec4 cr = readTex(uvr);
  vec4 cg = readTex(uvg);
  vec4 cb = readTex(uvb);

  outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 1.);
}
`;

  const collectTargets = () => {
    const seen = new Set();
    const selectors = [
      "main > h1",
      "main > p.typed",
      "main > section > h2",
      ".headliner-badge",
      ".headliner-card .headliner-bg",
      ".headliner-card .service-icon",
      ".headliner-card h3",
      "#presenceTimeline > h2",
      ".timeline-entry:has(.timeline-entry-visual)",
      ".film-photo",
      ".film-gallery img",
      "main .film-frame img"
    ];
    const nodes = [];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        seen.add(el);
        nodes.push(el);
      });
    });
    return nodes.slice(0, 36);
  };

  const bootVfx = async () => {
    try {
      const { VFX } = await import("https://esm.sh/@vfx-js/core@0.8.0");
      const vfx = new VFX({
        scrollPadding: false,
        postEffect: { shader: postShader }
      });

      let id = 0;
      for (const el of collectTargets()) {
        const z = parseInt(el.getAttribute("data-z") || "0", 10);
        vfx.add(el, {
          shader: elementShader,
          uniforms: { id: id++ },
          zIndex: Number.isFinite(z) ? z : 0
        });
      }

      document.body.classList.add("vfx-on");
    } catch (err) {
      console.warn("blog-vfx: VFX.js unavailable", err);
      document.body.classList.add("vfx-off");
    }
  };

  const startWhenReady = () => {
    if (document.body.classList.contains("cuton-settled")) {
      bootVfx();
      return;
    }
    const obs = new MutationObserver(() => {
      if (!document.body.classList.contains("cuton-settled")) return;
      obs.disconnect();
      bootVfx();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener(
      "load",
      () => {
        setTimeout(() => {
          if (!document.body.classList.contains("vfx-on") && !document.body.classList.contains("vfx-off")) {
            bootVfx();
          }
        }, 980);
      },
      { once: true }
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWhenReady, { once: true });
  } else {
    startWhenReady();
  }
}
