# AGENT-REBUILD — blog.aday.net.au

Rebuild this project from scratch. Read this file before writing code. Preserve all Non-negotiables.

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

## Build and run

From repo root:

    $env:WB_SKIP_ENRICH="1"
    node scripts/build-blog.mjs

Expect: `Generated N post(s).` and refreshed `public/data/devlog-bundle.json` when sources changed.

Preview locally per repo README (static server on `public/`).

## Deploy

1. Commit in this repo
2. Push `main`
3. Confirm GitHub Actions deploy green
4. Optional: append row to vault `Run-All-Deploy-Log.md`

## File map

| Path | Role |
| --- | --- |
| `scripts/build-blog.mjs` | Post generation |
| `public/` | Deployed static root |
| `public/data/devlog-bundle.json` | Built devlog index |
| Source content dirs | Per repo layout (devlog, story pages) |

## Smoke gates

- https://blog.aday.net.au returns 200
- Devlog index loads; spot-check latest post
- Media paths resolve after build

## Anti-patterns

- Do not hand-edit `devlog-bundle.json` without re-running build script
- No emoji in generated HTML if avoidable

## Out of scope

- Superseded repo `blog-aday-net-au` (delete-queue on GitHub)
