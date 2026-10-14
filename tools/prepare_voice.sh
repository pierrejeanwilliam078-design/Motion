#!/usr/bin/env bash
# Prépare la voix off : mise à niveau (≈ -15 LUFS, crêtes limitées) puis découpe
# en 7 répliques, aux silences détectés (ffmpeg silencedetect, seuil -40 dB).
# Usage : bash tools/prepare_voice.sh [fichier_voix_off]
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-public/audio/vo/voix-off-originale.mp3}"
OUT=public/audio/vo
ffmpeg -v error -y -i "$SRC" -af "highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2dB,volume=7dB,alimiter=limit=0.84:attack=4:release=60:level=disabled" -ar 48000 -ac 1 "$OUT/voix-off-niveau.wav"
# nom  début  fin (s, dans l'enregistrement d'origine)
while read -r name a b; do
	d=$(python3 -c "print(round($b-$a,3))")
	fo=$(python3 -c "print(round($b-$a-0.03,3))")
	ffmpeg -nostdin -v error -y -ss "$a" -t "$d" -i "$OUT/voix-off-niveau.wav" \
		-af "afade=t=in:d=0.015,afade=t=out:st=$fo:d=0.03" -ar 48000 -ac 1 "$OUT/vo_$name.wav"
done <<'SEG'
c1 0.00 2.70
c2 2.95 6.62
c3 6.68 10.60
c4 10.66 13.90
c5 13.93 18.10
c6a 18.12 21.02
c6b 21.04 22.20
SEG
rm "$OUT/voix-off-niveau.wav"
echo "Voix off prête dans $OUT"
