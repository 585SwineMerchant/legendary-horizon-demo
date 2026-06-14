import { useEffect, useMemo, useState } from 'react';

import { BuildDebugStamp } from './components/BuildDebugStamp';
import { ScrollOfDestinyDisplay } from './components/ScrollOfDestinyDisplay';
import { ScrollRevealSequence } from './modules/act1/ScrollRevealSequence';
import { SCROLL_ASSETS } from './components/scrollUI/scrollAssets';
import { OracleProphecyReveal } from './screens/OracleProphecyReveal';
import { OracleCinematicPlayer } from './screens/OracleCinematicPlayer';
import { resolveOracleProphecyFromRealmIds } from './modules/act2/oracleCareerData';
import { RealmAtlasOverlay } from './components/RealmAtlasOverlay';
import { WorldMapOverlay } from './components/WorldMapOverlay';
import { AcademicWorksheetsOverlay } from './components/AcademicWorksheetsOverlay';
import { InventoryOverlay } from './components/InventoryOverlay';
import { SatchelOverlay } from './components/SatchelOverlay';
import { RestedReadinessModal } from './components/RestedReadinessModal';
import { computeRestedReadinessTier } from './services/restedReadiness';
import { QuestLogShell } from './components/QuestLogShell';
import { SystemToastOverlay } from './components/SystemToastOverlay';
import { ModuleHostOverlay } from './components/ModuleHostOverlay';
import { useLhAccessibilityPrefs } from './hooks/useLhAccessibilityPrefs';
import { useNightOneFlow } from './hooks/useNightOneFlow';
import { CampfireSaveScreen } from './screens/CampfireSaveScreen';
import { DemoClosingScreen } from './screens/DemoClosingScreen';
import { ExplorationScreen } from './screens/ExplorationScreen';
import { GameTitleScreen } from './screens/GameTitleScreen';
import { IntroCinematicScreen } from './screens/IntroCinematicScreen';
import { TitleScreen } from './screens/TitleScreen';
import { TeacherDashboardScreen } from './screens/TeacherDashboardScreen';
import { isTerminalQuestStatus } from './quests/questEngine';
import { sortRealmsCanon } from './realm/realmRegistry';
import { getGuildById } from './data/guildData';
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
    campfirePrompt,
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
    tileMapUrl,
    mapVariant,
    setMapVariant,
    stableMapLoading,
    stableMapError,
    firstKcBeaten,
    act3,
    enterRealmFromWorldMap,
    primaryWorldTriggerRealmId,
    clearFogKey,
    researchRealm,
    recordRealmResearch,
    updateRealmReflection,
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
    satchelOpen,
    restedReadinessOpen,
    handleUseConsumable,
    moduleHostOpen,
    activeModuleId,
    scrollRevealOpen,
    dismissScrollReveal,
    oracleCinematicOpen,
    dismissOracleCinematic,
    oracleProphecyOpen,
    dismissOracleProphecy,
    getModuleDraft,
    patchModuleDraft,
    clearModuleDraft,
    applyModuleResult,
    bootstrapPhase,
    bootstrapError,
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
      target instanceof Element &&
      !target.closest('[data-lh-ui-sfx="off"]') &&
      Boolean(target.closest('button, [role="button"], a[href]'));

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
    // Oracle cinematic + prophecy reveal: full silence — the ceremony carries its own weight
    if (screen === 'explore' && (oracleCinematicOpen || oracleProphecyOpen)) {
      dir.setLane(null);
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
  }, [teacherDashboardOpen, screen, activeEncounter, oracleCinematicOpen, oracleProphecyOpen]);

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
        const nextMuted = !a11y.musicMuted;
        a11y.setMusicMuted(nextMuted);
        // Synchronously update data-lh-music so the audio director sees the correct
        // state right now, while we are still inside the keydown gesture call stack.
        // Without this, the React state update is deferred and refreshAudibility below
        // reads the OLD value — meaning unmuting via M does not start music immediately.
        document.documentElement.dataset.lhMusic = nextMuted ? 'muted' : 'on';
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

  const surveyRiasecScores = useMemo(() => {
    const draft = exploration.module_drafts?.mod_master_scribe_survey;
    if (draft) {
      const r = Number(draft.riasec_r);
      const i = Number(draft.riasec_i);
      const a = Number(draft.riasec_a);
      const s = Number(draft.riasec_s);
      const e = Number(draft.riasec_e);
      const c = Number(draft.riasec_c);
      if (![r, i, a, s, e, c].every((v) => isNaN(v) || v === 0)) return { r, i, a, s, e, c };
    }
    // Old saves: reveal was performed but riasec_ fields were not persisted.
    // Show equal-weight fallback so the scroll displays stats instead of "unrevealed."
    if (exploration.scroll_reveal_performed) return { r: 5, i: 5, a: 5, s: 5, e: 5, c: 5 };
    return null;
  }, [exploration.module_drafts?.mod_master_scribe_survey, exploration.scroll_reveal_performed]);

  // Resolve the oracle prophecy from the player's foretold signpost realm IDs.
  // Used to pass the correct prophecyId / title to OracleProphecyReveal.
  const oracleProphecyDef = useMemo(
    () => resolveOracleProphecyFromRealmIds(exploration.foretold_signpost_realm_ids ?? []),
    [exploration.foretold_signpost_realm_ids],
  );

  const vaultRitualComplete = useMemo(
    () => quests.some((q) => q.quest_id === 'mq-203' && isTerminalQuestStatus(q.status)),
    [quests],
  );

  const manifestRealmPickList = useMemo(
    () => sortRealmsCanon(allRealms).map((r) => ({ realm_id: r.realm_id, label: r.display_name })),
    [allRealms],
  );

  const truePathGuildName = useMemo(() => {
    const rid = exploration.guild_endgame_v1?.true_path_realm_id;
    if (!rid) return undefined;
    return getGuildById(rid)?.name ?? allRealms.find((r) => r.realm_id === rid)?.display_name;
  }, [exploration.guild_endgame_v1?.true_path_realm_id, allRealms]);

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
          mapVariant={mapVariant}
          onMapVariantChange={setMapVariant}
          stableMapLoading={stableMapLoading}
          stableMapError={stableMapError}
        />
      ) : null}

      {!teacherDashboardOpen && screen === 'gameTitle' ? (
        <GameTitleScreen
          onStart={navigate.gameTitleStart}
          onResume={navigate.gameTitleResume}
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
          tileMapUrl={tileMapUrl}
          kcBeaten={firstKcBeaten}
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
          overlayBlocksInput={moduleHostOpen || scrollRevealOpen || oracleCinematicOpen || oracleProphecyOpen}
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

      {!teacherDashboardOpen && screen === 'campfireSave' && player ? (
        <CampfireSaveScreen
          player={player}
          prompt={campfirePrompt}
          onSubmit={(response) => handleEndSessionRitual(response)}
          onComplete={navigate.quitToTitle}
        />
      ) : null}

      {!teacherDashboardOpen ? <ScrollOfDestinyDisplay
        open={pauseOpen && screen === 'explore'}
        onClose={navigate.closePause}
        player={player}
        quests={quests}
        allRealms={allRealms}
        exploration={exploration}
        realmProgress={realmProgress}
        foretoldSignpostRealmIds={exploration.scroll_reveal_performed ? (exploration.foretold_signpost_realm_ids ?? []) : []}
        oracleDraft={exploration.module_drafts?.mod_oracle_of_fate}
        riasecScores={surveyRiasecScores}
        onSave={handleManualSave}
        onEndSession={navigate.openCampfireSave}
        onOpenQuestLog={navigate.openQuestLog}
        onOpenRealmAtlas={navigate.openRealmAtlas}
        onOpenInventory={navigate.openSatchel}
        onReviewProphecy={() => {
          const url = exploration.module_drafts?.mod_oracle_of_fate?.prophecy_research_url;
          if (url) window.open(url, '_blank');
        }}
        onOpenQuestOfFateWorksheet={() => navigate.openModule('mod_quest_of_fate_worksheet')}
      /> : null}

      {!teacherDashboardOpen ? (
        <SystemToastOverlay message={saveFeedback} onConsumed={navigate.dismissSaveFeedback} />
      ) : null}

      {!teacherDashboardOpen && inventoryOpen && player ? (
        <InventoryOverlay open={inventoryOpen} onClose={navigate.closeInventory} player={player} />
      ) : null}

      {!teacherDashboardOpen && satchelOpen && player ? (
        <SatchelOverlay
          open={satchelOpen}
          player={player}
          onClose={navigate.closeSatchel}
          onUseConsumable={handleUseConsumable}
        />
      ) : null}

      {!teacherDashboardOpen && restedReadinessOpen && player && player.last_campfire_score != null ? (
        <RestedReadinessModal
          tier={computeRestedReadinessTier(player.last_campfire_score)}
          lastWakeIndex={player.rested_readiness_wake_index ?? 0}
          onDismiss={navigate.dismissRestedReadiness}
        />
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
          onRecordResearch={recordRealmResearch}
          explorationReflections={exploration.realm_reflections}
          onUpdateReflection={updateRealmReflection}
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
        truePathGuildName={truePathGuildName}
        draft={activeModuleId ? getModuleDraft(activeModuleId) : {}}
        onDraftChange={(patch) => {
          if (!activeModuleId) return;
          patchModuleDraft(activeModuleId, patch);
        }}
        onSubmitResult={(payload) => {
          applyModuleResult(payload);
          // mod_master_scribe_survey draft holds riasec_r/i/a/s/e/c which
          // ScrollOfDestinyDisplay reads — do not clear it on submit.
          if (payload.module_id !== 'mod_master_scribe_survey') {
            clearModuleDraft(payload.module_id);
          }
          navigate.closeModule();
        }}
      /> : null}
      {!teacherDashboardOpen && scrollRevealOpen ? (
        <ScrollRevealSequence
          foretoldSignpostRealmIds={exploration.foretold_signpost_realm_ids ?? []}
          // Use saved RIASEC scores; fall back to equal weights so the ceremony
          // always shows even if the module draft was not persisted to the session.
          riasecScores={surveyRiasecScores ?? { r: 5, i: 5, a: 5, s: 5, e: 5, c: 5 }}
          allRealms={allRealms}
          onDismiss={dismissScrollReveal}
          // Pass the actual in-game scroll asset so it fades in behind the stats and
          // signposts at stage 9 — the player sees their manifest materialise on the
          // real Scroll of Destiny, not a colour gradient stand-in.
          scrollBgImage={SCROLL_ASSETS.hub}
        />
      ) : null}
      {/* Part 5: Oracle cinematic plays before the book-shelf prophecy reveal */}
      {!teacherDashboardOpen && oracleCinematicOpen ? (
        <OracleCinematicPlayer
          allowSkip={Boolean(exploration.oracle_prophecy_id)}
          onComplete={dismissOracleCinematic}
        />
      ) : null}

      {/* Part 6: Oracle prophecy book-shelf reveal (after cinematic) */}
      {!teacherDashboardOpen && oracleProphecyOpen ? (
        <OracleProphecyReveal
          prophecyId={oracleProphecyDef.prophecy_id}
          prophecyTitle={oracleProphecyDef.title}
          foretoldSignpostRealmIds={exploration.foretold_signpost_realm_ids ?? []}
          prophecyUrl={oracleProphecyDef.oracle_url}
          onComplete={dismissOracleProphecy}
        />
      ) : null}
      </main>
      <BuildDebugStamp tileMapUrl={tileMapUrl} mapVariant={mapVariant} />
    </div>
  );
}
