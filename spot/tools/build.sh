#!/usr/bin/env bash
# Chaîne complète : logo → textures → audio → images → MP4 final.
# Prérequis : node 18+, playwright + chromium, python3 (numpy, pillow, scipy, soundfile, potracer), ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-python3}
WORKERS=${WORKERS:-3}

npm install --no-audit --no-fund >/dev/null
$PY tools/extract_logo.py
$PY tools/gen_textures.py
$PY tools/build_audio.py

python3 -m http.server 8765 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node tools/render.mjs --out out/frames --from 0 --to 900 --workers "$WORKERS"

mkdir -p ../livrable
ffmpeg -v error -y -framerate 30 -i out/frames/f%04d.png -i out/audio_mix.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -t 30 -movflags +faststart \
  -metadata title="ABONIVO — Vos abonnements numériques, simplifiés." \
  ../livrable/ABONIVO_spot_30s_1080x1920.mp4
echo "OK : ../livrable/ABONIVO_spot_30s_1080x1920.mp4"
