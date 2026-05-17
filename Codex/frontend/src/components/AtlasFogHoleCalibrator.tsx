import { useCallback, useMemo, useState } from 'react';

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

  const selected = useMemo(
    () => realms.find((r) => r.realm_id === selectedRealmId) ?? realms[0],
    [realms, selectedRealmId],
  );

  const selectedPlacement = selected ? placements[selected.realm_id] : undefined;

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
    <div className="lh-atlas-fog-calibrator" role="region" aria-label="Fog hole placement tool">
        <p className="lh-atlas-fog-calibrator__title">Fog hole placement</p>
        <p className="lh-atlas-fog-calibrator__hint">
          Choose a realm, turn on placement mode, then click the map where the mist should clear. This is separate from
          the amber HQ pin — you are setting the reveal center.
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
