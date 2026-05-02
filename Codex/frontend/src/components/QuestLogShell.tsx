import type { QuestRow } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  quests: QuestRow[];
};

export function QuestLogShell({ open, onClose, quests }: Props) {
  if (!open) return null;

  return (
    <div className="lh-overlay" role="presentation">
      <div className="lh-panel lh-panel--wide" role="dialog" aria-label="Quest log">
        <header className="lh-panel__header">
          <h2 className="lh-heading-md">Quest Log</h2>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <ul className="lh-quest-list">
          {quests.map((q) => (
            <li key={q.quest_id} className="lh-quest-list__item">
              <div className="lh-quest-list__title-row">
                <span className="lh-quest-list__title">{q.title}</span>
                <span className={`lh-badge lh-badge--${q.tier}`}>{q.tier}</span>
                <span className={`lh-badge lh-badge--status-${q.status}`}>{q.status}</span>
              </div>
              <p className="lh-quest-list__objective">{q.objective_short}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
