import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build autonome (un seul fichier HTML, polices et logo inclus) pour l'aperçu partageable.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 4000 },
  server: { host: true },
});
