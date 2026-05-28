---
title: PSEUDOCORP public mesh gate — invite only
date: 2026-05-28
summary: Cloudflare Pages gate copy now states invite-mesh-only; public DNS never serves the full homelab site.
tags:
  - homelab
  - pseudocorp
  - yggdrasil
  - cloudflare
---

The yggdrasil homelab is not a public SaaS. Random visitors who resolve pseudocorp.aday.net.au or pseudocorp.yggdrasil.aday.net.au through public DNS (1.1.1.1) hit Cloudflare Pages — a Windows 3.1 hold-music gate that says plainly: invite mesh only.

## What changed (2026-05-28)

Public gate copy was tightened so nobody mistakes the hostname for an open signup service:

- Title and tagline: PSEUDOCORP -- invite mesh only
- Meta description for search snippets
- Hero line: this hostname is not a public service
- Panels renamed to Invite mesh only and Not on the mesh (Tailscale invite required)
- Whitepaper public copy badge: INVITE MESH ONLY // PUBLIC INTERNET = GATE PAGE ONLY
- Deployed to Cloudflare Pages project pseudocorp-denied

Source: temp_/pseudocorp-deploy/public-denied/ (synced to CELES /etc/celes/public-pages/ on publish).

Redeploy after edits: node temp_/deploy-public-gate-pages.mjs

## Who sees what (DNS split)

- Home LAN / Pi-hole (10.13.37.10) resolves pseudocorp.* to 10.13.37.37 CELES — full intranet: NOC, PBX, Hermes, whitepaper
- Tailscale split DNS (Pi-hole via tailnet) — same full site on CELES
- Public internet (1.1.1.1) — Cloudflare Pages proxied gate, whitepaper, and live phone directory JSON only

ZealPalace uses the same pattern: [zealpalace.aday.net.au](https://zealpalace.aday.net.au/) is mesh only on the open web; on-net gets IRC, admin, blog, and MUD. See [ZealPalace public mesh gate — IRC MUD, not Minecraft](/posts/2026-05-28-zealpalace-mesh-public-gate.html) for the May 2026 deploy (Minecraft stack removed, Pi simulation restored).

CELES nginx still 302 untrusted clients to pseudocorp-denied.yggdrasil.aday.net.au when they hit the LAN edge without Tailscale or LAN trust.

## Public URLs (safe to share)

- Gate: [pseudocorp.aday.net.au](https://pseudocorp.aday.net.au/)
- Gate (yggdrasil): [pseudocorp.yggdrasil.aday.net.au](https://pseudocorp.yggdrasil.aday.net.au/)
- Denied alias: [pseudocorp-denied.yggdrasil.aday.net.au](https://pseudocorp-denied.yggdrasil.aday.net.au/)
- Whitepaper: [pseudocorp.aday.net.au/whitepaper.html](https://pseudocorp.aday.net.au/whitepaper.html)

Nothing on those URLs registers SIP, opens Hermes, or grants agent access without mesh membership.

## On-net (invite + Tailscale or LAN)

Same hostnames when split DNS points at CELES:

- Program Manager / NOC: [pseudocorp.yggdrasil.aday.net.au](https://pseudocorp.yggdrasil.aday.net.au/) from the mesh
- PBX: [celes.yggdrasil.aday.net.au/pbx/](https://celes.yggdrasil.aday.net.au/pbx/)
- Hermes: [celes.yggdrasil.aday.net.au/hermes/](https://celes.yggdrasil.aday.net.au/hermes/)

SIP registrar when registered: pseudocorp.yggdrasil.aday.net.au UDP 5060 — never a public WAN IP.

Friend onboarding: ask aday for a Tailscale invite; first SIP registration can hear SCRIBE HR welcome.

## Why bother

Portfolio sites (Macroverse, ArtBastard, this blog) are for the open web. The homelab mesh is invite-only: voice, agents, and LAN toys stay behind Tailscale and Pi-hole split DNS. The public gate exists so DNS lookups do not imply an anonymous service — and so hold music still plays while you fetch a whitepaper.
