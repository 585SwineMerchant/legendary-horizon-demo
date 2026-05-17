import { publicAssetUrl } from './publicAssetUrl';

const SFX_BASE = publicAssetUrl('assets/sfx/');

export type LhSfxId =
  | 'portal_activation'
  | 'traveler_attack'
  | 'lost_echo_attack'
  | 'lost_echo_defeat'
  | 'ui_hover'
  | 'ui_select'
  | 'atlas_scroll_close'
  | 'aethelwood_hub_open'
  | 'aethelwood_hub_close'
  // Exploration combat — A-button traveler swings (alternated via `playLhSfxRandomOf`).
  | 'traveler_swing_1'
  | 'traveler_swing_2'
  // Exploration combat — roaming Lost Echo enemy swing.
  | 'lost_echo_swing'
  // Generic door SFX — currently used for Aethelwood Guild HQ entry/exit transitions.
  | 'door_open'
  | 'door_close';

const SFX_FILES: Record<LhSfxId, string> = {
  portal_activation: 'portal_activation.wav',
  traveler_attack: 'traveler_attack.wav',
  lost_echo_attack: 'lost_echo_attack.wav',
  lost_echo_defeat: 'lost_echo_defeat.wav',
  ui_hover: 'ui_hover.wav',
  ui_select: 'ui_select.wav',
  atlas_scroll_close: 'atlas_scroll_close.wav',
  aethelwood_hub_open: 'aethelwood_hub_open.wav',
  aethelwood_hub_close: 'aethelwood_hub_close.wav',
  // The source files were renamed from their original AI-generated names (e.g.
  // `sword_slash_and_clan_#1.mp3`) to plain, URL-safe names because `#` is the URL fragment
  // delimiter and trailing `-` is awkward. Drop the new file in `public/assets/sfx/` with the
  // exact name on the right, and the registry stays in sync.
  traveler_swing_1: 'traveler_swing_1.mp3',
  traveler_swing_2: 'traveler_swing_2.mp3',
  lost_echo_swing: 'lost_echo_swing.mp3',
  door_open: 'door_open.mp3',
  door_close: 'door_close.mp3',
};

const DEFAULT_VOLUMES: Record<LhSfxId, number> = {
  portal_activation: 0.68,
  traveler_attack: 0.66,
  lost_echo_attack: 0.62,
  lost_echo_defeat: 0.66,
  ui_hover: 0.24,
  ui_select: 0.34,
  atlas_scroll_close: 0.72,
  aethelwood_hub_open: 0.76,
  aethelwood_hub_close: 0.72,
  traveler_swing_1: 0.6,
  traveler_swing_2: 0.6,
  lost_echo_swing: 0.58,
  // Layered with the existing aethelwood_hub_open/close swoosh — keep doors slightly under so
  // they accent the transition rather than dominate it.
  door_open: 0.62,
  door_close: 0.6,
};

/**
 * Per-key Audio pool. We keep up to `POOL_MAX_PER_KEY` `HTMLAudioElement`s alive per SFX id
 * and recycle whichever one is not currently mid-playback. This gives us true reuse (no
 * re-fetch on every play, no GC churn) while still allowing concurrent overlap when the
 * player or multiple enemies trigger the same SFX in the same frame.
 */
const POOL_MAX_PER_KEY = 4;
const audioPool: Map<LhSfxId, HTMLAudioElement[]> = new Map();
const lastPlayedAt: Map<string, number> = new Map();
/** Ids whose underlying file failed to load (404 / decode error). One DEV warn per id, then silent. */
const erroredKeys: Set<LhSfxId> = new Set();

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function noteSfxLoadFailure(id: LhSfxId, reason: string): void {
  if (erroredKeys.has(id)) return;
  erroredKeys.add(id);
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('[LhSfx] failed to load — subsequent calls to this id will no-op silently', {
      id,
      file: SFX_FILES[id],
      reason,
    });
  }
}

function acquireAudio(id: LhSfxId): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (erroredKeys.has(id)) return null;
  let pool = audioPool.get(id);
  if (!pool) {
    pool = [];
    audioPool.set(id, pool);
  }
  for (const candidate of pool) {
    if (candidate.paused || candidate.ended) {
      try {
        candidate.currentTime = 0;
      } catch {
        // Some browsers throw on currentTime if the element is in an odd readyState; ignore.
      }
      return candidate;
    }
  }
  if (pool.length < POOL_MAX_PER_KEY) {
    const fresh = new Audio(`${SFX_BASE}${SFX_FILES[id]}`);
    fresh.preload = 'auto';
    // First-load failure for this id flips it to errored so future plays skip the pool entirely.
    fresh.addEventListener(
      'error',
      () => noteSfxLoadFailure(id, fresh.error ? `MediaError code=${fresh.error.code}` : 'unknown'),
      { once: true },
    );
    pool.push(fresh);
    return fresh;
  }
  // Pool fully busy under sustained spam — reuse the oldest entry by hard-resetting it.
  const recycled = pool[0];
  try {
    recycled.pause();
    recycled.currentTime = 0;
  } catch {
    // ignore
  }
  return recycled;
}

export type PlayLhSfxOptions = {
  /** Override the registered default volume (0–1). */
  volume?: number;
  /** Drop the call if the same `id` (or `groupKey`) played within this many ms. */
  minIntervalMs?: number;
  /**
   * Treat several ids as a single anti-stack group for the cooldown guard.
   * Useful for randomized variants like `traveler_swing_1` / `traveler_swing_2` where you
   * want the cooldown to apply across the whole group, not per id.
   */
  groupKey?: string;
};

/**
 * Play a one-shot LH sound effect. Backward-compatible with the original signature
 * `playLhSfx(id, volumeNumber)` — pass an options object for cooldown/group control.
 *
 * Failures (autoplay block, missing file, decode error) are swallowed so audio bugs never
 * crash gameplay or block the calling code path.
 */
export function playLhSfx(id: LhSfxId, optsOrVolume?: number | PlayLhSfxOptions): void {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.lhAudio === 'muted') return;

  const opts: PlayLhSfxOptions =
    typeof optsOrVolume === 'number'
      ? { volume: optsOrVolume }
      : (optsOrVolume ?? {});

  if (opts.minIntervalMs && opts.minIntervalMs > 0) {
    const guardKey = opts.groupKey ?? id;
    const last = lastPlayedAt.get(guardKey) ?? -Infinity;
    const t = nowMs();
    if (t - last < opts.minIntervalMs) return;
    lastPlayedAt.set(guardKey, t);
  } else if (opts.groupKey) {
    // Track group-key timing even without a cooldown so callers can reason about it later.
    lastPlayedAt.set(opts.groupKey, nowMs());
  }

  const audio = acquireAudio(id);
  if (!audio) return;
  const volume = opts.volume ?? DEFAULT_VOLUMES[id];
  audio.volume = Math.max(0, Math.min(1, volume));
  // play() rejects on autoplay-block, missing file, or decode error. We don't crash the caller
  // either way, but a true network/decode failure also flips the id to errored so we stop
  // hitting the network pointlessly on every subsequent call.
  void audio.play().catch((err: unknown) => {
    const name = err instanceof Error ? err.name : '';
    // NotAllowedError is the autoplay-policy block — it just means the user hasn't interacted
    // yet, not that the asset is broken. Don't taint the id.
    if (name && name !== 'NotAllowedError' && name !== 'AbortError') {
      noteSfxLoadFailure(id, name);
    }
  });
}

/**
 * Pick one id at random from `ids` and play it via `playLhSfx`. Honors all `PlayLhSfxOptions`
 * — the `groupKey` (or first id, if omitted) is used for the cooldown guard so alternating
 * variants share a single anti-stack window.
 */
export function playLhSfxRandomOf(ids: readonly LhSfxId[], opts?: PlayLhSfxOptions): void {
  if (ids.length === 0) return;
  const pick = ids[Math.floor(Math.random() * ids.length)];
  const merged: PlayLhSfxOptions = { ...(opts ?? {}) };
  if (!merged.groupKey) merged.groupKey = `random:${ids.join('|')}`;
  playLhSfx(pick, merged);
}

/** Traveler sword swing — same alternation/cooldown as exploration A-button combat. */
export function playLhTravelerSwingSfx(): void {
  playLhSfxRandomOf(['traveler_swing_1', 'traveler_swing_2'], {
    minIntervalMs: 90,
    groupKey: 'traveler_swing',
  });
}

/** Lost Echo melee swing — same clip as roaming hack-and-slash combat. */
export function playLhLostEchoSwingSfx(): void {
  playLhSfx('lost_echo_swing', { minIntervalMs: 30 });
}
