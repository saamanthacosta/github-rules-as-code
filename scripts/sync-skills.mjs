#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const PARENT_SKILL = join(REPO_ROOT, '..', '.agents', 'skills', 'apply-github-ruleset', 'SKILL.md');
const LOCAL_DIR = join(REPO_ROOT, '.agents', 'skills', 'apply-github-ruleset');
const LOCAL_SKILL = join(LOCAL_DIR, 'SKILL.md');

async function main() {
  let source;
  try {
    source = await readFile(PARENT_SKILL, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(
        `parent skill not found at ${PARENT_SKILL}.\n` +
          'Clone Personal/ as a sibling of github-rules-as-code or run this script from inside the workspace.',
      );
      process.exit(1);
    }
    throw err;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_SKILL, source, 'utf8');
  console.log(`synced ${PARENT_SKILL} -> ${LOCAL_SKILL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
