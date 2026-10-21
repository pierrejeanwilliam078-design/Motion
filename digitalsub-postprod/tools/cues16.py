"""Timeline for DigitalSub video 16 (« quelle formule choisir ? »).

Scene changes sit in the measured pauses of the voice; SFX and music events
are listed here so picture and sound are generated from the same cue sheet.
"""

CARD_AT = 41.55   # dissolve into the end card (last word ends 41.58 s)
LOGO_HIT = 41.90  # end-card logo reveal

# music
BPM = 100
BREAKS = [(9.75, 14.05)]  # pulse drops out on « le mauvais réflexe », returns on « le bon réflexe »
CLAP = True

# full-screen motion B-roll windows (in, out) — both inside voice pauses
BROLL_A = (2.96, 9.72)    # « se perdre entre individual, famille, … » (iris in, push out)
BROLL_B = (17.00, 22.10)  # « combien de personnes, … » (wipe up in, zoom-through out)
BROLL_C = (26.53, 33.12)  # « parfois … la plus chère / la moins chère » (wipe in, split out)

CHIPS = [("Individual", 4.78), ("Famille", 5.94), ("Pro", 6.76), ("Business", 7.32), ("Compte", 8.06),
         ("Profil", 8.62), ("Invitation", 9.06)]
AIDE_TYPE, AIDE_STEP = 38.40, 0.07

# (time, kind, gain, pan)
SFX = [
    # hook
    (0.00, "impact", 0.20, 0.0),
    (0.72, "impact", 0.16, 0.0), (0.86, "swish", 0.05, 0.2),
    (1.98, "whoosh_s", 0.045, -0.3),
    (2.36, "swipe", 0.06, 0.3), (2.42, "tick", 0.05, 0.3),
    # B-roll A: iris in, chips, push out
    (2.10, "riser", 0.05, 0.0),
    (2.94, "whoosh_up", 0.08, 0.0),
    (3.46, "impact", 0.12, 0.0),
    *[(t - 0.02, "pop", 0.05, -0.4 + 0.13 * i) for i, (_, t) in enumerate(CHIPS)],
    (9.70, "whoosh_side", 0.08, 0.0),
    # « le mauvais réflexe »
    (10.70, "impact_deep", 0.24, 0.0), (10.95, "tick", 0.05, 0.3),
    (12.10, "tick", 0.04, -0.2),
    (13.34, "swish", 0.06, 0.0),
    # « le bon réflexe » — music drop
    (14.06, "impact_deep", 0.30, 0.0), (14.30, "swipe", 0.05, 0.3), (14.55, "tick", 0.05, 0.3),
    (16.38, "impact", 0.12, 0.0), (16.52, "swish", 0.05, 0.2),
    # B-roll B: four questions
    (16.20, "riser", 0.045, 0.0),
    (16.98, "whoosh_up", 0.08, 0.0),
    (17.74, "tick", 0.06, -0.3), (19.06, "tick", 0.06, 0.3), (20.10, "tick", 0.06, -0.3), (21.40, "tick", 0.06, 0.3),
    (22.08, "zoom_through", 0.08, 0.0),
    # DigitalSub
    (22.86, "shimmer", 0.035, 0.0),
    (24.72, "impact", 0.12, 0.0), (24.86, "swish", 0.05, 0.2),
    (26.04, "tick", 0.04, 0.2),
    # B-roll C: plus chère / moins chère
    (26.50, "whoosh_side", 0.08, 0.0),
    (29.10, "swipe", 0.06, 0.3), (29.30, "pop", 0.05, 0.3),
    (29.80, "whoosh_s", 0.04, 0.0),
    (32.04, "pop", 0.05, 0.3), (32.46, "swish", 0.05, -0.2),
    (33.10, "whoosh_split", 0.08, 0.0),
    # « le bon abonnement … utilisation réelle »
    (34.20, "impact", 0.13, 0.0),
    (36.26, "tick", 0.04, -0.2), (36.92, "impact", 0.12, 0.0), (37.08, "swish", 0.05, 0.2),
    # CTA
    (37.84, "whoosh_s", 0.045, -0.2),
    (38.30, "pop", 0.06, 0.0),
    *[(AIDE_TYPE + i * AIDE_STEP, "key", 0.05, 0.1) for i in range(4)],
    (38.75, "send", 0.06, 0.2),
    (40.72, "impact", 0.13, 0.0),
    # out
    (41.15, "whoosh", 0.07, 0.0),
    (43.12, "sparkle", 0.022, 0.25),
]
