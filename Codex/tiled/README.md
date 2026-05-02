# Tiled exports

Commit JSON (or optionally `.tmx` + JSON) snapshots exported from **Tiled** here so the SPA can hydrate collision layers / object hotspots without binary surprises in Git.

Keep filenames aligned with **`realm_id`** or map registry IDs from spreadsheet metadata when that pipeline exists.

## Current Codex sample

`aethelwood_demo.json` ships an `objectgroup` named `lh_triggers` with Day 2 custom properties (`lh_kind`, `lh_target_quest_id`, interaction copy). The Vite client imports it via the `@maps/*` alias (see `frontend/vite.config.ts`).
