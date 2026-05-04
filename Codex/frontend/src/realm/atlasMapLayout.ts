/**
 * Fallback pin positions on the atlas plate (ellipse, canon index order) when a realm has no
 * entry in `atlasWorldMap.ATLAS_WORLD_PIN_PCT` (e.g. future realms).
 */
export function getAtlasPinPlacement(
  indexInCanonOrder: number,
  totalRealms: number,
): { leftPct: number; topPct: number } {
  const n = Math.max(1, totalRealms);
  const i = ((indexInCanonOrder % n) + n) % n;
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  const ring = 40;
  const cx = 50 + Math.cos(angle) * ring;
  const cy = 50 + Math.sin(angle) * ring * 0.72;
  return { leftPct: cx, topPct: cy };
}
