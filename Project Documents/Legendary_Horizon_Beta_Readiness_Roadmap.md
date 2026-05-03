# Legendary Horizon — Beta Readiness Roadmap

Updated: May 2, 2026  
Status: Approved direction based on the new **remaining steps to BETA** source and prior project canon decisions.

---

## 1. Purpose of this document

This roadmap translates the broader Legendary Horizon implementation plan into a **beta-readiness plan**.

At this stage, the question is no longer just "what should we build?" It is now:

**What must be stable, playable, savable, and teacher-manageable before students use it in a real classroom beta?**

This document therefore prioritizes:
- reliable persistence
- playable exploration
- classroom-safe recovery
- limited beta scope over full-world completeness

It also adopts the confirmed project decision that **Legendary Horizon currently contains 16 canon realms**. The previously referenced **Arcanum Reactor / Energy realm** is removed from current canon for now to avoid confusion and should not be included in beta completion counts, map completion percentages, or implementation assumptions.

---

## 2. What the new beta source confirms

The new beta source confirms that important foundation work is already in place:

- **Data binding is functioning** through the manual save gateway and Apps Script web app pipeline.
- **Phaser scaffolding exists** via `PhaserExplorationView.tsx`, meaning the project is structured for true tilemap-based play.
- **Exit ticket routing is now backend-driven**, with the old `mailto:` fallback removed and teacher-facing routing handled through the Apps Script layer.

This is a major milestone. It means Legendary Horizon is no longer only a concept prototype. It has crossed into a phase where the remaining work is primarily about **making the vertical slice classroom-safe**.

---

## 3. Beta philosophy

### Recommended beta model

The first real student beta should be a **limited vertical slice**, not a multi-realm full-content beta.

### Why

A classroom beta should test:
- whether students understand the flow
- whether saves work consistently
- whether a teacher can recover stuck students
- whether the game feels coherent and motivating
- whether school hardware can run it reliably

A first beta does **not** need:
- all realms fully mapped
- complete asset coverage
- every guild fully playable
- total world completion

### Recommended beta scope

The first classroom beta should include:
- one working exploration area
- one realm implemented end-to-end
- one complete quest progression loop
- real save/load
- real exit-ticket submission
- teacher recovery capability
- stable UI readability on student devices

This is the smallest version that still produces meaningful classroom feedback.

---

## 4. Canon for beta scope

For implementation and testing purposes, use the following canon rules:

- **Realm count = 16**
- **Arcanum Reactor / Energy** is **not active canon** for current implementation
- all map logic, progression percentages, and unlock logic should assume **16 total realms**
- any legacy references to 17 realms should be cleaned up before hard-coding counts into production-facing systems

### Practical implementation effect

Update all of the following to reflect 16 realms:
- world map completion calculations
- realm registry constants
- unlock totals
- exploration progress UI
- spreadsheet validation rules
- media tagging assumptions
- teacher/admin tools that reference realm totals

---

## 5. Priority order from now to beta

## Priority 1 — Environment & Infrastructure

This is the first gate because without live persistence, the project is not classroom-safe.

### Required tasks
- Provision the production Google Sheet using the exact save and roster headers expected by the live schema.
- Deploy the Apps Script project as a live web app.
- configure the frontend environment variables for the web app URL and spreadsheet ID
- disable forced simulated save mode
- run a full end-to-end live save/load test from frontend to sheet and back

### Definition of done
A student can:
- log in or load a session
- make progress
- save successfully to live infrastructure
- reload later and resume from the correct state

### Why this comes first
If save/load is unreliable, nothing else matters in a classroom. Students will lose progress, and the teacher cannot trust the tool.

---

## Priority 2 — Phaser Engine Completion

Once live persistence is real, the next requirement is making exploration genuinely playable.

### Required tasks
- connect Tiled JSON layer data to Phaser tilemaps
- render visible world layers correctly
- add player sprite physics body
- wire collision boundaries from Tiled into Phaser physics
- replace HTML or percentage-button trigger substitutes with true overlap zones
- connect overlap zones to the trigger dispatcher

### Definition of done
A player can:
- move through a real map scene
- collide with boundaries correctly
- enter trigger zones by movement rather than clicking placeholders
- fire quest, fog, dialogue, or interaction events from true map traversal

### Why this is second
This is the point where Legendary Horizon begins to feel like the actual game rather than a dressed-up interface shell.

---

## Priority 3 — Classroom Resilience

This category is what makes the build safe for real student use.

### Required tasks
- show a clear warning when save POST requests fail
- allow save retry before a student closes the tab
- verify teacher override tools work for stuck-state recovery
- confirm restore and unlock actions are respected by the frontend after reload
- test performance on low-end school Chromebooks
- watch for memory issues during longer play sessions

### Definition of done
If a student gets stuck, disconnects, or partially fails to save:
- the issue is visible
- the teacher has a recovery path
- the session can continue without manual engineering intervention

### Why this is third
A beta without recovery tools creates fragile classroom conditions and increases teacher burden too much.

---

## Priority 4 — UI and Content Polish

This is important, but it should come after function, not before.

### Required tasks
- complete the amber-glow readability pass
- verify text contrast and readability for 6th graders
- improve Chromebook and mobile responsiveness where needed
- add fallback behavior for blocked or failed image/audio assets
- verify world map overlay correctly reflects the current exploration loop state
- ensure realm-state visuals match the 16-realm canon

### Definition of done
The build feels intentional, readable, and resilient even when certain assets fail to load.

### Why this is fourth
Polish matters, but it should not delay infrastructure, real movement, or teacher recovery.

---

## 6. Recommended beta build sequence

## Phase A — Classroom-safe data backbone
Goal: make persistence real before anything else

1. create live production sheet
2. deploy Apps Script web app
3. connect environment variables
4. disable simulated save mode
5. run end-to-end live save/load verification
6. verify exit-ticket submission reaches the teacher backend

### Deliverable
A real student session can persist safely.

---

## Phase B — Playable realm slice
Goal: make one realm truly playable inside Phaser

1. choose one beta realm
2. connect Tiled JSON for that realm to Phaser tilemaps
3. implement player movement and collisions
4. implement trigger overlaps
5. connect at least one quest interaction to map traversal
6. verify save/load across that realm state

### Deliverable
One full playable exploration loop exists.

---

## Phase C — Recovery and teacher control
Goal: make beta safe for classroom conditions

1. add save-failure warning state
2. add retry flow
3. test teacher unlock and restore flows
4. verify roster-level recovery logic
5. test resume behavior after intervention

### Deliverable
Teacher can recover a student without engineering help.

---

## Phase D — Beta polish pass
Goal: improve clarity and reduce friction

1. finish HUD readability pass
2. verify quest log clarity
3. test blocked asset fallback behavior
4. correct any remaining 17-realm references
5. audit world map completion logic for 16-realm canon
6. run Chromebook performance checks

### Deliverable
The beta build is readable, stable, and coherent.

---

## 7. Recommended first beta realm

The first beta realm should be whichever realm currently has the strongest combination of:
- existing map progress
- available art and ambient assets
- clear quest hook
- minimal dependency complexity

If Aethelwood Farmsteads or another early exploration-friendly realm already has stronger partial implementation, that is a better beta candidate than waiting for a larger multi-realm deployment.

### Selection rule
Choose the realm that lets you test:
- movement
- trigger overlap
- one research interaction
- one quest completion
- one save/reload cycle

The best beta realm is **not** the coolest realm. It is the one that proves the loop fastest and safest.

---

## 8. What should not block beta

Do **not** wait on these before running a first classroom beta:
- all 16 realms being mapped
- full media library completion
- final lore completeness in every region
- every guild trial being built
- broad side-quest coverage
- perfect visual polish

Those belong to expansion after the vertical slice proves itself.

---

## 9. Immediate next-action recommendation

The next active implementation priority should be:

### **Build the classroom-safe vertical slice in this order:**
1. live sheet + live Apps Script deployment
2. end-to-end save/load verification
3. one Phaser realm with true tilemap movement and trigger overlaps
4. teacher recovery tools validation
5. polish pass for readability and asset fallback

This sequence gives the fastest path to a real beta without overbuilding.

---

## 10. Suggested “Beta Ready” exit criteria

Legendary Horizon should be considered ready for an initial classroom beta when all of the following are true:

- a student can enter the game and progress through a real playable realm
- the player state saves to live infrastructure and reloads correctly
- at least one quest loop completes end-to-end
- exit-ticket data routes correctly to the backend
- the teacher can recover a stuck student using override tools
- the build performs acceptably on school hardware
- all production-facing systems reflect **16 active realms**, not 17

---

## 11. Bottom-line recommendation

Legendary Horizon is now in a **beta hardening phase**, not a broad ideation phase.

The correct move is **not** to expand the whole world first.
The correct move is to **stabilize one authentic slice of the world** and make it classroom-safe.

That means:
- persistence first
- real exploration second
- recovery third
- polish fourth
- expansion after proof

This is the fastest, safest, and most teacher-friendly path to a successful first beta.
