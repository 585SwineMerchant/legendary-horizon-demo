# Tiled exports

Commit JSON (or optionally `.tmx` + JSON) snapshots exported from **Tiled** here so the SPA can hydrate collision layers / object hotspots without binary surprises in Git.

Keep filenames aligned with **`realm_id`** or map registry IDs from spreadsheet metadata when that pipeline exists.

## Current Codex sample

`aethelwood_demo.json` ships an `objectgroup` named `lh_triggers` with custom properties (`lh_kind`, `lh_target_quest_id`, interaction copy). The Vite client imports it via the `@maps/*` alias (see `frontend/vite.config.ts`).

## Milestone 4 — object conventions (`lh_*`)

Place objects on any **`objectgroup`** layer. The parser (`frontend/src/maps/parseLhTiledMap.ts` + `mapLoader.ts`) classifies objects as follows:

| Role | Detected when |
|------|-----------------|
| **Gameplay trigger** (quest, etc.) | `lh_kind` is set and **not** one of `waypoint`, `fog_region`, `npc_dialogue`, **or** `type` is `lh_trigger_zone` (legacy) with optional `lh_kind`. |
| **Waypoint** | `lh_kind` = `waypoint` **or** `type` = `lh_waypoint`. Optional `lh_waypoint_key`. |
| **Fog region** | `lh_kind` = `fog_region` **or** `type` = `lh_fog_region`. Optional `lh_fog_key`. |
| **NPC marker** | `lh_kind` = `npc_dialogue` **or** `type` = `lh_npc_marker`. Optional `lh_npc_id`. |

**Map properties:** optional `lh_realm_id` on the root map matches realm routing hints.

**Tile layers:** summarized (id, name, dimensions, tile count); full tile rendering is a later milestone.

**Robustness:** unknown `lh_kind` values still appear in **`triggers`** with that kind string so you can extend the dispatcher without re-exporting old maps immediately.

Use **Show map debug** on the exploration screen (Vite dev, or `VITE_LH_MAP_DEBUG=true`) to inspect parsed output.
