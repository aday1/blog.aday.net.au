(() => {
  const root = document.getElementById("githubPresence");
  if (!root) return;

  const canvas = root.querySelector("#githubContribChart");
  const feedEl = root.querySelector(".github-activity-feed");
  const user = root.dataset.githubUser || "aday1";

  const levelColor = (level) => {
    const colors = [
      "rgba(12, 28, 22, 0.5)",
      "rgba(46, 120, 88, 0.75)",
      "rgba(72, 168, 118, 0.85)",
      "rgba(122, 230, 168, 0.95)",
      "rgba(212, 160, 36, 0.95)"
    ];
    return colors[Math.min(4, Math.max(0, level))];
  };

  const drawHeatmap = (contributions) => {
    if (!canvas || !contributions?.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const weeks = 52;
    const rows = 7;
    const cell = 11;
    const gap = 2;
    const pad = 8;
    canvas.width = pad * 2 + weeks * (cell + gap);
    canvas.height = pad * 2 + rows * (cell + gap);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const byDate = new Map(contributions.map((c) => [c.date, c]));
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - weeks * 7 + 1);

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < rows; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        if (day > end) continue;
        const key = day.toISOString().slice(0, 10);
        const entry = byDate.get(key);
        const level = entry?.level ?? 0;
        const count = entry?.count ?? 0;
        const x = pad + w * (cell + gap);
        const y = pad + d * (cell + gap);
        ctx.fillStyle = levelColor(level);
        ctx.fillRect(x, y, cell, cell);
        if (count > 0) {
          ctx.strokeStyle = "rgba(212, 160, 36, 0.35)";
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
    }
  };

  const renderEvents = (events) => {
    if (!feedEl) return;
    const rows = (events || [])
      .filter((ev) => ev.type === "PushEvent" || ev.type === "CreateEvent" || ev.type === "WatchEvent")
      .slice(0, 12);
    if (!rows.length) {
      feedEl.innerHTML = "<p class=\"date\">No recent public GitHub events.</p>";
      return;
    }
    feedEl.innerHTML = rows
      .map((ev) => {
        const repo = ev.repo?.name || "repository";
        const when = ev.created_at ? ev.created_at.slice(0, 10) : "";
        let detail = ev.type.replace("Event", "");
        if (ev.type === "PushEvent" && ev.payload?.commits?.length) {
          detail = ev.payload.commits[0]?.message?.split("\n")[0] || "push";
        }
        const url = ev.repo?.url?.replace("api.github.com/repos", "github.com") || `https://github.com/${user}`;
        return `<li class="github-activity-row"><time class="date" datetime="${when}">${when}</time> <a href="${url}" target="_blank" rel="noopener noreferrer">${repo}</a> <span class="github-activity-type">${detail}</span></li>`;
      })
      .join("");
  };

  const load = async () => {
    const year = new Date().getFullYear();
    try {
      const contribResp = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=${year}`
      );
      if (contribResp.ok) {
        const data = await contribResp.json();
        drawHeatmap(data.contributions || []);
      } else if (canvas) {
        canvas.insertAdjacentHTML(
          "afterend",
          "<p class=\"date\">Contribution chart unavailable; showing recent events only.</p>"
        );
      }
    } catch {
      // ignore
    }

    try {
      const evResp = await fetch(
        `https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=20`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (evResp.ok) {
        renderEvents(await evResp.json());
      }
    } catch {
      // ignore
    }
  };

  load();
})();
