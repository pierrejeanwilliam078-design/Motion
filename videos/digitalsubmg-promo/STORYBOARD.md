---
format: 1080x1920
duration: 45s
message: "Vos abonnements premium en un clic — payés en Ariary, activés en moins de 2 min"
arc: Hook → Promesse → Produits → Achat → Preuves → Paiement local → Activation → Confiance → CTA
audience: Jeunes adultes et actifs à Madagascar
mode: autonomous
music: none
bpm: 128
---

# DigitalSubMG — Premium Access Motion Ad

Music and SFX are one original host-generated mix (`assets/audio/digitalsubmg-mix.wav`, 128 BPM, 1 bar = 1.875 s), so `music: none` here and the bed is listed in `audio_meta.json` as host audio. Every frame starts on a bar downbeat. Frames are joined by hard cuts; each frame opens on the visual state the previous one closes on (in-frame transitions: ribbon wipe, glow bloom, whip zoom, zoom-through, morph).

## Video direction

Dark premium tech. Ground #05060A with midnight-blue radial glows; colour only as light (cyan → electric blue → violet → magenta ribbon). Frosted-glass cards, Inter 800/900 headlines, quiet grey Inter 500 support lines. Easing: expo.out for entrances, power3.inOut for moves, back.out(1.4) for small objects landing. Max 7 words on screen. Light film grain throughout. Key text between y 220 and y 1500.

## Frame 1 — Hook étincelle

- scene: A cyan spark in the dark, a shockwave, light fragments converge and the logo symbol paints in; three dots drop in.
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- blueprint: compose
- focal: assets/brand/logo-symbol.png
- roles: logo-symbol — cutout hero; logo-wordmark — supporting

Scene 1 (0.0–0.3s): black, a cyan point blooms at centre with a thin ring shockwave → Scene 2 (0.3–1.6s): ~24 coloured light fragments converge to the centre (expo.out) → Scene 3 (1.6–2.4s): the ribbon symbol reveals bottom-up through a mask with a soft glow → Scene 4 (2.4–2.9s): three dots land (back.out), the wordmark slides in beside → Scene 5 (2.9–3.75s): slow 6% push-in; at 3.5s a vertical light seam opens the frame upward.

## Frame 2 — Message principal

- scene: Kinetic headline "Vos abonnements premium en un clic" word by word; a cursor clicks "en un clic".
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/02-message.html
- blueprint: compose

Scene 1 (0.0–0.5s): the light seam from frame 1 fades into a midnight-blue floor glow; pill badge "N°1 À MADAGASCAR" drops in → Scene 2 (0.3–1.6s): headline words rise from masks with blur → 0, 70 ms stagger; "premium" lands last in cyan→violet gradient → Scene 3 (1.85s): a cursor glides in and taps "en un clic" — cyan ripple → Scene 4 (2.25–3.4s): subline "Netflix, Prime Video, ChatGPT, Spotify et plus" fades up; slow dolly-in 1.00→1.08 → Scene 5 (3.4–3.75s): the ripple grows into a soft blue bloom that fills the frame.

## Frame 3 — Univers produits

- scene: Five frosted-glass service cards float in 3D (Netflix, Prime Video, ChatGPT, Spotify, Canva Pro), headline "Tous vos services. Un seul endroit."
- duration: 5.625s
- transition_in: cut
- status: animated
- src: compositions/frames/03-produits.html
- blueprint: compose

Scene 1 (0.0–0.3s): blue bloom clears on the drop → Scene 2 (0.0–2.35s): one card per beat (0.47s) flies in from depth (z −1200 → 0, rotateY 25° → 8°) with its brand-tinted glow and a shimmer → Scene 3 (2.35–5.0s): cards float (±6px, ±2°), slow orbit of the group; at 3.75s the headline "Tous vos services." + "Un seul endroit." (cyan) rises at the top → Scene 4 (5.0–5.625s): whip zoom into the Netflix card (motion blur), handing off to the phone screen of frame 4.

## Frame 4 — Achat en 3 gestes

- scene: A floating phone shows the site; three taps on the beat: Découvrir les offres → Netflix Premium 4K → Ajouter au panier; steps 1 Choisissez · 2 Payez · 3 Profitez.
- duration: 5.625s
- transition_in: cut
- status: animated
- src: compositions/frames/04-achat.html
- blueprint: compose

Scene 1 (0.0–0.4s): the phone resolves out of the zoom blur, rotateY −6° → +4° across the frame → Scene 2 (0.0s tap 1): "Découvrir les offres →" pressed, screen slides to the offer grid; step "1 · Choisissez" lights → Scene 3 (1.875s tap 2): Netflix Premium 4K card selected, product sheet with 19 600 Ar; step "2 · Payez" lights → Scene 4 (3.75s tap 3): "Ajouter au panier" pressed, cart badge 0 → 1; step "3 · Profitez" lights → Scene 5 (4.6–5.625s): headline "Commander en 3 gestes" (gradient on "3 gestes"); UI tiles detach and fly outward at the end.

## Frame 5 — Pourquoi DigitalSubMG ?

- scene: Dark bento grid of five benefit cards with line icons — Activation instantanée, Paiement sécurisé, Support WhatsApp 24/7, 500+ clients, Prix accessibles.
- duration: 7.5s
- transition_in: cut
- status: animated
- src: compositions/frames/05-avantages.html
- blueprint: compose

Scene 1 (0.0–0.6s): title "Pourquoi DigitalSubMG ?" → Scene 2 (0.94–4.7s): one card every two beats (0.94s): slide 60px + fade, icon draws, the active card's border turns cyan; "500+" counts 0 → 500 → Scene 3 (5.65s): the whole grid lights on the downbeat → Scene 4 (5.65–7.5s): pull-out 10%; final 0.5s zoom-through into the shield of "Paiement sécurisé".

## Frame 6 — Paiement simple en Ariary

- scene: "Paiement simple en Ariary" with Airtel Money, MVola, Orange Money capsules dropping in; a payment card counts to 19 600 Ar and a green check draws.
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/06-paiement.html
- blueprint: compose

Scene 1 (0.0–0.5s): shield glow clears into a warm midnight-blue field; headline rises, "Ariary" shimmers cyan → Scene 2 (0.47–1.4s): three capsules drop one per beat (back.out) → Scene 3 (1.4–2.85s): payment mini-card, amount counts to 19 600 Ar → Scene 4 (2.85s): green check draws; subline "Sans carte bancaire." → Scene 5 (3.4–3.75s): check scales up toward the first progress step of frame 7.

## Frame 7 — Activation rapide

- scene: Order card "Client · Netflix Premium 4K" with a 4-step progress line Confirmée → Payée → En préparation → Livrée, timer 01:47, badge "✓ Validé", notification "Vos accès sont prêts".
- duration: 5.625s
- transition_in: cut
- status: animated
- src: compositions/frames/07-activation.html
- blueprint: compose

Scene 1 (0.0–0.5s): headline "Activation rapide" → Scene 2 (0.47–2.35s): progress line fills in cyan, one step lights per beat with a pulse; timer counts to 01:47 → Scene 3 (3.75s): "✓ Validé" badge pops; label "Activation en moins de 2 min" → Scene 4 (4.2–5.0s): a notification "DigitalSubMG — Vos accès sont prêts" slides down with a soft bounce → Scene 5 (5.0–5.625s): notification lifts and morphs toward frame 8.

## Frame 8 — Preuve sociale

- scene: Breathing moment — giant "500+" counting up, 4,7 ★ stars filling, blurred review bubbles drifting, line "Des centaines de clients nous font confiance".
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/08-confiance.html
- blueprint: compose

Scene 1 (0.0–1.2s): "500+" counts 0 → 500 with a breathing glow → Scene 2 (0.9–1.6s): five stars fill left to right, "4,7" → Scene 3 (1.4–3.2s): the trust line fades up; blurred review bubbles drift on three depth layers → Scene 4 (3.2–3.75s): bubbles and particles are pulled to the centre (reverse of frame 1).

## Frame 9 — CTA final

- scene: Royal-blue end card: logo forms, "Vos abonnements premium en un clic", white button "Découvrez nos offres →" tapped, "digitalsub.org" + WhatsApp pill.
- duration: 5.625s
- transition_in: cut
- status: animated
- src: compositions/frames/09-cta.html
- blueprint: compose
- focal: assets/brand/logo-full.png

Scene 1 (0.0–0.8s): ground shifts from black to royal blue #01328E with a radial halo; the logo symbol and wordmark reveal → Scene 2 (1.875s): signature line word by word → Scene 3 (2.8s): button rises; a final tap at 3.2s triggers a shimmer → Scene 4 (3.7s): "digitalsub.org" + WhatsApp pill fade up → Scene 5 (3.7–5.625s): held end card, 2% push-in.
