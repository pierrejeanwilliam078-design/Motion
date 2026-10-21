# DigitalSub — post-production premium

Finalisation de la vidéo « porte-parole » DigitalSub (HeyGen, 1082×1920, 25 i/s, 41 s) :
sous-titres synchronisés, kinetic typography, motion design sobre, sound design original,
mixage et séquence de fin de marque. Le montage d'origine (ordre, durée, cadrage) est conservé.

Livrable : `deliverables/DigitalSub_final.mp4` — H.264 High, 1082×1920, 25 i/s, 44,04 s,
AAC 320 kb/s 48 kHz, -14 LUFS / -1 dBTP.

## Analyse de la source

| | |
|---|---|
| Format | 1082×1920 vertical, 25 i/s, H.264 + AAC stéréo 48 kHz |
| Durée | 41,0 s, un seul plan continu (aucune coupe détectée) |
| Cadrage | plan poitrine face caméra, logo DigitalSub déjà présent au mur |
| Voix | français, propre (bruit de fond ≈ -57 dB), -18,9 LUFS |
| Rythme | 7 phrases séparées par des pauses de 0,5 à 0,8 s |

Transcription : Whisper *small* avec horodatage par mot (`transcript/words.json`, confiance
> 0,9 sur presque tous les mots). La ponctuation de la première phrase (« ? ») a été vérifiée
par l'intonation montante en fin de « gratuitement » (`tools/pitch_probe.py`).
Seule normalisation : « Digital Sub » → **DigitalSub** (nom de marque).

## Ce qui a été fait

**Sous-titres** (`tools/make_subs.py`, libass) — Inter Display SemiBold 62 px, blanc avec halo
sombre diffus, 1 à 2 lignes, ancrés à y = 1395 (au-dessus des zones d'interface Reels/TikTok/Shorts,
marges latérales 90 px). Entrée fondu + glissement de 18 px, sortie en fondu. Les mots-clés passent
du blanc au **cyan** (#46E3F5) ou au **violet** (#A78BFA) à l'instant exact où ils sont prononcés.

**Motion design** (`tools/render_main.py`)
- Étalonnage léger (contraste, ombres froides) + vignettage discret.
- Recadrages progressifs (max. 8 %) placés dans les pauses, centrés sur le visage :
  « Mais un abonnement payant n'est pas magique », « DigitalSub peut t'aider »…
- Appel à l'action : panneau en verre dépoli (flou réel de l'image, teinte bleu nuit, liseré
  dégradé cyan → violet qui se dessine depuis le centre) ; « Écris « ChatGPT » » puis
  « si tu veux connaître l'offre disponible. » apparaissent mot à mot, synchronisés sur la voix.
- Sortie : défocalisation + poussée, fondu vers la séquence de fin (le logo mural
  se superpose au logo de fin, effet de *match cut*).

**Séquence de fin** (`tools/render_endcard.py`, 3 s) — fond bleu nuit en dégradé, halo
violet/cyan respirant, logo officiel (seulement détouré de sa marge transparente et mis à l'échelle
uniformément), apparition fondu + mise au point + léger zoom, reflet lumineux discret, filet
dégradé, puis `www.digitalsub.org` et pause de lecture d'environ 1,5 s.

**Son** (`tools/make_audio.py` + `build.sh`) — tout est synthétisé : aucun échantillon tiers,
donc exploitable commercialement sans restriction.
- Musique : nappe ambient en ré majeur à 96 BPM (pads, basse, arpèges en ping-pong, charleston
  très discret), atténuée automatiquement sous la voix (sidechain), résolue sur l'accord du logo.
- SFX : whooshs filtrés sur les recadrages, impact doux sur « Mais… », swipes numériques sur le
  premier sous-titre et le panneau CTA, scintillements sur « DigitalSub » et le reflet du logo,
  texture d'air sous la fin.
- Sound logo : montée d'air → arpège de cloches FM (Dmaj9) + sub-basse, environ 2 s.
- Voix : passe-haut, débruitage léger, EQ (-2 dB à 250 Hz, +2 dB à 3,5 kHz, air), compression 2,5:1.
- Master : normalisation EBU R128 en deux passes, -14 LUFS intégrés, crête vraie -1 dBTP.

## Contrôles effectués

- Durée/format : 1082×1920, 25 i/s conservés ; vidéo 0–41 s intacte + 3 s de fin.
- Niveaux mesurés sur le master : voix ≈ -16,6 dB RMS, musique ≈ 13 dB sous la voix,
  whooshs ≈ -30 dB RMS, sound logo ≈ -18,7 dB RMS, aucune saturation.
- Images de contrôle : lisibilité des sous-titres, couleurs des mots-clés au bon moment,
  panneau CTA, URL exacte `www.digitalsub.org`, logo non déformé.

## Reconstruire

Prérequis : `ffmpeg` (avec libass), Python 3 + `numpy` + `Pillow`, police Inter / Inter Display.

```bash
./build.sh /chemin/vers/HeyGen_-_AI_Spokesperson_Video_Creator_18.mp4
# -> out/DigitalSub_final.mp4
```

Réglages principaux : textes et timings dans `tools/make_subs.py` (`CUES`), recadrages dans
`tools/render_main.py` (`ZOOM_KEYS`), niveaux musique/SFX/logo dans `build.sh` (`volume=`).
