# Apps Script workspace

Portable modules for Google Apps Script deployment (clasp or manual copy). **Load order:** `config/LhSheetSchema.js` → `utils/LhSheetIO.js` → `services/SaveService.js` → `services/RosterService.js` → `services/QuestService.js` → `services/SessionService.js` → `services/AssetService.js` → `services/ExitTicketService.js` → `services/LookupService.js` → `services/TeacherOverrideService.js` → `utils/Config.js` → **`LhWebApp.js`** (defines `doGet` / `doPost`).

Deploy as a **Web App** (POST). Set Script Property `LH_SPREADSHEET_ID`, or pass `spreadsheet_id` in each JSON body. The Vite client calls `doPost` when `VITE_LH_APPS_SCRIPT_WEBAPP_URL` is set — see root `README.md` remote save section.

**Canonical design:** Master GDD v1 (`.md`), Master GDD v2 (realm registry), Codex Implementation Roadmap — see `../docs/README.md` and `../contracts/README.md`.

## Milestone 3 — service layer (function index)

| Service | Entry points |
|---------|----------------|
| **SaveService** | `LhSave_validateSavePayload`, `LhSave_loadPlayerState`, `LhSave_autoSaveProgress`, `LhSave_manualSaveProgress`, `LhSave_restoreBackupCheckpoint`, `LhSave_readPlayerSave`, `LhSave_applyManualSaveEnvelope`, `LhSave_writeExitTicketState` |
| **QuestService** | `LhQuest_getQuestById`, `LhQuest_getActiveQuestState`, `LhQuest_completeQuestStep`, `LhQuest_unlockNextQuest`, `LhQuest_generateCurrentRequiredNextAction` |
| **SessionService** | `LhSession_beginSession`, `LhSession_endSession`, `LhSession_buildSessionSummary`, `LhSession_writeSessionHistory` |
| **AssetService** | `LhAsset_getRecord`, `LhAsset_getRealmAssets`, `LhAsset_getNpcAssets` |
| **ExitTicketService** | `LhExitTicket_buildPromptForCurrentState`, `LhExitTicket_buildPrefilledEmailDraftPayload`, `LhExitTicket_markExitTicketState`, `LhExitTicket_queueMockDraft` |
| **LookupService** | `LhLookup_listValidQuestIds`, `LhLookup_listRealmIds`, `LhLookup_listItemIds`, `LhLookup_listEnumValues` |
| **TeacherOverrideService** | `LhTeacher_unlockQuest`, `LhTeacher_rollbackCheckpoint`, `LhTeacher_restoreItem`, `LhTeacher_resetActState` |
| **RosterService** | `LhRoster_resolvePlayerId` |

Optional tabs (`LhQuestDefinitions`, `LhRealmDefinitions`, `LhItemDefinitions`, `LhSessionHistory`) can be absent: lookup/list calls return empty arrays; session APIs return structured errors until you add tabs matching `LhSheetSchema.js`.

Sheets columns beyond Day 2 (`quests_snapshot_json`, `backup_checkpoint_json`, `auto_save_last_iso`, `exit_ticket_state`, M8 `progression_flags_json` / `exploration_loop_json` / `realm_progress_json` / `session_summary_json` / `ritual_drafts_json`, media `realm_tags_csv` / `npc_id`) are documented in **`../contracts/README.md`**.

**Web App (`LhWebApp.js`) actions:** `manual_save`, `load_player`, `session_end` (append `LhSessionHistory` via `LhSession_writeSessionHistory`), `mark_exit_ticket` (updates `exit_ticket_state` on the player row).
