type Props = {
  onBack: () => void;
  onStartSession: () => void;
};

export function InstructionsScreen({ onBack, onStartSession }: Props) {
  return (
    <section className="lh-screen">
      <div className="lh-panel lh-panel--sheet">
        <h2 className="lh-heading-lg">Instructions</h2>
        <ul className="lh-bullet-list">
          <li>You will load a demonstration save using local sample JSON—not live Sheets yet.</li>
          <li>
            Mentor voice lines hydrate portrait URLs via the{' '}
            <code className="lh-code-inline">services/assetCatalog</code> façade (fixture rows today → Drive-aware later).
          </li>
          <li>
            Exploration is schematic: clicking the shrine updates quest state locally to prove wiring.
          </li>
          <li>
            Pause → Save simulates persistence and reminds you where the Gmail exit ticket will attach.
          </li>
        </ul>
        <div className="lh-stack lh-stack--horizontal lh-panel__footer">
          <button type="button" className="lh-button lh-button--ghost" onClick={onBack}>
            Back
          </button>
          <button type="button" className="lh-button lh-button--primary" onClick={onStartSession}>
            Start Session
          </button>
        </div>
      </div>
    </section>
  );
}
