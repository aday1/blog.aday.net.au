const MACRO_PHASES = [
  { id: "fringe", label: "Fringe genesis", match: /fringe|origin|melbourne|convent|reductionist/i },
  { id: "shader", label: "Shader engine", match: /shader|glsl|isf|vj|crossfade|crt|view tab|visual/i },
  { id: "frontend", label: "Control surface", match: /frontend|bootstrap|settings|panel|ui|tab/i },
  { id: "deploy", label: "Deploy lanes", match: /deploy|dns|nginx|linode|docker|compose|htpasswd|workflow|pages/i },
  { id: "infra", label: "Infrastructure", match: /terraform|infra|dns sync|zone|api/i }
];

const ART_PHASES = [
  { id: "society", label: "Société des Light Jockeys", match: /theme|luminary|quote|docs|showcase|cursor|amiga|svg/i },
  { id: "deploy", label: "Salon deploy", match: /deploy|linode|compose|nginx|pages|workflow|dev branch|meta/i },
  { id: "protocol", label: "Protocole DMX", match: /dmx|osc|midi|art-?net|fixture|smx|touchosc/i },
  { id: "agents", label: "Archives secrètes", match: /agents|readme|license|history|pr #/i },
  { id: "awakening", label: "L'éveil", match: /.*/ }
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
  const openers = {
    fringe: [
      "Fringe energy encoded in the repo: ",
      "Abbotsford Convent echoes in this commit — ",
      "MacroVerse show DNA surfaces again: "
    ],
    shader: [
      "Another photon in the shader stack: ",
      "GLSL lane update — ",
      "VJ crossfade territory: "
    ],
    frontend: [
      "Control plane adjustment: ",
      "Operator UI refinement: ",
      "Tab and panel choreography: "
    ],
    deploy: [
      "Deploy lane transmission: ",
      "Production path hardened: ",
      "DNS / edge ritual complete: "
    ],
    infra: [
      "Infrastructure constellation shift: ",
      "Back-end sky map updated: ",
      "Ops layer note: "
    ]
  };
  const closer = [
    "Timeline folds this into the living Macroverse engine.",
    "Part of the browser stack that grew out of the Fringe performance.",
    "Feeds the master presence graph on blog.aday.net.au."
  ];
  const opener = hashPick(s + phase.id, openers[phase.id] || openers.shader);
  const end = hashPick(phase.id + s, closer);
  return `${opener}${s}. ${end}`;
};

const artNarrative = (subject, phase) => {
  const s = subject.trim();
  const french = {
    society: [
      "Les Light Jockeys murmurent dans le dépôt parisien: ",
      "Le Créateur des Lumières exige plus de luminance: ",
      "Chronique de la Société — "
    ],
    deploy: [
      "Transmission depuis le salon de déploiement: ",
      "Le beret vole; les serveurs obéissent: ",
      "Rituel Linode accompli — "
    ],
    protocol: [
      "Protocole photonique mis à jour: ",
      "Les Wind Dancing Masters approuvent ce patch DMX: ",
      "Art-Net whisper in the catacombs: "
    ],
    agents: [
      "Scrolls archived by astral coding agents: ",
      "Canon élargi dans les manuscrits: ",
      "Les philistins tremblent; la doc s'enrichit: "
    ],
    awakening: [
      "Encore une gifle à la médiocrité lumineuse: ",
      "ArtBastard, bastard of art, avance: ",
      "Camembert-fueled clarity at 3 AM: "
    ]
  };
  const tails = [
    "Ainsi soit la lumière, mes amis.",
    "The photons remember.",
    "Honouring Feng Zhi's breeze choreography in silicon.",
    "Not for the faint of PAR.",
    "Vibe-coded, beret-approved."
  ];
  const opener = hashPick(s + phase.id, french[phase.id] || french.awakening);
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
      "Before DMX512, there were the Illuminating Wind Dancing Masters — candle symphonies conducted with bamboo and breath.",
      "In a Parisian warehouse, Le Créateur des Lumières swore to never again insult a photon with a pedestrian console.",
      "What follows is the dev log: real git commits, draped in the same fevered canon as DOCS/HISTORY.md (100% factual, lawyers please sit down)."
    ];
  }
  return [
    "MacroVerse began live at Melbourne Fringe: Reductionist on micro-instruments, Aday bending projection time and scale.",
    "macroverse.aday.net.au carries that practice forward as a browser GLSL / ISF engine for VJ sets and installs.",
    "Each entry below is a commit on the main timeline — deploy lanes, shader UI, and Fringe origin pages interleaved."
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
