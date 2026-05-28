# Project Audit: Acts 1 & 2 to Act 3 Transition

I've conducted a comprehensive audit of the `quests.json` definitions for Act 1 and Act 2 against the current frontend implementation (`moduleRegistry.ts`, `useNightOneFlow.ts`, `App.tsx`, and the module components). 

Here is the status of each quest, along with what remains unfinished to fully bridge the gap into Act 3.

## User Review Required

> [!WARNING]
> **Missing Pause Menu Shortcuts**
> In replacing the legacy `PauseMenu.tsx` with the `ScrollOfDestinyDisplay.tsx` per our earlier step, we lost the developer shortcuts / progression buttons for `mod_manifest_sod`, `mod_oracle_of_fate`, and `mod_vault_of_runes`. We either need to add these buttons into the `ScrollOfDestinyDisplay` action bar, restore a combined pause menu, OR ensure they are strictly triggered by in-game map interactables (e.g., talking to the Oracle NPC).

## Act 1 Audit: The Master Scribe Sequence
*Overall Status: Nearly Complete.*

| Quest ID | Title | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **mq-101** | Meet the Master Scribe | ✅ Complete | Dialogue triggers in `dialogue_catalog.json` |
| **mq-102** | Enter the Mirror of Maia | ✅ Complete | Triggers Maia handoff flow via `openMaiaHandoffWindow` |
| **mq-103** | Complete the Ritual of Reflection | ✅ Complete | Resolves when the Maia window is closed and focus returns |
| **mq-104** | Complete the Scribe's Survey | ✅ Complete | Wired to `MasterScribeSurveyModule.tsx`. Saves RIASEC artifacts. |
| **mq-105** | Generate the Scroll of Destiny | ✅ Complete | `ScrollRevealSequence.tsx` animation plays seamlessly. |
| **mq-106** | Reveal the Three Foretold Signposts | ⚠️ Stubbed | Wired to `ManifestSodModule.tsx`, but currently lacks a UI entry point now that the Pause Menu is replaced. |

## Act 2 Audit: The Oracle Sequence
*Overall Status: Modules Built, Wiring Unfinished.*

| Quest ID | Title | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **mq-201** | Visit the Oracle of Opportunity | ⚠️ Stubbed | Dialogue / Map trigger needed to start the sequence. |
| **mq-202** | Receive the Prophecy | 🚧 In Progress | `OracleOfFateModule.tsx` exists and you are working on the cutscene sequence in the background. Currently lacks a UI entry point to launch. |
| **mq-203** | Enter the Vault of Runes | ⚠️ Stubbed | `VaultOfRunesModule.tsx` exists, but there's a bug in `moduleRegistry.ts`: both `mod_vault_of_runes` and `mod_quest_of_fate_worksheet` map to `mq-203`. |
| **mq-204** | Complete the Quest of Fate | ⚠️ Stubbed | `QuestOfFateWorksheetModule.tsx` is built but needs its `quest_id` corrected in the registry from `mq-203` to `mq-204`. |
| **mq-205** | Return to the Oracle | ⚠️ Stubbed | Needs dialogue triggers to acknowledge completion of the worksheet. |
| **mq-206** | Receive the World Map | ⚠️ Stubbed | Needs a trigger to unlock the `WorldMapOverlay.tsx` access. |
| **mq-207** | Receive the Comparison Ledger | ⚠️ Stubbed | Needs a trigger. `CareerComparisonWorksheetModule.tsx` exists but is currently mapped to `mq-301` in the registry. |
| **sq-201** | Defeat the Ink Wraiths | ⚠️ Stubbed | The encounter system is built (`activeEncounter` state), but we need to verify if the vocabulary-linked battle is wired to this quest ID. |

## Open Questions

> [!IMPORTANT]
> 1. **How should players access the Act 2 modules?** Should we add buttons to the `ScrollOfDestinyDisplay` for the Oracle and Vault, or should they only be launched by walking up to the Oracle NPC in the Phaser map?
> 2. **Module Registry Fixes:** Should I go ahead and correct the `quest_id` mappings in `moduleRegistry.ts` (e.g., mapping `mod_quest_of_fate_worksheet` to `mq-204`)?
> 3. **Act 2 Triggers:** How do you envision the player receiving the World Map (`mq-206`) and Comparison Ledger (`mq-207`)? Are these just granted silently upon talking to the Oracle for `mq-205`?

## Proposed Changes (Path to Act 3)

### Phase 1: Fix Module Registry & Navigation
- Update `moduleRegistry.ts` to map `mod_quest_of_fate_worksheet` to `mq-204`.
- Re-introduce access points for `mod_manifest_sod`, `mod_oracle_of_fate`, and `mod_vault_of_runes` (either via Phaser NPC interactions or by adding them to the `ScrollOfDestinyDisplay` action bar).

### Phase 2: Act 2 Handoffs
- Wire up the transition from `mq-204` (Quest of Fate) to `mq-205` (Return to Oracle).
- Implement the reward sequence for `mq-206` and `mq-207` (granting the World Map and Comparison Ledger via a System Toast or Narrative dialogue).

### Phase 3: Act 3 Readiness
- Fix the `mod_fog_of_unknown` mapping (Career Comparison Worksheet) which is currently pointing to `mq-301`. It should align with the Act 3 comparison quests (`mq-311`).
- Ensure the `WorldMapOverlay` unlocks the "Charter" button correctly once `mq-207` is completed.

## Verification Plan

### Automated Tests
- Run `npm run typecheck` after modifying `moduleRegistry.ts` and `ScrollOfDestinyDisplay.tsx`.

### Manual Verification
- Launch the dev server.
- Ensure the player can complete `mq-106` (Manifest).
- Verify the player can trigger the `OracleOfFateModule` (`mq-202`) and the `VaultOfRunesModule` (`mq-203`).
- Ensure `mq-204` correctly updates the quest log instead of overlapping with `mq-203`.
