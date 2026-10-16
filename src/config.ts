/**
 * ============================================================
 *  FICHIER DE RÉGLAGES — tout ce qui est modifiable est ici.
 * ============================================================
 *  - CONTENT  : tous les textes affichés (éditables aussi via --props).
 *  - SCENES   : début / fin de chaque scène (en secondes).
 *  - VOICE    : découpage et placement de la voix off.
 *  - SFX      : effets sonores (déclics, whoosh, impacts…).
 *  - PHOTOS   : photos de l'affiche et légendes des Polaroid.
 *  Toutes les durées sont en SECONDES sur la timeline finale (0 → 35 s).
 */

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 35;

export const CONTENT = {
  hook: ['VOTRE GALERIE', 'MÉRITE UN', 'NOUVEAU', 'DÉCOR !'],
  location: 'MADAGASCAR',
  destination: ['AKANIN’NY', 'NOFY'],
  brand: 'LES ESCAPADES DE NANILINA',
  imagine: 'Imaginez…',
  experiences: ['SHOOTING PHOTO', 'SUNSET', 'GOOD VIBES'],
  priceLabel: 'LE WEEK-END',
  price: '200 000',
  currency: 'Ar',
  inclusions: ['TRANSPORT', 'HÉBERGEMENT', 'REPAS', 'PROGRAMME INCLUS'],
  exclusion: 'Entrée Palmarium non incluse',
  day1: '24',
  day2: '25',
  month: 'OCTOBRE',
  monthShort: 'OCT',
  departure: 'DÉPART DE TOAMASINA',
  routeFrom: 'Toamasina',
  routeTo: 'Akanin’ny Nofy',
  urgency: 'PLACES TRÈS LIMITÉES',
  cta: ['RÉSERVEZ', 'MAINTENANT'],
  whatsappLabel: 'WHATSAPP',
  whatsapp: '+261 34 74 004 61',
  /**
   * Affiche originale (facultatif). Déposer le fichier dans public/
   * (ex. public/affiche.jpg) et indiquer 'affiche.jpg' ici : le plan final
   * affichera alors l'affiche originale au lieu de la recomposition.
   */
  affiche: null as string | null,
};

export type AdContent = typeof CONTENT;

/** Photos originales (aucune photo inventée, aucune déformation). */
export const PHOTOS = {
  plage: {src: 'photos/plage-transats.jpg', caption: 'Détente', ratio: 2000 / 1335},
  shooting: {src: 'photos/bateau-pangalanes.jpg', caption: 'Shooting photo', ratio: 2000 / 1335},
  nature: {src: 'photos/lemurien.jpg', caption: 'Nature', ratio: 1335 / 2000},
  soiree: {src: 'photos/soiree.jpg', caption: 'Soirée', ratio: 2000 / 1335},
};

export const DRONE = 'video/drone-akanin-ny-nofy.mp4';

/** Fenêtres des scènes (in/out incluent le chevauchement des transitions). */
export const SCENES = {
  hook: {in: 0, out: 4.15},
  destination: {in: 3.85, out: 8.95},
  experiences: {in: 8.55, out: 18.3},
  price: {in: 17.85, out: 26.25},
  dates: {in: 25.75, out: 29.25},
  cta: {in: 28.85, out: DURATION},
};

/** Repères synchronisés sur la voix off (secondes, timeline finale). */
export const CUES = {
  hookWords: [0.35, 0.62, 1.0, 1.28, 1.5, 1.95],
  destTitle: 4.15,
  destDates: 4.2,
  destBrand: 5.55,
  destNameSaid: 7.3,
  imagine: 8.9,
  polaroids: [9.9, 11.15, 12.95, 14.75],
  words: [11.15, 12.95, 16.05],
  priceLabel: 18.25,
  priceRoll: 18.9,
  priceLand: 20.05,
  inclusions: [20.25, 20.95, 21.75, 22.15],
  exclusion: 23.55,
  calendar: [26.0, 26.2],
  departure: 26.3,
  urgency: 29.1,
  cta: 29.65,
  whatsapp: 30.05,
  poster: 32.3,
};

/**
 * Voix off : on découpe le fichier original en phrases (src = [début, fin]
 * dans le fichier) et on place chaque phrase sur la timeline (at).
 * Cela permet d'ajuster les pauses sans modifier la voix.
 */
export const VOICE_FILE = 'audio/voix-off.mp3';
export const VOICE = [
  {src: [0.0, 2.45], at: 0.35}, // Votre galerie mérite un nouveau décor !
  {src: [2.85, 7.5], at: 4.0}, // Les 24 et 25 octobre… à Akanin'ny Nofy !
  {src: [7.55, 16.9], at: 8.7}, // Imaginez… des GOOD VIBES !
  {src: [17.0, 24.95], at: 18.15}, // Le week-end à 200 000 ariary… non incluse.
  {src: [24.95, 26.4], at: 26.15}, // Départ de Toamasina !
  {src: [26.4, 29.75], at: 29.05}, // Les places sont très limitées ! Réservez…
] as const;

export const MUSIC_FILE = 'audio/musique-tropical-house.mp3';
/** Volume musique : sans voix / sous la voix (ducking automatique). */
export const MUSIC_VOLUME = {free: 0.6, underVoice: 0.2, outro: 0.75};

export const SFX = [
  {file: 'vagues', at: 0, volume: 0.35},
  {file: 'declic-photo', at: 0.08, volume: 0.6},
  {file: 'whoosh', at: 3.7, volume: 0.45},
  {file: 'scintillement', at: 4.3, volume: 0.25},
  {file: 'scintillement', at: 7.3, volume: 0.2},
  {file: 'declic-photo', at: 8.6, volume: 0.6},
  {file: 'pop', at: 9.95, volume: 0.3},
  {file: 'declic-photo', at: 11.15, volume: 0.55},
  {file: 'pop', at: 13.0, volume: 0.3},
  {file: 'pop', at: 14.8, volume: 0.3},
  {file: 'scintillement', at: 16.05, volume: 0.3},
  {file: 'whoosh', at: 17.8, volume: 0.5},
  {file: 'impact', at: 20.0, volume: 0.55},
  {file: 'pop', at: 20.25, volume: 0.15},
  {file: 'pop', at: 20.95, volume: 0.15},
  {file: 'pop', at: 21.75, volume: 0.15},
  {file: 'pop', at: 22.15, volume: 0.15},
  {file: 'whoosh', at: 25.7, volume: 0.45},
  {file: 'pop', at: 26.05, volume: 0.25},
  {file: 'pop', at: 26.25, volume: 0.25},
  {file: 'impact', at: 28.98, volume: 0.6},
  {file: 'pop', at: 30.1, volume: 0.3},
  {file: 'whoosh', at: 32.1, volume: 0.35},
  {file: 'declic-photo', at: 32.3, volume: 0.55},
  {file: 'scintillement', at: 32.5, volume: 0.25},
];

export const COLORS = {
  turquoise: '#19D3C5',
  ocean: '#0B6FD1',
  deep: '#06244A',
  violet: '#7B2FF7',
  sunset: '#FF7A35',
  coral: '#FF4E6A',
  gold: '#FFC94A',
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

export const GRADIENTS = {
  brand: `linear-gradient(95deg, ${COLORS.turquoise} 0%, #3AA0FF 35%, ${COLORS.violet} 65%, ${COLORS.sunset} 100%)`,
  sunset: `linear-gradient(95deg, ${COLORS.gold} 0%, ${COLORS.sunset} 40%, ${COLORS.coral} 70%, ${COLORS.violet} 100%)`,
  ocean: `linear-gradient(95deg, #7DF9EA 0%, ${COLORS.turquoise} 40%, #3AA0FF 100%)`,
  vibes: `linear-gradient(95deg, ${COLORS.gold} 0%, ${COLORS.sunset} 45%, ${COLORS.turquoise} 100%)`,
};
