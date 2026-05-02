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
