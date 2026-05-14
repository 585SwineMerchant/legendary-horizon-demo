import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusCallout } from '../components/StatusCallout';
import { publicAssetUrl } from '../lib/publicAssetUrl';

type Props = {
  onContinue: () => void;
  onOpenTeacherDashboard?: () => void;
  bootstrapPhase?: 'idle' | 'loading' | 'error';
  bootstrapError?: string | null;
  /** Milestone 14 - resolved from `LhMediaAssets` / fixture catalog (falls back to CSS default if blank). */
  backdropImageUrl?: string;
};

export function TitleScreen({
  onContinue,
  onOpenTeacherDashboard,
  bootstrapPhase = 'idle',
  bootstrapError = null,
  backdropImageUrl,
}: Props) {
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
            : { backgroundImage: `url(${JSON.stringify(publicAssetUrl('assets/bg-title-dusk.svg'))})` }
        }
      />
      <div className="lh-stack lh-screen__panel lh-screen__panel--title">
        <p className="lh-eyebrow">The Horizon calls</p>
        <h1 className="lh-heading-xl">Legendary Horizon</h1>

        {failed ? (
          <StatusCallout tone="error" title="Could not finish loading your session">
            <p>{bootstrapError ?? 'Unknown error while loading.'}</p>
            <p className="lh-status-callout__hint">Check your network and Web App URL, then try again.</p>
          </StatusCallout>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading your roster and save..." ariaLabel="Loading game session" />
        ) : null}

        <div className="lh-title-actions lh-stack lh-stack--horizontal">
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={onContinue}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Begin Demo'}
          </button>
          {showTeacher ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenTeacherDashboard} disabled={loading}>
              Teacher dashboard
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
