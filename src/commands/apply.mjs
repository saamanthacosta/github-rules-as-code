import { loadConfig } from '../config/loader.mjs';
import {
  assertRepoExists,
  createRuleset,
  updateRuleset,
  deleteRuleset,
} from '../github/rulesets.mjs';
import { putCodeowners } from '../github/codeowners.mjs';
import { computeCurrentState, computeDiff } from '../github/diff.mjs';
import { logger } from '../utils/logger.mjs';

export async function applyCommand(opts) {
  const { manifests } = await loadConfig();
  const targets = opts.repo ? manifests.filter((m) => m.repo === opts.repo) : manifests;
  if (targets.length === 0) {
    logger.warn({ repo: opts.repo }, 'No manifests matched');
    return;
  }

  let applied = 0;
  let skipped = 0;
  for (const manifest of targets) {
    if (!(await isAvailable(manifest.repo))) {
      skipped += 1;
      continue;
    }
    logger.info({ repo: manifest.repo }, 'Applying');
    const current = await computeCurrentState(manifest.repo);
    const ops = computeDiff(manifest, current, { prune: opts.prune });
    if (ops.length === 0) {
      logger.info({ repo: manifest.repo }, 'No changes');
      continue;
    }
    for (const op of ops) {
      switch (op.op) {
        case 'create_ruleset':
          await createRuleset(op.repo, op.payload);
          break;
        case 'update_ruleset':
          await updateRuleset(op.repo, op.id, op.payload);
          break;
        case 'delete_ruleset':
          await deleteRuleset(op.repo, op.id);
          break;
        case 'write_codeowners':
          await putCodeowners(op.repo, op.content);
          break;
        default:
          throw new Error(`unknown operation ${op.op}`);
      }
      logger.info({ repo: manifest.repo, op: op.op }, 'Applied');
      applied += 1;
    }
  }
  logger.info({ applied, skipped, repos: targets.length }, 'Apply complete');
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
