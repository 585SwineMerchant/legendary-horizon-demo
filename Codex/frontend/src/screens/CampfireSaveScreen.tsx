import { useEffect, useRef, useState } from 'react';
import type { PlayerSave } from '../types';
import { hasAmberFlameVisual, parseSatchelInventory } from '../data/itemCatalog';
import { CAMPFIRE_STREAK_MILESTONES } from '../data/itemCatalog';
import { getLhAudioDirector } from '../lib/lhAudioDirector';
import { playLhCeremonyMusic } from '../lib/lhCeremonyMusic';

const DEFAULT_PROMPT =
  'Describe one thing you discovered today in the realms, and one question you are still carrying with you.';

const MIN_CHARS = 100;
const MAX_CHARS = 500;

// ── Ambient embers ─────────────────────────────────────────────────────────
// Static, pre-computed ember definitions — pure CSS animation, no per-frame JS.
// Each ember varies start x (% within the ember container), horizontal drift,
// rise distance, size, delay and duration so the stream feels irregular.
type Ember = {
  x: number;        // % horizontal start within the fire container
  drift: number;    // px horizontal drift over the rise
  rise: number;     // px upward travel
  size: number;     // px
  delay: number;    // s
  duration: number; // s
  opacity: number;  // peak opacity
};

const EMBERS: Ember[] = [
  { x: 48, drift:  14, rise: 150, size: 3.0, delay: 0.0, duration: 6.2, opacity: 0.85 },
  { x: 52, drift: -10, rise: 168, size: 2.2, delay: 1.4, duration: 7.0, opacity: 0.70 },
  { x: 45, drift:  22, rise: 132, size: 2.6, delay: 2.7, duration: 5.6, opacity: 0.80 },
  { x: 55, drift: -18, rise: 176, size: 1.8, delay: 0.8, duration: 7.6, opacity: 0.60 },
  { x: 50, drift:   6, rise: 158, size: 3.4, delay: 3.5, duration: 6.0, opacity: 0.90 },
  { x: 43, drift:  16, rise: 144, size: 2.0, delay: 4.6, duration: 6.8, opacity: 0.65 },
  { x: 57, drift: -24, rise: 162, size: 2.8, delay: 1.9, duration: 5.9, opacity: 0.78 },
  { x: 49, drift:  -6, rise: 178, size: 2.3, delay: 5.2, duration: 7.4, opacity: 0.72 },
  { x: 46, drift:  20, rise: 138, size: 1.9, delay: 2.2, duration: 6.4, opacity: 0.58 },
  { x: 53, drift: -14, rise: 170, size: 3.1, delay: 3.9, duration: 6.6, opacity: 0.86 },
  { x: 51, drift:  10, rise: 152, size: 2.1, delay: 0.5, duration: 7.1, opacity: 0.68 },
  { x: 44, drift:  26, rise: 130, size: 2.5, delay: 4.1, duration: 5.7, opacity: 0.76 },
  { x: 56, drift: -20, rise: 166, size: 2.0, delay: 2.9, duration: 7.3, opacity: 0.62 },
  { x: 50, drift:   4, rise: 184, size: 1.7, delay: 5.8, duration: 7.8, opacity: 0.55 },
  { x: 47, drift:  18, rise: 146, size: 2.9, delay: 1.1, duration: 6.1, opacity: 0.82 },
  { x: 54, drift: -12, rise: 160, size: 2.4, delay: 3.2, duration: 6.7, opacity: 0.74 },
];

// ── Star twinkle ────────────────────────────────────────────────────────────
// Only the upper band of the image — stars should sit above the treeline.
type Star = { left: number; top: number; sz: number; del: number; dur: number; lo: number; hi: number };
const STARS: Star[] = [
  { left: 12, top:  8, sz: 1.8, del: 0.3, dur: 3.2, lo: 0.15, hi: 0.55 },
  { left: 22, top:  5, sz: 1.4, del: 1.7, dur: 2.8, lo: 0.20, hi: 0.65 },
  { left: 35, top: 12, sz: 2.0, del: 0.8, dur: 3.6, lo: 0.10, hi: 0.45 },
  { left: 62, top:  6, sz: 1.6, del: 2.3, dur: 2.5, lo: 0.25, hi: 0.70 },
  { left: 73, top:  9, sz: 1.2, del: 0.5, dur: 3.1, lo: 0.15, hi: 0.50 },
  { left: 82, top:  4, sz: 1.9, del: 1.9, dur: 2.7, lo: 0.18, hi: 0.60 },
  { left: 90, top: 14, sz: 1.3, del: 3.1, dur: 3.4, lo: 0.12, hi: 0.48 },
  { left: 47, top:  3, sz: 1.5, del: 0.0, dur: 3.8, lo: 0.22, hi: 0.62 },
  { left: 58, top: 11, sz: 1.7, del: 2.6, dur: 2.9, lo: 0.16, hi: 0.52 },
  { left: 16, top: 16, sz: 1.1, del: 4.2, dur: 3.3, lo: 0.14, hi: 0.44 },
  { left: 78, top:  7, sz: 2.1, del: 1.2, dur: 2.6, lo: 0.20, hi: 0.58 },
  { left:  6, top: 11, sz: 1.6, del: 3.8, dur: 3.0, lo: 0.17, hi: 0.53 },
];

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
  const [response, setResponse] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>({ phase: 'idle' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Replace exploration music with the quiet reflection loop for this screen.
  useEffect(() => {
    getLhAudioDirector().setLane(null);
    const stopReflectionMusic = playLhCeremonyMusic('fireside_reflection_loop');
    return () => {
      stopReflectionMusic();
      getLhAudioDirector().setLane('exploration');
    };
  }, []);

  const activePrompt = prompt?.trim() || DEFAULT_PROMPT;
  const charCount = response.trim().length;
  const canSubmit = charCount >= MIN_CHARS && charCount <= MAX_CHARS && submitState.phase === 'idle';

  // Streak and cosmetics
  const streak = player.campfire_streak ?? 0;
  const inventory = parseSatchelInventory(player.satchel_inventory_json);
  const amberFlame = hasAmberFlameVisual(inventory.cosmetics) || streak >= 3;
  const streakMilestoneNear = CAMPFIRE_STREAK_MILESTONES.find((m) => streak === m.streak - 1);

  // Full-screen campsite background image (right-side dominant composition).
  const bgUrl = `${baseUrl}assets/ui/fireside_reflection_background.png`;

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
      aria-label="Fireside Reflection — session reflection"
      style={{ backgroundImage: `url("${bgUrl}")` }}
    >
      {/* Static atmospheric fog overlay — stronger on the left for text legibility,
          lighter on the right so the campsite/fire/tent stay visible. */}
      <div className="lh-campfire-fog" aria-hidden />

      {/* Slow drifting atmospheric haze — midnight blue-gray, very subtle */}
      <div className="lh-campfire-haze" aria-hidden />

      {/* Subtle star twinkle in the upper sky band */}
      <div className="lh-campfire-stars" aria-hidden>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="lh-campfire-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              '--sz': `${s.sz}px`,
              '--del': `${s.del}s`,
              '--dur': `${s.dur}s`,
              '--lo': s.lo,
              '--hi': s.hi,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Campfire glow flicker — amber radial light over the fire area */}
      <div className="lh-campfire-fire-glow" aria-hidden />

      {/* Rising ember particles */}
      <div className="lh-campfire-embers" aria-hidden>
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="lh-campfire-ember"
            style={{
              '--x': `${e.x}%`,
              '--drift': `${e.drift}px`,
              '--rise': `${e.rise}px`,
              '--size': `${e.size}px`,
              '--delay': `${e.delay}s`,
              '--duration': `${e.duration}s`,
              '--opacity': e.opacity,
            } as React.CSSProperties}
          />
        ))}
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
              <p className="lh-eyebrow lh-campfire-eyebrow">Make Camp</p>
              <h2 className="lh-campfire-title">Fireside Reflection</h2>
              <p className="lh-campfire-subtitle">
                Rest beneath the stars. Record what you learned before the road continues.
              </p>
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
