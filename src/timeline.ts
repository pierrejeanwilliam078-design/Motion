// Timeline de la publicité TIAVOYAGES — 30 s, 30 i/s, 1080 x 1920 (9:16)
// Musique à 120 BPM : 1 temps = 15 images. Chaque coupe tombe sur un temps.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 30 * FPS; // 900 images

export const sec = (s: number) => Math.round(s * FPS);

// Début de chaque scène (en images)
export const SCENE = {
	s1: 0, // 0:00 — Bienvenue à Dubaï
	s2: sec(4), // 0:04 — Votre voyage en quelques clics
	s3: sec(9), // 0:09 — Organisation et accompagnement
	s4: sec(14), // 0:14 — Transfert et confort
	s5: sec(19), // 0:19 — Dubaï à votre rythme
	s6: sec(25), // 0:25 — Signature de marque
	end: DURATION,
} as const;

// Voix off : fichiers découpés depuis l'enregistrement fourni (ElevenLabs — « Yann »)
// start = position du fichier dans la vidéo (s) ; speech = intervalle de parole réel (s)
export const VOICE = [
	{file: 'audio/vo/vo_c1.wav', start: 0.36, speech: [0.4, 2.78], text: 'Dubaï, oui… mais à votre façon.'},
	{file: 'audio/vo/vo_c2.wav', start: 4.23, speech: [4.4, 7.66], text: 'Chez TIAVOYAGES, tout se prépare simplement, selon vos envies.'},
	{file: 'audio/vo/vo_c3.wav', start: 9.26, speech: [9.4, 13.0], text: 'Visa, vols et hébergement : on vous accompagne à chaque étape.'},
	{file: 'audio/vo/vo_c4.wav', start: 14.29, speech: [14.4, 17.38], text: 'Et sur place, profitez de vos déplacements en toute sérénité.'},
	{file: 'audio/vo/vo_c5.wav', start: 19.24, speech: [19.35, 23.27], text: 'Découvertes, excursions, moments uniques… vous choisissez le rythme.'},
	{file: 'audio/vo/vo_c6a.wav', start: 25.51, speech: [25.65, 28.3], text: 'TIAVOYAGES. Votre Dubaï, sur mesure.'},
	{file: 'audio/vo/vo_c6b.wav', start: 28.39, speech: [28.5, 29.35], text: 'À vous de voyager !'},
] as const;

// Moments clés de l'animation (images)
export const CUE = {
	// scène 2 : apparition successive des cartes de l'interface
	cards: [sec(5.0), sec(5.4), sec(5.8), sec(6.2)],
	passport: sec(10.5),
	carDoor: sec(14.55),
	logo: sec(25.27),
};

// Effets sonores : fichier, image de départ, volume
export const SFX: {file: string; at: number; volume: number; duration?: number}[] = [
	{file: 'audio/sfx/cinematic_breath.wav', at: 0, volume: 0.55},
	// transition 1 : mouvement latéral (pic du souffle à +0,25 s)
	{file: 'audio/sfx/whoosh.wav', at: SCENE.s2 - 8, volume: 0.42},
	// interface : quatre micro-clics + pops doux
	...CUE.cards.flatMap((c) => [
		{file: 'audio/sfx/ui_click.wav', at: c, volume: 0.32},
		{file: 'audio/sfx/ui_pop.wav', at: c + 1, volume: 0.22},
	]),
	// transition 2 : passage d'avion stylisé (pic à +0,36 s)
	{file: 'audio/sfx/plane_pass.wav', at: SCENE.s3 - 11, volume: 0.45},
	{file: 'audio/sfx/airport_ambience.wav', at: SCENE.s3 - 4, volume: 0.22},
	{file: 'audio/sfx/glint.wav', at: CUE.passport + 3, volume: 0.22},
	// transition 3 : zoom
	{file: 'audio/sfx/whoosh.wav', at: SCENE.s4 - 8, volume: 0.38},
	{file: 'audio/sfx/car_door.wav', at: CUE.carDoor, volume: 0.24},
	// transition 4 : mouvement vertical
	{file: 'audio/sfx/whoosh_up.wav', at: SCENE.s5 - 8, volume: 0.4},
	{file: 'audio/sfx/wind_city.wav', at: SCENE.s5 - 4, volume: 0.2},
	// transition 5 et signature
	{file: 'audio/sfx/swoosh_soft.wav', at: SCENE.s6 - 10, volume: 0.32},
	{file: 'audio/sfx/shimmer.wav', at: SCENE.s6 - 2, volume: 0.22},
	{file: 'audio/sfx/sonic_logo.wav', at: CUE.logo, volume: 0.5},
];

export const COLORS = {
	blue: '#1D4FC4',
	blueDeep: '#123A9C',
	navy: '#0B2463',
	yellow: '#FFC61A',
	yellowDeep: '#F5A800',
	sky: '#EAF3FF',
	white: '#FFFFFF',
};
