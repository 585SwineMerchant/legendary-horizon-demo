import type { QuestDefinition } from '../types';
import { reconcileQuestPrerequisites } from '../quests/questEngine';

const CROSSROADS_QUEST_ID = 'sq_listen_crossroads_echo';

/**
 * After a Comparison Ledger entry, unlock crossroads side quest (demo bridge to Act III feel).
 */
export function applyLedgerEntryToQuests(quests: QuestDefinition[]): QuestDefinition[] {
  const patched = quests.map((q) => {
    if (q.quest_id !== CROSSROADS_QUEST_ID) return q;
    if (q.status !== 'locked') return q;
    return {
      ...q,
      status: 'available' as const,
      objective_short: 'Visit the Crossroads Haven when it unlocks on the world map.',
    };
  });
  return reconcileQuestPrerequisites(patched);
}
