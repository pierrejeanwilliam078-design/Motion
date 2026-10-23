import type React from 'react';
// Identité DigitalSub : couleurs relevées sur le logo fourni (cyan → bleu électrique → violet → magenta).
export const COLORS = {
  paper: '#F5F7FF',
  paperDeep: '#E9EEFF',
  ink: '#0A0F2C',
  inkSoft: '#4B5378',
  line: 'rgba(10, 15, 44, 0.08)',
  cyan: '#00D9F5',
  blue: '#1F5BFF',
  electric: '#0B3BFF',
  violet: '#6B1CF0',
  magenta: '#D21CF0',
  navy: '#050A1F',
  white: '#FFFFFF',
  skeleton: '#E4E9F6',
  whatsapp: '#25D366',
  claude: '#D97757',
} as const;

export const GRADIENTS = {
  brand: `linear-gradient(120deg, ${COLORS.cyan} 0%, ${COLORS.blue} 45%, ${COLORS.violet} 100%)`,
  brandWarm: `linear-gradient(120deg, ${COLORS.blue} 0%, ${COLORS.violet} 60%, ${COLORS.magenta} 100%)`,
  gemini: 'linear-gradient(135deg, #3B82F6 0%, #6D5BFF 45%, #B57CF6 75%, #E57B9B 100%)',
  canva: 'linear-gradient(135deg, #00C4CC 0%, #3B5BFF 55%, #7D2AE8 100%)',
};

export const FONT = "'Inter Variable', 'Inter', 'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

/** Style « texte en dégradé ». */
export const gradientText = (gradient: string = GRADIENTS.brand): React.CSSProperties => ({
  backgroundImage: gradient,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
});
