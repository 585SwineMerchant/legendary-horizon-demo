import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Oracle cinematic video player.
 *
 * VIDEO ASSET
 *   Local dev:  public/assets/video/oracle_cutscene_v1.mp4  (served at /assets/video/…)
 *   Prod CDN:   Set VITE_LH_ORACLE_VIDEO_URL to the hosted MP4 URL before building.
 *               e.g. https://cdn.example.com/oracle_cutscene_v1.mp4
 *
 * SKIP LOGIC
 *   allowSkip=false (default) → first viewing, no skip button shown.
 *   allowSkip=true  → subsequent viewing (oracle already completed), skip button shown.
 *   Either way, when the video ends naturally onComplete() fires automatically.
 *
 * AUDIO
 *   Reads document.documentElement.dataset.lhAudio on mount — if 'muted', video starts
 *   muted. The in-player mute toggle stays in sync; toggling it does NOT change the
 *   global game-audio flag (it only controls this video element).
 */

// Resolved video URL: env-var override → local public path.
const ORACLE_VIDEO_SRC: string = (() => {
  const override = (import.meta.env.VITE_LH_ORACLE_VIDEO_URL as string | undefined)?.trim();
  return override || '/assets/video/oracle_cutscene_v1.mp4';
})();

type Props = {
  /** Called when the video ends naturally, or when the player skips (if skip is allowed). */
  onComplete: () => void;
  /**
   * When true, a "Skip" button is shown in the corner.
   * Set to true only on re-views (oracle prophecy already delivered in a prior session).
   * Default: false — first-time viewers cannot skip.
   */
  allowSkip?: boolean;
};

export function OracleCinematicPlayer({ onComplete, allowSkip = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.dataset.lhAudio === 'muted';
  });

  // ── single-fire completion guard ───────────────────────────────────────────
  const handleFinished = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // ── fade in once mounted ───────────────────────────────────────────────────
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  // ── autoplay as soon as the element is ready ───────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    // Apply mute state before play so autoplay policies are satisfied
    vid.muted = muted;
    void vid.play().catch(() => {
      // Autoplay blocked — play will start on first user interaction via the video element itself
    });
  }, [muted]);

  // ── sync mute state to the video element when the toggle changes ───────────
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  // ── also watch the global lhAudio flag so pausing game music mid-cutscene ──
  // propagates to the video automatically
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      const nowMuted = document.documentElement.dataset.lhAudio === 'muted';
      setMuted(nowMuted);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-lh-audio'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="lh-screen lh-screen--oracle-cinematic"
      aria-label="Oracle of Fate cinematic"
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000' }}
    >
      <video
        ref={videoRef}
        src={ORACLE_VIDEO_SRC}
        playsInline
        preload="auto"
        muted={muted}
        onEnded={handleFinished}
        onError={() => {
          // If the video fails to load (missing asset, network error), skip through
          // so the oracle flow never gets permanently blocked.
          if (import.meta.env.DEV) {
            console.warn('[OracleCinematicPlayer] Video failed to load — skipping to prophecy reveal.', ORACLE_VIDEO_SRC);
          }
          handleFinished();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: visible ? 1 : 0,
          transition: 'opacity 800ms ease',
          background: '#000',
        }}
        aria-hidden
      />

      {/* ── Mute / unmute toggle ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute oracle cinematic' : 'Mute oracle cinematic'}
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          padding: '6px 14px',
          background: 'rgba(0,0,0,0.55)',
          color: '#d4a017',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          letterSpacing: '0.05em',
          zIndex: 1,
        }}
      >
        {muted ? '🔇 Unmute' : '🔊 Mute'}
      </button>

      {/* ── Skip button — only on re-views ────────────────────────────────── */}
      {allowSkip ? (
        <button
          type="button"
          onClick={handleFinished}
          aria-label="Skip oracle cinematic"
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
            zIndex: 1,
          }}
        >
          Skip ›
        </button>
      ) : null}
    </section>
  );
}
