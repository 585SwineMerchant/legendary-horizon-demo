import { CANON_REALM_IDS } from './canonRealms';
import { ATLAS_WORLD_PIN_PCT } from './atlasWorldMap';

/**
 * Puzzle-piece territories for atlas fog clears: Euclidean Voronoi cells clipped to the 0–100 %
 * atlas plate (same space as guild pins). Straight edges tessellate the map deliberately — no
 * stochastic blob overlays.
 */

export type RealmAtlasFogPiece = {
  realmId: string;
  /** SVG path `d`, viewBox-aligned 0–100 (same coords as atlas pins). */
  pathD: string;
  /** Transform origin inside the piece (typically centroid). */
  cx: number;
  cy: number;
};

type Pt = { x: number; y: number };

const BOX: Pt[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

/** Half-plane closest to site S versus T: 2(px-s)·(t-s) <= |t|²-|s|² (equivalently Voronoi boundary). */
function clipClosestToS(poly: Pt[], s: Pt, t: Pt, eps = 1e-9): Pt[] {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const a = 2 * dx;
  const b = 2 * dy;
  const c = t.x * t.x + t.y * t.y - (s.x * s.x + s.y * s.y);
  const inside = (p: Pt) => a * p.x + b * p.y <= c + eps;

  function intersect(prev: Pt, curr: Pt): Pt | null {
    const vx = curr.x - prev.x;
    const vy = curr.y - prev.y;
    const denom = a * vx + b * vy;
    if (Math.abs(denom) < 1e-12) return null;
    const u = (c - a * prev.x - b * prev.y) / denom;
    if (u < -eps || u > 1 + eps) return null;
    return { x: prev.x + u * vx, y: prev.y + u * vy };
  }

  const n = poly.length;
  if (n < 2) return [];

  const out: Pt[] = [];
  let prev = poly[n - 1];
  let prevIn = inside(prev);

  for (let i = 0; i < n; i += 1) {
    const curr = poly[i];
    const currIn = inside(curr);
    if (currIn) {
      if (!prevIn) {
        const hit = intersect(prev, curr);
        if (hit) out.push(hit);
      }
      out.push(curr);
    } else if (prevIn) {
      const hit = intersect(prev, curr);
      if (hit) out.push(hit);
    }
    prev = curr;
    prevIn = currIn;
  }
  return simplifyRing(out);
}

function distanceSq(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Remove sequential duplicates after clipping. */
function simplifyRing(ring: Pt[]): Pt[] {
  const eps = 1e-4;
  if (ring.length < 2) return ring;
  const out: Pt[] = [];
  for (const p of ring) {
    const last = out[out.length - 1];
    if (!last || distanceSq(last, p) > eps * eps) out.push(p);
  }
  if (out.length >= 3 && distanceSq(out[0], out[out.length - 1]) < eps * eps) out.pop();
  return out;
}

/** Shoelace area (signed); positive CCW polygons. */
function polygonArea(poly: Pt[]): number {
  if (poly.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return a / 2;
}

function centroid(poly: Pt[]): Pt | null {
  const A = polygonArea(poly);
  if (Math.abs(A) < 1e-8) return null;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const j = (i + 1) % poly.length;
    const cross = poly[i].x * poly[j].y - poly[j].x * poly[i].y;
    cx += (poly[i].x + poly[j].x) * cross;
    cy += (poly[i].y + poly[j].y) * cross;
  }
  const f = 1 / (6 * A);
  return { x: cx * f, y: cy * f };
}

function polyToSvgD(poly: Pt[]): string {
  if (poly.length < 3) return '';
  const fmt = (n: number) => n.toFixed(3);
  let d = `M ${fmt(poly[0].x)} ${fmt(poly[0].y)}`;
  for (let i = 1; i < poly.length; i += 1) {
    d += ` L ${fmt(poly[i].x)} ${fmt(poly[i].y)}`;
  }
  d += ' Z';
  return d;
}

/** Circular fallback — unknown realm IDs or clipped Voronoi degeneracy. */
export function atlasFogRevealCirclePiece(cx: number, cy: number, r = 10.5): RealmAtlasFogPiece {
  return {
    realmId: '',
    pathD: circleRevealD(cx, cy, r),
    cx,
    cy,
  };
}

function circleRevealD(cx: number, cy: number, r = 11): string {
  const fmt = (n: number) => n.toFixed(3);
  return ['M', fmt(cx + r), fmt(cy), 'A', fmt(r), fmt(r), '0', '1', '1', fmt(cx - r), fmt(cy), 'A', fmt(r), fmt(r), '0', '1', '1', fmt(cx + r), fmt(cy), 'Z'].join(
    ' ',
  );
}

function voronoiCell(siteIndex: number, allSites: Pt[]): Pt[] {
  const site = allSites[siteIndex];
  let poly = [...BOX];
  for (let j = 0; j < allSites.length; j += 1) {
    if (j === siteIndex) continue;
    const t = allSites[j];
    if (distanceSq(site, t) < 1e-12) continue;
    poly = clipClosestToS(poly, site, t);
    if (poly.length < 3) return [];
  }
  return poly;
}

/** Precomputed keyed by canon `realm_id`. */
export const REALM_ATLAS_FOG_PIECES: ReadonlyMap<string, RealmAtlasFogPiece> = (() => {
  const rows: { realmId: string; x: number; y: number }[] = [];
  for (const realmId of CANON_REALM_IDS) {
    const p = ATLAS_WORLD_PIN_PCT[realmId];
    if (!p) continue;
    rows.push({ realmId, x: p.leftPct, y: p.topPct });
  }
  const sites = rows.map((r) => ({ x: r.x, y: r.y }));
  const m = new Map<string, RealmAtlasFogPiece>();
  for (let i = 0; i < rows.length; i += 1) {
    const { realmId, x, y } = rows[i];
    const poly = voronoiCell(i, sites);
    let pathD = polyToSvgD(poly);
    let cx = x;
    let cy = y;
    const cen = centroid(poly);
    if (cen) {
      cx = cen.x;
      cy = cen.y;
    }
    const areaAbs = Math.abs(polygonArea(poly));
    if (!pathD || areaAbs < 0.35) {
      pathD = circleRevealD(x, y, 10.5);
    }
    m.set(realmId, { realmId, pathD, cx, cy });
  }
  return m;
})();

export function resolveRealmFogPiece(realmId: string): RealmAtlasFogPiece | null {
  const id = String(realmId || '').trim();
  return REALM_ATLAS_FOG_PIECES.get(id) ?? null;
}
