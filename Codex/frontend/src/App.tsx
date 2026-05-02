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

/**
 * Thin composition root: Day&nbsp;2 flow state lives in `useNightOneFlow`,
 * screens stay isolated under `screens/`.
 */
export function App() {
  const a11y = useLhAccessibilityPrefs();
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
    allRealms,
    realmProgress,
    exploration,
    mediaAssets,
    parsedMap,
    act3,
    enterRealmFromWorldMap,
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
  } = useNightOneFlow();

  const showMapDebug = import.meta.env.DEV || import.meta.env.VITE_LH_MAP_DEBUG === 'true';

  return (
    <div className="lh-shell">
      <a href="#lh-main" className="lh-skip-link">
        Skip to main content
      </a>
      <main id="lh-main" className="lh-main-root" tabIndex={-1}>
      {screen === 'title' ? (
        <TitleScreen
          onContinue={navigate.beginDemo}
          bootstrapPhase={bootstrapPhase}
          bootstrapError={bootstrapError}
          backdropImageUrl={titleBackdropUrl}
        />
      ) : null}

      {screen === 'instructions' ? (
        <InstructionsScreen
          onBack={navigate.quitToTitle}
          onStartSession={navigate.proceedInstructions}
          classroomTools={classroomTools}
        />
      ) : null}

      {screen === 'resume' && player ? (
        <ResumeDialogScreen
          portraitUrl={mentorPortrait}
          speakerLabel={resumeMentorSpeakerLabel}
          dialogueBody={resumeDialogBody}
          onContinue={navigate.resumeToExplore}
        />
      ) : null}

      {screen === 'explore' && player ? (
        <ExplorationScreen
          player={player}
          realm={realm}
          hotspots={explorationHotspots}
          onActivateHotspot={hotspotControls.activate}
          parsedMap={parsedMap}
          renderer={(import.meta.env.VITE_LH_RENDERER as 'hotspots' | 'phaser' | undefined) ?? 'hotspots'}
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
            onOpenWorldMap: navigate.openWorldMap,
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
        />
      ) : null}

      <PauseMenu
        open={pauseOpen && screen === 'explore'}
        onResume={navigate.closePause}
        onOpenQuestLog={() => {
          navigate.closePause();
          navigate.openQuestLog();
        }}
        onOpenEnrollmentRune={() => navigate.openModule('mod_gt101_enrollment_rune')}
        onOpenTrialOfTongues={() => navigate.openModule('mod_gt102_trial_of_tongues')}
        onOpenManifest={() => navigate.openModule('mod_manifest_sod')}
        onOpenOracleOfFate={() => navigate.openModule('mod_oracle_of_fate')}
        onOpenVaultOfRunes={() => navigate.openModule('mod_vault_of_runes')}
        onOpenRealmAtlas={navigate.openRealmAtlas}
        onOpenWorldMap={navigate.openWorldMap}
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
      />

      {inventoryOpen && player ? (
        <InventoryOverlay open={inventoryOpen} onClose={navigate.closeInventory} player={player} />
      ) : null}

      {academicWorksheetsOpen && player ? (
        <AcademicWorksheetsOverlay
          open={academicWorksheetsOpen}
          onClose={navigate.closeResearchWorksheets}
          defs={academicWorksheetDefs}
          exploration={exploration}
          onApplyTasks={applyAcademicTasks}
          onStartTask={startAcademicTask}
        />
      ) : null}

      {realmAtlasOpen && player ? (
        <RealmAtlasOverlay
          open={realmAtlasOpen}
          onClose={navigate.closeRealmAtlas}
          realms={allRealms}
          currentRealmId={player.current_realm_id}
          quests={quests}
          mediaCatalog={mediaAssets}
          realmProgress={realmProgress}
        />
      ) : null}

      {worldMapOpen && player ? (
        <WorldMapOverlay
          open={worldMapOpen}
          onClose={navigate.closeWorldMap}
          realms={allRealms}
          player={player}
          quests={quests}
          exploration={exploration}
          realmProgress={realmProgress}
          parsedMap={parsedMap}
          ledgerDraft={ledgerDraft}
          onLedgerDraftChange={(patch) => setLedgerDraft((d) => ({ ...d, ...patch }))}
          onTravelToRealm={enterRealmFromWorldMap}
          onClearFog={clearFogKey}
          onResearchRealm={researchRealm}
          onUpdateRealmNotes={updateRealmNotes}
          onSubmitLedger={submitLedgerEntry}
        />
      ) : null}

      <QuestLogShell
        open={questLogOpen}
        quests={quests}
        onClose={navigate.closeQuestLog}
        onMarkQuestTurnedIn={markQuestTurnedIn}
      />

      <ModuleHostOverlay
        open={moduleHostOpen}
        moduleId={activeModuleId}
        onClose={navigate.closeModule}
        playerId={player?.player_id ?? 'unknown_player'}
        realmId={player?.current_realm_id ?? realm.realm_id}
        draft={activeModuleId ? getModuleDraft(activeModuleId) : {}}
        onDraftChange={(patch) => {
          if (!activeModuleId) return;
          patchModuleDraft(activeModuleId, patch);
        }}
        onSubmitResult={(payload) => {
          // For now: treat module completion as a narrative checkpoint + clear draft.
          clearModuleDraft(payload.module_id);
          applyModuleResult(payload);
          navigate.closeModule();
        }}
      />
      </main>
    </div>
  );
}
