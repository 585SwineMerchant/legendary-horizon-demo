import type { ModuleDefinition } from '../types';

/**
 * Phase 1 deliverable: single source-of-truth module registry.
 * These are now wired to active module implementations under `frontend/src/modules/*`.
 */
export const LH_MODULE_REGISTRY: ModuleDefinition[] = [
  // ── Guild Trials — Act 4 ──────────────────────────────────────────────────
  {
    module_id: 'mod_gt100_guardian_boss',
    title: 'Face the Guardian (GT-100)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'gt-100',
    act: 4,
    route_key: 'gt100-guardian-boss',
  },
  {
    module_id: 'mod_gt101_enrollment_rune',
    title: 'Rite of Enrollment (GT-101)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'gt-101',
    act: 4,
    route_key: 'gt101',
  },
  {
    module_id: 'mod_gt102_trial_of_tongues',
    title: 'Trial of Tongues (GT-102)',
    realm_id: 'realm_etheric_nexus',
    quest_id: 'gt-102',
    act: 4,
    route_key: 'gt102',
  },
  {
    module_id: 'mod_oracle_of_fate',
    title: 'Oracle of Fate',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-203',
    act: 2,
    route_key: 'oracle-of-fate',
  },
  {
    module_id: 'mod_vault_of_runes',
    title: 'Vault of Runes',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-204',
    act: 2,
    route_key: 'vault-of-runes',
  },
  {
    module_id: 'mod_quest_of_fate_worksheet',
    title: 'Quest of Fate Worksheet',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-204',
    act: 2,
    route_key: 'quest-of-fate-worksheet',
  },
  {
    module_id: 'mod_fog_of_unknown',
    title: 'Career Comparison Worksheet',
    realm_id: 'realm_high_council_hall',
    quest_id: 'mq-301',
    act: 3,
    route_key: 'fog-of-unknown',
  },
  {
    module_id: 'mod_manifest_sod',
    title: "Janene's SOD (Manifest)",
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-202',
    act: 1,
    route_key: 'manifest',
  },
  {
    module_id: 'mod_master_scribe_survey',
    title: "Traveler's Survey (Master Scribe)",
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-104',
    act: 1,
    route_key: 'master-scribe-survey',
  },
  {
    module_id: 'mod_gt103_artificers_ethics',
    title: "Artificer's Ethics Trial (GT-103)",
    realm_id: 'realm_crossroads_haven',
    quest_id: 'gt-103',
    act: 4,
    route_key: 'gt103',
  },
  {
    module_id: 'mod_gt104_quest_of_choice',
    title: 'Quest of Choice (GT-104)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'gt-104',
    act: 4,
    route_key: 'gt104',
  },
  {
    module_id: 'mod_manifest_finalization',
    title: 'Finalize the Traveler Manifest',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'mq-404',
    act: 4,
    route_key: 'manifest-finalization',
  },
  {
    module_id: 'mod_great_transcription',
    title: 'Great Transcription',
    realm_id: 'realm_archives_ascension',
    quest_id: 'mq-405',
    act: 4,
    route_key: 'great-transcription',
  },
  // ── Side Quest ────────────────────────────────────────────────────────────
  {
    module_id: 'mod_sq202_career_interview',
    title: 'Echoes of Experience — Career Interview (SQ-202)',
    realm_id: 'realm_archives_ascension',
    quest_id: 'sq-202',
    act: 2,
    route_key: 'sq202-career-interview',
  },
  // ── Act 5 ─────────────────────────────────────────────────────────────────
  {
    module_id: 'mod_fa101_chronicle',
    title: 'Chronicle of the Horizon (FA-101)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'fa-101',
    act: 5,
    route_key: 'fa101-chronicle',
  },
  {
    module_id: 'mod_fa104_grand_council',
    title: 'Grand Council — Career Fair (FA-104)',
    realm_id: 'realm_crossroads_haven',
    quest_id: 'fa-104',
    act: 5,
    route_key: 'fa104-grand-council',
  },
  // ── Act 6 / Epilogue ──────────────────────────────────────────────────────
  {
    module_id: 'mod_ep101_epilogue',
    title: 'Enter the Epilogue (EP-101)',
    realm_id: 'realm_archives_ascension',
    quest_id: 'ep-101',
    act: 6,
    route_key: 'ep101-epilogue',
  },
  {
    module_id: 'mod_ep102_course_selection',
    title: 'Course Selection Ritual (EP-102)',
    realm_id: 'realm_archives_ascension',
    quest_id: 'ep-102',
    act: 6,
    route_key: 'ep102-course-selection',
  },
];

export function getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
  return LH_MODULE_REGISTRY.find((m) => m.module_id === moduleId);
}

