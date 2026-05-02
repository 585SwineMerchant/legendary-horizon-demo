/**
 * Canonical LH runtime structs shared conceptually with Google Sheets rows.
 * @see ../../../contracts/README.md
 */

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
  kind: string;
  description: string;
  drive_file_id: string;
  delivery_url_placeholder: string;
  /** Optional bind for `LhAsset_getRealmAssets` / SPA realm-scoped bundles. */
  realm_ids?: string[];
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
  /** Populated once Tiled map ID is authoritative; nullable for Day 2 demo. */
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
};

/** Comparison ledger row (Milestone 7+) — persisted in `exploration_loop.ledger_entries`. */
export type ComparisonLedgerEntry = {
  id: string;
  realm_id: string;
  career_a: string;
  career_b: string;
  note: string;
  created_iso: string;
};

/** Act III exploration slice persisted with manual / auto save (Milestone 8). */
export type ExplorationLoopState = {
  fog_keys_cleared: string[];
  waypoint_keys_visited: string[];
  ledger_entries: ComparisonLedgerEntry[];
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
  /** Active realm row (matches `player.current_realm_id` when possible). */
  realm: RealmDefinition;
  /** Full canon registry — Milestone 6. */
  realms: RealmDefinition[];
  roster_student: RosterStudentRecord;
  media_assets: MediaAssetRecord[];
  tiled_demo_map_relative_path: string;
  /** Hydrated Codex-local Tiled export; omit when pulling remote-only payloads. */
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
