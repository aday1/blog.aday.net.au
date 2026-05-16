import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "posts");
const outDir = path.join(root, "public");
const outPostsDir = path.join(outDir, "posts");
const outDataDir = path.join(outDir, "data");
const adayWeeklybeatsPath = path.resolve(root, "..", "aday-net-au", "public", "data", "weeklybeats_tracks.json");
const artifactSourcesPath = path.join(root, "scripts", "artifact-sources.json");
const postAssetsPath = path.join(root, "scripts", "post-assets.json");

if (!fs.existsSync(postsDir)) {
  throw new Error("posts directory missing");
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(outPostsDir, { recursive: true });
fs.mkdirSync(outDataDir, { recursive: true });

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const postAssets = (() => {
  try {
    if (!fs.existsSync(postAssetsPath)) return {};
    return JSON.parse(fs.readFileSync(postAssetsPath, "utf8"));
  } catch {
    return {};
  }
})();

const inlineFormat = (text) => {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  });
  return out;
};

const renderFilmFigure = ({ src, alt = "", caption = "", credit = "", fallbacks = [] }) => {
  const fb =
    fallbacks.length > 0
      ? ` data-fallbacks="${escapeHtml(fallbacks.join("|"))}"`
      : "";
  const creditHtml = credit ? `<span class="film-credit">${escapeHtml(credit)}</span>` : "";
  const capHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="film-frame">
  <div class="film-frame-stack">
    <img class="film-photo" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${fb} loading="lazy" decoding="async">
    <span class="film-phosphor" aria-hidden="true"></span>
    <span class="film-grain" aria-hidden="true"></span>
    <span class="film-scratch film-scratch-outer" aria-hidden="true"></span>
    <span class="film-scratch film-scratch-inner" aria-hidden="true"></span>
  </div>
  ${creditHtml}
  ${capHtml}
</figure>`;
};

const renderPostAssetsBlock = (slug) => {
  const pack = postAssets[slug];
  if (!pack) return "";
  const parts = [];
  if (pack.hero) parts.push(renderFilmFigure(pack.hero));
  if (Array.isArray(pack.gallery) && pack.gallery.length) {
    const tiles = pack.gallery.map((item) => renderFilmFigure(item)).join("\n");
    parts.push(`<div class="film-gallery">\n${tiles}\n</div>`);
  }
  return parts.join("\n");
};

const mdToHtml = (md) => {
  const lines = md.split("\n");
  const out = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      closeList();
      out.push(renderFilmFigure({ src: imgMatch[2], alt: imgMatch[1], caption: imgMatch[1] }));
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      closeList();
      out.push("");
      continue;
    }
    closeList();
    out.push(`<p>${inlineFormat(line)}</p>`);
  }
  closeList();
  return out.join("\n");
};

const filmHeadLinks = `  <link rel="stylesheet" href="/blog-film.css">
  <link rel="stylesheet" href="/timeline-spread.css">`;
const filmBodyScripts = `  <script src="/blog-film.js" defer></script>`;

const deployMetaHtml = `<div id="deployMetaDock" style="position:fixed;right:10px;bottom:10px;z-index:9999;max-width:min(420px,calc(100vw - 20px));font:11px/1.45 ui-monospace,Consolas,monospace;">
  <div id="deployMetaRestore" hidden style="margin-bottom:6px;text-align:right;">
    <button type="button" id="deployMetaShowBtn" style="font:inherit;cursor:pointer;padding:4px 10px;border:1px solid #4cff8a;background:rgba(0,0,0,.88);color:#b8ffd1;border-radius:3px;box-shadow:0 2px 10px rgba(0,0,0,.45);">build info</button>
  </div>
  <div id="deployMetaPanel" role="region" aria-label="Build metadata" style="border:1px solid #4cff8a;background:rgba(0,0,0,.92);color:#b8ffd1;box-sizing:border-box;border-radius:3px;box-shadow:0 4px 18px rgba(0,0,0,.55);">
    <div id="deployMetaBar" tabindex="0" role="button" aria-expanded="false" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;cursor:pointer;user-select:none;">
      <span id="deployMetaSummary" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Loading...</span>
      <span id="deployMetaExpandGlyph" style="opacity:.85;flex-shrink:0;font-weight:700;">[+]</span>
      <button type="button" id="deployMetaHideBtn" style="flex-shrink:0;font:inherit;cursor:pointer;padding:2px 6px;margin:0;border:1px solid rgba(76,255,138,.55);background:transparent;color:#b8ffd1;border-radius:2px;">hide</button>
    </div>
    <div id="deployMetaDetail" hidden style="padding:0 12px 10px;">
      <div id="deployMetaTitle" style="font-weight:700;color:#fff;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(76,255,138,.35);letter-spacing:.06em;text-transform:uppercase;">build info</div>
      <div id="deployMetaBody">Loading deploy metadata...</div>
      <div style="margin-top:8px;">
        <button type="button" id="deployMetaCollapseBtn" style="font:inherit;cursor:pointer;padding:3px 8px;border:1px solid rgba(76,255,138,.55);background:transparent;color:#b8ffd1;border-radius:2px;">collapse</button>
      </div>
    </div>
  </div>
</div>
  <script>
    (function () {
      var LS_KEY = "deployMetaDock:" + (typeof location !== "undefined" ? location.hostname : "");
      var bodyEl = document.getElementById("deployMetaBody");
      var panel = document.getElementById("deployMetaPanel");
      var dock = document.getElementById("deployMetaDock");
      var bar = document.getElementById("deployMetaBar");
      var summaryEl = document.getElementById("deployMetaSummary");
      var detailEl = document.getElementById("deployMetaDetail");
      var expandGlyph = document.getElementById("deployMetaExpandGlyph");
      var hideBtn = document.getElementById("deployMetaHideBtn");
      var collapseBtn = document.getElementById("deployMetaCollapseBtn");
      var restoreWrap = document.getElementById("deployMetaRestore");
      var showBtn = document.getElementById("deployMetaShowBtn");
      if (!bodyEl || !panel || !dock || !bar || !summaryEl || !detailEl || !expandGlyph || !hideBtn || !collapseBtn || !restoreWrap || !showBtn) return;
      function uiLoad() {
        try {
          var v = localStorage.getItem(LS_KEY);
          if (v === "hidden") return "hidden";
          if (v === "expanded") return "expanded";
        } catch (eU) {}
        return "collapsed";
      }
      function uiSave(mode) {
        try { localStorage.setItem(LS_KEY, mode); } catch (eS) {}
      }
      function syncUi(mode) {
        if (mode === "hidden") {
          restoreWrap.hidden = false;
          panel.hidden = true;
        } else {
          restoreWrap.hidden = true;
          panel.hidden = false;
          if (mode === "expanded") {
            detailEl.hidden = false;
            bar.setAttribute("aria-expanded", "true");
            expandGlyph.textContent = "[-]";
          } else {
            detailEl.hidden = true;
            bar.setAttribute("aria-expanded", "false");
            expandGlyph.textContent = "[+]";
          }
        }
      }
      function expand() {
        uiSave("expanded");
        syncUi("expanded");
      }
      function collapse() {
        uiSave("collapsed");
        syncUi("collapsed");
      }
      function hideDock() {
        uiSave("hidden");
        syncUi("hidden");
      }
      function showDock() {
        uiSave("collapsed");
        syncUi("collapsed");
      }
      bar.addEventListener("click", function (ev) {
        if (ev.target && ev.target.closest && ev.target.closest("#deployMetaHideBtn")) return;
        if (detailEl.hidden) expand(); else collapse();
      });
      bar.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        if (ev.target && ev.target.closest && ev.target.closest("#deployMetaHideBtn")) return;
        ev.preventDefault();
        if (detailEl.hidden) expand(); else collapse();
      });
      hideBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        hideDock();
      });
      collapseBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        collapse();
      });
      showBtn.addEventListener("click", showDock);
      syncUi(uiLoad());
      function esc(s) {
        return String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      }
      function tzName() {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        } catch (eTz) {
          return "";
        }
      }
      function fmt(iso) {
        if (!iso) return "(unknown)";
        try {
          var d = new Date(iso);
          if (Number.isNaN(d.getTime())) return String(iso);
          var main = d.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZoneName: "short",
          });
          var iana = tzName();
          if (iana) return main + " (" + iana + ")";
          return main;
        } catch (err) {
          return String(iso);
        }
      }
      function age(iso, kind) {
        if (!iso) return "";
        var tag = kind === "deploy" ? "deploy" : "build";
        var t = new Date(iso).getTime();
        if (Number.isNaN(t)) return "";
        var sec = Math.round((Date.now() - t) / 1000);
        if (sec < -120) return "";
        if (sec < 45) return "now";
        if (sec < 3600) return Math.round(sec / 60) + "m since " + tag;
        if (sec < 86400) return Math.round(sec / 3600) + "h since " + tag;
        if (sec < 604800) return Math.round(sec / 86400) + "d since " + tag;
        if (sec < 4233600) return Math.round(sec / 604800) + "wk since " + tag;
        var mo = Math.round(sec / (30.4375 * 86400));
        if (mo < 24) return mo + "mo since " + tag;
        return Math.round(sec / (365.2425 * 86400)) + "yr since " + tag;
      }
      function render(m) {
        var shaRaw = m.last_git_sha_short || m.version || "?";
        var buildIso = m.last_build_at || m.build_date || "";
        var depIso = m.last_deployed_at || m.last_build_at || m.build_date || "";
        var ageB = age(buildIso, "build");
        var ageD = age(depIso, "deploy");
        var siteLab = (m.site ? String(m.site) : "").toUpperCase().replace(/\\s+/g, "") || "SITE";
        var sumParts = [siteLab, String(shaRaw)];
        if (ageB) sumParts.push(ageB);
        summaryEl.textContent = sumParts.join(" | ");
        var sha = esc(shaRaw);
        var gitHref = esc(m.last_git_url || m.changelog_url || "#");
        var ch = m.changelog_url || "";
        var hist = m.commits_history_url || "";
        var md = m.changelog_md_url || "";
        var run = m.workflow_run_url || "";
        var branch = esc(m.track || m.branch || "");
        var note = m.deploy_note ? "<div style=\\"opacity:.82;margin-top:6px;font-size:10px;\\">" + esc(m.deploy_note) + "</div>" : "";
        var title = document.getElementById("deployMetaTitle");
        if (title) title.textContent = (m.site ? String(m.site).toUpperCase() : "SITE") + " // build info";
        var html = "";
        html += "<div style=\\"margin:4px 0\\"><strong>Last git:</strong> <a href=\\"" + gitHref + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">" + sha + "</a>";
        if (branch) html += " <span style=\\"opacity:.75\\">(" + branch + ")</span>";
        html += "</div>";
        var localTz = tzName();
        if (localTz) html += "<div style=\\"opacity:.78;margin:0 0 4px;font-size:10px\\"><strong>Your timezone:</strong> " + esc(localTz) + "</div>";
        html += "<div style=\\"margin:4px 0\\"><strong>Last build (CI):</strong> " + esc(fmt(buildIso));
        if (ageB) html += " <span style=\\"opacity:.82\\">" + esc(ageB) + "</span>";
        html += "</div>";
        html += "<div style=\\"margin:4px 0\\"><strong>Last deployed (CI push):</strong> " + esc(fmt(depIso));
        if (ageD) html += " <span style=\\"opacity:.82\\">" + esc(ageD) + "</span>";
        if (run) html += " <a href=\\"" + esc(run) + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">workflow</a>";
        html += "</div>";
        var rel = m.releases_url || "";
        var links = [];
        if (ch) links.push("<a href=\\"" + esc(ch) + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">This commit</a>");
        if (hist) links.push("<a href=\\"" + esc(hist) + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">Branch history</a>");
        if (md) links.push("<a href=\\"" + esc(md) + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">CHANGELOG.md</a>");
        if (rel) links.push("<a href=\\"" + esc(rel) + "\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">Releases</a>");
        if (links.length) {
          html += "<div style=\\"margin:8px 0 0;padding-top:6px;border-top:1px solid rgba(76,255,138,.35)\\"><strong>Changelog / history:</strong> " + links.join(' <span aria-hidden="true">|</span> ') + "</div>";
        }
        html += note;
        bodyEl.innerHTML = html;
      }
      if (typeof window.__DEPLOY_META__ !== "undefined" && window.__DEPLOY_META__) {
        render(window.__DEPLOY_META__);
      }
      fetch("/data/deploy-meta.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("missing")); })
        .catch(function () {
          return fetch("data/deploy-meta.json", { cache: "no-store" }).then(function (r2) {
            return r2.ok ? r2.json() : Promise.reject(new Error("missing"));
          });
        })
        .then(render)
        .catch(function () {
          summaryEl.textContent = "build meta unavailable";
          if (!window.__DEPLOY_META__) bodyEl.textContent = "Deploy metadata unavailable.";
        });
    })();
  </script>`;

const slugifySource = (value) =>
  String(value || "unknown")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "") || "unknown";

const parseIsoDate = (value) => {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "1970-01-01";
  return d.toISOString().slice(0, 10);
};

const yearWeekToDate = (year, week) => {
  const y = Number(year);
  const w = Number(week);
  if (!Number.isFinite(y) || !Number.isFinite(w) || w < 1 || w > 53) return `${String(year || "1970").slice(0, 4)}-01-01`;
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const isoWeek1Monday = new Date(jan4);
  isoWeek1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const target = new Date(isoWeek1Monday);
  target.setUTCDate(isoWeek1Monday.getUTCDate() + (w - 1) * 7);
  return target.toISOString().slice(0, 10);
};

const parseYoutubeFeedEntries = (xmlText) => {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match = entryRegex.exec(xmlText);
  while (match) {
    const chunk = match[1];
    const title = (chunk.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "YouTube upload")
      .replaceAll(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
    const url = (chunk.match(/<link[^>]*href="([^"]+)"/)?.[1] || "https://www.youtube.com/@aday1").trim();
    const published = (chunk.match(/<published>([\s\S]*?)<\/published>/)?.[1] || "1970-01-01").trim();
    entries.push({
      date: parseIsoDate(published),
      title,
      desc: "YouTube upload/feed item",
      url,
      source: "youtube"
    });
    match = entryRegex.exec(xmlText);
  }
  return entries;
};

const artifactSources = (() => {
  try {
    if (!fs.existsSync(artifactSourcesPath)) return {};
    return JSON.parse(fs.readFileSync(artifactSourcesPath, "utf8"));
  } catch {
    return {};
  }
})();

const parsePost = (raw) => {
  const normalized = raw.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      meta: { title: "Untitled", date: "1970-01-01", summary: "" },
      body: normalized
    };
  }
  const [, frontMatter, body] = match;
  const meta = { title: "Untitled", date: "1970-01-01", summary: "" };
  for (const line of frontMatter.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    meta[key.trim()] = rest.join(":").trim();
  }
  return { meta, body };
};

const files = fs
  .readdirSync(postsDir)
  .filter((name) => name.endsWith(".md"))
  .sort()
  .reverse();

const posts = files.map((file) => {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
  const { meta, body } = parsePost(raw);
  const htmlBody = mdToHtml(body.trim());
  const assetsHtml = renderPostAssetsBlock(slug);

  const postHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)} // blog.aday.net.au</title>
  <meta name="theme-color" content="#071224">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/crt-cuton.css">
${filmHeadLinks}
</head>
<body class="boot-seq film-on">
  <div id="pageTransition" class="page-transition" aria-hidden="true">
    <div class="page-transition-inner">
      <span class="cuton-label" aria-hidden="true"></span>
      <span class="cuton-line"></span>
    </div>
  </div>
  <canvas id="blogBgShader" class="bg-shader" aria-hidden="true"></canvas>
  <div class="noise" aria-hidden="true"></div>
  <main>
    <p><a href="/">back to blog index</a> | <a href="https://aday.net.au">aday.net.au</a> | <a href="https://codepen.io/aday_net_au/" target="_blank" rel="noopener noreferrer">codepen</a></p>
    <h1 class="decrypt">${escapeHtml(meta.title)}</h1>
    <p class="date">${escapeHtml(meta.date)}</p>
    ${assetsHtml}
    ${htmlBody}
    <footer class="blog-footer">
      <div class="footer-wave" aria-hidden="true"></div>
      <p><a href="/">back to index</a> | <a href="https://aday.net.au">aday.net.au</a></p>
    </footer>
  </main>
  <div id="retroCursor" class="retro-cursor" aria-hidden="true"></div>
  <script src="/app.js"></script>
${filmBodyScripts}
  ${deployMetaHtml}
</body>
</html>
`;

  fs.writeFileSync(path.join(outPostsDir, `${slug}.html`), postHtml, "utf8");

  return { slug, ...meta };
});

const listHtml = posts
  .map(
    (post) => `<li>
      <a href="/posts/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a><br>
      <span class="date">${escapeHtml(post.date)}</span><br>
      <span>${escapeHtml(post.summary || "")}</span>
    </li>`
  )
  .join("\n");

const getTimeline = async () => {
  const curatedEvents = [
    {
      date: "2022-01-01",
      title: "30 Years of Clan Analogue",
      desc: "Collective anniversary milestone and event cycle",
      url: "https://www.clananalogue.org/featured/30-years-of-clan-analogue-in-2022/",
      source: "clan"
    },
    {
      date: "2025-01-01",
      title: "Clan Analogue events and FM showcases",
      desc: "Recent featured events and releases listed on official site",
      url: "http://clananalogue.org/",
      source: "clan"
    },
    {
      date: "2025-10-07",
      title: "MacroVerse at Melbourne Fringe",
      desc: "Live sonic/visual universe narrative: Reductionist (micro-instruments) + Aday (projection improv), Clan Analogue, Abbotsford Convent; free exhibition 12-4pm, 7pm performances",
      url: "https://www.melbournefringe.com.au/whats-on/events/macroverse",
      source: "events"
    },
    {
      date: "2026-01-01",
      title: "Aday artist bio on Clan Analogue",
      desc: "Artist profile and collective context",
      url: "https://www.clananalogue.org/artists/aday/",
      source: "clan"
    },
    {
      date: "2019-06-01",
      title: "Demobus : Busdemo",
      desc: "1st at Flashback 2019 (pouet scene archive listing)",
      url: "https://m.pouet.net/groups.php?which=12461",
      source: "scene"
    },
    {
      date: "2013-01-01",
      title: "YouTube channel active",
      desc: "Channel timeline begins (public stats source)",
      url: "https://www.youtube.com/@aday1",
      source: "youtube"
    },
    {
      date: "2025-10-31",
      title: "YouTube activity snapshot",
      desc: "Public tracker notes view movement for channel videos",
      url: "https://ng.youtubers.me/aday-64775f5e-0cd6-430d-86d3-65ec4efc4105/youtuber-stats",
      source: "youtube"
    },
    {
      date: "2026-04-16",
      title: "YouTube stats check-in",
      desc: "Latest indexed view delta recorded in public analytics mirror",
      url: "https://ng.youtubers.me/aday-64775f5e-0cd6-430d-86d3-65ec4efc4105/youtuber-stats",
      source: "youtube"
    },
    {
      date: "2012-01-01",
      title: "SoundCloud profile signal",
      desc: "Primary streaming node for tracks, playlists, and sketches",
      url: "https://soundcloud.com/adaynetau",
      source: "soundcloud"
    },
    {
      date: "2025-01-01",
      title: "Bandcamp collection profile",
      desc: "Bandcamp collection node with electronic/chiptune references",
      url: "https://bandcamp.com/aday_net_au",
      source: "bandcamp"
    },
    {
      date: "2026-01-19",
      title: "MacroVerse nominated for Fringe Award",
      desc: "External write-up documenting MacroVerse nomination context",
      url: "https://nickewilson.net/2026/01/19/macroverse-nominated-for-fringe-award/",
      source: "press"
    },
    {
      date: "2012-01-01",
      title: "WeeklyBeats profile active",
      desc: "Aday profile index with annual release filters",
      url: "https://weeklybeats.com/aday",
      source: "weeklybeats"
    },
    {
      date: "2014-02-09",
      title: "EpochJam (PixiTracker)",
      desc: "Heatwave-era PixiTracker jam with native video output",
      url: "https://weeklybeats.com/aday/music/epochjam-pixitracker",
      source: "weeklybeats"
    },
    {
      date: "2016-01-31",
      title: "Desktop\\pixitracker_1bit\\2016-02-01 09-44.piximod",
      desc: "1bit PixiTracker pass with post FX in Audacity",
      url: "https://weeklybeats.com/aday/music/cusersadaydesktoppixitracker_1bit2016-02-01-09-44piximod",
      source: "weeklybeats"
    },
    {
      date: "2020-01-12",
      title: "Anxious Goth Rabbit",
      desc: "4-hour session where happy rabbit intent turned goth",
      url: "https://weeklybeats.com/aday/music/anxious-goth-rabbit-2",
      source: "weeklybeats"
    },
    {
      date: "2024-07-07",
      title: "Doomsday data",
      desc: "2024 release note: throw down and see what sticks",
      url: "https://weeklybeats.com/aday/music/doomsday-data",
      source: "weeklybeats"
    },
    {
      date: "2026-01-04",
      title: "Cubic Waveform",
      desc: "WeeklyBeats 2026 week 1 upload",
      url: "https://weeklybeats.com/music/aday",
      source: "weeklybeats"
    },
    {
      date: "2026-01-11",
      title: "Untitled Organic Granular Experiment #1768089600",
      desc: "WeeklyBeats 2026 week 2 upload",
      url: "https://weeklybeats.com/music/aday",
      source: "weeklybeats"
    },
    {
      date: "2026-01-12",
      title: "Late Calibration Test",
      desc: "WeeklyBeats 2026 week 3 late submission",
      url: "https://weeklybeats.com/music/aday",
      source: "weeklybeats"
    },
    {
      date: "2012-11-01",
      title: "RPi-Sequenced NES",
      desc: "Demozoo upload node",
      url: "https://demozoo.org/productions/94050/",
      source: "demozoo"
    },
    {
      date: "2018-11-01",
      title: "64:20 Blaze It",
      desc: "Demozoo graphics upload",
      url: "https://demozoo.org/graphics/195944/",
      source: "demozoo"
    },
    {
      date: "2019-06-01",
      title: "Demobus from the Sky",
      desc: "Demozoo photo upload",
      url: "https://demozoo.org/graphics/204829/",
      source: "demozoo"
    },
    {
      date: "2024-10-01",
      title: "2 Nights At Syntax",
      desc: "Demozoo production entry",
      url: "https://demozoo.org/productions/359782/",
      source: "demozoo"
    },
    {
      date: "2025-11-01",
      title: "Orbital Syntax",
      desc: "Demozoo photo entry",
      url: "https://demozoo.org/graphics/380235/",
      source: "demozoo"
    },
    {
      date: "2026-05-14",
      title: "SoundCloud and Bandcamp deck online",
      desc: "Rapid-play embeds and profile links added to aday.net.au media panel",
      url: "https://aday.net.au",
      source: "platform"
    },
    {
      date: "2012-01-01",
      title: "Onlinedoof archive clip",
      desc: "Vimeo archive node",
      url: "https://vimeo.com/35409288",
      source: "vimeo"
    },
    {
      date: "2014-01-01",
      title: "Binaural Percolator",
      desc: "MindFlex EEG via Processing output test",
      url: "https://vimeo.com/84038041",
      source: "vimeo"
    },
    {
      date: "2018-01-01",
      title: "CodePen sketches",
      desc: "CodePen prototypes and visual interaction experiments",
      url: "https://codepen.io/aday_net_au/",
      source: "codepen"
    }
  ];

  const weeklybeatsScraped = (() => {
    try {
      if (!fs.existsSync(adayWeeklybeatsPath)) return [];
      const raw = fs.readFileSync(adayWeeklybeatsPath, "utf8");
      const json = JSON.parse(raw);
      const tracks = Array.isArray(json?.tracks) ? json.tracks : [];
      return tracks.map((track) => ({
        date: yearWeekToDate(track.year, track.week),
        title: track.title || track.slug || "WeeklyBeats track",
        desc: track.description || `WeeklyBeats ${track.year || ""} week ${track.week || ""}`.trim(),
        url: track.url || "https://weeklybeats.com/aday",
        source: "weeklybeats"
      }));
    } catch {
      return [];
    }
  })();

  const youtubeFeedScraped = await (async () => {
    const configuredChannelId = String(artifactSources.youtube_channel_id || "").trim();
    const configuredUser = String(artifactSources.youtube_user || "").trim();
    const uploadPlaylistId = configuredChannelId.startsWith("UC") ? `UU${configuredChannelId.slice(2)}` : "";
    const feedUrls = [
      configuredChannelId ? `https://www.youtube.com/feeds/videos.xml?channel_id=${configuredChannelId}` : "",
      uploadPlaylistId ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${uploadPlaylistId}` : "",
      configuredUser ? `https://www.youtube.com/feeds/videos.xml?user=${configuredUser}` : "",
      "https://www.youtube.com/feeds/videos.xml?user=aday1"
    ].filter(Boolean);
    for (const feedUrl of feedUrls) {
      try {
        const response = await fetch(feedUrl, { headers: { "User-Agent": "aday-blog-generator/1.0" } });
        if (!response.ok) continue;
        const text = await response.text();
        const entries = parseYoutubeFeedEntries(text);
        if (entries.length) return entries.slice(0, 24);
      } catch {
        // try next feed url
      }
    }
    return [];
  })();

  const youtubeStatsFallback = await (async () => {
    const statsUrl = String(artifactSources.youtube_stats_url || "https://ng.youtubers.me/aday-64775f5e-0cd6-430d-86d3-65ec4efc4105/youtuber-stats").trim();
    if (!statsUrl) return [];
    try {
      const response = await fetch(statsUrl, { headers: { "User-Agent": "aday-blog-generator/1.0" } });
      if (!response.ok) return [];
      const html = await response.text();
      const snapshots = [...html.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
      if (!snapshots.length) return [];
      const latest = snapshots.sort().at(-1);
      return [{
        date: latest || parseIsoDate(new Date().toISOString()),
        title: "YouTube tracker snapshot",
        desc: "Latest discovered public analytics timestamp from stats mirror",
        url: statsUrl,
        source: "youtube"
      }];
    } catch {
      return [];
    }
  })();

  const githubRepoTimeline = await (async () => {
    try {
      const response = await fetch("https://api.github.com/users/aday1/repos?per_page=100&sort=updated", {
        headers: { "User-Agent": "aday-blog-generator/1.0" }
      });
      if (!response.ok) return [];
      const repos = await response.json();
      return repos
        .filter((repo) => !repo.fork)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-40)
        .map((repo) => ({
          date: parseIsoDate(repo.created_at || "1970-01-01"),
          title: repo.name,
          desc: repo.description || "repo milestone",
          url: repo.html_url,
          source: "github"
        }));
    } catch {
      return [];
    }
  })();

  const allEvents = [...curatedEvents, ...weeklybeatsScraped, ...youtubeFeedScraped, ...youtubeStatsFallback, ...githubRepoTimeline]
    .map((entry) => ({
      ...entry,
      date: parseIsoDate(entry.date),
      source: slugifySource(entry.source || "artifact")
    }))
    .filter((entry) => entry.url && entry.title);

  const dedupedMap = new Map();
  allEvents.forEach((entry) => {
    const key = `${entry.url}|${entry.title}`.toLowerCase();
    const existing = dedupedMap.get(key);
    if (!existing) {
      dedupedMap.set(key, entry);
      return;
    }
    const entryTs = new Date(entry.date).getTime();
    const existingTs = new Date(existing.date).getTime();
    if (entryTs < existingTs) dedupedMap.set(key, entry);
  });
  const deduped = [...dedupedMap.values()];

  if (!deduped.length) {
    return [
      { date: "2012-06-09", title: "GitHub profile started", desc: "Public coding presence begins", url: "https://github.com/aday1", source: "github" },
      { date: "2013-11-10", title: "Legend of Syntax", desc: "Scene visual entry", url: "https://demozoo.org/graphics/94286/", source: "demozoo" },
      { date: "2026-05-14", title: "blog.aday.net.au online", desc: "Commit-driven publishing pipeline", url: "https://blog.aday.net.au", source: "platform" }
    ];
  }

  return deduped.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const timelineImagesPath = path.join(root, "scripts", "timeline-images.json");
const timelineImages = (() => {
  try {
    return JSON.parse(fs.readFileSync(timelineImagesPath, "utf8"));
  } catch {
    return {
      signature: "/assets/timeline/aday-antialias-blackmage.png",
      fallback: "",
      bySource: {},
      urlMatch: [],
      sprinkleEvery: 6
    };
  }
})();

const truncateTimelineDesc = (text, max = 220) => {
  const trimmed = String(text || "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
};

const pickTimelineImage = (entry, idx) => {
  const url = String(entry.url || "").toLowerCase();
  const source = slugifySource(entry.source || "artifact");
  const signature = timelineImages.signature || "/assets/timeline/aday-antialias-blackmage.png";
  const sprinkleEvery = Number(timelineImages.sprinkleEvery) || 6;

  if (sprinkleEvery > 0 && idx > 0 && idx % sprinkleEvery === 0) {
    return { url: signature, signature: true };
  }

  for (const rule of timelineImages.urlMatch || []) {
    const needle = String(rule.includes || "").toLowerCase();
    if (needle && url.includes(needle)) {
      return { url: rule.image, signature: rule.image === signature };
    }
  }

  const pool = timelineImages.bySource?.[source];
  if (Array.isArray(pool) && pool.length) {
    const image = pool[idx % pool.length];
    return { url: image, signature: image === signature };
  }

  if (timelineImages.fallback) {
    return { url: timelineImages.fallback, signature: false };
  }
  return null;
};

const renderTimelineNode = (entry, idx) => {
  const source = slugifySource(entry.source || "artifact");
  const year = entry.date.slice(0, 4);
  const picked = pickTimelineImage(entry, idx);
  const sigClass = picked?.signature ? " is-signature" : "";
  const visualClass = picked?.url
    ? "timeline-entry-visual"
    : "timeline-entry-visual timeline-entry-visual--plain";
  const visualStyle = picked?.url ? ` style="--timeline-bg: url('${escapeHtml(picked.url)}')"` : "";
  const desc = truncateTimelineDesc(entry.desc);

  return `<li class="timeline-node source-${escapeHtml(source)}${sigClass}" data-source="${escapeHtml(source)}" data-node="${idx}" data-title="${escapeHtml(entry.title)}">
  <article class="timeline-entry">
    <div class="${visualClass}"${visualStyle} aria-hidden="true"><span class="timeline-entry-year">${escapeHtml(year)}</span></div>
    <div class="timeline-entry-body">
      <p class="timeline-entry-meta">
        <span class="date">${escapeHtml(entry.date)}</span>
        <span class="source-chip">${escapeHtml(source)}</span>
      </p>
      <h3 class="timeline-entry-title"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.title)}</a></h3>
      ${desc ? `<p class="timeline-entry-desc">${escapeHtml(desc)}</p>` : ""}
    </div>
  </article>
</li>`;
};

const timelineEntries = await getTimeline();
let timelineYearMarker = "";
const timelineRows = timelineEntries
  .flatMap((entry, idx) => {
    const year = entry.date.slice(0, 4);
    const parts = [];
    if (year !== timelineYearMarker) {
      timelineYearMarker = year;
      parts.push(`<li class="timeline-year-divider" aria-hidden="true"><span>${escapeHtml(year)}</span></li>`);
    }
    parts.push(renderTimelineNode(entry, idx));
    return parts;
  })
  .join("\n");
const timeLogRows = [...timelineEntries]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 14)
  .map((entry) => `<li><span class="date">${escapeHtml(entry.date)}</span> <span class="source-chip">${escapeHtml(entry.source || "artifact")}</span> ${escapeHtml(entry.title)} // <a href="${escapeHtml(entry.url)}">open</a></li>`)
  .join("\n");
const sourceCounts = Object.entries(
  timelineEntries.reduce((acc, item) => {
    const key = slugifySource(item.source || "artifact");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})
)
  .sort((a, b) => b[1] - a[1])
  .map(([source, count]) => `<li><span>${escapeHtml(source)}</span><span class="status-tag status-online">${count}</span></li>`)
  .join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>blog.aday.net.au</title>
  <meta name="description" content="Commit-driven blog for aday">
  <meta name="theme-color" content="#1b1b1b">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/crt-cuton.css">
${filmHeadLinks}
</head>
<body class="boot-seq film-on">
  <div id="pageTransition" class="page-transition" aria-hidden="true">
    <div class="page-transition-inner">
      <span class="cuton-label" aria-hidden="true"></span>
      <span class="cuton-line"></span>
    </div>
  </div>
  <canvas id="blogBgShader" class="bg-shader" aria-hidden="true"></canvas>
  <div class="noise" aria-hidden="true"></div>
  <main>
    <h1 class="decrypt typed">blog.aday.net.au</h1>
    <p class="typed">Artifact timeline and generated posts from automated source scraping.</p>
    <p><a href="https://aday.net.au">return to aday.net.au</a> | <a href="https://aday.net.au/#demozoo-uploads">demozoo uploads on aday.net.au</a> | <a href="https://codepen.io/aday_net_au/" target="_blank" rel="noopener noreferrer">codepen</a></p>
    <section>
      <h2 class="headliner-title">
        <img class="headliner-badge" src="https://raw.githubusercontent.com/aday1/acid-banger/main/preview.png" alt="glitch signal icon" data-fallbacks="https://raw.githubusercontent.com/aday1/error-diffusion/master/public/assets/max-patch-1.png|https://media.demozoo.org/screens/t/dc/3c/d2ca.pl765305.jpg">
        Live AV and Stage Tools
      </h2>
      <p>Active browser tools mirrored from aday.net.au for live AV work, DMX control, and projector sets.</p>
      <div class="headliner-grid">
        <article class="headliner-card">
          <img class="headliner-bg" src="https://raw.githubusercontent.com/aday1/macroverse.aday.net.au/main/preview.png" alt="Macroverse cue art" data-repo="aday1/macroverse.aday.net.au">
          <div class="headliner-head">
            <img class="service-icon" src="https://raw.githubusercontent.com/aday1/macroverse.aday.net.au/main/preview.png" alt="Macroverse icon" data-repo="aday1/macroverse.aday.net.au">
            <h3>Macroverse</h3>
          </div>
          <p>Live GLSL visual performance stack; grew out of MacroVerse at Melbourne Fringe (Reductionist + Aday, Abbotsford Convent).</p>
          <ul class="service-explainer">
            <li><span>role</span> realtime browser shader engine for VJ and projection scenes</li>
            <li><span>use</span> launch visual sets and route show-state cues live</li>
            <li><span>signal</span> testament to the Fringe show; best for events, galleries, and AV performance nights</li>
            <li><span>origin</span> <a href="https://www.melbournefringe.com.au/whats-on/events/macroverse" target="_blank" rel="noopener noreferrer">Melbourne Fringe MacroVerse</a></li>
          </ul>
          <a href="https://macroverse.aday.net.au" target="_blank" rel="noopener noreferrer">open macroverse.aday.net.au</a><br>
          <a href="https://macroverse.aday.net.au/about.html" target="_blank" rel="noopener noreferrer">about MacroVerse</a><br>
          <a href="https://github.com/aday1/macroverse.aday.net.au" target="_blank" rel="noopener noreferrer">open source repo</a>
        </article>
        <article class="headliner-card">
          <img class="headliner-bg" src="https://raw.githubusercontent.com/aday1/artbastard.aday.net.au/main/preview.png" alt="ArtBastard cue art" data-repo="aday1/artbastard.aday.net.au">
          <div class="headliner-head">
            <img class="service-icon" src="https://raw.githubusercontent.com/aday1/artbastard.aday.net.au/main/preview.png" alt="ArtBastard icon" data-repo="aday1/artbastard.aday.net.au">
            <h3>ArtBastard</h3>
          </div>
          <p>Live browser DMX/OSC/MIDI control stack.</p>
          <ul class="service-explainer">
            <li><span>role</span> lighting and control middleware for OSC, MIDI, DMX and Art-Net</li>
            <li><span>use</span> trigger scenes, map cues, and sync performance hardware</li>
            <li><span>signal</span> best for stage rigs, hybrid shows, and live control ops</li>
          </ul>
          <a href="https://artbastard.aday.net.au" target="_blank" rel="noopener noreferrer">open artbastard.aday.net.au</a><br>
          <a href="https://github.com/aday1/artbastard.aday.net.au" target="_blank" rel="noopener noreferrer">open source repo</a>
        </article>
      </div>
    </section>
    <section>
      <h2>YouTube feed node</h2>
      <div class="timeline-stage yt-stage">
        <iframe
          id="blogYtFrame"
          class="blog-yt-frame"
          title="Aday YouTube feed"
          src="https://www.youtube-nocookie.com/embed?listType=user_uploads&list=aday1"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
      <div class="yt-tools">
        <label for="blogYtSelector">Channel selector</label>
        <select id="blogYtSelector">
          <option value="https://www.youtube-nocookie.com/embed?listType=user_uploads&list=aday1">uploads stream</option>
          <option value="https://www.youtube-nocookie.com/embed?listType=user_uploads&list=Aday">legacy user stream</option>
          <option value="https://www.youtube-nocookie.com/embed?listType=search&list=aday+chiptune+live">search feed</option>
        </select>
        <button id="blogYtRandom" type="button">randomizer</button>
      </div>
      <p class="date">Live channel feed with selector and randomizer.</p>
    </section>
    <section>
      <h2>Artifact source ingest</h2>
      <ul id="systemStatusList" class="post-list status-list">
        ${sourceCounts}
      </ul>
      <p class="date">Generated from curated nodes + YouTube feed + WeeklyBeats manifest + GitHub repository timeline.</p>
    </section>
    <section>
      <h2>Presence timeline</h2>
      <div class="timeline-stage">
        <canvas id="timelineGraph" width="960" height="320" aria-hidden="true"></canvas>
      </div>
      <ul class="post-list timeline">
        ${timelineRows}
      </ul>
    </section>
    <section>
      <h2>Recent ingest log</h2>
      <ul class="post-list">
        ${timeLogRows}
      </ul>
    </section>
    <section>
      <h2>Posts</h2>
    <ul class="post-list">
      ${listHtml}
    </ul>
    </section>
    <footer class="blog-footer">
      <div class="footer-wave" aria-hidden="true"></div>
      <p>blog.aday.net.au signal output // route: <a href="https://aday.net.au">aday.net.au</a></p>
    </footer>
  </main>
  <div id="retroCursor" class="retro-cursor" aria-hidden="true"></div>
  <script src="/app.js"></script>
${filmBodyScripts}
  ${deployMetaHtml}
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml, "utf8");
const genAt = new Date().toISOString();
fs.writeFileSync(path.join(outDataDir, "timeline-artifacts.json"), JSON.stringify({
  generated_at: genAt,
  count: timelineEntries.length,
  entries: timelineEntries
}, null, 2), "utf8");
const localDeployMeta = {
  site: "blog.aday.net.au",
  branch: "local",
  track: "local",
  version: "local",
  build_date: genAt,
  last_git_sha_short: "local",
  last_git_sha: "local",
  last_git_url: "https://github.com/aday1/blog.aday.net.au",
  last_build_at: genAt,
  last_deployed_at: genAt,
  changelog_url: "https://github.com/aday1/blog.aday.net.au",
  commits_history_url: "https://github.com/aday1/blog.aday.net.au/commits/main",
  changelog_md_url: "https://github.com/aday1/blog.aday.net.au/blob/main/CHANGELOG.md",
  releases_url: "https://github.com/aday1/blog.aday.net.au/releases",
  workflow_run_url: "",
  run_id: "",
  run_number: "",
  deploy_note: "Offline build fingerprint; CI overwrites deploy-meta.json and injects window.__DEPLOY_META__.",
};
fs.writeFileSync(path.join(outDataDir, "deploy-meta.json"), JSON.stringify(localDeployMeta, null, 2), "utf8");
console.log(`Generated ${posts.length} post(s).`);
