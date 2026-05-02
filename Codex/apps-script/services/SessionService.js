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
  lhSession_appendObjectRow_(sheet, row);
  return { ok: true, session_id: sessionId };
}

function createSessionHints_(teacherContext) {
  return { roster_scope: (teacherContext && teacherContext.roster_scope) || 'unknown' };
}

function touchSessionHeartbeat_(sessionToken) {
  return { ok: true, sessionToken: sessionToken };
}
