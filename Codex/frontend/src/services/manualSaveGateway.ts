import type {
  ExplorationLoopState,
  ManualSaveEnvelopeV1,
  PlayerSave,
  QuestDefinition,
  RitualDraftsV1,
  SessionSummaryV1,
} from '../domain/lh-contract';
import type { RealmProgressMap } from '../realm/realmProgress';
import { loadQuestDefinitionsFromJson, reconcileQuestPrerequisites } from '../quests/questEngine';

import { cacheFullStateAfterSave } from './localFullStateCache';
import { postLhWebAppJson } from './lhWebAppClient';

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
  const led = Array.isArray(o.ledger_entries) ? (o.ledger_entries as ExplorationLoopState['ledger_entries']) : [];
  return {
    fog_keys_cleared: fog,
    waypoint_keys_visited: wps,
    ledger_entries: led.filter(
      (e) =>
        e &&
        typeof e === 'object' &&
        typeof (e as { id?: unknown }).id === 'string' &&
        typeof (e as { realm_id?: unknown }).realm_id === 'string',
    ),
  };
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

  if (!url || forceSim) {
    return simulateManualSavePersist(envelope);
  }

  const res = await postLhWebAppJson({
    action: 'manual_save',
    envelope,
  });

  if (!res.ok) {
    return {
      ok: false,
      message: res.message,
      errors: res.errors,
    };
  }

  const parsed = res.payload;
  if (!parsed.ok) {
    return {
      ok: false,
      message: (parsed.message as string) || 'Save rejected by server.',
      errors: (parsed.errors as string[] | undefined) ?? (parsed.error ? [String(parsed.error)] : undefined),
    };
  }

  cacheFullStateAfterSave(envelope);

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

  if (!url || forceSim) {
    return { ok: false, message: 'Remote load skipped (no Web App URL or simulation forced).' };
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
  if (!url || forceSim) {
    console.info('[LhSession]', 'Simulated session_end', summary);
    return { ok: true };
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
  if (!url || forceSim) {
    console.info('[LhExitTicket]', 'Simulated mark_exit_ticket', playerId, state);
    return { ok: true };
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
