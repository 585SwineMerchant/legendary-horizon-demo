export type IntroCinematicScene = {
  id: string;
  title: string;
  imageUrl: string;
  narrationUrl: string;
  durationMs: number;
  text: string;
};

export const introCinematicScenes: IntroCinematicScene[] = [
  {
    id: 'awakening',
    title: 'The Mirror of Maia',
    imageUrl: '/assets/intro/scene_1_awakening_1775784281028.png',
    narrationUrl: '/assets/intro/audio/scene_1_awakening.mp3',
    durationMs: 13500,
    text:
      'Every journey begins with a mirror. In Legendary Horizon, students first step into Maia Learning to complete the work that grounds the adventure: interests, recommendations, and early career signals.',
  },
  {
    id: 'base-stats',
    title: 'The Character Sheet',
    imageUrl: '/assets/intro/scene_2_base_stats_1775784306257.png',
    narrationUrl: '/assets/intro/audio/scene_2_base_stats.mp3',
    durationMs: 13000,
    text:
      'Those Maia results are not replaced by the game. They are interpreted by the teacher and translated into game-ready values: base stats, opening strengths, and the first paths worth investigating.',
  },
  {
    id: 'realms',
    title: 'The Realm Atlas',
    imageUrl: '/assets/intro/scene_3_library_1775784320844.png',
    narrationUrl: '/assets/intro/audio/scene_3_library.mp3',
    durationMs: 12500,
    text:
      'The world opens into career-cluster realms. Students explore, research, compare, and collect evidence so the choices in Maia become more meaningful than a list on a screen.',
  },
  {
    id: 'scroll',
    title: 'The Scroll of Destiny',
    imageUrl: '/assets/intro/scene_4_dagger_sword_1775784333493.png',
    narrationUrl: '/assets/intro/audio/scene_4_scroll.mp3',
    durationMs: 12500,
    text:
      'The Scroll of Destiny turns reflection into a guided plan: a manifest, foretold signposts, and a clearer reason to investigate careers before choosing a direction.',
  },
  {
    id: 'comparison',
    title: 'The Comparison Trials',
    imageUrl: '/assets/intro/scene_5_comparison_1775784346724.png',
    narrationUrl: '/assets/intro/audio/scene_5_comparison.mp3',
    durationMs: 12500,
    text:
      'Students then compare real careers: requirements, training, earnings, lifestyle fit, and the evidence behind each possible path.',
  },
  {
    id: 'return',
    title: 'Return to Maia',
    imageUrl: '/assets/intro/scene_6_call_1775784401440.png',
    narrationUrl: '/assets/intro/audio/scene_6_return_to_maia.mp3',
    durationMs: 12500,
    text:
      'After exploration, students return to Maia and the NYS Career Plan with stronger language, sharper questions, and a better understanding of why the plan matters.',
  },
] as const;
