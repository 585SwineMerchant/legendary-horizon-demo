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

    var resolvedPlayerId = String(playerIdCell);

    // Sync classroom_email onto the player save row so the teacher dashboard always has
    // the teacher email visible without parsing JSON blobs.
    var teacherEmailIdx = headerMap[LH_ROSTER_HEADERS.teacher_email];
    if (teacherEmailIdx !== undefined) {
      var teacherEmail = String(rows[rowMatch][teacherEmailIdx] || '');
      if (teacherEmail) {
        LhSave_syncClassroomEmail(spreadsheetId, null, resolvedPlayerId, teacherEmail);
      }
    }

    return { ok: true, player_id: resolvedPlayerId, roster_row: rowMatch + 1 };
  } catch (err) {
    Logger.log('LhRoster_resolvePlayerId failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Lists roster rows (optionally filtered by section_code / teacher_email).
 *
 * Returns only known schema columns (tolerates missing columns).
 *
 * @param {string} spreadsheetId
 * @param {string | null} tabNameOverride
 * @param {{ section_code?: string, teacher_email?: string, limit?: number }} filters
 * @returns {{ ok: boolean, roster?: object[], error?: string }}
 */
function LhRoster_listRoster(spreadsheetId, tabNameOverride, filters) {
  try {
    var tab = tabNameOverride || LH_SCHEMA.ROSTER_TAB;
    var sheet = lhSheetGetOrThrow_(spreadsheetId, tab);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    if (!rows || rows.length < 2) {
      return { ok: true, roster: [] };
    }

    var limit = filters && filters.limit ? Number(filters.limit) : 500;
    if (!limit || limit < 1) limit = 500;
    if (limit > 2000) limit = 2000;

    var wantSection = filters && filters.section_code ? String(filters.section_code) : '';
    var wantTeacher = filters && filters.teacher_email ? String(filters.teacher_email).trim().toLowerCase() : '';

    var idxEmail = headerMap[LH_ROSTER_HEADERS.student_email];
    var idxStudentId = headerMap[LH_ROSTER_HEADERS.student_id];
    var idxDisplay = headerMap[LH_ROSTER_HEADERS.player_display_name];
    var idxTeacher = headerMap[LH_ROSTER_HEADERS.teacher_email];
    var idxCourse = headerMap[LH_ROSTER_HEADERS.course];
    var idxSection = headerMap[LH_ROSTER_HEADERS.class_section];
    var idxSectionCode = headerMap[LH_ROSTER_HEADERS.section_code];
    var idxPlayerId = headerMap[LH_ROSTER_HEADERS.player_id];

    var out = [];
    for (var r = 1; r < rows.length; r++) {
      if (out.length >= limit) break;
      var row = rows[r] || [];

      var sectionCode = idxSectionCode !== undefined ? String(row[idxSectionCode] || '') : '';
      var teacherEmail =
        idxTeacher !== undefined ? String(row[idxTeacher] || '').trim().toLowerCase() : '';

      if (wantSection && sectionCode !== wantSection) continue;
      if (wantTeacher && teacherEmail !== wantTeacher) continue;

      out.push({
        student_email: idxEmail !== undefined ? String(row[idxEmail] || '') : '',
        student_id: idxStudentId !== undefined ? String(row[idxStudentId] || '') : '',
        player_display_name: idxDisplay !== undefined ? String(row[idxDisplay] || '') : '',
        teacher_email: teacherEmail,
        course: idxCourse !== undefined ? String(row[idxCourse] || '') : '',
        class_section: idxSection !== undefined ? String(row[idxSection] || '') : '',
        section_code: sectionCode,
        player_id: idxPlayerId !== undefined ? String(row[idxPlayerId] || '') : '',
        roster_row: r + 1,
      });
    }

    return { ok: true, roster: out };
  } catch (err) {
    Logger.log('LhRoster_listRoster failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
