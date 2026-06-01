# Phase 1 Map Source Clarification

Active runtime export confirmed by owner:

- `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`

Runtime hash:

- `D5EE3E38ACAB616707AEC17D613E2A9F257599826D0047204CD6E36A1E7AE7E3`

## Map File Inventory

| File Path | Modified | Classification | Runtime Hash Match | Shape / Counts | Notes |
|---|---|---|---:|---|---|
| `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json` | 2026-05-29 03:14:54 UTC | Active runtime export | Yes | 400x300, 20 layers, 12 tile layers, 8 object layers, 1820 objects | Current React/Vite runtime map export. |
| `Game Map/Legendary_Horizon_Map.tmx` | 2026-05-27 02:08:56 UTC | Possible Tiled authoring source | No | 400x300, 20 layers, 12 tile layers, 8 object layers, 1820 objects | Same layer/object counts as runtime export, but TMX bytes cannot hash-match JSON. Likely source or near-source for runtime export. |
| `Codex/frontend/public/assets/maps/Legendary_Horizon_Map_before_move_towards_final.json` | 2026-05-24 01:14:48 UTC | Stale export / archive candidate | No | 400x300, 13 layers, 8 tile layers, 5 object layers, 2160 objects | Older public export. Dangerous if mistaken for active map. |
| `Game Map/Legendary_Horizon_Map_before_move_towards_final.tmx` | 2026-05-24 01:14:36 UTC | Stale authoring source / archive candidate | No | 400x300, 13 layers, 8 tile layers, 5 object layers, 2160 objects | Source-side counterpart to stale public export. |
| `Codex/tiled/Legendary_Horizon_Map.json` | 2026-05-11 17:00:59 UTC | Stale export / archive candidate | No | 400x300, 7 layers, 6 tile layers, 1 object layer, 1 object | Looks important by name but does not match active runtime map. |
| `Codex/tiled/Legendary_Horizon_Map.tmj` | 2026-05-03 01:39:50 UTC | Stale authoring file / archive candidate | No | 400x300, 6 layers, 6 tile layers, 0 object layers, 0 objects | Older Tiled JSON project/source with no trigger objects. |
| `Project Documents/Legendary_Horizon_Map1.json` | 2026-05-07 01:06:05 UTC | Archive candidate | No | 400x300, 8 layers, 7 tile layers, 1 object layer, 2 objects | Historical map export in Project Documents. |
| `Project Documents/Legendary_Horizon_Map1.tmj` | 2026-05-07 01:04:56 UTC | Archive candidate | No | 400x300, 8 layers, 7 tile layers, 1 object layer, 2 objects | Same content hash as `Legendary_Horizon_Map1.json`, despite `.tmj` extension. |
| `Codex/tiled/aethelwood_demo.json` | 2026-05-06 02:35:46 UTC | Test fixture / demo map | No | 30x20, 1 object layer, 8 objects | Useful parser/demo fixture, not the current world map. |
| `Codex/data/samples/guild_hq_workbook_image_map.json` | 2026-05-04 03:42:44 UTC | Not a Tiled map / supporting data | No | No Tiled layers | Asset/workbook image mapping data, not a map export. |

## Notes

- Asset-pack sample maps under imported tileset/vendor folders were not classified as Legendary Horizon map sources.
- The current runtime export and `Game Map/Legendary_Horizon_Map.tmx` share structural counts, which suggests the TMX may be the best current authoring source. Confirm this before Phase 2 moves.
- No map files were moved, renamed, or regenerated in Phase 1.
