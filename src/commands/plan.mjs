import { loadConfig } from '../config/loader.mjs';
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
  for (const manifest of targets) {
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
  logger.info({ total, repos: targets.length }, 'Plan complete');
}
