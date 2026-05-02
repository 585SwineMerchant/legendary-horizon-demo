import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveRosterToPlayerSave } from '../runtime/rosterIdentity';
import { loadLhRuntimeFixture } from '../runtime/loadLhRuntimeFixture';
import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import { getEmptyParsedLhMap, loadLhTiledMapPayload } from '../maps/mapLoader';
import type { ParsedLhMap, ParsedLhTrigger } from '../maps/parseLhTiledMap';
import { makeTriggerInteractableId } from '../maps/parseLhTiledMap';
import { dispatchLhTrigger } from '../maps/triggerDispatcher';
import type { LoadPlayerOutcome } from '../services/manualSaveGateway';
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
import {
  localApplyResetAct,
  localApplyRestoreItem,
  localApplyUnlockQuest,
  tryLocalRestoreFromPlayerBackup,
} from '../services/teacherToolsLocal';
import {
  teacherRestoreBackupRemote,
  teacherRestoreItemRemote,
  teacherResetActRemote,
  teacherUnlockQuestRemote,
} from '../services/teacherToolsGateway';
import {
  buildChronicleSlidesLaunchUrl,
  buildEnrollmentFormLaunchUrl,
  buildGoogleClassroomLaunchUrl,
  buildMaiaLaunchUrl,
  buildOnetLaunchUrl,
  buildQuizletLaunchUrl,
  openUrlInNewTabSafe,
  type ClassroomToolHandlers,
} from '../services/classroomToolLaunches';
import { buildExitTicketPrompt } from '../services/exitTicketHandoff';
import { tryLoadCachedFullState } from '../services/localFullStateCache';
import { tryPlayCatalogAudioAsset } from '../lib/lhCatalogAudio';
import {
  LH_MEDIA_ASSET_ID_MENTOR_PORTRAIT,
  LH_MEDIA_ASSET_ID_SAVE_CHIME,
  LH_MEDIA_ASSET_ID_TITLE_BACKDROP,
  LH_NPC_ID_MENTOR_KAEL,
} from '../lib/mediaConstants';
import { resolveAssetDeliveryUrl, resolveNpcPortraitDeliveryUrl } from '../services/assetCatalog';

import {
  ensureAcademicTasksSeeded,
  markAcademicTaskInProgress,
  syncComparisonLedgerAcademicTask,
} from '../academic/academicProgress';
import { createEmptyExplorationLoopState, type ExplorationLoopState } from '../exploration/explorationTypes';
import { applyLedgerEntryToQuests } from '../exploration/ledgerQuestBridge';
import { selectActiveWaypoint, waypointKey } from '../exploration/waypoints';
import type { EncounterLaunchPayload } from '../components/EncounterOverlay';
import { appendEncounterLog, awardEncounterXp } from '../encounter/encounterXp';
import { tryQuestLinkedEncounterWin } from '../encounter/encounterQuestBridge';
import { buildResumeDialogBody, resolveNpcDialogueBody } from '../dialogue/dialogueEngine';
import { findNpcEntry, formatNpcSpeakerLabel } from '../dialogue/npcRegistry';
import type { LhNpcDialogueOverlayModel } from '../dialogue/npcDialogueOverlayModel';
import { deepClone } from '../lib/clone';
import {
  markResearchComplete,
  setRealmLearnedNotes,
  touchRealmEntered,
  type RealmProgressMap,
} from '../realm/realmProgress';
import {
  loadQuestDefinitionsFromJson,
  markQuestTurnedIn as markQuestTurnedInOnList,
  markQuestCompleted,
  forceUnlockQuest,
  reconcileQuestPrerequisites,
} from '../quests/questEngine';
import { resolveActiveRealm } from '../realm/realmRegistry';
import type { ComparisonLedgerEntry, NightOneNavigate, PlayerSave, QuestDefinition, Screen } from '../types';
import type { TeacherToolsPanelProps } from '../components/TeacherToolsPanel';

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
  const titleBackdropUrl = useMemo(
    () => resolveAssetDeliveryUrl(LH_MEDIA_ASSET_ID_TITLE_BACKDROP, BLUEPRINT.media_assets),
    [],
  );

  const mentorPortrait = useMemo(() => {
    const cat = BLUEPRINT.media_assets;
    return (
      resolveNpcPortraitDeliveryUrl(LH_NPC_ID_MENTOR_KAEL, cat) ||
      resolveAssetDeliveryUrl(LH_MEDIA_ASSET_ID_MENTOR_PORTRAIT, cat)
    );
  }, []);

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
  const [facilitatorBusy, setFacilitatorBusy] = useState(false);
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
  const [academicWorksheetsOpen, setAcademicWorksheetsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [moduleHostOpen, setModuleHostOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [bootstrapPhase, setBootstrapPhase] = useState<'idle' | 'loading' | 'error'>('idle');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [realmProgress, setRealmProgress] = useState<RealmProgressMap>({});
  const [exploration, setExploration] = useState<ExplorationLoopState>(() => createEmptyExplorationLoopState());
  const [ledgerDraft, setLedgerDraft] = useState(emptyLedgerDraft);
  const [npcDialogue, setNpcDialogue] = useState<LhNpcDialogueOverlayModel | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<EncounterLaunchPayload | null>(null);
  const activeEncounterRef = useRef<EncounterLaunchPayload | null>(null);
  activeEncounterRef.current = activeEncounter;

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
    return buildResumeDialogBody(player, realm, quests, BLUEPRINT.dialogue_catalog);
  }, [player, realm, quests]);

  const resumeMentorSpeakerLabel = useMemo(() => {
    return formatNpcSpeakerLabel(findNpcEntry(BLUEPRINT.npc_registry, 'mentor_kael'));
  }, []);

  const act3WaypointLabel = useMemo(() => {
    const wp = selectActiveWaypoint(PARSED_PRIMARY_MAP.waypoints, exploration.waypoint_keys_visited);
    if (!wp) return null;
    return wp.name?.trim() || wp.waypoint_key || `Waypoint ${wp.tiled_object_id}`;
  }, [exploration.waypoint_keys_visited]);

  const beginDemo = useCallback(async () => {
    setBootstrapPhase('loading');
    setBootstrapError(null);
    try {
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

    explorationInit = ensureAcademicTasksSeeded(BLUEPRINT.academic_worksheet_tasks, explorationInit);

    setPlayer(nextPlayer);
    setQuests(reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(nextQuests)));
    setVisitedInteractableIds(visitedInit);
    setRealmProgress(realmProgressInit);
    setRealmAtlasOpen(false);
    setWorldMapOpen(false);
    setAcademicWorksheetsOpen(false);
    setInventoryOpen(false);
    setExploration(explorationInit);
    setLedgerDraft(emptyLedgerDraft());
    setScreen('instructions');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setSaveFeedback(null);
    setBootstrapPhase('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setBootstrapError(msg);
      setBootstrapPhase('error');
      if (typeof console !== 'undefined') {
        console.error('[LhSessionBootstrap]', err);
      }
    }
  }, [rosterResolution]);

  const quitToTitle = () => {
    setScreen('title');
    setPauseOpen(false);
    setQuestLogOpen(false);
    setRealmAtlasOpen(false);
    setWorldMapOpen(false);
    setAcademicWorksheetsOpen(false);
    setInventoryOpen(false);
    setModuleHostOpen(false);
    setActiveModuleId(null);
    setBootstrapPhase('idle');
    setBootstrapError(null);
    setRealmProgress({});
    setExploration(createEmptyExplorationLoopState());
    setLedgerDraft(emptyLedgerDraft());
    setPlayer(null);
    setSaveFeedback(null);
    setNpcDialogue(null);
    setActiveEncounter(null);
  };

  const dismissNpcDialogue = useCallback(() => setNpcDialogue(null), []);

  const handleEncounterRetreat = useCallback(() => {
    const cur = activeEncounterRef.current;
    if (cur) {
      setExploration((e) =>
        appendEncounterLog(e, {
          kind: cur.kind,
          outcome: 'retreat',
          xp_awarded: 0,
          at_iso: new Date().toISOString(),
          interactable_id: cur.interactableId,
          target_quest_id: cur.target_quest_id,
        }),
      );
    }
    setActiveEncounter(null);
  }, []);

  const handleEncounterWin = useCallback(
    (summary: { requestedXp: number }) => {
      const cur = activeEncounterRef.current;
      if (!cur || !player) return;
      const capAward = awardEncounterXp({
        player,
        exploration,
        requestedXp: summary.requestedXp,
      });
      const qLink = tryQuestLinkedEncounterWin(capAward.nextPlayer, quests, cur.target_quest_id);
      const nextE = appendEncounterLog(capAward.nextExploration, {
        kind: cur.kind,
        outcome: 'win',
        xp_awarded: capAward.xpGranted,
        at_iso: new Date().toISOString(),
        interactable_id: cur.interactableId,
        target_quest_id: cur.target_quest_id,
      });
      setPlayer(qLink.nextPlayer);
      setQuests(qLink.nextQuests);
      setExploration(nextE);
      setVisitedInteractableIds((ids) => (ids.includes(cur.interactableId) ? ids : [...ids, cur.interactableId]));
      setActiveEncounter(null);
      if (capAward.capped) {
        setSaveFeedback({
          tone: 'success',
          text: `Encounter cleared — granted ${capAward.xpGranted} XP (session encounter cap reached).`,
        });
      }
    },
    [player, quests, exploration],
  );

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

      if (result.openEncounter) {
        setActiveEncounter({
          kind: result.openEncounter.kind,
          interactableId: result.openEncounter.interactableId,
          target_quest_id: result.openEncounter.target_quest_id,
          title: triggerMeta.interaction_label_active,
        });
        return;
      }

      if (result.openNpcDialogue) {
        const ctx = { player: result.nextPlayer, realm, quests: result.nextQuests };
        const { body, npc } = resolveNpcDialogueBody(
          result.openNpcDialogue.npcId,
          BLUEPRINT.dialogue_catalog,
          BLUEPRINT.npc_registry,
          ctx,
        );
        const aid = npc?.portrait_asset_id;
        const portraitUrl = aid ? resolveAssetDeliveryUrl(aid, BLUEPRINT.media_assets) : '';
        setNpcDialogue({
          npcId: result.openNpcDialogue.npcId,
          title: npc?.card_title ?? 'A moment together',
          speakerLabel: formatNpcSpeakerLabel(npc),
          body,
          portraitUrl: portraitUrl || undefined,
        });
      }

      if (result.markVisited) {
        setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
      }
    },
    [player, quests, visitedInteractableIds, realm],
  );

  const explorationHotspots: ExplorationHotspot[] = useMemo(() => {
    if (!PARSED_PRIMARY_MAP.triggers.length) {
      return [];
    }

    const { footprint, triggers } = PARSED_PRIMARY_MAP;

    const widthDen = footprint.width_px || 1;
    const heightDen = footprint.height_px || 1;

    const relevant = triggers.filter(
      (hit) =>
        hit.kind === 'quest_advance' ||
        hit.kind === 'npc_dialogue' ||
        hit.kind === 'combat_encounter' ||
        hit.kind === 'vocab_battle',
    );

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

    const prompt = buildExitTicketPrompt({ player: mergedPlayer, quests });

    setSaveFeedback({
      tone: 'success',
      text: [
        persist.message,
        '',
        'Exit ticket recorded in-game (no email draft).',
        '',
        prompt,
        '',
        'Exploration loop, realm progress, and trigger visits are now persisted when the Web App and sheet columns are configured.',
      ].join('\n'),
    });

    tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_SAVE_CHIME, BLUEPRINT.media_assets);
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

    const prompt = buildExitTicketPrompt({ player: mergedPlayer, quests });

    const hist = await appendSessionHistoryRemote(sessionSummary);
    const ticket = await markExitTicketRemote(mergedPlayer.player_id, 'sent');

    const lines = [
      persist.message,
      '',
      'Exit ticket recorded in-game (no email draft).',
      '',
      prompt,
      '',
      !hist.ok ? `Session log: ${hist.message ?? 'append failed'} (save still stored).` : null,
      !ticket.ok ? `Exit ticket state: ${ticket.message ?? 'update failed'}.` : null,
    ].filter(Boolean);

    setSaveFeedback({
      tone: 'success',
      text: lines.join('\n'),
    });
  }, [player, quests, realm.realm_id, visitedInteractableIds, exploration, realmProgress, ledgerDraft]);

  const dismissSaveFeedback = () => setSaveFeedback(null);

  const classroomTools = useMemo((): ClassroomToolHandlers | null => {
    if (!player) return null;
    const searchHint =
      player.active_main_quest_title || player.required_next_action || player.display_name || 'careers';
    return {
      onOpenOnet: () => {
        void openUrlInNewTabSafe(buildOnetLaunchUrl(searchHint));
      },
      onOpenMaia: () => {
        void openUrlInNewTabSafe(buildMaiaLaunchUrl());
      },
      onOpenChronicleSlides: () => {
        void openUrlInNewTabSafe(buildChronicleSlidesLaunchUrl());
      },
      onOpenEnrollmentForm: () => {
        void openUrlInNewTabSafe(buildEnrollmentFormLaunchUrl());
      },
      onOpenQuizlet: () => {
        void openUrlInNewTabSafe(buildQuizletLaunchUrl(searchHint));
      },
      onOpenGoogleClassroom: () => {
        void openUrlInNewTabSafe(buildGoogleClassroomLaunchUrl());
      },
    };
  }, [player]);

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

  const updateRealmNotes = useCallback((realmId: string, notes: string) => {
    setRealmProgress((p) => setRealmLearnedNotes(p, realmId, notes));
  }, []);

  const getModuleDraft = useCallback(
    (moduleId: string): Record<string, string> => {
      return exploration.module_drafts?.[moduleId] ?? {};
    },
    [exploration.module_drafts],
  );

  const patchModuleDraft = useCallback((moduleId: string, patch: Partial<Record<string, string>>) => {
    setExploration((e) => {
      const prev = e.module_drafts?.[moduleId] ?? {};
      const nextDraft: Record<string, string> = {
        ...prev,
        ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v ?? ''])),
      };
      return {
        ...e,
        module_drafts: {
          ...(e.module_drafts ?? {}),
          [moduleId]: nextDraft,
        },
      };
    });
  }, []);

  const clearModuleDraft = useCallback((moduleId: string) => {
    setExploration((e) => {
      if (!e.module_drafts || !e.module_drafts[moduleId]) return e;
      const next = { ...e.module_drafts };
      delete next[moduleId];
      return { ...e, module_drafts: next };
    });
  }, []);

  const applyModuleResult = useCallback(
    (payload: { module_id: string; quest_id: string; status: string; unlocks?: { kind: string; target_id: string }[] }) => {
      if (!payload?.module_id) return;

      // Mark the owning quest completed if the module finished in a terminal “success” state.
      if (payload.quest_id && (payload.status === 'submitted' || payload.status === 'completed' || payload.status === 'passed')) {
        setQuests((q) => markQuestCompleted(q, payload.quest_id));
      }

      // Handle unlock events for downstream quest/module flow.
      if (payload.unlocks?.some((u) => u.kind === 'unlock_module' && u.target_id === 'mod_gt102_trial_of_tongues')) {
        setQuests((q) => forceUnlockQuest(q, 'gq_gt102_trial_of_tongues'));
        setPlayer((p) =>
          p
            ? {
                ...p,
                required_next_action: 'Begin GT‑102: Step into the Trial of Tongues.',
              }
            : p,
        );
      }
    },
    [],
  );

  const submitLedgerEntry = useCallback((partial: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'>) => {
    const id = `ledger_${Date.now().toString(36)}`;
    const entry: ComparisonLedgerEntry = {
      ...partial,
      id,
      created_iso: new Date().toISOString(),
    };
    setExploration((e) => {
      const withEntry = { ...e, ledger_entries: [...e.ledger_entries, entry] };
      return syncComparisonLedgerAcademicTask(BLUEPRINT.academic_worksheet_tasks, withEntry);
    });
    setQuests((q) => applyLedgerEntryToQuests(q));
    setLedgerDraft(emptyLedgerDraft());
  }, []);

  const applyAcademicTasks = useCallback((nextTasks: NonNullable<ExplorationLoopState['academic_tasks']>) => {
    setExploration((e) => ({ ...e, academic_tasks: nextTasks }));
  }, []);

  const startAcademicTask = useCallback((taskId: string) => {
    setExploration((e) => ({
      ...e,
      academic_tasks: markAcademicTaskInProgress(
        BLUEPRINT.academic_worksheet_tasks,
        e.academic_tasks ?? {},
        taskId,
      ),
    }));
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

  const mergeRemoteLoad = useCallback((remote: Extract<LoadPlayerOutcome, { ok: true }>) => {
    let explorationInit = createEmptyExplorationLoopState();
    if (remote.exploration_loop) {
      const coerced = coerceExplorationLoop(remote.exploration_loop);
      if (coerced) explorationInit = coerced;
    }
    setPlayer(remote.player);
    setQuests((q) =>
      reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(remote.quests.length ? remote.quests : q)),
    );
    setVisitedInteractableIds(remote.progression_flags.visited_trigger_object_ids);
    setRealmProgress(remote.realm_progress ? mergeRealmProgressMaps({}, remote.realm_progress) : {});
    setExploration(ensureAcademicTasksSeeded(BLUEPRINT.academic_worksheet_tasks, explorationInit));
  }, []);

  const handleTeacherUnlockQuest = useCallback(
    async (questId: string) => {
      if (!player) return;
      setFacilitatorBusy(true);
      try {
        const r = await teacherUnlockQuestRemote(player.player_id, questId);
        if (r.ok && !r.simulated) {
          const load = await loadPlayerStateFromRemote(player.player_id);
          if (load.ok) {
            mergeRemoteLoad(load);
            setSaveFeedback({ tone: 'success', text: r.message });
            return;
          }
          setSaveFeedback({ tone: 'error', text: load.message });
          return;
        }
        if (r.ok && r.simulated) {
          setQuests((q) => localApplyUnlockQuest(q, questId));
          setSaveFeedback({ tone: 'success', text: r.message });
          return;
        }
        setSaveFeedback({ tone: 'error', text: r.message });
      } finally {
        setFacilitatorBusy(false);
      }
    },
    [player, mergeRemoteLoad],
  );

  const handleTeacherRestoreBackup = useCallback(async () => {
    if (!player) return;
    setFacilitatorBusy(true);
    try {
      const r = await teacherRestoreBackupRemote(player.player_id);
      if (r.ok && !r.simulated) {
        const load = await loadPlayerStateFromRemote(player.player_id);
        if (load.ok) {
          mergeRemoteLoad(load);
          setSaveFeedback({ tone: 'success', text: r.message });
          return;
        }
        setSaveFeedback({ tone: 'error', text: load.message });
        return;
      }
      if (r.ok && r.simulated) {
        const local = tryLocalRestoreFromPlayerBackup(player);
        if (!local) {
          setSaveFeedback({
            tone: 'error',
            text: 'No backup_checkpoint_json on this save (add one on the row or save once in Sheets).',
          });
          return;
        }
        setPlayer(local.player);
        setQuests(local.quests);
        setVisitedInteractableIds(local.visited);
        setRealmProgress(local.realmProgress);
        setExploration(ensureAcademicTasksSeeded(BLUEPRINT.academic_worksheet_tasks, local.exploration));
        setSaveFeedback({ tone: 'success', text: 'Restored from local backup snapshot.' });
        return;
      }
      setSaveFeedback({ tone: 'error', text: r.message });
    } finally {
      setFacilitatorBusy(false);
    }
  }, [player, mergeRemoteLoad]);

  const handleTeacherRestoreItem = useCallback(
    async (itemId: string, qty: number, label?: string) => {
      if (!player) return;
      setFacilitatorBusy(true);
      try {
        const r = await teacherRestoreItemRemote(player.player_id, itemId, qty, label);
        if (r.ok && !r.simulated) {
          const load = await loadPlayerStateFromRemote(player.player_id);
          if (load.ok) {
            mergeRemoteLoad(load);
            setSaveFeedback({ tone: 'success', text: r.message });
            return;
          }
          setSaveFeedback({ tone: 'error', text: load.message });
          return;
        }
        if (r.ok && r.simulated) {
          setPlayer((p) => (p ? localApplyRestoreItem(p, itemId, qty, label) : p));
          setSaveFeedback({ tone: 'success', text: r.message });
          return;
        }
        setSaveFeedback({ tone: 'error', text: r.message });
      } finally {
        setFacilitatorBusy(false);
      }
    },
    [player, mergeRemoteLoad],
  );

  const handleTeacherResetAct = useCallback(
    async (act: number) => {
      if (!player) return;
      setFacilitatorBusy(true);
      try {
        const r = await teacherResetActRemote(player.player_id, act);
        if (r.ok && !r.simulated) {
          const load = await loadPlayerStateFromRemote(player.player_id);
          if (load.ok) {
            mergeRemoteLoad(load);
            setSaveFeedback({ tone: 'success', text: r.message });
            return;
          }
          setSaveFeedback({ tone: 'error', text: load.message });
          return;
        }
        if (r.ok && r.simulated) {
          setPlayer((p) => (p ? localApplyResetAct(p, act) : p));
          setSaveFeedback({ tone: 'success', text: r.message });
          return;
        }
        setSaveFeedback({ tone: 'error', text: r.message });
      } finally {
        setFacilitatorBusy(false);
      }
    },
    [player, mergeRemoteLoad],
  );

  const handleFacilitatorMarkExitTicket = useCallback(async () => {
    if (!player) return;
    setFacilitatorBusy(true);
    try {
      const r = await markExitTicketRemote(player.player_id, 'sent');
      if (!r.ok) {
        setSaveFeedback({ tone: 'error', text: r.message ?? 'mark_exit_ticket failed.' });
        return;
      }
      const web =
        Boolean(import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim()) &&
        import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE !== 'true';
      if (web) {
        const load = await loadPlayerStateFromRemote(player.player_id);
        if (load.ok) mergeRemoteLoad(load);
      } else {
        setPlayer((p) => (p ? { ...p, exit_ticket_state: 'sent' } : p));
      }
      setSaveFeedback({ tone: 'success', text: 'Exit ticket state set to sent.' });
    } finally {
      setFacilitatorBusy(false);
    }
  }, [player, mergeRemoteLoad]);

  const showFacilitatorTools =
    import.meta.env.DEV || import.meta.env.VITE_LH_TEACHER_PANEL === 'true';

  const handleTeacherOverrideGt102 = useCallback(
    (outcome: 'passed' | 'failed') => {
      if (!player) return;
      if (outcome === 'passed') {
        applyModuleResult({
          module_id: 'mod_gt102_trial_of_tongues',
          quest_id: 'gq_gt102_trial_of_tongues',
          status: 'passed',
        });
        setSaveFeedback({ tone: 'success', text: 'GT-102 override applied: passed.' });
        return;
      }
      setQuests((q) => forceUnlockQuest(q, 'gq_gt102_trial_of_tongues'));
      setPlayer((p) =>
        p
          ? {
              ...p,
              required_next_action: 'Retry GT‑102: return to the Trial of Tongues.',
            }
          : p,
      );
      setSaveFeedback({ tone: 'success', text: 'GT-102 override applied: failed (quest set to available).' });
    },
    [player, applyModuleResult],
  );

  const facilitatorToolsProps: TeacherToolsPanelProps | null =
    showFacilitatorTools && player
      ? {
          rosterSectionLabel: BLUEPRINT.roster_student.section_code,
          player,
          quests,
          exploration,
          visitedTriggerIds: visitedInteractableIds,
          busy: facilitatorBusy,
          onUnlockQuest: handleTeacherUnlockQuest,
          onRestoreBackup: handleTeacherRestoreBackup,
          onRestoreMentorVial: () =>
            handleTeacherRestoreItem('mentor_echo_vial', 1, 'Echo vial — mentor guidance'),
          onMarkExitTicketSent: handleFacilitatorMarkExitTicket,
          onResetAct: handleTeacherResetAct,
          onOverrideGt102: handleTeacherOverrideGt102,
          onClearModuleDraft: clearModuleDraft,
        }
      : null;

  const navigate: NightOneNavigate = {
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
    openResearchWorksheets: () => {
      setPauseOpen(false);
      setAcademicWorksheetsOpen(true);
    },
    closeResearchWorksheets: () => setAcademicWorksheetsOpen(false),
    openInventory: () => {
      setPauseOpen(false);
      setInventoryOpen(true);
    },
    closeInventory: () => setInventoryOpen(false),
    openModule: (moduleId: string) => {
      setPauseOpen(false);
      setActiveModuleId(moduleId);
      setModuleHostOpen(true);
    },
    closeModule: () => {
      setModuleHostOpen(false);
      setActiveModuleId(null);
    },
  };

  return {
    screen,
    realm,
    player,
    quests,
    activeQuestDefinition,
    showQuestDebug,
    mentorPortrait,
    resumeMentorSpeakerLabel,
    titleBackdropUrl,
    classroomTools,
    resumeDialogBody,
    npcDialogue,
    dismissNpcDialogue,
    activeEncounter,
    onEncounterWin: handleEncounterWin,
    onEncounterRetreat: handleEncounterRetreat,
    rosterResolution,
    visitedInteractableIds,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    explorationHotspots,

    navigate,

    realmAtlasOpen,
    worldMapOpen,
    academicWorksheetsOpen,
    inventoryOpen,
    moduleHostOpen,
    activeModuleId,
    bootstrapPhase,
    bootstrapError,
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
    updateRealmNotes,
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
    applyAcademicTasks,
    startAcademicTask,
    academicWorksheetDefs: BLUEPRINT.academic_worksheet_tasks,
    getModuleDraft,
    patchModuleDraft,
    clearModuleDraft,
    applyModuleResult,

    tiledMapDebug: {
      parsed: PARSED_PRIMARY_MAP,
      loadErrors: TILED_LOAD.ok ? [] : TILED_LOAD.errors,
    },

    facilitatorToolsProps,
  };
}
