import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveLhAssetUrl } from '../lib/lhMediaBase';

type Props = {
  /** Called when the cinematic finishes or is skipped — or immediately if no src is configured. */
  onComplete: () => void;
};

/**
 * Oracle cinematic iframe player, modelled on IntroCinematicScreen.
 *
 * When `VITE_LH_ORACLE_CINEMATIC_SRC` is unset the component calls `onComplete()`
 * immediately so the Oracle module can skip straight to the prophecy reveal without
 * needing a video asset at every deployment.
 *
 * The iframe communicates completion via `window.postMessage({ type: 'lh_oracle_finished' })`.
 */
export function OracleCinematicPlayer({ onComplete }: Props) {
  const completedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  const configuredSrc = import.meta.env.VITE_LH_ORACLE_CINEMATIC_SRC?.trim();

  const handleFinished = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // If no cinematic is configured, fire completion immediately.
  useEffect(() => {
    if (!configuredSrc) {
      handleFinished();
    }
  }, [configuredSrc, handleFinished]);

  useEffect(() => {
    if (!configuredSrc) return;
    const t = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(t);
  }, [configuredSrc]);

  useEffect(() => {
    if (!configuredSrc) return;
    const handler = (evt: MessageEvent) => {
      const data = evt.data as unknown;
      if (!data || typeof data !== 'object') return;
      const t = (data as { type?: unknown }).type;
      if (t !== 'lh_oracle_finished') return;
      handleFinished();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [configuredSrc, handleFinished]);

  if (!configuredSrc) return null;

  const iframeSrc = /^(https?:|data:|blob:)/i.test(configuredSrc)
    ? configuredSrc
    : resolveLhAssetUrl(configuredSrc);

  return (
    <section
      className="lh-screen lh-screen--oracle-cinematic"
      aria-label="Oracle of Fate cinematic"
      style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
    >
      <iframe
        title="Oracle of Fate cinematic"
        src={iframeSrc}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#0a0c10',
          opacity: visible ? 1 : 0,
          transition: 'opacity 920ms ease',
        }}
        allow="autoplay"
      />
      <button
        type="button"
        onClick={handleFinished}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          padding: '8px 20px',
          background: 'rgba(0,0,0,0.55)',
          color: '#d4a017',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Skip
      </button>
    </section>
  );
}
