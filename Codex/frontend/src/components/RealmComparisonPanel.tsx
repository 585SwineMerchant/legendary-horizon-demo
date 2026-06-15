import { useEffect, useMemo, useRef } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import type { RealmReflectionV1 } from '../exploration/explorationTypes';
import type { RealmDefinition } from '../types';
import { getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import { getGuildRealmCareerOneStopUrl } from '../realm/guildRealmCareerOneStopUrl';
import { getCareerClusterLabel } from '../realm/realmRegistry';

const STUDENT_COLUMNS: Array<{
  key: keyof RealmReflectionV1;
  label: string;
  placeholder: string;
}> = [
  { key: 'jobs_found',       label: 'Jobs I Found',           placeholder: 'List jobs or roles you found while researching…' },
  { key: 'skills_needed',    label: 'Skills Needed',          placeholder: 'e.g. teamwork, math, communication…' },
  { key: 'school_subjects',  label: 'School Subjects',        placeholder: 'e.g. biology, English, computer science…' },
  { key: 'work_environment', label: 'Work Environment',       placeholder: 'e.g. outdoors, office, hospital, workshop…' },
  { key: 'why_fits',         label: 'Why This Might Fit Me',  placeholder: 'e.g. I enjoy… I am good at…' },
  { key: 'questions',        label: 'Questions / Concerns',   placeholder: 'e.g. I wonder if… I am unsure about…' },
];

type SyncStatus = 'pending' | 'sending' | 'synced' | 'error' | undefined;

type LedgerGate = {
  signpostsVisited: number;
  guildsResearched: number;
  eligible: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  realms: readonly RealmDefinition[];
  researchedRealmIds: readonly string[];
  reflections: Readonly<Record<string, RealmReflectionV1>>;
  onUpdateReflection: (realmId: string, patch: Partial<RealmReflectionV1>) => void;
  activeLedgerRealmId?: string | null;
  onSubmit?: () => void;
  syncStatus?: SyncStatus;
  backLabel?: string;
  ledgerGate?: LedgerGate;
};

export function RealmComparisonPanel({
  open,
  onClose,
  realms,
  researchedRealmIds,
  reflections,
  onUpdateReflection,
  activeLedgerRealmId,
  onSubmit,
  syncStatus,
  backLabel = '← Back to Atlas',
  ledgerGate,
}: Props) {
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);

  const researchedRealms = useMemo(
    () => realms.filter((r) => researchedRealmIds.includes(r.realm_id)),
    [realms, researchedRealmIds],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [open, activeLedgerRealmId]);

  useEscapeToClose(open, onClose);

  if (!open) return null;

  return (
    <div
      className="lh-guild-info-overlay lh-ledger-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Comparison Ledger"
    >
      {/* Chrome — fixed header, never scrolls */}
      <div className="lh-ledger-panel__chrome">
        <div className="lh-ledger-panel__chrome-left">
          <p className="lh-eyebrow lh-ledger-panel__eyebrow">Act III — Guild Research</p>
          <h2 className="lh-ledger-panel__title">Comparison Ledger</h2>
        </div>
        <div className="lh-ledger-panel__chrome-right">
          <button
            type="button"
            className="lh-button lh-button--ghost lh-ledger-panel__back"
            onClick={onClose}
          >
            {backLabel}
          </button>
          {onSubmit && (() => {
            const alreadySubmitted = syncStatus === 'synced';
            const isSending = syncStatus === 'sending';
            const gateOk = !ledgerGate || ledgerGate.eligible;
            const disabled = isSending || alreadySubmitted || !gateOk;

            return (
              <div className="lh-ledger-panel__submit-area">
                {!alreadySubmitted && ledgerGate && !ledgerGate.eligible && (
                  <div className="lh-ledger-panel__gate-status" role="status">
                    <span className="lh-ledger-panel__gate-line">
                      Foretold Signposts: {ledgerGate.signpostsVisited}/3
                    </span>
                    <span className="lh-ledger-panel__gate-line">
                      Guilds Researched: {ledgerGate.guildsResearched}/5
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className={`lh-button lh-ledger-panel__submit${alreadySubmitted ? ' lh-ledger-panel__submit--done' : ''}${!gateOk ? ' lh-ledger-panel__submit--gated' : ''}`}
                  onClick={onSubmit}
                  disabled={disabled}
                  aria-label="Turn in Comparison Ledger to teacher"
                  title={!gateOk ? 'Turn-in unlocks after you visit all 3 Foretold Signposts and research at least 5 Guilds.' : undefined}
                >
                  {isSending
                    ? 'Submitting…'
                    : alreadySubmitted
                    ? 'Submitted ✓'
                    : 'Turn In Comparison Ledger'}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="lh-ledger-panel__body">
        {researchedRealms.length === 0 ? (
          <div className="lh-ledger-panel__empty">
            <p className="lh-ledger-panel__empty-line">
              Enter a Guild Research Hub in the world to begin your research.
            </p>
            <p className="lh-ledger-panel__empty-sub">
              Each hub you visit will appear here as a row. Click the research link, then fill in what you find.
            </p>
          </div>
        ) : (
          <table className="lh-ledger-table" aria-label="Guild Research Comparison">
            <thead>
              <tr>
                <th className="lh-ledger-th lh-ledger-th--auto lh-ledger-th--guild" scope="col">
                  Guild
                </th>
                <th className="lh-ledger-th lh-ledger-th--auto" scope="col">
                  Career Cluster
                </th>
                <th className="lh-ledger-th lh-ledger-th--auto" scope="col">
                  Career Areas
                </th>
                <th className="lh-ledger-th lh-ledger-th--auto lh-ledger-th--link" scope="col">
                  Research Link
                </th>
                {STUDENT_COLUMNS.map((col) => (
                  <th key={col.key} className="lh-ledger-th lh-ledger-th--student" scope="col">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {researchedRealms.map((realm) => {
                const isActive = realm.realm_id === activeLedgerRealmId;
                const reflection = reflections[realm.realm_id] ?? {};
                const tags = getRealmPathInterestTags(realm);
                const cluster = getCareerClusterLabel(realm);
                const researchUrl = getGuildRealmCareerOneStopUrl(realm.realm_id);
                return (
                  <tr
                    key={realm.realm_id}
                    ref={isActive ? activeRowRef : null}
                    className={`lh-ledger-row${isActive ? ' lh-ledger-row--active' : ''}`}
                  >
                    <td className="lh-ledger-td lh-ledger-td--auto lh-ledger-td--guild">
                      {isActive && <span className="lh-ledger-active-pip" aria-label="Current guild" />}
                      <span className="lh-ledger-realm-name">{realm.display_name}</span>
                    </td>
                    <td className="lh-ledger-td lh-ledger-td--auto">
                      <span className="lh-ledger-cluster">{cluster}</span>
                    </td>
                    <td className="lh-ledger-td lh-ledger-td--auto">
                      <span className="lh-ledger-tags">{tags.join(' · ') || '—'}</span>
                    </td>
                    <td className="lh-ledger-td lh-ledger-td--auto lh-ledger-td--link">
                      {researchUrl ? (
                        <a
                          href={researchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lh-ledger-link"
                        >
                          Open ↗
                        </a>
                      ) : (
                        <span className="lh-ledger-muted">—</span>
                      )}
                    </td>
                    {STUDENT_COLUMNS.map((col) => (
                      <td key={col.key} className="lh-ledger-td lh-ledger-td--student">
                        <textarea
                          className="lh-ledger-textarea"
                          rows={3}
                          value={reflection[col.key] ?? ''}
                          onChange={(e) =>
                            onUpdateReflection(realm.realm_id, { [col.key]: e.target.value })
                          }
                          placeholder={col.placeholder}
                          aria-label={`${col.label} — ${realm.display_name}`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
