# Legendary Horizon — Runtime contracts (Codex ↔ Sheets ↔ Frontend)

Aligned with **Legendary Horizon Save System Workbook**, Quest List spreadsheet, Media Asset Lookup, and **Day 2 Objective D2-01**. **Canonical product docs:** Master GDD v1 (`.md` in Project Documents), Master GDD v2 (realm registry), Codex Implementation Roadmap — see `docs/README.md`.

Field names across:

- **`Codex/data/samples/*.json`** — fixture rows for SPA + scripting tests.
- **`Codex/frontend/src/domain/lh-contract.ts`** — TypeScript typings (SPA source of truth for shapes).
- **`Codex/apps-script/config/LhSheetSchema.js`** — column order helpers for Sheets read/write (**must mirror your live workbook tabs**).

## Entity overview

### `PlayerSave` tab (logical)

| Canonical field | Type | Purpose |
|---|---|---|
| `player_id` | string | Primary key / stable student save key. |
| `display_name` | string | In-world character name surfaced in dialogs + HUD. |
| `email_hash` | string | Privacy-preserving linkage to Classroom identity when email not stored verbatim. |
| `roster_email_hint` | string | Day 2+: optional plaintext email strictly for QA environments (blank in prod if policy forbids). |
| `current_act` | int | Narrative arc index. |
| `current_realm_id` | string | FK-ish key to realm registry (`realm_registry.json` / `LhRealmDefinitions` tab). |
| `required_next_action` | string | Plain-language teacher/student-visible instruction. |
| `active_main_quest_id` | string | FK-ish key to quests table. |
| `active_main_quest_title` | string | Cached headline for HUD (denormalised for readability). |
| `last_completed_event_id` | string | Resume dialogue anchor. |
| `last_completed_summary` | string | Resume recap copy. |
| `xp_total` | number | Merit / progression currency. |
| `level_cached` | number | Denormalised level for dashboards; SPA treats as authoritative for slice. |
| `inventory_summary` | object | Compact JSON-friendly inventory digest (coins + keyed items array). |
| `inventory_summary_json` | string (sheet) | Same payload stringified for spreadsheet cells (Apps Script maps this column → object). |
| `revision_token` | string optional | Optimistic concurrency on manual saves once wired server-side. |
| `last_manual_save_iso` | string optional | Last successful manual-save timestamp (ISO‑8601). |
| `quests_snapshot_json` | string optional | JSON array of per-player quest rows (mirrors `QuestDefinition[]` from manual-save envelopes). |
| `backup_checkpoint_json` | string optional | Last checkpoint blob (`LhBackupCheckpointV1` — prior player + quests JSON) for teacher restore / rollback. |
| `auto_save_last_iso` | string optional | Timestamp of last autosave merge (`LhSave_autoSaveProgress` or SPA `save_kind: 'auto'` manual-save envelope). |
| `exit_ticket_state` | string optional | Opaque exit-ticket workflow state (`none` \| `draft_ready` \| `sent` \| …). |
| `progression_flags_json` | string optional (M8) | `{ visited_trigger_object_ids: string[] }` — trigger visit ledger for resume. |
| `exploration_loop_json` | string optional (M8) | `ExplorationLoopState` (fog, waypoints, comparison ledger rows). |
| `realm_progress_json` | string optional (M8) | Map of `realm_id` → `RealmExplorationProgressEntry` (atlas / Act III flags). |
| `session_summary_json` | string optional (M8–9) | Last `SessionSummaryV1` from session-end ritual (audit). |
| `ritual_drafts_json` | string optional (M8) | Half-written ritual fields (`RitualDraftsV1`) flushed on save. |

### `LhSessionHistory` tab (Milestone 3)

| Column | Purpose |
|--------|---------|
| `session_id` | UUID per class session |
| `player_id` | FK to player save |
| `began_iso` / `ended_iso` | Session window |
| `summary_json` | Serialized `LhSession_buildSessionSummary` output |
| `device_hint` | Optional client label |

### `LhQuestDefinitions` / `LhRealmDefinitions` / `LhItemDefinitions`

Optional tabs keyed by `quest_id`, `realm_id`, `item_id` for **`LookupService`** and **`QuestService`** when not using static JSON deploys.

### `LhMediaAssets` optional columns (filtering)

| Column | Purpose |
|--------|---------|
| `realm_tags_csv` | Comma-separated realm ids this asset belongs to (banners, thumbs). |
| `npc_id` | Optional NPC portrait / dialogue bundle key. |
| `fallback_asset_id` | Optional alternate `asset_id` when `delivery_url_placeholder` is blank or the file fails (SPA + fixtures). |

### `RosterStudent` tab (logical)

| Field | Type |
|---|---|
| `student_email` | string |
| `student_id` | string |
| `player_display_name` | string |
| `teacher_email` | string |
| `course` | string |
| `class_section` | string |
| `section_code` | string |

### Assets / quests / realms

Remain consistent with **`data/samples/quests.json`**, **`realm_registry.json`** (current beta runtime canon is 16 active realms. Energy / Arcanum Reactor exists in older concept materials as archived future-expansion material and should not be reintroduced into runtime logic unless explicitly approved), and **`media_assets.json`** (optional `realm_ids` on media rows) — extend workbook tabs before adding unexplained keys. **Milestone 8** persists exploration state, realm progress map, progression flags, session summary, and ritual drafts via the columns above (SPA `ManualSaveEnvelopeV1` ⇄ `LhSave_applyManualSaveEnvelope`).

**Milestone 10 — `QuestDefinition` (SPA + `quests_snapshot_json`):** `tier` ∈ `main` \| `side` \| `guild`; `status` ∈ `active` \| `available` \| `locked` \| `completed` \| `turned_in`; optional `prerequisite_quest_ids` (unlock to `available` when all listed quests are `completed` or `turned_in`). Runtime logic: `frontend/src/quests/questEngine.ts` (`loadQuestDefinitionsFromJson`, `reconcileQuestPrerequisites`, `groupQuestsForQuestLog`, `markQuestTurnedIn`).

**Milestone 11 — worksheets / research:** Catalog `data/samples/academic_worksheet_tasks.json` (loaded as `LhRuntimeFixture.academic_worksheet_tasks`). Per-student progress lives in **`exploration_loop.academic_tasks`** (map of `task_id` → `AcademicTaskProgress`: `kind`, `status`, `payload`, `updated_iso`). Kinds cover Quest of Fate, Comparison ledger (synced when `ledger_entries` is non-empty), Quest of Choice, Manifest, Great Transcription, and Chronicle (including chronicle status). Logic: `frontend/src/academic/academicCatalog.ts`, `academicProgress.ts`; UI: **Pause → Research worksheets** (`AcademicWorksheetsOverlay.tsx`). Apps Script validates `academic_tasks` is an object when present inside `exploration_loop`.

**Milestone 12 — player-facing UI shell:** Title screen session bootstrap (`bootstrapPhase` / `bootstrapError` + `LoadingSpinner`), grouped pause menu, quest log intro/footer and per-section empty states, full **Inventory** overlay (coins, items, facilitator notes), exploration map legend chrome, resume dialogue card (`DialogueBox` `resume` variant), shared **`StatusCallout`** + **`LoadingSpinner`** components, `role="alert"` on save error toasts, and `focus-visible` outlines on controls (`global.css`).

**Milestone 13 — accessibility / classroom:** Client-only prefs in `localStorage` (`lh_accessibility_prefs_v1`) via `lhAccessibilityPrefs.ts` + `useLhAccessibilityPrefs`; `<html>` `data-lh-text-scale`, `data-lh-motion`, `data-lh-density`, `data-lh-audio` drive `global.css` (text scaling, reduced motion, compact map chrome). **Pause → Display & sound** exposes those controls; **Escape** closes overlays and the pause menu; skip link targets `#lh-main`. Not persisted to Sheets — device-local only.

**Milestone 14 — Drive / media catalog:** Fixture and sheet rows share `MediaAssetRecord` (`lh-contract.ts`): `asset_id`, `kind`, `delivery_url_placeholder`, optional `realm_ids` (JSON) or `realm_tags_csv` (Sheets), `npc_id`, `fallback_asset_id`. SPA: `services/assetCatalog.ts` (`resolveAssetDeliveryUrl`, `collectDeliveryUrlChain`, `resolveNpcPortraitDeliveryUrl`, `preloadCoreCatalogMedia`), `realm/realmAssets.ts` (`listMediaAssetsForRealm`, `listMediaAssetsForNpc`), `lib/mediaRowNormalize.ts` for sheet-shaped rows, `components/LhCatalogImage.tsx` (lazy realm thumbnails), `lib/lhCatalogAudio.ts` (catalog audio + oscillator stub when URL missing; respects M13 `data-lh-audio`). Apps Script: `AssetService.js` (`LhAsset_getRecord`, `LhAsset_getRealmAssets`, `LhAsset_getNpcAssets`) + `LH_MEDIA_HEADERS.fallback_asset_id`.

**Milestone 15 — classroom tool hooks:** `services/classroomToolLaunches.ts` builds URLs for O*NET-oriented search (My Next Move by default; override with `VITE_LH_ONET_SEARCH_URL_TEMPLATE` and `{q}`), Maia (`VITE_LH_MAIA_URL`), Chronicle Slides (`VITE_LH_CHRONICLE_SLIDES_TEMPLATE_ID` / `VITE_LH_CHRONICLE_SLIDES_URL` / create), Forms (`VITE_LH_ENROLLMENT_FORM_URL`), Quizlet (`VITE_LH_QUIZLET_SET_URL` or search), Google Classroom (`VITE_LH_GOOGLE_CLASSROOM_URL`). `exitTicketHandoff.ts` adds **`gmailWebComposeUrl`** + `proposeExitTicketGmailWebSafe` alongside existing `mailto` save/end-session flows. **Pause** and **Instructions** expose `ClassroomToolsButtonRow`; Gmail exit ticket drafts current save state without persisting.

**Milestone 16 — dialogue / NPC lane:** Fixtures `data/samples/npc_registry.json` + `dialogue_catalog.json` (loaded on `LhRuntimeFixture`). Types in `domain/lh-dialogue.ts`. Runtime: `dialogue/dialogueConditions.ts` (quest / act / realm predicates), `dialogue/dialogueEngine.ts` (`pickFirstMatchingDialogueLine`, `resolveNpcDialogueBody`, realm-lore hooks, `buildResumeDialogBody` + `{placeholder}` interpolation), `dialogue/npcRegistry.ts`. Tiled `lh_kind: npc_dialogue` + `lh_npc_id` surfaces as map hotspots; `triggerDispatcher.ts` opens an in-game `DialogueBox` overlay. Resume screen speaker line comes from the mentor NPC row.

**Milestone 17 — encounters:** `ExplorationLoopState` gains optional `session_encounter_xp_awarded` + `encounter_log` (`EncounterLogEntryV1` on `lh-contract.ts`). `encounter/encounterConstants.ts` (session XP cap + per-encounter awards), `encounter/encounterXp.ts` (`awardEncounterXp`, `appendEncounterLog`), `encounter/encounterQuestBridge.ts` (`tryQuestLinkedEncounterWin` — mirrors main-quest completion when `lh_target_quest_id` matches an **active** main quest). Tiled `combat_encounter` / `vocab_battle` triggers open `EncounterOverlay.tsx` (hack-and-slash prototype + two-step vocab); win applies XP (capped), logs, optional quest delta, marks trigger visited; retreat logs without XP; combat loss allows **Retry**. `manualSaveGateway.coerceExplorationLoop` persists the new fields.

**Milestone 18 — facilitator / teacher tools:** Web App `LhWebApp.js` actions `teacher_unlock_quest`, `teacher_restore_backup` (wraps `LhTeacher_rollbackCheckpoint` → `LhSave_restoreBackupCheckpoint`), `teacher_restore_item`, `teacher_reset_act`, plus existing `mark_exit_ticket`. SPA: `services/teacherToolsGateway.ts` (POST when `VITE_LH_APPS_SCRIPT_WEBAPP_URL` is set and simulation is not forced), `services/teacherToolsLocal.ts` + `teacherCheckpoint.ts` for offline restore from `backup_checkpoint_json`, and **Pause → Facilitator tools** (`TeacherToolsPanel.tsx`) when `import.meta.env.DEV` or `VITE_LH_TEACHER_PANEL=true`. After successful remote mutations the client reloads via `load_player`. `PlayerSave` includes optional `backup_checkpoint_json` and `exit_ticket_state`; `LhBackupCheckpointV1` matches the Apps Script backup blob.
