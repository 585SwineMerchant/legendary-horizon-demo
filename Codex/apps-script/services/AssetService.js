/**
 * AssetService — loads authoritative media rows keyed by `asset_id`.
 * Day 2 scaffolding keeps sheet IO optional — fall back to static catalog when tab absent.
 */

/**
 * Finds a catalog row keyed by asset_id inside `LH_SCHEMA.MEDIA_ASSET_TAB`.
 *
 * @param {string} spreadsheetId
 * @param {string} asset_id
 */
function LhAsset_getRecord(spreadsheetId, asset_id) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);

    var idCol = headerMap['asset_id'];
    if (idCol === undefined) {
      throw new Error('asset_id column missing — align Media workbook');
    }
    var rowIndex = lhSheetFindRowIndex_(rows, idCol, asset_id);
    if (rowIndex === -1) {
      return { ok: false, error: 'asset_not_found' };
    }

    var record = {};
    var headerRow = rows[0];
    for (var c = 0; c < headerRow.length; c++) {
      var header = String(headerRow[c]).trim();
      if (!header) continue;
      record[header] = rows[rowIndex][c];
    }

    return { ok: true, record: record };
  } catch (err) {
    Logger.log('LhAsset_getRecord failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
