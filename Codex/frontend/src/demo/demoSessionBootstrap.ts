import { deepClone } from '../lib/clone';
import type { AcademicWorksheetTaskDef, PlayerSave, QuestDefinition } from '../domain/lh-contract';
import {
  coerceExplorationLoop,
  loadPlayerStateFromRemote,
  mergeRealmProgressMaps,
} from '../services/manualSaveGateway';
import { tryLoadCachedFullState } from '../services/localFullStateCache';
import type { RealmProgressMap } from '../realm/realmProgress';
import { ensureAcademicTasksSeeded } from '../academic/academicProgress';
import {
  createEmptyExplorationLoopState,
  mergeGuildHqAtlasRevealedFromRealmProgress,
  syncGuildTruePathFromPlayerIfUnset,
  type ExplorationLoopState,
} from '../exploration/explorationTypes';
import { ensureDemoGuidanceState, mergeDemoGuidanceState, applyDemoObjectiveToPlayer } from './demoGuidance';

export const DEMO_LOAD_AUDIT =
  import.meta.env.DEV ||
  import.meta.env.VITE_LH_QUEST_DEBUG === 'true' ||
  import.meta.env.VITE_LH_DEMO_LOAD_AUDIT === 'true';

export function logDemoLoadAudit(tag: string, payload: Record<string, unknown>): void {
  if (!DEMO_LOAD_AUDIT || typeof console === 'undefined') return;
  console.info(`[LhDemoLoadAudit] ${tag}`, payload);
}

export type DemoPersistedLoadSource =
  | 'remote_apps_script_ok'
  | 'remote_failed_local_cache'
  | 'remote_failed_empty_then_fixture'
  | 'no_webapp_local_cache'
  | 'no_webapp_fixture_only'
  | 'simulated_save_fixture_only';

export type DemoPersistedSessionPayload = {
  source: DemoPersistedLoadSource;
  nextPlayer: PlayerSave;
  nextQuests: QuestDefinition[];
  /** After `coerceExplorationLoop` only (before strip / atlas merge / demo merge). */
  explorationAfterCoerce: ExplorationLoopState;
  realmProgressInit: RealmProgressMap;
  visitedInit: string[];
  /** Raw `exploration_loop` from remote row before coercion, when present. */
  rawExplorationLoopFromRemote: unknown | undefined;
};

function webSaveConfigured(): boolean {
  return (
    Boolean(import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim()) &&
    import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE !== 'true'
  );
}

/**
 * Loads player / quests / exploration / realm progress / visited triggers from the same
 * sources as `beginDemo` (Apps Script remote, else local full-state cache, else fixture-only).
 */
export async function fetchPersistedDemoSession(
  seededPlayer: PlayerSave,
  seededQuests: QuestDefinition[],
): Promise<DemoPersistedSessionPayload> {
  let nextPlayer = deepClone(seededPlayer);
  let nextQuests = seededQuests.map(deepClone);
  let explorationAfterCoerce = createEmptyExplorationLoopState();
  let realmProgressInit: RealmProgressMap = {};
  let visitedInit: string[] = [];
  let rawExplorationLoopFromRemote: unknown | undefined;
  let source: DemoPersistedLoadSource = 'no_webapp_fixture_only';

  if (webSaveConfigured()) {
    const remote = await loadPlayerStateFromRemote(seededPlayer.player_id);
    if (remote.ok) {
      source = 'remote_apps_script_ok';
      nextPlayer = remote.player;
      nextQuests = remote.quests.length ? remote.quests : seededQuests.map(deepClone);
      visitedInit = remote.progression_flags.visited_trigger_object_ids;
      rawExplorationLoopFromRemote = remote.exploration_loop;
      if (remote.exploration_loop) {
        const coerced = coerceExplorationLoop(remote.exploration_loop);
        if (coerced) explorationAfterCoerce = coerced;
      }
      if (remote.realm_progress) {
        realmProgressInit = mergeRealmProgressMaps({}, remote.realm_progress);
      }
    } else {
      const cached = tryLoadCachedFullState(seededPlayer.player_id);
      if (cached) {
        source = 'remote_failed_local_cache';
        nextPlayer = deepClone(cached.player_snapshot);
        nextQuests = cached.quests_snapshot.length ? cached.quests_snapshot.map(deepClone) : seededQuests.map(deepClone);
        visitedInit = [...cached.progression_flags.visited_trigger_object_ids];
        rawExplorationLoopFromRemote = cached.exploration_loop;
        if (cached.exploration_loop) {
          const coerced = coerceExplorationLoop(cached.exploration_loop);
          if (coerced) explorationAfterCoerce = coerced;
        }
        if (cached.realm_progress) {
          realmProgressInit = mergeRealmProgressMaps({}, cached.realm_progress);
        }
      } else {
        source = 'remote_failed_empty_then_fixture';
      }
    }
  } else {
    if (import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true') {
      source = 'simulated_save_fixture_only';
    }
    const cached = tryLoadCachedFullState(seededPlayer.player_id);
    if (cached) {
      source = 'no_webapp_local_cache';
      nextPlayer = deepClone(cached.player_snapshot);
      nextQuests = cached.quests_snapshot.length ? cached.quests_snapshot.map(deepClone) : seededQuests.map(deepClone);
      visitedInit = [...cached.progression_flags.visited_trigger_object_ids];
      rawExplorationLoopFromRemote = cached.exploration_loop;
      if (cached.exploration_loop) {
        const coerced = coerceExplorationLoop(cached.exploration_loop);
        if (coerced) explorationAfterCoerce = coerced;
      }
      if (cached.realm_progress) {
        realmProgressInit = mergeRealmProgressMaps({}, cached.realm_progress);
      }
    }
  }

  return {
    source,
    nextPlayer,
    nextQuests,
    explorationAfterCoerce,
    realmProgressInit,
    visitedInit,
    rawExplorationLoopFromRemote,
  };
}

export type FinalizeDemoBootstrapArgs = {
  academicTaskDefs: readonly AcademicWorksheetTaskDef[];
  explorationAfterCoerce: ExplorationLoopState;
  realmProgressInit: RealmProgressMap;
  nextPlayer: PlayerSave;
};

/**
 * Matches `beginDemo` post-load transforms: strip Aethelwood atlas prefetch, seed academics,
 * sync guild true path, merge atlas pins from realm progress, merge demo guidance defaults.
 */
export function finalizeDemoBootstrapExploration(args: FinalizeDemoBootstrapArgs): {
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  nextPlayer: PlayerSave;
} {
  // Preserve remote persistence exactly as saved. Fresh-run behavior is handled by `Start` (client-side reset),
  // not by stripping realms during normalization. Stripping would make Aethelwood fog/research appear to work
  // visually but fail to persist across Resume/Load.
  const realmProgress = mergeRealmProgressMaps({}, args.realmProgressInit);
  let exploration: ExplorationLoopState = { ...args.explorationAfterCoerce };

  exploration = ensureAcademicTasksSeeded([...args.academicTaskDefs], exploration);
  exploration = syncGuildTruePathFromPlayerIfUnset(exploration, args.nextPlayer.current_realm_id);
  exploration = mergeGuildHqAtlasRevealedFromRealmProgress(exploration, realmProgress);
  const initialDemoGuidance = ensureDemoGuidanceState(exploration);
  exploration = mergeDemoGuidanceState(exploration, initialDemoGuidance);
  const nextPlayer = applyDemoObjectiveToPlayer(args.nextPlayer, initialDemoGuidance.current_objective);

  return { exploration, realmProgress, nextPlayer };
}
