import { useEffect, useRef, useState } from 'react';

type Props = {
  onSkip: () => void;
  onComplete: () => void;
};

export function IntroCinematicScreen({ onSkip, onComplete }: Props) {
  const completedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="lh-screen lh-screen--intro-cinematic" aria-label="Legendary Horizon intro cinematic">
      <iframe
        title="Legendary Horizon intro"
        src="/assets/intro/intro_video_v2.html"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#0a0c10',
          opacity: visible ? 1 : 0,
          transition: 'opacity 900ms ease',
        }}
        allow="autoplay"
      />

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}>
        <button type="button" className="lh-button lh-button--secondary" onClick={onSkip}>
          Skip
        </button>
      </div>

      <IntroCinematicMessageBridge
        onFinished={() => {
          if (completedRef.current) return;
          completedRef.current = true;
          onComplete();
        }}
      />
    </section>
  );
}

function IntroCinematicMessageBridge({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const handler = (evt: MessageEvent) => {
      const data = evt.data as unknown;
      if (!data || typeof data !== 'object') return;
      const t = (data as { type?: unknown }).type;
      if (t === 'lh_intro_finished') onFinished();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onFinished]);
  return null;
}
