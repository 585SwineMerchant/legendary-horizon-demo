import { type ReactNode, useRef } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { useFocusOnOpen } from '../hooks/useFocusOnOpen';
import type { LhMotionPreference, LhTextScale } from '../lib/lhAccessibilityPrefs';
import { ClassroomToolsButtonRow } from './ClassroomToolsButtonRow';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';

export type PauseDisplayPreferences = {
  textScale: LhTextScale;
  onTextScaleChange: (v: LhTextScale) => void;
  motion: LhMotionPreference;
  onMotionChange: (v: LhMotionPreference) => void;
  lowClutter: boolean;
  onLowClutterChange: (v: boolean) => void;
  audioMuted: boolean;
  onAudioMutedChange: (v: boolean) => void;
};

type Props = {
  open: boolean;
  onResume: () => void;
  onOpenQuestLog: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenWorldMap?: () => void;
  onOpenInventory?: () => void;
  onSave: () => void;
  /** Milestone 9 — save + session history + exit ticket + Sheets exit_ticket_state. */
  onEndSession?: () => void;
  /** Milestone 11 — research worksheets overlay. */
  onResearchWorksheets?: () => void;
  onQuitToTitle: () => void;
  /** Milestone 13 — text, motion, density, audio placeholders. */
  displayPreferences?: PauseDisplayPreferences;
  /** Milestone 15 — O*NET, Maia, Gmail exit ticket, Slides, Forms, Quizlet, Classroom. */
  classroomTools?: ClassroomToolHandlers | null;
  /** Milestone 18 — facilitator rescue tools (Web App + local sim). */
  facilitatorTools?: ReactNode;
};

export function PauseMenu({
  open,
  onResume,
  onOpenQuestLog,
  onOpenRealmAtlas,
  onOpenWorldMap,
  onOpenInventory,
  onSave,
  onEndSession,
  onResearchWorksheets,
  onQuitToTitle,
  displayPreferences,
  classroomTools,
  facilitatorTools,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeToClose(open, onResume);
  useFocusOnOpen(open, panelRef);

  if (!open) return null;

  const dp = displayPreferences;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div ref={panelRef} className="lh-panel lh-panel--pause">
        <h2 id="pause-title" className="lh-heading-md lh-panel__title">
          Paused
        </h2>

        <div className="lh-pause-sections">
          <section className="lh-pause-section" aria-label="Game">
            <h3 className="lh-pause-section__label">Game</h3>
            <div className="lh-stack">
              <button type="button" className="lh-button lh-button--primary" onClick={onResume} data-lh-autofocus>
                Resume journey
              </button>
              <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestLog}>
                Quest log
              </button>
              {onOpenInventory ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onOpenInventory}>
                  Inventory
                </button>
              ) : null}
            </div>
          </section>

          <section className="lh-pause-section" aria-label="Journal and reference">
            <h3 className="lh-pause-section__label">Journal & reference</h3>
            <div className="lh-stack">
              {onOpenRealmAtlas ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onOpenRealmAtlas}>
                  Realm atlas
                </button>
              ) : null}
              {onOpenWorldMap ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onOpenWorldMap}>
                  World map
                </button>
              ) : null}
              {onResearchWorksheets ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onResearchWorksheets}>
                  Research worksheets
                </button>
              ) : null}
            </div>
          </section>

          <section className="lh-pause-section" aria-label="Session and save">
            <h3 className="lh-pause-section__label">Session</h3>
            <div className="lh-stack">
              <button type="button" className="lh-button lh-button--secondary" onClick={onSave}>
                Save game
              </button>
              {onEndSession ? (
                <button type="button" className="lh-button lh-button--secondary" onClick={onEndSession}>
                  End session (save + exit ticket)
                </button>
              ) : null}
              <button type="button" className="lh-button lh-button--ghost" onClick={onQuitToTitle}>
                Quit to title
              </button>
            </div>
          </section>

          {classroomTools ? (
            <section className="lh-pause-section lh-pause-section--classroom" aria-label="Classroom tools">
              <h3 className="lh-pause-section__label">Classroom tools</h3>
              <p className="lh-pause-tools__hint">
                Opens in a new tab. Your facilitator can set school-specific links with <code className="lh-code-inline">VITE_LH_*</code> env vars in the deploy.
              </p>
              <ClassroomToolsButtonRow handlers={classroomTools} layout="pause" />
            </section>
          ) : null}

          {facilitatorTools}

          {dp ? (
            <section className="lh-pause-section lh-pause-section--display" aria-label="Display and sound">
              <h3 className="lh-pause-section__label">Display & sound</h3>
              <fieldset className="lh-a11y-fieldset">
                <legend className="lh-a11y-legend">Text size</legend>
                <div className="lh-a11y-segment" role="radiogroup" aria-label="Text size">
                  {(['default', 'large', 'xlarge'] as const).map((v) => (
                    <label key={v} className="lh-a11y-radio">
                      <input
                        type="radio"
                        name="lh-text-scale"
                        checked={dp.textScale === v}
                        onChange={() => dp.onTextScaleChange(v)}
                      />
                      {v === 'default' ? 'Default' : v === 'large' ? 'Large' : 'Larger'}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="lh-a11y-fieldset">
                <legend className="lh-a11y-legend">Motion</legend>
                <div className="lh-a11y-segment" role="radiogroup" aria-label="Animation preference">
                  <label className="lh-a11y-radio">
                    <input
                      type="radio"
                      name="lh-motion"
                      checked={dp.motion === 'system'}
                      onChange={() => dp.onMotionChange('system')}
                    />
                    Match device
                  </label>
                  <label className="lh-a11y-radio">
                    <input
                      type="radio"
                      name="lh-motion"
                      checked={dp.motion === 'reduce'}
                      onChange={() => dp.onMotionChange('reduce')}
                    />
                    Reduce
                  </label>
                  <label className="lh-a11y-radio">
                    <input
                      type="radio"
                      name="lh-motion"
                      checked={dp.motion === 'allow'}
                      onChange={() => dp.onMotionChange('allow')}
                    />
                    Full motion
                  </label>
                </div>
              </fieldset>
              <label className="lh-a11y-toggle">
                <input type="checkbox" checked={dp.lowClutter} onChange={(e) => dp.onLowClutterChange(e.target.checked)} />
                Compact layout (fewer hints on map)
              </label>
              <label className="lh-a11y-toggle">
                <input
                  type="checkbox"
                  checked={dp.audioMuted}
                  onChange={(e) => dp.onAudioMutedChange(e.target.checked)}
                />
                Keep future in-game audio muted (class mode)
              </label>
              <p className="lh-a11y-hint">Settings save on this device. Press Escape to resume.</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
