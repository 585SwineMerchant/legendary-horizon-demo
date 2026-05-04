import type { ModuleResultPayload } from '../types';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { EnrollmentRuneModule } from '../modules/gt101/EnrollmentRuneModule';
import { TrialOfTonguesModule } from '../modules/gt102/TrialOfTonguesModule';
import { ManifestSodModule } from '../modules/manifest/ManifestSodModule';
import { OracleOfFateModule } from '../modules/act2/OracleOfFateModule';
import { VaultOfRunesModule } from '../modules/act2/VaultOfRunesModule';

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
};

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
}: Props) {
  useEscapeToClose(open, onClose);
  if (!open || !moduleId) return null;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Module">
      <div className="lh-panel lh-panel--world-map">
        <header className="lh-world-map__header">
          <div>
            <p className="lh-eyebrow">Guild trial module</p>
            <h2 className="lh-heading-md">
              {moduleId === 'mod_gt101_enrollment_rune'
                ? 'Enrollment Rune (GT-101)'
                : moduleId === 'mod_gt102_trial_of_tongues'
                  ? 'Trial of Tongues (GT-102)'
                  : 'Module'}
            </h2>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {moduleId === 'mod_gt101_enrollment_rune' ? (
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
        ) : (
          <p className="lh-world-map__meta">Module not yet wired: {moduleId}</p>
        )}
      </div>
    </div>
  );
}

