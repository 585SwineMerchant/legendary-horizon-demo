/**
 * CampfireGradingPanel — teacher-facing grading queue for campfire reflections.
 *
 * Shows a queue of unreviewed campfire log entries from LhSessionHistory.
 * Teacher assigns a score (0–5) and optional comment (max 140 chars),
 * then submits or skips. Progress counter shown throughout.
 *
 * On submit: calls `onGrade`, which posts to `grade_campfire` action in LhWebApp.
 * After grading, the player's `last_campfire_score` is updated, enabling
 * Rested Readiness buff computation at next session start.
 */

import { useState } from 'react';
import type { CampfireReflectionRow } from '../domain/lh-contract';

type Props = {
  /** Ungraded reflection rows loaded from the backend. */
  reflections: CampfireReflectionRow[];
  /** True while loading from backend. */
  loading: boolean;
  /** Error message if loading or grading failed. */
  error?: string | null;
  /** Called when teacher submits a grade. */
  onGrade: (
    sessionId: string,
    playerId: string,
    score: number,
    comment: string,
  ) => Promise<{ ok: boolean; message: string }>;
  /** Called when teacher skips the current entry (moves to next without grading). */
  onSkip?: () => void;
  /** Reload the queue. */
  onRefresh: () => void;
};

const SCORE_LABELS: Record<number, string> = {
  0: 'No response',
  1: 'Minimal effort',
  2: 'Developing',
  3: 'Proficient',
  4: 'Strong',
  5: 'Exemplary',
};

export function CampfireGradingPanel({
  reflections,
  loading,
  error,
  onGrade,
  onSkip,
  onRefresh,
}: Props) {
  const [queueIndex, setQueueIndex] = useState(0);
  const [score, setScore] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gradedCount, setGradedCount] = useState(0);

  const total = reflections.length;
  const current = reflections[queueIndex] ?? null;
  const remaining = total - queueIndex;

  const handleSubmit = async () => {
    if (!current) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onGrade(current.session_id, current.player_id, score, comment.slice(0, 140));
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setGradedCount((n) => n + 1);
    setScore(3);
    setComment('');
    setQueueIndex((i) => i + 1);
  };

  const handleSkip = () => {
    onSkip?.();
    setQueueIndex((i) => i + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 className="lh-heading-md" style={{ margin: 0 }}>Campfire Reflection Grading</h3>
          <p className="lh-subtitle" style={{ margin: '2px 0 0' }}>
            Score each student's session reflection (0–5) to unlock their Rested Readiness buff.
          </p>
        </div>
        <button type="button" className="lh-button lh-button--secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh Queue'}
        </button>
      </div>

      {/* Escalation banner */}
      {remaining > 0 && !loading ? (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }} aria-hidden>📜</span>
          <p style={{ margin: 0, fontSize: 13, color: '#fbbf24' }}>
            <strong>{remaining}</strong> student{remaining !== 1 ? 's' : ''} {remaining === 1 ? 'has' : 'have'} unreviewed reflections.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="lh-toast lh-toast--error" role="alert">
          <pre className="lh-toast__preformatted">{error}</pre>
        </div>
      ) : null}

      {/* Progress */}
      {total > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {gradedCount} graded this session · {remaining} remaining in queue
        </p>
      ) : null}

      {/* Empty state */}
      {!loading && total === 0 ? (
        <div
          style={{
            padding: '20px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            All reflections have been reviewed. Well done!
          </p>
        </div>
      ) : null}

      {/* Current reflection card */}
      {current ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: '18px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,160,23,0.15)',
            borderRadius: 4,
          }}
        >
          {/* Student meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#f0dfa0' }}>
                {current.player_display_name || current.player_id}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Session: {current.ended_iso ? new Date(current.ended_iso).toLocaleDateString() : new Date(current.began_iso).toLocaleDateString()}
                &nbsp;·&nbsp;ID: <code style={{ fontSize: 10 }}>{current.session_id.slice(0, 8)}…</code>
              </p>
            </div>
          </div>

          {/* Reflection text */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(212,160,23,0.04)',
              border: '1px solid rgba(212,160,23,0.1)',
              borderRadius: 3,
              minHeight: 80,
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.6)' }}>
              Student Response
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#e8dcc8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {current.campfire_log_entry || <em style={{ color: 'rgba(255,255,255,0.3)' }}>No response recorded.</em>}
            </p>
          </div>

          {/* Score selector */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Score (0–5)
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  title={SCORE_LABELS[s]}
                  style={{
                    width: 42,
                    height: 42,
                    fontSize: 16,
                    fontWeight: 700,
                    background: score === s ? 'linear-gradient(135deg,#d4a017,#b8912a)' : 'rgba(255,255,255,0.05)',
                    color: score === s ? '#1a0e00' : '#e8dcc8',
                    border: score === s ? '1px solid #8a6a1a' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(212,160,23,0.7)', fontStyle: 'italic' }}>
              {SCORE_LABELS[score]}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="campfire-grade-comment"
              style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}
            >
              Comment (optional · max 140 chars)
            </label>
            <textarea
              id="campfire-grade-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 140))}
              placeholder="Brief feedback for the student…"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                color: '#e8dcc8',
                fontFamily: 'sans-serif',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
              {comment.length}/140
            </p>
          </div>

          {submitError ? (
            <p style={{ margin: 0, color: '#f87171', fontSize: 12 }} role="alert">{submitError}</p>
          ) : null}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="lh-button lh-button--primary"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting…' : `Submit Grade (${score})`}
            </button>
            <button
              type="button"
              className="lh-button lh-button--secondary"
              onClick={handleSkip}
              disabled={submitting}
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      {/* All done state */}
      {total > 0 && queueIndex >= total ? (
        <div
          style={{
            padding: '18px 16px',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: '#86efac' }}>
            ✓ All reflections in this queue have been reviewed. Refresh to check for new ones.
          </p>
        </div>
      ) : null}
    </div>
  );
}
