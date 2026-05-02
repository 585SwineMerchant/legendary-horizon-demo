import { PauseMenu } from './components/PauseMenu';
import { RealmAtlasOverlay } from './components/RealmAtlasOverlay';
import { WorldMapOverlay } from './components/WorldMapOverlay';
import { QuestLogShell } from './components/QuestLogShell';
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
  const {
    screen,
    realm,
    player,
    quests,
    activeQuestDefinition,
    showQuestDebug,
    mentorPortrait,
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
  } = useNightOneFlow();

  const showMapDebug = import.meta.env.DEV || import.meta.env.VITE_LH_MAP_DEBUG === 'true';

  return (
    <div className="lh-shell">
      {screen === 'title' ? <TitleScreen onContinue={navigate.beginDemo} /> : null}

      {screen === 'instructions' ? (
        <InstructionsScreen onBack={navigate.quitToTitle} onStartSession={navigate.proceedInstructions} />
      ) : null}

      {screen === 'resume' && player ? (
        <ResumeDialogScreen
          portraitUrl={mentorPortrait}
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
          saveFeedback={saveFeedback}
          onDismissSaveFeedback={saveFeedback ? navigate.dismissSaveFeedback : undefined}
          onPause={navigate.openPause}
          onOpenQuestLog={navigate.openQuestLog}
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
        />
      ) : null}

      <PauseMenu
        open={pauseOpen && screen === 'explore'}
        onResume={navigate.closePause}
        onOpenQuestLog={() => {
          navigate.closePause();
          navigate.openQuestLog();
        }}
        onOpenRealmAtlas={navigate.openRealmAtlas}
        onOpenWorldMap={navigate.openWorldMap}
        onSave={handleManualSave}
        onEndSession={handleEndSessionRitual}
        onQuitToTitle={navigate.quitToTitle}
      />

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
          onSubmitLedger={submitLedgerEntry}
        />
      ) : null}

      <QuestLogShell
        open={questLogOpen}
        quests={quests}
        onClose={navigate.closeQuestLog}
        onMarkQuestTurnedIn={markQuestTurnedIn}
      />
    </div>
  );
}
