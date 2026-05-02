import type { ClassroomToolHandlers } from '../services/classroomToolLaunches';

type Props = {
  handlers: ClassroomToolHandlers;
  /** `pause` stacks vertically in the pause panel; `instructions` uses a compact wrap row. */
  layout?: 'pause' | 'instructions';
};

/**
 * Milestone 15 — one-click handoffs to common classroom surfaces (new tab).
 */
export function ClassroomToolsButtonRow({ handlers, layout = 'pause' }: Props) {
  const stackClass = layout === 'pause' ? 'lh-stack' : 'lh-classroom-tools--inline';
  return (
    <div className={`lh-classroom-tools ${stackClass}`}>
      <button type="button" className="lh-button lh-button--secondary lh-button--small" onClick={handlers.onOpenOnet}>
        O*NET / careers
      </button>
      <button type="button" className="lh-button lh-button--secondary lh-button--small" onClick={handlers.onOpenMaia}>
        Maia Learning
      </button>
      <button
        type="button"
        className="lh-button lh-button--secondary lh-button--small"
        onClick={handlers.onOpenGmailExitTicket}
      >
        Exit ticket (Gmail)
      </button>
      <button
        type="button"
        className="lh-button lh-button--secondary lh-button--small"
        onClick={handlers.onOpenChronicleSlides}
      >
        Chronicle (Slides)
      </button>
      <button
        type="button"
        className="lh-button lh-button--secondary lh-button--small"
        onClick={handlers.onOpenEnrollmentForm}
      >
        Forms / enrollment
      </button>
      <button type="button" className="lh-button lh-button--secondary lh-button--small" onClick={handlers.onOpenQuizlet}>
        Quizlet
      </button>
      <button
        type="button"
        className="lh-button lh-button--secondary lh-button--small"
        onClick={handlers.onOpenGoogleClassroom}
      >
        Google Classroom
      </button>
    </div>
  );
}
