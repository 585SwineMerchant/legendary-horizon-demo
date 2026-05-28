/**
 * oracleCareerData.ts
 *
 * Extended prophecy catalogue — adds `cluster_name` (CTE career cluster label) and
 * `realm_id` (the matching canon game realm) to each of the 41 Oracle of Fate prophecies.
 *
 * Source: `questOfFateLookup.ts` (base URLs) + `canonRealms.ts` (cluster → realm mapping).
 */

export type OracleCareerEntry = {
  prophecy_id: number;
  title: string;
  cluster_name: string;
  /** Canon realm ID whose career cluster matches this prophecy. */
  realm_id: string;
  /** Oracle of Fate / CareerOneStop URL */
  oracle_url: string;
  /** Vault of Runes / BLS OOH URL */
  research_url: string;
};

export const ORACLE_CAREER_DATA: OracleCareerEntry[] = [
  {
    prophecy_id: 1,
    title: 'Sky-Ship Architect',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Aerospace%20Engineering%20and%20Operations%20Technologists%20and%20Technicians&onetcode=17302100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/business-and-financial/logisticians.htm#tab-1',
  },
  {
    prophecy_id: 2,
    title: 'Great-Bird Mechanist',
    cluster_name: 'Transportation, Distribution, and Logistics',
    realm_id: 'realm_odyssey_harbor',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Aircraft%20Mechanics%20and%20Service%20Technicians&onetcode=49301100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/transportation-and-material-moving/delivery-truck-drivers-and-driver-sales-workers.htm',
  },
  {
    prophecy_id: 3,
    title: 'Citadel Designer',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Architects,%20Except%20Landscape%20and%20Naval&onetcode=17101100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/sales/insurance-sales-agents.htm',
  },
  {
    prophecy_id: 4,
    title: 'Iron-Steed Artificer',
    cluster_name: 'Transportation, Distribution, and Logistics',
    realm_id: 'realm_odyssey_harbor',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Automotive%20Service%20Technicians%20and%20Mechanics&onetcode=49302300&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/sales/retail-sales-workers.htm',
  },
  {
    prophecy_id: 5,
    title: 'Life-Essence Alchemist',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Biological%20Technicians&onetcode=19402100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/protective-service/correctional-officers.htm',
  },
  {
    prophecy_id: 6,
    title: 'Heavy-Goliath Tinkerer',
    cluster_name: 'Transportation, Distribution, and Logistics',
    realm_id: 'realm_odyssey_harbor',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Bus%20and%20Truck%20Mechanics%20and%20Diesel%20Engine%20Specialists&onetcode=49303100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/protective-service/security-guards.htm',
  },
  {
    prophecy_id: 7,
    title: 'Master of Beams & Joists',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Carpenters&onetcode=47203100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/production/bakers.htm',
  },
  {
    prophecy_id: 8,
    title: 'Empire Bridge-Builder',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Civil%20Engineers&onetcode=17205100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/production/assemblers-and-fabricators.htm',
  },
  {
    prophecy_id: 9,
    title: 'Grand Archive Overseer',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20and%20Information%20Systems%20Managers&onetcode=11302100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/personal-care-and-service/barbers-hairstylists-and-cosmetologists.htm',
  },
  {
    prophecy_id: 10,
    title: 'Void-Net Architect',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20Network%20Architects&onetcode=15124100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/personal-care-and-service/funeral-service-occupations.htm',
  },
  {
    prophecy_id: 11,
    title: 'Traveler Support Sage',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20User%20Support%20Specialists&onetcode=15123200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/food-preparation-and-serving/chefs-and-head-cooks.htm',
  },
  {
    prophecy_id: 12,
    title: 'Deep-Wood Preservationist',
    cluster_name: 'Agriculture, Food, and Natural Resources',
    realm_id: 'realm_aethelwood',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Conservation%20Scientists&onetcode=19103100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/transportation-and-material-moving/airline-and-commercial-pilots.htm',
  },
  {
    prophecy_id: 13,
    title: 'Gate & Gear Warden',
    cluster_name: 'Manufacturing',
    realm_id: 'realm_vulcanis_forge',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Control%20and%20Valve%20Installers%20and%20Repairers,%20Except%20Mechanical%20Door&onetcode=49901200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm',
  },
  {
    prophecy_id: 14,
    title: 'Fate-Pattern Oracle',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Data%20Scientists&onetcode=15205100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/healthcare/registered-nurses.htm',
  },
  {
    prophecy_id: 15,
    title: 'Crystal-Vault Keeper',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Database%20Administrators&onetcode=15124200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm',
  },
  {
    prophecy_id: 16,
    title: 'Guardian of the Oral Seal',
    cluster_name: 'Health Science',
    realm_id: 'realm_aurora_apothecary',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Dental%20Hygienists&onetcode=29129200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm',
  },
  {
    prophecy_id: 17,
    title: 'Storm-Current Summoner',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Electricians&onetcode=47211100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm',
  },
  {
    prophecy_id: 18,
    title: 'Terra-Stability Artisan',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Environmental%20Engineers&onetcode=17208100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/healthcare/physical-therapists.htm',
  },
  {
    prophecy_id: 19,
    title: 'Purification Shield-Bearer',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Environmental%20Science%20and%20Protection%20Technicians,%20Including%20Health&onetcode=19404200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/management/top-executives.htm',
  },
  {
    prophecy_id: 20,
    title: 'Master of Visual Illusion',
    cluster_name: 'Arts, Audio/Video Technology, and Communications',
    realm_id: 'realm_chroniclers_spire',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Fine%20Artists,%20Including%20Painters,%20Sculptors,%20and%20Illustrators&onetcode=27101300&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/architecture-and-engineering/civil-engineers.htm',
  },
  {
    prophecy_id: 21,
    title: 'Dragon-Breath Extinguisher',
    cluster_name: 'Law, Public Safety, Corrections, and Security',
    realm_id: 'realm_valors_watchtower',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Firefighters&onetcode=33201100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/life-physical-and-social-science/environmental-scientists-and-specialists.htm',
  },
  {
    prophecy_id: 22,
    title: 'Shadow-Clue Investigator',
    cluster_name: 'Law, Public Safety, Corrections, and Security',
    realm_id: 'realm_valors_watchtower',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Forensic%20Science%20Technicians&onetcode=19409200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/community-and-social-service/social-workers.htm',
  },
  {
    prophecy_id: 23,
    title: 'Stone-Speak Whisperer',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Geoscientists,%20Except%20Hydrologists%20and%20Exographers&onetcode=19204200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/legal/lawyers.htm',
  },
  {
    prophecy_id: 24,
    title: 'Sigil & Symbol Weaver',
    cluster_name: 'Arts, Audio/Video Technology, and Communications',
    realm_id: 'realm_chroniclers_spire',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Graphic%20Designers&onetcode=27102400&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/installation-maintenance-and-repair/industrial-machinery-mechanics-machinery-maintenance-workers-and-millwrights.htm',
  },
  {
    prophecy_id: 25,
    title: 'Thermal-Aura Harmonizer',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Heating,%20Air%20Conditioning,%20and%20Refrigeration%20Mechanics%20and%20Installers&onetcode=49902100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/farming-fishing-and-forestry/agricultural-workers.htm',
  },
  {
    prophecy_id: 26,
    title: 'Forge-Efficiency Strategist',
    cluster_name: 'Manufacturing',
    realm_id: 'realm_vulcanis_forge',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Industrial%20Engineering%20Technologists%20and%20Technicians&onetcode=17302600&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/media-and-communication/public-relations-specialists.htm',
  },
  {
    prophecy_id: 27,
    title: 'Cyber-Fortress Sentinel',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Information%20Security%20Analysts&onetcode=15121200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/business-and-financial/market-research-analysts.htm',
  },
  {
    prophecy_id: 28,
    title: 'Inner-Sanctum Decorator',
    cluster_name: 'Arts, Audio/Video Technology, and Communications',
    realm_id: 'realm_chroniclers_spire',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Interior%20Designers&onetcode=27102500&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/transportation-and-material-moving/logisticians.htm',
  },
  {
    prophecy_id: 29,
    title: 'General Lore-Technician',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Life,%20Physical,%20and%20Social%20Science%20Technicians,%20All%20Other&onetcode=19409900&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/building-and-grounds-cleaning/janitors-and-building-cleaners.htm',
  },
  {
    prophecy_id: 30,
    title: 'Blood-Omen Analyzer',
    cluster_name: 'Health Science',
    realm_id: 'realm_aurora_apothecary',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Medical%20and%20Clinical%20Laboratory%20Technicians&onetcode=29201200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/production/welders-cutters-solderers-and-brazers.htm',
  },
  {
    prophecy_id: 31,
    title: 'Healer-Script Scribe',
    cluster_name: 'Health Science',
    realm_id: 'realm_aurora_apothecary',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Medical%20Records%20Specialists&onetcode=29207200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/entertainment-and-sports/coaches-and-scouts.htm',
  },
  {
    prophecy_id: 32,
    title: 'Siege-Engine Mechanist',
    cluster_name: 'Transportation, Distribution, and Logistics',
    realm_id: 'realm_odyssey_harbor',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Mobile%20Heavy%20Equipment%20Mechanics,%20Except%20Engines&onetcode=49304200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/healthcare/veterinarians.htm',
  },
  {
    prophecy_id: 33,
    title: 'Digital Domain Warden',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Network%20and%20Computer%20Systems%20Administrators&onetcode=15124400&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/computer-and-information-technology/computer-support-specialists.htm',
  },
  {
    prophecy_id: 34,
    title: 'High-Tier Elixir Master',
    cluster_name: 'Health Science',
    realm_id: 'realm_aurora_apothecary',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Nurse%20Practitioners&onetcode=29117100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/life-physical-and-social-science/forensic-science-technicians.htm',
  },
  {
    prophecy_id: 35,
    title: 'Limb-Recovery Adept',
    cluster_name: 'Health Science',
    realm_id: 'realm_aurora_apothecary',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Physical%20Therapist%20Assistant&onetcode=31202100&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/food-preparation-and-serving/food-service-managers.htm',
  },
  {
    prophecy_id: 36,
    title: 'Water-Way Alchemist',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Plumbers,%20Pipefitters,%20and%20Steamfitters&onetcode=47215200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/architecture-and-engineering/architects.htm',
  },
  {
    prophecy_id: 37,
    title: 'Digital Runeweaver',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Software%20Developers&onetcode=15125200&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/education-training-and-library/librarians.htm',
  },
  {
    prophecy_id: 38,
    title: 'Cartographer of Lost Lands',
    cluster_name: 'Architecture and Construction',
    realm_id: 'realm_monolith_masonry',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Surveying%20and%20Mapping%20Technicians&onetcode=17303100&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/personal-care-and-service/recreation-and-fitness-workers.htm',
  },
  {
    prophecy_id: 39,
    title: 'Ethereal-Scroll Maker',
    cluster_name: 'Information Technology',
    realm_id: 'realm_etheric_nexus',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Web%20Developers&onetcode=15125400&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm',
  },
  {
    prophecy_id: 40,
    title: 'Inferno-Weld Acolyte',
    cluster_name: 'Manufacturing',
    realm_id: 'realm_vulcanis_forge',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Welding,%20Soldering,%20and%20Brazing%20Machine%20Setters,%20Operators,%20and%20Tenders&onetcode=51412200&location=UNITED%20STATES',
    research_url:
      'https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm',
  },
  {
    prophecy_id: 41,
    title: 'Beast-Kin Warden',
    cluster_name: 'Science, Technology, Engineering, and Mathematics',
    realm_id: 'realm_alchemical_observatory',
    oracle_url:
      'https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Zoologists%20and%20Wildlife%20Biologists&onetcode=19102300&location=UNITED%20STATES',
    research_url: 'https://www.bls.gov/ooh/healthcare/emts-and-paramedics.htm',
  },
];

export function getOracleCareerEntry(id: number): OracleCareerEntry | undefined {
  return ORACLE_CAREER_DATA.find((e) => e.prophecy_id === id);
}
