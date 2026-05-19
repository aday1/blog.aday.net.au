---
title: Official hosted release — ArtBastard 5.1.2 and Macroverse 42.0
date: 2026-05-19
summary: First official releases on Linode with dev/live lanes. Prior git history is relic-era archaeology.
tags:
  - release
  - artbastard
  - macroverse
  - homelab
---

Today marks the line between **development relics** and **official hosted releases**.

## ArtBastard 5.1.2 (DMX512)

Version **5.1.2** is intentional: **5 · 1 · 2** nods to **DMX512**. This is the first stable train on GitHub Releases and GHCR under controlled **dev** and **live** branches.

- Live: [artbastard.aday.net.au](https://artbastard.aday.net.au)
- Dev: [artbastard-dev.aday.net.au](https://artbastard-dev.aday.net.au)
- Release: [v5.1.2 on GitHub](https://github.com/aday1/artbastard.aday.net.au/releases/tag/v5.1.2)

Everything before this tag in git is squashed into a short **relic ladder** (desk prototype, SuperControl era, Macroverse workbench borrow, tracker/theme work, hosted stack + Pi bridge).

## Macroverse 42.0 (Forty-Two)

**Macroverse 42** and semver **42.0** now align. Same dev/live discipline, plus the **aday** lane for the full shader library (basic auth).

- Live: [macroverse.aday.net.au](https://macroverse.aday.net.au)
- Test: [macroverse-test.aday.net.au](https://macroverse-test.aday.net.au)
- Release: [v42.0 on GitHub](https://github.com/aday1/macroverse.aday.net.au/releases/tag/v42.0)

Relic era covers Wire Atelier origins, showcase/docs, VJ sessions and LAN bridge, Linode production, and deploy-meta polish.

## What changed in git

We rewrote history on the two app repos into readable milestone commits. Old interim version numbers (5.13–5.16, 0.1.x) were never official shipping tags — they live in changelog **Pre-release relics** sections as archaeology.

From here: work on **dev**, promote to **main**, reset **dev** from **main**. See the homelab Live / Dev / Promote ethos in the vault.
