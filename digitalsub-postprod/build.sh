#!/usr/bin/env bash
# DigitalSub premium post-production — full rebuild.
#   ./build.sh path/to/source.mp4                 video 18  ->  out/DigitalSub_final.mp4
#   ./build16.sh path/to/source16.mp4             video 16  ->  out/DigitalSub_16.mp4
set -euo pipefail
cd "$(dirname "$0")"

SRC=${1:?usage: ./build.sh source.mp4}
OUT=out
mkdir -p "$OUT"

EDIT=${EDIT:-edit_v2}          # picture module (tools/<EDIT>.py)
export CUES=${CUES:-cues}      # shared cue sheet (tools/<CUES>.py)
NAME=${NAME:-DigitalSub_final}
MUSIC_DB=${MUSIC_DB:--20}
CARD_AT=$(cd tools && python3 -c "import $CUES; print($CUES.CARD_AT)")  # dissolve into the end card
CARD_FADE=0.55

echo "1/4 main sequence (face cam, kinetic type, subtitles, motion B-roll)"
python3 tools/$EDIT.py "$SRC" "$OUT/main.mp4"

echo "2/4 end card"
python3 tools/render_endcard.py assets/digitalsub-logo.png "$OUT/endcard.mp4"

echo "3/4 music, SFX, sound logo + mix"
python3 tools/make_audio.py "$OUT"

DUR=$(python3 -c "print(round($CARD_AT + $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/endcard.mp4"), 3))")

tools/mix_audio.sh "$SRC" "$DUR" "$MUSIC_DB" "$OUT" "$OUT/mix.wav"

echo "4/4 final export"
ffmpeg -v error -y -i "$OUT/main.mp4" -i "$OUT/endcard.mp4" -i "$OUT/mix.wav" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=$CARD_FADE:offset=$CARD_AT,format=yuv420p[v]" \
  -map "[v]" -map 2:a -t "$DUR" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -r 25 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart \
  "$OUT/$NAME.mp4"

echo "done -> $OUT/$NAME.mp4"
