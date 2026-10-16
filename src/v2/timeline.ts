/**
 * ============================================================
 *  VERSION 2 — réglages (montage plus rythmé, palette sobre)
 * ============================================================
 *  Les textes viennent de CONTENT (src/config.ts), partagés avec la V1.
 *  Toutes les durées sont en SECONDES sur la timeline de la V2.
 */

/**
 * Tempo de la musique (scripts/make_music_v2.py). Les transitions et les
 * débuts de phrases de la voix off sont calés sur les temps de la musique.
 */
export const BPM = 102;
/** Instant (secondes) du n-ième temps de la musique. */
export const beat = (n: number) => (n * 60) / BPM;

/** 58 temps = 34,1 s (dernier accord au temps 56). */
export const V2_DURATION = beat(58);


/** Palette tirée des photos : nuit, sable, lagon + une seule couleur d'accent. */
export const PALETTE = {
  ink: '#0E1A26', // bleu nuit (fond, texte sur sable)
  sand: '#F3E7D3', // sable blanc de la plage
  lagoon: '#5CC8BC', // eau du lagon, utilisée avec parcimonie
  coral: '#EE7B57', // accent unique (prix, urgence)
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

/**
 * Voix off (version traitée pour le mixage : public/audio/voix-off-v2.mp3).
 * src = passage du fichier ; at = placement. Chaque phrase démarre sur un
 * temps de la musique (indiqué en commentaire).
 */
export const V2_VOICE_FILE = 'audio/voix-off-v2.mp3';
export const V2_VOICE = [
  {src: [0.0, 2.45], at: 0.13}, // Votre galerie mérite un nouveau décor !
  {src: [2.85, 7.5], at: beat(5) - 0.18}, // temps 5 : Les 24 et 25 octobre… à Akanin'ny Nofy !
  {src: [7.55, 16.9], at: beat(13) - 0.21}, // temps 13 : Imaginez… des GOOD VIBES !
  {src: [17.0, 24.85], at: beat(29) - 0.09}, // temps 29 : Le week-end à 200 000 ariary… non incluse.
  {src: [24.95, 26.4], at: beat(43) - 0.12}, // temps 43 : Départ de Toamasina !
  {src: [26.4, 29.75], at: beat(46) - 0.12}, // temps 46 (drop) : Les places sont très limitées ! Réservez…
] as const;

/**
 * Musique : tropical house acoustique composée pour ce montage
 * (scripts/make_music_v2.py). Elle baisse automatiquement sous la voix.
 * Pour une autre musique, remplacer le chemin (ou null pour la voix seule).
 */
export const V2_MUSIC: {file: string | null; volume: number; underVoice: number} = {
  file: 'audio/musique-v2.mp3',
  volume: 0.8,
  underVoice: 0.3,
};

export const V2_SCENES = {
  hook: {in: 0, out: beat(5) + 0.1},
  destination: {in: beat(5) - 0.2, out: beat(13) + 0.06},
  experiences: {in: beat(13) - 0.01, out: beat(29) + 0.1},
  price: {in: beat(29) - 0.2, out: beat(41.5) + 0.05},
  dates: {in: beat(41.5) - 0.26, out: beat(46) + 0.05},
  cta: {in: beat(46) - 0.15, out: V2_DURATION},
};

/** Repères visuels, calés sur les temps de la musique et sur la voix. */
export const V2_CUES = {
  hookWords: [0.15, 0.42, 0.8, 1.08, 1.3],
  /** photos qui défilent derrière « NOUVEAU DÉCOR ! » (sur les demi-temps) */
  hookFlicks: [beat(3), beat(3.5), beat(4), beat(4.5)],
  destTitle: beat(5),
  destDates: beat(5) + 0.02,
  destBrand: 4.31,
  destNameSaid: 6.06,
  imagine: beat(13),
  plage: beat(14.5),
  shooting: beat(17), // retour de la batterie
  sunset: beat(20),
  soiree: beat(23),
  goodVibes: beat(25),
  priceLabel: beat(29),
  priceRoll: beat(30),
  priceLand: beat(32), // impact musical
  inclusions: [beat(32.5), beat(33.5), beat(35), beat(35.5)],
  exclusion: beat(38),
  dates: beat(41.5),
  departure: beat(43),
  urgency: beat(46), // drop
  cta: beat(48),
  whatsapp: beat(49),
  poster: beat(52),
};
