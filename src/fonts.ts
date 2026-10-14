import {continueRender, delayRender, staticFile} from 'remotion';

// Montserrat (variable, SIL Open Font License) servie localement depuis /public/fonts
export const FONT = 'Montserrat';

if (typeof document !== 'undefined') {
	const handle = delayRender('Chargement de la police Montserrat');
	const face = new FontFace(FONT, `url(${staticFile('fonts/Montserrat.ttf')}) format('truetype')`, {
		weight: '100 900',
	});
	face
		.load()
		.then((f) => {
			(document.fonts as unknown as {add: (f: FontFace) => void}).add(f);
			continueRender(handle);
		})
		.catch((err) => {
			console.error(err);
			continueRender(handle);
		});
}
