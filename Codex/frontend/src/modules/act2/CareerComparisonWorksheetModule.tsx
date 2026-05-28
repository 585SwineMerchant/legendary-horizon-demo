import type { ModuleResultPayload } from '../../types';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

const ROWS = [1, 2, 3] as const;
type RowNum = (typeof ROWS)[number];

const COLUMNS = [
  { key: 'career', label: 'Career', placeholder: 'Career title' },
  { key: 'education_level', label: 'Education Level', placeholder: 'e.g. Associate\'s degree' },
  { key: 'avg_salary', label: 'Average Salary ($)', placeholder: 'e.g. 62,000' },
  { key: 'career_cluster', label: 'Career Cluster', placeholder: 'e.g. Health Science' },
  { key: 'post_secondary_pathway', label: 'Post-Secondary Pathway', placeholder: 'e.g. 2-year college' },
] as const;

type ColKey = (typeof COLUMNS)[number]['key'];

/**
 * Career Comparison Worksheet — ported from `Career Comparison_ksm.xlsx`.
 * Three-career side-by-side comparison.
 * Columns: Career | Education Level | Average Salary | Career Cluster | Post Secondary Pathway
 *
 * Draft keys use prefix `comp_r{N}_` (e.g. `comp_r1_career`).
 * Pre-fill hint for row 1 career comes from `draft.foretold_career_1`, etc.,
 * which useNightOneFlow injects from the foretold signpost list before opening.
 *
 * Saves to `module_drafts.mod_fog_of_unknown`.
 */
export function CareerComparisonWorksheetModule({ draft, onDraftChange, onSubmitResult }: Props) {
  function rowKey(row: RowNum, col: ColKey): string {
    return `comp_r${row}_${col}`;
  }

  function get(row: RowNum, col: ColKey): string {
    return draft[rowKey(row, col)] ?? '';
  }

  function set(row: RowNum, col: ColKey, value: string) {
    onDraftChange({ [rowKey(row, col)]: value });
  }

  /** Resolve placeholder: show foretold hint when row is blank */
  function placeholderFor(row: RowNum, col: ColKey): string {
    const base = COLUMNS.find((c) => c.key === col)?.placeholder ?? '';
    if (col === 'career') {
      const hint = draft[`foretold_career_${row}`];
      if (hint) return hint;
    }
    return base;
  }

  const canSubmit = ROWS.every((r) => get(r, 'career').trim() !== '');

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Career Comparison Worksheet">
        <h3 className="lh-heading-sm">Career Comparison Worksheet</h3>
        <p className="lh-world-map__hint">
          Research three careers and record what you find. Your foretold destinations are pre-suggested — feel free to
          swap any for a career that interests you more.
        </p>

        {/* Instructions banner */}
        <div
          className="lh-panel"
          style={{ padding: '10px 14px', marginTop: 8, background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid #f59e0b' }}
        >
          <p className="lh-world-map__meta" style={{ margin: 0 }}>
            <strong>Instructions:</strong> Go to Maia Learning → Career, or use the BLS Occupational Outlook Handbook
            (<strong>bls.gov/ooh</strong>). Search each career and fill in the columns below, then seal the ledger when
            all three are complete.
          </p>
        </div>

        {/* Comparison table — stacked cards on narrow viewports */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ROWS.map((row) => {
            const careerVal = get(row, 'career').trim();
            return (
              <div
                key={row}
                className="lh-panel"
                style={{ padding: 16 }}
              >
                <h4
                  className="lh-heading-sm"
                  style={{ marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: careerVal ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {row}
                  </span>
                  {careerVal || `Career ${row}`}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {COLUMNS.map((col) => (
                    <div className="lh-field" key={col.key}>
                      <label className="lh-label" htmlFor={`cc_r${row}_${col.key}`}>
                        {col.label}
                      </label>
                      <input
                        id={`cc_r${row}_${col.key}`}
                        type="text"
                        className="lh-input"
                        placeholder={placeholderFor(row, col.key)}
                        value={get(row, col.key)}
                        onChange={(e) => set(row, col.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action row */}
        <div className="lh-world-map__actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            disabled={!canSubmit}
            onClick={() => {
              const at = nowIso();
              onDraftChange({ comp_saved_iso: at });
              onSubmitResult({
                module_id: 'mod_fog_of_unknown',
                quest_id: 'mq-301',
                realm_id: 'realm_high_council_hall',
                status: 'completed',
                artifacts: {
                  career_1: get(1, 'career'),
                  career_2: get(2, 'career'),
                  career_3: get(3, 'career'),
                },
                completed_at_iso: at,
              });
            }}
          >
            Seal ledger & return
          </button>
          <button
            type="button"
            className="lh-button lh-button--ghost"
            onClick={() => onDraftChange({ comp_saved_iso: nowIso() })}
          >
            Save progress
          </button>
        </div>
      </section>
    </div>
  );
}
