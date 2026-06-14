import { access, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const frontendRoot = path.resolve('.');
const repoRoot = path.resolve('../..');
const narrationDir = path.join(frontendRoot, 'public', 'assets', 'dialogue', 'narration');

const requiredRuntimeAssetPaths = [
  ...['save_confirm', 'quest_complete', 'item_acquired', 'action_blocked', 'answer_correct', 'answer_incorrect'].map(
    (id) => `assets/sfx/${id}.mp3`,
  ),
  'assets/music/scroll_reveal_ceremony.mp3',
  'assets/music/fireside_reflection_loop.mp3',
  'assets/music/prophecy_reveal_ceremony.mp3',
];

const manifest = JSON.parse(await readFile(path.join(narrationDir, 'manifest.json'), 'utf8'));
const narrationAssetPaths = (manifest.clips ?? []).map(
  (clip) => `assets/dialogue/narration/${clip.file}`,
);
const requiredAssetPaths = [...requiredRuntimeAssetPaths, ...narrationAssetPaths];
const required = requiredAssetPaths.map((assetPath) => path.join(frontendRoot, 'public', assetPath));

const missing = [];
const empty = [];
for (const file of required) {
  try {
    await access(file);
    if ((await stat(file)).size <= 0) empty.push(path.relative(frontendRoot, file));
  } catch {
    missing.push(path.relative(frontendRoot, file));
  }
}

if (missing.length || empty.length) {
  if (missing.length) console.error(`Missing approved audio:\n${missing.join('\n')}`);
  if (empty.length) console.error(`Empty approved audio:\n${empty.join('\n')}`);
  process.exit(1);
}

const repoRelativeSources = [
  path.relative(repoRoot, path.join(frontendRoot, 'src', 'hooks', 'useDialogueNarration.ts')),
  path.relative(repoRoot, path.join(narrationDir, 'manifest.json')),
  ...required.map((file) => path.relative(repoRoot, file)),
].map((file) => file.replaceAll('\\', '/'));
const tracked = new Set(
  execFileSync('git', ['ls-files', '--cached', '--', ...repoRelativeSources], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((file) => file.replaceAll('\\', '/')),
);
const untracked = repoRelativeSources.filter((file) => !tracked.has(file));
if (untracked.length) {
  console.error(`Approved audio deployment files are not tracked by Git:\n${untracked.join('\n')}`);
  console.error('GitHub Pages builds from a clean checkout, so these files would be absent from deployment.');
  process.exit(1);
}

const distMissing = [];
const distEmpty = [];
for (const assetPath of requiredAssetPaths) {
  const file = path.join(frontendRoot, 'dist', assetPath);
  try {
    await access(file);
    if ((await stat(file)).size <= 0) distEmpty.push(path.relative(frontendRoot, file));
  } catch {
    distMissing.push(path.relative(frontendRoot, file));
  }
}
if (distMissing.length || distEmpty.length) {
  if (distMissing.length) console.error(`Missing deployed audio:\n${distMissing.join('\n')}`);
  if (distEmpty.length) console.error(`Empty deployed audio:\n${distEmpty.join('\n')}`);
  process.exit(1);
}

console.log(
  `Approved audio deployment verification passed: ${narrationAssetPaths.length} narration clips and ${requiredRuntimeAssetPaths.length} music/SFX assets.`,
);
