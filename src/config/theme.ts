/**
 * Système graphique GSN 2.0.
 * Les couleurs « brand » sont échantillonnées sur le logo officiel fourni
 * (public/brand/gsn-logo-original.png) ; la palette de travail du brief
 * est conservée pour les fonds et les accents lumineux.
 */
export const COLORS = {
  // palette de travail (brief)
  night: '#061B3A',
  cyan: '#05C8F7',
  white: '#F6FAFF',
  orange: '#FF9B24',
  // charte officielle (logo)
  navy: '#02426E',
  brandCyan: '#0F9EDA',
  amber: '#F9AE2F',
  flame: '#F0592E',
  // dérivés
  nightDeep: '#030F24',
  navyMid: '#0A2E57',
  ink: '#04203F',
  mist: 'rgba(246,250,255,0.62)',
} as const;

export const FONTS = {
  display: '"Space Grotesk", "Inter", sans-serif',
  body: '"Inter", "Helvetica Neue", Arial, sans-serif',
} as const;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 25,
  durationInFrames: 1000,
} as const;

/** Zone de sécurité titres : 6,25 % horizontal, 8,3 % vertical */
export const SAFE = {
  x: 120,
  y: 90,
  right: 1920 - 120,
  bottom: 1080 - 90,
} as const;

/** Dégradé signature (queue du swoosh orange du logo) */
export const GRAD_FLAME = `linear-gradient(90deg, ${COLORS.amber} 0%, ${COLORS.orange} 45%, ${COLORS.flame} 100%)`;
export const GRAD_CYAN = `linear-gradient(90deg, ${COLORS.brandCyan} 0%, ${COLORS.cyan} 100%)`;
