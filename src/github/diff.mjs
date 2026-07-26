import { listRulesets, getRuleset } from './rulesets.mjs';
import { getCodeowners, renderCodeowners } from './codeowners.mjs';
import { logger } from '../utils/logger.mjs';

export async function computeCurrentState(repo) {
  const remote = await listRulesets(repo);
  const rulesets = [];
  for (const r of remote) {
    const full = await getRuleset(repo, r.id);
    rulesets.push(full);
  }
  const codeowners = await getCodeowners(repo);
  return { rulesets, codeowners };
}

export function computeDiff(manifest, current, { prune }) {
  const desired = manifest.ruleset;
  const existing = current.rulesets.find((r) => r.name === desired.name);
  const owners = renderCodeowners(manifest.codeowners);
  const codeownersChange = current.codeowners === owners ? null : owners;

  const operations = [];
  if (!existing) {
    operations.push({ op: 'create_ruleset', repo: manifest.repo, payload: desired });
  } else if (JSON.stringify(existing) !== JSON.stringify(desired)) {
    operations.push({
      op: 'update_ruleset',
      repo: manifest.repo,
      id: existing.id,
      payload: desired,
    });
  }
  if (codeownersChange !== null) {
    operations.push({ op: 'write_codeowners', repo: manifest.repo, content: codeownersChange });
  }
  if (prune) {
    for (const r of current.rulesets) {
      if (r.name !== desired.name) {
        operations.push({ op: 'delete_ruleset', repo: manifest.repo, id: r.id });
      }
    }
  }
  logger.debug({ repo: manifest.repo, operations: operations.length }, 'Diff computed');
  return operations;
}
