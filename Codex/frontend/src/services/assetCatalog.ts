import catalogJson from '@samples/media_assets.json';

import type { MediaAssetRecord } from '../domain/lh-contract';
import { listMediaAssetsForRealm } from '../realm/realmAssets';

let cache: MediaAssetRecord[] | null = null;

function ensureCache(): MediaAssetRecord[] {
  if (!cache) {
    cache = catalogJson as MediaAssetRecord[];
  }
  return cache;
}

/** Returns the immutable catalog row backing Drive / URL delivery lookups. */
export function getAssetRecord(assetId: string): MediaAssetRecord | undefined {
  return ensureCache().find((asset) => asset.asset_id === assetId);
}

export function listAssetRecords(): readonly MediaAssetRecord[] {
  return ensureCache();
}

/**
 * Prefer `delivery_url_placeholder` locally; once Apps Script validates rows, swap root to signed URLs while keeping IDs stable.
 */
export function resolveAssetDeliveryUrl(assetId: string): string {
  return getAssetRecord(assetId)?.delivery_url_placeholder ?? '';
}

/** Realm-scoped catalog slice (Milestone 6) — rows with no `realm_ids` count as global. */
export function listAssetsForRealm(realmId: string): MediaAssetRecord[] {
  return listMediaAssetsForRealm(ensureCache(), realmId);
}
