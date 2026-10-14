/**
 * Polices sous licence SIL Open Font License 1.1 (usage commercial autorisé),
 * embarquées localement via Fontsource : aucun appel réseau au rendu.
 * useFontsReady() bloque le rendu tant que les polices ne sont pas chargées.
 */
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/900.css';
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/** Attend le chargement effectif des polices avant toute mesure typographique. */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Polices GSN'));
  useEffect(() => {
    const sample = 'AÀÉÈ0123456789?';
    Promise.all([
      document.fonts.load('700 120px "Space Grotesk"', sample),
      document.fonts.load('500 120px "Space Grotesk"', sample),
      document.fonts.load('400 40px "Inter"', sample),
      document.fonts.load('500 40px "Inter"', sample),
      document.fonts.load('600 40px "Inter"', sample),
      document.fonts.load('700 40px "Inter"', sample),
      document.fonts.load('700 120px "Unbounded"', sample),
      document.fonts.load('900 120px "Unbounded"', sample),
    ])
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

