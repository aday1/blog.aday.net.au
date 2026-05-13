import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDir = path.join(root, "posts");
const outDir = path.join(root, "public");
const outPostsDir = path.join(outDir, "posts");

if (!fs.existsSync(postsDir)) {
  throw new Error("posts directory missing");
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(outPostsDir, { recursive: true });

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const mdToHtml = (md) =>
  md
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.trim() === "") return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

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

  const postHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)} // blog.aday.net.au</title>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="boot-seq">
  <div class="noise" aria-hidden="true"></div>
  <main>
    <p><a href="/">back to blog index</a> | <a href="https://aday.net.au">aday.net.au</a></p>
    <h1 class="decrypt">${escapeHtml(meta.title)}</h1>
    <p class="date">${escapeHtml(meta.date)}</p>
    ${htmlBody}
  </main>
  <div id="retroCursor" class="retro-cursor" aria-hidden="true"></div>
  <script src="/app.js"></script>
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
  const clanEvents = [
    {
      date: "1992-01-01",
      title: "Clan Analogue founded",
      desc: "Australian underground electronic music and arts collective begins",
      url: "https://www.clananalogue.org/about/a-brief-history/"
    },
    {
      date: "2022-01-01",
      title: "30 Years of Clan Analogue",
      desc: "Collective anniversary milestone and event cycle",
      url: "https://www.clananalogue.org/featured/30-years-of-clan-analogue-in-2022/"
    },
    {
      date: "2025-01-01",
      title: "Clan Analogue events and FM showcases",
      desc: "Recent featured events and releases listed on official site",
      url: "http://clananalogue.org/"
    },
    {
      date: "2025-05-17",
      title: "Clan Analogue at Sleepless Footscray",
      desc: "33rd birthday event listing and live electronic sets",
      url: "https://www.clananalogue.org/events/clan-analogue-goes-bananas-at-sleepless-footscray/"
    },
    {
      date: "2026-01-01",
      title: "Aday artist bio on Clan Analogue",
      desc: "Artist profile and collective context",
      url: "https://www.clananalogue.org/artists/aday/"
    },
    {
      date: "2019-06-01",
      title: "Demobus : Busdemo",
      desc: "1st at Flashback 2019 (pouet scene archive listing)",
      url: "https://m.pouet.net/groups.php?which=12461"
    }
  ];

  try {
    const response = await fetch("https://api.github.com/users/aday1/repos?per_page=100&sort=updated");
    if (!response.ok) throw new Error("timeline fetch failed");
    const repos = await response.json();
    const repoTimeline = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-14)
      .map((repo) => ({
        date: (repo.created_at || "1970-01-01").slice(0, 10),
        title: repo.name,
        desc: repo.description || "repo milestone",
        url: repo.html_url
      }));
    return [...clanEvents, ...repoTimeline].sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch {
    return [
      { date: "2012-06-09", title: "GitHub profile started", desc: "Public coding presence begins", url: "https://github.com/aday1" },
      { date: "2013-11-10", title: "Legend of Syntax", desc: "Scene visual entry", url: "https://demozoo.org/graphics/94286/" },
      { date: "2024-01-01", title: "2 Nights at Syntax", desc: "Animation comp milestone", url: "https://demozoo.org/productions/359782/" },
      { date: "2026-05-14", title: "blog.aday.net.au online", desc: "Commit-driven publishing pipeline", url: "https://blog.aday.net.au" },
      ...clanEvents
    ];
  }
};

const timelineRows = (await getTimeline())
  .map((entry) => `<li><span class="date">${escapeHtml(entry.date)}</span> <a href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a> - ${escapeHtml(entry.desc)}</li>`)
  .join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>blog.aday.net.au</title>
  <meta name="description" content="Commit-driven blog for aday">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="boot-seq">
  <div class="noise" aria-hidden="true"></div>
  <main>
    <h1 class="decrypt">blog.aday.net.au</h1>
    <p>New posts are generated from markdown files committed to this repository.</p>
    <p><a href="https://aday.net.au">return to aday.net.au</a></p>
    <section>
      <h2>Presence timeline</h2>
      <ul class="post-list timeline">
        ${timelineRows}
      </ul>
    </section>
    <section>
      <h2>Posts</h2>
    <ul class="post-list">
      ${listHtml}
    </ul>
    </section>
  </main>
  <div id="retroCursor" class="retro-cursor" aria-hidden="true"></div>
  <script src="/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml, "utf8");
console.log(`Generated ${posts.length} post(s).`);
