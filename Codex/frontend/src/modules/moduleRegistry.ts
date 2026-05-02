import type { ModuleDefinition } from '../types';

/**
 * Phase 1 deliverable: single source-of-truth module registry.
 * These are now wired to active module implementations under `frontend/src/modules/*`.
 */
export const LH_MODULE_REGISTRY: ModuleDefinition[] = [
  {
    module_id: 'mod_gt101_enrollment_rune',
    title: 'Enrollment Rune (GT-101)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'gq_gt101_enrollment_rune',
    act: 4,
    route_key: 'gt101',
  },
  {
    module_id: 'mod_gt102_trial_of_tongues',
    title: 'Trial of Tongues (GT-102)',
    realm_id: 'realm_etheric_nexus',
    quest_id: 'gq_gt102_trial_of_tongues',
    act: 4,
    route_key: 'gt102',
  },
  {
    module_id: 'mod_oracle_of_fate',
    title: 'Oracle of Fate',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq_act2_oracle_of_fate',
    act: 2,
    route_key: 'oracle-of-fate',
  },
  {
    module_id: 'mod_vault_of_runes',
    title: 'Vault of Runes',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq_act2_vault_of_runes',
    act: 2,
    route_key: 'vault-of-runes',
  },
  {
    module_id: 'mod_fog_of_unknown',
    title: 'Fog of the Unknown (World Map)',
    realm_id: 'realm_high_council_hall',
    quest_id: 'gq_act3_fog_of_unknown',
    act: 3,
    route_key: 'fog-of-unknown',
  },
  {
    module_id: 'mod_manifest_sod',
    title: "Janene's SOD (Manifest)",
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq_act1_manifest_support',
    act: 1,
    route_key: 'manifest',
  },
];

export function getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
  return LH_MODULE_REGISTRY.find((m) => m.module_id === moduleId);
}

