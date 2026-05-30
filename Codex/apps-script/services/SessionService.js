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
 */
function LhSession_writeSessionHistory(spreadsheetId, playerId, summaryObj) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.SESSION_HISTORY_TAB);
  if (!sheet) {
    return { ok: false, error: 'session_tab_missing' };
  }
  var sessionId = Utilities.getUuid();
  var iso = new Date().toISOString();
  var row = {};
  row[LH_SESSION_HISTORY_HEADERS.session_id] = sessionId;
  row[LH_SESSION_HISTORY_HEADERS.player_id] = playerId;
  row[LH_SESSION_HISTORY_HEADERS.began_iso] = iso;
  row[LH_SESSION_HISTORY_HEADERS.ended_iso] = iso;
  row[LH_SESSION_HISTORY_HEADERS.summary_json] = JSON.stringify(summaryObj || {});
  row[LH_SESSION_HISTORY_HEADERS.device_hint] = 'writeSessionHistory';
  row[LH_SESSION_HISTORY_HEADERS.campfire_log_entry] =
    (summaryObj && typeof summaryObj.exit_ticket_body === 'string')
      ? summaryObj.exit_ticket_body
      : '';
  row[LH_SESSION_HISTORY_HEADERS.player_display_name] =
    (summaryObj && typeof summaryObj.player_display_name === 'string')
      ? summaryObj.player_display_name
      : '';
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

  // Propagate score to player save so Rested Readiness fires next session.
  var pidIdx = headerMap[LH_SESSION_HISTORY_HEADERS.player_id];
  var playerId = pidIdx !== undefined ? String(rows[rowIndex][pidIdx] || '') : '';
  if (playerId) {
    LhSession_updatePlayerLastCampfireScore(spreadsheetId, playerId, score);
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

function createSessionHints_(teacherContext) {
  return { roster_scope: (teacherContext && teacherContext.roster_scope) || 'unknown' };
}

function touchSessionHeartbeat_(sessionToken) {
  return { ok: true, sessionToken: sessionToken };
}
