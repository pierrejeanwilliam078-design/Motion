#!/usr/bin/env bash
# Video 25 — 3D motion design + 2D kinetic typography.
#   ./build25.sh path/to/HeyGen_-_AI_Spokesperson_Video_Creator_25.mp4  ->  out/DigitalSub_25.mp4
# Needs node + the Playwright Chromium for the 3D renders (three/), ffmpeg, Python 3 + numpy + Pillow.
set -euo pipefail
cd "$(dirname "$0")"
SRC=$(realpath "${1:?usage: ./build25.sh source.mp4}")
export CUES=cues25
DUR=51.25
mkdir -p out
echo "1/4 3D renders (three.js, headless Chromium)"
[ -d out/r3d25/outro ] && [ -z "${RERENDER:-}" ] || three/render25.sh "$SRC"
echo "2/4 composite (face cam, 3D shots, 2D kinetic type)"
python3 tools/edit_25.py "$SRC" out/main25.mp4
echo "3/4 music, SFX, sound logo + mix"
python3 tools/make_audio.py out
tools/mix_audio.sh "$SRC" "$DUR" -18 out out/mix25.wav
echo "4/4 final export"
ffmpeg -v error -y -i out/main25.mp4 -i out/mix25.wav -map 0:v -map 1:a -t "$DUR" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -r 25 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/DigitalSub_25.mp4
echo "done -> out/DigitalSub_25.mp4"
