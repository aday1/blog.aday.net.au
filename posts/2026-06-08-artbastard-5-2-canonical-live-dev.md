---
title: ArtBastard 5.2.0.0 - canonical live/dev desk
date: 2026-06-08
summary: ArtBastard's refreshed Reason-rack build is now the confirmed live/dev line, with the old beta identity retired and cleaner DMX strip visibility controls.
tags:
  - release
  - artbastard
  - dmx
  - lighting
  - devlog
---

ArtBastard **5.2.0.0** is the current working line for the lighting desk. The separate beta identity is retired: **dev** is pre-prod, **live** is production, and both are expected to stay aligned unless there is an active validation cycle.

This release is mostly about removing friction from the operator surface. The fixture library and show-map work remain the source of truth for physical DMX address planning, but the DMX strips no longer need to show a wall of anonymous zero-value channels while you are trying to drive real hardware.

---

## What changed

- **Compact DMX strips** hide unused channels by default.
- The compact rule keeps anything that looks intentionally useful: fixture-assigned, active, selected, pinned, custom-named, MIDI-mapped, or OSC-mapped channels.
- **Open all channels** is still one tap away when you suspect a physical fixture exists outside ArtBastard's current map.
- The live **activity tracker strip** can be toggled off so it does not consume the first screen.
- The **envelope editor** and **DMX transition pattern tracker** have separate visibility toggles.
- Static shell and showcase wording now says **Dev**, not **Beta/dev**.

---

## Why it matters

The desk is moving from "all possible DMX data exposed at once" toward "fixture-first, operator-first control." That means assigned hardware, address maps, fixture groups, and live-use controls should be obvious before the raw 512-channel universe appears.

Raw channel access is still there. It just stops being the default visual tax.

---

## Try it

- Live: [artbastard.aday.net.au](https://artbastard.aday.net.au)
- Dev: [artbastard-dev.aday.net.au](https://artbastard-dev.aday.net.au)
- Showcase: [aday1.github.io/artbastard.aday.net.au](https://aday1.github.io/artbastard.aday.net.au/)

Filter **ArtBastard** in Dev logs on this blog for the commit trail.
