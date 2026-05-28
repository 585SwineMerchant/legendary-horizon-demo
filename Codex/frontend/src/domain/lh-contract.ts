/**
 * Canonical LH runtime structs shared conceptually with Google Sheets rows.
 * @see ../../../contracts/README.md
 */

import type { LhDialogueCatalogV1, LhNpcRegistryV1 } from './lh-dialogue';

export type InventoryLineItem = {
  item_id: string;
  qty: number;
  label?: string;
};

export type InventorySummary = {
  coins: number;
  items: InventoryLineItem[];
  notes_for_teacher_preview?: string;
};

/** Player save envelope — mirrors workbook “Player Save” semantics. */
export type PlayerSave = {
  player_id: string;
  display_name: string;
  /** Optional plaintext email for QA / dev fixtures only. */
  roster_email_hint?: string;
  email_hash?: string;
  current_act: number;
  /** Active guild / HQ / narrative realm anchor — not which explorable tilemap file is loaded (primary world map is separate). */
  current_realm_id: string;
  required_next_action: string;
  active_main_quest_id: string;
  active_main_quest_title: string;
  last_completed_event_id: string;
  last_completed_summary: string;
  xp_total: number;
  level_cached: number;
  inventory_summary: InventorySummary;
  revision_token?: string;
  last_manual_save_iso?: string;
  /** Prior-row checkpoint JSON (`LhBackupCheckpointV1`) for facilitator restore / rollback. */
  backup_checkpoint_json?: string;
  /** Exit-ticket workflow flag mirrored on the sheet (`none`, `draft_ready`, `sent`, …). */
  exit_ticket_state?: string;
};

/** Quest definition row baseline (matches quest workbook MVP columns + M10 engine fields). */
export type QuestDefinition = {
  quest_id: string;
  title: string;
  tier: 'main' | 'side' | 'guild';
  act: number;
  status: 'active' | 'available' | 'locked' | 'completed' | 'turned_in';
  objective_short: string;
  realm_ids: string[];
  /** When all listed quests reach a terminal state (`completed` / `turned_in`), a `locked` row becomes `available`. */
  prerequisite_quest_ids?: string[];
};

export type MediaAssetRecord = {
  asset_id: string;
  /** Examples: `image`, `portrait`, `map_thumb`, `guild_hq` (guild hall hero), `banner`, `audio`. */
  kind: string;
  description: string;
  drive_file_id: string;
  delivery_url_placeholder: string;
  /** Optional bind for `LhAsset_getRealmAssets` / SPA realm-scoped bundles. */
  realm_ids?: string[];
  /** Optional bind for `LhAsset_getNpcAssets` / portrait lookup (Sheets `npc_id`). */
  npc_id?: string;
  /** When the primary URL fails or is blank, try this catalog id next (Milestone 14). */
  fallback_asset_id?: string;
};

export type RealmDefinition = {
  realm_id: string;
  career_cluster: string;
  guild_headquarters: string;
  display_name: string;
  slug: string;
  lore_digest: string;
  /** Optional short lede shown above lore in atlas; falls back to lore_digest when absent. */
  intro_text?: string;
  /** Optional future per-realm Tiled slice; null is normal — primary gameplay uses the shared world map export. */
  map_tiled_export: string | null;
  tags: string[];
  /** Stable display order in realm atlas (GDD canon order). */
  sort_order?: number;
};

/** Per-realm exploration flags (session slice; persisted on save — M8). */
export type RealmExplorationProgressEntry = {
  entered: boolean;
  last_entered_iso?: string;
  /** Guild HQ research step (Milestone 7). */
  research_complete?: boolean;
  /** Player-facing "what I learned" notes saved per realm (Act III map + fog menu). */
  learned_notes?: string;
};

/**
 * Comparison ledger row — persisted in `exploration_loop.ledger_entries`.
 * v1: career_a / career_b / note only. v2 adds optional career-comparison columns (O*NET / spreadsheet shaped).
 */
export type ComparisonLedgerEntry = {
  id: string;
  realm_id: string;
  /** Occupation or career title — column A. */
  career_a: string;
  /** Occupation or career title — column B. */
  career_b: string;
  /** Cross-cutting synthesis (contrast, fit, evidence). */
  note: string;
  created_iso: string;
  /** Typical entry: high school, associate, bachelor’s, graduate study, etc. */
  education_a?: string;
  education_b?: string;
  /** Median or range as written by the player (e.g. BLS / O*NET figures). */
  salary_a?: string;
  salary_b?: string;
  /** Career cluster or Holland / RIASEC shorthand for each path. */
  career_cluster_a?: string;
  career_cluster_b?: string;
  /** Postsecondary or training pathway notes per occupation. */
  pathway_a?: string;
  pathway_b?: string;
};

/** Milestone 11 — worksheet archetypes (GDD research / class artifacts). */
export type AcademicTaskKind =
  | 'quest_of_fate'
  | 'comparison_ledger'
  | 'quest_of_choice'
  | 'manifest'
  | 'great_transcription'
  | 'chronicle';

/** Worksheet lifecycle for facilitator review loops. */
export type AcademicTaskStatus = 'locked' | 'available' | 'in_progress' | 'submitted' | 'reviewed';

/** One row of persisted academic progress (stored under `exploration_loop.academic_tasks`). */
export type AcademicTaskProgress = {
  task_id: string;
  kind: AcademicTaskKind;
  status: AcademicTaskStatus;
  payload: Record<string, string>;
  updated_iso: string;
};

/** Static catalog row — shipped in `data/samples/academic_worksheet_tasks.json`. */
export type AcademicWorksheetFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  /** `choice` renders radios; default is single-line text. */
  input?: 'text' | 'choice';
  options?: { value: string; label: string }[];
};

export type AcademicWorksheetTaskDef = {
  task_id: string;
  kind: AcademicTaskKind;
  title: string;
  intro: string;
  fields: AcademicWorksheetFieldDef[];
  /** All listed tasks must be `submitted` or `reviewed` before this unlocks from `locked` → `available`. */
  unlock_after_task_ids?: string[];
};

/** Outcome of the latest sealed guild interview attempt (GT-102 lane). */
export type GuildEndgameInterviewOutcomeV1 = 'none' | 'passed' | 'failed';

/**
 * Guild endgame progression (application → breather → interview).
 * Persisted under `exploration_loop.guild_endgame_v1` with manual/auto save.
 */
export type GuildEndgameV1 = {
  /** FSM label — e.g. `unstarted`, `breather`, `interview_invited`, `interview_failed_pending_retry`, `guild_accepted_v1`. */
  phase: string;
  /** Player’s committed true-path guild `realm_id`, when set. */
  true_path_realm_id: string | null;
  /** In-person Guild Manager encounter at true-path HQ completed; GT-101 may open (when also at HQ). */
  application_unlocked: boolean;
  /** GT-101 application sealed (one-way; score does not force redo). */
  application_sealed: boolean;
  /** Manager has invited the player to the timed interview (GT-102 unlock gate). */
  interview_invited: boolean;
  /** ISO deadline for arriving at HQ for the interview; null until invited. */
  interview_deadline_iso: string | null;
  last_interview_outcome: GuildEndgameInterviewOutcomeV1;
};

/** Milestone 17 — append-only encounter audit trail (persisted under `exploration_loop`). */
export type EncounterLogEntryV1 = {
  id: string;
  kind: 'combat_encounter' | 'vocab_battle';
  outcome: 'win' | 'retreat';
  xp_awarded: number;
  at_iso: string;
  interactable_id: string;
  target_quest_id?: string;
};

/** Act III exploration slice persisted with manual / auto save (Milestone 8). */
export type ExplorationLoopState = {
  fog_keys_cleared: string[];
  waypoint_keys_visited: string[];
  ledger_entries: ComparisonLedgerEntry[];
  /** Vertical slice guide state: Master Scribe objectives, stamina reward, and debug trace. */
  demo_guidance_v1?: {
    stage_id: string;
    current_objective: string;
    last_npc_interaction_id?: string;
    stamina_upgrade_applied?: boolean;
    max_stamina_ms?: number;
  };
  /** Milestone 11 — keyed by `task_id`. */
  academic_tasks?: Record<string, AcademicTaskProgress>;
  /** Integrated modules: per-module draft fields (safe, compact, JSON-only). */
  module_drafts?: Record<string, Record<string, string>>;
  /** Milestone 17 — XP from encounters this session (resets when exploration loop is reset on new session bootstrap). */
  session_encounter_xp_awarded?: number;
  encounter_log?: EncounterLogEntryV1[];
  /** Guild application / interview sequence (v1). */
  guild_endgame_v1?: GuildEndgameV1;
  /**
   * Guild HQ `realm_id`s discovered in-world (manager desk, porter summons, etc.).
   * Drives Realm Atlas fog — not quest unlocks or travel.
   */
  guild_hq_atlas_revealed_realm_ids?: string[];
  /**
   * Scroll of Destiny — up to three canon `realm_id`s inscribed when the Manifest is sealed (Foretold Signposts).
   * Anchors Act II/III comparison and exploration guidance; empty until Act I manifest completion.
   */
  foretold_signpost_realm_ids?: string[];
};

/**
 * Prior manual-save snapshot written to `backup_checkpoint_json` (Sheets + `LhSave_restoreBackupCheckpoint`).
 * @see Codex/apps-script/services/SaveService.js
 */
export type LhBackupCheckpointV1 = {
  schema_version: 1;
  captured_at_iso?: string;
  player_snapshot: PlayerSave;
  quests_snapshot: QuestDefinition[];
  exploration_loop?: ExplorationLoopState | null;
  realm_progress?: Record<string, RealmExplorationProgressEntry> | null;
  progression_flags?: { visited_trigger_object_ids: string[] } | null;
};

/** Snapshot for session-end ritual + audit (Milestones 8–9). */
export type SessionSummaryV1 = {
  player_id: string;
  active_main_quest_id: string;
  current_realm_id: string;
  xp_total: number;
  quest_open_count: number;
  ledger_entry_count: number;
  captured_at_iso: string;
};

/** Half-written ritual fields flushed on save (Milestone 8). */
export type RitualDraftsV1 = {
  ledger_career_a?: string;
  ledger_career_b?: string;
  ledger_note?: string;
  ledger_education_a?: string;
  ledger_education_b?: string;
  ledger_salary_a?: string;
  ledger_salary_b?: string;
  ledger_cluster_a?: string;
  ledger_cluster_b?: string;
  ledger_pathway_a?: string;
  ledger_pathway_b?: string;
  exit_ticket_body?: string;
};

export type RosterStudentRecord = {
  roster_id?: string;
  student_email: string;
  student_id: string;
  player_display_name: string;
  teacher_email: string;
  course: string;
  class_section: string;
  section_code: string;
};

/** SPA bundle seeded from Codex fixtures (Day 2 centralized loader shape). */
export type LhRuntimeFixture = {
  player: PlayerSave;
  quests: QuestDefinition[];
  /** Active guild / HQ row (matches `player.current_realm_id` when possible); not the selector for the primary tilemap. */
  realm: RealmDefinition;
  /** Full canon registry — Milestone 6. */
  realms: RealmDefinition[];
  roster_student: RosterStudentRecord;
  media_assets: MediaAssetRecord[];
  /** Milestone 11 — worksheet definitions for research overlays. */
  academic_worksheet_tasks: AcademicWorksheetTaskDef[];
  /** Milestone 16 — NPC metadata for dialogue + portraits. */
  npc_registry: LhNpcRegistryV1;
  /** Milestone 16 — conditional line banks + realm lore hooks. */
  dialogue_catalog: LhDialogueCatalogV1;
  /** Primary explorable world map export path (fixture). */
  tiled_demo_map_relative_path: string;
  /** Hydrated Codex-local Tiled export for the primary world map; omit when pulling remote-only payloads. */
  tiled_map_payload?: unknown;
};

export type ManualSaveEnvelopeV1 = {
  schema_version: 1;
  saved_at_iso: string;
  player_snapshot: PlayerSave;
  quests_snapshot: QuestDefinition[];
  realm_id: string;
  progression_flags: {
    visited_trigger_object_ids: string[];
  };
  /** M8 — exploration loop (fog, waypoints, ledger). */
  exploration_loop?: ExplorationLoopState;
  /** M8 — realm atlas progress map keyed by `realm_id`. */
  realm_progress?: Record<string, RealmExplorationProgressEntry>;
  /** M8/M9 — session summary (ritual / audit). */
  session_summary?: SessionSummaryV1;
  /** M8 — half-written ritual fields. */
  ritual_drafts?: RitualDraftsV1;
  /** M8 — `manual` | `auto` for server logging. */
  save_kind?: 'manual' | 'auto';
};

/**
 * Phase 2+ (Integrated plan v3): module adaptation contracts.
 * These are intentionally additive and not yet wired into the save envelope in this repo.
 */
export type ModuleDefinition = {
  module_id: string;
  title: string;
  /** Canon realm anchor for UX + reporting. */
  realm_id: string;
  /** Primary quest this module advances (can be mirrored as unlock logic elsewhere). */
  quest_id: string;
  /** Grouping lane for narrative sequencing (Act I–V). */
  act: number;
  /** Optional routing key once the shell hosts modules as screens. */
  route_key?: string;
};

export type ModuleProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type ModuleProgressState = {
  module_id: string;
  status: ModuleProgressStatus;
  started_at_iso?: string;
  updated_at_iso?: string;
  /** Module-specific draft fields persisted for resume; keep small and JSON-safe. */
  partial?: Record<string, unknown>;
  /** Optional opaque context for resuming a multi-step interaction. */
  resume_context?: Record<string, unknown>;
};

export type UnlockEvent = {
  kind: 'unlock_module' | 'unlock_quest' | 'award_item' | 'award_xp';
  target_id: string;
  qty?: number;
};

export type InterviewTranscriptRef = {
  transcript_id: string;
  storage: 'local' | 'apps_script' | 'drive';
  created_iso: string;
};

export type ApplicationSubmissionRef = {
  submission_id: string;
  storage: 'local' | 'apps_script' | 'drive';
  created_iso: string;
};

export type ModuleResultPayload = {
  module_id: string;
  quest_id: string;
  realm_id: string;
  npc_id?: string;
  status: 'passed' | 'failed' | 'submitted' | 'completed';
  score?: number;
  soft_skill_score?: number;
  /** GT-102: return-to-HQ deadline vs wall-clock when the module was entered (professionalism lane). */
  interview_punctuality?: 'on_time' | 'late';
  artifacts?: {
    transcript?: InterviewTranscriptRef;
    application?: ApplicationSubmissionRef;
    /** Act I — Scroll of Destiny: three canon `realm_id`s chosen when sealing the Manifest (Foretold Signposts). */
    foretold_signpost_realm_ids?: string[];
    /** Open-ended artifact bag — modules may store arbitrary string / primitive values. */
    [key: string]: unknown;
  };
  unlocks?: UnlockEvent[];
  completed_at_iso: string;
};
