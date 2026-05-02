import { useMemo } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { groupQuestsForQuestLog, type QuestLogGroupKey } from '../quests/questEngine';
import type { QuestDefinition } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  quests: QuestDefinition[];
  onMarkQuestTurnedIn?: (questId: string) => void;
};

const GROUP_LABEL: Record<QuestLogGroupKey, string> = {
  main: 'Main path',
  side: 'Side quests',
  guild: 'Guild',
  completed: 'Completed & turned in',
};

function QuestCard({
  q,
  onMarkQuestTurnedIn,
}: {
  q: QuestDefinition;
  onMarkQuestTurnedIn?: (id: string) => void;
}) {
  const terminal = q.status === 'completed' || q.status === 'turned_in';
  const prereqNote =
    q.prerequisite_quest_ids?.length && q.status === 'locked'
      ? `Requires: ${q.prerequisite_quest_ids.join(', ')}`
      : null;

  return (
    <li
      className={`lh-quest-list__item ${terminal ? 'lh-quest-list__item--terminal' : ''} ${q.status === 'turned_in' ? 'lh-quest-list__item--turned-in' : ''}`}
    >
      <div className="lh-quest-list__title-row">
        <span className="lh-quest-list__title">{q.title}</span>
        <span className={`lh-badge lh-badge--${q.tier}`}>{q.tier}</span>
        <span className={`lh-badge lh-badge--status-${q.status}`}>{q.status.replace(/_/g, ' ')}</span>
      </div>
      <p className="lh-quest-list__objective">{q.objective_short}</p>
      {prereqNote ? <p className="lh-quest-list__prereq">{prereqNote}</p> : null}
      {q.status === 'completed' && onMarkQuestTurnedIn ? (
        <button type="button" className="lh-button lh-button--ghost lh-button--small" onClick={() => onMarkQuestTurnedIn(q.quest_id)}>
          Mark turned in to facilitator
        </button>
      ) : null}
    </li>
  );
}

export function QuestLogShell({ open, onClose, quests, onMarkQuestTurnedIn }: Props) {
  const groups = useMemo(() => groupQuestsForQuestLog(quests), [quests]);
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const sectionOrder: QuestLogGroupKey[] = ['main', 'side', 'guild', 'completed'];

  return (
    <div className="lh-overlay" role="presentation">
      <div className="lh-panel lh-panel--wide lh-panel--quest-log" role="dialog" aria-label="Quest log">
        <header className="lh-panel__header">
          <h2 className="lh-heading-md">Quest log</h2>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="lh-quest-log__intro">
          Objectives are grouped the same way your facilitator sees them in data — main path first, then side and guild
          work, then finished rows.
        </p>
        <div className="lh-quest-log-sections">
          {sectionOrder.map((key) => {
            const list = groups[key];
            return (
              <section key={key} className="lh-quest-log-section" aria-label={GROUP_LABEL[key]}>
                <h3 className="lh-heading-sm lh-quest-log-section__title">{GROUP_LABEL[key]}</h3>
                {list.length ? (
                  <ul className="lh-quest-list">
                    {list.map((q) => (
                      <QuestCard key={q.quest_id} q={q} onMarkQuestTurnedIn={onMarkQuestTurnedIn} />
                    ))}
                  </ul>
                ) : (
                  <p className="lh-quest-log__empty">No quests in this category yet.</p>
                )}
              </section>
            );
          })}
        </div>
        <footer className="lh-quest-log__footer">
          <p>
            Stuck? Use <strong>Pause → World map</strong> for realms and fog, and <strong>Research worksheets</strong> for
            written tasks. Your directive on the exploration HUD is always the next in-world step.
          </p>
        </footer>
      </div>
    </div>
  );
}
