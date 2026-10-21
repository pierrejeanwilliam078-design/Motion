"""Track the speaker's face (OpenCV Haar cascade) and save a smoothed,
padded per-frame keep-out box so no text is ever placed over the face."""
import json
import subprocess
import sys

import cv2
import numpy as np

W, H, STEP = 1082, 1920, 3


def main(src, out):
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         stdout=subprocess.PIPE)
    boxes, n = {}, 0
    while True:
        buf = p.stdout.read(W * H)
        if len(buf) < W * H:
            break
        if n % STEP == 0:
            g = np.frombuffer(buf, np.uint8).reshape(H, W)
            f = det.detectMultiScale(g, 1.1, 6, minSize=(200, 200))
            if len(f):
                boxes[n] = max(f, key=lambda b: b[2] * b[3]).tolist()
        n += 1
    keys = sorted(boxes)
    arr = np.array([boxes[k] for k in keys], float)
    track = []
    for i in range(n):
        x, y, w, h = (np.interp(i, keys, arr[:, j]) for j in range(4))
        track.append([x, y, w, h])
    track = np.array(track)
    k = np.ones(9) / 9  # light temporal smoothing
    for j in range(4):
        track[:, j] = np.convolve(np.pad(track[:, j], 4, mode="edge"), k, "valid")
    # keep-out = face + hair + chin margin
    keep = [[x - 0.25 * w, y - 0.45 * h, x + 1.25 * w, y + 1.30 * h] for x, y, w, h in track]
    json.dump({"frames": n, "detected": len(keys), "keepout": [[round(v) for v in b] for b in keep]}, open(out, "w"))
    a = np.array(keep)
    print(f"frames {n}, detections {len(keys)}; keep-out union x {a[:,0].min():.0f}-{a[:,2].max():.0f}, "
          f"y {a[:,1].min():.0f}-{a[:,3].max():.0f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
