/**
 * Resolve System — the Traveler's in-session hit-point equivalent.
 *
 * In-world language: "Resolve" (not HP / health / life). Losing all Resolve
 * triggers "Overwhelmed" state (never "death"). The Traveler retreats to their
 * last safe camp position.
 *
 * Shaken status: when Resolve drops below 25% (5/20), sprint speed is reduced
 * by 10%. Clears when Resolve is restored above the threshold.
 */

import type { PlayerSave } from '../domain/lh-contract';
import type { ExplorationLoopState } from '../domain/lh-contract';

// ─── Constants ─────────────────────────────────────────────────────────────

export const RESOLVE_MAX_DEFAULT = 20;
export const RESOLVE_SHAKEN_THRESHOLD = 5; // 25% of 20
export const RESOLVE_SHAKEN_SPRINT_PENALTY = 0.10; // -10% sprint speed

/** Damage ranges for different encounter types. */
export const RESOLVE_DAMAGE_TABLES = {
  /** Standard Lost Echo encounter — minor damage on retreat. */
  combat_retreat: { min: 2, max: 4 },
  /** Vocab battle retreat — lower stakes. */
  vocab_retreat: { min: 1, max: 3 },
  /** Major encounter (Milestone 17 boss-tier). */
  major_retreat: { min: 4, max: 8 },
  /** Overwhelmed forced retreat — additional penalty. */
  overwhelmed: { min: 0, max: 0 },
} as const;

export type ResolveDamageKind = keyof typeof RESOLVE_DAMAGE_TABLES;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns the current Resolve from a player save, defaulting to max. */
export function getPlayerResolve(player: PlayerSave): number {
  if (typeof player.resolve_current === 'number' && player.resolve_current >= 0) {
    return player.resolve_current;
  }
  return getPlayerResolveMax(player);
}

/** Returns the max Resolve from player save (default 20). */
export function getPlayerResolveMax(player: PlayerSave): number {
  return typeof player.resolve_max === 'number' && player.resolve_max > 0
    ? player.resolve_max
    : RESOLVE_MAX_DEFAULT;
}

/** True when Resolve is at 0 — Traveler is Overwhelmed and must retreat. */
export function isOverwhelmed(player: PlayerSave): boolean {
  return getPlayerResolve(player) <= 0;
}

/** True when Resolve is below Shaken threshold. */
export function isShaken(player: PlayerSave): boolean {
  return getPlayerResolve(player) < RESOLVE_SHAKEN_THRESHOLD;
}

/**
 * Rolls damage for the given encounter kind.
 * Uses a deterministic-ish value based on player_id length to avoid Math.random
 * while keeping tests predictable. Caller may pass a seed for testing.
 */
export function rollResolveDamage(kind: ResolveDamageKind, seed?: number): number {
  const table = RESOLVE_DAMAGE_TABLES[kind];
  const range = table.max - table.min;
  if (range === 0) return table.min;
  const raw = seed !== undefined ? seed : Math.random();
  return table.min + Math.floor(raw * (range + 1));
}

// ─── State Mutations ────────────────────────────────────────────────────────

/** Applies Resolve damage to a player, returning the updated PlayerSave. */
export function applyResolveDamage(
  player: PlayerSave,
  damage: number,
): PlayerSave {
  const current = getPlayerResolve(player);
  const next = Math.max(0, current - damage);
  const shaken = next < RESOLVE_SHAKEN_THRESHOLD;
  return {
    ...player,
    resolve_current: next,
    resolve_max: getPlayerResolveMax(player),
    resolve_shaken: shaken,
  };
}

/** Restores Resolve to max (e.g. after campfire save). Also clears Shaken. */
export function restoreResolveToFull(player: PlayerSave): PlayerSave {
  const max = getPlayerResolveMax(player);
  return {
    ...player,
    resolve_current: max,
    resolve_max: max,
    resolve_shaken: false,
  };
}

/** Restores a partial amount of Resolve (e.g. from a consumable). */
export function restoreResolveByAmount(player: PlayerSave, amount: number): PlayerSave {
  const max = getPlayerResolveMax(player);
  const current = getPlayerResolve(player);
  const next = Math.min(max, current + amount);
  return {
    ...player,
    resolve_current: next,
    resolve_shaken: next < RESOLVE_SHAKEN_THRESHOLD,
  };
}

/** Returns the sprint speed multiplier given Shaken status. */
export function getSprintMultiplierFromResolve(player: PlayerSave): number {
  return isShaken(player) ? 1.0 - RESOLVE_SHAKEN_SPRINT_PENALTY : 1.0;
}

// ─── Exploration State Sync ─────────────────────────────────────────────────

/** Syncs Resolve from PlayerSave into ExplorationLoopState (call on session start). */
export function syncResolveFromPlayer(
  exploration: ExplorationLoopState,
  player: PlayerSave,
): ExplorationLoopState {
  return {
    ...exploration,
    resolve_current: getPlayerResolve(player),
    resolve_shaken: isShaken(player),
  };
}

/** Syncs Resolve from ExplorationLoopState back to PlayerSave (call on save). */
export function syncResolveToPlayer(
  player: PlayerSave,
  exploration: ExplorationLoopState,
): PlayerSave {
  if (exploration.resolve_current === undefined) return player;
  const shaken = (exploration.resolve_current ?? getPlayerResolveMax(player)) < RESOLVE_SHAKEN_THRESHOLD;
  return {
    ...player,
    resolve_current: exploration.resolve_current,
    resolve_shaken: shaken,
  };
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

/** Returns the fill percentage (0–100) for the Resolve bar. */
export function resolveBarPercent(player: PlayerSave): number {
  const current = getPlayerResolve(player);
  const max = getPlayerResolveMax(player);
  return max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
}

/** Returns the bar color based on current Resolve. */
export function resolveBarColor(player: PlayerSave): string {
  const pct = resolveBarPercent(player);
  if (pct > 50) return '#22c55e'; // green — healthy
  if (pct > 25) return '#f59e0b'; // amber — cautious
  return '#ef4444';               // red — critical / Shaken
}

/** Returns player-facing status text for HUD. */
export function resolveStatusLabel(player: PlayerSave): string {
  if (isOverwhelmed(player)) return 'Overwhelmed';
  if (isShaken(player)) return 'Shaken';
  return '';
}
