// Polices auto-hébergées (sous-ensemble latin) chargées via l'API FontFace :
// identiques dans l'aperçu et dans le rendu Remotion, sans dépendance réseau.
import inter from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2';
import geistMono from '@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2';

let loading: Promise<void> | null = null;

export function loadFonts() {
  if (!loading) {
    const faces = [
      new FontFace('Inter Variable', `url(${inter}) format('woff2')`, { weight: '100 900', display: 'block' }),
      new FontFace('Geist Mono', `url(${geistMono}) format('woff2')`, { weight: '500', display: 'block' }),
    ];
    loading = Promise.all(
      faces.map((f) =>
        f.load().then((loaded) => {
          document.fonts.add(loaded);
        }),
      ),
    ).then(() => undefined);
  }
  return loading;
}
