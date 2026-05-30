import { useMemo, useRef, useState } from 'react';

import type { ModuleResultPayload } from '../../types';
import { ORACLE_CAREER_DATA, getOracleCareerEntry } from './oracleCareerData';
import { OracleCinematicPlayer } from '../../screens/OracleCinematicPlayer';
import { OracleProphecyReveal } from '../../screens/OracleProphecyReveal';
import { openUrlInNewTabSafe } from '../../services/classroomToolLaunches';

// Custom-event keys that bridge the module to Phaser visuals.
const LH_WINDOW_ORACLE_BUILDUP_START     = 'lh:oracle-buildup-start';
const LH_WINDOW_ORACLE_RETURN_TRANSITION = 'lh:oracle-return-transition';

type OraclePhase =
  | 'idle'           // waiting for player to invoke Oracle
  | 'buildingUp'     // brief pre-cutscene buildup (fires Phaser event)
  | 'cutscene'       // OracleCinematicPlayer plays
  | 'prophecyReveal' // OracleProphecyReveal fullscreen overlay
  | 'complete';      // result visible, ready to submit

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
  const claimed    = useMemo(
    () => new Set(parseNumbersCsv(String(draft.claimed_numbers_csv ?? ''))),
    [draft.claimed_numbers_csv],
  );
  const prophecyId    = Number(draft.prophecy_id ?? '') || 0;
  const prophecy      = prophecyId ? getOracleCareerEntry(prophecyId) : undefined;

  // If a prophecy already exists from a previous session, jump straight to complete.
  const [phase, setPhase] = useState<OraclePhase>(prophecyId ? 'complete' : 'idle');
  const rollingRef = useRef(false);

  const remaining = useMemo(() => {
    const out: number[] = [];
    for (const e of ORACLE_CAREER_DATA) {
      if (!claimed.has(e.prophecy_id)) out.push(e.prophecy_id);
    }
    return out;
  }, [claimed]);

  // --- phase transitions ---

  async function handleConsult() {
    if (rollingRef.current || !remaining.length) return;
    rollingRef.current = true;

    // 1. Pick destiny
    const idx   = Math.floor(Math.random() * remaining.length);
    const id    = remaining[idx];
    const entry = getOracleCareerEntry(id);
    if (!entry) {
      rollingRef.current = false;
      return;
    }

    // 2. Persist selection immediately so a refresh doesn't re-roll
    const nextClaimed = [...claimed, id];
    onDraftChange({
      prophecy_id:              String(id),
      prophecy_title:           entry.title,
      prophecy_cluster_name:    entry.cluster_name,
      prophecy_realm_id:        entry.realm_id,
      prophecy_oracle_url:      entry.oracle_url,
      prophecy_research_url:    entry.research_url,
      claimed_numbers_csv:      toNumbersCsv(nextClaimed),
      prophecy_saved_iso:       nowIso(),
    });

    // 3. Buildup phase → Phaser visual
    setPhase('buildingUp');
    window.dispatchEvent(new CustomEvent(LH_WINDOW_ORACLE_BUILDUP_START, { detail: { prophecy_id: id } }));

    // 4. Brief hold so the Phaser buildup has time to start, then hand off to cinematic
    await new Promise<void>((r) => window.setTimeout(r, 1400));
    setPhase('cutscene');
    rollingRef.current = false;
  }

  function handleCinematicComplete() {
    // Mark the cutscene as seen so subsequent viewings can show the Skip button.
    if (!draft.oracle_cutscene_seen) {
      onDraftChange({ oracle_cutscene_seen: new Date().toISOString() });
    }
    setPhase('prophecyReveal');
  }

  function handleRevealComplete() {
    setPhase('complete');
  }

  function handleSubmit() {
    const at = nowIso();
    window.dispatchEvent(new CustomEvent(LH_WINDOW_ORACLE_RETURN_TRANSITION));
    onSubmitResult({
      module_id:        'mod_oracle_of_fate',
      quest_id:         'mq-202',
      realm_id:         'realm_archives_ascension',
      status:           'completed',
      artifacts:        {
        prophecy_id:           String(prophecyId),
        prophecy_title:        prophecy?.title ?? '',
        prophecy_cluster_name: prophecy?.cluster_name ?? '',
        prophecy_realm_id:     prophecy?.realm_id ?? '',
      },
      unlocks:          [{ kind: 'unlock_module', target_id: 'mod_vault_of_runes' }],
      completed_at_iso: at,
    });
  }

  // --- fullscreen overlays (rendered outside the module panel) ---

  if (phase === 'cutscene') {
    // allowSkip = true only if the student has already watched the cutscene before
    // (flag saved to draft at the end of the first viewing).
    return (
      <OracleCinematicPlayer
        onComplete={handleCinematicComplete}
        allowSkip={Boolean(draft.oracle_cutscene_seen)}
      />
    );
  }

  if (phase === 'prophecyReveal' && prophecy) {
    return (
      <OracleProphecyReveal
        prophecyId={prophecy.prophecy_id}
        prophecyTitle={prophecy.title}
        onComplete={handleRevealComplete}
      />
    );
  }

  // --- standard module panel ---

  const currentProphecy = prophecyId ? getOracleCareerEntry(prophecyId) : undefined;

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Oracle of Fate">
        <h3 className="lh-heading-sm">Oracle of Fate</h3>
        <p className="lh-world-map__hint">
          Consult the Oracle to receive a prophecy. Destinies woven:{' '}
          <strong>{claimed.size}</strong> / 41
        </p>

        <div className="lh-panel" style={{ padding: 12, marginTop: 8 }}>
          {phase === 'idle' || phase === 'buildingUp' ? (
            <>
              <p className="lh-world-map__meta">
                {phase === 'buildingUp'
                  ? 'The Oracle stirs… the Vault of Runes trembles…'
                  : 'Step forward. The Oracle awaits your invocation.'}
              </p>
              <div className="lh-world-map__actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="lh-button lh-button--primary"
                  onClick={() => void handleConsult()}
                  disabled={!remaining.length || phase === 'buildingUp'}
                >
                  {phase === 'buildingUp'
                    ? 'Chanting…'
                    : remaining.length
                    ? 'Consult the Oracle'
                    : 'All destinies fulfilled'}
                </button>
              </div>
            </>
          ) : (
            /* complete phase — show prophecy summary */
            <>
              {currentProphecy ? (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(212,160,23,0.08)',
                    borderLeft: '3px solid #d4a017',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                >
                  <p className="lh-world-map__meta" style={{ margin: '0 0 4px', opacity: 0.7 }}>
                    Destiny #{currentProphecy.prophecy_id}
                  </p>
                  <p className="lh-heading-sm" style={{ margin: '0 0 4px' }}>
                    {currentProphecy.title}
                  </p>
                  <p className="lh-world-map__meta" style={{ margin: 0, fontSize: 12 }}>
                    {currentProphecy.cluster_name} · {currentProphecy.realm_id.replace('realm_', '').replace(/_/g, ' ')}
                  </p>
                </div>
              ) : null}

              <div className="lh-world-map__actions" style={{ marginTop: 10 }}>
                {currentProphecy ? (
                  <>
                    <button
                      type="button"
                      className="lh-button lh-button--secondary"
                      onClick={() => void openUrlInNewTabSafe(currentProphecy.oracle_url)}
                    >
                      Open Oracle record (CareerOneStop)
                    </button>
                    <button
                      type="button"
                      className="lh-button lh-button--secondary"
                      onClick={() => void openUrlInNewTabSafe(currentProphecy.research_url)}
                    >
                      Preview research portal (BLS)
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="lh-button lh-button--primary"
                  disabled={!currentProphecy}
                  onClick={handleSubmit}
                >
                  Record prophecy & return
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
