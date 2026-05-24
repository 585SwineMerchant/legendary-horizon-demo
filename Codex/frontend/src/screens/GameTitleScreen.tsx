import { useState } from 'react';

import { publicAssetUrl } from '../lib/publicAssetUrl';

type MapVariant = 'current' | 'stable';

type Props = {
  onStart: () => void | Promise<void>;
  onResume: () => void | Promise<void>;
  mapVariant: MapVariant;
  onMapVariantChange: (v: MapVariant) => void;
  stableMapLoading?: boolean;
  stableMapError?: string | null;
};

export function GameTitleScreen({
  onStart,
  onResume,
  mapVariant,
  onMapVariantChange,
  stableMapLoading = false,
  stableMapError,
}: Props) {
  const [exiting, setExiting] = useState<'start' | 'resume' | null>(null);

  const choose = (mode: 'start' | 'resume') => {
    if (exiting) return;
    setExiting(mode);
    window.setTimeout(() => {
      void (async () => {
        if (mode === 'start') await onStart();
        else await onResume();
      })();
    }, 760);
  };

  return (
    <section className={`lh-screen lh-screen--game-title${exiting ? ' lh-screen--game-title-exit' : ''}`}>
      <div className="lh-game-title__veil" aria-hidden />
      <div className="lh-game-title__content">
        <img
          className="lh-game-title__logo"
          src={publicAssetUrl('assets/ui/lh_title_logo.png')}
          alt="Legendary Horizon"
        />

        {/* Map variant selector — only visible to the developer */}
        <div className="lh-game-title__map-selector" role="group" aria-label="Map variant">
          <span className="lh-game-title__map-selector-label">Map:</span>
          <button
            type="button"
            className={`lh-button${mapVariant === 'current' ? ' lh-button--primary' : ' lh-button--secondary'}`}
            aria-pressed={mapVariant === 'current'}
            onClick={() => onMapVariantChange('current')}
          >
            Current
          </button>
          <button
            type="button"
            className={`lh-button${mapVariant === 'stable' ? ' lh-button--primary' : ' lh-button--secondary'}`}
            aria-pressed={mapVariant === 'stable'}
            onClick={() => onMapVariantChange('stable')}
          >
            Stable
            {mapVariant === 'stable' && stableMapLoading ? ' (loading…)' : ''}
          </button>
          {mapVariant === 'stable' && stableMapError ? (
            <span className="lh-game-title__map-selector-error" role="alert">
              {stableMapError}
            </span>
          ) : null}
        </div>

        <div className="lh-game-title__actions" aria-label="Game title actions">
          <button type="button" className="lh-button lh-button--primary" data-lh-continue onClick={() => choose('start')}>
            Start game
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={() => choose('resume')}>
            Load game
          </button>
        </div>
      </div>
    </section>
  );
}
