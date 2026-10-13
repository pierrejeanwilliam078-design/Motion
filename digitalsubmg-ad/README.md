# DigitalSubMG — The Future of Premium Access

Publicité motion design de 30 s pour [digitalsub.org](https://www.digitalsub.org/), construite avec **Remotion 4 · React · TypeScript**.

- 1080 × 1920 (9:16) · 60 i/s · 1 800 images · exactement 30 s
- MP4 H.264 + AAC stéréo → `out/digitalsubmg-ad.mp4`
- Musique originale synthétisée à 128 BPM (64 temps = 30 s), sound design synthétisé, voix off ElevenLabs fournie

## Lancer le projet

```bash
npm install
npm run dev              # Remotion Studio : aperçu interactif, timeline des scènes et des sons
npm run render           # export final MP4 (out/digitalsubmg-ad.mp4)
npm run render:preview   # aperçu rapide en demi-résolution
npm run sheet            # planche contact PNG de 16 images clés
```

Pour régénérer les ressources (recadrages, découpe de la voix, musique, effets) : `npm run assets`.
Ce script nécessite Python 3 avec `numpy`, `scipy` et `Pillow`, ainsi que `ffmpeg`.

Si Chrome Headless ne peut pas être téléchargé, ajoutez `--browser-executable=/chemin/vers/chrome` aux commandes de rendu.

## Structure

```
src/
  DigitalSubAd.tsx          composition : 8 scènes qui se chevauchent + pistes audio
  lib/timing.ts             grille musicale (B(beat) → image), bornes des scènes
  lib/theme.ts              couleurs de marque, polices locales (public/fonts)
  data/voice-cues.json      placement de chaque phrase de la voix off (source unique, aussi lue par Python)
  components/
    AnimatedLogo.tsx        logo officiel sur plaque blanche + mot-symbole
    KineticText.tsx         KineticText, CurvedText (mots courbés), RingText (anneau 3D), MotionTrail (flou directionnel)
    ProductCard3D.tsx       cartes produits 3D (épaisseur, reflet, balayage lumineux), Box3D
    PhoneMockup.tsx         smartphone + reproduction du catalogue digitalsub.org
    PaymentBadges.tsx       capsules MVola / Orange Money / Airtel Money
    BeatTransition.tsx      masques d'entrée (iris, diagonale, volet courbe, carte → plein écran)
    BackgroundEnvironment.tsx  décor, lumière, grille de points, Stage3D / Node3D, LightSweep
    SoundEffects.tsx        SoundEffects (cues image par image), VoiceOver, Music (ducking sous la voix)
    FinalBrandReveal.tsx    scène finale
  scenes/S01…S08            une scène par fichier
scripts/
  prepare_assets.py         recadrage des captures, extraction du logo, découpe de la voix
  generate_audio.py         musique 128 BPM + 18 effets sonores
  contact-sheet.mjs         planche contact de vérification
public/                     images, polices, audio
assets-src/                 captures sources (hero, « Pourquoi », catalogue)
```

## Timeline (temps musicaux à 128 BPM)

| Scène | Temps | Secondes | Entrée | Voix off |
|---|---|---|---|---|
| 01 Hook | b0–b6 | 0,0–2,8 | ligne lumineuse → PREMIUM s'ouvre puis pivote à la verticale | « Des abonnements premium. En un clic. » |
| 02 Reveal | b6–b11 | 2,8–5,2 | iris depuis l'impulsion cyan | « Bienvenue chez DigitalSubMG ! » |
| 03 Produits | b11–b22 | 5,2–10,3 | volet diagonal ; 1 produit par 2 temps | « Netflix. Prime Video. ChatGPT. Spotify. Canva Pro ! » |
| 04 Un clic | b22–b30 | 10,3–14,1 | volet courbe vers le haut | « Choisissez votre offre, simplement. » |
| 05 Paiement | b30–b41 | 14,1–19,2 | le bouton « Choisir » devient la scène | « Payez en ariary avec MVola, Orange Money ou Airtel Money. » |
| 06 Confiance | b41–b49 | 19,2–23,0 | panoramique filé | « Activation rapide. Paiement sécurisé. Assistance WhatsApp. » |
| 07 500+ | b49–b53 | 23,0–24,8 | la carte « 500+ » du site s'étend | « Plus de cinq cents clients ! » |
| 08 Final | b53–b64 | 24,8–30,0 | micro-silence, halo cyan | « DigitalSubMG. Vos abonnements premium en un clic. Digitalsub point org ! » |

La voix off n'est jamais accélérée. Chaque phrase est découpée dans le fichier ElevenLabs puis placée de façon que son mot clé tombe sur un temps.
Exemples : « premium » sur b2, « MVola » sur b35, « rapide » sur b43, « digitalsub » sur b60.
La musique est atténuée d'environ 8 dB pendant chaque phrase.

## Points à valider avant diffusion

1. **Logo HD.** Le logo provient de la capture du site, où il ne mesure qu'environ 70 px de large. Il reste donc un peu flou à l'écran. Remplacez `public/brand/logo.png` par le fichier original (PNG transparent) : il est repris automatiquement partout.
2. **Canva Pro.** Aucun visuel ni prix de Canva Pro ne figurait dans les captures. La boîte 3D affiche donc le nom en typographie, sans reproduire le logo Canva, et aucun prix. Fournissez le visuel du site pour l'utiliser comme les quatre autres produits.
3. **Données personnelles.** Les captures du tableau de commandes (noms de clients) n'ont été ni copiées dans le projet ni utilisées dans la vidéo.
4. **Marques tierces.** Netflix, Prime Video, ChatGPT, Spotify, Canva, MVola, Orange Money et Airtel Money sont des marques de leurs propriétaires respectifs. Seuls les visuels produits déjà publiés sur digitalsub.org sont utilisés, et aucun logo d'opérateur n'est redessiné.
5. **Textes et prix.** Ils reprennent le site : 500+ clients, prix « à partir de », textes de la section « Pourquoi DigitalSubMG ? ». Mettez-les à jour s'ils changent.
6. **Mixage.** La musique et les effets sont générés par synthèse (code dans `scripts/generate_audio.py`), sans échantillon sous licence. Pour une musique sous licence, remplacez `public/audio/music.wav` par un fichier de 30 s à 128 BPM, en gardant le drop sur b6 et le silence entre b52,5 et b54.

## Licences des polices

Archivo Black, Space Grotesk et Inter Tight proviennent de Google Fonts, sous licence SIL Open Font License 1.1. Elles sont incluses dans `public/fonts`.
