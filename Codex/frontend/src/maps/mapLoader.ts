import type { ParsedLhMap } from './parseLhTiledMap';
import { parseLhTiledMap } from './parseLhTiledMap';

export type MapLoadResult =
  | { ok: true; map: ParsedLhMap }
  | { ok: false; errors: string[] };

/**
 * Milestone 4 entry — validates payload shape, parses Tiled JSON, never throws to callers.
 */
export function loadLhTiledMapPayload(payload: unknown): MapLoadResult {
  if (payload === null || payload === undefined) {
    return { ok: false, errors: ['map_payload_null'] };
  }
  if (typeof payload !== 'object') {
    return { ok: false, errors: ['map_payload_not_object'] };
  }
  try {
    const p = payload as { type?: string; layers?: unknown };
    if (p.type !== undefined && p.type !== '' && p.type !== 'map') {
      return { ok: false, errors: ['expected_tiled_type_map'] };
    }
    if (p.layers !== undefined && !Array.isArray(p.layers)) {
      return { ok: false, errors: ['layers_must_be_array'] };
    }
    const map = parseLhTiledMap(payload);
    return { ok: true, map };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, errors: [msg] };
  }
}

/**
 * Safe fallback when fixture JSON is missing or failed validation (exploration UI still mounts).
 */
export function getEmptyParsedLhMap(realmIdHint?: string, extraWarnings: string[] = []): ParsedLhMap {
  return {
    realm_id_hint: realmIdHint,
    footprint: { width_px: 960, height_px: 640 },
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
    parse_warnings: ['empty_fallback_map'].concat(extraWarnings),
  };
}

export function formatParsedMapForDebug(map: ParsedLhMap): string {
  return JSON.stringify(map, null, 2);
}
