import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveIntroCinematicIframeSrc } from '../lib/lhCutscenes';

type Props = {
  /** Intro finished or skipped — parent loads exploration (fresh start). */
  onIntroComplete: (skipped: boolean) => void | Promise<void>;
};

export function IntroCinematicScreen({ onIntroComplete }: Props) {
  const completedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const iframeSrc = resolveIntroCinematicIframeSrc(
    import.meta.env.VITE_LH_INTRO_CINEMATIC_SRC,
    import.meta.env.VITE_LH_INTRO_VIDEO_URL,
  );

  const handleIntroFinished = useCallback(
    (skipped: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;
      void onIntroComplete(skipped);
    },
    [onIntroComplete],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="lh-screen lh-screen--intro-cinematic" aria-label="Legendary Horizon intro cinematic">
      <iframe
        title="Legendary Horizon intro"
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

      <IntroCinematicMessageBridge onFinished={handleIntroFinished} />
    </section>
  );
}

function IntroCinematicMessageBridge({ onFinished }: { onFinished: (skipped: boolean) => void }) {
  useEffect(() => {
    const handler = (evt: MessageEvent) => {
      const data = evt.data as unknown;
      if (!data || typeof data !== 'object') return;
      const t = (data as { type?: unknown }).type;
      if (t !== 'lh_intro_finished') return;
      const payload = (data as { payload?: { skipped?: boolean } }).payload;
      onFinished(Boolean(payload?.skipped));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onFinished]);
  return null;
}
