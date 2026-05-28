# Act I Completion Sequence — Implementation Report

**Session date:** 2026-05-27  
**Branch:** main

---

## Overview

Autonomous implementation of the Act I completion sequence ("Foretold Signposts / Scroll of Destiny") for Legendary Horizon. All tasks completed; TypeScript exits clean.

---

## Files Created

| File | Purpose |
|------|---------|
| `Codex/frontend/src/data/guildData.ts` | 16-entry `GUILD_REGISTRY` with RIASEC codes + thematic descriptors |
| `Codex/frontend/src/data/guildRunes.ts` | Inline SVG rune data for all 16 canon guilds; `GUILD_RUNES` keyed by `realm_id` |
| `Codex/frontend/src/modules/act1/signpostAlgorithm.ts` | Pure RIASEC scoring + Foretold Signpost computation |
| `Codex/frontend/src/modules/act1/MasterScribeSurveyModule.tsx` | 12-question RIASEC survey module (Act I, mq-104) |
| `Codex/frontend/src/modules/act1/ScrollRevealSequence.tsx` | Cinematic fullscreen Scroll of Destiny reveal overlay |
| `Codex/frontend/src/components/ScrollOfDestinyDisplay.tsx` | Full pause-menu hub — 3-column layout (Holland Codes | Traveler | Quests) |

---

## Files Modified

| File | Change |
|------|--------|
| `Codex/frontend/src/modules/moduleRegistry.ts` | Added `mod_master_scribe_survey` (Act 1, mq-104) |
| `Codex/frontend/src/components/ModuleHostOverlay.tsx` | Import + route for `MasterScribeSurveyModule` |
| `Codex/data/samples/dialogue_catalog.json` | Added `scribe_invites_survey` and `scribe_send_to_oracle` lines |
| `Codex/apps-script/config/LhSheetSchema.js` | Added `riasec_r/i/a/s/e/c`, `foretold_signpost_1/2/3_guild_id`, `scroll_generated_at` |
| `Codex/apps-script/services/SaveService.js` | RIASEC + signpost column writes in `lhSave_writeEnvelopeExtensionColumns_` |
| `Codex/frontend/src/hooks/useNightOneFlow.ts` | `scrollRevealOpen` state; `mod_master_scribe_survey` handler in `applyModuleResult` |
| `Codex/frontend/src/App.tsx` | Wired `<ScrollRevealSequence>`; computed `surveyRiasecScores` from module draft |
| `Codex/frontend/src/vite-env.d.ts` | Added `VITE_LH_SCROLL_BG_IMAGE` env var declaration |

---

## Key Decisions

### Survey designed from scratch
`Project Documents/Quest_of_Fate.html` is the "Vault of the Ancient Runes" (BLS OOH tile grid), not a RIASEC survey. Survey was built with 12 questions × 4 choices. RIASEC code distribution across 48 slots: R=12, I=10, A=8, S=7, E=5, C=6. Normalization formula `(picks/appearances)*20` corrects for unequal frequency.

### `guild_id` equals `realm_id`
The codebase uses `realm_id` as the canonical key everywhere. `guildData.ts` uses `realm_id` values as `guild_id` so signpost output feeds `foretold_signpost_realm_ids` without translation.

### Signpost scoring formula
`(riasec_primary_score/20)*3 + (riasec_secondary_score/20)*2 + (guild_hint_count*4)`. Dividing by 20 normalizes RIASEC modifiers to the same scale as the +4 survey hint bonus. Tie-break at position 3: prefer guild whose primary code matches the student's highest Holland Code.

### RIASEC score persistence
Scores are written as `riasec_r/i/a/s/e/c` string fields into `module_drafts.mod_master_scribe_survey` on completion. `App.tsx` reads them back and passes to `ScrollRevealSequence`. The SaveService also writes them as standalone Sheets columns for teacher reporting.

### Scroll reveal trigger
`scrollRevealOpen` flag set in `applyModuleResult` when `mod_master_scribe_survey` completes. Dismissed via "Carry the Scroll" button → `dismissScrollReveal()`. The reveal animates through 5 stages: backdrop fade → header → RIASEC bars → signpost runes (amber glow pulse) → button.

### Oracle sequence untouched
Per instruction: all Oracle-related files (`mod_oracle_of_fate`, `OracleOfFateModule`, `OracleCinematicPlayer`, `OracleProphecyReveal`) are unchanged.

### 16 guilds, not 15
GDD has 16 canon realms. All 16 implemented.

---

## Sheets Columns to Add

Add these columns to `LhPlayerSave` tab in spreadsheet `1rmERBiorRcdeaHSJntiA_Z-vJ19_5MxB` before the survey save will write them. `lhSave_writeFieldIfPresent_` silently skips absent columns so existing saves are safe.

```
riasec_r    riasec_i    riasec_a    riasec_s    riasec_e    riasec_c
foretold_signpost_1_guild_id
foretold_signpost_2_guild_id
foretold_signpost_3_guild_id
scroll_generated_at
```

---

## TypeScript

`npx tsc --noEmit` exits clean (0 errors).
