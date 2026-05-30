/**
 * ResolveBar — compact HUD element showing the Traveler's current Resolve.
 *
 * Shown as a horizontal bar overlaid on the Phaser exploration view.
 * Uses in-world language: "Resolve" (never "HP" or "health").
 *
 * States:
 *  - Normal (> 50%): green bar
 *  - Cautious (25–50%): amber bar
 *  - Shaken (< 25%): red bar + "Shaken" label
 *  - Overwhelmed (0): red bar + "Overwhelmed" label, pulsing
 */

import type { PlayerSave } from '../domain/lh-contract';
import {
  getPlayerResolve,
  getPlayerResolveMax,
  resolveBarColor,
  resolveStatusLabel,
  isOverwhelmed,
} from '../services/resolveSystem';
import { getRestedReadinessConfig } from '../services/restedReadiness';

type Props = {
  player: PlayerSave;
  /** When true, renders in compact mode (Phaser HUD overlay). */
  compact?: boolean;
};

export function ResolveBar({ player, compact = false }: Props) {
  const current = getPlayerResolve(player);
  const max = getPlayerResolveMax(player);
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = resolveBarColor(player);
  const statusLabel = resolveStatusLabel(player);
  const overwhelmed = isOverwhelmed(player);

  const tier = player.rested_readiness_tier;
  const rrConfig = tier ? getRestedReadinessConfig(tier) : null;

  if (compact) {
    return (
      <div
        className={`lh-resolve-bar lh-resolve-bar--compact${overwhelmed ? ' lh-resolve-bar--overwhelmed' : ''}`}
        role="status"
        aria-label={`Resolve: ${current} of ${max}${statusLabel ? `, ${statusLabel}` : ''}`}
      >
        <div className="lh-resolve-bar__track">
          <div
            className="lh-resolve-bar__fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="lh-resolve-bar__label">
          {statusLabel || `${current}/${max}`}
        </span>
        {rrConfig && rrConfig.tier !== 'restless' ? (
          <span
            className="lh-resolve-bar__rr-badge"
            title={`${rrConfig.label} — ×${rrConfig.multiplier.toFixed(2)} XP`}
            style={{ color: rrConfig.badge_color }}
          >
            {rrConfig.badge_text}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`lh-resolve-bar${overwhelmed ? ' lh-resolve-bar--overwhelmed' : ''}`}
      role="status"
      aria-label={`Resolve: ${current} of ${max}${statusLabel ? `, ${statusLabel}` : ''}`}
    >
      <div className="lh-resolve-bar__header">
        <span className="lh-resolve-bar__title">Resolve</span>
        <span className="lh-resolve-bar__fraction">{current}/{max}</span>
        {statusLabel ? (
          <span className="lh-resolve-bar__status">{statusLabel}</span>
        ) : null}
      </div>
      <div className="lh-resolve-bar__track">
        <div
          className="lh-resolve-bar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {rrConfig && rrConfig.tier !== 'restless' ? (
        <div className="lh-resolve-bar__rr-row">
          <span style={{ color: rrConfig.badge_color, fontSize: 11, letterSpacing: '0.04em' }}>
            {rrConfig.badge_text} {rrConfig.label} — ×{rrConfig.multiplier.toFixed(2)} XP
          </span>
        </div>
      ) : null}
    </div>
  );
}
