# ABONIVO — spot publicitaire 30 s (9:16)

Spot motion design 3D vertical, 1080 × 1920, 30 i/s, 30 s, avec voix off, musique et sound design intégrés.

**Livrable :** [`../livrable/ABONIVO_spot_30s_1080x1920.mp4`](../livrable/ABONIVO_spot_30s_1080x1920.mp4)
(H.264 High, yuv420p, AAC 320 kb/s 48 kHz, −14 LUFS, faststart, prêt pour Reels / TikTok / Facebook).

## Découpage

| Scène | Temps | Voix off | Texte à l'écran | Visuel |
|---|---|---|---|---|
| 1 Hook | 0–4 s | « Marre de chercher vos abonnements partout ? » | Trop d'abonnements ? | Bureau 3D (portable, smartphone, tasse, carnet), cartes d'abonnements qui jaillissent de l'écran, travelling puis plongée dans l'écran |
| 2 Révélation | 4–8 s | « Découvrez une autre façon de choisir. » | Découvrez ABONIVO | Les cartes convergent en spirale, éclair, révélation du logo Smart Orbit en relief avec anneaux orbitaux |
| 3 Services | 8–14 s | « Streaming, intelligence artificielle, création, logiciels, formation… » | STREAMING · IA · CRÉATION · FORMATION | Téléviseur, moniteur, tablette, smartphone en studio sombre ; panoramiques filés calés sur la voix |
| 4 Expérience | 14–20 s | « Avec ABONIVO, explorez les services numériques selon vos besoins. » | Vos besoins. Vos choix. | Smartphone en travelling 3D : maquette de la boutique, défilement, catégorie « IA », ouverture d'une fiche produit (taps simulés, sans mains) |
| 5 Promesse | 20–25 s | « Plus clair. Plus simple. Plus pratique. » | CLAIR · SIMPLE · PRATIQUE | Écran d'accueil ABONIVO, anneaux orbitaux, passage du clair au bleu nuit |
| 6 CTA | 25–30 s | « ABONIVO. Vos abonnements numériques, simplifiés. Contactez-nous ! » | ABONIVO · Vos abonnements numériques, simplifiés. · CONTACTEZ-NOUS · +261 37 9148089 | Logo avec halo turquoise, reflet, cadre stabilisé ; numéro visible jusqu'à la dernière image |

Toutes les interfaces sont génériques : aucune marque tierce n'apparaît.
Les textes restent dans une zone sûre (≈ 260–1 530 px en hauteur, marges latérales ≥ 90 px).

## Fabrication

- `src/` : scènes Three.js (modèles procéduraux, matériaux PBR, éclairage, ombres), interfaces dessinées sur canvas,
  typographie DOM (Montserrat), post-traitement (profondeur de champ, transitions, bloom, étalonnage, grain).
- `tools/extract_logo.py` : détourage du logo fourni (tuile, symbole) et vectorisation du wordmark.
- `tools/build_audio.py` : musique originale 120 BPM (synthèse), sound design synchronisé, découpe et calage de la voix off, ducking, mastering −14 LUFS / −1 dBTP.
- `tools/render.mjs` : rendu image par image dans Chromium headless.
- `timeline.json` : source unique des temps (scènes, phrases de voix off, repères, effets sonores).

Reconstruction complète : `bash tools/build.sh` (≈ 30–40 min en rendu logiciel).
Aperçu interactif : `npm run preview` puis ouvrir `http://localhost:8765/` et appeler `renderAt(t)` dans la console.
