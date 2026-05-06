import { StatusCallout } from '../components/StatusCallout';
import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';

type Props = {
  onBackToExplore: () => void;
  onQuitToTitle: () => void;
  classroomTools?: ClassroomToolHandlers | null;
};

const TAKEAWAYS = [
  {
    title: 'Maia remains the anchor',
    body: 'Students begin with Maia tasks and return to Maia/NYS Career Plan completion after the game has helped them understand their options.',
  },
  {
    title: 'The game adds motivation and structure',
    body: 'Legendary Horizon turns assessment results into stats, signposts, realm exploration, research, and comparison work.',
  },
  {
    title: 'Teachers keep the deeper interpretation layer',
    body: 'The long-term bridge can use teacher-reviewed Maia outputs to write simple, game-ready values into each student record.',
  },
] as const;

export function DemoClosingScreen({ onBackToExplore, onQuitToTitle, classroomTools }: Props) {
  return (
    <section className="lh-screen lh-screen--instructions">
      <div className="lh-panel lh-panel--sheet lh-panel--instructions">
        <header className="lh-instructions__header">
          <p className="lh-eyebrow">Leadership demo closing</p>
          <h2 className="lh-heading-lg">Return to Maia with stronger choices</h2>
          <p className="lh-instructions__lede">
            This is the instructional loop the demo is proving: Maia gives students the real planning work, the game helps
            them make sense of it, and the final plan returns to Maia with better evidence.
          </p>
        </header>

        <StatusCallout tone="success" title="Progress beat demonstrated">
          <p>
            The playable slice now shows a start-to-finish instructional arc: opener, Maia bridge, base stats, Scroll of
            Destiny, exploration, research/progress surfaces, and the final handoff back to Maia.
          </p>
        </StatusCallout>

        <ol className="lh-instructions__steps">
          {TAKEAWAYS.map((takeaway, i) => (
            <li key={takeaway.title} className="lh-instructions__step">
              <span className="lh-instructions__step-index" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="lh-heading-sm lh-instructions__step-title">{takeaway.title}</h3>
                <p className="lh-instructions__step-body">{takeaway.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="lh-stack lh-stack--horizontal lh-panel__footer lh-instructions__footer">
          {classroomTools ? (
            <button type="button" className="lh-button lh-button--secondary" onClick={classroomTools.onOpenMaia}>
              Open Maia Learning
            </button>
          ) : null}
          <button type="button" className="lh-button lh-button--secondary" onClick={onBackToExplore}>
            Back to exploration
          </button>
          <button type="button" className="lh-button lh-button--primary" onClick={onQuitToTitle}>
            End leadership walkthrough
          </button>
        </div>
      </div>
    </section>
  );
}
