"""Timeline for DigitalSub video 25 (« abonnement digital sans te compliquer la vie »).

HOOK → BUILD-UP → IMPACT → DEVELOPMENT → CLIMAX → BRAND OUTRO. Each section has its own
motion language; 3D renders (three/scenes) carry objects only, all type is 2D.
"""

CARD_AT = 48.05   # into the 3D brand reveal (last word ends ~48.06 s)
LOGO_HIT = 48.40

# measured pauses (silencedetect -38 dB) used to correct Whisper onsets
PAUSES = [(2.67, 4.05), (8.96, 9.29), (13.25, 14.16), (16.34, 16.77), (16.77, 17.32), (19.09, 19.45), (21.60, 22.35),
          (24.80, 25.31), (28.78, 29.08), (29.08, 29.78), (30.64, 30.94), (32.14, 32.49), (33.23, 33.67),
          (33.67, 34.43), (39.89, 40.30), (41.52, 41.96), (43.70, 44.02), (44.02, 44.69)]

# music: the pulse arrives with « DigitalSub simplifie », breaks before the climax drop
BPM = 112
BREAKS = [(0.0, 14.10), (29.70, 32.45)]
CLAP = True

# 3D renders: (scene, t0, t1, kind)  kind = overlay (RGBA over the face cam) | full (replaces the shot)
RENDERS = [("hook", 0.00, 2.66, "overlay"), ("services", 2.67, 9.28, "full"), ("friction", 12.50, 13.40, "overlay"),
           ("journey", 16.30, 24.95, "full"), ("toggle", 25.20, 28.90, "overlay"), ("clarity", 30.64, 34.45, "full"),
           ("cta", 45.40, 48.10, "overlay"), ("outro", 48.05, 51.25, "full")]

LIST_TILES = [(17.05, 19.15), (19.70, 21.70), (22.30, 24.40)]  # journey camera holds

# (time, kind, gain, pan)
SFX = [
    # HOOK
    (0.00, "bass", 0.35, 0.0), (0.02, "whoosh_s", 0.05, 0.0),
    (0.50, "impact", 0.16, 0.0), (0.86, "swish", 0.05, 0.2),
    (1.36, "tick", 0.04, -0.2),
    # spatial pull-back into 3D, service cards
    (2.30, "riser", 0.05, 0.0), (2.66, "whoosh_up", 0.09, 0.0), (2.70, "atmo", 0.05, 0.0),
    (4.32, "glass", 0.05, -0.4), (5.32, "glass", 0.05, 0.4), (6.18, "glass", 0.05, -0.4), (7.06, "glass", 0.05, 0.4),
    (7.92, "glass", 0.05, 0.0),
    (8.40, "whoosh", 0.07, 0.0), (9.22, "impact", 0.12, 0.0),
    # friction
    (10.20, "tick", 0.05, -0.3), (11.08, "tick", 0.05, 0.0), (11.72, "tick", 0.05, 0.3),
    (12.60, "servo", 0.05, 0.4), (12.62, "ui", 0.04, 0.4),
    # IMPACT
    (13.60, "riser", 0.06, 0.0),
    (14.14, "bass", 0.42, 0.0), (14.16, "impact_deep", 0.28, 0.0),
    (14.92, "whoosh_up", 0.07, 0.0), (15.20, "shimmer", 0.035, 0.0),
    # DEVELOPMENT: journey
    (16.28, "whoosh_side", 0.09, 0.0), (16.60, "atmo", 0.05, 0.0),
    (17.30, "ui", 0.05, -0.2), (18.10, "tick", 0.04, 0.2),
    (19.15, "whoosh_side", 0.07, 0.3), (19.45, "ui", 0.05, 0.2), (20.30, "tick", 0.04, -0.2),
    (21.70, "whoosh_side", 0.07, -0.3), (22.35, "ui", 0.05, -0.2), (22.80, "tick", 0.04, 0.2),
    (24.40, "whoosh_up", 0.08, 0.0), (24.82, "glass", 0.05, 0.0),
    # activation switch
    (25.60, "pop", 0.05, 0.0), (27.04, "servo", 0.08, 0.0), (27.08, "bass", 0.2, 0.0), (27.12, "ui", 0.05, 0.2),
    # CLIMAX
    (29.78, "tick", 0.05, 0.0), (30.26, "impact", 0.15, 0.0),
    (30.62, "whoosh_s", 0.08, 0.0), (30.64, "bass", 0.3, 0.0), (30.66, "atmo", 0.05, 0.0),
    (31.28, "impact", 0.12, 0.0),
    (31.40, "riser", 0.07, 0.0), (32.10, "servo", 0.05, 0.0),
    (32.45, "bass", 0.45, 0.0), (32.47, "impact_deep", 0.30, 0.0), (32.52, "shimmer", 0.05, 0.0),
    (33.35, "whoosh_up", 0.09, 0.0),
    # personas
    (34.90, "pop", 0.05, -0.3), (35.76, "pop", 0.05, 0.3), (36.64, "pop", 0.05, -0.3), (38.92, "pop", 0.05, 0.3),
    # ton besoin
    (40.78, "impact", 0.14, 0.0), (40.96, "swish", 0.05, 0.2), (42.80, "swipe", 0.05, -0.2),
    # CTA
    (45.40, "whoosh_s", 0.06, 0.0), (45.58, "servo", 0.04, 0.0), (46.50, "ui", 0.05, 0.0), (46.52, "glass", 0.04, 0.0),
    # outro
    (47.80, "riser", 0.05, 0.0), (48.02, "whoosh", 0.08, 0.0),
    (49.50, "sparkle", 0.02, 0.25),
]
