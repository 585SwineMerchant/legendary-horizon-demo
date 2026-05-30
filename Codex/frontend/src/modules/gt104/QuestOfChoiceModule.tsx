import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  /** Display name of the player's True Path guild (e.g. "Aethelwood"). */
  truePathGuildName?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * GT-104 "Quest of Choice" — deep-dive career research worksheet
 * focused on the player's True Path guild career cluster.
 * Similar structure to Quest of Fate Worksheet but pre-scoped to the chosen guild.
 */
export function QuestOfChoiceModule({
  draft,
  onDraftChange,
  onSubmitResult,
  realmId,
  truePathGuildName = 'your chosen guild',
}: Props) {
  function field(key: string): string {
    return draft[`qoc_${key}`] ?? '';
  }

  function set(key: string, value: string) {
    onDraftChange({ [`qoc_${key}`]: value });
  }

  function textArea(key: string, label: string, rows = 3) {
    return (
      <div className="lh-field" key={key}>
        <label className="lh-label" htmlFor={`qoc_${key}`}>
          {label}
        </label>
        <textarea
          id={`qoc_${key}`}
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
        <label className="lh-label" htmlFor={`qoc_${key}`}>
          {label}
        </label>
        <input
          id={`qoc_${key}`}
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
      field('why_chosen').trim() &&
      field('day_in_life').trim() &&
      field('education_plan').trim() &&
      field('next_steps').trim(),
  );

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Quest of Choice">
        <h3 className="lh-heading-sm">Quest of Choice</h3>
        <p className="lh-world-map__hint">
          You have chosen the path of <strong>{truePathGuildName}</strong>. Now research one
          specific career within this guild&apos;s career cluster in depth.
        </p>

        <div
          className="lh-panel"
          style={{ padding: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Career identity */}
          <h4 className="lh-heading-sm" style={{ marginTop: 0, marginBottom: 0 }}>
            1. Career Identity
          </h4>
          {textInput('career_name', 'Career Title', 'e.g. Registered Nurse')}
          {textInput('career_cluster', 'Career Cluster', truePathGuildName)}
          {textArea('why_chosen', 'Why did you choose this career? What interests you about it?', 3)}

          {/* Day in the life */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            2. A Day in the Life
          </h4>
          {textArea('day_in_life', 'Describe what a typical workday looks like for this career:', 4)}
          {textArea('skills_needed', 'What skills or strengths does this career require?', 3)}

          {/* Education and training */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            3. Education and Training
          </h4>
          {textInput('education_level', 'Minimum Education Required', "e.g. Bachelor's degree")}
          {textArea('education_plan', 'What is your education plan to reach this career?', 3)}
          {textInput('salary_range', 'Salary Range or Median Salary ($)', 'e.g. $50,000 - $70,000')}

          {/* Personal commitment */}
          <h4 className="lh-heading-sm" style={{ marginTop: 4, marginBottom: 0 }}>
            4. Personal Commitment
          </h4>
          {textArea(
            'strengths_fit',
            'How do your personal strengths fit this career?',
            3,
          )}
          {textArea(
            'challenges',
            'What challenges might you face on this path, and how will you overcome them?',
            3,
          )}
          {textArea('next_steps', 'What are your next steps to explore this career further?', 3)}
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              onDraftChange({ qoc_saved_iso: nowIso() });
              onSubmitResult({
                module_id: 'mod_gt104_quest_of_choice',
                quest_id: 'gt-104',
                realm_id: realmId,
                status: 'completed',
                artifacts: {
                  career_name: field('career_name'),
                  career_cluster: field('career_cluster'),
                  salary_range: field('salary_range'),
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
            onClick={() => onDraftChange({ qoc_saved_iso: nowIso() })}
          >
            Save progress
          </button>
        </div>
      </section>
    </div>
  );
}
