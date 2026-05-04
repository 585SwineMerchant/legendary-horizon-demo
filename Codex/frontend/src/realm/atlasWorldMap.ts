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
 * 1. Env override · 2. Googleusercontent (stable for this file) · 3. Optional `public/assets/maps/realm-atlas-world.png` · 4. Drive thumbnail last resort
 */
export function buildRealmAtlasImageSrcCandidates(): readonly string[] {
  const env = import.meta.env.VITE_LH_REALM_ATLAS_IMAGE_URL?.trim();
  const base = import.meta.env.BASE_URL ?? '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const local = `${withSlash}assets/maps/realm-atlas-world.png`;
  return dedupeUrls([...(env ? [env] : []), DEFAULT_REALM_ATLAS_IMAGE_URL, local, DRIVE_THUMBNAIL_FALLBACK]);
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
