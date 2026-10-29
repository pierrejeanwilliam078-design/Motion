# Timeline — Publicité Miarina Media (55 s · 30 fps · 1 650 frames)

La timeline est **calée sur la voix off fournie** (`public/audio/voix-off.mp3`, 51,4 s), démarrée à 0,5 s.
Source de vérité : `src/data/timeline.json` (scènes, repères musicaux, effets sonores) et
`src/data/captions.json` (texte et horodatage mot à mot de la voix).

## Les neuf scènes

| # | Scène | Début → fin | Frames | Visuel | Texte à l'écran | Voix off (telle qu'enregistrée) | Sons |
|---|---|---|---|---|---|---|---|
| 1 | Hook | 00:00,0 → 00:03,8 | 0 → 114 | Tuile Play turquoise + onde sonore, zoom d'ouverture, aberration chromatique, glitch au changement de phrase, traversée de l'icône | UNE VIDÉO À GARDER ? / UN SON À ÉCOUTER PARTOUT ? | « Une vidéo à garder ? Un son à écouter partout ? » | whoosh, pops |
| 2 | Révélation | 00:03,8 → 00:07,75 | 114 → 233 | Assemblage du logo, dévoilement du nom, montée de la fenêtre Accueil (capture 2) en perspective | Miarina Media · Simple. Pratique. **Gratuit.** | « Découvrez Miarina Media. Simple, pratique et gratuit. » | whoosh, pop, entrée des percussions |
| 3 | Navigateur intégré | 00:07,75 → 00:13,8 | 233 → 414 | Fenêtre qui glisse au centre, raccourcis YouTube puis Facebook mis en valeur, autres raccourcis, zoom sur la barre d'adresse, curseur + clic + saisie | NAVIGATEUR INTÉGRÉ | « Explorez YouTube, Facebook et d'autres plateformes compatibles directement depuis son navigateur intégré. » | pops, clic |
| 4 | Coller un lien | 00:13,8 → 00:18,85 | 414 → 566 | Capture Accueil zoomée : pastille « lien copié », clic Paste, lien qui s'écrit dans le champ, clic Analyze, impulsion et balayage turquoise | COPIEZ. COLLEZ. ANALYSEZ. | « Ou tout simplement, copiez un lien, collez-le dans Miarina Media et lancez l'analyse. » | pop, 2 clics |
| 5 | Choix du format | 00:18,85 → 00:24,05 | 566 → 722 | Animation graphique : fichier vidéo central, cartes VIDÉO / AUDIO MP3, le fichier se transforme en onde sonore | VIDÉO OU MP3 | « Choisissez votre format. Vidéo haute qualité ou audio MP3, selon vos envies. » | 2 pops |
| 6 | Téléchargement | 00:24,05 → 00:29,55 | 722 → 887 | Capture Downloads zoomée : progression illustrative 0 → 58 %, clic « Pause all », état pause, clic « Resume all », 100 %, coche de réussite + particules | VOUS GARDEZ LE CONTRÔLE | « Suivez vos téléchargements en temps réel, mettez-les en pause et reprenez-les en un seul clic. » | 2 clics, notification de réussite |
| 7 | Bibliothèque | 00:29,55 → 00:34,7 | 887 → 1041 | Zoom sur la carte Library de la capture Accueil, lignes Video/Audio surlignées, symbole Play, pastilles Vidéos · Audio · Lecture intégrée · Hors connexion | VOS MÉDIAS. PARTOUT. | « Retrouvez tous vos fichiers dans votre bibliothèque et profitez-en même sans connexion internet. » | pops |
| 8 | L'argument principal | 00:34,7 → 00:43,5 | 1041 → 1305 | WINDOWS + ANDROID, puis trois lignes « SANS » barrées ; ralenti et assombrissement ; **GRATUIT !** en très grand avec flash, tremblement, ondes de choc, particules | WINDOWS + ANDROID · SANS COMPTE · SANS PUBLICITÉ · SANS ABONNEMENT · **GRATUIT !** | « Disponible sur Windows et Android. Sans compte, sans publicité et sans abonnement. Et le meilleur dans tout ça ? C'est totalement gratuit ! » | pops, coupure musicale + montée, **impact** à 42,44 s |
| 9 | Appel à l'action + end card | 00:43,5 → 00:55,0 | 1305 → 1650 | Site media.miarina.org (capture 1) dans une fenêtre de navigateur, adresse qui s'écrit, zoom sur les boutons Windows/Android ; puis end card bleu-noir : logo avec glow, nom, slogan, adresse, « Téléchargez Miarina Media », fondu au noir | Miarina Media · Your media. **Your freedom.** · media.miarina.org · Téléchargez Miarina Media · Gratuit | « Alors, qu'attendez-vous ? Rendez-vous dès maintenant sur media.miarina.org. Miarina Media. Your media. Your freedom. » | whoosh, pop, outro musicale, fondu |

## Écarts assumés par rapport au brief

- **Durées des scènes ajustées à la voix réelle.** La voix off fournie diffère légèrement du script du brief
  (formulations plus longues et une phrase d'appel à l'action en plus : « Alors, qu'attendez-vous ?
  Rendez-vous dès maintenant sur media.miarina.org »). Les scènes suivent donc la voix, à ±0,3 s des
  bornes prévues, sauf la scène 9 qui démarre à 43,5 s au lieu de 52 s pour accueillir ce passage.
  L'end card proprement dite (logo + slogan) occupe 47,9 s → 55 s.
- **Capture 4 (navigateur intégré) non reçue** — seules quatre images ont été jointes, dont deux
  identiques (capture 2 en double, capture 3 « lien collé » absente). La scène 3 affiche donc une
  **illustration simplifiée** clairement étiquetée « illustration simplifiée » ; dès que
  `public/captures/navigateur.png` est déposé, la vraie capture la remplace automatiquement (voir README).
  L'état « lien collé » de la scène 4 est recréé par un calque animé sur la capture 2.
- **Sous-titres** : les phrases déjà écrites en grand à l'écran (scènes 1, 2, 8 et 9) ne sont pas
  doublées par la barre de sous-titres ; elles restent présentes dans le fichier SRT.

## Repères musicaux (`timeline.json → music`)

| Repère | Temps | Effet |
|---|---|---|
| Intro | 0 → 3,9 s | Pads + arpège filtré, sans percussion |
| `drumsIn` | 3,94 s | Entrée du groove (120 BPM) sur la révélation du logo |
| `breakdown` | 40,3 s | Coupure des percussions, montée (« ralentir la musique ») sur « Et le meilleur dans tout ça ? » |
| `drop` | 42,44 s | Retour du groove exactement sur le mot « gratuit » + impact |
| `outro` | 48,44 s | Pads et arpège seuls sur l'end card |
| Fondu | 52 → 55 s | Fondu de sortie |
