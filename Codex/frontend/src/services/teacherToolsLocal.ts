import type { LhBackupCheckpointV1, PlayerSave, QuestDefinition } from '../domain/lh-contract';
import { createEmptyExplorationLoopState, type ExplorationLoopState } from '../exploration/explorationTypes';
import { loadQuestDefinitionsFromJson, reconcileQuestPrerequisites } from '../quests/questEngine';
import type { RealmProgressMap } from '../realm/realmProgress';

import { coerceExplorationLoop } from './manualSaveGateway';
import { parseLhBackupCheckpointJson } from './teacherCheckpoint';

export function localApplyUnlockQuest(quests: QuestDefinition[], questId: string): QuestDefinition[] {
  return reconcileQuestPrerequisites(
    quests.map((q) => (q.quest_id === questId ? { ...q, status: 'available' as const } : q)),
  );
}

export function localApplyRestoreItem(
  player: PlayerSave,
  itemId: string,
  qty: number,
  label?: string,
): PlayerSave {
  const inv = player.inventory_summary ?? { coins: 0, items: [] };
  const items = [...(inv.items ?? [])];
  const q = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
  const idx = items.findIndex((i) => i.item_id === itemId);
  if (idx === -1) {
    items.push({ item_id: itemId, qty: q, label: label || itemId });
  } else {
    const row = items[idx];
    items[idx] = {
      ...row,
      qty: Number(row.qty || 0) + q,
      ...(label ? { label } : {}),
    };
  }
  return {
    ...player,
    inventory_summary: { ...inv, items },
  };
}

export function localApplyResetAct(player: PlayerSave, targetAct: number): PlayerSave {
  const act = Number.isFinite(targetAct) && targetAct >= 1 ? Math.floor(targetAct) : 1;
  return {
    ...player,
    current_act: act,
    required_next_action: `Your guide has reset your Act marker to ${act}. Open the Quest Log and follow the next classroom objective.`,
  };
}

export function stateFromCheckpoint(cp: LhBackupCheckpointV1): {
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  visited: string[];
} {
  const visited = cp.progression_flags?.visited_trigger_object_ids ?? [];
  const quests = reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(cp.quests_snapshot));
  const exploration =
    cp.exploration_loop != null
      ? coerceExplorationLoop(cp.exploration_loop) ?? createEmptyExplorationLoopState()
      : createEmptyExplorationLoopState();
  const realmProgress = (cp.realm_progress ?? {}) as RealmProgressMap;
  return {
    player: { ...cp.player_snapshot },
    quests,
    exploration,
    realmProgress,
    visited: [...visited],
  };
}

export function tryLocalRestoreFromPlayerBackup(player: PlayerSave): {
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  visited: string[];
} | null {
  const cp = parseLhBackupCheckpointJson(player.backup_checkpoint_json);
  if (!cp) return null;
  return stateFromCheckpoint(cp);
}
