/**
 * TeacherOverrideService — Milestone 3 educator rescue operations.
 */

/**
 * Forces a quest row in the player snapshot to `available` (e.g. stuck `locked`).
 */
function LhTeacher_unlockQuest(spreadsheetId, tabOverride, playerId, questId) {
  var st = LhQuest_getActiveQuestState(spreadsheetId, tabOverride, playerId);
  if (!st.ok) {
    return st;
  }
  var quests = st.quests.map(function (q) {
    return JSON.parse(JSON.stringify(q));
  });
  var found = false;
  for (var i = 0; i < quests.length; i++) {
    if (quests[i].quest_id === questId) {
      quests[i].status = 'available';
      found = true;
      break;
    }
  }
  if (!found) {
    return { ok: false, error: 'quest_not_in_snapshot' };
  }
  var player = JSON.parse(JSON.stringify(st.player));
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

function LhTeacher_rollbackCheckpoint(spreadsheetId, tabOverride, playerId) {
  return LhSave_restoreBackupCheckpoint(spreadsheetId, tabOverride, playerId);
}

/**
 * Adds or increments an inventory line item then persists via manual save (checkpointed).
 */
function LhTeacher_restoreItem(spreadsheetId, tabOverride, playerId, itemId, qty, label) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var player = JSON.parse(JSON.stringify(load.player));
  var inv = player.inventory_summary || { coins: 0, items: [] };
  if (!Array.isArray(inv.items)) {
    inv.items = [];
  }
  var q = Number(qty) > 0 ? Number(qty) : 1;
  var hit = -1;
  for (var i = 0; i < inv.items.length; i++) {
    if (inv.items[i].item_id === itemId) {
      hit = i;
      break;
    }
  }
  if (hit === -1) {
    inv.items.push({ item_id: itemId, qty: q, label: label || itemId });
  } else {
    inv.items[hit].qty = Number(inv.items[hit].qty || 0) + q;
    if (label) {
      inv.items[hit].label = label;
    }
  }
  player.inventory_summary = inv;
  var quests = load.quests && load.quests.length ? load.quests : [];
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}

/**
 * Rewinds narrative act index (does not auto-reset quests — pair with quest fixes as needed).
 */
function LhTeacher_resetActState(spreadsheetId, tabOverride, playerId, targetAct) {
  var load = LhSave_loadPlayerState(spreadsheetId, tabOverride, playerId);
  if (!load.ok) {
    return load;
  }
  var act = Number(targetAct);
  if (!act || act < 1) {
    return { ok: false, error: 'invalid_target_act' };
  }
  var player = JSON.parse(JSON.stringify(load.player));
  player.current_act = act;
  player.required_next_action =
    'Your guide has reset your Act marker to ' + act + '. Open the Quest Log and follow the next classroom objective.';
  var quests = load.quests && load.quests.length ? load.quests : [];
  return lhQuest_persistPlayerAndQuests_(spreadsheetId, tabOverride, playerId, player, quests);
}
