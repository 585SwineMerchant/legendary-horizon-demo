import type { TiledLayer, TiledObject, TiledRoot, TiledProperty } from './lhTiledTypes';

export type ParsedLhTrigger = {
  tiled_object_id: number;
  tiled_name?: string;
  layer_name?: string;
  kind: string;
  /** Present when `lh_kind` is `npc_dialogue` (Milestone 16). */
  npc_id?: string;
  /** Guild HQ desk / manager gate — `lh_realm_id` on the Tiled object. */
  target_realm_id?: string;
  target_quest_id?: string;
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
  parse_warnings: string[];
};

export function tileProperty(dict: TiledProperty[] | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const hit = dict.find((p) => p.name === key);
  if (!hit || hit.value === null || hit.value === undefined) return undefined;
  return String(hit.value);
}

function objectBounds(obj: TiledObject): ParsedLhTrigger['bounds'] {
  return {
    x: obj.x,
    y: obj.y,
    width: obj.width ?? 0,
    height: obj.height ?? 0,
  };
}

function normaliseTriggers(objects: TiledObject[], layerName: string): ParsedLhTrigger[] {
  const out: ParsedLhTrigger[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const lhKindRaw = tileProperty(props, 'lh_kind');
    if (!lhKindRaw && obj.type !== 'lh_trigger_zone') {
      return;
    }
    const kind = lhKindRaw ?? 'unknown';
    if (kind === 'waypoint' || kind === 'fog_region') {
      return;
    }
    out.push({
      tiled_object_id: obj.id,
      tiled_name: obj.name,
      layer_name: layerName,
      kind,
      npc_id: tileProperty(props, 'lh_npc_id'),
      target_realm_id: tileProperty(props, 'lh_realm_id'),
      target_quest_id: tileProperty(props, 'lh_target_quest_id'),
      bounds: objectBounds(obj),
      interaction_label_active:
        tileProperty(props, 'lh_interaction_copy_active') ?? obj.name ?? `Interact #${obj.id}`,
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
      parse_warnings: ['invalid_or_empty_root'],
    };
  }

  if (raw.orientation && raw.orientation !== 'orthogonal') {
    warnings.push('non_orthogonal_map_unsupported');
  }
  if (raw.infinite) {
    warnings.push('infinite_maps_not_supported');
  }

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

  (raw.layers ?? []).forEach((layer: TiledLayer) => {
    if ('type' in layer && layer.type === 'objectgroup' && layer.objects?.length) {
      const layerName = layer.name ?? '';
      triggers.push(...normaliseTriggers(layer.objects, layerName));
      waypoints.push(...normaliseWaypoints(layer.objects, layerName));
      fog_regions.push(...normaliseFog(layer.objects, layerName));
      npc_markers.push(...normaliseNpcs(layer.objects, layerName));
      realm_markers.push(...normaliseRealmMarkers(layer.objects, layerName));
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
    parse_warnings: warnings,
  };
}

export function makeTriggerInteractableId(realmId: string, triggerObjectId: number): string {
  return `${realmId}:obj:${triggerObjectId}`;
}
