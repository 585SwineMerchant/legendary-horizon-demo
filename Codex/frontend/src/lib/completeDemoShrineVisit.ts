import type { PlayerSave, QuestDefinition } from '../domain/lh-contract';

/** Directive shown after the placeholder shrine interaction resolves. */
export const directiveAfterDemoShrine =
  'Return to Mentor Kael to compare your findings against the Ledger of Paths.';

type Outcome = { nextPlayer: PlayerSave; nextQuests: QuestDefinition[] };

/**
 * Applies the Night One quest delta when the grove shrine activates.
 * Keeps branching logic centralized for future Tiled-trigger parity.
 */
export function completeDemoShrineVisit(
  player: PlayerSave,
  quests: QuestDefinition[],
  mainQuestId: string,
): Outcome {
  return {
    nextPlayer: {
      ...player,
      required_next_action: directiveAfterDemoShrine,
    },
    nextQuests: quests.map((q) =>
      q.quest_id === mainQuestId
        ? {
            ...q,
            status: 'completed' as const,
            objective_short: 'Seek Mentor Kael to debrief.',
          }
        : q,
    ),
  };
}
