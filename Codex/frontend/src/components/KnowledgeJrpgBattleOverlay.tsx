import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS,
  KNOWLEDGE_COMBAT_CORRECT_REQUIRED,
  rotateQuestionOptions,
} from '../encounter/knowledgeCombatShared';
import { KNOWLEDGE_COMBAT_QUESTIONS } from '../encounter/knowledgeCombatQuestions';
import { LH_COMBAT_WIN_XP } from '../encounter/encounterConstants';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import {
  dispatchKnowledgeBattlePresentation,
  dispatchKnowledgeCombatVisual,
} from '../lib/lhKnowledgeCombatBridge';
import { playLhSfx } from '../lib/lhSfx';

import type { EncounterLaunchPayload } from './EncounterOverlay';

type Props = {
  payload: EncounterLaunchPayload;
  onWin: (summary: { requestedXp: number }) => void;
  onRetreat: () => void;
};

const FB_CORRECT_MS = 780;
const FB_WRONG_MS = 920;
const FINAL_STRIKE_TO_VICTORY_MS = 760;
/** After Echo death anim; then outcome UI + Traveler resolve buff VFX. */
const JRPG_VICTORY_DEATH_TO_OUTCOME_MS = 1180;
const RESOLVE_MAX = 3;

export function KnowledgeJrpgBattleOverlay({ payload, onWin, onRetreat }: Props) {
  const requestedXp = LH_COMBAT_WIN_XP;
  const explicitExitDone = useRef(false);

  const [knowledgeRound, setKnowledgeRound] = useState(0);
  const [knowledgeCorrect, setKnowledgeCorrect] = useState(0);
  const [knowledgePhase, setKnowledgePhase] = useState<'question' | 'won'>('question');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inputLocked, setInputLocked] = useState(false);
  const [resolveHearts, setResolveHearts] = useState(RESOLVE_MAX);
  const [echoSurge, setEchoSurge] = useState(0);

  const knowledgeQuestions = useMemo(
    () =>
      (KNOWLEDGE_COMBAT_QUESTIONS.length ? KNOWLEDGE_COMBAT_QUESTIONS : FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS)
        .slice(0, KNOWLEDGE_COMBAT_CORRECT_REQUIRED)
        .map(rotateQuestionOptions),
    [],
  );
  const currentKnowledge = knowledgeQuestions[knowledgeRound] ?? knowledgeQuestions[0];

  const exitPresentation = useCallback((victory: boolean) => {
    explicitExitDone.current = true;
    dispatchKnowledgeBattlePresentation({ action: 'exit', victory });
  }, []);

  useEffect(() => {
    explicitExitDone.current = false;
    setResolveHearts(RESOLVE_MAX);
    setEchoSurge(0);
    dispatchKnowledgeBattlePresentation({
      action: 'enter',
      interactableId: payload.interactableId,
      enemyTemplateId: payload.enemyTemplateId,
    });
    dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'start' });
    // Audio lane is fully owned by App.tsx (activeEncounter effect → setLane('battle')).
    // The overlay must not register any gesture-unlock listeners here — they race with App.tsx's
    // M-key mute toggle (both fire capture-phase on window, same event) and corrupt the mute state.
    // Autoplay unlock is handled by the internal retry listeners inside createLoopingHtmlMusic.
    return () => {
      if (!explicitExitDone.current) {
        dispatchKnowledgeBattlePresentation({ action: 'exit', victory: false });
      }
    };
  }, [payload.interactableId, payload.enemyTemplateId]);

  const handleRetreat = useCallback(() => {
    if (knowledgePhase === 'won') return;
    dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'retreat' });
    exitPresentation(false);
    onRetreat();
  }, [exitPresentation, knowledgePhase, onRetreat, payload.interactableId]);

  useEscapeToClose(knowledgePhase === 'question', handleRetreat);

  const releaseLockAfter = useCallback((ms: number, after?: () => void) => {
    window.setTimeout(() => {
      after?.();
      setInputLocked(false);
      setFeedback(null);
    }, ms);
  }, []);

  const pickKnowledge = useCallback(
    (idx: number) => {
      if (!currentKnowledge || knowledgePhase !== 'question' || inputLocked) return;

      if (idx !== currentKnowledge.roundAnswerIndex) {
        playLhSfx('answer_incorrect');
        setInputLocked(true);
        setResolveHearts((n) => Math.max(0, n - 1));
        setEchoSurge((s) => Math.min(100, s + 22));
        setFeedback('The Echo lashes back — resolve slips, surge rises.');
        dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'wrong' });
        releaseLockAfter(FB_WRONG_MS);
        return;
      }

      setInputLocked(true);
      playLhSfx('answer_correct');
      const nextCorrect = knowledgeCorrect + 1;
      setKnowledgeCorrect(nextCorrect);
      dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'correct' });
      if (nextCorrect >= KNOWLEDGE_COMBAT_CORRECT_REQUIRED) {
        setFeedback('Your resolve cuts through the mist.');
        window.setTimeout(() => {
          dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'victory' });
          playLhSfx('lost_echo_defeat');
        }, FINAL_STRIKE_TO_VICTORY_MS);
        window.setTimeout(() => {
          setKnowledgePhase('won');
          setFeedback('The Lost Echo fades into the Fog.');
          setInputLocked(false);
          dispatchKnowledgeCombatVisual({ interactableId: payload.interactableId, phase: 'buff' });
        }, FINAL_STRIKE_TO_VICTORY_MS + JRPG_VICTORY_DEATH_TO_OUTCOME_MS);
        return;
      }

      setFeedback('Your resolve cuts through the mist.');
      releaseLockAfter(FB_CORRECT_MS, () =>
        setKnowledgeRound((r) => Math.min(r + 1, knowledgeQuestions.length - 1)),
      );
    },
    [
      currentKnowledge,
      inputLocked,
      knowledgeCorrect,
      knowledgePhase,
      knowledgeQuestions.length,
      payload.interactableId,
      releaseLockAfter,
    ],
  );

  const finishCombatWin = useCallback(() => {
    exitPresentation(true);
    onWin({ requestedXp });
  }, [exitPresentation, onWin, requestedXp]);

  const enemyRemaining = KNOWLEDGE_COMBAT_CORRECT_REQUIRED - knowledgeCorrect;

  const resolvePct = Math.max(0, (resolveHearts / RESOLVE_MAX) * 100);

  return (
    <div className="lh-jrpg-battle-root" aria-live="polite">
      <div className="lh-jrpg-battle-veil" aria-hidden="true" />
      <div className="lh-jrpg-battle-hud" aria-hidden="true">
        <div className="lh-jrpg-status lh-jrpg-status--traveler">
          <div className="lh-jrpg-status__title-row">
            <span className="lh-jrpg-status__name">Traveler</span>
            <span className="lh-jrpg-status__tag" title="Stamina reward pending this trial">
              ⚡ Resolve trial
            </span>
          </div>
          <div className="lh-jrpg-meter" role="img" aria-label={`Traveler resolve, ${resolveHearts} of ${RESOLVE_MAX}`}>
            <div className="lh-jrpg-meter__fill lh-jrpg-meter__fill--traveler" style={{ width: `${resolvePct}%` }} />
          </div>
          <span className="lh-jrpg-status__caption">
            {resolveHearts <= 0 ? 'Shaken — the Echo is pressing' : `${resolveHearts} resolve`}
          </span>
        </div>

        <div className="lh-jrpg-status lh-jrpg-status--enemy">
          <div className="lh-jrpg-status__title-row">
            <span className="lh-jrpg-status__name">{payload.title || 'Foe'}</span>
          </div>
          <div
            className="lh-jrpg-meter"
            role="img"
            aria-label={`Enemy resolve, ${enemyRemaining} correct answers to defeat`}
          >
            <div
              className="lh-jrpg-meter__fill lh-jrpg-meter__fill--enemy"
              style={{
                width: `${Math.max(0, (enemyRemaining / KNOWLEDGE_COMBAT_CORRECT_REQUIRED) * 100)}%`,
              }}
            />
          </div>
          <span className="lh-jrpg-status__caption">
            {knowledgePhase === 'won' ? 'Dispersed' : `${enemyRemaining} truths remain`}
          </span>
          <div className="lh-jrpg-surge-row" aria-label={`Echo surge ${echoSurge} percent`}>
            <span className="lh-jrpg-surge-label">Echo surge</span>
            <div className="lh-jrpg-meter lh-jrpg-meter--thin">
              <div className="lh-jrpg-meter__fill lh-jrpg-meter__fill--surge" style={{ width: `${echoSurge}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="lh-jrpg-command-shell">
        <div className="lh-jrpg-command-panel" role="region" aria-label="Knowledge combat commands">
          <p className="lh-jrpg-command-eyebrow">The Echo challenges your resolve…</p>

          {knowledgePhase === 'question' ? (
            <>
              <p className="lh-jrpg-command-meta">
                {currentKnowledge.category} · Strike {knowledgeRound + 1} / {KNOWLEDGE_COMBAT_CORRECT_REQUIRED}
              </p>
              <p className="lh-jrpg-command-prompt">{currentKnowledge.prompt}</p>
              {feedback ? <p className="lh-jrpg-command-feedback">{feedback}</p> : null}
              <div className="lh-jrpg-choice-grid">
                {currentKnowledge.roundOptions.map((opt, i) => (
                  <button
                    key={`${currentKnowledge.id}-${opt}`}
                    type="button"
                    className="lh-button lh-button--secondary lh-jrpg-choice"
                    disabled={inputLocked}
                    onClick={() => pickKnowledge(i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="lh-button lh-button--ghost lh-jrpg-retreat"
                disabled={inputLocked}
                onClick={handleRetreat}
              >
                Step back
              </button>
            </>
          ) : (
            <div className="lh-jrpg-outcome">
              {feedback ? <p className="lh-jrpg-command-feedback">{feedback}</p> : null}
              <p className="lh-jrpg-outcome-reward">
                The Traveler&apos;s Resolve Deepens — Maximum Stamina Increased
              </p>
              <button type="button" className="lh-button lh-button--primary" data-lh-continue onClick={finishCombatWin}>
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
