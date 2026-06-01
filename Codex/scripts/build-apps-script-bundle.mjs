#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const codexRoot = resolve(scriptDir, '..');
const outputRelativePath = 'apps-script/lh_backend_bundle.gs';
const outputPath = resolve(codexRoot, outputRelativePath);
const command = 'node Codex/scripts/build-apps-script-bundle.mjs';

const sourceFileOrder = [
  'apps-script/config/LhSheetSchema.js',
  'apps-script/utils/LhSheetIO.js',
  'apps-script/services/SaveService.js',
  'apps-script/services/RosterService.js',
  'apps-script/services/QuestService.js',
  'apps-script/services/SessionService.js',
  'apps-script/services/AssetService.js',
  'apps-script/services/ExitTicketService.js',
  'apps-script/services/LookupService.js',
  'apps-script/services/TeacherOverrideService.js',
  'apps-script/services/InterviewService.js',
  'apps-script/utils/Config.js',
  'apps-script/LhWebApp.js',
];

const requiredStrings = [
  'list_roster',
  'listroster',
  'list_player_summaries',
  'listplayersummaries',
  'teacher_unlock_quest',
  'teacher_restore_backup',
  'teacher_restore_item',
  'teacher_reset_act',
  'list_campfire_reflections',
  'grade_campfire',
  'campfire',
  'rested_readiness',
];

function readSource(relativePath) {
  const absolutePath = resolve(codexRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing Apps Script source file: ${relativePath}`);
  }

  return readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '').trimEnd();
}

function buildHeader() {
  const sourceLines = sourceFileOrder.map((relativePath, index) => ` * ${index + 1}. Codex/${relativePath}`);

  return [
    '/**',
    ' * GENERATED FILE - DO NOT EDIT MANUALLY.',
    ` * Created by: ${command}`,
    ' *',
    ' * Source file order:',
    ...sourceLines,
    ' */',
  ].join('\n');
}

function buildBundle() {
  const sections = sourceFileOrder.map((relativePath) => {
    const body = readSource(relativePath);
    return [`// ---- BEGIN Codex/${relativePath} ----`, body, `// ---- END Codex/${relativePath} ----`].join('\n');
  });

  return [buildHeader(), ...sections, ''].join('\n\n');
}

function verifyBundle(bundle) {
  const missing = requiredStrings.filter((needle) => !bundle.includes(needle));
  if (missing.length > 0) {
    throw new Error(`Generated Apps Script bundle is missing required strings: ${missing.join(', ')}`);
  }
}

try {
  const bundle = buildBundle();
  verifyBundle(bundle);
  writeFileSync(outputPath, bundle, 'utf8');
  console.log(`Wrote Codex/${outputRelativePath}`);
  console.log(`Bundled ${sourceFileOrder.length} source files.`);
  console.log(`Verified required strings: ${requiredStrings.join(', ')}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
