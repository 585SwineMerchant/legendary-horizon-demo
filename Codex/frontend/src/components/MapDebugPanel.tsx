import { useId, useState } from 'react';

import { formatParsedMapForDebug } from '../maps/mapLoader';
import type { ParsedLhMap } from '../maps/parseLhTiledMap';

type Props = {
  parsedMap: ParsedLhMap;
  loadErrors: string[];
};

export function MapDebugPanel({ parsedMap, loadErrors }: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="lh-map-debug">
      <button
        type="button"
        className="lh-button lh-button--ghost lh-map-debug__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide' : 'Show'} map debug
      </button>
      {open ? (
        <div id={panelId} className="lh-map-debug__panel" role="region" aria-label="Parsed Tiled map structures">
          {loadErrors.length ? (
            <p className="lh-map-debug__errors">
              <strong>Load errors:</strong> {loadErrors.join(' · ')}
            </p>
          ) : null}
          {parsedMap.parse_warnings.length ? (
            <p className="lh-map-debug__warnings">
              <strong>Warnings:</strong> {parsedMap.parse_warnings.join(' · ')}
            </p>
          ) : null}
          <pre className="lh-map-debug__pre">{formatParsedMapForDebug(parsedMap)}</pre>
        </div>
      ) : null}
    </div>
  );
}
