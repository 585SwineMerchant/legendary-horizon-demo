# Legendary Horizon — Day 3 handoff (post Day 2 Codex pass)

## What landed on Day 2

- **`contracts/README.md` + `frontend/src/domain/lh-contract.ts`:** shared runtime vocabulary (player XP/level/inventory digest, roster rows, manual-save envelope v1).
- **Central fixture loader:** `frontend/src/runtime/loadLhRuntimeFixture.ts` composes player/quest/realm/roster/media/Tiled JSON for one source of truth consumed by the SPA.
- **SPA data services:** `services/assetCatalog.ts`, `services/manualSaveGateway.ts`, `services/exitTicketHandoff.ts`, `runtime/rosterIdentity.ts`.
- **Tiled slice:** `tiled/aethelwood_demo.json` + `maps/parseLhTiledMap.ts` + percent-positioned hotspots on the exploration board.
- **Trigger → quest delta:** `completeDemoShrineVisit` still models the quest transition; map triggers now call it when `lh_kind === quest_advance` and target quest matches the active main quest.
- **Manual save rehearsal:** validation, `ManualSaveEnvelopeV1` logging, revision token + ISO timestamp merge, `mailto:` exit-ticket scaffold after success.
- **Apps Script plumbing (first real read/write helpers):** `LhSave_*`, `LhRoster_*`, `LhAsset_getRecord`, refreshed exit-ticket stub + IO utilities.

## Still placeholder / risky

- Frontend still **simulates** persistence (`simulateManualSavePersist`); Sheets calls require binding `spreadsheetId`s + deployment.
- `mailto:` exit tickets are **policy-sensitive** — expect district guidance before student testing.
- Inventory column in Sheets is **`inventory_summary_json` string** — you must add that column Tab or adjust `LhSheetSchema`.
- Tiled export is **tiny** (object layer only); no tile rendering, collisions, or sprite pipeline yet.
- Roster heuristics in SPA are **fixture logging only** — production should call Apps Script `LhRoster_resolvePlayerId`.

## Recommended next three moves (Day 3)

1. **Bind a real spreadsheet:** create tabs with headers from `LhSheetSchema`, populate a row matching `data/samples/player_save.json`, store IDs in Script Properties, and replace `simulateManualSavePersist` with `google.script.run` or `fetch` to a Web App posting the same JSON envelope.
2. **Formalise exit tickets:** implement `LhExitTicket_queueMockDraft` → Gmail templated message with throttling + teacher approval flags; keep mailto fallback for dev.
3. **Render layer for Tiled:** import tile layers + collisions, drive movement + trigger hit-tests from object bounds instead of percent buttons.
