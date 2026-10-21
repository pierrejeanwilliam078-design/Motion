#!/usr/bin/env bash
# Mix voice + ducked music + SFX + sound logo, then two-pass EBU R128 to -14 LUFS / -1 dBTP.
#   tools/mix_audio.sh <source.mp4> <duration_s> <music_db> <stems_dir> <out.wav>
set -euo pipefail
SRC=$1; DUR=$2; MUSIC_DB=$3; ST=$4; OUTWAV=$5
VOICE="highpass=f=70,afftdn=nr=5:nf=-50,equalizer=f=250:t=q:w=1.0:g=-2,equalizer=f=3500:t=q:w=1.2:g=2,highshelf=f=10000:g=1.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160:makeup=1.5"
MIX="[0:a]$VOICE,aresample=48000,apad,atrim=0:$DUR,asplit=2[v][key];
[1:a]volume=${MUSIC_DB}dB,atrim=0:$DUR[m];
[m][key]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=450:knee=4[md];
[2:a]volume=-6dB,atrim=0:$DUR[fx];
[3:a]volume=-9.5dB,atrim=0:$DUR[logo];
[v][md][fx][logo]amix=inputs=4:normalize=0,afade=t=out:st=$(python3 -c "print($DUR-0.35)"):d=0.35"
ffmpeg -v error -y -i "$SRC" -i "$ST/music.wav" -i "$ST/sfx.wav" -i "$ST/logo.wav" -filter_complex "$MIX" -c:a pcm_s24le "$ST/mix_pre.wav"
MEAS=$(ffmpeg -hide_banner -i "$ST/mix_pre.wav" -af loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$MEAS" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$ST/mix_pre.wav" -af "loudnorm=I=-14:TP=-1.0:LRA=9:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" -c:a pcm_s24le "$OUTWAV"
