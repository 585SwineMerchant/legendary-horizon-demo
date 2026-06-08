import { useCallback, useEffect, useState } from 'react';

import {
  applyLhAccessibilityPrefsToDocument,
  loadLhAccessibilityPrefs,
  saveLhAccessibilityPrefs,
  type LhAccessibilityPrefsV1,
  type LhMotionPreference,
  type LhTextScale,
} from '../lib/lhAccessibilityPrefs';

export function useLhAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<LhAccessibilityPrefsV1>(() => {
    const loaded = loadLhAccessibilityPrefs();
    // Apply synchronously so data-lh-music is set on the DOM root BEFORE any React
    // effects run (including the music-lane effect in App.tsx).  Without this, if
    // music_muted=true was persisted from a previous session, the attribute would
    // only be set in the useEffect below — AFTER exploration audio had already
    // started and AFTER the battle music lane check runs, leaving battle music
    // silent until the user presses M.
    if (typeof document !== 'undefined') {
      applyLhAccessibilityPrefsToDocument(loaded);
    }
    return loaded;
  });

  useEffect(() => {
    // Re-apply on every subsequent pref change (e.g. M-key toggle, settings panel).
    applyLhAccessibilityPrefsToDocument(prefs);
    saveLhAccessibilityPrefs(prefs);
  }, [prefs]);

  const setTextScale = useCallback((text_scale: LhTextScale) => {
    setPrefs((p) => ({ ...p, text_scale }));
  }, []);

  const setMotion = useCallback((motion: LhMotionPreference) => {
    setPrefs((p) => ({ ...p, motion }));
  }, []);

  const setLowClutter = useCallback((low_clutter: boolean) => {
    setPrefs((p) => ({ ...p, low_clutter }));
  }, []);

  const setAudioMuted = useCallback((audio_muted: boolean) => {
    setPrefs((p) => ({ ...p, audio_muted }));
  }, []);

  const setMusicMuted = useCallback((music_muted: boolean) => {
    setPrefs((p) => ({ ...p, music_muted }));
  }, []);

  return {
    textScale: prefs.text_scale,
    motion: prefs.motion,
    lowClutter: prefs.low_clutter,
    audioMuted: prefs.audio_muted,
    musicMuted: prefs.music_muted,
    setTextScale,
    setMotion,
    setLowClutter,
    setAudioMuted,
    setMusicMuted,
  };
}
