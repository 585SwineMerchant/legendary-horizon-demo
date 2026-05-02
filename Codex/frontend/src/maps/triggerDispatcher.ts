import { completeDemoShrineVisit } from '../lib/completeDemoShrineVisit';
import type { PlayerSave, QuestDefinition } from '../types';

import type { ParsedLhTrigger } from './parseLhTiledMap';
import { normaliseLhTriggerKind } from './lhTriggerTypes';

export type TriggerDispatchContext = {
  player: PlayerSave;
  quests: QuestDefinition[];
  interactableId: string;
};

export type TriggerDispatchResult =
  | { handled: true; nextPlayer: PlayerSave; nextQuests: QuestDefinition[]; markVisited: true }
  | { handled: false; reason: string };

const STUB_KINDS = new Set<string>([
  'quest_start',
  'quest_complete',
  'npc_dialogue',
  'fog_clear',
  'external_link',
  'vocab_battle',
  'combat_encounter',
  'guild_hq_research',
]);

/**
 * Central entry for Tiled object triggers → gameplay state updates.
 */
export function dispatchLhTrigger(trigger: ParsedLhTrigger, ctx: TriggerDispatchContext): TriggerDispatchResult {
  const kind = normaliseLhTriggerKind(String(trigger.kind ?? ''));

  if (kind === 'quest_advance') {
    if (!trigger.target_quest_id || trigger.target_quest_id !== ctx.player.active_main_quest_id) {
      if (typeof console !== 'undefined') {
        console.warn(
          '[LhTriggerDispatcher]',
          `quest_advance skipped — target ${trigger.target_quest_id ?? '∅'} vs active ${ctx.player.active_main_quest_id}`,
        );
      }
      return { handled: false, reason: 'quest_advance_target_mismatch' };
    }
    const { nextPlayer, nextQuests } = completeDemoShrineVisit(
      ctx.player,
      ctx.quests,
      ctx.player.active_main_quest_id,
    );
    return { handled: true, nextPlayer, nextQuests, markVisited: true };
  }

  if (STUB_KINDS.has(kind)) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[LhTriggerDispatcher]',
        `Stub trigger kind "${kind}" (object ${trigger.tiled_object_id}, interactable ${ctx.interactableId})`,
      );
    }
    return { handled: false, reason: `stub_${kind}` };
  }

  if (typeof console !== 'undefined') {
    console.warn('[LhTriggerDispatcher]', `Unknown trigger kind "${trigger.kind}"`, trigger);
  }
  return { handled: false, reason: 'unknown_kind' };
}
