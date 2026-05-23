# Legendary Horizon Tiled World Map Build Guide

This guide is for turning the current atlas-inspired Tiled map into the playable overworld. The goal is not to invent a new world layout. The goal is to recreate the existing World Atlas image as closely as practical, then add gameplay structure on top.

Current source map:

- Authoring file: `Game Map/Legendary_Horizon_Map.tmx` (or your `.tmx` location)
- **Canonical runtime JSON (Phaser + bundled parser):** `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`
- Tile PNGs the map references: `Codex/frontend/public/assets/maps/` (paths inside JSON look like `assets/maps/….png`)
- Optional mirror copy: `Codex/tiled/Legendary_Horizon_Map.json` (keep in sync if you use it)
- Current size: 400 x 300 tiles, 32 px tiles
- Current painted layers: `Main`, `Hillside`, `forest 4`, `Hillside 2`, `forest layer 3`, `Guild HQs`

## Map Direction

The playable map should remain anchored to the existing World Atlas composition:

- Aethelwood Farmsteads in the northwest forest.
- Valor's Watchtower north/northwest.
- Monolith of Masonry in the northern/eastern mountain country.
- High Council Hall in the central north.
- Chronicler's Spire near the central-west landmark area.
- Mercantile's Citadel on the western/southwestern coast.
- Gilded Vault, Crossroads Haven, Bard's Beacon, Archives of Ascension, and nearby civic/settlement spaces through the center.
- Empath's Enclave in the southwest green/wooded region.
- Alchemical Observatory toward the southern mountain/science region.
- Odyssey's Harbor on the southern/southeastern coast.
- Aurora Apothecary in the southeast health/coastal region.
- Etheric Nexus in the southeast enchanted/tech forest.
- Vulcanis Forge in the eastern volcanic region.

The old atlas art still visually includes the removed Energy/Arcanum realm. Current production canon is 16 realms. Do not add an active 17th realm unless the project owner explicitly changes canon.

## Layer Plan

Keep the existing art layers and add a few named object layers. Use object layers for gameplay metadata so visual tile painting can keep evolving without breaking game logic.

### Existing Tile Layers

| Layer | Purpose |
| --- | --- |
| `Main` | Base terrain, grass, water, coastline base. |
| `Hillside` | Primary cliff/plateau/mountain edge pass. |
| `Hillside 2` | Secondary cliff/plateau details. |
| `forest 4` | Primary forest canopy/tree pass. |
| `forest layer 3` | Secondary forest density/details. |
| `Guild HQs` | 16 guild building sprites and major structures. |

### Recommended New Object Layers

| Object layer | Purpose |
| --- | --- |
| `lh_spawn` | Player start points and debug spawn points. |
| `lh_collision` | Blocking rectangles/polygons for water, cliffs, dense forest, buildings, volcanic hazards. |
| `lh_triggers` | Quest, NPC, encounter, guild, bridge, raft, and traversal triggers. |
| `lh_fog` | Fog regions used by Act III reveal logic. |
| `lh_waypoints` | Named route points, checkpoints, gates, docks, passes, and classroom progress beats. |
| `lh_realms` | Realm marker rectangles/anchors aligned to the atlas/HQ locations. |
| `lh_traversal` | Unlock-gated traversal zones such as bridges, raft docks, mountain passes, and heat barriers. |

If Tiled layer clutter gets annoying, group layers by prefix visually, but keep the exported layer names stable.

## Object Naming Rules

Use predictable names. The name should describe what a human sees in Tiled. The `lh_*` properties describe what the game does.

Good examples:

- `spawn_aethelwood_start`
- `bridge_old_root_crossing`
- `dock_west_inlet_raft`
- `fog_aethelwood_outer_woods`
- `realm_marker_vulcanis_forge`
- `collision_north_mountain_wall_01`
- `gate_plateau_climbing_sigils`

Avoid names like `Object 1`, `bridge`, or `test`.

## Common Properties

These are safe to use on any object.

| Property | Type | Example | Meaning |
| --- | --- | --- | --- |
| `lh_kind` | string | `waypoint` | Gameplay classification. |
| `lh_realm_id` | string | `realm_aethelwood` | Realm this object belongs to. |
| `lh_required_item_id` | string | `item_moonlit_bridge_charm` | Item required to cross/use. |
| `lh_unlocks_item_id` | string | `item_folded_raft` | Item granted by this interaction. |
| `lh_target_quest_id` | string | `mq_act1_manifest_support` | Quest affected by the trigger. |
| `lh_interaction_copy_active` | string | `Cross the moonlit bridge` | Button/prompt text before completion. |
| `lh_interaction_copy_complete` | string | `The bridge remembers your crossing.` | Prompt after completion. |
| `lh_notes` | string | `Beta gate; tune later.` | Human-only author note. |

## Supported `lh_kind` Values

The parser already understands these names. Some are fully handled today; others are recognized and ready for implementation.

| `lh_kind` | Status | Use |
| --- | --- | --- |
| `quest_advance` | Active | Advances the current active quest when `lh_target_quest_id` matches. |
| `npc_dialogue` | Active | Opens NPC dialogue using `lh_npc_id`. |
| `combat_encounter` | Active | Opens an encounter overlay. |
| `vocab_battle` | Active | Opens a vocabulary battle overlay. |
| `waypoint` | Parsed | Marks a route point/checkpoint. |
| `fog_region` | Parsed | Marks an Act III fog reveal region. |
| `realm_marker` | Parsed | Marks a realm/HQ anchor on the playable map. |
| `guild_hq_research` | Stub | Should become HQ research/atlas reveal behavior. |
| `guild_manager_hq` | Stub | Should become Act IV manager gate behavior. |
| `guild_interview_invite` | Stub | Should become GT-102 invitation behavior. |
| `fog_clear` | Stub | Should clear one or more fog regions. |
| `quest_start` | Stub | Should unlock/start a quest. |
| `quest_complete` | Stub | Should complete a quest. |
| `external_link` | Stub | Should open approved classroom tools. |

## Traversal Items

Traversal items should make the map feel like an RPG without blocking classroom progress too harshly. Each traversal gate should have a visual object, a required item, and a fallback route if the lesson needs flexibility.

### Recommended Initial Items

| Item ID | Display idea | Unlocks |
| --- | --- | --- |
| `item_moonlit_bridge_charm` | Magical bridge charm | Root/stone bridges over narrow rivers. |
| `item_folded_raft` | Folded raft | Short water crossings between docks and islands. |
| `item_cliffwalk_sigils` | Cliffwalk sigils | Mountain stairways, plateau paths, ridge shortcuts. |
| `item_ember_ward` | Ember ward | Volcanic terrain near Vulcanis Forge. |
| `item_forest_wayfinder` | Forest wayfinder | Dense Aethelwood shortcuts and hidden grove routes. |

### Traversal Object Pattern

For a bridge gate:

- Layer: `lh_traversal`
- Name: `bridge_old_root_crossing`
- Type: `lh_traversal_gate`
- Properties:
  - `lh_kind`: `traversal_gate`
  - `lh_gate_type`: `bridge`
  - `lh_required_item_id`: `item_moonlit_bridge_charm`
  - `lh_realm_id`: `realm_aethelwood`
  - `lh_interaction_copy_active`: `The roots will braid into a bridge if you carry the charm.`
  - `lh_interaction_copy_complete`: `The moonlit roots hold steady.`

For a raft dock:

- Layer: `lh_traversal`
- Name: `dock_west_inlet_raft`
- Type: `lh_traversal_gate`
- Properties:
  - `lh_kind`: `traversal_gate`
  - `lh_gate_type`: `raft`
  - `lh_required_item_id`: `item_folded_raft`
  - `lh_target_waypoint_key`: `dock_south_isle`

The parser does not fully implement `traversal_gate` yet. Use the convention now so the code can support it without re-authoring the map.

## Collision Rules

Use object rectangles/polygons first. Avoid relying only on tile IDs for collision until the tile collision pipeline is deliberately built.

Recommended collision categories:

| `lh_collision_kind` | Blocks |
| --- | --- |
| `water` | Walking unless raft/bridge gate is active. |
| `cliff` | Walking unless pass/stair object is active. |
| `dense_forest` | Walking unless path/wayfinder gate allows it. |
| `building` | Walking through HQ/building footprints. |
| `volcanic_hazard` | Walking unless ember ward is active. |
| `map_edge` | Leaving intended playable world. |

Collision objects should be generous but readable. It is better for early beta to have slightly simple boundaries than visually perfect but frustrating collision.

### How to block buildings (Master Scribe tent, Maia portal, guild HQ)

The runtime reads **`lh_collision`** object layers (see `parseLhTiledMap.ts` → `collision_regions`). Each blocking shape needs:

| Field | Value |
| --- | --- |
| Layer | `lh_collision` (create this object layer if missing) |
| Object type | `lh_collision` **or** custom property `lh_kind` = `collision` |
| Shape | Rectangle (or polygon) sized to the **footprint** players should not walk through |
| `lh_collision_kind` | `building` for tents/HQs/portals; use `dense_forest` for tree walls |

**Examples:**

- **Master Scribe tent** — one rectangle around the tent canvas (not the whole trigger zone). Keep the existing `npc_dialogue` trigger slightly larger so “Speak” still feels easy.
- **Mirror of Maia** — rectangle around the stone ring / portal base so the traveler cannot stand inside the mirror art. The `maia_portal` trigger can stay a bit larger for overlap.
- **Guild HQ (Aethelwood)** — rectangle around the guild hall footprint on the `Guild HQs` art. Do **not** rely on the `guild_hq_research` trigger rectangle for collision; triggers are for story, collision is separate.

After export, reload the map: Phaser adds invisible static bodies from these regions (see `PhaserExplorationView` fog/solid static groups).

Hillside / forest **tile layers** already collide via `SOLID_TILE_LAYER_NAMES`; use object collision for props on `Main` or `Guild HQs`.

### Windmill animation

Paint the windmill using the **`Windmill_baked_anim`** tileset (7×4 tiles per frame). The game advances frames automatically (8-frame loop). Ensure `Windmill_baked_anim.png` lives under `Codex/frontend/public/assets/maps/` with the same name as the tileset.

### Crops (rustle + harvest)

- **`crops` tile layer** — walking nearby rustles; **A-button / attack** in range removes the tile (harvest flash). No solid collision by default.
- **Tile object on a layer whose name includes `crops`** — same rustle tween as tall grass.
- To make a crop **solid**, add a separate `lh_collision` rectangle (usually worse UX in fields — prefer rustle/harvest).

## Fog Rules

Fog regions belong on `lh_fog`.

Suggested properties:

- `lh_kind`: `fog_region`
- `lh_fog_key`: stable key, such as `fog_aethelwood_outer_woods`
- `lh_realm_id`: nearest realm
- `lh_reveal_requires`: optional item/quest key, such as `mq_act2_vault_of_runes`

Initial beta fog should reveal big chunks, not tiny squares. Use fog to create direction and curiosity, not busywork.

## Realm Markers

Realm markers belong on `lh_realms`. Put them near the HQ sprite or the center of the region, not necessarily exactly on the door tile.

Suggested properties:

- `lh_kind`: `realm_marker`
- `lh_realm_id`: canon realm ID
- `lh_display_name`: optional human label
- `lh_unlock_phase`: optional, such as `act3`

For the first pass, add all 16 realm markers so the code can later compare playable map placement against the World Atlas pins.

## First Playable Aethelwood Slice

Start small. This slice should prove the workflow before the whole atlas is wired.

### Art Pass

- Preserve the northwest Aethelwood forest and farmstead.
- Add/clean visible paths through the trees.
- Add one obvious river/stream or inlet crossing near the forest edge.
- Add a small grove/shrine clearing.
- Add a route out toward the central map.

### Object Pass

Add these objects:

| Object | Layer | Purpose |
| --- | --- | --- |
| `spawn_aethelwood_start` | `lh_spawn` | Default player spawn for beta. |
| `realm_marker_aethelwood` | `lh_realms` | Realm anchor. |
| `fog_aethelwood_outer_woods` | `lh_fog` | First reveal region. |
| `waypoint_aethelwood_farm_gate` | `lh_waypoints` | Early checkpoint. |
| `trigger_ley_root_shrine` | `lh_triggers` | First quest interaction. |
| `bridge_old_root_crossing` | `lh_traversal` | Magical bridge gate. |
| `collision_aethelwood_trees_*` | `lh_collision` | Dense forest boundaries. |
| `collision_aethelwood_water_*` | `lh_collision` | Water boundaries. |

### Gameplay Pass

The first playable slice should prove:

1. Player spawns in Aethelwood.
2. Trees, water, and buildings block movement.
3. The player reaches the first quest trigger.
4. A fog region is revealed.
5. A traversal item unlocks a bridge or raft crossing.
6. Save/load preserves visited triggers, fog, and item state.

## Current Gameplay Parsing State

The large map now renders in Phaser and the runtime parser also reads `Legendary_Horizon_Map.json`. The remaining work is map-side authoring: add object layers to the big map so it contains the gameplay metadata the parser expects.

- Phaser renders `Legendary_Horizon_Map.json`.
- The parser reads `Legendary_Horizon_Map.json`.
- `aethelwood_demo.json` becomes a legacy sample, not the active gameplay source.
- The object layers in the big map drive triggers, waypoints, fog, realm markers, collisions, and traversal gates.

Until those object layers exist, the app will show the full world but will not expose the old Aethelwood demo triggers from `aethelwood_demo.json`.

## Export Checklist (read this if the game stopped loading)

The usual failure mode is exporting **external** tilesets (`.tsx` references). Phaser loads the map over HTTP; it **cannot** open `../../../../Your PC/Game Map/foo.tsx`. Tile graphics must be **embedded** in the `.json` with `"image": "assets/maps/….png"`.

### Tiled settings / steps

1. Save your `.tmx` as usual.
2. **Embed tilesets into the map** before JSON export:
   - In recent Tiled: **Map → Embed All Tilesets** (or embed each external tileset from the Tilesets panel).
   - Alternatively **Edit → Preferences → Saving & Loading** and enable embedding where offered.
3. **Export**: **File → Export As… → JSON map files (\*.json)**  
   - Prefer **no compression** on tile layers for simpler debugging (optional).
4. **Overwrite only this file with the export:**  
   `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`
5. **Sanity-check the JSON** (open in an editor and search for `"source":`):
   - **Good:** `"tilesets": [ { "firstgid": …, "image": "assets/maps/your sheet.png", … } ]`
   - **Bad:** `"tilesets": [ { "firstgid": …, "source": "..\\..\\Something.tsx" } ]` → go back to step 2.
6. **Tileset names:** embedded `"name"` values must match what Phaser loads (see `TILESET_IMAGES` in `Codex/frontend/src/rendering/PhaserExplorationView.tsx`). Renaming a tileset in Tiled without updating that list breaks rendering.
7. Put any **new** tileset PNGs beside the JSON under `Codex/frontend/public/assets/maps/` using the same filenames as in the `"image"` fields (spaces allowed; URLs encode them).
8. Restart **`npm run dev`** if it was running (so Vite may pick up the new/changed JSON import). Hard-refresh the browser (**Ctrl+Shift+R**) to avoid a stale cached map.
9. Trigger rectangles: class/type should be `lh_trigger_zone` when using `lh_kind`; keep object layers named **`lh_triggers`** so parsing stays stable.

### What you do **not** need

- Restarting Cursor is unnecessary for the map file alone.
- Exporting only to `Codex/tiled/` without copying to `public/assets/maps/` will **not** update Phaser if that folder is out of sync.

After editing in Tiled:

1. Embed tilesets → export JSON → save to `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`.
2. Confirm referenced PNGs exist under `Codex/frontend/public/assets/maps/`.
3. Confirm the map loads in Phaser and map debug shows layers/triggers.
4. Run frontend typecheck / build when convenient.

## Design Guardrails

- Keep the map classroom-friendly: clear routes, readable regions, low frustration.
- Traversal items should support pacing and discovery, not hide required curriculum behind obscure exploration.
- Act III exploration can visit guild spaces for research. Act IV Guild Manager trials should only activate after True Path selection.
- Do not reintroduce an active 17th realm in production logic.
- Preserve the atlas silhouette and realm placement whenever possible.
