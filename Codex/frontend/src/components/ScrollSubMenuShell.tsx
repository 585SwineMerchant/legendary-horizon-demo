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
import {
  SUBMENU_SCROLL_LAYOUT,
  SUBMENU_SCROLL_REF,
  toSubmenuOverlayCss,
} from './scrollUI/scrollSubmenuLayout';
import { ScrollLayoutCalibrator } from './scrollUI/ScrollLayoutCalibrator';

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
  children,
  zIndex = 8800,
  ariaLabel,
}: ScrollSubMenuShellProps) {
  return (
    <ScrollFrameStage zIndex={zIndex} variant="submenu">
      {/*
       * Content panel — positioned by SUBMENU_SCROLL_LAYOUT.contentPanel.
       * Tune via ?lh_scroll_layout_debug=1 → SUBMENU SHELL calibrator,
       * then paste updated JSON back into scrollSubmenuLayout.ts.
       */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        style={{
          ...toSubmenuOverlayCss(SUBMENU_SCROLL_LAYOUT.contentPanel),
          background: 'rgba(6,3,1,0.46)',
          border: '1px solid rgba(180,138,30,0.55)',
          borderRadius: 2,
          boxShadow: '0 6px 36px rgba(0,0,0,0.55), inset 0 0 100px rgba(160,95,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e8dcc8',
        }}
      >
        {/* ── Header — fully centered Cinzel title + decorative rules ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '9px 20px 8px',
            borderBottom: '1px solid rgba(180,138,30,0.24)',
            flexShrink: 0,
            background: 'rgba(0,0,0,0.06)',
            gap: 9,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(180,138,30,0.55))' }} />
          <Diamond />
          <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 5px' }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(212,168,40,0.80)', fontFamily: 'var(--lh-guild-display, "Cinzel", serif)' }}>
              {subtitle}
            </p>
            <h2 style={{ margin: '1px 0 0', fontSize: 20, fontWeight: 700, color: '#f5e070', letterSpacing: '0.07em', fontFamily: 'var(--lh-guild-display, "Cinzel", serif)', lineHeight: 1.1 }}>
              {title}
            </h2>
          </div>
          <Diamond />
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(180,138,30,0.55))' }} />
        </div>

        {/* Optional tab bar — centered */}
        {tabs != null ? (
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {tabs}
          </div>
        ) : null}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {children}
        </div>
      </div>

      {/* ── Back button — floating at calibrated position on the scroll stage ── */}
      {/* Position driven by SUBMENU_SCROLL_LAYOUT.backButton. Sits outside       */}
      {/* the content panel so it does not displace the header layout.            */}
      <button
        type="button"
        onClick={onBack}
        style={{
          ...toSubmenuOverlayCss(SUBMENU_SCROLL_LAYOUT.backButton),
          zIndex: zIndex + 10,
          padding: '0',
          background: 'rgba(212,168,40,0.13)',
          border: '1px solid rgba(212,168,40,0.40)',
          borderRadius: 2,
          color: '#d4a820',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'serif',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {backLabel}
      </button>

      {/* DEV ONLY — submenu layout calibration. Activate with ?lh_scroll_layout_debug=1 */}
      <ScrollLayoutCalibrator
        scrollLayout={SUBMENU_SCROLL_LAYOUT}
        scrollRef={SUBMENU_SCROLL_REF}
        layoutLabel="SUBMENU SHELL"
        jsonTarget="SUBMENU_SCROLL_LAYOUT"
      />
    </ScrollFrameStage>
  );
}
