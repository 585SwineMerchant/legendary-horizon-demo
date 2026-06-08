/**
 * Item Catalog — all items in the Legendary Horizon item system.
 *
 * Three categories:
 *  1. Satchel consumables  — limited-use items carried into exploration
 *  2. Field Kit tools      — permanent equipment that passively upgrades gameplay
 *  3. Cosmetics / titles   — streak milestone rewards
 *
 * Item IDs correspond to reference doc: Legendary_Horizon_Item_Inventory_Deployment_Plan.xlsx
 *
 * Field Kit canonical IDs use FK-* prefix (e.g. FK-COM-001).
 * Legacy KIT-* IDs from early builds are migrated transparently via normalizeLegacyFieldKitIds().
 */

import type {
  SatchelConsumableV1,
  FieldKitToolV1,
  CosmeticsV1,
  SatchelInventoryV1,
  MementoEntryV1,
} from '../domain/lh-contract';

// ─── Satchel Consumable Definitions ────────────────────────────────────────

export type ConsumableItemDef = {
  item_id: string;
  label: string;
  description: string;
  icon_emoji: string;
  /** Optional pixel-art icon path (relative to /public). Falls back to icon_emoji. */
  iconAssetPath?: string;
  max_qty: number;
  /** What happens when this item is used. */
  effect_description: string;
};

export const SATCHEL_CONSUMABLE_DEFS: readonly ConsumableItemDef[] = [
  {
    item_id: 'SAT-REM-001',
    label: 'Remedy Herb',
    description: 'A bundle of restorative herbs gathered from the Brambleholt Sanctuary.',
    icon_emoji: '🌿',
    iconAssetPath: 'assets/maps/items-flowers3_0.png',
    max_qty: 3,
    effect_description: 'Restores 8 Resolve.',
  },
  {
    item_id: 'SAT-REM-002',
    label: 'Greater Remedy',
    description: 'A potent elixir distilled from the rarest herbs in Brambleholt.',
    icon_emoji: '🧪',
    iconAssetPath: 'assets/maps/vendor - potion 2.png',
    max_qty: 1,
    effect_description: 'Restores 15 Resolve.',
  },
  {
    item_id: 'SAT-FOC-001',
    label: 'Focus Tea',
    description: 'A concentrated brew that sharpens the mind before a challenge.',
    icon_emoji: '🍵',
    max_qty: 2,
    effect_description: 'One hint in the next knowledge encounter.',
  },
  {
    item_id: 'SAT-WPN-001',
    label: 'Sharpening Stone',
    description: 'A flat stone imbued with the forge-craft of Ironveil.',
    icon_emoji: '⚒',
    iconAssetPath: 'assets/maps/items-stone_0.png',
    max_qty: 2,
    effect_description: 'Next weapon attacks deal 50% bonus damage for 3 minutes.',
  },
  {
    item_id: 'SAT-MAG-001',
    label: 'Rune Oil',
    description: 'A small vial of enchanted oil that amplifies the power of arcane knowledge.',
    icon_emoji: '⚗️',
    max_qty: 2,
    effect_description: 'Next magic attacks deal 50% bonus damage for 3 minutes.',
  },
] as const;

// ─── Field Kit Tool Definitions ─────────────────────────────────────────────

export type FieldKitItemDef = {
  item_id: string;
  label: string;
  description: string;
  icon_emoji: string;
  /** Optional pixel-art icon path (relative to /public). Falls back to icon_emoji. */
  iconAssetPath?: string;
  /** Passive effect description shown in Field Kit panel. */
  effect_description: string;
};

export const FIELD_KIT_DEFS: readonly FieldKitItemDef[] = [
  {
    item_id: 'FK-COM-001',
    label: 'Compass',
    description: 'A brass compass inscribed with the sixteen guild symbols.',
    icon_emoji: '🧭',
    effect_description: 'Shows the direction of the nearest active waypoint on the HUD.',
  },
  {
    item_id: 'FK-LAN-001',
    label: 'Lantern',
    description: 'A lantern crafted from Cindermaw glass that burns without fuel.',
    icon_emoji: '🏮',
    effect_description: 'Expands your fog-clearing radius by 20% on the World Atlas.',
  },
  {
    item_id: 'FK-MAR-001',
    label: 'Trail Markers',
    description: 'A set of carved stone markers that remember where you have been.',
    icon_emoji: '📍',
    iconAssetPath: 'assets/maps/sign 1.png',
    effect_description: 'Saves your last 3 visited waypoints in the Quest Log.',
  },
  {
    item_id: 'FK-CAM-001',
    label: 'Campfire Kit',
    description: 'A portable kit that lets you make camp anywhere in the realms.',
    icon_emoji: '🔥',
    iconAssetPath: 'assets/maps/campfire 1.png',
    effect_description: 'Allows campfire save from the pause menu without finding a campfire node.',
  },
  {
    item_id: 'FK-JOU-001',
    label: 'Field Journal',
    description: 'A worn leather journal that unlocks the full Field Journal panel.',
    icon_emoji: '📖',
    iconAssetPath: 'assets/maps/items-books_3.png',
    effect_description: 'Unlocks all 6 tabs in the Field Journal (pause menu).',
  },
] as const;

// ─── Memento Item Definitions ────────────────────────────────────────────────

/**
 * Catalog metadata for collectible memento items awarded as loot.
 * These are unique story/world collectibles — not consumables — and are stored
 * in `SatchelInventoryV1.mementos` as `MementoEntryV1` entries.
 */
export type MementoItemDef = {
  item_id: string;
  label: string;
  description: string;
  icon_emoji: string;
};

/** Act I story loot mementos — awarded on first completion of their respective quests. */
export const ACT1_LOOT_MEMENTO_DEFS: readonly MementoItemDef[] = [
  {
    item_id: 'SAT-LOR-001',
    label: 'Torn Journal Page',
    description: 'A fragment of a forgotten Traveler\'s notes, recovered from a scattered Lost Echo.',
    icon_emoji: '📄',
  },
  {
    item_id: 'SAT-LOR-002',
    label: 'Echo Crystal',
    description: 'A crystallized memory left behind by a Knowledge Echo. It hums faintly with remembered answers.',
    icon_emoji: '💎',
  },
] as const;

// ─── Legacy ID migration map ─────────────────────────────────────────────────

/**
 * Maps early-build KIT-* IDs to the canonical FK-* IDs used from v1.1 onward.
 * Used by normalizeLegacyFieldKitIds() to patch saved player data on load.
 */
const FIELD_KIT_LEGACY_ID_MAP: Record<string, string> = {
  'KIT-COMPASS-001': 'FK-COM-001',
  'KIT-LANTERN-001': 'FK-LAN-001',
  'KIT-TRAIL-001':   'FK-MAR-001',
  'KIT-CAMP-001':    'FK-CAM-001',
  'KIT-JOURNAL-001': 'FK-JOU-001',
};

/**
 * Rewrites any legacy KIT-* IDs in a saved field_kit array to their canonical FK-* equivalents.
 * Safe to call on every load — items with current IDs pass through unchanged.
 */
export function normalizeLegacyFieldKitIds(field_kit: FieldKitToolV1[]): FieldKitToolV1[] {
  return field_kit.map((t) => {
    const canonical = FIELD_KIT_LEGACY_ID_MAP[t.item_id];
    return canonical ? { ...t, item_id: canonical } : t;
  });
}

// ─── Streak Milestone Cosmetics ─────────────────────────────────────────────

export type StreakMilestone = {
  streak: number;
  reward_kind: 'title' | 'badge' | 'visual';
  reward_id: string;
  reward_label: string;
  /** In-world description of what the reward represents. */
  description: string;
};

export const CAMPFIRE_STREAK_MILESTONES: readonly StreakMilestone[] = [
  {
    streak: 3,
    reward_kind: 'visual',
    reward_id: 'VISUAL_AMBER_FLAME',
    reward_label: 'Ember Keeper',
    description: 'Your campfire now burns with a warm amber tint — a mark of consistent reflection.',
  },
  {
    streak: 5,
    reward_kind: 'title',
    reward_id: 'TITLE_THOUGHTFUL_TRAVELER',
    reward_label: 'Thoughtful Traveler',
    description: 'Awarded to Travelers who have reflected at the campfire five sessions in a row.',
  },
  {
    streak: 10,
    reward_kind: 'title',
    reward_id: 'TITLE_CHRONICLER_OF_THE_FLAME',
    reward_label: 'Chronicler of the Flame',
    description: 'The rarest campfire honor — ten consecutive sessions of honest reflection.',
  },
] as const;

// ─── Default Inventory Builders ─────────────────────────────────────────────

/** Returns the default empty Satchel consumable list. */
export function defaultSatchelConsumables(): SatchelConsumableV1[] {
  return SATCHEL_CONSUMABLE_DEFS.map((def) => ({
    item_id: def.item_id,
    label: def.label,
    qty: 0,
    max_qty: def.max_qty,
  }));
}

/** Returns the default empty Field Kit (all tools unowned). */
export function defaultFieldKit(): FieldKitToolV1[] {
  return FIELD_KIT_DEFS.map((def) => ({
    item_id: def.item_id,
    label: def.label,
    owned: false,
  }));
}

/** Returns the default empty cosmetics state. */
export function defaultCosmetics(): CosmeticsV1 {
  return {
    unlocked_titles: [],
    active_title: null,
    unlocked_badges: [],
  };
}

/** Returns a fully empty default `SatchelInventoryV1`. */
export function defaultSatchelInventory(): SatchelInventoryV1 {
  return {
    consumables: defaultSatchelConsumables(),
    field_kit: defaultFieldKit(),
    mementos: [],
    cosmetics: defaultCosmetics(),
  };
}

/** Parses `player.satchel_inventory_json` — returns default on invalid or missing JSON. */
export function parseSatchelInventory(json: string | undefined): SatchelInventoryV1 {
  if (!json) return defaultSatchelInventory();
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultSatchelInventory();
    const parsed = raw as Partial<SatchelInventoryV1>;
    return {
      consumables: Array.isArray(parsed.consumables) ? parsed.consumables : defaultSatchelConsumables(),
      // normalizeLegacyFieldKitIds patches KIT-* IDs from pre-v1.1 saves to FK-* canonical IDs.
      field_kit: Array.isArray(parsed.field_kit)
        ? normalizeLegacyFieldKitIds(parsed.field_kit)
        : defaultFieldKit(),
      mementos: Array.isArray(parsed.mementos) ? parsed.mementos : [],
      cosmetics:
        parsed.cosmetics && typeof parsed.cosmetics === 'object'
          ? {
              unlocked_titles: Array.isArray(parsed.cosmetics.unlocked_titles) ? parsed.cosmetics.unlocked_titles : [],
              active_title: typeof parsed.cosmetics.active_title === 'string' ? parsed.cosmetics.active_title : null,
              unlocked_badges: Array.isArray(parsed.cosmetics.unlocked_badges) ? parsed.cosmetics.unlocked_badges : [],
            }
          : defaultCosmetics(),
    };
  } catch {
    return defaultSatchelInventory();
  }
}

// ─── Consumable Use ──────────────────────────────────────────────────────────

/**
 * Decrements a consumable's qty by 1. Returns the updated consumable list, or
 * the original list unchanged if the item has qty 0 or is not found.
 */
export function useConsumable(
  consumables: SatchelConsumableV1[],
  itemId: string,
): SatchelConsumableV1[] {
  return consumables.map((c) => {
    if (c.item_id !== itemId) return c;
    if (c.qty <= 0) return c;
    return { ...c, qty: c.qty - 1 };
  });
}

/** Grants qty of a consumable item, capped at max_qty. */
export function grantConsumable(
  consumables: SatchelConsumableV1[],
  itemId: string,
  qty: number,
): SatchelConsumableV1[] {
  const def = SATCHEL_CONSUMABLE_DEFS.find((d) => d.item_id === itemId);
  if (!def) return consumables;
  const existing = consumables.find((c) => c.item_id === itemId);
  if (existing) {
    return consumables.map((c) =>
      c.item_id === itemId
        ? { ...c, qty: Math.min(c.max_qty, c.qty + qty) }
        : c,
    );
  }
  return [
    ...consumables,
    { item_id: itemId, label: def.label, qty: Math.min(def.max_qty, qty), max_qty: def.max_qty },
  ];
}

/** Grants a Field Kit tool (sets owned: true). */
export function grantFieldKitTool(field_kit: FieldKitToolV1[], itemId: string): FieldKitToolV1[] {
  return field_kit.map((t) => (t.item_id === itemId ? { ...t, owned: true } : t));
}

/**
 * Appends a memento to the mementos array. No-ops if `item_id` already present —
 * mementos are unique collectibles, not stackable. Records `acquired_at_iso` as the
 * current UTC timestamp. Looks up metadata from `ACT1_LOOT_MEMENTO_DEFS`; returns
 * the original array unchanged if the item is not in the catalog.
 */
export function grantMemento(mementos: MementoEntryV1[], itemId: string): MementoEntryV1[] {
  if (mementos.some((m) => m.item_id === itemId)) return mementos;
  const def = ACT1_LOOT_MEMENTO_DEFS.find((d) => d.item_id === itemId);
  if (!def) return mementos;
  return [
    ...mementos,
    {
      item_id: def.item_id,
      label: def.label,
      description: def.description,
      icon_emoji: def.icon_emoji,
      acquired_at_iso: new Date().toISOString(),
    },
  ];
}

// ─── Streak Milestone Processing ─────────────────────────────────────────────

/**
 * Applies any newly earned streak milestone rewards to the cosmetics state.
 * Safe to call every session — milestones already in `unlocked_titles` are skipped.
 */
export function applyStreakMilestones(
  streak: number,
  cosmetics: CosmeticsV1,
): { cosmetics: CosmeticsV1; newRewards: StreakMilestone[] } {
  const newRewards: StreakMilestone[] = [];
  let updated = { ...cosmetics };

  for (const milestone of CAMPFIRE_STREAK_MILESTONES) {
    if (streak < milestone.streak) continue;
    if (milestone.reward_kind === 'title') {
      if (!updated.unlocked_titles.includes(milestone.reward_id)) {
        updated = {
          ...updated,
          unlocked_titles: [...updated.unlocked_titles, milestone.reward_id],
        };
        newRewards.push(milestone);
      }
    } else if (milestone.reward_kind === 'badge') {
      if (!updated.unlocked_badges.includes(milestone.reward_id)) {
        updated = {
          ...updated,
          unlocked_badges: [...updated.unlocked_badges, milestone.reward_id],
        };
        newRewards.push(milestone);
      }
    } else if (milestone.reward_kind === 'visual') {
      // Visual rewards (amber flame) are recorded as badges for persistence.
      if (!updated.unlocked_badges.includes(milestone.reward_id)) {
        updated = {
          ...updated,
          unlocked_badges: [...updated.unlocked_badges, milestone.reward_id],
        };
        newRewards.push(milestone);
      }
    }
  }

  return { cosmetics: updated, newRewards };
}

/** True when player has the Amber Flame visual unlocked (streak ≥ 3). */
export function hasAmberFlameVisual(cosmetics: CosmeticsV1): boolean {
  return cosmetics.unlocked_badges.includes('VISUAL_AMBER_FLAME');
}

/** Returns the human-readable label for a title reward_id. */
export function getTitleLabel(rewardId: string): string {
  return CAMPFIRE_STREAK_MILESTONES.find((m) => m.reward_id === rewardId)?.reward_label ?? rewardId;
}
