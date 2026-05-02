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
 * Data for `mailto:` or GmailApp — district policy still applies before student use.
 */
function LhExitTicket_buildPrefilledEmailDraftPayload(studentProfile, manualSaveEnvelope) {
  var to = (studentProfile && studentProfile.teacher_email) || '';
  var subj =
    '[Legendary Horizon] Exit ticket — ' +
    ((manualSaveEnvelope && manualSaveEnvelope.player_snapshot && manualSaveEnvelope.player_snapshot.display_name) || 'Traveler');
  var body =
    LhExitTicket_buildPromptForCurrentState(
      manualSaveEnvelope && manualSaveEnvelope.player_snapshot,
      manualSaveEnvelope && manualSaveEnvelope.quests_snapshot,
    ) + '\n\n---\nSave revision: ' + ((manualSaveEnvelope && manualSaveEnvelope.saved_at_iso) || '');
  return { to: to, subject: subj, body: body, mime_mode: 'plain' };
}

/**
 * Persists workflow state on the player row (`exit_ticket_state` column).
 */
function LhExitTicket_markExitTicketState(spreadsheetId, tabOverride, playerId, state) {
  return LhSave_writeExitTicketState(spreadsheetId, tabOverride, playerId, state);
}

/**
 * Day 2: mock compose — replace with GmailApp templating + district policy checks.
 */
function LhExitTicket_queueMockDraft(studentProfile, manualSaveEnvelope) {
  var payload = LhExitTicket_buildPrefilledEmailDraftPayload(studentProfile, manualSaveEnvelope);
  Logger.log('LhExitTicket_queueMockDraft placeholder payload keys: ' + Object.keys(payload).join(','));
  return {
    queued: true,
    mode: 'mock',
    note: 'Wire GmailApp once manual saves hit production Sheets rows.',
    echo_profile: studentProfile,
    echo_envelope_schema: manualSaveEnvelope && manualSaveEnvelope.schema_version,
    draft: payload,
  };
}
