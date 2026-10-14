# TIAVOYAGES — Publicité animée « Dubaï à votre façon »

Publicité verticale **9:16 · 1080 × 1920 · 30 i/s · 30 s**, réalisée en motion design 2.5D avec [Remotion](https://www.remotion.dev/) à partir des 5 illustrations de la mascotte.

**Vidéo finale :** [`renders/tiavoyages-dubai-9x16.mp4`](renders/tiavoyages-dubai-9x16.mp4)
H.264 High, yuv420p, AAC 320 kb/s, −14 LUFS intégrés, crête −1 dBTP (Reels, TikTok, Shorts).

---

## Timeline

| Temps | Scène | Image source | Animation | Voix off | Son |
|---|---|---|---|---|---|
| 0:00 – 0:04 | 1 · Bienvenue à Dubaï | tenue traditionnelle | ouverture par fente lumineuse, léger zoom avant, parallaxe skyline/mascotte, salut de la main (rotation au poignet), rebond de marche, valise qui suit | « Dubaï, oui… mais à votre façon. » | souffle cinématographique, intro musicale |
| 0:04 | Transition 1 | — | panoramique latéral rapide + flou de mouvement horizontal | | whoosh |
| 0:04 – 0:09 | 2 · Votre voyage en quelques clics | smartphone | rotation 3D d'entrée, push-in caméra vers le téléphone, mise au point (flou du décor), écran recréé en 2D et plaqué en perspective : allumage, en-tête, titre, puis cartes **Vols → Visa → Hébergement → Dates** en pop successifs | « Chez TIAVOYAGES, tout se prépare simplement, selon vos envies. » | 4 micro-clics UI + pops |
| 0:09 | Transition 2 | — | avion stylisé + traînée, volet diagonal | | passage d'avion |
| 0:09 – 0:14 | 3 · Organisation et accompagnement | aéroport (sans téléphone) | travelling avant, rebond de marche, mise en valeur du passeport/billet (pop + reflet), panneaux qui pulsent, reflets glissant sur le sol | « Visa, vols et hébergement : on vous accompagne à chaque étape. » | ambiance aéroport, tintement |
| 0:14 | Transition 3 | — | zoom traversant + flou | | whoosh |
| 0:14 – 0:19 | 4 · Transfert et confort | voiture (sans téléphone) | caméra vers la voiture, main qui présente le véhicule, reflets dynamiques sur la carrosserie, intérieur qui s'éclaire, micro-mouvement de la valise | « Et sur place, profitez de vos déplacements en toute sérénité. » | portière feutrée |
| 0:19 | Transition 4 | — | panoramique vertical + flou de mouvement | | whoosh montant |
| 0:19 – 0:25 | 5 · Dubaï à votre rythme | promenade (sans téléphone) | travelling latéral avec parallaxe (mascotte / promenade / eau / tours), bras qui présente la ville, scintillement de l'eau, petit zoom, montée musicale | « Découvertes, excursions, moments uniques… vous choisissez le rythme. » | vent léger, ambiance |
| 0:25 – 0:30 | 6 · Signature de marque | mascotte de la scène 5 | révélation circulaire vers un fond blanc/bleu, la mascotte glisse au centre (même calque : visage identique), anneaux, logo en scale-in avec inertie, pictogramme qui se pose, slogan en fondu + translation, petit signe du pouce, tenue finale | « TIAVOYAGES. Votre Dubaï, sur mesure. À vous de voyager ! » | signature sonore (3 notes) |

Textes affichés : uniquement l'interface du téléphone (*Réserver mon voyage, Vols, Visa, Hébergement, Dates*) et la signature finale (*TIAVOYAGES / DUBAÏ À VOTRE FAÇON. / Organisez votre voyage avec nous.*). Pas de sous-titres.

Les coupes tombent sur les temps de la musique (120 BPM : 4 s, 9 s, 14 s, 19 s, 25 s).

## Technique 2.5D

Les illustrations ne sont jamais déformées :

1. **Détourage** de la mascotte (BiRefNet via `rembg`) → calque mascotte (`fg.png`).
2. **Décor reconstruit** derrière la mascotte (remplissage pyramidal flou, visible seulement sur quelques pixels lors de la parallaxe) → `bg.jpg`.
3. **Parties animées séparées** (mains, valises, passeport) avec pivot au poignet / aux roues : seules des rotations de quelques degrés sont appliquées.
4. **Caméra virtuelle** : le décor suit le mouvement à 45–60 % (parallaxe), la mascotte à 100 %.
5. **Écran du téléphone** : les 4 coins de l'écran sont détectés automatiquement ; l'interface 2D est plaquée par une matrice de perspective (`matrix3d`), les doigts restent au premier plan.

## Arborescence

```
public/
  images/<scène>/        calques générés (bg.jpg, fg.png, parties, masques d'effets)
  audio/vo/              voix off découpée (7 répliques) + enregistrement d'origine
  audio/music/           musique originale générée
  audio/sfx/             effets sonores générés
  fonts/                 Montserrat (SIL OFL) + licence
src/
  timeline.ts            durées, positions des voix et des effets, couleurs
  TiavoyagesAd.tsx       composition, transitions, mixage (ducking)
  scenes/Scenes.tsx      scènes 1 à 5
  scenes/Finale.tsx      transition 5 → 6 et signature de marque
  components/            interface du téléphone, logotype, effets lumineux
  lib/                   caméra 2.5D, ressorts/easing, géométrie (perspective)
  layers.json            positions des parties, coins de l'écran, points de scintillement
tools/                   scripts de préparation (Python / ffmpeg)
renders/                 export final
```

## Commandes

```bash
npm install
npm start            # Remotion Studio : prévisualisation animée et réglages
npm run export       # rendu MP4 (out/) puis mastering -14 LUFS (out/…-master.mp4)
```

`npm run export` nécessite `ffmpeg` dans le PATH pour l'étape de mastering.

Régénérer les assets (facultatif) :

```bash
pip install -r tools/requirements.txt
python tools/segment_mascot.py <dossier 1.webp…5.webp> <dossier masques>
python tools/prepare_layers.py <dossier images> <dossier masques> <dossier sortie>
python tools/prepare_fx_masks.py <dossier images> <dossier masques> <dossier sortie>
python tools/generate_audio.py public/audio
bash tools/prepare_voice.sh public/audio/vo/voix-off-originale.mp3
```

Les images sources sont attendues sous les noms `1.webp` (promenade), `2.webp` (voiture), `3.webp` (aéroport), `4.webp` (téléphone), `5.webp` (tenue traditionnelle), c'est-à-dire l'ordre d'envoi d'origine. La correspondance avec les scènes se trouve dans `SCENES` (`tools/prepare_layers.py`).

## Audio et droits

- **Voix off** : fichier ElevenLabs fourni (voix « Yann »). Il est mis à niveau, puis découpé en 7 répliques à partir des silences et placé dans chaque scène. Les droits d'usage commercial relèvent des conditions de votre abonnement ElevenLabs.
- **Musique et effets sonores** : entièrement synthétisés par `tools/generate_audio.py`. Aucun échantillon externe n'est utilisé, ils sont donc libres de droits.
- **Police** : Montserrat, SIL Open Font License 1.1 (`public/fonts/OFL.txt`).
- **Pictogramme avion** : forme « flight » de Material Icons (Apache 2.0).
