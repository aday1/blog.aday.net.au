const MACRO_PHASES = [
  { id: "wire", label: "Wire Atelier", match: /wire atelier|shader index|glsl lab|resolume pipeline|relic: wire/i },
  { id: "showcase", label: "Wired Atelier showcase", match: /showcase|gh pages|release binaries|wired atelier theme|relic: wired/i },
  { id: "vj", label: "VJ & Fringe body", match: /vj deck|websocket|audience qr|bridge agent|fringe|relic: vj/i },
  { id: "linode", label: "Linode production", match: /linode|compose|nginx|aday lane|relic: linode/i },
  { id: "deploy", label: "Deploy lanes", match: /deploy-meta|dev\/live|gradient|relic: deploy/i },
  { id: "official", label: "Stable 42.1", match: /release: v42|stable hosted|42\.1/i }
];

const ART_PHASES = [
  { id: "candles", label: "Ordre des bougies", match: /dmx512 desk|desk prototype|relic: dmx512|candle|wind dancing/i },
  { id: "supercontrol", label: "SuperControl salon", match: /supercontrol|skeuomorph|touchosc|relic: supercontrol/i },
  { id: "workbench", label: "Emprunt Macroverse", match: /workbench|envelope|rack|transition tracker|relic: macroverse/i },
  { id: "tracker", label: "Tracker photonique", match: /tracker|fixture-aware|theme api|relic: dmx tracker/i },
  { id: "hosted", label: "Hosted stack", match: /hosted stack|ghcr|bridge|deploy-meta|relic: hosted/i },
  { id: "official", label: "Stable 5.1.2.0", match: /release: v5\.1\.2|stable hosted|5\.1\.2\.0/i }
];

const pickPhase = (trainId, subject) => {
  const phases = trainId === "artbastard" ? ART_PHASES : MACRO_PHASES;
  for (const phase of phases) {
    if (phase.match.test(subject)) return phase;
  }
  return phases[phases.length - 1];
};

const hashPick = (seed, list) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
};

const macroNarrative = (subject, phase) => {
  const s = subject.trim();
  if (/release: v42/i.test(s)) {
    return (
      "Forty-Two locks the stable hosted line at **42.1**: the same tool that once translated GLSL into ISF, " +
      "fed FFT across Reductionist's micro-instruments at Abbotsford Convent, and painted the universe " +
      "from stasis to heat-death — now runs on Linode with dev, live, and aday lanes. " +
      s +
      "."
    );
  }
  const openers = {
    wire: [
      "In the Wired Atelier, a shader becomes a Wire patch: ",
      "GLSL in, ISF out, Resolume on the other side — ",
      "The Fringe tool-chain takes shape in code: "
    ],
    showcase: [
      "Showcase pages glow like the free 12–4pm exhibition hours: ",
      "Docs and GH Pages carry the psychonaut palette: ",
      "Binary releases join the festival poster wall: "
    ],
    vj: [
      "7pm session energy — deck sync and audience QR: ",
      "Reductionist's macro-narrative, your FFT on the visuals: ",
      "Clan Analogue ingenuity, now multi-browser VJ: "
    ],
    linode: [
      "Abbotsford Convent closes; the convent stack opens on Linode: ",
      "Compose, nginx, aday lane behind basic auth: ",
      "Production gravity well for the shader engine: "
    ],
    deploy: [
      "Deploy-meta tells you when dev may kiss live: ",
      "Gradient sliders tuned for thumbs in the mosh pit: ",
      "Lane sync counts like measures in a set: "
    ],
    official: [
      "Official orbit achieved: ",
      "v42.0 on the manifest: ",
      "Hosted Forty-Two: "
    ]
  };
  const closer = [
    "Still chasing the same perceptual stretch MacroVerse sold on the Fringe program — energy read as motion, time read as colour.",
    "The Melbourne Fringe MacroVerse listing remains the origin myth; the repo is the instrument.",
    "Feeds the master timeline on blog.aday.net.au."
  ];
  const opener = hashPick(s + phase.id, openers[phase.id] || openers.wire);
  const end = hashPick(phase.id + s, closer);
  return `${opener}${s}. ${end}`;
};

const artNarrative = (subject, phase) => {
  const s = subject.trim();
  if (/release: v5\.1\.2|stable hosted|5\.1\.2\.0/i.test(s)) {
    return (
      "The Ordre des Bougies de Scène crowns **5.1.2.0** — a wink at DMX512 (5 · 1 · 2), a stable line " +
      "where TCP/IP and React serve the candle monks' descendants: scroll, sliders, touch faders, " +
      "hosted stack, and relic work in one release. " +
      s +
      ". Ainsi soit la lumière, mes amis."
    );
  }
  const french = {
    candles: [
      "Before Art-Net, the elite French art-candle monks conducted stages with breath and beeswax: ",
      "Grand Master Feng Zhi's breeze choreography, digitised as channel 1: ",
      "From Lumina's temple halls to a garage DMX desk: "
    ],
    supercontrol: [
      "The Société adopts metallic faders — still lit by metaphorical flame: ",
      "TouchOSC scrolls replace silk fan gestures, non?: ",
      "SuperControl: skeuomorphic heresy the monks would have adored: "
    ],
    workbench: [
      "A stolen glance at Macroverse's envelope cathedral: ",
      "Rack UI like organ pipes, transitions like censer swings: ",
      "Le Créateur borrows the workbench, returns it brighter: "
    ],
    tracker: [
      "The Renoise tracker, but for photons and fixture souls: ",
      "Fixture-aware lanes — pan, tilt, gobo, dimmer as liturgy: ",
      "Live theme API: vestments for the control surface: "
    ],
    hosted: [
      "The monks discover Linode — cloud catacombs with GHCR reliquaries: ",
      "Pi bridge agents whisper WSS where bamboo tubes once sighed: ",
      "Deploy-meta: scripture for when dev may ascend to live: "
    ],
    official: [
      "Official sacrament: ",
      "DMX512 nod enshrined: ",
      "Hosted ArtBastard, bastard of art, legitimate at last: "
    ]
  };
  const tails = [
    "The photons remember the candles.",
    "TCP/IP carries what wind once did.",
    "React components are the new bamboo tubes.",
    "Not for the faint of PAR.",
    "Vibe-coded, beret-approved, monastery-sanctioned."
  ];
  const opener = hashPick(s + phase.id, french[phase.id] || french.candles);
  const tail = hashPick(phase.id + s.length, tails);
  return `${opener}${s}. ${tail}`;
};

export const enrichCommit = (train, commit) => {
  const phase = pickPhase(train.id, commit.subject);
  const narrative =
    train.id === "artbastard"
      ? artNarrative(commit.subject, phase)
      : macroNarrative(commit.subject, phase);
  return {
    ...commit,
    phaseId: phase.id,
    phaseLabel: phase.label,
    narrative
  };
};

export const trainPrologue = (train) => {
  if (train.id === "artbastard") {
    return [
      "Long before DMX512, an elite order of French art-candle monks — the Illuminating Wind Dancing Masters — ran entire stage shows on breath, beeswax, and bamboo air-tracks. Feng Zhi conducted symphonies of flame; the Breaths of Light manuscripts were their patch sheets.",
      "Electricity arrived; the order survived in Parisian warehouses as the Société des Light Jockeys. Le Créateur des Lumières swore never again to insult a photon with a pedestrian desk. Candle logic became Art-Net packets, fan choreography became TouchOSC, catacombs became TCP/IP, ritual became React.",
      "ArtBastard **5.1.2.0** (5 · 1 · 2 → DMX512) is the stable hosted line — relic commits plus one release tip. Below: real git history, draped in the same canon as DOCS/HISTORY.md."
    ];
  }
  return [
    "At [Melbourne Fringe](https://www.melbournefringe.com.au/whats-on/events/macroverse), MacroVerse was live sonic and visual cosmology: Reductionist (Nick Wilson) on battery-powered micro-instruments, Aday (Adrian Richardson) on projection improv — universe from energy stasis to heat-death, Clan Analogue ingenuity, Abbotsford Convent's experimental program.",
    "Behind the 7pm hour-long sessions was a toolchain: GLSL shaders converted to ISF, piped into Resolume Wire, driven by FFT and live parameters — the same spine now in macroverse.aday.net.au as Macroverse **42.1**.",
    "Six relic commits below trace Wire Atelier → showcase → VJ/bridge → Linode → deploy-meta → stable **42.1** release. Each line is a real commit, narrated for the blog timeline."
  ];
};

export const groupByPhase = (commits) => {
  const map = new Map();
  commits.forEach((c) => {
    const key = c.phaseId;
    if (!map.has(key)) {
      map.set(key, { id: key, label: c.phaseLabel, items: [] });
    }
    map.get(key).items.push(c);
  });
  return [...map.values()];
};
