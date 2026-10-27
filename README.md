# Motion — Teaser « Open Days » · ONG JADE Madagascar

Teasers motion design de **35 secondes**, sans voix off, pour annoncer la prochaine édition des Open Days.
Tout est généré par le code : animation (canvas HTML), bande-son (synthèse Python) et montage (ffmpeg).

| Version | Vidéo | Style |
|---|---|---|
| V1 « Signal » | [`dist/open-days-teaser.mp4`](dist/open-days-teaser.mp4) | Futuriste néon : noir, bleu électrique, violet, cyan ; glitch, warp, électro 120 BPM |
| V2 « De la graine au réseau » | [`dist/open-days-teaser-v2.mp4`](dist/open-days-teaser-v2.mp4) | Palette du logo JADE : vert `#116D30`, gris `#9B9C97`, blanc, noir ; révélations par masque, plante-logo, trap organique 100 BPM |
| V3 « Trailer » (9:16, voix off) | [`dist/open-days-trailer-9x16.mp4`](dist/open-days-trailer-9x16.mp4) | Bande-annonce de cinéma pour Reels/TikTok : voix off ElevenLabs, orchestre hybride synthétisé, palette JADE |
| V7 « L'écran » (9:16, voix off) | [`dist/open-days-trailer-9x16-v7.mp4`](dist/open-days-trailer-9x16-v7.mp4) | Tout se joue dans un téléphone : notifications, discussion, fil, stories, l'écran s'éteint puis se rallume sur OPEN DAYS ; musique de la V3 + sons d'interface |
| V6 « De la terre au futur » (9:16, voix off) | [`dist/open-days-trailer-9x16-v6.mp4`](dist/open-days-trailer-9x16-v6.mp4) | Inspiration Madagascar : plan-séquence illustré (baobabs, rizières, ville connectée) en vert et gris JADE, nouvelle musique (pincés façon valiha, 12/8 inspiré du salegy) |
| V5 « Trailer 3D » (9:16, voix off) | [`dist/open-days-trailer-9x16-v5.mp4`](dist/open-days-trailer-9x16-v5.mp4) | Même son que la V3 ; illustration 3D (three.js) en vert et gris du logo, sans photo |
| V4 « Trailer photos » (9:16, voix off) | [`dist/open-days-trailer-9x16-v4.mp4`](dist/open-days-trailer-9x16-v4.mp4) | Même son que la V3 ; cartons Cinzel sur noir, texture pellicule, bandes cinéma, deux photos réelles de JADE (une apparition chacune) |

V1 et V2 sont en 1920×1080, V3 à V7 en 1080×1920 ; toutes à 30 i/s, H.264 + AAC stéréo, 35 s.

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

## V3 « Trailer » — découpage

| Temps | Image | Texte à l'écran | Voix off (posée à) |
|---|---|---|---|
| 0 – 5 s | Noir, pulsation verte, poussière lumineuse | QUELQUE CHOSE SE PRÉPARE… | « Et si le futur était plus proche qu'on ne l'imagine ? » (1,0 s) |
| 5 – 10 s | Pistes de circuit qui convergent, caméra qui tourne et avance | LES IDÉES SE CONNECTENT. | « Là où les idées se rencontrent… » (6,0 s) |
| 10 – 16 s | Montage : code, réseau de neurones, Madagascar ; mots-chocs | INNOVER · PARTAGER · INSPIRER | « Une nouvelle génération ose imaginer demain. » (10,5 s) |
| 16 – 23 s | Particules qui forment une sphère 3D, salle de conférence, tension | UNE NOUVELLE ÉDITION APPROCHE. | « Le rendez-vous des passionnés de technologie revient. » (17,5 s) |
| 23 – 29 s | 0,5 s de noir et de silence, flash, révélation | OPEN DAYS · PROCHAINE ÉDITION | « OPEN DAYS… Une nouvelle édition arrive ! » (24,2 s) |
| 29 – 35 s | Logo JADE dans la lumière, puis fondu au noir | OPEN DAYS · ONG JADE MADAGASCAR · COMING SOON · RESTEZ CONNECTÉS | « Préparez-vous. Le futur nous rassemble. OPEN DAYS. ONG JADE Madagascar. » (29,25 s →) |

- La voix (`assets/voice/voix-off-elevenlabs-hugo.mp3`) est découpée phrase par phrase ; les bornes et les instants de pose sont dans `src/v3/timeline.js`. La musique baisse d'environ 8 dB pendant chaque phrase.
- Le logo officiel OPEN DAYS n'a pas été fourni : le titre est typographique. Déposer le logo dans `src/v3/media/open-days-logo.png` suffit pour qu'il remplace le titre (aperçu et rendu).
- Aperçu interactif (lecture/pause, volume, scènes et répliques cliquables) : `src/v3/trailer.html`.

## V4 « Trailer photos » — ce qui change

Même découpage, même voix off et même musique que la V3 (`src/v3/timeline.js`, `src/v3/media/trailer-audio.mp3`). L'image change entièrement :

- cartons de bande-annonce en Cinzel (police libre OFL, `src/v3/media/fonts/`), lettres qui apparaissent une à une ;
- texture pellicule : grain, poussières, rayures, léger flottement de projecteur ;
- 10 – 13 s : photo de l'atelier électronique, en carte nette sur fond flou de la même photo, avec poussée lente ;
- 16 – 20,3 s : photo de la promotion, en bandeau panoramique avec un travelling sur tout le groupe ;
- 21 – 23 s : les bandes noires se referment jusqu'au silence, puis s'ouvrent sur OPEN DAYS ;
- écran final sur noir, logo JADE intact sur une plaque blanche, fermeture finale en bandes.

Chaque photo n'apparaît qu'une seule fois. Originaux dans `assets/photos/`, versions préparées dans `src/v3/media/`.

```bash
node src/render.js --page src/v3/trailer-v4.html --audio build/soundtrack-v3.wav --out dist/open-days-trailer-9x16-v4.mp4
```

## V5 « Trailer 3D » — ce qui change

Même découpage, même voix off et même musique que la V3. L'image est une vraie scène 3D (three.js r147, `src/v3/lib/`, licence MIT), uniquement en vert `#116D30` / `#2FA455` et gris `#9B9C97` / `#D9DAD6` :

- 0 – 5 s : une graine verte lumineuse bat au rythme du cœur, un anneau gris en croissant (celui du logo) tourne autour ;
- 5 – 10 s : des cubes et des sphères (les idées) apparaissent et se relient à la graine, caméra en orbite ;
- 10 – 16 s : studio gris clair, plateau tournant avec un ordinateur (code), une puce, Madagascar en relief, puis une ampoule (INNOVER), le symbole de partage (PARTAGER) et une fusée qui décolle (INSPIRER) ;
- 16 – 23 s : salle de conférence 3D (scène, écran, public en silhouettes), la lumière baisse et la caméra fonce vers l'écran ;
- 23,5 – 29 s : l'emblème du logo se construit en 3D (anneau, tige, trois feuilles) au-dessus d'OPEN DAYS en lettres en relief ;
- 29 – 35 s : studio clair, OPEN DAYS en relief vert, logo JADE officiel sans retouche, textes de clôture.

```bash
node src/render.js --page src/v3/trailer-v5.html --audio build/soundtrack-v3.wav --out dist/open-days-trailer-9x16-v5.mp4
```

## V6 « De la terre au futur » — ce qui change

Un seul plan continu en couches de parallaxe, uniquement en teintes du logo (vert, gris, blanc, noir) :

| Temps | Image | Texte | Musique |
|---|---|---|---|
| 0 – 5 s | Nuit étoilée, silhouettes de baobabs sur les collines | QUELQUE CHOSE SE PRÉPARE… | Grillons, battement grave, notes de valiha isolées |
| 5 – 10 s | Le soleil se lève, des lucioles montent de la terre et se relient | LES IDÉES SE CONNECTENT. | Arpège de valiha qui monte avec le soleil, cordes |
| 10 – 16 s | Rizières en terrasses, pousses du logo, jeunes qui marchent ; lumière qui court sur les terrasses, réseau entre les pousses, rayons du soleil | INNOVER · PARTAGER · INSPIRER | Groove 12/8 (tambours à main, hochet, guitare grattée) |
| 16 – 23 s | La ville se lève derrière les collines, le lieu du rendez-vous coiffé de l'anneau du logo, crépuscule et faisceaux | UNE NOUVELLE ÉDITION APPROCHE. | Montée, cordes et tambours qui accélèrent |
| 23 – 29 s | Noir et silence 0,5 s, puis nuit de fête : feux d'artifice, OPEN DAYS dans l'ellipse du logo | OPEN DAYS · PROCHAINE ÉDITION | Impact, chœur, refrain de valiha en sol majeur |
| 29 – 35 s | Aube claire sur les baobabs, logo JADE officiel | OPEN DAYS · ONG JADE MADAGASCAR · COMING SOON · RESTEZ CONNECTÉS | Accord final, arpège-signature |

```bash
python3 src/v3/soundtrack_v6.py build/soundtrack-v6.wav
ffmpeg -i build/soundtrack-v6.wav -c:a libmp3lame -b:a 192k src/v3/media/trailer-v6-audio.mp3
node src/render.js --page src/v3/trailer-v6.html --audio build/soundtrack-v6.wav --out dist/open-days-trailer-9x16-v6.mp4
```

Police Poppins (licence OFL) dans `src/v3/media/fonts/`. Les instruments d'orchestre, la pose de la voix et le ducking sont partagés dans `src/synth.py`.

## V7 « L'écran » — ce qui change

L'image entière est l'écran d'un téléphone (interface générique aux couleurs JADE, aucune marque de réseau social ; messages et prénoms fictifs) :

| Temps | Écran | Texte |
|---|---|---|
| 0 – 5 s | Écran verrouillé à 23:59, deux notifications avec vibration, on balaie pour ouvrir | Quelque chose se prépare… |
| 5 – 10 s | Discussion « Communauté tech » : on écrit, les bulles arrivent | LES IDÉES SE CONNECTENT. |
| 10 – 13 s | Fil qui défile : publications Programmation, IA, Madagascar, cœurs qui s'allument | #Programmation · #IntelligenceArtificielle · #JeunesseMalgache |
| 13 – 16 s | Stories plein écran, touchées une à une | INNOVER · PARTAGER · INSPIRER |
| 16 – 23 s | Page d'événement qui charge, avalanche de notifications de plus en plus rapide, l'écran s'éteint (ligne puis noir) | UNE NOUVELLE ÉDITION APPROCHE. |
| 23,5 – 29 s | L'écran se rallume à 00:00 sur OPEN DAYS, confettis, notification | OPEN DAYS · PROCHAINE ÉDITION |
| 29 – 35 s | Page de JADE : logo officiel, bouton « Restez connectés » touché, carte de l'événement, « Me rappeler » touché | ONG JADE MADAGASCAR · COMING SOON · RESTEZ CONNECTÉS |

Son : la bande-son de la V3 (importée telle quelle depuis `src/v3/soundtrack.py`) plus les sons d'interface synthétisés (notifications, vibrations, frappe, bulles, défilement, touches).

```bash
python3 src/v3/soundtrack_v7.py build/soundtrack-v7.wav
ffmpeg -i build/soundtrack-v7.wav -c:a libmp3lame -b:a 192k src/v3/media/trailer-v7-audio.mp3
node src/render.js --page src/v3/trailer-v7.html --audio build/soundtrack-v7.wav --out dist/open-days-trailer-9x16-v7.mp4
```

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

# Version 3 (9:16, voix off) :
python3 src/v3/soundtrack.py build/soundtrack-v3.wav
node src/render.js --page src/v3/trailer.html --audio build/soundtrack-v3.wav --out dist/open-days-trailer-9x16.mp4
ffmpeg -i build/soundtrack-v3.wav -c:a libmp3lame -b:a 192k src/v3/media/trailer-audio.mp3

# Images de contrôle à des instants précis :
node src/render.js --stills 3.6,12.4,31.5            # -> build/still-*.jpg
```

Aperçu interactif : `python3 -m http.server` à la racine, puis ouvrir `http://localhost:8000/src/teaser.html` (V1) `http://localhost:8000/src/v2/teaser.html` (V2), `http://localhost:8000/src/v3/trailer.html` (V3), `http://localhost:8000/src/v3/trailer-v4.html` (V4) `http://localhost:8000/src/v3/trailer-v5.html` (V5), `http://localhost:8000/src/v3/trailer-v6.html` (V6) ou `http://localhost:8000/src/v3/trailer-v7.html` (V7).
