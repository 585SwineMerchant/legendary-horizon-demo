/**
 * Act III signpost quest bridge — maps foretold signpost realm interactions
 * to the correct cycle quest IDs (travel/fog/ledger × 3 cycles).
 *
 * The player has 3 foretold signpost realms. They must visit each in order:
 *   Cycle 1: mq-302 (travel) → mq-303 (fog) → mq-304 (ledger)
 *   Cycle 2: mq-305 (travel) → mq-306 (fog) → mq-307 (ledger)
 *   Cycle 3: mq-308 (travel) → mq-309 (fog) → mq-310 (ledger)
 *
 * The prerequisite chain enforces ordering, so we just need to find
 * whichever travel/fog/ledger quest is currently available or active.
 */

import type { QuestDefinition } from '../domain/lh-contract';

type QuestCycleKind = 'travel' | 'fog' | 'ledger';

const CYCLE_QUEST_IDS: Record<QuestCycleKind, readonly string[]> = {
  travel: ['mq-302', 'mq-305', 'mq-308'],
  fog: ['mq-303', 'mq-306', 'mq-309'],
  ledger: ['mq-304', 'mq-307', 'mq-310'],
};

/**
 * Find the first quest of the given kind (travel/fog/ledger) that is
 * `available` or `active` — i.e. the one the player should complete next.
 * Returns the quest_id or null if none are actionable.
 */
export function getActiveSignpostCycleQuestId(
  quests: readonly QuestDefinition[],
  kind: QuestCycleKind,
): string | null {
  const ids = CYCLE_QUEST_IDS[kind];
  for (const qid of ids) {
    const q = quests.find((x) => x.quest_id === qid);
    if (q && (q.status === 'available' || q.status === 'active')) return qid;
  }
  return null;
}

/**
 * Check if a realm_id matches any of the player's foretold signpost realms.
 */
export function isForetoldSignpostRealm(
  realmId: string,
  signpostRealmIds: readonly string[] | undefined,
): boolean {
  if (!signpostRealmIds?.length) return false;
  const id = String(realmId ?? '').trim();
  return signpostRealmIds.some((s) => String(s ?? '').trim() === id);
}

/** The comparison milestone quest (completes when all 3 signpost realms have ledger entries). */
export const COMPARE_QUEST_ID = 'mq-311';

/** The "enter the realms" quest — first step of Act III. */
export const ENTER_REALMS_QUEST_ID = 'mq-301';
