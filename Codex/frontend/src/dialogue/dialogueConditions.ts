import type { LhDialogueCondition } from '../domain/lh-dialogue';
import type { PlayerSave, QuestDefinition, RealmDefinition } from '../domain/lh-contract';

export type DialogueEvalContext = {
  player: PlayerSave;
  realm: RealmDefinition;
  quests: QuestDefinition[];
};

export function evalLhDialogueCondition(cond: LhDialogueCondition, ctx: DialogueEvalContext): boolean {
  if (cond.kind === 'always') return true;
  if (cond.kind === 'act_gte') return ctx.player.current_act >= cond.act;
  if (cond.kind === 'realm_is') return ctx.player.current_realm_id === cond.realm_id;
  if (cond.kind === 'quest_status') {
    const q = ctx.quests.find((x) => x.quest_id === cond.quest_id);
    if (!q) return false;
    return cond.any_of.includes(q.status);
  }
  return false;
}

/** Empty / missing conditions → line is eligible. All listed conditions must pass (AND). */
export function lineMatchesConditions(conditions: LhDialogueCondition[] | undefined, ctx: DialogueEvalContext): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evalLhDialogueCondition(c, ctx));
}
