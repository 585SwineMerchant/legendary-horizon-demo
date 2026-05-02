import type { LhBackupCheckpointV1 } from '../domain/lh-contract';

/** Parses `PlayerSave.backup_checkpoint_json` into a typed checkpoint when valid. */
export function parseLhBackupCheckpointJson(raw: string | undefined | null): LhBackupCheckpointV1 | null {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || o.schema_version !== 1) return null;
    if (!o.player_snapshot || typeof o.player_snapshot !== 'object') return null;
    if (!Array.isArray(o.quests_snapshot)) return null;
    return o as unknown as LhBackupCheckpointV1;
  } catch {
    return null;
  }
}
