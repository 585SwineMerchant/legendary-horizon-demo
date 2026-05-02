/**
 * Canonical tab + header names for the Day 2 plumbing pass.
 * Copy these values from your live spreadsheet — never hardcode mystery columns in multiple files.
 *
 * @see ../../../contracts/README.md
 */

var LH_SCHEMA = {
  /** Default tab housing `PlayerSave` rows. */
  PLAYER_SAVE_TAB: 'LhPlayerSave',
  /** Educator roster tab for identity resolution. */
  ROSTER_TAB: 'LhRoster',
  /** Media asset lookup tab (mirrors Media Asset Lookup workbook). */
  MEDIA_ASSET_TAB: 'LhMediaAssets',
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
};

/**
 * Roster headers for `ROSTER_TAB`.
 */
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
