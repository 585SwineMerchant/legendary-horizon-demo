import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/legendary-horizon-demo/',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@samples': path.resolve(__dirname, '../data/samples'),
      // Single source of truth with Phaser (`publicAssetUrl('assets/maps/…')`) so triggers stay in sync.
      '@maps': path.resolve(__dirname, 'public/assets/maps'),
    },
  },
});
