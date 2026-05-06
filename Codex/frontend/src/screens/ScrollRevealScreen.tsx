import { coreyLeadershipProfile } from '../demo/coreyLeadershipProfile';

type Props = {
  onBack: () => void;
  onContinue: () => void;
};

const STAT_LABELS: Record<keyof typeof coreyLeadershipProfile.baseStatProfile, string> = {
  insight: 'Insight',
  resolve: 'Resolve',
  creativity: 'Creativity',
  collaboration: 'Collaboration',
};

export function ScrollRevealScreen({ onBack, onContinue }: Props) {
  const profile = coreyLeadershipProfile;
  const stats = Object.entries(profile.baseStatProfile) as Array<
    [keyof typeof profile.baseStatProfile, number]
  >;

  return (
    <section className="lh-screen lh-screen--scroll-reveal">
      <div className="lh-scroll-reveal">
        <header className="lh-scroll-reveal__header">
          <p className="lh-eyebrow">Scroll of Destiny</p>
          <h2 className="lh-scroll-reveal__title">The first signposts are revealed</h2>
          <p className="lh-scroll-reveal__lede">
            Maia has provided the signal. The teacher-reviewed bridge has translated it. The game now gives the student a
            clear opening path for exploration and comparison.
          </p>
        </header>

        <div className="lh-scroll-reveal__seal" aria-hidden>
          LH
        </div>

        <section className="lh-scroll-reveal__panel" aria-label="Base stats generated from Maia bridge">
          <h3 className="lh-heading-sm lh-scroll-reveal__section-title">Base stats</h3>
          <div className="lh-scroll-reveal__stats">
            {stats.map(([key, value]) => (
              <div key={key} className="lh-scroll-reveal__stat">
                <span className="lh-scroll-reveal__stat-label">{STAT_LABELS[key]}</span>
                <span className="lh-scroll-reveal__stat-value">{value}</span>
                <span className="lh-scroll-reveal__stat-bar" aria-hidden>
                  <span style={{ width: `${Math.min(100, value * 10)}%` }} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="lh-scroll-reveal__panel" aria-label="Foretold signposts">
          <h3 className="lh-heading-sm lh-scroll-reveal__section-title">Foretold signposts</h3>
          <div className="lh-scroll-reveal__signposts">
            {profile.foretoldSignposts.map((signpost, index) => (
              <article key={signpost} className="lh-scroll-reveal__signpost">
                <span className="lh-scroll-reveal__signpost-index">0{index + 1}</span>
                <h4>{signpost}</h4>
                <p>{profile.suggestedClusters[index] ?? 'Career cluster exploration'}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="lh-scroll-reveal__mentor" role="note">
          <strong>Mentor Kael:</strong> These are not final answers. They are first lights on the horizon: places to
          investigate, compare, question, and return from with evidence.
        </aside>

        <div className="lh-stack lh-stack--horizontal lh-scroll-reveal__actions">
          <button type="button" className="lh-button lh-button--ghost" onClick={onBack}>
            Back to Maia bridge
          </button>
          <button type="button" className="lh-button lh-button--primary" onClick={onContinue}>
            Continue to guided recap
          </button>
        </div>
      </div>
    </section>
  );
}
