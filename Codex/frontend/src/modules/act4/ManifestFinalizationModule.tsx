import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  /** Display name of the True Path guild career cluster. */
  truePathGuildName?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers / insecure contexts
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
 * MQ-404 "Finalize the Traveler Manifest" — final survey compiling
 * the player's True Path data into NYS Career Plan format fields.
 *
 * The four primary fields include:
 *   - Copy-to-clipboard buttons for easy pasting into Maia Learning
 *   - Maia field labels so students know exactly where to paste each value
 */
export function ManifestFinalizationModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
  truePathGuildName = 'your chosen guild',
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  function field(key: string): string {
    return draft[`mf_${key}`] ?? '';
  }

  function set(key: string, value: string) {
    onDraftChange({ [`mf_${key}`]: value });
  }

  async function handleCopy(key: string) {
    const value = field(key);
    if (!value.trim()) return;
    await copyText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  /** Renders a Maia copy-assist banner above a primary field */
  function MaiaLabel({ fieldKey, maiaLabel }: { fieldKey: string; maiaLabel: string }) {
    const hasValue = Boolean(field(fieldKey).trim());
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: '6px 6px 0 0',
          borderBottom: 'none',
          fontSize: '0.8em',
          gap: 8,
        }}
      >
        <span style={{ color: '#93c5fd' }}>
          In Maia, paste this into: <strong style={{ color: '#bfdbfe' }}>{maiaLabel}</strong>
        </span>
        <button
          type="button"
          disabled={!hasValue}
          onClick={() => handleCopy(fieldKey)}
          style={{
            padding: '3px 10px',
            fontSize: '0.85em',
            background: copied === fieldKey ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.15)',
            border: `1px solid ${copied === fieldKey ? 'rgba(34,197,94,0.4)' : 'rgba(37,99,235,0.35)'}`,
            borderRadius: 4,
            cursor: hasValue ? 'pointer' : 'not-allowed',
            color: copied === fieldKey ? '#86efac' : '#93c5fd',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          {copied === fieldKey ? '✓ Copied!' : 'Copy ⎘'}
        </button>
      </div>
    );
  }

  /** Textarea with attached Maia copy banner */
  function primaryTextArea(
    key: string,
    label: string,
    maiaLabel: string,
    rows = 3,
  ) {
    return (
      <div className="lh-field" key={key} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <label className="lh-label" htmlFor={`mf_${key}`} style={{ marginBottom: 6 }}>
          {label}
        </label>
        <MaiaLabel fieldKey={key} maiaLabel={maiaLabel} />
        <textarea
          id={`mf_${key}`}
          className="lh-input lh-input--textarea"
          rows={rows}
          value={field(key)}
          onChange={(e) => set(key, e.target.value)}
          style={{ borderRadius: '0 0 6px 6px', marginTop: 0 }}
        />
      </div>
    );
  }

  /** Single-line input with Maia copy banner */
  function primaryTextInput(
    key: string,
    label: string,
    maiaLabel: string,
    placeholder?: string,
  ) {
    return (
      <div className="lh-field" key={key} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <label className="lh-label" htmlFor={`mf_${key}`} style={{ marginBottom: 6 }}>
          {label}
        </label>
        <MaiaLabel fieldKey={key} maiaLabel={maiaLabel} />
        <input
          id={`mf_${key}`}
          type="text"
          className="lh-input"
          placeholder={placeholder}
          value={field(key)}
          onChange={(e) => set(key, e.target.value)}
          style={{ borderRadius: '0 0 6px 6px', marginTop: 0 }}
        />
      </div>
    );
  }

  /** Secondary field — no Maia label, plain layout */
  function secondaryTextArea(key: string, label: string, rows = 3) {
    return (
      <div className="lh-field" key={key}>
        <label className="lh-label" htmlFor={`mf_${key}`}>
          {label}
        </label>
        <textarea
          id={`mf_${key}`}
          className="lh-input lh-input--textarea"
          rows={rows}
          value={field(key)}
          onChange={(e) => set(key, e.target.value)}
        />
      </div>
    );
  }

  function secondaryTextInput(key: string, label: string, placeholder?: string) {
    return (
      <div className="lh-field" key={key}>
        <label className="lh-label" htmlFor={`mf_${key}`}>
          {label}
        </label>
        <input
          id={`mf_${key}`}
          type="text"
          className="lh-input"
          placeholder={placeholder}
          value={field(key)}
          onChange={(e) => set(key, e.target.value)}
        />
      </div>
    );
  }

  const canSubmit = Boolean(
    field('career_goal').trim() &&
      field('education_plan').trim() &&
      field('skills_needed').trim() &&
      field('action_steps').trim(),
  );

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Finalize the Traveler Manifest">
        <h3 className="lh-heading-sm">Finalize the Traveler Manifest</h3>
        <p className="lh-world-map__hint">
          Compile your career research into a completed Manifest for the guild of{' '}
          <strong>{truePathGuildName}</strong>. This is your official NYS Career Plan.
        </p>

        {/* Maia assist hint */}
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(37,99,235,0.07)',
            border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: 6,
            fontSize: '0.83em',
            color: '#93c5fd',
            marginTop: 4,
          }}
        >
          ⎘ The four primary fields have <strong>Copy</strong> buttons — use them when you
          transfer your plan into Maia Learning in the next quest.
        </div>

        <div
          className="lh-panel"
          style={{ padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* 1. Career Goal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 className="lh-heading-sm" style={{ margin: 0 }}>
              1. Career Goal
            </h4>
            {primaryTextInput(
              'career_goal',
              'My Career Goal',
              'Career Goal',
              'e.g. Become a Registered Nurse',
            )}
            {secondaryTextArea(
              'goal_reason',
              'Why is this your career goal? How does it align with your interests and strengths?',
              3,
            )}
          </div>

          {/* 2. Education Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 className="lh-heading-sm" style={{ margin: 0 }}>
              2. Education Plan
            </h4>
            {primaryTextArea(
              'education_plan',
              'What education or training do you need? Include high school courses, college plans, and any certifications.',
              'Education Plan',
              4,
            )}
            {secondaryTextInput(
              'target_school',
              'Target College or Training Program (if known)',
              'e.g. SUNY Brockport Nursing Program',
            )}
          </div>

          {/* 3. Skills Needed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 className="lh-heading-sm" style={{ margin: 0 }}>
              3. Skills Needed
            </h4>
            {primaryTextArea(
              'skills_needed',
              'What skills do you need to develop for this career?',
              'Skills to Develop',
              3,
            )}
            {secondaryTextArea(
              'skills_current',
              'What skills do you already have that will help you?',
              3,
            )}
          </div>

          {/* 4. Action Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 className="lh-heading-sm" style={{ margin: 0 }}>
              4. Action Steps
            </h4>
            {primaryTextArea(
              'action_steps',
              'List 3-5 specific things you will do in the next year to move toward this career.',
              'Action Steps',
              4,
            )}
            {secondaryTextArea(
              'support_needed',
              'What support do you need from teachers, family, or mentors?',
              3,
            )}
          </div>
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              onDraftChange({ mf_sealed_iso: nowIso() });
              onSubmitResult({
                module_id: 'mod_manifest_finalization',
                quest_id: 'mq-404',
                realm_id: realmId,
                status: 'completed',
                artifacts: {
                  career_goal: field('career_goal'),
                  education_plan: field('education_plan'),
                  skills_needed: field('skills_needed'),
                  action_steps: field('action_steps'),
                },
                completed_at_iso: nowIso(),
              });
            }}
          >
            Seal Manifest &amp; finalize
          </button>
          <button
            type="button"
            className="lh-button lh-button--ghost"
            onClick={() => onDraftChange({ mf_saved_iso: nowIso() })}
          >
            Save progress
          </button>
        </div>
        {!canSubmit && (
          <p className="lh-world-map__meta" style={{ marginTop: 6, fontSize: '0.82em' }}>
            Fill in Career Goal, Education Plan, Skills Needed, and Action Steps to seal your Manifest.
          </p>
        )}
      </section>
    </div>
  );
}
