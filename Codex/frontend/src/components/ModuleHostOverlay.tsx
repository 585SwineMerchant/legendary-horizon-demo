import type { ModuleResultPayload, PlayerSave, QuestDefinition } from '../types';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { GT100GuardianBossModule } from '../modules/gt100/GT100GuardianBossModule';
import { EnrollmentRuneModule } from '../modules/gt101/EnrollmentRuneModule';
import { TrialOfTonguesModule } from '../modules/gt102/TrialOfTonguesModule';
import { ArtificersEthicsModule } from '../modules/gt103/ArtificersEthicsModule';
import { QuestOfChoiceModule } from '../modules/gt104/QuestOfChoiceModule';
import { ManifestSodModule } from '../modules/manifest/ManifestSodModule';
import { OracleOfFateModule } from '../modules/act2/OracleOfFateModule';
import { VaultOfRunesModule } from '../modules/act2/VaultOfRunesModule';
import { QuestOfFateWorksheetModule } from '../modules/act2/QuestOfFateWorksheetModule';
import { CareerComparisonWorksheetModule } from '../modules/act2/CareerComparisonWorksheetModule';
import { MasterScribeSurveyModule } from '../modules/act1/MasterScribeSurveyModule';
import { ManifestFinalizationModule } from '../modules/act4/ManifestFinalizationModule';
import { GreatTranscriptionModule } from '../modules/act4/GreatTranscriptionModule';
// Side quest
import { SQ202CareerInterviewModule } from '../modules/sq202/SQ202CareerInterviewModule';
// Act 5
import { FA101ChronicleModule } from '../modules/act5/FA101ChronicleModule';
import { FA104GrandCouncilModule } from '../modules/act5/FA104GrandCouncilModule';
// Act 6 / Epilogue
import { EP101EpilogueModule } from '../modules/act6/EP101EpilogueModule';
import { EP102CourseSelectionModule } from '../modules/act6/EP102CourseSelectionModule';

type ManifestRealmPick = { realm_id: string; label: string };

type Props = {
  open: boolean;
  moduleId: string | null;
  onClose: () => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  playerId: string;
  realmId: string;
  /** When set, GT-102 applies a punctuality penalty toward passage (return deadline passed). */
  gt102InterviewArrivalMissedDeadline?: boolean;
  /** Canon realm rows for Manifest Scroll — Foretold Signposts selects. */
  manifestRealmPickList?: readonly ManifestRealmPick[];
  /** Display name of the player's True Path guild (for GT-104, MQ-404, FA-101, EP-101). */
  truePathGuildName?: string;
  /** Career cluster string (for EP-102 aligned course highlighting). */
  truePathCareerCluster?: string;
  /** Full player save — used by EP-101 journey summary. */
  player?: PlayerSave;
  /** All quests — used by EP-101 for completion counts. */
  quests?: QuestDefinition[];
};

function moduleTitle(moduleId: string): string {
  switch (moduleId) {
    case 'mod_gt100_guardian_boss':       return 'Face the Guardian (GT-100)';
    case 'mod_gt101_enrollment_rune':     return 'Enrollment Rune (GT-101)';
    case 'mod_gt102_trial_of_tongues':    return 'Trial of Tongues (GT-102)';
    case 'mod_oracle_of_fate':            return 'Oracle of Fate';
    case 'mod_vault_of_runes':            return 'Vault of Runes';
    case 'mod_quest_of_fate_worksheet':   return 'Quest of Fate Worksheet';
    case 'mod_fog_of_unknown':            return 'Career Comparison Worksheet';
    case 'mod_manifest_sod':              return 'Manifest Scroll';
    case 'mod_master_scribe_survey':      return "Traveler's Survey";
    case 'mod_gt103_artificers_ethics':   return "Artificer's Ethics Trial (GT-103)";
    case 'mod_gt104_quest_of_choice':     return 'Quest of Choice (GT-104)';
    case 'mod_manifest_finalization':     return 'Finalize the Traveler Manifest';
    case 'mod_great_transcription':       return 'Great Transcription';
    case 'mod_sq202_career_interview':    return 'Echoes of Experience — Career Interview';
    case 'mod_fa101_chronicle':           return 'Chronicle of the Horizon';
    case 'mod_fa104_grand_council':       return 'Grand Council — Career Fair';
    case 'mod_ep101_epilogue':            return 'Enter the Epilogue';
    case 'mod_ep102_course_selection':    return 'Course Selection Ritual';
    default:                              return 'Module';
  }
}

export function ModuleHostOverlay({
  open,
  moduleId,
  onClose,
  onSubmitResult,
  draft,
  onDraftChange,
  playerId,
  realmId,
  gt102InterviewArrivalMissedDeadline = false,
  manifestRealmPickList = [],
  truePathGuildName,
  truePathCareerCluster,
  player,
  quests = [],
}: Props) {
  useEscapeToClose(open, onClose);
  if (!open || !moduleId) return null;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Module">
      <div className="lh-panel lh-panel--world-map">
        <header className="lh-world-map__header">
          <div>
            <p className="lh-eyebrow">Guild trial module</p>
            <h2 className="lh-heading-md">{moduleTitle(moduleId)}</h2>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {/* ── Acts 1-4 ──────────────────────────────────────────────── */}
        {moduleId === 'mod_gt100_guardian_boss' ? (
          <GT100GuardianBossModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            playerName={player?.display_name}
          />
        ) : moduleId === 'mod_gt101_enrollment_rune' ? (
          <EnrollmentRuneModule draft={draft} onDraftChange={onDraftChange} onSubmitResult={onSubmitResult} />
        ) : moduleId === 'mod_gt102_trial_of_tongues' ? (
          <TrialOfTonguesModule
            playerId={playerId}
            realmId={realmId}
            interviewArrivalMissedDeadline={gt102InterviewArrivalMissedDeadline}
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
          />
        ) : moduleId === 'mod_manifest_sod' ? (
          <ManifestSodModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            canonRealmPickList={manifestRealmPickList}
          />
        ) : moduleId === 'mod_oracle_of_fate' ? (
          <OracleOfFateModule draft={draft} onDraftChange={onDraftChange} onSubmitResult={onSubmitResult} />
        ) : moduleId === 'mod_vault_of_runes' ? (
          <VaultOfRunesModule draft={draft} onDraftChange={onDraftChange} onSubmitResult={onSubmitResult} />
        ) : moduleId === 'mod_quest_of_fate_worksheet' ? (
          <QuestOfFateWorksheetModule draft={draft} onDraftChange={onDraftChange} onSubmitResult={onSubmitResult} />
        ) : moduleId === 'mod_fog_of_unknown' ? (
          <CareerComparisonWorksheetModule draft={draft} onDraftChange={onDraftChange} onSubmitResult={onSubmitResult} />
        ) : moduleId === 'mod_master_scribe_survey' ? (
          <MasterScribeSurveyModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
          />
        ) : moduleId === 'mod_gt103_artificers_ethics' ? (
          <ArtificersEthicsModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
          />
        ) : moduleId === 'mod_gt104_quest_of_choice' ? (
          <QuestOfChoiceModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            truePathGuildName={truePathGuildName}
          />
        ) : moduleId === 'mod_manifest_finalization' ? (
          <ManifestFinalizationModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            truePathGuildName={truePathGuildName}
          />
        ) : moduleId === 'mod_great_transcription' ? (
          <GreatTranscriptionModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
          />

        /* ── Side Quest ───────────────────────────────────────────── */
        ) : moduleId === 'mod_sq202_career_interview' ? (
          <SQ202CareerInterviewModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
          />

        /* ── Act 5 ────────────────────────────────────────────────── */
        ) : moduleId === 'mod_fa101_chronicle' ? (
          <FA101ChronicleModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            truePathGuildName={truePathGuildName}
          />
        ) : moduleId === 'mod_fa104_grand_council' ? (
          <FA104GrandCouncilModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
          />

        /* ── Act 6 / Epilogue ─────────────────────────────────────── */
        ) : moduleId === 'mod_ep101_epilogue' ? (
          <EP101EpilogueModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            player={player}
            quests={quests}
            truePathGuildName={truePathGuildName}
          />
        ) : moduleId === 'mod_ep102_course_selection' ? (
          <EP102CourseSelectionModule
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmitResult={onSubmitResult}
            realmId={realmId}
            truePathCareerCluster={truePathCareerCluster}
          />
        ) : (
          <p className="lh-world-map__meta">Module not yet wired: {moduleId}</p>
        )}
      </div>
    </div>
  );
}
