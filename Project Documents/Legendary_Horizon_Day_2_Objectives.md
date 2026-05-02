# Legendary Horizon — Day 2 Codex Plan

Use this file as your Day 2 build guide after completing Night One.

## Overview

| Item | Details |
|---|---|
| Primary Goal | Move from scaffold to connected systems: live-ish data flow, first real integrations, and one stronger vertical slice. |
| Recommended Focus | Technical plumbing before content expansion. |
| Success Criteria | Live save/load path stubbed or wired, Tiled pipeline started, asset lookup in use, one realm flow improved, and Apps Script connection plan clarified. |
| Suggested Working Style | One bounded Codex prompt at a time. Review, adjust, continue. |
| Do Not Do Yet | Do not attempt all 16/17 realms, full combat, or final polish. |
| Source Note | This Day 2 plan builds on your completed Night One checklist and the current LH technical/design docs. |

**Suggested Day 2 sequence:**  
1. Runtime workbook wiring  
2. Apps Script read/write path  
3. Asset lookup delivery  
4. Tiled trigger schema  
5. Improved vertical slice  
6. Dev log / next steps

## Day 2 Objectives

| Step | Objective | Why It Matters | Deliverable | Suggested Codex Prompt | Priority | Done? |
|---:|---|---|---|---|---|---|
| 1 | Wire runtime data model into the project | Moves the app from static placeholders to project-shaped data. | Frontend and backend both use the same sample schema for player save, quests, realms, and assets. | Create a shared runtime data contract for Legendary Horizon based on my current save workbook, quest workbook, and media asset lookup structure. Add typed sample objects or config files for player save state, quest definitions, realm definitions, roster data, and media asset records so both frontend and backend can use the same field names. | High | Yes |
| 2 | Connect frontend to a real data-loading layer | Proves the UI can consume structured state instead of hardcoded values. | Title/resume/quest log screens load from a centralized data source. | Replace any hardcoded demo values in the Legendary Horizon frontend with a centralized data-loading layer. The frontend should load player name, current act, current realm, current required next action, active quest, XP, level, and inventory summary from shared sample data. | High | Yes |
| 3 | Implement Apps Script read and write stubs for save/load | Begins the real plumbing for Google-based persistence. | SaveService can read a player record and write a manual-save update payload. | Build the first real Apps Script save/load layer for Legendary Horizon. Create functions to read one player save record from Google Sheets and write a manual-save update back to the sheet. Keep it simple, well commented, and aligned to the current save schema. | High | Yes |
| 4 | Define roster and player resolution flow | Students need a reliable way to land in the correct save file and section. | Roster lookup plan using Google identity plus section mapping. | Create the first roster resolution layer for Legendary Horizon. Use a roster structure with student email, student ID, player name, teacher, course, class section, and section code. Add a function that maps a logged-in student identity to the correct player save row. | High | Yes |
| 5 | Add asset lookup integration | Turns Google Drive media storage into a maintainable system. | AssetService resolves media by asset_id instead of hardcoded URLs. | Implement a lightweight AssetService for Legendary Horizon that loads asset records by asset_id from a shared lookup structure. It should support Google Drive file IDs and delivery URLs later, but for now resolve to sample URLs or local placeholders through a clean API. | High | Yes |
| 6 | Start Tiled integration with one realm export | Bridges your authored map work to actual gameplay. | One realm or test map loads with waypoint/trigger metadata. | Create a first-pass Tiled integration layer for Legendary Horizon. Read one exported Tiled JSON map and expose basic data for layers, waypoints, trigger zones, NPC markers, and realm transitions. Do not build the full game map system yet—just create a clean parser or adapter for one map. | High | Yes |
| 7 | Define trigger handling for one quest action | Lets the map actually affect game state. | One click/zone interaction advances one quest or sets one flag. | Add a simple trigger-handling system to the current Legendary Horizon prototype so one map interaction can update quest state. Use one example trigger such as a waypoint reveal, quest start, NPC dialogue trigger, or fog-clear event. | High | Yes |
| 8 | Improve the manual save flow | Manual save is one of the backbone systems and should feel coherent early. | Pause menu save writes state, confirms success, and prepares exit-ticket step. | Upgrade the Legendary Horizon manual save flow so it uses the current save schema and is ready for Apps Script integration. The pause menu save action should validate required fields, write or simulate a save payload, confirm success in-world, and clearly indicate the next step is the exit ticket flow. | High | Yes |
| 9 | Prototype exit-ticket handoff | Links save flow to classroom workflow. | Placeholder or real handoff after successful manual save. | Create a first-pass exit-ticket handoff for Legendary Horizon that occurs only after a successful manual save. For now, a placeholder or mock compose action is acceptable if Gmail integration is not ready. Keep the logic separate from save validation. | Medium | Yes |
| 10 | Strengthen the vertical slice | Gives you a more convincing Day 2 proof of progress. | A coherent playable loop with one real state change. | Extend the current Legendary Horizon vertical slice so it supports this coherent flow: load player state, show resume dialogue, enter one realm, trigger one meaningful quest-related interaction, update the quest log/current required next action, open pause menu, and complete a manual save that prepares the exit-ticket step. | High | Yes |
| 11 | Create a dev handoff note for Day 3 | Gives tomorrow-you a clean restart point. | A short handoff note summarizing Day 2 progress and placeholders. | Write a short developer handoff note for Legendary Horizon summarizing what was implemented on Day 2, what still uses placeholder data, what is partially wired, and the next three recommended implementation steps for Day 3. | Medium | Yes |

## Prompt Bank

### D2-01 — Runtime Data Contract
Create a shared runtime data contract for Legendary Horizon based on my current save workbook, quest workbook, and media asset lookup structure. Add typed sample objects or config files for player save state, quest definitions, realm definitions, roster data, and media asset records so both frontend and backend can use the same field names.

### D2-02 — Frontend Data Binding
Replace any hardcoded demo values in the Legendary Horizon frontend with a centralized data-loading layer. The frontend should load player name, current act, current realm, current required next action, active quest, XP, level, and inventory summary from shared sample data.

### D2-03 — Apps Script Save/Load
Build the first real Apps Script save/load layer for Legendary Horizon. Create functions to read one player save record from Google Sheets and write a manual-save update back to the sheet. Keep it simple, well commented, and aligned to the current save schema.

### D2-04 — Roster Resolution
Create the first roster resolution layer for Legendary Horizon. Use a roster structure with student email, student ID, player name, teacher, course, class section, and section code. Add a function that maps a logged-in student identity to the correct player save row.

### D2-05 — Asset Service
Implement a lightweight AssetService for Legendary Horizon that loads asset records by asset_id from a shared lookup structure. It should support Google Drive file IDs and delivery URLs later, but for now resolve to sample URLs or local placeholders through a clean API.

### D2-06 — Tiled Parser
Create a first-pass Tiled integration layer for Legendary Horizon. Read one exported Tiled JSON map and expose basic data for layers, waypoints, trigger zones, NPC markers, and realm transitions. Do not build the full game map system yet—just create a clean parser or adapter for one map.

### D2-07 — Trigger Handling
Add a simple trigger-handling system to the current Legendary Horizon prototype so one map interaction can update quest state. Use one example trigger such as a waypoint reveal, quest start, NPC dialogue trigger, or fog-clear event.

### D2-08 — Manual Save Upgrade
Upgrade the Legendary Horizon manual save flow so it uses the current save schema and is ready for Apps Script integration. The pause menu save action should validate required fields, write or simulate a save payload, confirm success in-world, and clearly indicate the next step is the exit ticket flow.

### D2-09 — Exit Ticket Handoff
Create a first-pass exit-ticket handoff for Legendary Horizon that occurs only after a successful manual save. For now, a placeholder or mock compose action is acceptable if full Gmail integration is not ready. Keep the logic separate from save validation.

### D2-10 — Vertical Slice Upgrade
Extend the current Legendary Horizon vertical slice so it supports this coherent flow: load player state, show resume dialogue, enter one realm, trigger one meaningful quest-related interaction, update the quest log/current required next action, open pause menu, and complete a manual save that prepares the exit-ticket step.

### D2-11 — Day 3 Handoff Note
Write a short developer handoff note for Legendary Horizon summarizing what was implemented on Day 2, what still uses placeholder data, what is partially wired, and the next three recommended implementation steps for Day 3.

## Implementation Tracker

| Step | Task | Status | Owner | Start | Finish | Blocked? | Notes | Prompt ID | Artifact / File |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Wire runtime data model into the project | Completed | Kevin |  |  | No | Runtime contract + enriched fixtures | D2-01 | `Codex/contracts/README.md`, `frontend/src/domain/lh-contract.ts`, `data/samples/*` |
| 2 | Connect frontend to a real data-loading layer | Completed | Kevin |  |  | No | Central loader + HUD fields | D2-02 | `frontend/src/runtime/loadLhRuntimeFixture.ts`, `useNightOneFlow` |
| 3 | Implement Apps Script read and write stubs for save/load | Completed | Kevin |  |  | No | Needs live tab headers | D2-03 | `apps-script/services/SaveService.js`, `utils/LhSheetIO.js`, `config/LhSheetSchema.js` |
| 4 | Define roster and player resolution flow | Completed | Kevin |  |  | No | SPA heuristic logging + Sheets resolver | D2-04 | `frontend/src/runtime/rosterIdentity.ts`, `apps-script/services/RosterService.js` |
| 5 | Add asset lookup integration | Completed | Kevin |  |  | No | Sheet reader + SPA catalog façade | D2-05 | `frontend/src/services/assetCatalog.ts`, `apps-script/services/AssetService.js` |
| 6 | Start Tiled integration with one realm export | Completed | Kevin |  |  | No | Object-layer parser only | D2-06 | `tiled/aethelwood_demo.json`, `frontend/src/maps/parseLhTiledMap.ts` |
| 7 | Define trigger handling for one quest action | Completed | Kevin |  |  | No | Quest advance trigger | D2-07 | `useNightOneFlow` hotspot activation |
| 8 | Improve the manual save flow | Completed | Kevin |  |  | No | Validation + envelope v1 logging | D2-08 | `frontend/src/services/manualSaveGateway.ts` |
| 9 | Prototype exit-ticket handoff | Completed | Kevin |  |  | No | mailto scaffold post-save | D2-09 | `frontend/src/services/exitTicketHandoff.ts`, `ExitTicketService.js` stub |
| 10 | Strengthen the vertical slice | Completed | Kevin |  |  | No | Tiled hotspots + envelope save | D2-10 | `ExplorationScreen` + flow hook |
| 11 | Create a dev handoff note for Day 3 | Completed | Kevin |  |  | No |  | D2-11 | `Codex/docs/DAY_3_HANDOFF.md` |
