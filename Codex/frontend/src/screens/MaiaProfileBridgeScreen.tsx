import { StatusCallout } from '../components/StatusCallout';
import { coreyLeadershipProfile } from '../demo/coreyLeadershipProfile';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';

type Props = {
  onBack: () => void;
  onContinue: () => void;
  classroomTools?: ClassroomToolHandlers | null;
};

export function MaiaProfileBridgeScreen({ onBack, onContinue, classroomTools }: Props) {
  const profile = coreyLeadershipProfile;
  const stats = Object.entries(profile.baseStatProfile);

  return (
    <section className="lh-screen lh-screen--instructions">
      <div className="lh-panel lh-panel--sheet lh-panel--instructions">
        <header className="lh-instructions__header">
          <p className="lh-eyebrow">Mirror of Maia bridge</p>
          <h2 className="lh-heading-lg">Teacher-reviewed profile loaded</h2>
          <p className="lh-instructions__lede">
            This is the demo version of the long-term Maia handoff: a teacher/backend layer turns student assessment work
            into clear game inputs for the opening path.
          </p>
        </header>

        <StatusCallout tone="success" title={profile.studentLabel}>
          <p>
            Maia assessment complete: <strong>{profile.maiaAssessmentComplete ? 'yes' : 'no'}</strong>. Teacher review:
            <strong> {profile.maiaReviewedByTeacher ? 'complete' : 'pending'}</strong>.
          </p>
          <p className="lh-status-callout__hint">{profile.syncNotes}</p>
        </StatusCallout>

        <ol className="lh-instructions__steps">
          <li className="lh-instructions__step">
            <span className="lh-instructions__step-index" aria-hidden>
              1
            </span>
            <div>
              <h3 className="lh-heading-sm lh-instructions__step-title">Top Maia-style interests</h3>
              <p className="lh-instructions__step-body">{profile.topInterests.join(' / ')}</p>
            </div>
          </li>
          <li className="lh-instructions__step">
            <span className="lh-instructions__step-index" aria-hidden>
              2
            </span>
            <div>
              <h3 className="lh-heading-sm lh-instructions__step-title">Suggested career clusters</h3>
              <p className="lh-instructions__step-body">{profile.suggestedClusters.join(' / ')}</p>
            </div>
          </li>
          <li className="lh-instructions__step">
            <span className="lh-instructions__step-index" aria-hidden>
              3
            </span>
            <div>
              <h3 className="lh-heading-sm lh-instructions__step-title">Base stats revealed</h3>
              <p className="lh-instructions__step-body">
                {stats.map(([key, value]) => `${key}: ${value}`).join(' / ')}
              </p>
            </div>
          </li>
          <li className="lh-instructions__step">
            <span className="lh-instructions__step-index" aria-hidden>
              4
            </span>
            <div>
              <h3 className="lh-heading-sm lh-instructions__step-title">Foretold signposts</h3>
              <p className="lh-instructions__step-body">{profile.foretoldSignposts.join(' / ')}</p>
            </div>
          </li>
        </ol>

        {classroomTools ? (
          <div className="lh-stack lh-stack--horizontal lh-instructions__footer">
            <button type="button" className="lh-button lh-button--secondary" onClick={classroomTools.onOpenMaia}>
              Open Maia Learning
            </button>
            <p className="lh-status-callout__hint">{profile.lastSyncedByTeacher}</p>
          </div>
        ) : null}

        <div className="lh-stack lh-stack--horizontal lh-panel__footer lh-instructions__footer">
          <button type="button" className="lh-button lh-button--ghost" onClick={onBack}>
            Back
          </button>
          <button type="button" className="lh-button lh-button--primary" onClick={onContinue}>
            Reveal Scroll of Destiny
          </button>
        </div>
      </div>
    </section>
  );
}
