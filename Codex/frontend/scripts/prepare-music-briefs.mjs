import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('../../Project Documents/Music/Audition Briefs');

const briefs = [
  {
    id: 'scroll_reveal_ceremony',
    suno_title: 'Scroll of Destiny - Reveal Ceremony',
    priority: 'P0',
    need_status: 'confirmed',
    intended_scene: 'Act I Scroll of Destiny reveal ceremony',
    target_duration_seconds: '18-25',
    loop: false,
    voiceover_support: false,
    structure:
      '0-0.9s sparse dark-void opening; 0.9-3.8s three restrained rune arrivals; 3.8-7s warm ceremonial bloom as the signpost banner and parchment appear; 7-18s or longer soft resolved tail under the Continue button',
    prompt:
      'Ancient but hopeful fantasy ceremony for a student discovering their Scroll of Destiny, restrained low strings and breathy woodwinds, three distinct warm rune pulses, gentle amber harmonic bloom, mysterious at first and quietly affirming by the end, intimate rather than epic, clean soft tail',
    avoid:
      'No vocals or choir, no trailer percussion, no battle energy, no frightening dissonance, no dominant melody, no abrupt ending',
    suno_style:
      'instrumental fantasy game soundtrack, intimate ancient ceremony, restrained low strings, breathy woodwinds, three warm rune pulses, gentle amber harmonic bloom, mysterious then quietly affirming, sparse arrangement, soft resolved tail',
    suno_exclude:
      'vocals, choir, lyrics, trailer music, epic percussion, battle music, horror, dominant melody, abrupt ending',
    suno_iteration_note:
      'Choose the version with the clearest ceremonial change during its opening seven seconds. Crop or fade after the first complete soft resolution; do not use an unrelated later section.',
  },
  {
    id: 'fireside_reflection_loop',
    suno_title: 'Fireside Reflection',
    priority: 'P0',
    need_status: 'confirmed',
    intended_scene: 'End-of-session Fireside Reflection writing screen',
    target_duration_seconds: '75-120',
    loop: true,
    voiceover_support: false,
    structure:
      'Seamless low-motion loop with no obvious beginning, climax, or cadence; subtle variation every 20-30 seconds while remaining calm enough for reading and writing',
    prompt:
      'Warm nocturnal fantasy reflection underscore beside a campfire, sparse felted strings, soft wooden flute breaths, gentle distant harmonics and a very subtle ember-like pulse, calm contemplative and reassuring, designed for students writing quietly, seamless loop',
    avoid:
      'No vocals, no dramatic melody, no busy rhythm, no melancholy collapse, no loud fire crackle, no obvious loop seam, no final cadence',
    suno_style:
      'instrumental ambient fantasy game soundtrack, warm nocturnal fireside reflection, sparse felted strings, soft wooden flute breaths, distant harmonics, subtle ember-like pulse, calm contemplative reassuring, low musical motion, background underscore',
    suno_exclude:
      'vocals, choir, lyrics, dramatic melody, busy rhythm, sadness, loud percussion, loud fire crackle, climax, final cadence',
    suno_iteration_note:
      'Favor the most even and unobtrusive section. Create the final seamless loop in an audio editor from a stable 75-120 second passage.',
  },
  {
    id: 'prophecy_reveal_ceremony',
    suno_title: 'Oracle Prophecy - The Seal',
    priority: 'P0',
    need_status: 'confirmed',
    intended_scene: 'Oracle Prophecy title, sigil reveal, zoom, scroll entry, and sealing',
    target_duration_seconds: '12-16',
    loop: false,
    voiceover_support: false,
    structure:
      '0-3s luminous emergence; 3-7s restrained sigil intensification; 7-11s transition onto parchment; 11-14s serene seal and soft tail',
    prompt:
      'Luminous ancient prophecy ceremony, delicate glass harmonics, low warm resonance and restrained violet-gold shimmer, sacred and consequential without becoming ominous, builds gently as a sigil appears and resolves as it seals onto parchment',
    avoid:
      'No vocals or choir, no imitation speech, no jump scare, no heavy bass hit, no trailer climax, no unresolved horror tone',
    suno_style:
      'instrumental fantasy game ceremony, luminous ancient prophecy, delicate glass harmonics, low warm resonance, restrained violet-gold shimmer, sacred serene consequential, gentle build, soft resolved seal',
    suno_exclude:
      'vocals, choir, lyrics, speech, jump scare, heavy bass hit, trailer climax, horror, ominous unresolved ending',
    suno_iteration_note:
      'Use the strongest self-contained opening ceremony and let the game fade it when the prophecy reveal completes.',
  },
];

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

await mkdir(OUTPUT_DIR, { recursive: true });

const manifest = {
  generated_at: new Date().toISOString(),
  source: 'Legendary Horizon live music-needs audit',
  output_folder: 'Project Documents/Music/Audition Briefs',
  note:
    'Production briefs only. Existing unused music is unapproved legacy material. This script never generates audio or modifies live game assets or runtime code.',
  briefs: briefs.map((brief) => ({
    ...brief,
    approval_status: 'approved_and_integrated',
    candidate_file:
      brief.id === 'scroll_reveal_ceremony'
        ? 'Amber Rune Chamber.mp3'
        : brief.id === 'fireside_reflection_loop'
          ? 'Ember Hollow.mp3'
          : 'Amber Rune Rite.mp3',
  })),
};

await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const headers = [
  'id',
  'suno_title',
  'priority',
  'need_status',
  'approval_status',
  'intended_scene',
  'target_duration_seconds',
  'loop',
  'voiceover_support',
  'structure',
  'prompt',
  'avoid',
  'suno_style',
  'suno_exclude',
  'suno_iteration_note',
  'candidate_file',
];
const rows = manifest.briefs.map((brief) => headers.map((header) => csvCell(brief[header])).join(','));
await writeFile(
  path.join(OUTPUT_DIR, 'music_audition_batch.csv'),
  `${headers.map(csvCell).join(',')}\n${rows.join('\n')}\n`,
);

console.log(`Prepared ${briefs.length} music audition briefs.`);
console.log(`Output: ${OUTPUT_DIR}`);
