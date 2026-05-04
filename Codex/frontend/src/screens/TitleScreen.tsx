import { useState } from 'react';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusCallout } from '../components/StatusCallout';
import { classroomInfoPanelBody, classroomInfoStubNotice } from '../lib/demoCopy';

type Props = {
  onContinue: () => void;
  onOpenTeacherDashboard?: () => void;
  bootstrapPhase?: 'idle' | 'loading' | 'error';
  bootstrapError?: string | null;
  /** Milestone 14 — resolved from `LhMediaAssets` / fixture catalog (falls back to CSS default if blank). */
  backdropImageUrl?: string;
};

export function TitleScreen({
  onContinue,
  onOpenTeacherDashboard,
  bootstrapPhase = 'idle',
  bootstrapError = null,
  backdropImageUrl,
}: Props) {
  const [classroomOpen, setClassroomOpen] = useState(false);
  const loading = bootstrapPhase === 'loading';
  const failed = bootstrapPhase === 'error';
  const showTeacher = Boolean(onOpenTeacherDashboard) && (import.meta.env.DEV || import.meta.env.VITE_LH_TEACHER_DASHBOARD === 'true');

  return (
    <section className="lh-screen lh-screen--title" aria-busy={loading}>
      <div
        className="lh-screen__backdrop"
        aria-hidden
        style={
          backdropImageUrl
            ? { backgroundImage: `url(${JSON.stringify(backdropImageUrl)})` }
            : { backgroundImage: 'url(/assets/bg-title-dusk.svg)' }
        }
      />
      <div className="lh-stack lh-screen__panel lh-screen__panel--title">
        <p className="lh-eyebrow">Codex prototype — Night One vertical slice</p>
        <h1 className="lh-heading-xl">Legendary Horizon</h1>
        <p className="lh-subtitle">
          An educational RPG journey across career-aligned realms — local fixtures demo.
        </p>

        {failed ? (
          <StatusCallout tone="error" title="Could not finish loading your session">
            <p>{bootstrapError ?? 'Unknown error while loading.'}</p>
            <p className="lh-status-callout__hint">Check your network and Web App URL, then try again.</p>
          </StatusCallout>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading your roster and save…" ariaLabel="Loading game session" />
        ) : null}

        <div className="lh-title-actions lh-stack lh-stack--horizontal">
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={onContinue}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Continue'}
          </button>
          {showTeacher ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenTeacherDashboard} disabled={loading}>
              Teacher dashboard
            </button>
          ) : null}
          <button
            type="button"
            className="lh-button lh-button--secondary"
            onClick={() => setClassroomOpen((o) => !o)}
            aria-expanded={classroomOpen}
          >
            Classroom info
          </button>
        </div>

        {classroomOpen ? (
          <StatusCallout tone="info" title="About this classroom build">
            <p>{classroomInfoPanelBody}</p>
            <p className="lh-status-callout__hint">{classroomInfoStubNotice}</p>
          </StatusCallout>
        ) : null}
      </div>
    </section>
  );
}
