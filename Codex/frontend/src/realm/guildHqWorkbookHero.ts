import guildHqWorkbookImageMapJson from '@samples/guild_hq_workbook_image_map.json';
import { getGuildHeroManifestEntry } from '../domain/lhMediaManifest';
import { resolveLhAssetUrl } from '../lib/lhMediaBase';

export type GuildHqWorkbookImageEntry = {
  realm_id: string;
  workbook_hq_label: string;
  workbook_career_cluster: string;
  hero_image_url: string | null;
  drive_file_id: string | null;
};

type GuildHqWorkbookImageMapFile = {
  schema_version: number;
  source: string;
  entries: GuildHqWorkbookImageEntry[];
};

const workbook = guildHqWorkbookImageMapJson as GuildHqWorkbookImageMapFile;

const byRealmId: ReadonlyMap<string, GuildHqWorkbookImageEntry> = new Map(
  workbook.entries.map((e) => [e.realm_id, e] as const),
);

/** Same as guild slides in `Project Documents/Fog of the unknown.html` (`image-bleed` HQ art). */
const DRIVE_THUMB_SZ = 'w2500' as const;

function driveThumbnailUrl(fileId: string): string {
  const id = String(fileId ?? '').trim();
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${DRIVE_THUMB_SZ}`;
}

export type GuildHqWorkbookHeroDisplay = {
  /** Try in order: Drive thumbnail (atlas-proven), then xlsx “New URL” (`uc?export=view`) if different. */
  try_urls: readonly string[];
  drive_file_id: string | null;
  workbook_uc_url: string | null;
};

/**
 * Browser-facing Guild Info hero URLs — local static asset first, Drive URLs as last-resort fallback.
 *
 * Resolution order (onError chain in GuildRealmInfoOverlay):
 *   1. Local static WebP from lhMediaManifest (public/assets/guilds/{slug}.webp) — same-origin, school-safe.
 *   2. Drive thumbnail (drive.google.com/thumbnail?id=…&sz=w2500) — may be blocked on school networks.
 *   3. Drive uc?export=view URL — legacy fallback, blocked on most school networks.
 *   4. Text-card fallback rendered by GuildRealmInfoOverlay when all image URLs fail.
 *
 * ARCHITECTURE NOTE: Google Drive is NOT the primary media delivery mechanism.
 * Drive IDs are retained here only so the waterfall has a last resort when local files are
 * not yet deployed. Remove Drive URLs from this list once all images are in public/assets/guilds/.
 */
export function getGuildHqWorkbookHeroDisplay(realmId: string): GuildHqWorkbookHeroDisplay | undefined {
  const id = String(realmId ?? '').trim();
  if (!id) return undefined;

  const try_urls: string[] = [];

  // 1. Local static asset (primary — same-origin, no firewall risk).
  const manifestEntry = getGuildHeroManifestEntry(id);
  if (manifestEntry) {
    try_urls.push(resolveLhAssetUrl(manifestEntry.local_path));
  }

  // 2–3. Drive fallbacks (last resort — blocked on many school networks).
  const row = byRealmId.get(id);
  const fileId = String(row?.drive_file_id ?? '').trim();
  const uc = String(row?.hero_image_url ?? '').trim();
  if (fileId) try_urls.push(driveThumbnailUrl(fileId));
  if (uc && !try_urls.includes(uc)) try_urls.push(uc);

  if (!try_urls.length) return undefined;
  return { try_urls, drive_file_id: fileId || null, workbook_uc_url: uc || null };
}

/**
 * First URL the overlay should attempt (thumbnail when file id exists).
 * @deprecated Prefer {@link getGuildHqWorkbookHeroDisplay} for fallbacks / debugging.
 */
export function getGuildHqWorkbookHeroImageUrl(realmId: string): string | undefined {
  return getGuildHqWorkbookHeroDisplay(realmId)?.try_urls[0];
}

export function getGuildHqWorkbookEntry(realmId: string): GuildHqWorkbookImageEntry | undefined {
  return byRealmId.get(String(realmId ?? '').trim());
}
