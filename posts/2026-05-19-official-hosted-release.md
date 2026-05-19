---
title: Official hosted release — ArtBastard 5.1.2 and Macroverse 42.0
date: 2026-05-19
summary: Two origin stories meet official hosting — candle monks to DMX512, Fringe GLSL to Forty-Two.
tags:
  - release
  - artbastard
  - macroverse
  - homelab
  - story
---

Today we draw a line: everything before these tags is **relic-era development** (squashed into six readable git milestones per repo). Everything after is **dev / live** discipline on Linode, with GitHub Releases as scripture.

---

## ArtBastard 5.1.2 — from candle monks to TCP/IP

Version **5.1.2** is deliberate: **5 · 1 · 2** whispers **DMX512** to those who speak fluent universe.

### The story (abbreviated canon)

Before packets, there were **elite French art-candle monks** — the Illuminating Wind Dancing Masters. They ran stage shows on breath, beeswax, and bamboo air-tracks. Grand Master Feng Zhi conducted symphonies of flame; the Breaths of Light manuscripts were their patch sheets.

Electricity did not kill the order. It moved them into Parisian warehouses as the **Société des Light Jockeys**. *Le Créateur des Lumières* declared war on pedestrian consoles. Candle logic became **Art-Net**. Fan choreography became **TouchOSC**. Catacombs became **TCP/IP**. Ritual became **React** (and a suspicious amount of Camembert at 3 AM).

The relic ladder in git walks that path: desk prototype → SuperControl skeuomorph → borrowed Macroverse workbench → DMX Tracker and themes → hosted stack with Pi bridge → **official 5.1.2**.

**5.1.2.3** (same line, fourth segment — not 5.1.3) is the live hotfix: page scroll inside the layout and range sliders responding again after the first deploy.

- Live: [artbastard.aday.net.au](https://artbastard.aday.net.au)
- Dev: [artbastard-dev.aday.net.au](https://artbastard-dev.aday.net.au)
- Release: [v5.1.2 on GitHub](https://github.com/aday1/artbastard.aday.net.au/releases/tag/v5.1.2)
- Fevered full history: [DOCS/HISTORY.md](https://github.com/aday1/artbastard.aday.net.au/blob/main/DOCS/HISTORY.md) in the repo

Open the **Dev logs** panel on this blog and filter **ArtBastard** for commit-by-commit narration.

---

## Macroverse 42.0 — from Fringe universe to hosted Forty-Two

**Macroverse 42** and semver **42.0** now align — product name and release tag share one orbit.

### The story (Fringe → engine)

At [Melbourne Fringe](https://www.melbournefringe.com.au/whats-on/events/macroverse), **MacroVerse** was live sonic and visual cosmology at Abbotsford Convent: **Reductionist** on battery-powered micro-instruments, **Aday** on projection improv — universe from energy stasis to heat-death, Clan Analogue ingenuity, free daytime exhibition and nightly hour-long performances.

Behind the visuals was a toolchain I still use daily:

- **GLSL** in the lab → **ISF** → **Resolume Wire** at the venue
- **FFT** and live parameters driving crossfades and motion with the set
- Later: VJ sessions, audience QR, WebSocket deck sync, Pi **LAN bridge**, Linode **dev / live / aday** lanes

The relic ladder: Wire Atelier → showcase/docs → VJ & bridge → Linode production → deploy-meta polish → **official 42.0**.

- Live: [macroverse.aday.net.au](https://macroverse.aday.net.au)
- Test: [macroverse-test.aday.net.au](https://macroverse-test.aday.net.au)
- Release: [v42.0 on GitHub](https://github.com/aday1/macroverse.aday.net.au/releases/tag/v42.0)
- Origin post: [MacroVerse at Melbourne Fringe](/posts/2025-10-07-macroverse-fringe-origin.html)

Filter **Macroverse** in Dev logs for the six-commit storyline.

---

## What changed in git (for archaeologists)

We rewrote history on the two app repos into milestone commits. Old interim numbers (5.13–5.16, 0.1.x) were never official tags — they live in changelog **Pre-release relics** sections.

**Work on `dev`, promote to `main`, reset `dev` from `main`.** Backups of pre-squash history exist locally if you need them.

The blog devlog bundle, timeline, and this post were rebuilt to match the new story.
