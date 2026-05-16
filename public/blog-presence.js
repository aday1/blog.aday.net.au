(() => {
  const LS_FEED = "blogPresenceFeed:v1";

  const loadFilter = () => {
    try {
      return localStorage.getItem(LS_FEED) || "media";
    } catch {
      return "media";
    }
  };

  const saveFilter = (value) => {
    try {
      localStorage.setItem(LS_FEED, value);
    } catch {
      // ignore
    }
  };

  const tierForNode = (node) => {
    const tier = node.dataset.feedTier;
    if (tier) return tier;
    const source = (node.dataset.source || "").toLowerCase();
    if (["weeklybeats", "youtube", "vimeo", "soundcloud", "bandcamp", "post"].includes(source)) return "media";
    if (source.startsWith("devlog")) return "devlog";
    if (["github", "codepen"].includes(source)) return "code";
    return "signal";
  };

  const matchesFilter = (tier, filter) => {
    if (filter === "all") return true;
    if (filter === "media") return tier === "media" || tier === "post";
    if (filter === "code") return tier === "code" || tier === "devlog";
    if (filter === "signal") return tier === "signal";
    return true;
  };

  const applyFeedFilter = (root, filter) => {
    const list = root.querySelector("#presenceTimelineList");
    if (!list) return;
    list.dataset.feedFilter = filter;
    list.classList.add("feed-filter-active");
    root.querySelectorAll(".presence-feed-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.feedFilter === filter);
    });
    list.querySelectorAll(".timeline-node").forEach((node) => {
      const tier = tierForNode(node);
      node.classList.toggle("feed-hidden", !matchesFilter(tier, filter));
    });
  };

  const pauseOtherTimelineAudio = (active) => {
    document.querySelectorAll(".timeline-inline-audio").forEach((audio) => {
      if (audio !== active) audio.pause();
    });
  };

  const wireTimelineMedia = (root) => {
    root.querySelectorAll(".timeline-inline-audio").forEach((audio) => {
      audio.addEventListener("play", () => pauseOtherTimelineAudio(audio));
    });
  };

  const initPresenceFeed = () => {
    const root = document.getElementById("presenceTimeline");
    if (!root) return;

    let filter = loadFilter();
    if (!root.querySelector(`[data-feed-filter="${filter}"]`)) filter = "media";

    root.querySelectorAll(".presence-feed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.feedFilter || "media";
        saveFilter(filter);
        applyFeedFilter(root, filter);
      });
    });

    applyFeedFilter(root, filter);
    wireTimelineMedia(root);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPresenceFeed);
  } else {
    initPresenceFeed();
  }

  window.addEventListener("blog-panel-change", (ev) => {
    const ids = ev.detail?.panelIds || [ev.detail?.panelId].filter(Boolean);
    if (ids.includes("presence")) initPresenceFeed();
  });
})();
