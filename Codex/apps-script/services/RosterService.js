/**
 * Roster identity resolution — correlates Classroom users with canonical `player_id`s.
 */

/**
 * @typedef {{student_email?: string, student_id?: string}} IdentityHint
 */

/**
 * Maps educator roster rows to canonical save keys.
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {IdentityHint} identity
 * @returns {{ ok: boolean, player_id?: string, roster_row?: number, error?: string }}
 */
function LhRoster_resolvePlayerId(spreadsheetId, tabNameOverride, identity) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.ROSTER_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);

    var emailIdx = headerMap[LH_ROSTER_HEADERS.student_email];
    var legacyIdIdx = headerMap[LH_ROSTER_HEADERS.student_id];
    var mappedPlayerIdx = headerMap[LH_ROSTER_HEADERS.player_id];

    var rowMatch = -1;
    if (identity.student_email && emailIdx !== undefined) {
      rowMatch = lhSheetFindRowIndex_(rows, emailIdx, identity.student_email.trim().toLowerCase());
      if (rowMatch === -1) {
        // Case-insensitive search fallback — Sheets may already normalise casing.
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][emailIdx]).trim().toLowerCase() === identity.student_email.trim().toLowerCase()) {
            rowMatch = i;
            break;
          }
        }
      }
    }
    if (rowMatch === -1 && identity.student_id && legacyIdIdx !== undefined) {
      rowMatch = lhSheetFindRowIndex_(rows, legacyIdIdx, identity.student_id);
    }

    if (rowMatch === -1) {
      return { ok: false, error: 'roster_miss' };
    }

    if (mappedPlayerIdx === undefined) {
      return { ok: false, error: 'roster_missing_player_id_column' };
    }

    var playerIdCell = rows[rowMatch][mappedPlayerIdx];
    if (!playerIdCell) {
      return { ok: false, error: 'roster_missing_bound_player_id' };
    }

    return { ok: true, player_id: String(playerIdCell), roster_row: rowMatch + 1 };
  } catch (err) {
    Logger.log('LhRoster_resolvePlayerId failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
