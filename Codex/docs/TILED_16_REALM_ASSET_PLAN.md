# Tiled 16 Realm Asset Plan

This plan turns the four shared Epic RPG World asset folders under `Game Map/Tilesets` into a practical map-building recipe for the 16 Legendary Horizon realms.

## Asset Families

The four same-author folders work well together because they share 32 px grid assumptions, palette language, prop scale, and terrain transition style.

| Folder | Best use | Notes |
| --- | --- | --- |
| `ERW - Grass Land 2.0 v1.9` | Main overworld terrain, rivers, beaches, coast, cliffs, bridges, trees, rocks, outdoor props | This is the primary atlas kit. Use it for base landmass, water edges, dense woods, and travel gates. |
| `EPIC RPG World Pack - Grass Land V. 1.6` | Farm/village props, fences, shrines, wells, crops, blacksmith pieces, small nature decorations | This is the strongest Aethelwood demo prop source. It has fences, farm clutter, shrines, signs, wells, crops, logs, and bridges. |
| `Epic RPG World - The Village V2.1` | Village buildings, porches, walls/roofs, NPCs, merchant/blacksmith settlement feel | Use for civic, market, inn, education, public-service, and production spaces. |
| `ERW - Ancient Ruins V 2.2.1` | Ruins, stonework, arcane portals, old roads, cryptic landmarks, golems/enemies | Use for Monolith, Archives, Observatory, Nexus, Vault, old waypoints, and ancient traversal gates. |

Support folders:

- `New_Guild_HQs`: the 16 realm HQ images. These are anchor sprites, not full terrain kits.
- `Characters` and `FULL_Adventurer 2D Pixel Art`: player/NPC animation support.

## Realm Recipes

| Realm | Asset recipe |
| --- | --- |
| Aethelwood Farmsteads | Grass Land 2.0 terrain + Grass Land 1.6 fences/crops/shrine/well/logs + Village cottage accents. Prioritize paths, farm gate, ley shrine, root bridge, and forest collisions. |
| Monolith of Masonry | Ancient Ruins stone walls, pillars, broken slabs, golem markers, cliff/wall tiles from Grass Land 2.0. Needs mountain/cliff polish later. |
| Chronicler's Spire | Village tower/wall pieces, Ancient Ruins sigils, lamp posts, signs, banner-like props, light/portal accents. |
| Mercantile's Citadel | Village buildings, merchant props, crates/barrels/tables, roads, coastal access from Grass Land 2.0. |
| Archives of Ascension | Ancient Ruins stone/library mood, Village building shells, lamp posts, signs, old paths. Add book-specific props later if sourced. |
| Gilded Vault | Ancient Ruins underground/stone, chests, crates, metal props, strong collision footprint around vault entry. |
| High Council Hall | Village civic building pieces, stone paths, pillars, formal gardens, lamps, clean road grid. |
| Aurora Apothecary | Grass Land flowers/mushrooms/herbs, shrine variants, water edges, soft forest clearing, Village cottage accents. |
| Crossroads Haven | Village inn/market pieces, signposts, road junctions, crates/barrels, campfire/rest props. |
| Empath's Enclave | Grass Land glade, soft water/pond edges, shrine, benches/tables, flowers, warm Village hut accents. |
| Etheric Nexus | Ancient Ruins portals/sigils + Grass Land glowing shrine assets + forest border. Needs tech/magic overlay polish later. |
| Valor's Watchtower | Village/ruin tower components, barricades, weapon props, cliff overlook, narrow approach collision. |
| Vulcanis Forge | Village blacksmith + forge props, fire/smoke/campfire, rocks. Asset gap: real lava/ash/basalt terrain is still needed for final polish. |
| Bard's Beacon | Village plaza, signs, lamps, tables, performance/market props. Needs banners or stage props if sourced later. |
| Alchemical Observatory | Ancient Ruins high stone, portal/sigil effects, mountain/cliff support, lab-like props later. |
| Odyssey's Harbor | Grass Land coast/beach/water transitions, crates/barrels/planks/bridges, Village market pieces. Asset gap: true dock/boat/raft set is still needed. |

## Aethelwood Demo Buildout

Current progress made in the active map export:

- Added `lh_spawn` with `spawn_aethelwood_start`.
- Added `lh_realms` with `realm_marker_aethelwood`.
- Added `lh_waypoints` for the farm gate, old root crossing, and central road out.
- Added `lh_fog` with `fog_aethelwood_outer_woods`.
- Added `lh_collision` rectangles for farmstead roofs, dense woods, stream banks, and northwest map edge.
- Added `lh_traversal` with `bridge_old_root_crossing`, `trigger_ley_root_shrine`, and an Aethelwood Lost Echo roaming spawn.
- Added runtime parser support for `spawn_point` and `collision` objects so Tiled-authored metadata affects Phaser immediately.

Recommended next art pass in Tiled:

1. Paint a readable dirt/grass path from the spawn to the farmstead, shrine, bridge, and central road out.
2. Add visible bridge/root planks at `bridge_old_root_crossing`; current metadata is ready but the visual should sell the gate.
3. Decorate the shrine clearing with shrine, flowers, mushrooms, logs, and a few fence remnants from Grass Land 1.6.
4. Place farm props near the HQ: crop rows, fence breaks, water well, barrels/crates, and tool clutter.
5. Tune collision rectangles after a playtest so they match the visible tree walls and stream banks.

## Gaps To Source Later

- Volcanic terrain: lava, ash, cracked basalt, ember vents.
- Harbor kit: docks, boats, raft, mooring posts, gangplanks.
- Road kit: dirt path and stone/cobble junctions that read clearly at atlas scale.
- Mountain/cliff kit or recovery of missing `mountain.png` / `cliffsheet.png`.

