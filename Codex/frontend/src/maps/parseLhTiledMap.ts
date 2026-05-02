import type { TiledLayer, TiledObject, TiledRoot, TiledProperty } from './lhTiledTypes';

export type ParsedLhTrigger = {
  tiled_object_id: number;
  tiled_name?: string;
  /** Normalised LH trigger classification (usually `lh_kind` custom property). */
  kind: string;
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

export type ParsedLhMapFootprint = {
  width_px: number;
  height_px: number;
};

export type ParsedLhMap = {
  realm_id_hint?: string;
  footprint: ParsedLhMapFootprint;
  triggers: ParsedLhTrigger[];
};

export function tileProperty(dict: TiledProperty[] | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const hit = dict.find((p) => p.name === key);
  if (!hit || hit.value === null || hit.value === undefined) return undefined;
  return String(hit.value);
}

function normaliseTriggers(objects: TiledObject[]): ParsedLhTrigger[] {
  const out: ParsedLhTrigger[] = [];
  objects.forEach((obj) => {
    const props = obj.properties ?? [];
    const lhKindRaw = tileProperty(props, 'lh_kind');
    if (!lhKindRaw && obj.type !== 'lh_trigger_zone') {
      return;
    }
    const kind = lhKindRaw ?? 'unknown';
    out.push({
      tiled_object_id: obj.id,
      tiled_name: obj.name,
      kind,
      target_quest_id: tileProperty(props, 'lh_target_quest_id'),
      bounds: {
        x: obj.x,
        y: obj.y,
        width: obj.width ?? 0,
        height: obj.height ?? 0,
      },
      interaction_label_active:
        tileProperty(props, 'lh_interaction_copy_active') ??
        obj.name ??
        `Interact #${obj.id}`,
      interaction_label_complete:
        tileProperty(props, 'lh_interaction_copy_complete') ??
        'Interaction sealed — review your quest log.',
    });
  });
  return out;
}

/**
 * Lightweight adapter translating a single Tiled export into LH-native trigger metadata.
 * Tile layers are ignored intentionally for Day 2 scaffolding.
 */
export function parseLhTiledMap(payload: unknown): ParsedLhMap {
  const raw = payload as TiledRoot;
  const footprint: ParsedLhMapFootprint = {
    width_px: Math.max(raw.width ?? 1, 1) * (raw.tilewidth ?? 16),
    height_px: Math.max(raw.height ?? 1, 1) * (raw.tileheight ?? 16),
  };

  const realm_id_hint =
    tileProperty(raw.properties ?? [], 'lh_realm_id') ?? undefined;

  const triggers: ParsedLhTrigger[] = [];
  (raw.layers ?? []).forEach((layer: TiledLayer) => {
    if ('type' in layer && layer.type === 'objectgroup' && layer.objects?.length) {
      triggers.push(...normaliseTriggers(layer.objects));
    }
  });

  return {
    realm_id_hint,
    footprint,
    triggers,
  };
}

export function makeTriggerInteractableId(realmId: string, triggerObjectId: number): string {
  return `${realmId}:obj:${triggerObjectId}`;
}
