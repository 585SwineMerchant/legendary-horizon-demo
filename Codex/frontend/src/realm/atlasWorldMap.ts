import { getAtlasPinPlacement } from './atlasMapLayout';

/**
 * Direct image host for the same Drive file as `Fog of the unknown.html` (thumbnail redirects here with `200 image/png`).
 * The `drive.google.com/thumbnail?…` hop sends `Vary: Sec-Fetch-Dest` and often fails when used as a CSS `background-image`
 * from the app origin — use this URL (or `<img>`) instead.
 */
export const DEFAULT_REALM_ATLAS_IMAGE_URL =
  'https://lh3.googleusercontent.com/d/1hjDTdize-Y5JbCYE2UXPVRD983d0BA5l=w2500';

const DRIVE_THUMBNAIL_FALLBACK =
  'https://drive.google.com/thumbnail?id=1hjDTdize-Y5JbCYE2UXPVRD983d0BA5l&sz=w2500';

function dedupeUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = String(raw ?? '').trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/**
 * Ordered candidates for `<img src>` (first loadable wins via `onError` chain in the overlay).
 * 1. Env override · 2. Local `public/assets/maps/realm-atlas-world.png` · 3. Googleusercontent · 4. Drive thumbnail last resort
 */
export function buildRealmAtlasImageSrcCandidates(): readonly string[] {
  const env = import.meta.env.VITE_LH_REALM_ATLAS_IMAGE_URL?.trim();
  const base = import.meta.env.BASE_URL ?? '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const local = `${withSlash}assets/maps/realm-atlas-world.png`;
  return dedupeUrls([...(env ? [env] : []), local, DEFAULT_REALM_ATLAS_IMAGE_URL, DRIVE_THUMBNAIL_FALLBACK]);
}

/** @deprecated Prefer `buildRealmAtlasImageSrcCandidates` + `<img>`; kept for callers that need a single string. */
export function resolveRealmAtlasImageUrl(): string {
  const list = buildRealmAtlasImageSrcCandidates();
  return list[0] ?? DEFAULT_REALM_ATLAS_IMAGE_URL;
}

/**
 * Pin anchors as **percent of the map plate** (same coordinate space as the Fog prototype’s `mapLocations`).
 * Keys are canon `realm_id`s. Extracted from `Fog of the unknown.html` (`mapLocations` + guild naming).
 */
export const ATLAS_WORLD_PIN_PCT: Readonly<Record<string, { leftPct: number; topPct: number }>> = {
  realm_aethelwood: { leftPct: 18.59, topPct: 40.4 },
  realm_monolith_masonry: { leftPct: 71.77, topPct: 19.32 },
  realm_chroniclers_spire: { leftPct: 36.93, topPct: 45.12 },
  realm_mercantile_citadel: { leftPct: 18.96, topPct: 53.9 },
  realm_archives_ascension: { leftPct: 47.45, topPct: 47.97 },
  realm_gilded_vault: { leftPct: 38.75, topPct: 58.84 },
  realm_high_council_hall: { leftPct: 48.54, topPct: 33.92 },
  realm_aurora_apothecary: { leftPct: 67.4, topPct: 74.86 },
  realm_crossroads_haven: { leftPct: 47.19, topPct: 63.45 },
  realm_empaths_enclave: { leftPct: 28.59, topPct: 79.03 },
  realm_etheric_nexus: { leftPct: 76.2, topPct: 63.45 },
  realm_valors_watchtower: { leftPct: 24.84, topPct: 20.2 },
  realm_vulcanis_forge: { leftPct: 75.21, topPct: 34.69 },
  realm_bards_beacon: { leftPct: 56.2, topPct: 58.73 },
  realm_alchemical_observatory: { leftPct: 38.23, topPct: 88.47 },
  realm_odyssey_harbor: { leftPct: 57.29, topPct: 86.61 },
};

/**
 * Inner landscape plate (rectangular border on the parchment raster). Fog/blur is clipped here;
 * rolled scroll edges and title band stay sharp. Tune against `realm-atlas-world.png` if art shifts.
 */
export const ATLAS_LANDSCAPE_FRAME_PCT = {
  left: 9.75,
  top: 12.75,
  width: 80.25,
  height: 77.5,
} as const;

/** Extra reach past the inner border so fog can feather without a hard clip. */
export const ATLAS_FOG_BLEED_PCT = {
  left: 2,
  top: 0.85,
  right: 2,
  bottom: 2.1,
} as const;

/** Width of each edge ramp in mask space (0–1) — black→white so fog fades at the border. */
export const ATLAS_FOG_EDGE_FADE_WIDTH = 0.09;

/** Fine-tune hole center vs guild pin anchor on the raster (full-image %). */
export const ATLAS_FOG_HOLE_NUDGE_PCT = {
  left: -2.15,
  top: -1.35,
} as const;

/** Extra soften on hole rims after edge ramps (objectBoundingBox units). */
export const ATLAS_FOG_MASK_BLUR = 0.018;

export type AtlasRenderedBounds = { width: number; height: number; offsetX: number; offsetY: number };

type LandscapeBoxOpts = { bleed?: boolean };

/** Pixel box for the landscape frame inside the letterboxed atlas `<img>` bounds. */
export function computeAtlasLandscapeLayerStyle(
  atlasBounds: AtlasRenderedBounds | null,
  opts?: LandscapeBoxOpts,
): { left: string; top: string; width: string; height: string } | { inset: 0 } {
  if (!atlasBounds) return { inset: 0 };
  const f = ATLAS_LANDSCAPE_FRAME_PCT;
  const b = opts?.bleed ? ATLAS_FOG_BLEED_PCT : { left: 0, top: 0, right: 0, bottom: 0 };
  const leftPct = f.left - b.left;
  const topPct = f.top - b.top;
  const widthPct = f.width + b.left + b.right;
  const heightPct = f.height + b.top + b.bottom;
  return {
    left: `${atlasBounds.offsetX + (atlasBounds.width * leftPct) / 100}px`,
    top: `${atlasBounds.offsetY + (atlasBounds.height * topPct) / 100}px`,
    width: `${(atlasBounds.width * widthPct) / 100}px`,
    height: `${(atlasBounds.height * heightPct) / 100}px`,
  };
}

function fogMaskBoxPct() {
  const f = ATLAS_LANDSCAPE_FRAME_PCT;
  const b = ATLAS_FOG_BLEED_PCT;
  return {
    left: f.left - b.left,
    top: f.top - b.top,
    width: f.width + b.left + b.right,
    height: f.height + b.top + b.bottom,
  };
}

/** Guild pin % (full raster) → % inside the landscape frame (0–100). */
export function atlasFullPctToLandscapePct(
  leftPct: number,
  topPct: number,
): { leftPct: number; topPct: number } {
  const f = ATLAS_LANDSCAPE_FRAME_PCT;
  return {
    leftPct: ((leftPct - f.left) / f.width) * 100,
    topPct: ((topPct - f.top) / f.height) * 100,
  };
}

/** Pin % → mask space for the fog layer (includes edge bleed for soft edges). */
export function atlasFullPctToFogMaskPct(
  leftPct: number,
  topPct: number,
): { leftPct: number; topPct: number } {
  const { cx, cy } = atlasPinPctToFogMask01(leftPct, topPct);
  return { leftPct: cx * 100, topPct: cy * 100 };
}

/** Guild pin on full raster → hole center in fog-mask 0–1 (with nudge). */
export function atlasPinPctToFogMask01(leftPct: number, topPct: number): { cx: number; cy: number } {
  const box = fogMaskBoxPct();
  const n = ATLAS_FOG_HOLE_NUDGE_PCT;
  const x = leftPct + n.left;
  const y = topPct + n.top;
  return {
    cx: (x - box.left) / box.width,
    cy: (y - box.top) / box.height,
  };
}

/** Fog-hole center on full raster → mask 0–1 (no nudge; use calibrator placements). */
export function atlasFogHoleFullPctToMask01(leftPct: number, topPct: number): { cx: number; cy: number } {
  const box = fogMaskBoxPct();
  return {
    cx: (leftPct - box.left) / box.width,
    cy: (topPct - box.top) / box.height,
  };
}

/** Hole radius in full-raster % → radius in fog-mask-local % (width-normalized). */
export function atlasFogHoleRadiusInMaskPct(radiusFullPct: number): number {
  return (radiusFullPct / fogMaskBoxPct().width) * 100;
}

/** @deprecated Use `atlasFogHoleRadiusInMaskPct` for fog holes. */
export function atlasFogHoleRadiusInLandscapePct(radiusFullPct: number): number {
  return (radiusFullPct / ATLAS_LANDSCAPE_FRAME_PCT.width) * 100;
}

/** Pin position on the illustrated atlas, or ellipse fallback for unknown ids. */
export function getAtlasPinPlacementForRealm(
  realmId: string,
  indexInCanonOrder: number,
  totalRealms: number,
): { leftPct: number; topPct: number } {
  const id = String(realmId || '').trim();
  const fixed = id ? ATLAS_WORLD_PIN_PCT[id] : undefined;
  if (fixed) return { leftPct: fixed.leftPct, topPct: fixed.topPct };
  return getAtlasPinPlacement(indexInCanonOrder, totalRealms);
}
