---
version: alpha
name: DigitalSubMG — Premium Access (video / frame layer)
description: >
  Dark premium-tech system for DigitalSubMG. Deep black ground, midnight-blue depth, colour only
  in light: the logo's cyan → electric blue → violet → magenta ribbon, soft glows, frosted-glass UI
  cards. Inter (shipped locally) in heavy display weights + quiet grey body. Apple-like restraint:
  one accent per scene, the full gradient reserved for the ribbon and the logo.
unit: the frame — 1080×1920 portrait (9:16) primary
principle: dark ground · colour is light · one accent per scene · max 7 words on screen

colors:
  bg: "#05060A"
  night: "#071233"
  brand-blue: "#01328E"
  cyan: "#00F0FF"
  electric: "#005EFE"
  violet: "#5A00FE"
  magenta: "#E600FF"
  text: "#F5F7FA"
  text-muted: "#9AA3B2"
  success: "#25D366"
  glass-fill: "rgba(255,255,255,0.06)"
  glass-border: "rgba(255,255,255,0.12)"

radii:
  card: "28px"
  card-sm: "20px"
  pill: "999px"
  icon-tile: "18px"

typography:
  display:   { fontFamily: "Inter", px: 128, weight: 900, lineHeight: 0.95, tracking: "-0.035em", color: "text" }
  h1:        { fontFamily: "Inter", px: 104, weight: 800, lineHeight: 0.98, tracking: "-0.03em", color: "text" }
  h2:        { fontFamily: "Inter", px: 72, weight: 800, lineHeight: 1.02, tracking: "-0.025em", color: "text" }
  card-title:{ fontFamily: "Inter", px: 44, weight: 700, lineHeight: 1.1, tracking: "-0.015em", color: "text" }
  body:      { fontFamily: "Inter", px: 34, weight: 500, lineHeight: 1.35, color: "text-muted" }
  label:     { fontFamily: "Inter", px: 24, weight: 700, tracking: "0.14em", upper: true, color: "text-muted" }
  stat:      { fontFamily: "Inter", px: 260, weight: 900, lineHeight: 0.9, tracking: "-0.05em", color: "text", tabular: true }

fonts:
  - { family: "Inter", weight: 400, src: "assets/fonts/inter-latin-400-normal.woff2" }
  - { family: "Inter", weight: 500, src: "assets/fonts/inter-latin-500-normal.woff2" }
  - { family: "Inter", weight: 600, src: "assets/fonts/inter-latin-600-normal.woff2" }
  - { family: "Inter", weight: 700, src: "assets/fonts/inter-latin-700-normal.woff2" }
  - { family: "Inter", weight: 800, src: "assets/fonts/inter-latin-800-normal.woff2" }
  - { family: "Inter", weight: 900, src: "assets/fonts/inter-latin-900-normal.woff2" }

spacing:
  safe-top: "220px"
  safe-bottom-limit: "1500px (key text) · 1600px (any content)"
  pad-x: "80px"
  gap-cards: "28px"

components:
  glass-card:
    backgroundColor: "{colors.glass-fill}"
    border: "1px solid {colors.glass-border}"
    rounded: "{radii.card}"
    effect: "backdrop blur 24px, very soft drop shadow 0 30px 80px rgba(0,0,0,0.45)"
    description: "Universal surface for product cards, benefit cards, order card, payment capsules."
  glow:
    description: "Radial gradient blob of cyan / violet at 20–35% opacity, 300–700px, behind the hero. Never neon."
  ribbon:
    description: "The logo's gradient light stroke (cyan → electric → violet → magenta). Transition device between scenes."
  accent-word:
    description: "One word per headline filled with linear-gradient(90deg, cyan, violet) via background-clip:text."
  pill-badge:
    backgroundColor: "rgba(255,255,255,0.04)"
    border: "1px solid {colors.glass-border}"
    rounded: "{radii.pill}"
    typography: "{typography.label} in text colour, green dot before"
  cta-button:
    backgroundColor: "{colors.text}"
    textColor: "#05060A"
    rounded: "24px"
    typography: "Inter 800, 44px"
    description: "The one solid white element — as on the site hero."
  icon-tile:
    backgroundColor: "rgba(255,255,255,0.07)"
    rounded: "{radii.icon-tile}"
    description: "88px rounded square holding a 2px line icon (SVG stroke, text colour)."
  shimmer:
    description: "Diagonal 20° light band, 15% of object width, 25% opacity, passes across a card on entry."
  grain:
    description: "2–3% film grain over everything, to keep dark gradients from banding."
---

# DigitalSubMG — Premium Access (frame layer)

## Overview

A **dark, premium tech** system: the website's black hero, made cinematic. The ground is near-black
(`#05060A`) with midnight-blue (`#071233`) radial depth. Colour exists only as **light**: the
gradient ribbon from the logo, soft glows, a cyan accent word. Surfaces are **frosted glass**
(6% white, 12% white hairline, 28px radius). Typography is **Inter** in heavy display weights
(800–900, tight tracking) for headlines and quiet grey Inter 500 for support lines.

## Frame Craft Bar

- **Squint** — one white headline or one giant numeral dominates; everything else is quiet grey or glass.
- **Silence** — at most 7 words visible at once; one accent colour per scene.
- **Restraint** — the full cyan→magenta gradient is reserved for the ribbon and the logo; no neon, no glitch, no white flash.
- **Reference** — a premium SaaS / Apple product-launch spot. Failure looks like a busy, multi-colour flyer.

## The Frame

- Portrait 1080×1920. Key text lives between y 220 and y 1500; nothing below y 1600.
- Hero anchored high (y ≈ 380–760); supporting elements flow down with rhythm.
- Brand mark watermark (small symbol, 30% opacity) may sit top-centre in content scenes.
