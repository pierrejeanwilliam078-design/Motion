/**
 * Point unique pour remplacer les captures, le logo et l'audio.
 *
 * Toutes les coordonnées (zones, boutons) sont exprimées en pixels de la
 * capture d'origine (« taille logique » width × height). On peut remplacer
 * un fichier par une version plus nette (ex. capture 2× en 2562 × 1596) :
 * tant que le cadrage est identique, les coordonnées restent valables.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type Capture = {
  /** Chemin relatif au dossier public/ */
  src: string;
  /** Taille logique de la capture (celle de la capture fournie, recadrée). */
  width: number;
  height: number;
  /** Zones floutées (titres de vidéos tierces : accessoires, à ne pas mettre en avant). */
  redact: Rect[];
};

/** Capture 2 — Accueil Windows (recadrée : barre d'onglets du navigateur retirée). */
export const HOME = {
  src: "captures/accueil.png",
  width: 1281,
  height: 798,
  redact: [
    { x: 290, y: 524, w: 362, h: 26 }, // titre du téléchargement récent
    { x: 291, y: 526, w: 74, h: 39 }, // vignette
  ],
  spots: {
    linkBox: { x: 273, y: 166, w: 968, h: 124 },
    input: { x: 294, y: 187, w: 703, h: 48 },
    placeholder: { x: 334, y: 199, w: 90, h: 24 },
    paste: { x: 1007, y: 187, w: 106, h: 48 },
    analyze: { x: 1123, y: 187, w: 97, h: 48 },
    library: { x: 924, y: 468, w: 317, h: 288 },
    libraryVideoRow: { x: 940, y: 588, w: 285, h: 22 },
    libraryAudioRow: { x: 940, y: 617, w: 285, h: 22 },
    header: { x: 273, y: 70, w: 968, h: 80 },
  },
} as const;

/** Capture 5 — Téléchargements (recadrée : onglets et page web en arrière-plan retirés). */
export const DOWNLOADS = {
  src: "captures/telechargements.png",
  width: 1266,
  height: 800,
  redact: [
    { x: 216, y: 160, w: 410, h: 25 }, // titre de la vidéo
    { x: 106, y: 162, w: 99, h: 57 }, // vignette
  ],
  spots: {
    row: { x: 91, y: 145, w: 1135, h: 91 },
    track: { x: 219, y: 190, w: 900, h: 4 },
    percent: { x: 1086, y: 160, w: 36, h: 20 },
    status: { x: 1050, y: 202, w: 72, h: 17 },
    size: { x: 378, y: 202, w: 34, h: 17 },
    rowPause: { x: 1140, y: 177, w: 26, h: 26 },
    pauseAll: { x: 988, y: 86, w: 108, h: 36 },
    resumeAll: { x: 1107, y: 86, w: 119, h: 36 },
    controls: { x: 90, y: 80, w: 1140, h: 160 },
  },
} as const;

/** Capture 1 — Site web media.miarina.org (recadrée : barre du navigateur et barre des tâches retirées). */
export const SITE = {
  src: "captures/site-web.png",
  width: 1581,
  height: 739,
  redact: [] as Rect[],
  spots: {
    hero: { x: 340, y: 50, w: 520, h: 330 },
    windowsBtn: { x: 361, y: 516, w: 379, h: 56 },
    androidBtn: { x: 358, y: 579, w: 352, h: 61 },
    downloads: { x: 340, y: 500, w: 540, h: 200 },
  },
} as const;

/**
 * Capture 4 — Navigateur intégré.
 * NON FOURNIE : la scène 3 affiche alors une illustration simplifiée,
 * signalée comme telle. Pour utiliser la vraie capture :
 *   1. déposer le fichier dans public/captures/navigateur.png ;
 *   2. renseigner width/height et ajuster les zones ci-dessous.
 */
export const BROWSER = {
  src: "captures/navigateur.png",
  width: 1281,
  height: 798,
  redact: [] as Rect[],
  spots: {
    addressBar: { x: 280, y: 60, w: 960, h: 50 },
    shortcuts: { x: 280, y: 160, w: 960, h: 360 },
    /** Raccourcis à mettre en valeur, dans l'ordre d'apparition. */
    tiles: [
      { label: "YouTube", rect: { x: 280, y: 160, w: 220, h: 160 } },
      { label: "Facebook", rect: { x: 1020, y: 340, w: 220, h: 160 } },
    ],
  },
} as const;

/** Logo : null = logo vectoriel intégré (reconstitué d'après l'interface). */
export const LOGO_SRC: string | null = null;

export const AUDIO = {
  voiceover: "audio/voix-off.mp3",
  music: "audio/musique.wav",
  sfxDir: "audio/sfx",
} as const;

/** Volumes de mixage (0–1). */
export const MIX = {
  voice: 1,
  /** Musique quand la voix parle (ducking) et pendant les silences. */
  musicUnderVoice: 0.16,
  musicAlone: 0.42,
  sfx: 0.9,
} as const;
