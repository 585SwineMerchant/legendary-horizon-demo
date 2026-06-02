import { getLhDevVitePublicBaseUrl, getLhMediaBaseUrl, resolveLhAssetUrl, resolveLhCutsceneVideoUrl } from './lhMediaBase';

/** One stamped caption line (matches intro-player / caption-stamper export). */
export type LhCutsceneCaption = {
  title: string;
  speaker: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
  skipped?: boolean;
};

export type LhCutsceneDef = {
  id: string;
  /** HTML player under `public/` (usually `intro-player.html` or a copy). */
  player: string;
  /** Video file name or path relative to media base (gitignored MP4s). */
  video: string;
  /** Bump when player HTML or stamps change (cache-bust iframe). */
  cacheTag?: string;
};

/**
 * Registry of cinematic cutscenes. Add entries here, drop stamped HTML in
 * `public/assets/intro/`, and host matching video on the media release/CDN.
 */
export const LH_CUTSCENES: Record<string, LhCutsceneDef> = {
  intro: {
    id: 'intro',
    player: 'assets/intro/intro-player.html',
    video: 'assets/intro/intro_davinci.web.mp4',
    cacheTag: '20260522-2',
  },
};

const INTRO_CACHE_TAG = LH_CUTSCENES.intro.cacheTag ?? '1';

function withCacheTag(url: string, tag: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${tag}`;
}

/** Full iframe URL for a cutscene player (video src passed as query param). */
export function buildCutscenePlayerUrl(
  def: Pick<LhCutsceneDef, 'player' | 'video' | 'cacheTag'>,
  options?: { videoOverride?: string; autostart?: boolean },
): string {
  // In dev, serve the player HTML from local Vite so the HTTP video URL doesn't trigger
  // mixed-content blocking inside a GitHub Pages (HTTPS) iframe.
  const playerBase = import.meta.env.DEV ? getLhDevVitePublicBaseUrl() : getLhMediaBaseUrl();
  const playerUrl = new URL(`${playerBase}${def.player.replace(/^\/+/, '')}`);
  const videoPath = options?.videoOverride?.trim() || def.video;
  playerUrl.searchParams.set('video', resolveLhCutsceneVideoUrl(videoPath));
  if (options?.autostart) playerUrl.searchParams.set('autostart', '1');
  const tag = def.cacheTag ?? INTRO_CACHE_TAG;
  return withCacheTag(playerUrl.toString(), tag);
}

export function getCutscene(id: string): LhCutsceneDef | undefined {
  return LH_CUTSCENES[id];
}

/** Intro iframe src: env override, else registry `intro` entry. */
export function resolveIntroCinematicIframeSrc(configuredSrc?: string, configuredVideo?: string): string {
  const src = configuredSrc?.trim();
  if (src) {
    const player = /^(https?:|data:|blob:)/i.test(src) ? src : resolveLhAssetUrl(src);
    if (configuredVideo?.trim()) {
      const url = new URL(player);
      url.searchParams.set('video', resolveLhCutsceneVideoUrl(configuredVideo.trim()));
      return withCacheTag(url.toString(), INTRO_CACHE_TAG);
    }
    return withCacheTag(player, INTRO_CACHE_TAG);
  }
  return buildCutscenePlayerUrl(LH_CUTSCENES.intro, {
    videoOverride: configuredVideo,
    autostart: true,
  });
}
