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
  | {
      handled: true;
      nextPlayer: PlayerSave;
      nextQuests: QuestDefinition[];
      markVisited: boolean;
      /** When set, UI should surface NPC dialogue (Milestone 16). */
      openNpcDialogue?: { npcId: string };
      /** Milestone 17 — opens encounter overlay; do not mark visited until win. */
      openEncounter?: {
        kind: 'combat_encounter' | 'vocab_battle';
        interactableId: string;
        target_quest_id?: string;
      };
    }
  | { handled: false; reason: string };

const STUB_KINDS = new Set<string>([
  'quest_start',
  'quest_complete',
  'fog_clear',
  'external_link',
  'guild_hq_research',
  'guild_manager_hq',
  'guild_interview_invite',
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

  if (kind === 'npc_dialogue') {
    const npcId = String(trigger.npc_id ?? '').trim() || 'mentor_kael';
    return {
      handled: true,
      nextPlayer: ctx.player,
      nextQuests: ctx.quests,
      markVisited: true,
      openNpcDialogue: { npcId },
    };
  }

  if (kind === 'combat_encounter' || kind === 'vocab_battle') {
    return {
      handled: true,
      nextPlayer: ctx.player,
      nextQuests: ctx.quests,
      markVisited: false,
      openEncounter: {
        kind,
        interactableId: ctx.interactableId,
        target_quest_id: trigger.target_quest_id,
      },
    };
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
