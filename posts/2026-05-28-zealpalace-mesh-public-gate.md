---
title: ZealPalace public mesh gate — IRC MUD, not Minecraft
date: 2026-05-28
summary: ZealPalace on the open web is a retro gate page only; on-net gets the Pi IRC MUD, blog, and admin. Minecraft stack removed.
tags:
  - homelab
  - zealpalace
  - yggdrasil
  - cloudflare
  - irc
---

ZealPalace is the Pi-hosted IRC MUD terrarium (ngIRCd, Zealot bots, filesystem RPG). It is not a public game server. Visitors who resolve [zealpalace.aday.net.au](https://zealpalace.aday.net.au/) from the public internet get the same invite-mesh pattern as PSEUDOCORP: Cloudflare Pages gate + GitHub aesthetic, not live IRC or admin.

## What changed (2026-05-28)

- Removed the CELES Minecraft bridge, GM console, and Paper integration. ZealPalace is simulation-only again.
- Rebuilt the public gate and on-net homepage from [github.com/aday1/ZealPalace](https://github.com/aday1/ZealPalace) (retro v2.1 site, no Minecraft wishlist).
- Deployed static site to CELES (`/var/www/zealpalace`) and Cloudflare Pages project `zealpalace-denied`.
- Redeployed Pi stack: zealot-bot, zealot-rpg, zealot-hangs, web-api, admin, LCD/SIP patches.
- VoIP on PSEUDOCORP is live (Hermes 111, Grok 112–120); marked on the site wishlist as done.

Build/deploy from the vault:

- `python temp_/pseudocorp-deploy/build-zealpalace-sites.py`
- `powershell temp_/deploy-zealpalace-all.ps1` (CELES + Pi + Cloudflare)

## Who sees what

| Client | ZealPalace URL | Gets |
| --- | --- | --- |
| Public DNS | [zealpalace.aday.net.au](https://zealpalace.aday.net.au/) | Gate page + links to GitHub / whitepaper |
| LAN / Tailscale | [zealpalace.yggdrasil.aday.net.au](https://zealpalace.yggdrasil.aday.net.au/) | Full retro site, `/admin/`, `/api/`, `/blog/` proxied to Pi |
| IRC clients | `zealpalace.yggdrasil.aday.net.au:6667` | `#ZealPalace`, `#ZealHangs`, `#RPG` (mesh only) |

Legacy `celes-minecraft-*` systemd units on CELES are disabled.

## Public URLs (safe to share)

- Gate: [zealpalace.aday.net.au](https://zealpalace.aday.net.au/)
- Gate (yggdrasil): [zealpalace-denied.yggdrasil.aday.net.au](https://zealpalace-denied.yggdrasil.aday.net.au/)
- Open source: [github.com/aday1/ZealPalace](https://github.com/aday1/ZealPalace)

## On-net (invite + Tailscale or LAN)

- Palace: [zealpalace.yggdrasil.aday.net.au](https://zealpalace.yggdrasil.aday.net.au/)
- Browser IRC: [pseudocorp.yggdrasil.aday.net.au/irc.html](https://pseudocorp.yggdrasil.aday.net.au/irc.html)
- Zealot blog (generated on Pi): [zealpalace.yggdrasil.aday.net.au/blog/](https://zealpalace.yggdrasil.aday.net.au/blog/)

Related: [PSEUDOCORP public mesh gate — invite only](/posts/2026-05-28-pseudocorp-invite-mesh-public-gate.html)
