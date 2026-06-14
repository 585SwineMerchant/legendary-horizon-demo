import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const frontendRoot = path.resolve('.');
const workspaceRoot = path.resolve('../..');

const copies = [
  ...['save_confirm', 'quest_complete', 'item_acquired', 'action_blocked', 'answer_correct', 'answer_incorrect'].map(
    (id) => ({
      source: path.join(workspaceRoot, 'Project Documents', 'Sound Effects', 'ElevenLabs Candidates', `${id}.mp3`),
      target: path.join(frontendRoot, 'public', 'assets', 'sfx', `${id}.mp3`),
    }),
  ),
  {
    source: path.join(workspaceRoot, 'Project Documents', 'Music', 'Amber Rune Chamber.mp3'),
    target: path.join(frontendRoot, 'public', 'assets', 'music', 'scroll_reveal_ceremony.mp3'),
  },
  {
    source: path.join(workspaceRoot, 'Project Documents', 'Music', 'Ember Hollow.mp3'),
    target: path.join(frontendRoot, 'public', 'assets', 'music', 'fireside_reflection_loop.mp3'),
  },
  {
    source: path.join(workspaceRoot, 'Project Documents', 'Music', 'Amber Rune Rite.mp3'),
    target: path.join(frontendRoot, 'public', 'assets', 'music', 'prophecy_reveal_ceremony.mp3'),
  },
];

for (const { source, target } of copies) {
  await access(source);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(`Installed ${path.relative(frontendRoot, target)}`);
}
