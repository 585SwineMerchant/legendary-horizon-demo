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

    if (action === 'ping') {
      out.ok = true;
      out.pong = true;
      out.backend = 'game';
      out.ts = new Date().toISOString();
      return lhWebJsonOutput_(out);
    }

    out.error = 'unknown_action';
    return lhWebJsonOutput_(out);
  } catch (err) {
    out.error = String(err);
    return lhWebJsonOutput_(out);
  }
}
