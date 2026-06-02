#!/usr/bin/env node
/**
 * normalize-collision.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans the Legendary Horizon runtime JSON map for unnamed collision objects
 * on `lh_collision` layers and assigns stable names + canonical properties.
 *
 * SAFE TO RERUN — already-named objects are never touched.
 *
 * Usage
 * ─────
 *   node tools/normalize-collision.mjs [--dry-run]
 *
 * Flags
 * ─────
 *   --dry-run   Report what would change without writing the file.
 *   --help      Show this message.
 *
 * Workflow (after drawing rectangles in Tiled)
 * ─────────────────────────────────────────────
 *   1. Draw collision rectangles on an lh_collision layer in Tiled.
 *      - You do NOT need to assign names; the script does that.
 *      - You MAY set lh_collision_kind manually in Tiled to override the default.
 *   2. Save the .tmx file.
 *   3. Export Map → Save As → Legendary_Horizon_Map.json
 *      (File → Export As, or use the existing export preset).
 *   4. Run this script:
 *         cd Codex && node tools/normalize-collision.mjs
 *   5. Review the report printed to stdout.
 *   6. Test collision in-game (dev server: cd frontend && npm run dev).
 *
 * What the script changes
 * ────────────────────────
 *   • Objects with an empty/missing name on lh_collision layers get:
 *       name  ← "collision_{safeLayerName}_{id}"
 *       properties (merged, never overwritten if already present):
 *         lh_kind           = "collision"
 *         lh_collision_kind = "building"   ← DEFAULT; override in Tiled
 *   • All other objects, layers, and tiles are left untouched.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Config ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP_JSON_PATH = resolve(
  __dirname,
  '../frontend/public/assets/maps/Legendary_Horizon_Map.json',
);

const COLLISION_LAYER_NAME_PATTERN = /lh_collision/i;
const DEFAULT_LH_KIND              = 'collision';
const DEFAULT_LH_COLLISION_KIND    = 'building';

// ── CLI ───────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const SHOW_HELP = args.includes('--help') || args.includes('-h');

if (SHOW_HELP) {
  console.log(`
normalize-collision.mjs — assign stable names + properties to unnamed collision objects.

  node tools/normalize-collision.mjs [--dry-run] [--help]

  --dry-run  Print changes without writing the file.
  --help     Show this message.
`.trim());
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Get a Tiled property value by name from an object's `properties` array.
 * Returns undefined when not found.
 */
function getProp(obj, name) {
  const props = obj?.properties;
  if (!Array.isArray(props)) return undefined;
  const p = props.find((p) => p.name === name);
  return p?.value;
}

/**
 * Set a property on a Tiled object (creates the properties array if absent,
 * adds the property if not present, and leaves it untouched if already present).
 * Returns the (possibly mutated) object.
 */
function ensureProp(obj, name, value, type = 'string') {
  if (!Array.isArray(obj.properties)) obj.properties = [];
  const existing = obj.properties.find((p) => p.name === name);
  if (!existing) {
    obj.properties.push({ name, type, value });
    return true; // was added
  }
  return false; // already present
}

// ── Load JSON ─────────────────────────────────────────────────────────────

let raw;
try {
  raw = readFileSync(MAP_JSON_PATH, 'utf-8');
} catch (err) {
  console.error(`[normalize-collision] ERROR: cannot read map JSON at:\n  ${MAP_JSON_PATH}\n${err.message}`);
  process.exit(1);
}

let map;
try {
  map = JSON.parse(raw);
} catch (err) {
  console.error(`[normalize-collision] ERROR: invalid JSON in map file.\n${err.message}`);
  process.exit(1);
}

// ── Walk layers ───────────────────────────────────────────────────────────

const report = {
  collisionLayersFound:  [],
  objectsInspected:      0,
  alreadyNamed:          0,
  normalized:            [],
  skipped_not_rect:      [],
};

function walkLayers(layers) {
  if (!Array.isArray(layers)) return;
  for (const layer of layers) {
    // Recurse into group layers
    if (layer.type === 'group' && Array.isArray(layer.layers)) {
      walkLayers(layer.layers);
      continue;
    }

    if (layer.type !== 'objectgroup') continue;

    const isCollisionLayer = COLLISION_LAYER_NAME_PATTERN.test(layer.name ?? '');
    if (!isCollisionLayer) continue;

    report.collisionLayersFound.push(layer.name);
    const safeLayerName = slugify(layer.name);

    for (const obj of layer.objects ?? []) {
      // Only touch plain rectangles (no ellipse, point, polygon, polyline, text, tile)
      const isRect =
        !obj.ellipse &&
        !obj.point &&
        !obj.polygon &&
        !obj.polyline &&
        !obj.text &&
        !obj.gid; // gid = tile object

      report.objectsInspected++;

      if (!isRect) {
        report.skipped_not_rect.push({ id: obj.id, name: obj.name, reason: 'non-rectangle shape' });
        continue;
      }

      const hasName = typeof obj.name === 'string' && obj.name.trim().length > 0;

      if (hasName) {
        report.alreadyNamed++;
        // Still ensure canonical properties even on already-named objects
        ensureProp(obj, 'lh_kind', DEFAULT_LH_KIND);
        ensureProp(obj, 'lh_collision_kind', DEFAULT_LH_COLLISION_KIND);
        continue;
      }

      // Assign stable name
      const newName = `collision_${safeLayerName}_${obj.id}`;
      obj.name = newName;

      const addedKind      = ensureProp(obj, 'lh_kind', DEFAULT_LH_KIND);
      const addedColKind   = ensureProp(obj, 'lh_collision_kind', DEFAULT_LH_COLLISION_KIND);

      report.normalized.push({
        id:          obj.id,
        newName,
        layer:       layer.name,
        x:           Math.round(obj.x),
        y:           Math.round(obj.y),
        w:           Math.round(obj.width),
        h:           Math.round(obj.height),
        addedProps:  [
          addedKind    && 'lh_kind',
          addedColKind && 'lh_collision_kind',
        ].filter(Boolean),
      });
    }
  }
}

walkLayers(map.layers);

// ── Report ────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         LH Collision Normalizer — run report                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`Map file:          ${MAP_JSON_PATH}`);
console.log(`Dry run:           ${DRY_RUN}`);
console.log(`Collision layers:  ${report.collisionLayersFound.join(', ') || '(none found)'}`);
console.log(`Objects inspected: ${report.objectsInspected}`);
console.log(`Already named:     ${report.alreadyNamed}  (left untouched)`);
console.log(`Normalized:        ${report.normalized.length}`);

if (report.normalized.length > 0) {
  console.log('\nNormalized objects:');
  for (const r of report.normalized) {
    console.log(
      `  [${String(r.id).padEnd(6)}] ${r.newName.padEnd(48)}` +
      ` layer="${r.layer}" x=${r.x} y=${r.y} w=${r.w} h=${r.h}` +
      (r.addedProps.length ? `  +props: ${r.addedProps.join(', ')}` : ''),
    );
  }
}

if (report.skipped_not_rect.length > 0) {
  console.log('\nSkipped (non-rectangle shapes on collision layers):');
  for (const s of report.skipped_not_rect) {
    console.log(`  id=${s.id} name="${s.name}" — ${s.reason}`);
  }
}

// ── Write ─────────────────────────────────────────────────────────────────

if (report.normalized.length === 0) {
  console.log('\n✓ Nothing to normalize — all collision objects are already named.\n');
  process.exit(0);
}

if (DRY_RUN) {
  console.log('\n⚠ DRY RUN — no file was written. Remove --dry-run to apply changes.\n');
  process.exit(0);
}

const output = JSON.stringify(map, null, 2);
writeFileSync(MAP_JSON_PATH, output, 'utf-8');
console.log(`\n✓ Wrote ${report.normalized.length} normalized object(s) to:\n  ${MAP_JSON_PATH}\n`);
