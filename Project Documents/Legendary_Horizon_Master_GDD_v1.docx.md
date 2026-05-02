# **Legendary Horizon** **Master Game Design Document**

*Unified design blueprint for a 6th-grade Home & Careers career-planning RPG*

**Prepared for Kevin McCann**  
Version 1.0 \- 

| Purpose: Legendary Horizon turns a middle school career unit into a top-down 2D fantasy RPG in which students are Travelers building their future one quest at a time. The game blends self-assessment, career exploration, research, professionalism, and presentation into a Hero's Journey that ends not with a final destination, but with a “Legendary Horizon” that remains ahead of the learner. |
| :---- |

# **1\. Project Vision**

Legendary Horizon reframes career exploration as character creation. Students begin in the “early game” of life, discover their base stats, explore possible paths, choose a true path for focused research, and present their journey to the class community. The design goal is not to lock students into a permanent choice, but to help them see career planning as a series of meaningful steps, experiments, and level-ups.

* Core educational promise: make career exploration feel personal, active, and memorable rather than form-driven and abstract.  
* Core narrative promise: every learner is a Traveler standing at the start of a long adventure.  
* Core implementation promise: the game must remain practical in a real classroom with absences, pacing differences, limited time, and mixed student motivation.

# **2\. Learning Outcomes**

* Students identify interests, strengths, values, and emerging preferences.  
* Students learn to research careers using structured sources such as Maia Learning and O\*NET / ONetOnline.  
* Students compare multiple careers before choosing one for deeper investigation.  
* Students practice documentation, communication, professionalism, and interview skills.  
* Students create a final artifact that explains a possible future path and the steps needed to pursue it.  
* Students connect present-day school choices to future educational and career options.

# **3\. Design Pillars**

1. Meaning before gimmick. Every fantasy mechanic should map clearly to a real career-planning skill or task.  
2. Narrative consistency. All screens, handouts, and interactions should feel like parts of one world.  
3. Classroom resilience. The system must be easy to resume after absences and easy to save at natural stopping points.  
4. Multiple paths to engagement. Some students will love lore, some combat, some collection, some presentation, and some completionism.  
5. Visible progress. Students should always know what quest they are on, what they have completed, and what still remains.

# **4\. Audience and Use Context**

* Primary players: 6th-grade students in Home & Careers / career-planning instruction.  
* Primary platform context: Google Classroom delivery, Google Sites / Apps Script ecosystem, and connected mini-tools.  
* Classroom reality: mixed pacing, absences, variable academic readiness, and varying familiarity with game conventions.  
* Access outside school: students can continue through Google Classroom when absent or when extra time is needed.

# **5\. World, Tone, and Brand Rules**

The world should consistently blend cinematic dark fantasy with 16-bit retro RPG energy.

| Visual style | Cinematic dark fantasy \+ pixel RPG UI language |
| :---- | :---- |
| **Color signature** | Deep midnight background with Radiant Amber (\#f59e0b) for important or interactive elements |
| **Voice** | Wise, encouraging Guild Mentor |
| **Terminology** | Student \-\> Traveler; Assignment \-\> Quest or Trial; Growth \-\> XP; Career clusters \-\> Realms / Guilds |
| **UI rule** | Anything important should feel like it has the “Amber Glow” signature |

# **6\. Narrative Arc and Core Campaign Structure**

The current design coheres around a five-act hero’s journey plus epilogue:

| Act | Narrative Title | Learning Goal | Primary Systems / Deliverables |
| :---- | :---- | :---- | :---- |
| I | The Awakening | Self-discovery and character creation | Mirror of Maia, surveys, Scroll of Destiny, Manifest |
| II | The Divination | Research practice and tool unlocks | Oracle of Opportunity, Vault of Runes, Comparison Ledger |
| III | Mapping the World | Career exploration and evidence gathering | Map traversal, fog clearing, waypoint research, 3 signpost realms |
| IV | The Guild Trials | Commitment, professionalism, and application skills | Job application, AI interview, soft-skill encounters, true-path selection |
| V | The Ascension | Synthesis and presentation | Chronicle / Slides, Grand Council presentation, NYS Career Plan transcription |

Epilogue: students prepare for the “7th Grade Expansion Pack” by linking course choices and future planning to the game world.

# **7\. Core Game Loop**

6. Receive or unlock a quest.  
7. Travel to a map location, screen, or event trigger.  
8. Complete a task tied to a real learning action (assessment, research, vocabulary, reflection, documentation, discussion, or presentation).  
9. Earn a reward (XP, item, stat increase, unlock, lore entry, or progress toward a larger objective).  
10. Save progress to the player record / manifest.  
11. Return to the map, menu, or quest board to choose the next action.

This loop should be the backbone of all modules, whether the moment is combat-heavy, quiz-based, or research-driven.

# **8\. Player Systems**

| System | Purpose | Implementation Note |
| :---- | :---- | :---- |
| Traveler Manifest | Living player profile and record of progress | Should sync with Forms/Sheets data and support eventual transfer into Maia / NYS Career Plan |
| Base Stats | Represents interests, strengths, tendencies, and work preferences | Derived from surveys, assessments, and chosen mappings such as Holland / RIASEC style outputs |
| XP | Measures growth and completion | Award for meaningful work, not just time spent |
| Items / Artifacts | Visible rewards and functional unlocks | Can unlock realms, dialogue options, cosmetic badges, or shortcuts |
| Comparison Ledger | Portable note-taking / evidence book | Stores career comparison data while exploring |
| Quest Log | Tracks active, completed, and optional tasks | Must clearly separate main quests from side quests |
| Map and Fog | Visual exploration and discovery layer | Waypoints reveal careers, NPCs, trials, and mini-games |

# **9\. Main Menu and Essential Screens**

* Start / Continue Journey  
* Instructions and Controls  
* Traveler Manifest  
* Quest Log  
* Map / World Access  
* Comparison Ledger  
* Save / Exit  
* Teacher / Admin mode (not student-facing, if implemented)

Instruction Page requirement: the main menu should include a clear “How to Play” page with movement controls, quest types, how saving works, what to do if stuck, where to find help, and what parts connect to classroom tasks. Because this project includes both game moments and academic tasks, the instructions must explain the metaphor and the mechanics.

# **10\. Save System and Session Flow**

Saving is mission-critical because students may miss class, stop mid-session, or continue from home. The save system should be simple, visible, and forgiving.

* Autosave whenever a quest objective is completed, a form is submitted, or a waypoint is cleared.  
* Manual save option in the pause or main menu for student confidence.  
* Resume state should reopen the latest quest, location, and unlocked progress.  
* Important records should be cloud-backed through the Google ecosystem so work is not device-dependent.  
* Session-end ritual: before class ends, students should be prompted to save, review the next quest, and optionally write a quick reflection or “campfire log.”  
* Missed-day recovery: the Quest Log should show unfinished objectives, and a “Previously on your journey…” summary can quickly reorient absent students.

Recommended implementation approach: store persistent player state in a Google Sheet or database-like table accessed by Apps Script. Each save record should minimally include student identifier, current quest, completed flags, unlocked realms, XP total, earned items, selected true path status, and timestamp of last save.

# **11\. Pacing and Differentiation Strategy**

Different students will move at different speeds. Legendary Horizon should treat this as a feature, not a failure.

* Main Quests move the core unit forward and should be required.  
* Side Quests provide enrichment, practice, or catch-up alternatives.  
* Fast finishers can battle optional enemies, unlock lore, or complete bonus realm intel quests.  
* Students who need more support can be routed into scaffolded versions of the same objective rather than a completely separate experience.  
* Vocabulary Quizlet encounters can function as lower-stakes practice missions that still contribute to progress.  
* Combat modules can provide additional engagement without being allowed to replace the central academic work.

# **12\. Reward Economy: XP, Items, and Progress**

A unified reward economy will help connect your academic tasks, combat encounters, and vocabulary missions into one coherent game. The key rule: rewards should reinforce meaningful learning actions.

| Activity Type | Suggested Reward | Why It Matters | Balancing Note |
| :---- | :---- | :---- | :---- |
| Complete assessment / survey | XP \+ stat reveal \+ manifest update | Advances character creation | High value once; avoid repeat farming |
| Research a career waypoint | XP \+ ledger entry \+ realm intel token | Rewards real information gathering | Better reward if notes are complete |
| Compare careers accurately | XP \+ “Scholar’s Ink” item or codex badge | Encourages evaluation, not just collecting facts | Tie bonus to quality of evidence |
| Quizlet / vocabulary battle | Small XP \+ consumable item \+ combo streak bonus | Keeps practice relevant and repeatable | Should support, not overshadow, main quests |
| Hack-and-slash enemy encounter | Small-to-medium XP \+ loot drop chance | Adds kinetic engagement and pacing flexibility | Gate stronger rewards behind completion of academic triggers |
| Job application or interview trial | Major XP \+ profession-themed artifact \+ path unlock | Marks high-value professionalism milestones | Should feel like boss-tier progression |
| Presentation / Chronicle | Boss battle completion reward \+ title / crest | Celebrates synthesis and public demonstration | This should be one of the highest-yield rewards in the game |

Recommended rule for your two unresolved mechanics:

* Hack-and-slash combat should award smaller baseline XP and a chance at item drops, but major progression should require an attached academic trigger or quest context.  
* Vocabulary Quizlet encounters should award reliable small XP, streak bonuses, and knowledge-themed items such as runes, scroll fragments, or codex pages.  
* Items can be either cosmetic (badges, titles, banners) or functional (unlocking shortcuts, hint tokens, fast-travel points, or dialogue options).  
* Avoid reward inflation: if everything gives large XP, students will stop feeling the distinction between practice, progress, and mastery.

# **13\. Quest Types**

| Quest Type | Example | Learning Function |
| :---- | :---- | :---- |
| Main Quest | Complete Mirror of Maia and generate Manifest | Required progression |
| Side Quest | Interview a high-level NPC (adult career interview) | Extends relevance and reflection |
| Combat Quest | Defeat map enemies guarding a region | Engagement, pacing, and optional challenge |
| Knowledge Trial | Vocabulary Quizlet ambush | Terminology and concept reinforcement |
| Guild Trial | Application \+ interview \+ ethics challenges | Professionalism and communication |
| Collection Quest | Gather intel from 3 careers in a realm | Structured research and comparison |
| Boss Battle | Grand Council presentation | Public synthesis and performance |

# **14\. Map and Realm Structure**

The map should not be a decorative wrapper; it should be the visual organizer for progression. At minimum, it should include:

* A starting hub such as Grey Commons / Great Clearing.  
* Access to 16 career realms or a staged subset if phased rollout is needed.  
* Signpost markers for the traveler’s 3 foretold realms.  
* NPC hubs such as the Master Scribe, Oracle, Guild Managers, and Council space.  
* Waypoint triggers for research, vocabulary encounters, combat, lore, or item collection.  
* Fog-of-war logic so exploration feels earned and progress is visible.

# **15\. Instructional Mapping of the Campaign**

| Game Beat | School Task | Artifact / Evidence |
| :---- | :---- | :---- |
| Mirror of Maia | Assessments / self-exploration | Survey data, base stats, interests |
| Scroll of Destiny | Profile synthesis | Character sheet / manifest |
| Oracle of Opportunity | Practice career lookup | Random career prophecy notes |
| Comparison Ledger | Career comparison | Recorded observations across careers |
| Realm exploration | Career cluster research | Completed ledger entries and unlocked map nodes |
| Guild Trials | Application, interview, professionalism | Forms, chatbot transcript, reflection |
| Great Transcription | Official Maia / NYS Career Plan completion | Copied / entered final data |
| Grand Council | Presentation / career fair | Slides and oral presentation |
| Expansion Pack | Course planning for 7th grade | Future class choices linked to pathway |

# **16\. Technical Architecture (Recommended)**

* Google Sites or web app shell for the central hub / menu experience.  
* Google Apps Script for authentication, save-state handling, event logic, and data writes.  
* Google Sheets as the lightweight back-end for player state, quest completion, XP, and flags.  
* Maia Learning and O\*NET / ONetOnline as linked external systems for core career data tasks.  
* Tiled for map construction and trigger planning.  
* Smaller web modules for mini-games, combat, Quizlet-triggered events, interviews, or special screens.  
* Git repository for source control, rollback, branching, and deployment discipline.

Suggested data objects: Player, Quest, Realm, Waypoint, Item, Encounter, SaveState, ManifestEntry, LedgerEntry, and PresentationRecord.

# **17\. Minimum Viable Vertical Slice**

To keep development manageable, build one playable slice before attempting the full world.

12. Main menu with Start / Continue, Instructions, Manifest, and Save.  
13. One hub area on the map.  
14. Mirror of Maia / assessment onboarding.  
15. Automatic generation of a simplified Scroll of Destiny / Manifest.  
16. One Oracle prophecy event and one O\*NET research task.  
17. One Comparison Ledger entry flow.  
18. One optional enemy encounter and one vocabulary encounter using the reward rules above.  
19. One save / resume loop that works from school and home.  
20. One teacher-facing view of student progress.

# **18\. Risks and Design Watch-Outs**

* If the fantasy layer becomes too thick, students may enjoy the game but miss the real-world point.  
* If rewards are too generous for low-value actions, the academic tasks will feel optional.  
* If saving is unreliable, the entire classroom experience will become frustrating quickly.  
* If instructions are unclear, students will confuse in-game exploration with completion of school expectations.  
* If every module is built at once, scope creep may stall the project. Modular release is safer.

# **19\. Open Design Decisions to Resolve Next**

21. Define the exact XP scale and level thresholds.  
22. Define the item taxonomy: cosmetic, collectible, functional, and milestone artifacts.  
23. Decide how combat difficulty scales and whether combat is purely optional or occasionally required.  
24. Choose the exact save-state schema and how student identity is authenticated.  
25. Determine whether the Manifest is a single live record or a layered record with snapshots over time.  
26. Map the 16 career realms into final names, symbols, and pathway logic.  
27. Define teacher dashboards, grading touchpoints, and how game rewards relate to class credit.

# **20\. Immediate Next Steps**

28. Approve or revise this unified blueprint so it becomes the canonical project document.  
29. Create a one-page system architecture diagram from this document.  
30. Write the XP and item economy rules in detail.  
31. Draft the main menu instruction page and session-end save ritual.  
32. Build the minimum viable vertical slice.  
33. Test the slice with a small student workflow before expanding the map.

# **Source Synthesis Notes**

This document synthesizes and reconciles ideas from the following uploaded planning materials plus current implementation notes shared in chat:

* Gamification Plan fo LH  
* LH World Building Guide  
* Legendary Horizon: The Lore Bible  
* Gamifying Career Planning for Middle Schoolers  
* Current design notes about instructions, saving, absences, Google Classroom access, combat encounters, and Quizlet vocabulary encounters