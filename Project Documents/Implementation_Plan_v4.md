# Legendary Horizon Implementation Plan: Day 3 & Beyond (v4)

Based on the analysis of the `Codex` directory (`DAY_3_HANDOFF.md`, `NEXT_STEPS.md`, `README.md`) against the master project checklist (`LH_Next_Steps.md`), the project has made significant strides in assimilating previous codebases into a cohesive monorepo structure.

## Analysis: Assimilation & Current State
We have successfully laid the architectural foundation for the "Night One" vertical slice:
1. **Monorepo Unification:** The SPA frontend, sample data fixtures, Apps Script backend stubs, and Tiled map configurations are cleanly integrated.
2. **Design Resolution:** The "16 vs 17 Realms" open decision has been resolved—`realm_registry.json` tracks all 17 GDD canon realms.
3. **Core Systems Maturation:** Milestones 4-7 advanced. The trigger dispatcher, manual save simulation, and dynamic exploration loop are functional.
4. **Tiled Integration:** Map metadata is being extracted from Tiled (`aethelwood_demo.json`), setting the stage for real rendering.

## Design Decisions Reached
- **Renderer Choice:** We will proceed with **Phaser** to handle the 2D tilemap rendering, physics, and collisions, replacing the current "overlay button" hotspots.
- **Exit Tickets:** The Gmail draft export requirement has been **removed**. The exit ticket tracking will be handled entirely in-game and routed directly to the Google Apps Script backend to be displayed on the Teacher Portal.

## Open Questions
1. **Google Environment Readiness:** Do you have a dedicated Google Sheet ready with tabs matching `LhSheetSchema` to begin our backend data binding, or should I create a script to generate the initial spreadsheet architecture for you?
2. **Master Checklist Update:** Would you like me to update `LH_Next_Steps.md` to check off the completed milestones to keep it accurate?

---

## Execution Plan (Next Steps)

### Phase 1: Real Persistence (Data Binding)
*Replacing simulated saves with live server interactions.*

#### [MODIFY] `frontend/src/services/manualSaveGateway.ts`
- Remove `simulateManualSavePersist` reliance.
- Implement HTTP POST to `VITE_LH_APPS_SCRIPT_WEBAPP_URL`.

#### [MODIFY] `apps-script/LhWebApp.js`
- Finalize `doPost` to handle `manual_save` and `load_player`.
- Connect the save envelope logic to write directly to Google Sheets using `LhSave_applyManualSaveEnvelope`.

### Phase 2: True Tiled Rendering (Phaser Integration)
*Transitioning from hotspot buttons to an immersive Phaser RPG view.*

#### [NEW] `frontend/src/rendering/*` (or similar component structure)
- Integrate Phaser as the 2D rendering engine.
- Load the exported tile layers from `parseLhTiledMap.ts` into a Phaser scene.
- Implement basic player sprite movement and collision detection against impassable tiles.
- Map the existing trigger dispatcher to Phaser overlap/interaction events.

### Phase 3: Teacher Portal Exit Ticket Routing
*Graduating from local `mailto:` to direct backend logging.*

#### [MODIFY] `apps-script/LhExitTicketService.js` & `frontend/src/services/exitTicketHandoff.ts`
- Remove all `mailto:` draft generation logic.
- Ensure exit ticket data (Quest completion, items gained, student reflections) is packaged in the save envelope and logged directly to the Google Sheet for the Teacher Portal to query.

## Verification Plan

### Automated/Manual Verification
- **Saves & Exit Tickets:** Test a save/exit ticket submission from the SPA, refresh the browser, and verify the data hydrates correctly from the Google Sheet without triggering any email client.
- **Rendering:** Walk a character sprite against a wall in the Phaser scene and verify collision prevents movement. Trigger the "Ley Root" quest advance by interacting with the sprite/tile.
