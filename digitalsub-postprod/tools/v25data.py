"""Video 25 shared data: corrected word timings and the tracked face (used by both edits)."""
import json
import os

import numpy as np

import cues25
from mg import Transcript

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

TR = Transcript(os.path.join(ROOT, "v25", "words.json"))
FIXES = {"arrière": "ariary", "Découvres": "Découvre"}  # ASR: « en ariary » (MGA), imperative « découvre »
ONSETS = {"L'idée": 29.78}  # Whisper glued it to the end of the previous sentence (pause 28.78–29.78)
for i, (w, s, e) in enumerate(TR.words):
    w = FIXES.get(w, w)
    s = ONSETS.get(w, s)
    for p0, p1 in cues25.PAUSES:  # onsets Whisper placed inside a measured pause start when the pause ends
        if p0 <= s < p1 - 0.02:
            s = p1
    TR.words[i] = (w, s, e)

KEEP = np.array(json.load(open(os.path.join(ROOT, "v25", "face_track.json")))["keepout"], np.float32)
SRC_FRAMES = 1205


def words(s, near):
    return TR.timed(s, near)
