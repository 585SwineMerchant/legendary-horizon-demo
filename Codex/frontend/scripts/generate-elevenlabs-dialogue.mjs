import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const OUTPUT_DIR = path.resolve('public/assets/dialogue/narration');
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';

const voices = {
  master_scribe: {
    voiceId: process.env.ELEVENLABS_MASTER_SCRIBE_VOICE_ID || '',
    direction: 'Distinct elderly female Scribe: low contralto, weathered and gently scratchy, measured, warm, authoritative.',
  },
  oracle: {
    voiceId: process.env.ELEVENLABS_ORACLE_VOICE_ID || '',
    direction: 'Distinct ageless feminine Oracle: clear, serene, lightly ethereal, intimate, and unnervingly calm.',
  },
};

const sequences = [
  {
    id: 'master_scribe_mq_101',
    speaker: 'master_scribe',
    trigger: 'MQ-101 active or available',
    pages: [
      'Traveler... At last.',
      'You have crossed the threshold and arrived in the Grey Commons. Every path in the Horizon begins here. The roads stretch in every direction. Some lead to prosperity. Some to purpose. Yet from where you stand, they all appear hidden by fog.',
      'This is the Scroll of Destiny. One day it will contain the story of your journey. But today - its pages are blank. As they should be.',
      'Before the Scroll can guide you, you must first discover who you are. Beyond these fields stands the Mirror of Maia. Seek it. Learn what it reveals. Then return to me.',
    ],
  },
  {
    id: 'master_scribe_mq_102',
    speaker: 'master_scribe',
    trigger: 'MQ-102 active or available',
    pages: [
      'The Mirror of Maia awaits, Traveler. Beyond these fields - seek it. Return when you have glimpsed your first sign.',
    ],
  },
  {
    id: 'master_scribe_mq_103',
    speaker: 'master_scribe',
    trigger: 'MQ-103 active or available',
    pages: [
      'The Echoes grow bolder.',
      'They gather where purpose is unclear.',
      'Stand with me, Traveler.',
      'Drive them back.',
    ],
  },
  {
    id: 'master_scribe_mq_104',
    speaker: 'master_scribe',
    trigger: 'MQ-104 active or available',
    pages: [
      'Good. The Echoes have scattered.',
      'You have learned that some uncertainty must be faced directly.',
      'Now return to the Mirror of Maia.',
      'Your next sign is waiting.',
    ],
  },
  {
    id: 'master_scribe_mq_105',
    speaker: 'master_scribe',
    trigger: 'MQ-105 active or available',
    pages: [
      'Well done, Traveler.',
      'You drove back the Echoes of doubt.',
      'But there is one more you must face.',
      'This Echo is different.',
      'Steel alone will not scatter it.',
      'Force will not help you here.',
      'This Echo questions.',
      'It tests what you know - not how hard you can strike.',
      'Approach it and press Enter.',
      'Answer with what you have learned.',
      'The Echo glows nearby.',
      'Find it when you are ready.',
    ],
  },
  {
    id: 'master_scribe_mq_106',
    speaker: 'master_scribe',
    trigger: 'MQ-106 active or available',
    pages: [
      'Well answered.',
      'Not every Echo is defeated by force.',
      'Some fade only when met with understanding.',
      'Return to Maia, Traveler.',
      'The next reflection awaits.',
    ],
  },
  {
    id: 'master_scribe_mq_107',
    speaker: 'master_scribe',
    trigger: 'MQ-107 active or available',
    pages: [
      'Every Traveler needs more than courage and reflection.',
      'They need records.',
      'Tools.',
      'Maps.',
      'Memories.',
      'Open the Scroll of Destiny.',
      'Find what it remembers.',
    ],
  },
  {
    id: 'master_scribe_mq_108',
    speaker: 'master_scribe',
    trigger: 'MQ-108 active or available',
    pages: [
      'Good.',
      'The Scroll will remember what the mind forgets.',
      'One reflection remains.',
      'Return to Maia and seek your Foretold Signposts.',
    ],
  },
  {
    id: 'master_scribe_mq_109',
    speaker: 'master_scribe',
    trigger: 'MQ-109 active or available, before Scroll reveal',
    pages: [
      'The Scroll has awakened.',
      'Wait...',
    ],
  },
  {
    id: 'master_scribe_post_scroll_reveal',
    speaker: 'master_scribe',
    trigger: 'Immediately after Scroll reveal cinematic',
    pages: [
      'This should not be here.',
      'Your first signs are clear... but something else has marked the Scroll.',
      'I can record what the Scroll reveals. I cannot interpret what has awakened beneath it.',
      'The Oracle must see this. Find the shrine beyond the path, and return to me when her vision is complete.',
    ],
  },
  {
    id: 'master_scribe_mq_201',
    speaker: 'master_scribe',
    trigger: 'MQ-201 active or available',
    pages: [
      'The Oracle Shrine lies beyond the Grey Commons.',
      'Seek it.',
      'The Scroll has awakened - but only the Oracle can make its runes legible.',
    ],
  },
  {
    id: 'master_scribe_mq_202',
    speaker: 'master_scribe',
    trigger: 'MQ-202 active or available',
    pages: [
      'You heard the Oracle.',
      'The Runes have settled - and they may now be read.',
      'Three Foretold Signposts are sealed on your Scroll.',
      'They are not your destiny.',
      'They are not a verdict.',
      'They are the first roads asking to be examined.',
      'The Oracle also burned a mark into your Scroll.',
      'That mark is a link - a real-world research source about one of your signpost paths.',
      "Open your Scroll of Destiny and look for the Oracle's brand.",
      'Click it.',
      'Read.',
      'Take notes.',
      'That is your next task: not choosing a career, but learning how a Traveler studies a road before walking it.',
      'I have placed the Quest of Fate in your Field Journal.',
      'Open the Scroll of Destiny, then Field Journal, then Work Files.',
      'Your document will be waiting there.',
      'When your teacher creates your personal copy in Google Drive, you will find a link in Work Files as well.',
    ],
  },
  {
    id: 'master_scribe_fallback',
    speaker: 'master_scribe',
    trigger: 'No Act I or Act II Scribe quest branch is active',
    pages: [
      'The guild roads are open, Traveler. Follow the Scroll of Destiny and gather evidence before choosing your path.',
    ],
  },
  {
    id: 'oracle_mq_201',
    speaker: 'oracle',
    trigger: 'Oracle NPC approached while MQ-201 is active or available',
    pages: [
      'Traveler of the Grey Commons...',
      'Your first signs have awakened.',
      'Three runes burn upon your Scroll.',
      'Not answers.',
      'Not chains.',
      'Signposts.',
      'Do not choose from wonder.',
      'Do not choose from fear.',
      'Choose only after seeking evidence.',
      'I do not speak my visions.',
      'I reveal them through the Scroll.',
      'Open it here, at this altar.',
    ],
  },
  {
    id: 'oracle_cinematic',
    speaker: 'oracle',
    trigger: 'Oracle awakening cinematic text overlays',
    pages: [
      'The scroll hums in your hands...',
      'Your signposts stir...',
      'The threads of your fate converge...',
    ],
  },
  {
    id: 'oracle_fallback',
    speaker: 'oracle',
    trigger: 'MQ-201 is absent or locked; completed Oracle is dormant',
    pages: [
      'The signs are spoken, Traveler. The road is yours to walk.',
    ],
  },
];

function clipRows() {
  return sequences.flatMap((sequence) =>
    sequence.pages.map((text, index) => ({
      clip_id: `${sequence.id}__p${String(index + 1).padStart(2, '0')}`,
      sequence_id: sequence.id,
      page: index + 1,
      page_count: sequence.pages.length,
      speaker: sequence.speaker,
      trigger: sequence.trigger,
      file: `${sequence.id}__p${String(index + 1).padStart(2, '0')}.mp3`,
      text,
      voice_direction: voices[sequence.speaker].direction,
    })),
  );
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function writeManifests(rows) {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = {
    generated_at: new Date().toISOString(),
    model_id: MODEL_ID,
    output_format: OUTPUT_FORMAT,
    source: 'Live Master Scribe and Oracle RPG dialogue pages in useNightOneFlow.ts',
    voice_plan: 'Master Scribe and Oracle each use a distinct approved character voice.',
    voice_settings: 'Uses each saved ElevenLabs voice configuration; the generator does not override voice settings.',
    speech_normalization: 'Typographic dashes, ellipses, and the UI breadcrumb arrow are normalized for speech.',
    pronunciation_notes: {
      Maia: 'MY-uh',
      'Grey Commons': 'gray commons',
      'Foretold Signposts': 'fore-told sign-posts',
    },
    clips: rows,
  };
  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const headers = ['clip_id', 'sequence_id', 'page', 'page_count', 'speaker', 'trigger', 'file', 'text', 'voice_direction'];
  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
  await writeFile(path.join(OUTPUT_DIR, 'elevenlabs_batch.csv'), `${csv}\n`);
}

async function generateClip(row) {
  const voice = voices[row.speaker];
  if (!voice.voiceId) {
    throw new Error(`Missing ElevenLabs voice ID for ${row.speaker}.`);
  }
  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`);
  url.searchParams.set('output_format', OUTPUT_FORMAT);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: row.text,
      model_id: MODEL_ID,
    }),
  });
  if (!response.ok) {
    throw new Error(`${row.clip_id}: ElevenLabs returned ${response.status} ${await response.text()}`);
  }
  await writeFile(path.join(OUTPUT_DIR, row.file), Buffer.from(await response.arrayBuffer()));
  console.log(`Generated ${row.file}`);
}

async function listVoices() {
  const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  });
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status} ${await response.text()}`);
  const payload = await response.json();
  for (const voice of payload.voices ?? []) {
    console.log(`${voice.name}\t${voice.voice_id}\t${voice.category ?? ''}`);
  }
}

const args = new Set(process.argv.slice(2));
if (args.has('--list-voices')) {
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('Set ELEVENLABS_API_KEY before listing voices.');
  await listVoices();
  process.exit(0);
}

const onlyArg = process.argv.slice(2).find((arg) => arg.startsWith('--only='));
const onlyIds = new Set(onlyArg ? onlyArg.slice('--only='.length).split(',').filter(Boolean) : []);
const speakerArg = process.argv.slice(2).find((arg) => arg.startsWith('--speaker='));
const selectedSpeaker = speakerArg?.slice('--speaker='.length);
const rows = clipRows();
await writeManifests(rows);
console.log(`Prepared ${rows.length} page-level clips across ${sequences.length} dialogue sequences.`);

if (args.has('--dry-run') || !args.has('--generate')) {
  console.log(`Manifest only. Output: ${OUTPUT_DIR}`);
  process.exit(0);
}

if (!process.env.ELEVENLABS_API_KEY) throw new Error('Set ELEVENLABS_API_KEY before generating audio.');
if (!process.env.ELEVENLABS_MASTER_SCRIBE_VOICE_ID && !process.env.ELEVENLABS_ORACLE_VOICE_ID) {
  throw new Error(
    'Set ELEVENLABS_MASTER_SCRIBE_VOICE_ID or ELEVENLABS_ORACLE_VOICE_ID for the character being generated.',
  );
}
const selectedRows = rows.filter(
  (row) => (!onlyIds.size || onlyIds.has(row.clip_id)) && (!selectedSpeaker || row.speaker === selectedSpeaker),
);
if (!selectedRows.length) throw new Error('No clips matched the requested --only or --speaker filter.');
for (const row of selectedRows) {
  if (args.has('--skip-existing')) {
    try {
      await access(path.join(OUTPUT_DIR, row.file));
      console.log(`Skipped existing ${row.file}`);
      continue;
    } catch {
      // Generate missing clip.
    }
  }
  await generateClip(row);
}
