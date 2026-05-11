import { useRef, type ReactNode } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { useFocusOnOpen } from '../hooks/useFocusOnOpen';
import type { LhMotionPreference, LhTextScale } from '../lib/lhAccessibilityPrefs';
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
  /** Music-only mute. Independent of `audioMuted`; SFX still play when only music is muted. */
  musicMuted: boolean;
  onMusicMutedChange: (v: boolean) => void;
};

type Props = {
  open: boolean;
  onResume: () => void;
  onOpenQuestLog: () => void;
  onOpenEnrollmentRune?: () => void;
  onOpenTrialOfTongues?: () => void;
  onOpenManifest?: () => void;
  onOpenOracleOfFate?: () => void;
  onOpenVaultOfRunes?: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenWorldMap?: () => void;
  charterWorldMapTooltip?: string;
  charterWorldMapHint?: string;
  onOpenInventory?: () => void;
  onSave: () => void;
  onEndSession?: () => void;
  onResearchWorksheets?: () => void;
  onQuitToTitle: () => void;
  displayPreferences?: PauseDisplayPreferences;
  classroomTools?: ClassroomToolHandlers | null;
  facilitatorTools?: ReactNode;
};

export function PauseMenu({
  open,
  onResume,
  onOpenQuestLog,
  onOpenRealmAtlas,
  onOpenInventory,
  onSave,
  displayPreferences,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeToClose(open, onResume);
  useFocusOnOpen(open, panelRef);

  if (!open) return null;

  const musicMuted = Boolean(displayPreferences?.musicMuted);
  const onMusicMutedChange = displayPreferences?.onMusicMutedChange;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div ref={panelRef} className="lh-panel lh-panel--pause">
        <h2 id="pause-title" className="lh-heading-md lh-panel__title">
          Paused
        </h2>

        <div className="lh-stack">
          <button type="button" className="lh-button lh-button--primary" onClick={onResume} data-lh-autofocus>
            Resume
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={onSave}>
            Save
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestLog}>
            Quest log
          </button>
          {onOpenInventory ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenInventory}>
              Inventory
            </button>
          ) : null}
          {onOpenRealmAtlas ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onOpenRealmAtlas}>
              World Atlas
            </button>
          ) : null}
          {onMusicMutedChange ? (
            <button
              type="button"
              className="lh-button lh-button--secondary"
              role="switch"
              aria-checked={musicMuted}
              aria-label={musicMuted ? 'Unmute background music' : 'Mute background music'}
              title="Mute background music. Sound effects continue to play."
              onClick={() => onMusicMutedChange(!musicMuted)}
            >
              {musicMuted ? 'Unmute music' : 'Mute music'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
