import { useEffect, useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import type { RealmReflectionV1 } from '../exploration/explorationTypes';
import type { RealmDefinition } from '../types';
import { getRealmPathInterestTags } from '../realm/guildRealmTitleParts';
import { getRealmResearchBullets } from '../realm/guildRealmResearchBullets';

type Props = {
  open: boolean;
  onClose: () => void;
  realms: readonly RealmDefinition[];
  researchedRealmIds: readonly string[];
  reflections: Readonly<Record<string, RealmReflectionV1>>;
  onUpdateReflection: (realmId: string, patch: Partial<RealmReflectionV1>) => void;
};

export function RealmComparisonPanel({
  open,
  onClose,
  realms,
  researchedRealmIds,
  reflections,
  onUpdateReflection,
}: Props) {
  const researchedRealms = useMemo(
    () => realms.filter((r) => researchedRealmIds.includes(r.realm_id)),
    [realms, researchedRealmIds],
  );

  const [realmAId, setRealmAId] = useState<string>('');
  const [realmBId, setRealmBId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setRealmAId((id) =>
      researchedRealms.some((r) => r.realm_id === id) ? id : researchedRealms[0]?.realm_id ?? '',
    );
    setRealmBId((id) =>
      researchedRealms.some((r) => r.realm_id === id) ? id : researchedRealms[1]?.realm_id ?? '',
    );
  }, [open, researchedRealms]);

  useEscapeToClose(open, onClose);

  if (!open) return null;

  const canCompare = researchedRealms.length >= 2;
  const realmA = researchedRealms.find((r) => r.realm_id === realmAId) ?? researchedRealms[0] ?? null;
  const realmB = researchedRealms.find((r) => r.realm_id === realmBId) ?? researchedRealms[1] ?? null;

  return (
    <div
      className="lh-guild-info-overlay lh-comparison-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Comparison Ledger"
    >
      <button
        type="button"
        className="lh-guild-realm-modal__close"
        onClick={onClose}
        aria-label="Close Comparison Ledger"
      >
        ×
      </button>

      <div className="lh-comparison-panel__scroll">
        <header className="lh-comparison-panel__header">
          <p className="lh-eyebrow">Act III — Guild Research</p>
          <h2 className="lh-heading-md">Comparison Ledger</h2>
          <p className="lh-comparison-panel__sub">
            Compare two guild realms to decide which career direction fits you best.
          </p>
        </header>

        {researchedRealms.length === 0 && (
          <div className="lh-comparison-panel__empty">
            <p className="lh-comparison-panel__empty-line">
              Visit a Guild Research Hub and click <strong>Add to Comparison Ledger</strong> to begin.
            </p>
          </div>
        )}

        {researchedRealms.length === 1 && !canCompare && (
          <div className="lh-comparison-panel__one-realm">
            <RealmReflectionColumn
              realm={researchedRealms[0]}
              reflection={reflections[researchedRealms[0].realm_id] ?? {}}
              onUpdate={(patch) => onUpdateReflection(researchedRealms[0].realm_id, patch)}
            />
            <p className="lh-comparison-panel__nudge">
              Record one more realm to begin comparing.
            </p>
          </div>
        )}

        {canCompare && (
          <>
            <div className="lh-comparison-panel__pickers">
              <label className="lh-comparison-panel__picker-label">
                Realm A
                <select
                  className="lh-input lh-comparison-panel__picker-select"
                  value={realmAId}
                  onChange={(e) => setRealmAId(e.target.value)}
                >
                  {researchedRealms.map((r) => (
                    <option key={r.realm_id} value={r.realm_id}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <span className="lh-comparison-panel__vs" aria-hidden="true">
                vs
              </span>
              <label className="lh-comparison-panel__picker-label">
                Realm B
                <select
                  className="lh-input lh-comparison-panel__picker-select"
                  value={realmBId}
                  onChange={(e) => setRealmBId(e.target.value)}
                >
                  {researchedRealms.map((r) => (
                    <option key={r.realm_id} value={r.realm_id}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="lh-comparison-panel__cols">
              {realmA && (
                <RealmReflectionColumn
                  realm={realmA}
                  reflection={reflections[realmA.realm_id] ?? {}}
                  onUpdate={(patch) => onUpdateReflection(realmA.realm_id, patch)}
                />
              )}
              {realmB && (
                <RealmReflectionColumn
                  realm={realmB}
                  reflection={reflections[realmB.realm_id] ?? {}}
                  onUpdate={(patch) => onUpdateReflection(realmB.realm_id, patch)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RealmReflectionColumn({
  realm,
  reflection,
  onUpdate,
}: {
  realm: RealmDefinition;
  reflection: RealmReflectionV1;
  onUpdate: (patch: Partial<RealmReflectionV1>) => void;
}) {
  const tags = getRealmPathInterestTags(realm);
  const bullets = getRealmResearchBullets(realm.realm_id);

  return (
    <div className="lh-comparison-col">
      <div className="lh-comparison-col__meta">
        <h3 className="lh-comparison-col__title">{realm.display_name}</h3>
        <p className="lh-comparison-col__cluster">{realm.career_cluster}</p>
        {tags.length > 0 && (
          <ul className="lh-guild-realm-modal__diamond-list lh-comparison-col__tags">
            {tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <div className="lh-comparison-col__bullets">
          <p className="lh-world-map__meta">Research focus:</p>
          <ul className="lh-guild-realm-modal__diamond-list">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lh-comparison-col__fields">
        <label className="lh-comparison-col__field lh-world-map__label">
          How interested are you in this realm, and why?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.interest ?? ''}
            onChange={(e) => onUpdate({ interest: e.target.value })}
            placeholder="High / medium / low — explain why…"
          />
        </label>
        <label className="lh-comparison-col__field lh-world-map__label">
          What skills does this realm use?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.skills ?? ''}
            onChange={(e) => onUpdate({ skills: e.target.value })}
            placeholder="e.g. teamwork, math, communication…"
          />
        </label>
        <label className="lh-comparison-col__field lh-world-map__label">
          What school subjects connect to this realm?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.subjects ?? ''}
            onChange={(e) => onUpdate({ subjects: e.target.value })}
            placeholder="e.g. biology, English, computer science…"
          />
        </label>
        <label className="lh-comparison-col__field lh-world-map__label">
          What kind of work environment does this suggest?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.work_env ?? ''}
            onChange={(e) => onUpdate({ work_env: e.target.value })}
            placeholder="e.g. outdoors, office, hospital, workshop…"
          />
        </label>
        <label className="lh-comparison-col__field lh-world-map__label">
          What is one strength you have that fits this realm?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.strength ?? ''}
            onChange={(e) => onUpdate({ strength: e.target.value })}
            placeholder="e.g. I am good at…"
          />
        </label>
        <label className="lh-comparison-col__field lh-world-map__label">
          What is one concern or question you still have?
          <textarea
            className="lh-input lh-input--textarea"
            rows={2}
            value={reflection.concern ?? ''}
            onChange={(e) => onUpdate({ concern: e.target.value })}
            placeholder="e.g. I wonder if…"
          />
        </label>
      </div>
    </div>
  );
}
