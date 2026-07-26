import { loadConfig } from '../config/loader.mjs';
import { assertRepoExists } from '../github/rulesets.mjs';
import { computeCurrentState, computeDiff } from '../github/diff.mjs';
import { logger } from '../utils/logger.mjs';

export async function planCommand(opts) {
  const { manifests } = await loadConfig();
  const targets = opts.repo ? manifests.filter((m) => m.repo === opts.repo) : manifests;
  if (targets.length === 0) {
    logger.warn({ repo: opts.repo }, 'No manifests matched');
    return;
  }

  let total = 0;
  let skipped = 0;
  for (const manifest of targets) {
    if (!(await isAvailable(manifest.repo))) {
      skipped += 1;
      continue;
    }
    logger.info({ repo: manifest.repo }, 'Planning');
    const current = await computeCurrentState(manifest.repo);
    const ops = computeDiff(manifest, current, { prune: opts.prune });
    if (ops.length === 0) {
      logger.info({ repo: manifest.repo }, 'No changes');
      continue;
    }
    for (const op of ops) {
      logger.info({ repo: manifest.repo, op: op.op }, 'Planned operation');
    }
    total += ops.length;
  }
  logger.info({ total, skipped, repos: targets.length }, 'Plan complete');
}

async function isAvailable(repo) {
  try {
    await assertRepoExists(repo);
    return true;
  } catch (err) {
    if (err.code === 'REPO_NOT_FOUND') {
      logger.warn(
        { repo },
        'Repository not found; skipping. Create the repo or remove the manifest to clear this warning.',
      );
      return false;
    }
    throw err;
  }
}
