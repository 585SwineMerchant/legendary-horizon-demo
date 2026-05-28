import type { LhDialogueCatalogV1, LhDialogueLine, LhNpcRegistryEntry, LhNpcRegistryV1, LhRealmLoreDialogueLine } from '../domain/lh-dialogue';
import type { PlayerSave, QuestDefinition, RealmDefinition } from '../domain/lh-contract';

import { lineMatchesConditions, type DialogueEvalContext } from './dialogueConditions';

export function interpolateLhDialogueTemplate(text: string, ctx: DialogueEvalContext): string {
  const { player, realm } = ctx;
  let out = text
    .replace(/\{display_name\}/g, player.display_name)
    .replace(/\{realm_display_name\}/g, realm.display_name)
    .replace(/\{current_act\}/g, String(player.current_act))
    .replace(/\{required_next_action\}/g, player.required_next_action)
    .replace(/\{last_completed_summary\}/g, player.last_completed_summary)
    .replace(/\{active_main_quest_title\}/g, player.active_main_quest_title);
  // Replace any extra_tokens supplied by the caller (e.g. {prophecy_number}, {career_cluster_name}).
  if (ctx.extra_tokens) {
    for (const [key, value] of Object.entries(ctx.extra_tokens)) {
      out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }
  return out;
}

export function pickFirstMatchingDialogueLine(lines: LhDialogueLine[], ctx: DialogueEvalContext): LhDialogueLine | null {
  for (const line of lines) {
    if (lineMatchesConditions(line.conditions, ctx)) return line;
  }
  return null;
}

function realmLoreToLine(row: LhRealmLoreDialogueLine): LhDialogueLine {
  return { line_id: row.line_id, text: row.text, conditions: row.conditions };
}

export function pickRealmLoreDialogueLine(
  catalog: LhDialogueCatalogV1,
  realmId: string,
  npcId: string,
  ctx: DialogueEvalContext,
): LhDialogueLine | null {
  const rows = catalog.realm_lore.filter((r) => r.realm_id === realmId && r.npc_id === npcId);
  for (const row of rows) {
    const line = realmLoreToLine(row);
    if (lineMatchesConditions(line.conditions, ctx)) return line;
  }
  return null;
}

export function resolveNpcDialogueBody(
  npcId: string,
  catalog: LhDialogueCatalogV1,
  registry: LhNpcRegistryV1,
  ctx: DialogueEvalContext,
): { body: string; npc: LhNpcRegistryEntry | undefined } {
  const npc = registry.npcs.find((n) => n.npc_id === npcId);
  const realmId = ctx.player.current_realm_id;
  const lore = pickRealmLoreDialogueLine(catalog, realmId, npcId, ctx);
  if (lore) {
    return { body: interpolateLhDialogueTemplate(lore.text, ctx), npc };
  }
  const bankKey = npc?.default_dialogue_bank ?? 'mentor_default';
  const bank = catalog.banks[bankKey] ?? catalog.banks.mentor_default ?? [];
  const line = pickFirstMatchingDialogueLine(bank, ctx);
  const raw = line?.text ?? 'They hold their peace for now — check back after the next save or quest shift.';
  return { body: interpolateLhDialogueTemplate(raw, ctx), npc };
}

export function buildResumeDialogBody(
  player: PlayerSave,
  realm: RealmDefinition,
  quests: QuestDefinition[],
  catalog: LhDialogueCatalogV1,
): string {
  const ctx: DialogueEvalContext = { player, realm, quests };
  const bank = catalog.banks.resume_mentor ?? [];
  const line = pickFirstMatchingDialogueLine(bank, ctx);
  const raw =
    line?.text ??
    `Brave Traveler ${player.display_name}, your last oath-mark was ${player.last_completed_summary}\n\nYou now stand nearing ${realm.display_name} within Act ${player.current_act}. The land asks you to heed this thread: "${player.required_next_action}"\n\nReturn when the Ledger hums anew.`;
  return interpolateLhDialogueTemplate(raw, ctx);
}
