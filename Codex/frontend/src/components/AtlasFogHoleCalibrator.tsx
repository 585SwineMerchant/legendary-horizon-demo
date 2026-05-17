import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';

import {
  fogHoleOverridesOnly,
  formatFogHolePctForSource,
  writeFogHoleOverridesToStorage,
  type AtlasFogHolePct,
} from '../realm/atlasFogHoles';
import type { RealmDefinition } from '../types';

type Props = {
  realms: readonly RealmDefinition[];
  selectedRealmId: string;
  onSelectRealmId: (id: string) => void;
  placements: Record<string, AtlasFogHolePct>;
  previewAllHoles: boolean;
  onPreviewAllHolesChange: (v: boolean) => void;
  calibrateActive: boolean;
  onCalibrateActiveChange: (v: boolean) => void;
};

function clampPanelPosition(x: number, y: number, width: number, height: number) {
  const margin = 8;
  return {
    x: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
    y: Math.max(margin, Math.min(y, window.innerHeight - height - margin)),
  };
}

export function AtlasFogHoleCalibrator({
  realms,
  selectedRealmId,
  onSelectRealmId,
  placements,
  previewAllHoles,
  onPreviewAllHolesChange,
  calibrateActive,
  onCalibrateActiveChange,
}: Props) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => realms.find((r) => r.realm_id === selectedRealmId) ?? realms[0],
    [realms, selectedRealmId],
  );

  const selectedPlacement = selected ? placements[selected.realm_id] : undefined;

  const panelStyle = useMemo((): CSSProperties | undefined => {
    if (!panelPos) return undefined;
    return { left: panelPos.x, top: panelPos.y, right: 'auto', bottom: 'auto', transform: 'none' };
  }, [panelPos]);

  const onDragHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const panel = panelRef.current;
      if (!panel) return;
      e.preventDefault();
      const rect = panel.getBoundingClientRect();
      const originX = panelPos?.x ?? rect.left;
      const originY = panelPos?.y ?? rect.top;
      const startX = e.clientX;
      const startY = e.clientY;
      if (!panelPos) {
        setPanelPos({ x: originX, y: originY });
      }

      const onMove = (ev: PointerEvent) => {
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        const next = clampPanelPosition(originX + ev.clientX - startX, originY + ev.clientY - startY, w, h);
        setPanelPos(next);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [panelPos],
  );

  const copySource = useCallback(async () => {
    const text = formatFogHolePctForSource(placements);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Copied TypeScript to clipboard — paste into atlasFogHoles.ts');
    } catch {
      setCopyStatus(text);
    }
  }, [placements]);

  const saveLocal = useCallback(() => {
    writeFogHoleOverridesToStorage(fogHoleOverridesOnly(placements));
    setCopyStatus('Saved overrides to localStorage (this browser).');
  }, [placements]);

  return (
    <div
      ref={panelRef}
      className="lh-atlas-fog-calibrator"
      style={panelStyle}
      role="region"
      aria-label="Fog hole placement tool"
    >
      <div
        className="lh-atlas-fog-calibrator__drag-handle"
        onPointerDown={onDragHandlePointerDown}
        title="Drag to move this panel"
      >
        <span className="lh-atlas-fog-calibrator__drag-grip" aria-hidden="true">
          ⋮⋮
        </span>
        <p className="lh-atlas-fog-calibrator__title">Fog hole placement</p>
        <span className="lh-atlas-fog-calibrator__drag-hint">Drag</span>
      </div>
      <p className="lh-atlas-fog-calibrator__hint">
        Choose a realm, turn on placement mode, then click the map where the mist should clear. This is separate from the
        amber HQ pin — you are setting the reveal center.
      </p>
      <label className="lh-atlas-fog-calibrator__row">
        <span>Realm</span>
        <select
          value={selected?.realm_id ?? ''}
          onChange={(e) => onSelectRealmId(e.target.value)}
          className="lh-atlas-fog-calibrator__select"
        >
          {realms.map((r) => (
            <option key={r.realm_id} value={r.realm_id}>
              {r.display_name}
            </option>
          ))}
        </select>
      </label>
      {selectedPlacement ? (
        <p className="lh-atlas-fog-calibrator__coords">
          {selected?.display_name}: {selectedPlacement.leftPct.toFixed(2)}% left,{' '}
          {selectedPlacement.topPct.toFixed(2)}% top
        </p>
      ) : (
        <p className="lh-atlas-fog-calibrator__coords">No placement yet — click the map.</p>
      )}
      <label className="lh-atlas-fog-calibrator__check">
        <input
          type="checkbox"
          checked={calibrateActive}
          onChange={(e) => onCalibrateActiveChange(e.target.checked)}
        />
        Click map to place selected realm
      </label>
      <label className="lh-atlas-fog-calibrator__check">
        <input
          type="checkbox"
          checked={previewAllHoles}
          onChange={(e) => onPreviewAllHolesChange(e.target.checked)}
        />
        Preview all placed holes in fog
      </label>
      <div className="lh-atlas-fog-calibrator__actions">
        <button type="button" className="lh-button lh-button--secondary" onClick={() => void copySource()}>
          Copy for atlasFogHoles.ts
        </button>
        <button type="button" className="lh-button lh-button--secondary" onClick={saveLocal}>
          Save in browser
        </button>
      </div>
      {copyStatus ? (
        <textarea className="lh-atlas-fog-calibrator__export" readOnly value={copyStatus} rows={4} />
      ) : null}
    </div>
  );
}
