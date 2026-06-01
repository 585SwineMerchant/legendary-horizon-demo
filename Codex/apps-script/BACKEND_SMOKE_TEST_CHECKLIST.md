# Backend Smoke Test Checklist

Use this checklist for the next manual Apps Script deployment. Do not deploy to a classroom environment until these checks pass against a test Google Sheet.

## 1. Pre-Deploy Review

- [ ] Confirm `Codex/apps-script/lh_backend_bundle.gs` was generated from the current modular source with:

  ```powershell
  node Codex/scripts/build-apps-script-bundle.mjs
  ```

- [ ] Confirm the bundle header lists the expected source file order.
- [ ] Confirm no unintended frontend, map, quest, or realm changes are part of the deployment.
- [ ] Confirm the target Google Sheet has player-save columns:
  - [ ] `last_campfire_score`
  - [ ] `campfire_streak`
  - [ ] `satchel_inventory_json`
- [ ] Confirm the target Google Sheet has session history / grading columns:
  - [ ] `session_id`
  - [ ] `player_id`
  - [ ] `began_iso`
  - [ ] `ended_iso`
  - [ ] `summary_json`
  - [ ] `campfire_log_entry`
  - [ ] `campfire_score`
  - [ ] `campfire_comment`
  - [ ] `campfire_graded_at`
  - [ ] `campfire_graded_by`

## 2. Deployment Setup

- [ ] Copy/deploy `Codex/apps-script/lh_backend_bundle.gs`, or deploy modular files in the documented order from `Codex/apps-script/README.md`.
- [ ] Confirm Script Property `LH_SPREADSHEET_ID` is set, or include `spreadsheet_id` in each test request payload.
- [ ] Confirm Web App deployment permissions match the intended test audience.
- [ ] Confirm the test Sheet is not a live classroom production Sheet.

## 3. Smoke-Test Actions

- [ ] Call `load_player` for a test player.
- [ ] Call `session_end` with a session summary containing reflection / exit-ticket body text.
- [ ] Call `list_campfire_reflections`.
- [ ] Call `grade_campfire` with score `>= 3`.
- [ ] Call `load_player` again.
- [ ] Milestone test: use a test player near `campfire_streak = 2`, then grade `>= 3`.
- [ ] Reset test: grade a reflection with score below `3`.
- [ ] Call `list_roster`.
- [ ] Call `list_player_summaries`.
- [ ] Smoke-test teacher override actions:
  - [ ] `teacher_unlock_quest`
  - [ ] `teacher_restore_backup`
  - [ ] `teacher_restore_item`
  - [ ] `teacher_reset_act`
- [ ] Smoke-test GT-102 / Trial of Tongues if available:
  - [ ] `gt102_turn`
  - [ ] `trial_of_tongues_turn`

## 4. Expected Results

- [ ] `load_player` returns usable player data before and after grading.
- [ ] `session_end` creates a session history row.
- [ ] Reflection text appears in `campfire_log_entry`.
- [ ] `list_campfire_reflections` returns the ungraded reflection.
- [ ] `grade_campfire` writes:
  - [ ] `campfire_score`
  - [ ] `campfire_comment`
  - [ ] `campfire_graded_at`
  - [ ] `campfire_graded_by`
- [ ] `last_campfire_score` updates on the player save row.
- [ ] `campfire_streak` increments when score is `>= 3`.
- [ ] `campfire_streak` resets to `0` when score is below `3`.
- [ ] Cosmetic milestone unlocks are added once, without duplicates.
- [ ] Existing `satchel_inventory_json` is preserved and only expanded as needed.
- [ ] `list_roster` returns usable roster data.
- [ ] `list_player_summaries` returns usable teacher dashboard summary data.
- [ ] Teacher override actions return success or clear expected test errors.
- [ ] GT-102 / Trial of Tongues returns a structured response when available.

## Latest Smoke Test Result — 2026-05-31

### Root cause resolved

The previous `LH_SPREADSHEET_ID` Script Property (and `.env.local` value) pointed to an `.xlsx`-imported file. Excel-imported sheets are read-only to Apps Script — `SpreadsheetApp.openById()` cannot write to them, causing all save operations to fail silently or error. The fix was to convert the Sheet to a native Google Sheet in Google Drive and update the ID in both the Apps Script Script Property and `.env.local`.

### Routes tested (Apps Script editor — direct `doPost` calls against live native Sheet)

| Action | Result |
|---|---|
| `unknown_action` | Returned expected error; did not throw unhandled exception |
| `list_roster` | Returned roster data |
| `list_player_summaries` | Returned player summary array |
| `list_campfire_reflections` | Returned reflection list |
| `load_player` (nonexistent player) | Returned expected "player not found" response |
| `session_end` | Created session history row successfully |
| `mark_exit_ticket` (nonexistent player) | Returned expected "player not found" response |

### Post-test cleanup

- The temporary `smokeTest()` helper function added to `Code.gs` during testing was removed. Production Apps Script source is restored to its pre-test state.

### Known data issue

- One roster row has `section_code` set to a Date object string (e.g. `"Thu Jan 01 1970 ..."`). This should be corrected directly in the Sheet to a plain text identifier such as `P1`, `P2`, or `Section 1`. See section 4 of the frontend checklist.

### Remaining validation

All smoke tests above were run from the Apps Script editor (simulated POST). The following require manual validation from the live Vite frontend:

- `load_player` via the actual game login flow
- `session_end` triggered by the in-game campfire/session-end UI
- `list_campfire_reflections` and `grade_campfire` via Teacher Dashboard
- Rested-readiness buff appearing after a graded high-score campfire
- Zero browser console errors or CORS errors

See `FRONTEND_BACKEND_INTEGRATION_CHECKLIST.md` in the project root for the full walkthrough.

### Security reminder

- Do **not** commit `.env.local`. It contains the live Sheet ID and Apps Script Web App URLs.
- Do **not** paste live Sheet IDs or Apps Script deployment URLs into committed documentation.
- Keep those values in Script Properties (Apps Script side) and `.env.local` (frontend side) only.

---

## 5. Rollback Plan

- [ ] If not deployed, restore the previous bundle from git or regenerate after reverting the relevant modular source.
- [ ] If deployed, use Apps Script version history to redeploy the previous known-good version.
- [ ] Do not troubleshoot by manually editing the generated bundle unless absolutely necessary.
- [ ] Prefer fixing modular source, regenerating the bundle, and redeploying.
