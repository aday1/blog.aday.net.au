(() => {
  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const wireYoutubeCatalog = (section, frameId, nowPlayingId, searchInputId) => {
    const ytSection = section || document.getElementById("mediaYtSection") || document.getElementById("blogYtSection");
    const ytFrame = document.getElementById(frameId || "mediaYtFrame") || document.getElementById("blogYtFrame");
    const ytNowPlaying = document.getElementById(nowPlayingId || "mediaYtNowPlaying") || document.getElementById("blogYtNowPlaying");
    const ytSearch = searchInputId ? document.getElementById(searchInputId) : document.getElementById("mediaYtSearch") || document.getElementById("blogYtSearch");
    const ytChannelFilter = document.getElementById("mediaYtChannelFilter") || document.getElementById("blogYtChannelFilter");

    if (!ytSection || !ytFrame) return;

    const tabs = [...ytSection.querySelectorAll(".yt-cat-tab")];
    const panels = [...ytSection.querySelectorAll(".yt-cat-panel")];
    const picks = [...ytSection.querySelectorAll(".yt-video-pick")];

    const loadVideo = (videoId, title) => {
      if (!videoId) return;
      const embed = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      if (ytFrame.dataset.loadedId !== videoId) {
        ytFrame.src = embed;
        ytFrame.dataset.loadedId = videoId;
      }
      if (ytNowPlaying && title) ytNowPlaying.textContent = title;
      picks.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.videoId === videoId);
      });
    };

    const applySearch = () => {
      const q = (ytSearch?.value || "").trim().toLowerCase();
      const channel = ytChannelFilter?.value || "all";
      picks.forEach((btn) => {
        const title = (btn.dataset.videoTitle || btn.textContent || "").toLowerCase();
        const handle = (btn.dataset.channelHandle || "").toLowerCase();
        const channelPass = channel === "all" || handle.includes(channel.replace("@", ""));
        const textPass = !q || title.includes(q);
        btn.closest("li")?.classList.toggle("yt-pick-hidden", !(channelPass && textPass));
      });
    };

    const showSection = (sectionId) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.ytSection === sectionId;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((panel) => {
        const on = panel.dataset.ytSectionPanel === sectionId;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
      applySearch();
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showSection(tab.dataset.ytSection || ""));
    });

    picks.forEach((btn) => {
      btn.addEventListener("click", () => {
        loadVideo(btn.dataset.videoId || "", btn.dataset.videoTitle || btn.textContent || "");
      });
    });

    ytSearch?.addEventListener("input", applySearch);
    ytChannelFilter?.addEventListener("change", applySearch);

    const defaultPick =
      picks.find((btn) => btn.closest(".yt-cat-panel.is-active") && !btn.closest("li")?.classList.contains("yt-pick-hidden")) ||
      picks.find((btn) => !btn.closest("li")?.classList.contains("yt-pick-hidden")) ||
      picks[0];

    if (defaultPick) {
      loadVideo(defaultPick.dataset.videoId || "", defaultPick.dataset.videoTitle || "");
    }
  };

  const initWeeklybeatsArchive = async (options = {}) => {
    const root = document.getElementById(options.rootId || "mediaWbSection") || document.getElementById("blogWbSection");
    if (!root) return;

    const listEl = root.querySelector(".wb-track-list");
    const audioEl = root.querySelector(".wb-audio-player");
    const iframeEl = root.querySelector(".wb-embed-frame");
    const metaEl = root.querySelector(".wb-track-meta");
    const searchEl = root.querySelector(".wb-search");
    const yearEl = root.querySelector(".wb-year-filter");
    const weekEl = root.querySelector(".wb-week-filter");
    const sortEl = root.querySelector(".wb-sort");
    const countEl = root.querySelector(".wb-track-count");

    if (!listEl) return;

    let tracks = [];
    try {
      const resp = await fetch(options.dataUrl || "./data/weeklybeats_tracks.json", { cache: "no-store" });
      if (!resp.ok) throw new Error("manifest load failed");
      const payload = await resp.json();
      tracks = Array.isArray(payload.tracks) ? payload.tracks : [];
    } catch (err) {
      listEl.innerHTML = `<li class="wb-empty">WeeklyBeats catalog failed to load: ${escapeHtml(err.message)}</li>`;
      return;
    }

    const sortTracks = (list) => {
      const mode = sortEl?.value || "year-desc";
      const copy = [...list];
      copy.sort((a, b) => {
        if (mode === "year-asc") return (a.year - b.year) || ((a.week || 0) - (b.week || 0));
        if (mode === "week-asc") return ((a.week || 0) - (b.week || 0)) || (b.year - a.year);
        if (mode === "week-desc") return ((b.week || 0) - (a.week || 0)) || (b.year - a.year);
        if (mode === "title-asc") return String(a.title || "").localeCompare(String(b.title || ""));
        return (b.year - a.year) || ((a.week || 0) - (b.week || 0));
      });
      return copy;
    };

    const playTrack = (track) => {
      if (!track) return;
      const title = track.title || track.slug || "WeeklyBeats track";
      if (metaEl) {
        metaEl.textContent = track.description || "No description.";
      }
      if (audioEl && track.audio_url) {
        audioEl.hidden = false;
        audioEl.src = track.audio_url;
        if (iframeEl) iframeEl.hidden = true;
        audioEl.play().catch(() => {});
        return;
      }
      if (iframeEl && track.embed_url) {
        iframeEl.hidden = false;
        iframeEl.src = track.embed_url;
        if (audioEl) {
          audioEl.hidden = true;
          audioEl.removeAttribute("src");
        }
      }
    };

    const render = () => {
      const q = (searchEl?.value || "").trim().toLowerCase();
      const year = yearEl?.value || "all";
      const week = weekEl?.value || "all";
      const filtered = sortTracks(
        tracks.filter((item) => {
          const yearPass = year === "all" || String(item.year) === year;
          const weekPass = week === "all" || String(item.week || "") === week;
          const hay = `${item.title || ""} ${item.description || ""} ${item.slug || ""}`.toLowerCase();
          const searchPass = !q || hay.includes(q);
          return yearPass && weekPass && searchPass;
        })
      );

      if (countEl) countEl.textContent = `${filtered.length} track(s)`;

      listEl.innerHTML = filtered
        .map((track) => {
          const img = track.image_url
            ? `<img class="wb-track-thumb" src="${escapeHtml(track.image_url)}" alt="" loading="lazy">`
            : `<span class="wb-track-thumb wb-track-thumb--empty" aria-hidden="true"></span>`;
          return `<li><button type="button" class="wb-track-pick" data-slug="${escapeHtml(track.slug)}">
            ${img}
            <span class="wb-track-pick-text"><strong>${escapeHtml(track.title)}</strong>
            <span class="wb-track-pick-meta">${escapeHtml(String(track.year || "?"))} / W${escapeHtml(String(track.week || "?"))}</span></span>
          </button></li>`;
        })
        .join("");

      listEl.querySelectorAll(".wb-track-pick").forEach((btn) => {
        btn.addEventListener("click", () => {
          const slug = btn.dataset.slug;
          const track = filtered.find((t) => t.slug === slug);
          listEl.querySelectorAll(".wb-track-pick").forEach((b) => b.classList.toggle("is-active", b === btn));
          playTrack(track);
        });
      });

      const first = filtered[0];
      if (first) playTrack(first);
    };

    if (yearEl) {
      const years = [...new Set(tracks.map((t) => t.year).filter(Boolean))].sort((a, b) => b - a);
      years.forEach((y) => {
        const opt = document.createElement("option");
        opt.value = String(y);
        opt.textContent = String(y);
        yearEl.appendChild(opt);
      });
    }

    const refreshWeeks = () => {
      if (!weekEl) return;
      const year = yearEl?.value || "all";
      const weeks = [
        ...new Set(
          tracks
            .filter((t) => year === "all" || String(t.year) === year)
            .map((t) => t.week)
            .filter((w) => Number.isFinite(w))
        )
      ].sort((a, b) => a - b);
      weekEl.innerHTML = '<option value="all">all weeks</option>';
      weeks.forEach((w) => {
        const opt = document.createElement("option");
        opt.value = String(w);
        opt.textContent = `week ${w}`;
        weekEl.appendChild(opt);
      });
    };

    refreshWeeks();
    yearEl?.addEventListener("change", () => {
      refreshWeeks();
      render();
    });
    weekEl?.addEventListener("change", render);
    sortEl?.addEventListener("change", render);
    searchEl?.addEventListener("input", render);

    render();
  };

  window.AdayMediaArchive = { wireYoutubeCatalog, initWeeklybeatsArchive };
})();
