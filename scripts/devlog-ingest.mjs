import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { enrichCommit, groupByPhase, trainPrologue } from "./devlog-narrative.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const parseIsoDate = (value) => {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "1970-01-01";
  return d.toISOString().slice(0, 10);
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isNoiseCommit = (subject) => {
  const s = subject.trim().toLowerCase();
  if (!s) return true;
  if (/^merge\b/.test(s)) return true;
  if (/^merge pull request/.test(s)) return true;
  if (/^wip$/.test(s)) return true;
  return false;
};

const gitLog = (repoPath, maxCount) => {
  try {
    const fmt = "%H%x09%ci%x09%s";
    const out = execSync(`git -C "${repoPath}" log --format=${fmt} -n ${maxCount}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, date, ...rest] = line.split("\t");
        return {
          sha: sha.slice(0, 12),
          shaFull: sha,
          date: parseIsoDate(date),
          subject: rest.join("\t").trim()
        };
      })
      .filter((c) => !isNoiseCommit(c.subject));
  } catch {
    return [];
  }
};

const githubCommits = async (owner, repo, token, maxCount) => {
  const headers = {
    "User-Agent": "aday-blog-devlog/1.0",
    Accept: "application/vnd.github+json"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${Math.min(maxCount, 100)}`;
    const response = await fetch(url, { headers });
    if (!response.ok) return [];
    const rows = await response.json();
    return rows
      .map((row) => ({
        sha: String(row.sha || "").slice(0, 12),
        shaFull: row.sha,
        date: parseIsoDate(row.commit?.author?.date || row.commit?.committer?.date),
        subject: row.commit?.message?.split("\n")[0]?.trim() || "commit"
      }))
      .filter((c) => c.sha && !isNoiseCommit(c.subject));
  } catch {
    return [];
  }
};

const loadConfig = (blogRoot) => {
  const configPath = path.join(blogRoot, "scripts", "devlog-repos.json");
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const trains = [...(raw.trains || []), ...(raw.optionalLocalRepos || [])].map((t) => ({
    ...t,
    absPath: path.resolve(blogRoot, t.localPath || "")
  }));
  return trains;
};

const resolveCommits = async (train, blogRoot) => {
  const max = train.maxCommits || 60;
  let commits = [];
  if (train.absPath && fs.existsSync(path.join(train.absPath, ".git"))) {
    commits = gitLog(train.absPath, max);
  }
  if (!commits.length && train.github) {
    const [owner, repo] = train.github.split("/");
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
    commits = await githubCommits(owner, repo, token, max);
  }
  const [owner, repo] = (train.github || "aday1/unknown").split("/");
  return commits.map((c) => ({
    ...c,
    url: `https://github.com/${owner}/${repo}/commit/${c.shaFull || c.sha}`,
    repo: train.github,
    trainId: train.parentTrain || train.id
  }));
};

export const buildDevlogBundle = async (blogRoot = path.resolve(scriptDir, "..")) => {
  const trains = loadConfig(blogRoot);
  const bundle = { generated_at: new Date().toISOString(), trains: [] };

  for (const train of trains) {
    if (train.parentTrain) continue;
    const raw = await resolveCommits(train, blogRoot);
    const enriched = raw.map((c) => enrichCommit(train, c));
    const phases = groupByPhase(enriched);
    bundle.trains.push({
      id: train.id,
      title: train.title,
      tagline: train.tagline,
      liveUrl: train.liveUrl,
      github: train.github,
      previewImage: train.previewImage,
      timelineSource: train.timelineSource,
      commitCount: enriched.length,
      prologue: trainPrologue(train),
      phases
    });

    const optional = loadConfig(blogRoot).filter((t) => t.parentTrain === train.id);
    for (const sub of optional) {
      const subRaw = await resolveCommits(sub, blogRoot);
      if (!subRaw.length) continue;
      const subEnriched = subRaw.map((c) => enrichCommit(train, c));
      const subPhases = groupByPhase(subEnriched);
      const target = bundle.trains.find((t) => t.id === train.id);
      if (target) {
        target.phases.push({
          id: `${sub.id}-satellite`,
          label: `${sub.title} satellite repo`,
          items: subEnriched
        });
        target.commitCount += subEnriched.length;
      }
    }
  }

  return bundle;
};

export const devlogTimelineEntries = (bundle) => {
  const entries = [];
  bundle.trains.forEach((train) => {
    train.phases.forEach((phase) => {
      phase.items.forEach((item) => {
        entries.push({
          date: item.date,
          title: item.subject,
          desc: item.narrative,
          url: item.url,
          source: train.timelineSource,
          storyTrain: train.id,
          phaseId: item.phaseId,
          commitSha: item.sha
        });
      });
    });
  });
  return entries;
};

export const renderDevlogTrainSection = (train) => {
  const chapters = train.phases
    .map((phase) => {
      const rows = phase.items
        .map(
          (item) => `<li class="devlog-entry" data-train="${escapeHtml(train.id)}" data-phase="${escapeHtml(phase.id)}">
  <article class="devlog-card">
    <p class="devlog-entry-meta">
      <time class="date" datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time>
      <span class="devlog-phase-chip">${escapeHtml(phase.label)}</span>
      <a class="devlog-sha" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.sha)}</a>
    </p>
    <h4 class="devlog-commit-title">${escapeHtml(item.subject)}</h4>
    <p class="devlog-narrative">${escapeHtml(item.narrative)}</p>
  </article>
</li>`
        )
        .join("\n");
      if (!rows) return "";
      return `<div class="devlog-chapter" id="devlog-${escapeHtml(train.id)}-${escapeHtml(phase.id)}">
  <h3 class="devlog-chapter-title">${escapeHtml(phase.label)}</h3>
  <ol class="devlog-commit-list">${rows}</ol>
</div>`;
    })
    .join("\n");

  const prologue = train.prologue.map((p) => `<p class="devlog-prologue">${escapeHtml(p)}</p>`).join("\n");

  return `<section class="devlog-train devlog-train--${escapeHtml(train.id)}" id="devlog-${escapeHtml(train.id)}" data-story-train="${escapeHtml(train.id)}">
  <header class="devlog-train-head">
    <img class="devlog-train-badge" src="${escapeHtml(train.previewImage)}" alt="" width="72" height="72" loading="lazy" decoding="async">
    <div>
      <h2 class="devlog-train-title">${escapeHtml(train.title)} dev log</h2>
      <p class="devlog-train-tagline">${escapeHtml(train.tagline)}</p>
      <p class="date">${train.commitCount} commits in this storyline — <a href="${escapeHtml(train.liveUrl)}" target="_blank" rel="noopener noreferrer">live site</a> · <a href="https://github.com/${escapeHtml(train.github)}" target="_blank" rel="noopener noreferrer">repository</a></p>
    </div>
  </header>
  ${prologue}
  <div class="devlog-chapters">${chapters}</div>
</section>`;
};

export const renderStoryTrainsNav = (bundle) => {
  const links = bundle.trains
    .map(
      (t) =>
        `<a class="story-train-link story-train-link--${escapeHtml(t.id)}" href="#devlog-${escapeHtml(t.id)}">${escapeHtml(t.title)} <span class="story-train-count">${t.commitCount}</span></a>`
    )
    .join("\n");
  return `<section class="story-trains-hub" id="storyTrains">
  <h2>Story trains</h2>
  <p class="date">Parallel lifecycles woven into one master timeline — dev logs from git, YouTube lanes for drone and demoscene, audio releases, and scene nodes.</p>
  <nav class="story-train-nav" aria-label="Story trains">${links}
    <a class="story-train-link story-train-link--media" href="#blogYtSection">YouTube archive</a>
    <a class="story-train-link story-train-link--master" href="#presenceTimeline">Master timeline</a>
  </nav>
</section>`;
};

export const renderDevlogSections = (bundle) => {
  const nav = renderStoryTrainsNav(bundle);
  const sections = bundle.trains.map((train) => renderDevlogTrainSection(train)).join("\n");
  return `${nav}\n${sections}`;
};
