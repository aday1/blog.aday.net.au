(() => {
  const body = document.body;
  const cursor = document.getElementById("retroCursor");
  const bgShader = document.getElementById("blogBgShader");
  const timelineGraph = document.getElementById("timelineGraph");

  const finishBoot = () => body.classList.remove("boot-seq");
  window.addEventListener("load", () => setTimeout(finishBoot, 820));
  setTimeout(finishBoot, 1200);

  if (cursor) {
    window.addEventListener("mousemove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const scramble = (el, target) => {
    let frame = 0;
    const max = target.length + 10;
    const tick = () => {
      let out = "";
      for (let i = 0; i < target.length; i++) {
        out += i < frame - 5 ? target[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame += 1;
      if (frame <= max) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    tick();
  };

  document.querySelectorAll(".decrypt").forEach((node, i) => {
    const text = node.textContent || "";
    setTimeout(() => scramble(node, text), 220 + i * 140);
  });

  const initBgShader = () => {
    if (!bgShader) return null;
    const gl = bgShader.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return null;

    const vs = `
      attribute vec2 aPos;
      void main(){ gl_Position = vec4(aPos,0.0,1.0); }
    `;
    const fs = `
      precision mediump float;
      uniform vec2 uRes;
      uniform float uTime;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){
        vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
        return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes.xy;
        vec2 p = uv*2.0-1.0;
        p.x *= uRes.x/uRes.y;
        float t = uTime * 0.25;
        float m = n(uv*9.0 + vec2(t*0.5, -t*0.4));
        float sig = sin((uv.x+uv.y+t)*18.0)*0.5+0.5;
        vec3 col = vec3(0.02,0.08,0.19);
        col += vec3(0.02,0.20,0.42)*m;
        col += vec3(0.16,0.05,0.28)*sig*0.45;
        col *= smoothstep(1.25, 0.15, length(p));
        gl_FragColor = vec4(col, 0.82);
      }
    `;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
      return shader;
    };
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const program = gl.createProgram();
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    return { gl, program, aPos: gl.getAttribLocation(program, "aPos"), uRes: gl.getUniformLocation(program, "uRes"), uTime: gl.getUniformLocation(program, "uTime"), buffer };
  };

  const shader = initBgShader();
  const renderBg = (t) => {
    if (!shader || !bgShader) return;
    const { gl, program, aPos, uRes, uTime, buffer } = shader;
    const ratio = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(window.innerWidth * ratio));
    const h = Math.max(1, Math.floor(window.innerHeight * ratio));
    if (bgShader.width !== w || bgShader.height !== h) {
      bgShader.width = w;
      bgShader.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, t * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(renderBg);
  };

  const runTimelineGraph = () => {
    if (!timelineGraph) return;
    const ctx = timelineGraph.getContext("2d");
    if (!ctx) return;
    const labels = [...document.querySelectorAll(".timeline-node")];
    if (!labels.length) return;

    const animate = (time) => {
      const ratio = window.devicePixelRatio || 1;
      const rect = timelineGraph.getBoundingClientRect();
      timelineGraph.width = Math.max(1, Math.floor(rect.width * ratio));
      timelineGraph.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const t = time * 0.001;
      ctx.clearRect(0, 0, w, h);

      const points = labels.map((_, i) => ({
        x: 24 + (w - 48) * (i / Math.max(1, labels.length - 1)),
        y: 44 + (Math.sin(t * 1.4 + i * 0.6) * 18) + ((i % 2) * 70)
      }));

      ctx.strokeStyle = "rgba(120,210,255,0.42)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      points.forEach((p, i) => {
        const pulse = 4 + 2 * (0.5 + 0.5 * Math.sin(t * 2.2 + i));
        ctx.fillStyle = "rgba(160,255,145,0.92)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  if (shader) requestAnimationFrame(renderBg);
  runTimelineGraph();
})();
