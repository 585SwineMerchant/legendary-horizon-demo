type Props = {
  title: string;
  speakerLabel?: string;
  portraitUrl?: string;
  body: string;
  primaryLabel?: string;
  onPrimary: () => void;
};

export function DialogueBox({
  title,
  speakerLabel,
  portraitUrl,
  body,
  primaryLabel = 'Continue',
  onPrimary,
}: Props) {
  return (
    <div className="lh-dialogue" role="dialog" aria-labelledby="dialogue-title">
      <div className="lh-dialogue__header">
        {portraitUrl ? (
          <img className="lh-dialogue__portrait" src={portraitUrl} alt="" />
        ) : null}
        <div>
          {speakerLabel ? <p className="lh-dialogue__speaker">{speakerLabel}</p> : null}
          <h2 id="dialogue-title" className="lh-dialogue__title">
            {title}
          </h2>
        </div>
      </div>
      <p className="lh-dialogue__body">{body}</p>
      <div className="lh-dialogue__actions">
        <button type="button" className="lh-button lh-button--primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
