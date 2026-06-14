import type {
  AcademicTaskKind,
  AcademicTaskStatus,
  ExplorationLoopState,
  GuildEndgameInterviewOutcomeV1,
  GuildEndgameV1,
  ManualSaveEnvelopeV1,
  PlayerSave,
  QuestDefinition,
  RealmReflectionV1,
  RitualDraftsV1,
  SessionSummaryV1,
} from '../domain/lh-contract';
import { coerceDemoGuidanceState } from '../demo/demoGuidance';
import { coerceLedgerRow } from '../exploration/comparisonLedger';
import { normalizeForetoldSignpostRealmIds } from '../exploration/foretoldSignposts';
import { createDefaultGuildEndgameV1 } from '../exploration/explorationTypes';
import type { RealmProgressMap } from '../realm/realmProgress';
import { CANON_REALMS } from '../realm/canonRealms';
import { computeGuildInterviewDeadlineIso } from '../exploration/guildInterviewDeadline';
import { loadQuestDefinitionsFromJson, reconcileQuestPrerequisites } from '../quests/questEngine';

import { cacheFullStateAfterSave } from './localFullStateCache';
import { postLhWebAppJson } from './lhWebAppClient';
import { clearPendingSave, writePendingSave } from '../lib/lhPendingSave';

const ACADEMIC_KINDS = new Set<string>([
  'quest_of_fate',
  'comparison_ledger',
  'quest_of_choice',
  'manifest',
  'great_transcription',
  'chronicle',
]);

const ACADEMIC_STATUSES = new Set<string>(['locked', 'available', 'in_progress', 'submitted', 'reviewed']);

export type PersistManualSaveOutcome = {
  ok: boolean;
  revision?: string;
  message: string;
  errors?: string[];
};

export function validatePlayerForManualSave(player: PlayerSave): string[] {
  const errors: string[] = [];

  const requireString = (key: keyof PlayerSave, label: string) => {
    const value = player[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${label} is required before saving.`);
    }
  };

  requireString('player_id', 'Player ID');
  requireString('display_name', 'Display name');
  requireString('active_main_quest_id', 'Active quest');
  requireString('current_realm_id', 'Current realm');
  requireString('required_next_action', 'Required next action');

  if (!Number.isFinite(player.current_act)) {
    errors.push('Current act must be a finite number.');
  }
  if (!Number.isFinite(player.xp_total) || player.xp_total < 0) {
    errors.push('XP total must be a non‑negative finite number.');
  }
  if (!Number.isFinite(player.level_cached) || player.level_cached < 1) {
    errors.push('Level must be ≥ 1 for manual saves.');
  }
  const inv = player.inventory_summary;
  if (!inv || !Array.isArray(inv.items) || typeof inv.coins !== 'number') {
    errors.push('Inventory summary must mirror the workbook-backed shape (coins + items[]).');
  }

  return errors;
}

export function buildSessionSummary(args: {
  player: PlayerSave;
  quests: QuestDefinition[];
  exploration: ExplorationLoopState;
}): SessionSummaryV1 {
  const open = args.quests.filter((q) => q.status === 'active' || q.status === 'available').length;
  return {
    player_id: args.player.player_id,
    active_main_quest_id: args.player.active_main_quest_id,
    current_realm_id: args.player.current_realm_id,
    xp_total: args.player.xp_total,
    quest_open_count: open,
    ledger_entry_count: args.exploration.ledger_entries.length,
    captured_at_iso: new Date().toISOString(),
  };
}

export function mergeRealmProgressMaps(base: RealmProgressMap, patch: RealmProgressMap | null | undefined): RealmProgressMap {
  if (!patch) return base;
  const out: RealmProgressMap = { ...base };
  for (const k of Object.keys(patch)) {
    const p = patch[k];
    const prev = base[k] ?? {};
    out[k] = { ...prev, ...p };
  }
  return out;
}

export function coerceExplorationLoop(raw: unknown): ExplorationLoopState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const fog = Array.isArray(o.fog_keys_cleared) ? o.fog_keys_cleared.map(String) : [];
  const wps = Array.isArray(o.waypoint_keys_visited) ? o.waypoint_keys_visited.map(String) : [];
  const ledRaw = Array.isArray(o.ledger_entries) ? o.ledger_entries : [];
  const ledger_entries = ledRaw
    .map((e) => coerceLedgerRow(e))
    .filter((e): e is NonNullable<ReturnType<typeof coerceLedgerRow>> => e !== null);
  const moduleDraftsRaw = o.module_drafts;
  let module_drafts: ExplorationLoopState['module_drafts'];
  if (moduleDraftsRaw && typeof moduleDraftsRaw === 'object' && !Array.isArray(moduleDraftsRaw)) {
    const out: NonNullable<ExplorationLoopState['module_drafts']> = {};
    for (const [moduleId, draft] of Object.entries(moduleDraftsRaw as Record<string, unknown>)) {
      if (!draft || typeof draft !== 'object' || Array.isArray(draft)) continue;
      out[moduleId] = Object.fromEntries(
        Object.entries(draft as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')]),
      );
    }
    module_drafts = out;
  }
  const academicRaw = o.academic_tasks;
  let academic_tasks: ExplorationLoopState['academic_tasks'];
  if (academicRaw && typeof academicRaw === 'object' && !Array.isArray(academicRaw)) {
    const acc: NonNullable<ExplorationLoopState['academic_tasks']> = {};
    for (const [k, v] of Object.entries(academicRaw as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const row = v as Record<string, unknown>;
      const kind = typeof row.kind === 'string' ? row.kind : '';
      const status = typeof row.status === 'string' ? row.status : 'locked';
      const payload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? Object.fromEntries(
            Object.entries(row.payload as Record<string, unknown>).map(([pk, pv]) => [pk, String(pv ?? '')]),
          )
        : {};
      acc[k] = {
        task_id: typeof row.task_id === 'string' ? row.task_id : k,
        kind: (ACADEMIC_KINDS.has(kind) ? kind : 'quest_of_fate') as AcademicTaskKind,
        status: (ACADEMIC_STATUSES.has(status) ? status : 'locked') as AcademicTaskStatus,
        payload,
        updated_iso: typeof row.updated_iso === 'string' ? row.updated_iso : new Date().toISOString(),
      };
    }
    academic_tasks = Object.keys(acc).length ? acc : {};
  }

  const base: ExplorationLoopState = {
    fog_keys_cleared: fog,
    waypoint_keys_visited: wps,
    ledger_entries,
  };
  const demoGuidance = coerceDemoGuidanceState(o.demo_guidance_v1);
  if (demoGuidance) {
    base.demo_guidance_v1 = demoGuidance;
  }
  if (academic_tasks && Object.keys(academic_tasks).length) {
    base.academic_tasks = academic_tasks;
  }
  if (module_drafts && Object.keys(module_drafts).length) {
    base.module_drafts = module_drafts;
  }
  const sx = o.session_encounter_xp_awarded;
  if (sx !== undefined && sx !== null && Number.isFinite(Number(sx)) && Number(sx) >= 0) {
    base.session_encounter_xp_awarded = Number(sx);
  }
  const encLog = o.encounter_log;
  if (Array.isArray(encLog)) {
    const rows: NonNullable<ExplorationLoopState['encounter_log']> = [];
    for (const row of encLog) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const kind = r.kind === 'combat_encounter' || r.kind === 'vocab_battle' ? r.kind : null;
      const outcome = r.outcome === 'win' || r.outcome === 'retreat' ? r.outcome : null;
      if (!kind || !outcome) continue;
      const interactable_id = typeof r.interactable_id === 'string' ? r.interactable_id : '';
      if (!interactable_id) continue;
      rows.push({
        id: typeof r.id === 'string' ? r.id : `enc_${rows.length}`,
        kind,
        outcome,
        xp_awarded: Number(r.xp_awarded) || 0,
        at_iso: typeof r.at_iso === 'string' ? r.at_iso : new Date().toISOString(),
        interactable_id,
        target_quest_id: typeof r.target_quest_id === 'string' ? r.target_quest_id : undefined,
      });
    }
    if (rows.length) base.encounter_log = rows;
  }

  const d = createDefaultGuildEndgameV1();
  const geRaw = o.guild_endgame_v1;
  if (geRaw && typeof geRaw === 'object' && !Array.isArray(geRaw)) {
    const g = geRaw as Record<string, unknown>;
    const tp = g.true_path_realm_id;
    const true_path_realm_id =
      tp === null || tp === undefined ? null : typeof tp === 'string' && tp.trim() ? tp.trim() : null;
    const deadline = g.interview_deadline_iso;
    const interview_deadline_iso =
      deadline === null || deadline === undefined ? null : typeof deadline === 'string' && deadline.trim() ? deadline.trim() : null;
    const lo = g.last_interview_outcome;
    const last_interview_outcome: GuildEndgameInterviewOutcomeV1 =
      lo === 'passed' || lo === 'failed' ? lo : 'none';
    let geNext: GuildEndgameV1 = {
      phase: typeof g.phase === 'string' && g.phase.trim() ? g.phase.trim() : d.phase,
      true_path_realm_id,
      application_unlocked: g.application_unlocked === true,
      application_sealed: g.application_sealed === true,
      interview_invited: g.interview_invited === true,
      interview_deadline_iso,
      last_interview_outcome,
    };
    if (geNext.phase === 'interview_invitation_expired') {
      geNext = {
        ...geNext,
        phase: 'interview_invited',
        interview_invited: true,
        interview_deadline_iso: geNext.interview_deadline_iso?.trim() || computeGuildInterviewDeadlineIso(),
      };
    }
    if (geNext.phase === 'interview_passed' && geNext.last_interview_outcome === 'passed') {
      geNext = { ...geNext, phase: 'guild_accepted_v1' };
    }
    base.guild_endgame_v1 = geNext;
  } else {
    base.guild_endgame_v1 = d;
  }

  const ghqRaw = o.guild_hq_atlas_revealed_realm_ids;
  if (Array.isArray(ghqRaw)) {
    const ids = ghqRaw
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((x) => x.trim());
    if (ids.length) {
      base.guild_hq_atlas_revealed_realm_ids = [...new Set(ids)];
    }
  }

  const fsRaw = o.foretold_signpost_realm_ids;
  if (Array.isArray(fsRaw)) {
    const allowed = new Set(CANON_REALMS.map((r) => r.realm_id));
    const ids = normalizeForetoldSignpostRealmIds(
      fsRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()),
      allowed,
    );
    if (ids.length) base.foretold_signpost_realm_ids = ids;
  }

  // scroll_reveal_performed — gates signpost visibility; must survive round-trip
  if (o.scroll_reveal_performed === true) base.scroll_reveal_performed = true;

  // oracle prophecy brand (Act II) — title/sigil/URL burned onto the Scroll
  const opId = o.oracle_prophecy_id;
  if (typeof opId === 'number' && Number.isFinite(opId) && opId > 0)
    base.oracle_prophecy_id = opId;
  if (typeof o.oracle_prophecy_realm_id === 'string' && o.oracle_prophecy_realm_id.trim())
    base.oracle_prophecy_realm_id = o.oracle_prophecy_realm_id.trim();
  if (typeof o.oracle_prophecy_title === 'string' && o.oracle_prophecy_title.trim())
    base.oracle_prophecy_title = o.oracle_prophecy_title.trim();
  if (typeof o.oracle_prophecy_career_url === 'string' && o.oracle_prophecy_career_url.trim())
    base.oracle_prophecy_career_url = o.oracle_prophecy_career_url.trim();

  // quest_of_fate drive sync fields
  if (typeof o.quest_of_fate_drive_file_id === 'string' && o.quest_of_fate_drive_file_id.trim())
    base.quest_of_fate_drive_file_id = o.quest_of_fate_drive_file_id.trim();
  if (typeof o.quest_of_fate_drive_url === 'string' && o.quest_of_fate_drive_url.trim())
    base.quest_of_fate_drive_url = o.quest_of_fate_drive_url.trim();
  const qofStatus = o.quest_of_fate_sync_status;
  if (qofStatus === 'pending' || qofStatus === 'sending' || qofStatus === 'synced' || qofStatus === 'error')
    base.quest_of_fate_sync_status = qofStatus;
  if (typeof o.quest_of_fate_last_synced_at_iso === 'string' && o.quest_of_fate_last_synced_at_iso.trim())
    base.quest_of_fate_last_synced_at_iso = o.quest_of_fate_last_synced_at_iso.trim();

  // resolve / safe-camp tracking
  const rc = o.resolve_current;
  if (typeof rc === 'number' && Number.isFinite(rc)) base.resolve_current = Math.max(0, rc);
  if (o.resolve_shaken === true) base.resolve_shaken = true;
  const cx = o.last_safe_camp_x;
  const cy = o.last_safe_camp_y;
  if (typeof cx === 'number' && Number.isFinite(cx)) base.last_safe_camp_x = cx;
  if (typeof cy === 'number' && Number.isFinite(cy)) base.last_safe_camp_y = cy;

  // realm_reflections — per-realm Comparison Ledger notes (6 optional string fields each)
  const REFLECTION_KEYS: ReadonlyArray<keyof RealmReflectionV1> = [
    'interest', 'skills', 'subjects', 'work_env', 'strength', 'concern',
  ];
  const rrRaw = o.realm_reflections;
  if (rrRaw && typeof rrRaw === 'object' && !Array.isArray(rrRaw)) {
    const out: Record<string, RealmReflectionV1> = {};
    for (const [realmId, raw] of Object.entries(rrRaw as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const r = raw as Record<string, unknown>;
      const entry: RealmReflectionV1 = {};
      for (const key of REFLECTION_KEYS) {
        const val = r[key];
        if (typeof val === 'string' && val.trim()) entry[key] = val;
      }
      out[realmId] = entry;
    }
    if (Object.keys(out).length) base.realm_reflections = out;
  }

  return base;
}

export function buildManualSaveEnvelope(args: {
  player: PlayerSave;
  questsSnapshot: QuestDefinition[];
  realmId: string;
  visitedTriggerInteractableIds: string[];
  exploration_loop?: ExplorationLoopState;
  realm_progress?: RealmProgressMap;
  session_summary?: SessionSummaryV1;
  ritual_drafts?: RitualDraftsV1;
  save_kind?: 'manual' | 'auto';
}): ManualSaveEnvelopeV1 {
  const envelope: ManualSaveEnvelopeV1 = {
    schema_version: 1,
    saved_at_iso: new Date().toISOString(),
    player_snapshot: JSON.parse(JSON.stringify(args.player)) as PlayerSave,
    quests_snapshot: JSON.parse(JSON.stringify(args.questsSnapshot)) as QuestDefinition[],
    realm_id: args.realmId,
    progression_flags: {
      visited_trigger_object_ids: [...args.visitedTriggerInteractableIds],
    },
  };
  if (args.exploration_loop) {
    envelope.exploration_loop = JSON.parse(JSON.stringify(args.exploration_loop)) as ExplorationLoopState;
  }
  if (args.realm_progress && Object.keys(args.realm_progress).length) {
    envelope.realm_progress = JSON.parse(JSON.stringify(args.realm_progress)) as RealmProgressMap;
  }
  if (args.session_summary) {
    envelope.session_summary = { ...args.session_summary };
  }
  if (args.ritual_drafts && Object.keys(args.ritual_drafts).length) {
    envelope.ritual_drafts = { ...args.ritual_drafts };
  }
  if (args.save_kind) {
    envelope.save_kind = args.save_kind;
  }
  return envelope;
}

/** Simulates `LhSave_manualSaveProgress` latency + logging when no Web App URL is configured. */
export async function simulateManualSavePersist(envelope: ManualSaveEnvelopeV1): Promise<PersistManualSaveOutcome> {
  await new Promise((r) => setTimeout(r, 320));

  console.info('[LhManualSave]', 'Simulated Sheets write payload:', envelope);

  const revisionToken = `${envelope.player_snapshot.player_id}:${Date.now().toString(36)}`;
  cacheFullStateAfterSave(envelope);

  return {
    ok: true,
    revision: revisionToken,
    message: 'Validated manual save assembled locally — ready for Apps Script `LhApplyManualSaveUpdate`.',
  };
}

/**
 * Persists a manual save: POST to Apps Script Web App when configured, otherwise the local simulator.
 */
export async function persistManualSaveEnvelope(envelope: ManualSaveEnvelopeV1): Promise<PersistManualSaveOutcome> {
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();

  if (forceSim) {
    return simulateManualSavePersist(envelope);
  }
  if (!url) {
    return {
      ok: false,
      message: 'Missing Apps Script Web App URL. Set VITE_LH_APPS_SCRIPT_WEBAPP_URL (or set VITE_LH_FORCE_SIMULATED_SAVE=true).',
    };
  }

  // Buffer the envelope before attempting the network call so a tab-close or
  // network drop mid-flight doesn't silently discard it.
  writePendingSave(envelope);

  const res = await postLhWebAppJson({
    action: 'manual_save',
    envelope,
  });

  if (!res.ok) {
    // Leave the pending save in place — startup will retry it.
    return {
      ok: false,
      message: res.message,
      errors: res.errors,
    };
  }

  const parsed = res.payload;
  if (!parsed.ok) {
    // Leave the pending save in place — startup will retry it.
    return {
      ok: false,
      message: (parsed.message as string) || 'Save rejected by server.',
      errors: (parsed.errors as string[] | undefined) ?? (parsed.error ? [String(parsed.error)] : undefined),
    };
  }

  cacheFullStateAfterSave(envelope);
  // POST confirmed successful — discard the pending save buffer.
  clearPendingSave();

  return {
    ok: true,
    revision: parsed.revision as string | undefined,
    message: (parsed.message as string) || 'Saved to Google Sheets via Apps Script.',
    errors: parsed.errors as string[] | undefined,
  };
}

export type LoadPlayerOutcome =
  | {
      ok: true;
      player: PlayerSave;
      quests: QuestDefinition[];
      exploration_loop: ExplorationLoopState | null;
      realm_progress: RealmProgressMap | null;
      progression_flags: { visited_trigger_object_ids: string[] };
    }
  | { ok: false; message: string; errors?: string[] };

function coerceInventorySummary(raw: unknown): PlayerSave['inventory_summary'] {
  let inv = raw;
  if (typeof inv === 'string') {
    try {
      inv = JSON.parse(inv) as unknown;
    } catch {
      inv = { coins: 0, items: [] };
    }
  }
  if (!inv || typeof inv !== 'object') {
    return { coins: 0, items: [] };
  }
  const o = inv as { coins?: unknown; items?: unknown; notes_for_teacher_preview?: unknown };
  return {
    coins: typeof o.coins === 'number' ? o.coins : Number(o.coins) || 0,
    items: Array.isArray(o.items) ? (o.items as PlayerSave['inventory_summary']['items']) : [],
    notes_for_teacher_preview:
      typeof o.notes_for_teacher_preview === 'string' ? o.notes_for_teacher_preview : undefined,
  };
}

function coercePlayerSave(raw: unknown): PlayerSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.player_id !== 'string' || !o.player_id.trim()) return null;

  return {
    player_id: o.player_id,
    display_name: typeof o.display_name === 'string' ? o.display_name : '',
    roster_email_hint: typeof o.roster_email_hint === 'string' ? o.roster_email_hint : undefined,
    email_hash: typeof o.email_hash === 'string' ? o.email_hash : undefined,
    current_act: Number(o.current_act) || 1,
    current_realm_id: typeof o.current_realm_id === 'string' ? o.current_realm_id : '',
    required_next_action: typeof o.required_next_action === 'string' ? o.required_next_action : '',
    active_main_quest_id: typeof o.active_main_quest_id === 'string' ? o.active_main_quest_id : '',
    active_main_quest_title: typeof o.active_main_quest_title === 'string' ? o.active_main_quest_title : '',
    last_completed_event_id: typeof o.last_completed_event_id === 'string' ? o.last_completed_event_id : '',
    last_completed_summary: typeof o.last_completed_summary === 'string' ? o.last_completed_summary : '',
    xp_total: Number(o.xp_total) || 0,
    level_cached: Number(o.level_cached) || 1,
    inventory_summary: coerceInventorySummary(
      o.inventory_summary !== undefined && o.inventory_summary !== null
        ? o.inventory_summary
        : o.inventory_summary_json,
    ),
    revision_token: typeof o.revision_token === 'string' ? o.revision_token : undefined,
    last_manual_save_iso: typeof o.last_manual_save_iso === 'string' ? o.last_manual_save_iso : undefined,
    last_campfire_score: typeof o.last_campfire_score === 'number' ? o.last_campfire_score : undefined,
    campfire_streak: typeof o.campfire_streak === 'number' ? o.campfire_streak : undefined,
    backup_checkpoint_json:
      typeof o.backup_checkpoint_json === 'string' ? o.backup_checkpoint_json : undefined,
    exit_ticket_state: typeof o.exit_ticket_state === 'string' ? o.exit_ticket_state : undefined,
  };
}

function coerceQuestDefinitions(raw: unknown): QuestDefinition[] {
  return reconcileQuestPrerequisites(loadQuestDefinitionsFromJson(raw));
}

function coerceProgressionFlags(raw: unknown): { visited_trigger_object_ids: string[] } {
  if (!raw || typeof raw !== 'object') return { visited_trigger_object_ids: [] };
  const o = raw as { visited_trigger_object_ids?: unknown };
  const ids = Array.isArray(o.visited_trigger_object_ids) ? o.visited_trigger_object_ids.map(String) : [];
  return { visited_trigger_object_ids: ids };
}

/**
 * Loads player + quest snapshot from `LhWebApp` `load_player` when Web App URL is set (not used in simulation mode).
 */
export async function loadPlayerStateFromRemote(playerId: string): Promise<LoadPlayerOutcome> {
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();

  if (forceSim) {
    return { ok: false, message: 'Remote load skipped (simulation forced).' };
  }
  if (!url) {
    return { ok: false, message: 'Remote load requires VITE_LH_APPS_SCRIPT_WEBAPP_URL.' };
  }

  const res = await postLhWebAppJson({
    action: 'load_player',
    player_id: playerId,
  });

  if (!res.ok) {
    return { ok: false, message: res.message, errors: res.errors };
  }

  const parsed = res.payload;
  if (!parsed.ok) {
    return {
      ok: false,
      message: (parsed.message as string) || 'Load rejected by server.',
      errors: (parsed.errors as string[] | undefined) ?? (parsed.error ? [String(parsed.error)] : undefined),
    };
  }

  const player = coercePlayerSave(parsed.player);
  if (!player) {
    return { ok: false, message: 'Server returned invalid player payload.' };
  }

  const quests = coerceQuestDefinitions(parsed.quests);
  const exploration_loop = coerceExplorationLoop(parsed.exploration_loop);
  const realmRaw = parsed.realm_progress;
  const realm_progress =
    realmRaw && typeof realmRaw === 'object' && !Array.isArray(realmRaw)
      ? (realmRaw as RealmProgressMap)
      : null;
  const progression_flags = coerceProgressionFlags(parsed.progression_flags);

  return { ok: true, player, quests, exploration_loop, realm_progress, progression_flags };
}

export async function appendSessionHistoryRemote(summary: SessionSummaryV1): Promise<{ ok: boolean; message?: string }> {
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  if (forceSim) {
    console.info('[LhSession]', 'Simulated session_end', summary);
    return { ok: true };
  }
  if (!url) {
    return { ok: false, message: 'session_end requires VITE_LH_APPS_SCRIPT_WEBAPP_URL.' };
  }
  const res = await postLhWebAppJson({
    action: 'session_end',
    player_id: summary.player_id,
    session_summary: summary,
  });
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  const payload = res.payload;
  if (!payload.ok) {
    return { ok: false, message: (payload.message as string) || 'session_end rejected' };
  }
  return { ok: true };
}

export async function markExitTicketRemote(playerId: string, state: string): Promise<{ ok: boolean; message?: string }> {
  const forceSim = import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true';
  const url = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL?.trim();
  if (forceSim) {
    console.info('[LhExitTicket]', 'Simulated mark_exit_ticket', playerId, state);
    return { ok: true };
  }
  if (!url) {
    return { ok: false, message: 'mark_exit_ticket requires VITE_LH_APPS_SCRIPT_WEBAPP_URL.' };
  }
  const res = await postLhWebAppJson({
    action: 'mark_exit_ticket',
    player_id: playerId,
    exit_ticket_state: state,
  });
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  const payload = res.payload;
  if (!payload.ok) {
    return { ok: false, message: (payload.message as string) || 'mark_exit_ticket rejected' };
  }
  return { ok: true };
}
