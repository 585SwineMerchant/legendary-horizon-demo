import { useMemo, useState } from 'react';

import type { ModuleResultPayload } from '../../types';
import { getQuestOfFateProphecy, QUEST_OF_FATE_PROPHECIES } from './questOfFateLookup';
import { openUrlInNewTabSafe } from '../../services/classroomToolLaunches';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function parseNumbersCsv(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 41);
}

function toNumbersCsv(list: number[]): string {
  return list.join(', ');
}

export function OracleOfFateModule({ draft, onDraftChange, onSubmitResult }: Props) {
  const [busy, setBusy] = useState(false);

  const claimed = useMemo(() => new Set(parseNumbersCsv(String(draft.claimed_numbers_csv ?? ''))), [draft.claimed_numbers_csv]);
  const prophecyId = Number(draft.prophecy_id ?? '') || 0;
  const prophecy = prophecyId ? getQuestOfFateProphecy(prophecyId) : undefined;

  const remaining = useMemo(() => {
    const out: number[] = [];
    for (const p of QUEST_OF_FATE_PROPHECIES) {
      if (!claimed.has(p.prophecy_id)) out.push(p.prophecy_id);
    }
    return out;
  }, [claimed]);

  const roll = async () => {
    if (busy) return;
    if (!remaining.length) return;
    setBusy(true);
    // Tiny delay to feel like a ritual without heavy animation.
    await new Promise((r) => window.setTimeout(r, 550));
    const idx = Math.floor(Math.random() * remaining.length);
    const id = remaining[idx];
    const entry = getQuestOfFateProphecy(id);
    if (!entry) {
      setBusy(false);
      return;
    }
    const nextClaimed = [...claimed, id];
    onDraftChange({
      prophecy_id: String(id),
      prophecy_title: entry.title,
      prophecy_oracle_url: entry.oracle_url,
      prophecy_research_url: entry.research_url,
      claimed_numbers_csv: toNumbersCsv(nextClaimed),
      prophecy_saved_iso: nowIso(),
    });
    setBusy(false);
  };

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Oracle of Fate">
        <h3 className="lh-heading-sm">Oracle of Fate</h3>
        <p className="lh-world-map__hint">
          Consult the Oracle to receive a prophecy. Woven: <strong>{claimed.size}</strong> / 41
        </p>

        <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
          {!prophecy ? (
            <p className="lh-world-map__meta">The Oracle awaits your invocation…</p>
          ) : (
            <>
              <p className="lh-world-map__meta">
                Destiny <strong>#{prophecy.prophecy_id}</strong> — <strong>{prophecy.title}</strong>
              </p>
              <div className="lh-world-map__actions" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="lh-button lh-button--secondary"
                  onClick={() => {
                    void openUrlInNewTabSafe(prophecy.oracle_url);
                  }}
                >
                  Open Oracle record (CareerOneStop)
                </button>
                <button
                  type="button"
                  className="lh-button lh-button--secondary"
                  onClick={() => {
                    void openUrlInNewTabSafe(prophecy.research_url);
                  }}
                >
                  Preview research portal (BLS)
                </button>
              </div>
            </>
          )}

          <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
            <button type="button" className="lh-button lh-button--primary" onClick={() => void roll()} disabled={!remaining.length || busy}>
              {busy ? 'Chanting…' : remaining.length ? 'Consult the Oracle' : 'Destinies fulfilled'}
            </button>
            {prophecy ? (
              <button
                type="button"
                className="lh-button lh-button--primary"
                onClick={() => {
                  const at = nowIso();
                  onSubmitResult({
                    module_id: 'mod_oracle_of_fate',
                    quest_id: 'mq-202',
                    realm_id: 'realm_archives_ascension',
                    status: 'completed',
                    artifacts: {},
                    unlocks: [{ kind: 'unlock_module', target_id: 'mod_vault_of_runes' }],
                    completed_at_iso: at,
                  });
                }}
              >
                Record prophecy & return
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

