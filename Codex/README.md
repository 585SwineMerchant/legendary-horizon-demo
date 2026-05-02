# Legendary Horizon — Monorepo (Codex)

Single repository skeleton for **Legendary Horizon**, a classroom-facing **browser educational RPG**. Work here is organized for incremental delivery alongside frozen reference collateral in **`../Project Documents/`** (Master GDD v2, Technical Architecture Spec, Save System Workbook, Quest List, Media Asset specs/sheets).

## Project concept

Legendary Horizon frames career clusters as guild-aligned **realms**. Students pursue narrative quests anchored to spreadsheet-backed progress, educator roster context, curated media retrieved through Drive-friendly IDs, and (later) Tiled-authored maps exported to JSON.

The **Night One checklist** prioritized proving an end-to-end *local* slice: authoritative sample data fixtures, modular UI scaffolding, mirrored Apps Script service boundaries, and one interaction loop validating quest state updates—not full cloud integration yet.

## Technical architecture snapshot

| Layer | Responsibility |
|-------|------------------|
| `frontend/` | Vite + React + TypeScript SPA. Screen flow, HUD, dialogs, modular data-loading seam (fixtures now, HTTP to Apps Script later). |
| `apps-script/` | Google Apps Script modules for validation/persistence/query surfaces (currently stub implementations + logging placeholders). Sheets remain the eventual source of truth. |
| `data/samples/` | JSON fixtures documenting expected column/field parity with spreadsheet-backed tables (`player_save`, roster, realms, quests, media assets). |
| `tiled/` | Reserved export target for authoritative map collisions & trigger metadata consumed by future rendering layers. |
| `assets/` | Repo-hosted media not yet vaulted in Drive—optional thumbnails, sfx prototypes, branded UI trims. |

## Folder guide

| Path | Purpose |
|------|---------|
| `docs/` | Living engineering notes—not a mirror of immutable Project Documents. |
| `frontend/` | Web client: `src/screens`, `hooks`, `components`, `lib`, `styles`; ship placeholder SVG/audio via `public/assets/`. |
| `apps-script/` | Deployable stubs for Save, Quest, Session, Asset, ExitTicket (Gmail successor), Lookup services plus shared config helpers. |
| `data/samples/` | Local golden records for deterministic UI prototyping. |
| `tiled/` | Map JSON payloads once Tiled integration begins. |
| `assets/` | Binary-friendly drops that should not live inside `frontend/dist`. |
| `scripts/` | Build automation, exporters, QA helpers that touch spreadsheets or repositories. |

## MVP slice (Night One)

Prove the UX loop enumerated in **`Legendary_Horizon_Night_One_Codex_Checklist.docx`**:

1. Title → instructions → scripted resume recap (`DialogueBox` + asset lookup portrait).
2. Placeholder realm board with waypoint + hotspot interaction altering quest/player HUD copy live.
3. Pause menu → simulated save surfacing Gmail exit ticket wiring reminder.
4. Quest log overlays driven by imported quest fixtures.
5. Parity-maintaining Apps Script stubs and JSON samples anticipating Sheets binding.

Consult `NEXT_STEPS.md` for pragmatic follow-on engineering tasks.

## Build & run commands

From `Codex/frontend`:

```powershell
npm install
npm run dev
```

Production bundle:

```powershell
npm run build
```

Artifacts land in `frontend/dist/` (ignored by Git).

Global type safety check only:

```powershell
npm run typecheck
```

## Recommended incremental build order (post skeleton)

1. Mirror `data/samples/*.json` as tabbed Sheets + Script Properties scaffolding; wire `LhApiClient` on the SPA.
2. Parse Tiled JSON into interaction graphs; progressively replace schematic exploration art.
3. Harden persistence (optimistic concurrency, versioning) on `LhSave_applyManualSaveEnvelope` ↔ production Sheets + audit trails.
4. Integrate **`ExitTicketService`** behind feature flags once Gmail quotas + classroom policies are finalized.

### Night One checklist status

Structural cleanup (**item 14**) is complete: routed `frontend/src/screens`, centralized flow state in `useNightOneFlow`, shrine quest deltas isolated in `completeDemoShrineVisit`, and concise `README.md` stubs in `docs/`, `tiled/`, `scripts/`, and `assets/`.
