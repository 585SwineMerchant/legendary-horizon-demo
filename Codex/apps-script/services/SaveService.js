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
 * Demo/classroom bootstrap gate — decides whether a missing `LhPlayerSave` row may be
 * auto-created instead of rejected with `player_not_found`.
 *
 * Controlled ONLY by Script Properties (Apps Script → Project Settings → Script Properties),
 * never by request payload, so production validation cannot be weakened by a client.
 *
 *  - `LH_DEMO_BOOTSTRAP_PLAYER_IDS` — comma-separated exact allowlist, e.g.
 *      `stu_0417_kevin_demo,stu_other_demo`
 *  - `LH_ALLOW_DEMO_BOOTSTRAP` — set to the string `'true'` to allow ANY player_id that
 *      matches the demo pattern below (broader opt-in, useful for whole-classroom demo days).
 *
 * Demo pattern (must match BOTH to qualify under the broad opt-in):
 *  - starts with `stu_` (the demo/classroom player_id prefix used by the SPA), AND
 *  - contains `_demo` anywhere in the id (e.g. `stu_0417_kevin_demo`).
 * This matches the confirmed real-world id `stu_0417_kevin_demo` while still excluding
 * ordinary roster-issued ids like `stu_0417_kevin` that lack the `_demo` marker.
 *
 * If neither script property is set, this always returns false — unchanged production behavior.
 *
 * @param {string} playerId
 * @returns {boolean}
 */
function LhSave_isDemoBootstrapEligible_(playerId) {
  var pid = String(playerId || '');
  if (!pid) return false;
  var props = PropertiesService.getScriptProperties();
  var allowlistRaw = props.getProperty('LH_DEMO_BOOTSTRAP_PLAYER_IDS') || '';
  var allowlist = allowlistRaw
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return !!s; });
  if (allowlist.indexOf(pid) !== -1) {
    Logger.log('LhSave_isDemoBootstrapEligible_: ' + pid + ' matched LH_DEMO_BOOTSTRAP_PLAYER_IDS allowlist.');
    return true;
  }
  var broadFlag = props.getProperty('LH_ALLOW_DEMO_BOOTSTRAP') === 'true';
  if (broadFlag && pid.indexOf('stu_') === 0 && pid.indexOf('_demo') !== -1) {
    Logger.log('LhSave_isDemoBootstrapEligible_: ' + pid + ' matched broad demo pattern under LH_ALLOW_DEMO_BOOTSTRAP=true.');
    return true;
  }
  return false;
}

/**
 * Appends a brand-new `LhPlayerSave` row seeded from an incoming `player_snapshot`, but ONLY
 * when the caller has already confirmed bootstrap eligibility via `LhSave_isDemoBootstrapEligible_`.
 * Reuses the same header-aware write path as normal saves (`lhSave_writePlayerSnapshot_`) so the
 * new row's shape always matches `LH_PLAYER_SAVE_HEADERS`.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {object} playerSnapshot — `envelope.player_snapshot` shape (see `LhSave_validatePlayerSnapshot_`)
 * @returns {{ ok: boolean, row_written?: number, error?: string }}
 */
function LhSave_ensurePlayerRow_(spreadsheetId, tabNameOverride, playerSnapshot) {
  try {
    var pid = playerSnapshot && playerSnapshot.player_id;
    if (!pid) {
      return { ok: false, error: 'player_id_required' };
    }
    var tab = tabNameOverride || LH_SCHEMA.PLAYER_SAVE_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    // Re-check immediately before append in case another request created the row concurrently.
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    if (idCol === undefined) {
      return { ok: false, error: 'player_id_column_missing' };
    }
    var existingIndex = lhSheetFindRowIndex_(rows, idCol, pid);
    if (existingIndex !== -1) {
      Logger.log('LhSave_ensurePlayerRow_: row for ' + pid + ' appeared concurrently at row ' + (existingIndex + 1) + '; skipping append.');
      return { ok: true, row_written: existingIndex + 1 };
    }
    var lastCol = sheet.getLastColumn();
    var blankRow = new Array(lastCol).fill('');
    sheet.appendRow(blankRow);
    var targetRow = sheet.getLastRow();
    // Seed the bare minimum so the row is identifiable even if writePlayerSnapshot_ below
    // skips a field (defensive — keeps the row from being orphaned/un-findable).
    lhSave_writeFieldIfPresent_(sheet, headerMap, targetRow, LH_PLAYER_SAVE_HEADERS.player_id, pid);
    var seedSnapshot = {
      display_name: playerSnapshot.display_name || pid,
      roster_email_hint: playerSnapshot.roster_email_hint || '',
      email_hash: playerSnapshot.email_hash || '',
      current_act: Number(playerSnapshot.current_act) || 1,
      current_realm_id: playerSnapshot.current_realm_id || '',
      required_next_action: playerSnapshot.required_next_action || '',
      active_main_quest_id: playerSnapshot.active_main_quest_id || '',
      active_main_quest_title: playerSnapshot.active_main_quest_title || '',
      last_completed_event_id: playerSnapshot.last_completed_event_id || '',
      last_completed_summary: playerSnapshot.last_completed_summary || '',
      xp_total: Number(playerSnapshot.xp_total) || 0,
      level_cached: Number(playerSnapshot.level_cached) || 1,
      inventory_summary: playerSnapshot.inventory_summary || { coins: 0, items: [] },
      revision_token: playerSnapshot.revision_token || '',
      last_manual_save_iso: '',
    };
    lhSave_writePlayerSnapshot_(sheet, headerMap, targetRow, seedSnapshot, {});
    SpreadsheetApp.flush();
    Logger.log('LhSave_ensurePlayerRow_: bootstrapped new LhPlayerSave row for ' + pid + ' at row ' + targetRow + ' in tab "' + tab + '".');
    return { ok: true, row_written: targetRow };
  } catch (err) {
    Logger.log('LhSave_ensurePlayerRow_ failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Normalized load for gameplay + services.
 * @returns {{ ok: boolean, player?: object, quests?: object[], raw_record?: object, error?: string }}
 */
function LhSave_loadPlayerState(spreadsheetId, tabNameOverride, playerId) {
  var read = LhSave_readPlayerSave(spreadsheetId, tabNameOverride, playerId);
  if (!read.ok && read.error === 'player_not_found' && LhSave_isDemoBootstrapEligible_(playerId)) {
    Logger.log('LhSave_loadPlayerState: ' + playerId + ' not found but bootstrap-eligible; creating row before load.');
    var bootstrap = LhSave_ensurePlayerRow_(spreadsheetId, tabNameOverride, { player_id: playerId });
    if (!bootstrap.ok) {
      Logger.log('LhSave_loadPlayerState: bootstrap failed for ' + playerId + ': ' + bootstrap.error);
      return read;
    }
    read = LhSave_readPlayerSave(spreadsheetId, tabNameOverride, playerId);
  }
  if (!read.ok) {
    Logger.log('LhSave_loadPlayerState: rejecting ' + playerId + ' — ' + read.error);
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
  var pid = envelope.player_snapshot.player_id;
  Logger.log('LhSave_manualSaveProgress: incoming save for player_id=' + pid + ', searching tab "' + tab + '".');
  var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var idCol = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
  var rowIndex = lhSheetFindRowIndex_(rows, idCol, pid);
  if (rowIndex === -1) {
    Logger.log('LhSave_manualSaveProgress: player_id=' + pid + ' not found in tab "' + tab + '".');
    if (LhSave_isDemoBootstrapEligible_(pid)) {
      Logger.log('LhSave_manualSaveProgress: player_id=' + pid + ' is bootstrap-eligible; creating row.');
      var bootstrap = LhSave_ensurePlayerRow_(spreadsheetId, tabNameOverride, envelope.player_snapshot);
      if (!bootstrap.ok) {
        Logger.log('LhSave_manualSaveProgress: bootstrap failed for ' + pid + ' — ' + bootstrap.error);
        return { ok: false, error: 'player_not_found' };
      }
      Logger.log('LhSave_manualSaveProgress: bootstrap succeeded for ' + pid + ' at row ' + bootstrap.row_written + '; re-reading table.');
      rows = lhSheetReadTable_(sheet);
      rowIndex = lhSheetFindRowIndex_(rows, idCol, pid);
      if (rowIndex === -1) {
        Logger.log('LhSave_manualSaveProgress: row for ' + pid + ' still missing after bootstrap — aborting.');
        return { ok: false, error: 'player_not_found' };
      }
    } else {
      Logger.log('LhSave_manualSaveProgress: rejecting ' + pid + ' — player_not_found (not bootstrap-eligible).');
      return { ok: false, error: 'player_not_found' };
    }
  } else {
    Logger.log('LhSave_manualSaveProgress: player_id=' + pid + ' found at row ' + (rowIndex + 1) + '.');
  }
  var targetRow = rowIndex + 1;
  Logger.log('LhSave_manualSaveProgress: writing save for ' + pid + ' to row ' + targetRow + '.');
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
    Logger.log('LhSave_readPlayerSave: searching tab "' + tab + '" for player_id=' + playerId);
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var colIndex = headerMap[LH_PLAYER_SAVE_HEADERS.player_id];
    if (colIndex === undefined) {
      throw new Error('player_id column missing — align sheet to LhSheetSchema');
    }
    var rowIndex = lhSheetFindRowIndex_(rows, colIndex, playerId);
    if (rowIndex === -1) {
      Logger.log('LhSave_readPlayerSave: player_id=' + playerId + ' NOT FOUND in tab "' + tab + '".');
      return { ok: false, error: 'player_not_found' };
    }
    Logger.log('LhSave_readPlayerSave: player_id=' + playerId + ' found at row ' + (rowIndex + 1) + ' in tab "' + tab + '".');

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
