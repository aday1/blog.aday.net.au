(() => {
  const wbYearBanner = (year) => {
    const y = Number(year);
    if (Number.isFinite(y) && y >= 2012 && y <= 2030) {
      return `https://weeklybeats.com/images/wb${y}-social.jpg`;
    }
    return "https://weeklybeats.com/images/wb2026-social.jpg";
  };

  const ytEmbedUrl = (videoId) =>
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const truncate = (text, max = 140) => {
    const t = String(text || "").trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 3)}...`;
  };

  const pauseOtherYoutube = (section, activeCard) => {
    section.querySelectorAll(".yt-video-card.is-playing").forEach((card) => {
      if (card === activeCard) return;
      card.classList.remove("is-playing");
      const player = card.querySelector(".yt-inline-player");
      const frame = card.querySelector(".yt-inline-frame");
      player?.setAttribute("hidden", "");
      if (frame) {
        frame.removeAttribute("src");
        frame.dataset.loadedId = "";
      }
      card.querySelector(".yt-video-pick")?.setAttribute("aria-expanded", "false");
    });
  };

  const pauseOtherWeeklybeats = (root, activeAudio) => {
    root.querySelectorAll(".wb-inline-audio").forEach((audio) => {
      if (audio !== activeAudio) audio.pause();
    });
  };

  const wireYoutubeCatalog = (section, _frameId, _nowPlayingId, searchInputId) => {
    const ytSection = section || document.getElementById("mediaYtSection") || document.getElementById("blogYtSection");
    const ytSearch = searchInputId
      ? document.getElementById(searchInputId)
      : document.getElementById("mediaYtSearch") ||
        document.getElementById("blogYtSearch") ||
        document.getElementById("blogYtSectionSearch");
    const ytChannelFilter =
      document.getElementById("mediaYtChannelFilter") ||
      document.getElementById("blogYtChannelFilter") ||
      document.getElementById("blogYtSectionChannel");

    if (!ytSection) return;

    const tabs = [...ytSection.querySelectorAll(".yt-cat-tab")];
    const panels = [...ytSection.querySelectorAll(".yt-cat-panel")];
    const cards = () => [...ytSection.querySelectorAll(".yt-video-card")];

    const toggleCard = (card) => {
      const pick = card.querySelector(".yt-video-pick");
      const player = card.querySelector(".yt-inline-player");
      const frame = card.querySelector(".yt-inline-frame");
      const videoId = pick?.dataset.videoId || "";
      if (!videoId || !player || !frame) return;

      const willOpen = !card.classList.contains("is-playing");
      pauseOtherYoutube(ytSection, willOpen ? card : null);

      if (!willOpen) {
        card.classList.remove("is-playing");
        player.setAttribute("hidden", "");
        frame.removeAttribute("src");
        frame.dataset.loadedId = "";
        pick.setAttribute("aria-expanded", "false");
        return;
      }

      card.classList.add("is-playing");
      pick.classList.add("is-active");
      pick.setAttribute("aria-expanded", "true");
      player.removeAttribute("hidden");
      if (frame.dataset.loadedId !== videoId) {
        frame.src = ytEmbedUrl(videoId);
        frame.dataset.loadedId = videoId;
      }

      cards().forEach((c) => {
        if (c === card) return;
        c.querySelector(".yt-video-pick")?.classList.remove("is-active");
      });
    };

    const applySearch = () => {
      const q = (ytSearch?.value || "").trim().toLowerCase();
      const channel = ytChannelFilter?.value || "all";
      cards().forEach((card) => {
        const pick = card.querySelector(".yt-video-pick");
        const title = (pick?.dataset.videoTitle || pick?.textContent || "").toLowerCase();
        const handle = (pick?.dataset.channelHandle || "").toLowerCase();
        const channelPass = channel === "all" || handle.includes(channel.replace("@", ""));
        const textPass = !q || title.includes(q);
        const show = channelPass && textPass;
        card.classList.toggle("yt-pick-hidden", !show);
        if (!show && card.classList.contains("is-playing")) {
          card.classList.remove("is-playing");
          card.querySelector(".yt-inline-player")?.setAttribute("hidden", "");
          const frame = card.querySelector(".yt-inline-frame");
          if (frame) {
            frame.removeAttribute("src");
            frame.dataset.loadedId = "";
          }
        }
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
      pauseOtherYoutube(ytSection, null);
      applySearch();
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showSection(tab.dataset.ytSection || ""));
    });

    cards().forEach((card) => {
      const pick = card.querySelector(".yt-video-pick");
      if (!pick) return;
      pick.setAttribute("aria-expanded", "false");
      pick.addEventListener("click", (ev) => {
        ev.preventDefault();
        toggleCard(card);
      });
    });

    ytSearch?.addEventListener("input", applySearch);
    ytChannelFilter?.addEventListener("change", applySearch);
    applySearch();
  };

  const initWeeklybeatsArchive = async (options = {}) => {
    const root = document.getElementById(options.rootId || "mediaWbSection") || document.getElementById("blogWbSection");
    if (!root) return;

    const listEl = root.querySelector(".wb-track-list");
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

    const renderTrackCard = (track) => {
      const bannerSrc = track.banner_url || wbYearBanner(track.year);
      const img = bannerSrc
        ? `<img class="wb-track-banner" src="${escapeHtml(bannerSrc)}" alt="WeeklyBeats ${escapeHtml(String(track.year || ""))} banner" loading="lazy" decoding="async">`
        : `<span class="wb-track-banner wb-track-thumb--empty" aria-hidden="true"></span>`;
      const audio = track.audio_url
        ? `<audio class="wb-inline-audio" controls preload="none" src="${escapeHtml(track.audio_url)}"></audio>`
        : `<p class="wb-inline-missing">No direct audio URL — <a href="${escapeHtml(track.url || "#")}" target="_blank" rel="noopener noreferrer">open on WeeklyBeats</a></p>`;
      const desc = track.description ? `<p class="wb-track-card-desc">${escapeHtml(truncate(track.description))}</p>` : "";
      return `<li class="wb-track-card" data-slug="${escapeHtml(track.slug)}">
        <article class="wb-track-card-inner">
          ${img}
          <div class="wb-track-card-body">
            <p class="wb-track-card-head">
              <strong class="wb-track-card-title">${escapeHtml(track.title)}</strong>
              <span class="wb-track-pick-meta">${escapeHtml(String(track.year || "?"))} / W${escapeHtml(String(track.week || "?"))}</span>
            </p>
            ${audio}
            ${desc}
            <p class="wb-track-card-links"><a href="${escapeHtml(track.url || "#")}" target="_blank" rel="noopener noreferrer">weeklybeats page</a></p>
          </div>
        </article>
      </li>`;
    };

    const wirePlayers = () => {
      listEl.querySelectorAll(".wb-inline-audio").forEach((audio) => {
        audio.addEventListener("play", () => {
          pauseOtherWeeklybeats(root, audio);
          audio.closest(".wb-track-card")?.classList.add("is-playing");
          listEl.querySelectorAll(".wb-track-card").forEach((card) => {
            if (!card.contains(audio)) card.classList.remove("is-playing");
          });
        });
        audio.addEventListener("pause", () => {
          if (audio.paused) audio.closest(".wb-track-card")?.classList.remove("is-playing");
        });
      });
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
      listEl.innerHTML = filtered.map(renderTrackCard).join("") || `<li class="wb-empty">No tracks match filters.</li>`;
      wirePlayers();
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
