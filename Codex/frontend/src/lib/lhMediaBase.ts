/**
 * Large binaries (intro MP4, future cutscenes) stay out of git.
 * HTML players ship in `public/`; video/audio resolve through this base URL.
 *
 * - Dev: same origin as Vite (`/legendary-horizon-demo/…`) so local gitignored MP4s work.
 * - Prod: GitHub Pages for the app bundle; set `VITE_LH_MEDIA_BASE_URL` to a release/CDN root.
 */
const DEFAULT_PROD_MEDIA_BASE = 'https://585swinemerchant.github.io/legendary-horizon-demo/';

/** GitHub Release tag used for intro + cutscene video binaries (upload separately). */
export const LH_INTRO_MEDIA_RELEASE_TAG = 'intro-media-v1';

export const LH_INTRO_MEDIA_RELEASE_BASE = `https://github.com/585swinemerchant/legendary-horizon-demo/releases/download/${LH_INTRO_MEDIA_RELEASE_TAG}/`;

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

/** Resolved media root (always ends with `/`). Uses GitHub Pages CDN by default so music/SFX URLs work in dev. */
export function getLhMediaBaseUrl(): string {
  const override = import.meta.env.VITE_LH_MEDIA_BASE_URL?.trim();
  if (override) return ensureTrailingSlash(override);
  return DEFAULT_PROD_MEDIA_BASE;
}

/** Vite origin for gitignored intro MP4s during local preview (not used for music). */
export function getLhDevVitePublicBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_PROD_MEDIA_BASE;
  const base = import.meta.env.BASE_URL || '/';
  const path = base.startsWith('/') ? base : `/${base}`;
  return ensureTrailingSlash(`${window.location.origin}${path}`);
}

/** Absolute URL for a path under the LH media base (or pass-through for full URLs).
 *
 * Resolution order:
 *  1. DEV mode (Vite dev server) → local Vite server so public/ assets work immediately.
 *  2. localhost in production mode (vite preview) → derive base from document.baseURI
 *     so Phaser loads maps/tilesets/audio from the local preview server, NOT the CDN.
 *     Note: vite-plugin-singlefile bakes import.meta.env.BASE_URL as "./" so we cannot
 *     use it here — document.baseURI reflects the actual serving URL.
 *  3. Otherwise (real GitHub Pages deploy) → DEFAULT_PROD_MEDIA_BASE (CDN).
 */
export function resolveLhAssetUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const clean = trimmed.replace(/^\/+/, '');

  if (typeof window !== 'undefined') {
    // DEV: use the Vite dev server (has HMR, correct base path from config)
    if (import.meta.env.DEV) {
      return `${getLhDevVitePublicBaseUrl()}${clean}`;
    }

    // LOCAL PRODUCTION PREVIEW: localhost in production build.
    // document.baseURI = window.location.href when no <base> tag is present.
    // This gives us the real serving base (e.g. http://localhost:4173/ or
    // http://localhost:4173/legendary-horizon-demo/) regardless of what
    // vite-plugin-singlefile baked into import.meta.env.BASE_URL.
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      const docBase = document.baseURI; // e.g. http://localhost:4173/legendary-horizon-demo/
      const dir = docBase.endsWith('/') ? docBase : docBase.slice(0, docBase.lastIndexOf('/') + 1);
      return `${dir}${clean}`;
    }
  }

  // Production / GitHub Pages: use CDN (or VITE_LH_MEDIA_BASE_URL override).
  return `${getLhMediaBaseUrl()}${clean}`;
}

/**
 * Video URL for cutscene players. GitHub Release assets are flat (no `assets/intro/` prefix).
 */
export function resolveLhCutsceneVideoUrl(videoPath: string): string {
  const trimmed = videoPath.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const introVideoOverride = import.meta.env.VITE_LH_INTRO_VIDEO_URL?.trim();
  if (introVideoOverride) return introVideoOverride;

  const file = trimmed.replace(/^\/+/, '').split('/').pop() || trimmed;

  // Local dev: gitignored MP4s under Vite `public/`. Prod: GitHub Release (not Pages git).
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${getLhDevVitePublicBaseUrl()}${trimmed.replace(/^\/+/, '')}`;
  }

  const baked = typeof __LH_INTRO_RELEASE_VIDEO__ === 'string' ? __LH_INTRO_RELEASE_VIDEO__ : '';
  if (baked) return baked;

  return `${LH_INTRO_MEDIA_RELEASE_BASE}${file}`;
}
