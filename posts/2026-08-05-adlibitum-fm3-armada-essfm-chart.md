---
title: AdLibitum at FM3 — Armada 1750 ESS FM (the long way round)
date: 2026-08-05
summary: Clan Analogue's FM3 gig (Brunswick Artists Bar, Sat 8 Aug, free entry) — AdLibitum is the VST stack driving my Armada 1750 ESS ES1869, plus Game Boy mGB and SammichSID. Free tickets on Moshtix.
tags: adlibitum, fm3, clan-analogue, essfm, armada, chiptune
github: https://github.com/aday1/AdLibitum
nav: chip
shader: fm
---

**Names, quick:**

- **AdLibitum** = the VST stack (FM Driver / FM Kit / jam tools / at2net path — the software I built).
- **FM3** = the Clan Analogue gig. Live frequency modulation night. I'm on the bill as **Aday**.

## FM3 — Clan Analogue

Clan Analogue presents **FM3** — featuring artists from *Sublime Wavelengths* ("the cosmic bliss of FM synthesis").

- **Where:** Brunswick Artists Bar, 316 Sydney Road
- **When:** Saturday 8th August, 8pm onwards
- **Entry:** Free (Moshtix is just the RSVP / ticket desk — no charge)
- **Lineup:** Acidalius · Sussiguala · Aday · Reductionist · DJ Koshowko
- **Also launching:** Reductionist — *Energy Field* (CAO63E)
- **Tickets:** [free via Moshtix](https://www.moshtix.com.au/v2/event/clan-analogue-presents-fm3/197758) — Clan Analogue presents FM3
- **More:** [clananalogue.org](https://www.clananalogue.org)

What I'm bringing to that room is the AdLibitum stack into real ESS FM silicon — not a softsynth nostalgia deck. Game Boy (mGB) and SammichSID ride along.

## How AdLibitum got to the Armada

I forked [ijsf/at2](https://github.com/ijsf/at2) and wrote a VST to drive the only piece of FM hardware I actually have laying around: my **Compaq Armada 1750**, with an integrated **ESS AudioDrive ES1869** (or ES1869S).

Then I needed a way to drive it. So I wasted a few weeks on a serial cable implementation. It sucked. I gave up, rewrote a network receiver (**at2net** / FM31NET), installed Windows 98, and found an old network card. That turned out OK.

After that I spent ages figuring out AdLib Tracker files — `.a2m`, `.a2i`, and the instrument formats — and wrote a VST to handle the modulators so I could wire it up to more modern MIDI controllers. In this case a **Behringer X-Touch**. It sounds remarkably pleasant to listen to (and I hope the venue does too). So I've now got a powerful FM synth in the studio without hunting down a DX7 and learning how on earth you even work with that interface, or looking far and wide for a second-hand Sound Blaster… speaking of which, if anyone's got spare Sound Blasters kicking around and a motherboard with ISA ports and 8MB to 16MB of RAM on it, I'm interested ;)

I also really went back to roots on this. The instruments, patches, and sounds will be accompanied by other chiptune: my **Game Boy** running **mGB**, and a **SammichSID** (6581).

I was also listening to a lot of **Bobby Prince**, who passed away in June, and listening / reading about the musical limitations and software he would have worked with back in the early days around the Doom era. Huge respect. Amazing composer.

**Licensing:** the AT2-derived fork path (at2net and related replay bits) will be released under **GPL v3**, same as AdLib Tracker II. AdLibitum's own upstream code stays under its existing licence (beerware / CC BY 4.0). Third-party pieces (Nuked-OPL3, mGB, etc.) keep their own. Repo: [aday1/AdLibitum](https://github.com/aday1/AdLibitum).

Chart below is how the AdLibitum desk talks to the Armada laptop.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Orbitron:wght@600;800&display=swap">
<style>
  .fm3-chart {
    --c-bg: #0a0c0a;
    --c-panel: #121812;
    --c-line: #2a3a28;
    --c-ink: #d8e6d0;
    --c-dim: #7a9170;
    --c-hot: #c8f060;
    --c-amber: #e8a838;
    --c-wire: #5ad4ff;
    --c-chip: #3ecf8e;
    --c-warn: #ff6b3d;
    font-family: "IBM Plex Mono", Consolas, monospace;
    color: var(--c-ink);
    background:
      radial-gradient(ellipse 70% 50% at 10% 0%, rgba(62,207,142,0.14), transparent 55%),
      radial-gradient(ellipse 50% 40% at 90% 100%, rgba(232,168,56,0.08), transparent 50%),
      linear-gradient(180deg, #0e140e 0%, var(--c-bg) 100%);
    border: 1px solid var(--c-line);
    padding: 1.25rem 1.1rem 1.5rem;
    margin: 1.25rem 0 2rem;
    max-width: 100%;
    overflow-x: clip;
    overflow-y: visible;
  }
  .fm3-chart * { box-sizing: border-box; }
  .fm3-chart .eyebrow {
    font-family: "Orbitron", "IBM Plex Mono", sans-serif;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 0.68rem;
    color: var(--c-amber);
    margin: 0 0 0.6rem;
  }
  .fm3-chart h2.chart-title {
    font-family: "Orbitron", "IBM Plex Mono", sans-serif;
    font-size: clamp(1.35rem, 4vw, 2rem);
    letter-spacing: 0.05em;
    color: var(--c-hot);
    margin: 0 0 0.4rem;
    text-shadow: 0 0 28px rgba(200,240,96,0.22);
  }
  .fm3-chart .lede {
    color: var(--c-dim);
    font-size: 0.92rem;
    line-height: 1.5;
    max-width: 42rem;
    margin: 0 0 1.4rem;
  }
  .fm3-chart .lede strong { color: var(--c-ink); font-weight: 600; }

  .fm3-flow {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
    margin: 0 0 0.75rem;
  }
  @media (max-width: 900px) {
    .fm3-flow { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 520px) {
    .fm3-flow { grid-template-columns: 1fr; }
  }
  .fm3-node {
    background: var(--c-panel);
    border: 1px solid var(--c-line);
    padding: 0.85rem 0.75rem;
    min-height: 7.5rem;
    position: relative;
  }
  .fm3-node::after {
    content: "";
    position: absolute;
    right: -0.35rem;
    top: 50%;
    width: 0.55rem;
    height: 1px;
    background: var(--c-wire);
    opacity: 0.7;
  }
  .fm3-flow .fm3-node:nth-child(4n)::after,
  .fm3-flow .fm3-node:last-child::after { display: none; }
  @media (max-width: 900px) {
    .fm3-flow .fm3-node:nth-child(2n)::after { display: none; }
    .fm3-flow .fm3-node:nth-child(odd)::after { display: block; }
  }
  @media (max-width: 520px) {
    .fm3-node::after { display: none !important; }
  }
  .fm3-node .lbl {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--c-dim);
    margin: 0 0 0.35rem;
  }
  .fm3-node .ttl {
    font-family: "Orbitron", "IBM Plex Mono", sans-serif;
    font-size: 0.95rem;
    color: var(--c-hot);
    margin: 0 0 0.35rem;
  }
  .fm3-node.wire .ttl { color: var(--c-wire); }
  .fm3-node.chip .ttl { color: var(--c-chip); }
  .fm3-node.amber .ttl { color: var(--c-amber); }
  .fm3-node .sub {
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--c-ink);
    opacity: 0.9;
  }

  .fm3-ascii {
    font-size: 0.68rem;
    line-height: 1.28;
    color: var(--c-chip);
    background: #080a08;
    border: 1px solid var(--c-line);
    padding: 0.85rem 0.9rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    white-space: pre;
    margin: 0 0 1.1rem;
    text-shadow: 0 0 8px rgba(62, 207, 142, 0.25);
    max-width: 100%;
  }
  .fm3-ascii-phone { display: none; }
  .fm3-sec {
    font-family: "Orbitron", "IBM Plex Mono", sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--c-chip);
    margin: 1.6rem 0 0.75rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid var(--c-line);
  }
  .fm3-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 0 0.5rem;
  }
  .fm3-table {
    width: 100%;
    min-width: 28rem;
    border-collapse: collapse;
    font-size: 0.82rem;
    margin: 0;
  }
  .fm3-table th,
  .fm3-table td {
    border: 1px solid var(--c-line);
    padding: 0.55rem 0.6rem;
    text-align: left;
    vertical-align: top;
  }
  .fm3-table th {
    background: #0e160e;
    color: var(--c-amber);
    font-weight: 600;
    letter-spacing: 0.06em;
    font-size: 0.72rem;
    text-transform: uppercase;
  }
  .fm3-table td { background: rgba(18,24,18,0.85); }
  .fm3-table tr:hover td { background: #182218; }
  .fm3-table code {
    font-family: inherit;
    color: var(--c-wire);
    font-size: 0.9em;
  }

  .fm3-grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    margin: 0.75rem 0 1rem;
  }
  @media (max-width: 700px) {
    .fm3-grid2 { grid-template-columns: 1fr; }
  }
  .fm3-box {
    border: 1px solid var(--c-line);
    background: var(--c-panel);
    padding: 0.85rem 0.9rem;
  }
  .fm3-box h3 {
    font-family: "Orbitron", "IBM Plex Mono", sans-serif;
    font-size: 0.85rem;
    color: var(--c-hot);
    margin: 0 0 0.45rem;
    letter-spacing: 0.04em;
  }
  .fm3-box p,
  .fm3-box li {
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--c-ink);
    margin: 0;
  }
  .fm3-box ul { margin: 0; padding-left: 1.1rem; }
  .fm3-box li { margin: 0.25rem 0; }

  .fm3-sting {
    margin: 1.25rem 0 0;
    padding: 0.9rem 1rem;
    border-left: 3px solid var(--c-warn);
    background: #141010;
    border-top: 1px solid var(--c-line);
    border-right: 1px solid var(--c-line);
    border-bottom: 1px solid var(--c-line);
    font-size: 1.05rem;
    line-height: 1.4;
    color: var(--c-hot);
  }
  .fm3-foot {
    margin: 1rem 0 0;
    font-size: 0.75rem;
    color: var(--c-dim);
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .fm3-foot a { color: var(--c-wire); }

  @media (max-width: 720px) {
    .fm3-chart {
      padding: 0.9rem 0.7rem 1.1rem;
      margin: 1rem -0.15rem 1.5rem;
      border-radius: 0;
    }
    .fm3-chart .eyebrow {
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      line-height: 1.35;
    }
    .fm3-chart .lede { font-size: 0.86rem; }
    .fm3-node { min-height: 0; padding: 0.75rem 0.7rem; }
    .fm3-node .ttl { font-size: 0.9rem; }
    .fm3-node .sub { font-size: 0.76rem; }
    .fm3-ascii-wide { display: none; }
    .fm3-ascii-phone {
      display: block;
      font-size: 0.72rem;
      line-height: 1.32;
      padding: 0.75rem 0.65rem;
    }
    .fm3-table { min-width: 22rem; font-size: 0.76rem; }
    .fm3-table th, .fm3-table td { padding: 0.45rem 0.5rem; }
    .fm3-sting { font-size: 0.95rem; padding: 0.75rem 0.8rem; }
    .fm3-sec { font-size: 0.72rem; letter-spacing: 0.1em; }
  }
  @media (max-width: 380px) {
    .fm3-ascii-phone { font-size: 0.64rem; }
    .fm3-chart .eyebrow { letter-spacing: 0.06em; }
  }
</style>

<section class="fm3-chart" aria-label="Armada ESS FM drive and sound design chart">
  <p class="eyebrow">AdLibitum VST stack · Clan Analogue FM3 gig</p>
  <h2 class="chart-title">ARMADA 1750 · ESS FM</h2>
  <p class="lede">
    <strong>1999 Compaq Armada 1750.</strong> ESS ES1869 at <code>388h</code>. Sixteen megs of RAM.
    We do not stream audio to this laptop — we stream OPL register frames. Sound design is two operators,
    feedback, envelopes, and an 18-voice channel budget.
  </p>

  <pre class="fm3-ascii fm3-ascii-wide" aria-hidden="true">.-.   .-.   .-.   .-.   .-.   .-.   .-.   .-.
|A|---|D|---|L|---|I|---|B|---|I|---|T|---|U|
'-'   '-'   '-'   '-'   '-'   '-'   '-'   '-'
        CHIPTUNE FM SYNTH  //  FM3</pre>
  <pre class="fm3-ascii fm3-ascii-phone" aria-hidden="true">ADLIBITUM
chiptune FM  //  FM3</pre>

  <div class="fm3-flow" role="list">
    <div class="fm3-node" role="listitem">
      <div class="lbl">host</div>
      <div class="ttl">Modern box</div>
      <div class="sub">REAPER FM Kit + Drivers · X-Touch · at2net. Notes and envelopes become register intent.</div>
    </div>
    <div class="fm3-node wire" role="listitem">
      <div class="lbl">wire</div>
      <div class="ttl">FM31NET</div>
      <div class="sub">F0→F1 handshake · AA bank reg val · TCP :3819 · TCP_NODELAY (or death by Nagle).</div>
    </div>
    <div class="fm3-node amber" role="listitem">
      <div class="lbl">guest</div>
      <div class="ttl">FM31LEAN</div>
      <div class="sub">Win98 receiver on the Armada. Mute/solo bend the stream. PANIC = chip reset.</div>
    </div>
    <div class="fm3-node chip" role="listitem">
      <div class="lbl">silicon</div>
      <div class="ttl">ES1869</div>
      <div class="sub">Direct OUT to 388h / 38Ah. Operators key on. Soft Nuked only rehearses.</div>
    </div>
  </div>

  <pre class="fm3-ascii fm3-ascii-wide">╔══════════════════════════════════════════════════════════════════════╗
║  ░▒▓█  ADLIBITUM VST  →  ARMADA / ESS   ·   GIG: CLAN ANALOGUE FM3  █▓▒░  ║
╚══════════════════════════════════════════════════════════════════════╝

  ┌──────────────────────────┐         TCP :3819          ┌──────────────────────────┐
  │  ░ MODERN BOX ░          │      F0 ──▶ F1 ACK         │  ░ ARMADA 1750 ░         │
  │                          │    ┌───────────────┐       │                          │
  │  REAPER + X-TOUCH        │    │ [AA bk rg vl] │       │  Win98 · FM31LEAN        │
  │  FM Kit / FM Drivers     ├───▶│  FM31NET wire │──────▶│  parse · mute/solo desk  │
  │  at2net (.a2m path)      │    │  TCP_NODELAY  │       │  OUT 388h / 38Ah         │
  │  Studio / modulators     │    └───────────────┘       │  ESS AudioDrive sings    │
  └────────────┬─────────────┘                            └────────────┬─────────────┘
               │                                                       │
               ▼                                                       ▼
        ┌─────────────┐                                         ┌─────────────┐
        │ NUKE soft   │  A/B fan-out optional                   │ 18 VOICES   │
        │ Nuked-OPL3  │◀───────────────────────────────────────▶│ mod + car   │
        └─────────────┘                                         └─────────────┘

  ┌──── GB mGB ────┐   ┌── SammichSID 6581 ──┐   ┌── GPL v3 AT2 fork (soon) ──┐
  │ Teensy / cart  │   │ chiptune bed        │   │ at2net + ijsf/at2 lineage │
  └────────────────┘   └─────────────────────┘   └───────────────────────────┘

     serial weeks: suck  ················  ethernet: go
     PLAY DIODE fixes most sound issues (Armada wallpaper law)</pre>
  <pre class="fm3-ascii fm3-ascii-phone">ADLIBITUM VST
      |
      v
 FM31NET :3819
 [AA bk rg vl]
      |
      v
 ARMADA 1750
 Win98 FM31LEAN
 OUT 388h / 38Ah
      |
      v
 ES1869 · 18 voices
 (+ NUKE soft A/B)

 GB mGB · SID 6581
 serial sucked · ethernet go
 PLAY DIODE wallpaper law</pre>

  <h3 class="fm3-sec">Sound design for ESS FM</h3>
  <p class="lede" style="margin-bottom:0.85rem">Limits are the instrument. No free sample pad. Kick and hat are FM patches that measure like drums — or they scream white.</p>

  <div class="fm3-table-wrap">
  <table class="fm3-table">
    <thead>
      <tr><th>Knob</th><th>On the ES1869</th><th>Why it matters live</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Algorithm</td>
        <td>FM (mod bends carrier) vs additive (both heard)</td>
        <td>Bite vs organ/pad stack — the first decision</td>
      </tr>
      <tr>
        <td>Feedback 0–7</td>
        <td>Modulator self-mod</td>
        <td>≥6 often noise; SAFE PASS walks melodic voices down</td>
      </tr>
      <tr>
        <td>Mult ratio</td>
        <td>Mod:car frequency multiplier</td>
        <td>Bass gravity vs bell / metal harmonics</td>
      </tr>
      <tr>
        <td>Waveform</td>
        <td>8 OPL3 waves (sine → square / log-saw)</td>
        <td>Timbre palette — not Serum wavetables</td>
      </tr>
      <tr>
        <td>ADSR + EG hold</td>
        <td>Per-operator envelopes</td>
        <td>Release ≤1 = drones that outlive the set</td>
      </tr>
      <tr>
        <td>Carrier TL</td>
        <td>Attenuation 0–63 (0 = loud)</td>
        <td>Velocity / CC7 / CC11 dynamics live here</td>
      </tr>
      <tr>
        <td>18 voices</td>
        <td>Channels 0–8 bank0, 9–17 bank1</td>
        <td>Arrangement = who owns a channel this bar</td>
      </tr>
    </tbody>
  </table>
  </div>

  <div class="fm3-grid2">
    <div class="fm3-box">
      <h3>Bank ethics (SAFE PASS)</h3>
      <ul>
        <li>Harvest AdLib / AT2 / archive voices into oplbank</li>
        <li>Render + measure spectral flatness</li>
        <li>Fix drone release; walk feedback until not noise</li>
        <li>Keep waveform / mult / attack identity</li>
        <li>Drums get a graded noise licence</li>
      </ul>
    </div>
    <div class="fm3-box">
      <h3>Live desk moves</h3>
      <ul>
        <li>One FM Kit + six FM Drivers on REAPER</li>
        <li>OUT = ARMADA (NUKE = laptop soft rehearse)</li>
        <li>Mod Mult / Level / Attack envelopes = real OPL units</li>
        <li>at2net for authentic .a2m effects (subz3ro / AT2)</li>
        <li>Fan-out A/B: same stream → Nuked + Armada</li>
      </ul>
    </div>
  </div>

  <h3 class="fm3-sec">Why the laptop boots this way</h3>
  <div class="fm3-grid2">
    <div class="fm3-box">
      <h3>Port truth</h3>
      <p>ESFM sounds like “Sound Blaster base 228.” I chased 228 for ages — also had AUTOEXEC.BAT wrong for a while there, and honestly forgot how CONFIG.SYS works. <strong>FM index was always 388 hex.</strong> Bank 0: 388/389. Bank 1: 38A/38B. Wonder if I should try this on FreeDOS next time…</p>
    </div>
    <div class="fm3-box">
      <h3>VxD trap → FM METAL</h3>
      <p>ESS driver traps 388h and steals your writes. Fix: disable ES1869 in Device Manager, keep the NIC, run FM METAL (ESSCFG + ESSVOL + FM31NET).</p>
    </div>
  </div>

  <p class="fm3-sting">We don’t stream audio to the Armada — we stream register writes. The ES1869 is the instrument.</p>

  <p class="fm3-foot">
    Forked from <a href="https://github.com/ijsf/at2">ijsf/at2</a> (AdLib Tracker II / subz3ro lineage) — releasing AT2-derived bits under <strong>GPL v3</strong>.
    Soft rehearsal: <strong>Nuke.YKT</strong> / Nuked-OPL3.
    GB: <strong>trash80</strong> / mGB · SID: SammichSID 6581.
    <a href="https://github.com/aday1/AdLibitum">github.com/aday1/AdLibitum</a> · <a href="https://aday.net.au">aday.net.au</a>
  </p>
</section>
```

## What ended up on the desk

- **AdLibitum** in REAPER — FM Kit + Drivers, modulators on the X-Touch, `OUT = ARMADA` when the laptop is live.
- **at2net** — AT2's own replay, pointed at the network instead of DOS ports, so `.a2m` effects stay honest (GPL v3 when it ships).
- **Game Boy + mGB** and **SammichSID** — chiptune hardware to share the mixer.

See you at **FM3** — [free tickets on Moshtix](https://www.moshtix.com.au/v2/event/clan-analogue-presents-fm3/197758). Bring a Sound Blaster if you've got a spare.
