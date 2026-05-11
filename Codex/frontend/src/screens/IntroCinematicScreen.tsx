import { useCallback, useEffect, useRef, useState } from 'react';

import { getLhAudioDirector } from '../lib/lhAudioDirector';

type Props = {
  onStart: () => void;
  onResume: () => void | Promise<void>;
};

const TITLE_MENU_FADE_MS = 1100;

export function IntroCinematicScreen({ onStart, onResume }: Props) {
  const completedRef = useRef(false);
  const introOutcomeRef = useRef<'natural_end' | 'skipped' | null>(null);
  const titleHandoffLoggedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const iframeSrc = import.meta.env.VITE_LH_INTRO_CINEMATIC_SRC?.trim() || '/assets/intro/intro_davinci.html';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const finalizeIntroAndOpenOverlay = useCallback((outcome: 'natural_end' | 'skipped') => {
    if (completedRef.current) return;
    completedRef.current = true;
    introOutcomeRef.current = outcome;
    setMenuOpen(true);
  }, []);

  const onIframeIntroFinished = useCallback(
    (skipped: boolean) => finalizeIntroAndOpenOverlay(skipped ? 'skipped' : 'natural_end'),
    [finalizeIntroAndOpenOverlay],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    setMenuReady(false);
    const dir = getLhAudioDirector();
    dir.setLane('title');

    const t = window.setTimeout(() => setMenuReady(true), 1200);
    const logOnce = () => {
      if (titleHandoffLoggedRef.current) return;
      titleHandoffLoggedRef.current = true;
      if (!import.meta.env.DEV) return;
      const snap = dir.snapshot();
      const outcome = introOutcomeRef.current ?? 'natural_end';
      const introLine = outcome === 'skipped' ? 'skipped' : 'ended naturally';
      // Single DEV handoff line: outcome, overlay, title lane, exploration off.
      // eslint-disable-next-line no-console
      console.info(
        `[LH intro→title] intro ${introLine}; title overlay opened; title music lane started (${snap.musicLane}); exploration lane remained off (${snap.musicLane !== 'exploration'})`,
      );
    };
    window.requestAnimationFrame(() => window.requestAnimationFrame(logOnce));
    return () => window.clearTimeout(t);
  }, [menuOpen]);

  return (
    <section className="lh-screen lh-screen--intro-cinematic" aria-label="Legendary Horizon intro cinematic">
      <iframe
        title="Legendary Horizon intro"
        ref={iframeRef}
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

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}>
        {!menuOpen ? (
          <button
            type="button"
            className="lh-button lh-button--secondary"
            onClick={() => {
              // Best-effort: ask the iframe to stop audio and finalize.
              try {
                iframeRef.current?.contentWindow?.postMessage({ type: 'lh_intro_skip' }, '*');
              } catch {
                // ignore
              }
              finalizeIntroAndOpenOverlay('skipped');
            }}
          >
            Skip
          </button>
        ) : null}
      </div>

      <IntroCinematicMessageBridge onFinished={onIframeIntroFinished} />

      {menuOpen ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'auto',
          }}
          role="dialog"
          aria-label="Legendary Horizon title menu"
        >
          {/* Same full-viewport framing as intro video (object-fit: cover) — iframe last frame shows underneath until this paints */}
          <img
            src="/assets/ui/lh_title_logo.png"
            alt="Legendary Horizon"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.45))',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(180deg, rgba(8,10,14,0.12) 0%, rgba(8,10,14,0.35) 55%, rgba(8,10,14,0.72) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'max(5vh, 40px)',
              display: 'flex',
              justifyContent: 'center',
              gap: 14,
              flexWrap: 'wrap',
              padding: '0 1.25rem',
              opacity: menuReady ? 1 : 0,
              transform: menuReady ? 'translateY(0)' : 'translateY(14px)',
              transition: `opacity ${TITLE_MENU_FADE_MS}ms ease, transform ${TITLE_MENU_FADE_MS}ms ease`,
            }}
          >
            <button type="button" className="lh-button lh-button--primary" onClick={onStart}>
              Start game
            </button>
            <button type="button" className="lh-button lh-button--secondary" onClick={() => void onResume()}>
              Load game
            </button>
          </div>
        </div>
      ) : null}
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
