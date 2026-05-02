import { useMemo, useState } from 'react';

import type { MediaAssetRecord } from '../domain/lh-contract';
import { collectDeliveryUrlChain } from '../services/assetCatalog';

export type LhCatalogImageProps = {
  assetId: string;
  alt: string;
  className?: string;
  /** Realm / event thumbnails should stay lazy; title + HUD can pass `eager`. */
  loading?: 'eager' | 'lazy';
  catalog?: readonly MediaAssetRecord[];
};

/**
 * Milestone 14 — `<img>` bound to the media catalog with `fallback_asset_id` chain + `onError` advance.
 */
export function LhCatalogImage({ assetId, alt, className, loading = 'lazy', catalog }: LhCatalogImageProps) {
  const urls = useMemo(() => collectDeliveryUrlChain(assetId, catalog), [assetId, catalog]);
  const [index, setIndex] = useState(0);
  const src = urls[index] ?? '';

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setIndex((i) => (i + 1 < urls.length ? i + 1 : i))}
    />
  );
}
