---
title: Macroverse 42.2 — Mobile VJ shell & audience phones
date: 2026-06-02
summary: Touch-first bottom bar, drawer layout on narrow screens, audience stream QR with optional touch X/Y — same gig session as VR and co-VJ.
tags:
  - release
  - macroverse
  - mobile
  - vj
  - audience
---

Macroverse **42.2** is not desktop-only. The hosted cloud lanes now use a **touch-aware layout tier**: phones and tablets get a drawer shell instead of the three-column desktop grid, and the VJ deck stays usable with fat thumbs in a dark venue.

Pair this with the [WebXR VR VJ post](/posts/2026-06-01-macroverse-vr-vj.html) — flat phones, Quest headsets, and full co-VJ desks all share one salted gig session.

---

## What shipped

### Mobile bottom tab bar

On viewports under **640px** you get five fixed tabs:

- **Library** — shader index dock
- **Preview** / **Code** — core views
- **Params** — right-hand slider dock
- **More** — VJ deck, Gallery, Split, command palette, Settings, Help

The top-bar **View** dropdown mirrors the tab strip when horizontal space is tight. Settings also has a **Mobile / Desktop** toggle if you want to force the mobile CSS on a laptop (Steam Deck, kiosk, etc.).

### Touch-friendly VJ deck

- Deck previews and master mix fill their layout boxes on small screens
- Crossfader and deck sliders use touch-friendly hit targets (`touch-action` so drags do not scroll the page)
- Startup **splash QRs** show VJ collaboration + audience stream while the index loads — scan before the library finishes indexing

### Audience on phones (flat stream)

Same tier as VR audience, without a headset:

- VJ deck QR panel → **Audience stream** → `vj-output.html?remote=1&viewToken=…`
- Watch-only SSE preview of the live A/B mix
- Toggle **Audience participation** on the host: phones can touch/drag the stream to steer `mouseX` / `mouseY` only — no deck hijack, no crossfader access
- Co-VJs still use the top-bar **VJ** chip / `controlToken` link for full WebSocket desk sync

---

## Try it

- Live: [macroverse.aday.net.au](https://macroverse.aday.net.au)
- Showcase mobile help: [aday1.github.io/macroverse.aday.net.au/#help](https://aday1.github.io/macroverse.aday.net.au/#help) (section 4 — Mobile bottom tab bar)
- Participatory VJ overview: [showcase #participatory-vj](https://aday1.github.io/macroverse.aday.net.au/#participatory-vj)

On the host: Settings → **VJ Show Session ID** → Apply → VJ tab → enable **Audience participation** if you want touch steering on the stream QR.

---

## Caveats (honest)

Mobile WebGL is still WebGL — thermal throttling on old phones can stutter heavy shaders. For venue output, keep the Pi/OBS path on `vj-output.html`; phones are best as remote eyes and light participation, not the main projector feed.

Filter **Macroverse** in Dev logs on this blog for the commit trail (touch-aware tiers, splash QRs, VJ token fixes).
