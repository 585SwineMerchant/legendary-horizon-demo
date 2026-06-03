/**
 * ScrollSideNav + ScrollSideNavButton
 *
 * Vertical parchment-tab button rails that sit on the left/right scroll rollers
 * of the hub character sheet, replacing the bottom navigation row.
 *
 * Left group  → Field Journal, Quest Log, Satchel
 * Right group → World Atlas, Make Camp, Return to Game
 */

import type { ReactNode } from 'react';

// ── Parchment tab button styles ────────────────────────────────────────────

const BASE: React.CSSProperties = {
  width: 66,
  minHeight: 52,
  padding: '8px 5px',
  background: 'linear-gradient(160deg, rgba(238,210,136,0.93), rgba(210,172,74,0.91))',
  border: '1px solid rgba(106,68,10,0.72)',
  borderRadius: 3,
  color: '#1c0f00',
  fontFamily: 'serif',
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textAlign: 'center' as const,
  cursor: 'pointer',
  lineHeight: 1.25,
  boxShadow: '0 2px 10px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,242,175,0.50)',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  transition: 'transform 0.1s, box-shadow 0.1s',
};

const PRIMARY: React.CSSProperties = {
  ...BASE,
  background: 'linear-gradient(160deg, rgba(175,115,15,0.96), rgba(135,84,8,0.96))',
  color: '#fff5d6',
  border: '1px solid rgba(85,52,6,0.85)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,200,60,0.32)',
};

type NavBtnProps = {
  label: string;
  icon?: string;
  onClick?: () => void;
  primary?: boolean;
};

export function ScrollSideNavButton({ label, icon, onClick, primary }: NavBtnProps) {
  if (!onClick) return null;
  return (
    <button type="button" onClick={onClick} style={primary ? PRIMARY : BASE}>
      {icon ? (
        <span style={{ fontSize: 15, lineHeight: 1, display: 'block' }} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
    </button>
  );
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
        [side]: '1.2%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 3,
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>
  );
}
