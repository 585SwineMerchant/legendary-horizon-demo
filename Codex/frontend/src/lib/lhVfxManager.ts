/**
 * VFX Manager — lightweight event bridge for Phaser VFX effects.
 *
 * Pattern: React/game-logic code dispatches typed CustomEvents on `window`.
 * The Phaser scene listens and renders the corresponding effect.
 *
 * Effects:
 *  - hit_spark   : Brief flash + particle burst on encounter hit (world-space x/y)
 *  - rune_burst  : Magical ring expansion on knowledge battle special move
 *  - dust_puff   : Small brown puff on dirt/stone surface movement
 *  - grass_rustle: Tuned version of existing grass rustle (larger for special triggers)
 */

export type LhVfxKind =
  | 'hit_spark'
  | 'rune_burst'
  | 'dust_puff'
  | 'grass_rustle';

export type LhVfxPayload = {
  kind: LhVfxKind;
  /** World-space X coordinate (Phaser tile world units). Optional — Phaser uses player position if absent. */
  worldX?: number;
  /** World-space Y coordinate. */
  worldY?: number;
  /** Intensity 0.0–1.0 (used for scaling, particle count). Default 1.0. */
  intensity?: number;
  /** VFX color override (CSS hex or rgba string). */
  color?: string;
};

/** Custom event name dispatched on window. */
export const LH_WINDOW_VFX_EVENT = 'lh:vfx' as const;

/**
 * Dispatches a VFX event to the Phaser scene.
 * Safe to call outside of Phaser (no-op if Phaser is not running).
 */
export function dispatchVfx(payload: LhVfxPayload): void {
  window.dispatchEvent(
    new CustomEvent<LhVfxPayload>(LH_WINDOW_VFX_EVENT, {
      detail: payload,
      bubbles: false,
      cancelable: false,
    }),
  );
}

// ─── Convenience dispatchers ──────────────────────────────────────────────

/** Dispatch a hit spark at a world position (encounter damage flash). */
export function dispatchHitSpark(worldX: number, worldY: number, intensity = 1.0): void {
  dispatchVfx({ kind: 'hit_spark', worldX, worldY, intensity });
}

/** Dispatch a rune burst at a world position (knowledge battle special). */
export function dispatchRuneBurst(worldX: number, worldY: number, intensity = 1.0): void {
  dispatchVfx({ kind: 'rune_burst', worldX, worldY, intensity });
}

/** Dispatch a dust puff at a world position (dirt/stone surface step). */
export function dispatchDustPuff(worldX: number, worldY: number): void {
  dispatchVfx({ kind: 'dust_puff', worldX, worldY, intensity: 0.6 });
}

/** Dispatch an enhanced grass rustle (triggered on special movement events). */
export function dispatchGrassRustle(worldX: number, worldY: number, intensity = 1.2): void {
  dispatchVfx({ kind: 'grass_rustle', worldX, worldY, intensity });
}

// ─── Phaser-side helpers ──────────────────────────────────────────────────

/**
 * Adds a window listener for VFX events inside a Phaser scene.
 * Returns an unsubscribe function — call in `scene.shutdown()`.
 *
 * @example
 *   // In Phaser scene create():
 *   this._vfxUnsub = subscribeToPhaserVfx((evt) => this.handleVfxEvent(evt));
 *
 *   // In scene shutdown():
 *   this._vfxUnsub();
 */
export function subscribeToPhaserVfx(
  handler: (payload: LhVfxPayload) => void,
): () => void {
  const listener = (e: Event) => {
    const payload = (e as CustomEvent<LhVfxPayload>).detail;
    if (payload?.kind) handler(payload);
  };
  window.addEventListener(LH_WINDOW_VFX_EVENT, listener);
  return () => window.removeEventListener(LH_WINDOW_VFX_EVENT, listener);
}

// ─── VFX color constants ──────────────────────────────────────────────────

/** Hit Spark: warm orange-red burst. */
export const VFX_COLOR_HIT_SPARK = 0xff6b35;
/** Rune Burst: cool blue-violet. */
export const VFX_COLOR_RUNE_BURST = 0x8b5cf6;
/** Dust Puff: warm tan/brown. */
export const VFX_COLOR_DUST_PUFF = 0xb8966c;
/** Grass Rustle: bright green. */
export const VFX_COLOR_GRASS_RUSTLE = 0x4ade80;
