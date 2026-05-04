import type { MediaAssetRecord } from '../domain/lh-contract';

/**
 * Realm-scoped media rows — uses optional `realm_ids` on catalog entries; assets with no `realm_ids` are treated as global (included for every realm).
 * Do not use this list alone for guild HQ hero art (globals such as title backdrops appear first); use `resolveGuildHqHeroAsset` instead.
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

/** NPC-scoped media rows — mirrors `LhAsset_getNpcAssets` (Sheets `npc_id` column). */
export function listMediaAssetsForNpc(catalog: readonly MediaAssetRecord[], npcId: string): MediaAssetRecord[] {
  const id = npcId.trim();
  if (!id) return [];
  return catalog.filter((row) => String(row.npc_id ?? '').trim() === id);
}
