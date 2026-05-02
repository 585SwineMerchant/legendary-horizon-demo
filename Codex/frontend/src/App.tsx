import { PauseMenu } from './components/PauseMenu';
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
    mentorPortrait,
    resumeDialogBody,
    pauseOpen,
    questLogOpen,
    saveFeedback,
    explorationHotspots,
    hotspotControls,
    navigate,
    handleManualSave,
  } = useNightOneFlow();

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
        />
      ) : null}

      <PauseMenu
        open={pauseOpen && screen === 'explore'}
        onResume={navigate.closePause}
        onOpenQuestLog={() => {
          navigate.closePause();
          navigate.openQuestLog();
        }}
        onSave={handleManualSave}
        onQuitToTitle={navigate.quitToTitle}
      />

      <QuestLogShell open={questLogOpen} quests={quests} onClose={navigate.closeQuestLog} />
    </div>
  );
}
