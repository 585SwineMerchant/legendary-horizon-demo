import type { ManualSaveEnvelopeV1, PlayerSave, QuestDefinition } from '../domain/lh-contract';

export type PersistManualSaveOutcome = {
  ok: boolean;
  revision?: string;
  message: string;
  errors?: string[];
};

export function validatePlayerForManualSave(player: PlayerSave): string[] {
  const errors: string[] = [];

  const requireString = (key: keyof PlayerSave, label: string) => {
    const value = player[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${label} is required before saving.`);
    }
  };

  requireString('player_id', 'Player ID');
  requireString('display_name', 'Display name');
  requireString('active_main_quest_id', 'Active quest');
  requireString('current_realm_id', 'Current realm');
  requireString('required_next_action', 'Required next action');

  if (!Number.isFinite(player.current_act)) {
    errors.push('Current act must be a finite number.');
  }
  if (!Number.isFinite(player.xp_total) || player.xp_total < 0) {
    errors.push('XP total must be a non‑negative finite number.');
  }
  if (!Number.isFinite(player.level_cached) || player.level_cached < 1) {
    errors.push('Level must be ≥ 1 for manual saves.');
  }
  const inv = player.inventory_summary;
  if (!inv || !Array.isArray(inv.items) || typeof inv.coins !== 'number') {
    errors.push('Inventory summary must mirror the workbook-backed shape (coins + items[]).');
  }

  return errors;
}

export function buildManualSaveEnvelope(args: {
  player: PlayerSave;
  questsSnapshot: QuestDefinition[];
  realmId: string;
  visitedTriggerInteractableIds: string[];
}): ManualSaveEnvelopeV1 {
  return {
    schema_version: 1,
    saved_at_iso: new Date().toISOString(),
    player_snapshot: JSON.parse(JSON.stringify(args.player)),
    quests_snapshot: JSON.parse(JSON.stringify(args.questsSnapshot)),
    realm_id: args.realmId,
    progression_flags: {
      visited_trigger_object_ids: [...args.visitedTriggerInteractableIds],
    },
  };
}

/** Simulates `SaveService.applyManualSave_` latency + logging until Apps Script is deployed. */
export async function simulateManualSavePersist(envelope: ManualSaveEnvelopeV1): Promise<PersistManualSaveOutcome> {
  await new Promise((r) => setTimeout(r, 320));

  console.info('[LhManualSave]', 'Simulated Sheets write payload:', envelope);

  const revisionToken = `${envelope.player_snapshot.player_id}:${Date.now().toString(36)}`;

  return {
    ok: true,
    revision: revisionToken,
    message: 'Validated manual save assembled locally — ready for Apps Script `LhApplyManualSaveUpdate`.',
  };
}
