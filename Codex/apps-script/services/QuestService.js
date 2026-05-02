/**
 * QuestService — quest progression read/write keyed by quest_id / act gating rules.
 */

/**
 * Merge quest delta into persistent quest ledger (spreadsheet-backed).
 * @returns {{ ok: boolean, error?: string }}
 */
function upsertQuestState_(playerId, questDeltaArray) {
  Logger.log('QuestService.upsertQuestState_ placeholder');
  return { ok: true };
}

/**
 * @returns {object[]} Quest rows mirrored from Sheets staging area.
 */
function listActiveQuestsForPlayer_(playerId) {
  return [];
}
