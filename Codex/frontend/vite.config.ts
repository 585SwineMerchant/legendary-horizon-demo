import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Baked into prod bundle so CI verify + runtime always resolve the release MP4. */
const LH_INTRO_RELEASE_VIDEO =
  'https://github.com/585swinemerchant/legendary-horizon-demo/releases/download/intro-media-v1/intro_davinci.web.mp4';

function gitShortHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const BUILD_COMMIT = gitShortHash();
const BUILD_DATE   = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

export default defineConfig(({ mode }) => ({
  base: '/legendary-horizon-demo/',
  define: {
    __LH_INTRO_RELEASE_VIDEO__: JSON.stringify(LH_INTRO_RELEASE_VIDEO),
    __LH_BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __LH_BUILD_DATE__:   JSON.stringify(BUILD_DATE),
    __LH_BUILD_MODE__:   JSON.stringify(mode),
  },
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@samples': path.resolve(__dirname, '../data/samples'),
      // Single source of truth with Phaser (`publicAssetUrl('assets/maps/…')`) so triggers stay in sync.
      '@maps': path.resolve(__dirname, 'public/assets/maps'),
    },
  },
}));
