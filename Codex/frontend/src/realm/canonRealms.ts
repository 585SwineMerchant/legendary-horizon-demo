import type { RealmDefinition } from '../domain/lh-contract';

// Canon realm registry (16 active realms).
//
// Notes:
// - `realm_id` is stable and used across saves, quests, and Sheets.
// - Guild HQs are primarily research / narrative anchors; `map_tiled_export` is an optional future per-realm Tiled slice (nullable is normal).
// - Arcanum Reactor / Energy realm is intentionally excluded from active canon for now.

export const CANON_REALMS: readonly RealmDefinition[] = [
  {
    realm_id: 'realm_aethelwood',
    career_cluster: 'Agriculture, Food, and Natural Resources',
    guild_headquarters: 'Aethelwood Farmsteads',
    display_name: 'Aethelwood',
    slug: 'aethelwood',
    lore_digest: "A sprawling, untamed forest where Druids and Rangers manage the land's vital life force.",
    map_tiled_export: 'aethelwood_demo.json',
    tags: ['canon', 'demo_map', 'nature_primary'],
    sort_order: 1,
  },
  {
    realm_id: 'realm_monolith_masonry',
    career_cluster: 'Architecture and Construction',
    guild_headquarters: 'Monolith of Masonry',
    display_name: 'Monolith of Masonry',
    slug: 'monolith-masonry',
    lore_digest: 'An impenetrable mountain fortress built by master stonemasons and engineers.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 2,
  },
  {
    realm_id: 'realm_chroniclers_spire',
    career_cluster: 'Arts, Audio/Video Technology, and Communications',
    guild_headquarters: "Chronicler's Spire",
    display_name: "Chronicler's Spire",
    slug: 'chroniclers-spire',
    lore_digest: "A tower of shifting light and sound where Bards and Illusionists craft the world's stories.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 3,
  },
  {
    realm_id: 'realm_mercantile_citadel',
    career_cluster: 'Business Management and Administration',
    guild_headquarters: "Mercantile's Citadel",
    display_name: "Mercantile's Citadel",
    slug: 'mercantile-citadel',
    lore_digest: "The administrative heart of the land, where High Strategists oversee the Realm's operations.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 4,
  },
  {
    realm_id: 'realm_archives_ascension',
    career_cluster: 'Education and Training',
    guild_headquarters: 'The Archives of Ascension',
    display_name: 'Archives of Ascension',
    slug: 'archives-ascension',
    lore_digest: 'A vast library where Guild Mentors pass down ancient knowledge to the next generation of Travelers.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 5,
  },
  {
    realm_id: 'realm_gilded_vault',
    career_cluster: 'Finance',
    guild_headquarters: 'The Gilded Vault',
    display_name: 'The Gilded Vault',
    slug: 'gilded-vault',
    lore_digest: "A secure, underground treasury where the Coinmasters balance the Realm's gold and resources.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 6,
  },
  {
    realm_id: 'realm_high_council_hall',
    career_cluster: 'Government and Public Administration',
    guild_headquarters: 'The High Council Hall',
    display_name: 'The High Council Hall',
    slug: 'high-council-hall',
    lore_digest: 'A majestic assembly where the Regents draft the laws that keep the darkness at bay.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 7,
  },
  {
    realm_id: 'realm_aurora_apothecary',
    career_cluster: 'Health Science',
    guild_headquarters: 'Aurora Apothecary',
    display_name: 'Aurora Apothecary',
    slug: 'aurora-apothecary',
    lore_digest: 'A tranquil glade filled with glowing herbs, where Healers mend the wounds of those returning from Trials.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 8,
  },
  {
    realm_id: 'realm_crossroads_haven',
    career_cluster: 'Hospitality and Tourism',
    guild_headquarters: 'The Crossroads Haven',
    display_name: 'The Crossroads Haven',
    slug: 'crossroads-haven',
    lore_digest: 'A welcoming outpost for weary Travelers, offering rest and information on the road to the Horizon.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 9,
  },
  {
    realm_id: 'realm_empaths_enclave',
    career_cluster: 'Human Services',
    guild_headquarters: "Empath's Enclave",
    display_name: "Empath's Enclave",
    slug: 'empaths-enclave',
    lore_digest: "A sanctuary dedicated to supporting the citizens of the land and guiding lost souls.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 10,
  },
  {
    realm_id: 'realm_etheric_nexus',
    career_cluster: 'Information Technology',
    guild_headquarters: 'The Etheric Nexus',
    display_name: 'The Etheric Nexus',
    slug: 'etheric-nexus',
    lore_digest: 'A glowing network of blue ley lines where Technomancers manage the flow of digital magic.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 11,
  },
  {
    realm_id: 'realm_valors_watchtower',
    career_cluster: 'Law, Public Safety, Corrections, and Security',
    guild_headquarters: "Valor's Watchtower",
    display_name: "Valor's Watchtower",
    slug: 'valors-watchtower',
    lore_digest: 'A high-vantage garrison where the Iron Guard keeps watch against external threats.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 12,
  },
  {
    realm_id: 'realm_vulcanis_forge',
    career_cluster: 'Manufacturing',
    guild_headquarters: 'The Great Vulcanis Forge',
    display_name: 'The Great Vulcanis Forge',
    slug: 'vulcanis-forge',
    lore_digest: "A thundering workshop of heat and steel where Artificers mass-produce the gear for the Guilds.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 13,
  },
  {
    realm_id: 'realm_bards_beacon',
    career_cluster: 'Marketing',
    guild_headquarters: "The Bard's Beacon",
    display_name: "The Bard's Beacon",
    slug: 'bards-beacon',
    lore_digest: "A plaza filled with glowing signs and Heralds spreading word of the Guilds' triumphs.",
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 14,
  },
  {
    realm_id: 'realm_alchemical_observatory',
    career_cluster: 'Science, Technology, Engineering, and Mathematics',
    guild_headquarters: 'The Alchemical Observatory',
    display_name: 'The Alchemical Observatory',
    slug: 'alchemical-observatory',
    lore_digest: 'A high-altitude lab where Alchemists and Astronomers decode the laws of the universe.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 15,
  },
  {
    realm_id: 'realm_odyssey_harbor',
    career_cluster: 'Transportation, Distribution, and Logistics',
    guild_headquarters: "Odyssey's Harbor",
    display_name: "Odyssey's Harbor",
    slug: 'odyssey-harbor',
    lore_digest: 'A bustling hub of airships and caravans ensuring resources reach every corner of the land.',
    map_tiled_export: null,
    tags: ['canon', 'placeholder_map'],
    sort_order: 16,
  },
] as const;

export const CANON_REALM_IDS = CANON_REALMS.map((r) => r.realm_id) as readonly string[];

export const CANON_REALMS_BY_ID: ReadonlyMap<string, RealmDefinition> = new Map(
  CANON_REALMS.map((r) => [r.realm_id, r] as const),
);

/** True when no optional per-realm Tiled slice is configured (expected for most guild rows today). */
export function isRealmPlaceholder(realm: RealmDefinition): boolean {
  return !realm.map_tiled_export;
}

// Dev-time sanity checks (non-throwing in prod builds).
if (import.meta.env?.DEV) {
  if (CANON_REALMS.length !== 16) {
    // eslint-disable-next-line no-console
    console.warn('[LHRealmCanon] Expected 16 realms, got', CANON_REALMS.length);
  }
  if (CANON_REALMS.some((r) => /arcanum|reactor|energy/i.test(r.display_name) || /arcanum|reactor|energy/i.test(r.realm_id))) {
    // eslint-disable-next-line no-console
    console.warn('[LHRealmCanon] Arcanum Reactor / Energy realm should not be in active canon.');
  }
}

