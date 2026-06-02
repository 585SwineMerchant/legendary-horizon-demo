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
  syncGuildTruePathFromPlayerIfUnset,
  type ExplorationLoopState,
} from '../exploration/explorationTypes';
import {
  isDemoRemoteSavePreferred,
  loadCanonicalDemoPersistedSession,
  loadCanonicalDemoPersistedSessionForResume,
} from './demoCanonicalSave';

export const DEMO_LOAD_AUDIT =
  import.meta.env.DEV ||
  import.meta.env.VITE_LH_QUEST_DEBUG === 'true' ||
  import.meta.env.VITE_LH_DEMO_LOAD_AUDIT === 'true';

export function logDemoLoadAudit(tag: string, payload: Record<string, unknown>): void {
  if (!DEMO_LOAD_AUDIT || typeof console === 'undefined') return;
  console.info(`[LhDemoLoadAudit] ${tag}`, payload);
}

export type DemoPersistedLoadSource =
  | 'canonical_demo_fixture'
  | 'canonical_resume_local_cache'
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

export type FetchPersistedDemoSessionOpts = {
  /** When true (Resume), use browser cache before bundled demo save. Start/boot always uses bundled only. */
  allowLocalCache?: boolean;
  /** Explicit button intent. `canonical` is fresh demo; `remote_strict` is the Sheets-backed load button. */
  mode?: 'default' | 'canonical' | 'remote_strict';
};

/**
 * Loads player / quests / exploration / realm progress / visited triggers.
 * Default: bundled `demo_save_state.json`. Optional: remote Sheets when `VITE_LH_DEMO_USE_REMOTE_SAVE=true`.
 */
export async function fetchPersistedDemoSession(
  seededPlayer: PlayerSave,
  seededQuests: QuestDefinition[],
  opts?: FetchPersistedDemoSessionOpts,
): Promise<DemoPersistedSessionPayload> {
  const mode = opts?.mode ?? 'default';

  if (mode === 'canonical') {
    if (opts?.allowLocalCache) {
      return loadCanonicalDemoPersistedSessionForResume(seededPlayer);
    }
    return loadCanonicalDemoPersistedSession(seededPlayer);
  }

  if (!isDemoRemoteSavePreferred() && mode !== 'remote_strict') {
    if (opts?.allowLocalCache) {
      return loadCanonicalDemoPersistedSessionForResume(seededPlayer);
    }
    return loadCanonicalDemoPersistedSession(seededPlayer);
  }

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
      if (mode === 'remote_strict') {
        throw new Error(remote.message);
      }
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
    if (mode === 'remote_strict') {
      throw new Error(
        'Spreadsheet load is not configured. Set VITE_LH_APPS_SCRIPT_WEBAPP_URL and keep VITE_LH_FORCE_SIMULATED_SAVE=false.',
      );
    }
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
 * Post-load transforms for Act I: seed academics, sync guild true path.
 * Demo guidance state is intentionally NOT applied here — Act I builds ignore demo_guidance_v1.
 * Migration: old saves that have demo_guidance_v1 load cleanly but game logic skips it.
 */
export function finalizeDemoBootstrapExploration(args: FinalizeDemoBootstrapArgs): {
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  nextPlayer: PlayerSave;
} {
  const realmProgress = mergeRealmProgressMaps({}, args.realmProgressInit);
  let exploration: ExplorationLoopState = { ...args.explorationAfterCoerce };

  exploration = ensureAcademicTasksSeeded([...args.academicTaskDefs], exploration);
  exploration = syncGuildTruePathFromPlayerIfUnset(exploration, args.nextPlayer.current_realm_id);
  // Do not pre-reveal guild HQ from `realm_progress.entered` — only the first physical HQ visit should chart the atlas.

  return { exploration, realmProgress, nextPlayer: args.nextPlayer };
}
