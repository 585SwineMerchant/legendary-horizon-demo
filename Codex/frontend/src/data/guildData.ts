export type GuildData = {
  guild_id: string;
  name: string;
  career_cluster: string;
  thematic_descriptor: string;
  riasec_primary: string;
  riasec_secondary: string | null;
};

export const GUILD_REGISTRY: GuildData[] = [
  {
    guild_id: 'realm_aethelwood',
    name: 'Aethelwood Farmsteads',
    career_cluster: 'Agriculture, Food, Natural Resources',
    thematic_descriptor: 'Cycle of the Living Land',
    riasec_primary: 'R',
    riasec_secondary: null,
  },
  {
    guild_id: 'realm_aurora_apothecary',
    name: 'Aurora Apothecary',
    career_cluster: 'Health Science',
    thematic_descriptor: 'Emanation of Wholeness',
    riasec_primary: 'S',
    riasec_secondary: 'I',
  },
  {
    guild_id: 'realm_archives_ascension',
    name: 'Archives of Ascension',
    career_cluster: 'Education & Training',
    thematic_descriptor: 'Ascending Tiers of Knowing',
    riasec_primary: 'I',
    riasec_secondary: 'C',
  },
  {
    guild_id: 'realm_etheric_nexus',
    name: 'The Etheric Nexus',
    career_cluster: 'Information Technology',
    thematic_descriptor: 'Web of Flowing Signal',
    riasec_primary: 'I',
    riasec_secondary: 'R',
  },
  {
    guild_id: 'realm_chroniclers_spire',
    name: "Chronicler's Spire",
    career_cluster: 'Arts, A/V Tech & Communications',
    thematic_descriptor: 'Convergence of Voice and Vision',
    riasec_primary: 'A',
    riasec_secondary: null,
  },
  {
    guild_id: 'realm_empaths_enclave',
    name: "Empath's Enclave",
    career_cluster: 'Human Services',
    thematic_descriptor: 'Vessel of Human Care',
    riasec_primary: 'S',
    riasec_secondary: null,
  },
  {
    guild_id: 'realm_mercantile_citadel',
    name: "Mercantile's Citadel",
    career_cluster: 'Business Management & Administration',
    thematic_descriptor: 'Architecture of Decision',
    riasec_primary: 'E',
    riasec_secondary: 'C',
  },
  {
    guild_id: 'realm_monolith_masonry',
    name: 'Monolith of Masonry',
    career_cluster: 'Architecture & Construction',
    thematic_descriptor: 'Foundation That Bears All Weight',
    riasec_primary: 'R',
    riasec_secondary: 'C',
  },
  {
    guild_id: 'realm_odyssey_harbor',
    name: "Odyssey's Harbor",
    career_cluster: 'Transportation, Distribution, Logistics',
    thematic_descriptor: 'Current That Connects All Points',
    riasec_primary: 'R',
    riasec_secondary: 'E',
  },
  {
    guild_id: 'realm_alchemical_observatory',
    name: 'The Alchemical Observatory',
    career_cluster: 'Science, Technology, Engineering, Mathematics',
    thematic_descriptor: 'Axis of Discovery',
    riasec_primary: 'I',
    riasec_secondary: null,
  },
  {
    guild_id: 'realm_bards_beacon',
    name: "The Bard's Beacon",
    career_cluster: 'Marketing',
    thematic_descriptor: 'Signal That Reaches the Many',
    riasec_primary: 'E',
    riasec_secondary: 'A',
  },
  {
    guild_id: 'realm_crossroads_haven',
    name: 'The Crossroads Haven',
    career_cluster: 'Hospitality & Tourism',
    thematic_descriptor: 'Hearth at the Meeting of Ways',
    riasec_primary: 'S',
    riasec_secondary: 'E',
  },
  {
    guild_id: 'realm_gilded_vault',
    name: 'The Gilded Vault',
    career_cluster: 'Finance',
    thematic_descriptor: 'Order of Measure and Exchange',
    riasec_primary: 'C',
    riasec_secondary: 'E',
  },
  {
    guild_id: 'realm_vulcanis_forge',
    name: 'The Great Vulcanis Forge',
    career_cluster: 'Manufacturing',
    thematic_descriptor: 'Many Hands That Shape One Thing',
    riasec_primary: 'R',
    riasec_secondary: 'C',
  },
  {
    guild_id: 'realm_high_council_hall',
    name: 'The High Council Hall',
    career_cluster: 'Government & Public Administration',
    thematic_descriptor: 'Axis of Governance and Common Will',
    riasec_primary: 'E',
    riasec_secondary: 'S',
  },
  {
    guild_id: 'realm_valors_watchtower',
    name: "Valor's Watchtower",
    career_cluster: 'Law, Public Safety, Corrections, Security',
    thematic_descriptor: 'Vigil That Holds the Line',
    riasec_primary: 'R',
    riasec_secondary: 'S',
  },
];

export const GUILD_REGISTRY_BY_ID: ReadonlyMap<string, GuildData> = new Map(
  GUILD_REGISTRY.map((g) => [g.guild_id, g]),
);

export function getGuildById(guildId: string): GuildData | undefined {
  return GUILD_REGISTRY_BY_ID.get(guildId);
}
