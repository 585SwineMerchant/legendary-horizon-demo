import { resolveLhAssetUrl } from './lhMediaBase';

/** @deprecated name kept for call sites — uses {@link resolveLhAssetUrl}. */
export function publicAssetUrl(path: string): string {
  return resolveLhAssetUrl(path);
}
