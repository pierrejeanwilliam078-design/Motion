import React from "react";
import { C } from "../theme";

type P = { size: number; color?: string; stroke?: number; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode; fill?: string }> = ({ size, color = C.white, stroke = 2, style, children, fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

export const PlayIcon: React.FC<P> = (p) => (
  <Svg {...p} fill={p.color ?? C.white}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </Svg>
);

export const PauseIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M9 5v14M15 5v14" />
  </Svg>
);

export const CheckIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </Svg>
);

export const XIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const LinkIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </Svg>
);

export const GlobeIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
  </Svg>
);

export const SearchIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const DownloadIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </Svg>
);

/** Fichier vidéo : document + triangle de lecture. */
export const VideoFileIcon: React.FC<P & { play?: number }> = ({ play = 1, ...p }) => (
  <Svg {...p}>
    <path d="M6 2.5h8l5 5v14H6z" />
    <path d="M14 2.5v5h5" />
    <path d="M10.3 11.2v6.6l5.2-3.3z" fill={p.color ?? C.white} opacity={play} />
  </Svg>
);

/** Fichier audio : document + note. */
export const AudioFileIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 2.5h8l5 5v14H6z" />
    <path d="M14 2.5v5h5" />
    <path d="M11 17.5V11l4.5-1.2" />
    <circle cx="9.6" cy="17.6" r="1.6" fill={p.color ?? C.white} />
  </Svg>
);

export const NoteIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M9 18V5.5l11-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);

export const FilmIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" />
  </Svg>
);

export const WifiOffIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M2.5 8.5a14 14 0 0 1 5-2.9M21.5 8.5a14 14 0 0 0-9-3.4" />
    <path d="M5.5 12a9.5 9.5 0 0 1 3.4-2M18.5 12a9.5 9.5 0 0 0-3-1.8" />
    <path d="M8.8 15.3a5 5 0 0 1 6.4 0" />
    <circle cx="12" cy="19" r="0.9" fill={p.color ?? C.white} />
    <path d="M3 3l18 18" />
  </Svg>
);

export const FolderIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
  </Svg>
);

export const UserIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);

export const MegaphoneIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3.5 10v4h3l8 4.5v-13l-8 4.5z" />
    <path d="M6.5 14l1.2 5h2.6l-1-5M18 9.5a3.5 3.5 0 0 1 0 5" />
  </Svg>
);

export const CardIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M6 15h4" />
  </Svg>
);

/** Pictogramme Windows générique (quatre carreaux). */
export const WindowsIcon: React.FC<P> = ({ size, color = C.white, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <g fill={color}>
      <rect x="2.5" y="2.5" width="8.8" height="8.8" rx="1" />
      <rect x="12.7" y="2.5" width="8.8" height="8.8" rx="1" />
      <rect x="2.5" y="12.7" width="8.8" height="8.8" rx="1" />
      <rect x="12.7" y="12.7" width="8.8" height="8.8" rx="1" />
    </g>
  </svg>
);

/** Pictogramme Android générique (tête de robot, comme sur le site). */
export const AndroidIcon: React.FC<P> = ({ size, color = C.white, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <g fill={color}>
      <path d="M3 18a9 9 0 0 1 18 0z" />
      <rect x="6.2" y="6.2" width="1.6" height="4.6" rx="0.8" transform="rotate(-30 7 8.5)" />
      <rect x="16.2" y="6.2" width="1.6" height="4.6" rx="0.8" transform="rotate(30 17 8.5)" />
    </g>
    <circle cx="8.6" cy="14.4" r="1.15" fill={C.bg} />
    <circle cx="15.4" cy="14.4" r="1.15" fill={C.bg} />
  </svg>
);

export const MonitorIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </Svg>
);

export const PhoneIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </Svg>
);
