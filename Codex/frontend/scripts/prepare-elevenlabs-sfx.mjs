import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const OUTPUT_DIR = path.resolve('../../Project Documents/Sound Effects/ElevenLabs Candidates');
const APPROVED_EFFECT_IDS = new Set([
  'save_confirm',
  'quest_complete',
  'item_acquired',
  'action_blocked',
  'answer_correct',
  'answer_incorrect',
]);

const effects = [
  {
    id: 'save_confirm',
    priority: 'P0',
    duration_seconds: 1.2,
    prompt_influence: 0.55,
    intended_event: 'Successful save confirmation',
    prompt:
      'Short magical save confirmation chime for a warm educational fantasy game, three gentle ascending crystal notes, soft parchment shimmer, reassuring and complete, no music, no voice, clean ending',
  },
  {
    id: 'quest_complete',
    priority: 'P0',
    duration_seconds: 1.8,
    prompt_influence: 0.55,
    intended_event: 'Quest completion',
    prompt:
      'Concise fantasy quest completion flourish, warm brass-like magical tone with a bright final bell, encouraging and earned, suitable for students, no voice, no long music tail',
  },
  {
    id: 'item_acquired',
    priority: 'P0',
    duration_seconds: 1.1,
    prompt_influence: 0.6,
    intended_event: 'Memento or inventory reward acquired',
    prompt:
      'Tiny fantasy item acquired sound, soft satchel rustle followed by one bright enchanted coin-like ping, warm and rewarding, no voice, no music',
  },
  {
    id: 'action_blocked',
    priority: 'P0',
    duration_seconds: 0.7,
    prompt_influence: 0.65,
    intended_event: 'Blocked, invalid, or unavailable player action',
    prompt:
      'Gentle fantasy action unavailable sound, muted wooden click with a low soft magical thud, informative rather than punishing, no voice, no harsh buzzer',
  },
  {
    id: 'answer_correct',
    priority: 'P0',
    duration_seconds: 0.8,
    prompt_influence: 0.6,
    intended_event: 'Knowledge combat correct answer',
    prompt:
      'Very short correct answer sound for a fantasy learning game, clear bright rune ping with a subtle upward sparkle, confident and encouraging, no voice',
  },
  {
    id: 'answer_incorrect',
    priority: 'P0',
    duration_seconds: 0.75,
    prompt_influence: 0.65,
    intended_event: 'Knowledge combat incorrect answer',
    prompt:
      'Very short incorrect answer sound for a fantasy learning game, soft dull rune pulse with a gentle downward tone, calm and non-punitive, no voice, no buzzer',
  },
  {
    id: 'traveler_hit',
    priority: 'P1',
    duration_seconds: 0.55,
    prompt_influence: 0.65,
    intended_event: 'Exploration combat: Traveler takes damage',
    prompt:
      'Short stylized fantasy game impact on a cloaked adventurer, soft cloth and light armor hit with magical energy, readable but not violent, no voice',
  },
  {
    id: 'lost_echo_hit',
    priority: 'P1',
    duration_seconds: 0.65,
    prompt_influence: 0.65,
    intended_event: 'Exploration combat: Lost Echo takes damage',
    prompt:
      'Short impact against a shadowy magical echo, airy spectral crack and dissipating dark shimmer, readable fantasy combat feedback, no voice',
  },
  {
    id: 'dialogue_open',
    priority: 'P1',
    duration_seconds: 0.65,
    prompt_influence: 0.55,
    intended_event: 'NPC dialogue opens; candidate must remain unobtrusive under narration',
    prompt:
      'Subtle fantasy dialogue opening sound, quiet parchment lift and tiny warm rune glow, intimate and unobtrusive, designed to sit under spoken narration, no voice',
  },
  {
    id: 'dialogue_advance',
    priority: 'P1',
    duration_seconds: 0.35,
    prompt_influence: 0.6,
    intended_event: 'NPC dialogue advances; candidate must remain unobtrusive under narration',
    prompt:
      'Extremely subtle fantasy dialogue page advance, tiny dry parchment tick with a faint warm magical sparkle, unobtrusive under narration, no voice',
  },
  {
    id: 'oracle_altar_awaken',
    priority: 'P1',
    duration_seconds: 2.8,
    prompt_influence: 0.55,
    intended_event: 'Oracle altar Scroll activation before cinematic',
    prompt:
      'Ancient oracle altar awakening in a fantasy shrine, low stone resonance, three rising rune tones, restrained ethereal energy, sacred and mysterious, no voice, no music',
  },
  {
    id: 'prophecy_sealed',
    priority: 'P1',
    duration_seconds: 2.1,
    prompt_influence: 0.55,
    intended_event: 'Oracle prophecy branded onto the Scroll',
    prompt:
      'Mystical prophecy sealed into an ancient scroll, luminous rune flare, soft ember imprint, one clear final chime, serene and consequential, no voice, no music',
  },
  {
    id: 'campfire_reflection_saved',
    priority: 'P2',
    duration_seconds: 1.8,
    prompt_influence: 0.5,
    intended_event: 'Successful end-session reflection save',
    prompt:
      'Warm fantasy campfire reflection saved sound, gentle ember crackle, soft notebook close, peaceful ascending glow tone, reassuring, no voice, no music',
  },
];

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function writeManifests() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = {
    generated_at: new Date().toISOString(),
    source: 'Legendary Horizon live SFX audit',
    output_folder: 'Project Documents/Sound Effects/ElevenLabs Candidates',
    note: 'Audition candidates only. This script never modifies live game assets or runtime code.',
    effects: effects.map((effect) => ({
      ...effect,
      approval_status: APPROVED_EFFECT_IDS.has(effect.id) ? 'approved_and_integrated' : 'unreviewed',
      file: `${effect.id}.mp3`,
    })),
  };
  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const headers = [
    'id',
    'priority',
    'approval_status',
    'duration_seconds',
    'prompt_influence',
    'intended_event',
    'prompt',
    'file',
  ];
  const rows = manifest.effects.map((effect) => headers.map((header) => csvCell(effect[header])).join(','));
  await writeFile(path.join(OUTPUT_DIR, 'elevenlabs_sfx_batch.csv'), `${headers.map(csvCell).join(',')}\n${rows.join('\n')}\n`);
}

async function generateEffect(effect) {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: effect.prompt,
      duration_seconds: effect.duration_seconds,
      prompt_influence: effect.prompt_influence,
      loop: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`${effect.id}: ElevenLabs returned ${response.status} ${await response.text()}`);
  }
  await writeFile(path.join(OUTPUT_DIR, `${effect.id}.mp3`), Buffer.from(await response.arrayBuffer()));
  console.log(`Generated ${effect.id}.mp3`);
}

const args = new Set(process.argv.slice(2));
const onlyArg = process.argv.slice(2).find((arg) => arg.startsWith('--only='));
const onlyIds = new Set(onlyArg ? onlyArg.slice('--only='.length).split(',').filter(Boolean) : []);
const priorityArg = process.argv.slice(2).find((arg) => arg.startsWith('--priority='));
const selectedPriority = priorityArg?.slice('--priority='.length).toUpperCase();

await writeManifests();
console.log(`Prepared ${effects.length} SFX candidates.`);

if (args.has('--dry-run') || !args.has('--generate')) {
  console.log(`Manifest only. Output: ${OUTPUT_DIR}`);
  process.exit(0);
}

if (!process.env.ELEVENLABS_API_KEY) throw new Error('Set ELEVENLABS_API_KEY before generating sound effects.');
const selected = effects.filter(
  (effect) => (!onlyIds.size || onlyIds.has(effect.id)) && (!selectedPriority || effect.priority === selectedPriority),
);
if (!selected.length) throw new Error('No sound effects matched the requested --only or --priority filter.');

for (const effect of selected) {
  const target = path.join(OUTPUT_DIR, `${effect.id}.mp3`);
  if (args.has('--skip-existing')) {
    try {
      await access(target);
      console.log(`Skipped existing ${effect.id}.mp3`);
      continue;
    } catch {
      // Generate missing candidate.
    }
  }
  await generateEffect(effect);
}
