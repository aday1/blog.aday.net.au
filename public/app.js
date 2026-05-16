(() => {
  const body = document.body;
  const cursor = document.getElementById("retroCursor");
  const bgShader = document.getElementById("blogBgShader");
  const timelineGraph = document.getElementById("timelineGraph");
  const blogNodeMap = document.getElementById("blogNodeMap");
  const blogYtFrame = document.getElementById("blogYtFrame");
  const blogYtSelector = document.getElementById("blogYtSelector");
  const blogYtRandom = document.getElementById("blogYtRandom");
  const pageTransition = document.getElementById("pageTransition");

  const finishBoot = () => body.classList.remove("boot-seq");
  const hideTransition = () => pageTransition?.classList.add("hidden");
  const CUTON_BOOT_MS = 2350;
  const CUTON_HIDE_MS = 2950;
  let cutOnScheduled = false;
  const runCutOnSequence = (forceImmediate = false) => {
    if (forceImmediate) {
      finishBoot();
      hideTransition();
      cutOnScheduled = true;
      return;
    }
    if (cutOnScheduled) return;
    cutOnScheduled = true;
    setTimeout(finishBoot, CUTON_BOOT_MS);
    setTimeout(hideTransition, CUTON_HIDE_MS);
  };
  document.addEventListener("DOMContentLoaded", () => {
    runCutOnSequence();
  });
  window.addEventListener("load", () => {
    runCutOnSequence();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) runCutOnSequence(true);
  });

  const svgPreviewFallback = (title) => {
    const safe = (title || "signal").slice(0, 38);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#071224'/><stop offset='100%' stop-color='#17375a'/></linearGradient></defs><rect width='1200' height='630' fill='url(#g)'/><rect x='32' y='32' width='1136' height='566' fill='none' stroke='#62a8df' stroke-width='4'/><text x='70' y='320' fill='#bde7ff' font-family='Consolas, monospace' font-size='42'>${safe}</text><text x='70' y='366' fill='#95f69f' font-family='Consolas, monospace' font-size='24'>fallback signal render</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const parseRepoData = (value) => {
    const parts = (value || "").split("/");
    if (parts.length !== 2) return null;
    return { owner: parts[0], repo: parts[1] };
  };

  const armGenericImageFallback = (img) => {
    if (!img || img.dataset.fallbackReady === "1") return;
    const explicit = (img.dataset.fallbacks || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    const repoData = parseRepoData(img.dataset.repo || "");
    const repoCandidates = repoData ? [
      `https://raw.githubusercontent.com/${repoData.owner}/${repoData.repo}/main/preview.png`,
      `https://raw.githubusercontent.com/${repoData.owner}/${repoData.repo}/master/preview.png`,
      `https://raw.githubusercontent.com/${repoData.owner}/${repoData.repo}/main/screenshot.png`,
      `https://raw.githubusercontent.com/${repoData.owner}/${repoData.repo}/main/docs/preview.png`
    ] : [];
    const candidates = [...explicit, ...repoCandidates, svgPreviewFallback(img.alt || "image")];
    if (!candidates.length) return;
    let idx = 0;
    img.addEventListener("error", () => {
      if (idx >= candidates.length) return;
      img.src = candidates[idx];
      idx += 1;
    });
    img.dataset.fallbackReady = "1";
  };

  if (cursor) cursor.style.display = "none";

  document.querySelectorAll("img").forEach((img) => {
    armGenericImageFallback(img);
  });

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

  const animateHeaders = () => {
    if (!window.anime) return false;
    const headers = [...document.querySelectorAll("h1, h2, h3")];
    if (!headers.length) return false;
    window.anime({
      targets: headers,
      translateY: [12, 0],
      opacity: [0, 1],
      duration: 880,
      delay: window.anime.stagger(65, { start: 100 }),
      easing: "easeOutExpo"
    });
    return true;
  };

  const waitForAnime = (onReady) => {
    if (typeof onReady !== "function") return;
    if (window.anime) {
      onReady();
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (window.anime) {
        clearInterval(timer);
        onReady();
      } else if (attempts >= 30) {
        clearInterval(timer);
      }
    }, 120);
  };

  waitForAnime(() => animateHeaders());

  const typeInNodes = () => {
    const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;
    const nodes = [...document.querySelectorAll(".typed:not(.decrypt)")];
    nodes.forEach((node, idx) => {
      const fullText = (node.textContent || "").trim();
      if (!fullText || node.dataset.typedReady === "1") return;
      node.dataset.typedReady = "1";
      node.textContent = "";
      let charIdx = 0;
      const caret = document.createElement("span");
      caret.className = "typing-caret";
      node.appendChild(caret);
      const tick = () => {
        if (charIdx >= fullText.length) {
          caret.remove();
          return;
        }
        const next = document.createTextNode(fullText[charIdx]);
        node.insertBefore(next, caret);
        charIdx += 1;
        setTimeout(tick, 12 + Math.floor(Math.random() * 20));
      };
      setTimeout(tick, 140 + idx * 120);
    });
  };
  typeInNodes();

  if (bgShader) bgShader.style.display = "none";

  const runTimelineGraph = () => {
    if (!timelineGraph) return;
    const ctx = timelineGraph.getContext("2d");
    if (!ctx) return;
    const labels = [...document.querySelectorAll(".timeline-node")];
    if (!labels.length) return;
    const laneForSource = (s) => {
      if (["soundcloud", "weeklybeats", "bandcamp"].includes(s)) return 0;
      if (["youtube", "vimeo"].includes(s)) return 1;
      if (["demozoo", "scene"].includes(s)) return 2;
      if (["github", "codepen"].includes(s)) return 3;
      return 4;
    };
    const laneColor = (lane) => {
      const c = [
        "rgba(140, 255, 190, 0.92)",
        "rgba(130, 200, 255, 0.92)",
        "rgba(255, 190, 120, 0.9)",
        "rgba(200, 160, 255, 0.92)",
        "rgba(180, 220, 255, 0.88)"
      ];
      return c[Math.min(lane, c.length - 1)];
    };
    const entries = labels.map((el, idx) => {
      const rawDate = (el.querySelector(".date")?.textContent || "").trim();
      const title = (el.dataset.title || el.textContent || `node-${idx}`).trim();
      const source = (el.dataset.source || "").toLowerCase();
      const date = new Date(rawDate);
      const lane = laneForSource(source);
      return {
        idx,
        title,
        rawDate,
        source,
        lane,
        ts: Number.isFinite(date.getTime()) ? date.getTime() : Date.now()
      };
    });
    const minTs = Math.min(...entries.map((e) => e.ts));
    const maxTs = Math.max(...entries.map((e) => e.ts));
    const range = Math.max(1, maxTs - minTs);
    let isVisible = true;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((rows) => {
        rows.forEach((row) => {
          isVisible = row.isIntersecting;
        });
      }, { threshold: 0.08 });
      observer.observe(timelineGraph);
    }
    const spine = [...entries].sort((a, b) => a.ts - b.ts);
    const prefersReducedMotionBlog = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const quadPoint = (ax, ay, cx, cy, bx, by, u) => {
      const om = 1 - u;
      return {
        x: om * om * ax + 2 * om * u * cx + u * u * bx,
        y: om * om * ay + 2 * om * u * cy + u * u * by
      };
    };
    const synapseControl = (ax, ay, bx, by, edgeIdx) => {
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const dir = edgeIdx % 2 === 0 ? 1 : -1;
      const bend = 10 + (edgeIdx % 4) * 1.8;
      return { cx: mx + nx * bend * dir, cy: my + ny * bend * dir };
    };

    const animate = (time) => {
      if (document.hidden || !isVisible) {
        requestAnimationFrame(animate);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const rect = timelineGraph.getBoundingClientRect();
      timelineGraph.width = Math.max(1, Math.floor(rect.width * ratio));
      timelineGraph.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const t = time * 0.001;
      const padX = 34;
      const axisY = h * 0.68;
      const laneTop = h * 0.18;
      const laneCount = 5;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(90, 166, 255, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padX, axisY);
      ctx.lineTo(w - padX, axisY);
      ctx.stroke();

      const years = [...new Set(entries.map((item) => new Date(item.ts).getUTCFullYear()))].sort((a, b) => a - b);
      years.forEach((year) => {
        const yrTs = Date.UTC(year, 0, 1);
        const x = padX + ((yrTs - minTs) / range) * (w - padX * 2);
        ctx.strokeStyle = "rgba(134, 198, 255, 0.2)";
        ctx.beginPath();
        ctx.moveTo(x, laneTop - 4);
        ctx.lineTo(x, axisY + 14);
        ctx.stroke();
        ctx.fillStyle = "rgba(168, 228, 255, 0.72)";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(String(year), x - 14, axisY + 28);
      });

      const laneSpan = Math.max(12, axisY - laneTop - 24);
      const points = entries.map((item) => {
        const x = padX + ((item.ts - minTs) / range) * (w - padX * 2);
        const u = laneCount <= 1 ? 0.5 : item.lane / (laneCount - 1);
        const y = laneTop + u * laneSpan + (prefersReducedMotionBlog ? 0 : Math.sin(t * 0.55 + item.idx * 0.2) * 0.6);
        return { ...item, x, y };
      });
      const byIdx = new Map(points.map((p) => [p.idx, p]));

      for (let i = 0; i < spine.length - 1; i++) {
        const a = byIdx.get(spine[i].idx);
        const b = byIdx.get(spine[i + 1].idx);
        if (!a || !b) continue;
        const { cx, cy } = synapseControl(a.x, a.y, b.x, b.y, i);
        ctx.strokeStyle = "rgba(110, 195, 255, 0.28)";
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
        const u = (t * 0.1 + i * 0.037) % 1;
        const pulse = quadPoint(a.x, a.y, cx, cy, b.x, b.y, u);
        ctx.fillStyle = "rgba(200, 245, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      points.forEach((p, i) => {
        const ring = 4.2 + (i % 4) * 0.35;
        ctx.strokeStyle = "rgba(120, 200, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring + 5.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = laneColor(p.lane);
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const applyTimelineCategories = () => {
    const sourceToCategory = {
      soundcloud: "audio",
      weeklybeats: "audio",
      bandcamp: "audio",
      youtube: "video",
      vimeo: "video",
      demozoo: "visual",
      scene: "visual",
      codepen: "code",
      github: "code",
      platform: "platform",
      clan: "community",
      events: "community",
      press: "press",
      devlog: "devlog"
    };
    const labelByCategory = {
      audio: "AUDIO",
      video: "VIDEO",
      visual: "VISUAL",
      code: "CODE",
      platform: "PLATFORM",
      community: "COMMUNITY",
      press: "PRESS",
      devlog: "DEVLOG"
    };
    document.querySelectorAll(".timeline-node").forEach((node) => {
      if (node.querySelector(".category-chip")) return;
      const source = (node.dataset.source || "").toLowerCase();
      const category = sourceToCategory[source] || "signal";
      const chip = document.createElement("span");
      chip.className = `category-chip cat-${category}`;
      chip.textContent = labelByCategory[category] || "SIGNAL";
      const sourceChip = node.querySelector(".source-chip");
      if (sourceChip) {
        sourceChip.insertAdjacentElement("afterend", chip);
      } else {
        const dateNode = node.querySelector(".date");
        if (dateNode) dateNode.insertAdjacentElement("afterend", chip);
      }
    });
  };

  const runBlogNodeMap = () => {
    if (!blogNodeMap) return;
    const ctx = blogNodeMap.getContext("2d");
    if (!ctx) return;
    const linkRows = [...document.querySelectorAll(".node-links li[data-node-id][data-url]")];
    if (!linkRows.length) return;
    const nodeDefs = [
      { id: "blog-home", layer: 0, slot: 0, c: "#9eff89" },
      { id: "aday-main", layer: 1, slot: 0, c: "#9ed1ff" },
      { id: "demozoo-artifacts", layer: 1, slot: 1, c: "#a9f8ff" },
      { id: "weeklybeats-xref", layer: 2, slot: 0, c: "#9fffbf" },
      { id: "post-vimeo-index", layer: 2, slot: 1, c: "#b5d8ff" },
      { id: "post-media-deck", layer: 2, slot: 2, c: "#b5d8ff" },
      { id: "post-boot", layer: 3, slot: 0, c: "#b5d8ff" },
      { id: "repo-blog", layer: 4, slot: 0, c: "#ffd38e" }
    ];
    const edges = [
      { a: "blog-home", b: "aday-main", w: 0.95 },
      { a: "blog-home", b: "demozoo-artifacts", w: 0.85 },
      { a: "blog-home", b: "weeklybeats-xref", w: 0.8 },
      { a: "blog-home", b: "post-vimeo-index", w: 0.72 },
      { a: "blog-home", b: "post-media-deck", w: 0.72 },
      { a: "blog-home", b: "post-boot", w: 0.7 },
      { a: "post-vimeo-index", b: "demozoo-artifacts", w: 0.45 },
      { a: "post-media-deck", b: "weeklybeats-xref", w: 0.42 },
      { a: "post-boot", b: "repo-blog", w: 0.55 },
      { a: "blog-home", b: "repo-blog", w: 0.65 }
    ];
    const linkById = new Map(linkRows.map((row) => [row.dataset.nodeId, row]));
    let hoverId = "";
    let isVisible = true;
    let nodeCache = [];
    const MAX_LAYER = 4;
    const PAD_X = 40;
    const PAD_Y = 32;
    const layerCounts = () => {
      const m = new Map();
      nodeDefs.forEach((n) => {
        m.set(n.layer, Math.max(m.get(n.layer) || 0, n.slot + 1));
      });
      return m;
    };
    const synapseControl = (ax, ay, bx, by, edgeIdx) => {
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const dir = edgeIdx % 2 === 0 ? 1 : -1;
      const bend = 12 + (edgeIdx % 4) * 2;
      return { cx: mx + nx * bend * dir, cy: my + ny * bend * dir };
    };
    const quadPoint = (ax, ay, cx, cy, bx, by, u) => {
      const om = 1 - u;
      return {
        x: om * om * ax + 2 * om * u * cx + u * u * bx,
        y: om * om * ay + 2 * om * u * cy + u * u * by
      };
    };
    const motionBlog = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((rows) => {
        rows.forEach((row) => {
          isVisible = row.isIntersecting;
        });
      }, { threshold: 0.08 });
      observer.observe(blogNodeMap);
    }

    const pickNode = (x, y) => {
      return nodeCache.find((node) => {
        const dx = x - node.px;
        const dy = y - node.py;
        return (dx * dx + dy * dy) <= (node.r + 7) * (node.r + 7);
      }) || null;
    };

    const pointerPos = (event) => {
      const rect = blogNodeMap.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    blogNodeMap.addEventListener("mousemove", (event) => {
      const p = pointerPos(event);
      const node = pickNode(p.x, p.y);
      hoverId = node?.id || "";
      blogNodeMap.style.cursor = node ? "pointer" : "none";
    });
    blogNodeMap.addEventListener("mouseleave", () => {
      hoverId = "";
      blogNodeMap.style.cursor = "none";
    });
    blogNodeMap.addEventListener("click", (event) => {
      const p = pointerPos(event);
      const node = pickNode(p.x, p.y);
      if (!node) return;
      const row = linkById.get(node.id);
      const url = row?.dataset?.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });

    const animate = (time) => {
      if (document.hidden || !isVisible) {
        requestAnimationFrame(animate);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const rect = blogNodeMap.getBoundingClientRect();
      blogNodeMap.width = Math.max(1, Math.floor(rect.width * ratio));
      blogNodeMap.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const t = time * 0.001;
      ctx.clearRect(0, 0, w, h);
      const jit = motionBlog ? 0 : 1;
      const counts = layerCounts();
      nodeCache = nodeDefs.map((n, i) => {
        const slotsInLayer = counts.get(n.layer) || 1;
        const colX = PAD_X + (n.layer / MAX_LAYER) * (w - PAD_X * 2);
        let rowY;
        if (slotsInLayer <= 1) {
          rowY = h * 0.5;
        } else {
          rowY = PAD_Y + (n.slot / (slotsInLayer - 1)) * (h - PAD_Y * 2);
        }
        const r = 5.2 + ((i + 1) % 3) * 0.4;
        return {
          ...n,
          r,
          px: colX + jit * Math.sin(t * 0.78 + i * 0.41) * 0.9,
          py: rowY + jit * Math.cos(t * 0.66 + i * 0.33) * 0.75
        };
      });
      const byId = new Map(nodeCache.map((n) => [n.id, n]));

      edges.forEach((edge, i) => {
        const na = byId.get(edge.a);
        const nb = byId.get(edge.b);
        if (!na || !nb) return;
        const wgt = edge.w;
        const { cx, cy } = synapseControl(na.px, na.py, nb.px, nb.py, i);
        ctx.strokeStyle = `rgba(118, 200, 255, ${0.18 + 0.38 * wgt})`;
        ctx.lineWidth = 0.9 + 0.9 * wgt;
        ctx.beginPath();
        ctx.moveTo(na.px, na.py);
        ctx.quadraticCurveTo(cx, cy, nb.px, nb.py);
        ctx.stroke();
        const u = (t * 0.12 + i * 0.04) % 1;
        const pulse = quadPoint(na.px, na.py, cx, cy, nb.px, nb.py, u);
        ctx.fillStyle = `rgba(200, 255, 230, ${0.3 + 0.45 * wgt})`;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

      nodeCache.forEach((n) => {
        const hovered = hoverId === n.id;
        ctx.fillStyle = n.c;
        ctx.beginPath();
        ctx.arc(n.px, n.py, n.r + (hovered ? 1.5 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(156, 255, 176, 0.32)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.px, n.py, n.r + 6, 0, Math.PI * 2);
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const randomizeFrameGeneration = () => {
    document.querySelectorAll("main section, .timeline-stage, .post-list li").forEach((node) => {
      const edgeLen = 8 + Math.floor(Math.random() * 18);
      const edgeGap = 5 + Math.floor(Math.random() * 14);
      const edgeCut = 7 + Math.floor(Math.random() * 12);
      const edgeAlpha = (0.28 + Math.random() * 0.32).toFixed(2);
      const edgeShift = 14 + Math.floor(Math.random() * 24);
      const edgeDrift = (6 + Math.random() * 7).toFixed(2);
      node.style.setProperty("--edge-len", `${edgeLen}px`);
      node.style.setProperty("--edge-gap", `${edgeGap}px`);
      node.style.setProperty("--edge-cut", `${edgeCut}px`);
      node.style.setProperty("--edge-alpha", edgeAlpha);
      node.style.setProperty("--edge-shift", `${edgeShift}px`);
      node.style.setProperty("--edge-drift", `${edgeDrift}s`);
    });
  };

  const scheduleFrameRandomizer = () => {
    const roll = () => {
      randomizeFrameGeneration();
      const next = 5200 + Math.floor(Math.random() * 6200);
      setTimeout(roll, next);
    };
    roll();
  };

  randomizeFrameGeneration();
  scheduleFrameRandomizer();
  runTimelineGraph();
  runBlogNodeMap();

  if (blogYtFrame) {
    const sources = [
      "https://www.youtube-nocookie.com/embed/videoseries?list=UUIAFCgAIIABAjGuoBogfmAQ&rel=0",
      "https://www.youtube-nocookie.com/embed/videoseries?list=UU7t6b5NpEJGq71jPu8DqBVW&rel=0",
      "https://www.youtube-nocookie.com/embed/videoseries?list=UU1_w2-bcOXGXzxS79c2qnqA&rel=0"
    ];
    blogYtSelector?.addEventListener("change", () => {
      blogYtFrame.src = blogYtSelector.value;
    });

    blogYtRandom?.addEventListener("click", () => {
      const src = sources[Math.floor(Math.random() * sources.length)];
      blogYtFrame.src = src;
      if (blogYtSelector) blogYtSelector.value = src;
    });

    setInterval(() => {
      if (!document.hidden) {
        blogYtFrame.src = sources[Math.floor(Math.random() * sources.length)];
      }
    }, 18000);
  }

  applyTimelineCategories();
})();
