#!/usr/bin/env bash
# Video 16 (« quelle formule choisir ? ») — cinematic typography edit.
#   ./build16.sh path/to/HeyGen_-_AI_Spokesperson_Video_Creator_16.mp4  ->  out/DigitalSub_16.mp4
set -euo pipefail
cd "$(dirname "$0")"
EDIT=edit_16 CUES=cues16 NAME=DigitalSub_16 MUSIC_DB=-19 ./build.sh "$@"
