/**
 * Generic sheet helpers — stay tiny & defensive for classroom reliability.
 */

function lhSheetGetOrThrow_(spreadsheetId, tabName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    throw new Error('Missing tab "' + tabName + '" in spreadsheet ' + spreadsheetId);
  }
  return sheet;
}

function lhSheetReadHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    throw new Error('Sheet has no header row');
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  headers.forEach(function (cell, idx) {
    var key = String(cell).trim();
    if (key) {
      map[key] = idx;
    }
  });
  return map;
}

function lhSheetReadTable_(sheet) {
  var range = sheet.getDataRange();
  return range.getValues();
}

function lhSheetFindRowIndex_(rows, columnIndex, needle) {
  var target = String(needle);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][columnIndex]) === target) {
      return i;
    }
  }
  return -1;
}
