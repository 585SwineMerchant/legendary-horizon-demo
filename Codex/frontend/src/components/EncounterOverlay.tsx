import { useCallback, useMemo, useState } from 'react';

import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { LH_COMBAT_WIN_XP, LH_VOCAB_WIN_XP } from '../encounter/encounterConstants';

export type EncounterLaunchPayload = {
  kind: 'combat_encounter' | 'vocab_battle';
  interactableId: string;
  target_quest_id?: string;
  title: string;
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

/**
 * Milestone 17 — lightweight combat + vocab micro-encounters (no real-time engine).
 */
export function EncounterOverlay({ payload, onWin, onRetreat }: Props) {
  const requestedXp = payload.kind === 'combat_encounter' ? LH_COMBAT_WIN_XP : LH_VOCAB_WIN_XP;

  const [combat, setCombat] = useState({ playerHp: 36, enemyHp: 28, round: 1 });
  const [vocabRound, setVocabRound] = useState(0);
  const [vocabWrong, setVocabWrong] = useState(false);
  const [combatPhase, setCombatPhase] = useState<'fight' | 'won' | 'lost'>('fight');

  useEscapeToClose(true, onRetreat);

  const vocabQuestions = useMemo(() => VOCAB_DECK, []);
  const currentVocab = vocabQuestions[vocabRound] ?? vocabQuestions[0];

  const strike = useCallback(() => {
    setCombat((c) => {
      if (c.enemyHp <= 0 || c.playerHp <= 0) return c;
      const nextEnemy = Math.max(0, c.enemyHp - 12);
      const enemyHitsBack = nextEnemy > 0;
      const nextPlayer = enemyHitsBack ? Math.max(0, c.playerHp - 9) : c.playerHp;
      if (nextEnemy <= 0) {
        setCombatPhase('won');
        return { playerHp: nextPlayer, enemyHp: 0, round: c.round + 1 };
      }
      if (nextPlayer <= 0) {
        setCombatPhase('lost');
        return { playerHp: 0, enemyHp: nextEnemy, round: c.round + 1 };
      }
      return { playerHp: nextPlayer, enemyHp: nextEnemy, round: c.round + 1 };
    });
  }, []);

  const resetCombat = useCallback(() => {
    setCombat({ playerHp: 36, enemyHp: 28, round: 1 });
    setCombatPhase('fight');
  }, []);

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
            ? 'Prototype skirmish — trade blows until the warden breaks.'
            : 'Vocabulary trial — two correct answers seal the rune.'}
        </p>

        {payload.kind === 'combat_encounter' ? (
          <div className="lh-encounter__body">
            {combatPhase === 'fight' ? (
              <>
                <div className="lh-encounter__bars">
                  <div>
                    <span className="lh-encounter__label">You</span>
                    <div className="lh-encounter__meter">
                      <span style={{ width: `${(combat.playerHp / 36) * 100}%` }} className="lh-encounter__meter-fill lh-encounter__meter-fill--player" />
                    </div>
                    <span className="lh-encounter__stat">{combat.playerHp} / 36</span>
                  </div>
                  <div>
                    <span className="lh-encounter__label">Warden</span>
                    <div className="lh-encounter__meter">
                      <span style={{ width: `${(combat.enemyHp / 28) * 100}%` }} className="lh-encounter__meter-fill lh-encounter__meter-fill--enemy" />
                    </div>
                    <span className="lh-encounter__stat">{combat.enemyHp} / 28</span>
                  </div>
                </div>
                <p className="lh-encounter__hint">Round {combat.round} — Strike deals 12; the warden answers for 9 if it still stands.</p>
                <div className="lh-stack lh-stack--horizontal lh-encounter__actions">
                  <button type="button" className="lh-button lh-button--primary" onClick={strike} disabled={combat.enemyHp <= 0}>
                    Strike
                  </button>
                  <button type="button" className="lh-button lh-button--ghost" onClick={onRetreat}>
                    Retreat
                  </button>
                </div>
              </>
            ) : null}
            {combatPhase === 'won' ? (
              <div className="lh-encounter__outcome">
                <p className="lh-encounter__outcome-text">The warden yields — XP is tallied when you continue.</p>
                <button type="button" className="lh-button lh-button--primary" onClick={finishCombatWin}>
                  Claim reward
                </button>
              </div>
            ) : null}
            {combatPhase === 'lost' ? (
              <div className="lh-encounter__outcome">
                <p className="lh-encounter__outcome-text">You are staggered — catch your breath and try again, or retreat.</p>
                <div className="lh-stack lh-stack--horizontal">
                  <button type="button" className="lh-button lh-button--secondary" onClick={resetCombat}>
                    Retry
                  </button>
                  <button type="button" className="lh-button lh-button--ghost" onClick={onRetreat}>
                    Retreat
                  </button>
                </div>
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
            <button type="button" className="lh-button lh-button--ghost lh-encounter__retreat" onClick={onRetreat}>
              Walk away (no XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
