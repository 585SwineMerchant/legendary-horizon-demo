import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Baked into prod bundle so CI verify + runtime always resolve the release MP4. */
const LH_INTRO_RELEASE_VIDEO =
  'https://github.com/585swinemerchant/legendary-horizon-demo/releases/download/intro-media-v1/intro_davinci.web.mp4';

export default defineConfig({
  base: '/legendary-horizon-demo/',
  define: {
    __LH_INTRO_RELEASE_VIDEO__: JSON.stringify(LH_INTRO_RELEASE_VIDEO),
  },
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@samples': path.resolve(__dirname, '../data/samples'),
      // Single source of truth with Phaser (`publicAssetUrl('assets/maps/…')`) so triggers stay in sync.
      '@maps': path.resolve(__dirname, 'public/assets/maps'),
    },
  },
});
