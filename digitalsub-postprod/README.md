# DigitalSub — publicité motion premium (v2)

Reprise de la vidéo « porte-parole » DigitalSub (HeyGen, 1082×1920, 25 i/s, 41 s) en publicité
sociale rythmée : kinetic typography, sous-titres redessinés, B-rolls motion design, transitions
par volets, sound design synchronisé et outro de marque.

Livrable : `deliverables/DigitalSub_v2.mp4` — H.264 High, 1082×1920, 25 i/s, 44,04 s,
AAC 320 kb/s 48 kHz, -14 LUFS / -1 dBTP.

Tous les textes à l'écran sont les mots du locuteur (transcription Whisper horodatée au mot,
`transcript/words.json`). Aucune parole n'est ajoutée, coupée ou reformulée ; l'ordre et la durée
de la voix sont intacts.

## Plan de montage

| Temps | Plan | Intervention |
|---|---|---|
| 0,0–2,4 | Face cam, poussée d'ouverture 1,16 → 1,06 | **Hook** : « Tu utilises » mot à mot, « ChatGPT » en très grand (scale + mise au point), « gratuitement ? » en cyan (révélation horizontale + interlettrage). Filet vertical cyan. Impact doux, tick, swipe. |
| 2,4–5,5 | Face cam, punch-out | Bloc typographique : « Le » + « payant » (violet, glissé), « n'est intéressant que / s'il te fait » mot à mot, « gagner plus. » en Black avec rebond et flèche ↗ dessinée. |
| 5,45–13,8 | **B-roll motion plein écran** (volet montant) | Liste animée : « ChatGPT peut t'aider à » puis 01 Rédiger, 02 Structurer des idées, 03 Analyser des informations, 04 Préparer un plan, 05 Accélérer certaines tâches, chaque item synchronisé au mot (glissé, interlettrage, barre active, séparateurs), récap final. Médaillon du locuteur en haut à droite. Ticks par item, sortie par glissement vers le haut. |
| 13,8–16,3 | Face cam serrée (1,11 → 1,125) | « Mais un abonnement payant » mot à mot, « n'est pas », « magique. » en Black avec interlettrage, soulignement dégradé. La pulsation musicale s'efface (break) ; impact grave. |
| 16,4–19,5 | Face cam, punch-out | Sous-titres premium (pastille verre dépoli, apparition mot à mot, mots-clés soulignés en couleur). |
| 19,45–25,15 | Face cam + **carte en verre** (overlay) | « et que les capacités / supplémentaires (violet) / disponibles dans la formule », trois jauges animées, « répondent à / un vrai besoin. » (cyan) + coche dessinée. |
| 25,1–32,3 | **B-roll motion plein écran** (volet latéral) | Comparaison en deux temps : « Un entrepreneur qui travaille avec l'IA chaque jour » + calendrier qui s'allume entièrement ; badge ≠ « n'a pas la même utilisation » ; « qu'une personne qui pose deux questions par mois. » + 2 cases seulement. Sortie par ouverture en deux volets sur le visage. |
| 32,3–37,35 | Face cam (logo mural visible) | Sous-titres premium (« DigitalSub » en gras cyan) ; trois cartes « options » qui glissent, balayage comparatif, sélection cochée sur « décider ». |
| 37,35–40,95 | Face cam + **CTA** | Panneau verre : « Écris », champ de commentaire où « ChatGPT » se tape lettre par lettre (curseur, frappes clavier), bouton d'envoi qui pulse, puis « si tu veux connaître l'offre disponible. » |
| 40,85–44,0 | **Outro** | Défocalisation + fondu ; fond bleu nuit, halo violet/cyan, logo officiel (mise au point, reflet), filet dégradé, `www.digitalsub.org` avec animation d'interlettrage, pause de lecture. Sound logo. |

## B-roll : ce qui a été fait, ce qui peut s'ajouter

L'environnement de production n'a accès à aucune banque d'images ou de vidéos ; les B-rolls sont
donc des **B-rolls motion design** conçus pour illustrer le discours (liste de capacités,
formule, comparaison chaque jour / deux fois par mois, options, champ de commentaire). Ils sont
100 % originaux. Si des plans réels sont souhaités (mains sur clavier, écran d'ordinateur,
entrepreneur au travail), ils peuvent remplacer ou passer derrière les cartes aux créneaux
25,1–32,3 s et 5,45–13,8 s.

## Son

Tout est synthétisé (aucun échantillon tiers, exploitable commercialement) :
- musique ambient en ré majeur, 96 BPM, pulsation douce avec break sur « pas magique »,
  atténuée automatiquement sous la voix (sidechain) ;
- 47 accents sonores calés sur les animations (`tools/cues.py`) : whooshs directionnels selon le
  volet, ticks, pops du calendrier, frappes clavier, envoi, impacts doux, scintillements ;
- sound logo : montée d'air → arpège de cloches FM + sub ;
- voix : passe-haut, débruitage léger, EQ, compression 2,5:1 ; master -14 LUFS / -1 dBTP.

## Reconstruire

Prérequis : `ffmpeg`, Python 3 + `numpy` + `Pillow`, polices Inter Display.

```bash
./build.sh /chemin/vers/HeyGen_-_AI_Spokesperson_Video_Creator_18.mp4   # -> out/DigitalSub_final.mp4
python3 tools/preview.py source.mp4 apercu.png 1.0 9.6 28.4             # planche d'images clés
```

| Fichier | Rôle |
|---|---|
| `tools/cues.py` | fenêtres des scènes et feuille des SFX (partagée image/son) |
| `tools/edit_v2.py` | rendu de la séquence principale (scènes, sous-titres, cartes, zooms) |
| `tools/mg.py` | boîte à outils motion design (easing, texte, formes, verre) |
| `tools/render_endcard.py` | outro logo + URL |
| `tools/make_audio.py` | musique, SFX, sound logo |
| `build.sh` | mixage, normalisation, assemblage et export |
