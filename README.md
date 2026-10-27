# Motion — Teaser « Open Days » · ONG JADE Madagascar

Teasers motion design de **35 secondes**, sans voix off, pour annoncer la prochaine édition des Open Days.
Tout est généré par le code : animation (canvas HTML), bande-son (synthèse Python) et montage (ffmpeg).

| Version | Vidéo | Style |
|---|---|---|
| V1 « Signal » | [`dist/open-days-teaser.mp4`](dist/open-days-teaser.mp4) | Futuriste néon : noir, bleu électrique, violet, cyan ; glitch, warp, électro 120 BPM |
| V2 « De la graine au réseau » | [`dist/open-days-teaser-v2.mp4`](dist/open-days-teaser-v2.mp4) | Palette du logo JADE : vert `#116D30`, gris `#9B9C97`, blanc, noir ; révélations par masque, plante-logo, trap organique 100 BPM |

Les deux vidéos sont en 1920×1080, 30 i/s, H.264 + AAC stéréo.

## V1 « Signal » — découpage

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

## V2 « De la graine au réseau » — découpage

| Temps | Image | Texte à l'écran | Son |
|---|---|---|---|
| 0 – 6 s | Une graine pulse, des racines en pistes de circuit poussent, la tige sort | *Tout commence par une idée.* | Gouttes d'eau, crépitements, nappe en ré mineur |
| 6 – 9,6 s | Les trois feuilles du logo s'ouvrent, de jeunes pousses essaiment | *Elle grandit. Elle se partage.* | Arpège de kalimba, premiers kicks |
| 9,6 – 12 s | Volets diagonaux plein écran (vert, blanc, noir, gris) | PARTAGER · INNOVER · GRANDIR · ENSEMBLE | Impact par mot, roulement, montée |
| 12 – 19,2 s | **Drop** : passage au fond clair, panneaux illustrés | Conférences · TIC & IA · Créativité · Madagascar | Groove trap, basse 808, motif de kalimba |
| 19,2 – 24 s | Iris elliptique vers le noir, grande pousse | *Votre talent a sa place ici.* · *Êtes-vous prêts ?* | Pause rythmique, 808 graves |
| 24 – 28,2 s | Chargement sur l'ellipse du logo, bloqué à 99 % | LA PROCHAINE ÉDITION SE PRÉPARE | Battement de cœur qui accélère, montée, bégaiement électronique |
| 28,2 – 28,8 s | Noir, retour de la graine | — | Silence, goutte d'eau |
| 28,8 – 35 s | Disques vert puis blanc, écran final clair avec bandeau vert | OPEN DAYS · PROCHAINE ÉDITION · logo + ONG JADE Madagascar · Préparez-vous · Restez connectés · COMING SOON | Impact, résolution en fa majeur, envolée de kalimba |

## Fichiers

- `src/timeline.js`, `src/v2/timeline.js` — instants clés partagés par l'image et le son (modifier ici pour décaler un impact).
- `src/teaser.html` — l'animation. Ouverte dans un navigateur (via un serveur local), elle sert aussi d'aperçu avec le son.
- `src/soundtrack.py`, `src/v2/soundtrack.py` — musique et effets sonores synthétisés (aucun échantillon externe, donc aucun droit à gérer).
- `src/synth.py` — instruments et filtres communs aux deux bandes-son.
- `src/v2/teaser.html` — l'animation de la V2.
- `src/render.js` — rendu image par image avec Chromium (Playwright) puis encodage ffmpeg.
- `src/prepare_logo.py` — convertit le logo JADE (fond blanc) en PNG transparent, pour fond sombre (V1) ou clair (V2).
- `assets/` — logo d'origine et ses deux versions transparentes.

## Régénérer la vidéo

Prérequis : Node.js avec `playwright` (Chromium), Python 3 avec `numpy`, `scipy`, `pillow`, et `ffmpeg`.

```bash
python3 src/prepare_logo.py assets/jade-logo-original.webp assets/jade-logo-dark.png
python3 src/soundtrack.py build/soundtrack.wav
node src/render.js                                   # -> dist/open-days-teaser.mp4
ffmpeg -i dist/open-days-teaser.mp4 -vn -c:a copy dist/soundtrack.m4a   # piste audio pour l'aperçu

# Version 2 :
python3 src/prepare_logo.py assets/jade-logo-original.webp assets/jade-logo-light.png light
python3 src/v2/soundtrack.py build/soundtrack-v2.wav
node src/render.js --page src/v2/teaser.html --audio build/soundtrack-v2.wav --out dist/open-days-teaser-v2.mp4
ffmpeg -i dist/open-days-teaser-v2.mp4 -vn -c:a copy dist/soundtrack-v2.m4a

# Images de contrôle à des instants précis :
node src/render.js --stills 3.6,12.4,31.5            # -> build/still-*.jpg
```

Aperçu interactif : `python3 -m http.server` à la racine, puis ouvrir `http://localhost:8000/src/teaser.html` (V1) ou `http://localhost:8000/src/v2/teaser.html` (V2).
