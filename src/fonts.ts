import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Polices hébergées localement (public/fonts) : le rendu fonctionne
 * hors ligne et reste identique d'une machine à l'autre.
 * Montserrat, Pacifico et Caveat sont sous licence SIL Open Font License.
 */
export const DISPLAY = 'Montserrat';
export const SCRIPT = 'Pacifico';
export const HAND = 'Caveat';

loadFont({family: DISPLAY, url: staticFile('fonts/Montserrat-variable.woff2'), weight: '100 900'});
loadFont({family: SCRIPT, url: staticFile('fonts/Pacifico-400.woff2'), weight: '400'});
loadFont({family: HAND, url: staticFile('fonts/Caveat-variable.woff2'), weight: '400 700'});
