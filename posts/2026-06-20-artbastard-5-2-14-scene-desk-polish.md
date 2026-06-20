---
title: ArtBastard 5.2.14.0 - Essential 14+14 scene desk polish
date: 2026-06-20
summary: Default APC seeds are now 14 clips per deck with explained pack UI, scene loads settle without stale automation, and SuperControl scene navigation matches fixture rows.
tags:
  - release
  - artbastard
  - dmx
  - lighting
  - devlog
---

ArtBastard **5.2.14.0** trims the default seed footprint and cleans up operator friction around scenes, seeds, and live DMX churn after recall.

---

## What changed

- **Essential 14+14** is the default scene seed: Deck A slots 01-14 and Deck B slots 01-14 (28 looks). Slots 15-40 stay empty for captures and one-slot seeds.
- **Seed Scenes** and **Seed ACTS** panels now describe each pack and mode in plain language (counts, look types, which slots stay open).
- **Scene Controls** in SuperControl matches Fixture/Group navigation layout with readable OSC/MIDI rows.
- **Scene load** suspends global automation during crossfade, then holds static unless the scene itself saved enabled automation or a timeline.
- **Auto scene cycle** queue fill/random/drop-in controls in Auto Scene Control.
- **APC workbench / stage map** split panes can collapse fully; Reset layout restores both.
- **Mobile DMX monitor** caps server log panels to half the viewport.
- **Custom Path Editor** point add/drag works again after scaling fixes.

---

## Links

- Live: [artbastard.aday.net.au](https://artbastard.aday.net.au)
- Dev: [artbastard-dev.aday.net.au](https://artbastard-dev.aday.net.au)
- Showcase: [aday1.github.io/artbastard.aday.net.au](https://aday1.github.io/artbastard.aday.net.au/)

Filter **ArtBastard** in Dev logs on this blog for the commit trail.
