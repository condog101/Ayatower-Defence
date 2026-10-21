import { defineConfig } from 'vite';

// Stamped onto sprite URLs (Boot.ts) so a new deploy never shows a browser-cached old sheet.
process.env.VITE_BUILD_ID ??= Date.now().toString(36);

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
