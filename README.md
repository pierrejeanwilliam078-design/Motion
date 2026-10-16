# Motion — FANOKAFANA Taom-panabeazana 2026-2027 (Live)

Animation motion design (1080×1920, 9:16, 35 s, 30 i/s) réalisée à partir de l'affiche
« FARITANY ATSINANANA — Live — FANOKAFANA Taom-panabeazana 2026-2027 —
Sabotsy 17 Oktobra 2026 — FJKM ZIONA SALAZAMAY | 14H 00 ».

- Vidéo finale : `output/fanokafana-2026-2027.mp4` (H.264, yuv420p, sans audio, prête pour Facebook / écran / live)
- Source de l'animation : `index.html` (HTML/CSS/JS, sans dépendance externe)
- Éléments extraits de l'affiche : `assets/img/` (logos, photos redressées, personnages détourés)
- Polices : Oswald, Montserrat, Anton (Google Fonts, licence OFL) dans `assets/fonts/`

## Aperçu / modification

Ouvrir `index.html` dans Chrome : l'animation tourne en boucle, avec une barre de lecture
pour se placer à n'importe quel instant (`index.html?t=14` démarre à 14 s).
Toute l'animation est une fonction du temps (`renderAt(t)`), chaque scène est un bloc commenté.

## Re-générer la vidéo

```bash
npm i playwright        # ou utiliser une installation globale
node render.mjs                         # -> output/fanokafana-2026-2027.mp4
node render.mjs --stills 5,14,35        # images de contrôle -> output/stills/
node render.mjs --fps 60                # version 60 i/s
```

`ffmpeg` doit être installé.

## Découpage

| Temps | Scène | Animation |
|---|---|---|
| 0–4 s | 1. En-tête | fondu depuis le blanc, barres de couleur, tracé des lignes vertes ; les 6 logos apparaissent un par un (rebond + rotation) ; citation « Ataovy mpianatry… » Mat 28 : 19e ; FARITANY ATSINANANA monte dans un masque puis reflet lumineux |
| 4–8 s | 2. Live | halo lumineux, lettres L-i-v-e en zoom avec flou, triangle « play » jaune en rotation, reflet sur le mot, caméra qui descend |
| 8–14 s | 3. Photos | 2 polaroids entrent par la gauche et la droite (inclinaison, profondeur, flash de développement), scotch qui se colle, léger flottement ; la fillette et la cheftaine entrent avec halo et « respiration » |
| 14–22 s | 4. Titre | FANOKAFANA lettre par lettre + reflet ; Taom-panabeazana révélé, cadre violet tracé ; 2026-2027 en compteur rotatif |
| 22–28 s | 5. Infos | Sabotsy 17 Oktobra 2026 (resserrement + soulignement jaune) ; bandeau orange qui s'ouvre, FJKM ZIONA SALAZAMAY │ 14H 00, reflet |
| 28–35 s | 6. Final | dézoom vers l'affiche complète, respiration, halo du Live, reflets successifs, fin nette sur l'image finale |

## Ambiance sonore suggérée

La vidéo est livrée **sans son** (droits musicaux à choisir par l'organisateur).
Recommandation : piste *corporate / inspiring / uplifting* moderne, 100–120 BPM,
montée progressive, sans effet agressif. Points de synchronisation :

- 0 s : intro douce (pad, piano ou guitare légère)
- 4,1 s : premier « hit » léger / whoosh sur l'arrivée de **Live**
- 8,3 s et 8,9 s : deux whoosh doux pour les polaroids
- 14 s : entrée du beat / de la batterie sur **FANOKAFANA**
- 17,6 s : petit « tick » de compteur pour 2026-2027
- 24 s : ouverture du bandeau (riser court)
- 28–35 s : refrain / point culminant, puis fin sur une note tenue à 35 s

Bibliothèques gratuites possibles : YouTube Audio Library, Pixabay Music
(mots-clés : « inspiring corporate », « uplifting motivational », « modern positive »).
Ajouter la musique : `ffmpeg -i output/fanokafana-2026-2027.mp4 -i musique.mp3 -c:v copy -c:a aac -b:a 192k -shortest -af "afade=t=out:st=33:d=2" output/fanokafana-avec-son.mp4`
