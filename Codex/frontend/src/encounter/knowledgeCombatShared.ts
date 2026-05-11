import type { KnowledgeCombatQuestion } from './knowledgeCombatQuestions';

export const KNOWLEDGE_COMBAT_CORRECT_REQUIRED = 3;

export type KnowledgeCombatRound = KnowledgeCombatQuestion & {
  roundOptions: string[];
  roundAnswerIndex: number;
};

export const FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS: KnowledgeCombatQuestion[] = [
  {
    id: 'fallback_kq_001',
    category: 'Concept',
    prompt: 'What is a career cluster?',
    options: [
      'A group of related careers and industries',
      'A single job application',
      'A list of school supplies',
      'A personal password',
    ],
    answerIndex: 0,
  },
  {
    id: 'fallback_kq_002',
    category: 'Vocab',
    prompt: 'What does job outlook describe?',
    options: [
      'The expected future demand for a career',
      'The view from a workplace window',
      'The color of a company logo',
      'The length of a lunch break',
    ],
    answerIndex: 0,
  },
  {
    id: 'fallback_kq_003',
    category: 'Professional',
    prompt: 'What should you do after making a mistake on a project?',
    options: [
      'Own it and offer a solution',
      'Hide it from everyone',
      'Blame the newest teammate',
      'Delete the evidence',
    ],
    answerIndex: 0,
  },
];

export function rotateQuestionOptions(question: KnowledgeCombatQuestion, round: number): KnowledgeCombatRound {
  const options = question.options.length ? question.options : FALLBACK_KNOWLEDGE_COMBAT_QUESTIONS[0].options;
  const originalAnswer = options[question.answerIndex] ?? options[0];
  const offset = options.length ? round % options.length : 0;
  const roundOptions = [...options.slice(offset), ...options.slice(0, offset)];
  return {
    ...question,
    roundOptions,
    roundAnswerIndex: Math.max(0, roundOptions.indexOf(originalAnswer)),
  };
}
