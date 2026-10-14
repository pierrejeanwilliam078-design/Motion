#!/usr/bin/env bash
# Mastering de l'export Remotion pour les réseaux sociaux :
# normalisation en deux passes à -14 LUFS, crête vraie -1 dBTP et vidéo H.264 yuv420p (plage TV) compatible Reels, TikTok et Shorts.
# Usage : bash tools/master.sh out/tiavoyages-dubai-9x16.mp4 out/tiavoyages-dubai-9x16-master.mp4
set -euo pipefail
IN="$1"; OUT="$2"
J=$(ffmpeg -hide_banner -nostdin -i "$IN" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$J" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -nostdin -v error -y -i "$IN" \
	-vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -r 30 \
	-af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
	-c:a aac -b:a 320k -t 30 -movflags +faststart "$OUT"
echo "Master : $OUT"
