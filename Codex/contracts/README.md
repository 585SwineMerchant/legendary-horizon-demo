# Legendary Horizon — Runtime contracts (Codex ↔ Sheets ↔ Frontend)

Aligned with **Legendary Horizon Save System Workbook**, Quest List spreadsheet, Media Asset Lookup, and **Day 2 Objective D2-01**.

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
| `current_realm_id` | string | FK-ish key to realm registry (`realm_definition`). |
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

Remain consistent with **`data/samples/quests.json`**, **`realm_definition.json`**, and **`media_assets.json`** — extend workbook tabs before adding unexplained keys.
