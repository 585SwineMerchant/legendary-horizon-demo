/**
 * scrollSubmenuLayout — pixel-grid constants for ScrollSubMenuShell layout.
 *
 * All values are on a 1280×720 reference grid (same as SCROLL_LAYOUT in
 * ScrollOfDestinyDisplay). toSubmenuOverlayCss() converts to %-based CSS
 * so the layout scales automatically at any viewport size.
 *
 * Live zone (drives actual CSS):
 *   contentPanel — the absolutely-positioned dialog that sits inside the
 *   blank scroll's ornamental border.
 *
 * Reference zones (informational — shown in the dev calibrator but not
 * wired to explicit CSS; their positions are determined by the flex-column
 * layout inside contentPanel):
 *   header, backButton, scrollableContent
 *
 * Deliberately omitted zones:
 *   footer — no submenu currently uses the footer prop; remove if one does
 *   tabs   — tabs are rendered inside JournalShell, not as a shell zone
 *
 * When to update these constants:
 *   1. Open the game in dev mode with ?lh_scroll_layout_debug=1
 *   2. Open any submenu (Quest Log, Satchel, Field Journal)
 *   3. Drag/resize zones with the SUBMENU SHELL calibrator overlay
 *   4. Click "Copy Layout JSON" and paste the result back here
 */

// ── Reference grid ────────────────────────────────────────────────────────

export const SUBMENU_SCROLL_REF = { w: 1280, h: 720 } as const;

// ── Layout zones ──────────────────────────────────────────────────────────

export type SubMenuRect = { left: number; top: number; width: number; height: number };

export const SUBMENU_SCROLL_LAYOUT: Record<string, SubMenuRect> = {
  // ── LIVE: drives position/size of the content panel div ───────────────
  // Calibrated 2026-06-03 via ?lh_scroll_layout_debug=1 (Field Journal / Satchel pass)
  // Quest Log values are within 1–3 px; shared constant covers both.
  contentPanel:       { left: 232, top: 146, width: 815, height: 473 },

  // ── REFERENCE: shown in calibrator, match to flex-column flow ─────────
  // header = subtitle eyebrow + Cinzel title + decorative rule padding
  header:             { left: 277, top: 147, width: 727, height:  55 },
  // backButton = parchment tab in the header row, right-aligned
  backButton:         { left: 892, top: 584, width: 108, height:  35 },
  // scrollableContent = flex:1 region below header (and tabs when present)
  scrollableContent:  { left: 244, top: 235, width: 792, height: 350 },
} as const;

// ── CSS helper ────────────────────────────────────────────────────────────

/**
 * Convert a SubMenuRect to absolute-% CSS, relative to the
 * 1280×720 reference grid inside the ScrollFrameStage container.
 * Only outputs position + size — merge the result with other style props.
 */
export function toSubmenuOverlayCss(r: SubMenuRect): React.CSSProperties {
  return {
    position: 'absolute',
    left:   `${(r.left   / SUBMENU_SCROLL_REF.w) * 100}%`,
    top:    `${(r.top    / SUBMENU_SCROLL_REF.h) * 100}%`,
    width:  `${(r.width  / SUBMENU_SCROLL_REF.w) * 100}%`,
    height: `${(r.height / SUBMENU_SCROLL_REF.h) * 100}%`,
  };
}
