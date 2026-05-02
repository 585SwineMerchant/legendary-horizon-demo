import { useMemo, useState } from 'react';

import type { ExplorationLoopState, PlayerSave, QuestDefinition } from '../types';
import { listGt102TranscriptsForPlayer, loadGt102Transcript } from '../services/gt102TranscriptStore';

export type TeacherToolsPanelProps = {
  rosterSectionLabel: string;
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
  visitedTriggerIds: string[];
  busy: boolean;
  onUnlockQuest: (questId: string) => Promise<void>;
  onRestoreBackup: () => Promise<void>;
  onRestoreMentorVial: () => Promise<void>;
  onMarkExitTicketSent: () => Promise<void>;
  onResetAct: (act: number) => Promise<void>;
  onOverrideGt102: (outcome: 'passed' | 'failed') => void;
  onClearModuleDraft: (moduleId: string) => void;
};

export function TeacherToolsPanel({
  rosterSectionLabel,
  player,
  quests,
  exploration,
  visitedTriggerIds,
  busy,
  onUnlockQuest,
  onRestoreBackup,
  onRestoreMentorVial,
  onMarkExitTicketSent,
  onResetAct,
  onOverrideGt102,
  onClearModuleDraft,
}: TeacherToolsPanelProps) {
  const [tierFilter, setTierFilter] = useState<'all' | QuestDefinition['tier']>('all');
  const [selectedQuestId, setSelectedQuestId] = useState('');
  const [resetActInput, setResetActInput] = useState(2);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState('');

  const filteredQuests = useMemo(() => {
    if (tierFilter === 'all') return quests;
    return quests.filter((q) => q.tier === tierFilter);
  }, [quests, tierFilter]);

  const lockedIds = useMemo(() => quests.filter((q) => q.status === 'locked').map((q) => q.quest_id), [quests]);

  const gt102TranscriptIds = useMemo(() => listGt102TranscriptsForPlayer(player.player_id), [player.player_id]);
  const gt102Transcript = useMemo(
    () => (selectedTranscriptId ? loadGt102Transcript(selectedTranscriptId) : null),
    [selectedTranscriptId],
  );

  const debugPayload = useMemo(
    () => ({
      roster_section_code: rosterSectionLabel,
      exit_ticket_state: player.exit_ticket_state ?? null,
      has_backup_checkpoint: Boolean(player.backup_checkpoint_json?.trim()),
      player: {
        player_id: player.player_id,
        display_name: player.display_name,
        current_act: player.current_act,
        current_realm_id: player.current_realm_id,
        xp_total: player.xp_total,
        level_cached: player.level_cached,
        active_main_quest_id: player.active_main_quest_id,
        required_next_action: player.required_next_action,
      },
      quests_filtered: filteredQuests,
      exploration: {
        fog_keys_cleared: exploration.fog_keys_cleared,
        waypoint_keys_visited: exploration.waypoint_keys_visited,
        ledger_entry_count: exploration.ledger_entries.length,
        session_encounter_xp_awarded: exploration.session_encounter_xp_awarded ?? 0,
      },
      visited_trigger_object_ids: visitedTriggerIds,
    }),
    [rosterSectionLabel, player, filteredQuests, exploration, visitedTriggerIds],
  );

  return (
    <section className="lh-pause-section lh-pause-section--facilitator" aria-label="Facilitator tools">
      <h3 className="lh-pause-section__label">Facilitator tools</h3>
      <p className="lh-facilitator-tools__hint">
        Milestone 18 — rescue actions post to the Apps Script Web App when configured; otherwise they apply to this
        session only. Section filter is display-only for this roster row:{' '}
        <code className="lh-code-inline">{rosterSectionLabel}</code>.
      </p>

      <div className="lh-facilitator-tools__row">
        <label className="lh-facilitator-tools__label" htmlFor="lh-fac-tier">
          Quest tier filter
        </label>
        <select
          id="lh-fac-tier"
          className="lh-facilitator-tools__select"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as 'all' | QuestDefinition['tier'])}
          disabled={busy}
        >
          <option value="all">All tiers</option>
          <option value="main">Main</option>
          <option value="side">Side</option>
          <option value="guild">Guild</option>
        </select>
      </div>

      <div className="lh-facilitator-tools__row">
        <label className="lh-facilitator-tools__label" htmlFor="lh-fac-unlock">
          Unlock stuck quest
        </label>
        <select
          id="lh-fac-unlock"
          className="lh-facilitator-tools__select"
          value={selectedQuestId}
          onChange={(e) => setSelectedQuestId(e.target.value)}
          disabled={busy}
        >
          <option value="">Select quest…</option>
          {lockedIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="lh-button lh-button--secondary"
          disabled={busy || !selectedQuestId}
          onClick={() => void onUnlockQuest(selectedQuestId)}
        >
          Unlock selected
        </button>
      </div>

      <div className="lh-facilitator-tools__actions lh-stack">
        <button type="button" className="lh-button lh-button--secondary" disabled={busy} onClick={() => void onRestoreBackup()}>
          Restore backup checkpoint
        </button>
        <button
          type="button"
          className="lh-button lh-button--secondary"
          disabled={busy}
          onClick={() => void onRestoreMentorVial()}
        >
          Restore lost item (+1 mentor echo vial)
        </button>
        <button
          type="button"
          className="lh-button lh-button--secondary"
          disabled={busy}
          onClick={() => void onMarkExitTicketSent()}
        >
          Mark exit ticket sent
        </button>
        <div className="lh-facilitator-tools__row">
          <label className="lh-facilitator-tools__label" htmlFor="lh-fac-act">
            Reset act marker
          </label>
          <input
            id="lh-fac-act"
            className="lh-facilitator-tools__input"
            type="number"
            min={1}
            max={9}
            value={resetActInput}
            onChange={(e) => setResetActInput(Number(e.target.value) || 1)}
            disabled={busy}
          />
          <button type="button" className="lh-button lh-button--secondary" disabled={busy} onClick={() => void onResetAct(resetActInput)}>
            Apply act reset
          </button>
        </div>
      </div>

      <details className="lh-facilitator-tools__details">
        <summary>GT-102 override + transcript review</summary>
        <div className="lh-stack" style={{ marginTop: 10 }}>
          <div className="lh-facilitator-tools__row">
            <button
              type="button"
              className="lh-button lh-button--secondary"
              disabled={busy}
              onClick={() => onOverrideGt102('passed')}
            >
              Override: GT-102 Passed
            </button>
            <button
              type="button"
              className="lh-button lh-button--secondary"
              disabled={busy}
              onClick={() => onOverrideGt102('failed')}
            >
              Override: GT-102 Failed
            </button>
            <button
              type="button"
              className="lh-button lh-button--ghost"
              disabled={busy}
              onClick={() => onClearModuleDraft('mod_gt102_trial_of_tongues')}
            >
              Clear GT-102 draft
            </button>
          </div>

          <div className="lh-facilitator-tools__row">
            <label className="lh-facilitator-tools__label" htmlFor="lh-fac-gt102-transcript">
              Transcript
            </label>
            <select
              id="lh-fac-gt102-transcript"
              className="lh-facilitator-tools__select"
              value={selectedTranscriptId}
              onChange={(e) => setSelectedTranscriptId(e.target.value)}
              disabled={busy}
            >
              <option value="">Select transcript…</option>
              {gt102TranscriptIds.map((t) => (
                <option key={t.transcript_id} value={t.transcript_id}>
                  {t.created_iso} — {t.realm_id} — {t.transcript_id}
                </option>
              ))}
            </select>
          </div>

          {gt102Transcript ? (
            <pre className="lh-facilitator-tools__pre" style={{ maxHeight: 240, overflow: 'auto' }}>
              {JSON.stringify(gt102Transcript, null, 2)}
            </pre>
          ) : (
            <p className="lh-facilitator-tools__hint">No transcript selected (or none saved locally yet).</p>
          )}
        </div>
      </details>

      <details className="lh-facilitator-tools__details">
        <summary>Player state debug (read-only)</summary>
        <pre className="lh-facilitator-tools__pre">{JSON.stringify(debugPayload, null, 2)}</pre>
      </details>
    </section>
  );
}
