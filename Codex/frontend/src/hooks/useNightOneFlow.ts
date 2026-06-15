﻿import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { submitQuestOfFateWorksheetRemote } from '../services/questOfFateGateway';
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
import { selectCampfirePrompt, addUsedPromptId, parseUsedPromptIds } from '../services/campfirePromptEngine';
import { parseSatchelInventory, grantMemento } from '../data/itemCatalog';
import { resolveOracleProphecyFromRealmIds } from '../modules/act2/oracleCareerData';
import { applyResolveDamage, rollResolveDamage, restoreResolveToFull } from '../services/resolveSystem';
import { normalizeForetoldSignpostRealmIds, signpostLedgerMilestone } from '../exploration/foretoldSignposts';
import {
  LH_NPC_ID_MASTER_SCRIBE,
  buildDemoGuidanceMap,
  isFirstKnowledgeCombatTrigger,
} from '../demo/demoGuidance';
import {
  DEMO_LOAD_AUDIT,
  fetchPersistedDemoSession,
  finalizeDemoBootstrapExploration,
  logDemoLoadAudit,
} from '../demo/demoSessionBootstrap';
import { loadFreshStartPayload } from '../demo/demoCanonicalSave';
import {
  createDefaultGuildEndgameV1,
  createEmptyExplorationLoopState,
  mergeGuildEndgameIntoExploration,
  mergeGuildHqAtlasRevealed,
  mergeGuildHqAtlasRevealedFromRealmProgress,
  syncGuildTruePathFromPlayerIfUnset,
  type ExplorationLoopState,
  type RealmReflectionV1,
} from '../exploration/explorationTypes';
import { applyLedgerEntryToQuests } from '../exploration/ledgerQuestBridge';
import {
  getActiveSignpostCycleQuestId,
  isForetoldSignpostRealm,
  COMPARE_QUEST_ID,
  ENTER_REALMS_QUEST_ID,
} from '../exploration/signpostQuestBridge';
import {
  checkEncounterSideQuests,
  checkEthicsBonusSideQuest,
  checkGuildResearchSideQuests,
  checkClearAllFogSideQuest,
  checkCareerInterviewSideQuest,
} from '../quests/sideQuestBridge';
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
  LH_WINDOW_PHASER_PLAYER_POSITION,
  type LhPhaserPlayerPositionDetail,
} from '../lib/lhPhaserGuildResearchBridge';
import { playLhSfx } from '../lib/lhSfx';
import {
  markResearchComplete,
  setRealmLearnedNotes,
  touchRealmEntered,
  type RealmProgressMap,
} from '../realm/realmProgress';
import { CANON_REALMS } from '../realm/canonRealms';
import { getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import { getGuildRealmCareerOneStopUrl } from '../realm/guildRealmCareerOneStopUrl';
import { getCareerClusterLabel } from '../realm/realmRegistry';
import { submitComparisonLedgerRemote } from '../services/comparisonLedgerGateway';
import {
  loadQuestDefinitionsFromJson,
  markQuestTurnedIn as markQuestTurnedInOnList,
  markQuestCompleted,
  forceUnlockQuest,
  isTerminalQuestStatus,
  reconcileQuestPrerequisites,
  getQuestXpReward,
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
  const lostEcho = PARSED_PRIMARY_MAP.triggers.filter(isFirstKnowledgeCombatTrigger);
  console.info('[LhDemo] knowledge_combat_first triggers', lostEcho);
  const syntheticLost = lostEcho.filter((t) => t.layer_name === 'demo_synthetic_guidance');
  console.info('[LhDemo] synthetic knowledge_combat_first fallback present?', syntheticLost.length > 0, syntheticLost);
}

const LOST_ECHO_KC_INTERACTABLE_IDS = PARSED_PRIMARY_MAP.triggers
  .filter(isFirstKnowledgeCombatTrigger)
  .map((t) => makeTriggerInteractableId(PRIMARY_WORLD_TRIGGER_REALM_ID, t.tiled_object_id));

// ── Master Scribe Dialogue (Act I + Act II opening) ───────────────────────
// Ordered most-advanced → least; first matching branch wins.
// Exact bridge lines from approved Act I script. Do not improvise new beats.
type QuestAwareDialogue = {
  body: string;
  narrationSequenceId: string;
};

type ScribeCtx = {
  comparison_ledger_sync_status?: string | null;
  true_path_realm_id?: string | null;
  true_path_phase?: string | null;
  allRealms: readonly { realm_id: string; display_name: string }[];
};

function resolveAct1MasterScribeDialogue(
  quests: readonly QuestDefinition[],
  ctx: ScribeCtx,
): QuestAwareDialogue & { branch: string } {
  const isActive = (id: string) => {
    const q = quests.find((q) => q.quest_id === id);
    return q ? (q.status === 'active' || q.status === 'available') : false;
  };

  let branch = 'fallback';
  let line: string;

  // MQ-202: The Runes Become Legible — Scribe reads signposts, explains oracle brand + Quest of Fate
  if (isActive('mq-202')) {
    branch = 'mq-202';
    line =
      'You heard the Oracle.\n\nThe Runes have settled — and they may now be read.\n\n' +
      'Three Foretold Signposts are sealed on your Scroll.\n\nThey are not your destiny.\n\nThey are not a verdict.\n\nThey are the first roads asking to be examined.\n\n' +
      'The Oracle also burned a mark into your Scroll.\n\n' +
      "That mark is a link — a real-world research source about one of your signpost paths.\n\n" +
      "Open your Scroll of Destiny and look for the Oracle's brand.\n\nClick it.\n\nRead.\n\nTake notes.\n\n" +
      'That is your next task: not choosing a career, but learning how a Traveler studies a road before walking it.\n\n' +
      'I have placed the Quest of Fate in your Field Journal.\n\n' +
      'Open the Scroll of Destiny → Field Journal → Work Files.\n\nYour document will be waiting there.\n\n' +
      'When your teacher creates your personal copy in Google Drive, you will find a link in Work Files as well.';
  // MQ-201: The Oracle's Summons — Scribe sends player to Oracle Shrine
  } else if (isActive('mq-201')) {
    branch = 'mq-201';
    line = 'The Oracle Shrine lies beyond the Grey Commons.\n\nSeek it.\n\nThe Scroll has awakened — but only the Oracle can make its runes legible.';
  // MQ-109: The Scroll Awakens — Act I finale, Oracle handoff
  // Two beats only; the Scroll reveal cinematic interrupts after these lines.
  // Post-reveal reaction ("This should not be here…") opens in the RPG dialogue
  // box after the cinematic via dismissScrollReveal → setNpcDialogue.
  } else if (isActive('mq-109')) {
    branch = 'mq-109';
    line = 'The Scroll has awakened.\n\nWait…';
  // MQ-108: The Foretold Signposts — send to Maia IV
  } else if (isActive('mq-108')) {
    branch = 'mq-108';
    line = 'Good.\n\nThe Scroll will remember what the mind forgets.\n\nOne reflection remains.\n\nReturn to Maia and seek your Foretold Signposts.';
  // MQ-107: The Blank Scroll — Scroll of Destiny tutorial
  } else if (isActive('mq-107')) {
    branch = 'mq-107';
    line = 'Every Traveler needs more than courage and reflection.\n\nThey need records.\n\nTools.\n\nMaps.\n\nMemories.\n\nOpen the Scroll of Destiny.\n\nFind what it remembers.';
  // MQ-106: Values of the Traveler — send to Maia III
  } else if (isActive('mq-106')) {
    branch = 'mq-106';
    line = 'Well answered.\n\nNot every Echo is defeated by force.\n\nSome fade only when met with understanding.\n\nReturn to Maia, Traveler.\n\nThe next reflection awaits.';
  // MQ-105: The Echo That Questions — knowledge combat tutorial
  } else if (isActive('mq-105')) {
    branch = 'mq-105';
    line =
      'Well done, Traveler.\n\nYou drove back the Echoes of doubt.' +
      '\n\nBut there is one more you must face.\n\nThis Echo is different.' +
      '\n\nSteel alone will not scatter it.\n\nForce will not help you here.' +
      '\n\nThis Echo questions.\n\nIt tests what you know — not how hard you can strike.' +
      '\n\nApproach it and press Enter.\n\nAnswer with what you have learned.' +
      '\n\nThe Echo glows nearby.\n\nFind it when you are ready.';
  // MQ-104: Hidden Strengths — send to Maia II
  } else if (isActive('mq-104')) {
    branch = 'mq-104';
    line = 'Good. The Echoes have scattered.\n\nYou have learned that some uncertainty must be faced directly.\n\nNow return to the Mirror of Maia.\n\nYour next sign is waiting.';
  // MQ-103: Embers in the Grass — combat tutorial
  } else if (isActive('mq-103')) {
    branch = 'mq-103';
    line = 'The Echoes grow bolder.\n\nThey gather where purpose is unclear.\n\nStand with me, Traveler.\n\nDrive them back.';
  // MQ-102: The First Sign — remind player to seek Maia I
  } else if (isActive('mq-102')) {
    branch = 'mq-102';
    line = 'The Mirror of Maia awaits, Traveler. Beyond these fields — seek it. Return when you have glimpsed your first sign.';
  // MQ-101: The First Reflection — opening speech
  } else if (isActive('mq-101')) {
    branch = 'mq-101';
    line =
      'Traveler... At last.\n\nYou have crossed the threshold and arrived in the Grey Commons.' +
      ' Every path in the Horizon begins here. The roads stretch in every direction.' +
      ' Some lead to prosperity. Some to purpose. Yet from where you stand, they all appear hidden by fog.' +
      '\n\nThis is the Scroll of Destiny. One day it will contain the story of your journey.' +
      ' But today — its pages are blank. As they should be.' +
      '\n\nBefore the Scroll can guide you, you must first discover who you are.' +
      ' Beyond these fields stands the Mirror of Maia. Seek it. Learn what it reveals. Then return to me.';
  // Act III → Act IV: True Path already chosen — remind player to travel to their HQ.
  // Must come BEFORE the ledger-submitted branch since both synced + true_path can be true simultaneously.
  } else if (ctx.true_path_realm_id && ctx.true_path_phase === 'true_path_chosen') {
    branch = 'post_mq401';
    const chosenRealm = ctx.allRealms.find((r) => r.realm_id === ctx.true_path_realm_id);
    const realmName = chosenRealm?.display_name ?? 'your chosen Guild';
    line =
      `You have chosen your path. Now you must walk it.\n\nTravel to the ${realmName} Guild Headquarters and seek the Guild Manager.\n\nThe roads are marked on your Atlas.`;
  // Act III → Act IV: Comparison Ledger submitted, no True Path chosen yet — prompt selection.
  } else if (ctx.comparison_ledger_sync_status === 'synced' && !ctx.true_path_realm_id) {
    branch = 'mq311_bridge';
    line =
      'Your Comparison Ledger has reached the Guild Records Hall. The evidence is sealed.\n\n' +
      'Now the true work begins — choosing one path to study deeply.\n\n' +
      'This is not forever, Traveler. It is the path you will walk next.\n\n' +
      'Let us write your True Path onto the Scroll.';
  // Fallback: post-Act II, mid-Act III (ledger not yet submitted)
  } else {
    line = 'The guild roads are open, Traveler. Follow the Scroll of Destiny and gather evidence before choosing your path.';
  }

  if (typeof console !== 'undefined') {
    const ids = ['mq-101','mq-102','mq-103','mq-104','mq-105','mq-106','mq-107','mq-108','mq-109','mq-201','mq-202'];
    const statuses = ids.map((id) => {
      const q = quests.find((q) => q.quest_id === id);
      return q ? `${id}:${q.status}` : `${id}:?`;
    }).join(' | ');
    console.log(`[LH_ACT_FLOW_DEBUG] Scribe dialogue → branch:${branch} | ${statuses}`);
  }

  return {
    body: line!,
    narrationSequenceId:
      branch === 'fallback' ? 'master_scribe_fallback' : `master_scribe_${branch.replace(/-/g, '_')}`,
    branch,
  };
}

// ── Oracle Dialogue (Act II opening) ──────────────────────────────────────
// Short, mystical. The Scribe teaches; the Oracle prophesies.
function resolveAct1OracleDialogue(quests: readonly QuestDefinition[]): QuestAwareDialogue {
  const isActive = (id: string) => {
    const q = quests.find((q) => q.quest_id === id);
    return q ? (q.status === 'active' || q.status === 'available') : false;
  };

  if (typeof console !== 'undefined') {
    const mq201 = quests.find((q) => q.quest_id === 'mq-201');
    console.log(`[LH_ACT_FLOW_DEBUG] Oracle dialogue — mq-201 status: ${mq201?.status ?? '?'}`);
  }

  if (isActive('mq-201')) {
    // Player approached via Enter — guide them to the Scroll activation path.
    // The cinematic only fires through lh:oracle-altar-scroll-open (Spacebar on Scroll near altar).
    return {
      body:
        'Traveler of the Grey Commons...\n\nYour first signs have awakened.' +
        '\n\nThree runes burn upon your Scroll.\n\nNot answers.\n\nNot chains.\n\nSignposts.' +
        '\n\nDo not choose from wonder.\n\nDo not choose from fear.\n\nChoose only after seeking evidence.' +
        '\n\nI do not speak my visions.\n\nI reveal them through the Scroll.\n\nOpen it here, at this altar.',
      narrationSequenceId: 'oracle_mq_201',
    };
  }
  // Fallback after mq-201 is complete
  return {
    body: 'The signs are spoken, Traveler. The road is yours to walk.',
    narrationSequenceId: 'oracle_fallback',
  };
}

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
  // Ref mirrors quests state so window event handlers registered once can read current quest state.
  const questsRef = useRef<QuestDefinition[]>(quests);
  useEffect(() => { questsRef.current = quests; }, [quests]);

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
  /**
   * Complete a quest AND award its XP reward to the player in one shot.
   * Uses `markQuestCompleted` (which auto-reconciles prerequisites) + increments `xp_total`.
   */
  const completeQuestWithXp = useCallback(
    (questId: string) => {
      setQuests((q) => {
        const before = q.find((quest) => quest.quest_id === questId);
        const xp = getQuestXpReward(q, questId);
        if (xp > 0) {
          setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
        }
        const next = markQuestCompleted(q, questId);
        const after = next.find((quest) => quest.quest_id === questId);
        if (
          before &&
          before.status !== 'completed' &&
          before.status !== 'turned_in' &&
          after?.status === 'completed'
        ) {
          playLhSfx('quest_complete', { minIntervalMs: 400 });
        }
        return next;
      });
    },
    [],
  );

  /**
   * Called when the student confirms their True Path choice in TruePathPickerModal.
   * Writes guild_endgame_v1, advances player to mq-402, and closes the picker.
   */
  const selectTruePath = useCallback(
    (chosenRealmId: string) => {
      setExploration((e) =>
        mergeGuildEndgameIntoExploration(e, {
          true_path_realm_id: chosenRealmId,
          phase: 'true_path_chosen',
        }),
      );
      setPlayer((p) =>
        p
          ? {
              ...p,
              current_realm_id: chosenRealmId,
              active_main_quest_id: 'mq-402',
              active_main_quest_title: 'Travel to the Chosen Guild HQ',
              required_next_action: 'Travel to your True Path Guild Headquarters.',
            }
          : p,
      );
      completeQuestWithXp('mq-401');
      setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'mq-402')));
      setTruePathPickerOpen(false);
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] True Path selected:', chosenRealmId);
      }
    },
    [completeQuestWithXp],
  );

  /** Pause → World Atlas entry: optional guild sheet first + fog lift after close (guild HQ research trigger). */
  const [realmAtlasEntryIntent, setRealmAtlasEntryIntent] = useState<{
    initialGuildRealmId: string | null;
    fogRevealRealmId: string | null;
  }>({ initialGuildRealmId: null, fogRevealRealmId: null });
  /** Tracks which guild was most recently entered — drives Comparison Ledger row focus. */
  const [activeLedgerRealmId, setActiveLedgerRealmId] = useState<string | null>(null);
  /** Phaser guild HQ enter tween completed; fire exit walk when this atlas closes (see `closeRealmAtlas`). */
  const phaserGuildResearchExitWhenAtlasClosedRef = useRef<string | null>(null);

  const consumeRealmAtlasInitialGuildIntent = useCallback(() => {
    setRealmAtlasEntryIntent((prev) => ({ ...prev, initialGuildRealmId: null }));
  }, []);

  const consumeRealmAtlasFogRevealIntent = useCallback(() => {
    setRealmAtlasEntryIntent((prev) => ({ ...prev, fogRevealRealmId: null }));
    // Fog reveal atlas consumed — no demo stage to advance in Act I.
  }, []);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  /** Inline message when travel is blocked (shown inside World Map overlay). */
  const [realmTravelNotice, setRealmTravelNotice] = useState<string | null>(null);
  const [academicWorksheetsOpen, setAcademicWorksheetsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [satchelOpen, setSatchelOpen] = useState(false);
  const [restedReadinessOpen, setRestedReadinessOpen] = useState(false);
  const [moduleHostOpen, setModuleHostOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [scrollRevealOpen, setScrollRevealOpen] = useState(false);
  // Ref set when mq-109 completes during a Scribe interaction. The reveal is
  // deferred until the player dismisses the RPG dialogue box, so the cinematic
  // starts AFTER the Scribe's final line — not simultaneously with it.
  const scrollRevealPendingRef = useRef(false);
  // Ref set when the Scribe fires the mq311_bridge branch. Picker opens after dialogue is dismissed.
  const truePathPickerPendingRef = useRef(false);
  const [truePathPickerOpen, setTruePathPickerOpen] = useState(false);
  // Ref set when the Guild Manager first-encounter dialogue fires. Module opens after dialogue dismissed.
  const guildManagerModulePendingRef = useRef<string | null>(null);
  const [oracleProphecyOpen, setOracleProphecyOpen] = useState(false);
  const [oracleCinematicOpen, setOracleCinematicOpen] = useState(false);
  const [preRevealCheckpointOpen, setPreRevealCheckpointOpen] = useState(false);
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

  // [LH_ACT1_DEBUG] log which screen is chosen when an encounter launches.
  useEffect(() => {
    if (!activeEncounter) return;
    const route = activeEncounter.presentation === 'jrpg_knowledge'
      ? 'KnowledgeJrpgBattleOverlay'
      : 'EncounterOverlay (modal)';
    if (typeof console !== 'undefined') {
      console.log(
        `[LH_ACT1_DEBUG] Encounter launched → route: ${route} | kind: ${activeEncounter.kind} | presentation: ${activeEncounter.presentation ?? 'modal'} | target_quest_id: ${activeEncounter.target_quest_id ?? 'none'} | interactableId: ${activeEncounter.interactableId}`,
      );
    }
  }, [activeEncounter]);

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

  useEffect(() => {
    if (screen === 'explore' && player) {
      const rid = player.current_realm_id;
      setRealmProgress((p) => touchRealmEntered(p, rid));
    }
  }, [screen, player?.current_realm_id]);

  // 'new' = Start Game (fresh fixture, never show popup); 'resume' = Load Game (check save).
  const launchModeRef = useRef<'new' | 'resume' | null>(null);

  // Show Rested Readiness modal on first Load Game session when save has a graded campfire score.
  const restedReadinessShownRef = useRef(false);
  useEffect(() => {
    if (screen !== 'explore') return;
    if (launchModeRef.current !== 'resume') return;
    if (restedReadinessShownRef.current) return;
    if (!player) return;
    if (player.last_campfire_score == null) return;
    restedReadinessShownRef.current = true;
    setRestedReadinessOpen(true);
  }, [screen, player?.last_campfire_score]);

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
    // Act I: Maia return no longer advances demo stage state.
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

  // DEBUG: Act I progression shortcut.
  // Any Maia return counts as assessment completion.
  // Replace with real assessment completion validation later.
  //
  // Listens to 'lh:maia-handoff-closed' (fired by finalizeMaiaHandoffClosed) rather than
  // watching maiaHandoffActive state. This covers every return path including:
  //   - Popup blocked → player clicks "Return to game" (maiaHandoffActive never goes true)
  //   - Popup opens → player closes tab naturally
  //   - Popup opens → player clicks "I closed Maia — return to the game"
  useEffect(() => {
    const MAIA_VISIT_IDS = ['mq-102', 'mq-104', 'mq-106', 'mq-108'] as const;
    const handler = () => {
      setQuests((q) => {
        for (const id of MAIA_VISIT_IDS) {
          const quest = q.find((quest) => quest.quest_id === id);
          if (quest && (quest.status === 'active' || quest.status === 'available')) {
            if (typeof console !== 'undefined') {
              console.log('[LH_ACT1_DEBUG] Maia closed — active quest before completion:', id, quest.status);
            }
            const xp = getQuestXpReward(q, id);
            if (xp > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
            let next = markQuestCompleted(q, id);
            if (typeof console !== 'undefined') {
              const unlocked = next.find((nq) => nq.quest_id !== id && q.find((oq) => oq.quest_id === nq.quest_id && oq.status === 'locked') && nq.status === 'available');
              console.log('[LH_ACT1_DEBUG] Quest completed:', id, '— next unlocked:', unlocked?.quest_id ?? 'none');
            }
            // Auto-skip mq-107 (Blank Scroll tutorial) if it just unlocked.
            // The Scroll Reveal ceremony fires later via the Scribe; asking the player
            // to open the Scroll first would spoil the reveal moment.
            const mq107 = next.find((nq) => nq.quest_id === 'mq-107');
            if (mq107 && (mq107.status === 'active' || mq107.status === 'available')) {
              if (typeof console !== 'undefined') {
                console.log('[LH_ACT_FLOW_DEBUG] Maia close — auto-completing mq-107 (Blank Scroll) to preserve reveal ceremony');
              }
              const xp107 = getQuestXpReward(next, 'mq-107');
              if (xp107 > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp107 } : p));
              next = markQuestCompleted(next, 'mq-107');
            }
            return next;
          }
        }
        if (typeof console !== 'undefined') {
          console.log('[LH_ACT1_DEBUG] Maia closed — no active Maia quest found (IDs checked:', MAIA_VISIT_IDS.join(', '), ')');
          console.log('[LH_ACT1_DEBUG] Current quest statuses:', q.filter(quest => MAIA_VISIT_IDS.includes(quest.quest_id as typeof MAIA_VISIT_IDS[number])).map(quest => `${quest.quest_id}:${quest.status}`).join(', '));
        }
        return q;
      });
    };
    window.addEventListener('lh:maia-handoff-closed', handler);
    return () => window.removeEventListener('lh:maia-handoff-closed', handler);
  }, []); // registered once — uses functional setQuests to always read current state

  // ── Maia Assessment Reconciliation ─────────────────────────────────────────
  // When foretold_signpost_realm_ids exists in saved state (Maia completed in a
  // prior session or via direct assessment import), any of mq-102/104/106/108
  // still in active/available are stale. Complete them so the Scribe never
  // re-routes the player to Maia when the assessment data already exists.
  const maiaReconcileRan = useRef(false);
  useEffect(() => {
    if (maiaReconcileRan.current) return;
    const signposts = exploration.foretold_signpost_realm_ids;
    if (!signposts || signposts.length === 0) {
      if (typeof console !== 'undefined') {
        console.log('[LH_MAIA_RECONCILE] no action needed — no assessment data yet');
      }
      return;
    }
    maiaReconcileRan.current = true;
    if (typeof console !== 'undefined') {
      console.log('[LH_MAIA_RECONCILE] assessment found', { signposts: [...signposts] });
    }
    setQuests((q) => {
      const MAIA_QUEST_IDS = ['mq-102', 'mq-104', 'mq-106', 'mq-108'] as const;
      let next = q;
      let advanced = false;
      for (const id of MAIA_QUEST_IDS) {
        const quest = next.find((qx) => qx.quest_id === id);
        if (quest && (quest.status === 'active' || quest.status === 'available')) {
          if (typeof console !== 'undefined') {
            console.log('[LH_MAIA_RECONCILE] stale quest advanced', { id, was: quest.status });
          }
          const xp = getQuestXpReward(next, id);
          if (xp > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
          next = markQuestCompleted(next, id);
          advanced = true;
        }
      }
      if (!advanced && typeof console !== 'undefined') {
        console.log('[LH_MAIA_RECONCILE] no action needed — quests already current');
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploration.foretold_signpost_realm_ids]);

  // ── Part 1: Audio — prime battle music from native keydown context ─────────
  // Phaser detects Enter via JustDown in its rAF update loop — NOT from within the
  // native DOM keydown handler. Chrome's autoplay policy requires audio.play() to be
  // called from within the actual DOM event handler call stack. Solution: when the
  // mq-105 Knowledge Echo spawns, add a native keydown listener; the very next Enter
  // press primes battle music in the correct gesture context before Phaser even
  // processes it.
  useEffect(() => {
    let enterListenerCleanup: (() => void) | null = null;

    const onEchoSpawned = () => {
      const onEnter = (ev: KeyboardEvent) => {
        if (ev.code !== 'Enter' && ev.key !== 'Enter') return;
        if (typeof console !== 'undefined') {
          console.log('[LH_AUDIO] Enter near echo — priming battle music from native keydown');
        }
        getLhAudioDirector().primeBattleMusicFromUserGesture();
      };
      window.addEventListener('keydown', onEnter, { capture: true });

      // Remove as soon as the echo interact fires (or the effect cleans up)
      const onInteract = () => {
        window.removeEventListener('keydown', onEnter, true);
        enterListenerCleanup = null;
      };
      window.addEventListener('lh:mq105-echo-interact', onInteract, { once: true });

      enterListenerCleanup = () => {
        window.removeEventListener('keydown', onEnter, true);
        window.removeEventListener('lh:mq105-echo-interact', onInteract);
      };
    };

    window.addEventListener('lh:spawn-mq105-echo', onEchoSpawned);
    return () => {
      window.removeEventListener('lh:spawn-mq105-echo', onEchoSpawned);
      enterListenerCleanup?.();
    };
  }, []);

  // ── Part 2: Pre-reveal checkpoint — show when mq-108 completes this session ──
  // The checkpoint is a brief overlay prompting the player to return to the Scribe.
  // We mark the ref on mount if mq-108 is already complete (loaded from a prior
  // session) so we only show it when the quest completes *during* this session.
  const preRevealCheckpointShownRef = useRef(false);
  useEffect(() => {
    // Mark as already-shown if mq-108 was complete at session start
    const mq108onLoad = quests.find((q) => q.quest_id === 'mq-108');
    if (mq108onLoad?.status === 'completed') {
      preRevealCheckpointShownRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  useEffect(() => {
    if (preRevealCheckpointShownRef.current) return;
    if (exploration.scroll_reveal_performed) return;
    const mq108 = quests.find((q) => q.quest_id === 'mq-108');
    const mq109 = quests.find((q) => q.quest_id === 'mq-109');
    if (
      mq108?.status === 'completed' &&
      mq109 && (mq109.status === 'active' || mq109.status === 'available')
    ) {
      preRevealCheckpointShownRef.current = true;
      setPreRevealCheckpointOpen(true);
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] mq-108 complete — showing pre-reveal checkpoint overlay');
      }
    }
  }, [quests, exploration.scroll_reveal_performed]);

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
    launchModeRef.current = null;
    restedReadinessShownRef.current = false;
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
    setNpcDialogue(null);
    // Act I: Master Scribe dialogue dismissal no longer advances demo stage state.
    // Quest progression is handled by the quest engine based on player actions.

    // Act I Scroll reveal: if mq-109 just completed (flag set in onActivateHotspot),
    // open the cinematic NOW — after the player has seen the Scribe's final line in
    // the RPG dialogue box, not simultaneously with it.
    if (scrollRevealPendingRef.current) {
      scrollRevealPendingRef.current = false;
      // Stop exploration music; ScrollRevealSequence owns its ceremony cue.
      getLhAudioDirector().setLane(null);
      setScrollRevealOpen(true);
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] Scribe dialogue dismissed — opening Scroll reveal cinematic');
      }
    }
    // Act III → Act IV: if Scribe fired the mq311_bridge branch, open True Path picker after dialogue.
    if (truePathPickerPendingRef.current) {
      truePathPickerPendingRef.current = false;
      setTruePathPickerOpen(true);
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] Scribe dialogue dismissed — opening True Path picker');
      }
    }
    // Act IV: if Guild Manager first-encounter dialogue just fired, open the Enrollment Rune after dismiss.
    const pendingGmModule = guildManagerModulePendingRef.current;
    if (pendingGmModule) {
      guildManagerModulePendingRef.current = null;
      setPauseOpen(false);
      setActiveModuleId(pendingGmModule);
      setModuleHostOpen(true);
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] Guild Manager dialogue dismissed — opening module:', pendingGmModule);
      }
    }
  }, [npcDialogue]);

  // MQ-103 completion: Phaser fires this after all 4 tutorial echoes are defeated.
  useEffect(() => {
    const handler = () => {
      setQuests((q) => {
        const mq103 = q.find((quest) => quest.quest_id === 'mq-103');
        if (mq103 && (mq103.status === 'active' || mq103.status === 'available')) {
          if (typeof console !== 'undefined') {
            console.log('[LH_ACT1_DEBUG] lh:mq103-echoes-cleared — completing mq-103 (Embers in the Grass)');
          }
          const xp = getQuestXpReward(q, 'mq-103');
          if (xp > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
          return markQuestCompleted(q, 'mq-103');
        }
        return q;
      });
      setSaveFeedback({ tone: 'success', text: 'Lost Echoes defeated. Continue onward.' });
    };
    window.addEventListener('lh:mq103-echoes-cleared', handler);
    return () => window.removeEventListener('lh:mq103-echoes-cleared', handler);
  }, []); // registered once — uses functional setQuests

  // MQ-105: player interacted with the Knowledge Echo sprite → launch knowledge combat overlay.
  useEffect(() => {
    const handler = () => {
      setQuests((q) => {
        const mq105 = q.find((quest) => quest.quest_id === 'mq-105');
        if (mq105 && (mq105.status === 'active' || mq105.status === 'available')) {
          if (typeof console !== 'undefined') {
            console.log('[LH_ACT1_DEBUG] lh:mq105-echo-interact — launching jrpg_knowledge encounter for mq-105');
          }
          getLhAudioDirector().primeBattleMusicFromUserGesture();
          setActiveEncounter({
            kind: 'combat_encounter',
            interactableId: 'act1_tutorial_echo_mq105',
            target_quest_id: 'mq-105',
            title: 'The Echo That Questions',
            presentation: 'jrpg_knowledge',
            enemyTemplateId: 'lost_echo',
          });
        }
        return q; // quest state unchanged — encounter win handler completes mq-105
      });
    };
    window.addEventListener('lh:mq105-echo-interact', handler);
    return () => window.removeEventListener('lh:mq105-echo-interact', handler);
  }, []); // registered once — setActiveEncounter reads from ref, setQuests is functional

  // ── Player Position Tracking ─────────────────────────────────────────────────
  // Phaser emits lh:phaser-player-position every ~10 s and on every Scroll-open (pause).
  // Stored in ExplorationLoopState so the next session restores the player at the correct spot.
  useEffect(() => {
    const handler = (e: Event) => {
      const { x, y } = (e as CustomEvent<LhPhaserPlayerPositionDetail>).detail;
      if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) return;
      setExploration((prev) => {
        if (prev.saved_player_x === x && prev.saved_player_y === y) return prev;
        return { ...prev, saved_player_x: Math.round(x), saved_player_y: Math.round(y) };
      });
    };
    window.addEventListener(LH_WINDOW_PHASER_PLAYER_POSITION, handler);
    return () => window.removeEventListener(LH_WINDOW_PHASER_PLAYER_POSITION, handler);
  }, []); // setExploration is stable; no deps needed
  // ────────────────────────────────────────────────────────────────────────────

  // ── Oracle Altar Zone ────────────────────────────────────────────────────────
  // Phaser fires lh:oracle-altar-zone-enter/exit when the player walks in/out of the altar proximity zone.
  // Phaser fires lh:oracle-altar-scroll-open when the player presses Space inside the altar zone.
  // React decides whether to start the Oracle cinematic (mq-201 active) or pass through to normal Scroll.
  useEffect(() => {
    const onAltarScrollOpen = () => {
      const mq201 = questsRef.current.find((q) => q.quest_id === 'mq-201');
      const mq201Active = mq201?.status === 'active' || mq201?.status === 'available';
      const mq201Complete = mq201 ? isTerminalQuestStatus(mq201.status) : false;
      console.log('[LH_ORACLE_ALTAR] scroll open intercepted', { mq201_status: mq201?.status ?? 'absent' });
      if (mq201Active && !mq201Complete) {
        // Start the Oracle awakening sequence — same path as the old oracle_veiled NPC interaction.
        console.log('[LH_ORACLE_ALTAR] sequence started');
        setNpcDialogue(null);
        setOracleCinematicOpen(true);
      } else {
        // mq-201 not active or already done — pass through to normal Scroll of Destiny.
        console.log('[LH_ORACLE_ALTAR] passthrough — mq-201 not active; opening normal Scroll');
        window.dispatchEvent(new CustomEvent('lh:oracle-altar-scroll-passthrough'));
      }
    };
    window.addEventListener('lh:oracle-altar-scroll-open', onAltarScrollOpen);
    return () => window.removeEventListener('lh:oracle-altar-scroll-open', onAltarScrollOpen);
  }, []); // registered once — reads from questsRef (always current)
  // ────────────────────────────────────────────────────────────────────────────

  // Act I: spawn mq-103 roaming echoes when the Master Scribe dialogue closes.
  const lastNpcDialogueIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prevNpcId = lastNpcDialogueIdRef.current;
    lastNpcDialogueIdRef.current = npcDialogue?.npcId ?? null;

    // Only proceed on Scribe dialogue close (Scribe→null transition).
    if (prevNpcId !== LH_NPC_ID_MASTER_SCRIBE || npcDialogue !== null) return;
    // Don't stack encounters.
    if (activeEncounterRef.current) return;

    const mq103 = quests.find((q) => q.quest_id === 'mq-103');
    if (mq103 && (mq103.status === 'active' || mq103.status === 'available')) {
      // mq-103: Embers in the Grass — spawn 4 roaming Lost Echoes via Phaser's attack-button system.
      // No modal; player fights them in the exploration view with the A button.
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] mq-103 active — spawning 4 roaming Lost Echoes via Phaser (lh:spawn-mq103-echoes)');
      }
      window.dispatchEvent(new CustomEvent('lh:spawn-mq103-echoes'));
      return;
    }

    const mq105 = quests.find((q) => q.quest_id === 'mq-105');
    if (mq105 && (mq105.status === 'active' || mq105.status === 'available')) {
      // mq-105: The Echo That Questions — spawn a Knowledge Echo the player must interact with.
      // Does NOT auto-fire the overlay; player must approach the echo and press Enter.
      if (typeof console !== 'undefined') {
        console.log('[LH_ACT_FLOW_DEBUG] mq-105 active — spawning Knowledge Echo via Phaser (player must interact)');
      }
      window.dispatchEvent(new CustomEvent('lh:spawn-mq105-echo'));
    }
  }, [npcDialogue, quests]);

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
    // Apply Resolve damage on retreat.
    setPlayer((p) => {
      if (!p) return p;
      const damageKind: 'combat_retreat' | 'vocab_retreat' =
        cur?.kind === 'combat_encounter' ? 'combat_retreat' : 'vocab_retreat';
      const dmg = rollResolveDamage(damageKind);
      return applyResolveDamage(p, dmg);
    });
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
      // Act I: Lost Echo win no longer advances demo stage state.
      // Quest engine handles progression via checkEncounterSideQuests below.
      // Side quest bridges: SQ-201 (first win), SQ-203 (10 wins), SQ-204 (20 wins).
      const sqEnc = checkEncounterSideQuests(qLink.nextQuests, nextE.encounter_log ?? []);
      const playerAfterEnc = sqEnc.xpAwarded > 0 && qLink.nextPlayer
        ? { ...qLink.nextPlayer, xp_total: qLink.nextPlayer.xp_total + sqEnc.xpAwarded }
        : qLink.nextPlayer;

      // Act I main-quest bridges from encounter wins.
      // Keyed on target_quest_id so only explicitly-tagged tutorial encounters advance Act I quests.
      let act1Quests = sqEnc.nextQuests;
      let act1Xp = 0;
      // MQ-103 (Embers in the Grass): jrpg_knowledge battle win.
      if (cur.target_quest_id === 'mq-103') {
        const mq103 = act1Quests.find((q) => q.quest_id === 'mq-103');
        if (mq103 && (mq103.status === 'active' || mq103.status === 'available')) {
          if (typeof console !== 'undefined') {
            console.log('[LH_ACT1_DEBUG] Encounter win (target=mq-103) — completing mq-103 (Embers in the Grass)');
          }
          act1Xp += getQuestXpReward(act1Quests, 'mq-103');
          act1Quests = markQuestCompleted(act1Quests, 'mq-103');
          if (typeof console !== 'undefined') {
            const mq104 = act1Quests.find((q) => q.quest_id === 'mq-104');
            console.log('[LH_ACT1_DEBUG] mq-103 complete — mq-104 (Hidden Strengths) status:', mq104?.status ?? 'not found');
          }
        }
      }
      // MQ-105 (The Echo That Questions): knowledge modal win.
      if (cur.target_quest_id === 'mq-105') {
        const mq105 = act1Quests.find((q) => q.quest_id === 'mq-105');
        if (mq105 && (mq105.status === 'active' || mq105.status === 'available')) {
          if (typeof console !== 'undefined') {
            console.log('[LH_ACT1_DEBUG] Encounter win (target=mq-105) — completing mq-105 (The Echo That Questions)');
          }
          act1Xp += getQuestXpReward(act1Quests, 'mq-105');
          act1Quests = markQuestCompleted(act1Quests, 'mq-105');
          if (typeof console !== 'undefined') {
            const mq106 = act1Quests.find((q) => q.quest_id === 'mq-106');
            console.log('[LH_ACT1_DEBUG] mq-105 complete — mq-106 (Values of the Traveler) status:', mq106?.status ?? 'not found');
          }
        }
      }
      const finalEncPlayer = act1Xp > 0 && playerAfterEnc
        ? { ...playerAfterEnc, xp_total: playerAfterEnc.xp_total + act1Xp }
        : playerAfterEnc;

      // ── Loot Grant ─────────────────────────────────────────────────────────
      // Award memento items when quests complete. Duplicate-safe: grantMemento no-ops if the
      // item_id is already in satchel.mementos, and the quest-transition guard (was active →
      // now completed) ensures we only fire once per encounter win.
      //
      // Item IDs:
      //   SAT-LOR-001  Torn Journal Page  (mq-103 roaming echo win)
      //   SAT-LOR-002  Echo Crystal       (mq-105 knowledge combat win)
      let lootItemId: string | null = null;
      let lootLabel: string | null = null;
      if (cur.target_quest_id === 'mq-103') {
        const wasActive = sqEnc.nextQuests.find((q) => q.quest_id === 'mq-103');
        const nowDone = act1Quests.find((q) => q.quest_id === 'mq-103');
        if (wasActive && nowDone?.status === 'completed') {
          lootItemId = 'SAT-LOR-001';
          lootLabel = 'Torn Journal Page';
        }
      } else if (cur.target_quest_id === 'mq-105') {
        const wasActive = sqEnc.nextQuests.find((q) => q.quest_id === 'mq-105');
        const nowDone = act1Quests.find((q) => q.quest_id === 'mq-105');
        if (wasActive && nowDone?.status === 'completed') {
          lootItemId = 'SAT-LOR-002';
          lootLabel = 'Echo Crystal';
        }
      }

      // Apply memento grant if loot was earned this encounter.
      let playerWithLoot = finalEncPlayer;
      if (lootItemId && finalEncPlayer) {
        const satchel = parseSatchelInventory(finalEncPlayer.satchel_inventory_json);
        const updatedMementos = grantMemento(satchel.mementos, lootItemId);
        if (updatedMementos.length > satchel.mementos.length) {
          window.setTimeout(() => playLhSfx('item_acquired'), 650);
        }
        const updatedSatchel = { ...satchel, mementos: updatedMementos };
        playerWithLoot = {
          ...finalEncPlayer,
          satchel_inventory_json: JSON.stringify(updatedSatchel),
        };
      }

      setPlayer(playerWithLoot);
      setQuests(act1Quests);
      if (
        act1Quests.some((nextQuest) => {
          const previousQuest = quests.find((quest) => quest.quest_id === nextQuest.quest_id);
          return (
            nextQuest.status === 'completed' &&
            previousQuest?.status !== 'completed' &&
            previousQuest?.status !== 'turned_in'
          );
        })
      ) {
        playLhSfx('quest_complete', { minIntervalMs: 400 });
      }
      setExploration(nextE);
      setVisitedInteractableIds((ids) => (ids.includes(cur.interactableId) ? ids : [...ids, cur.interactableId]));
      setActiveEncounter(null);
      const isKnowledgeCombat = cur.presentation === 'jrpg_knowledge';
      if (capAward.capped) {
        const lootSuffix = lootLabel ? ` · Found: ${lootLabel}` : '';
        setSaveFeedback({
          tone: 'success',
          text: `Victory! +${capAward.xpGranted} XP (session cap reached)${lootSuffix}`,
        });
      } else if (cur.kind === 'combat_encounter') {
        if (isKnowledgeCombat) {
          const lootSuffix = lootLabel ? ` · Received: ${lootLabel}` : '';
          setSaveFeedback({
            tone: 'success',
            text: `The Echo yields. Knowledge prevails.\n+${capAward.xpGranted} XP${lootSuffix}`,
          });
        } else {
          const lootSuffix = lootLabel ? ` · Found: ${lootLabel}` : '';
          setSaveFeedback({
            tone: 'success',
            text: `Lost Echo defeated!\n+${capAward.xpGranted} XP${lootSuffix}`,
          });
        }
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
      const lostEchoDemo = kind === 'combat_encounter' && isFirstKnowledgeCombatTrigger(triggerMeta);

      if (lostEchoDemo && visitedInteractableIds.includes(interactableId)) {
        setSaveFeedback({
          tone: 'error',
          text: 'The Lost Echo has already yielded. Press onward.',
        });
        return;
      }
      if (kind === 'maia_portal') {
        // Act I: Maia portal is always accessible — demo stage gate removed.
        // Manual "Return to game" must be able to fire each time.
        if (typeof console !== 'undefined') {
          const activeMailaQ = quests.find((q) => ['mq-102','mq-104','mq-106','mq-108'].includes(q.quest_id) && (q.status === 'active' || q.status === 'available'));
          console.log('[LH_ACT1_DEBUG] Maia portal triggered — active Maia quest:', activeMailaQ?.quest_id ?? 'none', activeMailaQ?.status ?? '');
        }
        maiaHandoffClosedOnceRef.current = false;
        const nextVisited = visitedInteractableIds.includes(interactableId)
          ? visitedInteractableIds
          : [...visitedInteractableIds, interactableId];
        const nextPlayer: PlayerSave = { ...player };
        const nextRealmProgress = setRealmLearnedNotes(
          realmProgress,
          player.current_realm_id,
          'Mirror of Maia handoff demonstrated with teacher-reviewed Interest Profiler-style data.',
        );

        setPlayer(nextPlayer);
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
            exploration_loop: exploration,
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

        // After first visit + atlas fog, physical doors close until the traveler commits to a True Path guild.
        // Act I: re-entry allowed when a true path is chosen (endgame state), not demo stage.
        const firstKcBeaten = LOST_ECHO_KC_INTERACTABLE_IDS.some((id) => visitedInteractableIds.includes(id));
        if (revealed.has(triggerRealm)) {
          if (truePathRealm && truePathRealm === triggerRealm && firstKcBeaten) {
            // MQ-402 "Travel to Chosen Guild HQ": entering the physical True Path HQ completes it.
            const mq402re = quests.find((q) => q.quest_id === 'mq-402');
            if (mq402re && (mq402re.status === 'active' || mq402re.status === 'available')) {
              completeQuestWithXp('mq-402');
              setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'mq-403')));
              setPlayer((p) =>
                p
                  ? {
                      ...p,
                      active_main_quest_id: 'mq-403',
                      active_main_quest_title: 'Meet the Guild Manager',
                      required_next_action: 'Speak with the Guild Manager at this Guild HQ.',
                    }
                  : p,
              );
            }
            const ge = exploration.guild_endgame_v1 ?? createDefaultGuildEndgameV1();
            if (!ge.application_unlocked) {
              // First encounter with True Path HQ — fire the Guild Manager meeting.
              const mq403ge = quests.find((q) => q.quest_id === 'mq-403');
              if (mq403ge && (mq403ge.status === 'available' || mq403ge.status === 'active')) {
                completeQuestWithXp('mq-403');
              }
              setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'gt-101')));
              setPlayer((p) =>
                p
                  ? {
                      ...p,
                      active_main_quest_id: 'gt-101',
                      active_main_quest_title: 'Complete the Rite of Enrollment',
                      required_next_action: 'Complete the Enrollment Rune application at your Guild HQ.',
                    }
                  : p,
              );
              setExploration((e) =>
                mergeGuildHqAtlasRevealed(
                  mergeGuildEndgameIntoExploration(e, {
                    application_unlocked: true,
                    phase: 'application_available',
                  }),
                  triggerRealm,
                ),
              );
              playLhSfx('door_open');
              setPauseOpen(false);
              setNpcDialogue({
                npcId: 'guild_manager_hq_npc',
                title: 'Guild Manager',
                speakerLabel: 'Guild Manager',
                body:
                  'Traveler. We have heard of your research. You have compared the guild roads and you have chosen ours.\n\n' +
                  'That is not a small thing.\n\n' +
                  'I cannot offer you a seat in this hall on reputation alone. Every Traveler who enters through these doors completes an Enrollment Rune first. It tells us who you are, what you bring, and why you belong here.\n\n' +
                  'Complete it honestly. There is no wrong answer — only an unfinished one.',
                portraitUrl: undefined,
                narrationSequenceId: 'guild_manager_first_meeting',
              });
              guildManagerModulePendingRef.current = 'mod_gt101_enrollment_rune';
              return;
            }
            if (!ge.application_sealed) {
              setSaveFeedback({ tone: 'success', text: 'Your Enrollment Rune is still open. Complete it when you are ready.' });
              return;
            }
            // Enrollment Rune sealed — show phase-appropriate status toast.
            const phaseMsg =
              ge.phase === 'guild_accepted_v1'
                ? 'You have been accepted into this guild. Your journey continues.'
                : ge.phase === 'interview_invited'
                ? 'You have been invited to an interview. Speak with the Guild Manager to proceed.'
                : 'Your Enrollment Rune has been submitted. The Guild Manager will be in touch.';
            setSaveFeedback({ tone: 'success', text: phaseMsg });
            return;
          }
          playLhSfx('action_blocked');
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

        // Act I: guild HQ discovery is gated on the first KC being beaten, not on demo stage.
        if (!firstKcBeaten) {
          playLhSfx('action_blocked');
          setSaveFeedback({
            tone: 'error',
            text: 'The guild roads are not ready. Face the challenge on the path before entering a guild hall.',
          });
          window.dispatchEvent(
            new CustomEvent(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, { detail: { interactableId, mode: 'blocked' } }),
          );
          return;
        }
        // Shared overworld: physical trigger zone is authoritative — do not require `current_realm_id`
        // to match (that field tracks narrative/UI focus and may lag while exploring the big map).

        setExploration((e) => mergeGuildHqAtlasRevealed(e, triggerRealm));
        setRealmProgress((p) => markResearchComplete(p, triggerRealm));
        setActiveLedgerRealmId(triggerRealm);
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
            text: "This summons bears another guild's seal — you are at the wrong hall.",
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
            text: "The porter has no interview scroll for you yet — finish and seal your application first, then await the Guild's review.",
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
            text:
              exploration.comparison_ledger_sync_status === 'synced'
                ? 'Your Comparison Ledger is submitted. Return to the Master Scribe to choose your True Path before visiting a Guild Manager.'
                : 'The Guild Manager waits for a chosen path. Open the world map and set your active guild headquarters to the guild you intend to walk.',
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
            text: 'Your Enrollment Rune is still open. Complete it when you are ready and return it to this desk.',
          });
          markDeskVisited();
          return;
        }

        if (visitedInteractableIds.includes(interactableId)) return;

        // MQ-403 "Meet the Guild Manager": complete on first guild_manager_hq encounter.
        const mq403 = quests.find((q) => q.quest_id === 'mq-403');
        if (mq403 && (mq403.status === 'available' || mq403.status === 'active')) {
          completeQuestWithXp('mq-403');
        }
        // Unlock GT-101 and advance player directives.
        setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'gt-101')));
        setPlayer((p) =>
          p
            ? {
                ...p,
                active_main_quest_id: 'gt-101',
                active_main_quest_title: 'Complete the Rite of Enrollment',
                required_next_action: 'Complete the Enrollment Rune application at your Guild HQ.',
              }
            : p,
        );

        setExploration((e) =>
          mergeGuildHqAtlasRevealed(
            mergeGuildEndgameIntoExploration(e, {
              application_unlocked: true,
              phase: 'application_available',
            }),
            triggerRealm,
          ),
        );

        // Show mentor dialogue card instead of a generic toast.
        // Enrollment Rune opens after the player dismisses this dialogue (guildManagerModulePendingRef).
        setPauseOpen(false);
        setNpcDialogue({
          npcId: 'guild_manager_hq_npc',
          title: 'Guild Manager',
          speakerLabel: 'Guild Manager',
          body:
            'Traveler. We have heard of your research. You have compared the guild roads and you have chosen ours.\n\n' +
            'That is not a small thing.\n\n' +
            'I cannot offer you a seat in this hall on reputation alone. Every Traveler who enters through these doors completes an Enrollment Rune first. It tells us who you are, what you bring, and why you belong here.\n\n' +
            'Complete it honestly. There is no wrong answer — only an unfinished one.',
          portraitUrl: undefined,
          narrationSequenceId: 'guild_manager_first_meeting',
        });
        guildManagerModulePendingRef.current = 'mod_gt101_enrollment_rune';
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
            // Act 3 fog cycle quest bridge: if this realm is a foretold signpost, complete the active fog quest.
            const curRealm = player.current_realm_id;
            if (isForetoldSignpostRealm(curRealm, exploration.foretold_signpost_realm_ids)) {
              const fogQid = getActiveSignpostCycleQuestId(quests, 'fog');
              if (fogQid) completeQuestWithXp(fogQid);
            }
          }
        } else if (import.meta.env.DEV && typeof console !== 'undefined') {
          console.warn('[LhTrigger] fog_clear trigger has no lh_fog_key — set it in Tiled', { interactableId });
        }
        setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
        return;
      }

      if (visitedInteractableIds.includes(interactableId)) {
        if (SHOW_TRIGGER_PARSE_DEBUG && typeof console !== 'undefined') {
          console.info('[LhDemo] trigger skipped (visited)', { interactableId });
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
        // jrpg_knowledge presentation for: (a) the first knowledge_combat_first Lost Echo trigger,
        // or (b) any combat_encounter tagged mq-105 (the Knowledge Echo tutorial).
        const jrpgLostEcho =
          result.openEncounter.kind === 'combat_encounter' && (
            isFirstKnowledgeCombatTrigger(triggerMeta) ||
            result.openEncounter.target_quest_id === 'mq-105'
          );
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
        const npcId = result.openNpcDialogue.npcId;
        const npc = findNpcEntry(BLUEPRINT.npc_registry, npcId);
        const isMasterScribe = npcId === LH_NPC_ID_MASTER_SCRIBE;
        const isOracle = npcId === 'oracle_veiled';

        // Scribe and Oracle use static quest-aware dialogue; all others use the catalog.
        const staticDialogue = isMasterScribe
          ? resolveAct1MasterScribeDialogue(result.nextQuests ?? quests, {
              comparison_ledger_sync_status: exploration.comparison_ledger_sync_status ?? null,
              true_path_realm_id: exploration.guild_endgame_v1?.true_path_realm_id ?? null,
              true_path_phase: exploration.guild_endgame_v1?.phase ?? null,
              allRealms,
            })
          : isOracle
            ? resolveAct1OracleDialogue(result.nextQuests ?? quests)
            : null;
        const body =
          staticDialogue?.body ??
          resolveNpcDialogueBody(
            npcId,
            BLUEPRINT.dialogue_catalog,
            BLUEPRINT.npc_registry,
            {
              player: result.nextPlayer,
              realm,
              quests: result.nextQuests,
              extra_tokens: {
                prophecy_number: exploration.module_drafts?.mod_oracle_of_fate?.prophecy_id ?? '',
                career_cluster_name: exploration.module_drafts?.mod_oracle_of_fate?.prophecy_cluster_name ?? '',
              },
            },
          ).body;
        const aid = npc?.portrait_asset_id;
        const catalogPortrait = aid ? resolveAssetDeliveryUrl(aid, BLUEPRINT.media_assets) : '';
        const portraitUrl =
          catalogPortrait ||
          (isMasterScribe
            ? `${import.meta.env.BASE_URL}assets/npcs/master-scribe/old_wizard-idle.png`
            : '');

        // ── Oracle sequence gate ────────────────────────────────────────────
        // Three possible states:
        //   mq-201 active/available → open cinematic (first-time prophecy reveal)
        //   mq-201 terminal (completed/turned_in) → Oracle dormant; ignore interaction
        //   mq-201 absent / locked → show Oracle dialogue as normal NPC
        let oracleCinematicTriggered = false;
        let oracleDormant = false;
        if (isOracle) {
          const mq201check = quests.find((q) => q.quest_id === 'mq-201');
          if (typeof console !== 'undefined') {
            console.log('[LH_ORACLE] Oracle NPC triggered', { mq201_status: mq201check?.status ?? '?' });
          }
          if (mq201check && isTerminalQuestStatus(mq201check.status)) {
            // Prophecy already delivered — Oracle is dormant, no interaction at all.
            oracleDormant = true;
            if (typeof console !== 'undefined') {
              console.log('[LH_ORACLE] Oracle dormant — prophecy already complete, ignoring interaction');
            }
          } else if (mq201check && (mq201check.status === 'active' || mq201check.status === 'available')) {
            // The Oracle cinematic is only triggered by opening the Scroll of Destiny
            // at the altar (lh:oracle-altar-scroll-open — Spacebar path), not by
            // pressing Enter on the NPC directly.  Here we give the player the
            // guidance they need to find the correct activation.
            if (typeof console !== 'undefined') {
              console.log('[LH_ORACLE] oracle NPC approached via Enter — showing guidance, not cinematic (use Scroll at altar)');
            }
            // oracleCinematicTriggered stays false → falls through to normal dialogue below
          }
        }

        // Show the NPC dialogue box for Scribe and all non-Oracle NPCs.
        // For Oracle: skip when cinematic triggered or Oracle is dormant.
        if (!oracleCinematicTriggered && !oracleDormant) {
          setNpcDialogue({
            npcId,
            title: npc?.card_title ?? 'A moment together',
            speakerLabel: formatNpcSpeakerLabel(npc),
            body,
            portraitUrl: portraitUrl || undefined,
            narrationSequenceId: staticDialogue?.narrationSequenceId,
          });
        }

        // Advance quests whose progression is gated on NPC dialogue firing.
        // Dialogue body already resolved above → advance takes effect on the NEXT interaction.
        if (isMasterScribe) {
          const scribeBranch = (staticDialogue as (QuestAwareDialogue & { branch: string }) | null)?.branch;

          if (scribeBranch === 'mq311_bridge') {
            // Act III → Act IV transition: Ledger submitted. Complete mq-311 and unlock mq-401.
            const mq311 = quests.find((q) => q.quest_id === 'mq-311');
            if (mq311 && (mq311.status === 'active' || mq311.status === 'available')) {
              if (typeof console !== 'undefined') {
                console.log('[LH_ACT_FLOW_DEBUG] Scribe mq311_bridge — completing mq-311, unlocking mq-401');
              }
              completeQuestWithXp('mq-311');
            }
            setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'mq-401')));
            setPlayer((p) =>
              p
                ? {
                    ...p,
                    active_main_quest_id: 'mq-401',
                    active_main_quest_title: 'Choose the True Path',
                    required_next_action: 'Open your Quest Log to choose your True Path.',
                  }
                : p,
            );
            // Open the True Path picker after the player dismisses the dialogue box.
            truePathPickerPendingRef.current = true;
          } else {
            // Act I/II: mq-101 (opening), mq-109 (Act I finale), mq-202 (Runes Become Legible).
            for (const id of ['mq-101', 'mq-109', 'mq-202'] as const) {
              const q = quests.find((q) => q.quest_id === id);
              if (q && (q.status === 'active' || q.status === 'available')) {
                if (typeof console !== 'undefined') {
                  console.log(`[LH_ACT_FLOW_DEBUG] Scribe dialogue — completing ${id}`);
                }
                completeQuestWithXp(id);
                // mq-109 finale: mark the Scroll reveal as pending.
                // It opens only after the player dismisses the RPG dialogue box
                // (see dismissNpcDialogue below), so the cinematic starts AFTER
                // the Scribe's final spoken line — not simultaneously with it.
                if (id === 'mq-109') {
                  scrollRevealPendingRef.current = true;
                  if (typeof console !== 'undefined') {
                    console.log('[LH_ACT_FLOW_DEBUG] mq-109 complete — Scroll reveal pending until Scribe dialogue dismissed');
                  }
                }
                break;
              }
            }
          }
        }
      }

      if (result.markVisited) {
        setVisitedInteractableIds((curr) => (curr.includes(interactableId) ? curr : [...curr, interactableId]));
      }
    },
    [player, quests, visitedInteractableIds, realm, exploration, realmProgress, ledgerDraft, launchMaiaHandoffWindow],
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
            visited_trigger_count: visitedInteractableIds.length,
            note: 'Persists current in-memory exploration_loop to Apps Script or simulated sink.',
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

  const campfirePromptSelection = useMemo(() => {
    const overrideText = BLUEPRINT.session_config?.campfire_prompt?.trim();
    if (overrideText) return { id: 'blueprint_override', text: overrideText };
    if (!player) {
      return {
        id: 'default',
        text: 'Describe one thing you discovered today in the realms, and one question you are still carrying with you.',
      };
    }
    return selectCampfirePrompt({
      act: typeof player.current_act === 'number' ? player.current_act : 1,
      guild_id: exploration.foretold_signpost_realm_ids?.[0] ?? undefined,
      used_prompt_ids: parseUsedPromptIds(player.used_campfire_prompt_ids_json),
      is_first_save: !player.last_campfire_iso,
    });
  }, [player, exploration.foretold_signpost_realm_ids]);

  const campfirePrompt: string = campfirePromptSelection.text;

  const handleEndSessionRitual = useCallback(async (campfireEntry: string): Promise<{ ok: boolean; message: string }> => {
    if (!player) return { ok: false, message: 'No player loaded.' };

    const validation = validatePlayerForManualSave(player);
    if (validation.length) {
      return { ok: false, message: validation.join('\n') };
    }

    // LRU-rotate used prompt IDs (prompt cooldown tracking).
    const prevUsed = parseUsedPromptIds(player.used_campfire_prompt_ids_json);
    const updatedUsed = addUsedPromptId(prevUsed, campfirePromptSelection.id);

    // Build enriched player snapshot — Resolve restored to full, prompt rotation applied.
    // campfire_streak is intentionally NOT incremented here. Streak is updated server-side
    // by LhSession_gradeCampfireReflection after the teacher assigns a score (>= 3 increments,
    // < 3 resets). Cosmetic milestone rewards are applied at the same time.
    const playerWithResolveRestored = restoreResolveToFull(player);
    const enrichedPlayer: PlayerSave = {
      ...playerWithResolveRestored,
      last_campfire_iso: new Date().toISOString(),
      used_campfire_prompt_ids_json: JSON.stringify(updatedUsed),
    };

    const sessionSummary = {
      ...buildSessionSummary({ player: enrichedPlayer, quests, exploration }),
      ...(campfireEntry.trim() ? { exit_ticket_body: campfireEntry.trim() } : {}),
      campfire_prompt_id: campfirePromptSelection.id,
      campfire_streak: player.campfire_streak ?? 0,
      player_display_name: enrichedPlayer.display_name || enrichedPlayer.player_id,
    };

    const envelope = buildManualSaveEnvelope({
      player: enrichedPlayer,
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
      return {
        ok: false,
        message: persist.message + (persist.errors ? `\n${persist.errors.join('\n')}` : ''),
      };
    }

    const mergedPlayer: PlayerSave = {
      ...enrichedPlayer,
      revision_token:
        persist.revision ?? enrichedPlayer.revision_token ?? `${enrichedPlayer.player_id}:${Date.now().toString(36)}`,
      last_manual_save_iso: envelope.saved_at_iso,
    };
    setPlayer(mergedPlayer);

    const hist = await appendSessionHistoryRemote(sessionSummary);
    const ticket = await markExitTicketRemote(mergedPlayer.player_id, 'sent');

    tryPlayCatalogAudioAsset(LH_MEDIA_ASSET_ID_SAVE_CHIME, BLUEPRINT.media_assets);

    const warnings = [
      !hist.ok ? `Session log: ${hist.message ?? 'append failed'} (save still stored).` : null,
      !ticket.ok ? `Exit ticket state: ${ticket.message ?? 'update failed'}.` : null,
    ].filter(Boolean);

    return {
      ok: true,
      message: warnings.length ? warnings.join('\n') : persist.message,
    };
  }, [player, quests, realm.realm_id, visitedInteractableIds, exploration, realmProgress, ledgerDraft, campfirePromptSelection]);

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

      // --- Act 3 quest bridges ---
      // MQ-301 "Enter the realms": complete on first realm entry when active/available.
      const enterQ = quests.find((q) => q.quest_id === ENTER_REALMS_QUEST_ID);
      if (enterQ && (enterQ.status === 'available' || enterQ.status === 'active')) {
        completeQuestWithXp(ENTER_REALMS_QUEST_ID);
      }
      // Travel cycle quest (MQ-302/305/308): complete when the selected realm is a foretold signpost.
      if (isForetoldSignpostRealm(realmId, exploration.foretold_signpost_realm_ids)) {
        const travelQid = getActiveSignpostCycleQuestId(quests, 'travel');
        if (travelQid) completeQuestWithXp(travelQid);
      }

      // --- Act 4 quest bridge ---
      // MQ-402 "Travel to Chosen Guild HQ": complete when selecting the True Path realm from the atlas.
      const ge = exploration.guild_endgame_v1;
      if (ge?.true_path_realm_id && ge.true_path_realm_id === realmId) {
        const mq402 = quests.find((q) => q.quest_id === 'mq-402');
        if (mq402 && (mq402.status === 'available' || mq402.status === 'active')) {
          completeQuestWithXp('mq-402');
          setQuests((q) => reconcileQuestPrerequisites(forceUnlockQuest(q, 'mq-403')));
          setPlayer((p) =>
            p
              ? {
                  ...p,
                  active_main_quest_id: 'mq-403',
                  active_main_quest_title: 'Meet the Guild Manager',
                  required_next_action: 'Speak with the Guild Manager at this Guild HQ.',
                }
              : p,
          );
        }
      }

      setWorldMapOpen(false);
      setScreen('explore');
    },
    [allRealms, quests, exploration.foretold_signpost_realm_ids, exploration.guild_endgame_v1, completeQuestWithXp],
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

  /** Mark a realm as researched for the Comparison Ledger — no vault gate, available in beta. */
  const recordRealmResearch = useCallback((realmId: string) => {
    const id = String(realmId ?? '').trim();
    if (!id) return;
    setRealmProgress((p) => markResearchComplete(p, id));
  }, []);

  // ── Comparison Ledger eligibility ─────────────────────────────────────────
  // Gate: all 3 Foretold Signpost realms visited + at least 5 guilds researched.
  const comparisonLedgerGateStatus = useMemo(() => {
    const signpostIds = exploration.foretold_signpost_realm_ids ?? [];
    const researchedSet = new Set(
      Object.entries(realmProgress)
        .filter(([, e]) => e?.research_complete)
        .map(([id]) => id),
    );
    const signpostsVisited = signpostIds.filter((id) => researchedSet.has(id)).length;
    const guildsResearched = researchedSet.size;
    const eligible = signpostsVisited >= 3 && guildsResearched >= 5;
    return { signpostsVisited, guildsResearched, eligible };
  }, [exploration.foretold_signpost_realm_ids, realmProgress]);

  /** Submit the Comparison Ledger to the teacher backend. */
  const submitComparisonLedger = useCallback(async () => {
    const pid = player?.player_id ?? '';

    // Collect researched realm IDs from progress map
    const researchedIds = Object.entries(realmProgress)
      .filter(([, e]) => e?.research_complete)
      .map(([id]) => id);

    const signpostIds = exploration.foretold_signpost_realm_ids ?? [];
    const researchedSet = new Set(researchedIds);
    const signpostsVisited = signpostIds.filter((id) => researchedSet.has(id)).length;

    if (signpostsVisited < 3 || researchedIds.length < 5) {
      const sp = `Foretold Signposts: ${signpostsVisited}/3`;
      const gr = `Guilds Researched: ${researchedIds.length}/5`;
      setSaveFeedback({
        tone: 'error',
        text: `Ledger not ready — ${sp} · ${gr}`,
      });
      return;
    }

    const reflections = exploration.realm_reflections ?? {};
    const hasContent = researchedIds.some((id) => {
      const r = reflections[id];
      return r && Object.values(r).some((v) => typeof v === 'string' && v.trim().length > 0);
    });

    if (!hasContent) {
      setSaveFeedback({
        tone: 'error',
        text: 'Fill in at least one research field before turning in your Comparison Ledger.',
      });
      return;
    }

    setSaveFeedback({ tone: 'success', text: 'Comparison Ledger sealed — submitting to teacher dashboard…' });
    setExploration((e) => ({ ...e, comparison_ledger_sync_status: 'sending' as const }));

    const now = new Date().toISOString();
    const rows = researchedIds.map((realmId) => {
      const realm = CANON_REALMS.find((r) => r.realm_id === realmId);
      const reflection = reflections[realmId] ?? {};
      return {
        submitted_iso: now,
        player_id: pid,
        module_id: 'mod_comparison_ledger',
        realm_id: realmId,
        realm_name: realm?.display_name ?? realmId,
        career_cluster: realm ? getCareerClusterLabel(realm) : '',
        career_areas: realm ? getRealmPathInterestTags(realm).join(', ') : '',
        research_url: getGuildRealmCareerOneStopUrl(realmId) ?? '',
        jobs_found:       reflection.jobs_found       ?? '',
        skills_needed:    reflection.skills_needed    ?? '',
        school_subjects:  reflection.school_subjects  ?? '',
        work_environment: reflection.work_environment ?? '',
        why_fits:         reflection.why_fits         ?? '',
        questions:        reflection.questions        ?? '',
      };
    });

    const result = await submitComparisonLedgerRemote({ player_id: pid, rows });
    if (result.ok) {
      setExploration((e) => ({ ...e, comparison_ledger_sync_status: 'synced' as const }));
      setSaveFeedback({ tone: 'success', text: result.message });
    } else {
      setExploration((e) => ({ ...e, comparison_ledger_sync_status: 'error' as const }));
      setSaveFeedback({
        tone: 'error',
        text: `Ledger sealed locally — teacher sync failed: ${result.message}`,
      });
    }
  }, [player, realmProgress, exploration.realm_reflections]);

  /** Merge a partial reflection patch into `exploration.realm_reflections[realmId]`. */
  const updateRealmReflection = useCallback((realmId: string, patch: Partial<RealmReflectionV1>) => {
    const id = String(realmId ?? '').trim();
    if (!id) return;
    setExploration((e) => {
      const prev = e.realm_reflections?.[id] ?? {};
      return {
        ...e,
        realm_reflections: {
          ...(e.realm_reflections ?? {}),
          [id]: { ...prev, ...patch },
        },
      };
    });
  }, []);

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
      payload.module_id === 'mod_master_scribe_survey' &&
      payload.status === 'completed'
    ) {
      const rawIds = payload.artifacts?.foretold_signpost_realm_ids;
      if (Array.isArray(rawIds)) {
        const allowed = new Set(CANON_REALMS.map((r) => r.realm_id));
        const ids = normalizeForetoldSignpostRealmIds(
          rawIds.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean),
          allowed,
        );
        if (ids.length > 0) {
          setExploration((e) => ({ ...e, foretold_signpost_realm_ids: ids }));
        }
      }
      // Persist RIASEC scores in module draft so ScrollOfDestinyDisplay can read them.
      const rawScores = payload.artifacts?.riasec_scores;
      if (rawScores && typeof rawScores === 'object') {
        const s = rawScores as Record<string, unknown>;
        const patch: Record<string, string> = {};
        for (const code of ['r', 'i', 'a', 's', 'e', 'c'] as const) {
          if (typeof s[code] === 'number') patch[`riasec_${code}`] = String(s[code]);
        }
        if (Object.keys(patch).length > 0) {
          setExploration((e) => ({
            ...e,
            module_drafts: {
              ...(e.module_drafts ?? {}),
              mod_master_scribe_survey: {
                ...(e.module_drafts?.mod_master_scribe_survey ?? {}),
                ...patch,
              },
            },
          }));
        }
      }
      // Scroll reveal fires from mq-109 Scribe dialogue completion (not here) so the
      // ceremony moment is the Scribe revealing the scroll — not the survey submission.
      // setScrollRevealOpen is intentionally omitted.
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

    // GT-103 ethics bonus side quest (SQ-205): if GT-103 passed with high score.
    if (payload.module_id === 'mod_gt103_artificers_ethics' && payload.status === 'passed' && typeof payload.score === 'number') {
      setQuests((q) => {
        const result = checkEthicsBonusSideQuest(q, payload.score!);
        if (result.xpAwarded > 0) {
          setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + result.xpAwarded } : p));
        }
        return result.nextQuests;
      });
    }

    // SQ-202 "Echoes of Experience" — career interview submitted.
    // Transitions the quest to `turned_in` (awaiting teacher review), NOT `completed`.
    // XP is held until the teacher confirms the assignment via the dashboard.
    if (payload.module_id === 'mod_sq202_career_interview' && payload.status === 'submitted') {
      setQuests((q) => {
        const result = checkCareerInterviewSideQuest(q);
        // result.xpAwarded is always 0 for SQ-202 (teacher confirms before XP fires)
        return result.nextQuests;
      });
      setSaveFeedback({
        tone: 'success',
        text: 'Echoes of Experience recorded — your teacher has been notified and will confirm when they have reviewed your interview.',
      });
      // Return early: skip the generic completeQuestWithXp below (SQ-202 must not auto-complete).
      return;
    }

    // MQ-203 "Quest of Fate" — career worksheet sealed by student.
    // Submits the full worksheet to the Apps Script teacher backend; falls through to
    // completeQuestWithXp below to mark the quest complete and award XP.
    if (payload.module_id === 'mod_quest_of_fate_worksheet' && payload.status === 'completed') {
      const ws = payload.artifacts ?? {};
      const pid = player?.player_id ?? '';
      setSaveFeedback({ tone: 'success', text: 'Worksheet sealed — submitting to teacher dashboard…' });
      setExploration((e) => ({ ...e, quest_of_fate_sync_status: 'sending' as const }));
      void submitQuestOfFateWorksheetRemote({
        player_id: pid,
        worksheet: {
          career_name: String(ws.career_name ?? ''),
          career_summary: String(ws.career_summary ?? ''),
          responsibilities: String(ws.responsibilities ?? ''),
          work_environment: String(ws.work_environment ?? ''),
          median_salary: String(ws.median_salary ?? ''),
          min_education: String(ws.min_education ?? ''),
          credentials: String(ws.credentials ?? ''),
          pros: String(ws.pros ?? ''),
          cons: String(ws.cons ?? ''),
          personal_fit: String(ws.personal_fit ?? ''),
          prophecy_title: String(ws.prophecy_title ?? ''),
          prophecy_id: String(ws.prophecy_id ?? ''),
          submitted_at_iso: new Date().toISOString(),
        },
      }).then((result) => {
        if (result.ok) {
          setExploration((e) => ({ ...e, quest_of_fate_sync_status: 'synced' as const }));
          setSaveFeedback({ tone: 'success', text: result.message });
        } else {
          setExploration((e) => ({ ...e, quest_of_fate_sync_status: 'error' as const }));
          setSaveFeedback({
            tone: 'error',
            text: `Worksheet sealed locally — teacher sync failed: ${result.message}`,
          });
        }
      });
      // Fall through to completeQuestWithXp below.
    }

    // GT-100 "Face the Guardian" — boss encounter complete.
    // Falls through to generic completeQuestWithXp below (which auto-reconciles prerequisites,
    // unlocking GT-101). We just add a custom victory feedback here first.
    if (payload.module_id === 'mod_gt100_guardian_boss' && payload.status === 'submitted') {
      setSaveFeedback({
        tone: 'success',
        text: 'The Guardian is defeated! The seal on the Enrollment Realm is broken — GT-101: Rite of Enrollment is now unlocked.',
      });
      // Fall through to completeQuestWithXp below — GT-101 unlocks automatically via prerequisite reconciliation.
    }

    // Mark the owning quest completed + award XP if the module finished in a terminal "success" state.
    // (SQ-202 is excluded above via early return — it uses turned_in, not completed.)
    if (payload.quest_id && (payload.status === 'submitted' || payload.status === 'completed' || payload.status === 'passed')) {
      completeQuestWithXp(payload.quest_id);
    }

    // Guild interview unlock is deferred to `guild_endgame_v1` gates (interview_invited + HQ; deadline affects GT-102 scoring), not GT-101 unlock shortcuts.
  }, [completeQuestWithXp, player]);

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

        // Act 3 ledger cycle quest bridge (MQ-304/307/310): complete when ledger entry realm is a signpost.
        if (isForetoldSignpostRealm(entry.realm_id, exploration.foretold_signpost_realm_ids)) {
          const ledgerQid = getActiveSignpostCycleQuestId(next, 'ledger');
          if (ledgerQid) {
            const xp = getQuestXpReward(next, ledgerQid);
            if (xp > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
            next = markQuestCompleted(next, ledgerQid);
          }
        }

        // MQ-311 "Compare the Three Foretold Paths": complete when all 3 signpost realms have ledger entries.
        if (scrollMs.guidesMilestone && scrollMs.milestoneComplete) {
          const cmpQ = next.find((x) => x.quest_id === COMPARE_QUEST_ID);
          if (cmpQ && (cmpQ.status === 'available' || cmpQ.status === 'active')) {
            const xp = getQuestXpReward(next, COMPARE_QUEST_ID);
            if (xp > 0) setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + xp } : p));
            next = markQuestCompleted(next, COMPARE_QUEST_ID);
          }
        }

        return next;
      });
      setLedgerDraft(emptyLedgerDraft());
    },
    [quests, exploration.ledger_entries, exploration.foretold_signpost_realm_ids, completeQuestWithXp],
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

  const applyFreshVerticalSliceFromGameTitle = useCallback(() => {
    // Build from blueprint seeds only — never load demo_save_state.json for a fresh game.
    clearCachedFullState();
    const persisted = loadFreshStartPayload(seededPlayerSeed, seededQuestSeed);
    const finalized = finalizeDemoBootstrapExploration({
      academicTaskDefs: BLUEPRINT.academic_worksheet_tasks,
      explorationAfterCoerce: persisted.explorationAfterCoerce,
      realmProgressInit: persisted.realmProgressInit,
      nextPlayer: persisted.nextPlayer,
    });
    setPlayer(finalized.nextPlayer);
    setQuests(reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(persisted.nextQuests)));
    setVisitedInteractableIds([]);
    setRealmProgress(finalized.realmProgress);
    setExploration(finalized.exploration);
    setLedgerDraft(emptyLedgerDraft());
    setPhaserExplorationRemountKey((k) => k + 1);
  }, []);

  // DEV-only: clear KC visited IDs so the Lost Echo trigger can fire again.
  const devResetToLostEchoCombatStep = useCallback(() => {
    setVisitedInteractableIds((ids) => ids.filter((id) => !LOST_ECHO_KC_INTERACTABLE_IDS.includes(id)));
    setExploration((e) => {
      const clearedLog = (e.encounter_log ?? []).filter(
        (row) => !LOST_ECHO_KC_INTERACTABLE_IDS.includes(row.interactable_id),
      );
      return { ...e, encounter_log: clearedLog };
    });
    setPhaserExplorationRemountKey((k) => k + 1);
    logDemoLoadAudit('dev reset → Lost Echo combat step (KC IDs cleared)', {
      cleared_interactable_ids: [...LOST_ECHO_KC_INTERACTABLE_IDS],
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

  /** Uses a consumable from the player's satchel, updating player state in-place. */
  const handleUseConsumable = useCallback((itemId: string) => {
    setPlayer((p) => {
      if (!p) return p;
      const inventory = parseSatchelInventory(p.satchel_inventory_json);
      const idx = inventory.consumables.findIndex((c) => c.item_id === itemId);
      if (idx === -1 || inventory.consumables[idx].qty <= 0) return p;
      const updatedConsumables = inventory.consumables.map((c, i) =>
        i === idx ? { ...c, qty: c.qty - 1 } : c,
      );
      const updatedInventory = { ...inventory, consumables: updatedConsumables };
      return { ...p, satchel_inventory_json: JSON.stringify(updatedInventory) };
    });
  }, []);

  const navigate: NightOneNavigate = {
    beginDemo,
    quitToTitle,
    gameTitleStart: () => {
      launchModeRef.current = 'new';
      restedReadinessShownRef.current = false;
      setSaveFeedback(null);
      setScreen('intro');
    },
    introCompleteToExplore: async () => {
      setSaveFeedback(null);
      await applyFreshVerticalSliceFromGameTitle();
      setScreen('explore');
    },
    gameTitleResume: async () => {
      launchModeRef.current = 'resume';
      restedReadinessShownRef.current = false;
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
    openPause: () => {
      setPauseOpen(true);
      // mq-107 (The Blank Scroll) is auto-completed in the Maia handoff close handler
      // to preserve the Scroll Reveal ceremony. Do NOT complete it here on Scroll open —
      // that would expose signpost data before the ceremony fires.
      // MQ-203 (The Quest of Fate): MVP stub — completes when Scroll opens while active.
      // TODO: replace with detection of the actual Work Files / Quest of Fate document being opened.
      const mq203 = quests.find((q) => q.quest_id === 'mq-203');
      if (mq203 && (mq203.status === 'active' || mq203.status === 'available')) {
        if (typeof console !== 'undefined') {
          console.log('[LH_ACT_FLOW_DEBUG] Scroll opened — completing mq-203 (Quest of Fate) [MVP stub: replace with Work Files open detection]');
        }
        completeQuestWithXp('mq-203');
      }
    },
    closePause: () => setPauseOpen(false),
    openQuestLog: () => setQuestLogOpen(true),
    // Close quest log returns to pause hub if pause was open, otherwise closes fully.
    closeQuestLog: () => setQuestLogOpen(false),
    dismissSaveFeedback,
    openRealmAtlas: () => {
      // Keep pauseOpen=true so closing the atlas returns to the Scroll of Destiny hub.
      phaserGuildResearchExitWhenAtlasClosedRef.current = null;
      setRealmAtlasEntryIntent({ initialGuildRealmId: null, fogRevealRealmId: null });
      setRealmAtlasOpen(true);
    },
    closeRealmAtlas: () => {
      const phaserGuildExitId = phaserGuildResearchExitWhenAtlasClosedRef.current;
      phaserGuildResearchExitWhenAtlasClosedRef.current = null;
      // When leaving via a physical guild HQ visit, play door-close SFX; atlas-only closes are silent.
      if (phaserGuildExitId) {
        playLhSfx('door_close');
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
      // Keep pauseOpen so closing the map returns to the Scroll hub.
      setRealmTravelNotice(null);
      setWorldMapOpen(true);
    },
    closeWorldMap: () => setWorldMapOpen(false),
    openResearchWorksheets: () => {
      // Keep pauseOpen so closing worksheets returns to the Scroll hub.
      setAcademicWorksheetsOpen(true);
    },
    closeResearchWorksheets: () => setAcademicWorksheetsOpen(false),
    openInventory: () => {
      // Keep pauseOpen so closing inventory returns to the Scroll hub.
      setInventoryOpen(true);
    },
    closeInventory: () => setInventoryOpen(false),
    openSatchel: () => {
      // Keep pauseOpen so closing satchel returns to the Scroll hub.
      setSatchelOpen(true);
    },
    closeSatchel: () => setSatchelOpen(false),
    dismissRestedReadiness: () => setRestedReadinessOpen(false),
    openDemoClosing: () => {
      setPauseOpen(false);
      setScreen('demoClosing');
    },
    openCampfireSave: () => {
      setPauseOpen(false);
      setScreen('campfireSave');
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
            text: "You have not been handed the Guild's interview summons yet — visit your guild hall on the map after your papers are in review.",
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
  // --- Side quest bridge: guild research (SQ-206–218) + clear all fog (SQ-219) ---
  // Fires whenever the guild HQ atlas revealed list changes.
  const guildHqRevealedCount = exploration.guild_hq_atlas_revealed_realm_ids?.length ?? 0;
  useEffect(() => {
    if (guildHqRevealedCount < 4) return; // nothing to check until 4+ guilds
    setQuests((q) => {
      const res = checkGuildResearchSideQuests(q, guildHqRevealedCount);
      const fog = checkClearAllFogSideQuest(res.nextQuests, guildHqRevealedCount);
      const totalXp = res.xpAwarded + fog.xpAwarded;
      if (totalXp > 0) {
        setPlayer((p) => (p ? { ...p, xp_total: p.xp_total + totalXp } : p));
      }
      return fog.nextQuests;
    });
  }, [guildHqRevealedCount]);

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
    activeLedgerRealmId,
    consumeRealmAtlasInitialGuildIntent,
    consumeRealmAtlasFogRevealIntent,
    worldMapOpen,
    realmTravelNotice,
    academicWorksheetsOpen,
    inventoryOpen,
    satchelOpen,
    restedReadinessOpen,
    handleUseConsumable,
    moduleHostOpen,
    activeModuleId,
    scrollRevealOpen,
    truePathPickerOpen,
    openTruePathPicker: () => setTruePathPickerOpen(true),
    closeTruePathPicker: () => setTruePathPickerOpen(false),
    selectTruePath,
    dismissScrollReveal: (committedSignpostIds: readonly string[]) => {
      setScrollRevealOpen(false);
      // Restore exploration music after the scroll reveal ceremony ends.
      getLhAudioDirector().setLane('exploration');
      setExploration((e) => ({
        ...e,
        scroll_reveal_performed: true,
        // Commit the signpost IDs shown during the reveal so the hub displays the
        // same runes immediately when the player opens their scroll after returning
        // to Scribe.  Only overwrite if IDs were not already set by the quest flow.
        foretold_signpost_realm_ids: e.foretold_signpost_realm_ids?.length
          ? e.foretold_signpost_realm_ids
          : [...committedSignpostIds],
      }));
      // Scribe's post-reveal reaction: four beats in the normal RPG dialogue box
      // (not inside the cinematic) so the player reads them after returning to
      // the exploration view. Each \n\n is a separate click-through page.
      setNpcDialogue({
        npcId: LH_NPC_ID_MASTER_SCRIBE,
        title: 'Master Scribe',
        speakerLabel: 'Master Scribe',
        body: 'This should not be here.\n\nYour first signs are clear… but something else has marked the Scroll.\n\nI can record what the Scroll reveals. I cannot interpret what has awakened beneath it.\n\nThe Oracle must see this. Find the shrine beyond the path, and return to me when her vision is complete.',
        portraitUrl: undefined,
        narrationSequenceId: 'master_scribe_post_scroll_reveal',
      });
    },
    oracleCinematicOpen,
    dismissOracleCinematic: () => {
      if (typeof console !== 'undefined') {
        console.log('[LH_ORACLE] cinematic ended — opening book-shelf prophecy reveal');
      }
      setOracleCinematicOpen(false);
      setOracleProphecyOpen(true);
    },
    preRevealCheckpointOpen,
    dismissPreRevealCheckpoint: () => {
      setPreRevealCheckpointOpen(false);
    },
    oracleProphecyOpen,
    dismissOracleProphecy: () => {
      if (typeof console !== 'undefined') {
        console.log('[LH_ORACLE] prophecy reveal completed');
        console.log('[LH_ORACLE_ALTAR] sequence completed');
      }
      setOracleProphecyOpen(false);
      // Complete mq-201 now that the player has witnessed the prophecy reveal.
      completeQuestWithXp('mq-201');
      if (typeof console !== 'undefined') {
        console.log('[LH_ORACLE] mq-201 completed — mq-202 (Runes Become Legible) unlocking');
      }
      // Part 7: Brand the Scroll with the oracle prophecy and mark Drive sync pending.
      const realmIds = exploration.foretold_signpost_realm_ids ?? [];
      const prophecyEntry = resolveOracleProphecyFromRealmIds(realmIds);
      if (typeof console !== 'undefined') {
        console.log('[LH_ORACLE] branding Scroll', {
          prophecyId: prophecyEntry.prophecy_id,
          title: prophecyEntry.title,
          realmId: prophecyEntry.realm_id,
          url: prophecyEntry.oracle_url,
        });
      }
      setExploration((e) => ({
        ...e,
        oracle_prophecy_id: prophecyEntry.prophecy_id,
        oracle_prophecy_realm_id: prophecyEntry.realm_id,
        oracle_prophecy_title: prophecyEntry.title,
        oracle_prophecy_career_url: prophecyEntry.oracle_url,
        // Part 8: Drive sync starts in 'pending' state; teacher creates the file separately.
        quest_of_fate_sync_status: e.quest_of_fate_sync_status ?? 'pending',
      }));
    },
    bootstrapPhase,
    bootstrapError,
    allRealms,
    realmProgress,
    exploration,
    mediaAssets: BLUEPRINT.media_assets,
    parsedMap: activeMap,
    tileMapUrl: activeTileMapUrl,
    /** True once the first knowledge-combat trigger has been activated (acts as gate for repeat kc). */
    firstKcBeaten: LOST_ECHO_KC_INTERACTABLE_IDS.some((id) => visitedInteractableIds.includes(id)),
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
    recordRealmResearch,
    updateRealmReflection,
    submitComparisonLedger,
    comparisonLedgerGateStatus,
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
    campfirePrompt,
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
