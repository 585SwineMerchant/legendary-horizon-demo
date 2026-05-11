export const LH_WINDOW_KNOWLEDGE_COMBAT_VISUAL = 'lh:knowledge-combat-visual';

/** Pauses exploration movement and mounts the JRPG-style battle layer inside Phaser (scroll-fixed). */
export const LH_WINDOW_KNOWLEDGE_BATTLE_PRESENTATION = 'lh:knowledge-battle-presentation';

export type LhKnowledgeCombatVisualPhase = 'start' | 'correct' | 'wrong' | 'victory' | 'buff' | 'retreat';

export type LhKnowledgeCombatVisualDetail = {
  interactableId: string;
  phase: LhKnowledgeCombatVisualPhase;
};

export type LhKnowledgeBattlePresentationDetail =
  | { action: 'enter'; interactableId: string; enemyTemplateId?: string }
  | { action: 'exit'; victory?: boolean };

export function dispatchKnowledgeCombatVisual(detail: LhKnowledgeCombatVisualDetail): void {
  window.dispatchEvent(new CustomEvent<LhKnowledgeCombatVisualDetail>(LH_WINDOW_KNOWLEDGE_COMBAT_VISUAL, { detail }));
}

export function dispatchKnowledgeBattlePresentation(detail: LhKnowledgeBattlePresentationDetail): void {
  window.dispatchEvent(
    new CustomEvent<LhKnowledgeBattlePresentationDetail>(LH_WINDOW_KNOWLEDGE_BATTLE_PRESENTATION, { detail }),
  );
}
