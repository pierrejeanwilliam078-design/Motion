#!/usr/bin/env bash
# Render every 3D shot of video 25 into out/r3d25/<scene>/ (3 Chromium renderers in parallel).
#   three/render25.sh path/to/source25.mp4
set -euo pipefail
cd "$(dirname "$0")"
SRC=$(realpath "$1")
OUT=$(realpath -m ../out/r3d25)
EXT="$OUT/_footage"
mkdir -p "$OUT" "$EXT"
# graded footage frames for the floating screen (same grade as the composite → seamless cuts)
ffmpeg -v error -y -ss 2.6 -t 6.9 -i "$SRC" -vf "eq=contrast=1.05:saturation=1.04:gamma=0.98,colorbalance=rs=-0.015:bs=0.03:rh=0.015:bh=-0.01" \
  -q:v 2 -start_number 65 "$EXT/%05d.jpg"
jobs=(
  "services 2.67 9.28 --ext $EXT --sub ${SUB:-1}"
  "journey 16.30 24.95 --sub ${SUB:-1}"
  "clarity 30.64 34.45 --sub ${SUB:-1}"
  "outro 47.95 51.25"
  "hook 0.00 2.66"
  "friction 12.50 13.40"
  "toggle 25.20 28.90"
  "cta 45.40 48.10"
)
printf '%s\n' "${jobs[@]}" | xargs -P 3 -I{} bash -c 'set -- {}; s=$1; node render3d.mjs "$s" "$2" "$3" "'"$OUT"'/$s" "${@:4}"' 
