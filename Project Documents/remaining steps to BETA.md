# Legendary Horizon: Path to Beta Testing (Implementation Analysis & Roadmap)

## 1. Implementation Analysis (v4 Plan Verification)

I have reviewed the `Codex` directory, and I can confirm that the Phase 1, Phase 2, and Phase 3 requirements of our previous plan have been successfully implemented:

- **Data Binding (Success):** `manualSaveGateway.ts` now properly handles `persistManualSaveEnvelope` by making a POST request to the Apps Script Web App when configured, gracefully handling remote loading. `LhWebApp.js` is fully equipped to ingest these saves and write to the Google Sheet.
- **Phaser Integration (Success):** The scaffolding for true rendering has been established via `PhaserExplorationView.tsx`. The project is now structured to support real physics and tilemaps.
- **Exit Ticket Routing (Success):** The `mailto:` fallback has been cleanly excised. The `markExitTicketRemote` function now pings the `mark_exit_ticket` endpoint in `LhWebApp.js`, successfully keeping student reflections in-game and securely routing them to the teacher portal backend.

---

## 2. Path to Beta Testing Checklist

Understanding that Tiled map generation and media asset acquisition are significant ongoing tasks, here is the complete checklist of engineering and integration requirements needed before Legendary Horizon is ready for a classroom beta test:

### A. Environment & Infrastructure (Critical Path)
- [ ] **Provision Production Google Sheet:** Create the canonical `LhPlayerSave` and `LhRoster` sheets using the exact headers specified in `LhSheetSchema`.
- [ ] **Deploy Apps Script Web App:** Publish the Apps Script project as a Web App (Execute as User/Domain) and generate the endpoint URL.
- [ ] **Configure Environment Variables:** Add `VITE_LH_APPS_SCRIPT_WEBAPP_URL` and `VITE_LH_SPREADSHEET_ID` to the frontend `.env.local` file and disable `VITE_LH_FORCE_SIMULATED_SAVE`.
- [ ] **End-to-End Save Test:** Successfully run a full save/load cycle from the live Vite server to the live Google Sheet and back.

### B. Phaser Engine Completion
- [ ] **Tile rendering pipeline:** Map the Tiled JSON layer data (ground, walls, decorations) to Phaser tilemaps to render the visual world.
- [ ] **Sprite Physics & Collisions:** Give the player character a physics body and map Tiled collision boundaries to Phaser's arcade physics engine.
- [ ] **Trigger Overlaps:** Replace the HTML/DOM percentage buttons with invisible Phaser trigger zones. When the player sprite overlaps a zone, fire the existing `triggerDispatcher` events.

### C. UI & Content Polish
- [ ] **HUD & Dialogue Styling:** Finalize the "Amber Glow" UI pass to ensure text contrast, readability for 6th graders, and mobile/Chromebook responsiveness.
- [ ] **Asset Loading Fallbacks:** Ensure that if an image or audio file fails to load (due to school firewalls), the game degrades gracefully without crashing.
- [ ] **Full Realm Integration:** Ensure the `WorldMapOverlay` accurately reflects the 17-realm unlock states driven by the `ExplorationLoopState`.

### D. Classroom Resilience
- [ ] **Offline/Disconnect Handling:** Implement a visual warning if the `manualSaveGateway` HTTP POST fails, allowing the student to retry the save before closing the tab.
- [ ] **Teacher Override Tools:** Ensure the Teacher Portal (or manual spreadsheet edits) can successfully unblock a student (`teacher_unlock_quest`, `teacher_restore_backup`) and that the frontend respects those changes upon reloading.
- [ ] **Performance Audit:** Verify that the Phaser canvas maintains a steady framerate on low-end hardware (e.g., standard school Chromebooks) without memory leaks during long play sessions.

## Beta Scope & Priority Decisions Needed

1. **Beta Scope:** For the first classroom beta test, do we limit the game to just the "Night One" vertical slice (Aethelwood Farmsteads + basic quest interaction), or wait until multiple realms are mapped and populated?
2. **First Priority:** Should we begin prioritizing **A. Environment & Infrastructure** to get real data flowing immediately, or focus on fleshing out **B. Phaser Engine Completion** for visual map testing?
