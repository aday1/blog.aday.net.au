---
title: Macroverse 42.2 — WebXR VR VJ
date: 2026-06-01
summary: Quest and headset support — audience dome stream, VJ controller in immersive WebXR, live shader push from VR.
tags:
  - release
  - macroverse
  - vr
  - webxr
  - vj
---

Macroverse **42.2** adds WebXR to the gig stack: scan a QR, put on a Quest, and you are inside the live VJ mix — or wearing the remote desk.

---

## What shipped

### Audience VR

Open **Copy VR audience** from the VJ deck QR panel (or `vj-vr.html?remote=1&viewToken=…`).

- SSE stream of the host A/B mix inside an immersive **360 dome** (default) or flat **screen** mode (`&mode=screen`)
- Same signed `viewToken` tier as the flat phone stream — watch-only unless **Audience participation** is on
- When participation is enabled, touch or drag in VR steers `mouseX` / `mouseY` only (no deck hijack)

### VJ controller VR

Open **Copy VR VJ** (`role=vj` + `controlToken` + `viewToken`).

- Remote desk over WebSocket: crossfader, deck clips, mix mode, Auto VJ on/off and BPM
- **Live GLSL push** to the host via `vj:shader-live` — code from VR recompiles on the operator machine
- Enter/exit immersive WebXR with a DOM overlay HUD; host outputs and flat audience streams keep running

### Auto VJ refinements

When Auto VJ is on, **shader swap** and **depth/param motion** are independent toggles (persisted per browser).

---

## Try it

- Live: [macroverse.aday.net.au](https://macroverse.aday.net.au)
- Test: [macroverse-test.aday.net.au](https://macroverse-test.aday.net.au)
- Changelog: [CHANGELOG.md on GitHub](https://github.com/aday1/macroverse.aday.net.au/blob/main/changelog.md)
- Showcase: [aday1.github.io/macroverse.aday.net.au](https://aday1.github.io/macroverse.aday.net.au/#vr-vj)

On the host: Settings → **VJ Show Session ID** → Apply → VJ tab → QR panel → **Copy VR audience** or **Copy VR VJ**.

Flat stream URLs (`vj-output.html`) are unchanged for Pi HDMI, OBS Browser Source, and phones.

---

## Caveats (honest)

Flat 2D GLSL shaders are mapped onto the VR dome — it works, but shaders authored as true 360 ray-marches look best inside the sphere. Quest Browser or any headset with WebXR **immersive-vr** support.

Filter **Macroverse** in Dev logs on this blog for the commit trail.
