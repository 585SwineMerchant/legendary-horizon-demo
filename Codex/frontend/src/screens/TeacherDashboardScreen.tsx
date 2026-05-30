import { useEffect, useMemo, useState } from 'react';

import type { ExplorationLoopState } from '../domain/lh-contract';
import { coerceExplorationLoop, loadPlayerStateFromRemote } from '../services/manualSaveGateway';
import {
  teacherResetActRemote,
  teacherRestoreBackupRemote,
  teacherRestoreItemRemote,
  teacherUnlockQuestRemote,
} from '../services/teacherToolsGateway';
import { TeacherToolsPanel } from '../components/TeacherToolsPanel';
import { CampfireGradingPanel } from '../components/CampfireGradingPanel';
import { createEmptyExplorationLoopState } from '../exploration/explorationTypes';
import { postLhWebAppJson } from '../services/lhWebAppClient';
import type { CampfireReflectionRow } from '../domain/lh-contract';

type RosterRow = {
  student_email?: string;
  student_id?: string;
  player_display_name?: string;
  teacher_email?: string;
  course?: string;
  class_section?: string;
  section_code?: string;
  player_id?: string;
  roster_row?: number;
};

type PlayerSummary = {
  player_id: string;
  display_name: string;
  current_act: number;
  current_realm_id: string;
  required_next_action: string;
  active_main_quest_id: string;
  active_main_quest_title: string;
  xp_total: number;
  level_cached: number;
  last_manual_save_iso?: string;
  exit_ticket_state?: string;
};

type CombinedRow = PlayerSummary & {
  section_code?: string;
  student_email?: string;
  teacher_email?: string;
  needs: {
    missingNext: boolean;
    noExitTicket: boolean;
    staleSave: boolean;
  };
};

function parseIsoMs(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function computeNeeds(row: PlayerSummary): CombinedRow['needs'] {
  const missingNext = !row.required_next_action?.trim();
  const noExitTicket = String(row.exit_ticket_state ?? '').trim().toLowerCase() !== 'sent';
  const saveMs = parseIsoMs(row.last_manual_save_iso);
  const staleSave = saveMs == null ? true : Date.now() - saveMs > 1000 * 60 * 60 * 24; // 24h
  return { missingNext, noExitTicket, staleSave };
}

async function listRoster(filters: { section_code?: string; teacher_email?: string }): Promise<RosterRow[]> {
  const res = await postLhWebAppJson({ action: 'list_roster', filters });
  if (!res.ok) throw new Error(res.message);
  if (!res.payload.ok) {
    const err = String(res.payload.error ?? 'list_roster_failed');
    if (err === 'unknown_action') {
      throw new Error(
        'Backend does not support list_roster yet (unknown_action). ' +
          'Redeploy Apps Script with updated `LhWebApp.js` + services.',
      );
    }
    throw new Error(err);
  }
  const rows = (res.payload.roster as unknown) ?? [];
  return Array.isArray(rows) ? (rows as RosterRow[]) : [];
}

async function listPlayerSummaries(filters: { player_ids?: string[] }): Promise<PlayerSummary[]> {
  const res = await postLhWebAppJson({ action: 'list_player_summaries', filters });
  if (!res.ok) throw new Error(res.message);
  if (!res.payload.ok) {
    const err = String(res.payload.error ?? 'list_player_summaries_failed');
    if (err === 'unknown_action') {
      throw new Error(
        'Backend does not support list_player_summaries yet (unknown_action). ' +
          'Redeploy Apps Script with updated `LhWebApp.js` + services.',
      );
    }
    throw new Error(err);
  }
  const rows = (res.payload.players as unknown) ?? [];
  return Array.isArray(rows) ? (rows as PlayerSummary[]) : [];
}

async function listCampfireReflections(): Promise<CampfireReflectionRow[]> {
  const res = await postLhWebAppJson({ action: 'list_campfire_reflections' });
  if (!res.ok) throw new Error(res.message);
  if (!res.payload.ok) throw new Error(String(res.payload.error ?? 'list_campfire_reflections_failed'));
  const rows = (res.payload.reflections as unknown) ?? [];
  return Array.isArray(rows) ? (rows as CampfireReflectionRow[]) : [];
}

async function gradeCampfireReflection(
  sessionId: string,
  _playerId: string,
  score: number,
  comment: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await postLhWebAppJson({
    action: 'grade_campfire',
    session_id: sessionId,
    score,
    comment,
  });
  if (!res.ok) return { ok: false, message: res.message };
  if (!res.payload.ok) return { ok: false, message: String(res.payload.message ?? res.payload.error ?? 'grade_campfire failed') };
  return { ok: true, message: String(res.payload.message ?? 'Graded.') };
}

export function TeacherDashboardScreen(props: { onBack: () => void }) {
  const enabled = import.meta.env.DEV || import.meta.env.VITE_LH_TEACHER_DASHBOARD === 'true';
  const [teacherEmail, setTeacherEmail] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [summaries, setSummaries] = useState<PlayerSummary[]>([]);

  // Campfire grading queue
  const [reflections, setReflections] = useState<CampfireReflectionRow[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    player: Extract<Awaited<ReturnType<typeof loadPlayerStateFromRemote>>, { ok: true }>['player'];
    quests: Extract<Awaited<ReturnType<typeof loadPlayerStateFromRemote>>, { ok: true }>['quests'];
    exploration: ExplorationLoopState;
    visited: string[];
  } | null>(null);

  const combined: CombinedRow[] = useMemo(() => {
    const rosterIds: string[] = [];
    const rosterByPlayer = new Map<string, RosterRow>();
    for (const r of roster ?? []) {
      const pid = String(r.player_id ?? '').trim();
      if (!pid) continue;
      rosterIds.push(pid);
      rosterByPlayer.set(pid, r);
    }

    const summariesByPlayer = new Map<string, PlayerSummary>();
    for (const s of summaries ?? []) {
      const pid = typeof s?.player_id === 'string' ? s.player_id.trim() : '';
      if (!pid) continue;
      summariesByPlayer.set(pid, s);
    }

    // Important: render *roster-first* so the table shows rows even if summaries are missing/partial.
    const rows: CombinedRow[] = rosterIds.map((pid) => {
      const r = rosterByPlayer.get(pid);
      const s = summariesByPlayer.get(pid);
      const base: PlayerSummary = s ?? {
        player_id: pid,
        display_name: String(r?.player_display_name ?? '').trim(),
        current_act: 1,
        current_realm_id: '',
        required_next_action: '',
        active_main_quest_id: '',
        active_main_quest_title: '',
        xp_total: 0,
        level_cached: 1,
        last_manual_save_iso: '',
        exit_ticket_state: '',
      };
      const needs = computeNeeds(base);
      return {
        ...base,
        display_name: base.display_name || String(r?.player_display_name ?? '').trim() || pid,
        section_code: r?.section_code,
        student_email: r?.student_email,
        teacher_email: r?.teacher_email,
        needs,
      };
    });

    if (import.meta.env.DEV) {
      console.debug('[TeacherDashboard] rows', {
        rosterCount: roster?.length ?? 0,
        summariesCount: summaries?.length ?? 0,
        renderedCount: rows.length,
        firstRoster: roster?.[0] ?? null,
        firstSummary: summaries?.[0] ?? null,
      });
    }

    return rows.sort((a, b) => {
      const an = Number(a.needs.missingNext) + Number(a.needs.noExitTicket) + Number(a.needs.staleSave);
      const bn = Number(b.needs.missingNext) + Number(b.needs.noExitTicket) + Number(b.needs.staleSave);
      if (an !== bn) return bn - an;
      return a.display_name.localeCompare(b.display_name);
    });
  }, [roster, summaries]);

  useEffect(() => {
    if (!enabled) return;
    // Auto-load on first view (unfiltered) — safe default for small pilots.
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await listRoster({});
        if (import.meta.env.DEV) console.debug('[TeacherDashboard] list_roster ok', r);
        const ids = r.map((row) => String(row.player_id ?? '').trim()).filter(Boolean);
        const s = await listPlayerSummaries({ player_ids: ids.length ? ids : undefined });
        if (import.meta.env.DEV) console.debug('[TeacherDashboard] list_player_summaries ok', s);
        setRoster(r);
        setSummaries(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled]);

  const refreshReflections = () => {
    if (!enabled) return;
    void (async () => {
      setReflectionsLoading(true);
      setReflectionsError(null);
      try {
        const rows = await listCampfireReflections();
        setReflections(rows);
      } catch (e) {
        setReflectionsError(e instanceof Error ? e.message : String(e));
      } finally {
        setReflectionsLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (!enabled) return;
    refreshReflections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!selectedPlayerId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    void (async () => {
      setDetailBusy(true);
      setDetailError(null);
      try {
        const load = await loadPlayerStateFromRemote(selectedPlayerId);
        if (!load.ok) {
          setDetail(null);
          setDetailError(load.message);
          return;
        }
        const explorationBase = load.exploration_loop ? coerceExplorationLoop(load.exploration_loop) : null;
        setDetail({
          player: load.player,
          quests: load.quests,
          exploration: explorationBase ?? createEmptyExplorationLoopState(),
          visited: load.progression_flags.visited_trigger_object_ids ?? [],
        });
      } catch (e) {
        setDetail(null);
        setDetailError(e instanceof Error ? e.message : String(e));
      } finally {
        setDetailBusy(false);
      }
    })();
  }, [selectedPlayerId]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        ...(teacherEmail.trim() ? { teacher_email: teacherEmail.trim() } : {}),
        ...(sectionCode.trim() ? { section_code: sectionCode.trim() } : {}),
      };
      if (import.meta.env.DEV) console.debug('[TeacherDashboard] refresh filters', filters);
      const r = await listRoster(filters);
      if (import.meta.env.DEV) console.debug('[TeacherDashboard] list_roster ok', r);
      const ids = r.map((row) => String(row.player_id ?? '').trim()).filter(Boolean);
      const s = await listPlayerSummaries({ player_ids: ids.length ? ids : undefined });
      if (import.meta.env.DEV) console.debug('[TeacherDashboard] list_player_summaries ok', s);
      setRoster(r);
      setSummaries(s);
      // If current selection fell out of scope, clear it.
      if (selectedPlayerId && !ids.includes(selectedPlayerId)) setSelectedPlayerId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const runAndReloadSelected = async (op: () => Promise<{ ok: boolean; message: string; simulated?: boolean }>) => {
    if (!selectedPlayerId) return;
    setDetailBusy(true);
    setDetailError(null);
    try {
      const res = await op();
      if (!res.ok) {
        setDetailError(res.message);
        return;
      }
      // Always reload from remote when using the teacher dashboard.
      const load = await loadPlayerStateFromRemote(selectedPlayerId);
      if (load.ok) {
        const explorationBase = load.exploration_loop ? coerceExplorationLoop(load.exploration_loop) : null;
        setDetail({
          player: load.player,
          quests: load.quests,
          exploration: explorationBase ?? createEmptyExplorationLoopState(),
          visited: load.progression_flags.visited_trigger_object_ids ?? [],
        });
        await refresh();
        return;
      }
      setDetailError(load.message);
    } finally {
      setDetailBusy(false);
    }
  };

  if (!enabled) {
    return (
      <section className="lh-screen" aria-label="Teacher dashboard disabled">
        <div className="lh-stack lh-screen__panel">
          <h2 className="lh-heading-lg">Teacher dashboard</h2>
          <p className="lh-subtitle">
            Disabled. Set <code className="lh-code-inline">VITE_LH_TEACHER_DASHBOARD=true</code> to enable.
          </p>
          <button type="button" className="lh-button lh-button--secondary" onClick={props.onBack}>
            Back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="lh-screen" aria-label="Teacher dashboard">
      <div className="lh-stack lh-screen__panel" style={{ maxWidth: 1200 }}>
        <div className="lh-stack lh-stack--horizontal" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="lh-heading-lg">Teacher dashboard</h2>
            <p className="lh-subtitle">Roster + progress summaries from Sheets via Apps Script Web App.</p>
          </div>
          <button type="button" className="lh-button lh-button--ghost" onClick={props.onBack} disabled={loading || detailBusy}>
            Back to game
          </button>
        </div>

        <div className="lh-stack lh-stack--horizontal" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label className="lh-field">
            <span className="lh-field__label">Teacher email (optional)</span>
            <input
              className="lh-input"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="teacher@school.org"
              disabled={loading}
            />
          </label>
          <label className="lh-field">
            <span className="lh-field__label">Section code (optional)</span>
            <input
              className="lh-input"
              value={sectionCode}
              onChange={(e) => setSectionCode(e.target.value)}
              placeholder="A1"
              disabled={loading}
            />
          </label>
          <button type="button" className="lh-button lh-button--secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error ? (
          <div className="lh-toast lh-toast--error" role="alert">
            <pre className="lh-toast__preformatted">{error}</pre>
          </div>
        ) : null}

        <div style={{ overflowX: 'auto' }}>
          <table className="lh-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">Needs</th>
                <th align="left">Name</th>
                <th align="left">Player ID</th>
                <th align="left">Section</th>
                <th align="left">Act</th>
                <th align="left">Quest</th>
                <th align="left">Next action</th>
                <th align="right">XP</th>
                <th align="right">Lv</th>
                <th align="left">Last save</th>
                <th align="left">Exit ticket</th>
              </tr>
            </thead>
            <tbody>
              {combined.map((row) => {
                const needsCount =
                  Number(row.needs.missingNext) + Number(row.needs.noExitTicket) + Number(row.needs.staleSave);
                const selected = row.player_id === selectedPlayerId;
                return (
                  <tr
                    key={row.player_id}
                    onClick={() => setSelectedPlayerId(row.player_id)}
                    style={{
                      cursor: 'pointer',
                      background: selected ? 'rgba(99,102,241,0.14)' : undefined,
                    }}
                    aria-selected={selected}
                  >
                    <td>{needsCount ? `⚠ ${needsCount}` : '—'}</td>
                    <td>{row.display_name || row.player_id}</td>
                    <td>
                      <code className="lh-code-inline">{row.player_id}</code>
                    </td>
                    <td>{row.section_code || '—'}</td>
                    <td>{row.current_act ?? '—'}</td>
                    <td>{row.active_main_quest_title || row.active_main_quest_id || '—'}</td>
                    <td style={{ maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.required_next_action || '—'}
                    </td>
                    <td align="right">{row.xp_total ?? 0}</td>
                    <td align="right">{row.level_cached ?? 1}</td>
                    <td>{row.last_manual_save_iso || '—'}</td>
                    <td>{row.exit_ticket_state || '—'}</td>
                  </tr>
                );
              })}
              {!combined.length ? (
                <tr>
                  <td colSpan={11} style={{ padding: 12 }}>
                    {roster.length
                      ? 'Roster loaded, but no renderable rows were produced (check summaries + merge).'
                      : 'No roster rows returned. Check `VITE_LH_SPREADSHEET_ID` and your Web App deployment access.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="lh-stack" style={{ marginTop: 20 }}>
          <CampfireGradingPanel
            reflections={reflections}
            loading={reflectionsLoading}
            error={reflectionsError}
            onGrade={gradeCampfireReflection}
            onRefresh={refreshReflections}
          />
        </div>

        <div className="lh-stack" style={{ marginTop: 14 }}>
          <h3 className="lh-heading-md">Selected student</h3>
          {!selectedPlayerId ? <p className="lh-subtitle">Click a student row above to load details + tools.</p> : null}
          {detailError ? (
            <div className="lh-toast lh-toast--error" role="alert">
              <pre className="lh-toast__preformatted">{detailError}</pre>
            </div>
          ) : null}
          {detail && selectedPlayerId ? (
            <TeacherToolsPanel
              rosterSectionLabel={detail.player.roster_email_hint ?? detail.player.player_id}
              player={detail.player}
              quests={detail.quests}
              exploration={detail.exploration}
              visitedTriggerIds={detail.visited}
              busy={detailBusy}
              onUnlockQuest={(questId) => runAndReloadSelected(() => teacherUnlockQuestRemote(selectedPlayerId, questId))}
              onRestoreBackup={() => runAndReloadSelected(() => teacherRestoreBackupRemote(selectedPlayerId))}
              onRestoreMentorVial={() => runAndReloadSelected(() => teacherRestoreItemRemote(selectedPlayerId, 'mentor_echo_vial', 1))}
              onMarkExitTicketSent={async () => {
                // dashboard uses existing backend exit_ticket_state field
                await runAndReloadSelected(async () => {
                  const res = await postLhWebAppJson({ action: 'mark_exit_ticket', player_id: selectedPlayerId, exit_ticket_state: 'sent' });
                  if (!res.ok) return { ok: false, message: res.message };
                  if (!res.payload.ok) return { ok: false, message: String(res.payload.message ?? res.payload.error ?? 'mark_exit_ticket failed') };
                  return { ok: true, message: String(res.payload.message ?? 'exit_ticket_state updated') };
                });
              }}
              onResetAct={(act) => runAndReloadSelected(() => teacherResetActRemote(selectedPlayerId, act))}
              onOverrideGt102={() => {
                // In the dashboard we don't run local-only GT-102 overrides; keep it read-only.
                setDetailError('GT-102 override is only available inside the student runtime for now.');
              }}
              onClearModuleDraft={() => {
                setDetailError('Clear module draft is not wired for the dashboard yet.');
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

