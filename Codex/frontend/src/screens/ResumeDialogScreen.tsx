import { DialogueBox } from '../components/DialogueBox';
import { mentorSpeakerLabel, resumeDialogTitle } from '../lib/demoCopy';

type Props = {
  portraitUrl: string;
  dialogueBody: string;
  onContinue: () => void;
};

export function ResumeDialogScreen({ portraitUrl, dialogueBody, onContinue }: Props) {
  return (
    <section className="lh-screen">
      <DialogueBox
        speakerLabel={mentorSpeakerLabel}
        title={resumeDialogTitle}
        portraitUrl={portraitUrl}
        body={dialogueBody}
        onPrimary={onContinue}
      />
    </section>
  );
}
