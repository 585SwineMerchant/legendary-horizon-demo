import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveRosterToPlayerSave } from '../runtime/rosterIdentity';
import { loadLhRuntimeFixture } from '../runtime/loadLhRuntimeFixture';
import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import { getEmptyParsedLhMap, loadLhTiledMapPayload } from '../maps/mapLoader';
import type { ParsedLhMap, ParsedLhTrigger } from '../maps/parseLhTiledMap';
import { makeTriggerInteractableId } from '../maps/parseLhTiledMap';
import { dispatchLhTrigger } from '../maps/triggerDispatcher';
import {
  appendSessionHistoryRemote,
  buildManualSaveEnvelope,
  buildSessionSummary,
  coerceExplorationLoop,
  loadPlayerStateFromRemote,
  markExitTicketRemote,
  mergeRealmProgressMaps,
  persistManualSaveEnvelope,
  validatePlayerForManualSave,
} from '../services/manualSaveGateway';
import { composeMockExitTicketDraft, proposeExitTicketComposerSafe } from '../services/exitTicketHandoff';
import { tryLoadCachedFullState } from '../services/localFullStateCache';
import { resolveAssetDeliveryUrl } from '../services/assetCatalog';

import { createEmptyExplorationLoopState, type ExplorationLoopState } from '../exploration/explorationTypes';
import { applyLedgerEntryToQuests } from '../exploration/ledgerQuestBridge';
import { selectActiveWaypoint, waypointKey } from '../exploration/waypoints';
import { buildResumeDialogBody } from '../lib/buildResumeDialogBody';
import { deepClone } from '../lib/clone';
import {
  markResearchComplete,
  touchRealmEntered,
  type RealmProgressMap,
} from '../realm/realmProgress';
import {
  loadQuestDefinitionsFromJson,
  markQuestTurnedIn as markQuestTurnedInOnList,
  reconcileQuestPrerequisites,
} from '../quests/questEngine';
import { resolveActiveRealm } from '../realm/realmRegistry';
import type { ComparisonLedgerEntry, PlayerSave, QuestDefinition, Screen } from '../types';

const emptyLedgerDraft = () => ({ career_a: '', career_b: '', note: '' });

const BLUEPRINT = loadLhRuntimeFixture();
const seededPlayerSeed = BLUEPRINT.player;
const seededQuestSeed = BLUEPRINT.quests;

const TILED_LOAD = BLUEPRINT.tiled_map_payload
  ? loadLhTiledMapPayload(BLUEPRINT.tiled_map_payload)
  : ({ ok: false as const, errors: ['no_tiled_payload'] });

const PARSED_PRIMARY_MAP: ParsedLhMap = TILED_LOAD.ok
  ? TILED_LOAD.map
  : getEmptyParsedLhMap(BLUEPRINT.realm?.realm_id, TILED_LOAD.errors);

if (!TILED_LOAD.ok && typeof console !== 'undefined') {
  console.warn('[LhMapLoader]', TILED_LOAD.errors.join('; '));
}

export function useNightOneFlow() {
  const mentorPortrait = useMemo(
    () => resolveAssetDeliveryUrl('portrait_mentor_kael_placeholder'),
    [],
  );

  const rosterResolution = useMemo(
    () => resolveRosterToPlayerSave(BLUEPRINT.roster_student, seededPlayerSeed),
    [],
  );

  const allRealms = BLUEPRINT.realms;

  const [screen, setScreen] = useState<Screen>('title');
  const [player, setPlayer] = useState<PlayerSave | null>(null);
  const [quests, setQuests] = useState<QuestDefinition[]>(() => seededQuestSeed.map(deepClone));

  const [visitedInteractableIds, setVisitedInteractableIds] = useState<string[]>([]);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<
    | {
        tone: 'success' | 'error';
        text: string;
      }
    | null
  >(null);
  const [realmAtlasOpen, setRealmAtlasOpen] = useState(false);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [realmProgress, setRealmProgress] = useState<RealmProgressMap>({});
  const [exploration, setExploration] = useState<ExplorationLoopState>(() => createEmptyExplorationLoopState());
  const [ledgerDraft, setLedgerDraft] = useState(emptyLedgerDraft);

  const realm = useMemo(() => {
    if (!player) return BLUEPRINT.realm;
    return resolveActiveRealm(allRealms, player.current_realm_id);
  }, [player, allRealms]);

  const activeQuestDefinition = useMemo(
    () => (player ? quests.find((q) => q.quest_id === player.active_main_quest_id) ?? null : null),
    [player, quests],
  );

  const showQuestDebug = import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true';

  useEffect(() => {
    if (screen === 'explore' && player) {
      setRealmProgress((p) => touchRealmEntered(p, player.current_realm_id));
    }
  }, [screen, player?.current_realm_id]);

  const resumeDialogBody = useMemo(() => {
    if (!player) return '';
    return buildResumeDialogBody(player, realm);
  }, [player, realm]);

  const act3WaypointLabel = useMemo(() => {
    const wp = selectActiveWaypoint(PARSED_PRIMARY_MAP.waypoints, exploration.waypoint_keys_visited);
    if (!wp) return null;
    return wp.name?.trim() || wp.waypoint_key || `Waypoint ${wp.tiled_object_id}`;
  }, [exploration.waypoint_keys_visited]);

  const beginDemo = useCallback(async () => {
    if (!rosterResolution.matched && typeof console !== 'undefined') {
      console.warn(
        '[LhRoster]',
        rosterResolution.reason ?? 'Roster heuristic did not match fixture save — QA only.',
      );
    } else if (typeof console !== 'undefined') {
      console.info('[LhRoster]', 'Matched roster fixture ↔ demo save row:', rosterResolution);
    }

    let nextPlayer = deepClone(seededPlayerSeed);
    let nextQuests = seededQuestSeed.map(deepClone);
    let explorationInit = createEmptyExplorationLoopState();
    let realmProgressInit: RealmProgressMap = {};
    let visitedInit: string[] = [];

    const webConfigured =
      Boolean(import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim()) &&
      import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE !== 'true';

    if (webConfigured) {
      const remote = await loadPlayerStateFromRemote(seededPlayerSeed.player_id);
      if (remote.ok) {
        nextPlayer = remote.player;
        nextQuests = remote.quests.length ? remote.quests : seededQuestSeed.map(deepClone);
        visitedInit = remote.progression_flags.visited_trigger_object_ids;
        if (remote.exploration_loop) {
          const coerced = coerceExplorationLoop(remote.exploration_loop);
          if (coerced) explorationInit = coerced;
        }
        if (remote.realm_progress) {
          realmProgressInit = mergeRealmProgressMaps({}, remote.realm_progress);
        }
      } else {
        if (typeof console !== 'undefined') {
          console.warn('[LhLoadPlayer]', remote.message, remote.errors?.join('; ') ?? '');
        }
        const cached = tryLoadCachedFullState(seededPlayerSeed.player_id);
        if (cached) {
          nextPlayer = deepClone(cached.player_snapshot);
          nextQuests = cached.quests_snapshot.length ? cached.quests_snapshot.map(deepClone) : seededQuestSeed.map(deepClone);
          visitedInit = [...cached.progression_flags.visited_trigger_object_ids];
          if (cached.exploration_loop) {
            const coerced = coerceExplorationLoop(cached.exploration_loop);
            if (coerced) explorationInit = coerced;
          }
          if (cached.realm_progress) {
            realmProgressInit = mergeRealmProgressMaps({}, cached.realm_progress);
          }
        }
      }
    } else {
      const cached = tryLoadCachedFullState(seededPlayerSeed.player_id);
      if (cached) {
        nextPlayer = deepClone(cached.player_snapshot);
        nextQuests = cached.quests_snapshot.length ? cached.quests_snapshot.map(deepClone) : seededQuestSeed.map(deepClone);
        visitedInit = [...cached.progression_flags.visited_trigger_object_ids];
        if (cached.exploration_loop) {
          const coerced = coerceExplorationLoop(cached.exploration_loop);
          if (coerced) explorationInit = coerced;
        }
        if (cached.realm_progress) {
          realmProgressInit = mergeRealmProgressMaps({}, cached.realm_progress);
        }
      }
    }

    setPlayer(nextPlayer);
    setQuests(reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(nextQuests)));
    setVisitedInteractableIds(visitedInit);
    setRealmProgress(realmProgressInit);
    setRealmAtlasOpen(false);
    setWorldMapOpen(false);
    setExploration(explorationInit);
    setLedgerDraft(emptyLedgerDraft());
    setScreen('instructions');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setSaveFeedback(null);
  }, [rosterResolution]);

  const quitToTitle = () => {
    setScreen('title');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setRealmAtlasOpen(false);
    setWorldMapOpen(false);
    setRealmProgress({});
    setExploration(createEmptyExplorationLoopState());
    setLedgerDraft(emptyLedgerDraft());
    setPlayer(null);
    setSaveFeedback(null);
  };

  const handleTriggerActivation = useCallback(
    (interactableId: string, triggerMeta: ParsedLhTrigger) => {
      if (!player || visitedInteractableIds.includes(interactableId)) {
        return;
      }

      const result = dispatchLhTrigger(triggerMeta, {
        player,
        quests,
        interactableId,
      });

      if (!result.handled) {
        return;
      }

      setPlayer(result.nextPlayer);
      setQuests(result.nextQuests);
      setVisitedInteractableIds((curr) =>
        curr.includes(interactableId) ? curr : [...curr, interactableId],
      );
    },
    [player, quests, visitedInteractableIds],
  );

  const explorationHotspots: ExplorationHotspot[] = useMemo(() => {
    if (!PARSED_PRIMARY_MAP.triggers.length) {
      return [];
    }

    const { footprint, triggers } = PARSED_PRIMARY_MAP;

    const widthDen = footprint.width_px || 1;
    const heightDen = footprint.height_px || 1;

    const relevant = triggers.filter((hit) => hit.kind === 'quest_advance');

    return relevant.map((trigger) => {
      const interactableId = makeTriggerInteractableId(realm.realm_id, trigger.tiled_object_id);
      const completed = visitedInteractableIds.includes(interactableId);
      const { bounds } = trigger;

      return {
        interactable_id: interactableId,
        label_active: trigger.interaction_label_active,
        label_complete: trigger.interaction_label_complete,
        completed,
        style: {
          position: 'absolute',
          left: `${Math.max((bounds.x / widthDen) * 100, 0)}%`,
          top: `${Math.max((bounds.y / heightDen) * 100, 0)}%`,
          width: `${Math.min((bounds.width / widthDen) * 100, 100)}%`,
          height: `${Math.min((bounds.height / heightDen) * 100, 100)}%`,
        },
      };
    });
  }, [realm.realm_id, visitedInteractableIds]);

  const hotspotIndex = useMemo(() => {
    const map = new Map<string, ParsedLhTrigger>();
    PARSED_PRIMARY_MAP.triggers.forEach((trigger) => {
      map.set(makeTriggerInteractableId(realm.realm_id, trigger.tiled_object_id), trigger);
    });
    return map;
  }, [realm.realm_id]);

  useEffect(() => {
    if (screen !== 'explore' || !player) return;
    const validation = validatePlayerForManualSave(player);
    if (validation.length) return;

    const handle = window.setTimeout(() => {
      void (async () => {
        const envelope = buildManualSaveEnvelope({
          player,
          questsSnapshot: quests,
          realmId: realm.realm_id,
          visitedTriggerInteractableIds: visitedInteractableIds,
          exploration_loop: exploration,
          realm_progress: realmProgress,
          ritual_drafts: {
            ledger_career_a: ledgerDraft.career_a || undefined,
            ledger_career_b: ledgerDraft.career_b || undefined,
            ledger_note: ledgerDraft.note || undefined,
          },
          save_kind: 'auto',
        });
        await persistManualSaveEnvelope(envelope);
      })();
    }, 3500);

    return () => window.clearTimeout(handle);
  }, [
    screen,
    player,
    quests,
    realm.realm_id,
    exploration,
    realmProgress,
    visitedInteractableIds,
    ledgerDraft.career_a,
    ledgerDraft.career_b,
    ledgerDraft.note,
  ]);

  const handleManualSave = useCallback(async () => {
    if (!player) return;

    const validation = validatePlayerForManualSave(player);
    if (validation.length) {
      setSaveFeedback({ tone: 'error', text: validation.join('\n') });
      return;
    }

    const envelope = buildManualSaveEnvelope({
      player,
      questsSnapshot: quests,
      realmId: realm.realm_id,
      visitedTriggerInteractableIds: visitedInteractableIds,
      exploration_loop: exploration,
      realm_progress: realmProgress,
      ritual_drafts: {
        ledger_career_a: ledgerDraft.career_a || undefined,
        ledger_career_b: ledgerDraft.career_b || undefined,
        ledger_note: ledgerDraft.note || undefined,
      },
      save_kind: 'manual',
    });

    const persist = await persistManualSaveEnvelope(envelope);
    setPauseOpen(false);

    if (!persist.ok) {
      setSaveFeedback({
        tone: 'error',
        text: persist.message + (persist.errors ? `\n${persist.errors.join('\n')}` : ''),
      });
      return;
    }

    const mergedPlayer: PlayerSave = {
      ...player,
      revision_token:
        persist.revision ?? player.revision_token ?? `${player.player_id}:${Date.now().toString(36)}`,
      last_manual_save_iso: envelope.saved_at_iso,
    };

    setPlayer(mergedPlayer);

    const exitDraft = composeMockExitTicketDraft({
      player: mergedPlayer,
      roster_student: BLUEPRINT.roster_student,
      envelope,
    });

    const mail = proposeExitTicketComposerSafe(exitDraft);

    setSaveFeedback({
      tone: 'success',
      text: [
        persist.message,
        '',
        exitDraft.summary,
        '',
        'Exploration loop, realm progress, and trigger visits are now persisted when the Web App and sheet columns are configured.',
        !mail.opened
          ? '\n\nNote: the mail composer could not open (pop-up blocked). Send your reflection to your facilitator manually if needed.'
          : '',
      ].join('\n'),
    });
  }, [player, quests, realm.realm_id, visitedInteractableIds, exploration, realmProgress, ledgerDraft]);

  const handleEndSessionRitual = useCallback(async () => {
    if (!player) return;

    const validation = validatePlayerForManualSave(player);
    if (validation.length) {
      setSaveFeedback({ tone: 'error', text: validation.join('\n') });
      return;
    }

    const sessionSummary = buildSessionSummary({ player, quests, exploration });
    const envelope = buildManualSaveEnvelope({
      player,
      questsSnapshot: quests,
      realmId: realm.realm_id,
      visitedTriggerInteractableIds: visitedInteractableIds,
      exploration_loop: exploration,
      realm_progress: realmProgress,
      session_summary: sessionSummary,
      ritual_drafts: {
        ledger_career_a: ledgerDraft.career_a || undefined,
        ledger_career_b: ledgerDraft.career_b || undefined,
        ledger_note: ledgerDraft.note || undefined,
      },
      save_kind: 'manual',
    });

    const persist = await persistManualSaveEnvelope(envelope);
    setPauseOpen(false);

    if (!persist.ok) {
      setSaveFeedback({
        tone: 'error',
        text: persist.message + (persist.errors ? `\n${persist.errors.join('\n')}` : ''),
      });
      return;
    }

    const mergedPlayer: PlayerSave = {
      ...player,
      revision_token:
        persist.revision ?? player.revision_token ?? `${player.player_id}:${Date.now().toString(36)}`,
      last_manual_save_iso: envelope.saved_at_iso,
    };
    setPlayer(mergedPlayer);

    const exitDraft = composeMockExitTicketDraft({
      player: mergedPlayer,
      roster_student: BLUEPRINT.roster_student,
      envelope,
    });
    const mail = proposeExitTicketComposerSafe(exitDraft);

    const hist = await appendSessionHistoryRemote(sessionSummary);
    const ticket = await markExitTicketRemote(mergedPlayer.player_id, 'sent');

    const lines = [
      persist.message,
      '',
      exitDraft.summary,
      '',
      !mail.opened
        ? 'Note: the mail composer could not open (pop-up blocked or unsupported). Use your email client manually with the same recipient as your facilitator.'
        : null,
      !hist.ok ? `Session log: ${hist.message ?? 'append failed'} (save still stored).` : null,
      !ticket.ok ? `Exit ticket state: ${ticket.message ?? 'update failed'}.` : null,
    ].filter(Boolean);

    setSaveFeedback({
      tone: 'success',
      text: lines.join('\n'),
    });
  }, [player, quests, realm.realm_id, visitedInteractableIds, exploration, realmProgress, ledgerDraft]);

  const dismissSaveFeedback = () => setSaveFeedback(null);

  const enterRealmFromWorldMap = useCallback((realmId: string) => {
    setPlayer((p) => (p ? { ...p, current_realm_id: realmId } : p));
    setWorldMapOpen(false);
    setScreen('explore');
  }, []);

  const clearFogKey = useCallback((key: string) => {
    setExploration((e) =>
      e.fog_keys_cleared.includes(key) ? e : { ...e, fog_keys_cleared: [...e.fog_keys_cleared, key] },
    );
  }, []);

  const researchRealm = useCallback((realmId: string) => {
    setRealmProgress((p) => markResearchComplete(p, realmId));
  }, []);

  const submitLedgerEntry = useCallback((partial: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'>) => {
    const id = `ledger_${Date.now().toString(36)}`;
    const entry: ComparisonLedgerEntry = {
      ...partial,
      id,
      created_iso: new Date().toISOString(),
    };
    setExploration((e) => ({ ...e, ledger_entries: [...e.ledger_entries, entry] }));
    setQuests((q) => applyLedgerEntryToQuests(q));
    setLedgerDraft(emptyLedgerDraft());
  }, []);

  const markActiveWaypointVisited = useCallback(() => {
    setExploration((e) => {
      const wp = selectActiveWaypoint(PARSED_PRIMARY_MAP.waypoints, e.waypoint_keys_visited);
      if (!wp) return e;
      const k = waypointKey(wp);
      if (e.waypoint_keys_visited.includes(k)) return e;
      return { ...e, waypoint_keys_visited: [...e.waypoint_keys_visited, k] };
    });
  }, []);

  const markQuestTurnedIn = useCallback((questId: string) => {
    setQuests((q) => reconcileQuestPrerequisites(markQuestTurnedInOnList(q, questId)));
  }, []);

  return {
    screen,
    realm,
    player,
    quests,
    activeQuestDefinition,
    showQuestDebug,
    mentorPortrait,
    resumeDialogBody,
    rosterResolution,
    visitedInteractableIds,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    explorationHotspots,

    navigate: {
      beginDemo,
      quitToTitle,
      proceedInstructions: () => setScreen('resume'),
      resumeToExplore: () => setScreen('explore'),
      openPause: () => setPauseOpen(true),
      closePause: () => setPauseOpen(false),
      openQuestLog: () => setQuestLogOpen(true),
      closeQuestLog: () => setQuestLogOpen(false),
      dismissSaveFeedback,
      openRealmAtlas: () => {
        setPauseOpen(false);
        setRealmAtlasOpen(true);
      },
      closeRealmAtlas: () => setRealmAtlasOpen(false),
      openWorldMap: () => {
        setPauseOpen(false);
        setWorldMapOpen(true);
      },
      closeWorldMap: () => setWorldMapOpen(false),
    },

    realmAtlasOpen,
    worldMapOpen,
    allRealms,
    realmProgress,
    exploration,
    mediaAssets: BLUEPRINT.media_assets,
    parsedMap: PARSED_PRIMARY_MAP,
    act3: {
      activeWaypointLabel: act3WaypointLabel,
      fogCleared: exploration.fog_keys_cleared.length,
      fogTotal: PARSED_PRIMARY_MAP.fog_regions.length,
      waypointVisited: exploration.waypoint_keys_visited.length,
      waypointTotal: PARSED_PRIMARY_MAP.waypoints.length,
    },
    enterRealmFromWorldMap,
    clearFogKey,
    researchRealm,
    submitLedgerEntry,
    markActiveWaypointVisited,

    hotspotControls: {
      activate: (interactableId: string) => {
        const triggerMeta = hotspotIndex.get(interactableId);
        if (!triggerMeta) return;
        handleTriggerActivation(interactableId, triggerMeta);
      },
    },

    handleManualSave,
    handleEndSessionRitual,
    ledgerDraft,
    setLedgerDraft,
    markQuestTurnedIn,

    tiledMapDebug: {
      parsed: PARSED_PRIMARY_MAP,
      loadErrors: TILED_LOAD.ok ? [] : TILED_LOAD.errors,
    },
  };
}
