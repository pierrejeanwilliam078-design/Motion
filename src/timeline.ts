// Source unique de vérité pour le minutage : les animations ET le sound design lisent ces repères.
// Les événements clés sont calés sur la grille de croches de la musique (108 BPM).

export const VIDEO = { width: 1080, height: 1920, fps: 30, duration: 35 } as const;

export const BPM = 108;
export const BEAT = 60 / BPM; // 0,5556 s
export const EIGHTH = BEAT / 2; // 0,2778 s
/** n-ième croche depuis 0. */
export const e = (n: number) => n * EIGHTH;

export const SCENES = [
  { id: 'intro', label: 'Intro', start: 0, end: 4 },
  { id: 'chatgpt', label: 'ChatGPT', start: 4, end: 10 },
  { id: 'gemini', label: 'Gemini', start: 10, end: 16 },
  { id: 'claude-canva', label: 'Claude + Canva', start: 16, end: 24 },
  { id: 'tip', label: 'Tsarovy', start: 24, end: 31 },
  { id: 'brand', label: 'DigitalSub', start: 31, end: 35 },
] as const;

export const CUES = {
  intro: {
    whoosh: 0.1,
    converge: 0.25,
    morphStart: e(3),
    morphEnd: e(6), // chime
    titleIn: e(7),
    subtitleIn: e(9),
    maskStart: e(12), // transition masquée vers ChatGPT
    maskEnd: 4.1,
  },
  chatgpt: {
    logoIn: e(15),
    titleIn: e(16),
    chips: [e(17), e(18), e(19)],
    shift: e(20),
    typingStart: e(23),
    typingEnd: e(27),
    send: e(28),
    dotsEnd: e(31) - 0.05,
    replyTitle: e(31),
    items: [e(32), e(33), e(34)],
    flashPeak: 10,
  },
  gemini: {
    logoIn: 10,
    titleIn: e(37),
    chips: [e(38), e(39)],
    shift: e(41),
    searchIn: e(42),
    typingStart: e(44),
    typingEnd: e(48),
    notify: e(49),
    cards: [e(50), e(51), e(52)],
    out: e(55),
  },
  claude: {
    gather: e(55),
    swipes: [e(55) + 0.05, e(57), e(59) - 0.08],
    logoIn: e(59),
    titleIn: e(60),
    subtitleIn: e(61),
    scanStart: e(63),
    scanEnd: e(66),
    condense: e(66),
    summaryPop: e(67),
    morph: e(70),
  },
  canva: {
    settle: e(73),
    titleIn: e(74),
    subtitleIn: e(75),
    artboardIn: e(76),
    elements: [e(77), e(78), e(79), e(80), e(81), e(82)],
    fadeOut: e(84),
  },
  tip: {
    impact: e(88),
    headingShift: e(92),
    line1In: e(93),
    emphasis1: e(97),
    line2In: e(99),
    check: e(101),
    allOut: e(105),
    conclusionIn: e(106),
    darkIn: e(110),
  },
  brand: {
    logoIn: e(112),
    shine: e(115),
    taglineIn: e(116),
    contactIn: e(119),
    outroChime: e(120),
    fadeOut: 34.2,
  },
  music: {
    dropOut: e(86), // les percussions s'arrêtent avant « TSAROVY! »
    return: e(112),
    fadeOutStart: 33.4,
  },
} as const;

/** Plages de voix off (secondes) : servent au ducking de la musique et à la synthèse vocale facultative. */
export type VoiceCue = { start: number; end: number; text: string };
