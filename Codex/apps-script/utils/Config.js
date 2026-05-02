/**
 * Centralized configuration accessors (spreadsheet IDs, deployment flags).
 * Populate via Script Properties rather than literals before production rollout.
 */

function lhSpreadsheetId_() {
  return PropertiesService.getScriptProperties().getProperty('LH_SPREADSHEET_ID') || '';
}
