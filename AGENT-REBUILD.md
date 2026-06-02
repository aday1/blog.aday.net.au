# AGENT-REBUILD — blog.aday.net.au

Rebuild this project from scratch. Read this file before writing code. Preserve all Non-negotiables.

This is a **from-scratch rebuild runbook** for the static blog generator and site.

## Rebuild from scratch

### Prerequisites

- Node.js 20+ (ESM scripts)
- Sibling clone `aday-net-au` for `weeklybeats_tracks.json` (build copies from `../aday-net-au/public/data/`)
- Optional: network for YouTube catalog enrichment (skip with `WB_SKIP_ENRICH=1`)

### Path A (recommended): clone

    git clone https://github.com/aday1/blog.aday.net.au.git
    cd blog.aday.net.au

### Path B: empty directory

Create:

    blog.aday.net.au/
      posts/                    # markdown sources (*.md)
      public/                   # deploy root (generated + static assets)
      scripts/
        build-blog.mjs          # main pipeline
        devlog-ingest.mjs
        youtube-catalog.mjs
        weeklybeats-catalog.mjs
        devlog-repos.json
        artifact-sources.json
        post-assets.json
      package.json              # type module if needed

### Phased rebuild

| Phase | What to build | Done when |
| --- | --- | --- |
| 0 | `posts/` with one sample `.md` (front matter: title, date, tags) | Folder exists |
| 1 | `scripts/build-blog.mjs`: read `posts/`, emit `public/posts/<slug>.html` | One post HTML appears under `public/posts/` |
| 2 | Emit `public/data/devlog-bundle.json` via `devlog-ingest.mjs` | Index page can load JSON |
| 3 | `public/index.html` + `public/style.css` + shell CSS linking devlog bundle | Local static server shows index |
| 4 | YouTube + WeeklyBeats catalog writers (or stub empty JSON) | `public/data/youtube-catalog.json` exists |
| 5 | Timeline artifacts from `artifact-sources.json` | `public/data/timeline-artifacts.json` built |
| 6 | GitHub Actions workflow: push `main` -> Cloudflare Pages | https://blog.aday.net.au returns 200 |

**MVP:** phases 0-3 (one post, index, manual `npx serve public`).

### Build command (every content change)

    $env:WB_SKIP_ENRICH="1"
    node scripts/build-blog.mjs

**Done when:** console shows `Generated N post(s).` and `public/data/devlog-bundle.json` timestamp updates.

### Local preview

    npx serve public -l 8080

Open http://localhost:8080

## Canonical paths

| Field | Value |
| --- | --- |
| GitHub | https://github.com/aday1/blog.aday.net.au |
| Local | `YomikosPapers/temp_/cloudflare_pages_repos/blog.aday.net.au` |
| Vault | `09-network-homelab/Website-Maintenance-Runbook.md` |

## Non-negotiables

| Item | Requirement |
| --- | --- |
| Site | Static site + generated devlog bundle |
| Build | `node scripts/build-blog.mjs` is source of truth for posts |
| Deploy | Push `main` -> GitHub Actions -> Cloudflare Pages |
| URL | https://blog.aday.net.au |

## Deploy

1. Run build script
2. Commit `public/` outputs that are checked in (per repo convention)
3. Push `main`
4. Confirm GitHub Actions deploy green

## File map

| Path | Role |
| --- | --- |
| `posts/*.md` | Authoring source |
| `scripts/build-blog.mjs` | Orchestrator |
| `public/` | Deployed static root |
| `public/data/devlog-bundle.json` | Built devlog index |

## Smoke gates

- https://blog.aday.net.au returns 200
- Devlog index loads; spot-check latest post
- Media paths resolve after build

## Anti-patterns

- Do not hand-edit `devlog-bundle.json` without re-running build script
- No emoji in generated HTML if avoidable

## Out of scope

- Superseded repo `blog-aday-net-au` (delete-queue on GitHub)
