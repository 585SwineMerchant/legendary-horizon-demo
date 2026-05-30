import { useState, useEffect } from 'react';

import type { ModuleResultPayload, PlayerSave, QuestDefinition } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  /** Player save — used to build the journey summary */
  player?: PlayerSave;
  /** Full quest list — used to count completed quests */
  quests?: QuestDefinition[];
  /** True Path guild display name */
  truePathGuildName?: string;
};

/**
 * EP-101 "Enter the Epilogue"
 *
 * Transition module. The Master Scribe delivers his closing speech.
 * The student sees a summary of their full journey:
 *   - Acts completed
 *   - Quests completed / total
 *   - XP earned
 *   - True Path chosen
 *
 * Framed as the end of this year's adventure and the beginning of a
 * cycle that continues each school year.
 *
 * Completion: auto-fires after the student reads and clicks "Continue."
 */

function nowIso(): string {
  return new Date().toISOString();
}

// Animation stage gate for the cinematic reveal
type Stage = 0 | 1 | 2 | 3 | 4;

export function EP101EpilogueModule({
  draft: _draft,
  onDraftChange,
  onSubmitResult,
  realmId,
  player,
  quests = [],
  truePathGuildName = 'your chosen guild',
}: Props) {
  const [stage, setStage] = useState<Stage>(0);

  // Cascade the reveal animation
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1600);
    const t4 = setTimeout(() => setStage(4), 2400);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  // Journey stats
  const completedQuests = quests.filter(
    (q) => q.status === 'completed' || q.status === 'turned_in',
  ).length;
  const totalQuests = quests.length;
  const xpTotal = player?.xp_total ?? 0;
  const playerName = player?.display_name ?? 'Traveler';

  const statRows = [
    { label: 'Quests Completed', value: `${completedQuests} / ${totalQuests}` },
    { label: 'Total XP Earned', value: xpTotal.toLocaleString() },
    { label: 'True Path', value: truePathGuildName },
    { label: 'Acts Traversed', value: 'I — IV complete' },
  ];

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Epilogue">
        {/* Master Scribe speech */}
        <div
          className="lh-panel"
          style={{
            padding: '24px 28px',
            marginTop: 8,
            background: 'rgba(10,8,4,0.5)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 8,
            opacity: stage >= 1 ? 1 : 0,
            transform: stage >= 1 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#d4a017',
              fontFamily: 'serif',
            }}
          >
            The Master Scribe speaks
          </p>
          <blockquote
            style={{
              margin: 0,
              padding: '0 0 0 16px',
              borderLeft: '3px solid rgba(212,160,23,0.4)',
              fontFamily: '"Palatino Linotype", serif',
              fontStyle: 'italic',
              color: '#e8d5b0',
              lineHeight: 1.7,
              fontSize: '0.95em',
            }}
          >
            <p style={{ margin: '0 0 10px' }}>
              {playerName} — you have walked from the Awakening to the Grand
              Council and back. You have chosen your True Path in{' '}
              {truePathGuildName}, completed your trials, and stood before your
              peers to share what you discovered.
            </p>
            <p style={{ margin: '0 0 10px' }}>
              The Codex does not close when a year ends. It simply turns the
              page. The choices you make next — the courses you take, the skills
              you build, the adults you seek out — all of it becomes the next
              chapter.
            </p>
            <p style={{ margin: 0 }}>
              You are not finished. You are{' '}
              <strong style={{ color: '#f59e0b', fontStyle: 'normal' }}>
                beginning
              </strong>
              .
            </p>
          </blockquote>
        </div>

        {/* Journey summary stats */}
        <div
          className="lh-panel"
          style={{
            padding: 20,
            marginTop: 16,
            opacity: stage >= 2 ? 1 : 0,
            transform: stage >= 2 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          }}
        >
          <h4
            className="lh-heading-sm"
            style={{ margin: '0 0 14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.8em' }}
          >
            Your Journey — Year One Summary
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {statRows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 6,
                  opacity: stage >= 3 ? 1 : 0,
                  transform: stage >= 3 ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                  }}
                >
                  {row.label}
                </p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1em', color: '#f1f5f9' }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="lh-world-map__actions"
          style={{
            marginTop: 16,
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={() => {
              const completedAt = nowIso();
              onDraftChange({ ep101_completed_iso: completedAt });
              onSubmitResult({
                module_id: 'mod_ep101_epilogue',
                quest_id: 'ep-101',
                realm_id: realmId,
                status: 'completed',
                artifacts: { completed_at: completedAt },
                completed_at_iso: completedAt,
              });
            }}
          >
            Continue — One Final Ritual →
          </button>
        </div>
      </section>
    </div>
  );
}
