// VERSION 2 — plus dynamique : 114 BPM, événements calés sur les croches (e) et doubles croches (s).
// Même découpage des scènes que la V1 (storyboard 0-4-10-16-24-31-35 s).

export const BPM2 = 114;
export const BEAT2 = 60 / BPM2; // 0,5263 s
export const EIGHTH2 = BEAT2 / 2; // 0,2632 s
export const SIXTEENTH2 = BEAT2 / 4;
/** n-ième croche. */
export const e = (n: number) => n * EIGHTH2;

export const CUES2 = {
  intro: {
    grid: 0,
    circle: e(3),
    morphStart: e(4),
    morphEnd: e(5), // impact
    words: [e(6), e(7), e(8)],
    subtitleIn: e(10),
    zoomStart: e(13),
    zoomEnd: e(15), // flash → ChatGPT
  },
  chatgpt: {
    logoIn: e(16),
    titleIn: e(17),
    chips: [e(18), e(19), e(20)],
    shift: e(21),
    typingStart: e(23),
    typingEnd: e(26),
    send: e(27),
    replyTitle: e(29),
    items: [e(30), e(31), e(32)],
    whipStart: e(36),
    whipMid: e(38), // 10,0 s
  },
  gemini: {
    logoIn: e(38),
    titleIn: e(39),
    chips: [e(40), e(41)],
    shift: e(42),
    searchIn: e(43),
    typingStart: e(44),
    typingEnd: e(48),
    notify: e(49),
    cards: [e(50), e(51), e(52)],
    wipeStart: e(58),
    wipeSwitch: e(58) + 0.44,
  },
  claude: {
    papers: [e(61), e(61.5), e(62), e(62.5), e(63)],
    logoIn: e(62),
    titleIn: e(63),
    subtitleIn: e(64),
    scanStart: e(66),
    scanEnd: e(69),
    condense: e(69),
    summaryPop: e(70),
    flipStart: e(73),
    flipEnd: e(75),
  },
  canva: {
    settle: e(75),
    titleIn: e(76),
    subtitleIn: e(77),
    artboardIn: e(78),
    elements: [e(79), e(80), e(81), e(82), e(83), e(84)],
    variations: [e(86), e(87), e(88)],
    glitchStart: e(90),
    cut: e(91), // ≈ 23,95 s
  },
  tip: {
    panelIn: e(91),
    impact: e(92),
    split: e(96),
    line1In: e(97),
    box1: e(103),
    line2In: e(104),
    check: e(108),
    allOut: e(110),
    conclusionIn: e(111),
    box2: e(115),
    iris: e(117),
  },
  brand: {
    logoIn: e(118),
    shine: e(121),
    taglineIn: e(122),
    contactIn: e(125),
    outroChime: e(126),
    fadeOut: 34.2,
  },
} as const;

/** Sections musicales : où le groove complet joue (sert aussi aux « pulsations » de la caméra). */
export const GROOVE2 = {
  introBeat: [CUES2.intro.words[0], CUES2.intro.zoomEnd] as const,
  full: [CUES2.chatgpt.logoIn, CUES2.canva.cut] as const,
  dip: [CUES2.canva.cut, CUES2.tip.split] as const,
  half: [CUES2.tip.split, CUES2.tip.iris] as const,
  outro: [CUES2.brand.logoIn, 33.4] as const,
};

/** Impacts qui secouent la caméra : [temps, amplitude en px]. */
export const IMPACTS2: [number, number][] = [
  [CUES2.intro.morphEnd, 18],
  [CUES2.intro.zoomEnd, 10],
  [CUES2.chatgpt.logoIn, 14],
  [CUES2.gemini.logoIn, 12],
  [CUES2.claude.logoIn, 10],
  [CUES2.claude.flipEnd, 10],
  [CUES2.tip.impact, 26],
  [CUES2.tip.check, 10],
  [CUES2.brand.logoIn, 16],
];
