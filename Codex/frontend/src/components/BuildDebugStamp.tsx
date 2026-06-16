/**
 * BuildDebugStamp — in-game overlay showing build/environment diagnostics.
 *
 * Activated by appending `?lh_build_debug=1` to the URL (or always in DEV mode).
 *
 * Shows:
 *  - Commit hash, build date, env mode
 *  - window.location.href  (the actual serving URL — not the baked BASE_URL)
 *  - import.meta.env.BASE_URL  (baked at build time; "./" in singlefile builds)
 *  - document.baseURI  (real base used for relative URL resolution)
 *  - Save mode, backend mode, map URL, map variant
 *  - Per-asset probe: scroll bg, rune, nav button, sigil — ok/fail/pending
 */

import { useState, useEffect } from 'react';
import { SCROLL_ASSETS, RUNE_ASSETS, NAV_BTN_ASSETS } from './scrollUI/scrollAssets';
import { resolveLhAssetUrl } from '../lib/lhMediaBase';

const WEBAPP_URL = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL;

// Mirror the same resolution logic as OracleCinematicPlayer so the stamp is always in sync.
const ORACLE_VIDEO_SRC_STAMP: string =
  (import.meta.env.VITE_LH_ORACLE_VIDEO_URL as string | undefined)?.trim() ||
  '/assets/video/oracle_cutscene_v1.mp4';

function saveMode(): string {
  if (!WEBAPP_URL) return 'simulated (no Apps Script URL)';
  if (import.meta.env.VITE_LH_FORCE_SIMULATED_SAVE === 'true') return 'force-simulated';
  return 'remote → Apps Script';
}

function backendMode(): string {
  const spreadsheetId = import.meta.env.VITE_LH_SPREADSHEET_ID;
  if (!WEBAPP_URL) return 'offline / no backend';
  return spreadsheetId ? `sheet: ${spreadsheetId}` : 'no spreadsheet id';
}

// ── Asset probe ────────────────────────────────────────────────────────────

type ProbeStatus = 'pending' | 'ok' | 'fail';

interface AssetProbe {
  label: string;
  url: string;
  status: ProbeStatus;
}

async function headCheck(url: string): Promise<ProbeStatus> {
  // Skip data: or blob: URLs — they're inline and always "ok"
  if (/^(data:|blob:)/i.test(url)) return 'ok';
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok ? 'ok' : 'fail';
  } catch {
    return 'fail';
  }
}

// Key assets to probe (representative sample — scroll bg, one rune, one nav, sigil)
function buildProbeList(): Omit<AssetProbe, 'status'>[] {
  // Sigil uses a relative path (not through resolveLhAssetUrl) — normalise it here.
  const sigilUrl = (import.meta.env.BASE_URL as string).replace(/\/$/, '') + '/assets/oracle/prophecy_sigil.png';

  return [
    { label: 'scroll-bg',   url: SCROLL_ASSETS.hub },
    { label: 'rune-01',     url: RUNE_ASSETS['realm_aethelwood'] ?? '' },
    { label: 'nav-journal', url: NAV_BTN_ASSETS.fieldJournal },
    { label: 'sigil',       url: sigilUrl },
    { label: 'phaser-map',  url: resolveLhAssetUrl('assets/maps/Legendary_Horizon_Map.json') },
    { label: 'oracle-mp4',  url: ORACLE_VIDEO_SRC_STAMP },
  ].filter(p => !!p.url);
}

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  tileMapUrl?: string | null;
  mapVariant?: string | null;
};

export function BuildDebugStamp({ tileMapUrl, mapVariant }: Props) {
  const fullPanel =
    import.meta.env.DEV ||
    new URLSearchParams(window.location.search).get('lh_build_debug') === '1';
  // Keep the old name so the rest of the function compiles unchanged.
  const active = fullPanel;

  const [probes, setProbes] = useState<AssetProbe[]>(() =>
    buildProbeList().map(p => ({ ...p, status: 'pending' as ProbeStatus }))
  );

  useEffect(() => {
    if (!active) return;
    const list = buildProbeList();
    Promise.all(list.map(p => headCheck(p.url))).then(results => {
      setProbes(list.map((p, i) => ({ ...p, status: results[i] })));
    });
  }, [active]);

  if (!active) return null;

  const statusColor = (s: ProbeStatus) =>
    s === 'ok' ? '#6dff6d' : s === 'fail' ? '#ff6060' : '#aaa';
  const statusIcon  = (s: ProbeStatus) =>
    s === 'ok' ? '✓' : s === 'fail' ? '✗' : '…';

  const rows: { label: string; value: string; valueColor?: string }[] = [
    { label: 'commit',     value: __LH_BUILD_COMMIT__ },
    { label: 'built',      value: __LH_BUILD_DATE__ },
    { label: 'env',        value: __LH_BUILD_MODE__ },
    { label: 'href',       value: window.location.href },
    { label: 'BASE_URL',   value: import.meta.env.BASE_URL },
    { label: 'baseURI',    value: document.baseURI },
    { label: 'save mode',  value: saveMode() },
    { label: 'backend',    value: backendMode() },
    { label: 'oracle src', value: ORACLE_VIDEO_SRC_STAMP },
    { label: 'map url',    value: tileMapUrl ?? '—' },
    { label: 'map variant',value: mapVariant ?? '—' },
  ];

  // Always-visible compact chip: shows commit + date even in production.
  const miniStamp = (
    <div
      key="mini"
      style={{
        position: 'fixed',
        bottom: 6,
        left: 6,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.72)',
        color: 'rgba(212,247,160,0.80)',
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1.5,
        padding: '3px 7px',
        borderRadius: 3,
        border: '1px solid rgba(212,247,160,0.18)',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      aria-hidden
    >
      {`rev:${__LH_BUILD_COMMIT__} · ${__LH_BUILD_DATE__}`}
    </div>
  );

  if (!active) return miniStamp;

  return (
    <>
      {miniStamp}
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: 6,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.88)',
        color: '#d4f7a0',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1.6,
        padding: '6px 10px',
        borderRadius: 4,
        border: '1px solid rgba(212,247,160,0.25)',
        pointerEvents: 'none',
        userSelect: 'none',
        maxWidth: 420,
      }}
      aria-hidden
    >
      {/* Static rows */}
      {rows.map(({ label, value, valueColor }) => (
        <div key={label} style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: 'rgba(212,247,160,0.55)', minWidth: 84, textAlign: 'right', flexShrink: 0 }}>
            {label}
          </span>
          <span style={{ color: valueColor ?? '#d4f7a0', wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}

      {/* Asset probe section */}
      <div style={{ borderTop: '1px solid rgba(212,247,160,0.18)', marginTop: 4, paddingTop: 4 }}>
        <div style={{ color: 'rgba(212,247,160,0.45)', marginBottom: 2 }}>— asset probes —</div>
        {probes.map(p => (
          <div key={p.label} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ color: 'rgba(212,247,160,0.55)', minWidth: 84, textAlign: 'right', flexShrink: 0 }}>
              {p.label}
            </span>
            <span style={{ color: statusColor(p.status), flexShrink: 0 }}>
              {statusIcon(p.status)}
            </span>
            <span style={{ color: 'rgba(212,247,160,0.55)', wordBreak: 'break-all', fontSize: 9 }}>
              {p.url}
            </span>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
