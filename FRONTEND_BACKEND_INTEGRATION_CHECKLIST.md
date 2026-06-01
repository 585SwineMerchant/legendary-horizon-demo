# Frontend / Backend Integration Checklist

Use this checklist after any backend deployment or Sheet migration to confirm end-to-end behavior from the Vite app — not just the Apps Script editor.

> **Context:** Backend smoke tests ran successfully on 2026-05-31 against the native Google Sheet (post-xlsx-migration). The steps below validate the same routes from the live frontend.

## Setup

- [ ] Run `npm run dev` from `Codex/frontend/` to start the local Vite dev server.
- [ ] Confirm `Codex/frontend/.env.local` is present and contains:
  - `VITE_LH_SPREADSHEET_ID` — points to the **native** Google Sheet (not the .xlsx import).
  - `VITE_LH_APPS_SCRIPT_WEBAPP_URL` — points to the deployed player-facing Apps Script Web App.
  - `VITE_LH_TEACHER_APPS_SCRIPT_URL` — points to the deployed teacher Apps Script Web App.
- [ ] Confirm `VITE_LH_FORCE_SIMULATED_SAVE=false` (real backend, not simulated).

## Player flow

- [ ] Load the game in the browser as a test player (use a real roster entry, not a made-up ID).
- [ ] Confirm `load_player` succeeds — player data loads without console errors.
- [ ] Walk through at least one in-game action that writes state (e.g. satchel change, quest progress).
- [ ] Trigger session end (campfire/exit) from the frontend.
- [ ] Confirm a new session row appears in the native Google Sheet.

## Teacher Dashboard

- [ ] Open the Teacher Dashboard.
- [ ] Confirm roster loads (`list_roster` returns player rows, no CORS or 401 errors).
- [ ] Confirm player summaries load (`list_player_summaries` populates the dashboard table).
- [ ] Confirm ungraded reflections appear (`list_campfire_reflections` returns the session created above).
- [ ] Grade the reflection (score ≥ 3 for a passing grade, < 3 for a reset test).
- [ ] Confirm the Sheet updates: `campfire_score`, `campfire_comment`, `campfire_graded_at`, `campfire_graded_by`.
- [ ] Confirm the player save row updates: `last_campfire_score` and `campfire_streak`.

## Rested-readiness buff

- [ ] Reload the player (re-login or re-load the game session) after grading.
- [ ] Confirm the rested-readiness message or buff indicator appears in-game for a high-score grade.
- [ ] Confirm the buff does NOT appear after a grade below the threshold.

## Error / hygiene checks

- [ ] Open browser DevTools — confirm zero unhandled JS errors in the console.
- [ ] Check the Network tab — confirm no CORS errors on Apps Script requests.
- [ ] Confirm no `undefined` or `null` player fields appear in game UI.

## Data cleanup (do before first real classroom use)

- [ ] In the native Google Sheet, find the roster row whose `section_code` contains a Date object string (e.g. starts with `"Thu Jan 01 1970"` or similar).
- [ ] Replace that value with a plain-text section identifier such as `P1`, `P2`, `Section 1`, or the naming convention the class will use.
- [ ] Confirm the corrected value displays correctly when `list_roster` is called.

## Security check (before committing anything)

- [ ] Confirm `Codex/frontend/.env.local` is **not** staged for commit (`git status` should not list it as tracked/modified in a way that would push to remote). See Security Findings section below.
- [ ] Confirm no committed Markdown or `.gs` file contains a live Sheet ID or Apps Script deployment URL.

---

## Security findings (as of 2026-05-31)

> These require manual resolution — do not skip.

**`Codex/frontend/.env.local` is tracked in git.**

Both `.gitignore` and `Codex/.gitignore` list `.env.local`, but the file was committed before those rules were in place and remains tracked. The live Sheet ID, Apps Script Web App URLs, and Google OAuth client ID are therefore in git history.

To untrack it without deleting it:

```powershell
git rm --cached Codex/frontend/.env.local
git commit -m "Stop tracking .env.local — secrets should not be in git history"
```

After that, future changes to `.env.local` will not be staged or pushed.

**`LegendaryHorizon_Playable.html` is tracked and contains an Apps Script URL.**

This is a standalone HTML archive. Confirm whether the URL it contains is still active. If the file is no longer needed in the repo, consider adding it to `.gitignore` or removing it from tracking. If it must stay, ensure the URL it references is a deprecated or sandboxed deployment.
