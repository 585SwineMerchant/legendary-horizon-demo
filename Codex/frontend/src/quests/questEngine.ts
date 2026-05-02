import type { QuestDefinition } from '../domain/lh-contract';

const TIERS = new Set<string>(['main', 'side', 'guild']);
const STATUSES = new Set<string>(['active', 'available', 'locked', 'completed', 'turned_in']);

export type QuestLogGroupKey = 'main' | 'side' | 'guild' | 'completed';

export function isTerminalQuestStatus(status: QuestDefinition['status']): boolean {
  return status === 'completed' || status === 'turned_in';
}

function sortQuestsForDisplay(a: QuestDefinition, b: QuestDefinition): number {
  if (a.act !== b.act) return a.act - b.act;
  return a.title.localeCompare(b.title);
}

/**
 * Normalizes one JSON / Sheets row into `QuestDefinition` (defaults for legacy rows).
 */
export function normalizeQuestRow(raw: unknown): QuestDefinition | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.quest_id !== 'string' || !o.quest_id.trim()) return null;

  const tierRaw = String(o.tier ?? 'side').toLowerCase();
  const tier = TIERS.has(tierRaw) ? (tierRaw as QuestDefinition['tier']) : 'side';

  const statusRaw = String(o.status ?? 'locked').toLowerCase();
  const status = STATUSES.has(statusRaw) ? (statusRaw as QuestDefinition['status']) : 'locked';

  const prereqRaw = o.prerequisite_quest_ids;
  const prerequisite_quest_ids = Array.isArray(prereqRaw)
    ? prereqRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];

  const realmRaw = o.realm_ids;
  const realm_ids = Array.isArray(realmRaw)
    ? realmRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];

  return {
    quest_id: o.quest_id.trim(),
    title: typeof o.title === 'string' ? o.title : 'Untitled quest',
    tier,
    act: Number.isFinite(Number(o.act)) ? Number(o.act) : 1,
    status,
    objective_short: typeof o.objective_short === 'string' ? o.objective_short : '',
    realm_ids,
    prerequisite_quest_ids: prerequisite_quest_ids.length ? prerequisite_quest_ids : undefined,
  };
}

export function loadQuestDefinitionsFromJson(raw: unknown): QuestDefinition[] {
  if (!Array.isArray(raw)) return [];
  const out: QuestDefinition[] = [];
  for (const row of raw) {
    const q = normalizeQuestRow(row);
    if (q) out.push(q);
  }
  return out;
}

/**
 * Unlocks `locked` quests whose `prerequisite_quest_ids` are all terminal. Does not change quests with no prerequisites (special / script unlocks only).
 */
export function reconcileQuestPrerequisites(quests: QuestDefinition[]): QuestDefinition[] {
  const byId = new Map(quests.map((q) => [q.quest_id, q]));
  return quests.map((q) => {
    if (q.status !== 'locked') return q;
    const prereqs = q.prerequisite_quest_ids;
    if (!prereqs?.length) return q;
    const met = prereqs.every((id) => {
      const p = byId.get(id);
      return p && isTerminalQuestStatus(p.status);
    });
    return met ? { ...q, status: 'available' as const } : q;
  });
}

/** Facilitator-facing terminal state after `completed` (Milestone 10). */
export function markQuestTurnedIn(quests: QuestDefinition[], questId: string): QuestDefinition[] {
  return quests.map((q) =>
    q.quest_id === questId && q.status === 'completed' ? { ...q, status: 'turned_in' as const } : q,
  );
}

/**
 * Groups for quest log: in-progress main / side / guild, then finished (`completed` + `turned_in`).
 */
export function groupQuestsForQuestLog(quests: QuestDefinition[]): Record<QuestLogGroupKey, QuestDefinition[]> {
  const main: QuestDefinition[] = [];
  const side: QuestDefinition[] = [];
  const guild: QuestDefinition[] = [];
  const completed: QuestDefinition[] = [];

  for (const q of quests) {
    if (isTerminalQuestStatus(q.status)) {
      completed.push(q);
      continue;
    }
    if (q.tier === 'guild') guild.push(q);
    else if (q.tier === 'side') side.push(q);
    else main.push(q);
  }

  main.sort(sortQuestsForDisplay);
  side.sort(sortQuestsForDisplay);
  guild.sort(sortQuestsForDisplay);
  completed.sort(sortQuestsForDisplay);

  return { main, side, guild, completed };
}
