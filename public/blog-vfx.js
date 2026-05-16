/**
 * Light CRT chroma via VFX.js — tuned for mint/cyan/gold blog palette.
 */
const CUTON_SESSION_KEY = "aday-blog-cuton-done-v1";
const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
let liteBoot = prefersReducedMotion;
try {
  liteBoot = liteBoot || sessionStorage.getItem(CUTON_SESSION_KEY) === "1";
} catch {
  // ignore
}

if (prefersReducedMotion) {
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

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;
  float l = length(p);
  float t = time * 0.35;

  vec2 uvr = uv + vec2(0.0012, 0.0);
  vec2 uvb = uv - vec2(0.0012, 0.0);
  vec4 cr = readTex(uvr);
  vec4 cg = readTex(uv);
  vec4 cb = readTex(uvb);
  vec3 col = vec3(cr.r, cg.g, cb.b);

  float scan = sin((uv.y + t * 0.2) * resolution.y * 0.85) * 0.03;
  float vig = smoothstep(1.1, 0.45, l);
  col *= vig;
  col += vec3(scan);
  col += vec3(0.02, 0.06, 0.04) * (1.0 - vig);
  outColor = vec4(col, (cr.a + cg.a + cb.a) / 3.0);
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
  return texture(src, uv);
}

float rand(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 uvr = uv, uvg = uv, uvb = uv;
  float r = rand(vec2(floor(time * 12.0), id));
  if (r > 0.92) {
    float wobble = sin(uv.y * 24.0 + time * 2.0 + id) * 0.012;
    uvr.x += wobble;
    uvb.x -= wobble;
  }
  vec4 cr = readTex(uvr);
  vec4 cg = readTex(uvg);
  vec4 cb = readTex(uvb);
  outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 3.0);
}
`;

  const visibleRoot = () => {
    const panels = [...document.querySelectorAll(".blog-panel.is-active, .blog-panel.is-split-left, .blog-panel.is-split-right")];
    if (panels.length) return panels;
    return [document.querySelector("main")].filter(Boolean);
  };

  const collectTargets = () => {
    const seen = new Set();
    const nodes = [];
    const roots = visibleRoot();
    const selectors = [
      "h1.decrypt",
      "h2",
      ".timeline-entry-visual",
      ".film-photo",
      ".wb-track-banner",
      ".devlog-train-badge",
      ".story-trains-hub"
    ];
    roots.forEach((root) => {
      selectors.forEach((sel) => {
        root.querySelectorAll(sel).forEach((el) => {
          if (seen.has(el)) return;
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) return;
          seen.add(el);
          nodes.push(el);
        });
      });
    });
    return nodes.slice(0, 24);
  };

  let vfxInstance = null;

  const bootVfx = async () => {
    try {
      const { VFX } = await import("https://esm.sh/@vfx-js/core@0.8.0");
      if (vfxInstance?.destroy) {
        try {
          vfxInstance.destroy();
        } catch {
          // ignore
        }
      }
      const vfx = new VFX({
        scrollPadding: false,
        postEffect: liteBoot ? false : { shader: postShader }
      });
      let id = 0;
      for (const el of collectTargets()) {
        vfx.add(el, {
          shader: elementShader,
          uniforms: { id: id++ },
          zIndex: 0
        });
      }
      vfxInstance = vfx;
      document.body.classList.add("vfx-on");
      document.body.classList.remove("vfx-off");
    } catch (err) {
      console.warn("blog-vfx: VFX.js unavailable", err);
      document.body.classList.add("vfx-off");
    }
  };

  const startWhenReady = () => {
    const run = () => {
      bootVfx();
    };
    if (document.body.classList.contains("cuton-settled")) {
      run();
      return;
    }
    const obs = new MutationObserver(() => {
      if (!document.body.classList.contains("cuton-settled")) return;
      obs.disconnect();
      run();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener(
      "load",
      () => {
        setTimeout(run, liteBoot ? 120 : 900);
      },
      { once: true }
    );
  };

  window.addEventListener("blog-panel-change", () => {
    if (!document.body.classList.contains("vfx-on")) return;
    setTimeout(bootVfx, 200);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWhenReady, { once: true });
  } else {
    startWhenReady();
  }
}
