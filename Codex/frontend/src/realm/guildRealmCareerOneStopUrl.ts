/**
 * CareerOneStop cluster pages — URLs lifted from `Project Documents/Fog of the unknown.html`
 * realm modal slides (authoritative for this vertical slice).
 */
const REALM_ID_TO_CAREERONESTOP: Readonly<Record<string, string>> = {
  realm_aethelwood: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/agriculture.aspx',
  realm_monolith_masonry: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/construction.aspx',
  realm_chroniclers_spire:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/arts-entertainment-and-design.aspx',
  realm_mercantile_citadel:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/management-and-entrepreneurship.aspx',
  realm_archives_ascension: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/education.aspx',
  realm_gilded_vault: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/financial-services.aspx',
  realm_high_council_hall:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/public-service-and-safety.aspx',
  realm_aurora_apothecary:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/healthcare-and-human-services.aspx',
  realm_crossroads_haven:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/hospitality-events-and-tourism.aspx',
  realm_empaths_enclave:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/healthcare-and-human-services.aspx',
  realm_etheric_nexus: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/digital-technology.aspx',
  realm_valors_watchtower:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/public-service-and-safety.aspx',
  realm_vulcanis_forge:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/advanced-manufacturing.aspx?secondaryNavPanels=Ag%3D%3D',
  realm_bards_beacon: 'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/marketing-and-sales.aspx',
  realm_alchemical_observatory:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/energy-and-natural-resources.aspx',
  realm_odyssey_harbor:
    'https://www.careeronestop.org/ExploreCareers/Learn/CareerClusters/supply-chain-and-transportation.aspx',
};

export function getGuildRealmCareerOneStopUrl(realmId: string): string | undefined {
  const id = String(realmId ?? '').trim();
  return REALM_ID_TO_CAREERONESTOP[id];
}
