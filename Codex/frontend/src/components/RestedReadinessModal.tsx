/**
 * RestedReadinessModal — shown at session start when the player has a
 * graded campfire reflection from a previous session.
 *
 * Displays the Rested Readiness tier, a wake-up message, and the XP
 * multiplier that will apply for this session.
 */

import type { RestedReadinessTier } from '../domain/lh-contract';
import {
  getRestedReadinessConfig,
  pickWakeUpMessage,
} from '../services/restedReadiness';

type Props = {
  tier: RestedReadinessTier;
  /** Index of the last shown message for this tier (for LRU rotation). */
  lastWakeIndex: number;
  onDismiss: () => void;
};

export function RestedReadinessModal({ tier, lastWakeIndex, onDismiss }: Props) {
  const config = getRestedReadinessConfig(tier);
  const { message } = pickWakeUpMessage(tier, lastWakeIndex);

  return (
    <div className="lh-rested-readiness-modal" role="dialog" aria-modal="true" aria-label="Rested Readiness">
      <div className="lh-rested-readiness-modal__card">
        <p className="lh-rested-readiness-modal__tier">{config.label}</p>

        <div
          className="lh-rested-readiness-modal__badge"
          aria-hidden
          style={{ color: config.badge_color }}
        >
          {config.badge_text || '—'}
        </div>

        <p className="lh-rested-readiness-modal__message">"{message}"</p>

        {config.tier !== 'restless' ? (
          <p className="lh-rested-readiness-modal__multiplier">
            XP multiplier this session: ×{config.multiplier.toFixed(2)}
          </p>
        ) : null}

        <button
          type="button"
          className="lh-rested-readiness-modal__dismiss"
          onClick={onDismiss}
        >
          Begin the session
        </button>
      </div>
    </div>
  );
}
