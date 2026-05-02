import type { PlayerSave, QuestDefinition } from '../domain/lh-contract';

/**
 * v4 decision: Exit tickets are routed in-game + persisted server-side (no mailto / Gmail compose).
 * This returns the reflection prompt we show to the student at end-of-session.
 */
export function buildExitTicketPrompt(args: { player: PlayerSave; quests: QuestDefinition[] }): string {
  const player = args.player;
  const quests = args.quests;
  let objective = '';
  if (player.active_main_quest_id) {
    const hit = quests.find((q) => q.quest_id === player.active_main_quest_id);
    objective = hit?.objective_short ?? hit?.title ?? '';
  }
  const name = player.display_name || 'Traveler';
  const act = player.current_act || 1;
  const realm = player.current_realm_id || 'unknown realm';
  const next = player.required_next_action || objective || 'Review your Quest Log for the next step.';
  return [
    `Campfire log — ${name}`,
    `Act ${act} | Realm: ${realm}`,
    `Active thread: ${next}`,
    '',
    'In one or two sentences, what felt most useful today, and what will you do first next time?',
  ].join('\n');
}
