# Phase 1 Apps Script Bundle Check

Compared files:

- `Codex/apps-script/LhWebApp.js`
- `Codex/apps-script/lh_backend_bundle.gs`

## Route Comparison

| Capability | `LhWebApp.js` | `lh_backend_bundle.gs` | Phase 1 Finding |
|---|---:|---:|---|
| `list_roster` / `listroster` | Present | Missing | Bundle appears stale for teacher roster loading. |
| `list_player_summaries` / `listplayersummaries` | Present | Missing | Bundle appears stale for teacher dashboard summaries. |
| `teacher_unlock_quest` | Present | Present | Present in both. |
| `teacher_restore_backup` | Present | Present | Present in both. |
| `teacher_restore_item` | Present | Present | Present in both. |
| `teacher_reset_act` | Present | Present | Present in both. |
| `mark_exit_ticket` | Present | Present | Present in both. |
| `list_campfire_reflections` | Present | Present | Present in both. |
| `grade_campfire` | Present | Present | Present in both. |
| Campfire grading columns | Backed by modular services/config | Present in bundle | Present in both source families. |
| Rested Readiness fields | Backed by modular services/config | Present in bundle | Present in both source families. |

## Recommendation

`lh_backend_bundle.gs` should be treated as stale until regenerated from the modular Apps Script source or confirmed against the deployed Apps Script project. The missing `list_roster` and `list_player_summaries` routes can break teacher dashboard roster and summary loading if the stale bundle is deployed.

Do not regenerate automatically during Phase 1. Regeneration should be a Phase 2 or implementation task after owner approval.
