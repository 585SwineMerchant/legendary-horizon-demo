import { useEffect, useRef, useState } from 'react';

/** One entry per destiny number 1..41 — just the id, title comes from props. */
const TOTAL_BOOKS = 41;

type Phase =
  | 'scroll'      // books scrolling across
  | 'decel'       // deceleration — scroll slows
  | 'reveal'      // chosen book centred, amber glow
  | 'hold'        // 1.5 s hold so player can read
  | 'done';       // triggers onComplete

type Props = {
  /** Oracle destiny number (1–41). */
  prophecyId: number;
  /** Fantasy career title for the chosen destiny. */
  prophecyTitle: string;
  /**
   * Optional: canon realm IDs from the player's Scroll of Destiny signposts.
   * When present the component checks for cluster resonance and shows a
   * "foretold resonance detected" badge.
   */
  foretoldSignpostRealmIds?: readonly string[];
  /** Called when the reveal finishes or the player skips. */
  onComplete: () => void;
};

const PHASE_MS: Record<Phase, number> = {
  scroll: 3000,
  decel:  1200,
  reveal: 600,
  hold:   1800,
  done:   0,
};

const PHASE_ORDER: Phase[] = ['scroll', 'decel', 'reveal', 'hold', 'done'];

/** Thin book-spine colours — muted palette so the amber chosen-book pops. */
const SPINE_COLORS = [
  '#2c3e50', '#34495e', '#1a252f', '#2e4057', '#3b4a6b',
  '#2d3561', '#1b3a4b', '#253d5b', '#2c3a47', '#1f2d3d',
];

function spineColor(id: number): string {
  return SPINE_COLORS[(id - 1) % SPINE_COLORS.length];
}

function bookSpineWidth(_id: number): number {
  // Slight variation to feel like real books on a shelf.
  return 28 + (((_id * 7) % 5) * 4); // 28 | 32 | 36 | 40 | 44 px
}

export function OracleProphecyReveal({ prophecyId, prophecyTitle, foretoldSignpostRealmIds = [], onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('scroll');
  const completedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Whether the prophecy has any foretold resonance
  const hasResonance = foretoldSignpostRealmIds.length > 0;

  const isScrolling = phase === 'scroll' || phase === 'decel';
  const isRevealed  = phase === 'reveal' || phase === 'hold' || phase === 'done';

  // Scroll speed: fast during 'scroll', slows to 0 during 'decel', stops at 'reveal'.
  const scrollDuration =
    phase === 'scroll' ? '3s' :
    phase === 'decel'  ? '1.2s' :
    '0s';

  const scrollEasing =
    phase === 'scroll' ? 'linear' :
    phase === 'decel'  ? 'cubic-bezier(0.15, 0.95, 0.35, 1)' :
    'linear';

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
      {/* Ambient gradient backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isRevealed
            ? 'radial-gradient(ellipse at 50% 60%, rgba(212,160,23,0.15) 0%, transparent 70%)'
            : 'transparent',
          transition: 'background 900ms ease',
          pointerEvents: 'none',
        }}
        aria-hidden
      />

      {/* Eyebrow label */}
      <p
        style={{
          position: 'absolute',
          top: 48,
          color: 'rgba(212,160,23,0.8)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: isScrolling ? 0.6 : 0,
          transition: 'opacity 600ms ease',
          margin: 0,
        }}
      >
        The Oracle searches the Vault of Runes…
      </p>

      {/* Book shelf strip */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 200,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
        aria-hidden
      >
        {/* Shelf board */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 12,
            background: 'linear-gradient(180deg, #2a1f0e 0%, #1a1208 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        />

        {/* Moving books wrapper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            paddingBottom: 12,
            paddingLeft: 16,
            // Animate a translateX to scroll books leftward, ending at the
            // correct offset so prophecy book lands centred.
            transform: isScrolling
              ? undefined
              : `translateX(calc(50vw - ${computeOffsetToCentre(prophecyId)}px))`,
            transition: isScrolling
              ? `transform ${scrollDuration} ${scrollEasing}`
              : 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
            animation: phase === 'scroll'
              ? `lh-books-scroll ${scrollDuration} linear forwards`
              : undefined,
            willChange: 'transform',
          }}
        >
          {Array.from({ length: TOTAL_BOOKS }, (_, i) => {
            const id = i + 1;
            const isChosen = id === prophecyId;
            const w = bookSpineWidth(id);
            const h = isChosen ? 170 : 120 + ((id * 11) % 40);

            return (
              <div
                key={id}
                style={{
                  width: w,
                  height: h,
                  background: isChosen && isRevealed
                    ? `linear-gradient(180deg, #f59e0b 0%, #d4a017 50%, #a37810 100%)`
                    : spineColor(id),
                  borderRadius: '2px 2px 0 0',
                  boxShadow: isChosen && isRevealed
                    ? '0 0 24px 8px rgba(212,160,23,0.6), 0 0 48px 16px rgba(212,160,23,0.25)'
                    : '2px 0 6px rgba(0,0,0,0.4)',
                  transition: 'background 0.7s ease, box-shadow 0.7s ease, height 0.5s ease',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Book spine number — small */}
                <span
                  style={{
                    writingMode: 'vertical-lr',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: isChosen && isRevealed ? '#1a0a00' : 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.04em',
                    userSelect: 'none',
                    transition: 'color 0.7s ease',
                  }}
                >
                  {id}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prophecy reveal panel */}
      <div
        style={{
          marginTop: 36,
          textAlign: 'center',
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 800ms ease, transform 800ms ease',
        }}
      >
        <p
          style={{
            color: 'rgba(212,160,23,0.7)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin: '0 0 8px',
          }}
        >
          The Oracle has spoken
        </p>
        <h2
          style={{
            color: '#f5d78e',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 700,
            margin: '0 0 6px',
            textShadow: '0 0 32px rgba(245,159,11,0.5)',
          }}
        >
          Destiny #{prophecyId}
        </h2>
        <h3
          style={{
            color: '#fef3c7',
            fontSize: 'clamp(16px, 2.8vw, 24px)',
            fontWeight: 400,
            margin: '0 0 20px',
            letterSpacing: '0.03em',
          }}
        >
          {prophecyTitle}
        </h3>

        {/* Foretold resonance badge */}
        {hasResonance && isRevealed ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              border: '1px solid rgba(212,160,23,0.5)',
              borderRadius: 20,
              background: 'rgba(212,160,23,0.08)',
              color: '#f5d78e',
              fontSize: 12,
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            <span aria-hidden style={{ fontSize: 14 }}>✦</span>
            Foretold resonance detected
          </div>
        ) : null}
      </div>

      {/* Skip button */}
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
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Skip
      </button>

      {/* Continue button — only after reveal */}
      {isRevealed ? (
        <button
          type="button"
          onClick={skip}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 28px',
            background: 'rgba(212,160,23,0.15)',
            color: '#f5d78e',
            border: '1px solid rgba(212,160,23,0.6)',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            letterSpacing: '0.06em',
            opacity: phase === 'hold' || phase === 'done' ? 1 : 0,
            transition: 'opacity 600ms ease 400ms',
          }}
        >
          Seal my destiny →
        </button>
      ) : null}

      {/* Injected keyframe for scroll animation */}
      <style>{`
        @keyframes lh-books-scroll {
          from { transform: translateX(100vw); }
          to   { transform: translateX(-${computeTotalBooksWidth()}px); }
        }
      `}</style>
    </section>
  );
}

/** Sum of all book widths + gaps up to (but not including) the chosen book,
 *  then half of the chosen book width, to land it at the viewport centre. */
function computeOffsetToCentre(chosenId: number): number {
  let offset = 0;
  for (let id = 1; id <= TOTAL_BOOKS; id++) {
    if (id === chosenId) {
      offset += bookSpineWidth(id) / 2;
      break;
    }
    offset += bookSpineWidth(id) + 4; // width + gap
  }
  return offset;
}

/** Rough total width of all books + gaps (used for scroll-out keyframe). */
function computeTotalBooksWidth(): number {
  let total = 0;
  for (let id = 1; id <= TOTAL_BOOKS; id++) {
    total += bookSpineWidth(id) + 4;
  }
  return total + 32; // + paddingLeft
}
