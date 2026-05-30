/**
 * Side quest completion bridges — checks and completes side quests
 * based on game-state conditions.
 *
 * SQ-201: first encounter win
 * SQ-202: career interview submitted (module status 'submitted' → turned_in via teacher)
 * SQ-203: 10 encounter wins
 * SQ-204: 20 encounter wins
 * SQ-205: GT-103 ethics score exceeds threshold
 * SQ-206–218: guild HQ research count (4–16 non-signpost guilds)
 * SQ-219: all 16 guilds in atlas (clear all fog)
 */

import type { QuestDefinition } from '../domain/lh-contract';
import type { EncounterLogEntryV1 } from '../domain/lh-contract';
import { markQuestCompleted, getQuestXpReward } from '../quests/questEngine';

// --- Encounter-based side quests ---

/** Count wins in the encounter log. */
function countEncounterWins(log: readonly EncounterLogEntryV1[]): number {
  return log.filter((e) => e.outcome === 'win').length;
}

/** After a combat win, check SQ-201 / SQ-203 / SQ-204 and complete as appropriate. */
export function checkEncounterSideQuests(
  quests: QuestDefinition[],
  encounterLog: readonly EncounterLogEntryV1[],
): { nextQuests: QuestDefinition[]; xpAwarded: number } {
  let next = quests;
  let xp = 0;
  const wins = countEncounterWins(encounterLog);

  // SQ-201: first combat/vocab win
  const sq201 = next.find((q) => q.quest_id === 'sq-201');
  if (sq201 && (sq201.status === 'available' || sq201.status === 'active') && wins >= 1) {
    xp += getQuestXpReward(next, 'sq-201');
    next = markQuestCompleted(next, 'sq-201');
  }

  // SQ-203: 10 wins
  const sq203 = next.find((q) => q.quest_id === 'sq-203');
  if (sq203 && (sq203.status === 'available' || sq203.status === 'active') && wins >= 10) {
    xp += getQuestXpReward(next, 'sq-203');
    next = markQuestCompleted(next, 'sq-203');
  }

  // SQ-204: 20 wins
  const sq204 = next.find((q) => q.quest_id === 'sq-204');
  if (sq204 && (sq204.status === 'available' || sq204.status === 'active') && wins >= 20) {
    xp += getQuestXpReward(next, 'sq-204');
    next = markQuestCompleted(next, 'sq-204');
  }

  return { nextQuests: next, xpAwarded: xp };
}

// --- Ethics bonus side quest ---

const ETHICS_BONUS_THRESHOLD = 16; // out of 18 max

/** After GT-103, check if score exceeds bonus threshold → SQ-205. */
export function checkEthicsBonusSideQuest(
  quests: QuestDefinition[],
  ethicsScore: number,
): { nextQuests: QuestDefinition[]; xpAwarded: number } {
  let next = quests;
  let xp = 0;
  const sq205 = next.find((q) => q.quest_id === 'sq-205');
  if (sq205 && (sq205.status === 'available' || sq205.status === 'active') && ethicsScore >= ETHICS_BONUS_THRESHOLD) {
    xp += getQuestXpReward(next, 'sq-205');
    next = markQuestCompleted(next, 'sq-205');
  }
  return { nextQuests: next, xpAwarded: xp };
}

// --- Guild research side quests (SQ-206 through SQ-218) ---

/**
 * Guild Research quests track how many non-signpost guild HQs the player has visited.
 * SQ-206 = 4th guild, SQ-207 = 5th guild, ..., SQ-218 = 16th guild.
 * The 3 foretold signpost realms count as the first 3.
 */
const GUILD_RESEARCH_SIDE_QUESTS: readonly string[] = [
  'sq-206', // 4th
  'sq-207', // 5th
  'sq-208', // 6th
  'sq-209', // 7th
  'sq-210', // 8th
  'sq-211', // 9th
  'sq-212', // 10th
  'sq-213', // 11th
  'sq-214', // 12th
  'sq-215', // 13th
  'sq-216', // 14th
  'sq-217', // 15th
  'sq-218', // 16th
];

/**
 * After a guild HQ is revealed in the atlas, check guild research side quests.
 * @param revealedCount total number of guild HQs in `guild_hq_atlas_revealed_realm_ids` (includes signposts implicitly via realm progress).
 */
export function checkGuildResearchSideQuests(
  quests: QuestDefinition[],
  revealedCount: number,
): { nextQuests: QuestDefinition[]; xpAwarded: number } {
  let next = quests;
  let xp = 0;

  // SQ-206 fires at 4 guilds, SQ-207 at 5, etc.
  for (let i = 0; i < GUILD_RESEARCH_SIDE_QUESTS.length; i++) {
    const needed = i + 4; // SQ-206 needs 4, SQ-207 needs 5, etc.
    if (revealedCount < needed) break;
    const qid = GUILD_RESEARCH_SIDE_QUESTS[i];
    const sq = next.find((q) => q.quest_id === qid);
    if (sq && (sq.status === 'available' || sq.status === 'active')) {
      xp += getQuestXpReward(next, qid);
      next = markQuestCompleted(next, qid);
    }
  }

  return { nextQuests: next, xpAwarded: xp };
}

// --- SQ-202: Career Interview (Echoes of Experience) ---

/**
 * Called when the module result handler receives a payload with
 * quest_id === 'sq-202' and status === 'submitted'.
 *
 * SQ-202 transitions from active/available → 'turned_in' (not 'completed')
 * because the teacher must review the student's offline interview document
 * before the quest is marked fully complete. The teacher dashboard handles
 * the final turn-in via markQuestTurnedIn().
 *
 * This bridge simply advances the quest to 'turned_in' on the student side
 * so that it shows as "submitted — awaiting teacher review" in the UI.
 */
export function checkCareerInterviewSideQuest(
  quests: QuestDefinition[],
): { nextQuests: QuestDefinition[]; xpAwarded: number } {
  const sq202 = quests.find((q) => q.quest_id === 'sq-202');
  if (!sq202) return { nextQuests: quests, xpAwarded: 0 };
  if (sq202.status !== 'available' && sq202.status !== 'active') {
    return { nextQuests: quests, xpAwarded: 0 };
  }

  // Mark as turned_in — XP awarded when teacher confirms, not on student submit
  const nextQuests = quests.map((q) =>
    q.quest_id === 'sq-202' ? { ...q, status: 'turned_in' as const } : q,
  );
  return { nextQuests, xpAwarded: 0 };
}

// --- SQ-219: Clear all fog ---

const TOTAL_GUILDS = 16;

/** SQ-219 completes when all 16 guilds are in the atlas. */
export function checkClearAllFogSideQuest(
  quests: QuestDefinition[],
  revealedCount: number,
): { nextQuests: QuestDefinition[]; xpAwarded: number } {
  let next = quests;
  let xp = 0;
  if (revealedCount >= TOTAL_GUILDS) {
    const sq219 = next.find((q) => q.quest_id === 'sq-219');
    if (sq219 && (sq219.status === 'available' || sq219.status === 'active')) {
      xp += getQuestXpReward(next, 'sq-219');
      next = markQuestCompleted(next, 'sq-219');
    }
  }
  return { nextQuests: next, xpAwarded: xp };
}
