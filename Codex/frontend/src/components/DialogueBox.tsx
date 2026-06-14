import { useCallback, useEffect, useRef, useState } from 'react';
import { useDialogueNarration } from '../hooks/useDialogueNarration';
import { useTypewriter } from '../hooks/useTypewriter';

type Props = {
  title: string;
  speakerLabel?: string;
  portraitUrl?: string;
  body: string;
  narrationSequenceId?: string;
  primaryLabel?: string;
  onPrimary: () => void;
  /** resume variant keeps the original centered card styling (ResumeDialogScreen). */
  variant?: 'default' | 'resume';
};

// Split on double-newline; each segment is one dialogue page.
function splitBeats(text: string): string[] {
  return text.split('\n\n').map((s) => s.trim()).filter(Boolean);
}

// ── Resume card (unchanged) ────────────────────────────────────────────────
function ResumeDialogCard({
  title,
  speakerLabel,
  portraitUrl,
  body,
  primaryLabel = 'Continue',
  onPrimary,
}: Props) {
  return (
    <div className="lh-dialogue lh-dialogue--resume" role="dialog" aria-labelledby="dialogue-title">
      <div className="lh-dialogue__header">
        {portraitUrl ? <img className="lh-dialogue__portrait" src={portraitUrl} alt="" /> : null}
        <div>
          {speakerLabel ? <p className="lh-dialogue__speaker">{speakerLabel}</p> : null}
          <h2 id="dialogue-title" className="lh-dialogue__title">{title}</h2>
        </div>
      </div>
      <p className="lh-dialogue__body">{body}</p>
      <div className="lh-dialogue__actions">
        <button type="button" className="lh-button lh-button--primary" data-lh-continue onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

// ── RPG bottom dialogue box ────────────────────────────────────────────────
function RpgDialogueBox({
  title,
  speakerLabel,
  portraitUrl,
  body,
  narrationSequenceId,
  onPrimary,
}: Omit<Props, 'variant' | 'primaryLabel'>) {
  const beats = splitBeats(body);
  const [pageIndex, setPageIndex] = useState(0);

  // Reset to first page whenever a new body arrives (new NPC interaction).
  useEffect(() => {
    setPageIndex(0);
  }, [body]);

  const currentBeat = beats[pageIndex] ?? '';
  useDialogueNarration(title, speakerLabel, currentBeat, narrationSequenceId, pageIndex);
  const { displayed, done, skipToEnd } = useTypewriter(currentBeat);
  const isLastPage = pageIndex >= beats.length - 1;

  // Keep a ref so the keyboard handler never goes stale.
  const onPrimaryRef = useRef(onPrimary);
  onPrimaryRef.current = onPrimary;

  const handleAdvance = useCallback(() => {
    if (!done) {
      skipToEnd();
      return;
    }
    if (!isLastPage) {
      setPageIndex((i) => i + 1);
    } else {
      onPrimaryRef.current();
    }
  }, [done, skipToEnd, isLastPage]);

  const handleAdvanceRef = useRef(handleAdvance);
  handleAdvanceRef.current = handleAdvance;

  // Enter / Space: advance or skip typewriter. Registered once; uses ref for latest state.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      // Let the button handle its own keyboard activation to avoid double-fire.
      if ((e.target as HTMLElement)?.tagName === 'BUTTON') return;
      e.preventDefault();
      e.stopPropagation();
      handleAdvanceRef.current();
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, []);

  const nameplate = speakerLabel || title;

  return (
    // Clicking anywhere on the box advances/skips.
    <div
      className="lh-rpg-dialogue"
      role="dialog"
      aria-labelledby="lh-rpg-speaker"
      data-lh-ui-sfx="off"
      onClick={handleAdvance}
    >
      <div className="lh-rpg-dialogue__panel">
        {nameplate ? (
          <div className="lh-rpg-dialogue__nameplate" id="lh-rpg-speaker">
            {nameplate}
          </div>
        ) : null}

        <div className="lh-rpg-dialogue__row">
          {/* Portrait — object-position: left center shows frame 0 of a horizontal sprite sheet */}
          <div className="lh-rpg-dialogue__portrait-cell">
            {portraitUrl ? (
              <img
                className="lh-rpg-dialogue__portrait"
                src={portraitUrl}
                alt={nameplate ?? ''}
              />
            ) : (
              <div className="lh-rpg-dialogue__portrait-placeholder" aria-hidden="true">
                ✦
              </div>
            )}
          </div>

          <div className="lh-rpg-dialogue__text-cell">
            <p className="lh-rpg-dialogue__body">
              {displayed}
              {!done && (
                <span className="lh-rpg-dialogue__cursor" aria-hidden="true" />
              )}
            </p>

            {done && (
              <div className="lh-rpg-dialogue__footer">
                <button
                  type="button"
                  className="lh-rpg-dialogue__advance"
                  data-lh-continue
                  aria-label={isLastPage ? 'Close dialogue' : 'Continue to next page'}
                  onClick={(e) => {
                    // Stop propagation so the root div onClick doesn't fire a second time.
                    e.stopPropagation();
                    handleAdvance();
                  }}
                >
                  <span className="lh-rpg-dialogue__hint">
                    {isLastPage ? 'Press Enter to close' : 'Press Enter to continue'}
                  </span>
                  <span className="lh-rpg-dialogue__glyph" aria-hidden="true">▼</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page progress dots — only shown for multi-beat dialogue */}
        {beats.length > 1 && (
          <div className="lh-rpg-dialogue__dots" aria-hidden="true">
            {beats.map((_, i) => (
              <span
                key={i}
                className={
                  i < pageIndex
                    ? 'lh-rpg-dialogue__dot lh-rpg-dialogue__dot--past'
                    : i === pageIndex
                      ? 'lh-rpg-dialogue__dot lh-rpg-dialogue__dot--active'
                      : 'lh-rpg-dialogue__dot'
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DialogueBox(props: Props) {
  if (props.variant === 'resume') return <ResumeDialogCard {...props} />;
  return <RpgDialogueBox {...props} />;
}
