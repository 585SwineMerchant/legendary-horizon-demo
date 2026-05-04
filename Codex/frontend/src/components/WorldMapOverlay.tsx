import { useMemo, useState } from 'react';

import type { ComparisonLedgerEntry, ExplorationLoopState } from '../exploration/explorationTypes';
import {
  buildLedgerEntryPayload,
  summarizeLedgerEntryExtras,
  type LedgerDraftFields,
} from '../exploration/comparisonLedger';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { isRealmUnlocked } from '../exploration/realmUnlock';
import type { ParsedLhMap } from '../maps/parseLhTiledMap';
import { signpostLedgerMilestone } from '../exploration/foretoldSignposts';
import { sortRealmsCanon } from '../realm/realmRegistry';
import type { PlayerSave, QuestDefinition, RealmDefinition, RealmProgressMap } from '../types';

export type { LedgerDraftFields } from '../exploration/comparisonLedger';

type Props = {
  open: boolean;
  onClose: () => void;
  realms: RealmDefinition[];
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
  realmProgress: RealmProgressMap;
  parsedMap: ParsedLhMap;
  /** Shown when realm selection fails (e.g. unknown realm id). */
  realmTravelNotice?: string | null;
  ledgerDraft: LedgerDraftFields;
  onLedgerDraftChange: (patch: Partial<LedgerDraftFields>) => void;
  /** Commit active guild/HQ context from the map (does not load a different explorable tilemap). */
  onTravelToRealm: (realmId: string) => void;
  onClearFog: (fogKey: string) => void;
  onResearchRealm: (realmId: string) => void;
  onUpdateRealmNotes: (realmId: string, notes: string) => void;
  onSubmitLedger: (entry: Omit<ComparisonLedgerEntry, 'id' | 'created_iso'>) => void;
  /** After Vault of Runes (Act II), fog, realm notes, HQ research, and the comparison ledger unlock here. */
  vaultRitualComplete: boolean;
  /** Scroll of Destiny — up to three canon `realm_id`s; emphasizes tiles and ledger guidance. */
  foretoldSignpostRealmIds?: readonly string[];
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
  realmTravelNotice,
  ledgerDraft,
  onLedgerDraftChange,
  onTravelToRealm,
  onClearFog,
  onResearchRealm,
  onUpdateRealmNotes,
  onSubmitLedger,
  vaultRitualComplete,
  foretoldSignpostRealmIds = [],
}: Props) {
  const ordered = useMemo(() => sortRealmsCanon(realms), [realms]);
  const [selectedId, setSelectedId] = useState(player.current_realm_id);

  const selected = ordered.find((r) => r.realm_id === selectedId) ?? ordered[0];
  const fogSet = useMemo(() => new Set(exploration.fog_keys_cleared), [exploration.fog_keys_cleared]);
  const signpostSet = useMemo(
    () => new Set(foretoldSignpostRealmIds.map((id) => String(id || '').trim()).filter(Boolean)),
    [foretoldSignpostRealmIds],
  );
  const scrollLedgerMs = useMemo(
    () => signpostLedgerMilestone(exploration.ledger_entries, foretoldSignpostRealmIds),
    [exploration.ledger_entries, foretoldSignpostRealmIds],
  );
  const selectedSignpostLedgerDone = Boolean(
    selected && signpostSet.has(selected.realm_id) && exploration.ledger_entries.some((e) => e.realm_id === selected.realm_id),
  );
  useEscapeToClose(open, onClose);

  if (!open) return null;

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultRitualComplete) return;
    if (!selected || !ledgerDraft.career_a.trim() || !ledgerDraft.career_b.trim()) return;
    onSubmitLedger(buildLedgerEntryPayload(selected.realm_id, ledgerDraft));
  };

  const selectedUnlocked = selected ? isRealmUnlocked(selected.realm_id, player, quests) : false;
  const researched = selected ? Boolean(realmProgress[selected.realm_id]?.research_complete) : false;
  const notes = selected ? realmProgress[selected.realm_id]?.learned_notes ?? '' : '';
  const canCommitActiveGuild = Boolean(selectedUnlocked && selected);

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="World map">
      <div className="lh-panel lh-panel--world-map">
        <header className="lh-world-map__header">
          <div>
            <p className="lh-eyebrow">
              {vaultRitualComplete ? 'Act III — Fog of the Unknown' : 'Charter & guild desk (Acts I–II)'}
            </p>
            <h2 className="lh-heading-md">World map</h2>
            <p className="lh-world-map__sub">Traveler: {player.display_name}</p>
            <p className="lh-world-map__legend">
              Realm tiles and charter focus stay open for the whole journey. Fog of the Unknown tools, per-realm notes,
              guild research stamps, and the comparison ledger unlock only after you finish the Vault of Runes (Pause →
              Act II), matching your quest log.
            </p>
            {signpostSet.size ? (
              <p className="lh-world-map__signpost-banner" role="note">
                <strong>Scroll — Foretold Signposts:</strong>{' '}
                {foretoldSignpostRealmIds
                  .map((id) => ordered.find((r) => r.realm_id === id)?.display_name ?? id)
                  .join(' · ')}
                {vaultRitualComplete
                  ? ' — anchor your comparison ledger entries and HQ research on these three first, then widen to the full atlas.'
                  : ' — when the ledger opens after the Vault, start comparisons here; all sixteen realms stay explorable later.'}
              </p>
            ) : null}
            {!vaultRitualComplete ? (
              <div className="lh-world-map__progression-gate" role="status">
                <p className="lh-world-map__progression-gate-title">Ledger still sealed</p>
                <p className="lh-world-map__progression-gate-body">
                  Narrative order: <strong>Act I — Manifest</strong> → <strong>Act II — Oracle</strong> →{' '}
                  <strong>Vault of Runes</strong>. When the Vault quest shows complete in your quest log, return here —
                  the map will offer fog clearing, notes, and the comparison ledger for Act III.
                </p>
              </div>
            ) : null}
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="lh-world-map__layout">
          {realmTravelNotice ? (
            <div className="lh-world-map__travel-notice-wrap">
              <p className="lh-world-map__travel-notice" role="status">
                {realmTravelNotice}
              </p>
            </div>
          ) : null}
          <section className="lh-world-map__realms" aria-label="Realms">
            <h3 className="lh-heading-sm">Realms</h3>
            <p className="lh-world-map__hint">Unlocked realms match your current location or active quest destinations.</p>
            <div className="lh-world-map__realm-grid">
              {ordered.map((r) => {
                const unlocked = isRealmUnlocked(r.realm_id, player, quests);
                const optionalSlice = Boolean(r.map_tiled_export);
                const here = r.realm_id === player.current_realm_id;
                const visited = Boolean(realmProgress[r.realm_id]?.entered);
                const sel = r.realm_id === selected?.realm_id;
                const fogged = unlocked && !visited && !here;
                return (
                  <button
                    key={r.realm_id}
                    type="button"
                    className={`lh-world-realm-tile ${sel ? 'lh-world-realm-tile--selected' : ''} ${unlocked ? '' : 'lh-world-realm-tile--locked'} ${fogged ? 'lh-world-realm-tile--fogged' : ''} ${here ? 'lh-world-realm-tile--here' : ''} ${signpostSet.has(r.realm_id) ? 'lh-world-realm-tile--signpost' : ''}`}
                    onClick={() => setSelectedId(r.realm_id)}
                  >
                    <span className="lh-world-realm-tile__name">{r.display_name}</span>
                    <span className="lh-world-realm-tile__hq">{r.guild_headquarters}</span>
                    {signpostSet.has(r.realm_id) ? (
                      <span className="lh-world-realm-tile__badge lh-world-realm-tile__badge--signpost">Signpost</span>
                    ) : null}
                    {optionalSlice ? (
                      <span className="lh-world-realm-tile__badge lh-world-realm-tile__badge--muted">Optional map slice</span>
                    ) : null}
                    {!unlocked ? <span className="lh-world-realm-tile__badge">Locked</span> : null}
                    {fogged ? <span className="lh-world-realm-tile__badge lh-world-realm-tile__badge--fog">Fogged</span> : null}
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
                <p className="lh-world-map__meta">
                  The explorable field is the shared world map. This tile is your guild desk for research, notes, and
                  comparisons — set it active when you are working that HQ.
                </p>

                <div className="lh-world-map__actions">
                  {canCommitActiveGuild ? (
                    <button
                      type="button"
                      className="lh-button lh-button--primary"
                      onClick={() => onTravelToRealm(selected.realm_id)}
                    >
                      Set active guild HQ & continue
                    </button>
                  ) : (
                    <p className="lh-world-map__locked-msg">Complete quests that reference this realm to unlock it here.</p>
                  )}
                  {selectedUnlocked && vaultRitualComplete ? (
                    <button
                      type="button"
                      className="lh-button lh-button--secondary"
                      onClick={() => onResearchRealm(selected.realm_id)}
                      disabled={researched}
                    >
                      {researched ? 'Guild research logged' : 'Record guild HQ research'}
                    </button>
                  ) : selectedUnlocked && !vaultRitualComplete ? (
                    <p className="lh-world-map__locked-msg">
                      Guild research stamps unlock with the comparison ledger after the Vault of Runes.
                    </p>
                  ) : null}
                </div>

                {selectedUnlocked && vaultRitualComplete ? (
                  <section className="lh-world-map__ledger" aria-label="Realm notes">
                    <h4 className="lh-heading-sm">What I learned here</h4>
                    <p className="lh-world-map__meta">
                      Jot quick notes you can reference later. These save with your realm progress.
                    </p>
                    <textarea
                      className="lh-input lh-input--textarea"
                      rows={4}
                      value={notes}
                      onChange={(ev) => onUpdateRealmNotes(selected.realm_id, ev.target.value)}
                      placeholder="Key facts, careers you found, vocabulary, interesting surprises…"
                    />
                  </section>
                ) : selectedUnlocked && !vaultRitualComplete ? (
                  <section className="lh-world-map__ledger" aria-label="Realm notes">
                    <h4 className="lh-heading-sm">What I learned here</h4>
                    <p className="lh-world-map__meta lh-world-map__meta--muted">
                      Opens after the Vault of Runes — part of Act III field journaling on this map.
                    </p>
                  </section>
                ) : null}

                <section className="lh-world-map__fog" aria-label="Fog of war">
                  <h4 className="lh-heading-sm">Fog regions (shared world map)</h4>
                  <p className="lh-world-map__meta">Tied to the primary explorable export, not the guild tile you selected.</p>
                  {!vaultRitualComplete ? (
                    <p className="lh-world-map__meta lh-world-map__meta--muted">
                      Fog clearing unlocks after the Vault of Runes so Act III does not race ahead of Act II divination.
                    </p>
                  ) : parsedMap.fog_regions.length === 0 ? (
                    <p className="lh-world-map__meta">No fog objects in the Tiled export.</p>
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
                              <button
                                type="button"
                                className="lh-button lh-button--ghost lh-button--small"
                                onClick={() => onClearFog(key)}
                              >
                                Clear fog
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="lh-world-map__fog" aria-label="Realm markers">
                  <h4 className="lh-heading-sm">Realm markers (Tiled bridge)</h4>
                  {!vaultRitualComplete ? (
                    <p className="lh-world-map__meta lh-world-map__meta--muted">
                      Marker debug list unlocks with the rest of the Act III map tools after the Vault.
                    </p>
                  ) : parsedMap.realm_markers.length === 0 ? (
                    <p className="lh-world-map__meta">No realm_marker objects found in the Tiled export.</p>
                  ) : (
                    <ul className="lh-world-map__fog-list">
                      {parsedMap.realm_markers.slice(0, 12).map((m) => (
                        <li key={m.tiled_object_id} className="lh-world-map__fog-row">
                          <span>{m.realm_id ?? m.name ?? `marker_${m.tiled_object_id}`}</span>
                          <span className="lh-world-map__meta" style={{ marginLeft: 'auto' }}>
                            #{m.tiled_object_id}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="lh-world-map__ledger" aria-label="Comparison ledger">
                  <h4 className="lh-heading-sm">Comparison ledger</h4>
                  {vaultRitualComplete ? (
                    <>
                      <p className="lh-world-map__meta lh-world-map__ledger-unlock">
                        <strong>Vault-bound ledger.</strong> Act II opened this book after the Vault of Runes; use it
                        while exploring (Act III) like a living career-comparison sheet — two occupations side by side,
                        then education, salary, clusters, pathways, and your synthesis.
                      </p>
                      {signpostSet.size === 3 && selected && !signpostSet.has(selected.realm_id) ? (
                        <p className="lh-world-map__meta lh-world-map__meta--signpost-nudge" role="note">
                          This tile is outside your three Foretold Signposts. The ledger still works everywhere — Maia’s
                          scroll thread is strongest on the signpost realms highlighted on the grid.
                        </p>
                      ) : null}
                      {vaultRitualComplete && scrollLedgerMs.guidesMilestone ? (
                        <p
                          className={`lh-world-map__meta lh-world-map__ledger-scroll-progress ${scrollLedgerMs.milestoneComplete ? 'lh-world-map__ledger-scroll-progress--complete' : ''}`}
                          role="status"
                        >
                          <strong>Scroll ledger milestone:</strong> {scrollLedgerMs.covered} / {scrollLedgerMs.total}{' '}
                          Foretold Signpost realms have a saved comparison (one ledger row per signpost tile).{' '}
                          {scrollLedgerMs.milestoneComplete
                            ? 'All three Foretold Signpost realms have at least one ledger row — the Fog of the Unknown ledger beat is satisfied when that quest is active.'
                            : 'Save from each highlighted signpost tile to anchor the Act III fog beat — other realms stay open for travel and notes.'}
                        </p>
                      ) : null}
                      {selected && signpostSet.has(selected.realm_id) && scrollLedgerMs.guidesMilestone ? (
                        <p
                          className={`lh-world-map__meta ${selectedSignpostLedgerDone ? 'lh-world-map__meta--signpost-ledger-done' : 'lh-world-map__meta--signpost-ledger-here'}`}
                          role="note"
                        >
                          {selectedSignpostLedgerDone
                            ? 'This Foretold Signpost already has a ledger row — you may add another, or finish documenting the remaining signposts.'
                            : 'You are on a Foretold Signpost tile — saving this comparison counts toward the Scroll ledger milestone above.'}
                        </p>
                      ) : null}
                      {selected ? (
                        <p className="lh-world-map__meta lh-world-map__meta--muted">
                          Selected realm tile cluster (for reference): {selected.career_cluster}
                        </p>
                      ) : null}
                      <form className="lh-world-map__ledger-form" onSubmit={handleLedgerSubmit}>
                        <div className="lh-ledger-form-shell">
                          <span className="lh-ledger-colhead">Path A</span>
                          <span className="lh-ledger-colhead">Path B</span>
                          <label className="lh-world-map__label">
                            Occupation / career
                            <input
                              className="lh-input"
                              value={ledgerDraft.career_a}
                              onChange={(ev) => onLedgerDraftChange({ career_a: ev.target.value })}
                              placeholder="e.g. Agricultural engineer"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Occupation / career
                            <input
                              className="lh-input"
                              value={ledgerDraft.career_b}
                              onChange={(ev) => onLedgerDraftChange({ career_b: ev.target.value })}
                              placeholder="e.g. Conservation scientist"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Education level
                            <input
                              className="lh-input"
                              value={ledgerDraft.education_a}
                              onChange={(ev) => onLedgerDraftChange({ education_a: ev.target.value })}
                              placeholder="e.g. Bachelor’s typical"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Education level
                            <input
                              className="lh-input"
                              value={ledgerDraft.education_b}
                              onChange={(ev) => onLedgerDraftChange({ education_b: ev.target.value })}
                              placeholder="e.g. Graduate study common"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Typical salary (your figures)
                            <input
                              className="lh-input"
                              value={ledgerDraft.salary_a}
                              onChange={(ev) => onLedgerDraftChange({ salary_a: ev.target.value })}
                              placeholder="e.g. BLS median ~$82k"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Typical salary (your figures)
                            <input
                              className="lh-input"
                              value={ledgerDraft.salary_b}
                              onChange={(ev) => onLedgerDraftChange({ salary_b: ev.target.value })}
                              placeholder="e.g. BLS median ~$76k"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Career cluster / Holland
                            <input
                              className="lh-input"
                              value={ledgerDraft.career_cluster_a}
                              onChange={(ev) => onLedgerDraftChange({ career_cluster_a: ev.target.value })}
                              placeholder="e.g. RIASEC I + R"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Career cluster / Holland
                            <input
                              className="lh-input"
                              value={ledgerDraft.career_cluster_b}
                              onChange={(ev) => onLedgerDraftChange({ career_cluster_b: ev.target.value })}
                              placeholder="e.g. STEM / Investigative"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Postsecondary pathway
                            <input
                              className="lh-input"
                              value={ledgerDraft.pathway_a}
                              onChange={(ev) => onLedgerDraftChange({ pathway_a: ev.target.value })}
                              placeholder="e.g. 4-yr engineering → PE track"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label">
                            Postsecondary pathway
                            <input
                              className="lh-input"
                              value={ledgerDraft.pathway_b}
                              onChange={(ev) => onLedgerDraftChange({ pathway_b: ev.target.value })}
                              placeholder="e.g. MS + field certs"
                              autoComplete="off"
                            />
                          </label>
                          <label className="lh-world-map__label lh-ledger-form-span2">
                            Comparison synthesis
                            <textarea
                              className="lh-input lh-input--textarea"
                              value={ledgerDraft.note}
                              onChange={(ev) => onLedgerDraftChange({ note: ev.target.value })}
                              rows={3}
                              placeholder="Contrast, fit, surprises, and evidence you would cite on a career plan…"
                            />
                          </label>
                        </div>
                        <button
                          type="submit"
                          className={`lh-button lh-button--primary ${selected && signpostSet.has(selected.realm_id) ? 'lh-button--signpost-ledger' : ''}`}
                          disabled={!ledgerDraft.career_a.trim() || !ledgerDraft.career_b.trim()}
                        >
                          {selected && signpostSet.has(selected.realm_id) ? 'Save ledger entry (Scroll signpost)' : 'Save ledger entry'}
                        </button>
                      </form>
                    </>
                  ) : (
                    <p className="lh-world-map__meta lh-world-map__meta--muted">
                      The Master Scribe keeps this book sealed until you finish the Vault of Runes (Pause → Act II).
                      Earlier acts use the Manifest and Oracle; the ledger opens here afterward with a full two-column
                      comparison row (occupation, education, salary, cluster, pathway, synthesis).
                    </p>
                  )}
                  {exploration.ledger_entries.length ? (
                    <ul className="lh-world-map__ledger-list">
                      {exploration.ledger_entries.map((row) => {
                        const extras = summarizeLedgerEntryExtras(row);
                        const rowSignpost = signpostSet.has(row.realm_id);
                        const realmLabel = ordered.find((r) => r.realm_id === row.realm_id)?.display_name ?? row.realm_id;
                        return (
                          <li
                            key={row.id}
                            className={`lh-world-map__ledger-item ${rowSignpost ? 'lh-world-map__ledger-item--signpost' : ''}`}
                          >
                            <div>
                              <strong>{row.career_a}</strong> <span className="lh-world-map__meta">vs</span>{' '}
                              <strong>{row.career_b}</strong>
                              <span className="lh-world-map__ledger-realm">
                                {' '}
                                · {realmLabel}
                                {rowSignpost ? (
                                  <span className="lh-world-map__ledger-signpost-badge"> Scroll signpost</span>
                                ) : null}
                              </span>
                            </div>
                            {extras ? (
                              <p className="lh-world-map__ledger-extras">{extras}</p>
                            ) : null}
                            {row.note ? <p className="lh-world-map__ledger-note">{row.note}</p> : null}
                          </li>
                        );
                      })}
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
