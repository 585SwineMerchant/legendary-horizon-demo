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

/** Quest definition row baseline (matches quest workbook MVP columns). */
export type QuestDefinition = {
  quest_id: string;
  title: string;
  tier: 'main' | 'side';
  act: number;
  status: 'active' | 'available' | 'locked' | 'completed';
  objective_short: string;
  realm_ids: string[];
};

export type MediaAssetRecord = {
  asset_id: string;
  kind: string;
  description: string;
  drive_file_id: string;
  delivery_url_placeholder: string;
};

export type RealmDefinition = {
  realm_id: string;
  career_cluster: string;
  guild_headquarters: string;
  display_name: string;
  slug: string;
  lore_digest: string;
  /** Populated once Tiled map ID is authoritative; nullable for Day 2 demo. */
  map_tiled_export: string | null;
  tags: string[];
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
  realm: RealmDefinition;
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
};
