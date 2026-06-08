import { useEffect, useRef, useState } from 'react';

/**
 * Oracle Prophecy Reveal
 *
 * Atmospheric reveal sequence for the Oracle's career prophecy:
 *   glow   → amber/violet shimmer blooms on dark void            (~600 ms)
 *   title  → prophecy career title fades in, centre-screen       (~1 600 ms)
 *   badge  → "Foretold resonance" badge + career number appears  (~1 000 ms)
 *   sigil  → prophecy sigil burns in with glow animation         (~2 200 ms)
 *   hold   → continue button becomes clickable                    (~1 400 ms)
 *   done   → auto-advance / onComplete fires
 *
 * After the sigil phase the branded mark is permanent on the player's Scroll
 * of Destiny. Clicking the sigil (in hold/done) opens the career URL.
 */

type Phase = 'glow' | 'title' | 'badge' | 'sigil' | 'hold' | 'done';

const PHASE_MS: Record<Phase, number> = {
  glow:  600,
  title: 1600,
  badge: 1000,
  sigil: 2200,
  hold:  1400,
  done:  0,
};

const PHASE_ORDER: Phase[] = ['glow', 'title', 'badge', 'sigil', 'hold', 'done'];

type Props = {
  /** Oracle destiny number (1–41). */
  prophecyId: number;
  /** Fantasy career title for the chosen destiny. */
  prophecyTitle: string;
  /**
   * Canon realm IDs from the player's Scroll of Destiny signposts.
   * When non-empty a "foretold resonance" badge is shown.
   */
  foretoldSignpostRealmIds?: readonly string[];
  /**
   * Real-world CareerOneStop URL. After the sigil burns in it becomes
   * a clickable link — the brand is permanent on the Scroll.
   */
  prophecyUrl?: string;
  /** Called when the reveal finishes or the player skips. */
  onComplete: () => void;
};

export function OracleProphecyReveal({
  prophecyId,
  prophecyTitle,
  foretoldSignpostRealmIds = [],
  prophecyUrl,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>('glow');
  const completedRef = useRef(false);

  // Phase sequencer
  useEffect(() => {
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    function advance() {
      const current = PHASE_ORDER[idx];
      const ms = PHASE_MS[current];
      if (current === 'done') {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
        return;
      }
      timer = setTimeout(() => {
        idx += 1;
        setPhase(PHASE_ORDER[idx]);
        advance();
      }, ms);
    }

    advance();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function skip() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }

  const glowVisible   = phase !== 'glow';
  const titleVisible  = phase === 'title' || phase === 'badge' || phase === 'sigil' || phase === 'hold' || phase === 'done';
  const badgeVisible  = phase === 'badge' || phase === 'sigil' || phase === 'hold' || phase === 'done';
  // Sigil burns in during 'sigil' phase — stays visible from then on
  const sigilVisible  = phase === 'sigil' || phase === 'hold' || phase === 'done';
  // Sigil fully revealed after burn-in (i.e. not still animating)
  const sigilRevealed = phase === 'hold' || phase === 'done';
  const btnVisible    = phase === 'hold' || phase === 'done';
  const hasResonance  = foretoldSignpostRealmIds.length > 0;

  return (
    <section
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9100,
        background: '#07080d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
      aria-label="Oracle Prophecy Reveal"
    >
      {/* Radial amber/violet glow — blooms at phase glow → onward */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: glowVisible
            ? 'radial-gradient(ellipse at 50% 52%, rgba(212,160,23,0.18) 0%, rgba(109,40,217,0.10) 45%, transparent 70%)'
            : 'transparent',
          transition: 'background 1.2s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Extra glow burst centred on sigil during burn-in */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: sigilVisible && !sigilRevealed
            ? 'radial-gradient(ellipse at 50% 68%, rgba(212,160,23,0.32) 0%, rgba(212,160,23,0.12) 25%, transparent 55%)'
            : 'transparent',
          transition: sigilRevealed
            ? 'background 1.4s ease'
            : 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Eyebrow */}
      <p
        style={{
          position: 'absolute',
          top: 52,
          margin: 0,
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(212,160,23,0.7)',
          opacity: titleVisible ? 1 : 0,
          transition: 'opacity 700ms ease',
        }}
      >
        The Oracle has spoken
      </p>

      {/* Career title — the main prophecy moment */}
      <div
        style={{
          textAlign: 'center',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'opacity 1s ease, transform 1s ease',
          marginBottom: 12,
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(11px, 1.4vw, 14px)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(212,160,23,0.6)',
          }}
        >
          Destiny #{prophecyId}
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(26px, 5vw, 48px)',
            fontWeight: 700,
            color: '#f5d78e',
            textShadow: '0 0 40px rgba(212,160,23,0.55), 0 0 80px rgba(212,160,23,0.20)',
            lineHeight: 1.1,
            maxWidth: '72vw',
          }}
        >
          {prophecyTitle}
        </h2>
      </div>

      {/* Resonance badge + cluster note */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: badgeVisible ? 1 : 0,
          transition: 'opacity 700ms ease 200ms',
          marginBottom: 8,
        }}
        aria-live="polite"
      >
        {hasResonance ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 18px',
              border: '1px solid rgba(212,160,23,0.45)',
              borderRadius: 20,
              background: 'rgba(212,160,23,0.08)',
              color: '#f5d78e',
              fontSize: 12,
              letterSpacing: '0.07em',
            }}
          >
            <span aria-hidden style={{ fontSize: 15 }}>✦</span>
            Foretold resonance detected
          </div>
        ) : null}

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'rgba(212,160,23,0.55)',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
          }}
        >
          The Scroll has been branded.
        </p>
      </div>

      {/* ── Prophecy Sigil burn-in ──────────────────────────────────────── */}
      {/* Appears during 'sigil' phase with a searing glow animation,        */}
      {/* then settles as a permanent mark. In hold/done it is clickable      */}
      {/* and opens the career URL.                                           */}
      <div
        style={{
          opacity: sigilVisible ? 1 : 0,
          transform: sigilVisible
            ? 'translateY(0) scale(1)'
            : 'translateY(12px) scale(0.72)',
          // During burn-in: fast bloom + shimmer. After: calm drop-shadow.
          filter: sigilRevealed
            ? 'drop-shadow(0 0 10px rgba(212,160,23,0.55)) drop-shadow(0 0 24px rgba(212,160,23,0.20))'
            : sigilVisible
              ? 'drop-shadow(0 0 22px rgba(255,200,60,0.90)) drop-shadow(0 0 50px rgba(212,160,23,0.60)) brightness(1.35)'
              : 'none',
          transition: sigilRevealed
            ? 'opacity 1.0s ease, transform 1.0s ease, filter 1.6s ease'
            : 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s, filter 0.4s ease 0.1s',
          marginBottom: 4,
          cursor: sigilRevealed && prophecyUrl ? 'pointer' : 'default',
        }}
        role={sigilRevealed && prophecyUrl ? 'link' : undefined}
        aria-label={sigilRevealed && prophecyUrl ? `Open career research: ${prophecyTitle}` : undefined}
        onClick={() => {
          if (sigilRevealed && prophecyUrl) {
            window.open(prophecyUrl, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <img
          src="assets/oracle/prophecy_sigil.png"
          alt="Oracle prophecy sigil"
          style={{
            width: 'clamp(64px, 10vw, 120px)',
            height: 'auto',
            display: 'block',
          }}
          draggable={false}
        />
      </div>

      {/* Career URL hint — only shown once sigil is fully revealed */}
      {sigilRevealed && prophecyUrl ? (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 11,
            color: 'rgba(212,160,23,0.45)',
            letterSpacing: '0.08em',
            textAlign: 'center',
            opacity: sigilRevealed ? 1 : 0,
            transition: 'opacity 700ms ease 400ms',
          }}
        >
          ↑ tap the sigil to explore your destiny
        </p>
      ) : null}

      {/* Skip — always visible */}
      <button
        type="button"
        onClick={skip}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          padding: '8px 20px',
          background: 'rgba(0,0,0,0.55)',
          color: '#d4a017',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Skip
      </button>

      {/* Seal my destiny — appears at hold phase */}
      <button
        type="button"
        onClick={skip}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '11px 30px',
          background: 'rgba(212,160,23,0.14)',
          color: '#f5d78e',
          border: '1px solid rgba(212,160,23,0.55)',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 14,
          letterSpacing: '0.07em',
          opacity: btnVisible ? 1 : 0,
          transition: 'opacity 700ms ease 300ms',
          pointerEvents: btnVisible ? 'auto' : 'none',
        }}
        aria-hidden={!btnVisible}
      >
        Seal my destiny →
      </button>
    </section>
  );
}
