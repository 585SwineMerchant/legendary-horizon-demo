export type Screen = 'title' | 'instructions' | 'resume' | 'explore';

export type NightOneNavigate = {
  beginDemo: () => Promise<void>;
  quitToTitle: () => void;
  proceedInstructions: () => void;
  resumeToExplore: () => void;
  openPause: () => void;
  closePause: () => void;
  openQuestLog: () => void;
  closeQuestLog: () => void;
  dismissSaveFeedback: () => void;
  openRealmAtlas: () => void;
  closeRealmAtlas: () => void;
  openWorldMap: () => void;
  closeWorldMap: () => void;
  openResearchWorksheets: () => void;
  closeResearchWorksheets: () => void;
  openInventory: () => void;
  closeInventory: () => void;
  openModule: (moduleId: string) => void;
  closeModule: () => void;
};

export type {
  AcademicTaskKind,
  AcademicTaskProgress,
  AcademicTaskStatus,
  AcademicWorksheetFieldDef,
  AcademicWorksheetTaskDef,
  EncounterLogEntryV1,
  InventoryLineItem,
  InventorySummary,
  ModuleDefinition,
  ModuleProgressState,
  ModuleResultPayload,
  LhBackupCheckpointV1,
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

export type {
  LhDialogueCatalogV1,
  LhDialogueCondition,
  LhDialogueLine,
  LhNpcRegistryEntry,
  LhNpcRegistryV1,
  LhRealmLoreDialogueLine,
} from './domain/lh-dialogue';
export type { EncounterLaunchPayload } from './components/EncounterOverlay';
export type { LhNpcDialogueOverlayModel } from './dialogue/npcDialogueOverlayModel';
export type { ComparisonLedgerEntry, ExplorationLoopState } from './exploration/explorationTypes';
export type { RealmProgressMap } from './realm/realmProgress';

/** @deprecated Prefer QuestDefinition — alias retained for gradual migration. */
export type { QuestDefinition as QuestRow } from './domain/lh-contract';

/** @deprecated Prefer MediaAssetRecord — alias retained for gradual migration. */
export type { MediaAssetRecord as MediaAssetRow } from './domain/lh-contract';
