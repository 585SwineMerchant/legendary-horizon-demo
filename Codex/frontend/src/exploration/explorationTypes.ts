import type { ExplorationLoopState, GuildEndgameV1 } from '../domain/lh-contract';
import type { RealmProgressMap } from '../realm/realmProgress';

export type { ComparisonLedgerEntry, ExplorationLoopState } from '../domain/lh-contract';

export function createDefaultGuildEndgameV1(): GuildEndgameV1 {
  return {
    phase: 'unstarted',
    true_path_realm_id: null,
    application_unlocked: false,
    application_sealed: false,
    interview_invited: false,
    interview_deadline_iso: null,
    last_interview_outcome: 'none',
  };
}

/** Seed true-path from save `current_realm_id` when unset (bootstrap / legacy saves). */
export function syncGuildTruePathFromPlayerIfUnset(
  exploration: ExplorationLoopState,
  currentRealmId: string | undefined,
): ExplorationLoopState {
  const rid = String(currentRealmId ?? '').trim();
  if (!rid) return exploration;
  const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
  if (ge.true_path_realm_id) return exploration;
  return mergeGuildEndgameIntoExploration(exploration, {
    true_path_realm_id: rid,
    phase: 'true_path_chosen',
  });
}

/** Merge a patch into `guild_endgame_v1` (fills defaults when absent). */
export function mergeGuildEndgameIntoExploration(
  exploration: ExplorationLoopState,
  patch: Partial<GuildEndgameV1>,
): ExplorationLoopState {
  const cur = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
  return { ...exploration, guild_endgame_v1: { ...cur, ...patch } };
}

/**
 * Record a guild HQ on the World Atlas (persisted on `exploration_loop`).
 * Sources include hall staff encounters (manager / porter) and aligning charter focus while
 * exploring — see `touchRealmEntered` + atlas merge in the night-one flow. Scripted first-visit
 * (Guild Info → atlas reveal) will layer on top without changing this merge contract yet.
 */
export function mergeGuildHqAtlasRevealed(exploration: ExplorationLoopState, realmId: string): ExplorationLoopState {
  const id = String(realmId ?? '').trim();
  if (!id) return exploration;
  const prev = exploration.guild_hq_atlas_revealed_realm_ids ?? [];
  if (prev.includes(id)) return exploration;
  return { ...exploration, guild_hq_atlas_revealed_realm_ids: [...prev, id] };
}

/** One-shot alignment for older saves where `realm_progress.entered` predates atlas beacons. */
export function mergeGuildHqAtlasRevealedFromRealmProgress(
  exploration: ExplorationLoopState,
  progress: RealmProgressMap,
): ExplorationLoopState {
  let e = exploration;
  for (const [realmId, entry] of Object.entries(progress)) {
    if (entry?.entered) e = mergeGuildHqAtlasRevealed(e, realmId);
  }
  return e;
}

export function createEmptyExplorationLoopState(): ExplorationLoopState {
  return {
    fog_keys_cleared: [],
    waypoint_keys_visited: [],
    ledger_entries: [],
    academic_tasks: {},
    module_drafts: {},
    session_encounter_xp_awarded: 0,
    encounter_log: [],
    // demo_guidance_v1 intentionally omitted — Act I builds do not initialize demo state.
    // Old saves that have it will load it but game logic ignores it.
    guild_endgame_v1: createDefaultGuildEndgameV1(),
    guild_hq_atlas_revealed_realm_ids: [],
  };
}
