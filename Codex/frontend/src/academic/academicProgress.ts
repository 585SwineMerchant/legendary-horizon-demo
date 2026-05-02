import type {
  AcademicTaskProgress,
  AcademicWorksheetTaskDef,
  ExplorationLoopState,
} from '../domain/lh-contract';

export const COMPARISON_LEDGER_TASK_ID = 'ws_comparison_ledger';

function isoNow() {
  return new Date().toISOString();
}

function isTerminalAcademic(s: AcademicTaskProgress['status']): boolean {
  return s === 'submitted' || s === 'reviewed';
}

export function seedAcademicTasksFromDefinitions(defs: AcademicWorksheetTaskDef[]): Record<string, AcademicTaskProgress> {
  const now = isoNow();
  const out: Record<string, AcademicTaskProgress> = {};
  for (const d of defs) {
    const locked = Boolean(d.unlock_after_task_ids?.length);
    out[d.task_id] = {
      task_id: d.task_id,
      kind: d.kind,
      status: locked ? 'locked' : 'available',
      payload: {},
      updated_iso: now,
    };
  }
  return reconcileAcademicAvailability(defs, out);
}

export function reconcileAcademicAvailability(
  defs: AcademicWorksheetTaskDef[],
  tasks: Record<string, AcademicTaskProgress>,
): Record<string, AcademicTaskProgress> {
  const byId: Record<string, AcademicTaskProgress> = { ...tasks };
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of defs) {
      const t = byId[d.task_id];
      if (!t || t.status !== 'locked') continue;
      const prereq = d.unlock_after_task_ids ?? [];
      if (!prereq.length) continue;
      const ok = prereq.every((pid) => {
        const p = byId[pid];
        return p && isTerminalAcademic(p.status);
      });
      if (ok) {
        byId[d.task_id] = { ...t, status: 'available', updated_iso: isoNow() };
        changed = true;
      }
    }
  }
  return byId;
}

/** When at least one comparison ledger row exists, mark the ledger worksheet submitted (Milestone 11). */
export function syncComparisonLedgerAcademicTask(
  defs: AcademicWorksheetTaskDef[],
  exploration: ExplorationLoopState,
): ExplorationLoopState {
  if (!defs.some((d) => d.task_id === COMPARISON_LEDGER_TASK_ID)) return exploration;
  if (!exploration.ledger_entries.length) return exploration;
  const base = { ...(exploration.academic_tasks ?? {}) };
  const cur = base[COMPARISON_LEDGER_TASK_ID];
  if (cur && isTerminalAcademic(cur.status)) {
    return { ...exploration, academic_tasks: reconcileAcademicAvailability(defs, base) };
  }
  const now = isoNow();
  base[COMPARISON_LEDGER_TASK_ID] = {
    task_id: COMPARISON_LEDGER_TASK_ID,
    kind: 'comparison_ledger',
    status: 'submitted',
    payload: {
      ...(cur?.payload ?? {}),
      ledger_row_count: String(exploration.ledger_entries.length),
      last_ledger_realm_id: exploration.ledger_entries[exploration.ledger_entries.length - 1]?.realm_id ?? '',
    },
    updated_iso: now,
  };
  return { ...exploration, academic_tasks: reconcileAcademicAvailability(defs, base) };
}

export function ensureAcademicTasksSeeded(
  defs: AcademicWorksheetTaskDef[],
  exploration: ExplorationLoopState,
): ExplorationLoopState {
  if (!defs.length) return exploration;
  const hasKeys = exploration.academic_tasks && Object.keys(exploration.academic_tasks).length > 0;
  let next: ExplorationLoopState = hasKeys
    ? exploration
    : { ...exploration, academic_tasks: seedAcademicTasksFromDefinitions(defs) };
  next = syncComparisonLedgerAcademicTask(defs, next);
  next = {
    ...next,
    academic_tasks: reconcileAcademicAvailability(defs, next.academic_tasks ?? {}),
  };
  return next;
}

export function markAcademicTaskInProgress(
  defs: AcademicWorksheetTaskDef[],
  tasks: Record<string, AcademicTaskProgress>,
  taskId: string,
): Record<string, AcademicTaskProgress> {
  const t = tasks[taskId];
  if (!t || t.status !== 'available') return tasks;
  return reconcileAcademicAvailability(defs, {
    ...tasks,
    [taskId]: { ...t, status: 'in_progress', updated_iso: isoNow() },
  });
}

export function submitAcademicTaskWithFields(
  defs: AcademicWorksheetTaskDef[],
  tasks: Record<string, AcademicTaskProgress>,
  taskId: string,
  payload: Record<string, string>,
): { ok: true; tasks: Record<string, AcademicTaskProgress> } | { ok: false; errors: string[] } {
  const def = defs.find((d) => d.task_id === taskId);
  const t = tasks[taskId];
  if (!def || !t) return { ok: false, errors: ['unknown_task'] };
  if (t.status === 'locked') return { ok: false, errors: ['task_locked'] };
  if (def.kind === 'comparison_ledger' && def.fields.length === 0) {
    return { ok: false, errors: ['use_world_map_ledger'] };
  }
  const errors: string[] = [];
  for (const f of def.fields) {
    const v = (payload[f.key] ?? '').trim();
    if (!v) errors.push(`missing_${f.key}`);
  }
  if (errors.length) return { ok: false, errors };
  const next: Record<string, AcademicTaskProgress> = {
    ...tasks,
    [taskId]: {
      ...t,
      kind: def.kind,
      payload: { ...t.payload, ...payload },
      status: 'submitted',
      updated_iso: isoNow(),
    },
  };
  return { ok: true, tasks: reconcileAcademicAvailability(defs, next) };
}
