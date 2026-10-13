import React from "react";

/** Minimal line icons drawn with an animated stroke (draw: 0..1). */
type IconProps = { size?: number; color?: string; draw?: number; stroke?: number; style?: React.CSSProperties };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 64, color = "currentColor", stroke = 2, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const dash = (draw = 1) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw });

export const LightningIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" {...dash(p.draw)} />
  </Svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.6 7.5 10 4.3-1.4 7.5-5.4 7.5-10v-6L12 2.5Z" {...dash(p.draw)} />
    <path d="m8.6 12.2 2.4 2.4 4.6-4.8" {...dash(Math.max(0, ((p.draw ?? 1) - 0.5) * 2))} />
  </Svg>
);

export const HeadsetIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" {...dash(p.draw)} />
    <path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5Z" {...dash(p.draw)} />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...dash(p.draw)} transform="rotate(-90 12 12)" />
    <path d="m7.5 12.3 3 3 6-6.3" {...dash(Math.max(0, ((p.draw ?? 1) - 0.45) / 0.55))} />
  </Svg>
);

export const ChatIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M20.5 11.6a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.6Z" {...dash(p.draw)} />
    <path d="M9 9.5c0 2.8 2.7 5.5 5.5 5.5" {...dash(p.draw)} />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" {...dash(p.draw)} />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" {...dash(p.draw)} />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.8.8 3 2.9 3 5.6" {...dash(p.draw)} />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const SlidersIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Svg>
);

export const GridIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
  </Svg>
);

export const CartIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="18" cy="20" r="1.3" />
    <path d="M2.5 3h2.6l2.4 11.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7H6" />
  </Svg>
);
