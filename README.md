# Motion — Teaser « Open Days » · ONG JADE Madagascar

Teaser motion design de **35 secondes**, sans voix off, pour annoncer la prochaine édition des Open Days.
Tout est généré par le code : animation (canvas HTML), bande-son (synthèse Python) et montage (ffmpeg).

**Vidéo finale :** [`dist/open-days-teaser.mp4`](dist/open-days-teaser.mp4) — 1920×1080, 30 i/s, H.264 + AAC stéréo.

## Découpage

| Temps | Séquence | Texte à l'écran | Son |
|---|---|---|---|
| 0 – 3 s | Terminal, curseur, synchronisation | `> connexion au réseau en cours…` | Drone grave, battement de cœur, frappe clavier |
| 3 – 6 s | Éclat de particules, ligne de lumière | *Quelque chose se prépare…* | Premier impact cinématique |
| 6 – 9 s | Constellation qui se relie | *Une nouvelle génération se connecte.* | Arpège électronique, kick |
| 9 – 12 s | Mots-chocs sur anneaux HUD | INNOVATION · IA · TIC · CRÉATIVITÉ | Glitchs, montée (riser) |
| 12 – 20 s | **Drop** : grille en perspective | Conférences · Intelligence artificielle · Madagascar (carte en points) · Communauté tech | Beat complet, basse pompée |
| 20 – 23 s | Plans plein écran colorés | APPRENDRE. CRÉER. CONNECTER. | Impacts sur chaque mot |
| 23 – 26 s | Fente lumineuse, portes qui s'ouvrent | *Les portes s'ouvrent bientôt.* · ACCÈS AUTORISÉ | Souffle, scintillement, nouvelle montée |
| 26 – 28,6 s | Compte à rebours, images subliminales du titre | 03 · 02 · 01 | Roulement accéléré, intensité maximale |
| 28,6 – 29 s | Silence, point lumineux | — | Coupure nette (suspense) |
| 29 – 35 s | **Révélation** + écran final | OPEN DAYS – PROCHAINE ÉDITION · ONG JADE Madagascar · Préparez-vous · Restez connectés · COMING SOON | Impact final, nappe large, pings |

Palette : noir, bleu électrique `#2f6bff`, violet `#8b3dff`, cyan `#2ee8ff`, blanc lumineux.
Typographies : Inter Display (titres) et JetBrains Mono (éléments d'interface).

## Fichiers

- `src/timeline.js` — instants clés partagés par l'image et le son (modifier ici pour décaler un impact).
- `src/teaser.html` — l'animation. Ouverte dans un navigateur (via un serveur local), elle sert aussi d'aperçu avec le son.
- `src/soundtrack.py` — musique et effets sonores synthétisés (aucun échantillon externe, donc aucun droit à gérer).
- `src/render.js` — rendu image par image avec Chromium (Playwright) puis encodage ffmpeg.
- `src/prepare_logo.py` — convertit le logo JADE (fond blanc) en PNG transparent lisible sur fond noir.
- `assets/` — logo d'origine et version fond sombre.

## Régénérer la vidéo

Prérequis : Node.js avec `playwright` (Chromium), Python 3 avec `numpy`, `scipy`, `pillow`, et `ffmpeg`.

```bash
python3 src/prepare_logo.py assets/jade-logo-original.webp assets/jade-logo-dark.png
python3 src/soundtrack.py build/soundtrack.wav
node src/render.js                                   # -> dist/open-days-teaser.mp4
ffmpeg -i dist/open-days-teaser.mp4 -vn -c:a copy dist/soundtrack.m4a   # piste audio pour l'aperçu

# Images de contrôle à des instants précis :
node src/render.js --stills 3.6,12.4,31.5            # -> build/still-*.jpg
```

Aperçu interactif : `python3 -m http.server` à la racine, puis ouvrir `http://localhost:8000/src/teaser.html`.
