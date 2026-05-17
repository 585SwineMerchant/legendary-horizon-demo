import { ATLAS_WORLD_PIN_PCT, getAtlasPinPlacementForRealm } from './atlasWorldMap';

export type AtlasFogHolePct = { leftPct: number; topPct: number };

/** Canon fog-clear centers on the atlas raster (% of full image). Edit via calibrator or paste here. */
export const ATLAS_FOG_HOLE_PCT: Readonly<Record<string, AtlasFogHolePct>> = {
  ...ATLAS_WORLD_PIN_PCT,
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
