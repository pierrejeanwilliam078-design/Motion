/**
 * ============================================================
 *  VERSION 2 — réglages (montage plus rythmé, palette sobre)
 * ============================================================
 *  Les textes viennent de CONTENT (src/config.ts), partagés avec la V1.
 *  Toutes les durées sont en SECONDES sur la timeline de la V2.
 */

export const V2_DURATION = 33;

/** Palette tirée des photos : nuit, sable, lagon + une seule couleur d'accent. */
export const PALETTE = {
  ink: '#0E1A26', // bleu nuit (fond, texte sur sable)
  sand: '#F3E7D3', // sable blanc de la plage
  lagoon: '#5CC8BC', // eau du lagon, utilisée avec parcimonie
  coral: '#EE7B57', // accent unique (prix, urgence)
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

/** Voix off resserrée : pauses courtes entre les phrases. */
export const V2_VOICE = [
  {src: [0.0, 2.45], at: 0.15}, // Votre galerie mérite un nouveau décor !
  {src: [2.85, 7.5], at: 2.75}, // Les 24 et 25 octobre… à Akanin'ny Nofy !
  {src: [7.55, 16.9], at: 7.45}, // Imaginez… des GOOD VIBES !
  {src: [17.0, 24.85], at: 16.85}, // Le week-end à 200 000 ariary… non incluse.
  {src: [24.95, 26.4], at: 24.95}, // Départ de Toamasina !
  {src: [26.4, 29.75], at: 26.55}, // Les places sont très limitées ! Réservez…
] as const;

/**
 * Musique facultative. La V2 est livrée avec la voix seule.
 * Pour ajouter un morceau : le copier dans public/audio/ et indiquer
 * son chemin ici, par ex. 'audio/ma-musique.mp3'. Il baissera
 * automatiquement sous la voix.
 */
export const V2_MUSIC: {file: string | null; volume: number; underVoice: number} = {
  file: null,
  volume: 0.5,
  underVoice: 0.15,
};

export const V2_SCENES = {
  hook: {in: 0, out: 2.85},
  destination: {in: 2.75, out: 7.55},
  experiences: {in: 7.45, out: 16.95},
  price: {in: 16.85, out: 24.3},
  dates: {in: 24.2, out: 26.65},
  cta: {in: 26.55, out: V2_DURATION},
};

export const V2_CUES = {
  hookWords: [0.15, 0.42, 0.8, 1.08, 1.3],
  /** photos qui défilent derrière « NOUVEAU DÉCOR ! » */
  hookFlicks: [1.75, 2.0, 2.25, 2.5],
  destTitle: 2.85,
  destDates: 2.95,
  destBrand: 4.3,
  destNameSaid: 6.05,
  imagine: 7.6,
  plage: 8.67,
  shooting: 9.9,
  sunset: 11.7,
  soiree: 13.5,
  goodVibes: 14.8,
  priceLabel: 16.95,
  priceRoll: 17.45,
  priceLand: 18.75,
  inclusions: [18.95, 19.65, 20.45, 20.85],
  exclusion: 22.25,
  dates: 24.3,
  departure: 25.05,
  urgency: 26.65,
  cta: 27.1,
  whatsapp: 27.45,
  poster: 29.9,
};
