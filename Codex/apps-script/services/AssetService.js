/**
 * AssetService — Milestone 3 media lookup + realm/NPC filtered bundles.
 */

/**
 * Finds a catalog row keyed by asset_id inside `LH_SCHEMA.MEDIA_ASSET_TAB`.
 */
function LhAsset_getRecord(spreadsheetId, asset_id) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);

    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
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

/**
 * @returns {{ ok: boolean, assets?: object[], error?: string }}
 */
function LhAsset_getRealmAssets(spreadsheetId, realmId) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
    var tagCol = headerMap[LH_MEDIA_HEADERS.realm_tags_csv];
    if (idCol === undefined) {
      return { ok: false, error: 'asset_id_column_missing' };
    }
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var aid = rows[i][idCol];
      if (!aid) continue;
      var tags = tagCol !== undefined ? String(rows[i][tagCol] || '') : '';
      var tokens = tags
        .split(',')
        .map(function (t) {
          return t.trim();
        })
        .filter(function (t) {
          return t.length > 0;
        });
      var include = !realmId || tokens.length === 0 || tokens.indexOf(realmId) !== -1;
      if (!include) {
        continue;
      }
      var rec = {};
      var headerRow = rows[0];
      for (var c = 0; c < headerRow.length; c++) {
        var header = String(headerRow[c]).trim();
        if (!header) continue;
        rec[header] = rows[i][c];
      }
      out.push(rec);
    }
    return { ok: true, assets: out };
  } catch (err) {
    Logger.log('LhAsset_getRealmAssets failure: ' + err);
    return { ok: false, error: String(err) };
  }
}

/**
 * @returns {{ ok: boolean, assets?: object[], error?: string }}
 */
function LhAsset_getNpcAssets(spreadsheetId, npcId) {
  try {
    var sheet = lhSheetGetOrThrow_(spreadsheetId, LH_SCHEMA.MEDIA_ASSET_TAB);
    var headerMap = lhSheetReadHeaderMap_(sheet);
    var rows = lhSheetReadTable_(sheet);
    var idCol = headerMap[LH_MEDIA_HEADERS.asset_id];
    var npcCol = headerMap[LH_MEDIA_HEADERS.npc_id];
    if (idCol === undefined) {
      return { ok: false, error: 'asset_id_column_missing' };
    }
    if (npcCol === undefined) {
      return { ok: true, assets: [] };
    }
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][npcCol] || '') !== String(npcId || '')) {
        continue;
      }
      var rec = {};
      var headerRow = rows[0];
      for (var c = 0; c < headerRow.length; c++) {
        var header = String(headerRow[c]).trim();
        if (!header) continue;
        rec[header] = rows[i][c];
      }
      out.push(rec);
    }
    return { ok: true, assets: out };
  } catch (err) {
    Logger.log('LhAsset_getNpcAssets failure: ' + err);
    return { ok: false, error: String(err) };
  }
}
