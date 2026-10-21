"""Person matte (MediaPipe selfie segmenter model, Apache-2.0, run with LiteRT) for a frame range,
saved as 8-bit PNG masks <outdir>/<frame>.png — used to put type behind the speaker."""
import os
import subprocess
import sys

import numpy as np
from ai_edge_litert.interpreter import Interpreter
from PIL import Image, ImageFilter

W, H, FPS = 1082, 1920, 25


def main(src, model, outdir, t0, t1):
    os.makedirs(outdir, exist_ok=True)
    it = Interpreter(model_path=model)
    it.allocate_tensors()
    i_in, i_out = it.get_input_details()[0]["index"], it.get_output_details()[0]["index"]
    f0, f1 = round(t0 * FPS), round(t1 * FPS)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{f0 / FPS:.3f}", "-i", src, "-frames:v", str(f1 - f0 + 1),
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    for f in range(f0, f1 + 1):
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        small = Image.frombuffer("RGB", (W, H), buf).resize((256, 256), Image.BILINEAR)
        it.set_tensor(i_in, (np.asarray(small, np.float32) / 255)[None])
        it.invoke()
        conf = it.get_tensor(i_out)[0, ..., 0]
        m = Image.fromarray((np.clip((conf - 0.3) / 0.4, 0, 1) * 255).astype(np.uint8))
        # stored at half resolution (upscaled smoothly at composite time)
        m.resize((W // 2, H // 2), Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.8)).save(
            os.path.join(outdir, f"{f:05d}.png"), optimize=True)
    print(f"matte frames {f0}-{f1}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]))
