import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
};

const CAREER_INTERVIEW_PDF_URL =
  '/assets/documents/Career_Interview_Assignment.pdf';

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * SQ-202 "Echoes of Experience" — optional side quest module.
 *
 * This is NOT a research tool. The real assignment happens offline:
 * the student interviews a trusted adult about their career.
 * This module:
 *   1. Explains the assignment and provides the PDF link.
 *   2. Captures minimal metadata (adult name, career, date).
 *   3. Offers a single confirm button which marks the quest submitted
 *      and notifies the teacher dashboard via markQuestTurnedIn().
 *
 * The PDF file should be placed at:
 *   Codex/frontend/public/assets/documents/Career_Interview_Assignment.pdf
 */
export function SQ202CareerInterviewModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  function field(key: string): string {
    return draft[`sq202_${key}`] ?? '';
  }

  function set(key: string, value: string) {
    onDraftChange({ [`sq202_${key}`]: value });
  }

  const canSubmit = Boolean(
    field('adult_name').trim() &&
      field('adult_career').trim() &&
      field('interview_date').trim(),
  );

  if (confirmed) {
    return (
      <div className="lh-world-map__layout">
        <section className="lh-world-map__realms" aria-label="Echoes of Experience — submitted">
          <div
            className="lh-panel"
            style={{
              padding: 24,
              marginTop: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }} aria-hidden>
              📜
            </div>
            <h3 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Echoes of Experience — Recorded
            </h3>
            <p className="lh-world-map__hint" style={{ maxWidth: 420 }}>
              The Codex has received your record. The wisdom of{' '}
              <strong>{field('adult_name')}</strong> now lives within your
              chronicle. Your teacher will review and mark your assignment
              complete.
            </p>
            <p
              className="lh-world-map__meta"
              style={{ fontStyle: 'italic', color: '#f59e0b' }}
            >
              "You have spoken with a real-world mentor and gathered wisdom from
              their journey. Their story may help you understand your own path,
              your own preferences, and the kind of future that may fit the
              Traveler you are becoming."
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section
        className="lh-world-map__realms"
        aria-label="Echoes of Experience — Career Interview"
      >
        <h3 className="lh-heading-sm">Echoes of Experience</h3>
        <p className="lh-world-map__hint">
          The Master Scribe has charged you with a quest beyond these walls. Seek
          out a trusted adult in your life — a parent, guardian, relative, coach,
          neighbor, or teacher — and interview them about their career journey.
        </p>

        {/* Assignment document link */}
        <div
          className="lh-panel"
          style={{
            padding: 16,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ fontSize: 32, flexShrink: 0 }} aria-hidden>
            📄
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: '0 0 6px',
                fontWeight: 600,
                fontSize: '0.95em',
              }}
            >
              Career Interview Assignment
            </p>
            <p className="lh-world-map__meta" style={{ margin: '0 0 8px' }}>
              Print or save this document. Ask the adult the 10 interview
              questions, then answer the 3 reflection questions in your own
              words.
            </p>
            <a
              href={CAREER_INTERVIEW_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lh-button lh-button--secondary lh-button--small"
              style={{ display: 'inline-block' }}
            >
              Open Assignment (PDF) ↗
            </a>
          </div>
        </div>

        {/* Interview questions summary */}
        <div className="lh-panel" style={{ padding: 16, marginTop: 12 }}>
          <h4 className="lh-heading-sm" style={{ marginTop: 0, marginBottom: 10 }}>
            What you'll ask them
          </h4>
          <ol
            style={{
              margin: 0,
              paddingLeft: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {[
              'What is your current job or career?',
              'How long have you worked in this field?',
              'What education or training prepared you for this career?',
              'Did you need any certifications or licenses?',
              'What made you choose this career?',
              'What do you enjoy or find rewarding about your work?',
              'What is one challenge in your job?',
              'What skills do you use most?',
              'What work environment helps you feel productive?',
              'What advice would you give to a middle school student?',
            ].map((q, i) => (
              <li
                key={i}
                className="lh-world-map__meta"
                style={{ fontSize: '0.85em' }}
              >
                {q}
              </li>
            ))}
          </ol>
        </div>

        {/* Return confirmation — metadata capture */}
        <div
          className="lh-panel"
          style={{
            padding: 16,
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h4 className="lh-heading-sm" style={{ marginTop: 0, marginBottom: 0 }}>
            When you have completed your interview…
          </h4>
          <p className="lh-world-map__meta">
            Fill in the details below and confirm. Your teacher will be notified
            that your assignment is ready for review.
          </p>

          <div className="lh-field">
            <label className="lh-label" htmlFor="sq202_adult_name">
              Name of the adult you interviewed
            </label>
            <input
              id="sq202_adult_name"
              type="text"
              className="lh-input"
              placeholder="e.g. Ms. Johnson"
              value={field('adult_name')}
              onChange={(e) => set('adult_name', e.target.value)}
            />
          </div>

          <div className="lh-field">
            <label className="lh-label" htmlFor="sq202_adult_career">
              Their career or job title
            </label>
            <input
              id="sq202_adult_career"
              type="text"
              className="lh-input"
              placeholder="e.g. Registered Nurse"
              value={field('adult_career')}
              onChange={(e) => set('adult_career', e.target.value)}
            />
          </div>

          <div className="lh-field">
            <label className="lh-label" htmlFor="sq202_interview_date">
              Date of interview
            </label>
            <input
              id="sq202_interview_date"
              type="date"
              className="lh-input"
              value={field('interview_date')}
              onChange={(e) => set('interview_date', e.target.value)}
            />
          </div>
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              const completedAt = nowIso();
              onDraftChange({ sq202_submitted_iso: completedAt });
              setConfirmed(true);
              onSubmitResult({
                module_id: 'mod_sq202_career_interview',
                quest_id: 'sq-202',
                realm_id: realmId,
                status: 'submitted',
                artifacts: {
                  adult_name: field('adult_name'),
                  adult_career: field('adult_career'),
                  interview_date: field('interview_date'),
                },
                completed_at_iso: completedAt,
              });
            }}
          >
            I have completed my interview ✓
          </button>
        </div>

        {!canSubmit && (
          <p className="lh-world-map__meta" style={{ marginTop: 6, fontSize: '0.82em' }}>
            Fill in all three fields above before confirming.
          </p>
        )}
      </section>
    </div>
  );
}
