/**
 * Single bundled overworld Tiled export for the current leadership demo slice.
 * Intentionally independent of `PlayerSave.current_realm_id`, which tracks
 * active guild / HQ / narrative context — not which tilemap file to load.
 */
export const PRIMARY_WORLD_TILED_DEMO_RELATIVE_PATH = 'aethelwood_demo.json' as const;
/**
 * Active atlas-scale world export. The Phaser renderer already loads this file;
 * the runtime parser should use it too so object layers added to the big map
 * become gameplay metadata.
 */
export const PRIMARY_WORLD_TILED_MAP_RELATIVE_PATH = 'Legendary_Horizon_Map.json' as const;

/**
 * Stable `realm_id` prefix for primary-map trigger interactable IDs (`makeTriggerInteractableId`).
 * Must stay fixed when the player changes guild HQ so visit state matches the one shared explorable surface.
 * Matches historical demo saves that used Aethelwood as the map anchor.
 */
export const PRIMARY_WORLD_TRIGGER_REALM_ID = 'realm_aethelwood' as const;
