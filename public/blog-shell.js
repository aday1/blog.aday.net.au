(() => {
  const LS_VIEW = "blogShellView:v1";
  const LS_PANEL = "blogShellPanel:v1";
  const LS_SPLIT_L = "blogShellSplitLeft:v1";
  const LS_SPLIT_R = "blogShellSplitRight:v1";

  const panelsRoot = document.querySelector(".blog-shell-panels");
  const panels = [...document.querySelectorAll(".blog-panel")];
  const nav = document.querySelector(".blog-section-nav");
  const navBtns = [...document.querySelectorAll(".blog-nav-btn[data-panel-target]")];
  if (!panels.length || !navBtns.length || !panelsRoot) return;

  const panelById = new Map(panels.map((p) => [p.dataset.panel, p]));
  const validIds = [...panelById.keys()];

  const load = (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const emitPanelChange = (panelIds) => {
    window.dispatchEvent(
      new CustomEvent("blog-panel-change", {
        detail: { panelId: panelIds[0], panelIds, view: viewMode }
      })
    );
    panelIds.forEach((id) => {
      if (id === "presence" || id === "devlog") {
        setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
      }
    });
  };

  let viewMode = load(LS_VIEW, "single");
  let singlePanel = load(LS_PANEL, "overview");
  let splitLeft = load(LS_SPLIT_L, "devlog");
  let splitRight = load(LS_SPLIT_R, "presence");

  if (!validIds.includes(singlePanel)) singlePanel = "overview";
  if (!validIds.includes(splitLeft)) splitLeft = "devlog";
  if (!validIds.includes(splitRight)) splitRight = "presence";
  if (splitLeft === splitRight) splitRight = splitLeft === "presence" ? "devlog" : "presence";

  const splitUi = document.createElement("div");
  splitUi.className = "blog-split-controls";
  splitUi.innerHTML = `
    <div class="blog-view-mode" role="group" aria-label="Layout mode">
      <span class="blog-split-label">Layout</span>
      <button type="button" class="blog-view-btn" data-view-mode="single">Single</button>
      <button type="button" class="blog-view-btn" data-view-mode="split">Split</button>
    </div>
    <div class="blog-split-pickers" hidden>
      <label class="blog-split-pick">Left
        <select class="blog-split-select" data-split-slot="left"></select>
      </label>
      <label class="blog-split-pick">Right
        <select class="blog-split-select" data-split-slot="right"></select>
      </label>
    </div>
    <div class="blog-split-presets" hidden>
      <span class="blog-split-label">Presets</span>
      <button type="button" class="blog-split-preset" data-split-preset="devlog|presence">Dev + Presence</button>
      <button type="button" class="blog-split-preset" data-split-preset="media|presence">Media + Presence</button>
      <button type="button" class="blog-split-preset" data-split-preset="devlog|media">Dev + Media</button>
    </div>
  `;
  nav.appendChild(splitUi);

  const viewBtns = [...splitUi.querySelectorAll(".blog-view-btn")];
  const pickersWrap = splitUi.querySelector(".blog-split-pickers");
  const presetsWrap = splitUi.querySelector(".blog-split-presets");
  const selectLeft = splitUi.querySelector('[data-split-slot="left"]');
  const selectRight = splitUi.querySelector('[data-split-slot="right"]');

  validIds.forEach((id) => {
    const label = id.charAt(0).toUpperCase() + id.slice(1);
    selectLeft.appendChild(new Option(label, id));
    selectRight.appendChild(new Option(label, id));
  });

  const clearPanelClasses = () => {
    panels.forEach((p) => {
      p.classList.remove("is-active", "is-split-left", "is-split-right");
    });
    navBtns.forEach((b) => b.classList.remove("is-active", "is-split-slot"));
  };

  const applyViewUi = () => {
    const splitOn = viewMode === "split";
    panelsRoot.dataset.view = viewMode;
    document.body.classList.toggle("blog-shell-split-on", splitOn);
    pickersWrap.hidden = !splitOn;
    presetsWrap.hidden = !splitOn;
    viewBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.viewMode === viewMode));
    selectLeft.value = splitLeft;
    selectRight.value = splitRight;
  };

  const setSinglePanel = (panelId, { scrollTop = false, pushHash = true } = {}) => {
    if (!validIds.includes(panelId)) panelId = "overview";
    singlePanel = panelId;
    save(LS_PANEL, panelId);
    clearPanelClasses();
    panelById.get(panelId)?.classList.add("is-active");
    navBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.panelTarget === panelId));
    if (pushHash) {
      const next = panelId === "overview" ? "#overview" : `#panel-${panelId}`;
      if (location.hash !== next) history.replaceState(null, "", next);
    }
    if (scrollTop) window.scrollTo({ top: 0, behavior: "auto" });
    emitPanelChange([panelId]);
  };

  const setSplitPanels = (leftId, rightId, { pushHash = true } = {}) => {
    if (!validIds.includes(leftId)) leftId = "devlog";
    if (!validIds.includes(rightId)) rightId = "presence";
    if (leftId === rightId) {
      rightId = validIds.find((id) => id !== leftId) || "presence";
    }
    splitLeft = leftId;
    splitRight = rightId;
    save(LS_SPLIT_L, leftId);
    save(LS_SPLIT_R, rightId);
    clearPanelClasses();
    panelById.get(leftId)?.classList.add("is-split-left");
    panelById.get(rightId)?.classList.add("is-split-right");
    navBtns.forEach((b) => {
      const t = b.dataset.panelTarget;
      b.classList.toggle("is-split-slot", t === leftId || t === rightId);
      b.classList.remove("is-active");
    });
    if (pushHash) {
      const next = `#split-${leftId}-${rightId}`;
      if (location.hash !== next) history.replaceState(null, "", next);
    }
    applyViewUi();
    emitPanelChange([leftId, rightId]);
  };

  const setViewMode = (mode) => {
    viewMode = mode === "split" ? "split" : "single";
    save(LS_VIEW, viewMode);
    applyViewUi();
    if (viewMode === "split") setSplitPanels(splitLeft, splitRight, { pushHash: true });
    else setSinglePanel(singlePanel, { scrollTop: false, pushHash: true });
  };

  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => setViewMode(btn.dataset.viewMode));
  });

  selectLeft.addEventListener("change", () => setSplitPanels(selectLeft.value, splitRight));
  selectRight.addEventListener("change", () => setSplitPanels(splitLeft, selectRight.value));

  splitUi.querySelectorAll(".blog-split-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [l, r] = (btn.dataset.splitPreset || "devlog|presence").split("|");
      setViewMode("split");
      setSplitPanels(l, r);
    });
  });

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.panelTarget;
      if (viewMode === "split") {
        if (btn.classList.contains("is-split-slot") && btn.dataset.splitSide === "left") {
          setSplitPanels(id, splitRight);
          return;
        }
        if (btn.classList.contains("is-split-slot") && btn.dataset.splitSide === "right") {
          setSplitPanels(splitLeft, id);
          return;
        }
        setSplitPanels(id, splitRight);
        return;
      }
      setSinglePanel(id, { scrollTop: true });
    });
    btn.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const id = btn.dataset.panelTarget;
      setViewMode("split");
      setSplitPanels(splitLeft, id);
    });
  });

  const panelFromHash = () => {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return null;
    if (hash.startsWith("split-")) {
      const parts = hash.slice(6).split("-");
      if (parts.length >= 2) {
        return { mode: "split", left: parts[0], right: parts.slice(1).join("-") };
      }
    }
    if (hash === "overview") return { mode: "single", panel: "overview" };
    if (hash.startsWith("panel-")) return { mode: "single", panel: hash.slice(6) };
    if (hash === "presenceTimeline" || hash === "presence") return { mode: "single", panel: "presence" };
    if (hash.startsWith("devlog-")) return { mode: "single", panel: "devlog" };
    if (hash === "blogYtSection" || hash === "blogWbSection") return { mode: "single", panel: "media" };
    if (validIds.includes(hash)) return { mode: "single", panel: hash };
    return null;
  };

  document.querySelectorAll(".story-train-link, .story-trains-hub a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      let panelId = "overview";
      if (href.includes("presence")) panelId = "presence";
      else if (href.includes("blogYt") || href.includes("blogWb")) panelId = "media";
      else if (href.includes("devlog")) panelId = "devlog";
      if (viewMode === "split") {
        setSplitPanels(splitLeft, panelId);
      } else {
        setSinglePanel(panelId, { scrollTop: false, pushHash: true });
      }
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      event.preventDefault();
    });
  });

  const wireChapterCollapse = () => {
    document.querySelectorAll(".devlog-chapter").forEach((chapter) => {
      const list = chapter.querySelector(".devlog-commit-list");
      if (!list) return;
      const entries = list.querySelectorAll(".devlog-entry");
      if (entries.length <= 5) return;
      chapter.classList.add("is-collapsed");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "devlog-chapter-toggle";
      btn.textContent = `Show all ${entries.length} commits`;
      btn.addEventListener("click", () => {
        const collapsed = chapter.classList.toggle("is-collapsed");
        btn.textContent = collapsed
          ? `Show all ${entries.length} commits`
          : "Collapse chapter";
      });
      chapter.insertBefore(btn, list);
    });
  };

  const bootFromHash = () => {
    const parsed = panelFromHash();
    if (parsed?.mode === "split") {
      viewMode = "split";
      save(LS_VIEW, "split");
      applyViewUi();
      setSplitPanels(parsed.left, parsed.right, { pushHash: false });
      return;
    }
    if (parsed?.mode === "single") {
      viewMode = "single";
      save(LS_VIEW, "single");
      applyViewUi();
      setSinglePanel(parsed.panel, { scrollTop: false, pushHash: false });
      return;
    }
    applyViewUi();
    if (viewMode === "split") setSplitPanels(splitLeft, splitRight, { pushHash: false });
    else setSinglePanel(singlePanel, { scrollTop: false, pushHash: false });
  };

  bootFromHash();
  window.addEventListener("hashchange", bootFromHash);
  wireChapterCollapse();
})();
