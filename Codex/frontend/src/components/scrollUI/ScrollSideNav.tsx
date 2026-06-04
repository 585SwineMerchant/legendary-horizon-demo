/**
 * ScrollSideNav + ScrollSideNavButton
 *
 * Vertical medallion-button rails flanking the Scroll hub.
 *
 * Key implementation notes:
 *   - Buttons use <div role="button"> instead of <button> to completely
 *     bypass browser default button backgrounds/outlines/appearance.
 *     A plain div has no UA stylesheet background, so PNG transparency
 *     renders correctly in all browsers.
 *   - Hover/active effects are applied via CSS filter on the container
 *     (brightness + drop-shadow). drop-shadow follows the PNG's alpha
 *     channel, so it glows around the frame shape, not a bounding box.
 *   - Label is overlaid on the dark stone plaque (bottom ~35 % of image).
 *
 * Asset map:
 *   📜  Field Journal  → btn-field-journal.png
 *   ◈   Quest Log      → btn-quest-log.png
 *   ⚗   Satchel        → btn-satchel.png
 *   ⚑   World Atlas    → lh_world_atlas_button.png
 *   🔥  Make Camp      → lh_make camp button.png
 *   —   Return to Game → lh_return_to_game_button.png
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { NAV_BTN_ASSETS } from './scrollAssets';

// ── Asset map ─────────────────────────────────────────────────────────────

const MEDALLION_ASSET: Record<string, string> = {
  '📜': NAV_BTN_ASSETS.fieldJournal,
  '◈':  NAV_BTN_ASSETS.questLog,
  '⚗':  NAV_BTN_ASSETS.satchel,
  '⚑':  NAV_BTN_ASSETS.worldAtlas,
  '🔥': NAV_BTN_ASSETS.makeCamp,
};
const RETURN_TO_GAME_ASSET = NAV_BTN_ASSETS.returnToGame;

// ── Button dimensions  (≈ 20 % smaller than the original 164 × 192) ──────

const BTN_W = 132; // px
const BTN_H = 154; // px

// Label sits at bottom 22 % of image height → centres it in the plaque zone
// (plaque occupies approx y 57–92 %, centre at ~74.5 % = 25.5 % from bottom)
const LABEL_BOTTOM = '22%';

// ── Stone-tablet fallback (rendered when PNG is missing / fails to load) ─

const FALLBACK_RUNE: Record<string, string> = {
  '📜': 'M7 4h10v16H7z M10 4V2h4v2 M10 9h4 M10 12h4 M10 15h3',
  '◈':  'M12 4v3 M12 17v3 M4 12h3 M17 12h3 M12 12m-3.5 0a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0',
  '⚗':  'M9 10V8a3 3 0 016 0v2 M7 10c0-2 10-2 10 0l1 9H6z M9 14c0 2 6 2 6 0',
  '⚑':  'M12 4a8 8 0 100 16A8 8 0 0012 4z M4.9 8.5h14.2 M4.9 15.5h14.2 M12 4c-3 4-3 12 0 16 M12 4c3 4 3 12 0 16',
  '🔥': 'M12 19c-5 0-6-5-3-9 0 0 1 3 3 2-1-3 2-6 2-6s1 2 3 3c2-3 0-8 0-8 4 3 5 9 1 13-1 2-4 5-6 5z',
  '__':  'M6 20V9.5A6 6 0 0118 9.5V20 M4 20h16 M10 20v-6a2 2 0 014 0v6',
};

function TabletFallback({ label, icon }: { label: string; icon?: string }) {
  const [hovered, setHovered] = useState(false);
  const rune = FALLBACK_RUNE[icon ?? ''] ?? FALLBACK_RUNE['__'];
  const c = hovered ? '#f5d060' : 'rgba(200,150,35,0.85)';
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: BTN_W / 2, minHeight: BTN_H / 2,
        padding: '8px 6px 7px',
        background: hovered
          ? 'linear-gradient(175deg,rgba(30,18,6,0.98),rgba(18,10,3,0.99))'
          : 'linear-gradient(175deg,rgba(22,13,5,0.97),rgba(14,8,2,0.99))',
        border: `1.5px solid ${hovered ? 'rgba(210,155,35,0.80)' : 'rgba(155,105,22,0.55)'}`,
        borderRadius: 4, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s',
        boxShadow: `0 5px 22px rgba(0,0,0,0.78), 0 0 ${hovered ? 18 : 7}px rgba(180,118,18,${hovered ? 0.35 : 0.15})`,
        userSelect: 'none',
      }}
    >
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
        <path d={rune} fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ width: '70%', height: 1, background: `linear-gradient(90deg,transparent,rgba(180,130,30,${hovered ? 0.55 : 0.30}),transparent)` }} />
      <span style={{ color: hovered ? '#f9e898' : 'rgba(210,175,80,0.82)', fontFamily: 'var(--lh-guild-display,"Cinzel",serif)', fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

// ── Medallion button ──────────────────────────────────────────────────────

function MedallionButton({
  label,
  icon,
  assetUrl,
  onClick,
}: {
  label: string;
  icon?: string;
  assetUrl: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (imgError) return <TabletFallback label={label} icon={icon} />;

  return (
    // ── <div role="button"> completely avoids all browser button UA styles ──
    // A plain div has no default background, border, outline, or appearance.
    // Hover brightness/glow via CSS filter follows PNG alpha (not bounding box).
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        userSelect: 'none',
        transform: hovered ? 'scale(1.06) translateY(-4px)' : 'scale(1) translateY(0)',
        filter: hovered
          ? 'brightness(1.22) saturate(1.12) drop-shadow(0 0 14px rgba(255,170,0,0.72))'
          : 'drop-shadow(0 5px 10px rgba(0,0,0,0.68))',
        transition: 'transform 0.15s ease, filter 0.15s ease',
      }}
    >
      {/* Medallion PNG — transparent background shows through cleanly */}
      <img
        src={assetUrl}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Label overlaid on the dark stone plaque */}
      <span
        style={{
          position: 'absolute',
          bottom: LABEL_BOTTOM,
          left: '8%',
          right: '8%',
          textAlign: 'center',
          color: hovered ? '#fffbe0' : '#f5e8a8',
          fontFamily: 'var(--lh-guild-display, "Cinzel", serif)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1.25,
          textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.80)',
          transition: 'color 0.15s',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Public API ────────────────────────────────────────────────────────────

type LayoutRect = { left: number; top: number; width: number; height: number };

type NavBtnProps = {
  label: string;
  icon?: string;
  onClick?: () => void;
  primary?: boolean;
  /** When provided, button is absolutely positioned within the 16:9 scroll frame
   *  using this rect (on the 1280×720 reference grid). Calibrate via dev tool. */
  layoutRect?: LayoutRect;
  /** Required when layoutRect is used — the reference grid dimensions { w, h }. */
  scrollRef?: { w: number; h: number };
};

export function ScrollSideNavButton({ label, icon, onClick, layoutRect, scrollRef }: NavBtnProps) {
  if (!onClick) return null;

  const assetUrl = icon
    ? (MEDALLION_ASSET[icon] ?? null)
    : RETURN_TO_GAME_ASSET;

  // Wrap in absolute-positioned container when layout rect is provided
  const inner = assetUrl
    ? <MedallionButton label={label} icon={icon} assetUrl={assetUrl} onClick={onClick} />
    : <TabletFallback label={label} icon={icon} />;

  if (layoutRect && scrollRef) {
    return (
      <div
        style={{
          position: 'absolute',
          left:   `${(layoutRect.left   / scrollRef.w) * 100}%`,
          top:    `${(layoutRect.top    / scrollRef.h) * 100}%`,
          width:  `${(layoutRect.width  / scrollRef.w) * 100}%`,
          height: `${(layoutRect.height / scrollRef.h) * 100}%`,
          zIndex: 3,
          pointerEvents: 'auto',
        }}
      >
        {inner}
      </div>
    );
  }

  return inner;
}

// ── Rail wrapper ──────────────────────────────────────────────────────────

type Props = {
  side: 'left' | 'right';
  children: ReactNode;
};

export function ScrollSideNav({ side, children }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        [side]: '-1.2%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        zIndex: 3,
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>
  );
}
