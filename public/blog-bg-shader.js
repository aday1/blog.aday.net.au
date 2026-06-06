(() => {
  const canvas = document.getElementById("blogBgShader");
  if (!canvas) return;
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const lowPowerViewport = window.matchMedia?.("(max-width: 700px), (pointer: coarse)")?.matches;
  if (prefersReduced || lowPowerViewport) return;

  const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
  if (!gl) return;

  document.body.classList.add("blog-bg-on");

  const vertexSource = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

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
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return v;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.28;
      float scan = sin((uv.y + t * 0.35) * uRes.y * 0.65) * 0.04;
      float neb = fbm(uv * 4.8 + vec2(t * 0.45, -t * 0.2));
      float swirl = sin((dot(p, p) * 14.0) - t * 3.2);
      vec3 base = vec3(0.055, 0.0, 0.035);
      vec3 col = base;
      col += vec3(0.12, 0.04, 0.2) * neb;
      col += vec3(0.45, 0.1, 0.2) * smoothstep(0.35, 0.95, neb) * 0.28;
      col += vec3(0.62, 0.42, 0.16) * (0.45 + 0.55 * swirl) * 0.12;
      col += vec3(0.08, 0.22, 0.48) * smoothstep(0.5, 1.0, sin((uv.x - t * 0.25) * 9.0)) * 0.1;
      col += vec3(scan);
      float vig = smoothstep(1.25, 0.35, length(p));
      col *= vig;
      gl_FragColor = vec4(col, 0.92);
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
