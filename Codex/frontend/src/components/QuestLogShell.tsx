import { useMemo } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { groupQuestsForQuestLog, type QuestLogGroupKey } from '../quests/questEngine';
import type { QuestDefinition } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  quests: QuestDefinition[];
  onMarkQuestTurnedIn?: (questId: string) => void;
  guildPathBreatherNote?: string | null;
  currentRequiredNextAction?: string | null;
};

const GROUP_LABEL: Record<QuestLogGroupKey, string> = {
  main: 'Main Path',
  side: 'Side Quests',
  guild: 'Guild Trials',
  system: 'System & Classroom',
  completed: 'Completed & Turned In',
};

const GROUP_ICON: Record<QuestLogGroupKey, string> = {
  main: '◈',
  side: '◇',
  guild: '⚔',
  system: '📜',
  completed: '✓',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#f59e0b',
  available: '#86efac',
  completed: '#6ee7b7',
  turned_in: '#4ade80',
  locked: 'rgba(255,255,255,0.25)',
};

function QuestCard({
  q,
  onMarkQuestTurnedIn,
}: {
  q: QuestDefinition;
  onMarkQuestTurnedIn?: (id: string) => void;
}) {
  const terminal = q.status === 'completed' || q.status === 'turned_in';
  const statusColor = STATUS_COLOR[q.status] ?? 'rgba(255,255,255,0.4)';

  return (
    <li
      style={{
        padding: '12px 16px',
        background: terminal ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${terminal ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 4,
        opacity: terminal ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#f0dfa0', lineHeight: 1.3, fontFamily: 'serif' }}>
          {q.title}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: statusColor,
          flexShrink: 0,
        }}>
          {q.status.replace(/_/g, ' ')}
        </span>
        <span style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(212,160,23,0.55)',
          flexShrink: 0,
        }}>
          {q.tier}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        {q.objective_short}
      </p>
      {q.status === 'completed' && onMarkQuestTurnedIn ? (
        <button
          type="button"
          style={{
            marginTop: 8,
            padding: '4px 12px',
            fontSize: 11,
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 3,
            color: '#d4a017',
            cursor: 'pointer',
            fontFamily: 'serif',
          }}
          onClick={() => onMarkQuestTurnedIn(q.quest_id)}
        >
          Mark turned in to facilitator
        </button>
      ) : null}
    </li>
  );
}

export function QuestLogShell({
  open,
  onClose,
  quests,
  onMarkQuestTurnedIn,
  guildPathBreatherNote,
  currentRequiredNextAction,
}: Props) {
  const groups = useMemo(() => groupQuestsForQuestLog(quests), [quests]);
  const lockedCount = useMemo(() => quests.filter((q) => q.status === 'locked').length, [quests]);
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const sectionOrder: QuestLogGroupKey[] = ['main', 'side', 'guild', 'system', 'completed'];

  return (
    <div
      className="lh-overlay lh-overlay--pause-submenu"
      role="presentation"
      style={{ background: 'rgba(6,4,2,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'stretch' }}
    >
      <div
        role="dialog"
        aria-label="Quest log"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          color: '#e8dcc8',
          fontFamily: 'serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(212,160,23,0.2)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.6)' }}>
              Legendary Horizon
            </p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f0dfa0', letterSpacing: '0.04em' }}>
              Quest Log
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quest log"
            style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 3,
              color: '#e8dcc8',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'serif',
            }}
          >
            ← Back
          </button>
        </header>

        {/* Next action strip */}
        {currentRequiredNextAction ? (
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid rgba(212,160,23,0.12)',
            background: 'rgba(245,158,11,0.06)',
            flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(212,160,23,0.6)' }}>
              Current directive
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#f0dfa0', fontWeight: 700, lineHeight: 1.3 }}>
              {currentRequiredNextAction}
            </p>
          </div>
        ) : null}

        {/* Sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ height: 20 }} aria-hidden />
          {sectionOrder.map((key) => {
            const list = groups[key];
            if (!list.length) return null;
            return (
              <section key={key} aria-label={GROUP_LABEL[key]}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: 'rgba(212,160,23,0.7)' }} aria-hidden>
                    {GROUP_ICON[key]}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.7)' }}>
                    {GROUP_LABEL[key]}
                  </h3>
                  <div style={{ flex: 1, height: 1, background: 'rgba(212,160,23,0.12)' }} aria-hidden />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', minWidth: 16, textAlign: 'right' }}>{list.length}</span>
                </div>
                {list.length ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {list.map((q) => (
                      <QuestCard key={q.quest_id} q={q} onMarkQuestTurnedIn={onMarkQuestTurnedIn} />
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', paddingLeft: 4 }}>
                    No quests in this category yet.
                  </p>
                )}
              </section>
            );
          })}

          {guildPathBreatherNote ? (
            <aside style={{ padding: '12px 16px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.18)', borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#e8dcc8', lineHeight: 1.5 }}>{guildPathBreatherNote}</p>
            </aside>
          ) : null}

          <footer style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Use <strong style={{ color: 'rgba(255,255,255,0.5)' }}>World Atlas</strong> from the Field Journal to explore realms.
              Your directive on the HUD is always the next in-world step.
            </p>
            {import.meta.env.DEV && lockedCount ? (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,100,100,0.6)' }}>
                DEV: {lockedCount} locked quest row(s) hidden from student view.
              </p>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
