/**
 * lhMediaManifest — typed static registry of all local runtime media assets.
 *
 * ARCHITECTURE DECISION (2026-06-15)
 * ───────────────────────────────────
 * Google Drive is a repository/workflow tool, NOT the runtime CDN for Legendary Horizon.
 * All runtime images, video, audio, sprites, and tilesets must live under `public/assets/`
 * and be served from the same origin as the game build (GitHub Pages / local dev server).
 *
 * Google Sheets / Apps Script remain authoritative for:
 *   save/load, roster data, worksheet submissions, Comparison Ledger, quest state, teacher dashboard.
 *
 * LOCAL ASSET CONVENTION
 * ────────────────────────
 * Paths are relative to /assets/ (no leading slash).
 * Pass to `publicAssetUrl(entry.local_path)` to get a fully-resolved URL.
 *
 * LOAD GROUPS
 * ────────────
 * always-load  — core UI, player sprite, common NPCs, SFX; bundled or preloaded at boot.
 * act-load     — Oracle cinematic assets, Scroll of Destiny art, World Atlas map image.
 * realm-load   — Guild Hub hero images, realm ambience, realm-specific NPCs; lazy per-realm.
 * encounter-load — battle backgrounds, enemy sprites, encounter music.
 *
 * ADDING NEW ASSETS
 * ──────────────────
 * 1. Add the file to `public/assets/<category>/`.
 * 2. Add an entry to the relevant typed record below with `local_path: 'assets/<category>/<name>.webp'`.
 * 3. Reference `LH_MEDIA_MANIFEST` in the loading code — do NOT construct Drive URLs inline.
 */

export type LhMediaAssetType = 'image' | 'video' | 'audio' | 'sprite' | 'tileset';

export type LhMediaAssetLoadGroup = 'always-load' | 'act-load' | 'realm-load' | 'encounter-load';

export type LhMediaManifestEntry = {
  /** Stable identifier — matches asset_id in media_assets.json when a catalog entry exists. */
  asset_id: string;
  asset_type: LhMediaAssetType;
  /** Canon realm_id when this asset is scoped to a specific guild. */
  realm_id?: string;
  /** NPC identifier when this asset is scoped to a specific NPC. */
  npc_id?: string;
  /**
   * Path as passed to `publicAssetUrl()` / `resolveLhAssetUrl()` — includes the `assets/` prefix,
   * no leading slash. Example: `'assets/guilds/aethelwood.webp'`.
   * Matches the convention used throughout PhaserExplorationView and lhSfx (e.g. `assets/maps/foo.png`).
   */
  local_path: string;
  /** Accessible alt text or fallback label shown in text-card fallback. */
  alt: string;
  load_group: LhMediaAssetLoadGroup;
};

// ── World Atlas ────────────────────────────────────────────────────────────────

export const LH_MEDIA_WORLD_ATLAS: LhMediaManifestEntry = {
  asset_id: 'world_atlas_map',
  asset_type: 'image',
  local_path: 'assets/maps/realm-atlas-world.webp',
  alt: 'Legendary Horizon world map — illustrated parchment showing all 16 guild realms',
  load_group: 'act-load',
};

// ── Guild HQ Hero Images (16 realms) ──────────────────────────────────────────
//
// Convention: local_path = guilds/{slug}.webp
// Images must be placed in public/assets/guilds/ before they will appear.
// Until a file exists the waterfall falls through to the text-card fallback.
//
// To add a guild image:
//   1. Export/convert the image to WebP at ~1280×800 px (2500px wide originals → WebP at 80% quality).
//   2. Name the file after the realm slug (e.g. aethelwood.webp).
//   3. Place it in: Codex/frontend/public/assets/guilds/
//   4. The manifest record below already points to it — no code change needed.

export const LH_MEDIA_GUILD_HEROES: readonly LhMediaManifestEntry[] = [
  {
    asset_id: 'guild_hq_hero_realm_aethelwood',
    asset_type: 'image',
    realm_id: 'realm_aethelwood',
    local_path: 'assets/guilds/aethelwood.webp',
    alt: 'Aethelwood Farmsteads — Agriculture, Food, and Natural Resources guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_monolith_masonry',
    asset_type: 'image',
    realm_id: 'realm_monolith_masonry',
    local_path: 'assets/guilds/monolith-masonry.webp',
    alt: 'Monolith of Masonry — Architecture and Construction guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_chroniclers_spire',
    asset_type: 'image',
    realm_id: 'realm_chroniclers_spire',
    local_path: 'assets/guilds/chroniclers-spire.webp',
    alt: "Chronicler's Spire — Arts, Audio/Video Technology, and Communications guild headquarters",
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_mercantile_citadel',
    asset_type: 'image',
    realm_id: 'realm_mercantile_citadel',
    local_path: 'assets/guilds/mercantile-citadel.webp',
    alt: "Mercantile's Citadel — Business Management and Administration guild headquarters",
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_archives_ascension',
    asset_type: 'image',
    realm_id: 'realm_archives_ascension',
    local_path: 'assets/guilds/archives-ascension.webp',
    alt: 'Archives of Ascension — Education and Training guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_gilded_vault',
    asset_type: 'image',
    realm_id: 'realm_gilded_vault',
    local_path: 'assets/guilds/gilded-vault.webp',
    alt: 'The Gilded Vault — Finance guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_high_council_hall',
    asset_type: 'image',
    realm_id: 'realm_high_council_hall',
    local_path: 'assets/guilds/high-council-hall.webp',
    alt: 'The High Council Hall — Government and Public Administration guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_aurora_apothecary',
    asset_type: 'image',
    realm_id: 'realm_aurora_apothecary',
    local_path: 'assets/guilds/aurora-apothecary.webp',
    alt: 'Aurora Apothecary — Health Science guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_crossroads_haven',
    asset_type: 'image',
    realm_id: 'realm_crossroads_haven',
    local_path: 'assets/guilds/crossroads-haven.webp',
    alt: 'The Crossroads Haven — Hospitality and Tourism guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_empaths_enclave',
    asset_type: 'image',
    realm_id: 'realm_empaths_enclave',
    local_path: 'assets/guilds/empaths-enclave.webp',
    alt: "Empath's Enclave — Human Services guild headquarters",
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_etheric_nexus',
    asset_type: 'image',
    realm_id: 'realm_etheric_nexus',
    local_path: 'assets/guilds/etheric-nexus.webp',
    alt: 'The Etheric Nexus — Information Technology guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_valors_watchtower',
    asset_type: 'image',
    realm_id: 'realm_valors_watchtower',
    local_path: 'assets/guilds/valors-watchtower.webp',
    alt: "Valor's Watchtower — Law, Public Safety, Corrections, and Security guild headquarters",
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_vulcanis_forge',
    asset_type: 'image',
    realm_id: 'realm_vulcanis_forge',
    local_path: 'assets/guilds/vulcanis-forge.webp',
    alt: 'The Great Vulcanis Forge — Manufacturing guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_bards_beacon',
    asset_type: 'image',
    realm_id: 'realm_bards_beacon',
    local_path: 'assets/guilds/bards-beacon.webp',
    alt: "The Bard's Beacon — Marketing guild headquarters",
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_alchemical_observatory',
    asset_type: 'image',
    realm_id: 'realm_alchemical_observatory',
    local_path: 'assets/guilds/alchemical-observatory.webp',
    alt: 'The Alchemical Observatory — Science, Technology, Engineering, and Mathematics guild headquarters',
    load_group: 'realm-load',
  },
  {
    asset_id: 'guild_hq_hero_realm_odyssey_harbor',
    asset_type: 'image',
    realm_id: 'realm_odyssey_harbor',
    local_path: 'assets/guilds/odyssey-harbor.webp',
    alt: "Odyssey's Harbor — Transportation, Distribution, and Logistics guild headquarters",
    load_group: 'realm-load',
  },
];

// ── Index helpers ──────────────────────────────────────────────────────────────

const _guildHeroByRealmId: ReadonlyMap<string, LhMediaManifestEntry> = new Map(
  LH_MEDIA_GUILD_HEROES.filter((e) => !!e.realm_id).map((e) => [e.realm_id!, e]),
);

/** Resolve the local static manifest entry for a guild HQ hero by realm_id. */
export function getGuildHeroManifestEntry(realmId: string): LhMediaManifestEntry | undefined {
  return _guildHeroByRealmId.get(String(realmId ?? '').trim());
}
