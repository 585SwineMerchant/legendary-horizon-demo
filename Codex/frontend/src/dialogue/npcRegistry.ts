import type { LhNpcRegistryEntry, LhNpcRegistryV1 } from '../domain/lh-dialogue';

export function findNpcEntry(registry: LhNpcRegistryV1, npcId: string): LhNpcRegistryEntry | undefined {
  return registry.npcs.find((n) => n.npc_id === npcId);
}

export function formatNpcSpeakerLabel(entry: LhNpcRegistryEntry | undefined): string {
  if (!entry) return 'Unknown voice';
  return `${entry.display_name} · ${entry.role_label}`;
}
