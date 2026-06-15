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

/** Tiled trigger name for the mq-105 Knowledge Echo encounter. */
export const MQ105_KNOWLEDGE_ECHO_TRIGGER_NAME = 'knowledge_combat_mq105';
/** Tiled trigger name for the Oracle NPC dialogue (Act II opening). */
export const ORACLE_NPC_TRIGGER_NAME = 'oracle_veiled_shrine';

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

/** True for any knowledge-combat trigger (`knowledge_combat_*` naming convention). */
export function isKnowledgeCombatTrigger(trigger: Pick<ParsedLhTrigger, 'kind' | 'tiled_name'>): boolean {
  return trigger.kind === 'combat_encounter' && Boolean(trigger.tiled_name?.startsWith('knowledge_combat_'));
}

/** True for the first (gate-keeping) knowledge combat encounter — `knowledge_combat_first`. */
export function isFirstKnowledgeCombatTrigger(trigger: Pick<ParsedLhTrigger, 'kind' | 'tiled_name'>): boolean {
  return trigger.kind === 'combat_encounter' && trigger.tiled_name === 'knowledge_combat_first';
}

/** @deprecated Use {@link isFirstKnowledgeCombatTrigger}. */
export const isLostEchoDemoTrigger = isFirstKnowledgeCombatTrigger;

/** Physical guild HQ research portal (first atlas discovery). */
export function canDiscoverGuildHqResearch(stage_id: DemoGuidanceStageId): boolean {
  const idx = DEMO_GUIDANCE_STAGE_IDS.indexOf(stage_id);
  const min = DEMO_GUIDANCE_STAGE_IDS.indexOf('demo_seek_aethelwood_guild');
  const done = DEMO_GUIDANCE_STAGE_IDS.indexOf('demo_guild_research_complete');
  return idx >= min && idx < done;
}

/** After fog clear, only the chosen guild HQ may reopen in-world. */
export function canReenterChosenGuildHq(stage_id: DemoGuidanceStageId): boolean {
  const idx = DEMO_GUIDANCE_STAGE_IDS.indexOf(stage_id);
  return idx >= DEMO_GUIDANCE_STAGE_IDS.indexOf('demo_guild_research_complete');
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
  // Detect oracle triggers separately:
  //   hasOracleNpcDialogue — a proper npc_dialogue trigger with oracle_veiled; Phaser renders a
  //                          visual NPC sprite at its position. No synthetic needed.
  //   oracle_encounter zone — a large activation zone; when a real altar NPC exists, this zone
  //                           creates a duplicate interaction point. Filter it from the map.
  const hasOracleNpcDialogue = parsedMap.triggers.some(
    (trigger) => trigger.kind === 'npc_dialogue' && trigger.npc_id === 'oracle_veiled',
  );
  const hasKnowledgeEchoMq105 = parsedMap.triggers.some(
    (trigger) => trigger.kind === 'combat_encounter' && trigger.tiled_name === MQ105_KNOWLEDGE_ECHO_TRIGGER_NAME,
  );

  // When a real Oracle altar NPC sprite exists, remove oracle_encounter zones (they become
  // duplicate interaction points). Also deduplicate oracle NPC triggers: if the Tiled map
  // accidentally has two npc_dialogue/oracle_veiled objects, keep only the southernmost one
  // (highest Y value in screen coordinates) — the real shrine is always south of the midpoint.
  const oracleNpcTriggers = parsedMap.triggers.filter(
    (t) => t.kind === 'npc_dialogue' && t.npc_id === 'oracle_veiled',
  );
  const canonicalOracleId: number | null =
    oracleNpcTriggers.length > 1
      ? oracleNpcTriggers.reduce((best, t) =>
          t.bounds.y + t.bounds.height / 2 > best.bounds.y + best.bounds.height / 2 ? t : best,
        ).tiled_object_id
      : null;

  const effectiveTriggers = hasOracleNpcDialogue
    ? parsedMap.triggers.filter((t) => {
        if (t.kind === 'oracle_encounter') return false;
        if (canonicalOracleId !== null && t.kind === 'npc_dialogue' && t.npc_id === 'oracle_veiled') {
          return t.tiled_object_id === canonicalOracleId;
        }
        return true;
      })
    : parsedMap.triggers;

  if (hasOracleNpcDialogue && effectiveTriggers.length < parsedMap.triggers.length) {
    if (import.meta.env.DEV) {
      console.log('[LH_ORACLE] oracle_encounter zone removed — manual altar NPC handles activation');
    }
  }

  // Work from the filtered trigger list for all remaining decisions.
  const effectiveMap: ParsedLhMap = hasOracleNpcDialogue
    ? { ...parsedMap, triggers: effectiveTriggers }
    : parsedMap;

  const maia = effectiveMap.triggers.find((trigger) => trigger.kind === 'maia_portal');
  const baseX = maia ? maia.bounds.x + maia.bounds.width / 2 : effectiveMap.footprint.width_px / 2;
  const baseY = maia ? maia.bounds.y + maia.bounds.height + 150 : effectiveMap.footprint.height_px / 2;
  const synthetic: ParsedLhTrigger[] = [];

  if (!hasMasterScribe) {
    if (import.meta.env.DEV) {
      console.warn(
        '[DEV] buildDemoGuidanceMap: no master_scribe npc_dialogue trigger in map — injecting synthetic fallback.',
      );
    }
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
    if (import.meta.env.DEV) {
      console.warn(
        '[DEV] buildDemoGuidanceMap: no knowledge_combat_first trigger in map — injecting synthetic fallback.',
      );
    }
    synthetic.push({
      tiled_object_id: LH_DEMO_LOST_ECHO_INTERACTABLE_OBJECT_ID,
      tiled_name: 'knowledge_combat_first',
      layer_name: 'demo_synthetic_guidance',
      kind: 'combat_encounter',
      activation_mode: 'overlap_auto',
      bounds: { x: baseX - 900, y: baseY - 150, width: 128, height: 128 },
      interaction_label_active: 'Face the Lost Echo',
      interaction_label_complete: 'Lost Echo defeated',
    });
  }

  if (!hasKnowledgeEchoMq105) {
    // mq-105 Knowledge Echo — player must interact (not overlap_auto) to start knowledge combat.
    synthetic.push({
      tiled_object_id: 9005,
      tiled_name: MQ105_KNOWLEDGE_ECHO_TRIGGER_NAME,
      layer_name: 'demo_synthetic_guidance',
      kind: 'combat_encounter',
      activation_mode: 'interaction',
      target_quest_id: 'mq-105',
      bounds: { x: baseX + 60, y: baseY - 200, width: 72, height: 72 },
      interaction_label_active: 'Face the Knowledge Echo',
      interaction_label_complete: 'Knowledge Echo defeated',
    });
  }

  // oracle_encounter in the Tiled map routes to oracle_veiled dialogue via triggerDispatcher,
  // so the synthetic npc_dialogue+oracle_veiled is redundant (and causes a second statue).
  // Only inject the synthetic oracle when neither source exists.
  const hasOracleEncounterTiled = parsedMap.triggers.some((t) => t.kind === 'oracle_encounter');

  if (!hasOracleNpcDialogue && !hasOracleEncounterTiled) {
    // Inject a visual oracle NPC sprite so the player can see and approach the Oracle.
    // Priority:
    //   1. VITE_LH_ORACLE_X / VITE_LH_ORACLE_Y env-var override (for precise tuning)
    //   2. Centre of the existing oracle_encounter zone in the Tiled map (most accurate)
    //   3. Footprint-relative fallback (70% × 28%) when no zone exists
    // NOTE: when hasOracleNpcDialogue=true this block is skipped and oracle_encounter zones
    // have already been filtered out above, so this lookup correctly returns undefined.
    const oracleEncounterZone = effectiveMap.triggers.find((t) => t.kind === 'oracle_encounter');
    const rawOX = (import.meta.env.VITE_LH_ORACLE_X as string | undefined)?.trim();
    const rawOY = (import.meta.env.VITE_LH_ORACLE_Y as string | undefined)?.trim();
    const oracleX = rawOX && !Number.isNaN(Number(rawOX))
      ? Number(rawOX)
      : oracleEncounterZone
        // Offset slightly left of centre so the NPC sits in the front-centre of the shrine zone
        ? Math.round(oracleEncounterZone.bounds.x + oracleEncounterZone.bounds.width * 0.45 - 28)
        : Math.round(parsedMap.footprint.width_px * 0.70);
    const oracleY = rawOY && !Number.isNaN(Number(rawOY))
      ? Number(rawOY)
      : oracleEncounterZone
        // Place in the lower-third of the zone (player approaches from below on most maps)
        ? Math.round(oracleEncounterZone.bounds.y + oracleEncounterZone.bounds.height * 0.60 - 40)
        : Math.round(effectiveMap.footprint.height_px * 0.28);
    if (import.meta.env.DEV) {
      console.log('[LH_ORACLE] synthetic oracle NPC sprite placed', {
        source: rawOX
          ? 'env-var (VITE_LH_ORACLE_X/Y)'
          : oracleEncounterZone
            ? `oracle_encounter zone centre (tiled id ${oracleEncounterZone.tiled_object_id})`
            : 'footprint-relative (0.70w, 0.28h)',
        x: oracleX,
        y: oracleY,
        tip: 'Set VITE_LH_ORACLE_X / VITE_LH_ORACLE_Y in .env.local to pin exact shrine coords.',
      });
    }
    synthetic.push({
      tiled_object_id: 9006,
      tiled_name: ORACLE_NPC_TRIGGER_NAME,
      layer_name: 'demo_synthetic_guidance',
      kind: 'npc_dialogue',
      activation_mode: 'interaction',
      npc_id: 'oracle_veiled',
      bounds: { x: oracleX, y: oracleY, width: 56, height: 80 },
      interaction_label_active: 'Press Enter to speak with the Oracle',
      interaction_label_complete: 'The Oracle has spoken',
    });
  }

  if (!synthetic.length) return effectiveMap;
  return {
    ...effectiveMap,
    triggers: [...effectiveMap.triggers, ...synthetic],
  };
}
