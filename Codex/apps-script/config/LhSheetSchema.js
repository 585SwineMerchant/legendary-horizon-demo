/**
 * Canonical tab + header names for the Day 2 plumbing pass + Milestone 3 service layer.
 * Copy these values from your live spreadsheet — never hardcode mystery columns in multiple files.
 *
 * @see ../../../contracts/README.md
 */

var LH_SCHEMA = {
  PLAYER_SAVE_TAB: 'LhPlayerSave',
  ROSTER_TAB: 'LhRoster',
  MEDIA_ASSET_TAB: 'LhMediaAssets',
  /** Optional — quest definitions mirrored from Quest List workbook. */
  QUEST_DEFINITION_TAB: 'LhQuestDefinitions',
  /** Optional — realm registry rows. */
  REALM_DEFINITION_TAB: 'LhRealmDefinitions',
  /** Optional — item catalog for LookupService + teacher restore. */
  ITEM_DEFINITION_TAB: 'LhItemDefinitions',
  /** Session-end / class block history (append-only). */
  SESSION_HISTORY_TAB: 'LhSessionHistory',
};

/**
 * Header row contract for `PLAYER_SAVE_TAB`.
 * Order is not important because IO helpers index by header text, not column position.
 */
var LH_PLAYER_SAVE_HEADERS = {
  player_id: 'player_id',
  display_name: 'display_name',
  roster_email_hint: 'roster_email_hint',
  email_hash: 'email_hash',
  current_act: 'current_act',
  current_realm_id: 'current_realm_id',
  required_next_action: 'required_next_action',
  active_main_quest_id: 'active_main_quest_id',
  active_main_quest_title: 'active_main_quest_title',
  last_completed_event_id: 'last_completed_event_id',
  last_completed_summary: 'last_completed_summary',
  xp_total: 'xp_total',
  level_cached: 'level_cached',
  inventory_summary_json: 'inventory_summary_json',
  revision_token: 'revision_token',
  last_manual_save_iso: 'last_manual_save_iso',
  quests_snapshot_json: 'quests_snapshot_json',
  backup_checkpoint_json: 'backup_checkpoint_json',
  auto_save_last_iso: 'auto_save_last_iso',
  exit_ticket_state: 'exit_ticket_state',
  /** M8 — JSON blobs mirroring `ManualSaveEnvelopeV1` optional slices. */
  exploration_loop_json: 'exploration_loop_json',
  realm_progress_json: 'realm_progress_json',
  session_summary_json: 'session_summary_json',
  ritual_drafts_json: 'ritual_drafts_json',
  /** M8 — `{ visited_trigger_object_ids: string[] }` from manual-save envelope. */
  progression_flags_json: 'progression_flags_json',
  /** Act I — Traveler's Survey RIASEC scores (0–20 each). */
  riasec_r: 'riasec_r',
  riasec_i: 'riasec_i',
  riasec_a: 'riasec_a',
  riasec_s: 'riasec_s',
  riasec_e: 'riasec_e',
  riasec_c: 'riasec_c',
  /** Act I — Foretold Signpost guild realm_ids (up to three). */
  foretold_signpost_1_guild_id: 'foretold_signpost_1_guild_id',
  foretold_signpost_2_guild_id: 'foretold_signpost_2_guild_id',
  foretold_signpost_3_guild_id: 'foretold_signpost_3_guild_id',
  /** ISO timestamp when the Scroll of Destiny was first generated (Manifest sealed). */
  scroll_generated_at: 'scroll_generated_at',
  /** Resolve / HP system. */
  resolve_current: 'resolve_current',
  resolve_max: 'resolve_max',
  resolve_shaken: 'resolve_shaken',
  last_safe_camp_position_json: 'last_safe_camp_position_json',
  /** Campfire streak + prompt rotation. */
  campfire_streak: 'campfire_streak',
  last_campfire_iso: 'last_campfire_iso',
  used_campfire_prompt_ids_json: 'used_campfire_prompt_ids_json',
  /** Campfire grading / Rested Readiness. */
  last_campfire_score: 'last_campfire_score',
  rested_readiness_tier: 'rested_readiness_tier',
  rested_readiness_multiplier: 'rested_readiness_multiplier',
  rested_readiness_wake_index: 'rested_readiness_wake_index',
  /** Item system. */
  satchel_inventory_json: 'satchel_inventory_json',
  /** Cosmetics / titles. */
  active_title: 'active_title',
  /** Teacher-visibility columns — written by the save pipeline, never by player-side game logic. */
  classroom_email: 'classroom_email',
  unlocked_assignments_json: 'unlocked_assignments_json',
  completed_assignments_json: 'completed_assignments_json',
  /** Set when the student selects their True Path (mq-401 completes). Blank until then. */
  true_path_selected: 'true_path_selected',
  /** Teacher override: forces the frontend to treat this act as the current target. Blank = no override. Never overwritten by player saves. */
  narrative_force_target_act: 'narrative_force_target_act',
  /** Teacher override: forces a specific realm_id as the narrative target. Blank = no override. Never overwritten by player saves. */
  narrative_force_target_realm: 'narrative_force_target_realm',
};

var LH_ROSTER_HEADERS = {
  student_email: 'student_email',
  student_id: 'student_id',
  player_display_name: 'player_display_name',
  teacher_email: 'teacher_email',
  course: 'course',
  class_section: 'class_section',
  section_code: 'section_code',
  player_id: 'player_id',
};

/** Quest definition export columns (optional tab). */
var LH_QUEST_DEF_HEADERS = {
  quest_id: 'quest_id',
  title: 'title',
  tier: 'tier',
  act: 'act',
  status: 'status',
  objective_short: 'objective_short',
  realm_ids_json: 'realm_ids_json',
};

var LH_REALM_DEF_HEADERS = {
  realm_id: 'realm_id',
  display_name: 'display_name',
};

var LH_ITEM_DEF_HEADERS = {
  item_id: 'item_id',
  label: 'label',
};

/** Media tab — core columns plus optional filters for AssetService.getRealmAssets / getNpcAssets. */
var LH_MEDIA_HEADERS = {
  asset_id: 'asset_id',
  /** image, portrait, map_thumb, banner, ui, audio, … — use `guild_hq` for guild hall hero plates (Codex `resolveGuildHqHeroAsset`). */
  kind: 'kind',
  description: 'description',
  drive_file_id: 'drive_file_id',
  delivery_url_placeholder: 'delivery_url_placeholder',
  realm_tags_csv: 'realm_tags_csv',
  npc_id: 'npc_id',
  /** Optional SPA / catalog chain when a Drive URL is blank or asset is retired (Milestone 14). */
  fallback_asset_id: 'fallback_asset_id',
};

var LH_SESSION_HISTORY_HEADERS = {
  session_id: 'session_id',
  player_id: 'player_id',
  began_iso: 'began_iso',
  ended_iso: 'ended_iso',
  summary_json: 'summary_json',
  device_hint: 'device_hint',
  campfire_log_entry: 'campfire_log_entry',
  /** Campfire grading columns — filled by teacher via grade_campfire action. */
  campfire_score: 'campfire_score',
  campfire_comment: 'campfire_comment',
  campfire_graded_at: 'campfire_graded_at',
  campfire_graded_by: 'campfire_graded_by',
  /** Display name snapshot for teacher grading queue. */
  player_display_name: 'player_display_name',
  /** Teacher audit columns — per-session reporting data for teacher dashboard. */
  student_id: 'student_id',
  section_code: 'section_code',
  session_number: 'session_number',
  start_realm: 'start_realm',
  end_realm: 'end_realm',
  quests_completed_json: 'quests_completed_json',
  campfire_log_entry_json: 'campfire_log_entry_json',
  xp_gained: 'xp_gained',
  manual_save_completed: 'manual_save_completed',
  exit_ticket_sent: 'exit_ticket_sent',
  draft_response_saved: 'draft_response_saved',
};
