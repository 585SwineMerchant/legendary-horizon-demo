/**
 * LookupService — Milestone 3 ID registries for validation (optional Sheets tabs).
 */

function lhLookup_columnValues_(spreadsheetId, tabName, headerKey, headerConstMap) {
  var sheet = lhSheetTryGet_(spreadsheetId, tabName);
  if (!sheet) {
    return [];
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var col = headerMap[headerConstMap[headerKey]];
  if (col === undefined) {
    return [];
  }
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var v = rows[i][col];
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      out.push(String(v).trim());
    }
  }
  return out;
}

function LhLookup_listValidQuestIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.QUEST_DEFINITION_TAB, 'quest_id', LH_QUEST_DEF_HEADERS);
}

function LhLookup_listRealmIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.REALM_DEFINITION_TAB, 'realm_id', LH_REALM_DEF_HEADERS);
}

function LhLookup_listItemIds(spreadsheetId) {
  return lhLookup_columnValues_(spreadsheetId, LH_SCHEMA.ITEM_DEFINITION_TAB, 'item_id', LH_ITEM_DEF_HEADERS);
}

/**
 * @param {string} key — `quest_tier` | `quest_status` | `exit_ticket_state`
 */
function LhLookup_listEnumValues(key) {
  var map = {
    quest_tier: ['main', 'side', 'guild'],
    quest_status: ['active', 'available', 'locked', 'completed', 'turned_in'],
    exit_ticket_state: ['none', 'draft_ready', 'sent', 'skipped'],
  };
  return map[key] ? map[key].slice() : [];
}
