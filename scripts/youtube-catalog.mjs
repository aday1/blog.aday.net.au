import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const YOUTUBE_SECTIONS = [
  { id: "drone", label: "Drone / FPV" },
  { id: "demoparty", label: "Demoparty / Scene" },
  { id: "live-av", label: "Live AV / VJ" },
  { id: "weeklybeats", label: "WeeklyBeats / Chiptune" },
  { id: "archive", label: "Archive / Other" }
];

export const YOUTUBE_CHANNELS = [
  {
    id: "aday_net_au",
    channel_id: "UCdKgN2c92DhDON71FBwGq4g",
    handle: "@aday_net_au",
    channel_url: "https://www.youtube.com/@aday_net_au/videos"
  }
];

const EXCLUDED_YOUTUBE_CHANNEL_IDS = new Set(["UCv2idZd22rCQsmcBMh0AAeg"]);

export const isExcludedYoutubeVideo = (video) => {
  const handle = String(video?.channel_handle || "").toLowerCase();
  const key = String(video?.channel_key || "").toLowerCase();
  const channelId = String(video?.channel_id || "").trim();
  return handle === "@aday1" || key === "aday1" || EXCLUDED_YOUTUBE_CHANNEL_IDS.has(channelId);
};

const overridesPath = path.join(process.cwd(), "scripts", "youtube-overrides.json");

const loadOverrides = () => {
  try {
    if (!fs.existsSync(overridesPath)) return {};
    return JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  } catch {
    return {};
  }
};

export const categorizeYoutubeTitle = (title, videoId = "", overrides = {}) => {
  if (overrides[videoId]) return overrides[videoId];
  const t = String(title || "").toLowerCase();

  if (/\b(fpv|dji|gps|maiden flight|trestle|werribee|cetuspro|noojee|axis flying|falcore|tiny hawk|ragnarok|drone lockdown|pipedream|parangular|picnicfpv|cyberpunk pilot|chasing wings|out west|dvr footage|found fpv)\b/.test(t)) {
    if (/demoscene|switch on/.test(t)) return "demoparty";
    return "drone";
  }
  if (/demoscene|siggraph asia|switch on|squaresounds|open mic/.test(t)) return "demoparty";
  if (/weeklybeats|wb\d{2}-|plinkbeats|dreamurium|maenads|dawpocalypse|shoutouts to gesceap|ios jam for weeklybeats/.test(t)) {
    return "weeklybeats";
  }
  if (
    /shader|glsl|projection mapping|move music|vr midi|twitch vj|nuclear|achronic|komputer problems|liquid faction|clan analogue|microvirtuosity|interrupt festival|bar 303|horsebazaar|3l3c7r0n1c4|calavera live|mixed reality vr jam/.test(
      t
    )
  ) {
    return "live-av";
  }
  if (/seminar|vhs rip|vietnam|walk in the park|cafe ga dong|20160127/.test(t)) return "archive";
  return "archive";
};

const resolveChannelId = (channel) => {
  if (channel.channel_id) return channel.channel_id;
  const result = spawnSync(
    "yt-dlp",
    ["--playlist-items", "0", "-J", channel.channel_url],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
  );
  if (result.status !== 0 || !result.stdout) return "";
  try {
    const json = JSON.parse(result.stdout);
    return String(json?.channel_id || json?.uploader_id || "").trim();
  } catch {
    return "";
  }
};

const uploadsPlaylistId = (channelId) => {
  const id = String(channelId || "").trim();
  if (!id.startsWith("UC") || id.length < 4) return "";
  return `UU${id.slice(2)}`;
};

const fetchChannelVideos = (channel) => {
  const channelId = resolveChannelId(channel);
  if (!channelId) return [];
  const result = spawnSync(
    "yt-dlp",
    ["--flat-playlist", "-J", `https://www.youtube.com/channel/${channelId}/videos`],
    { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 }
  );
  if (result.status !== 0 || !result.stdout) return [];
  try {
    const json = JSON.parse(result.stdout);
    const entries = Array.isArray(json?.entries) ? json.entries : [];
    return entries
      .filter((e) => e?.id)
      .map((e) => ({
        id: e.id,
        title: String(e.title || e.id).trim(),
        duration: Number(e.duration) || 0,
        url: `https://www.youtube.com/watch?v=${e.id}`,
        channel_id: channelId,
        channel_handle: channel.handle,
        channel_key: channel.id,
        uploads_playlist_id: uploadsPlaylistId(channelId)
      }));
  } catch {
    return [];
  }
};

export const buildYoutubeCatalog = (existingPath) => {
  const overrides = loadOverrides();
  const channels = YOUTUBE_CHANNELS.map((ch) => {
    const channelId = ch.channel_id || resolveChannelId(ch);
    return {
      ...ch,
      channel_id: channelId,
      uploads_playlist_id: uploadsPlaylistId(channelId)
    };
  });

  let videos = [];
  for (const channel of channels) {
    videos.push(...fetchChannelVideos(channel));
  }

  if (!videos.length && existingPath && fs.existsSync(existingPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(existingPath, "utf8"));
      videos = Array.isArray(prior?.videos) ? prior.videos : [];
    } catch {
      videos = [];
    }
  }

  videos = videos.filter((video) => !isExcludedYoutubeVideo(video));

  if (!videos.length) return null;

  const deduped = new Map();
  for (const video of videos) {
    const existing = deduped.get(video.id);
    if (!existing) {
      deduped.set(video.id, video);
      continue;
    }
    if (String(video.title || "").length > String(existing.title || "").length) {
      deduped.set(video.id, { ...existing, ...video });
    }
  }
  videos = [...deduped.values()];

  const grouped = Object.fromEntries(YOUTUBE_SECTIONS.map((s) => [s.id, []]));
  for (const video of videos) {
    const section = categorizeYoutubeTitle(video.title, video.id, overrides);
    const bucket = grouped[section] ? section : "archive";
    grouped[bucket].push({ ...video, section: bucket });
  }

  return {
    generated_at: new Date().toISOString(),
    channels,
    channel_url: channels.map((c) => c.channel_url).join(" | "),
    video_count: videos.length,
    sections: YOUTUBE_SECTIONS.map((s) => ({
      ...s,
      count: grouped[s.id].length,
      videos: grouped[s.id]
    })),
    videos
  };
};

export const writeYoutubeCatalog = (outPath) => {
  const catalog = buildYoutubeCatalog(outPath);
  if (!catalog) return null;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
};

export const YOUTUBE_CHANNEL_URL = YOUTUBE_CHANNELS[0].channel_url;
export const YOUTUBE_HANDLE = YOUTUBE_CHANNELS[0].handle;
export const YOUTUBE_CHANNEL_ID = YOUTUBE_CHANNELS[0].channel_id;
