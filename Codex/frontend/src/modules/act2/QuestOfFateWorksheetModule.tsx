import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Career Exploration Worksheet — ported from `Quest of Fate Worksheet.docx`.
 * Fields: career name, summary, five responsibilities, work environment,
 * median salary, minimum education, required credentials, pros (3), cons (3),
 * and personal-fit reflection.
 *
 * Autosaves to `module_drafts.mod_vault_of_runes` so progress persists across
 * sessions without needing a final submit.
 */
export function QuestOfFateWorksheetModule({ draft, onDraftChange, onSubmitResult }: Props) {
  const prophecyTitle = draft.prophecy_title ?? '';
  const prophecyId = draft.prophecy_id ?? '';

  function field(key: string): string {
    return draft[`worksheet_${key}`] ?? '';
  }

  function set(key: string, value: string) {
    onDraftChange({ [`worksheet_${key}`]: value });
  }

  function textArea(key: string, label: string, rows = 3) {
    return (
      <div className="lh-field" key={key}>
        <label className="lh-label" htmlFor={`wf_${key}`}>
          {label}
        </label>
        <textarea
          id={`wf_${key}`}
          className="lh-input lh-input--textarea"
          rows={rows}
          value={field(key)}
          onChange={(e) => set(key, e.target.value)}
        />
      </div>
    );
  }

  function textInput(key: string, label: string, placeholder?: string) {
    return (
      <div className="lh-field" key={key}>
        <label className="lh-label" htmlFor={`wf_${key}`}>
          {label}
        </label>
        <input
          id={`wf_${key}`}
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
    field('career_name').trim() &&
      field('career_summary').trim() &&
      field('median_salary').trim() &&
      field('min_education').trim() &&
      field('personal_fit').trim(),
  );

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Quest of Fate Worksheet">
        <h3 className="lh-heading-sm">Career Exploration Worksheet</h3>
        {prophecyTitle ? (
          <p className="lh-world-map__hint">
            Your Destiny #{prophecyId} — <strong>{prophecyTitle}</strong>
          </p>
        ) : (
          <p className="lh-world-map__hint">
            Complete the Oracle of Fate first to pre-fill your Destiny career.
          </p>
        )}

        <div className="lh-panel" style={{ padding: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Career identity */}
          {textInput('career_name', 'Career', prophecyTitle || 'Enter career name')}

          {/* Section 1: Job Nature */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            1. Job Nature and Responsibilities
          </h4>
          {textArea('career_summary', 'Career Summary — describe what this person does all day:', 3)}
          {textArea('responsibilities', 'Primary Responsibilities — list five specific tasks:', 5)}
          {textArea('work_environment', 'Work Environment — describe the typical setting:', 2)}

          {/* Section 2: Financial Outlook */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            2. Financial Outlook
          </h4>
          {textInput('median_salary', 'Median Salary ($)', 'e.g. 54,000')}

          {/* Section 3: Education */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            3. Educational and Training Requirements
          </h4>
          {textInput('min_education', 'Minimum Education Level Required', 'e.g. Bachelor\'s degree')}
          {textArea('credentials', 'Required Credentials — licenses or certifications:', 2)}

          {/* Section 4: Personal Reflection */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            4. Personal Reflection
          </h4>
          {textArea('pros', 'The Pros — 3 positive features:', 3)}
          {textArea('cons', 'The Cons — 3 negative features:', 3)}
          {textArea('personal_fit', 'Personal Fit — is this a career you may look into further? Why?', 4)}
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              onDraftChange({ worksheet_saved_iso: nowIso() });
              onSubmitResult({
                module_id: 'mod_vault_of_runes',
                quest_id: 'mq-203',
                realm_id: 'realm_archives_ascension',
                status: 'completed',
                artifacts: {
                  career_name: field('career_name'),
                  median_salary: field('median_salary'),
                  min_education: field('min_education'),
                },
                completed_at_iso: nowIso(),
              });
            }}
          >
            Seal worksheet & return
          </button>
          <button
            type="button"
            className="lh-button lh-button--ghost"
            onClick={() => onDraftChange({ worksheet_saved_iso: nowIso() })}
          >
            Save progress
          </button>
        </div>
      </section>
    </div>
  );
}
