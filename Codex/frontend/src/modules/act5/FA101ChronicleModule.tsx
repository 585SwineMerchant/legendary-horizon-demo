import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  /** Player's True Path guild name — used in the lore framing */
  truePathGuildName?: string;
};

/**
 * FA-101 "Begin the Chronicle of the Horizon"
 *
 * Google Slides presentation assignment. The student creates a presentation
 * about their True Path career based on their Act 1-4 research.
 *
 * Flow:
 *   1. Assignment overview + lore framing
 *   2. Presentation rubric / required slides
 *   3. Google Slides template link (placeholder until real template is shared)
 *   4. "I have completed my Chronicle" confirm button
 *
 * On submit: fires onSubmitResult with status 'submitted' → markQuestTurnedIn()
 * so the teacher dashboard sees it as ready for review.
 *
 * PLACEHOLDER: Replace SLIDES_TEMPLATE_URL with the real Google Slides template
 * link once it is created.
 */

const SLIDES_TEMPLATE_URL =
  'https://docs.google.com/presentation/d/PLACEHOLDER_TEMPLATE_ID/copy';

const REQUIRED_SLIDES = [
  {
    slide: '1',
    title: 'Title Slide',
    content: 'Your name, your True Path guild, and the title "Chronicle of the Horizon"',
  },
  {
    slide: '2',
    title: 'My True Path',
    content:
      'Name your chosen career cluster and the guild it belongs to. Why did you choose this path?',
  },
  {
    slide: '3',
    title: 'Career Research',
    content:
      'What career within your guild interests you most? Include education requirements, key skills, and salary range from your Quest of Choice research.',
  },
  {
    slide: '4',
    title: 'My Career Plan',
    content:
      'Your finalized Manifest: career goal, education plan, skills to develop, and action steps.',
  },
  {
    slide: '5',
    title: 'Echoes of Experience',
    content:
      'Share one thing you learned from the adult you interviewed. How does their career story connect to your own path?',
  },
  {
    slide: '6',
    title: 'Reflection',
    content:
      'What surprised you most during this journey? What will you do differently because of what you discovered?',
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

export function FA101ChronicleModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
  truePathGuildName = 'your chosen guild',
}: Props) {
  const [step, setStep] = useState<'overview' | 'rubric' | 'confirm'>(
    draft.fa101_step as 'overview' | 'rubric' | 'confirm' ?? 'overview',
  );
  const [confirmed, setConfirmed] = useState(draft.fa101_submitted_iso != null);

  function advanceTo(s: 'overview' | 'rubric' | 'confirm') {
    setStep(s);
    onDraftChange({ fa101_step: s });
  }

  if (confirmed) {
    return (
      <div className="lh-world-map__layout">
        <section className="lh-world-map__realms" aria-label="Chronicle submitted">
          <div
            className="lh-panel"
            style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <div style={{ fontSize: 48 }} aria-hidden>🏛️</div>
            <h3 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Chronicle of the Horizon — Submitted
            </h3>
            <p className="lh-world-map__hint" style={{ maxWidth: 440 }}>
              Your Chronicle has been received. When the Grand Council convenes,
              your voice will be among those heard. Your teacher will review and
              confirm your submission.
            </p>
            <p className="lh-world-map__meta" style={{ fontStyle: 'italic', color: '#f59e0b' }}>
              "The realm must hear your story."
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Chronicle of the Horizon">
        <h3 className="lh-heading-sm">Chronicle of the Horizon</h3>
        <p className="lh-world-map__hint">
          Traveler — you have walked farther than most would dare. Now the realm
          must hear your story. You will craft a Chronicle of the Horizon: a
          presentation of your True Path in{' '}
          <strong>{truePathGuildName}</strong>, your research, and the wisdom you
          have gathered across Acts I–IV.
        </p>

        {/* Step tabs */}
        <div className="lh-panel" style={{ padding: 10, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { id: 'overview', label: 'Assignment' },
                { id: 'rubric', label: 'Required Slides' },
                { id: 'confirm', label: 'Submit' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`lh-button lh-button--secondary${step === t.id ? ' lh-world-realm-tile--selected' : ''}`}
                onClick={() => advanceTo(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {step === 'overview' && (
          <div className="lh-panel" style={{ padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>The Assignment</h4>
            <p className="lh-world-map__hint">
              Create a <strong>6-slide Google Slides presentation</strong> that tells
              the story of your career exploration this year. You will present this
              Chronicle at the Grand Council — your class career fair.
            </p>
            <p className="lh-world-map__hint">
              Use the Google Slides template below as your starting point. It
              already has the layout, fonts, and Legendary Horizon theme built in.
              Copy it to your Google Drive, then fill in your research.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <a
                href={SLIDES_TEMPLATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="lh-button lh-button--primary"
                style={{ display: 'inline-block' }}
              >
                Open Google Slides Template ↗
              </a>
              <button
                type="button"
                className="lh-button lh-button--ghost"
                onClick={() => advanceTo('rubric')}
              >
                View required slides →
              </button>
            </div>
          </div>
        )}

        {/* Rubric */}
        {step === 'rubric' && (
          <div className="lh-panel" style={{ padding: 16, marginTop: 10 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>Required Slides</h4>
            <p className="lh-world-map__meta" style={{ marginBottom: 12 }}>
              Your Chronicle must include all 6 slides below. Use your own words
              and your own research — no slide should be blank.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REQUIRED_SLIDES.map((slide) => (
                <div
                  key={slide.slide}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      minWidth: 28,
                      height: 28,
                      background: 'rgba(245,158,11,0.15)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                      color: '#f59e0b',
                      flexShrink: 0,
                    }}
                  >
                    {slide.slide}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '0.9em' }}>
                      {slide.title}
                    </p>
                    <p className="lh-world-map__meta" style={{ margin: 0, fontSize: '0.84em' }}>
                      {slide.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="lh-button lh-button--ghost"
                onClick={() => advanceTo('confirm')}
              >
                I'm ready to submit →
              </button>
            </div>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <div className="lh-panel" style={{ padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>Submit Your Chronicle</h4>
            <p className="lh-world-map__hint">
              Before you confirm, make sure:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                'Your Google Slides presentation has all 6 required slides completed',
                'You have shared the presentation with your teacher',
                'You have practiced your talking points for the Grand Council',
              ].map((item, i) => (
                <li key={i} className="lh-world-map__meta" style={{ fontSize: '0.88em' }}>
                  {item}
                </li>
              ))}
            </ul>
            <div className="lh-world-map__actions" style={{ marginTop: 4 }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={() => {
                  const completedAt = nowIso();
                  onDraftChange({ fa101_submitted_iso: completedAt });
                  setConfirmed(true);
                  onSubmitResult({
                    module_id: 'mod_fa101_chronicle',
                    quest_id: 'fa-101',
                    realm_id: realmId,
                    status: 'submitted',
                    artifacts: { submitted_at: completedAt },
                    completed_at_iso: completedAt,
                  });
                }}
              >
                I have completed my Chronicle ✓
              </button>
              <button
                type="button"
                className="lh-button lh-button--ghost"
                onClick={() => advanceTo('rubric')}
              >
                ← Back to slide list
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
