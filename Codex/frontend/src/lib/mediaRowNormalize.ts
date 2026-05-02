import type { MediaAssetRecord } from '../domain/lh-contract';

/**
 * Parses `realm_tags_csv` from Sheets (`realm_a, realm_b`) into `realm_ids` for the SPA shape.
 */
export function parseRealmTagsCsv(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const parts = s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

/**
 * Coerces a loose row (Sheets JSON or API) into `MediaAssetRecord`.
 * JSON fixtures can pass through unchanged; sheet rows may use `realm_tags_csv` instead of `realm_ids`.
 */
export function normalizeMediaAssetRow(raw: Record<string, unknown>): MediaAssetRecord {
  const asset_id = String(raw.asset_id ?? '').trim();
  const kind = String(raw.kind ?? 'image').trim() || 'image';
  const description = String(raw.description ?? '').trim();
  const drive_file_id = String(raw.drive_file_id ?? '').trim();
  const delivery_url_placeholder = String(raw.delivery_url_placeholder ?? '').trim();

  let realm_ids: string[] | undefined;
  if (Array.isArray(raw.realm_ids)) {
    realm_ids = raw.realm_ids.map((x) => String(x).trim()).filter(Boolean);
    if (realm_ids.length === 0) realm_ids = undefined;
  } else {
    realm_ids = parseRealmTagsCsv(raw.realm_tags_csv);
  }

  const npc_id = raw.npc_id !== undefined && raw.npc_id !== null ? String(raw.npc_id).trim() : undefined;
  const fallback_asset_id =
    raw.fallback_asset_id !== undefined && raw.fallback_asset_id !== null
      ? String(raw.fallback_asset_id).trim() || undefined
      : undefined;

  return {
    asset_id,
    kind,
    description,
    drive_file_id,
    delivery_url_placeholder,
    realm_ids,
    npc_id: npc_id || undefined,
    fallback_asset_id,
  };
}
