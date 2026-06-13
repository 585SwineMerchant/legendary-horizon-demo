import { useEffect, useRef } from 'react';

import Phaser from 'phaser';

import type { ExplorationHotspot } from '../screens/ExplorationScreen';
import type { ParsedLhMap, ParsedLhRoamingLostEchoSpawn } from '../maps/parseLhTiledMap';
import { PRIMARY_WORLD_TRIGGER_REALM_ID } from '../runtime/primaryWorldMap';
import {
  LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT,
  LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT,
  type LhPhaserGuildResearchBridgeDetail,
} from '../lib/lhPhaserGuildResearchBridge';
import { playLhLostEchoSwingSfx, playLhSfx, playLhTravelerSwingSfx } from '../lib/lhSfx';
import { publicAssetUrl } from '../lib/publicAssetUrl';
import {
  LH_WINDOW_KNOWLEDGE_BATTLE_PRESENTATION,
  LH_WINDOW_KNOWLEDGE_COMBAT_VISUAL,
  type LhKnowledgeBattlePresentationDetail,
  type LhKnowledgeCombatVisualDetail,
} from '../lib/lhKnowledgeCombatBridge';
import {
  subscribeToPhaserVfx,
  VFX_COLOR_HIT_SPARK,
  VFX_COLOR_RUNE_BURST,
  VFX_COLOR_DUST_PUFF,
  VFX_COLOR_GRASS_RUSTLE,
} from '../lib/lhVfxManager';
// hasAmberFlameVisual is computed in ExplorationScreen and passed as the `hasAmberFlame` prop.

/** Scratch corners for mapping camera viewport → world-space rects (JRPG battle layer). */
const jrpgViewportCornerScratch = [
  new Phaser.Math.Vector2(),
  new Phaser.Math.Vector2(),
  new Phaser.Math.Vector2(),
  new Phaser.Math.Vector2(),
];

const JRPG_BATTLE_DEPTH_BACKDROP = 28000;
const JRPG_BATTLE_DEPTH_FOG = 28001;
const JRPG_BATTLE_DEPTH_DBG_TRAVELER = 28002;
const JRPG_BATTLE_DEPTH_TRAVELER = 28003;
const JRPG_BATTLE_DEPTH_DBG_ENEMY = 28004;
const JRPG_BATTLE_DEPTH_ENEMY = 28005;
const JRPG_BATTLE_DEPTH_RIPPLE = 28006;

/** Full-screen JRPG battle backdrop (`public/assets/Battle_screen_aethelwood.png`). */
const JRPG_BATTLE_BG_KEY = 'lh_battle_bg_aethelwood';
const JRPG_BATTLE_BG_PATH = 'assets/Battle_screen_aethelwood.png';

function jrpgBattleBackdropDevLog(phase: string, detail: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.info(`[LhJrpgBattle:bg] ${phase}`, detail);
}

/**
 * DEV layout guides (green/purple frames). Off by default so sprites stay the focus.
 * Set `VITE_LH_JRPG_BATTLE_DEBUG_MARKERS=true` for subtle footprint guides.
 */
const SHOW_JRPG_BATTLE_DEBUG_MARKERS = import.meta.env.VITE_LH_JRPG_BATTLE_DEBUG_MARKERS === 'true';

/** Shared ground line for JRPG actors (viewport fraction). Enemy matched to traveler so feet read on the same plane. */
const JRPG_BATTLE_ACTOR_GROUND_Y = 0.6;

/** Camera viewport fractions (0–1) for JRPG actors — aligned with `.lh-jrpg-battle-hud` grid + lower panel. */
const JRPG_BATTLE_VP = {
  traveler: { x: 0.2, y: JRPG_BATTLE_ACTOR_GROUND_Y },
  enemy: { x: 0.73, y: JRPG_BATTLE_ACTOR_GROUND_Y },
  /** Run-in starts just inside the right edge so world projection stays valid. */
  enemyRunFrom: { x: 0.93, y: JRPG_BATTLE_ACTOR_GROUND_Y },
  fog: { x: 0.5, y: 0.36 },
  ripple: { x: 0.5, y: 0.5 },
} as const;

type Props = {
  realmId: string;
  parsedMap: ParsedLhMap;
  /** True once the first knowledge-combat trigger has been beaten; gates Lost Echo re-activation. */
  kcBeaten?: boolean;
  dialogueNpcId?: string;
  hotspots: ExplorationHotspot[];
  onActivateHotspot: (interactableId: string) => void;
  onPause: () => void;
  /** Override the tilemap JSON URL Phaser loads. When omitted the default current-map URL is used. */
  tileMapUrl?: string;
  /** DEV — mirrors React `visitedInteractableIds` for Lost Echo diagnostic logs only. */
  lostEchoDiagVisitedTriggerIds?: readonly string[];
  /**
   * True when the Traveler's Resolve is below the Shaken threshold (< 25%).
   * Applies a −10% sprint speed penalty while active.
   */
  resolveShaken?: boolean;
  /**
   * Rested Readiness tier multiplier (1.0–1.40) derived from last_campfire_score.
   * Applied to sprint stamina capacity and recovery amount each session.
   * Defaults to 1.0 (score 0 / Restless — no change).
   */
  restedReadinessMultiplier?: number;
  /**
   * True when the player has the Amber Flame visual unlocked (campfire streak ≥ 3).
   * When set, campfire node fire sprites are tinted with a warm amber hue (0xE8A020).
   */
  hasAmberFlame?: boolean;
  /**
   * When true, suppress all Phaser keyboard input — overlay screens (module documents,
   * scroll reveal, oracle cinematic, oracle prophecy) are covering the canvas.
   * This prevents game keys from firing while students type in documents.
   */
  overlayBlocksInput?: boolean;
};

type TriggerRect = {
  interactable_id: string;
  kind: string;
  tiled_name?: string;
  layer_name?: string;
  activation_mode?: 'interaction' | 'overlap_auto' | 'overlap_auto_bottom';
  interaction_label_active: string;
  npc_id?: string;
  rotation_deg?: number;
  target_realm_id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type TiledObjectLayerRuntime = {
  name?: string;
  objects?: Array<{
    id?: number;
    gid?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    visible?: boolean;
    name?: string;
    type?: string;
    properties?: TiledPropertyRuntime[];
  }>;
};

type TiledPropertyRuntime = {
  name?: string;
  value?: unknown;
};

type ReactiveGrassDecor = {
  sprite: Phaser.GameObjects.Image;
  homeX: number;
  homeY: number;
  homeScaleX: number;
  homeScaleY: number;
  lastRustleAt: number;
};

/**
 * Depth for tile layers tagged with lh_above_player=true in Tiled.
 * Must exceed the maximum player y in world-pixel space (map is 400×300 tiles × 16px = 6400×4800px).
 * Used to ensure foreground structures (windmill upper, building rooftops) render above all y-sorted sprites.
 */
const ABOVE_PLAYER_LAYER_DEPTH = 50000;

/** Baked windmill on the Aethelwood map (`Windmill_baked_anim` tileset). */
const WINDMILL_BAKED_TILESET_NAME = 'Windmill_baked_anim';
const WINDMILL_FRAME_WIDTH_TILES = 8;
/** Each windmill pose is 11 tiles tall — matches the base Windmill.png (256×352px = 8×11 tiles). */
const WINDMILL_FRAME_HEIGHT_TILES = 11;
const WINDMILL_FRAME_MS = 140;

type WindmillSheetLayout = 'horizontal' | 'vertical';

type WindmillAnimSpec = {
  tilesetName: string;
  firstGid: number;
  sheetCols: number;
  sheetRows: number;
  imageWidthTiles: number;
  imageHeightTiles: number;
  frameWidthTiles: number;
  frameHeightTiles: number;
  layout: WindmillSheetLayout;
  /** Tiles between consecutive frame origins in the tileset (local index). */
  frameStride: number;
  frameCount: number;
};

type WindmillTileCoord = { colInFrame: number; rowInFrame: number };

type WindmillAnimTile = {
  layer: Phaser.Tilemaps.TilemapLayer;
  x: number;
  y: number;
  colInFrame: number;
  rowInFrame: number;
};

/**
 * One tile sprite from the `structures` object layer that uses `Windmill_baked_anim`.
 * Animated by updating its texture frame each timer tick (vs. `putTileAt` for tile layers).
 */
type WindmillDecorSprite = {
  spec: WindmillAnimSpec;
  sprite: Phaser.GameObjects.Image;
  colInFrame: number;
  rowInFrame: number;
  tileW: number;
  tileH: number;
};

type WindmillAnimGroup = {
  spec: WindmillAnimSpec;
  animFrame: number;
  tiles: WindmillAnimTile[];
};

function inferWindmillAnimSpec(baked: Phaser.Tilemaps.Tileset): WindmillAnimSpec {
  const sheetCols = Math.max(1, baked.columns);
  const total = baked.total;
  const sheetRows = Math.ceil(total / sheetCols);
  const imageWidthTiles = sheetCols;
  const imageHeightTiles = sheetRows;
  const frameWidthTiles = WINDMILL_FRAME_WIDTH_TILES;
  const frameHeightTiles = WINDMILL_FRAME_HEIGHT_TILES;

  const strideVertical = frameHeightTiles * sheetCols;
  const strideHorizontal = frameWidthTiles;
  const framesVertical = Math.floor(total / strideVertical);
  const framesPerRow = Math.floor(sheetCols / frameWidthTiles);
  const rowBands = Math.floor(sheetRows / frameHeightTiles);
  const framesHorizontal = framesPerRow * rowBands;

  // 1024×1408 px @ 32px → 32×44 tiles; 4 frames/row × 8 tiles wide, 4 row-bands of 11 rows = 16 frames total.
  const layout: WindmillSheetLayout =
    total % strideVertical === 0 && framesVertical >= framesHorizontal ? 'vertical' : 'horizontal';
  const frameStride = layout === 'vertical' ? strideVertical : strideHorizontal;
  const frameCount = layout === 'vertical' ? framesVertical : Math.max(1, framesHorizontal);

  return {
    tilesetName: baked.name,
    firstGid: baked.firstgid,
    sheetCols,
    sheetRows,
    imageWidthTiles,
    imageHeightTiles,
    frameWidthTiles,
    frameHeightTiles,
    layout,
    frameStride,
    frameCount,
  };
}

function parseWindmillLocalIndex(spec: WindmillAnimSpec, local: number): WindmillTileCoord & { animFrame: number } | null {
  const { sheetCols, sheetRows, frameWidthTiles, frameHeightTiles, layout, frameStride } = spec;
  if (local < 0 || local >= sheetCols * sheetRows) return null;

  if (layout === 'vertical') {
    const colInFrame = local % sheetCols;
    const rowInFrame = Math.floor((local % frameStride) / sheetCols);
    const animFrame = Math.floor(local / frameStride);
    if (colInFrame >= frameWidthTiles || rowInFrame >= frameHeightTiles || animFrame >= spec.frameCount) return null;
    return { animFrame, colInFrame, rowInFrame };
  }

  // Horizontal layout: frames are arranged in row-bands.
  // Each row-band is frameHeightTiles tall and contains (sheetCols / frameWidthTiles) frames side-by-side.
  const framesPerRow = Math.floor(sheetCols / frameWidthTiles);
  const rowInSheet = Math.floor(local / sheetCols);
  const colInSheet = local % sheetCols;
  const rowBand = Math.floor(rowInSheet / frameHeightTiles);
  const rowInFrame = rowInSheet % frameHeightTiles;
  const frameColInBand = Math.floor(colInSheet / frameWidthTiles);
  const colInFrame = colInSheet % frameWidthTiles;
  const animFrame = rowBand * framesPerRow + frameColInBand;
  if (colInFrame >= frameWidthTiles || rowInFrame >= frameHeightTiles || animFrame >= spec.frameCount) return null;
  return { animFrame, colInFrame, rowInFrame };
}

/** Local tile index for one cell inside a frame block. */
function windmillLocalIndex(
  spec: WindmillAnimSpec,
  animFrame: number,
  colInFrame: number,
  rowInFrame: number,
): number {
  if (spec.layout === 'vertical') {
    return animFrame * spec.frameStride + rowInFrame * spec.sheetCols + colInFrame;
  }
  // Horizontal layout: frames are arranged in row-bands.
  const framesPerRow = Math.floor(spec.sheetCols / spec.frameWidthTiles);
  const rowBand = Math.floor(animFrame / framesPerRow);
  const frameColInBand = animFrame % framesPerRow;
  return (rowBand * spec.frameHeightTiles + rowInFrame) * spec.sheetCols
    + frameColInBand * spec.frameWidthTiles + colInFrame;
}

type CropTileRecord = {
  layer: Phaser.Tilemaps.TilemapLayer;
  tileX: number;
  tileY: number;
  tileIndex: number;
  worldX: number;
  worldY: number;
  lastRustleAt: number;
};

/** Static list of all tileset image keys used by the map (must match Tiled tileset names). */
const TILESET_IMAGES = [
  'water to grass - river orientation-spritesheet',
  'Tileset-Terrain-new grass',
  'guild_hqs',
  'Tileset-Terrain',
  'tree - color scheme 4 - 1',
  'tree - color scheme 5 - 2',
  'tree - color scheme 1 - 3',
  'tree - color scheme 2 - 1',
  'tree - color scheme 3 - 2',
  'tree - color scheme 2 - 3',
  'orc melee - all animations with fx',
  'cabin',
  'Aethelwood Farmsteads',
  'fences and half-sized walls',
  'vendor-tent',
  'Premade_houses3',
  'crops-wheat-taller',
  'crops-tomato_5',
  'crops-broccoli_5',
  'crops-artichoke_5',
  'crops-bok chok_5',
  'crops-blueberry_5',
  'crops-carrot_5',
  'crops-cauliflower_4',
  'crops-garlic_4',
  'crops-eggplant_5',
  'crops-hot pepper_5',
  'crops-grape_5',
  'crops-corn_5',
  'crops-pumpkin_3',
  'crops-green bean_5',
  'items-flowers1_0',
  'Windmill',
  'Windmill_baked_anim',
  'wind-cartoonish-fx-288X64- 48frames',
  'props',
  'Tileset-ruins-Terrain',
  'Tileset-ruins-Terrain2',
  'altar',
  'altar - on grass - complete',
  'altar-stone columns-1',
  'altar-stone columns-2',
  'crops-red cabagge_5',
  'crops-strawberry_5',
  'doorway - entrance - gateway',
  'fertilized soil',
  'shrine-base-with grass',
  'shrine-buff available animation-295x311',
  'stronghold - embranchment section - down - on grass',
  'stronghold - embranchment section - on grass',
  'stronghold - embranchment section - up - on grass',
  'stronghold - embranchment section - right - on grass',
  'stronghold - embranchment section - left - on grass',
  'stronghold - horizontal - on grass',
  'stronghold - horizontal2 - on grass',
  'stronghold - horizontal - entrance - on grass',
  'stronghold - horizontal - end - on grass',
  'stronghold - vertical - on grass',
  'stronghold - vertical2 - on grass',
  'stronghold - vertical - end2 - on grass',
  'stronghold - gate - left section - on grass',
  'watchtower - front',
  'Atlas-Props',
  'Atlas-Props-sheet2',
  'Ancient-Temple-whole structure',
  'tent 1 - on grass',
  'tent 1 - small - on grass',
  'tent 2 - on grass',
  'tent 2 - small - on grass',
  'campfire 15',
  'campfire2- fire',
  'campfire smoke',
  'blacksmith-building',
  'fish shop',
  'Free_Premade_houses',
  'Premade_houses',
  'waterfall-structure',
  'waterfall',
  'wall-5-2-premade corners',
  'wall-5 - 2 tiles tall',
  'golden statues_12',
  // ── Oracle altar area (guild_hq_floor_2 layer uses this tileset) ────────
  'Atlas-props-mountain',
] as const;

const PRELOAD_TILESET_KEYS = new Set<string>(TILESET_IMAGES);

const TRAVELER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
type TravelerDirection = (typeof TRAVELER_DIRECTIONS)[number];
const SOLID_TILE_LAYER_NAMES = new Set(['Hillside', 'Hillside 2', 'forest 4', 'forest layer 3']);
const TRAVELER_FRAME = { width: 32, height: 80 };
const TRAVELER_FRAME_COUNTS = {
  idle: 24,
  walk: 24,
  run: 24,
  attack: 24,
  attack2: 24,
  hurt: 12,
  death: 21,
  cast: 36,
} as const;

/**
 * `portal-grassland-activated-loop.png`: 288×192 frames on a 2016×384 sheet → 7 cols × 2 rows = 14 cells,
 * but only frames 0–7 are authored — cells 8–13 are fully transparent padding (sheet-author quirk).
 * Animating through them caused the Mirror of Maia portal to "blink" off for ~6/14 of every loop.
 *
 * `portal-grassland-activating.png` shares the same 7×2 layout and the same 0–7-only authoring,
 * so the activate animation also clamps to `end: 7` below.
 *
 * `portal-grassland-deactivating.png` is a 6×1 sheet with all 6 cells authored — no clamp needed.
 *
 * The `MAIA_PORTAL_BIOME_VARIANTS` siblings (ancient-ruins, cemetery, …) follow the exact same
 * 7×2 layout and same 0–7-only authoring quirk — verified per-cell with SHA1 fingerprints when
 * the assets were first imported, so they share the `IDLE_LAST_FRAME` clamp.
 */
const MAIA_PORTAL_IDLE_LAST_FRAME = 7;
const MAIA_PORTAL_ACTIVATE_LAST_FRAME = 7;
const MAIA_PORTAL_DEACTIVATE_LAST_FRAME = 5;
const MAIA_PORTAL_FRAME = { width: 288, height: 192 } as const;

/**
 * Author's reference video shows the Mirror of Maia cycling through different biome vistas while idle.
 * Each entry below is a separate `*-activated-loop.png` sheet under `public/assets/maps/`.
 * Grassland is intentionally listed first so it stays the boot-time default before the rotation kicks in
 * (matching the legacy `lh_maia_portal_idle` key, which still aliases the grassland sheet).
 *
 * Adding/removing biomes is data-only: drop the sheet into `public/assets/maps/` and append it here.
 */
const MAIA_PORTAL_IDLE_BIOMES = [
  { id: 'grassland', file: 'portal-grassland-activated-loop.png' },
  { id: 'grassland2', file: 'portal-grassland2-activated-loop.png' },
  { id: 'village', file: 'portal-village-activated-loop.png' },
  { id: 'highlands', file: 'portal-highlands-activated-loop.png' },
  { id: 'ancient-ruins', file: 'portal-ancient-ruins-activated-loop.png' },
  { id: 'cemetery', file: 'portal-cemetery-activated-loop.png' },
  { id: 'crypt', file: 'portal-crypt-activated-loop.png' },
  { id: 'old-prison', file: 'portal-old-prison-activated-loop.png' },
  { id: 'sewers', file: 'portal-sewers-activated-loop.png' },
  { id: 'volcano', file: 'portal-volcano-activated-loop.png' },
] as const;

const MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY = 'lh_maia_portal_idle';
const maiaPortalIdleAnimKey = (biomeId: string): string =>
  biomeId === 'grassland' ? MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY : `lh_maia_portal_idle__${biomeId}`;

/** ms between biome swaps; ~5 s feels cinematic without becoming busy. */
const MAIA_PORTAL_ROTATION_INTERVAL_MS = 5000;
/**
 * Length of the alpha crossfade between two biome sprites (outgoing fades 1→0, incoming fades 0→1).
 * The two tweens overlap, so the portal silhouette never visually disappears (no "blink").
 */
const MAIA_PORTAL_ROTATION_CROSSFADE_MS = 620;

type TravelerStrikeAnimKind = 'attack' | 'attack2';
const TRAVELER_VISIBLE_FRAME_STRIDE = 3;
const TRAVELER_VISIBLE_FRAME_OFFSET = 1;

/**
 * Grounded top-down movement: constant-speed vector (no accel slide). Input is normalized so diagonals
 * match cardinals. Tune FPS vs speed together — ~8 visible stride frames per full cycle.
 */
const TRAVELER_MOVE_SPEED_PX = 128;
const TRAVELER_RUN_ANIM_FPS = 12;

/**
 * Main camera zoom for the normal exploration screen. Higher = pushed in (less of the world visible at once).
 * Persists across knowledge-battle entry/exit because Phaser cameras keep their zoom across `startFollow`.
 */
/** Main-map follow camera — raise to zoom in; lower to show more tiles. */
const EXPLORATION_CAMERA_ZOOM = 2.3;
/** Bias follow point slightly south so tall attack frames are less likely to clip the top of the viewport. */
const EXPLORATION_CAMERA_FOLLOW_OFFSET_Y = 42;
/**
 * Strip cells are 32×80. At `EXPLORATION_CAMERA_ZOOM`, we want an **integer** screen width for one column
 * (`frameWidth * scale * zoom`) so WebGL nearest sampling does not shear high-contrast sword FX with vertical
 * “slice” seams. Target ~50px wide (was 50.4 at 0.75×2.1 — imperceptible size change).
 */
const EXPLORATION_TRAVELER_FRAME_SCREEN_PX_W = 50;
/** Exploration Traveler (`lh_traveler_*`) display scale. JRPG battle Traveler uses its own scale in `enterKnowledgeBattlePresentation`. */
const EXPLORATION_TRAVELER_DISPLAY_SCALE =
  EXPLORATION_TRAVELER_FRAME_SCREEN_PX_W / (TRAVELER_FRAME.width * EXPLORATION_CAMERA_ZOOM);
/** Hide the floating "E / Enter" bubble while the player stays within this radius of the session spawn.
 *  Set to 0 — the Master Scribe spawns adjacent to the player and new players need to see the prompt immediately. */
const INTERACTION_PROMPT_SUPPRESS_NEAR_SPAWN_PX = 0;

/** Sprint (hold R while moving). Fuel drains only during sprint movement; cooldown starts when fuel hits 0. */
const TRAVELER_SPRINT_SPEED_PX = 188;
const SPRINT_FUEL_MAX_MS = 2400;
const SPRINT_COOLDOWN_MS = 5200;
const SPRINT_RUN_ANIM_TIME_SCALE = 1.22;
const SHOW_DEMO_DEBUG_HUD = import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true';
/** Temporary Lost Echo pipeline diagnostics (DEV or `VITE_LH_QUEST_DEBUG`). */
const LOST_ECHO_DEEP_DIAG = import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true';
const MASTER_SCRIBE_NPC_ID = 'master_scribe';
const LOST_ECHO_TRIGGER_NAME = 'knowledge_combat_first';
const MASTER_SCRIBE_IDLE_KEY = 'lh_master_scribe_idle';
const MASTER_SCRIBE_TALK_KEY = 'lh_master_scribe_talk';
const LOST_ECHO_IDLE_KEY = 'lh_lost_echo_idle';
const MASTER_SCRIBE_IDLE_ANIM_KEY = 'lh_master_scribe_idle_anim';
const MASTER_SCRIBE_TALK_ANIM_KEY = 'lh_master_scribe_talk_anim';
const LOST_ECHO_IDLE_ANIM_KEY = 'lh_lost_echo_idle_anim';
const MASTER_SCRIBE_FRAME = { width: 160, height: 160, count: 10 };
/** 5×5 grid in `old_wizard-idle2.png` — last four cells (indices 21–24) are empty padding; do not include in the anim. */
const MASTER_SCRIBE_TALK_FRAME = { width: 160, height: 160, count: 21 };
const LOST_ECHO_FRAME = { width: 192, height: 128, count: 8 };
const LOST_ECHO_FRAME_COUNTS = {
  idle: 8,
  run: 8,
  attack: 17,
  attack2: 14,
  hurt: 8,
  death: 13,
} as const;

/** Oracle of Fate golden statue (static image loaded separately from tilesets). */
const ORACLE_STATUE_KEY = 'lh_oracle_statue';
const ORACLE_STATUE_FILE = 'assets/maps/golden%20statues_12.png';
/** Window event fired by useNightOneFlow to trigger Oracle buildup sequence. */
const LH_WINDOW_ORACLE_BUILDUP_START = 'lh:oracle-buildup-start';
/** Window event fired after Oracle module closes, triggering the return transition. */
const LH_WINDOW_ORACLE_RETURN_TRANSITION = 'lh:oracle-return-transition';
/** Glow colour for the Oracle statue (warm gold). */
const ORACLE_GLOW_COLOR = 0xd4a017;
/** Idle outer glow strength on the Oracle statue. */
const ORACLE_GLOW_IDLE = 2;
/** Peak glow strength reached during the buildup animation. */
const ORACLE_GLOW_BUILDUP_PEAK = 6;

/**
 * Roaming hack-and-slash Lost Echoes (separate from the scripted `lost_echo_demo` knowledge-battle trigger).
 * These wander a small radius around their spawn, chase the player when in range, and swing on contact.
 * Player can damage them with the A button; on HP zero they play the death anim and despawn.
 *
 * No XP / loot system yet — combat is purely tactile feedback for the prototype.
 */
const ROAMING_LOST_ECHO_HP = 3;
const ROAMING_LOST_ECHO_WANDER_SPEED = 36;
const ROAMING_LOST_ECHO_CHASE_SPEED = 84;
const ROAMING_LOST_ECHO_AGGRO_RADIUS_PX = 220;
const ROAMING_LOST_ECHO_DEAGGRO_RADIUS_PX = 340;
const ROAMING_LOST_ECHO_ATTACK_RANGE_PX = 56;
const ROAMING_LOST_ECHO_ATTACK_COOLDOWN_MS = 1600;
const ROAMING_LOST_ECHO_ATTACK_WINDUP_MS = 220;
const ROAMING_LOST_ECHO_HURT_LOCK_MS = 280;
const ROAMING_LOST_ECHO_DEATH_FADE_MS = 950;
const ROAMING_LOST_ECHO_WANDER_RADIUS_PX = 96;
const ROAMING_LOST_ECHO_WANDER_REPLAN_MS = 2400;
/** Display scale matches the scripted Lost Echo visual (`addLostEchoVisual` uses 0.62). */
const ROAMING_LOST_ECHO_SCALE = 0.62;

/**
 * Tall grass tile objects use Tiled `y` (feet line) for `setDepth` in `addTiledTileObjectDecor`.
 * Keep the default at 0 so grass stays in front until the Traveler's feet cross the same authored line.
 * Only layers whose name includes `grass` receive this tuning hook (e.g. `lh_decor_tall_grass`).
 */
const EXPLORATION_TALL_GRASS_DEPTH_Y_SHRINK_PX = 0;
const REACTIVE_GRASS_RADIUS_PX = 34;
const REACTIVE_GRASS_TRIGGER_INTERVAL_MS = 95;
const REACTIVE_GRASS_SPRITES_PER_TICK = 5;
const REACTIVE_GRASS_RUSTLE_COOLDOWN_MS = 230;
const REACTIVE_GRASS_BEND_PX = 1.6;
const REACTIVE_GRASS_BEND_DEG = 3.5;
const REACTIVE_GRASS_SQUASH_Y = 0.95;
const EXPLORATION_SHADOW_COLOR = 0x111827;
const EXPLORATION_CONTACT_SHADOW_ALPHA = 0.18;
const EXPLORATION_STATIC_SHADOW_ALPHA = 0.14;
const EXPLORATION_PROCEDURAL_SHADOWS_ENABLED = import.meta.env.VITE_LH_PROCEDURAL_SHADOWS === 'true';
const EXPLORATION_VISUAL_GRADE_ENABLED = import.meta.env.VITE_LH_VISUAL_GRADE === 'true';
const EXPLORATION_AUTHORING_DEBUG =
  import.meta.env.DEV && import.meta.env.VITE_LH_MAP_AUTHORING_DEBUG === 'true';
const EXPLORATION_LIGHTS_ENABLED = import.meta.env.VITE_LH_FAKE_LIGHTS !== 'false';
const EXPLORATION_ADDITIVE_LIGHTS_ENABLED = import.meta.env.VITE_LH_ADDITIVE_LIGHTS === 'true';

const SHADOW_ASSET_BY_KIND: Readonly<Record<string, string>> = {
  tree_small: 'assets/maps/tree%20-%20shadow%20-%201.png',
  tent: 'assets/maps/Cabin-shadow%20bot%20right.png',
};

const SHADOW_TEXTURE_BY_KIND: Readonly<Record<string, string>> = {
  tree_small: 'lh_shadow_tree_small',
  tent: 'lh_shadow_tent',
};

function tiledProp(props: readonly TiledPropertyRuntime[] | undefined, key: string): unknown {
  return props?.find((p) => p.name === key)?.value;
}

function tiledPropString(props: readonly TiledPropertyRuntime[] | undefined, key: string): string | null {
  const v = tiledProp(props, key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function tiledPropNumber(
  props: readonly TiledPropertyRuntime[] | undefined,
  key: string,
  fallback: number,
): number {
  const n = Number(tiledProp(props, key));
  return Number.isFinite(n) ? n : fallback;
}

/** How far in front of the Traveler the A-button swing extends, and how wide the swing arc is. */
const PLAYER_ATTACK_RANGE_PX = 64;
const PLAYER_ATTACK_WIDTH_PX = 72;
/** Player invulnerability window after taking a hit, so a roamer can't double-tap during hurt animation. */
const PLAYER_INVULN_AFTER_HIT_MS = 900;
/** Knockback magnitudes — short, snappy, no slide. */
const PLAYER_KNOCKBACK_PX = 22;
const ROAMING_LOST_ECHO_KNOCKBACK_PX = 36;

type RoamingLostEchoAi = 'wander' | 'chase' | 'attack' | 'hurt' | 'dead';

/**
 * Resolved per-roamer tuning. Built from a Tiled `roaming_lost_echo_spawn` object's optional
 * properties layered on top of `DEFAULT_ROAMING_LOST_ECHO_CONFIG`. Once resolved we never read
 * the global constants again for that roamer — every override stays scoped to its spawn marker.
 */
type RoamingLostEchoConfig = {
  hp: number;
  wanderSpeed: number;
  chaseSpeed: number;
  aggroRadiusPx: number;
  deaggroRadiusPx: number;
  attackRangePx: number;
  attackCooldownMs: number;
  wanderRadiusPx: number;
};

const DEFAULT_ROAMING_LOST_ECHO_CONFIG: RoamingLostEchoConfig = {
  hp: ROAMING_LOST_ECHO_HP,
  wanderSpeed: ROAMING_LOST_ECHO_WANDER_SPEED,
  chaseSpeed: ROAMING_LOST_ECHO_CHASE_SPEED,
  aggroRadiusPx: ROAMING_LOST_ECHO_AGGRO_RADIUS_PX,
  deaggroRadiusPx: ROAMING_LOST_ECHO_DEAGGRO_RADIUS_PX,
  attackRangePx: ROAMING_LOST_ECHO_ATTACK_RANGE_PX,
  attackCooldownMs: ROAMING_LOST_ECHO_ATTACK_COOLDOWN_MS,
  wanderRadiusPx: ROAMING_LOST_ECHO_WANDER_RADIUS_PX,
};

/** Pull a positive finite number from the Tiled spawn, or fall back to the global default. */
function pickRoamerNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveRoamingLostEchoConfig(spawn: ParsedLhRoamingLostEchoSpawn): {
  config: RoamingLostEchoConfig;
  /** List of property keys whose default was overridden — used for DEV logging only. */
  overrides: string[];
} {
  const config: RoamingLostEchoConfig = {
    hp: pickRoamerNumber(spawn.hp, DEFAULT_ROAMING_LOST_ECHO_CONFIG.hp),
    wanderSpeed: pickRoamerNumber(spawn.wander_speed, DEFAULT_ROAMING_LOST_ECHO_CONFIG.wanderSpeed),
    chaseSpeed: pickRoamerNumber(spawn.chase_speed, DEFAULT_ROAMING_LOST_ECHO_CONFIG.chaseSpeed),
    aggroRadiusPx: pickRoamerNumber(spawn.aggro_radius_px, DEFAULT_ROAMING_LOST_ECHO_CONFIG.aggroRadiusPx),
    deaggroRadiusPx: pickRoamerNumber(spawn.deaggro_radius_px, DEFAULT_ROAMING_LOST_ECHO_CONFIG.deaggroRadiusPx),
    attackRangePx: pickRoamerNumber(spawn.attack_range_px, DEFAULT_ROAMING_LOST_ECHO_CONFIG.attackRangePx),
    attackCooldownMs: pickRoamerNumber(
      spawn.attack_cooldown_ms,
      DEFAULT_ROAMING_LOST_ECHO_CONFIG.attackCooldownMs,
    ),
    wanderRadiusPx: pickRoamerNumber(spawn.wander_radius_px, DEFAULT_ROAMING_LOST_ECHO_CONFIG.wanderRadiusPx),
  };
  const overrides: string[] = [];
  if (spawn.hp !== undefined) overrides.push(`hp=${config.hp}`);
  if (spawn.wander_speed !== undefined) overrides.push(`wander_speed=${config.wanderSpeed}`);
  if (spawn.chase_speed !== undefined) overrides.push(`chase_speed=${config.chaseSpeed}`);
  if (spawn.aggro_radius_px !== undefined) overrides.push(`aggro_radius_px=${config.aggroRadiusPx}`);
  if (spawn.deaggro_radius_px !== undefined) overrides.push(`deaggro_radius_px=${config.deaggroRadiusPx}`);
  if (spawn.attack_range_px !== undefined) overrides.push(`attack_range_px=${config.attackRangePx}`);
  if (spawn.attack_cooldown_ms !== undefined) overrides.push(`attack_cooldown_ms=${config.attackCooldownMs}`);
  if (spawn.wander_radius_px !== undefined) overrides.push(`wander_radius_px=${config.wanderRadiusPx}`);
  return { config, overrides };
}

type RoamingLostEcho = {
  id: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  state: RoamingLostEchoAi;
  /** Anchor point the roamer wanders around when not aggroed. */
  homeX: number;
  homeY: number;
  /** Currently chosen wander destination; null when standing or chasing. */
  wanderTargetX: number | null;
  wanderTargetY: number | null;
  /** Time (scene ms) at/after which the AI may pick a new wander target. */
  nextWanderDecisionAt: number;
  /** Time (scene ms) at/after which this roamer can swing again. */
  attackReadyAt: number;
  /** While set, the roamer is locked into the hurt animation and ignores movement. */
  hurtUntil: number;
  /** Pending damage tick from a windup attack — applied if still in range when this fires. */
  attackResolveAt: number;
  attackPending: boolean;
  /** Resolved tuning (Tiled overrides + defaults). All AI math reads from here, never globals. */
  config: RoamingLostEchoConfig;
  /** Optional Tiled `lh_spawn_group`, kept for future respawn / wave wiring. */
  spawn_group?: string;
  /** Optional Tiled `lh_debug_label` — DEV-only logging hint. */
  debug_label?: string;
  /** Tiled `lh_respawn` — currently always false; reserved for the next milestone. */
  respawn: boolean;
  /** Tiled object ID this roamer was spawned from (for DEV logging). */
  source_tiled_object_id: number;
};

/** Lost Echo battle / world anims — single source for create() + runtime re-registration before JRPG enter. */
const LOST_ECHO_ANIM_SPECS = [
  { key: LOST_ECHO_IDLE_ANIM_KEY, sheet: LOST_ECHO_IDLE_KEY, count: LOST_ECHO_FRAME_COUNTS.idle, fps: 7, repeat: -1 },
  { key: 'lh_lost_echo_run', sheet: 'lh_lost_echo_run', count: LOST_ECHO_FRAME_COUNTS.run, fps: 9, repeat: -1 },
  { key: 'lh_lost_echo_attack', sheet: 'lh_lost_echo_attack', count: LOST_ECHO_FRAME_COUNTS.attack, fps: 14, repeat: 0 },
  { key: 'lh_lost_echo_attack2', sheet: 'lh_lost_echo_attack2', count: LOST_ECHO_FRAME_COUNTS.attack2, fps: 13, repeat: 0 },
  { key: 'lh_lost_echo_hurt', sheet: 'lh_lost_echo_hurt', count: LOST_ECHO_FRAME_COUNTS.hurt, fps: 11, repeat: 0 },
  { key: 'lh_lost_echo_death', sheet: 'lh_lost_echo_death', count: LOST_ECHO_FRAME_COUNTS.death, fps: 10, repeat: 0 },
] as const;

function jrpgBattleAnimLog(reason: string, meta: Record<string, unknown>): void {
  if (!import.meta.env.DEV && import.meta.env.VITE_LH_QUEST_DEBUG !== 'true') return;
  console.warn('[LhJrpgBattle]', reason, meta);
}

/**
 * Play a sprite animation only when registered and non-empty; never throws (Phaser can throw if frames mismatch).
 * `ok` is true only when the requested `key` played. `playedKey` is the animation actually started (may be fallback).
 */
function safeSpriteAnimPlay(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite | undefined | null,
  key: string,
  options?: { ignoreIfPlaying?: boolean; fallbackKey?: string },
): { ok: boolean; playedKey: string | null } {
  if (!sprite?.active || !sprite.scene) return { ok: false, playedKey: null };
  const ignoreIfPlaying = options?.ignoreIfPlaying ?? false;
  const attempt = (k: string): boolean => {
    if (!scene.anims.exists(k)) {
      jrpgBattleAnimLog('animation key not registered', { key: k });
      return false;
    }
    const anim = scene.anims.get(k);
    if (!anim?.frames?.length) {
      jrpgBattleAnimLog('animation has zero frames', { key: k });
      return false;
    }
    try {
      sprite.play(k, ignoreIfPlaying);
      return true;
    } catch (err) {
      jrpgBattleAnimLog('sprite.play threw', { key: k, message: err instanceof Error ? err.message : String(err) });
      return false;
    }
  };
  if (attempt(key)) return { ok: true, playedKey: key };
  const fb = options?.fallbackKey;
  if (fb && fb !== key && attempt(fb)) return { ok: false, playedKey: fb };
  try {
    sprite.anims?.stop?.();
    const tex = sprite.texture;
    const total =
      tex && typeof (tex as unknown as { frameTotal?: number }).frameTotal === 'number'
        ? (tex as unknown as { frameTotal: number }).frameTotal
        : 0;
    if (tex?.key && total > 0) {
      sprite.setFrame(0);
    }
  } catch {
    // keep last frame
  }
  return { ok: false, playedKey: null };
}

function layoutBackdropToCameraViewport(
  cam: Phaser.Cameras.Scene2D.Camera,
  viewW: number,
  viewH: number,
  obj: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image,
): void {
  const v0 = jrpgViewportCornerScratch[0];
  const v1 = jrpgViewportCornerScratch[1];
  const v2 = jrpgViewportCornerScratch[2];
  const v3 = jrpgViewportCornerScratch[3];
  cam.getWorldPoint(0, 0, v0);
  cam.getWorldPoint(viewW, 0, v1);
  cam.getWorldPoint(0, viewH, v2);
  cam.getWorldPoint(viewW, viewH, v3);
  const minX = Math.min(v0.x, v1.x, v2.x, v3.x);
  const maxX = Math.max(v0.x, v1.x, v2.x, v3.x);
  const minY = Math.min(v0.y, v1.y, v2.y, v3.y);
  const maxY = Math.max(v0.y, v1.y, v2.y, v3.y);
  obj.setPosition((minX + maxX) / 2, (minY + maxY) / 2);
  const w = maxX - minX;
  const h = maxY - minY;
  if (obj instanceof Phaser.GameObjects.Image) {
    obj.setDisplaySize(w, h);
  } else {
    obj.setSize(w, h);
  }
  obj.setScrollFactor(1, 1);
}

function getJrpgDomOverlayZInfo(): Record<string, unknown> {
  if (typeof document === 'undefined') return { domAvailable: false };
  const el = document.querySelector('.lh-jrpg-battle-root');
  if (!el || !(el instanceof HTMLElement)) return { domAvailable: true, jrpgBattleRootFound: false };
  const cs = window.getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    domAvailable: true,
    jrpgBattleRootFound: true,
    zIndex: cs.zIndex,
    pointerEvents: cs.pointerEvents,
    position: cs.position,
    boundingClientRect: { x: r.x, y: r.y, width: r.width, height: r.height },
    parentZIndex:
      el.parentElement instanceof HTMLElement ? window.getComputedStyle(el.parentElement).zIndex : null,
  };
}

function jrpgBattleSpriteSummary(
  s: Phaser.GameObjects.Sprite | undefined,
  cam: Phaser.Cameras.Scene2D.Camera,
): Record<string, unknown> {
  if (!s) return { created: false };
  return {
    created: true,
    active: s.active,
    textureKey: s.texture?.key,
    x: s.x,
    y: s.y,
    visible: s.visible,
    alpha: s.alpha,
    depth: s.depth,
    scaleX: s.scaleX,
    scaleY: s.scaleY,
    displayWidth: s.displayWidth,
    displayHeight: s.displayHeight,
    scrollFactorX: s.scrollFactorX,
    scrollFactorY: s.scrollFactorY,
    currentAnim: s.anims?.currentAnim?.key ?? null,
    frame: s.frame?.name,
    willRender: s.willRender(cam),
  };
}

function logJrpgBattleActorLayout(
  scene: Phaser.Scene,
  label: string,
  traveler: Phaser.GameObjects.Sprite | undefined,
  enemy: Phaser.GameObjects.Sprite | undefined,
): void {
  if (!import.meta.env.DEV && import.meta.env.VITE_LH_QUEST_DEBUG !== 'true') return;
  const cam = scene.cameras.main;
  const canvas = scene.sys.game.canvas;
  const payload = {
    label,
    travelerExists: Boolean(traveler),
    lostEchoExists: Boolean(enemy),
    camera: { width: cam.width, height: cam.height, scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom },
    canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
    domOverlay: getJrpgDomOverlayZInfo(),
    traveler: jrpgBattleSpriteSummary(traveler, cam),
    lostEcho: jrpgBattleSpriteSummary(enemy, cam),
  };
  // eslint-disable-next-line no-console
  console.info(`[LhJrpgBattle] battle actor layout (${label})\n${JSON.stringify(payload, null, 2)}`);
}

function logLostEchoBattleAnimAudit(scene: Phaser.Scene, context: string): void {
  if (!import.meta.env.DEV && import.meta.env.VITE_LH_QUEST_DEBUG !== 'true') return;
  const rows = LOST_ECHO_ANIM_SPECS.map((spec) => {
    const textureOk = scene.textures.exists(spec.sheet);
    const registered = scene.anims.exists(spec.key);
    const anim = registered ? scene.anims.get(spec.key) : null;
    const n = anim?.frames?.length ?? 0;
    return { key: spec.key, sheet: spec.sheet, textureOk, registered, frames: n };
  });
  const bad = rows.filter((r) => !r.textureOk || !r.registered || r.frames === 0);
  if (bad.length) {
    console.warn(`[LhJrpgBattle] Lost Echo animation audit (${context}) — missing or empty:`, bad);
  } else {
    // eslint-disable-next-line no-console
    console.info(`[LhJrpgBattle] Lost Echo animation audit (${context}) — all keys registered with frames.`);
  }
}

function registerLostEchoAnimsIfNeeded(scene: Phaser.Scene): void {
  for (const spec of LOST_ECHO_ANIM_SPECS) {
    if (!scene.textures.exists(spec.sheet)) continue;
    if (scene.anims.exists(spec.key)) continue;
    try {
      scene.anims.create({
        key: spec.key,
        frames: scene.anims.generateFrameNumbers(spec.sheet, {
          start: 0,
          end: spec.count - 1,
        }),
        frameRate: spec.fps,
        repeat: spec.repeat,
      });
    } catch (err) {
      jrpgBattleAnimLog('failed to register Lost Echo animation', {
        key: spec.key,
        sheet: spec.sheet,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/** Dev-only escape hatch: hold R to sprint without fuel drain or cooldown. */
const DEMO_UNLIMITED_SPRINT = import.meta.env.VITE_LH_DEMO_UNLIMITED_SPRINT === 'true';

/** After guild research portal animation, block `overlap_auto` re-fires while the player is still inside the zone. */
const GUILD_RESEARCH_REACTIVATE_COOLDOWN_MS = 4200;
/**
 * Min pixels below the Tiled trigger bottom for the return tween. Must clear `guildResearchNearRow`’s inflated hull
 * (72px) plus the traveler foot AABB — small values loop large HQ rects (e.g. Aethelwood ~423×189).
 */
const GUILD_RESEARCH_EXIT_STAND_BELOW_MIN_PX = 132;
/** Extra stand-off scaled by trigger height so wide/tall guild HQ zones do not immediately re-fire `overlap_auto`. */
const GUILD_RESEARCH_EXIT_STAND_BELOW_HEIGHT_FACTOR = 0.28;

function guildResearchExitStandY(hit: { y: number; h: number }): number {
  const extra = Math.round(Math.max(0, hit.h) * GUILD_RESEARCH_EXIT_STAND_BELOW_HEIGHT_FACTOR);
  return hit.y + hit.h + GUILD_RESEARCH_EXIT_STAND_BELOW_MIN_PX + extra;
}

function travelerVisibleFrameIndices(totalFrames: number): number[] {
  const frames: number[] = [];
  for (let i = TRAVELER_VISIBLE_FRAME_OFFSET; i < totalFrames; i += TRAVELER_VISIBLE_FRAME_STRIDE) {
    frames.push(i);
  }
  return frames.length ? frames : [0];
}

/**
 * Per-direction non-blank strip cells (`attack1_*.png` / `attack2_*.png`). Each facing is its own
 * texture — a single global list (intersection) dropped swing frames that only exist on left/right
 * sheets, which read as horizontal “clip” + empty-frame blink. Regenerate if attack PNGs change.
 * (Opaque pixel count > 35 at α > 20 in each 32×80 cell.)
 * Omit near-empty cells (roughly under ~120 opaque px) — they read as a blink against fuller swing frames.
 * Vertical sheets: drop sparse in-betweens, identical tail duplicates (`attack1_up` 19≡22), and near-duplicate
 * recovery (`attack2_up` 13≈16) so up/down clips do not “double tap” the same pose.
 */
const ATTACK1_FRAMES_BY_DIR: Record<TravelerDirection, readonly number[]> = {
  down: [1, 3, 4, 7, 10, 13, 16, 19, 22],
  left: [1, 3, 4, 6, 7, 10, 13, 16, 19, 22],
  right: [1, 4, 5, 7, 8, 10, 13, 16, 19, 22],
  up: [1, 3, 4, 6, 7, 10, 13, 16, 19],
};
const ATTACK2_FRAMES_BY_DIR: Record<TravelerDirection, readonly number[]> = {
  down: [1, 3, 4, 5, 6, 7, 10, 13, 16, 19, 22],
  left: [1, 3, 4, 6, 7, 10, 13, 16, 19, 22],
  right: [1, 4, 5, 7, 8, 10, 13, 16, 19, 22],
  up: [1, 4, 5, 7, 8, 10, 13, 19, 22],
};
/** Faster than idle `fps` so multi-frame attack clips stay snappy. */
const TRAVELER_ATTACK_ANIM_FPS = 18;

/**
 * Attack FX often spans two 32px strip columns; sampling only the nominal cell shears the arc at vertical
 * cell edges (see screen recordings). Wide frames sample `±pad` into neighbors; `attachTravelerWideStripHandlers`
 * shifts horizontal origin so the foot column stays stable.
 */
/** One full 32px neighbor column each side so swing tips at strip ends stay inside the sampled rect. */
const TRAVELER_ATTACK_WIDE_PAD_PX = 32;

function travelerWideStripRect(
  stripIndex: number,
  sourceWidthPx: number,
  cellW: number,
  pad: number,
): { x0: number; width: number; originX: number } {
  const L = stripIndex * cellW;
  const nominalCenter = L + cellW / 2;
  const x0 = Math.max(0, L - pad);
  const x1 = Math.min(sourceWidthPx, L + cellW + pad);
  const width = Math.max(1, x1 - x0);
  const originX = Phaser.Math.Clamp((nominalCenter - x0) / width, 0.02, 0.98);
  return { x0, width, originX };
}

function registerTravelerWideAttackStripFrames(scene: Phaser.Scene): void {
  const n = TRAVELER_FRAME_COUNTS.attack;
  for (const dir of TRAVELER_DIRECTIONS) {
    for (const kind of ['attack', 'attack2'] as const) {
      const texKey = `lh_traveler_${kind}_${dir}`;
      if (!scene.textures.exists(texKey)) continue;
      const tex = scene.textures.get(texKey);
      const srcW = tex.source[0].width;
      for (let stripIdx = 0; stripIdx < n; stripIdx++) {
        const wideName = `wide_${stripIdx}`;
        if (tex.has(wideName)) {
          tex.remove(wideName);
        }
        const { x0, width } = travelerWideStripRect(
          stripIdx,
          srcW,
          TRAVELER_FRAME.width,
          TRAVELER_ATTACK_WIDE_PAD_PX,
        );
        tex.add(wideName, 0, x0, 0, width, TRAVELER_FRAME.height);
      }
    }
  }
}

function syncTravelerWideStripOrigin(sprite: Phaser.GameObjects.Sprite, footOriginY: number): void {
  const nm = sprite.frame?.name;
  if (nm === undefined || nm === null) return;
  if (!/^wide_\d+$/.test(String(nm))) return;
  const stripIdx = Number(String(nm).slice('wide_'.length));
  const tex = sprite.texture;
  const srcW = tex.source[0]?.width ?? TRAVELER_FRAME.width * TRAVELER_FRAME_COUNTS.attack;
  const { originX } = travelerWideStripRect(
    stripIdx,
    srcW,
    TRAVELER_FRAME.width,
    TRAVELER_ATTACK_WIDE_PAD_PX,
  );
  sprite.setOrigin(originX, footOriginY);
}

function attachTravelerWideStripHandlers(sprite: Phaser.GameObjects.Sprite, footOriginY: number): void {
  sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
    syncTravelerWideStripOrigin(sprite, footOriginY);
  });
  sprite.on(Phaser.Animations.Events.ANIMATION_START, (anim: Phaser.Animations.Animation) => {
    if (!anim.key.startsWith('lh_traveler_attack')) {
      sprite.setOrigin(0.5, footOriginY);
      return;
    }
    // First attack frame was drawing with idle origin for one tick; align before render.
    syncTravelerWideStripOrigin(sprite, footOriginY);
  });
}

/** Safety timeout for `playTravelerOneShot` / `playBattleTravelerOneShot` must cover full attack length. */
function travelerAttackSafetyFinishMs(kind: TravelerStrikeAnimKind | 'cast' | 'hurt', callerDurationMs: number): number {
  if (kind !== 'attack' && kind !== 'attack2') {
    return Math.min(callerDurationMs + 200, 1400);
  }
  const n =
    kind === 'attack'
      ? Math.max(...TRAVELER_DIRECTIONS.map((d) => ATTACK1_FRAMES_BY_DIR[d].length))
      : Math.max(...TRAVELER_DIRECTIONS.map((d) => ATTACK2_FRAMES_BY_DIR[d].length));
  const animMs = Math.ceil((n / TRAVELER_ATTACK_ANIM_FPS) * 1000);
  return Math.max(callerDurationMs + 250, animMs + 200);
}

/**
 * Full-screen Phaser 4 world view for Legendary Horizon.
 * Uses Phaser's own loader (tilemapTiledJSON + image) in preload() so that
 * the engine handles all async loading before create() is called.
 */
export function PhaserExplorationView({
  realmId,
  parsedMap,
  kcBeaten = false,
  dialogueNpcId,
  hotspots,
  onActivateHotspot,
  onPause,
  tileMapUrl,
  lostEchoDiagVisitedTriggerIds,
  resolveShaken = false,
  restedReadinessMultiplier = 1.0,
  hasAmberFlame = false,
  overlayBlocksInput = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Keep Phaser instance stable. Hotspot completion changes should NOT tear down/recreate the game.
  const onActivateHotspotRef = useRef(onActivateHotspot);
  const onPauseRef = useRef<() => void>(() => undefined);
  const parsedMapRef = useRef(parsedMap);
  const kcBeatenRef = useRef<boolean>(kcBeaten);
  const dialogueNpcIdRef = useRef<string | undefined>(dialogueNpcId);
  const completionByIdRef = useRef<Map<string, boolean>>(new Map());
  const lostEchoDiagVisitedRef = useRef<readonly string[]>(lostEchoDiagVisitedTriggerIds ?? []);
  const resolveShakenRef = useRef<boolean>(resolveShaken);
  const restedReadinessMultiplierRef = useRef<number>(restedReadinessMultiplier);
  const hasAmberFlameRef = useRef<boolean>(hasAmberFlame);
  const overlayBlocksInputRef = useRef<boolean>(overlayBlocksInput);

  useEffect(() => {
    lostEchoDiagVisitedRef.current = lostEchoDiagVisitedTriggerIds ?? [];
  }, [lostEchoDiagVisitedTriggerIds]);

  useEffect(() => {
    onActivateHotspotRef.current = onActivateHotspot;
  }, [onActivateHotspot]);

  useEffect(() => {
    onPauseRef.current = () => onPause();
  }, [onPause]);

  useEffect(() => {
    parsedMapRef.current = parsedMap;
  }, [parsedMap]);

  useEffect(() => {
    kcBeatenRef.current = kcBeaten;
  }, [kcBeaten]);

  useEffect(() => {
    resolveShakenRef.current = resolveShaken;
  }, [resolveShaken]);

  useEffect(() => {
    restedReadinessMultiplierRef.current = restedReadinessMultiplier;
  }, [restedReadinessMultiplier]);

  useEffect(() => {
    hasAmberFlameRef.current = hasAmberFlame;
  }, [hasAmberFlame]);

  useEffect(() => {
    overlayBlocksInputRef.current = overlayBlocksInput;
    // Notify Phaser scene to toggle keyboard capture so HTML text fields work normally
    // when an overlay (module document, scroll reveal, cinematic) is covering the canvas.
    window.dispatchEvent(
      new CustomEvent('lh:overlay-keyboard-block', { detail: { block: overlayBlocksInput } }),
    );
  }, [overlayBlocksInput]);

  useEffect(() => {
    dialogueNpcIdRef.current = dialogueNpcId;
  }, [dialogueNpcId]);

  useEffect(() => {
    completionByIdRef.current = new Map(hotspots.map((h) => [h.interactable_id, h.completed]));
  }, [hotspots]);

  useEffect(() => {
    let active = true;
    let initialized = false;
    const host = hostRef.current;
    if (!host) return;

    const initGame = (width: number, height: number) => {
      if (!active || initialized || width < 10 || height < 10) return;
      initialized = true;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      // Capture refs for use inside the scene class
      const _parsedMap = parsedMapRef.current;
      const _completionById = completionByIdRef;
      const _kcBeaten = kcBeatenRef;
      const _resolveShaken = resolveShakenRef;
      const _restedReadinessMultiplier = restedReadinessMultiplierRef;
      const _hasAmberFlame = hasAmberFlameRef;
      const _overlayBlocksInput = overlayBlocksInputRef;
      const _dialogueNpcId = dialogueNpcIdRef;
      const _onActivate = (interactableId: string) => onActivateHotspotRef.current(interactableId);
      const _lostEchoDiagVisited = lostEchoDiagVisitedRef;
      const _triggers: TriggerRect[] = _parsedMap.triggers.map((t) => {
        const interactable_id = `${realmId}:obj:${t.tiled_object_id}`;
        const b = t.bounds;
        return {
          interactable_id,
          kind: t.kind,
          tiled_name: t.tiled_name,
          layer_name: t.layer_name,
          activation_mode: t.activation_mode,
          interaction_label_active: t.interaction_label_active,
          npc_id: t.npc_id,
          rotation_deg: t.rotation_deg,
          target_realm_id: t.target_realm_id,
          x: b.x,
          y: b.y,
          w: Math.max(b.width, 1),
          h: Math.max(b.height, 1),
        };
      });

      if (LOST_ECHO_DEEP_DIAG && typeof console !== 'undefined') {
        const rawLost = _parsedMap.triggers.filter((t) => t.tiled_name === LOST_ECHO_TRIGGER_NAME);
        const mergedLost = _triggers.filter((t) => t.tiled_name === LOST_ECHO_TRIGGER_NAME);
        console.info('[LhLostEchoDiag] 2–3. Parsed map + merged Phaser rects (lost_echo_demo)', {
          realmId_prefix: realmId,
          parsed_rows: rawLost.map((t) => ({
            tiled_object_id: t.tiled_object_id,
            layer_name: t.layer_name,
            lh_kind: t.kind,
            activation_mode: t.activation_mode,
            bounds: t.bounds,
          })),
          merged_trigger_rects: mergedLost.map((t) => ({
            interactable_id: t.interactable_id,
            activation_mode: t.activation_mode ?? 'interaction',
            x: t.x,
            y: t.y,
            w: t.w,
            h: t.h,
          })),
          synthetic_note:
            rawLost.some((t) => t.layer_name === 'demo_synthetic_guidance')
              ? 'Includes demo_synthetic_guidance merge from buildDemoGuidanceMap'
              : rawLost.length
                ? 'Using Tiled trigger(s) only (synthetic Lost Echo not appended)'
                : 'No lost_echo_demo row in parsed triggers',
        });
      }
      // Must match `loadLhRuntimeFixture` / `@maps` (same file). After Tiled export, hard-refresh the dev page
      // so the bundled JSON parse and Phaser both pick up changes (avoid partial stale cache).
      // `tileMapUrl` prop overrides the default (e.g. for the stable/backup map variant).
      const _mapUrl = tileMapUrl ?? publicAssetUrl('assets/maps/Legendary_Horizon_Map.json');
      const _tilesetUrl = (name: string) => publicAssetUrl(`assets/maps/${name.replace(/ /g, '%20')}.png`);
      const _travelerUrl = (sheet: string, dir: TravelerDirection) =>
        publicAssetUrl(`assets/player/traveler/${sheet}_${dir}.png`);
      // Capture once at init — when the map has an oracle_altar_zone, oracle_encounter is visual-only
      // (no Enter/E prompt, no Enter activation). Available to both create() and update() via closure.
      const _hasOracleAltarZone = _triggers.some((t) => t.kind === 'oracle_altar_zone');

      class LhScene extends Phaser.Scene {
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keyPause!: Phaser.Input.Keyboard.Key;
        private keyInteract!: Phaser.Input.Keyboard.Key;
        private keyInteractEnter!: Phaser.Input.Keyboard.Key;
        private keyAttack!: Phaser.Input.Keyboard.Key;
        private keySprint!: Phaser.Input.Keyboard.Key;
        private keyLostEchoDiagForce?: Phaser.Input.Keyboard.Key;
        private player!: Phaser.Physics.Arcade.Sprite;
        private playerShadow?: Phaser.GameObjects.Ellipse;
        /** True when exploration uses Traveler sheets (foot origin); false for `lh_player_dot` fallback. */
        private explorationPlayerTraveler = false;
        /** Foot spawn for this session — used to suppress the interaction prompt over the demo spawn tile. */
        private explorationSpawnFootX = 0;
        private explorationSpawnFootY = 0;
        private fogStatics!: Phaser.Physics.Arcade.StaticGroup;
        private solidStatics!: Phaser.Physics.Arcade.StaticGroup;
        private triggerBodies: Array<{ rect: Phaser.GameObjects.Rectangle; meta: TriggerRect }> = [];
        private portalSprites = new Map<string, Phaser.GameObjects.Sprite>();
        private masterScribeSprites = new Map<string, Phaser.GameObjects.Sprite>();
        /** True while React dialogue for Master Scribe is open — used to defer talk anim until after dismiss. */
        private masterScribeDialogueWasOpen = false;
        private lostEchoSprites = new Map<string, Phaser.GameObjects.Sprite>();
        /** Fallback `!` markers when idle texture fails — same visibility rules as `lostEchoSprites`. */
        private lostEchoFallbackMarkers = new Map<string, Phaser.GameObjects.Text>();
        private lostEchoShadows = new Map<string, Phaser.GameObjects.Ellipse>();
        private interactionPromptRoot?: Phaser.GameObjects.Container;
        private interactionPromptBg?: Phaser.GameObjects.Graphics;
        private interactionPromptText?: Phaser.GameObjects.Text;
        private interactionPromptPulseTween?: Phaser.Tweens.Tween;
        private objectiveText?: Phaser.GameObjects.Text;
        private demoDebugText?: Phaser.GameObjects.Text;
        private portalActivating = new Set<string>();
        private activatedInteractableIds = new Set<string>();
        private portalCooldownUntil = new Map<string, number>();
        /** Active idle animation key for the Mirror of Maia. Rotates through biome vistas (see `startMaiaPortalRotation`). */
        private currentMaiaPortalIdleAnim: string = MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY;
        private maiaPortalRotationIndex = 0;
        private maiaPortalRotationTimer?: Phaser.Time.TimerEvent;
        /** Per-portal "outgoing biome" ghost sprites used to crossfade biome swaps without an invisible blink. */
        private maiaPortalRotationGhosts = new Map<string, Phaser.GameObjects.Sprite>();
        /** Prevents `guild_hq_research` overlap_auto from looping when the return tween leaves the player inside the rect. */
        private guildResearchCooldownUntil = new Map<string, number>();
        private lastMaiaPortalId: string | null = null;
        private reactiveGrassDecor: ReactiveGrassDecor[] = [];
        private cropTileRecords: CropTileRecord[] = [];
        private windmillAnimGroups: WindmillAnimGroup[] = [];
        /** Object-layer windmill sprites (structures layer) animated via setFrame(). */
        private windmillDecorSprites: WindmillDecorSprite[] = [];
        /** Shared animation frame counter for windmillDecorSprites (0-based). */
        private windmillDecorAnimFrame = 0;
        private windmillAnimTimer: Phaser.Time.TimerEvent | null = null;
        private nextReactiveGrassScanAt = 0;
        private maiaHandoffPaused = false;
        private triggerTransitionLocked = false;
        private attackingUntil = 0;
        /** Alternates Traveler's attack / attack2 for strikes so both clips appear across combat + exploration. */
        private nextTravelerStrikeIsSecondary = false;
        /** Roaming hack-and-slash Lost Echoes. Distinct from the scripted `lost_echo_demo` JRPG trigger. */
        private roamingLostEchoes: RoamingLostEcho[] = [];
        /** Solid tile layers stored from create() so programmatic spawns (e.g. mq-103) can wire colliders. */
        private solidLayersRef: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
        /** Counts remaining mq-103 tutorial echoes; fires lh:mq103-echoes-cleared when all are defeated. */
        private mq103EchoesRemaining = 0;
        /** mq-105 Knowledge Echo — sprite shown after Scribe dialogue, player must interact to start KC. */
        private mq105EchoSprite: Phaser.GameObjects.Sprite | null = null;
        /**
         * Fallback text marker for the mq-105 echo when the idle sprite sheet hasn't loaded.
         * Displays a purple "?" at the echo world position so the player can still locate it.
         */
        private mq105EchoFallbackMarker: Phaser.GameObjects.Text | null = null;
        /**
         * True once the mq-105 echo (sprite OR fallback marker) has faded in and is ready for
         * interaction. Decoupled from `mq105EchoSprite?.active` so the fallback path also works.
         */
        private mq105EchoActive = false;
        /** World-space position of the Knowledge Echo interaction zone center. */
        private mq105EchoX = 0;
        private mq105EchoY = 0;
        /**
         * Scene.time timestamp before which the mq-105 echo interaction is suppressed.
         * Prevents the Enter key that dismisses Scribe dialogue from immediately triggering combat
         * (input bleed: JustDown is still true on the first frame after dialogue closes).
         */
        private mq105EchoInteractableAfter = 0;
        /**
         * Scene time at which the roaming AI was last frozen (pause / Maia handoff / transition lock).
         * `0` means "currently active". Used to advance per-roamer timers across the pause window
         * so an in-flight attack windup or wander-replan doesn't snap forward (or fire instantly)
         * the moment control returns to the player.
         */
        private roamingPauseStartedAt = 0;
        /** While `time.now < playerInvulnUntil` the player can't be hit by a roaming Lost Echo (post-hit grace). */
        private playerInvulnUntil = 0;
        /** Milliseconds of sprint remaining this burst (refills after cooldown when R released). */
        private sprintFuelMs = SPRINT_FUEL_MAX_MS;
        /** Scene time (ms) until sprint can drain/refuel again. */
        private sprintCooldownUntil = 0;
        /** Throttle overlap_auto combat retriggers without pinning encounters behind session latch. */
        private combatEncounterCooldownUntil = new Map<string, number>();
        private lostEchoIdleLoadFailed = false;
        private lastAuthoringDepthLogAt = 0;
        // ── Oracle Altar Zone ─────────────────────────────────────────────────
        /** True while the player is inside any oracle_altar_zone proximity rect. */
        private playerInOracleAltarZone = false;
        /** Scene.time timestamp when the player entered the altar zone (for reminder delay). */
        private oracleAltarZoneEnteredAt = 0;
        /** Prevents the reminder text from firing more than once per zone visit. */
        private oracleAltarReminderShown = false;
        /** World-space text hint shown after ~5 s in zone: "Press Space to open the Scroll here." */
        private oracleAltarReminderText?: Phaser.GameObjects.Text;
        // ─────────────────────────────────────────────────────────────────────

        /** Static Oracle statue image sprites, keyed by interactable_id. */
        private oracleStatueSprites = new Map<string, Phaser.GameObjects.Image>();
        /** Current glow outer-strength on oracle statues (tweened during buildup). */
        private oracleGlowStrength = ORACLE_GLOW_IDLE;
        /** Running glow tween for oracle buildup (cancelled on return). */
        private oracleGlowTween?: Phaser.Tweens.Tween;
        /** JRPG-style knowledge battle layer (fixed to camera; exploration map stays mounted underneath). */
        private knowledgeBattlePaused = false;
        private knowledgeBattleInteractableId: string | null = null;
        private knowledgeBattleBackdrop?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
        private knowledgeBattleFog?: Phaser.GameObjects.Rectangle;
        private knowledgeBattleTraveler?: Phaser.GameObjects.Sprite;
        private knowledgeBattleEnemy?: Phaser.GameObjects.Sprite;
        private knowledgeBattleRipple?: Phaser.GameObjects.Arc;
        private knowledgeBattleDbgTravelerRect?: Phaser.GameObjects.Rectangle;
        private knowledgeBattleDbgTravelerLabel?: Phaser.GameObjects.Text;
        private knowledgeBattleDbgEnemyRect?: Phaser.GameObjects.Rectangle;
        private knowledgeBattleDbgEnemyLabel?: Phaser.GameObjects.Text;
        private jrpgLayoutPoint = new Phaser.Math.Vector2();
        private jrpgTweenStart = new Phaser.Math.Vector2();
        private jrpgTweenDest = new Phaser.Math.Vector2();
        /** Throttle `[LhLostEchoDiag] … combat_encounter_cooldown` spam while standing in overlap. */
        private lostEchoCooldownDiagLogUntil = new Map<string, number>();
        private knowledgeBattleCameraWasFollowing = false;
        /** Tile layers + dimmed props during JRPG battle (alpha snapshot restored on exit). */
        private jrpgExplorationDimTargets: Phaser.GameObjects.GameObject[] = [];
        private jrpgExplorationDimSnapshot: Array<{ t: Phaser.GameObjects.GameObject; alpha: number }> = [];
        private jrpgExplorationDimActive = false;
        /**
         * After a won JRPG knowledge battle, hide world Lost Echo while stage is still `demo_combat_trial_available`.
         * Cleared whenever guidance leaves that stage so stale session state cannot strand the encounter.
         */
        private lostEchoTrialVictoryHideIds = new Set<string>();
        /** DEV: log `demo_guidance.stage_id` when it changes (Lost Echo visibility is gated on this). */
        private lastLostEchoStageLogged?: string;
        private lostEchoDemoInteractableId: string | null = null;
        private lostEchoDiagDeepNextAt = 0;
        private lostEchoDebugMarkerRect?: Phaser.GameObjects.Rectangle;
        private lostEchoDebugMarkerText?: Phaser.GameObjects.Text;
        /**
         * After guild enter tween + React opens Guild Info / Atlas, wait for atlas close before exit walk.
         * If React rejects the trigger, `lh:phaser-guild-research-abort` restores `preEnter`.
         */
        private guildResearchPendingExit: null | {
          interactableId: string;
          hit: TriggerRect;
          preEnter: { x: number; y: number; alpha: number; scale: number };
        } = null;
        private facing: TravelerDirection = 'down';
        // ─── VFX ────────────────────────────────────────────────────────────
        /** Unsubscribe fn returned by subscribeToPhaserVfx — called on scene shutdown. */
        private _vfxUnsub?: () => void;
        // ─── Campfire animation ──────────────────────────────────────────────
        /** Animated fire sprites placed at campfire node world positions. */
        private campfireFireSprites: Phaser.GameObjects.Sprite[] = [];
        /** Reused for trigger overlap tests (Tiled top-left x,y + size — matches parser / React). */
        private scratchPlayerGeom = new Phaser.Geom.Rectangle(0, 0, 0, 0);
        private scratchTriggerGeom = new Phaser.Geom.Rectangle(0, 0, 0, 0);
        private bodyBoundsScratch: Phaser.Types.Physics.Arcade.ArcadeBodyBounds = {
          x: 0,
          y: 0,
          right: 0,
          bottom: 0,
        };

        /** Foot / collision hitbox — matches what tile colliders use (sprite bounds can be much taller). */
        private getPlayerBodyGeomRect(out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          const b = body.getBounds(this.bodyBoundsScratch);
          return out.setTo(b.x, b.y, b.right - b.x, b.bottom - b.y);
        }

        private triggerMetaToGeom(m: TriggerRect, out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
          return out.setTo(m.x, m.y, m.w, m.h);
        }

        private interactionGeomForMeta(m: TriggerRect, out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
          return this.triggerMetaToGeom(m, out);
        }

        private playTravelerAnimation(
          kind: 'idle' | 'walk' | 'run' | 'attack' | 'attack2' | 'cast' | 'hurt',
          dir: TravelerDirection,
          restart = false,
        ): boolean {
          let keyKind = kind;
          if (kind === 'attack2' && !this.anims.exists(`lh_traveler_attack2_${dir}`)) {
            keyKind = 'attack';
          }
          const key = `lh_traveler_${keyKind}_${dir}`;
          const idleKey = `lh_traveler_idle_${dir}`;
          if (!restart && this.player.anims.currentAnim?.key === key && this.player.anims.isPlaying) return true;
          const r = safeSpriteAnimPlay(this, this.player, key, {
            ignoreIfPlaying: !restart,
            fallbackKey: idleKey,
          });
          return Boolean(r.playedKey);
        }

        private takeAlternateTravelerStrike(): TravelerStrikeAnimKind {
          const k = this.nextTravelerStrikeIsSecondary ? 'attack2' : 'attack';
          this.nextTravelerStrikeIsSecondary = !this.nextTravelerStrikeIsSecondary;
          return k;
        }

        private playTravelerOneShot(kind: TravelerStrikeAnimKind | 'cast' | 'hurt', durationMs: number): boolean {
          this.player.setVelocity(0, 0);
          this.player.anims.timeScale = 1;
          // Clear any stale crop/tint before swing (attack textures are the same 32×80 strip layout as idle).
          if (kind === 'attack' || kind === 'attack2') {
            this.player.setCrop();
            this.player.clearTint();
          }
          if (!this.playTravelerAnimation(kind, this.facing, true)) return false;
          this.attackingUntil = this.time.now + durationMs;
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            this.player.off(Phaser.Animations.Events.ANIMATION_COMPLETE, finish);
            this.attackingUntil = 0;
            this.player.setCrop();
            this.player.setOrigin(0.5, 1);
            this.playTravelerAnimation('idle', this.facing, true);
          };
          this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish);
          this.time.delayedCall(travelerAttackSafetyFinishMs(kind, durationMs), finish);
          return true;
        }

        // ───────────────────────── Roaming hack-and-slash Lost Echoes ─────────────────────────

        /**
         * Forward AABB representing the player's A-button swing reach. Used to test which roaming
         * Lost Echoes are inside the swing this frame. Centred on the player and extended along facing.
         */
        private playerAttackHitRect(out: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
          const px = this.player.x;
          // Dot: default center origin. Traveler: feet at `player.y` — bias further up to the torso.
          const py = this.player.y - (this.explorationPlayerTraveler ? 28 : 18);
          const half = PLAYER_ATTACK_WIDTH_PX / 2;
          const reach = PLAYER_ATTACK_RANGE_PX;
          let x = px - half;
          let y = py - half;
          let w = PLAYER_ATTACK_WIDTH_PX;
          let h = PLAYER_ATTACK_WIDTH_PX;
          switch (this.facing) {
            case 'down':
              x = px - half; y = py; w = PLAYER_ATTACK_WIDTH_PX; h = reach; break;
            case 'up':
              x = px - half; y = py - reach; w = PLAYER_ATTACK_WIDTH_PX; h = reach; break;
            case 'right':
              x = px; y = py - half; w = reach; h = PLAYER_ATTACK_WIDTH_PX; break;
            case 'left':
              x = px - reach; y = py - half; w = reach; h = PLAYER_ATTACK_WIDTH_PX; break;
          }
          out.setTo(x, y, w, h);
          return out;
        }

        /**
         * Spawn roaming Lost Echoes from Tiled-authored spawn markers.
         *
         * Each `ParsedLhRoamingLostEchoSpawn` contributes `count` roamers (default 1) anchored at the
         * marker's center. When `count > 1`, additional roamers are jittered inside `wander_radius_px`
         * around that center so they don't pile up on a single tile. Spawn positions are clamped to
         * the playable world bounds and skip any markers whose coords land outside the world entirely.
         *
         * Per-spawn property overrides (`hp`, speeds, radii, cooldown) are resolved into a
         * `RoamingLostEchoConfig` once and stored on the roamer — the AI tick reads from that config
         * exclusively, so each marker can be tuned independently without touching code.
         */
        private spawnRoamingLostEchoes(
          spawns: ParsedLhRoamingLostEchoSpawn[],
          solidLayers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer>,
          worldW: number,
          worldH: number,
        ): void {
          if (!this.textures.exists(LOST_ECHO_IDLE_KEY) || this.lostEchoIdleLoadFailed) {
            if (import.meta.env.DEV) {
              console.info('[LhScene] Skipping roaming Lost Echo spawn — idle texture unavailable');
            }
            return;
          }
          if (spawns.length === 0) return;
          // Defensive: spawn requires the player + statics groups to exist already so colliders can wire up.
          if (!this.player?.active || !this.fogStatics || !this.solidStatics) {
            if (import.meta.env.DEV) {
              console.warn('[LhScene] Skipping roaming Lost Echo spawn — scene not ready (player/statics missing)');
            }
            return;
          }
          // Hard cap is also enforced in the parser, but belt + suspenders in case future code
          // synthesises spawns directly (e.g. the DEV hardcoded fallback path).
          const SCENE_ROAMER_HARD_CAP = 64;

          const dev = import.meta.env.DEV;
          // Per-roamer info logs are useful while authoring but can flood the console on large maps.
          // Gate behind the existing quest-debug flag; the spawn-pass summary still fires under DEV.
          const verboseLog = dev && import.meta.env.VITE_LH_QUEST_DEBUG === 'true';
          const minX = 32;
          const minY = 32;
          const maxX = Math.max(minX + 1, worldW - 32);
          const maxY = Math.max(minY + 1, worldH - 32);
          let nextRoamerIndex = this.roamingLostEchoes.length;
          const newSprites: Phaser.Physics.Arcade.Sprite[] = [];
          let spawnedCount = 0;

          spawns.forEach((spawn) => {
            // Per-spawn alias warning: surfaces the precedence rule (canonical wins) without
            // crashing — authors can clean up at their leisure.
            if (dev && spawn.ignored_aliases.length > 0) {
              console.warn('[LhScene] Roaming Lost Echo spawn ignored alias property — canonical form took precedence', {
                tiled_object_id: spawn.tiled_object_id,
                debug_label: spawn.debug_label ?? null,
                ignored: spawn.ignored_aliases,
              });
            }

            const { config, overrides } = resolveRoamingLostEchoConfig(spawn);
            const cx = spawn.center_x;
            const cy = spawn.center_y;
            // Reject spawns that sit fully outside the playable area — clamping a wildly-off-map
            // marker would silently teleport every roamer to the world edge, which is worse than
            // skipping with a clear DEV log.
            if (cx < -1024 || cx > worldW + 1024 || cy < -1024 || cy > worldH + 1024) {
              if (dev) {
                console.warn('[LhScene] Roaming Lost Echo spawn outside world — skipping', {
                  tiled_object_id: spawn.tiled_object_id,
                  debug_label: spawn.debug_label ?? null,
                  center: { x: cx, y: cy },
                  world: { w: worldW, h: worldH },
                });
              }
              return;
            }

            // Per-marker jitter radius so count > 1 doesn't pile every roamer on one pixel.
            const jitter = Math.min(config.wanderRadiusPx, 96);
            const safeCount = Math.max(0, Math.floor(spawn.count));
            for (let i = 0; i < safeCount; i++) {
              if (this.roamingLostEchoes.length >= SCENE_ROAMER_HARD_CAP) {
                if (dev) {
                  console.warn('[LhScene] Roaming Lost Echo scene cap reached — skipping remaining roamers from this marker', {
                    cap: SCENE_ROAMER_HARD_CAP,
                    tiled_object_id: spawn.tiled_object_id,
                  });
                }
                break;
              }
              let originX = cx;
              let originY = cy;
              if (i > 0 && jitter > 0) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * jitter;
                originX = cx + Math.cos(angle) * radius;
                originY = cy + Math.sin(angle) * radius;
              }
              const x = Phaser.Math.Clamp(originX, minX, maxX);
              const y = Phaser.Math.Clamp(originY, minY, maxY);

              const sprite = this.physics.add.sprite(x, y, LOST_ECHO_IDLE_KEY);
              sprite.setOrigin(0.5, 1);
              sprite.setScale(ROAMING_LOST_ECHO_SCALE);
              sprite.setDepth(y);
              const shadow = EXPLORATION_PROCEDURAL_SHADOWS_ENABLED
                ? this.add
                    .ellipse(x, y, 14, 4, EXPLORATION_SHADOW_COLOR, EXPLORATION_CONTACT_SHADOW_ALPHA)
                    .setDepth(y - 0.04)
                : null;
              // Tight body around the feet so collisions feel grounded and the wide sprite frame
              // (192×128) doesn't snag on terrain it visually clears.
              sprite.setSize(28, 18);
              sprite.setOffset((LOST_ECHO_FRAME.width - 28) / 2, LOST_ECHO_FRAME.height - 26);
              sprite.setCollideWorldBounds(true);
              sprite.setDamping(false);
              sprite.setDrag(0, 0);
              if (this.anims.exists(LOST_ECHO_IDLE_ANIM_KEY)) {
                sprite.play(LOST_ECHO_IDLE_ANIM_KEY);
              }
              this.physics.add.collider(sprite, this.fogStatics);
              this.physics.add.collider(sprite, this.solidStatics);
              for (const layer of solidLayers) this.physics.add.collider(sprite, layer);

              nextRoamerIndex += 1;
              const roamer: RoamingLostEcho = {
                id: `roaming_lost_echo_${spawn.tiled_object_id}_${i + 1}`,
                sprite,
                hp: config.hp,
                state: 'wander',
                homeX: x,
                homeY: y,
                wanderTargetX: null,
                wanderTargetY: null,
                nextWanderDecisionAt: 0,
                attackReadyAt: 0,
                hurtUntil: 0,
                attackResolveAt: 0,
                attackPending: false,
                config,
                spawn_group: spawn.spawn_group,
                debug_label: spawn.debug_label,
                respawn: spawn.respawn,
                source_tiled_object_id: spawn.tiled_object_id,
              };
              if (shadow) this.lostEchoShadows.set(roamer.id, shadow);
              this.roamingLostEchoes.push(roamer);
              newSprites.push(sprite);
              spawnedCount += 1;

              if (verboseLog) {
                console.info('[LhScene] Roaming Lost Echo spawned', {
                  index: nextRoamerIndex,
                  id: roamer.id,
                  origin: { x: Math.round(x), y: Math.round(y) },
                  spawn_group: spawn.spawn_group ?? null,
                  debug_label: spawn.debug_label ?? null,
                  source_tiled_object_id: spawn.tiled_object_id,
                  overrides: overrides.length ? overrides : 'defaults',
                });
              }
            }
          });

          if (newSprites.length > 1) this.physics.add.collider(newSprites, newSprites);
          if (newSprites.length > 0) {
            this.physics.add.collider(this.player, newSprites, undefined, undefined, this);
          }

          if (dev) {
            // Group totals by spawn_group (with `(none)` for ungrouped) so authors can verify
            // their wave/encounter authoring at a glance.
            const groupTotals: Record<string, number> = {};
            for (const r of this.roamingLostEchoes) {
              const key = r.spawn_group ?? '(none)';
              groupTotals[key] = (groupTotals[key] ?? 0) + 1;
            }
            console.info('[LhScene] Roaming Lost Echo spawn pass complete', {
              parsed_spawn_markers: spawns.length,
              roamers_added_this_pass: spawnedCount,
              roamers_total: this.roamingLostEchoes.length,
              by_spawn_group: groupTotals,
            });
          }
        }

        /** Should the roaming AI tick this frame? Combat / handoff / pause should freeze them. */
        private roamingAiActive(): boolean {
          if (this.knowledgeBattlePaused) return false;
          if (this.maiaHandoffPaused) return false;
          if (this.triggerTransitionLocked) return false;
          if (_dialogueNpcId.current) return false; // freeze enemies while any NPC dialogue is open
          return true;
        }

        /** Per-frame tick for every roaming Lost Echo. Called from the scene's `update()`. */
        private updateRoamingLostEchoes(now: number): void {
          if (this.roamingLostEchoes.length === 0) {
            // Stale pause marker can't apply to anyone — clear so it doesn't carry into a future spawn.
            this.roamingPauseStartedAt = 0;
            return;
          }
          if (!this.roamingAiActive()) {
            if (this.roamingPauseStartedAt === 0) this.roamingPauseStartedAt = now;
            // Freeze in place but keep the sprite alive so we resume cleanly when control returns.
            for (const r of this.roamingLostEchoes) {
              if (r.state === 'dead') continue;
              const body = r.sprite.body as Phaser.Physics.Arcade.Body | null;
              if (!r.sprite.active || !body?.enable) continue;
              r.sprite.setVelocity(0, 0);
            }
            return;
          }

          // Carry pending timers across any pause window so a roamer in mid-windup doesn't
          // resolve its attack the instant the player unpauses (and so wander replans stay
          // on the cadence the AI expected before the pause).
          if (this.roamingPauseStartedAt > 0) {
            const pauseDelta = Math.max(0, now - this.roamingPauseStartedAt);
            this.roamingPauseStartedAt = 0;
            if (pauseDelta > 0) {
              for (const r of this.roamingLostEchoes) {
                if (r.state === 'dead') continue;
                if (r.attackResolveAt > 0) r.attackResolveAt += pauseDelta;
                if (r.attackReadyAt > 0) r.attackReadyAt += pauseDelta;
                if (r.nextWanderDecisionAt > 0) r.nextWanderDecisionAt += pauseDelta;
                if (r.hurtUntil > 0) r.hurtUntil += pauseDelta;
              }
              if (this.playerInvulnUntil > 0) this.playerInvulnUntil += pauseDelta;
            }
          }

          const px = this.player.x;
          const py = this.player.y;

          for (const r of this.roamingLostEchoes) {
            if (r.state === 'dead' || !r.sprite.active || !r.sprite.scene) continue;
            const body = r.sprite.body as Phaser.Physics.Arcade.Body | null;
            if (!body?.enable) continue;

            const dx = px - r.sprite.x;
            const dy = py - r.sprite.y;
            const dist = Math.hypot(dx, dy);

            // Hurt lock blocks all decisions; the hurt animation completes uninterrupted.
            if (now < r.hurtUntil) {
              r.sprite.setVelocity(0, 0);
              continue;
            }

            // Resolve an in-progress attack windup (damage tick lands at the end of the swing).
            if (r.attackPending && now >= r.attackResolveAt) {
              r.attackPending = false;
              if (dist <= r.config.attackRangePx + 8) {
                this.applyRoamingHitToPlayer(r);
              }
            }

            const aggroed =
              dist <= r.config.aggroRadiusPx ||
              (r.state === 'chase' && dist <= r.config.deaggroRadiusPx);

            if (!aggroed) {
              // Wander around home. Pick a new local target periodically.
              if (
                r.wanderTargetX == null ||
                r.wanderTargetY == null ||
                now >= r.nextWanderDecisionAt ||
                Math.hypot(r.wanderTargetX - r.sprite.x, r.wanderTargetY - r.sprite.y) < 8
              ) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * r.config.wanderRadiusPx;
                r.wanderTargetX = r.homeX + Math.cos(angle) * radius;
                r.wanderTargetY = r.homeY + Math.sin(angle) * radius;
                r.nextWanderDecisionAt = now + ROAMING_LOST_ECHO_WANDER_REPLAN_MS;
              }
              const wdx = r.wanderTargetX - r.sprite.x;
              const wdy = r.wanderTargetY - r.sprite.y;
              const wlen = Math.hypot(wdx, wdy);
              if (wlen > 4) {
                r.sprite.setVelocity((wdx / wlen) * r.config.wanderSpeed, (wdy / wlen) * r.config.wanderSpeed);
                r.sprite.flipX = wdx < 0;
                if (r.state !== 'wander') r.state = 'wander';
                if (this.anims.exists('lh_lost_echo_run') && r.sprite.anims.currentAnim?.key !== 'lh_lost_echo_run') {
                  r.sprite.play('lh_lost_echo_run');
                }
              } else {
                r.sprite.setVelocity(0, 0);
                if (this.anims.exists(LOST_ECHO_IDLE_ANIM_KEY) && r.sprite.anims.currentAnim?.key !== LOST_ECHO_IDLE_ANIM_KEY) {
                  r.sprite.play(LOST_ECHO_IDLE_ANIM_KEY);
                }
              }
              continue;
            }

            // In aggro radius — face the player and either close in or swing.
            r.sprite.flipX = dx < 0;

            if (dist <= r.config.attackRangePx) {
              r.sprite.setVelocity(0, 0);
              if (now >= r.attackReadyAt && !r.attackPending) {
                r.state = 'attack';
                r.attackPending = true;
                r.attackResolveAt = now + ROAMING_LOST_ECHO_ATTACK_WINDUP_MS;
                r.attackReadyAt = now + r.config.attackCooldownMs;
                const swingKey = Math.random() < 0.5 ? 'lh_lost_echo_attack' : 'lh_lost_echo_attack2';
                if (this.anims.exists(swingKey)) {
                  r.sprite.play(swingKey);
                }
                // Claw SFX fires at the single attack-commit transition (`!attackPending → true`),
                // so one swing produces exactly one sound. Multiple roamers swinging in the same
                // tick still each play (no group key); a tiny 30 ms guard de-dupes any same-frame
                // double dispatch from the AI tick.
                playLhLostEchoSwingSfx();
              } else if (this.anims.exists(LOST_ECHO_IDLE_ANIM_KEY) && !r.attackPending && r.sprite.anims.currentAnim?.key !== LOST_ECHO_IDLE_ANIM_KEY) {
                r.sprite.play(LOST_ECHO_IDLE_ANIM_KEY);
              }
            } else {
              // Chase
              r.state = 'chase';
              const len = Math.max(0.001, dist);
              r.sprite.setVelocity((dx / len) * r.config.chaseSpeed, (dy / len) * r.config.chaseSpeed);
              if (this.anims.exists('lh_lost_echo_run') && r.sprite.anims.currentAnim?.key !== 'lh_lost_echo_run') {
                r.sprite.play('lh_lost_echo_run');
              }
            }
          }
        }

        /** Damage every roaming Lost Echo whose body sits inside the player's swing AABB. Returns hit count. */
        private resolvePlayerSwingAgainstRoamers(): number {
          if (this.roamingLostEchoes.length === 0) return 0;
          const swing = this.playerAttackHitRect(this.scratchPlayerGeom);
          let hits = 0;
          for (const r of this.roamingLostEchoes) {
            if (r.state === 'dead' || !r.sprite.active) continue;
            const echoRect = new Phaser.Geom.Rectangle(
              r.sprite.x - 18,
              r.sprite.y - 36,
              36,
              40,
            );
            if (Phaser.Geom.Intersects.RectangleToRectangle(swing, echoRect)) {
              this.applyHitToRoamer(r);
              hits++;
            }
          }
          if (hits > 0) this.cameras.main.shake(80, 0.0035);
          return hits;
        }

        private applyHitToRoamer(r: RoamingLostEcho): void {
          if (r.state === 'dead') return;
          if (!r.sprite?.active || !r.sprite.scene) return;
          r.hp = Math.max(0, r.hp - 1);
          r.sprite.setTint(0xfff1a8);
          this.time.delayedCall(90, () => {
            if (r.sprite?.active) r.sprite.clearTint();
          });
          const impact = this.add
            .circle(r.sprite.x, r.sprite.y - 22, 7, 0xfbbf24, 0.58)
            .setDepth(r.sprite.depth + 0.2);
          this.tweens.add({
            targets: impact,
            alpha: 0,
            scale: 1.8,
            duration: 180,
            ease: 'Quad.easeOut',
            onComplete: () => impact.destroy(),
          });
          // Cancel any pending swing — getting hit interrupts the windup.
          r.attackPending = false;
          // Clear the resolve marker too so the carry-across-pause logic doesn't bump a stale
          // timer forward and accidentally re-arm the swing on the next active tick.
          r.attackResolveAt = 0;
          // Knock back away from the player.
          const dx = r.sprite.x - this.player.x;
          const dy = r.sprite.y - this.player.y;
          const len = Math.max(0.001, Math.hypot(dx, dy));
          this.tweens.add({
            targets: r.sprite,
            x: r.sprite.x + (dx / len) * ROAMING_LOST_ECHO_KNOCKBACK_PX,
            y: r.sprite.y + (dy / len) * ROAMING_LOST_ECHO_KNOCKBACK_PX,
            duration: 140,
            ease: 'Quad.easeOut',
          });

          if (r.hp <= 0) {
            r.state = 'dead';
            r.sprite.setVelocity(0, 0);
            const body = r.sprite.body as Phaser.Physics.Arcade.Body | null;
            if (body) body.enable = false;
            if (this.anims.exists('lh_lost_echo_death')) {
              r.sprite.play('lh_lost_echo_death');
            }
            // MQ-103 quest completion bridge: count down tutorial echoes.
            if (r.spawn_group === 'mq_103' && this.mq103EchoesRemaining > 0) {
              this.mq103EchoesRemaining -= 1;
              if (this.mq103EchoesRemaining <= 0) {
                window.dispatchEvent(new CustomEvent('lh:mq103-echoes-cleared'));
              }
            }
            this.tweens.add({
              targets: r.sprite,
              alpha: 0,
              duration: ROAMING_LOST_ECHO_DEATH_FADE_MS,
              ease: 'Sine.easeIn',
              onComplete: () => {
                // Phaser can fire onComplete after the scene was torn down (HMR / route change /
                // game.destroy(true)). Guard against operating on a sprite whose owning scene is
                // already gone, otherwise `destroy()` and `splice()` race scene cleanup.
                if (!r.sprite || !r.sprite.scene || !this.scene || !this.sys?.isActive?.()) {
                  return;
                }
                try {
                  this.lostEchoShadows.get(r.id)?.destroy();
                  this.lostEchoShadows.delete(r.id);
                  r.sprite.destroy();
                } catch {
                  // Already destroyed elsewhere — ignore.
                }
                // Drop the dead entry so the array doesn't grow during long sessions.
                const idx = this.roamingLostEchoes.indexOf(r);
                if (idx !== -1) this.roamingLostEchoes.splice(idx, 1);
                if (import.meta.env.DEV) {
                  console.info('[LhScene] Roaming Lost Echo despawned after death', {
                    id: r.id,
                    source_tiled_object_id: r.source_tiled_object_id,
                    remaining: this.roamingLostEchoes.length,
                  });
                }
              },
            });
            return;
          }

          r.state = 'hurt';
          r.hurtUntil = this.time.now + ROAMING_LOST_ECHO_HURT_LOCK_MS;
          if (this.anims.exists('lh_lost_echo_hurt')) {
            r.sprite.play('lh_lost_echo_hurt');
          }
        }

        /** Roaming Lost Echo lands a hit on the player. Plays hurt anim, brief invuln, slight knockback. */
        private applyRoamingHitToPlayer(r: RoamingLostEcho): void {
          if (this.time.now < this.playerInvulnUntil) return;
          if (!this.player?.active || !this.player.scene) return;
          if (!r.sprite?.active || !r.sprite.scene) return;
          this.playerInvulnUntil = this.time.now + PLAYER_INVULN_AFTER_HIT_MS;
          this.cameras.main.shake(140, 0.0055);

          // Knockback away from the echo.
          const dx = this.player.x - r.sprite.x;
          const dy = this.player.y - r.sprite.y;
          const len = Math.max(0.001, Math.hypot(dx, dy));
          this.tweens.add({
            targets: this.player,
            x: this.player.x + (dx / len) * PLAYER_KNOCKBACK_PX,
            y: this.player.y + (dy / len) * PLAYER_KNOCKBACK_PX,
            duration: 160,
            ease: 'Quad.easeOut',
          });

          this.playTravelerOneShot('hurt', 380);
          this.player.setTint(0xfca5a5);
          this.time.delayedCall(120, () => {
            if (this.player?.active) this.player.clearTint();
          });

          // Subtle invuln flash so the grace window is visible.
          this.tweens.add({
            targets: this.player,
            alpha: { from: 0.45, to: 1 },
            duration: 140,
            yoyo: true,
            repeat: 2,
          });
        }

        private applyExplorationBattleDim(active: boolean): void {
          if (!active) {
            for (const row of this.jrpgExplorationDimSnapshot) {
              if (!row.t.active) continue;
              const o = row.t as unknown as { setAlpha?: (a: number) => void };
              if (typeof o.setAlpha === 'function') o.setAlpha(row.alpha);
            }
            this.jrpgExplorationDimSnapshot = [];
            this.jrpgExplorationDimActive = false;
            return;
          }
          if (this.jrpgExplorationDimActive) this.applyExplorationBattleDim(false);
          this.jrpgExplorationDimActive = true;
          const extras: Phaser.GameObjects.GameObject[] = [
            this.player,
            ...this.fogStatics.getChildren(),
            ...Array.from(this.portalSprites.values()),
            ...Array.from(this.masterScribeSprites.values()),
          ];
          const seen = new Set<Phaser.GameObjects.GameObject>();
          const candidates = [...this.jrpgExplorationDimTargets, ...extras];
          for (const o of candidates) {
            if (!o?.active || seen.has(o)) continue;
            seen.add(o);
            const alphaGet = o as Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.GameObject;
            if (typeof alphaGet.setAlpha !== 'function') continue;
            this.jrpgExplorationDimSnapshot.push({ t: o, alpha: alphaGet.alpha });
            alphaGet.setAlpha(alphaGet.alpha * 0.26);
          }
        }

        /**
         * Hold idle while the React dialogue box covers the view; run the expressive talk strip once after dismiss.
         */
        private playMasterScribeByDialogueState(): void {
          const dialogueOpen = _dialogueNpcId.current === MASTER_SCRIBE_NPC_ID;

          if (dialogueOpen) {
            this.masterScribeDialogueWasOpen = true;
            this.masterScribeSprites.forEach((sprite) => {
              if (!sprite.visible || !sprite.active) return;
              if (
                this.anims.exists(MASTER_SCRIBE_IDLE_ANIM_KEY) &&
                sprite.anims.currentAnim?.key !== MASTER_SCRIBE_IDLE_ANIM_KEY
              ) {
                sprite.play(MASTER_SCRIBE_IDLE_ANIM_KEY, true);
              }
            });
            return;
          }

          if (this.masterScribeDialogueWasOpen) {
            this.masterScribeDialogueWasOpen = false;
            this.masterScribeSprites.forEach((sprite) => {
              if (!sprite.visible || !sprite.active) return;
              if (!this.anims.exists(MASTER_SCRIBE_TALK_ANIM_KEY)) return;
              sprite.play({ key: MASTER_SCRIBE_TALK_ANIM_KEY, repeat: 0 });
            });
            return;
          }

          this.masterScribeSprites.forEach((sprite) => {
            if (!sprite.visible || !sprite.active) return;
            const cur = sprite.anims.currentAnim?.key;
            if (cur === MASTER_SCRIBE_TALK_ANIM_KEY && sprite.anims.isPlaying) return;
            // Looping idle — never call play() again; restarting causes visible blinks on repeat boundaries.
            if (cur === MASTER_SCRIBE_IDLE_ANIM_KEY) return;
            // Post-talk (repeat:0 finished): Phaser leaves key=talk, isPlaying=false — transition once.
            if (cur === MASTER_SCRIBE_TALK_ANIM_KEY && !sprite.anims.isPlaying) {
              if (this.anims.exists(MASTER_SCRIBE_IDLE_ANIM_KEY)) sprite.play(MASTER_SCRIBE_IDLE_ANIM_KEY);
              return;
            }
            if (this.anims.exists(MASTER_SCRIBE_IDLE_ANIM_KEY)) sprite.play(MASTER_SCRIBE_IDLE_ANIM_KEY);
          });
        }

        private playLostEchoAnimation(interactableId: string, key: string, hideOnComplete = false): void {
          const sprite = this.lostEchoSprites.get(interactableId);
          if (!sprite || !sprite.visible) return;
          const played = safeSpriteAnimPlay(this, sprite, key, {
            ignoreIfPlaying: false,
            fallbackKey: LOST_ECHO_IDLE_ANIM_KEY,
          });
          if (!played.playedKey && hideOnComplete) {
            sprite.setVisible(false);
            return;
          }
          if (hideOnComplete) {
            let hid = false;
            const hide = () => {
              if (hid) return;
              hid = true;
              sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, hide);
              sprite.setVisible(false);
            };
            if (played.ok && played.playedKey === key) {
              sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, hide);
              this.time.delayedCall(2400, hide);
            } else {
              this.time.delayedCall(520, hide);
            }
          } else if (key !== LOST_ECHO_IDLE_ANIM_KEY && key !== 'lh_lost_echo_run' && played.ok && played.playedKey === key) {
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              if (sprite.visible) {
                safeSpriteAnimPlay(this, sprite, LOST_ECHO_IDLE_ANIM_KEY, { ignoreIfPlaying: false });
              }
            });
          }
        }

        /** Spawns 4 standard roaming Lost Echoes near the player for the MQ-103 combat tutorial. */
        private handleMq103SpawnEchoes = () => {
          if (!this.player?.active) return;
          const px = this.player.x;
          const py = this.player.y;
          const { width: worldW, height: worldH } = this.physics.world.bounds;
          const offsets = [
            { dx: -180, dy: -160 },
            { dx:  180, dy: -140 },
            { dx:  -60, dy:  180 },
            { dx:  160, dy:  140 },
          ];
          const spawns: ParsedLhRoamingLostEchoSpawn[] = offsets.map((o, i) => ({
            tiled_object_id: -(9000 + i),
            name: `mq103_echo_${i + 1}`,
            layer_name: 'mq103_spawn',
            bounds: { x: px + o.dx, y: py + o.dy, width: 0, height: 0 },
            center_x: px + o.dx,
            center_y: py + o.dy,
            count: 1,
            respawn: false,
            spawn_group: 'mq_103',
            debug_label: `mq103_echo_${i + 1}`,
            ignored_aliases: [],
          }));
          this.mq103EchoesRemaining = 4;
          this.spawnRoamingLostEchoes(spawns, this.solidLayersRef, worldW, worldH);
          if (import.meta.env.DEV) {
            console.info('[LhScene] MQ-103: 4 roaming Lost Echoes spawned near the Scribe camp');
          }
        };

        /** Spawns a stationary Knowledge Echo near the player for the mq-105 tutorial. Player must press Enter to engage. */
        private handleMq105SpawnEcho = () => {
          if (!this.player?.active) return;

          // Clear any previous echo sprite or fallback marker.
          if (this.mq105EchoSprite) {
            this.mq105EchoSprite.destroy();
            this.mq105EchoSprite = null;
          }
          if (this.mq105EchoFallbackMarker) {
            this.mq105EchoFallbackMarker.destroy();
            this.mq105EchoFallbackMarker = null;
          }
          this.mq105EchoActive = false;

          // Spawn 3–4 tiles (200px) to the right of the player at the same height.
          // This keeps the echo clearly visible on screen and requires the player to walk to it.
          // Input bleed guard: suppress Enter interaction for 700ms so the key that dismissed
          // the Scribe dialogue doesn't immediately fire the combat overlay.
          this.mq105EchoX = this.player.x + 200;
          this.mq105EchoY = this.player.y;
          this.mq105EchoInteractableAfter = this.time.now + 700;

          // BUG FIX: check texture key (LOST_ECHO_IDLE_KEY), NOT the animation key.
          // LOST_ECHO_IDLE_ANIM_KEY is the Phaser.Anims key, not the loaded texture name.
          const textureExists = this.textures.exists(LOST_ECHO_IDLE_KEY);
          if (textureExists) {
            this.mq105EchoSprite = this.add.sprite(this.mq105EchoX, this.mq105EchoY, LOST_ECHO_IDLE_KEY);
            this.mq105EchoSprite.setDepth(100);
            this.mq105EchoSprite.setAlpha(0);
            // Purple tint distinguishes this Knowledge Echo from the mq-103 combat echoes.
            this.mq105EchoSprite.setTint(0xc084fc);
            this.tweens.add({
              targets: this.mq105EchoSprite,
              alpha: 0.92,
              duration: 800,
              ease: 'Sine.easeIn',
              onComplete: () => { this.mq105EchoActive = true; },
            });
            if (this.anims.exists(LOST_ECHO_IDLE_ANIM_KEY)) {
              this.mq105EchoSprite.play(LOST_ECHO_IDLE_ANIM_KEY);
            }
          } else {
            // Fallback: visible purple "?" marker so the player can find and interact with the echo
            // even when the sprite sheet hasn't loaded.
            console.warn('[LH_MQ105] Lost Echo idle texture not found — using fallback marker', {
              x: this.mq105EchoX,
              y: this.mq105EchoY,
              textureKey: LOST_ECHO_IDLE_KEY,
            });
            this.mq105EchoFallbackMarker = this.add
              .text(this.mq105EchoX, this.mq105EchoY, '?', {
                fontFamily: 'Georgia, serif',
                fontSize: '32px',
                color: '#e879f9',
                backgroundColor: '#3b0764dd',
                padding: { x: 12, y: 6 },
              })
              .setOrigin(0.5)
              .setDepth(100)
              .setAlpha(0);
            this.tweens.add({
              targets: this.mq105EchoFallbackMarker,
              alpha: 1,
              duration: 600,
              ease: 'Sine.easeIn',
              onComplete: () => { this.mq105EchoActive = true; },
            });
          }

          // Required debug marker (always logs, not DEV-only, so it appears in live runs).
          console.log('[LH_MQ105] Knowledge Echo spawned', { x: this.mq105EchoX, y: this.mq105EchoY });
        };

        private handleKnowledgeBattlePresentation = (ev: Event) => {
          const detail = (ev as CustomEvent<LhKnowledgeBattlePresentationDetail>).detail;
          if (!detail) return;
          if (detail.action === 'enter') {
            this.enterKnowledgeBattlePresentation(detail.interactableId, detail.enemyTemplateId);
            return;
          }
          if (detail.action === 'exit') {
            try {
              this.exitKnowledgeBattlePresentation(Boolean(detail.victory));
            } catch (err) {
              jrpgBattleAnimLog('exitKnowledgeBattlePresentation threw', {
                message: err instanceof Error ? err.message : String(err),
              });
              this.destroyKnowledgeBattlePresentation();
              this.knowledgeBattlePaused = false;
              this.knowledgeBattleInteractableId = null;
              this.applyExplorationBattleDim(false);
              if (this.knowledgeBattleCameraWasFollowing) {
                this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, EXPLORATION_CAMERA_FOLLOW_OFFSET_Y);
              }
              this.knowledgeBattleCameraWasFollowing = false;
            }
          }
        };

        private handleKnowledgeBattleResize = () => {
          if (this.knowledgeBattlePaused) this.layoutKnowledgeBattlePresentation();
        };

        private destroyKnowledgeBattlePresentation(): void {
          this.knowledgeBattleRipple?.destroy(true);
          this.knowledgeBattleDbgTravelerLabel?.destroy(true);
          this.knowledgeBattleDbgTravelerRect?.destroy(true);
          this.knowledgeBattleDbgEnemyLabel?.destroy(true);
          this.knowledgeBattleDbgEnemyRect?.destroy(true);
          this.knowledgeBattleBackdrop?.destroy(true);
          this.knowledgeBattleFog?.destroy(true);
          this.knowledgeBattleTraveler?.destroy(true);
          this.knowledgeBattleEnemy?.destroy(true);
          this.knowledgeBattleRipple = undefined;
          this.knowledgeBattleDbgTravelerLabel = undefined;
          this.knowledgeBattleDbgTravelerRect = undefined;
          this.knowledgeBattleDbgEnemyLabel = undefined;
          this.knowledgeBattleDbgEnemyRect = undefined;
          this.knowledgeBattleBackdrop = undefined;
          this.knowledgeBattleFog = undefined;
          this.knowledgeBattleTraveler = undefined;
          this.knowledgeBattleEnemy = undefined;
        }

        private layoutKnowledgeBattlePresentation(): void {
          if (!this.knowledgeBattleBackdrop || !this.knowledgeBattleFog) return;
          const cam = this.cameras.main;
          const w = cam.width;
          const h = cam.height;
          const p = this.jrpgLayoutPoint;

          layoutBackdropToCameraViewport(cam, w, h, this.knowledgeBattleBackdrop);

          cam.getWorldPoint(w * JRPG_BATTLE_VP.fog.x, h * JRPG_BATTLE_VP.fog.y, p);
          this.knowledgeBattleFog.setPosition(p.x, p.y);
          this.knowledgeBattleFog.setSize(w * 1.06, h * 0.46);
          this.knowledgeBattleFog.setScrollFactor(1, 1);

          if (this.knowledgeBattleTraveler) {
            cam.getWorldPoint(w * JRPG_BATTLE_VP.traveler.x, h * JRPG_BATTLE_VP.traveler.y, p);
            this.knowledgeBattleTraveler.setScrollFactor(1, 1);
            this.knowledgeBattleTraveler.setPosition(p.x, p.y);
          }
          if (this.knowledgeBattleEnemy) {
            cam.getWorldPoint(w * JRPG_BATTLE_VP.enemy.x, h * JRPG_BATTLE_VP.enemy.y, p);
            this.knowledgeBattleEnemy.setScrollFactor(1, 1);
            this.knowledgeBattleEnemy.setPosition(p.x, p.y);
          }
          if (this.knowledgeBattleRipple) {
            cam.getWorldPoint(w * JRPG_BATTLE_VP.ripple.x, h * JRPG_BATTLE_VP.ripple.y, p);
            this.knowledgeBattleRipple.setScrollFactor(1, 1);
            this.knowledgeBattleRipple.setPosition(p.x, p.y);
          }

          if (SHOW_JRPG_BATTLE_DEBUG_MARKERS) {
            if (this.knowledgeBattleDbgTravelerRect) {
              cam.getWorldPoint(w * JRPG_BATTLE_VP.traveler.x, h * JRPG_BATTLE_VP.traveler.y, p);
              this.knowledgeBattleDbgTravelerRect.setScrollFactor(1, 1);
              this.knowledgeBattleDbgTravelerRect.setPosition(p.x, p.y);
              this.knowledgeBattleDbgTravelerLabel?.setScrollFactor(1, 1);
              this.knowledgeBattleDbgTravelerLabel?.setPosition(p.x, p.y - 100);
            }
            if (this.knowledgeBattleDbgEnemyRect) {
              cam.getWorldPoint(w * JRPG_BATTLE_VP.enemy.x, h * JRPG_BATTLE_VP.enemy.y, p);
              this.knowledgeBattleDbgEnemyRect.setScrollFactor(1, 1);
              this.knowledgeBattleDbgEnemyRect.setPosition(p.x, p.y);
              this.knowledgeBattleDbgEnemyLabel?.setScrollFactor(1, 1);
              this.knowledgeBattleDbgEnemyLabel?.setPosition(p.x, p.y - 100);
            }
          }
        }

        private applyJrpgBattleSpriteVisDefaults(sprite: Phaser.GameObjects.Sprite | undefined): void {
          if (!sprite?.active) return;
          sprite.clearTint();
          sprite.setVisible(true);
          sprite.setAlpha(1);
          sprite.setScrollFactor(1, 1);
          try {
            sprite.setFrame(0);
          } catch {
            // ignore
          }
          if (sprite.displayWidth < 6 || sprite.displayHeight < 6) {
            sprite.setScale(Math.max(sprite.scaleX, 3.2), Math.max(sprite.scaleY, 3.2));
          }
        }

        private enterKnowledgeBattlePresentation(interactableId: string, enemyTemplateId?: string): void {
          if (this.knowledgeBattlePaused && this.knowledgeBattleInteractableId === interactableId) return;

          this.destroyKnowledgeBattlePresentation();
          registerLostEchoAnimsIfNeeded(this);
          logLostEchoBattleAnimAudit(this, 'enterKnowledgeBattlePresentation');

          this.knowledgeBattlePaused = true;
          this.knowledgeBattleInteractableId = interactableId;

          const worldEcho = this.lostEchoSprites.get(interactableId);
          if (worldEcho) worldEcho.setAlpha(0);
          this.lostEchoFallbackMarkers.get(interactableId)?.setAlpha(0);

          this.applyExplorationBattleDim(true);

          this.knowledgeBattleCameraWasFollowing = true;
          this.cameras.main.stopFollow();
          this.cameras.main.flash(140, 26, 38, 62, true);

          const cam = this.cameras.main;
          const w = cam.width;
          const h = cam.height;

          // Pin battle props to the **current camera view** in world space (scrollFactor 1 + getWorldPoint).
          // Small x/y with scrollFactor 0 kept actors near world origin while the camera was on the map → invisible.
          const battleBgKey = JRPG_BATTLE_BG_KEY;
          const bgUrl = publicAssetUrl(JRPG_BATTLE_BG_PATH);
          const textureReady = this.textures.exists(battleBgKey);

          let backdrop: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
          if (textureReady) {
            backdrop = this.add
              .image(0, 0, battleBgKey)
              .setDepth(JRPG_BATTLE_DEPTH_BACKDROP)
              .setAlpha(0.9);
            jrpgBattleBackdropDevLog('battle_backdrop_created', {
              mode: 'image',
              key: battleBgKey,
              usingFallbackRectangle: false,
            });
          } else {
            backdrop = this.add
              .rectangle(0, 0, Math.max(w, 8), Math.max(h, 8), 0x040814, 0.88)
              .setDepth(JRPG_BATTLE_DEPTH_BACKDROP);
            jrpgBattleBackdropDevLog('battle_backdrop_created', {
              mode: 'fallback_rectangle',
              key: battleBgKey,
              usingFallbackRectangle: true,
              reason: 'texture_missing_at_battle_enter',
              url: bgUrl,
            });
            // Preload can fail (404, etc.): retry load and swap rectangle → image when ready (same battle).
            const swapInBattleBg = () => {
              if (!this.knowledgeBattlePaused || !this.textures.exists(battleBgKey)) {
                jrpgBattleBackdropDevLog('late_load_complete_no_swap', {
                  battleActive: this.knowledgeBattlePaused,
                  textureExists: this.textures.exists(battleBgKey),
                });
                return;
              }
              const prev = this.knowledgeBattleBackdrop;
              if (!prev || !prev.active) return;
              const img = this.add
                .image(0, 0, battleBgKey)
                .setDepth(JRPG_BATTLE_DEPTH_BACKDROP)
                .setAlpha(0.9);
              prev.destroy(true);
              this.knowledgeBattleBackdrop = img;
              this.layoutKnowledgeBattlePresentation();
              jrpgBattleBackdropDevLog('battle_backdrop_swapped_to_image', { key: battleBgKey });
            };
            this.load.once(Phaser.Loader.Events.COMPLETE, swapInBattleBg);
            this.load.image(battleBgKey, bgUrl);
            jrpgBattleBackdropDevLog('late_load_started', { key: battleBgKey, url: bgUrl });
            this.load.start();
          }
          const fog = this.add
            .rectangle(0, 0, Math.max(w * 1.08, 8), Math.max(h * 0.5, 8), 0x6b8cce, 0.12)
            .setDepth(JRPG_BATTLE_DEPTH_FOG)
            .setBlendMode(Phaser.BlendModes.ADD);

          const travelerSheet = this.textures.exists('lh_traveler_idle_right')
            ? 'lh_traveler_idle_right'
            : this.textures.exists('lh_traveler_idle_down')
              ? 'lh_traveler_idle_down'
              : 'lh_player_dot';
          const traveler = this.add.sprite(0, 0, travelerSheet).setDepth(JRPG_BATTLE_DEPTH_TRAVELER);
          traveler.setScale(travelerSheet === 'lh_player_dot' ? 3.6 : 2.42);
          traveler.setOrigin(0.5, 0.88);
          traveler.setVisible(true);
          traveler.setAlpha(1);

          let enemy: Phaser.GameObjects.Sprite | undefined;
          const template = enemyTemplateId ?? 'lost_echo';
          if (template === 'lost_echo' && this.textures.exists(LOST_ECHO_IDLE_KEY)) {
            enemy = this.add.sprite(0, 0, LOST_ECHO_IDLE_KEY).setDepth(JRPG_BATTLE_DEPTH_ENEMY);
            enemy.setScale(1.62);
            enemy.setOrigin(0.5, 0.88);
            enemy.setFlipX(true);
            enemy.setVisible(true);
            enemy.setAlpha(1);
          }

          if (SHOW_JRPG_BATTLE_DEBUG_MARKERS) {
            const dbgW = 128;
            const dbgH = 168;
            this.knowledgeBattleDbgTravelerRect = this.add
              .rectangle(0, 0, dbgW, dbgH, 0x22c55e, 0.09)
              .setStrokeStyle(1, 0x4ade80, 0.45)
              .setOrigin(0.5, 0.88)
              .setDepth(JRPG_BATTLE_DEPTH_DBG_TRAVELER);
            this.knowledgeBattleDbgTravelerLabel = this.add
              .text(0, 0, 'TRAV', {
                fontFamily: 'system-ui, Segoe UI, sans-serif',
                fontSize: '10px',
                color: 'rgba(220, 252, 231, 0.92)',
                backgroundColor: 'rgba(20, 83, 45, 0.42)',
                padding: { x: 5, y: 2 },
              })
              .setOrigin(0.5, 1)
              .setDepth(JRPG_BATTLE_DEPTH_DBG_TRAVELER + 1);
            this.knowledgeBattleDbgEnemyRect = this.add
              .rectangle(0, 0, dbgW, dbgH, 0xa855f7, 0.09)
              .setStrokeStyle(1, 0xc084fc, 0.45)
              .setOrigin(0.5, 0.88)
              .setDepth(JRPG_BATTLE_DEPTH_DBG_ENEMY);
            this.knowledgeBattleDbgEnemyLabel = this.add
              .text(0, 0, 'ECHO', {
                fontFamily: 'system-ui, Segoe UI, sans-serif',
                fontSize: '10px',
                color: 'rgba(243, 232, 255, 0.92)',
                backgroundColor: 'rgba(88, 28, 135, 0.42)',
                padding: { x: 5, y: 2 },
              })
              .setOrigin(0.5, 1)
              .setDepth(JRPG_BATTLE_DEPTH_DBG_ENEMY + 1);
          }

          const ripple = this.add.circle(0, 0, 42, 0xcfdfff, 0.16).setDepth(JRPG_BATTLE_DEPTH_RIPPLE);
          ripple.setBlendMode(Phaser.BlendModes.ADD);
          ripple.setScale(0.15);
          this.tweens.add({
            targets: ripple,
            scale: 4.5,
            alpha: 0,
            duration: 520,
            ease: 'Sine.easeOut',
          });

          this.knowledgeBattleBackdrop = backdrop;
          this.knowledgeBattleFog = fog;
          this.knowledgeBattleTraveler = traveler;
          this.knowledgeBattleEnemy = enemy;
          this.knowledgeBattleRipple = ripple;
          if (travelerSheet !== 'lh_player_dot') {
            attachTravelerWideStripHandlers(traveler, 0.88);
          }

          this.layoutKnowledgeBattlePresentation();
          if (import.meta.env.DEV) {
            const bd = this.knowledgeBattleBackdrop;
            if (bd) {
              jrpgBattleBackdropDevLog('battle_backdrop_laid_out', {
                kind: bd instanceof Phaser.GameObjects.Image ? 'image' : 'rectangle',
                depth: bd.depth,
                fogDepth: this.knowledgeBattleFog?.depth,
                travelerDepth: traveler.depth,
                width: bd instanceof Phaser.GameObjects.Image ? bd.displayWidth : bd.width,
                height: bd instanceof Phaser.GameObjects.Image ? bd.displayHeight : bd.height,
              });
            }
          }

          this.applyJrpgBattleSpriteVisDefaults(traveler);
          if (enemy) this.applyJrpgBattleSpriteVisDefaults(enemy);
          try {
            traveler.setFrame(0);
          } catch {
            // ignore
          }
          if (enemy) {
            try {
              enemy.setFrame(0);
            } catch {
              // ignore
            }
          }
          this.playBattleTravelerIdle();
          if (enemy) {
            safeSpriteAnimPlay(this, enemy, LOST_ECHO_IDLE_ANIM_KEY, { ignoreIfPlaying: false });
            const battleEnemy = enemy;
            const startW = this.jrpgTweenStart;
            const destW = this.jrpgTweenDest;
            cam.getWorldPoint(w * JRPG_BATTLE_VP.enemyRunFrom.x, h * JRPG_BATTLE_VP.enemyRunFrom.y, startW);
            cam.getWorldPoint(w * JRPG_BATTLE_VP.enemy.x, h * JRPG_BATTLE_VP.enemy.y, destW);
            battleEnemy.setPosition(startW.x, startW.y);
            this.tweens.add({
              targets: battleEnemy,
              x: destW.x,
              y: destW.y,
              duration: 440,
              ease: 'Cubic.easeOut',
              onStart: () => {
                safeSpriteAnimPlay(this, battleEnemy, 'lh_lost_echo_run', {
                  ignoreIfPlaying: false,
                  fallbackKey: LOST_ECHO_IDLE_ANIM_KEY,
                });
              },
              onComplete: () => {
                if (!battleEnemy.active) return;
                safeSpriteAnimPlay(this, battleEnemy, LOST_ECHO_IDLE_ANIM_KEY, { ignoreIfPlaying: false });
              },
            });
          }

          logJrpgBattleActorLayout(this, 'after-enter', traveler, enemy);
        }

        private exitKnowledgeBattlePresentation(victory: boolean): void {
          const id = this.knowledgeBattleInteractableId;
          this.destroyKnowledgeBattlePresentation();
          this.knowledgeBattlePaused = false;
          this.knowledgeBattleInteractableId = null;

          if (id) {
            if (victory) {
              this.lostEchoTrialVictoryHideIds.add(id);
            } else {
              this.lostEchoTrialVictoryHideIds.delete(id);
              const worldEcho = this.lostEchoSprites.get(id);
              worldEcho?.setAlpha(1);
              if (worldEcho) {
                safeSpriteAnimPlay(this, worldEcho, LOST_ECHO_IDLE_ANIM_KEY, { ignoreIfPlaying: false });
              }
              this.lostEchoFallbackMarkers.get(id)?.setAlpha(1);
            }
          }

          this.applyExplorationBattleDim(false);

          if (this.knowledgeBattleCameraWasFollowing) {
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, EXPLORATION_CAMERA_FOLLOW_OFFSET_Y);
          }
          this.knowledgeBattleCameraWasFollowing = false;

          // Movement/facing are frozen during knowledgeBattlePaused; restore a neutral exploration pose.
          this.facing = 'down';
          if (this.textures.exists('lh_traveler_idle_down')) {
            this.playTravelerAnimation('idle', 'down', true);
          }
        }

        private battleTravelerFacing(): TravelerDirection {
          return 'right';
        }

        private playBattleTravelerIdle(): void {
          const spr = this.knowledgeBattleTraveler;
          if (!spr) return;
          spr.setOrigin(0.5, 0.88);
          const dir = this.battleTravelerFacing();
          const key = `lh_traveler_idle_${dir}`;
          safeSpriteAnimPlay(this, spr, key, {
            ignoreIfPlaying: true,
            fallbackKey: 'lh_traveler_idle_down',
          });
        }

        private playBattleTravelerAnimation(
          kind: 'idle' | 'attack' | 'attack2' | 'cast' | 'hurt',
          restart = false,
        ): boolean {
          const spr = this.knowledgeBattleTraveler;
          if (!spr) return false;
          const dir = this.battleTravelerFacing();
          let kindUsed = kind;
          if (kind === 'attack2' && !this.anims.exists(`lh_traveler_attack2_${dir}`)) {
            kindUsed = 'attack';
          }
          const key = `lh_traveler_${kindUsed}_${dir}`;
          const idleKey = `lh_traveler_idle_${dir}`;
          if (!restart && spr.anims.currentAnim?.key === key && spr.anims.isPlaying) return true;
          const r = safeSpriteAnimPlay(this, spr, key, {
            ignoreIfPlaying: !restart,
            fallbackKey: idleKey,
          });
          return Boolean(r.playedKey);
        }

        private playBattleTravelerOneShot(kind: TravelerStrikeAnimKind | 'cast' | 'hurt', durationMs: number): boolean {
          const spr = this.knowledgeBattleTraveler;
          if (!spr) return false;
          spr.anims.timeScale = 1;
          if (!this.playBattleTravelerAnimation(kind, true)) return false;
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            spr.off(Phaser.Animations.Events.ANIMATION_COMPLETE, finish);
            this.playBattleTravelerIdle();
          };
          spr.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish);
          this.time.delayedCall(travelerAttackSafetyFinishMs(kind, durationMs), finish);
          return true;
        }

        private playBattleLostEchoAnimation(key: string, hideOnComplete = false): void {
          const sprite = this.knowledgeBattleEnemy;
          if (!sprite || !sprite.active) return;
          const played = safeSpriteAnimPlay(this, sprite, key, {
            ignoreIfPlaying: false,
            fallbackKey: LOST_ECHO_IDLE_ANIM_KEY,
          });
          if (hideOnComplete) {
            let hid = false;
            const hide = () => {
              if (hid) return;
              hid = true;
              sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, hide);
              sprite.setVisible(false);
            };
            if (played.ok && played.playedKey === key) {
              sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, hide);
              this.time.delayedCall(2600, hide);
            } else {
              jrpgBattleAnimLog('battle Lost Echo hide without death anim', { requested: key, played: played.playedKey });
              this.time.delayedCall(720, hide);
            }
            return;
          }
          if (
            key !== LOST_ECHO_IDLE_ANIM_KEY &&
            key !== 'lh_lost_echo_run' &&
            played.ok &&
            played.playedKey === key
          ) {
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              if (sprite.visible) {
                safeSpriteAnimPlay(this, sprite, LOST_ECHO_IDLE_ANIM_KEY, { ignoreIfPlaying: false });
              }
            });
          }
        }

        private jrpgBattleBuffCelebrationPulse(): void {
          const spr = this.knowledgeBattleTraveler;
          if (!spr?.active) return;
          const sx = spr.scaleX;
          const sy = spr.scaleY;
          this.tweens.add({
            targets: spr,
            scaleX: sx * 1.06,
            scaleY: sy * 1.06,
            duration: 260,
            ease: 'Sine.easeOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              spr.setScale(sx, sy);
            },
          });
        }

        private routeKnowledgeCombatVisualToBattle(detail: LhKnowledgeCombatVisualDetail): void {
          switch (detail.phase) {
            case 'start':
              if (this.knowledgeBattleEnemy) {
                safeSpriteAnimPlay(this, this.knowledgeBattleEnemy, 'lh_lost_echo_run', {
                  ignoreIfPlaying: false,
                  fallbackKey: LOST_ECHO_IDLE_ANIM_KEY,
                });
              }
              break;
            case 'wrong':
              playLhLostEchoSwingSfx();
              this.playBattleLostEchoAnimation('lh_lost_echo_attack2');
              this.playBattleTravelerOneShot('hurt', 520);
              break;
            case 'correct':
              playLhTravelerSwingSfx();
              this.playBattleLostEchoAnimation('lh_lost_echo_hurt');
              this.playBattleTravelerOneShot(this.takeAlternateTravelerStrike(), 620);
              break;
            case 'victory':
              this.playBattleLostEchoAnimation('lh_lost_echo_death', true);
              break;
            case 'buff':
              this.playBattleTravelerOneShot('cast', 900);
              this.jrpgBattleBuffCelebrationPulse();
              break;
            case 'retreat':
              this.playBattleLostEchoAnimation(LOST_ECHO_IDLE_ANIM_KEY);
              break;
            default:
              break;
          }
        }

        private isKnowledgeBattleRouting(interactableId: string): boolean {
          return this.knowledgeBattlePaused && this.knowledgeBattleInteractableId === interactableId;
        }

        private isGuildResearchCooling(interactableId: string): boolean {
          return (this.guildResearchCooldownUntil.get(interactableId) ?? 0) > this.time.now;
        }

        private triggerVisualSource(hit: TriggerRect): 'tiled' | 'synthetic' {
          return hit.layer_name === 'demo_synthetic_guidance' ? 'synthetic' : 'tiled';
        }

        private addMasterScribeFallbackMarker(hit: TriggerRect) {
          const marker = this.add
            .text(hit.x + hit.w / 2, hit.y + hit.h / 2, 'S', {
              fontFamily: 'Georgia, serif',
              fontSize: '18px',
              color: '#fbbf24',
              backgroundColor: '#1c1917dd',
              padding: { x: 7, y: 3 },
            })
            .setOrigin(0.5)
            .setDepth(hit.y + hit.h / 2);
          marker.setStroke('#78350f', 3);
        }

        private addLostEchoFallbackMarker(hit: TriggerRect) {
          const marker = this.add
            .text(hit.x + hit.w / 2, hit.y + hit.h / 2, '!', {
              fontFamily: 'Georgia, serif',
              fontSize: '18px',
              color: '#fecaca',
              backgroundColor: '#450a0add',
              padding: { x: 8, y: 3 },
            })
            .setOrigin(0.5)
            .setDepth(hit.y + hit.h / 2);
          marker.setStroke('#111827', 3);
          marker.setVisible(!_kcBeaten.current);
          this.lostEchoFallbackMarkers.set(hit.interactable_id, marker);
          if (LOST_ECHO_DEEP_DIAG && typeof console !== 'undefined') {
            console.info('[LhLostEchoDiag] Fallback marker created (idle sheet missing or load failed)', {
              interactable_id: hit.interactable_id,
              xy: { x: marker.x, y: marker.y },
              visible: marker.visible,
              alpha: marker.alpha,
              depth: marker.depth,
            });
          }
        }

        private addMasterScribeVisual(hit: TriggerRect) {
          const source = this.triggerVisualSource(hit);
          if (!this.textures.exists(MASTER_SCRIBE_IDLE_KEY)) {
            this.addMasterScribeFallbackMarker(hit);
            if (import.meta.env.DEV) {
              console.info('[LhScene] Master Scribe visual fallback marker', {
                source,
                interactable_id: hit.interactable_id,
              });
            }
            return;
          }
          const sprite = this.add.sprite(hit.x + hit.w / 2, hit.y + hit.h / 2, MASTER_SCRIBE_IDLE_KEY);
          sprite.setOrigin(0.5, 1);
          sprite.setScale(0.62);
          sprite.setDepth(sprite.y);
          if (this.anims.exists(MASTER_SCRIBE_IDLE_ANIM_KEY)) {
            sprite.play(MASTER_SCRIBE_IDLE_ANIM_KEY);
          }
          this.masterScribeSprites.set(hit.interactable_id, sprite);
          if (import.meta.env.DEV) {
            console.info('[LhScene] Master Scribe visual sprite created', {
              source,
              interactable_id: hit.interactable_id,
              bounds: { x: hit.x, y: hit.y, w: hit.w, h: hit.h },
            });
          }
        }

        private addLostEchoVisual(hit: TriggerRect) {
          const source = this.triggerVisualSource(hit);
          if (!this.textures.exists(LOST_ECHO_IDLE_KEY) || this.lostEchoIdleLoadFailed) {
            this.addLostEchoFallbackMarker(hit);
            if (import.meta.env.DEV) {
              console.info('[LhScene] Lost Echo visual fallback marker', {
                source,
                interactable_id: hit.interactable_id,
                loadFailed: this.lostEchoIdleLoadFailed,
              });
            }
            return;
          }
          const sprite = this.add.sprite(hit.x + hit.w / 2, hit.y + hit.h / 2, LOST_ECHO_IDLE_KEY);
          sprite.setOrigin(0.5, 1);
          sprite.setScale(0.62);
          sprite.setDepth(sprite.y);
          if (this.anims.exists(LOST_ECHO_IDLE_ANIM_KEY)) {
            sprite.play(LOST_ECHO_IDLE_ANIM_KEY);
          }
          sprite.setVisible(!_completionById.current.get(hit.interactable_id));
          this.lostEchoSprites.set(hit.interactable_id, sprite);
          if (import.meta.env.DEV || import.meta.env.VITE_LH_QUEST_DEBUG === 'true') {
            console.info('[LhScene] Lost Echo visual sprite created', {
              source,
              interactable_id: hit.interactable_id,
              bounds: { x: hit.x, y: hit.y, w: hit.w, h: hit.h },
              kc_beaten: _kcBeaten.current,
              hotspot_completed: Boolean(_completionById.current.get(hit.interactable_id)),
            });
          }
          if (LOST_ECHO_DEEP_DIAG && typeof console !== 'undefined') {
            console.info('[LhLostEchoDiag] World Lost Echo sprite created', {
              interactable_id: hit.interactable_id,
              xy: { x: sprite.x, y: sprite.y },
              visible: sprite.visible,
              alpha: sprite.alpha,
              depth: sprite.depth,
              texture_exists: this.textures.exists(LOST_ECHO_IDLE_KEY),
            });
          }
        }

        /** Place a static golden-statue glow-effect sprite at the oracle trigger zone center. */
        private addOracleStatueVisual(hit: TriggerRect): void {
          if (!this.textures.exists(ORACLE_STATUE_KEY)) {
            if (import.meta.env.DEV) {
              console.info('[LhScene] Oracle statue texture missing — skipping visual', hit.interactable_id);
            }
            return;
          }
          // Place at center of the trigger zone (oracle tiles are centered in the ellipse).
          const img = this.add.image(hit.x + hit.w / 2, hit.y + hit.h / 2, ORACLE_STATUE_KEY);
          img.setOrigin(0.5, 0.5);
          img.setDepth(img.y);
          img.setTint(ORACLE_GLOW_COLOR);
          this.oracleStatueSprites.set(hit.interactable_id, img);
        }

        /**
         * Task 2 — Oracle buildup sequence.
         * Plays: glow ramp 2→6, chromatic aberration flash, vignette clamp, brief camera shake,
         * fade to black overlay; calls `onComplete` when the overlay reaches full opacity.
         * Uses only Phaser tweens — no setTimeout.
         */
        private playOracleBuildupAndTransition(onComplete: () => void): void {
          const cam = this.cameras.main;

          // Stop movement.
          this.triggerTransitionLocked = true;
          if (this.player?.active) {
            this.player.setVelocity(0, 0);
            this.player.anims.stop();
          }

          // 1. Ramp oracle statue glow 2 → 6 over 800 ms.
          this.oracleGlowTween?.stop();
          const glowProxy = { v: ORACLE_GLOW_IDLE };
          this.oracleGlowTween = this.tweens.add({
            targets: glowProxy,
            v: ORACLE_GLOW_BUILDUP_PEAK,
            duration: 800,
            ease: 'Sine.easeIn',
            onUpdate: () => {
              this.oracleGlowStrength = glowProxy.v;
            },
          });

          // 2. Camera shake at 600 ms.
          this.time.delayedCall(600, () => {
            if (!this.sys?.isActive?.()) return;
            cam.shake(280, 0.007);
          });

          // 3. Full-screen black overlay that fades in; fire onComplete when opaque.
          const overlay = this.add
            .rectangle(0, 0, cam.width * 4, cam.height * 4, 0x000000, 0)
            .setDepth(50000)
            .setScrollFactor(1, 1);
          // Place at camera centre.
          const cx = cam.scrollX + cam.width / 2;
          const cy = cam.scrollY + cam.height / 2;
          overlay.setPosition(cx, cy);

          this.tweens.add({
            targets: overlay,
            alpha: 1,
            delay: 700,
            duration: 500,
            ease: 'Sine.easeIn',
            onComplete: () => {
              if (!this.sys?.isActive?.()) return;
              onComplete();
              // Auto-destroy overlay so it doesn't block the React UI layer.
              this.time.delayedCall(200, () => overlay.destroy(true));
            },
          });
        }

        /**
         * Task 2 — Oracle return transition.
         * Fades back in from black after the prophecy reveal closes.
         */
        private playOracleReturnTransition(): void {
          const cam = this.cameras.main;
          this.triggerTransitionLocked = false;

          // Ramp glow back to idle.
          this.oracleGlowTween?.stop();
          const glowProxy = { v: this.oracleGlowStrength };
          this.oracleGlowTween = this.tweens.add({
            targets: glowProxy,
            v: ORACLE_GLOW_IDLE,
            duration: 600,
            ease: 'Sine.easeOut',
            onUpdate: () => {
              this.oracleGlowStrength = glowProxy.v;
            },
          });

          // Fade from black (brief flash).
          cam.flash(420, 0, 0, 0, true);
        }

        private handleOracleBuildupStart = () => {
          this.playOracleBuildupAndTransition(() => {
            // Signal React the Phaser fade is done so the Oracle module can open.
            window.dispatchEvent(new CustomEvent('lh:oracle-phaser-fade-done'));
          });
        };

        private handleOracleReturnTransition = () => {
          this.playOracleReturnTransition();
        };

        // React fires this when Space was intercepted in the altar zone but the Oracle sequence
        // is not eligible (mq-201 not active, or already complete) — pass through to normal Scroll.
        private handleOracleAltarPassthrough = () => {
          onPauseRef.current?.();
        };

        /**
         * Toggle Phaser keyboard global capture based on whether a React overlay is open.
         * When an overlay is open (module document, scroll reveal, oracle cinematic, etc.),
         * Phaser should NOT call preventDefault on keyboard events — every key must reach
         * HTML text fields normally. When the overlay closes, restore capture so gameplay
         * controls (arrows, space, WASD) are handled by Phaser again.
         *
         * Implementation: input ownership / focus routing, NOT global key suppression.
         * The Phaser scene still receives key events via its own handlers; it simply stops
         * intercepting them at the DOM level while an overlay owns the keyboard.
         */
        private handleOverlayKeyboardBlock = (e: Event) => {
          const block = (e as CustomEvent<{ block: boolean }>).detail?.block ?? false;
          if (block) {
            this.input.keyboard?.disableGlobalCapture();
          } else {
            this.input.keyboard?.enableGlobalCapture();
          }
        };

        private maybeAddTiledShadowHook(
          obj: { x?: number; y?: number; width?: number; height?: number; properties?: TiledPropertyRuntime[]; id?: number; name?: string },
          baseX: number,
          baseY: number,
          authoredW: number,
          authoredH: number,
          layerName: string | undefined,
        ): 'none' | 'missing' | 'added' {
          const kind = tiledPropString(obj.properties, 'lh_shadow');
          if (!kind || kind === 'none') return 'none';
          if (kind === 'contact') {
            if (EXPLORATION_AUTHORING_DEBUG) {
              console.info('[LhAuthoring] lh_shadow=contact reserved for future actor shadow sprites', {
                layer: layerName,
                object_id: obj.id,
                name: obj.name,
              });
            }
            return 'missing';
          }
          const textureKey = SHADOW_TEXTURE_BY_KIND[kind];
          if (!textureKey || !this.textures.exists(textureKey)) {
            if (EXPLORATION_AUTHORING_DEBUG) {
              console.info('[LhAuthoring] shadow asset missing or unmapped', {
                layer: layerName,
                object_id: obj.id,
                name: obj.name,
                lh_shadow: kind,
                textureKey: textureKey ?? null,
              });
            }
            return 'missing';
          }
          const offsetX = tiledPropNumber(obj.properties, 'lh_shadow_offset_x', Math.min(18, authoredW * 0.08));
          const offsetY = tiledPropNumber(obj.properties, 'lh_shadow_offset_y', Math.min(14, authoredH * 0.04));
          const shadow = this.add.image(baseX + offsetX, baseY + offsetY, textureKey);
          shadow.setOrigin(0.5, 1);
          shadow.setAlpha(0.72);
          shadow.setDepth(Math.max(0, baseY - 0.09));
          return 'added';
        }

        private maybeAddTiledLightHook(
          obj: { x?: number; y?: number; width?: number; height?: number; properties?: TiledPropertyRuntime[]; id?: number; name?: string },
          baseX: number,
          baseY: number,
          layerName: string | undefined,
        ): 'none' | 'added' {
          if (!EXPLORATION_LIGHTS_ENABLED) return 'none';
          const kind = tiledPropString(obj.properties, 'lh_light');
          if (!kind || kind === 'none') return 'none';
          if (kind !== 'warm_torch') {
            if (EXPLORATION_AUTHORING_DEBUG) {
              console.info('[LhAuthoring] unsupported lh_light kind', {
                layer: layerName,
                object_id: obj.id,
                name: obj.name,
                lh_light: kind,
              });
            }
            return 'none';
          }
          const radius = Phaser.Math.Clamp(tiledPropNumber(obj.properties, 'lh_light_radius_px', 72), 24, 180);
          const flicker = tiledPropString(obj.properties, 'lh_light_flicker') !== 'false';
          const light = this.add.circle(baseX, baseY - radius * 0.25, radius, 0xfbbf24, 0.1);
          light.setDepth(Math.max(0, baseY - 0.12));
          light.setBlendMode(EXPLORATION_ADDITIVE_LIGHTS_ENABLED ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
          if (flicker) {
            this.tweens.add({
              targets: light,
              alpha: { from: 0.075, to: 0.13 },
              scale: { from: 0.96, to: 1.04 },
              duration: 900 + Math.floor(Math.random() * 420),
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
          return 'added';
        }

        private registerWindmillBakedTileAnimations(
          map: Phaser.Tilemaps.Tilemap,
          layers: Phaser.Tilemaps.TilemapLayer[],
        ): void {
          const baked = map.getTileset(WINDMILL_BAKED_TILESET_NAME);
          if (!baked) {
            console.warn(
              `[LhScene] Windmill animation skipped: tileset "${WINDMILL_BAKED_TILESET_NAME}" not found in map. Ensure the tileset is embedded or externally referenced in the Tiled .tmx file.`,
            );
            return;
          }

          const spec = inferWindmillAnimSpec(baked);
          const groupMap = new Map<string, WindmillAnimGroup>();

          for (const layer of layers) {
            if (!layer?.active) continue;
            layer.forEachTile((tile) => {
              if (!tile?.tileset || tile.tileset.name !== WINDMILL_BAKED_TILESET_NAME) return;
              const local = tile.index - spec.firstGid;
              const parsed = parseWindmillLocalIndex(spec, local);
              if (!parsed) return;

              const { animFrame, colInFrame, rowInFrame } = parsed;
              const anchorX = tile.x - colInFrame;
              const anchorY = tile.y - rowInFrame;
              const key = `${layer.name}:${anchorX},${anchorY}`;
              let group = groupMap.get(key);
              if (!group) {
                group = { spec, animFrame, tiles: [] };
                groupMap.set(key, group);
              }
              group.tiles.push({ layer, x: tile.x, y: tile.y, colInFrame, rowInFrame });
            });
          }

          this.windmillAnimGroups = [...groupMap.values()];
          // Always start the timer — it also drives windmillDecorSprites (object-layer
          // windmill sprites from the `structures` layer, populated by addTiledTileObjectDecor
          // which runs immediately after this method in create()).  If there are no
          // tile-layer groups AND no decor sprites, the timer callback is a no-op.
          if (this.windmillAnimTimer) {
            this.windmillAnimTimer.remove(false);
            this.windmillAnimTimer = null;
          }
          this.windmillAnimTimer = this.time.addEvent({
            delay: WINDMILL_FRAME_MS,
            loop: true,
            callback: () => {
              // ── Tile-layer windmill groups (crops layer) ──────────────────────
              for (const group of this.windmillAnimGroups) {
                group.animFrame = (group.animFrame + 1) % group.spec.frameCount;
                for (const t of group.tiles) {
                  if (!t.layer.active) continue;
                  const localId = windmillLocalIndex(
                    group.spec,
                    group.animFrame,
                    t.colInFrame,
                    t.rowInFrame,
                  );
                  t.layer.putTileAt(group.spec.firstGid + localId, t.x, t.y);
                }
              }
              // ── Object-layer windmill decor sprites (structures layer) ────────
              // These are Phaser.GameObjects.Image objects created by addTiledTileObjectDecor.
              // They are static by default (frame never changes), so we drive them here via
              // setFrame() — exactly analogous to putTileAt for the tile-layer groups above.
              if (this.windmillDecorSprites.length > 0) {
                const frameCount = this.windmillDecorSprites[0].spec.frameCount;
                this.windmillDecorAnimFrame = (this.windmillDecorAnimFrame + 1) % frameCount;
                for (const ds of this.windmillDecorSprites) {
                  if (!ds.sprite.active) continue;
                  const localId = windmillLocalIndex(
                    ds.spec,
                    this.windmillDecorAnimFrame,
                    ds.colInFrame,
                    ds.rowInFrame,
                  );
                  const newGid = ds.spec.firstGid + localId;
                  const frameName = `gid_${newGid}`;
                  // Lazily add the frame to the texture atlas if it hasn't been seen before.
                  if (!ds.sprite.texture.has(frameName)) {
                    const cols = ds.spec.sheetCols;
                    const sx = (localId % cols) * ds.tileW;
                    const sy = Math.floor(localId / cols) * ds.tileH;
                    ds.sprite.texture.add(frameName, 0, sx, sy, ds.tileW, ds.tileH);
                  }
                  ds.sprite.setFrame(frameName);
                }
              }
            },
          });

          if (import.meta.env.DEV) {
            console.info('[LhScene] Windmill_baked_anim tileset', {
              tileset_name: spec.tilesetName,
              base_firstgid: spec.firstGid,
              image_width_tiles: spec.imageWidthTiles,
              image_height_tiles: spec.imageHeightTiles,
              sheet_cols: spec.sheetCols,
              sheet_rows: spec.sheetRows,
              frame_width_tiles: spec.frameWidthTiles,
              frame_height_tiles: spec.frameHeightTiles,
              inferred_layout: spec.layout,
              frame_stride_tiles: spec.frameStride,
              frame_count: spec.frameCount,
              windmill_groups: this.windmillAnimGroups.length,
              windmill_tiles: this.windmillAnimGroups.reduce((n, g) => n + g.tiles.length, 0),
            });
          }
        }

        private registerInteractiveCropTiles(map: Phaser.Tilemaps.Tilemap): void {
          this.cropTileRecords = [];
          const cropLayer = map.getLayer('crops')?.tilemapLayer;
          if (!cropLayer) return;

          cropLayer.forEachTile((tile) => {
            if (!tile || tile.index < 0) return;
            const tileset = tile.tileset;
            const tsName = tileset?.name ?? '';
            if (!tsName.startsWith('crops-')) return;
            const worldX = cropLayer.tileToWorldX(tile.x) + map.tileWidth * 0.5;
            const worldY = cropLayer.tileToWorldY(tile.y) + map.tileHeight * 0.85;
            this.cropTileRecords.push({
              layer: cropLayer,
              tileX: tile.x,
              tileY: tile.y,
              tileIndex: tile.index,
              worldX,
              worldY,
              lastRustleAt: 0,
            });
          });

          if (import.meta.env.DEV && this.cropTileRecords.length) {
            console.info('[LhScene] Interactive crop tiles registered', { count: this.cropTileRecords.length });
          }
        }

        private updateReactiveCropTiles(moving: boolean, ix: number, _iy: number, sprinting: boolean): void {
          if (!moving || this.cropTileRecords.length === 0 || !this.player?.active) return;
          const now = this.time.now;
          if (now < this.nextReactiveGrassScanAt) return;

          const footX = this.player.x;
          const footY = this.player.y - 5;
          const radius = REACTIVE_GRASS_RADIUS_PX + (sprinting ? 10 : 0);
          const radiusSq = radius * radius;

          for (const crop of this.cropTileRecords) {
            const dx = crop.worldX - footX;
            const dy = crop.worldY - footY;
            if (dx * dx + dy * dy > radiusSq) continue;
            if (now - crop.lastRustleAt < REACTIVE_GRASS_RUSTLE_COOLDOWN_MS) continue;
            crop.lastRustleAt = now;

            const tile = crop.layer.getTileAt(crop.tileX, crop.tileY);
            if (!tile?.tileset) continue;
            const ts = tile.tileset;
            const flash = this.add
              .image(crop.worldX, crop.worldY, ts.name, tile.index - ts.firstgid)
              .setOrigin(0.5, 0.85)
              .setDepth(crop.worldY + 0.002)
              .setAlpha(0.92);
            this.tweens.add({
              targets: flash,
              angle: (Math.sign(dx || ix || 1) * REACTIVE_GRASS_BEND_DEG) / 2,
              scaleY: 0.82,
              alpha: 0,
              duration: sprinting ? 90 : 110,
              ease: 'Sine.easeOut',
              yoyo: true,
              onComplete: () => flash.destroy(),
            });
          }
        }

        private resolvePlayerSwingAgainstCrops(): number {
          if (this.cropTileRecords.length === 0) return 0;
          const swing = this.playerAttackHitRect(this.scratchPlayerGeom);
          let harvested = 0;
          const remaining: CropTileRecord[] = [];

          for (const crop of this.cropTileRecords) {
            const hitBox = new Phaser.Geom.Rectangle(crop.worldX - 14, crop.worldY - 22, 28, 26);
            if (Phaser.Geom.Intersects.RectangleToRectangle(swing, hitBox)) {
              crop.layer.removeTileAt(crop.tileX, crop.tileY);
              harvested += 1;
              const chaff = this.add
                .ellipse(crop.worldX, crop.worldY - 6, 18, 10, 0xc4a574, 0.55)
                .setDepth(crop.worldY + 0.01);
              this.tweens.add({
                targets: chaff,
                alpha: 0,
                y: chaff.y - 10,
                scaleX: 1.4,
                scaleY: 0.6,
                duration: 280,
                ease: 'Quad.easeOut',
                onComplete: () => chaff.destroy(),
              });
              continue;
            }
            remaining.push(crop);
          }

          this.cropTileRecords = remaining;
          return harvested;
        }

        private addTiledTileObjectDecor(map: Phaser.Tilemaps.Tilemap): void {
          const tileObjectLayers = ((map as unknown as { objects?: TiledObjectLayerRuntime[] }).objects ?? [])
            .filter((layer) => layer.objects?.some((obj) => typeof obj.gid === 'number'));
          if (!tileObjectLayers.length) return;

          this.reactiveGrassDecor = [];
          this.windmillDecorSprites = [];
          const flipMask = 0x80000000 | 0x40000000 | 0x20000000;
          let added = 0;
          let baseSorted = 0;
          let reactiveGrass = 0;
          let shadowHooks = 0;
          let lightHooks = 0;
          const warnedMissingTextures = new Set<string>();

          tileObjectLayers.forEach((layer) => {
            const layerNameLc = (layer.name ?? '').toLowerCase();
            const grassDepthShrink = layerNameLc.includes('grass') ? EXPLORATION_TALL_GRASS_DEPTH_Y_SHRINK_PX : 0;
            if (EXPLORATION_AUTHORING_DEBUG && layerNameLc.includes('grass')) {
              console.info('[LhAuthoring] reactive grass layer detected', { layer: layer.name });
            }
            layer.objects?.forEach((obj) => {
              if (obj.visible === false || typeof obj.gid !== 'number') return;
              const rawGid = obj.gid >>> 0;
              const gid = rawGid & ~flipMask;
              const tileset = map.tilesets
                .filter((ts) => ts.firstgid <= gid)
                .sort((a, b) => b.firstgid - a.firstgid)[0];
              if (!tileset) return;
              const key = tileset.name;
              if (!this.textures.exists(key)) {
                if (import.meta.env.DEV && !warnedMissingTextures.has(key)) {
                  warnedMissingTextures.add(key);
                  console.warn('[LhScene] Tile object skipped - tileset texture not loaded', { layer: layer.name, key });
                }
                return;
              }

              const localId = gid - tileset.firstgid;
              const columns = Math.max(tileset.columns, 1);
              const tileW = tileset.tileWidth || map.tileWidth || 32;
              const tileH = tileset.tileHeight || map.tileHeight || 32;
              const margin = tileset.tileMargin ?? 0;
              const spacing = tileset.tileSpacing ?? 0;
              const sx = margin + (localId % columns) * (tileW + spacing);
              const sy = margin + Math.floor(localId / columns) * (tileH + spacing);
              const frameName = `gid_${gid}`;
              const texture = this.textures.get(key);
              if (!texture.has(frameName)) {
                texture.add(frameName, 0, sx, sy, tileW, tileH);
              }

              const isReactiveGrass = layerNameLc.includes('grass') || layerNameLc.includes('crops');
              const explicitBaseSort = tiledPropString(obj.properties, 'lh_sort') === 'base';
              const isTreeObject = key.toLowerCase().includes('tree') || explicitBaseSort;
              const castsStaticShadow =
                EXPLORATION_PROCEDURAL_SHADOWS_ENABLED &&
                !isReactiveGrass &&
                (isTreeObject ||
                  key.toLowerCase().includes('guild') ||
                  key.toLowerCase().includes('cabin') ||
                  key.toLowerCase().includes('vendor') ||
                  key.toLowerCase().includes('fence'));
              const authoredW = typeof obj.width === 'number' && obj.width > 0 ? obj.width : tileW;
              const authoredH = typeof obj.height === 'number' && obj.height > 0 ? obj.height : tileH;
              const baseX = (obj.x ?? 0) + authoredW / 2;
              const baseY = obj.y ?? 0;
              const spriteX = isReactiveGrass || isTreeObject ? baseX : (obj.x ?? 0);
              const shadowResult = this.maybeAddTiledShadowHook(obj, baseX, baseY, authoredW, authoredH, layer.name);
              if (shadowResult === 'added') shadowHooks += 1;
              const lightResult = this.maybeAddTiledLightHook(obj, baseX, baseY, layer.name);
              if (lightResult === 'added') lightHooks += 1;
              if (castsStaticShadow) {
                this.add
                  .ellipse(
                    baseX + Math.min(18, authoredW * 0.08),
                    baseY + Math.min(14, authoredH * 0.04),
                    Math.max(18, Math.min(86, authoredW * 0.54)),
                    Math.max(7, Math.min(28, authoredH * 0.12)),
                    EXPLORATION_SHADOW_COLOR,
                    EXPLORATION_STATIC_SHADOW_ALPHA,
                  )
                  .setDepth(Math.max(0, baseY - 0.08));
              }
              const sprite = this.add.image(spriteX, obj.y ?? 0, key, frameName);
              sprite.setOrigin(isReactiveGrass || isTreeObject ? 0.5 : 0, 1);
              const sortY = Math.max(0, (obj.y ?? 0) - grassDepthShrink);
              sprite.setDepth(sortY + (isTreeObject ? -0.01 : 0.001));
              if (isTreeObject) baseSorted += 1;
              if (isReactiveGrass) reactiveGrass += 1;
              if (authoredW !== tileW) {
                sprite.displayWidth = authoredW;
              }
              if (authoredH !== tileH) {
                sprite.displayHeight = authoredH;
              }
              if (typeof obj.rotation === 'number' && obj.rotation) {
                sprite.setRotation(Phaser.Math.DegToRad(obj.rotation));
              }
              sprite.setFlipX(Boolean(rawGid & 0x80000000));
              sprite.setFlipY(Boolean(rawGid & 0x40000000));
              if (isReactiveGrass) {
                this.reactiveGrassDecor.push({
                  sprite,
                  homeX: sprite.x,
                  homeY: sprite.y,
                  homeScaleX: sprite.scaleX,
                  homeScaleY: sprite.scaleY,
                  lastRustleAt: 0,
                });
              }
              // Collect windmill object-layer sprites for frame animation by the windmill timer.
              // The structures layer places 44 tile objects using Windmill_baked_anim; without this
              // they remain static (frame never changes). The timer in registerWindmillBakedTileAnimations
              // drives these via setFrame() in sync with the tile-layer windmill tiles.
              if (key === WINDMILL_BAKED_TILESET_NAME) {
                const windmillBaked = map.getTileset(WINDMILL_BAKED_TILESET_NAME);
                if (windmillBaked) {
                  const wSpec = inferWindmillAnimSpec(windmillBaked);
                  const wParsed = parseWindmillLocalIndex(wSpec, localId);
                  if (wParsed) {
                    this.windmillDecorSprites.push({
                      spec: wSpec,
                      sprite,
                      colInFrame: wParsed.colInFrame,
                      rowInFrame: wParsed.rowInFrame,
                      tileW,
                      tileH,
                    });
                  }
                }
              }
              added += 1;
              if (EXPLORATION_AUTHORING_DEBUG) {
                console.info('[LhAuthoring] tile object classification', {
                  layer: layer.name,
                  object_id: obj.id,
                  name: obj.name,
                  tileset: key,
                  visual_only: true,
                  collision: false,
                  grass_reactive: isReactiveGrass,
                  base_sorted: isTreeObject,
                  tree_base_depth: sortY + (isTreeObject ? -0.01 : 0.001),
                  foot_depth_reference: baseY,
                  shadow: tiledPropString(obj.properties, 'lh_shadow') ?? 'none',
                  shadow_result: shadowResult,
                  light: tiledPropString(obj.properties, 'lh_light') ?? 'none',
                  light_result: lightResult,
                });
              }
            });
          });

          if (import.meta.env.DEV) {
            console.info('[LhScene] Tiled tile-object decor rendered', {
              layers: tileObjectLayers.map((layer) => layer.name ?? '(unnamed)'),
              objects: added,
              reactive_grass: this.reactiveGrassDecor.length,
              windmill_decor_sprites: this.windmillDecorSprites.length,
              base_sorted: baseSorted,
              shadow_hooks: shadowHooks,
              light_hooks: lightHooks,
            });

            // Oracle sprite diagnostic: warn if oracle/altar objects exist as geometry
            // (no gid) instead of tile objects (with gid). addTiledTileObjectDecor only
            // renders objects that carry a gid. If the oracle sprite is missing from the
            // world, the map likely has the oracle sprite placed in a tile LAYER or as a
            // non-tile object. Fix: in Tiled, place the sprite as an Object in an Object
            // Layer (Insert → Tile Object), then re-export the map JSON.
            const allObjLayers = (map as unknown as { objects?: TiledObjectLayerRuntime[] }).objects ?? [];
            const oracleGeomObjects = allObjLayers
              .flatMap((l) => l.objects ?? [])
              .filter((o) => {
                const name = (o.name ?? '').toLowerCase();
                const type = (o.type ?? '').toLowerCase();
                return (name.includes('oracle') || name.includes('altar') || type.includes('oracle') || type.includes('altar'))
                  && typeof o.gid !== 'number';
              });
            if (oracleGeomObjects.length > 0) {
              console.warn(
                '[LhScene] Oracle/altar objects found as geometry (no gid) — they will NOT render as sprites. ' +
                'In Tiled: select the oracle sprite, drag it to an Object Layer as a Tile Object (not a tile in a tile layer), then re-export.',
                oracleGeomObjects.map((o) => ({ name: o.name, type: o.type, x: o.x, y: o.y })),
              );
            }
          }
        }

        private updateReactiveGrass(moving: boolean, ix: number, iy: number, sprinting: boolean): void {
          if (!moving || this.reactiveGrassDecor.length === 0 || !this.player?.active) return;
          const now = this.time.now;
          if (now < this.nextReactiveGrassScanAt) return;
          this.nextReactiveGrassScanAt = now + REACTIVE_GRASS_TRIGGER_INTERVAL_MS;

          const footX = this.player.x;
          const footY = this.player.y - 5;
          const radius = REACTIVE_GRASS_RADIUS_PX + (sprinting ? 8 : 0);
          const radiusSq = radius * radius;
          let rustled = 0;

          for (const decor of this.reactiveGrassDecor) {
            const sprite = decor.sprite;
            if (!sprite.active || !sprite.visible) continue;
            const dx = decor.homeX - footX;
            const dy = decor.homeY - footY;
            if (dx * dx + dy * dy > radiusSq) continue;
            if (now - decor.lastRustleAt < REACTIVE_GRASS_RUSTLE_COOLDOWN_MS) continue;

            decor.lastRustleAt = now;
            rustled += 1;
            const side = Math.sign(dx || ix || 1);
            const push = REACTIVE_GRASS_BEND_PX * (sprinting ? 1.45 : 1);
            const bend = REACTIVE_GRASS_BEND_DEG * (sprinting ? 1.35 : 1);

            this.tweens.killTweensOf(sprite);
            sprite.setX(decor.homeX);
            sprite.setY(decor.homeY);
            sprite.setAngle(0);
            sprite.setScale(decor.homeScaleX, decor.homeScaleY);
            sprite.setAlpha(1);
            this.tweens.add({
              targets: sprite,
              x: decor.homeX + side * push,
              y: decor.homeY + Math.abs(iy) * 1.5,
              angle: side * bend,
              scaleY: decor.homeScaleY * REACTIVE_GRASS_SQUASH_Y,
              alpha: 0.92,
              duration: sprinting ? 78 : 96,
              ease: 'Sine.easeOut',
              yoyo: true,
              onComplete: () => {
                if (!sprite.active) return;
                sprite.setX(decor.homeX);
                sprite.setY(decor.homeY);
                sprite.setAngle(0);
                sprite.setScale(decor.homeScaleX, decor.homeScaleY);
                sprite.setAlpha(1);
              },
            });

            if (rustled >= REACTIVE_GRASS_SPRITES_PER_TICK) return;
          }
        }

        /** Y-sort exploration actors so tile-object decor (grass) compares against `player.y`, not a fixed depth. */
        private syncExplorationActorYDepths(): void {
          if (this.player?.active) {
            this.player.setDepth(this.player.y);
            this.playerShadow?.setPosition(this.player.x, this.player.y);
            this.playerShadow?.setDepth(this.player.y - 0.05);
            this.playerShadow?.setVisible(this.player.visible && this.player.alpha > 0.08);
            if (EXPLORATION_AUTHORING_DEBUG && this.time.now - this.lastAuthoringDepthLogAt > 1200) {
              this.lastAuthoringDepthLogAt = this.time.now;
              console.info('[LhAuthoring] actor foot depth', {
                actor: 'Traveler',
                x: Math.round(this.player.x),
                y: Math.round(this.player.y),
                depth: this.player.depth,
              });
            }
          }
          this.portalSprites.forEach((sp) => {
            if (sp.active) sp.setDepth(sp.y);
          });
          this.maiaPortalRotationGhosts.forEach((ghost, portalId) => {
            if (!ghost.active) return;
            const main = this.portalSprites.get(portalId);
            ghost.setDepth(main?.active ? main.depth - 0.01 : ghost.y - 0.01);
          });
          this.masterScribeSprites.forEach((sp) => {
            if (sp.active) sp.setDepth(sp.y);
          });
          this.lostEchoSprites.forEach((sp) => {
            if (sp.active) sp.setDepth(sp.y);
          });
          this.lostEchoFallbackMarkers.forEach((marker) => {
            if (marker.active) marker.setDepth(marker.y);
          });
          for (const r of this.roamingLostEchoes) {
            const shadow = this.lostEchoShadows.get(r.id);
            if (r.sprite.active) {
              r.sprite.setDepth(r.sprite.y);
              shadow?.setPosition(r.sprite.x, r.sprite.y);
              shadow?.setDepth(r.sprite.y - 0.05);
              shadow?.setVisible(r.sprite.visible && r.sprite.alpha > 0.08 && r.state !== 'dead');
            } else {
              shadow?.setVisible(false);
            }
          }
        }

        preload() {
          jrpgBattleBackdropDevLog('preload_phase_start', {
            note: 'Scene preload() running; battle backdrop queued with other assets.',
          });
          // ── Diagnostics: surface loader failures immediately ──
          this.load.on('loaderror', (file: unknown) => {
            console.error('[LhScene] Loader error:', file);
            const key = typeof file === 'object' && file && 'key' in file ? String((file as { key?: string }).key) : '';
            if (key === LOST_ECHO_IDLE_KEY) this.lostEchoIdleLoadFailed = true;
            if (key === JRPG_BATTLE_BG_KEY) {
              jrpgBattleBackdropDevLog('load_failed', { key, file });
            }
          });
          this.load.on('filecomplete', (key: string, type: string) => {
            if (key === JRPG_BATTLE_BG_KEY) {
              jrpgBattleBackdropDevLog('load_success', { key, type });
            }
            if (key === 'lh_world' || type === 'image') {
              // Keep this noisy logging scoped to map + images only.
              // (Phaser 4 emits many filecomplete events.)
              console.log(`[LhScene] Loaded file: type=${type} key=${key}`);
            }
          });

          // ── Let Phaser's loader handle the map JSON and all tileset images ──
          // Avoid a leading slash so Vite base paths / previews still work.
          this.load.tilemapTiledJSON('lh_world', _mapUrl);

          for (const name of TILESET_IMAGES) {
            this.load.image(name, _tilesetUrl(name));
          }

          for (const dir of TRAVELER_DIRECTIONS) {
            this.load.spritesheet(`lh_traveler_idle_${dir}`, _travelerUrl('idle', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_walk_${dir}`, _travelerUrl('walk', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_run_${dir}`, _travelerUrl('run', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_attack_${dir}`, _travelerUrl('attack1', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_attack2_${dir}`, _travelerUrl('attack2', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_hurt_${dir}`, _travelerUrl('hurt', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_death_${dir}`, _travelerUrl('death', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
            this.load.spritesheet(`lh_traveler_cast_${dir}`, _travelerUrl('heal', dir), {
              frameWidth: TRAVELER_FRAME.width,
              frameHeight: TRAVELER_FRAME.height,
            });
          }

          this.load.spritesheet('lh_maia_portal_idle', publicAssetUrl('assets/maps/portal-grassland-activated-loop.png'), {
            frameWidth: MAIA_PORTAL_FRAME.width,
            frameHeight: MAIA_PORTAL_FRAME.height,
          });
          this.load.spritesheet('lh_maia_portal_activate', publicAssetUrl('assets/maps/portal-grassland-activating.png'), {
            frameWidth: MAIA_PORTAL_FRAME.width,
            frameHeight: MAIA_PORTAL_FRAME.height,
          });
          this.load.spritesheet('lh_maia_portal_deactivate', publicAssetUrl('assets/maps/portal-grassland-deactivating.png'), {
            frameWidth: MAIA_PORTAL_FRAME.width,
            frameHeight: MAIA_PORTAL_FRAME.height,
          });
          // Additional biome vistas for the Mirror of Maia rotation. Grassland is already loaded
          // above under the legacy `lh_maia_portal_idle` key; skip it here to avoid a double load.
          for (const variant of MAIA_PORTAL_IDLE_BIOMES) {
            if (variant.id === 'grassland') continue;
            this.load.spritesheet(
              maiaPortalIdleAnimKey(variant.id),
              publicAssetUrl(`assets/maps/${variant.file}`),
              { frameWidth: MAIA_PORTAL_FRAME.width, frameHeight: MAIA_PORTAL_FRAME.height },
            );
          }
          for (const [kind, url] of Object.entries(SHADOW_ASSET_BY_KIND)) {
            this.load.image(SHADOW_TEXTURE_BY_KIND[kind], publicAssetUrl(url));
          }
          this.load.spritesheet(
            MASTER_SCRIBE_IDLE_KEY,
            publicAssetUrl('assets/npcs/master-scribe/old_wizard-idle.png'),
            {
              frameWidth: MASTER_SCRIBE_FRAME.width,
              frameHeight: MASTER_SCRIBE_FRAME.height,
            },
          );
          this.load.spritesheet(
            MASTER_SCRIBE_TALK_KEY,
            publicAssetUrl('assets/npcs/master-scribe/old_wizard-idle2.png'),
            {
              frameWidth: MASTER_SCRIBE_TALK_FRAME.width,
              frameHeight: MASTER_SCRIBE_TALK_FRAME.height,
            },
          );
          this.load.spritesheet(
            LOST_ECHO_IDLE_KEY,
            publicAssetUrl('assets/enemies/lost-echo/enemy1-variation1-idle.png'),
            {
              frameWidth: LOST_ECHO_FRAME.width,
              frameHeight: LOST_ECHO_FRAME.height,
            },
          );
          for (const [key, file] of [
            ['lh_lost_echo_run', 'enemy1-variation1-run.png'],
            ['lh_lost_echo_attack', 'enemy1-variation1-atk1.png'],
            ['lh_lost_echo_attack2', 'enemy1-variation1-atk2.png'],
            ['lh_lost_echo_hurt', 'enemy1-variation1-hurt.png'],
            ['lh_lost_echo_death', 'enemy1-variation1-death.png'],
          ] as const) {
            this.load.spritesheet(key, publicAssetUrl(`assets/enemies/lost-echo/${file}`), {
              frameWidth: LOST_ECHO_FRAME.width,
              frameHeight: LOST_ECHO_FRAME.height,
            });
          }

          this.load.image(ORACLE_STATUE_KEY, publicAssetUrl(ORACLE_STATUE_FILE));
          // Generic villager NPCs (1600×160 idle strips — 10 frames × 160px).
          this.load.spritesheet(
            'lh_villager_m_idle',
            publicAssetUrl('assets/npcs/villager/villager-m-idle.png'),
            { frameWidth: 160, frameHeight: 160 },
          );
          this.load.spritesheet(
            'lh_villager_f_idle',
            publicAssetUrl('assets/npcs/villager/villager-f-idle.png'),
            { frameWidth: 160, frameHeight: 160 },
          );
          this.load.image(JRPG_BATTLE_BG_KEY, publicAssetUrl(JRPG_BATTLE_BG_PATH));
          jrpgBattleBackdropDevLog('preload_queued', {
            key: JRPG_BATTLE_BG_KEY,
            path: JRPG_BATTLE_BG_PATH,
            url: publicAssetUrl(JRPG_BATTLE_BG_PATH),
          });

          // ── Campfire fire strip (8 frames × 160px) — animated at campfire nodes ──
          this.load.spritesheet(
            'lh_campfire_fire',
            publicAssetUrl('assets/maps/campfire1 - fire.png'),
            { frameWidth: 160, frameHeight: 160 },
          );
          // ── Hit spark FX strip (~14 frames × 160px) — one-shot on combat hit ──
          this.load.spritesheet(
            'lh_hit_spark',
            publicAssetUrl('assets/maps/atk1 fx-energy ish fx-single.png'),
            { frameWidth: 160, frameHeight: 160 },
          );
        }

        create() {
          try {
            // Diagnostics: capture global scene errors (helps catch swallowed exceptions)
            this.game.events.on('error', (err: unknown) => {
              console.error('[LhScene] Game error event:', err);
            });
          } catch {
            // Ignore if not supported in this Phaser build.
          }

          const map = this.make.tilemap({ key: 'lh_world' });

          const wpx = map.widthInPixels  || _parsedMap.footprint.width_px  || 12800;
          const hpx = map.heightInPixels || _parsedMap.footprint.height_px || 9600;

          this.cameras.main.setBackgroundColor(0x0b1220);
          this.physics.world.setBounds(0, 0, wpx, hpx);
          this.cameras.main.setBounds(0, 0, wpx, hpx);

          // ── Diagnostics: summarize map structure ──
          const discoveredLayerNames = (map.layers ?? [])
            .map((l) => (l as unknown as { name?: string; type?: string })?.name)
            .filter(Boolean) as string[];
          const discoveredTilesetNames = (map.tilesets ?? [])
            .map((t) => (t as unknown as { name?: string })?.name)
            .filter(Boolean) as string[];

          // Add all tilesets (name in Tiled editor ↔ image key in loader)
          const tilesets: Phaser.Tilemaps.Tileset[] = [];
          for (const name of TILESET_IMAGES) {
            try {
              const t = map.addTilesetImage(name, name);
              if (t) {
                tilesets.push(t);
              } else {
                // Dev-logging: null return means tileset name not found in map JSON or texture not loaded.
                const texLoaded = this.textures.exists(name);
                console.warn(`[LhScene:tileset] addTilesetImage null — name="${name}" textureLoaded=${texLoaded}`);
              }
            } catch (e) {
              console.warn(`[LhScene] Could not add tileset "${name}":`, e);
            }
          }
          // Temporary crops dev logging (B-012): report texture load status for all crop tilesets.
          {
            const cropNames = TILESET_IMAGES.filter(n => n.startsWith('crops-'));
            const cropLoaded = cropNames.filter(n => this.textures.exists(n));
            const cropMissing = cropNames.filter(n => !this.textures.exists(n));
            console.log('[LhScene:crops-debug] Crop texture status', {
              total: cropNames.length,
              loaded: cropLoaded.length,
              missing: cropMissing.length,
              missingNames: cropMissing,
            });
          }

          // Tiled may embed multiple tilesets with the same `name` (duplicate embeds). Phaser's
          // `addTilesetImage` only binds textures to the first matching name — bind the rest here.
          for (const ts of map.tilesets ?? []) {
            const name = ts.name;
            if (!PRELOAD_TILESET_KEYS.has(name)) continue;
            if (!this.textures.exists(name)) continue;
            ts.setImage(this.textures.get(name));
          }

          console.log(
            `[LhScene] Map loaded. tilesetsAdded=${tilesets.length}/${TILESET_IMAGES.length} ` +
            `mapTilesets=[${discoveredTilesetNames.join(', ')}] layers=[${discoveredLayerNames.join(', ')}] ` +
            `size=${map.width}x${map.height} tiles (${wpx}x${hpx}px) tile=${map.tileWidth}x${map.tileHeight}`,
          );

          // Render all tile layers
          const createdLayers: string[] = [];
          const allTileLayers: Phaser.Tilemaps.TilemapLayer[] = [];
          const solidLayers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
          // Prefer dynamic creation (tolerates changes in the Tiled file).
          for (const layerData of map.layers ?? []) {
            const ld = layerData as unknown as {
              name?: string; type?: string;
              offsetx?: number; offsety?: number;
              properties?: Array<{ name: string; value: unknown }>;
            };
            const layerName = ld?.name;
            const layerType = ld?.type;
            if (!layerName) continue;
            if (layerType && layerType !== 'tilelayer') continue;
            const abovePlayer = ld?.properties?.some((p) => p.name === 'lh_above_player' && p.value === true) ?? false;
            // Apply Tiled layer pixel offsets (usually 0; non-zero only for intentional offsets).
            // Phaser does NOT do this automatically — createLayer always places at world origin.
            const layerOffsetX = ld?.offsetx ?? 0;
            const layerOffsetY = ld?.offsety ?? 0;
            try {
              const layer = map.createLayer(layerName, tilesets, layerOffsetX, layerOffsetY);
              if (!layer) {
                console.warn(`[LhScene] Layer "${layerName}" returned null`);
                continue;
              }
              if (abovePlayer) {
                layer.setDepth(ABOVE_PLAYER_LAYER_DEPTH);
              } else if (layerName === 'crops') {
                // Crops must render above guild_hq_ground (which has tiles in the same area
                // and is created later in the display list, so it would otherwise occlude crops).
                // Depth 10 is above all default-depth (0) layers but well below the player
                // y-sort range (~1376-2560 in the crops area), so the player still walks on top.
                layer.setDepth(10);
                // Temporary crops dev logging (B-012)
                {
                  const ld2 = map.getLayer('crops');
                  const nonEmpty = ld2?.data
                    ? ld2.data.reduce((s, row) => s + row.filter((t) => t && t.index > 0).length, 0)
                    : -1;
                  // Sample a tile we know is in the crop area (tile coords ~50,55)
                  const sampleTile = layer.getTileAt(50, 55);
                  console.log('[LhScene:crops-debug] crops layer after setDepth(10)', {
                    depth: layer.depth,
                    alpha: layer.alpha,
                    visible: layer.visible,
                    active: layer.active,
                    x: layer.x, y: layer.y,
                    sceneActive: this.scene?.isActive?.() ?? 'unknown',
                    nonEmptyTiles: nonEmpty,
                    sampleTile_50_55: sampleTile ? { index: sampleTile.index, x: sampleTile.pixelX, y: sampleTile.pixelY } : null,
                    // Check that crop textures are actually in the WebGL renderer
                    cropsInTilesets: tilesets.filter(ts => ts.name.startsWith('crops-')).map(ts => ts.name),
                  });
                }
              }
              this.jrpgExplorationDimTargets.push(layer);
              if (layer instanceof Phaser.Tilemaps.TilemapLayer) allTileLayers.push(layer);
              if (SOLID_TILE_LAYER_NAMES.has(layerName)) {
                layer.setCollisionByExclusion([-1], true);
                solidLayers.push(layer);
              }
              createdLayers.push(layerName);
            } catch (e) {
              console.warn(`[LhScene] Could not create layer "${layerName}":`, e);
            }
          }

          // If dynamic discovery produced nothing, fall back to the historical list.
          if (createdLayers.length === 0) {
            const fallbackLayerNames = ['Main', 'Hillside', 'forest 4', 'Hillside 2', 'forest layer 3', 'Guild HQs'];
            for (const layerName of fallbackLayerNames) {
              try {
                const layer = map.createLayer(layerName, tilesets, 0, 0);
                if (!layer) console.warn(`[LhScene] Layer "${layerName}" returned null`);
                else {
                  this.jrpgExplorationDimTargets.push(layer);
                  if (layer instanceof Phaser.Tilemaps.TilemapLayer) allTileLayers.push(layer);
                  if (SOLID_TILE_LAYER_NAMES.has(layerName)) {
                    layer.setCollisionByExclusion([-1], true);
                    solidLayers.push(layer);
                  }
                  createdLayers.push(layerName);
                }
              } catch (e) {
                console.warn(`[LhScene] Could not create layer "${layerName}":`, e);
              }
            }
          }

          console.log(`[LhScene] Layers created: ${createdLayers.length ? createdLayers.join(', ') : '(none)'}`);
          // Temporary crops dev logging (B-012): report all tile layers sorted by depth so we can
          // see what covers crops (depth 10) and what doesn't.
          {
            const layerReport = allTileLayers
              .map(l => ({ name: l.layer?.name ?? '?', depth: l.depth, alpha: l.alpha, visible: l.visible }))
              .sort((a, b) => a.depth - b.depth);
            console.log('[LhScene:crops-debug] All tile layers by depth:', layerReport);
            const coveringCrops = layerReport.filter(l => l.depth > 10);
            if (coveringCrops.length > 0) {
              console.warn('[LhScene:crops-debug] Layers ABOVE crops (depth>10):', coveringCrops);
            } else {
              console.log('[LhScene:crops-debug] No tile layers above crops — crops should be topmost tile layer');
            }
          }
          this.registerWindmillBakedTileAnimations(map, allTileLayers);
          this.registerInteractiveCropTiles(map);
          this.addTiledTileObjectDecor(map);
          // Fallback: if the tile-layer windmill scan found nothing (windmillAnimTimer not started)
          // but the object-layer has windmill decor sprites, start the timer now so they animate.
          if (!this.windmillAnimTimer && this.windmillDecorSprites.length > 0) {
            const frameCount = this.windmillDecorSprites[0].spec.frameCount;
            this.windmillAnimTimer = this.time.addEvent({
              delay: WINDMILL_FRAME_MS,
              loop: true,
              callback: () => {
                this.windmillDecorAnimFrame = (this.windmillDecorAnimFrame + 1) % frameCount;
                for (const ds of this.windmillDecorSprites) {
                  if (!ds.sprite.active) continue;
                  const localId = windmillLocalIndex(ds.spec, this.windmillDecorAnimFrame, ds.colInFrame, ds.rowInFrame);
                  const newGid = ds.spec.firstGid + localId;
                  const frameName = `gid_${newGid}`;
                  if (!ds.sprite.texture.has(frameName)) {
                    const sx = (localId % ds.spec.sheetCols) * ds.tileW;
                    const sy = Math.floor(localId / ds.spec.sheetCols) * ds.tileH;
                    ds.sprite.texture.add(frameName, 0, sx, sy, ds.tileW, ds.tileH);
                  }
                  ds.sprite.setFrame(frameName);
                }
              },
            });
            if (import.meta.env.DEV) {
              console.info('[LhScene] Windmill decor-only fallback timer started', { decor_sprites: this.windmillDecorSprites.length });
            }
          }

          if (tilesets.length === 0 || createdLayers.length === 0) {
            const cam = this.cameras.main;
            const why =
              tilesets.length === 0
                ? 'Phaser linked 0 tilesets. Your Tiled export must use image paths the browser can load, e.g. "assets/maps/YourSheet.png" under public/assets/maps — not ../../../../Game Map/...'
                : '0 tile layers were created. Layer names may have changed, or tile GIDs do not match loaded tilesets.';
            this.add
              .text(cam.centerX, cam.centerY, ['MAP DID NOT RENDER', '', why, '', 'Restored template: Codex/docs/TILED_WORLD_MAP_BUILD_GUIDE.md'].join('\n'), {
                fontFamily: 'system-ui, Segoe UI, sans-serif',
                fontSize: '14px',
                color: '#fecaca',
                align: 'center',
                backgroundColor: '#1c1917ee',
                padding: { x: 16, y: 14 },
                wordWrap: { width: Math.min(520, cam.width - 32) },
              })
              .setOrigin(0.5)
              .setScrollFactor(0)
              .setDepth(20000);
          }

          // Fog regions — dark blocking rectangles
          this.fogStatics = this.physics.add.staticGroup();
          this.solidStatics = this.physics.add.staticGroup();
          _parsedMap.collision_regions.forEach((region) => {
            const b = region.bounds;
            if (b.width <= 0 || b.height <= 0) return;
            const r = this.add.rectangle(
              b.x + b.width / 2,
              b.y + b.height / 2,
              b.width,
              b.height,
              0x000000,
              0,
            );
            r.setVisible(false);
            this.physics.add.existing(r, true);
            this.solidStatics.add(r);
          });
          _parsedMap.fog_regions.forEach((f) => {
            const b = f.bounds;
            const r = this.add.rectangle(
              b.x + b.width / 2, b.y + b.height / 2,
              b.width, b.height,
              0x111827, 0.7,
            );
            this.physics.add.existing(r, true);
            this.fogStatics.add(r);
          });

          if (this.textures.exists(MASTER_SCRIBE_IDLE_KEY) && !this.anims.exists(MASTER_SCRIBE_IDLE_ANIM_KEY)) {
            this.anims.create({
              key: MASTER_SCRIBE_IDLE_ANIM_KEY,
              frames: this.anims.generateFrameNumbers(MASTER_SCRIBE_IDLE_KEY, {
                start: 0,
                end: MASTER_SCRIBE_FRAME.count - 1,
              }),
              frameRate: 6,
              repeat: -1,
            });
          }
          if (this.textures.exists(MASTER_SCRIBE_TALK_KEY) && !this.anims.exists(MASTER_SCRIBE_TALK_ANIM_KEY)) {
            this.anims.create({
              key: MASTER_SCRIBE_TALK_ANIM_KEY,
              frames: this.anims.generateFrameNumbers(MASTER_SCRIBE_TALK_KEY, {
                start: 0,
                end: MASTER_SCRIBE_TALK_FRAME.count - 1,
              }),
              frameRate: 8,
              repeat: -1,
            });
          }
          registerLostEchoAnimsIfNeeded(this);

          // ── Campfire fire loop animation ──────────────────────────────────
          if (this.textures.exists('lh_campfire_fire') && !this.anims.exists('lh_campfire_fire_loop')) {
            this.anims.create({
              key: 'lh_campfire_fire_loop',
              // campfire1 - fire.png: 1280×160 = 8 frames × 160px
              frames: this.anims.generateFrameNumbers('lh_campfire_fire', { start: 0, end: 7 }),
              frameRate: 8,
              repeat: -1,
            });
          }

          // Trigger zones (Maia portal overlap scales with Tiled object size — widen the portal rect in Tiled for a friendlier hit box.)
          const _hasOracleEncounterTrigger = _triggers.some((t) => t.kind === 'oracle_encounter');
          _triggers.forEach((tr) => {
            // campfire_node: purely decorative — spawn animated fire sprite, skip trigger rect.
            // Author a Tiled object with lh_kind = campfire_node at each campfire tile position.
            if (tr.kind === 'campfire_node') {
              this.spawnCampfireAtNode(tr.x + tr.w / 2, tr.y + tr.h / 2, _hasAmberFlame.current);
              return;
            }

            if (tr.kind === 'maia_portal' && this.textures.exists('lh_maia_portal_idle')) {
              const portal = this.add.sprite(tr.x + tr.w / 2, tr.y + tr.h, 'lh_maia_portal_idle');
              const scale = Phaser.Math.Clamp(Math.max(tr.h, 72) / 192, 0.48, 1.2);
              portal.setScale(scale);
              portal.setOrigin(0.5, 1);
              portal.setDepth(portal.y);
              this.portalSprites.set(tr.interactable_id, portal);

              const portalBlock = this.add.rectangle(
                tr.x + tr.w / 2,
                tr.y + tr.h * 0.38,
                Math.max(tr.w * 2.2, 80),
                Math.max(tr.h * 0.46, 28),
                0x000000,
                0,
              );
              this.physics.add.existing(portalBlock, true);
              this.solidStatics.add(portalBlock);
            }

            if (tr.kind === 'npc_dialogue' && tr.npc_id === MASTER_SCRIBE_NPC_ID) {
              this.addMasterScribeVisual(tr);
            }

            if (tr.kind === 'combat_encounter' && tr.tiled_name === LOST_ECHO_TRIGGER_NAME) {
              this.addLostEchoVisual(tr);
            }

            // Draw Oracle statue glow target for ANY oracle trigger kind:
            // - oracle_altar_zone: canonical proximity zone (oracle visual is tiles in guild_hq_floor_2)
            // - oracle_encounter: legacy trigger type (routes → oracle_veiled dialogue)
            // - npc_dialogue + oracle_veiled: synthetic fallback only when oracle_encounter is absent
            const isOracleTrigger =
              tr.kind === 'oracle_altar_zone' ||
              tr.kind === 'oracle_encounter' ||
              (!_hasOracleEncounterTrigger && tr.kind === 'npc_dialogue' && tr.npc_id === 'oracle_veiled');
            if (isOracleTrigger) {
              const oracleSource = tr.kind === 'oracle_encounter' ? 'tiled' : 'synthetic';
              this.addOracleStatueVisual(tr);
              console.log('[LH_ORACLE] ORACLE_SOURCE: ' + oracleSource, {
                interactable_id: tr.interactable_id,
                kind: tr.kind,
                npc_id: tr.npc_id,
                x: tr.x, y: tr.y, w: tr.w, h: tr.h,
              });
            }

            const isPortal = tr.kind === 'maia_portal';
            const triggerWidth = isPortal ? Math.max(tr.w * 1.7, 62) : tr.w;
            const triggerHeight = isPortal ? Math.max(tr.h * 0.7, 42) : tr.h;
            const triggerCenterY = tr.y + tr.h / 2;
            const rect = this.add.rectangle(
              tr.x + tr.w / 2,
              triggerCenterY,
              triggerWidth,
              triggerHeight,
              0x000000,
              0,
            );
            rect.setStrokeStyle(0);
            rect.setVisible(false);
            this.triggerBodies.push({ rect, meta: tr });
          });

          const leTrig = _triggers.find((t) => t.tiled_name === LOST_ECHO_TRIGGER_NAME);
          this.lostEchoDemoInteractableId = leTrig?.interactable_id ?? null;
          if (LOST_ECHO_DEEP_DIAG && typeof console !== 'undefined') {
            const row = this.triggerBodies.find((tb) => tb.meta.tiled_name === LOST_ECHO_TRIGGER_NAME);
            console.info('[LhLostEchoDiag] 6. Lost Echo trigger zone (geom overlap each frame; no Arcade overlap)', {
              lost_echo_interactable_id: this.lostEchoDemoInteractableId,
              trigger_zone_created: Boolean(row),
              overlap_checked_via_rectangle_intersect: true,
              rect_center_xy: row ? { x: row.rect.x, y: row.rect.y } : null,
              rect_size_wh: row ? { w: row.rect.width, h: row.rect.height } : null,
            });
          }

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.info(
              '[LhScene] lh_triggers → Phaser bodies',
              _triggers.map((t) => ({
                kind: t.kind,
                mode: t.activation_mode ?? 'interaction',
                interactable_id: t.interactable_id,
                bounds: { x: t.x, y: t.y, w: t.w, h: t.h },
              })),
            );
          }

          const hasTraveler = this.textures.exists('lh_traveler_idle_down');
          if (this.textures.exists('lh_maia_portal_idle')) {
            this.anims.create({
              key: 'lh_maia_portal_idle',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_idle', {
                start: 0,
                end: MAIA_PORTAL_IDLE_LAST_FRAME,
              }),
              frameRate: 7,
              repeat: -1,
            });
          }
          for (const variant of MAIA_PORTAL_IDLE_BIOMES) {
            if (variant.id === 'grassland') continue;
            const animKey = maiaPortalIdleAnimKey(variant.id);
            if (!this.textures.exists(animKey) || this.anims.exists(animKey)) continue;
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers(animKey, {
                start: 0,
                end: MAIA_PORTAL_IDLE_LAST_FRAME,
              }),
              frameRate: 7,
              repeat: -1,
            });
          }
          // Boot every portal on the legacy grassland idle, then start the cinematic biome rotation.
          this.currentMaiaPortalIdleAnim = MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY;
          this.maiaPortalRotationIndex = 0;
          if (this.anims.exists(MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY)) {
            this.portalSprites.forEach((portal) => portal.play(MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY));
            this.startMaiaPortalRotation();
          }
          if (this.textures.exists('lh_maia_portal_activate')) {
            this.anims.create({
              key: 'lh_maia_portal_activate',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_activate', {
                start: 0,
                end: MAIA_PORTAL_ACTIVATE_LAST_FRAME,
              }),
              frameRate: 10,
              repeat: 0,
            });
          }
          if (this.textures.exists('lh_maia_portal_deactivate')) {
            this.anims.create({
              key: 'lh_maia_portal_deactivate',
              frames: this.anims.generateFrameNumbers('lh_maia_portal_deactivate', {
                start: 0,
                end: MAIA_PORTAL_DEACTIVATE_LAST_FRAME,
              }),
              frameRate: 8,
              repeat: 0,
            });
          }

          if (hasTraveler) {
            registerTravelerWideAttackStripFrames(this);
            for (const dir of TRAVELER_DIRECTIONS) {
              for (const spec of [
                { kind: 'idle', count: TRAVELER_FRAME_COUNTS.idle, fps: 6, repeat: -1 },
                { kind: 'walk', count: TRAVELER_FRAME_COUNTS.walk, fps: 10, repeat: -1 },
                { kind: 'run', count: TRAVELER_FRAME_COUNTS.run, fps: TRAVELER_RUN_ANIM_FPS, repeat: -1 },
                { kind: 'attack', count: TRAVELER_FRAME_COUNTS.attack, fps: TRAVELER_ATTACK_ANIM_FPS, repeat: 0 },
                { kind: 'attack2', count: TRAVELER_FRAME_COUNTS.attack2, fps: TRAVELER_ATTACK_ANIM_FPS, repeat: 0 },
                { kind: 'hurt', count: TRAVELER_FRAME_COUNTS.hurt, fps: 12, repeat: 0 },
                { kind: 'death', count: TRAVELER_FRAME_COUNTS.death, fps: 10, repeat: 0 },
                { kind: 'cast', count: TRAVELER_FRAME_COUNTS.cast, fps: 16, repeat: 0 },
              ] as const) {
                const key = `lh_traveler_${spec.kind}_${dir}`;
                if (!this.textures.exists(key) || this.anims.exists(key)) continue;
                // Attack / attack2: per-facing strip + `wide_*` frames (neighbor-aware UV); idle/walk/run use stride-3.
                const frameIndices =
                  spec.kind === 'attack'
                    ? [...ATTACK1_FRAMES_BY_DIR[dir]]
                    : spec.kind === 'attack2'
                      ? [...ATTACK2_FRAMES_BY_DIR[dir]]
                      : travelerVisibleFrameIndices(spec.count);
                const frames =
                  spec.kind === 'attack' || spec.kind === 'attack2'
                    ? frameIndices.map((stripIdx) => ({ key, frame: `wide_${stripIdx}` }))
                    : this.anims.generateFrameNumbers(key, { frames: frameIndices });
                this.anims.create({
                  key,
                  frames,
                  frameRate: spec.fps,
                  repeat: spec.repeat,
                });
              }
            }
            // One filter mode for all Traveler strip textures so attack/idle/walk are sampled the same way at runtime.
            for (const dir of TRAVELER_DIRECTIONS) {
              for (const kind of ['idle', 'walk', 'run', 'attack', 'attack2', 'hurt', 'death', 'cast'] as const) {
                const texKey = `lh_traveler_${kind}_${dir}`;
                if (!this.textures.exists(texKey)) continue;
                this.textures.get(texKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
              }
            }
          }

          if (!hasTraveler) {
            const g = this.add.graphics();
            g.fillStyle(0xe2e8f0, 1);
            g.fillCircle(12, 12, 12);
            g.generateTexture('lh_player_dot', 24, 24);
            g.destroy();
          }

          const authoredSpawn =
            _parsedMap.spawn_points.find((spawn) => spawn.realm_id === realmId) ??
            _parsedMap.spawn_points[0];
          const maiaPortal = _triggers.find((tr) => tr.kind === 'maia_portal');
          const masterScribeTrigger = _triggers.find(
            (tr) => tr.kind === 'npc_dialogue' && tr.npc_id === MASTER_SCRIBE_NPC_ID,
          );
          const usePortalAnchoredAethelwoodDemoStart =
            realmId === PRIMARY_WORLD_TRIGGER_REALM_ID &&
            !!maiaPortal &&
            !!authoredSpawn &&
            (authoredSpawn.spawn_key === 'aethelwood_demo_start' ||
              authoredSpawn.name === 'spawn_aethelwood_start');
          const rawSpawnX = usePortalAnchoredAethelwoodDemoStart
            ? maiaPortal.x + maiaPortal.w / 2
            : authoredSpawn
              ? authoredSpawn.bounds.x + authoredSpawn.bounds.width / 2
              // When no authored spawn exists, start the player near the Master Scribe so they
              // encounter the first NPC immediately. Falls back to the Maia portal if absent.
              : masterScribeTrigger
                ? masterScribeTrigger.x + masterScribeTrigger.w / 2
                : maiaPortal
                  ? maiaPortal.x + maiaPortal.w / 2
                  : wpx / 2;
          const rawSpawnY = usePortalAnchoredAethelwoodDemoStart
            ? maiaPortal.y + maiaPortal.h + 150
            : authoredSpawn
              ? authoredSpawn.bounds.y + authoredSpawn.bounds.height / 2
              : masterScribeTrigger
                ? masterScribeTrigger.y + masterScribeTrigger.h / 2 + 50
                : maiaPortal
                  ? maiaPortal.y + maiaPortal.h + 150
                  : hpx / 2;
          const spawnX = Phaser.Math.Clamp(rawSpawnX, 24, wpx - 24);
          const spawnY = Phaser.Math.Clamp(rawSpawnY, 24, hpx - 24);
          this.explorationSpawnFootX = spawnX;
          this.explorationSpawnFootY = spawnY;

          this.explorationPlayerTraveler = hasTraveler;
          this.player = this.physics.add.sprite(spawnX, spawnY, hasTraveler ? 'lh_traveler_idle_down' : 'lh_player_dot');
          if (hasTraveler) {
            this.player.setScale(EXPLORATION_TRAVELER_DISPLAY_SCALE);
            // Foot origin matches Lost Echo / Master Scribe so wide attack frames do not pivot around
            // the frame center (which reads as the sprite "blooming" then clipping vs idle).
            this.player.setOrigin(0.5, 1);
            this.player.setSize(14, 28);
            this.player.setOffset(9, 52);
            attachTravelerWideStripHandlers(this.player, 1);
            this.playTravelerAnimation('idle', 'down');
          }
          this.player.setCollideWorldBounds(true);
          // Direct velocity each frame — no damping/acceleration inertia (feels grounded).
          this.player.setDamping(false);
          this.player.setDrag(0, 0);
          this.player.setAcceleration(0, 0);
          const maxSpd = Math.max(TRAVELER_MOVE_SPEED_PX, TRAVELER_SPRINT_SPEED_PX) * 1.1;
          this.player.setMaxVelocity(maxSpd, maxSpd);
          this.player.setDepth(this.player.y);
          this.playerShadow = EXPLORATION_PROCEDURAL_SHADOWS_ENABLED
            ? this.add
                .ellipse(
                  this.player.x,
                  this.player.y,
                  hasTraveler ? 12 : 10,
                  hasTraveler ? 4 : 4,
                  EXPLORATION_SHADOW_COLOR,
                  EXPLORATION_CONTACT_SHADOW_ALPHA,
                )
                .setDepth(this.player.y - 0.05)
            : undefined;

          this.physics.add.collider(this.player, this.fogStatics);
          this.physics.add.collider(this.player, this.solidStatics);
          solidLayers.forEach((layer) => {
            this.physics.add.collider(this.player, layer);
          });

          this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
          // Space opens Pause (headerless gameplay). Interaction moves to E.
          this.keyPause = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE,
          ) as Phaser.Input.Keyboard.Key;
          this.keyInteract = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.E,
          ) as Phaser.Input.Keyboard.Key;
          this.keyInteractEnter = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER,
          ) as Phaser.Input.Keyboard.Key;
          this.keyAttack = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.A,
          ) as Phaser.Input.Keyboard.Key;
          this.keySprint = this.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.R,
          ) as Phaser.Input.Keyboard.Key;
          if (LOST_ECHO_DEEP_DIAG) {
            this.keyLostEchoDiagForce = this.input.keyboard?.addKey(
              Phaser.Input.Keyboard.KeyCodes.L,
            ) as Phaser.Input.Keyboard.Key;
          }

          this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, EXPLORATION_CAMERA_FOLLOW_OFFSET_Y);
          this.cameras.main.setZoom(EXPLORATION_CAMERA_ZOOM);
          this.cameras.main.setRoundPixels(true);

          // Store for late spawns (e.g. mq-103 programmatic spawn on dialogue dismiss).
          this.solidLayersRef = solidLayers;

          // Roaming hack-and-slash Lost Echoes are now driven entirely by Tiled `roaming_lost_echo_spawn`
          // markers. If a map has none authored yet, we either log a clear DEV note (default) or fall
          // back to the original hardcoded triangle around the player spawn (`VITE_LH_FALLBACK_HARDCODED_ROAMERS=true`).
          const tiledRoamerSpawns = _parsedMap.roaming_lost_echo_spawns ?? [];
          if (import.meta.env.DEV) {
            console.info('[LhScene] Tiled roaming Lost Echo spawn markers parsed', {
              count: tiledRoamerSpawns.length,
              ids: tiledRoamerSpawns.map((s) => s.tiled_object_id),
            });
          }
          if (tiledRoamerSpawns.length > 0) {
            this.spawnRoamingLostEchoes(tiledRoamerSpawns, solidLayers, wpx, hpx);
          } else if (import.meta.env.VITE_LH_FALLBACK_HARDCODED_ROAMERS === 'true') {
            if (import.meta.env.DEV) {
              console.warn(
                '[LhScene] No `roaming_lost_echo_spawn` markers in Tiled — using hardcoded DEV fallback (VITE_LH_FALLBACK_HARDCODED_ROAMERS=true)',
              );
            }
            const fallback: ParsedLhRoamingLostEchoSpawn[] = (
              [
                { x: spawnX - 200, y: spawnY - 220 },
                { x: spawnX + 220, y: spawnY - 180 },
                { x: spawnX - 40, y: spawnY - 360 },
              ] as Array<{ x: number; y: number }>
            ).map((pt, i) => ({
              tiled_object_id: -(i + 1),
              name: `dev_fallback_${i + 1}`,
              layer_name: 'dev_fallback',
              bounds: { x: pt.x, y: pt.y, width: 0, height: 0 },
              center_x: pt.x,
              center_y: pt.y,
              count: 1,
              respawn: false,
              debug_label: 'dev_fallback',
              spawn_group: 'dev_fallback',
              ignored_aliases: [],
            }));
            this.spawnRoamingLostEchoes(fallback, solidLayers, wpx, hpx);
          } else if (import.meta.env.DEV) {
            console.info(
              '[LhScene] No `roaming_lost_echo_spawn` markers in Tiled and no DEV fallback — exploration will have zero roamers.',
            );
          }

          this.objectiveText = this.add
            .text(12, 34, '', {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              fontSize: '14px',
              color: '#fbbf24',
              backgroundColor: '#1c1917cc',
              padding: { x: 9, y: 6 },
              wordWrap: { width: 520 },
            })
            .setScrollFactor(0)
            .setDepth(10000);

          this.demoDebugText = this.add
            .text(12, 92, '', {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              fontSize: '12px',
              color: '#fde68a',
              backgroundColor: '#1c191799',
              padding: { x: 8, y: 4 },
            })
            .setScrollFactor(0)
            .setDepth(10000)
            .setVisible(SHOW_DEMO_DEBUG_HUD);

          this.interactionPromptText = this.add
            .text(0, 0, 'Enter / E — Speak', {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
              fontSize: '13px',
              color: '#fffbeb',
              fontStyle: '600',
            })
            .setOrigin(0.5, 1);

          this.interactionPromptBg = this.add.graphics();
          this.interactionPromptRoot = this.add
            .container(0, 0, [this.interactionPromptBg, this.interactionPromptText])
            .setDepth(10001)
            .setVisible(false);

          // Subtle in-world amber glow (not a dialogue bubble).
          this.interactionPromptText.setShadow(0, 1, '#000000aa', 2, false, true);
          this.interactionPromptPulseTween = this.tweens.add({
            targets: this.interactionPromptRoot,
            alpha: { from: 0.92, to: 1 },
            duration: 720,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });

          window.addEventListener('lh:maia-handoff-opened', this.handleMaiaOpened);
          window.addEventListener('lh:maia-handoff-closed', this.handleMaiaClosed);
          window.addEventListener(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, this.handleGuildResearchAbort);
          window.addEventListener(LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT, this.handleGuildResearchExit);
          window.addEventListener(LH_WINDOW_KNOWLEDGE_COMBAT_VISUAL, this.handleKnowledgeCombatVisual);
          window.addEventListener('lh:spawn-mq103-echoes', this.handleMq103SpawnEchoes);
          window.addEventListener('lh:spawn-mq105-echo', this.handleMq105SpawnEcho);
          window.addEventListener(LH_WINDOW_KNOWLEDGE_BATTLE_PRESENTATION, this.handleKnowledgeBattlePresentation);
          window.addEventListener(LH_WINDOW_ORACLE_BUILDUP_START, this.handleOracleBuildupStart);
          window.addEventListener(LH_WINDOW_ORACLE_RETURN_TRANSITION, this.handleOracleReturnTransition);
          window.addEventListener('lh:oracle-altar-scroll-passthrough', this.handleOracleAltarPassthrough);
          window.addEventListener('lh:overlay-keyboard-block', this.handleOverlayKeyboardBlock);
          // ── VFX event bridge (dispatched via dispatchVfx in lhVfxManager) ──
          this._vfxUnsub = subscribeToPhaserVfx((payload) => this.handleVfxEvent(payload));
          this.scale.on('resize', this.handleKnowledgeBattleResize);
          this.events.once('shutdown', () => {
            window.removeEventListener('lh:maia-handoff-opened', this.handleMaiaOpened);
            window.removeEventListener('lh:maia-handoff-closed', this.handleMaiaClosed);
            window.removeEventListener(LH_WINDOW_PHASER_GUILD_RESEARCH_ABORT, this.handleGuildResearchAbort);
            window.removeEventListener(LH_WINDOW_PHASER_GUILD_RESEARCH_EXIT, this.handleGuildResearchExit);
            window.removeEventListener(LH_WINDOW_KNOWLEDGE_COMBAT_VISUAL, this.handleKnowledgeCombatVisual);
            window.removeEventListener(LH_WINDOW_KNOWLEDGE_BATTLE_PRESENTATION, this.handleKnowledgeBattlePresentation);
            window.removeEventListener(LH_WINDOW_ORACLE_BUILDUP_START, this.handleOracleBuildupStart);
            window.removeEventListener(LH_WINDOW_ORACLE_RETURN_TRANSITION, this.handleOracleReturnTransition);
            window.removeEventListener('lh:oracle-altar-scroll-passthrough', this.handleOracleAltarPassthrough);
            window.removeEventListener('lh:overlay-keyboard-block', this.handleOverlayKeyboardBlock);
            window.removeEventListener('lh:spawn-mq103-echoes', this.handleMq103SpawnEchoes);
            window.removeEventListener('lh:spawn-mq105-echo', this.handleMq105SpawnEcho);
            this._vfxUnsub?.();
            this._vfxUnsub = undefined;
            this.campfireFireSprites = [];
            this.scale.off('resize', this.handleKnowledgeBattleResize);
            this.windmillAnimTimer?.remove(false);
            this.windmillAnimTimer = null;
            this.interactionPromptPulseTween?.stop();
            this.interactionPromptPulseTween = undefined;
            this.interactionPromptRoot?.destroy(true);
            this.interactionPromptRoot = undefined;
            this.interactionPromptBg = undefined;
            this.interactionPromptText = undefined;
          });
        }

        private handleKnowledgeCombatVisual = (ev: Event) => {
          const detail = (ev as CustomEvent<LhKnowledgeCombatVisualDetail>).detail;
          if (!detail?.interactableId) return;
          if (this.isKnowledgeBattleRouting(detail.interactableId)) {
            this.routeKnowledgeCombatVisualToBattle(detail);
            return;
          }
          if (detail.phase === 'start') {
            this.playLostEchoAnimation(detail.interactableId, 'lh_lost_echo_run');
            return;
          }
          if (detail.phase === 'wrong') {
            playLhLostEchoSwingSfx();
            this.playLostEchoAnimation(detail.interactableId, 'lh_lost_echo_attack2');
            this.playTravelerOneShot('hurt', 520);
            return;
          }
          if (detail.phase === 'correct') {
            playLhTravelerSwingSfx();
            this.playLostEchoAnimation(detail.interactableId, 'lh_lost_echo_hurt');
            this.playTravelerOneShot(this.takeAlternateTravelerStrike(), 620);
            return;
          }
          if (detail.phase === 'victory') {
            this.playLostEchoAnimation(detail.interactableId, 'lh_lost_echo_death', true);
            return;
          }
          if (detail.phase === 'buff') {
            this.playTravelerOneShot('cast', 900);
            return;
          }
          this.playLostEchoAnimation(detail.interactableId, LOST_ECHO_IDLE_ANIM_KEY);
        };

        // ─── VFX event handler ───────────────────────────────────────────────

        private handleVfxEvent = (payload: { kind: string; worldX?: number; worldY?: number; intensity?: number }) => {
          const cx = payload.worldX ?? this.player?.x ?? 0;
          const cy = payload.worldY ?? this.player?.y ?? 0;
          const intensity = payload.intensity ?? 1.0;
          switch (payload.kind) {
            case 'hit_spark':   this.playHitSpark(cx, cy, intensity);   break;
            case 'rune_burst':  this.playRuneBurst(cx, cy, intensity);  break;
            case 'dust_puff':   this.playDustPuff(cx, cy, intensity);   break;
            case 'grass_rustle':this.playGrassRustle(cx, cy, intensity);break;
          }
        };

        /**
         * Hit spark — plays the `lh_hit_spark` spritesheet one-shot at world pos.
         * Falls back to a procedural Graphics flash if the texture didn't load.
         */
        private playHitSpark(x: number, y: number, intensity: number): void {
          if (this.textures.exists('lh_hit_spark')) {
            const sp = this.add.sprite(x, y, 'lh_hit_spark');
            sp.setOrigin(0.5, 0.5);
            sp.setScale(0.35 * Math.max(0.3, intensity));
            sp.setDepth(20000);
            if (!this.anims.exists('lh_hit_spark_play')) {
              // atk1 fx-energy ish fx-single.png: 2304×160 ≈ 14 frames @ 160px
              const frameCount = Math.floor(
                (this.textures.get('lh_hit_spark').source[0]?.width ?? 2240) / 160,
              );
              this.anims.create({
                key: 'lh_hit_spark_play',
                frames: this.anims.generateFrameNumbers('lh_hit_spark', {
                  start: 0,
                  end: Math.max(0, frameCount - 1),
                }),
                frameRate: 18,
                repeat: 0,
              });
            }
            sp.play('lh_hit_spark_play');
            sp.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sp.destroy());
            return;
          }
          // Procedural fallback: orange ring flash
          const g = this.add.graphics().setDepth(20000);
          g.lineStyle(3, VFX_COLOR_HIT_SPARK, 1);
          g.strokeCircle(0, 0, 14 * intensity);
          g.setPosition(x, y);
          this.tweens.add({
            targets: g,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 0.4, to: 1.6 },
            scaleY: { from: 0.4, to: 1.6 },
            duration: 280,
            ease: 'Quad.easeOut',
            onComplete: () => g.destroy(),
          });
        }

        /**
         * Rune burst — expanding ring tween (knowledge battle special).
         */
        private playRuneBurst(x: number, y: number, intensity: number): void {
          const g = this.add.graphics().setDepth(20000);
          g.lineStyle(3, VFX_COLOR_RUNE_BURST, 1);
          g.strokeCircle(0, 0, 24);
          g.setPosition(x, y);
          this.tweens.add({
            targets: g,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 0.3, to: 2.8 * intensity },
            scaleY: { from: 0.3, to: 2.8 * intensity },
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => g.destroy(),
          });
          // Inner fill flash
          const fill = this.add.graphics().setDepth(19999);
          fill.fillStyle(VFX_COLOR_RUNE_BURST, 0.18);
          fill.fillCircle(0, 0, 24);
          fill.setPosition(x, y);
          this.tweens.add({
            targets: fill,
            alpha: { from: 0.5, to: 0 },
            scaleX: { from: 0.3, to: 2.2 * intensity },
            scaleY: { from: 0.3, to: 2.2 * intensity },
            duration: 480,
            ease: 'Quad.easeOut',
            onComplete: () => fill.destroy(),
          });
        }

        /**
         * Dust puff — tan circle bloom (surface step FX).
         */
        private playDustPuff(x: number, y: number, intensity: number): void {
          const g = this.add.graphics().setDepth(20000);
          g.fillStyle(VFX_COLOR_DUST_PUFF, 0.7);
          g.fillCircle(0, 0, 10 * intensity);
          g.setPosition(x, y);
          this.tweens.add({
            targets: g,
            alpha: { from: 0.7, to: 0 },
            scaleX: { from: 0.4, to: 2.0 },
            scaleY: { from: 0.3, to: 1.2 },
            duration: 380,
            ease: 'Quad.easeOut',
            onComplete: () => g.destroy(),
          });
        }

        /**
         * Grass rustle — bright green circle bloom (enhanced movement on grass).
         */
        private playGrassRustle(x: number, y: number, intensity: number): void {
          const g = this.add.graphics().setDepth(20000);
          g.fillStyle(VFX_COLOR_GRASS_RUSTLE, 0.55);
          g.fillCircle(0, 0, 12 * intensity);
          g.setPosition(x, y);
          this.tweens.add({
            targets: g,
            alpha: { from: 0.55, to: 0 },
            scaleX: { from: 0.3, to: 2.4 },
            scaleY: { from: 0.3, to: 1.4 },
            duration: 420,
            ease: 'Sine.easeOut',
            onComplete: () => g.destroy(),
          });
        }

        // ─── Campfire node sprite ────────────────────────────────────────────

        /**
         * Spawns an animated fire sprite at `(worldX, worldY)`.
         * Called for each Tiled object with `lh_kind = campfire_node`.
         * If hasAmberFlame is true, tints the sprite 0xE8A020 (warm amber).
         */
        private spawnCampfireAtNode(worldX: number, worldY: number, hasAmberFlame: boolean): void {
          if (!this.textures.exists('lh_campfire_fire')) return;
          // campfire1 - fire.png frames are 160×160 but the in-world campfire tile is 64×64.
          const scale = 64 / 160; // ≈ 0.4
          const sp = this.add.sprite(worldX, worldY, 'lh_campfire_fire');
          sp.setOrigin(0.5, 0.75); // anchor near the base of the flame
          sp.setScale(scale);
          sp.setDepth(worldY);
          if (this.anims.exists('lh_campfire_fire_loop')) {
            sp.play('lh_campfire_fire_loop');
          }
          if (hasAmberFlame) {
            // VISUAL_AMBER_FLAME cosmetic (streak ≥ 3) — warm amber tint (COS-CAM-001).
            sp.setTint(0xe8a020);
          }
          this.campfireFireSprites.push(sp);
        }

        private handleMaiaOpened = () => {
          if (import.meta.env.DEV || import.meta.env.VITE_LH_MAIA_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.log('[MaiaHandoff Phaser]', 'handleMaiaOpened → pause gameplay');
          }
          this.maiaHandoffPaused = true;
          this.player.setAcceleration(0, 0);
          this.player.setVelocity(0, 0);
        };

        /** Tear down any rotation ghost still alive for this portal — used before activate/deactivate transitions. */
        private clearMaiaPortalRotationGhost(portalId: string): void {
          const ghost = this.maiaPortalRotationGhosts.get(portalId);
          if (!ghost) return;
          this.tweens.killTweensOf(ghost);
          ghost.destroy();
          this.maiaPortalRotationGhosts.delete(portalId);
        }

        /**
         * Cycles the Mirror of Maia's idle animation through every preloaded biome variant.
         * One scene-wide timer keeps multiple portals visually in sync.
         *
         * Each swap is a **true two-sprite crossfade**: a "ghost" sprite is spawned at the same position
         * playing the *outgoing* biome and fades 1→0, while the main portal switches to the *incoming* biome
         * and fades 0→1 over the same window. Their alphas sum to ~1 throughout, so the portal silhouette
         * stays visually present — no "whole portal blinks off" artifact.
         *
         * Portals that are mid-activation or in cooldown are skipped (their alpha is being driven elsewhere).
         */
        private startMaiaPortalRotation(): void {
          this.maiaPortalRotationTimer?.remove(false);
          // Build the list of variants whose animation actually registered (textures may have failed to load).
          const playable = MAIA_PORTAL_IDLE_BIOMES.filter((v) => this.anims.exists(maiaPortalIdleAnimKey(v.id)));
          if (playable.length <= 1) return;

          this.maiaPortalRotationTimer = this.time.addEvent({
            delay: MAIA_PORTAL_ROTATION_INTERVAL_MS,
            loop: true,
            callback: () => {
              this.maiaPortalRotationIndex = (this.maiaPortalRotationIndex + 1) % playable.length;
              const nextKey = maiaPortalIdleAnimKey(playable[this.maiaPortalRotationIndex].id);
              this.currentMaiaPortalIdleAnim = nextKey;

              this.portalSprites.forEach((portal, portalId) => {
                if (!portal.active) return;
                if (this.portalActivating.has(portalId)) return;
                if ((this.portalCooldownUntil.get(portalId) ?? 0) > this.time.now) return;
                if (!this.anims.exists(nextKey)) return;

                this.crossfadeMaiaPortalToBiome(portalId, portal, nextKey);
              });
            },
          });
        }

        /**
         * Spawn an outgoing-biome "ghost" matched to the portal's transform, swap the main sprite to
         * the incoming biome at alpha 0, and tween the two in opposite directions so the silhouette
         * stays continuously visible. Any existing ghost from a prior swap is cleaned up first.
         */
        private crossfadeMaiaPortalToBiome(
          portalId: string,
          portal: Phaser.GameObjects.Sprite,
          nextAnimKey: string,
        ): void {
          // Clean up any in-flight ghost from a prior, still-running rotation tick on this portal.
          const stale = this.maiaPortalRotationGhosts.get(portalId);
          if (stale) {
            this.tweens.killTweensOf(stale);
            stale.destroy();
            this.maiaPortalRotationGhosts.delete(portalId);
          }
          this.tweens.killTweensOf(portal);

          // Capture the outgoing visual *before* we swap the main sprite.
          const outgoingTexKey = portal.texture?.key;
          const outgoingAnimKey = portal.anims?.currentAnim?.key;
          const outgoingFrameIdx = portal.anims?.currentFrame?.index ?? 0;

          let ghost: Phaser.GameObjects.Sprite | null = null;
          if (outgoingTexKey && this.textures.exists(outgoingTexKey)) {
            ghost = this.add.sprite(portal.x, portal.y, outgoingTexKey);
            ghost.setOrigin(portal.originX, portal.originY);
            ghost.setScale(portal.scaleX, portal.scaleY);
            ghost.setScrollFactor(portal.scrollFactorX, portal.scrollFactorY);
            ghost.setDepth(portal.depth - 1);
            ghost.setAlpha(1);
            if (outgoingAnimKey && this.anims.exists(outgoingAnimKey)) {
              ghost.play(outgoingAnimKey);
              // Resync the ghost to the same frame the main was on, so the crossfade looks like the same
              // animation playing twice rather than two phases of the loop overlapping.
              try {
                ghost.anims.setCurrentFrame(this.anims.get(outgoingAnimKey).frames[Math.max(0, outgoingFrameIdx - 1)]);
              } catch {
                /* animation manager differences across Phaser builds — safe to ignore */
              }
            }
            this.maiaPortalRotationGhosts.set(portalId, ghost);
          }

          // Swap the main sprite to the incoming biome and bring it up from 0.
          portal.setAlpha(ghost ? 0 : 1);
          portal.play(nextAnimKey);

          if (ghost) {
            this.tweens.add({
              targets: portal,
              alpha: 1,
              duration: MAIA_PORTAL_ROTATION_CROSSFADE_MS,
              ease: 'Sine.easeInOut',
            });
            this.tweens.add({
              targets: ghost,
              alpha: 0,
              duration: MAIA_PORTAL_ROTATION_CROSSFADE_MS,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                if (this.maiaPortalRotationGhosts.get(portalId) === ghost) {
                  this.maiaPortalRotationGhosts.delete(portalId);
                }
                ghost!.destroy();
              },
            });
          }
        }

        private handleMaiaClosed = () => {
          if (import.meta.env.DEV || import.meta.env.VITE_LH_MAIA_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.log('[MaiaHandoff Phaser]', 'handleMaiaClosed → resume gameplay & re-enter');
          }
          this.maiaHandoffPaused = false;
          const portalId = this.lastMaiaPortalId;
          if (!portalId) return;
          const meta = this.triggerBodies.find((row) => row.meta.interactable_id === portalId)?.meta;
          if (!meta) return;

          const portal = this.portalSprites.get(portalId);
          this.clearMaiaPortalRotationGhost(portalId);
          if (portal) this.tweens.killTweensOf(portal);
          portal?.setAlpha(0.82);
          playLhSfx('portal_activation');
          if (portal) {
            const dormantKey = this.anims.exists(this.currentMaiaPortalIdleAnim)
              ? this.currentMaiaPortalIdleAnim
              : MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY;
            if (this.anims.exists(dormantKey)) {
              portal.play(dormantKey);
            }
            this.tweens.add({
              targets: portal,
              alpha: { from: 0.72, to: 0.92 },
              duration: 1500,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
            });
          }

          // 8-second cooldown prevents duplicate trigger firing while still allowing re-entry.
          this.portalCooldownUntil.set(portalId, this.time.now + 8000);
          this.time.delayedCall(8000, () => {
            this.portalCooldownUntil.delete(portalId);
            this.activatedInteractableIds.delete(portalId);
            const cooledPortal = this.portalSprites.get(portalId);
            if (!cooledPortal) return;
            this.tweens.killTweensOf(cooledPortal);
            cooledPortal.setAlpha(1);
            const resumeKey = this.anims.exists(this.currentMaiaPortalIdleAnim)
              ? this.currentMaiaPortalIdleAnim
              : MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY;
            if (this.anims.exists(resumeKey)) {
              cooledPortal.play(resumeKey);
            }
          });
          this.player.setPosition(meta.x + meta.w / 2, meta.y + meta.h + 24);
          this.player.setAlpha(0);
          this.player.setScale(0.45);
          this.facing = 'down';
          this.player.anims.stop();
          this.playTravelerAnimation('idle', 'down', true);
          this.tweens.add({
            targets: this.player,
            alpha: 1,
            y: meta.y + meta.h + 135,
            scale: EXPLORATION_TRAVELER_DISPLAY_SCALE,
            duration: 1700,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.facing = 'down';
              this.player.anims.stop();
              this.playTravelerAnimation('idle', 'down', true);
            },
          });
        };

        private runGuildResearchExitWalk(hit: TriggerRect) {
          const startScale = this.player.scale;
          const standY = guildResearchExitStandY(hit);
          const exitWalkDist = Math.abs(standY - this.player.y);
          // Same pacing as Maia portal return: ~1700ms over ~111px, idle sprite (slow stroll, not run cycle).
          const portalReturnMsPerPx = 1700 / 111;
          const exitDuration = Math.max(
            1600,
            Math.min(3200, Math.round(480 + exitWalkDist * portalReturnMsPerPx)),
          );
          this.facing = 'down';
          this.player.anims.stop();
          if (this.textures.exists('lh_traveler_idle_down')) {
            this.playTravelerAnimation('idle', 'down', true);
          }
          this.tweens.add({
            targets: this.player,
            alpha: 1,
            y: standY,
            scale: startScale,
            duration: exitDuration,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.facing = 'down';
              this.player.anims.stop();
              if (this.textures.exists('lh_traveler_idle_down')) {
                this.playTravelerAnimation('idle', 'down', true);
              }
              this.guildResearchCooldownUntil.set(
                hit.interactable_id,
                this.time.now + GUILD_RESEARCH_REACTIVATE_COOLDOWN_MS,
              );
              this.triggerTransitionLocked = false;
            },
          });
        }

        private handleGuildResearchAbort = (ev: Event) => {
          const detail = (ev as CustomEvent<LhPhaserGuildResearchBridgeDetail>).detail;
          const id = detail?.interactableId;
          if (!id || !this.guildResearchPendingExit || this.guildResearchPendingExit.interactableId !== id) return;
          this.tweens.killTweensOf(this.player);
          const { preEnter } = this.guildResearchPendingExit;
          this.guildResearchPendingExit = null;
          this.player.setPosition(preEnter.x, preEnter.y);
          this.player.setAlpha(preEnter.alpha);
          this.player.setScale(preEnter.scale);
          this.facing = 'down';
          this.player.anims.stop();
          if (this.textures.exists('lh_traveler_idle_down')) {
            this.playTravelerAnimation('idle', 'down', true);
          }
          this.triggerTransitionLocked = false;
          if (detail?.mode === 'blocked') {
            // Blocked barrier: keep it latched and cool it briefly so overlap_auto doesn't loop while the player stands in the zone.
            this.guildResearchCooldownUntil.set(id, this.time.now + 8000);
            return;
          }
          this.activatedInteractableIds.delete(id);
        };

        private handleGuildResearchExit = (ev: Event) => {
          const id = (ev as CustomEvent<LhPhaserGuildResearchBridgeDetail>).detail?.interactableId;
          if (!id || !this.guildResearchPendingExit || this.guildResearchPendingExit.interactableId !== id) return;
          const { hit } = this.guildResearchPendingExit;
          this.guildResearchPendingExit = null;
          this.runGuildResearchExitWalk(hit);

          // DEV: verify crops + windmill state survived the guild hub visit.
          // If crops/windmill disappear after returning from Aethelwood or another
          // guild hub, these values tell you whether the records were cleared or
          // whether the timer was lost — check the console after a full guild run.
          if (import.meta.env.DEV) {
            console.info('[LhScene][CropDebug] guild-research-exit — crops & windmill state', {
              crop_tile_records: this.cropTileRecords.length,
              windmill_groups: this.windmillAnimGroups.length,
              windmill_timer_active: this.windmillAnimTimer ? !this.windmillAnimTimer.hasDispatched : 'no-timer',
            });
          }
        };

        private lostEchoDiagActivateGate(hit: TriggerRect, gate: string, detail?: Record<string, unknown>): void {
          if (!LOST_ECHO_DEEP_DIAG || hit.tiled_name !== LOST_ECHO_TRIGGER_NAME) return;
          if (gate === 'combat_encounter_cooldown') {
            const next = this.lostEchoCooldownDiagLogUntil.get(hit.interactable_id) ?? 0;
            if (this.time.now < next) return;
            this.lostEchoCooldownDiagLogUntil.set(hit.interactable_id, this.time.now + 4500);
          }
          console.info(`[LhLostEchoDiag] activateTrigger blocked — ${gate}`, {
            interactable_id: hit.interactable_id,
            ...detail,
          });
        }

        private syncLostEchoDebugWorldMarker(lostEchoFightStage: boolean): void {
          if (!LOST_ECHO_DEEP_DIAG) {
            this.lostEchoDebugMarkerRect?.destroy();
            this.lostEchoDebugMarkerText?.destroy();
            this.lostEchoDebugMarkerRect = undefined;
            this.lostEchoDebugMarkerText = undefined;
            return;
          }
          const wantMarker =
            lostEchoFightStage &&
            this.lostEchoSprites.size === 0 &&
            this.lostEchoFallbackMarkers.size === 0;
          const meta = this.triggerBodies.find((tb) => tb.meta.tiled_name === LOST_ECHO_TRIGGER_NAME)?.meta;
          if (!wantMarker || !meta) {
            this.lostEchoDebugMarkerRect?.destroy();
            this.lostEchoDebugMarkerText?.destroy();
            this.lostEchoDebugMarkerRect = undefined;
            this.lostEchoDebugMarkerText = undefined;
            return;
          }
          if (this.lostEchoDebugMarkerRect && this.lostEchoDebugMarkerRect.scene) return;

          const cx = meta.x + meta.w / 2;
          const cy = meta.y + meta.h / 2;
          this.lostEchoDebugMarkerRect = this.add
            .rectangle(cx, cy, meta.w + 16, meta.h + 16, 0xff0000, 0.38)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(260);
          this.lostEchoDebugMarkerText = this.add
            .text(cx, cy - meta.h / 2 - 36, 'LOST ECHO TRIGGER DEBUG', {
              fontFamily: 'system-ui, Segoe UI, sans-serif',
              fontSize: '15px',
              color: '#ffffff',
              fontStyle: 'bold',
              backgroundColor: '#b91c1c',
              padding: { x: 8, y: 6 },
            })
            .setOrigin(0.5)
            .setDepth(261);
        }

        private emitLostEchoDeepPipeline(
          kcBeaten: boolean,
          lostEchoFightStage: boolean,
          autoHitInteractableId: string | null,
        ): void {
          if (!LOST_ECHO_DEEP_DIAG || typeof console === 'undefined') return;
          if (this.time.now < this.lostEchoDiagDeepNextAt) return;
          this.lostEchoDiagDeepNextAt = this.time.now + 2800;

          const meta = this.triggerBodies.find((tb) => tb.meta.tiled_name === LOST_ECHO_TRIGGER_NAME)?.meta;
          const pGeom = this.getPlayerBodyGeomRect(this.scratchPlayerGeom);
          const cam = this.cameras.main;
          let geomOverlap = false;
          if (meta) {
            geomOverlap = Phaser.Geom.Intersects.RectangleToRectangle(
              pGeom,
              this.interactionGeomForMeta(meta, this.scratchTriggerGeom),
            );
          }

          const visited = meta ? _lostEchoDiagVisited.current.includes(meta.interactable_id) : false;
          const completedHotspot = meta ? Boolean(_completionById.current.get(meta.interactable_id)) : false;

          console.info('[LhLostEchoDiag] 4–6. Pipeline snapshot', {
            kc_beaten: kcBeaten,
            lost_echo_world_gate: lostEchoFightStage,
            trial_victory_hide_ids: [...this.lostEchoTrialVictoryHideIds],
            knowledge_battle_paused: this.knowledgeBattlePaused,
            maia_handoff_paused: this.maiaHandoffPaused,
            trigger_transition_locked: this.triggerTransitionLocked,
            lost_echo_interactable_id: meta?.interactable_id ?? null,
            react_visited_includes_id: visited,
            hotspot_completed_flag: completedHotspot,
            phaser_activated_session_has_id: meta ? this.activatedInteractableIds.has(meta.interactable_id) : false,
            combat_cooldown_remaining_ms: meta
              ? Math.max(0, (this.combatEncounterCooldownUntil.get(meta.interactable_id) ?? 0) - this.time.now)
              : 0,
            trigger_zone_registered: Boolean(meta),
            trigger_bounds_world: meta ? { x: meta.x, y: meta.y, w: meta.w, h: meta.h } : null,
            player_body_aabb: { x: pGeom.x, y: pGeom.y, w: pGeom.width, h: pGeom.height },
            player_sprite_xy: { x: this.player.x, y: this.player.y },
            camera_scroll_xy: { x: cam.scrollX, y: cam.scrollY },
            camera_view_wh: { w: cam.width, h: cam.height },
            geom_overlap_lost_echo_inflated: geomOverlap,
            overlap_auto_first_winner_interactable_id: autoHitInteractableId,
            overlap_auto_steals_from_lost_echo:
              Boolean(geomOverlap && autoHitInteractableId && meta && autoHitInteractableId !== meta.interactable_id),
          });

          const sp = meta ? this.lostEchoSprites.get(meta.interactable_id) : undefined;
          const fb = meta ? this.lostEchoFallbackMarkers.get(meta.interactable_id) : undefined;
          const spriteCenterOnCamera =
            sp &&
            Phaser.Geom.Rectangle.Contains(cam.worldView, sp.x, sp.y);
          const triggerCenterOnCamera =
            meta &&
            Phaser.Geom.Rectangle.Contains(cam.worldView, meta.x + meta.w / 2, meta.y + meta.h / 2);
          console.info('[LhLostEchoDiag] 5. Sprite / fallback decor', {
            sprite_created: Boolean(sp),
            sprite_xy: sp ? { x: sp.x, y: sp.y } : null,
            sprite_visible: sp?.visible ?? null,
            sprite_alpha: sp?.alpha ?? null,
            sprite_depth: sp?.depth ?? null,
            sprite_center_inside_camera_world_view: spriteCenterOnCamera ?? false,
            trigger_center_inside_camera_world_view: triggerCenterOnCamera ?? false,
            texture_lh_lost_echo_idle_exists: this.textures.exists(LOST_ECHO_IDLE_KEY),
            lost_echo_idle_load_failed: this.lostEchoIdleLoadFailed,
            fallback_marker_created: Boolean(fb),
            fallback_visible: fb?.visible ?? null,
            fallback_alpha: fb?.alpha ?? null,
          });
        }

        private activateTrigger(hit: TriggerRect) {
          if (this.knowledgeBattlePaused) {
            this.lostEchoDiagActivateGate(hit, 'knowledgeBattlePaused');
            return;
          }
          const isPortal = hit.kind === 'maia_portal';
          const isGuildResearchPortal = hit.kind === 'guild_hq_research';
          const isRepeatableNpc = hit.kind === 'npc_dialogue';
          const completed = Boolean(_completionById.current.get(hit.interactable_id));
          // Lost Echo recovery: allow re-entering the trigger zone if KC not yet beaten.
          const lostEchoRecover =
            hit.kind === 'combat_encounter' &&
            hit.tiled_name === LOST_ECHO_TRIGGER_NAME &&
            !_kcBeaten.current;
          if (
            hit.kind === 'combat_encounter' &&
            (hit.activation_mode ?? 'interaction') === 'overlap_auto' &&
            (this.combatEncounterCooldownUntil.get(hit.interactable_id) ?? 0) > this.time.now
          ) {
            this.lostEchoDiagActivateGate(hit, 'combat_encounter_cooldown', {
              ms_remaining: (this.combatEncounterCooldownUntil.get(hit.interactable_id) ?? 0) - this.time.now,
            });
            return;
          }

          // Act I: Maia portal is always accessible — demo stage gate removed.
          const blockedBySession =
            !isPortal && !isGuildResearchPortal && !isRepeatableNpc && this.activatedInteractableIds.has(hit.interactable_id);
          if ((!isPortal && !isGuildResearchPortal && !isRepeatableNpc && completed && !lostEchoRecover) || blockedBySession) {
            this.lostEchoDiagActivateGate(hit, 'completed_hotspot_or_blocked_session', {
              completed,
              blockedBySession,
              lost_echo_recover_allowed: lostEchoRecover,
            });
            return;
          }

          if (!isPortal) {
            // Guild research: enter tween → React opens Guild Info + Atlas; exit walk runs when atlas closes (window event).
            if (isGuildResearchPortal) {
              if (this.isGuildResearchCooling(hit.interactable_id)) return;
              if (typeof console !== 'undefined') {
                console.info('[LhTrigger Phaser]', 'guild_hq_research activate', {
                  interactable_id: hit.interactable_id,
                  target_realm_id: hit.target_realm_id,
                  activation_mode: hit.activation_mode,
                  bounds: { x: hit.x, y: hit.y, w: hit.w, h: hit.h },
                });
              }
              this.activatedInteractableIds.add(hit.interactable_id);
              this.triggerTransitionLocked = true;
              this.player.setAcceleration(0, 0);
              this.player.setVelocity(0, 0);
              this.player.anims.stop();

              const preEnter = {
                x: this.player.x,
                y: this.player.y,
                alpha: this.player.alpha,
                scale: this.player.scale,
              };
              const startScale = this.player.scale;
              this.tweens.add({
                targets: this.player,
                alpha: 0,
                y: this.player.y - 14,
                scale: startScale * 0.9,
                duration: 650,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  this.guildResearchPendingExit = {
                    interactableId: hit.interactable_id,
                    hit,
                    preEnter,
                  };
                  _onActivate(hit.interactable_id);
                },
              });
              return;
            }

            if (!isRepeatableNpc && hit.kind !== 'combat_encounter') {
              this.activatedInteractableIds.add(hit.interactable_id);
            }
            if (hit.kind === 'combat_encounter') {
              // Lost Echo specifically requires KC not yet beaten; all other combat triggers are always ok.
              const combatStageOk =
                hit.tiled_name !== LOST_ECHO_TRIGGER_NAME ||
                !_kcBeaten.current;
              if (combatStageOk) {
                playLhTravelerSwingSfx();
                this.playTravelerOneShot(this.takeAlternateTravelerStrike(), 620);
              }
            }
            if (LOST_ECHO_DEEP_DIAG && hit.tiled_name === LOST_ECHO_TRIGGER_NAME) {
              console.info('[LhLostEchoDiag] activateTrigger → _onActivate (Phaser gates passed)', hit.interactable_id);
            }
            _onActivate(hit.interactable_id);
            if (hit.kind === 'combat_encounter' && (hit.activation_mode ?? 'interaction') === 'overlap_auto') {
              this.combatEncounterCooldownUntil.set(hit.interactable_id, this.time.now + 4200);
            }
            return;
          }

          if (this.portalActivating.has(hit.interactable_id)) return;
          if ((this.portalCooldownUntil.get(hit.interactable_id) ?? 0) > this.time.now) return;
          this.portalActivating.add(hit.interactable_id);
          this.activatedInteractableIds.add(hit.interactable_id);
          this.lastMaiaPortalId = hit.interactable_id;

          this.player.setAcceleration(0, 0);
          this.player.setVelocity(0, 0);
          this.player.anims.stop();
          if (this.textures.exists('lh_traveler_idle_up')) {
            this.playTravelerAnimation('idle', 'up', true);
          }

          const portal = this.portalSprites.get(hit.interactable_id);
          this.clearMaiaPortalRotationGhost(hit.interactable_id);
          if (portal) {
            this.tweens.killTweensOf(portal);
            portal.setAlpha(1);
          }
          playLhSfx('portal_activation');
          if (portal && this.anims.exists('lh_maia_portal_activate')) {
            portal.play('lh_maia_portal_activate');
            portal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              const resumeKey = this.anims.exists(this.currentMaiaPortalIdleAnim)
                ? this.currentMaiaPortalIdleAnim
                : MAIA_PORTAL_LEGACY_IDLE_ANIM_KEY;
              if (this.anims.exists(resumeKey)) {
                portal.play(resumeKey);
              }
            });
          }

          this.tweens.add({
            targets: this.player,
            alpha: 0,
            // Subtle "step into the mirror" glide (less distance, slower ease).
            y: this.player.y - 18,
            scale: this.player.scale * 0.86,
            duration: 1150,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Freeze gameplay while the Maia handoff prompt is visible.
              this.maiaHandoffPaused = true;
              this.player.setAcceleration(0, 0);
              this.player.setVelocity(0, 0);
              _onActivate(hit.interactable_id);
              this.portalActivating.delete(hit.interactable_id);
            },
          });
        }

        update() {
          if (!this.maiaHandoffPaused && !this.knowledgeBattlePaused) {
            this.syncExplorationActorYDepths();
          }
          if (
            LOST_ECHO_DEEP_DIAG &&
            this.keyLostEchoDiagForce &&
            Phaser.Input.Keyboard.JustDown(this.keyLostEchoDiagForce)
          ) {
            const id = this.lostEchoDemoInteractableId;
            if (!_kcBeaten.current && id) {
              console.info('[LhLostEchoDiag] L key → force React onActivateHotspot (Phaser overlap gates bypassed)', id);
              _onActivate(id);
            } else if (typeof console !== 'undefined') {
              console.warn('[LhLostEchoDiag] L key ignored — kc already beaten or no id', {
                kc_beaten: _kcBeaten.current,
                lost_echo_interactable_id: id,
              });
            }
          }

          if (this.maiaHandoffPaused || this.knowledgeBattlePaused) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            this.interactionPromptRoot?.setVisible(false);
            // Roamer AI tick honors the same pause via `roamingAiActive()`; calling it here keeps
            // their velocities clean while the JRPG / Maia overlay is up.
            this.updateRoamingLostEchoes(this.time.now);
            return;
          }

          this.updateRoamingLostEchoes(this.time.now);

          if (this.triggerTransitionLocked) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            this.interactionPromptRoot?.setVisible(false);
            return;
          }

          // A React full-screen overlay (module document, scroll reveal, oracle cinematic, prophecy)
          // is covering the canvas — freeze all Phaser keyboard input so game keys don't fire while
          // the student is typing in a document or watching a cinematic.
          if (_overlayBlocksInput.current) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            this.interactionPromptRoot?.setVisible(false);
            return;
          }

          if (Phaser.Input.Keyboard.JustDown(this.keyPause)) {
            if (this.playerInOracleAltarZone) {
              // Intercept Space while inside the Oracle altar zone — React decides whether
              // to open the Oracle sequence (mq-201 active) or pass through to normal Scroll.
              console.log('[LH_ORACLE_ALTAR] scroll open intercepted');
              window.dispatchEvent(new CustomEvent('lh:oracle-altar-scroll-open'));
            } else {
              onPauseRef.current?.();
            }
            return;
          }

          if (this.attackingUntil > this.time.now) {
            this.player?.setAcceleration(0, 0);
            this.player?.setVelocity(0, 0);
            return;
          }

          const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
          if (!body) return;
          // Rested Readiness scales sprint stamina capacity and recovery amount.
          // Multiplier is 1.0 for score 0 (Restless) — no change from base.
          const restedMult = _restedReadinessMultiplier.current;
          const staminaMaxMs = SPRINT_FUEL_MAX_MS * restedMult;
          if (this.sprintFuelMs > staminaMaxMs) this.sprintFuelMs = staminaMaxMs;
          this.playMasterScribeByDialogueState();
          const lostEchoFightStage = Boolean(
            this.lostEchoDemoInteractableId &&
              !_completionById.current.get(this.lostEchoDemoInteractableId),
          );
          if (!lostEchoFightStage) {
            this.lostEchoTrialVictoryHideIds.clear();
          }
          if (LOST_ECHO_DEEP_DIAG && typeof console !== 'undefined') {
            const kcKey = _kcBeaten.current ? 'kc_beaten' : 'kc_pending';
            if (this.lastLostEchoStageLogged !== kcKey) {
              this.lastLostEchoStageLogged = kcKey;
              console.info('[LhLostEchoDiag] 1. act1_kc_state', {
                kc_beaten: _kcBeaten.current,
                lost_echo_world_gate_active: lostEchoFightStage,
                trial_victory_hide_ids: [...this.lostEchoTrialVictoryHideIds],
              });
            }
          }

          const applyLostEchoWorldDecor = (
            decor: Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.Alpha,
            decorId: string,
          ) => {
            const show = Boolean(lostEchoFightStage && !this.lostEchoTrialVictoryHideIds.has(decorId));
            decor.setVisible(show);
            if (show && !this.knowledgeBattlePaused) {
              decor.setAlpha(1);
            }
          };
          this.lostEchoSprites.forEach((sprite, decorId) => applyLostEchoWorldDecor(sprite, decorId));
          this.lostEchoFallbackMarkers.forEach((marker, decorId) => applyLostEchoWorldDecor(marker, decorId));
          this.syncLostEchoDebugWorldMarker(lostEchoFightStage);
          this.objectiveText?.setText('Objective: Follow the amber path');
          if (SHOW_DEMO_DEBUG_HUD) {
            const lostDbg = [...this.lostEchoSprites.entries()]
              .map(([id, sp]) => {
                const shortId = id.split(':').slice(-2).join(':');
                return `${shortId} vis=${sp.visible} visited=${Boolean(_completionById.current.get(id))}`;
              })
              .join(' | ');
            this.demoDebugText?.setText(
              [
                `KC: ${_kcBeaten.current ? 'beaten' : 'pending'}`,
                `Stamina: ${Math.ceil(this.sprintFuelMs / 1000)}s / ${Math.ceil(staminaMaxMs / 1000)}s`,
                lostDbg ? `LostEcho: ${lostDbg}` : 'LostEcho: (none)',
                `lostIdleTex=${this.textures.exists(LOST_ECHO_IDLE_KEY)} failed=${this.lostEchoIdleLoadFailed}`,
              ].join(' · '),
            );
          }

          let ix = 0;
          let iy = 0;
          if (this.cursors.left?.isDown) ix -= 1;
          if (this.cursors.right?.isDown) ix += 1;
          if (this.cursors.up?.isDown) iy -= 1;
          if (this.cursors.down?.isDown) iy += 1;
          const inputLen = Math.hypot(ix, iy);
          const now = this.time.now;
          const sprintCooldownReady = now >= this.sprintCooldownUntil;
          if (sprintCooldownReady && !this.keySprint.isDown) {
            this.sprintFuelMs = staminaMaxMs;
          }

          let moveSpeed = TRAVELER_MOVE_SPEED_PX;
          let sprintingMove = false;
          if (DEMO_UNLIMITED_SPRINT && this.keySprint.isDown && inputLen > 0) {
            moveSpeed = TRAVELER_SPRINT_SPEED_PX;
            sprintingMove = true;
          } else if (
            sprintCooldownReady &&
            this.keySprint.isDown &&
            this.sprintFuelMs > 0 &&
            inputLen > 0
          ) {
            moveSpeed = TRAVELER_SPRINT_SPEED_PX;
            sprintingMove = true;
            const dt = Math.min(this.game.loop.delta, 64);
            this.sprintFuelMs -= dt;
            if (this.sprintFuelMs <= 0) {
              this.sprintFuelMs = 0;
              this.sprintCooldownUntil = now + SPRINT_COOLDOWN_MS;
            }
          }
          // Shaken penalty: Resolve below 25% → −10% sprint speed (RESOLVE_SHAKEN_SPRINT_PENALTY).
          // Does not apply in DEMO_UNLIMITED_SPRINT mode (dev escape hatch).
          if (sprintingMove && !DEMO_UNLIMITED_SPRINT && _resolveShaken.current) {
            moveSpeed *= 0.90;
          }

          if (inputLen > 0) {
            ix /= inputLen;
            iy /= inputLen;
            this.player.setVelocity(ix * moveSpeed, iy * moveSpeed);
          } else {
            this.player.setVelocity(0, 0);
          }

          const moving = inputLen > 0;
          this.updateReactiveGrass(moving, ix, iy, sprintingMove);
          this.updateReactiveCropTiles(moving, ix, iy, sprintingMove);
          if (moving && this.textures.exists(`lh_traveler_${sprintingMove ? 'run' : 'walk'}_${this.facing}`)) {
            this.player.anims.timeScale = sprintingMove ? SPRINT_RUN_ANIM_TIME_SCALE : 1;
            // Dominant axis → 4-way facing (clean idle/run transitions).
            if (Math.abs(ix) > Math.abs(iy)) {
              this.facing = ix < 0 ? 'left' : 'right';
            } else if (iy !== 0) {
              this.facing = iy < 0 ? 'up' : 'down';
            }
            this.playTravelerAnimation(sprintingMove ? 'run' : 'walk', this.facing);
          } else {
            this.player.anims.timeScale = 1;
            this.playTravelerAnimation('idle', this.facing);
          }

          if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
            // Attack locks movement briefly. If attack sheets exist, play the animation.
            this.player.anims.timeScale = 1;
            this.player.setAcceleration(0, 0);
            this.player.setVelocity(0, 0);
            // Sword swing SFX: alternate between the two variants. The 90 ms shared-group
            // cooldown prevents audible stacking when A is mashed faster than the swing
            // animation can play out (Phaser's `JustDown` already fires once per press, but
            // very rapid taps would still layer multiple short clips).
            playLhTravelerSwingSfx();
            // Resolve hits against any roaming Lost Echo inside the swing AABB BEFORE the
            // animation kicks off — gives crisper feel (impact lands on first frame of the swing).
            this.resolvePlayerSwingAgainstRoamers();
            this.resolvePlayerSwingAgainstCrops();
            if (!this.playTravelerOneShot(this.takeAlternateTravelerStrike(), 760)) {
              // Fallback: tiny lunge + flash so input is testable even before the attack sheet lands.
              this.attackingUntil = this.time.now + 260;
              this.tweens.add({
                targets: this.player,
                alpha: 0.65,
                duration: 90,
                yoyo: true,
                repeat: 1,
              });
            }
            return;
          }

          const px = this.player.x;
          const py = this.player.y;
          const pGeom = this.getPlayerBodyGeomRect(this.scratchPlayerGeom);
          const overlaps = this.triggerBodies
            .filter(({ meta }) =>
              Phaser.Geom.Intersects.RectangleToRectangle(
                pGeom,
                this.interactionGeomForMeta(meta, this.scratchTriggerGeom),
              ),
            )
            .map((row) => {
              const m = row.meta;
              const cx = m.x + m.w / 2;
              const cy = m.y + m.h / 2;
              return { ...row, d: (cx - px) ** 2 + (cy - py) ** 2 };
            })
            .sort((a, b) => {
              const aDone = Boolean(_completionById.current.get(a.meta.interactable_id));
              const bDone = Boolean(_completionById.current.get(b.meta.interactable_id));
              if (aDone !== bDone) return aDone ? 1 : -1;
              return a.d - b.d;
            });

          const dialogueOpen = Boolean(_dialogueNpcId.current);
          const promptHit = overlaps.find((row) => {
            const m = row.meta;
            if ((m.activation_mode ?? 'interaction') !== 'interaction') return false;
            // Never show the prompt for portal-like or encounter triggers.
            if (m.kind === 'maia_portal') return false;
            // oracle_altar_zone is proximity-only — no Enter prompt.
            if (m.kind === 'oracle_altar_zone') return false;
            // oracle_encounter is demoted to visual-only when an oracle_altar_zone exists in the map.
            if (m.kind === 'oracle_encounter' && _hasOracleAltarZone) return false;
            if (Boolean(_completionById.current.get(m.interactable_id))) return false;
            return true;
          })?.meta;

          // ── Oracle Altar Zone proximity detection ─────────────────────────────
          // Detect whether the player is inside any oracle_altar_zone trigger rect.
          // Fires lh:oracle-altar-zone-enter / lh:oracle-altar-zone-exit window events on state changes.
          // Reminder text appears after ~5 s in zone: "Press Space to open the Scroll here."
          if (_hasOracleAltarZone) {
            const inAltarZoneNow = _triggers.some((t) => {
              if (t.kind !== 'oracle_altar_zone') return false;
              const tzRect = this.scratchTriggerGeom;
              tzRect.setTo(t.x, t.y, t.w, t.h);
              return Phaser.Geom.Intersects.RectangleToRectangle(pGeom, tzRect);
            });
            if (inAltarZoneNow && !this.playerInOracleAltarZone) {
              this.playerInOracleAltarZone = true;
              this.oracleAltarZoneEnteredAt = this.time.now;
              this.oracleAltarReminderShown = false;
              console.log('[LH_ORACLE_ALTAR] entered zone');
              window.dispatchEvent(new CustomEvent('lh:oracle-altar-zone-enter'));
            } else if (!inAltarZoneNow && this.playerInOracleAltarZone) {
              this.playerInOracleAltarZone = false;
              this.oracleAltarReminderShown = false;
              this.oracleAltarReminderText?.setVisible(false);
              console.log('[LH_ORACLE_ALTAR] exited zone');
              window.dispatchEvent(new CustomEvent('lh:oracle-altar-zone-exit'));
            }
            // Show reminder text ~5 s after entering zone (once per visit).
            if (
              this.playerInOracleAltarZone &&
              !this.oracleAltarReminderShown &&
              this.time.now - this.oracleAltarZoneEnteredAt > 5000
            ) {
              this.oracleAltarReminderShown = true;
              if (!this.oracleAltarReminderText) {
                // Create text anchored at the Oracle altar zone center of the first altar rect.
                const altarTr = _triggers.find((t) => t.kind === 'oracle_altar_zone');
                const rx = altarTr ? altarTr.x + altarTr.w / 2 : px;
                const ry = altarTr ? altarTr.y - 28 : py - 80;
                this.oracleAltarReminderText = this.add.text(rx, ry,
                  'The Scroll stirs in your satchel…\nPress Space to open it here.',
                  {
                    fontSize: '11px',
                    fontFamily: 'serif',
                    color: '#f5e7c8',
                    backgroundColor: '#1e0a3c',
                    padding: { x: 8, y: 5 },
                    align: 'center',
                    wordWrap: { width: 200 },
                  },
                );
                this.oracleAltarReminderText.setAlpha(0);
                this.oracleAltarReminderText.setOrigin(0.5, 1);
                this.oracleAltarReminderText.setDepth(9000);
                this.oracleAltarReminderText.setScrollFactor(1);
              }
              this.oracleAltarReminderText.setVisible(true);
              this.tweens.add({
                targets: this.oracleAltarReminderText,
                alpha: { from: 0, to: 1 },
                duration: 600,
                ease: 'Sine.easeIn',
              });
              console.log('[LH_ORACLE_ALTAR] reminder shown');
            }
          }
          // ─────────────────────────────────────────────────────────────────────

          const nearSessionSpawn =
            Phaser.Math.Distance.Between(
              px,
              py,
              this.explorationSpawnFootX,
              this.explorationSpawnFootY,
            ) < INTERACTION_PROMPT_SUPPRESS_NEAR_SPAWN_PX;

          // mq-105 Knowledge Echo proximity — player must press Enter to engage (never auto-fires).
          // Uses mq105EchoActive (not mq105EchoSprite?.active) so the fallback marker path works too.
          const mq105NearEcho =
            this.mq105EchoActive &&
            this.time.now >= this.mq105EchoInteractableAfter &&
            Phaser.Math.Distance.Between(px, py, this.mq105EchoX, this.mq105EchoY) < 90;
          if (mq105NearEcho && !dialogueOpen) {
            this.interactionPromptText?.setText('Press Enter to face the Knowledge Echo');
            const padX = 10;
            const padY = 6;
            const textW = Math.max(1, this.interactionPromptText?.width ?? 1);
            const textH = Math.max(1, this.interactionPromptText?.height ?? 1);
            const boxW = Math.round(textW + padX * 2);
            const boxH = Math.round(textH + padY * 2);
            this.interactionPromptBg?.clear();
            this.interactionPromptBg?.fillStyle(0x1e0a3c, 0.80);
            this.interactionPromptBg?.lineStyle(2, 0xc084fc, 0.95);
            this.interactionPromptBg?.fillRoundedRect(-boxW / 2, -boxH, boxW, boxH, 10);
            this.interactionPromptBg?.strokeRoundedRect(-boxW / 2, -boxH, boxW, boxH, 10);
            this.interactionPromptBg?.lineStyle(6, 0xa855f7, 0.12);
            this.interactionPromptBg?.strokeRoundedRect(-boxW / 2, -boxH, boxW, boxH, 12);
            this.interactionPromptRoot?.setPosition(this.mq105EchoX, this.mq105EchoY - 20);
            this.interactionPromptRoot?.setVisible(true);
            if (
              Phaser.Input.Keyboard.JustDown(this.keyInteract) ||
              Phaser.Input.Keyboard.JustDown(this.keyInteractEnter)
            ) {
              // Dispatch window event — React listener launches the knowledge combat overlay.
              window.dispatchEvent(new CustomEvent('lh:mq105-echo-interact'));
              // Deactivate immediately so a second Enter press can't re-trigger.
              this.mq105EchoActive = false;
              // Fade out and destroy whichever visual is present (sprite or fallback marker).
              const echoVisual: Phaser.GameObjects.GameObject | null =
                this.mq105EchoSprite ?? this.mq105EchoFallbackMarker;
              if (echoVisual) {
                this.tweens.add({
                  targets: echoVisual,
                  alpha: 0,
                  duration: 400,
                  onComplete: () => {
                    echoVisual.destroy();
                    if (echoVisual === this.mq105EchoSprite) this.mq105EchoSprite = null;
                    if (echoVisual === this.mq105EchoFallbackMarker) this.mq105EchoFallbackMarker = null;
                  },
                });
              }
            }
          } else if (promptHit && !dialogueOpen && !nearSessionSpawn) {
            const cx = promptHit.x + promptHit.w / 2;
            const y = promptHit.y - 10;
            // Oracle proximity log — fires once when the player first enters the Oracle trigger zone.
            const isOraclePrompt =
              promptHit.kind === 'oracle_encounter' ||
              (promptHit.kind === 'npc_dialogue' && promptHit.npc_id === 'oracle_veiled');
            if (isOraclePrompt) {
              console.log('[LH_ORACLE] player in range', { interactable_id: promptHit.interactable_id });
            }
            let label =
              promptHit.kind === 'npc_dialogue'
                ? 'Press Enter to Speak'
                : 'Enter / E — Interact';
            if (promptHit.kind === 'combat_encounter') {
              label = 'Press Enter to face the Lost Echo';
            } else if (promptHit.kind === 'vocab_battle') {
              label = 'Press Enter to begin the word trial';
            }
            this.interactionPromptText?.setText(label);
            const padX = 10;
            const padY = 6;
            const textW = Math.max(1, this.interactionPromptText?.width ?? 1);
            const textH = Math.max(1, this.interactionPromptText?.height ?? 1);
            const boxW = Math.round(textW + padX * 2);
            const boxH = Math.round(textH + padY * 2);
            this.interactionPromptBg?.clear();
            this.interactionPromptBg?.fillStyle(0x0f172a, 0.72);
            this.interactionPromptBg?.lineStyle(2, 0xf59e0b, 0.95);
            this.interactionPromptBg?.fillRoundedRect(-boxW / 2, -boxH, boxW, boxH, 10);
            this.interactionPromptBg?.strokeRoundedRect(-boxW / 2, -boxH, boxW, boxH, 10);
            // Outer glow stroke.
            this.interactionPromptBg?.lineStyle(6, 0xfbbf24, 0.09);
            this.interactionPromptBg?.strokeRoundedRect(-boxW / 2, -boxH, boxW, boxH, 12);
            this.interactionPromptRoot?.setPosition(cx, y);
            this.interactionPromptRoot?.setVisible(true);
          } else if (!mq105NearEcho) {
            this.interactionPromptRoot?.setVisible(false);
          }

          const portalHit = overlaps.find((row) => row.meta.kind === 'maia_portal')?.meta;
          const enteringPortalFromBottom = Boolean(
            portalHit &&
              moving &&
              iy < 0 &&
              this.player.y > portalHit.y + portalHit.h * 0.92,
          );
          if (portalHit && enteringPortalFromBottom) {
            this.activateTrigger(portalHit);
            return;
          }

          // Portal-like auto triggers (e.g. Guild HQ research). Defaults come from `activation_mode`.
          const autoHitRow = overlaps.find((row) => {
            const m = row.meta;
            if (m.kind === 'maia_portal') return false;
            if (m.kind === 'guild_hq_research' && this.isGuildResearchCooling(m.interactable_id)) return false;
            const mode = m.activation_mode ?? 'interaction';
            if (mode === 'overlap_auto') return true;
            if (mode === 'overlap_auto_bottom') {
              return Boolean(moving && iy < 0 && this.player.y > m.y + m.h * 0.92);
            }
            return false;
          });
          const guildResearchNearRow = autoHitRow
            ? undefined
            : this.triggerBodies.find((row) => {
                const m = row.meta;
                if (m.kind !== 'guild_hq_research') return false;
                if (this.isGuildResearchCooling(m.interactable_id)) return false;
                if ((m.activation_mode ?? 'interaction') !== 'overlap_auto') return false;
                this.triggerMetaToGeom(m, this.scratchTriggerGeom);
                Phaser.Geom.Rectangle.Inflate(this.scratchTriggerGeom, 72, 72);
                if (Phaser.Geom.Intersects.RectangleToRectangle(pGeom, this.scratchTriggerGeom)) return true;
                const dx = Math.max(Math.abs(px - (m.x + m.w / 2)) - m.w / 2, 0);
                const dy = Math.max(Math.abs(py - (m.y + m.h / 2)) - m.h / 2, 0);
                return Math.hypot(dx, dy) <= 96;
              });
          const autoHit = autoHitRow?.meta ?? guildResearchNearRow?.meta;

          this.emitLostEchoDeepPipeline(_kcBeaten.current, lostEchoFightStage, autoHit?.interactable_id ?? null);

          if (autoHit) {
            this.activateTrigger(autoHit);
            return;
          }

          if (
            Phaser.Input.Keyboard.JustDown(this.keyInteract) ||
            Phaser.Input.Keyboard.JustDown(this.keyInteractEnter)
          ) {
            const ih = overlaps[0]?.meta;
            const interactDone = ih ? Boolean(_completionById.current.get(ih.interactable_id)) : false;
            const lostEchoVisitedRecover =
              Boolean(ih) &&
              ih.kind === 'combat_encounter' &&
              ih.tiled_name === LOST_ECHO_TRIGGER_NAME &&
              !_kcBeaten.current;
            if (ih && (!interactDone || lostEchoVisitedRecover)) {
              // When the map has an oracle_altar_zone, oracle_encounter is visual-only; the player uses
              // Space (Scroll open) at the altar instead. Suppress Enter/E activation.
              if (ih.kind === 'oracle_encounter' && _hasOracleAltarZone) return;
              // oracle_altar_zone never fires on Enter — proximity-only.
              if (ih.kind === 'oracle_altar_zone') return;
              if (ih.kind === 'npc_dialogue') {
                this.playTravelerOneShot('cast', 520);
              }
              this.activateTrigger(ih);
            }
          }
        }
      }

      const cfg: Phaser.Types.Core.GameConfig = {
        // Phaser 4 tilemaps render via GPU layers; prefer WebGL when available.
        type: Phaser.AUTO,
        parent: host,
        backgroundColor: '#0b1220',
        width,
        height,
        render: {
          // Nearest filtering + round draw positions — avoids subpixel “vertical slice” tears on 32px strip anims.
          pixelArt: true,
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: LhScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          autoRound: true,
        },
      };

      gameRef.current = new Phaser.Game(cfg);
    };

    // Use ResizeObserver to wait for real dimensions
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 10 && height > 10) {
          initGame(width, height);
          ro.disconnect();
          break;
        }
      }
    });
    ro.observe(host);
    initGame(host.clientWidth, host.clientHeight);

    return () => {
      active = false;
      ro.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [realmId]);

  return (
    <div
      ref={hostRef}
      className={EXPLORATION_VISUAL_GRADE_ENABLED ? 'lh-phaser-host lh-phaser-host--graded' : 'lh-phaser-host'}
      style={{
        flex: 1,
        minHeight: '0',
        minWidth: '0',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0b1220',
      }}
      aria-label="Phaser exploration renderer"
    />
  );
}
