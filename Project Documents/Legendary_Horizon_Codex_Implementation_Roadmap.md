# Legendary Horizon — Codex Implementation Roadmap

## Overall strategy

Build Legendary Horizon in **four lanes at once**, but in small increments:

**Lane 1: Runtime foundation**  
Frontend, services, data loading, save/load, quest state

**Lane 2: Content systems**  
Quests, realms, NPCs, dialogue, lookup data

**Lane 3: Map integration**  
Tiled export parsing, triggers, waypoints, fog, realm transitions

**Lane 4: External integrations**  
Gmail, Sheets, Forms, Slides, Quizlet, Maia, O*NET, Drive assets

The goal is to finish one **vertical slice** first, then expand.

---

## Milestone roadmap

### Milestone 1 — Skeleton to real prototype
**Goal:** turn Night One scaffold into a usable prototype

Small Codex chunks:
1. Clean repo and file naming
2. Add app routing/state flow
3. Connect frontend to local sample data cleanly
4. Build quest log from definitions instead of hardcoded text
5. Build pause menu actions as real stubs
6. Build save/load simulation with realistic state updates
7. Add resume dialogue generation from save data
8. Add asset lookup from media definitions
9. Add one realm placeholder screen with one interaction
10. Add one quest completion flow end to end

**Definition of done:**  
You can load a player, enter one realm, complete one quest step, save, and reload.

---

### Milestone 2 — Real data architecture
**Goal:** replace fake local assumptions with your real data model

Small Codex chunks:
1. Create data interfaces/types for:
   - player save
   - quest definition
   - realm definition
   - inventory
   - session history
   - media asset
2. Normalize sample data to match your spreadsheets/workbooks
3. Build lookup loaders for:
   - realm definitions
   - quest definitions
   - item definitions
   - asset definitions
4. Build validation helpers
5. Create schema version handling
6. Create section/roster mapping model
7. Create save serialization/deserialization helpers
8. Add backup checkpoint data model

**Definition of done:**  
Your code structure matches the docs and spreadsheets, not just placeholder logic.

---

### Milestone 3 — Apps Script service layer
**Goal:** make the backend real

Small Codex chunks:
1. Build `SaveService` methods
   - loadPlayerState
   - autoSaveProgress
   - manualSaveProgress
   - restoreBackupCheckpoint
   - validateSavePayload
2. Build `QuestService`
   - getQuestById
   - getActiveQuestState
   - completeQuestStep
   - unlockNextQuest
   - generateCurrentRequiredNextAction
3. Build `SessionService`
   - beginSession
   - endSession
   - buildSessionSummary
   - writeSessionHistory
4. Build `AssetService`
   - resolveAssetById
   - getRealmAssets
   - getNpcAssets
5. Build `ExitTicketService`
   - buildPromptForCurrentState
   - openPrefilledEmailDraft data
   - markExitTicketState
6. Build `LookupService`
   - valid quest IDs
   - realm IDs
   - item IDs
   - enum values
7. Build `TeacherOverrideService`
   - unlock quest
   - rollback checkpoint
   - restore item
   - reset act state

**Definition of done:**  
Apps Script has real function shells and realistic data flow, even if some integrations are still stubbed.

---

## Parallel Tiled lane

This is the lane Codex should build around while you keep mapping separately.

### Milestone 4 — Tiled import foundation
**Goal:** make the app ready to ingest your map exports

Small Codex chunks:
1. Inspect the Tiled JSON structure in your work folder
2. Create a `MapLoader` module
3. Parse:
   - tile layers
   - object layers
   - properties
   - map dimensions
4. Build a realm/scene adapter from Tiled JSON to app scene data
5. Build trigger extraction
6. Build waypoint extraction
7. Build fog region extraction
8. Build NPC marker extraction
9. Build safe fallback if map data changes
10. Add debug panel to inspect map objects

**Definition of done:**  
Codex can read your current Tiled export and display useful parsed structures.

### Milestone 5 — Trigger system
**Goal:** connect Tiled metadata to gameplay

Small Codex chunks:
1. Define trigger schema
   - quest_start
   - quest_complete
   - npc_dialogue
   - fog_clear
   - external_link
   - vocab_battle
   - combat_encounter
   - guild_hq_research
2. Build trigger dispatcher
3. Build waypoint unlock handler
4. Build fog-clear handler
5. Build quest-trigger handler
6. Build NPC interaction handler
7. Add trigger validation/logging
8. Add nonfatal fallback for bad triggers

**Definition of done:**  
A trigger placed in Tiled can actually update game state.

---

## Realm and exploration lane

### Milestone 6 — Realm framework
**Goal:** make the 17 canon realm/guild definitions usable in code and UI

Small Codex chunks:
1. Build realm registry from your updated canon
2. Add realm cards/list UI
3. Add guild HQ metadata handling
4. Add realm-to-career-cluster mapping
5. Add realm intro text rendering
6. Add realm-specific quest hook support
7. Add realm-specific asset lookup
8. Add realm exploration progress tracking

**Definition of done:**  
The world structure is data-driven and uses your canon names and HQs.

### Milestone 7 — Exploration loop
**Goal:** build the feel of Act III

Small Codex chunks:
1. Show world map with unlocked/locked realms
2. Show fog-cleared state
3. Show visited locations
4. Show active waypoint target
5. Allow entering one exploration zone
6. Allow researching one realm/guild
7. Allow recording one Comparison Ledger entry
8. Update quest state after ledger entry

**Definition of done:**  
Act III starts to feel real.

---

## Save system lane

### Milestone 8 — Real save/load
**Goal:** move from placeholder save to real structured save

Small Codex chunks:
1. Connect frontend state to save payload builder
2. Implement auto-save triggers
3. Implement manual save flow
4. Save half-written responses during end-of-session ritual
5. Save session summary
6. Save last completed event
7. Save current required next action
8. Save backup checkpoint
9. Implement load flow
10. Implement resume dialogue from restored state

**Definition of done:**  
A student can stop and come back without losing context.

### Milestone 9 — Session-end ritual
**Goal:** finish the daily classroom loop

Small Codex chunks:
1. Build pause menu save sequence
2. Confirm save success
3. Generate exit ticket prompt from state
4. Launch Gmail draft/prefill flow
5. Mark exit ticket sent state
6. Handle save failure gracefully
7. Handle Gmail launch failure gracefully
8. Write session history row

**Definition of done:**  
The classroom end-of-session workflow works.

---

## Quest/content lane

### Milestone 10 — Quest engine
**Goal:** make quest progression data-driven

Small Codex chunks:
1. Load quests from definitions
2. Render quest log from data
3. Group by Main / Side / Guild / Completed
4. Track quest states
5. Track prerequisites
6. Unlock quests dynamically
7. Cross off completed quests
8. Surface current required next action
9. Mark turned-in quests
10. Add debug view for quest states

**Definition of done:**  
Quest flow is controlled by data, not scattered code.

### Milestone 11 — Worksheet / research flow
**Goal:** support academic quests cleanly

Small Codex chunks:
1. Build Quest of Fate launcher/state tracking
2. Build Comparison Ledger entry system
3. Build Quest of Choice launcher/state tracking
4. Build Manifest state updates
5. Build Great Transcription state updates
6. Build Chronicle status updates

**Definition of done:**  
Academic tasks are represented as real game progress.

---

## UI lane

### Milestone 12 — Player-facing UI
**Goal:** make the shell usable and classroom-friendly

Small Codex chunks:
1. Finish title screen buttons
2. Finish instructions page
3. Finish pause menu layout
4. Finish quest log UI
5. Finish inventory panel
6. Finish map overlay
7. Finish save/load screen
8. Finish resume dialogue styling
9. Add error message patterns
10. Add loading state patterns

**Definition of done:**  
A student can navigate the experience without you explaining every step.

### Milestone 13 — Accessibility and classroom practicality
**Goal:** make it usable on student devices

Small Codex chunks:
1. Keyboard navigation where possible
2. Clear focus states
3. Readable text scaling
4. Low-clutter layouts
5. Audio on/off toggle
6. Reduced motion option
7. Chromebook-friendly testing pass
8. Basic responsiveness check

**Definition of done:**  
The game works in the real classroom, not just in theory.

---

## Media lane

### Milestone 14 — Drive asset integration
**Goal:** make your asset strategy real

Small Codex chunks:
1. Build media lookup loader from workbook structure
2. Resolve assets by `asset_id`
3. Support image assets
4. Support audio assets
5. Support realm asset bundles
6. Support NPC portrait lookup
7. Add fallback asset logic
8. Add asset preloading for core UI assets
9. Add lazy loading for realm/event assets

**Definition of done:**  
Your Drive-based asset system is real and maintainable.

---

## External integration lane

### Milestone 15 — Classroom tool hooks
**Goal:** connect the game to the real instructional tools

Small Codex chunks:
1. O*NET launch flow
2. Maia launch flow
3. Gmail exit-ticket flow
4. Slides launch flow for Chronicle
5. Forms launch flow for Enrollment Rune or surveys
6. Quizlet launch or completion tracking flow
7. Google Classroom-compatible launch links

**Definition of done:**  
The game can hand students off to the real tools at the right moments.

---

## NPC lane

### Milestone 16 — Dialogue system
**Goal:** make the game feel alive

Small Codex chunks:
1. Dialogue schema
2. NPC registry
3. Master Scribe dialogue set
4. Oracle dialogue set
5. Guild Manager dialogue set
6. Resume NPC dialogue generation
7. Realm lore NPC hooks
8. Conditional dialogue based on quest state

**Definition of done:**  
Core NPCs speak based on game state.

---

## Combat / encounter lane

### Milestone 17 — Encounter system
**Goal:** build one simple version, not a giant action game

Small Codex chunks:
1. Decide simple combat state model
2. Build one hack-and-slash encounter prototype
3. Build one vocab battle launcher
4. Add encounter completion rewards
5. Add session XP cap enforcement
6. Add quest-linked encounter results
7. Add failure/retry behavior
8. Add encounter logging

**Definition of done:**  
One combat encounter and one vocab encounter work and reward correctly.

---

## Teacher/admin lane

### Milestone 18 — Teacher controls
**Goal:** give you rescue tools

Small Codex chunks:
1. Teacher override data read/write
2. Unlock stuck quest
3. Restore backup
4. Restore lost item
5. Mark exit ticket complete
6. Reset to act start
7. Basic section filter support
8. Basic player state debug viewer

**Definition of done:**  
You can fix student issues without touching raw data every time.

---

## Testing lane

### Milestone 19 — Stability pass
**Goal:** stop fragile behavior early

Small Codex chunks:
1. Save/load validation tests
2. Quest progression tests
3. Trigger schema tests
4. Asset resolution tests
5. Resume dialogue tests
6. Session-end flow tests
7. Broken external link tests
8. Missing roster mapping tests

**Definition of done:**  
The prototype survives normal classroom weirdness.

---

## Best Codex sequence from here

If Night One is complete, I would do Day 2+ in this exact order:

1. **Milestone 2 — Real data architecture**  
2. **Milestone 4 — Tiled import foundation**  
3. **Milestone 10 — Quest engine**  
4. **Milestone 8 — Real save/load**  
5. **Milestone 14 — Drive asset integration**  
6. **Milestone 5 — Trigger system**  
7. **Milestone 7 — Exploration loop**  
8. **Milestone 15 — Classroom tool hooks**  
9. **Milestone 16 — Dialogue system**  
10. **Milestone 17 — Encounter system**

That order gives you the fastest path to a real playable slice.

---

## How to use Codex on the Tiled side

Because your map is being worked on separately, I’d tell Codex things like:
- “Assume the Tiled file in the work folder is the active source map.”
- “Do not redesign the map.”
- “Build import/parsing support around the existing file structure.”
- “Create adapters that tolerate changes in map content.”
- “Use placeholder fallbacks when a layer/object/property is missing.”

That keeps Codex from fighting your separate mapping process.

---

## Good chunk size rule

Each Codex task should ideally be one of these:
- one service
- one UI component
- one data adapter
- one trigger type
- one external integration
- one state flow
- one test pass

That is the right size.

Bad chunk:
- “Build Act III.”

Good chunk:
- “Build the Comparison Ledger state update flow when a realm research entry is completed.”

---

## Suggested immediate next 10 Codex tasks

Here is the exact next batch I’d hand Codex:

1. Inspect the Tiled file in the work folder and generate a map structure summary.
2. Build a `MapLoader` that parses the Tiled export into realm/trigger/waypoint data.
3. Normalize quest definitions so the frontend quest log loads from data.
4. Implement dynamic current-required-next-action generation from quest state.
5. Replace placeholder save objects with the approved save schema.
6. Implement manual save payload building from live frontend state.
7. Implement resume dialogue generation from loaded save data.
8. Build the realm registry using the updated realm/guild canon.
9. Implement asset lookup by `asset_id` using the media workbook structure.
10. Add one real trigger from map interaction to quest state update.
