import { useMemo, useState } from 'react';

import { PauseMenu } from './components/PauseMenu';
import { TeacherToolsPanel } from './components/TeacherToolsPanel';
import { RealmAtlasOverlay } from './components/RealmAtlasOverlay';
import { WorldMapOverlay } from './components/WorldMapOverlay';
import { AcademicWorksheetsOverlay } from './components/AcademicWorksheetsOverlay';
import { InventoryOverlay } from './components/InventoryOverlay';
import { QuestLogShell } from './components/QuestLogShell';
import { ModuleHostOverlay } from './components/ModuleHostOverlay';
import { useLhAccessibilityPrefs } from './hooks/useLhAccessibilityPrefs';
import { useNightOneFlow } from './hooks/useNightOneFlow';
import { ExplorationScreen } from './screens/ExplorationScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';
import { ResumeDialogScreen } from './screens/ResumeDialogScreen';
import { TitleScreen } from './screens/TitleScreen';
import { TeacherDashboardScreen } from './screens/TeacherDashboardScreen';
import { isTerminalQuestStatus } from './quests/questEngine';
import { sortRealmsCanon } from './realm/realmRegistry';

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
    mentorPortrait,
    resumeMentorSpeakerLabel,
    npcDialogue,
    dismissNpcDialogue,
    activeEncounter,
    onEncounterWin,
    onEncounterRetreat,
    titleBackdropUrl,
    classroomTools,
    resumeDialogBody,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    explorationHotspots,
    hotspotControls,
    navigate,
    handleManualSave,
    handleEndSessionRitual,
    ledgerDraft,
    setLedgerDraft,
    tiledMapDebug,
    realmAtlasOpen,
    worldMapOpen,
    realmTravelNotice,
    allRealms,
    realmProgress,
    exploration,
    mediaAssets,
    parsedMap,
    act3,
    enterRealmFromWorldMap,
    primaryWorldTriggerRealmId,
    clearFogKey,
    researchRealm,
    submitLedgerEntry,
    markActiveWaypointVisited,
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

      {!teacherDashboardOpen && screen === 'instructions' ? (
        <InstructionsScreen
          onBack={navigate.quitToTitle}
          onStartSession={navigate.proceedInstructions}
          classroomTools={classroomTools}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'resume' && player ? (
        <ResumeDialogScreen
          portraitUrl={mentorPortrait}
          speakerLabel={resumeMentorSpeakerLabel}
          dialogueBody={resumeDialogBody}
          onContinue={navigate.resumeToExplore}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'explore' && player ? (
        <ExplorationScreen
          player={player}
          realm={realm}
          phaserSurfaceTriggerRealmId={primaryWorldTriggerRealmId}
          hotspots={explorationHotspots}
          onActivateHotspot={hotspotControls.activate}
          parsedMap={parsedMap}
          renderer="phaser"
          saveFeedback={saveFeedback}
          onDismissSaveFeedback={saveFeedback ? navigate.dismissSaveFeedback : undefined}
          onPause={navigate.openPause}
          onOpenQuestLog={navigate.openQuestLog}
          onOpenInventory={navigate.openInventory}
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
          guildBreatherBanner={
            guildPathExplorationBanner
              ? { title: guildPathExplorationBanner.bannerTitle, body: guildPathExplorationBanner.bannerBody }
              : null
          }
          signpostStrip={explorationSignpostStrip}
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
        }}
        classroomTools={classroomTools}
        facilitatorTools={facilitatorToolsProps ? <TeacherToolsPanel {...facilitatorToolsProps} /> : null}
      /> : null}

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
          classroomTools={classroomTools}
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
