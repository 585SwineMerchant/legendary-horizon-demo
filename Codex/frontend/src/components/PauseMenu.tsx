import { useCallback, useRef, useState, type ReactNode } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { useFocusOnOpen } from '../hooks/useFocusOnOpen';
import type { LhMotionPreference, LhTextScale } from '../lib/lhAccessibilityPrefs';
import { requestLhEmbedFullscreen } from '../lib/lhEmbedFullscreen';
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
  const [fullscreenHint, setFullscreenHint] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  useEscapeToClose(open, onResume);
  useFocusOnOpen(open, panelRef);

  const enterFullscreen = useCallback(async () => {
    setFullscreenHint(null);
    try {
      await requestLhEmbedFullscreen(document.getElementById('root') as HTMLElement | null);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('[LH fullscreen] pause-menu request succeeded');
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Could not enter full screen. The browser or host page may be blocking it.';
      setFullscreenHint(msg);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('[LH fullscreen] pause-menu request failed', { message: msg });
      }
    }
  }, []);

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
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={onResume}
            data-lh-autofocus
            data-lh-continue
          >
            Resume
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={() => void enterFullscreen()}>
            Enter Fullscreen
          </button>
          {fullscreenHint ? (
            <p className="lh-pause-access-hint" role="status">
              {fullscreenHint}
            </p>
          ) : null}
          <div className="lh-pause-section lh-pause-section--controls">
            <button
              type="button"
              className="lh-button lh-button--secondary lh-pause-controls-toggle"
              aria-expanded={controlsOpen}
              onClick={() => setControlsOpen((v) => !v)}
            >
              Controls
            </button>
            {controlsOpen ? (
            <dl className="lh-controls-list" aria-label="Controls">
              <div>
                <dt>Move</dt>
                <dd>Arrow keys</dd>
              </div>
              <div>
                <dt>Interact / speak</dt>
                <dd>E or Enter</dd>
              </div>
              <div>
                <dt>Face the Lost Echo</dt>
                <dd>Enter when prompted</dd>
              </div>
              <div>
                <dt>Action / attack</dt>
                <dd>A</dd>
              </div>
              <div>
                <dt>Sprint</dt>
                <dd>Hold R while moving</dd>
              </div>
              <div>
                <dt>Pause menu</dt>
                <dd>Space</dd>
              </div>
              <div>
                <dt>Continue / confirm</dt>
                <dd>Enter</dd>
              </div>
              <div>
                <dt>Save</dt>
                <dd>Pause → Save</dd>
              </div>
              <div>
                <dt>Fullscreen</dt>
                <dd>F (any time) or Pause → Enter Fullscreen</dd>
              </div>
              <div>
                <dt>Music on / off</dt>
                <dd>M</dd>
              </div>
            </dl>
            ) : null}
          </div>
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
