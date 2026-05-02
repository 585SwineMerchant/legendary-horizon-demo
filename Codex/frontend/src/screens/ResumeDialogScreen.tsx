import { DialogueBox } from '../components/DialogueBox';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { mentorSpeakerLabel, resumeDialogTitle } from '../lib/demoCopy';

type Props = {
  portraitUrl: string;
  /** Milestone 16 — from `npc_registry.json` (defaults to legacy copy). */
  speakerLabel?: string;
  dialogueBody: string;
  onContinue: () => void;
};

export function ResumeDialogScreen({ portraitUrl, speakerLabel, dialogueBody, onContinue }: Props) {
  useEscapeToClose(true, onContinue);
  return (
    <section className="lh-screen lh-screen--resume">
      <DialogueBox
        variant="resume"
        speakerLabel={speakerLabel ?? mentorSpeakerLabel}
        title={resumeDialogTitle}
        portraitUrl={portraitUrl}
        body={dialogueBody}
        onPrimary={onContinue}
        primaryLabel="Enter exploration"
      />
    </section>
  );
}
