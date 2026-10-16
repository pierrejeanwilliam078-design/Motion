import React from 'react';

export const PinIcon: React.FC<{size?: number; color?: string}> = ({size = 36, color = 'white'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
      fill={color}
    />
    <circle cx="12" cy="10" r="2.8" fill="rgba(0,0,0,0.35)" />
  </svg>
);

export const CheckIcon: React.FC<{size?: number; color?: string}> = ({size = 34, color = '#19D3C5'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path d="M7 12.5l3.2 3.2L17 9" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfoIcon: React.FC<{size?: number}> = ({size = 34}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10.5" fill="none" stroke="white" strokeWidth="2" />
    <path d="M12 10.5v6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="12" cy="7.3" r="1.4" fill="white" />
  </svg>
);

export const CameraIcon: React.FC<{size?: number; color?: string}> = ({size = 60, color = 'white'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 7.5h3l1.6-2.3h6.8L17 7.5h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.2" r="3.6" stroke={color} strokeWidth="1.8" />
  </svg>
);

/** Icône de messagerie (bulle + combiné) pour le bouton WhatsApp. */
export const ChatPhoneIcon: React.FC<{size?: number}> = ({size = 72}) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path
      d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.7 4.8 2 6.8L3.6 28.6l6.4-1.7c1.8 1 3.9 1.6 6 1.6 7.2 0 13-5.6 13-12.6S23.2 3 16 3Z"
      fill="white"
    />
    <path
      d="M11.3 9.6c.3 0 .6 0 .8.6.3.7 1 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.6.6c-.2.2-.4.4-.2.8.3.4 1 1.7 2.2 2.7 1.5 1.3 2.7 1.7 3.1 1.9.4.2.6.1.8-.1.2-.3.9-1.1 1.2-1.4.2-.4.5-.3.8-.2.3.1 2 1 2.4 1.1.3.2.6.3.6.4.1.2.1.9-.2 1.8-.3.9-1.8 1.7-2.5 1.8-.6.1-1.4.1-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.1-5.3-6.3-5.6-.2-.2-1.5-2-1.5-3.8s.9-2.7 1.3-3.1c.3-.4.7-.4 1-.4h.6Z"
      fill="#25D366"
    />
  </svg>
);
