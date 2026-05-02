import type { PlayerSave, QuestDefinition } from '../domain/lh-contract';
import { completeDemoShrineVisit } from '../lib/completeDemoShrineVisit';

/**
 * If the encounter names the active main quest while it is still `active`, apply the same
 * completion delta as the grove shrine (`completeDemoShrineVisit`). Otherwise no-op.
 */
export function tryQuestLinkedEncounterWin(
  player: PlayerSave,
  quests: QuestDefinition[],
  targetQuestId: string | undefined,
): { nextPlayer: PlayerSave; nextQuests: QuestDefinition[]; advanced: boolean } {
  if (!targetQuestId || targetQuestId !== player.active_main_quest_id) {
    return { nextPlayer: player, nextQuests: quests, advanced: false };
  }
  const row = quests.find((q) => q.quest_id === targetQuestId);
  if (!row || row.status !== 'active') {
    return { nextPlayer: player, nextQuests: quests, advanced: false };
  }
  const { nextPlayer, nextQuests } = completeDemoShrineVisit(player, quests, targetQuestId);
  return { nextPlayer, nextQuests, advanced: true };
}
