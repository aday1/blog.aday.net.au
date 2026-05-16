import fs from "node:fs";
import path from "node:path";

const PROFILE_URL = "https://weeklybeats.com/music/aday";
const PLAYLIST_URL = "https://weeklybeats.com/music/player?s=by:aday";
const USER_AGENT = "aday-media-catalog/1.0";

export const weeklybeatsYearBanner = (year) => {
  const y = Number(year);
  if (Number.isFinite(y) && y >= 2012 && y <= 2030) {
    return `https://weeklybeats.com/images/wb${y}-social.jpg`;
  }
  return "https://weeklybeats.com/images/wb2026-social.jpg";
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtml = (value) =>
  String(value || "")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const parsePlaylist = (html) => {
  const tracks = [];
  const blockRe = /\{\s*title:"([^"]+)"[\s\S]*?mp3:"([^"]+)"[\s\S]*?\}/g;
  let match;
  while ((match = blockRe.exec(html)) !== null) {
    const titleRaw = decodeHtml(match[1].replace(/^Aday:\s*/i, ""));
    const audioUrl = match[2];
    const slugMatch = match[0].match(/\/aday\/music\/([^"\\]+)/);
    const slug = slugMatch ? slugMatch[1] : "";
    const yearMatch = audioUrl.match(/\/music\/(\d{4})\//);
    const metaMatch = audioUrl.match(/aday_weeklybeats-(\d{4})_(\d+)_/);
    const year = Number(yearMatch?.[1] || metaMatch?.[1] || 0) || null;
    const week = Number(metaMatch?.[2] || 0) || null;
    tracks.push({
      slug,
      title: titleRaw || slug,
      url: slug ? `https://weeklybeats.com/aday/music/${slug}` : PROFILE_URL,
      year,
      week,
      audio_url: audioUrl,
      embed_url: slug ? `https://weeklybeats.com/aday/music/${slug}` : PROFILE_URL,
      banner_url: weeklybeatsYearBanner(year)
    });
  }
  const deduped = new Map();
  for (const track of tracks) {
    const key = track.slug || track.audio_url;
    if (!key) continue;
    if (!deduped.has(key)) deduped.set(key, track);
  }
  return [...deduped.values()];
};

const parseTrackPage = (html) => {
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/);
  const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/);
  const mp3Inline = html.match(/mp3:\s*'([^']+)'/);
  const posted = html.match(/<span id="item_user">[\s\S]*?on\s+([^<]+)</i);
  const ytEmbed = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  const tagWeek = html.match(/tag:week\+(\d+)\+(\d{4})/i);
  let description = decodeHtml(ogDesc?.[1] || "");
  if (!description) {
    const descBlock = html.match(/<p id="item_description">([\s\S]*?)<\/p>\s*<div id="item_license"/i);
    if (!descBlock) {
      const alt = html.match(/<p id="item_description">([\s\S]*?)<div id="item_license"/i);
      description = decodeHtml(alt?.[1]?.replace(/<[^>]+>/g, " ") || "");
    } else {
      description = decodeHtml(descBlock[1]?.replace(/<[^>]+>/g, " ") || "");
    }
  }
  return {
    description,
    image_url: ogImage?.[1] || "",
    audio_url: mp3Inline?.[1] || "",
    posted_at: posted?.[1] ? new Date(posted[1].trim()).toISOString().slice(0, 10) : "",
    youtube_video_id: ytEmbed?.[1] || "",
    year: tagWeek ? Number(tagWeek[2]) : null,
    week: tagWeek ? Number(tagWeek[1]) : null
  };
};

const mergeSeeds = (tracks, seedPath) => {
  if (!seedPath || !fs.existsSync(seedPath)) return tracks;
  try {
    const prior = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    const seeds = Array.isArray(prior?.tracks) ? prior.tracks : [];
    const map = new Map(tracks.map((t) => [t.slug || t.url, { ...t }]));
    for (const seed of seeds) {
      const key = seed.slug || seed.url;
      if (!key) continue;
      const existing = map.get(key) || {};
      map.set(key, { ...existing, ...seed, slug: seed.slug || existing.slug });
    }
    return [...map.values()];
  } catch {
    return tracks;
  }
};

const enrichTracks = async (tracks, { maxEnrich = 200, delayMs = 100 } = {}) => {
  let done = 0;
  for (const track of tracks) {
    if (done >= maxEnrich) break;
    if (!track.url) continue;
    const needsEnrich = !track.description || !track.image_url;
    if (!needsEnrich) {
      done += 1;
      continue;
    }
    try {
      const response = await fetch(track.url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) continue;
      const html = await response.text();
      const meta = parseTrackPage(html);
      if (meta.description) track.description = meta.description;
      if (meta.image_url) track.image_url = meta.image_url;
      if (meta.audio_url) track.audio_url = meta.audio_url;
      if (meta.posted_at) track.posted_at = meta.posted_at;
      if (meta.youtube_video_id) track.youtube_video_id = meta.youtube_video_id;
      if (meta.year && !track.year) track.year = meta.year;
      if (meta.week && !track.week) track.week = meta.week;
      track.banner_url = weeklybeatsYearBanner(track.year);
    } catch {
      // skip
    }
    done += 1;
    if (delayMs > 0) await sleep(delayMs);
  }
  return tracks;
};

export const buildWeeklybeatsCatalog = async (options = {}) => {
  const { seedPath = "", enrich = true, maxEnrich = 200 } = options;

  const playlistRes = await fetch(PLAYLIST_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!playlistRes.ok) {
    throw new Error(`WeeklyBeats playlist fetch failed: ${playlistRes.status}`);
  }
  const playlistHtml = await playlistRes.text();
  let tracks = parsePlaylist(playlistHtml);
  tracks = mergeSeeds(tracks, seedPath);

  if (enrich) {
    tracks = await enrichTracks(tracks, { maxEnrich });
  }

  tracks.sort((a, b) => {
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;
    return (b.week || 0) - (a.week || 0);
  });

  return {
    source: "weeklybeats.com/music/aday",
    profile_url: PROFILE_URL,
    playlist_url: PLAYLIST_URL,
    generated_at: new Date().toISOString(),
    count: tracks.length,
    tracks
  };
};

export const writeWeeklybeatsCatalog = async (outPath, options = {}) => {
  const catalog = await buildWeeklybeatsCatalog(options);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
};

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]).replace(/\\/g, "/"));
if (isMain || process.argv[1]?.includes("weeklybeats-catalog.mjs")) {
  const outPath = process.argv[2] || path.join(process.cwd(), "public", "data", "weeklybeats_tracks.json");
  const seedPath = process.argv[3] || outPath;
  writeWeeklybeatsCatalog(outPath, { seedPath, enrich: process.env.WB_SKIP_ENRICH !== "1" })
    .then((catalog) => {
      console.log(`WeeklyBeats catalog: ${catalog.count} tracks -> ${outPath}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
