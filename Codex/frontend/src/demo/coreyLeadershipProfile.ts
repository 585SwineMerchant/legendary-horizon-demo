export type CoreyLeadershipProfile = {
  studentLabel: string;
  maiaAssessmentComplete: boolean;
  maiaReviewedByTeacher: boolean;
  topInterests: string[];
  suggestedClusters: string[];
  baseStatProfile: {
    insight: number;
    willpower: number;
    creativity: number;
    collaboration: number;
  };
  foretoldSignposts: string[];
  lastSyncedByTeacher: string;
  syncNotes: string;
};

export const coreyLeadershipProfile: CoreyLeadershipProfile = {
  studentLabel: 'Sample student - teacher-reviewed Maia bridge',
  maiaAssessmentComplete: true,
  maiaReviewedByTeacher: true,
  topInterests: ['Investigative', 'Artistic', 'Social'],
  suggestedClusters: ['Health Science', 'Arts, A/V Technology & Communications', 'Education & Training'],
  baseStatProfile: {
    insight: 8,
    willpower: 6,
    creativity: 7,
    collaboration: 7,
  },
  foretoldSignposts: ['Aurora Apothecary', "Chronicler's Spire", 'Archives of Ascension'],
  lastSyncedByTeacher: 'Demo sync - prepared for Corey walkthrough',
  syncNotes:
    'Interest Profiler-style outputs are shown as processed teacher/backend values. The game reads the bridge, not raw Maia analytics.',
};
