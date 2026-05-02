import { useMemo, useState } from 'react';

import type { ComparisonLedgerEntry, ExplorationLoopState } from '../exploration/explorationTypes';
import { isRealmUnlocked } from '../exploration/realmUnlock';
import type { ParsedLhMap } from '../maps/parseLhTiledMap';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { PlayerSave, QuestDefinition, RealmDefinition, RealmProgressMap } from '../types';

export type LedgerDraftFields = { career_a: string; career_b: string; note: string };

type Props = {
  open: boolean;
  onClose: () => void;
  realms: RealmDefinition[];
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  parsedMap: ParsedLhMap;
  ledgerDraft: LedgerDraftFields;
  onLedgerDraftChange: (patch: Partial<LedgerDraftFields>) => void;
  onTravelToRealm: (realmId: string) => void;
  onClearFog: (fogKey: string) => void;
  onResearchRealm: (realmId: string) => void;
  onSubmitLedger: (entry: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'>) => void;
};

export function WorldMapOverlay({
  open,
  onClose,
  realms,
  player,
  quests,
  exploration,
  realmProgress,
  parsedMap,
  ledgerDraft,
  onLedgerDraftChange,
  onTravelToRealm,
  onClearFog,
  onResearchRealm,
  onSubmitLedger,
}: Props) {
  const ordered = useMemo(() => sortRealmsCanon(realms), [realms]);
  const [selectedId, setSelectedId] = useState(player.current_realm_id);

  const selected = ordered.find((r) => r.realm_id === selectedId) ?? ordered[0];
  const fogSet = useMemo(() => new Set(exploration.fog_keys_cleared), [exploration.fog_keys_cleared]);

  if (!open) return null;

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !ledgerDraft.career_a.trim() || !ledgerDraft.career_b.trim()) return;
    onSubmitLedger({
      realm_id: selected.realm_id,
      career_a: ledgerDraft.career_a.trim(),
      career_b: ledgerDraft.career_b.trim(),
      note: ledgerDraft.note.trim(),
    });
  };

  const selectedUnlocked = selected ? isRealmUnlocked(selected.realm_id, player, quests) : false;
  const researched = selected ? Boolean(realmProgress[selected.realm_id]?.research_complete) : false;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="World map">
      <div className="lh-panel lh-panel--world-map">
        <header className="lh-world-map__header">
          <div>
            <p className="lh-eyebrow">Act III slice — Milestone 7</p>
            <h2 className="lh-heading-md">World map</h2>
            <p className="lh-world-map__sub">Traveler: {player.display_name}</p>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="lh-world-map__layout">
          <section className="lh-world-map__realms" aria-label="Realms">
            <h3 className="lh-heading-sm">Realms</h3>
            <p className="lh-world-map__hint">Unlocked realms match your current location or active quest destinations.</p>
            <div className="lh-world-map__realm-grid">
              {ordered.map((r) => {
                const unlocked = isRealmUnlocked(r.realm_id, player, quests);
                const here = r.realm_id === player.current_realm_id;
                const visited = Boolean(realmProgress[r.realm_id]?.entered);
                const sel = r.realm_id === selected?.realm_id;
                return (
                  <button
                    key={r.realm_id}
                    type="button"
                    className={`lh-world-realm-tile ${sel ? 'lh-world-realm-tile--selected' : ''} ${unlocked ? '' : 'lh-world-realm-tile--locked'} ${here ? 'lh-world-realm-tile--here' : ''}`}
                    onClick={() => setSelectedId(r.realm_id)}
                  >
                    <span className="lh-world-realm-tile__name">{r.display_name}</span>
                    <span className="lh-world-realm-tile__hq">{r.guild_headquarters}</span>
                    {!unlocked ? <span className="lh-world-realm-tile__badge">Locked</span> : null}
                    {here ? <span className="lh-world-realm-tile__badge lh-world-realm-tile__badge--here">Here</span> : null}
                    {visited && !here ? (
                      <span className="lh-world-realm-tile__badge lh-world-realm-tile__badge--muted">Visited</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="lh-world-map__side">
            {selected ? (
              <>
                <h3 className="lh-heading-sm">{selected.display_name}</h3>
                <p className="lh-world-map__meta">{selected.career_cluster}</p>
                <p className="lh-world-map__meta">{selected.lore_digest}</p>

                <div className="lh-world-map__actions">
                  {selectedUnlocked ? (
                    <button
                      type="button"
                      className="lh-button lh-button--primary"
                      onClick={() => onTravelToRealm(selected.realm_id)}
                    >
                      Enter exploration zone
                    </button>
                  ) : (
                    <p className="lh-world-map__locked-msg">Complete quests that reference this realm to unlock travel.</p>
                  )}
                  {selectedUnlocked ? (
                    <button
                      type="button"
                      className="lh-button lh-button--secondary"
                      onClick={() => onResearchRealm(selected.realm_id)}
                      disabled={researched}
                    >
                      {researched ? 'Guild research logged' : 'Record guild HQ research'}
                    </button>
                  ) : null}
                </div>

                <section className="lh-world-map__fog" aria-label="Fog of war">
                  <h4 className="lh-heading-sm">Fog regions (map export)</h4>
                  {parsedMap.fog_regions.length === 0 ? (
                    <p className="lh-world-map__meta">No fog objects in the active Tiled export.</p>
                  ) : (
                    <ul className="lh-world-map__fog-list">
                      {parsedMap.fog_regions.map((f) => {
                        const key = f.fog_key ?? f.name ?? String(f.tiled_object_id);
                        const cleared = fogSet.has(key);
                        return (
                          <li key={f.tiled_object_id} className="lh-world-map__fog-row">
                            <span>{key}</span>
                            {cleared ? (
                              <span className="lh-world-map__badge-clear">Cleared</span>
                            ) : (
                              <button type="button" className="lh-button lh-button--ghost lh-button--small" onClick={() => onClearFog(key)}>
                                Clear fog
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="lh-world-map__ledger" aria-label="Comparison ledger">
                  <h4 className="lh-heading-sm">Comparison ledger</h4>
                  <p className="lh-world-map__meta">Record one career comparison for this realm. Submitting unlocks downstream quests in the demo.</p>
                  <form className="lh-world-map__ledger-form" onSubmit={handleLedgerSubmit}>
                    <label className="lh-world-map__label">
                      Career / path A
                      <input
                        className="lh-input"
                        value={ledgerDraft.career_a}
                        onChange={(ev) => onLedgerDraftChange({ career_a: ev.target.value })}
                        placeholder="e.g. Agricultural engineer"
                      />
                    </label>
                    <label className="lh-world-map__label">
                      Career / path B
                      <input
                        className="lh-input"
                        value={ledgerDraft.career_b}
                        onChange={(ev) => onLedgerDraftChange({ career_b: ev.target.value })}
                        placeholder="e.g. Conservation scientist"
                      />
                    </label>
                    <label className="lh-world-map__label">
                      Evidence note
                      <textarea
                        className="lh-input lh-input--textarea"
                        value={ledgerDraft.note}
                        onChange={(ev) => onLedgerDraftChange({ note: ev.target.value })}
                        rows={3}
                        placeholder="What did you notice when comparing sources?"
                      />
                    </label>
                    <button
                      type="submit"
                      className="lh-button lh-button--primary"
                      disabled={!ledgerDraft.career_a.trim() || !ledgerDraft.career_b.trim()}
                    >
                      Save ledger entry
                    </button>
                  </form>
                  {exploration.ledger_entries.length ? (
                    <ul className="lh-world-map__ledger-list">
                      {exploration.ledger_entries.map((row) => (
                        <li key={row.id} className="lh-world-map__ledger-item">
                          <strong>{row.career_a}</strong> vs <strong>{row.career_b}</strong>
                          {row.note ? ` — ${row.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
