import { useEffect, useRef, useState } from 'react';
import { publicAssetUrl } from '../lib/publicAssetUrl';
import { SCROLL_REF } from '../components/ScrollOfDestinyDisplay';
import { playLhCeremonyMusic } from '../lib/lhCeremonyMusic';

/**
 * Oracle Prophecy Reveal
 *
 * Timed cinematic — no player input skips the sequence:
 *   glow         → amber/violet shimmer blooms on dark void          (~600 ms)
 *   title        → prophecy career title fades in, centre-screen     (~1 600 ms)
 *   badge        → "Foretold resonance" badge + career number        (~1 000 ms)
 *   sigil        → prophecy sigil burns in with glow animation       (~2 200 ms)
 *   zoom         → sigil zooms large, intense light                  (~1 500 ms)
 *   scroll_enter → scroll parchment cross-fades in                   (~1 200 ms)
 *   burn         → sigil burns into scroll right of rune row         (~2 000 ms)
 *   hold         → "Seal my destiny" button becomes clickable        (~1 400 ms)
 *   done         → onComplete fires
 *
 * TODO: add burning SFX triggered at start of 'burn' phase once the clip is added.
 *
 * NOTE: prophecy_sigil.png must be exported with a transparent background from your
 * image editor. Until then, mix-blend-mode:multiply removes the white fill on both
 * the dark void AND the light parchment (white × parchment ≈ parchment color —
 * the sigil marks stay visible). This is a TEMPORARY workaround — re-export the PNG
 * with transparency and remove the mixBlendMode style from both sigil <img> elements.
 */

type Phase =
  | 'glow'
  | 'title'
  | 'badge'
  | 'sigil'
  | 'zoom'
  | 'scroll_enter'
  | 'burn'
  | 'hold'
  | 'done';

const PHASE_MS: Record<Phase, number> = {
  glow:         600,
  title:        1600,
  badge:        1000,
  sigil:        2200,
  zoom:         1500,
  scroll_enter: 1200,
  burn:         2000,
  hold:         1400,
  done:         0,
};

const PHASE_ORDER: Phase[] = [
  'glow', 'title', 'badge', 'sigil', 'zoom', 'scroll_enter', 'burn', 'hold', 'done',
];

// Prophecy sigil position on the scroll: just to the right of sigil3 (the rightmost rune).
// Calibrated against SCROLL_LAYOUT coordinates (1280×720 reference).
// sigil3 ends at x = 757 + 142 = 899; place oracle sigil at x ≈ 910.
const ORACLE_SIGIL_ON_SCROLL = {
  left:   910,
  top:    530,
  width:  150,
  height: 130,
};

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
  /** Called when the reveal finishes (no skip — must complete the sequence). */
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

  useEffect(() => playLhCeremonyMusic('prophecy_reveal_ceremony'), []);

  // Phase sequencer — purely timer-driven, no player input.
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
        const next = PHASE_ORDER[idx];
        setPhase(next);
        // TODO: trigger burning SFX here when next === 'burn' and the clip is available.
        advance();
      }, ms);
    }

    advance();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sealDestiny() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }

  // ── Visibility helpers ────────────────────────────────────────────────────
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const after = (p: Phase) => phaseIndex > PHASE_ORDER.indexOf(p);
  const from  = (p: Phase) => phaseIndex >= PHASE_ORDER.indexOf(p);

  const glowVisible    = after('glow');
  const titleVisible   = from('title') && !from('scroll_enter');
  const badgeVisible   = from('badge') && !from('scroll_enter');
  const sigilVisible   = from('sigil');
  const sigilRevealed  = from('hold');
  const inZoom         = phase === 'zoom';
  const inScrollPhase  = from('scroll_enter');
  const scrollVisible  = from('scroll_enter');
  const burnActive     = phase === 'burn';
  const sigilOnScroll  = from('burn');
  const btnVisible     = from('hold');
  const hasResonance   = foretoldSignpostRealmIds.length > 0;

  const sigilUrl = publicAssetUrl('assets/oracle/prophecy_sigil.png');
  const scrollUrl = publicAssetUrl('assets/scroll/Scroll_Of_Destiny_ready.png');

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
      {/* Radial amber/violet glow — blooms from glow phase onward */}
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
          opacity: inScrollPhase ? 0 : 1,
        }}
      />

      {/* Extra glow burst during sigil burn-in (dark void phase) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: sigilVisible && !sigilRevealed && !inScrollPhase
            ? 'radial-gradient(ellipse at 50% 68%, rgba(212,160,23,0.32) 0%, rgba(212,160,23,0.12) 25%, transparent 55%)'
            : 'transparent',
          transition: sigilRevealed
            ? 'background 1.4s ease'
            : 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* ── Scroll of Destiny parchment — fades in at scroll_enter ─────── */}
      {/* The 16:9 container keeps SCROLL_LAYOUT coordinates accurate       */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: scrollVisible ? 1 : 0,
          transition: 'opacity 1.0s ease',
          pointerEvents: 'none',
        }}
      >
        {/* Aspect-locked scroll viewport — matches ScrollFrameStage coordinate space */}
        <div
          style={{
            position: 'relative',
            aspectRatio: `${SCROLL_REF.w} / ${SCROLL_REF.h}`,
            width: '100%',
            maxHeight: '100vh',
            maxWidth: `${(SCROLL_REF.w / SCROLL_REF.h) * 100}vh`,
          }}
        >
          <img
            src={scrollUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              display: 'block',
            }}
          />

          {/* Oracle sigil burned into the scroll — right of the rune row */}
          <div
            role={sigilRevealed && prophecyUrl ? 'link' : undefined}
            aria-label={sigilRevealed && prophecyUrl ? `Open career research: ${prophecyTitle}` : undefined}
            style={{
              position: 'absolute',
              left:   `${(ORACLE_SIGIL_ON_SCROLL.left   / SCROLL_REF.w) * 100}%`,
              top:    `${(ORACLE_SIGIL_ON_SCROLL.top    / SCROLL_REF.h) * 100}%`,
              width:  `${(ORACLE_SIGIL_ON_SCROLL.width  / SCROLL_REF.w) * 100}%`,
              height: `${(ORACLE_SIGIL_ON_SCROLL.height / SCROLL_REF.h) * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sigilOnScroll ? 1 : 0,
              transform: sigilOnScroll ? 'scale(1)' : 'scale(0.5)',
              transition: burnActive
                ? 'opacity 0.4s ease 0.2s, transform 0.5s ease 0.1s'
                : 'opacity 0.8s ease, transform 0.8s ease',
              filter: burnActive
                ? 'drop-shadow(0 0 18px rgba(255,180,30,0.95)) drop-shadow(0 0 40px rgba(212,160,23,0.70)) brightness(1.4)'
                : 'drop-shadow(0 0 8px rgba(212,160,23,0.50)) drop-shadow(0 0 20px rgba(212,160,23,0.25))',
              cursor: sigilRevealed && prophecyUrl ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (sigilRevealed && prophecyUrl) {
                window.open(prophecyUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <img
              src={sigilUrl}
              alt="Oracle prophecy sigil"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* ── Dark-void phase elements — hidden once scroll appears ────────── */}
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
          pointerEvents: 'none',
        }}
      >
        The Oracle has spoken
      </p>

      {/* Career title */}
      <div
        style={{
          textAlign: 'center',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'opacity 1s ease, transform 1s ease',
          marginBottom: 12,
          pointerEvents: 'none',
        }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 'clamp(11px, 1.4vw, 14px)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.6)' }}>
          Destiny #{prophecyId}
        </p>
        <h2 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: 700, color: '#f5d78e', textShadow: '0 0 40px rgba(212,160,23,0.55), 0 0 80px rgba(212,160,23,0.20)', lineHeight: 1.1, maxWidth: '72vw' }}>
          {prophecyTitle}
        </h2>
      </div>

      {/* Resonance badge */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: badgeVisible ? 1 : 0,
          transition: 'opacity 700ms ease 200ms',
          marginBottom: 8,
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {hasResonance ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 18px', border: '1px solid rgba(212,160,23,0.45)', borderRadius: 20, background: 'rgba(212,160,23,0.08)', color: '#f5d78e', fontSize: 12, letterSpacing: '0.07em' }}>
            <span aria-hidden style={{ fontSize: 15 }}>✦</span>
            Foretold resonance detected
          </div>
        ) : null}
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(212,160,23,0.55)', fontStyle: 'italic', letterSpacing: '0.03em' }}>
          The Scroll has been branded.
        </p>
      </div>

      {/* ── Sigil (dark void phases: sigil → zoom) ────────────────────────── */}
      <div
        style={{
          opacity: sigilVisible && !inScrollPhase ? 1 : 0,
          transform: (() => {
            if (!sigilVisible) return 'translateY(12px) scale(0.72)';
            if (inZoom) return 'scale(2.4)';
            return 'scale(1)';
          })(),
          filter: inZoom
            ? 'drop-shadow(0 0 30px rgba(255,200,60,0.98)) drop-shadow(0 0 70px rgba(212,160,23,0.80)) brightness(1.5)'
            : sigilRevealed
              ? 'drop-shadow(0 0 10px rgba(212,160,23,0.55)) drop-shadow(0 0 24px rgba(212,160,23,0.20))'
              : sigilVisible
                ? 'drop-shadow(0 0 22px rgba(255,200,60,0.90)) drop-shadow(0 0 50px rgba(212,160,23,0.60)) brightness(1.35)'
                : 'none',
          transition: inZoom
            ? 'opacity 0.6s ease, transform 0.8s ease, filter 0.6s ease'
            : inScrollPhase
              ? 'opacity 0.5s ease'
              : 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s, filter 0.4s ease 0.1s',
          marginBottom: 4,
          pointerEvents: 'none',
        }}
      >
        <img
          src={sigilUrl}
          alt="Oracle prophecy sigil"
          style={{ width: 'clamp(64px, 10vw, 120px)', height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>

      {/* ── "Seal my destiny" — the ONLY completion control ─────────────── */}
      {/* Appears only at hold phase after the full sequence completes.      */}
      {/* There is no skip button — the sequence must play through.          */}
      <button
        type="button"
        onClick={sealDestiny}
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
          zIndex: 10,
        }}
        aria-hidden={!btnVisible}
      >
        Seal my destiny →
      </button>

      {/* Career URL hint — only shown once on scroll, sigil fully revealed */}
      {sigilRevealed && prophecyUrl ? (
        <p
          style={{
            position: 'absolute',
            bottom: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            fontSize: 11,
            color: 'rgba(212,160,23,0.45)',
            letterSpacing: '0.08em',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          ↑ tap the sigil on the scroll to explore your destiny
        </p>
      ) : null}
    </section>
  );
}
