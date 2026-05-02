# Legendary Horizon: Next Steps & Completion Roadmap

This document serves as the master checklist to bridge the gap between the current prototype and the final vision of the Legendary Horizon educational RPG.

## 1. Open Design Decisions

Before certain systems can be finalized in code, the following design questions must be resolved:

- [ ] **The 16 vs 17 Realms Discrepancy**: Decide whether to merge/cut one realm to stick to the original 16-realm design, or officially update the design to support 17 realms (including the newly added "Energy" cluster).
- [ ] **XP Scale and Leveling**: Define the exact XP points awarded for each action, and the specific thresholds for player level-ups.
- [ ] **Item Taxonomy**: Define the full catalog of consumable, key, and cosmetic items. 
- [ ] **Combat Mechanics**: Determine the role of hack-and-slash combat. Is it mandatory for progression or strictly optional? Define the combat stats and mechanics.
- [ ] **Data Model for the "Manifest"**: Decide if the player's manifest is a single living document or if it stores snapshots of their choices over time.
- [ ] **Teacher Dashboards**: Define the UI and functionality for how teachers will review student progress, override stuck quests, and map game rewards to class credit.

---

## 2. Coding Tasks (Implementation Roadmap)

The application currently has a solid scaffolding (Milestones 1 & 2). The following are the immediate and mid-term engineering tasks required:

### Backend & Data Binding (Milestones 3 & 8)
- [ ] **Deploy Google Apps Script Web App**: Move from simulated persistence to the live Apps Script backend.
- [ ] **Bind Google Sheets**: Set up tabs with headers from `LhSheetSchema` to handle `player_save`, `roster`, and analytics. Replace simulated `fetch` calls with real API requests.
- [ ] **Exit Ticket Integration**: Formalize the exit ticket system (e.g., `LhExitTicket_queueMockDraft`) to safely interact with Gmail within district policies, removing the fallback `mailto:` links.

### Frontend & Core Systems (Milestones 4-7, 10-11, 15-17)
- [ ] **Tiled Map Renderer**: Graduate from HTML overlay buttons to a real rendering solution for the canvas (like PixiJS, Phaser, or a custom HTML5 canvas renderer) that supports tile rendering, physics, and collisions.
- [ ] **Act III Exploration Loop**: Build the dynamic World Map UI with locked/unlocked realms, fog-of-war clearing, and the Comparison Ledger overlay for career research.
- [ ] **Quest Engine Completion**: Un-hardcode the quest transitions. Build a generic event dispatcher that maps external triggers to quest progression.
- [ ] **Classroom Tool Hooks**: Implement the integrations for O*NET, Maia Learning, Quizlet, and Google Forms/Slides.
- [ ] **Encounters System**: Build the minigame framework for vocabulary battles and optional hack-and-slash encounters.

---

## 3. Missing Media Assets

To achieve the "Cinematic dark fantasy + pixel RPG" aesthetic required by the Master GDD, the following assets need to be sourced or created:

- [ ] **Realm Tilesets**: High-quality 32x32px tilesets covering all 17 Guild Headquarters (e.g., Aethelwood Farmsteads, Monolith of Masonry, etc.).
- [ ] **NPC Portraits**: Character portraits for the Guild Mentors, Master Scribe, Oracle, etc., utilizing the "Amber Glow" UI signature.
- [ ] **Audio**: Background music tracks for exploration, combat encounters, and victory/level-up sound effects (currently these are mocked in `media_assets.json`).
- [ ] **UI Assets**: Custom 16-bit window skins, cursor icons, font sets (retro pixel style), and item icons (Scholar's Ink, Runes, Crests).

---

## 4. Classroom Resilience & Testing

The game must survive the realities of a 6th-grade classroom:

- [ ] **Stress Test Save/Load Flow**: Simulate sudden network disconnects and verify that the game can gracefully resume without data loss.
- [ ] **Chromebook Compatibility Check**: Ensure the renderer and UI perform well on standard school-issued devices (which often have low memory/CPU limits).
- [ ] **Accessibility Review**: Test keyboard navigation, text scaling (for 6th-grade readability), and contrast ratios.
- [ ] **Playtesting**: Playtest the Minimum Viable Vertical Slice (the Night One slice) with a small group of students before expanding the full world map.
