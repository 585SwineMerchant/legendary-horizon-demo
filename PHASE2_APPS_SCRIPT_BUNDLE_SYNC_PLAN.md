# Phase 2 Apps Script Bundle Synchronization Plan

No Apps Script bundle was regenerated in Phase 2.

## Inspection Summary

Searched for bundle generation or deployment maintenance paths in:

- `Codex/apps-script/README.md`
- `Codex/scripts/README.md`
- `Codex/frontend/package.json`
- Apps Script, docs, and script files under `Codex/`, excluding `node_modules` and `dist`

Found:

- `Codex/apps-script/README.md` documents manual/clasp deployment and module load order.
- No `package.json` script, clasp config, generator script, or documented command was found for regenerating `Codex/apps-script/lh_backend_bundle.gs`.
- No existing safe bundle generation command was identified.

Because there is no clear generation path, the bundle was not manually rewritten or concatenated.

## Current Bundle Route Verification

| Capability | `Codex/apps-script/LhWebApp.js` | `Codex/apps-script/lh_backend_bundle.gs` | Status |
|---|---:|---:|---|
| `list_roster` / `listroster` | Present | Missing | Bundle stale for roster loading. |
| `list_player_summaries` / `listplayersummaries` | Present | Missing | Bundle stale for teacher summaries. |
| `teacher_unlock_quest` | Present | Present | In sync for this route. |
| `teacher_restore_backup` | Present | Present | In sync for this route. |
| `teacher_restore_item` | Present | Present | In sync for this route. |
| `teacher_reset_act` | Present | Present | In sync for this route. |
| `list_campfire_reflections` | Present | Present | In sync for this route. |
| `grade_campfire` | Present | Present | In sync for this route. |
| Campfire reflection handling | Present | Present | Present in bundle. |
| Rested readiness fields / handling | Present | Present | Present in bundle. |

## Recommended Process

Use the modular Apps Script files as source of truth and deploy them in the documented load order:

1. `Codex/apps-script/config/LhSheetSchema.js`
2. `Codex/apps-script/utils/LhSheetIO.js`
3. `Codex/apps-script/services/SaveService.js`
4. `Codex/apps-script/services/RosterService.js`
5. `Codex/apps-script/services/QuestService.js`
6. `Codex/apps-script/services/SessionService.js`
7. `Codex/apps-script/services/AssetService.js`
8. `Codex/apps-script/services/ExitTicketService.js`
9. `Codex/apps-script/services/LookupService.js`
10. `Codex/apps-script/services/TeacherOverrideService.js`
11. `Codex/apps-script/utils/Config.js`
12. `Codex/apps-script/LhWebApp.js`

If a single-file bundle is still required, first add a checked-in generator script that concatenates the files above in that exact order, emits a header with the source file list and timestamp, and then verifies required route strings are present. After that generator exists, run it to update `lh_backend_bundle.gs`.

Suggested future command shape:

```powershell
node Codex/scripts/build-apps-script-bundle.mjs
```

This command does not exist yet.
