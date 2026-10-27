// Version 3 « Trailer » (9:16, voix off) — découpage partagé par trailer.html et soundtrack.py.
// "voice" : [début dans le fichier source, fin dans le fichier source, instant de pose dans le trailer, texte prononcé].
// Les bornes source viennent de la détection des silences du fichier ElevenLabs (assets/voice/).
window.TIMELINE = {
  "duration": 35.0,
  "width": 1080,
  "height": 1920,
  "voice": [
    [0.00, 2.70, 1.00, "Et si le futur était plus proche qu'on ne l'imagine ?"],
    [3.33, 4.98, 6.00, "Là où les idées se rencontrent…"],
    [5.32, 7.73, 10.50, "Une nouvelle génération ose imaginer demain."],
    [8.02, 10.65, 17.50, "Le rendez-vous des passionnés de technologie revient."],
    [10.81, 13.21, 24.20, "OPEN DAYS… Une nouvelle édition arrive !"],
    [13.40, 14.21, 29.25, "Préparez-vous."],
    [14.41, 16.03, 30.20, "Le futur nous rassemble."],
    [16.24, 17.11, 31.85, "OPEN DAYS."],
    [17.26, 19.15, 32.70, "ONG JADE Madagascar."]
  ],
  "heartbeats": [0.5, 1.5, 2.5, 3.5, 4.5],
  "s1Text": 2.4,
  "circuits": 5.0,
  "s2Text": 7.7,
  "montage": [10.0, 11.2, 12.3],
  "words": [13.0, 13.9, 14.8],
  "sphere": 16.0,
  "conference": 19.0,
  "s4Text": 20.4,
  "silence": 23.0,
  "reveal": 23.5,
  "editionIn": 25.2,
  "light": 28.7,
  "final": 29.0,
  "jadeIn": 29.2,
  "comingIn": 30.4,
  "connectIn": 31.0,
  "openPulse": 31.95,
  "ongIn": 32.75,
  "fadeOut": 34.3
};
