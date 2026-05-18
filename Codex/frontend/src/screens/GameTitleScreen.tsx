import { useState } from 'react';

import { publicAssetUrl } from '../lib/publicAssetUrl';

type Props = {
  onStart: () => void | Promise<void>;
  onResume: () => void | Promise<void>;
};

export function GameTitleScreen({ onStart, onResume }: Props) {
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
        <div className="lh-game-title__actions" aria-label="Game title actions">
          <button type="button" className="lh-button lh-button--primary" data-lh-continue onClick={() => choose('start')}>
            Start
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={() => choose('resume')}>
            Load game
          </button>
        </div>
      </div>
    </section>
  );
}
