import type { PlayerSave, QuestDefinition } from '../domain/lh-contract';
import { reconcileQuestPrerequisites } from '../quests/questEngine';

/** Directive shown after the placeholder shrine interaction resolves. */
export const directiveAfterDemoShrine =
  'Return to Mentor Kael to compare your findings against the Ledger of Paths.';

type Outcome = { nextPlayer: PlayerSave; nextQuests: QuestDefinition[] };

/**
 * Applies the leadership demo quest delta when the grove shrine activates.
 * Keeps branching logic centralized for future Tiled-trigger parity.
 */
export function completeDemoShrineVisit(
  player: PlayerSave,
  quests: QuestDefinition[],
  mainQuestId: string,
): Outcome {
  // Act I: the grove nudges toward the Manifest module — do not auto-complete the SOD here.
  if (mainQuestId === 'mq-106') {
    return {
      nextPlayer: {
        ...player,
        required_next_action:
          'The Ley Root hums beneath Aethelwood: open Pause → Manifest (Janene’s SOD) to seal your Career Map — the shrine will not inscribe the scroll for you.',
      },
      nextQuests: quests,
    };
  }

  return {
    nextPlayer: {
      ...player,
      required_next_action: directiveAfterDemoShrine,
    },
    nextQuests: reconcileQuestPrerequisites(
      quests.map((q) =>
        q.quest_id === mainQuestId
          ? {
              ...q,
              status: 'completed' as const,
              objective_short: 'Seek Mentor Kael to debrief.',
            }
          : q,
      ),
    ),
  };
}
