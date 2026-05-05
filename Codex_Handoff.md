# Codex Handoff — Legendary Horizon

## 1. What this project is

**Legendary Horizon** is a classroom career-exploration game for middle school students, built as a top-down fantasy RPG layered over real career-planning work.

The player is a **Traveler**. Traditional school tasks are reframed as game systems:
- assignments become **quests** or **trials**
- growth becomes **XP**
- career clusters become **realms / guilds**
- the NYS Career Plan becomes part of the player’s persistent record / save-file fantasy
- Maia Learning is treated as part of the in-world character and planning system

This is not meant to be a shallow skin over worksheets. The design goal is to make the real learning tasks feel meaningful, coherent, and memorable.

## 2. Educational purpose

The game should help students:
- identify interests, strengths, and emerging preferences
- explore career clusters and specific careers
- compare multiple pathways before choosing one for deeper work
- practice professionalism, applications, and interviews
- create a final artifact that explains a possible future path
- connect current school choices to future educational and career options

The project must stay practical for real classroom use:
- students have absences
- pacing varies widely
- some students are highly game-motivated and some are not
- saving and resuming cleanly is mission-critical
- classroom time is limited

## 3. Core design pillars

1. **Meaning before gimmick** — every fantasy wrapper should map to a real instructional action.
2. **Narrative consistency** — the game, forms, menus, handouts, and mini-apps should feel like one world.
3. **Classroom resilience** — the system must tolerate interruptions, absences, and mixed pacing.
4. **Multiple paths to engagement** — lore, exploration, progression, presentation, and completion should all matter.
5. **Visible progress** — players should always know what they have done and what they must do next.

## 4. Current narrative / act structure

### Act I — The Awakening
Self-discovery and character creation.
Key beats:
- Mirror of Maia
- surveys / self-assessments
- Scroll of Destiny / manifest generation
- reveal signposted paths

### Act II — The Divination
Research setup and tool unlocks.
Key beats:
- Oracle encounter
- Quest of Fate / Oracle of Fate
- Vault of Runes
- grant the world map and comparison tools

### Act III — Mapping the World
Career exploration loop.
Key beats:
- world traversal
- fog clearing
- realm research
- Comparison Ledger entries
- exploration of the three signposted paths

### Act IV — The Guild Trials
Professionalism and commitment phase.
Key beats:
- choose a **True Path**
- travel to chosen Guild HQ
- meet Guild Manager
- complete application and interview style systems
- guild trials only become active **after** True Path selection

### Act V — The Ascension
Synthesis and presentation.
Key beats:
- final artifact / slides / chronicle
- presentation / sharing
- transcription / syncing into official planning systems

## 5. Canon decisions that should be treated as current truth

These decisions should be treated as binding unless explicitly revised by the project owner.

### Realm count
- **Final canon is 16 realms.**
- A 17th realm, **The Arcanum Reactor** / Energy cluster, appears in some legacy planning materials.
- It is **not part of current implementation canon**.
- It was removed for now because it was creating confusion across documents and planning.
- Do **not** build current gameplay, progression, completion percentages, or UI assumptions around 17 realms.

### Guild HQ behavior
- In **Act III**, Guild HQ visits are **research / reconnaissance spaces only**.
- The player should not begin active Guild Manager trial flows during general exploration.
- **Guild Manager interaction begins only after True Path selection in Act IV.**

### Main research structure
- **Act II uses the Quest of Fate worksheet / Oracle of Fate flow.**
- **Act III uses the Comparison Ledger** for comparing explored paths.
- The three foretold/signposted paths are central to the exploration loop before commitment.

### Tone / brand rules
- Visual tone: **cinematic dark fantasy + retro RPG energy**
- Signature color: **Radiant Amber (#f59e0b)** for important / interactive elements
- Voice: wise, encouraging, mentor-like
- Terminology should remain consistent:
  - student -> Traveler
  - assignment -> Quest / Trial
  - growth -> XP
  - career clusters -> Realms / Guilds

## 6. Current known realm canon

Use stable IDs in code, but preserve these display names.

1. Agriculture, Food, Natural Resources — **Aethelwood Farmsteads**
2. Architecture & Construction — **Monolith of Masonry**
3. Arts, A/V Technology & Communications — **Chronicler’s Spire**
4. Business Management & Administration — **Mercantile’s Citadel**
5. Education & Training — **The Archives of Ascension**
6. Finance — **The Gilded Vault**
7. Government & Public Administration — **The High Council Hall**
8. Health Science — **Aurora Apothecary**
9. Hospitality & Tourism — **The Crossroads Haven**
10. Human Services — **Empath’s Enclave**
11. Information Technology — **The Etheric Nexus**
12. Law, Public Safety, Corrections & Security — **Valor’s Watchtower**
13. Manufacturing — **The Great Vulcanis Forge**
14. Marketing — **The Bard’s Beacon**
15. STEM — **The Alchemical Observatory**
16. Transportation, Distribution & Logistics — **Odyssey’s Harbor**

## 7. Technology / architecture direction

The intended stack is:
- **Frontend web app** for player-facing experience
- **Google Apps Script** for backend orchestration and integrations
- **Google Sheets** as structured game database / save registry / lookup source
- **Tiled** as map-authoring source
- **Google Drive** for media asset storage
- **Phaser** for live exploration rendering / movement / trigger interactions

### Architectural intent
- Data-driven systems should be favored over hardcoded content.
- Quest logic, realm definitions, item definitions, media lookups, and save-state structure should all be modeled explicitly.
- The codebase should be resilient to classroom interruptions and partial completion.
- Any feature that touches progression should support save/load safely.

## 8. Important system expectations

### Save system
This is a top priority system, not a polish feature.

Required behavior:
- autosave on meaningful progress
- visible manual save option
- reliable restore
- persistent record of current quest state and required next action
- graceful handling of disconnects / failed save attempts
- ability to resume after absences

### Quest system
The quest engine should be data-driven and should support:
- main quests
- side quests
- guild trials
- prerequisites
- dynamic unlocking
- completed quest tracking
- surfaced “current required next action”

### World exploration
The world layer should support:
- locked / unlocked realms
- fog-cleared state
- waypoint progression
- visited locations
- realm-specific triggers
- Act III exploration without prematurely starting Act IV guild trial behavior

### Tiled map art direction
- The playable Tiled map should recreate the current in-game **World Atlas** image/layout as closely as practical.
- Do not treat the Tiled map as a fresh world-layout invention unless the project owner explicitly revises this direction.
- Gameplay layers such as collisions, triggers, fog regions, waypoints, NPC markers, spawn points, and realm markers should be added on top of that atlas-inspired layout.
- Artistic tilework can be iterative, but the world geography, realm placement, and traversal feel should remain anchored to the atlas image already being used in the game.

### Teacher support / admin resilience
The real classroom requires recovery tools.
Expected support includes:
- teacher unlock / override paths
- checkpoint restore behavior
- recovery from partial failures
- readable save data in backend tables

## 9. Mini-apps / source experiences already created

These pre-existing apps matter because this project is partly an integration effort, not a greenfield design.

### Scroll / Career Map style experience
- Early foundational work in this universe.
- Important because it proved students engaged more with a themed and guided interface than with the standard school platform.
- Treat this as inspiration and content source, not throwaway history.

### Oracle of Fate
Purpose:
- divination / randomized assignment / prophecy style experience
- ties into Act II and the Quest of Fate flow

### Vault of Runes
Purpose:
- career / realm discovery and research presentation structure
- likely relevant to Act II research scaffolding and reveal mechanics

### Ungamified Job Application
Purpose:
- represents a pre-existing non-gamified version of the application-related workflow
- useful for extracting the real fields, logic, and classroom requirements behind the fantasy reskin

### Trial of Tongues / Trial_of_Tonguesv2
Purpose:
- interview-style system tied to Guild Manager interactions
- v2 is especially important because it includes richer structure, NPC realm managers, soft-skill checks, and conversation flow
- this should inform the Act IV Guild Trial implementation

### Realm Atlas / Fog of the Unknown
Purpose:
- world map / realm presentation / fog-clearing concept
- important as a prototype reference for exploration tone and realm reveal structure

## 10. Current implementation status already confirmed

The following items were already reported as implemented or substantially scaffolded in the existing codebase and should be respected before rewriting anything:

### Confirmed progress toward beta
- save gateway wiring is in place for live Apps Script POST-based save behavior
- Apps Script web app flow exists for ingesting saves and writing to Sheets
- Phaser exploration scaffolding exists
- exit ticket routing was moved away from `mailto:` fallback and into backend endpoint flow

### Known beta-path work still remaining
#### Environment / infrastructure
- provision production Google Sheets with canonical tabs / headers
- deploy Apps Script web app
- configure environment variables for live operation
- complete end-to-end save/load test against live backend

#### Phaser / map pipeline
- tile rendering from Tiled JSON
- collision mapping
- player physics body
- trigger overlaps replacing placeholder DOM buttons

#### UI / content polish
- finalize Amber Glow readability and classroom-friendly UI pass
- asset loading fallbacks
- full realm integration in world map overlay

#### Classroom resilience
- offline / disconnect handling
- teacher override and recovery behavior
- performance audit on school-grade hardware

## 11. Most recent implementation note from active development

A recent in-progress update indicates the codebase has already begun integrating a **guild endgame / guild trial outcome state** into the exploration loop state.

Reported recent changes include:
- added `guild_endgame_v1` structures to the exploration state model
- default creation / merge helpers added
- save normalization support added in manual save gateway
- night-one flow updates for GT-101 and GT-102 behavior
- GT-102 auto-unlock was removed from GT-101
- teacher GT-102 pass/fail handling was updated to merge interview outcome into `guild_endgame_v1`

Interpretation:
- the codebase is moving beyond raw scaffolding and starting to encode real late-phase guild trial state.
- new work should extend this carefully rather than bypass it.

## 12. Working assumptions Codex should use

Unless explicitly contradicted by the project owner, follow these rules:

1. **Prefer extension over rewrite.**
   Do not rip out working scaffolds just because they are incomplete.

2. **Preserve existing canon language.**
   Do not casually rename realms, guilds, core artifacts, acts, or major quest concepts.

3. **Keep systems data-driven.**
   Hardcoded content is acceptable only for narrow prototypes or temporary bridging work.

4. **Respect classroom constraints.**
   Fancy architecture is not useful if it breaks save/load, recovery, or Chromebook performance.

5. **Do not reintroduce the 17th realm into current production logic.**
   Energy / Arcanum Reactor is archived for now.

6. **Do not let Act III and Act IV blur together.**
   Exploration and research first; true-path trials later.

7. **Always preserve or improve resume state.**
   Any new feature that affects progression should be save-safe.

## 13. Recommended coding priorities from this handoff point

### Highest priority
1. Stabilize live save/load infrastructure.
2. Make Tiled -> Phaser exploration real.
3. Ensure trigger dispatch updates real game state.
4. Keep current required next action accurate and visible.

### Next priority
5. Bring one fully coherent vertical slice to polished classroom-test quality.
6. Integrate one or more mini-app-derived systems cleanly into the main game loop.
7. Finalize world map / realm unlock / fog clear behavior.
8. Harden teacher recovery tools.

### After that
9. Expand content breadth realm by realm.
10. Refine presentation, polish, and classroom UX.

## 14. Recommended first beta mindset

A smaller, stable classroom beta is better than broad but fragile scope.

A good beta should prove:
- a student can start
- complete meaningful quest work
- trigger state changes
- save
- return later
- resume with the right context
- reach at least one coherent quest chain / guild-related interaction path without confusion

## 15. What Codex should avoid doing without explicit approval

- changing the canon realm count away from 16
- reintroducing Arcanum Reactor into active scope
- collapsing the act structure
- replacing the fantasy framing with generic school UX
- rewriting the save model without strong reason
- hardcoding assumptions that make later Google Sheets / Apps Script integration harder
- mixing Guild Manager trial content into Act III exploration

## 16. Suggested repo helper files

To make future Codex work better, this repository should ideally include:
- `CODEX_HANDOFF.md` or this file at repo root
- `CANON_DECISIONS.md`
- `REALM_REGISTRY.json` or equivalent lookup source
- `QUEST_REGISTRY.json` or equivalent lookup source
- `SAVE_SCHEMA.md`
- `INTEGRATIONS.md`
- `BETA_CHECKLIST.md`

## 17. Direct instruction to Codex

When making changes in this project:
- read this handoff first
- preserve canon
- preserve classroom practicality
- preserve save/load integrity
- prefer small, reviewable increments
- document any schema or state-shape changes clearly
- call out any place where current code conflicts with canon instead of silently choosing a new direction

---

This file is intended to give maximum project context to a coding agent entering the repository from outside the original ChatGPT / Cursor planning thread.
