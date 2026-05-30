import { useState } from 'react';

import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
};

type ScenarioOption = { label: string; points: number };

type Scenario = {
  id: string;
  prompt: string;
  options: ScenarioOption[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 'late_coworker',
    prompt:
      'Your coworker has been arriving late every day this week, leaving you to cover their tasks. What do you do?',
    options: [
      { label: 'Talk to them privately and ask if everything is okay', points: 3 },
      { label: 'Report them to the supervisor immediately', points: 1 },
      { label: 'Ignore it and keep covering — it will sort itself out', points: 0 },
      { label: 'Complain about them to other coworkers', points: 0 },
    ],
  },
  {
    id: 'customer_mistake',
    prompt:
      'You accidentally gave a customer the wrong information. They call back upset. What do you do?',
    options: [
      { label: 'Apologize, correct the mistake, and make sure they have the right info now', points: 3 },
      { label: 'Blame the computer system for the error', points: 0 },
      { label: 'Pass the call to someone else', points: 1 },
      { label: 'Hang up and hope they forget about it', points: 0 },
    ],
  },
  {
    id: 'team_credit',
    prompt:
      'Your team finishes a big project. Your manager asks who contributed. A teammate did most of the work, but you could take credit. What do you do?',
    options: [
      { label: 'Give credit to the teammate who did the heavy lifting', points: 3 },
      { label: 'Say it was a team effort without naming anyone specific', points: 2 },
      { label: 'Take the credit — you need the recognition for a promotion', points: 0 },
      { label: 'Stay quiet and let the manager assume you did it', points: 0 },
    ],
  },
  {
    id: 'social_media',
    prompt:
      'You see a coworker posting negative things about your company on social media during work hours. What do you do?',
    options: [
      { label: 'Talk to the coworker privately about how it could affect their job', points: 3 },
      { label: 'Report it to HR or your supervisor', points: 2 },
      { label: 'Like and comment on their post agreeing with them', points: 0 },
      { label: 'Screenshot it and share with other coworkers', points: 0 },
    ],
  },
  {
    id: 'safety_shortcut',
    prompt:
      'Your boss asks you to skip a safety step to finish a job faster. The shortcut could be dangerous. What do you do?',
    options: [
      { label: 'Politely explain the safety concern and suggest completing the step', points: 3 },
      { label: 'Follow the instructions — the boss knows best', points: 0 },
      { label: 'Skip the step but document that the boss told you to', points: 1 },
      { label: 'Refuse and walk off the job', points: 0 },
    ],
  },
  {
    id: 'confidential_info',
    prompt:
      'A friend asks you to share confidential information from your workplace that could help them get a job there. What do you do?',
    options: [
      { label: 'Decline and suggest they apply through the official process', points: 3 },
      { label: 'Share only a little bit — it cannot hurt', points: 0 },
      { label: 'Share everything — friends help friends', points: 0 },
      { label: 'Tell them you will ask your manager if you can share anything', points: 2 },
    ],
  },
];

const PASS_THRESHOLD = 12; // out of 18 max
const MAX_SCORE = SCENARIOS.length * 3;

function nowIso(): string {
  return new Date().toISOString();
}

export function ArtificersEthicsModule({ draft, onDraftChange, onSubmitResult, realmId }: Props) {
  const [showResults, setShowResults] = useState(false);

  const answered = SCENARIOS.filter((s) => draft[`ethics_${s.id}`] !== undefined);
  const allAnswered = answered.length === SCENARIOS.length;

  function totalScore(): number {
    let score = 0;
    for (const s of SCENARIOS) {
      const idx = Number(draft[`ethics_${s.id}`] ?? -1);
      if (idx >= 0 && idx < s.options.length) {
        score += s.options[idx].points;
      }
    }
    return score;
  }

  function handleSeal() {
    const score = totalScore();
    const passed = score >= PASS_THRESHOLD;
    setShowResults(true);
    onSubmitResult({
      module_id: 'mod_gt103_artificers_ethics',
      quest_id: 'gt-103',
      realm_id: realmId,
      status: passed ? 'passed' : 'failed',
      score,
      completed_at_iso: nowIso(),
    });
  }

  if (showResults) {
    const score = totalScore();
    const passed = score >= PASS_THRESHOLD;
    return (
      <div className="lh-world-map__layout">
        <section className="lh-world-map__realms" aria-label="Ethics Trial Results">
          <h3 className="lh-heading-sm">
            {passed ? 'Trial Passed!' : 'Trial Not Passed'}
          </h3>
          <p className="lh-world-map__hint">
            You scored <strong>{score}</strong> out of {MAX_SCORE}.
            {passed
              ? ' You demonstrated strong workplace ethics and professionalism.'
              : ` You need ${PASS_THRESHOLD} points to pass. Review the scenarios and try again.`}
          </p>
          {SCENARIOS.map((s) => {
            const idx = Number(draft[`ethics_${s.id}`] ?? -1);
            const chosen = idx >= 0 ? s.options[idx] : null;
            const best = s.options.reduce((a, b) => (a.points > b.points ? a : b));
            return (
              <div key={s.id} className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{s.prompt}</p>
                <p style={{ marginBottom: 2 }}>
                  Your answer: <strong>{chosen?.label ?? '(none)'}</strong> ({chosen?.points ?? 0} pts)
                </p>
                {chosen && chosen.points < best.points && (
                  <p style={{ color: '#b47b15', fontSize: '0.9em' }}>
                    Best answer: {best.label} ({best.points} pts)
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Artificer's Ethics Trial">
        <h3 className="lh-heading-sm">Artificer&apos;s Ethics Trial</h3>
        <p className="lh-world-map__hint">
          The Artificer presents six workplace scenarios. Choose the most professional and ethical
          response for each. You need {PASS_THRESHOLD} out of {MAX_SCORE} points to pass.
        </p>

        {SCENARIOS.map((s, si) => {
          const selected = draft[`ethics_${s.id}`];
          return (
            <div key={s.id} className="lh-panel" style={{ padding: 14, marginTop: 10 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>
                {si + 1}. {s.prompt}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.options.map((opt, oi) => (
                  <label
                    key={oi}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    <input
                      type="radio"
                      name={`ethics_${s.id}`}
                      checked={selected === String(oi)}
                      onChange={() => onDraftChange({ [`ethics_${s.id}`]: String(oi) })}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!allAnswered}
            onClick={handleSeal}
          >
            Seal Trial & Submit
          </button>
        </div>
      </section>
    </div>
  );
}
