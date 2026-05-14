import catalogJson from '@samples/media_assets.json';

import type { MediaAssetRecord } from '../domain/lh-contract';
import { LH_MEDIA_ASSET_ID_MISSING_IMAGE, LH_CORE_PRELOAD_MEDIA_ASSET_IDS } from '../lib/mediaConstants';
import { isImageLikeMediaKind } from '../lib/mediaKinds';
import { publicAssetUrl } from '../lib/publicAssetUrl';
import { listMediaAssetsForNpc, listMediaAssetsForRealm } from '../realm/realmAssets';

let cache: MediaAssetRecord[] | null = null;

function ensureCache(): MediaAssetRecord[] {
  if (!cache) {
    cache = catalogJson as MediaAssetRecord[];
  }
  return cache;
}

function resolveCatalog(catalog?: readonly MediaAssetRecord[]): readonly MediaAssetRecord[] {
  return catalog ?? ensureCache();
}

/** Returns the immutable catalog row backing Drive / URL delivery lookups. */
export function getAssetRecord(assetId: string, catalog?: readonly MediaAssetRecord[]): MediaAssetRecord | undefined {
  return resolveCatalog(catalog).find((asset) => asset.asset_id === assetId);
}

export function listAssetRecords(): readonly MediaAssetRecord[] {
  return ensureCache();
}

const MISSING_IMAGE_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96" viewBox="0 0 160 96"><rect fill="#141824" width="160" height="96"/><text x="80" y="54" fill="#5c6478" font-size="13" text-anchor="middle" font-family="system-ui,sans-serif">?</text></svg>',
)}`;

const MAX_FALLBACK_HOPS = 8;

function normalizeCatalogDeliveryUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith('/assets/') ? publicAssetUrl(trimmed) : trimmed;
}

/**
 * Ordered delivery URLs: primary row, then each `fallback_asset_id` in the chain.
 * Stops on cycles / hop limit. If nothing resolves, returns `[MISSING_IMAGE_DATA_URI]`.
 */
export function collectDeliveryUrlChain(assetId: string, catalog?: readonly MediaAssetRecord[]): string[] {
  const cat = resolveCatalog(catalog);
  const urls: string[] = [];
  const seenIds = new Set<string>();
  let nextId: string | undefined = assetId.trim() || undefined;

  for (let hop = 0; hop < MAX_FALLBACK_HOPS && nextId; hop++) {
    if (seenIds.has(nextId)) break;
    seenIds.add(nextId);
    const rec = cat.find((a) => a.asset_id === nextId);
    if (!rec) break;
    const u = normalizeCatalogDeliveryUrl(String(rec.delivery_url_placeholder ?? ''));
    if (u) urls.push(u);
    const fb = String(rec.fallback_asset_id ?? '').trim();
    nextId = fb || undefined;
  }

  if (!urls.length) {
    const missing = cat.find((a) => a.asset_id === LH_MEDIA_ASSET_ID_MISSING_IMAGE);
    const fallbackUrl = String(missing?.delivery_url_placeholder ?? '').trim();
    urls.push(fallbackUrl || MISSING_IMAGE_DATA_URI);
  }
  return urls;
}

/** Last resort URL when the catalog has no `media_image_missing_placeholder` row. */
export function getMissingImageDataUri(): string {
  return MISSING_IMAGE_DATA_URI;
}

export function resolveAssetRecordWithFallback(
  assetId: string,
  catalog?: readonly MediaAssetRecord[],
): MediaAssetRecord | undefined {
  const cat = resolveCatalog(catalog);
  const seenIds = new Set<string>();
  let nextId: string | undefined = assetId.trim() || undefined;

  for (let hop = 0; hop < MAX_FALLBACK_HOPS && nextId; hop++) {
    if (seenIds.has(nextId)) break;
    seenIds.add(nextId);
    const rec = cat.find((a) => a.asset_id === nextId);
    if (!rec) break;
    const u = String(rec.delivery_url_placeholder ?? '').trim();
    if (u) return rec;
    const fb = String(rec.fallback_asset_id ?? '').trim();
    nextId = fb || undefined;
  }

  return cat.find((a) => a.asset_id === LH_MEDIA_ASSET_ID_MISSING_IMAGE);
}

/**
 * Prefer `delivery_url_placeholder` locally; once Apps Script validates rows, swap root to signed URLs while keeping IDs stable.
 * Uses `fallback_asset_id` chain when the primary URL is blank.
 */
export function resolveAssetDeliveryUrl(assetId: string, catalog?: readonly MediaAssetRecord[]): string {
  const chain = collectDeliveryUrlChain(assetId, catalog);
  return chain[0] ?? '';
}

/** Realm-scoped catalog slice (Milestone 6) — rows with no `realm_ids` count as global. */
export function listAssetsForRealm(realmId: string, catalog?: readonly MediaAssetRecord[]): MediaAssetRecord[] {
  return listMediaAssetsForRealm(resolveCatalog(catalog), realmId);
}

/**
 * Portrait / NPC-tagged image URL — prefers `kind` portrait, then other image-like rows for the same `npc_id`.
 */
export function resolveNpcPortraitDeliveryUrl(npcId: string, catalog?: readonly MediaAssetRecord[]): string {
  const cat = resolveCatalog(catalog);
  const rows = listMediaAssetsForNpc(cat, npcId);
  const portrait = rows.find((r) => String(r.kind).toLowerCase() === 'portrait');
  if (portrait) {
    const u = resolveAssetDeliveryUrl(portrait.asset_id, cat);
    if (u) return u;
  }
  const imageLike = rows.find((r) => isImageLikeMediaKind(r.kind));
  if (imageLike) {
    const u = resolveAssetDeliveryUrl(imageLike.asset_id, cat);
    if (u) return u;
  }
  return '';
}

/** Warm `<link rel="preload" as="image">` (and decode) for core UI catalog ids. */
export function preloadCoreCatalogMedia(catalog?: readonly MediaAssetRecord[]): void {
  if (typeof document === 'undefined') return;
  const cat = resolveCatalog(catalog);
  for (const id of LH_CORE_PRELOAD_MEDIA_ASSET_IDS) {
    const url = resolveAssetDeliveryUrl(id, cat);
    if (!url || url.startsWith('data:')) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
