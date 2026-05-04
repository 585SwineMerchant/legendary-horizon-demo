import guildHqWorkbookImageMapJson from '@samples/guild_hq_workbook_image_map.json';

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
 * Browser-facing Guild Info hero URLs derived from the workbook map.
 *
 * The xlsx “New URL for project” column uses `uc?export=view`, which often fails as `<img src>` in
 * the same contexts where the legacy atlas used **`drive.google.com/thumbnail?id=…&sz=w2500`**
 * (see `Fog of the unknown.html`). We prefer the thumbnail form when `drive_file_id` is known.
 */
export function getGuildHqWorkbookHeroDisplay(realmId: string): GuildHqWorkbookHeroDisplay | undefined {
  const id = String(realmId ?? '').trim();
  if (!id) return undefined;
  const row = byRealmId.get(id);
  if (!row) return undefined;
  const fileId = String(row.drive_file_id ?? '').trim();
  const uc = String(row.hero_image_url ?? '').trim();
  const try_urls: string[] = [];
  if (fileId) try_urls.push(driveThumbnailUrl(fileId));
  if (uc && !try_urls.includes(uc)) try_urls.push(uc);
  if (!try_urls.length && uc) try_urls.push(uc);
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
