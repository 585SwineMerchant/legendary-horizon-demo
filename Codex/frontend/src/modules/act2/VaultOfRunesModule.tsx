import { useMemo } from 'react';

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

export function VaultOfRunesModule({ draft, onDraftChange, onSubmitResult }: Props) {
  const prophecyId = Number(draft.prophecy_id ?? '') || 0;
  const prophecy = prophecyId ? getQuestOfFateProphecy(prophecyId) : undefined;

  const discovered = useMemo(
    () => new Set(parseNumbersCsv(String(draft.vault_discovered_csv ?? ''))),
    [draft.vault_discovered_csv],
  );

  const openRune = async (id: number) => {
    const entry = getQuestOfFateProphecy(id);
    if (!entry) return;
    discovered.add(id);
    onDraftChange({
      vault_discovered_csv: toNumbersCsv([...discovered].sort((a, b) => a - b)),
      vault_last_opened: String(id),
      vault_last_opened_iso: nowIso(),
    });
    await openUrlInNewTabSafe(entry.research_url);
  };

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Vault of Runes">
        <h3 className="lh-heading-sm">Vault of Runes</h3>
        <p className="lh-world-map__hint">
          Select the seal matching your Destiny Number to open the research portal. Opened:{' '}
          <strong>{discovered.size}</strong> / 41
        </p>

        {!prophecy ? (
          <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
            <p className="lh-world-map__meta">
              No prophecy recorded yet. Visit <strong>Oracle of Fate</strong> first, then return here.
            </p>
          </div>
        ) : (
          <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
            <p className="lh-world-map__meta">
              Your Destiny: <strong>#{prophecy.prophecy_id}</strong> — <strong>{prophecy.title}</strong>
            </p>
            <div className="lh-world-map__actions" style={{ marginTop: 10 }}>
              <button type="button" className="lh-button lh-button--primary" onClick={() => void openRune(prophecy.prophecy_id)}>
                Open my destiny portal
              </button>
              <button
                type="button"
                className="lh-button lh-button--secondary"
                onClick={() => void openUrlInNewTabSafe(prophecy.oracle_url)}
              >
                Re-open Oracle record
              </button>
            </div>
          </div>
        )}

        <div className="lh-panel" style={{ padding: 12, marginTop: 12 }}>
          <h4 className="lh-heading-sm">All seals</h4>
          <p className="lh-world-map__meta">
            Discovered seals glow. (Lookup-driven: ids map to URLs via `questOfFateLookup.ts`.)
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 10,
              marginTop: 10,
            }}
          >
            {QUEST_OF_FATE_PROPHECIES.map((p) => {
              const hit = discovered.has(p.prophecy_id);
              const isProphecy = prophecyId === p.prophecy_id;
              return (
                <button
                  key={p.prophecy_id}
                  type="button"
                  className="lh-button lh-button--secondary"
                  onClick={() => void openRune(p.prophecy_id)}
                  style={{
                    padding: 10,
                    border: isProphecy ? '2px solid #f59e0b' : undefined,
                    background: hit ? 'rgba(245,158,11,0.12)' : undefined,
                  }}
                  aria-label={`Seal ${p.prophecy_id}`}
                >
                  {p.prophecy_id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={() => {
              const at = nowIso();
              onSubmitResult({
                module_id: 'mod_vault_of_runes',
                quest_id: 'mq_act2_vault_of_runes',
                realm_id: 'realm_archives_ascension',
                status: 'completed',
                completed_at_iso: at,
              });
            }}
          >
            Record portal visit & return
          </button>
        </div>
      </section>
    </div>
  );
}

