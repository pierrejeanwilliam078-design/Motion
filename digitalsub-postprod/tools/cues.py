"""Shared timeline (seconds): scene boundaries and SFX cues, used by both the
picture renderer and the audio generator so sound and motion stay locked."""

CARD_AT = 40.85  # dissolve into the end card
LOGO_HIT = 41.20  # end-card logo reveal

# scene windows
HOOK = (0.00, 2.38)
PAYANT = (2.38, 5.55)
LIST_IN, LIST_OUT = 5.45, 13.32  # full-screen card: wipe up in, slide up out
MAGIQUE = (13.78, 16.32)
FORMULE = (19.45, 25.15)  # glass overlay card
COMPARE_IN, COMPARE_OUT = 25.10, 31.85  # full-screen split card
OPTIONS = (34.62, 37.35)
CTA = (37.35, 40.95)

LIST_ITEMS = [6.92, 7.74, 9.20, 11.00, 12.06]  # spoken keyword starts
TYPE_START, TYPE_STEP = 37.90, 0.075  # "ChatGPT" typed in the comment field
SEND_AT = 38.55

# (time, kind, gain, pan)
SFX = [
    # hook
    (0.02, "impact", 0.22, 0.0),
    (0.55, "tick", 0.05, -0.2),
    (1.16, "swipe", 0.05, 0.2),
    # "Le payant ... gagner plus."
    (2.40, "whoosh_s", 0.045, -0.3),
    (4.38, "impact", 0.16, 0.0),
    (4.62, "sparkle", 0.028, 0.3),
    # list card
    (5.40, "whoosh_up", 0.085, 0.0),
    *[(t - 0.04, "tick", 0.06, -0.25 + 0.12 * i) for i, t in enumerate(LIST_ITEMS)],
    (12.85, "shimmer", 0.03, 0.0),
    (13.30, "whoosh_up", 0.075, 0.0),
    # "Mais un abonnement payant n'est pas magique."
    (13.86, "impact", 0.26, 0.0),
    (15.38, "impact_deep", 0.30, 0.0),
    (15.56, "sparkle", 0.03, 0.2),
    (16.22, "whoosh_s", 0.04, 0.3),
    # formule card
    (19.42, "swipe", 0.06, -0.2),
    (21.70, "tick", 0.035, -0.2), (21.85, "tick", 0.035, 0.0), (22.00, "tick", 0.035, 0.2),
    (24.04, "impact", 0.15, 0.0),
    (24.36, "sparkle", 0.03, 0.25),
    # comparison card
    (25.05, "whoosh_side", 0.08, 0.0),
    (27.32, "ticks_run", 0.03, 0.0),
    (28.00, "impact", 0.14, 0.0),
    (30.95, "pop", 0.06, -0.2), (31.30, "pop", 0.06, 0.2),
    (31.82, "whoosh_split", 0.08, 0.0),
    # DigitalSub / options
    (32.34, "sparkle", 0.03, -0.2),
    (34.66, "tick", 0.04, -0.3), (34.76, "tick", 0.04, 0.0), (34.86, "tick", 0.04, 0.3),
    (35.20, "swipe", 0.04, -0.3),
    (36.40, "pop", 0.07, 0.0),
    # CTA
    (37.32, "swipe", 0.07, -0.3),
    *[(TYPE_START + i * TYPE_STEP, "key", 0.05, 0.1) for i in range(7)],
    (SEND_AT, "send", 0.07, 0.2),
    # out
    (40.45, "whoosh", 0.07, 0.0),
    (42.42, "sparkle", 0.022, 0.25),
]
