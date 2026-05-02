import type { QuestDefinition } from './lh-contract';

/**
 * Milestone 16 — data-driven dialogue conditions (evaluated against live `PlayerSave` + quests + realm).
 */
export type LhDialogueQuestStatus = QuestDefinition['status'];

export type LhDialogueCondition =
  | { kind: 'always' }
  | { kind: 'quest_status'; quest_id: string; any_of: LhDialogueQuestStatus[] }
  | { kind: 'act_gte'; act: number }
  | { kind: 'realm_is'; realm_id: string };

export type LhDialogueLine = {
  line_id: string;
  /** Substitute `{display_name}`, `{realm_display_name}`, `{current_act}`, `{required_next_action}`, `{last_completed_summary}`, `{active_main_quest_title}`. */
  text: string;
  conditions?: LhDialogueCondition[];
};

/** Optional realm-scoped hook rows (oracle at a hearth, scribe in archives, etc.). */
export type LhRealmLoreDialogueLine = {
  line_id: string;
  realm_id: string;
  npc_id: string;
  text: string;
  conditions?: LhDialogueCondition[];
};

export type LhDialogueCatalogV1 = {
  schema_version: 1;
  banks: Record<string, LhDialogueLine[]>;
  realm_lore: LhRealmLoreDialogueLine[];
};

export type LhNpcRegistryEntry = {
  npc_id: string;
  display_name: string;
  role_label: string;
  /** Key in `dialogue_catalog.banks`. */
  default_dialogue_bank: string;
  /** Optional `media_assets.json` portrait id. */
  portrait_asset_id?: string;
  /** Short card title when no line-specific title. */
  card_title?: string;
};

export type LhNpcRegistryV1 = {
  schema_version: 1;
  npcs: LhNpcRegistryEntry[];
};
