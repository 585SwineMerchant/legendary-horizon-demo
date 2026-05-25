import type { TiledLayer, TiledObject, TiledRoot, TiledProperty } from './lhTiledTypes';

export type ParsedLhTrigger = {
  tiled_object_id: number;
  tiled_name?: string;
  layer_name?: string;
  kind: string;
  /**
   * Phaser activation routing:
   * - `interaction`: requires SPACE interact
   * - `overlap_auto`: activates as soon as the player overlaps
   * - `overlap_auto_bottom`: activates on overlap while entering upward from below (portal-like)
   *
   * Comes from optional Tiled prop `lh_activation_mode`, with sane defaults by `lh_kind`.
   */
  activation_mode?: 'interaction' | 'overlap_auto' | 'overlap_auto_bottom';
  /** Present when `lh_kind` is `npc_dialogue` (Milestone 16). */
  npc_id?: string;
  /** Raw Tiled rotation degrees (clockwise, origin at object x/y). */
  rotation_deg?: number;
  /** Guild HQ desk / manager gate — `lh_realm_id` on the Tiled object. */
  target_realm_id?: string;
  target_quest_id?: string;
  /** Optional key for configured external handoff destinations, such as Maia. */
  external_url_key?: string;
  /**
   * Present when `lh_kind` is `fog_clear`.
   * Matches the `fog_key` of the `fog_region` object this trigger is meant to clear.
   * Comes from the Tiled custom property `lh_fog_key` on the object.
   */
  fog_key?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  interaction_label_active: string;
  interaction_label_complete: string;
};

export type ParsedLhWaypoint = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  waypoint_key?: string;
  bounds: ParsedLhTrigger['bounds'];
};

export type ParsedLhFogRegion = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  fog_key?: string;
  bounds: ParsedLhTrigger['bounds'];
};

export type ParsedLhNpcMarker = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  npc_id?: string;
  bounds: ParsedLhTrigger['bounds'];
};

export type ParsedLhRealmMarker = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  realm_id?: string;
  bounds: ParsedLhTrigger['bounds'];
};

export type ParsedLhSpawnPoint = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  realm_id?: string;
  spawn_key?: string;
  bounds: ParsedLhTrigger['bounds'];
};

export type ParsedLhCollisionRegion = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  collision_kind?: string;
  realm_id?: string;
  bounds: ParsedLhTrigger['bounds'];
};

/**
 * Tiled-authored spawn marker for a roaming hack-and-slash Lost Echo (or a small group of them).
 * Place in Tiled with `lh_kind = roaming_lost_echo_spawn`. All tuning fields are optional —
 * unset properties fall back to the global constants in `PhaserExplorationView.tsx`.
 *
 * Rectangle objects: the rectangle's center is the spawn origin (each roamer wanders within
 * `wander_radius_px` of that center).
 * Point objects: the object's `x`/`y` is the spawn origin directly.
 */
export type ParsedLhRoamingLostEchoSpawn = {
  tiled_object_id: number;
  name?: string;
  layer_name?: string;
  bounds: ParsedLhTrigger['bounds'];
  /** Center of the rectangle (or point coords for point objects). Convenience for the spawner. */
  center_x: number;
  center_y: number;
  count: number;
  hp?: number;
  aggro_radius_px?: number;
  deaggro_radius_px?: number;
  wander_radius_px?: number;
  wander_speed?: number;
  chase_speed?: number;
  attack_range_px?: number;
  attack_cooldown_ms?: number;
  spawn_group?: string;
  respawn: boolean;
  debug_label?: string;
  /**
   * Tiled property keys that were dropped because the canonical (unprefixed) form was also
   * present on the same object — surfaced for a one-line DEV warn at spawn time.
   * Empty when the object used only one form (canonical or alias) for every field.
   */
  ignored_aliases: string[];
};

export type ParsedLhMapFootprint = {
  width_px: number;
  height_px: number;
};

export type ParsedLhTileLayerSummary = {
  id: number;
  name: string;
  width: number;
  height: number;
  tile_count: number;
  compression?: string;
  visible: boolean;
};

export type ParsedLhObjectLayerSummary = {
  id: number;
  name: string;
  object_count: number;
  visible: boolean;
};

export type ParsedLhMap = {
  realm_id_hint?: string;
  footprint: ParsedLhMapFootprint;
  tile_layers: ParsedLhTileLayerSummary[];
  object_layer_summaries: ParsedLhObjectLayerSummary[];
  triggers: ParsedLhTrigger[];
  waypoints: ParsedLhWaypoint[];
  fog_regions: ParsedLhFogRegion[];
  npc_markers: ParsedLhNpcMarker[];
  /** Milestone 19 — realm anchors exported from Tiled for Act III map bridging. */
  realm_markers: ParsedLhRealmMarker[];
  spawn_points: ParsedLhSpawnPoint[];
  collision_regions: ParsedLhCollisionRegion[];
  /** Tiled-driven spawn markers for roaming hack-and-slash Lost Echoes. */
  roaming_lost_echo_spawns: ParsedLhRoamingLostEchoSpawn[];
  parse_warnings: string[];
};

export function tileProperty(dict: TiledProperty[] | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const hit = dict.find((p) => p.name === key);
  if (!hit || hit.value === null || hit.value === undefined) return undefined;
  return String(hit.value);
}

/**
 * Read a numeric Tiled property. Tolerates both Tiled JSON shapes:
 * - typed: `{ name, type: 'int' | 'float', value: 12 }` (already a number)
 * - stringy: `{ name, value: '12' }` (legacy or hand-edited maps)
 * Returns `undefined` for missing, blank, or non-numeric values.
 */
export function tilePropertyNumber(dict: TiledProperty[] | undefined, key: string): number | undefined {
  const raw = tileProperty(dict, key);
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Read a boolean Tiled property. Accepts native booleans plus the common stringy forms
 * (`'true' | 'false' | '1' | '0' | 'yes' | 'no'`). Defaults to `undefined` if the
 * property is missing so callers can apply their own default.
 */
export function tilePropertyBoolean(dict: TiledProperty[] | undefined, key: string): boolean | undefined {
  if (!dict) return undefined;
  const hit = dict.find((p) => p.name === key);
  if (!hit || hit.value === null || hit.value === undefined) return undefined;
  if (typeof hit.value === 'boolean') return hit.value;
  const s = String(hit.value).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return undefined;
}

function objectBounds(obj: TiledObject, warnings?: string[]): ParsedLhTrigger['bounds'] {
  const w = obj.width ?? 0;
  const h = obj.height ?? 0;
  const rotDeg = typeof obj.rotation === 'number' ? obj.rotation : 0;
  const rot = ((rotDeg % 360) + 360) % 360;
  // Treat ~360° as 0° (Tiled sometimes emits tiny float noise like 359.778).
  const nearZero = rot < 0.5 || rot > 359.5;
  if (!rotDeg || nearZero || w === 0 || h === 0) {
    return { x: obj.x, y: obj.y, width: w, height: h };
  }

  // Tiled object rotation is around the object's x/y (top-left origin for rectangles).
  // We normalize by computing the axis-aligned bounding box of the rotated rectangle.
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pts = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ].map((p) => ({
    x: obj.x + p.x * cos - p.y * sin,
    y: obj.y + p.x * sin + p.y * cos,
  }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  warnings?.push(`rotated_object_aabb:${obj.id}:${rotDeg.toFixed(3)}`);
  return { x: minX, y: minY, width: Math.max(maxX - minX, 0), height: Math.max(maxY - minY, 0) };
}

function normaliseTriggers(objects: TiledObject[], layerName: string, warnings: string[]): ParsedLhTrigger[] {
  const out: ParsedLhTrigger[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const lhKindRaw = tileProperty(props, 'lh_kind');
    if (!lhKindRaw && obj.type !== 'lh_trigger_zone') {
      return;
    }
    const kind = lhKindRaw ?? 'unknown';
    if (kind === 'waypoint' || kind === 'fog_region' || kind === 'roaming_lost_echo_spawn' || kind === 'collision') {
      return;
    }
    const modeRaw = String(tileProperty(props, 'lh_activation_mode') ?? '').trim().toLowerCase();
    const objectName = obj.name?.trim() || tileProperty(props, 'name');
    const combatLike = kind === 'combat_encounter' || kind === 'vocab_battle';
    /** Tiled sometimes uses `proximity` / `overlap`; treat like `overlap_auto` for combat-style triggers only. */
    const proximityAsOverlap =
      combatLike && (modeRaw === 'proximity' || modeRaw === 'overlap' || modeRaw === 'overlap_proximity');
    const activation_mode: ParsedLhTrigger['activation_mode'] =
      modeRaw === 'overlap_auto' || proximityAsOverlap
        ? 'overlap_auto'
        : modeRaw === 'overlap_auto_bottom'
          ? 'overlap_auto_bottom'
          : modeRaw === 'interaction'
            ? 'interaction'
            : kind === 'maia_portal'
              ? 'overlap_auto_bottom'
              : kind === 'guild_hq_research' || kind === 'fog_clear'
                ? 'overlap_auto'
                : 'interaction';
    out.push({
      tiled_object_id: obj.id,
      tiled_name: objectName,
      layer_name: layerName,
      kind,
      activation_mode,
      npc_id: tileProperty(props, 'lh_npc_id'),
      rotation_deg: typeof obj.rotation === 'number' ? obj.rotation : undefined,
      target_realm_id: tileProperty(props, 'lh_target_realm_id') ?? tileProperty(props, 'lh_realm_id'),
      target_quest_id: tileProperty(props, 'lh_target_quest_id'),
      external_url_key: tileProperty(props, 'lh_external_url_key'),
      fog_key: tileProperty(props, 'lh_fog_key'),
      bounds: objectBounds(obj, warnings),
      interaction_label_active:
        tileProperty(props, 'lh_interaction_copy_active') ?? objectName ?? `Interact #${obj.id}`,
      interaction_label_complete:
        tileProperty(props, 'lh_interaction_copy_complete') ?? 'Interaction sealed — review your quest log.',
    });
  });
  return out;
}

function normaliseWaypoints(objects: TiledObject[], layerName: string): ParsedLhWaypoint[] {
  const out: ParsedLhWaypoint[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    const isWp = kind === 'waypoint' || obj.type === 'lh_waypoint';
    if (!isWp) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      waypoint_key: tileProperty(props, 'lh_waypoint_key') ?? obj.name,
      bounds: objectBounds(obj),
    });
  });
  return out;
}

function normaliseFog(objects: TiledObject[], layerName: string): ParsedLhFogRegion[] {
  const out: ParsedLhFogRegion[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    const isFog = kind === 'fog_region' || obj.type === 'lh_fog_region';
    if (!isFog) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      fog_key: tileProperty(props, 'lh_fog_key') ?? obj.name,
      bounds: objectBounds(obj),
    });
  });
  return out;
}

function normaliseNpcs(objects: TiledObject[], layerName: string): ParsedLhNpcMarker[] {
  const out: ParsedLhNpcMarker[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    if (kind === 'npc_dialogue') {
      return;
    }
    const isNpc = obj.type === 'lh_npc_marker';
    if (!isNpc) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      npc_id: tileProperty(props, 'lh_npc_id') ?? obj.name,
      bounds: objectBounds(obj),
    });
  });
  return out;
}

function summariseTileLayers(raw: TiledRoot): ParsedLhTileLayerSummary[] {
  const out: ParsedLhTileLayerSummary[] = [];
  (raw.layers ?? []).forEach((layer: TiledLayer) => {
    if ('type' in layer && layer.type === 'tilelayer') {
      const data = layer.data;
      out.push({
        id: layer.id,
        name: layer.name ?? 'tilelayer',
        width: layer.width ?? raw.width,
        height: layer.height ?? raw.height,
        tile_count: Array.isArray(data) ? data.length : 0,
        compression: layer.compression,
        visible: layer.visible !== false,
      });
    }
  });
  return out;
}

function summariseObjectLayers(raw: TiledRoot): ParsedLhObjectLayerSummary[] {
  const out: ParsedLhObjectLayerSummary[] = [];
  (raw.layers ?? []).forEach((layer: TiledLayer) => {
    if ('type' in layer && layer.type === 'objectgroup') {
      out.push({
        id: layer.id,
        name: layer.name ?? 'objects',
        object_count: layer.objects?.length ?? 0,
        visible: layer.visible !== false,
      });
    }
  });
  return out;
}

/**
 * Prefer the canonical (unprefixed) Tiled property; fall back to the legacy `lh_*` alias.
 * If both are present, return the canonical value and append the alias key to `ignoredAliases`
 * so the spawner can DEV-warn that the alias was dropped.
 */
function preferCanonicalNumber(
  props: TiledProperty[],
  canonical: string,
  alias: string,
  ignoredAliases: string[],
): number | undefined {
  const c = tilePropertyNumber(props, canonical);
  const a = tilePropertyNumber(props, alias);
  if (c !== undefined && a !== undefined) ignoredAliases.push(alias);
  return c ?? a;
}

function preferCanonicalString(
  props: TiledProperty[],
  canonical: string,
  alias: string,
  ignoredAliases: string[],
): string | undefined {
  const c = tileProperty(props, canonical);
  const a = tileProperty(props, alias);
  if (c !== undefined && a !== undefined) ignoredAliases.push(alias);
  return c ?? a;
}

function preferCanonicalBoolean(
  props: TiledProperty[],
  canonical: string,
  alias: string,
  ignoredAliases: string[],
): boolean | undefined {
  const c = tilePropertyBoolean(props, canonical);
  const a = tilePropertyBoolean(props, alias);
  if (c !== undefined && a !== undefined) ignoredAliases.push(alias);
  return c ?? a;
}

/**
 * Parse Tiled `lh_kind = roaming_lost_echo_spawn` markers into `ParsedLhRoamingLostEchoSpawn`s.
 *
 * Supported per-object properties (precedence: canonical > legacy alias > default).
 * If both forms are set on the same object, the canonical wins and the alias is reported via
 * `ignored_aliases` so the spawner can DEV-warn.
 *
 *   ┌───────────────────────┬──────────────────────────┬────────────┐
 *   │ canonical (preferred) │ legacy alias             │ type       │
 *   ├───────────────────────┼──────────────────────────┼────────────┤
 *   │ count                 │ lh_count                 │ int (≥1)   │
 *   │ hp                    │ lh_hp                    │ int        │
 *   │ aggro_radius_px       │ lh_aggro_radius_px       │ float      │
 *   │ deaggro_radius_px     │ lh_deaggro_radius_px     │ float      │
 *   │ wander_radius_px      │ lh_wander_radius_px      │ float      │
 *   │ wander_speed          │ lh_wander_speed          │ float      │
 *   │ chase_speed           │ lh_chase_speed           │ float      │
 *   │ attack_range_px       │ lh_attack_range_px       │ float      │
 *   │ attack_cooldown_ms    │ lh_attack_cooldown_ms    │ int        │
 *   │ spawn_group           │ lh_spawn_group           │ string     │
 *   │ respawn               │ lh_respawn               │ bool       │
 *   │ debug_label           │ lh_debug_label           │ string     │
 *   └───────────────────────┴──────────────────────────┴────────────┘
 *
 * Notes:
 *   - `lh_kind = roaming_lost_echo_spawn` is the only field that stays `lh_`-prefixed; it is
 *     the Tiled-wide object classifier and shares the convention with every other LH kind.
 *   - Defaults for unset numeric fields come from `DEFAULT_ROAMING_LOST_ECHO_CONFIG`
 *     (defined in `PhaserExplorationView.tsx` next to the global tuning constants).
 *   - `respawn` defaults to `false`. `count` defaults to `1`.
 *   - For rectangle objects the spawn origin is the rectangle center; for point objects it is
 *     the object's `x`/`y` directly.
 */
function normaliseRoamingLostEchoSpawns(
  objects: TiledObject[],
  layerName: string,
  warnings: string[],
): ParsedLhRoamingLostEchoSpawn[] {
  const out: ParsedLhRoamingLostEchoSpawn[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    if (kind !== 'roaming_lost_echo_spawn') return;

    const bounds = objectBounds(obj, warnings);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      warnings.push(`roaming_spawn_invalid_origin:${obj.id}`);
      return;
    }

    const ignored: string[] = [];
    const rawCount = preferCanonicalNumber(props, 'count', 'lh_count', ignored);
    // Sanitize: clamp to [1, 32]. Authors who type a large number (or stray decimal) by accident
    // shouldn't be able to spawn a thousand roamers and lock the frame loop.
    const ROAMING_SPAWN_COUNT_MAX = 32;
    const requestedCount = Math.floor(rawCount ?? 1);
    const count = Math.min(
      ROAMING_SPAWN_COUNT_MAX,
      Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 1),
    );
    if (rawCount !== undefined && requestedCount !== count) {
      warnings.push(`roaming_spawn_count_clamped:obj=${obj.id}:requested=${rawCount}:applied=${count}`);
    }

    const parsed: ParsedLhRoamingLostEchoSpawn = {
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      bounds,
      center_x: cx,
      center_y: cy,
      count,
      hp: preferCanonicalNumber(props, 'hp', 'lh_hp', ignored),
      aggro_radius_px: preferCanonicalNumber(props, 'aggro_radius_px', 'lh_aggro_radius_px', ignored),
      deaggro_radius_px: preferCanonicalNumber(props, 'deaggro_radius_px', 'lh_deaggro_radius_px', ignored),
      wander_radius_px: preferCanonicalNumber(props, 'wander_radius_px', 'lh_wander_radius_px', ignored),
      wander_speed: preferCanonicalNumber(props, 'wander_speed', 'lh_wander_speed', ignored),
      chase_speed: preferCanonicalNumber(props, 'chase_speed', 'lh_chase_speed', ignored),
      attack_range_px: preferCanonicalNumber(props, 'attack_range_px', 'lh_attack_range_px', ignored),
      attack_cooldown_ms: preferCanonicalNumber(props, 'attack_cooldown_ms', 'lh_attack_cooldown_ms', ignored),
      spawn_group: preferCanonicalString(props, 'spawn_group', 'lh_spawn_group', ignored),
      respawn: preferCanonicalBoolean(props, 'respawn', 'lh_respawn', ignored) ?? false,
      debug_label:
        preferCanonicalString(props, 'debug_label', 'lh_debug_label', ignored) ?? obj.name,
      ignored_aliases: ignored,
    };

    if (ignored.length > 0) {
      warnings.push(`roaming_spawn_alias_ignored:obj=${obj.id}:keys=${ignored.join(',')}`);
    }

    out.push(parsed);
  });
  return out;
}

function normaliseRealmMarkers(objects: TiledObject[], layerName: string): ParsedLhRealmMarker[] {
  const out: ParsedLhRealmMarker[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    const isMarker = kind === 'realm_marker' || obj.type === 'lh_realm_marker';
    if (!isMarker) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      realm_id: tileProperty(props, 'lh_realm_id') ?? obj.name,
      bounds: objectBounds(obj),
    });
  });
  return out;
}

function normaliseSpawnPoints(objects: TiledObject[], layerName: string): ParsedLhSpawnPoint[] {
  const out: ParsedLhSpawnPoint[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    const isSpawn = kind === 'spawn_point' || obj.type === 'lh_spawn_point';
    if (!isSpawn) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      realm_id: tileProperty(props, 'lh_realm_id'),
      spawn_key: tileProperty(props, 'lh_spawn_key') ?? obj.name,
      bounds: objectBounds(obj),
    });
  });
  return out;
}

function normaliseCollisionRegions(objects: TiledObject[], layerName: string): ParsedLhCollisionRegion[] {
  const out: ParsedLhCollisionRegion[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const kind = tileProperty(props, 'lh_kind');
    const isCollision = kind === 'collision' || obj.type === 'lh_collision';
    if (!isCollision) return;
    out.push({
      tiled_object_id: obj.id,
      name: obj.name,
      layer_name: layerName,
      collision_kind: tileProperty(props, 'lh_collision_kind'),
      realm_id: tileProperty(props, 'lh_realm_id'),
      bounds: objectBounds(obj),
    });
  });
  return out;
}

/**
 * Parses a Tiled JSON export into LH-native scene metadata (triggers, waypoints, fog, NPC markers, layer summaries).
 * Tolerates missing layers and unknown `lh_*` kinds — see `parse_warnings`.
 */
export function parseLhTiledMap(payload: unknown): ParsedLhMap {
  const raw = payload as TiledRoot;
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      footprint: { width_px: 640, height_px: 480 },
      tile_layers: [],
      object_layer_summaries: [],
      triggers: [],
      waypoints: [],
      fog_regions: [],
      npc_markers: [],
      realm_markers: [],
      spawn_points: [],
      collision_regions: [],
      roaming_lost_echo_spawns: [],
      parse_warnings: ['invalid_or_empty_root'],
    };
  }

  if (raw.orientation && raw.orientation !== 'orthogonal') {
    warnings.push('non_orthogonal_map_unsupported');
  }
  if (raw.infinite) {
    warnings.push('infinite_maps_not_supported');
  }

  (raw.tilesets ?? []).forEach((ts) => {
    const t = ts as { source?: string; image?: string };
    const src = typeof t.source === 'string' ? t.source.trim() : '';
    if (src) {
      warnings.push(`external_tileset_ref:${src} — Embed tilesets before export (Phaser cannot fetch .tsx from disk)`);
    }
    const img = typeof t.image === 'string' ? t.image : '';
    if (
      img &&
      !img.replace(/\\/g, '/').includes('assets/maps/') &&
      (img.includes('..') || img.includes('Game Map') || /^[A-Za-z]:/.test(img))
    ) {
      warnings.push(
        `tileset_image_not_served:${img.slice(0, 96)} — Use paths like assets/maps/Sheet.png next to the JSON (see TILED_WORLD_MAP_BUILD_GUIDE)`,
      );
    }
  });

  const tw = Math.max(raw.tilewidth ?? 16, 1);
  const th = Math.max(raw.tileheight ?? 16, 1);
  const footprint: ParsedLhMapFootprint = {
    width_px: Math.max(raw.width ?? 1, 1) * tw,
    height_px: Math.max(raw.height ?? 1, 1) * th,
  };

  const realm_id_hint = tileProperty(raw.properties ?? [], 'lh_realm_id') ?? undefined;

  const triggers: ParsedLhTrigger[] = [];
  const waypoints: ParsedLhWaypoint[] = [];
  const fog_regions: ParsedLhFogRegion[] = [];
  const npc_markers: ParsedLhNpcMarker[] = [];
  const realm_markers: ParsedLhRealmMarker[] = [];
  const spawn_points: ParsedLhSpawnPoint[] = [];
  const collision_regions: ParsedLhCollisionRegion[] = [];
  const roaming_lost_echo_spawns: ParsedLhRoamingLostEchoSpawn[] = [];

  (raw.layers ?? []).forEach((layer: TiledLayer) => {
    if ('type' in layer && layer.type === 'objectgroup' && layer.objects?.length) {
      const layerName = layer.name ?? '';
      triggers.push(...normaliseTriggers(layer.objects, layerName, warnings));
      waypoints.push(...normaliseWaypoints(layer.objects, layerName));
      fog_regions.push(...normaliseFog(layer.objects, layerName));
      npc_markers.push(...normaliseNpcs(layer.objects, layerName));
      realm_markers.push(...normaliseRealmMarkers(layer.objects, layerName));
      spawn_points.push(...normaliseSpawnPoints(layer.objects, layerName));
      collision_regions.push(...normaliseCollisionRegions(layer.objects, layerName));
      roaming_lost_echo_spawns.push(
        ...normaliseRoamingLostEchoSpawns(layer.objects, layerName, warnings),
      );
    }
  });

  return {
    realm_id_hint,
    footprint,
    tile_layers: summariseTileLayers(raw),
    object_layer_summaries: summariseObjectLayers(raw),
    triggers,
    waypoints,
    fog_regions,
    npc_markers,
    realm_markers,
    spawn_points,
    collision_regions,
    roaming_lost_echo_spawns,
    parse_warnings: warnings,
  };
}

export function makeTriggerInteractableId(realmId: string, triggerObjectId: number): string {
  return `${realmId}:obj:${triggerObjectId}`;
}
