import { useMemo, useState } from 'react';

import type { ModuleResultPayload } from '../../types';
import {
  computeForetoldSignposts,
  computeRiasecFromSurvey,
  type SurveyAnswer,
} from './signpostAlgorithm';

type Props = {
  draft: Record<string, string>;
  onDraftChange: (patch: Partial<Record<string, string>>) => void;
  onSubmitResult: (payload: ModuleResultPayload) => void;
  realmId?: string;
};

type QuestionChoice = {
  value: string;
  label: string;
  riasecCode: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  guildHints: string[];
};

type SurveyQuestion = {
  id: string;
  text: string;
  choices: QuestionChoice[];
};

const QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    text: 'Which type of work sounds most interesting to you?',
    choices: [
      { value: 'R', label: 'Building, fixing, or creating things with your hands', riasecCode: 'R', guildHints: ['realm_monolith_masonry', 'realm_vulcanis_forge'] },
      { value: 'I', label: 'Researching, analyzing, and solving complex problems', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_etheric_nexus'] },
      { value: 'A', label: 'Creating art, music, stories, or media', riasecCode: 'A', guildHints: ['realm_chroniclers_spire', 'realm_bards_beacon'] },
      { value: 'S', label: 'Helping people, teaching, or providing care', riasecCode: 'S', guildHints: ['realm_empaths_enclave', 'realm_aurora_apothecary'] },
    ],
  },
  {
    id: 'q2',
    text: 'In group projects, you usually…',
    choices: [
      { value: 'R', label: 'Focus on hands-on or technical tasks', riasecCode: 'R', guildHints: ['realm_odyssey_harbor', 'realm_aethelwood'] },
      { value: 'I', label: 'Research and fact-check all the information', riasecCode: 'I', guildHints: ['realm_archives_ascension', 'realm_alchemical_observatory'] },
      { value: 'A', label: 'Design the visuals or write the content', riasecCode: 'A', guildHints: ['realm_chroniclers_spire'] },
      { value: 'C', label: 'Keep everything organized and on schedule', riasecCode: 'C', guildHints: ['realm_gilded_vault', 'realm_mercantile_citadel'] },
    ],
  },
  {
    id: 'q3',
    text: 'Which of these careers sounds most exciting to you?',
    choices: [
      { value: 'R', label: 'Farmer, builder, mechanic, or engineer', riasecCode: 'R', guildHints: ['realm_aethelwood', 'realm_monolith_masonry'] },
      { value: 'S', label: 'Officer, EMT, firefighter, or social worker', riasecCode: 'S', guildHints: ['realm_valors_watchtower', 'realm_empaths_enclave'] },
      { value: 'A', label: 'Artist, filmmaker, journalist, or graphic designer', riasecCode: 'A', guildHints: ['realm_chroniclers_spire', 'realm_bards_beacon'] },
      { value: 'C', label: 'Accountant, financial analyst, or office administrator', riasecCode: 'C', guildHints: ['realm_gilded_vault', 'realm_mercantile_citadel'] },
    ],
  },
  {
    id: 'q4',
    text: 'What feels most satisfying after you have accomplished something?',
    choices: [
      { value: 'R', label: 'Finishing a physical project you built or repaired', riasecCode: 'R', guildHints: ['realm_vulcanis_forge', 'realm_monolith_masonry'] },
      { value: 'I', label: 'Discovering how something works or solving a puzzle', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_etheric_nexus'] },
      { value: 'A', label: 'Sharing or performing something creative you made', riasecCode: 'A', guildHints: ['realm_chroniclers_spire'] },
      { value: 'S', label: 'Seeing someone you supported reach their goal', riasecCode: 'S', guildHints: ['realm_archives_ascension', 'realm_empaths_enclave'] },
    ],
  },
  {
    id: 'q5',
    text: 'If you could add one elective to your schedule, it would be…',
    choices: [
      { value: 'R', label: 'Architecture, engineering, or electronics', riasecCode: 'R', guildHints: ['realm_etheric_nexus', 'realm_monolith_masonry'] },
      { value: 'A', label: 'Media production, graphic design, or journalism', riasecCode: 'A', guildHints: ['realm_bards_beacon', 'realm_chroniclers_spire'] },
      { value: 'E', label: 'Entrepreneurship, marketing, or business leadership', riasecCode: 'E', guildHints: ['realm_mercantile_citadel', 'realm_bards_beacon'] },
      { value: 'S', label: 'Counseling, social work, or public service', riasecCode: 'S', guildHints: ['realm_crossroads_haven', 'realm_aurora_apothecary'] },
    ],
  },
  {
    id: 'q6',
    text: 'A friend asks for your help — you are most excited when it involves…',
    choices: [
      { value: 'R', label: 'Fixing, building, or setting something up', riasecCode: 'R', guildHints: ['realm_vulcanis_forge', 'realm_odyssey_harbor'] },
      { value: 'I', label: 'Looking up information and explaining how things work', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_archives_ascension'] },
      { value: 'A', label: 'Designing a flyer, video, or creative project', riasecCode: 'A', guildHints: ['realm_bards_beacon'] },
      { value: 'S', label: 'Listening, advising, or helping them work through a challenge', riasecCode: 'S', guildHints: ['realm_empaths_enclave', 'realm_crossroads_haven'] },
    ],
  },
  {
    id: 'q7',
    text: 'You feel most in your element when you are…',
    choices: [
      { value: 'R', label: 'Working with machines, tools, or physical materials', riasecCode: 'R', guildHints: ['realm_vulcanis_forge', 'realm_aethelwood'] },
      { value: 'I', label: 'Analyzing data, running experiments, or testing ideas', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_etheric_nexus'] },
      { value: 'E', label: 'Leading a team, setting goals, or pitching ideas', riasecCode: 'E', guildHints: ['realm_high_council_hall', 'realm_mercantile_citadel'] },
      { value: 'C', label: 'Managing records, finances, or organized systems', riasecCode: 'C', guildHints: ['realm_gilded_vault', 'realm_mercantile_citadel'] },
    ],
  },
  {
    id: 'q8',
    text: 'Which of these career paths sounds most exciting to you?',
    choices: [
      { value: 'R', label: 'Transportation, logistics, or supply chain management', riasecCode: 'R', guildHints: ['realm_odyssey_harbor'] },
      { value: 'I', label: 'Information technology, cybersecurity, or software development', riasecCode: 'I', guildHints: ['realm_etheric_nexus'] },
      { value: 'E', label: 'Entrepreneurship, sales, or corporate leadership', riasecCode: 'E', guildHints: ['realm_mercantile_citadel', 'realm_high_council_hall'] },
      { value: 'C', label: 'Finance, accounting, or real estate', riasecCode: 'C', guildHints: ['realm_gilded_vault'] },
    ],
  },
  {
    id: 'q9',
    text: 'When you have free time online, you most often…',
    choices: [
      { value: 'R', label: 'Watch tutorials about building, crafting, or engineering', riasecCode: 'R', guildHints: ['realm_aethelwood', 'realm_vulcanis_forge'] },
      { value: 'I', label: 'Read about science, medicine, or technology breakthroughs', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_aurora_apothecary'] },
      { value: 'A', label: 'Follow art, design, music, or creative storytelling content', riasecCode: 'A', guildHints: ['realm_chroniclers_spire', 'realm_bards_beacon'] },
      { value: 'S', label: 'Watch travel, hospitality, or community lifestyle content', riasecCode: 'S', guildHints: ['realm_crossroads_haven', 'realm_empaths_enclave'] },
    ],
  },
  {
    id: 'q10',
    text: 'In a class project, which role would you most want?',
    choices: [
      { value: 'R', label: 'Build or create the final product or deliverable', riasecCode: 'R', guildHints: ['realm_vulcanis_forge', 'realm_etheric_nexus'] },
      { value: 'I', label: 'Research and gather evidence for the team', riasecCode: 'I', guildHints: ['realm_archives_ascension', 'realm_alchemical_observatory'] },
      { value: 'E', label: 'Lead the group and present the results', riasecCode: 'E', guildHints: ['realm_high_council_hall', 'realm_mercantile_citadel'] },
      { value: 'C', label: 'Edit, format, and make sure every detail is right', riasecCode: 'C', guildHints: ['realm_gilded_vault', 'realm_archives_ascension'] },
    ],
  },
  {
    id: 'q11',
    text: 'Which motto resonates with you most?',
    choices: [
      { value: 'R', label: '"I would rather build it than buy it."', riasecCode: 'R', guildHints: ['realm_vulcanis_forge', 'realm_aethelwood'] },
      { value: 'I', label: '"I need to understand exactly how it works."', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_etheric_nexus'] },
      { value: 'A', label: '"If I can imagine it, I can make it happen."', riasecCode: 'A', guildHints: ['realm_chroniclers_spire', 'realm_bards_beacon'] },
      { value: 'S', label: '"I feel best when everyone around me succeeds."', riasecCode: 'S', guildHints: ['realm_empaths_enclave', 'realm_crossroads_haven'] },
    ],
  },
  {
    id: 'q12',
    text: 'What kind of career outcome matters most to you?',
    choices: [
      { value: 'R', label: 'Creating physical things that last — built, grown, or made', riasecCode: 'R', guildHints: ['realm_monolith_masonry', 'realm_aethelwood'] },
      { value: 'I', label: 'Making a scientific or technical breakthrough', riasecCode: 'I', guildHints: ['realm_alchemical_observatory', 'realm_etheric_nexus'] },
      { value: 'E', label: 'Earning recognition for leadership or business impact', riasecCode: 'E', guildHints: ['realm_high_council_hall', 'realm_bards_beacon'] },
      { value: 'C', label: 'Having a stable, well-organized career with clear expectations', riasecCode: 'C', guildHints: ['realm_gilded_vault', 'realm_mercantile_citadel'] },
    ],
  },
];

/** Flattened list of all possible answer objects — used for RIASEC normalization. */
const ALL_POSSIBLE_ANSWERS: SurveyAnswer[] = QUESTIONS.flatMap((q) =>
  q.choices.map((c) => ({
    questionId: q.id,
    riasecCode: c.riasecCode,
    guildHints: c.guildHints,
  })),
);

function nowIso(): string {
  return new Date().toISOString();
}

export function MasterScribeSurveyModule({ draft, onDraftChange, onSubmitResult, realmId = 'realm_archives_ascension' }: Props) {
  const [submitError, setSubmitError] = useState('');

  const responses = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const val = String(draft[q.id] ?? '').trim();
      if (val) out[q.id] = val;
    }
    return out;
  }, [draft]);

  const answeredCount = Object.keys(responses).length;
  const totalQuestions = QUESTIONS.length;
  const pct = Math.round((answeredCount / totalQuestions) * 100);
  const allAnswered = answeredCount === totalQuestions;

  const handleChoice = (questionId: string, value: string) => {
    setSubmitError('');
    onDraftChange({ [questionId]: value });
  };

  const handleSubmit = () => {
    if (!allAnswered) {
      const first = QUESTIONS.find((q) => !responses[q.id]);
      setSubmitError(`Please answer all questions before submitting. (${first?.text ?? 'A question'} is missing.)`);
      return;
    }

    // Build SurveyAnswer array from choices made
    const pickedAnswers: SurveyAnswer[] = QUESTIONS.flatMap((q) => {
      const chosen = responses[q.id];
      const choice = q.choices.find((c) => c.value === chosen);
      if (!choice) return [];
      return [{ questionId: q.id, riasecCode: choice.riasecCode, guildHints: choice.guildHints }];
    });

    const riasecScores = computeRiasecFromSurvey(pickedAnswers, ALL_POSSIBLE_ANSWERS);
    const signpostIds = computeForetoldSignposts(riasecScores, pickedAnswers);

    onSubmitResult({
      module_id: 'mod_master_scribe_survey',
      quest_id: 'mq-104',
      realm_id: realmId,
      status: 'completed',
      artifacts: {
        survey_responses: responses,
        foretold_signpost_realm_ids: signpostIds,
        riasec_scores: riasecScores,
      },
      completed_at_iso: nowIso(),
    });
  };

  return (
    <div className="lh-world-map__layout">
      <section className="lh-world-map__realms" aria-label="Master Scribe survey">
        <h3 className="lh-heading-sm">The Scribe's Questions</h3>
        <p className="lh-world-map__hint" style={{ marginBottom: 4 }}>
          Answer all {totalQuestions} questions to reveal your Foretold Signposts.
        </p>
        <p className="lh-world-map__meta" style={{ marginBottom: 16 }}>
          Progress: <strong>{pct}%</strong> ({answeredCount} / {totalQuestions})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {QUESTIONS.map((q, qi) => {
            const chosen = responses[q.id] ?? '';
            return (
              <div
                key={q.id}
                className="lh-panel"
                style={{
                  padding: '14px 16px',
                  borderLeft: chosen ? '3px solid #d4a017' : '3px solid transparent',
                }}
              >
                <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>
                  <span style={{ color: '#94a3b8', marginRight: 6 }}>{qi + 1}.</span>
                  {q.text}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.choices.map((c) => {
                    const isChosen = chosen === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleChoice(q.id, c.value)}
                        className={`lh-button ${isChosen ? 'lh-button--primary' : 'lh-button--secondary'}`}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          justifyContent: 'flex-start',
                          fontSize: 13,
                        }}
                        aria-pressed={isChosen}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 22,
                            flexShrink: 0,
                            fontFamily: 'monospace',
                            opacity: 0.6,
                            marginRight: 6,
                          }}
                        >
                          {c.value}.
                        </span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {submitError ? (
          <p
            role="alert"
            style={{ color: '#f87171', marginTop: 16, fontSize: 13, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 4 }}
          >
            {submitError}
          </p>
        ) : null}

        <div className="lh-world-map__actions" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="lh-button lh-button--primary"
            onClick={handleSubmit}
            disabled={!allAnswered}
            title={allAnswered ? 'Submit your answers' : `Answer all ${totalQuestions} questions first`}
          >
            Seal the Survey &amp; Reveal Signposts
          </button>
        </div>
      </section>
    </div>
  );
}
