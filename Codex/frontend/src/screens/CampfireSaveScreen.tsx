import { useEffect, useRef, useState } from 'react';
import type { PlayerSave } from '../types';
import { hasAmberFlameVisual, parseSatchelInventory } from '../data/itemCatalog';
import { CAMPFIRE_STREAK_MILESTONES } from '../data/itemCatalog';

const DEFAULT_PROMPT =
  'Describe one thing you discovered today in the realms, and one question you are still carrying with you.';

const MIN_CHARS = 100;
const MAX_CHARS = 500;

type SubmitState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'error'; message: string }
  | { phase: 'confirmed' };

type Props = {
  player: PlayerSave;
  prompt?: string;
  onSubmit: (response: string) => Promise<{ ok: boolean; message: string }>;
  onComplete: () => void;
};

export function CampfireSaveScreen({ player, prompt, onSubmit, onComplete }: Props) {
  const baseUrl = import.meta.env.BASE_URL as string;
  const [frameIdx, setFrameIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>({ phase: 'idle' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activePrompt = prompt?.trim() || DEFAULT_PROMPT;
  const charCount = response.trim().length;
  const canSubmit = charCount >= MIN_CHARS && charCount <= MAX_CHARS && submitState.phase === 'idle';

  // Streak and cosmetics
  const streak = player.campfire_streak ?? 0;
  const inventory = parseSatchelInventory(player.satchel_inventory_json);
  const amberFlame = hasAmberFlameVisual(inventory.cosmetics) || streak >= 3;
  const streakMilestoneNear = CAMPFIRE_STREAK_MILESTONES.find((m) => streak === m.streak - 1);

  const fireFrames = [
    `${baseUrl}assets/maps/campfire1 - fire.png`,
    `${baseUrl}assets/maps/campfire2- fire.png`,
  ];

  // 2-frame campfire flicker at ~8fps
  useEffect(() => {
    const id = window.setInterval(() => setFrameIdx((f) => 1 - f), 120);
    return () => window.clearInterval(id);
  }, []);

  // Block Escape — student must submit before exiting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Auto-complete after confirmation beat
  useEffect(() => {
    if (submitState.phase !== 'confirmed') return;
    const id = window.setTimeout(() => onComplete(), 2800);
    return () => window.clearTimeout(id);
  }, [submitState.phase, onComplete]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitState({ phase: 'submitting' });
    const result = await onSubmit(response.trim());
    if (!result.ok) {
      setSubmitState({ phase: 'error', message: result.message });
      return;
    }
    setSubmitState({ phase: 'confirmed' });
  };

  const contextLine = [
    `${player.display_name || 'Traveler'}`,
    player.current_act ? `Act ${player.current_act}` : null,
    player.current_realm_id ? `Realm: ${player.current_realm_id.replace(/_/g, ' ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const isConfirmed = submitState.phase === 'confirmed';
  const overLimit = charCount > MAX_CHARS;

  return (
    <div
      className={`lh-campfire-screen${amberFlame ? ' lh-campfire-screen--amber' : ''}`}
      aria-label="Campfire — session reflection"
    >
      {/* Ambient ember glow backdrop */}
      <div className="lh-campfire-glow" aria-hidden />

      {/* Campfire visual */}
      <div className="lh-campfire-pyre" aria-hidden>
        <img
          className="lh-campfire-smoke"
          src={`${baseUrl}assets/maps/campfire smoke.png`}
          alt=""
        />
        <img
          key={frameIdx}
          className={`lh-campfire-flame${amberFlame ? ' lh-campfire-flame--amber' : ''}`}
          src={fireFrames[frameIdx]}
          alt=""
        />
        <div className="lh-campfire-log-base" />
      </div>

      {/* Streak badge */}
      {streak > 0 ? (
        <div className="lh-campfire-streak-badge" aria-label={`Campfire streak: ${streak}`}>
          <span className="lh-campfire-streak-badge__icon" aria-hidden>🔥</span>
          <span className="lh-campfire-streak-badge__count">{streak}</span>
          {streakMilestoneNear ? (
            <span className="lh-campfire-streak-badge__hint">
              1 away from "{streakMilestoneNear.reward_label}"
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Content card */}
      <div className={`lh-campfire-card${isConfirmed ? ' lh-campfire-card--confirmed' : ''}`}>
        {isConfirmed ? (
          <div className="lh-campfire-confirmation" role="status">
            <p className="lh-campfire-confirmation__line">Your words have been recorded, Traveler.</p>
            <p className="lh-campfire-confirmation__sub">The campfire fades as the session draws to a close…</p>
            {streak > 0 ? (
              <p className="lh-campfire-confirmation__streak">
                🔥 Campfire streak: {streak + 1}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <header className="lh-campfire-card__header">
              <p className="lh-eyebrow lh-campfire-eyebrow">The Campfire</p>
              <p className="lh-campfire-context">{contextLine}</p>
            </header>

            <div className="lh-campfire-prompt-block">
              <p className="lh-campfire-prompt">{activePrompt}</p>
            </div>

            <div className="lh-campfire-input-block">
              <textarea
                ref={textareaRef}
                className={`lh-campfire-textarea${overLimit ? ' lh-campfire-textarea--over-limit' : ''}`}
                value={response}
                onChange={(e) => {
                  setResponse(e.target.value);
                  if (submitState.phase === 'error') setSubmitState({ phase: 'idle' });
                }}
                placeholder="Write your reflection here…"
                rows={5}
                disabled={submitState.phase === 'submitting'}
                aria-label="Campfire reflection response"
              />
              <div className="lh-campfire-char-row">
                <p className={`lh-campfire-char-hint${charCount >= MIN_CHARS && !overLimit ? ' lh-campfire-char-hint--met' : ''}${overLimit ? ' lh-campfire-char-hint--over' : ''}`}>
                  {overLimit
                    ? `${charCount - MAX_CHARS} characters over limit`
                    : charCount >= MIN_CHARS
                    ? 'Ready to record'
                    : `${MIN_CHARS - charCount} more character${MIN_CHARS - charCount === 1 ? '' : 's'} needed`}
                </p>
                <p className={`lh-campfire-char-count${overLimit ? ' lh-campfire-char-count--over' : ''}`}>
                  {charCount}/{MAX_CHARS}
                </p>
              </div>
            </div>

            {submitState.phase === 'error' ? (
              <p className="lh-campfire-error" role="alert">
                {submitState.message || 'The record did not save — try again.'}
              </p>
            ) : null}

            <button
              type="button"
              className="lh-campfire-submit"
              disabled={charCount < MIN_CHARS || overLimit || submitState.phase !== 'idle'}
              onClick={() => void handleSubmit()}
            >
              {submitState.phase === 'submitting' ? 'Recording…' : 'Record in the Codex'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
