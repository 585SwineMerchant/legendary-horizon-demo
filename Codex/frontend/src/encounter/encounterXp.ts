import type { EncounterLogEntryV1, ExplorationLoopState, PlayerSave } from '../domain/lh-contract';

import { LH_SESSION_ENCOUNTER_XP_CAP } from './encounterConstants';

export type EncounterXpAwardResult = {
  nextPlayer: PlayerSave;
  nextExploration: ExplorationLoopState;
  xpGranted: number;
  capped: boolean;
};

function syncLevelCached(xpTotal: number): number {
  return Math.max(1, Math.min(99, 1 + Math.floor(xpTotal / 750)));
}

/**
 * Awards encounter XP respecting the per-session cap stored on `exploration_loop.session_encounter_xp_awarded`.
 */
export function awardEncounterXp(args: {
  player: PlayerSave;
  exploration: ExplorationLoopState;
  requestedXp: number;
}): EncounterXpAwardResult {
  const prevSession = args.exploration.session_encounter_xp_awarded ?? 0;
  const room = Math.max(0, LH_SESSION_ENCOUNTER_XP_CAP - prevSession);
  const xpGranted = Math.min(Math.max(0, args.requestedXp), room);
  const capped = xpGranted < args.requestedXp;

  const nextXp = args.player.xp_total + xpGranted;
  const nextPlayer: PlayerSave = {
    ...args.player,
    xp_total: nextXp,
    level_cached: syncLevelCached(nextXp),
  };

  const nextExploration: ExplorationLoopState = {
    ...args.exploration,
    session_encounter_xp_awarded: prevSession + xpGranted,
  };

  return { nextPlayer, nextExploration, xpGranted, capped };
}

export function appendEncounterLog(
  exploration: ExplorationLoopState,
  entry: Omit<EncounterLogEntryV1, 'id'> & { id?: string },
): ExplorationLoopState {
  const id = entry.id ?? `enc_${Date.now().toString(36)}`;
  const row: EncounterLogEntryV1 = {
    id,
    kind: entry.kind,
    outcome: entry.outcome,
    xp_awarded: entry.xp_awarded,
    at_iso: entry.at_iso,
    interactable_id: entry.interactable_id,
    target_quest_id: entry.target_quest_id,
  };
  const prev = exploration.encounter_log ?? [];
  return { ...exploration, encounter_log: [...prev, row] };
}
