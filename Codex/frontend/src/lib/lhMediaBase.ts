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
 * In dev, audio/SFX files resolve to the local Vite server (window.origin + BASE_URL)
 * so locally-added assets in public/ work immediately without a CDN push.
 * In prod, they resolve to the GitHub Pages CDN (or VITE_LH_MEDIA_BASE_URL override).
 */
export function resolveLhAssetUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const clean = trimmed.replace(/^\/+/, '');
  // In local dev, serve from the Vite dev server so files in public/ are immediately
  // available without waiting for a GitHub Pages deployment.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${getLhDevVitePublicBaseUrl()}${clean}`;
  }
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
