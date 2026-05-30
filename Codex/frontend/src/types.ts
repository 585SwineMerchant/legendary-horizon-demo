export type Screen =
  | 'title'
  | 'intro'
  | 'gameTitle'
  | 'instructions'
  | 'maiaProfile'
  | 'scrollReveal'
  | 'resume'
  | 'explore'
  | 'demoClosing'
  | 'campfireSave';

export type NightOneNavigate = {
  beginDemo: () => Promise<void>;
  quitToTitle: () => void;
  /** Fresh start: plays intro cinematic, then applies canonical demo slice and opens explore. */
  gameTitleStart: () => void;
  /** After intro ends: canonical fresh demo + traveler exploration spawn. */
  introCompleteToExplore: () => Promise<void>;
  /** Reloads the spreadsheet-backed session then returns to explore (no intro). */
  gameTitleResume: () => Promise<void>;
  proceedInstructions: () => void;
  maiaProfileToResume: () => void;
  scrollRevealToResume: () => void;
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
  openSatchel: () => void;
  closeSatchel: () => void;
  dismissRestedReadiness: () => void;
  openDemoClosing: () => void;
  openCampfireSave: () => void;
  openModule: (moduleId: string) => void;
  closeModule: () => void;
};

export type {
  AcademicTaskKind,
  AcademicTaskProgress,
  AcademicTaskStatus,
  AcademicWorksheetFieldDef,
  AcademicWorksheetTaskDef,
  CampfireReflectionRow,
  CampfireGradeSubmission,
  CosmeticsV1,
  EncounterLogEntryV1,
  FieldKitToolV1,
  GuildEndgameInterviewOutcomeV1,
  GuildEndgameV1,
  InventoryLineItem,
  InventorySummary,
  MementoEntryV1,
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
  RestedReadinessTier,
  RitualDraftsV1,
  RosterStudentRecord,
  SatchelConsumableV1,
  SatchelInventoryV1,
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
