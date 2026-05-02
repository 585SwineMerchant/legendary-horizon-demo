type Props = {
  open: boolean;
  onResume: () => void;
  onOpenQuestLog: () => void;
  onSave: () => void;
  onQuitToTitle: () => void;
};

export function PauseMenu({ open, onResume, onOpenQuestLog, onSave, onQuitToTitle }: Props) {
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
          <button type="button" className="lh-button lh-button--secondary" onClick={onSave}>
            Save Game
          </button>
          <button type="button" className="lh-button lh-button--ghost" onClick={onQuitToTitle}>
            Quit to Title
          </button>
        </div>
      </div>
    </div>
  );
}
