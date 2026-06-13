/**
 * GENERATED FILE - DO NOT EDIT MANUALLY.
 * Created by: node Codex/scripts/build-apps-script-bundle.mjs
 *
 * Source file order:
 * 1. Codex/apps-script/config/LhSheetSchema.js
 * 2. Codex/apps-script/utils/LhSheetIO.js
 * 3. Codex/apps-script/services/SaveService.js
 * 4. Codex/apps-script/services/RosterService.js
 * 5. Codex/apps-script/services/QuestService.js
 * 6. Codex/apps-script/services/SessionService.js
 * 7. Codex/apps-script/services/AssetService.js
 * 8. Codex/apps-script/services/ExitTicketService.js
 * 9. Codex/apps-script/services/LookupService.js
 * 10. Codex/apps-script/services/TeacherOverrideService.js
 * 11. Codex/apps-script/services/InterviewService.js
 * 12. Codex/apps-script/utils/Config.js
 * 13. Codex/apps-script/LhWebApp.js
 */

// ---- BEGIN Codex/apps-script/config/LhSheetSchema.js ----
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
  /**
   * Quest of Fate career worksheet submissions (append-only).
   * Teacher must create this tab in the spreadsheet with the header row:
   * submitted_iso | player_id | quest_id | module_id | prophecy_id | prophecy_title |
   * career_name | career_summary | responsibilities | work_environment |
   * median_salary | min_education | credentials | pros | cons | personal_fit
   */
  QUEST_OF_FATE_TAB: 'LhQuestOfFate',
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
// ---- END Codex/apps-script/config/LhSheetSchema.js ----

// ---- BEGIN Codex/apps-script/utils/LhSheetIO.js ----
/**
 * Generic sheet helpers — stay tiny & defensive for classroom reliability.
 */

function lhSheetGetOrThrow_(spreadsheetId, tabName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    throw new Error('Missing tab "' + tabName + '" in spreadsheet ' + spreadsheetId);
  }
  return sheet;
}

/**
 * @returns {GoogleAppsScript.Spreadsheet.Sheet | null}
 */
function lhSheetTryGet_(spreadsheetId, tabName) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheetByName(tabName) || null;
  } catch (err) {
    Logger.log('lhSheetTryGet_ ' + tabName + ': ' + err);
    return null;
  }
}

function lhSheetReadHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    throw new Error('Sheet has no header row');
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  headers.forEach(function (cell, idx) {
    var key = String(cell).trim();
    if (key) {
      map[key] = idx;
    }
  });
  return map;
}

function lhSheetReadTable_(sheet) {
  var range = sheet.getDataRange();
  return range.getValues();
}

function lhSheetFindRowIndex_(rows, columnIndex, needle) {
  var target = String(needle);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][columnIndex]) === target) {
      return i;
    }
  }
  return -1;
}
// ---- END Codex/apps-script/utils/LhSheetIO.js ----

// ---- BEGIN Codex/apps-script/services/SaveService.js ----
/**
 * SaveService — Milestone 3 persistence surface for player saves.
 * Pairs with `ManualSaveEnvelopeV1` from the SPA (`frontend/src/services/manualSaveGateway.ts`).
 */

/**
 * Validates a manual-save envelope before Sheets write.
 * @param {object} envelope
 * @returns {{ ok: boolean, errors?: string[] }}
 */
function LhSave_validateSavePayload(envelope) {
  var errors = [];
  if (!envelope || typeof envelope !== 'object') {
    return { ok: false, errors: ['envelope_missing'] };
  }
  if (envelope.schema_version !== 1) {
    errors.push('unsupported_schema_version');
  }
  if (!envelope.player_snapshot || typeof envelope.player_snapshot !== 'object') {
    errors.push('player_snapshot_required');
  } else {
    errors = errors.concat(LhSave_validatePlayerSnapshot_(envelope.player_snapshot));
  }
  if (!Array.isArray(envelope.quests_snapshot)) {
    errors.push('quests_snapshot_must_be_array');
  }
  if (typeof envelope.saved_at_iso !== 'string' || !envelope.saved_at_iso) {
    errors.push('saved_at_iso_required');
  }
  if (typeof envelope.realm_id !== 'string' || !envelope.realm_id) {
    errors.push('realm_id_required');
  }
  if (!envelope.progression_flags || typeof envelope.progression_flags !== 'object') {
    errors.push('progression_flags_required');
  } else if (!Array.isArray(envelope.progression_flags.visited_trigger_object_ids)) {
    errors.push('visited_trigger_object_ids_must_be_array');
  }
  if (envelope.exploration_loop !== undefined && envelope.exploration_loop !== null) {
    var ex = envelope.exploration_loop;
    if (typeof ex !== 'object') {
      errors.push('exploration_loop_must_be_object');
    } else {
      if (!Array.isArray(ex.fog_keys_cleared)) errors.push('exploration_fog_keys_must_be_array');
      if (!Array.isArray(ex.waypoint_keys_visited)) errors.push('exploration_waypoints_must_be_array');
      if (!Array.isArray(ex.ledger_entries)) errors.push('exploration_ledger_must_be_array');
      if (ex.academic_tasks !== undefined && ex.academic_tasks !== null && typeof ex.academic_tasks !== 'object') {
        errors.push('academic_tasks_must_be_object');
      }
    }
  }
  if (envelope.realm_progress !== undefined && envelope.realm_progress !== null) {
    if (typeof envelope.realm_progress !== 'object' || Array.isArray(envelope.realm_progress)) {
      errors.push('realm_progress_must_be_object');
    }
  }
  if (envelope.session_summary !== undefined && envelope.session_summary !== null) {
    if (typeof envelope.session_summary !== 'object') errors.push('session_summary_must_be_object');
  }
  if (envelope.ritual_drafts !== undefined && envelope.ritual_drafts !== null) {
    if (typeof envelope.ritual_drafts !== 'object') errors.push('ritual_drafts_must_be_object');
  }
  return errors.length ? { ok: false, errors: errors } : { ok: true };
}

/**
 * @param {object} ps
 * @returns {string[]}
 */
function LhSave_validatePlayerSnapshot_(ps) {
  var errors = [];
  function reqStr(k, label) {
    if (typeof ps[k] !== 'string' || !String(ps[k]).trim()) {
      errors.push(label + '_required');
    }
  }
  reqStr('player_id', 'player_id');
  reqStr('display_name', 'display_name');
  reqStr('active_main_quest_id', 'active_main_quest_id');
  reqStr('current_realm_id', 'current_realm_id');
  reqStr('required_next_action', 'required_next_action');
  if (!Number.isFinite(Number(ps.current_act))) {
    errors.push('current_act_invalid');
  }
  if (!Number.isFinite(Number(ps.xp_total)) || Number(ps.xp_total) < 0) {
    errors.push('xp_total_invalid');
  }
  if (!Number.isFinite(Number(ps.level_cached)) || Number(ps.level_cached) < 1) {
    errors.push('level_cached_invalid');
  }
  var inv = ps.inventory_summary;
  if (!inv || typeof inv !== 'object' || !Array.isArray(inv.items) || typeof inv.coins !== 'number') {
    errors.push('inventory_summary_shape');
  }
  return errors;
}

function lhSave_parseJson_(raw, fallback) {
  if (raw === null || raw === undefined || raw === '') {
    return fallback;
  }
  try {
    return JSON.parse(String(raw));
  } catch (e) {
    return fallback;
  }
}

/**
 * Normalized load for gameplay + services.
 * @returns {{ ok: boolean, player?: object, quests?: object[], raw_record?: object, error?: string }}
 */
function LhSave_loadPlayerState(spreadsheetId, tabNameOverride, playerId) {
  var read = LhSave_readPlayerSave(spreadsheetId, tabNameOverride, playerId);
  if (!read.ok) {
    return read;
  }
  var rec = read.record;
  var player = lhSave_recordToPlayer_(rec);
  var quests = lhSave_parseJson_(rec.quests_snapshot_json, []);
  if (!Array.isArray(quests)) {
    quests = [];
  }
  var explorationLoop = lhSave_parseJson_(rec.exploration_loop_json, null);
  var realmProgress = lhSave_parseJson_(rec.realm_progress_json, null);
  var progRaw = lhSave_parseJson_(rec.progression_flags_json, null);
  var progressionFlags =
    progRaw && typeof progRaw === 'object' && Array.isArray(progRaw.visited_trigger_object_ids)
      ? progRaw
      : { visited_trigger_object_ids: [] };
  return {
    ok: true,
    player: player,
    quests: quests,
    raw_record: rec,
    exploration_loop: explorationLoop && typeof explorationLoop === 'object' ? explorationLoop : null,
    realm_progress: realmProgress && typeof realmProgress === 'object' && !Array.isArray(realmProgress) ? realmProgress : null,
    progression_flags: progressionFlags,
  };
}

/**
 * @param {object} rec logical keys from LH_PLAYER_SAVE_HEADERS
 */
function lhSave_recordToPlayer_(rec) {
  var inv = lhSave_parseJson_(rec.inventory_summary_json, { coins: 0, items: [] });
  return {
    player_id: String(rec.player_id || ''),
    display_name: String(rec.display_name || ''),
    roster_email_hint: rec.roster_email_hint ? String(rec.roster_email_hint) : '',
    email_hash: rec.email_hash ? String(rec.email_hash) : '',
    current_act: Number(rec.current_act) || 1,
    current_realm_id: String(rec.current_realm_id || ''),
    required_next_action: String(rec.required_next_action || ''),
    active_main_quest_id: String(rec.active_main_quest_id || ''),
    active_main_quest_title: String(rec.active_main_quest_title || ''),
    last_completed_event_id: String(rec.last_completed_event_id || ''),
    last_completed_summary: String(rec.last_completed_summary || ''),
    xp_total: Number(rec.xp_total) || 0,
    level_cached: Number(rec.level_cached) || 1,
    inventory_summary: inv,
    revision_token: rec.revision_token ? String(rec.revision_token) : '',
    last_manual_save_iso: rec.last_manual_save_iso ? String(rec.last_manual_save_iso) : '',
    last_campfire_score: (rec.last_campfire_score !== undefined && rec.last_campfire_score !== '')
      ? Number(rec.last_campfire_score) : undefined,
    campfire_streak: (rec.campfire_streak !== undefined && rec.campfire_streak !== '')
      ? Number(rec.campfire_streak) : undefined,
  };
}

/**
 * Shallow-merge allowed autosave keys into the stored row.
 * @param {object} patch — subset of player fields (inventory_summary merged replace if provided)
 */
function LhSave_autoSaveProgress(spreadsheetId, tabNameOverride, playerId, patch) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabNameOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var merged = lhSave_mergePlayerPatch_(load.player, patch || {});
  var snapErr = LhSave_validatePlayerSnapshot_(merged);
  if (snapErr.length) {
    return { ok: false, errors: snapErr };
  }
  var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
  var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) {
    return { ok: false, error: 'player_not_found' };
  }
  var targetRow = rowIndex + 1;
  lhSave_writePlayerSnapshot_(sheet, headerMap, targetRow, merged, {
    questsJson: load.quests && load.quests.length ? JSON.stringify(load.quests) : null,
    autoIso: new Date().toISOString(),
  });
  SpreadsheetApp.flush();
  return { ok: true, player: merged };
}

/**
 * Validates, snapshots prior row into `backup_checkpoint_json` when column exists, then applies envelope.
 */
function LhSave_manualSaveProgress(spreadsheetId, tabNameOverride, envelope) {
  var v = LhSave_validateSavePayload(envelope);
  if (!v.ok) {
    return v;
  }
  var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
  var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  var pid = envelope.player_snapshot.player_id;
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, pid);
  if (rowIndex === -1) {
    return { ok: false, error: 'player_not_found' };
  }
  var targetRow = rowIndex + 1;
  var prior = LhSave_loadPlayerState(spreadsheetId, tabNameOverride, pid);
  if (prior.ok && envelope.save_kind !== 'auto') {
    var backup = {
      schema_version: 1,
      captured_at_iso: lhSave_isoForSheet_(new Date().toISOString()),
      player_snapshot: prior.player,
      quests_snapshot: prior.quests || [],
      exploration_loop: prior.exploration_loop || null,
      realm_progress: prior.realm_progress || null,
      progression_flags: prior.progression_flags || null,
    };
    lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.backup_checkpoint_json, JSON.stringify(backup));
  }
  var apply = LhSave_applyManualSaveEnvelope(spreadsheetId, tabNameOverride, envelope);
  if (!apply.ok) {
    return apply;
  }
  return { ok: true, row_written: apply.row_written, revision_token: apply.revision_token };
}

/**
 * Restores player row from `backup_checkpoint_json` (written by manual save or teacher rollback prep).
 */
function LhSave_restoreBackupCheckpoint(spreadsheetId, tabNameOverride, playerId) {
  var load = LhSave_readPlayerSave(spreadsheetId, tabNameOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var raw = load.record.backup_checkpoint_json;
  var cp = lhSave_parseJson_(raw, null);
  if (!cp || !cp.player_snapshot) {
    return { ok: false, error: 'no_backup_checkpoint' };
  }
  var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
  var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) {
    return { ok: false, error: 'player_not_found' };
  }
  var targetRow = rowIndex + 1;
  var ps = cp.player_snapshot;
  lhSave_writePlayerSnapshot_(sheet, headerMap, targetRow, ps, {
    questsJson: cp.quests_snapshot && cp.quests_snapshot.length ? JSON.stringify(cp.quests_snapshot) : null,
    lastManualIso: null,
    revisionToken: Utilities.getUuid(),
  });
  if (cp.exploration_loop || cp.realm_progress || cp.progression_flags) {
    lhSave_writeEnvelopeExtensionColumns_(sheet, headerMap, targetRow, {
      progression_flags: cp.progression_flags,
      exploration_loop: cp.exploration_loop,
      realm_progress: cp.realm_progress,
    });
  }
  SpreadsheetApp.flush();
  return { ok: true, restored_from: cp.captured_at_iso };
}

function lhSave_mergePlayerPatch_(base, patch) {
  var out = {};
  var k;
  for (k in base) {
    if (Object.prototype.hasOwnProperty.call(base, k)) {
      out[k] = base[k];
    }
  }
  var allowed = [
    'display_name',
    'current_act',
    'current_realm_id',
    'required_next_action',
    'active_main_quest_id',
    'active_main_quest_title',
    'last_completed_event_id',
    'last_completed_summary',
    'xp_total',
    'level_cached',
    'inventory_summary',
    'revision_token',
    'last_manual_save_iso',
    'roster_email_hint',
    'email_hash',
  ];
  for (var i = 0; i < allowed.length; i++) {
    var key = allowed[i];
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      out[key] = patch[key];
    }
  }
  return out;
}

function lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, headerKey, value) {
  var colIdx = headerMap[headerKey];
  if (colIdx === undefined) {
    return;
  }
  sheet.getRange(targetRow, colIdx + 1).setValue(value);
}

/**
 * Prefixes an ISO-8601 timestamp string with `'` so Google Sheets stores it
 * as plain text instead of converting it to a date/time value and applying
 * the spreadsheet's local timezone offset.
 * Returns the value unchanged if it is falsy or not a string.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
function lhSave_isoForSheet_(iso) {
  if (!iso || typeof iso !== 'string') return iso;
  return "'" + iso;
}

/**
 * @param {object} opts { questsJson?, lastManualIso?, revisionToken?, autoIso?, exitState? }
 */
function lhSave_writePlayerSnapshot_(sheet, headerMap, targetRow, ps, opts) {
  opts = opts || {};
  function w(headerKey, val) {
    lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, headerKey, val);
  }
  w(LH_PLAYER_SAVE_HEADERS.display_name, ps.display_name);
  w(LH_PLAYER_SAVE_HEADERS.roster_email_hint, ps.roster_email_hint || '');
  w(LH_PLAYER_SAVE_HEADERS.email_hash, ps.email_hash || '');
  w(LH_PLAYER_SAVE_HEADERS.current_act, ps.current_act);
  w(LH_PLAYER_SAVE_HEADERS.current_realm_id, ps.current_realm_id);
  w(LH_PLAYER_SAVE_HEADERS.required_next_action, ps.required_next_action);
  w(LH_PLAYER_SAVE_HEADERS.active_main_quest_id, ps.active_main_quest_id);
  w(LH_PLAYER_SAVE_HEADERS.active_main_quest_title, ps.active_main_quest_title);
  w(LH_PLAYER_SAVE_HEADERS.last_completed_event_id, ps.last_completed_event_id);
  w(LH_PLAYER_SAVE_HEADERS.last_completed_summary, ps.last_completed_summary);
  w(LH_PLAYER_SAVE_HEADERS.xp_total, ps.xp_total);
  w(LH_PLAYER_SAVE_HEADERS.level_cached, ps.level_cached);
  w(LH_PLAYER_SAVE_HEADERS.inventory_summary_json, JSON.stringify(ps.inventory_summary || {}));
  if (opts.revisionToken) {
    w(LH_PLAYER_SAVE_HEADERS.revision_token, opts.revisionToken);
  } else if (ps.revision_token) {
    w(LH_PLAYER_SAVE_HEADERS.revision_token, ps.revision_token);
  }
  if (opts.lastManualIso) {
    w(LH_PLAYER_SAVE_HEADERS.last_manual_save_iso, lhSave_isoForSheet_(opts.lastManualIso));
  } else if (ps.last_manual_save_iso) {
    w(LH_PLAYER_SAVE_HEADERS.last_manual_save_iso, lhSave_isoForSheet_(ps.last_manual_save_iso));
  }
  if (opts.questsJson) {
    w(LH_PLAYER_SAVE_HEADERS.quests_snapshot_json, opts.questsJson);
  }
  if (opts.autoIso) {
    w(LH_PLAYER_SAVE_HEADERS.auto_save_last_iso, lhSave_isoForSheet_(opts.autoIso));
  }
  if (opts.exitState !== undefined && opts.exitState !== null) {
    w(LH_PLAYER_SAVE_HEADERS.exit_ticket_state, opts.exitState);
  }
  // Campfire timestamp — written as plain text so Sheets does not convert to local datetime.
  if (ps.last_campfire_iso) {
    w(LH_PLAYER_SAVE_HEADERS.last_campfire_iso, lhSave_isoForSheet_(ps.last_campfire_iso));
  }
}

/**
 * Writes optional M8 envelope JSON columns when headers exist.
 * @param {object} envelope — may include exploration_loop, realm_progress, session_summary, ritual_drafts
 */
function lhSave_writeEnvelopeExtensionColumns_(sheet, headerMap, targetRow, envelope) {
  if (!envelope || typeof envelope !== 'object') {
    return;
  }
  if (envelope.progression_flags) {
    lhSave_writeFieldIfPresent_(
      sheet,
      headerMap,
      targetRow,
      LH_PLAYER_SAVE_HEADERS.progression_flags_json,
      JSON.stringify(envelope.progression_flags),
    );
  }
  if (envelope.exploration_loop) {
    lhSave_writeFieldIfPresent_(
      sheet,
      headerMap,
      targetRow,
      LH_PLAYER_SAVE_HEADERS.exploration_loop_json,
      JSON.stringify(envelope.exploration_loop),
    );
  }
  if (envelope.realm_progress) {
    lhSave_writeFieldIfPresent_(
      sheet,
      headerMap,
      targetRow,
      LH_PLAYER_SAVE_HEADERS.realm_progress_json,
      JSON.stringify(envelope.realm_progress),
    );
  }
  if (envelope.session_summary) {
    lhSave_writeFieldIfPresent_(
      sheet,
      headerMap,
      targetRow,
      LH_PLAYER_SAVE_HEADERS.session_summary_json,
      JSON.stringify(envelope.session_summary),
    );
  }
  if (envelope.ritual_drafts) {
    lhSave_writeFieldIfPresent_(
      sheet,
      headerMap,
      targetRow,
      LH_PLAYER_SAVE_HEADERS.ritual_drafts_json,
      JSON.stringify(envelope.ritual_drafts),
    );
  }
  // Act I — RIASEC scores and Foretold Signpost columns (standalone for easy Sheets querying).
  if (envelope.exploration_loop && typeof envelope.exploration_loop === 'object') {
    var ex = envelope.exploration_loop;
    // RIASEC scores from survey module draft
    var surveyDraft =
      ex.module_drafts &&
      typeof ex.module_drafts === 'object' &&
      ex.module_drafts.mod_master_scribe_survey;
    if (surveyDraft && typeof surveyDraft === 'object') {
      var rcodes = ['r', 'i', 'a', 's', 'e', 'c'];
      for (var ri = 0; ri < rcodes.length; ri++) {
        var rc = rcodes[ri];
        var rval = surveyDraft['riasec_' + rc];
        if (rval !== undefined && rval !== null && rval !== '') {
          lhSave_writeFieldIfPresent_(
            sheet,
            headerMap,
            targetRow,
            LH_PLAYER_SAVE_HEADERS['riasec_' + rc],
            Number(rval),
          );
        }
      }
    }
    // Foretold signpost guild IDs
    var signposts = ex.foretold_signpost_realm_ids;
    if (Array.isArray(signposts)) {
      var spKeys = ['foretold_signpost_1_guild_id', 'foretold_signpost_2_guild_id', 'foretold_signpost_3_guild_id'];
      for (var si = 0; si < spKeys.length; si++) {
        var spVal = signposts[si];
        if (typeof spVal === 'string' && spVal) {
          lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS[spKeys[si]], spVal);
        }
      }
      // Write scroll_generated_at on first appearance (don't overwrite if already set)
      if (signposts.length > 0) {
        lhSave_writeFieldIfPresent_(
          sheet,
          headerMap,
          targetRow,
          LH_PLAYER_SAVE_HEADERS.scroll_generated_at,
          lhSave_isoForSheet_(new Date().toISOString()),
        );
      }
    }
    // Teacher-visibility: True Path selection from guild_endgame_v1.
    var ge = ex.guild_endgame_v1;
    if (ge && typeof ge === 'object' && typeof ge.true_path_realm_id === 'string' && ge.true_path_realm_id) {
      lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.true_path_selected, ge.true_path_realm_id);
    }
    // Teacher-visibility: flatten academic_tasks into unlocked / completed arrays.
    var tasks = ex.academic_tasks;
    if (tasks && typeof tasks === 'object') {
      var unlocked = [];
      var completed = [];
      var taskKeys = Object.keys(tasks);
      for (var ti = 0; ti < taskKeys.length; ti++) {
        var t = tasks[taskKeys[ti]];
        if (t && typeof t === 'object') {
          var tid = t.task_id || taskKeys[ti];
          if (t.status !== 'locked') unlocked.push(tid);
          if (t.status === 'completed') completed.push(tid);
        }
      }
      lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.unlocked_assignments_json, JSON.stringify(unlocked));
      lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.completed_assignments_json, JSON.stringify(completed));
    }
  }
}

/**
 * Reads a player row keyed by `player_id`.
 */
function LhSave_readPlayerSave(spreadsheetId, tabNameOverride, playerId) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var colIndex = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    if (colIndex === undefined) {
      throw new Error('player_id column missing — align sheet to LhSheetSchema');
    }
    var rowIndex = lhSheetFindRowIndex_(rows, colIndex, playerId);
    if (rowIndex === -1) {
      return { ok: false, error: 'player_not_found' };
    }

    var record = {};
    Object.keys(LH_PLAYER_SAVE_HEADERS).forEach(function (logicalKey) {
      var header = LH_PLAYER_SAVE_HEADERS[logicalKey];
      var idx = headerMap[header];
      if (idx !== undefined) {
        record[logicalKey] = rows[rowIndex][idx];
      }
    });

    return { ok: true, row_index: rowIndex + 1, record: record };
  } catch (err) {
    Logger.log('LhSave_readPlayerSave failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Lists lightweight progress summaries for the teacher dashboard.
 * This avoids parsing JSON blobs and only reads headline columns when present.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {{ player_ids?: string[], limit?: number }} filters
 * @returns {{ ok: boolean, players?: object[], error?: string }}
 */
function LhSave_listPlayerSummaries(spreadsheetId, tabNameOverride, filters) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    if (!rows || rows.length < 2) {
      return { ok: true, players: [] };
    }

    var limit = filters && filters.limit ? Number(filters.limit) : 500;
    if (!limit || limit < 1) limit = 500;
    if (limit > 2000) limit = 2000;

    var want = null;
    if (filters && filters.player_ids && Array.isArray(filters.player_ids)) {
      want = {};
      for (var i = 0; i < filters.player_ids.length; i++) {
        var pid = String(filters.player_ids[i] || '').trim();
        if (pid) want[pid] = true;
      }
    }

    function idx(headerKey) {
      var h = LH_PLAYER_SAVE_HEADERS[headerKey];
      return headerMap[h];
    }

    var idxPid = idx('player_id');
    if (idxPid === undefined) {
      return { ok: false, error: 'player_id_column_missing' };
    }

    var idxDisplay = idx('display_name');
    var idxAct = idx('current_act');
    var idxRealm = idx('current_realm_id');
    var idxNext = idx('required_next_action');
    var idxQuest = idx('active_main_quest_id');
    var idxQuestTitle = idx('active_main_quest_title');
    var idxXp = idx('xp_total');
    var idxLevel = idx('level_cached');
    var idxLastManual = idx('last_manual_save_iso');
    var idxExit = idx('exit_ticket_state');
    var idxClassroom = idx('classroom_email');
    var idxTruePath = idx('true_path_selected');
    var idxCompleted = idx('completed_assignments_json');

    var out = [];
    for (var r = 1; r < rows.length; r++) {
      if (out.length >= limit) break;
      var row = rows[r] || [];
      var playerId = String(row[idxPid] || '').trim();
      if (!playerId) continue;
      if (want && !want[playerId]) continue;

      out.push({
        player_id: playerId,
        display_name: idxDisplay !== undefined ? String(row[idxDisplay] || '') : '',
        current_act: idxAct !== undefined ? Number(row[idxAct]) || 1 : 1,
        current_realm_id: idxRealm !== undefined ? String(row[idxRealm] || '') : '',
        required_next_action: idxNext !== undefined ? String(row[idxNext] || '') : '',
        active_main_quest_id: idxQuest !== undefined ? String(row[idxQuest] || '') : '',
        active_main_quest_title: idxQuestTitle !== undefined ? String(row[idxQuestTitle] || '') : '',
        xp_total: idxXp !== undefined ? Number(row[idxXp]) || 0 : 0,
        level_cached: idxLevel !== undefined ? Number(row[idxLevel]) || 1 : 1,
        last_manual_save_iso: idxLastManual !== undefined ? String(row[idxLastManual] || '') : '',
        exit_ticket_state: idxExit !== undefined ? String(row[idxExit] || '') : '',
        classroom_email: idxClassroom !== undefined ? String(row[idxClassroom] || '') : '',
        true_path_selected: idxTruePath !== undefined ? String(row[idxTruePath] || '') : '',
        completed_assignments_json: idxCompleted !== undefined ? String(row[idxCompleted] || '') : '',
        save_row: r + 1,
      });
    }

    return { ok: true, players: out };
  } catch (err) {
    Logger.log('LhSave_listPlayerSummaries failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Updates only `exit_ticket_state` on the player row (Gmail / mailto workflow).
 */
function LhSave_writeExitTicketState(spreadsheetId, tabNameOverride, playerId, state) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
    if (rowIndex === -1) {
      return { ok: false, error: 'player_not_found' };
    }
    lhSave_writeFieldIfPresent_(sheet, headerMap, rowIndex + 1, LH_PLAYER_SAVE_HEADERS.exit_ticket_state, String(state));
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (err) {
    Logger.log('LhSave_writeExitTicketState failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Writes `classroom_email` on the player row from roster data.
 * Called by RosterService after a successful identity resolution so the teacher's email
 * is always visible on the LhPlayerSave row without requiring a JSON-blob parse.
 * Safe to call on every login — no-ops when the column is absent or the value is unchanged.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabOverride
 * @param {string} playerId
 * @param {string} teacherEmail
 */
function LhSave_syncClassroomEmail(spreadsheetId, tabOverride, playerId, teacherEmail) {
  try {
    if (!teacherEmail) return { ok: true };
    var tab = tabOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetTryGet_(spreadsheetId, tab);
    if (!sheet) return { ok: false, error: 'player_save_tab_missing' };
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var colIdx = headerMap[LH_PLAYER_SAVE_HEADERS.classroom_email];
    if (colIdx === undefined) return { ok: true };
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    if (idCol === undefined) return { ok: false, error: 'player_id_column_missing' };
    var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
    if (rowIndex === -1) return { ok: false, error: 'player_not_found' };
    lhSave_writeFieldIfPresent_(sheet, headerMap, rowIndex + 1, LH_PLAYER_SAVE_HEADERS.classroom_email, teacherEmail);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (err) {
    Logger.log('LhSave_syncClassroomEmail failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Writes the manual-save envelope back to the matching row (no backup snapshot — use `LhSave_manualSaveProgress` from clients).
 */
function LhSave_applyManualSaveEnvelope(spreadsheetId, tabNameOverride, envelope) {
  try {
    var v = LhSave_validateSavePayload(envelope);
    if (!v.ok) {
      return v;
    }
    var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    var playerId = envelope.player_snapshot.player_id;
    var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
    if (rowIndex === -1) {
      throw new Error('Cannot write save — player_id not found: ' + playerId);
    }

    var targetRow = rowIndex + 1;
    var ps = envelope.player_snapshot;
    var revisionToken = ps.revision_token || Utilities.getUuid();

    lhSave_writePlayerSnapshot_(sheet, headerMap, targetRow, ps, {
      questsJson: JSON.stringify(envelope.quests_snapshot || []),
      lastManualIso: envelope.save_kind === 'auto' ? undefined : envelope.saved_at_iso,
      revisionToken: revisionToken,
      autoIso: envelope.save_kind === 'auto' ? envelope.saved_at_iso : undefined,
    });

    lhSave_writeEnvelopeExtensionColumns_(sheet, headerMap, targetRow, envelope);

    SpreadsheetApp.flush();
    return { ok: true, row_written: targetRow, revision_token: revisionToken };
  } catch (err) {
    Logger.log('LhSave_applyManualSaveEnvelope failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
// ---- END Codex/apps-script/services/SaveService.js ----

// ---- BEGIN Codex/apps-script/services/RosterService.js ----
/**
 * Roster identity resolution — correlates Classroom users with canonical `player_id`s.
 */

/**
 * @typedef {{student_email?: string, student_id?: string}} IdentityHint
 */

/**
 * Maps educator roster rows to canonical save keys.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {IdentityHint} identity
 * @returns {{ ok: boolean, player_id?: string, roster_row?: number, error?: string }}
 */
function LhRoster_resolvePlayerId(spreadsheetId, tabNameOverride, identity) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.ROSTER_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);

    var emailIdx = headerMap[LH_ROSTER_HEADERS.student_email];
    var legacyIdIdx = headerMap[LH_ROSTER_HEADERS.student_id];
    var mappedPlayerIdx = headerMap[LH_ROSTER_HEADERS.player_id];

    var rowMatch = -1;
    if (identity.student_email && emailIdx !== undefined) {
      rowMatch = lhSheetFindRowIndex_(rows, emailIdx, identity.student_email.trim().toLowerCase());
      if (rowMatch === -1) {
        // Case-insensitive search fallback — Sheets may already normalise casing.
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][emailIdx]).trim().toLowerCase() === identity.student_email.trim().toLowerCase()) {
            rowMatch = i;
            break;
          }
        }
      }
    }
    if (rowMatch === -1 && identity.student_id && legacyIdIdx !== undefined) {
      rowMatch = lhSheetFindRowIndex_(rows, legacyIdIdx, identity.student_id);
    }

    if (rowMatch === -1) {
      return { ok: false, error: 'roster_miss' };
    }

    if (mappedPlayerIdx === undefined) {
      return { ok: false, error: 'roster_missing_player_id_column' };
    }

    var playerIdCell = rows[rowMatch][mappedPlayerIdx];
    if (!playerIdCell) {
      return { ok: false, error: 'roster_missing_bound_player_id' };
    }

    var resolvedPlayerId = String(playerIdCell);

    // Sync classroom_email onto the player save row so the teacher dashboard always has
    // the teacher email visible without parsing JSON blobs.
    var teacherEmailIdx = headerMap[LH_ROSTER_HEADERS.teacher_email];
    if (teacherEmailIdx !== undefined) {
      var teacherEmail = String(rows[rowMatch][teacherEmailIdx] || '');
      if (teacherEmail) {
        LhSave_syncClassroomEmail(spreadsheetId, null, resolvedPlayerId, teacherEmail);
      }
    }

    return { ok: true, player_id: resolvedPlayerId, roster_row: rowMatch + 1 };
  } catch (err) {
    Logger.log('LhRoster_resolvePlayerId failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Lists roster rows (optionally filtered by section_code / teacher_email).
 *
 * Returns only known schema columns (tolerates missing columns).
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {{ section_code?: string, teacher_email?: string, limit?: number }} filters
 * @returns {{ ok: boolean, roster?: object[], error?: string }}
 */
function LhRoster_listRoster(spreadsheetId, tabNameOverride, filters) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.ROSTER_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    if (!rows || rows.length < 2) {
      return { ok: true, roster: [] };
    }

    var limit = filters && filters.limit ? Number(filters.limit) : 500;
    if (!limit || limit < 1) limit = 500;
    if (limit > 2000) limit = 2000;

    var wantSection = filters && filters.section_code ? String(filters.section_code) : '';
    var wantTeacher = filters && filters.teacher_email ? String(filters.teacher_email).trim().toLowerCase() : '';

    var idxEmail = headerMap[LH_ROSTER_HEADERS.student_email];
    var idxStudentId = headerMap[LH_ROSTER_HEADERS.student_id];
    var idxDisplay = headerMap[LH_ROSTER_HEADERS.player_display_name];
    var idxTeacher = headerMap[LH_ROSTER_HEADERS.teacher_email];
    var idxCourse = headerMap[LH_ROSTER_HEADERS.course];
    var idxSection = headerMap[LH_ROSTER_HEADERS.class_section];
    var idxSectionCode = headerMap[LH_ROSTER_HEADERS.section_code];
    var idxPlayerId = headerMap[LH_ROSTER_HEADERS.player_id];

    var out = [];
    for (var r = 1; r < rows.length; r++) {
      if (out.length >= limit) break;
      var row = rows[r] || [];

      var sectionCode = idxSectionCode !== undefined ? String(row[idxSectionCode] || '') : '';
      var teacherEmail =
        idxTeacher !== undefined ? String(row[idxTeacher] || '').trim().toLowerCase() : '';

      if (wantSection && sectionCode !== wantSection) continue;
      if (wantTeacher && teacherEmail !== wantTeacher) continue;

      out.push({
        student_email: idxEmail !== undefined ? String(row[idxEmail] || '') : '',
        student_id: idxStudentId !== undefined ? String(row[idxStudentId] || '') : '',
        player_display_name: idxDisplay !== undefined ? String(row[idxDisplay] || '') : '',
        teacher_email: teacherEmail,
        course: idxCourse !== undefined ? String(row[idxCourse] || '') : '',
        class_section: idxSection !== undefined ? String(row[idxSection] || '') : '',
        section_code: sectionCode,
        player_id: idxPlayerId !== undefined ? String(row[idxPlayerId] || '') : '',
        roster_row: r + 1,
      });
    }

    return { ok: true, roster: out };
  } catch (err) {
    Logger.log('LhRoster_listRoster failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
// ---- END Codex/apps-script/services/RosterService.js ----

// ---- BEGIN Codex/apps-script/services/QuestService.js ----
/**
 * QuestService — Milestone 3 quest reads + snapshot mutations on player rows.
 */

function lhQuest_readDefinitionsTable_(spreadsheetId) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.QUEST_DEFINITION_TAB);
  if (!sheet) {
    return { ok: false, error: 'quest_definitions_tab_missing', rows: [] };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var out = [];
  var idCol = headerMap[LH_QUEST_DEF_HEADERS.quest_id];
  if (idCol === undefined) {
    return { ok: false, error: 'quest_id_column_missing', rows: [] };
  }
  for (var i = 1; i < rows.length; i++) {
    var qid = rows[i][idCol];
    if (!qid) continue;
    var realmRaw = '';
    var realmCol = headerMap[LH_QUEST_DEF_HEADERS.realm_ids_json];
    if (realmCol !== undefined) {
      realmRaw = rows[i][realmCol];
    }
    var realmIds = [];
    if (realmRaw) {
      realmIds = lhQuest_parseJson_(realmRaw, []);
      if (!Array.isArray(realmIds)) {
        realmIds = [];
      }
    }
    out.push({
      quest_id: String(qid),
      title: String(headerMap[LH_QUEST_DEF_HEADERS.title] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.title]] : ''),
      tier: String(headerMap[LH_QUEST_DEF_HEADERS.tier] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.tier]] : 'main'),
      act: Number(headerMap[LH_QUEST_DEF_HEADERS.act] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.act]] : 1) || 1,
      status: String(headerMap[LH_QUEST_DEF_HEADERS.status] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.status]] : 'available'),
      objective_short: String(
        headerMap[LH_QUEST_DEF_HEADERS.objective_short] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.objective_short]] : '',
      ),
      realm_ids: realmIds,
    });
  }
  return { ok: true, rows: out };
}

function lhQuest_parseJson_(raw, fb) {
  if (!raw) return fb;
  try {
    return JSON.parse(String(raw));
  } catch (e) {
    return fb;
  }
}

function lhQuest_ensureQuestsArray_(spreadsheetId, tabOverride, playerId, fallbackDefinitions) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var fb = fallbackDefinitions || [];
  var quests = load.quests && load.quests.length ? load.quests : fb;
  if (!quests || !quests.length) {
    quests = [];
  }
  return { ok: true, player: load.player, quests: quests };
}

/**
 * @returns {{ ok: boolean, quest?: object, error?: string }}
 */
function LhQuest_getQuestById(spreadsheetId, questId) {
  var tbl = lhQuest_readDefinitionsTable_(spreadsheetId);
  if (!tbl.ok) {
    return { ok: false, error: tbl.error };
  }
  if (!tbl.rows.length) {
    return { ok: false, error: 'no_quest_rows' };
  }
  for (var i = 0; i < tbl.rows.length; i++) {
    if (tbl.rows[i].quest_id === questId) {
      return { ok: true, quest: tbl.rows[i] };
    }
  }
  return { ok: false, error: 'quest_not_found' };
}

/**
 * @returns {{ ok: boolean, quests?: object[], player?: object, error?: string }}
 */
function LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId) {
  var defs = lhQuest_readDefinitionsTable_(spreadsheetId);
  var fallback = defs.ok ? defs.rows : [];
  return lhQuest_ensureQuestsArray_(spreadsheetId, tabOverride, playerId, fallback);
}

/**
 * Marks a quest step complete (updates `quests_snapshot_json` + player headline fields when main quest completes).
 * @param {object} args { quest_id, next_player_fields?: object }
 */
function LhQuest_completeQuestStep(spreadsheetId, tabOverride, playerId, args) {
  if (!args || !args.quest_id) {
    return { ok: false, error: 'quest_id_required' };
  }
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var found = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].quest_id === args.quest_id) {
      quests[i].status = 'completed';
      found = true;
      break;
    }
  }
  if (!found) {
    return { ok: false, error: 'quest_not_in_snapshot' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  if (args.next_player_fields && typeof args.next_player_fields === 'object') {
    Object.keys(args.next_player_fields).forEach(function (k) {
      player[k] = args.next_player_fields[k];
    });
  }
  var patchErr = LhSave_validatePlayerSnapshot_(player);
  if (patchErr.length) {
    return { ok: false, errors: patchErr };
  }
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Sets first `locked` quest in same act as `available` (MVP unlock rule).
 */
function LhQuest_unlockNextQuest(spreadsheetId, tabOverride, playerId, realmIdHint) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var playerAct = st.player.current_act;
  var unlocked = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].status === 'locked' && Number(quests[i].act) === Number(playerAct)) {
      if (!realmIdHint || !quests[i].realm_ids || !quests[i].realm_ids.length || quests[i].realm_ids.indexOf(realmIdHint) !== -1) {
        quests[i].status = 'available';
        unlocked = true;
        break;
      }
    }
  }
  if (!unlocked) {
    return { ok: false, error: 'no_locked_quest_to_unlock' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Plain-language instruction for HUD / resume (quest data + player row).
 */
function LhQuest_generateCurrentRequiredNextAction(spreadsheetId, tabOverride, playerId) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var pid = st.player.active_main_quest_id;
  var line = '';
  for (var i = 0; i < st.quests.length; i++) {
    if (st.quests[i].quest_id === pid && st.quests[i].status === 'active') {
      line = st.quests[i].objective_short || '';
      break;
    }
  }
  var text = st.player.required_next_action || line || 'Consult your Quest Log for the next classroom task.';
  return { ok: true, required_next_action: text, quest_objective: line };
}

function lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests) {
  var envelope = {
    schema_version: 1,
    saved_at_iso: new Date().toISOString(),
    player_snapshot: player,
    quests_snapshot: quests,
    realm_id: player.current_realm_id || 'unknown_realm',
    progression_flags: { visited_trigger_object_ids: [] },
  };
  return LhSave_manualSaveProgress(spreadsheetId, tabOverride, envelope);
}
// ---- END Codex/apps-script/services/QuestService.js ----

// ---- BEGIN Codex/apps-script/services/SessionService.js ----
/**
 * SessionService — Milestone 3 class-block / play session history (append-only tab).
 */

function lhSession_appendObjectRow_(sheet, obj) {
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return false;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = [];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    if (!h) {
      row.push('');
      continue;
    }
    row.push(Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : '');
  }
  sheet.appendRow(row);
  return true;
}

/**
 * Opens a session row (ended_iso empty until endSession).
 */
function LhSession_beginSession(spreadsheetId, playerId, meta) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var sessionId = Utilities.getUuid();
  var began = new Date().toISOString();
  var hint = meta && meta.device_hint ? String(meta.device_hint) : '';
  var row = {};
  row[LH_SESSION_HISTORY_HEADERS.session_id] = sessionId;
  row[LH_SESSION_HISTORY_HEADERS.player_id] = playerId;
  row[LH_SESSION_HISTORY_HEADERS.began_iso] = began;
  row[LH_SESSION_HISTORY_HEADERS.ended_iso] = '';
  row[LH_SESSION_HISTORY_HEADERS.summary_json] = '{}';
  row[LH_SESSION_HISTORY_HEADERS.device_hint] = hint;
  lhSession_appendObjectRow_(sheet, row);
  return { ok: true, session_id: sessionId, began_iso: began };
}

/**
 * Closes a session row by session_id.
 */
function LhSession_endSession(spreadsheetId, sessionId, summaryObj) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var sidCol = headerMap[LH_SESSION_HISTORY_HEADERS.session_id];
  if (sidCol === undefined) {
    return { ok: false, error: 'session_id_column_missing' };
  }
  var rowIndex = lhSheetFindRowIndex_(rows, sidCol, sessionId);
  if (rowIndex === -1) {
    return { ok: false, error: 'session_not_found' };
  }
  var targetRow = rowIndex + 1;
  var ended = new Date().toISOString();
  var summaryJson = JSON.stringify(summaryObj || {});
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.ended_iso, ended);
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.summary_json, summaryJson);
  SpreadsheetApp.flush();
  return { ok: true, ended_iso: ended };
}

/**
 * Compact JSON-friendly summary for Sheets storage or exit tickets.
 */
function LhSession_buildSessionSummary(player, quests) {
  return {
    player_id: player && player.player_id,
    display_name: player && player.display_name,
    active_main_quest_id: player && player.active_main_quest_id,
    current_realm_id: player && player.current_realm_id,
    xp_total: player && player.xp_total,
    quest_count: quests && quests.length,
    generated_iso: new Date().toISOString(),
  };
}

/**
 * Appends a completed session summary as a new history row (audit / teacher view).
 *
 * summaryObj optional teacher-audit fields:
 *   student_id, section_code, start_realm, end_realm, quests_completed (string[]),
 *   campfire_log_entry_json (object), xp_gained, manual_save_completed,
 *   exit_ticket_sent, draft_response_saved
 */
function LhSession_writeSessionHistory(spreadsheetId, playerId, summaryObj) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var sessionId = Utilities.getUuid();
  var iso = new Date().toISOString();
  var s = summaryObj || {};

  var row = {};
  row[LH_SESSION_HISTORY_HEADERS.session_id] = sessionId;
  row[LH_SESSION_HISTORY_HEADERS.player_id] = playerId;
  row[LH_SESSION_HISTORY_HEADERS.began_iso] = lhSave_isoForSheet_(iso);
  row[LH_SESSION_HISTORY_HEADERS.ended_iso] = lhSave_isoForSheet_(iso);
  row[LH_SESSION_HISTORY_HEADERS.summary_json] = JSON.stringify(s);
  row[LH_SESSION_HISTORY_HEADERS.device_hint] = 'writeSessionHistory';
  row[LH_SESSION_HISTORY_HEADERS.campfire_log_entry] =
    typeof s.exit_ticket_body === 'string' ? s.exit_ticket_body : '';
  row[LH_SESSION_HISTORY_HEADERS.player_display_name] =
    typeof s.player_display_name === 'string' ? s.player_display_name : '';

  // ── Teacher audit columns ────────────────────────────────────────────────
  row[LH_SESSION_HISTORY_HEADERS.student_id] =
    typeof s.student_id === 'string' ? s.student_id : '';
  row[LH_SESSION_HISTORY_HEADERS.section_code] =
    typeof s.section_code === 'string' ? s.section_code : '';
  row[LH_SESSION_HISTORY_HEADERS.start_realm] =
    typeof s.start_realm === 'string' ? s.start_realm : '';
  row[LH_SESSION_HISTORY_HEADERS.end_realm] =
    typeof s.end_realm === 'string' ? s.end_realm : (typeof s.current_realm_id === 'string' ? s.current_realm_id : '');
  row[LH_SESSION_HISTORY_HEADERS.quests_completed_json] =
    Array.isArray(s.quests_completed) ? JSON.stringify(s.quests_completed) : '[]';
  row[LH_SESSION_HISTORY_HEADERS.campfire_log_entry_json] =
    s.campfire_log_entry_json && typeof s.campfire_log_entry_json === 'object'
      ? JSON.stringify(s.campfire_log_entry_json)
      : '';
  row[LH_SESSION_HISTORY_HEADERS.xp_gained] =
    typeof s.xp_gained === 'number' ? s.xp_gained : 0;
  row[LH_SESSION_HISTORY_HEADERS.manual_save_completed] =
    s.manual_save_completed === true;
  row[LH_SESSION_HISTORY_HEADERS.exit_ticket_sent] =
    s.exit_ticket_sent === true;
  row[LH_SESSION_HISTORY_HEADERS.draft_response_saved] =
    s.draft_response_saved === true;

  // session_number: count of existing ended rows for this player + 1.
  var rows = lhSheetReadTable_(sheet);
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var pidIdx = headerMap[LH_SESSION_HISTORY_HEADERS.player_id];
  var endedIdx = headerMap[LH_SESSION_HISTORY_HEADERS.ended_iso];
  var sessionCount = 0;
  if (pidIdx !== undefined) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][pidIdx] || '') === String(playerId) &&
          endedIdx !== undefined && String(rows[i][endedIdx] || '').trim()) {
        sessionCount++;
      }
    }
  }
  row[LH_SESSION_HISTORY_HEADERS.session_number] = sessionCount + 1;

  lhSession_appendObjectRow_(sheet, row);
  return { ok: true, session_id: sessionId };
}

/**
 * Lists all session history rows that have a campfire_log_entry but have NOT been graded
 * (campfire_score is blank/empty). Returns lightweight objects suitable for the grading queue.
 *
 * @param {string} spreadsheetId
 * @returns {{ ok: boolean, reflections?: object[], error?: string }}
 */
function LhSession_listUngradedReflections(spreadsheetId) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  if (rows.length < 2) {
    return { ok: true, reflections: [] };
  }
  var sidIdx    = headerMap[LH_SESSION_HISTORY_HEADERS.session_id];
  var pidIdx    = headerMap[LH_SESSION_HISTORY_HEADERS.player_id];
  var beganIdx  = headerMap[LH_SESSION_HISTORY_HEADERS.began_iso];
  var endedIdx  = headerMap[LH_SESSION_HISTORY_HEADERS.ended_iso];
  var logIdx    = headerMap[LH_SESSION_HISTORY_HEADERS.campfire_log_entry];
  var scoreIdx  = headerMap[LH_SESSION_HISTORY_HEADERS.campfire_score];
  var nameIdx   = headerMap[LH_SESSION_HISTORY_HEADERS.player_display_name];

  if (logIdx === undefined) {
    return { ok: false, error: 'campfire_log_entry_column_missing' };
  }

  var results = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var logEntry = String(r[logIdx] || '').trim();
    if (!logEntry) continue;
    var scoreRaw = scoreIdx !== undefined ? String(r[scoreIdx] || '').trim() : '';
    if (scoreRaw !== '') continue; // already graded
    results.push({
      session_id:          sidIdx !== undefined ? String(r[sidIdx] || '') : '',
      player_id:           pidIdx !== undefined ? String(r[pidIdx] || '') : '',
      player_display_name: nameIdx !== undefined ? String(r[nameIdx] || '') : '',
      began_iso:           beganIdx !== undefined ? String(r[beganIdx] || '') : '',
      ended_iso:           endedIdx !== undefined ? String(r[endedIdx] || '') : '',
      campfire_log_entry:  logEntry,
    });
  }
  return { ok: true, reflections: results };
}

/**
 * Writes campfire grade columns onto the matching session history row, then updates the
 * player's `last_campfire_score` field in LhPlayerSave so Rested Readiness can fire next
 * session start.
 *
 * @param {string} spreadsheetId
 * @param {string} sessionId
 * @param {{ score: number, comment: string, graded_by: string }} gradeObj
 * @returns {{ ok: boolean, error?: string }}
 */
function LhSession_gradeCampfireReflection(spreadsheetId, sessionId, gradeObj) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var sidCol = headerMap[LH_SESSION_HISTORY_HEADERS.session_id];
  if (sidCol === undefined) {
    return { ok: false, error: 'session_id_column_missing' };
  }
  var rowIndex = lhSheetFindRowIndex_(rows, sidCol, sessionId);
  if (rowIndex === -1) {
    return { ok: false, error: 'session_not_found' };
  }
  var targetRow = rowIndex + 1;
  var gradedAt = new Date().toISOString();
  var score = typeof gradeObj.score === 'number' ? gradeObj.score : Number(gradeObj.score);
  var comment = typeof gradeObj.comment === 'string' ? gradeObj.comment.slice(0, 140) : '';
  var gradedBy = typeof gradeObj.graded_by === 'string' ? gradeObj.graded_by : '';

  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.campfire_score, score);
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.campfire_comment, comment);
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.campfire_graded_at, gradedAt);
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_SESSION_HISTORY_HEADERS.campfire_graded_by, gradedBy);
  SpreadsheetApp.flush();

  // Propagate score and streak to player save.
  var pidIdx = headerMap[LH_SESSION_HISTORY_HEADERS.player_id];
  var playerId = pidIdx !== undefined ? String(rows[rowIndex][pidIdx] || '') : '';
  if (playerId) {
    LhSession_updatePlayerLastCampfireScore(spreadsheetId, playerId, score);
    LhSession_updateCampfireStreak(spreadsheetId, playerId, score);
  }

  return { ok: true, graded_at: gradedAt };
}

/**
 * Updates `last_campfire_score` on a player's save row so Rested Readiness applies next
 * session. Called automatically by `LhSession_gradeCampfireReflection`.
 *
 * @param {string} spreadsheetId
 * @param {string} playerId
 * @param {number} score  0–5
 * @returns {{ ok: boolean, error?: string }}
 */
function LhSession_updatePlayerLastCampfireScore(spreadsheetId, playerId, score) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.PLAYER_SAVE_TAB);
  if (!sheet) {
    return { ok: false, error: 'player_save_tab_missing' };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  if (idCol === undefined) {
    return { ok: false, error: 'player_id_column_missing' };
  }
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) {
    return { ok: false, error: 'player_not_found' };
  }
  var targetRow = rowIndex + 1;
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.last_campfire_score, score);
  SpreadsheetApp.flush();
  return { ok: true };
}

/**
 * Updates `campfire_streak` and awards cosmetic milestones based on teacher grade.
 *
 * Rules:
 *   score >= 3  →  streak += 1, then award any milestones now due.
 *   score <  3  →  streak = 0 (reset; no milestone awards this session).
 *
 * Milestones (idempotent — duplicate IDs are never written):
 *   streak  3  →  badge   VISUAL_AMBER_FLAME
 *   streak  5  →  title   title_thoughtful_traveler
 *   streak 10  →  title   title_chronicler_of_the_flame
 *
 * @param {string} spreadsheetId
 * @param {string} playerId
 * @param {number} score  0–5
 * @returns {{ ok: boolean, new_streak?: number, error?: string }}
 */
function LhSession_updateCampfireStreak(spreadsheetId, playerId, score) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.PLAYER_SAVE_TAB);
  if (!sheet) return { ok: false, error: 'player_save_tab_missing' };

  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  if (idCol === undefined) return { ok: false, error: 'player_id_column_missing' };

  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) return { ok: false, error: 'player_not_found' };

  var targetRow = rowIndex + 1;

  // --- Compute new streak ---
  var prevStreak = 0;
  var streakCol = headerMap[LH_PLAYER_SAVE_HEADERS.campfire_streak];
  if (streakCol !== undefined) {
    var rawStreak = rows[rowIndex][streakCol];
    prevStreak = typeof rawStreak === 'number' ? rawStreak : (parseInt(String(rawStreak), 10) || 0);
  }
  var newStreak = score >= 3 ? prevStreak + 1 : 0;
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.campfire_streak, newStreak);

  // --- Award cosmetic milestones (only on qualifying streak; idempotent) ---
  var MILESTONES = [
    { streak: 3,  kind: 'badge', id: 'VISUAL_AMBER_FLAME' },
    { streak: 5,  kind: 'title', id: 'title_thoughtful_traveler' },
    { streak: 10, kind: 'title', id: 'title_chronicler_of_the_flame' },
  ];

  if (newStreak > 0) {
    var inventoryCol = headerMap[LH_PLAYER_SAVE_HEADERS.satchel_inventory_json];
    if (inventoryCol !== undefined) {
      var rawJson = rows[rowIndex][inventoryCol];
      var inventory;
      try {
        inventory = rawJson ? JSON.parse(String(rawJson)) : null;
      } catch (e) {
        inventory = null;
      }
      if (!inventory || typeof inventory !== 'object') {
        inventory = { items: [], mementos: [], consumables: [], cosmetics: { unlocked_titles: [], unlocked_badges: [], active_title: null } };
      }
      if (!inventory.cosmetics || typeof inventory.cosmetics !== 'object') {
        inventory.cosmetics = { unlocked_titles: [], unlocked_badges: [], active_title: null };
      }
      if (!Array.isArray(inventory.cosmetics.unlocked_titles)) inventory.cosmetics.unlocked_titles = [];
      if (!Array.isArray(inventory.cosmetics.unlocked_badges)) inventory.cosmetics.unlocked_badges = [];

      var changed = false;
      for (var i = 0; i < MILESTONES.length; i++) {
        var m = MILESTONES[i];
        if (newStreak < m.streak) continue;
        if (m.kind === 'badge') {
          if (inventory.cosmetics.unlocked_badges.indexOf(m.id) === -1) {
            inventory.cosmetics.unlocked_badges.push(m.id);
            changed = true;
          }
        } else if (m.kind === 'title') {
          if (inventory.cosmetics.unlocked_titles.indexOf(m.id) === -1) {
            inventory.cosmetics.unlocked_titles.push(m.id);
            changed = true;
          }
        }
      }

      if (changed) {
        lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.satchel_inventory_json, JSON.stringify(inventory));
      }
    }
  }

  SpreadsheetApp.flush();
  return { ok: true, new_streak: newStreak };
}

function createSessionHints_(teacherContext) {
  return { roster_scope: (teacherContext && teacherContext.roster_scope) || 'unknown' };
}

function touchSessionHeartbeat_(sessionToken) {
  return { ok: true, sessionToken: sessionToken };
}
// ---- END Codex/apps-script/services/SessionService.js ----

// ---- BEGIN Codex/apps-script/services/AssetService.js ----
/**
 * AssetService — Milestone 3 media lookup + realm/NPC filtered bundles.
 */

/**
 * Finds a catalog row keyed by asset_id inside `LH_SCHEMA.MEDIA_ASSET_TAB`.
 */
function LhAsset_getRecord(spreadsheetId, asset_id) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);

    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
    if (idCol === undefined) {
      throw new Error('asset_id column missing — align Media workbook');
    }
    var rowIndex = lhSheetFindRowIndex_(rows, idCol, asset_id);
    if (rowIndex === -1) {
      return { ok: false, error: 'asset_not_found' };
    }

    var record = {};
    var headerRow = rows[0];
    for (var c = 0; c < headerRow.length; c++) {
      var header = String(headerRow[c]).trim();
      if (!header) continue;
      record[header] = rows[rowIndex][c];
    }

    return { ok: true, record: record };
  } catch (err) {
    Logger.log('LhAsset_getRecord failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * @returns {{ ok: boolean, assets?: object[], error?: string }}
 */
function LhAsset_getRealmAssets(spreadsheetId, realmId) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
    var tagCol = headerMap[LH_MEDIA_HEADERS.realm_tags_csv];
    if (idCol === undefined) {
      return { ok: false, error: 'asset_id_column_missing' };
    }
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var aid = rows[i][idCol];
      if (!aid) continue;
      var tags = tagCol !== undefined ? String(rows[i][tagCol] || '') : '';
      var tokens = tags
        .split(',')
        .map(function (t) {
          return t.trim();
        })
        .filter(function (t) {
          return t.length > 0;
        });
      var include = !realmId || tokens.length === 0 || tokens.indexOf(realmId) !== -1;
      if (!include) {
        continue;
      }
      var rec = {};
      var headerRow = rows[0];
      for (var c = 0; c < headerRow.length; c++) {
        var header = String(headerRow[c]).trim();
        if (!header) continue;
        rec[header] = rows[i][c];
      }
      out.push(rec);
    }
    return { ok: true, assets: out };
  } catch (err) {
    Logger.log('LhAsset_getRealmAssets failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * @returns {{ ok: boolean, assets?: object[], error?: string }}
 */
function LhAsset_getNpcAssets(spreadsheetId, npcId) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
    var npcCol = headerMap[LH_MEDIA_HEADERS.npc_id];
    if (idCol === undefined) {
      return { ok: false, error: 'asset_id_column_missing' };
    }
    if (npcCol === undefined) {
      return { ok: true, assets: [] };
    }
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][npcCol] || '') !== String(npcId || '')) {
        continue;
      }
      var rec = {};
      var headerRow = rows[0];
      for (var c = 0; c < headerRow.length; c++) {
        var header = String(headerRow[c]).trim();
        if (!header) continue;
        rec[header] = rows[i][c];
      }
      out.push(rec);
    }
    return { ok: true, assets: out };
  } catch (err) {
    Logger.log('LhAsset_getNpcAssets failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
// ---- END Codex/apps-script/services/AssetService.js ----

// ---- BEGIN Codex/apps-script/services/ExitTicketService.js ----
/**
 * ExitTicketService — Milestone 3 exit-ticket copy + state column + Gmail precursor.
 */

/**
 * Teacher-facing / student-facing recap for end-of-class ritual (plain text).
 */
function LhExitTicket_buildPromptForCurrentState(player, quests) {
  var qline = '';
  if (quests && player && player.active_main_quest_id) {
    for (var i = 0; i < quests.length; i++) {
      if (quests[i].quest_id === player.active_main_quest_id) {
        qline = quests[i].objective_short || quests[i].title || '';
        break;
      }
    }
  }
  var name = (player && player.display_name) || 'Traveler';
  var act = (player && player.current_act) || 1;
  var realm = (player && player.current_realm_id) || 'unknown realm';
  var next = (player && player.required_next_action) || qline || 'Review your Quest Log for the next step.';
  return (
    'Campfire log — ' +
    name +
    '\n' +
    'Act ' +
    act +
    ' | Realm: ' +
    realm +
    '\n' +
    'Active thread: ' +
    next +
    '\n' +
    'In one or two sentences, what felt most useful today, and what will you do first next time?'
  );
}

/**
 * Persists workflow state on the player row (`exit_ticket_state` column).
 */
function LhExitTicket_markExitTicketState(spreadsheetId, tabOverride, playerId, state) {
  return LhSave_writeExitTicketState(spreadsheetId, tabOverride, playerId, state);
}

/**
 * v4 decision: exit ticket routing is in-game + sheet-backed; no Gmail/mailto compose in the runtime.
 * `LhExitTicket_buildPromptForCurrentState` remains as a plain-text prompt for teacher portal display.
 */
// ---- END Codex/apps-script/services/ExitTicketService.js ----

// ---- BEGIN Codex/apps-script/services/LookupService.js ----
/**
 * LookupService — Milestone 3 ID registries for validation (optional Sheets tabs).
 */

function lhLookup_columnValues_(spreadsheetId, tabName, headerKey, headerConstMap) {
  var sheet = lhSheetTryGet_(spreadsheetId, tabName);
  if (!sheet) {
    return [];
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var col = headerMap[headerConstMap[headerKey]];
  if (col === undefined) {
    return [];
  }
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var v = rows[i][col];
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      out.push(String(v).trim());
    }
  }
  return out;
}

function LhLookup_listValidQuestIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.QUEST_DEFINITION_TAB, 'quest_id', LH_QUEST_DEF_HEADERS);
}

function LhLookup_listRealmIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.REALM_DEFINITION_TAB, 'realm_id', LH_REALM_DEF_HEADERS);
}

function LhLookup_listItemIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.ITEM_DEFINITION_TAB, 'item_id', LH_ITEM_DEF_HEADERS);
}

/**
 * @param {string} key — `quest_tier` | `quest_status` | `exit_ticket_state`
 */
function LhLookup_listEnumValues(key) {
  var map = {
    quest_tier: ['main', 'side', 'guild'],
    quest_status: ['active', 'available', 'locked', 'completed', 'turned_in'],
    exit_ticket_state: ['none', 'draft_ready', 'sent', 'skipped'],
  };
  return map[key] ? map[key].slice() : [];
}
// ---- END Codex/apps-script/services/LookupService.js ----

// ---- BEGIN Codex/apps-script/services/TeacherOverrideService.js ----
/**
 * TeacherOverrideService — Milestone 3 educator rescue operations.
 */

/**
 * Forces a quest row in the player snapshot to `available` (e.g. stuck `locked`).
 */
function LhTeacher_unlockQuest(spreadsheetId, tabOverride, playerId, questId) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var found = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].quest_id === questId) {
      quests[i].status = 'available';
      found = true;
      break;
    }
  }
  if (!found) {
    return { ok: false, error: 'quest_not_in_snapshot' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

function LhTeacher_rollbackCheckpoint(spreadsheetId, tabOverride, playerId) {
  return LhSave_restoreBackupCheckpoint(spreadsheetId, tabOverride, playerId);
}

/**
 * Adds or increments an inventory line item then persists via manual save (checkpointed).
 */
function LhTeacher_restoreItem(spreadsheetId, tabOverride, playerId, itemId, qty, label) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var player = JSON.parse(JSON.stringify(load.player));
  var inv = player.inventory_summary || { coins: 0, items: [] };
  if (!Array.isArray(inv.items)) {
    inv.items = [];
  }
  var q = Number(qty) > 0 ? Number(qty) : 1;
  var hit = -1;
  for (var i = 0; i < inv.items.length; i++) {
    if (inv.items[i].item_id === itemId) {
      hit = i;
      break;
    }
  }
  if (hit === -1) {
    inv.items.push({ item_id: itemId, qty: q, label: label || itemId });
  } else {
    inv.items[hit].qty = Number(inv.items[hit].qty || 0) + q;
    if (label) {
      inv.items[hit].label = label;
    }
  }
  player.inventory_summary = inv;
  var quests = load.quests && load.quests.length ? load.quests : [];
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Sets narrative force target columns on a player row.
 * These are teacher-only writes — player saves never touch these columns.
 * The frontend reads them on load and routes the player toward the forced act/realm.
 * Pass null for either value to leave it unchanged.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabOverride
 * @param {string} playerId
 * @param {number | null} targetAct   — act number to force, or null to skip
 * @param {string | null} targetRealm — realm_id to force, or null to skip
 */
function LhTeacher_setNarrativeForce(spreadsheetId, tabOverride, playerId, targetAct, targetRealm) {
  var tab = tabOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
  var sheet = lhSheetTryGet_(spreadsheetId, tab);
  if (!sheet) return { ok: false, error: 'player_save_tab_missing' };
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  if (idCol === undefined) return { ok: false, error: 'player_id_column_missing' };
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) return { ok: false, error: 'player_not_found' };
  var targetRow = rowIndex + 1;
  if (targetAct !== null && targetAct !== undefined) {
    var act = Number(targetAct);
    if (!act || act < 1) return { ok: false, error: 'invalid_target_act' };
    lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.narrative_force_target_act, act);
  }
  if (targetRealm !== null && targetRealm !== undefined) {
    lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.narrative_force_target_realm, String(targetRealm));
  }
  SpreadsheetApp.flush();
  return { ok: true };
}

/**
 * Clears both narrative force columns on a player row (restores normal self-directed progression).
 */
function LhTeacher_clearNarrativeForce(spreadsheetId, tabOverride, playerId) {
  var tab = tabOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
  var sheet = lhSheetTryGet_(spreadsheetId, tab);
  if (!sheet) return { ok: false, error: 'player_save_tab_missing' };
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  if (idCol === undefined) return { ok: false, error: 'player_id_column_missing' };
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, playerId);
  if (rowIndex === -1) return { ok: false, error: 'player_not_found' };
  var targetRow = rowIndex + 1;
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.narrative_force_target_act, '');
  lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.narrative_force_target_realm, '');
  SpreadsheetApp.flush();
  return { ok: true };
}

/**
 * Rewinds narrative act index (does not auto-reset quests — pair with quest fixes as needed).
 */
function LhTeacher_resetActState(spreadsheetId, tabOverride, playerId, targetAct) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var act = Number(targetAct);
  if (!act || act < 1) {
    return { ok: false, error: 'invalid_target_act' };
  }
  var player = JSON.parse(JSON.stringify(load.player));
  player.current_act = act;
  player.required_next_action =
    'Your guide has reset your Act marker to ' + act + '. Open the Quest Log and follow the next classroom objective.';
  var quests = load.quests && load.quests.length ? load.quests : [];
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}
// ---- END Codex/apps-script/services/TeacherOverrideService.js ----

// ---- BEGIN Codex/apps-script/services/InterviewService.js ----
/**
 * InterviewService — GT-102 "Trial of Tongues" backend turn runner.
 *
 * Important: This implementation is intentionally model-free (safe stub).
 * In production, replace `lhInterview_buildReply_` with a secure model call
 * from Apps Script (or a separate server) while keeping the same request/response shape.
 */

function lhInterview_nowIso_() {
  return new Date().toISOString();
}

function lhInterview_sanitizeText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).slice(0, 4000);
}

function lhInterview_pickNpcForRealm_(realmId) {
  var rid = String(realmId || '');
  if (rid === 'realm_aethelwood') return { npc_id: 'npc_ag_elder_thorne', name: 'Elder Thorne', title: 'High Warden of Aethelwood' };
  if (rid === 'realm_etheric_nexus') return { npc_id: 'npc_it_technomancer_zero', name: 'Technomancer Zero', title: 'Core Overseer of the Nexus' };
  if (rid === 'realm_monolith_masonry') return { npc_id: 'npc_arch_master_mason_kael', name: 'Master Mason Kael', title: 'Architect of the Monolith' };
  return { npc_id: 'npc_guild_proctor', name: 'Guild Proctor', title: 'High Council Liaison' };
}

function lhInterview_buildReply_(turnIndex, npc, lastUserText) {
  // 0-based question index; keep replies short (2–3 sentences).
  if (turnIndex <= 0) {
    return (
      'I am ' +
      npc.name +
      ', ' +
      npc.title +
      '. Answer with clarity, Traveler. Why do you seek to serve this Guild?'
    );
  }
  if (turnIndex === 1) {
    return (
      'So noted. Tell me of a time you solved a problem using your unique skills — what did you do, and what was the outcome?'
    );
  }
  if (turnIndex === 2) {
    return 'Accepted. How do you handle disputes with fellow Travelers when emotions run high?';
  }
  return 'The interview is concluded. I will now weigh your merits.';
}

/**
 * Runs a single GT-102 turn. Client sends current transcript turns + new user text.
 *
 * Request:
 * - player_id: string
 * - realm_id: string
 * - transcript: { turns: [{ role:'user'|'npc', text:string, at_iso:string }], favor:number }
 * - user_text: string
 *
 * Response:
 * - ok: boolean
 * - npc: { npc_id, name, title }
 * - reply_text: string
 * - next: { turns, favor, finished:boolean }
 */
function LhInterview_runGt102Turn(body) {
  try {
    if (!body || typeof body !== 'object') {
      return { ok: false, error: 'body_required' };
    }
    var playerId = lhInterview_sanitizeText_(body.player_id);
    var realmId = lhInterview_sanitizeText_(body.realm_id);
    if (!playerId) return { ok: false, error: 'player_id_required' };
    if (!realmId) return { ok: false, error: 'realm_id_required' };

    var npc = lhInterview_pickNpcForRealm_(realmId);
    var transcript = body.transcript && typeof body.transcript === 'object' ? body.transcript : {};
    var turns = Array.isArray(transcript.turns) ? transcript.turns : [];
    var favor = Number(transcript.favor);
    if (!Number.isFinite(favor)) favor = 50;

    var userText = lhInterview_sanitizeText_(body.user_text);

    // If user text provided, append it.
    if (userText) {
      turns = turns.concat([{ role: 'user', text: userText, at_iso: lhInterview_nowIso_() }]);

      // Simple professionalism heuristic (server-side, deterministic).
      if (userText.length > 20) favor += 5;
      if (userText[0] && userText[0] === userText[0].toUpperCase()) favor += 2;
      if (/[.!?]$/.test(userText)) favor += 2;
      if (/\bidk\b|\blol\b|\bgonna\b/i.test(userText)) favor -= 15;
      if (favor < 0) favor = 0;
      if (favor > 100) favor = 100;
    }

    // Determine which question we are on by counting user answers (max 3).
    var userCount = 0;
    for (var i = 0; i < turns.length; i++) {
      if (turns[i] && turns[i].role === 'user') userCount++;
    }

    var reply = lhInterview_buildReply_(userCount === 0 ? 0 : userCount, npc, userText);
    turns = turns.concat([{ role: 'npc', text: reply, at_iso: lhInterview_nowIso_() }]);

    var finished = reply.indexOf('The interview is concluded.') !== -1 || userCount >= 3;

    return {
      ok: true,
      npc: npc,
      reply_text: reply,
      next: {
        turns: turns,
        favor: favor,
        finished: finished,
      },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
// ---- END Codex/apps-script/services/InterviewService.js ----

// ---- BEGIN Codex/apps-script/utils/Config.js ----
/**
 * Centralized configuration accessors (spreadsheet IDs, deployment flags).
 * Populate via Script Properties rather than literals before production rollout.
 */

function lhSpreadsheetId_() {
  return PropertiesService.getScriptProperties().getProperty('LH_SPREADSHEET_ID') || '';
}
// ---- END Codex/apps-script/utils/Config.js ----

// ---- BEGIN Codex/apps-script/LhWebApp.js ----
/**
 * Web App entry — deploy as "Execute as me" / "Anyone" (or domain) POST handler.
 * Load after all service modules (see apps-script/README.md).
 *
 * Script property `LH_SPREADSHEET_ID` used when request body omits `spreadsheet_id`.
 */

function lhWebJsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Appends a Quest of Fate career worksheet submission to the LhQuestOfFate tab.
 *
 * Tab must exist with this header row (columns in any order):
 *   submitted_iso, player_id, quest_id, module_id, prophecy_id, prophecy_title,
 *   career_name, career_summary, responsibilities, work_environment,
 *   median_salary, min_education, credentials, pros, cons, personal_fit
 *
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 */
function LhQuestOfFate_submitWorksheet(spreadsheetId, playerId, worksheet) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.QUEST_OF_FATE_TAB);
  if (!sheet) {
    return { ok: false, error: 'LhQuestOfFate tab missing — teacher must create the tab with the required header row.' };
  }
  var ws = worksheet || {};
  var row = {};
  row['submitted_iso'] = ws.submitted_at_iso || new Date().toISOString();
  row['player_id']      = String(playerId || '');
  row['quest_id']       = 'mq-203';
  row['module_id']      = 'mod_quest_of_fate_worksheet';
  row['prophecy_id']    = String(ws.prophecy_id || '');
  row['prophecy_title'] = String(ws.prophecy_title || '');
  row['career_name']    = String(ws.career_name || '');
  row['career_summary'] = String(ws.career_summary || '');
  row['responsibilities'] = String(ws.responsibilities || '');
  row['work_environment'] = String(ws.work_environment || '');
  row['median_salary']  = String(ws.median_salary || '');
  row['min_education']  = String(ws.min_education || '');
  row['credentials']    = String(ws.credentials || '');
  row['pros']           = String(ws.pros || '');
  row['cons']           = String(ws.cons || '');
  row['personal_fit']   = String(ws.personal_fit || '');
  try {
    lhSession_appendObjectRow_(sheet, row);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function doGet() {
  return lhWebJsonOutput_({
    ok: true,
    service: 'legendary_horizon_codex',
    ts: new Date().toISOString(),
  });
}

function doPost(e) {
  var out = { ok: false };
  try {
    if (!e || !e.postData || !e.postData.contents) {
      out.error = 'empty_body';
      return lhWebJsonOutput_(out);
    }
    var body = JSON.parse(e.postData.contents);
    var spreadsheetId =
      body.spreadsheet_id || PropertiesService.getScriptProperties().getProperty('LH_SPREADSHEET_ID');
    if (!spreadsheetId) {
      out.error = 'missing_spreadsheet_id';
      return lhWebJsonOutput_(out);
    }
    var tabPlayer = body.tab_player_save || null;
    var action = String(body.action || '').toLowerCase();

    if (action === 'manual_save' || action === 'manualsave') {
      var envelope = body.envelope;
      var res = LhSave_manualSaveProgress(spreadsheetId, tabPlayer, envelope);
      if (res.ok) {
        out.ok = true;
        out.revision = res.revision_token;
        out.message = 'Manual save applied to LhPlayerSave.';
        out.row_written = res.row_written;
      } else {
        out.message = 'Save rejected.';
        out.errors = res.errors || (res.error ? [res.error] : ['save_failed']);
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'load_player' || action === 'loadplayer') {
      var playerId = body.player_id;
      if (!playerId) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      var load = LhSave_loadPlayerState(spreadsheetId, tabPlayer, playerId);
      if (!load.ok) {
        out.error = load.error || 'load_failed';
        return lhWebJsonOutput_(out);
      }
      out.ok = true;
      out.player = load.player;
      out.quests = load.quests;
      out.exploration_loop = load.exploration_loop || null;
      out.realm_progress = load.realm_progress || null;
      out.progression_flags = load.progression_flags || { visited_trigger_object_ids: [] };
      return lhWebJsonOutput_(out);
    }

    if (action === 'list_roster' || action === 'listroster') {
      var filters = body.filters && typeof body.filters === 'object' ? body.filters : {};
      var tabRoster = body.tab_roster || null;
      var roster = LhRoster_listRoster(spreadsheetId, tabRoster, filters);
      if (!roster.ok) {
        out.error = roster.error || 'list_roster_failed';
        return lhWebJsonOutput_(out);
      }
      out.ok = true;
      out.roster = roster.roster || [];
      return lhWebJsonOutput_(out);
    }

    if (action === 'list_player_summaries' || action === 'listplayersummaries') {
      var sumFilters = body.filters && typeof body.filters === 'object' ? body.filters : {};
      var sums = LhSave_listPlayerSummaries(spreadsheetId, tabPlayer, sumFilters);
      if (!sums.ok) {
        out.error = sums.error || 'list_player_summaries_failed';
        return lhWebJsonOutput_(out);
      }
      out.ok = true;
      out.players = sums.players || [];
      return lhWebJsonOutput_(out);
    }

    if (action === 'session_end' || action === 'sessionend') {
      var sid = body.player_id;
      if (!sid) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      var summary = body.session_summary && typeof body.session_summary === 'object' ? body.session_summary : {};
      var hist = LhSession_writeSessionHistory(spreadsheetId, sid, summary);
      if (hist.ok) {
        out.ok = true;
        out.message = 'Session history row appended.';
        out.session_id = hist.session_id;
      } else {
        out.ok = false;
        out.message = 'Session history write failed.';
        out.errors = [hist.error || 'session_history_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'mark_exit_ticket' || action === 'markexitticket') {
      var eid = body.player_id;
      var estate = body.exit_ticket_state != null ? String(body.exit_ticket_state) : '';
      if (!eid || !estate) {
        out.error = 'player_id_and_exit_ticket_state_required';
        return lhWebJsonOutput_(out);
      }
      var ew = LhSave_writeExitTicketState(spreadsheetId, tabPlayer, eid, estate);
      if (ew.ok) {
        out.ok = true;
        out.message = 'exit_ticket_state updated.';
      } else {
        out.ok = false;
        out.message = 'exit_ticket_state write failed.';
        out.errors = [ew.error || 'exit_ticket_write_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_unlock_quest' || action === 'teacherunlockquest') {
      var uqPid = body.player_id;
      var uqQid = body.quest_id != null ? String(body.quest_id) : '';
      if (!uqPid || !uqQid) {
        out.error = 'player_id_and_quest_id_required';
        return lhWebJsonOutput_(out);
      }
      var uq = LhTeacher_unlockQuest(spreadsheetId, tabPlayer, uqPid, uqQid);
      if (uq.ok) {
        out.ok = true;
        out.message = 'Quest row unlocked in snapshot.';
      } else {
        out.ok = false;
        out.message = 'teacher_unlock_quest failed.';
        out.errors = [uq.error || 'teacher_unlock_quest_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_restore_backup' || action === 'teacherrestorebackup') {
      var rbPid = body.player_id;
      if (!rbPid) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      var rb = LhTeacher_rollbackCheckpoint(spreadsheetId, tabPlayer, rbPid);
      if (rb.ok) {
        out.ok = true;
        out.message = 'Restored from backup_checkpoint_json.';
        out.restored_from = rb.restored_from;
      } else {
        out.ok = false;
        out.message = 'teacher_restore_backup failed.';
        out.errors = [rb.error || 'teacher_restore_backup_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_restore_item' || action === 'teacherrestoreitem') {
      var riPid = body.player_id;
      var riItem = body.item_id != null ? String(body.item_id) : '';
      var riQty = body.qty != null ? Number(body.qty) : 1;
      var riLabel = body.label != null ? String(body.label) : '';
      if (!riPid || !riItem) {
        out.error = 'player_id_and_item_id_required';
        return lhWebJsonOutput_(out);
      }
      var ri = LhTeacher_restoreItem(spreadsheetId, tabPlayer, riPid, riItem, riQty, riLabel);
      if (ri.ok) {
        out.ok = true;
        out.message = 'Inventory item restored.';
      } else {
        out.ok = false;
        out.message = 'teacher_restore_item failed.';
        out.errors = [ri.error || 'teacher_restore_item_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_reset_act' || action === 'teacherresetact') {
      var raPid = body.player_id;
      var raAct = body.target_act != null ? Number(body.target_act) : 0;
      if (!raPid || !raAct) {
        out.error = 'player_id_and_target_act_required';
        return lhWebJsonOutput_(out);
      }
      var ra = LhTeacher_resetActState(spreadsheetId, tabPlayer, raPid, raAct);
      if (ra.ok) {
        out.ok = true;
        out.message = 'Act marker reset.';
      } else {
        out.ok = false;
        out.message = 'teacher_reset_act failed.';
        out.errors = [ra.error || 'teacher_reset_act_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_set_narrative_force' || action === 'teachersetnarrativeforce') {
      var snfPid = body.player_id;
      if (!snfPid) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      var snfAct = body.target_act != null ? body.target_act : null;
      var snfRealm = body.target_realm != null ? String(body.target_realm) : null;
      var snf = LhTeacher_setNarrativeForce(spreadsheetId, tabPlayer, snfPid, snfAct, snfRealm);
      if (snf.ok) {
        out.ok = true;
        out.message = 'Narrative force override set.';
      } else {
        out.ok = false;
        out.message = 'teacher_set_narrative_force failed.';
        out.errors = [snf.error || 'teacher_set_narrative_force_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'teacher_clear_narrative_force' || action === 'teacherclearnarrativeforce') {
      var cnfPid = body.player_id;
      if (!cnfPid) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      var cnf = LhTeacher_clearNarrativeForce(spreadsheetId, tabPlayer, cnfPid);
      if (cnf.ok) {
        out.ok = true;
        out.message = 'Narrative force override cleared.';
      } else {
        out.ok = false;
        out.message = 'teacher_clear_narrative_force failed.';
        out.errors = [cnf.error || 'teacher_clear_narrative_force_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'gt102_turn' || action === 'trial_of_tongues_turn') {
      var turn = LhInterview_runGt102Turn(body);
      if (turn.ok) {
        out.ok = true;
        out.npc = turn.npc;
        out.reply_text = turn.reply_text;
        out.next = turn.next;
      } else {
        out.ok = false;
        out.message = 'gt102_turn failed.';
        out.errors = [turn.error || 'gt102_turn_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'list_campfire_reflections' || action === 'listcampfirereflections') {
      var lcr = LhSession_listUngradedReflections(spreadsheetId);
      if (!lcr.ok) {
        out.error = lcr.error || 'list_campfire_reflections_failed';
        return lhWebJsonOutput_(out);
      }
      out.ok = true;
      out.reflections = lcr.reflections || [];
      return lhWebJsonOutput_(out);
    }

    if (action === 'grade_campfire' || action === 'gradecampfire') {
      var gcSid = body.session_id;
      var gcScore = body.score;
      var gcComment = body.comment != null ? String(body.comment) : '';
      var gcBy = body.graded_by != null ? String(body.graded_by) : '';
      if (!gcSid || gcScore === undefined || gcScore === null) {
        out.error = 'session_id_and_score_required';
        return lhWebJsonOutput_(out);
      }
      var scoreNum = Number(gcScore);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 5) {
        out.error = 'score_must_be_0_to_5';
        return lhWebJsonOutput_(out);
      }
      var gc = LhSession_gradeCampfireReflection(spreadsheetId, gcSid, {
        score: scoreNum,
        comment: gcComment,
        graded_by: gcBy,
      });
      if (gc.ok) {
        out.ok = true;
        out.message = 'Campfire reflection graded.';
        out.graded_at = gc.graded_at;
      } else {
        out.ok = false;
        out.message = 'grade_campfire failed.';
        out.errors = [gc.error || 'grade_campfire_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    if (action === 'submit_quest_of_fate_worksheet') {
      var qofPlayerId = String(body.player_id || '').trim();
      var qofWs = body.worksheet;
      if (!qofPlayerId) {
        out.error = 'player_id_required';
        return lhWebJsonOutput_(out);
      }
      if (!qofWs || typeof qofWs !== 'object') {
        out.error = 'worksheet_required';
        return lhWebJsonOutput_(out);
      }
      var qofResult = LhQuestOfFate_submitWorksheet(spreadsheetId, qofPlayerId, qofWs);
      if (qofResult.ok) {
        out.ok = true;
        out.message = 'Career worksheet submitted to teacher dashboard.';
      } else {
        out.ok = false;
        out.message = qofResult.error || 'submit_quest_of_fate_worksheet failed.';
        out.errors = [qofResult.error || 'worksheet_write_failed'];
      }
      return lhWebJsonOutput_(out);
    }

    out.error = 'unknown_action';
    return lhWebJsonOutput_(out);
  } catch (err) {
    out.error = String(err);
    return lhWebJsonOutput_(out);
  }
}
// ---- END Codex/apps-script/LhWebApp.js ----

