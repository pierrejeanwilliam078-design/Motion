"""Rough F0 contour of a few phrase endings (question vs statement check)."""
import sys
import wave

import numpy as np

wf = wave.open(sys.argv[1])
sr = wf.getframerate()
a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def f0(seg):
    seg = seg - seg.mean()
    if np.sqrt((seg ** 2).mean()) < 0.01:
        return 0
    c = np.correlate(seg, seg, "full")[len(seg) - 1:]
    lo, hi = sr // 400, sr // 70
    k = lo + np.argmax(c[lo:hi])
    return sr / k if c[k] > 0.3 * c[0] else 0


for name, s, e in [("gratuitement", 1.2, 1.9), ("plus.", 4.4, 4.9), ("décider.", 36.3, 36.9), ("disponible.", 40.2, 40.9)]:
    vals = [f0(a[int(t * sr):int(t * sr) + int(0.04 * sr)]) for t in np.arange(s, e, 0.04)]
    print(f"{name:14s}", " ".join(f"{v:4.0f}" for v in vals))
