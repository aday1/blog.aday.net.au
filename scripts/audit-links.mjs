import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(scriptDir, "..");
const candidateSites = [
  { name: "blog", publicDir: path.join(blogRoot, "public"), baseUrl: "https://blog.aday.net.au" },
  { name: "aday", publicDir: path.resolve(blogRoot, "..", "aday-net-au", "public"), baseUrl: "https://aday.net.au" }
].filter((site) => fs.existsSync(site.publicDir));

const skipPrefixes = ["#", "mailto:", "tel:", "javascript:", "data:", "blob:"];
const botBlockedStatuses = new Set([401, 403, 405, 408, 409, 425, 429]);

const stripUrlTail = (value) => String(value || "").split("#")[0].split("?")[0];

const walkHtml = (dir) => {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walkHtml(full));
    else if (item.isFile() && item.name.endsWith(".html")) out.push(full);
  }
  return out;
};

const extractRefs = (html) => {
  const refs = [];
  const attrRe = /\b(?:href|src|poster)=["']([^"']+)["']/gi;
  let match = attrRe.exec(html);
  while (match) {
    const value = match[1].trim();
    if (!value || skipPrefixes.some((prefix) => value.toLowerCase().startsWith(prefix))) {
      match = attrRe.exec(html);
      continue;
    }
    refs.push(value);
    match = attrRe.exec(html);
  }
  return refs;
};

const localTargetPath = (site, htmlFile, value) => {
  const clean = stripUrlTail(value);
  if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith("//")) return "";
  if (clean.startsWith("/")) return path.join(site.publicDir, clean.slice(1));
  return path.resolve(path.dirname(htmlFile), clean);
};

const checkRemote = async (url) => {
  const methods = ["HEAD", "GET"];
  for (const method of methods) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "aday-link-audit/1.0" }
      });
      clearTimeout(timer);
      if (method === "HEAD" && [403, 405].includes(response.status)) continue;
      const status = response.status;
      const ok = status >= 200 && status < 400;
      return {
        url,
        status,
        ok,
        warning: !ok && botBlockedStatuses.has(status),
        error: ""
      };
    } catch (err) {
      clearTimeout(timer);
      if (method === "HEAD") continue;
      return { url, status: 0, ok: false, warning: false, error: err.message };
    }
  }
  return { url, status: 0, ok: false, warning: false, error: "unreachable" };
};

const mapLimit = async (items, limit, worker) => {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const idx = cursor;
        cursor += 1;
        results[idx] = await worker(items[idx], idx);
      }
    })
  );
  return results;
};

const records = [];
const remoteRefs = new Map();

for (const site of candidateSites) {
  for (const htmlFile of walkHtml(site.publicDir)) {
    const html = fs.readFileSync(htmlFile, "utf8");
    for (const ref of extractRefs(html)) {
      const source = path.relative(site.publicDir, htmlFile).replaceAll("\\", "/");
      if (ref.startsWith("//")) {
        remoteRefs.set(`https:${ref}`, { site: site.name, source, ref });
        continue;
      }
      if (/^https?:\/\//i.test(ref)) {
        remoteRefs.set(ref, { site: site.name, source, ref });
        continue;
      }
      const target = localTargetPath(site, htmlFile, ref);
      if (!target) continue;
      records.push({
        site: site.name,
        source,
        ref,
        target: path.relative(site.publicDir, target).replaceAll("\\", "/"),
        kind: fs.existsSync(target) ? "ok" : "broken-local"
      });
    }
  }
}

const remoteChecks = await mapLimit([...remoteRefs.entries()], 8, async ([url, meta]) => {
  const result = await checkRemote(url);
  return {
    ...meta,
    url,
    status: result.status,
    kind: result.ok ? "ok" : result.warning ? "warning" : "broken-remote",
    error: result.error
  };
});

records.push(...remoteChecks);

const summary = records.reduce(
  (acc, item) => {
    acc.total += 1;
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  },
  { total: 0 }
);
const broken = records.filter((item) => item.kind.startsWith("broken"));
const warnings = records.filter((item) => item.kind === "warning");

console.log(JSON.stringify({ generated_at: new Date().toISOString(), sites: candidateSites.map((s) => s.name), summary, broken, warnings }, null, 2));
if (broken.length) process.exitCode = 1;
