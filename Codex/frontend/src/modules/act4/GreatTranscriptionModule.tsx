import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

/**
 * MQ-405 "Great Transcription" — guided flow for copying the finalized
 * Manifest data into Maia Learning (external platform).
 *
 * Steps:
 * 1. Review your finalized Manifest data (read-only summary).
 * 2. Open Maia Learning in a new tab — with inline copy-assist panel
 *    so students can copy each field without navigating back.
 * 3. Confirm you have transferred the data.
 */
export function GreatTranscriptionModule({ draft, onDraftChange, onSubmitResult, realmId }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maiaOpened, setMaiaOpened] = useState(draft.gt_maia_opened === 'true');
  const [copied, setCopied] = useState<string | null>(null);

  // Pull finalized manifest fields to display as review
  const careerGoal = draft.mf_career_goal ?? '';
  const educationPlan = draft.mf_education_plan ?? '';
  const skillsNeeded = draft.mf_skills_needed ?? '';
  const actionSteps = draft.mf_action_steps ?? '';

  async function handleCopy(key: string, value: string) {
    if (!value.trim()) return;
    await copyText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleOpenMaia() {
    setMaiaOpened(true);
    onDraftChange({ gt_maia_opened: 'true' });
    window.open('https://www.maialearning.com', '_blank', 'noopener');
  }

  function handleConfirmTransfer() {
    onDraftChange({ gt_confirmed_iso: nowIso() });
    onSubmitResult({
      module_id: 'mod_great_transcription',
      quest_id: 'mq-405',
      realm_id: realmId,
      status: 'completed',
      artifacts: {
        maia_opened: 'true',
        confirmed_at: nowIso(),
      },
      completed_at_iso: nowIso(),
    });
  }

  /** A read-only copy-assist row used inside Step 2 */
  function CopyRow({
    label,
    maiaLabel,
    fieldKey,
    value,
    multiline = false,
  }: {
    label: string;
    maiaLabel: string;
    fieldKey: string;
    value: string;
    multiline?: boolean;
  }) {
    const hasValue = Boolean(value.trim());
    const isCopied = copied === fieldKey;
    return (
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(17,21,32,0.5)',
          border: `1px solid ${isCopied ? 'rgba(34,197,94,0.35)' : 'rgba(148,163,184,0.12)'}`,
          borderRadius: 6,
          transition: 'border-color 0.3s',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: hasValue ? 6 : 0,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85em', color: '#e2e8f0' }}>
              {label}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '0.75em', color: '#60a5fa' }}>
              Maia field: <em>{maiaLabel}</em>
            </p>
          </div>
          <button
            type="button"
            disabled={!hasValue}
            onClick={() => handleCopy(fieldKey, value)}
            style={{
              padding: '4px 12px',
              fontSize: '0.8em',
              background: isCopied ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.15)',
              border: `1px solid ${isCopied ? 'rgba(34,197,94,0.4)' : 'rgba(37,99,235,0.3)'}`,
              borderRadius: 4,
              cursor: hasValue ? 'pointer' : 'not-allowed',
              color: isCopied ? '#86efac' : '#93c5fd',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {isCopied ? '✓ Copied!' : 'Copy ⎘'}
          </button>
        </div>
        {hasValue ? (
          <p
            style={{
              margin: 0,
              fontSize: '0.85em',
              color: '#cbd5e1',
              whiteSpace: multiline ? 'pre-wrap' : 'normal',
              lineHeight: 1.5,
              maxHeight: multiline ? 80 : undefined,
              overflow: multiline ? 'auto' : undefined,
            }}
          >
            {value}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.82em', color: '#64748b', fontStyle: 'italic' }}>
            (not filled in — go back to the Manifest to complete this field)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Great Transcription">
        <h3 className="lh-heading-sm">The Great Transcription</h3>
        <p className="lh-world-map__hint">
          Transfer your finalized Manifest into Maia Learning to complete the Great Transcription.
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {([1, 2, 3] as const).map((s) => (
            <span
              key={s}
              style={{
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: '0.85em',
                fontWeight: step === s ? 700 : 400,
                background: step === s ? '#2563eb' : 'rgba(148,163,184,0.12)',
                color: step === s ? '#fff' : '#94a3b8',
              }}
            >
              Step {s}
            </span>
          ))}
        </div>

        {/* ── Step 1: Review ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="lh-panel" style={{ padding: 16 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Review Your Manifest
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Career Goal', value: careerGoal },
                { label: 'Education Plan', value: educationPlan, multiline: true },
                { label: 'Skills Needed', value: skillsNeeded, multiline: true },
                { label: 'Action Steps', value: actionSteps, multiline: true },
              ].map(({ label, value, multiline }) => (
                <div key={label}>
                  <strong style={{ fontSize: '0.88em' }}>{label}:</strong>
                  <p
                    style={{
                      margin: '4px 0 0',
                      whiteSpace: multiline ? 'pre-wrap' : undefined,
                      color: value ? '#f1f5f9' : '#64748b',
                      fontStyle: value ? undefined : 'italic',
                    }}
                  >
                    {value || '(not set — complete your Manifest before this step)'}
                  </p>
                </div>
              ))}
            </div>
            <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={() => setStep(2)}
              >
                Looks good — next step
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Open Maia + Copy Assist ─────────────────────────── */}
        {step === 2 && (
          <div className="lh-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Open Maia Learning &amp; Copy Your Data
            </h4>
            <p className="lh-world-map__hint" style={{ margin: 0 }}>
              Open Maia in a new tab, then use the <strong>Copy</strong> buttons below to
              paste each field into the correct section. You don't need to go back to your
              Manifest — everything is here.
            </p>

            <div className="lh-world-map__actions" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={handleOpenMaia}
              >
                Open Maia Learning ↗
              </button>
            </div>

            {/* Copy-assist panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8em',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                }}
              >
                Your Manifest — click Copy, then paste into Maia
              </p>
              <CopyRow
                label="Career Goal"
                maiaLabel="Career Goal"
                fieldKey="career_goal"
                value={careerGoal}
              />
              <CopyRow
                label="Education Plan"
                maiaLabel="Education Plan"
                fieldKey="education_plan"
                value={educationPlan}
                multiline
              />
              <CopyRow
                label="Skills Needed"
                maiaLabel="Skills to Develop"
                fieldKey="skills_needed"
                value={skillsNeeded}
                multiline
              />
              <CopyRow
                label="Action Steps"
                maiaLabel="Action Steps"
                fieldKey="action_steps"
                value={actionSteps}
                multiline
              />
            </div>

            {maiaOpened && (
              <div className="lh-world-map__actions" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className="lh-button lh-button--ghost"
                  onClick={() => setStep(3)}
                >
                  I have finished entering my data →
                </button>
              </div>
            )}
            {!maiaOpened && (
              <p className="lh-world-map__meta" style={{ fontSize: '0.82em' }}>
                Click "Open Maia Learning" first — the continue button will appear once the tab opens.
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Confirm ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="lh-panel" style={{ padding: 16 }}>
            <h4 className="lh-heading-sm" style={{ marginTop: 0 }}>
              Confirm Transfer
            </h4>
            <p className="lh-world-map__hint">
              By sealing this transcription, you confirm that you have entered your career plan
              information into Maia Learning.
            </p>
            <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={handleConfirmTransfer}
              >
                Seal the Great Transcription
              </button>
              <button
                type="button"
                className="lh-button lh-button--ghost"
                onClick={() => setStep(2)}
              >
                Go back — I need to re-open Maia
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
