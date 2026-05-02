import type { ExplorationLoopState } from '../domain/lh-contract';

export type { ComparisonLedgerEntry, ExplorationLoopState } from '../domain/lh-contract';

export function createEmptyExplorationLoopState(): ExplorationLoopState {
  return {
    fog_keys_cleared: [],
    waypoint_keys_visited: [],
    ledger_entries: [],
  };
}
