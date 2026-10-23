import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Ad } from '../Ad';
import { DEFAULT_ASSETS, DEFAULT_CONTENT } from '../defaults';
import { loadFonts } from '../fonts';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
// Les polices sont chargées avant le premier rendu pour éviter tout saut de mise en page.
loadFonts()
  .catch(() => undefined)
  .finally(() => {
    // ?still=12.5 affiche une image fixe pleine résolution (contrôle qualité, captures).
    const still = new URLSearchParams(location.search).get('still');
    root.render(still !== null ? <Ad t={Number(still)} content={DEFAULT_CONTENT} assets={DEFAULT_ASSETS} /> : <App />);
  });
