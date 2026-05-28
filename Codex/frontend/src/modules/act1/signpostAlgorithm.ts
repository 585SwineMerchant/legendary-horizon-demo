import { GUILD_REGISTRY } from '../../data/guildData';

export type RiasecScores = {
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
};

export type SurveyAnswer = {
  questionId: string;
  riasecCode: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  /** Guild realm_ids explicitly named by this answer choice. */
  guildHints: string[];
};

/**
 * Compute normalized RIASEC scores (0–20) from survey answers.
 *
 * Each code is scored as: (picks_for_code / questions_offering_code) * 20.
 * This normalizes for unequal distribution of codes across questions.
 */
export function computeRiasecFromSurvey(
  answers: SurveyAnswer[],
  allPossibleAnswers: SurveyAnswer[],
): RiasecScores {
  const codes: Array<keyof RiasecScores> = ['r', 'i', 'a', 's', 'e', 'c'];
  const codeMap: Record<string, keyof RiasecScores> = {
    R: 'r', I: 'i', A: 'a', S: 's', E: 'e', C: 'c',
  };

  const picks: Record<keyof RiasecScores, number> = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };
  const appearances: Record<keyof RiasecScores, number> = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };

  // Count how many questions offered each code
  const seenQuestions = new Set<string>();
  for (const ans of allPossibleAnswers) {
    if (!seenQuestions.has(ans.questionId + ans.riasecCode)) {
      seenQuestions.add(ans.questionId + ans.riasecCode);
      const key = codeMap[ans.riasecCode];
      if (key) appearances[key]++;
    }
  }

  // Count picks
  for (const ans of answers) {
    const key = codeMap[ans.riasecCode];
    if (key) picks[key]++;
  }

  const result: RiasecScores = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };
  for (const code of codes) {
    const max = appearances[code];
    result[code] = max > 0 ? Math.round((picks[code] / max) * 20) : 0;
  }
  return result;
}

/**
 * Merge RIASEC scores from two sources (Maia assessment + survey) by averaging.
 * If one source is missing (all zeros), use the other source directly.
 */
export function mergeRiasecScores(a: RiasecScores, b: RiasecScores): RiasecScores {
  const aIsEmpty = Object.values(a).every((v) => v === 0);
  const bIsEmpty = Object.values(b).every((v) => v === 0);
  if (aIsEmpty) return b;
  if (bIsEmpty) return a;
  return {
    r: Math.round((a.r + b.r) / 2),
    i: Math.round((a.i + b.i) / 2),
    a: Math.round((a.a + b.a) / 2),
    s: Math.round((a.s + b.s) / 2),
    e: Math.round((a.e + b.e) / 2),
    c: Math.round((a.c + b.c) / 2),
  };
}

/**
 * Compute foretold signpost guild IDs from RIASEC scores and survey answers.
 *
 * Scoring per guild:
 *  - Primary RIASEC code match: +3
 *  - Secondary RIASEC code match: +2
 *  - Each survey answer that explicitly named this guild: +4
 *
 * Tie-breaking at position 3: prefer guild whose primary code matches the
 * student's highest RIASEC score.
 *
 * Returns up to three guild_ids (realm_ids) sorted by affinity descending.
 */
export function computeForetoldSignposts(
  riasec: RiasecScores,
  surveyAnswers: SurveyAnswer[],
): string[] {
  const codeScore: Record<string, number> = {
    R: riasec.r, I: riasec.i, A: riasec.a, S: riasec.s, E: riasec.e, C: riasec.c,
  };

  // Highest RIASEC code for tie-breaking
  const highestCode = (Object.entries(codeScore) as [string, number][])
    .reduce((best, [code, score]) => (score > best[1] ? [code, score] : best), ['R', -1])[0];

  // Build explicit guild-name bonus from survey answers
  const guildHintBonus: Record<string, number> = {};
  for (const ans of surveyAnswers) {
    for (const guildId of ans.guildHints) {
      guildHintBonus[guildId] = (guildHintBonus[guildId] ?? 0) + 4;
    }
  }

  // Compute affinity for every registered guild
  const affinities: Array<{ guild_id: string; score: number; primaryCode: string }> = [];
  for (const guild of GUILD_REGISTRY) {
    let score = 0;
    score += (codeScore[guild.riasec_primary] ?? 0) / 20 * 3;
    if (guild.riasec_secondary) {
      score += (codeScore[guild.riasec_secondary] ?? 0) / 20 * 2;
    }
    score += guildHintBonus[guild.guild_id] ?? 0;
    affinities.push({ guild_id: guild.guild_id, score, primaryCode: guild.riasec_primary });
  }

  // Sort by affinity score descending, with tie-break on primary code matching highest student code
  affinities.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aBonus = a.primaryCode === highestCode ? 1 : 0;
    const bBonus = b.primaryCode === highestCode ? 1 : 0;
    return bBonus - aBonus;
  });

  return affinities.slice(0, 3).map((g) => g.guild_id);
}
