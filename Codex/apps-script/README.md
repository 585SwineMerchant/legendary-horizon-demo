# Apps Script workspace

Portable modules for Google Apps Script deployment (clasp or manual copy). **Dependency order:** load `config/LhSheetSchema.js` first, then `utils/LhSheetIO.js`, followed by service files.

## Day 2 surfaces

| File | Responsibility |
|------|----------------|
| `config/LhSheetSchema.js` | Tab + header contracts that must mirror your workbook. |
| `utils/LhSheetIO.js` | Header maps, table reads, row lookups. |
| `services/SaveService.js` | `LhSave_readPlayerSave` + `LhSave_applyManualSaveEnvelope` (ManualSave envelope v1). |
| `services/RosterService.js` | `LhRoster_resolvePlayerId` for email / student id → `player_id`. |
| `services/AssetService.js` | `LhAsset_getRecord` — asset row fetch by `asset_id`. |
| `services/ExitTicketService.js` | `LhExitTicket_queueMockDraft` — Gmail precursor. |

Remaining services (`QuestService`, `SessionService`, `LookupService`, etc.) still hold earlier stubs until subsequent passes.
