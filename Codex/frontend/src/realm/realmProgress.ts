import type { RealmExplorationProgressEntry } from '../domain/lh-contract';

/** Per-realm session progress keyed by `realm_id`. */
export type RealmProgressMap = Record<string, RealmExplorationProgressEntry>;

export function touchRealmEntered(progress: RealmProgressMap, realmId: string): RealmProgressMap {
  const prev = progress[realmId];
  return {
    ...progress,
    [realmId]: {
      ...prev,
      entered: true,
      last_entered_iso: new Date().toISOString(),
    },
  };
}

export function hasEnteredRealm(progress: RealmProgressMap, realmId: string): boolean {
  return Boolean(progress[realmId]?.entered);
}

export function markResearchComplete(progress: RealmProgressMap, realmId: string): RealmProgressMap {
  const prev = progress[realmId] ?? { entered: false };
  return {
    ...progress,
    [realmId]: { ...prev, research_complete: true },
  };
}

export function setRealmLearnedNotes(progress: RealmProgressMap, realmId: string, notes: string): RealmProgressMap {
  const prev = progress[realmId] ?? { entered: false };
  return {
    ...progress,
    [realmId]: { ...prev, learned_notes: notes },
  };
}
