(() => {
  // Subtle FM / OPL-flavoured backdrop: modulator + carrier rings, phosphor green.
  const canvas = document.getElementById("blogBgShader");
  if (!canvas) return;
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const lowPowerViewport = window.matchMedia?.("(max-width: 700px), (pointer: coarse)")?.matches;
  if (prefersReduced || lowPowerViewport) return;

  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  document.body.classList.add("blog-bg-on");

  const vertexSource = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  // FM metaphor: two oscillators (mod/car), feedback bloom, soft scan — keep alpha low.
  const fragmentSource = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.22;

      // "modulator" — faster, tighter ring
      float modPhase = t * 2.4;
      float modR = length(p * 1.15 + 0.08 * vec2(sin(modPhase), cos(modPhase * 0.7)));
      float modRing = smoothstep(0.02, 0.0, abs(modR - 0.35 - 0.04 * sin(t * 1.7)));

      // "carrier" — slower, wider
      float carPhase = t * 1.1;
      float carR = length(p * 0.92 + 0.05 * vec2(cos(carPhase), sin(carPhase * 1.3)));
      float carRing = smoothstep(0.025, 0.0, abs(carR - 0.55 - 0.03 * sin(t * 0.9)));

      // feedback smear (high FB = soft noise bloom, not loud)
      float fb = noise(p * 6.0 + vec2(t * 0.4, -t * 0.25));
      float fbBloom = smoothstep(0.55, 0.95, fb) * 0.12;

      // operator "register grid" shimmer
      float grid = abs(sin(p.x * 28.0 + t)) * abs(sin(p.y * 18.0 - t * 0.6));
      grid = pow(grid, 6.0) * 0.08;

      float scan = sin((uv.y + t * 0.2) * uRes.y * 0.55) * 0.025;

      vec3 phosphor = vec3(0.55, 0.95, 0.35);
      vec3 amber = vec3(0.95, 0.65, 0.2);
      vec3 wire = vec3(0.35, 0.8, 1.0);

      vec3 col = vec3(0.02, 0.04, 0.025);
      col += phosphor * modRing * 0.55;
      col += amber * carRing * 0.4;
      col += wire * fbBloom;
      col += phosphor * grid;
      col += vec3(scan * 0.4, scan * 0.7, scan * 0.35);

      float vig = smoothstep(1.35, 0.25, length(p));
      col *= vig;

      // Keep it subtle — page text must stay readable
      float a = 0.42 + 0.18 * (modRing + carRing);
      gl_FragColor = vec4(col, clamp(a, 0.0, 0.65));
    }
  `;

  const compile = (type, source) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
    return sh;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(window.innerWidth * ratio));
    const h = Math.max(1, Math.floor(window.innerHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  let frameId = 0;
  const render = (now) => {
    if (document.hidden) {
      frameId = 0;
      return;
    }
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, now * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frameId = requestAnimationFrame(render);
  };

  const start = () => {
    if (frameId || document.hidden) return;
    frameId = requestAnimationFrame(render);
  };

  const stop = () => {
    if (!frameId) return;
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  resize();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("pagehide", stop);
  start();
})();
