import type { ManualSaveEnvelopeV1 } from '../domain/lh-contract';

const PENDING_SAVE_KEY = 'lh_pending_save';

/**
 * Write the save envelope to localStorage before a POST attempt.
 * Safe to call even if localStorage is unavailable (catches QuotaExceededError).
 */
export function writePendingSave(envelope: ManualSaveEnvelopeV1): void {
  try {
    localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(envelope));
  } catch {
    // QuotaExceededError or private-browsing security error — never crash the game
  }
}

/**
 * Clear the pending save after a confirmed successful POST.
 */
export function clearPendingSave(): void {
  try {
    localStorage.removeItem(PENDING_SAVE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Read back a pending save if one exists.
 * Returns null if none found or if the stored data cannot be parsed.
 */
export function readPendingSave(): ManualSaveEnvelopeV1 | null {
  try {
    const raw = localStorage.getItem(PENDING_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || !('schema_version' in (parsed as object))) {
      clearPendingSave();
      return null;
    }
    return parsed as ManualSaveEnvelopeV1;
  } catch {
    clearPendingSave();
    return null;
  }
}

/**
 * Returns true if a pending save exists in localStorage.
 */
export function hasPendingSave(): boolean {
  try {
    return localStorage.getItem(PENDING_SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
