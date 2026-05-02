export type Screen = 'title' | 'instructions' | 'resume' | 'explore';

export type {
  InventoryLineItem,
  InventorySummary,
  LhRuntimeFixture,
  ManualSaveEnvelopeV1,
  MediaAssetRecord,
  PlayerSave,
  QuestDefinition,
  RealmDefinition,
  RealmExplorationProgressEntry,
  RitualDraftsV1,
  RosterStudentRecord,
  SessionSummaryV1,
} from './domain/lh-contract';

export type { ComparisonLedgerEntry, ExplorationLoopState } from './exploration/explorationTypes';
export type { RealmProgressMap } from './realm/realmProgress';

/** @deprecated Prefer QuestDefinition — alias retained for gradual migration. */
export type { QuestDefinition as QuestRow } from './domain/lh-contract';

/** @deprecated Prefer MediaAssetRecord — alias retained for gradual migration. */
export type { MediaAssetRecord as MediaAssetRow } from './domain/lh-contract';
