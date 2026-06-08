/**
 * Milestone 13 — persisted classroom / a11y preferences (localStorage only).
 */

export type LhTextScale = 'default' | 'large' | 'xlarge';

/** `system` follows OS; `reduce` forces reduced motion; `allow` keeps motion even when OS prefers reduce. */
export type LhMotionPreference = 'system' | 'reduce' | 'allow';

export type LhAccessibilityPrefsV1 = {
  schema_version: 1;
  text_scale: LhTextScale;
  motion: LhMotionPreference;
  low_clutter: boolean;
  /** When true, future in-game audio should not play until the learner opts in (no audio engine in Codex yet). */
  audio_muted: boolean;
  /**
   * Independent music-only mute. When true, background music lanes (title / exploration / battle) are silenced
   * but SFX still play. Resets to false on every page load (same classroom policy as `audio_muted`) so each
   * new session begins with music enabled — the player mutes within the session if they choose to.
   */
  music_muted: boolean;
};

const STORAGE_KEY = 'lh_accessibility_prefs_v1';

export const DEFAULT_LH_ACCESSIBILITY_PREFS: LhAccessibilityPrefsV1 = {
  schema_version: 1,
  text_scale: 'default',
  motion: 'system',
  low_clutter: false,
  audio_muted: false,
  music_muted: false,
};

function normalize(raw: unknown): LhAccessibilityPrefsV1 {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LH_ACCESSIBILITY_PREFS };
  const o = raw as Record<string, unknown>;
  const text = o.text_scale === 'large' || o.text_scale === 'xlarge' ? o.text_scale : 'default';
  const motion =
    o.motion === 'reduce' || o.motion === 'allow' || o.motion === 'system' ? o.motion : 'system';
  return {
    schema_version: 1,
    text_scale: text as LhTextScale,
    motion: motion as LhMotionPreference,
    low_clutter: Boolean(o.low_clutter),
    audio_muted: false,
    music_muted: false,   // always resets on load — each session starts with music enabled
  };
}

export function loadLhAccessibilityPrefs(): LhAccessibilityPrefsV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LH_ACCESSIBILITY_PREFS };
    return normalize(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_LH_ACCESSIBILITY_PREFS };
  }
}

export function saveLhAccessibilityPrefs(prefs: LhAccessibilityPrefsV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

/** Applies prefs to `<html>` data attributes consumed by `global.css`. */
export function applyLhAccessibilityPrefsToDocument(prefs: LhAccessibilityPrefsV1): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.lhTextScale = prefs.text_scale;

  if (prefs.motion === 'system') {
    delete root.dataset.lhMotion;
  } else {
    root.dataset.lhMotion = prefs.motion;
  }

  root.dataset.lhDensity = prefs.low_clutter ? 'compact' : 'comfortable';
  root.dataset.lhAudio = prefs.audio_muted ? 'muted' : 'on';
  root.dataset.lhMusic = prefs.music_muted ? 'muted' : 'on';
}
