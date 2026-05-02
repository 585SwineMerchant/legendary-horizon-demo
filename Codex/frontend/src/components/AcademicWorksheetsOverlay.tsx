import { useMemo, useState } from 'react';

import { COMPARISON_LEDGER_TASK_ID, submitAcademicTaskWithFields } from '../academic/academicProgress';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import type { AcademicWorksheetTaskDef, ExplorationLoopState } from '../domain/lh-contract';

type Props = {
  open: boolean;
  onClose: () => void;
  defs: AcademicWorksheetTaskDef[];
  exploration: ExplorationLoopState;
  onApplyTasks: (tasks: NonNullable<ExplorationLoopState['academic_tasks']>) => void;
  onStartTask: (taskId: string) => void;
};

export function AcademicWorksheetsOverlay({
  open,
  onClose,
  defs,
  exploration,
  onApplyTasks,
  onStartTask,
}: Props) {
  const tasks = exploration.academic_tasks ?? {};
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selected = useMemo(() => defs.find((d) => d.task_id === selectedId) ?? null, [defs, selectedId]);
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const selectTask = (id: string) => {
    setSelectedId(id);
    setSubmitError(null);
    const t = tasks[id];
    setForm(t?.payload ? { ...t.payload } : {});
    const st = t?.status;
    if (st === 'available') onStartTask(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (selected.task_id === COMPARISON_LEDGER_TASK_ID && selected.fields.length === 0) {
      setSubmitError('Add a comparison row from the World map, then this task completes automatically.');
      return;
    }
    const res = submitAcademicTaskWithFields(defs, tasks, selected.task_id, form);
    if (!res.ok) {
      setSubmitError(res.errors.join(' · '));
      return;
    }
    onApplyTasks(res.tasks);
    setSubmitError(null);
  };

  const fieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Research worksheets">
      <div className="lh-panel lh-panel--academic">
        <header className="lh-academic__header">
          <div>
            <p className="lh-eyebrow">Milestone 11</p>
            <h2 className="lh-heading-md">Research worksheets</h2>
            <p className="lh-academic__sub">Academic artifacts persist with your save (exploration payload).</p>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="lh-academic__layout">
          <nav className="lh-academic__nav" aria-label="Worksheet list">
            {defs.map((d) => {
              const t = tasks[d.task_id];
              const st = t?.status ?? 'locked';
              return (
                <button
                  key={d.task_id}
                  type="button"
                  className={`lh-academic__nav-item ${selectedId === d.task_id ? 'lh-academic__nav-item--active' : ''}`}
                  onClick={() => selectTask(d.task_id)}
                >
                  <span className="lh-academic__nav-title">{d.title}</span>
                  <span className={`lh-badge lh-badge--academic-${st}`}>{st.replace(/_/g, ' ')}</span>
                </button>
              );
            })}
          </nav>

          <div className="lh-academic__main">
            {!selected ? (
              <p className="lh-academic__hint">Select a worksheet to view instructions and capture responses.</p>
            ) : (
              <>
                <h3 className="lh-heading-sm">{selected.title}</h3>
                <p className="lh-academic__intro">{selected.intro}</p>

                {selected.task_id === COMPARISON_LEDGER_TASK_ID && selected.fields.length === 0 ? (
                  <div className="lh-academic__ledger-hint">
                    <p>
                      Open <strong>Pause → World map</strong> and submit a row in the Comparison ledger. This worksheet
                      flips to <strong>submitted</strong> automatically once at least one row exists.
                    </p>
                    <p className="lh-academic__meta">
                      Ledger rows recorded: {exploration.ledger_entries.length}
                    </p>
                  </div>
                ) : (
                  <form className="lh-academic__form" onSubmit={handleSubmit}>
                    {selected.fields.map((f) => (
                      <label key={f.key} className="lh-academic__field">
                        <span className="lh-academic__field-label">{f.label}</span>
                        {f.input === 'choice' && f.options?.length ? (
                          <div className="lh-academic__choices">
                            {f.options.map((opt) => (
                              <label key={opt.value} className="lh-academic__choice">
                                <input
                                  type="radio"
                                  name={f.key}
                                  value={opt.value}
                                  checked={form[f.key] === opt.value}
                                  onChange={() => fieldChange(f.key, opt.value)}
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        ) : f.multiline ? (
                          <textarea
                            className="lh-input lh-input--textarea"
                            rows={4}
                            value={form[f.key] ?? ''}
                            placeholder={f.placeholder}
                            onChange={(ev) => fieldChange(f.key, ev.target.value)}
                          />
                        ) : (
                          <input
                            className="lh-input"
                            value={form[f.key] ?? ''}
                            placeholder={f.placeholder}
                            onChange={(ev) => fieldChange(f.key, ev.target.value)}
                          />
                        )}
                      </label>
                    ))}
                    {tasks[selected.task_id]?.status === 'locked' ? (
                      <p className="lh-academic__locked">Complete prerequisite worksheets to unlock this task.</p>
                    ) : tasks[selected.task_id]?.status === 'submitted' || tasks[selected.task_id]?.status === 'reviewed' ? (
                      <p className="lh-academic__done">Submitted — changes are saved with your next manual or auto-save.</p>
                    ) : (
                      <button type="submit" className="lh-button lh-button--primary">
                        Mark worksheet submitted
                      </button>
                    )}
                    {submitError ? <p className="lh-academic__error">{submitError}</p> : null}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
