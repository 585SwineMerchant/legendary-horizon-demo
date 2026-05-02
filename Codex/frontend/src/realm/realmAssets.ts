import type { MediaAssetRecord } from '../domain/lh-contract';

/**
 * Realm-scoped media rows — uses optional `realm_ids` on catalog entries; assets with no `realm_ids` are treated as global (included for every realm).
 */
export function listMediaAssetsForRealm(catalog: readonly MediaAssetRecord[], realmId: string): MediaAssetRecord[] {
  return catalog.filter((row) => {
    const ids = row.realm_ids;
    if (!ids || ids.length === 0) {
      return true;
    }
    return ids.includes(realmId);
  });
}
