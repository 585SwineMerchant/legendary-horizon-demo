# Legendary Horizon Map Source Of Truth

Current map workflow for the classroom beta:

- Main map authoring source for now: `Game Map/Legendary_Horizon_Map.tmx`
- Main map runtime export for now: `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`
- Active vertical-slice demo runtime map: `Codex/frontend/public/assets/maps/Legendary_Horizon_Map_before_move_towards_final.json`

## Current And Protected Map Files

| File | Classification | Rule |
|---|---|---|
| `Game Map/Legendary_Horizon_Map.tmx` | Current main map authoring source | Open/edit this in Tiled for the evolving classroom beta map. |
| `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json` | Current main map runtime export | Do not overwrite without explicit export/build instruction. |
| `Codex/frontend/public/assets/maps/Legendary_Horizon_Map_before_move_towards_final.json` | Active vertical-slice demo runtime map | Protected dependency. Do not archive, move, rename, delete, or replace until the vertical slice demo is intentionally migrated away from it. |
| `Codex/tiled/Legendary_Horizon_Map.json` | Stale/confusing tiled-side copy | Not current source-of-truth. |
| `Codex/tiled/Legendary_Horizon_Map.tmj` | Stale/broken/confusing tiled-side copy | Not current source-of-truth. |
| `Project Documents/Legendary_Horizon_Map1.json` | Historical project-document map copy | Not current source-of-truth. |
| `Project Documents/Legendary_Horizon_Map1.tmj` | Historical project-document map copy | Not current source-of-truth. |

Do not edit stale map JSON copies as if they are current. In particular:

- Do not treat `Codex/tiled/Legendary_Horizon_Map.json` as current unless it is intentionally resynced later.
- Do not treat `Codex/tiled/Legendary_Horizon_Map.tmj` as current unless it is intentionally resynced later.
- Do not treat `Project Documents/Legendary_Horizon_Map1.json` or `Project Documents/Legendary_Horizon_Map1.tmj` as current unless they are intentionally resynced later.

Any map change should be made in Tiled first, using `Game Map/Legendary_Horizon_Map.tmx`, then exported to `Codex/frontend/public/assets/maps/Legendary_Horizon_Map.json`.

Do not export or overwrite the runtime map without a separate build/export instruction.

Do not archive, move, rename, delete, or replace `Codex/frontend/public/assets/maps/Legendary_Horizon_Map_before_move_towards_final.json` until the vertical slice demo is intentionally migrated away from it.
