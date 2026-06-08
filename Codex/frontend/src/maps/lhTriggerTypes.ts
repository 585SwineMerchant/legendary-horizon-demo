/** Milestone 5 — Tiled trigger kinds (roadmap-aligned + unknown fallback). */

export const LH_TRIGGER_KINDS = [
  'quest_start',
  'quest_complete',
  'quest_advance',
  'npc_dialogue',
  'fog_clear',
  'external_link',
  'vocab_battle',
  'combat_encounter',
  // Oracle shrine encounter — routes to oracle_veiled NPC dialogue in the dispatcher.
  'oracle_encounter',
  // Oracle altar proximity zone — player walks in and presses Space to open the Scroll there.
  // No Enter/E interaction; handled entirely by the altar zone + Space intercept in PhaserExplorationView.
  'oracle_altar_zone',
  'guild_hq_research',
  'guild_manager_hq',
  'guild_interview_invite',
  'maia_portal',
] as const;

export type LhTriggerKind = (typeof LH_TRIGGER_KINDS)[number] | 'unknown';

export function normaliseLhTriggerKind(raw: string): LhTriggerKind {
  const k = String(raw || '').trim();
  if ((LH_TRIGGER_KINDS as readonly string[]).includes(k)) {
    return k as LhTriggerKind;
  }
  return 'unknown';
}
