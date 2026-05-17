import { getAtlasPinPlacementForRealm } from './atlasWorldMap';

export type AtlasFogHolePct = { leftPct: number; topPct: number };

/** Canon fog-clear centers on the atlas raster (% of full image). Calibrated via fog-hole placement tool. */
export const ATLAS_FOG_HOLE_PCT: Readonly<Record<string, AtlasFogHolePct>> = {
  realm_aethelwood: { leftPct: 25.73, topPct: 42.98 },
  realm_alchemical_observatory: { leftPct: 39.96, topPct: 76.42 },
  realm_archives_ascension: { leftPct: 55.47, topPct: 45.65 },
  realm_aurora_apothecary: { leftPct: 70.16, topPct: 65.72 },
  realm_bards_beacon: { leftPct: 60.31, topPct: 60.87 },
  realm_chroniclers_spire: { leftPct: 36.93, topPct: 45.12 },
  realm_crossroads_haven: { leftPct: 50.36, topPct: 56.02 },
  realm_empaths_enclave: { leftPct: 27.92, topPct: 75.08 },
  realm_etheric_nexus: { leftPct: 78.74, topPct: 56.19 },
  realm_gilded_vault: { leftPct: 46.53, topPct: 68.23 },
  realm_high_council_hall: { leftPct: 52.55, topPct: 31.94 },
  realm_mercantile_citadel: { leftPct: 27.74, topPct: 58.53 },
  realm_monolith_masonry: { leftPct: 67.7, topPct: 28.93 },
  realm_odyssey_harbor: { leftPct: 61.68, topPct: 78.76 },
  realm_valors_watchtower: { leftPct: 32.12, topPct: 28.6 },
  realm_vulcanis_forge: { leftPct: 74.27, topPct: 44.65 },
};

const FOG_HOLE_LS_KEY = 'lh.atlas.fogHolePct.v1';

export function isAtlasFogCalibrateEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_LH_ATLAS_FOG_CALIBRATE === 'true') return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('atlasFogCalibrate') === '1';
}

export function readFogHoleOverridesFromStorage(): Record<string, AtlasFogHolePct> {
  try {
    const raw = localStorage.getItem(FOG_HOLE_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AtlasFogHolePct>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

export function fogHoleOverridesOnly(full: Record<string, AtlasFogHolePct>): Record<string, AtlasFogHolePct> {
  const out: Record<string, AtlasFogHolePct> = {};
  for (const [id, p] of Object.entries(full)) {
    const canon = ATLAS_FOG_HOLE_PCT[id];
    if (!canon || canon.leftPct !== p.leftPct || canon.topPct !== p.topPct) {
      out[id] = p;
    }
  }
  return out;
}

export function writeFogHoleOverridesToStorage(overrides: Record<string, AtlasFogHolePct>) {
  try {
    localStorage.setItem(FOG_HOLE_LS_KEY, JSON.stringify(overrides, null, 2));
  } catch {
    /* ignore */
  }
}

export function mergeFogHolePlacements(
  storageOverrides: Record<string, AtlasFogHolePct>,
): Record<string, AtlasFogHolePct> {
  return { ...ATLAS_FOG_HOLE_PCT, ...storageOverrides };
}

/** Where the fog reveal animation clears — independent of amber HQ pin buttons. */
export function getAtlasFogHolePlacementForRealm(
  realmId: string,
  indexInCanonOrder: number,
  totalRealms: number,
  placements: Record<string, AtlasFogHolePct>,
): AtlasFogHolePct {
  const id = String(realmId || '').trim();
  if (id && placements[id]) return placements[id];
  return getAtlasPinPlacementForRealm(realmId, indexInCanonOrder, totalRealms);
}

export function formatFogHolePctForSource(overrides: Record<string, AtlasFogHolePct>): string {
  const lines = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, p]) =>
        `  ${id}: { leftPct: ${p.leftPct.toFixed(2)}, topPct: ${p.topPct.toFixed(2)} },`,
    );
  return ['export const ATLAS_FOG_HOLE_PCT: Readonly<Record<string, AtlasFogHolePct>> = {', ...lines, '};'].join(
    '\n',
  );
}
