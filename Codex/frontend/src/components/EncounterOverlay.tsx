import { useCallback, useEffect, useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { LH_COMBAT_WIN_XP, LH_VOCAB_WIN_XP } from '../encounter/encounterConstants';
import {
  FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS,
  KNOWLEDGE_COMBAT_CORRECT_REQUIRED,
  rotateQuestionOptions,
} from '../encounter/knowledgeCombatShared';
import { KNOWLEDGE_COMBAT_QUESTIONS } from '../encounter/knowledgeCombatQuestions';
import { dispatchKnowledgeCombatVisual } from '../lib/lhKnowledgeCombatBridge';
import { playLhSfx } from '../lib/lhSfx';

export type EncounterPresentationMode = 'modal' | 'jrpg_knowledge';

export type EncounterLaunchPayload = {
  kind: 'combat_encounter' | 'vocab_battle';
  interactableId: string;
  target_quest_id?: string;
  title: string;
  /** When `jrpg_knowledge`, React renders `KnowledgeJrpgBattleOverlay` instead of this modal shell. */
  presentation?: EncounterPresentationMode;
  /** Reserved for multi-enemy knowledge battles (Phaser / UI copy). */
  enemyTemplateId?: string;
};

type Props = {
  payload: EncounterLaunchPayload;
  onWin: (summary: { requestedXp: number }) => void;
  onRetreat: () => void;
};

type VocabQ = { word: string; prompt: string; options: string[]; answerIndex: number };
const VOCAB_DECK: VocabQ[] = [
  {
    word: 'Archetype',
    prompt: 'Pick the best classroom meaning for “archetype” in Legendary Horizon.',
    options: ['A reusable story pattern you can map to careers', 'A type of spreadsheet bug', 'A combat buff only'],
    answerIndex: 0,
  },
  {
    word: 'Directive',
    prompt: 'What is your “directive” in the Codex slice?',
    options: [
      'The facilitator-visible next step from your save row',
      'A secret achievement',
      'The map fog color',
    ],
    answerIndex: 0,
  },
];

function playBattleBuffSuccessTrill(): void {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.lhAudio === 'muted') return;

  const audio = new Audio('/assets/Audio/success%20trill.wav');
  audio.volume = 0.72;
  void audio.play().catch(() => undefined);
}

/**
 * Milestone 17 — lightweight combat + vocab micro-encounters (no real-time engine).
 */
export function EncounterOverlay({ payload, onWin, onRetreat }: Props) {
  if (payload.presentation === 'jrpg_knowledge') {
    return null;
  }

  const requestedXp = payload.kind === 'combat_encounter' ? LH_COMBAT_WIN_XP : LH_VOCAB_WIN_XP;

  const [knowledgeRound, setKnowledgeRound] = useState(0);
  const [knowledgeCorrect, setKnowledgeCorrect] = useState(0);
  const [knowledgeWrong, setKnowledgeWrong] = useState(false);
  const [knowledgePhase, setKnowledgePhase] = useState<'question' | 'won'>('question');
  const [vocabRound, setVocabRound] = useState(0);
  const [vocabWrong, setVocabWrong] = useState(false);

  const handleRetreat = useCallback(() => {
    if (payload.kind === 'combat_encounter') {
      dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'retreat' });
    }
    onRetreat();
  }, [onRetreat, payload.interactableId, payload.kind]);

  useEscapeToClose(true, handleRetreat);

  const vocabQuestions = useMemo(() => VOCAB_DECK, []);
  const currentVocab = vocabQuestions[vocabRound] ?? vocabQuestions[0];
  const knowledgeQuestions = useMemo(
    () =>
      (KNOWLEDGE_COMBAT_QUESTIONS.length ? KNOWLEDGE_COMBAT_QUESTIONS : FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS)
        .slice(0, KNOWLEDGE_COMBAT_CORRECT_REQUIRED)
        .map(rotateQuestionOptions),
    [],
  );
  const currentKnowledge = knowledgeQuestions[knowledgeRound] ?? knowledgeQuestions[0];

  useEffect(() => {
    if (payload.kind === 'combat_encounter') {
      dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'start' });
    }
  }, [payload.interactableId, payload.kind]);

  const pickKnowledge = useCallback(
    (idx: number) => {
      if (!currentKnowledge || knowledgePhase !== 'question') return;
      if (idx !== currentKnowledge.roundAnswerIndex) {
        setKnowledgeWrong(true);
        dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'wrong' });
        playLhSfx('lost_echo_attack');
        return;
      }

      const nextCorrect = knowledgeCorrect + 1;
      setKnowledgeCorrect(nextCorrect);
      setKnowledgeWrong(false);
      dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'correct' });
      playLhSfx('traveler_attack');
      if (nextCorrect >= KNOWLEDGE_COMBAT_CORRECT_REQUIRED) {
        setKnowledgePhase('won');
        dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'victory' });
        playLhSfx('lost_echo_defeat');
        window.setTimeout(() => {
          dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'buff' });
          playBattleBuffSuccessTrill();
        }, 1180);
        return;
      }
      setKnowledgeRound((r) => Math.min(r + 1, knowledgeQuestions.length - 1));
    },
    [currentKnowledge, knowledgeCorrect, knowledgePhase, knowledgeQuestions.length, payload.interactableId],
  );

  const pickVocab = useCallback(
    (idx: number) => {
      if (!currentVocab) return;
      if (idx === currentVocab.answerIndex) {
        if (vocabRound + 1 >= vocabQuestions.length) {
          onWin({ requestedXp });
          return;
        }
        setVocabRound((r) => r + 1);
        setVocabWrong(false);
      } else {
        setVocabWrong(true);
      }
    },
    [currentVocab, onWin, requestedXp, vocabQuestions.length, vocabRound],
  );

  const finishCombatWin = useCallback(() => {
    onWin({ requestedXp });
  }, [onWin, requestedXp]);

  return (
    <div className="lh-overlay lh-overlay--dim lh-encounter-overlay" role="dialog" aria-modal="true" aria-labelledby="enc-title">
      <div className="lh-panel lh-panel--encounter">
        <h2 id="enc-title" className="lh-heading-md lh-encounter__title">
          {payload.title}
        </h2>
        <p className="lh-encounter__subtitle">
          {payload.kind === 'combat_encounter'
            ? 'Knowledge combat — answer career-planning questions to disperse the Lost Echo.'
            : 'Vocabulary trial — two correct answers seal the rune.'}
        </p>

        {payload.kind === 'combat_encounter' ? (
          <div className="lh-encounter__body">
            {knowledgePhase === 'question' ? (
              <>
                <div className="lh-encounter__bars">
                  <div>
                    <span className="lh-encounter__label">Resolve</span>
                    <div className="lh-encounter__meter">
                      <span style={{ width: '100%' }} className="lh-encounter__meter-fill lh-encounter__meter-fill--player" />
                    </div>
                    <span className="lh-encounter__stat">Steady</span>
                  </div>
                  <div>
                    <span className="lh-encounter__label">Lost Echo</span>
                    <div className="lh-encounter__meter">
                      <span
                        style={{ width: `${((KNOWLEDGE_COMBAT_CORRECT_REQUIRED - knowledgeCorrect) / KNOWLEDGE_COMBAT_CORRECT_REQUIRED) * 100}%` }}
                        className="lh-encounter__meter-fill lh-encounter__meter-fill--enemy"
                      />
                    </div>
                    <span className="lh-encounter__stat">
                      {KNOWLEDGE_COMBAT_CORRECT_REQUIRED - knowledgeCorrect} answers remain
                    </span>
                  </div>
                </div>
                <p className="lh-encounter__hint">
                  {currentKnowledge.category} · Question {knowledgeRound + 1} of {KNOWLEDGE_COMBAT_CORRECT_REQUIRED}
                </p>
                <p className="lh-encounter__prompt">{currentKnowledge.prompt}</p>
                {knowledgeWrong ? (
                  <p className="lh-encounter__wrong">The Lost Echo lashes out, but your resolve holds. Try another answer.</p>
                ) : null}
                <div className="lh-encounter__choices">
                  {currentKnowledge.roundOptions.map((opt, i) => (
                    <button key={opt} type="button" className="lh-button lh-button--secondary lh-encounter__choice" onClick={() => pickKnowledge(i)}>
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="lh-stack lh-stack--horizontal lh-encounter__actions">
                  <button type="button" className="lh-button lh-button--ghost" onClick={handleRetreat}>
                    Step back
                  </button>
                </div>
              </>
            ) : null}
            {knowledgePhase === 'won' ? (
              <div className="lh-encounter__outcome">
                <p className="lh-encounter__outcome-text">The Lost Echo dissolves. The Traveler's Resolve Deepens — Maximum Stamina Increased.</p>
                <button type="button" className="lh-button lh-button--primary" onClick={finishCombatWin}>
                  Claim reward
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="lh-encounter__body">
            <p className="lh-encounter__word">
              Word: <strong>{currentVocab.word}</strong>
            </p>
            <p className="lh-encounter__prompt">{currentVocab.prompt}</p>
            {vocabWrong ? <p className="lh-encounter__wrong">Not quite — try another option.</p> : null}
            <div className="lh-encounter__choices">
              {currentVocab.options.map((opt, i) => (
                <button key={opt} type="button" className="lh-button lh-button--secondary lh-encounter__choice" onClick={() => pickVocab(i)}>
                  {opt}
                </button>
              ))}
            </div>
            <button type="button" className="lh-button lh-button--ghost lh-encounter__retreat" onClick={handleRetreat}>
              Walk away (no XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
