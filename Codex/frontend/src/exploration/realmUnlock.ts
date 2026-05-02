import type { PlayerSave, QuestDefinition, RealmDefinition } from '../types';

/**
 * Act III slice: realm is explorable if it is the current location, or referenced by a non-locked quest.
 */
export function isRealmUnlocked(realmId: string, player: PlayerSave, quests: QuestDefinition[]): boolean {
  if (realmId === player.current_realm_id) {
    return true;
  }
  return quests.some(
    (q) =>
      Array.isArray(q.realm_ids) &&
      q.realm_ids.includes(realmId) &&
      q.status !== 'locked',
  );
}

export function unlockedRealmCount(realms: RealmDefinition[], player: PlayerSave, quests: QuestDefinition[]): number {
  return realms.filter((r) => isRealmUnlocked(r.realm_id, player, quests)).length;
}
