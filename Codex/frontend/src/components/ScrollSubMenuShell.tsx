/**
 * ScrollSubMenuShell — shared in-world parchment panel for non-Atlas submenus.
 *
 * Uses ScrollFrameStage (variant="submenu") which loads scroll_blank.png —
 * a clean parchment scroll with wooden rollers and an ornamental blue-gold border.
 * Falls back to the hub scroll image via onError until that asset is in place.
 *
 * Layout strategy:
 *   • Content panel sits INSIDE the ornamental border frame of the blank scroll.
 *   • Panel background is semi-transparent dark (~45 % opacity) so the warm
 *     parchment texture bleeds through — producing a "lamplight on parchment" tone
 *     rather than a generic computer modal.
 *   • Scroll rollers and ornamental border remain fully visible on all four sides.
 *   • Title is centered, Cinzel typeface, with decorative diamond-rule lines.
 *   • Back button is a parchment tab in the top-right corner.
 *
 * Components that use this shell: QuestLogShell, SatchelOverlay, JournalShell.
 * World Atlas is explicitly NOT routed here.
 */

import type { ReactNode } from 'react';
import { ScrollFrameStage } from './scrollUI/ScrollFrameStage';

// ── Decorative diamond in the header rule lines ───────────────────────────
function Diamond() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 5,
        height: 5,
        background: 'rgba(212,168,40,0.7)',
        transform: 'rotate(45deg)',
        flexShrink: 0,
      }}
    />
  );
}

// ── Public API ────────────────────────────────────────────────────────────

export type ScrollSubMenuShellProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  tabs?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  zIndex?: number;
  ariaLabel?: string;
};

export function ScrollSubMenuShell({
  title,
  subtitle = 'Scroll of Destiny',
  onBack,
  backLabel = '← Scroll',
  tabs,
  footer,
  children,
  zIndex = 8800,
  ariaLabel,
}: ScrollSubMenuShellProps) {
  return (
    <ScrollFrameStage zIndex={zIndex} variant="submenu">
      {/*
       * Content panel — positioned inside the blank scroll's ornamental border.
       *
       * Blank scroll parchment safe-zone (approx, 1280×720 reference):
       *   left roller ends at ~12%  |  right roller starts at ~88%
       *   top cap ends at    ~11%  |  bottom cap starts at  ~89%
       *
       * We sit the panel inside the inner ornamental frame, leaving the full
       * blue-gold border and wooden rollers exposed as decorative framing.
       *
       *   left:16%  top:12%  width:68%  height:76%
       *
       * The semi-transparent dark background (≈45 % opacity) lets the warm
       * parchment texture bleed through, producing an amber-dark ground that
       * still reads as "writing on parchment" while keeping all existing
       * light-text card components legible.
       */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        style={{
          position: 'absolute',
          left: '16%',
          top: '12%',
          width: '68%',
          height: '76%',
          /* Parchment bleeds through at ~45 % — warm amber-dark ground */
          background: 'rgba(6,3,1,0.46)',
          border: '1px solid rgba(180,138,30,0.55)',
          borderRadius: 2,
          boxShadow:
            '0 6px 36px rgba(0,0,0,0.55), inset 0 0 100px rgba(160,95,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e8dcc8',
          /* No font-family here — let each content component decide */
        }}
      >
        {/* ── Header — centered Cinzel title + decorative rules ──────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '9px 14px 8px',
            borderBottom: '1px solid rgba(180,138,30,0.24)',
            flexShrink: 0,
            /* Barely-there header tint — parchment shows through */
            background: 'rgba(0,0,0,0.06)',
            gap: 9,
          }}
        >
          {/* Left rule */}
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                'linear-gradient(90deg, transparent, rgba(180,138,30,0.55))',
            }}
          />
          <Diamond />

          {/* Centered title block */}
          <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 5px' }}>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(212,168,40,0.60)',
                fontFamily: 'var(--lh-guild-display, "Cinzel", serif)',
              }}
            >
              {subtitle}
            </p>
            <h2
              style={{
                margin: '1px 0 0',
                fontSize: 20,
                fontWeight: 700,
                /* Brighter amber — readable against the parchment-tinted dark */
                color: '#f5e070',
                letterSpacing: '0.07em',
                fontFamily: 'var(--lh-guild-display, "Cinzel", serif)',
                lineHeight: 1.1,
              }}
            >
              {title}
            </h2>
          </div>

          <Diamond />
          {/* Right rule */}
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                'linear-gradient(270deg, transparent, rgba(180,138,30,0.55))',
            }}
          />

          {/* Back button — parchment tab, top-right */}
          <button
            type="button"
            onClick={onBack}
            style={{
              flexShrink: 0,
              marginLeft: 5,
              padding: '5px 13px',
              background: 'rgba(212,168,40,0.13)',
              border: '1px solid rgba(212,168,40,0.40)',
              borderRadius: 2,
              color: '#d4a820',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'serif',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {backLabel}
          </button>
        </div>

        {/* Optional tab bar */}
        {tabs != null ? <div style={{ flexShrink: 0 }}>{tabs}</div> : null}

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {children}
        </div>

        {/* Optional footer */}
        {footer != null ? (
          <div
            style={{
              flexShrink: 0,
              borderTop: '1px solid rgba(180,138,30,0.20)',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </ScrollFrameStage>
  );
}
