#!/usr/bin/env bash
# Vidéo éducative ABONIVO « 3 réflexes » : audio → images → MP4.
# Réutilise le moteur, le logo et les polices du dossier ../spot (lancer d'abord `npm install` dans spot/).
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-python3}
WORKERS=${WORKERS:-2}

$PY tools/build_audio.py

(cd .. && python3 -m http.server 8766 >/dev/null 2>&1) &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node ../spot/tools/render.mjs --url http://localhost:8766/edu/index.html --out out/frames --from 0 --to 900 --workers "$WORKERS"

mkdir -p ../livrable
ffmpeg -v error -y -framerate 30 -i out/frames/f%04d.png -i out/audio_mix.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -maxrate 18M -bufsize 36M -profile:v high -level 4.2 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -t 30 -movflags +faststart \
  -metadata title="ABONIVO — 3 réflexes avant de souscrire un abonnement numérique" \
  ../livrable/ABONIVO_education_3_reflexes_30s_1080x1920.mp4
echo "OK : ../livrable/ABONIVO_education_3_reflexes_30s_1080x1920.mp4"
