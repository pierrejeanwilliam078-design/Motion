#!/usr/bin/env bash
# DigitalSub premium post-production — full rebuild.
#   ./build.sh path/to/source.mp4  ->  out/DigitalSub_final.mp4
set -euo pipefail
cd "$(dirname "$0")"

SRC=${1:?usage: ./build.sh source.mp4}
OUT=out
mkdir -p "$OUT"

CARD_AT=40.85    # dissolve into the end card starts (last word ends ~40.86 s)
CARD_FADE=0.55

echo "1/4 main sequence (face cam, kinetic type, subtitles, motion B-roll)"
python3 tools/edit_v2.py "$SRC" "$OUT/main.mp4"

echo "2/4 end card"
python3 tools/render_endcard.py assets/digitalsub-logo.png "$OUT/endcard.mp4"

echo "3/4 music, SFX, sound logo + mix"
python3 tools/make_audio.py "$OUT"

DUR=$(python3 -c "print(round($CARD_AT + $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/endcard.mp4"), 3))")

# voice: clean-up, gentle EQ + compression; music ducked under the voice
VOICE="highpass=f=70,afftdn=nr=5:nf=-50,equalizer=f=250:t=q:w=1.0:g=-2,equalizer=f=3500:t=q:w=1.2:g=2,highshelf=f=10000:g=1.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160:makeup=1.5"
MIX="[0:a]$VOICE,aresample=48000,apad,atrim=0:$DUR,asplit=2[v][key];
[1:a]volume=-20dB,atrim=0:$DUR[m];
[m][key]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=450:knee=4[md];
[2:a]volume=-6dB,atrim=0:$DUR[fx];
[3:a]volume=-9.5dB,atrim=0:$DUR[logo];
[v][md][fx][logo]amix=inputs=4:normalize=0,afade=t=out:st=$(python3 -c "print($DUR-0.35)"):d=0.35"

ffmpeg -v error -y -i "$SRC" -i "$OUT/music.wav" -i "$OUT/sfx.wav" -i "$OUT/logo.wav" -filter_complex "$MIX" -c:a pcm_s24le "$OUT/mix_pre.wav"
# two-pass EBU R128 normalisation for social platforms (-14 LUFS, -1 dBTP)
MEAS=$(ffmpeg -hide_banner -i "$OUT/mix_pre.wav" -af loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$MEAS" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$OUT/mix_pre.wav" -af "loudnorm=I=-14:TP=-1.0:LRA=9:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -c:a pcm_s24le "$OUT/mix.wav"

echo "4/4 final export"
ffmpeg -v error -y -i "$OUT/main.mp4" -i "$OUT/endcard.mp4" -i "$OUT/mix.wav" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=$CARD_FADE:offset=$CARD_AT,format=yuv420p[v]" \
  -map "[v]" -map 2:a -t "$DUR" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -r 25 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart \
  "$OUT/DigitalSub_final.mp4"

echo "done -> $OUT/DigitalSub_final.mp4"
