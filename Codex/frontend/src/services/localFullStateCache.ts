import type { ManualSaveEnvelopeV1 } from '../domain/lh-contract';

const STORAGE_KEY = 'lh_codex_full_state_v1';

export type LocalFullStateRecordV1 = {
  player_id: string;
  envelope: ManualSaveEnvelopeV1;
  cached_at_iso: string;
};

export function cacheFullStateAfterSave(envelope: ManualSaveEnvelopeV1): void {
  try {
    const rec: LocalFullStateRecordV1 = {
      player_id: envelope.player_snapshot.player_id,
      envelope: JSON.parse(JSON.stringify(envelope)) as ManualSaveEnvelopeV1,
      cached_at_iso: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function tryLoadCachedFullState(playerId: string): ManualSaveEnvelopeV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalFullStateRecordV1;
    if (!parsed?.envelope || parsed.player_id !== playerId) return null;
    return parsed.envelope;
  } catch {
    return null;
  }
}
