/**
 * Legendary Horizon — Teacher Backend
 * Google Apps Script project:
 *   https://script.google.com/home/projects/1iWXX68Bn5JUB_xS0CSvWr6AoOi1uAAJPaHWwXNdz1yK7Jlw-9hkhue0J/edit
 *
 * Deployed Web App URL (execute as: Me, access: Anyone):
 *   https://script.google.com/macros/s/AKfycbxNfR-A5uGGykFEUx21EknmG2ZLzgpgiGac_GbEDBOQ6HD4HtIHNogGyhihJ7P57t8TJg/exec
 *
 * Frontend env var: VITE_LH_TEACHER_APPS_SCRIPT_URL
 *
 * This backend handles teacher-facing student work submissions.
 * Game save/load continues to use the separate game/save backend
 * (VITE_LH_APPS_SCRIPT_WEBAPP_URL).
 *
 * Actions handled:
 *   submit_quest_of_fate_worksheet — appends a row to LhQuestOfFate tab
 *
 * Tab setup (LhQuestOfFate) — create this tab in the spreadsheet with
 * exactly this header row (columns in any order):
 *   submitted_iso | player_id | quest_id | module_id | prophecy_id |
 *   prophecy_title | career_name | career_summary | responsibilities |
 *   work_environment | median_salary | min_education | credentials |
 *   pros | cons | personal_fit
 *
 * Script property (optional — set via Project Settings → Script Properties):
 *   LH_SPREADSHEET_ID — fallback if the frontend doesn't send spreadsheet_id
 */

// ── Schema ──────────────────────────────────────────────────────────────────

var LH_TEACHER_SCHEMA = {
  QUEST_OF_FATE_TAB: 'LhQuestOfFate',
};

// ── Utilities ────────────────────────────────────────────────────────────────

function lhTeacher_webJsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function lhTeacher_sheetTryGet_(spreadsheetId, tabName) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheetByName(tabName) || null;
  } catch (err) {
    Logger.log('lhTeacher_sheetTryGet_ ' + tabName + ': ' + err);
    return null;
  }
}

function lhTeacher_sheetReadHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('Sheet has no header row');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  headers.forEach(function(cell, idx) {
    var key = String(cell).trim();
    if (key) map[key] = idx;
  });
  return map;
}

function lhTeacher_appendObjectRow_(sheet, obj) {
  lhTeacher_sheetReadHeaderMap_(sheet); // validates header exists
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return false;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = [];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    row.push(h && Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : '');
  }
  sheet.appendRow(row);
  return true;
}

// ── Quest of Fate worksheet submission ───────────────────────────────────────

/**
 * Appends a Quest of Fate career worksheet row to LhQuestOfFate tab.
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 */
function LhQuestOfFate_submitWorksheet(spreadsheetId, playerId, worksheet) {
  var sheet = lhTeacher_sheetTryGet_(spreadsheetId, LH_TEACHER_SCHEMA.QUEST_OF_FATE_TAB);
  if (!sheet) {
    return {
      ok: false,
      error: 'LhQuestOfFate tab missing — create the tab with the required header row (see script header for column list).',
    };
  }
  var ws = worksheet || {};
  var row = {};
  row['submitted_iso']    = ws.submitted_at_iso || new Date().toISOString();
  row['player_id']        = String(playerId || '');
  row['quest_id']         = 'mq-203';
  row['module_id']        = 'mod_quest_of_fate_worksheet';
  row['prophecy_id']      = String(ws.prophecy_id    || '');
  row['prophecy_title']   = String(ws.prophecy_title  || '');
  row['career_name']      = String(ws.career_name     || '');
  row['career_summary']   = String(ws.career_summary  || '');
  row['responsibilities'] = String(ws.responsibilities || '');
  row['work_environment'] = String(ws.work_environment || '');
  row['median_salary']    = String(ws.median_salary   || '');
  row['min_education']    = String(ws.min_education   || '');
  row['credentials']      = String(ws.credentials     || '');
  row['pros']             = String(ws.pros             || '');
  row['cons']             = String(ws.cons             || '');
  row['personal_fit']     = String(ws.personal_fit    || '');
  try {
    lhTeacher_appendObjectRow_(sheet, row);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Entry points ─────────────────────────────────────────────────────────────

function doGet() {
  return lhTeacher_webJsonOutput_({
    ok: true,
    service: 'legendary_horizon_teacher_backend',
    version: '1.0.0',
    actions: ['submit_quest_of_fate_worksheet'],
    ts: new Date().toISOString(),
  });
}

function doPost(e) {
  var out = { ok: false };
  try {
    if (!e || !e.postData || !e.postData.contents) {
      out.error = 'empty_body';
      return lhTeacher_webJsonOutput_(out);
    }
    var body = JSON.parse(e.postData.contents);
    var spreadsheetId =
      body.spreadsheet_id ||
      PropertiesService.getScriptProperties().getProperty('LH_SPREADSHEET_ID');
    if (!spreadsheetId) {
      out.error = 'missing_spreadsheet_id';
      return lhTeacher_webJsonOutput_(out);
    }
    var action = String(body.action || '').trim();

    if (action === 'submit_quest_of_fate_worksheet') {
      var playerId = String(body.player_id || '').trim();
      var ws = body.worksheet;
      if (!playerId) {
        out.error = 'player_id_required';
        return lhTeacher_webJsonOutput_(out);
      }
      if (!ws || typeof ws !== 'object') {
        out.error = 'worksheet_required';
        return lhTeacher_webJsonOutput_(out);
      }
      var result = LhQuestOfFate_submitWorksheet(spreadsheetId, playerId, ws);
      if (result.ok) {
        out.ok = true;
        out.message = 'Career worksheet submitted to teacher dashboard.';
      } else {
        out.ok = false;
        out.message = result.error || 'submit_quest_of_fate_worksheet failed.';
        out.errors = [result.error || 'worksheet_write_failed'];
      }
      return lhTeacher_webJsonOutput_(out);
    }

    out.error = 'unknown_action';
    return lhTeacher_webJsonOutput_(out);
  } catch (err) {
    out.error = String(err);
    return lhTeacher_webJsonOutput_(out);
  }
}
