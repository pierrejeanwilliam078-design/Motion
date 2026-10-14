# TIAVOYAGES — Publicité motion design premium 9:16

This is an editable Remotion project (React + TypeScript). It turns the original
`tiavoyages-dubai-9x16.mp4` into a 30-second premium motion-design ad. The
original voice-over and music are kept untouched.

| | |
|---|---|
| Format | 1080 × 1920 (9:16), 30 fps, 900 frames = 30.0 s |
| Video | H.264 (yuv420p, CRF 16) |
| Audio | the original AAC stream, **copied bit for bit** (no re-encode) |
| Final file | `deliverables/TIAVOYAGES_PREMIUM_MOTION_9x16.mp4` |

## Two versions

| Composition | Concept | File |
|---|---|---|
| `TiavoyagesPremium` (V1) | Premium edit of the original footage | `deliverables/TIAVOYAGES_PREMIUM_MOTION_9x16.mp4` |
| `TiavoyagesV2` (V2) | **Completely new** 100 % vector motion design on the original voice-over — no original footage | `deliverables/TIAVOYAGES_V2_MOTION_9x16.mp4` |

### V2 — new motion design (`src/v2/`)

| Scene | Time | Content |
|---|---|---|
| 01 | 00:00–00:04 | Yellow pin drops on royal blue → pin portal opens onto a vector Dubai (skyline growing from the ground, sun, sea, palms). Emirati mascot pops up. Kinetic type « DUBAÏ, oui… » → « mais à VOTRE FAÇON ! » |
| 02 | 00:04–00:09 | Royal-blue dot-grid world. « Réserver mon voyage ». The Vols / Visa / Hébergement / Dates tiles fly in, one per voice-over phrase, each with a check |
| 03 | 00:09–00:14 | Sky with parallax clouds, airliner and contrail, a « CARTE D’EMBARQUEMENT » (VOUS → DXB Dubaï), a « VISA ✓ » stamp, and the mascot walking in with its passport |
| 04 | 00:14–00:19.2 | Flat city road: a premium black sedan drives in (spinning wheels, settle, paint sheen). « Transfert privé » |
| 05 | 00:19.2–00:25.2 | Three illustrated postcards flip in (Découverte / Excursions / Liberté) and fan out. The mascot walks |
| 06 | 00:25.2–00:30 | Royal blue with drifting pins. « DUBAÏ À VOTRE FAÇON. » A white card holds the original logo (the pin drops in, then a light glint) and « Votre voyage, sur mesure. » The mascot gives a thumbs-up |

V2 transitions:

- 0:04 — pin portal
- 0:09 — stacked colour panels
- 0:14 — cloud pass
- 0:19.2 — speed panels
- 0:25.2 — pin portal

The mascot is a 2.5D puppet built from cut-outs of the supplied artwork (`public/v2/`). It has a spring entrance, breathing, sway, a walk bob and **real eyelid blinks** drawn over its eyes (`src/v2/MascotPuppet.tsx`). Every graphic is drawn in code (`src/v2/Illustrations.tsx`). The audio is the original soundtrack, re-muxed bit for bit.

Render V2: `npm run render:v2`

## V1 timeline

| Scene | Time | Shot | Added motion design |
|---|---|---|---|
| 01 Welcome | 00:00–00:04 | Mascot in kandura / ghutra / agal | Light-line aperture opening, crane-down from the Burj Khalifa, giant "DUBAÏ" title placed **behind** the mascot, yellow accent on « à votre façon » |
| 02 Booking | 00:04–00:09 | Mascot in TIAVOYAGES outfit + **the only smartphone** | Phone screen planar-tracked. Animated flat icons: plane glides, Visa pops, hotel windows light up, calendar check. Also card landing rings, "Dubaï" chip with the official pin, CTA "Confirmer mon voyage" with tap ripple |
| 03 Airport | 00:09–00:14 | Airport, no phone | Forward dolly, flight path + airplane **behind** the mascot, pin drop, halo behind the passport, check badge on the boarding pass, light on the glass |
| 04 VIP transfer | 00:14–00:19.2 | Black car, no phone | Lateral camera, rack focus, specular sweeps on the paint (behind the mascot), blue motion lines |
| 05 Discover Dubai | 00:19.2–00:25.2 | Promenade, no phone | Tracking camera, depth separation, water shimmer, pictograms Découverte / Excursions / Liberté |
| 06 Brand reveal | 00:25.2–00:30 | End-card mascot (cut out) | Iris onto a white / royal-blue background, hero pose, **original** logo assembled piece by piece (the pin drops in), "DUBAÏ À VOTRE FAÇON." and "Votre voyage, sur mesure." |

Transitions use one brand language: navy / royal-blue / white bands. Each cut
has its own direction and accent:

- route + airplane
- vertical whip
- diagonal "take-off" with airplane
- wipe following the car
- iris for the final shot

## Synchronisation with the original soundtrack

- The output timeline is locked **1:1** to the original video. Inside each
  scene, source frame = output frame, so the picture stays in sync with the
  voice. Only around the cuts does the source time slow down (speed ramp) and
  hold, so the original cross-fades never appear (`src/timeline.ts`,
  `mapSourceFrame`).
- The cues (`CUES` in `src/timeline.ts`) come from the voice-band energy
  envelope of the original soundtrack, at 100 ms resolution.
- The phone animations are timed on the original video's own card reveals
  (measured frame by frame).

## Lip sync — limitation

The mascot's mouth is **not** re-animated. Real phoneme-based lip sync would
need an external audio-driven model, and none is available here. Fake "mouth
scaling" was deliberately not added. The mascot's movements are those of the
original shots (walking, gestures, expressions). The project adds camera,
depth and motion-design work around it. To add real lip sync, run the 6 shots
through an external tool. Then replace `public/original/tiavoyages-dubai-9x16.mp4`
(same timing) and regenerate the matte (see "Prepared assets").

## Project structure

```
src/
  timeline.ts                 cut points, scene durations, voice cues, source-time mapping
  MainComposition.tsx         assembly: 6 shots + transitions + original audio
  scenes/Scene01Welcome.tsx … Scene06BrandReveal.tsx
  components/
    SceneStage.tsx            camera + layers (plate → behind → mascot → front → HUD)
    SmartphoneInterface.tsx   flat-2D UI projected onto the tracked screen (matrix3d)
    MotionGraphics.tsx        airplane, route, light sweeps, ripples, sparkles, pictograms…
    Transitions.tsx           brand wipes + iris
    BrandTypography.tsx       palette, Montserrat font, text animations
    OriginalAudio.tsx         original soundtrack (untouched)
  motion/presets.ts           easings (cubic-bezier), springs, helpers
  data/phoneScreenTrack.json  per-frame homographies of the phone screen
  data/passportTrack.json     per-frame passport position (scene 3)
public/
  original/tiavoyages-dubai-9x16.mp4   source video (unchanged)
  original/mascot-matte.webm           mascot cut-out (VP9 + alpha), frame-aligned with the original
  audio/original-soundtrack.m4a        original AAC stream (stream copy)
  brand/                               official wordmark extracted from the supplied end card (+ TIAV / pin / YAGES pieces)
  fonts/                               Montserrat (SIL OFL)
scripts/
  render.sh                   final render + re-mux of the original audio
  stills.mjs                  renders preview stills
```

## Commands

```bash
npm install
npm run dev          # Remotion Studio: interactive preview at http://localhost:3000
npm run render       # → deliverables/TIAVOYAGES_PREMIUM_MOTION_9x16.mp4
npm run typecheck
```

Without network access, point Remotion to a local Chromium:

```bash
REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell npm run render
```

Preview stills: `node scripts/stills.mjs out/stills 40 200 330 830`

## Prepared assets (how they were produced)

- **Mascot matte**: `rembg` (`isnet-general-use` model) run on all 900 frames.
  The alpha is then remapped (threshold 0.55–0.95, 1 px erosion, 0.8 px blur)
  and encoded as VP9 with alpha. It is used only to place graphics *behind*
  the character and to cut out the scene-6 mascot.
- **Phone tracking**: SIFT + RANSAC homography against a reference frame,
  smoothed over time. The screen corners were fitted on the bezel (average
  residual < 0.3 px).
- **Logo**: the official wordmark cut out of the original end card. Alpha was
  computed against the local background, then the image was split into
  TIAV / pin / YAGES. No logo was redrawn.
