import { ClassroomToolsButtonRow } from '../components/ClassroomToolsButtonRow';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';

type Props = {
  onBack: () => void;
  onStartSession: () => void;
  classroomTools?: ClassroomToolHandlers | null;
};

const STEPS = [
  {
    title: 'Mirror of Maia',
    body: 'Students begin with Maia Learning: the Interest Profiler, career recommendations, and saved favorites provide the first real-world signal for the journey.',
  },
  {
    title: 'Teacher-reviewed bridge',
    body: 'For the demo, processed Maia-style fields stand in for the long-term teacher/backend layer that translates results into game-ready values.',
  },
  {
    title: 'Stats and signposts',
    body: 'The Scroll of Destiny reveals base stats, a student manifest, and three foretold realm signposts that make the opening path feel personal.',
  },
  {
    title: 'Explore, research, compare',
    body: 'A realm beat and a research beat show how the game motivates career exploration without replacing the planning tools schools already trust.',
  },
  {
    title: 'Return to Maia',
    body: 'The slice closes by pointing students back to Maia and the NYS Career Plan with stronger context for choosing, comparing, and completing the plan.',
  },
] as const;

export function InstructionsScreen({ onBack, onStartSession, classroomTools }: Props) {
  return (
    <section className="lh-screen lh-screen--instructions">
      <div className="lh-panel lh-panel--sheet lh-panel--instructions">
        <header className="lh-instructions__header">
          <p className="lh-eyebrow">Prologue briefing</p>
          <h2 className="lh-heading-lg">What this demo proves</h2>
          <p className="lh-instructions__lede">
            Maia remains a core part of the instructional system. Legendary Horizon is the motivating layer that helps
            students understand their results, explore options, and return to the plan with better choices.
          </p>
        </header>
        <ol className="lh-instructions__steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="lh-instructions__step">
              <span className="lh-instructions__step-index" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="lh-heading-sm lh-instructions__step-title">{step.title}</h3>
                <p className="lh-instructions__step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {classroomTools ? (
          <section className="lh-instructions__classroom-tools" aria-label="Classroom tool shortcuts">
            <h3 className="lh-heading-sm lh-instructions__tools-title">Classroom shortcuts</h3>
            <p className="lh-instructions__tools-hint">
              Maia and the classroom tools stay available during the prologue so the handoff is visible, not implied.
            </p>
            <ClassroomToolsButtonRow handlers={classroomTools} layout="instructions" />
          </section>
        ) : null}
        <div className="lh-stack lh-stack--horizontal lh-panel__footer lh-instructions__footer">
          <button type="button" className="lh-button lh-button--ghost" onClick={onBack}>
            Back to title
          </button>
          <button type="button" className="lh-button lh-button--primary" onClick={onStartSession}>
            Open guided recap
          </button>
        </div>
      </div>
    </section>
  );
}
