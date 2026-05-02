/**
 * Web App entry — deploy as "Execute as me" / "Anyone" (or domain) POST handler.
 * Load after all service modules (see apps-script/README.md).
 *
 * Script property `LH_SPREADSHEET_ID` used when request body omits `spreadsheet_id`.
 */

function lhWebJsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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

    out.error = 'unknown_action';
    return lhWebJsonOutput_(out);
  } catch (err) {
    out.error = String(err);
    return lhWebJsonOutput_(out);
  }
}
