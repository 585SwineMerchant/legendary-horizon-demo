/**
 * ScrollRevealSequence — cinematic Scroll of Destiny reveal.
 *
 * Elements materialize in their exact SCROLL_LAYOUT zones so that when the
 * parchment fades in behind them at stage 8 they "snap into meaning" —
 * the stats are already sitting in the center block, the rune medallions
 * are already sitting in the sigil circles.
 *
 * Layout zones + toOverlayCss() are imported from ScrollOfDestinyDisplay so
 * the coordinate system is shared between the reveal and the persistent hub.
 * Rune PNGs come from RUNE_ASSETS (same source as the hub's RuneGlyph).
 */

import { useEffect, useMemo, useState } from 'react';

import type { RealmDefinition } from '../../types';
import { GUILD_RUNES } from '../../data/guildRunes';
import type { RiasecScores } from './signpostAlgorithm';
import { computeForetoldSignposts } from './signpostAlgorithm';
import { ScrollFrameStage } from '../../components/scrollUI/ScrollFrameStage';
import { RUNE_ASSETS } from '../../components/scrollUI/scrollAssets';
import { SCROLL_LAYOUT, SCROLL_REF, toOverlayCss } from '../../components/ScrollOfDestinyDisplay';

type Props = {
  foretoldSignpostRealmIds: readonly string[];
  riasecScores: RiasecScores;
  allRealms: readonly RealmDefinition[];
  /**
   * Called when the player clicks "Return to Scribe". Receives the signpost IDs
   * that were displayed during the reveal so the caller can commit them to state
   * (and the hub will show the same signposts immediately after dismiss).
   */
  onDismiss: (committedSignpostIds: readonly string[]) => void;
  /** Kept for caller compatibility — layout now uses ScrollFrameStage's own asset. */
  scrollBgImage?: string;
};

const RIASEC_LABELS: Record<keyof RiasecScores, string> = {
  r: 'Realistic',
  i: 'Investigative',
  a: 'Artistic',
  s: 'Social',
  e: 'Enterprising',
  c: 'Conventional',
};

const RIASEC_ORDER: Array<keyof RiasecScores> = ['r', 'i', 'a', 's', 'e', 'c'];

/**
 * Animation stages:
 * 0  – hidden (before mount effect fires)
 * 1  – ScrollFrameStage vignette is the dark void; scroll image opacity = 0
 * 2  – RIASEC bars materialize in SCROLL_LAYOUT.center zone
 * 3  – 1st signpost rune (SCROLL_LAYOUT.sigil1)
 * 4  – 2nd signpost rune (SCROLL_LAYOUT.sigil2)
 * 5  – 3rd signpost rune (SCROLL_LAYOUT.sigil3)
 * 6  – all three runes glow together + "Foretold Signposts" banner appears
 * 7  – scroll parchment materialises behind all content (imageOpacity → 1)
 * 8  – Continue button appears
 *
 * NOTE: Oracle's Prophecy / sigil burn-in is an Act II element — not shown here.
 */
type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Amber/gold — reads on both the dark void (stages 1-7) and warm parchment (stage 8+).
const REVEAL_GOLD  = 'rgba(212,160,23,0.92)';
const REVEAL_GOLD2 = 'rgba(212,160,23,0.70)';

// ── Rune glyph —————————————————————————————————————————————————————————————
// Prefer the PNG medallion asset (RUNE_ASSETS) with inline SVG fallback.
// Matches the RuneGlyph component in ScrollOfDestinyDisplay but adapted for
// the reveal's glow / pulse animation.

function RevealRuneGlyph({ realmId, glowing }: { realmId: string; glowing: boolean }) {
  const [imgError, setImgError] = useState(false);
  const runeAsset  = RUNE_ASSETS[realmId];
  const glowFilter = glowing
    ? 'drop-shadow(0 0 6px rgba(212,160,23,0.85)) drop-shadow(0 0 14px rgba(212,160,23,0.50))'
    : 'drop-shadow(0 2px 6px rgba(180,100,0,0.45))';

  if (runeAsset && !imgError) {
    return (
      <img
        src={runeAsset}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setImgError(true)}
        style={{
          width: '70%',
          height: '70%',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: glowFilter,
          transition: 'filter 0.6s ease',
          animation: glowing ? 'lh-scroll-reveal-pulse 2.4s ease infinite' : 'none',
        }}
      />
    );
  }

  // Fallback: inline SVG path from guildRunes
  const rune = GUILD_RUNES[realmId];
  if (!rune) return null;
  return (
    <svg
      viewBox="0 0 40 46"
      style={{
        width: '55%',
        height: '55%',
        filter: glowFilter,
        transition: 'filter 0.6s ease',
        animation: glowing ? 'lh-scroll-reveal-pulse 2.4s ease infinite' : 'none',
      }}
      aria-hidden
    >
      <path d={rune.path} fill="none" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {rune.dot ? <circle cx={rune.dot.cx} cy={rune.dot.cy} r={rune.dot.r} fill="#d4a017" /> : null}
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function ScrollRevealSequence({
  foretoldSignpostRealmIds,
  riasecScores,
  allRealms,
  onDismiss,
}: Props) {
  const [stage, setStage] = useState<Stage>(0);

  // If live signpost IDs were not committed yet, derive them from RIASEC scores
  // so rune cards always appear during the reveal.
  const displaySignpostIds = useMemo(
    () =>
      foretoldSignpostRealmIds.length > 0
        ? [...foretoldSignpostRealmIds]
        : computeForetoldSignposts(riasecScores, []),
    [foretoldSignpostRealmIds, riasecScores],
  );

  // Component-identity log — confirms the live file is mounted.
  useEffect(() => {
    console.log('SCROLL_REVEAL_COMPONENT: ScrollRevealSequence (modules/act1/ScrollRevealSequence.tsx)');
    if (displaySignpostIds.length > 0) {
      console.log('[LH_SIGNPOSTS] loaded', {
        ids: [...displaySignpostIds],
        count: displaySignpostIds.length,
        source: foretoldSignpostRealmIds.length > 0 ? 'live' : 'derived-from-riasec',
      });
    } else {
      console.warn('[LH_SIGNPOSTS] no signpost data available even after fallback');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cascade through stages — stats/runes appear on the dark void, then the
  // "Foretold Signposts" banner appears, then the scroll parchment materialises
  // behind everything so the elements "snap into meaning."
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(1),   60));   // dark void
    timers.push(setTimeout(() => setStage(2),  900));   // RIASEC bars
    timers.push(setTimeout(() => setStage(3), 1400));   // 1st rune
    timers.push(setTimeout(() => setStage(4), 2200));   // 2nd rune
    timers.push(setTimeout(() => setStage(5), 3000));   // 3rd rune
    timers.push(setTimeout(() => setStage(6), 3800));   // runes glow + "Foretold Signposts" banner
    timers.push(setTimeout(() => setStage(7), 5400));   // scroll parchment fades in
    timers.push(setTimeout(() => setStage(8), 7000));   // Continue button
    return () => timers.forEach(clearTimeout);
  }, []);

  const runesGlowing       = stage >= 6;
  const signpostsBannerVisible = stage >= 6;
  const continueVisible    = stage >= 8;
  const scrollImageOpacity = stage >= 7 ? 1 : 0;
  const sigilRegions       = [SCROLL_LAYOUT.sigil1, SCROLL_LAYOUT.sigil2, SCROLL_LAYOUT.sigil3] as const;

  return (
    <>
      <style>{`
        @keyframes lh-scroll-reveal-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.60; }
        }
      `}</style>

      {/*
        ScrollFrameStage provides:
          • dark radial vignette — this IS the dark void for stages 1-7
          • scroll parchment image (opacity controlled by imageOpacity prop)
          • 16:9 centered container; all children positioned absolutely inside it
        zIndex=9000 ensures it sits above exploration UI and any NPC dialogue remnants.
      */}
      <ScrollFrameStage
        zIndex={9000}
        variant="hub"
        imageOpacity={scrollImageOpacity}
        imageTransition="opacity 2s ease"
      >

        {/* ── CENTER ZONE — RIASEC base stats ─────────────────────────────────── */}
        {/* Exactly mirrors the hub's center block: top-aligned, gap:4, padding   */}
        {/* '5px 10px'. The "Maia · Base Stats" label matches the hub heading so  */}
        {/* when the parchment fades in behind these elements they snap into place.*/}
        <div
          style={{
            ...toOverlayCss(SCROLL_LAYOUT.center),
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '5px 10px',
            opacity: stage >= 2 ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {/* Section label — matches hub's "Maia · Base Stats" heading */}
          <p style={{
            margin: '0 0 4px',
            fontSize: '0.64em',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: stage >= 8 ? 'rgba(100,75,40,0.72)' : 'rgba(212,160,23,0.70)',
            transition: 'color 1.6s ease',
          }}>
            Maia · Base Stats
          </p>

          {/* RIASEC rows — layout matches RiasecScrollRow in ScrollOfDestinyDisplay */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RIASEC_ORDER.map((code) => {
              const score = riasecScores[code];
              const pct   = Math.min(100, Math.round((score / 20) * 100));
              const isTop = score >= 14;
              return (
                <div
                  key={code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    opacity: stage >= 2 ? 1 : 0,
                    transform: stage >= 2 ? 'translateX(0)' : 'translateX(-10px)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                >
                  <span style={{ width: 13, fontSize: '0.70em', fontWeight: 700, color: isTop ? REVEAL_GOLD : REVEAL_GOLD2, textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
                    {code.toUpperCase()}
                  </span>
                  <span style={{ width: 80, fontSize: '0.64em', color: REVEAL_GOLD2, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {RIASEC_LABELS[code]}
                  </span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(212,160,23,0.18)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #d4a017, #f59e0b)', borderRadius: 2, transition: 'width 0.7s ease 0.1s' }} />
                  </div>
                  <span style={{ width: 22, fontSize: '0.68em', color: REVEAL_GOLD, textAlign: 'right', flexShrink: 0 }}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SIGIL ZONES — Foretold Signpost rune medallions ─────────────────── */}
        {/* Each rune appears in its SCROLL_LAYOUT.sigil* zone, exactly where it  */}
        {/* will sit in the persistent hub after the scroll materialises.         */}
        {sigilRegions.map((region, i) => {
          const realmId = displaySignpostIds[i];
          const realm   = realmId ? allRealms.find((r) => r.realm_id === realmId) : null;
          const visible = stage >= 3 + i;
          return (
            <div
              key={i}
              style={{
                ...toOverlayCss(region),
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3%',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.72)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
              }}
            >
              {realmId ? (
                <>
                  <RevealRuneGlyph realmId={realmId} glowing={runesGlowing} />
                  <p style={{
                    margin: 0,
                    fontSize: '0.60em',
                    fontWeight: 700,
                    color: REVEAL_GOLD,
                    lineHeight: 1.2,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '95%',
                  }}>
                    {realm?.display_name ?? realmId}
                  </p>
                </>
              ) : null}
            </div>
          );
        })}

        {/* ── FORETOLD SIGNPOSTS BANNER — appears when runes glow (stage 6) ────── */}
        {/* Sits just above the three sigil zones in the scroll's signpost area.   */}
        {/* Oracle's Prophecy is Act II — it is NOT shown here.                    */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left:   `${(340  / SCROLL_REF.w) * 100}%`,
            top:    `${(504  / SCROLL_REF.h) * 100}%`,
            width:  `${(600  / SCROLL_REF.w) * 100}%`,
            height: `${(42   / SCROLL_REF.h) * 100}%`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2%',
            overflow: 'visible',
            opacity: signpostsBannerVisible ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          {/* Decorative rule left */}
          <svg viewBox="0 0 60 4" style={{ width: '9%', flexShrink: 0 }} aria-hidden>
            <line x1={0} y1={2} x2={60} y2={2} stroke="rgba(212,160,23,0.55)" strokeWidth={1} />
          </svg>
          <span style={{
            fontSize: '0.64em',
            fontWeight: 700,
            color: REVEAL_GOLD,
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            fontFamily: 'serif',
            whiteSpace: 'nowrap',
          }}>
            Foretold Signposts
          </span>
          {/* Decorative rule right */}
          <svg viewBox="0 0 60 4" style={{ width: '9%', flexShrink: 0 }} aria-hidden>
            <line x1={0} y1={2} x2={60} y2={2} stroke="rgba(212,160,23,0.55)" strokeWidth={1} />
          </svg>
        </div>

        {/* ── CONTINUE BUTTON — appears after scroll has materialised (stage 9) ─ */}
        {/* Clicking calls onDismiss, which in useNightOneFlow opens the Scribe's  */}
        {/* post-reveal reaction in the normal RPG dialogue box.                   */}
        <div
          style={{
            position: 'absolute',
            bottom: '3.5%',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: continueVisible ? 1 : 0,
            pointerEvents: continueVisible ? 'auto' : 'none',
            transition: 'opacity 0.5s ease',
          }}
        >
          <button
            type="button"
            onClick={() => onDismiss(displaySignpostIds)}
            disabled={!continueVisible}
            aria-hidden={!continueVisible}
            style={{
              padding: '9px 28px',
              fontSize: '0.82em',
              fontFamily: 'serif',
              letterSpacing: '0.07em',
              background: 'linear-gradient(135deg, rgba(212,160,23,0.18), rgba(184,145,42,0.12))',
              color: '#f5d78e',
              border: '1px solid rgba(212,160,23,0.55)',
              borderRadius: 3,
              cursor: continueVisible ? 'pointer' : 'default',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Return to Scribe
          </button>
        </div>

      </ScrollFrameStage>
    </>
  );
}
