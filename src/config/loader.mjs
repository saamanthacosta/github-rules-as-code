import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { defaultRulesetSchema, manifestSchema } from './schema.mjs';
import { logger } from '../utils/logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

async function readJson(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function loadDefaults() {
  const dir = join(REPO_ROOT, 'rules', 'defaults');
  const files = (await readdir(dir)).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.schema.json'),
  );
  const defaults = {};
  for (const file of files) {
    const parsed = defaultRulesetSchema.parse(await readJson(join(dir, file)));
    defaults[parsed.name] = parsed;
  }
  return defaults;
}

async function loadManifests() {
  const dir = join(REPO_ROOT, 'rules', 'manifests');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const manifests = [];
  for (const file of files) {
    const parsed = manifestSchema.parse(await readJson(join(dir, file)));
    manifests.push(parsed);
  }
  return manifests;
}

function deepMerge(base, overrides) {
  if (overrides === undefined) return base;
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return overrides;
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return out;
}

export async function loadConfig() {
  const defaults = await loadDefaults();
  const manifests = await loadManifests();
  const enriched = manifests.map((m) => {
    const base = defaults[m.default];
    if (!base) {
      throw new Error(`manifest ${m.repo} references unknown default "${m.default}"`);
    }
    const ruleset = m.overrides ? deepMerge(base, m.overrides) : base;
    return { ...m, ruleset };
  });
  logger.debug({ count: enriched.length }, 'Loaded manifests');
  return { defaults, manifests: enriched };
}
