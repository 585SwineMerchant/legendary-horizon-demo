type Props = {
  open: boolean;
  onResume: () => void;
  onOpenQuestLog: () => void;
  onOpenRealmAtlas?: () => void;
  onOpenWorldMap?: () => void;
  onSave: () => void;
  /** Milestone 9 — save + session history + exit ticket + Sheets exit_ticket_state. */
  onEndSession?: () => void;
  onQuitToTitle: () => void;
};

export function PauseMenu({
  open,
  onResume,
  onOpenQuestLog,
  onOpenRealmAtlas,
  onOpenWorldMap,
  onSave,
  onEndSession,
  onQuitToTitle,
}: Props) {
  if (!open) return null;

  return (
    <div className="lh-overlay lh-overlay--dim" role="dialog" aria-label="Pause menu">
      <div className="lh-panel lh-panel--pause">
        <h2 className="lh-heading-md lh-panel__title">Paused</h2>
        <div className="lh-stack">
          <button type="button" className="lh-button lh-button--primary" onClick={onResume}>
            Resume Journey
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={onOpenQuestLog}>
            Quest Log
          </button>
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
          <button type="button" className="lh-button lh-button--secondary" onClick={onSave}>
            Save Game
          </button>
          {onEndSession ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={onEndSession}>
              End session (save + exit ticket)
            </button>
          ) : null}
          <button type="button" className="lh-button lh-button--ghost" onClick={onQuitToTitle}>
            Quit to Title
          </button>
        </div>
      </div>
    </div>
  );
}
