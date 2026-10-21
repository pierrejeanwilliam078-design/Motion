"""Video 25 — version II: flat, light, graphic 2D motion design (no 3D).

The speaker lives in a morphing window (full frame, card, circle, badge) on a light canvas;
colour blocks wipe in for the key moments. Same voice, same word timings as version I.
"""
from cues25 import PAUSES  # noqa: F401  (shared measured pauses)

CARD_AT = 48.05   # outro (navy block)
LOGO_HIT = 48.35

# music: bright, bouncy, F major marimba at 120 BPM; pulse breaks before « plus de clarté »
BPM = 120
CHORDS = {"F": ([53, 57, 60, 64, 67], 41), "Dm": ([50, 53, 57, 60, 64], 38),
          "Bb": ([50, 53, 58, 62, 65], 46), "C": ([52, 55, 60, 62, 67], 48)}
CYCLE = ["F", "Dm", "Bb", "C"]
PLUCK = "marimba"
PAD_GAIN = 0.022
BREAKS = [(30.0, 32.45)]
CLAP = True

# window layouts: (start, duration, name)
LAYOUT = [(0.00, 0.0, "full"), (0.30, 0.42, "top"), (2.67, 0.55, "circle"), (9.29, 0.5, "top"),
          (13.25, 0.55, "center"), (16.34, 0.6, "badge"), (28.80, 0.5, "top"), (30.64, 0.45, "corner"),
          (34.43, 0.5, "top"), (39.89, 0.45, "half"), (44.69, 0.5, "circle"), (47.80, 0.45, "gone")]

# canvas colour blocks: (start, colour) — each new colour wipes up from the bottom
CANVAS = [(0.0, "paper"), (13.25, "violet"), (16.34, "paper"), (30.64, "cyan"), (34.43, "paper"), (47.80, "navy")]

PILLS = [("Canva Pro", 4.34), ("ChatGPT", 5.34), ("Netflix", 6.20), ("Spotify", 7.08), ("un autre service", 7.94)]
STEPS = [17.32, 19.45, 22.35, 25.31]
TOGGLE_AT = 27.06
CLICK_AT = 46.95

# (time, kind, gain, pan)
SFX = [
    (0.28, "whoosh_s", 0.05, 0.0), (0.90, "pop", 0.05, -0.2), (1.30, "snap", 0.05, 0.2),
    (1.96, "swipe", 0.05, 0.3),
    (2.67, "whoosh_s", 0.05, 0.0),
    *[(t - 0.02, "pop", 0.06, -0.4 + 0.2 * i) for i, (_, t) in enumerate(PILLS)],
    (9.29, "whoosh_s", 0.05, 0.0),
    (9.90, "pen", 0.04, -0.2), (10.22, "tick", 0.05, -0.3), (11.10, "tick", 0.05, 0.0), (11.74, "tick", 0.05, 0.3),
    (12.64, "snap", 0.05, 0.3),
    (13.25, "whoosh_up", 0.07, 0.0), (14.94, "impact", 0.14, 0.0), (15.10, "swish", 0.05, 0.2),
    (16.34, "whoosh_up", 0.06, 0.0), (16.70, "pen", 0.035, -0.3),
    *[(t - 0.02, "pop", 0.06, -0.2 + 0.15 * i) for i, t in enumerate(STEPS)],
    (TOGGLE_AT, "click", 0.07, 0.3), (TOGGLE_AT + 0.02, "snap", 0.04, 0.3),
    (28.80, "whoosh_s", 0.05, 0.0), (30.26, "swipe", 0.06, -0.2),
    (30.62, "whoosh_up", 0.07, 0.0), (30.94, "pen", 0.06, 0.0), (31.70, "pen", 0.05, 0.2),
    (32.10, "riser", 0.05, 0.0), (32.45, "snap", 0.08, 0.0), (32.47, "impact", 0.14, 0.0), (32.82, "swish", 0.05, 0.0),
    (34.43, "whoosh_s", 0.05, 0.0),
    (34.90, "tick", 0.05, -0.2), (35.76, "tick", 0.05, 0.2), (36.64, "tick", 0.05, -0.2), (38.92, "tick", 0.05, 0.2),
    (39.89, "whoosh_s", 0.05, 0.0), (40.96, "swipe", 0.05, 0.2), (42.60, "pen", 0.05, -0.2),
    (44.69, "whoosh_s", 0.05, 0.0), (46.50, "pop", 0.06, 0.0), (CLICK_AT, "click", 0.08, 0.3),
    (47.78, "whoosh_up", 0.07, 0.0),
    (49.60, "sparkle", 0.02, 0.25),
]
