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
  const [prefs, setPrefs] = useState<LhAccessibilityPrefsV1>(() => loadLhAccessibilityPrefs());

  useEffect(() => {
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

  return {
    textScale: prefs.text_scale,
    motion: prefs.motion,
    lowClutter: prefs.low_clutter,
    audioMuted: prefs.audio_muted,
    setTextScale,
    setMotion,
    setLowClutter,
    setAudioMuted,
  };
}
