(() => {
  const LS_PANEL = "blogShellPanel:v1";
  const panels = [...document.querySelectorAll(".blog-panel")];
  const navBtns = [...document.querySelectorAll(".blog-nav-btn[data-panel-target]")];
  if (!panels.length || !navBtns.length) return;

  const panelById = new Map(panels.map((p) => [p.dataset.panel, p]));
  const validIds = new Set(panelById.keys());

  const setActivePanel = (panelId, { scrollTop = false, pushHash = true } = {}) => {
    if (!validIds.has(panelId)) panelId = "overview";
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === panelId));
    navBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.panelTarget === panelId));
    try {
      localStorage.setItem(LS_PANEL, panelId);
    } catch {
      // ignore
    }
    if (pushHash) {
      const next = panelId === "overview" ? "#overview" : `#panel-${panelId}`;
      if (location.hash !== next) history.replaceState(null, "", next);
    }
    if (scrollTop) window.scrollTo({ top: 0, behavior: "auto" });
    window.dispatchEvent(new CustomEvent("blog-panel-change", { detail: { panelId } }));
  };

  const panelFromHash = () => {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return null;
    if (hash === "overview") return "overview";
    if (hash.startsWith("panel-")) return hash.slice(6);
    if (hash === "presenceTimeline" || hash === "presence") return "presence";
    if (hash.startsWith("devlog-")) return "devlog";
    if (hash === "blogYtSection" || hash === "blogWbSection") return "media";
    if (validIds.has(hash)) return hash;
    return null;
  };

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActivePanel(btn.dataset.panelTarget, { scrollTop: true });
    });
  });

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
      setActivePanel(panelId, { scrollTop: false, pushHash: true });
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

  const initial =
    panelFromHash() ||
    (() => {
      try {
        return localStorage.getItem(LS_PANEL);
      } catch {
        return null;
      }
    })() ||
    "overview";

  setActivePanel(initial, { scrollTop: false, pushHash: false });
  window.addEventListener("hashchange", () => {
    const p = panelFromHash();
    if (p) setActivePanel(p, { scrollTop: false, pushHash: false });
  });

  wireChapterCollapse();
})();
