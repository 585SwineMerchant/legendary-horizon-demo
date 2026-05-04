/**
 * Guild HQ hero resolution for Guild Info — see `resolveGuildHqHeroAsset`.
 *
 * **Workbook convention (production):** add a row with
 * - `asset_id`: `guild_hq_hero_<realm_id>` (e.g. `guild_hq_hero_realm_aethelwood`)
 * - `kind`: **`guild_hq`** (required — this is the only kind eligible for the hero rail)
 * - `realm_tags_csv` / SPA `realm_ids`: include that `realm_id`
 * - `drive_file_id` and/or `delivery_url_placeholder`: populated by the Drive + Apps Script deploy (signed or static URL)
 *
 * Do not reuse `map_thumb` URLs for `guild_hq` rows; map art stays in `map_thumb` and appears in the gallery strip only.
 *
 * **Workbook precedence:** `GuildRealmInfoOverlay` uses `getGuildHqWorkbookHeroDisplay(realm_id)` first
 * (thumbnail + xlsx UC fallbacks from `guild_hq_workbook_image_map.json`). This resolver applies when those URLs are absent or exhausted.
 */
import type { MediaAssetRecord, RealmDefinition } from '../domain/lh-contract';
import { isImageLikeMediaKind } from '../lib/mediaKinds';

/** Guild Info hero rail accepts **only** `guild_hq` rows — never `map_thumb`, UI, portraits, or generic `image` (those belong in gallery / other UI). */
function isGuildHqHeroKind(kind: string): boolean {
  return String(kind || '').trim().toLowerCase() === 'guild_hq';
}

function hasDeliverySignal(row: MediaAssetRecord): boolean {
  return Boolean(
    String(row.delivery_url_placeholder ?? '').trim() || String(row.drive_file_id ?? '').trim(),
  );
}

function isRealmTagged(row: MediaAssetRecord, realmId: string): boolean {
  const id = String(realmId ?? '').trim();
  if (!id) return false;
  const ids = row.realm_ids;
  return Array.isArray(ids) && ids.includes(id);
}

/**
 * Stable `asset_id` candidates the media workbook / Apps Script pipeline can ship for one-click hero binding
 * (most specific first).
 */
export function buildGuildHqHeroExplicitAssetIds(realm: RealmDefinition): string[] {
  const slugUnderscore = realm.slug.replace(/-/g, '_');
  return [
    `guild_hq_hero_${realm.realm_id}`,
    `guild_hq_${realm.realm_id}`,
    `hero_guild_${realm.realm_id}`,
    `guild_hq_hero_${slugUnderscore}`,
    `guild_hq_${slugUnderscore}`,
  ];
}

/**
 * Resolve the guild HQ hero catalog row for `LhCatalogImage` / `collectDeliveryUrlChain`.
 *
 * Order:
 * 1. Explicit `asset_id` convention (`guild_hq_hero_<realm_id>`, …) where `kind === 'guild_hq'` and a
 *    delivery signal exists (`delivery_url_placeholder` or `drive_file_id`).
 * 2. Else any realm-tagged row (`realm_ids` includes this realm) with `kind === 'guild_hq'` and a delivery
 *    signal — lowest `asset_id` for stability.
 *
 * Does **not** fall back to `map_thumb`, `portrait`, or other kinds (prevents map vignettes / NPC art from posing as HQ hero).
 */
export function resolveGuildHqHeroAsset(
  realm: RealmDefinition,
  catalog: readonly MediaAssetRecord[],
): MediaAssetRecord | null {
  for (const assetId of buildGuildHqHeroExplicitAssetIds(realm)) {
    const row = catalog.find((a) => a.asset_id === assetId);
    if (!row || !isGuildHqHeroKind(row.kind) || !hasDeliverySignal(row)) continue;
    return row;
  }

  const rid = realm.realm_id;
  const realmHqRows = catalog.filter(
    (r) => isRealmTagged(r, rid) && isGuildHqHeroKind(r.kind) && hasDeliverySignal(r),
  );

  realmHqRows.sort((a, b) => a.asset_id.localeCompare(b.asset_id));
  return realmHqRows[0] ?? null;
}

/** Realm-tagged gallery thumbs — excludes the hero row and the generic missing placeholder. */
export function listGuildGalleryImageAssets(
  realm: RealmDefinition,
  catalog: readonly MediaAssetRecord[],
  heroAssetId: string | null,
): MediaAssetRecord[] {
  const skip = new Set<string>(['media_image_missing_placeholder']);
  if (heroAssetId) skip.add(heroAssetId);
  const rid = realm.realm_id;
  return catalog
    .filter(
      (r) => isRealmTagged(r, rid) && isImageLikeMediaKind(r.kind) && hasDeliverySignal(r) && !skip.has(r.asset_id),
    )
    .sort((a, b) => a.asset_id.localeCompare(b.asset_id));
}
