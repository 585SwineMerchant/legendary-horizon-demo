import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveRosterToPlayerSave } from '../runtime/rosterIdentity';
import { loadLhRuntimeFixture } from '../runtime/loadLhRuntimeFixture';
import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import { getEmptyParsedLhMap, loadLhTiledMapPayload } from '../maps/mapLoader';
import type { ParsedLhMap, ParsedLhTrigger } from '../maps/parseLhTiledMap';
import { makeTriggerInteractableId } from '../maps/parseLhTiledMap';
import { dispatchLhTrigger } from '../maps/triggerDispatcher';
import { normaliseLhTriggerKind } from '../maps/lhTriggerTypes';
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
import { clearCachedFullState } from '../services/localFullStateCache';
import { clearPendingSave, hasPendingSave, readPendingSave } from '../lib/lhPendingSave';

/** Survives React StrictMode remount so DEV boot query handling runs once per full page load. */
let lhDevBootUrlQueryHandled = false;
/** Set from `lh_force_intro=1` before URL cleanup; consumed by `beginDemo`. */
let lhDevBootPendingForceIntro = false;
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
import { getLhAudioDirector } from '../lib/lhAudioDirector';
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
import {
  GUILD_GT101_BREATHER_REQUIRED_NEXT_ACTION,
  GUILD_GT101_BREATHER_SEAL_TOAST,
  GUILD_GT101_BREATHER_BANNER_BODY,
  GUILD_GT101_BREATHER_BANNER_TITLE,
  GUILD_GT101_BREATHER_QUEST_LOG_NOTE,
} from '../exploration/guildEndgameBreatherCopy';
import {
  buildGuildInterviewAlreadySummonsToast,
  buildGuildInterviewInvitedRequiredNextAction,
  buildGuildInterviewInviteBannerBody,
  buildGuildInterviewInviteQuestLogNote,
  buildGuildInterviewInviteToast,
  GUILD_INTERVIEW_INVITE_BANNER_TITLE,
  GUILD_INTERVIEW_INVITE_LATE_BANNER_TITLE,
  GUILD_MANAGER_DESK_SUMMONS_ACTIVE,
} from '../exploration/guildEndgameInterviewInviteCopy';
import {
  computeGuildInterviewDeadlineIso,
  formatGuildInterviewDeadlineForPlayer,
  isGuildInterviewDeadlinePassed,
} from '../exploration/guildInterviewDeadline';
import {
  GUILD_ACCEPTANCE_BANNER_BODY,
  GUILD_ACCEPTANCE_BANNER_TITLE,
  GUILD_ACCEPTANCE_PASS_SEAL_TOAST,
  GUILD_ACCEPTANCE_QUEST_LOG_NOTE,
  GUILD_ACCEPTANCE_REQUIRED_NEXT_ACTION,
  GUILD_MANAGER_DESK_POST_ACCEPTANCE,
} from '../exploration/guildGuildAcceptanceCopy';
import {
  GUILD_GT102_FAIL_SEAL_TOAST,
  GUILD_GT102_RETRY_BANNER_BODY,
  GUILD_GT102_RETRY_BANNER_TITLE,
  GUILD_GT102_RETRY_QUEST_LOG_NOTE,
  GUILD_GT102_RETRY_REQUIRED_NEXT_ACTION,
  GUILD_MANAGER_DESK_INTERVIEW_RETRY,
} from '../exploration/guildGt102OutcomeCopy';
import { emptyLedgerDraft, ritualDraftsFromLedgerDraft } from '../exploration/comparisonLedger';
import { normalizeForetoldSignpostRealmIds, signpostLedgerMilestone } from '../exploration/foretoldSignposts';
import {
  LH_NPC_ID_MASTER_SCRIBE,
  advanceDemoGuidanceStage,
  applyDemoObjectiveToPlayer,
  applyDemoStaminaReward,
  buildDemoGuidanceMap,
  canDiscoverGuildHqResearch,
  canReenterChosenGuildHq,
  ensureDemoGuidanceState,
  isLostEchoDemoTrigger,
  mergeDemoGuidanceState,
  resolveMasterScribeDialogue,
  resolveMasterScribeNextStage,
} from '../demo/demoGuidance';
import {
  DEMO_LOAD_AUDIT,
  fetchPersistedDemoSession,
  finalizeDemoBootstrapExploration,
  logDemoLoadAudit,
} from '../demo/demoSessionBootstrap';
import {
  createDefaultGuildEndgameV1,
  createEmptyExplorationLoopState,
  mergeGuildEndgameIntoExploration,
  mergeGuildHqAtlasRevealed,
  mergeGuildHqAtlasRevealedFromRealmProgress,
  syncGuildTruePathFromPlayerIfUnset,
  type ExplorationLoopState,
} from '../exploration/explorationTypes';
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
  LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT,
  LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT,
} from '../lib/lhPhaserGuildResearchBridge';
import { playLhSfx } from '../lib/lhSfx';
import {
  markResearchComplete,
  setRealmLearnedNotes,
  touchRealmEntered,
  type RealmProgressMap,
} from '../realm/realmProgress';
import { CANON_REALMS } from '../realm/canonRealms';
import {
  loadQuestDefinitionsFromJson,
  markQuestTurnedIn as markQuestTurnedInOnList,
  markQuestCompleted,
  forceUnlockQuest,
  isTerminalQuestStatus,
  reconcileQuestPrerequisites,
} from '../quests/questEngine';
import { getRealmById, resolveActiveRealm } from '../realm/realmRegistry';
import { PRIMARY_WORLD_TRIGGER_REALM_ID } from '../runtime/primaryWorldMap';
import type {
  ComparisonLedgerEntry,
  ModuleResultPayload,
  NightOneNavigate,
  PlayerSave,
  QuestDefinition,
  Screen,
} from '../types';
import type { TeacherToolsPanelProps } from '../components/TeacherToolsPanel';

/**
 * `http://localhost:5173/#lh-main?lh_reset_demo=1` puts `lh_reset_demo` in the **hash**, not
 * `location.search`. Parse hash as `#fragment?query` so DEV boot flags still work.
 */
function readLhDevBootUrlSnapshot(w: typeof window): {
  reset: boolean;
  forceIntro: boolean;
  pathname: string;
  searchParams: URLSearchParams;
  hashFragment: string;
  hashQueryParams: URLSearchParams;
} | null {
  const searchParams = new URLSearchParams(w.location.search);
  const hash = w.location.hash;
  const qIdx = hash.indexOf('?');
  const hashFragment = qIdx < 0 ? hash : hash.slice(0, qIdx);
  const hashQueryParams =
    qIdx < 0 ? new URLSearchParams() : new URLSearchParams(hash.slice(qIdx + 1));
  const reset =
    searchParams.get('lh_reset_demo') === '1' || hashQueryParams.get('lh_reset_demo') === '1';
  const forceIntro =
    searchParams.get('lh_force_intro') === '1' || hashQueryParams.get('lh_force_intro') === '1';
  if (!reset && !forceIntro) return null;
  return {
    reset,
    forceIntro,
    pathname: w.location.pathname,
    searchParams,
    hashFragment,
    hashQueryParams,
  };
}

function urlAfterLhDevBootCleanup(s: NonNullable<ReturnType<typeof readLhDevBootUrlSnapshot>>): string {
  s.searchParams.delete('lh_reset_demo');
  s.searchParams.delete('lh_force_intro');
  s.hashQueryParams.delete('lh_reset_demo');
  s.hashQueryParams.delete('lh_force_intro');
  const qs = s.searchParams.toString();
  const hqs = s.hashQueryParams.toString();
  const nextHash = s.hashFragment ? `${s.hashFragment}${hqs ? `?${hqs}` : ''}` : '';
  return `${s.pathname}${qs ? `?${qs}` : ''}${nextHash}`;
}

const BLUEPRINT = loadLhRuntimeFixture();
const seededPlayerSeed = BLUEPRINT.player;
const seededQuestSeed = BLUEPRINT.quests;

const TILED_LOAD = BLUEPRINT.tiled_map_payload
  ? loadLhTiledMapPayload(BLUEPRINT.tiled_map_payload)
  : ({ ok: false as const, errors: ['no_tiled_payload'] });

const PARSED_PRIMARY_MAP: ParsedLhMap = buildDemoGuidanceMap(
  TILED_LOAD.ok ? TILED_LOAD.map : getEmptyParsedLhMap(BLUEPRINT.realm?.realm_id, TILED_LOAD.errors),
);

if (!TILED_LOAD.ok && typeof console !== 'undefined') {
  console.warn('[LhMapLoader]', TILED_LOAD.errors.join('; '));
}

const SHOW_TRIGGER_PARSE_DEBUG =
  import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true';

if (SHOW_TRIGGER_PARSE_DEBUG && typeof console !== 'undefined') {
  const combat = PARSED_PRIMARY_MAP.triggers.filter((t) => t.kind === 'combat_encounter');
  console.info(
    '[LhDemo] combat_encounter triggers (after demo synthetic merge)',
    combat.map((t) => ({
      tiled_object_id: t.tiled_object_id,
      tiled_name: t.tiled_name,
      layer: t.layer_name,
      lh_kind: t.kind,
      activation_mode: t.activation_mode ?? 'interaction',
      bounds: t.bounds,
    })),
  );
  const lostEcho = PARSED_PRIMARY_MAP.triggers.filter(isLostEchoDemoTrigger);
  console.info('[LhDemo] lost_echo_demo triggers', lostEcho);
  const syntheticLost = lostEcho.filter((t) => t.layer_name === 'demo_synthetic_guidance');
  console.info('[LhDemo] synthetic Lost Echo fallback present?', syntheticLost.length > 0, syntheticLost);
}

const LOST_ECHO_DEMO_INTERACTABLE_IDS = PARSED_PRIMARY_MAP.triggers
  .filter(isLostEchoDemoTrigger)
  .map((t) => makeTriggerInteractableId(PRIMARY_WORLD_TRIGGER_REALM_ID, t.tiled_object_id));

export function useNightOneFlow() {
  const maiaDebug =
    import.meta.env.DEV || import.meta.env.VITE_LH_MAIA_DEBUG === 'true' || import.meta.env.VITE_LH_MAIA_DEBUG === true;
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

  // --- Map variant selector (title screen) ---
  const [mapVariant, setMapVariant] = useState<'current' | 'stable'>('current');
  const [stableMapState, setStableMapState] = useState<{
    loading: boolean;
    map: ParsedLhMap | null;
    error: string | null;
  }>({ loading: false, map: null, error: null });
  const stableMapFetchedRef = useRef(false);

  const [pauseOpen, setPauseOpen] = useState(false);
  const [facilitatorBusy, setFacilitatorBusy] = useState(false);
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<
    | {
        tone: 'success' | 'error';
        text: string;
        retryLabel?: string;
        onRetry?: () => void;
      }
    | null
  >(null);
  const [maiaHandoffActive, setMaiaHandoffActive] = useState(false);
  const [maiaHandoffPromptActive, setMaiaHandoffPromptActive] = useState(false);
  const maiaHandoffPollRef = useRef<number | null>(null);
  const maiaHandoffWindowRef = useRef<Window | null>(null);
  const maiaHandoffOpenedAtRef = useRef<number>(0);
  const maiaHandoffClosedOnceRef = useRef(false);
  const [realmAtlasOpen, setRealmAtlasOpen] = useState(false);
  /** Pause → World Atlas entry: optional guild sheet first + fog lift after close (guild HQ research trigger). */
  const [realmAtlasEntryIntent, setRealmAtlasEntryIntent] = useState<{
    initialGuildRealmId: string | null;
    fogRevealRealmId: string | null;
  }>({ initialGuildRealmId: null, fogRevealRealmId: null });
  /** Phaser guild HQ enter tween completed; fire exit walk when this atlas closes (see `closeRealmAtlas`). */
  const phaserGuildResearchExitWhenAtlasClosedRef = useRef<string | null>(null);

  const consumeRealmAtlasInitialGuildIntent = useCallback(() => {
    setRealmAtlasEntryIntent((prev) => ({ ...prev, initialGuildRealmId: null }));
  }, []);

  const consumeRealmAtlasFogRevealIntent = useCallback(() => {
    setRealmAtlasEntryIntent((prev) => ({ ...prev, fogRevealRealmId: null }));
    setExploration((e) => {
      const prevStage = ensureDemoGuidanceState(e).stage_id;
      const next = advanceDemoGuidanceStage(e, 'demo_fog_revealed');
      const nextStage = ensureDemoGuidanceState(next).stage_id;
      logDemoLoadAudit('demo_guidance advance (fog reveal atlas consumed)', {
        condition: 'RealmAtlasOverlay completed fog lift → consumeRealmAtlasFogRevealIntent',
        prev_stage_id: prevStage,
        next_stage_id: nextStage,
        note: 'Next slice step is usually Master Scribe dialogue at demo_fog_revealed; dismiss advances to demo_slice_complete.',
      });
      return next;
    });
  }, []);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  /** Inline message when travel is blocked (shown inside World Map overlay). */
  const [realmTravelNotice, setRealmTravelNotice] = useState<string | null>(null);
  const [academicWorksheetsOpen, setAcademicWorksheetsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [moduleHostOpen, setModuleHostOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [bootstrapPhase, setBootstrapPhase] = useState<'idle' | 'loading' | 'error'>('idle');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [realmProgress, setRealmProgress] = useState<RealmProgressMap>({});
  const [exploration, setExploration] = useState<ExplorationLoopState>(() => createEmptyExplorationLoopState());
  /** DEV / slice testing: bump to remount Phaser so session-only trigger latches reset. */
  const [phaserExplorationRemountKey, setPhaserExplorationRemountKey] = useState(0);
  /** Nudges interview deadline / pause GT-102 gating when wall-clock crosses the return window. */
  const [guildInterviewInviteTimerTick, setGuildInterviewInviteTimerTick] = useState(0);
  const [ledgerDraft, setLedgerDraft] = useState(emptyLedgerDraft);
  const [npcDialogue, setNpcDialogue] = useState<LhNpcDialogueOverlayModel | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<EncounterLaunchPayload | null>(null);
  const activeEncounterRef = useRef<EncounterLaunchPayload | null>(null);
  activeEncounterRef.current = activeEncounter;

  /** Active guild / HQ / narrative row — `current_realm_id` on the player save. */
  const realm = useMemo(() => {
    if (!player) return BLUEPRINT.realm;
    return resolveActiveRealm(allRealms, player.current_realm_id);
  }, [player, allRealms]);

  const activeQuestDefinition = useMemo(
    () => (player ? quests.find((q) => q.quest_id === player.active_main_quest_id) ?? null : null),
    [player, quests],
  );

  const showQuestDebug = import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true';
  const demoGuidance = useMemo(() => ensureDemoGuidanceState(exploration), [exploration.demo_guidance_v1]);

  useEffect(() => {
    if (screen === 'explore' && player) {
      const rid = player.current_realm_id;
      setRealmProgress((p) => touchRealmEntered(p, rid));
    }
  }, [screen, player?.current_realm_id]);

  useEffect(() => {
    if (!player || player.required_next_action === demoGuidance.current_objective) return;
    setPlayer((p) => (p ? applyDemoObjectiveToPlayer(p, demoGuidance.current_objective) : p));
  }, [demoGuidance.current_objective, player?.required_next_action]);

  // Lazy-load the stable map the first time the user selects it on the title screen.
  useEffect(() => {
    if (mapVariant !== 'stable') return;
    if (stableMapFetchedRef.current) return;
    stableMapFetchedRef.current = true;
    setStableMapState({ loading: true, map: null, error: null });
    let cancelled = false;
    void fetch(`${import.meta.env.BASE_URL}assets/maps/Legendary_Horizon_Map_before_move_towards_final.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — stable map not found`);
        return res.json() as Promise<unknown>;
      })
      .then((json) => {
        if (cancelled) return;
        const loaded = loadLhTiledMapPayload(json);
        const parsed = buildDemoGuidanceMap(
          loaded.ok ? loaded.map : getEmptyParsedLhMap(BLUEPRINT.realm?.realm_id, loaded.errors),
        );
        setStableMapState({ loading: false, map: parsed, error: loaded.ok ? null : loaded.errors.join('; ') });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        stableMapFetchedRef.current = false; // allow retry after error
        setStableMapState({ loading: false, map: null, error: msg });
      });
    return () => { cancelled = true; };
  }, [mapVariant]);

  useEffect(() => {
    return () => {
      if (maiaHandoffPollRef.current !== null) {
        window.clearInterval(maiaHandoffPollRef.current);
        maiaHandoffPollRef.current = null;
      }
      maiaHandoffWindowRef.current = null;
    };
  }, []);

  const finalizeMaiaHandoffClosed = useCallback(() => {
    if (maiaHandoffClosedOnceRef.current) return;
    maiaHandoffClosedOnceRef.current = true;
    if (maiaDebug && typeof console !== 'undefined') {
      console.log('[MaiaHandoff]', 'finalizeMaiaHandoffClosed dispatching lh:maia-handoff-closed');
    }
    if (maiaHandoffPollRef.current !== null) {
      window.clearInterval(maiaHandoffPollRef.current);
      maiaHandoffPollRef.current = null;
    }
    maiaHandoffWindowRef.current = null;
    setMaiaHandoffActive(false);
    setMaiaHandoffPromptActive(false);
    setExploration((e) => advanceDemoGuidanceStage(e, 'demo_returned_from_maia'));
    window.dispatchEvent(new CustomEvent('lh:maia-handoff-closed'));
  }, []);

  const forceReturnFromMaia = useCallback(() => {
    // Manual return should always be able to fire, even if a prior handoff already closed.
    maiaHandoffClosedOnceRef.current = false;
    finalizeMaiaHandoffClosed();
  }, [finalizeMaiaHandoffClosed]);

  const checkForMaiaWindowClosed = useCallback(() => {
    const w = maiaHandoffWindowRef.current;
    if (!w) return;
    // Avoid firing a "closed" reaction during the initial open jitter.
    if (Date.now() - maiaHandoffOpenedAtRef.current < 1500) return;
    let closed = false;
    try {
      closed = w.closed;
    } catch {
      // Some browsers may throw when accessing `closed` on cross-origin tabs — treat as closed in that case.
      closed = true;
    }
    if (maiaDebug && typeof console !== 'undefined') {
      let href = '';
      try {
        href = String(w.location?.href ?? '');
      } catch {
        href = '[unreadable-location]';
      }
      console.log('[MaiaHandoff]', 'poll check', { name: w.name, closed, href });
    }
    if (!closed) return;
    finalizeMaiaHandoffClosed();
  }, [finalizeMaiaHandoffClosed]);

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

  const launchMaiaHandoffWindow = useCallback((): boolean => {
    const maiaUrl = buildMaiaLaunchUrl();
    // Single new tab only (named popups + _blank fallback caused duplicate tabs in Chrome).
    let w: Window | null = null;
    try {
      w = window.open(maiaUrl, '_blank', 'noopener,noreferrer');
    } catch {
      w = null;
    }
    if (!w) {
      if (typeof console !== 'undefined') {
        console.warn('[MaiaHandoff] window.open blocked — allow popups and tap Open Maia again.');
      }
      return false;
    }

    maiaHandoffClosedOnceRef.current = false;
    maiaHandoffWindowRef.current = w;
    maiaHandoffOpenedAtRef.current = Date.now();
    if (maiaDebug && typeof console !== 'undefined') {
      console.log('[MaiaHandoff]', 'maia window opened; starting close poll', { url: maiaUrl });
    }

    setMaiaHandoffActive(true);
    setMaiaHandoffPromptActive(false);
    setPauseOpen(false);
    window.dispatchEvent(new CustomEvent('lh:maia-handoff-opened'));

    if (maiaHandoffPollRef.current !== null) {
      window.clearInterval(maiaHandoffPollRef.current);
    }
    maiaHandoffPollRef.current = window.setInterval(() => {
      checkForMaiaWindowClosed();
    }, 750);
    return true;
  }, [checkForMaiaWindowClosed]);

  useEffect(() => {
    if (!maiaHandoffActive) return;
    const maybeFinalizeOnReturn = () => {
      // When the player comes back to the game tab after spending a bit of time in Maia,
      // assume the handoff is complete even if `w.closed` was not observable.
      if (Date.now() - maiaHandoffOpenedAtRef.current < 4000) return;
      if (!maiaHandoffClosedOnceRef.current) {
        finalizeMaiaHandoffClosed();
      }
    };
    const onFocus = () => {
      checkForMaiaWindowClosed();
      if (!maiaHandoffClosedOnceRef.current) maybeFinalizeOnReturn();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        checkForMaiaWindowClosed();
        if (!maiaHandoffClosedOnceRef.current) maybeFinalizeOnReturn();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [maiaHandoffActive, checkForMaiaWindowClosed, finalizeMaiaHandoffClosed]);

  /** Production-shaped: show GT-101 on Pause only after in-map manager unlock + HQ context. */
  const pauseCanOpenGt101 = useMemo(() => {
    if (!player) return false;
    const devBypass = import.meta.env.DEV || import.meta.env.VITE_LH_PAUSE_MODULE_SHORTCUTS === 'true';
    if (devBypass) return false;
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    return Boolean(
      ge.application_unlocked &&
        !ge.application_sealed &&
        ge.true_path_realm_id &&
        player.current_realm_id === ge.true_path_realm_id,
    );
  }, [player, exploration.guild_endgame_v1]);

  /** Post–GT-101 breather: submitted, under review, not yet in interview invitation flow. */
  const guildBreatherSurface = useMemo(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (ge.phase !== 'breather' || !ge.application_sealed || ge.interview_invited) return null;
    return {
      bannerTitle: GUILD_GT101_BREATHER_BANNER_TITLE,
      bannerBody: GUILD_GT101_BREATHER_BANNER_BODY,
      questLogNote: GUILD_GT101_BREATHER_QUEST_LOG_NOTE,
    };
  }, [exploration.guild_endgame_v1]);

  /** Guild Manager summons — active interview invitation (deadline is a professionalism check, not a hard lock). */
  const guildInterviewInviteSurface = useMemo(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (!ge.interview_invited) return null;
    const iso = ge.interview_deadline_iso?.trim();
    if (!iso) return null;
    const dl = formatGuildInterviewDeadlineForPlayer(iso);
    const late = isGuildInterviewDeadlinePassed(iso);
    return {
      bannerTitle: late ? GUILD_INTERVIEW_INVITE_LATE_BANNER_TITLE : GUILD_INTERVIEW_INVITE_BANNER_TITLE,
      bannerBody: buildGuildInterviewInviteBannerBody(dl, late),
      questLogNote: buildGuildInterviewInviteQuestLogNote(dl, late),
    };
  }, [exploration.guild_endgame_v1, guildInterviewInviteTimerTick]);

  const guildGt102RetrySurface = useMemo(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (ge.phase !== 'interview_failed_pending_retry' || !ge.application_sealed) return null;
    return {
      bannerTitle: GUILD_GT102_RETRY_BANNER_TITLE,
      bannerBody: GUILD_GT102_RETRY_BANNER_BODY,
      questLogNote: GUILD_GT102_RETRY_QUEST_LOG_NOTE,
    };
  }, [exploration.guild_endgame_v1]);

  /** Post–GT-102 acceptance beat (`guild_accepted_v1`; legacy `interview_passed` migrates in an effect below). */
  const guildAcceptanceSurface = useMemo(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (ge.phase !== 'guild_accepted_v1' && ge.phase !== 'interview_passed') return null;
    return {
      bannerTitle: GUILD_ACCEPTANCE_BANNER_TITLE,
      bannerBody: GUILD_ACCEPTANCE_BANNER_BODY,
      questLogNote: GUILD_ACCEPTANCE_QUEST_LOG_NOTE,
    };
  }, [exploration.guild_endgame_v1]);

  const guildPathExplorationBanner = useMemo(
    () =>
      guildGt102RetrySurface ??
      guildInterviewInviteSurface ??
      guildAcceptanceSurface ??
      guildBreatherSurface ??
      null,
    [guildGt102RetrySurface, guildInterviewInviteSurface, guildAcceptanceSurface, guildBreatherSurface],
  );

  const guildPathQuestLogNote = useMemo(
    () =>
      guildGt102RetrySurface?.questLogNote ??
      guildInterviewInviteSurface?.questLogNote ??
      guildAcceptanceSurface?.questLogNote ??
      guildBreatherSurface?.questLogNote ??
      null,
    [guildGt102RetrySurface, guildInterviewInviteSurface, guildAcceptanceSurface, guildBreatherSurface],
  );

  /** Production: GT-102 with summons + HQ match (return deadline affects scoring, not availability). */
  const pauseCanOpenGt102 = useMemo(() => {
    if (!player) return false;
    const devBypass = import.meta.env.DEV || import.meta.env.VITE_LH_PAUSE_MODULE_SHORTCUTS === 'true';
    if (devBypass) return false;
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (!ge.interview_invited || !ge.true_path_realm_id) return false;
    return player.current_realm_id === ge.true_path_realm_id;
  }, [player, exploration.guild_endgame_v1, guildInterviewInviteTimerTick]);

  /** True when the player may open GT-102 and the HQ return deadline has passed (professionalism lane). */
  const gt102InterviewArrivalMissedDeadline = useMemo(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    const iso = ge.interview_deadline_iso?.trim();
    if (!ge.interview_invited || !iso) return false;
    return isGuildInterviewDeadlinePassed(iso);
  }, [exploration.guild_endgame_v1, guildInterviewInviteTimerTick]);

  useEffect(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (!ge.interview_invited || !ge.interview_deadline_iso?.trim()) return;
    const id = window.setInterval(() => {
      setGuildInterviewInviteTimerTick((n) => n + 1);
    }, 8000);
    return () => window.clearInterval(id);
  }, [exploration.guild_endgame_v1?.interview_invited, exploration.guild_endgame_v1?.interview_deadline_iso]);

  useEffect(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (!ge.interview_invited || ge.interview_deadline_iso?.trim()) return;
    if (ge.phase === 'interview_failed_pending_retry') return;
    const deadlineIso = computeGuildInterviewDeadlineIso();
    const dl = formatGuildInterviewDeadlineForPlayer(deadlineIso);
    setExploration((e) =>
      mergeGuildEndgameIntoExploration(e, {
        interview_deadline_iso: deadlineIso,
      }),
    );
    setPlayer((p) =>
      p ? { ...p, required_next_action: buildGuildInterviewInvitedRequiredNextAction(dl) } : p,
    );
  }, [exploration.guild_endgame_v1?.interview_invited, exploration.guild_endgame_v1?.interview_deadline_iso]);

  /** Legacy: prior build used `interview_invitation_expired` — normalize back to an open invitation lane. */
  useEffect(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (ge.phase !== 'interview_invitation_expired') return;
    setExploration((e) =>
      mergeGuildEndgameIntoExploration(e, {
        phase: 'interview_invited',
        interview_invited: true,
        interview_deadline_iso:
          ge.interview_deadline_iso?.trim() || computeGuildInterviewDeadlineIso(),
      }),
    );
  }, [exploration.guild_endgame_v1?.phase]);

  /** Legacy: `interview_passed` → canonical post-interview acceptance phase. */
  useEffect(() => {
    const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
    if (ge.phase !== 'interview_passed' || ge.last_interview_outcome !== 'passed') return;
    setExploration((e) => mergeGuildEndgameIntoExploration(e, { phase: 'guild_accepted_v1' }));
    setPlayer((p) =>
      p ? { ...p, required_next_action: GUILD_ACCEPTANCE_REQUIRED_NEXT_ACTION } : p,
    );
  }, [exploration.guild_endgame_v1?.phase, exploration.guild_endgame_v1?.last_interview_outcome]);

  const beginDemo = useCallback(async () => {
    setBootstrapPhase('loading');
    setBootstrapError(null);
    try {
      // Flush any pending save that was interrupted by a tab-close or network drop.
      // Fire-and-forget: a failed flush must not block startup or show an error.
      if (hasPendingSave()) {
        const pendingEnvelope = readPendingSave();
        if (pendingEnvelope) {
          void persistManualSaveEnvelope({
            ...pendingEnvelope,
            save_kind: pendingEnvelope.save_kind ?? 'auto',
          }).then((result) => {
            if (result.ok) {
              clearPendingSave();
              if (typeof console !== 'undefined') {
                console.info('[LhPendingSave]', 'Flushed pending save on startup.');
              }
            } else if (typeof console !== 'undefined') {
              console.warn('[LhPendingSave]', 'Startup flush failed — will retry on next save.', result.message);
            }
          });
        }
      }

      if (!rosterResolution.matched && typeof console !== 'undefined') {
        console.warn(
          '[LhRoster]',
          rosterResolution.reason ?? 'Roster heuristic did not match fixture save — QA only.',
        );
      } else if (typeof console !== 'undefined') {
        console.info('[LhRoster]', 'Matched roster fixture ↔ demo save row:', rosterResolution);
      }

      const persisted = await fetchPersistedDemoSession(seededPlayerSeed, seededQuestSeed, {
        allowLocalCache: false,
        mode: 'canonical',
      });
      const rawLoop = persisted.rawExplorationLoopFromRemote;
      const rawDemo =
        rawLoop && typeof rawLoop === 'object' && !Array.isArray(rawLoop)
          ? (rawLoop as Record<string, unknown>).demo_guidance_v1
          : undefined;
      logDemoLoadAudit('before normalize (loaded persistence)', {
        load_source: persisted.source,
        roster_fixture_matched: rosterResolution.matched,
        raw_exploration_loop_demo_guidance_v1: rawDemo ?? null,
        raw_exploration_loop_keys:
          rawLoop && typeof rawLoop === 'object' && !Array.isArray(rawLoop)
            ? Object.keys(rawLoop as Record<string, unknown>)
            : null,
        visited_interactable_ids_before_finalize: [...persisted.visitedInit],
        exploration_after_coerce_demo_guidance_v1: persisted.explorationAfterCoerce.demo_guidance_v1,
      });

      const finalized = finalizeDemoBootstrapExploration({
        academicTaskDefs: BLUEPRINT.academic_worksheet_tasks,
        explorationAfterCoerce: persisted.explorationAfterCoerce,
        realmProgressInit: persisted.realmProgressInit,
        nextPlayer: persisted.nextPlayer,
      });

      logDemoLoadAudit('after normalize (finalizeDemoBootstrapExploration)', {
        load_source: persisted.source,
        demo_guidance_v1: finalized.exploration.demo_guidance_v1,
        guild_hq_atlas_revealed_realm_ids: finalized.exploration.guild_hq_atlas_revealed_realm_ids ?? [],
        visited_interactable_ids_unchanged_by_normalize: [...persisted.visitedInit],
      });

      const nextPlayer = finalized.nextPlayer;
      const explorationInit = finalized.exploration;
      const realmProgressInit = finalized.realmProgress;
      const visitedInit = persisted.visitedInit;
      const nextQuests = persisted.nextQuests;

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
    const forceIntro = lhDevBootPendingForceIntro;
    lhDevBootPendingForceIntro = false;
    setScreen(forceIntro ? 'intro' : 'gameTitle');
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

  const beginDemoRef = useRef(beginDemo);
  beginDemoRef.current = beginDemo;

  // DEV URL helpers: predictable intro restart without auto-skipping the title gate on every refresh.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (lhDevBootUrlQueryHandled) return;
    if (typeof window === 'undefined') return;
    const snap = readLhDevBootUrlSnapshot(window);
    if (!snap) return;
    lhDevBootUrlQueryHandled = true;
    lhDevBootPendingForceIntro = snap.forceIntro;
    window.history.replaceState({}, '', urlAfterLhDevBootCleanup(snap));
    if (snap.reset) {
      clearCachedFullState();
      if (typeof console !== 'undefined') {
        console.info(
          '[LhDev] lh_reset_demo=1 — cleared local full-state cache only; opening intro bootstrap. (Works in ?query=… or #fragment?query=…)',
        );
      }
    } else if (snap.forceIntro && typeof console !== 'undefined') {
      console.info(
        '[LhDev] lh_force_intro=1 — opening intro bootstrap (local cache unchanged). (Works in ?query=… or #fragment?query=…)',
      );
    }
    void beginDemoRef.current();
  }, []);

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

  const dismissNpcDialogue = useCallback(() => {
    const current = npcDialogue;
    setNpcDialogue(null);
    if (current?.npcId !== LH_NPC_ID_MASTER_SCRIBE) return;
    const nextStage = resolveMasterScribeNextStage(demoGuidance.stage_id);
    if (!nextStage) return;
    logDemoLoadAudit('demo_guidance advance (Master Scribe dialogue dismissed)', {
      condition: 'resolveMasterScribeNextStage(dismissNpcDialogue)',
      prev_stage_id: demoGuidance.stage_id,
      next_stage_id: nextStage,
    });
    setExploration((e) => {
      // Stamina reward is now granted on Lost Echo victory (no required return-to-scribe busywork).
      return advanceDemoGuidanceStage(e, nextStage);
    });
  }, [demoGuidance.stage_id, demoGuidance.stamina_upgrade_applied, npcDialogue]);

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
      let nextE = appendEncounterLog(capAward.nextExploration, {
        kind: cur.kind,
        outcome: 'win',
        xp_awarded: capAward.xpGranted,
        at_iso: new Date().toISOString(),
        interactable_id: cur.interactableId,
        target_quest_id: cur.target_quest_id,
      });
      const isDemoLostEcho = cur.kind === 'combat_encounter' && cur.presentation === 'jrpg_knowledge';
      if (isDemoLostEcho) {
        const stageBefore = ensureDemoGuidanceState(nextE).stage_id;
        const guided = ensureDemoGuidanceState(nextE);
        // Flow polish: after victory, continue directly to Aethelwood (no required return to Master Scribe).
        nextE = guided.stamina_upgrade_applied
          ? advanceDemoGuidanceStage(nextE, 'demo_seek_aethelwood_guild')
          : advanceDemoGuidanceStage(applyDemoStaminaReward(nextE), 'demo_seek_aethelwood_guild');
        logDemoLoadAudit('demo_guidance advance (Lost Echo encounter win)', {
          condition: 'handleEncounterWin + isLostEchoDemoTrigger',
          prev_stage_id: stageBefore,
          next_stage_id: ensureDemoGuidanceState(nextE).stage_id,
          stamina_upgrade_applied_after: ensureDemoGuidanceState(nextE).stamina_upgrade_applied,
        });
      }
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
      } else if (isDemoLostEcho) {
        setSaveFeedback({
          tone: 'success',
          text: "The Lost Echo dissolves. The Traveler’s Resolve deepens — continue to Aethelwood Farmsteads.",
        });
      } else if (cur.kind === 'combat_encounter') {
        setSaveFeedback({
          tone: 'success',
          text: 'Lost Echo defeated. Continue onward.',
        });
      }
    },
    [player, quests, exploration],
  );

  const handleTriggerActivation = useCallback(
    (interactableId: string, triggerMeta: ParsedLhTrigger) => {
      if (!player) {
        window.dispatchEvent(
          new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId } }),
        );
        return;
      }

      const kind = normaliseLhTriggerKind(String(triggerMeta.kind ?? ''));
      const lostEchoDemo = kind === 'combat_encounter' && isLostEchoDemoTrigger(triggerMeta);

      if (lostEchoDemo && demoGuidance.stage_id !== 'demo_combat_trial_available') {
        setSaveFeedback({
          tone: 'error',
          text:
            demoGuidance.stage_id === 'demo_combat_trial_complete'
              ? 'The Lost Echo has already yielded. Return to the Master Scribe.'
              : 'The road feels wrong. Return to the Master Scribe before facing the Lost Echo.',
        });
        return;
      }
      if (kind === 'maia_portal') {
        if (demoGuidance.stage_id !== 'demo_seek_maia') {
          setSaveFeedback({
            tone: 'error',
            text:
              demoGuidance.stage_id === 'demo_awakened'
                ? 'The Mirror is still. Speak with the Master Scribe first.'
                : 'The Mirror of Maia has already answered. Return to the Master Scribe.',
          });
          return;
        }
        // Manual "Return to game" must be able to fire each time.
        maiaHandoffClosedOnceRef.current = false;
        const nextVisited = visitedInteractableIds.includes(interactableId)
          ? visitedInteractableIds
          : [...visitedInteractableIds, interactableId];
        const nextExploration = advanceDemoGuidanceStage(exploration, 'demo_seek_maia');
        const nextDemoGuidance = ensureDemoGuidanceState(nextExploration);
        const nextPlayer: PlayerSave = {
          ...player,
          required_next_action: nextDemoGuidance.current_objective,
        };
        const nextRealmProgress = setRealmLearnedNotes(
          realmProgress,
          player.current_realm_id,
          'Mirror of Maia handoff demonstrated with teacher-reviewed Interest Profiler-style data.',
        );

        setPlayer(nextPlayer);
        setExploration(nextExploration);
        setRealmProgress(nextRealmProgress);
        setVisitedInteractableIds(nextVisited);
        setMaiaHandoffPromptActive(true);
        // Do NOT pause Phaser here; Phaser pauses itself when the portal handoff animation completes.

        void (async () => {
          const envelope = buildManualSaveEnvelope({
            player: nextPlayer,
            questsSnapshot: quests,
            realmId: realm.realm_id,
            visitedTriggerInteractableIds: nextVisited,
            exploration_loop: nextExploration,
            realm_progress: nextRealmProgress,
            ritual_drafts: ritualDraftsFromLedgerDraft(ledgerDraft),
            save_kind: 'manual',
          });
          const persist = await persistManualSaveEnvelope(envelope);
          if (!persist.ok) {
            if (typeof console !== 'undefined') {
              console.warn('[MaiaHandoff] Save after portal did not complete:', persist.message);
            }
            return;
          }
          tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_SAVE_CHIME, BLUEPRINT.media_assets);
        })();
        return;
      }

      if (kind === 'guild_hq_research') {
        const triggerRealm = String(triggerMeta.target_realm_id ?? '').trim() || player.current_realm_id;
        const revealed = new Set((exploration.guild_hq_atlas_revealed_realm_ids ?? []).map((id) => String(id || '').trim()).filter(Boolean));
        const truePathRealm = String(exploration.guild_endgame_v1?.true_path_realm_id ?? '').trim();

        if (typeof console !== 'undefined') {
          console.info('[LhTrigger Hook]', 'guild_hq_research dispatch', {
            interactableId,
            tiled_object_id: triggerMeta.tiled_object_id,
            tiled_name: triggerMeta.tiled_name,
            lh_kind: triggerMeta.kind,
            target_realm_id: triggerMeta.target_realm_id,
            resolved_trigger_realm: triggerRealm,
          });
        }

        if (triggerRealm !== 'realm_aethelwood') {
          setSaveFeedback({
            tone: 'error',
            text: `This guild research trigger is pointing at ${triggerRealm || 'no realm'} instead of Aethelwood. Check the Tiled lh_realm_id property.`,
          });
          window.dispatchEvent(
            new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId } }),
          );
          return;
        }

        // After first visit + atlas fog, physical doors close until the traveler commits to a True Path guild.
        if (revealed.has(triggerRealm)) {
          if (truePathRealm && truePathRealm === triggerRealm && canReenterChosenGuildHq(demoGuidance.stage_id)) {
            setRealmAtlasEntryIntent({ initialGuildRealmId: triggerRealm, fogRevealRealmId: null });
            phaserGuildResearchExitWhenAtlasClosedRef.current = interactableId;
            playLhSfx('door_open');
            setPauseOpen(false);
            setRealmAtlasOpen(true);
            return;
          }
          setSaveFeedback({
            tone: 'error',
            text: truePathRealm
              ? 'The guild hall doors are closed. Only your chosen True Path headquarters will receive you in-world.'
              : 'The guild hall doors are closed. Choose your True Path on the World Atlas, then return to your guild headquarters.',
          });
          window.dispatchEvent(
            new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId, mode: 'blocked' } }),
          );
          return;
        }

        if (!canDiscoverGuildHqResearch(demoGuidance.stage_id)) {
          setSaveFeedback({
            tone: 'error',
            text: 'The guild roads are not ready. Follow the Master Scribe’s guidance first.',
          });
          window.dispatchEvent(
            new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId, mode: 'blocked' } }),
          );
          return;
        }
        // Shared overworld: physical trigger zone is authoritative — do not require `current_realm_id`
        // to match (that field tracks narrative/UI focus and may lag while exploring the big map).

        setExploration((e) => {
          const prev = ensureDemoGuidanceState(e).stage_id;
          const next = advanceDemoGuidanceStage(mergeGuildHqAtlasRevealed(e, triggerRealm), 'demo_guild_research_complete');
          logDemoLoadAudit('demo_guidance advance (guild HQ research trigger)', {
            condition: 'guild_hq_research overlap → atlas + stage minimum demo_guild_research_complete',
            prev_stage_id: prev,
            next_stage_id: ensureDemoGuidanceState(next).stage_id,
            trigger_realm: triggerRealm,
          });
          return next;
        });
        setRealmAtlasEntryIntent({
          initialGuildRealmId: triggerRealm,
          fogRevealRealmId: triggerRealm,
        });
        phaserGuildResearchExitWhenAtlasClosedRef.current = interactableId;
        playLhSfx('door_open');
        setPauseOpen(false);
        setRealmAtlasOpen(true);
        return;
      }

      if (kind === 'guild_interview_invite') {
        if (visitedInteractableIds.includes(interactableId)) return;

        const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        const triggerRealm = String(triggerMeta.target_realm_id ?? '').trim() || 'realm_aethelwood';

        if (!ge.true_path_realm_id) {
          setSaveFeedback({
            tone: 'error',
            text: 'The porter finds no charter on file. Set your guild headquarters on the world map before claiming a summons.',
          });
          return;
        }
        if (ge.true_path_realm_id !== triggerRealm) {
          setSaveFeedback({
            tone: 'error',
            text: 'This summons bears another guild’s seal — you are at the wrong hall.',
          });
          return;
        }
        if (player.current_realm_id !== ge.true_path_realm_id) {
          setSaveFeedback({
            tone: 'error',
            text: 'Your active guild focus does not match this summons. Open the world map and align your charter with this guild.',
          });
          return;
        }
        if (ge.interview_invited) {
          const iso = ge.interview_deadline_iso?.trim();
          const dl = iso ? formatGuildInterviewDeadlineForPlayer(iso) : 'the hour on your summons';
          const late = Boolean(iso && isGuildInterviewDeadlinePassed(iso));
          setExploration((e) => mergeGuildHqAtlasRevealed(e, triggerRealm));
          setSaveFeedback({
            tone: 'success',
            text: buildGuildInterviewAlreadySummonsToast(dl, late),
          });
          setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
          return;
        }
        if (!ge.application_sealed || ge.phase !== 'breather') {
          setSaveFeedback({
            tone: 'error',
            text: 'The porter has no interview scroll for you yet — finish and seal your application first, then await the Guild’s review.',
          });
          return;
        }

        const deadlineIso = computeGuildInterviewDeadlineIso();
        const deadlineLabel = formatGuildInterviewDeadlineForPlayer(deadlineIso);

        setExploration((e) =>
          mergeGuildHqAtlasRevealed(
            mergeGuildEndgameIntoExploration(e, {
              interview_invited: true,
              phase: 'interview_invited',
              interview_deadline_iso: deadlineIso,
            }),
            triggerRealm,
          ),
        );
        setPlayer((p) =>
          p
            ? {
                ...p,
                required_next_action: buildGuildInterviewInvitedRequiredNextAction(deadlineLabel),
              }
            : p,
        );
        setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'gt-102')));
        setSaveFeedback({ tone: 'success', text: buildGuildInterviewInviteToast(deadlineLabel) });
        setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
        return;
      }

      if (kind === 'guild_manager_hq') {
        const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        const triggerRealm = String(triggerMeta.target_realm_id ?? '').trim() || 'realm_aethelwood';

        if (!ge.true_path_realm_id) {
          setSaveFeedback({
            tone: 'error',
            text: 'The Guild Manager waits for a chosen path. Open the world map and set your active guild headquarters to the guild you intend to walk.',
          });
          return;
        }
        if (ge.true_path_realm_id !== triggerRealm) {
          setSaveFeedback({
            tone: 'error',
            text: 'This desk belongs to another guild. Travel to your chosen guild headquarters on the map.',
          });
          return;
        }
        if (player.current_realm_id !== ge.true_path_realm_id) {
          setSaveFeedback({
            tone: 'error',
            text: 'Your charter still lists another guild as active. Open the world map and align your guild focus with this hall before speaking with the manager.',
          });
          return;
        }

        const markDeskVisited = () =>
          setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));

        const revealAtlasForThisHq = () =>
          setExploration((e) => mergeGuildHqAtlasRevealed(e, triggerRealm));

        if (ge.phase === 'guild_accepted_v1') {
          revealAtlasForThisHq();
          setSaveFeedback({ tone: 'success', text: GUILD_MANAGER_DESK_POST_ACCEPTANCE });
          markDeskVisited();
          return;
        }
        if (ge.phase === 'interview_failed_pending_retry' && ge.application_sealed) {
          revealAtlasForThisHq();
          setSaveFeedback({ tone: 'success', text: GUILD_MANAGER_DESK_INTERVIEW_RETRY });
          markDeskVisited();
          return;
        }
        if (ge.application_sealed && ge.interview_invited) {
          revealAtlasForThisHq();
          setSaveFeedback({ tone: 'success', text: GUILD_MANAGER_DESK_SUMMONS_ACTIVE });
          markDeskVisited();
          return;
        }
        if (ge.application_sealed) {
          revealAtlasForThisHq();
          setSaveFeedback({
            tone: 'success',
            text: 'The Guild Manager greets you warmly — your application is already on file.',
          });
          markDeskVisited();
          return;
        }
        if (ge.application_unlocked) {
          revealAtlasForThisHq();
          setSaveFeedback({
            tone: 'success',
            text: 'The Guild Manager places the application before you again. Complete the Enrollment Rune while your charter is aligned with this hall.',
          });
          setPauseOpen(false);
          setActiveModuleId('mod_gt101_enrollment_rune');
          setModuleHostOpen(true);
          markDeskVisited();
          return;
        }

        if (visitedInteractableIds.includes(interactableId)) return;

        setExploration((e) =>
          mergeGuildHqAtlasRevealed(
            mergeGuildEndgameIntoExploration(e, {
              application_unlocked: true,
              phase: 'application_available',
            }),
            triggerRealm,
          ),
        );
        setSaveFeedback({
          tone: 'success',
          text: 'Welcome, traveler. The Guild Manager opens the Enrollment Rune and hands you the application for this hall.',
        });
        setPauseOpen(false);
        setActiveModuleId('mod_gt101_enrollment_rune');
        setModuleHostOpen(true);
        markDeskVisited();
        return;
      }

      if (kind === 'fog_clear') {
        const fogKey = triggerMeta.fog_key;
        if (fogKey) {
          // Same gate as clearFogKey: fog clearing requires mq-203 completion.
          const vault = quests.find((q) => q.quest_id === 'mq-203');
          if (vault && isTerminalQuestStatus(vault.status)) {
            setExploration((e) =>
              e.fog_keys_cleared.includes(fogKey)
                ? e
                : { ...e, fog_keys_cleared: [...e.fog_keys_cleared, fogKey] },
            );
          }
        } else if (import.meta.env.DEV && typeof console !== 'undefined') {
          console.warn('[LhTrigger] fog_clear trigger has no lh_fog_key — set it in Tiled', { interactableId });
        }
        setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
        return;
      }

      if (
        visitedInteractableIds.includes(interactableId) &&
        !(lostEchoDemo && demoGuidance.stage_id === 'demo_combat_trial_available')
      ) {
        if (SHOW_TRIGGER_PARSE_DEBUG && typeof console !== 'undefined') {
          console.info('[LhDemo] trigger skipped (visited)', { interactableId, lostEchoDemo, stage: demoGuidance.stage_id });
        }
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
        const jrpgLostEcho =
          result.openEncounter.kind === 'combat_encounter' && isLostEchoDemoTrigger(triggerMeta);
        if (jrpgLostEcho) {
          getLhAudioDirector().primeBattleMusicFromUserGesture();
        }
        setActiveEncounter({
          kind: result.openEncounter.kind,
          interactableId: result.openEncounter.interactableId,
          target_quest_id: result.openEncounter.target_quest_id,
          title: triggerMeta.interaction_label_active,
          ...(jrpgLostEcho ? { presentation: 'jrpg_knowledge' as const, enemyTemplateId: 'lost_echo' as const } : {}),
        });
        return;
      }

      if (result.openNpcDialogue) {
        const npc = findNpcEntry(BLUEPRINT.npc_registry, result.openNpcDialogue.npcId);
        const isMasterScribe = result.openNpcDialogue.npcId === LH_NPC_ID_MASTER_SCRIBE;
        const resolved = isMasterScribe
          ? resolveMasterScribeDialogue(demoGuidance.stage_id)
          : null;
        const body =
          resolved?.body ??
          resolveNpcDialogueBody(
            result.openNpcDialogue.npcId,
            BLUEPRINT.dialogue_catalog,
            BLUEPRINT.npc_registry,
            { player: result.nextPlayer, realm, quests: result.nextQuests },
          ).body;
        const aid = npc?.portrait_asset_id;
        const portraitUrl = aid ? resolveAssetDeliveryUrl(aid, BLUEPRINT.media_assets) : '';
        if (isMasterScribe) {
          setExploration((e) =>
            mergeDemoGuidanceState(e, {
              last_npc_interaction_id: resolved?.lineId ?? 'demo_master_scribe_unknown',
            }),
          );
        }
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
    [player, quests, visitedInteractableIds, realm, exploration, realmProgress, ledgerDraft, launchMaiaHandoffWindow, demoGuidance.stage_id],
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
        hit.kind === 'vocab_battle' ||
        hit.kind === 'guild_manager_hq' ||
        hit.kind === 'guild_hq_research' ||
        hit.kind === 'guild_interview_invite' ||
        hit.kind === 'maia_portal',
    );

    return relevant.map((trigger) => {
      const interactableId = makeTriggerInteractableId(PRIMARY_WORLD_TRIGGER_REALM_ID, trigger.tiled_object_id);
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
  }, [visitedInteractableIds]);

  const hotspotIndex = useMemo(() => {
    const map = new Map<string, ParsedLhTrigger>();
    PARSED_PRIMARY_MAP.triggers.forEach((trigger) => {
      map.set(makeTriggerInteractableId(PRIMARY_WORLD_TRIGGER_REALM_ID, trigger.tiled_object_id), trigger);
    });
    // When the stable map is active, its trigger IDs differ from PARSED_PRIMARY_MAP.
    // Index those triggers too so Phaser activations on the stable map resolve correctly.
    if (mapVariant === 'stable' && stableMapState.map) {
      stableMapState.map.triggers.forEach((trigger) => {
        const key = makeTriggerInteractableId(PRIMARY_WORLD_TRIGGER_REALM_ID, trigger.tiled_object_id);
        if (!map.has(key)) {
          map.set(key, trigger);
        }
      });
    }
    return map;
  }, [mapVariant, stableMapState.map]);

  useEffect(() => {
    if (screen !== 'explore' || !player) return;
    const validation = validatePlayerForManualSave(player);
    if (validation.length) return;

    const handle = window.setTimeout(() => {
      void (async () => {
        if (DEMO_LOAD_AUDIT && typeof console !== 'undefined') {
          console.info('[LhDemoLoadAudit] auto-save firing (debounced ~3.5s after last explore dependency change)', {
            save_kind: 'auto',
            demo_guidance_stage_id: exploration.demo_guidance_v1?.stage_id,
            visited_trigger_count: visitedInteractableIds.length,
            note: 'Persists current in-memory exploration_loop (including demo_guidance_v1) to Apps Script or simulated sink.',
          });
        }
        const envelope = buildManualSaveEnvelope({
          player,
          questsSnapshot: quests,
          realmId: realm.realm_id,
          visitedTriggerInteractableIds: visitedInteractableIds,
          exploration_loop: exploration,
          realm_progress: realmProgress,
          ritual_drafts: ritualDraftsFromLedgerDraft(ledgerDraft),
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
    ledgerDraft,
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
      ritual_drafts: ritualDraftsFromLedgerDraft(ledgerDraft),
      save_kind: 'manual',
    });

    setSaveFeedback({ tone: 'success', text: 'Saving…' });

    const persist = await persistManualSaveEnvelope(envelope);
    setPauseOpen(false);

    if (!persist.ok) {
      // writePendingSave was already called inside persistManualSaveEnvelope before the POST.
      setSaveFeedback({
        tone: 'error',
        text: '⚠ Save failed — will retry',
        retryLabel: 'Retry save',
        onRetry: () => {
          void handleManualSave();
        },
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
      ritual_drafts: ritualDraftsFromLedgerDraft(ledgerDraft),
      save_kind: 'manual',
    });

    const persist = await persistManualSaveEnvelope(envelope);
    setPauseOpen(false);

    if (!persist.ok) {
      setSaveFeedback({
        tone: 'error',
        text: persist.message + (persist.errors ? `\n${persist.errors.join('\n')}` : ''),
        retryLabel: 'Retry end session',
        onRetry: () => {
          void handleEndSessionRitual();
        },
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

  /** World map: set active guild/HQ context (does not swap the explorable tilemap). */
  const enterRealmFromWorldMap = useCallback(
    (realmId: string) => {
      const target = getRealmById(allRealms, realmId);
      if (!target) {
        setRealmTravelNotice('That realm is not in the canon registry — selection cancelled.');
        return;
      }
      setRealmTravelNotice(null);
      setPlayer((p) => (p ? { ...p, current_realm_id: realmId } : p));
      setExploration((e) => {
        const ge = e.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        if (ge.application_unlocked || ge.application_sealed) return e;
        return mergeGuildEndgameIntoExploration(e, {
          true_path_realm_id: realmId,
          phase: 'true_path_chosen',
        });
      });
      setWorldMapOpen(false);
      setScreen('explore');
    },
    [allRealms],
  );

  const clearFogKey = useCallback(
    (key: string) => {
      const vault = quests.find((q) => q.quest_id === 'mq-203');
      if (!vault || !isTerminalQuestStatus(vault.status)) return;
      setExploration((e) =>
        e.fog_keys_cleared.includes(key) ? e : { ...e, fog_keys_cleared: [...e.fog_keys_cleared, key] },
      );
    },
    [quests],
  );

  const researchRealm = useCallback(
    (realmId: string) => {
      const vault = quests.find((q) => q.quest_id === 'mq-203');
      if (!vault || !isTerminalQuestStatus(vault.status)) return;
      setRealmProgress((p) => markResearchComplete(p, realmId));
    },
    [quests],
  );

  const updateRealmNotes = useCallback(
    (realmId: string, notes: string) => {
      const vault = quests.find((q) => q.quest_id === 'mq-203');
      if (!vault || !isTerminalQuestStatus(vault.status)) return;
      setRealmProgress((p) => setRealmLearnedNotes(p, realmId, notes));
    },
    [quests],
  );

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

  const applyModuleResult = useCallback((payload: ModuleResultPayload) => {
    if (!payload?.module_id) return;

    if (payload.module_id === 'mod_gt101_enrollment_rune' && payload.status === 'submitted') {
      setExploration((e) => {
        const cur = e.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        const tp =
          cur.true_path_realm_id ??
          (typeof payload.realm_id === 'string' && payload.realm_id.trim() ? payload.realm_id.trim() : null);
        return mergeGuildEndgameIntoExploration(e, {
          application_sealed: true,
          phase: 'breather',
          true_path_realm_id: tp,
        });
      });
      setPlayer((p) =>
        p
          ? {
              ...p,
              required_next_action: GUILD_GT101_BREATHER_REQUIRED_NEXT_ACTION,
            }
          : p,
      );
      setSaveFeedback({ tone: 'success', text: GUILD_GT101_BREATHER_SEAL_TOAST });
    }

    if (
      payload.module_id === 'mod_gt102_trial_of_tongues' &&
      (payload.status === 'passed' || payload.status === 'failed')
    ) {
      if (payload.status === 'passed') {
        setExploration((e) =>
          mergeGuildEndgameIntoExploration(e, {
            last_interview_outcome: 'passed',
            phase: 'guild_accepted_v1',
            interview_invited: false,
            interview_deadline_iso: null,
          }),
        );
        setPlayer((p) =>
          p ? { ...p, required_next_action: GUILD_ACCEPTANCE_REQUIRED_NEXT_ACTION } : p,
        );
        setSaveFeedback({ tone: 'success', text: GUILD_ACCEPTANCE_PASS_SEAL_TOAST });
      } else {
        setExploration((e) =>
          mergeGuildEndgameIntoExploration(e, {
            last_interview_outcome: 'failed',
            phase: 'interview_failed_pending_retry',
            interview_invited: true,
            interview_deadline_iso: null,
          }),
        );
        setPlayer((p) =>
          p ? { ...p, required_next_action: GUILD_GT102_RETRY_REQUIRED_NEXT_ACTION } : p,
        );
        setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'gt-102')));
        setSaveFeedback({ tone: 'success', text: GUILD_GT102_FAIL_SEAL_TOAST });
      }
    }

    if (
      payload.module_id === 'mod_manifest_sod' &&
      (payload.status === 'completed' || payload.status === 'submitted')
    ) {
      const raw = payload.artifacts?.foretold_signpost_realm_ids;
      if (Array.isArray(raw)) {
        const allowed = new Set(CANON_REALMS.map((r) => r.realm_id));
        const ids = normalizeForetoldSignpostRealmIds(
          raw.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean),
          allowed,
        );
        if (ids.length === 3) {
          setExploration((e) => ({ ...e, foretold_signpost_realm_ids: ids }));
        }
      }
    }

    // Mark the owning quest completed if the module finished in a terminal “success” state.
    if (payload.quest_id && (payload.status === 'submitted' || payload.status === 'completed' || payload.status === 'passed')) {
      setQuests((q) => markQuestCompleted(q, payload.quest_id));
    }

    // Guild interview unlock is deferred to `guild_endgame_v1` gates (interview_invited + HQ; deadline affects GT-102 scoring), not GT-101 unlock shortcuts.
  }, []);

  const submitLedgerEntry = useCallback(
    (partial: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'>) => {
      const vault = quests.find((q) => q.quest_id === 'mq-203');
      if (!vault || !isTerminalQuestStatus(vault.status)) return;
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
      const entriesAfter = [...exploration.ledger_entries, entry];
      const scrollMs = signpostLedgerMilestone(entriesAfter, exploration.foretold_signpost_realm_ids);
      setQuests((q) => {
        let next = applyLedgerEntryToQuests(q);
        const act3q = next.find((x) => x.quest_id === 'mq-301');
        if (act3q && (act3q.status === 'available' || act3q.status === 'active')) {
          const fogLedgerReady = !scrollMs.guidesMilestone || scrollMs.milestoneComplete;
          if (fogLedgerReady) {
            next = markQuestCompleted(next, 'mq-301');
          }
        }
        return next;
      });
      setLedgerDraft(emptyLedgerDraft());
    },
    [quests, exploration.ledger_entries, exploration.foretold_signpost_realm_ids],
  );

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
    const vault = quests.find((q) => q.quest_id === 'mq-203');
    if (!vault || !isTerminalQuestStatus(vault.status)) return;
    setExploration((e) => {
      const wp = selectActiveWaypoint(PARSED_PRIMARY_MAP.waypoints, e.waypoint_keys_visited);
      if (!wp) return e;
      const k = waypointKey(wp);
      if (e.waypoint_keys_visited.includes(k)) return e;
      return { ...e, waypoint_keys_visited: [...e.waypoint_keys_visited, k] };
    });
  }, [quests]);

  const markQuestTurnedIn = useCallback((questId: string) => {
    setQuests((q) => reconcileQuestPrerequisites(markQuestTurnedInOnList(q, questId)));
  }, []);

  const mergeRemoteLoad = useCallback((remote: Extract<LoadPlayerOutcome, { ok: true }>) => {
    const rawLoop = remote.exploration_loop;
    const rawDemo =
      rawLoop && typeof rawLoop === 'object' && !Array.isArray(rawLoop)
        ? (rawLoop as Record<string, unknown>).demo_guidance_v1
        : undefined;
    logDemoLoadAudit('before normalize (mergeRemoteLoad / teacher reload)', {
      load_source: 'remote_apps_script_ok',
      raw_exploration_loop_demo_guidance_v1: rawDemo ?? null,
      visited_interactable_ids_before_finalize: [...remote.progression_flags.visited_trigger_object_ids],
    });
    let explorationInit = createEmptyExplorationLoopState();
    if (remote.exploration_loop) {
      const coerced = coerceExplorationLoop(remote.exploration_loop);
      if (coerced) explorationInit = coerced;
    }
    const realmProgressMerged = remote.realm_progress ? mergeRealmProgressMaps({}, remote.realm_progress) : {};
    explorationInit = syncGuildTruePathFromPlayerIfUnset(
      ensureAcademicTasksSeeded(BLUEPRINT.academic_worksheet_tasks, explorationInit),
      remote.player.current_realm_id,
    );
    setPlayer(remote.player);
    setQuests((q) =>
      reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(remote.quests.length ? remote.quests : q)),
    );
    setVisitedInteractableIds(remote.progression_flags.visited_trigger_object_ids);
    setRealmProgress(realmProgressMerged);
    setExploration(explorationInit);
    logDemoLoadAudit('after normalize (mergeRemoteLoad — atlas merge only; demo_guidance not re-merged)', {
      demo_guidance_v1: explorationInit.demo_guidance_v1,
      guild_hq_atlas_revealed_realm_ids: explorationInit.guild_hq_atlas_revealed_realm_ids ?? [],
    });
  }, []);

  const reloadPersistedDemoForResume = useCallback(async (): Promise<string> => {
    const persisted = await fetchPersistedDemoSession(seededPlayerSeed, seededQuestSeed, {
      allowLocalCache: false,
      mode: 'remote_strict',
    });
    const rawLoop = persisted.rawExplorationLoopFromRemote;
    const rawDemo =
      rawLoop && typeof rawLoop === 'object' && !Array.isArray(rawLoop)
        ? (rawLoop as Record<string, unknown>).demo_guidance_v1
        : undefined;
    logDemoLoadAudit('before normalize (Game Title → Resume reload)', {
      load_source: persisted.source,
      raw_exploration_loop_demo_guidance_v1: rawDemo ?? null,
      visited_interactable_ids_before_finalize: [...persisted.visitedInit],
      exploration_after_coerce_demo_guidance_v1: persisted.explorationAfterCoerce.demo_guidance_v1,
    });
    const finalized = finalizeDemoBootstrapExploration({
      academicTaskDefs: BLUEPRINT.academic_worksheet_tasks,
      explorationAfterCoerce: persisted.explorationAfterCoerce,
      realmProgressInit: persisted.realmProgressInit,
      nextPlayer: persisted.nextPlayer,
    });
    logDemoLoadAudit('after normalize (Resume reload finalized)', {
      load_source: persisted.source,
      demo_guidance_v1: finalized.exploration.demo_guidance_v1,
    });
    setPlayer(finalized.nextPlayer);
    setQuests(reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(persisted.nextQuests)));
    setVisitedInteractableIds(persisted.visitedInit);
    setRealmProgress(finalized.realmProgress);
    setExploration(finalized.exploration);
    setLedgerDraft(emptyLedgerDraft());
    setPhaserExplorationRemountKey((k) => k + 1);
    return persisted.source;
  }, []);

  const applyCanonicalDemoSessionToRuntime = useCallback(
    async (opts: { allowLocalCache: boolean; clearCacheFirst?: boolean }) => {
      if (opts.clearCacheFirst) {
        clearCachedFullState();
      }
      const persisted = await fetchPersistedDemoSession(seededPlayerSeed, seededQuestSeed, {
        allowLocalCache: opts.allowLocalCache,
        mode: 'canonical',
      });
      const finalized = finalizeDemoBootstrapExploration({
        academicTaskDefs: BLUEPRINT.academic_worksheet_tasks,
        explorationAfterCoerce: persisted.explorationAfterCoerce,
        realmProgressInit: persisted.realmProgressInit,
        nextPlayer: persisted.nextPlayer,
      });
      setPlayer(finalized.nextPlayer);
      setQuests(reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(persisted.nextQuests)));
      setVisitedInteractableIds(persisted.visitedInit);
      setRealmProgress(finalized.realmProgress);
      setExploration(finalized.exploration);
      setLedgerDraft(emptyLedgerDraft());
      setPhaserExplorationRemountKey((k) => k + 1);
      logDemoLoadAudit('canonical demo session applied', {
        load_source: persisted.source,
        demo_guidance_v1: finalized.exploration.demo_guidance_v1,
        guild_hq_atlas_revealed_realm_ids: finalized.exploration.guild_hq_atlas_revealed_realm_ids ?? [],
        visited_interactable_ids: [...persisted.visitedInit],
      });
      return persisted.source;
    },
    [],
  );

  const applyFreshVerticalSliceFromGameTitle = useCallback(async () => {
    // Canonical fixture is `demo_awakened` (Master Scribe → Maia → Lost Echo → guild HQ).
    await applyCanonicalDemoSessionToRuntime({ allowLocalCache: false, clearCacheFirst: true });
  }, [applyCanonicalDemoSessionToRuntime]);

  const devResetToLostEchoCombatStep = useCallback(() => {
    setVisitedInteractableIds((ids) => ids.filter((id) => !LOST_ECHO_DEMO_INTERACTABLE_IDS.includes(id)));
    setExploration((e) => {
      const clearedLog = (e.encounter_log ?? []).filter(
        (row) => !LOST_ECHO_DEMO_INTERACTABLE_IDS.includes(row.interactable_id),
      );
      return mergeDemoGuidanceState({ ...e, encounter_log: clearedLog }, { stage_id: 'demo_combat_trial_available' });
    });
    setPhaserExplorationRemountKey((k) => k + 1);
    logDemoLoadAudit('dev reset → Lost Echo combat step', {
      cleared_interactable_ids: [...LOST_ECHO_DEMO_INTERACTABLE_IDS],
      target_stage_id: 'demo_combat_trial_available',
    });
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
        setExploration(
          mergeGuildHqAtlasRevealedFromRealmProgress(
            ensureAcademicTasksSeeded(BLUEPRINT.academic_worksheet_tasks, local.exploration),
            local.realmProgress,
          ),
        );
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
      const nowIso = new Date().toISOString();
      if (outcome === 'passed') {
        applyModuleResult({
          module_id: 'mod_gt102_trial_of_tongues',
          quest_id: 'gt-102',
          realm_id: player.current_realm_id,
          status: 'passed',
          completed_at_iso: nowIso,
        });
        setSaveFeedback({ tone: 'success', text: 'GT-102 override applied: passed.' });
        return;
      }
      applyModuleResult({
        module_id: 'mod_gt102_trial_of_tongues',
        quest_id: 'gt-102',
        realm_id: player.current_realm_id,
        status: 'failed',
        completed_at_iso: nowIso,
      });
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
          demoSliceDevTools:
            import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true'
              ? {
                  onResetSliceToAwakened: () => void applyFreshVerticalSliceFromGameTitle(),
                  onResetToLostEchoCombat: devResetToLostEchoCombatStep,
                }
              : undefined,
        }
      : null;

  const navigate: NightOneNavigate = {
    beginDemo,
    quitToTitle,
    gameTitleStart: () => {
      setSaveFeedback(null);
      setScreen('intro');
    },
    introCompleteToExplore: async () => {
      setSaveFeedback(null);
      await applyFreshVerticalSliceFromGameTitle();
      setScreen('explore');
    },
    gameTitleResume: async () => {
      setSaveFeedback(null);
      try {
        const source = await reloadPersistedDemoForResume();
        setSaveFeedback({
          tone: 'success',
          text: `Spreadsheet save loaded and normalized (source: ${source}). The Traveler returns to the world.`,
        });
        setScreen('explore');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSaveFeedback({
          tone: 'error',
          text: `Load game failed: ${msg}`,
        });
      }
    },
    proceedInstructions: () => setScreen('maiaProfile'),
    maiaProfileToResume: () => setScreen('scrollReveal'),
    scrollRevealToResume: () => setScreen('resume'),
    resumeToExplore: () => setScreen('explore'),
    openPause: () => setPauseOpen(true),
    closePause: () => setPauseOpen(false),
    openQuestLog: () => setQuestLogOpen(true),
    closeQuestLog: () => setQuestLogOpen(false),
    dismissSaveFeedback,
    openRealmAtlas: () => {
      setPauseOpen(false);
      phaserGuildResearchExitWhenAtlasClosedRef.current = null;
      setRealmAtlasEntryIntent({ initialGuildRealmId: null, fogRevealRealmId: null });
      setRealmAtlasOpen(true);
    },
    closeRealmAtlas: () => {
      const phaserGuildExitId = phaserGuildResearchExitWhenAtlasClosedRef.current;
      phaserGuildResearchExitWhenAtlasClosedRef.current = null;
      // When leaving via a physical guild HQ visit, play door-close SFX (atlas-only closes use scroll-close).
      if (phaserGuildExitId) {
        playLhSfx('door_close');
      } else {
        playLhSfx('atlas_scroll_close');
      }
      if (phaserGuildExitId) {
        window.dispatchEvent(
          new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT, {
            detail: { interactableId: phaserGuildExitId },
          }),
        );
      }
      setRealmAtlasOpen(false);
      setRealmAtlasEntryIntent({ initialGuildRealmId: null, fogRevealRealmId: null });
    },
    openWorldMap: () => {
      setPauseOpen(false);
      setRealmTravelNotice(null);
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
    openDemoClosing: () => {
      setPauseOpen(false);
      setScreen('demoClosing');
    },
    openModule: (moduleId: string) => {
      const devBypass = import.meta.env.DEV || import.meta.env.VITE_LH_PAUSE_MODULE_SHORTCUTS === 'true';
      if (moduleId === 'mod_gt101_enrollment_rune' && player && !devBypass) {
        const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        if (!ge.application_unlocked || ge.application_sealed) {
          setPauseOpen(false);
          setSaveFeedback({
            tone: 'error',
            text: ge.application_sealed
              ? 'Your guild application is already filed.'
              : 'Meet your Guild Manager in person at your chosen headquarters on the map before opening the application.',
          });
          return;
        }
        if (player.current_realm_id !== ge.true_path_realm_id) {
          setPauseOpen(false);
          setSaveFeedback({
            tone: 'error',
            text: 'Return to your chosen guild headquarters on the map (set your active guild HQ on the world map to match), then open the application again.',
          });
          return;
        }
      }
      if (moduleId === 'mod_gt102_trial_of_tongues' && player && !devBypass) {
        const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
        if (!ge.interview_invited) {
          setPauseOpen(false);
          setSaveFeedback({
            tone: 'error',
            text: 'You have not been handed the Guild’s interview summons yet — visit your guild hall on the map after your papers are in review.',
          });
          return;
        }
        if (player.current_realm_id !== ge.true_path_realm_id) {
          setPauseOpen(false);
          setSaveFeedback({
            tone: 'error',
            text: 'Return to your chosen guild headquarters on the map (charter must match this hall) before opening the Trial of Tongues.',
          });
          return;
        }
      }
      setPauseOpen(false);
      setActiveModuleId(moduleId);
      setModuleHostOpen(true);
    },
    closeModule: () => {
      setModuleHostOpen(false);
      setActiveModuleId(null);
    },
  };

  // Which parsed map + tilemap URL to send to the renderer (and act3 totals).
  const activeMap: ParsedLhMap = mapVariant === 'stable' && stableMapState.map
    ? stableMapState.map
    : PARSED_PRIMARY_MAP;
  // Use Vite's BASE_URL so the file resolves from the local dev server (files in public/ are not on the CDN).
  const activeTileMapUrl: string | undefined = mapVariant === 'stable'
    ? `${import.meta.env.BASE_URL}assets/maps/Legendary_Horizon_Map_before_move_towards_final.json`
    : undefined;

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
    demoGuidance,
    dismissNpcDialogue,
    activeEncounter,
    onEncounterWin: handleEncounterWin,
    onEncounterRetreat: handleEncounterRetreat,
    rosterResolution,
    visitedInteractableIds,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    maiaHandoffActive,
    maiaHandoffPromptActive,
    openMaiaHandoffWindow: launchMaiaHandoffWindow,
    forceReturnFromMaia,
    explorationHotspots,
    pauseCanOpenGt101,
    pauseCanOpenGt102,
    gt102InterviewArrivalMissedDeadline,
    guildPathExplorationBanner,
    guildPathQuestLogNote,

    navigate,

    realmAtlasOpen,
    realmAtlasInitialGuildRealmId: realmAtlasEntryIntent.initialGuildRealmId,
    realmAtlasFogRevealRealmId: realmAtlasEntryIntent.fogRevealRealmId,
    consumeRealmAtlasInitialGuildIntent,
    consumeRealmAtlasFogRevealIntent,
    worldMapOpen,
    realmTravelNotice,
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
    parsedMap: activeMap,
    tileMapUrl: activeTileMapUrl,
    mapVariant,
    setMapVariant,
    stableMapLoading: stableMapState.loading,
    stableMapError: stableMapState.error,
    act3: {
      activeWaypointLabel: act3WaypointLabel,
      fogCleared: exploration.fog_keys_cleared.length,
      fogTotal: activeMap.fog_regions.length,
      waypointVisited: exploration.waypoint_keys_visited.length,
      waypointTotal: activeMap.waypoints.length,
      scrollLedgerMilestone: (() => {
        const m = signpostLedgerMilestone(exploration.ledger_entries, exploration.foretold_signpost_realm_ids);
        return m.guidesMilestone ? { covered: m.covered, total: m.total } : null;
      })(),
    },
    enterRealmFromWorldMap,
    primaryWorldTriggerRealmId: PRIMARY_WORLD_TRIGGER_REALM_ID,
    clearFogKey,
    researchRealm,
    updateRealmNotes,
    submitLedgerEntry,
    markActiveWaypointVisited,

    hotspotControls: {
      activate: (interactableId: string) => {
        const triggerMeta = hotspotIndex.get(interactableId);
        if (!triggerMeta) {
          if (import.meta.env.DEV && typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.warn(
              '[LhHotspot] No ParsedLhTrigger for interactableId (realm prefix must match PRIMARY_WORLD_TRIGGER_REALM_ID).',
              { interactableId, expectedRealmPrefix: PRIMARY_WORLD_TRIGGER_REALM_ID },
            );
          }
          window.dispatchEvent(
            new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId } }),
          );
          return;
        }
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
      parsed: activeMap,
      loadErrors: TILED_LOAD.ok ? [] : TILED_LOAD.errors,
    },

    phaserExplorationRemountKey,
    facilitatorToolsProps,
  };
}
