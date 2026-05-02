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

Remain consistent with **`data/samples/quests.json`**, **`realm_registry.json`** (17 canon realms), and **`media_assets.json`** (optional `realm_ids` on media rows) — extend workbook tabs before adding unexplained keys. **Milestone 8** persists exploration state, realm progress map, progression flags, session summary, and ritual drafts via the columns above (SPA `ManualSaveEnvelopeV1` ⇄ `LhSave_applyManualSaveEnvelope`).

**Milestone 10 — `QuestDefinition` (SPA + `quests_snapshot_json`):** `tier` ∈ `main` \| `side` \| `guild`; `status` ∈ `active` \| `available` \| `locked` \| `completed` \| `turned_in`; optional `prerequisite_quest_ids` (unlock to `available` when all listed quests are `completed` or `turned_in`). Runtime logic: `frontend/src/quests/questEngine.ts` (`loadQuestDefinitionsFromJson`, `reconcileQuestPrerequisites`, `groupQuestsForQuestLog`, `markQuestTurnedIn`).
