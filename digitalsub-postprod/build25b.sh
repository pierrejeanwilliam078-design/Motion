#!/usr/bin/env bash
# Video 25 — version II: flat, light 2D motion design (no 3D renders needed).
#   ./build25b.sh path/to/HeyGen_-_AI_Spokesperson_Video_Creator_25.mp4  ->  out/DigitalSub_25_v2.mp4
set -euo pipefail
cd "$(dirname "$0")"
SRC=$(realpath "${1:?usage: ./build25b.sh source.mp4}")
export CUES=cues25b
DUR=51.25
mkdir -p out out/v2
echo "1/3 composite (morphing face window, flat motion graphics, 2D type)"
python3 tools/edit_25b.py "$SRC" out/main25b.mp4
echo "2/3 music, SFX, sound logo + mix"
python3 tools/make_audio.py out/v2
tools/mix_audio.sh "$SRC" "$DUR" -17 out/v2 out/v2/mix.wav
echo "3/3 final export"
ffmpeg -v error -y -i out/main25b.mp4 -i out/v2/mix.wav -map 0:v -map 1:a -t "$DUR" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -r 25 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/DigitalSub_25_v2.mp4
echo "done -> out/DigitalSub_25_v2.mp4"
