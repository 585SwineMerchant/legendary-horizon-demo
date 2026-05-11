import type { ExplorationLoopState, PlayerSave } from '../domain/lh-contract';
import type { LhNpcRegistryEntry } from '../domain/lh-dialogue';
import type { ParsedLhMap, ParsedLhTrigger } from '../maps/parseLhTiledMap';

export const LH_NPC_ID_MASTER_SCRIBE = 'master_scribe';
export const LH_DEMO_LOST_ECHO_INTERACTABLE_OBJECT_ID = 9002;

export const MASTER_SCRIBE_NPC: LhNpcRegistryEntry = {
  npc_id: LH_NPC_ID_MASTER_SCRIBE,
  display_name: 'Master Scribe',
  role_label: 'Narrative Guide',
  default_dialogue_bank: 'master_scribe_demo',
  card_title: 'The Master Scribe',
  role: 'Narrative Guide',
  tone: 'wise, warm, mythic, concise',
  default_interaction_kind: 'npc_dialogue',
};

export const DEMO_GUIDANCE_STAGE_IDS = [
  'demo_awakened',
  'demo_seek_maia',
  'demo_returned_from_maia',
  'demo_combat_trial_available',
  'demo_combat_trial_complete',
  'demo_seek_aethelwood_guild',
  'demo_guild_research_complete',
  'demo_fog_revealed',
  'demo_slice_complete',
] as const;

export type DemoGuidanceStageId = (typeof DEMO_GUIDANCE_STAGE_IDS)[number];

export type DemoGuidanceStateV1 = {
  stage_id: DemoGuidanceStageId;
  current_objective: string;
  last_npc_interaction_id?: string;
  stamina_upgrade_applied?: boolean;
  max_stamina_ms?: number;
};

export const LH_DEMO_BASE_STAMINA_MS = 2400;
export const LH_DEMO_REWARDED_STAMINA_MS = 4200;

const STAGE_OBJECTIVES: Record<DemoGuidanceStageId, string> = {
  demo_awakened: 'Speak with the Master Scribe',
  demo_seek_maia: 'Enter the Mirror of Maia',
  demo_returned_from_maia: 'Return to the Master Scribe',
  demo_combat_trial_available: 'Defeat the Lost Echo',
  demo_combat_trial_complete: 'Continue to Aethelwood Farmsteads',
  demo_seek_aethelwood_guild: 'Travel to Aethelwood Farmsteads',
  demo_guild_research_complete: 'Witness the Fog of the Unknown clear',
  demo_fog_revealed: 'Return to the Master Scribe',
  demo_slice_complete: 'Save your journey',
};

const MASTER_SCRIBE_DIALOGUE: Record<DemoGuidanceStageId, { lineId: string; body: string }> = {
  demo_awakened: {
    lineId: 'demo_master_scribe_opening_welcome',
    body:
      'Ah, a Traveler wakes. Good. The map is dark, but not unkind. First, seek the Mirror of Maia; it will show the shape of your strengths.',
  },
  demo_seek_maia: {
    lineId: 'demo_master_scribe_seek_maia',
    body:
      'The Mirror of Maia waits north of this path, amber-bright in the grass. Step through, then return to me with what it has stirred.',
  },
  demo_returned_from_maia: {
    lineId: 'demo_master_scribe_after_maia',
    body:
      'There it is: the first true glimmer. Hold it close. A Lost Echo may bar the road to Aethelwood—an old knot of doubt and confusion. Face it. Win, and your resolve will deepen. Then continue onward to Aethelwood Farmsteads.',
  },
  demo_combat_trial_available: {
    lineId: 'demo_master_scribe_warn_lost_echo',
    body:
      'Steel yourself, Traveler. The Fogbound leave Echoes in the road—remnants of fear about what comes next. Face the Lost Echo. Each victory brings clarity, strength, and forward progress. When it yields, do not linger—continue to Aethelwood Farmsteads.',
  },
  demo_combat_trial_complete: {
    lineId: 'demo_master_scribe_stamina_reward',
    body:
      'Well struck. Your resolve is stronger now. Keep moving—Aethelwood Farmsteads awaits.',
  },
  demo_seek_aethelwood_guild: {
    lineId: 'demo_master_scribe_seek_aethelwood',
    body:
      'Aethelwood Farmsteads is the Agriculture Guild HQ: a wild green hall where Druids and Rangers care for land, food, and living things.',
  },
  demo_guild_research_complete: {
    lineId: 'demo_master_scribe_after_guild_research',
    body:
      'You opened a research hall, not a final trial. Good learning starts with evidence. Watch now as the unknown draws back.',
  },
  demo_fog_revealed: {
    lineId: 'demo_master_scribe_after_fog_reveal',
    body:
      'The fog remembers courage and evidence. Save your journey, Traveler; more waits beyond the horizon, and the next page is already listening.',
  },
  demo_slice_complete: {
    lineId: 'demo_master_scribe_slice_complete',
    body:
      'Your first page is sealed: Maia, trial, research, reveal, and save. Beyond this horizon, the guild roads multiply.',
  },
};

function isDemoGuidanceStageId(value: unknown): value is DemoGuidanceStageId {
  return typeof value === 'string' && (DEMO_GUIDANCE_STAGE_IDS as readonly string[]).includes(value);
}

export function createDemoGuidanceState(stage: DemoGuidanceStageId = 'demo_awakened'): DemoGuidanceStateV1 {
  return {
    stage_id: stage,
    current_objective: STAGE_OBJECTIVES[stage],
    max_stamina_ms: LH_DEMO_BASE_STAMINA_MS,
  };
}

export function coerceDemoGuidanceState(raw: unknown): DemoGuidanceStateV1 | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  const stage = isDemoGuidanceStageId(row.stage_id) ? row.stage_id : 'demo_awakened';
  const rewardShouldBeApplied =
    DEMO_GUIDANCE_STAGE_IDS.indexOf(stage) > DEMO_GUIDANCE_STAGE_IDS.indexOf('demo_combat_trial_complete');
  const staminaUpgradeApplied = row.stamina_upgrade_applied === true || rewardShouldBeApplied;
  return {
    stage_id: stage,
    current_objective:
      typeof row.current_objective === 'string' && row.current_objective.trim()
        ? row.current_objective.trim()
        : STAGE_OBJECTIVES[stage],
    last_npc_interaction_id:
      typeof row.last_npc_interaction_id === 'string' ? row.last_npc_interaction_id : undefined,
    stamina_upgrade_applied: staminaUpgradeApplied,
    max_stamina_ms: staminaUpgradeApplied
      ? LH_DEMO_REWARDED_STAMINA_MS
      : Number(row.max_stamina_ms) >= LH_DEMO_REWARDED_STAMINA_MS
        ? LH_DEMO_REWARDED_STAMINA_MS
        : LH_DEMO_BASE_STAMINA_MS,
  };
}

export function ensureDemoGuidanceState(exploration: ExplorationLoopState): DemoGuidanceStateV1 {
  return coerceDemoGuidanceState(exploration.demo_guidance_v1) ?? createDemoGuidanceState();
}

export function mergeDemoGuidanceState(
  exploration: ExplorationLoopState,
  patch: Partial<DemoGuidanceStateV1> & { stage_id?: DemoGuidanceStageId },
): ExplorationLoopState {
  const prev = ensureDemoGuidanceState(exploration);
  const stage = patch.stage_id ?? prev.stage_id;
  return {
    ...exploration,
    demo_guidance_v1: {
      ...prev,
      ...patch,
      stage_id: stage,
      current_objective: patch.current_objective ?? STAGE_OBJECTIVES[stage],
    },
  };
}

export function advanceDemoGuidanceStage(
  exploration: ExplorationLoopState,
  stage: DemoGuidanceStageId,
): ExplorationLoopState {
  const current = ensureDemoGuidanceState(exploration);
  const currentIndex = DEMO_GUIDANCE_STAGE_IDS.indexOf(current.stage_id);
  const nextIndex = DEMO_GUIDANCE_STAGE_IDS.indexOf(stage);
  if (nextIndex < currentIndex) return exploration;
  return mergeDemoGuidanceState(exploration, { stage_id: stage });
}

export function resolveMasterScribeDialogue(stage: DemoGuidanceStageId) {
  return MASTER_SCRIBE_DIALOGUE[stage];
}

export function resolveMasterScribeNextStage(stage: DemoGuidanceStageId): DemoGuidanceStageId | null {
  if (stage === 'demo_awakened') return 'demo_seek_maia';
  if (stage === 'demo_returned_from_maia') return 'demo_combat_trial_available';
  if (stage === 'demo_combat_trial_complete') return 'demo_seek_aethelwood_guild';
  if (stage === 'demo_guild_research_complete') return 'demo_fog_revealed';
  if (stage === 'demo_fog_revealed') return 'demo_slice_complete';
  return null;
}

export function applyDemoObjectiveToPlayer(player: PlayerSave, objective: string): PlayerSave {
  return {
    ...player,
    active_main_quest_title: 'Legendary Horizon Demo Slice',
    required_next_action: objective,
  };
}

export function applyDemoStaminaReward(exploration: ExplorationLoopState): ExplorationLoopState {
  return mergeDemoGuidanceState(exploration, {
    stamina_upgrade_applied: true,
    max_stamina_ms: LH_DEMO_REWARDED_STAMINA_MS,
  });
}

/** True for the vertical-slice Lost Echo encounter (Tiled name `lost_echo_demo` or synthetic twin). */
export function isLostEchoDemoTrigger(trigger: Pick<ParsedLhTrigger, 'kind' | 'tiled_name'>): boolean {
  return trigger.kind === 'combat_encounter' && trigger.tiled_name === 'lost_echo_demo';
}

/** After this stage, the Lost Echo encounter should stay cleared/hidden in-world. */
export function isLostEchoDemoSuppressedByStage(stage_id: DemoGuidanceStageId): boolean {
  const idx = DEMO_GUIDANCE_STAGE_IDS.indexOf(stage_id);
  const cut = DEMO_GUIDANCE_STAGE_IDS.indexOf('demo_combat_trial_available');
  return idx > cut;
}

export function buildDemoGuidanceMap(parsedMap: ParsedLhMap): ParsedLhMap {
  const hasMasterScribe = parsedMap.triggers.some(
    (trigger) => trigger.kind === 'npc_dialogue' && trigger.npc_id === LH_NPC_ID_MASTER_SCRIBE,
  );
  const hasLostEcho = parsedMap.triggers.some((trigger) => isLostEchoDemoTrigger(trigger));
  const maia = parsedMap.triggers.find((trigger) => trigger.kind === 'maia_portal');
  const baseX = maia ? maia.bounds.x + maia.bounds.width / 2 : parsedMap.footprint.width_px / 2;
  const baseY = maia ? maia.bounds.y + maia.bounds.height + 150 : parsedMap.footprint.height_px / 2;
  const synthetic: ParsedLhTrigger[] = [];

  if (!hasMasterScribe) {
    synthetic.push({
      tiled_object_id: 9001,
      tiled_name: 'demo_master_scribe_intro',
      layer_name: 'demo_synthetic_guidance',
      kind: 'npc_dialogue',
      activation_mode: 'interaction',
      npc_id: LH_NPC_ID_MASTER_SCRIBE,
      bounds: { x: baseX - 86, y: baseY - 38, width: 44, height: 58 },
      interaction_label_active: 'Speak',
      interaction_label_complete: 'Speak with the Master Scribe',
    });
  }

  if (!hasLostEcho) {
    synthetic.push({
      tiled_object_id: LH_DEMO_LOST_ECHO_INTERACTABLE_OBJECT_ID,
      tiled_name: 'lost_echo_demo',
      layer_name: 'demo_synthetic_guidance',
      kind: 'combat_encounter',
      activation_mode: 'overlap_auto',
      bounds: { x: baseX - 352, y: baseY - 218, width: 58, height: 58 },
      interaction_label_active: 'Face the Lost Echo',
      interaction_label_complete: 'Lost Echo defeated',
    });
  }

  if (!synthetic.length) return parsedMap;
  return {
    ...parsedMap,
    triggers: [...parsedMap.triggers, ...synthetic],
  };
}
