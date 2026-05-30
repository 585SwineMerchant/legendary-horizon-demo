/**
 * GT-100  "Face the Guardian"
 * ─────────────────────────────────────────────────────────────────────────────
 * Boss encounter module that gates GT-101 (Enrollment Rune).
 *
 * MECHANICS
 *   Phase 1 (questions 1-5):  Guardian uses melee attacks.  Music: Blood Moon Duel.
 *   Phase 2 (questions 6-10): Guardian RESURRECTS — enraged. Music: Moonlit Boss Round.
 *   Correct answer  → boss loses 1 HP segment (boss bar shrinks).
 *   Wrong answer    → player loses 1 heart (max 5). 2+ wrong allowed; 5 wrong = defeat.
 *   Win:  all 10 questions answered — emits ModuleResultPayload → GT-101 unlocks.
 *   Loss: player hearts reach 0 — "Defeated" screen with instant retry (no penalty).
 *
 * SPRITE ASSETS  (copy from ERW packs → public/assets/boss/mountain/)
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │ Source: Epic RPG World - The dephs of the Mountain V1.5.1               │
 *   │ Path:   Characters/Boss/                                                 │
 *   │                                                                          │
 *   │  boss anims-idle.png          → /assets/boss/mountain/idle.png           │
 *   │  boss anims-walk.png          → /assets/boss/mountain/walk.png           │
 *   │  boss anims-atk1.png          → /assets/boss/mountain/atk1.png           │
 *   │  boss anims-atk1-fx1.png      → /assets/boss/mountain/atk1-fx.png        │
 *   │  boss anims-atk2.png          → /assets/boss/mountain/atk2.png           │
 *   │  boss anims-atk3.png          → /assets/boss/mountain/atk3.png           │
 *   │  boss anims-hurt.png          → /assets/boss/mountain/hurt.png           │
 *   │  boss anims-death.png         → /assets/boss/mountain/death.png          │
 *   │  boss anims-resurrect.png     → /assets/boss/mountain/resurrect.png      │
 *   │  boss gate-going down.png     → /assets/boss/mountain/gate-open.png      │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 *   Source: Epic RPG World - Volcano V1.6.1  (arena hazard props)
 *   /assets/boss/volcano/spikes-*.png, crusher-*.png, geyser-*.png
 *
 * AUDIO (already in /public/assets/Audio/)
 *   /assets/Audio/Blood Moon Duel.mp3       → Phase 1 BGM
 *   /assets/Audio/Moonlit Boss Round.mp3    → Phase 2 BGM (enraged)
 *
 * ANIMATION NOTES
 *   Each PNG is a horizontal sprite strip. Key frame counts (from asset scan):
 *   idle:9  walk:8  atk1:packed-sheet  atk2:packed-sheet  atk3:loop
 *   resurrect:packed-sheet  death:sequence
 *   CSS @keyframes step-based animation drives background-position cycling.
 *   Frame width constants are marked TODO — measure from actual PNGs in Aseprite
 *   or via Image.naturalWidth / frameCount.
 */

import { useEffect, useReducer, useRef } from 'react';
import type { ModuleResultPayload } from '../../types';

// ─── asset paths ─────────────────────────────────────────────────────────────

const BOSS_SPRITES = {
  idle:       '/assets/boss/mountain/idle.png',
  atk1:       '/assets/boss/mountain/atk1.png',
  atk2:       '/assets/boss/mountain/atk2.png',
  hurt:       '/assets/boss/mountain/hurt.png',
  death:      '/assets/boss/mountain/death.png',
  resurrect:  '/assets/boss/mountain/resurrect.png',
} as const;

const AUDIO = {
  phase1: '/assets/Audio/Blood Moon Duel.mp3',
  phase2: '/assets/Audio/Moonlit Boss Round.mp3',
} as const;

type BossAnim = keyof typeof BOSS_SPRITES;

// ─── questions ───────────────────────────────────────────────────────────────

type Question = {
  prompt: string;
  options: readonly string[];
  answerIndex: number;
  /** Short explanation shown after answering. */
  feedback: string;
};

/** Phase 1 — fundamental career concepts. */
const PHASE_1_QUESTIONS: readonly Question[] = [
  {
    prompt: 'What is a CAREER CLUSTER?',
    options: [
      'A group of related careers that share similar skills and knowledge',
      'A type of spell that unlocks new quests',
      'A folder on your computer for school projects',
      'A score you earn on the Scroll of Destiny',
    ],
    answerIndex: 0,
    feedback:
      'Career clusters group related jobs together — like Health Science or Arts & Communication — so you can explore careers that fit your interests.',
  },
  {
    prompt: 'What is the main PURPOSE of the Traveler\'s Manifest (Scroll of Destiny)?',
    options: [
      'To record your career interests, values, and goals',
      'To track your combat wins in the game',
      'To memorize the map layout of Legendary Horizon',
      'To store your coins and inventory items',
    ],
    answerIndex: 0,
    feedback:
      'The Manifest captures who you are — your interests, values, skills, and career goals — so you can plan your path forward.',
  },
  {
    prompt: 'Which of these is a REAL tool for researching careers?',
    options: [
      'O*NET OnLine (onetonline.org)',
      'Asking the game\'s Oracle to predict your future',
      'Looking up "jobs" in a printed dictionary',
      'Spinning a random wheel and choosing what it lands on',
    ],
    answerIndex: 0,
    feedback:
      'O*NET OnLine is a free U.S. Department of Labor database with detailed information on hundreds of occupations — skills, pay, outlook, and more.',
  },
  {
    prompt: 'In career planning, WORK VALUES are best described as:',
    options: [
      'What matters most to you in a job — like helping others, creativity, or independence',
      'How much money you will earn in your first year',
      'The list of homework assignments you completed this semester',
      'Your score on a vocabulary battle in the game',
    ],
    answerIndex: 0,
    feedback:
      'Work values are the things you care most about in a career. Knowing your values helps you choose a path that will be meaningful and satisfying.',
  },
  {
    prompt: 'In a New York State Career Plan, "POST-SECONDARY EDUCATION" means:',
    options: [
      'Education after high school — like college, trade school, or an apprenticeship',
      'Re-taking a grade you did not pass',
      'Special enrichment classes during middle school',
      'Any studying done after 3:00 PM on a school day',
    ],
    answerIndex: 0,
    feedback:
      'Post-secondary means "after secondary (high school)." It includes college, community college, trade/vocational school, military, and apprenticeships.',
  },
];

/** Phase 2 — The Guardian rises! Harder questions on clusters, skills, and research. */
const PHASE_2_QUESTIONS: readonly Question[] = [
  {
    prompt:
      '☠ THE GUARDIAN RISES ☠\nThe Arts, A/V Technology & Communications cluster BEST includes which careers?',
    options: [
      'Graphic design, film production, and broadcasting',
      'Plumbing, electrical work, and carpentry',
      'Growing crops and managing farmland',
      'Diagnosing illnesses and treating patients',
    ],
    answerIndex: 0,
    feedback:
      'Arts, A/V Technology & Communications covers creative and media careers — graphic designers, directors, sound engineers, journalists, and more.',
  },
  {
    prompt: 'A TRANSFERABLE SKILL is best described as:',
    options: [
      'A skill you can use across many different jobs — like communication or teamwork',
      'A skill that only works in one specific career field',
      'Moving your equipment to another player in the game',
      'A special combat ability unlocked at Level 10',
    ],
    answerIndex: 0,
    feedback:
      'Transferable skills travel with you from job to job. Writing, problem-solving, and leadership are examples that employers value in every field.',
  },
  {
    prompt: 'The HOLLAND CODE (RIASEC) is a tool that helps you understand:',
    options: [
      'Your personality type and which career environments might suit you',
      'Which country or region you were born in',
      'Your score in the Vault of Runes assignment',
      'How many guild halls you have discovered on the map',
    ],
    answerIndex: 0,
    feedback:
      'RIASEC stands for Realistic, Investigative, Artistic, Social, Enterprising, Conventional — a personality model that links traits to career clusters.',
  },
  {
    prompt: 'A JOB SHADOW (informational visit) means:',
    options: [
      'Spending time watching a professional perform their actual job duties',
      'A mysterious enemy that guards the employment realm',
      'The silhouette cast when you stand next to a lamp in-game',
      'An interview conducted in a darkened room',
    ],
    answerIndex: 0,
    feedback:
      'Job shadowing lets you see what a job is really like day-to-day. It\'s one of the best ways to decide if a career path is right for you.',
  },
  {
    prompt: 'The BEST reason to research MULTIPLE career options is:',
    options: [
      'To compare them and find the best fit for your unique skills and interests',
      'To confuse your teacher with a long list of different answers',
      'To fill every slot in your Quest Log as fast as possible',
      'To unlock the maximum number of guild halls on the map',
    ],
    answerIndex: 0,
    feedback:
      'Career exploration is about finding YOUR best fit. Researching multiple options gives you evidence to make a confident, informed choice.',
  },
];

const ALL_QUESTIONS = [...PHASE_1_QUESTIONS, ...PHASE_2_QUESTIONS] as const;
const TOTAL_QUESTIONS = ALL_QUESTIONS.length; // 10
const PHASE_BREAK = PHASE_1_QUESTIONS.length;  // 5 — boss resurrects here
const PLAYER_MAX_HP = 5;

// ─── state machine ───────────────────────────────────────────────────────────

type Scene =
  | 'battle'          // active question
  | 'answer_correct'  // brief flash before next question
  | 'answer_wrong'    // brief flash
  | 'phase_break'     // boss resurrection cutscene (between Q5 and Q6)
  | 'victory'         // all questions answered correctly
  | 'defeated';       // player ran out of hearts

type BossState = {
  scene: Scene;
  questionIndex: number;       // 0-9
  selectedOption: number | null;
  playerHp: number;            // 0-5
  /** How many HP segments the boss has lost so far (each correct answer removes 1). */
  bossHpLost: number;          // 0-10
  bossAnim: BossAnim;
  wrongAnswersThisRun: number; // tracking for feedback
};

type Action =
  | { type: 'SELECT_ANSWER'; optionIndex: number }
  | { type: 'ADVANCE' }        // move from flash state to next question / phase break / victory
  | { type: 'PHASE_BREAK_DONE' }
  | { type: 'RETRY' };

function initialState(): BossState {
  return {
    scene: 'battle',
    questionIndex: 0,
    selectedOption: null,
    playerHp: PLAYER_MAX_HP,
    bossHpLost: 0,
    bossAnim: 'idle',
    wrongAnswersThisRun: 0,
  };
}

function reducer(state: BossState, action: Action): BossState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      if (state.scene !== 'battle') return state;
      const q = ALL_QUESTIONS[state.questionIndex];
      const correct = action.optionIndex === q.answerIndex;
      const newBossHpLost = correct ? state.bossHpLost + 1 : state.bossHpLost;
      const newPlayerHp = correct ? state.playerHp : state.playerHp - 1;
      const newWrong = correct ? state.wrongAnswersThisRun : state.wrongAnswersThisRun + 1;

      if (!correct && newPlayerHp <= 0) {
        return {
          ...state,
          scene: 'defeated',
          selectedOption: action.optionIndex,
          playerHp: 0,
          bossAnim: 'atk1',
          wrongAnswersThisRun: newWrong,
        };
      }
      return {
        ...state,
        scene: correct ? 'answer_correct' : 'answer_wrong',
        selectedOption: action.optionIndex,
        playerHp: newPlayerHp,
        bossHpLost: newBossHpLost,
        bossAnim: correct ? 'hurt' : 'atk1',
        wrongAnswersThisRun: newWrong,
      };
    }

    case 'ADVANCE': {
      if (state.scene !== 'answer_correct' && state.scene !== 'answer_wrong') return state;
      const nextIndex = state.questionIndex + 1;

      if (nextIndex >= TOTAL_QUESTIONS) {
        // All done — victory
        return { ...state, scene: 'victory', questionIndex: nextIndex, selectedOption: null, bossAnim: 'death' };
      }

      if (nextIndex === PHASE_BREAK) {
        // Boss resurrects — phase 2 starts
        return { ...state, scene: 'phase_break', questionIndex: nextIndex, selectedOption: null, bossAnim: 'resurrect' };
      }

      return { ...state, scene: 'battle', questionIndex: nextIndex, selectedOption: null, bossAnim: 'idle' };
    }

    case 'PHASE_BREAK_DONE': {
      return { ...state, scene: 'battle', bossAnim: 'idle' };
    }

    case 'RETRY': {
      return initialState();
    }

    default:
      return state;
  }
}

// ─── component helpers ────────────────────────────────────────────────────────

function Heart({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        fontSize: 'clamp(16px, 2.5vw, 22px)',
        filter: filled ? 'none' : 'grayscale(1) opacity(0.35)',
        transition: 'filter 0.3s ease',
      }}
    >
      {filled ? '❤' : '🖤'}
    </span>
  );
}

function BossHealthBar({ hpLost, total }: { hpLost: number; total: number }) {
  const remaining = Math.max(0, total - hpLost);
  const pct = (remaining / total) * 100;
  const color = pct > 50 ? '#dc2626' : pct > 25 ? '#f59e0b' : '#7c3aed'; // red → amber → purple (enraged)

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 'clamp(9px, 1.1vw, 12px)',
          color: '#d1d5db',
          fontFamily: '"Cinzel", serif',
          letterSpacing: '0.05em',
        }}
      >
        <span>THE GUARDIAN</span>
        <span style={{ color }}>
          {remaining} / {total}
        </span>
      </div>
      <div
        style={{
          height: 14,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color} 0%, #ef4444 100%)`,
            borderRadius: 3,
            transition: 'width 0.5s ease, background 0.5s ease',
            boxShadow: `0 0 8px ${color}88`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * BossSprite — renders the boss PNG sprite.
 * CSS animation cycles through frames using background-position steps.
 *
 * TODO: Replace FRAME_WIDTH / FRAME_COUNT constants once sprites are measured.
 * Use the packed-sheet PNGs for atk1/atk2/atk3/resurrect — they have all frames
 * in a single horizontal strip. idle.png has ~9 frames at ~128px each.
 */
function BossSprite({ anim, enraged }: { anim: BossAnim; enraged: boolean }) {
  const src = BOSS_SPRITES[anim];

  return (
    <div
      style={{
        width: 'clamp(100px, 18vw, 200px)',
        height: 'clamp(100px, 18vw, 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Glow halo — intensifies in phase 2 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: enraged
            ? 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)',
          animation: 'lh-boss-pulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <img
        src={src}
        alt={`Boss ${anim}`}
        draggable={false}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'pixelated',
          filter: enraged ? 'hue-rotate(60deg) saturate(1.5) brightness(1.15)' : 'none',
          transition: 'filter 0.8s ease',
          /* When the full sprite dimensions are known, replace with:
           * width: FRAME_WIDTH,
           * backgroundImage: `url(${src})`,
           * backgroundRepeat: 'no-repeat',
           * animation: `lh-boss-${anim} ${DURATION}ms steps(${FRAME_COUNT}) infinite`,
           * and make it a <div> instead of <img>
           */
        }}
        onError={(e) => {
          // Graceful fallback: show a text placeholder if sprite isn't deployed yet
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Fallback silhouette when sprite file is missing */}
      <span
        style={{
          position: 'absolute',
          fontSize: 'clamp(60px, 10vw, 100px)',
          opacity: 0.7,
          filter: enraged ? 'hue-rotate(60deg)' : 'none',
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        👹
      </span>
    </div>
  );
}

// ─── audio hook ───────────────────────────────────────────────────────────────

function useBossAudio(phase: 1 | 2) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPhaseRef = useRef<1 | 2>(0 as never);

  useEffect(() => {
    // Transition music when phase changes
    if (currentPhaseRef.current === phase) return;
    currentPhaseRef.current = phase;

    const src = phase === 1 ? AUDIO.phase1 : AUDIO.phase2;

    // Fade out old track
    const old = audioRef.current;
    if (old) {
      const fadeOut = setInterval(() => {
        if (old.volume > 0.05) {
          old.volume = Math.max(0, old.volume - 0.05);
        } else {
          clearInterval(fadeOut);
          old.pause();
        }
      }, 60);
    }

    // Start new track
    const next = new Audio(src);
    next.loop = true;
    next.volume = 0;
    audioRef.current = next;
    void next.play().catch(() => undefined);

    // Fade in
    const fadeIn = setInterval(() => {
      if (next.volume < 0.65) {
        next.volume = Math.min(0.65, next.volume + 0.04);
      } else {
        clearInterval(fadeIn);
      }
    }, 60);

    return () => {
      clearInterval(fadeIn);
    };
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        audioRef.current = null;
      }
    };
  }, []);
}

// ─── phase-break overlay ──────────────────────────────────────────────────────

function PhaseBreakScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '24px 16px',
        textAlign: 'center',
        animation: 'lh-boss-shake 0.4s ease',
      }}
    >
      <div style={{ fontSize: 'clamp(40px, 7vw, 72px)', animation: 'lh-boss-pulse 0.5s ease infinite' }}>
        ☠
      </div>
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          color: '#7c3aed',
          fontSize: 'clamp(16px, 2.8vw, 26px)',
          textShadow: '0 0 20px rgba(124,58,237,0.8)',
          margin: 0,
          letterSpacing: '0.1em',
        }}
      >
        THE GUARDIAN RISES
      </h2>
      <p
        style={{
          fontFamily: '"Cinzel", serif',
          color: '#d1d5db',
          fontSize: 'clamp(10px, 1.4vw, 14px)',
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        "You think knowledge alone can stop me? I am ancient beyond your reckoning..."
      </p>
      <p
        style={{
          color: '#9ca3af',
          fontSize: 'clamp(9px, 1.1vw, 11px)',
          margin: 0,
        }}
      >
        Brace yourself for Phase 2…
      </p>
    </div>
  );
}

// ─── main module ──────────────────────────────────────────────────────────────

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId: string;
  playerName?: string;
};

export function GT100GuardianBossModule({
  onSubmitResult,
  realmId,
  playerName = 'Traveler',
}: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const phase: 1 | 2 = state.questionIndex < PHASE_BREAK && state.scene !== 'phase_break' ? 1 : 2;

  useBossAudio(state.scene === 'victory' || state.scene === 'defeated' ? 1 : phase);

  const currentQuestion = state.questionIndex < TOTAL_QUESTIONS
    ? ALL_QUESTIONS[state.questionIndex]
    : null;

  function handleSelectAnswer(i: number) {
    dispatch({ type: 'SELECT_ANSWER', optionIndex: i });
  }

  function handleAdvance() {
    dispatch({ type: 'ADVANCE' });
  }

  function handleRetry() {
    dispatch({ type: 'RETRY' });
  }

  function handleVictoryComplete() {
    const now = new Date().toISOString();
    onSubmitResult({
      module_id: 'mod_gt100_guardian_boss',
      quest_id: 'gt-100',
      realm_id: realmId,
      status: 'submitted',
      score: TOTAL_QUESTIONS - state.wrongAnswersThisRun,
      artifacts: {
        boss_encounter: {
          player_name: playerName,
          wrong_answers: String(state.wrongAnswersThisRun),
          completed_at_iso: now,
          encounter_version: '1.0',
        },
      },
      completed_at_iso: now,
    });
  }

  // ── CSS keyframes injected once ──────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes lh-boss-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes lh-boss-shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-8px); }
          40%  { transform: translateX(8px); }
          60%  { transform: translateX(-5px); }
          80%  { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        @keyframes lh-boss-flash-correct {
          0%, 100% { background: transparent; }
          50%      { background: rgba(34,197,94,0.15); }
        }
        @keyframes lh-boss-flash-wrong {
          0%, 100% { background: transparent; }
          50%      { background: rgba(239,68,68,0.15); }
        }
      `}</style>

      <div
        className="lh-world-map__layout"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          minHeight: 480,
          background: phase === 2
            ? 'linear-gradient(180deg, #1e0a3c 0%, #0f0f1e 100%)'
            : 'linear-gradient(180deg, #1a0f0a 0%, #0f0f1e 100%)',
          borderRadius: 8,
          overflow: 'hidden',
          transition: 'background 1s ease',
        }}
      >

        {/* ── PHASE BREAK ─────────────────────────────────────────────── */}
        {state.scene === 'phase_break' ? (
          <PhaseBreakScreen onDone={() => dispatch({ type: 'PHASE_BREAK_DONE' })} />
        ) : state.scene === 'victory' ? (
          /* ── VICTORY ─────────────────────────────────────────────────── */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>🏆</div>
            <h2
              style={{
                fontFamily: '"Cinzel", serif',
                color: '#fbbf24',
                fontSize: 'clamp(18px, 3vw, 28px)',
                margin: 0,
                textShadow: '0 0 20px rgba(251,191,36,0.6)',
                letterSpacing: '0.1em',
              }}
            >
              GUARDIAN DEFEATED
            </h2>
            <p
              style={{
                fontFamily: '"Cinzel", serif',
                color: '#d1d5db',
                fontSize: 'clamp(10px, 1.4vw, 14px)',
                maxWidth: 460,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The path to the Enrollment Realm stands open. Your mastery of career knowledge
              has broken the ancient seal. GT-101 — the Enrollment Rune — now awaits you.
            </p>
            {state.wrongAnswersThisRun > 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 'clamp(9px, 1.1vw, 11px)', margin: 0 }}>
                You stumbled {state.wrongAnswersThisRun} time{state.wrongAnswersThisRun !== 1 ? 's' : ''} — the Guardian tested you well.
              </p>
            ) : (
              <p style={{ color: '#34d399', fontSize: 'clamp(9px, 1.1vw, 11px)', margin: 0 }}>
                ✦ Perfect run — not a single mistake! ✦
              </p>
            )}
            <button
              type="button"
              className="lh-button lh-button--primary"
              style={{ marginTop: 8, minWidth: 180 }}
              onClick={handleVictoryComplete}
            >
              Claim victory & unlock GT-101
            </button>
          </div>

        ) : state.scene === 'defeated' ? (
          /* ── DEFEATED ────────────────────────────────────────────────── */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>💀</div>
            <h2
              style={{
                fontFamily: '"Cinzel", serif',
                color: '#ef4444',
                fontSize: 'clamp(18px, 3vw, 28px)',
                margin: 0,
                textShadow: '0 0 20px rgba(239,68,68,0.6)',
                letterSpacing: '0.1em',
              }}
            >
              DEFEATED
            </h2>
            <p
              style={{
                fontFamily: '"Cinzel", serif',
                color: '#d1d5db',
                fontSize: 'clamp(10px, 1.4vw, 14px)',
                maxWidth: 400,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The Guardian stands unbroken. But knowledge grows with each attempt —
              review the career concepts and try again. There is no penalty for retrying.
            </p>
            <button
              type="button"
              className="lh-button lh-button--primary"
              style={{ marginTop: 8, minWidth: 160 }}
              onClick={handleRetry}
            >
              Rise again & retry
            </button>
          </div>

        ) : currentQuestion ? (
          /* ── BATTLE ──────────────────────────────────────────────────── */
          <>
            {/* ── Arena header ── */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <BossHealthBar hpLost={state.bossHpLost} total={TOTAL_QUESTIONS} />
            </div>

            {/* ── Battlefield ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(0,0,0,0.15)',
                gap: 12,
                animation:
                  state.scene === 'answer_correct'
                    ? 'lh-boss-flash-correct 0.6s ease'
                    : state.scene === 'answer_wrong'
                      ? 'lh-boss-flash-wrong 0.6s ease, lh-boss-shake 0.4s ease'
                      : 'none',
              }}
            >
              {/* Player side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>🧙</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: PLAYER_MAX_HP }, (_, i) => (
                    <Heart key={i} filled={i < state.playerHp} />
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(8px, 1vw, 10px)',
                    color: '#9ca3af',
                    letterSpacing: '0.05em',
                  }}
                >
                  {playerName}
                </span>
              </div>

              {/* Phase label */}
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(8px, 1vw, 11px)',
                    color: phase === 2 ? '#a78bfa' : '#f87171',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Phase {phase}
                  {phase === 2 ? ' ★ ENRAGED' : ''}
                </span>
                <div style={{ color: '#4b5563', fontSize: 'clamp(7px, 0.9vw, 9px)', marginTop: 2 }}>
                  Q {state.questionIndex + 1} / {TOTAL_QUESTIONS}
                </div>
              </div>

              {/* Boss side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <BossSprite anim={state.bossAnim} enraged={phase === 2} />
                <span
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(8px, 1vw, 10px)',
                    color: phase === 2 ? '#a78bfa' : '#f87171',
                    letterSpacing: '0.05em',
                  }}
                >
                  The Guardian
                </span>
              </div>
            </div>

            {/* ── Question panel ── */}
            <div
              style={{
                flex: 1,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <p
                style={{
                  fontFamily: '"Cinzel", serif',
                  color: '#f3f4f6',
                  fontSize: 'clamp(11px, 1.5vw, 15px)',
                  lineHeight: 1.5,
                  margin: 0,
                  fontWeight: 600,
                  whiteSpace: 'pre-line',
                }}
              >
                {currentQuestion.prompt}
              </p>

              {/* Answer options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = state.selectedOption === i;
                  const correct = i === currentQuestion.answerIndex;
                  const showResult =
                    state.scene === 'answer_correct' || state.scene === 'answer_wrong';

                  let bg = 'rgba(255,255,255,0.06)';
                  let border = '1px solid rgba(255,255,255,0.12)';
                  let color = '#d1d5db';
                  if (showResult && correct) { bg = 'rgba(34,197,94,0.18)'; border = '1px solid #22c55e'; color = '#bbf7d0'; }
                  if (showResult && isSelected && !correct) { bg = 'rgba(239,68,68,0.18)'; border = '1px solid #ef4444'; color = '#fca5a5'; }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={state.scene !== 'battle'}
                      onClick={() => handleSelectAnswer(i)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: bg,
                        border,
                        borderRadius: 6,
                        color,
                        fontFamily: '"Cinzel", serif',
                        fontSize: 'clamp(9px, 1.15vw, 12px)',
                        cursor: state.scene === 'battle' ? 'pointer' : 'default',
                        transition: 'background 0.2s, border 0.2s',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong style={{ marginRight: 8, opacity: 0.6 }}>
                        {String.fromCharCode(65 + i)}.
                      </strong>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback + continue */}
              {(state.scene === 'answer_correct' || state.scene === 'answer_wrong') ? (
                <div
                  style={{
                    background:
                      state.scene === 'answer_correct'
                        ? 'rgba(34,197,94,0.12)'
                        : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${state.scene === 'answer_correct' ? '#22c55e44' : '#ef444444'}`,
                    borderRadius: 6,
                    padding: '10px 14px',
                    marginTop: 4,
                  }}
                >
                  <p
                    style={{
                      color: state.scene === 'answer_correct' ? '#86efac' : '#fca5a5',
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 700,
                      fontSize: 'clamp(9px, 1.1vw, 12px)',
                      margin: '0 0 4px',
                    }}
                  >
                    {state.scene === 'answer_correct' ? '✓ Correct!' : '✗ Wrong answer'}
                  </p>
                  <p
                    style={{
                      color: '#d1d5db',
                      fontSize: 'clamp(8px, 1vw, 11px)',
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {currentQuestion.feedback}
                  </p>
                  <button
                    type="button"
                    className="lh-button lh-button--ghost"
                    style={{ fontSize: 'clamp(9px, 1.1vw, 12px)', padding: '6px 16px' }}
                    onClick={handleAdvance}
                  >
                    Continue →
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
