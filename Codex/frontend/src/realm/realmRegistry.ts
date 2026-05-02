import type { QuestDefinition, RealmDefinition } from '../domain/lh-contract';

export function sortRealmsCanon(realms: RealmDefinition[]): RealmDefinition[] {
  return [...realms].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

export function getRealmById(realms: RealmDefinition[], realmId: string): RealmDefinition | undefined {
  return realms.find((r) => r.realm_id === realmId);
}

export function resolveActiveRealm(realms: RealmDefinition[], currentRealmId: string): RealmDefinition {
  return getRealmById(realms, currentRealmId) ?? realms[0];
}

/** Career cluster label is carried on each realm row (GDD v2 registry). */
export function getCareerClusterLabel(realm: RealmDefinition): string {
  return realm.career_cluster;
}

export function getGuildHqLabel(realm: RealmDefinition): string {
  return realm.guild_headquarters;
}

/** Intro copy for atlas / realm screens — `intro_text` wins, else lore_digest. */
export function getRealmIntroBody(realm: RealmDefinition): string {
  return (realm.intro_text && realm.intro_text.trim()) || realm.lore_digest;
}

export function filterQuestsForRealm(quests: QuestDefinition[], realmId: string): QuestDefinition[] {
  return quests.filter((q) => Array.isArray(q.realm_ids) && q.realm_ids.includes(realmId));
}

export function countQuestHooksForRealm(quests: QuestDefinition[], realmId: string): number {
  return filterQuestsForRealm(quests, realmId).length;
}
