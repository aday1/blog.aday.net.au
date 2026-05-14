(() => {
  const body = document.body;
  const cursor = document.getElementById("retroCursor");
  const bgShader = document.getElementById("blogBgShader");
  const timelineGraph = document.getElementById("timelineGraph");
  const blogNodeMap = document.getElementById("blogNodeMap");
  const blogYtFrame = document.getElementById("blogYtFrame");
  const blogYtSelector = document.getElementById("blogYtSelector");
  const blogYtRandom = document.getElementById("blogYtRandom");
  const statusList = document.getElementById("systemStatusList");
  const pageTransition = document.getElementById("pageTransition");

  const finishBoot = () => body.classList.remove("boot-seq");
  const hideTransition = () => pageTransition?.classList.add("hidden");
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(hideTransition, 1500);
  });
  window.addEventListener("load", () => {
    setTimeout(finishBoot, 800);
    setTimeout(hideTransition, 900);
  });
  window.addEventListener("pageshow", () => {
    setTimeout(hideTransition, 120);
  });
  setTimeout(finishBoot, 3600);
  setTimeout(hideTransition, 3800);

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

  if (cursor) {
    window.addEventListener("mousemove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
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
    const entries = labels.map((el, idx) => {
      const rawDate = (el.querySelector(".date")?.textContent || "").trim();
      const title = (el.dataset.title || el.textContent || `node-${idx}`).trim();
      const date = new Date(rawDate);
      return {
        idx,
        title,
        rawDate,
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
      const laneTop = h * 0.2;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(90, 166, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padX, axisY);
      ctx.lineTo(w - padX, axisY);
      ctx.stroke();

      const years = [...new Set(entries.map((item) => new Date(item.ts).getUTCFullYear()))].sort((a, b) => a - b);
      years.forEach((year) => {
        const yrTs = Date.UTC(year, 0, 1);
        const x = padX + ((yrTs - minTs) / range) * (w - padX * 2);
        ctx.strokeStyle = "rgba(134, 198, 255, 0.22)";
        ctx.beginPath();
        ctx.moveTo(x, laneTop);
        ctx.lineTo(x, axisY + 18);
        ctx.stroke();
        ctx.fillStyle = "rgba(168, 228, 255, 0.76)";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(String(year), x - 14, axisY + 30);
      });

      const points = entries.map((item, i) => {
        const x = padX + ((item.ts - minTs) / range) * (w - padX * 2);
        const lane = (i % 3);
        const y = laneTop + lane * 34 + Math.sin(t * 1.2 + i * 0.7) * 3;
        return { ...item, x, y };
      });

      ctx.strokeStyle = "rgba(118, 205, 255, 0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      points.forEach((p, i) => {
        const pulse = 3.4 + 2.1 * (0.5 + 0.5 * Math.sin(t * 2.1 + i));
        ctx.strokeStyle = "rgba(145, 255, 166, 0.72)";
        ctx.fillStyle = "rgba(145, 255, 166, 0.24)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse + 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(169, 255, 176, 0.94)";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + pulse);
        ctx.lineTo(p.x, axisY);
        ctx.strokeStyle = "rgba(145, 255, 166, 0.28)";
        ctx.stroke();
      });

      const sweepX = padX + ((t * 90) % (w - padX * 2));
      ctx.strokeStyle = "rgba(172, 250, 255, 0.18)";
      ctx.beginPath();
      ctx.moveTo(sweepX, laneTop - 8);
      ctx.lineTo(sweepX, axisY + 10);
      ctx.stroke();

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const runBlogNodeMap = () => {
    if (!blogNodeMap) return;
    const ctx = blogNodeMap.getContext("2d");
    if (!ctx) return;
    const linkRows = [...document.querySelectorAll(".node-links li[data-node-id][data-url]")];
    if (!linkRows.length) return;
    const nodeDefs = [
      { id: "blog-home", x: 0.5, y: 0.2, c: "#9eff89" },
      { id: "aday-main", x: 0.2, y: 0.35, c: "#9ed1ff" },
      { id: "demozoo-artifacts", x: 0.8, y: 0.35, c: "#a9f8ff" },
      { id: "weeklybeats-xref", x: 0.22, y: 0.62, c: "#9fffbf" },
      { id: "post-vimeo-index", x: 0.43, y: 0.62, c: "#b5d8ff" },
      { id: "post-media-deck", x: 0.57, y: 0.62, c: "#b5d8ff" },
      { id: "post-boot", x: 0.72, y: 0.62, c: "#b5d8ff" },
      { id: "repo-blog", x: 0.5, y: 0.84, c: "#ffd38e" }
    ];
    const edges = [
      ["blog-home", "aday-main"],
      ["blog-home", "demozoo-artifacts"],
      ["blog-home", "weeklybeats-xref"],
      ["blog-home", "post-vimeo-index"],
      ["blog-home", "post-media-deck"],
      ["blog-home", "post-boot"],
      ["post-vimeo-index", "demozoo-artifacts"],
      ["post-media-deck", "weeklybeats-xref"],
      ["post-boot", "repo-blog"],
      ["blog-home", "repo-blog"]
    ];
    const linkById = new Map(linkRows.map((row) => [row.dataset.nodeId, row]));
    let hoverId = "";
    let isVisible = true;
    let nodeCache = [];

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

      nodeCache = nodeDefs.map((n, i) => ({
        ...n,
        r: 5.5 + ((i + 1) % 3),
        px: n.x * w + Math.sin(t * 0.9 + i) * 6,
        py: n.y * h + Math.cos(t * 1.1 + i * 0.5) * 4
      }));
      const byId = new Map(nodeCache.map((n) => [n.id, n]));

      edges.forEach(([a, b], i) => {
        const na = byId.get(a);
        const nb = byId.get(b);
        if (!na || !nb) return;
        const pulse = 0.2 + 0.24 * (0.5 + 0.5 * Math.sin(t * 2.0 + i));
        ctx.strokeStyle = `rgba(120, 206, 255, ${pulse.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(na.px, na.py);
        ctx.lineTo(nb.px, nb.py);
        ctx.stroke();
      });

      nodeCache.forEach((n) => {
        const hovered = hoverId === n.id;
        ctx.fillStyle = n.c;
        ctx.beginPath();
        ctx.arc(n.px, n.py, n.r + (hovered ? 1.5 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(156, 255, 176, 0.34)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.px, n.py, n.r + 6 + Math.sin(t * 1.6 + n.r) * 1.8, 0, Math.PI * 2);
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
      "https://www.youtube-nocookie.com/embed?listType=user_uploads&list=aday1",
      "https://www.youtube-nocookie.com/embed?listType=user_uploads&list=Aday",
      "https://www.youtube-nocookie.com/embed?listType=search&list=aday+macroverse+visual",
      "https://www.youtube-nocookie.com/embed?listType=search&list=aday+chiptune+live"
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

  if (statusList) {
    const rows = [...statusList.querySelectorAll("li[data-url]")];
    const updateStatus = async (row) => {
      const url = row.getAttribute("data-url");
      const tag = row.querySelector(".status-tag");
      if (!url || !tag) return;
      tag.textContent = "checking";
      tag.className = "status-tag status-checking";
      try {
        await fetch(url, { method: "HEAD", mode: "no-cors" });
        tag.textContent = "online";
        tag.className = "status-tag status-online";
      } catch {
        tag.textContent = "unknown";
        tag.className = "status-tag status-unknown";
      }
    };
    rows.forEach((row, idx) => setTimeout(() => updateStatus(row), 260 * idx));
  }
})();
