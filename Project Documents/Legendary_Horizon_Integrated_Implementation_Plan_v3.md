# Legendary Horizon — Integrated Implementation Plan v3
**Status:** Active build plan  
**Canon decision date:** May 2, 2026  
**Project:** Legendary Horizon

---

## 1. Canon decision now locked

### Final active realm count: **16**
The active build of **Legendary Horizon** will use **16 realms**.

### Energy / The Arcanum Reactor decision
The previously referenced realm **The Arcanum Reactor** (Energy career cluster) is being **removed from the active canon for this build**.

#### Reason
During project research and curriculum cross-checking, the **Energy** cluster appeared in some sources but not others, including school-provided curriculum references. It may be a valid future option, but it is currently creating confusion in:
- realm counts
- map completion logic
- lookup tables
- quest references
- implementation prompts
- asset planning

#### Canon rule going forward
For the current production plan:
- **Legendary Horizon contains 16 active realms**
- **The Arcanum Reactor is excluded from current code, map, quest, asset, and save logic**
- **Energy remains a parked / future expansion option**
- it should not be referenced in current completion percentages, world totals, or active realm registries

#### Future expansion note
If you revisit Energy later, treat it as:
- a future content pack
- an optional expansion realm
- a post-core-build addition requiring a deliberate canon update

---

## 2. Build philosophy for Cursor and Codex

This plan is written to work well with **Cursor** and **Codex-style coding sessions**, where token/context efficiency matters.

### Rules for token-conscious implementation
1. **Build in narrow vertical slices**
   - do not prompt for the whole game at once
   - prompt for one module, one adapter, one save hook, or one quest flow at a time

2. **Centralize shared systems early**
   - avoid re-explaining quest logic, save logic, and data structure in every prompt
   - create shared files and shared types once

3. **Prefer adapters over rewrites**
   - each completed sub-app should be adapted into the main shell
   - rewrite only when the old code fundamentally conflicts with the architecture

4. **Freeze canon before deep coding**
   - realm count, IDs, quest IDs, module IDs, and active sub-app assignments should be fixed first

5. **Prompt by file target**
   - best prompt style:
     - “Create `moduleAdapter.ts`”
     - “Refactor `Trial_of_Tonguesv2` to use shared `realm_id` input”
     - “Add transcript save payload for GT-102”
   - worst prompt style:
     - “Build the whole integration system”

6. **Keep prompts grounded in one responsibility**
   - one service
   - one screen
   - one data model
   - one integration hook
   - one quest completion pathway

### Recommended prompt size
For Cursor/Codex sessions:
- target **small files or one edited file at a time**
- aim for **1–3 related changes per prompt**
- keep prompts anchored to exact outputs:
  - function names
  - schema names
  - file names
  - acceptance criteria

---

## 3. What this plan is trying to accomplish

This implementation plan is designed to:

1. absorb the pre-existing sub-apps into one unified Legendary Horizon experience  
2. reduce redundant rebuilding  
3. preserve the best completed work you already have  
4. connect every sub-app to:
   - quest progression
   - save/load
   - realm canon
   - player state
   - teacher-friendly recovery and oversight  
5. create a sequence of development work that is realistic for iterative AI-assisted coding

---

## 4. Current official sub-app assignments

## Act I / Act V support
### 4.1 Janene's SOD
**Role in game:** Manifest / NYS Career Plan support backbone

**Use for:**
- self-exploration and early player profile capture
- guided form completion
- partial progress visibility
- export / copy support
- final transcription assistance later in the campaign

**Implementation direction:**
- do not keep it as a fully separate standalone experience
- split it into reusable internal modules inside the game shell
- keep its strongest features:
  - structured progression
  - copy/export helper logic
  - visible completion support
  - form-mirroring support

---

## Act II
### 4.2 Oracle of Fate
**Role in game:** prophecy assignment module

**Use for:**
- Oracle encounter
- prophecy reveal
- quest transition into research flow

**Implementation direction:**
- keep the fantasy presentation
- remove purely local standalone behavior
- convert the output into a canonical saved result:
  - prophecy ID
  - mapped career/path
  - quest unlock event

### 4.3 Vault of Runes
**Role in game:** research portal / Quest of Fate launcher

**Use for:**
- linking prophecy result to a research destination
- transitioning from prophecy to worksheet/research

**Implementation direction:**
- replace hardcoded portal logic with lookup-driven mappings
- make it launch the correct research flow from saved prophecy state
- record that the research target was opened and/or completed

---

## Act III
### 4.4 Fog of the Unknown
**Role in game:** world map / exploration layer

**Use for:**
- world access
- fog clearing
- realm reveals
- exploration progression
- realm entry points

**Implementation direction:**
- keep as the prototype foundation for map feel and presentation
- refactor to align to:
  - 16 realms only
  - stable `realm_id`
  - save-driven visited/unlocked state
  - Tiled-compatible metadata
- remove any remaining references to 17 total realms or Energy

---

## Act IV
### 4.5 Ungamified Job Application
**Role in game:** GT-101 Complete the Enrollment Rune

**Use for:**
- formal application trial
- professionalism task
- preparation for interview trial

**Implementation direction:**
- refactor from standalone external website feel into guild trial framing
- preserve the strong form logic
- integrate into:
  - quest state
  - completion payload
  - pass/submit state
  - unlock pathway into GT-102

### 4.6 Trial_of_Tonguesv2
**Role in game:** GT-102 Pass the Trial of Tongues

**Use for:**
- guild-manager interview
- AI-driven dialogue trial
- professionalism and soft-skill evaluation
- pass/fail gate before later guild trials

**Implementation direction:**
- this is now the official foundation for the chatbot interview system
- do not rebuild from zero
- refactor and integrate it into the main shell

**Important note**
The earlier `Trial of Tongues` file appears to be the wrong/older duplicate and should not be treated as the official GT-102 base. The **v2** file is the real one to build from.

---

## 5. Core architecture decision

The main build should follow one structure:

### Shared runtime shell
A single player-facing app shell should own:
- routing
- quest state
- save/load
- current realm
- active module
- session summary
- teacher/admin hooks

### Sub-apps become modules
Each completed sub-app should be transformed into a **module**, not kept as an isolated app.

That means every imported sub-app should eventually behave like:
- a route or screen within the shell
- a quest step with entry rules
- a producer of a standard result payload
- a resumable stateful interaction

---

## 6. High-level build lanes

To keep implementation logical and token-efficient, development should run in these lanes.

### Lane A — Canon and data
Freeze IDs, tables, registry entries, and schema.

### Lane B — Runtime shell
Build shared navigation, module loading, quest integration, and save/load.

### Lane C — Module adaptation
Refactor each completed sub-app into a shell-compatible module.

### Lane D — Quest and save integration
Connect module outcomes to progression and resumable state.

### Lane E — Map and realm systems
Refactor Act III exploration into canonical realm-aware structure.

### Lane F — Teacher and classroom resilience
Add recovery, override, and session-end practicality.

---

## 7. Phase-by-phase implementation plan

## Phase 1 — Freeze canon and create the registry layer
**Goal:** remove ambiguity before coding deeper systems

### Tasks
1. finalize the **16-realm active registry**
2. remove **Arcanum Reactor / Energy** from active implementation data
3. assign stable IDs for:
   - `realm_id`
   - `quest_id`
   - `module_id`
   - `npc_id`
   - `item_id`
4. create a single source-of-truth module registry
5. map every active quest touchpoint to one or more modules

### Deliverables
- `realmDefinitions.ts` or equivalent lookup source
- `questDefinitions.ts`
- `moduleRegistry.ts`
- written canon note documenting that Energy is excluded from active build

### Why this matters
Without this step, Cursor/Codex will keep reintroducing contradictions around realm count and module references.

---

## Phase 2 — Build the shared data contracts
**Goal:** create the schemas every module will use

### Required types / schemas
- `PlayerSave`
- `QuestState`
- `RealmDefinition`
- `ModuleDefinition`
- `ModuleProgressState`
- `ModuleResultPayload`
- `SessionSummary`
- `InterviewTranscriptRef`
- `ApplicationSubmissionRef`

### Required core fields
#### Player save
- player ID
- current quest
- active module
- current realm
- unlocked realms
- visited realms
- XP total
- earned items
- selected true path
- last save timestamp

#### Module progress
- `module_id`
- status
- started_at
- updated_at
- partial responses
- completion flags
- resume context

#### Module result payload
- `module_id`
- `quest_id`
- `realm_id`
- status
- score
- artifacts created
- unlock events
- timestamps

### Deliverables
- shared type files
- schema validation helpers
- serialization/deserialization helpers

---

## Phase 3 — Build the module adapter layer
**Goal:** create one reusable way to plug old sub-apps into the game

Each imported sub-app should implement or be wrapped by these lifecycle concepts:

### Required adapter behaviors
- `loadModuleState(playerState, questState)`
- `renderModuleContext(moduleConfig)`
- `submitModuleResult(resultPayload)`
- `emitQuestEvent(eventType, data)`
- `buildResumeSummary()`

### Adapter responsibilities
- receive canonical IDs
- receive player and quest context
- restore partial progress
- emit a standard completion payload
- avoid owning the master save system directly

### Deliverables
- `moduleAdapter.ts`
- one sample adapted module proving the pattern
- shell-to-module context loader

### Best first adapter targets
1. GT-101 Enrollment Rune
2. GT-102 Trial of Tongues

These two give you the cleanest vertical slice of Act IV progression.

---

## Phase 4 — Build the runtime shell
**Goal:** create the main game wrapper around all modules

### Shell responsibilities
- route to screens/modules
- display quest objective
- display current next action
- show player progress
- allow save/load
- allow resume after absence/interruption
- handle unlock transitions

### Core UI needed
- title/start/continue screen
- instructions / how to play
- quest log
- manifest access
- module host screen
- save/load screen
- pause menu
- resume summary panel

### Deliverables
- initial shared layout
- shared menu system
- routing/state flow
- module host container

---

## Phase 5 — Save/load and resume foundation
**Goal:** make every module interrupt-safe and classroom-safe

### Save requirements
Autosave when:
- a quest step completes
- a form is submitted
- a fog section is cleared
- a module checkpoint is reached
- a major dialogue phase completes

Manual save should also be available.

### Resume requirements
On return, the system should restore:
- current quest
- current module
- current realm
- latest checkpoint
- partial form/interview state
- current next action

### Deliverables
- `SaveService`
- autosave triggers
- manual save action
- restore/resume flow
- backup checkpoint support

---

## Phase 6 — Integrate GT-101 Enrollment Rune
**Goal:** turn the existing application app into the first real integrated guild trial

### Source
**Ungamified Job Application**

### What should be preserved
- form structure
- data collection logic
- completion/validation feel
- application workflow

### What should change
- re-theme into guild trial framing
- remove irrelevant external-business identity assumptions
- add canonical `realm_id` and `quest_id`
- emit standardized completion payload
- save progress mid-form
- unlock GT-102 on successful submission

### GT-101 result payload should include
- `quest_id`
- `module_id`
- `realm_id`
- submission status
- validation status
- completion timestamp
- unlock event for GT-102

### Deliverables
- adapted GT-101 route
- Enrollment Rune completion logic
- save/load support
- quest unlock callback

---

## Phase 7 — Integrate GT-102 Trial of Tongues
**Goal:** adapt the real chatbot interview into the official AI interview module

### Source
**Trial_of_Tonguesv2**

### Why this matters
This is the first known real implementation of the missing interview chatbot and should be treated as the official foundation for GT-102.

### What already exists in v2
- realm manager NPC definitions
- interview phases
- chat log
- AI call structure
- favor/reputation meter
- soft-skill scenario checks
- pass/fail-oriented interaction structure

### What must change for integration

#### 7.1 Realm loading
Replace any hardcoded default realm with save-driven loading:
- load player `realm_id`
- load selected true path
- resolve correct guild manager

#### 7.2 NPC data externalization
Move NPC definitions into shared lookup data:
- `npc_id`
- `realm_id`
- `name`
- `title`
- `avatar`
- `prompt_style`
- `difficulty`
- `intro_text`

#### 7.3 Secure AI integration
Do not embed the live model key in the frontend component.

Instead:
- frontend sends turn data to backend
- backend calls the model securely
- frontend receives response
- transcript is logged safely

#### 7.4 Transcript persistence
Store:
- all turns
- current turn count
- score state
- favor value
- soft-skill results
- final result
- retry count
- interruption checkpoint

#### 7.5 Completion and pass/fail
If passed:
- award Trial of Tongues Seal
- grant XP
- unlock GT-103

If failed:
- save the failure state
- provide narrative feedback
- allow retry rules and/or teacher override
- optionally route to scaffolded retry later

### GT-102 result payload should include
- `module_id`
- `quest_id`
- `realm_id`
- `npc_id`
- transcript reference
- favor score
- soft-skill score
- pass/fail
- completed timestamp
- teacher review flag if needed

### Deliverables
- integrated Trial of Tongues route
- secure model call path
- transcript save support
- quest unlock integration
- retry / failure handling

---

## Phase 8 — Integrate Oracle of Fate and Vault of Runes
**Goal:** complete the Act II prophecy-to-research loop

## Oracle of Fate
### Preserve
- fantasy reveal flow
- divination presentation
- prophecy framing

### Change
- result must become canonical player data
- tie prophecy result to quest progress
- trigger MQ-203 unlock
- record selected/revealed path data

## Vault of Runes
### Preserve
- portal/gateway feel
- numerically linked destiny ritual

### Change
- replace hardcoded mappings with lookup-driven mappings
- remove standalone isolated behavior
- record opened research target
- connect to Quest of Fate completion tracking

### Deliverables
- prophecy result saver
- research target resolver
- Act II quest integration
- unlock/state handoff into worksheet/research flow

---

## Phase 9 — Integrate Fog of the Unknown into the map lane
**Goal:** turn the exploration prototype into the official Act III world layer

### Preserve
- visual feel of fog clearing
- marker-based exploration
- atmospheric reveal structure

### Change
- remove all 17th-realm confusion
- enforce 16 active realms only
- migrate to stable `realm_id`
- connect visited/unlocked state to save data
- prepare for Tiled object compatibility
- ensure realm progression reflects official Act III exploration flow

### Map data should eventually support
- realm markers
- visited state
- unlocked state
- fog-cleared state
- quest-relevant waypoints
- research-only guild hall visits in Act III

### Deliverables
- 16-realm map registry
- save-driven fog state
- save-driven realm progression
- Tiled metadata bridge

---

## Phase 10 — Integrate Janene's SOD as Manifest support
**Goal:** use the strongest academic support app as the player-record and transcription backbone

### Preserve
- structured step-by-step support
- progress visibility
- strong field guidance
- form mirroring / copy support

### Change
- split into reusable modules rather than a monolith
- bind fields to save model
- connect to early self-discovery and later finalization/transcription
- allow partial completion and return

### Best structure
Break it into internal modules such as:
- player profile / self-discovery
- strengths and experiences
- goals and interests
- final export/transcription helper

### Deliverables
- adapted Manifest modules
- save-linked field state
- final transcription support route

---

## Phase 11 — Teacher/admin and classroom resilience
**Goal:** make the game truly usable in a real classroom

### Teacher functions
- unlock quest
- mark module complete
- reset module
- restore backup
- override GT-102 result
- reopen a failed trial
- inspect interview summary
- inspect application status

### Recovery functions
- “Previously on your journey...” summary
- resume active module
- see current next action
- restore from checkpoint

### Deliverables
- TeacherOverrideService
- module summary views
- recovery summary generator

---

## 8. Recommended build order

Here is the most logical order to implement this plan.

### Milestone 1
Freeze canon and data:
- 16-realm registry
- remove Arcanum Reactor from active build
- create module registry
- define shared schemas

### Milestone 2
Build the shell and adapter pattern:
- shared app shell
- module host
- quest state basics
- save/load basics
- one sample adapted module

### Milestone 3
Integrate GT-101:
- Enrollment Rune
- save support
- completion payload
- GT-102 unlock

### Milestone 4
Integrate GT-102:
- Trial_of_Tonguesv2 adaptation
- secure model call
- transcript persistence
- pass/fail and unlock logic

### Milestone 5
Integrate Act II:
- Oracle of Fate
- Vault of Runes
- prophecy/research save handoff

### Milestone 6
Integrate Act III:
- Fog of the Unknown
- realm save state
- Tiled-ready metadata layer

### Milestone 7
Integrate Manifest support:
- Janene's SOD modularization
- self-discovery and finalization support

### Milestone 8
Teacher/admin and polish:
- override tools
- resume summaries
- classroom-end ritual
- reporting and recovery

---

## 9. Codex/Cursor prompt strategy by phase

## For Phase 1
Use prompts like:
- “Create a TypeScript realm registry with exactly 16 active realms and exclude Energy/Arcanum Reactor.”
- “Create a module registry that maps completed sub-apps to quest IDs.”

## For Phase 2
- “Create shared interfaces for PlayerSave, ModuleDefinition, ModuleProgressState, and ModuleResultPayload.”
- “Add schema validation helpers for module result payloads.”

## For Phase 3
- “Create a reusable module adapter for loading module state and submitting completion payloads.”
- “Create a module host route that renders modules by module_id.”

## For GT-101
- “Refactor the Ungamified Job Application into an Enrollment Rune module that emits a standardized completion payload.”
- “Add save/load support for partially completed GT-101 form state.”

## For GT-102
- “Refactor Trial_of_Tonguesv2 so the realm manager is resolved from player save state instead of a hardcoded default.”
- “Move NPC manager definitions into shared lookup data.”
- “Replace direct model key usage with a backend interview-turn API.”
- “Add transcript persistence and pass/fail result payload emission.”

## For Act II
- “Refactor Oracle of Fate so the prophecy result is saved as canonical player state.”
- “Refactor Vault of Runes to launch research targets from lookup data rather than hardcoded mappings.”

## For Act III
- “Refactor Fog of the Unknown to use a 16-realm registry and save-driven visited/unlocked state.”
- “Create a map metadata adapter that can later consume Tiled object properties.”

---

## 10. Code-change expectations by sub-app

## Janene's SOD
**Expected level of change:** heavy refactor, not full rewrite  
**Reason:** strong academic UX, but too monolithic as a standalone app

## Oracle of Fate
**Expected level of change:** moderate refactor  
**Reason:** strong theme, needs save/quest integration

## Vault of Runes
**Expected level of change:** moderate refactor  
**Reason:** useful portal structure, needs lookup-driven logic

## Fog of the Unknown
**Expected level of change:** moderate-to-heavy refactor  
**Reason:** strong prototype, but must align with 16-realm canon, Tiled, and save state

## Ungamified Job Application
**Expected level of change:** moderate refactor  
**Reason:** logic is useful, framing needs integration into the guild system

## Trial_of_Tonguesv2
**Expected level of change:** moderate refactor  
**Reason:** the interview module exists and is valuable, but must be integrated securely and canonically

---

## 11. Final recommendation

The most important implementation principle going forward is this:

**Do not treat the finished sub-apps as separate products.  
Treat them as module foundations inside one Legendary Horizon runtime.**

The smartest next move is:

1. freeze the 16-realm canon  
2. build the registry and schema layer  
3. build the module adapter  
4. integrate GT-101 and GT-102 first  
5. then fold the rest in around that structure

That order gives you:
- the clearest proof of integration
- the strongest use of existing completed work
- the most efficient path for Cursor/Codex development
- the least wasted prompt/token budget

---

## 12. Immediate next-step checklist

### Do now
- [x] Lock final realm count to 16
- [x] Exclude Arcanum Reactor / Energy from active canon
- [ ] Create active 16-realm registry file
- [ ] Create module registry file
- [ ] Create shared data contracts
- [ ] Create module adapter
- [ ] Integrate GT-101
- [ ] Integrate GT-102
- [ ] Integrate Act II modules
- [ ] Integrate map module
- [ ] Integrate Manifest support modules

---

**End of plan**
