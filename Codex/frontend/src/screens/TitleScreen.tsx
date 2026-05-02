import { classroomInfoStubNotice } from '../lib/demoCopy';

type Props = {
  onContinue: () => void;
};

export function TitleScreen({ onContinue }: Props) {
  return (
    <section className="lh-screen lh-screen--title">
      <div className="lh-screen__backdrop" aria-hidden />
      <div className="lh-stack lh-screen__panel">
        <p className="lh-eyebrow">Codex prototype — Night One vertical slice</p>
        <h1 className="lh-heading-xl">Legendary Horizon</h1>
        <p className="lh-subtitle">
          An educational RPG journey across career-aligned realms — local fixtures demo.
        </p>
        <div className="lh-stack lh-stack--horizontal">
          <button type="button" className="lh-button lh-button--primary" onClick={onContinue}>
            Continue
          </button>
          <button
            type="button"
            className="lh-button lh-button--secondary"
            onClick={() => alert(classroomInfoStubNotice)}
          >
            Classroom Info
          </button>
        </div>
      </div>
    </section>
  );
}
