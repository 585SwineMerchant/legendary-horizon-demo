import { useEffect, useMemo, useState } from 'react';

import { PauseMenu } from './components/PauseMenu';
import { TeacherToolsPanel } from './components/TeacherToolsPanel';
import { RealmAtlasOverlay } from './components/RealmAtlasOverlay';
import { WorldMapOverlay } from './components/WorldMapOverlay';
import { AcademicWorksheetsOverlay } from './components/AcademicWorksheetsOverlay';
import { InventoryOverlay } from './components/InventoryOverlay';
import { QuestLogShell } from './components/QuestLogShell';
import { SystemToastOverlay } from './components/SystemToastOverlay';
import { ModuleHostOverlay } from './components/ModuleHostOverlay';
import { useLhAccessibilityPrefs } from './hooks/useLhAccessibilityPrefs';
import { useNightOneFlow } from './hooks/useNightOneFlow';
import { DemoClosingScreen } from './screens/DemoClosingScreen';
import { ExplorationScreen } from './screens/ExplorationScreen';
import { GameTitleScreen } from './screens/GameTitleScreen';
import { IntroCinematicScreen } from './screens/IntroCinematicScreen';
import { TitleScreen } from './screens/TitleScreen';
import { TeacherDashboardScreen } from './screens/TeacherDashboardScreen';
import { isTerminalQuestStatus } from './quests/questEngine';
import { sortRealmsCanon } from './realm/realmRegistry';
import { getLhAudioDirector } from './lib/lhAudioDirector';
import {
  exitLhEmbedFullscreen,
  isLhFullscreenActive,
  requestLhEmbedFullscreen,
} from './lib/lhEmbedFullscreen';
import { auditCoreyRequiredMedia } from './lib/lhMissingMediaAudit';
import { activateLhGlobalContinue } from './lib/lhGlobalContinue';
import { playLhSfx } from './lib/lhSfx';

/**
 * Thin composition root: Day&nbsp;2 flow state lives in `useNightOneFlow`,
 * screens stay isolated under `screens/`.
 */
export function App() {
  const a11y = useLhAccessibilityPrefs();
  const teacherEnabled = import.meta.env.DEV || import.meta.env.VITE_LH_TEACHER_DASHBOARD === 'true';
  const [teacherDashboardOpen, setTeacherDashboardOpen] = useState(false);
  const {
    screen,
    realm,
    player,
    quests,
    activeQuestDefinition,
    showQuestDebug,
    npcDialogue,
    demoGuidance,
    dismissNpcDialogue,
    activeEncounter,
    onEncounterWin,
    onEncounterRetreat,
    titleBackdropUrl,
    classroomTools,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    maiaHandoffActive,
    maiaHandoffPromptActive,
    openMaiaHandoffWindow,
    forceReturnFromMaia,
    explorationHotspots,
    hotspotControls,
    navigate,
    handleManualSave,
    handleEndSessionRitual,
    ledgerDraft,
    setLedgerDraft,
    tiledMapDebug,
    realmAtlasOpen,
    realmAtlasInitialGuildRealmId,
    realmAtlasFogRevealRealmId,
    consumeRealmAtlasInitialGuildIntent,
    consumeRealmAtlasFogRevealIntent,
    worldMapOpen,
    realmTravelNotice,
    allRealms,
    realmProgress,
    exploration,
    mediaAssets,
    parsedMap,
    mapVariant,
    setMapVariant,
    stableMapLoading,
    stableMapError,
    act3,
    enterRealmFromWorldMap,
    primaryWorldTriggerRealmId,
    clearFogKey,
    researchRealm,
    submitLedgerEntry,
    markActiveWaypointVisited,
    visitedInteractableIds,
    phaserExplorationRemountKey,
    markQuestTurnedIn,
    updateRealmNotes,
    academicWorksheetsOpen,
    applyAcademicTasks,
    startAcademicTask,
    academicWorksheetDefs,
    inventoryOpen,
    moduleHostOpen,
    activeModuleId,
    getModuleDraft,
    patchModuleDraft,
    clearModuleDraft,
    applyModuleResult,
    bootstrapPhase,
    bootstrapError,
    facilitatorToolsProps,
    pauseCanOpenGt101,
    pauseCanOpenGt102,
    gt102InterviewArrivalMissedDeadline,
    guildPathExplorationBanner,
    guildPathQuestLogNote,
  } = useNightOneFlow();

  useEffect(() => {
    void auditCoreyRequiredMedia();
  }, []);

  useEffect(() => {
    let lastHoverAt = 0;
    const isSoundTarget = (target: EventTarget | null): boolean =>
      target instanceof Element && Boolean(target.closest('button, [role="button"], a[href]'));

    const onPointerOver = (ev: PointerEvent) => {
      if (!isSoundTarget(ev.target)) return;
      const now = performance.now();
      if (now - lastHoverAt < 80) return;
      lastHoverAt = now;
      playLhSfx('ui_hover');
    };

    const onClick = (ev: MouseEvent) => {
      if (!isSoundTarget(ev.target)) return;
      playLhSfx('ui_select');
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  // Presentation polish: one music lane at a time, clean fades, no overlap.
  useEffect(() => {
    const dir = getLhAudioDirector();

    if (teacherDashboardOpen) {
      dir.setLane(null);
      return;
    }
    // Intro + title menus: no exploration music yet. The intro iframe fades its own audio bed; we fade in a title continuation bed.
    if (screen === 'title') {
      dir.setLane(null);
      return;
    }
    // Intro video carries its own audio bed; title lane starts when the overlay opens (see IntroCinematicScreen).
    if (screen === 'intro') {
      dir.setLane(null);
      return;
    }
    if (screen === 'gameTitle') {
      dir.setLane('title');
      return;
    }
    if (screen === 'explore' && activeEncounter) {
      dir.setLane('battle');
      dir.refreshAudibility(400);
      return;
    }
    if (screen === 'explore') {
      dir.setLane('exploration');
      return;
    }
    dir.setLane(null);
  }, [teacherDashboardOpen, screen, activeEncounter]);

  useEffect(() => {
    const dir = getLhAudioDirector();
    // Duck music during Atlas reveal / full-screen atlas moments to give SFX room.
    // (If the atlas is opened just for browsing, the duck still feels intentional/cinematic.)
    dir.setDucked(Boolean(realmAtlasOpen));
  }, [realmAtlasOpen]);

  // Music-only mute toggles `data-lh-music`; the director needs an explicit poke to re-evaluate volumes
  // since no DOM event fires for dataset changes.
  useEffect(() => {
    getLhAudioDirector().refreshAudibility();
  }, [a11y.musicMuted, a11y.audioMuted]);

  useEffect(() => {
    const root = document.documentElement;
    if (screen === 'intro') {
      root.dataset.lhIntroMusicBypass = '1';
    } else {
      delete root.dataset.lhIntroMusicBypass;
    }
    getLhAudioDirector().refreshAudibility(400);
  }, [screen]);

  useEffect(() => {
    const toggleFs = async () => {
      try {
        if (isLhFullscreenActive()) await exitLhEmbedFullscreen();
        else await requestLhEmbedFullscreen(document.getElementById('root'));
      } catch {
        /* fullscreen may be blocked in embedded contexts */
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('input, textarea, select, [contenteditable="true"]')) return;

      const k = e.key;
      if ((k === 'f' || k === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        void toggleFs();
        return;
      }
      if ((k === 'm' || k === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        a11y.setMusicMuted(!a11y.musicMuted);
        getLhAudioDirector().refreshAudibility(200);
        return;
      }
      if (k !== 'Enter' || e.ctrlKey || e.metaKey) return;

      if (activateLhGlobalContinue()) {
        e.preventDefault();
        return;
      }

      if (teacherDashboardOpen) return;

      if (screen === 'title' && bootstrapPhase !== 'loading') {
        e.preventDefault();
        navigate.beginDemo();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    a11y.setMusicMuted,
    a11y.musicMuted,
    teacherDashboardOpen,
    pauseOpen,
    realmAtlasOpen,
    worldMapOpen,
    inventoryOpen,
    questLogOpen,
    academicWorksheetsOpen,
    moduleHostOpen,
    screen,
    bootstrapPhase,
    navigate,
  ]);

  const showMapDebug = import.meta.env.DEV || import.meta.env.VITE_LH_MAP_DEBUG === 'true';
  const showPauseGuildModuleShortcuts =
    import.meta.env.DEV || import.meta.env.VITE_LH_PAUSE_MODULE_SHORTCUTS === 'true';

  const manifestActComplete = useMemo(
    () => quests.some((q) => q.quest_id === 'mq_act1_manifest_support' && isTerminalQuestStatus(q.status)),
    [quests],
  );
  const oracleActComplete = useMemo(
    () => quests.some((q) => q.quest_id === 'mq_act2_oracle_of_fate' && isTerminalQuestStatus(q.status)),
    [quests],
  );
  const vaultRitualComplete = useMemo(
    () => quests.some((q) => q.quest_id === 'mq_act2_vault_of_runes' && isTerminalQuestStatus(q.status)),
    [quests],
  );
  const enrollmentRuneQuest = useMemo(
    () => quests.find((q) => q.quest_id === 'gq_gt101_enrollment_rune'),
    [quests],
  );
  const trialOfTonguesQuest = useMemo(
    () => quests.find((q) => q.quest_id === 'gq_gt102_trial_of_tongues'),
    [quests],
  );
  const enrollmentRuneQuestReachable = Boolean(
    enrollmentRuneQuest && enrollmentRuneQuest.status !== 'locked',
  );
  const trialOfTonguesQuestReachable = Boolean(trialOfTonguesQuest && trialOfTonguesQuest.status !== 'locked');

  const manifestRealmPickList = useMemo(
    () => sortRealmsCanon(allRealms).map((r) => ({ realm_id: r.realm_id, label: r.display_name })),
    [allRealms],
  );

  const explorationSignpostStrip = useMemo(() => {
    const ids = exploration.foretold_signpost_realm_ids ?? [];
    if (!ids.length) return null;
    const labels = ids.map((id) => allRealms.find((r) => r.realm_id === id)?.display_name ?? id);
    return { labels };
  }, [exploration.foretold_signpost_realm_ids, allRealms]);

  return (
    <div className="lh-shell">
      <a href="#lh-main" className="lh-skip-link">
        Skip to main content
      </a>
      <main id="lh-main" className="lh-main-root" tabIndex={-1}>
      {teacherDashboardOpen ? (
        <TeacherDashboardScreen
          onBack={() => setTeacherDashboardOpen(false)}
        />
      ) : null}
      {!teacherDashboardOpen && screen === 'title' ? (
        <TitleScreen
          onContinue={navigate.beginDemo}
          onOpenTeacherDashboard={teacherEnabled ? () => setTeacherDashboardOpen(true) : undefined}
          bootstrapPhase={bootstrapPhase}
          bootstrapError={bootstrapError}
          backdropImageUrl={titleBackdropUrl}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'gameTitle' ? (
        <GameTitleScreen
          onStart={navigate.gameTitleStart}
          onResume={navigate.gameTitleResume}
          mapVariant={mapVariant}
          onMapVariantChange={setMapVariant}
          stableMapLoading={stableMapLoading}
          stableMapError={stableMapError}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'intro' ? (
        <IntroCinematicScreen onIntroComplete={() => navigate.introCompleteToExplore()} />
      ) : null}

      {!teacherDashboardOpen && screen === 'explore' && player ? (
        <ExplorationScreen
          player={player}
          realm={realm}
          phaserSurfaceTriggerRealmId={primaryWorldTriggerRealmId}
          phaserSessionRemountKey={phaserExplorationRemountKey}
          hotspots={explorationHotspots}
          onActivateHotspot={hotspotControls.activate}
          parsedMap={parsedMap}
          demoGuidance={demoGuidance}
          renderer="phaser"
          saveFeedback={null}
          maiaHandoffActive={maiaHandoffActive}
          maiaHandoffPromptActive={maiaHandoffPromptActive}
          onOpenMaiaHandoff={openMaiaHandoffWindow}
          onReturnFromMaiaHandoff={forceReturnFromMaia}
          onDismissSaveFeedback={undefined}
          onPause={navigate.openPause}
          onOpenQuestLog={navigate.openQuestLog}
          onOpenInventory={navigate.openInventory}
          onOpenDemoClosing={navigate.openDemoClosing}
          act3={{
            activeWaypointLabel: act3.activeWaypointLabel,
            fogCleared: act3.fogCleared,
            fogTotal: act3.fogTotal,
            waypointVisited: act3.waypointVisited,
            waypointTotal: act3.waypointTotal,
            scrollLedgerMilestone: act3.scrollLedgerMilestone,
            onOpenWorldAtlas: navigate.openRealmAtlas,
            onMarkWaypoint: markActiveWaypointVisited,
          }}
          mapDebug={showMapDebug ? tiledMapDebug : null}
          activeQuestDefinition={activeQuestDefinition}
          questDebug={showQuestDebug ? { quests } : null}
          npcDialogue={npcDialogue}
          onDismissNpcDialogue={dismissNpcDialogue}
          activeEncounter={activeEncounter}
          onEncounterWin={onEncounterWin}
          onEncounterRetreat={onEncounterRetreat}
          lostEchoDiagVisitedTriggerIds={visitedInteractableIds}
          guildBreatherBanner={
            guildPathExplorationBanner
              ? { title: guildPathExplorationBanner.bannerTitle, body: guildPathExplorationBanner.bannerBody }
              : null
          }
          signpostStrip={explorationSignpostStrip}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'demoClosing' ? (
        <DemoClosingScreen
          onBackToExplore={navigate.resumeToExplore}
          onQuitToTitle={navigate.quitToTitle}
          classroomTools={classroomTools}
        />
      ) : null}

      {!teacherDashboardOpen ? <PauseMenu
        open={pauseOpen && screen === 'explore'}
        onResume={navigate.closePause}
        onOpenQuestLog={() => {
          navigate.closePause();
          navigate.openQuestLog();
        }}
        onOpenEnrollmentRune={
          showPauseGuildModuleShortcuts || (pauseCanOpenGt101 && enrollmentRuneQuestReachable)
            ? () => navigate.openModule('mod_gt101_enrollment_rune')
            : undefined
        }
        onOpenTrialOfTongues={
          showPauseGuildModuleShortcuts || (pauseCanOpenGt102 && trialOfTonguesQuestReachable)
            ? () => navigate.openModule('mod_gt102_trial_of_tongues')
            : undefined
        }
        onOpenManifest={() => navigate.openModule('mod_manifest_sod')}
        onOpenOracleOfFate={
          showPauseGuildModuleShortcuts || manifestActComplete
            ? () => navigate.openModule('mod_oracle_of_fate')
            : undefined
        }
        onOpenVaultOfRunes={
          showPauseGuildModuleShortcuts || oracleActComplete
            ? () => navigate.openModule('mod_vault_of_runes')
            : undefined
        }
        onOpenRealmAtlas={navigate.openRealmAtlas}
        onOpenWorldMap={navigate.openWorldMap}
        charterWorldMapTooltip={
          vaultRitualComplete
            ? 'Charter tiles, fog, realm notes, guild research, and comparison ledger are all active for Act III.'
            : 'Charter tiles stay open. Fog, notes, HQ research stamps, and the comparison ledger unlock after the Vault of Runes (Pause → Act II).'
        }
        charterWorldMapHint={
          showPauseGuildModuleShortcuts || vaultRitualComplete
            ? undefined
            : 'Act II: finish the Vault of Runes, then return here for fog, notes, and the comparison ledger (Act III).'
        }
        onOpenInventory={() => {
          navigate.closePause();
          navigate.openInventory();
        }}
        onSave={handleManualSave}
        onEndSession={handleEndSessionRitual}
        onResearchWorksheets={navigate.openResearchWorksheets}
        onQuitToTitle={navigate.quitToTitle}
        displayPreferences={{
          textScale: a11y.textScale,
          onTextScaleChange: a11y.setTextScale,
          motion: a11y.motion,
          onMotionChange: a11y.setMotion,
          lowClutter: a11y.lowClutter,
          onLowClutterChange: a11y.setLowClutter,
          audioMuted: a11y.audioMuted,
          onAudioMutedChange: a11y.setAudioMuted,
          musicMuted: a11y.musicMuted,
          onMusicMutedChange: a11y.setMusicMuted,
        }}
        classroomTools={classroomTools}
        facilitatorTools={facilitatorToolsProps ? <TeacherToolsPanel {...facilitatorToolsProps} /> : null}
      /> : null}

      {!teacherDashboardOpen ? (
        <SystemToastOverlay message={saveFeedback} onConsumed={navigate.dismissSaveFeedback} />
      ) : null}

      {!teacherDashboardOpen && inventoryOpen && player ? (
        <InventoryOverlay open={inventoryOpen} onClose={navigate.closeInventory} player={player} />
      ) : null}

      {!teacherDashboardOpen && academicWorksheetsOpen && player ? (
        <AcademicWorksheetsOverlay
          open={academicWorksheetsOpen}
          onClose={navigate.closeResearchWorksheets}
          defs={academicWorksheetDefs}
          exploration={exploration}
          onApplyTasks={applyAcademicTasks}
          onStartTask={startAcademicTask}
        />
      ) : null}

      {!teacherDashboardOpen && realmAtlasOpen && player ? (
        <RealmAtlasOverlay
          open={realmAtlasOpen}
          onClose={navigate.closeRealmAtlas}
          realms={allRealms}
          currentRealmId={player.current_realm_id}
          quests={quests}
          mediaCatalog={mediaAssets}
          realmProgress={realmProgress}
          guildHqAtlasRevealedRealmIds={exploration.guild_hq_atlas_revealed_realm_ids ?? []}
          foretoldSignpostRealmIds={exploration.foretold_signpost_realm_ids ?? []}
          initialGuildInfoRealmId={realmAtlasInitialGuildRealmId}
          onInitialGuildInfoConsumed={consumeRealmAtlasInitialGuildIntent}
          fogRevealRealmId={realmAtlasFogRevealRealmId}
          onFogRevealConsumed={consumeRealmAtlasFogRevealIntent}
        />
      ) : null}

      {!teacherDashboardOpen && worldMapOpen && player ? (
        <WorldMapOverlay
          open={worldMapOpen}
          onClose={navigate.closeWorldMap}
          realms={allRealms}
          player={player}
          quests={quests}
          exploration={exploration}
          realmProgress={realmProgress}
          parsedMap={parsedMap}
          realmTravelNotice={realmTravelNotice}
          ledgerDraft={ledgerDraft}
          onLedgerDraftChange={(patch) => setLedgerDraft((d) => ({ ...d, ...patch }))}
          onTravelToRealm={enterRealmFromWorldMap}
          onClearFog={clearFogKey}
          onResearchRealm={researchRealm}
          onUpdateRealmNotes={updateRealmNotes}
          onSubmitLedger={submitLedgerEntry}
          vaultRitualComplete={vaultRitualComplete}
          foretoldSignpostRealmIds={exploration.foretold_signpost_realm_ids ?? []}
        />
      ) : null}

      {!teacherDashboardOpen ? <QuestLogShell
        open={questLogOpen}
        quests={quests}
        onClose={navigate.closeQuestLog}
        onMarkQuestTurnedIn={markQuestTurnedIn}
        guildPathBreatherNote={guildPathQuestLogNote}
        currentRequiredNextAction={player?.required_next_action ?? null}
      /> : null}

      {!teacherDashboardOpen ? <ModuleHostOverlay
        open={moduleHostOpen}
        moduleId={activeModuleId}
        onClose={navigate.closeModule}
        playerId={player?.player_id ?? 'unknown_player'}
        realmId={player?.current_realm_id ?? realm.realm_id}
        gt102InterviewArrivalMissedDeadline={gt102InterviewArrivalMissedDeadline}
        manifestRealmPickList={manifestRealmPickList}
        draft={activeModuleId ? getModuleDraft(activeModuleId) : {}}
        onDraftChange={(patch) => {
          if (!activeModuleId) return;
          patchModuleDraft(activeModuleId, patch);
        }}
        onSubmitResult={(payload) => {
          applyModuleResult(payload);
          clearModuleDraft(payload.module_id);
          navigate.closeModule();
        }}
      /> : null}
      </main>
    </div>
  );
}
