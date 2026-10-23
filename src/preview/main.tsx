import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Ad } from '../Ad';
import { Ad2 } from '../v2/Ad2';
import { DEFAULT_ASSETS, DEFAULT_CONTENT } from '../defaults';
import { loadFonts } from '../fonts';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
// Les polices sont chargées avant le premier rendu pour éviter tout saut de mise en page.
loadFonts()
  .catch(() => undefined)
  .finally(() => {
    // ?still=12.5 affiche une image fixe pleine résolution (contrôle qualité, captures).
    const q = new URLSearchParams(location.search);
    const still = q.get('still');
    const Comp = q.get('v') === '1' ? Ad : Ad2;
    root.render(still !== null ? <Comp t={Number(still)} content={DEFAULT_CONTENT} assets={DEFAULT_ASSETS} /> : <App />);
  });
