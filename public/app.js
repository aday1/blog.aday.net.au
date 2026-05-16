(() => {
  const body = document.body;
  const cursor = document.getElementById("retroCursor");
  const bgShader = document.getElementById("blogBgShader");
  const timelineGraph = document.getElementById("timelineGraph");
  const blogNodeMap = document.getElementById("blogNodeMap");
  const blogYtFrame = document.getElementById("blogYtFrame");
  const blogYtSection = document.getElementById("blogYtSection");
  const blogYtNowPlaying = document.getElementById("blogYtNowPlaying");
  const pageTransition = document.getElementById("pageTransition");

  const CUTON_SESSION_KEY = "aday-blog-cuton-done-v1";
  const hasSeenCutOn = (() => {
    try {
      return sessionStorage.getItem(CUTON_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  })();
  const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const liteBoot = hasSeenCutOn || prefersReducedMotion;
  const finishBoot = () => {
    body.classList.remove("boot-seq");
    body.classList.add("cuton-settled");
    if (!window.__blogScrollPinned) {
      window.__blogScrollPinned = true;
      window.scrollTo(0, 0);
    }
  };
  const hideTransition = () => pageTransition?.classList.add("hidden");
  const CUTON_BOOT_MS = 100;
  const CUTON_HIDE_MS = 920;
  let cutOnScheduled = false;
  const runCutOnSequence = (forceImmediate = false) => {
    if (forceImmediate || hasSeenCutOn) {
      if (!hasSeenCutOn) {
        try {
          sessionStorage.setItem(CUTON_SESSION_KEY, "1");
        } catch {
          // ignore
        }
      }
      finishBoot();
      hideTransition();
      cutOnScheduled = true;
      return;
    }
    if (cutOnScheduled) return;
    cutOnScheduled = true;
    try {
      sessionStorage.setItem(CUTON_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setTimeout(finishBoot, CUTON_BOOT_MS);
    setTimeout(hideTransition, CUTON_HIDE_MS);
  };
  if (hasSeenCutOn) {
    finishBoot();
    hideTransition();
  }
  document.addEventListener("DOMContentLoaded", () => {
    runCutOnSequence(hasSeenCutOn);
  });
  window.addEventListener("load", () => {
    runCutOnSequence(hasSeenCutOn);
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

  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const canUseRetroCursor = !coarsePointer;
  if (canUseRetroCursor) {
    body.classList.add("retro-cursor-on");
  }

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

  if (!liteBoot) {
    document.querySelectorAll(".decrypt").forEach((node, i) => {
      const text = node.textContent || "";
      setTimeout(() => scramble(node, text), 220 + i * 140);
    });
  }

  const animateHeaders = () => {
    if (!window.anime) return false;
    const headers = [...document.querySelectorAll("main > h1, main > section > h2")];
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

  if (!liteBoot) waitForAnime(() => animateHeaders());

  const typeInNodes = () => {
    if (prefersReducedMotion || liteBoot) return;
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
  if (!liteBoot) typeInNodes();

  const runTimelineGraph = () => {
    if (!timelineGraph) return;
    const ctx = timelineGraph.getContext("2d");
    if (!ctx) return;
    const presenceRoot = document.getElementById("presenceTimeline");
    const cardNodes = presenceRoot
      ? [...presenceRoot.querySelectorAll(".timeline-node")]
      : [...document.querySelectorAll(".timeline-node")];
    if (!cardNodes.length) return;

    const DAY_MS = 86400000;
    const MIN_VIEW_MS = DAY_MS * 21;
    const padX = 34;

    const laneForSource = (s) => {
      if (["soundcloud", "weeklybeats", "bandcamp"].includes(s)) return 0;
      if (["youtube", "vimeo"].includes(s)) return 1;
      if (["demozoo", "scene"].includes(s)) return 2;
      if (["github", "codepen", "devlog-macroverse", "devlog-artbastard"].includes(s)) return 3;
      return 4;
    };
    const laneColor = (lane, alpha = 1) => {
      const c = [
        `rgba(122, 230, 168, ${alpha})`,
        `rgba(118, 200, 255, ${alpha})`,
        `rgba(255, 196, 118, ${alpha})`,
        `rgba(200, 160, 255, ${alpha})`,
        `rgba(186, 214, 238, ${alpha})`
      ];
      return c[Math.min(lane, c.length - 1)];
    };
    const entries = cardNodes.map((el, idx) => {
      const rawDate = (el.querySelector(".date")?.textContent || "").trim();
      const title = (el.dataset.title || el.textContent || `node-${idx}`).trim();
      const source = (el.dataset.source || "").toLowerCase();
      const date = new Date(rawDate);
      const lane = laneForSource(source);
      return {
        idx,
        el,
        title,
        rawDate,
        source,
        lane,
        ts: Number.isFinite(date.getTime()) ? date.getTime() : Date.now()
      };
    });
    const dataMinTs = Math.min(...entries.map((e) => e.ts));
    const dataMaxTs = Math.max(...entries.map((e) => e.ts));
    const totalRange = Math.max(1, dataMaxTs - dataMinTs);
    let viewMinTs = dataMinTs;
    let viewMaxTs = dataMaxTs;
    const spine = [...entries].sort((a, b) => a.ts - b.ts);
    let pointCache = [];
    let hoverIdx = -1;
    let graphVisible = false;
    let plotWidth = 1;
    let dragging = false;
    let dragStartX = 0;
    let dragViewMin = 0;
    let suppressClick = false;
    let zoomSlider = null;
    let zoomLabel = null;

    const viewSpan = () => Math.max(1, viewMaxTs - viewMinTs);
    const isFullView = () => viewSpan() >= totalRange * 0.995;

    const clampView = () => {
      let span = Math.min(totalRange, Math.max(MIN_VIEW_MS, viewMaxTs - viewMinTs));
      if (span >= totalRange * 0.995) {
        viewMinTs = dataMinTs;
        viewMaxTs = dataMaxTs;
        return;
      }
      let center = (viewMinTs + viewMaxTs) * 0.5;
      const half = span * 0.5;
      const minCenter = dataMinTs + half;
      const maxCenter = dataMaxTs - half;
      center = Math.min(maxCenter, Math.max(minCenter, center));
      viewMinTs = center - half;
      viewMaxTs = center + half;
    };

    const formatTs = (ts) =>
      new Date(ts).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

    const updateZoomUi = () => {
      if (zoomLabel) {
        zoomLabel.textContent = isFullView()
          ? `Full range (${formatTs(dataMinTs)} – ${formatTs(dataMaxTs)})`
          : `${formatTs(viewMinTs)} – ${formatTs(viewMaxTs)}`;
      }
      if (!zoomSlider) return;
      const span = viewSpan();
      const logMin = Math.log(MIN_VIEW_MS);
      const logMax = Math.log(totalRange);
      const t = (Math.log(span) - logMax) / (logMin - logMax);
      const pct = Math.round(Math.min(100, Math.max(0, t * 100)));
      if (Number(zoomSlider.value) !== pct) zoomSlider.value = String(pct);
    };

    const setViewFromSlider = (pct) => {
      const t = Math.min(1, Math.max(0, Number(pct) / 100));
      const span = Math.exp(Math.log(MIN_VIEW_MS) * t + Math.log(totalRange) * (1 - t));
      const center = (viewMinTs + viewMaxTs) * 0.5;
      viewMinTs = center - span * 0.5;
      viewMaxTs = center + span * 0.5;
      clampView();
      updateZoomUi();
      drawFrame();
    };

    const resetView = () => {
      viewMinTs = dataMinTs;
      viewMaxTs = dataMaxTs;
      updateZoomUi();
      drawFrame();
    };

    const zoomAt = (clientX, factor) => {
      const rect = timelineGraph.getBoundingClientRect();
      const x = clientX - rect.left;
      const inner = Math.max(1, plotWidth);
      const ratio = Math.min(1, Math.max(0, (x - padX) / inner));
      const anchor = viewMinTs + ratio * viewSpan();
      const nextSpan = Math.min(totalRange, Math.max(MIN_VIEW_MS, viewSpan() * factor));
      viewMinTs = anchor - ratio * nextSpan;
      viewMaxTs = anchor + (1 - ratio) * nextSpan;
      clampView();
      updateZoomUi();
      drawFrame();
    };

    const tsToX = (ts, w) => padX + ((ts - viewMinTs) / viewSpan()) * (w - padX * 2);

    const synapseControl = (ax, ay, bx, by, edgeIdx) => {
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const dir = edgeIdx % 2 === 0 ? 1 : -1;
      const bend = 8 + (edgeIdx % 3) * 1.4;
      return { cx: mx + nx * bend * dir, cy: my + ny * bend * dir };
    };

    const setActiveCard = (idx) => {
      cardNodes.forEach((node, i) => {
        node.classList.toggle("timeline-graph-focus", i === idx && idx >= 0);
      });
    };

    const drawTimeTicks = (w, laneTop, axisY) => {
      const span = viewSpan();
      const monthMode = span < DAY_MS * 400;
      const weekMode = span < DAY_MS * 120;

      if (monthMode) {
        let t = viewMinTs;
        if (weekMode) {
          const start = new Date(viewMinTs);
          start.setUTCDate(start.getUTCDate() - start.getUTCDay());
          start.setUTCHours(0, 0, 0, 0);
          t = start.getTime();
        } else {
          const start = new Date(viewMinTs);
          start.setUTCDate(1);
          start.setUTCHours(0, 0, 0, 0);
          t = start.getTime();
        }
        while (t <= viewMaxTs + DAY_MS) {
          if (t >= viewMinTs - DAY_MS) {
            const x = tsToX(t, w);
            if (x >= padX - 2 && x <= w - padX + 2) {
              ctx.strokeStyle = "rgba(134, 198, 255, 0.14)";
              ctx.beginPath();
              ctx.moveTo(x, laneTop - 2);
              ctx.lineTo(x, axisY + 10);
              ctx.stroke();
              const d = new Date(t);
              const label = weekMode
                ? d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                : d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
              ctx.fillStyle = "rgba(168, 228, 255, 0.72)";
              ctx.font = weekMode ? "9px Consolas, monospace" : "10px Consolas, monospace";
              ctx.fillText(label, x - 16, axisY + 24);
            }
          }
          if (weekMode) {
            t += 7 * DAY_MS;
          } else {
            const next = new Date(t);
            next.setUTCMonth(next.getUTCMonth() + 1);
            t = next.getTime();
          }
        }
        return;
      }

      const y0 = new Date(viewMinTs).getUTCFullYear();
      const y1 = new Date(viewMaxTs).getUTCFullYear();
      for (let year = y0; year <= y1; year += 1) {
        const yrTs = Date.UTC(year, 0, 1);
        const x = tsToX(yrTs, w);
        if (x < padX - 20 || x > w - padX + 20) continue;
        ctx.strokeStyle = "rgba(134, 198, 255, 0.16)";
        ctx.beginPath();
        ctx.moveTo(x, laneTop - 2);
        ctx.lineTo(x, axisY + 10);
        ctx.stroke();
        ctx.fillStyle = "rgba(168, 228, 255, 0.78)";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(String(year), x - 14, axisY + 24);
      }
    };

    const drawFrame = () => {
      if (!graphVisible || document.hidden) return;
      const ratio = window.devicePixelRatio || 1;
      const rect = timelineGraph.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      timelineGraph.width = Math.max(1, Math.floor(rect.width * ratio));
      timelineGraph.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width;
      const h = rect.height;
      plotWidth = w - padX * 2;
      const axisY = h * 0.72;
      const laneTop = h * 0.16;
      const laneCount = 5;
      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "rgba(8, 18, 32, 0.55)");
      bgGrad.addColorStop(1, "rgba(4, 8, 14, 0.15)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const laneSpan = Math.max(12, axisY - laneTop - 20);
      for (let lane = 0; lane < laneCount; lane += 1) {
        const u = laneCount <= 1 ? 0.5 : lane / (laneCount - 1);
        const y = laneTop + u * laneSpan;
        ctx.strokeStyle = laneColor(lane, 0.12);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(w - padX, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(90, 166, 255, 0.5)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(padX, axisY);
      ctx.lineTo(w - padX, axisY);
      ctx.stroke();

      drawTimeTicks(w, laneTop, axisY);

      const margin = viewSpan() * 0.02;
      pointCache = entries
        .filter((item) => item.ts >= viewMinTs - margin && item.ts <= viewMaxTs + margin)
        .map((item) => {
          const x = tsToX(item.ts, w);
          const u = laneCount <= 1 ? 0.5 : item.lane / (laneCount - 1);
          const y = laneTop + u * laneSpan;
          return { ...item, x, y };
        });
      const byIdx = new Map(pointCache.map((p) => [p.idx, p]));

      for (let i = 0; i < spine.length - 1; i += 1) {
        const a = byIdx.get(spine[i].idx);
        const b = byIdx.get(spine[i + 1].idx);
        if (!a || !b) continue;
        const { cx, cy } = synapseControl(a.x, a.y, b.x, b.y, i);
        ctx.strokeStyle = "rgba(110, 195, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      }

      pointCache.forEach((p) => {
        const focused = p.idx === hoverIdx;
        const ring = focused ? 6.2 : 4.4;
        ctx.strokeStyle = focused ? laneColor(p.lane, 0.85) : laneColor(p.lane, 0.35);
        ctx.lineWidth = focused ? 1.6 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = laneColor(p.lane, focused ? 1 : 0.88);
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
        ctx.fill();
        if (focused) {
          ctx.fillStyle = "rgba(232, 251, 255, 0.92)";
          ctx.font = "11px Consolas, monospace";
          const label = p.title.length > 42 ? `${p.title.slice(0, 39)}...` : p.title;
          ctx.fillText(label, Math.min(p.x + 10, w - padX - 120), Math.max(14, p.y - 10));
        }
      });
    };

    const pickPoint = (x, y) => {
      let best = null;
      let bestDist = Infinity;
      pointCache.forEach((p) => {
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      });
      return bestDist <= 14 * 14 ? best : null;
    };

    const pointerPos = (event) => {
      const rect = timelineGraph.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const graphWrap = timelineGraph.closest(".timeline-graph-wrap");
    const ensureZoomBar = () => {
      if (!graphWrap || graphWrap.querySelector(".timeline-zoom-bar")) {
        return graphWrap?.querySelector(".timeline-zoom-bar") || null;
      }
      const bar = document.createElement("div");
      bar.className = "timeline-zoom-bar";
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", "Timeline zoom and pan");
      bar.innerHTML = [
        '<button type="button" class="timeline-zoom-btn" data-zoom="out" title="Zoom out" aria-label="Zoom out">-</button>',
        '<input type="range" class="timeline-zoom-range" min="0" max="100" value="0" aria-label="Timeline zoom level">',
        '<button type="button" class="timeline-zoom-btn" data-zoom="in" title="Zoom in" aria-label="Zoom in">+</button>',
        '<button type="button" class="timeline-zoom-btn timeline-zoom-reset" data-zoom="reset" title="Show full range" aria-label="Reset zoom">All</button>',
        '<span class="timeline-zoom-label" aria-live="polite"></span>'
      ].join("");
      graphWrap.insertBefore(bar, graphWrap.querySelector(".timeline-stage"));
      return bar;
    };

    const zoomBar = ensureZoomBar();
    if (zoomBar) {
      zoomSlider = zoomBar.querySelector(".timeline-zoom-range");
      zoomLabel = zoomBar.querySelector(".timeline-zoom-label");
      zoomBar.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-zoom]");
        if (!btn) return;
        const mode = btn.dataset.zoom;
        if (mode === "in") zoomAt(timelineGraph.getBoundingClientRect().left + plotWidth * 0.5, 0.72);
        else if (mode === "out") zoomAt(timelineGraph.getBoundingClientRect().left + plotWidth * 0.5, 1.38);
        else if (mode === "reset") resetView();
      });
      zoomSlider?.addEventListener("input", () => setViewFromSlider(zoomSlider.value));
    }
    updateZoomUi();

    timelineGraph.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.14 : 0.86;
      zoomAt(event.clientX, factor);
    }, { passive: false });

    timelineGraph.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragViewMin = viewMinTs;
      timelineGraph.classList.add("is-panning");
      suppressClick = false;
    });

    window.addEventListener("mousemove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - dragStartX;
      if (Math.abs(dx) > 4) suppressClick = true;
      const span = viewSpan();
      viewMinTs = dragViewMin + (-dx / Math.max(1, plotWidth)) * span;
      viewMaxTs = viewMinTs + span;
      clampView();
      updateZoomUi();
      drawFrame();
    });

    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      timelineGraph.classList.remove("is-panning");
    });

    timelineGraph.addEventListener("dblclick", () => resetView());

    timelineGraph.addEventListener("mousemove", (event) => {
      if (dragging) return;
      const p = pointerPos(event);
      const hit = pickPoint(p.x, p.y);
      const nextIdx = hit?.idx ?? -1;
      if (nextIdx === hoverIdx) return;
      hoverIdx = nextIdx;
      setActiveCard(hoverIdx);
      drawFrame();
    });
    timelineGraph.addEventListener("mouseleave", () => {
      if (dragging) return;
      hoverIdx = -1;
      setActiveCard(-1);
      drawFrame();
    });
    timelineGraph.addEventListener("click", (event) => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const p = pointerPos(event);
      const hit = pickPoint(p.x, p.y);
      if (!hit?.el) return;
      hit.el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      hit.el.classList.add("timeline-graph-ping");
      setTimeout(() => hit.el.classList.remove("timeline-graph-ping"), 900);
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawFrame, 120);
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((rows) => {
        rows.forEach((row) => {
          graphVisible = row.isIntersecting;
          if (graphVisible) drawFrame();
        });
      }, { threshold: 0.05, rootMargin: "80px 0px" });
      observer.observe(timelineGraph);
    } else {
      graphVisible = true;
      drawFrame();
    }
  };

  const wireTimelinePresence = () => {
    const root = document.getElementById("presenceTimeline");
    if (!root) return;
    const nodes = [...root.querySelectorAll(".timeline-node")];
    if (!nodes.length) return;

    if ("IntersectionObserver" in window) {
      const reveal = new IntersectionObserver((rows) => {
        rows.forEach((row) => {
          if (!row.isIntersecting) return;
          row.target.classList.add("timeline-inview");
          reveal.unobserve(row.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
      nodes.forEach((node) => reveal.observe(node));
    } else {
      nodes.forEach((node) => node.classList.add("timeline-inview"));
    }
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
    let isVisible = false;
    let rafId = 0;
    let nodeCache = [];
    const kickAnimate = () => {
      if (!rafId) rafId = requestAnimationFrame(animate);
    };
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
          if (isVisible) kickAnimate();
          else rafId = 0;
        });
      }, { threshold: 0.08, rootMargin: "120px 0px" });
      observer.observe(blogNodeMap);
    } else {
      isVisible = true;
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
      rafId = 0;
      if (document.hidden || !isVisible) return;
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

      rafId = requestAnimationFrame(animate);
    };
    if (!("IntersectionObserver" in window)) kickAnimate();
  };

  const randomizeFrameGeneration = () => {
    document.querySelectorAll("main section:not(.presence-timeline), .timeline-stage:not(.timeline-stage--calm)").forEach((node) => {
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

  randomizeFrameGeneration();

  const bootHeavyVisuals = () => {
    runTimelineGraph();
    wireTimelinePresence();
    window.addEventListener("blog-panel-change", (ev) => {
      const ids = ev.detail?.panelIds || [ev.detail?.panelId].filter(Boolean);
      if (ids.includes("presence")) {
        setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
      }
    });
    runBlogNodeMap();
    if (window.AdayMediaArchive) {
      window.AdayMediaArchive.wireYoutubeCatalog(blogYtSection, null, null, "blogYtSectionSearch");
      window.AdayMediaArchive.initWeeklybeatsArchive({
        rootId: "blogWbSection",
        dataUrl: "./data/weeklybeats_tracks.json"
      });
    }
    applyTimelineCategories();
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(bootHeavyVisuals, { timeout: 1400 });
  } else {
    setTimeout(bootHeavyVisuals, 60);
  }
})();
