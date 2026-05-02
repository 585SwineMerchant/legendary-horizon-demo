/**
 * QuestService — Milestone 3 quest reads + snapshot mutations on player rows.
 */

function lhQuest_readDefinitionsTable_(spreadsheetId) {
  var sheet = lhSheetTryGet_(spreadsheetId, LH_SCHEMA.QUEST_DEFINITION_TAB);
  if (!sheet) {
    return { ok: false, error: 'quest_definitions_tab_missing', rows: [] };
  }
  var headerMap = lhSheetReadHeaderMap_(sheet);
  var rows = lhSheetReadTable_(sheet);
  var out = [];
  var idCol = headerMap[LH_QUEST_DEF_HEADERS.quest_id];
  if (idCol === undefined) {
    return { ok: false, error: 'quest_id_column_missing', rows: [] };
  }
  for (var i = 1; i < rows.length; i++) {
    var qid = rows[i][idCol];
    if (!qid) continue;
    var realmRaw = '';
    var realmCol = headerMap[LH_QUEST_DEF_HEADERS.realm_ids_json];
    if (realmCol !== undefined) {
      realmRaw = rows[i][realmCol];
    }
    var realmIds = [];
    if (realmRaw) {
      realmIds = lhQuest_parseJson_(realmRaw, []);
      if (!Array.isArray(realmIds)) {
        realmIds = [];
      }
    }
    out.push({
      quest_id: String(qid),
      title: String(headerMap[LH_QUEST_DEF_HEADERS.title] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.title]] : ''),
      tier: String(headerMap[LH_QUEST_DEF_HEADERS.tier] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.tier]] : 'main'),
      act: Number(headerMap[LH_QUEST_DEF_HEADERS.act] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.act]] : 1) || 1,
      status: String(headerMap[LH_QUEST_DEF_HEADERS.status] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.status]] : 'available'),
      objective_short: String(
        headerMap[LH_QUEST_DEF_HEADERS.objective_short] !== undefined ? rows[i][headerMap[LH_QUEST_DEF_HEADERS.objective_short]] : '',
      ),
      realm_ids: realmIds,
    });
  }
  return { ok: true, rows: out };
}

function lhQuest_parseJson_(raw, fb) {
  if (!raw) return fb;
  try {
    return JSON.parse(String(raw));
  } catch (e) {
    return fb;
  }
}

function lhQuest_ensureQuestsArray_(spreadsheetId, tabOverride, playerId, fallbackDefinitions) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var fb = fallbackDefinitions || [];
  var quests = load.quests && load.quests.length ? load.quests : fb;
  if (!quests || !quests.length) {
    quests = [];
  }
  return { ok: true, player: load.player, quests: quests };
}

/**
 * @returns {{ ok: boolean, quest?: object, error?: string }}
 */
function LhQuest_getQuestById(spreadsheetId, questId) {
  var tbl = lhQuest_readDefinitionsTable_(spreadsheetId);
  if (!tbl.ok) {
    return { ok: false, error: tbl.error };
  }
  if (!tbl.rows.length) {
    return { ok: false, error: 'no_quest_rows' };
  }
  for (var i = 0; i < tbl.rows.length; i++) {
    if (tbl.rows[i].quest_id === questId) {
      return { ok: true, quest: tbl.rows[i] };
    }
  }
  return { ok: false, error: 'quest_not_found' };
}

/**
 * @returns {{ ok: boolean, quests?: object[], player?: object, error?: string }}
 */
function LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId) {
  var defs = lhQuest_readDefinitionsTable_(spreadsheetId);
  var fallback = defs.ok ? defs.rows : [];
  return lhQuest_ensureQuestsArray_(spreadsheetId, tabOverride, playerId, fallback);
}

/**
 * Marks a quest step complete (updates `quests_snapshot_json` + player headline fields when main quest completes).
 * @param {object} args { quest_id, next_player_fields?: object }
 */
function LhQuest_completeQuestStep(spreadsheetId, tabOverride, playerId, args) {
  if (!args || !args.quest_id) {
    return { ok: false, error: 'quest_id_required' };
  }
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var found = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].quest_id === args.quest_id) {
      quests[i].status = 'completed';
      found = true;
      break;
    }
  }
  if (!found) {
    return { ok: false, error: 'quest_not_in_snapshot' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  if (args.next_player_fields && typeof args.next_player_fields === 'object') {
    Object.keys(args.next_player_fields).forEach(function (k) {
      player[k] = args.next_player_fields[k];
    });
  }
  var patchErr = LhSave_validatePlayerSnapshot_(player);
  if (patchErr.length) {
    return { ok: false, errors: patchErr };
  }
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Sets first `locked` quest in same act as `available` (MVP unlock rule).
 */
function LhQuest_unlockNextQuest(spreadsheetId, tabOverride, playerId, realmIdHint) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var playerAct = st.player.current_act;
  var unlocked = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].status === 'locked' && Number(quests[i].act) === Number(playerAct)) {
      if (!realmIdHint || !quests[i].realm_ids || !quests[i].realm_ids.length || quests[i].realm_ids.indexOf(realmIdHint) !== -1) {
        quests[i].status = 'available';
        unlocked = true;
        break;
      }
    }
  }
  if (!unlocked) {
    return { ok: false, error: 'no_locked_quest_to_unlock' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Plain-language instruction for HUD / resume (quest data + player row).
 */
function LhQuest_generateCurrentRequiredNextAction(spreadsheetId, tabOverride, playerId) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var pid = st.player.active_main_quest_id;
  var line = '';
  for (var i = 0; i < st.quests.length; i++) {
    if (st.quests[i].quest_id === pid && st.quests[i].status === 'active') {
      line = st.quests[i].objective_short || '';
      break;
    }
  }
  var text = st.player.required_next_action || line || 'Consult your Quest Log for the next classroom task.';
  return { ok: true, required_next_action: text, quest_objective: line };
}

function lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests) {
  var envelope = {
    schema_version: 1,
    saved_at_iso: new Date().toISOString(),
    player_snapshot: player,
    quests_snapshot: quests,
    realm_id: player.current_realm_id || 'unknown_realm',
    progression_flags: { visited_trigger_object_ids: [] },
  };
  return LhSave_manualSaveProgress(spreadsheetId, tabOverride, envelope);
}
