/**
 * ScrollLayoutCalibrator — DEV-ONLY draggable layout overlay for the Scroll hub.
 *
 * Activation (two conditions must both be true):
 *   1. import.meta.env.DEV === true  (Vite dev server only — stripped from prod builds)
 *   2. URL contains query param:  ?lh_scroll_layout_debug=1
 *
 * Usage:
 *   Open the game in dev mode, pause to open the Scroll hub, then add the param:
 *     http://localhost:5173/?lh_scroll_layout_debug=1
 *
 * Each colored box represents one SCROLL_LAYOUT zone.
 * • Drag the box body to move it.
 * • Drag the ↔↕ handle (bottom-right corner) to resize it.
 * • All values are on the 1280×720 reference grid — they match SCROLL_LAYOUT directly.
 *
 * Controls:
 *   "Copy Layout JSON"  → copies all zone values to clipboard as ready-to-paste JSON.
 *   "Reset"             → resets all boxes to the values passed in via props.
 *
 * The component is completely inert in production (returns null immediately).
 * No game save data is touched.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

type Rect = { left: number; top: number; width: number; height: number };

type Zone = {
  id: string;
  label: string;
  color: string;
  rect: Rect;
};

type Props = {
  /** The current SCROLL_LAYOUT object from ScrollOfDestinyDisplay. */
  scrollLayout: Record<string, Rect>;
  /** SCROLL_REF { w, h } — the pixel reference grid (typically 1280×720). */
  scrollRef: { w: number; h: number };
};

// ── Zone colour palette ───────────────────────────────────────────────────

const ZONE_COLORS: Record<string, string> = {
  portrait:   'rgba(168,85,247,0.45)',
  name:       'rgba(239,68,68,0.45)',
  leftCol:    'rgba(59,130,246,0.45)',
  center:     'rgba(16,185,129,0.45)',
  rightCol:   'rgba(245,158,11,0.45)',
  sigil1:     'rgba(252,211,77,0.50)',
  sigil2:     'rgba(252,211,77,0.50)',
  sigil3:     'rgba(252,211,77,0.50)',
};
const DEFAULT_COLOR = 'rgba(156,163,175,0.45)';

// ── Helpers ───────────────────────────────────────────────────────────────

function zonesFromLayout(layout: Record<string, Rect>): Zone[] {
  return Object.entries(layout).map(([id, rect]) => ({
    id,
    label: id,
    color: ZONE_COLORS[id] ?? DEFAULT_COLOR,
    rect: { ...rect },
  }));
}

function roundRect(r: Rect): Rect {
  return {
    left:   Math.round(r.left),
    top:    Math.round(r.top),
    width:  Math.max(10, Math.round(r.width)),
    height: Math.max(10, Math.round(r.height)),
  };
}

// ── Component ─────────────────────────────────────────────────────────────

export function ScrollLayoutCalibrator({ scrollLayout, scrollRef }: Props) {
  // Strip immediately in production — no tree overhead
  if (!import.meta.env.DEV) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [active] = useState(() =>
    new URLSearchParams(window.location.search).get('lh_scroll_layout_debug') === '1',
  );

  if (!active) return null;

  // Safe to use hooks unconditionally from here — active is fixed for the session
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return <CalibratorInner scrollLayout={scrollLayout} scrollRef={scrollRef} />;
}

// ── Inner (only mounted when active) ─────────────────────────────────────

type DragState = {
  zoneId: string;
  type: 'move' | 'resize';
  startMouseX: number;
  startMouseY: number;
  startRect: Rect;
};

function CalibratorInner({ scrollLayout, scrollRef }: Props) {
  const [zones, setZones] = useState<Zone[]>(() => zonesFromLayout(scrollLayout));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert mouse delta → reference-grid px
  const mouseDeltaToRef = useCallback(
    (dxPx: number, dyPx: number): { dx: number; dy: number } => {
      const el = containerRef.current;
      if (!el) return { dx: 0, dy: 0 };
      const { width, height } = el.getBoundingClientRect();
      return {
        dx: (dxPx / width)  * scrollRef.w,
        dy: (dyPx / height) * scrollRef.h,
      };
    },
    [scrollRef],
  );

  // Global mousemove while dragging
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const { dx, dy } = mouseDeltaToRef(
        e.clientX - drag.startMouseX,
        e.clientY - drag.startMouseY,
      );
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== drag.zoneId) return z;
          const s = drag.startRect;
          if (drag.type === 'move') {
            return { ...z, rect: roundRect({ ...s, left: s.left + dx, top: s.top + dy }) };
          } else {
            return { ...z, rect: roundRect({ ...s, width: s.width + dx, height: s.height + dy }) };
          }
        }),
      );
    };
    const onUp = () => setDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, mouseDeltaToRef]);

  const startDrag = useCallback(
    (e: React.MouseEvent, zoneId: string, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      setDrag({
        zoneId,
        type,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startRect: { ...zone.rect },
      });
    },
    [zones],
  );

  const copyJson = useCallback(() => {
    const out: Record<string, Rect> = {};
    zones.forEach((z) => { out[z.id] = z.rect; });
    const json = JSON.stringify(out, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [zones]);

  const reset = useCallback(() => setZones(zonesFromLayout(scrollLayout)), [scrollLayout]);

  return (
    /* Sits inside the 16:9 scroll frame as an absolute child — same as content overlays */
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Zone boxes */}
      {visible && zones.map((zone) => {
        const { left, top, width, height } = zone.rect;
        const l = `${(left   / scrollRef.w) * 100}%`;
        const t = `${(top    / scrollRef.h) * 100}%`;
        const w = `${(width  / scrollRef.w) * 100}%`;
        const h = `${(height / scrollRef.h) * 100}%`;
        return (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: l, top: t, width: w, height: h,
              background: zone.color,
              border: '1.5px dashed rgba(255,255,255,0.75)',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
              cursor: drag?.zoneId === zone.id && drag.type === 'move' ? 'grabbing' : 'grab',
              overflow: 'visible',
            }}
            onMouseDown={(e) => startDrag(e, zone.id, 'move')}
          >
            {/* Zone label */}
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: 3,
                fontSize: 9,
                fontFamily: 'monospace',
                color: '#fff',
                background: 'rgba(0,0,0,0.55)',
                padding: '1px 4px',
                borderRadius: 2,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {zone.label}
            </span>

            {/* Coordinate readout */}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                left: 3,
                fontSize: 8,
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(0,0,0,0.55)',
                padding: '1px 4px',
                borderRadius: 2,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {`${Math.round(left)},${Math.round(top)} ${Math.round(width)}×${Math.round(height)}`}
            </span>

            {/* Resize handle — bottom-right */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                background: 'rgba(255,255,255,0.85)',
                cursor: 'se-resize',
                borderTopLeftRadius: 3,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => startDrag(e, zone.id, 'resize')}
            />
          </div>
        );
      })}

      {/* Control panel — pinned to top-left of the 16:9 frame */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          pointerEvents: 'auto',
          zIndex: 10000,
        }}
      >
        {/* Header badge */}
        <div style={{
          background: 'rgba(0,0,0,0.82)',
          border: '1px solid rgba(252,211,77,0.6)',
          borderRadius: 4,
          padding: '3px 8px',
          fontSize: 9,
          fontFamily: 'monospace',
          color: 'rgba(252,211,77,0.9)',
          letterSpacing: '0.08em',
        }}>
          SCROLL LAYOUT CALIBRATOR — DEV ONLY
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { label: copied ? '✓ Copied!' : 'Copy Layout JSON', action: copyJson, accent: true },
            { label: 'Reset', action: reset, accent: false },
            { label: visible ? 'Hide Zones' : 'Show Zones', action: () => setVisible((v) => !v), accent: false },
          ].map(({ label, action, accent }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              style={{
                padding: '4px 10px',
                fontSize: 10,
                fontFamily: 'monospace',
                background: accent ? 'rgba(252,211,77,0.88)' : 'rgba(40,40,40,0.88)',
                color: accent ? '#1a1200' : '#e5e7eb',
                border: accent ? '1px solid #b8860b' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 3,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Hint */}
        <div style={{
          fontSize: 8,
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.4,
        }}>
          Drag box → move &nbsp;|&nbsp; Drag □ → resize &nbsp;|&nbsp; Copy JSON → paste into SCROLL_LAYOUT
        </div>
      </div>
    </div>
  );
}
