#!/usr/bin/env bash
# Renders TIAVOYAGES_PREMIUM_MOTION_9x16.mp4 and re-muxes the ORIGINAL
# soundtrack bit-for-bit (stream copy, no re-encode) on top of the picture.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR=${OUT_DIR:-deliverables}
FINAL="$OUT_DIR/TIAVOYAGES_PREMIUM_MOTION_9x16.mp4"
TMP="out/picture.mp4"
mkdir -p out "$OUT_DIR"

BROWSER_ARGS=()
if [[ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ]]; then
  BROWSER_ARGS=(--browser-executable "$REMOTION_BROWSER_EXECUTABLE")
fi

npx remotion render src/index.ts TiavoyagesPremium "$TMP" \
  --codec h264 --crf 12 --pixel-format yuv420p --muted \
  "${BROWSER_ARGS[@]}" "$@"

# Picture from Remotion converted to broadcast (tv) range yuv420p like the source,
# + the untouched original AAC stream (stream copy, bit-identical).
ffmpeg -v error -y -i "$TMP" -i public/original/tiavoyages-dubai-9x16.mp4 \
  -map 0:v:0 -map 1:a:0 \
  -vf "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt601,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -r 30 \
  -color_range tv -colorspace bt470bg -color_primaries bt470bg -color_trc smpte170m \
  -c:a copy -movflags +faststart -t 30 "$FINAL"

ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames \
  -of default=nw=1 "$FINAL"
echo "Rendered: $FINAL"
