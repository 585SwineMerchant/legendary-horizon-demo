/**
 * ScrollFrameStage — the shared 16:9 atmospheric stage used by every scroll screen.
 *
 * Renders a dark radial-gradient vignette, a centered 16:9 scroll image, and
 * a watermark. Children are positioned absolutely inside the 16:9 container,
 * so callers can place overlays using % coordinates.
 *
 * variant="hub"     → Traveler's Manifest artwork (main character-sheet scroll)
 * variant="submenu" → blank scroll for Quest Log / Satchel / Field Journal
 *                     Falls back to the hub image until the asset is dropped in.
 */

import type { ReactNode } from 'react';
import { SCROLL_ASSETS } from './scrollAssets';

type Props = {
  children: ReactNode;
  zIndex?: number;
  variant?: 'hub' | 'submenu';
};

export function ScrollFrameStage({ children, zIndex = 8500, variant = 'hub' }: Props) {
  const imgSrc = variant === 'submenu' ? SCROLL_ASSETS.submenu : SCROLL_ASSETS.hub;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background:
          'radial-gradient(ellipse at center, rgba(6,4,2,0.88) 0%, rgba(2,1,0,0.97) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
      }}
    >
      {/* ── 16:9 frame — scales to fit the viewport while keeping aspect ratio ── */}
      <div
        style={{
          position: 'relative',
          width: 'min(100vw, calc(100vh * 16 / 9))',
          height: 'min(100vh, calc(100vw * 9 / 16))',
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        {/* Scroll artwork */}
        <img
          src={imgSrc}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            // Blank scroll not yet added → fall back to hub image gracefully
            if (variant === 'submenu') {
              (e.target as HTMLImageElement).src = SCROLL_ASSETS.hub;
            }
          }}
        />

        {/* All children are absolutely positioned inside this 16:9 box */}
        {children}
      </div>

      {/* Watermark below the 16:9 frame */}
      <p
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(212,160,23,0.28)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        Legendary Horizon · Scroll of Destiny
      </p>
    </div>
  );
}
