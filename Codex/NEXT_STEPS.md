# Legendary Horizon — Codex handoff (Night One + Day Two)

## Scaffolded so far

- Monorepo root at `Codex/` with frontend, Apps Script modules, shared sample JSON fixtures, runtime contracts, and tooling folders.
- SPA (Vite + React + TypeScript) consumes a **single blueprint loader** (`runtime/loadLhRuntimeFixture.ts`) pairing spreadsheet-shaped JSON + a Tiled object export.
- First-pass **Apps Script save/roster/asset** implementations live beside earlier service stubs (`Readme` outlines load order).
- Canonical sample rows in `data/samples/` aligned with **`contracts/README.md`** (including roster + enriched player fields).
- For Day → Day continuity see **`docs/DAY_3_HANDOFF.md`** (Day Two summary + tomorrow’s roadmap).

## What currently works (local prototype)

`npm install` inside `Codex/frontend/` then `npm run dev`:

- Navigate **Title → Instructions → Resume mentor dialogue → Exploration** fed by **`tiled/aethelwood_demo.json`** hotspots.
- Clicking the **Ley Root** trigger advances quest state identical to Night One—but author metadata now originates from Tiled `lh_*` properties.
- **HUD** exposes XP / level / inventory digest sourced from enriched save JSON.
- **Pause → Save Game** validates, logs `ManualSaveEnvelopeV1`, stamps revision-ish metadata locally, opens a **`mailto:`** exit-ticket draft (blocked if pop-ups disallowed).
- **Quest Log** stays synchronized with fixture quest definitions.
- **Asset catalog façade** resolves `asset_id` → delivery placeholder paths (production swaps to Sheets/Drive lookups).

## Still placeholder / not production

- SPA still **simulates** persistence even though Apps Script helpers exist — you must deploy + supply spreadsheet IDs.
- **mailto:** exit tickets are not a substitute for district-approved Gmail flows.
- Tiled slice is object-only; no tile rendering, physics, or collision yet.
- Audio references remain mocked where noted in `media_assets.json`.

## Recommended next implementation steps

See **`docs/DAY_3_HANDOFF.md`** for the curated short list; in brief: bind a real spreadsheet + web app, replace the save simulator with server calls, and graduate Tiled from overlay buttons to a real map renderer.

**Update:** the SPA now calls **`persistManualSaveEnvelope`** (`services/manualSaveGateway.ts`), which POSTs to **`VITE_LH_APPS_SCRIPT_WEBAPP_URL`** when set (otherwise keeps simulation). Apps Script **`LhWebApp.js`** exposes `doPost` actions `manual_save` and `load_player`.

**Milestone 4 (Tiled import foundation):** `maps/mapLoader.ts`, extended **`parseLhTiledMap`** (tile/object layer summaries, waypoints, fog, NPC markers, warnings), **`MapDebugPanel`** on exploration (dev / `VITE_LH_MAP_DEBUG`), and **`tiled/README.md`** + sample objects in `aethelwood_demo.json`.

**Milestone 5 (start):** **`maps/triggerDispatcher.ts`** + **`lhTriggerTypes.ts`** — `quest_advance` via `completeDemoShrineVisit`, stub kinds log-only; **`loadPlayerStateFromRemote`** + **`lhWebAppClient`** — Continue hydrates from Web App when URL set (fixture fallback).

**Milestone 6 (realm framework):** **`data/samples/realm_registry.json`** (17 GDD canon realms); **`realm/realmRegistry.ts`**, **`realmAssets.ts`**, **`realmProgress.ts`**; fixture loader exposes **`realms`** + active **`realm`**; **Realm atlas** overlay from pause; session **exploration progress**; **`listAssetsForRealm`** on `assetCatalog`; optional **`realm_ids`** on media fixtures.

**Milestone 7 (exploration loop):** **`WorldMapOverlay`** (locked/unlocked realms, fog clear, ledger form, research, travel); **`exploration/`** types + **`realmUnlock`**, **`waypoints`**, **`ledgerQuestBridge`**; session **`ExplorationLoopState`**; **dynamic `realm`** from `player.current_realm_id`; exploration HUD strip + world map from pause/explore.
