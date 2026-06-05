import demoSaveStateJson from '@samples/demo_save_state.json';
import questsJson from '@samples/quests.json';

import type { ManualSaveEnvelopeV1, PlayerSave, QuestDefinition } from '../domain/lh-contract';
import { deepClone } from '../lib/clone';
import { loadQuestDefinitionsFromJson, reconcileQuestPrerequisites } from '../quests/questEngine';
import { coerceExplorationLoop } from '../services/manualSaveGateway';
import { tryLoadCachedFullState } from '../services/localFullStateCache';
import type { RealmProgressMap } from '../realm/realmProgress';
import { createEmptyExplorationLoopState } from '../exploration/explorationTypes';

import type { DemoPersistedLoadSource, DemoPersistedSessionPayload } from './demoSessionBootstrap';

/**
 * Demo builds load this bundled envelope by default so facilitators get a predictable vertical slice
 * without Sheets, browser cache, or stale localStorage. Set `VITE_LH_DEMO_USE_REMOTE_SAVE=true` to
 * restore the previous remote → cache → fixture fallback chain.
 */
export function isDemoRemoteSavePreferred(): boolean {
  return import.meta.env.VITE_LH_DEMO_USE_REMOTE_SAVE === 'true';
}

function loadBundledDemoEnvelope(): ManualSaveEnvelopeV1 {
  const raw = deepClone(demoSaveStateJson) as unknown as ManualSaveEnvelopeV1;
  const quests = reconcileQuestPrerequisites(
    loadQuestDefinitionsFromJson(deepClone(questsJson) as QuestDefinition[]),
  );
  return {
    ...raw,
    quests_snapshot: quests,
    schema_version: 1,
  };
}

function persistedPayloadFromEnvelope(
  envelope: ManualSaveEnvelopeV1,
  source: DemoPersistedLoadSource,
  seededPlayer: PlayerSave,
): DemoPersistedSessionPayload {
  const playerId = String(envelope.player_snapshot?.player_id ?? seededPlayer.player_id).trim();
  const nextPlayer: PlayerSave = {
    ...deepClone(seededPlayer),
    ...deepClone(envelope.player_snapshot),
    player_id: playerId || seededPlayer.player_id,
  };
  const nextQuests = envelope.quests_snapshot?.length
    ? envelope.quests_snapshot.map((q) => deepClone(q))
    : [];

  let explorationAfterCoerce = createEmptyExplorationLoopState();
  if (envelope.exploration_loop) {
    const coerced = coerceExplorationLoop(envelope.exploration_loop);
    if (coerced) explorationAfterCoerce = coerced;
  }

  const realmProgressInit: RealmProgressMap = envelope.realm_progress
    ? deepClone(envelope.realm_progress)
    : {};

  const visitedInit = [...(envelope.progression_flags?.visited_trigger_object_ids ?? [])];

  return {
    source,
    nextPlayer,
    nextQuests,
    explorationAfterCoerce,
    realmProgressInit,
    visitedInit,
    rawExplorationLoopFromRemote: envelope.exploration_loop,
  };
}

/** Bundled demo save (Maia → Lost Echo → Aethelwood guild HQ → atlas fog). */
export function loadCanonicalDemoPersistedSession(
  seededPlayer: PlayerSave,
): DemoPersistedSessionPayload {
  return persistedPayloadFromEnvelope(loadBundledDemoEnvelope(), 'canonical_demo_fixture', seededPlayer);
}

/** Resume: local full-state cache if present, otherwise bundled demo save. */
export function loadCanonicalDemoPersistedSessionForResume(
  seededPlayer: PlayerSave,
): DemoPersistedSessionPayload {
  const playerId = String(seededPlayer.player_id ?? '').trim();
  const cached = playerId ? tryLoadCachedFullState(playerId) : null;
  if (cached) {
    return persistedPayloadFromEnvelope(cached, 'canonical_resume_local_cache', seededPlayer);
  }
  return loadCanonicalDemoPersistedSession(seededPlayer);
}

/**
 * Reset all quest statuses to their opening-game state.
 * Locks every quest, activates mq-101 (the first quest), then reconciles prerequisites
 * so any quests whose prereqs are already met get unlocked.
 */
function resetQuestsToFreshStart(quests: QuestDefinition[]): QuestDefinition[] {
  const locked = quests.map((q) => ({ ...deepClone(q), status: 'locked' as const }));
  const withOpening = locked.map((q) =>
    q.quest_id === 'mq-101' ? { ...q, status: 'active' as const } : q,
  );
  return reconcileQuestPrerequisites(withOpening);
}

/**
 * Build a completely fresh opening-game payload from blueprint seeds.
 * Start Game always calls this — it never touches demo_save_state.json or remote data.
 * Campfire / rested-readiness fields are explicitly cleared so the popup never fires on new game.
 */
export function loadFreshStartPayload(
  seededPlayer: PlayerSave,
  seededQuests: QuestDefinition[],
): DemoPersistedSessionPayload {
  const freshPlayer: PlayerSave = {
    ...deepClone(seededPlayer),
    campfire_streak: undefined,
    last_campfire_iso: undefined,
    used_campfire_prompt_ids_json: undefined,
    last_campfire_score: undefined,
    rested_readiness_tier: undefined,
    rested_readiness_multiplier: undefined,
    rested_readiness_wake_index: undefined,
  };

  return {
    source: 'canonical_demo_fixture',
    nextPlayer: freshPlayer,
    nextQuests: resetQuestsToFreshStart(seededQuests.map((q) => deepClone(q))),
    explorationAfterCoerce: createEmptyExplorationLoopState(),
    realmProgressInit: {},
    visitedInit: [],
    rawExplorationLoopFromRemote: null,
  };
}
