import type { PlayerSave, RosterStudentRecord } from '../domain/lh-contract';

export type ResolvedPlayerIdentityHint = {
  matched: boolean;
  reason?: string;
};

/**
 * Mirrors `RosterService` intent: correlate roster rows ↔ save rows conservatively during Day 2 scaffolding.
 *
 * Matching strategy precedence:
 * 1. Matching `student_email === roster_email_hint`.
 * 2. Fallback equality on `student_id` once authored on save rows later.
 */
export function resolveRosterToPlayerSave(roster: RosterStudentRecord, save: PlayerSave): ResolvedPlayerIdentityHint {
  if (save.roster_email_hint && roster.student_email.toLowerCase() === save.roster_email_hint.toLowerCase()) {
    return { matched: true };
  }
  if (
    roster.player_display_name &&
    save.display_name &&
    roster.player_display_name.trim().toLowerCase() === save.display_name.trim().toLowerCase()
  ) {
    return { matched: true, reason: 'name_heuristic_fixture' };
  }
  return { matched: false, reason: 'no_correlation_rule_hit' };
}
