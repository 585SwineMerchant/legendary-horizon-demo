/**
 * BuildDebugStamp — in-game overlay showing build/environment diagnostics.
 *
 * Activated by appending `?lh_build_debug=1` to the URL (or in DEV mode always visible).
 * Shows: commit hash, build date, env mode, asset base path, save mode, map URL, backend mode.
 */

const WEBAPP_URL = import.meta.env.VITE_LH_APPS_SCRIPT_WEBAPP_URL;

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

type Props = {
  tileMapUrl?: string | null;
  mapVariant?: string | null;
};

export function BuildDebugStamp({ tileMapUrl, mapVariant }: Props) {
  const active =
    import.meta.env.DEV ||
    new URLSearchParams(window.location.search).get('lh_build_debug') === '1';

  if (!active) return null;

  const rows: { label: string; value: string }[] = [
    { label: 'commit',     value: __LH_BUILD_COMMIT__ },
    { label: 'built',      value: __LH_BUILD_DATE__ },
    { label: 'env',        value: __LH_BUILD_MODE__ },
    { label: 'base',       value: import.meta.env.BASE_URL },
    { label: 'save mode',  value: saveMode() },
    { label: 'backend',    value: backendMode() },
    { label: 'map url',    value: tileMapUrl ?? '—' },
    { label: 'map variant',value: mapVariant ?? '—' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 6,
        right: 6,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.82)',
        color: '#d4f7a0',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1.6,
        padding: '6px 10px',
        borderRadius: 4,
        border: '1px solid rgba(212,247,160,0.25)',
        pointerEvents: 'none',
        userSelect: 'none',
        maxWidth: 360,
      }}
      aria-hidden
    >
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: 'rgba(212,247,160,0.55)', minWidth: 76, textAlign: 'right', flexShrink: 0 }}>
            {label}
          </span>
          <span style={{ color: '#d4f7a0', wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
