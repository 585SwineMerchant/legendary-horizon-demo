/**
 * SaveService — first-pass Google Sheets persistence for manual saves.
 * Pair with `ManualSaveEnvelopeV1` JSON emitted by the SPA (`services/manualSaveGateway.ts`).
 */

/**
 * Reads a player row keyed by `player_id`.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {string} playerId
 * @returns {{ ok: boolean, row_index?: number, record?: object, error?: string }}
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
 * Writes the Day 2 manual-save envelope back to the matching row.
 * Inventory + quest snapshots are JSON-stringified into helper columns if present.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {object} envelope ManualSaveEnvelopeV1
 */
function LhSave_applyManualSaveEnvelope(spreadsheetId, tabNameOverride, envelope) {
  try {
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

    var targetRow = rowIndex + 1; // 1-based sheet row
    var ps = envelope.player_snapshot;

    function writeField(headerKey, value) {
      var colIdx = headerMap[headerKey];
      if (colIdx === undefined) {
        Logger.log('Skipping missing column ' + headerKey);
        return;
      }
      sheet.getRange(targetRow, colIdx + 1).setValue(value);
    }

    writeField(LH_PLAYER_SAVE_HEADERS.display_name, ps.display_name);
    writeField(LH_PLAYER_SAVE_HEADERS.roster_email_hint, ps.roster_email_hint || '');
    writeField(LH_PLAYER_SAVE_HEADERS.email_hash, ps.email_hash || '');
    writeField(LH_PLAYER_SAVE_HEADERS.current_act, ps.current_act);
    writeField(LH_PLAYER_SAVE_HEADERS.current_realm_id, ps.current_realm_id);
    writeField(LH_PLAYER_SAVE_HEADERS.required_next_action, ps.required_next_action);
    writeField(LH_PLAYER_SAVE_HEADERS.active_main_quest_id, ps.active_main_quest_id);
    writeField(LH_PLAYER_SAVE_HEADERS.active_main_quest_title, ps.active_main_quest_title);
    writeField(LH_PLAYER_SAVE_HEADERS.last_completed_event_id, ps.last_completed_event_id);
    writeField(LH_PLAYER_SAVE_HEADERS.last_completed_summary, ps.last_completed_summary);
    writeField(LH_PLAYER_SAVE_HEADERS.xp_total, ps.xp_total);
    writeField(LH_PLAYER_SAVE_HEADERS.level_cached, ps.level_cached);
    writeField(LH_PLAYER_SAVE_HEADERS.inventory_summary_json, JSON.stringify(ps.inventory_summary || {}));

    writeField(LH_PLAYER_SAVE_HEADERS.revision_token, ps.revision_token || Utilities.getUuid());
    writeField(LH_PLAYER_SAVE_HEADERS.last_manual_save_iso, envelope.saved_at_iso);

    /** Optional auditing columns could log JSON blobs for quests + triggers — trimmed for MVP. */

    SpreadsheetApp.flush();
    return { ok: true, row_written: targetRow };
  } catch (err) {
    Logger.log('LhSave_applyManualSaveEnvelope failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
